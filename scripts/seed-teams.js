/**
 * SwachhLens — Teams Seed Script
 *
 * One-time script to populate the Firestore `teams` collection
 * with fictional/demo teams for hackathon demonstration purposes.
 *
 * ⚠️ IMPORTANT: These are fictional hackathon demo records.
 * In a production environment, teams would be managed through
 * an administrative interface.
 *
 * Usage:
 *   1. Ensure you have a .env file in the citizen-app/ directory
 *      with valid Firebase configuration
 *   2. Run: node scripts/seed-teams.js
 *
 * Prerequisites:
 *   - Node.js 18+
 *   - firebase package installed (uses citizen-app/node_modules)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env from citizen-app
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
    console.error('Error: Could not read citizen-app/.env');
    console.error('Make sure you have created a .env file with Firebase configuration.');
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

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_FIREBASE_API_KEY') {
  console.error('Error: Firebase configuration not set.');
  console.error('Please update citizen-app/.env with your Firebase project values.');
  process.exit(1);
}

// ── Demo Teams (fictional hackathon records) ────────────────────
const DEMO_TEAMS = [
  {
    id: 'team-manual-a',
    name: 'Manual Cleanup Team A',
    type: 'manual_cleanup',
    currentLoad: 0,
    active: true,
  },
  {
    id: 'team-truck-1',
    name: 'Mini Truck Unit 1',
    type: 'mini_truck',
    currentLoad: 0,
    active: true,
  },
  {
    id: 'team-recycle-gc',
    name: 'Recycling Partner - GreenCycle',
    type: 'recycling_partner',
    currentLoad: 0,
    active: true,
  },
  {
    id: 'team-manual-b',
    name: 'Manual Cleanup Team B',
    type: 'manual_cleanup',
    currentLoad: 0,
    active: true,
  },
];

async function seedTeams() {
  console.log('🌱 SwachhLens — Teams Seed Script');
  console.log('================================');
  console.log('⚠️  These are fictional hackathon demo records.\n');

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Sign in anonymously to satisfy Firestore rules
  console.log('🔐 Signing in anonymously...');
  await signInAnonymously(auth);
  console.log('✅ Authenticated.\n');

  // Check if teams already exist
  const teamsRef = collection(db, 'teams');
  const existing = await getDocs(teamsRef);

  if (!existing.empty) {
    console.log(`⚠️  Found ${existing.size} existing team(s) in Firestore.`);
    console.log('   Skipping seed to avoid duplicates.');
    console.log('   Delete existing teams manually if you want to re-seed.\n');
    process.exit(0);
  }

  // Seed teams
  console.log('📝 Creating demo teams...\n');

  for (const team of DEMO_TEAMS) {
    const { id, ...data } = team;
    const docRef = doc(db, 'teams', id);
    await setDoc(docRef, data);
    console.log(`   ✅ ${data.name} (${data.type})`);
  }

  console.log(`\n🎉 Successfully seeded ${DEMO_TEAMS.length} demo teams!`);
  console.log('\nTeam IDs:');
  for (const team of DEMO_TEAMS) {
    console.log(`   ${team.id} → ${team.name}`);
  }

  process.exit(0);
}

seedTeams().catch((error) => {
  console.error('❌ Seed failed:', error.message);
  process.exit(1);
});
