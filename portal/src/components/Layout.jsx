import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { signOut } from '../services/authService.js';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Sparkles,
  MapPin,
  ListOrdered,
  Shield,
} from 'lucide-react';

/**
 * Municipal Operations Command Center App Shell with dark slate sidebar navigation.
 */
export default function Layout({ user }) {
  const location = useLocation();

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      window.location.href = `/#${id}`;
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="portal-layout">
      <aside className="portal-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <Sparkles size={20} className="text-white" />
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
            <div className="user-avatar-circle">
              <Shield size={16} />
            </div>
            <div className="user-text-info">
              <span className="user-role-label">Municipal Officer</span>
              <span className="sidebar-user" title={user?.email}>
                {user?.email || 'Admin User'}
              </span>
            </div>
          </div>
          <button className="btn btn-secondary btn-small btn-logout" onClick={signOut}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="portal-main">
        <header className="portal-top-bar">
          <div className="topbar-live-status">
            <span className="pulse-indicator"></span>
            <span className="live-status-text">Live Operations Active</span>
          </div>
          <span className="portal-tagline">"See waste. Report it. Route the response."</span>
        </header>

        <div className="portal-content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
