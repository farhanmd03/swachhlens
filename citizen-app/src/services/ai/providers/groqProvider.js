/**
 * Groq Vision AI Provider (Primary Tier)
 *
 * Calls Groq's high-speed OpenAI-compatible Chat Completions API with vision models
 * (default: qwen/qwen3.8-27b) using JSON Object mode.
 */

import {
  GROQ_API_KEY,
  GROQ_MODEL,
  GROQ_API_URL,
  GROQ_TIMEOUT_MS,
} from '../../../config/aiConfig.js';
import { buildPromptText } from '../aiPrompt.js';
import { parseAIJson } from '../aiValidator.js';

/**
 * Execute waste image analysis via Groq Vision API.
 *
 * @param {Object} params
 * @param {string} params.base64Data - Raw base64 image data without data URI prefix
 * @param {string} params.mimeType - Image MIME type (e.g. 'image/jpeg')
 * @param {string} [params.comment] - Optional citizen context note
 * @returns {Promise<{ rawResult: Object, providerUsed: string, executionTimeMs: number }>}
 */
export async function analyzeWithGroq({ base64Data, mimeType = 'image/jpeg', comment }) {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is missing. Set VITE_GROQ_API_KEY in .env');
  }

  const startTime = Date.now();
  const prompt = buildPromptText(comment);
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  const requestBody = {
    model: GROQ_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: dataUrl,
            },
          },
        ],
      },
    ],
    response_format: {
      type: 'json_object',
    },
    max_tokens: 600,
    temperature: 0.1,
    stream: false,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorJson = {};
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // Ignored
      }
      const errorMsg =
        errorJson?.error?.message ||
        `HTTP ${response.status}: ${response.statusText}`;

      const err = new Error(`Groq API failure (${response.status}): ${errorMsg}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Groq returned empty response message content');
    }

    const rawResult = parseAIJson(content);
    const executionTimeMs = Date.now() - startTime;

    return {
      rawResult,
      providerUsed: 'groq',
      executionTimeMs,
    };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(
        `Groq API timed out after ${GROQ_TIMEOUT_MS}ms`
      );
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    throw err;
  }
}
