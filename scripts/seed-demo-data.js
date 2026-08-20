/**
 * SwachhLens — Final Demo Data Seeding Script
 *
 * Populates Firestore with realistic fictional demo citizens and complaints
 * centered around Kolkata urban locations for hackathon presentation.
 *
 * ⚠️ IMPORTANT: These are fictional hackathon demo records.
 * - Does NOT delete existing records.
 * - Does NOT overwrite real user complaints or existing teams.
 * - Is safe to run multiple times (skips existing demo IDs).
 *
 * Usage:
 *   node scripts/seed-demo-data.js
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
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

import { getRealPhotoForCategory } from './load-real-photos.js';

// ── 1. Fictional Demo Citizens (10 records) ──────────────────────
const DEMO_CITIZENS = [
  {
    id: 'demo-citizen-01',
    name: 'Aarav Sen',
    phone: '+91 90000 00001',
    email: 'demo.aarav@example.com',
    area: 'Salt Lake Sector V',
    ward: 'Ward 29',
  },
  {
    id: 'demo-citizen-02',
    name: 'Priya Banerjee',
    phone: '+91 90000 00002',
    email: 'demo.priya@example.com',
    area: 'New Town Action Area I',
    ward: 'Ward 12',
  },
  {
    id: 'demo-citizen-03',
    name: 'Rahul Mukherjee',
    phone: '+91 90000 00003',
    email: 'demo.rahul@example.com',
    area: 'Ballygunge Circular Road',
    ward: 'Ward 68',
  },
  {
    id: 'demo-citizen-04',
    name: 'Sneha Roy',
    phone: '+91 90000 00004',
    email: 'demo.sneha@example.com',
    area: 'Esplanade / Dharmatala',
    ward: 'Ward 45',
  },
  {
    id: 'demo-citizen-05',
    name: 'Anirban Das',
    phone: '+91 90000 00005',
    email: 'demo.anirban@example.com',
    area: 'Howrah Station Approach',
    ward: 'Ward 18',
  },
  {
    id: 'demo-citizen-06',
    name: 'Riya Ghosh',
    phone: '+91 90000 00006',
    email: 'demo.riya@example.com',
    area: 'Park Circus 7-Point',
    ward: 'Ward 60',
  },
  {
    id: 'demo-citizen-07',
    name: 'Subhashis Bose',
    phone: '+91 90000 00007',
    email: 'demo.subhashis@example.com',
    area: 'Behala Chowrasta',
    ward: 'Ward 118',
  },
  {
    id: 'demo-citizen-08',
    name: 'Debolina Dutta',
    phone: '+91 90000 00008',
    email: 'demo.debolina@example.com',
    area: 'Garia Main Road',
    ward: 'Ward 110',
  },
  {
    id: 'demo-citizen-09',
    name: 'Tanmoy Chatterjee',
    phone: '+91 90000 00009',
    email: 'demo.tanmoy@example.com',
    area: 'Dumdum Junction',
    ward: 'Ward 04',
  },
  {
    id: 'demo-citizen-10',
    name: 'Puja Ganguly',
    phone: '+91 90000 00010',
    email: 'demo.puja@example.com',
    area: 'Sealdah Flyover East',
    ward: 'Ward 49',
  },
];

// Current epoch ms reference
const NOW = Date.now();
const HOUR = 3600 * 1000;

// ── 2. Fictional Demo Complaints (22 records) ────────────────────
const DEMO_COMPLAINTS = [
  // 1. Critical / Hazardous Waste (Salt Lake near hospital)
  {
    id: 'demo-complaint-01',
    complaintNumber: 'SWL-26-81042-HAZ1',
    citizenId: 'demo-citizen-01',
    citizenName: 'Aarav Sen',
    citizenPhone: '+91 90000 00001',
    gps: { lat: 22.5804, lng: 88.4378 }, // Salt Lake
    comment: 'Discarded clinical chemicals and containers spotted near health center footpath.',
    hoursAgo: 4,
    status: 'assigned',
    urgentEscalation: true,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'hazardous_waste',
      volumeEstimate: 'medium',
      confidence: 0.89,
      locationSensitivityHint: 'near_hospital',
      reasoning: 'Chemical bottles and medical containers identified in proximity to a public hospital area.',
    },
    priorityScore: 78,
    priorityReasons: [
      'Hazardous waste material',
      'Near Hospital / Healthcare facility',
      'Medium waste volume',
    ],
    recommendedIntervention: {
      recommendedAction: 'Immediate hazardous waste containment and safe disposal',
      teamType: 'manual_cleanup',
      vehicle: 'Specialized Hazmat Vehicle',
      workerCount: 6,
      estimatedCleanupTime: '90–180 minutes',
      reasoning: 'Hazardous waste poses direct health risks. Requires specialized PPE and containment unit.',
      urgent: true,
    },
    assignedTeam: 'team-manual-a',
    assignedVehicle: 'Specialized Hazmat Van WB-01-HZ-101',
  },

  // 2A. Drain Blockage (Sealdah Station Approach)
  {
    id: 'demo-complaint-02',
    complaintNumber: 'SWL-26-72419-DRN1',
    citizenId: 'demo-citizen-10',
    citizenName: 'Puja Ganguly',
    citizenPhone: '+91 90000 00010',
    gps: { lat: 22.5675, lng: 88.3712 }, // Sealdah East
    comment: 'Heavy muck and plastic accumulation clogging the roadside storm drain.',
    hoursAgo: 8,
    status: 'in_progress',
    urgentEscalation: true,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'drain_blockage',
      volumeEstimate: 'large',
      confidence: 0.87,
      locationSensitivityHint: 'main_road',
      reasoning: 'Stormwater drain obstructed with dense silt, packaging plastic, and organic matter.',
    },
    priorityScore: 84,
    priorityReasons: [
      'Drain Blockage',
      'Large waste volume',
      'Main Thoroughfare / Transit Road',
      'Unresolved for 8 hours',
    ],
    recommendedIntervention: {
      recommendedAction: 'Urgent drainage clearance to prevent flooding and waterborne disease',
      teamType: 'mini_truck',
      vehicle: 'Suction/Jetting Vehicle',
      workerCount: 4,
      estimatedCleanupTime: '60–120 minutes',
      reasoning: 'Blocked drainage causes water stagnation. High-pressure jetting equipment required.',
      urgent: true,
    },
    assignedTeam: 'team-truck-1',
    assignedVehicle: 'Suction Jetting Truck WB-02-SJ-204',
  },

  // 2B. Duplicate of 2A (Drain Blockage near Sealdah)
  {
    id: 'demo-complaint-03',
    complaintNumber: 'SWL-26-72420-DRN2',
    citizenId: 'demo-citizen-04',
    citizenName: 'Sneha Roy',
    citizenPhone: '+91 90000 00004',
    gps: { lat: 22.5676, lng: 88.3714 }, // Very close to 2A
    comment: 'Drain is overflowing onto the road outside Sealdah east gate.',
    hoursAgo: 7,
    status: 'assigned',
    urgentEscalation: true,
    isDuplicateOf: 'demo-complaint-02',
    aiResult: {
      wasteType: 'drain_blockage',
      volumeEstimate: 'large',
      confidence: 0.88,
      locationSensitivityHint: 'main_road',
      reasoning: 'Blocked sewer channel causing surface water accumulation on main roadway.',
    },
    priorityScore: 84,
    priorityReasons: [
      'Drain Blockage',
      'Large waste volume',
      'Linked duplicate incident cluster',
    ],
    recommendedIntervention: {
      recommendedAction: 'Urgent drainage clearance to prevent flooding',
      teamType: 'mini_truck',
      vehicle: 'Suction/Jetting Vehicle',
      workerCount: 4,
      estimatedCleanupTime: '60–120 minutes',
      reasoning: 'Duplicate incident linked to parent dispatch #SWL-26-72419-DRN1.',
      urgent: true,
    },
    assignedTeam: 'team-truck-1',
    assignedVehicle: 'Suction Jetting Truck WB-02-SJ-204',
  },

  // 4. Large Garbage Dump (Park Circus 7-point)
  {
    id: 'demo-complaint-04',
    complaintNumber: 'SWL-26-64102-GBG1',
    citizenId: 'demo-citizen-06',
    citizenName: 'Riya Ghosh',
    citizenPhone: '+91 90000 00006',
    gps: { lat: 22.5414, lng: 88.3688 }, // Park Circus
    comment: 'Massive open garbage dump beside the busy intersection market.',
    hoursAgo: 14,
    status: 'in_progress',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'garbage_dump',
      volumeEstimate: 'very_large',
      confidence: 0.94,
      locationSensitivityHint: 'near_market',
      reasoning: 'Substantial mixed municipal solid waste heap exceeding manual removal capacity.',
    },
    priorityScore: 76,
    priorityReasons: [
      'Very large waste volume',
      'Near Commercial Market / Food Stalls',
      'Unresolved for 14 hours',
    ],
    recommendedIntervention: {
      recommendedAction: 'Large-scale waste clearance using vehicle-assisted collection',
      teamType: 'mini_truck',
      vehicle: 'Mini Truck',
      workerCount: 5,
      estimatedCleanupTime: '90–180 minutes',
      reasoning: 'Very large waste accumulation requires full vehicle crew and mechanical loader.',
      urgent: false,
    },
    assignedTeam: 'team-truck-1',
    assignedVehicle: 'Mini Truck WB-02-TR-205',
  },

  // 5A. Overflowing Bin (Salt Lake Sector V)
  {
    id: 'demo-complaint-05',
    complaintNumber: 'SWL-26-51980-BIN1',
    citizenId: 'demo-citizen-01',
    citizenName: 'Aarav Sen',
    citizenPhone: '+91 90000 00001',
    gps: { lat: 22.5815, lng: 88.4350 },
    comment: 'Green communal dustbin spilling over onto tech park pathway.',
    hoursAgo: 6,
    status: 'verified',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'overflowing_bin',
      volumeEstimate: 'medium',
      confidence: 0.92,
      locationSensitivityHint: 'standard',
      reasoning: 'Communal waste receptacle at maximum capacity with perimeter spill.',
    },
    priorityScore: 42,
    priorityReasons: ['Medium waste volume', 'Overflowing Bin Container'],
    recommendedIntervention: {
      recommendedAction: 'Bin emptying and area cleanup on scheduled route',
      teamType: 'manual_cleanup',
      vehicle: 'Garbage Collection Vehicle',
      workerCount: 2,
      estimatedCleanupTime: '15–30 minutes',
      reasoning: 'Standard collection route crew with garbage compactor vehicle.',
      urgent: false,
    },
    assignedTeam: null,
    assignedVehicle: null,
  },

  // 5B. Duplicate of 5A (Salt Lake Sector V Bin)
  {
    id: 'demo-complaint-06',
    complaintNumber: 'SWL-26-51981-BIN2',
    citizenId: 'demo-citizen-02',
    citizenName: 'Priya Banerjee',
    citizenPhone: '+91 90000 00002',
    gps: { lat: 22.5816, lng: 88.4351 },
    comment: 'Litter around the green bin near Sector V metro.',
    hoursAgo: 5,
    status: 'verified',
    urgentEscalation: false,
    isDuplicateOf: 'demo-complaint-05',
    aiResult: {
      wasteType: 'overflowing_bin',
      volumeEstimate: 'medium',
      confidence: 0.91,
      locationSensitivityHint: 'standard',
      reasoning: 'Overflowing bin duplicate report at identical transit stop location.',
    },
    priorityScore: 42,
    priorityReasons: ['Medium waste volume', 'Linked duplicate incident cluster'],
    recommendedIntervention: {
      recommendedAction: 'Bin emptying on route',
      teamType: 'manual_cleanup',
      vehicle: 'Garbage Collection Vehicle',
      workerCount: 2,
      estimatedCleanupTime: '15–30 minutes',
      reasoning: 'Duplicate of #SWL-26-51980-BIN1.',
      urgent: false,
    },
    assignedTeam: null,
    assignedVehicle: null,
  },

  // 7. E-Waste Recycling (New Town Action Area I)
  {
    id: 'demo-complaint-07',
    complaintNumber: 'SWL-26-43180-EWT1',
    citizenId: 'demo-citizen-02',
    citizenName: 'Priya Banerjee',
    citizenPhone: '+91 90000 00002',
    gps: { lat: 22.5867, lng: 88.4554 },
    comment: 'Piles of broken monitors, CPU casings, and wires left on the pavement.',
    hoursAgo: 10,
    status: 'assigned',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'e_waste',
      volumeEstimate: 'medium',
      confidence: 0.93,
      locationSensitivityHint: 'standard',
      reasoning: 'Electronic components, cathode units, and electrical cords requiring specialized e-waste recovery.',
    },
    priorityScore: 54,
    priorityReasons: [
      'Electronic Waste (E-Waste)',
      'Medium waste volume',
      'Toxic heavy metal mitigation',
    ],
    recommendedIntervention: {
      recommendedAction: 'E-waste collection and safe transfer to certified recycling facility',
      teamType: 'recycling_partner',
      vehicle: 'Recycling Collection Vehicle',
      workerCount: 2,
      estimatedCleanupTime: '30–60 minutes',
      reasoning: 'E-waste contains hazardous metals (lead/cadmium). Route to certified recycler GreenCycle.',
      urgent: false,
    },
    assignedTeam: 'team-recycle-gc',
    assignedVehicle: 'Recycling Van WB-03-RC-308',
  },

  // 8. E-Waste near School (Ballygunge) — Urgent
  {
    id: 'demo-complaint-08',
    complaintNumber: 'SWL-26-43181-EWT2',
    citizenId: 'demo-citizen-03',
    citizenName: 'Rahul Mukherjee',
    citizenPhone: '+91 90000 00003',
    gps: { lat: 22.5280, lng: 88.3655 },
    comment: 'Broken CRT monitors and mercury tubes dumped outside secondary school gate.',
    hoursAgo: 3,
    status: 'reported',
    urgentEscalation: true,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'e_waste',
      volumeEstimate: 'small',
      confidence: 0.95,
      locationSensitivityHint: 'near_school',
      reasoning: 'Exposed glass tubes and electronic circuit boards located directly adjacent to a primary school.',
    },
    priorityScore: 72,
    priorityReasons: [
      'Near School / Child Care Area',
      'Electronic Waste (E-Waste)',
      'Immediate child safety hazard',
    ],
    recommendedIntervention: {
      recommendedAction: 'Priority e-waste collection — sensitive school perimeter',
      teamType: 'recycling_partner',
      vehicle: 'Recycling Collection Vehicle',
      workerCount: 2,
      estimatedCleanupTime: '30–60 minutes',
      reasoning: 'Sensitive location near school requires rapid recovery of toxic glass & mercury components.',
      urgent: true,
    },
    assignedTeam: null,
    assignedVehicle: null,
  },

  // 9A. Plastic Waste (Esplanade / New Market)
  {
    id: 'demo-complaint-09',
    complaintNumber: 'SWL-26-38290-PLS1',
    citizenId: 'demo-citizen-04',
    citizenName: 'Sneha Roy',
    citizenPhone: '+91 90000 00004',
    gps: { lat: 22.5645, lng: 88.3522 },
    comment: 'Huge pile of discarded single-use plastic cups and packaging sacks.',
    hoursAgo: 16,
    status: 'assigned',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'plastic_waste',
      volumeEstimate: 'large',
      confidence: 0.91,
      locationSensitivityHint: 'near_market',
      reasoning: 'High-density polyethylene bags and beverage plastics suitable for recycling baling.',
    },
    priorityScore: 68,
    priorityReasons: [
      'Plastic Waste Materials',
      'Large waste volume',
      'Near Commercial Market / Food Stalls',
      'Unresolved for 16 hours',
    ],
    recommendedIntervention: {
      recommendedAction: 'Plastic waste collection and sorting for recycling recovery',
      teamType: 'recycling_partner',
      vehicle: 'Mini Truck',
      workerCount: 3,
      estimatedCleanupTime: '45–90 minutes',
      reasoning: 'Large plastic accumulation should be diverted to recycling partner for baling recovery.',
      urgent: false,
    },
    assignedTeam: 'team-recycle-gc',
    assignedVehicle: 'Recycling Mini Truck WB-03-RC-309',
  },

  // 9B. Duplicate of 9A (Plastic Waste at Esplanade)
  {
    id: 'demo-complaint-10',
    complaintNumber: 'SWL-26-38291-PLS2',
    citizenId: 'demo-citizen-05',
    citizenName: 'Anirban Das',
    citizenPhone: '+91 90000 00005',
    gps: { lat: 22.5646, lng: 88.3523 },
    comment: 'Plastics blowing across the street near market corner.',
    hoursAgo: 15,
    status: 'reported',
    urgentEscalation: false,
    isDuplicateOf: 'demo-complaint-09',
    aiResult: {
      wasteType: 'plastic_waste',
      volumeEstimate: 'large',
      confidence: 0.89,
      locationSensitivityHint: 'near_market',
      reasoning: 'Plastic packaging waste heap duplicate adjacent to Esplanade market.',
    },
    priorityScore: 68,
    priorityReasons: ['Large waste volume', 'Linked duplicate incident cluster'],
    recommendedIntervention: {
      recommendedAction: 'Plastic collection for recycling recovery',
      teamType: 'recycling_partner',
      vehicle: 'Mini Truck',
      workerCount: 3,
      estimatedCleanupTime: '45–90 minutes',
      reasoning: 'Duplicate of #SWL-26-38290-PLS1.',
      urgent: false,
    },
    assignedTeam: null,
    assignedVehicle: null,
  },

  // 11. Plastic Waste (Dumdum)
  {
    id: 'demo-complaint-11',
    complaintNumber: 'SWL-26-38292-PLS3',
    citizenId: 'demo-citizen-09',
    citizenName: 'Tanmoy Chatterjee',
    citizenPhone: '+91 90000 00009',
    gps: { lat: 22.6215, lng: 88.4012 },
    comment: 'Plastic water bottles and snack bags scattered across park fencing.',
    hoursAgo: 2,
    status: 'reported',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'plastic_waste',
      volumeEstimate: 'small',
      confidence: 0.93,
      locationSensitivityHint: 'standard',
      reasoning: 'Scattered PET bottles and thin plastic film packaging along perimeter.',
    },
    priorityScore: 32,
    priorityReasons: ['Small waste volume', 'Plastic Waste Materials'],
    recommendedIntervention: {
      recommendedAction: 'Plastic waste collection and sorting for recycling recovery',
      teamType: 'recycling_partner',
      vehicle: 'Collection Van',
      workerCount: 2,
      estimatedCleanupTime: '20–45 minutes',
      reasoning: 'Light plastic litter can be cleared by van crew for segregation.',
      urgent: false,
    },
    assignedTeam: null,
    assignedVehicle: null,
  },

  // 12. Construction Debris (Howrah Approach)
  {
    id: 'demo-complaint-12',
    complaintNumber: 'SWL-26-29104-DEB1',
    citizenId: 'demo-citizen-05',
    citizenName: 'Anirban Das',
    citizenPhone: '+91 90000 00005',
    gps: { lat: 22.5855, lng: 88.3426 },
    comment: 'Bricks, cement bags, and plaster rubble dumped by road contractor.',
    hoursAgo: 18,
    status: 'in_progress',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'construction_debris',
      volumeEstimate: 'large',
      confidence: 0.94,
      locationSensitivityHint: 'main_road',
      reasoning: 'Heavy masonry rubble and concrete fragments blocking lane edge.',
    },
    priorityScore: 66,
    priorityReasons: [
      'Construction Debris / Heavy Rubble',
      'Large waste volume',
      'Main Thoroughfare / Transit Road',
      'Unresolved for 18 hours',
    ],
    recommendedIntervention: {
      recommendedAction: 'Construction debris removal — requires loading equipment',
      teamType: 'mini_truck',
      vehicle: 'Mini Truck',
      workerCount: 3,
      estimatedCleanupTime: '60–120 minutes',
      reasoning: 'Heavy rubble cannot be manually carried. Requires truck with loaders.',
      urgent: false,
    },
    assignedTeam: 'team-manual-b',
    assignedVehicle: 'Mini Truck WB-04-TR-402',
  },

  // 13. Construction Debris (Behala)
  {
    id: 'demo-complaint-13',
    complaintNumber: 'SWL-26-29105-DEB2',
    citizenId: 'demo-citizen-07',
    citizenName: 'Subhashis Bose',
    citizenPhone: '+91 90000 00007',
    gps: { lat: 22.4988, lng: 88.3182 },
    comment: 'Demolition concrete and tiles left on residential street footpath.',
    hoursAgo: 4,
    status: 'verified',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'construction_debris',
      volumeEstimate: 'medium',
      confidence: 0.92,
      locationSensitivityHint: 'standard',
      reasoning: 'Fragmented tiles and concrete blocks occupying pedestrian walkway.',
    },
    priorityScore: 48,
    priorityReasons: ['Construction Debris / Heavy Rubble', 'Medium waste volume'],
    recommendedIntervention: {
      recommendedAction: 'Construction debris removal — requires loading equipment',
      teamType: 'mini_truck',
      vehicle: 'Mini Truck',
      workerCount: 3,
      estimatedCleanupTime: '60–120 minutes',
      reasoning: 'Heavy masonry fragments require truck with loading crew.',
      urgent: false,
    },
    assignedTeam: null,
    assignedVehicle: null,
  },

  // 14. Construction Debris (Garia)
  {
    id: 'demo-complaint-14',
    complaintNumber: 'SWL-26-29106-DEB3',
    citizenId: 'demo-citizen-08',
    citizenName: 'Debolina Dutta',
    citizenPhone: '+91 90000 00008',
    gps: { lat: 22.4640, lng: 88.3832 },
    comment: 'Excavated soil and road gravel left uncollected after pipe repair.',
    hoursAgo: 1,
    status: 'reported',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'construction_debris',
      volumeEstimate: 'small',
      confidence: 0.88,
      locationSensitivityHint: 'standard',
      reasoning: 'Loose gravel and earth mound beside curb.',
    },
    priorityScore: 28,
    priorityReasons: ['Small waste volume', 'Construction Debris'],
    recommendedIntervention: {
      recommendedAction: 'Construction debris removal',
      teamType: 'mini_truck',
      vehicle: 'Mini Truck',
      workerCount: 3,
      estimatedCleanupTime: '60–120 minutes',
      reasoning: 'Standard debris clearance during scheduled ward round.',
      urgent: false,
    },
    assignedTeam: null,
    assignedVehicle: null,
  },

  // 15. Garbage Dump (Shyambazar Five-Point)
  {
    id: 'demo-complaint-15',
    complaintNumber: 'SWL-26-17290-GBG2',
    citizenId: 'demo-citizen-09',
    citizenName: 'Tanmoy Chatterjee',
    citizenPhone: '+91 90000 00009',
    gps: { lat: 22.6001, lng: 88.3710 },
    comment: 'Open food packaging, vegetable waste, and cartons beside bus terminus.',
    hoursAgo: 9,
    status: 'verified',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'garbage_dump',
      volumeEstimate: 'medium',
      confidence: 0.93,
      locationSensitivityHint: 'main_road',
      reasoning: 'Mixed wet/dry refuse pile on roadside verge near commercial bus transit.',
    },
    priorityScore: 56,
    priorityReasons: [
      'Garbage Dump Accumulation',
      'Medium waste volume',
      'Main Thoroughfare / Transit Road',
    ],
    recommendedIntervention: {
      recommendedAction: 'Standard manual waste collection',
      teamType: 'manual_cleanup',
      vehicle: 'Collection Van',
      workerCount: 2,
      estimatedCleanupTime: '20–40 minutes',
      reasoning: 'Manual sweeping crew with van can clear this accumulation.',
      urgent: false,
    },
    assignedTeam: null,
    assignedVehicle: null,
  },

  // 16. Garbage Dump (College Street / Boipara)
  {
    id: 'demo-complaint-16',
    complaintNumber: 'SWL-26-17291-GBG3',
    citizenId: 'demo-citizen-04',
    citizenName: 'Sneha Roy',
    citizenPhone: '+91 90000 00004',
    gps: { lat: 22.5744, lng: 88.3639 },
    comment: 'Paper cartons, tea cups, and wet waste dumped in university lane.',
    hoursAgo: 2,
    status: 'reported',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'garbage_dump',
      volumeEstimate: 'medium',
      confidence: 0.90,
      locationSensitivityHint: 'near_school', // College/University area
      reasoning: 'Mixed paper and food refuse accumulated adjacent to educational institutions.',
    },
    priorityScore: 62,
    priorityReasons: [
      'Near School / Educational Campus',
      'Medium waste volume',
      'Garbage Dump Accumulation',
    ],
    recommendedIntervention: {
      recommendedAction: 'Rapid manual cleanup — sensitive educational zone',
      teamType: 'manual_cleanup',
      vehicle: 'Collection Van',
      workerCount: 3,
      estimatedCleanupTime: '20–45 minutes',
      reasoning: 'University precinct requires clean pedestrian access.',
      urgent: true,
    },
    assignedTeam: null,
    assignedVehicle: null,
  },

  // 17. Garbage Dump (Jadavpur 8B)
  {
    id: 'demo-complaint-17',
    complaintNumber: 'SWL-26-17292-GBG4',
    citizenId: 'demo-citizen-08',
    citizenName: 'Debolina Dutta',
    citizenPhone: '+91 90000 00008',
    gps: { lat: 22.4955, lng: 88.3709 },
    comment: 'Waste accumulated around the bus shelter corner.',
    hoursAgo: 5,
    status: 'verified',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'garbage_dump',
      volumeEstimate: 'small',
      confidence: 0.89,
      locationSensitivityHint: 'standard',
      reasoning: 'Small roadside waste pile composed of paper wrappers and plastics.',
    },
    priorityScore: 30,
    priorityReasons: ['Small waste volume', 'Garbage Dump'],
    recommendedIntervention: {
      recommendedAction: 'Standard manual waste collection',
      teamType: 'manual_cleanup',
      vehicle: 'Collection Van',
      workerCount: 1,
      estimatedCleanupTime: '10–20 minutes',
      reasoning: 'Standard manual crew response during ward sweep.',
      urgent: false,
    },
    assignedTeam: null,
    assignedVehicle: null,
  },

  // 18. Overflowing Bin (Ballygunge) — RESOLVED with Feedback
  {
    id: 'demo-complaint-18',
    complaintNumber: 'SWL-26-51982-BIN3',
    citizenId: 'demo-citizen-03',
    citizenName: 'Rahul Mukherjee',
    citizenPhone: '+91 90000 00003',
    gps: { lat: 22.5275, lng: 88.3650 },
    comment: 'Community blue bin full of domestic refuse.',
    hoursAgo: 24,
    status: 'resolved',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'overflowing_bin',
      volumeEstimate: 'medium',
      confidence: 0.95,
      locationSensitivityHint: 'standard',
      reasoning: 'Municipal waste bin overflowing with household refuse sacks.',
    },
    priorityScore: 45,
    priorityReasons: ['Medium waste volume', 'Overflowing Bin Container'],
    recommendedIntervention: {
      recommendedAction: 'Bin emptying and area cleanup',
      teamType: 'manual_cleanup',
      vehicle: 'Garbage Collection Vehicle',
      workerCount: 2,
      estimatedCleanupTime: '15–30 minutes',
      reasoning: 'Standard collection route crew handled bin emptying.',
      urgent: false,
    },
    assignedTeam: 'team-manual-a',
    assignedVehicle: 'Garbage Compactor WB-01-GC-102',
    feedback: {
      result: 'resolved',
      rating: 5,
      comment: 'Bin was cleared and disinfected by noon. Great service!',
      submittedAt: NOW - 12 * HOUR,
    },
  },

  // 19. Garbage Dump (Baguiati VIP Road) — RESOLVED with Feedback
  {
    id: 'demo-complaint-19',
    complaintNumber: 'SWL-26-17293-GBG5',
    citizenId: 'demo-citizen-09',
    citizenName: 'Tanmoy Chatterjee',
    citizenPhone: '+91 90000 00009',
    gps: { lat: 22.6087, lng: 88.4230 },
    comment: 'Large heap of commercial packaging dumped beside pedestrian footbridge.',
    hoursAgo: 30,
    status: 'resolved',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'garbage_dump',
      volumeEstimate: 'large',
      confidence: 0.92,
      locationSensitivityHint: 'main_road',
      reasoning: 'Commercial cardboard, plastic packaging, and mixed solid waste pile.',
    },
    priorityScore: 68,
    priorityReasons: [
      'Large waste volume',
      'Main Thoroughfare / Transit Road',
      'Garbage Dump Accumulation',
    ],
    recommendedIntervention: {
      recommendedAction: 'Vehicle-assisted waste clearance',
      teamType: 'mini_truck',
      vehicle: 'Mini Truck',
      workerCount: 3,
      estimatedCleanupTime: '60–90 minutes',
      reasoning: 'Mini truck unit cleared the commercial refuse completely.',
      urgent: false,
    },
    assignedTeam: 'team-truck-1',
    assignedVehicle: 'Mini Truck WB-02-TR-204',
    feedback: {
      result: 'resolved',
      rating: 4,
      comment: 'Team arrived with truck and cleared the heap within 2 hours. Footpath is clear now.',
      submittedAt: NOW - 18 * HOUR,
    },
  },

  // 20. Construction Debris (Kalighat Temple Rd) — RESOLVED with Partial Feedback
  {
    id: 'demo-complaint-20',
    complaintNumber: 'SWL-26-29107-DEB4',
    citizenId: 'demo-citizen-07',
    citizenName: 'Subhashis Bose',
    citizenPhone: '+91 90000 00007',
    gps: { lat: 22.5208, lng: 88.3458 },
    comment: 'Broken pavement stone slabs left along temple access route.',
    hoursAgo: 28,
    status: 'resolved',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'construction_debris',
      volumeEstimate: 'medium',
      confidence: 0.91,
      locationSensitivityHint: 'near_market',
      reasoning: 'Stone masonry slabs and mortar rubble on temple approach pathway.',
    },
    priorityScore: 52,
    priorityReasons: ['Construction Debris', 'Medium waste volume'],
    recommendedIntervention: {
      recommendedAction: 'Construction debris removal',
      teamType: 'mini_truck',
      vehicle: 'Mini Truck',
      workerCount: 3,
      estimatedCleanupTime: '60–120 minutes',
      reasoning: 'Heavy stone slabs cleared with loading vehicle.',
      urgent: false,
    },
    assignedTeam: 'team-manual-b',
    assignedVehicle: 'Mini Truck WB-04-TR-402',
    feedback: {
      result: 'partial',
      rating: 3,
      comment: 'The large stone slabs were lifted, but smaller stones and sand dust were left on the edge.',
      submittedAt: NOW - 16 * HOUR,
    },
  },

  // 21. Organic / Market Waste (Howrah Fish Market) — RESOLVED with Feedback
  {
    id: 'demo-complaint-21',
    complaintNumber: 'SWL-26-10940-ORG1',
    citizenId: 'demo-citizen-05',
    citizenName: 'Anirban Das',
    citizenPhone: '+91 90000 00005',
    gps: { lat: 22.5860, lng: 88.3418 },
    comment: 'Organic market refuse and rotting vegetable crates near stall row.',
    hoursAgo: 36,
    status: 'resolved',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'organic_waste',
      volumeEstimate: 'large',
      confidence: 0.96,
      locationSensitivityHint: 'near_market',
      reasoning: 'Decomposing organic vegetable matter and leaves causing odor nuisance.',
    },
    priorityScore: 70,
    priorityReasons: [
      'Large waste volume',
      'Near Commercial Market / Food Stalls',
      'Organic Waste (Odor Risk)',
    ],
    recommendedIntervention: {
      recommendedAction: 'Organic waste clearance and sanitation washdown',
      teamType: 'manual_cleanup',
      vehicle: 'Collection Van',
      workerCount: 3,
      estimatedCleanupTime: '30–60 minutes',
      reasoning: 'Organic market waste cleared with bio-sanitizer washdown.',
      urgent: false,
    },
    assignedTeam: 'team-manual-a',
    assignedVehicle: 'Sanitation Van WB-01-SV-105',
    feedback: {
      result: 'resolved',
      rating: 5,
      comment: 'Prompt pickup and bleaching powder was sprinkled. Excellent response!',
      submittedAt: NOW - 20 * HOUR,
    },
  },

  // 22. Organic / Park Leaves (Ballygunge Park) — RESOLVED without Feedback
  {
    id: 'demo-complaint-22',
    complaintNumber: 'SWL-26-10941-ORG2',
    citizenId: 'demo-citizen-03',
    citizenName: 'Rahul Mukherjee',
    citizenPhone: '+91 90000 00003',
    gps: { lat: 22.5290, lng: 88.3660 },
    comment: 'Pruned tree branches and dried leaves piled by children playground.',
    hoursAgo: 40,
    status: 'resolved',
    urgentEscalation: false,
    isDuplicateOf: null,
    aiResult: {
      wasteType: 'organic_waste',
      volumeEstimate: 'medium',
      confidence: 0.94,
      locationSensitivityHint: 'standard',
      reasoning: 'Garden trim foliage and dried organic leaves piled beside pathway.',
    },
    priorityScore: 40,
    priorityReasons: ['Medium waste volume', 'Organic Waste Material'],
    recommendedIntervention: {
      recommendedAction: 'Compostable foliage pickup',
      teamType: 'manual_cleanup',
      vehicle: 'Collection Van',
      workerCount: 2,
      estimatedCleanupTime: '20–40 minutes',
      reasoning: 'Horticulture waste cleared for compost routing.',
      urgent: false,
    },
    assignedTeam: 'team-manual-a',
    assignedVehicle: 'Collection Van WB-01-MC-101',
    feedback: null, // No feedback submitted yet
  },
];

async function seedDemoData() {
  console.log('🌱 SwachhLens — Final Demo Data Seeding Script');
  console.log('==============================================');
  console.log('⚠️  These are fictional hackathon demo records.');
  console.log('   All names, phones, emails, and coordinates are demo-only.\n');

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Sign in anonymously to satisfy Firestore rules
  console.log('🔐 Signing in anonymously...');
  await signInAnonymously(auth);
  console.log('✅ Authenticated successfully.\n');

  // ── 1. Seed Citizens ───────────────────────────────────────────
  console.log('👥 Seeding Fictional Citizens...');
  let citizensCreated = 0;
  let citizensSkipped = 0;

  for (const citizen of DEMO_CITIZENS) {
    const { id, name, phone, email, area, ward } = citizen;
    const docRef = doc(db, 'citizens', id);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      console.log(`   ⏭️  [EXISTS] Citizen: ${name} (${id})`);
      citizensSkipped++;
    } else {
      await setDoc(docRef, {
        name,
        phone,
        email,
        area,
        ward,
        createdAt: NOW - 48 * HOUR,
        updatedAt: NOW,
      });
      console.log(`   ✅ [CREATED] Citizen: ${name} (${area}, ${ward})`);
      citizensCreated++;
    }
  }

  console.log(`\n📊 Citizens: ${citizensCreated} created, ${citizensSkipped} already existed.\n`);

  // ── 2. Seed Complaints ─────────────────────────────────────────
  console.log('🚨 Seeding Fictional Incident Complaints...');
  let complaintsCreated = 0;
  let complaintsSkipped = 0;
  const statusCounts = { reported: 0, verified: 0, assigned: 0, in_progress: 0, resolved: 0 };
  let urgentCount = 0;
  let duplicateCount = 0;
  let feedbackCount = 0;

  for (const c of DEMO_COMPLAINTS) {
    const docRef = doc(db, 'complaints', c.id);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      console.log(`   ⏭️  [EXISTS] Complaint: ${c.complaintNumber} (${c.id})`);
      complaintsSkipped++;
      continue;
    }

    const timestamp = NOW - c.hoursAgo * HOUR;
    const verifiedAt = ['verified', 'assigned', 'in_progress', 'resolved'].includes(c.status)
      ? timestamp + 30 * 60 * 1000
      : null;
    const assignedAt = ['assigned', 'in_progress', 'resolved'].includes(c.status)
      ? (verifiedAt || timestamp) + 40 * 60 * 1000
      : null;
    const inProgressAt = ['in_progress', 'resolved'].includes(c.status)
      ? (assignedAt || timestamp) + 30 * 60 * 1000
      : null;
    const resolvedAt = c.status === 'resolved'
      ? (inProgressAt || timestamp) + 60 * 60 * 1000
      : null;

    const complaintData = {
      complaintNumber: c.complaintNumber,
      citizenId: c.citizenId,
      citizenName: c.citizenName,
      citizenPhone: c.citizenPhone,
      imageBase64: getRealPhotoForCategory(c.aiResult.wasteType, complaintsCreated),
      isDemo: true,
      gps: c.gps,
      timestamp,
      comment: c.comment,
      aiResult: c.aiResult,
      isDuplicateOf: c.isDuplicateOf,
      priorityScore: c.priorityScore,
      priorityReasons: c.priorityReasons,
      recommendedIntervention: c.recommendedIntervention,
      status: c.status,
      assignedTeam: c.assignedTeam,
      assignedVehicle: c.assignedVehicle,
      urgentEscalation: c.urgentEscalation,
      verifiedAt,
      assignedAt,
      inProgressAt,
      resolvedAt,
      feedback: c.feedback || null,
    };

    await setDoc(docRef, complaintData);
    console.log(
      `   ✅ [CREATED] ${c.complaintNumber} | ${c.aiResult.wasteType} | Score: ${c.priorityScore} | Status: ${c.status}${
        c.urgentEscalation ? ' 🚨[URGENT]' : ''
      }${c.isDuplicateOf ? ' 🔗[DUP]' : ''}`
    );

    complaintsCreated++;
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    if (c.urgentEscalation) urgentCount++;
    if (c.isDuplicateOf) duplicateCount++;
    if (c.feedback) feedbackCount++;
  }

  // ── 3. Update Team Loads based on active assignments ───────────
  console.log('\n👥 Updating active team load metrics...');
  const activeTeamsMap = {
    'team-manual-a': 1, // complaint 01
    'team-truck-1': 3,  // complaints 02, 03, 04
    'team-recycle-gc': 2, // complaints 07, 09
    'team-manual-b': 1, // complaint 12
  };

  for (const [teamId, load] of Object.entries(activeTeamsMap)) {
    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);
      if (teamSnap.exists()) {
        await updateDoc(teamRef, { currentLoad: load });
        console.log(`   ✅ Updated ${teamId} currentLoad → ${load}`);
      }
    } catch (e) {
      console.warn(`   ⚠️ Could not update load for ${teamId}: ${e.message}`);
    }
  }

  // ── Summary Report ─────────────────────────────────────────────
  console.log('\n==============================================');
  console.log('🎉 DEMO DATA SEEDING COMPLETE');
  console.log('==============================================');
  console.log(`👤 Citizens Seeded:     ${citizensCreated} (Total Demo: ${DEMO_CITIZENS.length})`);
  console.log(`🚨 Complaints Seeded:   ${complaintsCreated} (Total Demo: ${DEMO_COMPLAINTS.length})`);
  console.log('📋 Status Distribution:');
  for (const [s, count] of Object.entries(statusCounts)) {
    console.log(`   - ${s.padEnd(12)}: ${count}`);
  }
  console.log(`⚡ Urgent Hazards:      ${urgentCount}`);
  console.log(`🔗 Duplicate Cases:     ${duplicateCount}`);
  console.log(`⭐ Verified Feedback:   ${feedbackCount}`);
  console.log('==============================================\n');

  process.exit(0);
}

seedDemoData().catch((err) => {
  console.error('❌ Seeding failed with error:', err);
  process.exit(1);
});
