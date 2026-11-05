---
trigger: manual
---

# Animation & Motion Rules

## Philosophy

Animation must communicate hierarchy, interaction or state.

Do not animate something simply because it can be animated.

Prefer:

- smooth
- cinematic
- restrained
- intentional
- responsive

motion.

---

## Framer Motion

Use Framer Motion for:

- component entrances
- hover interactions
- modal transitions
- layout animations
- staggered content
- expand/collapse
- shared layout transitions

---

## GSAP

GSAP may be introduced for:

- complex timelines
- scroll storytelling
- pinned sections
- SVG path animations
- advanced parallax
- multi-stage sequences
- morphing animations

Do not use GSAP for trivial animations that CSS or Framer Motion handles well.

---

## Lenis

Lenis may be used for smooth scrolling.

Only use one global smooth-scroll system.

Do not combine multiple scrolling engines.

---

## Scroll Animations

Use scrolling to reveal:

- architecture
- projects
- timelines
- system relationships
- technical details

Do not animate every element independently.

---

## Micro-interactions

Interactive elements should respond to:

- hover
- click
- focus
- active
- loading

Examples:

buttons → subtle movement

cards → subtle elevation

navigation → active indicator

architecture nodes → highlighting

---

## Animation Performance

Prefer animating:

- transform
- opacity

Avoid continuously animating:

- width
- height
- top
- left
- margin
- padding

unless necessary.

---

## Animation Restraint

Avoid:

- excessive bouncing
- constant spinning
- aggressive zooming
- infinite unnecessary animations
- excessive particle effects

One excellent animation is better than ten mediocre ones.