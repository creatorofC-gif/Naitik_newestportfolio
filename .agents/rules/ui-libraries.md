---
trigger: manual
---

# UI Library Rules

## General Principle

Use established libraries when they improve quality, accessibility or
development speed.

Do not reinvent complex UI primitives unnecessarily.

---

## shadcn/ui

Use shadcn/ui for polished interaction primitives when appropriate.

Preferred components:

- Dialog
- Drawer
- Sheet
- Tabs
- Tooltip
- Popover
- Command
- Accordion
- HoverCard
- DropdownMenu
- Select
- Button
- Badge
- Input
- Separator
- ScrollArea

---

## Styling shadcn

Never leave default shadcn styling unchanged.

Adapt components to the existing portfolio design:

- obsidian surfaces
- gold accents
- subtle borders
- technical styling
- restrained glow
- premium typography

shadcn should support the design system rather than replace it.

---

## Radix UI

Radix primitives may be used where appropriate.

Prefer accessible primitives over custom implementations of complex interactions.

---

## Icons

Use lucide-react as the primary icon library.

Do not introduce another icon library unless there is a specific requirement.

---

## Animation Libraries

Preferred:

- Framer Motion
- GSAP

Use each for the type of animation it handles best.

---

## 3D

Preferred:

- Three.js
- React Three Fiber
- Drei

---

## Utilities

Existing utilities:

- clsx
- tailwind-merge

Reuse them.

---

## Dependency Rule

Do not install multiple libraries that solve the same problem.

The dependency graph should remain intentional and understandable.