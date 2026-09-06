# DEVELOPER REVIEW SYSTEM — ARCHITECTURE (design only)

**Purpose:** make improving the Creative Intelligence Layer effortless. After each generation, a **dev-only** panel lets the operator score, flag, tag, and note the result in under 30 seconds. Every review auto-saves *with* the Creative Directive for that generation, becoming the human-label half of the future learning loop.

> **Hard boundary:** this system exists ONLY in development mode. It never renders for real users, never appears in production, and never touches the generation pipeline or the shipped output. It is a review overlay on top of the existing CIL shadow data.

---

## 0. PRINCIPLES

1. **Dev-only, provably.** The panel renders only when `process.env.NODE_ENV === 'development'` (Next inlines this) OR an explicit `NEXT_PUBLIC_DEV_REVIEW=1` override for a preview deploy. The API routes independently refuse in production. Production UX is byte-for-byte unchanged.
2. **<30-second review.** One required action (the overall flag). Everything else — 12 scores, 12 tags, notes — is optional and one-click. A collapsed "quick" state shows just the three flags; expanding reveals the full rubric.
3. **Auto-save, no submit button.** Every interaction debounce-upserts (≈600 ms) to the review record for the run. A "Saved" indicator confirms; nothing is lost if the tab closes.
4. **Linked to the Creative Directive.** A review is keyed by the generation's `runId` (the assembled CDO id). Reviews and directives join 1:1.
5. **Labels, not features.** The CDO holds the *decisions* (features); the review holds the *human judgment* (labels). Their pairing is one training example. This is the missing signal `CDO_SCHEMA.md §25` was built to receive.
6. **Additive + reversible.** New table, new routes, new dev-gated panel. No change to Build/Copy/Images/Brief/Analyze or the five CIL stages.

---

## 1. UI MOCKUP

The rendered mockup (shown in chat) is the reference. Layout, top to bottom:

```
┌ 🧪 Dev review · Amrit Palace · run c3fa413 ───────────────── ✓ Saved ┐
│  [ ♥ Love ]        [ ⟳ Regenerate ]        [ 👎 Dislike ]   ← overall flag │
│                                                                          │
│  Scores (click the scale, or press 1–0 while a row is focused)           │
│  Overall quality      ▓▓▓▓▓▓▓▓▓░ 9      Typography      ▓▓▓▓▓▓▓▓▓░ 9      │
│  Premium feel         ▓▓▓▓▓▓▓▓░░ 8      Color system    ▓▓▓▓▓▓▓▓░░ 8      │
│  Originality          ▓▓▓▓▓▓▓░░░ 7      Layout          ▓▓▓▓▓▓▓▓░░ 8      │
│  Conversion potential ▓▓▓▓▓▓▓▓░░ 8      Spacing         ▓▓▓▓▓▓▓░░░ 7      │
│  Brand consistency    ▓▓▓▓▓▓▓▓▓░ 9      Animations      ▓▓▓▓▓▓░░░░ 6      │
│  (…12 total…)                            Images          ▓▓▓▓▓▓▓░░░ 7      │
│                                          Mobile experience ▓▓▓▓▓▓▓▓░ 8    │
│                                                                          │
│  Section tags (♥ love · ✎ needs work · ✕ dislike)                        │
│  Hero ♥·· Navigation ··· Typography ♥·· Colors ···  Layout ···           │
│  Cards ··· CTA ♥·· Images ·✎· Animations ·✎· Footer ··· Mobile ··· Copy ··✕ │
│                                                                          │
│  Notes: [ optional — what to fix, what worked …………………………………………… ]        │
│  Autosaves to the Creative Directive for this run. Dev only.             │
└──────────────────────────────────────────────────────────────────────┘
```

### Placement & gating
- Rendered by a new dev-only component `components/dev/ReviewPanel` (client), mounted inside `Studio.js` **only** behind `if (isDevReview())`. In production the component is never imported/rendered (the import + render are guarded), so it adds nothing to the production bundle path the user sees.
- Appears after `built === true`, docked below the results (or as a collapsible bottom sheet). Never `position: fixed` conflicts with the app.

### The 12 scores (1–10)
Overall quality · Premium feel · Originality · Conversion potential · Brand consistency · Typography · Color system · Layout · Spacing · Animations · Images · Mobile experience.
- Each is a click-scale (or slider); unset by default (null). Keyboard: focus a row, press `1`–`9`/`0` (0 = 10) to set fast.

### The 3 flags (one-click, mutually exclusive)
`♥ Love` · `⟳ Regenerate` · `👎 Dislike`. Setting a flag is the single required action for a valid review. Keyboard: `L` / `R` / `D`.

