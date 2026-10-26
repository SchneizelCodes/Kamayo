// Kamayo app screens rebuilt for video. Styles follow src/styles.css in the app:
// .hero-card, .unit-banner, .level-node, .lesson-meta, .progress-track, .answer-options,
// .answer-feedback, .lesson-finish, .earned and .bottom-nav.
import React from 'react';
import { interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ArrowRight, BookOpen, Check, Heart, Home, Leaf, LockKeyhole, Map, Play, RotateCcw, Settings, Sparkles, Star, Trophy, Video, Zap } from 'lucide-react';
import { color, fonts, spring as springs } from '../theme';
import { appear } from './Overlay';
import { Logo, Sprout } from './Brand';
import { finish, home, lessonCards, lessonTip, quizOrientation, quizSign } from '../content';
import { assets } from '../assets';
import { beats, sec } from '../timing';

const Label: React.FC<{ children: React.ReactNode; light?: boolean; size?: number }> = ({ children, light, size = 18 }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: fonts.body,
      fontSize: size,
      fontWeight: 700,
      letterSpacing: size * 0.12,
      color: light ? '#6c8567' : color.labelText,
      background: light ? '#f6f8ed' : color.mint,
      borderRadius: 10,
      padding: '10px 14px',
    }}
  >
    {children}
  </span>
);

const rise = (p: number, px = 40): React.CSSProperties => ({ opacity: p, transform: `translateY(${(1 - p) * px}px)` });

