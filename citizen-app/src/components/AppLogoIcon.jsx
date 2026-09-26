import React from 'react';

/**
 * SwachhLens Master Brand Icon (Approved Lens-Leaf Aperture + Eye Mark).
 */
export default function AppLogoIcon({ size = 24, className = '', alt = 'SwachhLens', style = {}, ...props }) {
  return (
    <img
      src="/assets/branding/swachhlens-mark.png"
      alt={alt}
      width={size}
      height={size}
      className={`app-brand-mark ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      {...props}
    />
  );
}
