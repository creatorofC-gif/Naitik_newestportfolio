import React, { useEffect, useRef, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { PROFILE_DATA } from '../data/profileData';
import { runScrollScene } from '../utils/scrollScene';

/* ──────────────────────────────────────────────────────────────
   Experience — a deck of 3D planes receding into depth.
   Scroll pulls the deck toward you: the front plane flies past the
   camera and the next one settles into focus. Built with CSS 3D
   transforms so the text stays crisp, selectable and accessible.
   Any number of roles works; education is the final plane.
   ────────────────────────────────────────────────────────────── */

const PER_PLANE_VH = 85;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number) => t * t * (3 - 2 * t);

type Plane =
  | { kind: 'role'; item: (typeof PROFILE_DATA.experience)[number] }
  | { kind: 'education' };

export const Experience: React.FC = () => {
  const planes: Plane[] = [
    ...PROFILE_DATA.experience.map((item) => ({ kind: 'role' as const, item })),
    { kind: 'education' as const },
  ];
  const n = planes.length;

  const sectionRef = useRef<HTMLElement>(null);
  const planeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const shades = planeRefs.current.map((node) => node?.querySelector<HTMLElement>('[data-shade]') ?? null);
    let current = 0;
    let lastApplied = -1;

    const handle = runScrollScene(section, (p, dt) => {
      // Each plane holds in focus for a moment before the deck advances.
      const q = p * (n - 1);
      const i = Math.min(n - 2, Math.floor(q));
      const t = q - i;
      const target = n > 1 ? i + smooth(clamp01((t - 0.3) / 0.55)) : 0;
      const diff = target - current;
      current = Math.abs(diff) < 0.0005 ? target : current + diff * Math.min(1, dt * 8);
      if (current === lastApplied) return false;
      lastApplied = current;

      planeRefs.current.forEach((node, idx) => {
        if (!node) return;
        const d = idx - current; // >0 behind, <0 already passed
        let x: number, y: number, z: number, rx: number, ry: number, o: number;
        if (d >= 0) {
          x = d * 54;
          y = -d * 40;
          z = -d * 240;
          rx = 6 + d * 2;
          ry = -14 - d * 3;
          o = clamp01(1 - d * 0.28);
        } else {
          const a = -d;
          x = -a * 180;
          y = a * 220;
          z = a * 620;
          rx = 6 - a * 26;
          ry = -14 + a * 10;
          o = clamp01(1 - a * 3);
        }
        node.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        node.style.opacity = o.toFixed(3);
        node.style.visibility = o < 0.01 ? 'hidden' : 'visible'; // drop fully faded planes from compositing
        node.style.zIndex = String(100 - idx);
        node.style.pointerEvents = Math.abs(d) < 0.5 ? 'auto' : 'none';
        const shade = shades[idx];
        if (shade) shade.style.opacity = clamp01(d * 0.35).toFixed(3);
      });
      if (railRef.current) railRef.current.style.transform = `scaleY(${n > 1 ? current / (n - 1) : 1})`;

      const nextActive = Math.round(current);
      setActive((prev) => (prev === nextActive ? prev : nextActive));
      return current !== target;
    });
    return () => handle.stop();
  }, [n]);

  const jumpTo = (idx: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const p = n > 1 ? (idx + 0.15) / (n - 1) : 0;
    window.scrollTo({ top: window.scrollY + rect.top + Math.min(1, p) * scrollable, behavior: 'smooth' });
  };

  return (
    <section
      id="experience"
      ref={sectionRef}
      aria-label="Experience"
      className="relative bg-obsidian-950"
      style={{ height: `${100 + n * PER_PLANE_VH}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Receding floor grid gives the deck a space to sit in */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] [perspective:900px]">
          <div
            className="absolute inset-x-[-50%] bottom-[-30%] h-[160%] origin-bottom [transform:rotateX(72deg)]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(230, 232, 238,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(230, 232, 238,0.07) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage: 'linear-gradient(to top, black 10%, transparent 75%)',
              WebkitMaskImage: 'linear-gradient(to top, black 10%, transparent 75%)',
            }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_65%_45%,rgba(139, 157, 255,0.08),transparent_55%)]" />

        <div className="relative mx-auto grid h-full max-w-7xl grid-rows-[auto_1fr] gap-6 px-5 py-10 md:px-10 lg:grid-cols-12 lg:grid-rows-1 lg:items-center">
          {/* Index */}
          <div className="lg:col-span-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold-accent">04 — Experience</p>
            <h2 className="mt-3 font-serif text-4xl leading-[1.05] text-ivory md:text-5xl">
              Where I’ve <em className="text-slate-400">shipped work.</em>
            </h2>

            <ol className="relative mt-10 hidden space-y-1 pl-5 lg:block">
              <span className="absolute bottom-2 left-0 top-2 w-px bg-slate-800" />
              <span ref={railRef} className="absolute left-0 top-2 h-[calc(100%-1rem)] w-px origin-top bg-gold-accent" />
              {planes.map((pl, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => jumpTo(idx)}
                    className={`group flex w-full items-baseline gap-4 rounded-lg py-2.5 text-left transition-colors ${
                      idx === active ? 'text-ivory' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="w-24 shrink-0 font-mono text-[11px]">
                      {pl.kind === 'role' ? pl.item.period.split('—')[0].trim() : 'Education'}
                    </span>
                    <span className="truncate text-sm">
                      {pl.kind === 'role' ? pl.item.company.split('—')[0].trim() : 'KJ Somaiya & schooling'}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {/* 3D deck */}
          <div className="relative min-h-0 lg:col-span-8 lg:h-[78%]" style={{ perspective: '1800px', perspectiveOrigin: '30% 30%' }}>
            <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
              {planes.map((pl, idx) => (
                <div
                  key={idx}
                  ref={(el) => {
                    planeRefs.current[idx] = el;
                  }}
                  className="absolute inset-x-0 top-1/2 mx-auto w-full max-w-[640px] will-change-transform"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="relative -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-700/70 bg-obsidian-900 shadow-[0_60px_80px_-40px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.06)]">
                    {/* Plane edge highlight + depth shading */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent" />
                    <div data-shade className="pointer-events-none absolute inset-0 bg-obsidian-950" style={{ opacity: 0 }} />

                    <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3 font-mono text-[11px] text-slate-500">
                      <span className="text-gold-accent">{String(idx + 1).padStart(2, '0')}</span>
                      <span>{pl.kind === 'role' ? pl.item.period : 'Academics'}</span>
                    </div>

                    {pl.kind === 'role' ? (
                      <div className="px-6 pb-6 pt-5 md:px-8 md:pb-8">
                        <h3 className="font-serif text-3xl leading-tight text-ivory md:text-[38px]">{pl.item.role}</h3>
                        <p className="mt-1 text-sm text-gold-light">{pl.item.company}</p>
                        <p className="mt-4 text-sm leading-relaxed text-slate-300">{pl.item.description}</p>
                        <ul className="mt-5 space-y-2.5">
                          {pl.item.achievements.slice(0, 3).map((a) => (
                            <li key={a} className="flex gap-3 text-[13px] leading-relaxed text-slate-400">
                              <span className="mt-[9px] h-px w-3 shrink-0 bg-gold-accent" />
                              {a}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-6 flex flex-wrap gap-1.5">
                          {pl.item.technologies.map((t) => (
                            <span key={t} className="rounded-full border border-slate-700 px-2.5 py-1 font-mono text-[10.5px] text-slate-300">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 pb-6 pt-5 md:px-8 md:pb-8">
                        <h3 className="flex items-center gap-3 font-serif text-3xl text-ivory md:text-[38px]">
                          <GraduationCap className="h-6 w-6 text-gold-accent" /> Education
                        </h3>
                        <div className="mt-6 divide-y divide-slate-800">
                          {PROFILE_DATA.education.map((e) => (
                            <div key={e.id} className="flex items-baseline justify-between gap-4 py-4">
                              <div>
                                <p className="text-sm font-medium text-ivory">{e.qualification}</p>
                                <p className="mt-0.5 text-[13px] text-slate-400">{e.institution}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="font-mono text-[11px] text-slate-500">{e.period}</p>
                                <p className="mt-0.5 font-mono text-[12px] text-gold-light">{e.result}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
