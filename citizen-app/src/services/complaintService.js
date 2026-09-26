import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

/**
 * Create a new complaint document in Firestore.
 *
 * @param {Object} complaintData
 * @returns {Promise<string>} The Firestore document ID
 */
export async function createComplaint(complaintData) {
  const complaintsRef = collection(db, 'complaints');
  const docRef = await addDoc(complaintsRef, complaintData);
  return docRef.id;
}

/**
 * Get all complaints for a specific citizen, ordered by newest first.
 *
 * @param {string} citizenId
 * @returns {Promise<Array>}
 */
export async function getCitizenComplaints(citizenId) {
  const complaintsRef = collection(db, 'complaints');
  const q = query(
    complaintsRef,
    where('citizenId', '==', citizenId),
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => !c.id.startsWith('test-'));
}

/**
 * Get a single complaint by ID.
 *
 * @param {string} complaintId
 * @returns {Promise<Object|null>}
 */
export async function getComplaintById(complaintId) {
  const docRef = doc(db, 'complaints', complaintId);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Subscribe to real-time updates for a single complaint.
 *
 * @param {string} complaintId
 * @param {Function} onData - Called with complaint object on each update
 * @param {Function} onError - Called with error if subscription fails
 * @returns {Function} Unsubscribe function
 */
export function subscribeToComplaint(complaintId, onData, onError) {
  const docRef = doc(db, 'complaints', complaintId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onData({ id: snap.id, ...snap.data() });
      }
    },
    (err) => {
      console.error('Complaint subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Submit citizen feedback on a resolved complaint.
 *
 * Only the `feedback` field is written. This satisfies the Firestore security
 * rule that allows citizens to add only the feedback field to their own
 * resolved complaints.
 *
 * @param {string} complaintId
 * @param {{ result: string, rating: number, comment: string }} feedbackData
 * @returns {Promise<void>}
 */
export async function submitFeedback(complaintId, feedbackData) {
  const docRef = doc(db, 'complaints', complaintId);
  // Use updateDoc with only the feedback field — the Firestore security rule
  // for citizen feedback uses diff().affectedKeys().hasOnly(['feedback'])
  // to ensure ONLY this field is being modified.
  await updateDoc(docRef, {
    feedback: {
      result: feedbackData.result,
      rating: feedbackData.rating,
      comment: feedbackData.comment?.trim() || '',
      submittedAt: Date.now(),
    },
  });
}

/**
 * Approve an indicative commercial service quote (customer action).
 *
 * @param {string} complaintId
 * @returns {Promise<void>}
 */
export async function approveCommercialQuote(complaintId) {
  const docRef = doc(db, 'complaints', complaintId);
  const existing = await getDoc(docRef);
  const data = existing.exists() ? existing.data() : {};
  const lockedPrice = data.commercialQuote?.indicativeTotal || data.commercialQuote?.totalQuote || 0;

  await updateDoc(docRef, {
    customerApproval: {
      status: 'accepted',
      approvedAt: Date.now(),
      lockedPrice,
      priceLocked: true,
      decision: 'accepted_initial',
    },
    status: 'approved',
  });
}

/**
 * Customer Action: Accept an updated / revised estimate from municipal operations.
 * Locks the price and updates customerApproval state.
 */
export async function acceptPriceRevision(complaintId, updatedQuote) {
  const docRef = doc(db, 'complaints', complaintId);
  const existing = await getDoc(docRef);
  const data = existing.exists() ? existing.data() : {};
  const lockedPrice = updatedQuote?.indicativeTotal || updatedQuote?.totalQuote || data.commercialQuote?.indicativeTotal || 0;

  await updateDoc(docRef, {
    customerApproval: {
      status: 'accepted',
      approvedAt: Date.now(),
      lockedPrice,
      priceLocked: true,
      decision: 'accepted_revision',
    },
    status: 'approved',
  });
}

/**
 * Customer Action: Decline an updated / revised estimate and cancel the request.
 */
export async function declinePriceRevision(complaintId, reason) {
  const docRef = doc(db, 'complaints', complaintId);
  await updateDoc(docRef, {
    customerApproval: {
      status: 'declined',
      declinedAt: Date.now(),
      decision: 'declined_revision',
      customerNote: reason || 'Customer declined operator revised estimate',
    },
    status: 'requested',
  });
}
