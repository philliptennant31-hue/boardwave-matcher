# Supabase setup, step by step

About 5 minutes start to finish.

## 1. Create the project

1. Go to https://supabase.com/dashboard.
2. Click **New project**.
3. Choose your org. Project name: `boardwave-matcher`.
4. Pick a strong database password. Copy it somewhere safe; you won't need it for the app itself but Supabase requires one.
5. Region: pick the closest to you (London / Frankfurt for UK).
6. Plan: free is fine for the demo; paid if you want lower cold-start.
7. Click **Create project** and wait ~1 minute while it provisions.

## 2. Run the schema

1. In the left sidebar click **SQL Editor**.
2. Click **+ New query**.
3. Open `supabase/schema.sql` in this repo, copy the whole file, paste into the editor.
4. Click **Run** (bottom right). You should see "Success. No rows returned."
5. Click **Table Editor** in the sidebar and confirm two tables: `members` and `decisions`. Both should show RLS enabled.

## 3. Grab the keys

In the left sidebar click the **Project Settings** gear icon at the bottom, then **API**.

You need three values. Copy them into the `.env` file at the repo root:

| Supabase setting                          | .env variable                  |
| ----------------------------------------- | ------------------------------ |
| **Project URL**                           | `SUPABASE_URL` and `VITE_SUPABASE_URL` (same value, both lines) |
| **Project API keys → `anon` `public`**    | `VITE_SUPABASE_ANON_KEY`       |
| **Project API keys → `service_role` `secret`** | `SUPABASE_SERVICE_ROLE_KEY` |

⚠️ The **service role key bypasses RLS**. Treat it like a database password:
- Only ever lives in `.env` (gitignored) and the Netlify env dashboard.
- **Never** rename it with a `VITE_` prefix. Vite would inline it into the client bundle and anyone visiting the site could read your full database.

## 4. Verify

After the keys are in `.env`:

```
npm run seed
```

You should see 12 members upserted. Open the Supabase **Table Editor → members** to confirm.

## 5. When we deploy to Netlify

Same four values go into the Netlify site env (Site configuration → Environment variables). Plus `ANTHROPIC_API_KEY` and optionally `ANTHROPIC_MODEL`.
