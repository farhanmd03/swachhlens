import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getComplaintById } from '../services/complaintService.js';
import StatusBadge from '../components/StatusBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import DispatchModal from '../components/DispatchModal.jsx';
import FeedbackPanel from '../components/FeedbackPanel.jsx';
import LifecycleTimeline from '../components/LifecycleTimeline.jsx';
import {
  WASTE_TYPE_LABELS,
  VOLUME_LABELS,
  LOCATION_SENSITIVITY_LABELS,
  TEAM_TYPE_LABELS,
} from '../config/constants.js';
import {
  ArrowLeft,
  Send,
  Camera,
  User,
  Bot,
  Zap,
  Target,
  ShieldCheck,
  Clock,
  Star,
  AlertTriangle,
  Link2,
  Lock,
  Edit,
} from 'lucide-react';

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDispatch, setShowDispatch] = useState(false);
  const [error, setError] = useState(null);

  const loadComplaint = async () => {
    try {
      const data = await getComplaintById(id);
      if (!data) setError('Complaint record not found in Firestore.');
      else setComplaint(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaint();
  }, [id]);

  if (loading) {
    return <div className="portal-loading-card">Loading incident dossier {id}...</div>;
  }
  if (error) {
    return (
      <div className="portal-detail-page">
        <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
        <div className="portal-error-card" style={{ marginTop: '16px' }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  if (!complaint) return null;

  const {
    complaintNumber,
    citizenName,
    citizenPhone,
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

  const rec = recommendedIntervention;

  const getPriorityTier = (s) => {
    if (s >= 70) return 'HIGH';
    if (s >= 40) return 'MEDIUM';
    return 'LOW';
  };

  const wasteLabel =
    WASTE_TYPE_LABELS[aiResult?.wasteType] || aiResult?.wasteType || 'Waste Incident';

  return (
    <div className="portal-detail-page">
      {/* ── Top Bar with Actions ────────────────────────────────── */}
      <div className="portal-detail-topbar">
        <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Back to Incident Queue</span>
        </button>

        <div className="topbar-actions-right">
          {complaintNumber && (
            <span className="portal-tracking-id-badge">
              <span className="lbl">ID:</span> {complaintNumber}
            </span>
          )}
          <button
            className="btn btn-primary btn-dispatch-cta"
            onClick={() => setShowDispatch(true)}
          >
            <Send size={16} />
            <span>Dispatch / Update Status</span>
          </button>
        </div>
      </div>

      {/* ── Incident Header Card ───────────────────────────────── */}
      <div className="portal-header-card">
        <div className="header-title-box">
          <h2>{wasteLabel}</h2>
          <span className="incident-reported-date">
            Reported: {new Date(timestamp).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="header-badges-cluster">
          <StatusBadge status={status} />
          <PriorityBadge score={priorityScore} />
          {urgentEscalation && (
            <span className="urgent-badge-pill">
              <AlertTriangle size={12} />
              <span>Critical Hazard</span>
            </span>
          )}
          {isDuplicateOf && (
            <span className="duplicate-badge-pill">
              <Link2 size={12} />
              <span>Linked Duplicate</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Split Layout: Evidence / Operations ────────────────── */}
      <div className="portal-detail-grid-layout">
        {/* LEFT COLUMN: Evidence, Reporter Info, Duplicate Cluster */}
        <div className="portal-col-left">
          {/* ISSUE & Photo Card */}
          <div className="portal-card">
            <h4 className="card-header-title">
              <Camera size={16} />
              <span>Issue Photo Evidence</span>
            </h4>
            {imageBase64 ? (
              <div className="portal-image-frame">
                <img
                  src={`data:image/jpeg;base64,${imageBase64}`}
                  alt={wasteLabel}
                  className="portal-incident-photo"
                />
              </div>
            ) : (
              <div className="portal-image-placeholder">No Photo Available</div>
            )}

            <div className="incident-geo-meta">
              <div className="geo-row">
                <span className="geo-label">GPS Location:</span>
                <code className="geo-coords">
                  {gps ? `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}` : 'N/A'}
                </code>
              </div>
              {comment && (
                <div className="geo-comment-box">
                  <span className="geo-label">Citizen Notes:</span>
                  <p className="geo-comment">"{comment}"</p>
                </div>
              )}
            </div>
          </div>

          {/* REPORTER Card */}
          <div className="portal-card">
            <h4 className="card-header-title">
              <User size={16} />
              <span>Reporter Identification</span>
            </h4>
            <div className="reporter-details-grid">
              <div className="rep-row">
                <span className="rep-k">Citizen Name:</span>
                <strong className="rep-v">{citizenName || 'Anonymous Citizen'}</strong>
              </div>
              <div className="rep-row">
                <span className="rep-k">Contact Phone:</span>
                <strong className="rep-v">{citizenPhone || 'Not provided'}</strong>
              </div>
            </div>
            <p className="reporter-privacy-note">
              <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Contact information is strictly protected and visible only to authenticated municipal staff.
            </p>
          </div>

          {/* Duplicate Link Card (if applicable) */}
          {isDuplicateOf && (
            <div className="portal-card duplicate-warning-card">
              <h4 className="card-header-title">
                <Link2 size={16} />
                <span>Duplicate Incident Cluster</span>
              </h4>
              <p className="dup-text">
                This complaint is automatically linked to parent incident ID:
              </p>
              <code className="dup-code">{isDuplicateOf}</code>
              <button
                className="btn btn-secondary btn-small"
                style={{ marginTop: '8px' }}
                onClick={() => navigate(`/complaint/${isDuplicateOf}`)}
              >
                Inspect Parent Incident →
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Triage, Decision Support, Dispatch & Feedback */}
        <div className="portal-col-right">
          {/* AI ASSESSMENT */}
          {aiResult && (
            <div className="portal-card">
              <h4 className="card-header-title">
                <Bot size={16} />
                <span>AI Assessment (Gemini Vision)</span>
              </h4>
              <div className="ai-stats-grid">
                <div className="ai-stat-box">
                  <span className="ai-stat-k">Waste Type</span>
                  <strong className="ai-stat-v highlight-waste">
                    {WASTE_TYPE_LABELS[aiResult.wasteType] || aiResult.wasteType}
                  </strong>
                </div>
                <div className="ai-stat-box">
                  <span className="ai-stat-k">Estimated Volume</span>
                  <strong className="ai-stat-v">
                    {VOLUME_LABELS[aiResult.volumeEstimate] || aiResult.volumeEstimate}
                  </strong>
                </div>
                <div className="ai-stat-box">
                  <span className="ai-stat-k">Confidence</span>
                  <strong className="ai-stat-v">
                    {Math.round((aiResult.confidence || 0) * 100)}%
                  </strong>
                </div>
                <div className="ai-stat-box">
                  <span className="ai-stat-k">Area Context</span>
                  <strong className="ai-stat-v">
                    {LOCATION_SENSITIVITY_LABELS[aiResult.locationSensitivityHint] ||
                      aiResult.locationSensitivityHint}
                  </strong>
                </div>
              </div>

              {aiResult.reasoning && (
                <div className="ai-reasoning-callout">
                  <strong>AI Analysis Reasoning:</strong> {aiResult.reasoning}
                </div>
              )}
            </div>
          )}

          {/* PRIORITY & EXPLAINABILITY */}
          <div className="portal-card">
            <h4 className="card-header-title">
              <Zap size={16} />
              <span>Priority & Explainability</span>
            </h4>
            <div className="portal-priority-bar">
              <div className="score-big">
                <span className="score-num">{priorityScore}</span>
                <span className="score-denom">/100</span>
              </div>
              <span className={`tier-badge tier-${getPriorityTier(priorityScore).toLowerCase()}`}>
                {getPriorityTier(priorityScore)} PRIORITY
              </span>
            </div>

            <div className="reasons-box">
              <span className="reasons-title">Contributing Priority Factors:</span>
              {priorityReasons && priorityReasons.length > 0 ? (
                <ul className="reasons-bullet-list">
                  {priorityReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="no-reasons-msg">Priority details computed by baseline heuristic.</p>
              )}
            </div>
          </div>

          {/* AI RECOMMENDED RESPONSE — Visually Distinct from Municipal Decision */}
          {rec && (
            <div className="portal-card ai-recommendation-card">
              <div className="rec-card-top">
                <div className="rec-badge-group">
                  <Target size={16} className="text-emerald" />
                  <h4 className="card-header-title" style={{ margin: 0 }}>
                    AI Recommended Response
                  </h4>
                </div>
                <span className="ai-advisory-badge">AI Advisory</span>
              </div>

              <div className="rec-action-summary">
                <strong>Suggested Action:</strong> {rec.recommendedAction}
              </div>

              <div className="rec-specs-grid">
                <div className="rec-spec-item">
                  <span className="rec-k">Team Type</span>
                  <strong className="rec-v">{TEAM_TYPE_LABELS[rec.teamType] || rec.teamType}</strong>
                </div>
                <div className="rec-spec-item">
                  <span className="rec-k">Vehicle Unit</span>
                  <strong className="rec-v">{rec.vehicle}</strong>
                </div>
                <div className="rec-spec-item">
                  <span className="rec-k">Crew Requirement</span>
                  <strong className="rec-v">{rec.workerCount} Workers</strong>
                </div>
                <div className="rec-spec-item">
                  <span className="rec-k">Est. Cleanup</span>
                  <strong className="rec-v">{rec.estimatedCleanupTime}</strong>
                </div>
              </div>

              {rec.reasoning && (
                <p className="rec-reasoning-text">
                  <strong>Decision Logic:</strong> {rec.reasoning}
                </p>
              )}
            </div>
          )}

          {/* FINAL MUNICIPAL DECISION — Clearly separated from AI Recommendation */}
          <div className="portal-card municipal-decision-card">
            <div className="decision-header-row">
              <div className="dec-badge-group">
                <ShieldCheck size={16} className="text-primary" />
                <h4 className="card-header-title" style={{ margin: 0 }}>
                  Final Municipal Decision
                </h4>
              </div>
              <button
                className="btn btn-primary btn-small"
                onClick={() => setShowDispatch(true)}
              >
                <Edit size={12} />
                <span>Edit Assignment</span>
              </button>
            </div>

            <div className="decision-specs-grid">
              <div className="dec-spec-item">
                <span className="dec-k">Assigned Team</span>
                <strong className="dec-v">
                  {assignedTeam || <span className="text-muted">Unassigned</span>}
                </strong>
              </div>
              <div className="dec-spec-item">
                <span className="dec-k">Assigned Vehicle</span>
                <strong className="dec-v">
                  {assignedVehicle || <span className="text-muted">Not assigned</span>}
                </strong>
              </div>
              <div className="dec-spec-item">
                <span className="dec-k">Operational Status</span>
                <strong className="dec-v" style={{ textTransform: 'capitalize' }}>
                  {status.replace(/_/g, ' ')}
                </strong>
              </div>
            </div>
          </div>

          {/* TIMELINE */}
          <div className="portal-card">
            <h4 className="card-header-title">
              <Clock size={16} />
              <span>Field Lifecycle Timeline</span>
            </h4>
            <LifecycleTimeline complaint={complaint} />
          </div>

          {/* FEEDBACK */}
          <div className="portal-card">
            <h4 className="card-header-title">
              <Star size={16} />
              <span>Citizen Satisfaction Feedback</span>
            </h4>
            <FeedbackPanel feedback={feedback} />
          </div>
        </div>
      </div>

      {showDispatch && (
        <DispatchModal
          complaint={complaint}
          onClose={() => {
            setShowDispatch(false);
            loadComplaint();
          }}
        />
      )}
    </div>
  );
}
