import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import "lenis/dist/lenis.css"
import { useEffect } from "react"

gsap.registerPlugin(ScrollTrigger)

export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const lenis = reduced
      ? null
      : new Lenis({
          lerp: 0.08,
          smoothWheel: true,
          syncTouch: true,
          wheelMultiplier: 0.82,
          touchMultiplier: 1.12,
          autoRaf: false,
          anchors: false,
          overscroll: false,
          allowNestedScroll: true,
          prevent: (node) =>
            Boolean(node.closest(".sheet, .overlay, .map-canvas, [data-lenis-prevent]")),
        })

    const onScrollTo = (e: Event) => {
      const y = (e as CustomEvent<number>).detail
      if (lenis) lenis.scrollTo(y, { duration: 1.45, offset: 0 })
      else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" })
    }
    window.addEventListener("delhi:scrollTo", onScrollTo)

    const clickHash = (e: MouseEvent, scroller: Lenis | null) => {
      const a = (e.target as HTMLElement | null)?.closest("a[href^='#']")
      if (!a) return
      const href = a.getAttribute("href")
      if (!href || href === "#") return
      const target = document.querySelector(href)
      if (!(target instanceof HTMLElement)) return
      e.preventDefault()
      if (scroller) scroller.scrollTo(target, { offset: -4, duration: 1.4 })
      else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" })
    }

    if (!lenis) {
      const onClick = (e: MouseEvent) => clickHash(e, null)
      document.addEventListener("click", onClick)
      requestAnimationFrame(() => {
        const hash = window.location.hash
        if (!hash || hash === "#") return
        const target = document.querySelector(hash)
        if (target instanceof HTMLElement) target.scrollIntoView()
      })
      return () => {
        window.removeEventListener("delhi:scrollTo", onScrollTo)
        document.removeEventListener("click", onClick)
      }
    }

    lenis.on("scroll", ScrollTrigger.update)
    lenis.on("scroll", ({ velocity }: { velocity: number }) => {
      const v = Math.max(-1, Math.min(1, velocity / 28))
      document.documentElement.style.setProperty("--scroll-v", v.toFixed(3))
    })
    const tick = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    document.documentElement.classList.add("has-lenis")

    const onClick = (e: MouseEvent) => clickHash(e, lenis)
    document.addEventListener("click", onClick)

    const jumpHash = () => {
      const hash = window.location.hash
      if (!hash || hash === "#") return
      const target = document.querySelector(hash)
      if (!(target instanceof HTMLElement)) return
      lenis.scrollTo(target, { offset: -4, immediate: true })
      ScrollTrigger.refresh()
    }
    window.setTimeout(jumpHash, 80)

    return () => {
      window.removeEventListener("delhi:scrollTo", onScrollTo)
      document.removeEventListener("click", onClick)
      gsap.ticker.remove(tick)
      lenis.destroy()
      document.documentElement.classList.remove("has-lenis")
    }
  }, [])

  return null
}
