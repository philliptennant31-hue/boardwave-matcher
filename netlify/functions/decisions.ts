import type { Context } from "@netlify/functions"
import { serverSupabase } from "./_lib/supabase.ts"

const VALID_OUTCOMES = ["pending", "approved", "rejected_all", "abandoned"] as const
type Outcome = (typeof VALID_OUTCOMES)[number]

function isOutcome(v: unknown): v is Outcome {
  return typeof v === "string" && (VALID_OUTCOMES as readonly string[]).includes(v)
}

export default async (req: Request, _context: Context) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json(
      { ok: false, error: "Supabase env vars are not set" },
      { status: 500 },
    )
  }

  const supabase = serverSupabase()

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("decisions")
      .select(
        `
        id,
        created_at,
        requester_name,
        requester_company,
        need,
        weighting,
        suggested_matches,
        excluded_ids,
        attempt_count,
        chosen_member_id,
        intro_text,
        team_note,
        outcome,
        chosen_member:members!chosen_member_id ( name, company )
        `,
      )
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("decisions GET: select failed", error.message)
      return Response.json(
        { ok: false, error: "Failed to load decisions" },
        { status: 502 },
      )
    }
    return Response.json({ ok: true, decisions: data ?? [] })
  }

  if (req.method === "POST") {
    type PatchBody = {
      id?: unknown
      intro_text?: unknown
      team_note?: unknown
      outcome?: unknown
    }
    let body: PatchBody
    try {
      body = (await req.json()) as PatchBody
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 })
    }

    const id = typeof body.id === "string" ? body.id : ""
    if (!id) {
      return Response.json({ ok: false, error: "`id` is required" }, { status: 400 })
    }

    const patch: Record<string, unknown> = {}
    if (typeof body.intro_text === "string") patch.intro_text = body.intro_text
    if (typeof body.team_note === "string") patch.team_note = body.team_note
    if (body.outcome !== undefined) {
      if (!isOutcome(body.outcome)) {
        return Response.json(
          {
            ok: false,
            error: `\`outcome\` must be one of: ${VALID_OUTCOMES.join(", ")}`,
          },
          { status: 400 },
        )
      }
      patch.outcome = body.outcome
    }

    if (Object.keys(patch).length === 0) {
      return Response.json(
        { ok: false, error: "No fields to update" },
        { status: 400 },
      )
    }

    const { error } = await supabase
      .from("decisions")
      .update(patch)
      .eq("id", id)

    if (error) {
      console.error("decisions POST: update failed", error.message)
      return Response.json(
        { ok: false, error: "Failed to update decision" },
        { status: 502 },
      )
    }
    return Response.json({ ok: true })
  }

  return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 })
}
