import { createClient, type Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { initialProgress, type Progress } from './learning';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const backend = url && key ? createClient(url, key) : null;
type Account = { session: Session | null; ready: boolean; error: string; refresh: () => Promise<Progress | null> };
const Context = createContext<Account>({ session: null, ready: !backend, error: '', refresh: async () => null });
export const useAccount = () => useContext(Context);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!backend); const [error, setError] = useState('');
  useEffect(() => {
    if (!backend) return;
    let alive = true;
    backend.auth.getSession().then(({ data, error }) => { if (alive) { setSession(data.session); setReady(true); if (error) setError(error.message); } }).catch(() => { if (alive) { setError('Unable to load your account. Please try again.'); setReady(true); } });
    const { data } = backend.auth.onAuthStateChange((_event, next) => { setSession(next); setReady(true); });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);
  const refresh = async (): Promise<Progress | null> => {
    if (!backend || !session) return null;
    const [c, x, r, prefs] = await Promise.all([
      backend.from('level_completions').select('level_id,completed_at').order('completed_at', { ascending: false }),
      backend.from('xp_transactions').select('amount'),
      backend.from('skill_reviews').select('next_review').eq('skill_id', 'fsl-orientation').maybeSingle(),
      backend.from('learner_preferences').select('daily_goal').maybeSingle(),
    ]);
    if (c.error || x.error || r.error || prefs.error) throw new Error('Could not load account progress. Please try again.');
    return { ...initialProgress, onboarding: true, completed: c.data.map(row => row.level_id), xp: x.data.reduce((sum, row) => sum + row.amount, 0), goal: prefs.data?.daily_goal ?? 20, completedAt: c.data[0]?.completed_at ?? null, reviewAt: r.data?.next_review ?? null };
  };
  return <Context.Provider value={{ session, ready, error, refresh }}>{children}</Context.Provider>;
}
export function AccountPanel() {
  const { session, ready, error: accountError } = useAccount();
  const [email, setEmail] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  if (!backend) return <div className="info-card"><ShieldCheck/><div><h3>Account connection is ready to configure</h3><p>This preview works locally. Add your development Supabase public configuration to enable email sign-in and protected account progress. See the repository setup guide.</p></div></div>;
  return <section className="settings-card account-panel"><h2>{session ? 'Your connected account' : 'Keep your journey with you'}</h2><p>{session ? 'Your lesson results are checked and saved by the server.' : 'Sign in with a secure email link. Local preview progress stays separate from account progress.'}</p>{!ready ? <p role="status">Checking your session…</p> : session ? <button className="secondary-button" disabled={busy} onClick={async () => { setBusy(true); const { error } = await backend!.auth.signOut(); if (error) setError(error.message); setBusy(false); }}>Sign out</button> : <form onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); setMessage(''); try { const { error } = await backend!.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } }); if (error) throw error; setMessage('Check your email for a sign-in link.'); } catch (e) { setError(e instanceof Error ? e.message : 'Could not send the sign-in link.'); } finally { setBusy(false); } }}><label>Email address<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label><button className="button green-button" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}<ArrowRight size={16}/></button></form>}{(error || accountError) && <p className="account-error" role="alert">{error || accountError}</p>}{message && <p role="status">{message}</p>}</section>;
}
