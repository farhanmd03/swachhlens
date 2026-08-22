/**
 * SwachhLens — Smart Dispatch Recommendation Engine
 *
 * Deterministic decision-support layer to determine WHICH eligible municipal
 * team should be assigned to a complaint based on:
 * 1. Required capability match
 * 2. Approximate geographic proximity (Haversine straight-line distance)
 * 3. Current active team workload
 * 4. Urgency / priority level
 * 5. Team active availability
 *
 * Prototype decision-support advisory: municipal operators retain final authority.
 */

import { TEAM_TYPE_LABELS } from '../config/constants.js';

/**
 * Representative Operational Zones and Base Coordinates for Demo Units.
 * If Firestore team document already has primaryZone, baseLat, baseLng,
 * those take precedence; otherwise, fallback to these defaults.
 */
export const DEFAULT_TEAM_ZONES = {
  'team-manual-a': {
    primaryZone: 'Zone A (Salt Lake / Bidhannagar)',
    zoneShort: 'Zone A',
    baseLat: 22.5800,
    baseLng: 88.4200,
    capabilityDescription: 'Routine manual sweep, small accumulation & overflowing bins',
  },
  'team-truck-1': {
    primaryZone: 'Zone B (New Town / Rajarhat)',
    zoneShort: 'Zone B',
    baseLat: 22.5900,
    baseLng: 88.4700,
    capabilityDescription: 'Heavy waste, construction debris, drain clearance & high volume',
  },
  'team-recycle-gc': {
    primaryZone: 'Zone C (Central Kolkata / Sealdah)',
    zoneShort: 'Zone C',
    baseLat: 22.5650,
    baseLng: 88.3700,
    capabilityDescription: 'Plastic recovery, e-waste segregation & recyclable transit',
  },
  'team-manual-b': {
    primaryZone: 'Zone D (South Kolkata / Ballygunge)',
    zoneShort: 'Zone D',
    baseLat: 22.5250,
    baseLng: 88.3650,
    capabilityDescription: 'Routine manual sweep & residential ward cleanup',
  },
};

/**
 * Enrich a team object with its operational zone and base coordinates.
 *
 * @param {Object} team
 * @returns {Object} Enriched team object
 */
export function getTeamWithZone(team) {
  if (!team) return team;
  const defaults = DEFAULT_TEAM_ZONES[team.id] || {
    primaryZone: team.primaryZone || 'General Municipal Zone',
    zoneShort: 'General Zone',
    baseLat: team.baseLat || 22.5726,
    baseLng: team.baseLng || 88.3639,
    capabilityDescription: 'Municipal response unit',
  };

  return {
    ...team,
    primaryZone: team.primaryZone || defaults.primaryZone,
    zoneShort: team.zoneShort || defaults.zoneShort,
    baseLat: team.baseLat != null ? team.baseLat : defaults.baseLat,
    baseLng: team.baseLng != null ? team.baseLng : defaults.baseLng,
    capabilityDescription: team.capabilityDescription || defaults.capabilityDescription,
  };
}

/**
 * Calculate approximate straight-line geographic distance in kilometers (Haversine).
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number|null} Distance in km
 */
export function calculateGeographicDistanceKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Generate a smart dispatch recommendation for a complaint among available teams.
 *
 * @param {Object} params
 * @param {Object} params.complaint - Full complaint document
 * @param {Array} params.teams - List of teams from Firestore
 * @returns {{
 *   success: boolean,
 *   recommendedTeamId: string|null,
 *   recommendedTeamName?: string,
 *   recommendedTeamType?: string,
 *   primaryZone?: string,
 *   approximateDistanceKm?: number|null,
 *   currentLoad?: number,
 *   capabilityMatch?: boolean,
 *   workloadScore?: number,
 *   urgencyReason?: string|null,
 *   reasoning: string[],
 *   message?: string
 * }}
 */
