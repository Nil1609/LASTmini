"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Tag,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  MessageSquare,
  Layers,
  Trash2,
  Check,
  UserCheck,
  Sparkles,
  Inbox
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('aulaf_dashboard_cache');
        return cached ? JSON.parse(cached) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState('lost'); // 'lost', 'found', 'conversations', 'claims'
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return !sessionStorage.getItem('aulaf_dashboard_cache');
      } catch (e) {
        return true;
      }
    }
    return true;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const router = useRouter();

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        setIsAuthenticated(true);
        const result = await res.json();
        setData(result);
        try {
          sessionStorage.setItem('aulaf_dashboard_cache', JSON.stringify(result));
          if (result?.user) {
            sessionStorage.setItem('aulaf_user_cache', JSON.stringify(result.user));
          }
        } catch (e) {}
      } else if (res.status === 401) {
        setIsAuthenticated(false);
        try {
          sessionStorage.removeItem('aulaf_dashboard_cache');
          sessionStorage.removeItem('aulaf_user_cache');
        } catch (e) {}
        router.push('/login');
      }
    } catch (error) {
      console.error("Failed to load dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [router]);

  const handleMarkResolved = async (reportId, type = 'Lost') => {
    const isLost = type === 'Lost';
    const msg = isLost
      ? 'Did you find or recover your lost item? Marking it as resolved will remove it from active campus listings.'
      : 'Has this item been returned to the owner? Marking it as resolved will complete the case.';
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved' })
      });
      if (res.ok) {
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Permanently delete this report?')) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !data) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-colors relative chronicle-bg-glow chronicle-grid">
        <div className="max-w-6xl mx-auto animate-pulse">
          {/* Header Banner Skeleton */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-2">
                <div className="w-48 h-5 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="w-64 h-3 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
            </div>
            <div className="hidden sm:flex gap-2">
              <div className="w-28 h-9 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="w-28 h-9 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
          </div>

          {/* KPI Cards Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 rounded-3xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 h-28 flex flex-col justify-between">
                <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-12 h-7 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>

          {/* Content Area Skeleton */}
          <div className="p-10 rounded-3xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 h-64" />
        </div>
      </main>
    );
  }

  const stats = data?.stats || { lost: 0, found: 0, conversations: 0, resolved: 0, claimsPending: 0 };
  const lostReports = data?.lost || [];
  const foundReports = data?.found || [];
  const conversations = data?.conversations || [];
  const claimsReceived = data?.claimsReceived || [];

  return (
    <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-colors relative chronicle-bg-glow chronicle-grid">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Student Welcome Banner (Chronicle Glass Card) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xl backdrop-blur-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#050505] dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-bold text-xl font-headline shadow-md overflow-hidden shrink-0 border border-slate-200/50 dark:border-white/10 relative">
              {data?.user?.avatar_url || data?.user?.avatar ? (
                <img
                  src={data.user.avatar_url || data.user.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
              ) : null}
              <span style={{ display: (data?.user?.avatar_url || data?.user?.avatar) ? 'none' : 'block' }}>
                {data?.user?.name ? data.user.name.charAt(0).toUpperCase() : 'S'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-headline text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                  {data?.user?.name || 'Student Recovery Hub'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {data?.user?.role || 'Student'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {data?.user?.school || 'School of Engineering & Technology (SOET)'} • {data?.user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
            <Link
              href="/chat"
              className="nav-pill-btn inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-semibold tracking-tight shadow-xs transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
              title="View all messages and recovery inquiries"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Messages {conversations.length > 0 ? `(${conversations.length})` : ''}</span>
            </Link>
            <Link
              href="/report/lost"
              className="nav-pill-btn inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25 text-slate-800 dark:text-slate-200 text-xs font-semibold tracking-tight shadow-xs transition-all hover:bg-slate-50 dark:hover:bg-slate-850"
            >
              <Plus className="w-3.5 h-3.5 text-rose-500" />
              <span>Report Lost</span>
            </Link>
            <Link
              href="/report/found"
              className="nav-pill-btn inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs font-semibold tracking-tight shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Found</span>
            </Link>
          </div>
        </div>

        {/* KPI Metrics Grid (Chronicle Bento Style) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 mb-8">
          <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Items Lost
            </span>
            <div className="text-3xl sm:text-4xl font-headline font-extrabold text-slate-950 dark:text-white mt-2">
              {stats.lost}
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">Your filed lost items</span>
          </div>

          <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Items Found
            </span>
            <div className="text-3xl sm:text-4xl font-headline font-extrabold text-slate-950 dark:text-white mt-2">
              {stats.found}
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">Assets you registered</span>
          </div>

          <Link
            href="/chat"
            className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:-translate-y-0.5 transition-all block cursor-pointer"
            title="Open Recovery Messages Terminal"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Active Inquiries
              </span>
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-3xl sm:text-4xl font-headline font-extrabold text-slate-950 dark:text-white mt-2">
              {stats.conversations}
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-between">
              <span>Handover chat sessions</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Resolved &amp; Returned
            </span>
            <div className="text-3xl sm:text-4xl font-headline font-extrabold text-slate-950 dark:text-white mt-2">
              {stats.resolved}
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">Successfully recovered</span>
          </div>
        </div>

        {/* Chronicle Segmented Tab Switch */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 mb-8 max-w-full overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('lost')}
            className={`px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'lost'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <span>My Lost Reports ({lostReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('found')}
            className={`px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'found'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <span>My Found Reports ({foundReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'conversations'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <span>Recovery Chats ({conversations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('claims')}
            className={`px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'claims'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <span>Claims Received ({claimsReceived.length})</span>
          </button>
        </div>

        {/* TAB 1: LOST REPORTS */}
        {activeTab === 'lost' && (
          <div className="flex flex-col gap-4">
            {lostReports.length > 0 ? (
              lostReports.map((report) => (
                <div
                  key={report.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        Lost
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        report.status === 'Resolved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/5'
                      }`}>
                        {report.status}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {report.date}
                      </span>
                      {report.category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5">
                          {report.category}
                        </span>
                      )}
                    </div>

                    <h3 className="font-headline font-bold text-base sm:text-lg text-slate-950 dark:text-white">
                      {report.item_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 leading-relaxed">
                      {report.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center gap-2 mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{report.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 text-xs">
                    <Link
                      href={`/report/lost/${report.id}`}
                      className="px-4 py-2 rounded-full border border-slate-200/90 dark:border-white/10 hover:border-slate-400 text-slate-800 dark:text-slate-200 font-semibold transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      View Ledger
                    </Link>
                    {report.status !== 'Resolved' ? (
                      <button
                        onClick={() => handleMarkResolved(report.id, 'Lost')}
                        className="px-4 py-2 rounded-full bg-[#050505] dark:bg-white text-white dark:text-slate-950 font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xs cursor-pointer"
                        title="Mark as resolved and remove from active campus listings"
                      >
                        I Found It (Resolved)
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Resolved &amp; Removed
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400 backdrop-blur-xl">
                <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">You have not filed any lost item reports yet.</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/report/lost" className="nav-pill-btn px-5 py-2.5 bg-[#050505] dark:bg-white text-white dark:text-slate-950 rounded-full font-semibold shadow-xs">
                    Report a Lost Item
                  </Link>
                  <Link href="/chat" className="nav-pill-btn px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-full font-semibold shadow-xs flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>View Messages</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FOUND REPORTS */}
        {activeTab === 'found' && (
          <div className="flex flex-col gap-4">
            {foundReports.length > 0 ? (
              foundReports.map((report) => (
                <div
                  key={report.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Found in Custody
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        report.status === 'Resolved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/5'
                      }`}>
                        {report.status}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {report.date}
                      </span>
                      {report.category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5">
                          {report.category}
                        </span>
                      )}
                    </div>

                    <h3 className="font-headline font-bold text-base sm:text-lg text-slate-950 dark:text-white">
                      {report.item_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 leading-relaxed">
                      {report.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center gap-2 mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{report.location}</span>
                      {report.custody && (
                        <span className="border-l border-slate-200 dark:border-white/10 pl-2 text-slate-500">
                          Custody: {report.custody}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 text-xs">
                    <Link
                      href={`/report/found/${report.id}`}
                      className="px-4 py-2 rounded-full border border-slate-200/90 dark:border-white/10 hover:border-slate-400 text-slate-800 dark:text-slate-200 font-semibold transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      View Ledger
                    </Link>
                    {report.status !== 'Resolved' ? (
                      <button
                        onClick={() => handleMarkResolved(report.id, 'Found')}
                        className="px-4 py-2 rounded-full bg-[#050505] dark:bg-white text-white dark:text-slate-950 font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xs cursor-pointer"
                        title="Mark as resolved if returned to owner"
                      >
                        Item Returned (Resolved)
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Resolved &amp; Returned
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400 backdrop-blur-xl">
                <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">You have not registered any found items into custody yet.</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/report/found" className="nav-pill-btn px-5 py-2.5 bg-[#050505] dark:bg-white text-white dark:text-slate-950 rounded-full font-semibold shadow-xs">
                    Report a Found Item
                  </Link>
                  <Link href="/chat" className="nav-pill-btn px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-full font-semibold shadow-xs flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>View Messages</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONVERSATIONS */}
        {activeTab === 'conversations' && (
          <div className="flex flex-col gap-4">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-5"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Recovery Conversation #{conv.id.substring(0, 8)}
                    </span>
                    <h3 className="font-headline font-bold text-base sm:text-lg text-slate-950 dark:text-white mt-1">
                      {conv.report_title || 'Item Inquiry'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Status: <strong className="capitalize text-slate-800 dark:text-slate-200">{conv.status || 'Active'}</strong>
                    </p>
                  </div>

                  <Link
                    href={`/chat/${conv.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs font-semibold shadow-xs transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Handover Terminal</span>
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-16 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400 backdrop-blur-xl">
                <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                No active recovery conversations yet. Inquiries will appear here when an ownership claim is submitted.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CLAIMS RECEIVED */}
        {activeTab === 'claims' && (
          <div className="flex flex-col gap-4">
            {claimsReceived.length > 0 ? (
              claimsReceived.map((claim) => (
                <div
                  key={claim.id}
                  className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm text-xs"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="font-bold text-slate-950 dark:text-white text-base">
                      Claim for &ldquo;{claim.report_title}&rdquo;
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      claim.status === 'accepted' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      claim.status === 'rejected' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {claim.status}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 my-3">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Submitted Evidence / Characteristics:
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                      {claim.claim_details}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Claimant: {claim.claimant_name} ({claim.claimant_email})
                    </span>
                    <Link
                      href={`/chat/${claim.conversation_id}`}
                      className="text-xs font-bold text-slate-950 dark:text-white hover:underline flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Coordinate in Chat</span>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400 backdrop-blur-xl">
                <Shield className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                You have not received any ownership claims on your listings.
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
