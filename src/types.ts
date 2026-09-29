export const CATEGORIES = [
  "heritage",
  "food",
  "hidden",
  "experience",
  "market",
  "nightlife",
] as const

export type Category = (typeof CATEGORIES)[number]

export type MetroLink = {
  station: string
  lines: string[]
  walkMin: number
}

export type Place = {
  id: string
  name: string
  hindi: string
  category: Category
  neighborhood: string
  lat: number
  lng: number
  image: string
  kicker: string
  blurb: string
  story: string
  hours: string
  ticket: string
  durationMin: number
  bestTime: string
  metro: MetroLink
  tags: string[]
  eat: string[]
  tips: string[]
  cost: "free" | "₹" | "₹₹" | "₹₹₹"
}

export type Stop = {
  id: string
  name: string
  lat: number
  lng: number
  durationMin: number
  category: Category | "custom"
  image?: string
  metro?: string
}

export type WeatherNow = {
  temp: number
  apparent: number
  humidity: number
  wind: number
  code: number
  aqi: number | null
  aqiLabel: string
}

export type NearbyPoi = {
  id: string
  name: string
  kind: string
  lat: number
  lng: number
  distKm: number
}

export type RouteLeg = {
  distanceKm: number
  durationMin: number
  geometry: [number, number][]
}

export type MetroStation = {
  id: string
  name: string
  lat: number
  lng: number
  lines: string[]
  interchange: boolean
}

export type MetroLine = {
  id: string
  name: string
  color: string
}

export type OsmHit = {
  id: string
  name: string
  lat: number
  lng: number
  kind: string
}
