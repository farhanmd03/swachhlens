/**
 * Ollama Local Vision AI Provider (Secondary Tier / Offline Fallback)
 *
 * Connects to local Ollama instance (default: http://127.0.0.1:11434)
 * running a local vision model (default: qwen3-vl:2b).
 *
 * Implements a 1000ms pre-flight health check to fail fast if the Ollama
 * daemon is not running, avoiding UI freezes during cloud fallback.
 */

import {
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  OLLAMA_HEALTH_TIMEOUT_MS,
  OLLAMA_INFERENCE_TIMEOUT_MS,
} from '../../../config/aiConfig.js';
import { buildPromptText, AI_CANONICAL_JSON_SCHEMA } from '../aiPrompt.js';
import { parseAIJson } from '../aiValidator.js';

/**
 * Fast health check to verify if Ollama daemon is reachable.
 *
 * @returns {Promise<boolean>} True if reachable within timeout
 */
export async function isOllamaReachable() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_HEALTH_TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

/**
 * Execute waste image analysis via local Ollama Vision model.
 *
 * @param {Object} params
 * @param {string} params.base64Data - Raw base64 image data (without data URI prefix)
 * @param {string} params.mimeType - Image MIME type
 * @param {string} [params.comment] - Optional citizen context note
 * @returns {Promise<{ rawResult: Object, providerUsed: string, executionTimeMs: number }>}
 */
export async function analyzeWithOllama({ base64Data, comment }) {
  // 1. Fast pre-flight health check
  const reachable = await isOllamaReachable();
  if (!reachable) {
    const err = new Error(
      `Local Ollama daemon is not reachable at ${OLLAMA_BASE_URL}`
    );
    err.status = 503;
    throw err;
  }

  const startTime = Date.now();
  const prompt = buildPromptText(comment);

  // Ollama /api/chat expects base64 image string in the `images` array of the message
  const requestBody = {
    model: OLLAMA_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt,
        images: [base64Data],
      },
    ],
    format: AI_CANONICAL_JSON_SCHEMA,
    stream: false,
    options: {
      temperature: 0.1,
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    OLLAMA_INFERENCE_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const err = new Error(
        `Ollama inference failed (${response.status}): ${errorText || response.statusText}`
      );
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const content = data?.message?.content;
    if (!content) {
      throw new Error('Ollama returned empty response message content');
    }

    const rawResult = parseAIJson(content);
    const executionTimeMs = Date.now() - startTime;

    return {
      rawResult,
      providerUsed: 'ollama',
      executionTimeMs,
    };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(
        `Ollama local inference timed out after ${OLLAMA_INFERENCE_TIMEOUT_MS}ms`
      );
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    throw err;
  }
}
