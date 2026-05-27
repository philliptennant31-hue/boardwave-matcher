import { useState } from "react"
import type { Requester } from "../lib/types.ts"

const SAMPLE_NEED = `I'm a Series A UK SaaS founder, post-£10M ARR. Raising Series B in Q3 and opening US GTM next quarter. I've never sold into the US — need to figure out hiring profile (ICP-fit AE versus playbook builder), where to base the first US hires, and which US funds actually add GTM value versus brand. Looking for peers who have actually done this transition in the last 18 months, not advisors.`

const SAMPLE_REQUESTER: Requester = {
  name: "Olivia Greenwood",
  company: "Mosaic Ops",
}

type Props = {
  onSubmit: (need: string, requester: Requester) => void
  submitting: boolean
}

export default function NeedForm({ onSubmit, submitting }: Props) {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [need, setNeed] = useState("")

  const charCount = need.trim().length
  const canSubmit = name.trim() && company.trim() && charCount >= 30 && !submitting

  function loadSample() {
    setName(SAMPLE_REQUESTER.name)
    setCompany(SAMPLE_REQUESTER.company)
    setNeed(SAMPLE_NEED)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(need.trim(), { name: name.trim(), company: company.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-surface p-8">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold tracking-tight">Member challenge</h2>
        <button
          type="button"
          onClick={loadSample}
          className="text-sm text-accent hover:underline"
        >
          Load sample brief
        </button>
      </div>

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
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 hover:bg-indigo-700"
        >
          {submitting ? "Finding matches…" : "Find matches"}
        </button>
      </div>
    </form>
  )
}
