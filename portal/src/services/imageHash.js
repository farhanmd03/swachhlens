/**
 * SwachhLens — Lightweight Perceptual Image Hashing (Portal Copy)
 *
 * Implements dHash (difference hash) using HTML5 Canvas.
 * No external libraries, no server-side calls, no ML models.
 */

const HASH_SIZE = 8; // 8×8 grid → 64-bit hash
const HASH_SIMILARITY_HIGH_THRESHOLD = 10;       // ≤ 10 bits differ → high
const HASH_SIMILARITY_MODERATE_THRESHOLD = 20;   // ≤ 20 bits differ → moderate

/**
 * Compute a dHash for a Base64 JPEG string.
 *
 * @param {string} base64 - Raw Base64 image data
 * @param {string} [mimeType='image/jpeg']
 * @returns {Promise<string|null>} 16-character hex hash, or null on failure
 */
export function computeImageHash(base64, mimeType = 'image/jpeg') {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = HASH_SIZE + 1;
          canvas.height = HASH_SIZE;
          const ctx = canvas.getContext('2d');

          ctx.drawImage(img, 0, 0, HASH_SIZE + 1, HASH_SIZE);
          const imageData = ctx.getImageData(0, 0, HASH_SIZE + 1, HASH_SIZE);
          const pixels = imageData.data;

          let bits = '';
          for (let row = 0; row < HASH_SIZE; row++) {
            for (let col = 0; col < HASH_SIZE; col++) {
              const idx = (row * (HASH_SIZE + 1) + col) * 4;
              const idxNext = (row * (HASH_SIZE + 1) + col + 1) * 4;

              const lum = pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114;
              const lumNext = pixels[idxNext] * 0.299 + pixels[idxNext + 1] * 0.587 + pixels[idxNext + 2] * 0.114;

              bits += lum < lumNext ? '1' : '0';
            }
          }

          let hex = '';
          for (let i = 0; i < bits.length; i += 4) {
            hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
          }

          resolve(hex);
        } catch {
          resolve(null);
        }
      };

      img.onerror = () => resolve(null);
      img.src = `data:${mimeType};base64,${base64}`;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Compute the Hamming distance between two hex hash strings.
 *
 * @param {string} hashA - 16-char hex string
 * @param {string} hashB - 16-char hex string
 * @returns {number} Hamming distance (0 = identical, 64 = totally different)
 */
export function hammingDistance(hashA, hashB) {
  if (!hashA || !hashB || hashA.length !== hashB.length) return 64;

  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    const diff = parseInt(hashA[i], 16) ^ parseInt(hashB[i], 16);
    let bits = diff;
    while (bits) {
      distance += bits & 1;
      bits >>= 1;
    }
  }
  return distance;
}

/**
 * Convert Hamming distance to a 0–100 similarity score.
 *
 * @param {number} distance
 * @returns {number} Similarity percentage 0–100
 */
export function hammingToSimilarity(distance) {
  return Math.max(0, Math.round(((64 - distance) / 64) * 100));
}

/**
 * Get a human-readable label for a Hamming distance.
 *
 * @param {number} distance
 * @returns {'high'|'moderate'|'low'|'unavailable'}
 */
export function getSimilarityLabel(distance) {
  if (distance === null || distance === undefined) return 'unavailable';
  if (distance <= HASH_SIMILARITY_HIGH_THRESHOLD) return 'high';
  if (distance <= HASH_SIMILARITY_MODERATE_THRESHOLD) return 'moderate';
  return 'low';
}

export { HASH_SIMILARITY_HIGH_THRESHOLD, HASH_SIMILARITY_MODERATE_THRESHOLD };
