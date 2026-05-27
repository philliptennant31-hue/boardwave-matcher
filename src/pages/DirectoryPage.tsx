import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase.ts"
import type { Member } from "../lib/types.ts"
import MemberProfileCard from "../components/MemberProfileCard.tsx"

export default function DirectoryPage() {
  const [members, setMembers] = useState<Member[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setError("Browser Supabase client not configured.")
      return
    }
    let alive = true
    supabase
      .from("members")
      .select("*")
      .order("name")
      .then(({ data, error: err }) => {
        if (!alive) return
        if (err) {
          setError(err.message)
          return
        }
        setMembers((data ?? []) as Member[])
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Member directory
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          The 12 senior software founders and CEOs the matcher chooses from. In
          production this would be the full Boardwave community; for the demo
          it is a representative slice with deliberate variety so the matcher
          has signal to work with.
        </p>
      </div>
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {members === null && !error ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-muted">
          Loading directory.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(members ?? []).map((m) => (
            <MemberProfileCard key={m.id} member={m} compact />
          ))}
        </div>
      )}
    </div>
  )
}
