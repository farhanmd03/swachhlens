import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { DUPLICATE_RADIUS_METERS, DUPLICATE_TIME_WINDOW_HOURS } from '../config/constants.js';

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
 * Find potential duplicate complaints.
 *
 * Queries Firestore for unresolved complaints of the same waste type
 * within the past 48 hours, then filters by GPS proximity (≤50m).
 *
 * @param {string} wasteType - The waste type to check
 * @param {{lat: number, lng: number}} gps - The GPS coordinates
 * @returns {Promise<string|null>} The ID of the duplicate complaint, or null
 */
export async function findDuplicate(wasteType, gps) {
  // Query by wasteType + timestamp only — these two fields need a composite
  // index (aiResult.wasteType ASC, timestamp DESC) which is defined in
  // firestore.indexes.json.
  //
  // We intentionally avoid combining '!=' with '>' in Firestore because
  // that combination requires a more complex index and the SDK v9 rejects
  // it at runtime if the index is not deployed.
  //
  // Instead we filter status !== 'resolved' client-side after fetching.
  const cutoffTime = Date.now() - DUPLICATE_TIME_WINDOW_HOURS * 60 * 60 * 1000;

  const complaintsRef = collection(db, 'complaints');
  const q = query(
    complaintsRef,
    where('aiResult.wasteType', '==', wasteType),
    where('timestamp', '>', cutoffTime)
  );

  const snapshot = await getDocs(q);

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Client-side filter: skip resolved complaints
    if (data.status === 'resolved') continue;

    if (data.gps && data.gps.lat != null && data.gps.lng != null) {
      const distance = haversineDistance(
        gps.lat, gps.lng,
        data.gps.lat, data.gps.lng
      );
      if (distance <= DUPLICATE_RADIUS_METERS) {
        return doc.id;
      }
    }
  }

  return null;
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
