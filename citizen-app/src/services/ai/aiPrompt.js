/**
 * Standard Shared Prompt & Schema Definition
 *
 * Provides identical semantic instructions and structural constraints
 * across all Vision AI providers (Groq, Ollama, Gemini).
 */

import {
  ALLOWED_WASTE_TYPES,
  ALLOWED_VOLUMES,
  ALLOWED_SPREAD,
  ALLOWED_LOCATIONS,
} from './aiValidator.js';

/**
 * Strict JSON schema for structured outputs (Groq, Ollama, Gemini).
 */
export const AI_CANONICAL_JSON_SCHEMA = {
  type: 'object',
  properties: {
    primaryWasteType: {
      type: 'string',
      enum: ALLOWED_WASTE_TYPES,
      description: 'The single dominant waste category observed in the image.',
    },
    secondaryWasteTypes: {
      type: 'array',
      items: {
        type: 'string',
        enum: ALLOWED_WASTE_TYPES,
      },
      description: 'Up to 3 secondary waste categories present.',
    },
    volumeEstimate: {
      type: 'string',
      enum: ALLOWED_VOLUMES,
      description: 'Estimated volume band of accumulated waste.',
    },
    volumeConfidence: {
      type: 'number',
      description: 'Model confidence in volume estimate between 0.0 and 1.0.',
    },
    visibleElements: {
      type: 'array',
      items: { type: 'string' },
      description: 'Up to 3 short factual observations (max 10 words each).',
    },
    spreadLevel: {
      type: 'string',
      enum: ALLOWED_SPREAD,
      description: 'Geographic dispersal level of the waste.',
    },
    roadObstruction: {
      type: 'boolean',
      description: 'True if waste physically spills onto traffic lanes or footpaths.',
    },
    drainageRisk: {
      type: 'boolean',
      description: 'True if waste obstructs or sits inside an open drain channel.',
    },
    bioWasteRisk: {
      type: 'boolean',
      description: 'True ONLY if syringes, medical packaging, blood-soaked material, chemicals, or explicit clinical/biological contamination is DIRECTLY VISIBLE. Ordinary mixed garbage, food scraps, or organic waste is NOT sufficient.',
    },
    bioWasteEvidence: {
      type: 'array',
      items: { type: 'string' },
      description: 'List the specific visible indicators (e.g. "syringe visible", "medical packaging seen") that justify bioWasteRisk=true. Leave empty array [] when bioWasteRisk is false.',
    },
    locationSensitivityHint: {
      type: 'string',
      enum: ALLOWED_LOCATIONS,
      description: 'Observable environmental vulnerability hint. Use "blocking_drainage" ONLY when a physical drain/gutter/culvert structure is VISIBLY PRESENT AND waste physically blocks it.',
    },
    locationEvidence: {
      type: 'array',
      items: { type: 'string' },
      description: 'List what specific drain/gutter/culvert structure is blocked when locationSensitivityHint is "blocking_drainage". Leave empty array [] otherwise.',
    },
    confidence: {
      type: 'number',
      description: 'Overall classification confidence between 0.0 and 1.0.',
    },
    reasoning: {
      type: 'string',
      description: 'Concise explanation in 1-2 sentences (max 40 words).',
    },
  },
  required: [
    'primaryWasteType',
    'secondaryWasteTypes',
    'volumeEstimate',
    'volumeConfidence',
    'visibleElements',
    'spreadLevel',
    'roadObstruction',
    'drainageRisk',
    'bioWasteRisk',
    'locationSensitivityHint',
    'confidence',
    'reasoning',
  ],
  additionalProperties: false,
};

/**
 * Builds the standard system/instruction prompt.
 *
 * @param {string} [comment] - Optional citizen context note
 * @returns {string} Formatted prompt string
 */
