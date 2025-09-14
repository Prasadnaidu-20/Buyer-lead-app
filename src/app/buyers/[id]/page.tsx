"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Tag,
  Edit3,
  Trash2,
  Activity,
  Clock,
  Target,
} from "lucide-react";

interface Buyer {
  id: string;
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
  updatedAt: string;
  BuyerHistory: Array<{
    id: string;
    changedAt: string;
    diff: any;
  }>;
}

export default function BuyerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const buyerId = params.id as string;

  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBuyer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/buyers/${buyerId}`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch buyer: ${res.statusText}`);
      }
      
      const data = await res.json();
      setBuyer(data.buyer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching buyer");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!buyer) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${buyer.fullName}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setDeleting(true);
      
      const res = await fetch(`/api/buyers/${buyerId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete buyer");
      }
      
      // Redirect back to buyers list
      router.push("/buyers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while deleting buyer");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (buyerId) {
      fetchBuyer();
    }
  }, [buyerId]);

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return "Not specified";
    if (!min) return `Up to ₹${(max! / 100000).toFixed(1)}L`;
    if (!max) return `From ₹${(min / 100000).toFixed(1)}L`;
    return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "closed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "follow_up":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getTimelineLabel = (timeline: string) => {
    const labels: Record<string, string> = {
      ZERO_TO_3M: "0-3 Months",
      THREE_TO_6M: "3-6 Months",
      GT_6M: "6+ Months",
      EXPLORING: "Just Exploring",
    };
    return labels[timeline] || timeline;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
              <span>Loading buyer details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !buyer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-400 mb-2">⚠️ Error loading buyer</div>
              <div className="text-gray-400 text-sm mb-4">{error || "Buyer not found"}</div>
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/buyers"
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  {buyer.fullName}
                </h1>
                <p className="text-gray-400">Buyer Details</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href={`/buyers/${buyer.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Buyer Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Email</div>
                    <div className="text-gray-200">{buyer.email || "Not provided"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Phone</div>
                    <div className="text-gray-200">{buyer.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">City</div>
                    <div className="text-gray-200">{buyer.city}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Status</div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(buyer.status)}`}>
                      {buyer.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                Property Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Property Type</div>
                    <div className="text-gray-200">{buyer.propertyType}</div>
                  </div>
                </div>
                {buyer.bhk && (
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">BHK</div>
                      <div className="text-gray-200">{buyer.bhk}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Target className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Purpose</div>
                    <div className="text-gray-200">{buyer.purpose}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Timeline</div>
                    <div className="text-gray-200">{getTimelineLabel(buyer.timeline)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Budget</div>
                    <div className="text-gray-200">{formatBudget(buyer.budgetMin, buyer.budgetMax)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Additional Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">Source</div>
                    <div className="text-gray-200">{buyer.source}</div>
                  </div>
                </div>
                
                {buyer.tags && buyer.tags.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Tag className="w-4 h-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {buyer.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {buyer.notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-2">Notes</div>
                      <div className="text-gray-200 whitespace-pre-wrap">{buyer.notes}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Activity & History */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Quick Stats
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Created</span>
                  <span className="text-gray-200">{new Date(buyer.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Updated</span>
                  <span className="text-gray-200">{new Date(buyer.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">History Entries</span>
                  <span className="text-gray-200">{buyer.BuyerHistory?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            {buyer.BuyerHistory && buyer.BuyerHistory.length > 0 && (
              <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6">
                <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  Recent Activity
                </h2>
                <div className="space-y-3">
                  {buyer.BuyerHistory.slice(0, 5).map((history) => (
                    <div key={history.id} className="border-l-2 border-amber-500/30 pl-4">
                      <div className="text-sm text-gray-400">
                        {new Date(history.changedAt).toLocaleDateString()} at{" "}
                        {new Date(history.changedAt).toLocaleTimeString()}
                      </div>
                      <div className="text-gray-200 text-sm">
                        {history.diff?.action || "Updated"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
