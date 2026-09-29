# Landmark GLBs

Original PBR meshes authored for this scene (`scripts/build_landmarks.py`). Metres, Y-up, facade toward +Z. Albedo atlases combine a generated ashlar map with isolated monument stills.

## Generators researched, not used

| Source | License | Why it was not shipped |
| --- | --- | --- |
| Hunyuan3D-2.1 | Tencent Hunyuan (open weights) | Shape+paint needs ~10–21 GB VRAM. This machine is an RTX 3050 Laptop 6 GB. |
| TRELLIS.2 | MIT | Same VRAM class; local run is not viable here. |
| Hunyuan3D-1 | Tencent | Superseded; still too heavy for 6 GB. |
| grok-imagine-3d | session-billed | API returns `Zero Data Retention teams do not have access to deferred endpoints`. |
| Muapi / Tripo3D | vendor | `/__muapi/status` is `ready: false` (no `MUAPI_API_KEY`). |

## Sketchfab / Thingiverse considered (not downloaded)

Download APIs required a login; none of these files are in the repo.

- India Gate, yongtun — CC BY, 28k tris, Sketchfab `257b34e82f0a4df98b0b855c3982fc54`
- Lotus Temple, KaitlynM — CC BY, 112k tris, `bf5edd0ef1a74bc3be8c2a52ac2f0362`
- Qutub Minar, popingo — CC BY, 19.5k tris, `8777afc0c80549d1abb7c0f28832bb4b`
- Red Fort, vfx_review — CC BY, 969k tris (too heavy unoptimized)
- Lotus Temple, dodo2000 — CC BY-SA, Thingiverse `935541`
- India Gate, J3Ddesigns — CC BY-SA, Thingiverse `2504137` (3D Warehouse remix)

Poly Haven CC0 was used as a materials reference (ashlar sandstone / marble roughness), not as mesh geometry.
