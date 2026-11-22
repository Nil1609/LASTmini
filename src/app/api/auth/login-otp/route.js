import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { createSession } from '@/lib/auth';
import { validateAdamasEmail, verifyAdamasOtp } from '@/lib/adamasMail';

export async function POST(request) {
    try {
        const data = await request.json();
        const rawEmail = data.email;
        const code = data.code;

        // 1. Strict Institutional Domain Validation
        const check = validateAdamasEmail(rawEmail);
        if (!check.valid) {
            return NextResponse.json({ error: check.error }, { status: 400 });
        }

        if (!code || code.toString().trim().length !== 6) {
            return NextResponse.json({ error: 'Please enter the 6-digit verification code sent to your Adamas email.' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        // 2. Check if user exists in database
        const user = await db.collection('users').findOne({ email: check.email });
        if (!user) {
            return NextResponse.json({ 
                error: 'No registered account found with this Adamas email. Please complete enrollment first.' 
            }, { status: 404 });
        }

        // 3. Verify OTP
        const otpCheck = await verifyAdamasOtp(check.email, code);
        if (!otpCheck.valid) {
            return NextResponse.json({ error: otpCheck.error }, { status: 400 });
        }

        // 4. Authenticate & create session
        await createSession(user.id);
        const { password, ...userData } = user;
        userData.name = user.name || user.full_name || 'Adamas Member';
        userData.full_name = user.full_name || user.name || 'Adamas Member';
        userData.department = user.department || user.school || '';
        userData.school = user.school || user.department || '';

        return NextResponse.json({ 
            success: true, 
            message: 'Signed in successfully via Adamas OTP verification.', 
            user: userData 
        });
    } catch (error) {
        console.error("LOGIN OTP ERROR:", error);
        return NextResponse.json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
    }
}
