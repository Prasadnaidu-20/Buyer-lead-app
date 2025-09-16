import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { buyerSchema } from "../../../../../lib/validators/buyer";
import { z } from "zod";

interface ImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
  insertedCount: number;
}

interface CSVRow {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  propertyType: string;
  bhk: string;
  purpose: string;
  budgetMin: string;
  budgetMax: string;
  timeline: string;
  source: string;
  notes: string;
  tags: string;
  status: string;
}

async function importCSV(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size too large. Maximum 5MB allowed." }, { status: 400 });
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 });
    }

    // Read and parse CSV
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
    }

    // Check row limit (max 200)
    if (lines.length > 201) { // +1 for header
      return NextResponse.json({ error: "Maximum 200 rows allowed (excluding header)" }, { status: 400 });
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const expectedHeaders = [
      'fullName', 'email', 'phone', 'city', 'propertyType', 'bhk', 'purpose',
      'budgetMin', 'budgetMax', 'timeline', 'source', 'notes', 'tags', 'status'
    ];

    // Validate headers
    const missingHeaders = expectedHeaders.filter(h => !header.includes(h));
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      }, { status: 400 });
    }

    // Parse CSV rows
    const csvRows: CSVRow[] = [];
    const errors: Array<{ row: number; message: string }> = [];
    const validData: unknown[] = [];

    // Process each row (skip header)
    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i];
        if (!line || line.trim() === '') continue;

        const values = parseCSVLine(line);
        
        if (values.length !== expectedHeaders.length) {
          errors.push({
            row: i + 1,
            message: `Expected ${expectedHeaders.length} columns, got ${values.length}. Values: ${values.join(', ')}`
          });
          continue;
        }

        // Create row object with safe access
        const row: CSVRow = {
          fullName: (values[0] || '').toString(),
          email: (values[1] || '').toString(),
          phone: (values[2] || '').toString(),
          city: (values[3] || '').toString(),
          propertyType: (values[4] || '').toString(),
          bhk: (values[5] || '').toString(),
          purpose: (values[6] || '').toString(),
          budgetMin: (values[7] || '').toString(),
          budgetMax: (values[8] || '').toString(),
          timeline: (values[9] || '').toString(),
          source: (values[10] || '').toString(),
          notes: (values[11] || '').toString(),
          tags: (values[12] || '').toString(),
          status: (values[13] || '').toString()
        };

        csvRows.push(row);

        // Validate and transform data
        const transformedData = transformCSVRow(row);
        if (transformedData.success) {
          validData.push(transformedData.data);
        } else {
          errors.push({
            row: i + 1,
            message: transformedData.error || 'Validation failed'
          });
        }

      } catch (err) {
        errors.push({
          row: i + 1,
          message: `Failed to parse row: ${err instanceof Error ? err.message : 'Unknown error'}`
        });
      }
    }

    // If there are errors, return them without inserting
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        totalRows: csvRows.length,
        validRows: validData.length,
        errors,
        insertedCount: 0
      } as ImportResult);
    }

    // Insert valid data in a transaction
    try {
      let insertedCount = 0;
      
      await prisma.$transaction(async (tx) => {
        for (const data of validData) {
          // Parse the data through buyerSchema to ensure proper types
          const parsedData = buyerSchema.parse(data);
          
          const buyer = await tx.buyer.create({
            data: {
              fullName: parsedData.fullName,
              email: parsedData.email,
              phone: parsedData.phone,
              city: parsedData.city,
              propertyType: parsedData.propertyType,
              bhk: parsedData.bhk,
              purpose: parsedData.purpose,
              budgetMin: parsedData.budgetMin,
              budgetMax: parsedData.budgetMax,
              timeline: parsedData.timeline,
              source: parsedData.source,
              status: parsedData.status,
              notes: parsedData.notes,
              tags: parsedData.tags ?? [],
              ownerId: "user-id-123", // replace with real logged-in user
            },
          });

          // Create history entry for imported buyer
          await tx.buyerHistory.create({
            data: {
              buyerId: buyer.id,
              changedBy: "user-id-123", // replace with real logged-in user
              diff: {
                action: "IMPORTED",
                timestamp: new Date().toISOString(),
              },
            },
          });

          insertedCount++;
        }
      });

      return NextResponse.json({
        success: true,
        totalRows: csvRows.length,
        validRows: validData.length,
        errors: [],
        insertedCount
      } as ImportResult);

    } catch (err: unknown) {
      console.error("Transaction failed:", err);
      return NextResponse.json({ 
        error: "Failed to import buyers", 
        message: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : 'Unknown error') : undefined 
      }, { status: 500 });
    }

  } catch (err: unknown) {
    console.error("Error in CSV import:", err);
    return NextResponse.json({ 
      error: "Internal server error", 
      message: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : 'Unknown error') : undefined 
    }, { status: 500 });
  }
}

export const POST = importCSV;

// Helper function to parse CSV line (handles quoted fields)
function parseCSVLine(line: string): string[] {
  if (!line || line.trim() === '') {
    return [];
  }

  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  // Ensure we have the right number of fields, pad with empty strings if needed
  while (result.length < 14) {
    result.push('');
  }
  
  return result;
}

// Helper function to transform and validate CSV row data
function transformCSVRow(row: CSVRow): { success: boolean; data?: unknown; error?: string } {
  try {
    // Validate required fields first
    if (!row.fullName || row.fullName.trim() === '') {
      return { success: false, error: 'fullName is required' };
    }
    if (!row.phone || row.phone.trim() === '') {
      return { success: false, error: 'phone is required' };
    }
    if (!row.city || row.city.trim() === '') {
      return { success: false, error: 'city is required' };
    }
    if (!row.propertyType || row.propertyType.trim() === '') {
      return { success: false, error: 'propertyType is required' };
    }
    if (!row.purpose || row.purpose.trim() === '') {
      return { success: false, error: 'purpose is required' };
    }
    if (!row.timeline || row.timeline.trim() === '') {
      return { success: false, error: 'timeline is required' };
    }
    if (!row.source || row.source.trim() === '') {
      return { success: false, error: 'source is required' };
    }

    // Transform the data to match our schema
    const transformedData = {
      fullName: row.fullName.trim(),
      email: row.email?.trim() || null,
      phone: row.phone.trim(),
      city: row.city.trim(),
      propertyType: row.propertyType.trim(),
      bhk: row.bhk?.trim() || null,
      purpose: row.purpose.trim(),
      budgetMin: row.budgetMin && row.budgetMin.trim() !== '' ? parseInt(row.budgetMin) : null,
      budgetMax: row.budgetMax && row.budgetMax.trim() !== '' ? parseInt(row.budgetMax) : null,
      timeline: row.timeline.trim(),
      source: row.source.trim(),
      status: row.status?.trim() || "New",
      notes: row.notes?.trim() || null,
      tags: row.tags && row.tags.trim() !== '' ? row.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [],
    };

    // Validate using our schema
    const validatedData = buyerSchema.parse(transformedData);
    
    return { success: true, data: validatedData };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const firstError = err.issues?.[0];
      if (firstError) {
        return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
      }
    }
    return { success: false, error: err instanceof Error ? err.message : 'Validation failed' };
  }
}