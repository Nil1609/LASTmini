import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('aulaf_database');
        
        const activeLost = await db.collection('lost_reports').find({ status: 'Active', moderation_status: { $ne: 'hidden' } }).toArray();
        const activeFound = await db.collection('found_reports').find({ status: 'Active', moderation_status: { $ne: 'hidden' } }).toArray();
        
        const recoveredLost = await db.collection('lost_reports').countDocuments({ status: 'Resolved' });
        const recoveredFound = await db.collection('found_reports').countDocuments({ status: 'Resolved' });
        
        const lostMapped = activeLost.map(r => ({
            id: r.id || r._id?.toString(),
            type: 'Lost',
            item_name: r.item_name,
            category: r.category,
            description: r.description,
            location: r.location,
            date: r.date,
            time: r.time,
            image: r.image,
            color: r.color || '',
            brand: r.brand || '',
            reporter_name: r.reporter_name || '',
            created_at: r.created_at
        }));

        const foundMapped = activeFound.map(r => ({
            id: r.id || r._id?.toString(),
            type: 'Found',
            item_name: r.item_name,
            category: r.category,
            description: r.description,
            location: r.location,
            date: r.date,
            time: r.time,
            image: r.image,
            color: r.color || '',
            brand: r.brand || '',
            custody: r.custody || '',
            verification_question: r.verification_question || '',
            reporter_name: r.reporter_name || '',
            created_at: r.created_at
        }));
        
        const allReports = [...lostMapped, ...foundMapped];
        allReports.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        const recentReports = allReports.slice(0, 6);
        
        const stats = {
            totalActive: activeLost.length + activeFound.length,
            activeLost: activeLost.length,
            activeFound: activeFound.length,
            recovered: recoveredLost + recoveredFound,
            totalArchived: recoveredLost + recoveredFound
        };
        
        return NextResponse.json({ stats, recent_reports: recentReports });
    } catch (error) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
