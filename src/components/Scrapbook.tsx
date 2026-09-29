import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useRef } from "react"
import { useDay } from "../state"
import { Polaroid } from "./Polaroid"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const P = {
  metroPlat: "/images/pins/metro-2.jpg",
  metroIn: "/images/pins/metro-4.jpg",
  metroY: "/images/pins/metro-5.jpg",
  metroCar: "/images/pins/metro-1.jpg",
  terrace: "/images/pins/cafe-1.jpg",
  lamps: "/images/pins/cafe-2.jpg",
  tea: "/images/pins/cafe-3.jpg",
  lake: "/images/pins/cafe-4.jpg",
  stairs: "/images/pins/cafe-5.jpg",
  chandelier: "/images/pins/cafe-6.jpg",
  pink: "/images/pins/cafe-7.jpg",
  coffee: "/images/pins/cafe-8.jpg",
  social: "/images/pins/cafe-10.jpg",
  cpNight: "/images/pins/cp-1.jpg",
  cpWalk: "/images/pins/cp-4.jpg",
  cpDusk: "/images/pins/cp-6.jpg",
  cpGold: "/images/pins/cp-9.jpg",
  hauzNeon: "/images/pins/hauz-n1.jpg",
  hauzBar: "/images/pins/hauz-n2.jpg",
  hauzTunnel: "/images/pins/hauz-n4.jpg",
  momo: "/images/pins/momo-1.jpg",
  momoPlate: "/images/pins/momo-3.jpg",
} as const

function skipMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

