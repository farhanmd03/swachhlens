import React from 'react';
import { STATUS_LABELS, STATUS_COLORS } from '../config/constants.js';

/**
 * Colored status badge/pill.
 */
export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  const color = STATUS_COLORS[status] || '#757575';

  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: color,
        color: '#fff',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
