/** @type {import('tailwindcss').Config} */

/*
 * Design system — "Midnight & Periwinkle"
 * ───────────────────────────────────────
 * Deep navy-black surfaces, cool off-white text, and one calm periwinkle
 * accent (the indigo family used by most modern dev-tool brands, kept soft
 * so it reads as refined rather than loud). Token names (obsidian / gold / slate) are kept from the original
 * build so every component inherits the new palette without class renames:
 *   obsidian.*  → ink surfaces
 *   gold.*      → periwinkle accent
 *   slate.*     → cool neutral greys
 */
const ink = {
  950: '#0B0D12',
  900: '#10131A',
  800: '#161A23',
  700: '#1F2430',
  600: '#2C3240',
  500: '#4A5263',
};

const accent = {
  accent: '#8B9DFF',
  glow: '#7385F5',
  dark: '#5566D6',
  light: '#B4C0FF',
};

const coolNeutral = {
  50: '#F7F8FA',
  100: '#E6E8EE',
  200: '#D3D7E0',
  300: '#B4BAC7',
  400: '#8E95A5',
  500: '#6B7283',
  600: '#4F5565',
  700: '#373C49',
  800: '#252A35',
  900: '#181C25',
  950: '#0F1218',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: ink,
        gold: accent,
        slate: coolNeutral,
        ivory: '#E6E8EE',
        board: {
          surface: '#F5F3EE',
          frame: '#C9CCD1',
          ink: '#1F2A44',
          red: '#C2412D',
          blue: '#2457A6',
        },
        titanium: {
          border: 'rgba(139, 157, 255, 0.2)',
          slate: '#2C3240',
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
