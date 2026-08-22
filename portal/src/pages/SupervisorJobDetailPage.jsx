import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getComplaintById,
  markJobArrived,
  startJobWork,
  submitJobCompletion,
} from '../services/complaintService.js';
import StatusBadge from '../components/StatusBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import {
  WASTE_TYPE_LABELS,
  VOLUME_LABELS,
  LOCATION_SENSITIVITY_LABELS,
  TEAM_TYPE_LABELS,
} from '../config/constants.js';
import {
  ArrowLeft,
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  RotateCcw,
  Biohazard,
  Truck,
  Users,
  HardHat,
  Send,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';

/**
 * Client-side image compression helper to JPEG base64.
 */
function compressImage(file, maxWidth = 800, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SupervisorJobDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Completion modal/panel state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [afterImageBase64, setAfterImageBase64] = useState(null);
  const [completionNote, setCompletionNote] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const loadJob = async () => {
    try {
      const data = await getComplaintById(id);
      if (!data) {
        setError('Job record not found in Firestore.');
      } else {
        // Enforce team ownership check
        if (user?.teamId && data.assignedTeam && data.assignedTeam !== user.teamId) {
          setError('Access Denied: This job is assigned to another operational unit.');
          setComplaint(null);
        } else {
          setComplaint(data);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [id, user?.teamId]);

  const handleMarkArrived = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await markJobArrived(complaint.id);
      setSuccessMsg('On-site arrival timestamp recorded.');
      await loadJob();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(`Failed to mark arrived: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await startJobWork(complaint.id);
      setSuccessMsg('Work started! Job status updated to In Progress.');
      await loadJob();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(`Failed to start work: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImage(file);
      setAfterImageBase64(base64);
      setImagePreview(`data:image/jpeg;base64,${base64}`);
    } catch (err) {
      setError('Failed to process after-cleanup photo.');
    }
  };

  const handleSubmitCompletion = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      await submitJobCompletion(complaint.id, {
        afterImageBase64,
        completionNote: completionNote || 'Field cleanup completed successfully.',
        supervisorUid: user?.uid,
        supervisorName: user?.email ? user.email.split('@')[0] : 'Field Supervisor',
      });

      setShowCompletionModal(false);
      setSuccessMsg('Cleanup submitted for municipal verification!');
      await loadJob();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(`Submission failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="portal-loading-card">Loading job assignment details...</div>;

  if (error && !complaint) {
    return (
      <div className="supervisor-job-detail-page">
        <button className="btn btn-secondary back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
          <span>Back to Field Operations</span>
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
    timestamp,
    arrivedAt,
    workStartedAt,
    completedAt,
    resolvedAt,
    completionEvidence,
    reworkReason,
  } = complaint;

  const rec = recommendedIntervention;
  const wasteLabel = WASTE_TYPE_LABELS[aiResult?.wasteType] || aiResult?.wasteType || 'Waste Issue';

  // ── SLA / Overdue Calculations ─────────────────────────────────
  let isOverdue = false;
  let overdueMinutes = 0;
  if (workStartedAt && status === 'in_progress') {
    const elapsedMinutes = (Date.now() - workStartedAt) / (1000 * 60);
    // Parse estimated minutes from rec (default 60 if unspecified)
    let estMinutes = 60;
    if (rec?.estimatedCleanupTime) {
      const match = rec.estimatedCleanupTime.match(/(\d+)[–-](\d+)/);
      if (match) estMinutes = parseInt(match[2], 10);
    }
    if (elapsedMinutes > estMinutes) {
      isOverdue = true;
      overdueMinutes = Math.round(elapsedMinutes - estMinutes);
    }
  }

  const isCompleted = status === 'completed_pending_verification' || status === 'resolved';

  return (
    <div className="supervisor-job-detail-page">
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <div className="portal-detail-topbar">
        <button className="btn btn-secondary back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
          <span>Back to Assigned Jobs</span>
        </button>

        <div className="topbar-actions-right">
          {complaintNumber && (
            <span className="portal-tracking-id-badge">
              <span className="lbl">ID:</span> {complaintNumber}
            </span>
          )}
        </div>
      </div>

      {/* ── Success / Error Banners ─────────────────────────────── */}
      {successMsg && (
        <div className="dispatch-success" style={{ marginBottom: '16px' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && <div className="portal-error-card" style={{ marginBottom: '16px' }}>{error}</div>}

      {/* ── Rework Alert Banner (if rework was requested) ───────── */}
      {reworkReason && (
        <div className="rework-alert-card">
          <RotateCcw size={18} className="text-danger flex-shrink-0" />
          <div>
            <strong className="rework-alert-title">Rework Requested by Municipal Head Office:</strong>
            <p className="rework-alert-desc">"{reworkReason}"</p>
            <span className="rework-alert-sub">Please address the feedback and re-submit after-cleanup evidence.</span>
          </div>
        </div>
      )}

      {/* ── Job Header Card ────────────────────────────────────── */}
      <div className="portal-header-card">
        <div className="header-title-box">
          <h2>{wasteLabel}</h2>
          <span className="incident-reported-date">
            Assigned to {user?.teamId}: {new Date(complaint.assignedAt || timestamp).toLocaleString('en-IN')}
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
          {aiResult?.bioWasteRisk && (
            <span className="urgent-badge-pill" style={{ background: '#7c3aed', color: '#fff' }}>
              <Biohazard size={12} />
              <span>Biohazard Alert</span>
            </span>
          )}
        </div>
      </div>

      {/* ── SLA Accountability & Field Timestamps Strip ──────────── */}
      <div className="sla-accountability-card">
        <div className="sla-header">
          <div className="sla-title">
            <Clock size={16} className="text-primary" />
            <h4>Operational SLA &amp; Field Timeline</h4>
          </div>
          {isOverdue && (
            <span className="sla-overdue-pill">
              <AlertTriangle size={12} />
              <span>OVERDUE BY {overdueMinutes} MIN</span>
            </span>
          )}
        </div>

        <div className="sla-grid">
          <div className="sla-item">
            <span className="sla-k">Est. Cleanup Time</span>
            <strong className="sla-v">{rec?.estimatedCleanupTime || '30–60 minutes'}</strong>
          </div>
          <div className="sla-item">
            <span className="sla-k">On-Site Arrival</span>
            <strong className="sla-v">
              {arrivedAt ? new Date(arrivedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Pending Arrival'}
            </strong>
          </div>
          <div className="sla-item">
            <span className="sla-k">Work Started</span>
            <strong className="sla-v">
              {workStartedAt ? new Date(workStartedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Not Started'}
            </strong>
          </div>
          <div className="sla-item">
            <span className="sla-k">Completed</span>
            <strong className="sla-v">
              {completedAt ? new Date(completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
            </strong>
          </div>
        </div>
      </div>

      {/* ── FIELD ACTION CONTROLS ────────────────────────────────── */}
      {!isCompleted && (
        <div className="field-action-bar">
          <div className="field-action-steps">
            {/* Step 1: Mark Arrived */}
            {!arrivedAt ? (
              <button
                className="btn btn-secondary btn-action-step"
                onClick={handleMarkArrived}
                disabled={actionLoading}
              >
                <MapPin size={16} />
                <span>Mark Arrived On-Site</span>
              </button>
            ) : (
              <span className="step-completed-badge">
                <Check size={14} /> Arrived ({new Date(arrivedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}

            {/* Step 2: Start Work */}
            {status !== 'in_progress' ? (
              <button
                className="btn btn-secondary btn-action-step"
                onClick={handleStartWork}
                disabled={actionLoading}
              >
                <Play size={16} />
                <span>Start Cleanup Work</span>
              </button>
            ) : (
              <span className="step-completed-badge in-progress-badge">
                <Clock size={14} /> In Progress
              </span>
            )}

            {/* Step 3: Complete Work */}
            <button
              className="btn btn-primary btn-action-step btn-complete-step"
              onClick={() => setShowCompletionModal(true)}
              disabled={actionLoading}
            >
              <CheckCircle2 size={16} />
              <span>Mark Work Completed &amp; Submit Evidence</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Grid: Citizen Evidence & AI Assessment ───────────────── */}
      <div className="portal-detail-grid-layout" style={{ marginTop: '20px' }}>
        {/* Left Column: Citizen Evidence & Location */}
        <div className="portal-col-left">
          <div className="portal-card">
            <h4 className="card-header-title">
              <Camera size={16} />
              <span>Original Citizen Photo Evidence</span>
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
                <span className="geo-label">GPS Coordinates:</span>
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

          {/* Response Vehicle & Assigned Equipment */}
          <div className="portal-card">
            <h4 className="card-header-title">
              <Truck size={16} />
              <span>Assigned Vehicle &amp; Crew</span>
            </h4>
            <div className="reporter-details-grid">
              <div className="rep-row">
                <span className="rep-k">Assigned Unit:</span>
                <strong className="rep-v">{assignedTeam}</strong>
              </div>
              <div className="rep-row">
                <span className="rep-k">Vehicle Unit:</span>
                <strong className="rep-v">{assignedVehicle || rec?.vehicle || 'Standard Van'}</strong>
              </div>
              <div className="rep-row">
                <span className="rep-k">Required Workers:</span>
                <strong className="rep-v">{rec?.workerCount || 4} Members</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Triage Summary & After-Cleanup Evidence */}
        <div className="portal-col-right">
          {/* AI Assessment */}
          {aiResult && (
            <div className="portal-card">
              <h4 className="card-header-title">
                <HardHat size={16} />
                <span>AI Assessment &amp; Operational Directives</span>
              </h4>

              <div className="ai-stats-grid">
                <div className="ai-stat-box">
                  <span className="ai-stat-k">Waste Type</span>
                  <strong className="ai-stat-v highlight-waste">
                    {WASTE_TYPE_LABELS[aiResult.wasteType] || aiResult.wasteType}
                  </strong>
                </div>
                <div className="ai-stat-box">
                  <span className="ai-stat-k">Volume</span>
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
                  <span className="ai-stat-k">Location Context</span>
                  <strong className="ai-stat-v">
                    {LOCATION_SENSITIVITY_LABELS[aiResult.locationSensitivityHint] ||
                      aiResult.locationSensitivityHint}
                  </strong>
                </div>
              </div>

              {aiResult.reasoning && (
                <div className="ai-reasoning-callout" style={{ marginTop: '12px' }}>
                  <strong>Safety / Operational Notes:</strong> {aiResult.reasoning}
                </div>
              )}
            </div>
          )}

          {/* AFTER-CLEANUP COMPLETION EVIDENCE (When Available) */}
          {completionEvidence ? (
            <div className="portal-card completion-evidence-card">
              <div className="rec-card-top">
                <div className="rec-badge-group">
                  <ShieldCheck size={16} className="text-emerald" />
                  <h4 className="card-header-title" style={{ margin: 0 }}>
                    Field Completion Evidence
                  </h4>
                </div>
                <span className="ai-advisory-badge" style={{ background: '#dcfce7', color: '#166534' }}>
                  {status === 'resolved' ? 'Verified by Head Office' : 'Awaiting Municipal Verification'}
                </span>
              </div>

              {completionEvidence.afterImageBase64 ? (
                <div className="portal-image-frame" style={{ marginTop: '12px' }}>
                  <img
                    src={`data:image/jpeg;base64,${completionEvidence.afterImageBase64}`}
                    alt="After Cleanup Evidence"
                    className="portal-incident-photo"
                  />
                  <span className="after-photo-tag">AFTER CLEANUP</span>
                </div>
              ) : (
                <p className="no-after-photo">No after photo attached with completion report.</p>
              )}

              <div className="completion-meta-box">
                <div className="completion-meta-row">
                  <span className="meta-k">Supervisor Note:</span>
                  <p className="meta-note">"{completionEvidence.completionNote}"</p>
                </div>
                <div className="completion-meta-row">
                  <span className="meta-k">Submitted By:</span>
                  <strong className="meta-v">{completionEvidence.completedByName || 'Field Supervisor'}</strong>
                </div>
                <div className="completion-meta-row">
                  <span className="meta-k">Submitted At:</span>
                  <span className="meta-v">
                    {new Date(completionEvidence.completedAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="portal-card" style={{ background: '#f8fafc' }}>
              <h4 className="card-header-title">
                <ShieldCheck size={16} />
                <span>Completion Status</span>
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '8px 0 0 0' }}>
                Field completion evidence has not yet been submitted for this incident. Once cleanup is complete, take an after-cleanup photo and submit below.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── COMPLETION SUBMISSION MODAL ──────────────────────────── */}
      {showCompletionModal && (
        <div className="modal-overlay" onClick={() => setShowCompletionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-header-title">
                <h3>Submit Completion Evidence</h3>
                <span className="modal-id-tag">{complaintNumber || complaint.id.slice(0, 8)}</span>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowCompletionModal(false)}
                disabled={actionLoading}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCompletion} className="modal-body">
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '14px' }}>
                Upload an after-cleanup photograph and brief completion note for municipal operator verification.
              </p>

              {/* Photo Upload Box */}
              <div className="form-group">
                <label>
                  <Camera size={14} />
                  <span>After-Cleanup Photo (Recommended)</span>
                </label>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />

                {imagePreview ? (
                  <div className="completion-photo-preview-wrap">
                    <img src={imagePreview} alt="After Cleanup Preview" className="completion-preview-img" />
                    <button
                      type="button"
                      className="btn btn-secondary btn-small btn-reupload"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={12} /> Change Photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="upload-dropzone-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={24} className="text-muted" />
                    <span>Click to Capture or Select After-Cleanup Photo</span>
                  </button>
                )}
              </div>

              {/* Completion Note */}
              <div className="form-group">
                <label htmlFor="comp-note">
                  <span>Completion Note / Details</span>
                </label>
                <textarea
                  id="comp-note"
                  rows={3}
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder="e.g. Overflowing waste cleared, drainage unblocked, and area disinfected."
                  disabled={actionLoading}
                />
              </div>

              <div className="modal-footer" style={{ padding: '14px 0 0', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCompletionModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  <Send size={14} />
                  <span>{actionLoading ? 'Submitting...' : 'Submit for Verification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
