import React, { useState } from 'react';
import { getCropImage, getCropEmoji } from '../../utils/cropImages';

// Color map for vibrant, natural background gradients when fallback or loading
const CROP_COLOR_MAP = {
  'tomato': { bg: 'linear-gradient(135deg, #FF6B6B 0%, #EE5253 100%)', text: '#FFFFFF', border: '#FF7675' },
  'onion': { bg: 'linear-gradient(135deg, #E17055 0%, #D63031 100%)', text: '#FFFFFF', border: '#FAB1A0' },
  'potato': { bg: 'linear-gradient(135deg, #FDCB6E 0%, #E17055 100%)', text: '#2D3436', border: '#FFEAA7' },
  'brinjal': { bg: 'linear-gradient(135deg, #6C5CE7 0%, #4834D4 100%)', text: '#FFFFFF', border: '#A29BFE' },
  'chilli': { bg: 'linear-gradient(135deg, #00B894 0%, #009432 100%)', text: '#FFFFFF', border: '#55E6C1' },
  'capsicum': { bg: 'linear-gradient(135deg, #2ED573 0%, #10AC84 100%)', text: '#FFFFFF', border: '#7BED9F' },
  'cabbage': { bg: 'linear-gradient(135deg, #55E6C1 0%, #1DD1A1 100%)', text: '#1E272E', border: '#A3CB38' },
  'cauliflower': { bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', text: '#2E7D32', border: '#81C784' },
  'carrot': { bg: 'linear-gradient(135deg, #FF7675 0%, #E67E22 100%)', text: '#FFFFFF', border: '#F39C12' },
  'beetroot': { bg: 'linear-gradient(135deg, #8854D0 0%, #381460 100%)', text: '#FFFFFF', border: '#A55EEA' },
  'banana': { bg: 'linear-gradient(135deg, #F9CA24 0%, #F0932B 100%)', text: '#2D3436', border: '#F6E58D' },
  'mango': { bg: 'linear-gradient(135deg, #FECA57 0%, #FF9F43 100%)', text: '#2D3436', border: '#FFD32A' },
  'amla': { bg: 'linear-gradient(135deg, #74B9FF 0%, #0984E3 100%)', text: '#FFFFFF', border: '#81ECEC' },
  'barley': { bg: 'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)', text: '#2D3436', border: '#FFEAA7' },
  'wheat': { bg: 'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)', text: '#2D3436', border: '#FFEAA7' },
  'rice': { bg: 'linear-gradient(135deg, #81ECEC 0%, #00CEC9 100%)', text: '#2D3436', border: '#55E6C1' },
  'beans': { bg: 'linear-gradient(135deg, #55E6C1 0%, #009432 100%)', text: '#FFFFFF', border: '#2ED573' },
  'ash gourd': { bg: 'linear-gradient(135deg, #DFE6E9 0%, #B2BEC3 100%)', text: '#2D3436', border: '#636E72' },
  'cotton': { bg: 'linear-gradient(135deg, #FFFFFF 0%, #DFE6E9 100%)', text: '#2D3436', border: '#B2BEC3' },
  'sugarcane': { bg: 'linear-gradient(135deg, #A8E6CF 0%, #56AB2F 100%)', text: '#1E272E', border: '#A8E063' },
};

function getCropColors(cropName = '') {
  const clean = cropName.toLowerCase();
  for (const [key, val] of Object.entries(CROP_COLOR_MAP)) {
    if (clean.includes(key)) return val;
  }
  return { bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', text: '#1B5E20', border: '#81C784' };
}

/**
 * Robust CropAvatar Component
 * Attempts to load high-res photography; if network fails, seamlessly falls back to 
 * rich 3D emoji + natural gradient background so NO broken image box ever appears!
 */
export default function CropAvatar({ cropName = '', size = 48, borderRadius = 12, style = {}, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getCropImage(cropName);
  const emoji = getCropEmoji(cropName);
  const colors = getCropColors(cropName);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius,
        overflow: 'hidden',
        border: `1.5px solid ${colors.border}`,
        background: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        position: 'relative',
        userSelect: 'none',
        ...style,
      }}
    >
      {!imgError && imageUrl ? (
        <img
          src={imageUrl}
          alt={cropName}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <span style={{ fontSize: Math.max(14, Math.round(size * 0.52)), lineHeight: 1 }}>
          {emoji}
        </span>
      )}
    </div>
  );
}
