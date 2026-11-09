import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, GitBranch, GitCommitHorizontal, Copy, Check, FileDiff } from 'lucide-react';
import { PROFILE_DATA } from '../data/profileData';
import { runScrollScene, clamp01 } from '../utils/scrollScene';
import { VoxelAvatar } from './experience/VoxelAvatar';

/* ──────────────────────────────────────────────────────────────
   Experience — a horizontal git branch you walk along.

   Scroll in: a small voxel character drops from above and lands on
   the first commit. Then ← / → (or the buttons / clicking a commit)
   walks it between commits; the panel below shows that commit in a
   GitHub-style view. Commit id = the date, commit message = what I did.

   Perf: CSS 3D only. Scroll drives one transform (the fall); walking is
   a CSS transition on one transform. React state changes only on
   landing / commit change.
   ────────────────────────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function parseMonth(s: string): { y: number; m: number } | null {
  const mt = s.trim().match(/^([A-Za-z]+)\.?\s+(\d{4})$/);
  if (!mt) return null;
  const m = MONTHS.findIndex((x) => x.toLowerCase() === mt[1].slice(0, 3).toLowerCase());
  return m < 0 ? null : { y: Number(mt[2]), m };
}
function periodParts(p: string) {
  const [a, b] = p.split(/\s*[—–]\s*|\s+-\s+/);
  return { start: parseMonth(a), end: b ? parseMonth(b) : null };
}
const companyShort = (c: string) => c.split(/\s[—-]\s/)[0];
const brandName = (c: string) =>
  companyShort(c).replace(/\s+(Softwares?|Services|Solutions|Technologies|LLP|Pvt|Ltd|Inc)\b.*$/i, '').trim();

const STEP_MS = 520; // walking time per commit
const FALL_PX = 400; // starts just above the heading so the drop is visible
const LANDED_AT = 0.42; // scroll progress at which the avatar touches down

interface Commit {
  id: string; // the date, e.g. 2025.09
  message: string;
  role: string;
  company: string;
  dateLabel: string;
  description: string;
  achievements: string[];
  technologies: string[];
}

export const Experience: React.FC = () => {
  // Oldest → newest, left → right (HEAD on the right)
  const commits: Commit[] = useMemo(
    () =>
      [...PROFILE_DATA.experience].reverse().map((e) => {
        const { start, end } = periodParts(e.period);
        const id = start ? `${start.y}.${String(start.m + 1).padStart(2, '0')}` : e.period;
        const fmt = (d: { y: number; m: number }) => `${MONTHS[d.m]} ${d.y}`;
        const dateLabel = start ? (end ? `${fmt(start)} – ${fmt(end)}` : fmt(start)) : e.period;
        return {
          id,
          message: e.summary ?? `${e.role} at ${brandName(e.company)}`,
          role: e.role,
          company: e.company,
          dateLabel,
          description: e.description,
          achievements: e.achievements,
          technologies: e.technologies,
        };
      }),
    [],
  );
  const n = commits.length;
  const degree = PROFILE_DATA.education[0];

  // Node positions along the branch (% of track width)
  const xOf = useCallback((i: number) => (n > 1 ? 24 + (i * 64) / (n - 1) : 50), [n]);

  const sectionRef = useRef<HTMLElement>(null);
  const fallRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState(false);
  const [justLanded, setJustLanded] = useState(false);
  const [active, setActive] = useState(0);
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState(1);
  const [walkMs, setWalkMs] = useState(STEP_MS);
  const [copied, setCopied] = useState(false);
  const activeRef = useRef(0);
  const landedRef = useRef(false);
  const walkTimer = useRef<number | undefined>(undefined);

  // ── Scroll: the fall ──
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastY = NaN;
    const handle = runScrollScene(section, (p) => {
      const f = reduced ? (p > 0.05 ? 1 : 0) : clamp01((p - 0.06) / (LANDED_AT - 0.06));
      const y = Math.round(-(1 - f * f) * FALL_PX); // accelerate like gravity
      if (y !== lastY) {
        lastY = y;
        if (fallRef.current) fallRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
        if (shadowRef.current) {
          shadowRef.current.style.opacity = String(0.15 + 0.6 * f);
          shadowRef.current.style.transform = `translateX(-50%) scale(${0.4 + 0.6 * f})`;
        }
      }
      const isLanded = f >= 1;
      if (isLanded !== landedRef.current) {
        landedRef.current = isLanded;
        setLanded(isLanded);
        if (isLanded) {
          setJustLanded(true);
          window.setTimeout(() => setJustLanded(false), 500);
        }
      }
      return false;
    });
    return () => handle.stop();
  }, []);

  // ── Walking between commits ──
  const goTo = useCallback(
    (target: number) => {
      const from = activeRef.current;
      const to = Math.max(0, Math.min(n - 1, target));
      if (to === from) return;
      const steps = Math.abs(to - from);
      activeRef.current = to;
      setFacing(to > from ? 1 : -1);
      setWalkMs(STEP_MS * steps);
      setWalking(true);
      setActive(to);
      window.clearTimeout(walkTimer.current);
      walkTimer.current = window.setTimeout(() => setWalking(false), STEP_MS * steps);
    },
    [n],
  );

  // ← / → while the section is centred on screen
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let inView = false;
    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting), { rootMargin: '-45% 0px -45% 0px' });
    io.observe(section);
    const onKey = (e: KeyboardEvent) => {
      if (!inView || !landedRef.current || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(activeRef.current + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(activeRef.current - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      io.disconnect();
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(walkTimer.current);
    };
  }, [goTo]);

  const c = commits[active];
  const avatarState = !landed ? 'falling' : walking ? 'walking' : justLanded ? 'landing' : '';
  const yaw = walking ? 72 * facing : 22;

  const copyId = () => {
    navigator.clipboard?.writeText(`${c.id} ${c.message}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section id="experience" ref={sectionRef} aria-label="Experience" className="relative bg-obsidian-950" style={{ height: '175vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(139,157,255,0.08),transparent_60%)]" />

        <div className="relative mx-auto flex h-full max-w-6xl flex-col px-5 pb-6 pt-8 md:px-10 md:pt-10">
          {/* Heading */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold-accent">04 — Experience</p>
              <h2 className="mt-2 font-serif text-4xl text-ivory md:text-5xl">
                Commit <em className="text-slate-400">history.</em>
              </h2>
            </div>
            <div
              className={`flex items-center gap-2 font-mono text-[11px] text-slate-500 transition-opacity duration-500 ${landed ? 'opacity-100' : 'opacity-0'}`}
            >
              <kbd className="rounded border border-slate-700 bg-obsidian-800 px-1.5 py-0.5 text-slate-300">←</kbd>
              <kbd className="rounded border border-slate-700 bg-obsidian-800 px-1.5 py-0.5 text-slate-300">→</kbd>
              <span className="hidden sm:inline">walk between commits</span>
            </div>
          </div>

          {/* ─── Branch track ─── */}
          <div className="relative mt-4 h-[236px] shrink-0 [container-type:inline-size] md:h-[272px]">
            {/* branch label */}
            <div className="absolute left-0 top-[124px] hidden items-center gap-1.5 font-mono text-[11px] text-slate-400 md:top-[144px] md:flex">
              <GitBranch className="h-3.5 w-3.5 text-gold-accent" /> main
            </div>
            {/* the branch line */}
            <div className="absolute left-0 right-0 top-[150px] h-[3px] rounded-full bg-gradient-to-r from-[#7DD3C0] via-gold-accent to-gold-accent md:top-[170px]" />
            <div className="absolute right-0 top-[144px] h-[15px] w-[15px] translate-x-1/2 rotate-45 border-r-[3px] border-t-[3px] border-gold-accent md:top-[164px]" />

            {/* origin: degree */}
            {degree && (
              <div className="absolute top-[150px] md:top-[170px]" style={{ left: 6 }}>
                <span className="absolute -left-[6px] -top-[4.5px] h-3 w-3 rounded-full border-2 border-[#7DD3C0] bg-obsidian-950" />
                <div className="absolute left-0 top-4 hidden w-[140px] -translate-x-1.5 md:block">
                  <p className="font-mono text-[10px] text-[#7DD3C0]">origin</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-slate-400">
                    {degree.qualification.replace(/ in /, ' · ')}
                    <br />
                    <span className="text-slate-500">{degree.result}</span>
                  </p>
                </div>
              </div>
            )}

            {/* commits */}
            {commits.map((cm, i) => {
              const on = i === active;
              return (
                <button
                  key={cm.id + i}
                  onClick={() => landed && goTo(i)}
                  className="group absolute top-[150px] -translate-x-1/2 md:top-[170px]"
                  style={{ left: `${xOf(i)}%` }}
                  aria-label={`Commit ${cm.id}: ${cm.message}`}
                  aria-current={on}
                >
                  <span
                    className={`absolute left-1/2 top-[1.5px] h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] transition-all duration-300 ${
                      on ? 'border-gold-accent bg-gold-accent shadow-[0_0_0_6px_rgba(139,157,255,0.18)]' : 'border-gold-accent bg-obsidian-950 group-hover:bg-gold-accent/40'
                    }`}
                  />
                  <span className="mt-5 flex w-[min(210px,28vw)] flex-col items-center text-center">
                    <span
                      className={`rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                        on ? 'border-gold-accent/60 bg-gold-accent/15 text-gold-light' : 'border-slate-700 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {cm.id}
                    </span>
                    {i === n - 1 && (
                      <span className="mt-1 rounded bg-gold-accent/15 px-1.5 py-px font-mono text-[10px] text-gold-light">HEAD → main</span>
                    )}
                    <span className={`mt-1.5 line-clamp-2 text-[11.5px] leading-snug ${on ? 'text-ivory' : 'text-slate-500'}`}>
                      {cm.message}
                    </span>
                  </span>
                </button>
              );
            })}

            {/* avatar: walks along x (CSS transition), falls along y (scroll) */}
            <div
              className="pointer-events-none absolute left-0 top-[149px] z-10 md:top-[169px]"
              style={{
                transform: `translate3d(${xOf(active)}cqw, 0, 0)`,
                transition: `transform ${walkMs}ms cubic-bezier(0.45, 0, 0.3, 1)`,
              }}
            >
              <div ref={shadowRef} className="absolute -top-[3px] left-0 h-[6px] w-[34px] rounded-[50%] bg-black/60" style={{ transform: 'translateX(-50%)' }} />
              {justLanded && <div className="vox-dust absolute -top-[6px] left-0 -ml-[22px] h-3 w-11 rounded-[50%] bg-slate-300/30" />}
              <div ref={fallRef} style={{ transform: `translate3d(0, ${-FALL_PX}px, 0)` }}>
                <div style={{ perspective: '700px', transform: 'scale(1.55)', transformOrigin: '0 0' }}>
                  <VoxelAvatar state={avatarState} yaw={yaw} />
                </div>
              </div>
            </div>
          </div>

          {/* ─── Commit detail (GitHub-style) ─── */}
          <div className={`mt-2 flex min-h-0 flex-1 items-start gap-3 transition-all duration-500 ${landed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <button
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              className="mt-24 hidden rounded-full border border-slate-700 p-2 text-slate-300 transition-colors hover:border-slate-500 hover:text-ivory disabled:opacity-30 md:block"
              aria-label="Previous commit"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <article key={c.id + active} className="commit-in flex max-h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117]">
              {/* header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363d] bg-[#161b22] px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5 text-[13px]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-accent/25 font-mono text-[10px] text-gold-light">
                    NG
                  </span>
                  <span className="truncate text-[#7d8590]">
                    <span className="font-semibold text-[#e6edf3]">naitik</span> committed {c.dateLabel}
                  </span>
                  <span className="hidden rounded-full border border-[#3fb950]/50 px-2 py-px text-[11px] text-[#3fb950] sm:inline">Verified</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[12px] text-[#7d8590]">
                  <GitCommitHorizontal className="h-4 w-4" />
                  commit
                  <span className="rounded-md border border-[#30363d] bg-[#0d1117] px-2 py-0.5 text-[#e6edf3]">{c.id}</span>
                  <button onClick={copyId} className="rounded p-1 hover:bg-[#30363d] hover:text-[#e6edf3]" aria-label="Copy commit">
                    {copied ? <Check className="h-3.5 w-3.5 text-[#3fb950]" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
                <h3 className="text-lg font-semibold leading-snug text-[#e6edf3] md:text-xl">{c.message}</h3>
                <p className="mt-1.5 text-[13px] text-[#7d8590]">
                  <span className="text-slate-300">{c.role}</span> · {c.company}
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-slate-300">{c.description}</p>

                {/* diff */}
                <div className="mt-4 overflow-hidden rounded-lg border border-[#30363d]">
                  <div className="flex items-center justify-between border-b border-[#30363d] bg-[#161b22] px-3 py-2 font-mono text-[12px] text-[#7d8590]">
                    <span className="flex items-center gap-2">
                      <FileDiff className="h-3.5 w-3.5" /> {brandName(c.company).toLowerCase().replace(/\s+/g, '-')}/work.md
                    </span>
                    <span className="text-[#3fb950]">+{c.achievements.length}</span>
                  </div>
                  <div className="font-mono text-[12.5px]">
                    {c.achievements.map((a, k) => (
                      <div key={a} className="flex bg-[#3fb950]/[0.08]">
                        <span className="w-9 shrink-0 select-none border-r border-[#3fb950]/20 py-1.5 pr-2 text-right text-[#7d8590]">{k + 1}</span>
                        <span className="w-6 shrink-0 select-none py-1.5 text-center text-[#3fb950]">+</span>
                        <span className="py-1.5 pr-3 font-sans text-[13px] leading-relaxed text-[#e6edf3]">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* labels */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.technologies.map((t) => (
                    <span key={t} className="rounded-full border border-gold-accent/40 bg-gold-accent/10 px-2.5 py-0.5 text-[12px] font-medium text-gold-light">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            <button
              onClick={() => goTo(active + 1)}
              disabled={active === n - 1}
              className="mt-24 hidden rounded-full border border-slate-700 p-2 text-slate-300 transition-colors hover:border-slate-500 hover:text-ivory disabled:opacity-30 md:block"
              aria-label="Next commit"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* mobile controls */}
          <div className={`mt-3 flex items-center justify-between md:hidden ${landed ? '' : 'invisible'}`}>
            <button onClick={() => goTo(active - 1)} disabled={active === 0} className="rounded-full border border-slate-700 p-2.5 text-slate-300 disabled:opacity-30" aria-label="Previous commit">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-[11px] text-slate-500">
              {active + 1} / {n}
            </span>
            <button onClick={() => goTo(active + 1)} disabled={active === n - 1} className="rounded-full border border-slate-700 p-2.5 text-slate-300 disabled:opacity-30" aria-label="Next commit">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
