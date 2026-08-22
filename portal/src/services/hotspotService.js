/**
 * SwachhLens — Current Waste Hotspot Intelligence Engine
 *
 * Performs client-side geographic concentration clustering on current
 * Firestore complaints to identify forming waste hotspots across the city.
 *
 * Note: This is real-time geographic concentration analysis (deterministic),
 * NOT predictive machine learning.
 */

import { WASTE_TYPE_LABELS } from '../config/constants.js';

// Local distance helper using Haversine
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Known landmark reference centers for user-friendly area naming
const KNOWN_AREAS = [
  { name: 'Salt Lake Sector V', lat: 22.5867, lng: 88.4178 },
  { name: 'New Town Action Area I', lat: 22.5898, lng: 88.4688 },
  { name: 'Park Circus / Ballygunge', lat: 22.5392, lng: 88.3653 },
  { name: 'Esplanade / Dharmatala', lat: 22.5645, lng: 88.3524 },
  { name: 'Howrah Station Area', lat: 22.5847, lng: 88.3426 },
  { name: 'Connaught Place / Central', lat: 28.6315, lng: 77.2167 },
];

function inferAreaName(lat, lng) {
  let closest = null;
  let minDistance = Infinity;

  for (const area of KNOWN_AREAS) {
    const dist = getDistanceMeters(lat, lng, area.lat, area.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = area.name;
    }
  }

  if (minDistance <= 2500 && closest) {
    return closest;
  }
  return `Geo Zone (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
}

/**
 * Cluster complaints into geographic hotspots.
 *
 * @param {Array} complaints - List of complaint objects from Firestore
 * @param {number} [clusterRadiusMeters=800] - Proximity radius for grouping
 * @returns {Array<Hotspot>} Ranked list of active waste hotspots
 */
export function computeWasteHotspots(complaints, clusterRadiusMeters = 800) {
  const valid = complaints.filter(
    (c) => c.gps && typeof c.gps.lat === 'number' && typeof c.gps.lng === 'number'
  );

  if (valid.length === 0) return [];

  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < valid.length; i++) {
    if (visited.has(valid[i].id)) continue;

    const currentCluster = [valid[i]];
    visited.add(valid[i].id);

    for (let j = i + 1; j < valid.length; j++) {
      if (visited.has(valid[j].id)) continue;

      const dist = getDistanceMeters(
        valid[i].gps.lat, valid[i].gps.lng,
        valid[j].gps.lat, valid[j].gps.lng
      );

      if (dist <= clusterRadiusMeters) {
        currentCluster.push(valid[j]);
        visited.add(valid[j].id);
      }
    }

    clusters.push(currentCluster);
  }

  // Derive hotspot metrics for each cluster
  const hotspots = clusters.map((cluster, index) => {
    const count = cluster.length;
    const centerLat = cluster.reduce((sum, c) => sum + c.gps.lat, 0) / count;
    const centerLng = cluster.reduce((sum, c) => sum + c.gps.lng, 0) / count;

    const avgPriority = Math.round(
      cluster.reduce((sum, c) => sum + (c.priorityScore || 0), 0) / count
    );

    const urgentCount = cluster.filter((c) => c.urgentEscalation).length;
    const unresolvedCount = cluster.filter((c) => c.status !== 'resolved').length;

    // Find dominant waste type
    const wasteTypeCounts = {};
    cluster.forEach((c) => {
      const wt = c.aiResult?.wasteType || 'other';
      wasteTypeCounts[wt] = (wasteTypeCounts[wt] || 0) + 1;
    });

    let dominantWasteType = 'garbage_dump';
    let maxCount = 0;
    for (const [wt, c] of Object.entries(wasteTypeCounts)) {
      if (c > maxCount) {
        maxCount = c;
        dominantWasteType = wt;
      }
    }

    const latestReportTime = Math.max(...cluster.map((c) => c.timestamp || 0));
    const areaName = inferAreaName(centerLat, centerLng);

    // Operational Severity Ranking formula
    const severityScore =
      unresolvedCount * 20 +
      urgentCount * 30 +
      avgPriority * 0.5 +
      count * 5;

    return {
      hotspotId: `hotspot-${index + 1}`,
      areaName,
      centerLat,
      centerLng,
      reportCount: count,
      averagePriority: avgPriority,
      urgentCount,
      unresolvedCount,
      dominantWasteType,
      dominantWasteLabel: WASTE_TYPE_LABELS[dominantWasteType] || dominantWasteType,
      latestReportTime,
      severityScore,
      complaintIds: cluster.map((c) => c.id),
    };
  });

  // Sort by operational severity (highest first)
  hotspots.sort((a, b) => b.severityScore - a.severityScore);

  return hotspots;
}
