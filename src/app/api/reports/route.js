import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = (searchParams.get('q') || '').trim().toLowerCase();
        const typeFilter = (searchParams.get('type') || 'all').toLowerCase(); // 'all', 'lost', 'found'
        const categoryFilter = searchParams.get('category') || '';
        const locationFilter = searchParams.get('location') || '';
        const statusFilter = searchParams.get('status') || 'Active'; // default to 'Active'
        const sortOrder = searchParams.get('sort') === 'oldest' ? 1 : -1;
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        const STANDARD_CATEGORIES = [
            'Electronics',
            'Academic Tools',
            'Bags & Wallets',
            'Keys & Identity',
            'Clothing & Apparel',
            'Books & Documents',
            'Sports & Fitness',
            'Personal Belongings'
        ];

        // Build base query
        const baseQuery = {};
        if (statusFilter && statusFilter !== 'all') {
            baseQuery.status = statusFilter;
        }
        if (categoryFilter && categoryFilter !== 'all') {
            if (categoryFilter.toLowerCase() === 'others' || categoryFilter.toLowerCase() === 'other') {
                baseQuery.$or = [
                    { category: { $regex: /Other/i } },
                    { category: { $nin: STANDARD_CATEGORIES } }
                ];
            } else {
                baseQuery.category = { $regex: new RegExp(categoryFilter, 'i') };
            }
        }
        if (locationFilter && locationFilter !== 'all') {
            baseQuery.location = { $regex: new RegExp(locationFilter, 'i') };
        }
        baseQuery.moderation_status = { $ne: 'hidden' };

        // Fetch lost and found reports concurrently in parallel
        const [lostRaw, foundRaw] = await Promise.all([
            (typeFilter === 'all' || typeFilter === 'lost')
                ? db.collection('lost_reports').find({ ...baseQuery }).toArray()
                : Promise.resolve([]),
            (typeFilter === 'all' || typeFilter === 'found')
                ? db.collection('found_reports').find({ ...baseQuery }).toArray()
                : Promise.resolve([])
        ]);

        const lostList = (lostRaw || []).map(r => ({
            id: r.id || r._id?.toString(),
            type: 'Lost',
            item_name: r.item_name,
            category: r.category,
            description: r.description,
            color: r.color,
            brand: r.brand,
            location: r.location,
            date: r.date,
            time: r.time,
            image: r.image,
            status: r.status || 'Active',
            verification_question: r.verification_question || '',
            created_at: r.created_at
        }));

        const foundList = (foundRaw || []).map(r => ({
            id: r.id || r._id?.toString(),
            type: 'Found',
            item_name: r.item_name,
            category: r.category,
            description: r.description,
            color: r.color,
            brand: r.brand,
            location: r.location,
            date: r.date,
            time: r.time,
            custody: r.custody,
            image: r.image,
            status: r.status || 'Active',
            verification_question: r.verification_question || '',
            created_at: r.created_at
        }));

        let combined = [...lostList, ...foundList];

        // Apply keyword text search if provided
        if (q) {
            combined = combined.filter(item => {
                const searchCorpus = [
                    item.item_name,
                    item.description,
                    item.category,
                    item.location,
                    item.color,
                    item.brand
                ].filter(Boolean).join(' ').toLowerCase();
                return searchCorpus.includes(q);
            });
        }

        // Sort by date
        combined.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return sortOrder === 1 ? dateA - dateB : dateB - dateA;
        });

        const total = combined.length;
        const startIndex = (page - 1) * limit;
        const paginated = combined.slice(startIndex, startIndex + limit);

        return NextResponse.json({
            reports: paginated,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1
            }
        });
    } catch (error) {
        console.error("Failed to load reports:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
