import { useEffect, useId, useMemo, useRef, useState } from "react"
import {
  findMetroRoute,
  LINE_BY_ID,
  METRO_LINES,
  METRO_STATIONS,
} from "../data/metro"
import { fetchLiveBuses, type LiveFleet } from "../lib/otd"
import { useDay } from "../state"

export function StationSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const root = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = METRO_STATIONS.find((s) => s.id === value)
  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return METRO_STATIONS
    return METRO_STATIONS.filter((s) => s.name.toLowerCase().includes(needle))
  }, [q])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div className={`pick${open ? " is-open" : ""}`} ref={root}>
      <span className="pick-label">{label}</span>
      <button
        type="button"
        className="pick-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setOpen((v) => !v)
          setQ("")
        }}
      >
        <b>{current?.name ?? "Station"}</b>
        <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="pick-menu" id={listId} role="listbox">
          <input
            className="pick-search"
            value={q}
            autoFocus
            placeholder="Search a station"
            onChange={(e) => setQ(e.target.value)}
            aria-label={`Search ${label} station`}
          />
          <ul>
            {hits.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={s.id === value}
                  className={s.id === value ? "is-on" : undefined}
                  onClick={() => {
                    onChange(s.id)
                    setOpen(false)
                  }}
                >
                  {s.name}
                </button>
              </li>
            ))}
            {hits.length === 0 && <li className="pick-empty">No station</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

export function Metro() {
  const { metroLine, setMetroLine, setShowMetro } = useDay()
  const [fromStation, setFromStation] = useState("qutab-minar")
  const [toStation, setToStation] = useState("chandni-chowk")
  const [fleet, setFleet] = useState<LiveFleet | null>(null)
  const [fleetErr, setFleetErr] = useState<string | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    fetchLiveBuses(ctrl.signal)
      .then(setFleet)
      .catch(() => setFleetErr("Buses are quiet right now."))
    return () => ctrl.abort()
  }, [])

  const ride = fromStation && toStation ? findMetroRoute(fromStation, toStation) : null

  return (
    <section className="chapter" id="metro">
      <p className="chapter-kicker">How I move</p>
      <h2>From here to there</h2>
      <p className="lede">Two stations. Time, fare, one change if there is one.</p>
      <p className="ride-live">
        {fleet
          ? `${fleet.moving} buses moving across ${fleet.routes} routes`
          : (fleetErr ?? "Reading the live bus feed…")}
      </p>

      <div className="ride from-right">
        <div className="ride-picks">
          <StationSelect label="Start" value={fromStation} onChange={setFromStation} />
          <button
            type="button"
            className="ride-flip"
            onClick={() => {
              setFromStation(toStation)
              setToStation(fromStation)
            }}
            aria-label="Swap stations"
          >
            ⇄
          </button>
          <StationSelect label="End" value={toStation} onChange={setToStation} />
        </div>

        {ride && (
          <div className="ticket">
            <div className="ticket-meta">
              <b>{ride.durationMin} min</b>
              <span>₹{ride.fare}</span>
              <span>
                {ride.interchanges.length
                  ? `Change at ${ride.interchanges.join(", ")}`
                  : "No change"}
              </span>
            </div>
            <ol className="ticket-line">
              {ride.stations.map((s) => (
                <li key={s.id}>
                  <i style={{ background: LINE_BY_ID[s.lines[0]]?.color }} />
                  {s.name}
                </li>
              ))}
            </ol>
            <a
              href="#map"
              className="btn ghost"
              onClick={() => {
                setShowMetro(true)
              }}
            >
              See it on the map
            </a>
          </div>
        )}
      </div>

      <div className="ride-lines" role="group" aria-label="Lines">
        <button
          className={`line-pill${metroLine == null || metroLine === "all" ? " is-on" : ""}`}
          onClick={() => {
            setMetroLine("all")
            setShowMetro(true)
          }}
        >
          All
        </button>
        {METRO_LINES.map((l) => (
          <button
            key={l.id}
            className={`line-pill${metroLine === l.id ? " is-on" : ""}`}
            onClick={() => {
              setMetroLine(l.id)
              setShowMetro(true)
            }}
          >
            <i style={{ background: l.color }} />
            {l.name.replace(" Line", "").replace(" Express", "")}
          </button>
        ))}
      </div>
    </section>
  )
}
