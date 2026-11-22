export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-[#05070c] border-t border-slate-200/80 dark:border-white/10 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 mt-auto transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
        <div className="flex items-center justify-center gap-2">
          <span className="font-headline font-bold text-base text-slate-900 dark:text-white flex items-center gap-1">
            AUlaf
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>Adamas University Campus Ledger</span>
        </div>

        <div className="text-[11px] text-slate-400">
          &copy; {new Date().getFullYear()} Adamas University. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
