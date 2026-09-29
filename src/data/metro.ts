import type { MetroLine, MetroStation } from "../types"

export const METRO_LINES: MetroLine[] = [
  { id: "yellow", name: "Yellow Line", color: "#F5C400" },
  { id: "blue", name: "Blue Line", color: "#0078C8" },
  { id: "red", name: "Red Line", color: "#E31E24" },
  { id: "violet", name: "Violet Line", color: "#7B2D8E" },
  { id: "pink", name: "Pink Line", color: "#E91E8C" },
  { id: "magenta", name: "Magenta Line", color: "#E4007C" },
  { id: "orange", name: "Airport Express", color: "#F57F20" },
]

export const METRO_STATIONS: MetroStation[] = [
  // Interchanges & Major Terminals
  { id: "rajiv-chowk", name: "Rajiv Chowk (CP)", lat: 28.6328, lng: 77.2197, lines: ["yellow", "blue"], interchange: true },
  { id: "kashmere-gate", name: "Kashmere Gate", lat: 28.6676, lng: 77.2283, lines: ["red", "yellow", "violet"], interchange: true },
  { id: "new-delhi", name: "New Delhi Railway", lat: 28.643, lng: 77.2215, lines: ["yellow", "orange"], interchange: true },
  { id: "central-secretariat", name: "Central Secretariat", lat: 28.6149, lng: 77.2119, lines: ["yellow", "violet"], interchange: true },
  { id: "hauz-khas", name: "Hauz Khas", lat: 28.5434, lng: 77.2067, lines: ["yellow", "magenta"], interchange: true },
  { id: "ina", name: "Dilli Haat - INA", lat: 28.5746, lng: 77.2094, lines: ["yellow", "pink"], interchange: true },
  { id: "lajpat-nagar", name: "Lajpat Nagar", lat: 28.5708, lng: 77.2365, lines: ["violet", "pink"], interchange: true },
  { id: "kalkaji-mandir", name: "Kalkaji Mandir", lat: 28.5503, lng: 77.2588, lines: ["violet", "magenta"], interchange: true },
  { id: "mandi-house", name: "Mandi House", lat: 28.6256, lng: 77.2342, lines: ["blue", "violet"], interchange: true },
  { id: "botanical", name: "Botanical Garden", lat: 28.564, lng: 77.3345, lines: ["blue", "magenta"], interchange: true },
  { id: "dwarka-21", name: "Dwarka Sector 21", lat: 28.5523, lng: 77.0586, lines: ["blue", "orange"], interchange: true },

  // Yellow Line (North to South Spine)
  { id: "guru-tegh-bahadur", name: "GTB Nagar", lat: 28.698, lng: 77.221, lines: ["yellow"], interchange: false },
  { id: "vishwavidyalaya", name: "Delhi University", lat: 28.6948, lng: 77.2146, lines: ["yellow"], interchange: false },
  { id: "civil-lines", name: "Civil Lines", lat: 28.6769, lng: 77.225, lines: ["yellow"], interchange: false },
  { id: "vidhan-sabha", name: "Vidhan Sabha", lat: 28.675, lng: 77.2215, lines: ["yellow"], interchange: false },
  { id: "chandni-chowk", name: "Chandni Chowk", lat: 28.658, lng: 77.2303, lines: ["yellow"], interchange: false },
  { id: "patel-chowk", name: "Patel Chowk", lat: 28.623, lng: 77.2139, lines: ["yellow"], interchange: false },
  { id: "udyog-bhawan", name: "Udyog Bhawan", lat: 28.6116, lng: 77.212, lines: ["yellow"], interchange: false },
  { id: "jor-bagh", name: "Jor Bagh (Lodhi)", lat: 28.587, lng: 77.2124, lines: ["yellow"], interchange: false },
  { id: "aiims", name: "AIIMS Hospital", lat: 28.568, lng: 77.208, lines: ["yellow"], interchange: false },
  { id: "green-park", name: "Green Park", lat: 28.5598, lng: 77.2069, lines: ["yellow"], interchange: false },
  { id: "saket", name: "Saket", lat: 28.5206, lng: 77.2015, lines: ["yellow"], interchange: false },
  { id: "qutab-minar", name: "Qutab Minar", lat: 28.5127, lng: 77.1858, lines: ["yellow"], interchange: false },

  // Blue Line (East-West Arterial)
  { id: "karol-bagh", name: "Karol Bagh", lat: 28.6519, lng: 77.1907, lines: ["blue"], interchange: false },
  { id: "jhandewalan", name: "Jhandewalan", lat: 28.6443, lng: 77.1999, lines: ["blue"], interchange: false },
  { id: "rk-ashram", name: "RK Ashram Marg", lat: 28.6394, lng: 77.2084, lines: ["blue"], interchange: false },
  { id: "barakhamba", name: "Barakhamba Road", lat: 28.63, lng: 77.2245, lines: ["blue"], interchange: false },
  { id: "supreme-court", name: "Supreme Court", lat: 28.6224, lng: 77.2393, lines: ["blue"], interchange: false },
  { id: "akshardham", name: "Akshardham", lat: 28.6183, lng: 77.2792, lines: ["blue"], interchange: false },

  // Violet Line (Heritage Line)
  { id: "lal-qila", name: "Lal Qila (Red Fort)", lat: 28.6567, lng: 77.2367, lines: ["violet"], interchange: false },
  { id: "jama-masjid", name: "Jama Masjid", lat: 28.6504, lng: 77.2378, lines: ["violet"], interchange: false },
  { id: "delhi-gate", name: "Delhi Gate", lat: 28.6401, lng: 77.2404, lines: ["violet"], interchange: false },
  { id: "khan-market-cp", name: "Janpath", lat: 28.627, lng: 77.2189, lines: ["violet"], interchange: false },
  { id: "khan-market", name: "Khan Market", lat: 28.6028, lng: 77.2273, lines: ["violet"], interchange: false },
  { id: "jln-stadium", name: "JLN Stadium", lat: 28.5905, lng: 77.2334, lines: ["violet"], interchange: false },
  { id: "jangpura", name: "Jangpura", lat: 28.5844, lng: 77.238, lines: ["violet"], interchange: false },
  { id: "nehru-place", name: "Nehru Place", lat: 28.5495, lng: 77.254, lines: ["violet"], interchange: false },
  { id: "tughlakabad", name: "Tughlakabad", lat: 28.5026, lng: 77.2634, lines: ["violet"], interchange: false },
  { id: "sarai", name: "Sarai", lat: 28.478, lng: 77.305, lines: ["violet"], interchange: false },

  // Airport Express Line (Orange)
  { id: "airport-t3", name: "IGI Airport T3", lat: 28.5562, lng: 77.1, lines: ["orange"], interchange: false },

  // Pink Line (Ring Road Orbit)
  { id: "majlish", name: "Majlis Park", lat: 28.724, lng: 77.181, lines: ["pink"], interchange: false },
  { id: "sarojini", name: "Sarojini Nagar", lat: 28.5758, lng: 77.1966, lines: ["pink"], interchange: false },
  { id: "dilli-haat-ina", name: "South Extension", lat: 28.5686, lng: 77.2195, lines: ["pink"], interchange: false },
  { id: "lajpat-pink", name: "Vinobapuri", lat: 28.567, lng: 77.2505, lines: ["pink"], interchange: false },
  { id: "nizamuddin", name: "Hazrat Nizamuddin", lat: 28.5889, lng: 77.254, lines: ["pink"], interchange: false },

  // Magenta Line (South Outer Orbital)
  { id: "rk-puram", name: "R.K. Puram", lat: 28.5625, lng: 77.1768, lines: ["magenta"], interchange: false },
  { id: "iit", name: "IIT Delhi", lat: 28.5452, lng: 77.1926, lines: ["magenta"], interchange: false },
  { id: "panchsheel", name: "Panchsheel Park", lat: 28.543, lng: 77.216, lines: ["magenta"], interchange: false },
  { id: "kalkaji-mag", name: "Nehru Enclave", lat: 28.548, lng: 77.2512, lines: ["magenta"], interchange: false },
]

