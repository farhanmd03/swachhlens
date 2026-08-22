import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { signOut } from '../services/authService.js';
import {
  LayoutDashboard,
  Users,
  LogOut,
  MapPin,
  ListOrdered,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import AppLogoIcon from './AppLogoIcon.jsx';

/**
 * Municipal Operations Command Center App Shell with dark slate sidebar navigation,
 * top bar demo environment indicator, and desktop-friendly Sign-Out confirmation modal.
 */
export default function Layout({ user }) {
  const location = useLocation();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate(`/?section=${id}`);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleConfirmSignOut = async () => {
    setShowSignOutModal(false);
    await signOut();
  };

  return (
    <div className="portal-layout">
      <aside className="portal-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <AppLogoIcon size={20} className="text-white" />
          </div>
          <div className="brand-titles">
            <h1>SwachhLens</h1>
            <span className="sidebar-subtitle">Municipal Operations</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Portal Navigation">
          <div className="nav-section-label">OPERATIONS</div>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} className="sidebar-icon" />
            <span className="sidebar-label">Overview</span>
          </NavLink>

          <button
            type="button"
            className="sidebar-link sidebar-sublink"
            onClick={() => scrollToSection('map')}
          >
            <MapPin size={16} className="sidebar-icon" />
            <span className="sidebar-label">Live Map</span>
          </button>

          <button
            type="button"
            className="sidebar-link sidebar-sublink"
            onClick={() => scrollToSection('queue')}
          >
            <ListOrdered size={16} className="sidebar-icon" />
            <span className="sidebar-label">Priority Queue</span>
          </button>

          <div className="nav-section-label" style={{ marginTop: '12px' }}>
            RESOURCES
          </div>
          <NavLink
            to="/teams"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Users size={18} className="sidebar-icon" />
            <span className="sidebar-label">Response Teams</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar-circle" style={{ background: '#059669', color: '#fff' }}>
              <ShieldCheck size={16} />
            </div>
            <div className="user-text-info">
              <span className="user-role-label" style={{ color: '#34d399', fontWeight: '800' }}>
                Municipal Operator
              </span>
              <span className="sidebar-user" title={user?.email}>
                {user?.email || 'Authorized Operator'}
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
        <header className="portal-top-bar">
          <div className="topbar-live-status">
            <span className="pulse-indicator"></span>
            <span className="live-status-text">Live Municipal Operations Active</span>
            <span className="demo-env-badge">DEMO ENVIRONMENT • SYNTHETIC OPERATIONAL DATA</span>
          </div>
          <span className="portal-tagline">"See waste. Report it. Route the response."</span>
        </header>

        <div className="portal-content-body">
          <Outlet />
        </div>
      </main>

      {/* ── MUNICIPAL SIGN-OUT CONFIRMATION MODAL ─────────────────── */}
      {showSignOutModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px', textAlign: 'center' }}>
            <div style={{ color: '#f59e0b', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
              <AlertTriangle size={36} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Sign out of Municipal Portal?
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
              Are you sure you want to end this operator session? You will need to sign in again to access the operations command center.
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
