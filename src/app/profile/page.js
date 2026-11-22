"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  User,
  Building,
  Phone,
  Mail,
  Award,
  ArrowRight,
  Camera,
  Upload,
  Trash2,
  Loader2,
  KeyRound,
  X
} from 'lucide-react';

// Lightweight in-browser client compression to guarantee fast uploads and prevent Vercel 4.5MB limit
const compressImage = (file, maxWidth = 800, quality = 0.85) => {
  return new Promise((resolve) => {
    if (!file || typeof window === 'undefined') return resolve(file);
    if (file.size < 200 * 1024) return resolve(file);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) return resolve(file);
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressed);
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

// Helper to extract clean 10-digit Indian mobile number from any stored/raw value
const normalizeStoredPhone = (stored) => {
  if (!stored) return '';
  const digits = String(stored).replace(/\D/g, '');
  if (digits.length < 10) return '';
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 10) return digits;
  if (digits.length > 10 && digits.startsWith('91')) return digits.slice(2, 12);
  return digits.slice(-10);
};

export default function Profile() {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('aulaf_user_cache');
        return cached ? JSON.parse(cached) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return !sessionStorage.getItem('aulaf_user_cache');
      } catch (e) {
        return true;
      }
    }
    return true;
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('aulaf_user_cache');
        if (cached) {
          const u = JSON.parse(cached);
          return {
            name: u.name || u.full_name || '',
            department: u.department || u.school || 'School of Engineering & Technology (SOET)',
            phone: normalizeStoredPhone(u.phone),
            bio: u.bio || ''
          };
        }
      } catch (e) {}
    }
    return {
      name: '',
      department: 'School of Engineering & Technology (SOET)',
      phone: '',
      bio: ''
    };
  });
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          try {
            sessionStorage.setItem('aulaf_user_cache', JSON.stringify(data.user));
          } catch (e) {}
          setFormData(prev => ({
            name: data.user.name || data.user.full_name || prev.name || '',
            department: data.user.department || data.user.school || prev.department || 'School of Engineering & Technology (SOET)',
            phone: normalizeStoredPhone(data.user.phone) || normalizeStoredPhone(prev.phone) || '',
            bio: data.user.bio || prev.bio || ''
          }));
        } else if (res.status === 401) {
          try {
            sessionStorage.removeItem('aulaf_user_cache');
            sessionStorage.removeItem('aulaf_dashboard_cache');
          } catch (e) {}
          router.push('/login');
        }
      } catch (error) {
        console.error("Failed to fetch user");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length === 12 && val.startsWith('91')) {
      val = val.slice(2);
    } else if (val.length === 11 && val.startsWith('0')) {
      val = val.slice(1);
    }
    val = val.slice(0, 10);
    setFormData(prev => ({ ...prev, phone: val }));
  };

  // Auto-compresses and instantly persists photo to Supabase
  const handleAvatarChange = async (e) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    if (!rawFile.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP, etc.).');
      return;
    }

    setErrorMessage('');
    setMessage('');
    setAvatarError(false);
    setUploadingPhoto(true);

    try {
      // 1. Instant local preview
      const previewUrl = URL.createObjectURL(rawFile);
      setPreviewAvatar(previewUrl);

      // 2. Client-side compress to max 800px width/height (< 200KB)
      const compressedFile = await compressImage(rawFile, 800, 0.85);

      // 3. Immediately save to backend
      const formPayload = new FormData();
      formPayload.append('avatar', compressedFile);

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        body: formPayload
      });

      const result = await res.json();

      if (res.ok && result.user) {
        setUser(result.user);
        setPreviewAvatar(null);
        setMessage('Passport photo saved permanently! It will remain saved on refresh.');
        try {
          sessionStorage.setItem('aulaf_user_cache', JSON.stringify(result.user));
          window.dispatchEvent(new Event('auth-change'));
        } catch (err) {}
      } else {
        setErrorMessage(result.error || 'Failed to save photo. Please try again.');
        setPreviewAvatar(null);
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setErrorMessage('Network error while saving photo.');
      setPreviewAvatar(null);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Instantly removes avatar and persists removal
  const handleRemoveAvatar = async () => {
    if (!confirm('Remove your profile photo?')) return;
    setUploadingPhoto(true);
    setErrorMessage('');
    setMessage('');

    try {
      const formPayload = new FormData();
      formPayload.append('remove_avatar', 'true');

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        body: formPayload
      });

      const result = await res.json();
      if (res.ok && result.user) {
        setUser(result.user);
        setPreviewAvatar(null);
        setMessage('Profile photo removed.');
        try {
          sessionStorage.setItem('aulaf_user_cache', JSON.stringify(result.user));
          window.dispatchEvent(new Event('auth-change'));
        } catch (err) {}
      } else {
        setErrorMessage(result.error || 'Failed to remove photo.');
      }
    } catch (err) {
      setErrorMessage('Error while removing photo.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setErrorMessage('');

    const phoneDigits = normalizeStoredPhone(formData.phone);
    if (formData.phone && phoneDigits.length > 0 && phoneDigits.length !== 10) {
      setSaving(false);
      setErrorMessage('Please enter a valid 10-digit mobile number, or leave it blank.');
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('department', formData.department);
      formPayload.append('phone', phoneDigits.length === 10 ? `+91 ${phoneDigits}` : '');
      formPayload.append('bio', formData.bio);

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        body: formPayload
      });

      const result = await res.json();

      if (res.ok) {
        setMessage('Academic profile credentials updated successfully.');
        const updatedUser = result.user || {
          ...(user || {}),
          ...formData,
          phone: phoneDigits.length === 10 ? `+91 ${phoneDigits}` : ''
        };
        setUser(updatedUser);
        try {
          sessionStorage.setItem('aulaf_user_cache', JSON.stringify(updatedUser));
          window.dispatchEvent(new Event('auth-change'));
        } catch (e) {}
      } else {
        setErrorMessage(result.error || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      setErrorMessage('An error occurred while updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !user) {
    return (
      <main className="w-full pt-24 pb-20 min-h-screen bg-white dark:bg-slate-950 transition-colors relative chronicle-bg-glow chronicle-grid">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8 animate-pulse">
          {/* Header Strip Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
            <div className="space-y-2">
              <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="w-56 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="w-72 h-3 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          </div>
          {/* Pass Card Skeleton */}
          <div className="p-7 sm:p-9 rounded-3xl bg-slate-900 border border-white/10 h-52 flex flex-col justify-between">
            <div className="w-48 h-4 bg-slate-800 rounded-full" />
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 shrink-0" />
              <div className="space-y-2">
                <div className="w-40 h-5 bg-slate-800 rounded-lg" />
                <div className="w-56 h-3 bg-slate-800 rounded-lg" />
              </div>
            </div>
          </div>
          {/* Form Skeleton */}
          <div className="rounded-3xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 p-7 sm:p-9 h-72" />
        </div>
      </main>
    );
  }

  if (!user) return null;

  const currentDisplayAvatar = previewAvatar || user.avatar_url || user.avatar || null;

  return (
    <main className="w-full pt-24 pb-20 min-h-screen bg-white dark:bg-slate-950 transition-colors relative chronicle-bg-glow chronicle-grid">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100/90 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Adamas Registry Identity
            </div>
            <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Academic Credential Pass
            </h1>
            <p className="font-body text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Verified Adamas University credentials utilized for safe custody desk handovers.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold self-start sm:self-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Verified Institutional SSO</span>
          </div>
        </div>

        {/* Chronicle Digital Student ID Pass (Deck Card Aesthetic) */}
        <div className="p-7 sm:p-9 rounded-3xl bg-[#070b12] text-white shadow-2xl border border-white/15 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 to-teal-500/0 rounded-full blur-3xl pointer-events-none" />
          
          {/* Top Pass Chrome */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] tracking-wider uppercase text-slate-300 font-semibold">
                ADAMAS UNIVERSITY CAMPUS PASSPORT
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold tracking-widest uppercase text-emerald-300 border border-white/10">
              ACTIVE ENROLLED
            </span>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 border-2 border-emerald-400/40 flex items-center justify-center font-headline text-2xl sm:text-3xl font-extrabold text-white shadow-xl overflow-hidden relative">
                  {currentDisplayAvatar && !avatarError ? (
                    <img
                      src={currentDisplayAvatar}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    (user?.name || user?.full_name) ? (user.name || user.full_name).charAt(0).toUpperCase() : 'U'
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-[#050505] text-white hover:bg-emerald-600 dark:bg-white dark:text-slate-950 dark:hover:bg-emerald-400 shadow-lg border border-white/20 transition-all hover:scale-110 cursor-pointer disabled:opacity-50"
                  title="Upload / Change student photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400 block mb-0.5">
                  Verified Identity
                </span>
                <h2 className="font-headline text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  {user.name || user.full_name || 'Student'}
                </h2>
                <span className="text-xs text-slate-300 block font-mono mt-0.5">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-300 space-y-1.5 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-8 w-full sm:w-auto">
              <div><span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">School:</span> <strong className="text-white">{user.department || user.school || 'SOET (Engineering)'}</strong></div>
              <div><span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Campus:</span> <strong className="text-white">Barasat Main Campus</strong></div>
              <div><span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">ID Type:</span> <strong className="text-emerald-400">{user.role || 'Student'}</strong></div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form (Chronicle Glass Card) */}
        <div className="bg-white/95 dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-xl backdrop-blur-xl p-7 sm:p-9">
          {message && (
            <div className="p-4 mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-xs">
            {/* Dedicated Profile Picture Upload Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 border-2 border-emerald-500/40 flex items-center justify-center font-headline text-2xl font-extrabold text-white shadow-md overflow-hidden relative">
                  {currentDisplayAvatar ? (
                    <img
                      src={currentDisplayAvatar}
                      alt="Student portrait"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (formData.name || user?.name || 'U').charAt(0).toUpperCase()
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <Loader2 className="w-7 h-7 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#050505] text-white hover:bg-emerald-600 dark:bg-white dark:text-slate-950 dark:hover:bg-emerald-400 shadow-md border border-white/20 transition-all hover:scale-110 cursor-pointer disabled:opacity-50"
                  title="Upload profile picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="font-headline font-bold text-sm text-slate-950 dark:text-white">
                    Campus ID Passport Photo
                  </h3>
                  {uploadingPhoto && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving to Adamas Passport...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Upload your institutional passport photo for campus recovery verification. Automatically optimized and saved permanently.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="nav-pill-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                        <span>Saving Photo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{currentDisplayAvatar ? 'Change Photo' : 'Upload Photo'}</span>
                      </>
                    )}
                  </button>

                  {currentDisplayAvatar && (
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={handleRemoveAvatar}
                      className="nav-pill-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Adamas Institutional Email (Permanent)
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 opacity-70 cursor-not-allowed text-slate-500 font-mono text-xs sm:text-sm"
              />
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 block">
                Institutional email domain cannot be altered per security protocol.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Full Legal Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-2 h-6">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                    Academic School / Institute
                  </label>
                </div>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full h-[46px] px-4 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
                >
                  <option value="School of Engineering & Technology (SOET)" className="dark:bg-slate-900">SOET (Engineering &amp; Tech)</option>
                  <option value="School of Business & Economics (SOBE)" className="dark:bg-slate-900">SOBE (Business &amp; Econ)</option>
                  <option value="School of Law & Justice (SOLJ)" className="dark:bg-slate-900">SOLJ (Law &amp; Justice)</option>
                  <option value="School of Media & Communication (SOMC)" className="dark:bg-slate-900">SOMC (Media &amp; Comm)</option>
                  <option value="School of Medical Sciences (SOMS)" className="dark:bg-slate-900">SOMS (Medical Sciences)</option>
                  <option value="School of Basic & Applied Sciences (SOBAS)" className="dark:bg-slate-900">SOBAS (Basic Sciences)</option>
                  <option value="School of Smart Agriculture (SOSA)" className="dark:bg-slate-900">SOSA (Agriculture)</option>
                  <option value="School of Education (SOE)" className="dark:bg-slate-900">SOE (Education)</option>
                  <option value="School of Liberal Arts & Culture Studies (SOLACS)" className="dark:bg-slate-900">SOLACS (Liberal Arts)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2 h-6">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                    Phone Number
                  </label>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap shrink-0">
                    Mandatory for Handover
                  </span>
                </div>
                <div className="w-full h-[46px] relative flex items-center rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 focus-within:border-slate-900 dark:focus-within:border-white/30 focus-within:ring-2 focus-within:ring-slate-900/5 overflow-hidden transition-all">
                  {/* Permanent Locked Country Code Affix */}
                  <div className="h-full flex items-center gap-1.5 px-3.5 bg-slate-100 dark:bg-white/[0.06] border-r border-slate-200/80 dark:border-white/10 select-none shrink-0 text-slate-800 dark:text-slate-200 font-mono font-bold text-xs sm:text-sm">
                    <span className="text-base leading-none">🇮🇳</span>
                    <span>+91</span>
                  </div>

                  {/* 10-Digit Mobile Input */}
                  <input
                    type="tel"
                    inputMode="numeric"
                    name="phone"
                    maxLength={10}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="98765 43210"
                    className="w-full h-full px-3.5 bg-transparent text-slate-900 dark:text-white font-mono outline-none text-xs sm:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Affiliation / Hostel &amp; Department Notes
              </label>
              <textarea
                name="bio"
                rows={2}
                value={formData.bio}
                onChange={handleChange}
                placeholder="e.g. 3rd Year B.Tech CSE, Systems Lab Assistant, Hostel Block 2."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{saving ? 'Updating Credentials...' : 'Save Profile Changes'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

      </div>


    </main>
  );
}
