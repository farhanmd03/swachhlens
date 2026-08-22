import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { House, Camera, ClipboardList, UserRound } from 'lucide-react';
import AppLogoIcon from './AppLogoIcon.jsx';

/**
 * App shell with mobile-first bottom navigation for the citizen app.
 */
export default function Layout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo-icon">
            <AppLogoIcon size={18} className="logo-sparkle" />
          </div>
          <div className="brand-text">
            <span className="brand-name">SwachhLens</span>
            <span className="brand-tagline">Citizen Portal</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="app-nav" aria-label="Main Navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <House size={20} strokeWidth={2} className="nav-icon" />
          <span className="nav-text">Home</span>
        </NavLink>

        <NavLink
          to="/report"
          className={({ isActive }) => `nav-link nav-link-cta ${isActive ? 'active' : ''}`}
        >
          <div className="nav-cta-bubble">
            <Camera size={20} strokeWidth={2.2} className="nav-icon" />
          </div>
          <span className="nav-text">Report</span>
        </NavLink>

        <NavLink
          to="/my-reports"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <ClipboardList size={20} strokeWidth={2} className="nav-icon" />
          <span className="nav-text">My Reports</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <UserRound size={20} strokeWidth={2} className="nav-icon" />
          <span className="nav-text">Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
