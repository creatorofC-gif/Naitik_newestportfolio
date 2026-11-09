#!/usr/bin/env node
/**
 * Resume pipeline: src/data/*.pdf  →  src/data/resume.generated.json  +  public/resume.pdf
 *
 * Runs automatically before `npm run dev` / `npm run build` (and therefore in the
 * GitHub deploy). Replace the PDF in src/data, push, and the site's education,
 * experience, projects and skills update from it.
 *
 * Built for the LaTeX resume layout: section headings (Education, Internship
 * Experience, Projects, Skills), entry lines with a right-aligned date, "•" bullets,
 * and "Category: a, b, c" skill lines. If the layout stops matching, it exits with
 * a clear error instead of publishing wrong data.
 */
import { readFileSync, writeFileSync, readdirSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'src', 'data');
const OUT_JSON = join(DATA_DIR, 'resume.generated.json');
const OUT_PDF = join(ROOT, 'public', 'resume.pdf');

const SECTIONS = {
  education: ['education'],
  experience: ['internship experience', 'experience', 'work experience', 'professional experience'],
  projects: ['projects'],
  skills: ['skills', 'technical skills'],
};
/** Items starting right of this x (PDF points) are the right-aligned column: dates, scores. */
const RIGHT_COLUMN_X = 430;

/* ─── small pure helpers (unit-tested) ───────────────────── */

