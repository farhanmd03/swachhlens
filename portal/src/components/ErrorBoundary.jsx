import React from 'react';

/**
 * SwachhLens Municipal Portal — Global Error Boundary
 *
 * Catches unexpected React/runtime errors in municipal & supervisor consoles
 * and renders a safe recovery UI instead of a blank screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unexpected application error' };
  }

  componentDidCatch(error, info) {
    console.error('[SwachhLens Portal] Unhandled runtime error:', error, info);
  }

  handleReload() {
    window.location.reload();
  }

  handleHome() {
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            padding: '24px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#f8fafc',
          }}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '36px 28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                background: '#450a0a',
                border: '1px solid #991b1b',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '26px',
              }}
            >
              ⚠️
            </div>

            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#f1f5f9',
                marginBottom: '8px',
              }}
            >
              Operational Workspace Interrupted
            </h2>

            <p
              style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '20px',
                lineHeight: '1.5',
              }}
            >
              The municipal portal encountered an unexpected runtime exception.
              Operational data in Firestore is unaffected. Please reload the console
              or return to the dashboard.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '11px 20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                ↺ Reload Console
              </button>
              <button
                onClick={this.handleHome}
                style={{
                  background: '#334155',
                  color: '#cbd5e1',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ← Return to Dashboard
              </button>
            </div>

            <p
              style={{
                marginTop: '20px',
                fontSize: '0.75rem',
                color: '#64748b',
              }}
            >
              SwachhLens Operations Command & Decision Support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
