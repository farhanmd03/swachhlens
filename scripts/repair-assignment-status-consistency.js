/**
 * SwachhLens — Repair Assignment Status Consistency Script
 *
 * This script identifies and repairs lifecycle consistency anomalies in the
 * `complaints` collection where an assigned team is present but the complaint
 * status remains in 'reported' or 'verified'.
 *
 * Per lifecycle design:
 *   assignedTeam != null AND status in ['reported', 'verified']
 *   -> status: 'assigned'
 *   -> assignedAt: complaint.assignedAt || Date.now()
 *
 * Safety Constraints:
 *   - NEVER modifies unassigned complaints (assignedTeam is null/empty).
 *   - NEVER modifies 'in_progress', 'completed_pending_verification', or 'resolved' complaints.
 *   - Preserves all other complaint fields exactly as stored.
 *   - Requires explicit execution flag `--execute` to apply changes.
 *   - Defaults to DRY-RUN mode (read-only audit).
 *   - DO NOT EXECUTE AUTOMATICALLY.
 *
 * Usage:
 *   Audit only (dry-run):
 *     node scripts/repair-assignment-status-consistency.js
 *
 *   Execute repair:
 *     node scripts/repair-assignment-status-consistency.js --execute
 *
 *   With municipal credentials (if updating restricted non-demo records):
 *     node scripts/repair-assignment-status-consistency.js --execute --email=supervisor@kolkata.gov --password=secret
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const candidates = [
    resolve(__dirname, '..', 'citizen-app', '.env'),
    resolve(__dirname, '..', 'portal', '.env'),
  ];

  for (const envPath of candidates) {
    try {
      const content = readFileSync(envPath, 'utf-8');
      const env = {};
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
      if (env.VITE_FIREBASE_API_KEY) return env;
    } catch {
      // try next
    }
  }

  console.error('Error: Could not read .env file with Firebase configuration.');
  process.exit(1);
}

const env = loadEnv();

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

async function main() {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const emailArg = args.find((a) => a.startsWith('--email='))?.split('=')[1] || process.env.MUNICIPAL_EMAIL;
  const passwordArg = args.find((a) => a.startsWith('--password='))?.split('=')[1] || process.env.MUNICIPAL_PASSWORD;

  console.log('===============================================================');
  console.log('🛠️  SwachhLens — Assignment Status Consistency Audit & Repair');
  console.log('===============================================================');
  console.log(`Mode: ${isExecute ? '🔴 LIVE EXECUTION (--execute)' : '🟢 DRY-RUN ONLY (Audit)'}`);
  if (!isExecute) {
    console.log('ℹ️  No changes will be written. Run with --execute to apply repairs.\n');
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  if (emailArg && passwordArg) {
    console.log(`🔐 Signing in as municipal user: ${emailArg}...`);
    await signInWithEmailAndPassword(auth, emailArg, passwordArg);
    console.log('✅ Authenticated with municipal role.\n');
  } else {
    console.log('🔐 Signing in anonymously...');
    await signInAnonymously(auth);
    console.log('✅ Authenticated.\n');
  }

  const complaintsRef = collection(db, 'complaints');
  const snapshot = await getDocs(complaintsRef);

  console.log(`🔍 Total complaints scanned in Firestore: ${snapshot.size}`);

  const candidatesToRepair = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    // Strict criteria:
    // 1. assignedTeam exists and is non-empty
    // 2. status is 'reported' OR 'verified'
    const hasAssignedTeam = Boolean(data.assignedTeam && String(data.assignedTeam).trim().length > 0);
    const isReportedOrVerified = data.status === 'reported' || data.status === 'verified';

    // Must NEVER touch in_progress, completed_pending_verification, or resolved
    const isTerminalOrWorking =
      data.status === 'in_progress' ||
      data.status === 'completed_pending_verification' ||
      data.status === 'resolved';

    if (hasAssignedTeam && isReportedOrVerified && !isTerminalOrWorking) {
      candidatesToRepair.push({
        id,
        complaintNumber: data.complaintNumber || 'N/A',
        currentStatus: data.status,
        assignedTeam: data.assignedTeam,
        assignedAt: data.assignedAt,
        data,
      });
    }
  });

  console.log(`📊 Inconsistent complaints found: ${candidatesToRepair.length}\n`);

  if (candidatesToRepair.length === 0) {
    console.log('🎉 All complaints with assigned teams already have consistent operational statuses!');
    console.log('No repairs needed.');
    process.exit(0);
  }

  console.log('---------------------------------------------------------------');
  console.log('Inconsistent Complaint Records:');
  console.log('---------------------------------------------------------------');

  for (const c of candidatesToRepair) {
    console.log(
      `• Doc ID:           ${c.id}\n` +
      `  Complaint Number: ${c.complaintNumber}\n` +
      `  Assigned Team:    ${c.assignedTeam}\n` +
      `  Current Status:   ${c.currentStatus}  ==>  Target Status: assigned\n` +
      `  assignedAt:       ${c.assignedAt ? new Date(c.assignedAt).toISOString() : 'Will set to Date.now()'}\n`
    );
  }

  if (!isExecute) {
    console.log('===============================================================');
    console.log('🔒 DRY-RUN COMPLETE — NO FIRESTORE DATA WAS MODIFIED.');
    console.log('To apply these repairs, run explicitly:');
    console.log('  node scripts/repair-assignment-status-consistency.js --execute');
    console.log('===============================================================');
    process.exit(0);
  }

  // Live execution
  console.log('⚡ Applying repairs to Firestore...');
  let repairedCount = 0;
  let failedCount = 0;

  for (const c of candidatesToRepair) {
    try {
      const docRef = doc(db, 'complaints', c.id);
      const updates = {
        status: 'assigned',
      };
      if (!c.assignedAt) {
        updates.assignedAt = Date.now();
      }

      await updateDoc(docRef, updates);
      repairedCount++;
      console.log(`✅ Repaired ${c.id} (${c.complaintNumber}) → status: assigned`);
    } catch (err) {
      failedCount++;
      console.error(`❌ Failed to update ${c.id}: ${err.message}`);
    }
  }

  console.log('\n===============================================================');
  console.log('🏁 REPAIR SUMMARY:');
  console.log(`   Successfully Repaired: ${repairedCount}`);
  console.log(`   Failed Updates:        ${failedCount}`);
  console.log('===============================================================');
}

main().catch((err) => {
  console.error('Fatal error during repair execution:', err);
  process.exit(1);
});
