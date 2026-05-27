import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.warn(
    "Supabase browser client not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.",
  )
}

export const supabase =
  url && anon ? createClient(url, anon) : null
