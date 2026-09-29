import * as maplibregl from "maplibre-gl"
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useEffect, useRef, useState } from "react"
import {
  findMetroRoute,
  getMetroLinesGeoJSON,
  getMetroStationsGeoJSON,
  METRO_LINES,
} from "../data/metro"
import { CATEGORY_META } from "../data/places"
import { DELHI, formatKm, haversineKm } from "../lib/geo"
import { ZONE_META, ZONES } from "../lib/zones"
import { busesToGeoJSON, fetchLiveBuses, type LiveFleet } from "../lib/otd"
import { useDay } from "../state"
import type { Place } from "../types"
import { HoverPeek } from "./HoverPeek"
import { StationSelect } from "./Metro"

const SATELLITE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    base: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "&copy; Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "base-layer", type: "raster", source: "base" }],
}

const BOUNDS: maplibregl.LngLatBoundsLike = [
  [76.82, 28.38],
  [77.42, 28.92],
]

export default function DelhiMap() {
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])
  const [metroStart, setMetroStart] = useState("qutab-minar")
  const [metroEnd, setMetroEnd] = useState("chandni-chowk")
  const [metroJourney, setMetroJourney] = useState<ReturnType<typeof findMetroRoute>>(null)
  const [activeTab, setActiveTab] = useState<"places" | "metro">("places")
  const [showBuses, setShowBuses] = useState(true)
  const [fleet, setFleet] = useState<LiveFleet | null>(null)
  const [fleetErr, setFleetErr] = useState<string | null>(null)

  const {
    filtered,
    openPlace,
    selected,
    itinerary,
    route,
    routeErr,
    requestLoc,
    locLabel,
    showMetro,
    setShowMetro,
    metroLine,
    setMetroLine,
    mapTarget,
    inDay,
    zone,
    setZone,
    isNight,
  } = useDay()

  // Initialize MapLibre
  useEffect(() => {
    const el = host.current
    if (!el) return
    const map = new maplibregl.Map({
      container: el,
      style: SATELLITE,
      center: [DELHI.lng, DELHI.lat],
      zoom: 12.2,
      pitch: 52,
      bearing: -15,
      maxBounds: BOUNDS,
      minZoom: 9.5,
      maxZoom: 18,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right")

    map.on("load", () => {
      setupMapLayers(map, showMetro, metroLine)
    })

    mapRef.current = map
    return () => {
      markers.current.forEach((m) => m.remove())
      markers.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update Metro layers when line filter or visibility changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const linesSrc = map.getSource("delhi-metro-lines") as GeoJSONSource | undefined
    if (linesSrc) {
      linesSrc.setData(getMetroLinesGeoJSON(showMetro ? metroLine : "none") as Parameters<GeoJSONSource["setData"]>[0])
    }

    const stSrc = map.getSource("delhi-metro-stations") as GeoJSONSource | undefined
    if (stSrc) {
      stSrc.setData(getMetroStationsGeoJSON(showMetro ? metroLine : "none") as Parameters<GeoJSONSource["setData"]>[0])
    }
  }, [showMetro, metroLine])

  // Calculate Metro Journey Route
  useEffect(() => {
    if (!metroStart || !metroEnd) {
      setMetroJourney(null)
      return
    }
    const res = findMetroRoute(metroStart, metroEnd)
    setMetroJourney(res)

    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const jSrc = map.getSource("metro-journey-route") as GeoJSONSource | undefined
    if (jSrc) {
      jSrc.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: res?.coords ?? [],
        },
      })
    }
  }, [metroStart, metroEnd])

  // Markers for Curated Places
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markers.current.forEach((m) => m.remove())
    markers.current = []

    for (const place of filtered) {
      const pin = document.createElement("button")
      pin.type = "button"
      pin.className =
        "map3d-pin" +
        (selected?.id === place.id ? " is-on" : "") +
        (inDay(place.id) ? " is-day" : "")
      pin.title = place.name
      pin.addEventListener("click", (e) => {
        e.stopPropagation()
        openPlace(place.id)
      })
      const marker = new maplibregl.Marker({ element: pin, anchor: "bottom" })
        .setLngLat([place.lng, place.lat])
        .addTo(map)
      markers.current.push(marker)
    }
  }, [filtered, selected, openPlace, inDay])

  useEffect(() => {
    let alive = true
    const pull = () => {
      fetchLiveBuses()
        .then((data) => {
          if (!alive) return
          setFleet(data)
          setFleetErr(null)
          const map = mapRef.current
          if (!map?.isStyleLoaded()) return
          const src = map.getSource("otd-buses") as GeoJSONSource | undefined
          src?.setData(busesToGeoJSON(showBuses ? data.buses : []))
        })
        .catch(() => {
          if (alive) setFleetErr("Open Transit Data is quiet right now.")
        })
    }
    pull()
    const id = window.setInterval(pull, 25000)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [showBuses])

  // Fly to Target Place or Coordinates
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapTarget) return
    map.flyTo({
      center: [mapTarget.lng, mapTarget.lat],
      zoom: Math.max(mapTarget.zoom, 15),
      pitch: 58,
      bearing: -12,
      duration: 1400,
      essential: true,
    })
  }, [mapTarget])

  // Draw itinerary line in, point by point
  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    const line = route?.geometry?.map(([lat, lng]) => [lng, lat]) ?? itinerary.map((s) => [s.lng, s.lat])
    const src = map.getSource("day-route") as GeoJSONSource | undefined
    if (!src) return
    if (line.length < 2) {
      src.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] },
      })
      return
    }
    let i = 2
    let raf = 0
    const step = () => {
      src.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: line.slice(0, i) },
      })
      i += Math.max(1, Math.ceil(line.length / 48))
      if (i <= line.length) raf = window.requestAnimationFrame(step)
    }
    raf = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(raf)
  }, [route, itinerary])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selected) return
    const popup = new maplibregl.Popup({
      offset: 22,
      closeButton: false,
      className: "geo-card",
      maxWidth: "200px",
    })
      .setLngLat([selected.lng, selected.lat])
      .setHTML(
        `<img src="${escAttr(selected.image)}" alt=""><strong>${escHtml(selected.name)}</strong><em>${escHtml(selected.kicker)}</em>`,
      )
      .addTo(map)
    return () => {
      popup.remove()
    }
  }, [selected])

  const flyToMetroJourney = () => {
    const map = mapRef.current
    if (!map || !metroJourney || metroJourney.coords.length === 0) return
    const bounds = new maplibregl.LngLatBounds()
    for (const [lng, lat] of metroJourney.coords) {
      bounds.extend([lng, lat])
    }
    map.fitBounds(bounds, { padding: 60, pitch: 48, duration: 1600 })
  }

  return (
    <section className="chapter" id="map">
      <p className="chapter-kicker">The map</p>
      <h2>Where I am</h2>
      <p className="lede">Satellite. Places. Live buses. Tap a name to open it.</p>

      <div className="map-shell map-shell-3d from-right">
        <aside className="map-side">
          {/* Tabs: Curated Places vs Metro Planner */}
          <div className="map-tabs">
            <button
              type="button"
              className={`map-tab-btn${activeTab === "places" ? " is-active" : ""}`}
              onClick={() => setActiveTab("places")}
            >
              Places ({filtered.length})
            </button>
            <button
              type="button"
              className={`map-tab-btn${activeTab === "metro" ? " is-active" : ""}`}
              onClick={() => {
                setActiveTab("metro")
                setShowMetro(true)
              }}
            >
              Ride
            </button>
          </div>

          {/* Map Controls Top */}
          <div className="map-tools">
            <button type="button" className="chip" onClick={requestLoc}>
              Me
            </button>
            <button
              type="button"
              className={`chip${showMetro ? " is-on" : ""}`}
              onClick={() => setShowMetro(!showMetro)}
            >
              Metro {showMetro ? "on" : "off"}
            </button>
            <button
              type="button"
              className={`chip${showBuses ? " is-on" : ""}`}
              onClick={() => setShowBuses((v) => !v)}
            >
              Buses {showBuses ? "on" : "off"}
            </button>
          </div>
          <p className="otd-live-line">
            {fleet
              ? `${fleet.total} live DIMTS/DTC buses · ${fleet.moving} moving · ${fleet.routes} routes`
              : fleetErr ?? "Reading Open Transit Data…"}
          </p>

          <p className="style-label">Satellite{isNight ? " · after dark" : " · day"}</p>
          <div className="chips map-zones">
            <button type="button" className={`chip${zone === "all" ? " is-on" : ""}`} onClick={() => setZone("all")}>
              All
            </button>
            {ZONES.map((z) => (
              <button
                key={z}
                type="button"
                className={`chip${zone === z ? " is-on" : ""}`}
                onClick={() => setZone(z)}
              >
                {ZONE_META[z].label}
              </button>
            ))}
          </div>
          <a className="btn ghost" href="#twin">
            Open the twin
          </a>

          {activeTab === "places" ? (
            <div className="map-places-list">
              <p className="status">{locLabel}</p>
              {route && (
                <p className="status">
                  Day route · {route.distanceKm.toFixed(1)} km · {Math.round(route.durationMin)} min cab
                </p>
              )}
              {routeErr && <p className="status">{routeErr}</p>}
              {filtered.slice(0, 16).map((p) => (
                <PlaceRow key={p.id} place={p} />
              ))}
            </div>
          ) : (
            <div className="metro-planner-panel">
              <div className="ride-picks ride-picks-stack">
                <StationSelect label="Start" value={metroStart} onChange={setMetroStart} />
                <StationSelect label="End" value={metroEnd} onChange={setMetroEnd} />
              </div>

              {metroJourney && (
                <div className="ticket ticket-compact">
                  <div className="ticket-meta">
                    <b>{metroJourney.durationMin} min</b>
                    <span>₹{metroJourney.fare}</span>
                    <span>
                      {metroJourney.interchanges.length
                        ? `Change at ${metroJourney.interchanges.join(", ")}`
                        : "No change"}
                    </span>
                  </div>
                  <button type="button" className="btn ghost" onClick={flyToMetroJourney}>
                    Draw it
                  </button>
                </div>
              )}

              <div className="ride-lines">
                <button
                  type="button"
                  className={`line-pill${!metroLine || metroLine === "all" ? " is-on" : ""}`}
                  onClick={() => setMetroLine("all")}
                >
                  All
                </button>
                {METRO_LINES.map((ln) => (
                  <button
                    key={ln.id}
                    type="button"
                    className={`line-pill${metroLine === ln.id ? " is-on" : ""}`}
                    onClick={() => setMetroLine(ln.id)}
                  >
                    <i style={{ background: ln.color }} />
                    {ln.name.replace(" Line", "").replace(" Express", "")}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <div className={`map-canvas${isNight ? " is-night" : ""}`}>
          <div ref={host} className="maplibre-host" />
        </div>
      </div>
    </section>
  )
}

function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function escAttr(s: string) {
  return escHtml(s).replace(/'/g, "&#39;")
}

function PlaceRow({ place }: { place: Place }) {
  const { openPlace, userLoc } = useDay()
  return (
    <HoverPeek src={place.image} alt={place.name}>
      <button type="button" className="map-place" onClick={() => openPlace(place.id)}>
        <strong>{place.name}</strong>
        <span>
          {CATEGORY_META[place.category].label} · {place.metro.station} ·{" "}
          {formatKm(haversineKm(userLoc ?? DELHI, place))}
        </span>
      </button>
    </HoverPeek>
  )
}

function setupMapLayers(
  map: MapLibreMap,
  showMetro: boolean,
  metroLine: string | "all" | null,
) {
  // 1. Day Route Layer
  if (!map.getSource("day-route")) {
    map.addSource("day-route", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
    })
    map.addLayer({
      id: "day-route-line",
      type: "line",
      source: "day-route",
      paint: {
        "line-color": "#ffd700",
        "line-width": 4,
        "line-opacity": 0.95,
      },
    })
  }

  // 2. Metro Lines GeoJSON Source
  if (!map.getSource("delhi-metro-lines")) {
    map.addSource("delhi-metro-lines", {
      type: "geojson",
      data: getMetroLinesGeoJSON(showMetro ? metroLine : "none") as Parameters<GeoJSONSource["setData"]>[0],
    })

    // Glowing casing
    map.addLayer({
      id: "delhi-metro-lines-glow",
      type: "line",
      source: "delhi-metro-lines",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": ["get", "color"],
        "line-width": 8,
        "line-opacity": 0.35,
      },
    })

    // Core sharp line
    map.addLayer({
      id: "delhi-metro-lines-core",
      type: "line",
      source: "delhi-metro-lines",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": ["get", "color"],
        "line-width": 4,
        "line-opacity": 0.95,
      },
    })
  }

  // 3. Metro Journey Highlight Layer
  if (!map.getSource("metro-journey-route")) {
    map.addSource("metro-journey-route", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
    })
    map.addLayer({
      id: "metro-journey-glow",
      type: "line",
      source: "metro-journey-route",
      paint: {
        "line-color": "#ffffff",
        "line-width": 10,
        "line-opacity": 0.45,
      },
    })
    map.addLayer({
      id: "metro-journey-line",
      type: "line",
      source: "metro-journey-route",
      paint: {
        "line-color": "#ffd700",
        "line-width": 5,
        "line-opacity": 1.0,
      },
    })
  }

  // 4. Metro Stations GeoJSON Source
  if (!map.getSource("delhi-metro-stations")) {
    map.addSource("delhi-metro-stations", {
      type: "geojson",
      data: getMetroStationsGeoJSON(showMetro ? metroLine : "none") as Parameters<GeoJSONSource["setData"]>[0],
    })

    // Station outer circle
    map.addLayer({
      id: "delhi-metro-stations-outer",
      type: "circle",
      source: "delhi-metro-stations",
      paint: {
        "circle-radius": ["case", ["get", "interchange"], 6.5, 4.5],
        "circle-color": ["get", "color"],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    })
  }

  // Click on Metro Station
  map.on("click", "delhi-metro-stations-outer", (e) => {
    if (!e.features || !e.features[0]) return
    const f = e.features[0]
    const p = f.properties as { id: string; name: string; lines: string; interchange: boolean }
    const geom = f.geometry as { type: string; coordinates: [number, number] }
    const coords = geom.coordinates

    new maplibregl.Popup({ closeButton: true, offset: 12 })
      .setLngLat(coords)
      .setHTML(`
        <div style="font-family: sans-serif; color: #111; padding: 4px;">
          <b style="font-size: 14px;">${p.name}</b>
          <div style="font-size: 11px; color: #666; margin-top: 2px;">
            ${p.interchange ? "🔄 Major Interchange · " : ""}Lines: ${p.lines}
          </div>
        </div>
      `)
      .addTo(map)
  })

  map.on("mouseenter", "delhi-metro-stations-outer", () => {
    map.getCanvas().style.cursor = "pointer"
  })
  map.on("mouseleave", "delhi-metro-stations-outer", () => {
    map.getCanvas().style.cursor = ""
  })

  if (!map.getSource("otd-buses")) {
    map.addSource("otd-buses", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    })
    map.addLayer({
      id: "otd-buses-dots",
      type: "circle",
      source: "otd-buses",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2.2, 14, 4.5, 16, 7],
        "circle-color": ["case", ["get", "moving"], "#e4c97a", "#8b9388"],
        "circle-stroke-width": 0.8,
        "circle-stroke-color": "#08090b",
        "circle-opacity": 0.9,
      },
    })
    map.on("click", "otd-buses-dots", (e) => {
      const f = e.features?.[0]
      if (!f) return
      const p = f.properties as { id: string; route: string; speed: number }
      const geom = f.geometry as { coordinates: [number, number] }
      new maplibregl.Popup({ closeButton: true, offset: 10 })
        .setLngLat(geom.coordinates)
        .setHTML(
          `<div style="font-family:sans-serif;color:#111;padding:4px">
            <b>Route ${p.route}</b>
            <div style="font-size:11px;color:#555;margin-top:4px">${p.id} · ${p.speed} km/h</div>
            <div style="font-size:10px;color:#888;margin-top:2px">Open Transit Data Delhi</div>
          </div>`,
        )
        .addTo(map)
    })
    map.on("mouseenter", "otd-buses-dots", () => {
      map.getCanvas().style.cursor = "pointer"
    })
    map.on("mouseleave", "otd-buses-dots", () => {
      map.getCanvas().style.cursor = ""
    })
  }
}
