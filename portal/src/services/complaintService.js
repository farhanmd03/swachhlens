import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

/**
 * Subscribe to real-time complaints updates, ordered by priorityScore descending.
 *
 * @param {Function} onData - Called with array of complaint objects on each update
 * @param {Function} onError - Called with an Error if the subscription fails
 * @returns {Function} Unsubscribe function
 */
export function subscribeToComplaints(onData, onError) {
  const complaintsRef = collection(db, 'complaints');
  const q = query(complaintsRef, orderBy('priorityScore', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const complaints = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(complaints);
    },
    (error) => {
      console.error('Firestore subscription error:', error.code, error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Get a single complaint by ID.
 */
export async function getComplaintById(complaintId) {
  const docRef = doc(db, 'complaints', complaintId);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Status → lifecycle timestamp field mapping.
 */
const STATUS_TIMESTAMP_FIELD = {
  verified: 'verifiedAt',
  assigned: 'assignedAt',
  in_progress: 'inProgressAt',
  resolved: 'resolvedAt',
};

/**
 * Update complaint dispatch fields (status, assignedTeam, assignedVehicle).
 * Automatically writes lifecycle timestamps when status changes.
 * Fetches existing document and re-sends all immutable fields unchanged
 * to satisfy Firestore security rules.
 *
 * @param {string} complaintId
 * @param {{ status?: string, assignedTeam?: string|null, assignedVehicle?: string|null }} updates
 */
export async function updateComplaint(complaintId, updates) {
  const docRef = doc(db, 'complaints', complaintId);

  const existing = await getDoc(docRef);
  if (!existing.exists()) throw new Error(`Complaint ${complaintId} not found.`);

  const data = existing.data();
  const newStatus = updates.status ?? data.status;

  // Write lifecycle timestamp if status is changing
  const lifecycleUpdates = {};
  if (newStatus !== data.status && STATUS_TIMESTAMP_FIELD[newStatus]) {
    lifecycleUpdates[STATUS_TIMESTAMP_FIELD[newStatus]] = Date.now();
  }

  await updateDoc(docRef, {
    // Immutable fields — sent unchanged to satisfy security rules
    citizenId: data.citizenId,
    imageBase64: data.imageBase64,
    gps: data.gps,
    timestamp: data.timestamp,
    comment: data.comment,
    aiResult: data.aiResult,
    priorityScore: data.priorityScore,
    urgentEscalation: data.urgentEscalation,
    isDuplicateOf: data.isDuplicateOf,
    // Mutable dispatch fields
    status: newStatus,
    assignedTeam: updates.assignedTeam !== undefined ? updates.assignedTeam : data.assignedTeam,
    assignedVehicle: updates.assignedVehicle !== undefined ? updates.assignedVehicle : data.assignedVehicle,
    // Lifecycle timestamps (unchanged if not applicable)
    verifiedAt: data.verifiedAt ?? null,
    assignedAt: data.assignedAt ?? null,
    inProgressAt: data.inProgressAt ?? null,
    resolvedAt: data.resolvedAt ?? null,
    // Apply any new lifecycle timestamp
    ...lifecycleUpdates,
  });
}
