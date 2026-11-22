import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://juyqotmaxtyvqpltjzew.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1eXFvdG1heHR5dnFwbHRqemV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MjY3MzUsImV4cCI6MjEwNzQwMjczNX0.mQaw1d17jXBzDK6yOmul33fjvocYDiCKh7U2OxfHH5Q';
const defaultServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1eXFvdG1heHR5dnFwbHRqemV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTgyNjczNSwiZXhwIjoyMTA3NDAyNzM1fQ.R-1Z4QHBeZy1E1F3z8bjFKwQs6AmNxoOVnk__EvwGVI';

// Check if Vercel automatically injected an empty integration database
const isBlankIntegration = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('krmvzwztgjgtdgszahco');

const supabaseUrl = (!isBlankIntegration && process.env.NEXT_PUBLIC_SUPABASE_URL) ? process.env.NEXT_PUBLIC_SUPABASE_URL : defaultUrl;
const supabaseAnonKey = (!isBlankIntegration && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : defaultAnonKey;
const supabaseServiceKey = (!isBlankIntegration && process.env.SUPABASE_SERVICE_ROLE_KEY) ? process.env.SUPABASE_SERVICE_ROLE_KEY : defaultServiceKey;

// Client for browser / public calls
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend API routes (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
