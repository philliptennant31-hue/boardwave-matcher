import type {
  MatchResponse,
  DraftIntroResponse,
  Decision,
  Requester,
} from "./types.ts"

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  let data: unknown
  try {
    data = await res.json()
  } catch {
    throw new Error(`${path} returned non-JSON (status ${res.status})`)
  }
  return data as T
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path)
  let data: unknown
  try {
    data = await res.json()
  } catch {
    throw new Error(`${path} returned non-JSON (status ${res.status})`)
  }
  return data as T
}

export type MatchRequest = {
  need: string
  requester: Requester
  excluded_ids: string[]
  attempt: 1 | 2 | 3
  decision_id?: string
}

export function postMatch(body: MatchRequest): Promise<MatchResponse> {
  return postJSON<MatchResponse>("/.netlify/functions/match", body)
}

export function postDraftIntro(
  decision_id: string,
  chosen_member_id: string,
): Promise<DraftIntroResponse> {
  return postJSON<DraftIntroResponse>("/.netlify/functions/draft-intro", {
    decision_id,
    chosen_member_id,
  })
}

export function getDecisions(): Promise<{ ok: true; decisions: Decision[] } | { ok: false; error: string }> {
  return getJSON("/.netlify/functions/decisions")
}

export type UpdateDecisionRequest = {
  id: string
  intro_text?: string
  team_note?: string
  outcome?: "pending" | "approved" | "rejected_all" | "abandoned"
}

export function patchDecision(
  body: UpdateDecisionRequest,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return postJSON("/.netlify/functions/decisions", body)
}

export function postResetDemo(): Promise<{ ok: true; members: number } | { ok: false; error: string }> {
  return postJSON("/.netlify/functions/reset-demo", {})
}
