type Props = { className?: string }

/**
 * Tenphi symbol mark. Renders /tenphi-mark.png served from Vite's public/
 * folder. If the file is missing at runtime the user will see a broken
 * image icon; the surrounding app continues to function.
 *
 * Drop your asset at public/tenphi-mark.png. PNG is preferred (transparent
 * background). An SVG saved at the same path works too — change the file
 * extension below if you go that route.
 */
export default function TenphiMark({ className }: Props) {
  return (
    <img
      src="/tenphi-mark.png"
      alt="Tenphi"
      className={className}
      // Decode async + no draggable so it behaves like a UI mark, not a photo.
      decoding="async"
      draggable={false}
    />
  )
}
