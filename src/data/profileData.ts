/* ──────────────────────────────────────────────────────────────
   Site content.

   Resume facts (education, internships, projects, skills) come from
   your resume PDF: put it in src/data/, and tools/parse-resume.mjs turns
   it into resume.generated.json before every dev run and build.
   Edit the resume → push → the site updates.

   Everything in "Site-only extras" below is content that isn't on the
   resume (commit messages, project subtitles, skill descriptions...).
   Each extra is optional and matched by name; anything missing falls
   back to something sensible derived from the resume.
   ────────────────────────────────────────────────────────────── */
import resume from './resume.generated.json';

export interface Skill {
  name: string;
  highlightTag?: string;
  description: string;
}

export interface SkillCategory {
  id: string;
  categoryName: string;
  skills: Skill[];
}

export interface Project {
  id: string;
  title: string;
  category: 'Web Architecture' | 'AI / Intelligent Systems' | 'Cloud Infrastructure' | 'Mobile & Cross-Platform';
  subtitle: string;
  /** When it was built, as on the resume (e.g. "Feb 2026"). */
  period?: string;
  description: string;
  longDescription: string;
  technicalHighlights: string[];
  impactMetrics: { label: string; value: string }[];
  tags: string[];
  image: string;
  demoUrl: string;
  githubUrl: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
  achievements: string[];
  technologies: string[];
  /** One-line "commit message": what I did, in short. */
  summary?: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  qualification: string;
  period: string;
  result: string;
}

/* ─── Site-only extras (not on the resume) ───────────────────── */

/** Matched when the resume's company name contains the key (case-insensitive). */
const EXPERIENCE_EXTRAS: Record<string, { summary?: string; description?: string; technologies?: string[] }> = {
  'red leaf': {
    summary: 'Built Angular features and debugged them under mentor guidance',
    description:
      'Worked on guided Angular development tasks while building familiarity with component-based application development and professional frontend workflows.',
    technologies: ['Angular', 'TypeScript', 'Angular CLI', 'Git'],
  },
  'alien healthcare': {
    summary: 'Shipped a Bluetooth Android app that controls an ESP32 heating band',
    description:
      'Developed a Bluetooth-enabled Android application integrated with an ESP32-based smart heating band system for device control.',
    technologies: ['Android', 'ESP32', 'Bluetooth'],
  },
  myezz: {
    summary: 'Rebuilt the MyEzz web platform with React and Tailwind CSS',
    description:
      'Redesigned and redeveloped the web platform with a focus on UI/UX, responsiveness, frontend performance, and maintainability.',
    technologies: ['React.js', 'Tailwind CSS'],
  },
};

/** Matched when the resume's project title contains the key (case-insensitive). */
const PROJECT_EXTRAS: Record<string, Partial<Omit<Project, 'id' | 'title' | 'period' | 'technicalHighlights'>> & { extraTags?: string[] }> = {
  memories: {
    category: 'Mobile & Cross-Platform',
    subtitle: 'Secure Android photo gallery built with React Native',
    description:
      'An Android application built with React Native to function as a secure photo gallery, with photos organized and tagged by locations and memories.',
    longDescription:
      'Memories is an Android application developed with React Native to function as a secure photo gallery. It organizes and tags photos based on locations and memories, with a focus on privacy, smooth UI interactions, and efficient media handling.',
    impactMetrics: [
      { label: 'Platform', value: 'Android' },
      { label: 'Framework', value: 'React Native' },
      { label: 'Focus', value: 'Privacy & Media Handling' },
    ],
    extraTags: ['Android'],
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80',
  },
};

/** How resume skill categories become toolbox trays. */
const SKILL_TRAYS = {
  skip: ['Soft Skills'], // not tools
  mergeInto: { Databases: 'Developer Tools' } as Record<string, string>, // a 1-item tray looks empty
  rename: { 'Developer Tools': 'Databases & Developer Tools', 'AI Tools': 'AI Development Tools' } as Record<string, string>,
};

