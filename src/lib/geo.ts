import type { Place, Stop } from "../types"

export const DELHI = { lat: 28.6139, lng: 77.209 }
export const DELHI_BOUNDS = {
  south: 28.4,
  north: 28.89,
  west: 76.84,
  east: 77.35,
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s1 = Math.sin(dLat / 2)
  const s2 = Math.sin(dLng / 2)
  const q =
    s1 * s1 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      s2 *
      s2
  return 2 * R * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q))
}

export function inDelhi(lat: number, lng: number): boolean {
  return (
    lat >= DELHI_BOUNDS.south &&
    lat <= DELHI_BOUNDS.north &&
    lng >= DELHI_BOUNDS.west &&
    lng <= DELHI_BOUNDS.east
  )
}

/** Walk ~4.3 km/h; beyond 1.4 km assume metro/cab with access time. */
export function estimateTravelMin(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): { walkMin: number; cabMin: number; mode: "walk" | "metro/cab" } {
  const km = haversineKm(a, b)
  const walkMin = Math.round((km / 4.3) * 60)
  const cabMin = Math.max(12, Math.round((km / 18) * 60 + 8))
  if (km < 1.4) return { walkMin, cabMin, mode: "walk" }
  return { walkMin, cabMin, mode: "metro/cab" }
}

export function formatKm(km: number): string {
  if (km < 0.1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

export function formatMin(min: number): string {
  if (min < 60) return `${Math.round(min)} min`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m ? `${h} h ${m} min` : `${h} h`
}

export function placeToStop(p: Place): Stop {
  return {
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    durationMin: p.durationMin,
    category: p.category,
    image: p.image,
    metro: p.metro.station,
  }
}

export function bearingDeg(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (Math.atan2(y, x) * 180) / Math.PI
}
