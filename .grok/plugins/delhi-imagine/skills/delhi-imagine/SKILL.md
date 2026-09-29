---
name: delhi-imagine
description: Image generation for the Delhi companion — landmark stills, jali textures, editorial crops. Use when generating or editing site images, Imagine tools, or /delhi-imagine.
---

# Delhi image generation

Load the `imagine` skill. Place files in `public/images/` with kebab-case ids matching `src/data/places.ts`.

- Named monuments: prefer `image_edit` from an existing still in `public/images/`.
- Invented textures (jali, grain, compass): `image_gen`, then CSS overlay — never as a fake photo of a real place.
- Aspect: 3:2 or 16:9 for place cards, 1:1 for tiles/patterns.
- No garbled signage. If text must be exact, set it in CSS over the image.
- After generating, copy into `public/images/` and point `places.ts` or CSS at the new path.
