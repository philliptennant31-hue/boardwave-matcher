type Size = "sm" | "md" | "lg"

type Props = {
  name: string
  slug?: string
  size?: Size
  className?: string
}

/**
 * Circular initial-monogram avatar. Background colour is deterministic
 * from the member's slug (or name as fallback) so the same person always
 * gets the same colour across the app.
 *
 * Palette is intentionally tight: six mid-saturation hues that sit
 * comfortably alongside the coral brand without competing with it.
 */
const PALETTE: ReadonlyArray<{ bg: string; ring: string }> = [
  { bg: "#5959ff", ring: "ring-indigo-200" }, // brand indigo
  { bg: "#0d9488", ring: "ring-teal-200" },
  { bg: "#d97706", ring: "ring-amber-200" },
  { bg: "#e11d48", ring: "ring-rose-200" },
  { bg: "#475569", ring: "ring-slate-200" },
  { bg: "#059669", ring: "ring-emerald-200" },
]

const SIZE_CLS: Record<Size, { box: string; text: string }> = {
  sm: { box: "h-8 w-8", text: "text-xs" },
  md: { box: "h-12 w-12", text: "text-base" },
  lg: { box: "h-14 w-14", text: "text-lg" },
}

function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ""
  return (first + (last ?? "")).toUpperCase()
}

function hash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export default function MemberAvatar({
  name,
  slug,
  size = "md",
  className = "",
}: Props) {
  const seed = slug || name
  const palette = PALETTE[hash(seed) % PALETTE.length]!
  const sz = SIZE_CLS[size]
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm ${sz.box} ${sz.text} ${className}`}
      style={{ backgroundColor: palette.bg }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}
