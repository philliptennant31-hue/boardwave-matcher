import type { Context } from "@netlify/functions"
import Anthropic from "@anthropic-ai/sdk"
import { serverSupabase } from "./_lib/supabase.ts"

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6"

const FACTOR_NAMES = ["challenge", "stage", "sector", "geography", "mutual_value"] as const

const SYSTEM_PROMPT = `You are the Boardwave matcher. Boardwave is a private community of senior software founders and CEOs who help each other through their hardest business decisions.

Your job: given a member's business challenge and a directory of fellow members, surface the THREE most useful peers and explain exactly why. Use the propose_matches tool to return your result.

You work in two steps, in this order.

STEP 1. Set weights BEFORE looking at candidates.
Read the challenge. Decide how much each of the five factors below matters FOR THIS specific challenge. Assign integer weights summing to 100. Write a one-sentence rationale explaining the weighting. Doing this BEFORE you see candidates prevents post-hoc rationalisation.

The five factors:
- challenge: has this person actually solved this specific problem? The highest-signal factor in almost every brief.
- stage: are they a step ahead of the asker, far enough along to have real answers but close enough that the experience is still relevant?
- sector: related enough to help, ideally not a direct competitor.
- geography: shared or relevant target market.
- mutual_value: does the match have something to gain from the conversation too? Good connections are two-way.

STEP 2. Score and select.
Now read the directory. For each viable candidate, score every factor 0 to 100 and write a one-line reason that references the candidate's ACTUAL bio or expertise tags. Never write tautological reasons like "good challenge match because they match the challenge". Always reference something specific.

The overall score should reflect the weights you set in step 1 (weighted average of the per-factor scores).

Return the top THREE candidates by overall score, in descending order. The three should bring DIFFERENT angles on the problem, not three near-duplicates. If two candidates have very similar profiles, prefer one and pick a third with a different angle.

Hard rules:
- Use only \`member_id\` values that appear in the provided directory. Never invent or guess.
- Never recommend a member whose id is in the excluded list.
- All weights and scores are integers, 0 to 100.
- The five weights MUST sum to exactly 100.
- Each summary is two sentences max, plain English, peer-to-peer tone, not salesy.
- Do not use em dashes anywhere in your output. Use commas, full stops, or restructure.`

type Stage = "pre-seed" | "seed" | "series-a" | "series-b" | "series-c" | "exit"

type DirectoryMember = {
  id: string
  slug: string
  name: string
  company: string
  role: string | null
  stage: Stage | null
  sectors: string[]
  geography: string | null
  expertise: string[]
  bio: string | null
  open_to: string[]
}

type Factor = { weight: number; score: number; reason: string }
type FactorBreakdown = {
  challenge: Factor
  stage: Factor
  sector: Factor
  geography: Factor
  mutual_value: Factor
}
type Match = {
  member_id: string
  name: string
  company: string
  score: number
  factor_breakdown: FactorBreakdown
  summary: string
}
type MatcherResult = {
  weighting_reasoning: string
  weights: {
    challenge: number
    stage: number
    sector: number
    geography: number
    mutual_value: number
  }
  matches: Match[]
}

const FACTOR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    weight: { type: "integer", minimum: 0, maximum: 100 },
    score: { type: "integer", minimum: 0, maximum: 100 },
    reason: { type: "string", minLength: 10 },
  },
  required: ["weight", "score", "reason"],
}

const PROPOSE_MATCHES_TOOL: Anthropic.Tool = {
  name: "propose_matches",
  description:
    "Return the three best-placed Boardwave peers for the requester's challenge, with per-factor weights, scores and reasons.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      weighting_reasoning: { type: "string", minLength: 20 },
      weights: {
        type: "object",
        additionalProperties: false,
        properties: {
          challenge: { type: "integer", minimum: 0, maximum: 100 },
          stage: { type: "integer", minimum: 0, maximum: 100 },
          sector: { type: "integer", minimum: 0, maximum: 100 },
          geography: { type: "integer", minimum: 0, maximum: 100 },
          mutual_value: { type: "integer", minimum: 0, maximum: 100 },
        },
        required: ["challenge", "stage", "sector", "geography", "mutual_value"],
      },
      matches: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            member_id: { type: "string", minLength: 1 },
            name: { type: "string", minLength: 1 },
            company: { type: "string", minLength: 1 },
            score: { type: "integer", minimum: 0, maximum: 100 },
            summary: { type: "string", minLength: 20 },
            factor_breakdown: {
              type: "object",
              additionalProperties: false,
              properties: {
                challenge: FACTOR_SCHEMA,
                stage: FACTOR_SCHEMA,
                sector: FACTOR_SCHEMA,
                geography: FACTOR_SCHEMA,
                mutual_value: FACTOR_SCHEMA,
              },
              required: ["challenge", "stage", "sector", "geography", "mutual_value"],
            },
          },
          required: ["member_id", "name", "company", "score", "summary", "factor_breakdown"],
        },
      },
    },
    required: ["weighting_reasoning", "weights", "matches"],
  },
}

