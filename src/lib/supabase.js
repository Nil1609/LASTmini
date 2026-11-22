import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://juyqotmaxtyvqpltjzew.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1eXFvdG1heHR5dnFwbHRqemV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MjY3MzUsImV4cCI6MjEwNzQwMjczNX0.mQaw1d17jXBzDK6yOmul33fjvocYDiCKh7U2OxfHH5Q';
const defaultServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1eXFvdG1heHR5dnFwbHRqemV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTgyNjczNSwiZXhwIjoyMTA3NDAyNzM1fQ.R-1Z4QHBeZy1E1F3z8bjFKwQs6AmNxoOVnk__EvwGVI';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKey;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || defaultServiceKey;

// Client for browser / public calls
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend API routes (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
