import { useEffect, useState } from "react"
import DecisionsTable from "../components/DecisionsTable.tsx"
import { getDecisions } from "../lib/api.ts"
import type { Decision } from "../lib/types.ts"

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getDecisions()
      .then((res) => {
        if (!alive) return
        if (!res.ok) {
          setError(res.error)
          return
        }
        setDecisions(res.decisions)
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Decisions log
        </h1>
        <p className="mt-1 text-sm text-muted">
          Every match suggested, every choice made. Foundation for the future learning loop.
        </p>
      </div>
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {decisions === null && !error ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-muted">
          Loading…
        </div>
      ) : (
        <DecisionsTable decisions={decisions ?? []} />
      )}
    </div>
  )
}
