import React from 'react';

export default function HarvionBrand({ size = 38, showText = true, textColor = '#1C3624', subtitle = null, className = '' }) {
  return (
    <div className={`harvion-brand-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {/* ── 3D Faceted Emerald & Gold Emblem ── */}
      <div style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(82, 183, 136, 0.35)',
        background: '#0B1E13',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
      }}>
        <img
          src="/images/harvion_symbol.jpg"
          alt="Harvion AI Logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scale(1.02)',
          }}
        />
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
            gap: 5,
          }}>
            <span>HARVION</span>
            <span style={{
              fontWeight: 900,
              opacity: 0.95,
              color: textColor === '#FAF7F2' ? '#88D49E' : '#2D6A4F',
            }}>
              AI
            </span>
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
