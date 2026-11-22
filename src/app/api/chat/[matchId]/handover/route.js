import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { normalizeIndianTenDigits } from '@/lib/sms';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export async function POST(request, { params }) {
    try {
        const resolvedParams = await params;
        const matchId = resolvedParams?.matchId;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const phoneDigits = normalizeIndianTenDigits(currentUser.phone);
        if (phoneDigits.length !== 10) {
            return NextResponse.json({ 
                error: 'A contact phone number is mandatory to coordinate asset handover. Please update your phone number in your Profile.',
                requiresPhone: true
            }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        // Check conversation authorization
        let conv = await db.collection('conversations').findOne({ id: matchId });
        let reportId = conv?.report_id;

        if (!conv) {
            const match = await db.collection('matches').findOne({ id: matchId });
            if (match) {
                conv = {
                    id: match.id,
                    owner_id: match.lost_report_id,
                    claimant_id: match.found_report_id
                };
                reportId = match.lost_report_id || match.found_report_id;
            }
        }

        if (!conv) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Invalidate any existing pending codes for this conversation
        await db.collection('handover_verifications').updateMany(
            { conversation_id: matchId, status: 'pending' },
            { $set: { status: 'superseded' } }
        );

        // Generate cryptographically secure 6-digit numeric OTP
        const codeNum = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // OTP expiry window

        const verificationRecord = {
            id: uuidv4(),
            conversation_id: matchId,
            report_id: reportId,
            created_by: currentUser.id,
            code: codeNum,
            attempts: 0,
            status: 'pending',
            expires_at: expiresAt,
            created_at: new Date().toISOString()
        };

        await db.collection('handover_verifications').insertOne(verificationRecord);

        // Notify in chat
        await db.collection('messages').insertOne({
            id: uuidv4(),
            conversation_id: matchId,
            match_id: matchId,
            sender_id: 'system',
            text: `A safe handover code was generated. Present this 6-digit verification code in person at the campus pickup point.`,
            created_at: new Date().toISOString()
        });

        return NextResponse.json({
            message: 'Handover code generated.',
            code: codeNum,
            expires_at: expiresAt
        });
    } catch (error) {
        console.error("Error generating handover code:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
