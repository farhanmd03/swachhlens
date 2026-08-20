import React from 'react';
import { PRIORITY_THRESHOLDS, PRIORITY_COLORS } from '../config/constants.js';

export default function PriorityBadge({ score }) {
  let level, color;
  if (score > PRIORITY_THRESHOLDS.HIGH) {
    level = 'High';
    color = PRIORITY_COLORS.high;
  } else if (score >= PRIORITY_THRESHOLDS.MEDIUM) {
    level = 'Medium';
    color = PRIORITY_COLORS.medium;
  } else {
    level = 'Low';
    color = PRIORITY_COLORS.low;
  }

  return (
    <span
      className="priority-badge"
      style={{
        backgroundColor: color,
        color: '#fff',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: 600,
      }}
    >
      {level} ({score})
    </span>
  );
}
