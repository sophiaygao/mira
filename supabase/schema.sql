-- Mira — Supabase schema
-- Run this whole file in the Supabase SQL Editor.
--
-- Uses mira_* table names so we don't collide with a starter `public.profiles`
-- table (that collision causes: column "guest_id" does not exist).

create extension if not exists "pgcrypto";

-- Safe re-run: only drops Mira tables (not auth / starter profiles).
drop table if exists public.mira_pathways cascade;
drop table if exists public.mira_mirrors cascade;
drop table if exists public.mira_messages cascade;
drop table if exists public.mira_sessions cascade;
drop table if exists public.mira_guests cascade;

-- Anonymous browser identities (cookie guest id)
create table public.mira_guests (
  id uuid primary key default gen_random_uuid(),
  guest_id text unique not null,
  created_at timestamptz not null default now()
);

create table public.mira_sessions (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null references public.mira_guests (guest_id) on delete cascade,
  title text not null default 'Reflection',
  status text not null default 'reflecting'
    check (status in ('reflecting', 'mirrored', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mira_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mira_sessions (id) on delete cascade,
  role text not null check (role in ('mira', 'user', 'system')),
  content text not null,
  prompt_key text,
  created_at timestamptz not null default now()
);

create table public.mira_mirrors (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.mira_sessions (id) on delete cascade,
  values jsonb not null default '[]'::jsonb,
  motivations jsonb not null default '[]'::jsonb,
  tensions jsonb not null default '[]'::jsonb,
  emotions jsonb not null default '[]'::jsonb,
  themes jsonb not null default '[]'::jsonb,
  summary_lines jsonb not null default '[]'::jsonb,
  raw jsonb,
  created_at timestamptz not null default now()
);

create table public.mira_pathways (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mira_sessions (id) on delete cascade,
  title text not null,
  description text not null,
  values jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  tradeoffs jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index mira_sessions_guest_id_idx on public.mira_sessions (guest_id);
create index mira_messages_session_id_idx on public.mira_messages (session_id);
create index mira_pathways_session_id_idx on public.mira_pathways (session_id);

create or replace function public.mira_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mira_sessions_set_updated_at on public.mira_sessions;
create trigger mira_sessions_set_updated_at
before update on public.mira_sessions
for each row execute function public.mira_set_updated_at();

alter table public.mira_guests enable row level security;
alter table public.mira_sessions enable row level security;
alter table public.mira_messages enable row level security;
alter table public.mira_mirrors enable row level security;
alter table public.mira_pathways enable row level security;

-- Service role / secret key bypasses RLS; these policies help if you later
-- query with the publishable key.
drop policy if exists "mira guests access" on public.mira_guests;
drop policy if exists "mira sessions access" on public.mira_sessions;
drop policy if exists "mira messages access" on public.mira_messages;
drop policy if exists "mira mirrors access" on public.mira_mirrors;
drop policy if exists "mira pathways access" on public.mira_pathways;

create policy "mira guests access" on public.mira_guests
  for all using (true) with check (true);
create policy "mira sessions access" on public.mira_sessions
  for all using (true) with check (true);
create policy "mira messages access" on public.mira_messages
  for all using (true) with check (true);
create policy "mira mirrors access" on public.mira_mirrors
  for all using (true) with check (true);
create policy "mira pathways access" on public.mira_pathways
  for all using (true) with check (true);