/** Shown on hover for each skill card. Missing ones just show nothing. */
const SKILL_NOTES: Record<string, string> = {
  'React.js': 'Component-based UI development and responsive frontend interfaces.',
  Angular: 'Components, modules, routing, services, data binding, and Angular CLI.',
  'React Native': 'Android application development with smooth UI interactions and media handling.',
  'Tailwind CSS': 'Responsive UI styling and reusable utility-based interface development.',
  Bootstrap: 'Responsive layouts and UI development using Bootstrap.',
  JavaScript: 'Core JavaScript concepts used in frontend development.',
  TypeScript: 'Type-safe development used with Angular and modern frontend projects.',
  Python: 'Programming fundamentals and problem-solving with Python.',
  'C++': 'Programming fundamentals and algorithmic problem-solving with C++.',
  HTML5: 'Semantic structure and frontend page development.',
  CSS3: 'Responsive styling, layouts, and visual presentation.',
  SQL: 'SQL fundamentals and relational database interaction.',
  PostgreSQL: 'Relational database development and management with PostgreSQL and pgAdmin.',
  Git: 'Version control and collaborative development workflows.',
  GitHub: 'Repository management and collaborative software development.',
  'Angular CLI': 'Angular project creation, development, and tooling.',
  'VS Code': 'Primary development environment for software projects.',
  'Thunder Client': 'API request testing and development workflow support.',
  'Android Studio': 'Android application development and debugging.',
  Expo: 'React Native development and mobile project tooling.',
  pgAdmin: 'PostgreSQL database administration and inspection.',
  Claude: 'AI-assisted development and technical problem solving.',
  ChatGPT: 'AI-assisted development, research, and productivity.',
  Stitch: 'AI-assisted interface design and prototyping.',
  Antigravity: 'AI-assisted development workflow and project iteration.',
};

/* ─── Build the site data from the resume ────────────────────── */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const loose = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#]/g, ''); // "ThunderClient" ≈ "Thunder Client"
const extrasFor = <T,>(table: Record<string, T>, name: string): T | undefined =>
  Object.entries(table).find(([key]) => name.toLowerCase().includes(key))?.[1];
const noteFor = (name: string) => Object.entries(SKILL_NOTES).find(([k]) => loose(k) === loose(name))?.[1] ?? '';
const singular = (category: string) =>
  ({ 'Programming Languages': 'Language', 'Frameworks & Libraries': 'Framework', Databases: 'Database', 'Developer Tools': 'Developer Tool', 'AI Tools': 'AI Tool' })[
    category
  ] ?? category;

const education: EducationItem[] = resume.education.map((e, i) => ({ id: `edu-${i + 1}`, ...e }));

const experience: ExperienceItem[] = resume.experience.map((e) => {
  const extra = extrasFor(EXPERIENCE_EXTRAS, e.company) ?? {};
  return {
    id: slug(e.company),
    role: e.role,
    company: e.company,
    period: e.period,
    achievements: e.achievements,
    description: extra.description ?? e.achievements[0],
    technologies: extra.technologies ?? [],
    summary: extra.summary,
  };
});

const projects: Project[] = resume.projects.map((p) => {
  const extra = extrasFor(PROJECT_EXTRAS, p.title) ?? {};
  const mobile = p.tech.some((t) => /react native|android|flutter|kotlin|swift/i.test(t));
  return {
    id: slug(p.title.split(/\s[–—-]\s/)[0]),
    title: p.title,
    period: p.period,
    technicalHighlights: p.highlights,
    category: extra.category ?? (mobile ? 'Mobile & Cross-Platform' : 'Web Architecture'),
    subtitle: extra.subtitle ?? p.highlights[0],
    description: extra.description ?? p.highlights.join(' '),
    longDescription: extra.longDescription ?? p.highlights.join(' '),
    impactMetrics: extra.impactMetrics ?? [
      { label: 'Stack', value: p.tech.join(' · ') },
      { label: 'Built', value: p.period },
    ],
    tags: [...p.tech, ...(extra.extraTags ?? []).filter((t) => !p.tech.includes(t))],
    image: extra.image ?? 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1000&q=80',
    demoUrl: extra.demoUrl ?? '',
    githubUrl: extra.githubUrl ?? '',
  };
});

const skillCategories: SkillCategory[] = [];
for (const group of resume.skills) {
  if (SKILL_TRAYS.skip.includes(group.category)) continue;
  const target = SKILL_TRAYS.mergeInto[group.category] ?? group.category;
  const skills = group.items.map((s: { name: string; tag?: string }) => ({
    name: s.name,
    highlightTag: s.tag ?? singular(group.category),
    description: noteFor(s.name),
  }));
  const tray = skillCategories.find((c) => c.id === slug(target));
  if (tray) tray.skills.push(...skills);
  else skillCategories.push({ id: slug(target), categoryName: SKILL_TRAYS.rename[target] ?? target, skills });
}

export const PROFILE_DATA = {
  personal: {
    name: resume.name || 'Naitik Gupta',
    tagline: 'Building responsive web experiences, mobile applications, and practical software systems.',
    email: resume.email || 'naitikg1103@gmail.com',
    availability: 'Open to internships and software development opportunities',
    statusBadge: 'Computer Engineering • Open to Opportunities',
    socials: {
      github: 'https://github.com/creatorofC-gif',
      linkedin: 'https://www.linkedin.com/in/naitik-gupta-236a43320/',
    },
    /** The same PDF the site is built from, copied into the site by the resume pipeline. */
    resumeUrl: `${import.meta.env.BASE_URL}resume.pdf`,
  },
  education,
  experience,
  projects,
  skillCategories,
};