// ---------- Home (phone screen, 700 x 1360) ----------
export const HomeScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = (d: number) => appear(frame, fps, beats.meetKamayo + 0.5 + d);
  return (
    <div style={{ width: 700, height: 1360, background: color.bg, position: 'relative', fontFamily: fonts.body, color: color.text }}>
      <div style={{ position: 'absolute', left: 36, right: 36, top: 34, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={46} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c7a23d', fontWeight: 700, fontSize: 24 }}>
          <Zap size={26} /> 0 XP
        </span>
      </div>
      <div style={{ position: 'absolute', left: 36, top: 140, width: 600, ...rise(a(0)) }}>
        <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 56, letterSpacing: -2 }}>
          {home.greeting}
          <span style={{ color: color.green }}>.</span>
        </div>
        <div style={{ fontSize: 24, lineHeight: 1.6, color: color.muted, marginTop: 10 }}>{home.greetingSub}</div>
      </div>
      {/* .hero-card */}
      <div
        style={{
          position: 'absolute',
          left: 36,
          top: 320,
          width: 628,
          height: 500,
          borderRadius: 34,
          background: color.heroBg,
          border: `2px solid ${color.heroBorder}`,
          overflow: 'hidden',
          ...rise(a(0.12)),
        }}
      >
        <div style={{ position: 'absolute', right: -40, top: 150, width: 300, height: 300, borderRadius: '50%', border: `2px dashed ${color.orbit}` }} />
        <Sprout size={220} style={{ position: 'absolute', right: 18, top: 236, transform: 'rotate(5deg)' }} />
        <span style={{ position: 'absolute', right: 150, top: 200, background: color.tagBg, borderRadius: 14, padding: '10px 16px', fontSize: 22, fontWeight: 650, color: color.green, boxShadow: '0 6px 18px #4460420c' }}>
          Kumusta!
        </span>
        <div style={{ position: 'absolute', left: 34, top: 34, width: 400 }}>
          <Label light>
            <Leaf size={20} /> {home.heroLabel}
          </Label>
          <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 50, lineHeight: 1.18, letterSpacing: -1.8, color: color.heroHeading, marginTop: 22 }}>
            {home.heroTitle[0]}
            <br />
            {home.heroTitle[1]}
          </div>
          <div style={{ fontSize: 21, lineHeight: 1.7, color: color.heroBody, marginTop: 14, width: 330 }}>{home.heroBody}</div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 26,
              background: color.darkButton,
              color: '#fff',
              borderRadius: 18,
              padding: '20px 26px',
              fontSize: 22,
              fontWeight: 650,
              boxShadow: '0 5px 0 #0002',
            }}
          >
            {home.heroButton} <ArrowRight size={24} />
          </div>
        </div>
      </div>
      {/* Learning path preview */}
      <div style={{ position: 'absolute', left: 36, top: 858, width: 628, ...rise(a(0.24)) }}>
        <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 32, letterSpacing: -0.8 }}>Your learning path</div>
        <div style={{ marginTop: 18, border: `2px solid ${color.line}`, background: color.surface, borderRadius: 22, display: 'flex', alignItems: 'center', gap: 18, padding: '22px 22px' }}>
          <span style={{ display: 'grid', placeItems: 'center', minWidth: 70, height: 70, background: '#f2f5e9', color: '#879c62', borderRadius: 18 }}>
            <Leaf size={34} />
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: '#839377' }}>{home.unitEyebrow}</div>
            <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 26, margin: '6px 0 4px' }}>{home.unitTitle}</div>
            <div style={{ fontSize: 18, color: color.muted }}>{home.unitBody}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 34 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <LevelNode key={i} size={86} state={i === 0 ? 'ready' : 'locked'} icon={i === 0 ? 'star' : i === 4 ? 'trophy' : 'lock'} />
          ))}
        </div>
      </div>
      {/* .bottom-nav */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 112, background: color.surface, borderTop: `2px solid ${color.line}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {[
          { n: 'Home', I: Home },
          { n: 'Learn', I: Map },
          { n: 'Review', I: RotateCcw },
          { n: 'Dictionary', I: BookOpen },
          { n: 'Profile', I: Settings },
        ].map(({ n, I }, i) => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 16, color: i === 0 ? color.green : '#9aa69c', background: i === 0 ? color.mint : 'transparent', borderRadius: 16, padding: '10px 16px' }}>
            <I size={28} />
            {n}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- .level-node ----------
export const LevelNode: React.FC<{ size: number; state: 'ready' | 'locked' | 'done'; icon: 'star' | 'lock' | 'trophy' | 'check'; mix?: number }> = ({ size, state, icon }) => {
  const ready = state !== 'locked';
  const k = size / 58;
  const Icon = icon === 'star' ? Star : icon === 'lock' ? LockKeyhole : icon === 'trophy' ? Trophy : Check;
  return (
    <div
      style={{
        width: size,
        height: size * (55 / 58),
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: ready ? color.nodeReady : color.nodeIdle,
        color: ready ? '#fff' : color.nodeIdleText,
        border: `${5 * k}px solid ${ready ? '#d9e8d7' : '#f5f7f0'}`,
        boxShadow: ready ? `0 ${4 * k}px 0 ${color.nodeReadyShadow}, 0 0 0 ${5 * k}px #f0f4e7` : `0 ${4 * k}px 0 ${color.nodeIdleShadow}`,
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      <Icon size={size * 0.42} fill={icon === 'star' ? 'currentColor' : 'none'} strokeWidth={icon === 'check' ? 3 : 2} />
    </div>
  );
};

// ---------- Video area (approved clip or placeholder) ----------
const ClipArea: React.FC<{ src: string | null; label: string; height: number; replayAt?: number; startAt: number }> = ({ src, label, height, replayAt, startAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // Playhead: plays from startAt, rewinds to 0 when Replay is tapped.
  const playStart = replayAt !== undefined && t >= replayAt ? replayAt : startAt;
  const progress = Math.min(1, Math.max(0, (t - playStart) / 3.2));
  return (
    <div style={{ height, borderRadius: 28, overflow: 'hidden', position: 'relative', background: '#203731' }}>
      {src ? (
        <OffthreadVideo src={staticFile(src)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 22, border: '3px dashed #89c9ae66', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, color: '#a7b7ab', textAlign: 'center', padding: 30 }}>
          <Video size={64} color="#89c9ae" />
          <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 34, color: '#e3ece0' }}>Approved FSL clip</div>
          <div style={{ fontSize: 24, lineHeight: 1.5 }}>{label}</div>
        </div>
      )}
      <div style={{ position: 'absolute', left: 30, right: 30, bottom: 26, height: 10, borderRadius: 10, background: '#ffffff33' }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 10, background: '#89c9ae' }} />
      </div>
    </div>
  );
};