function isFactor(v: unknown): v is Factor {
  if (!v || typeof v !== "object") return false
  const r = v as Record<string, unknown>
  return (
    typeof r.weight === "number" &&
    Number.isInteger(r.weight) &&
    typeof r.score === "number" &&
    Number.isInteger(r.score) &&
    typeof r.reason === "string"
  )
}

function isMatch(v: unknown): v is Match {
  if (!v || typeof v !== "object") return false
  const r = v as Record<string, unknown>
  if (
    typeof r.member_id !== "string" ||
    typeof r.name !== "string" ||
    typeof r.company !== "string" ||
    typeof r.score !== "number" ||
    !Number.isInteger(r.score) ||
    typeof r.summary !== "string"
  ) {
    return false
  }
  const fb = r.factor_breakdown as Record<string, unknown> | undefined
  if (!fb) return false
  return FACTOR_NAMES.every((n) => isFactor(fb[n]))
}

function isMatcherResult(v: unknown): v is MatcherResult {
  if (!v || typeof v !== "object") return false
  const r = v as Record<string, unknown>
  if (typeof r.weighting_reasoning !== "string") return false
  const w = r.weights as Record<string, unknown> | undefined
  if (!w) return false
  for (const n of FACTOR_NAMES) {
    if (typeof w[n] !== "number" || !Number.isInteger(w[n] as number)) return false
  }
  return Array.isArray(r.matches) && r.matches.every(isMatch)
}

function weightSum(w: MatcherResult["weights"]): number {
  return w.challenge + w.stage + w.sector + w.geography + w.mutual_value
}

/**
 * Strip em dashes (U+2014) and en dashes (U+2013) from a string. The model
 * occasionally still produces them despite the prompt rule; this is the
 * server-side belt to the prompt's braces. Em/en dashes flanked by spaces
 * become a comma; bare ones become a hyphen.
 */
function stripDashes(s: string): string {
  return s.replace(/\s*[—–]\s*/g, ", ").replace(/[—–]/g, "-")
}

function sanitizeMatches(result: MatcherResult): MatcherResult {
  return {
    weighting_reasoning: stripDashes(result.weighting_reasoning),
    weights: result.weights,
    matches: result.matches.map((m) => ({
      ...m,
      summary: stripDashes(m.summary),
      factor_breakdown: {
        challenge: { ...m.factor_breakdown.challenge, reason: stripDashes(m.factor_breakdown.challenge.reason) },
        stage: { ...m.factor_breakdown.stage, reason: stripDashes(m.factor_breakdown.stage.reason) },
        sector: { ...m.factor_breakdown.sector, reason: stripDashes(m.factor_breakdown.sector.reason) },
        geography: { ...m.factor_breakdown.geography, reason: stripDashes(m.factor_breakdown.geography.reason) },
        mutual_value: { ...m.factor_breakdown.mutual_value, reason: stripDashes(m.factor_breakdown.mutual_value.reason) },
      },
    })),
  }
}

