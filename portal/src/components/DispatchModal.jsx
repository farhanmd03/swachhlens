import React, { useState, useEffect } from 'react';
import { updateComplaint } from '../services/complaintService.js';
import { getActiveTeams, updateTeamLoad } from '../services/teamService.js';
import { STATUSES, STATUS_LABELS, WASTE_TYPE_LABELS, TEAM_TYPE_LABELS } from '../config/constants.js';
import { Bot, ShieldCheck, Check, Edit3, Send, X, AlertTriangle, Users, Truck, Clock } from 'lucide-react';

/**
 * Dispatch modal with AI recommendation panel and accept/override flow.
 *
 * Shows the AI-recommended intervention at the top.
 * Municipal operator can accept it (pre-fill the form) or override manually.
 * Clearly separates AI Recommendation and Final Municipal Decision.
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
      .then(setTeams)
      .catch((err) => console.error('Failed to load teams:', err))
      .finally(() => setTeamsLoading(false));
  }, []);

  const handleAcceptRecommendation = () => {
    // Pre-fill dispatch fields from recommendation
    const matchingTeam = teams.find((t) => t.type === rec?.teamType);
    if (matchingTeam) setAssignedTeam(matchingTeam.id);
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
            <h3>Dispatch & Operations Routing</h3>
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
              <span>Assignment saved & field status updated!</span>
            </div>
          )}

          {error && <div className="modal-error">{error}</div>}

          {/* ── 1. AI RECOMMENDATION SECTION ──────────────────────── */}
          {mode === 'recommendation' && rec && (
            <div className="modal-section-box rec-box">
              <div className="section-badge-top rec-badge">
                <Bot size={14} />
                <span>AI RECOMMENDATION</span>
              </div>

              <p className="rec-action-line">{rec.recommendedAction}</p>

              <div className="rec-specs-grid-modal">
                <div className="rec-cell">
                  <span className="cell-k">Team Type</span>
                  <strong className="cell-v">{TEAM_TYPE_LABELS[rec.teamType] || rec.teamType}</strong>
                </div>
                <div className="rec-cell">
                  <span className="cell-k">Vehicle</span>
                  <strong className="cell-v">{rec.vehicle}</strong>
                </div>
                <div className="rec-cell">
                  <span className="cell-k">Workers</span>
                  <strong className="cell-v">{rec.workerCount} Workers</strong>
                </div>
                <div className="rec-cell">
                  <span className="cell-k">Est. Cleanup</span>
                  <strong className="cell-v">{rec.estimatedCleanupTime}</strong>
                </div>
              </div>

              <p className="rec-reasoning-line">
                <strong>Reasoning:</strong> {rec.reasoning}
              </p>

              <div className="modal-rec-actions">
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
                AI recommendations are advisory. Municipal operators hold final authority.
              </p>
            </div>
          )}

          {mode === 'recommendation' && !rec && (
            <div className="no-recommendation-box">
              <p>No AI recommendation stored for this complaint.</p>
              <button className="btn btn-secondary" onClick={handleOverride}>
                Proceed to Manual Dispatch →
              </button>
            </div>
          )}

          {/* ── 2. FINAL MUNICIPAL DECISION SECTION ───────────────── */}
          {mode === 'dispatch' && (
            <div className="modal-section-box dec-box">
              <div className="section-badge-top dec-badge">
                <ShieldCheck size={14} />
                <span>FINAL MUNICIPAL DECISION</span>
              </div>

              {rec && (
                <button
                  type="button"
                  className="btn-link back-to-rec"
                  onClick={() => setMode('recommendation')}
                >
                  ← View AI Recommendation
                </button>
              )}

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
                      {team.name} ({TEAM_TYPE_LABELS[team.type] || team.type}) — Active Load: {team.currentLoad || 0}
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
