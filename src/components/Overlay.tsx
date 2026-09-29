import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { CATEGORY_META, PLACES } from "../data/places"
import { HoverPeek } from "./HoverPeek"
import { Magnetic } from "./Magnetic"
import { fetchNearby, fetchWeather, weatherLabel } from "../lib/apis"
import { DELHI, estimateTravelMin, formatKm, haversineKm, placeToStop } from "../lib/geo"
import { useDay } from "../state"
import type { NearbyPoi, WeatherNow } from "../types"
import { Sculpt } from "./Sculpt"

const ease = [0.22, 1, 0.36, 1] as const

export function Overlay() {
  const {
    selected,
    closePlace,
    addStop,
    removeStop,
    inDay,
    toggleSave,
    isSaved,
    userLoc,
    itinerary,
    flyTo,
    openPlace,
  } = useDay()
  const [nearby, setNearby] = useState<NearbyPoi[] | null>(null)
  const [nearErr, setNearErr] = useState<string | null>(null)
  const [localWx, setLocalWx] = useState<WeatherNow | null>(null)

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePlace()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selected, closePlace])

  useEffect(() => {
    if (!selected) return
    const ctrl = new AbortController()
    setNearby(null)
    setNearErr(null)
    setLocalWx(null)
    fetchNearby(selected.lat, selected.lng, 900, ctrl.signal)
      .then(setNearby)
      .catch(() => setNearErr("Overpass is busy — curated neighbours below."))
    fetchWeather(selected.lat, selected.lng, ctrl.signal)
      .then(setLocalWx)
      .catch(() => setLocalWx(null))
    return () => ctrl.abort()
  }, [selected])

  const reduceMotion = useReducedMotion()
  const origin = userLoc ?? DELHI
  const last = itinerary[itinerary.length - 1]
  const fromYou = selected ? haversineKm(origin, selected) : 0
  const fromLast = selected && last ? estimateTravelMin(last, selected) : null
  const cousins = selected
    ? PLACES.filter((p) => p.id !== selected.id)
        .map((p) => ({ p, km: haversineKm(selected, p) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 4)
    : []

  return (
    <AnimatePresence>
      {selected && (
          <div className="overlay overlay-cine" role="dialog" aria-modal="true" aria-labelledby="place-title" data-lenis-prevent>
            <button
              type="button"
              className="overlay-scrim"
              aria-label="Close place"
              onClick={closePlace}
            />
            <AnimatePresence mode="wait">
            <motion.article
              key={selected.id}
              className="sheet cine-sheet"
              data-lenis-prevent
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0.85, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0.7, x: 56 }}
              transition={{ duration: 0.28, ease }}
              style={{ overflowY: "auto" }}
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <div className="sheet-media">
                <img src={selected.image} alt={selected.name} />
                <button className="close-x" onClick={closePlace} aria-label="Close">
                  ×
                </button>
              </div>
              <div className="sheet-body">
                <p className="chapter-kicker">
                  {CATEGORY_META[selected.category].label} · {selected.neighborhood}
                </p>
                <h2 id="place-title">{selected.name}</h2>
                <p>{selected.story}</p>
                <dl className="facts">
                  <div>
                    <dt>Hours</dt>
                    <dd>{selected.hours}</dd>
                  </div>
                  <div>
                    <dt>Ticket</dt>
                    <dd>
                      {selected.ticket} · {selected.cost}
                    </dd>
                  </div>
                  <div>
                    <dt>On site</dt>
                    <dd>{selected.durationMin} min · {selected.bestTime}</dd>
                  </div>
                  <div>
                    <dt>Metro</dt>
                    <dd>
                      {selected.metro.station} · {selected.metro.walkMin} min walk ·{" "}
                      {selected.metro.lines.join(" / ")}
                    </dd>
                  </div>
                  <div>
                    <dt>Distance</dt>
                    <dd>
                      {formatKm(fromYou)} from {userLoc ? "you" : "city centre"}
                    </dd>
                  </div>
                  <div>
                    <dt>Weather here</dt>
                    <dd>
                      {localWx
                        ? `${localWx.temp}° · ${weatherLabel(localWx.code)} · AQI ${localWx.aqi ?? "—"}`
                        : "Reading…"}
                    </dd>
                  </div>
                </dl>
                {fromLast && last && last.id !== selected.id && (
                  <p className="status">
                    From {last.name}: {fromLast.mode === "walk"
                      ? `walk ~${fromLast.walkMin} min`
                      : `metro/cab ~${fromLast.cabMin} min`}
                  </p>
                )}
                {selected.eat.length > 0 && (
                  <p>
                    <strong>Eat nearby. </strong>
                    {selected.eat.join(" · ")}
                  </p>
                )}
                {selected.tips.length > 0 && (
                  <p className="status">{selected.tips.join(" ")}</p>
                )}
                <div className="hero-cta" style={{ marginTop: 16 }}>
                  <Magnetic strength={0.22}>
                    {inDay(selected.id) ? (
                      <button className="btn ghost" onClick={() => removeStop(selected.id)}>
                        Remove from day
                      </button>
                    ) : (
                      <button className="btn" onClick={() => addStop(placeToStop(selected))}>
                        Add to day
                      </button>
                    )}
                  </Magnetic>
                  <Magnetic strength={0.22}>
                    <button
                      className={`btn ghost${isSaved(selected.id) ? " is-kept" : ""}`}
                      onClick={() => toggleSave(selected.id)}
                    >
                      {isSaved(selected.id) ? "Kept" : "Keep this"}
                    </button>
                  </Magnetic>
                  <Magnetic strength={0.22}>
                    <a
                      className="btn ghost"
                      href="#map"
                      onClick={() => {
                        flyTo(selected.lat, selected.lng, 16)
                        closePlace()
                      }}
                    >
                      Show on map
                    </a>
                  </Magnetic>
                </div>
                <Sculpt place={selected} />
                <div className="nearby">
                  <h3>Curated neighbours</h3>
                  {cousins.map(({ p, km }) => (
                    <HoverPeek key={p.id} src={p.image} alt={p.name}>
                      <button type="button" onClick={() => openPlace(p.id)}>
                        {p.name}
                        <span className="status"> · {formatKm(km)}</span>
                      </button>
                    </HoverPeek>
                  ))}
                  <h3>OpenStreetMap around this pin</h3>
                  {nearErr && <p className="status">{nearErr}</p>}
                  {nearby === null && !nearErr && <p className="status">Asking Overpass…</p>}
                  {nearby?.length === 0 && <p className="status">Quiet neighbourhood on OSM.</p>}
                  {nearby?.map((n) => (
                    <button
                      key={n.id}
                      onClick={() =>
                        addStop({
                          id: n.id,
                          name: n.name,
                          lat: n.lat,
                          lng: n.lng,
                          durationMin: 30,
                          category: "custom",
                        })
                      }
                    >
                      {n.name}
                      <span className="status">
                        {" "}
                        · {n.kind} · {formatKm(n.distKm)} · add
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.article>
            </AnimatePresence>
          </div>
      )}
    </AnimatePresence>
  )
}
