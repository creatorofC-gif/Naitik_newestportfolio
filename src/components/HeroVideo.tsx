import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, FileText, Terminal, Activity } from 'lucide-react';
import { PROFILE_DATA } from '../data/profileData';

const CORE_TECH = ['React', 'Angular', 'React Native', 'TypeScript'];

export const HeroVideo: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Progress through the hero itself (not the whole page, which is now very tall).
  const { scrollYProgress: heroProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const scrollYProgress = useTransform(heroProgress, [0, 0.6], [0, 0.25]);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  // Perf: stop decoding video while the hero is off screen.
  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    io.observe(section);
    return () => io.disconnect();
  }, []);
  
  // Terminal typing effect
  useEffect(() => {
    const lines = [
      "naitik@workspace:~$ init_env",
      "> Loading profile_data.json...",
      "> OK. Naitik Gupta loaded.",
      "naitik@workspace:~$ check_stack",
      "> [✓] Frontend: React, Angular, React Native",
      "> [✓] Languages: TypeScript, JavaScript, Python",
      "> [✓] Systems: Android, PostgreSQL, Git",
      "naitik@workspace:~$ status",
      `> ${PROFILE_DATA.personal.statusBadge}`,
      "> Ready for input _"
    ];
    
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        const nextLine = lines[currentLine];
        if (nextLine) {
          setTerminalLines(prev => [...prev, nextLine]);
        }
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 600);
    
    return () => clearInterval(interval);
  }, []);

  // Scroll-driven background transforms
  const videoScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.75]);
  const videoX = useTransform(scrollYProgress, [0, 0.25], [0, 80]);
  const videoY = useTransform(scrollYProgress, [0, 0.25], [0, -10]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.2], [0.15, 0.8]);

  return (
    <section id="hero" ref={sectionRef} className="relative min-h-[140vh] pb-16">
      {/* Full-bleed video background with scroll-driven scaling */}
      <div className="sticky top-0 h-screen w-screen inset-0 overflow-hidden flex items-center justify-center pointer-events-none z-0">
        <motion.div
          style={{
            scale: videoScale,
            x: videoX,
            y: videoY,
          }}
          className="relative w-screen h-screen inset-0 overflow-hidden rounded-3xl will-change-transform"
        >
          <video
            ref={videoRef}
            src="/HomeScreen_Final.mp4"
            preload="auto"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover select-none"
          />

          {/* Vignette — both gradients in ONE layer (perf: each extra full-screen overlay on a
              playing, scaling video is re-composited every frame). */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, #0E1012 0%, rgba(14, 16, 18,0.4) 50%, transparent 100%), linear-gradient(to right, #0E1012 0%, rgba(14, 16, 18,0.2) 35%, transparent 70%)',
            }}
          />

          {/* Scroll darkening */}
          <motion.div
            style={{ opacity: overlayOpacity }}
            className="pointer-events-none absolute inset-0 bg-obsidian-950 will-change-[opacity]"
          />
        </motion.div>
      </div>

      {/* Hero content overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 -mt-[85vh] flex flex-col justify-center min-h-[80vh] pointer-events-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column (Content) */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-7"
          >
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-obsidian-900/60 border border-gold-glow/30 text-gold-accent text-xs font-mono mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-accent animate-pulse" />
              {PROFILE_DATA.personal.statusBadge}
            </div>

            {/* Name */}
            <h1 className="font-serif text-6xl sm:text-7xl lg:text-[104px] text-ivory tracking-[-0.01em] leading-[0.95]">
              {PROFILE_DATA.personal.name.split(' ').map((word, i) => (
                <span key={i} className={i === 1 ? 'italic text-gold-accent' : ''}>
                  {word}{i === 0 ? ' ' : ''}
                </span>
              ))}
            </h1>

            {/* Title */}
            <p className="text-slate-300 text-base sm:text-lg font-mono mt-4 tracking-wide">
              Computer Engineering Student<span className="text-gold-accent mx-2">|</span>Frontend &amp; Mobile Developer
            </p>

            {/* Tagline */}
            <p className="text-slate-400 text-sm sm:text-base mt-5 max-w-lg leading-relaxed bg-obsidian-950/60 p-4 border-l-2 border-gold-accent/50 rounded-r-lg">
              {PROFILE_DATA.personal.tagline}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <a
                href="#projects"
                className="px-6 py-3 rounded-lg btn-metal font-semibold text-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                Explore My Work
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={PROFILE_DATA.personal.resumeUrl && PROFILE_DATA.personal.resumeUrl !== '#resume'
                  ? PROFILE_DATA.personal.resumeUrl
                  : '/resume.pdf'}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-lg bg-obsidian-900/80 hover:bg-slate-800 text-slate-200 font-medium text-sm flex items-center gap-2 transition-all border border-slate-700 hover:border-gold-glow/40"
              >
                <FileText className="w-4 h-4 text-gold-accent" />
                View Resume
              </a>
            </div>

            {/* Core technologies */}
            <div className="flex flex-wrap items-center gap-3 mt-10 text-[11px] font-mono text-slate-500 bg-obsidian-950/40 p-2.5 rounded-lg border border-slate-800/50 inline-flex">
              <span className="text-gold-accent font-bold">STACK //</span>
              {CORE_TECH.map((tech, i) => (
                <React.Fragment key={tech}>
                  <span className="text-slate-300 hover:text-white transition-colors cursor-default">
                    {tech}
                  </span>
                  {i < CORE_TECH.length - 1 && (
                    <span className="text-slate-700">•</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          {/* Right Column (Terminal Workspace) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="lg:col-span-5 hidden md:block"
          >
            <div className="rounded-xl border border-slate-700 bg-obsidian-950/80 shadow-2xl overflow-hidden">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="ml-4 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 font-medium">
                  <Terminal className="w-3 h-3" /> sys_init.sh
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-[9px] font-mono text-emerald-400/80">
                  <Activity className="w-3 h-3" /> ONLINE
                </div>
              </div>
              
              {/* Terminal Body */}
              <div className="p-5 font-mono text-[11px] sm:text-xs leading-relaxed text-slate-300 h-64 overflow-y-auto">
                {terminalLines.filter(Boolean).map((line, index) => (
                  <div key={index} className="mb-1.5 flex items-start">
                    <span className="text-slate-600 mr-3 select-none">{String(index + 1).padStart(2, '0')}</span>
                    <span className={`${line?.startsWith('>') ? (line.includes('[✓]') ? 'text-emerald-400' : 'text-slate-400') : 'text-gold-accent'}`}>
                      {line?.replace('_', '')}
                      {line?.includes('_') && <span className="animate-pulse inline-block w-2 h-3.5 bg-gold-accent ml-0.5 align-middle" />}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* System Diagram Hint */}
              <div className="border-t border-slate-800 bg-slate-900/30 p-3 px-5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                  Awaiting instruction...
                </div>
                <div>v1.0.4</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
