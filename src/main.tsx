"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, BookOpen, Check, ChevronDown, ChevronRight, CircleHelp, Flame, Hand, Heart, Home, Leaf, LockKeyhole, Map, Menu, Play, RotateCcw, Search, Settings, ShieldCheck, Sparkles, Star, Target, Trophy, Users, Video, Volume2, VolumeX, X, Zap } from 'lucide-react';
import { completeOrientation, getLevelState, initialProgress, levels, questions, restoreProgress, stages, units, type Progress } from './learning';
import './styles.css';
import { AccountPanel, AccountProvider, backend, useAccount } from './account';
import { playCue, readSoundSetting, writeSoundSetting } from './sound';
import { CATALOGUE_TOPICS, EVIDENCE_LABELS } from './contentContract';
import { SignerPlayerShell } from './components/SignerPlayerShell';
import { StatBadges, StageJourney, TopicTicker, WordMatch } from './components/HomeJourney';
import HeaderNav from './components/HeaderNav';
import AuthPage from './components/AuthPage';

type Page = 'Home' | 'Learn' | 'Review' | 'Dictionary' | 'Family' | 'Profile';
const nav = [{ name: 'Home', icon: Home }, { name: 'Learn', icon: Map }, { name: 'Review', icon: RotateCcw }, { name: 'Dictionary', icon: BookOpen }, { name: 'Family', icon: Users }, { name: 'Profile', icon: Settings }] as const;

