import React from 'react';

/**
 * Loading spinner with optional message.
 */
export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}
