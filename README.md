# दिल्ली · Delhi

A one-page interactive companion to Delhi — cinematic, useful, and built on open data.

## Run

```bash
npm install
npm run dev
```

## What works

- **3D twin** — Three.js miniature of Delhi on a real east/+X north/−Z tangent plane. Orbit, zoom, click to fly. Day/night lighting.
- **MapLibre map** — pitched OSM, 3D building extrusion where the style allows, flyTo on the same coordinates
- **Curated Delhi** — 35+ real places (heritage, food, hidden, markets, nightlife) with metro, hours, tickets, and coordinates
- **Search & filters** — local index plus [Photon](https://photon.komoot.io/) / OpenStreetMap hits inside the NCT bbox
- **Map** — Leaflet + CARTO dark tiles, pins, metro layer, itinerary polyline
- **Routes** — [OSRM](https://project-osrm.org/) cab geometry for the day you build
- **Nearby** — [Overpass API](https://overpass-api.de/) around a selected pin
- **Weather & AQI** — [Open-Meteo](https://open-meteo.com/) for the city and for each place
- **Build my day** — mood + hours composer, presets (Shahjahanabad, Lutyens, sultanate south, garden tombs, night, food crawl), reorder, shareable `?day=` URL

No dummy buttons. If a public API is busy, the page says so and keeps the curated layer working.

## Stack

Vite · React 19 · TypeScript · GSAP ScrollTrigger · Framer Motion · Leaflet
