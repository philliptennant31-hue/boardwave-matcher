import { useState } from "react"
import { postResetDemo } from "../lib/api.ts"

function isResetEnabled(): boolean {
  if (import.meta.env.VITE_DEMO_RESET === "1") return true
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get("reset") === "1"
  }
  return false
}

export default function ResetDemoButton() {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  if (!isResetEnabled()) return null

  async function handle() {
    const ok = window.confirm(
      "Wipe all decisions and reseed members? This cannot be undone.",
    )
    if (!ok) return
    setBusy(true)
    setStatus(null)
    try {
      const res = await postResetDemo()
      if (!res.ok) throw new Error(res.error)
      setStatus(`Reset. ${res.members} members reseeded.`)
      setTimeout(() => window.location.reload(), 1200)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {status && <span className="text-xs text-muted">{status}</span>}
      <button
        type="button"
        onClick={handle}
        disabled={busy}
        className="rounded-lg border border-dashed border-warn/40 bg-warn/5 px-3 py-1.5 text-xs font-medium text-warn transition hover:bg-warn/10 disabled:opacity-50"
      >
        {busy ? "Resetting…" : "Reset demo"}
      </button>
    </div>
  )
}
