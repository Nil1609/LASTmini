import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request, { params }) {
    try {
        const resolvedParams = await params;
        const reportId = resolvedParams?.id;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Please sign in to report a listing.' }, { status: 401 });
        }

        const { reason, details } = await request.json();

        if (!reason) {
            return NextResponse.json({ error: 'Please select a reason for reporting this item.' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        let report = await db.collection('lost_reports').findOne({ id: reportId });
        let collectionName = 'lost_reports';

        if (!report) {
            report = await db.collection('found_reports').findOne({ id: reportId });
            collectionName = 'found_reports';
        }

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // Avoid duplicate flagging by same user
        const existingFlag = await db.collection('moderation_flags').findOne({
            report_id: reportId,
            flagged_by: currentUser.id
        });

        if (existingFlag) {
            return NextResponse.json({ error: 'You have already submitted a report for this listing.' }, { status: 400 });
        }

        const newFlagCount = (report.flag_count || 0) + 1;
        const updates = { flag_count: newFlagCount };

        // If flagged by multiple students, put under review
        if (newFlagCount >= 3) {
            updates.moderation_status = 'pending_review';
        }

        await db.collection(collectionName).updateOne({ id: reportId }, { $set: updates });

        const flagRecord = {
            id: uuidv4(),
            report_id: reportId,
            report_title: report.item_name,
            report_type: collectionName === 'lost_reports' ? 'Lost' : 'Found',
            flagged_by: currentUser.id,
            flagged_by_name: currentUser.name || currentUser.full_name || 'Student',
            reason,
            details: details ? details.trim() : '',
            status: 'pending',
            created_at: new Date().toISOString()
        };

        await db.collection('moderation_flags').insertOne(flagRecord);

        return NextResponse.json({
            message: 'Report submitted for review. Thank you for helping keep the campus community safe.'
        }, { status: 201 });
    } catch (error) {
        console.error("Error flagging report:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
