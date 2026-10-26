import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { captions, FPS, sec } from '../timing';
import { color, fonts, spring as springs } from '../theme';

// Captions sit in a reserved band at the bottom (y 1690-1880). Nothing else is placed there,
// and signers are framed above it, so captions never cover a face or hands.
// Subtitles highlight words as the voice speaks, guided by timing.
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cue = captions.find((c) => t >= c.from && t < c.to);
  if (!cue) return null;
  const local = frame - sec(cue.from);
  const out = sec(cue.to) - frame;
  const opacity = Math.min(interpolate(local, [0, 5], [0, 1], { extrapolateRight: 'clamp' }), interpolate(out, [0, 4], [0, 1], { extrapolateRight: 'clamp' }));

  const duration = cue.to - cue.from;
  const progress = Math.min(1, Math.max(0, (t - cue.from) / duration));
  const words = cue.text.split(' ');
  const activeWordIdx = Math.floor(progress * (words.length + 1));

  return (
    <div style={{ position: 'absolute', left: 60, right: 60, bottom: 50, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          opacity,
          background: 'rgba(32, 55, 49, 0.94)',
          color: '#fff',
          fontFamily: fonts.body,
          fontWeight: 650,
          fontSize: 46,
          lineHeight: 1.35,
          textAlign: 'center',
          padding: '22px 36px',
          borderRadius: 24,
          maxWidth: 960,
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          border: '1px solid rgba(137, 201, 174, 0.2)',
        }}
      >
        {words.map((w, i) => {
          const isSpoken = i <= activeWordIdx;
          const isCurrent = i === activeWordIdx;
          return (
            <span
              key={i}
              style={{
                color: isCurrent ? '#efbe64' : isSpoken ? '#ffffff' : '#a2b5a5',
                display: 'inline-block',
                marginRight: '0.28em',
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// A tap cursor. It travels to (x, y), presses at `tapAt` seconds, then rests.
export const TapCursor: React.FC<{ path: { at: number; x: number; y: number }[]; tapAt: number[]; show: [number, number] }> = ({ path, tapAt, show }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < show[0] || t > show[1]) return null;
  let x = path[0].x;
  let y = path[0].y;
  for (let i = 1; i < path.length; i++) {
    const p = spring({ frame: frame - sec(path[i].at), fps, config: springs.calm, durationInFrames: 18 });
    x = interpolate(p, [0, 1], [x, path[i].x]);
    y = interpolate(p, [0, 1], [y, path[i].y]);
  }
  const press = tapAt.reduce((m, a) => {
    const d = frame - sec(a);
    return d >= -3 && d <= 6 ? Math.max(m, interpolate(d, [-3, 0, 6], [0, 1, 0])) : m;
  }, 0);
  const fade = Math.min(interpolate(t, [show[0], show[0] + 0.3], [0, 1], { extrapolateRight: 'clamp' }), interpolate(t, [show[1] - 0.3, show[1]], [1, 0], { extrapolateLeft: 'clamp' }));
  return (
    <div style={{ position: 'absolute', left: x - 34, top: y - 34, width: 68, height: 68, opacity: fade, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(38,62,54,0.18)', transform: `scale(${1 + press * 0.5})` }} />
      <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', background: color.text, border: '5px solid #fff', transform: `scale(${1 - press * 0.15})` }} />
    </div>
  );
};

// Headline words that rise into place one by one with a small damped overshoot.
export const RiseWords: React.FC<{ text: string; at: number; gap?: number; style?: React.CSSProperties }> = ({ text, at, gap = 0.08, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <span style={{ display: 'inline', ...style }}>
      {text.split(' ').map((w, i) => {
        const p = spring({ frame: frame - sec(at + i * gap), fps, config: springs.settle });
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em' }}>
            <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 110}%)`, opacity: Math.min(1, p * 1.5) }}>
              {w}&nbsp;
            </span>
          </span>
        );
      })}
    </span>
  );
};

export const appear = (frame: number, fps: number, at: number, cfg = springs.calm) => spring({ frame: frame - sec(at), fps, config: cfg });
