import { useState, type ReactNode } from "react"

const PEEK_W = 156
const PEEK_H = 148

function clampPeek(x: number, y: number) {
  const pad = 12
  let left = x + 18
  let top = y - 36
  if (left + PEEK_W > window.innerWidth - pad) left = x - PEEK_W - 14
  if (left < pad) left = pad
  if (top < pad) top = y + 18
  if (top + PEEK_H > window.innerHeight - pad) top = window.innerHeight - PEEK_H - pad
  return { left, top }
}

export function HoverPeek({
  src,
  alt,
  children,
}: {
  src: string
  alt: string
  children: ReactNode
}) {
  const [on, setOn] = useState(false)
  const [xy, setXy] = useState({ left: 0, top: 0 })

  return (
    <span
      className="peek"
      onMouseEnter={() => {
        if (
          window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          setOn(true)
        }
      }}
      onMouseLeave={() => setOn(false)}
      onMouseMove={(e) => setXy(clampPeek(e.clientX, e.clientY))}
    >
      {children}
      {on ? (
        <span className="peek-shot" style={{ left: xy.left, top: xy.top }}>
          <img src={src} alt={alt} />
        </span>
      ) : null}
    </span>
  )
}
