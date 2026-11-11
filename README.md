# Naitik Gupta — Developer Portfolio

**Live:** https://creatorofc-gif.github.io/Naitik_newestportfolio/

An interactive, scroll-driven portfolio built with React, TypeScript, Vite, Tailwind CSS and Three.js:
a 3D toolbox of skills, a project whiteboard written by a marker, a walkable git-branch timeline of
experience, and a mail-client contact form.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173/Naitik_newestportfolio/
npm run build      # production build in dist/
npm run test:unit  # resume parser, contact-form rules, date labels
npm run test:mobile # iPhone / Pixel / iPad checks (needs Playwright browsers)
```

## Updating the content

Most content comes from **the resume PDF in `src/data/`** (keep exactly one PDF there).
Before every `dev`/`build`, `tools/parse-resume.mjs` reads it and fills in education,
internships, projects and skills — and the site's "View Resume" button serves the same PDF.
Replace the PDF, push, and the site updates. If the resume's layout changes so much that it
can't be read, the build stops with an explanation instead of publishing wrong data.

Things that aren't on the resume (commit messages, project subtitles, skill descriptions)
are in the "Site-only extras" section at the top of `src/data/profileData.ts`.

## Contact form

Messages go to a Google Apps Script web app (`tools/contact-backend.gs`) that saves each one
to a Google Sheet and emails a notification. Setup steps are at the top of that file. The web
app's URL is the `ENDPOINT` constant in `src/components/ContactDirect.tsx` (it's public by
nature); if you create a new deployment, paste its URL there.

## Deploy

Pushing to `main` runs the mobile & unit checks; if they pass, GitHub Actions builds the site
and publishes it to GitHub Pages (Settings → Pages → Source: GitHub Actions).
