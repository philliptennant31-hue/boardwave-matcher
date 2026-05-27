import { useState } from "react"
import { postResetDemo } from "../lib/api.ts"
import { clearMatchState } from "../lib/matchState.ts"
import Lightbox from "./Lightbox.tsx"

function isResetEnabled(): boolean {
  if (import.meta.env.VITE_DEMO_RESET === "1") return true
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get("reset") === "1"
  }
  return false
}

type Phase = "idle" | "confirm" | "running" | "error"

export default function ResetDemoButton() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<string | null>(null)

  if (!isResetEnabled()) return null

  async function run() {
    setPhase("running")
    setError(null)
    try {
      const res = await postResetDemo()
      if (!res.ok) throw new Error(res.error)
      // Drop any in-tab match state that could reference now-deleted decisions.
      clearMatchState()
      // Brief pause so the modal swap doesn't feel abrupt, then reload so
      // the Decisions and Directory pages re-fetch.
      setTimeout(() => {
        window.location.reload()
      }, 600)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase("error")
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPhase("confirm")}
        className="rounded-lg border border-dashed border-warn/40 bg-warn/5 px-3 py-1.5 text-xs font-medium text-warn transition hover:bg-warn/10"
      >
        Reset demo
      </button>

      <Lightbox
        open={phase !== "idle"}
        onClose={() => phase !== "running" && setPhase("idle")}
        ariaLabel="Reset demo confirmation"
      >
        <div className="p-7">
          {phase === "error" ? (
            <>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                Reset failed
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">
                {error ?? "Unknown error."}
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPhase("idle")}
                  className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink transition hover:bg-subtle"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={run}
                  className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
                >
                  Try again
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                Reset the demo?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">
                This wipes every logged decision and reseeds the member
                directory from the demo data. Useful between demo runs.
                Can&rsquo;t be undone.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPhase("idle")}
                  disabled={phase === "running"}
                  className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink transition hover:bg-subtle disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={run}
                  disabled={phase === "running"}
                  className="rounded-lg bg-warn px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                >
                  {phase === "running" ? "Resetting." : "Wipe and reseed"}
                </button>
              </div>
            </>
          )}
        </div>
      </Lightbox>
    </>
  )
}
