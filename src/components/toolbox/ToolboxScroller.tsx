import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowDown, Volume2, VolumeX } from 'lucide-react';
import { PROFILE_DATA } from '../../data/profileData';
import { soundEffects } from '../../utils/soundEffects';
import { runScrollScene } from '../../utils/scrollScene';
import { scrollToY } from '../../utils/smoothScroll';
import {
  SECTION_HEIGHT_VH,
  TIMELINE,
  categoryCode,
  categoryWindow,
  pad2,
  progressIn,
} from './toolboxConfig';
import { ToolboxScene } from './toolboxScene';
import { SkillEmblem } from './skillEmblems';

/** Past this point the inside overlay is fully opaque — WebGL stops rendering entirely. */
const CANVAS_OFF_AT = TIMELINE.dive[1] + 0.01;

/**
 * Skills — scroll-driven toolbox.
 * The case unlatches, the lid swings open and the trays deploy (Three.js);
 * then the camera climbs over the top and dives inside, handing over to the
 * HTML "compartments": one section per skill category, filled card by card.
 *
 * Performance model:
 *  - runScrollScene: cached geometry, runs only while on screen, idles when still.
 *  - WebGL renders only when the smoothed progress or hover/parallax changes,
 *    and not at all once the camera is inside the case (canvas hidden).
 *  - Adaptive resolution: if frames run slow, pixel ratio steps down.
 *  - Card reveals toggle a data attribute (CSS transitions on opacity/transform
 *    only), so the DOM is touched only when a card's state actually flips.
 */
