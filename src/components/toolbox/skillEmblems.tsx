import React from 'react';

/**
 * Monogram emblems for skill cards. Each technology gets a short glyph and a
 * restrained tint of its brand colour, rendered as a small engraved badge so
 * the set reads as one consistent family instead of a patchwork of logos.
 * Unknown skills fall back to their initials in the accent colour.
 */
const EMBLEMS: Record<string, { glyph: string; color: string }> = {
  'React.js': { glyph: 'Re', color: '#61DAFB' },
  Angular: { glyph: 'Ng', color: '#E2384D' },
  'React Native': { glyph: 'RN', color: '#61DAFB' },
  'Tailwind CSS': { glyph: 'Tw', color: '#38BDF8' },
  Bootstrap: { glyph: 'Bs', color: '#8B5CF6' },
  JavaScript: { glyph: 'JS', color: '#F0DB4F' },
  TypeScript: { glyph: 'TS', color: '#4C8BF5' },
  Python: { glyph: 'Py', color: '#FFD43B' },
  'C++': { glyph: 'C+', color: '#6295CB' },
  HTML5: { glyph: 'H5', color: '#E96228' },
  CSS3: { glyph: 'C3', color: '#2D7FF9' },
  SQL: { glyph: 'SQ', color: '#C9A27A' },
  PostgreSQL: { glyph: 'Pg', color: '#5B8FC7' },
  Git: { glyph: 'Gi', color: '#F05033' },
  GitHub: { glyph: 'GH', color: '#EDEBE6' },
  'Angular CLI': { glyph: '>_', color: '#E2384D' },
  'VS Code': { glyph: 'VS', color: '#3B9CF0' },
  'Thunder Client': { glyph: 'Tc', color: '#A78BFA' },
  'Android Studio': { glyph: 'AS', color: '#3DDC84' },
  Expo: { glyph: 'Ex', color: '#EDEBE6' },
  pgAdmin: { glyph: 'pA', color: '#5B8FC7' },
  Claude: { glyph: 'Cl', color: '#E07A5F' },
  ChatGPT: { glyph: 'GP', color: '#74AA9C' },
  Stitch: { glyph: 'St', color: '#F2A58E' },
  Antigravity: { glyph: 'Ag', color: '#9AB3F5' },
};

const initials = (name: string) =>
  name
    .replace(/[^A-Za-z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2) || name.slice(0, 2);

export const SkillEmblem: React.FC<{ name: string; size?: number }> = ({ name, size = 40 }) => {
  const e = EMBLEMS[name] ?? { glyph: initials(name), color: '#E07A5F' };
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex shrink-0 items-center justify-center rounded-[10px] font-mono font-semibold tracking-tight"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        color: e.color,
        background: `linear-gradient(145deg, ${e.color}22, ${e.color}0A 60%)`,
        boxShadow: `inset 0 0 0 1px ${e.color}40, inset 0 1px 0 0 rgba(255,255,255,0.06)`,
      }}
    >
      {e.glyph}
    </span>
  );
};
