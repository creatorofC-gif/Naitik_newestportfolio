const CONFIG = {
  ownerEmail: 'naitikg1103@gmail.com',
  /** Total accepted messages per day (protects your Gmail sending quota). */
  maxPerDay: 40,
  /** Per sender address. */
  perSenderCooldownSec: 60,
  perSenderPerDay: 3,
};

/** Requests per minute (from everyone) above which the backend stops doing any work. */
const FLOOD_PER_MIN = 30;

/* ─── Validation rules (keep in sync with src/utils/contactGuard.ts) ─────────────────── */

const LIMITS = { nameMin: 2, nameMax: 80, emailMax: 254, subjectMax: 120, messageMin: 20, messageMax: 5000, maxLinks: 2, minFillMs: 3000 };
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@([A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;
const LINK_RE = /\bhttps?:\/\/|\bwww\.|\b[a-z0-9-]+\.(?:ru|cn|xyz|top|click|link|biz|info)\b/gi;
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;
const DISPOSABLE = [
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com', '10minutemail.com', '10minutemail.net',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempmail.dev', 'throwawaymail.com', 'yopmail.com', 'yopmail.net',
  'getnada.com', 'nada.email', 'trashmail.com', 'trashmail.de', 'dispostable.com', 'maildrop.cc', 'mailnesia.com',
  'fakeinbox.com', 'mintemail.com', 'mohmal.com', 'emailondeck.com', 'tempinbox.com', 'spamgourmet.com', 'mailcatch.com',
  'moakt.com', 'burnermail.io', 'inboxkitten.com', 'mytemp.email', 'tempr.email', 'discard.email', 'emailfake.com',
];

/** Returns { ok: true, data } with cleaned fields, or { ok: false, error, silent? }. Pure: no Google services. */
function validate_(input) {
  const s = (v, max) => String(v == null ? '' : v).trim().slice(0, max + 1);
  const d = {
    name: s(input.name, LIMITS.nameMax),
    email: s(input.email, LIMITS.emailMax).toLowerCase(),
    subject: s(input.subject, LIMITS.subjectMax),
    message: s(input.message, LIMITS.messageMax),
  };
  // Bots: hidden field filled, or submitted faster than a person can type. Answer "ok", store nothing.
  if (String(input.botcheck || '').trim()) return { ok: false, error: 'honeypot', silent: true };
  if (!(Number(input.elapsedMs) >= LIMITS.minFillMs)) return { ok: false, error: 'too fast', silent: true };

  if (!d.name || !d.email || !d.message) return { ok: false, error: 'Please add your name, your email and a message.' };
  if (d.name.length < LIMITS.nameMin || d.name.length > LIMITS.nameMax || !NAME_RE.test(d.name))
    return { ok: false, error: 'Please use just your name (letters, spaces, hyphens).' };
  if (d.email.length > LIMITS.emailMax || !EMAIL_RE.test(d.email) || d.email.indexOf('..') >= 0 || d.email.split('@')[0].length > 64)
    return { ok: false, error: 'That email address doesn’t look right.' };
  const domain = d.email.split('@')[1];
  if (DISPOSABLE.some((x) => domain === x || domain.endsWith('.' + x))) return { ok: false, error: 'Please use a permanent email address so I can reply.' };
  if (d.subject.length > LIMITS.subjectMax) return { ok: false, error: 'Please keep the subject shorter.' };
  if (d.message.length < LIMITS.messageMin) return { ok: false, error: 'Tell me a little more in your message.' };
  if (d.message.length > LIMITS.messageMax) return { ok: false, error: 'Please keep your message shorter.' };
  if (((d.subject + ' ' + d.message).match(LINK_RE) || []).length > LIMITS.maxLinks) return { ok: false, error: 'Please include at most 2 links.' };
  const letters = d.message.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 20 && letters.replace(/[^A-Z]/g, '').length / letters.length > 0.7) return { ok: false, error: 'Please don’t write in all caps.' };
  if (/(.)\1{9,}/.test(d.message)) return { ok: false, error: 'That message doesn’t look right — mind rewriting it?' };
  return { ok: true, data: d };
}

/* ─── Web app entry points ──────────────────────────────────────────────────────────── */

function doPost(e) {
  // Flood guard first: cheap, before any logging or web lookups, so a script hammering the
  // public URL can't burn the daily Google quotas real messages need.
  if (flooded_()) return json_({ ok: false, error: 'Busy right now — please try again in a few minutes.' });

  let input = {};
  try {
    input = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'Bad request.' });
  }

  const v = validate_(input);
  if (!v.ok) {
    return json_(v.silent ? { ok: true } : { ok: false, error: v.error }); // bots get a fake "ok"
  }
  const d = v.data;

  if (domainAcceptsMail_(d.email.split('@')[1]) === false) {
    return json_({ ok: false, error: `“${d.email.split('@')[1]}” can’t receive email — check the address for typos.` });
  }

  // Rate limits + write are done under a lock so simultaneous requests can't slip past them.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({ ok: false, error: 'Busy right now — please try again in a moment.' });
  let row;
  try {
    const limited = rateLimit_(d.email);
    if (limited) return json_({ ok: false, error: limited });
    row = saveMessage_(d, input.page);
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Couldn’t send just now.' });
  } finally {
    lock.releaseLock();
  }

  // The message is saved: the visitor is told "delivered" even if the email to you fails
  // (the failure goes in the row's Notes, so nothing is lost or duplicated by a retry).
  try {
    notifyOwner_(d);
  } catch (err) {
    note_(row, 'Notification email failed: ' + err);
  }
  return json_({ ok: true });
}

