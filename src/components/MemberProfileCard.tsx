import type { Member, Stage } from "../lib/types.ts"

const STAGE_LABELS: Record<Stage, string> = {
  "pre-seed": "Pre-seed",
  "seed": "Seed",
  "series-a": "Series A",
  "series-b": "Series B",
  "series-c": "Series C",
  "exit": "Exited",
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-subtle px-2.5 py-0.5 text-xs font-medium text-ink/75">
      {children}
    </span>
  )
}

type Props = {
  member: Member
  compact?: boolean
}

export default function MemberProfileCard({ member, compact }: Props) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface ${
        compact ? "p-5" : "p-7"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className={`font-display font-semibold tracking-tight ${compact ? "text-lg" : "text-2xl"}`}>
            {member.name}
          </h3>
          <p className="text-sm text-muted">
            {member.role ? `${member.role}, ` : ""}
            {member.company}
            {member.geography ? ` · ${member.geography}` : ""}
          </p>
        </div>
        {member.stage && (
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-strong">
            {STAGE_LABELS[member.stage]}
          </span>
        )}
      </div>

      {member.bio && (
        <p className={`mt-3 leading-relaxed text-ink/85 ${compact ? "text-sm" : "text-base"}`}>
          {member.bio}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {member.sectors?.length > 0 && (
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Sectors
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {member.sectors.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </div>
        )}
        {member.expertise?.length > 0 && (
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Expertise
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {member.expertise.map((e) => (
                <Chip key={e}>{e}</Chip>
              ))}
            </div>
          </div>
        )}
        {member.open_to?.length > 0 && (
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Open to
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {member.open_to.map((o) => (
                <Chip key={o}>{o}</Chip>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