export const LINE_BY_ID = Object.fromEntries(METRO_LINES.map((l) => [l.id, l]))
export const METRO_STATION_BY_ID = Object.fromEntries(METRO_STATIONS.map((s) => [s.id, s]))

// Sequential topological order of stations along each line
export const METRO_LINE_ROUTES: Record<string, string[]> = {
  yellow: [
    "guru-tegh-bahadur",
    "vishwavidyalaya",
    "civil-lines",
    "vidhan-sabha",
    "kashmere-gate",
    "chandni-chowk",
    "new-delhi",
    "rajiv-chowk",
    "patel-chowk",
    "central-secretariat",
    "udyog-bhawan",
    "jor-bagh",
    "ina",
    "aiims",
    "green-park",
    "hauz-khas",
    "saket",
    "qutab-minar",
  ],
  blue: [
    "dwarka-21",
    "karol-bagh",
    "jhandewalan",
    "rk-ashram",
    "rajiv-chowk",
    "barakhamba",
    "mandi-house",
    "supreme-court",
    "akshardham",
    "botanical",
  ],
  violet: [
    "kashmere-gate",
    "lal-qila",
    "jama-masjid",
    "delhi-gate",
    "khan-market-cp",
    "mandi-house",
    "central-secretariat",
    "khan-market",
    "jln-stadium",
    "jangpura",
    "lajpat-nagar",
    "nehru-place",
    "kalkaji-mandir",
    "tughlakabad",
    "sarai",
  ],
  orange: [
    "new-delhi",
    "airport-t3",
    "dwarka-21",
  ],
  pink: [
    "majlish",
    "sarojini",
    "ina",
    "dilli-haat-ina",
    "lajpat-nagar",
    "lajpat-pink",
    "nizamuddin",
  ],
  magenta: [
    "rk-puram",
    "iit",
    "panchsheel",
    "hauz-khas",
    "kalkaji-mag",
    "kalkaji-mandir",
    "botanical",
  ],
}

