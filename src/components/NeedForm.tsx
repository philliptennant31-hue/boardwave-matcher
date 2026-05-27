import { useState } from "react"
import type { Requester } from "../lib/types.ts"

type SampleBrief = {
  label: string
  need: string
  requester: Requester
}

const SAMPLE_BRIEFS: SampleBrief[] = [
  {
    label: "US GTM expansion",
    need: `I'm a Series A UK SaaS founder, post-£10M ARR. Raising Series B in Q3 and opening US GTM next quarter. I've never sold into the US, so I need to figure out hiring profile (ICP-fit AE versus playbook builder), where to base the first US hires, and which US funds actually add GTM value versus brand. Looking for peers who have actually done this transition in the last 18 months, not advisors.`,
    requester: { name: "Olivia Greenwood", company: "Mosaic Ops" },
  },
  {
    label: "First VP Sales hire",
    need: `Vertical SaaS for European logistics. Bootstrapped to €4M ARR, founder-led sales until now. Made my first VP Sales hire six months ago, it isn't working. The candidate looked perfect on paper (ex Big SaaS, scaled a team from 5 to 40) but cannot operate at our stage where the playbook is still being written. Need to talk to founders who got this right on their second attempt: how did you size the role differently, what did the JD look like, and did you bring in an interim first?`,
    requester: { name: "Marc Petersen", company: "Lanevault" },
  },
  {
    label: "EU to US fundraising",
    need: `Climatetech vertical SaaS, headquartered in Stockholm, €6M ARR, 80% gross margin. Considering raising our Series B from a US lead despite zero US revenue today. Strong inbound from two NY funds and one in SF. Need to understand: do US funds actually back EU-only companies, or do they push you to relocate; how does the diligence process differ; and is the valuation premium real or talk? Want to compare notes with founders who have closed a US-led round while staying EU-headquartered.`,
    requester: { name: "Annika Forsberg", company: "Voltglass" },
  },
  {
    label: "Pricing reset before Series B",
    need: `Horizontal B2B SaaS, $7M ARR, 110% NRR. We are nine months from a Series B raise and our pricing is leaving money on the table. Currently per-seat, $15 to $40 depending on tier. We are seeing larger customers consume way more value than smaller ones but paying the same per seat. Thinking about a usage component or moving to outcome-based pricing on a slice of accounts. Need to talk to founders who have done a meaningful pricing change in the 12 months pre-Series-B, specifically what broke, how customers reacted, and how the board took it.`,
    requester: { name: "Daniel Whitmore", company: "Cobbler" },
  },
]

type Props = {
  onSubmit: (need: string, requester: Requester) => void
  submitting: boolean
}

export default function NeedForm({ onSubmit, submitting }: Props) {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [need, setNeed] = useState("")
  const [briefIdx, setBriefIdx] = useState(-1)

  const charCount = need.trim().length
  const canSubmit = name.trim() && company.trim() && charCount >= 30 && !submitting

  function cycleSample() {
    const next = (briefIdx + 1) % SAMPLE_BRIEFS.length
    const b = SAMPLE_BRIEFS[next]
    setName(b.requester.name)
    setCompany(b.requester.company)
    setNeed(b.need)
    setBriefIdx(next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(need.trim(), { name: name.trim(), company: company.trim() })
  }

  const currentLabel =
    briefIdx >= 0 ? SAMPLE_BRIEFS[briefIdx].label : null

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-surface p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Member challenge
        </h2>
        <button
          type="button"
          onClick={cycleSample}
          className="text-sm font-medium text-accent-strong hover:underline"
        >
          {currentLabel
            ? `Try another sample (${briefIdx + 1} of ${SAMPLE_BRIEFS.length})`
            : "Load a sample brief"}
        </button>
      </div>

      {currentLabel && (
        <p className="mt-1 text-xs text-muted">
          Sample loaded: <span className="font-medium text-ink/75">{currentLabel}</span>.
          Click the link again to cycle through the others.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">Requester name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Olivia Greenwood"
            className="mt-1.5 block w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Company</span>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Mosaic Ops"
            className="mt-1.5 block w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </label>
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-medium text-ink">The challenge</span>
        <textarea
          value={need}
          onChange={(e) => setNeed(e.target.value)}
          placeholder="Paste the member's request, or write it in your own words. The more specific the better."
          rows={6}
          className="mt-1.5 block w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
        />
        <span className="mt-1 block text-xs text-muted">
          {charCount} characters {charCount > 0 && charCount < 30 ? "(at least 30 needed)" : ""}
        </span>
      </label>

      <div className="mt-6 flex items-center justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-brand-gradient px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Finding matches." : "Find matches"}
        </button>
      </div>
    </form>
  )
}
