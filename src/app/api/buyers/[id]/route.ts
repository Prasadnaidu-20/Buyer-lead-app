import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const buyerId = params.id;

    if (!buyerId) {
      return NextResponse.json({ error: "Buyer ID is required" }, { status: 400 });
    }

    // Fetch buyer with their history
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      include: {
        BuyerHistory: {
          orderBy: { changedAt: "desc" },
          take: 10, // Limit to last 10 history entries
        }
      }
    });

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    return NextResponse.json({ buyer });
  } catch (err: any) {
    console.error("Error in GET /api/buyers/[id]:", err);
    
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

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const buyerId = params.id;
    const body = await req.json();

    if (!buyerId) {
      return NextResponse.json({ error: "Buyer ID is required" }, { status: 400 });
    }

    // Get current buyer data for history
    const currentBuyer = await prisma.buyer.findUnique({
      where: { id: buyerId }
    });

    if (!currentBuyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Update buyer
    const updatedBuyer = await prisma.buyer.update({
      where: { id: buyerId },
      data: {
        fullName: body.fullName,
        email: body.email ?? null,
        phone: body.phone,
        city: body.city,
        propertyType: body.propertyType,
        bhk: body.bhk ?? null,
        purpose: body.purpose,
        budgetMin: body.budgetMin ?? null,
        budgetMax: body.budgetMax ?? null,
        timeline: body.timeline,
        source: body.source,
        status: body.status ?? currentBuyer.status,
        notes: body.notes ?? null,
        tags: body.tags ?? [],
      }
    });

    // Create history entry
    await prisma.buyerHistory.create({
      data: {
        buyerId: buyerId,
        changedBy: "user-id-123", // replace with real logged-in user
        diff: {
          action: "UPDATED",
          oldValues: currentBuyer,
          newValues: updatedBuyer,
        },
      },
    });

    return NextResponse.json(updatedBuyer);
  } catch (err: any) {
    console.error("Error in PUT /api/buyers/[id]:", err);
    
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const buyerId = params.id;

    if (!buyerId) {
      return NextResponse.json({ error: "Buyer ID is required" }, { status: 400 });
    }

    // Check if buyer exists
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId }
    });

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Delete buyer (this will also delete related history due to cascade)
    await prisma.buyer.delete({
      where: { id: buyerId }
    });

    return NextResponse.json({ message: "Buyer deleted successfully" });
  } catch (err: any) {
    console.error("Error in DELETE /api/buyers/[id]:", err);
    
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
