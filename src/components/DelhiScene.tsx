import { useEffect, useRef, useState } from "react"
import { PLACE_BY_ID } from "../data/places"
import { fetchAssetBlobUrl, readSculptCache } from "../lib/higgsfield"
import { soundscape } from "../lib/soundscape"
import { DelhiWorld, hasWebGL } from "../scene/DelhiWorld"
import { useDay } from "../state"

export interface DelhiSceneProps {
  onWorldReady?: (world: DelhiWorld) => void
  className?: string
}

export function DelhiScene({ onWorldReady, className = "" }: DelhiSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<DelhiWorld | null>(null)
  const { selected, openPlace, itinerary, showMetro, isNight } = useDay()
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null)
  const hoverIdRef = useRef<string | null>(null)
  const [webgl, setWebgl] = useState(true)
  const openPlaceRef = useRef(openPlace)
  const onWorldReadyRef = useRef(onWorldReady)
  useEffect(() => {
    openPlaceRef.current = openPlace
  }, [openPlace])
  useEffect(() => {
    onWorldReadyRef.current = onWorldReady
  }, [onWorldReady])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let world: DelhiWorld
    try {
      if (!hasWebGL()) throw new Error("no webgl")
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const low = window.matchMedia("(max-width: 700px)").matches
      world = new DelhiWorld(canvas, {
        reduced,
        low,
        atmosphere: "dusk",
        handlers: {
          onSelect: (id) => {
            soundscape.playChime()
            openPlaceRef.current(id)
          },
          onHover: (id, x, y) => {
            if (id && id !== hoverIdRef.current) soundscape.playChime()
            hoverIdRef.current = id
            setHover(id ? { id, x, y } : null)
          },
        },
      })
    } catch {
      setWebgl(false)
      return
    }
    world.start()
    worldRef.current = world
    onWorldReadyRef.current?.(world)

    const onGlb = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; url: string }>).detail
      if (!detail?.id || !detail.url) return
      void world.mountGenerated(detail.id, detail.url)
    }
    window.addEventListener("delhi:twin-glb", onGlb)
    const cache = readSculptCache()
    for (const [id, remote] of Object.entries(cache)) {
      void fetchAssetBlobUrl(remote)
        .then((url) => world.mountGenerated(id, url))
        .catch(() => {
          /* stale cache */
        })
    }

    const io = new IntersectionObserver(([e]) => {
      if (!e) return
      if (e.boundingClientRect.height < 8) return
      world.setActive(e.isIntersecting)
    })
    const kick = window.setTimeout(() => {
      io.observe(canvas)
    }, 400)

    return () => {
      window.clearTimeout(kick)
      io.disconnect()
      window.removeEventListener("delhi:twin-glb", onGlb)
      world.dispose()
      worldRef.current = null
      if (soundscape.active()) soundscape.stop()
    }
  }, [])

  useEffect(() => {
    worldRef.current?.setMetroVisible(showMetro)
  }, [showMetro])

  useEffect(() => {
    worldRef.current?.setNight(isNight)
  }, [isNight])

  useEffect(() => {
    worldRef.current?.setFocus(selected?.id ?? null)
  }, [selected])

  useEffect(() => {
    worldRef.current?.setItinerary(itinerary)
  }, [itinerary])

  if (!webgl) {
    return (
      <div className={`hero-media scene-media ${className}`}>
        <img src="/images/india-gate.jpg" alt="India Gate on Kartavya Path at dusk" />
        <div className="hero-veil" />
      </div>
    )
  }

  const hoverPlace = hover ? PLACE_BY_ID[hover.id] : null
  const tipPos = hover ? clampSceneTip(hover.x, hover.y) : null

  return (
    <div className={`hero-media scene-media ${className}`}>
      <canvas ref={canvasRef} className="delhi-canvas" aria-label="Delhi in three dimensions" />
      <div className="hero-veil scene-veil" />

      {hoverPlace && hover && tipPos && (
        <div
          className="scene-tip polaroid-tip"
          style={{ left: tipPos.left, top: tipPos.top }}
          role="status"
        >
          <div className="tip-header">
            {hoverPlace.image && <img src={hoverPlace.image} alt="" className="tip-thumb" />}
            <div>
              <b>{hoverPlace.name}</b>
            </div>
          </div>
          <span className="tip-meta">{hoverPlace.neighborhood} · {hoverPlace.bestTime}</span>
          <span className="tip-action">Click to inspect ↗</span>
        </div>
      )}

    </div>
  )
}

function clampSceneTip(x: number, y: number) {
  const w = 214
  const h = 118
  const pad = 14
  let left = x + 18
  let top = y + 14
  const maxW = typeof window === "undefined" ? 1200 : window.innerWidth
  const maxH = typeof window === "undefined" ? 800 : window.innerHeight
  if (left + w > maxW - pad) left = x - w - 10
  if (top + h > maxH - 88) top = y - h - 10
  if (left < pad) left = pad
  if (top < 64) top = 64
  return { left, top }
}
