import { DELHI } from "./geo"

/**
 * Local tangent plane for Delhi.
 * One source of truth: East = +X, Up = +Y, North = −Z.
 * Camera at yaw 0 sits on +Z (south) looking toward −Z (north).
 */
export const UNITS_PER_KM = 14
export const HEIGHT_EXAG = 16

const M_PER_DEG_LAT = 110_574
const COS_ORIGIN = Math.cos((DELHI.lat * Math.PI) / 180)

export type Vec3 = { x: number; y: number; z: number }

export function project(lat: number, lng: number, y = 0): Vec3 {
  const eastKm = ((lng - DELHI.lng) * M_PER_DEG_LAT * COS_ORIGIN) / 1000
  const northKm = ((lat - DELHI.lat) * M_PER_DEG_LAT) / 1000
  return {
    x: eastKm * UNITS_PER_KM,
    y,
    z: -northKm * UNITS_PER_KM,
  }
}

export function unproject(x: number, z: number): { lat: number; lng: number } {
  const eastKm = x / UNITS_PER_KM
  const northKm = -z / UNITS_PER_KM
  return {
    lat: DELHI.lat + (northKm * 1000) / M_PER_DEG_LAT,
    lng: DELHI.lng + (eastKm * 1000) / (M_PER_DEG_LAT * COS_ORIGIN),
  }
}

export function heightUnits(meters: number): number {
  return (meters / 1000) * UNITS_PER_KM * HEIGHT_EXAG
}

/** Camera offset from yaw/pitch/distance. yaw 0 = from south (+Z). */
export function orbitOffset(yaw: number, pitch: number, distance: number): Vec3 {
  const cp = Math.cos(pitch)
  return {
    x: Math.sin(yaw) * cp * distance,
    y: Math.sin(pitch) * distance,
    z: Math.cos(yaw) * cp * distance,
  }
}

export const OVERVIEW = {
  yaw: -0.62,
  pitch: 1.12,
  distance: 220,
  target: project(28.62, 77.22),
}

export function assertDelhiFrame(): string[] {
  const ig = project(28.6129, 77.2295)
  const rb = project(28.6143, 77.1994)
  const rf = project(28.6562, 77.241)
  const qm = project(28.5245, 77.1855)
  const fails: string[] = []
  if (!(ig.x > rb.x)) fails.push("India Gate should be east (+X) of Rashtrapati Bhavan")
  if (!(rf.z < ig.z)) fails.push("Red Fort should be north (−Z) of India Gate")
  if (!(qm.z > ig.z)) fails.push("Qutub Minar should be south (+Z) of India Gate")
  const cam = orbitOffset(0, 0.5, 40)
  if (!(cam.z > 0)) fails.push("yaw 0 camera should sit on +Z (south)")
  if (!(cam.y > 0)) fails.push("positive pitch should lift the camera")
  return fails
}
