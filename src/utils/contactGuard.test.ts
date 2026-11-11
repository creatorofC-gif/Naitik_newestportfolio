import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateContact, domainAcceptsMail, rateLimitError, recordSend, LIMITS } from './contactGuard.ts';

const ok = { name: 'Priya Sharma', email: 'priya@company.com', subject: 'Internship', message: 'Hi Naitik, I loved your portfolio — are you open to an internship?' };
const SLOW = 10_000;

test('valid message passes', () => {
  assert.equal(validateContact(ok, SLOW), null);
  assert.equal(validateContact({ ...ok, name: 'José O’Brien-Núñez' }, SLOW), null);
});

test('required fields and lengths', () => {
  assert.match(validateContact({ ...ok, message: '' }, SLOW)!, /add your name/);
  assert.match(validateContact({ ...ok, name: 'A' }, SLOW)!, /name should be/);
  assert.match(validateContact({ ...ok, message: 'hey' }, SLOW)!, /at least/);
  assert.match(validateContact({ ...ok, message: 'a b '.repeat(2000) }, SLOW)!, /under/);
});

test('email format and throwaway inboxes', () => {
  for (const bad of ['priya', 'priya@', 'priya@company', 'pri ya@company.com', 'priya@@company.com', 'priya..x@company.com', 'priya@company.c'])
    assert.match(validateContact({ ...ok, email: bad }, SLOW)!, /doesn’t look right/, bad);
  assert.match(validateContact({ ...ok, email: 'bot@mailinator.com' }, SLOW)!, /permanent email/);
  assert.match(validateContact({ ...ok, email: 'bot@x.yopmail.com' }, SLOW)!, /permanent email/);
});

test('spam patterns', () => {
  assert.match(validateContact({ ...ok, name: 'Buy http://spam.ru' }, SLOW)!, /just your name/);
  assert.match(validateContact({ ...ok, message: 'Visit https://a.com https://b.com and www.c.com for deals today!!' }, SLOW)!, /at most 2 links/);
  assert.match(validateContact({ ...ok, message: 'HELLO I HAVE A GREAT OFFER FOR YOUR WEBSITE TODAY' }, SLOW)!, /all caps/);
  assert.match(validateContact({ ...ok, message: 'hi there aaaaaaaaaaaaaaaaaaa ok' }, SLOW)!, /keyboard smash/);
});

test('submitted faster than a human could type', () => {
  assert.match(validateContact(ok, LIMITS.minFillMs - 1)!, /quick/);
});

// fake DNS-over-HTTPS responses
const dns = (byType: Record<string, unknown>) =>
  (async (url: string) => {
    const type = new URL(url).searchParams.get('type')!;
    return new Response(JSON.stringify(byType[type] ?? { Status: 0 }));
  }) as unknown as typeof fetch;

test('domainAcceptsMail: MX, A fallback, null MX, missing domain, lookup failure', async () => {
  assert.equal(await domainAcceptsMail('gmail.com', dns({ MX: { Status: 0, Answer: [{ type: 15, data: '5 gmail-smtp-in.l.google.com.' }] } })), true);
  assert.equal(await domainAcceptsMail('small.dev', dns({ MX: { Status: 0 }, A: { Status: 0, Answer: [{ type: 1, data: '1.2.3.4' }] } })), true);
  assert.equal(await domainAcceptsMail('example.com', dns({ MX: { Status: 0, Answer: [{ type: 15, data: '0 .' }] } })), false);
  assert.equal(await domainAcceptsMail('gmail.con', dns({ MX: { Status: 3 } })), false);
  assert.equal(await domainAcceptsMail('nomail.dev', dns({ MX: { Status: 0 }, A: { Status: 0 } })), false);
  const broken = (async () => { throw new Error('offline'); }) as unknown as typeof fetch;
  assert.equal(await domainAcceptsMail('gmail.com', broken), null);
});

test('send limits: cooldown, then daily cap', () => {
  const mem = new Map<string, string>();
  const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  const t0 = 1_000_000_000;
  assert.equal(rateLimitError(store, t0), null);
  recordSend(store, t0);
  assert.match(rateLimitError(store, t0 + 10_000)!, /wait/);
  assert.equal(rateLimitError(store, t0 + LIMITS.cooldownMs), null);
  recordSend(store, t0 + 2 * LIMITS.cooldownMs);
  recordSend(store, t0 + 4 * LIMITS.cooldownMs);
  assert.match(rateLimitError(store, t0 + 6 * LIMITS.cooldownMs)!, /few messages today/);
  assert.equal(rateLimitError(store, t0 + 25 * 60 * 60 * 1000), null); // a day later
});
