import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import {
  DUPLICATE_RADIUS_METERS,
  DUPLICATE_TIME_WINDOW_HOURS,
  WASTE_TYPE_LABELS,
} from '../config/constants.js';
import {
  hammingDistance,
  hammingToSimilarity,
  getSimilarityLabel,
} from './imageHash.js';

/**
 * Calculate distance between two GPS coordinates using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find potential duplicate complaints and return rich multi-factor evidence:
 * combines category match, time window, GPS distance, and perceptual image similarity.
 *
 * @param {string} wasteType - The waste type to check
 * @param {{lat: number, lng: number}} gps - The GPS coordinates
 * @param {string|null} [currentImageHash=null] - Optional 16-char dHash of current photo
 * @returns {Promise<{
 *   isDuplicate: boolean,
 *   duplicateOf: string|null,
 *   complaintNumber: string|null,
 *   distanceMeters: number|null,
 *   hoursApart: number|null,
 *   categoryMatch: boolean,
 *   imageSimilarityScore: number|null,
 *   imageSimilarityLabel: string|null,
 *   confidence: number,
 *   reasons: string[]
 * }>}
 */
export async function findDuplicateEvidence(wasteType, gps, currentImageHash = null) {
  const cutoffTime = Date.now() - DUPLICATE_TIME_WINDOW_HOURS * 60 * 60 * 1000;

  const complaintsRef = collection(db, 'complaints');
  const q = query(
    complaintsRef,
    where('aiResult.wasteType', '==', wasteType),
    where('timestamp', '>', cutoffTime)
  );

  const snapshot = await getDocs(q);

  let bestMatch = null;
  let minDistance = Infinity;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Skip resolved complaints
    if (data.status === 'resolved') continue;

    if (data.gps && data.gps.lat != null && data.gps.lng != null) {
      const distance = haversineDistance(
        gps.lat, gps.lng,
        data.gps.lat, data.gps.lng
      );

      if (distance <= DUPLICATE_RADIUS_METERS && distance < minDistance) {
        minDistance = distance;
        bestMatch = { id: doc.id, data, distance };
      }
    }
  }

  if (!bestMatch) {
    return {
      isDuplicate: false,
      duplicateOf: null,
      complaintNumber: null,
      distanceMeters: null,
      hoursApart: null,
      categoryMatch: false,
      imageSimilarityScore: null,
      imageSimilarityLabel: null,
      confidence: 0,
      reasons: [],
    };
  }

  const { id, data, distance } = bestMatch;
  const distanceMeters = Math.round(distance);
  const hoursApart = Math.max(
    0.1,
    Math.round(((Date.now() - (data.timestamp || Date.now())) / (1000 * 60 * 60)) * 10) / 10
  );

  let imageSimilarityScore = null;
  let imageSimilarityLabel = null;

  if (currentImageHash && data.imageHash) {
    const dist = hammingDistance(currentImageHash, data.imageHash);
    imageSimilarityScore = hammingToSimilarity(dist);
    imageSimilarityLabel = getSimilarityLabel(dist);
  }

  const categoryLabel = WASTE_TYPE_LABELS[wasteType] || wasteType;
  const reasons = [
    `Same waste category (${categoryLabel})`,
    `${distanceMeters}m from existing report`,
    `${hoursApart} hour${hoursApart === 1 ? '' : 's'} apart`,
  ];

  let confidence = 0.75; // baseline multi-factor confidence

  if (imageSimilarityScore !== null) {
    reasons.push(
      `Visual similarity: ${imageSimilarityScore}% (${imageSimilarityLabel} perceptual match)`
    );
    if (imageSimilarityScore >= 80) confidence = 0.95;
    else if (imageSimilarityScore >= 65) confidence = 0.85;
  } else {
    reasons.push('Visual similarity: Comparison unavailable for legacy report');
  }

  return {
    isDuplicate: true,
    duplicateOf: id,
    complaintNumber: data.complaintNumber || null,
    distanceMeters,
    hoursApart,
    categoryMatch: true,
    imageSimilarityScore,
    imageSimilarityLabel,
    confidence,
    reasons,
  };
}

/**
 * Legacy wrapper: Returns just the duplicate document ID or null.
 *
 * @param {string} wasteType
 * @param {{lat: number, lng: number}} gps
 * @param {string|null} [currentImageHash=null]
 * @returns {Promise<string|null>}
 */
export async function findDuplicate(wasteType, gps, currentImageHash = null) {
  const result = await findDuplicateEvidence(wasteType, gps, currentImageHash);
  return result.isDuplicate ? result.duplicateOf : null;
}

/**
 * Count nearby complaints within the past 7 days for report frequency calculation.
 *
 * @param {{lat: number, lng: number}} gps - The GPS coordinates
 * @param {number} radiusMeters - Search radius in meters
 * @param {number} timeWindowDays - Time window in days
 * @returns {Promise<number>} Count of nearby complaints
 */
export async function countNearbyComplaints(gps, radiusMeters, timeWindowDays) {
  const cutoffTime = Date.now() - timeWindowDays * 24 * 60 * 60 * 1000;

  const complaintsRef = collection(db, 'complaints');
  const q = query(
    complaintsRef,
    where('timestamp', '>', cutoffTime)
  );

  const snapshot = await getDocs(q);
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.gps && data.gps.lat != null && data.gps.lng != null) {
      const distance = haversineDistance(
        gps.lat, gps.lng,
        data.gps.lat, data.gps.lng
      );
      if (distance <= radiusMeters) {
        count++;
      }
    }
  }

  return count;
}