const LessonMeta: React.FC<{ left: string; right: string; progress: number }> = ({ left, right, progress }) => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 19, letterSpacing: 1.6, color: '#8b9b8b', fontWeight: 600 }}>
      <span>{left}</span>
      <span style={{ letterSpacing: 0 }}>{right}</span>
    </div>
    <div style={{ height: 14, borderRadius: 14, background: color.mint, overflow: 'hidden', marginTop: 18 }}>
      <div style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 14, background: color.progress }} />
    </div>
  </>
);

// One element whose content swaps with a short blur (technique from the gallery research).
export const swap = (frame: number, fps: number, at: number) => {
  const d = frame - sec(at);
  const blur = interpolate(d, [-6, 0, 6], [0, 10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return { before: d < 0, blur };
};

// ---------- Lesson card (860 x 1240) ----------
export const LESSON_REPLAY_BUTTON = { x: 44 + 130, y: 1000 + 46 }; // local centre, used by the cursor
export const LessonScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = beats.lessonCards.filter((b) => t >= b).length - 1;
  const card = lessonCards[Math.max(0, idx)];
  const startAt = beats.lessonCards[Math.max(0, idx)];
  const blur = Math.max(...beats.lessonCards.slice(1).map((b) => swap(frame, fps, b).blur));
  const pressed = Math.abs(frame - sec(beats.replayTap)) < 5;
  return (
    <div style={{ width: 860, height: 1240, background: color.surface, padding: 44, boxSizing: 'border-box', fontFamily: fonts.body, color: color.text, position: 'relative' }}>
      <div style={{ filter: `blur(${blur}px)` }}>
        <LessonMeta left={card.meta} right="Lesson preview" progress={(Math.max(0, idx) + 1) / 3} />
        <div style={{ marginTop: 36 }}>
          <ClipArea src={assets.lessonClips[card.clip]} label={`${card.title} demonstration`} height={640} startAt={startAt} replayAt={idx === 2 ? beats.replayTap : undefined} />
        </div>
        <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 46, letterSpacing: -1.2, marginTop: 40 }}>{card.title}</div>
        <div style={{ fontSize: 24, color: color.muted, marginTop: 10 }}>{lessonTip}</div>
      </div>
      <div style={{ position: 'absolute', left: 44, top: 1000, display: 'flex', gap: 20 }}>
        <div style={{ width: 260, height: 92, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, border: `2px solid ${pressed ? color.selectedBorder : color.line}`, background: pressed ? color.mint : color.surface, borderRadius: 22, fontSize: 26, fontWeight: 650, color: color.green }}>
          <RotateCcw size={30} /> Replay
        </div>
        <div style={{ width: 492, height: 92, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, background: color.green, color: '#fff', borderRadius: 22, fontSize: 26, fontWeight: 650, boxShadow: '0 6px 0 #0002' }}>
          <Play size={28} fill="#fff" /> Practice along
        </div>
      </div>
    </div>
  );
};

// ---------- Quiz card (900 x 1360) ----------
export const QUIZ_ANSWER_1 = { x: 450, y: 770 + 2 * 132 + 55 }; // local centre of the correct option, question 1
export const QUIZ_ANSWER_2 = { x: 450, y: 680 + 1 * 132 + 55 }; // question 2

const Option: React.FC<{ letter: string; text: string; state: 'idle' | 'selected' | 'correct' }> = ({ letter, text, state }) => (
  <div
    style={{
      height: 110,
      boxSizing: 'border-box',
      border: `3px solid ${state === 'correct' ? color.correctBorder : state === 'selected' ? color.selectedBorder : color.line}`,
      borderBottomWidth: 7,
      background: state === 'correct' ? color.correctBg : state === 'selected' ? color.mint : color.surface,
      borderRadius: 26,
      display: 'flex',
      alignItems: 'center',
      gap: 22,
      padding: '0 28px',
      fontSize: 29,
      marginBottom: 22,
    }}
  >
    <span style={{ display: 'grid', placeItems: 'center', width: 54, height: 54, border: '2px solid #cbd7c9', color: '#8e9e87', borderRadius: 14, fontSize: 22, flexShrink: 0 }}>{letter}</span>
    {text}
    {state === 'correct' && <Check size={38} color={color.successText} style={{ marginLeft: 'auto' }} strokeWidth={3} />}
  </div>
);

