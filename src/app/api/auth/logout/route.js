import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST() {
    await destroySession();
    return NextResponse.json({ message: 'Logged out.' });
}
export async function GET() {
    await destroySession();
    return NextResponse.json({ message: 'Logged out.' });
}
