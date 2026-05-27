import type { Context } from "@netlify/functions"
import { serverSupabase } from "./_lib/supabase.ts"
import membersSeed from "../../src/seed/members.json" with { type: "json" }

export default async (req: Request, _context: Context) => {
  if (process.env.DEMO_RESET !== "1") {
    return new Response("Not found", { status: 404 })
  }
  if (req.method !== "POST") {
    return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 })
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json(
      { ok: false, error: "Supabase env vars are not set" },
      { status: 500 },
    )
  }

  const supabase = serverSupabase()

  // Wipe all decisions.
  const { error: delErr } = await supabase
    .from("decisions")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
  if (delErr) {
    console.error("reset-demo: decisions delete failed", delErr.message)
    return Response.json(
      { ok: false, error: "Failed to wipe decisions" },
      { status: 502 },
    )
  }

  // Reseed members.
  const { data, error: upErr } = await supabase
    .from("members")
    .upsert(membersSeed, { onConflict: "slug" })
    .select("slug")
  if (upErr) {
    console.error("reset-demo: members upsert failed", upErr.message)
    return Response.json(
      { ok: false, error: "Failed to reseed members" },
      { status: 502 },
    )
  }

  console.log(`reset-demo: wiped decisions, upserted ${data?.length ?? 0} members`)
  return Response.json({
    ok: true,
    members: data?.length ?? 0,
  })
}
