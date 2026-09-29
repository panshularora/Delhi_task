import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { PLACE_BY_ID, PLACES } from "./data/places"
import { fetchRoute, fetchWeather, searchPhoton } from "./lib/apis"
import { inDelhi, placeToStop } from "./lib/geo"
import { zoneOf, type Zone } from "./lib/zones"
import type {
  Category,
  OsmHit,
  Place,
  RouteLeg,
  Stop,
  WeatherNow,
} from "./types"

type Loc = { lat: number; lng: number }

type Ctx = {
  query: string
  setQuery: (q: string) => void
  category: Category | "all"
  setCategory: (c: Category | "all") => void
  zone: Zone | "all"
  setZone: (z: Zone | "all") => void
  filtered: Place[]
  saved: string[]
  toggleSave: (id: string) => void
  isSaved: (id: string) => boolean
  selected: Place | null
  openPlace: (id: string) => void
  closePlace: () => void
  itinerary: Stop[]
  addStop: (s: Stop) => void
  removeStop: (id: string) => void
  moveStop: (id: string, dir: -1 | 1) => void
  setItinerary: (s: Stop[]) => void
  inDay: (id: string) => boolean
  userLoc: Loc | null
  locLabel: string
  requestLoc: () => void
  weather: WeatherNow | null
  weatherErr: string | null
  route: RouteLeg | null
  routeErr: string | null
  mapTarget: { lat: number; lng: number; zoom: number } | null
  flyTo: (lat: number, lng: number, zoom?: number) => void
  osmHits: OsmHit[]
  searching: boolean
  dockOpen: boolean
  setDockOpen: (v: boolean) => void
  metroLine: string | "all" | null
  setMetroLine: (id: string | "all" | null) => void
  showMetro: boolean
  setShowMetro: (v: boolean) => void
  isNight: boolean
  setNight: (v: boolean) => void
}

const DayContext = createContext<Ctx | null>(null)

function readSaved(): string[] {
  try {
    const raw = localStorage.getItem("delhi-saved")
    if (!raw) return []
    return (JSON.parse(raw) as string[]).filter((id) => Boolean(PLACE_BY_ID[id]))
  } catch {
    return []
  }
}

function hourIsNight() {
  const h = new Date().getHours()
  return h >= 19 || h < 6
}

function readDayFromUrl(): Stop[] {
  const raw = new URLSearchParams(window.location.search).get("day")
  if (!raw) {
    try {
      const saved = localStorage.getItem("delhi-day")
      if (saved) return JSON.parse(saved) as Stop[]
    } catch {
      /* ignore */
    }
    return []
  }
  return raw
    .split(",")
    .map((id) => PLACE_BY_ID[id])
    .filter(Boolean)
    .map(placeToStop)
}

