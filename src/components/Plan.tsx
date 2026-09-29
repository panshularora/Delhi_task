import { useEffect, useMemo, useState } from "react"
import { METRO_STATIONS } from "../data/metro"
import { PLACES, PRESETS } from "../data/places"
import { composeDay } from "../lib/compose"
import { DELHI, estimateTravelMin, formatMin, placeToStop } from "../lib/geo"
import { useDay } from "../state"
import type { Category } from "../types"
import { Magnetic } from "./Magnetic"

const INTENTS: { id: string; label: string; line: string; cats: Category[] }[] = [
  { id: "chaotic", label: "Chaotic", line: "galis, markets, night", cats: ["hidden", "market", "nightlife", "food"] },
  { id: "chill", label: "Chill", line: "gardens, tombs, slow", cats: ["heritage", "hidden", "experience"] },
  { id: "foodie", label: "Foodie", line: "paratha to jalebi", cats: ["food", "market"] },
  { id: "culture", label: "Culture", line: "forts, stepwells", cats: ["heritage", "experience"] },
  { id: "night", label: "Night out", line: "cp, hauz, last train", cats: ["nightlife", "food", "experience"] },
]

export function Plan() {
  const {
    itinerary,
    setItinerary,
    removeStop,
    moveStop,
    openPlace,
    route,
    routeErr,
    userLoc,
    requestLoc,
    locLabel,
  } = useDay()
  const [intent, setIntent] = useState<(typeof INTENTS)[number]["id"]>("foodie")
  const moods = INTENTS.find((m) => m.id === intent)?.cats ?? ["food"]
  const [hours, setHours] = useState(6)
  const [startId, setStartId] = useState("rajiv-chowk")
  const [live, setLive] = useState(false)

  const start = useMemo(() => {
    if (startId === "me") return userLoc ?? DELHI
    const st = METRO_STATIONS.find((s) => s.id === startId)
    return st ? { lat: st.lat, lng: st.lng } : DELHI
  }, [startId, userLoc])

  const legs = itinerary.slice(1).map((s, i) => {
    const from = itinerary[i]
    const est = estimateTravelMin(from, s)
    return { ...est, from, to: s }
  })

  const visitMin = itinerary.reduce((n, s) => n + s.durationMin, 0)
  const travelMin = route
    ? route.durationMin
    : legs.reduce((n, l) => n + (l.mode === "walk" ? l.walkMin : l.cabMin), 0)

  function compose() {
    const day = composeDay({ moods, hours, start, places: PLACES })
    setItinerary(day)
  }

  useEffect(() => {
    if (!live) return
    const t = window.setTimeout(() => {
      const cats = INTENTS.find((m) => m.id === intent)?.cats ?? ["food"]
      const day = composeDay({ moods: cats, hours, start, places: PLACES })
      setItinerary(day)
    }, 180)
    return () => window.clearTimeout(t)
  }, [live, intent, hours, start, setItinerary])

  async function copyDay() {
    const lines = itinerary.map((s, i) => `${i + 1}. ${s.name}`).join("\n")
    const extra = route
      ? `\nCab route ~${route.distanceKm.toFixed(1)} km, ${Math.round(route.durationMin)} min (OSRM)`
      : ""
    const text = `Delhi day · ${hours}h intent\n${lines}${extra}\n${window.location.href}`
    await navigator.clipboard.writeText(text)
  }

  return (
    <section className="chapter" id="plan">
      <p className="chapter-kicker">A day</p>
      <h2>What I'm doing</h2>
      <p className="lede">Mood, hours, start — the day rebuilds as you move the sliders. Or steal a loop I actually walk.</p>
      <div className="plan-grid from-right">
        <div>
          <p className="chapter-kicker">Ready-made</p>
          <div className="presets">
            {PRESETS.map((pr) => (
              <button
                key={pr.id}
                className="preset"
                onClick={() => {
                  setLive(false)
                  const stops = pr.ids
                    .map((id) => PLACES.find((p) => p.id === id))
                    .filter((p): p is NonNullable<typeof p> => Boolean(p))
                    .map(placeToStop)
                  setItinerary(stops)
                }}
              >
                <h3>{pr.name}</h3>
                <p>
                  ~{pr.hours} h · {pr.blurb}
                </p>
              </button>
            ))}
          </div>
        </div>
        <div className="composer">
          <div className="field">
            <label>Mood</label>
            <div className="moods">
              {INTENTS.map((m) => (
                <button
                  key={m.id}
                  className={`chip${intent === m.id ? " is-on" : ""}`}
                  onClick={() => {
                    setIntent(m.id)
                    setLive(true)
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="status">{INTENTS.find((m) => m.id === intent)?.line}</p>
          </div>
          <div className="field">
            <label>
              Hours on the ground · {hours}h
            </label>
            <input
              className="hours"
              type="range"
              min={3}
              max={12}
              value={hours}
              onChange={(e) => {
                setHours(Number(e.target.value))
                setLive(true)
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="start">Start from</label>
            <select
              id="start"
              value={startId}
              onChange={(e) => {
                setStartId(e.target.value)
                setLive(true)
              }}
            >
              <option value="me">My location ({locLabel})</option>
              {METRO_STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} Metro
                </option>
              ))}
            </select>
          </div>
          <div className="hero-cta">
            <Magnetic strength={0.28}>
              <button
                className="btn"
                onClick={() => {
                  setLive(true)
                  compose()
                }}
              >
                Compose this day
              </button>
            </Magnetic>
            <button
              className={`btn ghost${live ? " is-kept" : ""}`}
              onClick={() => setLive((v) => !v)}
            >
              {live ? "Live on" : "Live off"}
            </button>
            <button className="btn ghost" onClick={requestLoc}>
              Locate me
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                setLive(false)
                setItinerary([])
              }}
            >
              Clear
            </button>
            <button className="btn ghost" onClick={() => void copyDay()} disabled={!itinerary.length}>
              Copy / share
            </button>
          </div>
          <div className="totals">
            <span>{itinerary.length} stops</span>
            <span>Visit {formatMin(visitMin)}</span>
            <span>Travel {formatMin(travelMin)}</span>
            <span>Total {formatMin(visitMin + travelMin)}</span>
            {routeErr && <span className="status">{routeErr}</span>}
            {route && !routeErr && (
              <span className="status">OSRM {route.distanceKm.toFixed(1)} km</span>
            )}
          </div>
          {itinerary.length === 0 ? (
            <p className="empty">Your day is empty. Compose, pick a preset, or add from any card.</p>
          ) : (
            <ol className="day-list">
              {itinerary.map((s, i) => (
                <li key={s.id}>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h4>
                      <button
                        type="button"
                        onClick={() => {
                          if (s.category !== "custom") openPlace(s.id)
                        }}
                      >
                        {s.name}
                      </button>
                    </h4>
                    <div className="status">
                      {s.durationMin} min on site
                      {s.metro ? ` · ${s.metro}` : ""}
                    </div>
                  </div>
                  <div className="icon-btns">
                    <button aria-label="Move up" onClick={() => moveStop(s.id, -1)}>
                      ↑
                    </button>
                    <button aria-label="Move down" onClick={() => moveStop(s.id, 1)}>
                      ↓
                    </button>
                    <button aria-label="Remove" onClick={() => removeStop(s.id)}>
                      ×
                    </button>
                  </div>
                  {legs[i] && (
                    <div className="leg">
                      {legs[i].mode === "walk"
                        ? `Walk ~${legs[i].walkMin} min`
                        : `Metro / cab ~${legs[i].cabMin} min · walk would be ${legs[i].walkMin} min`}
                      {route && i === 0 ? " · OSRM cab line on the map" : ""}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  )
}
