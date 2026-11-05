---
trigger: always_on
---

# Task Execution Rules

## Before Coding

For every non-trivial task:

1. Inspect relevant files.
2. Understand existing implementation.
3. Identify reusable components.
4. Identify existing dependencies.
5. Determine the smallest architectural change required.

Do not immediately start rewriting files.

---

## Before Installing Libraries

Explain internally:

- what problem the library solves
- why existing tools are insufficient
- where it will be used
- whether the dependency is justified

Do not add dependencies unnecessarily.

---

## Before Major UI Changes

Consider:

- desktop
- tablet
- mobile
- reduced motion
- accessibility
- performance

---

## Implementation

Prefer incremental implementation.

Build the simplest correct version first.

Then add:

1. visual refinement
2. animation
3. interaction
4. optimization

---

## Verification

After implementation:

- inspect the result
- fix TypeScript errors
- fix lint errors
- fix console errors
- verify responsive layout
- verify existing functionality
- verify animation behavior

---

## Existing Features

Never remove an existing feature simply because another implementation is easier.

If replacement is genuinely necessary:

preserve the original functionality and interaction intent.

---

## Final Quality Check

Before declaring completion ask:

- Does this look intentional?
- Does the interaction feel natural?
- Does it work on mobile?
- Does it remain accessible?
- Is the animation performant?
- Did I introduce unnecessary complexity?
- Did I break anything existing?

The objective is not merely to make the code work.

The objective is to make the portfolio feel finished.