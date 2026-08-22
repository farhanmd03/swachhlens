import React, { useState } from 'react';
import { Mail, Lock, LogIn, ArrowLeft, KeyRound } from 'lucide-react';
import { signInCitizen, resetPassword } from '../services/authService.js';
import AppLogoIcon from '../components/AppLogoIcon.jsx';

/**
 * SignInPage — Email/password sign-in for registered citizens.
 *
 * On successful sign-in, App.jsx's onAuthStateChanged fires automatically
 * and transitions to the main app shell at Home (/).
 */
export default function SignInPage({ onNavigate, onSignInSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInCitizen({ email: email.trim(), password });
      if (onSignInSuccess) {
        onSignInSuccess();
      }
    } catch (err) {
      setError(friendlyAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email address above, then click Forgot Password.');
      return;
    }
    setResetLoading(true);
    setError(null);
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (err) {
      setError(friendlyAuthError(err.code));
    } finally {
      setResetLoading(false);
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
        <p className="auth-brand-tagline">Sign in to your account</p>
      </div>

      <div className="auth-card">
        <form onSubmit={handleSignIn} noValidate>
          <div className="form-group">
            <label htmlFor="si-email">
              <Mail size={13} />
              <span>Email Address</span>
            </label>
            <input
              id="si-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="si-password">
              <Lock size={13} />
              <span>Password</span>
            </label>
            <input
              id="si-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && <p className="error-message" style={{ marginBottom: '12px' }}>{error}</p>}
          {resetSent && (
            <p className="success-message" style={{ marginBottom: '12px' }}>
              Password reset email sent. Check your inbox.
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            <LogIn size={16} />
            <span>{loading ? 'Signing in…' : 'Sign In'}</span>
          </button>
        </form>

        {/* Forgot Password */}
        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <button
            className="btn-link"
            onClick={handleForgotPassword}
            disabled={resetLoading}
            type="button"
          >
            <KeyRound size={13} />
            <span>{resetLoading ? 'Sending…' : 'Forgot Password?'}</span>
          </button>
        </div>

        <div className="auth-divider">
          <span>New to SwachhLens?</span>
        </div>

        <button
          className="btn btn-outline btn-full"
          onClick={() => onNavigate('register')}
          type="button"
        >
          Create Account
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
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}
