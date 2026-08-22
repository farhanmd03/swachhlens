/**
 * setup-municipal-user.js
 *
 * One-time setup script: creates a municipalUsers/{uid} document for an
 * existing Firebase Auth email/password account so that the Firestore
 * isMunicipal() rule recognises the account as an authorised municipal
 * portal user.
 *
 * IMPORTANT:
 * - This script uses the Firebase Client SDK (not Admin SDK) because the
 *   project runs on Spark (no billing / no service account key needed).
 * - The municipalUsers collection's write rule is `allow write: if false`,
 *   meaning client writes are blocked by normal Firestore rules.
 * - To seed this record you must EITHER:
 *   A) Temporarily loosen the rule, run the script, then re-tighten. (risky)
 *   B) Use the Firebase Console directly (recommended for one-time setup).
 *
 * ── RECOMMENDED APPROACH (Firebase Console) ────────────────────────────
 *
 * 1. Open: https://console.firebase.google.com/project/swachhlens-8673d/firestore
 * 2. Click "Start collection" → Collection ID: municipalUsers
 * 3. Document ID: paste the municipal portal user's Firebase Auth UID
 *    (find it in Authentication → Users → copy the UID column)
 * 4. Add fields:
 *      email    (string)  →  the municipal account email
 *      role     (string)  →  "municipal_operator"
 *      addedAt  (number)  →  current Unix timestamp in ms  (e.g. Date.now())
 * 5. Save.
 *
 * That's it. The Firestore isMunicipal() rule will now recognise that UID.
 *
 * ── SCRIPT APPROACH (temporary rule relaxation) ────────────────────────
 *
 * If you prefer a script, temporarily add this rule to firestore.rules
 * inside the municipalUsers match block, run the script, then remove it:
 *
 *   allow write: if request.auth != null && request.auth.uid == userId;
 *
 * Then run:
 *   node scripts/setup-municipal-user.js
 *
 * Usage:
 *   MUNICIPAL_EMAIL=admin@yourmunicipality.gov
 *   MUNICIPAL_PASSWORD=yourpassword
 *   node scripts/setup-municipal-user.js
 *
 * Or set them inline:
 *   MUNICIPAL_EMAIL=admin@... MUNICIPAL_PASSWORD=... node scripts/setup-municipal-user.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../citizen-app/.env') });

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const email    = process.env.MUNICIPAL_EMAIL;
const password = process.env.MUNICIPAL_PASSWORD;

if (!email || !password) {
  console.error('ERROR: Set MUNICIPAL_EMAIL and MUNICIPAL_PASSWORD environment variables.');
  process.exit(1);
}

async function run() {
  console.log(`\nSigning in as municipal user: ${email}`);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;
  console.log(`Authenticated — UID: ${uid}`);

  const docRef = doc(db, 'municipalUsers', uid);
  await setDoc(docRef, {
    email,
    role:    'municipal_operator',
    addedAt: Date.now(),
  });

  console.log(`\n✅ municipalUsers/${uid} created successfully.`);
  console.log('   The Firestore isMunicipal() rule will now authorise this account.');
  console.log('\nIMPORTANT: Restore the write: if false rule for municipalUsers before production use.\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('\nSetup failed:', err.message);
  process.exit(1);
});
