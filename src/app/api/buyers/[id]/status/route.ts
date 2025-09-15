import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const buyerId = params.id;
    const body = await req.json();
    const { status } = body;

    if (!buyerId) {
      return NextResponse.json({ error: "Buyer ID is required" }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Validate status enum
    const validStatuses = ["New", "Qualified", "Contacted", "Visited", "Negotiation", "Converted", "Dropped"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Get current buyer data for history
    const currentBuyer = await prisma.buyer.findUnique({
      where: { id: buyerId }
    });

    if (!currentBuyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Update buyer status
    const updatedBuyer = await prisma.buyer.update({
      where: { id: buyerId },
      data: { status }
    });

    // Create history entry for status change
    await prisma.buyerHistory.create({
      data: {
        buyerId: buyerId,
        changedBy: "user-id-123", // replace with real logged-in user
        diff: {
          action: "STATUS_UPDATED",
          changes: {
            status: {
              old: currentBuyer.status,
              new: status
            }
          },
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updatedBuyer);
  } catch (err: any) {
    console.error("Error in PATCH /api/buyers/[id]/status:", err);
    
    // Handle specific Prisma errors
    if (err.code === 'P2025') {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error", 
      message: process.env.NODE_ENV === 'development' ? err.message : undefined 
    }, { status: 500 });
  }
}
