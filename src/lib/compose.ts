import type { Category, Place, Stop } from "../types"
import { estimateTravelMin, haversineKm } from "./geo"

export function composeDay(opts: {
  moods: Category[]
  hours: number
  start: { lat: number; lng: number }
  places: Place[]
  seed?: string[]
}): Stop[] {
  const budget = opts.hours * 60
  const moodSet = new Set(opts.moods)
  const pool = opts.places.filter((p) => {
    if (moodSet.size === 0) return true
    return moodSet.has(p.category) || p.tags.some((t) => moodSet.has(t as Category))
  })

  const used = new Set<string>(opts.seed ?? [])
  const route: Place[] = []
  let t = 0
  let cur = opts.start

  const seeded = (opts.seed ?? [])
    .map((id) => opts.places.find((p) => p.id === id))
    .filter((p): p is Place => Boolean(p))
  for (const p of seeded) {
    const travel = estimateTravelMin(cur, p)
    const add = (travel.mode === "walk" ? travel.walkMin : travel.cabMin) + p.durationMin
    t += add
    route.push(p)
    cur = p
  }

  while (route.length < 7) {
    let best: Place | null = null
    let bestScore = Infinity
    for (const p of pool) {
      if (used.has(p.id)) continue
      const km = haversineKm(cur, p)
      const travel = estimateTravelMin(cur, p)
      const travelMin = travel.mode === "walk" ? travel.walkMin : travel.cabMin
      const total = travelMin + p.durationMin
      if (t + total > budget - 8) continue
      const sameCat = route.some((r) => r.category === p.category) ? 14 : 0
      const farPenalty = km * 6
      const score = travelMin + sameCat + farPenalty
      if (score < bestScore) {
        best = p
        bestScore = score
      }
    }
    if (!best) break
    const travel = estimateTravelMin(cur, best)
    t += (travel.mode === "walk" ? travel.walkMin : travel.cabMin) + best.durationMin
    used.add(best.id)
    route.push(best)
    cur = best
  }

  return route.map((p) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    durationMin: p.durationMin,
    category: p.category,
    image: p.image,
    metro: p.metro.station,
  }))
}

export function dayTotals(
  stops: Stop[],
  legs: { durationMin: number }[],
): { visitMin: number; travelMin: number; totalMin: number } {
  const visitMin = stops.reduce((s, x) => s + x.durationMin, 0)
  const travelMin = legs.reduce((s, x) => s + x.durationMin, 0)
  return { visitMin, travelMin, totalMin: visitMin + travelMin }
}
