// The learning path (38-49 s). Matches .unit-banner, .map-level and .level-node in the app.
// Level 1 is drawn by the travelling frame itself, so it is skipped here.
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { color, fonts, spring as springs } from '../theme';
import { beats, sec } from '../timing';
import { pathLevels } from '../content';
import { LevelNode } from './AppScreens';

export const NODE_SIZE = 150;
// Centres of levels 1-5 on the 1080 x 1920 canvas.
export const NODES = [
  { x: 300, y: 560 },
  { x: 560, y: 800 },
  { x: 320, y: 1040 },
  { x: 580, y: 1280 },
  { x: 360, y: 1510 },
];
export const PIVOT = NODES[0];

// Camera pull-out: starts zoomed in on level 1, ends showing the whole path.
export const mapScale = (frame: number, fps: number) => {
  const p = spring({ frame: frame - sec(beats.pullOut - 0.4), fps, config: springs.calm, durationInFrames: 50 });
  return interpolate(p, [0, 1], [2.6, 1]);
};

export const PathMap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const s = mapScale(frame, fps);
  const opacity = interpolate(t, [beats.pullOut - 0.4, beats.pullOut + 0.2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const draw = interpolate(t, [beats.pullOut + 1.2, beats.unlock], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const unlock = spring({ frame: frame - sec(beats.unlock), fps, config: springs.settle });
  const unlocked = t >= beats.unlock;
  const d = NODES.map((n, i) => (i === 0 ? `M${n.x} ${n.y}` : `C ${NODES[i - 1].x} ${NODES[i - 1].y + 140}, ${n.x} ${n.y - 140}, ${n.x} ${n.y}`)).join(' ');

  return (
    <div style={{ position: 'absolute', inset: 0, opacity, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`, transform: `scale(${s})`, fontFamily: fonts.body, color: color.text }}>
      <div style={{ position: 'absolute', left: 90, right: 90, top: 180, border: `3px solid ${color.line}`, background: color.mint, borderRadius: 30, padding: '30px 36px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: '#839377' }}>STAGE 1 · BEGINNER</div>
        <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 52, letterSpacing: -1.4, marginTop: 8 }}>A new way to connect</div>
      </div>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <path d={d} fill="none" stroke={color.dashed} strokeWidth={8} strokeDasharray="22 18" />
        <path d={d} fill="none" stroke={color.progress} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw * 0.26} 1`} />
      </svg>
      {NODES.map((n, i) => {
        if (i === 0) return <Caption key={i} x={n.x} y={n.y} title={pathLevels[0]} small="Completed!" />;
        const isNext = i === 1 && unlocked;
        const scale = i === 1 && unlocked ? interpolate(unlock, [0, 0.6, 1], [0.9, 1.06, 1]) : 1;
        return (
          <React.Fragment key={i}>
            <div style={{ position: 'absolute', left: n.x - NODE_SIZE / 2, top: n.y - NODE_SIZE / 2, transform: `scale(${scale})` }}>
              <LevelNode size={NODE_SIZE} state={isNext ? 'ready' : 'locked'} icon={isNext ? 'star' : i === 4 ? 'trophy' : 'lock'} />
            </div>
            <Caption x={n.x} y={n.y} title={pathLevels[i]} small={isNext ? 'Up next' : i === 4 ? 'Checkpoint' : `Level ${i + 1}`} strong={isNext} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Caption: React.FC<{ x: number; y: number; title: string; small: string; strong?: boolean }> = ({ x, y, title, small, strong }) => (
  <div style={{ position: 'absolute', left: x + NODE_SIZE / 2 + 28, top: y - 44, width: 1080 - (x + NODE_SIZE / 2 + 28) - 50 }}>
    <div style={{ fontSize: 34, fontWeight: 650, color: strong ? '#547853' : color.text }}>{title}</div>
    <div style={{ fontSize: 26, color: strong ? color.green : color.muted, marginTop: 8, fontWeight: strong ? 700 : 400 }}>{small}</div>
  </div>
);
