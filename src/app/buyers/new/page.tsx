"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Phone, MapPin, Building, Home, Target, Calendar, Users, FileText, Tag, DollarSign, CheckCircle, AlertCircle } from "lucide-react";

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
  WALK_IN = "WALK_IN",
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
    formState: { errors, isSubmitting },
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
        setMessage(`✅ Buyer created!`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const formatEnumLabel = (value: string) => {
    return value
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const getTimelineLabel = (value: string) => {
    const labels: Record<string, string> = {
      ZERO_TO_3M: "0-3 Months",
      THREE_TO_6M: "3-6 Months", 
      GT_6M: "6+ Months",
      EXPLORING: "Just Exploring"
    };
    return labels[value] || value;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-2xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-3">
            Create New Buyer Lead
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Capture comprehensive buyer information to match them with their perfect property
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6">
            <h2 className="text-xl font-semibold text-white">Buyer Information</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            {/* Personal Information Section */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-gray-100 mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    <User className="inline w-4 h-4 mr-2" />
                    Full Name *
                  </label>
                  <input
                    {...register("fullName")}
                    className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 placeholder-gray-400 transition-all duration-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 hover:border-gray-500 ${
                      errors.fullName ? "border-red-500" : "border-gray-600"
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    <Mail className="inline w-4 h-4 mr-2" />
                    Email Address
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 placeholder-gray-400 transition-all duration-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 hover:border-gray-500 ${
                      errors.email ? "border-red-500" : "border-gray-600"
                    }`}
                    placeholder="user@example.com"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    <Phone className="inline w-4 h-4 mr-2" />
                    Phone Number *
                  </label>
                  <input
                    {...register("phone")}
                    type="tel"
                    className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 placeholder-gray-400 transition-all duration-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 hover:border-gray-500 ${
                      errors.phone ? "border-red-500" : "border-gray-600"
                    }`}
                    placeholder="1234567890"
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Property Requirements Section */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-gray-100 mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                Property Requirements
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* City */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    <MapPin className="inline w-4 h-4 mr-2" />
                    City *
                  </label>
                  <select
                    {...register("city")}
                    className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 hover:border-gray-500 border-gray-600"
                  >
                    {Object.values(City).map((c) => (
                      <option key={c} value={c} className="bg-gray-800 text-gray-100">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    <Building className="inline w-4 h-4 mr-2" />
                    Property Type *
                  </label>
                  <select
                    {...register("propertyType")}
                    className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 hover:border-gray-500 border-gray-600"
                  >
                    {Object.values(PropertyType).map((p) => (
                      <option key={p} value={p} className="bg-gray-800 text-gray-100">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* BHK */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    <Home className="inline w-4 h-4 mr-2" />
                    BHK Configuration
                  </label>
                  <select
                    {...register("bhk")}
                    className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 hover:border-gray-500 ${
                      errors.bhk ? "border-red-500" : "border-gray-600"
                    }`}
                  >
                    <option value="" className="bg-gray-800 text-gray-400">--Select BHK--</option>
                    {Object.values(BHK).map((b) => (
                      <option key={b} value={b} className="bg-gray-800 text-gray-100">
                        {formatEnumLabel(b)} BHK
                      </option>
                    ))}
                  </select>
                  {errors.bhk && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.bhk.message}
                    </p>
                  )}
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    <Target className="inline w-4 h-4 mr-2" />
                    Purpose *
                  </label>
                  <select
                    {...register("purpose")}
                    className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 hover:border-gray-500 border-gray-600"
                  >
                    {Object.values(Purpose).map((p) => (
                      <option key={p} value={p} className="bg-gray-800 text-gray-100">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Timeline */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    <Calendar className="inline w-4 h-4 mr-2" />
                    Timeline *
                  </label>
                  <select
                    {...register("timeline")}
                    className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 hover:border-gray-500 border-gray-600"
                  >
                    {Object.values(Timeline).map((t) => (
                      <option key={t} value={t} className="bg-gray-800 text-gray-100">
                        {getTimelineLabel(t)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    <Users className="inline w-4 h-4 mr-2" />
                    Lead Source *
                  </label>
                  <select
                    {...register("source")}
                    className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 hover:border-gray-500 border-gray-600"
                  >
                    {Object.values(Source).map((s) => (
                      <option key={s} value={s} className="bg-gray-800 text-gray-100">
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Budget Section */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-gray-100 mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                Budget Range
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    <DollarSign className="inline w-4 h-4 mr-2" />
                    Minimum Budget
                  </label>
                  <input
                    type="number"
                    {...register("budgetMin", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 placeholder-gray-400 transition-all duration-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 hover:border-gray-500 border-gray-600"
                    placeholder="e.g., 5000000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    <DollarSign className="inline w-4 h-4 mr-2" />
                    Maximum Budget
                  </label>
                  <input
                    type="number"
                    {...register("budgetMax", { valueAsNumber: true })}
                    className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 placeholder-gray-400 transition-all duration-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 hover:border-gray-500 ${
                      errors.budgetMax ? "border-red-500" : "border-gray-600"
                    }`}
                    placeholder="e.g., 10000000"
                  />
                  {errors.budgetMax && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.budgetMax.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-100 mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                Additional Information
              </h3>
              
              <div className="space-y-6">
                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    <FileText className="inline w-4 h-4 mr-2" />
                    Notes & Special Requirements
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={4}
                    className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 placeholder-gray-400 transition-all duration-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 hover:border-gray-500 border-gray-600 resize-none"
                    placeholder="Any specific requirements, preferences, or additional information..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    <Tag className="inline w-4 h-4 mr-2" />
                    Tags (comma separated)
                  </label>
                  <input
                    {...register("tags")}
                    className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 placeholder-gray-400 transition-all duration-300 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 hover:border-gray-500 border-gray-600"
                    placeholder="e.g., urgent, premium, first-time-buyer"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-700">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Lead...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Create Buyer Lead
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mt-6 p-4 rounded-xl backdrop-blur-sm border ${
            message.includes("Error") 
              ? "bg-red-900/50 border-red-500/50 text-red-300" 
              : "bg-green-900/50 border-green-500/50 text-green-300"
          }`}>
            <div className="flex items-center gap-3">
              {message.includes("Error") ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              <p className="font-medium">{message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}