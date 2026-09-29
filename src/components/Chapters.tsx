import { HReel } from "./Scrapbook"
import { PLACE_BY_ID } from "../data/places"
import { useDay } from "../state"
import type { Place } from "../types"

function P(id: string): Place {
  const p = PLACE_BY_ID[id]
  if (!p) throw new Error(id)
  return p
}

const BITS = [
  "agrasen",
  "sunder",
  "red-fort",
  "qutub-minar",
  "humayun",
  "jama-masjid",
  "india-gate",
  "lodhi",
] as const

export function QuietBits() {
  const { openPlace } = useDay()
  return (
    <HReel
      id="bits"
      kicker="quiet + old"
      title="THE QUIET ONES"
      lede="stepwells, forts, gardens. scroll through them."
      frames={BITS.map((id) => {
        const place = P(id)
        return {
          src: place.image,
          alt: place.name,
          cap: place.name,
          note: place.kicker,
          onOpen: () => openPlace(place.id),
        }
      })}
    />
  )
}

const EATS = [
  { id: "paranthe", note: "1872" },
  { id: "karims", note: "mutton" },
  { id: "natraj", note: "dahi bhalle" },
  { id: "jalebi-wala", note: "hot" },
  { id: "majnu", note: "thukpa" },
  { id: "chandni-chowk", note: "walk it" },
] as const

export function Food() {
  const { openPlace } = useDay()
  return (
    <HReel
      id="food"
      kicker="eat first"
      title="EAT FIRST"
      lede="paratha, karim’s, jalebi. start hungry."
      frames={EATS.map((e) => {
        const place = P(e.id)
        return {
          src: place.image,
          alt: place.name,
          cap: place.name,
          note: e.note,
          onOpen: () => openPlace(place.id),
        }
      })}
    />
  )
}
