import { useEffect, type Dispatch, type SetStateAction } from "react"
import NeedForm from "../components/NeedForm.tsx"
import WeightingPanel from "../components/WeightingPanel.tsx"
import MatchList from "../components/MatchList.tsx"
import IntroPreview from "../components/IntroPreview.tsx"
import EmptyState from "../components/EmptyState.tsx"
import OrientationBanner from "../components/OrientationBanner.tsx"
import { postMatch, postDraftIntro, patchDecision } from "../lib/api.ts"
import type {
  Decision,
  Match,
  Requester,
} from "../lib/types.ts"
import type { MatchState } from "../lib/matchState.ts"

type Props = {
  state: MatchState
  /**
   * React-style state setter. Always accepts the updater-function form so
   * patches batched in the same tick see the latest state. Passing a plain
   * object would re-introduce the stale-closure bug fixed in this revision.
   */
  onStateChange: Dispatch<SetStateAction<MatchState>>
  onReset: () => void
  resumed: Decision | null
  onResumedConsumed: () => void
}

export default function MatchPage({
  state,
  onStateChange,
  onReset,
  resumed,
  onResumedConsumed,
}: Props) {
  // Hydrate from a resumed decision pushed by the Decisions log.
  useEffect(() => {
    if (!resumed) return
    if (
      resumed.outcome === "pending" &&
      resumed.suggested_matches?.length &&
      resumed.weighting
    ) {
      onStateChange({
        status: "reviewing",
        error: null,
        need: resumed.need,
        requester: {
          name: resumed.requester_name ?? "",
          company: resumed.requester_company ?? "",
        },
        decisionId: resumed.id,
        attempt: (resumed.attempt_count >= 1 && resumed.attempt_count <= 3
          ? resumed.attempt_count
          : 1) as 1 | 2 | 3,
        excludedIds: resumed.excluded_ids ?? [],
        matches: resumed.suggested_matches,
        weighting: resumed.weighting,
        chosen: null,
        intro: "",
        teamNote: "",
      })
    }
    onResumedConsumed()
  }, [resumed, onResumedConsumed, onStateChange])

  function patch(p: Partial<MatchState>) {
    // Functional setState form so concurrent patches in the same tick
    // accumulate correctly rather than racing on a stale closure.
    onStateChange((prev) => ({ ...prev, ...p }))
  }

  async function runMatch(args: {
    need: string
    requester: Requester
    excluded_ids: string[]
    attempt: 1 | 2 | 3
    decision_id: string | null
  }) {
    patch({ status: "matching", error: null })
    try {
      const res = await postMatch({
        need: args.need,
        requester: args.requester,
        excluded_ids: args.excluded_ids,
        attempt: args.attempt,
        decision_id: args.decision_id ?? undefined,
      })
      if ("ok" in res && res.ok) {
        patch({
          status: "reviewing",
          decisionId: res.decision_id,
          attempt: res.attempt,
          matches: res.matches,
          weighting: res.weighting,
        })
      } else if (
        "ok" in res &&
        !res.ok &&
        (res as { code?: string }).code === "exhausted"
      ) {
        patch({ status: "exhausted" })
      } else {
        const msg = "error" in res ? res.error : "Unknown error"
        patch({ status: "error", error: msg })
      }
    } catch (e) {
      patch({
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  function handleSubmit(needIn: string, requesterIn: Requester) {
    patch({
      need: needIn,
      requester: requesterIn,
      excludedIds: [],
      attempt: 1,
      decisionId: null,
    })
    runMatch({
      need: needIn,
      requester: requesterIn,
      excluded_ids: [],
      attempt: 1,
      decision_id: null,
    })
  }

  function handleRejectOne(memberId: string) {
    patch({ matches: state.matches.filter((m) => m.member_id !== memberId) })
  }

  function handleRejectAll() {
    if (state.attempt >= 3) {
      if (state.decisionId) {
        patchDecision({ id: state.decisionId, outcome: "rejected_all" }).catch(
          () => {},
        )
      }
      patch({ status: "exhausted" })
      return
    }
    const newExcluded = [
      ...state.excludedIds,
      ...state.matches.map((m) => m.member_id),
    ]
    const nextAttempt = (state.attempt + 1) as 1 | 2 | 3
    patch({ excludedIds: newExcluded })
    runMatch({
      need: state.need,
      requester: state.requester,
      excluded_ids: newExcluded,
      attempt: nextAttempt,
      decision_id: state.decisionId,
    })
  }

  async function handleApprove(m: Match) {
    if (!state.decisionId) return
    patch({ status: "drafting", chosen: m, error: null })
    try {
      const res = await postDraftIntro(state.decisionId, m.member_id)
      if (!res.ok) throw new Error(res.error)
      patch({
        status: "drafted",
        chosen: m,
        intro: res.intro,
        teamNote: res.team_note,
      })
    } catch (e) {
      patch({
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  return (
    <div className="space-y-8">
      {state.status === "idle" && (
        <>
          <OrientationBanner />
          <NeedForm onSubmit={handleSubmit} submitting={false} />
        </>
      )}

      {state.status === "matching" && (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center">
          <div className="font-display text-xl font-semibold tracking-tight">
            Reading the directory and scoring matches.
          </div>
          <p className="mt-2 text-sm text-muted">
            This usually takes 8 to 15 seconds.
          </p>
        </div>
      )}

      {(state.status === "reviewing" || state.status === "drafting") &&
        state.weighting && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-line bg-surface p-6">
              <div className="text-xs font-medium uppercase tracking-wide text-muted">
                The challenge
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink/85">
                {state.need}
              </p>
              <p className="mt-3 text-xs text-muted">
                From {state.requester.name} at {state.requester.company}.
              </p>
            </div>
            <WeightingPanel weighting={state.weighting} />
            <MatchList
              matches={state.matches}
              attempt={state.attempt}
              onApprove={handleApprove}
              onReject={handleRejectOne}
              onRejectAll={handleRejectAll}
              busy={state.status === "drafting"}
            />
            {state.matches.length === 0 && (
              <EmptyState
                title="All cards rejected this round"
                message="Tap Reject all and retry to surface a fresh three, or start a new brief."
                actionLabel="Start over"
                onAction={onReset}
              />
            )}
          </div>
        )}

      {state.status === "drafted" && state.chosen && state.decisionId && (
        <IntroPreview
          decisionId={state.decisionId}
          chosenMember={state.chosen}
          requester={state.requester}
          initialIntro={state.intro}
          initialTeamNote={state.teamNote}
          onFinish={onReset}
        />
      )}

      {state.status === "exhausted" && (
        <EmptyState
          title="No more strong matches"
          message="You've worked through three rounds of suggestions. Try broadening the brief, easing the rejection criteria, or starting fresh."
          actionLabel="Start a new brief"
          onAction={onReset}
        />
      )}

      {state.status === "error" && (
        <EmptyState
          title="Something went wrong"
          message={state.error ?? "Unknown error."}
          actionLabel="Try again"
          onAction={onReset}
        />
      )}
    </div>
  )
}
