import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { lazy, Suspense, useRef } from "react"
import { Food, QuietBits } from "./components/Chapters"
import { Dock } from "./components/Dock"
import { Explore } from "./components/Explore"
import { Hero } from "./components/Hero"
import { Intro } from "./components/Intro"
import { Marquee } from "./components/Marquee"
import { Metro } from "./components/Metro"
import { Nav } from "./components/Nav"
import { Overlay } from "./components/Overlay"
import { Plan } from "./components/Plan"
import { Orbit } from "./components/Orbit"
import { DayPath, FivePm, Hangouts, LateNight, Morning, WhereWeGo } from "./components/Scrapbook"
import { SmoothScroll } from "./components/SmoothScroll"
import { Twin } from "./components/Twin"
import { DayProvider } from "./state"

const DelhiMap = lazy(() => import("./components/DelhiMap"))

gsap.registerPlugin(useGSAP, ScrollTrigger)

function Frame() {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const blocks = gsap.utils.toArray<HTMLElement>(".chapter")
      for (const el of blocks) {
        const bits = el.querySelectorAll(".chapter-kicker, h2, .lede")
        if (bits.length) {
          gsap.from(bits, {
            opacity: 0,
            y: 22,
            duration: 0.55,
            stagger: 0.06,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 82%",
              toggleActions: "play none none none",
            },
          })
        }
        const cards = el.querySelectorAll(".from-right")
        if (cards.length) {
          gsap.from(cards, {
            opacity: 0,
            y: 28,
            scale: 0.98,
            duration: 0.52,
            stagger: 0.07,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 78%",
              toggleActions: "play none none none",
            },
          })
        }
      }
      gsap.from(".foot > *", {
        y: 28,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ".foot", start: "top 92%" },
      })
    },
    { scope: root },
  )

  return (
    <div ref={root}>
      <a className="skip" href="#am">
        Skip to morning
      </a>
      <SmoothScroll />
      <Intro />
      <Nav />
      <Hero />
      <Marquee />
      <DayPath />
      <Orbit />
      <Morning />
      <WhereWeGo />
      <FivePm />
      <LateNight />
      <Hangouts />
      <Explore />
      <Twin />
      <Suspense
        fallback={
          <section className="chapter" id="map">
            <p className="status">Loading the map…</p>
          </section>
        }
      >
        <DelhiMap />
      </Suspense>
      <Food />
      <QuietBits />
      <Metro />
      <Plan />
      <footer className="foot">
        <div>
          <strong>
            दिल्ली <span>my delhi</span>
          </strong>
          <p>OpenStreetMap · Open-Meteo · OSRM · Open Transit Data</p>
        </div>
        <p className="hand">28.61°N</p>
      </footer>
      <Overlay />
      <Dock />
    </div>
  )
}

export default function App() {
  return (
    <DayProvider>
      <Frame />
    </DayProvider>
  )
}
