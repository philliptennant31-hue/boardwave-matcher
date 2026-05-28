import { Fragment, useState } from "react"
import type { Decision } from "../lib/types.ts"
import MemberAvatar from "./MemberAvatar.tsx"

function outcomeChip(outcome: Decision["outcome"]) {
  const map: Record<Decision["outcome"], { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-warn/10 text-warn" },
    approved: { label: "Approved", cls: "bg-positive/10 text-positive" },
    rejected_all: { label: "Rejected all", cls: "bg-danger/10 text-danger" },
    abandoned: { label: "Abandoned", cls: "bg-muted/10 text-muted" },
  }
  const v = map[outcome]
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${v.cls}`}>
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

function NameAndCompany({
  name,
  company,
  showAvatar,
}: {
  name: string | null
  company: string | null
  showAvatar?: boolean
}) {
  if (!name && !company) return <span className="text-muted">-</span>
  return (
    <div className="flex items-center gap-2.5 leading-tight">
      {showAvatar && name && <MemberAvatar name={name} size="sm" />}
      <div className="min-w-0">
        <div className="truncate font-medium text-ink">{name ?? "-"}</div>
        {company && <div className="truncate text-xs text-muted">{company}</div>}
      </div>
    </div>
  )
}

type Props = {
  decisions: Decision[]
  onResume: (d: Decision) => void
}

export default function DecisionsTable({ decisions, onResume }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (decisions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-canvas p-10 text-center text-sm text-muted">
        No decisions logged yet. Match a challenge to see one appear here.
      </div>
    )
  }

  return (
    <>
      {/* Desktop / tablet table layout. Hidden below md. */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
        <table className="w-full text-left text-sm">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "18%" }} />
            <col />
            <col style={{ width: "18%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "9%" }} />
          </colgroup>
          <thead className="border-b border-line bg-subtle text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Logged</th>
              <th className="px-5 py-3 font-medium">Requester</th>
              <th className="px-5 py-3 font-medium">Need</th>
              <th className="px-5 py-3 font-medium">Chosen match</th>
              <th className="px-5 py-3 font-medium">Outcome</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {decisions.map((d) => {
              const open = openId === d.id
              const canResume = d.outcome === "pending" && !!d.suggested_matches?.length
              return (
                <Fragment key={d.id}>
                  <tr
                    onClick={() => setOpenId(open ? null : d.id)}
                    className="cursor-pointer border-b border-line align-top transition last:border-0 hover:bg-subtle"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-muted">
                      {formatTimestamp(d.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <NameAndCompany
                        name={d.requester_name}
                        company={d.requester_company}
                      />
                    </td>
                    <td className="px-5 py-3 text-ink/80">
                      <p className="line-clamp-2 max-w-prose leading-snug">{d.need}</p>
                    </td>
                    <td className="px-5 py-3">
                      {d.chosen_member ? (
                        <NameAndCompany
                          name={d.chosen_member.name}
                          company={d.chosen_member.company}
                          showAvatar
                        />
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3">{outcomeChip(d.outcome)}</td>
                    <td className="px-5 py-3 pr-6 text-right">
                      {canResume ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onResume(d)
                          }}
                          className="whitespace-nowrap rounded-md border border-accent-strong/30 bg-accent-soft px-3 py-1 text-xs font-medium text-accent-strong transition hover:bg-accent-soft/70"
                        >
                          Resume
                        </button>
                      ) : null}
                    </td>
                  </tr>
                  {open && (
                    <tr className="border-b border-line bg-subtle/40">
                      <td colSpan={6} className="px-5 py-5">
                        <ExpandedDetail d={d} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list. Hidden at md and up. */}
      <div className="space-y-3 md:hidden">
        {decisions.map((d) => {
          const open = openId === d.id
          const canResume = d.outcome === "pending" && !!d.suggested_matches?.length
          return (
            <div
              key={d.id}
              className="rounded-2xl border border-line bg-surface p-4"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : d.id)}
                className="block w-full text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-muted">
                      {formatTimestamp(d.created_at)}
                    </div>
                    <div className="mt-1.5">
                      <NameAndCompany
                        name={d.requester_name}
                        company={d.requester_company}
                      />
                    </div>
                  </div>
                  <div className="shrink-0">{outcomeChip(d.outcome)}</div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-snug text-ink/80">
                  {d.need}
                </p>
                {d.chosen_member && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                    <span className="shrink-0">Chosen</span>
                    <span aria-hidden="true">·</span>
                    <div className="min-w-0 flex-1">
                      <NameAndCompany
                        name={d.chosen_member.name}
                        company={d.chosen_member.company}
                        showAvatar
                      />
                    </div>
                  </div>
                )}
              </button>
              {canResume && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onResume(d)}
                    className="whitespace-nowrap rounded-md border border-accent-strong/30 bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent-strong transition hover:bg-accent-soft/70"
                  >
                    Resume
                  </button>
                </div>
              )}
              {open && (
                <div className="mt-4 border-t border-line pt-4">
                  <ExpandedDetail d={d} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function ExpandedDetail({ d }: { d: Decision }) {
  return (
    <div className="space-y-5">
      <section>
        <div className="text-xs font-medium uppercase tracking-wide text-muted">
          Full need
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
          {d.need}
        </p>
      </section>

      <section>
        <div className="text-xs font-medium uppercase tracking-wide text-muted">
          Drafted intro
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
          {d.intro_text ?? "Not drafted."}
        </p>
      </section>

      {d.team_note && (
        <section>
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Team note
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
            {d.team_note}
          </p>
        </section>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>Attempts: {d.attempt_count}</span>
        <span aria-hidden="true">·</span>
        <span>
          Suggested: {d.suggested_matches?.map((m) => m.name).join(", ") ?? "-"}
        </span>
      </div>
    </div>
  )
}
