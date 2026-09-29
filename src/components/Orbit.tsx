import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useMemo, useRef, useState, type CSSProperties } from "react"
import { CATEGORY_META, PLACES } from "../data/places"
import { METRO_STATIONS } from "../data/metro"
import { useDay } from "../state"
import type { Category } from "../types"
import { Magnetic } from "./Magnetic"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const WORDS: { label: string; cat: Category | "metro"; href?: string }[] = [
  { label: "Food", cat: "food" },
  { label: "Night", cat: "nightlife" },
  { label: "Heritage", cat: "heritage" },
  { label: "Hidden", cat: "hidden" },
  { label: "Markets", cat: "market" },
  { label: "Metro", cat: "metro", href: "#metro" },
]

function Count({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.textContent = `${to}${suffix}`
        return
      }
      const obj = { n: 0 }
      gsap.to(obj, {
        n: to,
        duration: 1.15,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
        onUpdate: () => {
          el.textContent = `${Math.round(obj.n)}${suffix}`
        },
      })
    },
    { scope: ref, dependencies: [to, suffix] },
  )
  return <b ref={ref}>{to}{suffix}</b>
}

export function Orbit() {
  const { setCategory, openPlace, weather, category } = useDay()
  const [open, setOpen] = useState<Category | null>(null)
  const root = useRef<HTMLElement>(null)

  const burst = useMemo(() => {
    if (!open) return []
    const primary = PLACES.filter((p) => p.category === open)
    const extra = PLACES.filter((p) => p.category !== open && p.tags.includes(open))
    return [...primary, ...extra].slice(0, 6)
  }, [open])

  const pick = (cat: Category) => {
    if (open === cat) {
      setOpen(null)
      setCategory("all")
      return
    }
    setCategory(cat)
    setOpen(cat)
  }

  return (
    <section className="orbit" id="want" ref={root}>
      <p className="hand orbit-ask">what are you looking for</p>
      <div className="orbit-stage">
        <p className="orbit-core" aria-hidden="true">
          दिल्ली
        </p>
        <div className="orbit-ring">
          {WORDS.map((w, i) => {
            const on = w.cat === category || w.cat === open
            return (
              <div
                key={w.label}
                className="orbit-slot"
                style={
                  {
                    "--deg": `${i * 60}deg`,
                    "--ndeg": `${-i * 60}deg`,
                  } as CSSProperties
                }
              >
                <Magnetic strength={0.22}>
                  {w.href ? (
                    <a href={w.href} className={`orbit-word${on ? " is-on" : ""}`}>
                      {w.label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={`orbit-word${on ? " is-on" : ""}`}
                      aria-pressed={open === w.cat}
                      onClick={() => pick(w.cat as Category)}
                    >
                      {w.label}
                    </button>
                  )}
                </Magnetic>
              </div>
            )
          })}
        </div>
      </div>
      {burst.length > 0 && (
        <ul className="orbit-burst" aria-label={`${CATEGORY_META[open!].label} nearby`}>
          {burst.map((p, i) => (
            <li key={p.id} style={{ ["--delay" as string]: `${i * 45}ms` }}>
              <button type="button" onClick={() => openPlace(p.id)}>
                <img src={p.image} alt="" />
                <span>{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <dl className="orbit-stats">
        <div>
          <dt>now</dt>
          <dd>
            <Count to={weather?.temp ?? 0} suffix="°" />
          </dd>
        </div>
        <div>
          <dt>aqi</dt>
          <dd>
            <Count to={weather?.aqi ?? 0} />
          </dd>
        </div>
        <div>
          <dt>stations</dt>
          <dd>
            <Count to={METRO_STATIONS.length} />
          </dd>
        </div>
        <div>
          <dt>places</dt>
          <dd>
            <Count to={PLACES.length} />
          </dd>
        </div>
      </dl>
    </section>
  )
}
