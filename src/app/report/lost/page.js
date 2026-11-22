"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Send,
  Upload,
  X,
  ArrowLeft,
  AlertCircle,
  Info,
  Lock,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Tag,
  Loader2
} from 'lucide-react';
import { processAndCompressImage } from '@/lib/clientImage';

const BUILDINGS = [
  'Central Library',
  'SOET (School of Engineering & Tech)',
  'SOMC (School of Media & Communication)',
  'SOBE (School of Business & Economics)',
  'SOLJ (School of Law & Justice)',
  'SOMS (School of Medical Sciences)',
  'SOBAS (Basic & Applied Sciences)',
  'SOSA (Smart Agriculture)',
  'SOLACS (Liberal Arts & Culture)',
  'SOE (School of Education)',
  'Central Cafeteria / Food Court',
  'Sports Arena / Complex',
  'Hostel Block A / B / C',
  'Main Academic Block',
  'Campus Main Gate Security Area',
  'Other / Campus Grounds'
];

const CATEGORIES = [
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

export default function ReportLost() {
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Electronics',
    other_category: '',
    building: 'Central Library',
    specific_area: '',
    date: '',
    time: '',
    color: '',
    brand: '',
    characteristics: '',
    description: '',
    verification_question: '',
    verification_answer: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const router = useRouter();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('Image file must be under 20MB.');
        return;
      }
      setError('');
      setCompressing(true);
      try {
        const optimizedFile = await processAndCompressImage(file);
        setImageFile(optimizedFile);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(URL.createObjectURL(optimizedFile));
      } catch (err) {
        console.error('Error optimizing image', err);
        setImageFile(file);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(URL.createObjectURL(file));
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.item_name.trim() || formData.item_name.trim().length < 3) {
      setError('Please provide a descriptive item name (at least 3 characters).');
      return;
    }
    if (!formData.date) {
      setError('Please select the date the item was lost.');
      return;
    }

    if (formData.category === 'Others' && !formData.other_category.trim()) {
      setError('Please specify which type of category this item belongs to.');
      return;
    }

    setLoading(true);

    const fullLocation = formData.specific_area.trim()
      ? `${formData.building} — ${formData.specific_area.trim()}`
      : formData.building;

    const finalCategory = (formData.category === 'Others' && formData.other_category.trim())
      ? `Others: ${formData.other_category.trim()}`
      : formData.category;

    const data = new FormData();
    data.append('item_name', formData.item_name.trim());
    data.append('category', finalCategory);
    data.append('other_category', formData.other_category.trim());
    data.append('location', fullLocation);
    data.append('date', formData.date);
    data.append('time', formData.time);
    data.append('color', formData.color.trim());
    data.append('brand', formData.brand.trim());
    data.append('characteristics', formData.characteristics.trim());
    data.append('description', formData.description.trim());
    data.append('verification_question', formData.verification_question.trim());
    data.append('verification_answer', formData.verification_answer.trim());

    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      const res = await fetch('/api/report/lost', {
        method: 'POST',
        body: data
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const errorData = await res.json();
        if (res.status === 401) {
          setError('Authentication Required: Please sign in with your Adamas credentials to file reports.');
          router.push('/login');
        } else {
          setError(errorData.error || 'Failed to file report. Please review the form fields.');
        }
      }
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-colors relative chronicle-bg-glow chronicle-grid">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-medium backdrop-blur-md transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Campus Ledger</span>
          </Link>
        </div>

        {/* Form Container (Chronicle Glass Card) */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-2xl backdrop-blur-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Lost Asset Protocol
              </div>
              <h1 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                Report a Lost Belonging
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Log detailed characteristics to allow automatic AI cross-referencing and custody desk claims.
              </p>
            </div>
            
            <Link
              href="/report/found"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all self-start sm:self-center shrink-0"
            >
              <span>Found an item?</span>
            </Link>
          </div>

          {error && (
            <div className="p-4 mb-8 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-xs">
            
            {/* 1. Item Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Item Title *
                </label>
                <input
                  type="text"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleChange}
                  placeholder="e.g. Sony WH-1000XM4 Headphones"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="dark:bg-slate-900">{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* If 'Others' is selected: Which type of category is this? */}
            {formData.category === 'Others' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border border-amber-500/20 dark:border-amber-500/30 transition-all">
                <label className="block text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Which type of category is this? *
                </label>
                <input
                  type="text"
                  name="other_category"
                  value={formData.other_category}
                  onChange={handleChange}
                  placeholder="e.g. Musical Instrument, Umbrella, Medical Device, Watch, Jewelry..."
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/40 text-xs sm:text-sm transition-all placeholder:text-slate-400"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Specify the category so fellow campus members can search, find, and match your item faster.
                </p>
              </div>
            )}

            {/* 2. Color & Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Color / Finish
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="e.g. Matte Black, Space Grey"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Brand / Manufacturer
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Sony, Apple, Fastrack"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
                />
              </div>
            </div>

            {/* 3. Location: Building & Specific Room */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Campus Building / School *
                </label>
                <select
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
                >
                  {BUILDINGS.map((b) => (
                    <option key={b} value={b} className="dark:bg-slate-900">{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Specific Area / Room
                </label>
                <input
                  type="text"
                  name="specific_area"
                  value={formData.specific_area}
                  onChange={handleChange}
                  placeholder="e.g. 2nd Floor Reading Room Table #14"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
                />
              </div>
            </div>

            {/* 4. Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Date Lost *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Approximate Time
                </label>
                <input
                  type="text"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  placeholder="e.g. Around 2:30 PM (after lecture)"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
                />
              </div>
            </div>

            {/* 5. General Description */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Detailed Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe distinguishing scratches, engravings, circumstances, or tags that help identify the exact item..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
              />
            </div>

            {/* 6. Distinguishing Characteristics */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Public Identifier Tags
              </label>
              <input
                type="text"
                name="characteristics"
                value={formData.characteristics}
                onChange={handleChange}
                placeholder="e.g. NASA sticker on cover, braided blue cable, leather strap"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
              />
            </div>

            {/* 7. Image Upload Box */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Item Photo (Optional)
              </label>
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-slate-800">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1 shadow-md transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/15 bg-slate-50/60 dark:bg-white/[0.02] hover:bg-slate-100/60 dark:hover:bg-white/[0.05] transition-all cursor-pointer p-4 text-center select-none"
                >
                  {compressing ? (
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-7 h-7 text-emerald-600 animate-spin mb-2" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">Optimizing photograph...</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">Please wait a moment</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-slate-400 mb-2" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">Tap or click to select item photograph</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">Camera, Gallery, PNG, JPG, or WebP</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    id="lost-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </div>
              )}
            </div>

            {/* 8. Private Ownership Verification Challenge */}
            <div className="p-6 rounded-3xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-950 dark:text-white font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <span>Private Ownership Verification Challenge (Anti-Fraud Shield)</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Provide a secret question and confidential answer only known to the true owner (e.g. lock screen wallpaper, secret engraving, serial digits). This protects your item from unauthorized collections.
              </p>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Secret Verification Question
                </label>
                <input
                  type="text"
                  name="verification_question"
                  value={formData.verification_question}
                  onChange={handleChange}
                  placeholder="e.g. What wallpaper is visible on the lock screen?"
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Confidential Answer (Encrypted on Server)
                </label>
                <input
                  type="text"
                  name="verification_answer"
                  value={formData.verification_answer}
                  onChange={handleChange}
                  placeholder="e.g. Golden retriever puppy photo"
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 text-xs sm:text-sm transition-all"
                />
              </div>
            </div>

            {/* Submit Button (Chronicle Obsidian Pill) */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full py-4 rounded-full bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Registering Report in Campus Ledger...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publish Official Lost Item Report</span>
                </>
              )}
            </button>

          </form>

        </div>

      </div>
    </main>
  );
}
