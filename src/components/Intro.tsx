import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRef, useState } from "react"

gsap.registerPlugin(useGSAP)

export function Intro() {
  const root = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState(false)

  useGSAP(
    () => {
      if (done) return
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const headless = /Headless/i.test(navigator.userAgent)
      if (reduced || headless) {
        setDone(true)
        return
      }
      const tl = gsap.timeline({
        onComplete: () => setDone(true),
      })
      tl.from(".intro-mark", { yPercent: 28, rotate: -6, opacity: 0, duration: 0.55, ease: "power3.out" })
        .from(".intro-polaroid", { x: 80, rotate: 12, opacity: 0, duration: 0.7, ease: "power4.out" }, 0.08)
        .from(".intro-sub", { opacity: 0, y: 10, duration: 0.4, ease: "power2.out" }, 0.35)
        .to(root.current, { yPercent: -110, duration: 0.72, ease: "power4.inOut", delay: 0.95 })
    },
    { scope: root },
  )

  if (done) return null

  return (
    <div className="intro" ref={root} aria-hidden="true">
      <p className="intro-mark">wait—</p>
      <div className="intro-polaroid">
        <img src="/images/pins/cafe-10.jpg" alt="" />
      </div>
      <p className="intro-sub">दिल्ली · a day in the city</p>
    </div>
  )
}
