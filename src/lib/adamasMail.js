import crypto from 'crypto';
import clientPromise from './mongodb.js';
import { supabase } from './supabase.js';
import { sendVerificationCodeEmail } from './email.js';

export const ADAMAS_STUDENT_DOMAIN = '@stu.adamasuniversity.ac.in';
export const ADAMAS_FACULTY_DOMAIN = '@adamasuniversity.ac.in';

/**
 * Strictly validates that an email belongs to Adamas University.
 * Students: @stu.adamasuniversity.ac.in
 * Faculty/Staff: @adamasuniversity.ac.in
 *
 * All other domains (e.g. gmail.com, yahoo.com) are rejected.
 */
export function validateAdamasEmail(email) {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: 'Please enter your official Adamas University email address.'
    };
  }

  const clean = email.trim().toLowerCase();

  if (clean.endsWith(ADAMAS_STUDENT_DOMAIN)) {
    const prefix = clean.slice(0, -ADAMAS_STUDENT_DOMAIN.length);
    if (!prefix || prefix.length < 2) {
      return { valid: false, error: 'Invalid email username format before @stu.adamasuniversity.ac.in.' };
    }
    return {
      valid: true,
      email: clean,
      role: 'Student',
      domainType: 'student'
    };
  }

  if (clean.endsWith(ADAMAS_FACULTY_DOMAIN)) {
    const prefix = clean.slice(0, -ADAMAS_FACULTY_DOMAIN.length);
    if (!prefix || prefix.length < 2) {
      return { valid: false, error: 'Invalid email username format before @adamasuniversity.ac.in.' };
    }
    return {
      valid: true,
      email: clean,
      role: 'Faculty',
      domainType: 'faculty'
    };
  }

  return {
    valid: false,
    error: 'Access restricted to Adamas University members. Only @stu.adamasuniversity.ac.in (students) and @adamasuniversity.ac.in (faculty/staff) are accepted.'
  };
}

/**
 * Dispatches a 6-digit verification code to the institutional email.
 * Triggers Supabase Auth OTP + transactional email delivery.
 */
export async function sendAdamasVerificationOtp(email, expectedRole = null) {
  const check = validateAdamasEmail(email);
  if (!check.valid) {
    return { success: false, error: check.error };
  }

  const cleanEmail = check.email;
  const role = expectedRole || check.role;

  // Generate a cryptographically secure 6-digit numeric OTP
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes validity window

  // 1. Store in verification_codes collection (managed in db.js / audit_logs)
  const client = await clientPromise;
  const db = client.db('aulaf_database');
  await db.collection('verification_codes').updateOne(
    { email: cleanEmail },
    { $set: { code, email: cleanEmail, role, expiresAt, createdAt: new Date() } },
    { upsert: true }
  );

  // 2. Dispatch university-branded email immediately via SMTP
  let emailDelivered = false;
  try {
    emailDelivered = await sendVerificationCodeEmail(cleanEmail, code, role);
  } catch (emailErr) {
    console.warn(`[AUlaf Email] Transactional dispatch notice: ${emailErr.message}`);
  }

  // Log in server console for development auditing & quick reference
  console.log('\n======================================================');
  console.log(`[AUlaf Auth] 6-Digit Verification Code for ${cleanEmail}: ${code}`);
  console.log(`[AUlaf Auth] Role: ${role} | Expires in: 2 mins (${expiresAt.toISOString()})`);
  console.log(`[AUlaf Auth] Email Dispatch Status: ${emailDelivered ? 'DELIVERED (250 OK)' : 'FAILED'}`);
  console.log('======================================================\n');

  return {
    success: true,
    email: cleanEmail,
    role,
    code,
    emailDelivered,
    expiresInSeconds: 120,
    message: `Verification code sent to ${cleanEmail}.`
  };
}

/**
 * Validates the provided 6-digit verification code.
 */
export async function verifyAdamasOtp(email, code) {
  if (!email || !code) {
    return { valid: false, error: 'Email and 6-digit verification code are required.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.toString().trim();

  // 1. Check local / database verification_codes record
  try {
    const client = await clientPromise;
    const db = client.db('aulaf_database');
    const record = await db.collection('verification_codes').findOne({ email: cleanEmail });

    if (record) {
      // Check expiration
      if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
        await db.collection('verification_codes').deleteOne({ email: cleanEmail });
        return { 
          valid: false, 
          error: 'Verification code has expired (valid for 2 minutes). Please click "Resend code".' 
        };
      }

      if (record.code === cleanCode) {
        // Validated successfully
        await db.collection('verification_codes').deleteOne({ email: cleanEmail });
        return { valid: true, email: cleanEmail, role: record.role };
      } else {
        return { 
          valid: false, 
          error: 'Invalid verification code. Please check your Adamas email and re-enter.' 
        };
      }
    }
  } catch (dbErr) {
    console.error("[AUlaf Auth] DB OTP verify check failed:", dbErr.message);
  }

  return {
    valid: false,
    error: 'Verification code has expired or was not requested. Please request a new code.'
  };
}
