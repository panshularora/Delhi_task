---
name: delhi-web
description: Improve the Delhi site web experience — layout grid, alignment, motion, a11y, uncluttered HUD. Use when the UI looks cluttered, misaligned, or when asked to polish the frontend, or /delhi-web.
---

# Delhi web experience

Tokens live in `src/index.css` `:root`. Do not invent a second system.

Layout:

- `--gutter` and `--rail` are the only horizontal measures. Nav, hero caption, chapters, footer share the same left edge.
- 8px spacing scale. No magic padding like 22/28/36 mixed in one row.
- Hero HUD is caption + ticks + telemetry. No glass card covering the 3D city.
- Mix-blend on the nav is forbidden; it misaligns perceived type.

Motion: `transform` and `opacity` only, `--ease`, honor `prefers-reduced-motion`.

A11y: focus-visible brass ring, skip link, 44px targets, contrast on bone/brass over ink.
