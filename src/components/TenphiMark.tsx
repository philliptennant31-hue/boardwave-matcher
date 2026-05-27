type Props = { className?: string }

/**
 * Tenphi symbol mark: a serif "T" overlapped with a phi (Φ) glyph.
 * Recreated as inline SVG, approximating the asset Phil supplied. Used in
 * the footer attribution alongside the TenphiWordmark.
 */
export default function TenphiMark({ className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Serif T in gold */}
      <g fill="#9C7C2A">
        {/* Top crossbar */}
        <rect x="10" y="14" width="44" height="7" />
        {/* Crossbar end serifs (small drops) */}
        <rect x="10" y="14" width="3" height="11" />
        <rect x="51" y="14" width="3" height="11" />
        {/* Stem */}
        <rect x="28" y="14" width="8" height="36" />
        {/* Base serif */}
        <rect x="22" y="47" width="20" height="3" />
      </g>
      {/* Phi (Φ) in teal: vertical bar + oval */}
      <g stroke="#5A95A4" strokeWidth="3.4" fill="none" strokeLinecap="round">
        <ellipse cx="36" cy="34" rx="13" ry="10" />
        <line x1="36" y1="18" x2="36" y2="52" />
      </g>
    </svg>
  )
}
