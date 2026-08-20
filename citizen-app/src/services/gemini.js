import { GEMINI_API_URL, GEMINI_API_KEY } from '../config/gemini.js';
import { WASTE_TYPES, VOLUMES, LOCATION_SENSITIVITIES } from '../config/constants.js';

/**
 * Analyze a waste image using the Gemini API.
 *
 * Sends the image as inline Base64 data and requests structured JSON
 * classification of waste type, volume, confidence, and location sensitivity.
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
  "wasteType": "one of: ${WASTE_TYPES.join(', ')}",
  "volumeEstimate": "one of: ${VOLUMES.join(', ')}",
  "confidence": <number between 0.0 and 1.0>,
  "locationSensitivityHint": "one of: ${LOCATION_SENSITIVITIES.join(', ')}",
  "reasoning": "<brief explanation of your classification>"
}

Rules:
- wasteType must be exactly one of the listed values
- volumeEstimate must be exactly one of the listed values
- confidence is your certainty in the classification (0.0 = not sure, 1.0 = certain)
- locationSensitivityHint: infer from visual cues (school signs, hospital, water, drains). Use "none" if unclear.
- reasoning: 1-2 sentences explaining your classification

If the image does not show waste or a sanitation issue, still return valid JSON with your best guess, low confidence, and explain in reasoning.`;

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
  return validateGeminiResult(result);
}

/**
 * Validate and sanitize the Gemini API result.
 * Ensures all fields are present and have valid values.
 */
function validateGeminiResult(result) {
  const validated = {
    wasteType: WASTE_TYPES.includes(result.wasteType)
      ? result.wasteType
      : 'garbage_dump', // fallback
    volumeEstimate: VOLUMES.includes(result.volumeEstimate)
      ? result.volumeEstimate
      : 'medium', // fallback
    confidence: typeof result.confidence === 'number'
      ? Math.max(0, Math.min(1, result.confidence))
      : 0.5,
    locationSensitivityHint: LOCATION_SENSITIVITIES.includes(result.locationSensitivityHint)
      ? result.locationSensitivityHint
      : 'none',
    reasoning: typeof result.reasoning === 'string'
      ? result.reasoning
      : 'No reasoning provided.',
  };

  return validated;
}
