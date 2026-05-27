import type { Factor, FactorBreakdown, Match } from "../lib/types.ts"

const FACTOR_LABELS: Record<keyof FactorBreakdown, string> = {
  challenge: "Challenge match",
  stage: "Stage fit",
  sector: "Sector relevance",
  geography: "Geography",
  mutual_value: "Mutual value",
}

const ORDER: Array<keyof FactorBreakdown> = [
  "challenge",
  "stage",
  "sector",
  "geography",
  "mutual_value",
]

type Props = {
  match: Match
  onApprove: () => void
  onReject: () => void
  busy: boolean
}

function scoreTone(s: number): string {
  if (s >= 80) return "text-positive"
  if (s >= 60) return "text-ink"
  return "text-muted"
}

function FactorCell({ label, factor }: { label: string; factor: Factor }) {
  return (
    <div className="rounded-lg border border-line bg-canvas p-3">
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-medium text-muted">{label}</div>
        <div className="text-xs text-muted">w {factor.weight}</div>
      </div>
      <div className={`mt-1 text-lg font-semibold ${scoreTone(factor.score)}`}>
        {factor.score}
      </div>
      <div className="mt-1 text-xs leading-snug text-ink/70">{factor.reason}</div>
    </div>
  )
}

export default function MatchCard({ match, onApprove, onReject, busy }: Props) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight">{match.name}</h3>
          <p className="text-sm text-muted">{match.company}</p>
        </div>
        <div className="rounded-xl bg-accent-soft px-3 py-2 text-center">
          <div className="text-xs font-medium uppercase tracking-wide text-accent">Score</div>
          <div className="font-display text-2xl font-semibold leading-none text-accent">
            {match.score}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink/85">{match.summary}</p>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-5">
        {ORDER.map((k) => (
          <FactorCell key={k} label={FACTOR_LABELS[k]} factor={match.factor_breakdown[k]} />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onReject}
          disabled={busy}
          className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink transition hover:bg-subtle disabled:opacity-50"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          Approve
        </button>
      </div>
    </div>
  )
}
