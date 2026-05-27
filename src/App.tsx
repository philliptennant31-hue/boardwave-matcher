import { useEffect, useState } from "react"
import MatchPage from "./pages/MatchPage.tsx"
import DecisionsPage from "./pages/DecisionsPage.tsx"
import DirectoryPage from "./pages/DirectoryPage.tsx"
import ResetDemoButton from "./components/ResetDemoButton.tsx"
import BrandMark from "./components/BrandMark.tsx"
import TenphiWordmark from "./components/TenphiWordmark.tsx"
import TenphiMark from "./components/TenphiMark.tsx"
import type { Decision } from "./lib/types.ts"
import {
  initialMatchState,
  loadMatchState,
  saveMatchState,
  type MatchState,
} from "./lib/matchState.ts"

function getPath(): string {
  if (typeof window === "undefined") return "/"
  return window.location.pathname
}

export default function App() {
  const [path, setPath] = useState(getPath())
  const [resumed, setResumed] = useState<Decision | null>(null)

  // Match state lives at the App level so it survives navigation between
  // tabs. sessionStorage adds durability across page refresh in the same
  // tab/window.
  const [matchState, setMatchState] = useState<MatchState>(() => loadMatchState())

  useEffect(() => {
    saveMatchState(matchState)
  }, [matchState])

  useEffect(() => {
    const onPop = () => setPath(getPath())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  function navigate(to: string) {
    if (to === path) return
    window.history.pushState(null, "", to)
    setPath(to)
  }

  function resumeDecision(d: Decision) {
    setResumed(d)
    navigate("/")
  }

  function resetMatch() {
    setMatchState(initialMatchState)
  }

  const NavLink = ({ to, label }: { to: string; label: string }) => {
    const active = path === to
    return (
      <button
        type="button"
        onClick={() => navigate(to)}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
          active
            ? "bg-ink text-white"
            : "text-ink/70 hover:text-ink"
        }`}
      >
        {label}
      </button>
    )
  }

  // Decisions page carries six columns and needs a slightly wider container.
  const mainMaxWidth = path === "/decisions" ? "max-w-6xl" : "max-w-5xl"

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-left"
          >
            <BrandMark className="h-9 w-auto" />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-2xl font-semibold tracking-tight text-ink">
                Boardwave
              </span>
              <span
                className="mt-0.5 flex items-center gap-1.5 text-xs text-muted"
                title="This is a concept demo, not a Boardwave product."
              >
                Member matcher
                <span aria-hidden="true">·</span>
                <span>Concept demo by</span>
                <TenphiWordmark size="sm" />
              </span>
            </span>
          </button>
          <nav className="flex items-center gap-1">
            <NavLink to="/" label="Match" />
            <NavLink to="/directory" label="Directory" />
            <NavLink to="/decisions" label="Decisions" />
            <div className="ml-2">
              <ResetDemoButton />
            </div>
          </nav>
        </div>
      </header>

      <main className={`mx-auto ${mainMaxWidth} px-6 py-10`}>
        {path === "/decisions" ? (
          <DecisionsPage onResumeDecision={resumeDecision} />
        ) : path === "/directory" ? (
          <DirectoryPage />
        ) : (
          <MatchPage
            state={matchState}
            onStateChange={setMatchState}
            onReset={resetMatch}
            resumed={resumed}
            onResumedConsumed={() => setResumed(null)}
          />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <a
            href="https://tenphi.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Tenphi"
            className="inline-flex transition hover:opacity-80"
          >
            <TenphiMark className="h-12 w-auto opacity-90" />
          </a>
          <p className="text-xs text-muted">
            Concept demo built by{" "}
            <a
              href="https://tenphi.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="align-middle transition hover:opacity-80"
            >
              <TenphiWordmark size="sm" className="align-middle" />
            </a>{" "}
            for a Boardwave interview. Not affiliated with Boardwave.
          </p>
          <p className="text-xs text-muted">
            Nothing is sent automatically. Every decision is logged for review.
          </p>
        </div>
      </footer>
    </div>
  )
}
