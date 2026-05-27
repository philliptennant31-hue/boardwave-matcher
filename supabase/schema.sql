-- Boardwave Matcher: Supabase schema
-- Run this in the Supabase SQL editor: SQL → New query → paste → Run.
-- Safe to re-run: every CREATE uses IF NOT EXISTS and policies are dropped first.

create extension if not exists "pgcrypto";

-- ============================================================================
-- members
-- ============================================================================

create table if not exists public.members (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  company     text not null,
  role        text,
  stage       text check (stage in ('pre-seed','seed','series-a','series-b','series-c','exit')),
  sectors     text[] not null default '{}',
  geography   text,
  expertise   text[] not null default '{}',
  bio         text,
  open_to     text[] not null default '{}',
  created_at  timestamptz not null default now()
);

alter table public.members enable row level security;

-- Public read on members (directory is not secret; matching surfaces these openly).
drop policy if exists "members_public_read" on public.members;
create policy "members_public_read" on public.members
  for select using (true);

-- No insert/update/delete from anon. All writes go via the service role key
-- which bypasses RLS, so no explicit policy is needed for that.

-- ============================================================================
-- decisions
-- ============================================================================

create table if not exists public.decisions (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  requester_name     text,
  requester_company  text,
  need               text not null,
  weighting          jsonb,
  suggested_matches  jsonb,
  excluded_ids       uuid[] not null default '{}',
  attempt_count      int not null default 1,
  chosen_member_id   uuid references public.members(id) on delete set null,
  intro_text         text,
  team_note          text,
  outcome            text not null default 'pending'
    check (outcome in ('pending','approved','rejected_all','abandoned'))
);

create index if not exists decisions_created_at_idx
  on public.decisions (created_at desc);

alter table public.decisions enable row level security;

-- No anon policies on decisions. All reads and writes go through Netlify
-- functions using the service role key. Anyone with the anon key cannot
-- read or write this table.
