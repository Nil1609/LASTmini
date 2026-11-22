"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  Shield,
  Clock,
  ArrowRight,
  Inbox,
  Lock,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

export default function ConversationsIndexPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
        } else if (res.status === 401) {
          router.push('/login?redirect=/chat');
        } else {
          setError('Failed to load conversations.');
        }
      } catch (err) {
        setError('Network error loading conversations.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [router]);

  return (
    <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-colors relative chronicle-bg-glow chronicle-grid">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation & Context */}
        <div className="flex items-center justify-between mb-6 text-xs">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-medium backdrop-blur-md transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
            <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Adamas Verified Channels</span>
          </div>
        </div>

        {/* Header */}
        <div className="p-7 sm:p-9 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xl backdrop-blur-xl mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Campus Communication Terminal
            </span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Recovery Inquiries &amp; Messages
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Coordinate secure asset handover, answer item verification questions, and generate one-time collection OTPs.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-16 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-500 animate-pulse">
            Loading conversations...
          </div>
        ) : error ? (
          <div className="p-10 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-rose-200 text-center text-xs text-rose-600 shadow-sm">
            {error}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-16 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400 backdrop-blur-xl">
            <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No Active Recovery Conversations</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              When an asset claim is made or you inquire about a found item, private encrypted handover terminals open here.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/browse"
                className="nav-pill-btn px-5 py-2.5 bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs font-semibold rounded-full shadow-xs transition-all"
              >
                Browse Campus Ledger
              </Link>
              <Link
                href="/dashboard"
                className="nav-pill-btn px-5 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full shadow-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        {conv.report_type || 'Asset'} Recovery
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        conv.status === 'resolved' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                      }`}>
                        {conv.status || 'Active'}
                      </span>
                    </div>
                    <h3 className="font-headline font-bold text-base sm:text-lg text-slate-950 dark:text-white">
                      {conv.report_title || 'Campus Asset Recovery'}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>Updated {conv.updated_at ? new Date(conv.updated_at).toLocaleDateString() : 'recently'}</span>
                    </p>
                  </div>
                </div>

                <Link
                  href={`/chat/${conv.id}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs font-semibold shadow-xs transition-all shrink-0"
                >
                  <span>Open Terminal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
