import React from 'react';

/** Simple watch mark. Keep in sync with app/icon.svg (the browser-tab favicon). */
export function WatchLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M11.5 7.5 12.5 2h7l1 5.5M11.5 24.5l1 5.5h7l1-5.5"
        fill="#374154"
        stroke="#b58220"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <rect x="25.6" y="14.2" width="3" height="3.6" rx="0.8" fill="#dfb851" />
      <circle cx="16" cy="16" r="10" fill="#0a0c10" stroke="#dfb851" strokeWidth="2.2" />
      <path d="M16 8.2v2M23.8 16h-2M16 23.8v-2M8.2 16h2" stroke="#dfb851" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 16V10.8" stroke="#f8ecc5" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 16l4.2 2.6" stroke="#dfb851" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="16" r="1.3" fill="#dfb851" />
    </svg>
  );
}
