import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { buyerSchema } from "../../../../../lib/validators/buyer";
import { withRateLimit, rateLimiters } from "@/lib/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: buyerId } = await params;

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
  } catch (err: unknown) {
    console.error("Error in GET /api/buyers/[id]:", err);
    
    // Handle specific Prisma errors
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error", 
      message: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : 'Unknown error') : undefined 
    }, { status: 500 });
  }
}

async function updateBuyer(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: buyerId } = await params;
    const body = await req.json();

    if (!buyerId) {
      return NextResponse.json({ error: "Buyer ID is required" }, { status: 400 });
    }

    // Validate input
    const parsed = buyerSchema.parse(body);

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
        fullName: parsed.fullName,
        email: parsed.email ?? null,
        phone: parsed.phone,
        city: parsed.city,
        propertyType: parsed.propertyType,
        bhk: parsed.bhk ?? null,
        purpose: parsed.purpose,
        budgetMin: parsed.budgetMin ?? null,
        budgetMax: parsed.budgetMax ?? null,
        timeline: parsed.timeline,
        source: parsed.source,
        status: parsed.status ?? currentBuyer.status,
        notes: parsed.notes ?? null,
        tags: parsed.tags ?? [],
      }
    });

    // Calculate field-level changes
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    const fieldsToTrack = [
      'fullName', 'email', 'phone', 'city', 'propertyType', 'bhk', 
      'purpose', 'budgetMin', 'budgetMax', 'timeline', 'source', 
      'status', 'notes', 'tags'
    ];

    fieldsToTrack.forEach(field => {
      const oldValue = currentBuyer[field as keyof typeof currentBuyer];
      const newValue = updatedBuyer[field as keyof typeof updatedBuyer];
      
      // Only track if value actually changed
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[field] = {
          old: oldValue,
          new: newValue
        };
      }
    });

    // Only create history entry if there are actual changes
    if (Object.keys(changes).length > 0) {
      await prisma.buyerHistory.create({
        data: {
          buyerId: buyerId,
          changedBy: "user-id-123", // replace with real logged-in user
          diff: JSON.parse(JSON.stringify({
            action: "UPDATED",
            changes: changes,
            timestamp: new Date().toISOString(),
          })),
        },
      });
    }

    return NextResponse.json(updatedBuyer);
  } catch (err: unknown) {
    console.error("Error in PUT /api/buyers/[id]:", err);
    
    if (err && typeof err === 'object' && 'name' in err && err.name === 'ZodError') {
      return NextResponse.json({ error: "Validation error", details: 'errors' in err ? err.errors : undefined }, { status: 400 });
    }
    
    // Handle specific Prisma errors
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error", 
      message: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : 'Unknown error') : undefined 
    }, { status: 500 });
  }
}

// Apply rate limiting to buyer updates (50 per hour)
export const PUT = withRateLimit(rateLimiters.buyerUpdate)(async (req: Request, ...args: unknown[]) => {
  const params = args[0] as { params: Promise<{ id: string }> };
  return updateBuyer(req, params);
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: buyerId } = await params;

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
  } catch (err: unknown) {
    console.error("Error in DELETE /api/buyers/[id]:", err);
    
    // Handle specific Prisma errors
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error", 
      message: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : 'Unknown error') : undefined 
    }, { status: 500 });
  }
}
