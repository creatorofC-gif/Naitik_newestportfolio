import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PROFILE_DATA } from '../data/profileData';
import type { Project } from '../data/profileData';
import { ProjectModal } from './ProjectModal';
import { runScrollScene } from '../utils/scrollScene';

/* ──────────────────────────────────────────────────────────────
   Projects — a whiteboard written live by a marker as you scroll.

   Each project is a "page". Every element on a page that should be
   written carries `data-unit` ("clip" = revealed left→right behind the
   pen, "stroke" = SVG paths drawn via stroke-dashoffset). Units are
   measured once per layout; scroll progress is mapped onto their
   cumulative widths so the pen moves at a constant handwriting speed.
   When a page is done the eraser wipes it and the next project starts,
   so the board scales to any number of projects.
   ────────────────────────────────────────────────────────────── */

const ENTER = 0.06; // board slides in
const PER_PROJECT_VH = 230;
const WRITE_END = 0.8; // share of a project's segment spent writing…
const ERASE_START = 0.88; // …then a pause, then the wipe

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

interface Unit {
  el: HTMLElement;
  kind: 'clip' | 'stroke';
  x: number;
  y: number;
  w: number;
  h: number;
  start: number; // cumulative weight before this unit
  weight: number;
  paths: SVGPathElement[]; // cached for stroke units
  lastF: number; // last applied fraction — skip style writes when unchanged
}

