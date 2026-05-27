/**
 * Engagement signals shown on each member's profile lightbox.
 *
 * These numbers are fictional but tuned to be coherent with each bio:
 * active series-B/C operators in the directory engage more frequently and
 * have higher response rates; exited founders engage selectively, often
 * around investing; early-stage founders are less available.
 *
 * In production these would be derived from the decisions log — every
 * suggested intro, accept, reject, and follow-up is data. The "learned
 * signal" is the kind of human-readable pattern the model could surface
 * from that log over time (e.g. "best fit for founders X stages earlier").
 *
 * Keyed by member slug so members.json is the source of identity and this
 * file is purely supplementary. If a slug is missing the profile lightbox
 * simply omits the section.
 */

export type EngagementSignals = {
  /** Intros made (suggested + accepted) in the last six months. */
  intros_made_6m: number
  /** 0–1. Share of suggested intros where the member responded within a week. */
  response_rate: number
  /** Human-readable relative timestamp, e.g. "3 weeks ago". */
  last_engaged: string
  /** A single sentence the system would learn from the decisions log. */
  learned_signal: string
}

const ENGAGEMENT_BY_SLUG: Record<string, EngagementSignals> = {
  m_anna_klein: {
    intros_made_6m: 9,
    response_rate: 0.94,
    last_engaged: "4 days ago",
    learned_signal:
      "Best fit for founders 6 to 12 months behind on US enterprise GTM. Tends to decline early-stage conversations.",
  },
  m_james_okonkwo: {
    intros_made_6m: 12,
    response_rate: 0.88,
    last_engaged: "1 week ago",
    learned_signal:
      "High engagement when the brief mentions US fund selection or VP Sales hiring. Less responsive to product-led growth questions.",
  },
  m_marta_costa: {
    intros_made_6m: 7,
    response_rate: 0.91,
    last_engaged: "2 weeks ago",
    learned_signal:
      "Strongest signal on regulated-market expansion. Accepts most intros with European founders moving cross-border.",
  },
  m_henrik_lindqvist: {
    intros_made_6m: 4,
    response_rate: 0.86,
    last_engaged: "3 weeks ago",
    learned_signal:
      "Engages reliably with Nordic peers. Slower to respond when the brief is US-focused, given Nordkapp's European-only stance today.",
  },
  m_priya_raman: {
    intros_made_6m: 11,
    response_rate: 0.96,
    last_engaged: "6 days ago",
    learned_signal:
      "Post-exit, Priya optimises for high-signal conversations. Strongest match for Series A and B founders preparing for US entry.",
  },
  m_tomas_dvorak: {
    intros_made_6m: 6,
    response_rate: 0.82,
    last_engaged: "10 days ago",
    learned_signal:
      "Reliable for product-led growth and developer marketing briefs. Has declined enterprise sales discussions twice this year.",
  },
  m_sophie_laurent: {
    intros_made_6m: 3,
    response_rate: 0.79,
    last_engaged: "5 weeks ago",
    learned_signal:
      "Strong fit for consumer hardware and D2C briefs. Lower bandwidth this quarter while preparing for product launch.",
  },
  m_diego_morales: {
    intros_made_6m: 10,
    response_rate: 0.93,
    last_engaged: "3 days ago",
    learned_signal:
      "Most useful when the brief involves regulated fintech or transparent fund-selection criticism. Open to investing in seed-stage SaaS.",
  },
  m_caroline_hughes: {
    intros_made_6m: 2,
    response_rate: 0.7,
    last_engaged: "7 weeks ago",
    learned_signal:
      "Pre-launch and selective. Better signal as a recipient of advice than a giver until Tideline ships.",
  },
  m_lukas_meier: {
    intros_made_6m: 5,
    response_rate: 0.84,
    last_engaged: "2 weeks ago",
    learned_signal:
      "Engages on European regulated-market briefs. Cautious about US-focused conversations until Voltklar's US strategy clarifies.",
  },
  m_irene_kovacs: {
    intros_made_6m: 8,
    response_rate: 0.9,
    last_engaged: "1 week ago",
    learned_signal:
      "Strong fit for vertical SaaS founders mid-US-entry. Currently learning fast and willing to compare notes openly.",
  },
  m_oliver_park: {
    intros_made_6m: 2,
    response_rate: 0.75,
    last_engaged: "6 weeks ago",
    learned_signal:
      "Deep-tech focus and pre-revenue. Strongest match for research-spinout founders, less useful for commercial SaaS briefs.",
  },
}

export function getEngagementFor(slug: string | undefined): EngagementSignals | null {
  if (!slug) return null
  return ENGAGEMENT_BY_SLUG[slug] ?? null
}
