/**
 * GET /api/match?reportId=<id>&limit=10
 *
 * Fetches AI-matched reports for a given lost or found report.
 * Public endpoint — no auth required.
 *
 * Returns: { report: sanitized, matches: [...sorted by score desc], total: N }
 */

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { buildIdfMap, matchReport, sanitizeReport, isExplicitlyIneligible } from '@/lib/matching/engine';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = (searchParams.get('reportId') || '').trim();
    const limit    = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db     = client.db('aulaf_database');

    // Try to find the source report in lost_reports first, then found_reports
    let sourceReport = null;
    let sourceType   = null;

    const lost = await db.collection('lost_reports').findOne({ id: reportId });
    if (lost) {
      sourceReport = { ...lost, type: 'lost' };
      sourceType   = 'lost';
    } else {
      const found = await db.collection('found_reports').findOne({ id: reportId });
      if (found) {
        sourceReport = { ...found, type: 'found' };
        sourceType   = 'found';
      }
    }

    if (!sourceReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Fetch opposite-type Active reports as candidates
    const oppositeCollection = sourceType === 'lost' ? 'found_reports' : 'lost_reports';
    const oppositeType       = sourceType === 'lost' ? 'found' : 'lost';

    const candidatesRaw = await db
      .collection(oppositeCollection)
      .find({ status: 'Active', moderation_status: { $ne: 'hidden' } })
      .toArray();

    const candidates = candidatesRaw.map(r => ({ ...r, type: oppositeType }));

    // Build IDF map from combined corpus
    const corpus = [sourceReport, ...candidates];
    const idfMap = buildIdfMap(corpus);

    // Run matching
    const matches = matchReport(sourceReport, candidates, idfMap, {
      displayThreshold: 65
    }).slice(0, limit);

    return NextResponse.json({
      report:  sanitizeReport({ ...sourceReport }),
      matches,
      total:   matches.length
    });

  } catch (err) {
    console.error('[/api/match] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
