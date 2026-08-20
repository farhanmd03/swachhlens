import {
  VOLUME_WEIGHTS,
  LOCATION_SENSITIVITY_WEIGHTS,
  FREQUENCY_RADIUS_METERS,
  FREQUENCY_TIME_WINDOW_DAYS,
  FREQUENCY_CAP,
  URGENT_WASTE_TYPES,
  URGENT_LOCATIONS,
  WASTE_TYPE_LABELS,
  LOCATION_SENSITIVITY_LABELS,
  VOLUME_LABELS,
} from '../config/constants.js';
import { countNearbyComplaints } from './duplicateDetection.js';

/**
 * Generate human-readable reasons for the priority score.
 * Only includes reasons that actually contributed to the score.
 *
 * @param {Object} params
 * @param {string} params.wasteType
 * @param {string} params.volumeEstimate
 * @param {string} params.locationSensitivityHint
 * @param {number} params.nearbyCount
 * @param {number} params.hoursOld
 * @returns {string[]}
 */
export function generatePriorityReasons({
  wasteType,
  volumeEstimate,
  locationSensitivityHint,
  nearbyCount,
  hoursOld,
}) {
  const reasons = [];

  // Volume contribution
  const vw = VOLUME_WEIGHTS[volumeEstimate] ?? 0;
  if (vw >= 0.75) {
    reasons.push(`${VOLUME_LABELS[volumeEstimate] || volumeEstimate} waste volume`);
  } else if (vw >= 0.5) {
    reasons.push('Medium waste volume');
  } else if (vw > 0) {
    reasons.push('Small waste volume');
  }

  // Location sensitivity contribution
  const lw = LOCATION_SENSITIVITY_WEIGHTS[locationSensitivityHint] ?? 0;
  if (lw > 0) {
    reasons.push(LOCATION_SENSITIVITY_LABELS[locationSensitivityHint] || locationSensitivityHint);
  }

  // Nearby reports
  if (nearbyCount >= 1) {
    reasons.push(`${nearbyCount} nearby report${nearbyCount > 1 ? 's' : ''}`);
  }

  // Age
  if (hoursOld >= 1) {
    reasons.push(`Unresolved for ${Math.round(hoursOld)} hour${Math.round(hoursOld) !== 1 ? 's' : ''}`);
  }

  // Urgent waste types as additional context
  if (URGENT_WASTE_TYPES.includes(wasteType)) {
    const label = WASTE_TYPE_LABELS[wasteType] || wasteType;
    if (!reasons.some((r) => r.toLowerCase().includes(label.toLowerCase()))) {
      reasons.push(label);
    }
  }

  return reasons;
}

/**
 * Calculate the priority score for a complaint.
 *
 * Formula:
 *   priorityScore = (volumeWeight × 40) + (locationSensitivity × 30) +
 *                   (reportFrequency × 20) + (ageOfComplaint × 10)
 *
 * @param {Object} params
 * @param {string} params.volumeEstimate
 * @param {string} params.locationSensitivityHint
 * @param {{lat: number, lng: number}} params.gps
 * @param {number} params.timestamp
 * @param {string} [params.wasteType] - Optional, used for priority reasons
 * @returns {Promise<{priorityScore: number, reportFrequency: number, priorityReasons: string[]}>}
 */
export async function calculatePriority({ volumeEstimate, locationSensitivityHint, gps, timestamp, wasteType }) {
  const volumeWeight = VOLUME_WEIGHTS[volumeEstimate] ?? 0.50;
  const locationWeight = LOCATION_SENSITIVITY_WEIGHTS[locationSensitivityHint] ?? 0.00;

  const nearbyCount = await countNearbyComplaints(
    gps,
    FREQUENCY_RADIUS_METERS,
    FREQUENCY_TIME_WINDOW_DAYS
  );
  const reportFrequency = Math.min(nearbyCount, FREQUENCY_CAP) / FREQUENCY_CAP;

  const hoursOld = (Date.now() - timestamp) / (1000 * 60 * 60);
  const ageWeight = Math.min(hoursOld / 48, 1);

  const priorityScore = Math.round(
    (volumeWeight * 40) +
    (locationWeight * 30) +
    (reportFrequency * 20) +
    (ageWeight * 10)
  );

  const priorityReasons = generatePriorityReasons({
    wasteType,
    volumeEstimate,
    locationSensitivityHint,
    nearbyCount,
    hoursOld,
  });

  return {
    priorityScore: Math.max(0, Math.min(100, priorityScore)),
    reportFrequency: nearbyCount,
    priorityReasons,
  };
}

/**
 * Determine if a complaint requires urgent escalation.
 *
 * @param {string} wasteType
 * @param {string} locationSensitivityHint
 * @returns {boolean}
 */
export function calculateUrgentEscalation(wasteType, locationSensitivityHint) {
  return (
    URGENT_WASTE_TYPES.includes(wasteType) ||
    URGENT_LOCATIONS.includes(locationSensitivityHint)
  );
}
