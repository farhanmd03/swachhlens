import { COMMERCIAL_RATE_CARD } from '../config/commercialConstants.js';

/**
 * Commercial Rate & Quotation Engine
 *
 * Implements a deterministic, explainable rate calculation layer for
 * bulk and event waste services using a configurable operator rate card.
 *
 * All estimates are explicitly marked as indicative and subject to operator review.
 */

/**
 * Parse duration string (e.g. "3–4 hours" or "4-5 hours") to a numeric median hour.
 */
function parseEstimatedHours(durationStr) {
  if (!durationStr) return 4;
  const matches = durationStr.match(/(\d+)(?:\s*[–-]\s*(\d+))?/);
  if (!matches) return 4;
  const min = parseInt(matches[1], 10);
  const max = matches[2] ? parseInt(matches[2], 10) : min;
  return (min + max) / 2;
}

/**
 * Calculate itemized commercial quote from assessment and event parameters.
 *
 * @param {Object} assessment - Commercial AI/deterministic assessment
 * @param {Object} businessDetails - Event details (attendees, scale, waste types, etc.)
 * @returns {Object} Complete itemized commercial quote object
 */
export function calculateCommercialQuote(assessment, businessDetails = {}) {
  const rateCard = COMMERCIAL_RATE_CARD;
  const scale = businessDetails.estimatedWasteScale || assessment?.estimatedScale || 'medium';
  const scaleMultiplier = rateCard.scaleMultipliers[scale] || 1.25;

  const crewCount = assessment?.estimatedCrew || 3;
  const durationHours = parseEstimatedHours(assessment?.estimatedDuration);
  const vehicle = assessment?.recommendedVehicle || 'Mini Truck';
  const wasteTypes = businessDetails.wasteTypes || [];

  // Base service mobilization & dispatch
  const baseService = rateCard.baseServiceRate;

  // Crew cost: workers * hours * hourly rate
  const crewCost = Math.round(crewCount * durationHours * rateCard.crewRatePerHour);

  // Vehicle rate by vehicle type
  const vehicleCost = rateCard.vehicleRates[vehicle] || rateCard.vehicleRates.default;

  // Operational duration & logistics overhead
  const durationCost = Math.round(durationHours * 180);

  // Material segregation & multi-stream handling surcharge
  const hasMultipleStreams = wasteTypes.length > 2;
  const additionalHandlingCost = hasMultipleStreams ? rateCard.additionalHandlingRate * (wasteTypes.length - 1) : 0;

  // Raw subtotal before scale multiplier
  const rawSubtotal = baseService + crewCost + vehicleCost + durationCost + additionalHandlingCost;
  
  // Scale adjusted total
  const adjustedTotal = Math.round(rawSubtotal * scaleMultiplier);
  // Round to nearest 50
  const indicativeTotal = Math.ceil(adjustedTotal / 50) * 50;

  const lineItems = [
    {
      code: 'BASE_MOBILIZATION',
      label: 'Mobilization & Logistics Base',
      amount: baseService,
      detail: 'Operational dispatch, planning and supervisor coordination',
    },
    {
      code: 'CREW_ALLOCATION',
      label: `Field Crew Allocation (${crewCount} Operatives × ~${durationHours} hrs)`,
      amount: crewCost,
      detail: `Standard field workforce tariff @ ₹${rateCard.crewRatePerHour}/hr per operative`,
    },
    {
      code: 'VEHICLE_LOGISTICS',
      label: `Dedicated Fleet Unit (${vehicle})`,
      amount: vehicleCost,
      detail: 'Transport transit, fuel surcharge and offloading clearance',
    },
    {
      code: 'DURATION_LOGISTICS',
      label: `Site Operations Window (~${durationHours} hrs)`,
      amount: durationCost,
      detail: 'Extended site turnaround and on-ground containment',
    },
  ];

  if (additionalHandlingCost > 0) {
    lineItems.push({
      code: 'MULTI_STREAM_SEGREGATION',
      label: `Multi-Stream Segregation (${wasteTypes.length} Material Types)`,
      amount: additionalHandlingCost,
      detail: 'Dual-stream on-site sorting for recyclable material recovery',
    });
  }

  return {
    baseService,
    crewCost,
    vehicleCost,
    durationCost,
    additionalHandlingCost,
    scaleMultiplier,
    indicativeTotal,
    currency: rateCard.currency,
    currencySymbol: rateCard.currencySymbol,
    rateCardVersion: rateCard.version,
    disclaimer: rateCard.disclaimer,
    lineItems,
    status: 'generated',
    generatedAt: Date.now(),
  };
}
