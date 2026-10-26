import React from 'react';
import { AbsoluteFill, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { Video } from 'lucide-react';
import { color, fonts } from '../theme';

// Shows real footage when a file is set in src/assets.ts, otherwise a labelled placeholder
// that also marks where the signer's face and hands must stay visible.
export const Footage: React.FC<{
  src: string | null;
  title: string;
  notes: string[];
  people?: 1 | 2;
  muted?: boolean;
}> = ({ src, title, notes, people = 1 }) => {
  const frame = useCurrentFrame();
  if (src) {
    const isVideo = src.endsWith('.mp4') || src.endsWith('.webm');
    // Subtle cinematic slow drift for still photo footage so it breathes dynamically
    const zoom = interpolate(frame % 240, [0, 240], [1.0, 1.04], { extrapolateRight: 'clamp' });
    return (
      <AbsoluteFill style={{ overflow: 'hidden', background: '#203731' }}>
        {isVideo ? (
          <OffthreadVideo src={staticFile(src)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Img
            src={staticFile(src)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${zoom})`,
              transformOrigin: 'center 40%',
            }}
          />
        )}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: '#203731', color: '#e3ece0', fontFamily: fonts.body }}>
      <SignerGuide people={people} />
      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: 1060,
          border: '3px dashed #89c9ae66',
          borderRadius: 32,
          padding: '36px 40px',
          background: '#162b28cc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: '#89c9ae', fontSize: 30, fontWeight: 700, letterSpacing: 3 }}>
          <Video size={38} /> FOOTAGE PLACEHOLDER
        </div>
        <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 46, lineHeight: 1.2, margin: '18px 0 14px' }}>{title}</div>
        {notes.map((n) => (
          <div key={n} style={{ fontSize: 28, lineHeight: 1.5, color: '#a7b7ab' }}>
            · {n}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// A neutral head-and-shoulders outline showing where to frame the signer. It shows no handshape.
const SignerGuide: React.FC<{ people: 1 | 2 }> = ({ people }) => {
  const half = people === 1 ? 330 : 225;
  const one = (cx: number, key: string) => (
    <g key={key} fill="none" stroke="#89c9ae55" strokeWidth={4} strokeDasharray="14 12">
      <circle cx={cx} cy={540} r={half * 0.33} />
      <path d={`M${cx - half * 0.76} 1030 C ${cx - half * 0.72} 760, ${cx + half * 0.72} 760, ${cx + half * 0.76} 1030`} />
      <rect x={cx - half} y={380} width={half * 2} height={660} rx={40} stroke="#efbe6466" />
    </g>
  );
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      {people === 1 ? one(540, 'a') : [one(300, 'a'), one(780, 'b')]}
      <text x={540} y={1010} textAnchor="middle" fill="#efbe64aa" fontSize={26} fontFamily="sans-serif" letterSpacing={2}>
        KEEP FACE, HANDS AND UPPER BODY INSIDE THE GOLD BOX
      </text>
    </svg>
  );
};
