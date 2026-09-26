/**
 * Commercial Constants for SwachhLens Services: Planned Waste Collection & Operations
 * Focus: Kolkata Metropolitan Region Use Cases, Transparent Breakdown & Deterministic Governance
 */

export const ESTABLISHMENT_TYPES = [
  'housing_society',
  'residential_complex',
  'wedding_marriage',
  'catering_food',
  'restaurant_commercial',
  'campus_facility',
  'community_event',
  'exhibition_fair',
  'other',
];

export const ESTABLISHMENT_TYPE_LABELS = {
  housing_society: 'Apartment / Housing Society',
  residential_complex: 'Residential Complex',
  wedding_marriage: 'Wedding / Marriage Venue',
  catering_food: 'Catering / Food Event',
  restaurant_commercial: 'Restaurant / Commercial Establishment',
  campus_facility: 'School / College / Campus',
  community_event: 'Community Festival / Public Gathering',
  exhibition_fair: 'Exhibition / Trade Fair',
  other: 'Other Bulk Waste Generator',
};

export const SERVICE_FREQUENCIES = [
  'one_time',
  'recurring',
];

export const SERVICE_FREQUENCY_LABELS = {
  one_time: 'One-time Collection',
  recurring: 'Recurring / Regular Collection',
};

export const WASTE_STREAMS = [
  'food',
  'plastic',
  'paper',
  'glass_metal',
  'mixed',
  'other',
];

export const WASTE_STREAM_LABELS = {
  food: 'Food & Organic Waste',
  plastic: 'Plastic Packaging & Bottles',
  paper: 'Paper & Corrugated Cardboard',
  glass_metal: 'Glass Bottles & Beverage Cans',
  mixed: 'Mixed Solid Waste',
  other: 'General Event / Complex Debris',
};

export const COMMERCIAL_SCALES = [
  'small',
  'medium',
  'large',
  'very_large',
];

export const COMMERCIAL_SCALE_LABELS = {
  small: 'Small Scale (< 200 kg / ~100–250 people)',
  medium: 'Medium Scale (200–500 kg / ~250–600 people)',
  large: 'Large Scale (500–1,500 kg / ~600–1,500 people)',
  very_large: 'Very Large Scale (> 1,500 kg / > 1,500 people)',
};

export const SERVICE_WINDOWS = [
  'morning',
  'afternoon',
  'evening',
  'immediate',
];

export const SERVICE_WINDOW_LABELS = {
  morning: 'Morning Window (06:00 – 10:00)',
  afternoon: 'Afternoon Window (12:00 – 16:00)',
  evening: 'Night Post-Event Window (20:00 – 00:00)',
  immediate: 'Immediate Post-Event Turnaround',
};

export const KOLKATA_OPERATING_ZONES = {
  zone_a: { label: 'Zone A — Salt Lake / Bidhannagar', transportAllowance: 400 },
  zone_b: { label: 'Zone B — New Town / Rajarhat', transportAllowance: 500 },
  zone_c: { label: 'Zone C — Central Kolkata / Sealdah / Park Circus', transportAllowance: 350 },
  zone_d: { label: 'Zone D — South Kolkata / Ballygunge / Jadavpur', transportAllowance: 450 },
  zone_e: { label: 'Zone E — North Kolkata / Howrah / Panihati', transportAllowance: 550 },
};

export const PRICE_ADJUSTMENT_REASONS = {
  additional_crew: 'Additional crew required',
  additional_vehicle: 'Additional vehicle required',
  additional_trip: 'Additional trip required',
  longer_duration: 'Longer service duration',
  site_access_difficulty: 'Site/access difficulty',
  additional_handling_segregation: 'Additional handling/segregation',
  transport_logistics_adjustment: 'Transport/logistics adjustment',
  disposal_processing_adjustment: 'Disposal/processing adjustment',
  other: 'Other operational requirement',
};

export const COMMERCIAL_STATUSES = [
  'reported',
  'requested',
  'under_review',
  'awaiting_price_approval',
  'confirmed',
  'assigned',
  'arrived',
  'in_progress',
  'completed_pending_verification',
  'resolved',
  'cancelled',
];

export const COMMERCIAL_STATUS_LABELS = {
  reported: 'Submitted / Under Review',
  requested: 'Submitted / Under Review',
  under_review: 'Under Operational Review',
  awaiting_price_approval: 'Awaiting Customer Price Approval',
  confirmed: 'Confirmed',
  assigned: 'Unit Assigned',
  arrived: 'On Site',
  in_progress: 'In Progress',
  completed_pending_verification: 'Completed / Pending Verification',
  resolved: 'Verified & Closed',
  cancelled: 'Cancelled',
};

/**
 * Illustrative Prototype Rate Card — Kolkata Baseline (v1.1)
 * Explicitly designated as: Illustrative Prototype Estimate
 */
export const COMMERCIAL_RATE_CARD = {
  version: 'v1.1-kolkata-prototype',
  title: 'Illustrative Prototype Rate Card',
  currency: 'INR',
  currencySymbol: '₹',
  baseServiceRate: 1200, // Mobilization, routing and dispatch coordination
  crewRatePerHour: 200,  // Standard field workforce tariff per operative/hr
  vehicleRates: {
    'Collection Van': 400,
    'Mini Truck': 600,
    'Suction/Jetting Vehicle': 1000,
    'Recycling Collection Vehicle': 500,
    default: 500,
  },
  kolkataDisposalAllowance: 600, // Configured prototype processing & disposal allowance per trip
  additionalTripRate: 1200,     // Additional vehicle trip allowance when volume requires
  additionalHandlingRate: 400,  // Multi-stream segregation handling surcharge
  rapidTurnaroundSurcharge: 500, // Immediate window surcharge
  scaleMultipliers: {
    small: 1.0,
    medium: 1.25,
    large: 1.5,
    very_large: 1.8,
  },
  disclaimer: 'Illustrative prototype estimate; final tariff subject to operator review and deployment-specific rate configuration.',
};

/**
 * Generate human-readable commercial tracking ID
 * Format: SL-BULK-YY-NNNNN-XXXX
 */
export function generateCommercialServiceNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const secs = String(Math.floor(Date.now() / 1000)).slice(-5);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SL-BULK-${yy}-${secs}-${suffix}`;
}
