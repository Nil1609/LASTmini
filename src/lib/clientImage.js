/**
 * Utility to process and compress images client-side before uploading.
 * Solves mobile phone camera limits (which are typically 6MB-15MB).
 * Resizes large dimensions to max 1280px and outputs a high-quality JPEG (around 200-400KB).
 */
export async function processAndCompressImage(file, maxDimension = 1280, quality = 0.82) {
  if (!file || typeof window === 'undefined') {
    return file;
  }

  // If already small (under 400KB), return as is
  if (file.size < 400 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              }
            } else {
              if (height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              resolve(file);
              return;
            }

            // Fill white background in case of transparent PNG
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (blob && blob.size < file.size) {
                  const safeName = file.name ? file.name.replace(/\.[^/.]+$/, "") + ".jpg" : "photo.jpg";
                  const compressedFile = new File([blob], safeName, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  resolve(compressedFile);
                } else {
                  // If compression didn't reduce size, keep original
                  resolve(file);
                }
              },
              'image/jpeg',
              quality
            );
          } catch (canvasErr) {
            console.warn('[clientImage] Canvas compression fallback:', canvasErr);
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('[clientImage] File reading fallback:', err);
      resolve(file);
    }
  });
}
