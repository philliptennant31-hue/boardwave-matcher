import { useEffect, useState } from "react"
import MatchPage from "./pages/MatchPage.tsx"
import DecisionsPage from "./pages/DecisionsPage.tsx"
import ResetDemoButton from "./components/ResetDemoButton.tsx"

function getPath(): string {
  if (typeof window === "undefined") return "/"
  return window.location.pathname
}

export default function App() {
  const [path, setPath] = useState(getPath())

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

  const NavLink = ({ to, label }: { to: string; label: string }) => {
    const active = path === to
    return (
      <button
        type="button"
        onClick={() => navigate(to)}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          active
            ? "bg-accent-soft text-accent"
            : "text-muted hover:text-ink"
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
          <div className="flex items-baseline gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="font-display text-xl font-semibold tracking-tight"
            >
              Boardwave
            </button>
            <span className="text-sm text-muted">Member matcher</span>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink to="/" label="Match" />
            <NavLink to="/decisions" label="Decisions" />
            <div className="ml-2">
              <ResetDemoButton />
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {path === "/decisions" ? <DecisionsPage /> : <MatchPage />}
      </main>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-center text-xs text-muted">
        Demo build. Nothing is sent automatically; every decision is logged for review.
      </footer>
    </div>
  )
}