### The 12 tags × 3 verdicts
Hero · Navigation · Typography · Colors · Layout · Cards · CTA · Images · Animations · Footer · Mobile · Copy. Each chip carries three toggles: `love` / `needs_work` / `dislike` (or unset). Clicking a set verdict again clears it.

### Notes
One optional multiline field.

### The <30-second flow
1. Glance at the preview. 2. Hit one flag (`L`/`R`/`D`) — review is now valid and saved. 3. (Optional) tap 2–3 tag verdicts on whatever stood out. 4. (Optional) a couple of score sliders. 5. Done — it autosaved throughout. Realistic median: ~10–20 s; full rubric ~45 s when you want depth.

---

## 2. DATABASE SCHEMA

A dedicated table, linked to the assembled directive by `run_id`. (Reviews are edited over time and queried for learning — keeping them out of the large CDO jsonb avoids rewrites and makes training joins clean.)

```sql
create table if not exists creative_reviews (
  id            uuid default gen_random_uuid() primary key,
  run_id        uuid not null,          -- = creative_directives.id (stage='assembled')
  project_id    uuid,                   -- optional link to projects.id
  reviewer      text default 'dev',     -- who reviewed (future multi-reviewer)
  flag          text,                   -- 'love' | 'regenerate' | 'dislike' | null
  scores        jsonb default '{}'::jsonb,  -- { overall:9, premium_feel:8, ... }  each 1..10 | null
  tags          jsonb default '{}'::jsonb,  -- { hero:'love', images:'needs_work', copy:'dislike', ... }
  notes         text,
  review_version int default 1,         -- REVIEW_SCHEMA_VERSION (rubric version)
  meta          jsonb,                  -- { app, durations, keystrokes } (optional)
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (run_id, reviewer)             -- one review per (run, reviewer); upsert target
);

create index if not exists creative_reviews_run_idx     on creative_reviews (run_id);
create index if not exists creative_reviews_flag_idx     on creative_reviews (flag);
create index if not exists creative_reviews_created_idx  on creative_reviews (created_at desc);
```

**Training join view** — pairs each review (labels) with its directive's rollup + key features:
```sql
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
```

Placed in `db/creative_reviews.sql` (run once in Supabase), alongside `db/creative_directives.sql`.

---

## 3. DATA MODEL

Canonical, versioned constants (a new `lib/creative/review.mjs`, pure) so the rubric stays stable for longitudinal learning:

```
REVIEW_SCHEMA_VERSION = 1

SCORE_DIMENSIONS = [                      // 12, order fixed
  'overall', 'premium_feel', 'originality', 'conversion',
  'brand_consistency', 'typography', 'color_system', 'layout',
  'spacing', 'animations', 'images', 'mobile'
]                                          // each value: integer 1..10 | null

TAG_KEYS = [                              // 12, order fixed
  'hero', 'navigation', 'typography', 'colors', 'layout', 'cards',
  'cta', 'images', 'animations', 'footer', 'mobile', 'copy'
]
TagVerdict = 'love' | 'needs_work' | 'dislike' | null
ReviewFlag = 'love' | 'regenerate' | 'dislike' | null

Review = {
  id, runId, projectId?, reviewer,
  flag: ReviewFlag,
  scores: { <dimension>: 1..10 | null },   // partial allowed
  tags:   { <tagKey>: TagVerdict },         // partial allowed
  notes: string,
  reviewVersion: int,
  createdAt, updatedAt
}
```
Helpers (pure, node-testable): `emptyReview(runId)`, `validateReview(obj)` (dimensions/tags known, scores in 1..10, enums valid), `mergeReview(prev, patch)` (for debounced partial autosave), `reviewCompleteness(review)` (0..1 — how much was filled, for weighting labels later).

---

## 4. API ROUTES

All under `app/api/creative/review/` and **dev-gated** (refuse unless `NODE_ENV !== 'production'` or `DEV_REVIEW=1`).

| Route | Method | Body / Query | Returns | Notes |
|---|---|---|---|---|
| `/api/creative/review` | `POST` | `{ runId, reviewer?, flag?, scores?, tags?, notes? }` (partial) | `{ ok, review }` | **Upsert** on `(run_id, reviewer)`. Merges the partial patch into the existing row; bumps `updated_at`. This is the autosave endpoint. |
| `/api/creative/review` | `GET` | `?runId=` | `{ ok, review }` | Rehydrate the panel when revisiting a run (e.g. loading a saved project). |
| `/api/creative/reviews` | `GET` | `?limit=&flag=&niche=` | `{ ok, reviews[] }` | List for the dashboard / (later) export. |

