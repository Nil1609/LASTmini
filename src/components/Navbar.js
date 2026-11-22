"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Plus, LogOut, LogIn, Menu, X, Shield, Sun, Moon, ShieldAlert, MessageSquare } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function Navbar() {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('aulaf_user_cache');
        return cached ? JSON.parse(cached) : null;
      } catch (e) { return null; }
    }
    return null;
  });
  const [activeReportsCount, setActiveReportsCount] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [activePath, setActivePath] = useState(pathname);

  // Synchronize activePath whenever pathname changes
  useEffect(() => {
    if (pathname) {
      setActivePath(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setUser(data.user || null);
          if (data.user && typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('aulaf_user_cache', JSON.stringify(data.user));
            } catch (e) {}
          }
        } else if (res.status === 401 && isMounted) {
          setUser(null);
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.removeItem('aulaf_user_cache');
              sessionStorage.removeItem('aulaf_dashboard_cache');
            } catch (e) {}
          }
        }
      } catch (error) {
        // Keep previous auth state during transient network fluctuations
      }
    };

    fetchUser();

    const handleAuthChange = () => fetchUser();
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('focus', handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('focus', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (res.ok && isMounted) {
          const data = await res.json();
          setActiveReportsCount(data.stats?.totalActive ?? 0);
        }
      } catch (err) {
        // Fallback gracefully
      }
    };

    fetchStats();
    return () => { isMounted = false; };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('aulaf_user_cache');
          sessionStorage.removeItem('aulaf_dashboard_cache');
        } catch (e) {}
        window.dispatchEvent(new Event('auth-change'));
      }
      setActivePath('/');
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path) => {
    const current = activePath || pathname || '';
    if (!current) return false;
    if (path === '/') return current === '/';
    return current.startsWith(path);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 transition-colors">
      <div className="h-14 sm:h-16 w-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 max-w-[1440px] mx-auto">
        
        {/* Brand with Official Adamas University Crest & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
            {/* Adamas University Logo Badge */}
            <div className="relative flex items-center justify-center p-1 rounded-xl bg-white dark:bg-white/95 border border-slate-200/90 dark:border-white/20 shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/adamas-university.png"
                alt="Adamas University Crest"
                className="h-7 w-auto sm:h-8 object-contain"
                loading="eager"
              />
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-headline font-bold text-lg sm:text-xl tracking-[-0.03em] text-slate-950 dark:text-white flex items-center gap-1 leading-none">
                AUlaf
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold hidden xl:inline border-l border-slate-200 dark:border-white/10 pl-2">
                Campus Registry
              </span>
            </div>
          </Link>
          
          <div suppressHydrationWarning className="hidden 2xl:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-[11px] font-medium text-slate-600 dark:text-slate-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-700 dark:bg-emerald-400"></span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
              {activeReportsCount !== null ? `${activeReportsCount} Active Reports` : 'Adamas Ledger Active'}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Center Pill */}
        <div className="hidden lg:flex items-center justify-center">
          <nav className="flex items-center gap-1 p-1 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs backdrop-blur-md">
            <Link
              href="/"
              prefetch={true}
              onClick={() => setActivePath('/')}
              className={`nav-pill-btn px-3.5 py-1.5 rounded-full text-xs ${
                isActive('/')
                  ? 'font-semibold bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10'
                  : 'font-medium text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Home
            </Link>
            
            <Link
              href="/browse"
              prefetch={true}
              onClick={() => setActivePath('/browse')}
              className={`nav-pill-btn px-3.5 py-1.5 rounded-full text-xs ${
                isActive('/browse')
                  ? 'font-semibold bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10'
                  : 'font-medium text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Browse
            </Link>

            <Link
              href="/chat"
              prefetch={true}
              onClick={() => setActivePath('/chat')}
              className={`nav-pill-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs ${
                isActive('/chat')
                  ? 'font-semibold bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10'
                  : 'font-medium text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <span>Messages</span>
              {user?.conversationsCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </Link>

            <Link
              href="/dashboard"
              prefetch={true}
              onClick={() => setActivePath('/dashboard')}
              className={`nav-pill-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs ${
                isActive('/dashboard')
                  ? 'font-semibold bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10'
                  : 'font-medium text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Dashboard
            </Link>

            <Link
              href="/profile"
              prefetch={true}
              onClick={() => setActivePath('/profile')}
              className={`nav-pill-btn px-3.5 py-1.5 rounded-full text-xs ${
                isActive('/profile')
                  ? 'font-semibold bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10'
                  : 'font-medium text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Profile
            </Link>

            {/* Admin link visible only to authorized personnel */}
            {user?.isAdmin && (
              <Link
                href="/admin"
                prefetch={true}
                onClick={() => setActivePath('/admin')}
                className={`nav-pill-btn flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs ${
                  isActive('/admin')
                    ? 'font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 shadow-xs border border-amber-300 dark:border-amber-700'
                    : 'font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Moderation</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Action Controls & Profile Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark/Light Mode"
            className="nav-pill-btn flex items-center justify-center w-8 h-8 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Quick Messages Access Button - Always visible at top for all users across all viewports */}
          <Link
            href="/chat"
            onClick={() => setActivePath('/chat')}
            aria-label="Recovery Messages"
            className={`nav-pill-btn flex items-center justify-center w-8 h-8 rounded-full border shadow-xs relative ${
              isActive('/chat')
                ? 'bg-[#050505] text-white dark:bg-white dark:text-slate-950 border-slate-950 dark:border-white font-semibold'
                : 'bg-slate-100/80 dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Messages & Handover Inquiries"
          >
            <MessageSquare className="w-4 h-4" />
            {user?.conversationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white dark:border-slate-950"></span>
              </span>
            )}
          </Link>

          <Link
            href="/browse"
            aria-label="Search Reports"
            className="nav-pill-btn hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs"
          >
            <Search className="w-4 h-4" />
          </Link>

          <Link
            href="/report/lost"
            className="nav-pill-btn inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs font-semibold tracking-tight shadow-sm hover:shadow shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Report Item</span>
            <span className="sm:hidden text-[11px]">Report</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/profile"
                prefetch={true}
                className="nav-pill-btn flex items-center justify-center w-8 h-8 rounded-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30 shadow-xs group overflow-hidden"
                title={`${user.name || user.full_name || 'Student'} (${user.school || user.department || 'Adamas'}) — View Profile`}
              >
                <div className="w-full h-full flex items-center justify-center">
                  {user.avatar_url || user.avatar ? (
                    <img
                      src={user.avatar_url || user.avatar}
                      alt=""
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    style={{ display: (user.avatar_url || user.avatar) ? 'none' : 'flex' }}
                    className="w-6 h-6 rounded-full bg-[#050505] dark:bg-emerald-600 text-white items-center justify-center text-xs font-bold font-headline overflow-hidden group-hover:scale-105 transition-transform"
                  >
                    {(user.name || user.full_name) ? (user.name || user.full_name).charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
              </Link>
              
              <button
                onClick={handleLogout}
                className="nav-pill-btn flex items-center justify-center w-8 h-8 rounded-full text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="nav-pill-btn inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 bg-white/80 dark:bg-slate-900/80 text-xs font-semibold text-slate-900 dark:text-slate-100 shrink-0"
              title="Sign In"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-lg flex flex-col gap-2">
          {/* Institutional Branding Header in Mobile Dropdown */}
          <div className="flex items-center gap-2.5 pb-2.5 mb-1 border-b border-slate-100 dark:border-white/10 px-2">
            <div className="p-1 rounded-lg bg-white dark:bg-white/95 border border-slate-200 dark:border-white/20 shadow-xs">
              <img
                src="/adamas-university.png"
                alt="Adamas University"
                className="h-6 w-auto object-contain"
              />
            </div>
            <div>
              <p className="font-headline font-bold text-xs text-slate-900 dark:text-white leading-tight">Adamas University</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Campus Asset Recovery Ledger</p>
            </div>
          </div>
          <Link
            href="/"
            prefetch={true}
            onClick={() => { setActivePath('/'); setMobileMenuOpen(false); }}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${isActive('/') ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-300'}`}
          >
            Home
          </Link>
          <Link
            href="/browse"
            prefetch={true}
            onClick={() => { setActivePath('/browse'); setMobileMenuOpen(false); }}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${isActive('/browse') ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-300'}`}
          >
            Browse Reports
          </Link>
          <Link
            href="/chat"
            prefetch={true}
            onClick={() => { setActivePath('/chat'); setMobileMenuOpen(false); }}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${isActive('/chat') ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-300'}`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Recovery Messages</span>
            </div>
            {user?.conversationsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {user.conversationsCount} Active
              </span>
            )}
          </Link>
          <Link
            href="/dashboard"
            prefetch={true}
            onClick={() => { setActivePath('/dashboard'); setMobileMenuOpen(false); }}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${isActive('/dashboard') ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-300'}`}
          >
            Recovery Dashboard
          </Link>
          <Link
            href="/profile"
            prefetch={true}
            onClick={() => { setActivePath('/profile'); setMobileMenuOpen(false); }}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${isActive('/profile') ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-300'}`}
          >
            {user?.avatar_url || user?.avatar ? (
              <img
                src={user.avatar_url || user.avatar}
                alt="Profile"
                className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-white/20"
              />
            ) : null}
            <span>Student Profile</span>
          </Link>
          {user?.isAdmin && (
            <Link
              href="/admin"
              onClick={() => { setActivePath('/admin'); setMobileMenuOpen(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${isActive('/admin') ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-semibold' : 'text-amber-700 dark:text-amber-400'}`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Campus Moderation Console</span>
            </Link>
          )}
          
          <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
            <Link
              href="/report/lost"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#050505] dark:bg-white text-white dark:text-slate-950 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Item</span>
            </Link>
            {!user ? (
              <Link
                href="/login"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign In</span>
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
