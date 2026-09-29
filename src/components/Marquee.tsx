import { PLACES } from "../data/places"

const LINE =
  "morning  ·  yellow line  ·  satya n  ·  champa gali  ·  shahpur jat  ·  momos  ·  hauz khas  ·  5pm  ·  dhan mill  ·  11:47  ·  cp  ·  kamla nagar  ·  mkt  ·  last train  ·  " +
  PLACES.map((p) => p.name).join("  ·  ")

export function Marquee() {
  return (
    <div className="craft-marquee" aria-hidden="true">
      <div className="craft-marquee-track">
        <span>{LINE}  ·  {LINE}</span>
        <span>{LINE}  ·  {LINE}</span>
      </div>
    </div>
  )
}