const ENTER = [
  { from: "circle(0% at 48% 42%)", to: "circle(85% at 48% 42%)" },
  { from: "inset(100% 0% 0% 0%)", to: "inset(0% 0% 0% 0%)" },
  { from: "inset(40% 40% 40% 40%)", to: "inset(0% 0% 0% 0%)" },
  { from: "polygon(0 0, 100% 0, 100% 0, 0 0)", to: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" },
] as const

type PlateFrame = {
  src: string
  alt: string
  cap: string
  line: string
}

function StoryPin({
  id,
  kicker,
  title,
  frames,
}: {
  id: string
  kicker: string
  title: string
  frames: PlateFrame[]
}) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      const stills = gsap.utils.toArray<HTMLElement>(".plate-still")
      const imgs = gsap.utils.toArray<HTMLElement>(".plate-still img")
      const lines = gsap.utils.toArray<HTMLElement>(".plate-line")
      const ticks = gsap.utils.toArray<HTMLElement>(".plate-tick")
      const nums = gsap.utils.toArray<HTMLElement>(".plate-num")
      const type = el.querySelector(".plate-type")
      const frame = el.querySelector(".plate-frame")

      if (skipMotion()) {
        stills.forEach((n, i) => {
          n.style.clipPath = "none"
          n.style.opacity = i === 0 ? "1" : "0"
        })
        lines.forEach((n, i) => {
          n.style.opacity = i === 0 ? "1" : "0"
        })
        return
      }

      gsap.set(stills, {
        clipPath: "inset(0% 0% 0% 0%)",
        opacity: 0,
        scale: 1,
        filter: "blur(0px)",
      })
      gsap.set(stills[0], { opacity: 1 })
      gsap.set(imgs, { scale: 1 })
      gsap.set(lines, { opacity: 0, y: 22 })
      gsap.set(lines[0], { opacity: 1, y: 0 })
      gsap.set(ticks, { scaleX: 0.22, backgroundColor: "rgba(247,241,234,0.22)" })
      if (ticks[0]) gsap.set(ticks[0], { scaleX: 1, backgroundColor: "#ff5666" })
      gsap.set(nums, { opacity: 0.28 })
      if (nums[0]) gsap.set(nums[0], { opacity: 1 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.85,
          pin: ".plate-pin",
          anticipatePin: 1,
          fastScrollEnd: true,
          onUpdate: (self) => {
            if (type instanceof HTMLElement) gsap.set(type, { y: self.progress * -28 })
            if (frame instanceof HTMLElement) gsap.set(frame, { y: self.progress * 18 })
          },
        },
      })

      stills.forEach((shot, i) => {
        const img = imgs[i]
        if (i === 0) {
          if (img) tl.to(img, { scale: 1.1, duration: 0.28, ease: "none" }, 0)
          return
        }
        const start = i * 0.34
        const mask = ENTER[i % ENTER.length]!
        tl.set(shot, { clipPath: mask.from, opacity: 1, scale: 1.04 }, start)
        tl.to(
          shot,
          { clipPath: mask.to, scale: 1, duration: 0.22, ease: "none" },
          start,
        )
        tl.to(
          stills[i - 1]!,
          { opacity: 0, scale: 1.18, duration: 0.18, ease: "none" },
          start,
        )
        if (img) tl.fromTo(img, { scale: 1.14 }, { scale: 1.02, duration: 0.28, ease: "none" }, start)
        tl.to(lines, { opacity: 0, y: -14, duration: 0.07, ease: "none" }, start)
        if (lines[i]) tl.to(lines[i], { opacity: 1, y: 0, duration: 0.1, ease: "none" }, start + 0.05)
        tl.to(ticks, { scaleX: 0.22, backgroundColor: "rgba(247,241,234,0.22)", duration: 0.08 }, start)
        if (ticks[i]) tl.to(ticks[i], { scaleX: 1, backgroundColor: "#ff5666", duration: 0.08 }, start)
        tl.to(nums, { opacity: 0.28, duration: 0.08 }, start)
        if (nums[i]) tl.to(nums[i], { opacity: 1, duration: 0.08 }, start)
      })

      return () => {
        tl.scrollTrigger?.kill()
        tl.kill()
      }
    },
    { scope: root },
  )

  return (
    <section className="plate" id={id} ref={root} style={{ height: `${Math.max(frames.length, 2) * 110}vh` }}>
      <div className="plate-pin">
        <div className="plate-type">
          <p className="hand plate-kicker">{kicker}</p>
          <h2>{title}</h2>
          <ol className="plate-nums" aria-hidden="true">
            {frames.map((_, i) => (
              <li key={i} className="plate-num">
                {String(i + 1).padStart(2, "0")}
              </li>
            ))}
          </ol>
          <div className="plate-line-slot">
            {frames.map((f) => (
              <p key={f.line} className="plate-line">
                {f.line}
              </p>
            ))}
          </div>
          <div className="plate-ticks" aria-hidden="true">
            {frames.map((f) => (
              <i key={f.cap} className="plate-tick" />
            ))}
          </div>
        </div>
        <div className="plate-stage">
          <div className="plate-frame">
            {frames.map((f, i) => (
              <figure key={f.src + f.cap} className="plate-still" style={{ zIndex: i + 1 }}>
                <img src={f.src} alt={f.alt} />
                <figcaption className="mag-cap">{f.cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export type ReelFrame = {
  src: string
  alt: string
  cap: string
  note?: string
  onOpen?: () => void
}

export function HReel({
  id,
  kicker,
  title,
  lede,
  frames,
}: {
  id: string
  kicker: string
  title: string
  lede: string
  frames: ReelFrame[]
}) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      if (skipMotion()) return
      if (window.matchMedia("(max-width: 860px)").matches) return
      const track = el.querySelector(".reel-track")
      const stage = el.querySelector(".reel-stage")
      const copy = el.querySelector(".reel-copy")
      if (!(track instanceof HTMLElement) || !(stage instanceof HTMLElement)) return
      const panels = gsap.utils.toArray<HTMLElement>(".reel-panel")
      const notes = gsap.utils.toArray<HTMLElement>(".reel-live")
      const imgs = panels.map((p) => p.querySelector("img"))
      gsap.set(panels, { transformOrigin: "50% 50%", clipPath: "inset(0% 0% 0% 0%)" })
      gsap.set(notes, { opacity: 0, y: 16 })
      if (notes[0]) gsap.set(notes[0], { opacity: 1, y: 0 })

      const tween = gsap.to(track, {
        x: () => {
          const w = panels[0]?.getBoundingClientRect().width || stage.clientWidth
          return -(w * Math.max(panels.length - 1, 0))
        },
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          pin: ".reel-pin",
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = self.progress * Math.max(panels.length - 1, 1)
            let best = 0
            let bestD = Infinity
            panels.forEach((panel, i) => {
              const t = idx - i
              const d = Math.min(1, Math.abs(t))
              const rise = t < 0 ? Math.min(1, -t) : 0
              gsap.set(panel, {
                scale: 1 + Math.max(0, t) * 0.1,
                opacity: 1 - d * 0.2,
                clipPath: rise > 0.02 ? `inset(${rise * 100}% 0% 0% 0%)` : "inset(0% 0% 0% 0%)",
                filter: `blur(${d * 6}px)`,
              })
              const img = imgs[i]
              if (img) gsap.set(img, { scale: 1.04 + (1 - d) * 0.08 })
              if (Math.abs(t) < bestD) {
                bestD = Math.abs(t)
                best = i
              }
            })
            notes.forEach((n, i) => {
              gsap.set(n, { opacity: i === best ? 1 : 0, y: i === best ? 0 : 14 })
            })
            if (copy instanceof HTMLElement) {
              gsap.set(copy, { y: self.progress * -24 })
            }
          },
        },
      })
      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    },
    { scope: root },
  )

  return (
    <section
      className="reel"
      id={id}
      ref={root}
      style={{ height: `${Math.max(frames.length, 2) * 120}vh` }}
    >
      <div className="reel-pin">
        <div className="reel-copy">
          <p className="hand">{kicker}</p>
          <h2>{title}</h2>
          <p className="reel-lede">{lede}</p>
          <div className="reel-live-slot">
            {frames.map((f) => (
              <p key={f.cap} className="reel-live">
                <b>{f.cap}</b>
                {f.note ? <span className="hand">{f.note}</span> : null}
              </p>
            ))}
          </div>
        </div>
        <div className="reel-stage">
          <div className="reel-track">
            {frames.map((f) => (
              <figure
                className="reel-panel"
                key={f.cap}
                onClick={f.onOpen}
                onKeyDown={
                  f.onOpen
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          f.onOpen?.()
                        }
                      }
                    : undefined
                }
                role={f.onOpen ? "button" : undefined}
                tabIndex={f.onOpen ? 0 : undefined}
              >
                <img src={f.src} alt={f.alt} />
                <figcaption>
                  <span>{f.cap}</span>
                  {f.note ? <em className="hand">{f.note}</em> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const DAY_STOPS = [
  { t: "7:40", n: "metro + chai", href: "#am" },
  { t: "noon", n: "village", href: "#go" },
  { t: "5pm", n: "dust hour", href: "#five" },
  { t: "11:47", n: "still out", href: "#late" },
] as const

export function DayPath() {
  const root = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const el = root.current
      if (!el || skipMotion()) return
      gsap.from(".day-path-item a", {
        y: 22,
        opacity: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      })
      gsap.fromTo(
        ".day-path-line",
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: "left center",
          duration: 1,
          stagger: 0.14,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        },
      )
      const am = document.querySelector("#am")
      const late = document.querySelector("#late")
      const items = gsap.utils.toArray<HTMLElement>(".day-path-item a")
      if (am instanceof HTMLElement && late instanceof HTMLElement && items.length) {
        ScrollTrigger.create({
          trigger: am,
          endTrigger: late,
          start: "top center",
          end: "bottom center",
          onUpdate: (self) => {
            const i = Math.round(self.progress * (items.length - 1))
            items.forEach((n, k) => {
              n.classList.toggle("is-now", k === i)
            })
          },
        })
      }
    },
    { scope: root },
  )
  return (
    <nav className="day-path" aria-label="A day in Delhi" ref={root}>
      {DAY_STOPS.map((s, i) => (
        <span key={s.href} className="day-path-item">
          {i > 0 ? <i className="day-path-line" aria-hidden="true" /> : null}
          <a href={s.href}>
            <time>{s.t}</time>
            <b>{s.n}</b>
          </a>
        </span>
      ))}
    </nav>
  )
}

export function Morning() {
  return (
    <StoryPin
      id="am"
      kicker="7:40 am"
      title="BEFORE THE HEAT"
      frames={[
        {
          src: P.metroPlat,
          alt: "Yellow line train at a Delhi metro platform",
          cap: "yellow line in",
          line: "platform. yellow line. nobody talking yet.",
        },
        {
          src: P.metroIn,
          alt: "Inside a packed Delhi metro coach",
          cap: "headphones on",
          line: "coach full. next stop. get off.",
        },
        {
          src: P.coffee,
          alt: "Cafe interior, first coffee",
          cap: "first coffee",
          line: "chai, then coffee. then the day starts.",
        },
      ]}
    />
  )
}

export function WhereWeGo() {
  return (
    <StoryPin
      id="go"
      kicker="afternoon"
      title="WHERE WE GO"
      frames={[
        {
          src: P.stairs,
          alt: "Hauz Khas village stairs",
          cap: "hauz village",
          line: "the village. stairs first. then the lake.",
        },
        {
          src: P.lake,
          alt: "Hauz Khas lake",
          cap: "the lake",
          line: "terrace. lake. don't check your phone.",
        },
        {
          src: P.tea,
          alt: "Tea room courtyard with hanging flowers",
          cap: "tea room",
          line: "courtyard. hanging flowers. sit.",
        },
        {
          src: P.momo,
          alt: "Street momos on a paper plate",
          cap: "momos",
          line: "paper plate. steam. that's lunch.",
        },
      ]}
    />
  )
}

export function FivePm() {
  return (
    <StoryPin
      id="five"
      kicker="5 pm"
      title="DUST HOUR"
      frames={[
        {
          src: P.cpGold,
          alt: "Connaught Place colonnade in late sun",
          cap: "cp going gold",
          line: "colonnade goes gold. 5pm. walk it.",
        },
        {
          src: P.cpDusk,
          alt: "CP Warehouse Cafe at dusk",
          cap: "warehouse cafe",
          line: "warehouse cafe. light is leaving.",
        },
        {
          src: P.lamps,
          alt: "Hauz courtyard lamps at golden hour",
          cap: "lamps on",
          line: "hauz lamps. first drink.",
        },
        {
          src: P.chandelier,
          alt: "Cafe chandelier and leather chairs",
          cap: "this table again",
          line: "this table. same chairs. stay.",
        },
      ]}
    />
  )
}

export function LateNight() {
  return (
    <StoryPin
      id="late"
      kicker="11:47 pm"
      title="STILL OUT"
      frames={[
        {
          src: P.cpNight,
          alt: "Connaught Place at night with an auto",
          cap: "cp · indira chowk",
          line: "wet pavement. autos. cp after dark.",
        },
        {
          src: P.hauzNeon,
          alt: "Hauz Khas Social neon at night",
          cap: "hauz still open",
          line: "hauz neon. still open.",
        },
        {
          src: P.hauzBar,
          alt: "Red-lit Hauz Khas Social bar",
          cap: "the bar",
          line: "one more. then last train.",
        },
        {
          src: P.metroCar,
          alt: "Last metro coach of the night",
          cap: "last train energy",
          line: "yellow line home. or not.",
        },
      ]}
    />
  )
}

const HANGOUTS = [
  { src: P.terrace, cap: "Hauz Khas", note: "the terrace", id: "hauz-khas" },
  { src: P.lake, cap: "the lake", note: "from social" },
  { src: P.tea, cap: "Champa Gali", note: "the alley" },
  { src: P.social, cap: "Hauz Social", note: "neon" },
  { src: P.cpGold, cap: "CP", note: "inner circle", id: "connaught" },
  { src: P.cpDusk, cap: "CP dusk", note: "warehouse cafe" },
  { src: P.momo, cap: "momos", note: "the plate" },
  { src: P.pink, cap: "the gali", note: "after 11" },
] as const

export function Hangouts() {
  const root = useRef<HTMLElement>(null)
  const { openPlace } = useDay()

  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      if (skipMotion()) return
      if (window.matchMedia("(max-width: 860px)").matches) return
      const track = el.querySelector(".hang-track")
      const head = el.querySelector(".hang-head")
      if (!(track instanceof HTMLElement)) return
      const cards = gsap.utils.toArray<HTMLElement>(".hang-card")
      gsap.set(cards, { transformOrigin: "50% 80%" })
      const tween = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth + 48),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.55,
          pin: ".hang-pin",
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const mid = window.innerWidth * 0.38
            for (const card of cards) {
              const r = card.getBoundingClientRect()
              const c = r.left + r.width / 2
              const d = Math.min(1, Math.abs(c - mid) / 380)
              gsap.set(card, {
                scale: 1.08 - d * 0.22,
                opacity: 1 - d * 0.4,
                filter: `blur(${d * 7}px)`,
                y: d * 18,
              })
            }
            if (head instanceof HTMLElement) gsap.set(head, { x: self.progress * -120, y: self.progress * -10 })
          },
        },
      })
      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    },
    { scope: root },
  )

  return (
    <section
      className="hang-scrolly"
      id="hang"
      ref={root}
      style={{ height: `${Math.max(HANGOUTS.length, 3) * 70}vh` }}
    >
      <div className="hang-pin">
        <div className="hang-head">
          <p className="hand">the loop</p>
          <h2>same eight places</h2>
        </div>
        <div className="hang-track">
          {HANGOUTS.map((h) => (
            <div className="hang-card" key={h.cap}>
              <Polaroid
                src={h.src}
                alt={h.cap}
                caption={h.cap}
                note={h.note}
                rotate={0}
                onOpen={"id" in h ? () => openPlace(h.id) : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
