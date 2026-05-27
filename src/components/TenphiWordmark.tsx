type Props = {
  className?: string
  /** Pixel height for the cap height. The width scales proportionally. */
  size?: "sm" | "md"
}

/**
 * Tenphi wordmark: "TENPHI" with TEN in gold and PHI in teal.
 * Recreated in CSS rather than imported as an asset so it scales cleanly
 * inline alongside the Boardwave header treatment.
 */
export default function TenphiWordmark({ className, size = "md" }: Props) {
  const baseCls =
    size === "sm"
      ? "text-[11px] tracking-[0.18em]"
      : "text-sm tracking-[0.18em]"
  return (
    <span
      className={`font-sans font-bold uppercase leading-none ${baseCls} ${className ?? ""}`}
      aria-label="Tenphi"
    >
      <span style={{ color: "#9C7C2A" }}>TEN</span>
      <span style={{ color: "#5A95A4" }}>PHI</span>
    </span>
  )
}
