import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import clientPromise from './mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'au_lost_and_found_secret_key';

export async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

export async function createSession(userId) {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return null;
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.userId;
    } catch (error) {
        return null;
    }
}

const userCache = new Map();
const USER_CACHE_TTL = 30 * 1000; // 30 seconds

export function clearUserCache(userId) {
    if (userId) userCache.delete(userId);
    else userCache.clear();
}

export async function getCurrentUser() {
    const userId = await getSession();
    if (!userId) return null;

    const cached = userCache.get(userId);
    if (cached && (Date.now() - cached.timestamp < USER_CACHE_TTL)) {
        return cached.data;
    }

    try {
        const client = await clientPromise;
        const db = client.db('aulaf_database');
        let user = await db.collection('users').findOne({ id: userId });
        if (!user) {
            user = await db.collection('users').findOne({ _id: userId });
        }
        if (!user) return null;

        const { password, ...userData } = user;
        userData.name = user.name || user.full_name || 'Student';
        userData.full_name = user.full_name || user.name || 'Student';
        userData.role = user.role || 'Student';
        userData.isAdmin = ['admin', 'moderator', 'security'].includes((user.role || '').toLowerCase());
        userData.avatar_url = user.avatar_url || user.avatar || user.profile_picture || null;
        userData.avatar = userData.avatar_url;

        userCache.set(userId, { data: userData, timestamp: Date.now() });
        return userData;
    } catch (err) {
        console.error("getCurrentUser error:", err);
        return null;
    }
}

export async function destroySession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded?.userId) userCache.delete(decoded.userId);
        } catch (e) {}
    }
    cookieStore.delete('session');
}
