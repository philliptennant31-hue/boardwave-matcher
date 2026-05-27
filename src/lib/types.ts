export type Stage = "pre-seed" | "seed" | "series-a" | "series-b" | "series-c" | "exit"

export type Member = {
  id: string
  slug: string
  name: string
  company: string
  role: string
  stage: Stage
  sectors: string[]
  geography: string
  expertise: string[]
  bio: string
  open_to: string[]
}

export type MemberSeed = Omit<Member, "id">

export type Requester = {
  name: string
  company: string
}

export type Factor = {
  weight: number
  score: number
  reason: string
}

export type FactorBreakdown = {
  challenge: Factor
  stage: Factor
  sector: Factor
  geography: Factor
  mutual_value: Factor
}

export type Match = {
  member_id: string
  name: string
  company: string
  score: number
  factor_breakdown: FactorBreakdown
  summary: string
  /** Full directory record for the matched member. Attached server-side by
   * the match function so the lightbox can render without a round-trip. */
  member: Member
}

export type Weighting = {
  reasoning: string
  weights: {
    challenge: number
    stage: number
    sector: number
    geography: number
    mutual_value: number
  }
}

export type MatchResponse =
  | {
      ok: true
      decision_id: string
      attempt: 1 | 2 | 3
      weighting: Weighting
      matches: Match[]
      generatedInMs: number
    }
  | { ok: false; code: "exhausted"; reason: string }
  | { ok: false; error: string }

export type DraftIntroResponse =
  | { ok: true; intro: string; team_note: string; generatedInMs: number }
  | { ok: false; error: string }

export type Outcome = "pending" | "approved" | "rejected_all" | "abandoned"

export type Decision = {
  id: string
  created_at: string
  requester_name: string | null
  requester_company: string | null
  need: string
  weighting: Weighting | null
  suggested_matches: Match[] | null
  excluded_ids: string[]
  attempt_count: number
  chosen_member_id: string | null
  chosen_member?: { name: string; company: string } | null
  intro_text: string | null
  team_note: string | null
  outcome: Outcome
}
