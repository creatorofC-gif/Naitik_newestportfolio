---
trigger: manual
---

# 3D & Interactive Graphics Rules

## 3D Philosophy

3D should communicate technology, architecture or systems.

Do not use 3D merely as decoration.

---

## Preferred Stack

When appropriate, use:

- Three.js
- React Three Fiber
- @react-three/drei

Prefer React Three Fiber when integrating Three.js with React.

---

## Drei

Use Drei utilities when they simplify implementation.

Potential utilities:

- Float
- Environment
- Text
- Html
- OrbitControls
- PerspectiveCamera
- ContactShadows
- Sparkles
- Stars
- MeshTransmissionMaterial

---

## Architecture Visualization

The ArchitectureDrawer is an important interactive feature.

It may use:

- React Three Fiber
- Three.js
- SVG
- Canvas
- GSAP
- Framer Motion

Potential interactions:

- node highlighting
- animated data flow
- hover inspection
- zoom
- pan
- connection highlighting
- layer filtering

---

## 3D Performance

Avoid:

- unnecessarily high-poly models
- huge textures
- excessive lights
- excessive particles
- expensive post-processing

Prefer:

- low-poly geometry
- instancing
- compressed textures
- lazy loading
- conditional rendering
- device-aware quality

---

## WebGL Fallback

3D must never be required for core content.

If WebGL is unavailable:

provide:

- SVG
- CSS
- Canvas
- static visualization

depending on the feature.

---

## Mobile

Reduce 3D complexity on mobile.

Potentially reduce:

- particle count
- geometry
- lighting
- post-processing
- animation frequency

Do not simply scale down desktop 3D.

Design a mobile-appropriate interaction.

---

## Reduced Motion

Respect prefers-reduced-motion.

Reduce or disable:

- continuous camera movement
- particles
- parallax
- excessive object movement