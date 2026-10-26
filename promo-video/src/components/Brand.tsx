import React from 'react';
import { Hand } from 'lucide-react';
import { color, fonts } from '../theme';

// Maya, the sprout companion. Copied unchanged from the app (src/main.tsx, Sprout).
export const Sprout: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <svg width={size} height={size * (250 / 240)} viewBox="0 0 240 250" style={style} role="img" aria-label="Maya, a friendly sprout companion">
    <ellipse cx="120" cy="229" rx="67" ry="10" fill="#284e3b" opacity=".1" />
    <path d="M117 57C68 60 58 24 62 9c32-2 61 13 61 45" fill="#35896c" />
    <path d="M122 55c-1-30 26-51 55-49 1 27-18 52-55 49" fill="#63a16a" />
    <path d="M75 184l-9 35c-2 10 27 14 32 3l10-28M139 192l9 30c4 10 31 5 27-6l-11-36" fill="#2d7c63" />
    <path d="M63 108C20 96 12 130 38 143l25-1M178 109c38-24 56-3 36 21l-29 18" fill="#2d7c63" />
    <path d="M59 92c0-31 31-48 62-48s65 19 65 48v70c0 33-28 48-64 48s-64-17-64-47z" fill="#68a77d" />
    <path d="M69 106c0-21 26-35 52-35s54 14 54 35v42c0 32-25 48-54 48s-52-16-52-48z" fill="#c3dca1" />
    <ellipse cx="96" cy="121" rx="10" ry="14" fill="#244f40" />
    <ellipse cx="148" cy="121" rx="10" ry="14" fill="#244f40" />
    <circle cx="99" cy="117" r="3" fill="white" />
    <circle cx="151" cy="117" r="3" fill="white" />
    <ellipse cx="80" cy="143" rx="12" ry="7" fill="#e8ae89" />
    <ellipse cx="164" cy="143" rx="12" ry="7" fill="#e8ae89" />
    <path d="M110 146q12 15 24 0" fill="none" stroke="#244f40" strokeWidth="5" strokeLinecap="round" />
    <path d="M189 93l10-23M202 100l18-10" stroke="#efbe64" strokeWidth="5" strokeLinecap="round" />
    <path d="M47 174l6 9m-18-5 7 4" stroke="#efbe64" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// The app's logo: a rounded green tile tilted -9deg with a hand icon, then "kamayo" and a gold dot.
// Matches .brand, .brand-mark and .brand-dot in src/styles.css.
export const BrandMark: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      width: size,
      height: size * (39 / 36),
      borderRadius: size * (12 / 36),
      background: color.green,
      color: '#fff',
      display: 'grid',
      placeItems: 'center',
      transform: 'rotate(-9deg)',
    }}
  >
    <Hand size={size * 0.64} strokeWidth={2} />
  </div>
);

export const Wordmark: React.FC<{ fontSize: number; style?: React.CSSProperties }> = ({ fontSize, style }) => (
  <span
    style={{
      fontFamily: fonts.heading,
      fontWeight: 800,
      fontSize,
      letterSpacing: -fontSize * 0.045,
      color: color.green,
      lineHeight: 1,
      ...style,
    }}
  >
    kamayo<span style={{ color: color.gold }}>.</span>
  </span>
);

export const Logo: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
    <BrandMark size={size} />
    <Wordmark fontSize={size * 0.86} />
  </div>
);
