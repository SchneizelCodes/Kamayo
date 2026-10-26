// Kamayo 60-second ad. The core idea is "the frame that travels": one rounded card carries
// the whole ad. It starts as the signer's video, becomes the phone screen, a lesson card,
// a quiz card, a level on the learning path, then the two-signer footage, and finally folds
// into the Kamayo logo. Only one hard cut is used, at 49 s, from the app back to real life.
import React from 'react';
import { AbsoluteFill, Audio, interpolate, interpolateColors, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ArrowRight, Hand, Check } from 'lucide-react';
import { color, fonts, spring as springs } from './theme';
import { beats, sec } from './timing';
import { assets } from './assets';
import { endCard } from './content';
import { Footage } from './components/Footage';
import { Captions, RiseWords, TapCursor, appear } from './components/Overlay';
import { HomeScreen, LessonScreen, QuizScreen, Label, LESSON_REPLAY_BUTTON, QUIZ_ANSWER_1, QUIZ_ANSWER_2 } from './components/AppScreens';
import { PathMap, mapScale, NODE_SIZE, PIVOT } from './components/PathMap';
import { Logo, Wordmark } from './components/Brand';

type Rect = { x: number; y: number; w: number; h: number; r: number; rot: number; bezel: number; bg: string };

// Where the travelling frame sits in each state, on the 1080 x 1920 canvas.
export const RECTS = {
  full: { x: 0, y: 0, w: 1080, h: 1920, r: 0, rot: 0, bezel: 0, bg: '#203731' },
  phone: { x: 190, y: 300, w: 700, h: 1360, r: 64, rot: 0, bezel: 14, bg: color.bg },
  lesson: { x: 110, y: 330, w: 860, h: 1240, r: 48, rot: 0, bezel: 0, bg: color.surface },
  quiz: { x: 90, y: 300, w: 900, h: 1360, r: 48, rot: 0, bezel: 0, bg: color.surface },
  brand: { x: 540 - 125, y: 600 - 135, w: 250, h: 270, r: 84, rot: -9, bezel: 0, bg: color.green },
} satisfies Record<string, Rect>;

const nodeRect = (frame: number, fps: number): Rect => {
  const size = NODE_SIZE * mapScale(frame, fps);
  return { x: PIVOT.x - size / 2, y: PIVOT.y - size / 2, w: size, h: size * (55 / 58), r: size / 2, rot: 0, bezel: 0, bg: color.nodeReady };
};

// Each move: when it starts, where it goes, and whether it is a hard cut.
const MOVES: { at: number; to: (f: number, fps: number) => Rect; cut?: boolean }[] = [
  { at: beats.meetKamayo, to: () => RECTS.phone },
  { at: beats.lessonCards[0] - 0.2, to: () => RECTS.lesson },
  { at: beats.quizAppear - 0.2, to: () => RECTS.quiz },
  { at: beats.pullOut - 0.6, to: nodeRect },
  { at: beats.twoSignersCut, to: () => RECTS.full, cut: true },
  { at: beats.endCard, to: () => RECTS.brand },
];

const lerpRect = (a: Rect, b: Rect, p: number): Rect => ({
  x: interpolate(p, [0, 1], [a.x, b.x]),
  y: interpolate(p, [0, 1], [a.y, b.y]),
  w: interpolate(p, [0, 1], [a.w, b.w]),
  h: interpolate(p, [0, 1], [a.h, b.h]),
  r: interpolate(p, [0, 1], [a.r, b.r]),
  rot: interpolate(p, [0, 1], [a.rot, b.rot]),
  bezel: interpolate(p, [0, 1], [a.bezel, b.bezel]),
  bg: interpolateColors(p, [0, 1], [a.bg, b.bg]),
});

const frameRect = (frame: number, fps: number): Rect => {
  let cur: Rect = RECTS.full;
  for (const m of MOVES) {
    if (frame < sec(m.at)) break;
    if (m.cut) {
      cur = m.to(frame, fps);
      continue;
    }
    const p = spring({ frame: frame - sec(m.at), fps, config: springs.calm, durationInFrames: 26 });
    cur = lerpRect(cur, m.to(frame, fps), p);
  }
  return cur;
};

