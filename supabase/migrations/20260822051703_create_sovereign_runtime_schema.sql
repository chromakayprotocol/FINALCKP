-- Sovereign Runtime persistence schema (Phase 7 of the Sovereign OS migration).
--
-- These tables are the Supabase-side counterpart to
-- frontend/src/sovereign/runtime/'s in-memory state tree. They are NOT yet
-- read from or written to by any live user flow — see docs/ARCHITECTURE.md
-- and frontend/src/sovereign/persistence/ for the sync layer that will use
-- them once Reclamation University is migrated onto the Sovereign Runtime.
-- Naming note: "sovereign_" here is the new Sovereign OS runtime and is
-- unrelated to the pre-existing "Sovereign Mode" UI under
-- frontend/src/modules/sovereign/ and the generic getSovereignSupabase()
-- helper in frontend/src/lib/supabase/sovereignHelpers.js.

create extension if not exists pgcrypto;

-- One row per user: identity/session/media snapshot. These domains are
-- still lightly modeled in the runtime (media has no actions until Phase
-- 9's Media Runtime), so unlike the tables below they aren't normalized
-- further yet.
create table if not exists public.sovereign_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  identity_json jsonb not null default '{}'::jsonb,
  session_json jsonb not null default '{}'::jsonb,
  media_json jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per (user, module) — mirrors SovereignModuleState exactly.
create table if not exists public.sovereign_module_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  status text not null default 'available'
    check (status in ('available', 'in_progress', 'completed')),
  current_step text,
  viewed_steps text[] not null default '{}',
  completed_steps text[] not null default '{}',
  started_at timestamptz,
  last_active_at timestamptz,
  time_spent integer not null default 0,
  estimated_remaining integer,
  interaction_count integer not null default 0,
  synthesis_readiness numeric not null default 0,
  -- Phase 10 (Concept Graph): concept ids selected while this module was
  -- active. A concept itself is a global, once-only fact about the user
  -- (see sovereign_concepts' own unique(user_id, concept_id) below) — this
  -- is which module gets credit for it, not a second copy of the concept.
  selected_concepts text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

-- One row per (user, module, prompt) reflection entry. Reflections created
-- via the old atomic recordReflection() (still used by Phase 8's
-- whole-module-blob persistence under the reserved "record" promptId)
-- leave status/candidate/retained/started/committed at their defaults;
-- only the Phase 12 staged pipeline (startReflection -> updateReflection ->
-- extractConcepts -> commitReflection) populates them for real.
create table if not exists public.sovereign_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  prompt_id text not null,
  response jsonb not null default 'null'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'committed')),
  candidate_concepts text[] not null default '{}',
  retained_concepts text[] not null default '{}',
  started_at timestamptz,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_id, prompt_id)
);

-- Append-only event log — the server-side counterpart to
-- SovereignEventBus's in-memory history. Intended to eventually replace the
-- disconnected rec_uni_events / PostHog split (SOVEREIGN_STATE_MAP.md
-- duplication finding #13) with one event stream covering the whole app.
create table if not exists public.sovereign_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  module_id text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

-- One row per (user, concept) selection — a concept is one global,
-- once-only fact about the user (Phase 10 chose to track *which module*
-- gets credit for a selection on sovereign_module_state.selected_concepts
-- instead of here, so this table doesn't need its own module_id).
create table if not exists public.sovereign_concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_id text not null,
  selected_at timestamptz not null default now(),
  unique (user_id, concept_id)
);

-- One row per concept-to-concept edge a user has established. Unique so a
-- resync can upsert-and-ignore-duplicates instead of accumulating repeat
-- rows on every sync cycle.
create table if not exists public.sovereign_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_concept_id text not null,
  to_concept_id text not null,
  relationship text not null,
  created_at timestamptz not null default now(),
  unique (user_id, from_concept_id, to_concept_id, relationship)
);

-- One row per (user, concept, domain, role) mapping — the Domain Matrix
-- (Phase 11). "domain" and "role" are validated client-side against
-- sovereignDomains.js's catalog (an unknown value is a reducer no-op, so
-- it never reaches here); not re-validated with a check constraint since
-- the catalog is expected to grow and a migration shouldn't be required
-- to add a domain. Unique so resync can upsert-and-ignore-duplicates, same
-- as sovereign_connections.
create table if not exists public.sovereign_domain_mappings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_id text not null,
  domain text not null,
  role text not null,
  mapped_at timestamptz not null default now(),
  unique (user_id, concept_id, domain, role)
);

