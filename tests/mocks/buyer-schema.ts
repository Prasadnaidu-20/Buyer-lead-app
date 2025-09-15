import { z } from "zod";

// Mock enums for testing (without Prisma dependency)
export const City = {
  Chandigarh: "Chandigarh",
  Mohali: "Mohali", 
  Zirakpur: "Zirakpur",
  Panchkula: "Panchkula",
  Other: "Other"
} as const;

export const PropertyType = {
  Apartment: "Apartment",
  Villa: "Villa",
  Plot: "Plot", 
  Office: "Office",
  Retail: "Retail"
} as const;

export const BHK = {
  ONE: "ONE",
  TWO: "TWO",
  THREE: "THREE", 
  FOUR: "FOUR",
  STUDIO: "STUDIO"
} as const;

export const Purpose = {
  Buy: "Buy",
  Rent: "Rent"
} as const;

export const Timeline = {
  ZERO_TO_3M: "ZERO_TO_3M",
  THREE_TO_6M: "THREE_TO_6M",
  GT_6M: "GT_6M",
  EXPLORING: "EXPLORING"
} as const;

export const Source = {
  Website: "Website",
  Referral: "Referral",
  WALK_IN: "WALK_IN",
  Call: "Call",
  Other: "Other"
} as const;

export const Status = {
  New: "New",
  Qualified: "Qualified",
  Contacted: "Contacted",
  Visited: "Visited",
  Negotiation: "Negotiation",
  Converted: "Converted",
  Dropped: "Dropped"
} as const;

export const buyerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\d{10,15}$/),
  city: z.nativeEnum(City),
  propertyType: z.nativeEnum(PropertyType),
  bhk: z.nativeEnum(BHK).optional(),
  purpose: z.nativeEnum(Purpose),
  budgetMin: z.number().int().optional(),
  budgetMax: z.number().int().optional(),
  timeline: z.nativeEnum(Timeline),
  source: z.nativeEnum(Source),
  status: z.nativeEnum(Status).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  // BHK required for Apartment/Villa
  if ((data.propertyType === PropertyType.Apartment || data.propertyType === PropertyType.Villa) && !data.bhk) {
    ctx.addIssue({
      code: "custom",
      path: ["bhk"],
      message: "BHK is required for Apartment/Villa",
    });
  }

  // budgetMax >= budgetMin
  if (data.budgetMin != null && data.budgetMax != null && data.budgetMax < data.budgetMin) {
    ctx.addIssue({
      code: "custom",
      path: ["budgetMax"],
      message: "BudgetMax must be >= BudgetMin",
    });
  }
});
