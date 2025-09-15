import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { Status } from "@prisma/client";
import { z } from "zod";
import { withRateLimit, rateLimiters } from "@/lib/rate-limit";

async function updateBuyerStatus(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: buyerId } = await params;
    const body = await req.json();

    if (!buyerId) {
      return NextResponse.json({ error: "Buyer ID is required" }, { status: 400 });
    }

    // Validate status input
    const statusSchema = z.object({
      status: z.nativeEnum(Status),
    });
    const parsed = statusSchema.parse(body);
    const newStatus = parsed.status;

    // Get current buyer data for history
    const currentBuyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      select: { status: true } // Only fetch status for diff
    });

    if (!currentBuyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Update buyer status
    const updatedBuyer = await prisma.buyer.update({
      where: { id: buyerId },
      data: { status: newStatus },
    });

    // Create history entry for status change
    if (currentBuyer.status !== updatedBuyer.status) {
      await prisma.buyerHistory.create({
        data: {
          buyerId: buyerId,
          changedBy: "user-id-123", // replace with real logged-in user
          diff: {
            action: "STATUS_UPDATED",
            changes: {
              status: {
                old: currentBuyer.status,
                new: updatedBuyer.status,
              },
            },
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json(updatedBuyer);
  } catch (err: any) {
    console.error("Error in PATCH /api/buyers/[id]/status:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }
    return NextResponse.json({
      error: "Internal server error",
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}

// Apply rate limiting to status updates (50 per hour, same as general updates)
export const PATCH = withRateLimit(rateLimiters.buyerUpdate)(updateBuyerStatus);