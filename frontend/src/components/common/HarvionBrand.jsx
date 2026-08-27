import React from 'react';

export default function HarvionBrand({ size = 38, showText = true, textColor = '#1C3624', subtitle = null, className = '' }) {
  return (
    <div className={`harvion-brand-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {/* ── Luxury Minimalist Emblem ── */}
      <div style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        overflow: 'hidden',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.12)',
        border: '1px solid rgba(22, 101, 52, 0.2)',
        background: '#0D3820',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <img
          src="/images/harvion_logo.jpg"
          alt="Harvion AI"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* ── Brand Typography: Clean, Solid Professional Text (No multicolor AI gradient) ── */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div style={{
            fontWeight: 900,
            fontSize: Math.max(16, Math.round(size * 0.46)),
            color: textColor,
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            <span>HARVION</span>
            <span>AI</span>
          </div>
          {subtitle && (
            <div style={{
              fontSize: 11,
              color: textColor === '#FAF7F2' ? 'rgba(250,247,242,0.75)' : '#64748B',
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
