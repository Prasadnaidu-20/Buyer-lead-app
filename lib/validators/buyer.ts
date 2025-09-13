import { z } from "zod";
import { City, PropertyType, BHK, Purpose, Timeline, Source, Status } from "@prisma/client";

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
      code: "custom",           // ✅ required
      path: ["bhk"],
      message: "BHK is required for Apartment/Villa",
    });
  }

  // budgetMax >= budgetMin
  if (data.budgetMin != null && data.budgetMax != null && data.budgetMax < data.budgetMin) {
    ctx.addIssue({
      code: "custom",           // ✅ required
      path: ["budgetMax"],
      message: "BudgetMax must be >= BudgetMin",
    });
  }
});

