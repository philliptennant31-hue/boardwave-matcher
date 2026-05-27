import { useState } from "react"
import NeedForm from "../components/NeedForm.tsx"
import WeightingPanel from "../components/WeightingPanel.tsx"
import MatchList from "../components/MatchList.tsx"
import IntroPreview from "../components/IntroPreview.tsx"
import EmptyState from "../components/EmptyState.tsx"
import { postMatch, postDraftIntro, patchDecision } from "../lib/api.ts"
import type {
  Match,
  Requester,
  Weighting,
} from "../lib/types.ts"

type Status =
  | "idle"
  | "matching"
  | "reviewing"
  | "drafting"
  | "drafted"
  | "exhausted"
  | "error"

export default function MatchPage() {
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)

  // Need + requester captured on submit.
  const [need, setNeed] = useState<string>("")
  const [requester, setRequester] = useState<Requester>({ name: "", company: "" })

  // Match state.
  const [decisionId, setDecisionId] = useState<string | null>(null)
  const [attempt, setAttempt] = useState<1 | 2 | 3>(1)
  const [excludedIds, setExcludedIds] = useState<string[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [weighting, setWeighting] = useState<Weighting | null>(null)

  // Drafted intro state.
  const [chosen, setChosen] = useState<Match | null>(null)
  const [intro, setIntro] = useState<string>("")
  const [teamNote, setTeamNote] = useState<string>("")

  function reset() {
    setStatus("idle")
    setError(null)
    setNeed("")
    setRequester({ name: "", company: "" })
    setDecisionId(null)
    setAttempt(1)
    setExcludedIds([])
    setMatches([])
    setWeighting(null)
    setChosen(null)
    setIntro("")
    setTeamNote("")
  }

  async function runMatch(args: {
    need: string
    requester: Requester
    excluded_ids: string[]
    attempt: 1 | 2 | 3
    decision_id: string | null
  }) {
    setStatus("matching")
    setError(null)
    try {
      const res = await postMatch({
        need: args.need,
        requester: args.requester,
        excluded_ids: args.excluded_ids,
        attempt: args.attempt,
        decision_id: args.decision_id ?? undefined,
      })
      if ("ok" in res && res.ok) {
        setDecisionId(res.decision_id)
        setAttempt(res.attempt)
        setMatches(res.matches)
        setWeighting(res.weighting)
        setStatus("reviewing")
      } else if ("ok" in res && !res.ok && (res as { code?: string }).code === "exhausted") {
        setStatus("exhausted")
      } else {
        const msg = "error" in res ? res.error : "Unknown error"
        setError(msg)
        setStatus("error")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus("error")
    }
  }

  function handleSubmit(needIn: string, requesterIn: Requester) {
    setNeed(needIn)
    setRequester(requesterIn)
    setExcludedIds([])
    setAttempt(1)
    setDecisionId(null)
    runMatch({
      need: needIn,
      requester: requesterIn,
      excluded_ids: [],
      attempt: 1,
      decision_id: null,
    })
  }

  function handleRejectOne(memberId: string) {
    setMatches((prev) => prev.filter((m) => m.member_id !== memberId))
  }

  function handleRejectAll() {
    if (attempt >= 3) {
      // Mark decision as rejected_all (fire-and-forget) and surface empty state.
      if (decisionId) {
        patchDecision({ id: decisionId, outcome: "rejected_all" }).catch(() => {})
      }
      setStatus("exhausted")
      return
    }
    const newExcluded = [
      ...excludedIds,
      ...matches.map((m) => m.member_id),
    ]
    const nextAttempt = (attempt + 1) as 1 | 2 | 3
    setExcludedIds(newExcluded)
    runMatch({
      need,
      requester,
      excluded_ids: newExcluded,
      attempt: nextAttempt,
      decision_id: decisionId,
    })
  }

  async function handleApprove(m: Match) {
    if (!decisionId) return
    setStatus("drafting")
    setChosen(m)
    setError(null)
    try {
      const res = await postDraftIntro(decisionId, m.member_id)
      if (!res.ok) throw new Error(res.error)
      setIntro(res.intro)
      setTeamNote(res.team_note)
      setStatus("drafted")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus("error")
    }
  }

  return (
    <div className="space-y-8">
      {status === "idle" && (
        <NeedForm onSubmit={handleSubmit} submitting={false} />
      )}

      {status === "matching" && (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center">
          <div className="font-display text-lg font-semibold tracking-tight">
            Reading the directory and scoring matches…
          </div>
          <p className="mt-2 text-sm text-muted">
            This usually takes 8 to 15 seconds.
          </p>
        </div>
      )}

      {(status === "reviewing" || status === "drafting") && weighting && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">
              The challenge
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink/85">{need}</p>
            <p className="mt-3 text-xs text-muted">
              From {requester.name} at {requester.company}.
            </p>
          </div>
          <WeightingPanel weighting={weighting} />
          <MatchList
            matches={matches}
            attempt={attempt}
            onApprove={handleApprove}
            onReject={handleRejectOne}
            onRejectAll={handleRejectAll}
            busy={status === "drafting"}
          />
          {matches.length === 0 && (
            <EmptyState
              title="All cards rejected this round"
              message="Tap Reject all & retry to surface a fresh three, or start a new brief."
              actionLabel="Start over"
              onAction={reset}
            />
          )}
        </div>
      )}

      {status === "drafted" && chosen && decisionId && (
        <IntroPreview
          decisionId={decisionId}
          chosenMember={chosen}
          initialIntro={intro}
          initialTeamNote={teamNote}
          onFinish={reset}
        />
      )}

      {status === "exhausted" && (
        <EmptyState
          title="No more strong matches"
          message="You've worked through three rounds of suggestions. Try broadening the brief, easing the rejection criteria, or starting fresh."
          actionLabel="Start a new brief"
          onAction={reset}
        />
      )}

      {status === "error" && (
        <EmptyState
          title="Something went wrong"
          message={error ?? "Unknown error."}
          actionLabel="Try again"
          onAction={reset}
        />
      )}
    </div>
  )
}
