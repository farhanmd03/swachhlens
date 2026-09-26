/**
 * SwachhLens — Commercial Services Demo Seeding Script
 *
 * Populates Firestore with 3 realistic B2B/commercial bulk and event waste records:
 * 1. demo-commercial-001: Wedding Banquet Hall (Requested / Quoted stage, status: reported)
 * 2. demo-commercial-002: TechNova National Expo (Assigned to Team Truck 1, Accepted AI)
 * 3. demo-commercial-003: Campus Innovation Fest (Completed, Pending Municipal Verification)
 *
 * Safety:
 * - Dry-run by default.
 * - Pass `--execute` to actually write to Firestore.
 * - Does not overwrite existing real user data.
 *
 * Usage:
 *   node scripts/seed-commercial-demo.js            # Dry run
 *   node scripts/seed-commercial-demo.js --execute  # Actually write to Firestore
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDemoImageForWasteType } from './demo-images.js';

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

const isExecute = process.argv.includes('--execute');

const COMMERCIAL_CITIZENS = [
  {
    id: 'demo-citizen-comm-01',
    name: 'Vikramaditya Sharma',
    phone: '+91 98301 44521',
    email: 'sharma.heritage@example.com',
    area: 'EM Bypass / Ruby',
    ward: 'Ward 107',
  },
  {
    id: 'demo-citizen-comm-02',
    name: 'Pooja Sen',
    phone: '+91 98312 99843',
    email: 'operations@technovamedia.com',
    area: 'Science City / Mela Prangan',
    ward: 'Ward 58',
  },
  {
    id: 'demo-citizen-comm-03',
    name: 'Dr. Anirban Roy',
    phone: '+91 94330 11209',
    email: 'fest.convener@gnit.ac.in',
    area: 'Sodepur Campus',
    ward: 'Ward 08',
  },
];

const COMMERCIAL_DEMO_RECORDS = [
  {
    id: 'demo-commercial-001',
    serviceType: 'commercial_bulk',
    serviceNumber: 'SL-BULK-26-44012-WEDD',
    complaintNumber: 'SL-BULK-26-44012-WEDD',
    citizenId: 'demo-citizen-comm-01',
    citizenName: 'Vikramaditya Sharma',
    citizenPhone: '+91 98301 44521',
    customerContact: {
      organizationName: 'Grand Heritage Banquet & Lawns',
      contactPerson: 'Vikramaditya Sharma',
      phone: '+91 98301 44521',
      gstin: '19AAACG1234D1Z8',
    },
    establishmentType: 'wedding_marriage',
    eventName: 'Sharma-Verma Wedding Reception (800 Guests)',
    venueName: 'Grand Heritage Lawns, Eastern Metropolitan Bypass, Kolkata',
    gps: { lat: 22.535, lng: 88.395 },
    eventDate: '2026-10-15',
    expectedAttendance: 800,
    serviceWindow: 'morning',
    scale: 'large',
    wasteStream: 'food',
    secondaryStreams: ['plastic', 'paper'],
    segregatedAtSource: true,
    accessInstructions: 'Service Gate 3 on North Perimeter road. Large turning bay available for vehicle entry.',
    imageBase64: getDemoImageForWasteType('organic_waste'),
    comment: 'High volume post-reception dinner clearance. Wet and dry waste segregated at venue.',
    status: 'reported',
    commercialStatus: 'requested',
    priorityScore: 68,
    priorityReasons: [
      'Large commercial event scale (800 attendees)',
      'Organized source segregation verified',
      'Morning turnaround required before daytime booking',
    ],
    urgentEscalation: false,
    aiResult: {
      wasteType: 'organic_waste',
      volumeEstimate: 'large',
      confidence: 0.92,
      locationSensitivityHint: 'none',
      reasoning: 'High volume organic food waste and disposable packaging from wedding banqueting.',
    },
    commercialAssessment: {
      summaryPlan: 'Dedicated morning banquet cleanup with organic composting routing and recyclable packaging diversion.',
      recommendedCrewSize: 5,
      crewReasoning: 'Large venue with 800 attendees requires 5 workers for rapid 3-hour morning turnaround before next daytime booking.',
      recommendedVehicle: 'Mini Truck',
      recommendedTeamType: 'mini_truck',
      vehicleReasoning: 'Estimated volume 800-1,200 kg exceeds manual carry; mini truck with compactor provides efficient single-trip haulage.',
      estimatedDurationHours: 3,
      recyclingPotential: {
        material: 'Food & Organic Waste, PET Beverage Bottles',
        estimatedRecoveryRate: '75% diverted to Dhapa centralized composting facility',
        plan: 'Direct transfer of segregated wet food waste to municipal bio-methanation / compost plant.',
      },
    },
    commercialQuote: {
      breakdown: {
        baseMobilization: 1800,
        crewCost: 3000,
        vehicleCost: 1800,
        segregationSurcharge: 0,
        scaleAdjustment: 1600,
        crewCount: 5,
        durationHours: 3,
        vehicleType: 'Mini Truck',
      },
      totalQuote: 8200,
      currency: 'INR',
      tariffType: 'standard_indicative',
      generatedAt: Date.now() - 3600000 * 4,
    },
    timestamp: Date.now() - 3600000 * 5,
    assignedTeam: null,
    assignedVehicle: null,
  },
  {
    id: 'demo-commercial-002',
    serviceType: 'commercial_bulk',
    serviceNumber: 'SL-BULK-26-88231-EXPO',
    complaintNumber: 'SL-BULK-26-88231-EXPO',
    citizenId: 'demo-citizen-comm-02',
    citizenName: 'Pooja Sen',
    citizenPhone: '+91 98312 99843',
    customerContact: {
      organizationName: 'TechNova Exhibitions & Media Pvt Ltd',
      contactPerson: 'Pooja Sen',
      phone: '+91 98312 99843',
      gstin: '19AABCT5544K1ZV',
    },
    establishmentType: 'exhibition_fair',
    eventName: 'TechNova National Innovation Expo 2026',
    venueName: 'Biswa Bangla Mela Prangan, Hall A & Outdoor Promenade, Kolkata',
    gps: { lat: 22.542, lng: 88.398 },
    eventDate: '2026-10-02',
    expectedAttendance: 2500,
    serviceWindow: 'immediate',
    scale: 'very_large',
    wasteStream: 'plastic',
    secondaryStreams: ['paper', 'mixed'],
    segregatedAtSource: false,
    accessInstructions: 'Freight Bay B via Gate 4. Security clearance badge required at checkpoint.',
    imageBase64: getDemoImageForWasteType('plastic_waste'),
    comment: 'Trade exhibition teardown. High density of promotional flyers, plastic packaging, and booth decor.',
    status: 'assigned',
    commercialStatus: 'assigned',
    priorityScore: 82,
    priorityReasons: [
      'Very large event footfall (>2,000 attendees)',
      'Immediate post-event turnaround requested',
      'Unsegregated packaging requires on-site sorters',
    ],
    urgentEscalation: true,
    aiResult: {
      wasteType: 'plastic_waste',
      volumeEstimate: 'very_large',
      confidence: 0.94,
      locationSensitivityHint: 'none',
      reasoning: 'Very large exhibition accumulation with high proportion of recyclable LDPE film and cardboard cartons.',
    },
    commercialAssessment: {
      summaryPlan: 'Immediate multi-crew deployment with mechanized loading and authorized plastics recycling partner.',
      recommendedCrewSize: 8,
      crewReasoning: 'Exhibition teardown with 2,500+ attendees and unsegregated booth waste requires heavy manual sorting and expedited clearance.',
      recommendedVehicle: 'Mini Truck',
      recommendedTeamType: 'mini_truck',
      vehicleReasoning: 'Heavy tonnage requires heavy-duty mini truck with dual roundtrips or multi-vehicle fleet coordination.',
      estimatedDurationHours: 5,
      recyclingPotential: {
        material: 'Rigid Plastics, Cardboard Cartons, Packaging Film',
        estimatedRecoveryRate: '65% diverted to authorized plastic recyclers',
        plan: 'Sorted into Baled Paper and LDPE/PP stream on-site, routed directly to green recycling partners.',
      },
    },
    commercialQuote: {
      breakdown: {
        baseMobilization: 2400,
        crewCost: 6000,
        vehicleCost: 3200,
        segregationSurcharge: 1800,
        scaleAdjustment: 2800,
        crewCount: 8,
        durationHours: 5,
        vehicleType: 'Mini Truck',
      },
      totalQuote: 16200,
      currency: 'INR',
      tariffType: 'standard_indicative',
      generatedAt: Date.now() - 3600000 * 20,
    },
    timestamp: Date.now() - 3600000 * 24,
    assignedTeam: 'team-truck-1',
    assignedVehicle: 'Mini Truck',
    assignedAt: Date.now() - 3600000 * 18,
    dispatchDecisionType: 'accepted_ai',
  },
  {
    id: 'demo-commercial-003',
    serviceType: 'commercial_bulk',
    serviceNumber: 'SL-BULK-26-33910-FEST',
    complaintNumber: 'SL-BULK-26-33910-FEST',
    citizenId: 'demo-citizen-comm-03',
    citizenName: 'Dr. Anirban Roy',
    citizenPhone: '+91 94330 11209',
    customerContact: {
      organizationName: 'Guru Nanak Institute Campus Committee',
      contactPerson: 'Dr. Anirban Roy',
      phone: '+91 94330 11209',
      gstin: '19AABTG9012F1Z1',
    },
    establishmentType: 'campus_facility',
    eventName: 'TechTitans Annual Science & Innovation Fest',
    venueName: 'GNIT College Campus Grounds, Sodepur, Panihati',
    gps: { lat: 22.701, lng: 88.384 },
    eventDate: '2026-09-24',
    expectedAttendance: 600,
    serviceWindow: 'afternoon',
    scale: 'medium',
    wasteStream: 'food',
    secondaryStreams: ['plastic'],
    segregatedAtSource: true,
    accessInstructions: 'Main Campus Gate 1, drive directly to rear auditorium quadrangle.',
    imageBase64: getDemoImageForWasteType('organic_waste'),
    comment: 'Annual student fest food stalls and project exhibition clearance.',
    status: 'resolved',
    commercialStatus: 'resolved',
    priorityScore: 54,
    priorityReasons: [
      'Campus festival waste clearance',
      'High organic segregation compliance',
      'Completed by field team, awaiting municipal supervisor sign-off',
    ],
    urgentEscalation: false,
    aiResult: {
      wasteType: 'organic_waste',
      volumeEstimate: 'medium',
      confidence: 0.89,
      locationSensitivityHint: 'near_school',
      reasoning: 'Campus festival food stall and organic leftover accumulation with segregated bins.',
    },
    commercialAssessment: {
      summaryPlan: 'Afternoon campus sweep with organic composting transfer and campus grounds restoration.',
      recommendedCrewSize: 3,
      crewReasoning: 'Moderate festival footprint of 600 students, organized bins allow 3 workers to finish within 2.5 hours.',
      recommendedVehicle: 'Collection Van',
      recommendedTeamType: 'manual_cleanup',
      vehicleReasoning: 'Collection van fits narrow campus quadrangle paths without damaging walkways.',
      estimatedDurationHours: 3,
      recyclingPotential: {
        material: 'Food Waste & Compostable Leaf Plates',
        estimatedRecoveryRate: '85% converted to campus compost pits',
        plan: 'Shredded and added to college biology and agricultural compost beds.',
      },
    },
    commercialQuote: {
      breakdown: {
        baseMobilization: 1500,
        crewCost: 1800,
        vehicleCost: 1200,
        segregationSurcharge: 0,
        scaleAdjustment: 500,
        crewCount: 3,
        durationHours: 3,
        vehicleType: 'Collection Van',
      },
      totalQuote: 5000,
      currency: 'INR',
      tariffType: 'standard_indicative',
      generatedAt: Date.now() - 3600000 * 30,
    },
    timestamp: Date.now() - 3600000 * 32,
    assignedTeam: 'team-manual-a',
    assignedVehicle: 'Collection Van',
    assignedAt: Date.now() - 3600000 * 28,
    workStartedAt: Date.now() - 3600000 * 10,
    completedAt: Date.now() - 3600000 * 2,
    completionEvidence: {
      afterImageBase64: getDemoImageForWasteType('overflowing_bin'),
      completionNote: 'Full campus quadrangle swept clean. All food stall waste packed into biodegradable bags and loaded onto van.',
      completedByUid: 'supervisor-field-01',
      completedByName: 'Rajesh Mondal (Supervisor Zone A)',
      completedAt: Date.now() - 3600000 * 2,
    },
    dispatchDecisionType: 'accepted_ai',
  },
];

async function main() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  SwachhLens — Commercial Services Demo Seeder');
  console.log(`  Mode: ${isExecute ? '🚀 EXECUTE (Writing to Firestore)' : '🔍 DRY-RUN (Preview Only)'}`);
  console.log('════════════════════════════════════════════════════════════\n');

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    await signInAnonymously(auth);
    console.log('✓ Firebase Auth: Signed in anonymously\n');
  } catch (err) {
    console.error('❌ Firebase Auth failed:', err.message);
    process.exit(1);
  }

  // 1. Seed Citizens
  console.log('👥 Checking / Seeding Commercial Demo Customers...');
  for (const c of COMMERCIAL_CITIZENS) {
    const docRef = doc(db, 'citizens', c.id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      if (isExecute) {
        await setDoc(docRef, {
          name: c.name,
          phone: c.phone,
          email: c.email,
          area: c.area,
          ward: c.ward,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        console.log(`  [CREATED] Citizen: ${c.name} (${c.id})`);
      } else {
        console.log(`  [PLAN] Create Citizen: ${c.name} (${c.id})`);
      }
    } else {
      console.log(`  [EXISTS] Citizen: ${c.name} (${c.id})`);
    }
  }

  // 2. Seed Commercial Records
  console.log(`\nFound ${COMMERCIAL_DEMO_RECORDS.length} commercial demo records to process:\n`);

  let toCreate = 0;
  let toUpdate = 0;

  for (const record of COMMERCIAL_DEMO_RECORDS) {
    const docRef = doc(db, 'complaints', record.id);
    const existingSnap = await getDoc(docRef);
    const exists = existingSnap.exists();

    if (exists) {
      toUpdate++;
      console.log(`  [UPDATE] ${record.id} — ${record.serviceNumber} | ${record.eventName} (Status: ${record.status})`);
    } else {
      toCreate++;
      console.log(`  [CREATE] ${record.id} — ${record.serviceNumber} | ${record.eventName} (Status: ${record.status})`);
    }

    if (isExecute) {
      await setDoc(docRef, record, { merge: true });
      console.log(`    → Written to Firestore successfully.`);
    }
  }

  console.log('\n────────────────────────────────────────────────────────────');
  console.log(`Summary: ${toCreate} to create, ${toUpdate} to update.`);

  if (!isExecute) {
    console.log('\n⚠️  DRY RUN COMPLETED. No data was written.');
    console.log('   To write records to Firestore, run:');
    console.log('   node scripts/seed-commercial-demo.js --execute\n');
  } else {
    console.log('\n✅ All commercial demo records successfully committed to Firestore!\n');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
