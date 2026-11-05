import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PROFILE_DATA } from '../data/profileData';

/**
 * Opening sequence: the name rises in letter by letter, a hairline loader
 * counts to 100, then the screen parts like a curtain to reveal the site.
 * Click or press any key to skip. ~2.6s; near-instant with reduced motion.
 */
export const CurtainIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);
  const [opening, setOpening] = useState(false);
  const [done, setDone] = useState(false);

  const [first, ...rest] = PROFILE_DATA.personal.name.split(' ');
  const last = rest.join(' ');

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    const duration = reduced ? 300 : 1900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setCount(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setOpening(true);
    };
    raf = requestAnimationFrame(tick);

    const skip = () => setOpening(true);
    window.addEventListener('keydown', skip);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', skip);
    };
  }, [reduced]);

  useEffect(() => {
    if (!opening) return;
    onComplete();
    const t = setTimeout(() => {
      setDone(true);
      document.documentElement.style.overflow = '';
    }, reduced ? 200 : 1100);
    return () => clearTimeout(t);
  }, [opening, onComplete, reduced]);

  if (done) return null;

  const curtain = { duration: reduced ? 0.2 : 1, ease: [0.76, 0, 0.24, 1] as const };
  const letters = (word: string, offset: number, className = '') =>
    word.split('').map((ch, i) => (
      <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
        <motion.span
          className={`inline-block ${className}`}
          initial={{ y: reduced ? 0 : '110%' }}
          animate={{ y: opening ? '-110%' : 0 }}
          transition={
            opening
              ? { duration: 0.5, ease: [0.76, 0, 0.24, 1], delay: i * 0.015 }
              : { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 + (offset + i) * 0.045 }
          }
        >
          {ch}
        </motion.span>
      </span>
    ));

  return (
    <div className="fixed inset-0 z-[100] cursor-pointer select-none" onClick={() => setOpening(true)} role="presentation">
      {/* Two halves that part */}
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 bg-obsidian-900"
        animate={{ y: opening ? '-100%' : 0 }}
        transition={{ ...curtain, delay: opening && !reduced ? 0.35 : 0 }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-obsidian-900"
        animate={{ y: opening ? '100%' : 0 }}
        transition={{ ...curtain, delay: opening && !reduced ? 0.35 : 0 }}
      />

      <motion.div
            className="relative flex h-full flex-col items-center justify-center px-6"
            animate={{ opacity: opening ? 0 : 1 }}
            transition={{ duration: 0.35, delay: opening ? 0.2 : 0 }}
          >
            <h1 className="text-center font-serif text-[15vw] leading-none text-ivory md:text-[9vw]">
              {letters(first, 0)} <em>{letters(last, first.length, 'text-gold-accent')}</em>
            </h1>

            <div className="mt-10 w-[min(320px,70vw)]">
              <div className="h-px w-full bg-slate-800">
                <div className="h-full origin-left bg-ivory" style={{ transform: `scaleX(${count / 100})` }} />
              </div>
              <div className="mt-3 flex justify-between font-mono text-[11px] tracking-[0.18em] text-slate-500">
                <span>PORTFOLIO — {new Date().getFullYear()}</span>
                <span className="tabular-nums text-ivory">{String(count).padStart(3, '0')}</span>
              </div>
            </div>
      </motion.div>

      <p style={{ opacity: opening ? 0 : 1 }} className="absolute bottom-6 transition-opacity left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
        click to skip
      </p>
    </div>
  );
};
