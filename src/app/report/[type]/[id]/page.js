"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Clock,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Lock,
  MessageSquare,
  HelpCircle,
  Flag,
  Trash2,
  Check,
  X,
  Sparkles,
  Building,
  Zap
} from 'lucide-react';

export default function ReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  // Instant hydration from cache for sub-10ms render
  const [report, setReport] = useState(() => {
    if (typeof window !== 'undefined' && id) {
      try {
        const cached = sessionStorage.getItem(`aulaf_report_${id}`);
        return cached ? JSON.parse(cached) : null;
      } catch (e) { return null; }
    }
    return null;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('aulaf_user_cache');
        return cached ? JSON.parse(cached) : null;
      } catch (e) { return null; }
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && id) {
      try {
        return !sessionStorage.getItem(`aulaf_report_${id}`);
      } catch (e) { return true; }
    }
    return true;
  });
  const [error, setError] = useState('');

  // Modals
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);

  // Claim Form State
  const [claimDetails, setClaimDetails] = useState('');
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimMessage, setClaimMessage] = useState({ text: '', type: '' });

  // Flag Form State
  const [flagReason, setFlagReason] = useState('Incorrect Information');
  const [flagDetails, setFlagDetails] = useState('');
  const [submittingFlag, setSubmittingFlag] = useState(false);
  const [flagSuccess, setFlagSuccess] = useState(false);

  // Author Action Loading
  const [actionLoading, setActionLoading] = useState(false);

  // AI Matches
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        // Fetch current user and report concurrently in parallel
        const [userRes, reportRes] = await Promise.all([
          fetch('/api/auth/me', { cache: 'no-store' }),
          fetch(`/api/reports/${id}`, { cache: 'no-store' })
        ]);

        if (userRes.ok && isMounted) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);
          try {
            sessionStorage.setItem('aulaf_user_cache', JSON.stringify(userData.user));
          } catch (e) {}
        }

        if (reportRes.ok && isMounted) {
          const data = await reportRes.json();
          setReport(data.report);
          try {
            sessionStorage.setItem(`aulaf_report_${id}`, JSON.stringify(data.report));
          } catch (e) {}

          // Fetch AI matches
          if (data.report && data.report.id) {
            setMatchesLoading(true);
            try {
              const matchRes = await fetch(`/api/match?reportId=${data.report.id}&limit=10`);
              if (matchRes.ok) {
                const matchData = await matchRes.json();
                setMatches(matchData.matches || []);
              }
            } catch(e) {} finally {
              setMatchesLoading(false);
            }
          }
        } else if (isMounted && !report) {
          setError('Report not found or has been removed.');
        }
      } catch (err) {
        console.error(err);
        if (isMounted && !report) {
          setError('Error loading report details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [id]);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setSubmittingClaim(true);
    setClaimMessage({ text: '', type: '' });

    try {
      const res = await fetch(`/api/reports/${id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_details: claimDetails,
          verification_answer: verificationAnswer,
          contact_note: contactNote
        })
      });

      const data = await res.json();
      if (res.ok) {
        setClaimMessage({
          text: 'Claim submitted! Redirecting to secure recovery chat...',
          type: 'success'
        });
        setTimeout(() => {
          router.push(`/chat/${data.conversationId}`);
        }, 1500);
      } else {
        setClaimMessage({ text: data.error || 'Failed to submit claim.', type: 'error' });
      }
    } catch (err) {
      setClaimMessage({ text: 'Network connection error.', type: 'error' });
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setSubmittingFlag(true);
    try {
      const res = await fetch(`/api/reports/${id}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: flagReason,
          details: flagDetails
        })
      });

      if (res.ok) {
        setFlagSuccess(true);
        setTimeout(() => {
          setFlagModalOpen(false);
          setFlagSuccess(false);
        }, 2000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to report listing.');
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setSubmittingFlag(false);
    }
  };

  const handleMarkResolved = async () => {
    const isLost = report.type === 'Lost';
    const message = isLost
      ? 'Did you find or recover your lost item? Marking it as resolved will close this report and remove it from active campus listings.'
      : 'Has this found item been returned to its owner? Marking it as resolved will remove it from active recovery claims.';
    if (!confirm(message)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved' })
      });
      if (res.ok) {
        setReport({ ...report, status: 'Resolved' });
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!confirm('Are you sure you want to permanently remove this listing?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to delete report.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-28 pb-16 px-4 text-center relative chronicle-bg-glow chronicle-grid">
        <div className="max-w-xl mx-auto p-12 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl animate-pulse text-xs text-slate-500">
          Loading report dossier...
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-28 pb-16 px-4 text-center relative chronicle-bg-glow chronicle-grid">
        <div className="max-w-md mx-auto p-8 bg-white/95 dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-xl backdrop-blur-xl">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2.5" />
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Listing Unavailable</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error || 'This report does not exist or has been archived.'}</p>
          <Link href="/browse" className="mt-5 inline-block px-5 py-2.5 bg-[#050505] dark:bg-white text-white dark:text-slate-950 text-xs font-semibold rounded-full shadow-xs">
            Back to Directory
          </Link>
        </div>
      </main>
    );
  }

  const isResolved = report.status === 'Resolved';
  const isAuthor = report.isOwner;

  return (
    <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-colors relative chronicle-bg-glow chronicle-grid">
      <div className="max-w-5xl mx-auto">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-medium backdrop-blur-md transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Campus Ledger</span>
          </Link>

          {/* Report an issue flag */}
          <button
            onClick={() => setFlagModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report this Listing</span>
          </button>
        </div>

        {/* Resolved Banner */}
        {isResolved && (
          <div className="mb-8 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold">
                  {report.type === 'Lost' ? 'Item Recovered & Resolved:' : 'Handover Complete & Resolved:'}
                </span>
                <span className="ml-1">
                  This report has been marked as resolved and removed from active campus ledger listings.
                </span>
              </div>
            </div>
            {isAuthor && (
              <button
                onClick={handleDeleteReport}
                disabled={actionLoading}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-full border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            )}
          </div>
        )}

        {/* Two-Column Layout (Chronicle Dossier) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Visual Evidence & Custody Info (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Image Preview Box */}
            <div className="w-full rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 overflow-hidden shadow-xl backdrop-blur-xl">
              {report.image ? (
                <div className="w-full h-80 bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-3">
                  <img
                    src={report.image}
                    alt={report.item_name}
                    className="w-full h-full object-contain rounded-2xl"
                  />
                </div>
              ) : (
                <div className="w-full h-72 bg-slate-100/70 dark:bg-white/[0.02] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <Tag className="w-10 h-10 mb-2 opacity-50" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">No photograph attached</span>
                  <span className="text-[11px] text-slate-400 mt-1">Verification will rely on physical characteristics and proof</span>
                </div>
              )}

              {/* Endorsement badge */}
              <div className="p-4 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex items-center gap-2.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Adamas Verified Campus Post • #{report.id.substring(0, 8)}
                </span>
              </div>
            </div>

            {/* Custody Information Card */}
            {report.custody && (
              <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Designated Custody Depot
                </span>
                <p className="font-bold text-slate-950 dark:text-white text-sm">
                  {report.custody}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Physical release requires in-person presence at custody desk with dynamic OTP verification.
                </p>
              </div>
            )}

            {/* Safety Protocol Reminder */}
            <div className="p-6 rounded-3xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-950 dark:text-white mb-2">
                <Lock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Enterprise Campus Safety Rules</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400 flex flex-col gap-1.5 leading-relaxed">
                <li>Never share banking details or passcodes.</li>
                <li>Conduct handovers strictly in public campus zones.</li>
                <li>Verify 6-digit dynamic code upon physical receipt.</li>
              </ul>
            </div>

          </div>

          {/* Right Column: Metadata, Description & Claims (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            <div className="p-7 sm:p-9 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xl backdrop-blur-xl">
              
              {/* Type and Status Chips */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  report.type === 'Found'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {report.type} Item
                </span>

                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isResolved
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10'
                }`}>
                  {report.status}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-snug">
                {report.item_name}
              </h1>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3.5 leading-relaxed">
                {report.description || 'No detailed description provided by the reporter.'}
              </p>

              {/* Structured Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-white/5 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</span>
                  <p className="font-bold text-slate-950 dark:text-white mt-1">{report.category}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Campus Location</span>
                  <p className="font-bold text-slate-950 dark:text-white mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{report.location}</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date Reported</span>
                  <p className="font-bold text-slate-950 dark:text-white mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{report.date} {report.time ? `(${report.time})` : ''}</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reporter</span>
                  <p className="font-bold text-slate-950 dark:text-white mt-1">{report.reporter_name}</p>
                </div>
              </div>

              {/* Tags / Characteristics */}
              {report.characteristics && (
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-white/5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Characteristics &amp; Features
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {report.characteristics.split(',').map((char, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200/60 dark:border-white/5"
                      >
                        #{char.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Challenge Notice */}
              {report.verification_question && (
                <div className="mt-5 p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                    <HelpCircle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span>Ownership Verification Challenge Active</span>
                  </div>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1.5 leading-relaxed">
                    Question: &ldquo;{report.verification_question}&rdquo;
                  </p>
                  {isAuthor && report.verification_answer && (
                    <div className="mt-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      Secret Answer (Author View Only): <strong>{report.verification_answer}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons Section */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-3">
                {isAuthor ? (
                  // Author Actions
                  <>
                    {!isResolved ? (
                      <button
                        onClick={handleMarkResolved}
                        disabled={actionLoading}
                        className="px-5 py-2.5 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                        title={report.type === 'Lost' ? 'Mark resolved if you recovered your item' : 'Mark resolved if item has been returned'}
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {report.type === 'Lost' ? 'I Found My Item / Mark Resolved' : 'Item Handed Over / Mark Resolved'}
                        </span>
                      </button>
                    ) : (
                      <span className="px-3.5 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Resolved &amp; Removed from Active Ledger</span>
                      </span>
                    )}
                    <button
                      onClick={handleDeleteReport}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-full border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Permanently delete this report from the database"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Listing</span>
                    </button>
                    <Link
                      href="/dashboard"
                      className="px-4 py-2.5 rounded-full border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      View in Dashboard
                    </Link>
                  </>
                ) : (
                  // Viewer Actions
                  <>
                    {!isResolved ? (
                      <button
                        onClick={() => setClaimModalOpen(true)}
                        className="px-6 py-3 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {report.type === 'Lost' ? 'I Found This Item / Contact Owner' : 'Claim Ownership / Contact Finder'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">
                        This listing is resolved and removed from active circulation.
                      </span>
                    )}
                  </>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* CLAIM / FOUND COORDINATION MODAL (Chronicle Glass Card) */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-2xl p-7 sm:p-9 relative text-xs backdrop-blur-xl">
            
            <button
              onClick={() => setClaimModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {report.type === 'Lost' ? 'Lost Item Recovery Contact' : 'Secure Ownership Verification'}
              </span>
              <h3 className="font-headline text-lg sm:text-xl font-bold text-slate-950 dark:text-white mt-1">
                {report.type === 'Lost'
                  ? `I Found This Item — Contact Owner`
                  : `Submit Ownership Proof for “${report.item_name}”`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {report.type === 'Lost'
                  ? 'Let the student who reported this lost item know where you found it, where it is deposited, or how to arrange a safe campus handover.'
                  : 'Provide private identifying proof (unique markings, serial numbers, wallpapers) to challenge and confirm ownership.'}
              </p>
            </div>

            {claimMessage.text && (
              <div className={`p-3.5 rounded-2xl mb-5 text-xs font-semibold ${
                claimMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                {claimMessage.text}
              </div>
            )}

            <form onSubmit={handleClaimSubmit} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {report.type === 'Lost'
                    ? 'Where Did You Find It / Details for Owner *'
                    : 'Private Identifying Details & Evidence *'}
                </label>
                <textarea
                  value={claimDetails}
                  onChange={(e) => setClaimDetails(e.target.value)}
                  rows={3}
                  required
                  placeholder={
                    report.type === 'Lost'
                      ? 'e.g. Found near Central Library 2nd floor desk. Handed to security guard or available to meet in SOET foyer...'
                      : 'Describe unique marks, serial number prefix, internal contents, or modifications known only to you...'
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
                />
              </div>

              {report.verification_question && (
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-1.5">
                    Answer Verification Challenge: &ldquo;{report.verification_question}&rdquo;
                  </label>
                  <input
                    type="text"
                    value={verificationAnswer}
                    onChange={(e) => setVerificationAnswer(e.target.value)}
                    placeholder="Enter confidential verification answer..."
                    className="w-full px-4 py-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-slate-900 dark:text-white outline-none text-xs sm:text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Message / Availability for Handover
                </label>
                <input
                  type="text"
                  value={contactNote}
                  onChange={(e) => setContactNote(e.target.value)}
                  placeholder="e.g. Free to meet near Central Library counter at 1 PM..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="px-5 py-2.5 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs font-bold disabled:opacity-50 shadow-xs"
                >
                  {submittingClaim
                    ? 'Sending...'
                    : report.type === 'Lost'
                    ? 'Notify Owner & Start Chat'
                    : 'Submit Claim & Start Chat'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* REPORT ISSUE / FLAG MODAL */}
      {flagModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-2xl p-7 relative text-xs backdrop-blur-xl">
            
            <button
              onClick={() => setFlagModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-headline text-base font-bold text-slate-950 dark:text-white mb-1">
              Report Listing to Campus Security
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Flag duplicate, misleading, or inappropriate posts for administrative review.
            </p>

            {flagSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-center font-semibold">
                Report submitted to campus moderation. Thank you for keeping AUlaf safe!
              </div>
            ) : (
              <form onSubmit={handleFlagSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Reason</label>
                  <select
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Incorrect Information">Incorrect or Misleading Information</option>
                    <option value="Duplicate Report">Duplicate Listing</option>
                    <option value="Inappropriate Content">Inappropriate or Offensive Content</option>
                    <option value="Spam / Prank">Spam or Prank Post</option>
                    <option value="Other">Other Violation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Additional Details (Optional)</label>
                  <textarea
                    value={flagDetails}
                    onChange={(e) => setFlagDetails(e.target.value)}
                    rows={2}
                    placeholder="Provide context for the moderator..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setFlagModalOpen(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFlag}
                    className="px-5 py-2 rounded-full bg-rose-700 hover:bg-rose-800 text-white font-bold disabled:opacity-50"
                  >
                    {submittingFlag ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* FLAG MODAL end */}

      {/* ✨ AI MATCHES SECTION */}
      <div className="max-w-5xl mx-auto mt-10 px-0">
        <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-slate-900/90 shadow-xl backdrop-blur-xl p-7 sm:p-9">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Zap className="w-4 h-4 text-violet-700 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white tracking-tight">
                {report.type === 'Lost'
                  ? '✨ AI-Matched Found Items'
                  : '✨ AI-Matched Lost Items'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {report.type === 'Lost'
                  ? 'Potential matches found by our matching engine, ranked by similarity'
                  : 'These lost item reports may belong to this found item'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {matchesLoading ? (
              /* Skeleton Cards */
              <div className="flex flex-col gap-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 h-28"
                  />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
                No matches found above 65% similarity yet.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {[...matches]
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((match) => {
                    const score = Math.round(match.score || 0);
                    const isStrong = score >= 80;
                    return (
                      <div
                        key={match.id}
                        className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow"
                      >
                        {/* Top Row: Name + Type badge + Match label */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-950 dark:text-white">
                              {match.item_name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              match.type === 'Found'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}>
                              {match.type}
                            </span>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isStrong
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}>
                            {isStrong ? `Strong Match 🟢 ${score}%` : `Possible Match 🟡 ${score}%`}
                          </span>
                        </div>

                        {/* Score Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 mb-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isStrong ? 'bg-emerald-500' : 'bg-amber-400'}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>

                        {/* Attribute Chips */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {match.category && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200/60 dark:border-white/5">
                              {match.category}
                            </span>
                          )}
                          {match.color && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200/60 dark:border-white/5">
                              🎨 {match.color}
                            </span>
                          )}
                          {match.brand && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200/60 dark:border-white/5">
                              {match.brand}
                            </span>
                          )}
                        </div>

                        {/* Location & Date + View Link */}
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-3">
                            {match.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {match.location}
                              </span>
                            )}
                            {match.date && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {match.date}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/report/${match.type?.toLowerCase()}/${match.id}`}
                            className="shrink-0 px-3 py-1.5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-[11px] font-bold hover:opacity-80 transition-opacity"
                          >
                            View Report →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* AI MATCHES SECTION end */}

    </main>
  );
}
