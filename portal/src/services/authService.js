import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '../config/firebase.js';

/**
 * Sign in a municipal user with email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  return firebaseSignOut(auth);
}
