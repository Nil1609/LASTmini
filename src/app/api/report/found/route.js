import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { saveUploadedImage } from '@/lib/storage';
import { sendReportCreatedEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 });
        }
        
        const formData = await request.formData();
        const itemName = formData.get('item_name')?.toString().trim();
        const category = formData.get('category')?.toString().trim();
        const otherCategory = formData.get('other_category')?.toString().trim() || '';
        const location = formData.get('location')?.toString().trim();
        const date = formData.get('date')?.toString().trim();
        const description = formData.get('description')?.toString().trim() || '';
        const color = formData.get('color')?.toString().trim() || '';
        const brand = formData.get('brand')?.toString().trim() || '';
        const characteristics = formData.get('characteristics')?.toString().trim() || '';
        const time = formData.get('time')?.toString().trim() || '';
        const custody = formData.get('custody')?.toString().trim() || 'Held by finder';

        // Private verification prompt & secret answer set by finder
        const verificationQuestion = formData.get('verification_question')?.toString().trim() || '';
        const verificationAnswer = formData.get('verification_answer')?.toString().trim() || '';

        // Validation
        if (!itemName || itemName.length < 3) {
            return NextResponse.json({ error: 'Please provide a valid item name (at least 3 characters).' }, { status: 400 });
        }
        if (!category) {
            return NextResponse.json({ error: 'Please select an item category.' }, { status: 400 });
        }
        if (!location) {
            return NextResponse.json({ error: 'Please specify the campus location where the item was found.' }, { status: 400 });
        }
        if (!date) {
            return NextResponse.json({ error: 'Please provide the date when the item was found.' }, { status: 400 });
        }

        // Image handling via storage abstraction
        const imageFile = formData.get('image');
        let imageUrl = null;
        if (imageFile && typeof imageFile === 'object' && imageFile.size > 0) {
            const uploadResult = await saveUploadedImage(imageFile);
            if (!uploadResult.success) {
                return NextResponse.json({ error: uploadResult.error }, { status: 400 });
            }
            imageUrl = uploadResult.url;
        }

        const resolvedCategory = (category === 'Others' && otherCategory) 
            ? `Others: ${otherCategory}` 
            : category;

        const report = {
            id: uuidv4(),
            user_id: user.id,
            reporter_name: user.full_name || user.name || 'Adamas Finder',
            reporter_email: user.email || '',
            item_name: itemName,
            category: resolvedCategory,
            description: description,
            color: color,
            brand: brand,
            characteristics: characteristics,
            location: location,
            date: date,
            time: time,
            custody: custody,
            image: imageUrl,
            verification_question: verificationQuestion,
            verification_answer: verificationAnswer, // kept server-side only
            status: 'Active',
            flag_count: 0,
            moderation_status: 'approved',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const client = await clientPromise;
        const db = client.db('aulaf_database');
        
        await db.collection('found_reports').insertOne(report);

        // Send non-AI confirmation email asynchronously
        if (user.email) {
            sendReportCreatedEmail(user.email, itemName, 'Found', report.id).catch(() => {});
        }
        
        // Return report with private verification answer sanitized
        const { verification_answer, ...sanitizedReport } = report;
        return NextResponse.json({ 
            message: 'Found item report published successfully.', 
            report: sanitizedReport 
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating found report:", error);
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}