/* Deterministic wobble so sketches look hand-drawn but never jitter between renders. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280 - 0.5;
  };
}
function sketchRect(x: number, y: number, w: number, h: number, seed: number) {
  const r = rng(seed);
  const j = (n = 2.2) => r() * n;
  return `M${x + j()} ${y + j()} L${x + w + j()} ${y + j()} L${x + w + j()} ${y + h + j()} L${x + j()} ${y + h + j()} Z M${x - 3 + j()} ${y + 1 + j()} L${x + w * 0.4} ${y - 1 + j()}`;
}
function sketchArrow(x1: number, y1: number, x2: number, y2: number, seed: number) {
  const r = rng(seed);
  const mx = (x1 + x2) / 2 + r() * 14;
  const my = (y1 + y2) / 2 + r() * 6;
  const a = Math.atan2(y2 - my, x2 - mx);
  const hx = (d: number) => x2 - 9 * Math.cos(a + d);
  const hy = (d: number) => y2 - 9 * Math.sin(a + d);
  return `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2} M${hx(0.5)} ${hy(0.5)} L${x2} ${y2} L${hx(-0.5)} ${hy(-0.5)}`;
}

const shortTitle = (p: Project) => p.title.split(/\s[—-]\s/)[0];

/* ─── One whiteboard page ─────────────────────────────────── */
const ProjectPage: React.FC<{ project: Project; index: number; total: number; onOpen: () => void }> = ({
  project,
  index,
  total,
  onOpen,
}) => {
  const tags = project.tags.slice(0, 4);
  const boxW = 92;
  const gap = (360 - tags.length * boxW) / (tags.length + 1);

  return (
    <div data-page className="absolute inset-0 flex flex-col p-6 md:p-10 lg:p-12" style={{ opacity: 0 }}>
      <div className="flex items-start justify-between gap-4">
        <span data-unit="clip" className="font-hand text-xl text-board-red md:text-2xl">
          Project {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <span data-unit="clip" className="font-hand text-lg text-board-ink/60 md:text-xl">
          {project.category}
        </span>
      </div>

      <h3
        data-unit="clip"
        className="mt-1 self-start font-hand text-[44px] font-bold leading-[1] text-board-ink md:text-[68px] lg:text-[78px]"
      >
        {shortTitle(project)}
      </h3>
      <div data-unit="stroke" className="mt-1 w-56 self-start md:w-80">
        <svg viewBox="0 0 400 16" className="block h-3 w-full" fill="none" aria-hidden="true">
          <path
            pathLength={1}
            d="M2 9 C 60 3, 120 14, 190 8 S 320 4, 398 10"
            className="stroke-board-red"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p data-unit="clip" className="mt-3 self-start font-hand text-2xl leading-tight text-board-blue md:text-[30px]">
        {project.subtitle}
      </p>

      <div className="mt-6 grid min-h-0 flex-1 gap-8 md:grid-cols-[1.25fr_1fr]">
        <div className="flex min-h-0 flex-col gap-2.5">
          {project.technicalHighlights.map((h) => (
            <p key={h} data-unit="clip" className="self-start font-hand text-[22px] leading-snug text-board-ink md:text-[25px]">
              <span className="mr-2 text-board-red">→</span>
              {h}
            </p>
          ))}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span data-unit="clip" className="font-hand text-[22px] text-board-ink/70 md:text-2xl">
              built with:
            </span>
            {project.tags.map((t) => (
              <span
                key={t}
                data-unit="clip"
                className="rounded-[50%_45%_55%_40%/45%_55%_40%_55%] border-2 border-board-blue/80 px-3 py-0.5 font-hand text-[21px] text-board-blue md:text-[23px]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Hand-sketched system diagram built from the project's own stack */}
        <div className="hidden min-h-0 flex-col md:flex">
          <div data-unit="stroke" className="w-full max-w-[420px] self-end">
          <svg viewBox="0 0 360 250" className="block w-full" fill="none" aria-hidden="true">
            <g className="stroke-board-ink" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path pathLength={1} d={sketchRect(105, 18, 150, 54, index * 7 + 1)} />
              {tags.map((t, i) => {
                const x = gap + i * (boxW + gap);
                return (
                  <React.Fragment key={t}>
                    <path pathLength={1} d={sketchArrow(180, 76, x + boxW / 2, 160, index * 7 + i + 3)} className="stroke-board-blue" />
                    <path pathLength={1} d={sketchRect(x, 166, boxW, 44, index * 13 + i + 5)} />
                  </React.Fragment>
                );
              })}
            </g>
            <g className="fill-board-ink font-hand" textAnchor="middle" style={{ opacity: 'calc(1 - var(--d, 1))' }}>
              <text x="180" y="52" fontSize="22" fontWeight="700">
                {shortTitle(project).slice(0, 14)}
              </text>
              {tags.map((t, i) => (
                <text key={t} x={gap + i * (boxW + gap) + boxW / 2} y="194" fontSize="17">
                  {t.length > 12 ? `${t.slice(0, 11)}…` : t}
                </text>
              ))}
            </g>
          </svg>
          </div>

          <div className="mt-auto flex flex-col items-end gap-1.5">
            {project.impactMetrics.map((m) => (
              <p key={m.label} data-unit="clip" className="font-hand text-[21px] text-board-ink md:text-[23px]">
                <span className="text-board-ink/60">{m.label}:</span> <span className="font-bold">{m.value}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky note — appears once the page is written */}
      <button
        data-note
        onClick={onOpen}
        className="absolute bottom-6 left-6 -rotate-[2.5deg] bg-[#F7E58C] px-4 py-3 text-left font-hand text-xl leading-tight text-board-ink shadow-[0_10px_20px_-8px_rgba(0,0,0,0.35)] transition-transform hover:rotate-0 hover:scale-105 md:bottom-10 md:left-12"
        style={{ opacity: 0, pointerEvents: 'none' }}
      >
        read the full
        <br />
        case study <ArrowUpRight className="inline h-4 w-4" />
      </button>
    </div>
  );
};

/* ─── The marker ──────────────────────────────────────────── */
const Marker: React.FC = () => (
  <svg width="170" height="44" viewBox="0 0 170 44" aria-hidden="true" style={{ overflow: 'visible' }}>
    {/* Baked soft shadow (cheaper than a CSS drop-shadow filter on a moving element) */}
    <path d="M8 27 L150 33 Q168 34 168 38 Q166 42 150 41 L10 33 Z" fill="#000" opacity="0.12" />
    <path d="M14 29 L146 34 Q160 35 160 37 Q158 40 146 39 L16 32 Z" fill="#000" opacity="0.1" />
    <defs>
      <linearGradient id="mk-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3A3F48" />
        <stop offset="0.5" stopColor="#262A31" />
        <stop offset="1" stopColor="#15171B" />
      </linearGradient>
    </defs>
    <path d="M0 15 L12 10.5 L12 19.5 Z" fill="#1F2A44" />
    <rect x="12" y="9" width="12" height="12" rx="1.5" fill="#9BA1AB" />
    <rect x="24" y="6" width="118" height="18" rx="5" fill="url(#mk-body)" />
    <rect x="58" y="6" width="34" height="18" fill="#C8F25C" opacity="0.9" />
    <rect x="142" y="4.5" width="26" height="21" rx="6" fill="#1F2A44" />
    <rect x="30" y="8" width="108" height="2.5" rx="1.2" fill="#fff" opacity="0.12" />
  </svg>
);

/* ─── Section ─────────────────────────────────────────────── */
export const ProjectsWhiteboard: React.FC = () => {
  const projects = PROFILE_DATA.projects;
  const [selected, setSelected] = useState<Project | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const penRef = useRef<HTMLDivElement>(null);
  const eraserRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    const section = sectionRef.current;
    const board = boardRef.current;
    if (!content || !section || !board) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    type Page = { el: HTMLElement; note: HTMLElement | null; units: Unit[]; total: number; shown: boolean; noteOn: boolean; erase: number };
    let pages: Page[] = [];
    let cw = 1;
    let ch = 1;

    // Layout is read only here (on mount / resize / font load) — never inside the frame loop.
    const measure = () => {
      cw = content.clientWidth;
      ch = content.clientHeight;
      pages = Array.from(content.querySelectorAll<HTMLElement>('[data-page]')).map((page) => {
        let cursor = 0;
        const units: Unit[] = [];
        page.querySelectorAll<HTMLElement>('[data-unit]').forEach((el) => {
          const w = el.offsetWidth;
          if (!w) return; // hidden at this breakpoint
          let x = 0;
          let y = 0;
          // Offsets relative to the page (the nearest positioned ancestor is the page itself).
          for (let n: HTMLElement | null = el; n && n !== page; n = n.offsetParent as HTMLElement | null) {
            x += n.offsetLeft;
            y += n.offsetTop;
          }
          const kind = el.dataset.unit === 'stroke' ? 'stroke' : 'clip';
          const weight = kind === 'stroke' ? Math.max(260, w * 1.4) : Math.max(70, w);
          const paths = Array.from(el.querySelectorAll<SVGPathElement>('path'));
          paths.forEach((path) => (path.style.strokeDasharray = '1'));
          units.push({ el, kind, x, y, w, h: el.offsetHeight, start: cursor, weight, paths, lastF: -1 });
          cursor += weight;
        });
        return {
          el: page,
          note: page.querySelector<HTMLElement>('[data-note]'),
          units,
          total: cursor,
          shown: false,
          noteOn: false,
          erase: -1,
        };
      });
      handle?.kick();
    };

    const pen = { x: 0, y: 0, init: false };
    let lastEnter = -1;
    let lastActive = -1;

    const frame = (p: number, _dt: number, now: number) => {
      if (!pages.length) return false;

      // Board entrance
      const enter = Math.round(ease(clamp01(p / ENTER)) * 500) / 500;
      if (enter !== lastEnter) {
        lastEnter = enter;
        board.style.transform = `perspective(1600px) translate3d(0, ${(1 - enter) * 90}px, 0) rotateX(${(1 - enter) * 14}deg)`;
        board.style.opacity = String(0.2 + enter * 0.8);
      }

      const span = (1 - ENTER) / pages.length;
      const q = Math.max(0, p - ENTER) / span;
      const active = Math.min(pages.length - 1, Math.floor(q));
      const local = pages.length && q >= pages.length ? 1 : q - active;
      const isLast = active === pages.length - 1;

      const write = reduced ? 1 : clamp01(local / WRITE_END);
      const erase = isLast || reduced ? 0 : ease(clamp01((local - ERASE_START) / (1 - ERASE_START)));

      if (active !== lastActive && counterRef.current) {
        counterRef.current.textContent = `${String(active + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
      }
      lastActive = active;

      let tipX = cw + 120;
      let tipY = ch + 40;
      let writing = false;

      pages.forEach((page, pi) => {
        const isActive = pi === active;
        if (isActive !== page.shown) {
          page.shown = isActive;
          page.el.style.opacity = isActive ? '1' : '0';
          page.el.style.pointerEvents = isActive ? 'auto' : 'none';
        }
        if (!isActive) return;

        if (erase !== page.erase) {
          page.erase = erase;
          page.el.style.clipPath = erase > 0 ? `inset(-5% -5% -5% ${erase * 100}%)` : 'none';
        }
        const inkAt = write * page.total;

        for (const u of page.units) {
          const f = Math.round(clamp01((inkAt - u.start) / u.weight) * 400) / 400;
          if (f > 0 && f < 1) {
            writing = true;
            tipX = u.x + u.w * f;
            tipY = u.y + (u.kind === 'stroke' ? u.h * (0.3 + 0.5 * Math.sin(f * Math.PI)) : u.h * 0.72);
          }
          if (f === u.lastF) continue;
          u.lastF = f;
          if (u.kind === 'clip') {
            // Negative right inset at f=1 leaves room for the handwriting's glyph overhang.
            u.el.style.clipPath = f >= 1 ? 'none' : `inset(-30% ${(1 - f) * 100}% -30% -4%)`;
          } else {
            u.el.style.setProperty('--d', String(1 - f));
            for (const path of u.paths) path.style.strokeDashoffset = String(1 - f);
          }
        }

        const show = write >= 1 && erase === 0;
        if (page.note && show !== page.noteOn) {
          page.noteOn = show;
          page.note.style.opacity = show ? '1' : '0';
          page.note.style.pointerEvents = show ? 'auto' : 'none';
        }
      });

      // Pen: glides to the writing head, rests on the tray when idle.
      if (!writing) {
        tipX = cw * 0.82;
        tipY = ch + 18;
      }
      if (!pen.init) {
        pen.x = tipX;
        pen.y = tipY;
        pen.init = true;
      }
      const k = writing ? 0.35 : 0.12;
      pen.x += (tipX - pen.x) * k;
      pen.y += (tipY - pen.y) * k;
      const settling = Math.abs(tipX - pen.x) > 0.5 || Math.abs(tipY - pen.y) > 0.5;
      const wobble = writing ? Math.sin(now / 38) * 1.6 : 0;
      if (penRef.current) {
        penRef.current.style.transform = `translate3d(${pen.x}px, ${pen.y - 15 + wobble}px, 0) rotate(${writing ? -38 : -8}deg)`;
        penRef.current.style.opacity = erase > 0 ? '0' : String(enter);
      }

      // Eraser sweeps in front of the wipe.
      if (eraserRef.current) {
        eraserRef.current.style.opacity = erase > 0 && erase < 1 ? '1' : '0';
        eraserRef.current.style.transform = `translate3d(${erase * cw - 60}px, ${ch * 0.35 + Math.sin(erase * 18) * 40}px, 0) rotate(-6deg)`;
      }

      // Keep animating only while the pen is still gliding into place.
      return settling;
    };

    let handle: ReturnType<typeof runScrollScene> | null = null;
    measure();
    handle = runScrollScene(section, frame);
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(content);

    return () => {
      handle?.stop();
      ro.disconnect();
    };
  }, [projects.length]);

  if (projects.length === 0) return null;

  return (
    <section
      id="projects"
      ref={sectionRef}
      aria-label="Projects"
      className="relative bg-obsidian-950"
      style={{ height: `${100 + projects.length * PER_PROJECT_VH}vh` }}
    >
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden px-4 pb-6 pt-8 md:px-10 md:pt-10">
        {/* Wall light */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(227, 230, 234,0.06),transparent_65%)]" />

        <div className="relative mx-auto flex w-full max-w-[1240px] items-end justify-between pb-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold-accent">03 — Work</p>
            <h2 className="mt-2 font-serif text-4xl text-ivory md:text-5xl">
              On the whiteboard <em className="text-metal">this week.</em>
            </h2>
          </div>
          <span ref={counterRef} className="hidden font-mono text-xs text-slate-500 md:block" />
        </div>

        {/* Board */}
        <div
          ref={boardRef}
          className="relative mx-auto w-full max-w-[1240px] flex-1 origin-bottom rounded-[18px] p-[10px] will-change-transform"
          style={{
            background: 'linear-gradient(160deg, #E4E7EB 0%, #B9BEC6 45%, #8E949D 100%)',
            boxShadow: '0 50px 90px -30px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.7)',
          }}
        >
          <div
            ref={contentRef}
            className="relative h-full w-full overflow-hidden rounded-[10px] bg-board-surface"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 20% 15%, rgba(255,255,255,0.9), transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(31,42,68,0.05), transparent 50%), radial-gradient(ellipse at 65% 30%, rgba(31,42,68,0.035), transparent 35%)',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08), inset 0 2px 10px rgba(0,0,0,0.08)',
            }}
          >
            {projects.map((project, i) => (
              <ProjectPage key={project.id} project={project} index={i} total={projects.length} onOpen={() => setSelected(project)} />
            ))}

            {/* Eraser */}
            <div
              ref={eraserRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 h-14 w-28 rounded-md shadow-[0_14px_24px_-10px_rgba(0,0,0,0.45)]"
              style={{ background: 'linear-gradient(#2A2E35 0 55%, #D9D4C7 55% 100%)', opacity: 0 }}
            />

            {/* Pen — tip sits at the element's left-centre */}
            <div
              ref={penRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 z-10 origin-[0_15px] will-change-transform"
              style={{ opacity: 0 }}
            >
              <Marker />
            </div>
          </div>

          {/* Marker tray */}
          <div className="absolute -bottom-[14px] left-[8%] right-[8%] h-[14px] rounded-b-md bg-gradient-to-b from-[#A7ADB5] to-[#6E747D] shadow-[0_10px_18px_-6px_rgba(0,0,0,0.7)]" />
        </div>
      </div>

      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}
    </section>
  );
};

export default ProjectsWhiteboard;
