import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { lazy, Suspense, useCallback, useRef, useState } from "react"
import { scrollToY } from "../lib/scroll"
import type { DelhiWorld } from "../scene/DelhiWorld"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const DelhiScene = lazy(() =>
  import("./DelhiScene").then((m) => ({ default: m.DelhiScene })),
)

type Beat = {
  id: string
  label: string
  at: number
  kicker: string
  title: string
  line: string
}

const BEATS: Beat[] = [
  {
    id: "sky",
    label: "Sky",
    at: 0,
    kicker: "a fly-through",
    title: "The city from above",
    line: "India Gate to Qutub to Humayun to the Red Fort.",
  },
  {
    id: "gate",
    label: "Gate",
    at: 0.32,
    kicker: "Kartavya Path",
    title: "India Gate",
    line: "Kartavya Path at 6. Ice cream. The photo. Leave.",
  },
  {
    id: "minar",
    label: "Minar",
    at: 0.56,
    kicker: "Mehrauli",
    title: "Qutub",
    line: "Look up. Twenty minutes. Metro out.",
  },
  {
    id: "tomb",
    label: "Tomb",
    at: 0.72,
    kicker: "Nizamuddin",
    title: "Humayun",
    line: "Garden geometry. Go early.",
  },
  {
    id: "fort",
    label: "Fort",
    at: 0.86,
    kicker: "Shahjahanabad",
    title: "Red Fort",
    line: "Old city. Then back to photos.",
  },
]

export function Twin() {
  const containerRef = useRef<HTMLElement>(null)
  const worldRef = useRef<DelhiWorld | null>(null)
  const [active, setActive] = useState(0)
  const onWorldReady = useCallback((w: DelhiWorld) => {
    worldRef.current = w
  }, [])

  useGSAP(
    () => {
      const container = containerRef.current
      if (!container) return
      const trigger = ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.85,
        onUpdate: (self) => {
          const progress = self.progress
          worldRef.current?.setScrollProgress(progress)
          let s = 0
          for (let i = 0; i < BEATS.length; i++) {
            if (progress >= (BEATS[i]?.at ?? 0) - 0.04) s = i
          }
          setActive(s)
        },
      })
      return () => trigger.kill()
    },
    { scope: containerRef },
  )

  const onPointer = (e: React.PointerEvent) => {
    const { innerWidth, innerHeight } = window
    const x = (e.clientX / innerWidth - 0.5) * 2
    const y = (e.clientY / innerHeight - 0.5) * 2
    worldRef.current?.setLookNudge(x, y)
  }

  const jumpTo = (idx: number) => {
    const container = containerRef.current
    if (!container) return
    const top = container.getBoundingClientRect().top + (window.scrollY || document.documentElement.scrollTop)
    const run = container.offsetHeight - window.innerHeight
    scrollToY(top + run * (BEATS[idx]?.at ?? 0))
  }

  const beat = BEATS[active] ?? BEATS[0]!

  return (
    <section className="twin-scrolly" ref={containerRef} id="twin" onPointerMove={onPointer}>
      <div className="twin-sticky">
        <Suspense
          fallback={
            <div className="hero-media">
              <img src="/images/india-gate.jpg" alt="" />
            </div>
          }
        >
          <DelhiScene onWorldReady={onWorldReady} />
        </Suspense>
        <div className="twin-caption" key={beat.id}>
          <p className="hand">{beat.kicker}</p>
          <h2>{beat.title}</h2>
          <p>{beat.line}</p>
        </div>
        <nav className="scrolly-milestones" aria-label="Twin beats">
          {BEATS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              className={`milestone-pill${active === idx ? " is-active" : ""}`}
              onClick={() => jumpTo(idx)}
              title={s.title}
            >
              <span className="pill-dot" />
              <span className="pill-label">{s.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  )
}
