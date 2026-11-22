import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyPassword, createSession } from '@/lib/auth';
import { validateAdamasEmail } from '@/lib/adamasMail';

export async function POST(request) {
    try {
        const data = await request.json();
        const rawEmail = (data.email || '').trim().toLowerCase();

        // Strict institutional email validation
        const check = validateAdamasEmail(rawEmail);
        if (!check.valid) {
            return NextResponse.json({ error: check.error }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');
        
        const user = await db.collection('users').findOne({ email: check.email });
        
        if (user && await verifyPassword(data.password, user.password)) {
            await createSession(user.id);
            const { password, ...userData } = user;
            userData.name = user.name || user.full_name || 'Student';
            userData.full_name = user.full_name || user.name || 'Student';
            userData.department = user.department || user.school || '';
            userData.school = user.school || user.department || '';
            return NextResponse.json({ message: 'Logged in successfully.', user: userData });
        }
        
        return NextResponse.json({ error: 'Invalid login credentials. Please check your Adamas email and password.' }, { status: 401 });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

