# IMPORTANT — SECOND DESIGN PASS REQUIRED

The previous implementation successfully updated the portfolio content to my
real profile, but it did NOT achieve the intended visual/UX redesign.

The current result still looks substantially like the original template.

I do NOT want another content-only or conservative refinement pass.

I want a genuine visual and interaction redesign while preserving the
existing React architecture and real portfolio data.

The screenshots from the previous implementation are the current state.

---

# CORE PROBLEM

The current website still follows this repetitive visual structure:

dark grid
→ centered eyebrow
→ centered heading
→ centered subtitle
→ category pills
→ large centered card
→ large empty vertical space
→ next section

This pattern is repeated too heavily.

The result currently feels like a polished template rather than a distinctive
developer portfolio.

Changing:

"Alex Morgan"
→ "Naitik Gupta"

is NOT a redesign.

Changing section titles is NOT a redesign.

Changing card text is NOT a redesign.

The next implementation must visibly change:

- composition
- visual hierarchy
- spatial relationships
- interaction design
- animation
- section transitions
- card behavior
- technical visualizations
- responsive behavior

---

# DESIGN DIRECTION

The portfolio should feel like:

"An interactive engineering workspace belonging to a real developer."

Think:

- developer workstation
- engineering notebook
- blueprint
- technical schematic
- code workspace
- system map
- interactive project lab

NOT:

- generic SaaS landing page
- enterprise consulting website
- fake senior architect portfolio
- dashboard
- collection of centered cards

The existing obsidian + gold palette can remain.

The composition must evolve significantly.

---

# DO NOT CHANGE THE ENTIRE BRAND

Keep:

- obsidian background
- gold accent
- blueprint grid
- technical typography
- LightSwitchIntro
- floating avatar concept

But redesign how these elements are composed.

The goal is NOT to throw away the visual identity.

The goal is to make the identity much more distinctive.

---

# 1. REDESIGN THE SKILLS SECTION

The current Skills section is still too much like a standard carousel.

Current structure:

Heading
↓
description
↓
category pills
↓
large card
↓
progress bar
↓
dots

This must change.

## Remove this completely:

"Relative Proficiency"

and the horizontal progress bar.

The current screenshot still shows this, despite the implementation plan explicitly
prohibiting percentage/mastery-style visualization.

Do not represent proficiency with arbitrary numerical or visual percentages.

---

## New Skills Experience

Transform the section into an interactive **Technology Constellation / Engineering Stack Map**.

Use the actual skills from profileData.ts.

Example visual structure:

                    React
                      │
             ┌────────┼────────┐
             │        │        │
        TypeScript  Tailwind  Angular
             │                 │
        React Native         HTML/CSS
             │
         Projects

The exact relationships must be based only on real data.

Possible UI:

- central technology
- connected technologies
- category filtering
- hover node expansion
- animated connection lines
- technology metadata
- project association where data exists

Use:

SVG + Framer Motion

Do NOT use 3D unless it materially improves this visualization.

---

## Skill Interaction

When hovering a technology:

- highlight the node
- illuminate relevant connections
- reveal a compact information panel
- show category
- show actual experience descriptor

For example:

React.js

Frontend
Fundamentals

Do NOT show:

95%
80%
65%

Do NOT show:

"Relative Proficiency"

---

# 2. REDESIGN THE PROJECT WHITEBOARD

The current whiteboard is still too much like:

"large section + one card."

That is not enough.

This should become one of the portfolio's signature interactions.

Create the feeling of an actual engineering workspace.

Instead of a single large card floating in empty space:

Create a blueprint/workbench composition.

For example:

┌───────────────────────────────────────────────────────┐
│ ENGINEERING WORKSPACE                         01/01   │
│                                                       │
│       ┌───────────────┐                               │
│       │   MEMORIES    │──── React Native              │
│       │               │──── Expo                      │
│       └───────┬───────┘                               │
│               │                                       │
│          Mobile App                                    │
│               │                                       │
│       ┌───────▼────────┐                               │
│       │ Secure Media  │                               │
│       │ Architecture  │                               │
│       └───────────────┘                               │
│                                                       │
│     TECHNICAL NOTES                                   │
│     Android • Expo • React Native                     │
└───────────────────────────────────────────────────────┘

Do NOT invent architecture that does not exist in profileData.ts.

The diagram should use only real project information.

---

# 3. REDUCE EMPTY SPACE

The current screenshot has excessive empty vertical space.

For example:

Skills card
↓
large empty area
↓
Project heading

This makes the website feel unfinished.

Reduce vertical whitespace while maintaining breathing room.

Every large blank area should have a deliberate reason.

Create stronger visual continuity between sections.

---

# 4. STOP CENTERING EVERYTHING

The current site centers almost every major element.

Introduce asymmetric composition.

Examples:

Hero:

left:
text/content

right:
visual/workspace

Skills:

left:
technology navigation

right:
interactive constellation

Projects:

large blueprint canvas

Experience:

timeline composition

Contact:

asymmetric contact + information layout

Not every section should use:

max-width
+
centered heading
+
centered card.

---

# 5. SECTION TRANSITIONS MUST BECOME PART OF THE EXPERIENCE

Currently sections feel like separate landing-page blocks.

Make them visually connect.

Examples:

Hero
↓
technical grid lines travel downward
↓
Skills nodes appear
↓
connections transform into project blueprint
↓
blueprint transitions into experience timeline
↓
timeline collapses into contact

Use Framer Motion and SVG.

The transitions should be subtle but visible.

---

# 6. HERO NEEDS A REAL VISUAL COMPOSITION

