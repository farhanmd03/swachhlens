/**
 * Gemini Vision AI Provider (Tertiary Tier / Cloud Fallback)
 *
 * Retains existing Gemini REST integration as an optional tertiary failover.
 */

import {
  GEMINI_MODEL,
  GEMINI_API_URL,
  GEMINI_API_KEY,
  GEMINI_TIMEOUT_MS,
} from '../../../config/aiConfig.js';
import { buildPromptText, AI_CANONICAL_JSON_SCHEMA } from '../aiPrompt.js';
import { parseAIJson } from '../aiValidator.js';

/**
 * Remove fields not supported by Gemini's OpenAPI 3.0 responseSchema implementation
 * (such as additionalProperties).
 */
function sanitizeSchemaForGemini(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  const copy = { ...schema };
  delete copy.additionalProperties;
  if (copy.properties) {
    const newProps = {};
    for (const [k, v] of Object.entries(copy.properties)) {
      newProps[k] = sanitizeSchemaForGemini(v);
    }
    copy.properties = newProps;
  }
  if (copy.items) {
    copy.items = sanitizeSchemaForGemini(copy.items);
  }
  return copy;
}

const GEMINI_RESPONSE_SCHEMA = sanitizeSchemaForGemini(AI_CANONICAL_JSON_SCHEMA);

/**
 * Execute waste image analysis via Google Gemini API.
 *
 * @param {Object} params
 * @param {string} params.base64Data - Raw base64 image data without data URI prefix
 * @param {string} params.mimeType - Image MIME type (e.g. 'image/jpeg')
 * @param {string} [params.comment] - Optional citizen context note
 * @returns {Promise<{ rawResult: Object, providerUsed: string, executionTimeMs: number }>}
 */
export async function analyzeWithGemini({ base64Data, mimeType, comment }) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your .env file.'
    );
  }

  const startTime = Date.now();
  const prompt = buildPromptText(comment);

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      responseSchema: GEMINI_RESPONSE_SCHEMA,
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        errorData?.error?.message ||
        `HTTP ${response.status}: ${response.statusText}`;

      const err = new Error(
        `Gemini API service failure (${response.status}): ${errorMsg}`
      );
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason || 'UNKNOWN';

    if (finishReason === 'MAX_TOKENS') {
      throw new Error(
        'Incomplete Gemini response: Model output hit MAX_TOKENS limit.'
      );
    }

    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response text received from Gemini API.');
    }

    const rawResult = parseAIJson(text);
    const executionTimeMs = Date.now() - startTime;

    return {
      rawResult,
      providerUsed: 'gemini',
      executionTimeMs,
    };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(
        `Gemini API timed out after ${GEMINI_TIMEOUT_MS}ms`
      );
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    throw err;
  }
}
