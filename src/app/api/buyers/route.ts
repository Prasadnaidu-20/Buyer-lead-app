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

    await prisma.buyerHistory.create({
      data: {
        buyerId: buyer.id,
        changedBy: "user-id-123", // mock user for now
        diff: {
          action: "CREATED",
          newValues: parsed, // store form values for auditing
        },
      },
    });

    return NextResponse.json(buyer, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}



export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 10)));

    // Extract and validate filter parameters
    const city = searchParams.get("city")?.trim() || undefined;
    const propertyType = searchParams.get("propertyType")?.trim() || undefined;
    const status = searchParams.get("status")?.trim() || undefined;
    const timeline = searchParams.get("timeline")?.trim() || undefined;
    const search = searchParams.get("search")?.trim() || "";

    // Validate enum values
    const validCities = ["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"];
    const validPropertyTypes = ["Apartment", "Villa", "Plot", "Office", "Retail"];
    const validStatuses = ["New", "Qualified", "Contacted", "Visited", "Negotiation", "Converted", "Dropped"];
    const validTimelines = ["ZERO_TO_3M", "THREE_TO_6M", "GT_6M", "EXPLORING"];

    if (city && !validCities.includes(city)) {
      return NextResponse.json({ error: "Invalid city value" }, { status: 400 });
    }
    if (propertyType && !validPropertyTypes.includes(propertyType)) {
      return NextResponse.json({ error: "Invalid property type value" }, { status: 400 });
    }
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }
    if (timeline && !validTimelines.includes(timeline)) {
      return NextResponse.json({ error: "Invalid timeline value" }, { status: 400 });
    }

    // Build filters with proper typing
    const filters: any = {};
    
    // Apply enum filters
    if (city) filters.city = city;
    if (propertyType) filters.propertyType = propertyType;
    if (status) filters.status = status;
    if (timeline) filters.timeline = timeline;

    // Execute queries with proper error handling
    let total: number;
    let buyers: any[];

    if (search) {
      // Use raw SQL for search since SQLite has limited string operations in Prisma
      const searchTerm = `%${search}%`;
      
      // Build WHERE conditions
      const conditions: string[] = [];
      const params: any[] = [];
      
      // Add search condition
      conditions.push(`(
        fullName LIKE ? OR 
        phone LIKE ? OR 
        email LIKE ? OR 
        city LIKE ? OR 
        propertyType LIKE ? OR 
        status LIKE ? OR 
        source LIKE ? OR 
        notes LIKE ?
      )`);
      
      // Add search term 8 times (once for each field)
      for (let i = 0; i < 8; i++) {
        params.push(searchTerm);
      }
      
      // Add other filters
      if (city) {
        conditions.push("city = ?");
        params.push(city);
      }
      if (propertyType) {
        conditions.push("propertyType = ?");
        params.push(propertyType);
      }
      if (status) {
        conditions.push("status = ?");
        params.push(status);
      }
      if (timeline) {
        conditions.push("timeline = ?");
        params.push(timeline);
      }
      
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM Buyer ${whereClause}`;
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...params) as any[];
      total = Number(countResult[0].count);
      
      // Get buyers with pagination
      const buyersQuery = `
        SELECT 
          id, fullName, email, phone, city, propertyType, bhk, purpose, 
          budgetMin, budgetMax, timeline, source, status, notes, tags, updatedAt
        FROM Buyer 
        ${whereClause}
        ORDER BY updatedAt DESC
        LIMIT ? OFFSET ?
      `;
      buyers = await prisma.$queryRawUnsafe(buyersQuery, ...params, pageSize, (page - 1) * pageSize) as any[];
    } else {
      // No search, use regular Prisma queries
      const [totalResult, buyersResult] = await Promise.all([
        prisma.buyer.count({ where: filters }),
        prisma.buyer.findMany({
          where: filters,
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            city: true,
            propertyType: true,
            bhk: true,
            purpose: true,
            budgetMin: true,
            budgetMax: true,
            timeline: true,
            source: true,
            status: true,
            notes: true,
            tags: true,
            updatedAt: true,
          }
        })
      ]);
      
      total = totalResult;
      buyers = buyersResult;
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({ 
      buyers, 
      total, 
      page, 
      pageSize,
      totalPages,
      hasNextPage,
      hasPrevPage,
      search: search || null,
      filters: {
        city: city || null,
        propertyType: propertyType || null,
        status: status || null,
        timeline: timeline || null,
      }
    });
  } catch (err: any) {
    console.error("Error in GET /api/buyers:", err);
    
    // Handle specific Prisma errors
    if (err.code === 'P2002') {
      return NextResponse.json({ error: "Database constraint violation" }, { status: 400 });
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error", 
      message: process.env.NODE_ENV === 'development' ? err.message : undefined 
    }, { status: 500 });
  }
}