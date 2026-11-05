/**
 * Scroll-scene driver shared by every pinned section.
 *
 * Why this exists (performance):
 *  - Section geometry is measured once (and on resize / layout change), never
 *    per frame, so animation loops never force a synchronous layout. Previously
 *    each section called getBoundingClientRect() inside rAF right after other
 *    sections wrote styles, causing layout thrash every frame.
 *  - The loop only runs while the section is near the viewport
 *    (IntersectionObserver), and goes completely idle when the scroll position
 *    hasn't changed and the scene reports nothing is still easing.
 */
export type SceneFrame = (progress: number, dt: number, now: number) => boolean | void;

export interface ScrollSceneHandle {
  /** Request a frame (e.g. after pointer input) even if scroll hasn't moved. */
  kick: () => void;
  stop: () => void;
}

export function runScrollScene(el: HTMLElement, onFrame: SceneFrame): ScrollSceneHandle {
  let top = 0;
  let range = 1;
  let visible = false;
  let raf = 0;
  let last = 0;
  let lastP = -1;
  let animating = true;
  let dirty = true;

  const measure = () => {
    const rect = el.getBoundingClientRect();
    top = rect.top + window.scrollY;
    range = Math.max(1, el.offsetHeight - window.innerHeight);
    dirty = true;
    schedule();
  };

  const tick = (now: number) => {
    raf = 0;
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
    last = now;
    const raw = (window.scrollY - top) / range;
    const p = raw < 0 ? 0 : raw > 1 ? 1 : raw;
    if (dirty || animating || Math.abs(p - lastP) > 1e-5) {
      dirty = false;
      lastP = p;
      animating = onFrame(p, dt, now) === true;
    }
    if (visible && animating) schedule();
    else last = 0;
  };

  function schedule() {
    if (!raf && visible) raf = requestAnimationFrame(tick);
  }

  const onScroll = () => schedule();
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        dirty = true;
        schedule();
      }
    },
    { rootMargin: '25% 0px 25% 0px' },
  );
  const ro = new ResizeObserver(measure);

  io.observe(el);
  ro.observe(document.body);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  measure();

  return {
    kick: () => {
      animating = true;
      schedule();
    },
    stop: () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    },
  };
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
