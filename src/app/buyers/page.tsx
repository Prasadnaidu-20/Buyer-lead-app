"use client";

import { useEffect, useState, useCallback, memo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
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
  Upload,
  Download,
  FileText,
  X,
} from "lucide-react";

// Constants
const PAGE_SIZE = 10;

// Memoized BuyerRow component to prevent unnecessary re-renders
const BuyerRow = memo(({ 
  buyer, 
  updatingStatus, 
  handleStatusUpdate, 
  getStatusColor, 
  getBudgetLabel, 
  getTimelineLabel 
}: {
  buyer: {
    id: string;
    fullName: string;
    email?: string | null;
    phone: string;
    city: string;
    propertyType: string;
    bhk?: string | null;
    purpose: string;
    budgetMin?: number | null;
    budgetMax?: number | null;
    timeline: string;
    source: string;
    status: string;
    notes?: string | null;
    tags: string[];
    updatedAt: string;
  };
  updatingStatus: Set<string>;
  handleStatusUpdate: (buyerId: string, newStatus: string) => void;
  getStatusColor: (status: string) => string;
  getBudgetLabel: (min: number | null, max: number | null) => string;
  getTimelineLabel: (timeline: string) => string;
}) => (
  <tr className="hover:bg-gray-700/30 transition-colors duration-200">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
          {buyer.fullName?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-gray-200">
            {buyer.fullName}
          </div>
          {buyer.email && (
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {buyer.email}
            </div>
          )}
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="text-gray-200 flex items-center gap-2">
        <Phone className="w-4 h-4 text-gray-400" />
        {buyer.phone}
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2 text-gray-300">
        <MapPin className="w-4 h-4 text-gray-400" />
        {buyer.city}
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2 text-gray-300">
        <Building className="w-4 h-4 text-gray-400" />
        {buyer.propertyType}
        {buyer.bhk && (
          <span className="text-sm text-gray-500">
            • {buyer.bhk}
          </span>
        )}
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2 text-gray-300">
        <DollarSign className="w-4 h-4 text-gray-400" />
        <span className="text-sm">
          {getBudgetLabel(buyer.budgetMin ?? null, buyer.budgetMax ?? null)}
        </span>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2 text-gray-300">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-sm">
          {getTimelineLabel(buyer.timeline)}
        </span>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="relative">
        <select
          value={buyer.status || "New"}
          onChange={(e) => handleStatusUpdate(buyer.id, e.target.value)}
          disabled={updatingStatus.has(buyer.id)}
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-200 ${
            updatingStatus.has(buyer.id) 
              ? 'bg-gray-600/20 text-gray-500 border-gray-600/30 cursor-not-allowed' 
              : getStatusColor(buyer.status) + ' hover:bg-opacity-80 cursor-pointer'
          }`}
        >
          <option value="New">New</option>
          <option value="Qualified">Qualified</option>
          <option value="Contacted">Contacted</option>
          <option value="Visited">Visited</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Converted">Converted</option>
          <option value="Dropped">Dropped</option>
        </select>
        {updatingStatus.has(buyer.id) && (
          <div className="absolute -top-1 -right-1 w-3 h-3">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-amber-500"></div>
          </div>
        )}
      </div>
    </td>
    <td className="px-6 py-4 text-sm text-gray-400">
      {new Date(buyer.updatedAt).toLocaleDateString()}
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.location.href = `/buyers/${buyer.id}`}
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 text-gray-400 hover:text-amber-400"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => window.location.href = `/buyers/${buyer.id}/edit`}
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 text-gray-400 hover:text-orange-400"
          title="Edit Lead"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
));

BuyerRow.displayName = 'BuyerRow';

function BuyersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [buyers, setBuyers] = useState<{
    id: string;
    fullName: string;
    email?: string | null;
    phone: string;
    city: string;
    propertyType: string;
    bhk?: string | null;
    purpose: string;
    budgetMin?: number | null;
    budgetMax?: number | null;
    timeline: string;
    source: string;
    status: string;
    notes?: string | null;
    tags: string[];
    updatedAt: string;
  }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  // Import/Export state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    totalRows: number;
    validRows: number;
    errors: Array<{ row: number; message: string }>;
    insertedCount: number;
    error?: string;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  
  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState<Set<string>>(new Set());

  // filters state
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [propertyType, setPropertyType] = useState(
    searchParams.get("propertyType") || ""
  );
  const [timeline, setTimeline] = useState(searchParams.get("timeline") || "");
  const [showFilters, setShowFilters] = useState(false);

  const fetchBuyers = useCallback(async () => {
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
  }, [page, city, status, propertyType, timeline, searchQuery]);

  // fetch on filters/search/page change
  useEffect(() => {
    fetchBuyers();
  }, [fetchBuyers]);

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

  // Import/Export functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      setImporting(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', importFile);

      const res = await fetch('/api/buyers/import', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      setImportResult(result);

      if (result.success) {
        // Refresh the buyers list
        fetchBuyers();
        // Close modal after success
        setTimeout(() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportResult(null);
        }, 2000);
      }
    } catch (err) {
      setImportResult({
        success: false,
        totalRows: 0,
        validRows: 0,
        errors: [],
        insertedCount: 0,
        error: err instanceof Error ? err.message : "Import failed"
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      // Build query params with current filters
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      if (status) params.set("status", status);
      if (propertyType) params.set("propertyType", propertyType);
      if (timeline) params.set("timeline", timeline);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/buyers/export?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error('Export failed');
      }

      // Download the file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from Content-Disposition header
      const contentDisposition = res.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `buyers-export-${new Date().toISOString().split('T')[0]}.csv`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // Status update handler - optimized to avoid full page refresh
  const handleStatusUpdate = useCallback(async (buyerId: string, newStatus: string) => {
    try {
      // Add buyer to updating set
      setUpdatingStatus(prev => new Set(prev).add(buyerId));
      
      const res = await fetch(`/api/buyers/${buyerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      // Update the buyer in the local state instead of refetching all data
      setBuyers(prevBuyers => 
        prevBuyers.map(buyer => 
          buyer.id === buyerId 
            ? { ...buyer, status: newStatus, updatedAt: new Date().toISOString() }
            : buyer
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      // Remove buyer from updating set
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(buyerId);
        return newSet;
      });
    }
  }, []);

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



  const formatBudget = useCallback((min: number | null, max: number | null) => {
    if (!min && !max) return "Not specified";
    if (!min) return `Up to ₹${(max! / 100000).toFixed(1)}L`;
    if (!max) return `From ₹${(min / 100000).toFixed(1)}L`;
    return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L`;
  }, []);

  const getBudgetLabel = formatBudget; // Alias for the memoized component

  const getStatusColor = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case "new":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "qualified":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "contacted":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "visited":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "negotiation":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "converted":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "dropped":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  }, []);

  const getTimelineLabel = useCallback((timeline: string) => {
    const labels: Record<string, string> = {
      ZERO_TO_3M: "0-3 Months",
      THREE_TO_6M: "3-6 Months",
      GT_6M: "6+ Months",
      EXPLORING: "Just Exploring",
    };
    return labels[timeline] || timeline;
  }, []);

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center cursor-pointer gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
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
          className="inline-flex cursor-pointer items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
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
              className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600 rounded-lg text-gray-300 transition-all duration-300"
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
                  className="w-full px-3 py-2 cursor-pointer bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
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
                  className="w-full px-3 py-2 cursor-pointer bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
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
                  className="w-full px-3 py-2 cursor-pointer bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
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
                  className="w-full px-3 py-2 cursor-pointer bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
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
                  className="px-4 py-2 cursor-pointer bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors duration-200"
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
                  {buyers && buyers.map((b) => (
                    <BuyerRow
                      key={b.id}
                      buyer={b}
                      updatingStatus={updatingStatus}
                      handleStatusUpdate={handleStatusUpdate}
                      getStatusColor={getStatusColor}
                      getBudgetLabel={getBudgetLabel}
                      getTimelineLabel={getTimelineLabel}
                    />
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
                className="inline-flex items-center gap-2 px-4 py-2 cursor-pointer bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-300"
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
                className="p-2 border cursor-pointer border-gray-600 rounded-lg bg-gray-700/50 text-gray-400 hover:bg-gray-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                      className={`px-3 py-2 cursor-pointer border rounded-lg text-sm font-medium transition-all duration-200 ${
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
                className="p-2 border cursor-pointer border-gray-600 rounded-lg bg-gray-700/50 text-gray-400 hover:bg-gray-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-200 flex items-center gap-2">
                    <Upload className="w-6 h-6 text-blue-400" />
                    Import CSV
                  </h2>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                      setImportResult(null);
                    }}
                    className="p-2 hover:bg-gray-700 cursor-pointer rounded-lg transition-colors duration-200 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* CSV Format Info */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h3 className="text-blue-400 font-semibold mb-2">CSV Format Requirements</h3>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>• Maximum 200 rows (excluding header)</p>
                      <p>• Required headers: fullName, email, phone, city, propertyType, bhk, purpose, budgetMin, budgetMax, timeline, source, notes, tags, status</p>
                      <p>• Valid enums: city (Chandigarh, Mohali, etc.), propertyType (Apartment, Villa, etc.), status (New, Qualified, etc.)</p>
                      <p>• Tags should be comma-separated</p>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Select CSV File
                    </label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors duration-200">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label
                        htmlFor="csv-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <FileText className="w-12 h-12 text-gray-400" />
                        <div>
                          <p className="text-gray-300 font-medium">
                            {importFile ? importFile.name : "Click to select CSV file"}
                          </p>
                          <p className="text-gray-400 text-sm">Maximum 5MB</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Import Results */}
                  {importResult && (
                    <div className={`rounded-lg p-4 ${
                      importResult.success 
                        ? 'bg-green-500/10 border border-green-500/20' 
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      <h3 className={`font-semibold mb-2 ${
                        importResult.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {importResult.success ? 'Import Successful!' : 'Import Failed'}
                      </h3>
                      
                      {importResult.success ? (
                        <div className="text-sm text-gray-300 space-y-1">
                          <p>• Total rows: {importResult.totalRows}</p>
                          <p>• Valid rows: {importResult.validRows}</p>
                          <p>• Inserted: {importResult.insertedCount}</p>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-300">
                          {importResult.error && (
                            <p className="mb-2">{importResult.error}</p>
                          )}
                          {importResult.errors && importResult.errors.length > 0 && (
                            <div className="max-h-40 overflow-y-auto">
                              <p className="font-medium mb-2">Validation Errors:</p>
                              <div className="space-y-1">
                                {importResult.errors.slice(0, 10).map((error: { row: number; message: string }, index: number) => (
                                  <p key={index} className="text-xs">
                                    Row {error.row}: {error.message}
                                  </p>
                                ))}
                                {importResult.errors.length > 10 && (
                                  <p className="text-xs text-gray-400">
                                    ... and {importResult.errors.length - 10} more errors
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setImportFile(null);
                        setImportResult(null);
                      }}
                      className="px-4 py-2 cursor-pointer border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={!importFile || importing}
                      className="inline-flex items-center cursor-pointer gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      {importing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Import
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuyersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
              <span>Loading...</span>
            </div>
          </div>
        </div>
      </div>
    }>
      <BuyersPageContent />
    </Suspense>
  );
}
