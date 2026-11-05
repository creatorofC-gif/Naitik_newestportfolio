---
trigger: always_on
---

# Performance, Accessibility & Responsive Rules

## Performance

Performance is a first-class requirement.

Optimize:

- JavaScript
- images
- video
- 3D
- animations
- fonts

Use:

- lazy loading
- dynamic imports
- code splitting
- responsive images
- optimized media

---

## 3D

Heavy 3D scenes should be lazy-loaded.

Do not load expensive 3D assets before they are needed.

---

## Images

Prefer:

- AVIF
- WebP
- responsive images
- lazy loading

Avoid large uncompressed assets.

---

## Video

Use:

- compressed video
- poster images
- appropriate codecs

Avoid unnecessary large background videos.

---

## Accessibility

Every interactive element must support:

- keyboard navigation
- focus states
- semantic HTML
- appropriate ARIA labels
- readable contrast

Do not make important content dependent on animation.

---

## Reduced Motion

Respect:

prefers-reduced-motion

When enabled:

- reduce animation
- disable unnecessary parallax
- reduce particles
- simplify 3D
- shorten transitions

---

## Responsive Design

The portfolio must work across:

- mobile
- tablet
- laptop
- desktop
- large screens

Do not simply shrink desktop layouts.

Some interactions should have different mobile implementations.

---

## Mobile Principle

If an interaction is too complex for mobile:

simplify the interaction rather than forcing the desktop interaction onto mobile.

---

## Failure Handling

Optional features must fail gracefully.

If:

- WebGL fails
- video fails
- audio fails
- external asset fails

the rest of the portfolio must continue working.