- **Gating:** a shared `isDevReviewServer()` in `lib/creative/flags.mjs` returns false in production; the routes `return { ok:false, disabled:true }`.
- **Validation:** the route runs `validateReview` and rejects unknown dimensions/tags or out-of-range scores (protects the training data).
- **No new writes to Build.** These routes only touch `creative_reviews`.
- The dashboard (`/api/creative/inspect`) is extended to left-join the review onto each run so `/creative-debug` shows flag/score at a glance (read-only).

---

## 5. HOW REVIEWS CONNECT TO CREATIVE DIRECTIVES

```
Generation → CIL shadow chain → /api/creative/assemble → assembled CDO (id = runId)
                                                              │
                                    Studio exposes runId ─────┤
                                                              ▼
                          ReviewPanel(runId)  ──POST──►  /api/creative/review
                                                              ▼
                                   creative_reviews.run_id = runId  (1:1 with the CDO)
```

- **Join key = `runId`.** The shadow chain already mints a `runId` and the assemble step persists the CDO under `id = runId`. The panel binds to that same id and every autosave writes `creative_reviews.run_id = runId`.
- **Timing.** The CIL chain is fire-and-forget and may finish just after the site renders. The panel binds to a `runId` promise: it's usable immediately for flags/scores, and the first save flushes once `/assemble` resolves the id. If the operator reviews before assembly completes, patches queue locally (in-memory) and flush on resolve — no lost input.
- **"Saved with the directive."** The relationship is a 1:1 relational link on `run_id`; the `creative_training_rows` view is the co-located read model. Optionally, a compact `{flag, overall_score}` summary can be denormalized into the CDO row's `meta.review` on finalize for single-fetch dashboards — but `creative_reviews` remains the source of truth.
- **Fallback when CIL is off.** The system's whole point is improving the CIL, so it assumes shadow-on. If a review is attempted with no `runId` (CIL disabled), the panel links by `project_id` instead and marks the row `run_id = null, project_id = <id>` — still captured, just not joinable to a directive until CIL is on.
- **Re-reviews & regenerations.** Hitting `⟳ Regenerate` records the flag on the current run and (optionally) triggers a fresh generation → new `runId` → new review row. Each generation keeps its own review; history is preserved by run.

---

## 6. HOW FUTURE LEARNING WILL CONSUME THESE REVIEWS

The review is the **label**; the CDO is the **features**. The `creative_training_rows` view is the labeled dataset. Concrete consumers (all downstream of Phase 1, none built yet):

