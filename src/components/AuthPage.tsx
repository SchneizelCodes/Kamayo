"use client";

import React, { useMemo, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Hand, Loader2, Lock, Mail, User } from 'lucide-react';
import { backend } from '../account';

// Kamayo sign-in (2026-11-14). Like Tindero: sign in, create an account, or continue as a guest.
// No Google, no email verification step: accounts are email + password, validated in full here
// (the Supabase project must have "Confirm email" switched off for instant sign-up).
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const rules = (pw: string) => [
  { ok: pw.length >= 8, text: 'At least 8 characters' },
  { ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw), text: 'Upper and lower case letters' },
  { ok: /\d/.test(pw), text: 'At least one number' },
  { ok: /[^A-Za-z0-9]/.test(pw), text: 'At least one symbol' },
];
function friendly(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'That email and password do not match.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account with this email already exists. Sign in instead.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many tries. Please wait a minute and try again.';
  if (m.includes('network') || m.includes('fetch')) return 'Can’t reach Kamayo right now. Check your connection.';
  return msg;
}

export default function AuthPage({ onGuest }: { onGuest: () => void }) {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const [agree, setAgree] = useState(false); const [show, setShow] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({}); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const pwRules = useMemo(() => rules(pw), [pw]);
  const errs = {
    name: mode === 'up' && (name.trim().length < 2 || name.trim().length > 40) ? 'Enter a name from 2 to 40 characters.' : '',
    email: !email.trim() ? 'Enter your email address.' : !EMAIL.test(email.trim()) ? 'Enter a valid email, like you@example.com.' : '',
    pw: !pw ? 'Enter your password.' : mode === 'up' && !pwRules.every((r) => r.ok) ? 'Your password needs every item in the list.' : '',
    pw2: mode === 'up' && pw2 !== pw ? 'The passwords do not match.' : '',
    agree: mode === 'up' && !agree ? 'Please agree to continue.' : '',
  };
  const valid = Object.values(errs).every((e) => !e);
  const show_ = (k: keyof typeof errs) => (touched[k] || touched.submit) && errs[k];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setTouched({ ...touched, submit: true }); setError('');
    if (!valid) return;
    if (!backend) { setError('Accounts are not connected in this preview yet. You can continue as a guest.'); return; }
    setBusy(true);
    try {
      if (mode === 'in') {
        const { error } = await backend.auth.signInWithPassword({ email: email.trim(), password: pw });
        if (error) throw error;
      } else {
        const { data, error } = await backend.auth.signUp({ email: email.trim(), password: pw, options: { data: { display_name: name.trim() } } });
        if (error) throw error;
        if (!data.session) { const r = await backend.auth.signInWithPassword({ email: email.trim(), password: pw }); if (r.error) throw r.error; }
      }
    } catch (err) { setError(friendly(err instanceof Error ? err.message : 'Something went wrong. Please try again.')); }
    finally { setBusy(false); }
  };
  const field = (k: keyof typeof errs) => ({ onBlur: () => setTouched((t) => ({ ...t, [k]: true })), 'aria-invalid': !!show_(k) || undefined, 'aria-describedby': show_(k) ? `ka-${k}-err` : undefined });
  return (
    <div className="ka">
      <img className="ka-bg" src="/visual/bg/login.webp" alt="" aria-hidden="true"/>
      <div className="ka-frame">
        <section className="ka-panel">
          <div className="ka-brand"><span className="brand-mark"><img src="/visual/maya/logo-circle.webp" alt="" width={26} height={26} style={{ objectFit: 'contain' }} /></span>kamayo<span className="brand-dot">.</span></div>
          <h1>{mode === 'in' ? 'Welcome back' : 'Make a little room for learning'}</h1>
          <p className="ka-sub">{mode === 'in' ? 'Sign in to keep your journey with you.' : 'Create a free account. No verification email needed.'}</p>
          <div className="ka-tabs" role="tablist" aria-label="Account">
            <button role="tab" type="button" aria-selected={mode === 'in'} onClick={() => { setMode('in'); setTouched({}); setError(''); }}>Sign in</button>
            <button role="tab" type="button" aria-selected={mode === 'up'} onClick={() => { setMode('up'); setTouched({}); setError(''); }}>Create account</button>
          </div>
          <form onSubmit={submit} noValidate className="ka-form">
            {mode === 'up' && <label className="ka-field"><span>Your name</span><span className="ka-input"><User size={17}/><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={40} placeholder="What should we call you?" {...field('name')}/></span>{show_('name') && <em id="ka-name-err">{errs.name}</em>}</label>}
            <label className="ka-field"><span>Email</span><span className="ka-input"><Mail size={17}/><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" {...field('email')}/></span>{show_('email') && <em id="ka-email-err">{errs.email}</em>}</label>
            <label className="ka-field"><span>Password</span><span className="ka-input"><Lock size={17}/><input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} placeholder="Your password" {...field('pw')}/><button type="button" className="ka-eye" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span>{show_('pw') && <em id="ka-pw-err">{errs.pw}</em>}</label>
            {mode === 'up' && <ul className="ka-rules" aria-label="Password needs">{pwRules.map((r) => <li key={r.text} className={r.ok ? 'ok' : ''}>{r.text}</li>)}</ul>}
            {mode === 'up' && <label className="ka-field"><span>Confirm password</span><span className="ka-input"><Lock size={17}/><input type={show ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" placeholder="Type it again" {...field('pw2')}/></span>{show_('pw2') && <em id="ka-pw2-err">{errs.pw2}</em>}</label>}
            {mode === 'up' && <label className="ka-check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} {...field('agree')}/><span>I understand Kamayo is a learning preview and does not certify FSL fluency.</span></label>}
            {mode === 'up' && show_('agree') && <em className="ka-err-line" id="ka-agree-err">{errs.agree}</em>}
            {error && <p className="ka-alert" role="alert">{error}</p>}
            <button className="button green-button ka-submit" type="submit" disabled={busy}>{busy && <Loader2 size={17} className="spin"/>}{mode === 'in' ? 'Sign in' : 'Create my account'} <ArrowRight size={17}/></button>
          </form>
          <div className="ka-or"><span>or</span></div>
          <button type="button" className="button ka-guest" onClick={onGuest}>Continue as a guest</button>
          <p className="ka-note">Guests keep progress on this device only.</p>
        </section>
        <aside className="ka-show" aria-hidden="true">
          <img src="/visual/bg/login.webp" alt=""/>
          <div className="ka-quote"><p>“Small signs. Big connections.”</p><span>Five stages · one hundred levels · sign lessons open after fluent FSL review</span></div>
        </aside>
      </div>
    </div>
  );
}
