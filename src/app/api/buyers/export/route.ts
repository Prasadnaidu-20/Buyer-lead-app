import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract and validate filter parameters (same as main API)
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

    // Build filters (same logic as main API)
    const filters: Record<string, string> = {};
    
    // Apply enum filters
    if (city) filters.city = city;
    if (propertyType) filters.propertyType = propertyType;
    if (status) filters.status = status;
    if (timeline) filters.timeline = timeline;

    // Handle search (same logic as main API)
    let buyers: unknown[];

    if (search) {
      // Use raw SQL for search since SQLite has limited string operations in Prisma
      const searchTerm = `%${search}%`;
      
      // Build WHERE conditions
      const conditions: string[] = [];
      const params: string[] = [];
      
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
      
      // Get all buyers matching filters (no pagination for export)
      const buyersQuery = `
        SELECT 
          id, fullName, email, phone, city, propertyType, bhk, purpose, 
          budgetMin, budgetMax, timeline, source, status, notes, tags, updatedAt
        FROM Buyer 
        ${whereClause}
        ORDER BY updatedAt DESC
      `;
      buyers = await prisma.$queryRawUnsafe(buyersQuery, ...params) as unknown[];
    } else {
      // No search, use regular Prisma query
      buyers = await prisma.buyer.findMany({
        where: filters,
        orderBy: { updatedAt: "desc" },
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
      });
    }

    // Generate CSV content
    const headers = [
      'fullName', 'email', 'phone', 'city', 'propertyType', 'bhk', 'purpose',
      'budgetMin', 'budgetMax', 'timeline', 'source', 'notes', 'tags', 'status'
    ];

    // Create CSV rows
    const csvRows = (buyers as Array<{
      fullName: string;
      email: string | null;
      phone: string;
      city: string;
      propertyType: string;
      bhk: string | null;
      purpose: string;
      budgetMin: number | null;
      budgetMax: number | null;
      timeline: string;
      source: string;
      status: string;
      notes: string | null;
      tags: string[];
    }>).map((buyer) => {
      return [
        escapeCSVField(buyer.fullName || ''),
        escapeCSVField(buyer.email || ''),
        escapeCSVField(buyer.phone || ''),
        escapeCSVField(buyer.city || ''),
        escapeCSVField(buyer.propertyType || ''),
        escapeCSVField(buyer.bhk || ''),
        escapeCSVField(buyer.purpose || ''),
        buyer.budgetMin || '',
        buyer.budgetMax || '',
        escapeCSVField(buyer.timeline || ''),
        escapeCSVField(buyer.source || ''),
        escapeCSVField(buyer.notes || ''),
        escapeCSVField(Array.isArray(buyer.tags) ? buyer.tags.join(', ') : ''),
        escapeCSVField(buyer.status || '')
      ];
    });

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Generate filename with timestamp and filters
    const timestamp = new Date().toISOString().split('T')[0];
    const filterParts = [];
    if (search) filterParts.push(`search-${search}`);
    if (city) filterParts.push(`city-${city}`);
    if (propertyType) filterParts.push(`type-${propertyType}`);
    if (status) filterParts.push(`status-${status}`);
    if (timeline) filterParts.push(`timeline-${timeline}`);
    
    const filterSuffix = filterParts.length > 0 ? `-${filterParts.join('-')}` : '';
    const filename = `buyers-export-${timestamp}${filterSuffix}.csv`;

    // Return CSV file
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (err: unknown) {
    console.error("Error in CSV export:", err);
    return NextResponse.json({ 
      error: "Internal server error", 
      message: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : 'Unknown error') : undefined 
    }, { status: 500 });
  }
}

// Helper function to escape CSV fields
function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