/** Visiting the URL in a browser shows this: a quick "is it deployed?" check. */
function doGet() {
  return json_({ ok: true, service: 'portfolio-contact' });
}

/* ─── Setup ─────────────────────────────────────────────────────────────────────────── */

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Run setup from the script opened via the sheet (Extensions → Apps Script).');
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());

  const messages = sheet_(ss, 'Messages', ['Received', 'Name', 'Email', 'Subject', 'Message', 'Status', 'Page', 'Notes']);
  messages.setColumnWidths(1, 1, 150).setColumnWidths(2, 1, 150).setColumnWidths(3, 1, 220).setColumnWidths(4, 1, 200).setColumnWidth(5, 420);
  messages.getRange('E:E').setWrap(true);
  const status = SpreadsheetApp.newDataValidation().requireValueInList(['New', 'Replied', 'Spam', 'Archived'], true).build();
  messages.getRange('F2:F').setDataValidation(status);

  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
}

/* ─── Google-service helpers ────────────────────────────────────────────────────────── */

function book_() {
  return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
}

function sheet_(ss, name, headers) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1C2026').setFontColor('#E3E6EA');
    sh.setFrozenRows(1);
  }
  return sh;
}

function saveMessage_(d, page) {
  const sh = book_().getSheetByName('Messages');
  // Leading "'" stops a message like "=HYPERLINK(...)" being run as a formula.
  const safe = (v) => (/^[=+\-@]/.test(v) ? "'" + v : v);
  sh.appendRow([new Date(), safe(d.name), safe(d.email), safe(d.subject), safe(d.message), 'New', String(page || '').slice(0, 200), '']);
  return sh.getLastRow();
}

function note_(row, text) {
  try {
    book_().getSheetByName('Messages').getRange(row, 8).setValue(String(text).slice(0, 500));
  } catch (err) {
    console.error(err);
  }
}

/** True when more than FLOOD_PER_MIN requests arrived this minute (shared across all callers). */
function flooded_() {
  const cache = CacheService.getScriptCache();
  const key = 'flood:' + Math.floor(Date.now() / 60000);
  const n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 120);
  return n > FLOOD_PER_MIN;
}

/** true / false, or null when the lookup itself fails (then we don't block). */
function domainAcceptsMail_(domain) {
  const ask = (type) => {
    try {
      const r = UrlFetchApp.fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`, { muteHttpExceptions: true });
      return r.getResponseCode() === 200 ? JSON.parse(r.getContentText()) : null;
    } catch (err) {
      return null;
    }
  };
  const mx = ask('MX');
  if (!mx) return null;
  if (mx.Status === 3) return false;
  const records = (mx.Answer || []).filter((a) => a.type === 15);
  if (records.length) return !records.every((r) => /^0\s+\.$/.test(String(r.data).trim()));
  const a = ask('A');
  if (!a) return null;
  return (a.Answer || []).some((r) => r.type === 1);
}

function rateLimit_(email) {
  const props = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(new Date(), 'Etc/UTC', 'yyyy-MM-dd');
  const now = Date.now();
  let log = {};
  try {
    log = JSON.parse(props.getProperty('rate') || '{}');
  } catch (err) {
    log = {};
  }
  if (log.day !== today) log = { day: today, total: 0, by: {} };
  const mine = (log.by[email] || []).filter((t) => now - t < 24 * 3600 * 1000);

  if (log.total >= CONFIG.maxPerDay) return 'I’m getting a lot of messages today — please email me directly.';
  if (mine.length >= CONFIG.perSenderPerDay) return 'You’ve sent a few messages today — I’ll get back to you soon.';
  if (mine.length && now - Math.max.apply(null, mine) < CONFIG.perSenderCooldownSec * 1000) return 'Please wait a minute before sending another message.';

  mine.push(now);
  log.by[email] = mine;
  log.total += 1;
  props.setProperty('rate', JSON.stringify(log));
  return null;
}

function notifyOwner_(d) {
  // Gmail only sends from your own account, so the sender's *name* is shown as the From name
  // and Reply-To is their address: in your inbox it reads "Priya Sharma", and Reply goes to them.
  MailApp.sendEmail({
    to: CONFIG.ownerEmail,
    replyTo: d.email,
    name: d.name,
    subject: d.subject || 'New message from your portfolio',
    body: `${d.message}\n\n${d.name}\n${d.email}`,
  });
}

/* ─── Pure helpers ──────────────────────────────────────────────────────────────────── */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
