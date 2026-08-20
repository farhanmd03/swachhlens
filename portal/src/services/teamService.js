import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

/**
 * Fetch all active teams.
 *
 * @returns {Promise<Array>} Array of team objects with IDs
 */
export async function getActiveTeams() {
  const teamsRef = collection(db, 'teams');
  const q = query(teamsRef, where('active', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

/**
 * Update a team's current load by a delta amount.
 *
 * @param {string} teamId - The team document ID
 * @param {number} loadChange - Amount to add (positive) or subtract (negative)
 */
export async function updateTeamLoad(teamId, loadChange) {
  const docRef = doc(db, 'teams', teamId);
  // Fetch only the specific team document — not the entire collection
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const currentLoad = docSnap.data().currentLoad || 0;
    await updateDoc(docRef, {
      currentLoad: Math.max(0, currentLoad + loadChange),
    });
  } else {
    console.warn(`updateTeamLoad: team "${teamId}" not found in Firestore.`);
  }
}
