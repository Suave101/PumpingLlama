import React from 'react';

// Lowercase "p" whose bowl is an accepting state (double ring), on a 64-unit grid
export const LogoMark: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
    <path d="M17 24V55" className="stroke-crimson-500" strokeWidth="6" strokeLinecap="round" />
    <circle cx="32" cy="24" r="15" className="stroke-crimson-500" strokeWidth="6" />
    <circle cx="32" cy="24" r="6.5" className="stroke-gold-400" strokeWidth="4" />
  </svg>
);
