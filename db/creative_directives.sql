-- Creative Intelligence Layer — shadow persistence table.
-- Run once in the Supabase SQL editor. Used ONLY by the CIL shadow layer;
-- the legacy generation pipeline does not touch it.
--
-- One row per (generation, stage). Stages: 'understanding' | 'strategy' |
-- 'creative_director' | 'blueprint' | 'validation' | 'assembled'.
-- The 'assembled' row (id = the run id) holds the full unified Creative
-- Directive in `directive`, and a light rollup in `meta` for the dashboard.

create table if not exists creative_directives (
  id             uuid default gen_random_uuid() primary key,
  project_id     uuid,
  niche          text,
  tier           text,
  stage          text,               -- understanding|strategy|creative_director|blueprint|validation|assembled
  schema_version int,
  prompt_version text,
  mode           text,               -- 'shadow'
  directive      jsonb not null,     -- the stage output, or the full CDO for 'assembled'
  meta           jsonb,              -- per-stage meta (usage, timings, validity) or rollup for 'assembled'
  created_at     timestamptz default now()
);

create index if not exists creative_directives_stage_idx      on creative_directives (stage);
create index if not exists creative_directives_created_at_idx on creative_directives (created_at desc);
create index if not exists creative_directives_tier_idx       on creative_directives (tier);

-- RLS is disabled to match the rest of the app's tables (single-operator).
-- alter table creative_directives disable row level security;

-- Convenience view: assembled runs with the rollup flattened for quick SQL.
create or replace view creative_runs as
select
  id,
  niche,
  tier,
  created_at,
  (meta->>'businessName')            as business_name,
  (meta->'rollup'->>'passed')::bool  as passed,
  (meta->'rollup'->>'score')::int    as score,
  (meta->'rollup'->>'overall_confidence')::float as overall_confidence,
  (meta->'rollup'->'tokens'->>'total')::int      as tokens_total,
  (meta->'rollup'->>'latency_ms_total')::int     as latency_ms_total,
  (meta->>'partial')::bool           as partial
from creative_directives
where stage = 'assembled';
