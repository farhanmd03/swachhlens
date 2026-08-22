import React, { useState, useEffect } from 'react';
import { updateComplaint } from '../services/complaintService.js';
import { getActiveTeams, updateTeamLoad } from '../services/teamService.js';
import { recommendDispatch, getTeamWithZone } from '../services/dispatchRecommendationService.js';
import { STATUSES, STATUS_LABELS, WASTE_TYPE_LABELS, TEAM_TYPE_LABELS } from '../config/constants.js';
import {
  Bot,
  ShieldCheck,
  Check,
  Edit3,
  Send,
  X,
  AlertTriangle,
  Users,
  Truck,
  Clock,
  Compass,
  MapPin,
  Activity,
  CheckCircle2,
} from 'lucide-react';

/**
 * Dispatch modal with Smart Dispatch Recommendation and accept/override flow.
 *
 * Shows:
 * 1. AI Recommended Intervention (action, vehicle, workers, time)
 * 2. Smart Dispatch Recommendation (which specific team based on capability, proximity, workload)
 * 3. Final Municipal Decision (manual assignment & override)
 */
export default function DispatchModal({ complaint, onClose }) {
  const rec = complaint?.recommendedIntervention;

  const [mode, setMode] = useState('recommendation'); // 'recommendation' | 'dispatch'
  const [teams, setTeams] = useState([]);
  const [status, setStatus] = useState(complaint?.status || 'reported');
  const [assignedTeam, setAssignedTeam] = useState(complaint?.assignedTeam || '');
  const [assignedVehicle, setAssignedVehicle] = useState(complaint?.assignedVehicle || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    getActiveTeams()
      .then((rawTeams) => {
        const enriched = (rawTeams || []).map(getTeamWithZone);
        setTeams(enriched);
      })
      .catch((err) => console.error('Failed to load teams:', err))
      .finally(() => setTeamsLoading(false));
  }, []);

  // Compute smart dispatch recommendation
  const smartDispatch = recommendDispatch({ complaint, teams });

  const handleAcceptRecommendation = () => {
    // Pre-fill dispatch fields from smart dispatch engine + AI intervention
    if (smartDispatch.success && smartDispatch.recommendedTeamId) {
      setAssignedTeam(smartDispatch.recommendedTeamId);
    } else {
      const fallbackTeam = teams.find((t) => t.type === rec?.teamType);
      if (fallbackTeam) setAssignedTeam(fallbackTeam.id);
    }

    setAssignedVehicle(rec?.vehicle || '');
    setMode('dispatch');
  };

  const handleOverride = () => {
    setMode('dispatch');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await updateComplaint(complaint.id, {
        status,
        assignedTeam: assignedTeam || null,
        assignedVehicle: assignedVehicle || null,
      });

      // Update team load if team changed
      if (assignedTeam && assignedTeam !== complaint.assignedTeam) {
        await updateTeamLoad(assignedTeam, 1);
        if (complaint.assignedTeam) {
          await updateTeamLoad(complaint.assignedTeam, -1);
        }
      }

      setSuccess(true);
      setTimeout(() => onClose(), 1100);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!complaint) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>Dispatch &amp; Operations Routing</h3>
            <span className="modal-id-tag">{complaint.complaintNumber || complaint.id.slice(0, 8)}</span>
          </div>
          <button className="modal-close" onClick={onClose} disabled={saving} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Complaint quick summary */}
          <div className="modal-summary-strip">
            <span><strong>Issue:</strong> {WASTE_TYPE_LABELS[complaint.aiResult?.wasteType] || 'Unknown'}</span>
            <span><strong>Priority:</strong> {complaint.priorityScore || 0}/100</span>
            {complaint.urgentEscalation && (
              <span className="modal-urgent-pill">
                <AlertTriangle size={11} /> Urgent
              </span>
            )}
          </div>

          {success && (
            <div className="dispatch-success">
              <Check size={16} />
              <span>Assignment saved &amp; field status updated!</span>
            </div>
          )}

          {error && <div className="modal-error">{error}</div>}

          {/* ── 1. AI & SMART DISPATCH RECOMMENDATION SECTION ──────── */}
          {mode === 'recommendation' && (
            <>
              {rec && (
                <div className="modal-section-box rec-box">
                  <div className="section-badge-top rec-badge">
                    <Bot size={14} />
                    <span>AI ADVISORY RECOMMENDATION</span>
                  </div>

                  <p className="rec-action-line">{rec.recommendedAction}</p>

                  <div className="rec-specs-grid-modal">
                    <div className="rec-cell">
                      <span className="cell-k">Required Capability</span>
                      <strong className="cell-v">{TEAM_TYPE_LABELS[rec.teamType] || rec.teamType}</strong>
                    </div>
                    <div className="rec-cell">
                      <span className="cell-k">Vehicle Unit</span>
                      <strong className="cell-v">{rec.vehicle}</strong>
                    </div>
                    <div className="rec-cell">
                      <span className="cell-k">Crew Requirement</span>
                      <strong className="cell-v">{rec.workerCount} Workers</strong>
                    </div>
                    <div className="rec-cell">
                      <span className="cell-k">Est. Cleanup</span>
                      <strong className="cell-v">{rec.estimatedCleanupTime}</strong>
                    </div>
                  </div>

                  <p className="rec-reasoning-line">
                    <strong>Decision Logic:</strong> {rec.reasoning}
                  </p>
                </div>
              )}

              {/* ── SMART DISPATCH UNIT RECOMMENDATION ──────────────── */}
              <div className="modal-section-box smart-dispatch-box" style={{ marginTop: '12px' }}>
                <div className="section-badge-top smart-dispatch-badge">
                  <Compass size={14} />
                  <span>SMART DISPATCH RECOMMENDATION</span>
                </div>

                {smartDispatch.success ? (
                  <div className="smart-dispatch-details">
                    <div className="smart-dispatch-grid">
                      <div className="smart-dispatch-item">
                        <span className="smart-k">Recommended Team</span>
                        <strong className="smart-v text-emerald">{smartDispatch.recommendedTeamName}</strong>
                        <span className="smart-sub-k">{smartDispatch.primaryZone}</span>
                      </div>
                      <div className="smart-dispatch-item">
                        <span className="smart-k">Approximate Proximity</span>
                        <strong className="smart-v">
                          {smartDispatch.approximateDistanceKm != null
                            ? `~${smartDispatch.approximateDistanceKm} km`
                            : 'Within Primary Zone'}
                        </strong>
                        <span className="smart-sub-k">Straight-line distance</span>
                      </div>
                      <div className="smart-dispatch-item">
                        <span className="smart-k">Current Active Jobs</span>
                        <strong className="smart-v">
                          {smartDispatch.currentLoad || 0} active job{(smartDispatch.currentLoad || 0) !== 1 ? 's' : ''}
                        </strong>
                        <span className="smart-sub-k">Unit capacity</span>
                      </div>
                    </div>

                    <div className="smart-dispatch-reasons">
                      <span className="smart-reasons-title">Why this team?</span>
                      <ul className="smart-reasons-list">
                        {smartDispatch.reasoning.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="smart-dispatch-unavailable">
                    <p className="smart-unavail-msg">
                      ⚠️ {smartDispatch.message || 'No suitable active team currently available.'}
                    </p>
                  </div>
                )}

                <div className="modal-rec-actions" style={{ marginTop: '16px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleAcceptRecommendation}
                    disabled={teamsLoading}
                  >
                    <Check size={15} />
                    <span>Accept Recommendation</span>
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleOverride}
                  >
                    <Edit3 size={15} />
                    <span>Override Manually</span>
                  </button>
                </div>

                <p className="modal-disclaimer">
                  Smart dispatch recommendations are advisory. Municipal operators hold final assignment authority.
                </p>
              </div>
            </>
          )}

          {/* ── 2. FINAL MUNICIPAL DECISION SECTION ───────────────── */}
          {mode === 'dispatch' && (
            <div className="modal-section-box dec-box">
              <div className="section-badge-top dec-badge">
                <ShieldCheck size={14} />
                <span>FINAL MUNICIPAL DECISION</span>
              </div>

              <button
                type="button"
                className="btn-link back-to-rec"
                onClick={() => setMode('recommendation')}
              >
                ← View Smart Recommendation
              </button>

              <div className="form-group">
                <label htmlFor="dispatch-team">
                  <Users size={13} />
                  <span>Assign Response Team</span>
                </label>
                <select
                  id="dispatch-team"
                  value={assignedTeam}
                  onChange={(e) => setAssignedTeam(e.target.value)}
                  disabled={saving || teamsLoading}
                >
                  <option value="">— Select Operational Unit —</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({TEAM_TYPE_LABELS[team.type] || team.type}) — {team.zoneShort || team.primaryZone} [Load: {team.currentLoad || 0}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dispatch-vehicle">
                  <Truck size={13} />
                  <span>Assign Vehicle / License Plate</span>
                </label>
                <input
                  id="dispatch-vehicle"
                  type="text"
                  value={assignedVehicle}
                  onChange={(e) => setAssignedVehicle(e.target.value)}
                  placeholder="e.g. DL-01-AB-1234 or Mini Truck Unit 1"
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dispatch-status">
                  <Clock size={13} />
                  <span>Operational Status</span>
                </label>
                <select
                  id="dispatch-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={saving}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {mode === 'dispatch' && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Send size={14} />
              <span>{saving ? 'Saving...' : 'Confirm Dispatch'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
