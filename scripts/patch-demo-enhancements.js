/**
 * SwachhLens — Demo Data Enhancement Patch Script
 *
 * Enriches the 22 existing demo complaint records with:
 * 1. bioWasteRisk flags on medical/clinical waste records
 * 2. duplicateEvidence structured objects on duplicate demo complaints
 * 3. perceptual imageHash fingerprints on all demo complaints
 *
 * ⚠️ NEVER modifies the 3 real user test complaints.
 * ⚠️ Safe to run idempotently.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
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
}

const env = loadEnv();
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Deterministic dHash fingerprints for demo photos
const DEMO_IMAGE_HASHES = {
  'demo-complaint-01': '8f7e6d5c4b3a2918',
  'demo-complaint-02': 'a1b2c3d4e5f67890',
  'demo-complaint-03': 'a1b2c3d4e5f67891', // 1 bit different from #02 → 98% visual similarity!
  'demo-complaint-04': '1234567890abcdef',
  'demo-complaint-05': 'fedcba0987654321',
  'demo-complaint-06': '0f1e2d3c4b5a6978',
  'demo-complaint-07': 'aabbccddeeff0011',
  'demo-complaint-08': '2233445566778899',
  'demo-complaint-09': '13579bdf02468ace',
  'demo-complaint-10': 'ca014872be95316f',
  'demo-complaint-11': '8877665544332211',
  'demo-complaint-12': '1122334455667788',
  'demo-complaint-13': '445566778899aabb',
  'demo-complaint-14': '5566778899aabbcc',
  'demo-complaint-15': '66778899aabbccdd',
  'demo-complaint-16': '778899aabbccdde0',
  'demo-complaint-17': '8899aabbccddeeff',
  'demo-complaint-18': '99aabbccddeeff00',
  'demo-complaint-19': 'aabbccddeeff0012',
  'demo-complaint-20': 'bbccddeeff001122',
  'demo-complaint-21': 'ccddeeff00112233',
  'demo-complaint-22': 'ddeeff0011223344',
};

async function patchDemoData() {
  console.log('🚀 Authenticating anonymously for demo data patch...');
  await signInAnonymously(auth);

  const snap = await getDocs(collection(db, 'complaints'));
  console.log(`Found ${snap.docs.length} total complaints in Firestore.`);

  let patchedCount = 0;

  for (const document of snap.docs) {
    const id = document.id;
    const data = document.data();

    // STRICT SAFETY GUARD: ONLY touch demo complaints
    if (!id.startsWith('demo-complaint-') && !data.isDemo) {
      console.log(`  🛡️ Preserving real user complaint: ${id}`);
      continue;
    }

    const docRef = doc(db, 'complaints', id);
    const updates = {};

    // 1. Assign imageHash
    if (!data.imageHash || data.imageHash.length === 0) {
      updates.imageHash = DEMO_IMAGE_HASHES[id] || '8f7e6d5c4b3a2918';
    }

    // 2. Assign bioWasteRisk on hazardous/hospital cases
    if (id === 'demo-complaint-01' || id === 'demo-complaint-07' || data.aiResult?.wasteType === 'hazardous_waste') {
      updates['aiResult.bioWasteRisk'] = true;
      updates.urgentEscalation = true;
    } else if (data.aiResult && data.aiResult.bioWasteRisk === undefined) {
      updates['aiResult.bioWasteRisk'] = false;
    }

    // 3. Assign structured duplicateEvidence on demo-complaint-03
    if (id === 'demo-complaint-03' || data.isDuplicateOf) {
      const parentId = data.isDuplicateOf || 'demo-complaint-02';
      updates.isDuplicateOf = parentId;
      updates.duplicateEvidence = {
        isDuplicate: true,
        duplicateOf: parentId,
        complaintNumber: 'SWL-26-72419-DRN1',
        distanceMeters: 22,
        hoursApart: 1.0,
        categoryMatch: true,
        imageSimilarityScore: 98,
        imageSimilarityLabel: 'high',
        confidence: 0.96,
        reasons: [
          'Same waste category (Drain Blockage)',
          '22m from existing report',
          '1.0 hour apart',
          'Visual similarity: 98% (high perceptual match)',
        ],
      };
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(docRef, updates);
      patchedCount++;
      console.log(`  ✅ Enhanced demo complaint: ${id}`);
    }
  }

  console.log(`\n🎉 Successfully patched ${patchedCount} demo complaint records with imageHash, bioWasteRisk, and duplicateEvidence.`);
  process.exit(0);
}

patchDemoData().catch((err) => {
  console.error('❌ Patch failed:', err);
  process.exit(1);
});
