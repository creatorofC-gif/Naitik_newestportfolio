/** @type {import('tailwindcss').Config} */

/*
 * Design system — "Gunmetal · Titanium · Chartreuse"
 * ──────────────────────────────────────────────────
 * Two harmonious metals + one deliberate clash:
 *   gunmetal  (obsidian.*) — matte graphite surfaces            ~60%
 *   titanium  (slate.*, titanium.*, ivory) — brushed cool silver ~30%
 *   chartreuse (gold.*)    — warm acid accent that clashes with
 *                            the cool metals on purpose          ~10%
 * Token names are kept from earlier builds so components inherit it.
 */
const ink = {
  950: '#0E1012',
  900: '#15181C',
  800: '#1C2026',
  700: '#262B32',
  600: '#353B44',
  500: '#4E5560',
};

const accent = {
  accent: '#C8F25C',
  glow: '#B4DE47',
  dark: '#8FB52E',
  light: '#DDF89B',
};

const coolNeutral = {
  50: '#F4F5F7',
  100: '#E3E6EA',
  200: '#CCD1D7',
  300: '#ADB4BD',
  400: '#8C949F',
  500: '#6C737E',
  600: '#515761',
  700: '#3B4048',
  800: '#292D34',
  900: '#1C1F24',
  950: '#131518',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        // Mouse/trackpad desktops only. Touch devices (phones in any orientation, tablets) are excluded,
        // so they never get scroll-pinned scenes or sub-16px inputs. Keep in sync with DESK in ContactDirect.tsx.
        desk: { raw: '(min-width: 768px) and (hover: hover) and (pointer: fine)' },
      },
      colors: {
        obsidian: ink,
        gold: accent,
        slate: coolNeutral,
        ivory: '#E3E6EA',
        board: {
          surface: '#F5F3EE',
          frame: '#C9CCD1',
          ink: '#1F2A44',
          red: '#C2412D',
          blue: '#2457A6',
        },
        titanium: {
          DEFAULT: '#A8B0BA',
          light: '#D5DAE0',
          dark: '#6E7682',
          border: 'rgba(168, 176, 186, 0.22)',
          slate: '#353B44',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        hand: ['Caveat', '"Segoe Print"', 'cursive'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s infinite ease-in-out',
        float: 'floatAnim 4s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.03)' },
        },
        floatAnim: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
