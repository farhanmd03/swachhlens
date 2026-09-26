/**
 * Commercial Constants for SwachhLens Services: Bulk & Event Waste Engine
 */

export const ESTABLISHMENT_TYPES = [
  'wedding_marriage',
  'catering_food',
  'community_event',
  'exhibition_fair',
  'campus_facility',
  'restaurant_commercial',
  'other',
];

export const ESTABLISHMENT_TYPE_LABELS = {
  wedding_marriage: 'Wedding / Marriage Venue',
  catering_food: 'Catering / Food Event',
  community_event: 'Community Festival / Public Gathering',
  exhibition_fair: 'Exhibition / Trade Fair',
  campus_facility: 'Campus / Educational Facility',
  restaurant_commercial: 'Commercial Establishment / Restaurant',
  other: 'Other Bulk Waste Generator',
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
  plastic: 'Plastic & Beverage Packaging',
  paper: 'Paper & Corrugated Cardboard',
  glass_metal: 'Glass Bottles & Beverage Cans',
  mixed: 'Mixed Solid Waste',
  other: 'General Event Debris',
};

export const COMMERCIAL_SCALES = [
  'small',
  'medium',
  'large',
  'very_large',
];

export const COMMERCIAL_SCALE_LABELS = {
  small: 'Small Scale (< 200 kg / ~100–250 attendees)',
  medium: 'Medium Scale (200–500 kg / ~250–600 attendees)',
  large: 'Large Scale (500–1,500 kg / ~600–1,500 attendees)',
  very_large: 'Very Large Scale (> 1,500 kg / > 1,500 attendees)',
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
  evening: 'Night Post-Event (20:00 – 00:00)',
  immediate: 'Immediate Post-Event Turnaround',
};

export const COMMERCIAL_STATUSES = [
  'requested',
  'reviewed',
  'quoted',
  'approved',
  'assigned',
  'arrived',
  'in_progress',
  'completed_pending_verification',
  'resolved',
];

export const COMMERCIAL_STATUS_LABELS = {
  requested: 'Service Requested',
  reviewed: 'Under Review',
  quoted: 'Quote Generated',
  approved: 'Service Approved',
  assigned: 'Unit Assigned',
  arrived: 'Arrived On Site',
  in_progress: 'Cleanup In Progress',
  completed_pending_verification: 'Completed (Pending Verification)',
  resolved: 'Service Verified & Closed',
};

/**
 * Configurable Commercial Rate Card (v1.0)
 * Marked as: Indicative pricing / configurable operator rate card
 */
export const COMMERCIAL_RATE_CARD = {
  version: 'v1.0',
  currency: 'INR',
  currencySymbol: '₹',
  baseServiceRate: 1500, // Mobilization, routing and dispatch coordination
  crewRatePerHour: 250, // Per field operative per hour
  vehicleRates: {
    'Collection Van': 800,
    'Mini Truck': 1500,
    'Suction/Jetting Vehicle': 2500,
    'Recycling Collection Vehicle': 1200,
    default: 1200,
  },
  scaleMultipliers: {
    small: 1.0,
    medium: 1.25,
    large: 1.6,
    very_large: 2.2,
  },
  additionalHandlingRate: 400, // Multi-stream segregation handling
  disclaimer: 'Indicative pricing / subject to municipal operator review',
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
