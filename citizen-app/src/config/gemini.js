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

// Current model - change this single value to switch models
export const GEMINI_MODEL = 'gemini-3.6-flash';

// API endpoint
export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// API key from environment
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
