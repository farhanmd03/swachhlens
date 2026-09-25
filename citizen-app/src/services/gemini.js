/**
 * Backward-Compatibility Bridge for Gemini Service
 *
 * Re-exports analyzeWasteImage from the new provider-agnostic aiService.
 * Preserves legacy signatures and validator references so no existing
 * test, script, or component breaks.
 */

import { analyzeWasteImage } from './aiService.js';
import { validateAndNormalizeAIResult } from './ai/aiValidator.js';

export { analyzeWasteImage };

/**
 * Backward-compatibility wrapper for legacy validateGeminiResultV2.
 * Delegates directly to the shared canonical validator.
 */
export function validateGeminiResultV2(result) {
  return validateAndNormalizeAIResult(result, { providerUsed: 'gemini' });
}