function Sprout({ small = false, mood = 'calm' }: { small?: boolean; mood?: 'calm' | 'happy' | 'encourage' }) {
  const src = mood === 'happy' ? '/visual/maya/pose-cheering.webp' : mood === 'encourage' ? '/visual/maya/pose-pointing.webp' : '/visual/maya/front.webp';
  return <img src={src} alt="Maya, your Philippine tree sparrow learning companion" className={`sprout ${small ? 'small' : ''} sprout--${mood}`} width={small ? 110 : 210} height={small ? 118 : 225} style={{ objectFit: 'contain' }} decoding="async" />;
}
function App() {
  const account = useAccount();
  const [accountLoading, setAccountLoading] = useState(false);
  const [page, setPage] = useState<Page>('Home');
  const [guest, setGuest] = useState(() => { try { return localStorage.getItem('kamayo-guest') === '1'; } catch { return true; } });
  const continueAsGuest = () => { try { localStorage.setItem('kamayo-guest', '1'); } catch { /* storage blocked: stay a guest for this visit */ } setGuest(true); };
  const [progress, setProgress] = useState<Progress>(() => { try { return restoreProgress(localStorage.getItem('kamayo-preview-v1')); } catch { return { ...initialProgress }; } });
  const [storageError, setStorageError] = useState(false);
  const [progressOwner, setProgressOwner] = useState('local');
  const [lesson, setLesson] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [notice, setNotice] = useState('');
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menu) return;
    sidebar.current?.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenu(false);
      menuButton.current?.focus();
    };
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!sidebar.current?.contains(target) && !menuButton.current?.contains(target)) setMenu(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOutside);
    };
  }, [menu]);
  const [stage, setStage] = useState(0);
  const [list, setList] = useState(false);
  const [homeList, setHomeList] = useState(false);
  const [showPlayerPreview, setShowPlayerPreview] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All signs');
  const [dark, setDark] = useState(false);
  const [soundOn, setSoundOn] = useState<boolean>(() => readSoundSetting());
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    writeSoundSetting(next);
    if (next) playCue('select', true);
  };
  useEffect(() => { if (account.session || !account.ready || progressOwner !== 'local') return; try { localStorage.setItem('kamayo-preview-v1', JSON.stringify(progress)); setStorageError(false); } catch { setStorageError(true); } }, [progress, progressOwner, account.session, account.ready]);
  useEffect(() => {
    let alive = true;
    if (account.session) {
      setProgressOwner(account.session.user.id);
      setAccountLoading(true);
      setProgress({ ...initialProgress, onboarding: true });
      account.refresh().then(p => { if (alive && p) setProgress(p); }).catch(e => { if (alive) setNotice(e.message); }).finally(() => { if (alive) setAccountLoading(false); });
    } else if (account.ready) {
      try { setProgress(restoreProgress(localStorage.getItem('kamayo-preview-v1'))); } catch { setProgress({ ...initialProgress }); }
      setProgressOwner('local');
    }
    return () => { alive = false; };
  }, [account.session?.user.id, account.ready]);
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  const go = (next: Page) => { setPage(next); setMenu(false); setNotice(''); if (menu) menuButton.current?.focus(); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); };
  const start = () => { if (!account.ready || accountLoading) { setNotice('Please wait while your account progress loads.'); return; } progress.onboarding ? setLesson(true) : setOnboarding(true); };
  const todayXp = progress.completedAt && new Date(progress.completedAt).toDateString() === new Date().toDateString() ? progress.xp : 0;
  const daily = Math.min(100, todayXp / progress.goal * 100);
  const done = progress.completed.includes(1);
  const selectedLevels = levels.slice(stage * 20, stage * 20 + 20);
  if (account.ready && !account.session && !guest) return <AuthPage onGuest={continueAsGuest}/>;
  return <div className={`app-shell page-${page.toLowerCase()}`}>
    <a href="#main" className="skip-link">Skip to content</a>
    <aside ref={sidebar} id="learning-navigation" className={`sidebar ${menu ? 'open' : ''}`}>
      <button className="brand" onClick={() => go('Home')} aria-label="Kamayo home"><span className="brand-mark"><img src="/visual/maya/logo-circle.webp" alt="" width={26} height={26} style={{ objectFit: 'contain' }} /></span>kamayo<span className="brand-dot">.</span></button>
      <p className="brand-caption">SMALL SIGNS. BIG CONNECTIONS.</p>
      <nav aria-label="Main navigation">{nav.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${page === name ? 'active' : ''}`} onClick={() => go(name)} aria-current={page === name ? 'page' : undefined}><Icon size={21}/><span>{name === 'Family' ? 'Family explorer' : name}</span>{name === 'Learn' && <span className="new-pill">START</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="kind-card"><Heart size={19}/><p>A little practice.<br/><strong>A world of connection.</strong></p></div><button className="learner-button" onClick={() => go('Profile')}><span className="avatar">K</span><span>My learning space<small>{account.session ? 'Connected account' : 'Local preview'}</small></span><ChevronRight size={16}/></button></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><button ref={menuButton} className="mobile-menu icon-button" aria-label="Toggle navigation" aria-controls="learning-navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button><HeaderNav page={page} go={go} signedIn={!!account.session}/><div className="breadcrumb"><span className="breadcrumb-root">Your learning space</span> <ChevronRight size={13}/><strong>{page === 'Family' ? 'Family explorer' : page}</strong></div><div className="top-stats"><span className="language"><span className="flag">🇵🇭</span> Filipino Sign Language</span><span className="stat flame"><Flame size={19}/> {todayXp ? 1 : 0}<span className="sr-only">day practice streak</span></span><span className="stat xp"><Zap size={18}/> {progress.xp}<span className="sr-only">experience points</span></span><button type="button" className="sound-pill" aria-pressed={soundOn} aria-label={soundOn ? 'Mute gentle sound cues' : 'Enable gentle sound cues'} onClick={toggleSound}>{soundOn ? <Volume2 size={16}/> : <VolumeX size={16}/>}<span className="sound-label">{soundOn ? 'Sound on' : 'Sound off'}</span></button><button className="avatar" aria-label="Open profile" onClick={() => go('Profile')}>K</button></div></header>
      <main id="main" className="main-content">
        {storageError && <p role="alert" className="warning">Browser storage is unavailable. Progress will last only while this page stays open.</p>}
        {notice && <div className="notice" role="status"><CircleHelp size={19}/>{notice}<button className="icon-button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={17}/></button></div>}
        <div className="content-grid"><div className="primary-content">
          {page === 'Home' && <>
            <div className="page-heading"><div><p className="eyebrow">LET’S MAKE CONNECTIONS</p><h1 className="kamayo-title-enter">A little sign. A big hello<span className="green">.</span></h1><p>Your Filipino Sign Language journey starts with one small step.</p></div><span className="sun-doodle" aria-hidden="true">✳</span></div>
            <section className="hero-card"><picture className="hero-diorama-wrap" aria-hidden="true"><source media="(max-width: 760px)" srcSet="/art/kamayo-hero-mobile.webp" /><img src="/art/kamayo-hero-desktop.webp" alt="" className="hero-diorama" /></picture><div className="hero-copy"><span className="label light"><Leaf size={14}/> YOUR JOURNEY STARTS HERE</span><h2 className="kamayo-display-enter">Learn to sign.<br/>Learn to connect.</h2><p>New expressions. New perspectives.<br/>A whole new way to say you belong.</p><button className="button dark-button" onClick={start}>{done ? 'Revisit your first lesson' : 'Let’s take the first step'}<ArrowRight size={18}/></button><div className="hero-meta"><span><Video size={14}/> Bite-sized lessons</span><span><Heart size={14}/> At your own pace</span></div></div><div className="hero-art"><span className="floating-tag hello">Kumusta!</span><Sprout mood="calm"/><span className="floating-tag connection"><Sparkles size={15}/> Made for connection</span></div></section>
            <StatBadges xp={progress.xp} completed={progress.completed.length} streak={todayXp ? 1 : 0}/>
            <section className="journey-section"><div className="section-heading"><h2>Your learning path</h2><div className="journey-actions"><button type="button" className="text-button" onClick={() => setHomeList(v => !v)}>{homeList ? 'Path view' : 'List view'}</button><button className="text-button" onClick={() => go('Learn')}>Explore all levels <ArrowRight size={16}/></button></div></div><div className="unit-banner"><span className="unit-icon"><Leaf size={25}/></span><div><span className="eyebrow">STAGE 1 · BEGINNER</span><h3>A new way to connect</h3><p>Start with the foundations. Build something meaningful.</p></div><span className="unit-progress">{done ? 1 : 0}/5 <span>levels</span></span></div><div className={homeList ? 'mini-list' : 'mini-path'}>{levels.slice(0, 5).map((l, i) => <div className={`mini-stop stop-${i} ${i === 0 ? 'current' : ''}`} key={l.id}><button className={`level-node ${i === 0 ? 'ready' : 'locked'}`} onClick={() => i === 0 ? start() : setNotice('This lesson is upcoming. It will open after FSL content review and publication.')} aria-label={`Level ${l.id}: ${l.title}${i > 0 ? ', upcoming' : ''}`}>{i === 0 ? done ? <Check size={26}/> : <Star size={28} fill="currentColor"/> : i === 4 ? <Trophy size={24}/> : <LockKeyhole size={21}/>}</button><div><span>{i === 0 ? done ? 'Completed!' : 'Start here' : i === 4 ? 'Checkpoint' : `Level ${l.id}`}</span>{homeList ? <small> · {l.title}{i > 0 ? ' (upcoming)' : ''}</small> : i === 0 && <small>Welcome to FSL</small>}</div></div>)}</div><div className="path-caption"><ShieldCheck size={15}/> Sign lessons open as educator-reviewed content becomes available.</div></section>
            <StageJourney maya={<Sprout small mood="happy"/>} done={done} onStart={start} onLearn={() => go('Learn')}/>
            <TopicTicker/>
            <div className="section-heading"><h2>A little more to explore</h2><span className="muted-small">Find your own rhythm</span></div><div className="explore-grid"><button className="explore-card lavender" onClick={() => go('Dictionary')}><span className="explore-icon"><BookOpen size={25}/></span><div><h3>A world of signs</h3><p>Make room for new words.</p><span>Explore the dictionary <ArrowRight size={14}/></span></div><span className="card-spark">✧</span></button><button className="explore-card peach" onClick={() => go('Family')}><span className="explore-icon"><Users size={26}/></span><div><h3>People, connected</h3><p>Start with the ones closest to you.</p><span>Meet the family explorer <ArrowRight size={14}/></span></div></button></div>
            <WordMatch/>
          </>}
          {page === 'Learn' && <><div className="page-heading"><div><p className="eyebrow">ONE SMALL STEP AT A TIME</p><h1>Your learning journey<span className="green">.</span></h1><p>Five stages. One hundred steps toward connection.</p></div><Map className="heading-icon"/></div><figure className="page-banner" aria-hidden="true"><img src="/visual/bg/learn.webp" alt="" width={1600} height={893} loading="lazy" decoding="async"/></figure><div className="toolbar"><label className="select-wrap"><span className="sr-only">Learning stage</span><select value={stage} onChange={e => setStage(Number(e.target.value))}>{stages.map((s, i) => <option value={i} key={s}>{i + 1}. {s} · Levels {i * 20 + 1}–{i * 20 + 20}</option>)}</select><ChevronDown size={16}/></label><button className="secondary-button" onClick={() => setList(!list)}>{list ? 'Map view' : 'List view'}</button></div><div className="curriculum-note"><ShieldCheck size={18}/><p>The full path is planned. Orientation is available now; sign lessons await fluent FSL review. Course completion does not certify fluency.</p></div>{Array.from({ length: 4 }, (_, unit) => <section className="map-unit" key={`${stage}-${unit}`}><div className="unit-banner"><span className="unit-icon"><Leaf size={23}/></span><div><span className="eyebrow">UNIT {stage * 4 + unit + 1} · {stages[stage].toUpperCase()}</span><h3>{units[stage * 4 + unit]}</h3></div><span className="unit-progress">{unit === 0 && stage === 0 && done ? '1' : '0'}/5</span></div><div className={list ? 'level-list' : 'map-stops'}>{selectedLevels.slice(unit * 5, unit * 5 + 5).map(l => <button key={l.id} className={`map-level ${getLevelState(l, progress)}`} onClick={() => l.published ? start() : setNotice('Upcoming: this level needs reviewed demonstrations and activities before publication.')}><span className="level-node">{getLevelState(l, progress) === 'completed' ? <Check/> : l.published ? <Star/> : l.checkpoint ? <Trophy/> : <LockKeyhole/>}</span><span><strong>{l.title}</strong><small>Level {l.id} · {l.published ? done ? 'Completed · revisit' : 'Ready to begin' : l.stageCheck ? 'Stage assessment · upcoming' : l.checkpoint ? 'Checkpoint · upcoming' : 'Upcoming'}</small></span></button>)}</div></section>)}</>}
          {page === 'Review' && <><PageHeading eyebrow="MAKE IT STICK" title="A little practice goes a long way." text="Return to what you’ve learned, whenever you need it."/><figure className="page-banner" aria-hidden="true"><img src="/visual/bg/review.webp" alt="" width={1600} height={893} loading="lazy" decoding="async"/></figure><section className="empty-state"><span className="large-icon mint"><RotateCcw size={35}/></span><h2>{done ? 'Keep the foundations fresh' : 'Your practice space is taking root'}</h2><p>{done ? `Your orientation review is scheduled for ${progress.reviewAt}. You can revisit it any time. Recognition and signing review will arrive with published sign lessons.` : 'Complete your first lesson to begin. As you learn, this space will bring earlier material back for practice.'}</p><button className="button green-button" onClick={start}>{done ? 'Review orientation' : 'Start your first lesson'}<ArrowRight size={18}/></button></section><section className="settings-card"><h2>How Kamayo distinguishes learning evidence</h2><div className="evidence-list">{(['viewed', 'comprehension_result', 'retrieval_result', 'self_practice', 'educator_assessment'] as const).map(key => <div className="evidence-row" key={key}><strong>{EVIDENCE_LABELS[key].title}</strong><p>{EVIDENCE_LABELS[key].summary}</p></div>)}</div></section><div className="info-card"><Sparkles/><div><h3>Practice, without the pressure</h3><p>Mistakes lead to explanations and another try. Your completed levels stay completed, even when a review is due.</p></div></div></>}
          {page === 'Dictionary' && <><PageHeading eyebrow="A WORLD OF EXPRESSION" title="Your sign dictionary." text="A growing home for educator-reviewed FSL demonstrations and documented variations."/><figure className="page-banner" aria-hidden="true"><img src="/visual/bg/dictionary.webp" alt="" width={1600} height={893} loading="lazy" decoding="async"/></figure><label className="search-box"><Search size={20}/><span className="sr-only">Search dictionary topics</span><input placeholder="Search Filipino or English topics (e.g. kumusta, nanay, pakiulit)" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button className="icon-button" onClick={() => setQuery('')} aria-label="Clear search"><X size={16}/></button>}</label><div className="filter-tabs">{['All signs', 'Greetings', 'Family', 'Everyday', 'Repair'].map(c => <button key={c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div>{(() => { const q = query.trim().toLowerCase(); const matches = CATALOGUE_TOPICS.filter(t => (category === 'All signs' || t.domain === category) && (!q || [t.title, t.summary, ...t.englishAliases, ...t.filipinoAliases].join(' ').toLowerCase().includes(q))); return <> <div className="dictionary-grid">{matches.map(topic => { const topicArt = topic.domain === 'Family' ? '/visual/medallions/topic-family.webp' : topic.domain === 'Everyday' ? '/visual/medallions/topic-everyday.webp' : topic.domain === 'Repair' ? '/visual/medallions/topic-repair.webp' : '/visual/medallions/topic-greetings.webp'; return <article className="dictionary-card" key={topic.id}><div className="dictionary-art"><img src={topicArt} alt="" width={68} height={68} style={{ objectFit: 'contain' }} loading="lazy" decoding="async"/><span>✦</span></div><div><span className="label">UPCOMING · {topic.status === 'fsl_review' ? 'AWAITING FSL REVIEW' : 'DRAFT TOPIC'}</span><h3>{topic.title}</h3><p>{topic.summary}</p><small>Lookup aliases: {[...topic.filipinoAliases.slice(0, 3), ...topic.englishAliases.slice(0, 2)].join(', ')}</small></div></article>; })}</div>{matches.length === 0 && <div className="empty-search"><p>No topics match “{query}”. Try kumusta, nanay, pakiusap, or repair.</p><button type="button" className="secondary-button" onClick={() => { setQuery(''); setCategory('All signs'); }}>Reset search &amp; filter</button></div>}</>; })()}<div className="signer-preview-toggle"><button type="button" className="secondary-button" aria-expanded={showPlayerPreview} onClick={() => setShowPlayerPreview(v => !v)}><Video size={16}/>{showPlayerPreview ? 'Hide signer player shell preview' : 'Preview signer-first player controls'}</button></div>{showPlayerPreview && <SignerPlayerShell title="Dictionary demonstration shell preview" captionsText="Reviewed concepts will display documented regional/community variations and below-frame support here once Deaf FSL reviewers approve media." />}<div className="info-card"><ShieldCheck/><p>Every sign demonstration needs a fluent FSL reviewer’s approval, contributor permission, and accessible media before it appears here.</p></div></>}
          {page === 'Family' && <><PageHeading eyebrow="PEOPLE, CONNECTED" title="Every family has a story." text="Explore relationships, then learn their signs when reviewed lessons arrive."/><figure className="page-banner" aria-hidden="true"><img src="/visual/bg/family.webp" alt="" width={1600} height={893} loading="lazy" decoding="async"/></figure><FamilyExplorer/><div className="info-card"><Heart/><p>Families come in many forms. This is a relationship reference; no personal names or family records are collected.</p></div></>}
          {page === 'Profile' && <>{!account.session && <div className="info-card ka-cta"><div><h3>Keep your progress on every device</h3><p>Create a free account or sign in. Your guest progress on this device stays as it is.</p></div><button className="button green-button" onClick={() => { try { localStorage.removeItem('kamayo-guest'); } catch { /* ignore */ } setGuest(false); }}>Sign in or create an account</button></div>}{(account.session || !backend) && <AccountPanel/>}<PageHeading eyebrow="YOUR OWN PACE. YOUR OWN PATH." title="Look how you’re growing." text="Small steps count. Make your learning space work for you."/><section className="profile-card"><span className="avatar big">K</span><div><h2>A new connection maker</h2><p>{done ? 'Your journey has begun' : 'Every journey starts somewhere'}</p><span className="label">LOCAL PREVIEW · NO ACCOUNT CONNECTED</span></div></section><div className="metric-grid"><div><img className="token" src="/visual/ui/gem.webp" alt="" width={44} height={44}/><strong>{progress.xp}</strong><span>Total XP</span></div><div><img className="token" src="/visual/ui/check-leaf.webp" alt="" width={44} height={44}/><strong>{progress.completed.length}/100</strong><span>Levels completed</span></div><div><img className="token" src="/visual/ui/flame.webp" alt="" width={44} height={44}/><strong>Beginner</strong><span>Current stage</span></div></div><section className="settings-card"><h2>Make it yours</h2><div className="setting-row"><div><h3>Daily goal</h3><p>A gentle target for everyday practice.</p></div><select aria-label="Daily XP goal" value={progress.goal} onChange={async e => { const goal = Number(e.target.value); if (account.session && backend) { const { error } = await backend.from('learner_preferences').upsert({ user_id: account.session.user.id, daily_goal: goal }); if (error) { setNotice('Could not save your daily goal. Please try again.'); return; } } setProgress(p => ({ ...p, goal })); }}>{[10, 20, 30].map(n => <option key={n} value={n}>{n} XP / day</option>)}</select></div><div className="setting-row"><div><h3>Evening mode</h3><p>A softer palette for your screen.</p></div><button className={`toggle ${dark ? 'on' : ''}`} role="switch" aria-checked={dark} aria-label="Evening mode" onClick={() => setDark(!dark)}><span/></button></div><div className="setting-row"><div><h3>Gentle sound cues</h3><p>Soft wood taps and chimes while practicing. Muted by default.</p></div><button className={`toggle ${soundOn ? 'on' : ''}`} role="switch" aria-checked={soundOn} aria-label="Gentle sound cues" onClick={toggleSound}><span/></button></div><div className="setting-row"><div><h3>Progress storage</h3><p>{account.session ? 'Account results are verified and stored on the server. Local preview progress stays separate.' : 'Preview progress is saved only in this browser. Sign in after Supabase is configured to sync progress.'}</p></div><ShieldCheck className="green"/></div></section><section className="badge-card"><Trophy size={30}/><div><h3>{done ? 'First step, taken!' : 'Your first milestone awaits'}</h3><p>{done ? 'You completed the FSL orientation. Keep that curiosity growing.' : 'Finish the orientation to earn your first learning milestone.'}</p></div></section></>}
        </div>
        <aside className="right-rail"><section className="daily-card"><div className="section-heading"><h3>Your daily intention</h3><Target size={18}/></div><p>A small moment for learning.</p><div className="daily-ring" style={{ '--daily': `${daily}%` } as React.CSSProperties}><span><Zap size={24}/><strong>{todayXp}<small> / {progress.goal} XP</small></strong><small>{daily === 100 ? 'Goal reached!' : 'You’ve got this'}</small></span></div><button className="text-button" onClick={() => go('Profile')}>Adjust your goal <ChevronRight size={14}/></button></section><section className="companion-card"><Sprout small/><h3>Hey, I’m Maya!</h3><p>We don’t have to get it perfect.<br/>We just have to start.</p><span className="maya-signature">Your little learning companion</span></section><section className="journey-facts"><span className="eyebrow">BUILT AROUND YOU</span><div><span className="fact-icon"><Video size={17}/></span><p>See it. Try it. Remember it.<small>Learn through visual experiences.</small></p></div><div><span className="fact-icon"><Heart size={17}/></span><p>Progress over perfection.<small>No lives lost. No pressure.</small></p></div><div><span className="fact-icon"><ShieldCheck size={17}/></span><p>Rooted in the Deaf community.<small>Sign content requires FSL review.</small></p></div></section><footer className="rail-footer">MADE FOR MEANINGFUL CONNECTIONS<br/><span>Kamayo · Filipino Sign Language</span></footer></aside>
        </div><footer className="mobile-footer">Small signs. Big connections. <Leaf size={13}/></footer>
      </main>
    </div>
    <nav className="bottom-nav" aria-label="Mobile navigation">{nav.filter(n => n.name !== 'Family').map(({ name, icon: Icon }) => <button key={name} className={page === name ? 'active' : ''} onClick={() => go(name)} aria-current={page === name ? 'page' : undefined}><Icon size={22}/><span>{name}</span></button>)}</nav>
    {onboarding && <Modal onClose={() => setOnboarding(false)} title="Make a little room for learning"><Sprout small mood="calm"/><p>Choose a daily intention. You can change it any time.</p><div className="goal-options">{[10, 20, 30].map((n, i) => <button key={n} className={progress.goal === n ? 'selected' : ''} onClick={() => { setProgress({ ...progress, goal: n }); playCue('select', soundOn); }}><span>{['A gentle start', 'A steady rhythm', 'A little extra'][i]}</span><strong>{n} XP / day</strong>{progress.goal === n && <Check size={19}/>}</button>)}</div><p className="muted-small">This preview saves progress in your browser. No account or camera is needed.</p><button className="button green-button full" onClick={() => { setProgress(p => ({ ...p, onboarding: true })); setOnboarding(false); setLesson(true); playCue('select', soundOn); }}>Let’s begin <ArrowRight size={18}/></button></Modal>}
    {lesson && <Lesson soundOn={soundOn} onClose={() => setLesson(false)} completed={done} onComplete={async () => { if (account.session) { const p = await account.refresh(); if (p) setProgress(p); } else setProgress(p => completeOrientation(p)); }}/>}
  </div>;
}
function PageHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1 className="kamayo-title-enter">{title}</h1><p>{text}</p></div></div>; }
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement; dialog.current?.showModal(); const prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = prevOverflow; previous?.focus(); }; }, []);
  return <dialog ref={dialog} onCancel={e => { e.preventDefault(); onClose(); }} className="modal" aria-labelledby="modal-title"><button className="modal-close icon-button" onClick={onClose} aria-label="Close dialog"><X/></button><h2 id="modal-title">{title}</h2>{children}</dialog>;
}
function Lesson({ onClose, onComplete, completed, soundOn }: { onClose: () => void; onComplete: () => Promise<void>; completed: boolean; soundOn: boolean }) {
  const [wasAlreadyDone] = useState(completed);
  const account = useAccount();
  const [attempt, setAttempt] = useState<string | null>(null);
  const [busy, setBusy] = useState(Boolean(account.session));
  const [error, setError] = useState('');
  const [serverCorrect, setServerCorrect] = useState<boolean | null>(null);
  useEffect(() => {
    if (!account.session || !backend) return;
    let alive = true;
    backend.rpc('begin_orientation', { p_level: 1 }).then(async ({ data, error }) => {
      if (!alive) return;
      if (error) { setError(error.message); setBusy(false); return; }
      setAttempt(data);
      const saved = await backend!.from('learning_attempts').select('next_question,completed_at').eq('id', data).single();
      if (!alive) return;
      if (saved.error) setError('Could not resume this attempt. Close the lesson and try again.');
      else if (!saved.data.completed_at) setStep(saved.data.next_question);
      setBusy(false);
    });
    return () => { alive = false; };
  }, [account.session?.user.id]);
  const [step, setStep] = useState(0); const [selected, setSelected] = useState<number | null>(null); const [checked, setChecked] = useState(false); const [finished, setFinished] = useState(false); const [hint, setHint] = useState(false);
  // Each new step opens at its top, so the demonstration stage (signer first) is what the learner sees, not the previous step's buttons.
  useEffect(() => { const m = document.querySelector('dialog.modal'); if (m) m.scrollTop = 0; }, [step, finished]);
  const q = questions[step]; const correct = serverCorrect ?? selected === q.answer;
  const [resumed, setResumed] = useState(false);
  useEffect(() => { if (account.session) return; try { const v = Number(sessionStorage.getItem('kamayo-orientation-step')); if (v > 0 && v < questions.length) { setStep(v); setResumed(true); } } catch { /* Storage is optional. */ } }, []);
  const checkAnswer = async () => {
    setError('');
    if (account.session) {
      if (!attempt || !backend) { setError('Could not start this attempt. Close the lesson and try again.'); return; }
      setBusy(true);
      try { const { data, error } = await backend.rpc('answer_orientation', { p_attempt: attempt, p_question: step, p_option: selected }); if (error) throw error; setServerCorrect(data.correct); setChecked(true); playCue(data.correct ? 'correct' : 'retry', soundOn); } catch (e) { setError(e instanceof Error ? e.message : 'Could not check the answer. Try again.'); } finally { setBusy(false); }
    } else {
      const ok = selected === q.answer;
      setChecked(true);
      playCue(ok ? 'correct' : 'retry', soundOn);
    }
  };
  const next = async () => {
    if (step === questions.length - 1) {
      setBusy(true); setError('');
      try { await onComplete(); setFinished(true); playCue('complete', soundOn); if (!account.session) sessionStorage.removeItem('kamayo-orientation-step'); } catch (e) { setError(e instanceof Error ? e.message : 'Could not confirm completion. Try again.'); } finally { setBusy(false); }
    } else {
      setStep(s => s + 1); setSelected(null); setChecked(false); setHint(false); setServerCorrect(null);
      if (!account.session) try { sessionStorage.setItem('kamayo-orientation-step', String(step + 1)); } catch { /* Optional. */ }
    }
  };
  return <Modal onClose={onClose} title={finished ? 'Your first connection starts here.' : 'Welcome to FSL'}>{finished ? <div className="lesson-finish"><Sprout mood="happy"/><span className="label">FIRST STEP, TAKEN</span><p>You’ve explored the foundations of learning FSL. The next lessons will open as reviewed demonstrations become available.</p><div className="earned"><Zap/> {wasAlreadyDone ? 'Orientation revisited · no duplicate XP' : '+20 XP · Orientation complete'}</div><button className="button green-button full" onClick={onClose}>Back to my journey <ArrowRight size={18}/></button></div> : <><div className="lesson-meta"><span>ORIENTATION · {step + 1} OF {questions.length}</span><span>No lives. Just learning.</span></div><div className="progress-track"><span style={{ width: `${(step + (checked && correct ? 1 : 0)) / questions.length * 100}%` }}/></div>{resumed && <p className="muted-small">Welcome back. We kept your place.</p>}{step === 1 && <SignerPlayerShell title="Demonstration framing guide" captionsText={q.text} />}<div className="lesson-teach"><span className="lesson-illustration">{step === 0 ? <Hand size={42}/> : step === 1 ? <Video size={42}/> : <Leaf size={42}/>}</span><h3>{q.title}</h3><p>{q.text}</p></div><h3 className="question-title">{q.prompt}</h3><div className="answer-options">{q.options.map((option, i) => <button key={option} className={`${selected === i ? 'selected' : ''} ${checked && selected === i ? correct ? 'correct' : 'incorrect' : ''}`} disabled={checked || busy} aria-pressed={selected === i} onClick={() => { setSelected(i); playCue('select', soundOn); }}><span className="answer-letter">{String.fromCharCode(65 + i)}</span>{option}{checked && i === selected && correct && <Check size={19}/>}</button>)}</div><button className="text-button hint-button" onClick={() => setHint(!hint)} aria-expanded={hint}><CircleHelp size={15}/>{hint ? 'Hide hint' : 'A little hint'}</button>{hint && <p className="hint">{q.hint}</p>}{checked && <div className={`answer-feedback ${correct ? 'success' : 'retry'}`} role="status"><strong>{correct ? 'You’ve got it!' : 'Let’s look again.'}</strong><p>{q.explanation}</p></div>}<div aria-live="polite">{busy && <p className="muted-small">Connecting to your learning space…</p>}{error && <p className="account-error" role="alert">{error}</p>}</div><div className="lesson-actions"><span>Take your time. This is your pace.</span>{!checked ? <button className="button green-button" disabled={selected === null || busy || Boolean(account.session && !attempt)} onClick={checkAnswer}>Check answer <Check size={17}/></button> : correct ? <button className="button green-button" disabled={busy} onClick={next}>{step === questions.length - 1 ? 'Finish orientation' : 'Continue'}<ArrowRight size={17}/></button> : <button className="button green-button" onClick={() => { setChecked(false); setSelected(null); setServerCorrect(null); }}>Try again <RotateCcw size={17}/></button>}</div></>}</Modal>;
}
function FamilyExplorer() {
  const [relation, setRelation] = useState('You'); const [asList, setAsList] = useState(false);
  const groups = [['Grandparent', 'Grandparent'], ['Parent', 'Parent'], ['Sibling', 'You', 'Sibling']];
  return <section className="family-card"><div className="section-heading"><h2>A family, at a glance</h2><button className="text-button" onClick={() => setAsList(!asList)}>{asList ? 'Tree view' : 'List view'}</button></div><div className={asList ? 'family-list' : 'family-tree'}>{groups.map((group, g) => <div className="family-generation" key={g}>{group.map((r, i) => <button key={`${r}-${i}`} className={`relative ${relation === r ? 'selected' : ''}`} onClick={() => setRelation(r)}><span className="relative-icon"><Users size={25}/></span>{r}</button>)}</div>)}</div><div className="relation-detail"><strong>{relation}</strong><p>{relation === 'You' ? 'The starting point for exploring this sample family.' : `A ${relation.toLowerCase()} relationship in this sample family. FSL demonstrations will appear here after educator review.`}</p><span className="label">RELATIONSHIP REFERENCE · SIGN VIDEO UPCOMING</span></div></section>;
}
export function KamayoRoot() {
  return (
    <AccountProvider>
      <App />
    </AccountProvider>
  );
}
export default KamayoRoot;
