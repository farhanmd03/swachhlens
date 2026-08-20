import React, { useState } from 'react';
import { submitFeedback } from '../services/complaintService.js';
import { CheckCircle2, AlertTriangle, XCircle, Star } from 'lucide-react';

const RESULT_OPTIONS = [
  { value: 'resolved', label: 'Yes, Resolved', icon: CheckCircle2, className: 'result-resolved' },
  { value: 'partial', label: 'Partially Resolved', icon: AlertTriangle, className: 'result-partial' },
  { value: 'not_resolved', label: 'Not Resolved', icon: XCircle, className: 'result-not-resolved' },
];

export default function ResolutionFeedback({ complaintId, onSubmitted }) {
  const [result, setResult] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!result) { setError('Please select a resolution result.'); return; }
    if (rating === 0) { setError('Please give a rating (1–5 stars).'); return; }
    setError(null);
    setLoading(true);
    try {
      await submitFeedback(complaintId, { result, rating, comment });
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(`Failed to submit feedback: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resolution-feedback">
      <h4>Was this issue resolved on the ground?</h4>

      <div className="result-options">
        {RESULT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              className={`result-option ${opt.className} ${result === opt.value ? 'selected' : ''}`}
              onClick={() => setResult(opt.value)}
              disabled={loading}
            >
              <Icon size={16} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rating-section">
        <p className="rating-label">Rate the response quality (1–5):</p>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-btn ${star <= (hoverRating || rating) ? 'star-filled' : 'star-empty'}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={loading}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="feedback-comment">Citizen Comment (Optional)</label>
        <textarea
          id="feedback-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more about the cleanup quality..."
          rows={3}
          disabled={loading}
        />
      </div>

      {error && <p className="error-message">{error}</p>}

      <button
        className="btn btn-primary btn-full"
        onClick={handleSubmit}
        disabled={loading || !result || rating === 0}
      >
        {loading ? 'Submitting...' : 'Submit Resolution Feedback'}
      </button>
    </div>
  );
}