1. **Tune `defaults.js` tables.** Correlate seed parameter values (and the model's `overrides_detected`) with human scores per niche/tier. If "luxury + Lover" builds that the model pushed to `motion.intensity: medium` consistently earn higher `premium_feel`/`overall`, nudge the tier/archetype tables toward that. The engine's tables are the most directly learnable surface; reviews tell them which way to move.
2. **Tag-level diagnostics → targeted fixes.** Aggregate `tags` verdicts: the sections most often `needs_work`/`dislike` (e.g. `animations`, `spacing`) point at the exact prompt block or default to fix. This turns vague "make it better" into a ranked worklist.
3. **Prompt/version A/B.** Every stage stamps `PROMPT_VERSION`/`DEFAULTS_VERSION` into provenance. Compare review score distributions across versions to prove a prompt change actually improved decisions before shipping it.
4. **A reward model / directive ranker.** Train a predictor `CDO features → expected human score` (start: simple regression over tier, archetype, DNA descriptors, override count, confidence). In future execute-mode variation (generate N directives, keep the best), the ranker picks the candidate most likely to earn a `Love` — closing the loop from human taste to automatic selection.
5. **Distillation gating for the self-expanding library.** Directives with high scores **and** a `Love` flag become vetted candidates to distill into new reusable DESIGN.md styles (the review is the human sign-off the distillation queue needs).
6. **Flag signals as coarse reward.** `love` = +1, `dislike`/`regenerate` = −1. Cheap, high-signal labels for a loop-until-quality policy and for filtering the training set to confident examples (weighted by `reviewCompleteness`).

**Longevity:** the 12 dimensions and 12 tags are frozen under `REVIEW_SCHEMA_VERSION`; changing the rubric bumps the version so old and new labels never silently mix. Reviews feed straight into `CDO §25 learning` (`outcome.*`) — `outcome.user_edits`/`won` generalize to `outcome.review_flag`/`review_scores`.

---

## 7. EXPORT SYSTEM

Two export actions, both **dev-only**, both packaging already-persisted data. The single-generation export is the priority; the batch export is designed now but built later.

### 7.1 "Ask ChatGPT" — single-generation portable artifact

**Goal:** one click produces one file that contains *everything* needed to review a single generation, so the developer uploads it to ChatGPT and gets a complete architectural review with zero manual collection.

**Trigger / UX (in the review panel):** an `Ask ChatGPT ↗` button. On click the client (1) optionally captures a fresh full-page screenshot (reusing the existing `html2canvas` path), (2) fetches the server-assembled package, (3) merges the screenshot in, (4) downloads **one file**, and (5) opens `chat.openai.com` in a new tab and copies a ready-to-paste instruction line to the clipboard. (We cannot auto-upload — uploading to an external service is user-initiated by design.)

**Package contents → source mapping** (nothing is hand-collected):

| Required item | Source |
|---|---|
| Creative Directive | `creative_directives` (stage `assembled`).`directive` — the full unified CDO |
| Validation report | CDO `validation` + `internal_critique` + `confidence` + `revisions` (Stage 5) |
| Developer review | `creative_reviews` row (flag, scores, tags, notes, completeness) |
| Metrics | CDO `rollup` (this run) + optional fleet context (this run's percentile vs. `computeFleetMetrics`) |
| Defaults | CDO `seedDefaults` (the deterministic seed set) |
| Overrides | `rollup.overrides_detected` + `provenance.blueprint.overrides_detected` |
| Prompt versions | `provenance.*.promptVersion` + `schemaVersion` + `defaultsVersion` + `assemblerVersion` + `REVIEW_SCHEMA_VERSION` |
| Generated HTML | `projects.data.htmlTemplate` (both the `%%IMG%%`-tokenized template and the rendered/substituted form) via the run→project link |
| Screenshots (if available) | `projects.data.thumb` (stored gallery JPEG) + an optional fresh full-page PNG captured at export time; embedded as data URIs, omitted gracefully if capture fails |
| Build metadata | business name, source URL, niche, tier, `createdAt`, model, total tokens, total latency, `imagesMeta`, mode |

**Artifact schema (default: a single self-contained JSON):**
```
{
  artifact: "velpi-cil-review-export",
  format: "single",
  version: "export@1.0.0",
  cdoSchemaVersion, reviewSchemaVersion,
  generatedAt,
  instructions: "<architectural-review prompt — see below>",
  field_map: { ... },                       // where each thing lives, so ChatGPT can navigate
  business:  { name, url, niche, tier },
  build:     { createdAt, model, tokens, latency_ms, mode, imagesMeta },
  prompt_versions: { understanding, strategy, creative_director, blueprint, validation, defaults, assembler, review },
  creative_directive: { ...full CDO... },
  validation: { report, internal_critique, confidence, revisions },
  defaults:   { seedDefaults },
  overrides:  [ ... ],
  metrics:    { rollup, fleet_context? },
  developer_review: { flag, scores, tags, notes, completeness },
  html:       { template, rendered },
  screenshots:{ thumbnail_dataUri, fullpage_dataUri? },
  security:   "contains no API keys, env vars, or secrets"
}
```

**Embedded instruction prompt** (the `instructions` field — what ChatGPT should do):
> "You are auditing one output of Velpi's Creative Intelligence Layer. This file contains the creative decisions (`creative_directive`), the deterministic seed defaults (`defaults`), the model's overrides of those seeds (`overrides`), the validator's verdict (`validation`), the human developer's review (`developer_review`), the run metrics (`metrics`), and the generated site (`html` + `screenshots`). Assess: (1) were the creative decisions good and coherent to the thesis? (2) where the model overrode a deterministic default, was it right? (3) does the generated HTML/screenshot actually implement the directive? (4) do the human review scores agree or disagree with the validator, and why? (5) name the top 5 concrete changes — to `defaults.js` tables, a specific prompt version, or a schema — that would improve the next generation. Reference fields by path."

**Format decision:** **JSON single file is the default** — dependency-free and guaranteed readable by ChatGPT as text/attachment. Screenshots and HTML embed as strings/data-URIs. A **ZIP** variant is optional for very large payloads (`index.html`, `screenshot.png`, `review.json`, `README.md` with the prompt) and is the *only* thing that would add a dependency (a zip lib) — deferred unless single-file size becomes a problem.

**Correlation dependency (one small additive wiring):** to include HTML + screenshots, the run must know its project. At assemble time, `Studio` already holds both the CIL `runId` and the auto-saved `projectId`; the `/assemble` call passes `projectId`, which is stored in the existing `creative_directives.project_id` column. The export then joins `projects` by that id. This is the only new plumbing the export needs.

**Route:** `GET /api/creative/export?runId=&format=json` (dev-gated). Assembles the package server-side from `creative_directives` + `creative_reviews` + `projects`; returns `application/json` with `Content-Disposition: attachment; filename="velpi-review-<business>-<runId>.json"`. The full-page PNG (which needs a browser to render) is merged client-side before download.

**Privacy:** the package publishes the business's site content + screenshots to an external service (ChatGPT); it may be cached/retained there. This is acceptable because the tool is dev-only and reviews the operator's own client work — but the artifact **never contains API keys, env vars, or any secret** (none of the source rows hold them), and this is asserted in the `security` field.

### 7.2 "Export All Reviews" — batch export (50–100 generations) [future]

**Goal:** package many reviewed generations at once for a systemic architectural review, trend analysis, or a training-set snapshot — without per-run manual work.

**Trigger:** from `/creative-debug`, an `Export all reviews` action with filters (flag, niche, tier, date range, `limit` 50–100).

**Format:** **default single JSON** — light and portable:
```
{
  artifact: "velpi-cil-review-batch",
  format: "batch", version, generatedAt, count,
  selection: { limit, flag?, niche?, tier?, since? },
  instructions: "<batch-review prompt — see below>",
  fleet_metrics: { ...computeFleetMetrics over the selection... },
  runs: [
    { runId, business, niche, tier,
      directive_summary,        // thesis, dna, tier, archetype, signature moment
      validation_summary,       // passed, score, top issues
      developer_review,         // flag, scores, tags, notes
      rollup, prompt_versions }
  ]
}
```
HTML and screenshots are **excluded by default** (100 base64 payloads is far too large); `includeHtml=true` / `includeScreens=true` switches the response to a **ZIP** with one folder per run.

**Batch instruction prompt** (the `instructions` field):
> "Here are N reviewed CIL generations with the fleet metrics summary. Find systemic patterns, not per-run nits: which stages/parameters most correlate with low human scores; the most-overridden seed defaults and whether the overrides improved outcomes; recurring section-tag complaints; and score deltas across prompt versions. Recommend the top 5 changes to `defaults.js`, prompts, or schema, ranked by expected impact."

**Scale strategy:** hard-cap at 100; exclude base64 by default; paginate the DB read; stream the response; echo the `selection` criteria; and surface a size estimate before download. Reuses `computeFleetMetrics` for the aggregate block and the `creative_training_rows` view for the per-run rows.

**Route:** `GET /api/creative/export/batch?limit=&flag=&niche=&tier=&since=&includeHtml=false&format=json|zip` (dev-gated).

### 7.3 Shared export properties
- **Versioned:** every artifact carries `EXPORT_VERSION` plus all component versions (`cdoSchemaVersion`, `reviewSchemaVersion`, prompt/defaults versions) so a stale export is self-identifying.
- **No secrets, ever:** exports are built only from CDO / review / project rows — no env, no keys.
- **Dependency posture:** JSON path is dependency-free; only the optional ZIP path adds a zip lib.
- **Dev-gated:** both export routes refuse in production, exactly like the review routes.

---

## APPENDIX — IMPLEMENTATION PLAN (for later, not now)

New files (all additive, dev-gated):
- Review: `db/creative_reviews.sql`; `lib/creative/review.mjs` (constants + validators, pure, tested); `app/api/creative/review/route.js` (POST/GET) + `app/api/creative/reviews/route.js` (list); `components/dev/ReviewPanel.js` (client, imported into `Studio.js` behind a dev guard); extend `flags.mjs` (`isDevReviewServer`/`isDevReviewClient`) and `/api/creative/inspect` (left-join reviews). Test: `test/creative/review.test.mjs`.
- Export: `lib/creative/exportPackage.mjs` (pure packager — `buildSingleArtifact(cdo, review, project, opts)` and `buildBatchArtifact(rows, metrics, opts)`, node-testable); `app/api/creative/export/route.js` (single) and `app/api/creative/export/batch/route.js` (batch); an `Ask ChatGPT` button in `ReviewPanel`. One additive wiring change: pass `projectId` into the existing `/api/creative/assemble` call so `creative_directives.project_id` links runs to projects. Optional ZIP support is the only path that adds a dependency. Test: `test/creative/exportPackage.test.mjs`.

No change to any production or generation code.
