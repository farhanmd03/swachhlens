import React from 'react';
import { PRIORITY_THRESHOLDS } from '../config/constants.js';

/**
 * Displays priority score, tier badge, and bullet-list of reasons.
 * Gracefully handles missing priorityReasons.
 */
export default function PriorityExplainer({ score, reasons }) {
  if (score == null) return null;

  const getPriorityTier = (s) => {
    if (s >= PRIORITY_THRESHOLDS.HIGH) return { label: 'HIGH', className: 'priority-high' };
    if (s >= PRIORITY_THRESHOLDS.MEDIUM) return { label: 'MEDIUM', className: 'priority-medium' };
    return { label: 'LOW', className: 'priority-low' };
  };

  const tier = getPriorityTier(score);

  return (
    <div className="priority-explainer">
      <div className="priority-explainer-header">
        <span className="priority-score-large">{score}<span className="priority-score-max">/100</span></span>
        <span className={`priority-tier-badge ${tier.className}`}>{tier.label}</span>
      </div>
      <div className="priority-explainer-reasons">
        <p className="priority-reasons-label">Why this score?</p>
        {reasons && reasons.length > 0 ? (
          <ul className="priority-reasons-list">
            {reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        ) : (
          <p className="priority-reasons-empty">Priority details unavailable.</p>
        )}
      </div>
    </div>
  );
}
