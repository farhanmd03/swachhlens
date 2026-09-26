/**
 * SwachhLens — Commercial Services Demo Seeding Script
 *
 * Populates Firestore with 3 realistic B2B/commercial bulk and event waste records:
 * 1. demo-commercial-001: Wedding Banquet Hall (Requested, Zone B - EM Bypass, active operator price revision pending approval)
 * 2. demo-commercial-002: TechNova National Expo (Assigned to Team Truck 1, Zone C - Science City/Mela Prangan)
 * 3. demo-commercial-003: Campus Innovation Fest (Completed & Verified, Zone A - Sodepur, Price Locked)
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
    businessDetails: {
      establishmentType: 'wedding_marriage',
      establishmentLabel: 'Wedding / Marriage Venue',
      serviceFrequency: 'one_time',
      serviceFrequencyLabel: 'One-time Collection',
      operatingZone: 'zone_b',
      operatingZoneLabel: 'Zone B — EM Bypass / Ruby / Gariahat',
      venueName: 'Grand Heritage Lawns & Banquet',
      address: 'Eastern Metropolitan Bypass, near Ruby Crossing, Kolkata',
      siteInstructions: 'Service Gate 3 on North Perimeter road. Large turning bay available for vehicle entry. Ground-level staging.',
      eventDate: '2026-10-15',
      serviceWindow: 'morning',
      serviceWindowLabel: 'Morning Window (06:00 – 11:00)',
      estimatedPeople: 800,
      estimatedWasteScale: 'large',
      scaleLabel: 'Large Scale (500–1,500 kg / ~600–1,500 people)',
      wasteTypes: ['food', 'plastic', 'paper'],
      wasteTypeLabels: ['Food & Organic Waste', 'Plastic Packaging & Bottles', 'Paper & Corrugated Cardboard'],
      location: { lat: 22.535, lng: 88.395 },
    },
    venueName: 'Grand Heritage Lawns, Eastern Metropolitan Bypass, Kolkata',
    gps: { lat: 22.535, lng: 88.395 },
    imageBase64: getDemoImageForWasteType('organic_waste'),
    comment: 'Grand Heritage Lawns — Wedding / Marriage Venue (One-time Collection)',
    status: 'reported',
    commercialStatus: 'requested',
    priorityScore: 70,
    priorityReasons: [
      'Commercial Bulk Service Request',
      'Wedding / Marriage Venue (800 attendees)',
      'Kolkata Zone B — EM Bypass / Ruby',
      'Morning Window (06:00 – 11:00)',
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
      wasteProfile: 'High volume catering waste with recyclable beverage bottles and dry cardboard',
      recommendedCrewSize: 5,
      estimatedCrew: 5,
      crewReasons: [
        '5 workers required for complete on-ground banquet sweep within 3-hour turnaround',
        'Dual-stream loading: organic food waste separated from packaging crates',
      ],
      recommendedVehicle: 'Mini Truck',
      vehicleReasons: [
        'Mini Truck payload (~1,500 kg) matches expected catering generation',
        'Direct transfer to regional organic processing facility',
      ],
      estimatedDuration: '3–4 hours',
      estimatedDurationHours: 3.5,
      confidence: 0.92,
      recoverableMaterials: [
        'Compostable Food & Organic Waste',
        'PET Beverage Bottles',
        'Corrugated Cardboard Packaging',
      ],
      recoveryOpportunity: 'High (~75% Potential Recovery)',
      recoveryNotes: 'Separation of food scraps from packaging enables direct delivery to bio-methanation and paper recyclers.',
      recoveryPathway: 'Potential recovery / recycling pathway: Segregated on-site loading facilitates direct routing to authorized dry waste sorting and composting streams.',
      disclaimer: 'Illustrative prototype resource plan — Final crew and vehicle allocation validated by municipal dispatcher.',
    },
    commercialQuote: {
      baseService: 1500,
      crewCost: 3500,
      vehicleCost: 1600,
      transportCost: 450,
      disposalCost: 450,
      additionalTripCost: 0,
      segregationCost: 350,
      windowAdjustmentCost: 0,
      indicativeTotal: 8400,
      totalQuote: 8400,
      scaleMultiplier: 1.45,
      currency: 'INR',
      currencySymbol: '₹',
      rateCardVersion: '1.1',
      disclaimer: 'Illustrative prototype estimate — Final price confirmed upon site inspection and locked prior to dispatch.',
      lineItems: [
        { code: 'BASE_SERVICE', label: 'Base Service Mobilization', amount: 1500, detail: 'Operational dispatch, planning & supervisory coordination' },
        { code: 'CREW_ALLOCATION', label: 'Field Crew Allocation (5 Personnel × ~3.5 hrs)', amount: 3500, detail: 'Standard field workforce tariff @ ₹200/hr per operative' },
        { code: 'VEHICLE_LOGISTICS', label: 'Dedicated Fleet Unit (Mini Truck)', amount: 1600, detail: 'Assigned collection vehicle shift operational tariff' },
        { code: 'TRANSPORT_LOGISTICS', label: 'Transport / Logistics (EM Bypass / Ruby / Gariahat)', amount: 450, detail: 'Operating zone transit and depot routing allowance' },
        { code: 'DISPOSAL_ALLOWANCE', label: 'Disposal & Processing Trip Allowance', amount: 450, detail: 'Standard Kolkata authorized recovery & transfer point allowance' },
        { code: 'SEGREGATION_HANDLING', label: 'Segregation & Multi-Stream Handling (3 Material Types)', amount: 350, detail: 'Multi-stream containment and separate loading handling' },
      ],
      status: 'generated',
      generatedAt: Date.now() - 3600000 * 4,
    },
    priceAdjustment: {
      originalQuote: { indicativeTotal: 8400, totalQuote: 8400 },
      revisedQuote: { indicativeTotal: 8900, totalQuote: 8900 },
      difference: 500,
      reason: 'Site access / stairs / distance from vehicle bay',
      reasonKey: 'site_access',
      operatorNote: 'Lawn service bay requires 60m manual hauling from North perimeter gate; added secondary handling allowance.',
      status: 'pending_customer_approval',
      requestedBy: {
        uid: 'operator-kol-01',
        name: 'S. Banerjee (Operations Desk, Zone B)',
        requestedAt: Date.now() - 3600000 * 1,
      },
    },
    customerApproval: {
      status: 'pending_revision_approval',
      indicativeQuote: 8400,
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
    businessDetails: {
      establishmentType: 'exhibition_fair',
      establishmentLabel: 'Exhibition / Trade Fair',
      serviceFrequency: 'one_time',
      serviceFrequencyLabel: 'One-time Collection',
      operatingZone: 'zone_c',
      operatingZoneLabel: 'Zone C — Salt Lake / Sector V / New Town',
      venueName: 'Biswa Bangla Mela Prangan, Hall A',
      address: 'JBS Haldane Avenue, near Science City, Kolkata',
      siteInstructions: 'Freight Bay B via Gate 4. Security clearance badge required at checkpoint. Forklift clearance available.',
      eventDate: '2026-10-02',
      serviceWindow: 'immediate',
      serviceWindowLabel: 'Immediate Post-Event (within 4 hours)',
      estimatedPeople: 2500,
      estimatedWasteScale: 'very_large',
      scaleLabel: 'Very Large Scale (> 1,500 kg / > 1,500 people)',
      wasteTypes: ['plastic', 'paper', 'mixed'],
      wasteTypeLabels: ['Plastic Packaging & Bottles', 'Paper & Corrugated Cardboard', 'Mixed Solid Waste'],
      location: { lat: 22.542, lng: 88.398 },
    },
    venueName: 'Biswa Bangla Mela Prangan, Hall A, Kolkata',
    gps: { lat: 22.542, lng: 88.398 },
    imageBase64: getDemoImageForWasteType('plastic_waste'),
    comment: 'Biswa Bangla Mela Prangan — Exhibition / Trade Fair (Immediate Post-Event Turnaround)',
    status: 'assigned',
    commercialStatus: 'assigned',
    priorityScore: 78,
    priorityReasons: [
      'Commercial Bulk Service Request',
      'Exhibition / Trade Fair (2,500 footfall)',
      'Kolkata Zone C — Salt Lake / Science City',
      'Immediate Post-Event Turnaround Priority',
    ],
    urgentEscalation: false,
    aiResult: {
      wasteType: 'plastic_waste',
      volumeEstimate: 'very_large',
      confidence: 0.94,
      locationSensitivityHint: 'none',
      reasoning: 'Very large exhibition accumulation with high proportion of recyclable LDPE film and cardboard cartons.',
    },
    commercialAssessment: {
      wasteProfile: 'High density packaging materials, booth promotional flyers and exhibition setup debris',
      recommendedCrewSize: 8,
      estimatedCrew: 8,
      crewReasons: [
        'Exhibition teardown with 2,500+ attendees requires heavy manual sorting and expedited clearance',
        '8 workers split into parallel packaging baling and aisle clearing groups',
      ],
      recommendedVehicle: 'Mini Truck',
      vehicleReasons: [
        'High tonnage requires heavy-duty mini truck with dual trip allowance',
        'Compactor unit recommended for bulky corrugated boxes',
      ],
      estimatedDuration: '4–6 hours',
      estimatedDurationHours: 5,
      confidence: 0.94,
      recoverableMaterials: [
        'Cardboard Boxes & Baled Paper',
        'LDPE Packaging Film',
        'Rigid Plastic Display Stands',
      ],
      recoveryOpportunity: 'Substantial Recovery Opportunity',
      recoveryNotes: 'Pre-sorting booths allows high recovery of clean paper and plastic before compaction.',
      recoveryPathway: 'Potential recovery / recycling pathway: Material sorting and direct handover to regional recycling channels.',
      disclaimer: 'Illustrative prototype resource plan — Final crew and vehicle allocation validated by municipal dispatcher.',
    },
    commercialQuote: {
      baseService: 1500,
      crewCost: 8000,
      vehicleCost: 1600,
      transportCost: 600,
      disposalCost: 450,
      additionalTripCost: 1400,
      segregationCost: 350,
      windowAdjustmentCost: 750,
      indicativeTotal: 17650,
      totalQuote: 17650,
      scaleMultiplier: 1.75,
      currency: 'INR',
      currencySymbol: '₹',
      rateCardVersion: '1.1',
      disclaimer: 'Illustrative prototype estimate — Final price confirmed upon site inspection and locked prior to dispatch.',
      lineItems: [
        { code: 'BASE_SERVICE', label: 'Base Service Mobilization', amount: 1500, detail: 'Operational dispatch, planning & supervisory coordination' },
        { code: 'CREW_ALLOCATION', label: 'Field Crew Allocation (8 Personnel × ~5.0 hrs)', amount: 8000, detail: 'Standard field workforce tariff @ ₹200/hr per operative' },
        { code: 'VEHICLE_LOGISTICS', label: 'Dedicated Fleet Unit (Mini Truck)', amount: 1600, detail: 'Assigned collection vehicle shift operational tariff' },
        { code: 'TRANSPORT_LOGISTICS', label: 'Transport / Logistics (Salt Lake / Sector V / New Town)', amount: 600, detail: 'Operating zone transit and depot routing allowance' },
        { code: 'DISPOSAL_ALLOWANCE', label: 'Disposal & Processing Trip Allowance', amount: 450, detail: 'Standard Kolkata authorized recovery & transfer point allowance' },
        { code: 'ADDITIONAL_TRIP', label: 'Additional Vehicle Trip (1 Extra Trip)', amount: 1400, detail: 'Volume capacity expansion requiring secondary transfer run' },
        { code: 'SEGREGATION_HANDLING', label: 'Segregation & Multi-Stream Handling (3 Material Types)', amount: 350, detail: 'Multi-stream containment and separate loading handling' },
        { code: 'WINDOW_ADJUSTMENT', label: 'Rapid Service Window Surcharge', amount: 750, detail: 'Immediate post-event expedited mobilization priority' },
      ],
      status: 'generated',
      generatedAt: Date.now() - 3600000 * 20,
    },
    customerApproval: {
      status: 'accepted',
      approvedAt: Date.now() - 3600000 * 19,
      lockedPrice: 17650,
      decision: 'accepted_initial',
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
    businessDetails: {
      establishmentType: 'campus_facility',
      establishmentLabel: 'School / College / Campus',
      serviceFrequency: 'recurring',
      serviceFrequencyLabel: 'Recurring / Regular Collection',
      operatingZone: 'zone_a',
      operatingZoneLabel: 'Zone A — Central Kolkata / BBD Bagh / Park St',
      venueName: 'Guru Nanak Institute Campus Grounds',
      address: '157/F Nilgunj Road, Panihati, Sodepur, Kolkata',
      siteInstructions: 'Main Campus Gate 1, drive directly to rear auditorium quadrangle. Service lift access available.',
      eventDate: '2026-09-24',
      serviceWindow: 'afternoon',
      serviceWindowLabel: 'Afternoon Window (11:00 – 16:00)',
      estimatedPeople: 600,
      estimatedWasteScale: 'medium',
      scaleLabel: 'Medium Scale (200–500 kg / ~250–600 people)',
      wasteTypes: ['food', 'plastic'],
      wasteTypeLabels: ['Food & Organic Waste', 'Plastic Packaging & Bottles'],
      location: { lat: 22.701, lng: 88.384 },
    },
    venueName: 'Guru Nanak Institute Campus Grounds, Sodepur, Kolkata',
    gps: { lat: 22.701, lng: 88.384 },
    imageBase64: getDemoImageForWasteType('organic_waste'),
    comment: 'Guru Nanak Institute Campus — School / College / Campus (Recurring Scheduled Collection)',
    status: 'resolved',
    commercialStatus: 'resolved',
    priorityScore: 65,
    priorityReasons: [
      'Commercial Bulk Service Request',
      'Campus Facility (600 students/faculty)',
      'Kolkata Operating Zone A',
      'Recurring Scheduled Servicing',
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
      wasteProfile: 'Organized cafeteria and festival food waste with compostable paper plates',
      recommendedCrewSize: 3,
      estimatedCrew: 3,
      crewReasons: [
        'Moderate campus footprint of 600 people, organized bins allow 3 workers to finish within 2.5 hours',
        'Direct loading onto collection van from campus ground quadrangle',
      ],
      recommendedVehicle: 'Collection Van',
      vehicleReasons: [
        'Collection van fits narrow campus quadrangle paths without damaging walkways',
        'Adequate payload capacity for ~400 kg organic waste',
      ],
      estimatedDuration: '2–3 hours',
      estimatedDurationHours: 2.5,
      confidence: 0.89,
      recoverableMaterials: [
        'Organic Food Waste & Leftovers',
        'Compostable Paper Plates & Cups',
      ],
      recoveryOpportunity: 'High Recovery Opportunity',
      recoveryNotes: 'Source segregation maintained by student volunteer monitors.',
      recoveryPathway: 'Potential recovery / recycling pathway: Segregated on-site loading facilitates direct routing to authorized composting streams.',
      disclaimer: 'Illustrative prototype resource plan — Final crew and vehicle allocation validated by municipal dispatcher.',
    },
    commercialQuote: {
      baseService: 1500,
      crewCost: 1500,
      vehicleCost: 1200,
      transportCost: 350,
      disposalCost: 450,
      additionalTripCost: 0,
      segregationCost: 0,
      windowAdjustmentCost: 0,
      indicativeTotal: 5000,
      totalQuote: 5000,
      scaleMultiplier: 1.15,
      currency: 'INR',
      currencySymbol: '₹',
      rateCardVersion: '1.1',
      disclaimer: 'Illustrative prototype estimate — Final price confirmed upon site inspection and locked prior to dispatch.',
      lineItems: [
        { code: 'BASE_SERVICE', label: 'Base Service Mobilization', amount: 1500, detail: 'Operational dispatch, planning & supervisory coordination' },
        { code: 'CREW_ALLOCATION', label: 'Field Crew Allocation (3 Personnel × ~2.5 hrs)', amount: 1500, detail: 'Standard field workforce tariff @ ₹200/hr per operative' },
        { code: 'VEHICLE_LOGISTICS', label: 'Dedicated Fleet Unit (Collection Van)', amount: 1200, detail: 'Assigned collection vehicle shift operational tariff' },
        { code: 'TRANSPORT_LOGISTICS', label: 'Transport / Logistics (Central Kolkata Zone)', amount: 350, detail: 'Operating zone transit and depot routing allowance' },
        { code: 'DISPOSAL_ALLOWANCE', label: 'Disposal & Processing Trip Allowance', amount: 450, detail: 'Standard Kolkata authorized recovery & transfer point allowance' },
      ],
      status: 'generated',
      generatedAt: Date.now() - 3600000 * 30,
    },
    priceLock: {
      isLocked: true,
      lockedAmount: 5000,
      lockedAt: Date.now() - 3600000 * 28,
      lockedBy: {
        uid: 'operator-kol-01',
        name: 'S. Banerjee (Operations Desk)',
      },
    },
    customerApproval: {
      status: 'accepted',
      approvedAt: Date.now() - 3600000 * 29,
      lockedPrice: 5000,
      priceLocked: true,
      decision: 'accepted_initial',
    },
    timestamp: Date.now() - 3600000 * 32,
    assignedTeam: 'team-manual-a',
    assignedVehicle: 'Collection Van',
    assignedAt: Date.now() - 3600000 * 28,
    workStartedAt: Date.now() - 3600000 * 10,
    completedAt: Date.now() - 3600000 * 2,
    resolvedAt: Date.now() - 3600000 * 1,
    verifiedBy: {
      uid: 'operator-kol-01',
      name: 'S. Banerjee (Municipal Verification Officer)',
      verifiedAt: Date.now() - 3600000 * 1,
    },
    completionEvidence: {
      afterImageBase64: getDemoImageForWasteType('overflowing_bin'),
      completionNote: 'Full campus quadrangle swept clean. All food stall waste packed into biodegradable bags and loaded onto collection van.',
      completedByUid: 'supervisor-field-01',
      completedByName: 'Rajesh Mondal (Supervisor Zone A)',
      completedAt: Date.now() - 3600000 * 2,
    },
    dispatchDecisionType: 'accepted_ai',
  },
];

async function main() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  SwachhLens — Commercial Services Demo Seeder (Kolkata)');
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
      console.log(`  [UPDATE] ${record.id} — ${record.serviceNumber} | ${record.businessDetails.venueName} (Status: ${record.status})`);
    } else {
      toCreate++;
      console.log(`  [CREATE] ${record.id} — ${record.serviceNumber} | ${record.businessDetails.venueName} (Status: ${record.status})`);
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
