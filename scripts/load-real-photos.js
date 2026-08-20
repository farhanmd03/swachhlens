/**
 * SwachhLens — Real Waste Photos Loader & Compressor
 *
 * Loads, downsamples, and compresses the 10 real waste photographs from
 * `demo-assets/` into standard JPEG Base64 strings.
 *
 * Intelligently maps photos to waste categories:
 * - garbage_dump: garbage10.jpeg, garbage15.jpeg, garbage7.jpeg
 * - overflowing_bin: garbage9.jpeg, garbage2.jpg
 * - plastic_waste: garbage4.jpeg, garbage13.jpeg
 * - construction_debris: garbage12.jpeg, garbage7.jpeg
 * - drain_blockage: garbage13.jpeg
 * - e_waste: garbage9.jpeg
 * - hazardous_waste: garbage5.jpg
 * - organic_waste: garbage3.jpeg, garbage2.jpg
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jpeg from 'jpeg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, '..', 'demo-assets');

function processJpegFile(filename, maxW = 640, quality = 75) {
  const filePath = path.join(ASSETS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Demo asset not found: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const decoded = jpeg.decode(fileBuffer, { useTArray: true });

  let { width, height, data } = decoded;

  if (width > maxW) {
    const targetWidth = maxW;
    const targetHeight = Math.round((height * maxW) / width);

    const resizedData = Buffer.alloc(targetWidth * targetHeight * 4);
    const xRatio = width / targetWidth;
    const yRatio = height / targetHeight;

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const srcX = Math.floor(x * xRatio);
        const srcY = Math.floor(y * yRatio);
        const srcIdx = (srcY * width + srcX) * 4;
        const tgtIdx = (y * targetWidth + x) * 4;

        resizedData[tgtIdx] = data[srcIdx];
        resizedData[tgtIdx + 1] = data[srcIdx + 1];
        resizedData[tgtIdx + 2] = data[srcIdx + 2];
        resizedData[tgtIdx + 3] = data[srcIdx + 3];
      }
    }

    data = resizedData;
    width = targetWidth;
    height = targetHeight;
  }

  const encoded = jpeg.encode({ data, width, height }, quality);
  return Buffer.from(encoded.data).toString('base64');
}

// Pre-load and compress all 10 real photographs once into memory
console.log('📸 Loading and compressing 10 real waste photographs from demo-assets/...');

export const REAL_PHOTOS = {
  'garbage10.jpeg': processJpegFile('garbage10.jpeg', 640, 72),
  'garbage12.jpeg': processJpegFile('garbage12.jpeg', 640, 72),
  'garbage13.jpeg': processJpegFile('garbage13.jpeg', 640, 72),
  'garbage15.jpeg': processJpegFile('garbage15.jpeg', 640, 72),
  'garbage2.jpg': processJpegFile('garbage2.jpg', 640, 72),
  'garbage3.jpeg': processJpegFile('garbage3.jpeg', 640, 72),
  'garbage4.jpeg': processJpegFile('garbage4.jpeg', 640, 70), // High res original resized safely
  'garbage5.jpg': processJpegFile('garbage5.jpg', 640, 70),  // High res original resized safely
  'garbage7.jpeg': processJpegFile('garbage7.jpeg', 640, 72),
  'garbage9.jpeg': processJpegFile('garbage9.jpeg', 640, 72),
};

console.log('✅ All 10 real waste photographs loaded into memory.');

// Category to real photo mappings
const CATEGORY_MAP = {
  garbage_dump: ['garbage10.jpeg', 'garbage15.jpeg', 'garbage7.jpeg', 'garbage10.jpeg', 'garbage15.jpeg'],
  overflowing_bin: ['garbage9.jpeg', 'garbage2.jpg', 'garbage9.jpeg', 'garbage2.jpg'],
  plastic_waste: ['garbage4.jpeg', 'garbage13.jpeg', 'garbage4.jpeg'],
  construction_debris: ['garbage12.jpeg', 'garbage7.jpeg', 'garbage12.jpeg', 'garbage7.jpeg'],
  drain_blockage: ['garbage13.jpeg', 'garbage13.jpeg'],
  e_waste: ['garbage9.jpeg', 'garbage9.jpeg'],
  hazardous_waste: ['garbage5.jpg'],
  organic_waste: ['garbage3.jpeg', 'garbage2.jpg'],
};

/**
 * Get real photo Base64 string for a given waste category and variant index
 */
export function getRealPhotoForCategory(wasteType, index = 0) {
  const list = CATEGORY_MAP[wasteType] || CATEGORY_MAP.garbage_dump;
  const filename = list[index % list.length];
  return REAL_PHOTOS[filename];
}