// What is inside the frame, and when. Content is drawn at its own size and scaled to cover the frame.
const LAYERS: { from: number; to: number; w: number; h: number; hardIn?: boolean; render: () => React.ReactNode }[] = [
  {
    from: 0,
    to: beats.meetKamayo + 0.35,
    w: 1080,
    h: 1920,
    render: () => <Footage src={assets.hookSigner} title="One signer greets the viewer in FSL" notes={['Medium shot, looking at camera', 'Warm, natural greeting', 'Signed by a fluent FSL signer']} />,
  },
  { from: beats.meetKamayo + 0.15, to: beats.lessonCards[0] + 0.15, w: 700, h: 1360, render: () => <HomeScreen /> },
  { from: beats.lessonCards[0] - 0.05, to: beats.quizAppear + 0.15, w: 860, h: 1240, render: () => <LessonScreen /> },
  { from: beats.quizAppear - 0.05, to: beats.pullOut - 0.3, w: 900, h: 1360, render: () => <QuizScreen /> },
  { from: beats.pullOut - 0.5, to: beats.twoSignersCut, w: NODE_SIZE, h: NODE_SIZE, render: () => <Centered><Check size={64} color="#fff" strokeWidth={3} /></Centered> },
  {
    from: beats.twoSignersCut,
    to: beats.endCard + 0.45,
    w: 1080,
    h: 1920,
    hardIn: true,
    render: () => <Footage src={assets.twoSigners} people={2} title="Two people greet each other in FSL" notes={['Three-quarter angle, both faces and hands visible', 'Natural and warm — a real first conversation', 'Both signers fluent, with permission']} />,
  },
  { from: beats.endCard + 0.25, to: 61, w: 250, h: 270, render: () => <Centered><Hand size={160} color="#fff" strokeWidth={2} /></Centered> },
];

const Centered: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>{children}</div>;

const TravellingFrame: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const R = frameRect(frame, fps);
  const nodeShadow = t >= beats.pullOut - 0.2 && t < beats.twoSignersCut;
  return (
    <div
      style={{
        position: 'absolute',
        left: R.x,
        top: R.y,
        width: R.w,
        height: R.h,
        borderRadius: R.r,
        transform: `rotate(${R.rot}deg)`,
        background: R.bg,
        overflow: 'hidden',
        outline: R.bezel > 0.5 ? `${R.bezel}px solid #203731` : undefined,
        boxShadow: nodeShadow
          ? `0 ${R.w * 0.07}px 0 ${color.nodeReadyShadow}, 0 0 0 ${R.w * 0.086}px #f0f4e7`
          : R.w < 1080
            ? '0 30px 80px rgba(38, 62, 54, 0.14)'
            : undefined,
      }}
    >
      {LAYERS.map((L, i) => {
        if (t < L.from || t > L.to) return null;
        const fadeIn = L.hardIn ? 1 : interpolate(t, [L.from, L.from + 0.3], [0, 1], { extrapolateRight: 'clamp' });
        const fadeOut = interpolate(t, [L.to - 0.3, L.to], [1, 0], { extrapolateLeft: 'clamp' });
        const o = Math.min(fadeIn, fadeOut);
        const scale = Math.max(R.w / L.w, R.h / L.h);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: (R.w - L.w * scale) / 2,
              top: (R.h - L.h * scale) / 2,
              width: L.w,
              height: L.h,
              transformOrigin: '0 0',
              transform: `scale(${scale})`,
              opacity: o,
              filter: o < 1 ? `blur(${(1 - o) * 12}px)` : undefined,
            }}
          >
            {L.render()}
          </div>
        );
      })}
    </div>
  );
};

