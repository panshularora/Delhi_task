import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useRef } from "react"
import SplitType from "split-type"
import { Magnetic } from "./Magnetic"
import { Polaroid } from "./Polaroid"

gsap.registerPlugin(useGSAP, ScrollTrigger)

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const lineRef = useRef<HTMLParagraphElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

      const en = root.current?.querySelector(".zine-en")
      let wordSplit: SplitType | null = null
      if (en instanceof HTMLElement) {
        wordSplit = new SplitType(en, { types: "chars", tagName: "span" })
        gsap.from(wordSplit.chars, {
          yPercent: 120,
          opacity: 0,
          rotate: -8,
          stagger: 0.045,
          duration: 0.9,
          ease: "power4.out",
          delay: 0.08,
        })
      }
      const line = lineRef.current
      let split: SplitType | null = null
      if (line) {
        split = new SplitType(line, { types: "chars", tagName: "span" })
        gsap.from(split.chars, {
          yPercent: 110,
          opacity: 0,
          stagger: 0.016,
          duration: 0.62,
          ease: "power4.out",
          delay: 0.42,
        })
      }

      const shots = gsap.utils.toArray<HTMLElement>(".zine-shot")
      gsap.fromTo(
        shots,
        { y: 64, opacity: 0, scale: 1.06 },
        { y: 0, opacity: 1, scale: 1, duration: 1.05, stagger: 0.12, ease: "power4.out", delay: 0.18 },
      )

      const trigger = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom top",
        scrub: 0.7,
        onUpdate: (self) => {
          const p = self.progress
          const type = root.current?.querySelector(".zine-type")
          const collage = root.current?.querySelector(".zine-collage")
          if (type instanceof HTMLElement) gsap.set(type, { y: p * -56, x: p * -24, opacity: 1 - p * 0.7 })
          if (collage instanceof HTMLElement) gsap.set(collage, { y: p * 48, scale: 1 + p * 0.08 })
          shots.forEach((shot, i) => {
            gsap.set(shot, { y: p * (18 + i * 22) })
          })
        },
      })

      return () => {
        wordSplit?.revert()
        split?.revert()
        trigger.kill()
      }
    },
    { scope: root },
  )

  return (
    <section className="zine-hero" id="top" ref={root}>
      <div className="zine-hero-inner">
        <div className="zine-type">
          <p className="hand zine-kicker">ok so this is</p>
          <h1 className="zine-word">
            <a className="zine-en" href="#want">
              DELHI
            </a>
            <span className="zine-hi">दिल्ली</span>
          </h1>
          <p className="zine-cut" ref={lineRef}>
            metro. chai. then the rest.
          </p>
          <p className="zine-sub">7:40 yellow line. 5pm dust. 11:47 still out.</p>
          <Magnetic>
            <a className="btn zine-cta" href="#am">
              start the day
            </a>
          </Magnetic>
        </div>

        <div className="zine-collage">
          <div className="zine-shot is-cafe">
            <Polaroid
              src="/images/pins/cafe-1.jpg"
              alt="Hauz Khas cafe terrace"
              caption="hauz khas · weekday"
              rotate={0}
            />
          </div>
          <div className="zine-shot is-coffee">
            <Polaroid
              src="/images/pins/cafe-8.jpg"
              alt="Hauz cafe interior"
              caption="first coffee"
              rotate={0}
            />
            <span className="sticker sticker-n">28.61°N</span>
          </div>
          <div className="zine-shot is-momo">
            <Polaroid
              src="/images/pins/momo-1.jpg"
              alt="Street momos on a paper plate"
              caption="momos. obviously."
              rotate={0}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
