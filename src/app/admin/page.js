"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  Check,
  X,
  FileText,
  Sparkles
} from 'lucide-react';

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('flags'); // 'flags', 'reports', 'audit'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchAdminData = async () => {
    try {
      // Verify user auth & admin status
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      if (!userData.user?.isAdmin) {
        setLoading(false);
        return; // will render 403 Access Denied
      }

      // Fetch overview & stats
      const overRes = await fetch('/api/admin/overview');
      if (overRes.ok) {
        const overData = await overRes.json();
        setOverview(overData);
      }

      // Fetch reports
      const repRes = await fetch('/api/admin/reports');
      if (repRes.ok) {
        const repData = await repRes.json();
        setReports(repData.reports || []);
      }
    } catch (err) {
      console.error("Admin fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [router]);

  const handleModerate = async (reportId, action, reason = '', flagId = null) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action, reason, flagId })
      });

      if (res.ok) {
        await fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      alert('Network error executing moderation action.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-28 pb-16 px-4 text-center relative chronicle-bg-glow chronicle-grid">
        <div className="max-w-md mx-auto p-12 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-white/10 text-xs text-slate-500 animate-pulse backdrop-blur-xl">
          Authenticating administrative credentials...
        </div>
      </main>
    );
  }

  // Permission check
  if (!currentUser?.isAdmin) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-28 pb-16 px-4 text-center relative chronicle-bg-glow chronicle-grid">
        <div className="max-w-md mx-auto p-8 bg-white/95 dark:bg-slate-900/90 rounded-3xl border border-rose-200 dark:border-rose-900 text-xs shadow-xl backdrop-blur-xl">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">403 Access Denied</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            This module is strictly restricted to Adamas University Campus Security and appointed Student Council administrators.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-block px-5 py-2.5 bg-[#050505] dark:bg-white text-white dark:text-slate-950 rounded-full font-semibold shadow-xs"
          >
            Return to Student Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const stats = overview?.stats || {
    totalReports: 0,
    activeLost: 0,
    activeFound: 0,
    resolved: 0,
    hidden: 0,
    pendingFlags: 0,
    totalUsers: 0
  };

  const flags = overview?.recentFlags || [];
  const auditLogs = overview?.recentAudit || [];

  const filteredReports = reports.filter((r) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      (r.item_name && r.item_name.toLowerCase().includes(s)) ||
      (r.location && r.location.toLowerCase().includes(s)) ||
      (r.category && r.category.toLowerCase().includes(s))
    );
  });

  return (
    <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-colors relative chronicle-bg-glow chronicle-grid">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Banner (Chronicle Glass Card) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xl backdrop-blur-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-headline text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                  Campus Security &amp; Moderation
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                  Officer: {currentUser.name || currentUser.full_name}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Audit listings, investigate community flags, enforce compliance, and maintain the campus ledger integrity.
              </p>
            </div>
          </div>

          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200/90 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all self-start md:self-center"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Ledger</span>
          </Link>
        </div>

        {/* Admin KPI Cards Grid (Chronicle Bento) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 mb-8 text-xs">
          <div className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Listings</span>
            <div className="text-2xl font-headline font-extrabold text-slate-950 dark:text-white mt-1.5">
              {stats.totalReports}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Active Lost</span>
            <div className="text-2xl font-headline font-extrabold text-rose-700 dark:text-rose-400 mt-1.5">
              {stats.activeLost}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">Active Found</span>
            <div className="text-2xl font-headline font-extrabold text-sky-700 dark:text-sky-400 mt-1.5">
              {stats.activeFound}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Recovered</span>
            <div className="text-2xl font-headline font-extrabold text-emerald-700 dark:text-emerald-400 mt-1.5">
              {stats.resolved}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Flags</span>
            <div className="text-2xl font-headline font-extrabold text-amber-700 dark:text-amber-400 mt-1.5">
              {stats.pendingFlags}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hidden Reports</span>
            <div className="text-2xl font-headline font-extrabold text-slate-700 dark:text-slate-300 mt-1.5">
              {stats.hidden}
            </div>
          </div>
        </div>

        {/* Tab Navigation (Chronicle Segmented Pills) */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 mb-8 max-w-full overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('flags')}
            className={`px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'flags'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <span>Moderation Flags ({flags.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <span>All Listings Management ({reports.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <span>Security Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: MODERATION FLAGS */}
        {activeTab === 'flags' && (
          <div className="flex flex-col gap-4">
            {flags.length > 0 ? (
              flags.map((flag) => (
                <div
                  key={flag.id}
                  className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm text-xs flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {flag.reason}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Flagged by {flag.flagged_by_name} • {new Date(flag.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-headline font-bold text-base text-slate-950 dark:text-white">
                      Listing: &ldquo;{flag.report_title}&rdquo; (#{flag.report_id.substring(0, 8)})
                    </h3>

                    {flag.details && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-white/[0.03] p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/5 leading-relaxed">
                        <strong>Reporter note:</strong> {flag.details}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleModerate(flag.report_id, 'hide', flag.reason, flag.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-full bg-rose-700 hover:bg-rose-800 text-white font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide Listing</span>
                    </button>
                    <button
                      onClick={() => handleModerate(flag.report_id, 'resolve', 'Moderator resolved', flag.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-500 backdrop-blur-xl">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3 opacity-80" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">Moderation queue clear.</p>
                <p className="text-[11px] text-slate-400 mt-1">No pending community flags or security incidents reported.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALL LISTINGS MANAGEMENT */}
        {activeTab === 'reports' && (
          <div className="flex flex-col gap-4">
            <div className="p-3.5 bg-white/95 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 flex items-center gap-2.5 shadow-xs">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reports by title, category, or location..."
                className="w-full text-xs sm:text-sm bg-transparent outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-3">
              {filteredReports.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.type === 'Found' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {r.type}
                      </span>
                      <span className="font-bold text-slate-950 dark:text-white text-sm">
                        {r.item_name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({r.location})
                      </span>
                      {r.moderation_status === 'hidden' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold border border-rose-200">
                          HIDDEN
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Status: {r.status} • Reporter: {r.reporter_name || r.reporter_email || 'Student'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/report/${r.type.toLowerCase()}/${r.id}`}
                      className="px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Inspect
                    </Link>
                    {r.moderation_status === 'hidden' ? (
                      <button
                        onClick={() => handleModerate(r.id, 'restore', 'Restored by admin')}
                        className="px-3.5 py-1.5 rounded-full bg-[#050505] dark:bg-white text-white dark:text-slate-950 font-bold hover:bg-slate-800 dark:hover:bg-slate-100 cursor-pointer"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleModerate(r.id, 'hide', 'Administrative hide')}
                        className="px-3.5 py-1.5 rounded-full border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold cursor-pointer"
                      >
                        Hide
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xl backdrop-blur-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/10 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Action</th>
                  <th className="p-4">Administrator</th>
                  <th className="p-4">Target / Detail</th>
                  <th className="p-4 pr-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="p-4 pl-6 font-bold text-slate-950 dark:text-white">
                        {log.action}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {log.admin_name || 'Admin'}
                      </td>
                      <td className="p-4 text-slate-500">
                        {log.target_report_title || log.reason || log.target_report_id || 'Campus Event'}
                      </td>
                      <td className="p-4 pr-6 text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400">
                      No security audit events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </main>
  );
}
