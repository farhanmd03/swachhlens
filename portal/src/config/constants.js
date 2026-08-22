/**
 * Application constants for SwachhLens Municipal Portal
 */

// ── Municipal User Roles ─────────────────────────────────────────
export const MUNICIPAL_ROLES = {
  OPERATOR: 'municipal_operator',
  SUPERVISOR: 'field_supervisor',
};

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
export const VOLUME_LABELS = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  very_large: 'Very Large',
};

// ── Location Sensitivity ────────────────────────────────────────
export const LOCATION_SENSITIVITY_LABELS = {
  none: 'None',
  near_school: 'Near School',
  near_hospital: 'Near Hospital',
  near_water_body: 'Near Water Body',
  blocking_drainage: 'Blocking Drainage',
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
  completed_pending_verification: 'Completed (Awaiting Verification)',
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

export const TEAM_TYPE_LABELS = {
  manual_cleanup: 'Manual Cleanup',
  mini_truck: 'Mini Truck',
  recycling_partner: 'Recycling Partner',
};
