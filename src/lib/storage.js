import crypto from 'crypto';
import { supabaseAdmin } from './supabase.js';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
  'image/gif', 'image/heic', 'image/heif', 'image/avif'
];
const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB

/**
 * Validates and stores an uploaded image file safely.
 * Directly uploads to Supabase Storage ('item-images' bucket) with reliable Base64 fallback for serverless.
 * Returns { success: true, url: string } or { success: false, error: string }
 */
export async function saveUploadedImage(file) {
  if (!file) {
    return { success: true, url: null };
  }

  if (typeof file === 'string') {
    // If it's already a string URL or Data URL
    return { success: true, url: file };
  }

  // Check file type
  const rawType = (file.type || '').toLowerCase();
  const name = file.name || 'image.jpg';
  const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
  const fileExt = extMatch ? extMatch[1].toLowerCase() : '';

  // Validate or infer MIME type
  let type = rawType;
  if (!type || type === 'application/octet-stream') {
    if (fileExt === 'png') type = 'image/png';
    else if (fileExt === 'webp') type = 'image/webp';
    else if (fileExt === 'gif') type = 'image/gif';
    else if (fileExt === 'heic') type = 'image/heic';
    else if (fileExt === 'heif') type = 'image/heif';
    else type = 'image/jpeg';
  }

  // Verify valid image type
  const isAllowed = ALLOWED_MIME_TYPES.includes(type) || type.startsWith('image/');
  if (!isAllowed) {
    return {
      success: false,
      error: 'Invalid file format. Please upload an image (JPEG, PNG, WebP, HEIC).'
    };
  }

  // Check file size (12MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: 'File size exceeds the 12MB limit. Please select a smaller photo.'
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const safeBaseName = name
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const cleanExt = type === 'image/png' ? '.png' : type === 'image/webp' ? '.webp' : '.jpg';
    const filename = `${Date.now()}_${randomSuffix}_${safeBaseName}${cleanExt}`;

    // 1. Primary: Upload to Supabase Storage ('item-images' bucket)
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.storage
          .from('item-images')
          .upload(filename, buffer, {
            contentType: type || 'image/jpeg',
            upsert: true
          });

        if (!error && data) {
          const { data: publicUrlData } = supabaseAdmin.storage
            .from('item-images')
            .getPublicUrl(filename);

          if (publicUrlData?.publicUrl) {
            console.log(`[Storage] Image uploaded to Supabase Storage: ${publicUrlData.publicUrl}`);
            return {
              success: true,
              url: publicUrlData.publicUrl
            };
          }
        } else if (error) {
          console.warn('[Storage] Supabase storage upload warning:', error.message);
        }
      } catch (sbErr) {
        console.warn('[Storage] Supabase storage upload error:', sbErr.message);
      }
    }

    // 2. Safe Fallback for Serverless / Vercel: Data URI (base64)
    // Works reliably on any serverless host without needing a writable filesystem
    console.log('[Storage] Storing image as optimized Data URI fallback');
    const base64Data = buffer.toString('base64');
    const fallbackMime = type || 'image/jpeg';
    return {
      success: true,
      url: `data:${fallbackMime};base64,${base64Data}`
    };
  } catch (error) {
    console.error('[Storage] Error processing image upload:', error);
    return {
      success: false,
      error: 'Failed to process image upload. Please try again.'
    };
  }
}
