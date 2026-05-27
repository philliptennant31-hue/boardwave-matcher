import type { Context } from "@netlify/functions"
import Anthropic from "@anthropic-ai/sdk"
import { serverSupabase } from "./_lib/supabase.ts"
import { HOUSE_STYLE_EXAMPLES } from "../../src/seed/house-style.ts"

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6"

const SYSTEM_PROMPT = `You write peer-to-peer intros for Boardwave, a private community of senior software founders and CEOs who help each other through their hardest business decisions. Use the draft_intro tool to return your result.

The intros sit in between two busy operators. They are warm, brief, specific, and never salesy. Two to four sentences. They name the requester's challenge in passing (not a recap, just enough to anchor) and reference one or two specific things about the matched member that make them the right person. They frame the connection as TWO-WAY: what each side has to gain. Connections should never read as a favour.

You also write a short team_note: a one or two sentence INTERNAL context the Boardwave team sees alongside the intro before they decide to send it. This is for them, not for the recipients. It captures the matching logic in plain English so they can sanity-check. Internal language, no salutations, no signoffs.

Hard rules:
- No subject line. No signoffs ("Best", "Thanks", names at the bottom).
- Address both parties by first name in the opening sentence.
- Never describe a party in a way that contradicts their bio or stage.
- Avoid "I think you should connect because..." framing. Just connect them.
- Avoid LinkedIn-speak ("synergies", "leverage", "alignment", "best in class").
- Do not use em dashes anywhere in your output. Use commas, full stops or restructure.
- Mirror the tone of the example intros provided in the user message. Direct, no fluff.`

type DraftResult = { intro: string; team_note: string }

const DRAFT_INTRO_TOOL: Anthropic.Tool = {
  name: "draft_intro",
  description:
    "Return a warm, brief peer-to-peer intro between the requester and the chosen Boardwave member, plus an internal team note explaining the matching logic.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      intro: { type: "string", minLength: 80, maxLength: 1200 },
      team_note: { type: "string", minLength: 30, maxLength: 600 },
    },
    required: ["intro", "team_note"],
  },
}

function isDraftResult(v: unknown): v is DraftResult {
  if (!v || typeof v !== "object") return false
  const r = v as Record<string, unknown>
  return typeof r.intro === "string" && typeof r.team_note === "string"
}

/**
 * Strip em dashes (U+2014) and en dashes (U+2013). Belt-and-braces with the
 * prompt rule. The model occasionally still slips one in.
 */
function stripDashes(s: string): string {
  return s.replace(/\s*[—–]\s*/g, ", ").replace(/[—–]/g, "-")
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

  type DraftBody = { decision_id?: unknown; chosen_member_id?: unknown }
  let body: DraftBody
  try {
    body = (await req.json()) as DraftBody
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 })
  }
  const decisionId =
    typeof body.decision_id === "string" ? body.decision_id : ""
  const chosenMemberId =
    typeof body.chosen_member_id === "string" ? body.chosen_member_id : ""
  if (!decisionId || !chosenMemberId) {
    return Response.json(
      { ok: false, error: "`decision_id` and `chosen_member_id` are required" },
      { status: 400 },
    )
  }

  const supabase = serverSupabase()

  const { data: decision, error: dErr } = await supabase
    .from("decisions")
    .select(
      "id, need, requester_name, requester_company, suggested_matches, outcome",
    )
    .eq("id", decisionId)
    .single()
  if (dErr || !decision) {
    console.error("draft-intro: decision not found", dErr?.message)
    return Response.json(
      { ok: false, error: "Decision not found" },
      { status: 404 },
    )
  }

  const { data: member, error: mErr } = await supabase
    .from("members")
    .select("id, name, company, role, stage, sectors, geography, expertise, bio")
    .eq("id", chosenMemberId)
    .single()
  if (mErr || !member) {
    console.error("draft-intro: member not found", mErr?.message)
    return Response.json(
      { ok: false, error: "Chosen member not found" },
      { status: 404 },
    )
  }

  const client = new Anthropic({ maxRetries: 0 })
  const start = performance.now()

  try {
    const userMessage = [
      `Requester: ${decision.requester_name} at ${decision.requester_company}.`,
      ``,
      `The requester's challenge (verbatim):`,
      `---`,
      decision.need,
      `---`,
      ``,
      `The matched member's profile:`,
      `---`,
      JSON.stringify(member, null, 2),
      `---`,
      ``,
      `Two house-style examples to mirror in tone and length:`,
      `---`,
      JSON.stringify(HOUSE_STYLE_EXAMPLES, null, 2),
      `---`,
      ``,
      `Now call the draft_intro tool with the intro and team_note.`,
    ].join("\n")

    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [DRAFT_INTRO_TOOL],
        tool_choice: { type: "tool", name: "draft_intro" },
        messages: [{ role: "user", content: userMessage }],
      },
      // Local netlify dev's lambda emulator adds overhead vs direct execution;
      // give the SDK headroom. Production is capped at 30s by netlify.toml.
      { timeout: 60_000 },
    )

    const toolBlock = response.content.find((b) => b.type === "tool_use")
    if (!toolBlock || toolBlock.type !== "tool_use" || toolBlock.name !== "draft_intro") {
      console.error("draft-intro: no draft_intro tool_use in response", response.stop_reason)
      return Response.json(
        { ok: false, error: "Model did not call the draft_intro tool" },
        { status: 502 },
      )
    }

    const parsed: unknown = toolBlock.input
    if (!isDraftResult(parsed)) {
      console.error("draft-intro: schema validation failed", parsed)
      return Response.json(
        { ok: false, error: "Tool input did not match expected schema" },
        { status: 502 },
      )
    }

    const cleanIntro = stripDashes(parsed.intro)
    const cleanTeamNote = stripDashes(parsed.team_note)

    const { error: upErr } = await supabase
      .from("decisions")
      .update({
        chosen_member_id: chosenMemberId,
        intro_text: cleanIntro,
        team_note: cleanTeamNote,
        outcome: "approved",
      })
      .eq("id", decisionId)
    if (upErr) {
      console.error("draft-intro: decisions update failed", upErr.message)
      return Response.json(
        { ok: false, error: "Failed to persist intro" },
        { status: 502 },
      )
    }

    const generatedInMs = Math.round(performance.now() - start)
    console.log(`draft-intro: ${generatedInMs}ms, decision ${decisionId}`)
    return Response.json({
      ok: true,
      intro: cleanIntro,
      team_note: cleanTeamNote,
      generatedInMs,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      return Response.json(
        { ok: false, error: "Request timed out" },
        { status: 504 },
      )
    }
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json(
        { ok: false, error: "Rate limited. Try again in a moment." },
        { status: 429 },
      )
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json(
        { ok: false, error: "Anthropic authentication failed" },
        { status: 502 },
      )
    }
    if (err instanceof Anthropic.APIError) {
      return Response.json(
        { ok: false, error: `Anthropic API error: ${err.message}` },
        { status: 502 },
      )
    }
    console.error("draft-intro: unexpected error", message)
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