const Feedback: React.FC<{ title: string; text: string; p: number }> = ({ title, text, p }) => (
  <div style={{ background: color.successBg, color: color.successText, borderRadius: 24, padding: '26px 30px', fontSize: 26, ...rise(p, 20) }}>
    <strong>{title}</strong>
    <div style={{ fontSize: 23, marginTop: 8, lineHeight: 1.5 }}>{text}</div>
  </div>
);

export const QuizScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const second = t >= beats.quizSwap;
  const done = t >= beats.lessonComplete;
  const blur = Math.max(swap(frame, fps, beats.quizSwap).blur, swap(frame, fps, beats.lessonComplete).blur);
  const state = (i: number, answer: number, tap: number, check: number) => (t >= check && i === answer ? 'correct' : t >= tap && i === answer ? 'selected' : 'idle');
  const L = ['A', 'B', 'C'];

  return (
    <div style={{ width: 900, height: 1360, background: color.surface, padding: 44, boxSizing: 'border-box', fontFamily: fonts.body, color: color.text, position: 'relative' }}>
      <div style={{ filter: `blur(${blur}px)` }}>
        {done ? (
          <div style={{ textAlign: 'center', paddingTop: 120 }}>
            <Sprout size={320} style={{ display: 'block', margin: '0 auto' }} />
            <div style={{ marginTop: 30 }}>
              <Label size={22}>{finish.label}</Label>
            </div>
            <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 52, letterSpacing: -1.5, lineHeight: 1.2, margin: '30px 60px 40px' }}>{finish.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontSize: 30, fontWeight: 650, color: color.earnedText, background: color.earnedBg, padding: 30, borderRadius: 24, margin: '0 40px' }}>
              <Zap size={34} /> {finish.earned}
            </div>
          </div>
        ) : !second ? (
          <>
            <LessonMeta left="PRACTICE · 1 OF 2" right="No lives. Just learning." progress={t >= beats.quizCheck1 ? 0.5 : 0.1} />
            <div style={{ marginTop: 36 }}>
              <ClipArea src={assets.quizSignClip} label="The sign the learner identifies" height={520} startAt={beats.quizAppear + 0.6} />
            </div>
            <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 40, margin: '40px 0 34px' }}>{quizSign.prompt}</div>
            {quizSign.options.map((o, i) => (
              <Option key={o} letter={L[i]} text={o} state={state(i, quizSign.answer, beats.quizTap1, beats.quizCheck1)} />
            ))}
            {t >= beats.quizCheck1 && <Feedback title={quizSign.feedback} text={quizSign.explanation} p={appear(frame, fps, beats.quizCheck1)} />}
          </>
        ) : (
          <>
            <LessonMeta left="PRACTICE · 2 OF 2" right="No lives. Just learning." progress={t >= beats.quizCheck2 ? 1 : 0.5} />
            <div style={{ textAlign: 'center', background: color.cream, padding: 40, borderRadius: 30, marginTop: 36, height: 420, boxSizing: 'border-box' }}>
              <span style={{ display: 'inline-grid', placeItems: 'center', width: 130, height: 130, background: '#e4eddf', borderRadius: 40, color: '#6a946f' }}>
                <Video size={70} />
              </span>
              <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 38, margin: '22px 0 14px' }}>{quizOrientation.title}</div>
              <div style={{ fontSize: 25, lineHeight: 1.6, color: '#7e8d7a' }}>{quizOrientation.text}</div>
            </div>
            <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 38, margin: '44px 0 30px' }}>{quizOrientation.prompt}</div>
            {quizOrientation.options.map((o, i) => (
              <Option key={o} letter={L[i]} text={o} state={state(i, quizOrientation.answer, beats.quizTap2, beats.quizCheck2)} />
            ))}
            {t >= beats.quizCheck2 && <Feedback title={quizOrientation.feedback} text={quizOrientation.explanation} p={appear(frame, fps, beats.quizCheck2)} />}
          </>
        )}
      </div>
    </div>
  );
};

export { Label, rise, Heart, Sparkles };
