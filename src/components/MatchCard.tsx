import { useState } from "react"
import type { Factor, FactorBreakdown, Match } from "../lib/types.ts"
import Lightbox from "./Lightbox.tsx"
import MemberProfileCard from "./MemberProfileCard.tsx"
import MemberAvatar from "./MemberAvatar.tsx"

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

/**
 * Score badge tint by tier. Reinforces the per-card score at a glance:
 * deep green for outstanding, brand coral for strong, amber for mid, muted
 * grey for weak. Keeps the brand palette dominant for the majority case.
 */
function scoreBadgeClasses(score: number): { box: string; label: string; value: string } {
  if (score >= 90)
    return {
      box: "bg-positive/10 border border-positive/20",
      label: "text-positive",
      value: "text-positive",
    }
  if (score >= 80)
    return {
      box: "bg-accent-soft border border-accent/20",
      label: "text-accent-strong",
      value: "text-accent-strong",
    }
  if (score >= 70)
    return {
      box: "bg-warn/10 border border-warn/20",
      label: "text-warn",
      value: "text-warn",
    }
  return {
    box: "bg-subtle border border-line",
    label: "text-muted",
    value: "text-ink/70",
  }
}

function FactorCell({ label, factor }: { label: string; factor: Factor }) {
  return (
    <div className="rounded-lg border border-line bg-subtle p-3">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${scoreTone(factor.score)}`}>
        {factor.score}
      </div>
      <div className="mt-1 text-xs leading-snug text-ink/70">{factor.reason}</div>
    </div>
  )
}

export default function MatchCard({ match, onApprove, onReject, busy }: Props) {
  const [profileOpen, setProfileOpen] = useState(false)
  const badge = scoreBadgeClasses(match.score)

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-3 text-left"
        >
          <MemberAvatar
            name={match.name}
            slug={match.member?.slug}
            size="md"
          />
          <div>
            <h3 className="font-display text-xl font-semibold tracking-tight transition hover:text-accent-strong">
              {match.name}
            </h3>
            <p className="text-sm text-muted">
              {match.company}
              <span className="ml-2 text-xs text-accent-strong/80">View profile</span>
            </p>
          </div>
        </button>
        <div className={`rounded-xl px-3 py-2 text-center ${badge.box}`}>
          <div className={`text-xs font-medium uppercase tracking-wide ${badge.label}`}>
            Score
          </div>
          <div className={`font-display text-3xl font-semibold leading-none ${badge.value}`}>
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
          className="rounded-lg bg-brand-gradient px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
        >
          Approve
        </button>
      </div>

      <Lightbox
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        ariaLabel={`${match.name} profile`}
      >
        {match.member ? (
          <MemberProfileCard member={match.member} />
        ) : (
          <div className="p-10 text-center text-sm text-muted">
            Profile not available for this match.
          </div>
        )}
      </Lightbox>
    </div>
  )
}
