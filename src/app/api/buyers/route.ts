import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { buyerSchema } from "../../../../lib/validators/buyer";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ validate input
    const parsed = buyerSchema.parse(body);

    // ✅ insert into Prisma safely (match optional/nullable types)
    const buyer = await prisma.buyer.create({
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
        status: parsed.status ?? "New",
        notes: parsed.notes ?? null,
        tags: parsed.tags ?? [],
        ownerId: "user-id-123", // replace with real logged-in user
      },
    });

    return NextResponse.json(buyer, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
