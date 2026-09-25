import React from 'react';

/**
 * SwachhLens Citizen App — Global Error Boundary
 *
 * Catches unexpected React/runtime errors and renders a safe recovery UI
 * instead of a blank screen. Technical detail is logged to console only.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unexpected error' };
  }

  componentDidCatch(error, info) {
    console.error('[SwachhLens] Unhandled runtime error:', error, info);
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
            background: '#f4f8f6',
            padding: '24px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '32px 24px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 4px 6px -1px rgba(18,48,42,0.06)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px',
              }}
            >
              ⚠️
            </div>

            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#12302a',
                marginBottom: '8px',
              }}
            >
              Something went wrong
            </h2>

            <p
              style={{
                fontSize: '0.85rem',
                color: '#64748b',
                marginBottom: '20px',
                lineHeight: '1.5',
              }}
            >
              SwachhLens encountered an unexpected error. Your report data was
              not lost. Please retry or return to the home screen.
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
                  gap: '6px',
                }}
              >
                ↺ Retry
              </button>
              <button
                onClick={this.handleHome}
                style={{
                  background: 'transparent',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ← Return to Home
              </button>
            </div>

            <p
              style={{
                marginTop: '16px',
                fontSize: '0.75rem',
                color: '#94a3b8',
              }}
            >
              SwachhLens · Municipal Waste Response System
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
