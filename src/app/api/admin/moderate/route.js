import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.isAdmin) {
            return NextResponse.json({ error: 'Access denied. Administrative role required.' }, { status: 403 });
        }

        const { reportId, action, reason, flagId } = await request.json();

        if (!reportId || !action) {
            return NextResponse.json({ error: 'Report ID and action are required.' }, { status: 400 });
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

        const now = new Date().toISOString();
        let statusUpdate = {};

        if (action === 'hide') {
            statusUpdate = { moderation_status: 'hidden', moderation_reason: reason || 'Violation of community guidelines' };
        } else if (action === 'restore') {
            statusUpdate = { moderation_status: 'approved', moderation_reason: null };
        } else if (action === 'resolve') {
            statusUpdate = { status: 'Resolved', resolved_by_admin: currentUser.id };
        } else {
            return NextResponse.json({ error: 'Invalid moderation action.' }, { status: 400 });
        }

        await db.collection(collectionName).updateOne({ id: reportId }, { $set: statusUpdate });

        // If a specific flag was addressed, mark it resolved
        if (flagId) {
            await db.collection('moderation_flags').updateOne(
                { id: flagId },
                { $set: { status: 'reviewed', action_taken: action, reviewed_by: currentUser.id, reviewed_at: now } }
            );
        }

        // Record in audit log
        await db.collection('audit_logs').insertOne({
            id: uuidv4(),
            admin_id: currentUser.id,
            admin_name: currentUser.name || currentUser.full_name,
            action: `MODERATE_${action.toUpperCase()}`,
            target_report_id: reportId,
            target_report_title: report.item_name,
            reason: reason || 'Administrative moderation action',
            timestamp: now
        });

        return NextResponse.json({
            message: `Report successfully ${action === 'hide' ? 'hidden' : action === 'restore' ? 'restored' : 'resolved'}.`
        });
    } catch (error) {
        console.error("Admin moderate error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
