import { useEffect, useState } from "react"
import MatchPage from "./pages/MatchPage.tsx"
import DecisionsPage from "./pages/DecisionsPage.tsx"
import DirectoryPage from "./pages/DirectoryPage.tsx"
import ResetDemoButton from "./components/ResetDemoButton.tsx"
import BrandMark from "./components/BrandMark.tsx"
import type { Decision } from "./lib/types.ts"

function getPath(): string {
  if (typeof window === "undefined") return "/"
  return window.location.pathname
}

export default function App() {
  const [path, setPath] = useState(getPath())
  const [resumed, setResumed] = useState<Decision | null>(null)

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

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5"
          >
            <BrandMark className="h-8 w-auto" />
            <span className="font-display text-2xl font-semibold leading-none tracking-tight text-ink">
              Boardwave
            </span>
            <span className="ml-2 hidden text-sm text-muted sm:inline">
              Member matcher
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

      <main className="mx-auto max-w-5xl px-6 py-10">
        {path === "/decisions" ? (
          <DecisionsPage onResumeDecision={resumeDecision} />
        ) : path === "/directory" ? (
          <DirectoryPage />
        ) : (
          <MatchPage
            resumed={resumed}
            onResumedConsumed={() => setResumed(null)}
          />
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-center text-xs text-muted">
        Demo build. Nothing is sent automatically. Every decision is logged for review.
      </footer>
    </div>
  )
}
