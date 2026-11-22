import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams?.id;
        if (!id) {
            return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');
        
        const query = { $or: [{ id: id }, { _id: id }] };

        // Execute user auth and report lookups in parallel for maximum speed
        const [currentUser, lostReport, foundReport] = await Promise.all([
            getCurrentUser(),
            db.collection('lost_reports').findOne(query),
            db.collection('found_reports').findOne(query)
        ]);

        let report = lostReport;
        let type = 'Lost';

        if (!report) {
            report = foundReport;
            type = 'Found';
        }

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const isOwner = currentUser && currentUser.id === report.user_id;
        const isAdmin = currentUser && currentUser.isAdmin;

        // If report is hidden, only owner or admin can view
        if (report.moderation_status === 'hidden' && !isOwner && !isAdmin) {
            return NextResponse.json({ error: 'This report has been temporarily hidden for review.' }, { status: 403 });
        }

        // Prepare public sanitized payload
        const sanitized = {
            id: report.id || report._id?.toString(),
            type,
            user_id: isOwner ? report.user_id : undefined, // only expose author's own ID to themselves
            reporter_name: report.reporter_name || 'Verified Student',
            item_name: report.item_name,
            category: report.category,
            description: report.description,
            color: report.color,
            brand: report.brand,
            characteristics: report.characteristics,
            location: report.location,
            date: report.date,
            time: report.time,
            custody: report.custody,
            image: report.image,
            status: report.status || 'Active',
            verification_question: report.verification_question || '',
            created_at: report.created_at,
            isOwner: !!isOwner,
            isAdmin: !!isAdmin
        };

        // Only include the secret verification answer if viewer is the owner
        if (isOwner || isAdmin) {
            sanitized.verification_answer = report.verification_answer || '';
        }

        return NextResponse.json({ report: sanitized });
    } catch (error) {
        console.error("Error fetching report:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams?.id;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');
        const body = await request.json();

        let query = { id: id };
        let collectionName = 'lost_reports';
        let report = await db.collection('lost_reports').findOne(query);

        if (!report) {
            report = await db.collection('found_reports').findOne(query);
            collectionName = 'found_reports';
        }

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const isOwner = currentUser.id === report.user_id;
        const isAdmin = currentUser.isAdmin;

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden. You cannot edit this report.' }, { status: 403 });
        }

        const updateFields = {
            updated_at: new Date().toISOString()
        };

        if (body.status) {
            const validStatuses = ['Active', 'Resolved', 'Archived'];
            if (validStatuses.includes(body.status)) {
                updateFields.status = body.status;
            }
        }
        if (body.item_name) updateFields.item_name = body.item_name.trim();
        if (body.category) updateFields.category = body.category.trim();
        if (body.description !== undefined) updateFields.description = body.description.trim();
        if (body.location) updateFields.location = body.location.trim();
        if (body.date) updateFields.date = body.date.trim();

        await db.collection(collectionName).updateOne(query, { $set: updateFields });

        return NextResponse.json({ message: 'Report updated successfully.', updated: updateFields });
    } catch (error) {
        console.error("Error updating report:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams?.id;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        let query = { id: id };
        let collectionName = 'lost_reports';
        let report = await db.collection('lost_reports').findOne(query);

        if (!report) {
            report = await db.collection('found_reports').findOne(query);
            collectionName = 'found_reports';
        }

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const isOwner = currentUser.id === report.user_id;
        const isAdmin = currentUser.isAdmin;

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden. You cannot delete this report.' }, { status: 403 });
        }

        await db.collection(collectionName).deleteOne(query);

        // Record in audit log if admin action
        if (isAdmin && !isOwner) {
            await db.collection('audit_logs').insertOne({
                admin_id: currentUser.id,
                admin_name: currentUser.name || currentUser.full_name,
                action: 'DELETE_REPORT',
                target_report_id: id,
                reason: 'Administrative removal',
                timestamp: new Date().toISOString()
            });
        }

        return NextResponse.json({ message: 'Report removed successfully.' });
    } catch (error) {
        console.error("Error deleting report:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