-- One row per user: the current Living Artifact document. draft_json now
-- holds a real ArtifactDocument (sections/blocks/decisions — Phase 14's
-- Artifact Compiler, frontend/src/sovereign/artifact/artifactSchema.js),
-- but stays jsonb rather than normalized columns since the schema is
-- still expected to grow (new block/decision kinds) and a document is
-- always read/written whole, never queried by its internal fields.
create table if not exists public.sovereign_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  status text not null default 'empty'
    check (status in ('empty', 'draft', 'sealed')),
  draft_json jsonb,
  -- ArtifactRevision[] — snapshots of draft_json taken each time a
  -- redraft replaces an existing one. Also jsonb for the same reason.
  revisions_json jsonb not null default '[]'::jsonb,
  sealed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sovereign_module_state_user_updated
  on public.sovereign_module_state(user_id, updated_at desc);
create index if not exists idx_sovereign_reflections_user_module
  on public.sovereign_reflections(user_id, module_id);
create index if not exists idx_sovereign_events_user_occurred
  on public.sovereign_events(user_id, occurred_at desc);
create index if not exists idx_sovereign_concepts_user
  on public.sovereign_concepts(user_id);
create index if not exists idx_sovereign_connections_user
  on public.sovereign_connections(user_id);
create index if not exists idx_sovereign_domain_mappings_user
  on public.sovereign_domain_mappings(user_id);

alter table public.sovereign_sessions enable row level security;
alter table public.sovereign_module_state enable row level security;
alter table public.sovereign_reflections enable row level security;
alter table public.sovereign_events enable row level security;
alter table public.sovereign_concepts enable row level security;
alter table public.sovereign_connections enable row level security;
alter table public.sovereign_domain_mappings enable row level security;
alter table public.sovereign_artifacts enable row level security;

create policy "Users read own sovereign session"
  on public.sovereign_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own sovereign session"
  on public.sovereign_sessions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update own sovereign session"
  on public.sovereign_sessions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users read own sovereign module state"
  on public.sovereign_module_state for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own sovereign module state"
  on public.sovereign_module_state for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update own sovereign module state"
  on public.sovereign_module_state for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete own sovereign module state"
  on public.sovereign_module_state for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read own sovereign reflections"
  on public.sovereign_reflections for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own sovereign reflections"
  on public.sovereign_reflections for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update own sovereign reflections"
  on public.sovereign_reflections for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete own sovereign reflections"
  on public.sovereign_reflections for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read own sovereign events"
  on public.sovereign_events for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own sovereign events"
  on public.sovereign_events for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users read own sovereign concepts"
  on public.sovereign_concepts for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own sovereign concepts"
  on public.sovereign_concepts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users delete own sovereign concepts"
  on public.sovereign_concepts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read own sovereign connections"
  on public.sovereign_connections for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own sovereign connections"
  on public.sovereign_connections for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users delete own sovereign connections"
  on public.sovereign_connections for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read own sovereign domain mappings"
  on public.sovereign_domain_mappings for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own sovereign domain mappings"
  on public.sovereign_domain_mappings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users delete own sovereign domain mappings"
  on public.sovereign_domain_mappings for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read own sovereign artifact"
  on public.sovereign_artifacts for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own sovereign artifact"
  on public.sovereign_artifacts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update own sovereign artifact"
  on public.sovereign_artifacts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on
  public.sovereign_sessions,
  public.sovereign_module_state,
  public.sovereign_reflections,
  public.sovereign_artifacts
to authenticated;
grant delete on
  public.sovereign_module_state,
  public.sovereign_reflections,
  public.sovereign_concepts,
  public.sovereign_connections,
  public.sovereign_domain_mappings
to authenticated;
grant select, insert on
  public.sovereign_events,
  public.sovereign_concepts,
  public.sovereign_connections,
  public.sovereign_domain_mappings
to authenticated;
grant usage, select on sequence public.sovereign_events_id_seq to authenticated;

create or replace function public.set_sovereign_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_sovereign_sessions_updated_at
  before update on public.sovereign_sessions
  for each row execute function public.set_sovereign_updated_at();
create trigger set_sovereign_module_state_updated_at
  before update on public.sovereign_module_state
  for each row execute function public.set_sovereign_updated_at();
create trigger set_sovereign_reflections_updated_at
  before update on public.sovereign_reflections
  for each row execute function public.set_sovereign_updated_at();
create trigger set_sovereign_artifacts_updated_at
  before update on public.sovereign_artifacts
  for each row execute function public.set_sovereign_updated_at();
