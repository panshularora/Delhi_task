import type { Place } from "../types"

export const ZONES = ["old", "central", "south", "east", "west"] as const
export type Zone = (typeof ZONES)[number]

export const ZONE_META: Record<Zone, { label: string; line: string }> = {
  old: { label: "Old Delhi", line: "walled city. gali. jalebi." },
  central: { label: "Central", line: "cp. lodhi. the lawn." },
  south: { label: "South", line: "hauz. mehrauli. village." },
  east: { label: "East", line: "nizamuddin. the river side." },
  west: { label: "West", line: "karol bagh. the other loop." },
}

export function zoneOf(p: Place): Zone {
  const n = `${p.neighborhood} ${p.name}`.toLowerCase()
  if (/shahjahan|chandni|jama|old delhi|daryaganj|red fort|lal qila|kashmere/.test(n)) return "old"
  if (/nizamuddin|akshardham|noida|mathura|kalkaji|mayur/.test(n)) return "east"
  if (/karol|kamla|west|dwarka|rajouri|civil lines/.test(n)) return "west"
  if (/mehrauli|hauz|south|saket|khirki|tughlaq|said-ul|qutub|champa|shahpur/.test(n)) return "south"
  if (/connaught|kartavya|central|raisina|janpath|ina|khan|lodhi|safdarjung|india gate/.test(n)) {
    return "central"
  }
  if (p.lng > 77.26) return "east"
  if (p.lat > 28.66) return "old"
  if (p.lat < 28.55) return "south"
  if (p.lng < 77.18) return "west"
  return "central"
}
