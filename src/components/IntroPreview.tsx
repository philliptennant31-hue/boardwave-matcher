import { useState } from "react"
import { patchDecision } from "../lib/api.ts"
import type { Match } from "../lib/types.ts"

type Props = {
  decisionId: string
  chosenMember: Match
  initialIntro: string
  initialTeamNote: string
  onFinish: () => void
}

export default function IntroPreview({
  decisionId,
  chosenMember,
  initialIntro,
  initialTeamNote,
  onFinish,
}: Props) {
  const [intro, setIntro] = useState(initialIntro)
  const [teamNote, setTeamNote] = useState(initialTeamNote)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty =
    intro.trim() !== initialIntro.trim() ||
    teamNote.trim() !== initialTeamNote.trim()

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await patchDecision({
        id: decisionId,
        intro_text: intro,
        team_note: teamNote,
      })
      if (!res.ok) throw new Error(res.error)
      setSavedAt(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(intro)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError("Copy failed. Select the text manually.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Drafted intro
            </h2>
            <p className="mt-1 text-sm text-muted">
              For {chosenMember.name} at {chosenMember.company}. Edit if you want, then save.
            </p>
          </div>
          <span className="rounded-full bg-positive/10 px-3 py-1 text-xs font-medium text-positive">
            Match approved
          </span>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-ink">Intro to send</span>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={7}
            className="mt-1.5 block w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm leading-relaxed focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-ink">Team note (internal)</span>
          <textarea
            value={teamNote}
            onChange={(e) => setTeamNote(e.target.value)}
            rows={3}
            className="mt-1.5 block w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </label>

        {error && (
          <div className="mt-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <div className="text-xs text-muted">
            {savedAt
              ? `Saved at ${savedAt.toLocaleTimeString()}`
              : dirty
                ? "Unsaved edits"
                : "No edits yet"}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink transition hover:bg-subtle"
            >
              {copied ? "Copied" : "Copy intro"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save final version"}
            </button>
            <button
              type="button"
              onClick={onFinish}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-muted transition hover:bg-subtle"
            >
              Finish
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted">
        Nothing has been sent. Sending is a future integration — for now this draft is logged
        in the decisions table for your records.
      </p>
    </div>
  )
}
