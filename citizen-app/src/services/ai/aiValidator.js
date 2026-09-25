/**
 * Shared AI Schema Validator & Normalizer
 *
 * Enforces canonical field types, enums, and safety invariants across
 * all AI providers (Groq, Ollama, Gemini).
 *
 * Core fields (primaryWasteType, volumeEstimate, confidence, bioWasteRisk)
 * are NEVER silently fabricated. Missing/invalid core fields become `null`
 * (or 'unknown' for bioWasteRisk) and mark the result as `needs_review`.
 */

import {
  WASTE_TYPES,
  VOLUMES,
  LOCATION_SENSITIVITIES,
} from '../../config/constants.js';

export const ALLOWED_WASTE_TYPES = [
  'construction_debris',
  'plastic_waste',
  'drain_blockage',
  'overflowing_bin',
  'hazardous_waste',
  'e_waste',
  'organic_waste',
  'garbage_dump',
];

export const ALLOWED_VOLUMES = ['small', 'medium', 'large', 'very_large'];

export const ALLOWED_SPREAD = ['localized', 'moderate', 'extensive'];

export const ALLOWED_LOCATIONS = [
  'none',
  'near_school',
  'near_hospital',
  'near_water_body',
  'blocking_drainage',
];

export const LOCATION_ALIASES = {
  school: 'near_school',
  hospital: 'near_hospital',
  water_body: 'near_water_body',
  drain: 'blocking_drainage',
};

/**
 * Safely parse JSON from raw LLM text, stripping code fences if present.
 *
 * @param {string} rawText
 * @returns {Object} Parsed JSON object
 */
export function parseAIJson(rawText) {
  if (typeof rawText === 'object' && rawText !== null) {
    return rawText;
  }
  if (typeof rawText !== 'string') {
    throw new Error('AI response is not text or JSON object');
  }

  // Strip Markdown code blocks if present
  let cleaned = rawText
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/m, '')
    .trim();

  // If there are surrounding characters or thinking tags, locate the outermost JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

/**
 * Validate and sanitize an AI result object.
 *
 * @param {Object} raw - Raw parsed JSON from any AI provider
 * @param {Object} meta - Metadata { providerUsed: string, executionTimeMs: number }
 * @returns {Object} Normalized canonical AI result
 */
