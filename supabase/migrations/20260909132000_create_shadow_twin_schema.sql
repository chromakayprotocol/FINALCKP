-- Shadow Twin persistence schema (Act II Reflection Chamber — see
-- docs/ACT_II_REFLECTION_CHAMBER_ARCHITECTURE.md's Shadow Twin
-- specification, §25-27).
--
-- Deliberately NOT folded into sovereign_module_state: the Shadow Twin is
-- persistent user-owned media/state (one canonical generated asset, plus
-- the original source photo it was generated from) that doesn't belong in
-- a per-(user, module) progression row. Progress itself still comes from
-- the Sovereign Runtime's own tables
-- (20260822051703_create_sovereign_runtime_schema.sql) — this schema only
-- adds the asset + fragment layer sitting on top of it. One row per user
-- (one canonical Twin, never regenerated per portal), and a child table for
-- the small, individually-unlocked fragments recovered as the Seeker moves
-- through the five Reflection Chamber portals.

create extension if not exists pgcrypto;

create table if not exists public.shadow_twins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  status text not null default 'empty'
    check (status in ('empty', 'uploading', 'generating', 'ready', 'failed')),
  source_image_path text,
  canonical_image_path text,
  generation_prompt_version text,
  generation_status text,
  materialization_state text
    check (materialization_state is null or materialization_state in (
      'INITIALIZED', 'FRAGMENTED_APPARITION', 'MANIFESTATION', 'PRESENCE', 'CONVERGENCE', 'INTEGRATED'
    )),
  visual_coherence numeric not null default 0,
  portal_progression_json jsonb not null default '{
    "recognition": false, "confrontation": false, "dialogue": false, "integration": false, "transformation": false
  }'::jsonb,
  integration_state text not null default 'unresolved' check (integration_state in ('unresolved', 'integrated')),
  visual_identity_seed text,
  error text,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per recovered fragment (design guide §25's `shadow_twin_fragments`
-- child table). Fragments are additive-only once unlocked, mirroring the
-- reducer's own UNLOCK_SHADOW_TWIN_FRAGMENT semantics (a repeat id is a
-- no-op) — `unique (shadow_twin_id, fragment_key)` lets a resync
-- upsert-and-ignore-duplicates the same way sovereign_concepts does.
create table if not exists public.shadow_twin_fragments (
  id uuid primary key default gen_random_uuid(),
  shadow_twin_id uuid not null references public.shadow_twins(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  fragment_key text not null,
  portal_id text not null check (portal_id in ('recognition', 'confrontation', 'dialogue', 'integration', 'transformation')),
  fragment_type text not null,
  source_region_json jsonb not null default '{}'::jsonb,
  visual_weight numeric not null default 0,
  unlocked_at timestamptz not null default now(),
  unique (shadow_twin_id, fragment_key)
);

create index if not exists idx_shadow_twin_fragments_shadow_twin
  on public.shadow_twin_fragments(shadow_twin_id);
create index if not exists idx_shadow_twin_fragments_user
  on public.shadow_twin_fragments(user_id);

alter table public.shadow_twins enable row level security;
alter table public.shadow_twin_fragments enable row level security;

create policy "Users read own shadow twin"
  on public.shadow_twins for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own shadow twin"
  on public.shadow_twins for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update own shadow twin"
  on public.shadow_twins for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users read own shadow twin fragments"
  on public.shadow_twin_fragments for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own shadow twin fragments"
  on public.shadow_twin_fragments for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.shadow_twins to authenticated;
grant select, insert on public.shadow_twin_fragments to authenticated;

create or replace function public.set_shadow_twins_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_shadow_twins_updated_at
  before update on public.shadow_twins
  for each row execute function public.set_shadow_twins_updated_at();

-- Storage: a private bucket for source photos and canonical Twin assets.
-- Never public — the design guide is explicit ("Do not expose arbitrary
-- user paths publicly... Use authenticated access / signed URLs") — reads
-- go through short-lived signed URLs (frontend/src/lib/supabase/shadowTwin.js),
-- never a public CDN path the way R2-backed track media is served.
-- Objects are keyed `{user_id}/source/{uuid}.*` and
-- `{user_id}/canonical/{uuid}.*`, so the RLS policies below key off the
-- first path segment (storage.foldername(name)[1]) matching auth.uid().
insert into storage.buckets (id, name, public)
values ('shadow-twins', 'shadow-twins', false)
on conflict (id) do nothing;

create policy "Users read own shadow twin objects"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'shadow-twins' and (select auth.uid()::text) = (storage.foldername(name))[1]);
create policy "Users upload own shadow twin objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'shadow-twins' and (select auth.uid()::text) = (storage.foldername(name))[1]);
create policy "Users update own shadow twin objects"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'shadow-twins' and (select auth.uid()::text) = (storage.foldername(name))[1])
  with check (bucket_id = 'shadow-twins' and (select auth.uid()::text) = (storage.foldername(name))[1]);
