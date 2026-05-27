import { Fragment, useState } from "react"
import type { Decision } from "../lib/types.ts"

function outcomeChip(outcome: Decision["outcome"]) {
  const map: Record<Decision["outcome"], { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-warn/10 text-warn" },
    approved: { label: "Approved", cls: "bg-positive/10 text-positive" },
    rejected_all: { label: "Rejected all", cls: "bg-danger/10 text-danger" },
    abandoned: { label: "Abandoned", cls: "bg-muted/10 text-muted" },
  }
  const v = map[outcome]
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${v.cls}`}>
      {v.label}
    </span>
  )
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

export default function DecisionsTable({ decisions }: { decisions: Decision[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (decisions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-canvas p-10 text-center text-sm text-muted">
        No decisions logged yet. Match a challenge to see one appear here.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-subtle text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-5 py-3 font-medium">Logged</th>
            <th className="px-5 py-3 font-medium">Requester</th>
            <th className="px-5 py-3 font-medium">Need</th>
            <th className="px-5 py-3 font-medium">Chosen match</th>
            <th className="px-5 py-3 font-medium">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((d) => {
            const open = openId === d.id
            return (
              <Fragment key={d.id}>
                <tr
                  onClick={() => setOpenId(open ? null : d.id)}
                  className="cursor-pointer border-b border-line transition last:border-0 hover:bg-subtle"
                >
                  <td className="px-5 py-3 text-xs text-muted">{formatTimestamp(d.created_at)}</td>
                  <td className="px-5 py-3 text-ink">
                    {d.requester_name ?? "—"}
                    {d.requester_company && (
                      <span className="text-muted"> · {d.requester_company}</span>
                    )}
                  </td>
                  <td className="max-w-md truncate px-5 py-3 text-ink/80">{d.need}</td>
                  <td className="px-5 py-3 text-ink">
                    {d.chosen_member ? (
                      <>
                        {d.chosen_member.name}
                        <span className="text-muted"> · {d.chosen_member.company}</span>
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">{outcomeChip(d.outcome)}</td>
                </tr>
                {open && (
                  <tr className="border-b border-line bg-subtle/40">
                    <td colSpan={5} className="px-5 py-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-muted">
                            Full need
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">{d.need}</p>
                        </div>
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-muted">
                            Drafted intro
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">
                            {d.intro_text ?? "Not drafted."}
                          </p>
                          {d.team_note && (
                            <>
                              <div className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">
                                Team note
                              </div>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">
                                {d.team_note}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
                        <span>Attempts: {d.attempt_count}</span>
                        <span>·</span>
                        <span>
                          Suggested:{" "}
                          {d.suggested_matches?.map((m) => m.name).join(", ") ?? "—"}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
