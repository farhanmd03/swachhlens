import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from '../services/authService.js';
import { getActiveTeams } from '../services/teamService.js';
import { getTeamWithZone } from '../services/dispatchRecommendationService.js';
import {
  HardHat,
  ClipboardList,
  Users,
  LogOut,
  Sparkles,
  AlertTriangle,
  MapPin,
  Truck,
  ShieldAlert,
} from 'lucide-react';

/**
 * Field Supervisor Operations Workspace App Shell.
 * Scoped strictly to the supervisor's assigned response team.
 */
export default function SupervisorLayout({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [teamData, setTeamData] = useState(null);

  useEffect(() => {
    if (user?.teamId) {
      getActiveTeams().then((teams) => {
        const found = teams.find((t) => t.id === user.teamId);
        if (found) {
          setTeamData(getTeamWithZone(found));
        }
      }).catch(console.error);
    }
  }, [user?.teamId]);

  const handleConfirmSignOut = async () => {
    setShowSignOutModal(false);
    await signOut();
  };

  const teamName = teamData?.name || user?.teamId || 'Response Unit';
  const teamZone = teamData?.zoneShort || teamData?.primaryZone || 'Operational Zone';
  const crewMembers = teamData?.memberCount || 4;

  return (
    <div className="portal-layout supervisor-layout">
      <aside className="portal-sidebar supervisor-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-box supervisor-brand-icon">
            <HardHat size={20} className="text-white" />
          </div>
          <div className="brand-titles">
            <h1>SwachhLens</h1>
            <span className="sidebar-subtitle supervisor-subtitle">Field Operations</span>
          </div>
        </div>

        {/* ── Supervisor Team Identity Badge ───────────────────────── */}
        <div className="supervisor-team-badge-box">
          <div className="supervisor-team-header">
            <span className="sup-badge-role">FIELD SUPERVISOR</span>
            <span className="sup-team-zone">{teamZone}</span>
          </div>
          <strong className="sup-team-title">{teamName}</strong>
          <div className="sup-team-meta">
            <span><Users size={12} /> {crewMembers} Crew Members</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Supervisor Navigation">
          <div className="nav-section-label">FIELD WORKSPACE</div>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <ClipboardList size={18} className="sidebar-icon" />
            <span className="sidebar-label">Assigned Jobs</span>
          </NavLink>

          <NavLink
            to="/my-team"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Users size={18} className="sidebar-icon" />
            <span className="sidebar-label">My Team</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar-circle" style={{ background: '#f59e0b', color: '#fff' }}>
              <HardHat size={16} />
            </div>
            <div className="user-text-info">
              <span className="user-role-label" style={{ color: '#fbbf24', fontWeight: '800' }}>
                Field Supervisor
              </span>
              <span className="sidebar-user" title={user?.email}>
                {user?.email || 'Supervisor'}
              </span>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-small btn-logout"
            onClick={() => setShowSignOutModal(true)}
            type="button"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="portal-main">
        <header className="portal-top-bar supervisor-top-bar">
          <div className="topbar-live-status">
            <span className="pulse-indicator" style={{ background: '#f59e0b' }}></span>
            <span className="live-status-text" style={{ color: '#b45309' }}>
              Field Response Active • {teamName}
            </span>
          </div>
          <span className="portal-tagline">"On-site execution, verified evidence, timely resolution."</span>
        </header>

        <div className="portal-content-body">
          <Outlet />
        </div>
      </main>

      {/* ── SIGN-OUT CONFIRMATION MODAL ─────────────────────────── */}
      {showSignOutModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px', textAlign: 'center' }}>
            <div style={{ color: '#f59e0b', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
              <AlertTriangle size={36} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Sign out of Field Operations?
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
              Are you sure you want to end this supervisor session? Any unsaved completion forms will be lost.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => setShowSignOutModal(false)}
                type="button"
                autoFocus
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-full"
                onClick={handleConfirmSignOut}
                type="button"
                style={{ background: '#dc2626', color: '#fff', borderColor: '#dc2626' }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
