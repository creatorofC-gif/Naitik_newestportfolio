---
trigger: always_on
---

# Global Development Rules

## Project Objective

This repository is a premium interactive developer portfolio built with React,
TypeScript, Vite and Tailwind CSS.

The goal is to create a sophisticated, production-quality portfolio that feels
like the website of an experienced Full-Stack and AI Systems Architect.

Prioritize:

- UX
- visual quality
- maintainability
- performance
- accessibility
- responsive design
- meaningful interactions

Do not add complexity merely for visual novelty.

---

## Existing Codebase

Before modifying code:

1. Inspect the existing implementation.
2. Understand component relationships.
3. Understand existing state management.
4. Check existing dependencies.
5. Reuse existing utilities and components where possible.

Never rewrite working functionality without a concrete reason.

Prefer incremental improvements over unnecessary rewrites.

---

## Preserve Functionality

Do not break existing:

- navigation
- routing
- animations
- state
- project filtering
- modals
- audio controls
- contact functionality
- responsive behavior
- data structures

Any new feature must integrate with the existing architecture.

---

## Technology

Current stack:

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 3.4
- Framer Motion
- Three.js
- lucide-react
- clsx
- tailwind-merge
- canvas-confetti
- oxlint

Prefer existing technologies before introducing new dependencies.

---

## Dependency Policy

Do not install a dependency unless it provides meaningful value.

Before introducing a library:

- Check whether the project already solves the problem.
- Check compatibility with React 19 and Vite.
- Consider bundle size.
- Prefer mature, actively maintained libraries.
- Avoid duplicate libraries solving the same problem.

Never introduce unnecessary dependency sprawl.

---

## Code Quality

Use:

- TypeScript
- reusable components
- semantic HTML
- clear naming
- small focused components
- reusable utilities

Avoid:

- `any`
- duplicated code
- unnecessary abstractions
- giant components
- dead code
- console debugging statements
- unused imports

Never use `@ts-ignore` to hide problems unless absolutely necessary.

---

## Validation

After significant changes:

- run the TypeScript/build checks
- run the linter
- inspect console errors
- test desktop
- test mobile
- verify existing interactions
- verify animations
- verify accessibility

Do not consider a feature complete while obvious errors remain.

---

## Core Principle

Do not ask:

"How can I add more effects?"

Ask:

"How can I make this experience better?"

Prefer quality over quantity.