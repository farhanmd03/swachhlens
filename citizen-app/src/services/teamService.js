import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.js';

/**
 * Known canonical team names for demo units.
 * Acts as an instant fallback during initial loading or offline mode.
 */
export const CANONICAL_TEAM_NAMES = {
  'team-manual-a': 'Manual Cleanup Team A',
  'team-manual-b': 'Manual Cleanup Team B',
  'team-truck-1': 'Mini Truck Unit 1',
  'team-recycle-gc': 'Recycling Partner - GreenCycle',
  'team-north-1': 'North Team 1',
  'team-north-2': 'North Team 2',
  'team-central-1': 'Central Team 1',
  'team-central-2': 'Central Team 2',
  'team-south-1': 'South Team 1',
  'team-south-2': 'South Team 2',
  'team-east-1': 'East Team 1',
  'team-east-2': 'East Team 2',
  'team-west-1': 'West Team 1',
  'team-west-2': 'West Team 2',
  'team-recycle-1': 'Recycling Partner – GreenCycle',
  'team-recycle-2': 'Recycling Partner – BlueCycle',
};

let teamsCache = null;
let teamsCacheTime = 0;

/**
 * Fetch all teams map from Firestore with in-memory caching.
 *
 * @returns {Promise<Record<string, Object>>}
 */
export async function getTeamsMap() {
  const now = Date.now();
  if (teamsCache && now - teamsCacheTime < 60000) {
    return teamsCache;
  }

  try {
    const teamsRef = collection(db, 'teams');
    const snapshot = await getDocs(teamsRef);
    const map = {};
    snapshot.docs.forEach((d) => {
      map[d.id] = { id: d.id, ...d.data() };
    });
    teamsCache = map;
    teamsCacheTime = now;
    return map;
  } catch (err) {
    console.warn('Failed to load teams from Firestore:', err);
    return teamsCache || {};
  }
}

/**
 * Safely resolves an assignedTeam document ID to a human-readable team name.
 * NEVER returns raw team ID or undefined to citizens.
 *
 * @param {string} teamId
 * @param {string} [fallback='Assigned Response Team']
 * @returns {Promise<string>}
 */
export async function getTeamName(teamId, fallback = 'Assigned Response Team') {
  if (!teamId) return fallback;

  // Check in-memory cache first
  if (teamsCache && teamsCache[teamId]?.name) {
    return teamsCache[teamId].name;
  }

  // Try fetching fresh from Firestore
  try {
    const map = await getTeamsMap();
    if (map[teamId]?.name) {
      return map[teamId].name;
    }

    // Try single doc lookup
    const docRef = doc(db, 'teams', teamId);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.name) {
      if (!teamsCache) teamsCache = {};
      teamsCache[teamId] = { id: teamId, ...snap.data() };
      return snap.data().name;
    }
  } catch (err) {
    console.warn(`Error resolving team name for "${teamId}":`, err);
  }

  // Check canonical dictionary fallback
  if (CANONICAL_TEAM_NAMES[teamId]) {
    return CANONICAL_TEAM_NAMES[teamId];
  }

  // Safe fallback: never expose raw document ID
  return fallback;
}
