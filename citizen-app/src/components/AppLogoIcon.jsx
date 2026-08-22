import React from 'react';

/**
 * SwachhLens Thematic Brand Icon (Option B: AI Scan Viewfinder + Waste Bin).
 */
export default function AppLogoIcon({ size = 20, className = '', strokeWidth = 2, color = 'currentColor', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Corner Brackets (AI Scan / Viewfinder) */}
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M3 17v2a2 2 0 0 0 2 2h2" />
      <path d="M17 21h2a2 2 0 0 0 2-2v-2" />

      {/* Waste Bin (Target Waste Glyph) */}
      <path d="M8 8h8" />
      <path d="M10 8V6.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V8" />
      <path d="M9 10l.6 6.4a1 1 0 0 0 1 .9h2.8a1 1 0 0 0 1-.9L15 10" />
      <path d="M12 11.5v3.5" />
    </svg>
  );
}
