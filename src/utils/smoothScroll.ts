import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Site-wide smooth scrolling (Lenis).
 *
 * Wheel / trackpad input is eased into fluid motion; Lenis drives the real
 * window scroll position, so every scroll-driven scene (runScrollScene) keeps
 * working unchanged. Touch devices keep native scrolling (already smooth).
 * Skipped entirely for prefers-reduced-motion.
 */
let lenis: Lenis | null = null;

export function startSmoothScroll(): () => void {
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  lenis = new Lenis({
    lerp: 0.085, // lower = silkier glide
    wheelMultiplier: 0.9,
    smoothWheel: true,
    anchors: true, // <a href="#id"> links glide too
  });
  let raf = 0;
  const loop = (time: number) => {
    lenis?.raf(time);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    lenis?.destroy();
    lenis = null;
  };
}

/** Programmatic scroll that rides the same easing as the wheel. */
export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { duration: 1.4 });
  else window.scrollTo({ top: y, behavior: 'smooth' });
}