function buildUserMessage(
  need: string,
  requester: { name: string; company: string },
  directory: DirectoryMember[],
  excluded_ids: string[],
  attempt: number,
): string {
  const lines: string[] = []
  lines.push(`The need (verbatim from the requester):`)
  lines.push(`---`)
  lines.push(need.trim())
  lines.push(`---`)
  lines.push(``)
  lines.push(`Requester: ${requester.name} at ${requester.company}.`)
  lines.push(`This is attempt ${attempt} of 3.`)
  if (excluded_ids.length > 0) {
    lines.push(
      `The reviewer has already rejected these member_ids in earlier attempts. Do NOT recommend any of them: ${excluded_ids.join(", ")}.`,
    )
  } else {
    lines.push(`No members are excluded.`)
  }
  lines.push(``)
  lines.push(
    `Below is the eligible directory as JSON. Use ONLY member_id values from this list:`,
  )
  lines.push(`---`)
  lines.push(JSON.stringify(directory, null, 2))
  lines.push(`---`)
  lines.push(``)
  lines.push(
    `Call the propose_matches tool with your weighting_reasoning, weights summing to 100, and the top 3 matches sorted by score descending.`,
  )
  return lines.join("\n")
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { ok: false, error: "ANTHROPIC_API_KEY is not set" },
      { status: 500 },
    )
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json(
      { ok: false, error: "Supabase env vars are not set" },
      { status: 500 },
    )
  }

  type MatchBody = {
    need?: unknown
    requester?: unknown
    excluded_ids?: unknown
    attempt?: unknown
    decision_id?: unknown
  }
  let body: MatchBody
  try {
    body = (await req.json()) as MatchBody
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 })
  }

  const need = typeof body.need === "string" ? body.need.trim() : ""
  if (need.length < 30) {
    return Response.json(
      { ok: false, error: "`need` is required and must be at least 30 characters" },
      { status: 400 },
    )
  }

  const requester =
    body.requester && typeof body.requester === "object" ? body.requester : null
  const requesterName =
    requester && typeof (requester as Record<string, unknown>).name === "string"
      ? ((requester as Record<string, unknown>).name as string).trim()
      : ""
  const requesterCompany =
    requester && typeof (requester as Record<string, unknown>).company === "string"
      ? ((requester as Record<string, unknown>).company as string).trim()
      : ""
  if (!requesterName || !requesterCompany) {
    return Response.json(
      { ok: false, error: "`requester.name` and `requester.company` are required" },
      { status: 400 },
    )
  }

  const excluded_ids: string[] = Array.isArray(body.excluded_ids)
    ? body.excluded_ids.filter((s): s is string => typeof s === "string")
    : []

  const attemptRaw = body.attempt
  const attempt =
    attemptRaw === 1 || attemptRaw === 2 || attemptRaw === 3 ? attemptRaw : 1
  const decisionId =
    typeof body.decision_id === "string" ? body.decision_id : null

  const supabase = serverSupabase()

  // Load directory, excluding rejected members.
  // supabase-js builders are chainable but immutable, must reassign.
  let memberQuery = supabase
    .from("members")
    .select(
      "id, slug, name, company, role, stage, sectors, geography, expertise, bio, open_to",
    )
  if (excluded_ids.length > 0) {
    memberQuery = memberQuery.not("id", "in", `(${excluded_ids.join(",")})`)
  }
  const { data: directory, error: dirErr } = await memberQuery
  if (dirErr) {
    console.error("match: supabase select failed", dirErr.message)
    return Response.json(
      { ok: false, error: "Failed to load member directory" },
      { status: 502 },
    )
  }
  if (!directory || directory.length < 3) {
    return Response.json({
      ok: false,
      code: "exhausted",
      reason:
        "Fewer than three members remain after exclusions. Broaden the brief or relax the rejection set.",
    })
  }

  const client = new Anthropic({ maxRetries: 0 })
  const start = performance.now()

  try {
    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: [PROPOSE_MATCHES_TOOL],
        tool_choice: { type: "tool", name: "propose_matches" },
        messages: [
          {
            role: "user",
            content: buildUserMessage(
              need,
              { name: requesterName, company: requesterCompany },
              directory as DirectoryMember[],
              excluded_ids,
              attempt,
            ),
          },
        ],
      },
      // Local netlify dev's lambda emulator adds overhead; allow the full
      // 60s the SDK can wait. In production the function itself is capped at
      // 30s by netlify.toml, which will be hit first if needed.
      { timeout: 60_000 },
    )

    const toolBlock = response.content.find((b) => b.type === "tool_use")
    if (!toolBlock || toolBlock.type !== "tool_use" || toolBlock.name !== "propose_matches") {
      console.error("match: no propose_matches tool_use in response", response.stop_reason)
      return Response.json(
        { ok: false, error: "Model did not call the propose_matches tool" },
        { status: 502 },
      )
    }

    const parsed: unknown = toolBlock.input

    if (!isMatcherResult(parsed)) {
      console.error("match: schema validation failed", parsed)
      return Response.json(
        { ok: false, error: "Tool input did not match expected schema" },
        { status: 502 },
      )
    }

    // Safety net: strip any em or en dashes the model slipped in despite the
    // prompt rule. Cheaper than another round-trip if the model regresses.
    const sanitized = sanitizeMatches(parsed)

    // Server-side validation.
    const ws = weightSum(sanitized.weights)
    if (Math.abs(ws - 100) > 2) {
      console.error(`match: weights sum to ${ws}, expected 100`)
      return Response.json(
        { ok: false, error: `Model returned weights summing to ${ws}, expected 100` },
        { status: 502 },
      )
    }

    const directoryIds = new Set((directory as DirectoryMember[]).map((m) => m.id))
    const excludedSet = new Set(excluded_ids)
    for (const m of sanitized.matches) {
      if (!directoryIds.has(m.member_id)) {
        console.error(`match: model returned unknown member_id ${m.member_id}`)
        return Response.json(
          { ok: false, error: `Model returned an unknown member_id: ${m.member_id}` },
          { status: 502 },
        )
      }
      if (excludedSet.has(m.member_id)) {
        console.error(`match: model returned excluded member_id ${m.member_id}`)
        return Response.json(
          {
            ok: false,
            error: `Model returned a rejected member_id: ${m.member_id}`,
          },
          { status: 502 },
        )
      }
    }

    // Ensure descending by score.
    sanitized.matches.sort((a, b) => b.score - a.score)

    // Enrich each match with the full member record so the client lightbox
    // can render the profile without a second round-trip. We already loaded
    // the directory above, so this is just an in-memory lookup.
    const directoryById = new Map(
      (directory as DirectoryMember[]).map((m) => [m.id, m]),
    )
    const enrichedMatches = sanitized.matches.map((m) => {
      const dir = directoryById.get(m.member_id)
      return dir ? { ...m, member: dir } : m
    })

    const weighting = {
      reasoning: sanitized.weighting_reasoning,
      weights: sanitized.weights,
    }

    // Insert or update the decisions row.
    let resultDecisionId = decisionId
    if (!resultDecisionId) {
      const { data: ins, error: insErr } = await supabase
        .from("decisions")
        .insert({
          requester_name: requesterName,
          requester_company: requesterCompany,
          need,
          weighting,
          suggested_matches: enrichedMatches,
          excluded_ids,
          attempt_count: attempt,
          outcome: "pending",
        })
        .select("id")
        .single()
      if (insErr || !ins) {
        console.error("match: decisions insert failed", insErr?.message)
        return Response.json(
          { ok: false, error: "Failed to persist decision" },
          { status: 502 },
        )
      }
      resultDecisionId = ins.id as string
    } else {
      const { error: upErr } = await supabase
        .from("decisions")
        .update({
          weighting,
          suggested_matches: enrichedMatches,
          excluded_ids,
          attempt_count: attempt,
        })
        .eq("id", resultDecisionId)
      if (upErr) {
        console.error("match: decisions update failed", upErr.message)
        return Response.json(
          { ok: false, error: "Failed to update decision" },
          { status: 502 },
        )
      }
    }

    const generatedInMs = Math.round(performance.now() - start)
    console.log(
      `match: attempt ${attempt}, ${enrichedMatches.length} matches, weights sum ${ws}, ${generatedInMs}ms`,
    )

    return Response.json({
      ok: true,
      decision_id: resultDecisionId,
      attempt,
      weighting,
      matches: enrichedMatches,
      generatedInMs,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      console.error("match: timeout")
      return Response.json(
        { ok: false, error: "Request timed out" },
        { status: 504 },
      )
    }
    if (err instanceof Anthropic.RateLimitError) {
      console.error("match: rate limited", err.message)
      return Response.json(
        { ok: false, error: "Rate limited. Try again in a moment." },
        { status: 429 },
      )
    }
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("match: auth failed", err.message)
      return Response.json(
        { ok: false, error: "Anthropic authentication failed" },
        { status: 502 },
      )
    }
    if (err instanceof Anthropic.APIError) {
      console.error("match: Anthropic API error", err.status, err.message)
      return Response.json(
        { ok: false, error: `Anthropic API error: ${err.message}` },
        { status: 502 },
      )
    }
    console.error("match: unexpected error", message)
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
