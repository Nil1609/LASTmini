import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const user = await getCurrentUser();
        const headers = {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        };

        if (!user) {
            return NextResponse.json({ user: null }, { status: 401, headers });
        }

        try {
            const client = await clientPromise;
            const db = client.db('aulaf_database');
            const conversationsCount = await db.collection('conversations').countDocuments({
                $or: [{ owner_id: user.id }, { claimant_id: user.id }]
            });
            user.conversationsCount = conversationsCount;
        } catch (cErr) {
            user.conversationsCount = 0;
        }

        return NextResponse.json({ user }, { headers });
    } catch (error) {
        console.error("Auth me error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
