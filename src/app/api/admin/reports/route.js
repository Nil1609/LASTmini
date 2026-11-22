import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.isAdmin) {
            return NextResponse.json({ error: 'Access denied. Administrative role required.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get('status') || 'all';

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        const query = {};
        if (statusFilter !== 'all') {
            if (statusFilter === 'hidden') {
                query.moderation_status = 'hidden';
            } else {
                query.status = statusFilter;
            }
        }

        const lost = await db.collection('lost_reports').find(query).toArray();
        const found = await db.collection('found_reports').find(query).toArray();

        const lostMapped = lost.map(r => ({ ...r, type: 'Lost', id: r.id || r._id?.toString() }));
        const foundMapped = found.map(r => ({ ...r, type: 'Found', id: r.id || r._id?.toString() }));

        const all = [...lostMapped, ...foundMapped];
        all.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        return NextResponse.json({ reports: all });
    } catch (error) {
        console.error("Admin reports error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
