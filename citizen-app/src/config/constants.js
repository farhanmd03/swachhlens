/**
 * Application constants for SwachhLens Citizen App
 */

// ── Waste Types ─────────────────────────────────────────────────
export const WASTE_TYPES = [
  'overflowing_bin',
  'garbage_dump',
  'plastic_waste',
  'construction_debris',
  'organic_waste',
  'e_waste',
  'hazardous_waste',
  'drain_blockage',
];

export const WASTE_TYPE_LABELS = {
  overflowing_bin: 'Overflowing Bin',
  garbage_dump: 'Garbage Dump',
  plastic_waste: 'Plastic Waste',
  construction_debris: 'Construction Debris',
  organic_waste: 'Organic Waste',
  e_waste: 'E-Waste',
  hazardous_waste: 'Hazardous Waste',
  drain_blockage: 'Drain Blockage',
};

// ── Volume Estimates ────────────────────────────────────────────
export const VOLUMES = ['small', 'medium', 'large', 'very_large'];

export const VOLUME_LABELS = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  very_large: 'Very Large',
};

export const VOLUME_WEIGHTS = {
  small: 0.25,
  medium: 0.50,
  large: 0.75,
  very_large: 1.00,
};

// ── Location Sensitivity ────────────────────────────────────────
export const LOCATION_SENSITIVITIES = [
  'none',
  'near_school',
  'near_hospital',
  'near_water_body',
  'blocking_drainage',
];

export const LOCATION_SENSITIVITY_LABELS = {
  none: 'None',
  near_school: 'Near School',
  near_hospital: 'Near Hospital',
  near_water_body: 'Near Water Body',
  blocking_drainage: 'Blocking Drainage',
};

export const LOCATION_SENSITIVITY_WEIGHTS = {
  none: 0.00,
  near_school: 0.70,
  near_hospital: 0.70,
  near_water_body: 0.70,
  blocking_drainage: 1.00,
};

// ── Complaint Statuses ──────────────────────────────────────────
export const STATUSES = [
  'reported',
  'verified',
  'assigned',
  'in_progress',
  'completed_pending_verification',
  'resolved',
];

export const STATUS_LABELS = {
  reported: 'Reported',
  verified: 'Verified',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed_pending_verification: 'Cleanup Completed (Awaiting Verification)',
  resolved: 'Resolved',
};

export const STATUS_COLORS = {
  reported: '#ff9800',
  verified: '#2196f3',
  assigned: '#9c27b0',
  in_progress: '#00bcd4',
  completed_pending_verification: '#8b5cf6',
  resolved: '#4caf50',
};

// ── Priority Thresholds ─────────────────────────────────────────
export const PRIORITY_THRESHOLDS = {
  HIGH: 70,
  MEDIUM: 40,
};

export const PRIORITY_COLORS = {
  high: '#d32f2f',
  medium: '#ff9800',
  low: '#4caf50',
};

// ── Duplicate Detection ─────────────────────────────────────────
export const DUPLICATE_RADIUS_METERS = 50;
export const DUPLICATE_TIME_WINDOW_HOURS = 48;

// ── Report Frequency ────────────────────────────────────────────
export const FREQUENCY_RADIUS_METERS = 50;
export const FREQUENCY_TIME_WINDOW_DAYS = 7;
export const FREQUENCY_CAP = 5;

// ── Image Compression ───────────────────────────────────────────
export const MAX_IMAGE_WIDTH = 800;
export const JPEG_QUALITY = 0.6;
export const MAX_BASE64_SIZE_BYTES = 500 * 1024; // 500 KB safety guard

// ── Urgent Escalation Triggers ──────────────────────────────────
export const URGENT_WASTE_TYPES = ['hazardous_waste', 'drain_blockage'];
export const URGENT_LOCATIONS = ['near_school', 'near_hospital'];

// ── Team Type Labels ─────────────────────────────────────────────
export const TEAM_TYPE_LABELS = {
  manual_cleanup: 'Manual Cleanup',
  mini_truck: 'Mini Truck',
  recycling_partner: 'Recycling Partner',
};

// ── Complaint Number ─────────────────────────────────────────────
// Format: SWL-YY-NNNNN-XXXX
// YY = last 2 digits of year
// NNNNN = last 5 digits of epoch seconds
// XXXX = 4 random alphanumeric chars (uppercase)
export function generateComplaintNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const secs = String(Math.floor(Date.now() / 1000)).slice(-5);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SWL-${yy}-${secs}-${suffix}`;
}
