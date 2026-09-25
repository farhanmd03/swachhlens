/**
 * AI Provider Configuration
 *
 * Central configuration for multi-tier Vision AI providers:
 * 1. Groq (Primary Cloud Vision)
 * 2. Ollama (Fallback Local Vision)
 * 3. Gemini (Tertiary Optional Cloud Vision)
 *
 * NOTE: API keys in client-side Vite apps are exposed in the bundle.
 * This is an intentional hackathon prototype limitation on Firebase Spark.
 * Production architecture would move API credentials to Cloud Functions.
 */

import {
  GEMINI_MODEL,
  GEMINI_API_URL,
  GEMINI_API_KEY,
} from './gemini.js';

const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

// Primary provider selection ('groq' | 'ollama' | 'gemini')
export const AI_PRIMARY_PROVIDER =
  getEnv('VITE_AI_PRIMARY_PROVIDER')?.trim() || 'groq';

// Groq configuration
export const GROQ_API_KEY = getEnv('VITE_GROQ_API_KEY')?.trim() || '';
export const GROQ_MODEL =
  getEnv('VITE_GROQ_MODEL')?.trim() || 'qwen/qwen3.8-27b';
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_TIMEOUT_MS = 7000;

// Ollama configuration
export const OLLAMA_BASE_URL =
  getEnv('VITE_OLLAMA_BASE_URL')?.trim().replace(/\/+$/, '') ||
  'http://127.0.0.1:11434';
export const OLLAMA_MODEL =
  getEnv('VITE_OLLAMA_MODEL')?.trim() || 'qwen3-vl:2b';
export const OLLAMA_HEALTH_TIMEOUT_MS = 1000;
export const OLLAMA_INFERENCE_TIMEOUT_MS = 15000;

// Gemini configuration (preserved as tertiary fallback)
export { GEMINI_MODEL, GEMINI_API_URL, GEMINI_API_KEY };
export const GEMINI_TIMEOUT_MS = 7000;
