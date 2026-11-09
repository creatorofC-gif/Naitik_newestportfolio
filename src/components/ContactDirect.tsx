import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Inbox,
  Star,
  Send,
  FileText,
  PenSquare,
  Paperclip,
  Copy,
  Check,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { PROFILE_DATA } from '../data/profileData';
import { soundEffects } from '../utils/soundEffects';
import { runScrollScene, clamp01 } from '../utils/scrollScene';
import { GithubIcon, LinkedinIcon } from './SocialIcons';

/* ──────────────────────────────────────────────────────────────
   Contact — a desktop computer rises into view as you scroll, its
   screen powers on into a mail client, and you write to me in the
   compose window. On send, the message lands at the top of the inbox.

   Delivery: set VITE_CONTACT_ENDPOINT (e.g. a Formspree form URL) to
   deliver straight to my inbox. Without it, Send hands the message to
   the visitor's own mail app via mailto: and says so honestly.

   Performance: CSS only (no WebGL); scroll motion is transform/opacity
   on one layer, written only when values change.
   ────────────────────────────────────────────────────────────── */

const ENDPOINT: string | undefined = import.meta.env.VITE_CONTACT_ENDPOINT;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const progressIn = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

interface Mail {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  fresh?: boolean;
}

const SEED_INBOX: Mail[] = [
  {
    id: 'm1',
    from: PROFILE_DATA.personal.name,
    subject: 'Thanks for scrolling this far',
    preview: 'If anything here caught your eye, write to me — I read everything.',
    time: 'Mon',
  },
  {
    id: 'm2',
    from: PROFILE_DATA.personal.name,
    subject: 'Currently',
    preview: PROFILE_DATA.personal.availability,
    time: 'Sun',
  },
  {
    id: 'm3',
    from: PROFILE_DATA.personal.name,
    subject: 'Links',
    preview: 'GitHub and LinkedIn are in the sidebar, email is one click to copy.',
    time: 'Sat',
  },
];

type Status = 'compose' | 'sending' | 'sent';

