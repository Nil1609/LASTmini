"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Mail,
  ArrowRight,
  RefreshCw,
  User,
  GraduationCap,
  Building,
  Lock,
  Phone,
  Sparkles,
  Eye,
  EyeOff,
  Hash,
  KeyRound,
  ChevronDown,
  Clock,
  Shield,
  Check
} from 'lucide-react';

const SCHOOLS = [
  'SOET (Engineering & Technology)',
  'SOBE (Business & Economics)',
  'SOLJ (Law & Justice)',
  'SOMC (Media & Communication)',
  'SOMS (Medical Sciences)',
  'SOBAS (Basic & Applied Sciences)',
  'SOSA (Smart Agriculture)',
  'SOLACS (Liberal Arts & Culture)',
  'SOE (School of Education)'
];

export default function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [code, setCode] = useState('');
  const [backupOtp, setBackupOtp] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'Student',
    roll_number: '',
    reg_number: '',
    faculty_id: '',
    school: 'SOET (Engineering & Technology)',
    phone: ''
  });
  const router = useRouter();

  // Cooldown countdown effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const emailLower = (formData.email || '').trim().toLowerCase();
  const isStudentEmail = emailLower.endsWith('@stu.adamasuniversity.ac.in');
  const isFacultyEmail = emailLower.endsWith('@adamasuniversity.ac.in') && !isStudentEmail;
  const isPersonalEmail = emailLower.includes('@') && !isStudentEmail && !isFacultyEmail;

  const passwordsMatch = formData.confirm_password.length > 0 && formData.password === formData.confirm_password;
  const passwordsMismatch = formData.confirm_password.length > 0 && formData.password !== formData.confirm_password;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'email') {
        const cl = value.trim().toLowerCase();
        if (cl.endsWith('@stu.adamasuniversity.ac.in')) {
          next.role = 'Student';
        } else if (cl.endsWith('@adamasuniversity.ac.in')) {
          next.role = 'Faculty';
        }
      }
      return next;
    });
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!isStudentEmail && !isFacultyEmail) {
      setError('Registration is strictly restricted to Adamas University accounts: @stu.adamasuniversity.ac.in (students) or @adamasuniversity.ac.in (faculty/staff).');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Strict validation: Roll Number and Registration Number must be different
    if (formData.role === 'Student') {
      const roll = (formData.roll_number || '').trim();
      const reg = (formData.reg_number || '').trim();

      if (!roll) {
        setError('College Roll Number is required for student registration.');
        return;
      }

      if (!reg) {
        setError('University Registration Number is required for student registration.');
        return;
      }

      if (roll.toLowerCase() === reg.toLowerCase()) {
        setError('College Roll Number and University Registration Number cannot be the same. Please check your Adamas ID card.');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          purpose: 'register',
          roll_number: formData.role === 'Student' ? formData.roll_number.trim() : undefined,
          reg_number: formData.role === 'Student' ? formData.reg_number.trim() : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCode('');
        setStep(2);
        setInfoMessage(`6-digit verification code dispatched to ${formData.email.trim()}. Valid for 2 minutes.`);
        setCountdown(120);
        if (data.code) {
          setBackupOtp(data.code);
        }
      } else {
        setError(data.error || 'Failed to dispatch verification code.');
      }
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    setError('');
    setInfoMessage('');
    setResending(true);

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          purpose: 'register',
          roll_number: formData.role === 'Student' ? formData.roll_number.trim() : undefined,
          reg_number: formData.role === 'Student' ? formData.reg_number.trim() : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCode('');
        setInfoMessage('Fresh 6-digit verification code dispatched.');
        setCountdown(120);
        if (data.code) {
          setBackupOtp(data.code);
        }
      } else {
        setError(data.error || 'Failed to resend code.');
      }
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (countdown === 0) {
      setError('Your verification code has expired. Please click "Resend code" below.');
      return;
    }

    if (!code || code.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          confirm_password: formData.confirm_password,
          role: formData.role,
          school: formData.school,
          department: formData.school,
          phone: formData.phone.trim(),
          code: code.trim(),
          roll_number: formData.role === 'Student' ? formData.roll_number.trim() : undefined,
          reg_number: formData.role === 'Student' ? formData.reg_number.trim() : undefined,
          student_id: formData.role === 'Student' 
            ? `Roll: ${formData.roll_number.trim()} | Reg: ${formData.reg_number.trim()}`
            : (formData.faculty_id || '')
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-change'));
        }
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Verification failed. Please check the code.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#FDFDFD] dark:bg-slate-950 pt-24 pb-16 px-4 sm:px-6 flex items-center justify-center transition-colors relative overflow-hidden chronicle-grid">
      
      {/* Ambient Radial Mesh Glowing Auras */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/[0.04] blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Main Spacious Glass Card Container */}
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)] backdrop-blur-2xl relative overflow-hidden">
        
        {/* Specular Top Rim Gradient Hairline */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 via-slate-900/40 to-transparent" />

        <div className="p-6 sm:p-8 md:p-10">
          
          {/* Integrated Header Bar & Step Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b border-slate-100 dark:border-white/5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Adamas University Ledger
              </div>
              <h1 className="font-headline text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {step === 1 ? 'Institutional Enrollment' : 'Verify Security Token'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {step === 1 
                  ? 'Access is restricted to verified Adamas University students and academic faculty.'
                  : `Enter the 6-digit security code dispatched to ${formData.email}.`}
              </p>
            </div>

            {/* Step Progress Pill */}
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                step === 1 
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs' 
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}>
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  step > 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-slate-950'
                }`}>
                  {step > 1 ? '✓' : '1'}
                </span>
                <span>Profile</span>
              </div>

              <div className={`w-4 h-0.5 rounded-full ${step === 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />

              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                step === 2 
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs' 
                  : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-white/5'
              }`}>
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  step === 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  2
                </span>
                <span>Verification</span>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3.5 mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 mb-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-start gap-2.5 shadow-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-relaxed">{infoMessage}</span>
            </div>
          )}

          {/* =========================================================================
              STEP 1: SPACIOUS 2-COLUMN ENROLLMENT FORM
              ========================================================================= */}
          {step === 1 ? (
            <form onSubmit={handleSendCode} className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 text-xs">
              
              {/* Row 1, Col 1: Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <User className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Subhasish Roy"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-white/40 focus:ring-2 focus:ring-slate-900/5 text-xs sm:text-sm transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 1, Col 2: Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Institutional Email <span className="text-rose-500">*</span>
                  </label>
                  {isStudentEmail && (
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Student Domain
                    </span>
                  )}
                  {isFacultyEmail && (
                    <span className="text-[10px] text-blue-800 dark:text-blue-300 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Faculty Domain
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name.id@stu.adamasuniversity.ac.in"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] border ${
                      isPersonalEmail 
                        ? 'border-rose-400 focus:ring-rose-500' 
                        : 'border-slate-200/90 dark:border-white/10'
                    } text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-white/40 focus:ring-2 focus:ring-slate-900/5 text-xs sm:text-sm transition-all shadow-2xs`}
                  />
                </div>
                {isPersonalEmail && (
                  <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>Personal emails (Gmail, etc.) restricted. Use your Adamas email.</span>
                  </p>
                )}
              </div>

              {/* Row 2, Col 1: Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-white/40 focus:ring-2 focus:ring-slate-900/5 text-xs sm:text-sm transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Row 2, Col 2: Confirm Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  {passwordsMatch && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Match
                    </span>
                  )}
                  {passwordsMismatch && (
                    <span className="text-[10px] text-amber-600 font-bold">
                      Mismatch
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <KeyRound className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-white/40 focus:ring-2 focus:ring-slate-900/5 text-xs sm:text-sm transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Row 3, Col 1: Role Switcher */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Institutional Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'Student' })}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      formData.role === 'Student'
                        ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-2xs border border-slate-200/80 dark:border-white/10'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'Faculty' })}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      formData.role === 'Faculty'
                        ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-2xs border border-slate-200/80 dark:border-white/10'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Faculty / Staff</span>
                  </button>
                </div>
              </div>

              {/* Row 3, Col 2: School / Institute */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Adamas School / Institute <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-white/40 focus:ring-2 focus:ring-slate-900/5 text-xs sm:text-sm transition-all appearance-none shadow-2xs cursor-pointer truncate"
                  >
                    {SCHOOLS.map((s) => (
                      <option key={s} value={s} className="dark:bg-slate-900">{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Row 4: Student vs Faculty Identifiers */}
              {formData.role === 'Student' ? (
                <>
                  {/* Row 4, Col 1: College Roll Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        College Roll No. <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">Class Batch</span>
                    </div>
                    <div className="relative group">
                      <Hash className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                      <input
                        type="text"
                        name="roll_number"
                        value={formData.roll_number}
                        onChange={handleChange}
                        required
                        placeholder="e.g. 2305100010"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-white/40 focus:ring-2 focus:ring-slate-900/5 text-xs sm:text-sm transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Row 4, Col 2: University Registration Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        University Reg. No. <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">ID Card</span>
                    </div>
                    <div className="relative group">
                      <ShieldCheck className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                      <input
                        type="text"
                        name="reg_number"
                        value={formData.reg_number}
                        onChange={handleChange}
                        required
                        placeholder="e.g. AU/2023/001429"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-white/40 focus:ring-2 focus:ring-slate-900/5 text-xs sm:text-sm transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Faculty ID */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Faculty / Staff ID <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <Shield className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                      <input
                        type="text"
                        name="faculty_id"
                        value={formData.faculty_id}
                        onChange={handleChange}
                        required
                        placeholder="e.g. FAC/SOET/1029"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-white/40 focus:ring-2 focus:ring-slate-900/5 text-xs sm:text-sm transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Contact Phone <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative group">
                      <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-white/40 focus:ring-2 focus:ring-slate-900/5 text-xs sm:text-sm transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Student Optional Phone (Collapsible to save vertical space) */}
              {formData.role === 'Student' && (
                <div className="md:col-span-2 pt-0.5">
                  {!showPhone ? (
                    <div className="flex items-center justify-between text-xs py-1">
                      <button
                        type="button"
                        onClick={() => setShowPhone(true)}
                        className="text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>+ Add contact phone number (optional)</span>
                      </button>
                      <span className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 
                        OTP verification required
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Contact Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, phone: '' });
                            setShowPhone(false);
                          }}
                          className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="relative group">
                        <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-white/40 focus:ring-2 focus:ring-slate-900/5 text-xs sm:text-sm transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button (Chronicle Obsidian Pill) */}
              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={loading || isPersonalEmail}
                  className="w-full py-3.5 rounded-full bg-[#050505] hover:bg-slate-800 active:scale-[0.99] text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.22)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Generating Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code to Adamas Mail</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>

              {/* Sign-in link */}
              <div className="md:col-span-2 text-center pt-2 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                <span>Already have a verified account? </span>
                <Link href="/login" className="font-bold text-slate-950 dark:text-white hover:underline underline-offset-4">
                  Sign In &rarr;
                </Link>
              </div>
            </form>
          ) : (
            /* =========================================================================
                STEP 2: OTP EMAIL VERIFICATION
                ========================================================================= */
            <form onSubmit={handleFinalSubmit} className="flex flex-col gap-4 text-xs max-w-lg mx-auto">
              
              {/* Dispatch Info Card */}
              <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 text-center relative overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 mx-auto flex items-center justify-center mb-2.5 shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                  Code Dispatched to Adamas Mail
                </h3>
                <div className="inline-block px-3 py-1 mt-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 font-mono text-xs text-slate-800 dark:text-slate-200 font-medium">
                  {formData.email}
                </div>

                {/* Timer Pill */}
                <div className="mt-3.5 flex flex-col items-center gap-1.5">
                  {countdown > 0 ? (
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 py-1 px-3.5 rounded-full shadow-xs">
                      <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                      <span>Code valid for:</span>
                      <span className="font-mono text-emerald-950 dark:text-emerald-200 font-extrabold tracking-wider text-xs sm:text-sm">
                        {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 py-1 px-3.5 rounded-full shadow-xs">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Code expired. Please resend below.</span>
                    </div>
                  )}

                  {/* Visual Progress Bar for 120s timer */}
                  <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full transition-all duration-1000 ${countdown > 30 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${(countdown / 120) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Instant Campus Passcode Auto-Fill Helper */}
                {backupOtp && (
                  <div className="mt-3.5 p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-left shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[11px] font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                          Instant Passcode Helper
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCode(backupOtp)}
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
                        (Provided directly in case college Outlook delays email)
                      </span>
                    </div>
                  </div>
                )}

                {/* Prominent Spam / Junk Folder Alert */}
                <div className="mt-3.5 p-3 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 text-left shadow-2xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold">Not seeing the email in your primary inbox?</span>
                    <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                      Adamas University mail security frequently routes external authorization emails into the <strong>Spam</strong> or <strong>Junk</strong> folder. Please check your <strong>Spam</strong> folder now.
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Entry Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="campus_security_token_code" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Enter 6-Digit Verification Code
                  </label>
                  {code ? (
                    <button
                      type="button"
                      onClick={() => setCode('')}
                      className="text-[11px] text-rose-600 hover:text-rose-800 dark:text-rose-400 underline cursor-pointer font-semibold"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                
                <input
                  key="campus_security_token_code_input"
                  id="campus_security_token_code"
                  name="campus_security_token_code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  autoFocus
                  placeholder="------"
                  autoComplete="one-time-code"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  className="w-full py-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/15 text-slate-950 dark:text-white outline-none focus:border-slate-950 dark:focus:border-white focus:ring-4 focus:ring-slate-950/[0.04] text-center text-2xl sm:text-3xl font-mono tracking-[0.4em] font-extrabold shadow-inner transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || code.trim().length !== 6 || countdown === 0}
                className="w-full py-3.5 rounded-full bg-[#050505] hover:bg-slate-800 active:scale-[0.99] text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.22)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Verifying Institutional Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Verify Code &amp; Complete Registration</span>
                  </>
                )}
              </button>

              {/* Action Controls */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  &larr; Back to Details
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending || countdown > 0}
                  className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {resending ? 'Sending fresh code...' : (countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code')}
                </button>
              </div>
            </form>
          )}

          {/* Institutional Trust Seal */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Adamas University End-to-End Asset Recovery Ledger Protocol</span>
          </div>

        </div>
      </div>
    </main>
  );
}
