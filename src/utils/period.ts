/**
 * Resume periods → commit id + label for the Experience branch.
 *   "Sept 2025 — Oct 2025" → id "2025.09", label "Sep 2025 – Oct 2025"
 *   "Aug 2026 — Present"   → id "2026.08", label "Aug 2026 – Present"
 *   "July 2026"            → id "2026.07", label "Jul 2026"
 * Anything it can't read is shown as written.
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseMonth(s: string): { y: number; m: number } | null {
  const mt = s.trim().match(/^([A-Za-z]+)\.?\s+(\d{4})$/);
  if (!mt) return null;
  const m = MONTHS.findIndex((x) => x.toLowerCase() === mt[1].slice(0, 3).toLowerCase());
  return m < 0 ? null : { y: Number(mt[2]), m };
}

const fmt = (d: { y: number; m: number }) => `${MONTHS[d.m]} ${d.y}`;

export function commitDate(period: string): { id: string; label: string } {
  const [a, b] = period.split(/\s*[—–]\s*|\s+-\s+/);
  const start = parseMonth(a);
  if (!start) return { id: period, label: period };
  const id = `${start.y}.${String(start.m + 1).padStart(2, '0')}`;
  if (!b?.trim()) return { id, label: fmt(start) };
  const end = parseMonth(b);
  // An end that isn't a month ("Present", "Now", "Ongoing") is kept as written.
  return { id, label: `${fmt(start)} – ${end ? fmt(end) : b.trim()}` };
}