export function DayProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<Category | "all">("all")
  const [zone, setZone] = useState<Zone | "all">("all")
  const [saved, setSaved] = useState<string[]>(readSaved)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [itinerary, setItineraryState] = useState<Stop[]>(readDayFromUrl)
  const [userLoc, setUserLoc] = useState<Loc | null>(null)
  const [locLabel, setLocLabel] = useState("Delhi centre")
  const [weather, setWeather] = useState<WeatherNow | null>(null)
  const [weatherErr, setWeatherErr] = useState<string | null>(null)
  const [route, setRoute] = useState<RouteLeg | null>(null)
  const [routeErr, setRouteErr] = useState<string | null>(null)
  const [mapTarget, setMapTarget] = useState<{
    lat: number
    lng: number
    zoom: number
  } | null>(null)
  const [osmHits, setOsmHits] = useState<OsmHit[]>([])
  const [searching, setSearching] = useState(false)
  const [dockOpen, setDockOpen] = useState(false)
  const [metroLine, setMetroLine] = useState<string | "all" | null>(null)
  const [showMetro, setShowMetro] = useState(true)
  const [isNight, setNight] = useState(hourIsNight)

  const selected = selectedId ? (PLACE_BY_ID[selectedId] ?? null) : null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PLACES.filter((p) => {
      if (category !== "all" && p.category !== category && !p.tags.includes(category)) {
        return false
      }
      if (zone !== "all" && zoneOf(p) !== zone) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.hindi.includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        p.blurb.toLowerCase().includes(q)
      )
    })
  }, [query, category, zone])

  const setItinerary = useCallback((s: Stop[]) => {
    setItineraryState(s)
  }, [])

  const addStop = useCallback((s: Stop) => {
    setItineraryState((cur) => {
      if (cur.some((x) => x.id === s.id)) return cur
      return [...cur, s]
    })
    setDockOpen(true)
  }, [])

  const removeStop = useCallback((id: string) => {
    setItineraryState((cur) => cur.filter((x) => x.id !== id))
  }, [])

  const moveStop = useCallback((id: string, dir: -1 | 1) => {
    setItineraryState((cur) => {
      const i = cur.findIndex((x) => x.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= cur.length) return cur
      const next = cur.slice()
      const [item] = next.splice(i, 1)
      next.splice(j, 0, item)
      return next
    })
  }, [])

  const inDay = useCallback(
    (id: string) => itinerary.some((s) => s.id === id),
    [itinerary],
  )

  const toggleSave = useCallback((id: string) => {
    setSaved((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }, [])

  const isSaved = useCallback((id: string) => saved.includes(id), [saved])

  const openPlace = useCallback((id: string) => {
    setSelectedId(id)
    const p = PLACE_BY_ID[id]
    if (p) setMapTarget({ lat: p.lat, lng: p.lng, zoom: 16 })
  }, [])

  const closePlace = useCallback(() => setSelectedId(null), [])

  const flyTo = useCallback((lat: number, lng: number, zoom = 14) => {
    setMapTarget({ lat, lng, zoom })
  }, [])

  const requestLoc = useCallback(() => {
    if (!navigator.geolocation) {
      setLocLabel("Geolocation off")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLoc(loc)
        if (inDelhi(loc.lat, loc.lng)) {
          setLocLabel("You are in Delhi")
          setMapTarget({ lat: loc.lat, lng: loc.lng, zoom: 13 })
        } else {
          setLocLabel("Outside Delhi — distances from you")
        }
      },
      () => setLocLabel("Location denied"),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchWeather(undefined, undefined, ctrl.signal)
      .then((w) => {
        setWeather(w)
        setWeatherErr(null)
      })
      .catch((err: unknown) => {
        const name = err instanceof Error ? err.name : ""
        if (name === "AbortError") return
        setWeatherErr("Weather paused")
      })
    return () => ctrl.abort()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("delhi-saved", JSON.stringify(saved))
    } catch {
      /* ignore */
    }
  }, [saved])

  useEffect(() => {
    try {
      localStorage.setItem("delhi-day", JSON.stringify(itinerary))
    } catch {
      /* ignore */
    }
    const ids = itinerary
      .map((s) => s.id)
      .filter((id) => PLACE_BY_ID[id])
      .join(",")
    const url = new URL(window.location.href)
    if (ids) url.searchParams.set("day", ids)
    else url.searchParams.delete("day")
    window.history.replaceState({}, "", url)
  }, [itinerary])

  useEffect(() => {
    if (itinerary.length < 2) {
      setRoute(null)
      setRouteErr(null)
      return
    }
    const ctrl = new AbortController()
    const t = window.setTimeout(() => {
      fetchRoute(itinerary, "driving", ctrl.signal)
        .then((r) => {
          if (r) {
            setRoute(r)
            setRouteErr(null)
          } else setRouteErr("Route engine busy")
        })
        .catch(() => setRouteErr("Route engine busy"))
    }, 280)
    return () => {
      ctrl.abort()
      window.clearTimeout(t)
    }
  }, [itinerary])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setOsmHits([])
      setSearching(false)
      return
    }
    const ctrl = new AbortController()
    setSearching(true)
    const t = window.setTimeout(() => {
      searchPhoton(q, ctrl.signal)
        .then((hits) => {
          const known = new Set(PLACES.map((p) => p.name.toLowerCase()))
          setOsmHits(hits.filter((h) => !known.has(h.name.toLowerCase())))
        })
        .catch(() => setOsmHits([]))
        .finally(() => setSearching(false))
    }, 320)
    return () => {
      ctrl.abort()
      window.clearTimeout(t)
    }
  }, [query])

  const value = useMemo<Ctx>(
    () => ({
      query,
      setQuery,
      category,
      setCategory,
      zone,
      setZone,
      filtered,
      saved,
      toggleSave,
      isSaved,
      selected,
      openPlace,
      closePlace,
      itinerary,
      addStop,
      removeStop,
      moveStop,
      setItinerary,
      inDay,
      userLoc,
      locLabel,
      requestLoc,
      weather,
      weatherErr,
      route,
      routeErr,
      mapTarget,
      flyTo,
      osmHits,
      searching,
      dockOpen,
      setDockOpen,
      metroLine,
      setMetroLine,
      showMetro,
      setShowMetro,
      isNight,
      setNight,
    }),
    [
      query,
      category,
      zone,
      filtered,
      saved,
      toggleSave,
      isSaved,
      selected,
      openPlace,
      closePlace,
      itinerary,
      addStop,
      removeStop,
      moveStop,
      setItinerary,
      inDay,
      userLoc,
      locLabel,
      requestLoc,
      weather,
      weatherErr,
      route,
      routeErr,
      mapTarget,
      flyTo,
      osmHits,
      searching,
      dockOpen,
      metroLine,
      showMetro,
      isNight,
    ],
  )

  return <DayContext.Provider value={value}>{children}</DayContext.Provider>
}

export function useDay() {
  const ctx = useContext(DayContext)
  if (!ctx) throw new Error("useDay outside provider")
  return ctx
}
