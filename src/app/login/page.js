"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Mail,
  KeyRound,
  RefreshCw,
  ArrowRight,
  Lock,
  Sparkles
} from 'lucide-react';

export default function Login() {
  const [authMode, setAuthMode] = useState('password'); // 'password' or 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [backupOtp, setBackupOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const emailLower = (email || '').trim().toLowerCase();
  const isStudentEmail = emailLower.endsWith('@stu.adamasuniversity.ac.in');
  const isFacultyEmail = emailLower.endsWith('@adamasuniversity.ac.in') && !isStudentEmail;
  const isPersonalEmail = emailLower.includes('@') && !isStudentEmail && !isFacultyEmail;

  // Handle Password Sign-In
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!isStudentEmail && !isFacultyEmail) {
      setError('Please enter your official Adamas University email: @stu.adamasuniversity.ac.in or @adamasuniversity.ac.in.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (res.ok) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-change'));
        }
        const redirectParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null;
        const target = (redirectParam && redirectParam.startsWith('/')) ? redirectParam : '/dashboard';
        router.push(target);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Dispatching OTP for Login
  const handleSendLoginOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!isStudentEmail && !isFacultyEmail) {
      setError('Only official Adamas University emails are accepted: @stu.adamasuniversity.ac.in or @adamasuniversity.ac.in.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), purpose: 'login' })
      });

      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setInfoMessage(`6-digit verification code sent to ${email.trim()}. Valid for 2 minutes.`);
        setCountdown(120);
        if (data.code) {
          setBackupOtp(data.code);
        }
      } else {
        setError(data.error || 'Failed to dispatch login code.');
      }
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verifying Login OTP
  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (countdown === 0) {
      setError('Your login code has expired. Please click "Resend code" below.');
      return;
    }

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: otpCode.trim() })
      });

      if (res.ok) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-change'));
        }
        const redirectParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null;
        const target = (redirectParam && redirectParam.startsWith('/')) ? redirectParam : '/dashboard';
        router.push(target);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid or expired code. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-28 pb-20 px-4 flex items-center justify-center transition-colors relative chronicle-bg-glow chronicle-grid">
      <div className="w-full max-w-md p-7 sm:p-9 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-2xl backdrop-blur-xl">
        
        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3.5 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Adamas University Secure Gate
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Sign in to AUlaf
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Institutional access to Adamas campus lost &amp; recovered asset portal.
          </p>
        </div>

        {/* Tab Selection: Password vs OTP (Chronicle Segmented Control) */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-2xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setAuthMode('password'); setError(''); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'password'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('otp'); setError(''); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'otp'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email OTP Code</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3.5 mb-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {authMode === 'password' ? (
          /* Password Form */
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Adamas Email Address
                </label>
                {isStudentEmail && (
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Student
                  </span>
                )}
                {isFacultyEmail && (
                  <span className="text-[10px] text-blue-800 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    Faculty
                  </span>
                )}
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name.id@stu.adamasuniversity.ac.in"
                className={`w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border ${isPersonalEmail ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200/80 dark:border-white/10'} text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all`}
              />
              {isPersonalEmail && (
                <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  Personal emails are not permitted. Use @stu.adamasuniversity.ac.in or @adamasuniversity.ac.in
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || isPersonalEmail}
              className="w-full py-3.5 mt-2 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In with Password</span>
              )}
            </button>
          </form>
        ) : (
          /* Email OTP Login Form */
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendLoginOtp} className="flex flex-col gap-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Adamas Email Address
                    </label>
                    {isStudentEmail && (
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Student
                      </span>
                    )}
                    {isFacultyEmail && (
                      <span className="text-[10px] text-blue-800 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        Faculty
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name.id@stu.adamasuniversity.ac.in"
                    className={`w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border ${isPersonalEmail ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200/80 dark:border-white/10'} text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all`}
                  />
                  {isPersonalEmail && (
                    <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      Personal emails are not permitted. Use your official Adamas email.
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    We will send a transient 6-digit one-time code to your institutional mailbox.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || isPersonalEmail}
                  className="w-full py-3.5 mt-2 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching Login Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit Code to Mail</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyLoginOtp} className="flex flex-col gap-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 rounded-2xl text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verification code dispatched to:
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 break-all">
                    {email}
                  </p>

                  {countdown > 0 ? (
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 py-1 px-3.5 rounded-full w-fit mx-auto mt-2.5">
                      <span>⏱️ Code valid for:</span>
                      <span className="font-mono text-emerald-950 dark:text-emerald-200 font-bold tracking-wider">
                        {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 py-1 px-3.5 rounded-full w-fit mx-auto mt-2.5">
                      <span>⚠️ Code expired. Click &quot;Resend code&quot; below.</span>
                    </div>
                  )}

                  {/* Instant Campus Passcode Auto-Fill Helper */}
                  {backupOtp && (
                    <div className="mt-3 p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-left shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[11px] font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                            Instant Passcode Helper
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOtpCode(backupOtp)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <span>Auto-Fill</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="font-mono text-xl font-extrabold tracking-widest text-emerald-950 dark:text-emerald-200">
                          {backupOtp}
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                          (Available directly if university Outlook delays mail)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Prominent Spam / Junk guidance */}
                  <div className="mt-3 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-left flex items-start gap-2 shadow-2xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                      <span className="font-bold">Not in your inbox?</span> Adamas University mail may sort external OTP emails into the <strong>Spam / Junk</strong> folder. Please check your Spam folder.
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-center">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="123456"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore
                    className="w-full py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/15 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/40 text-center text-2xl font-mono tracking-[0.35em] font-extrabold shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.trim().length !== 6 || countdown === 0}
                  className="w-full py-3.5 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify &amp; Sign In</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer font-medium"
                  >
                    &larr; Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleSendLoginOtp}
                    disabled={loading}
                    className="text-emerald-800 dark:text-emerald-400 hover:underline font-bold disabled:text-slate-400 cursor-pointer"
                  >
                    {loading ? 'Sending...' : countdown > 0 ? `Resend (${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')})` : 'Resend fresh code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col items-center gap-2.5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an AUlaf account?{' '}
            <Link href="/register" className="font-bold text-slate-950 dark:text-white hover:underline">
              Register with Adamas Email
            </Link>
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Adamas University Verified Access Only</span>
          </div>
        </div>

      </div>
    </main>
  );
}
