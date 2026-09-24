import { GEMINI_MODEL, GEMINI_API_URL, GEMINI_API_KEY } from '../config/gemini.js';
import { WASTE_TYPES, VOLUMES, LOCATION_SENSITIVITIES } from '../config/constants.js';

/**
 * Analyze a waste image using the Gemini API.
 *
 * Sends the image as inline Base64 data and requests structured JSON
 * classification of waste type, volume, confidence, location sensitivity,
 * and bio-waste risk detection.
 *
 * @param {string} base64Data - The Base64-encoded image (without the data:image/... prefix)
 * @param {string} mimeType - The MIME type of the image (e.g. 'image/jpeg')
 * @returns {Promise<Object>} Structured analysis result
 */
export async function analyzeWasteImage(base64Data, mimeType = 'image/jpeg') {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your .env file.');
  }

  console.log(`[SwachhLens AI] Using model: ${GEMINI_MODEL}`);

  const prompt = `You are an AI waste classification system for a civic cleanliness application called SwachhLens.

Analyze this image and classify the waste/sanitation issue shown.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text).

The JSON must have exactly these fields:

{
  "primaryWasteType": "one of: construction_debris, plastic_waste, drain_blockage, overflowing_bin, hazardous_waste, e_waste, organic_waste, garbage_dump",
  "secondaryWasteTypes": "array of up to 3 of the above waste types",
  "volumeEstimate": "one of: small, medium, large, very_large",
  "volumeConfidence": "number between 0.0 and 1.0",
  "visibleElements": "array of short observations (max 3 items, max 10 words each)",
  "spreadLevel": "one of: localized, moderate, extensive",
  "roadObstruction": "true or false",
  "drainageRisk": "true or false",
  "bioWasteRisk": "true or false",
  "locationSensitivityHint": "one of: ${LOCATION_SENSITIVITIES.join(', ')}",
  "confidence": "overall confidence number between 0.0 and 1.0",
  "reasoning": "concise explanation in 1-2 sentences (max 40 words)"
}

Category definitions and precedence rules (choose the category that dominates the scene):

CONSTRUCTION_DEBRIS: If concrete, bricks, masonry rubble, plaster, sand, broken tiles or similar construction material clearly dominates the scene, choose construction_debris.

PLASTIC_WASTE: If discarded plastic packaging, bottles, bags, wrappers, PET containers, thermocol or similar plastic material clearly dominates, choose plastic_waste.

DRAIN_BLOCKAGE: If waste is physically inside, directly covering, or clearly obstructing an open drain, gutter, culvert or stormwater channel, choose drain_blockage.

OVERFLOWING_BIN: If a designated municipal/public waste bin or dumpster is clearly visible and waste is spilling beyond its intended container boundary, choose overflowing_bin.

HAZARDOUS_WASTE: Choose hazardous_waste only where visible evidence supports hazardous, clinical, chemical, sharp or potentially dangerous material.

E_WASTE: If electronic/electrical equipment, wires, circuit boards, batteries, devices or obvious electronic scrap dominates, choose e_waste.

ORGANIC_WASTE: If food scraps, leaves, vegetable matter or clearly organic refuse dominates, choose organic_waste.

GARBAGE_DUMP: Use garbage_dump as the general category only when the scene is predominantly mixed/unsegregated waste and none of the specialized categories clearly dominates.

Do not classify an image as a specialized category merely because one small object is visible; the category should reflect the dominant operational character of the incident.

Volume estimation guidance (use visual reference bands only):

small: roughly household-bin/carrier-bag scale
medium: roughly handcart/wheelcart-scale accumulation
large: roughly mini‑truck/light commercial accumulation
very_large: roughly accumulation beyond a single mini‑truck-scale response

Return the fields as defined above. Volume confidence must clearly represent uncertainty. Keep reasoning concise.`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          primaryWasteType: { type: "string", enum: ["construction_debris", "plastic_waste", "drain_blockage", "overflowing_bin", "hazardous_waste", "e_waste", "organic_waste", "garbage_dump"] },
          secondaryWasteTypes: { type: "array", items: { type: "string", enum: ["construction_debris", "plastic_waste", "drain_blockage", "overflowing_bin", "hazardous_waste", "e_waste", "organic_waste", "garbage_dump"] } },
          volumeEstimate: { type: "string", enum: ["small", "medium", "large", "very_large"] },
          volumeConfidence: { type: "number", minimum: 0, maximum: 1 },
          visibleElements: { type: "array", items: { type: "string" } },
          spreadLevel: { type: "string", enum: ["localized", "moderate", "extensive"] },
          roadObstruction: { type: "boolean" },
          drainageRisk: { type: "boolean" },
          bioWasteRisk: { type: "boolean" },
          locationSensitivityHint: { type: "string", enum: ["none", "near_school", "near_hospital", "near_water_body", "blocking_drainage"] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reasoning: { type: "string" }
        },
        required: ["primaryWasteType", "volumeEstimate", "volumeConfidence", "locationSensitivityHint", "bioWasteRisk", "confidence", "reasoning"]
      }
    },
  };

  // ── Transient error retry helper ──────────────────────────────
  const TRANSIENT_STATUSES = [408, 429, 500, 502, 503, 504];
  const MAX_RETRIES = 2;

  let response;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        break; // Success
      }

      // Check if transient error eligible for retry
      if (TRANSIENT_STATUSES.includes(response.status) && attempt < MAX_RETRIES) {
        attempt++;
        // Exponential backoff with jitter: 1000ms * 2^attempt + jitter (0-500ms)
        const backoffMs = Math.round(1000 * Math.pow(2, attempt - 1) + Math.random() * 500);
        console.warn(
          `[SwachhLens AI] Transient Gemini error (${response.status}). Retrying attempt ${attempt}/${MAX_RETRIES} in ${backoffMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }

      // Non-transient or retries exhausted
      break;
    } catch (networkErr) {
      if (attempt < MAX_RETRIES) {
        attempt++;
        const backoffMs = Math.round(1000 * Math.pow(2, attempt - 1) + Math.random() * 500);
        console.warn(
          `[SwachhLens AI] Network error (${networkErr.message}). Retrying attempt ${attempt}/${MAX_RETRIES} in ${backoffMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }
      throw new Error(`Temporary Gemini service failure (network error: ${networkErr.message})`);
    }
  }

  // Handle final non-ok response
  if (!response || !response.ok) {
    const status = response ? response.status : 'Network error';
    const errorData = response ? await response.json().catch(() => ({})) : {};
    const errorMsg = errorData?.error?.message || (response ? response.statusText : 'Connection failed');

    console.error(`[SwachhLens AI] HTTP ${status} error: ${errorMsg}`);

    if (TRANSIENT_STATUSES.includes(status)) {
      throw new Error(
        `Temporary Gemini service failure (${status}): The AI service is currently overloaded or experiencing high demand. Please try again.`
      );
    } else if (status === 400 || status === 401 || status === 403) {
      throw new Error(
        `Invalid API or configuration error (${status}): ${errorMsg}`
      );
    } else {
      throw new Error(`Gemini API error (${status}): ${errorMsg}`);
    }
  }

  const data = await response.json();

  // Inspect first candidate
  const candidate = data?.candidates?.[0];
  const finishReason = candidate?.finishReason || 'UNKNOWN';
  const finishMessage = candidate?.finishMessage || null;

  // Safe diagnostics (DevTools console)
  console.log(
    `[SwachhLens AI] HTTP ${response.status} OK | finishReason: ${finishReason}` +
    (finishMessage ? ` | finishMessage: ${finishMessage}` : '')
  );

  // ── TASK 3: Detect truncated output ───────────────────────────
  if (finishReason === 'MAX_TOKENS') {
    const rawPartial = candidate?.content?.parts?.[0]?.text || '';
    console.error(
      `[SwachhLens AI] AI_INCOMPLETE_RESPONSE: Model output hit MAX_TOKENS limit (length: ${rawPartial.length} chars).`
    );
    throw new Error(
      `Incomplete model response (AI_INCOMPLETE_RESPONSE): Gemini exceeded token limit (finishReason: MAX_TOKENS, textLength: ${rawPartial.length}). Analysis was cut off.`
    );
  }

  // Extract text from Gemini response
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Incomplete model response: No response text received from Gemini API.');
  }

  console.log(`[SwachhLens AI] Response text received (length: ${text.length} chars).`);

  // Parse JSON from response (handle potential markdown code fences)
  const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  let result;
  try {
    result = JSON.parse(cleanedText);
    console.log(`[SwachhLens AI] JSON parsed successfully.`);
  } catch (parseError) {
    console.error(`[SwachhLens AI] JSON parse failed. Raw text length: ${cleanedText.length}. Error: ${parseError.message}`);
    throw new Error(`Failed to parse Gemini response as JSON: ${cleanedText}`);
  }

  // Validate the result
  return validateGeminiResultV2(result);
}

