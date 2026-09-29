import gsap from "gsap"
import { useEffect, useRef, type ReactNode } from "react"

export function Magnetic({
  children,
  strength = 0.38,
  className = "",
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine || reduced) return

    const xTo = gsap.quickTo(el, "x", { duration: 0.42, ease: "power3.out" })
    const yTo = gsap.quickTo(el, "y", { duration: 0.42, ease: "power3.out" })

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const onLeave = () => {
      xTo(0)
      yTo(0)
    }

    el.addEventListener("mousemove", onMove)
    el.addEventListener("mouseleave", onLeave)
    return () => {
      el.removeEventListener("mousemove", onMove)
      el.removeEventListener("mouseleave", onLeave)
      gsap.set(el, { x: 0, y: 0 })
    }
  }, [strength])

  return (
    <div ref={ref} className={`magnetic${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  )
}
