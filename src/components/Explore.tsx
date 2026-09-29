import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useRef, useState } from "react"
import { CATEGORY_META } from "../data/places"
import { DELHI, formatKm, haversineKm } from "../lib/geo"
import { ZONE_META, ZONES } from "../lib/zones"
import { useDay } from "../state"
import { CATEGORIES } from "../types"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export function Explore() {
  const {
    query,
    setQuery,
    category,
    setCategory,
    zone,
    setZone,
    filtered,
    openPlace,
    osmHits,
    searching,
    addStop,
    flyTo,
    userLoc,
    isSaved,
  } = useDay()
  const [keptOnly, setKeptOnly] = useState(false)
  const origin = userLoc ?? DELHI
  const pool = keptOnly ? filtered.filter((p) => isSaved(p.id)) : filtered
  const featured = pool[0]
  const rest = featured ? pool.filter((p) => p.id !== featured.id).slice(0, 2) : []
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const img = el.querySelector(".feature-card img")
      if (img) {
        gsap.fromTo(
          img,
          { scale: 1.14 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 80%", end: "bottom top", scrub: 0.6 },
          },
        )
      }
      gsap.from(".place-tile", {
        y: 24,
        opacity: 0,
        scale: 0.98,
        stagger: 0.1,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 72%" },
      })
      gsap.from(".feature-card", {
        y: 36,
        opacity: 0,
        duration: 0.9,
        ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 78%" },
      })
    },
    { scope: root, dependencies: [featured?.id] },
  )

  return (
    <section className="chapter" id="explore" ref={root}>
      <p className="chapter-kicker">search</p>
      <h2>FIND A CORNER</h2>
      <p className="lede">Hauz Khas, momos, a stepwell. Filter, then open it.</p>
      <div className="explore-bar">
        <div className="search">
          <label className="eyebrow" htmlFor="q">
            Search places
          </label>
          <input
            id="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qutub, paratha, Hauz Khas, dargah…"
          />
        </div>
        <div className="chips" role="tablist" aria-label="Categories">
          <button
            className={`chip${category === "all" ? " is-on" : ""}`}
            onClick={() => setCategory("all")}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`chip${category === c ? " is-on" : ""}`}
              onClick={() => setCategory(c)}
            >
              {CATEGORY_META[c].label}
            </button>
          ))}
        </div>
        <div className="chips" role="tablist" aria-label="Neighborhoods">
          <button
            className={`chip${zone === "all" ? " is-on" : ""}`}
            onClick={() => setZone("all")}
          >
            Whole city
          </button>
          {ZONES.map((z) => (
            <button
              key={z}
              className={`chip${zone === z ? " is-on" : ""}`}
              onClick={() => setZone(z)}
            >
              {ZONE_META[z].label}
            </button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Saved places">
          <button
            className={`chip${keptOnly ? " is-on" : ""}`}
            onClick={() => setKeptOnly((v) => !v)}
            aria-pressed={keptOnly}
          >
            Kept
          </button>
        </div>
      </div>
      {!featured ? (
        <p className="empty">
          {keptOnly
            ? "Nothing kept yet. Open a place and tap Keep this."
            : "No curated match. Try the OpenStreetMap hits below, or clear filters."}
        </p>
      ) : (
        <div className="spread">
          <button type="button" className="feature-card from-right" onClick={() => openPlace(featured.id)}>
            <img src={featured.image} alt={featured.name} />
            <div className="card-veil" />
            <div className="card-copy">
              <p className="meta">
                {CATEGORY_META[featured.category].label} · {featured.neighborhood} ·{" "}
                {formatKm(haversineKm(origin, featured))}
              </p>
              <h3>{featured.name}</h3>
              <p>{featured.blurb}</p>
            </div>
          </button>
          <div className="stack">
            {rest.map((p) => (
              <button type="button" key={p.id} className="place-tile from-right" onClick={() => openPlace(p.id)}>
                <img src={p.image} alt={p.name} />
                <div className="card-veil" />
                <div className="card-copy">
                  <p className="meta">
                    {CATEGORY_META[p.category].label} · {formatKm(haversineKm(origin, p))}
                  </p>
                  <h3>{p.name}</h3>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {(searching || osmHits.length > 0) && (
        <div className="osm-list">
          <p className="chapter-kicker">OpenStreetMap in Delhi</p>
          {searching && <p className="status">Searching the map…</p>}
          {osmHits.map((h) => (
            <button
              key={h.id}
              className="osm-row"
              onClick={() => {
                flyTo(h.lat, h.lng, 16)
                addStop({
                  id: h.id,
                  name: h.name,
                  lat: h.lat,
                  lng: h.lng,
                  durationMin: 40,
                  category: "custom",
                })
                document.getElementById("map")?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              <span>
                <strong>{h.name}</strong>
                <div className="status">{h.kind}</div>
              </span>
              <small>Add to day · {formatKm(haversineKm(origin, h))}</small>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