export function buildPromptText(comment = '') {
  const sanitizedComment = (comment || '').trim();

  let citizenContextNote = 'Citizen notes: None provided.';
  if (sanitizedComment) {
    citizenContextNote =
      `Citizen notes: "${sanitizedComment}"\n\n` +
      'INSTRUCTION ON CITIZEN NOTES:\n' +
      'Use citizen notes as supplementary context. Do not invent visual evidence. ' +
      'Do not classify hazardous or biological material solely because the user claimed it ' +
      'unless there is sufficient contextual support. When image evidence and user text conflict, ' +
      'report the uncertainty and rely primarily on visual evidence.';
  }

  return (
    `You are an AI waste classification system for SwachhLens, a municipal sanitation decision-support platform.\n\n` +
    `Analyze this image and classify the waste/sanitation issue shown.\n\n` +
    `${citizenContextNote}\n\n` +
    `IMPORTANT CONSTRAINTS:\n` +
    `- You extract ONLY factual visual evidence. Do NOT decide worker counts, dispatch vehicles, or operational priority.\n` +
    `- You MUST respond with ONLY a valid JSON object matching the required structure below.\n\n` +
    `REQUIRED JSON SCHEMA:\n` +
    `{\n` +
    `  "primaryWasteType": "one of: construction_debris, plastic_waste, drain_blockage, overflowing_bin, hazardous_waste, e_waste, organic_waste, garbage_dump",\n` +
    `  "secondaryWasteTypes": ["array of up to 3 of the above waste types"],\n` +
    `  "volumeEstimate": "one of: small, medium, large, very_large",\n` +
    `  "volumeConfidence": number between 0.0 and 1.0,\n` +
    `  "visibleElements": ["short observation 1", "short observation 2"],\n` +
    `  "spreadLevel": "one of: localized, moderate, extensive",\n` +
    `  "roadObstruction": true or false,\n` +
    `  "drainageRisk": true or false,\n` +
    `  "bioWasteRisk": true or false,\n` +
    `  "bioWasteEvidence": ["specific visible indicator e.g. syringe visible"],\n` +
    `  "locationSensitivityHint": "one of: none, near_school, near_hospital, near_water_body, blocking_drainage",\n` +
    `  "locationEvidence": ["drain structure description if blocking_drainage, else leave empty"],\n` +
    `  "confidence": number between 0.0 and 1.0,\n` +
    `  "reasoning": "1-2 concise sentences (max 40 words)"\n` +
    `}\n\n` +
    `CATEGORY DEFINITIONS & PRECEDENCE:\n` +
    `- construction_debris: Concrete, bricks, masonry rubble, plaster, sand, broken tiles.\n` +
    `- plastic_waste: Packaging, bottles, bags, wrappers, PET containers, thermocol.\n` +
    `- drain_blockage: Waste inside, covering, or choking open drains, gutters, culverts.\n` +
    `- overflowing_bin: Designated municipal bin/dumpster with waste spilling out.\n` +
    `- hazardous_waste: Clinical needles, chemicals, batteries, toxic/sharp dangerous refuse.\n` +
    `- e_waste: Electronic/electrical scrap, wires, circuit boards, discarded appliances.\n` +
    `- organic_waste: Food scraps, vegetable refuse, market bio-waste, rotting matter.\n` +
    `- garbage_dump: Mixed/unsegregated general waste when no specialized category dominates.\n\n` +
    `VOLUME ESTIMATION BANDS:\n` +
    `- small: Carrier-bag or household-bin scale.\n` +
    `- medium: Handcart / wheelcart scale accumulation.\n` +
    `- large: Mini-truck / commercial accumulation scale.\n` +
    `- very_large: Accumulation exceeding a single mini-truck scale.\n\n` +
    `BIO-WASTE RISK RULES (STRICT — DO NOT OVER-CLASSIFY):\n` +
    `- bioWasteRisk=true ONLY when at least one of the following is DIRECTLY VISIBLE:\n` +
    `  * Syringes, needles, or medical sharps\n` +
    `  * Identifiable medical/clinical packaging (IV bags, bandages, hospital waste bags)\n` +
    `  * Blood-soaked or body-fluid-contaminated material\n` +
    `  * Chemical containers labelled hazardous/toxic/corrosive\n` +
    `- Ordinary mixed garbage, food scraps, vegetable market waste, plastics, or organic matter DOES NOT qualify.\n` +
    `- When bioWasteRisk=true: list each visible indicator in bioWasteEvidence array.\n` +
    `- When bioWasteRisk=false: set bioWasteEvidence to [].\n\n` +
    `DRAINAGE BLOCKAGE RULES (STRICT):\n` +
    `- locationSensitivityHint="blocking_drainage" ONLY when:\n` +
    `  1. A physical drain, gutter, culvert, or storm drain is CLEARLY VISIBLE, AND\n` +
    `  2. Waste physically blocks or fills that structure.\n` +
    `- Waste near a road edge, footpath, or open ground DOES NOT qualify.\n` +
    `- When locationSensitivityHint="blocking_drainage": describe the structure in locationEvidence.\n` +
    `- Otherwise set locationEvidence to [].\n\n` +
    `Return ONLY a raw JSON object with all required fields.`
  );
}
