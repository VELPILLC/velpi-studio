-- Developer Review System — reviews table (DEV ONLY).
-- Run once in the Supabase SQL editor, alongside db/creative_directives.sql.
-- Holds the human developer's review for a generation, linked to the assembled
-- Creative Directive by run_id. Never touched by the production pipeline.

create table if not exists creative_reviews (
  id             uuid default gen_random_uuid() primary key,
  run_id         uuid,                 -- = creative_directives.id (stage='assembled')
  project_id     uuid,                 -- optional link to projects.id (HTML/screenshots)
  reviewer       text default 'dev',
  flag           text,                 -- 'love' | 'regenerate' | 'dislike' | null
  scores         jsonb default '{}'::jsonb,  -- { overall:9, premium_feel:8, ... } 1..10 | null
  tags           jsonb default '{}'::jsonb,  -- { hero:'love', images:'needs_work', ... }
  notes          text,
  review_version int  default 1,       -- REVIEW_SCHEMA_VERSION
  meta           jsonb,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (run_id, reviewer)            -- upsert target for autosave
);

create index if not exists creative_reviews_run_idx     on creative_reviews (run_id);
create index if not exists creative_reviews_flag_idx     on creative_reviews (flag);
create index if not exists creative_reviews_created_idx  on creative_reviews (created_at desc);

-- Labeled training rows: reviews (labels) joined to directive features.
create or replace view creative_training_rows as
select
  r.run_id,
  d.niche, d.tier,
  r.flag,
  r.scores, r.tags, r.notes, r.review_version,
  (d.meta->'rollup'->>'passed')::bool  as directive_passed,
  (d.meta->'rollup'->>'score')::int    as directive_score,
  (d.meta->'rollup'->>'overall_confidence')::float as directive_confidence,
  d.meta->'rollup'->'overrides_detected' as overrides,
  d.directive->'design_dna'            as design_dna,
  d.directive->'creative_direction'    as creative_direction,
  r.created_at
from creative_reviews r
join creative_directives d
  on d.id = r.run_id and d.stage = 'assembled';
