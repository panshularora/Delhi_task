---
name: delhi-3d
description: Build and debug the NCT Delhi Three.js twin — geographic frames, landmarks, visibility, GLB mounts. Use when editing DelhiWorld, landmarks, geo3d, WebGL, 3D generation, or /delhi-3d.
---

# Delhi 3D twin

Read `src/lib/geo3d.ts` first. Frame is East=+X, Up=+Y, North=−Z. Camera yaw 0 sits on +Z looking −Z.

Then read `src/scene/DelhiWorld.ts`, `src/scene/landmarks.ts`, `src/scene/environment.ts`.

Rules:

- One geographic source: `project()` / `orbitOffset()`. Do not invent a second yaw formula.
- Keep the first 8 RAF frames painting even if IntersectionObserver says pause.
- Day lighting must stay readable (fog and asphalt cannot match).
- Canvas fills its parent; resize from parent client size; render after `setSize`.
- Mount generated GLBs with `threejs-frame-conventions` (asset front measured, then parent −Z).
- Live image→3D uses Open Higgsfield (Muapi) via `src/lib/higgsfield.ts`: isolate with nano-banana-2-edit, mesh with `tripo3d-h31-image-to-3d`, then `DelhiWorld.mountGenerated`. Key is `MUAPI_API_KEY` in `.env.local`, injected by the Vite `/muapi` proxy.
- Place generated meshes with `project(lat, lng)` and scale from `LANDMARK_HEIGHT_M` in `src/scene/glbMount.ts`.
- Do not remount `DelhiWorld` on hover, scroll, or night toggles.
