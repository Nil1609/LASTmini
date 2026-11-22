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
            return NextResponse.json({ error: 'Please sign in to submit an ownership claim.' }, { status: 401 });
        }

        const body = await request.json();
        const { claim_details, verification_answer, contact_note } = body;

        if (!claim_details || claim_details.trim().length < 5) {
            return NextResponse.json({
                error: 'Please provide detailed evidence or identifying marks (at least 5 characters).'
            }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        // Find the report
        let report = await db.collection('found_reports').findOne({ id: reportId });
        let reportType = 'Found';
        if (!report) {
            report = await db.collection('lost_reports').findOne({ id: reportId });
            reportType = 'Lost';
        }

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        if (report.status === 'Resolved') {
            return NextResponse.json({ error: 'This item has already been marked as resolved/recovered.' }, { status: 400 });
        }

        // Prevent claiming one's own report
        if (report.user_id === currentUser.id) {
            return NextResponse.json({
                error: reportType === 'Lost'
                    ? 'You are the author of this lost report. If you have found or recovered your item, simply mark it as Resolved in your Dashboard or report page.'
                    : 'You cannot submit an ownership claim on your own report.'
            }, { status: 400 });
        }

        // Rate limit: check number of existing pending claims by this user on this report
        const existingClaimsCount = await db.collection('claims').countDocuments({
            report_id: reportId,
            claimant_id: currentUser.id,
            status: 'pending'
        });

        if (existingClaimsCount >= 3) {
            return NextResponse.json({
                error: 'You already have multiple pending claims on this item. Please wait for the finder to review.'
            }, { status: 429 });
        }

        // Check verification answer match if secret question was specified
        let isVerifiedMatch = false;
        if (report.verification_answer && verification_answer) {
            const expected = report.verification_answer.trim().toLowerCase();
            const actual = verification_answer.trim().toLowerCase();
            if (expected === actual) {
                isVerifiedMatch = true;
            }
        }

        const claimId = uuidv4();
        const conversationId = uuidv4();

        const claimRecord = {
            id: claimId,
            report_id: reportId,
            report_type: reportType,
            report_title: report.item_name,
            owner_id: report.user_id,
            claimant_id: currentUser.id,
            claimant_name: currentUser.full_name || currentUser.name || 'Adamas Student',
            claimant_email: currentUser.email || '',
            claim_details: claim_details.trim(),
            verification_answer_provided: verification_answer ? verification_answer.trim() : '',
            is_verified_match: isVerifiedMatch,
            contact_note: contact_note ? contact_note.trim() : '',
            conversation_id: conversationId,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        await db.collection('claims').insertOne(claimRecord);

        // Create an authorized conversation channel between report owner and claimant
        const conversationRecord = {
            id: conversationId,
            report_id: reportId,
            report_title: report.item_name,
            report_type: reportType,
            owner_id: report.user_id,
            claimant_id: currentUser.id,
            claim_id: claimId,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        await db.collection('conversations').insertOne(conversationRecord);

        // Initial system message inside the conversation
        const initialSystemMessage = {
            id: uuidv4(),
            conversation_id: conversationId,
            match_id: conversationId, // for backwards compatibility
            sender_id: 'system',
            text: reportType === 'Lost'
                ? `Finder alert opened by ${currentUser.name || 'Student'}: "${contact_note || claim_details.substring(0, 60)}...". Coordinate handover safely at designated campus pickup points.`
                : `Verification inquiry opened by ${currentUser.name || 'Student'}. Claim note: "${contact_note || claim_details.substring(0, 60)}..." Coordinate handover safely at designated campus pickup points.`,
            created_at: new Date().toISOString()
        };

        await db.collection('messages').insertOne(initialSystemMessage);

        return NextResponse.json({
            message: reportType === 'Lost'
                ? 'Owner has been notified! An authorized handover conversation has been opened.'
                : 'Ownership claim submitted. An authorized recovery conversation has been established.',
            claimId,
            conversationId,
            isVerifiedMatch
        }, { status: 201 });
    } catch (error) {
        console.error("Error submitting claim:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
