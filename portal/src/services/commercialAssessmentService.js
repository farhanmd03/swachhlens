import {
  ESTABLISHMENT_TYPE_LABELS,
  WASTE_STREAM_LABELS,
  COMMERCIAL_SCALE_LABELS,
} from '../config/commercialConstants.js';

/**
 * AI-Assisted Service Planning Engine for Commercial / Bulk & Event Waste (Portal)
 */

export function generateCommercialAssessmentSync({
  establishmentType = 'wedding_marriage',
  estimatedPeople = 500,
  estimatedWasteScale = 'medium',
  wasteTypes = ['food', 'plastic', 'paper'],
  serviceWindow = 'evening',
  specialInstructions = '',
}) {
  const peopleCount = parseInt(estimatedPeople, 10) || 300;
  const scale = estimatedWasteScale || 'medium';

  let estimatedCrew = 3;
  let recommendedVehicle = 'Mini Truck';
  let estimatedDuration = '3–4 hours';
  const crewReasons = [];
  const vehicleReasons = [];

  if (scale === 'very_large' || peopleCount >= 1500) {
    estimatedCrew = 6;
    recommendedVehicle = 'Mini Truck';
    estimatedDuration = '5–8 hours';
    crewReasons.push('Very large gathering volume (> 1,500 attendees)');
    crewReasons.push('Heavy peak accumulation requires multi-point loading');
    vehicleReasons.push('Payload exceeds standard van capacity; dedicated mini truck required');
    vehicleReasons.push('Direct haulage to bulk transfer station');
  } else if (scale === 'large' || peopleCount >= 600) {
    estimatedCrew = 4;
    recommendedVehicle = 'Mini Truck';
    estimatedDuration = '4–5 hours';
    crewReasons.push(`Large event scale (~${peopleCount} attendees)`);
    crewReasons.push('Dual-point collection: food waste segregation + dry recyclables');
    vehicleReasons.push('Mini truck required for single-trip containment and transfer');
  } else if (scale === 'medium' || peopleCount >= 250) {
    estimatedCrew = 3;
    recommendedVehicle = 'Collection Van';
    estimatedDuration = '3–4 hours';
    crewReasons.push(`Medium scale event (~${peopleCount} attendees)`);
    crewReasons.push('Standard event turnaround with source-segregated bins');
    vehicleReasons.push('Collection Van appropriate for medium payload volume');
  } else {
    estimatedCrew = 2;
    recommendedVehicle = 'Collection Van';
    estimatedDuration = '2–3 hours';
    crewReasons.push('Small scale localized event (< 250 attendees)');
    crewReasons.push('Rapid manual containment and sweep');
    vehicleReasons.push('Collection van suitable for compact access and rapid turnaround');
  }

  if (wasteTypes.length >= 4) {
    estimatedCrew += 1;
    crewReasons.push('Multi-stream segregation requires dedicated sorter on site');
  }

  const hasPlastic = wasteTypes.includes('plastic');
  const hasPaper = wasteTypes.includes('paper');
  const hasGlassMetal = wasteTypes.includes('glass_metal');
  const hasFood = wasteTypes.includes('food');

  const recoverableStreams = [];
  if (hasPlastic) recoverableStreams.push('PET & Beverage Bottles, Shrink Packaging');
  if (hasPaper) recoverableStreams.push('Cardboard Packing Boxes & Decorative Paper');
  if (hasGlassMetal) recoverableStreams.push('Glass Containers & Aluminum Beverage Cans');

  let recoveryOpportunity = 'Moderate';
  let recoveryPathway = 'Authorized recycling/recovery partner (partner confirmation required)';
  let recoveryNotes = 'Separate food and dry recyclable packaging at collection point where feasible.';

  if (recoverableStreams.length >= 2) {
    recoveryOpportunity = 'High';
    recoveryNotes = 'High commercial recovery viability. Segregated dry streams can be routed directly to certified recycling partners, avoiding municipal landfill tipping fees.';
  } else if (recoverableStreams.length === 0 && hasFood) {
    recoveryOpportunity = 'High (Bio-methanation / Composting)';
    recoveryPathway = 'Decentralized municipal wet-waste processing / composting unit';
    recoveryNotes = '100% organic waste stream. Priority routing to bio-gasification / organic compost facility.';
  }

  const streamLabels = wasteTypes.map((t) => WASTE_STREAM_LABELS[t] || t).join(', ');
  const wasteProfile = `${COMMERCIAL_SCALE_LABELS[scale]?.split(' ')[0] || 'Medium'} Event Waste (${streamLabels || 'Mixed solid waste'})`;

  return {
    wasteProfile,
    estimatedScale: scale,
    estimatedCrew,
    recommendedVehicle,
    estimatedDuration,
    recoveryOpportunity,
    recoverableStreams,
    recoveryPathway,
    recoveryNotes,
    crewReasons,
    vehicleReasons,
    confidence: 0.91,
    operationalNotes:
      specialInstructions?.trim() ||
      'Standard site containment. Bins deployed at main aggregation points.',
    aiAssisted: true,
    assessmentDate: Date.now(),
    disclaimer: 'AI-assisted estimate — operator review and site validation required.',
  };
}