export const ToolboxScroller: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const insideRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const compartmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [webGl, setWebGl] = useState(true);
  const [isMuted, setIsMuted] = useState(soundEffects.getMuted());

  const categories = PROFILE_DATA.skillCategories;
  const skillCount = categories.reduce((n, c) => n + c.skills.length, 0);

  useEffect(() => {
    const section = containerRef.current;
    const host = canvasHostRef.current;
    if (!section || !host) return;

    let scene: ToolboxScene | null = null;
    try {
      scene = new ToolboxScene(host, categories);
    } catch (err) {
      console.error('WebGL unavailable — showing compartments only', err);
      setWebGl(false);
    }

    // Pre-warm GPU work while the intro is still on screen, not mid-scroll.
    const warm = () => {
      try {
        scene?.warmup();
      } catch {
        /* non-fatal */
      }
    };
    const hasIdle = typeof window.requestIdleCallback === 'function';
    const idleId = hasIdle ? window.requestIdleCallback(warm, { timeout: 1500 }) : (setTimeout(warm, 300) as unknown as number);

    const cards = compartmentRefs.current.map((node) =>
      node ? Array.from(node.querySelectorAll<HTMLElement>('[data-card]')) : [],
    );
    const shownCounts = categories.map(() => -1);
    const compOn = categories.map(() => false);

    let current = 0;
    let rendered = -1;
    let sceneMoving = false;
    let canvasVisible = true;
    let played = false;
    let ema = 1 / 60;
    let slowFrames = 0;
    let lastIntro = -1;
    let lastInside = -1;
    let lastBar = -1;
    let lastActiveKey = 0.5;

    const handle = runScrollScene(section, (target, dt) => {
      const diff = target - current;
      current = Math.abs(diff) > 0.0002 ? current + diff * Math.min(1, dt * 14) : target;
      const p = current;

      // ── WebGL: only while the case itself is on screen ──
      if (scene) {
        const wantCanvas = p < CANVAS_OFF_AT;
        if (wantCanvas !== canvasVisible) {
          canvasVisible = wantCanvas;
          host.style.visibility = wantCanvas ? 'visible' : 'hidden';
        }
        if (wantCanvas && (p !== rendered || sceneMoving)) {
          sceneMoving = scene.render(p, dt);
          rendered = p;

          // Adaptive resolution governor
          ema = ema * 0.9 + dt * 0.1;
          if (ema > 1 / 40 && scene.pixelRatio > 0.75) {
            if (++slowFrames > 20) {
              scene.setPixelRatio(Math.max(0.75, scene.pixelRatio - 0.25));
              slowFrames = 0;
              ema = 1 / 60;
            }
          } else {
            slowFrames = 0;
          }
        }
      }

      // ── HTML overlay (writes only when values change) ──
      const introOut = Math.round(progressIn(p, [TIMELINE.overhead[0] - 0.04, TIMELINE.overhead[0] + 0.06]) * 100) / 100;
      if (introOut !== lastIntro && introRef.current) {
        lastIntro = introOut;
        introRef.current.style.opacity = String(1 - introOut);
        introRef.current.style.transform = `translate3d(0, ${-introOut * 24}px, 0)`;
        if (hintRef.current) hintRef.current.style.opacity = p < 0.03 ? '1' : '0';
      }

      const inside = scene ? Math.round(progressIn(p, TIMELINE.dive) * 200) / 200 : 1;
      if (inside !== lastInside && insideRef.current) {
        lastInside = inside;
        const el = insideRef.current;
        el.style.opacity = String(Math.max(0.001, inside));
        el.style.transform = `scale(${1.1 - inside * 0.1})`;
        el.style.pointerEvents = inside > 0.6 ? 'auto' : 'none';
      }

      const bar = Math.round(progressIn(p, TIMELINE.reveal) * 200) / 200;
      if (bar !== lastBar && progressRef.current) {
        lastBar = bar;
        progressRef.current.style.transform = `scaleX(${bar})`;
      }

      categories.forEach((cat, i) => {
        const [a, b] = categoryWindow(i, categories.length);
        const r = scene ? progressIn(p, [a - 0.02, a + (b - a) * 0.7]) : 1;
        const on = r > 0;
        if (on !== compOn[i]) {
          compOn[i] = on;
          compartmentRefs.current[i]?.toggleAttribute('data-shown', on);
        }
        const n = cat.skills.length;
        const count = Math.min(n, Math.floor(r * (n + 1)));
        if (count !== shownCounts[i]) {
          shownCounts[i] = count;
          cards[i].forEach((card, ci) => card.toggleAttribute('data-shown', ci < count));
        }
      });

      if (p > TIMELINE.latch[0] && !played) {
        played = true;
        soundEffects.playToolboxOpen();
      } else if (p <= TIMELINE.latch[0]) {
        played = false;
      }

      // Active compartment/tab via data attributes — no React re-render while scrolling.
      const insideNow = p >= TIMELINE.dive[1];
      const [ra, rb] = TIMELINE.reveal;
      const idx = insideNow ? Math.max(0, Math.min(categories.length - 1, Math.floor(((p - ra) / (rb - ra)) * categories.length))) : 0;
      const key = insideNow ? idx : -1 - idx;
      if (key !== lastActiveKey) {
        lastActiveKey = key;
        compartmentRefs.current.forEach((node, i) => {
          node?.toggleAttribute('data-active', i === idx);
          node?.toggleAttribute('data-current', insideNow && i === idx);
        });
        tabRefs.current.forEach((btn, i) => btn?.toggleAttribute('data-active', i === idx));
      }

      return current !== target || sceneMoving;
    });

    const onResize = () => {
      scene?.resize(host.clientWidth, host.clientHeight);
      rendered = -1;
      handle.kick();
    };
    const onMove = (e: MouseEvent) => {
      if (!scene || !canvasVisible) return;
      const r = host.getBoundingClientRect();
      scene.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      sceneMoving = true;
      handle.kick();
    };
    const onLeave = () => {
      scene?.clearPointer();
      sceneMoving = true;
      handle.kick();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(host);
    host.addEventListener('mousemove', onMove, { passive: true });
    host.addEventListener('mouseleave', onLeave, { passive: true });

    return () => {
      if (hasIdle) window.cancelIdleCallback(idleId);
      else clearTimeout(idleId);
      handle.stop();
      ro.disconnect();
      host.removeEventListener('mousemove', onMove);
      host.removeEventListener('mouseleave', onLeave);
      scene?.dispose();
    };
  }, [categories]);

  const jumpTo = useCallback(
    (index: number) => {
      const el = containerRef.current;
      if (!el) return;
      const [a, b] = categoryWindow(index, categories.length);
      const top = el.getBoundingClientRect().top + window.scrollY;
      const scrollable = el.offsetHeight - window.innerHeight;
      scrollToY(top + (a + (b - a) * 0.75) * scrollable);
    },
    [categories.length],
  );


  return (
    <section
      id="skills"
      ref={containerRef}
      aria-label="Skills"
      className="relative w-full bg-obsidian-950"
      style={{ height: webGl ? `${SECTION_HEIGHT_VH}vh` : 'auto' }}
    >
      <div className={webGl ? 'sticky top-0 h-viewport w-full overflow-hidden' : 'relative w-full min-h-screen'}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(200, 242, 92,0.07),transparent_60%)]" />

        {/* 3D case */}
        <div ref={canvasHostRef} className="absolute inset-0 z-0" />

        {/* Intro copy (sealed / opening) */}
        <div
          ref={introRef}
          className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-start px-6 pt-16 md:justify-center md:px-10 md:pt-0"
        >
          <div className="max-w-md">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold-accent">02 — Toolkit</p>
            <h2 className="mt-4 font-serif text-5xl leading-[1.02] text-ivory md:text-6xl">
              The tools <em className="text-metal">I reach for.</em>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              {categories.length} compartments, {skillCount} tools. Keep scrolling and the case opens up.
            </p>
          </div>
        </div>

        <div
          ref={hintRef}
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400 transition-opacity duration-500"
        >
          <ArrowDown className="h-3.5 w-3.5 text-gold-accent" />
          Scroll to open
        </div>

        {/* ─── Inside the case ─── */}
        <div
          ref={insideRef}
          className="absolute inset-0 z-20 origin-center will-change-[opacity,transform]"
          // Kept painted (opacity 0, own layer) so its first appearance costs no raster work mid-scroll.
          style={{ opacity: webGl ? 0.001 : 1, pointerEvents: webGl ? 'none' : 'auto' }}
        >
          {/* Case interior lining: static gradients only (no blur / large shadows to re-raster) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,#1A1D22_0%,#0E1012_70%)]" />

          <div className="relative mx-auto flex h-full max-w-7xl flex-col px-5 pb-8 pt-10 md:px-10 md:pt-14">
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold-accent">02 — Toolkit · Inside the case</p>
                <h3 className="mt-2 font-serif text-3xl text-ivory md:text-4xl">Skills, sorted by compartment</h3>
              </div>
              <div className="flex items-center gap-1">
                {categories.map((c, i) => (
                  <button
                    key={c.id}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    data-active={i === 0 ? '' : undefined}
                    onClick={() => jumpTo(i)}
                    className="toolbox-tab rounded-full px-3 py-1.5 font-mono text-[11px] text-slate-400 transition-colors hover:text-ivory"
                  >
                    {pad2(i + 1)}
                    <span className="hidden lg:inline"> · {c.categoryName.split(' ')[0]}</span>
                  </button>
                ))}
                <button
                  onClick={() => setIsMuted(soundEffects.toggleMute())}
                  className="ml-2 rounded-full p-2 text-slate-400 transition-colors hover:text-ivory"
                  aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>
            </header>

            <div className="mt-4 h-px w-full bg-slate-800">
              <div ref={progressRef} className="h-full origin-left bg-gold-accent" style={{ transform: 'scaleX(0)' }} />
            </div>

            {/* Trays — one per category, stacked in the same spot; the active one is shown
                (like the 3D trays presenting one module at a time). Works for any number of categories. */}
            <div className="tray-stack mt-6 min-h-0 flex-1">
              {categories.map((cat, ci) => {
                const label = categoryCode(cat.id);
                return (
                  <div
                    key={cat.id}
                    ref={(el) => {
                      compartmentRefs.current[ci] = el;
                    }}
                    data-active={ci === 0 ? '' : undefined}
                    className="tray flex max-h-full min-h-0 flex-col rounded-2xl p-4 md:p-5"
                  >
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                          Tray {pad2(ci + 1)} / {pad2(categories.length)}
                        </p>
                        <h4 className="mt-1 font-serif text-2xl text-ivory md:text-3xl">{cat.categoryName}</h4>
                      </div>
                      <span className="font-mono text-[11px] text-gold-accent">{pad2(cat.skills.length)} TOOLS</span>
                    </div>

                    <ul className="grid min-h-0 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {cat.skills.map((skill, si) => (
                        <li
                          key={skill.name}
                          data-card
                          data-shown={webGl ? undefined : ''}
                          title={skill.description}
                          className="reveal-card tool-card"
                        >
                          <div className="flex items-start justify-between gap-2 font-mono text-[10px] leading-none">
                            <span className="text-gold-accent">
                              {pad2(ci + 1)}.{pad2(si + 1)}
                            </span>
                            <span className="hidden truncate uppercase tracking-wider text-slate-500 sm:inline">{label}</span>
                            <span className="-my-1 sm:hidden">
                              <SkillEmblem name={skill.name} size={26} />
                            </span>
                          </div>
                          <div className="mt-4 flex items-end justify-between gap-2 sm:gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[15px] font-semibold leading-tight tracking-tight text-ivory sm:text-[17px] md:text-[19px]">
                                {skill.name}
                              </p>
                              <span className="mt-2.5 block h-0.5 w-6 bg-gold-accent" />
                              <p className="mt-2 truncate text-[11.5px] text-slate-400">{skill.highlightTag}</p>
                            </div>
                            <span className="hidden sm:block">
                              <SkillEmblem name={skill.name} size={36} />
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToolboxScroller;
