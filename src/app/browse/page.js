"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  X,
  Filter,
  ArrowUpDown,
  MapPin,
  Clock,
  ArrowRight,
  RotateCcw,
  Layers,
  Tag,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Lock,
  Plus
} from 'lucide-react';

const CATEGORIES = [
  'All Categories',
  'Electronics',
  'Academic Tools',
  'Bags & Wallets',
  'Keys & Identity',
  'Clothing & Apparel',
  'Books & Documents',
  'Sports & Fitness',
  'Personal Belongings',
  'Others'
];

const LOCATIONS = [
  'All Campus Locations',
  'Central Library',
  'SOET (Engineering & Tech)',
  'SOMC (Media & Communication)',
  'SOBE (Business & Economics)',
  'SOLJ (Law & Justice)',
  'SOMS (Medical Sciences)',
  'SOBAS (Basic & Applied Sciences)',
  'SOSA (Smart Agriculture)',
  'SOLACS (Liberal Arts & Culture)',
  'SOE (School of Education)',
  'Central Cafeteria / Food Court',
  'Sports Arena / Gymnasium',
  'Hostel Zone',
  'Main Academic Block',
  'Campus Main Gate Security'
];

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'all'); // 'all', 'lost', 'found'
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All Categories');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || 'All Campus Locations');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'Active'); // 'Active', 'all', 'Resolved'
  const [sortOrder, setSortOrder] = useState('newest');
  
  const [reports, setReports] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('aulaf_browse_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          return parsed.reports || [];
        }
      } catch (e) {}
    }
    return [];
  });
  const [pagination, setPagination] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('aulaf_browse_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.pagination) return parsed.pagination;
        }
      } catch (e) {}
    }
    return { page: 1, totalPages: 1, total: 0 };
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return !sessionStorage.getItem('aulaf_browse_cache');
      } catch (e) {}
    }
    return true;
  });
  const [error, setError] = useState('');

  // Fetch reports from database-backed API
  const fetchReports = async () => {
    // Only show loading placeholder if we have no reports in memory
    if (reports.length === 0) {
      setLoading(true);
    }
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (activeTab !== 'all') params.set('type', activeTab);
      if (selectedCategory !== 'All Categories') params.set('category', selectedCategory);
      if (selectedLocation !== 'All Campus Locations') params.set('location', selectedLocation);
      if (statusFilter) params.set('status', statusFilter);
      params.set('sort', sortOrder);
      params.set('page', pagination.page.toString());
      params.set('limit', '18');

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
        // Cache default view for instantaneous subsequent page loads
        if (activeTab === 'all' && selectedCategory === 'All Categories' && selectedLocation === 'All Campus Locations' && statusFilter === 'Active' && !searchQuery.trim()) {
          try {
            sessionStorage.setItem('aulaf_browse_cache', JSON.stringify({ reports: data.reports, pagination: data.pagination }));
          } catch (e) {}
        }
      } else {
        if (reports.length === 0) {
          setError('Failed to fetch campus reports.');
        }
      }
    } catch (err) {
      console.error(err);
      if (reports.length === 0) {
        setError('Connection error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, selectedCategory, selectedLocation, statusFilter, sortOrder, pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setSelectedCategory('All Categories');
    setSelectedLocation('All Campus Locations');
    setStatusFilter('Active');
    setSortOrder('newest');
  };

  const isFiltered = searchQuery || activeTab !== 'all' || selectedCategory !== 'All Categories' || selectedLocation !== 'All Campus Locations' || statusFilter !== 'Active';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      
      {/* Chronicle Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          {/* Micro status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 mb-3.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="font-semibold text-slate-900 dark:text-white tracking-tight">Adamas Asset Ledger</span>
            <span className="text-slate-300 dark:text-slate-700 font-light">•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">{pagination.total} Logged Items</span>
          </div>

          <h1 className="font-headline text-3xl sm:text-5xl font-extrabold tracking-[-0.035em] text-slate-950 dark:text-white leading-[1.12]">
            Universal Campus Ledger.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2.5 max-w-2xl leading-relaxed">
            Search real-time misplaced belongings, cross-reference custody across 9 Adamas University schools, and initiate secure OTP handovers.
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/report/lost"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25 text-slate-800 dark:text-slate-200 text-xs font-semibold tracking-tight shadow-xs transition-all hover:bg-slate-50 dark:hover:bg-slate-850"
          >
            <Plus className="w-3.5 h-3.5 text-rose-500" />
            <span>Report Lost</span>
          </Link>
          <Link
            href="/report/found"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs font-semibold tracking-tight shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Found</span>
          </Link>
        </div>
      </div>

      {/* Main Filter & Search Console (Chronicle Glass Card) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xl backdrop-blur-xl mb-10 flex flex-col gap-5">
        
        {/* Row 1: Omnibar Fast Search + Segmented Tabs */}
        <div className="flex flex-col lg:flex-row gap-3.5">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <div className="relative flex items-center rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 focus-within:border-emerald-700 dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all p-1.5">
              <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by item name, Casio, Blue bag, Library, SOBAS..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none"
              />
              <button
                type="submit"
                className="shrink-0 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold tracking-tight transition-all cursor-pointer"
              >
                Search Ledger
              </button>
            </div>
          </form>

          {/* Chronicle Segmented Pill Switch */}
          <div className="flex items-center p-1.5 rounded-2xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 shrink-0 self-start lg:self-center">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setActiveTab('lost')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'lost'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-sm border border-rose-200 dark:border-rose-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              Lost Valuables
            </button>
            <button
              onClick={() => setActiveTab('found')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'found'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              Found in Custody
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-white/5 text-xs">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 transition-all"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="dark:bg-slate-900">{cat}</option>
              ))}
            </select>
          </div>

          {/* Location Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Campus Location / School
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 transition-all"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc} className="dark:bg-slate-900">{loc}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Recovery Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 transition-all"
            >
              <option value="Active" className="dark:bg-slate-900">Active (Open for Recovery)</option>
              <option value="all" className="dark:bg-slate-900">All Statuses</option>
              <option value="Resolved" className="dark:bg-slate-900">Resolved (Handed Over)</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Sort Sequence
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 transition-all"
            >
              <option value="newest" className="dark:bg-slate-900">Newest Log First</option>
              <option value="oldest" className="dark:bg-slate-900">Oldest Log First</option>
            </select>
          </div>
        </div>

        {/* Active Filters Clear Bar */}
        {isFiltered && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Showing filtered results ({pagination.total} matching ledger records)
            </span>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}

      </div>

      {/* Reports Grid (Chronicle Showcase Cards) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 rounded-3xl bg-slate-200/50 dark:bg-slate-800/40 animate-pulse border border-slate-200/70 dark:border-white/5" />
          ))}
        </div>
      ) : error ? (
        <div className="p-10 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center text-rose-700 dark:text-rose-300 text-sm max-w-lg mx-auto">
          <AlertCircle className="w-6 h-6 mx-auto mb-2.5" />
          {error}
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => {
                try {
                  sessionStorage.setItem(`aulaf_report_${item.id}`, JSON.stringify(item));
                } catch (e) {}
              }}
              className="group flex flex-col justify-between rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden hover:-translate-y-1"
            >
              {/* Card Thumbnail / Header */}
              {item.image ? (
                <div className="w-full h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden relative border-b border-slate-100 dark:border-white/5">
                  <img
                    src={item.image}
                    alt={item.item_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-xs ${
                      item.type === 'Found'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-5 pb-0 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.type === 'Found'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}>
                      {item.type}
                    </span>
                    {item.status === 'Resolved' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                        Resolved
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {item.date || 'Recent'}
                  </span>
                </div>
              )}

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  {item.image && (
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        {item.date || 'Recent'}
                      </span>
                      {item.status === 'Resolved' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                          Resolved
                        </span>
                      )}
                    </div>
                  )}

                  <h3 className="font-headline font-bold text-base sm:text-lg text-slate-950 dark:text-white line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {item.item_name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {item.description || 'No additional details logged.'}
                  </p>

                  {/* Attributes Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {item.category && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5">
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        {item.category}
                      </span>
                    )}
                    {item.color && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5">
                        Color: {item.color}
                      </span>
                    )}
                    {item.verification_question && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                        <Lock className="w-2.5 h-2.5" />
                        Anti-Fraud Shield
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px] max-w-[65%] truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{item.location}</span>
                  </span>

                  <Link
                    href={`/report/${item.type.toLowerCase()}/${item.id}`}
                    prefetch={true}
                    onClick={() => {
                      try {
                        sessionStorage.setItem(`aulaf_report_${item.id}`, JSON.stringify(item));
                      } catch (e) {}
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs font-semibold tracking-tight shadow-xs transition-all cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 text-center backdrop-blur-xl">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3.5 opacity-60" />
          <h3 className="font-headline text-lg font-bold text-slate-950 dark:text-white">
            No matching reports found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Try adjusting your search keywords, switching campus locations, or clearing your active filters.
          </p>
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="mt-5 px-5 py-2.5 rounded-full bg-[#050505] dark:bg-white text-white dark:text-slate-950 text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            disabled={pagination.page <= 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            className="px-4 py-2 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 text-xs font-semibold text-slate-800 dark:text-slate-200 disabled:opacity-30 transition-all hover:bg-slate-50 cursor-pointer shadow-xs"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            className="px-4 py-2 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 text-xs font-semibold text-slate-800 dark:text-slate-200 disabled:opacity-30 transition-all hover:bg-slate-50 cursor-pointer shadow-xs"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
}

export default function BrowsePage() {
  return (
    <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-20 transition-colors relative chronicle-bg-glow chronicle-grid">
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading campus ledger...</div>}>
        <BrowseContent />
      </Suspense>
    </main>
  );
}