/** Generates GeoJSON FeatureCollection of LineStrings for all Delhi Metro lines */
export function getMetroLinesGeoJSON(filteredLine?: string | null) {
  const features = []
  for (const line of METRO_LINES) {
    if (filteredLine && filteredLine !== "all" && line.id !== filteredLine) continue
    const route = METRO_LINE_ROUTES[line.id]
    if (!route || route.length < 2) continue

    const coords = route
      .map((id) => METRO_STATION_BY_ID[id])
      .filter(Boolean)
      .map((s) => [s.lng, s.lat])

    features.push({
      type: "Feature" as const,
      properties: {
        id: line.id,
        name: line.name,
        color: line.color,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: coords,
      },
    })
  }
  return {
    type: "FeatureCollection" as const,
    features,
  }
}

/** Generates GeoJSON FeatureCollection of Point features for all Delhi Metro stations */
export function getMetroStationsGeoJSON(filteredLine?: string | null) {
  const stations = METRO_STATIONS.filter(
    (s) => !filteredLine || filteredLine === "all" || s.lines.includes(filteredLine),
  )
  const features = stations.map((s) => ({
    type: "Feature" as const,
    properties: {
      id: s.id,
      name: s.name,
      interchange: s.interchange,
      lines: s.lines.join(", "),
      color: LINE_BY_ID[s.lines[0]]?.color ?? "#ffffff",
    },
    geometry: {
      type: "Point" as const,
      coordinates: [s.lng, s.lat],
    },
  }))
  return {
    type: "FeatureCollection" as const,
    features,
  }
}

/** Shortest path route finder on Delhi Metro network using Breadth-First-Search */
export function findMetroRoute(startId: string, endId: string) {
  if (startId === endId) return null
  const start = METRO_STATION_BY_ID[startId]
  const end = METRO_STATION_BY_ID[endId]
  if (!start || !end) return null

  // Build Adjacency Graph from lines
  const adj = new Map<string, Set<string>>()
  for (const s of METRO_STATIONS) {
    adj.set(s.id, new Set())
  }
  for (const route of Object.values(METRO_LINE_ROUTES)) {
    for (let i = 0; i < route.length - 1; i++) {
      const u = route[i]
      const v = route[i + 1]
      adj.get(u)?.add(v)
      adj.get(v)?.add(u)
    }
  }

  // BFS
  const queue: string[][] = [[startId]]
  const visited = new Set<string>([startId])
  let path: string[] | null = null

  while (queue.length > 0) {
    const curPath = queue.shift()!
    const u = curPath[curPath.length - 1]
    if (u === endId) {
      path = curPath
      break
    }
    const neighbors = adj.get(u) ?? []
    for (const v of neighbors) {
      if (!visited.has(v)) {
        visited.add(v)
        queue.push([...curPath, v])
      }
    }
  }

  if (!path) return null

  const stations = path.map((id) => METRO_STATION_BY_ID[id]).filter(Boolean)
  const coords = stations.map((s) => [s.lng, s.lat])

  // Detect Line Changes
  const interchanges: string[] = []
  for (let i = 1; i < stations.length - 1; i++) {
    const prev = stations[i - 1]
    const cur = stations[i]
    const next = stations[i + 1]
    const commonPrev = prev.lines.filter((l) => cur.lines.includes(l))
    const commonNext = cur.lines.filter((l) => next.lines.includes(l))
    const shared = commonPrev.filter((l) => commonNext.includes(l))
    if (shared.length === 0) {
      interchanges.push(cur.name)
    }
  }

  // Estimate Fare & Time
  const durationMin = Math.round(stations.length * 2.4 + interchanges.length * 5)
  const fare = Math.min(60, Math.max(10, Math.round(stations.length * 3.5)))

  return {
    stations,
    interchanges,
    durationMin,
    fare,
    coords,
  }
}
