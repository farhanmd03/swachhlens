import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

/**
 * Get the profile for a citizen.
 *
 * @param {string} citizenId - Firebase Auth anonymous UID
 * @returns {Promise<Object|null>}
 */
export async function getProfile(citizenId) {
  if (!citizenId || typeof citizenId !== 'string') {
    throw new Error('User is not authenticated (missing citizen ID)');
  }
  const docRef = doc(db, 'citizens', citizenId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

/**
 * Save (create or overwrite) the profile for a citizen.
 *
 * @param {string} citizenId - Firebase Auth anonymous UID
 * @param {{ name: string, phone?: string, email?: string, area?: string, ward?: string }} data
 * @returns {Promise<void>}
 */
export async function saveProfile(citizenId, data) {
  if (!citizenId || typeof citizenId !== 'string') {
    throw new Error('User is not authenticated (missing citizen ID)');
  }
  const docRef = doc(db, 'citizens', citizenId);
  const existingSnap = await getDoc(docRef);
  const createdAt = existingSnap.exists() && existingSnap.data()?.createdAt
    ? existingSnap.data().createdAt
    : Date.now();

  const profilePayload = {
    name: data.name?.trim() || '',
    phone: data.phone?.trim() || '',
    email: data.email?.trim() || '',
    area: data.area?.trim() || '',
    ward: data.ward?.trim() || '',
    createdAt,
    updatedAt: Date.now(),
  };

  await setDoc(docRef, profilePayload, { merge: true });
}
