import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const reportId = resolvedParams?.id;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        // Check report ownership
        let report = await db.collection('found_reports').findOne({ id: reportId });
        if (!report) {
            report = await db.collection('lost_reports').findOne({ id: reportId });
        }

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const isOwner = currentUser.id === report.user_id;
        const isAdmin = currentUser.isAdmin;

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden. Only the report owner can review claims.' }, { status: 403 });
        }

        const claims = await db.collection('claims')
            .find({ report_id: reportId })
            .sort({ created_at: -1 })
            .toArray();

        return NextResponse.json({ claims });
    } catch (error) {
        console.error("Error fetching claims:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
