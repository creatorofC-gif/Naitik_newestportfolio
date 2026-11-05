// Shared scroll timeline for the toolbox section.
// Both the Three.js scene and the HTML overlay read from this so they stay in sync.
//
// Flow: case sealed → latches flip → lid swings open → cantilever trays deploy →
// camera rises over the top and dives into the case → the inside of the case
// becomes the skills "compartments" (HTML overlay) which fill section by section.

export type Range = readonly [number, number];

/** Height of the scroll track. The sticky viewport is pinned while this scrolls past. */
export const SECTION_HEIGHT_VH = 520;

/** Scroll progress (0–1) windows for each stage. */
export const TIMELINE = {
  latch: [0.03, 0.1],
  lid: [0.08, 0.22],
  trays: [0.18, 0.32],
  /** Camera climbs over the top and looks straight down into the case. */
  overhead: [0.3, 0.44],
  /** Camera pushes down inside; the compartments overlay fades in. */
  dive: [0.44, 0.54],
  /** Category compartments fill one after another. */
  reveal: [0.54, 0.9],
} as const satisfies Record<string, Range>;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const progressIn = (p: number, [a, b]: Range) => clamp01((p - a) / (b - a));
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Reveal window for a single compartment inside TIMELINE.reveal. */
export function categoryWindow(index: number, count: number): Range {
  const [a, b] = TIMELINE.reveal;
  const len = (b - a) / count;
  return [a + index * len, a + (index + 1) * len];
}

/** "database-tools" → "DATABASE · TOOLS" */
export const categoryCode = (id: string) => id.split('-').join(' · ').toUpperCase();

export const pad2 = (n: number) => String(n).padStart(2, '0');

export type ToolboxStage =
  | { kind: 'sealed' }
  | { kind: 'opening' }
  | { kind: 'overhead' }
  | { kind: 'inside'; index: number };

export function getStage(p: number, count: number): ToolboxStage {
  if (p >= TIMELINE.dive[1]) {
    const [a, b] = TIMELINE.reveal;
    const index = Math.max(0, Math.min(count - 1, Math.floor(((p - a) / (b - a)) * count)));
    return { kind: 'inside', index };
  }
  if (p >= TIMELINE.overhead[0]) return { kind: 'overhead' };
  if (p >= TIMELINE.latch[0]) return { kind: 'opening' };
  return { kind: 'sealed' };
}

export const isSameStage = (a: ToolboxStage, b: ToolboxStage) =>
  a.kind === b.kind && (a.kind !== 'inside' || (b.kind === 'inside' && a.index === b.index));
