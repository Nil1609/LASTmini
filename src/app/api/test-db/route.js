import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const result = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'DEFINED' : 'UNDEFINED (using fallback)',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINED' : 'UNDEFINED (using fallback)'
    },
    rawSupabase: null,
    dbAdapter: null
  };

  // 1. Test direct Supabase query
  try {
    const { data, error, count } = await supabaseAdmin
      .from('lost_reports')
      .select('id, item_name', { count: 'exact' })
      .limit(3);

    result.rawSupabase = {
      success: !error,
      error: error ? { message: error.message, details: error.details, code: error.code } : null,
      count: count,
      sampleItems: (data || []).map(d => d.item_name)
    };
  } catch (err) {
    result.rawSupabase = {
      success: false,
      error: err.message
    };
  }

  // 2. Test via db.js client
  try {
    const client = await clientPromise;
    const db = client.db('aulaf_database');
    const lost = await db.collection('lost_reports').find({ status: 'Active' }).limit(3).toArray();
    result.dbAdapter = {
      success: true,
      count: lost.length,
      sample: lost.map(l => l.item_name)
    };
  } catch (err) {
    result.dbAdapter = {
      success: false,
      error: err.message
    };
  }

  return NextResponse.json(result);
}
