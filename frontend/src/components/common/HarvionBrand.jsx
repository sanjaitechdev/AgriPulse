import React from 'react';

export default function HarvionBrand({ size = 38, showText = true, textColor = '#1C3624', subtitle = null, className = '' }) {
  return (
    <div className={`harvion-brand-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {/* ── Bold, High-Visibility Vector Logo Icon ── */}
      <div style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: '#1B4332',
        border: '1.5px solid rgba(82, 183, 136, 0.4)',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <svg
          width={Math.round(size * 0.72)}
          height={Math.round(size * 0.72)}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Leaf Arc (Left) */}
          <path
            d="M8 28C8 17.5 15 9 26 7C26 18.5 19 28 8 28Z"
            fill="#52B788"
          />
          {/* Leaf Inner Vein */}
          <path
            d="M9 27C14 21 19 15 24 9"
            stroke="#1B4332"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Golden Harvest Grain 1 (Top Right) */}
          <path
            d="M25 10C29 10 33 13 33 17C29 17 25 14 25 10Z"
            fill="#E9C46A"
          />
          {/* Golden Harvest Grain 2 (Mid Right) */}
          <path
            d="M23 18C28 18 32 21 32 25C28 25 23 22 23 18Z"
            fill="#E9C46A"
          />
          {/* Golden Harvest Grain 3 (Bottom) */}
          <path
            d="M19 25C24 25 28 28 28 32C24 32 19 29 19 25Z"
            fill="#E9C46A"
          />
          {/* Central Stem Root */}
          <path
            d="M10 33C14 31 18 27 22 21"
            stroke="#E9C46A"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ── Brand Typography: Clean, Solid Professional Text ── */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div style={{
            fontWeight: 900,
            fontSize: Math.max(16, Math.round(size * 0.48)),
            color: textColor,
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>HARVION</span>
            <span>AI</span>
          </div>
          {subtitle && (
            <div style={{
              fontSize: 11,
              color: textColor === '#FAF7F2' ? 'rgba(250,247,242,0.85)' : '#64748B',
              fontWeight: 600,
              marginTop: 1,
            }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
