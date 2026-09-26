import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getComplaintById,
  subscribeToComplaint,
  verifyAndResolveComplaint,
  requestJobRework,
  acceptCommercialAiDispatch,
} from '../services/complaintService.js';
import StatusBadge from '../components/StatusBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import DispatchModal from '../components/DispatchModal.jsx';
import FeedbackPanel from '../components/FeedbackPanel.jsx';
import LifecycleTimeline from '../components/LifecycleTimeline.jsx';
import { getTeamName, getActiveTeams } from '../services/teamService.js';
import {
  WASTE_TYPE_LABELS,
  VOLUME_LABELS,
  LOCATION_SENSITIVITY_LABELS,
  TEAM_TYPE_LABELS,
} from '../config/constants.js';
import {
  ESTABLISHMENT_TYPE_LABELS,
  COMMERCIAL_SCALE_LABELS,
  WASTE_STREAM_LABELS,
  SERVICE_WINDOW_LABELS,
} from '../config/commercialConstants.js';
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
  Biohazard,
  Fingerprint,
  ChevronDown,
  CheckCircle2,
  RotateCcw,
  Check,
  Building2,
  Calendar,
  Recycle,
  Sparkles,
  FileText,
  DollarSign,
  MapPin,
  Briefcase,
} from 'lucide-react';

