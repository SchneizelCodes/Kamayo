import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronDown, Hand, Home, Map, RotateCcw, User, Users, type LucideIcon } from 'lucide-react';

// Kamayo header navigation (2026-11-14): replaces the left sidebar on desktop. Few words on the bar;
// the pages live in two dropdowns. Esc and outside clicks close them.
type Page = 'Home' | 'Learn' | 'Review' | 'Dictionary' | 'Family' | 'Profile';
const GROUPS: Array<{ id: string; label: string; items: Array<{ page: Page; label: string; desc: string; icon: LucideIcon }> }> = [
  { id: 'learn', label: 'Learn', items: [
    { page: 'Learn', label: 'Learning journey', desc: 'Five stages, one hundred levels', icon: Map },
    { page: 'Review', label: 'Review', desc: 'Practise what you have learned', icon: RotateCcw },
  ] },
  { id: 'explore', label: 'Explore', items: [
    { page: 'Dictionary', label: 'Dictionary', desc: 'Educator-reviewed signs and variations', icon: BookOpen },
    { page: 'Family', label: 'Family explorer', desc: 'Words for the people at home', icon: Users },
  ] },
];
export default function HeaderNav({ page, go, signedIn }: { page: Page; go: (p: Page) => void; signedIn: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, []);
  useEffect(() => setOpen(null), [page]);
  return (
    <nav ref={ref} className="kh-nav" aria-label="Main navigation">
      <button className="brand" onClick={() => go('Home')} aria-label="Kamayo home"><span className="brand-mark"><img src="/visual/maya/logo-circle.webp" alt="" width={24} height={24} style={{ objectFit: 'contain' }} /></span>kamayo<span className="brand-dot">.</span></button>
      <button type="button" className={`kh-link ${page === 'Home' ? 'is-cur' : ''}`} onClick={() => go('Home')}><Home size={16}/>Home</button>
      {GROUPS.map((g) => {
        const cur = g.items.some((i) => i.page === page);
        return (
          <div key={g.id} className="kh-menu" onMouseEnter={() => setOpen(g.id)} onMouseLeave={() => setOpen((o) => (o === g.id ? null : o))}>
            <button type="button" className={`kh-link ${cur ? 'is-cur' : ''}`} aria-expanded={open === g.id} aria-controls={`kh-${g.id}`} onClick={() => setOpen(open === g.id ? null : g.id)}>{g.label}<ChevronDown size={15} className="kh-chev"/></button>
            <div id={`kh-${g.id}`} className={`kh-panel ${open === g.id ? 'is-open' : ''}`} hidden={open !== g.id}>
              {g.items.map((it) => (
                <button key={it.page} type="button" className={`kh-item ${it.page === page ? 'is-cur' : ''}`} onClick={() => go(it.page)}>
                  <span className="kh-ic"><it.icon size={18}/></span><span><b>{it.label}</b><small>{it.desc}</small></span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <button type="button" className={`kh-link ${page === 'Profile' ? 'is-cur' : ''}`} onClick={() => go('Profile')}><User size={16}/>{signedIn ? 'My space' : 'Profile'}</button>
    </nav>
  );
}
