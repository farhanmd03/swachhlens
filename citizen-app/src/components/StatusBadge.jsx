import React from 'react';
import { STATUS_LABELS } from '../config/constants.js';

export function getStatusSemanticClass(status) {
  switch (status) {
    case 'reported':
    case 'requested':
    case 'under_review':
      return 'status-reported';
    case 'verified':
      return 'status-verified';
    case 'assigned':
      return 'status-assigned';
    case 'arrived':
      return 'status-arrived';
    case 'in_progress':
      return 'status-in-progress';
    case 'awaiting_price_approval':
      return 'status-awaiting-approval';
    case 'completed_pending_verification':
      return 'status-verification';
    case 'resolved':
    case 'completed':
      return 'status-resolved';
    case 'rework':
      return 'status-rework';
    case 'cancelled':
      return 'status-cancelled';
    default:
      return 'status-default';
  }
}

/**
 * Standardized semantic status badge for SwachhLens.
 * Uses soft semantic background, high-contrast text, and a distinct indicator dot.
 */
export default function StatusBadge({ status, className = '' }) {
  const label = STATUS_LABELS[status] || (typeof status === 'string' ? status.replace(/_/g, ' ') : 'Unknown');
  const semanticClass = getStatusSemanticClass(status);

  return (
    <span className={`status-badge ${semanticClass} ${className}`}>
      <span className="status-dot" aria-hidden="true" />
      <span className="status-label-text">{label}</span>
    </span>
  );
}
