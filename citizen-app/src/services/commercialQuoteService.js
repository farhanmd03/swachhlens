import { COMMERCIAL_RATE_CARD, KOLKATA_OPERATING_ZONES } from '../config/commercialConstants.js';

/**
 * Transparent Commercial Rate & Quotation Engine — Kolkata Baseline
 *
 * Implements an explainable, deterministic rate calculation layer for
 * planned bulk and complex waste collection services.
 *
 * All estimates are explicitly marked as:
 * "Illustrative Prototype Estimate — Subject to Operator Review"
 */

function parseEstimatedHours(durationStr) {
  if (!durationStr) return 3;
  const matches = String(durationStr).match(/(\d+)(?:\s*[–-]\s*(\d+))?/);
  if (!matches) return 3;
  const min = parseInt(matches[1], 10);
  const max = matches[2] ? parseInt(matches[2], 10) : min;
  return (min + max) / 2;
}

export function calculateCommercialQuote(assessment, businessDetails = {}) {
  const rateCard = COMMERCIAL_RATE_CARD;
  const scale = businessDetails.estimatedWasteScale || assessment?.estimatedScale || 'medium';
  const scaleMultiplier = rateCard.scaleMultipliers[scale] || 1.25;

  const crewCount = assessment?.recommendedCrewSize || assessment?.estimatedCrew || 3;
  const durationHours = parseEstimatedHours(assessment?.estimatedDuration);
  const vehicle = assessment?.recommendedVehicle || 'Collection Van';
  const wasteTypes = businessDetails.wasteTypes || [];
  const operatingZone = businessDetails.operatingZone || 'zone_a';
  const serviceWindow = businessDetails.serviceWindow || 'morning';
  const additionalTripsRequired = businessDetails.additionalTripsRequired || (scale === 'very_large' ? 1 : 0);

  // 1. Base Service (mobilization, dispatch & routing setup)
  const baseService = rateCard.baseServiceRate;

  // 2. Crew cost
  const crewCost = Math.round(crewCount * durationHours * rateCard.crewRatePerHour);

  // 3. Dedicated vehicle operational tariff
  const vehicleCost = rateCard.vehicleRates[vehicle] || rateCard.vehicleRates.default;

  // 4. Transport / logistics (operating zone based)
  const zoneInfo = KOLKATA_OPERATING_ZONES[operatingZone] || KOLKATA_OPERATING_ZONES.zone_a;
  const transportCost = zoneInfo.transportAllowance;

  // 5. Configured Kolkata prototype processing & disposal allowance
  const disposalCost = rateCard.kolkataDisposalAllowance;

  // 6. Additional trip required (if volume/trips require)
  const additionalTripCost = additionalTripsRequired > 0 ? additionalTripsRequired * rateCard.additionalTripRate : 0;

  // 7. Segregation / handling surcharge (if multi-stream or unsegregated)
  const hasMultipleStreams = wasteTypes.length > 2;
  const segregationCost = hasMultipleStreams ? rateCard.additionalHandlingRate : 0;

  // 8. Service-window adjustment (immediate post-event turnaround)
  const windowAdjustmentCost = serviceWindow === 'immediate' ? rateCard.rapidTurnaroundSurcharge : 0;

  // Raw Subtotal & Scale Multiplier
  const rawSubtotal =
    baseService +
    crewCost +
    vehicleCost +
    transportCost +
    disposalCost +
    additionalTripCost +
    segregationCost +
    windowAdjustmentCost;

  // Scale adjusted total, rounded cleanly to nearest ₹50
  const adjustedTotal = Math.round(rawSubtotal * (scale === 'small' ? 1.0 : scale === 'medium' ? 1.15 : scaleMultiplier));
  const indicativeTotal = Math.ceil(adjustedTotal / 50) * 50;

  // Detailed, transparent line items for customer display
  const lineItems = [
    {
      code: 'BASE_SERVICE',
      label: 'Base Service Mobilization',
      amount: baseService,
      detail: 'Operational dispatch, planning & supervisory coordination',
    },
    {
      code: 'CREW_ALLOCATION',
      label: `Field Crew Allocation (${crewCount} Personnel × ~${durationHours} hrs)`,
      amount: crewCost,
      detail: `Standard field workforce tariff @ ₹${rateCard.crewRatePerHour}/hr per operative`,
    },
    {
      code: 'VEHICLE_LOGISTICS',
      label: `Dedicated Fleet Unit (${vehicle})`,
      amount: vehicleCost,
      detail: 'Assigned collection vehicle shift operational tariff',
    },
    {
      code: 'TRANSPORT_LOGISTICS',
      label: `Transport / Logistics (${zoneInfo.label.split('—')[1]?.trim() || 'Kolkata Zone'})`,
      amount: transportCost,
      detail: 'Operating zone transit and depot routing allowance',
    },
    {
      code: 'DISPOSAL_ALLOWANCE',
      label: 'Disposal & Processing Trip Allowance',
      amount: disposalCost,
      detail: 'Standard Kolkata authorized recovery & transfer point allowance',
    },
  ];

  if (additionalTripCost > 0) {
    lineItems.push({
      code: 'ADDITIONAL_TRIP',
      label: `Additional Vehicle Trip (${additionalTripsRequired} Extra Trip)`,
      amount: additionalTripCost,
      detail: 'Volume capacity expansion requiring secondary transfer run',
    });
  }

  if (segregationCost > 0) {
    lineItems.push({
      code: 'SEGREGATION_HANDLING',
      label: `Segregation & Multi-Stream Handling (${wasteTypes.length} Material Types)`,
      amount: segregationCost,
      detail: 'Multi-stream containment and separate loading handling',
    });
  }

  if (windowAdjustmentCost > 0) {
    lineItems.push({
      code: 'WINDOW_ADJUSTMENT',
      label: 'Rapid Service Window Surcharge',
      amount: windowAdjustmentCost,
      detail: 'Immediate post-event expedited mobilization priority',
    });
  }

  return {
    baseService,
    crewCost,
    vehicleCost,
    transportCost,
    disposalCost,
    additionalTripCost,
    segregationCost,
    windowAdjustmentCost,
    indicativeTotal,
    totalQuote: indicativeTotal,
    scaleMultiplier,
    currency: rateCard.currency,
    currencySymbol: rateCard.currencySymbol,
    rateCardVersion: rateCard.version,
    disclaimer: rateCard.disclaimer,
    lineItems,
    status: 'generated',
    generatedAt: Date.now(),
  };
}