export function validateAndNormalizeAIResult(raw, meta = {}) {
  const validationIssues = [];
  const { providerUsed = 'unknown', executionTimeMs = 0 } = meta;

  // ── Core field: primaryWasteType ──────────────────────────────
  let primaryWasteType = null;
  const rawPrimary = raw?.primaryWasteType || raw?.wasteType;
  if (rawPrimary && ALLOWED_WASTE_TYPES.includes(rawPrimary)) {
    primaryWasteType = rawPrimary;
  } else {
    validationIssues.push(
      `Invalid or missing primaryWasteType: "${rawPrimary ?? '(absent)'}"`
    );
  }

  // ── Non-critical: secondaryWasteTypes ─────────────────────────
  let secondaryWasteTypes = [];
  if (Array.isArray(raw?.secondaryWasteTypes)) {
    secondaryWasteTypes = raw.secondaryWasteTypes
      .filter((t) => ALLOWED_WASTE_TYPES.includes(t) && t !== primaryWasteType)
      .filter((v, i, self) => self.indexOf(v) === i)
      .slice(0, 5);
  }

  // ── Core field: volumeEstimate ────────────────────────────────
  let volumeEstimate = null;
  if (raw?.volumeEstimate && ALLOWED_VOLUMES.includes(raw.volumeEstimate)) {
    volumeEstimate = raw.volumeEstimate;
  } else {
    validationIssues.push(
      `Invalid or missing volumeEstimate: "${raw?.volumeEstimate ?? '(absent)'}"`
    );
  }

  // ── Non-critical: volumeConfidence ────────────────────────────
  const volumeConfidence =
    typeof raw?.volumeConfidence === 'number'
      ? Math.max(0, Math.min(1, raw.volumeConfidence))
      : 0.5;

  // ── Non-critical: visibleElements ─────────────────────────────
  let visibleElements = [];
  if (Array.isArray(raw?.visibleElements)) {
    visibleElements = raw.visibleElements
      .filter((v) => typeof v === 'string')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .slice(0, 5);
  }

  // ── Non-critical: spreadLevel ─────────────────────────────────
  const spreadLevel = ALLOWED_SPREAD.includes(raw?.spreadLevel)
    ? raw.spreadLevel
    : 'localized';

  // ── Boolean coercion helper ───────────────────────────────────
  const coerceBoolean = (val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const low = val.toLowerCase().trim();
      if (['true', 'yes', '1'].includes(low)) return true;
      if (['false', 'no', '0'].includes(low)) return false;
    }
    if (typeof val === 'number') return val !== 0;
    return undefined;
  };

  // ── Non-critical risk booleans ────────────────────────────────
  const roadObstruction = coerceBoolean(raw?.roadObstruction) ?? false;
  const drainageRisk = coerceBoolean(raw?.drainageRisk) ?? false;

  // ── Core field: bioWasteRisk (Strict Tri-State: true | false | 'unknown') ──
  const rawBioRisk = coerceBoolean(raw?.bioWasteRisk);
  let bioWasteRisk;
  if (rawBioRisk === undefined) {
    bioWasteRisk = 'unknown';
    validationIssues.push('Missing bioWasteRisk — marked as undetermined');
  } else {
    bioWasteRisk = rawBioRisk;
  }

  // ── Task 1 safety gate: require bioWasteEvidence when bioWasteRisk=true ──
  if (bioWasteRisk === true) {
    const evidence = Array.isArray(raw?.bioWasteEvidence)
      ? raw.bioWasteEvidence.filter((s) => typeof s === 'string' && s.trim().length > 0)
      : [];
    if (evidence.length === 0) {
      bioWasteRisk = 'unknown';
      validationIssues.push(
        'bioWasteRisk=true downgraded to unknown: no bioWasteEvidence provided'
      );
    }
  }

  // ── Location sensitivity hint ─────────────────────────────────
  let rawLocation = raw?.locationSensitivityHint;
  if (typeof rawLocation === 'string' && LOCATION_ALIASES[rawLocation]) {
    rawLocation = LOCATION_ALIASES[rawLocation];
  }
  let locationSensitivityHint = 'none';
  if (ALLOWED_LOCATIONS.includes(rawLocation)) {
    locationSensitivityHint = rawLocation;
  } else if (!rawLocation || rawLocation === 'none') {
    locationSensitivityHint = 'none';
  } else {
    locationSensitivityHint = 'none';
    validationIssues.push(
      `Unrecognized locationSensitivityHint: "${rawLocation}"`
    );
  }

  // ── Task 2 safety gate: require locationEvidence for blocking_drainage ──
  if (locationSensitivityHint === 'blocking_drainage') {
    const locEvidence = Array.isArray(raw?.locationEvidence)
      ? raw.locationEvidence.filter((s) => typeof s === 'string' && s.trim().length > 0)
      : [];
    if (locEvidence.length === 0) {
      locationSensitivityHint = 'none';
      validationIssues.push(
        'blocking_drainage normalized to none: no locationEvidence describing drain structure'
      );
    }
  }

  // ── Core field: confidence ────────────────────────────────────
  // Note: Model self-assessed confidence, not mathematical ground-truth probability
  let confidence = null;
  if (typeof raw?.confidence === 'number' && !isNaN(raw.confidence)) {
    confidence = Math.max(0, Math.min(1, raw.confidence));
  } else {
    validationIssues.push(
      `Invalid or missing confidence: "${raw?.confidence ?? '(absent)'}"`
    );
  }

  // ── Non-critical: reasoning ───────────────────────────────────
  const reasoning =
    typeof raw?.reasoning === 'string' && raw.reasoning.trim().length > 0
      ? raw.reasoning.trim()
      : 'No reasoning provided.';

  // ── Determine analysis status ─────────────────────────────────
  const analysisStatus =
    validationIssues.length === 0 ? 'verified' : 'needs_review';

  // Return canonical standardized schema payload
  return {
    primaryWasteType,
    wasteType: primaryWasteType, // Backward-compatibility bridge
    secondaryWasteTypes,
    volumeEstimate,
    volumeConfidence,
    visibleElements,
    spreadLevel,
    roadObstruction,
    drainageRisk,
    bioWasteRisk,
    locationSensitivityHint,
    confidence,
    reasoning,
    analysisStatus,
    validationIssues,
    providerUsed,
    executionTimeMs,
  };
}
