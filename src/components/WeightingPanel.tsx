import { useState } from "react"
import type { Weighting } from "../lib/types.ts"

const FACTOR_LABELS: Record<keyof Weighting["weights"], string> = {
  challenge: "Challenge match",
  stage: "Stage fit",
  sector: "Sector relevance",
  geography: "Geography",
  mutual_value: "Mutual value",
}

const ORDER: Array<keyof Weighting["weights"]> = [
  "challenge",
  "stage",
  "sector",
  "geography",
  "mutual_value",
]

export default function WeightingPanel({ weighting }: { weighting: Weighting }) {
  const [open, setOpen] = useState(true)
  const max = Math.max(
    weighting.weights.challenge,
    weighting.weights.stage,
    weighting.weights.sector,
    weighting.weights.geography,
    weighting.weights.mutual_value,
    1,
  )

  return (
    <div className="rounded-2xl border border-line bg-accent-soft/50 p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-display text-base font-semibold tracking-tight text-ink">
          How we weighted this brief
        </span>
        <span className="text-xs text-muted">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-sm leading-relaxed text-ink/85">{weighting.reasoning}</p>
          <div className="space-y-2">
            {ORDER.map((key) => {
              const w = weighting.weights[key]
              const pct = (w / max) * 100
              return (
                <div key={key} className="flex items-center gap-3 text-xs">
                  <div className="w-32 text-muted">{FACTOR_LABELS[key]}</div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-brand-gradient"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-8 text-right font-semibold text-ink">{w}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