// Text and graphics outside the frame.
const Overlays: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const within = (a: number, b: number) => t >= a && t < b;
  const out = (end: number) => interpolate(t, [end - 0.35, end], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <>
      {/* 0-7 s: hook headline, above the signer's head */}
      {within(0, beats.meetKamayo + 0.2) && (
        <div style={{ position: 'absolute', left: 70, right: 70, top: 110, opacity: out(beats.meetKamayo + 0.2) }}>
          <div style={{ background: 'rgba(32, 55, 49, 0.9)', borderRadius: 30, padding: '30px 38px', fontFamily: fonts.heading, fontWeight: 800, fontSize: 66, lineHeight: 1.12, letterSpacing: -2, color: '#fff' }}>
            <RiseWords text="Want to learn" at={beats.hookHeadlineIn} />
            <br />
            <RiseWords text="Filipino Sign Language?" at={beats.hookHeadlineIn + 0.3} style={{ color: '#89c9ae' }} />
          </div>
        </div>
      )}

      {/* 7-15 s: logo above the phone */}
      {within(beats.meetKamayo, beats.lessonCards[0]) && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 128, display: 'flex', justifyContent: 'center', opacity: out(beats.lessonCards[0]), transform: `translateY(${(1 - appear(frame, fps, beats.meetKamayo + 0.3, springs.settle)) * 60}px)` }}>
          <Logo size={86} />
        </div>
      )}

      {/* 15-26 s and 26-38 s: one eyebrow + one headline per scene, same rule every time */}
      {within(beats.lessonCards[0], beats.quizAppear) && <SceneTitle label="VIDEO LESSONS" text="Watch. Replay. Practice." at={beats.lessonCards[0] + 0.3} end={beats.quizAppear} top={120} />}
      {within(beats.quizAppear, beats.pullOut - 0.4) && <SceneTitle label="PRACTICE" text="Practice into progress." at={beats.quizAppear + 0.3} end={beats.pullOut - 0.4} top={96} />}

      {/* Cursor taps: replay, then the two answers */}
      <TapCursor
        show={[beats.replayTap - 1.2, beats.replayTap + 0.9]}
        tapAt={[beats.replayTap]}
        path={[
          { at: beats.replayTap - 1.2, x: 640, y: 1500 },
          { at: beats.replayTap - 0.8, x: RECTS.lesson.x + LESSON_REPLAY_BUTTON.x, y: RECTS.lesson.y + LESSON_REPLAY_BUTTON.y },
        ]}
      />
      <TapCursor
        show={[beats.quizTap1 - 1.2, beats.quizTap2 + 1.2]}
        tapAt={[beats.quizTap1, beats.quizTap2]}
        path={[
          { at: beats.quizTap1 - 1.2, x: 760, y: 1560 },
          { at: beats.quizTap1 - 0.8, x: RECTS.quiz.x + QUIZ_ANSWER_1.x, y: RECTS.quiz.y + QUIZ_ANSWER_1.y },
          { at: beats.quizTap2 - 0.8, x: RECTS.quiz.x + QUIZ_ANSWER_2.x, y: RECTS.quiz.y + QUIZ_ANSWER_2.y },
        ]}
      />

      {/* 55-60 s: end card */}
      {t >= beats.endCard + 0.3 && <EndCard />}
    </>
  );
};

const SceneTitle: React.FC<{ label: string; text: string; at: number; end: number; top: number }> = ({ label, text, at, end, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const o = interpolate(t, [end - 0.35, end], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, textAlign: 'center', opacity: o }}>
      <div style={{ opacity: appear(frame, fps, at - 0.15) }}>
        <Label size={22}>{label}</Label>
      </div>
      <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 64, letterSpacing: -2, color: color.text, marginTop: 18 }}>
        <RiseWords text={text} at={at} />
      </div>
    </div>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const word = appear(frame, fps, beats.endCard + 0.35, springs.settle);
  const button = appear(frame, fps, beats.tagline[2] + 0.5, springs.settle);
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center', opacity: word, transform: `translateY(${(1 - word) * 50}px)` }}>
        <Wordmark fontSize={140} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1010, textAlign: 'center', fontFamily: fonts.heading, fontWeight: 800, fontSize: 70, letterSpacing: -2, lineHeight: 1.25 }}>
        {endCard.tagline.map((line, i) => {
          const p = appear(frame, fps, beats.tagline[i], springs.settle);
          return (
            <div key={line} style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)`, color: i === 2 ? color.green : color.text }}>
              {line}
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1360, display: 'flex', justifyContent: 'center', opacity: button, transform: `translateY(${(1 - button) * 40}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: color.green, color: '#fff', borderRadius: 28, padding: '34px 56px', fontFamily: fonts.body, fontSize: 40, fontWeight: 650, boxShadow: '0 8px 0 #0002' }}>
          {endCard.button} <ArrowRight size={44} />
        </div>
      </div>
    </>
  );
};

export const KamayoAd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: color.bg }}>
      {t >= beats.pullOut - 0.6 && t < beats.twoSignersCut && <PathMap />}
      <TravellingFrame />
      <Overlays />
      <Captions />
      {assets.voiceover && <Audio src={staticFile(assets.voiceover)} />}
      {assets.music && <Audio src={staticFile(assets.music)} volume={0.18} />}
    </AbsoluteFill>
  );
};
