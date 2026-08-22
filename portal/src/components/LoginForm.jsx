import React, { useState } from 'react';
import { signIn, resetPassword } from '../services/authService.js';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import AppLogoIcon from './AppLogoIcon.jsx';

/**
 * Professional Municipal Operations & Field Teams Login Interface.
 */
export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(
        err.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : err.code === 'auth/user-not-found'
            ? 'No municipal account found with this email.'
            : err.code === 'auth/too-many-requests'
              ? 'Too many failed attempts. Please try again later.'
              : `Login failed: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your account email address above to reset your password.');
      return;
    }
    setError(null);
    setSuccess(null);
    setResetLoading(true);

    try {
      await resetPassword(email.trim());
      setSuccess(`Password reset email sent to ${email.trim()}. Please check your inbox.`);
      setShowForgot(false);
    } catch (err) {
      setError(`Password reset failed: ${err.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand-icon">
            <AppLogoIcon size={24} className="text-white" />
          </div>
          <h1>SwachhLens</h1>
          <h2 className="login-subtitle-role">Municipal Operations</h2>
          <p className="login-portal-desc">
            Authorized access for municipal operations and field response teams.
          </p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="login-success">
            <CheckCircle2 size={15} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={13} />
              <span>Official Email</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. operator@municipality.gov"
              required
              disabled={loading || resetLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div className="password-label-row">
              <label htmlFor="password">
                <KeyRound size={13} />
                <span>Password</span>
              </label>
              <button
                type="button"
                className="forgot-link-btn"
                onClick={() => setShowForgot(!showForgot)}
                disabled={loading || resetLoading}
              >
                Forgot Password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter account password"
              required={!showForgot}
              disabled={loading || resetLoading}
              autoComplete="current-password"
            />
          </div>

          {showForgot && (
            <div className="forgot-password-box">
              <p className="forgot-instruction">
                Click below to send a secure password reset link to your official email.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-full btn-small"
                onClick={handleForgotPassword}
                disabled={resetLoading || !email.trim()}
              >
                {resetLoading ? 'Sending Reset Link...' : 'Send Password Reset Email'}
              </button>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full login-submit-btn"
            disabled={loading || resetLoading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer-security">
          <ShieldCheck size={14} className="text-emerald" />
          <span>Access is restricted to authorized municipal personnel.</span>
        </div>
      </div>
    </div>
  );
}
