import React, { useState, useEffect } from 'react';
import { getActiveTeams } from '../services/teamService.js';
import { getTeamWithZone } from '../services/dispatchRecommendationService.js';
import { subscribeToTeamComplaints } from '../services/complaintService.js';
import { TEAM_TYPE_LABELS } from '../config/constants.js';
import {
  Users,
  HardHat,
  Truck,
  MapPin,
  CheckCircle2,
  Activity,
  ShieldCheck,
  Award,
} from 'lucide-react';

export default function SupervisorTeamPage({ user }) {
  const [team, setTeam] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.teamId) {
      getActiveTeams()
        .then((teams) => {
          const found = teams.find((t) => t.id === user.teamId);
          if (found) {
            setTeam(getTeamWithZone(found));
          }
        })
        .catch(console.error);

      const unsub = subscribeToTeamComplaints(
        user.teamId,
        (data) => {
          setComplaints(data || []);
          setLoading(false);
        },
        (err) => {
          console.error(err);
          setLoading(false);
        }
      );

      return () => unsub();
    } else {
      setLoading(false);
    }
  }, [user?.teamId]);

  const activeJobs = complaints.filter((c) => c.status === 'assigned' || c.status === 'in_progress').length;
  const completedJobs = complaints.filter((c) => c.status === 'completed_pending_verification' || c.status === 'resolved').length;

  return (
    <div className="supervisor-team-page">
      <div className="page-header">
        <h2>My Response Team</h2>
        <p className="page-subtitle">
          Operational deployment details, crew roster, and assigned zone for your response unit.
        </p>
      </div>

      {loading ? (
        <div className="portal-loading-card">Loading team information...</div>
      ) : !team ? (
        <div className="empty-jobs-card">
          <p>No team configuration found for ID: <code>{user?.teamId}</code></p>
        </div>
      ) : (
        <div className="supervisor-team-grid">
          {/* Team Overview Card */}
          <div className="portal-card team-hero-card">
            <div className="team-hero-header">
              <div className="team-avatar-big">
                <HardHat size={32} className="text-amber" />
              </div>
              <div className="team-hero-info">
                <h3 className="team-hero-title">{team.name}</h3>
                <span className="team-hero-sub">
                  {TEAM_TYPE_LABELS[team.type] || team.type} • {team.zoneShort || team.primaryZone}
                </span>
              </div>
            </div>

            <div className="team-overview-metrics">
              <div className="overview-metric-item">
                <span className="metric-k">Crew Strength</span>
                <strong className="metric-v">{team.memberCount || 4} Members</strong>
              </div>
              <div className="overview-metric-item">
                <span className="metric-k">Active Tasks</span>
                <strong className="metric-v text-amber">{activeJobs}</strong>
              </div>
              <div className="overview-metric-item">
                <span className="metric-k">Completed / Verified</span>
                <strong className="metric-v text-emerald">{completedJobs}</strong>
              </div>
            </div>
          </div>

          {/* Operational Details Card */}
          <div className="portal-card">
            <h4 className="card-header-title">
              <MapPin size={16} />
              <span>Operational Zone &amp; Base Depot</span>
            </h4>

            <div className="reporter-details-grid">
              <div className="rep-row">
                <span className="rep-k">Primary Zone:</span>
                <strong className="rep-v">{team.primaryZone}</strong>
              </div>
              <div className="rep-row">
                <span className="rep-k">Base Coordinates:</span>
                <code className="geo-coords">
                  {team.baseLat != null ? `${team.baseLat.toFixed(4)}, ${team.baseLng.toFixed(4)}` : 'Coordinates registered'}
                </code>
              </div>
              <div className="rep-row">
                <span className="rep-k">Operational Scope:</span>
                <strong className="rep-v">{team.capabilityDescription || 'Routine municipal waste response'}</strong>
              </div>
            </div>
          </div>

          {/* Supervisor Information Card */}
          <div className="portal-card">
            <h4 className="card-header-title">
              <ShieldCheck size={16} />
              <span>Supervisor Identification</span>
            </h4>

            <div className="reporter-details-grid">
              <div className="rep-row">
                <span className="rep-k">Supervisor Account:</span>
                <strong className="rep-v">{user?.email || 'Field Supervisor'}</strong>
              </div>
              <div className="rep-row">
                <span className="rep-k">Role:</span>
                <strong className="rep-v" style={{ color: '#d97706' }}>Field Supervisor / Team Lead</strong>
              </div>
              <div className="rep-row">
                <span className="rep-k">Authority:</span>
                <strong className="rep-v">Unit Task Execution &amp; Evidence Submission</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
