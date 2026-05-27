# Boardwave Member Matcher

Interview-demo tool. A community team raises a member's business challenge, the tool finds the three best-placed peers from a 12-person directory, scores each with explainable reasoning, and — once a human approves a match — drafts a warm peer-to-peer intro for that single match. Every decision is logged.

## Stack

- Vite + React 19 + TypeScript + Tailwind v4
- Anthropic Messages API (`claude-sonnet-4-6` default) called server-side from Netlify functions
- Supabase for `members` + `decisions` tables
- Netlify for hosting + functions

## Local dev

```
cp .env.example .env
# fill in ANTHROPIC_API_KEY, SUPABASE_* values
npm install
npm run seed       # one-time, after Supabase project is created
npm run dev        # Vite-only (no functions)
# or
netlify dev        # Vite + functions on a single port
```

## Security posture

Demo only. No auth — open URL. Supabase service role key is server-side only and must never have a `VITE_` prefix. RLS is enabled on both tables: `members` is public-read; `decisions` is accessible only via Netlify functions using the service role key.
