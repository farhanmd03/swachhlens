import { MAX_IMAGE_WIDTH, JPEG_QUALITY, MAX_BASE64_SIZE_BYTES } from '../config/constants.js';

/**
 * Compress an image file to a JPEG Base64 data URL.
 *
 * Steps:
 * 1. Load the image onto a canvas
 * 2. Resize to max width (maintaining aspect ratio)
 * 3. Convert to JPEG with reduced quality
 * 4. Return Base64 data URL
 *
 * @param {File} file - The image file from input or camera
 * @returns {Promise<{dataUrl: string, base64: string, mimeType: string}>}
 */
export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img;
          if (width > MAX_IMAGE_WIDTH) {
            height = Math.round((height * MAX_IMAGE_WIDTH) / width);
            width = MAX_IMAGE_WIDTH;
          }

          // Draw to canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG Base64
          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

          // Extract raw Base64 (without the data:image/jpeg;base64, prefix)
          const base64 = dataUrl.split(',')[1];

          // Safety check: ensure the Base64 string isn't too large
          const sizeBytes = base64.length; // rough estimate (Base64 is ~4/3 of binary)
          if (sizeBytes > MAX_BASE64_SIZE_BYTES) {
            reject(new Error(
              `Compressed image is too large (${Math.round(sizeBytes / 1024)} KB). ` +
              `Maximum allowed is ${Math.round(MAX_BASE64_SIZE_BYTES / 1024)} KB. ` +
              `Try a smaller or simpler image.`
            ));
            return;
          }

          resolve({
            dataUrl,
            base64,
            mimeType: 'image/jpeg',
          });
        } catch (error) {
          reject(new Error(`Image compression failed: ${error.message}`));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image for compression.'));
      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}
