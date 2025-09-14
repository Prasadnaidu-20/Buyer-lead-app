"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  Users,
  Eye,
  Edit3,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Activity,
  SlidersHorizontal,
} from "lucide-react";

// Constants
const PAGE_SIZE = 10;

export default function BuyersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [buyers, setBuyers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  // filters state
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [propertyType, setPropertyType] = useState(
    searchParams.get("propertyType") || ""
  );
  const [timeline, setTimeline] = useState(searchParams.get("timeline") || "");
  const [showFilters, setShowFilters] = useState(false);

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({ 
        page: String(page),
        pageSize: String(PAGE_SIZE)
      });
      if (city) params.set("city", city);
      if (status) params.set("status", status);
      if (propertyType) params.set("propertyType", propertyType);
      if (timeline) params.set("timeline", timeline);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/buyers?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch buyers: ${res.statusText}`);
      }
      
      const data = await res.json();
      setBuyers(data?.buyers ?? []);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching buyers");
      setBuyers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // fetch on filters/search/page change
  useEffect(() => {
    fetchBuyers();
  }, [page, city, status, propertyType, timeline, searchQuery]);

  // search function triggered on Enter key
  const handleSearch = () => {
    // update URL params - let URL sync useEffect handle state updates
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput) {
      params.set("search", searchInput);
    } else {
      params.delete("search");
    }

    // Keep page at 1 whenever search changes
    params.set("page", "1");
    params.set("pageSize", String(PAGE_SIZE)); // Ensure pageSize is always included

    router.push(`/buyers?${params.toString()}`, { scroll: false });
  };

  const handleSearchInput = (value: string) => {
    setSearchInput(value); // update state for UI responsiveness
  };

  // Filter handlers that update URL
  const handleFilterChange = (filterType: string, value: string) => {
    // Update URL params - let URL sync useEffect handle state updates
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(filterType, value);
    } else {
      params.delete(filterType);
    }
    params.set("page", "1"); // Reset to page 1 when filters change
    params.set("pageSize", String(PAGE_SIZE)); // Ensure pageSize is always included

    router.push(`/buyers?${params.toString()}`, { scroll: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    // Update URL params - let URL sync useEffect handle state updates
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    params.set("pageSize", String(PAGE_SIZE)); // Ensure pageSize is always included
    
    router.push(`/buyers?${params.toString()}`, { scroll: false });
  };

// ✅ sync state with URL params whenever they change (but avoid infinite loops)
useEffect(() => {
  const urlPage = Number(searchParams.get("page") || 1);
  const urlSearch = searchParams.get("search") || "";
  const urlCity = searchParams.get("city") || "";
  const urlStatus = searchParams.get("status") || "";
  const urlPropertyType = searchParams.get("propertyType") || "";
  const urlTimeline = searchParams.get("timeline") || "";

  // Only update state if values have actually changed
  if (page !== urlPage) setPage(urlPage);
  if (searchQuery !== urlSearch) {
    setSearchQuery(urlSearch);
    setSearchInput(urlSearch); // Sync input with URL when URL changes
  }
  if (city !== urlCity) setCity(urlCity);
  if (status !== urlStatus) setStatus(urlStatus);
  if (propertyType !== urlPropertyType) setPropertyType(urlPropertyType);
  if (timeline !== urlTimeline) setTimeline(urlTimeline);
}, [searchParams, page, searchQuery, city, status, propertyType, timeline]);



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

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-4 mb-6 lg:mb-0">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Buyer Leads
              </h1>
              <p className="text-gray-400 mt-1">{total} total leads found</p>
            </div>
          </div>
          <div>
            <Link
            href="/buyers/new"
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Create New Lead
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              router.push("/login");
            }}
          className="ml-7 inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
            Logout
          </button>
          </div>

          
        </div>

        {/* Search and Filters Section */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email... (Press Enter to search)"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-12 pr-16 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-300"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors duration-200"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600 rounded-lg text-gray-300 transition-all duration-300"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters {showFilters ? "▲" : "▼"}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="inline w-4 h-4 mr-2" />
                  City
                </label>
                <select
                  value={city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                >
                  <option value="">All Cities</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Mohali">Mohali</option>
                  <option value="Zirakpur">Zirakpur</option>
                  <option value="Panchkula">Panchkula</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Building className="inline w-4 h-4 mr-2" />
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                >
                  <option value="">All Types</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Plot">Plot</option>
                  <option value="Office">Office</option>
                  <option value="Retail">Retail</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Activity className="inline w-4 h-4 mr-2" />
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                >
                  <option value="">All Status</option>
                  <option value="New">New</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Visited">Visited</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Converted">Converted</option>
                  <option value="Dropped">Dropped</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  Timeline
                </label>
                <select
                  value={timeline}
                  onChange={(e) => handleFilterChange('timeline', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                >
                  <option value="">All Timelines</option>
                  <option value="ZERO_TO_3M">0-3 Months</option>
                  <option value="THREE_TO_6M">3-6 Months</option>
                  <option value="GT_6M">6+ Months</option>
                  <option value="EXPLORING">Just Exploring</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                <span>Loading buyers...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-400 mb-2">⚠️ Error loading buyers</div>
                <div className="text-gray-400 text-sm mb-4">{error}</div>
                <button
                  onClick={fetchBuyers}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Table Content */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b border-gray-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">
                      Property
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">
                      Budget
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">
                      Timeline
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">
                      Updated
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {buyers && buyers.map((b: any) =>(
                    <tr
                      key={b.fullName}
                      className="hover:bg-gray-700/30 transition-colors duration-200"
                    >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {b.fullName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-200">
                            {b.fullName}
                          </div>
                          {b.email && (
                            <div className="text-sm text-gray-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {b.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-200 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {b.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {b.city}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Building className="w-4 h-4 text-gray-400" />
                        {b.propertyType}
                        {b.bhk && (
                          <span className="text-sm text-gray-500">
                            • {b.bhk}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {formatBudget(b.budgetMin, b.budgetMax)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {getTimelineLabel(b.timeline)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          b.status
                        )}`}
                      >
                        {b.status || "New"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(b.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/buyers/${b.id}`)}
                          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 text-gray-400 hover:text-amber-400"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/buyers/${b.id}/edit`)}
                          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 text-gray-400 hover:text-orange-400"
                          title="Edit Lead"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && buyers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">
                No buyers found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search or filters
              </p>
              <Link
                href="/buyers/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Create First Lead
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && !error && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-gray-400">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)} of{" "}
              {total} results
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-600 rounded-lg bg-gray-700/50 text-gray-400 hover:bg-gray-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-200 ${
                        pageNum === page
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-500"
                          : "bg-gray-700/50 text-gray-400 border-gray-600 hover:bg-gray-700/70"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === page - 2 || pageNum === page + 2) {
                  return (
                    <span key={pageNum} className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-600 rounded-lg bg-gray-700/50 text-gray-400 hover:bg-gray-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
