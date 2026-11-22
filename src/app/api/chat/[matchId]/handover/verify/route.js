import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { normalizeIndianTenDigits } from '@/lib/sms';
import { sendHandoverCompleteEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

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
                error: 'A contact phone number is mandatory to complete asset handover. Please update your phone number in your Profile.',
                requiresPhone: true
            }, { status: 400 });
        }

        const { code } = await request.json();
        const inputCode = (code || '').toString().trim();

        if (!inputCode || inputCode.length !== 6) {
            return NextResponse.json({ error: 'Please enter a valid 6-digit handover code.' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        // Look up the active pending handover verification
        const handover = await db.collection('handover_verifications').findOne({
            conversation_id: matchId,
            status: 'pending'
        });

        if (!handover) {
            return NextResponse.json({ error: 'No active handover session found. Please request a new code.' }, { status: 404 });
        }

        // Check expiration
        if (new Date() > new Date(handover.expires_at)) {
            await db.collection('handover_verifications').updateOne(
                { id: handover.id },
                { $set: { status: 'expired' } }
            );
            return NextResponse.json({ error: 'This handover code has expired. Please generate a new one.' }, { status: 400 });
        }

        // Check rate limiting (max 5 attempts)
        const attempts = (handover.attempts || 0) + 1;
        if (attempts > 5) {
            await db.collection('handover_verifications').updateOne(
                { id: handover.id },
                { $set: { status: 'failed_too_many_attempts' } }
            );
            return NextResponse.json({ error: 'Too many incorrect attempts. Session invalidated.' }, { status: 429 });
        }

        // Verify the code
        if (handover.code !== inputCode) {
            await db.collection('handover_verifications').updateOne(
                { id: handover.id },
                { $set: { attempts } }
            );
            const remaining = 5 - attempts;
            return NextResponse.json({
                error: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            }, { status: 400 });
        }

        // Successful verification!
        const now = new Date().toISOString();
        await db.collection('handover_verifications').updateOne(
            { id: handover.id },
            { $set: { status: 'verified', verified_by: currentUser.id, verified_at: now } }
        );

        // Mark report as Resolved
        const reportId = handover.report_id;
        let itemTitle = 'Campus Asset';

        if (reportId) {
            const lostRep = await db.collection('lost_reports').findOne({ id: reportId });
            if (lostRep) {
                itemTitle = lostRep.item_name;
                await db.collection('lost_reports').updateOne(
                    { id: reportId },
                    { $set: { status: 'Resolved', resolved_at: now } }
                );
            } else {
                const foundRep = await db.collection('found_reports').findOne({ id: reportId });
                if (foundRep) {
                    itemTitle = foundRep.item_name;
                    await db.collection('found_reports').updateOne(
                        { id: reportId },
                        { $set: { status: 'Resolved', resolved_at: now } }
                    );
                }
            }
        }

        // Mark conversation as resolved
        await db.collection('conversations').updateOne(
            { id: matchId },
            { $set: { status: 'resolved', resolved_at: now } }
        );

        // Record audit trail
        await db.collection('audit_logs').insertOne({
            id: uuidv4(),
            action: 'HANDOVER_VERIFIED',
            conversation_id: matchId,
            report_id: reportId,
            verified_by: currentUser.id,
            verified_by_name: currentUser.name || currentUser.full_name,
            timestamp: now
        });

        // Insert confirmation message into chat
        await db.collection('messages').insertOne({
            id: uuidv4(),
            conversation_id: matchId,
            match_id: matchId,
            sender_id: 'system',
            text: `Handover verified successfully! "${itemTitle}" has been confirmed recovered and the listing status is marked as Resolved.`,
            created_at: now
        });

        // Send email notification asynchronously
        if (currentUser.email) {
            sendHandoverCompleteEmail(currentUser.email, itemTitle, reportId).catch(() => {});
        }

        return NextResponse.json({
            message: 'Handover verified successfully! Report resolved.',
            itemTitle,
            status: 'Resolved'
        });
    } catch (error) {
        console.error("Error verifying handover code:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
