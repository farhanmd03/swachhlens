import React from 'react';
import { PRIORITY_THRESHOLDS } from '../config/constants.js';

/**
 * Standardized semantic priority badge for SwachhLens Municipal Portal & Operations.
 * Eliminates inline styles in favor of semantic CSS classes with soft tints and crisp contrast.
 */
export default function PriorityBadge({ score, className = '' }) {
  let level = 'Low';
  let tierClass = 'priority-low';

  if (score > PRIORITY_THRESHOLDS.HIGH) {
    level = 'High';
    tierClass = 'priority-high';
  } else if (score >= PRIORITY_THRESHOLDS.MEDIUM) {
    level = 'Medium';
    tierClass = 'priority-medium';
  }

  return (
    <span className={`priority-badge ${tierClass} ${className}`}>
      <span className="priority-level-text">{level}</span>
      <span className="priority-score-num">({score})</span>
    </span>
  );
}
