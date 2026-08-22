import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  where,
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
 * Subscribe to real-time complaints assigned to a specific team ID (for Field Supervisors).
 *
 * @param {string} teamId - Team ID assigned to supervisor
 * @param {Function} onData - Called with array of complaint objects on each update
 * @param {Function} onError - Called with an Error if the subscription fails
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTeamComplaints(teamId, onData, onError) {
  const complaintsRef = collection(db, 'complaints');
  const q = query(
    complaintsRef,
    where('assignedTeam', '==', teamId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const complaints = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Client-side sort by priorityScore descending without requiring server composite index
      complaints.sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));
      onData(complaints);
    },
    (error) => {
      console.error('Firestore team subscription error:', error.code, error.message);
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
  completed_pending_verification: 'completedAt',
  resolved: 'resolvedAt',
};

/**
 * General update complaint helper ensuring immutable core fields are preserved.
 *
 * @param {string} complaintId
 * @param {Object} updates
 */
export async function updateComplaint(complaintId, updates) {
  const docRef = doc(db, 'complaints', complaintId);

  const existing = await getDoc(docRef);
  if (!existing.exists()) throw new Error(`Complaint ${complaintId} not found.`);

  const data = existing.data();
  const newStatus = updates.status ?? data.status;

  // Normalize isDuplicateOf
  const existingIsDuplicateOf = ('isDuplicateOf' in data) ? (data.isDuplicateOf ?? null) : null;

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
    isDuplicateOf: existingIsDuplicateOf,

    // Mutable dispatch & assignment fields
    status: newStatus,
    assignedTeam: updates.assignedTeam !== undefined ? updates.assignedTeam : (data.assignedTeam ?? null),
    assignedVehicle: updates.assignedVehicle !== undefined ? updates.assignedVehicle : (data.assignedVehicle ?? null),

    // Lifecycle timestamps
    verifiedAt: data.verifiedAt ?? null,
    assignedAt: data.assignedAt ?? null,
    arrivedAt: updates.arrivedAt !== undefined ? updates.arrivedAt : (data.arrivedAt ?? null),
    workStartedAt: updates.workStartedAt !== undefined ? updates.workStartedAt : (data.workStartedAt ?? null),
    inProgressAt: data.inProgressAt ?? null,
    completedAt: updates.completedAt !== undefined ? updates.completedAt : (data.completedAt ?? null),
    resolvedAt: updates.resolvedAt !== undefined ? updates.resolvedAt : (data.resolvedAt ?? null),

    // Verification & Field Evidence fields
    completionEvidence: updates.completionEvidence !== undefined ? updates.completionEvidence : (data.completionEvidence ?? null),
    reworkReason: updates.reworkReason !== undefined ? updates.reworkReason : (data.reworkReason ?? null),
    reworkRequestedAt: updates.reworkRequestedAt !== undefined ? updates.reworkRequestedAt : (data.reworkRequestedAt ?? null),
    verifiedBy: updates.verifiedBy !== undefined ? updates.verifiedBy : (data.verifiedBy ?? null),

    // Apply any automatic timestamp
    ...lifecycleUpdates,
  });
}

/**
 * Field Supervisor Action: Mark crew arrived on-site.
 */
export async function markJobArrived(complaintId) {
  return updateComplaint(complaintId, {
    arrivedAt: Date.now(),
  });
}

/**
 * Field Supervisor Action: Start cleanup operations.
 */
export async function startJobWork(complaintId) {
  const now = Date.now();
  return updateComplaint(complaintId, {
    status: 'in_progress',
    inProgressAt: now,
    workStartedAt: now,
    reworkReason: null, // Clear rework alert upon restarting
  });
}

/**
 * Field Supervisor Action: Submit after-cleanup photo & completion evidence.
 */
export async function submitJobCompletion(complaintId, { afterImageBase64, completionNote, supervisorUid, supervisorName }) {
  const now = Date.now();
  return updateComplaint(complaintId, {
    status: 'completed_pending_verification',
    completedAt: now,
    completionEvidence: {
      afterImageBase64: afterImageBase64 || null,
      completionNote: completionNote?.trim() || 'Cleanup completed by field response team.',
      completedByUid: supervisorUid || 'field-supervisor',
      completedByName: supervisorName || 'Field Supervisor',
      completedAt: now,
    },
  });
}

/**
 * Municipal Operator Action: Verify completion evidence and finalize resolution.
 */
export async function verifyAndResolveComplaint(complaintId, operatorUid, operatorName) {
  const now = Date.now();
  return updateComplaint(complaintId, {
    status: 'resolved',
    resolvedAt: now,
    verifiedBy: {
      uid: operatorUid,
      name: operatorName || 'Municipal Operator',
      verifiedAt: now,
    },
  });
}

/**
 * Municipal Operator Action: Reject completion and send back for rework with explanation.
 */
export async function requestJobRework(complaintId, reworkReason, operatorUid) {
  const now = Date.now();
  return updateComplaint(complaintId, {
    status: 'in_progress',
    reworkReason: reworkReason.trim(),
    reworkRequestedAt: now,
  });
}
