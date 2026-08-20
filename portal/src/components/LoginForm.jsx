import React, { useState } from 'react';
import { signIn } from '../services/authService.js';

/**
 * Simple email/password login form for municipal users.
 */
export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(
        err.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : err.code === 'auth/user-not-found'
            ? 'No account found with this email.'
            : err.code === 'auth/too-many-requests'
              ? 'Too many failed attempts. Please try again later.'
              : `Login failed: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔍 SwachhLens</h1>
          <h2>Municipal Portal</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@municipality.gov"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="login-note">
          Municipal portal access is restricted to authorized personnel.
          Contact your administrator for account creation.
        </p>
      </div>
    </div>
  );
}
