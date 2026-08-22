/**
 * authService.js
 *
 * Thin wrappers around Firebase Auth operations for the citizen app.
 * Covers registered (email/password) and anonymous (guest) flows.
 *
 * NOTE: This service intentionally does NOT implement account linking or
 * anonymous-to-registered account conversion. The two modes are completely
 * separate as per the SwachhLens design constraint.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../config/firebase.js';
import { saveProfile } from './profileService.js';

/**
 * Register a new citizen with email and password.
 * Creates the Firebase Auth account and initialises the citizens/{uid} profile.
 *
 * @param {{ name: string, email: string, password: string }} data
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function registerCitizen({ name, email, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = credential;

  // Initialise the citizen profile document so the rest of the app has a
  // citizens/{uid} record to read from immediately after registration.
  await saveProfile(user.uid, {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: '',
    area: '',
    ward: '',
  });

  return user;
}

/**
 * Sign in an existing registered citizen with email and password.
 *
 * @param {{ email: string, password: string }} data
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signInCitizen({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Sign in anonymously (guest mode).
 * Preserves the anonymous session for the duration of the browser session.
 *
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signInAsGuest() {
  const credential = await signInAnonymously(auth);
  return credential.user;
}

/**
 * Sign out the currently authenticated user (registered or anonymous).
 * After sign-out, onAuthStateChanged fires with null, which App.jsx handles
 * by returning to the auth landing screen.
 *
 * @returns {Promise<void>}
 */
export async function signOutCitizen() {
  await firebaseSignOut(auth);
}

/**
 * Send a password reset email to a registered citizen.
 *
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Derive the auth mode from a Firebase Auth User object.
 *
 * @param {import('firebase/auth').User | null} user
 * @returns {'loading' | 'signed_out' | 'anonymous' | 'registered'}
 */
export function getAuthMode(user) {
  if (user === undefined) return 'loading';
  if (user === null) return 'signed_out';
  if (user.isAnonymous) return 'anonymous';
  return 'registered';
}
