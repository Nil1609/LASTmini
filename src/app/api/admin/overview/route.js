import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.isAdmin) {
            return NextResponse.json({ error: 'Access denied. Administrative role required.' }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        const activeLost = await db.collection('lost_reports').countDocuments({ status: 'Active' });
        const activeFound = await db.collection('found_reports').countDocuments({ status: 'Active' });
        const resolvedLost = await db.collection('lost_reports').countDocuments({ status: 'Resolved' });
        const resolvedFound = await db.collection('found_reports').countDocuments({ status: 'Resolved' });
        const hiddenReports = (await db.collection('lost_reports').countDocuments({ moderation_status: 'hidden' })) +
                              (await db.collection('found_reports').countDocuments({ moderation_status: 'hidden' }));

        const pendingFlags = await db.collection('moderation_flags').countDocuments({ status: 'pending' });
        const totalUsers = await db.collection('users').countDocuments();
        const totalClaims = await db.collection('claims').countDocuments();

        const recentFlags = await db.collection('moderation_flags')
            .find({ status: 'pending' })
            .sort({ created_at: -1 })
            .limit(10)
            .toArray();

        const recentAudit = await db.collection('audit_logs')
            .find({})
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        return NextResponse.json({
            stats: {
                totalReports: activeLost + activeFound + resolvedLost + resolvedFound,
                activeLost,
                activeFound,
                resolved: resolvedLost + resolvedFound,
                hidden: hiddenReports,
                pendingFlags,
                totalUsers,
                totalClaims
            },
            recentFlags,
            recentAudit
        });
    } catch (error) {
        console.error("Admin overview error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
