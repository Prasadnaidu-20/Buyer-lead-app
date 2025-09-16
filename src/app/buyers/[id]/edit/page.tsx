"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Home, 
  Target, 
  Calendar, 
  Users, 
  FileText, 
  Tag, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Save,
  Loader,
  Activity
} from "lucide-react";
import Link from "next/link";

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

enum Status {
  New = "New",
  Qualified = "Qualified",
  Contacted = "Contacted",
  Visited = "Visited",
  Negotiation = "Negotiation",
  Converted = "Converted",
  Dropped = "Dropped",
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
    status: z.nativeEnum(Status),
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

export default function EditBuyerPage() {
  const params = useParams();
  const router = useRouter();
  const buyerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BuyerFormData>({
    resolver: zodResolver(buyerSchema),
  });

  // Fetch buyer data to populate form
  const fetchBuyer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/buyers/${buyerId}`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch buyer: ${res.statusText}`);
      }
      
      const data = await res.json();
      const buyer = data.buyer;
      
      // Populate form with existing data
      setValue("fullName", buyer.fullName);
      setValue("email", buyer.email || "");
      setValue("phone", buyer.phone);
      setValue("city", buyer.city);
      setValue("propertyType", buyer.propertyType);
      setValue("bhk", buyer.bhk || "");
      setValue("purpose", buyer.purpose);
      setValue("budgetMin", buyer.budgetMin || undefined);
      setValue("budgetMax", buyer.budgetMax || undefined);
      setValue("timeline", buyer.timeline);
      setValue("source", buyer.source);
      setValue("status", buyer.status);
      setValue("notes", buyer.notes || "");
      setValue("tags", buyer.tags ? buyer.tags.join(", ") : "");
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching buyer");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BuyerFormData) => {
    setSubmitting(true);
    setMessage("");
    setError(null);

    try {
      // ✅ Convert tags from comma string → array
      const tagsArray =
        data.tags
          ?.split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0) || [];

      const res = await fetch(`/api/buyers/${buyerId}`, {
        method: "PUT",
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
        setError(`Error: ${result.error}`);
      } else {
        setMessage(`✅ Buyer updated successfully!`);
        // Redirect to buyer details page after successful update
        setTimeout(() => {
          router.push(`/buyers/${buyerId}`);
        }, 1500);
      }
    } catch (err: unknown) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
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

  useEffect(() => {
    if (buyerId) {
      fetchBuyer();
    }
  }, [buyerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
              <span>Loading buyer data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-400 mb-2">⚠️ Error loading buyer</div>
              <div className="text-gray-400 text-sm mb-4">{error}</div>
              <Link
                href="/buyers"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors duration-200"
              >
                Back to Buyers
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/buyers/${buyerId}`}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-400 to-blue-400 bg-clip-text text-transparent">
                Edit Buyer
              </h1>
              <p className="text-gray-400">Update buyer information</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Message Display */}
          {message && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400">{message}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {/* Personal Information */}
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-8">
            <h2 className="text-2xl font-bold text-gray-200 mb-6 flex items-center gap-3">
              <User className="w-6 h-6 text-blue-400" />
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  <User className="inline w-4 h-4 mr-2" />
                  Full Name *
                </label>
                <input
                  {...register("fullName")}
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600"
                  placeholder="Enter full name"
                />
                {errors.fullName && (
                  <p className="text-red-400 text-sm mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Phone Number *
                </label>
                <input
                  {...register("phone")}
                  type="tel"
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600"
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  <MapPin className="inline w-4 h-4 mr-2" />
                  City *
                </label>
                <select
                  {...register("city")}
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600"
                >
                  {Object.values(City).map((c) => (
                    <option key={c} value={c} className="bg-gray-800 text-gray-100">
                      {c}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="text-red-400 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  <Activity className="inline w-4 h-4 mr-2" />
                  Status *
                </label>
                <select
                  {...register("status")}
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600"
                >
                  {Object.values(Status).map((s) => (
                    <option key={s} value={s} className="bg-gray-800 text-gray-100">
                      {formatEnumLabel(s)}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="text-red-400 text-sm mt-1">{errors.status.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-8">
            <h2 className="text-2xl font-bold text-gray-200 mb-6 flex items-center gap-3">
              <Building className="w-6 h-6 text-blue-400" />
              Property Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  <Building className="inline w-4 h-4 mr-2" />
                  Property Type *
                </label>
                <select
                  {...register("propertyType")}
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600"
                >
                  {Object.values(PropertyType).map((pt) => (
                    <option key={pt} value={pt} className="bg-gray-800 text-gray-100">
                      {pt}
                    </option>
                  ))}
                </select>
                {errors.propertyType && (
                  <p className="text-red-400 text-sm mt-1">{errors.propertyType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  <Home className="inline w-4 h-4 mr-2" />
                  BHK Configuration
                </label>
                <select
                  {...register("bhk")}
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600"
                >
                  <option value="" className="bg-gray-800 text-gray-100">
                    Select BHK
                  </option>
                  {Object.values(BHK).map((bhk) => (
                    <option key={bhk} value={bhk} className="bg-gray-800 text-gray-100">
                      {formatEnumLabel(bhk)}
                    </option>
                  ))}
                </select>
                {errors.bhk && (
                  <p className="text-red-400 text-sm mt-1">{errors.bhk.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  <Target className="inline w-4 h-4 mr-2" />
                  Purpose *
                </label>
                <select
                  {...register("purpose")}
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600"
                >
                  {Object.values(Purpose).map((p) => (
                    <option key={p} value={p} className="bg-gray-800 text-gray-100">
                      {p}
                    </option>
                  ))}
                </select>
                {errors.purpose && (
                  <p className="text-red-400 text-sm mt-1">{errors.purpose.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  Timeline *
                </label>
                <select
                  {...register("timeline")}
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600"
                >
                  {Object.values(Timeline).map((t) => (
                    <option key={t} value={t} className="bg-gray-800 text-gray-100">
                      {getTimelineLabel(t)}
                    </option>
                  ))}
                </select>
                {errors.timeline && (
                  <p className="text-red-400 text-sm mt-1">{errors.timeline.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Budget Section */}
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-8">
            <h2 className="text-2xl font-bold text-gray-200 mb-6 flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-blue-400" />
              Budget Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Minimum Budget (₹)
                </label>
                <input
                  {...register("budgetMin", { valueAsNumber: true })}
                  type="number"
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600"
                  placeholder="Enter minimum budget"
                />
                {errors.budgetMin && (
                  <p className="text-red-400 text-sm mt-1">{errors.budgetMin.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Maximum Budget (₹)
                </label>
                <input
                  {...register("budgetMax", { valueAsNumber: true })}
                  type="number"
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600"
                  placeholder="Enter maximum budget"
                />
                {errors.budgetMax && (
                  <p className="text-red-400 text-sm mt-1">{errors.budgetMax.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-8">
            <h2 className="text-2xl font-bold text-gray-200 mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-400" />
              Additional Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  <Users className="inline w-4 h-4 mr-2" />
                  Lead Source *
                </label>
                <select
                  {...register("source")}
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600"
                >
                  {Object.values(Source).map((s) => (
                    <option key={s} value={s} className="bg-gray-800 text-gray-100">
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                {errors.source && (
                  <p className="text-red-400 text-sm mt-1">{errors.source.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  <Tag className="inline w-4 h-4 mr-2" />
                  Tags (comma-separated)
                </label>
                <input
                  {...register("tags")}
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600"
                  placeholder="e.g., urgent, lakeside view, investor"
                />
                {errors.tags && (
                  <p className="text-red-400 text-sm mt-1">{errors.tags.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  <FileText className="inline w-4 h-4 mr-2" />
                  Notes
                </label>
                <textarea
                  {...register("notes")}
                  rows={4}
                  className="w-full px-4 py-3 border-2 rounded-xl bg-gray-700/50 backdrop-blur-sm text-gray-100 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-500 border-gray-600 resize-none"
                  placeholder="Enter any additional notes or comments"
                />
                {errors.notes && (
                  <p className="text-red-400 text-sm mt-1">{errors.notes.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/buyers/${buyerId}`}
              className="px-6 py-3 border-2 border-gray-600 text-gray-300 hover:bg-gray-700/50 rounded-xl transition-all duration-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Update Buyer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
