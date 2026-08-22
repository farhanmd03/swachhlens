/**
 * SwachhLens Intervention Recommendation Engine
 *
 * Deterministic, rule-based recommendation system.
 * Each recommendation is fully traceable to the rules below.
 *
 * This is a PROTOTYPE. All worker counts, time estimates, and
 * vehicle types are indicative and should be validated with
 * municipal operations teams before operational use.
 *
 * Municipal operators MUST be able to override every recommendation.
 */

/**
 * Get the recommended intervention for a waste complaint.
 *
 * @param {Object} params
 * @param {string} params.wasteType - One of the known waste type keys
 * @param {string} params.volumeEstimate - 'small' | 'medium' | 'large' | 'very_large'
 * @param {string} params.locationSensitivityHint - Location context key
 * @param {boolean} [params.bioWasteRisk=false] - Bio-waste risk flag
 * @returns {{
 *   recommendedAction: string,
 *   teamType: string,
 *   vehicle: string,
 *   workerCount: number,
 *   estimatedCleanupTime: string,
 *   reasoning: string,
 *   urgent: boolean
 * }}
 */
export function getInterventionRecommendation({
  wasteType,
  volumeEstimate,
  locationSensitivityHint,
  bioWasteRisk = false,
}) {
  // ── Rule 0: Bio-Waste Risk Escalation ───────────────────────────
  if (bioWasteRisk) {
    return {
      recommendedAction: 'Urgent bio-waste containment & sanitized specialized handling',
      teamType: 'manual_cleanup',
      vehicle: 'Specialized Hazmat Vehicle',
      workerCount: 4,
      estimatedCleanupTime: '60–120 minutes',
      reasoning:
        'Potential biological or clinical waste poses direct infection and biohazard risks. ' +
        'Specialized PPE, biohazard containment bags, and sanitized transport are recommended before general handling.',
      urgent: true,
    };
  }

  // ── Rule 1: Hazardous Waste ──────────────────────────────────────
  if (wasteType === 'hazardous_waste') {
    return {
      recommendedAction: 'Immediate hazardous waste containment and safe disposal',
      teamType: 'manual_cleanup',
      vehicle: 'Specialized Hazmat Vehicle',
      workerCount: 6,
      estimatedCleanupTime: '90–180 minutes',
      reasoning:
        'Hazardous waste poses direct risks to public health and the environment. ' +
        'Specialized containment equipment and trained personnel are required. ' +
        'Do not attempt cleanup without proper protective equipment.',
      urgent: true,
    };
  }

  // ── Rule 2: Drain Blockage ───────────────────────────────────────
  if (wasteType === 'drain_blockage') {
    return {
      recommendedAction: 'Urgent drainage clearance to prevent flooding and waterborne disease',
      teamType: 'mini_truck',
      vehicle: 'Suction/Jetting Vehicle',
      workerCount: 4,
      estimatedCleanupTime: '60–120 minutes',
      reasoning:
        'Blocked drainage can cause localized flooding, mosquito breeding, and waterborne disease. ' +
        'Jetting/suction equipment is required for effective clearance.',
      urgent: true,
    };
  }

  // ── Rule 3: E-Waste ─────────────────────────────────────────────
  if (wasteType === 'e_waste') {
    const urgent = locationSensitivityHint === 'near_school' || locationSensitivityHint === 'near_hospital';
    return {
      recommendedAction: 'E-waste collection and safe transfer to certified recycling facility',
      teamType: 'recycling_partner',
      vehicle: 'Recycling Collection Vehicle',
      workerCount: 2,
      estimatedCleanupTime: '30–60 minutes',
      reasoning:
        'Electronic waste contains toxic materials (lead, mercury, cadmium). ' +
        'Must be handled by a certified e-waste recycling partner — not disposed in landfill.',
      urgent,
    };
  }

  // ── Rule 4: Plastic Waste ────────────────────────────────────────
  if (wasteType === 'plastic_waste') {
    const large = volumeEstimate === 'large' || volumeEstimate === 'very_large';
    const urgent = locationSensitivityHint === 'near_school' || locationSensitivityHint === 'near_hospital';
    return {
      recommendedAction: 'Plastic waste collection and sorting for recycling recovery',
      teamType: 'recycling_partner',
      vehicle: large ? 'Mini Truck' : 'Collection Van',
      workerCount: large ? 3 : 2,
      estimatedCleanupTime: large ? '45–90 minutes' : '20–45 minutes',
      reasoning:
        'Plastic waste should be routed to a recycling partner for material recovery ' +
        'rather than landfill disposal, in line with waste segregation guidelines.',
      urgent,
    };
  }

  // ── Rule 5: Large / Very Large volume (any ordinary waste) ──────
  if (volumeEstimate === 'very_large') {
    const urgent = locationSensitivityHint === 'near_school' || locationSensitivityHint === 'near_hospital';
    return {
      recommendedAction: 'Large-scale waste clearance using vehicle-assisted collection',
      teamType: 'mini_truck',
      vehicle: 'Mini Truck',
      workerCount: 5,
      estimatedCleanupTime: '90–180 minutes',
      reasoning:
        'Very large waste accumulation exceeds manual carrying capacity. ' +
        'A mini truck with a full crew is required for efficient clearance.',
      urgent,
    };
  }

  if (volumeEstimate === 'large') {
    const urgent = locationSensitivityHint === 'near_school' || locationSensitivityHint === 'near_hospital';
    return {
      recommendedAction: 'Vehicle-assisted waste clearance',
      teamType: 'mini_truck',
      vehicle: 'Mini Truck',
      workerCount: 3,
      estimatedCleanupTime: '60–90 minutes',
      reasoning:
        'Large waste volume requires vehicle assistance. ' +
        'A mini truck with crew will ensure complete clearance.',
      urgent,
    };
  }

  // ── Rule 6: Location-sensitive small/medium waste ────────────────
  const locationUrgent =
    locationSensitivityHint === 'near_school' ||
    locationSensitivityHint === 'near_hospital';

  if (locationUrgent) {
    return {
      recommendedAction: 'Rapid manual cleanup — sensitive location requires priority response',
      teamType: 'manual_cleanup',
      vehicle: 'Collection Van',
      workerCount: 3,
      estimatedCleanupTime: '20–45 minutes',
      reasoning:
        `Waste near a ${locationSensitivityHint === 'near_school' ? 'school' : 'hospital'} ` +
        'requires priority response to protect vulnerable populations. ' +
        'Manual cleanup team with van is appropriate for this volume.',
      urgent: true,
    };
  }

  // ── Rule 7: Construction Debris ──────────────────────────────────
  if (wasteType === 'construction_debris') {
    return {
      recommendedAction: 'Construction debris removal — requires loading equipment',
      teamType: 'mini_truck',
      vehicle: 'Mini Truck',
      workerCount: 3,
      estimatedCleanupTime: '60–120 minutes',
      reasoning:
        'Construction debris (rubble, concrete, bricks) is heavy and cannot be manually carried. ' +
        'A mini truck with workers for loading is required.',
      urgent: false,
    };
  }

  // ── Rule 8: Overflowing Bin ──────────────────────────────────────
  if (wasteType === 'overflowing_bin') {
    return {
      recommendedAction: 'Bin emptying and area cleanup on scheduled route',
      teamType: 'manual_cleanup',
      vehicle: 'Garbage Collection Vehicle',
      workerCount: 2,
      estimatedCleanupTime: '15–30 minutes',
      reasoning:
        'Overflowing bin indicates the collection schedule needs attention at this location. ' +
        'Standard collection route crew can handle this.',
      urgent: false,
    };
  }

  // ── Rule 9: Default (small/medium organic/general waste) ─────────
  return {
    recommendedAction: 'Standard manual waste collection',
    teamType: 'manual_cleanup',
    vehicle: 'Collection Van',
    workerCount: volumeEstimate === 'medium' ? 2 : 1,
    estimatedCleanupTime: volumeEstimate === 'medium' ? '20–40 minutes' : '10–20 minutes',
    reasoning:
      'Small to medium ordinary waste can be handled by a standard manual cleanup team ' +
      'as part of the regular collection schedule.',
    urgent: false,
  };
}
