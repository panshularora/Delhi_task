import { AnimatePresence, motion } from "framer-motion"
import { formatMin } from "../lib/geo"
import { useDay } from "../state"

export function Dock() {
  const { itinerary, dockOpen, setDockOpen, removeStop, route } = useDay()
  if (itinerary.length === 0) return null
  const visit = itinerary.reduce((n, s) => n + s.durationMin, 0)
  const travel = route?.durationMin ?? 0

  return (
    <aside className="dock" aria-label="Your Delhi day">
      <button className="dock-head" onClick={() => setDockOpen(!dockOpen)}>
        <strong>Your day · {itinerary.length} stops</strong>
        <span>
          {formatMin(visit + travel)}
          {dockOpen ? " · close" : " · open"}
        </span>
      </button>
      <AnimatePresence>
        {dockOpen && (
          <motion.div
            className="dock-body"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {itinerary.map((s, i) => (
              <div className="dock-stop" key={s.id}>
                <span>
                  {i + 1}. {s.name}
                </span>
                <button className="chip" onClick={() => removeStop(s.id)}>
                  Remove
                </button>
              </div>
            ))}
            <a className="btn" href="#plan">
              Edit in planner
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}
