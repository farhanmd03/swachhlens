import React, { useState, useEffect } from 'react';
import { getActiveTeams } from '../services/teamService.js';
import { getTeamWithZone } from '../services/dispatchRecommendationService.js';
import { TEAM_TYPE_LABELS } from '../config/constants.js';
import {
  Truck,
  Recycle,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  MapPin,
  Compass,
} from 'lucide-react';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getActiveTeams()
      .then((data) => {
        const enriched = (data || []).map(getTeamWithZone);
        setTeams(enriched);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const renderTeamIcon = (type) => {
    switch (type) {
      case 'mini_truck':
        return <Truck size={22} className="team-type-icon" />;
      case 'recycling_partner':
        return <Recycle size={22} className="team-type-icon" />;
      case 'manual_cleanup':
      default:
        return <Users size={22} className="team-type-icon" />;
    }
  };

  const getLoadBadgeClass = (load) => {
    if (load >= 3) return 'load-heavy';
    if (load >= 1) return 'load-active';
    return 'load-idle';
  };

  return (
    <div className="teams-page">
      <div className="page-header">
        <h2>Operational Response Teams</h2>
        <p className="page-subtitle">
          Real-time workload, capability, and primary operational zones of municipal cleanup units and partner fleets.
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading team units...</div>
      ) : teams.length === 0 ? (
        <div className="empty-state-card">
          <p>No active teams found. Run seed-teams script to initialize default units.</p>
        </div>
      ) : (
        <div className="teams-grid">
          {teams.map((team) => (
            <div key={team.id} className="team-card">
              <div className="team-card-top">
                <div className="team-icon-circle">
                  {renderTeamIcon(team.type)}
                </div>
                <span className={`team-status-pill ${team.active ? 'status-active' : 'status-inactive'}`}>
                  {team.active ? (
                    <>
                      <CheckCircle2 size={12} />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={12} />
                      <span>Inactive</span>
                    </>
                  )}
                </span>
              </div>

              <h3 className="team-name">{team.name}</h3>
              <p className="team-type-label">
                {TEAM_TYPE_LABELS[team.type] || team.type}
              </p>

              <div className="team-meta-box">
                <div className="team-meta-row">
                  <span className="meta-k">Primary Operational Zone:</span>
                  <div className="zone-pill-box">
                    <MapPin size={12} className="text-emerald" />
                    <span className="team-zone-val">{team.primaryZone}</span>
                  </div>
                </div>

                <div className="team-meta-row">
                  <span className="meta-k">Current Dispatch Load:</span>
                  <span className={`load-indicator ${getLoadBadgeClass(team.currentLoad || 0)}`}>
                    <Activity size={12} />
                    <span>{team.currentLoad || 0} active task{(team.currentLoad || 0) !== 1 ? 's' : ''}</span>
                  </span>
                </div>

                <div className="team-meta-row">
                  <span className="meta-k">Unit ID:</span>
                  <code className="team-id-code">{team.id}</code>
                </div>
              </div>

              <div className="team-footer-note">
                {team.capabilityDescription ||
                  (team.type === 'mini_truck'
                    ? 'Equipped for large volume accumulation & heavy rubble'
                    : team.type === 'recycling_partner'
                    ? 'Routes segregated plastic & e-waste for material recovery'
                    : 'Standard manual sweeping crew & local bin clearance')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
