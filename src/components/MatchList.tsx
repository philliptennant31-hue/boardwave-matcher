import type { Match } from "../lib/types.ts"
import MatchCard from "./MatchCard.tsx"

type Props = {
  matches: Match[]
  attempt: 1 | 2 | 3
  onApprove: (m: Match) => void
  onReject: (memberId: string) => void
  onRejectAll: () => void
  busy: boolean
}

export default function MatchList({
  matches,
  attempt,
  onApprove,
  onReject,
  onRejectAll,
  busy,
}: Props) {
  if (matches.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Suggested matches
        </h2>
        <span className="text-xs text-muted">Attempt {attempt} of 3</span>
      </div>

      <div className="space-y-4">
        {matches.map((m) => (
          <MatchCard
            key={m.member_id}
            match={m}
            onApprove={() => onApprove(m)}
            onReject={() => onReject(m.member_id)}
            busy={busy}
          />
        ))}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-canvas px-5 py-4">
        <p className="text-sm text-muted">
          None of these fit? Reject all to retry with a fresh set, excluding everyone shown.
        </p>
        <button
          type="button"
          onClick={onRejectAll}
          disabled={busy || attempt >= 3}
          className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-danger transition hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Working." : "Reject all and retry"}
        </button>
      </div>
    </div>
  )
}
