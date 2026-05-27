type Props = {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-canvas p-10 text-center">
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink transition hover:bg-subtle"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