/**
 * Validate and sanitize the Gemini API result.
 *
 * Core fields that affect operational decisions (wasteType, volume,
 * confidence, bioWasteRisk) are NOT silently defaulted to plausible
 * values. Instead, missing/invalid core fields are recorded in
 * `validationIssues` and `analysisStatus` is set to "needs_review".
 *
 * Non-critical / display-only fields keep safe defaults.
 */
function validateGeminiResultV2(result) {
  const allowedWasteTypes = [
    "construction_debris",
    "plastic_waste",
    "drain_blockage",
    "overflowing_bin",
    "hazardous_waste",
    "e_waste",
    "organic_waste",
    "garbage_dump",
  ];
  const allowedVolume = ["small", "medium", "large", "very_large"];
  const allowedSpread = ["localized", "moderate", "extensive"];

  // Canonical location enum — must match constants.js exactly
  const allowedLocation = ["none", "near_school", "near_hospital", "near_water_body", "blocking_drainage"];

  // Normalize legacy/short location values at the Gemini boundary
  const locationAliases = {
    school: "near_school",
    hospital: "near_hospital",
    water_body: "near_water_body",
    drain: "blocking_drainage",
  };

  const validationIssues = [];

  // ── Core field: primaryWasteType ──────────────────────────────
  let primaryWasteType;
  if (result?.primaryWasteType && allowedWasteTypes.includes(result.primaryWasteType)) {
    primaryWasteType = result.primaryWasteType;
  } else {
    primaryWasteType = null;
    validationIssues.push(
      `Invalid or missing primaryWasteType: "${result?.primaryWasteType ?? '(absent)'}"`
    );
  }

  // ── Non-critical: secondaryWasteTypes ─────────────────────────
  let secondaryWasteTypes = [];
  if (Array.isArray(result?.secondaryWasteTypes)) {
    secondaryWasteTypes = result.secondaryWasteTypes
      .filter((t) => allowedWasteTypes.includes(t) && t !== primaryWasteType)
      .filter((v, i, self) => self.indexOf(v) === i) // dedupe
      .slice(0, 5);
  }

  // ── Core field: volumeEstimate ────────────────────────────────
  let volumeEstimate;
  if (result?.volumeEstimate && allowedVolume.includes(result.volumeEstimate)) {
    volumeEstimate = result.volumeEstimate;
  } else {
    volumeEstimate = null;
    validationIssues.push(
      `Invalid or missing volumeEstimate: "${result?.volumeEstimate ?? '(absent)'}"`
    );
  }

  // ── Non-critical: volumeConfidence ────────────────────────────
  const volumeConfidence = typeof result?.volumeConfidence === "number"
    ? Math.max(0, Math.min(1, result.volumeConfidence))
    : 0.5;

  // ── Non-critical: visibleElements ─────────────────────────────
  let visibleElements = [];
  if (Array.isArray(result?.visibleElements)) {
    visibleElements = result.visibleElements
      .filter((v) => typeof v === "string")
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .slice(0, 5);
  }

  // ── Non-critical: spreadLevel ─────────────────────────────────
  const spreadLevel = allowedSpread.includes(result?.spreadLevel)
    ? result.spreadLevel
    : "localized";

  // ── Safe boolean coercion helper ──────────────────────────────
  const coerceBoolean = (val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
      const low = val.toLowerCase().trim();
      if (["true", "yes", "1"].includes(low)) return true;
      if (["false", "no", "0"].includes(low)) return false;
    }
    if (typeof val === "number") return val !== 0;
    return undefined; // explicitly unknown
  };

  // ── Non-critical risk booleans (display-only) ─────────────────
  const roadObstruction = coerceBoolean(result?.roadObstruction) ?? false;
  const drainageRisk = coerceBoolean(result?.drainageRisk) ?? false;

  // ── Core field: bioWasteRisk ──────────────────────────────────
  const rawBioRisk = coerceBoolean(result?.bioWasteRisk);
  let bioWasteRisk;
  if (rawBioRisk === undefined) {
    bioWasteRisk = "unknown";
    validationIssues.push("Missing bioWasteRisk — not defaulting to false");
  } else {
    bioWasteRisk = rawBioRisk;
  }

  // ── Location sensitivity hint (normalize at boundary) ─────────
  let rawLocation = result?.locationSensitivityHint;
  if (typeof rawLocation === "string" && locationAliases[rawLocation]) {
    rawLocation = locationAliases[rawLocation];
  }
  let locationSensitivityHint;
  if (allowedLocation.includes(rawLocation)) {
    locationSensitivityHint = rawLocation;
  } else if (!rawLocation || rawLocation === 'none') {
    locationSensitivityHint = "none";
  } else {
    locationSensitivityHint = "none";
    validationIssues.push(`Unrecognized locationSensitivityHint: "${rawLocation}"`);
  }

  // ── Core field: confidence ────────────────────────────────────
  let confidence;
  if (typeof result?.confidence === "number") {
    confidence = Math.max(0, Math.min(1, result.confidence));
  } else {
    confidence = null;
    validationIssues.push(
      `Invalid or missing confidence: "${result?.confidence ?? '(absent)'}"`
    );
  }

  // ── Non-critical: reasoning ───────────────────────────────────
  const reasoning = typeof result?.reasoning === "string"
    ? result.reasoning.trim()
    : "No reasoning provided.";

  // ── Determine analysis status ─────────────────────────────────
  const analysisStatus = validationIssues.length === 0 ? "verified" : "needs_review";

  // ── Console diagnostics (never logs API key) ──────────────────
  console.log(
    `[SwachhLens AI] Validation complete:\n` +
    `  status: ${analysisStatus}\n` +
    `  wasteType: ${primaryWasteType}\n` +
    `  volume: ${volumeEstimate}\n` +
    `  confidence: ${confidence}\n` +
    `  bioRisk: ${bioWasteRisk}\n` +
    `  location: ${locationSensitivityHint}\n` +
    `  issues: ${validationIssues.length > 0 ? validationIssues.join('; ') : 'none'}`
  );

  return {
    primaryWasteType,
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
  };
}
