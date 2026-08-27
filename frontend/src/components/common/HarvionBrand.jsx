import React from 'react';

export default function HarvionBrand({ size = 38, showText = true, textColor = '#1C3624', subtitle = null, className = '', variant = 'badge' }) {
  // If full master banner is requested
  if (variant === 'full') {
    return (
      <div className={`harvion-brand-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
        <img
          src="/images/harvion_master_logo.jpg"
          alt="HARVION AI — Agricultural Intelligence"
          style={{ height: size, width: 'auto', borderRadius: 8, objectFit: 'contain' }}
        />
      </div>
    );
  }

  return (
    <div className={`harvion-brand-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {/* ── Harvion AI Square Badge (Emblem + Name) ── */}
      <div style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        overflow: 'hidden',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.22)',
        border: '1.5px solid rgba(82, 183, 136, 0.4)',
        background: '#0F2417',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <img
          src="/images/harvion_badge.jpg"
          alt="Harvion AI"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* ── Brand Typography ── */}
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
            <span style={{ fontWeight: 900, color: textColor === '#FAF7F2' ? '#88D49E' : '#2D6A4F' }}>AI</span>
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
