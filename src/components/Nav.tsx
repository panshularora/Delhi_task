import { useEffect, useRef, useState } from "react"
import { weatherLabel } from "../lib/apis"
import { useDay } from "../state"

const LINKS = [
  ["#am", "Morning"],
  ["#go", "Afternoon"],
  ["#five", "5pm"],
  ["#late", "Night"],
  ["#hang", "Loop"],
  ["#explore", "Find"],
  ["#twin", "Twin"],
] as const

export function Nav() {
  const { weather, saved } = useDay()
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState("")
  const list = useRef<HTMLElement>(null)
  const [ink, setInk] = useState({ x: 0, w: 0 })

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setSolid(y > 40)
      if (y < window.innerHeight * 0.45) setActive("")
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const ids = LINKS.map(([href]) => href.slice(1))
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => Boolean(n))
    if (!nodes.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (vis?.target.id) setActive(`#${vis.target.id}`)
      },
      { rootMargin: "-28% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] },
    )
    for (const n of nodes) io.observe(n)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const nav = list.current
    if (!nav) return
    const link = active ? nav.querySelector<HTMLElement>(`a[href="${active}"]`) : null
    if (!link) {
      setInk({ x: 0, w: 0 })
      return
    }
    const nr = nav.getBoundingClientRect()
    const lr = link.getBoundingClientRect()
    setInk({ x: lr.left - nr.left, w: lr.width })
  }, [active, open])

  return (
    <header className={`nav${solid || open ? " is-solid" : ""}${open ? " is-open" : ""}`}>
      <a className="logo" href="#top" onClick={() => setOpen(false)}>
        दिल्ली <span>my delhi</span>
      </a>
      <nav className="nav-links" aria-label="Sections" ref={list}>
        <i className="nav-ink" style={{ transform: `translateX(${ink.x}px)`, width: ink.w }} aria-hidden="true" />
        {LINKS.map(([href, label]) => (
          <a
            key={href}
            className={`nav-link${active === href ? " is-on" : ""}`}
            href={href}
            onClick={() => setOpen(false)}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="wx" aria-live="polite">
        {weather ? (
          <>
            <b>{weather.temp}°</b>
            <span className="hide-sm">
              {weatherLabel(weather.code)} · AQI {weather.aqi ?? "—"}
              {saved.length ? ` · ${saved.length} kept` : ""}
            </span>
          </>
        ) : null}
      </div>
      <button
        className="nav-toggle chip"
        aria-expanded={open}
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Menu"}
      </button>
    </header>
  )
}
