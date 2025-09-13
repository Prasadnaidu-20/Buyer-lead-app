"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ✅ Match enums with Prisma schema
enum City {
  Chandigarh = "Chandigarh",
  Mohali = "Mohali",
  Zirakpur = "Zirakpur",
  Panchkula = "Panchkula",
  Other = "Other",
}

enum PropertyType {
  Apartment = "Apartment",
  Villa = "Villa",
  Plot = "Plot",
  Office = "Office",
  Retail = "Retail",
}

enum BHK {
  ONE = "ONE",
  TWO = "TWO",
  THREE = "THREE",
  FOUR = "FOUR",
  STUDIO = "STUDIO",
}

enum Purpose {
  Buy = "Buy",
  Rent = "Rent",
}

enum Timeline {
  ZERO_TO_3M = "ZERO_TO_3M",
  THREE_TO_6M = "THREE_TO_6M",
  GT_6M = "GT_6M",
  EXPLORING = "EXPLORING",
}

enum Source {
  Website = "Website",
  Referral = "Referral",
  Walk_in = "Walk_in",
  Call = "Call",
  Other = "Other",
}

// ✅ Zod schema with validation
const buyerSchema = z
  .object({
    fullName: z.string().min(2).max(80),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().regex(/^\d{10,15}$/, "Phone must be 10–15 digits"),
    city: z.nativeEnum(City),
    propertyType: z.nativeEnum(PropertyType),
    bhk: z.nativeEnum(BHK).optional(),
    purpose: z.nativeEnum(Purpose),
    budgetMin: z.number().optional(),
    budgetMax: z.number().optional(),
    timeline: z.nativeEnum(Timeline),
    source: z.nativeEnum(Source),
    notes: z.string().max(1000).optional(),
    tags: z.string().optional(), // typed as comma string in form
  })
  .superRefine((data, ctx) => {
    // bhk required for Apartment/Villa
    if (
      ["Apartment", "Villa"].includes(data.propertyType) &&
      !data.bhk
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["bhk"],
        message: "BHK is required for Apartment/Villa",
      });
    }
    // budgetMax >= budgetMin
    if (
      data.budgetMin != null &&
      data.budgetMax != null &&
      data.budgetMax < data.budgetMin
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["budgetMax"],
        message: "BudgetMax must be >= BudgetMin",
      });
    }
  });

type BuyerFormData = z.infer<typeof buyerSchema>;

export default function CreateBuyerPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BuyerFormData>({
    resolver: zodResolver(buyerSchema),
  });

  const [message, setMessage] = useState("");

  const onSubmit = async (data: BuyerFormData) => {
    setMessage("");

    try {
      // ✅ Convert tags from comma string → array
      const tagsArray =
        data.tags
          ?.split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0) || [];

      const res = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          email: data.email || null,
          bhk: data.bhk || null,
          budgetMin: data.budgetMin || null,
          budgetMax: data.budgetMax || null,
          notes: data.notes || null,
          tags: tagsArray, // ✅ array format
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setMessage(`Error: ${result.error}`);
      } else {
        setMessage(`✅ Buyer created! ID: ${result.id}`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create New Buyer</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label>Full Name</label>
          <input {...register("fullName")} className="border p-2 w-full" />
          {errors.fullName && <p>{errors.fullName.message}</p>}
        </div>

        <div>
          <label>Email</label>
          <input {...register("email")} className="border p-2 w-full" />
          {errors.email && <p>{errors.email.message}</p>}
        </div>

        <div>
          <label>Phone</label>
          <input {...register("phone")} className="border p-2 w-full" />
          {errors.phone && <p>{errors.phone.message}</p>}
        </div>

        <div>
          <label>City</label>
          <select {...register("city")} className="border p-2 w-full">
            {Object.values(City).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Property Type</label>
          <select {...register("propertyType")} className="border p-2 w-full">
            {Object.values(PropertyType).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>BHK (only for Apartment/Villa)</label>
          <select {...register("bhk")} className="border p-2 w-full">
            <option value="">--Select--</option>
            {Object.values(BHK).map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {errors.bhk && <p>{errors.bhk.message}</p>}
        </div>

        <div>
          <label>Purpose</label>
          <select {...register("purpose")} className="border p-2 w-full">
            {Object.values(Purpose).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label>Budget Min</label>
            <input
              type="number"
              {...register("budgetMin", { valueAsNumber: true })}
              className="border p-2 w-full"
            />
          </div>
          <div className="flex-1">
            <label>Budget Max</label>
            <input
              type="number"
              {...register("budgetMax", { valueAsNumber: true })}
              className="border p-2 w-full"
            />
          </div>
        </div>
        {errors.budgetMax && <p>{errors.budgetMax.message}</p>}

        <div>
          <label>Timeline</label>
          <select {...register("timeline")} className="border p-2 w-full">
            {Object.values(Timeline).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Source</label>
          <select {...register("source")} className="border p-2 w-full">
            {Object.values(Source).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Notes</label>
          <textarea {...register("notes")} className="border p-2 w-full" />
        </div>

        <div>
          <label>Tags (comma separated)</label>
          <input {...register("tags")} className="border p-2 w-full" />
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2">
          Save Buyer
        </button>
      </form>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
