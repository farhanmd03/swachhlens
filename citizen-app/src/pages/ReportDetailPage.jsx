import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToComplaint } from '../services/complaintService.js';
import StatusBadge from '../components/StatusBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import PriorityExplainer from '../components/PriorityExplainer.jsx';
import LifecycleTimeline from '../components/LifecycleTimeline.jsx';
import InterventionCard from '../components/InterventionCard.jsx';
import ResolutionFeedback from '../components/ResolutionFeedback.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import {
  WASTE_TYPE_LABELS,
  VOLUME_LABELS,
  LOCATION_SENSITIVITY_LABELS,
} from '../config/constants.js';
import {
  ArrowLeft,
  Camera,
  Bot,
  Zap,
  Target,
  Users,
  Clock,
  Star,
  CheckCircle2,
  AlertTriangle,
  Link2,
} from 'lucide-react';

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    const unsub = subscribeToComplaint(
      id,
      (data) => {
        setComplaint(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading report details..." />;
  if (error) {
    return (
      <div className="report-detail-page">
        <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Back to Reports</span>
        </button>
        <div className="error-card" style={{ marginTop: '16px' }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  if (!complaint) return null;

  const {
    complaintNumber,
    imageBase64,
    gps,
    comment,
    aiResult,
    priorityScore,
    priorityReasons,
    recommendedIntervention,
    status,
    assignedTeam,
    assignedVehicle,
    urgentEscalation,
    isDuplicateOf,
    timestamp,
    feedback,
  } = complaint;

  const date = new Date(timestamp).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const isResolved = status === 'resolved';
  const hasFeedback = !!feedback;
  const wasteLabel =
    WASTE_TYPE_LABELS[aiResult?.wasteType] || aiResult?.wasteType || 'Waste Issue';

  return (
    <div className="report-detail-page">
      <div className="detail-top-nav">
        <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        {complaintNumber && (
          <span className="top-tracking-id">{complaintNumber}</span>
        )}
      </div>

      {/* ── Main Detail Header ──────────────────────────────────── */}
      <div className="detail-header-card">
        <div className="header-meta-row">
          <h2>{wasteLabel}</h2>
          <div className="detail-badges-row">
            <StatusBadge status={status} />
            <PriorityBadge score={priorityScore} />
            {urgentEscalation && (
              <span className="urgent-tag">
                <AlertTriangle size={12} />
                <span>Urgent</span>
              </span>
            )}
            {isDuplicateOf && (
              <span className="duplicate-tag">
                <Link2 size={12} />
                <span>Duplicate</span>
              </span>
            )}
          </div>
        </div>

        <p className="detail-date-text">Reported on {date}</p>
      </div>

      {/* ── Photo Evidence Card ─────────────────────────────────── */}
      <div className="detail-section-card">
        <h3 className="section-card-title">
          <Camera size={16} />
          <span>Photo Evidence</span>
        </h3>
        {imageBase64 ? (
          <div className="detail-image-wrapper">
            <img
              src={`data:image/jpeg;base64,${imageBase64}`}
              alt={wasteLabel}
              className="detail-main-image"
            />
          </div>
        ) : (
          <div className="placeholder-image">No image data attached</div>
        )}

        <div className="evidence-meta-grid">
          <div className="meta-cell">
            <span className="meta-label">Location (GPS)</span>
            <span className="meta-value">
              {gps ? `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}` : 'N/A'}
            </span>
          </div>
          {comment && (
            <div className="meta-cell full-width">
              <span className="meta-label">Citizen Notes</span>
              <span className="meta-value comment-text">"{comment}"</span>
            </div>
          )}
        </div>
      </div>

      {/* ── AI Assessment Card ─────────────────────────────────── */}
      {aiResult && (
        <div className="detail-section-card">
          <h3 className="section-card-title">
            <Bot size={16} />
            <span>AI Waste Assessment</span>
          </h3>
          <div className="detail-grid-metrics">
            <div className="metric-box">
              <span className="metric-lbl">Waste Category</span>
              <strong className="metric-val">
                {WASTE_TYPE_LABELS[aiResult.wasteType] || aiResult.wasteType}
              </strong>
            </div>
            <div className="metric-box">
              <span className="metric-lbl">Estimated Volume</span>
              <strong className="metric-val">
                {VOLUME_LABELS[aiResult.volumeEstimate] || aiResult.volumeEstimate}
              </strong>
            </div>
            <div className="metric-box">
              <span className="metric-lbl">Confidence</span>
              <strong className="metric-val">
                {Math.round((aiResult.confidence || 0) * 100)}%
              </strong>
            </div>
            <div className="metric-box">
              <span className="metric-lbl">Sensitivity</span>
              <strong className="metric-val">
                {LOCATION_SENSITIVITY_LABELS[aiResult.locationSensitivityHint] ||
                  aiResult.locationSensitivityHint}
              </strong>
            </div>
          </div>
          {aiResult.reasoning && (
            <div className="ai-reasoning-quote">
              <strong>Reasoning:</strong> {aiResult.reasoning}
            </div>
          )}
        </div>
      )}

      {/* ── Explainable Priority ───────────────────────────────── */}
      <div className="detail-section-card">
        <h3 className="section-card-title">
          <Zap size={16} />
          <span>Priority & Escalation</span>
        </h3>
        <PriorityExplainer score={priorityScore} reasons={priorityReasons} />
      </div>

      {/* ── Recommended Intervention ───────────────────────────── */}
      <div className="detail-section-card">
        <h3 className="section-card-title">
          <Target size={16} />
          <span>AI Recommended Response</span>
        </h3>
        <InterventionCard recommendation={recommendedIntervention} />
      </div>

      {/* ── Municipal Assignment Info ──────────────────────────── */}
      <div className="detail-section-card">
        <h3 className="section-card-title">
          <Users size={16} />
          <span>Municipal Assignment</span>
        </h3>
        <div className="assignment-grid">
          <div className="assignment-item">
            <span className="assign-lbl">Assigned Team</span>
            <span className="assign-val">
              {assignedTeam ? `Team: ${assignedTeam}` : 'Pending assignment'}
            </span>
          </div>
          <div className="assignment-item">
            <span className="assign-lbl">Vehicle Unit</span>
            <span className="assign-val">{assignedVehicle || 'Not assigned'}</span>
          </div>
          {isDuplicateOf && (
            <div className="assignment-item full-width">
              <span className="assign-lbl">Linked Duplicate Issue</span>
              <code className="duplicate-id-code">{isDuplicateOf}</code>
            </div>
          )}
        </div>
      </div>

      {/* ── Lifecycle Timeline ─────────────────────────────────── */}
      <div className="detail-section-card">
        <h3 className="section-card-title">
          <Clock size={16} />
          <span>Live Cleanup Timeline</span>
        </h3>
        <LifecycleTimeline complaint={complaint} />
      </div>

      {/* ── Citizen Resolution Feedback ────────────────────────── */}
      {isResolved && !hasFeedback && !feedbackSubmitted && (
        <div className="detail-section-card feedback-prompt-card">
          <h3 className="section-card-title">
            <Star size={16} />
            <span>Rate Resolution Quality</span>
          </h3>
          <p className="feedback-prompt-text">
            Municipal operations marked this issue as resolved. Please verify the cleanup quality.
          </p>
          <ResolutionFeedback
            complaintId={id}
            onSubmitted={() => setFeedbackSubmitted(true)}
          />
        </div>
      )}

      {feedbackSubmitted && (
        <div className="detail-section-card feedback-thanks-card">
          <CheckCircle2 size={36} className="text-emerald" style={{ marginBottom: '6px' }} />
          <h4>Thank you for your feedback!</h4>
          <p>Your response helps improve municipal response quality.</p>
        </div>
      )}

      {hasFeedback && (
        <div className="detail-section-card verified-feedback-card">
          <h3 className="section-card-title">
            <Star size={16} />
            <span>Your Submitted Feedback</span>
          </h3>
          <div className="submitted-feedback-body">
            <div className="feedback-result-line">
              <span className="fdbk-label">Status Check:</span>
              <strong className="fdbk-value">{feedback.result?.replace(/_/g, ' ')}</strong>
            </div>
            <div className="feedback-rating-line">
              <span className="fdbk-label">Rating:</span>
              <span className="fdbk-stars">
                {'★'.repeat(feedback.rating)}
                {'☆'.repeat(5 - feedback.rating)}
              </span>
              <span className="fdbk-score-num">({feedback.rating}/5)</span>
            </div>
            {feedback.comment && (
              <div className="feedback-comment-line">
                <span className="fdbk-label">Comment:</span>
                <p className="fdbk-comment-text">"{feedback.comment}"</p>
              </div>
            )}
            <p className="feedback-timestamp">
              Submitted on {new Date(feedback.submittedAt).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
