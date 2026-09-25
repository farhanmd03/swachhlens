/**
 * AI Provider Router & Orchestration Service
 *
 * Implements resilient multi-tier failover for Vision AI analysis:
 * 1. Primary: Groq (high-speed cloud vision)
 * 2. Secondary: Local Ollama (offline / private edge vision)
 * 3. Tertiary: Google Gemini (cloud fallback)
 *
 * Ensures all outputs pass through a single canonical schema validator,
 * providing consistent contracts to downstream municipal decision modules.
 */

import {
  AI_PRIMARY_PROVIDER,
  GROQ_API_KEY,
  GEMINI_API_KEY,
} from '../config/aiConfig.js';
import { analyzeWithGroq } from './ai/providers/groqProvider.js';
import { analyzeWithOllama } from './ai/providers/ollamaProvider.js';
import { analyzeWithGemini } from './ai/providers/geminiProvider.js';
import { validateAndNormalizeAIResult } from './ai/aiValidator.js';

const FAILOVER_STATUSES = [408, 429, 500, 502, 503, 504];

/**
 * Determine if an error qualifies for immediate provider failover.
 *
 * @param {Error} error
 * @returns {boolean}
 */
function isFailoverEligible(error) {
  if (!error) return false;
  if (error.status && FAILOVER_STATUSES.includes(error.status)) return true;
  // Network errors, timeouts, fetch aborts, connection refused
  const msg = (error.message || '').toLowerCase();
  return (
    msg.includes('timed out') ||
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('connection refused') ||
    msg.includes('not reachable') ||
    msg.includes('service failure') ||
    msg.includes('overloaded') ||
    msg.includes('high demand')
  );
}

/**
 * Analyze a waste image with multi-tier provider failover.
 *
 * @param {string} base64Data - Raw base64 image data (without data URI header)
 * @param {string} [mimeType='image/jpeg'] - MIME type of the image
 * @param {string} [comment=''] - Optional citizen context note
 * @returns {Promise<Object>} Canonical validated AI result
 */
export async function analyzeWasteImage(
  base64Data,
  mimeType = 'image/jpeg',
  comment = ''
) {
  if (!base64Data) {
    throw new Error('Image data missing for AI analysis.');
  }

  const providerPlan = [];

  // Determine provider sequence based on primary provider setting & key availability
  if (AI_PRIMARY_PROVIDER === 'ollama') {
    providerPlan.push({ name: 'ollama', fn: analyzeWithOllama });
    if (GROQ_API_KEY) providerPlan.push({ name: 'groq', fn: analyzeWithGroq });
    if (GEMINI_API_KEY) providerPlan.push({ name: 'gemini', fn: analyzeWithGemini });
  } else if (AI_PRIMARY_PROVIDER === 'gemini') {
    if (GEMINI_API_KEY) providerPlan.push({ name: 'gemini', fn: analyzeWithGemini });
    if (GROQ_API_KEY) providerPlan.push({ name: 'groq', fn: analyzeWithGroq });
    providerPlan.push({ name: 'ollama', fn: analyzeWithOllama });
  } else {
    // Default: Groq -> Ollama -> Gemini
    if (GROQ_API_KEY) providerPlan.push({ name: 'groq', fn: analyzeWithGroq });
    providerPlan.push({ name: 'ollama', fn: analyzeWithOllama });
    if (GEMINI_API_KEY) providerPlan.push({ name: 'gemini', fn: analyzeWithGemini });
  }

  const providerErrors = [];

  for (let i = 0; i < providerPlan.length; i++) {
    const { name, fn } = providerPlan[i];
    console.log(
      `[SwachhLens AI Router] Attempting provider ${i + 1}/${providerPlan.length}: ${name}`
    );

    try {
      const response = await fn({ base64Data, mimeType, comment });

      if (response && response.rawResult) {
        // Pass through shared schema validator
        const validated = validateAndNormalizeAIResult(response.rawResult, {
          providerUsed: response.providerUsed || name,
          executionTimeMs: response.executionTimeMs || 0,
        });

        console.log(
          `[SwachhLens AI Router] Provider "${name}" succeeded in ${validated.executionTimeMs}ms with status: ${validated.analysisStatus}`
        );

        return validated;
      }
    } catch (err) {
      console.warn(
        `[SwachhLens AI Router] Provider "${name}" failed: ${err.message}`
      );
      providerErrors.push({ provider: name, error: err.message, status: err.status });

      // Check if we should failover to next provider
      const hasNext = i < providerPlan.length - 1;
      if (hasNext && isFailoverEligible(err)) {
        console.warn(
          `[SwachhLens AI Router] Failing over to next provider (${providerPlan[i + 1].name})...`
        );
        continue;
      }

      // If it's a parsing/schema issue or non-network fatal error on the current provider,
      // still attempt next provider if available to ensure maximum demo resilience
      if (hasNext) {
        console.warn(
          `[SwachhLens AI Router] Attempting next provider (${providerPlan[i + 1].name}) after error...`
        );
        continue;
      }
    }
  }

  // All configured providers failed
  const errorSummary = providerErrors
    .map((e) => `${e.provider}: ${e.error}`)
    .join(' | ');

  const finalError = new Error(
    `AI_ALL_PROVIDERS_UNAVAILABLE: All vision AI providers failed. Details: ${errorSummary}`
  );
  finalError.code = 'AI_ALL_PROVIDERS_UNAVAILABLE';
  finalError.details = providerErrors;
  throw finalError;
}
