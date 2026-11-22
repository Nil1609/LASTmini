import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { hashPassword, createSession } from '@/lib/auth';
import { validateAdamasEmail, verifyAdamasOtp } from '@/lib/adamasMail';
import { v4 as uuidv4 } from 'uuid';

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
        
        // 2. Ensure Email Not Already Taken
        const existingUser = await db.collection('users').findOne({ email: check.email });
        if (existingUser) {
            return NextResponse.json({ error: 'An account with this Adamas email already exists. Please sign in.' }, { status: 400 });
        }
        
        if (data.confirm_password && data.password !== data.confirm_password) {
            return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
        }

        if (!data.password || data.password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
        }

        // Validate that Roll Number and Registration Number are distinct
        if (data.roll_number && data.reg_number) {
            if (data.roll_number.trim().toLowerCase() === data.reg_number.trim().toLowerCase()) {
                return NextResponse.json({ 
                    error: 'College Roll Number and University Registration Number must be different.' 
                }, { status: 400 });
            }
        }

        // 3. Verify Institutional OTP
        const otpCheck = await verifyAdamasOtp(check.email, code);
        if (!otpCheck.valid) {
            return NextResponse.json({ error: otpCheck.error }, { status: 400 });
        }
        
        const hashedPassword = await hashPassword(data.password);
        
        // Match institutional role: @stu is Student, @adamasuniversity is Faculty/Staff
        const assignedRole = check.role || data.role || 'Student';

        let studentId = data.student_id || '';
        if (data.roll_number && data.reg_number) {
            studentId = `Roll: ${data.roll_number.trim()} | Reg: ${data.reg_number.trim()}`;
        } else if (data.roll_number) {
            studentId = `Roll: ${data.roll_number.trim()}`;
        } else if (data.reg_number) {
            studentId = `Reg: ${data.reg_number.trim()}`;
        }

        const user = {
            id: uuidv4(),
            full_name: data.full_name || 'Adamas Member',
            email: check.email,
            student_id: studentId,
            school: data.school || 'School of Engineering & Technology (SOET)',
            role: assignedRole,
            phone: data.phone || '',
            password: hashedPassword,
            created_at: new Date().toISOString()
        };
        
        await db.collection('users').insertOne(user);
        
        // 4. Automatically create session for a frictionless onboarding experience
        await createSession(user.id);

        const { password, ...safeUser } = user;
        safeUser.name = user.full_name;

        return NextResponse.json({ 
            success: true,
            message: 'Institutional enrollment complete! Welcome to AUlaf.',
            user: safeUser
        }, { status: 201 });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: 'Registration failed. Please check network and try again.' }, { status: 500 });
    }
}

