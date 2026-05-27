type Props = { className?: string }

/**
 * Boardwave-inspired brand mark.
 *
 * A stylised stack of three rising waves inside a soft square, using the
 * brand's orange-to-coral gradient. The shape sits next to the "Boardwave"
 * wordmark in the header. Not a copy of the live Boardwave logo, close
 * enough to feel on-brand for the demo while clearly being our own mark.
 */
export default function BrandMark({ className }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bw-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8B5C" />
          <stop offset="100%" stopColor="#F95F88" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#bw-grad)" />
      <path
        d="M7 21 Q11 13 16 17 T25 14"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M7 25 Q11 18 16 22 T25 19"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeOpacity="0.55"
        fill="none"
      />
    </svg>
  )
}
