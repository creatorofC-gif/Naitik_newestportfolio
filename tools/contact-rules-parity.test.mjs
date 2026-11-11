// The contact rules live twice: in the website (src/utils/contactGuard.ts) and in the
// Apps Script backend (tools/contact-backend.gs) — they run in different places, so they
// can't share code. This test fails if a change to one isn't made to the other.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { validateContact } from '../src/utils/contactGuard.ts';

const ctx = {};
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('./contact-backend.gs', import.meta.url), 'utf8'), ctx);

const ok = { name: 'Priya Sharma', email: 'priya@company.dev', subject: 'Internship', message: 'Hi Naitik, are you open to a summer internship?' };
const cases = [
  ok,
  { ...ok, name: 'José O’Brien-Núñez' },
  { ...ok, name: 'A' },
  { ...ok, name: 'x'.repeat(81) },
  { ...ok, name: 'Buy http://spam.ru' },
  { ...ok, email: '' },
  { ...ok, email: 'priya' },
  { ...ok, email: 'priya@company' },
  { ...ok, email: 'priya..x@company.dev' },
  { ...ok, email: `${'a'.repeat(65)}@company.dev` },
  { ...ok, email: 'bot@mailinator.com' },
  { ...ok, email: 'bot@x.yopmail.com' },
  { ...ok, subject: 's'.repeat(121) },
  { ...ok, message: 'too short' },
  { ...ok, message: 'm '.repeat(2501) },
  { ...ok, message: 'see https://a.co https://b.co www.c.co for details please' },
  { ...ok, message: 'see https://a.co and https://b.co for details please' },
  { ...ok, message: 'BUY CHEAP SEO SERVICES FOR YOUR WEBSITE TODAY' },
  { ...ok, message: 'hi there aaaaaaaaaaaaaaaaaaa ok fine' },
];

test('website and Apps Script accept and reject exactly the same messages', () => {
  for (const c of cases) {
    const site = validateContact(c, 10_000) === null;
    const server = ctx.validate_({ ...c, botcheck: '', elapsedMs: 10_000 }).ok;
    assert.equal(site, server, `disagree on ${JSON.stringify(c).slice(0, 120)}`);
  }
});

test('both use the same "too fast to be human" threshold', () => {
  const limits = vm.runInContext('LIMITS', ctx);
  assert.equal(validateContact(ok, limits.minFillMs - 1) === null, false);
  assert.equal(validateContact(ok, limits.minFillMs) === null, true);
});
