/**
 * SwachhLens — Repair Demo Images with Real Photographs
 *
 * Scans all documents in the `complaints` collection and updates ONLY demo complaints
 * with the 10 real waste photographs from `demo-assets/`.
 *
 * ⚠️ Safety:
 * - Real user complaints are NEVER altered or modified.
 * - Only modifies documents identified as demo records.
 * - Sets `isDemo: true` on all demo complaints.
 * - Safe to run repeatedly.
 *
 * Usage:
 *   node scripts/repair-demo-images.js
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getRealPhotoForCategory, REAL_PHOTOS } from './load-real-photos.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const envPath = resolve(__dirname, '..', 'citizen-app', '.env');
    const content = readFileSync(envPath, 'utf-8');
    const env = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
    return env;
  } catch {
    console.error('❌ Error: Could not read citizen-app/.env');
    process.exit(1);
  }
}

const env = loadEnv();

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

async function repairDemoImagesWithRealPhotos() {
  console.log('🔧 SwachhLens — Real Waste Photo Repair for Demo Complaints');
  console.log('===========================================================');
  console.log(`📁 10 Real Waste Assets Loaded: ${Object.keys(REAL_PHOTOS).join(', ')}\n`);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  console.log('🔐 Authenticating anonymously with Firebase...');
  await signInAnonymously(auth);
  console.log('✅ Authenticated successfully.\n');

  console.log('🔍 Scanning Firestore complaints collection...');
  const complaintsRef = collection(db, 'complaints');
  const snapshot = await getDocs(complaintsRef);

  let demoRepairedCount = 0;
  let realComplaintsPreserved = 0;
  let categoryCounters = {};

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const docId = docSnap.id;

    // Strict criterion to identify demo records only
    const isDemoRecord =
      docId.startsWith('demo-complaint-') ||
      (typeof data.citizenId === 'string' && data.citizenId.startsWith('demo-citizen-')) ||
      data.isDemo === true;

    if (isDemoRecord) {
      const wasteType = data.aiResult?.wasteType || 'garbage_dump';
      const variantIdx = categoryCounters[wasteType] || 0;
      categoryCounters[wasteType] = variantIdx + 1;

      const realImageBase64 = getRealPhotoForCategory(wasteType, variantIdx);

      const docRef = doc(db, 'complaints', docId);
      await updateDoc(docRef, {
        imageBase64: realImageBase64,
        isDemo: true,
      });

      console.log(
        `   ✅ [REPAIRED WITH REAL PHOTO] ${docId} | ${data.complaintNumber || 'No ID'} | ${wasteType} (Photo Base64: ~${Math.round(
          realImageBase64.length / 1024
        )} KB)`
      );
      demoRepairedCount++;
    } else {
      console.log(
        `   🛡️  [PRESERVED] Real user complaint ${docId} (${data.complaintNumber || 'Real ID'}) — UNTOUCHED`
      );
      realComplaintsPreserved++;
    }
  }

  console.log('\n===========================================================');
  console.log('🎉 REAL PHOTO DEMO REPAIR COMPLETED');
  console.log('===========================================================');
  console.log(`📸 Real Waste Photos Applied: ${demoRepairedCount} demo complaints`);
  console.log(`🛡️  Real User Complaints Left Untouched: ${realComplaintsPreserved}`);
  console.log(`📁 Total Collection Records Scanned:     ${snapshot.size}`);
  console.log('===========================================================\n');

  process.exit(0);
}

repairDemoImagesWithRealPhotos().catch((err) => {
  console.error('❌ Repair failed with error:', err);
  process.exit(1);
});
