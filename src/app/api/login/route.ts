import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST() {
  try {
    // Check if demo user exists
    let user = await prisma.user.findUnique({
      where: { email: "demo@example.com" },
    });

    // If not, create demo user
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "demo@example.com",
          name: "Demo User",
        },
      });
    }

    // Return user info
    return NextResponse.json({ user }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
