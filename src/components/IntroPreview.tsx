import { useState } from "react"
import { patchDecision } from "../lib/api.ts"
import type { Match, Requester } from "../lib/types.ts"
import Lightbox from "./Lightbox.tsx"

type Props = {
  decisionId: string
  chosenMember: Match
  requester: Requester
  initialIntro: string
  initialTeamNote: string
  onFinish: () => void
}

type Modal = null | "save-confirm-empty" | "saved" | "discard-confirm"

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
  const [modal, setModal] = useState<Modal>(null)

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
      setModal("saved")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  function handleSave() {
    if (!dirty && !savedAt) {
      setModal("save-confirm-empty")
      return
    }
    void persistSave()
  }

  function handleFinishClick() {
    if (dirty && !savedAt) {
      setModal("discard-confirm")
      return
    }
    onFinish()
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
    // Launch the system mail client with subject + cleaned intro body.
    // Bracketed instruction lines are stripped defensively in case the AI
    // ever ignores its "no brackets" guard rail. Team note is excluded —
    // it's internal-only.
    const cleaned = intro
      .split("\n")
      .filter((line) => !/^\s*\[.+\]\s*$/.test(line))
      .join("\n")
      .trim()
    const subject = `Boardwave intro: ${requester.name} and ${chosenMember.name}`
    const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(cleaned)}`
    window.location.href = href
  }

  function dismissAndReset() {
    setModal(null)
    onFinish()
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
              onClick={handleFinishClick}
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

      {/* ── Confirm save with no edits ──────────────────────────────────── */}
      <Lightbox
        open={modal === "save-confirm-empty"}
        onClose={() => setModal(null)}
        ariaLabel="Confirm save without edits"
      >
        <div className="p-7">
          <h3 className="font-display text-xl font-semibold tracking-tight">
            Save the AI draft as final?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            You haven&rsquo;t edited the intro. Saving will lock in the AI
            version as the final intro for this decision.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink transition hover:bg-subtle"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setModal(null)
                void persistSave()
              }}
              className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
            >
              Save the AI version
            </button>
          </div>
        </div>
      </Lightbox>

      {/* ── Post-save: what happens next in production ──────────────────── */}
      <Lightbox
        open={modal === "saved"}
        onClose={() => setModal(null)}
        ariaLabel="Saved confirmation"
      >
        <div className="p-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-3 py-1 text-xs font-medium text-positive">
            Saved to decisions log
          </span>
          <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
            What would happen next
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            In production, saving the final version would:
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/80">
            <li className="flex gap-2">
              <span className="text-accent-strong">1.</span>
              <span>
                Post the intro and team note to the Boardwave team&rsquo;s
                Slack review channel.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent-strong">2.</span>
              <span>
                Await human sign-off from a community manager before
                anything is sent to the matched pair.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent-strong">3.</span>
              <span>
                Update the decisions log with the send timestamp and any
                follow-up signal (response, meeting booked, outcome).
              </span>
            </li>
          </ul>
          <p className="mt-4 rounded-lg border border-line bg-subtle px-3 py-2 text-xs leading-relaxed text-ink/70">
            For the demo, the draft is captured in the decisions table.
            Visit the Decisions tab to see it logged.
          </p>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={dismissAndReset}
              className="rounded-lg bg-brand-gradient px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
            >
              Got it &middot; Start a new brief
            </button>
          </div>
        </div>
      </Lightbox>

      {/* ── Discard unsaved edits ──────────────────────────────────────── */}
      <Lightbox
        open={modal === "discard-confirm"}
        onClose={() => setModal(null)}
        ariaLabel="Discard unsaved edits"
      >
        <div className="p-7">
          <h3 className="font-display text-xl font-semibold tracking-tight">
            Discard your edits?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            You have unsaved changes to the intro or team note. Leaving now
            will lose them.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink transition hover:bg-subtle"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={() => {
                setModal(null)
                onFinish()
              }}
              className="rounded-lg border border-danger/40 bg-danger/5 px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger/10"
            >
              Discard and start over
            </button>
          </div>
        </div>
      </Lightbox>
    </div>
  )
}

