/**
 * House-style example intros used as few-shot anchors in the drafter prompt.
 *
 * Two short, warm, peer-to-peer intros. They name both parties, reference one
 * specific thing each brings, and frame the value as two-way. No subject
 * lines, no signoffs.
 *
 * Inlined into the user message of the drafter call (NOT the system prompt)
 * so they can be tweaked without a code change ripple. When Boardwave gives
 * us real anonymised examples, just edit this file.
 */

export type HouseStyleExample = {
  intro: string
  team_note: string
}

export const HOUSE_STYLE_EXAMPLES: HouseStyleExample[] = [
  {
    intro: `Hey Anna, Sarah, quick intro because there is a real two-way conversation here. Sarah is running a Series B SaaS in London and is about to make the same US GTM move you led out of Berlin two years ago. She is working through hiring profile, fund selection and which US deals you would walk away from a second time. Anna, she is not asking for advice. She is offering to compare notes from the other side. Yours to take from here.`,
    team_note: `Anna has actually done this transition end-to-end and was clear when we last spoke that she wants to compare notes with other Series B founders mid-flight. Sarah's brief lines up almost exactly with what Anna ran in 2024.`,
  },
  {
    intro: `James, Lina, connecting you two. Lina just raised a seed for her vertical SaaS out of Amsterdam and is wrestling with the same enterprise deal-cycle compression you were navigating at Northwind twelve months ago. James, no homework, just a thirty-minute call if mutually useful. Lina, James is exceptional on this and still remembers the pain. Over to you.`,
    team_note: `James has flagged willingness to spend time on early-stage founders pre-enterprise motion. Lina's stage is earlier than James normally engages with, but the specific deal-cycle compression problem is exactly what he solved at Northwind.`,
  },
]
