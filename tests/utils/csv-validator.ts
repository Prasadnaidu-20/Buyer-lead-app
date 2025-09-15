import { z } from "zod";

// CSV Row interface
export interface CSVRow {
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

// CSV Row validation result
export interface CSVValidationResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Budget validation result
export interface BudgetValidationResult {
  isValid: boolean;
  error?: string;
  formattedBudget?: string;
}

// Simple schema for testing (without Prisma dependency)
const testBuyerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().nullable().optional(),
  phone: z.string().regex(/^\d{10,15}$/),
  city: z.enum(['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other']),
  propertyType: z.enum(['Apartment', 'Villa', 'Plot', 'Office', 'Retail']),
  bhk: z.enum(['ONE', 'TWO', 'THREE', 'FOUR', 'STUDIO']).nullable().optional(),
  purpose: z.enum(['Buy', 'Rent']),
  budgetMin: z.number().int().nullable().optional(),
  budgetMax: z.number().int().nullable().optional(),
  timeline: z.enum(['ZERO_TO_3M', 'THREE_TO_6M', 'GT_6M', 'EXPLORING']),
  source: z.enum(['Website', 'Referral', 'WALK_IN', 'Call', 'Other']),
  status: z.enum(['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped']).optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  // budgetMax >= budgetMin
  if (data.budgetMin != null && data.budgetMax != null && data.budgetMax < data.budgetMin) {
    ctx.addIssue({
      code: "custom",
      path: ["budgetMax"],
      message: "BudgetMax must be >= BudgetMin",
    });
  }
});

/**
 * Validates and transforms a CSV row into a buyer object
 * @param row - The CSV row data
 * @returns Validation result with success status and data or error
 */
export function transformCSVRow(row: CSVRow): CSVValidationResult {
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

    // Validate budget values if provided
    if (row.budgetMin && row.budgetMin.trim() !== '') {
      const budgetMinNum = parseInt(row.budgetMin);
      if (isNaN(budgetMinNum) || budgetMinNum < 0) {
        return { success: false, error: 'budgetMin must be a valid positive number' };
      }
    }
    
    if (row.budgetMax && row.budgetMax.trim() !== '') {
      const budgetMaxNum = parseInt(row.budgetMax);
      if (isNaN(budgetMaxNum) || budgetMaxNum < 0) {
        return { success: false, error: 'budgetMax must be a valid positive number' };
      }
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

    // Handle optional fields that might be empty strings
    if (transformedData.email === '') transformedData.email = null;
    if (transformedData.bhk === '') transformedData.bhk = null;
    if (transformedData.notes === '') transformedData.notes = null;

    // Validate using our schema
    const validatedData = testBuyerSchema.parse(transformedData);
    
    return { success: true, data: validatedData };
  } catch (err: any) {
    if (err instanceof z.ZodError && err.errors && err.errors.length > 0) {
      const firstError = err.errors[0];
      return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { success: false, error: err instanceof Error ? err.message : 'Validation failed' };
  }
}

/**
 * Validates budget range (min and max values)
 * @param budgetMin - Minimum budget value
 * @param budgetMax - Maximum budget value
 * @returns Validation result with formatted budget string
 */
export function validateBudget(budgetMin: number | null, budgetMax: number | null): BudgetValidationResult {
  try {
    // Both null is valid (not specified)
    if (!budgetMin && !budgetMax) {
      return {
        isValid: true,
        formattedBudget: "Not specified"
      };
    }

    // Validate individual values
    if (budgetMin !== null && (budgetMin < 0 || !Number.isInteger(budgetMin))) {
      return {
        isValid: false,
        error: "Budget minimum must be a positive integer"
      };
    }

    if (budgetMax !== null && (budgetMax < 0 || !Number.isInteger(budgetMax))) {
      return {
        isValid: false,
        error: "Budget maximum must be a positive integer"
      };
    }

    // Validate range
    if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
      return {
        isValid: false,
        error: "Budget minimum cannot be greater than maximum"
      };
    }

    // Format budget string
    let formattedBudget = "";
    if (!budgetMin && budgetMax) {
      formattedBudget = `Up to ₹${(budgetMax / 100000).toFixed(1)}L`;
    } else if (budgetMin && !budgetMax) {
      formattedBudget = `From ₹${(budgetMin / 100000).toFixed(1)}L`;
    } else if (budgetMin && budgetMax) {
      formattedBudget = `₹${(budgetMin / 100000).toFixed(1)}L - ₹${(budgetMax / 100000).toFixed(1)}L`;
    }

    return {
      isValid: true,
      formattedBudget
    };
  } catch (err) {
    return {
      isValid: false,
      error: err instanceof Error ? err.message : "Budget validation failed"
    };
  }
}
