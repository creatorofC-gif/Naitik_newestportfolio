import React from 'react';
import { ArrowUp } from 'lucide-react';
import { PROFILE_DATA } from '../data/profileData';
import { scrollToY } from '../utils/smoothScroll';
import { GithubIcon, LinkedinIcon } from './SocialIcons';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    scrollToY(0);
  };

  return (
    <footer className="py-10 px-4 md:px-8 border-t border-slate-800/60 bg-obsidian-950">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div>
          <span className="text-sm font-display font-bold text-white tracking-tight">
            {PROFILE_DATA.personal.name}
          </span>
          <p className="text-[10px] font-mono text-slate-500 mt-1">
            © {new Date().getFullYear()} • Built with React 19, TypeScript & Tailwind CSS
          </p>
        </div>

        <div className="flex items-center gap-3">
          {PROFILE_DATA.personal.socials.github && (
            <a href={PROFILE_DATA.personal.socials.github} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-obsidian-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800" aria-label="GitHub">
              <GithubIcon className="w-4 h-4" />
            </a>
          )}
          {PROFILE_DATA.personal.socials.linkedin && (
            <a href={PROFILE_DATA.personal.socials.linkedin} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-obsidian-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800" aria-label="LinkedIn">
              <LinkedinIcon className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={scrollToTop}
            className="px-3 py-1.5 rounded-full glass-panel hover:bg-slate-800 text-xs font-mono text-slate-400 flex items-center gap-1.5 border border-slate-700 transition-all hover:text-white"
            aria-label="Scroll to top"
          >
            Back to Top
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>
      </div>
    </footer>
  );
};
