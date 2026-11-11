import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commitDate } from './period.ts';

test('commitDate: ranges, single months, ongoing roles, unreadable input', () => {
  assert.deepEqual(commitDate('Sept 2025 — Oct 2025'), { id: '2025.09', label: 'Sep 2025 – Oct 2025' });
  assert.deepEqual(commitDate('Jan 2026 – Mar 2026'), { id: '2026.01', label: 'Jan 2026 – Mar 2026' });
  assert.deepEqual(commitDate('July 2026'), { id: '2026.07', label: 'Jul 2026' });
  assert.deepEqual(commitDate('Aug 2026 — Present'), { id: '2026.08', label: 'Aug 2026 – Present' });
  assert.deepEqual(commitDate('Summer 2025'), { id: 'Summer 2025', label: 'Summer 2025' });
});
