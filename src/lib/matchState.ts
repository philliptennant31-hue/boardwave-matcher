import type { Match, Requester, Weighting } from "./types.ts"

export type MatchStatus =
  | "idle"
  | "matching"
  | "reviewing"
  | "drafting"
  | "drafted"
  | "exhausted"
  | "error"

export type MatchState = {
  status: MatchStatus
  error: string | null
  need: string
  requester: Requester
  decisionId: string | null
  attempt: 1 | 2 | 3
  excludedIds: string[]
  matches: Match[]
  weighting: Weighting | null
  chosen: Match | null
  intro: string
  teamNote: string
}

export const initialMatchState: MatchState = {
  status: "idle",
  error: null,
  need: "",
  requester: { name: "", company: "" },
  decisionId: null,
  attempt: 1,
  excludedIds: [],
  matches: [],
  weighting: null,
  chosen: null,
  intro: "",
  teamNote: "",
}

const STORAGE_KEY = "boardwave-matcher-state"

/**
 * Read a previously-saved MatchState from sessionStorage. Returns the
 * initial state if nothing was saved or the saved blob is malformed.
 * sessionStorage is per-tab so this gives us state durability across
 * refresh and reopen-in-same-session without leaking between tabs.
 */
export function loadMatchState(): MatchState {
  if (typeof window === "undefined") return initialMatchState
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return initialMatchState
    const parsed = JSON.parse(raw) as Partial<MatchState>
    return { ...initialMatchState, ...parsed }
  } catch {
    return initialMatchState
  }
}

export function saveMatchState(s: MatchState): void {
  if (typeof window === "undefined") return
  try {
    // Transient statuses don't survive a reload usefully (no in-flight
    // request to re-attach to), so persist them as "idle" if matching or
    // "reviewing" if drafting.
    const persisted: MatchState =
      s.status === "matching"
        ? { ...s, status: "idle" }
        : s.status === "drafting"
          ? { ...s, status: "reviewing" }
          : s
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  } catch {
    // Storage may throw if quota exceeded or in private mode. Best-effort.
  }
}

export function clearMatchState(): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
