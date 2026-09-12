import { GEMINI_API_URL, GEMINI_API_KEY } from '../config/gemini.js';
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

  const prompt = `You are an AI waste classification system for a civic cleanliness application called SwachhLens.

Analyze this image and classify the waste/sanitation issue shown.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text).

The JSON must have exactly these fields:

{
  "primaryWasteType": "one of: construction_debris, plastic_waste, drain_blockage, overflowing_bin, hazardous_waste, e_waste, organic_waste, garbage_dump",
  "secondaryWasteTypes": "array of zero or more of the above waste types",
  "volumeEstimate": "one of: small, medium, large, very_large",
  "volumeConfidence": "number between 0.0 and 1.0",
  "visibleElements": "array of short textual observations (max 5)",
  "spreadLevel": "one of: localized, moderate, extensive",
  "roadObstruction": "true or false",
  "drainageRisk": "true or false",
  "bioWasteRisk": "true or false",
  "locationSensitivityHint": "one of: ${LOCATION_SENSITIVITIES.join(', ')}",
  "confidence": "overall confidence number between 0.0 and 1.0",
  "reasoning": "brief explanation of your classification, volume estimate and any risks"
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

Return the fields as defined above. Volume confidence must clearly represent uncertainty.`;

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
      maxOutputTokens: 1024,
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
          locationSensitivityHint: { type: "string", enum: ["none", "school", "hospital", "water_body", "drain"] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reasoning: { type: "string" }
        },
        required: ["primaryWasteType", "volumeEstimate", "volumeConfidence", "locationSensitivityHint", "bioWasteRisk", "confidence", "reasoning"]
      }
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini API error (${response.status}): ${errorData?.error?.message || response.statusText}`
    );
  }

  const data = await response.json();

  // Extract text from Gemini response
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response text received from Gemini API.');
  }

  // Parse JSON from response (handle potential markdown code fences)
  const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  let result;
  try {
    result = JSON.parse(cleanedText);
  } catch (parseError) {
    throw new Error(`Failed to parse Gemini response as JSON: ${cleanedText}`);
  }

  // Validate the result
  return validateGeminiResultV2(result);
}

/**
 * Validate and sanitize the Gemini API result.
 * Implements the V2 validation rules for Badge 2.
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
  const allowedLocation = ["none", "school", "hospital", "water_body", "drain"];

  // primary waste type
  const primaryWasteType = allowedWasteTypes.includes(result.primaryWasteType)
    ? result.primaryWasteType
    : "garbage_dump";

  // secondary waste types – array, allowed values, no dupes, max 5, exclude primary
  let secondaryWasteTypes = [];
  if (Array.isArray(result.secondaryWasteTypes)) {
    secondaryWasteTypes = result.secondaryWasteTypes
      .filter((t) => allowedWasteTypes.includes(t) && t !== primaryWasteType)
      .filter((v, i, self) => self.indexOf(v) === i) // dedupe
      .slice(0, 5);
  }

  // volume estimate
  const volumeEstimate = allowedVolume.includes(result.volumeEstimate)
    ? result.volumeEstimate
    : "medium";

  // volume confidence
  const volumeConfidence = typeof result.volumeConfidence === "number"
    ? Math.max(0, Math.min(1, result.volumeConfidence))
    : 0.5;

  // visible elements – strings only, trimmed, non‑empty, max 5
  let visibleElements = [];
  if (Array.isArray(result.visibleElements)) {
    visibleElements = result.visibleElements
      .filter((v) => typeof v === "string")
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .slice(0, 5);
  }

  // spread level
  const spreadLevel = allowedSpread.includes(result.spreadLevel)
    ? result.spreadLevel
    : "localized";

  // safe boolean coercion helper
  const coerceBoolean = (val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
      const low = val.toLowerCase().trim();
      if (["true", "yes", "1"].includes(low)) return true;
      if (["false", "no", "0"].includes(low)) return false;
    }
    if (typeof val === "number") return val !== 0;
    return false;
  };

  const roadObstruction = coerceBoolean(result.roadObstruction);
  const drainageRisk = coerceBoolean(result.drainageRisk);
  const bioWasteRisk = coerceBoolean(result.bioWasteRisk);

  // location sensitivity hint
  const locationSensitivityHint = allowedLocation.includes(result.locationSensitivityHint)
    ? result.locationSensitivityHint
    : "none";

  // overall confidence
  const confidence = typeof result.confidence === "number"
    ? Math.max(0, Math.min(1, result.confidence))
    : 0.5;

  // reasoning text
  const reasoning = typeof result.reasoning === "string"
    ? result.reasoning.trim()
    : "No reasoning provided.";

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
  };
}
