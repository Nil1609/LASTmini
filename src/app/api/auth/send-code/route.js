import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { validateAdamasEmail, sendAdamasVerificationOtp } from '@/lib/adamasMail';

export async function POST(request) {
    try {
        const body = await request.json();
        const rawEmail = body.email;
        const purpose = body.purpose || body.type || 'register'; // 'register' or 'login'

        if (!rawEmail) {
            return NextResponse.json({ error: 'Adamas University email is required.' }, { status: 400 });
        }

        // 1. Strict Institutional Domain Validation
        const check = validateAdamasEmail(rawEmail);
        if (!check.valid) {
            return NextResponse.json({ error: check.error }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        // 2. Pre-check based on purpose
        const existingUser = await db.collection('users').findOne({ email: check.email });

        if (purpose === 'register' && existingUser) {
            return NextResponse.json({ 
                error: 'An account with this Adamas email already exists. Please sign in.' 
            }, { status: 400 });
        }

        if (purpose === 'login' && !existingUser) {
            return NextResponse.json({ 
                error: 'No account registered with this Adamas email. Please register first.' 
            }, { status: 404 });
        }

        // 3. Dispatch OTP via University Email & Supabase Ledger
        const otpResult = await sendAdamasVerificationOtp(check.email, check.role);
        if (!otpResult.success) {
            return NextResponse.json({ error: otpResult.error }, { status: 400 });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Verification code sent to ${check.email}.`,
            role: check.role,
            code: otpResult.code, // Instant backup code in case institutional Outlook delays email
            expiresInSeconds: 120,
            emailDelivered: otpResult.emailDelivered ?? true
        });
    } catch (error) {
        console.error("Send code error:", error);
        return NextResponse.json({ error: 'Failed to send verification code. Please try again.' }, { status: 500 });
    }
}

