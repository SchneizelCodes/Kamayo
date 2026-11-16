"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, LockKeyhole, RotateCcw, Star } from 'lucide-react';
import { CATALOGUE_TOPICS } from '../contentContract';
import { stages } from '../learning';

// Kamayo home v2 (2026-11-14, "Palmo" journey). Honest by construction: only Stage 1's orientation is open,
// every other stage says "upcoming", and the warm-up game uses the dictionary's own Filipino/English lookup
// aliases (no sign is shown or implied). Motion is transform/opacity only; reduced motion keeps it still.
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useInView<T extends Element>(ref: React.RefObject<T | null>) {
  const [seen, set] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; if (reduced() || !('IntersectionObserver' in window)) { set(true); return; } const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { set(true); io.disconnect(); } }, { threshold: 0.35 }); io.observe(el); return () => io.disconnect(); }, [ref]);
  return seen;
}

export function StatBadges({ xp, completed, streak }: { xp: number; completed: number; streak: number }) {
  const ref = useRef<HTMLDivElement>(null); const seen = useInView(ref);
  const items = [{ img: 'gem', n: String(xp), t: 'XP earned' }, { img: 'check-leaf', n: `${completed}/100`, t: 'Levels done' }, { img: 'flame', n: String(streak), t: 'Day streak' }];
  return <div ref={ref} className={`kj-badges ${seen ? 'in' : ''}`} aria-label="Your progress">{items.map((b, i) => <div className="kj-badge" key={b.t} style={{ transitionDelay: `${i * 110}ms` }}>
    <svg viewBox="0 0 120 120" aria-hidden="true"><defs><path id={`kj-c${i}`} d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0" /></defs><text><textPath href={`#kj-c${i}`}>{` ${b.t.toUpperCase()} · KAMAYO · ${b.t.toUpperCase()} · `}</textPath></text></svg>
    <span className="kj-badge-core"><img src={`/visual/ui/${b.img}.webp`} alt="" width={30} height={30} style={{ objectFit: 'contain' }} /><strong>{b.n}</strong></span>
    <span className="sr-only">{b.n} {b.t}</span>
  </div>)}</div>;
}

const STAGE_ART = ['/visual/medallions/stage-1.webp', '/visual/medallions/stage-2.webp', '/visual/medallions/stage-3.webp', '/visual/medallions/stage-4.webp', '/visual/medallions/stage-5.webp'];
export function StageJourney({ maya, done, onStart, onLearn }: { maya: React.ReactNode; done: boolean; onStart: () => void; onLearn: () => void }) {
  const ref = useRef<HTMLOListElement>(null); const [k, setK] = useState(0); const [h, setH] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el || reduced()) return; let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const r = el.getBoundingClientRect(); setH(r.height); setK(Math.max(0, Math.min(1, (innerHeight * 0.5 - r.top) / Math.max(1, r.height - 120)))); }); };
    on(); addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, []);
  const at = Math.min(stages.length - 1, Math.floor(k * stages.length));
  return <section className="kj-journey" aria-labelledby="kj-title">
    <div className="section-heading"><h2 id="kj-title">Five stages, one path</h2><button className="text-button" onClick={onLearn}>See all 100 levels <ArrowRight size={16} /></button></div>
    <ol ref={ref} className="kj-stages">
      <span className="kj-trail" aria-hidden="true"><i style={{ transform: `scaleY(${k})` }} /></span>
      <span className="kj-maya" aria-hidden="true" style={{ transform: `translateY(${(k * Math.max(0, h - 110)).toFixed(1)}px) rotate(${(Math.sin(k * 18) * 6).toFixed(2)}deg)` }}>{maya}</span>
      {stages.map((s, i) => {
        const open = i === 0; const pct = open ? (done ? 5 : 0) : 0;
        return <li key={s} className={`kj-stage ${i <= at ? 'reached' : ''}`}>
          <img src={STAGE_ART[i]} alt="" loading="lazy" />
          <div className="kj-stage-body">
            <span className="eyebrow">STAGE {i + 1} · LEVELS {i * 20 + 1}–{i * 20 + 20}</span>
            <h3>{s}</h3>
            <div className="kj-stage-foot">
              <span className="kj-ring" style={{ '--p': `${pct}%` } as React.CSSProperties} aria-label={open ? `${done ? 1 : 0} of 20 levels done` : 'Upcoming'}>{open ? (done ? <Check size={16} /> : <Star size={15} />) : <LockKeyhole size={14} />}</span>
              {open ? <button className="button green-button" onClick={onStart}>{done ? 'Revisit orientation' : 'Start here'} <ArrowRight size={16} /></button> : <span className="kj-upcoming">Upcoming · awaiting FSL review</span>}
            </div>
          </div>
        </li>;
      })}
    </ol>
  </section>;
}

export function TopicTicker() {
  const words = CATALOGUE_TOPICS.flatMap(t => t.filipinoAliases);
  const row = [...words, ...words];
  return <section className="kj-ticker" aria-label="Topics coming to the dictionary"><p className="eyebrow">COMING TO THE DICTIONARY</p><div className="kj-ticker-track" aria-hidden="true"><div>{row.map((w, i) => <span key={i}>{w}<b>✦</b></span>)}</div></div><p className="sr-only">{words.join(', ')}</p></section>;
}

export function WordMatch() {
  const pairs = useMemo(() => CATALOGUE_TOPICS.flatMap(t => t.filipinoAliases.slice(0, t.englishAliases.length).map((f, i) => ({ f, e: t.englishAliases[i] })).filter(p => p.e && p.e !== t.title.toLowerCase())), []);
  const [round, setRound] = useState(0); const [picked, setPicked] = useState<string | null>(null);
  const q = pairs[round % pairs.length];
  const options = useMemo(() => { const others = pairs.filter(p => p.e !== q.e); const a = others[(round * 3 + 1) % others.length].e, b = others[(round * 5 + 4) % others.length].e; const set = [q.e, a, b].filter((v, i, s) => s.indexOf(v) === i); return set.sort((x, y) => ((x.length * 7 + round) % 5) - ((y.length * 7 + round) % 5)); }, [q, pairs, round]);
  const right = picked === q.e;
  return <section className="kj-game" aria-labelledby="kj-game-title">
    <div><p className="eyebrow">A QUICK WARM-UP</p><h2 id="kj-game-title">What does <em>“{q.f}”</em> mean?</h2><p className="muted-small">Words first, signs soon. These are the dictionary’s lookup words.</p></div>
    <div className="kj-game-options" role="group" aria-label="Choose the meaning">{options.map(o => <button key={o} type="button" disabled={!!picked} className={picked ? (o === q.e ? 'right' : o === picked ? 'wrong' : '') : ''} onClick={() => setPicked(o)}>{o}</button>)}</div>
    <p className="kj-game-result" role="status" aria-live="polite">{picked ? (right ? 'Tama! That’s right.' : `Almost. “${q.f}” means “${q.e}”.`) : ''}</p>
    {picked && <button type="button" className="text-button" onClick={() => { setPicked(null); setRound(r => r + 1); }}><RotateCcw size={15} /> Another word</button>}
  </section>;
}
