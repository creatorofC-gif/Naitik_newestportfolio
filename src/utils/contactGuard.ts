/* ──────────────────────────────────────────────────────────────
   Contact-form guard: validation + anti-spam checks that run in the
   visitor's browser before anything is sent.

   These stop typos, junk and lazy bots early, but a determined bot can
   skip the browser entirely, so the backend (tools/contact-backend.gs)
   repeats every check server-side, plus a flood guard and per-sender limits.
   Keep the rules here and in that file in sync.
   ────────────────────────────────────────────────────────────── */

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 254 },
  subject: { max: 120 },
  message: { min: 20, max: 5000 },
  maxLinks: 2,
  /** Humans need a few seconds to write; bots submit instantly. */
  minFillMs: 3000,
  cooldownMs: 60_000,
  maxPerDay: 3,
} as const;

/** Throwaway-inbox providers commonly used for spam. Subdomains match too. */
const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com', '10minutemail.com', '10minutemail.net',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempmail.dev', 'throwawaymail.com', 'yopmail.com', 'yopmail.net',
  'getnada.com', 'nada.email', 'trashmail.com', 'trashmail.de', 'dispostable.com', 'maildrop.cc', 'mailnesia.com',
  'fakeinbox.com', 'mintemail.com', 'mohmal.com', 'emailondeck.com', 'tempinbox.com', 'spamgourmet.com', 'mailcatch.com',
  'moakt.com', 'burnermail.io', 'inboxkitten.com', 'mytemp.email', 'tempr.email', 'discard.email', 'emailfake.com',
]);

const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@([A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;
const LINK_RE = /\bhttps?:\/\/|\bwww\.|\b[a-z0-9-]+\.(?:ru|cn|xyz|top|click|link|biz|info)\b/gi;
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;

export const emailDomain = (email: string) => email.trim().slice(email.trim().lastIndexOf('@') + 1).toLowerCase();

/** Returns a friendly message for the first problem found, or null when the form is fine. */
export function validateContact(f: ContactInput, filledMs: number): string | null {
  const name = f.name.trim();
  const email = f.email.trim();
  const subject = f.subject.trim();
  const message = f.message.trim();

  if (!name || !email || !message) return 'Please add your name, your email and a message.';

  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) return `Your name should be ${LIMITS.name.min}–${LIMITS.name.max} characters.`;
  if (!NAME_RE.test(name)) return 'Please use just your name (letters, spaces, hyphens).';

  if (email.length > LIMITS.email.max || !EMAIL_RE.test(email) || email.includes('..') || email.split('@')[0].length > 64)
    return 'That email address doesn’t look right.';
  const domain = emailDomain(email);
  if ([...DISPOSABLE].some((d) => domain === d || domain.endsWith(`.${d}`)))
    return 'Please use a permanent email address so I can reply.';

  if (subject.length > LIMITS.subject.max) return `Keep the subject under ${LIMITS.subject.max} characters.`;

  if (message.length < LIMITS.message.min) return `Tell me a little more — at least ${LIMITS.message.min} characters.`;
  if (message.length > LIMITS.message.max) return `Please keep it under ${LIMITS.message.max} characters.`;
  if ((`${subject} ${message}`.match(LINK_RE) ?? []).length > LIMITS.maxLinks) return `Please include at most ${LIMITS.maxLinks} links.`;
  const letters = message.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 20 && letters.replace(/[^A-Z]/g, '').length / letters.length > 0.7) return 'Please don’t write in all caps.';
  if (/(.)\1{9,}/.test(message)) return 'That message looks like a keyboard smash — mind rewriting it?';

  if (filledMs < LIMITS.minFillMs) return 'That was quick! Give it a second look and press Send again.';
  return null;
}

/**
 * Can this email domain actually receive mail? Asks public DNS (Google DNS-over-HTTPS)
 * for MX records, falling back to an A record (RFC 5321). A "null MX" (RFC 7505) means no.
 * Returns null when the lookup itself fails (offline, blocked) — callers should not block on that.
 */
export async function domainAcceptsMail(domain: string, fetchImpl: typeof fetch = fetch, timeoutMs = 4000): Promise<boolean | null> {
  const ask = async (type: 'MX' | 'A') => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`, {
        signal: ctrl.signal,
        headers: { Accept: 'application/dns-json' },
      });
      if (!res.ok) return null;
      return (await res.json()) as { Status: number; Answer?: { type: number; data: string }[] };
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  };

  const mx = await ask('MX');
  if (!mx) return null;
  if (mx.Status === 3) return false; // NXDOMAIN: domain doesn't exist
  const records = (mx.Answer ?? []).filter((a) => a.type === 15);
  if (records.length) return !records.every((r) => /^0\s+\.$/.test(r.data.trim()));
  const a = await ask('A');
  if (!a) return null;
  return (a.Answer ?? []).some((r) => r.type === 1);
}

/* ─── Per-browser send limits (soft: a bot can clear storage, the server is the real limit) ─── */

const KEY = 'contact-sends';
const DAY = 24 * 60 * 60 * 1000;

function readSends(store: Pick<Storage, 'getItem'> | null, now: number): number[] {
  try {
    const raw = JSON.parse(store?.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((t): t is number => typeof t === 'number' && now - t < DAY) : [];
  } catch {
    return [];
  }
}

export function rateLimitError(store: Pick<Storage, 'getItem'> | null, now = Date.now()): string | null {
  const sends = readSends(store, now);
  if (sends.length >= LIMITS.maxPerDay) return 'You’ve sent a few messages today — I’ll get back to you soon. You can also email me directly.';
  const last = Math.max(0, ...sends);
  if (now - last < LIMITS.cooldownMs) return `Please wait ${Math.ceil((LIMITS.cooldownMs - (now - last)) / 1000)}s before sending another message.`;
  return null;
}

export function recordSend(store: Pick<Storage, 'getItem' | 'setItem'> | null, now = Date.now()) {
  try {
    store?.setItem(KEY, JSON.stringify([...readSends(store, now), now]));
  } catch {
    /* private mode / storage blocked: limits just don't persist */
  }
}
