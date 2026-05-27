import { useEffect, useState } from "react"

const STORAGE_KEY = "boardwave-matcher-orientation-dismissed"

/**
 * Small three-step "How this works" card shown above the brief form on
 * first visit. Dismissable, with the dismissal persisted in localStorage
 * so it doesn't reappear for a returning reviewer.
 *
 * Wording is intentionally written for someone who lands cold without a
 * live walkthrough.
 */
export default function OrientationBanner() {
  // Default to dismissed during SSR/initial render to avoid a flash; the
  // effect below corrects to the persisted value on mount.
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      const persisted = window.localStorage.getItem(STORAGE_KEY)
      setDismissed(persisted === "1")
    } catch {
      setDismissed(false)
    }
  }, [])

  function handleDismiss() {
    setDismissed(true)
    try {
      window.localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // Storage may throw in private mode; the in-memory state still hides
      // the banner for the rest of this session.
    }
  }

  if (dismissed) return null

  return (
    <div className="relative rounded-2xl border border-line bg-surface p-6 pr-12">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss orientation"
        className="absolute right-3 top-3 rounded-full p-1.5 text-muted transition hover:bg-subtle hover:text-ink"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div className="text-xs font-medium uppercase tracking-wide text-muted">
        How this works
      </div>
      <ol className="mt-3 space-y-2 text-sm leading-relaxed text-ink/85">
        <li className="flex gap-2.5">
          <span className="font-display text-sm font-semibold text-accent-strong">1.</span>
          <span>
            Submit a member&rsquo;s business challenge below. Try the
            sample if you want a realistic brief.
          </span>
        </li>
        <li className="flex gap-2.5">
          <span className="font-display text-sm font-semibold text-accent-strong">2.</span>
          <span>
            The matcher weights five factors for this specific brief and
            proposes three peers with per-factor scoring and reasoning.
          </span>
        </li>
        <li className="flex gap-2.5">
          <span className="font-display text-sm font-semibold text-accent-strong">3.</span>
          <span>
            Approve one to draft a peer-to-peer intro in Boardwave&rsquo;s
            house style. Every match, score and decision is captured in
            the Decisions log for the future learning layer.
          </span>
        </li>
      </ol>
    </div>
  )
}
