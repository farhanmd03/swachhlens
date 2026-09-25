/**
 * Gemini API Configuration
 *
 * Central location for the Gemini model name and API settings.
 * Change the model name here to update across the entire application.
 *
 * NOTE: The API key is exposed in the browser bundle.
 * This is an intentional hackathon limitation because the project
 * must remain on Firebase Spark (no billing).
 * Production would move Gemini processing to a secure server-side service.
 */

const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta?.env?.[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process?.env?.[key]) {
    return process.env[key];
  }
  return '';
};

// Configurable model name via environment, with default fallback
export const GEMINI_MODEL = getEnv('VITE_GEMINI_MODEL')?.trim() || 'gemini-3.6-flash';

// API endpoint constructed dynamically from configured model
export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// API key from environment
export const GEMINI_API_KEY = getEnv('VITE_GEMINI_API_KEY');
