'use client';

import React from 'react';

export function MechanicalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20 select-none">
      {/* Primary Balance Wheel & Escape Wheel (Top Right) */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full border border-gold-500/20 animate-gear-spin">
        <svg viewBox="0 0 200 200" className="w-full h-full text-gold-500/30">
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 8" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="45" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 12" />
          {/* Balance Spokes */}
          <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="1.5" />
          <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="1.5" />
          <line x1="36" y1="36" x2="164" y2="164" stroke="currentColor" strokeWidth="1" />
          <line x1="36" y1="164" x2="164" y2="36" stroke="currentColor" strokeWidth="1" />
          {/* Balance Screws */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x = 100 + 88 * Math.cos(rad);
            const y = 100 + 88 * Math.sin(rad);
            return <circle key={angle} cx={x} cy={y} r="2.5" fill="currentColor" />;
          })}
        </svg>
      </div>

      {/* Meshed Secondary Pinion Gear (Center Left) */}
      <div className="absolute top-1/3 -left-48 w-80 h-80 rounded-full border border-steel-400/20 animate-gear-reverse">
        <svg viewBox="0 0 200 200" className="w-full h-full text-steel-400/20">
          <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 6" />
          <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="20" fill="none" stroke="currentColor" strokeWidth="2" />
          {/* Gear teeth spokes */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + 50 * Math.cos(rad);
            const y1 = 100 + 50 * Math.sin(rad);
            const x2 = 100 + 85 * Math.cos(rad);
            const y2 = 100 + 85 * Math.sin(rad);
            return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2" />;
          })}
        </svg>
      </div>

      {/* Subtle Hairspring Spiral (Bottom Right) */}
      <div className="absolute -bottom-40 right-1/4 w-72 h-72 opacity-15">
        <svg viewBox="0 0 100 100" className="w-full h-full text-gold-400">
          <path
            d="M 50 50 m 0 -5 a 5 5 0 0 1 0 10 a 10 10 0 0 1 0 -20 a 15 15 0 0 1 0 30 a 20 20 0 0 1 0 -40 a 25 25 0 0 1 0 50 a 30 30 0 0 1 0 -60 a 35 35 0 0 1 0 70 a 40 40 0 0 1 0 -80"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
          />
        </svg>
      </div>
    </div>
  );
}
