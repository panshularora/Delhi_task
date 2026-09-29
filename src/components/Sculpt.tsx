import { useEffect, useState } from "react"
import { higgsfieldStatus, sculptPlace } from "../lib/higgsfield"
import type { Place } from "../types"

export function Sculpt({ place }: { place: Place }) {
  const [ready, setReady] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    higgsfieldStatus()
      .then((s) => {
        if (live) setReady(s.ready)
      })
      .catch(() => {
        if (live) setReady(false)
      })
    return () => {
      live = false
    }
  }, [])

  const run = async () => {
    setBusy(true)
    setErr(null)
    try {
      const url = await sculptPlace({
        id: place.id,
        name: place.name,
        image: place.image,
        onStage: setStage,
      })
      window.dispatchEvent(new CustomEvent("delhi:twin-glb", { detail: { id: place.id, url } }))
      setStage("In the city")
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sculpt failed")
      setStage(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sculpt">
      <button className="btn ghost" type="button" onClick={run} disabled={busy || ready !== true}>
        {busy ? "Placing…" : "Set it in the city"}
      </button>
      {ready === false && (
        <p className="status">
          Add <code>MUAPI_API_KEY</code> to <code>.env.local</code> from muapi.ai (Open Higgsfield), then restart Vite.
        </p>
      )}
      {stage && <p className="status">{stage}</p>}
      {err && <p className="status">{err}</p>}
    </div>
  )
}
