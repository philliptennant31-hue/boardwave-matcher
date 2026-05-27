/**
 * One-shot seed script.
 *   npm run seed
 *
 * Upserts src/seed/members.json into the Supabase `members` table using the
 * service role key. Idempotent — safe to re-run.
 */

import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const MEMBERS_PATH = resolve(__dirname, "..", "src", "seed", "members.json")

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing env var: ${name}`)
    console.error(`Set it in .env at the repo root. See .env.example.`)
    process.exit(1)
  }
  return v
}

async function main() {
  const url = requireEnv("SUPABASE_URL")
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY")

  const raw = await readFile(MEMBERS_PATH, "utf8")
  const members = JSON.parse(raw) as Array<Record<string, unknown>>
  console.log(`Loaded ${members.length} members from ${MEMBERS_PATH}`)

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase
    .from("members")
    .upsert(members, { onConflict: "slug" })
    .select("slug, name")

  if (error) {
    console.error("Seed failed:", error.message)
    process.exit(1)
  }

  console.log(`Upserted ${data?.length ?? 0} members:`)
  for (const m of data ?? []) {
    console.log(`  - ${m.slug}  ${m.name}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
