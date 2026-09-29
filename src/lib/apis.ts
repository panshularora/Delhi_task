import type { NearbyPoi, OsmHit, RouteLeg, WeatherNow } from "../types"
import { DELHI, haversineKm, inDelhi } from "./geo"

const WMO: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  80: "Showers",
  81: "Heavy showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
}

export function weatherLabel(code: number): string {
  return WMO[code] ?? "Delhi sky"
}

function aqiFromUs(us: number | null): { aqi: number | null; aqiLabel: string } {
  if (us == null || Number.isNaN(us)) return { aqi: null, aqiLabel: "AQI —" }
  if (us <= 50) return { aqi: us, aqiLabel: "Good" }
  if (us <= 100) return { aqi: us, aqiLabel: "Moderate" }
  if (us <= 150) return { aqi: us, aqiLabel: "Sensitive" }
  if (us <= 200) return { aqi: us, aqiLabel: "Unhealthy" }
  if (us <= 300) return { aqi: us, aqiLabel: "Very unhealthy" }
  return { aqi: us, aqiLabel: "Hazardous" }
}

export async function fetchWeather(
  lat = DELHI.lat,
  lng = DELHI.lng,
  signal?: AbortSignal,
): Promise<WeatherNow> {
  const forecast = fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FKolkata`,
    { signal },
  )
  const air = fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5`,
    { signal },
  )
  const [fRes, aRes] = await Promise.all([forecast, air])
  if (!fRes.ok) throw new Error("Weather unavailable")
  const f = (await fRes.json()) as {
    current: {
      temperature_2m: number
      apparent_temperature: number
      relative_humidity_2m: number
      wind_speed_10m: number
      weather_code: number
    }
  }
  let aqi: number | null = null
  if (aRes.ok) {
    const a = (await aRes.json()) as { current?: { us_aqi?: number } }
    aqi = a.current?.us_aqi ?? null
  }
  const tagged = aqiFromUs(aqi)
  return {
    temp: Math.round(f.current.temperature_2m),
    apparent: Math.round(f.current.apparent_temperature),
    humidity: Math.round(f.current.relative_humidity_2m),
    wind: Math.round(f.current.wind_speed_10m),
    code: f.current.weather_code,
    aqi: tagged.aqi,
    aqiLabel: tagged.aqiLabel,
  }
}

export async function fetchRoute(
  points: { lat: number; lng: number }[],
  profile: "driving" | "foot" = "driving",
  signal?: AbortSignal,
): Promise<RouteLeg | null> {
  if (points.length < 2) return null
  const path = points.map((p) => `${p.lng},${p.lat}`).join(";")
  const url = `https://router.project-osrm.org/route/v1/${profile}/${path}?overview=full&geometries=geojson`
  const res = await fetch(url, { signal })
  if (!res.ok) return null
  const data = (await res.json()) as {
    routes?: {
      distance: number
      duration: number
      geometry: { coordinates: [number, number][] }
    }[]
  }
  const route = data.routes?.[0]
  if (!route) return null
  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  }
}

type OsmEl = {
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

export async function fetchNearby(
  lat: number,
  lng: number,
  radius = 900,
  signal?: AbortSignal,
): Promise<NearbyPoi[]> {
  const q = `[out:json][timeout:18];(
    node["tourism"~"attraction|museum|gallery|viewpoint"](around:${radius},${lat},${lng});
    node["historic"](around:${radius},${lat},${lng});
    node["amenity"~"place_of_worship|restaurant|cafe|marketplace"](around:${radius},${lat},${lng});
    node["shop"="marketplace"](around:${radius},${lat},${lng});
  );out body 30;`
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: q,
    headers: { "Content-Type": "text/plain" },
    signal,
  })
  if (!res.ok) throw new Error("Nearby places unavailable")
  const data = (await res.json()) as { elements: OsmEl[] }
  const seen = new Set<string>()
  const pois: NearbyPoi[] = []
  for (const el of data.elements) {
    const name = el.tags?.name
    if (!name) continue
    const plat = el.lat ?? el.center?.lat
    const plng = el.lon ?? el.center?.lon
    if (plat == null || plng == null) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const kind =
      el.tags?.tourism ||
      el.tags?.historic ||
      el.tags?.amenity ||
      el.tags?.shop ||
      "place"
    pois.push({
      id: `osm-${el.id}`,
      name,
      kind: kind.replace(/_/g, " "),
      lat: plat,
      lng: plng,
      distKm: haversineKm({ lat, lng }, { lat: plat, lng: plng }),
    })
  }
  return pois.sort((a, b) => a.distKm - b.distKm).slice(0, 12)
}

export async function searchPhoton(
  q: string,
  signal?: AbortSignal,
): Promise<OsmHit[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${DELHI.lat}&lon=${DELHI.lng}&limit=8`
  const res = await fetch(url, { signal })
  if (!res.ok) return []
  const data = (await res.json()) as {
    features?: {
      geometry: { coordinates: [number, number] }
      properties: {
        osm_id?: number
        name?: string
        city?: string
        state?: string
        osm_value?: string
        osm_key?: string
      }
    }[]
  }
  return (data.features ?? [])
    .map((f) => {
      const [lng, lat] = f.geometry.coordinates
      return {
        id: `ph-${f.properties.osm_id ?? `${lat}-${lng}`}`,
        name: f.properties.name ?? "Unnamed",
        lat,
        lng,
        kind: (f.properties.osm_value || f.properties.osm_key || "place").replace(
          /_/g,
          " ",
        ),
      }
    })
    .filter((h) => inDelhi(h.lat, h.lng) && h.name !== "Unnamed")
    .slice(0, 6)
}
