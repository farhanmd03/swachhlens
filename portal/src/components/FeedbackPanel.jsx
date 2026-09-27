import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Star } from 'lucide-react';

const RESULT_CONFIG = {
  resolved: { label: 'Verified Cleaned', icon: CheckCircle2, className: 'feedback-resolved' },
  partial: { label: 'Partially Resolved', icon: AlertTriangle, className: 'feedback-partial' },
  not_resolved: { label: 'Not Resolved', icon: XCircle, className: 'feedback-not-resolved' },
};

/**
 * Displays citizen feedback in the municipal portal.
 * Shows rating, result, comment, and submission date.
 */
export default function FeedbackPanel({ feedback }) {
  if (!feedback) {
    return (
      <div className="feedback-panel feedback-empty">
        <p>No citizen satisfaction feedback recorded yet for this incident.</p>
      </div>
    );
  }

  const { result, rating, comment, submittedAt } = feedback;
  const config = RESULT_CONFIG[result] || {
    label: result,
    icon: CheckCircle2,
    className: 'feedback-resolved',
  };
  const IconComponent = config.icon;

  return (
    <div className={`feedback-panel ${config.className}`}>
      <div className="feedback-top-badge">
        <IconComponent size={16} />
        <span>{config.label}</span>
      </div>

      <div className="feedback-stars" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            fill={s <= rating ? '#f59e0b' : 'none'}
            color={s <= rating ? '#f59e0b' : '#cbd5e1'}
          />
        ))}
        <span className="feedback-rating-text" style={{ marginLeft: '6px' }}>{rating}/5 Rating</span>
      </div>

      {comment && <p className="feedback-comment">"{comment}"</p>}

      {submittedAt && (
        <p className="feedback-date">
          Submitted: {new Date(submittedAt).toLocaleString('en-IN')}
        </p>
      )}
    </div>
  );
}