export function recommendDispatch({ complaint, teams }) {
  if (!complaint || !teams || teams.length === 0) {
    return {
      success: false,
      recommendedTeamId: null,
      message: 'No teams available for evaluation.',
      reasoning: ['No response teams found in system.'],
    };
  }

  // 1. Determine Required Team Capability
  let requiredType = complaint.recommendedIntervention?.teamType;
  if (!requiredType) {
    const wt = complaint.aiResult?.wasteType;
    const vol = complaint.aiResult?.volumeEstimate;
    if (wt === 'e_waste' || wt === 'plastic_waste') {
      requiredType = 'recycling_partner';
    } else if (
      wt === 'construction_debris' ||
      wt === 'drain_blockage' ||
      vol === 'large' ||
      vol === 'very_large'
    ) {
      requiredType = 'mini_truck';
    } else {
      requiredType = 'manual_cleanup';
    }
  }

  // 2. Filter Active Teams with matching capability
  const enrichedTeams = teams.map(getTeamWithZone);
  const eligibleTeams = enrichedTeams.filter(
    (t) => t.active && t.type === requiredType
  );

  if (eligibleTeams.length === 0) {
    return {
      success: false,
      recommendedTeamId: null,
      message: 'No suitable active team currently available for this waste category.',
      requiredType,
      reasoning: [
        `Required capability: ${TEAM_TYPE_LABELS[requiredType] || requiredType}`,
        'All matching operational units are currently inactive or unassigned.',
      ],
    };
  }

  // 3. Evaluate and Rank Eligible Teams
  const isUrgent = !!(
    complaint.urgentEscalation ||
    complaint.aiResult?.bioWasteRisk ||
    (complaint.priorityScore && complaint.priorityScore >= 70)
  );
  const cLat = complaint.gps?.lat;
  const cLng = complaint.gps?.lng;

  const evaluated = eligibleTeams.map((team) => {
    const distanceKm =
      cLat != null && cLng != null
        ? calculateGeographicDistanceKm(cLat, cLng, team.baseLat, team.baseLng)
        : null;

    const currentLoad = team.currentLoad || 0;

    // Proximity score: 100 max, penalised by 10 points per km
    const proximityScore =
      distanceKm != null ? Math.max(0, 100 - distanceKm * 10) : 70;
    // Workload score: 100 max, penalised by 25 points per active job
    const workloadScore = Math.max(0, 100 - currentLoad * 25);

    // Composite ranking formula:
    // Urgent: 65% proximity, 35% workload capacity
    // Normal: 40% proximity, 60% workload capacity
    const compositeScore = isUrgent
      ? proximityScore * 0.65 + workloadScore * 0.35
      : proximityScore * 0.4 + workloadScore * 0.6;

    return {
      team,
      distanceKm,
      currentLoad,
      proximityScore,
      workloadScore,
      compositeScore,
    };
  });

  // Sort: highest compositeScore first, then closest distance, then lowest load
  evaluated.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }
    if (a.distanceKm != null && b.distanceKm != null && a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }
    return a.currentLoad - b.currentLoad;
  });

  const best = evaluated[0];
  const bestTeam = best.team;

  // 4. Formulate Transparent Advisory Reasons
  const reasoning = [];
  reasoning.push(`Required capability: ${TEAM_TYPE_LABELS[bestTeam.type] || bestTeam.type}`);

  if (best.distanceKm != null) {
    reasoning.push(
      `Approximate proximity: ~${best.distanceKm.toFixed(1)} km (${bestTeam.zoneShort || bestTeam.primaryZone})`
    );
  } else {
    reasoning.push(`Base operational area: ${bestTeam.primaryZone}`);
  }

  if (best.currentLoad === 0) {
    reasoning.push('Zero active jobs (Immediate full availability)');
  } else if (best.currentLoad <= 2) {
    reasoning.push(`Available capacity (${best.currentLoad} active task${best.currentLoad !== 1 ? 's' : ''})`);
  } else {
    reasoning.push(`Moderate load (${best.currentLoad} active tasks)`);
  }

  if (isUrgent) {
    reasoning.push('Prioritized nearest operational unit for urgent priority response');
  }

  return {
    success: true,
    recommendedTeamId: bestTeam.id,
    recommendedTeamName: bestTeam.name,
    recommendedTeamType: bestTeam.type,
    primaryZone: bestTeam.primaryZone,
    approximateDistanceKm: best.distanceKm != null ? Number(best.distanceKm.toFixed(1)) : null,
    currentLoad: best.currentLoad,
    capabilityMatch: true,
    workloadScore: Math.round(best.workloadScore),
    urgencyReason: isUrgent ? 'Critical/Urgent incident prioritized for nearest response unit' : null,
    reasoning,
  };
}