Do not make the hero simply:

centered text
+
background video.

Use the existing video but create a stronger foreground composition.

Possible layout:

LEFT

NAITIK GUPTA

Computer Engineering Student
Frontend & Mobile Developer

short description

[ Explore Work ]
[ Resume ]

RIGHT

interactive developer workspace / technical overlay

Possible elements:

- terminal panel
- small system diagram
- technology indicators
- animated cursor
- blueprint lines
- subtle code fragments

These must remain secondary to the actual identity and CTA.

Do NOT create fake system metrics.

---

# 7. MAKE THE FLOATING AVATAR ACTUALLY USEFUL

The avatar currently behaves mostly as a floating decoration/menu.

Make it context-aware.

As the user moves through the page:

Hero:
"01 / INTRO"

Skills:
"02 / STACK"

Projects:
"03 / WORK"

Technical:
"04 / SYSTEMS"

Experience:
"05 / EXPERIENCE"

Contact:
"06 / CONNECT"

The menu can remain available on interaction.

The avatar should feel like a persistent navigation companion.

Do not make it constantly animate.

---

# 8. TECHNICAL HIGHLIGHTS MUST FEEL TECHNICAL

The Technical Highlights section should not become another three-card layout.

Use the approved progressive architecture:

BASE
SVG/CSS blueprint

↓

INTERACTION
Framer Motion

↓

OPTIONAL DESKTOP ENHANCEMENT
React Three Fiber + Drei

↓

MOBILE
2D SVG/CSS

The visualization should feel like a technical schematic.

Use:

- nodes
- connections
- directional flow
- labels
- system boundaries
- animated data flow

Only use information supported by profileData.ts.

---

# 9. EXPERIENCE SHOULD NOT LOOK LIKE AN ENTERPRISE EXECUTIVE RESUME

The current visual language still has traces of the previous fake "senior architect"
persona.

The experience section should communicate:

student
+
internship
+
projects
+
practical engineering experience

not:

executive architect
+
enterprise SLA
+
corporate leadership dashboard.

Use real experience only.

Make the timeline visually interesting through interaction rather than inflated
metrics.

Possible interaction:

timeline node selected
→ card expands
→ technologies appear
→ project/work details reveal

---

# 10. CONTACT SHOULD BE SIMPLE

Do not over-engineer the contact section.

Use:

Let's Build Something

short explanation

email
GitHub
LinkedIn

contact form

Use shadcn Dialog/Input/Textarea/Button if useful.

Make the interaction polished rather than visually complicated.

---

# 11. USE SHADCN WHERE IT ACTUALLY HELPS

Use shadcn/ui for:

- Dialog
- Drawer
- Tooltip
- Tabs
- Accordion
- Input
- Textarea
- Button

Do not use shadcn to replace the entire visual system.

Customize everything to the existing obsidian/gold design.

---

# 12. ANIMATION MUST BE NOTICEABLE BUT RESTRAINED

The previous implementation is too static.

Add meaningful animation to:

- hero entrance
- technology nodes
- skill connections
- project blueprint
- timeline progression
- section transitions
- modal opening
- avatar context changes

Use Framer Motion.

Do NOT install GSAP.

Animations should be noticeable enough that a visitor recognizes that the
website is interactive.

But do not create constant movement everywhere.

---

# 13. RESPONSIVE DESIGN

Do not simply scale the desktop design down.

Desktop:

complex blueprint
asymmetric layout
interactive nodes
optional R3F

Mobile:

simplified blueprint
touch-friendly interactions
compact navigation
reduced animation

The mobile version should feel deliberately designed.

---

# 14. VISUAL HIERARCHY

Every section should have one dominant visual idea.

Do not use:

heading
subtitle
card
heading
subtitle
card

repeatedly.

Use different compositions:

Hero
→ workspace

Skills
→ constellation

Projects
→ blueprint

Technical
→ system diagram

Experience
→ timeline

Contact
→ communication terminal / clean form

This creates visual rhythm.

---

# 15. PERFORMANCE

Keep all existing performance rules.

Do not add expensive effects simply to make the redesign more noticeable.

Use:

- transform
- opacity
- SVG
- Framer Motion
- lazy-loaded 3D
- responsive assets

Respect prefers-reduced-motion.

---

# 16. IMPORTANT IMPLEMENTATION BEHAVIOR

Before modifying each section:

1. Inspect its current implementation.
2. Identify what currently works.
3. Preserve functional behavior.
4. Redesign the composition.
5. Implement interaction.
6. Test responsive behavior.

Do not merely rename headings and replace text.

---

# 17. DEFINITION OF "DONE"

The redesign is NOT complete if the result only changes:

- name
- title
- descriptions
- projects
- colors
- labels

The redesign IS complete when a visitor can visually distinguish the new
experience from the previous screenshot.

Specifically, after implementation:

### Skills

Must no longer look like a simple centered carousel card.

### Projects

Must feel like an actual interactive engineering workspace.

### Technical

Must contain an actual technical visualization.

### Experience

Must have meaningful timeline interaction.

### Hero

Must have stronger foreground composition.

### Sections

Must have noticeably improved visual continuity.

### Overall

The site must feel like one coherent interactive developer environment.

---

# FINAL INSTRUCTION

Do not interpret "preserve existing functionality" as "preserve the existing
visual layout."

Preserve functionality.

Redesign the presentation.

Do not make the minimum possible changes.

Make meaningful, visible improvements while staying within the established
rules and real profile data.

Before declaring completion, compare the implementation against the previous
screenshot and verify that the visual experience is materially different.