function confidenceLabel(confidence) {
  if (confidence === null || confidence === undefined) return 'Unavailable';
  if (confidence >= 0.85) return 'High';
  if (confidence >= 0.65) return 'Moderate';
  return 'Low';
}

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDispatch, setShowDispatch] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Rework Modal State
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkReasonInput, setReworkReasonInput] = useState('');
  const [resolvedTeamName, setResolvedTeamName] = useState('');
  const [activeTeams, setActiveTeams] = useState([]);

  useEffect(() => {
    getActiveTeams().then(setActiveTeams).catch(() => {});
  }, []);

  useEffect(() => {
    if (complaint?.assignedTeam) {
      getTeamName(complaint.assignedTeam).then(setResolvedTeamName);
    } else {
      setResolvedTeamName('');
    }
  }, [complaint?.assignedTeam]);

  useEffect(() => {
    if (!id) {
      setError('No complaint ID provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToComplaint(
      id,
      (data) => {
        if (!data) {
          setError('Complaint record not found in Firestore.');
          setComplaint(null);
        } else {
          setComplaint(data);
          setError(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(`Failed to subscribe to complaint updates: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  const handleVerifyAndResolve = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await verifyAndResolveComplaint(id, 'municipal-operator', 'Municipal Operations Office');
      setSuccessMsg('Service completion verified and marked Resolved!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setError(`Verification failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptCommercialAi = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const recType = complaint?.commercialAssessment?.recommendedTeamType || 'mini_truck';
      const recVehicle = complaint?.commercialAssessment?.recommendedVehicle || 'Mini Truck';
      const matchingTeam = activeTeams.find((t) => t.type === recType) || activeTeams[0];
      const targetTeamId = matchingTeam ? matchingTeam.id : 'team-truck-1';

      await acceptCommercialAiDispatch(id, targetTeamId, recVehicle);
      setSuccessMsg('Accepted AI recommendation! Operational unit assigned to event service.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setError(`Failed to assign unit: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendRework = async (e) => {
    e.preventDefault();
    if (!reworkReasonInput.trim()) {
      setError('Please enter a specific reason for requesting rework.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await requestJobRework(id, reworkReasonInput.trim(), 'municipal-operator');
      setShowReworkModal(false);
      setSuccessMsg('Job returned to field response team for rework.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setError(`Rework request failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="portal-loading-card">Loading incident dossier {id}...</div>;
  }
  if (error && !complaint) {
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

  const isCommercial = complaint.serviceType === 'commercial_bulk';

  const {
    complaintNumber,
    serviceNumber,
    citizenName,
    citizenPhone,
    customerContact,
    imageBase64,
    imageHash,
    gps,
    comment,
    aiResult,
    priorityScore,
    priorityReasons,
    recommendedIntervention,
    commercialAssessment,
    commercialQuote,
    establishmentType,
    eventName,
    eventDate,
    expectedAttendance,
    serviceWindow,
    wasteStream,
    secondaryStreams,
    segregatedAtSource,
    accessInstructions,
    dispatchDecisionType,
    status,
    assignedTeam,
    assignedVehicle,
    urgentEscalation,
    isDuplicateOf,
    duplicateEvidence,
    timestamp,
    feedback,
    completionEvidence,
    reworkReason,
    verifiedBy,
  } = complaint;

  const trackingId = isCommercial
    ? (serviceNumber || complaintNumber || complaint.id)
    : (complaintNumber || complaint.id);

  const getPriorityTier = (s) => {
    if (s >= 70) return 'HIGH';
    if (s >= 40) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="portal-detail-page">
      {/* ── Top Bar with Actions ────────────────────────────────── */}
      <div className="portal-detail-topbar">
        <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Back to Operations Queue</span>
        </button>

        <div className="topbar-actions-right">
          <span className="portal-tracking-id-badge">
            <span className="lbl">ID:</span> {trackingId}
          </span>
          <button
            className="btn btn-primary btn-dispatch-cta"
            onClick={() => setShowDispatch(true)}
          >
            <Send size={16} />
            <span>Dispatch / Update Status</span>
          </button>
        </div>
      </div>

      {/* ── Success / Error Notifications ──────────────────────── */}
      {successMsg && (
        <div className="dispatch-success" style={{ marginBottom: '16px' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && <div className="portal-error-card" style={{ marginBottom: '16px' }}>{error}</div>}

      {/* ══════════════════════════════════════════════════════════════════
          COMMERCIAL DOSSIER VIEW
          ══════════════════════════════════════════════════════════════════ */}
      {isCommercial ? (
        <>
          {/* Commercial Header Card */}
          <div className="commercial-header-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="table-bulk-badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                  🏢 Commercial Bulk Service
                </span>
                <span className="incident-reported-date" style={{ color: '#64748b', fontSize: '0.82rem' }}>
                  Requested: {new Date(timestamp).toLocaleString('en-IN')}
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 6px' }}>
                {eventName || ESTABLISHMENT_TYPE_LABELS[establishmentType] || 'Commercial Event Waste Service'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem', color: '#64748b' }}>
                <span>📅 <strong>Event Date:</strong> {eventDate || 'Scheduled'}</span>
                <span>👥 <strong>Expected Attendance:</strong> {expectedAttendance || '—'} attendees</span>
                <span>⏰ <strong>Window:</strong> {SERVICE_WINDOW_LABELS[serviceWindow] || serviceWindow}</span>
              </div>
            </div>

            <div className="header-badges-cluster">
              <StatusBadge status={status} />
              {commercialQuote?.totalQuote && (
                <span className="commercial-tariff-pill">
                  ₹{commercialQuote.totalQuote.toLocaleString('en-IN')} Quoted Tariff
                </span>
              )}
              {serviceWindow === 'immediate' && (
                <span className="urgent-badge-pill">
                  <AlertTriangle size={12} />
                  <span>Immediate Turnaround</span>
                </span>
              )}
            </div>
          </div>

          {/* Commercial Split Layout */}
          <div className="portal-detail-grid-layout">
            {/* LEFT COLUMN: Customer Profile, Waste Profile & Quotation */}
            <div className="portal-col-left">
              {/* Event & Customer Organization */}
              <div className="portal-card">
                <h4 className="card-header-title">
                  <Briefcase size={16} />
                  <span>Client &amp; Venue Identification</span>
                </h4>
                <div className="reporter-details-grid">
                  <div className="rep-row">
                    <span className="rep-k">Organization / Client:</span>
                    <strong className="rep-v">{customerContact?.organizationName || 'Private Enterprise / Client'}</strong>
                  </div>
                  <div className="rep-row">
                    <span className="rep-k">Contact Person:</span>
                    <strong className="rep-v">{customerContact?.contactPerson || citizenName || 'Primary Coordinator'}</strong>
                  </div>
                  <div className="rep-row">
                    <span className="rep-k">Phone:</span>
                    <strong className="rep-v">{customerContact?.phone || citizenPhone || 'On File'}</strong>
                  </div>
                  {customerContact?.gstin && (
                    <div className="rep-row">
                      <span className="rep-k">GSTIN / Tax ID:</span>
                      <code className="geo-coords" style={{ fontSize: '0.8rem' }}>{customerContact.gstin}</code>
                    </div>
                  )}
                  <div className="rep-row">
                    <span className="rep-k">Venue / Locality:</span>
                    <strong className="rep-v">{complaint.venueName || 'Designated Venue'}</strong>
                  </div>
                  <div className="rep-row">
                    <span className="rep-k">GPS Coordinates:</span>
                    <code className="geo-coords">
                      {gps ? `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}` : 'N/A'}
                    </code>
                  </div>
                </div>

                {accessInstructions && (
                  <div className="geo-comment-box" style={{ marginTop: '12px' }}>
                    <span className="geo-label">Loading Dock &amp; Access Notes:</span>
                    <p className="geo-comment">"{accessInstructions}"</p>
                  </div>
                )}
              </div>

              {/* Waste Profile & Evidence */}
              <div className="portal-card">
                <h4 className="card-header-title">
                  <Camera size={16} />
                  <span>Commercial Waste Profile &amp; Survey</span>
                </h4>

                <div className="reporter-details-grid" style={{ marginBottom: '12px' }}>
                  <div className="rep-row">
                    <span className="rep-k">Primary Waste Stream:</span>
                    <strong className="rep-v text-emerald">{WASTE_STREAM_LABELS[wasteStream] || wasteStream}</strong>
                  </div>
                  <div className="rep-row">
                    <span className="rep-k">Scale Tier:</span>
                    <strong className="rep-v">{COMMERCIAL_SCALE_LABELS[complaint.scale] || complaint.scale}</strong>
                  </div>
                  <div className="rep-row">
                    <span className="rep-k">Secondary Streams:</span>
                    <span className="rep-v">
                      {secondaryStreams && secondaryStreams.length > 0
                        ? secondaryStreams.map((s) => WASTE_STREAM_LABELS[s] || s).join(', ')
                        : 'None'}
                    </span>
                  </div>
                  <div className="rep-row">
                    <span className="rep-k">Segregated at Source:</span>
                    <strong className="rep-v" style={{ color: segregatedAtSource ? '#15803d' : '#b45309' }}>
                      {segregatedAtSource ? '✅ Yes — Segregated by Organizer' : '⚠️ No — Requires Post-Sorting'}
                    </strong>
                  </div>
                </div>

                {imageBase64 ? (
                  <div className="portal-image-frame">
                    <img
                      src={`data:image/jpeg;base64,${imageBase64}`}
                      alt="Site Inspection"
                      className="portal-incident-photo"
                    />
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textAlign: 'center', marginTop: '4px' }}>
                      Pre-Event / Site Survey Photograph
                    </span>
                  </div>
                ) : (
                  <div className="portal-image-placeholder" style={{ height: '80px', fontSize: '0.8rem' }}>
                    No pre-event photo uploaded (Booking based on event specifications)
                  </div>
                )}
              </div>

              {/* Itemized Indicative Quotation Breakdown */}
              <div className="portal-card">
                <h4 className="card-header-title">
                  <DollarSign size={16} />
                  <span>Itemized Indicative Quotation</span>
                </h4>

                <table className="commercial-quote-table">
                  <thead>
                    <tr>
                      <th>Operational Line Item</th>
                      <th>Detail</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Base Mobilization</td>
                      <td>Vehicle &amp; depot dispatch</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ₹{commercialQuote?.breakdown?.baseMobilization?.toLocaleString('en-IN') || '1,800'}
                      </td>
                    </tr>
                    <tr>
                      <td>Crew Deployment</td>
                      <td>
                        {commercialQuote?.breakdown?.crewCount || 4} personnel × {commercialQuote?.breakdown?.durationHours || 4} hrs
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ₹{commercialQuote?.breakdown?.crewCost?.toLocaleString('en-IN') || '2,400'}
                      </td>
                    </tr>
                    <tr>
                      <td>Vehicle Operations</td>
                      <td>{commercialQuote?.breakdown?.vehicleType || 'Mini Truck'} operational tariff</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ₹{commercialQuote?.breakdown?.vehicleCost?.toLocaleString('en-IN') || '1,600'}
                      </td>
                    </tr>
                    {commercialQuote?.breakdown?.segregationSurcharge > 0 && (
                      <tr>
                        <td>Sorting Surcharge</td>
                        <td>Multi-stream / post-collection sorting</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ₹{commercialQuote.breakdown.segregationSurcharge.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                    {commercialQuote?.breakdown?.scaleAdjustment > 0 && (
                      <tr>
                        <td>Scale Multiplier</td>
                        <td>Volume expansion factor</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ₹{commercialQuote.breakdown.scaleAdjustment.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                    <tr className="total-row">
                      <td colSpan="2">Total Quoted Tariff</td>
                      <td style={{ textAlign: 'right' }}>
                        ₹{(commercialQuote?.totalQuote || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p className="commercial-quote-disclaimer">
                  * Indicative pricing / subject to operator review. Calculated via Municipal Rate Card v1.0. Final invoice settled upon verified post-event weight and close-out.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: AI Assessment, Dispatch Engine & Verification */}
            <div className="portal-col-right">
              {/* AI Commercial Assessment & Plan */}
              {commercialAssessment && (
                <div className="portal-card pipeline-step-card">
                  <div className="step-card-header">
                    <div className="step-title-group">
                      <Bot size={16} className="text-primary" />
                      <h4 className="card-header-title" style={{ margin: 0 }}>
                        AI SERVICE PLAN &amp; RESOURCE ALLOCATION
                      </h4>
                    </div>
                    <span className="pipeline-step-badge">Operational Advisory</span>
                  </div>

                  <div className="ai-reasoning-callout" style={{ marginTop: '8px', marginBottom: '12px' }}>
                    <strong>AI Operational Plan:</strong> {commercialAssessment.summaryPlan}
                  </div>

                  <div className="ai-stats-grid">
                    <div className="ai-stat-box">
                      <span className="ai-stat-k">Recommended Crew</span>
                      <strong className="ai-stat-v highlight-waste">
                        {commercialAssessment.recommendedCrewSize} Personnel
                      </strong>
                    </div>
                    <div className="ai-stat-box">
                      <span className="ai-stat-k">Recommended Vehicle</span>
                      <strong className="ai-stat-v">
                        {commercialAssessment.recommendedVehicle}
                      </strong>
                    </div>
                    <div className="ai-stat-box">
                      <span className="ai-stat-k">Est. Shift Duration</span>
                      <strong className="ai-stat-v">
                        {commercialAssessment.estimatedDurationHours} Hours
                      </strong>
                    </div>
                    <div className="ai-stat-box">
                      <span className="ai-stat-k">Turnaround Window</span>
                      <strong className="ai-stat-v">
                        {SERVICE_WINDOW_LABELS[serviceWindow] || 'Standard'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '0.82rem', color: '#475569' }}>
                    <p style={{ margin: '0 0 4px' }}>
                      <strong>Crew Sizing Logic:</strong> {commercialAssessment.crewReasoning}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Vehicle Sizing Logic:</strong> {commercialAssessment.vehicleReasoning}
                    </p>
                  </div>

                  {/* Circular Economy / Resource Recovery */}
                  {commercialAssessment.recyclingPotential && (
                    <div className="circularity-card">
                      <div className="circularity-header">
                        <Recycle size={16} />
                        <span>CIRCULAR ECONOMY &amp; RESOURCE RECOVERY</span>
                      </div>
                      <div className="circularity-metrics-row">
                        <div className="circ-stat">
                          <span className="circ-k">Target Material</span>
                          <span className="circ-v">{commercialAssessment.recyclingPotential.material}</span>
                        </div>
                        <div className="circ-stat">
                          <span className="circ-k">Estimated Landfill Diversion</span>
                          <span className="circ-v text-emerald">{commercialAssessment.recyclingPotential.estimatedRecoveryRate}</span>
                        </div>
                      </div>
                      <p className="circ-plan">
                        <strong>Recovery Routing:</strong> {commercialAssessment.recyclingPotential.plan}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Visual Step Connector */}
              <div className="pipeline-connector" aria-hidden="true">
                <ChevronDown size={14} />
              </div>

              {/* Municipal Dispatch Decision & Unit Assignment */}
              <div className="portal-card municipal-decision-card pipeline-step-card">
                <div className="decision-header-row">
                  <div className="dec-badge-group">
                    <ShieldCheck size={16} className="text-emerald" />
                    <div>
                      <h4 className="card-header-title" style={{ margin: 0 }}>
                        MUNICIPAL DISPATCH &amp; UNIT ASSIGNMENT
                      </h4>
                      <span className="human-operator-caption">Human operator governance &amp; operational oversight</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => setShowDispatch(true)}
                  >
                    <Edit size={12} />
                    <span>{assignedTeam ? 'Edit Assignment' : 'Assign Unit'}</span>
                  </button>
                </div>

                <div className="decision-specs-grid">
                  <div className="dec-spec-item">
                    <span className="dec-k">Assigned Unit</span>
                    <strong className="dec-v">
                      {assignedTeam ? (
                        <>
                          <span>{resolvedTeamName || assignedTeam}</span>{' '}
                          <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 400 }}>({assignedTeam})</span>
                        </>
                      ) : (
                        <span className="text-muted">Unassigned (Awaiting Review)</span>
                      )}
                    </strong>
                  </div>
                  <div className="dec-spec-item">
                    <span className="dec-k">Allocated Vehicle</span>
                    <strong className="dec-v">
                      {assignedVehicle || <span className="text-muted">Not allocated</span>}
                    </strong>
                  </div>
                  <div className="dec-spec-item">
                    <span className="dec-k">Operational Status</span>
                    <strong className="dec-v" style={{ textTransform: 'capitalize' }}>
                      {status.replace(/_/g, ' ')}
                    </strong>
                  </div>
                </div>

                {/* Dispatch Decision Type Badge */}
                <div style={{ marginTop: '12px' }}>
                  {dispatchDecisionType === 'accepted_ai' ? (
                    <span className="decision-type-badge decision-ai">
                      <Sparkles size={13} />
                      <span>Unit Assigned via Accepted AI Advisory</span>
                    </span>
                  ) : dispatchDecisionType === 'operator_override' ? (
                    <span className="decision-type-badge decision-override">
                      <User size={13} />
                      <span>Unit Assigned via Operator Manual Override</span>
                    </span>
                  ) : null}
                </div>

                {/* Accept AI vs Override One-Click CTA (if unassigned or pending review) */}
                {(!assignedTeam || status === 'requested' || status === 'approved') && (
                  <div className="commercial-decision-actions">
                    <button
                      className="btn btn-primary"
                      onClick={handleAcceptCommercialAi}
                      disabled={actionLoading}
                      style={{ background: '#059669', borderColor: '#059669' }}
                    >
                      <Sparkles size={14} />
                      <span>Accept AI Recommendation</span>
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowDispatch(true)}
                      disabled={actionLoading}
                    >
                      <Edit size={14} />
                      <span>Manual Override</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Field Completion Evidence & Verification */}
              {completionEvidence ? (
                <div className="portal-card completion-verification-card">
                  <div className="rec-card-top">
                    <div className="rec-badge-group">
                      <ShieldCheck size={16} className="text-emerald" />
                      <h4 className="card-header-title" style={{ margin: 0 }}>
                        Field Completion Verification
                      </h4>
                    </div>
                    {status === 'resolved' ? (
                      <span className="ai-advisory-badge" style={{ background: '#dcfce7', color: '#166534' }}>
                        <Check size={12} /> Service Verified &amp; Closed
                      </span>
                    ) : (
                      <span className="ai-advisory-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                        Awaiting Municipal Verification
                      </span>
                    )}
                  </div>

                  <div className="before-after-grid" style={{ marginTop: '14px' }}>
                    <div className="comparison-col">
                      <span className="comparison-tag before-tag">BEFORE / PRE-EVENT</span>
                      {imageBase64 ? (
                        <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Before" className="comparison-img" />
                      ) : (
                        <div className="comparison-placeholder">No Initial Photo</div>
                      )}
                    </div>
                    <div className="comparison-col">
                      <span className="comparison-tag after-tag">AFTER / POST-CLEANUP</span>
                      {completionEvidence.afterImageBase64 ? (
                        <img src={`data:image/jpeg;base64,${completionEvidence.afterImageBase64}`} alt="After" className="comparison-img" />
                      ) : (
                        <div className="comparison-placeholder">No After Photo</div>
                      )}
                    </div>
                  </div>

                  <div className="completion-meta-box" style={{ marginTop: '14px' }}>
                    <div className="completion-meta-row">
                      <span className="meta-k">Supervisor Note:</span>
                      <p className="meta-note">"{completionEvidence.completionNote}"</p>
                    </div>
                    <div className="completion-meta-row">
                      <span className="meta-k">Completed By:</span>
                      <strong className="meta-v">{completionEvidence.completedByName || 'Field Supervisor'}</strong>
                    </div>
                    <div className="completion-meta-row">
                      <span className="meta-k">Completed At:</span>
                      <span className="meta-v">
                        {new Date(completionEvidence.completedAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {verifiedBy && (
                      <div className="completion-meta-row">
                        <span className="meta-k">Verified By:</span>
                        <strong className="meta-v text-emerald">{verifiedBy.name} ({new Date(verifiedBy.verifiedAt).toLocaleString('en-IN')})</strong>
                      </div>
                    )}
                  </div>

                  {status === 'completed_pending_verification' && (
                    <div className="verification-action-buttons" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                      <button
                        className="btn btn-primary btn-full"
                        onClick={handleVerifyAndResolve}
                        disabled={actionLoading}
                        style={{ background: '#059669', borderColor: '#059669' }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Verify &amp; Finalize Commercial Service</span>
                      </button>
                      <button
                        className="btn btn-secondary btn-full"
                        onClick={() => setShowReworkModal(true)}
                        disabled={actionLoading}
                      >
                        <RotateCcw size={16} />
                        <span>Send Back for Rework</span>
                      </button>
                    </div>
                  )}

                  {reworkReason && status === 'in_progress' && (
                    <div className="rework-notice-box" style={{ marginTop: '12px', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '6px' }}>
                      <strong style={{ color: '#dc2626', fontSize: '0.8rem' }}>Rework Requested:</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#991b1b' }}>"{reworkReason}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="portal-card" style={{ background: '#f8fafc' }}>
                  <h4 className="card-header-title">
                    <ShieldCheck size={16} />
                    <span>Field Completion Evidence</span>
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '6px 0 0 0' }}>
                    Field completion evidence unavailable. Waiting for assigned response team to mobilize and complete on-site clearance.
                  </p>
                </div>
              )}

              {/* TIMELINE */}
              <div className="portal-card">
                <h4 className="card-header-title">
                  <Clock size={16} />
                  <span>Commercial Service Lifecycle</span>
                </h4>
                <LifecycleTimeline complaint={complaint} />
              </div>

              {/* FEEDBACK */}
              <div className="portal-card">
                <h4 className="card-header-title">
                  <Star size={16} />
                  <span>Client Feedback &amp; Verification Rating</span>
                </h4>
                <FeedbackPanel feedback={feedback} />
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
           CIVIC INCIDENT DOSSIER VIEW (100% PRESERVED FOUNDATION)
           ══════════════════════════════════════════════════════════════════ */
        <>
          {/* Incident Header Card */}
          <div className="portal-header-card">
            <div className="header-title-box">
              <h2>{WASTE_TYPE_LABELS[aiResult?.wasteType] || aiResult?.wasteType || 'Waste Incident'}</h2>
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
              {aiResult?.bioWasteRisk === true && (
                <span className="urgent-badge-pill" style={{ background: '#7c3aed', color: '#fff' }}>
                  <Biohazard size={12} />
                  <span>Biohazard Alert</span>
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

          <div className="portal-detail-grid-layout">
            {/* LEFT COLUMN: Physical Evidence & Reporter Identification */}
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
                      alt="Waste Incident"
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
                  {imageHash && (
                    <div className="geo-row">
                      <span className="geo-label">Perceptual Hash:</span>
                      <code className="geo-coords" style={{ fontSize: '0.72rem' }}>
                        {imageHash}
                      </code>
                    </div>
                  )}
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

              {/* DUPLICATE EVIDENCE & IMAGE SIMILARITY */}
              {isDuplicateOf && (
                <div className="portal-card duplicate-evidence-card">
                  <div className="dup-evidence-header">
                    <div className="dup-evidence-title">
                      <Link2 size={16} className="text-emerald" />
                      <h4>DUPLICATE EVIDENCE</h4>
                    </div>
                    {duplicateEvidence?.imageSimilarityScore != null ? (
                      <span className="similarity-badge-pill">
                        <Fingerprint size={12} />
                        <span>Visual Similarity: {duplicateEvidence.imageSimilarityScore}%</span>
                      </span>
                    ) : (
                      <span className="similarity-badge-pill similarity-legacy">
                        <span>Visual similarity unavailable for this report.</span>
                      </span>
                    )}
                  </div>

                  <div className="dup-specs-grid">
                    <div className="dup-spec-item">
                      <span className="dup-k">Parent Incident ID</span>
                      <code className="dup-v-code">{isDuplicateOf}</code>
                    </div>
                    {duplicateEvidence?.distanceMeters != null && (
                      <div className="dup-spec-item">
                        <span className="dup-k">GPS Distance</span>
                        <strong className="dup-v">{duplicateEvidence.distanceMeters} metres</strong>
                      </div>
                    )}
                    {duplicateEvidence?.hoursApart != null && (
                      <div className="dup-spec-item">
                        <span className="dup-k">Time Difference</span>
                        <strong className="dup-v">{duplicateEvidence.hoursApart} hours apart</strong>
                      </div>
                    )}
                  </div>

                  {duplicateEvidence?.reasons && duplicateEvidence.reasons.length > 0 ? (
                    <div className="dup-reasons-block">
                      <span className="dup-reasons-title">Corroborated Factors:</span>
                      <ul className="dup-reasons-list">
                        {duplicateEvidence.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="dup-text" style={{ marginTop: '8px' }}>
                      Identified via GPS proximity (≤50m) and 48-hour time window.
                    </p>
                  )}

                  <button
                    className="btn btn-secondary btn-small btn-full"
                    style={{ marginTop: '12px' }}
                    onClick={() => navigate(`/complaint/${isDuplicateOf}`)}
                  >
                    <span>Inspect Parent Incident Dossier →</span>
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Decision Support Pipeline & Field Completion Verification */}
            <div className="portal-col-right">
              {/* STEP 1: AI ASSESSMENT */}
              {aiResult && (
                <div className="portal-card pipeline-step-card">
                  <div className="step-card-header">
                    <div className="step-title-group">
                      <Bot size={16} className="text-primary" />
                      <h4 className="card-header-title" style={{ margin: 0 }}>
                        AI ASSESSMENT
                      </h4>
                    </div>
                    <span className="pipeline-step-badge">AI Vision Analysis</span>
                  </div>

                  {aiResult.bioWasteRisk === true && (
                    <div className="biohazard-banner-alert">
                      <Biohazard size={16} />
                      <span>
                        <strong>Bio-Waste Risk Identified:</strong> Potential clinical or biological material detected.
                      </span>
                    </div>
                  )}
                  {aiResult.bioWasteRisk === 'unknown' && (
                    <div className="biohazard-banner-alert" style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#92400e' }}>
                      <AlertTriangle size={16} />
                      <span>
                        <strong>Bio-Waste Risk Undetermined:</strong> Precaution advised during on-site inspection.
                      </span>
                    </div>
                  )}

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
                      <span className="ai-stat-k" title="AI-assessed confidence from available visual evidence; not a guaranteed probability of correctness.">
                        Confidence ⓘ
                      </span>
                      <strong className="ai-stat-v">
                        {confidenceLabel(aiResult.confidence)}
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

              {/* Visual Step Connector */}
              <div className="pipeline-connector" aria-hidden="true">
                <ChevronDown size={14} />
              </div>

              {/* STEP 2: PRIORITY & WHY */}
              <div className="portal-card pipeline-step-card">
                <div className="step-card-header">
                  <div className="step-title-group">
                    <Zap size={16} className="text-amber" />
                    <h4 className="card-header-title" style={{ margin: 0 }}>
                      PRIORITY &amp; WHY
                    </h4>
                  </div>
                  <span className={`tier-badge tier-${getPriorityTier(priorityScore).toLowerCase()}`}>
                    {getPriorityTier(priorityScore)} PRIORITY
                  </span>
                </div>

                <div className="portal-priority-bar">
                  <div className="score-big">
                    <span className="score-num">{priorityScore}</span>
                    <span className="score-denom">/100</span>
                  </div>
                  <div className="priority-bar-label">
                    <strong>Calculated Operational Score</strong>
                    <span>(Volume, Location Sensitivity, Frequency &amp; Age)</span>
                  </div>
                </div>

                <div className="reasons-box">
                  <span className="reasons-title">Why this score?</span>
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

              {/* Visual Step Connector */}
              <div className="pipeline-connector" aria-hidden="true">
                <ChevronDown size={14} />
              </div>

              {/* STEP 3: AI ADVISORY RECOMMENDATION */}
              {recommendedIntervention && (
                <div className="portal-card ai-recommendation-card pipeline-step-card">
                  <div className="rec-card-top">
                    <div className="rec-badge-group">
                      <Target size={16} className="text-emerald" />
                      <h4 className="card-header-title" style={{ margin: 0 }}>
                        AI ADVISORY RECOMMENDATION
                      </h4>
                    </div>
                    <span className="ai-advisory-badge">AI-generated operational recommendation</span>
                  </div>

                  <div className="rec-action-summary">
                    <strong>Suggested Action:</strong> {recommendedIntervention.recommendedAction}
                  </div>

                  <div className="rec-specs-grid">
                    <div className="rec-spec-item">
                      <span className="rec-k">Suggested Team</span>
                      <strong className="rec-v">{TEAM_TYPE_LABELS[recommendedIntervention.teamType] || recommendedIntervention.teamType}</strong>
                    </div>
                    <div className="rec-spec-item">
                      <span className="rec-k">Vehicle Unit</span>
                      <strong className="rec-v">{recommendedIntervention.vehicle}</strong>
                    </div>
                    <div className="rec-spec-item">
                      <span className="rec-k">Worker Count</span>
                      <strong className="rec-v">{recommendedIntervention.workerCount} Workers</strong>
                    </div>
                    <div className="rec-spec-item">
                      <span className="rec-k">Estimated Cleanup Time</span>
                      <strong className="rec-v">{recommendedIntervention.estimatedCleanupTime}</strong>
                    </div>
                  </div>

                  {recommendedIntervention.reasoning && (
                    <p className="rec-reasoning-text">
                      <strong>Decision Logic:</strong> {recommendedIntervention.reasoning}
                    </p>
                  )}
                </div>
              )}

              {/* Visual Step Connector */}
              <div className="pipeline-connector" aria-hidden="true">
                <ChevronDown size={14} />
              </div>

              {/* STEP 4: FINAL MUNICIPAL DECISION */}
              <div className="portal-card municipal-decision-card pipeline-step-card">
                <div className="decision-header-row">
                  <div className="dec-badge-group">
                    <ShieldCheck size={16} className="text-emerald" />
                    <div>
                      <h4 className="card-header-title" style={{ margin: 0 }}>
                        FINAL MUNICIPAL DECISION
                      </h4>
                      <span className="human-operator-caption">Human operator decision (AI advises → municipal operator decides)</span>
                    </div>
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
                    <span className="dec-k">Selected Team</span>
                    <strong className="dec-v">
                      {assignedTeam ? (
                        <>
                          <span>{resolvedTeamName || 'Assigned Response Team'}</span>{' '}
                          <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 400 }}>({assignedTeam})</span>
                        </>
                      ) : (
                        <span className="text-muted">Unassigned</span>
                      )}
                    </strong>
                  </div>
                  <div className="dec-spec-item">
                    <span className="dec-k">Selected Vehicle</span>
                    <strong className="dec-v">
                      {assignedVehicle || <span className="text-muted">Not assigned</span>}
                    </strong>
                  </div>
                  <div className="dec-spec-item">
                    <span className="dec-k">Current Status</span>
                    <strong className="dec-v" style={{ textTransform: 'capitalize' }}>
                      {status.replace(/_/g, ' ')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* STEP 5: FIELD COMPLETION EVIDENCE & MUNICIPAL VERIFICATION */}
              {completionEvidence ? (
                <div className="portal-card completion-verification-card">
                  <div className="rec-card-top">
                    <div className="rec-badge-group">
                      <ShieldCheck size={16} className="text-emerald" />
                      <h4 className="card-header-title" style={{ margin: 0 }}>
                        Field Completion Verification
                      </h4>
                    </div>
                    {status === 'resolved' ? (
                      <span className="ai-advisory-badge" style={{ background: '#dcfce7', color: '#166534' }}>
                        <Check size={12} /> Verified &amp; Resolved
                      </span>
                    ) : (
                      <span className="ai-advisory-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                        Awaiting Municipal Verification
                      </span>
                    )}
                  </div>

                  <div className="before-after-grid" style={{ marginTop: '14px' }}>
                    <div className="comparison-col">
                      <span className="comparison-tag before-tag">BEFORE (Citizen Report)</span>
                      {imageBase64 ? (
                        <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Before" className="comparison-img" />
                      ) : (
                        <div className="comparison-placeholder">No Initial Photo</div>
                      )}
                    </div>
                    <div className="comparison-col">
                      <span className="comparison-tag after-tag">AFTER (Field Crew Cleanup)</span>
                      {completionEvidence.afterImageBase64 ? (
                        <img src={`data:image/jpeg;base64,${completionEvidence.afterImageBase64}`} alt="After" className="comparison-img" />
                      ) : (
                        <div className="comparison-placeholder">No After Photo</div>
                      )}
                    </div>
                  </div>

                  <div className="completion-meta-box" style={{ marginTop: '14px' }}>
                    <div className="completion-meta-row">
                      <span className="meta-k">Supervisor Note:</span>
                      <p className="meta-note">"{completionEvidence.completionNote}"</p>
                    </div>
                    <div className="completion-meta-row">
                      <span className="meta-k">Completed By:</span>
                      <strong className="meta-v">{completionEvidence.completedByName || 'Field Supervisor'}</strong>
                    </div>
                    <div className="completion-meta-row">
                      <span className="meta-k">Completed At:</span>
                      <span className="meta-v">
                        {new Date(completionEvidence.completedAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {verifiedBy && (
                      <div className="completion-meta-row">
                        <span className="meta-k">Verified By:</span>
                        <strong className="meta-v text-emerald">{verifiedBy.name} ({new Date(verifiedBy.verifiedAt).toLocaleString('en-IN')})</strong>
                      </div>
                    )}
                  </div>

                  {status === 'completed_pending_verification' && (
                    <div className="verification-action-buttons" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                      <button
                        className="btn btn-primary btn-full"
                        onClick={handleVerifyAndResolve}
                        disabled={actionLoading}
                        style={{ background: '#059669', borderColor: '#059669' }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Verify &amp; Mark Resolved</span>
                      </button>
                      <button
                        className="btn btn-secondary btn-full"
                        onClick={() => setShowReworkModal(true)}
                        disabled={actionLoading}
                      >
                        <RotateCcw size={16} />
                        <span>Send Back for Rework</span>
                      </button>
                    </div>
                  )}

                  {reworkReason && status === 'in_progress' && (
                    <div className="rework-notice-box" style={{ marginTop: '12px', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '6px' }}>
                      <strong style={{ color: '#dc2626', fontSize: '0.8rem' }}>Rework Requested:</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#991b1b' }}>"{reworkReason}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="portal-card" style={{ background: '#f8fafc' }}>
                  <h4 className="card-header-title">
                    <ShieldCheck size={16} />
                    <span>Field Completion Evidence</span>
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '6px 0 0 0' }}>
                    Field completion evidence unavailable. Waiting for assigned response team to submit after-cleanup report.
                  </p>
                </div>
              )}

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
        </>
      )}

      {/* ── REWORK REASON MODAL ──────────────────────────────────── */}
      {showReworkModal && (
        <div className="modal-overlay" onClick={() => setShowReworkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div className="modal-header-title">
                <h3>Request Field Rework</h3>
                <span className="modal-id-tag">{trackingId}</span>
              </div>
              <button className="modal-close" onClick={() => setShowReworkModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSendRework} className="modal-body">
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>
                Provide specific guidance for the field supervisor detailing why the cleanup was not approved.
              </p>

              <div className="form-group">
                <label htmlFor="rework-input">
                  <span>Rework Guidance / Instructions <span className="required">*</span></span>
                </label>
                <textarea
                  id="rework-input"
                  rows={3}
                  value={reworkReasonInput}
                  onChange={(e) => setReworkReasonInput(e.target.value)}
                  placeholder="e.g. Clearance incomplete at west service gate. Please clear remaining waste."
                  required
                  disabled={actionLoading}
                  autoFocus
                />
              </div>

              <div className="modal-footer" style={{ padding: '14px 0 0', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReworkModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={actionLoading || !reworkReasonInput.trim()}
                >
                  <RotateCcw size={14} />
                  <span>{actionLoading ? 'Sending...' : 'Confirm Rework Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDispatch && (
        <DispatchModal
          complaint={complaint}
          onClose={() => setShowDispatch(false)}
        />
      )}
    </div>
  );
}
