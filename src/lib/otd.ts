import * as GtfsRealtimeBindings from "gtfs-realtime-bindings"
import { inDelhi } from "./geo"

export type LiveBus = {
  id: string
  lat: number
  lng: number
  route: string
  trip: string
  speedKmh: number
  bearing: number
  updatedAt: number
}

export type LiveFleet = {
  buses: LiveBus[]
  total: number
  moving: number
  routes: number
  fetchedAt: number
}

function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string") return Number(v)
  if (v && typeof v === "object") {
    const rec = v as { toNumber?: () => number; low?: number }
    if (typeof rec.toNumber === "function") return rec.toNumber()
    if (typeof rec.low === "number") return rec.low >>> 0
  }
  return 0
}

export function busesToGeoJSON(buses: LiveBus[]) {
  return {
    type: "FeatureCollection" as const,
    features: buses.map((b) => ({
      type: "Feature" as const,
      properties: {
        id: b.id,
        route: b.route,
        trip: b.trip,
        speed: Math.round(b.speedKmh),
        moving: b.speedKmh >= 2,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [b.lng, b.lat] as [number, number],
      },
    })),
  }
}

/** Open Transit Data Delhi GTFS-RT vehicle positions (DIMTS / DTC buses). */
export async function fetchLiveBuses(signal?: AbortSignal): Promise<LiveFleet> {
  const res = await fetch("/otd/vehicles", { signal })
  if (!res.ok) throw new Error("Open Transit Data is unavailable")
  const buf = new Uint8Array(await res.arrayBuffer())
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buf)
  const buses: LiveBus[] = []
  const routeSet = new Set<string>()

  for (const entity of feed.entity) {
    const pos = entity.vehicle?.position
    if (!pos) continue
    const lat = pos.latitude
    const lng = pos.longitude
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    if (!inDelhi(lat, lng)) continue
    const route = entity.vehicle?.trip?.routeId || "—"
    const speedMs = pos.speed ?? 0
    const speedKmh = speedMs * 3.6
    buses.push({
      id: entity.id || entity.vehicle?.vehicle?.id || entity.vehicle?.vehicle?.label || "bus",
      lat,
      lng,
      route,
      trip: entity.vehicle?.trip?.tripId || "",
      speedKmh,
      bearing: pos.bearing ?? 0,
      updatedAt: toNum(entity.vehicle?.timestamp) * 1000,
    })
    if (route !== "—") routeSet.add(route)
  }

  const moving = buses.filter((b) => b.speedKmh >= 2).length
  const cap = 900
  const stride = buses.length > cap ? Math.ceil(buses.length / cap) : 1
  const shown = stride === 1 ? buses : buses.filter((_, i) => i % stride === 0).slice(0, cap)

  return {
    buses: shown,
    total: buses.length,
    moving,
    routes: routeSet.size,
    fetchedAt: toNum(feed.header?.timestamp) * 1000 || Date.now(),
  }
}
