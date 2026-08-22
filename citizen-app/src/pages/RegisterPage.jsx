import React, { useState } from 'react';
import { User, Mail, Lock, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { registerCitizen } from '../services/authService.js';
import AppLogoIcon from '../components/AppLogoIcon.jsx';

/**
 * RegisterPage — New citizen account registration (email/password).
 *
 * On successful registration:
 *   1. Firebase Auth account is created.
 *   2. citizens/{uid} profile document is initialised with the name + email.
 *   3. App.jsx transitions to Home (/).
 */
export default function RegisterPage({ onNavigate }) {
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      window.history.replaceState(null, '', '/');
      await registerCitizen({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      // onAuthStateChanged in App.jsx handles transition to Home (/).
    } catch (err) {
      setError(friendlyAuthError(err.code));
    } finally {
      setLoading(false);
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
        <p className="auth-brand-tagline">Create your citizen account</p>
      </div>

      <div className="auth-card">
        <form onSubmit={handleRegister} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="reg-name">
              <User size={13} />
              <span>Full Name <span className="required">*</span></span>
            </label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="reg-email">
              <Mail size={13} />
              <span>Email Address <span className="required">*</span></span>
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="reg-password">
              <Lock size={13} />
              <span>Password <span className="required">*</span></span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="reg-confirm">
              <Lock size={13} />
              <span>Confirm Password <span className="required">*</span></span>
            </label>
            <input
              id="reg-confirm"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          {error && <p className="error-message" style={{ marginBottom: '12px' }}>{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            <UserPlus size={16} />
            <span>{loading ? 'Creating account…' : 'Create Account'}</span>
          </button>
        </form>

        <div className="auth-divider">
          <span>Already have an account?</span>
        </div>

        <button
          className="btn btn-outline btn-full"
          onClick={() => onNavigate('sign-in')}
          type="button"
        >
          Sign In
        </button>

        {/* Back */}
        <button
          className="btn-link auth-back-link"
          onClick={() => onNavigate('auth')}
          type="button"
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
}

/** Map Firebase Auth error codes to user-friendly messages. */
function friendlyAuthError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'Registration failed. Please try again.';
  }
}
