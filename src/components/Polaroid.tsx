import { useRef, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react"

type PolaroidProps = {
  src: string
  alt: string
  caption?: string
  note?: string
  tape?: boolean
  rotate?: number
  className?: string
  onOpen?: () => void
}

export function Polaroid({
  src,
  alt,
  caption,
  note,
  tape = true,
  rotate = 0,
  className = "",
  onOpen,
}: PolaroidProps) {
  const ref = useRef<HTMLDivElement>(null)

  const tilt = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty("--tilt-x", `${x * 10}deg`)
    el.style.setProperty("--tilt-y", `${-y * 8}deg`)
    el.style.setProperty("--shift-x", `${x * 10}px`)
    el.style.setProperty("--shift-y", `${y * 8}px`)
    el.style.setProperty("--warp", `${x * 4}deg`)
  }

  const reset = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty("--tilt-x", "0deg")
    el.style.setProperty("--tilt-y", "0deg")
    el.style.setProperty("--shift-x", "0px")
    el.style.setProperty("--shift-y", "0px")
    el.style.setProperty("--warp", "0deg")
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onOpen) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onOpen()
    }
  }

  const style = { "--base-rot": `${rotate}deg` } as CSSProperties

  return (
    <div
      ref={ref}
      className={`polaroid${tape ? " has-tape" : ""}${className ? ` ${className}` : ""}`}
      style={style}
      onMouseMove={tilt}
      onMouseLeave={reset}
      onClick={onOpen}
      onKeyDown={onKey}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <span className="polaroid-frame">
        <img src={src} alt={alt} />
      </span>
      {caption ? <span className="polaroid-cap">{caption}</span> : null}
      {note ? <span className="hand-note">{note}</span> : null}
    </div>
  )
}
