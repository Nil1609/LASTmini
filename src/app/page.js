"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, ShieldCheck, MapPin, Clock, ArrowRight, CheckCircle2, 
  Sparkles, KeyRound, Check, Laptop, Backpack, Calculator, BookOpen, Package
} from 'lucide-react';

function getCategoryIcon(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('elect') || cat.includes('laptop') || cat.includes('phone') || cat.includes('tab')) return Laptop;
  if (cat.includes('bag') || cat.includes('wallet') || cat.includes('purse')) return Backpack;
  if (cat.includes('acad') || cat.includes('tool') || cat.includes('calc')) return Calculator;
  if (cat.includes('key') || cat.includes('id') || cat.includes('card')) return KeyRound;
  if (cat.includes('book') || cat.includes('doc')) return BookOpen;
  return Package;
}

function getCategoryGradient(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('elect')) return 'from-blue-500/15 via-indigo-500/5 to-transparent';
  if (cat.includes('bag')) return 'from-amber-500/15 via-orange-500/5 to-transparent';
  if (cat.includes('acad')) return 'from-emerald-500/15 via-teal-500/5 to-transparent';
  if (cat.includes('key')) return 'from-purple-500/15 via-violet-500/5 to-transparent';
  return 'from-slate-500/15 via-slate-400/5 to-transparent';
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeHeroReportIndex, setActiveHeroReportIndex] = useState(0);
  const router = useRouter();

  const currentShowcase = (recentReports && recentReports.length > 0)
    ? (recentReports[activeHeroReportIndex] || recentReports[0])
    : null;

  useEffect(() => {
    const fetchStatsAndReports = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentReports(data.recent_reports || []);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatsAndReports();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/browse');
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white dark:bg-[#09090b] text-slate-900 dark:text-slate-100 transition-colors pt-20 sm:pt-24 pb-16 overflow-x-hidden chronicle-bg-glow chronicle-grid">

      {/* =========================================================================
          1. CLEAN CAMPUS HERO & INSTANT ACTIONS
          ========================================================================= */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-10 sm:pb-12">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          
          {/* Institutional Verified Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs mb-4 sm:mb-6 max-w-full">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-[11px] sm:text-xs font-semibold tracking-tight text-slate-800 dark:text-slate-200 truncate">
              Adamas University Campus Lost &amp; Found
            </span>
          </div>

          {/* Direct Title */}
          <h1 className="font-headline text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-slate-950 dark:text-white leading-[1.15] max-w-3xl">
            Recover lost belongings <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-slate-950 via-slate-800 to-emerald-800 dark:from-white dark:via-slate-200 dark:to-emerald-400 bg-clip-text text-transparent">
              across Adamas campus.
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-3 sm:mt-4 text-xs sm:text-base text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed px-1 sm:px-0">
            Authenticated recovery protocol for Adamas students and staff. Report misplaced property, hand in found items to campus custody, or claim your belongings securely.
          </p>

          {/* Direct High-Utility Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 mt-6 sm:mt-8 w-full max-w-sm sm:max-w-none">
            <Link
              href="/report/lost"
              className="nav-pill-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold tracking-tight shadow-sm hover:shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Report Lost Item</span>
            </Link>

            <Link
              href="/report/found"
              className="nav-pill-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold tracking-tight shadow-sm hover:shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Found Item</span>
            </Link>

            <Link
              href="/browse"
              className="nav-pill-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold tracking-tight shadow-xs hover:bg-slate-50 dark:hover:bg-slate-850"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span>Browse All Items</span>
              {stats?.totalActive !== undefined && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                  {stats.totalActive}
                </span>
              )}
            </Link>
          </div>

          {/* Fast Search Omnibar */}
          <form onSubmit={handleSearchSubmit} className="w-full max-w-xl mt-5 sm:mt-6 px-1">
            <div className="relative flex items-center rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-white/10 shadow-xs focus-within:border-emerald-700 dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all p-1.5">
              <Search className="w-4 h-4 text-slate-400 ml-2.5 sm:ml-3.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items, keywords, or buildings..."
                className="w-full min-w-0 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none"
              />
              <button
                type="submit"
                className="shrink-0 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold tracking-tight transition-all cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Ledger Stats Strip */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-slate-500 dark:text-slate-400 w-full">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Campus Ledger: <strong className="text-slate-900 dark:text-white font-semibold">{stats?.totalActive ?? 0} Active Reports</strong></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Adamas Single Sign-On</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Secure Handover Verification</span>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          2. DYNAMIC LIVE CUSTODY ITEM SHOWCASE (WHEN REAL REPORTS EXIST)
          ========================================================================= */}
      {recentReports && recentReports.length > 0 && currentShowcase && (
        <section className="w-full px-4 sm:px-6 lg:px-8 pb-12">
          <div className="max-w-5xl mx-auto">
            
            <div className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 shadow-lg overflow-hidden backdrop-blur-md">
              
              <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-slate-850/50">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Active Item in Campus Custody Ledger
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>LIVE RECOVERY LOG</span>
                </div>
              </div>

              <div className="relative p-6 sm:p-8 border-b border-slate-200/70 dark:border-white/5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* Left: Dynamic Visual */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/5 relative overflow-hidden group min-h-[200px]">
                    <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(currentShowcase.category)} opacity-70 transition-colors duration-500`} />
                    
                    {currentShowcase.image ? (
                      <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-md border border-slate-200/80 dark:border-white/10 relative z-10 bg-white dark:bg-slate-900 flex items-center justify-center">
                        <img 
                          src={currentShowcase.image} 
                          alt={currentShowcase.item_name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-slate-850 shadow-md border border-slate-200/70 dark:border-white/10 flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:scale-105">
                        {(() => {
                          const IconComp = getCategoryIcon(currentShowcase.category);
                          return <IconComp className="w-10 h-10 text-slate-800 dark:text-white stroke-[1.5]" />;
                        })()}
                      </div>
                    )}

                    <div className="mt-3 text-center relative z-10">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Category: {currentShowcase.category || 'General'}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate max-w-[200px]">
                        {currentShowcase.item_name}
                      </h3>
                    </div>
                  </div>

                  {/* Right: Metadata */}
                  <div className="lg:col-span-7 flex flex-col justify-center gap-3">
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                        currentShowcase.type === 'Found'
                          ? 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-100/80 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                      }`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {currentShowcase.type === 'Found' ? 'Safe Custody Deposit' : 'Active Lost Report'}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                        Reported: {currentShowcase.date ? new Date(currentShowcase.date).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold font-headline text-slate-900 dark:text-white tracking-tight">
                        {currentShowcase.item_name}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed line-clamp-2">
                        {currentShowcase.description || 'Reported on Adamas University campus.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Campus Location
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{currentShowcase.location || 'Adamas Campus'}</span>
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Current Custody
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{currentShowcase.custody || (currentShowcase.type === 'Found' ? 'Held by Finder' : 'Awaiting Finder')}</span>
                        </span>
                      </div>

                      {currentShowcase.verification_question ? (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 sm:col-span-2">
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                            <span>Secret Verification Question</span>
                            <span className="text-emerald-700 dark:text-emerald-400">Enforced</span>
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200 italic">
                            &ldquo;{currentShowcase.verification_question}&rdquo;
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <Link
                        href={`/report/${currentShowcase.type.toLowerCase()}/${currentShowcase.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold tracking-tight shadow-xs transition-all cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{currentShowcase.type === 'Found' ? 'Claim This Belonging' : 'I Found This Item'}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>

                      <Link
                        href="/browse"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"
                      >
                        <span>View all {stats?.totalActive || ''} reports</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                  </div>

                </div>
              </div>

              {recentReports.length > 1 && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-850/90 border-t border-slate-200/70 dark:border-white/5 overflow-x-auto">
                  <div className="flex items-center gap-2 justify-start sm:justify-center min-w-max">
                    {recentReports.map((item, index) => {
                      const isSelected = index === activeHeroReportIndex;
                      const IconComp = getCategoryIcon(item.category);
                      return (
                        <button
                          key={item.id || index}
                          onClick={() => setActiveHeroReportIndex(index)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#050505] text-white dark:bg-white dark:text-slate-950 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/5'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[120px]">{item.item_name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          3. RECENT CAMPUS REPORTS & ACTIVE RECOVERIES
          ========================================================================= */}
      <section className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Live Campus Feed
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white mt-0.5">
                Recent campus reports &amp; recoveries
              </h2>
            </div>

            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"
            >
              <span>View all reports</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentReports && recentReports.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentReports.slice(0, 6).map((report) => (
                <div
                  key={report.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        report.type === 'lost'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      }`}>
                        {report.type === 'lost' ? 'Lost Item' : 'Found Item'}
                      </span>

                      <span className="text-[11px] text-slate-400">
                        {report.date ? new Date(report.date).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white truncate">
                      {report.item_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {report.description || 'Reported on Adamas University campus.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate max-w-[65%]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{report.location || 'Adamas Campus'}</span>
                    </span>

                    <Link
                      href={`/browse?q=${encodeURIComponent(report.item_name)}`}
                      className="font-semibold text-emerald-800 dark:text-emerald-400 hover:underline"
                    >
                      View &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-center">
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                No active lost reports right now.
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All reported items are currently accounted for. If you misplaced or found something on campus, submit a report below.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/report/lost"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Report Lost Item</span>
                </Link>
                <Link
                  href="/report/found"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit Found Item</span>
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>

    </main>
  );
}
