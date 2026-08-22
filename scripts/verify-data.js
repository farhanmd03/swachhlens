import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

async function check() {
  await signInAnonymously(auth);
  const snap = await getDocs(collection(db, 'complaints'));
  console.log(`Total complaints in Firestore: ${snap.docs.length}`);

  let demoCount = 0;
  let realCount = 0;
  let withPhotos = 0;
  const statusCounts = {};
  const wasteTypes = {};

  snap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.isDemo || doc.id.startsWith('demo-')) {
      demoCount++;
    } else {
      realCount++;
    }
    if (data.imageBase64 && data.imageBase64.length > 100) {
      withPhotos++;
    }
    statusCounts[data.status] = (statusCounts[data.status] || 0) + 1;
    const wt = data.aiResult?.wasteType || 'unknown';
    wasteTypes[wt] = (wasteTypes[wt] || 0) + 1;
  });

  console.log(`Demo complaints: ${demoCount}`);
  console.log(`Real user complaints: ${realCount}`);
  console.log(`Complaints with valid photos: ${withPhotos}`);
  console.log('Statuses:', JSON.stringify(statusCounts, null, 2));
  console.log('Waste types:', JSON.stringify(wasteTypes, null, 2));

  const teamsSnap = await getDocs(collection(db, 'teams'));
  console.log(`Total teams in Firestore: ${teamsSnap.docs.length}`);
  teamsSnap.docs.forEach(d => {
    console.log(`- Team: ${d.id} (${d.data().name}) load: ${d.data().currentLoad}`);
  });

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
