-- Saved skills library — treatments promoted from builds you approved.
-- Run once in the Supabase SQL editor.
--
-- Why a table and not a repo JSON file: saving happens in the RUNNING app,
-- and Vercel's filesystem is read-only at runtime. A file-backed library would
-- appear to work in local dev and then silently never persist in production.
--
-- The id is TEXT, not a uuid, on purpose: it is a readable slug derived from
-- the skill's name ("layered-card-lift"), so the library stays inspectable and
-- an entry can be referenced by hand in a forced pick. /api/save-skill is
-- responsible for de-duplicating a slug that is already taken before insert,
-- because `on conflict (id) do update` would otherwise quietly overwrite an
-- unrelated existing skill that happened to share a name.

create table if not exists saved_skills (
  id            text primary key,          -- readable slug, e.g. 'layered-card-lift'
  name          text not null,
  kind          text not null default 'detail',   -- 'hero' | 'section' | 'detail'
  category      text not null default 'other',    -- section key, or detail lane
  recipe        text not null,             -- the DISTILLED, reusable treatment
  niches        jsonb default '[]'::jsonb, -- industries this was proven in
  universal     boolean default false,     -- escapes its origin niche when true
  source_domain text,                      -- provenance: where it was captured
  preview       text,                      -- optional data-URI crop of the original
  created_at    timestamptz default now()
);

create index if not exists saved_skills_kind_idx    on saved_skills (kind);
create index if not exists saved_skills_created_idx on saved_skills (created_at desc);

-- A recipe below ~80 characters is a failed distillation rather than a
-- treatment. The app drops these during normalization; this keeps them from
-- reaching the table in the first place.
alter table saved_skills drop constraint if exists saved_skills_recipe_len;
alter table saved_skills add constraint saved_skills_recipe_len check (char_length(recipe) >= 80);

comment on column saved_skills.recipe is
  'Distilled and parameterized: describes the treatment so it can be re-applied to a different business. Never the captured element''s literal HTML, copy, or hex codes.';
comment on column saved_skills.universal is
  'True for purely formal treatments (a type pairing, a shadow language) that should stay eligible outside the niche they were captured in. Never outranks a real niche match.';
