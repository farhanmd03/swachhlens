import {
  ESTABLISHMENT_TYPE_LABELS,
  WASTE_STREAM_LABELS,
  COMMERCIAL_SCALE_LABELS,
} from '../config/commercialConstants.js';

/**
 * Synchronous assessment generator for portal operations
 */
export function generateCommercialAssessment({
  establishmentType = 'housing_society',
  estimatedPeople = 400,
  estimatedWasteScale = 'medium',
  wasteTypes = ['food', 'plastic', 'paper'],
  serviceWindow = 'morning',
  specialInstructions = '',
  operatingZone = 'zone_a',
}) {
  const peopleCount = parseInt(estimatedPeople, 10) || 300;
  const scale = estimatedWasteScale || 'medium';

  let estimatedCrew = 3;
  let recommendedVehicle = 'Collection Van';
  let estimatedDuration = '3–4 hours';
  const crewReasons = [];
  const vehicleReasons = [];

  if (scale === 'very_large' || peopleCount >= 1500) {
    estimatedCrew = 6;
    recommendedVehicle = 'Mini Truck';
    estimatedDuration = '5–6 hours';
    crewReasons.push('Substantial gathering / complex footprint (> 1,500 people)');
    crewReasons.push('Multi-point collection required across site or campus grounds');
    vehicleReasons.push('Volume requires heavy-duty mini truck for bulk containment');
    vehicleReasons.push('High-capacity transfer to authorized municipal recovery point');
  } else if (scale === 'large' || peopleCount >= 600) {
    estimatedCrew = 4;
    recommendedVehicle = 'Mini Truck';
    estimatedDuration = '4–5 hours';
    crewReasons.push(`Large-scale operation (~${peopleCount} people)`);
    crewReasons.push('Segregated handling: wet organic stream + dry recyclables');
    vehicleReasons.push('Mini truck allocated for single-trip collection and transport');
  } else if (scale === 'medium' || peopleCount >= 250) {
    estimatedCrew = 3;
    recommendedVehicle = 'Collection Van';
    estimatedDuration = '3–4 hours';
    crewReasons.push(`Medium scale establishment (~${peopleCount} people)`);
    crewReasons.push('Standard turnaround with designated collection point sweep');
    vehicleReasons.push('Collection Van appropriate for compact access and standard payload');
  } else {
    estimatedCrew = 2;
    recommendedVehicle = 'Collection Van';
    estimatedDuration = '2–3 hours';
    crewReasons.push('Small localized collection (< 250 people)');
    crewReasons.push('Standard manual collection and sweep');
    vehicleReasons.push('Collection Van suitable for narrow lane access');
  }

  if (wasteTypes.length >= 3) {
    crewReasons.push('Multi-stream segregation requires dedicated sorting handling');
  }

  const recoverableTags = [];
  if (wasteTypes.includes('paper')) {
    recoverableTags.push('Paper');
    recoverableTags.push('Cardboard');
  }
  if (wasteTypes.includes('plastic')) {
    recoverableTags.push('Plastic');
  }
  if (wasteTypes.includes('glass_metal')) {
    recoverableTags.push('Metal');
    recoverableTags.push('Glass');
  }
  if (wasteTypes.includes('other') || wasteTypes.includes('mixed')) {
    recoverableTags.push('Other recyclable dry waste');
  }
  if (wasteTypes.includes('food')) {
    recoverableTags.push('Compostable Food & Organics');
  }

  const uniqueRecoverableMaterials = Array.from(new Set(recoverableTags));

  let recoveryOpportunity = 'Moderate';
  let recoveryPathway = 'Potential recovery / recycling pathway via authorized processing facilities';
  let recoveryNotes = 'Separate dry packaging and wet organic material at the designated collection point.';

  if (uniqueRecoverableMaterials.length >= 3) {
    recoveryOpportunity = 'High Viability';
    recoveryPathway = 'Potential recovery / recycling pathway (segregated dry recyclables & composting)';
    recoveryNotes = 'Multiple recyclable fractions identified. Pre-sorting at venue significantly enhances diversion potential.';
  } else if (wasteTypes.includes('food') && !wasteTypes.includes('plastic')) {
    recoveryOpportunity = 'High Organic Viability';
    recoveryPathway = 'Potential recovery / composting pathway via authorized organic processing unit';
    recoveryNotes = 'Predominantly organic material. Suitable for direct routing to authorized municipal composting or biomethanation.';
  }

  const estLabel = ESTABLISHMENT_TYPE_LABELS[establishmentType] || establishmentType;
  const summaryPlan = `Planned operations service for ${estLabel} with ${estimatedCrew} personnel and ${recommendedVehicle}.`;

  return {
    summaryPlan,
    estimatedScale: scale,
    recommendedCrewSize: estimatedCrew,
    recommendedCrew: estimatedCrew,
    recommendedVehicle,
    recommendedTeamType: recommendedVehicle === 'Mini Truck' ? 'mini_truck' : 'manual_cleanup',
    estimatedDuration,
    estimatedDurationHours: parseInt(estimatedDuration, 10) || 3,
    recoveryOpportunity,
    recoverableMaterials: uniqueRecoverableMaterials,
    recoveryPathway,
    recoveryNotes,
    crewReasons,
    vehicleReasons,
    crewReasoning: crewReasons.join(' • '),
    vehicleReasoning: vehicleReasons.join(' • '),
    confidence: 0.9,
    operationalNotes:
      specialInstructions?.trim() ||
      'Standard site collection point. Access verified for collection unit.',
    aiAssisted: true,
    visualAiUsed: false,
    assessmentDate: Date.now(),
    disclaimer: 'Illustrative prototype estimate; final operational plan and tariff subject to operator review.',
  };
}
