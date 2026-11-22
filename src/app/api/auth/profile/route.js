import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { saveUploadedImage } from '@/lib/storage';
import { normalizeIndianTenDigits } from '@/lib/sms';

export async function PUT(request) {
    try {
        const userId = await getSession();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const contentType = request.headers.get('content-type') || '';
        let name, department, phone, bio, avatarFile, removeAvatar, phoneOtp;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            name = formData.get('name')?.toString().trim();
            department = formData.get('department')?.toString().trim();
            phone = formData.get('phone')?.toString().trim();
            bio = formData.get('bio')?.toString().trim();
            phoneOtp = formData.get('phone_otp')?.toString().trim();
            avatarFile = formData.get('avatar');
            removeAvatar = formData.get('remove_avatar') === 'true';
        } else {
            const data = await request.json();
            name = data.name;
            department = data.department;
            phone = data.phone;
            bio = data.bio;
            phoneOtp = data.phone_otp;
            avatarFile = data.avatar;
            removeAvatar = data.remove_avatar === true;
        }

        const client = await clientPromise;
        const db = client.db('aulaf_database');

        const existingUser = await db.collection('users').findOne({
            $or: [{ id: userId }, { _id: userId }]
        });
        if (!existingUser) {
            return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
        }
        
        const updateFields = { 
            updated_at: new Date() 
        };

        if (name) {
            updateFields.name = name;
            updateFields.full_name = name;
        }
        if (department) {
            updateFields.department = department;
            updateFields.school = department;
        }
        if (phone !== undefined && phone !== null) {
            const cleanPhoneDigits = normalizeIndianTenDigits(phone);
            if (cleanPhoneDigits) {
                updateFields.phone = `+91 ${cleanPhoneDigits}`;
            } else {
                updateFields.phone = '';
            }
        }

        if (bio !== undefined && bio !== null) {
            updateFields.bio = bio;
        }

        if (removeAvatar) {
            updateFields.avatar_url = null;
            updateFields.avatar = null;
        } else if (avatarFile) {
            const isFileObj = typeof avatarFile === 'object' && avatarFile?.size > 0;
            const isString = typeof avatarFile === 'string' && avatarFile.trim().length > 0;
            if (isFileObj || isString) {
                const uploadResult = await saveUploadedImage(avatarFile);
                if (!uploadResult.success) {
                    return NextResponse.json({ error: uploadResult.error }, { status: 400 });
                }
                if (uploadResult.url) {
                    updateFields.avatar_url = uploadResult.url;
                    updateFields.avatar = uploadResult.url;
                }
            }
        }

        await db.collection('users').updateOne(
            { $or: [{ id: userId }, { _id: userId }] },
            { $set: updateFields }
        );

        const updatedUserDoc = await db.collection('users').findOne({ $or: [{ id: userId }, { _id: userId }] });
        const { password, ...updatedUser } = updatedUserDoc || {};
        updatedUser.name = updatedUser.name || updatedUser.full_name || 'Student';
        updatedUser.full_name = updatedUser.full_name || updatedUser.name || 'Student';
        updatedUser.avatar_url = updatedUser.avatar_url || updatedUser.avatar || null;
        updatedUser.avatar = updatedUser.avatar_url;

        return NextResponse.json({ 
            message: 'Academic profile credentials updated successfully.',
            user: updatedUser
        });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
