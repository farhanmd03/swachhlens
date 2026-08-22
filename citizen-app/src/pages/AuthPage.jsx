import React, { useState } from 'react';
import { UserRound, LogIn, UserPlus } from 'lucide-react';
import { signInAsGuest } from '../services/authService.js';
import AppLogoIcon from '../components/AppLogoIcon.jsx';

/**
 * AuthPage — Citizen auth landing screen.
 *
 * Presents three mutually exclusive auth paths:
 *   1. Sign In   — existing registered citizen
 *   2. Create Account — new registration
 *   3. Continue as Guest — anonymous session (no account required)
 *
 * Navigating between these options is handled by the `onNavigate` prop
 * rather than React Router so the auth screens sit outside the normal
 * Layout/nav shell.
 */
export default function AuthPage({ onNavigate }) {
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGuest = async () => {
    setGuestLoading(true);
    setError(null);
    try {
      window.history.replaceState(null, '', '/');
      await signInAsGuest();
      // App.jsx onAuthStateChanged will pick up the anonymous user and
      // automatically transition to the main app shell at Home (/).
    } catch (err) {
      setError('Could not start a guest session. Please try again.');
      console.error('Guest sign-in error:', err);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Brand Header */}
      <div className="auth-brand">
        <div className="auth-brand-icon">
          <AppLogoIcon size={28} className="auth-brand-sparkle" />
        </div>
        <h1 className="auth-brand-name">SwachhLens</h1>
        <p className="auth-brand-tagline">Smart Waste Reporting for Cleaner Cities</p>
      </div>

      {/* Auth Option Cards */}
      <div className="auth-card">
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={() => onNavigate('sign-in')}
        >
          <LogIn size={18} />
          <span>Sign In</span>
        </button>

        <button
          className="btn btn-outline btn-full btn-lg"
          style={{ marginTop: '12px' }}
          onClick={() => onNavigate('register')}
        >
          <UserPlus size={18} />
          <span>Create Account</span>
        </button>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button
          className="btn btn-secondary btn-full"
          onClick={handleGuest}
          disabled={guestLoading}
        >
          <UserRound size={16} />
          <span>{guestLoading ? 'Starting guest session…' : 'Continue as Guest'}</span>
        </button>

        <p className="auth-guest-note">
          Guest reports are linked to this browser session only and cannot be
          accessed after clearing browser data.
        </p>

        {error && <p className="error-message" style={{ marginTop: '12px' }}>{error}</p>}
      </div>
    </div>
  );
}
