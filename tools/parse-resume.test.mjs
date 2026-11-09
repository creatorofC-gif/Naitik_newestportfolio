import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePeriod, parseSkillItems, joinItems, parseResume } from './parse-resume.mjs';

test('normalizePeriod: resume date styles', () => {
  assert.equal(normalizePeriod('July’26'), 'July 2026');
  assert.equal(normalizePeriod('Jan’26 – Mar’26'), 'Jan 2026 — Mar 2026');
  assert.equal(normalizePeriod("Sept'25 - Oct'25"), 'Sept 2025 — Oct 2025');
  assert.equal(normalizePeriod('Aug’26 – Present'), 'Aug 2026 — Present');
  assert.equal(normalizePeriod('2028'), '2028');
});

test('parseSkillItems: tags, stray commas, no-space tags', () => {
  assert.deepEqual(parseSkillItems(' JavaScript (Fundamentals), React.js(Fundamentals), React Native,, Tailwind CSS,'), [
    { name: 'JavaScript', tag: 'Fundamentals' },
    { name: 'React.js', tag: 'Fundamentals' },
    { name: 'React Native' },
    { name: 'Tailwind CSS' },
  ]);
});

test('joinItems: no space before punctuation, space after a comma', () => {
  assert.equal(joinItems(['Programming Languages', ': HTML5', ',CSS3']), 'Programming Languages: HTML5, CSS3');
  assert.equal(joinItems(['School,Ghaziabad']), 'School, Ghaziabad');
});

// Lines as groupLines() produces them: { text, right, bullet, height }
const L = (text, extra = {}) => ({ text, right: '', bullet: false, height: 10, ...extra });
const H = (text) => L(text, { height: 12 });

test('parseResume: sections, wrapped bullets, wrapped skill tags', () => {
  const r = parseResume([
    L('Jane Doe', { height: 25 }),
    L('123 | jane@example.com | linkedin.com/in/jane'),
    H('Education'),
    L('Some College, City', { right: '2028' }),
    L('B.Tech. in CS', { right: 'CGPA: 9.0' }),
    H('Internship Experience'),
    L('Acme Corp (Frontend Developer)', { right: 'Jan’26 – Mar’26' }),
    L('Built the dashboard with', { bullet: true }),
    L('React and Tailwind.'),
    L('Shipped it.', { bullet: true }),
    H('Projects'),
    L('Thing – A Tool | React, Node', { right: 'Feb’26' }),
    L('Made a thing.', { bullet: true }),
    H('Skills'),
    L('Languages: Python'),
    L('(Fundamentals), Go'),
  ]);
  assert.equal(r.name, 'Jane Doe');
  assert.equal(r.email, 'jane@example.com');
  assert.deepEqual(r.education, [{ institution: 'Some College, City', period: '2028', qualification: 'B.Tech. in CS', result: 'CGPA: 9.0' }]);
  assert.deepEqual(r.experience, [
    { company: 'Acme Corp', role: 'Frontend Developer', period: 'Jan 2026 — Mar 2026', achievements: ['Built the dashboard with React and Tailwind.', 'Shipped it.'] },
  ]);
  assert.deepEqual(r.projects, [{ title: 'Thing – A Tool', tech: ['React', 'Node'], period: 'Feb 2026', highlights: ['Made a thing.'] }]);
  assert.deepEqual(r.skills, [{ category: 'Languages', items: [{ name: 'Python', tag: 'Fundamentals' }, { name: 'Go' }] }]);
});

test('parseResume: a changed layout fails loudly instead of publishing wrong data', () => {
  assert.throws(() => parseResume([L('Jane'), L('x'), H('Education'), L('Only one line', { right: '2028' })]), /Resume parse failed/);
  assert.throws(() => parseResume([L('Jane'), L('x'), H('Projects'), L('No date, no entry')]), /Resume parse failed/);
});
