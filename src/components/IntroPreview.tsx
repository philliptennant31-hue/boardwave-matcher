import { useState } from "react"
import { patchDecision } from "../lib/api.ts"
import type { Match, Requester } from "../lib/types.ts"

type Props = {
  decisionId: string
  chosenMember: Match
  requester: Requester
  initialIntro: string
  initialTeamNote: string
  onFinish: () => void
}

export default function IntroPreview({
  decisionId,
  chosenMember,
  requester,
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

  async function persistSave() {
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

  function handleSave() {
    if (!dirty) {
      const ok = window.confirm(
        "You haven't edited the draft. Save the AI version as the final intro?",
      )
      if (!ok) return
    }
    void persistSave()
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

  function handleComposeEmail() {
    // Open the system mail client with only the outgoing intro in the body.
    // The team note is internal-only and never makes it into the email.
    // We also strip any [bracketed instruction] lines defensively in case
    // the model ever ignores its "no brackets" guard rail.
    const subject = `Boardwave intro: ${requester.name} and ${chosenMember.name}`
    const cleaned = intro
      .split("\n")
      .filter((line) => !/^\s*\[.+\]\s*$/.test(line))
      .join("\n")
      .trim()
    const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(cleaned)}`
    window.location.href = href
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
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
          <p className="text-xs text-muted">
            Stays internal. In v2 this lands in the team's review channel
            alongside the intro. Never sent to the recipients.
          </p>
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

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted">
            {savedAt
              ? `Saved at ${savedAt.toLocaleTimeString()}`
              : dirty
                ? "Unsaved edits"
                : "No edits yet"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink transition hover:bg-subtle"
            >
              {copied ? "Copied" : "Copy intro"}
            </button>
            <button
              type="button"
              onClick={handleComposeEmail}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink transition hover:bg-subtle"
            >
              Compose in email
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
            >
              {saving ? "Saving." : "Save final version"}
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
        Nothing has been sent. Sending is a future integration. For now the
        draft is logged in the decisions table for your records.
      </p>
    </div>
  )
}