/** "July’26" → "July 2026", "Jan’26 – Mar’26" → "Jan 2026 — Mar 2026", "2028" stays. */
export function normalizePeriod(raw) {
  return raw
    .replace(/[’'`´]\s?(\d{2})\b/g, ' 20$1')
    .replace(/\s*[–—-]\s*/g, ' — ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "JavaScript (Fundamentals), React.js(Fundamentals), React Native,, X" → [{name, tag?}] */
export function parseSkillItems(list) {
  return list
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
      return m ? { name: m[1].trim(), tag: m[2].trim() } : { name: s };
    })
    .filter((s) => s.name);
}

/** Join text items on one line; no space before punctuation. */
export function joinItems(strs) {
  return strs
    .join(' ')
    .replace(/\s+([:,.;)])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/,(?=[A-Za-z])/g, ', ') // "School,Ghaziabad" → "School, Ghaziabad"
    .replace(/\s+/g, ' ')
    .trim();
}

/** Group pdf.js text items into visual lines, top to bottom. */
export function groupLines(items) {
  const rows = [];
  for (const it of items) {
    if (!it.str.trim()) continue;
    const x = it.transform[4];
    const y = it.transform[5];
    let row = rows.find((r) => Math.abs(r.y - y) <= 3);
    if (!row) rows.push((row = { y, items: [] }));
    row.items.push({ x, str: it.str, h: it.height });
  }
  rows.sort((a, b) => b.y - a.y);
  return rows.map((r) => {
    r.items.sort((a, b) => a.x - b.x);
    const left = r.items.filter((i) => i.x < RIGHT_COLUMN_X);
    const right = r.items.filter((i) => i.x >= RIGHT_COLUMN_X);
    const bullet = left[0]?.str.trim() === '•';
    return {
      text: joinItems((bullet ? left.slice(1) : left).map((i) => i.str)),
      right: joinItems(right.map((i) => i.str)),
      bullet,
      height: Math.max(...r.items.map((i) => i.h)),
      x: r.items[0].x,
    };
  });
}

function sectionOf(line) {
  const t = line.text.toLowerCase();
  if (line.right || line.bullet || line.height < 11.5) return null;
  return Object.keys(SECTIONS).find((k) => SECTIONS[k].includes(t)) ?? null;
}

/** Entries made of a header line (with a right-aligned date) followed by "•" bullets. */
function parseEntries(lines, what) {
  const entries = [];
  for (const l of lines) {
    if (l.right && !l.bullet) entries.push({ header: l.text, period: normalizePeriod(l.right), bullets: [] });
    else if (!entries.length) fail(`${what}: expected an entry line with a date on the right, got "${l.text}"`);
    else if (l.bullet) entries.at(-1).bullets.push(l.text);
    else if (entries.at(-1).bullets.length) entries.at(-1).bullets[entries.at(-1).bullets.length - 1] += ` ${l.text}`;
    else entries.at(-1).header += ` ${l.text}`;
  }
  return entries;
}

export function parseResume(lines) {
  const [nameLine, contactLine] = lines;
  const bySection = {};
  let current = null;
  for (const l of lines.slice(2)) {
    const s = sectionOf(l);
    if (s) {
      current = s;
      bySection[s] = [];
    } else if (current) bySection[current].push(l);
  }
  for (const s of Object.keys(SECTIONS)) if (!bySection[s]?.length) fail(`missing or empty section "${SECTIONS[s][0]}"`);

  // Education: pairs of lines — "Institution | year" then "Qualification | result"
  const edu = bySection.education;
  if (edu.length % 2) fail('education: expected pairs of lines (institution/year, then qualification/result)');
  const education = [];
  for (let i = 0; i < edu.length; i += 2) {
    education.push({ institution: edu[i].text, period: edu[i].right, qualification: edu[i + 1].text, result: edu[i + 1].right });
  }

  const experience = parseEntries(bySection.experience, 'experience').map((e) => {
    const m = e.header.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (!m) fail(`experience: expected "Company (Role)", got "${e.header}"`);
    if (!e.bullets.length) fail(`experience: "${e.header}" has no bullet points`);
    return { company: m[1].trim(), role: m[2].trim(), period: e.period, achievements: e.bullets };
  });

  const projects = parseEntries(bySection.projects, 'projects').map((p) => {
    const [title, tech = ''] = p.header.split('|').map((s) => s.trim());
    if (!p.bullets.length) fail(`projects: "${title}" has no bullet points`);
    return { title, tech: parseSkillItems(tech).map((t) => t.name), period: p.period, highlights: p.bullets };
  });

  // Collect each category's full list first: a wrapped line can start mid-item ("(Fundamentals), C++").
  const rawSkills = [];
  for (const l of bySection.skills) {
    const i = l.text.indexOf(':');
    if (i > 0) rawSkills.push({ category: l.text.slice(0, i).trim(), list: l.text.slice(i + 1) });
    else if (rawSkills.length) rawSkills.at(-1).list += ` ${l.text}`;
    else fail(`skills: expected "Category: item, item", got "${l.text}"`);
  }
  const skills = rawSkills.map((s) => ({ category: s.category, items: parseSkillItems(s.list) }));

  const email = contactLine?.text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] ?? '';
  return { name: nameLine?.text ?? '', email, education, experience, projects, skills };
}

function fail(msg) {
  throw new Error(`Resume parse failed: ${msg}.\nThe site was NOT updated. Check the resume layout, or adjust tools/parse-resume.mjs.`);
}

/* ─── run ─────────────────────────────────────────────────── */

async function main() {
  const pdfs = readdirSync(DATA_DIR).filter((f) => f.toLowerCase().endsWith('.pdf'));
  if (pdfs.length !== 1) fail(`expected exactly one PDF in src/data, found ${pdfs.length} (${pdfs.join(', ') || 'none'})`);
  const pdfPath = join(DATA_DIR, pdfs[0]);

  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await getDocument({ data: new Uint8Array(readFileSync(pdfPath)), verbosity: 0 }).promise;
  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    lines.push(...groupLines((await page.getTextContent()).items));
  }

  const resume = { source: pdfs[0], ...parseResume(lines) };
  writeFileSync(OUT_JSON, JSON.stringify(resume, null, 2) + '\n');
  mkdirSync(dirname(OUT_PDF), { recursive: true });
  copyFileSync(pdfPath, OUT_PDF);
  console.log(
    `resume: ${pdfs[0]} → ${resume.education.length} education, ${resume.experience.length} experience, ` +
      `${resume.projects.length} projects, ${resume.skills.reduce((n, s) => n + s.items.length, 0)} skills`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
