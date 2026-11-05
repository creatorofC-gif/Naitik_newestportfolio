---
trigger: always_on
---

# React Architecture Rules

## Components

Build reusable, focused React components.

Components should have a clear responsibility.

Avoid components that simultaneously contain:

- complex UI
- data
- animation logic
- business logic
- utility functions

Extract responsibilities when complexity increases.

---

## Data

Portfolio information must remain data-driven.

Primary source:

src/data/profileData.ts

Do not duplicate portfolio content inside JSX.

Projects, skills, experience and architecture information should come from
typed data structures.

---

## TypeScript

Use strict TypeScript.

Prefer:

- interfaces
- type aliases
- generics
- discriminated unions
- explicit component props

Avoid `any`.

Do not suppress TypeScript errors without justification.

---

## State

Prefer:

1. local React state
2. shared context when genuinely necessary
3. external state management only when complexity requires it

Do not introduce Redux/Zustand/etc. for simple state.

---

## Hooks

Create custom hooks when behavior is reused.

Examples:

- useScrollProgress
- useMousePosition
- useReducedMotion
- useMediaQuery
- useIntersectionObserver

Do not create hooks for trivial logic.

---

## Component Reuse

Before creating a new component:

Check whether an existing component can be reused or extended.

Avoid duplicate components with nearly identical behavior.

---

## File Organization

Keep the existing structure unless the project complexity genuinely requires
reorganization.

Do not reorganize the entire repository for cosmetic reasons.

---

## React Performance

Avoid unnecessary:

- state updates
- re-renders
- effects
- context updates

Use memoization only when it provides measurable or meaningful value.

Do not blindly add `useMemo` and `useCallback` everywhere.