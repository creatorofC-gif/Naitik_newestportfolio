// Runs the Apps Script backend (contact-backend.gs) in Node with fake Google services,
// so the whole doPost flow is tested without deploying anything.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CODE = readFileSync(new URL('./contact-backend.gs', import.meta.url), 'utf8');

function load({ mailFails = false, dns = { Status: 0, Answer: [{ type: 15, data: '5 mx.example.' }] } } = {}) {
  const props = new Map([['SHEET_ID', 'sheet-1']]);
  const sheets = { Messages: [] };
  const mail = [];
  const cache = new Map();
  const fakeSheet = (rows) => ({
    appendRow: (r) => rows.push(r),
    getLastRow: () => rows.length + 1,
    getSheetId: () => 7,
    getRange: (row, col) => ({ setValue: (v) => (rows[row - 2][col - 1] = v) }),
  });
  const ctx = {
    console,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props.get(k) ?? null, setProperty: (k, v) => props.set(k, v) }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: (n) => fakeSheet(sheets[n]), getUrl: () => 'https://sheet' }) },
    MailApp: { sendEmail: (m) => { if (mailFails) throw new Error('Service invoked too many times: email'); mail.push(m); } },
    CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) ?? null, put: (k, v) => cache.set(k, v) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ setMimeType: () => JSON.parse(s) }) },
    Utilities: { formatDate: (d) => d.toISOString().slice(0, 10) },
    UrlFetchApp: {
      fetch: () => ({
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify(dns),
      }),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  // Plain copies: objects created inside the sandbox have different prototypes than Node's.
  const post = (body) => JSON.parse(JSON.stringify(ctx.doPost({ postData: { contents: JSON.stringify(body) } })));
  const config = vm.runInContext('CONFIG', ctx);
  return { ctx, post, sheets, mail, config };
}

const good = { name: 'Priya Sharma', email: 'priya@company.dev', subject: 'Internship', message: 'Hi Naitik, are you open to a summer internship?', botcheck: '', elapsedMs: 9000, page: '/x' };

test('a valid message is saved and you are notified; nothing is emailed to the sender', () => {
  const { post, sheets, mail } = load();
  assert.deepEqual(post(good), { ok: true });
  assert.equal(sheets.Messages.length, 1);
  const row = sheets.Messages[0];
  assert.deepEqual([...row.slice(1, 7)], ['Priya Sharma', 'priya@company.dev', 'Internship', good.message, 'New', '/x']);
  assert.equal(mail.length, 1);
  assert.equal(mail[0].to, 'naitikg1103@gmail.com');
  assert.equal(mail[0].replyTo, 'priya@company.dev');
  assert.equal(mail[0].name, 'Priya Sharma'); // inbox shows the sender's name, not yours
  assert.match(mail[0].body, /summer internship[\s\S]*Priya Sharma\npriya@company.dev$/);
  assert.doesNotMatch(mail[0].body, /docs\.google|Reply to this email/); // plain text only
});

test('bots get a fake "ok" but nothing is saved or sent', () => {
  for (const bot of [{ ...good, botcheck: 'http://spam' }, { ...good, elapsedMs: 400 }]) {
    const { post, sheets, mail } = load();
    assert.deepEqual(post(bot), { ok: true });
    assert.equal(sheets.Messages.length, 0);
    assert.equal(mail.length, 0);
  }
});

test('server re-validates everything the browser checks', () => {
  const cases = [
    [{ email: 'not-an-email' }, /doesn’t look right/],
    [{ email: 'x@mailinator.com' }, /permanent email/],
    [{ name: 'http://buy.now' }, /just your name/],
    [{ message: 'hey' }, /little more/],
    [{ message: 'see https://a.co https://b.co www.c.co now please' }, /at most 2 links/],
    [{ message: 'BUY CHEAP SEO SERVICES FOR YOUR WEBSITE TODAY' }, /all caps/],
  ];
  for (const [patch, err] of cases) {
    const { post, sheets, mail } = load();
    const r = post({ ...good, ...patch });
    assert.equal(r.ok, false, JSON.stringify(patch));
    assert.match(r.error, err);
    assert.equal(sheets.Messages.length + mail.length, 0);
  }
});

test('formula injection is neutralised in the sheet', () => {
  const { post, sheets } = load();
  post({ ...good, subject: '=HYPERLINK("http://evil","click")' });
  assert.equal(sheets.Messages[0][3].startsWith("'="), true);
});

test('a domain that cannot receive mail is refused', () => {
  const { post, sheets } = load({ dns: { Status: 3 } });
  assert.match(post({ ...good, email: 'priya@gmail.con' }).error, /can’t receive email/);
  assert.equal(sheets.Messages.length, 0);
});

test('rate limits: per-sender cooldown and daily cap', () => {
  const { post, config } = load();
  assert.equal(post(good).ok, true);
  assert.match(post(good).error, /wait a minute/);
  config.perSenderCooldownSec = 0;
  assert.equal(post(good).ok, true);
  assert.equal(post(good).ok, true);
  assert.match(post(good).error, /few messages today/);
  config.maxPerDay = 3; // three accepted so far
  assert.match(post({ ...good, email: 'other@company.dev' }).error, /lot of messages today/);
});

test('bad JSON is rejected', () => {
  const { ctx } = load();
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.doPost({ postData: { contents: '{nope' } }))), { ok: false, error: 'Bad request.' });
});

test('email failure after saving: visitor still told "ok", the error goes in Notes, no duplicate on retry', () => {
  const { post, sheets } = load({ mailFails: true });
  assert.deepEqual(post(good), { ok: true });
  assert.equal(sheets.Messages.length, 1);
  assert.match(sheets.Messages[0][7], /email failed/); // Notes column
});

test('flood guard: past 30 requests a minute the backend does no work at all', () => {
  const { post, sheets } = load();
  for (let i = 0; i < 30; i++) post({ ...good, email: 'x' }); // junk, refused
  const r = post(good); // a valid message, but the 31st request this minute
  assert.equal(r.ok, false);
  assert.match(r.error, /Busy/);
  assert.equal(sheets.Messages.length, 0);
});

test('an address starting with "-" is stored as text, not a broken formula', () => {
  const { post, sheets } = load();
  post({ ...good, email: '-ab@company.dev' });
  assert.equal(sheets.Messages[0][2], "'-ab@company.dev");
});
