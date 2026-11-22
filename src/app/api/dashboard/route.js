import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const client = await clientPromise;
        const db = client.db('aulaf_database');
        
        // Fetch user's reports, conversations, and claims concurrently in parallel
        const [lost, found, conversations, claimsReceived, claimsMade] = await Promise.all([
            db.collection('lost_reports')
                .find({ user_id: user.id })
                .sort({ created_at: -1 })
                .toArray(),
            db.collection('found_reports')
                .find({ user_id: user.id })
                .sort({ created_at: -1 })
                .toArray(),
            db.collection('conversations')
                .find({
                    $or: [
                        { owner_id: user.id },
                        { claimant_id: user.id }
                    ]
                })
                .sort({ updated_at: -1 })
                .toArray(),
            db.collection('claims')
                .find({ owner_id: user.id })
                .sort({ created_at: -1 })
                .toArray(),
            db.collection('claims')
                .find({ claimant_id: user.id })
                .sort({ created_at: -1 })
                .toArray()
        ]);

        // Calculate genuine metrics
        const allUserReports = [...lost, ...found];
        const resolvedCount = allUserReports.filter(r => r.status === 'Resolved').length;
        const activeReports = allUserReports.filter(r => r.status === 'Active');

        const stats = {
            lost: lost.length,
            found: found.length,
            active: activeReports.length,
            conversations: conversations.length,
            resolved: resolvedCount,
            claimsPending: claimsReceived.filter(c => c.status === 'pending').length
        };
        
        return NextResponse.json({
            user: {
                id: user.id,
                name: user.full_name || user.name,
                full_name: user.full_name || user.name,
                email: user.email,
                school: user.school || user.department,
                department: user.department || user.school,
                role: user.role,
                isAdmin: user.isAdmin,
                avatar_url: user.avatar_url || user.avatar || null,
                avatar: user.avatar_url || user.avatar || null,
            },
            lost,
            found,
            conversations,
            claimsReceived,
            claimsMade,
            stats
        });
    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
