import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: 'AUlaf — Adamas University Campus Asset Recovery Ledger',
  description: 'An authenticated campus lost-and-found protocol for students and faculty of Adamas University. Automated attribute verification and custody-controlled handovers.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white dark:bg-slate-950 font-body text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-100 selection:text-emerald-900 min-h-screen flex flex-col">
        <ThemeProvider defaultTheme="light">
          <Navbar />
          <div className="flex-1 w-full">
            {children}
          </div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
