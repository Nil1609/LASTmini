import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { normalizeIndianTenDigits } from '@/lib/sms';
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper to authenticate and authorize conversation access
 */
async function getAuthorizedConversation(db, matchId, userId) {
    // 1. Try finding in conversations collection
    let conv = await db.collection('conversations').findOne({ id: matchId });
    if (conv) {
        const isParticipant = conv.owner_id === userId || conv.claimant_id === userId;
        if (!isParticipant) return { error: 'Unauthorized to view this conversation', status: 403 };
        return { conversation: conv, type: 'conversation' };
    }

    // 2. Backwards compatibility for existing matches collection
    const match = await db.collection('matches').findOne({ id: matchId });
    if (match) {
        const lostReport = await db.collection('lost_reports').findOne({ id: match.lost_report_id });
        const foundReport = await db.collection('found_reports').findOne({ id: match.found_report_id });

        const isParticipant =
            (lostReport && lostReport.user_id === userId) ||
            (foundReport && foundReport.user_id === userId);

        if (!isParticipant) return { error: 'Unauthorized to view this conversation', status: 403 };

        return {
            conversation: {
                id: match.id,
                report_id: match.lost_report_id || match.found_report_id,
                report_title: (lostReport && lostReport.item_name) || (foundReport && foundReport.item_name) || 'Matched Item',
                owner_id: lostReport?.user_id,
                claimant_id: foundReport?.user_id,
                status: 'active'
            },
            type: 'match'
        };
    }

    return { error: 'Conversation not found', status: 404 };
}

export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const matchId = resolvedParams?.matchId;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        const authResult = await getAuthorizedConversation(db, matchId, currentUser.id);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const conversation = authResult.conversation;

        // Fetch messages for this conversation/match
        const messages = await db.collection('messages')
            .find({ conversation_id: matchId })
            .sort({ created_at: 1 })
            .toArray();

        // Check if there is an active handover verification session
        const activeHandover = await db.collection('handover_verifications').findOne({
            conversation_id: matchId,
            status: 'pending'
        });

        // Determine counterparty name
        const counterpartyId = conversation.owner_id === currentUser.id ? conversation.claimant_id : conversation.owner_id;
        let counterpartyName = 'Campus Member';
        if (counterpartyId) {
            const cpUser = await db.collection('users').findOne({ id: counterpartyId });
            if (cpUser) {
                counterpartyName = cpUser.name || cpUser.full_name || 'Campus Member';
            }
        }

        const currentUserPhone = currentUser.phone || '';
        const currentUserHasPhone = normalizeIndianTenDigits(currentUserPhone).length === 10;

        return NextResponse.json({
            conversation: {
                id: conversation.id,
                report_id: conversation.report_id,
                report_title: conversation.report_title,
                status: conversation.status || 'active',
                counterparty_name: counterpartyName,
                user_has_phone: currentUserHasPhone
            },
            currentUser: {
                id: currentUser.id,
                name: currentUser.name || currentUser.full_name || 'Member',
                phone: currentUserPhone,
                has_phone: currentUserHasPhone
            },
            messages,
            handover: activeHandover ? {
                id: activeHandover.id,
                created_by: activeHandover.created_by,
                expires_at: activeHandover.expires_at,
                // Only provide OTP code to the generator, not the verifier!
                code: activeHandover.created_by === currentUser.id ? activeHandover.code : undefined,
                status: activeHandover.status
            } : null
        });
    } catch (error) {
        console.error("Error fetching chat:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const resolvedParams = await params;
        const matchId = resolvedParams?.matchId;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { text } = await request.json();
        if (!text || text.trim() === '') {
            return NextResponse.json({ error: 'Message content cannot be empty.' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        const authResult = await getAuthorizedConversation(db, matchId, currentUser.id);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const conversation = authResult.conversation;
        if (conversation.status === 'blocked') {
            return NextResponse.json({ error: 'This conversation has been closed or blocked.' }, { status: 403 });
        }

        const newMessage = {
            id: uuidv4(),
            conversation_id: matchId,
            match_id: matchId,
            sender_id: currentUser.id,
            sender_name: currentUser.name || currentUser.full_name || 'Student',
            text: text.trim().substring(0, 1000), // sanitize length
            created_at: new Date().toISOString()
        };

        await db.collection('messages').insertOne(newMessage);

        // Update conversation timestamp
        await db.collection('conversations').updateOne(
            { id: matchId },
            { $set: { updated_at: new Date().toISOString() } }
        );

        return NextResponse.json({ message: newMessage }, { status: 201 });
    } catch (error) {
        console.error("Error posting chat message:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
