import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
    try {
        const resolvedParams = await params;
        const claimId = resolvedParams?.id;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status } = await request.json();
        const validStatuses = ['accepted', 'rejected', 'withdrawn'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid claim status transition.' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        const claim = await db.collection('claims').findOne({ id: claimId });
        if (!claim) {
            return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
        }

        const isOwner = currentUser.id === claim.owner_id;
        const isClaimant = currentUser.id === claim.claimant_id;
        const isAdmin = currentUser.isAdmin;

        if (status === 'withdrawn' && !isClaimant && !isAdmin) {
            return NextResponse.json({ error: 'Only the claimant can withdraw their claim.' }, { status: 403 });
        }

        if ((status === 'accepted' || status === 'rejected') && !isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Only the report owner can accept or reject this claim.' }, { status: 403 });
        }

        await db.collection('claims').updateOne(
            { id: claimId },
            { $set: { status, updated_at: new Date().toISOString() } }
        );

        return NextResponse.json({ message: `Claim marked as ${status}.` });
    } catch (error) {
        console.error("Error updating claim:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
