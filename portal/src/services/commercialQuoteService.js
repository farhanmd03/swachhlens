import { COMMERCIAL_RATE_CARD } from '../config/commercialConstants.js';

/**
 * Commercial Rate & Quotation Engine (Portal / Municipal Operations)
 *
 * Implements deterministic rate calculation layer for bulk and event waste services.
 */

function parseEstimatedHours(durationStr) {
  if (!durationStr) return 4;
  const matches = durationStr.match(/(\d+)(?:\s*[–-]\s*(\d+))?/);
  if (!matches) return 4;
  const min = parseInt(matches[1], 10);
  const max = matches[2] ? parseInt(matches[2], 10) : min;
  return (min + max) / 2;
}

export function calculateCommercialQuote(assessment, businessDetails = {}) {
  const rateCard = COMMERCIAL_RATE_CARD;
  const scale = businessDetails.estimatedWasteScale || assessment?.estimatedScale || 'medium';
  const scaleMultiplier = rateCard.scaleMultipliers[scale] || 1.25;

  const crewCount = assessment?.estimatedCrew || 3;
  const durationHours = parseEstimatedHours(assessment?.estimatedDuration);
  const vehicle = assessment?.recommendedVehicle || 'Mini Truck';
  const wasteTypes = businessDetails.wasteTypes || [];

  const baseService = rateCard.baseServiceRate;
  const crewCost = Math.round(crewCount * durationHours * rateCard.crewRatePerHour);
  const vehicleCost = rateCard.vehicleRates[vehicle] || rateCard.vehicleRates.default;
  const durationCost = Math.round(durationHours * 180);

  const hasMultipleStreams = wasteTypes.length > 2;
  const additionalHandlingCost = hasMultipleStreams ? rateCard.additionalHandlingRate * (wasteTypes.length - 1) : 0;

  const rawSubtotal = baseService + crewCost + vehicleCost + durationCost + additionalHandlingCost;
  const adjustedTotal = Math.round(rawSubtotal * scaleMultiplier);
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