export const ContactDirect: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const screenOffRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<Status>('compose');
  const [error, setError] = useState<string | null>(null);
  const [inbox, setInbox] = useState<Mail[]>(SEED_INBOX);
  const [sent, setSent] = useState<{ mail: Mail; body: string; email: string; via: 'endpoint' | 'mailto' } | null>(null);
  const [copied, setCopied] = useState(false);

  const email = PROFILE_DATA.personal.email;
  const { github, linkedin } = PROFILE_DATA.personal.socials;

  // ── Scroll: computer rises in, screen powers on ──
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let lastRise = -1;
    let lastPower = -1;
    const handle = runScrollScene(section, (p) => {
      const rise = Math.round(ease(progressIn(p, 0, 0.5)) * 400) / 400;
      const power = Math.round(progressIn(p, 0.45, 0.62) * 100) / 100;
      if (rise !== lastRise && rigRef.current) {
        lastRise = rise;
        rigRef.current.style.transform = `translate3d(0, ${(1 - rise) * 140}px, 0) scale(${0.84 + 0.16 * rise}) rotateX(${(1 - rise) * 20}deg)`;
        rigRef.current.style.opacity = String(0.15 + 0.85 * rise);
        if (headRef.current) {
          headRef.current.style.opacity = String(rise);
          headRef.current.style.transform = `translate3d(0, ${(1 - rise) * 24}px, 0)`;
        }
      }
      if (power !== lastPower && screenOffRef.current) {
        lastPower = power;
        screenOffRef.current.style.opacity = String(1 - power);
        screenOffRef.current.style.visibility = power >= 1 ? 'hidden' : 'visible';
      }
      return false;
    });
    return () => handle.stop();
  }, []);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const send = async () => {
    if (status === 'sending') return;
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Name, your email and a message are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('That email address doesn’t look right.');
      return;
    }
    setError(null);
    setStatus('sending');
    soundEffects.playHoverTick();

    const subject = form.subject.trim() || `Hello from ${form.name.trim()}`;
    const minDelay = new Promise((r) => setTimeout(r, 900));
    let via: 'endpoint' | 'mailto' = 'mailto';

    try {
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, subject, message: form.message }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        via = 'endpoint';
      } else {
        const body = `${form.message}\n\n— ${form.name} (${form.email})`;
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
      await minDelay;
    } catch {
      await minDelay;
      setStatus('compose');
      setError(`Couldn’t send just now — email me directly at ${email}.`);
      return;
    }

    const mail: Mail = {
      id: `sent-${Date.now()}`,
      from: form.name.trim(),
      subject,
      preview: form.message.trim().slice(0, 90),
      time: 'now',
      fresh: true,
    };
    setInbox((list) => [mail, ...list.map((m) => ({ ...m, fresh: false }))]);
    setSent({ mail, body: form.message.trim(), email: form.email.trim(), via });
    setStatus('sent');
    soundEffects.playEnvelopeSend();
  };

  const composeAnother = () => {
    setForm({ name: '', email: '', subject: '', message: '' });
    setSent(null);
    setStatus('compose');
  };

  const copyEmail = () => {
    navigator.clipboard?.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const field =
    'w-full bg-transparent text-[13px] text-ivory placeholder:text-slate-600 outline-none';

  return (
    <section id="contact" ref={sectionRef} aria-label="Contact" className="relative bg-obsidian-950" style={{ height: '185vh' }}>
      <div className="sticky top-0 flex h-viewport flex-col items-center justify-center overflow-hidden px-4 py-6">
        {/* Desk light */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(200, 242, 92,0.09),transparent_60%)]" />

        <div ref={headRef} className="relative mb-5 w-[min(1080px,94vw,99vh)] will-change-transform" style={{ opacity: 0 }}>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold-accent">05 — Contact</p>
          <h2 className="mt-2 font-serif text-4xl text-ivory md:text-5xl">
            Let’s build <em className="text-metal">something.</em>
          </h2>
        </div>

        <div className="relative" style={{ perspective: '1600px' }}>
          <div ref={rigRef} className="origin-bottom will-change-transform" style={{ opacity: 0 }}>
            {/* ─── Monitor ─── */}
            <div
              className="relative w-[min(1080px,94vw,99vh)] rounded-[20px] p-[10px] md:p-3"
              style={{
                background: 'linear-gradient(180deg, #23272D00 0%, #1E2227 0%, #141619 100%)',
                boxShadow: '0 40px 80px -30px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(255,255,255,0.05)',
              }}
            >
              <div className="relative h-[68vh] overflow-hidden rounded-[10px] bg-obsidian-900 md:aspect-[16/10] md:h-auto">
                {/* Mail app */}
                <div className="flex h-full flex-col text-left">
                  {/* Title bar */}
                  <div className="flex h-9 shrink-0 items-center border-b border-slate-800 bg-obsidian-950 px-3">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                    </div>
                    <p className="flex-1 text-center font-mono text-[11px] text-slate-500">Mail — {email}</p>
                    <Search className="h-3.5 w-3.5 text-slate-600" />
                  </div>

                  <div className="flex min-h-0 flex-1">
                    {/* Sidebar */}
                    <aside className="hidden w-[180px] shrink-0 flex-col border-r border-slate-800 bg-obsidian-950/60 p-3 md:flex">
                      <button
                        onClick={composeAnother}
                        className="btn-accent flex items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-medium"
                      >
                        <PenSquare className="h-3.5 w-3.5" /> New message
                      </button>
                      <nav className="mt-4 space-y-0.5 text-[12.5px]">
                        {[
                          { icon: Inbox, label: 'Inbox', count: inbox.length, active: true },
                          { icon: Star, label: 'Starred' },
                          { icon: Send, label: 'Sent' },
                          { icon: FileText, label: 'Drafts' },
                        ].map(({ icon: Icon, label, count, active }) => (
                          <div
                            key={label}
                            className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 ${active ? 'bg-obsidian-800 text-ivory' : 'text-slate-500'}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span className="flex-1">{label}</span>
                            {count ? <span className="font-mono text-[10px] text-gold-accent">{count}</span> : null}
                          </div>
                        ))}
                      </nav>

                      <p className="mb-1.5 mt-auto px-2.5 font-mono text-[10px] uppercase tracking-wider text-slate-600">Elsewhere</p>
                      <div className="space-y-0.5 text-[12.5px]">
                        {github && (
                          <a href={github} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-slate-400 hover:bg-obsidian-800 hover:text-ivory">
                            <GithubIcon className="h-3.5 w-3.5" /> GitHub
                          </a>
                        )}
                        {linkedin && (
                          <a href={linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-slate-400 hover:bg-obsidian-800 hover:text-ivory">
                            <LinkedinIcon className="h-3.5 w-3.5" /> LinkedIn
                          </a>
                        )}
                        <button onClick={copyEmail} className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-slate-400 hover:bg-obsidian-800 hover:text-ivory">
                          {copied ? <Check className="h-3.5 w-3.5 text-gold-accent" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? 'Copied' : 'Copy email'}
                        </button>
                      </div>
                    </aside>

                    {/* Message list */}
                    <div className="hidden w-[250px] shrink-0 flex-col border-r border-slate-800 lg:flex">
                      <div className="flex items-baseline justify-between border-b border-slate-800 px-4 py-3">
                        <p className="text-[13px] font-medium text-ivory">Inbox</p>
                        <p className="font-mono text-[10px] text-slate-500">{PROFILE_DATA.personal.name.split(' ')[0]}’s</p>
                      </div>
                      <ul className="min-h-0 flex-1 overflow-y-auto">
                        <AnimatePresence initial={false}>
                          {inbox.map((m) => (
                            <motion.li
                              key={m.id}
                              layout
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                              className={`border-b border-slate-800/70 px-4 py-3 ${m.fresh ? 'bg-gold-accent/10' : ''}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className={`truncate text-[12.5px] ${m.fresh ? 'font-semibold text-ivory' : 'text-slate-300'}`}>
                                  {m.fresh && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-gold-accent align-middle" />}
                                  {m.from}
                                </p>
                                <span className="shrink-0 font-mono text-[10px] text-slate-500">{m.time}</span>
                              </div>
                              <p className="mt-0.5 truncate text-[12px] text-slate-300">{m.subject}</p>
                              <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-slate-500">{m.preview}</p>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    </div>

                    {/* Reading / compose pane */}
                    <div className="relative min-w-0 flex-1">
                      <AnimatePresence mode="wait">
                        {status !== 'sent' ? (
                          <motion.form
                            key="compose"
                            onSubmit={(e) => {
                              e.preventDefault();
                              send();
                            }}
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send();
                            }}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -40, scale: 0.94, transition: { duration: 0.35, ease: [0.76, 0, 0.24, 1] } }}
                            className="flex h-full flex-col"
                          >
                            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
                              <p className="text-[13px] font-medium text-ivory">New message</p>
                              <Paperclip className="h-3.5 w-3.5 text-slate-600" />
                            </div>

                            <div className="divide-y divide-slate-800 border-b border-slate-800 px-5">
                              <div className="flex items-center gap-3 py-2.5">
                                <span className="w-16 shrink-0 text-[12px] text-slate-500">To</span>
                                <span className="truncate rounded-full bg-obsidian-800 px-2.5 py-0.5 text-[12px] text-slate-200">
                                  {PROFILE_DATA.personal.name} &lt;{email}&gt;
                                </span>
                              </div>
                              <label className="flex items-center gap-3 py-2.5">
                                <span className="w-16 shrink-0 text-[12px] text-slate-500">From</span>
                                <input value={form.name} onChange={update('name')} placeholder="Your name" autoComplete="name" className={field} required />
                              </label>
                              <label className="flex items-center gap-3 py-2.5">
                                <span className="w-16 shrink-0 text-[12px] text-slate-500">Reply-to</span>
                                <input type="email" value={form.email} onChange={update('email')} placeholder="you@company.com" autoComplete="email" className={field} required />
                              </label>
                              <label className="flex items-center gap-3 py-2.5">
                                <span className="w-16 shrink-0 text-[12px] text-slate-500">Subject</span>
                                <input value={form.subject} onChange={update('subject')} placeholder="Internship, project, or just hello" className={field} />
                              </label>
                            </div>

                            <textarea
                              value={form.message}
                              onChange={update('message')}
                              placeholder={`Hi ${PROFILE_DATA.personal.name.split(' ')[0]},\n\n`}
                              className={`${field} min-h-0 flex-1 resize-none px-5 py-4 leading-relaxed`}
                              required
                            />

                            <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 px-5 py-3">
                              <button
                                type="submit"
                                disabled={status === 'sending'}
                                className="btn-accent flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-medium disabled:opacity-70"
                              >
                                {status === 'sending' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                {status === 'sending' ? 'Sending…' : 'Send'}
                              </button>
                              <span className="hidden font-mono text-[10px] text-slate-600 sm:inline">Ctrl / ⌘ + Enter</span>
                              {error && <span className="text-[12px] text-red-400">{error}</span>}
                            </div>
                          </motion.form>
                        ) : (
                          sent && (
                            <motion.div
                              key="sent"
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                              className="flex h-full flex-col"
                            >
                              <div className="flex items-start gap-3 border-b border-slate-800 bg-gold-accent/10 px-5 py-3">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-accent" />
                                <div className="text-[12.5px]">
                                  <p className="font-medium text-ivory">
                                    {sent.via === 'endpoint' ? `Delivered to ${PROFILE_DATA.personal.name.split(' ')[0]}’s inbox` : 'Opened in your mail app'}
                                  </p>
                                  <p className="mt-0.5 text-slate-400">
                                    {sent.via === 'endpoint'
                                      ? `I’ll reply to ${sent.email} soon.`
                                      : 'Hit send there and it lands in my inbox — I’ll reply soon.'}
                                  </p>
                                </div>
                              </div>
                              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                                <h3 className="text-lg font-medium text-ivory">{sent.mail.subject}</h3>
                                <div className="mt-3 flex items-center gap-3">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-accent/20 font-mono text-[11px] text-gold-light">
                                    {sent.mail.from
                                      .split(/\s+/)
                                      .map((w) => w[0])
                                      .join('')
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </span>
                                  <div className="text-[12px]">
                                    <p className="text-ivory">
                                      {sent.mail.from} <span className="text-slate-500">&lt;{sent.email}&gt;</span>
                                    </p>
                                    <p className="text-slate-500">to {PROFILE_DATA.personal.name} · just now</p>
                                  </div>
                                </div>
                                <p className="mt-5 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-300">{sent.body}</p>
                              </div>
                              <div className="border-t border-slate-800 px-5 py-3">
                                <button
                                  onClick={composeAnother}
                                  className="flex items-center gap-2 rounded-lg border border-slate-700 px-3.5 py-1.5 text-[12px] text-slate-300 transition-colors hover:border-slate-500 hover:text-ivory"
                                >
                                  <ArrowLeft className="h-3.5 w-3.5" /> Write another
                                </button>
                              </div>
                            </motion.div>
                          )
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Screen glass: off-state that fades as the display powers on */}
                <div ref={screenOffRef} className="pointer-events-none absolute inset-0 bg-[#060708]" />
                {/* Subtle glare */}
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.04)_0%,transparent_35%)]" />
              </div>
              {/* Chin + camera dot */}
              <div className="pointer-events-none absolute left-1/2 top-[4px] h-1 w-1 -translate-x-1/2 rounded-full bg-slate-700" />
            </div>

            {/* Stand */}
            <div className="mx-auto hidden h-14 w-28 md:block" style={{ background: 'linear-gradient(180deg, #101215, #1E2227)', clipPath: 'polygon(18% 0, 82% 0, 92% 100%, 8% 100%)' }} />
            <div className="mx-auto hidden h-2.5 w-64 rounded-t-md md:block" style={{ background: 'linear-gradient(180deg, #2A2E35, #141619)', boxShadow: '0 18px 30px -10px rgba(0,0,0,0.9)' }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactDirect;
