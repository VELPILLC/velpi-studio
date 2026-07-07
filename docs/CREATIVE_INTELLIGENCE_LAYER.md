# VELPI STUDIO — CREATIVE INTELLIGENCE LAYER (CIL)

**Design specification — v1.0 (design only, no implementation code)**
Author role: Lead AI Systems Architect. Companion to `ARCHITECTURE.md`.
Snapshot date: 2026-07-07.

> **Prime directive:** the existing, production-tested `Analyze → Design Brief → Copy → Build` pipeline must keep working unchanged until each CIL phase is proven and switched on behind a flag. The CIL is **additive and reversible at every step**.

---

## 0. THE CENTRAL IDEA (read this first)

Today the **Build** model is both the *decider* and the *executor*: it invents typography, spacing, color logic, motion, and composition on the fly inside one 64k-token call, loosely guided by a prose brief and a few reference systems. That works, but the "thinking" is implicit, unversioned, unauditable, and unrepeatable.

The **Creative Intelligence Layer (CIL)** inverts this. It is a reasoning layer that sits **above** the pipeline and does the thinking a world-class agency does *before anyone opens a design tool*. It emits a single, explicit, machine-executable artifact — the **Creative Directive Object (CDO)** — that captures every creative decision as typed, executable parameters plus rationale. Downstream, **Build stops inventing and starts executing** the CDO.

```
BEFORE:  Analyze ──► Brief (invents direction) ──► Build (invents everything else)
AFTER:   Analyze (facts) ──► CIL (decides everything, emits CDO) ──► Build (executes CDO)
```

The CDO is the **one contract** between "deciding" and "making." Everything the CIL is asked to determine — 16 philosophies — becomes a typed section of the CDO with *executable parameters*, not just prose. That single inversion is what makes the system auditable, testable, learnable, and dramatically more consistent.

**Design principles governing every decision below:**
1. **Decision ≠ execution.** The CIL decides; Build executes. Never mix them again.
2. **One canonical artifact.** The CDO is versioned, typed, validated, persisted, and the sole downstream contract.
3. **Executable parameters, not vibes.** Every philosophy produces concrete values Build can implement literally (`base_unit: 8`, `hero_clamp: "clamp(2.6rem, 9vw, 6.5rem)"`, `contrast_floor: "WCAG AA"`), plus a rationale string and a confidence score.
4. **Coherence is enforced, not hoped.** A synthesis stage forces every philosophy to ladder up to one `creative_thesis`; conflicts are resolved explicitly.
5. **Non-fatal everywhere.** Every CIL stage degrades to the legacy pipeline on failure. Production can never be worse off than today.
6. **Learning-ready by construction.** Each CDO is persisted with its build's critique score and the user's post-edits, becoming the training signal for the future self-expanding library.
7. **Deterministic where it can be.** Many parameters derive by rule from a few governing dials (premium tier, archetype, emotional goals), reducing tokens and increasing consistency; the model only decides what genuinely needs judgment.

---

## 1. HIGH-LEVEL ARCHITECTURE

### 1.1 The agency, as software
Model the CIL on the org chart of a top creative agency. Each "role" becomes a reasoning module with a strict input/output contract:

| Agency role | CIL module | Produces (CDO section) |
|---|---|---|
| Strategist / Planner | **Understanding Engine** | `understanding` (business, customer, positioning, market) |
| Brand & Creative Strategist | **Strategy Engine** | `strategy` (emotional goals, premium level, archetype, the gamble, thesis) |
| Design Director / Design-Systems Architect | **Philosophy Engine** (16 philosophies) | `philosophies.*` |
| Conversion Strategist | **Conversion Engine** (absorbs today's `conversion_strategy`) | `philosophies.conversion` |
| Executive Creative Director | **Synthesis Engine** | `creative_thesis`, `coherence`, conflict resolution |
| Design Critic / QA | **Directive Critic** | `validation` (+ bounded revision loop) |
| Producer / Resource Librarian | **Reference Resolver** | `references` (styles/motion/sections chosen to fit the *decided* aesthetic) |
| Archivist | **Directive Store + Learning Hooks** | persistence, provenance, learning signal |

### 1.2 Where it sits
```
              ┌─────────────────────────── CREATIVE INTELLIGENCE LAYER ───────────────────────────┐
 scrape ─► analyze(FACTS) ─► Understanding ─► Strategy ─► Philosophy ─► Reference Resolver ─► Synthesis ─► Critic ─► CDO
                                                                                                              │
              └───────────────────────────────────────────────────────────────────────────────────┘        │
                                                                                                            ▼
                       design-brief (RENDER from CDO) ┐                                          ┌── copy (guided by CDO voice)
                                                       ├──────────────► build-site (EXECUTE CDO) ┤
                       reference systems + motion ─────┘                                          └── images (guided by CDO imagery)
                                                                    │
                                                     critique-site (scores CDO adherence) ─► Directive Store (persist CDO + score)
```

- **Analyze is slimmed over time** to objective extraction (facts, observed brand, image inventory). Its *creative* outputs (inferred vibe, direction, conversion strategy) migrate **up** into CIL modules. (Not required on day one — see rollout.)
- **Design Brief becomes a renderer**: it turns the CDO into the human-readable brief prose used in reports and (optionally) as a Build input. It no longer *invents*.
- **Build becomes an executor**: given a CDO, it implements the directive's parameters exactly, retaining only craft-level latitude within the directive's constraints.
- **Copy and Images become CDO-aware**: copy inherits `strategy.brand_archetype.voice` + `emotional_goals`; images inherit `philosophies.imagery` art direction.

### 1.3 Why a layer, not a bigger prompt
A single fatter Build prompt cannot give us: versioned decisions, per-decision confidence, coherence guarantees, reference selection driven by the *decided* aesthetic (not niche strings), auditability, A/B on decisions, or a learning signal. The CIL exists to make creative reasoning a **first-class, inspectable data structure**.

---

## 2. NEW EXECUTION FLOW

### 2.1 Full run (executor mode, the end state)
1. **scrape** *(unchanged)* → `scrapedData`.
2. **analyze** *(unchanged initially; later slimmed)* → `analysis` (facts, observed brand, image inventory, and — legacy — inferred vibe/strategy which CIL will supersede).
3. **CIL.understand** → `understanding`. Deep read of business/customer/positioning/market from `scrapedData` + `analysis.facts`.
4. **CIL.strategize** → `strategy`. Emotional goals, premium tier, archetype, the gamble, the one-sentence `creative_thesis`.
5. **CIL.decide** (Philosophy Engine) → `philosophies.*`. All 16 philosophies as executable parameters. Governing dials (premium tier, archetype, emotional goals) seed deterministic defaults; the model overrides only where judgment is needed.
6. **CIL.resolve** (Reference Resolver) → `references`. Selects style systems, one motion, section patterns that *fit the decided visual language* (not just the niche). Replaces/augments today's `pickCreativeMix` / `pickSignatureMotion` / `pickSectionReferences`.
7. **CIL.synthesize** → coherence pass. Resolves cross-philosophy conflicts, finalizes `creative_thesis`, `signature_moment`, and the directive-specific `do_not_list`.
8. **CIL.validate** (Directive Critic) → `validation`. Checks coherence, feasibility, non-genericness, constraint-safety (GHL/mobile/a11y). Bounded revision loop (≤2). Emits the final, frozen **CDO**.
9. **Persist CDO** (Directive Store) with provenance.
10. **design-brief.render(CDO)** → human brief text (for `decisions.md` and optional Build context).
11. **generate-copy(analysis, CDO.voice+emotional_goals+conversion)** → copy. *(parallel)*
12. **generate-images(analysis, CDO.imagery)** → assets. *(parallel)*
13. **build-site(EXECUTE CDO)** → HTML. Build implements `philosophies.*` parameters verbatim; craft latitude only within constraints.
14. **critique-site(html, CDO)** → score + issues, now measuring **directive adherence** (did Build implement the decided spacing/type/color/motion/signature move?).
15. **Directive Store**: attach critique score + user edits/outcome to the CDO → learning signal.

### 2.2 What runs where
- Orchestration stays **client-side in `Studio.js`** (consistent with today), calling granular CIL routes in sequence, exactly like it calls `analyze`/`brief`/`build`. Rationale: preserves streaming step-markers, avoids a single serverless invocation exceeding the 300s ceiling, and matches the proven pattern.
- Each CIL stage is its own route (small, fast, individually testable). A thin `lib/creative/orchestrator.js` provides a single callable that Studio uses so the sequence lives in one place.

### 2.3 Fallback flow (any stage fails)
If any CIL route errors or returns low confidence below a threshold, the orchestrator **falls back to the legacy path** for the remainder (legacy brief + inventing Build), and marks the CDO `partial`. Production output is never blocked by CIL.

---

## 3. EVERY NEW MODULE

All new server routes live under `app/api/creative/`. All new logic libs live under `lib/creative/`. Each module has a single responsibility and a strict I/O contract (§4).

### 3.1 Server routes (`app/api/creative/*`)
- **`understand/route.js`** — Understanding Engine (Claude). Business/customer/positioning/market reasoning.
- **`strategize/route.js`** — Strategy Engine (Claude). Emotional goals, premium tier, archetype, gamble, thesis.
- **`decide/route.js`** — Philosophy Engine (Claude + deterministic seeding). The 16 philosophies as executable parameters. May internally be one call or two (strategy-side vs. system-side) — see §3.3.
- **`synthesize/route.js`** — Synthesis Engine (Claude). Coherence + conflict resolution + signature moment + do-not list.
- **`validate/route.js`** — Directive Critic (Claude). Coherence/feasibility/non-generic/constraint checks; returns issues for a bounded revision loop.
- **(optional) `direct/route.js`** — a coarse-grained orchestrator route that runs understand→strategize→decide→synthesize→validate server-side in one call, for headless/cron/testing. Not used by the interactive UI (timeout risk); provided for automation.

### 3.2 Logic libraries (`lib/creative/*`)
- **`schema.js`** — the CDO TypeScript-style JSON Schema (plain-JS validators), `SCHEMA_VERSION`, enums (premium tiers, archetypes, density, contrast floors), and `validateDirective(cdo)`.
- **`defaults.js`** — **deterministic derivations**: given governing dials (premium tier, archetype, emotional goals, brand palette), produce sensible default parameters for spacing/type-scale/color-restraint/motion-intensity/mobile floors. These are what the model overrides, not invents from zero. This is the consistency backbone.
- **`orchestrator.js`** — runs the CIL stage sequence, applies fallbacks, assembles the CDO, enforces the revision loop, stamps provenance.
- **`resolver.js`** — Reference Resolver: maps a CDO's decided visual language → best-fit `style_ids`, `motion_id`, `section_ids`. Phase 1 uses the existing niche/vibe scorers seeded by CDO descriptors; Phase 4 upgrades to embeddings.
- **`renderBrief.js`** — CDO → the prose brief string (keeps `decisions.md` and the optional Build brief working, now *derived* not invented).
- **`renderBuildContract.js`** — CDO → the structured "EXECUTION CONTRACT" block injected into `build-site` (the literal parameters Build must implement).
- **`renderCopyGuide.js`** — CDO → the voice/emotional/conversion guidance injected into `generate-copy`.
- **`renderImageGuide.js`** — CDO → the art-direction/treatment guidance appended to image prompts.
- **`persistence.js`** — Directive Store: `saveDirective`, `getDirective`, `attachOutcome` (critique score, user edits), `listDirectivesForNiche` (learning queries).
- **`migrations.js`** — CDO schema-version upgraders (old CDOs remain readable).

### 3.3 The Philosophy Engine internal structure
The 16 philosophies split into two coherent clusters to keep each model call focused and cheap:
- **Strategic philosophies** (decided together, they depend on positioning): `emotional`, `premium`, `visual_language`, `conversion`, `imagery`. → produced by `strategize` + first half of `decide`.
- **System philosophies** (design-system parameters, derived from the strategic ones + governing dials): `typography`, `spacing`, `color`, `animation`, `layout`, `interaction`, `accessibility`, `mobile_first`. → produced by `decide`, heavily seeded by `defaults.js`.

Each philosophy conforms to a common interface so new philosophies can be added without touching others:
```
Philosophy = {
  stance: <short enum/string>,        // the decision in one phrase
  parameters: { ...executable values },
  rationale: <string>,                // why, in one or two sentences
  confidence: <0..1>,
  derived_from: [<governing dial keys>]  // provenance for learning
}
```

---

## 4. INPUTS & OUTPUTS FOR EVERY MODULE

> All routes accept/return JSON, use `maxDuration = 300`, call `callClaude` (streamed, `claude-sonnet-4-5`), and reuse `parseJson`/`stripFences`. All are **non-fatal**: on parse failure they return `{ ok:false, fallback:true, ... }` and the orchestrator degrades gracefully.

### 4.1 `POST /api/creative/understand`
- **Input:** `{ scrapedData, facts, brandObserved }` (facts + observed brand come from `analyze`; scrapedData for raw material).
- **Output:** `{ understanding, confidence }` where `understanding = { business, customer, positioning, market }` (see §8.2).
- **Token budget:** ~4–6k.

### 4.2 `POST /api/creative/strategize`
- **Input:** `{ understanding, facts, brandObserved, priorDirectives? }` (`priorDirectives` = high-scoring CDOs for this niche, for style memory — Phase 4).
- **Output:** `{ strategy, confidence }` where `strategy = { creative_thesis, north_star_feeling, emotional_goals, premium_level, brand_archetype, the_gamble, positioning_tension }`.
- **Token budget:** ~3–4k.

### 4.3 `POST /api/creative/decide`
- **Input:** `{ understanding, strategy, brandPalette, brandObserved, seedDefaults }` (`seedDefaults` computed by `defaults.js` from strategy+palette).
- **Output:** `{ philosophies, confidence }` — all 16 philosophy objects (§8.4). The model receives `seedDefaults` and returns overrides + rationales; unchanged defaults pass through.
- **Token budget:** ~6–9k (largest CIL call; can be split into two calls if needed).

### 4.4 `POST /api/creative/resolve` *(or run in `lib/creative/resolver.js` client-side)*
- **Input:** `{ philosophies.visual_language, philosophies.layout, philosophies.animation, strategy, industryText, availableStyles, availableMotion, availableSections, avoidMixes, avoidMotionIds }`.
- **Output:** `{ references: { style_ids[], style_fusion_note, motion_id, section_ids[], resolution_method } }`.
- **Note:** wraps/extends existing selectors; can be pure deterministic JS (no model call) in Phase 1.

### 4.5 `POST /api/creative/synthesize`
- **Input:** `{ understanding, strategy, philosophies, references }`.
- **Output:** `{ creative_thesis (final), coherence: { signature_moment, do_not_list[], resolved_conflicts[] }, adjustedPhilosophies? }` — may return small parameter adjustments to resolve conflicts.
- **Token budget:** ~3–4k.

### 4.6 `POST /api/creative/validate`
- **Input:** `{ directiveDraft }` (assembled CDO).
- **Output:** `{ passed, score, issues:[{severity, area, problem, fix}], mustRevise }`. `passed` requires internal coherence + feasibility + constraint-safety.
- **Loop:** if `mustRevise` and revision count < 2, orchestrator re-invokes `decide`/`synthesize` with the issues, else freezes the CDO as `passed:false, partial:true` (Build still executes what's coherent, falling back to invention where flagged).
- **Token budget:** ~2–3k.

### 4.7 `lib/creative/orchestrator.js` (callable, not a route)
- **Input:** `{ scrapedData, analysis, options:{ cilMode, avoidMixes, avoidMotionIds, priorDirectives } }`.
- **Output:** `{ directive (CDO), mode, partial, timings }`.

### 4.8 Renderers (pure functions, no model)
- `renderBrief(cdo) → string` (brief prose).
- `renderBuildContract(cdo) → string` (execution-contract block for Build).
- `renderCopyGuide(cdo) → string`.
- `renderImageGuide(cdo) → string`.

### 4.9 `lib/creative/persistence.js`
- `saveDirective(cdo) → { id }`; `getDirective(id) → cdo`; `attachOutcome(id, { critiqueScore, userEdits, exported }) → void`; `listDirectivesForNiche(niche, minScore) → cdo[]`.

---

## 5. WHICH EXISTING FILES CHANGE (and how, minimally)

> Every change is **guarded by the CIL mode flag**. When the flag is off/`legacy`, these files behave exactly as today.

- **`components/Studio.js`** — the orchestration seam.
  - After `analyze`, if `CIL_MODE !== 'legacy'`, call `lib/creative/orchestrator.js` to produce the CDO (adds a "Creative direction" step to `STEP_DEFS`).
  - Pass `directive` into `design-brief`, `generate-copy`, `generate-images`, and `build-site` payloads.
  - Store the CDO in `lastRunRef` and in the auto-saved `projData` (new `directive` field).
  - All wrapped in `if (cilEnabled) { ... } else { <existing code path unchanged> }`.
- **`app/api/build-site/route.js`** — add an **execution mode**.
  - If `body.directive` present: prepend an "EXECUTION CONTRACT" system preamble (§10) and inject `renderBuildContract(directive)` in the user prompt; the model executes, doesn't invent. All existing hard constraints (GHL scoping, `@import` fonts, viewport meta, mobile contract, `%%IMG%%` tokens, no JS) **remain byte-for-byte**.
  - If absent: **exact current behavior**.
- **`app/api/design-brief/route.js`** — accept `directive`; if present, return `renderBrief(directive)` (deterministic) instead of inventing; else current behavior. (Keeps the route's contract identical downstream.)
- **`app/api/generate-copy/route.js`** — accept optional `copyGuide` (from `renderCopyGuide`); if present, append it to the user prompt (voice, emotional goals, conversion emphasis). Else current behavior.
- **`app/api/generate-images/route.js`** — accept optional `imageGuide` (from `renderImageGuide`); if present, blend its art-direction/treatment into `THEME_LINE`/`PRO_TOUCHUP`. Else current behavior.
- **`app/api/critique-site/route.js`** — accept optional `directive`; if present, add "DIRECTIVE ADHERENCE" criteria (did the build implement the decided spacing/type/color/motion/signature move?). Else current rubric. (This also finally *wires in* the dormant critique route — see §11.)
- **`lib/designStyles.js`, `lib/motionPresets.js`, `lib/sectionPresets.js`** — **no breaking changes**; add new exported functions consumed by `resolver.js` (e.g., `scoreStylesByDescriptors(styles, descriptors)`), leaving existing selectors intact.
- **`lib/supabase.js`** — add `creative_directives` table CRUD (`saveDirective`/`getDirective`/`attachOutcome`/`listDirectivesForNiche`) + documented `CREATE TABLE` SQL in the header, mirroring the existing pattern. Existing functions untouched.
- **`app/api/analyze/route.js`** — **unchanged until Phase 4.** Then optionally slim: remove `inferred_vibe`/`design_direction`/`conversion_strategy` generation (now owned by CIL) and keep RECON facts + observed brand + image inventory. This is the *last* change and is itself flag-guarded.

---

## 6. WHICH NEW FILES ARE CREATED

```
app/api/creative/
  understand/route.js
  strategize/route.js
  decide/route.js
  synthesize/route.js
  validate/route.js
  resolve/route.js            (optional; can live purely in lib)
  direct/route.js             (optional coarse orchestrator for headless/cron)

lib/creative/
  schema.js                   # CDO schema + SCHEMA_VERSION + validators + enums
  defaults.js                 # deterministic parameter derivations from governing dials
  orchestrator.js             # runs the stage sequence + fallbacks + revision loop
  resolver.js                 # CDO → reference selection (styles/motion/sections)
  renderBrief.js              # CDO → brief prose
  renderBuildContract.js      # CDO → execution contract block for build-site
  renderCopyGuide.js          # CDO → copy voice/conversion guidance
  renderImageGuide.js         # CDO → imagery art direction
  persistence.js              # Directive Store (Supabase creative_directives) + learning hooks
  migrations.js               # CDO version upgraders
  prompts/                    # the CIL system prompts, one file per stage (kept out of routes for reuse/testing)
    understand.prompt.js
    strategize.prompt.js
    decide.prompt.js
    synthesize.prompt.js
    validate.prompt.js

docs/
  CREATIVE_INTELLIGENCE_LAYER.md   (this file)

test/ (recommended, new)
  golden-directives/          # frozen CDO fixtures per niche for regression/shadow-diff
```

---

## 7. HOW IT INTEGRATES WITH THE EXISTING PIPELINE

### 7.1 The CDO is the only new contract
Downstream stages already accept a bag of context. Integration = **adding one field (`directive`) to existing payloads** and teaching each stage to *prefer* the directive when present. No stage's output shape changes, so the client, preview, export, and `/preview/[id]` remain untouched.

### 7.2 Mode flag governs everything
A single governing setting, `CIL_MODE ∈ { legacy, shadow, assist, execute }`, read from env (`process.env.CIL_MODE`) with an optional per-request override in the Studio payload for canarying:
- **legacy** — CIL never runs; identical to today.
- **shadow** — CIL runs and persists the CDO, Build ignores it (measure without risk).
- **assist** — CDO is passed as *additional* context; Build may still invent where the directive is silent.
- **execute** — Build executes the CDO; brief becomes a renderer.

Rollback is a flag flip; no redeploy of logic required if the flag is env-driven with a safe default (`legacy`).

### 7.3 Reference selection continuity
`resolver.js` **wraps** the existing `pickCreativeMix`/`pickSignatureMotion`/`pickSectionReferences`. In Phase 1 it simply feeds CDO descriptors as extra `vibeText`, so behavior is a strict superset. Only in Phase 4 does it switch to CDO-driven (semantic) selection. The anti-repetition memory (`velpi_gen_history`) continues to work unchanged.

### 7.4 Persistence continuity
The CDO is saved (a) in `projects.data.directive` (so every project carries its brain, and `/preview/[id]` is unaffected) and (b) in a dedicated `creative_directives` table (for cross-project learning queries). The existing `projects`/`design_styles`/`domain_palettes` tables are untouched.

### 7.5 Learning loop hook (forward-compatible)
`attachOutcome(cdoId, {critiqueScore, userEdits, exported})` after each run turns the CDO into a labeled example. Cross-referenced with the future self-expanding style library (see `ARCHITECTURE.md` §14.1), high-scoring CDOs become the seed for distilling new reusable DESIGN.md systems and for tuning `defaults.js`.

---

## 8. DATA STRUCTURES (the CDO, in full)

The Creative Directive Object is the heart of the system. It is **versioned**, **typed**, and **validated** before Build ever sees it. Every philosophy carries `stance` + executable `parameters` + `rationale` + `confidence`.

### 8.1 Top level
```
CreativeDirective {
  schemaVersion: int,                 // e.g. 1
  id: uuid,
  businessName: string,
  createdAt: ISO,
  mode: 'shadow'|'assist'|'execute',
  partial: bool,                      // true if a stage fell back
  understanding: Understanding,
  strategy: Strategy,
  philosophies: Philosophies,         // the 16
  references: References,
  coherence: Coherence,
  validation: Validation,
  provenance: Provenance
}
```

### 8.2 Understanding
```
Understanding {
  business: { true_offering, category, maturity: 'new'|'established'|'legacy',
              differentiators: [string], proof_assets: [string] },
  customer: { who, jobs_to_be_done: [string], anxieties: [string], desires: [string],
              sophistication: 'low'|'medium'|'high', decision_trigger: string },
  positioning: { statement, competitive_frame, price_posture: 'value'|'mid'|'premium'|'luxury',
                 primary_promise, reasons_to_believe: [string] },
  market: { category_conventions: [string], cliches_to_avoid: [string], visual_bar_reference: string }
}
```

### 8.3 Strategy (the governing dials)
```
Strategy {
  creative_thesis: string,            // ONE sentence every philosophy must ladder to
  north_star_feeling: string,         // the 3-second feeling
  emotional_goals: { primary, secondary, evoke: [string], avoid: [string] },
  premium_level: { tier: 'mass'|'mid'|'premium'|'luxury'|'ultra', score_0_100: int, justification },
  brand_archetype: { primary: <Jung 12>, secondary: <Jung 12>, voice_adjectives: [string] },
  the_gamble: { move: string, justification: string, risk: 'low'|'medium'|'high' },
  positioning_tension: string         // the interesting contrast the design leans into
}
```
> `premium_level.tier` + `brand_archetype` + `emotional_goals` are the **governing dials**; `defaults.js` derives baseline parameters for the system philosophies from them, which the Philosophy Engine then overrides only where judgment adds value.

### 8.4 Philosophies (all 16 — each is a `Philosophy` object; representative `parameters` shown)
```
philosophies {
  visual_language:  { stance, parameters:{ descriptors:[string], movement_refs:[string], texture, surface_language, ornamentation:'none'|'restrained'|'expressive' } },
  typography:       { stance, parameters:{ display_family, body_family, accent_family?, scale_ratio, hero_clamp, h2_clamp, h3_clamp, body_px, weights:{}, tracking:{}, case_rules:[string] } },
  spacing:          { stance, parameters:{ base_unit:int, density:'tight'|'balanced'|'airy'|'palatial', section_rhythm, grid:{ columns:int, gutter, asymmetry:'none'|'subtle'|'bold' } } },
  color:            { stance, parameters:{ role_map:{ page_bg, alt_bg, ink, muted, cta, accent, ... }, source_palette:[hex], contrast_strategy, gradient_policy, dark_surface_policy, restraint_rule } },
  animation:        { stance, parameters:{ signature_motion:{ id?, spec?, placement, intensity:'subtle'|'medium'|'bold' }, micro_interactions_allowed:[string], forbidden:[string], reduced_motion_policy } },
  imagery:          { stance, parameters:{ art_direction, grade, lighting, crop_language, subject_rules:[string], real_vs_generated_bias, theme_lock } },
  conversion:       { stance, parameters:{ primary_action, secondary_action, cta_ubiquity_rule, proof_adjacency_rule, offer_moment, objections:[{objection,answered_by,where}], persuasion_flow:[{section,job}], friction_reducers:[string] } },
  layout:           { stance, parameters:{ section_order:[string], rhythm_pattern, hero_construction, signature_structural_move, bespoke_moves:[string]/* the 3+ */, density_target } },
  interaction:      { stance, parameters:{ hover_behavior, nav_behavior, focus_states, feedback_language } },
  accessibility:    { stance, parameters:{ contrast_floor:'WCAG AA'|'WCAG AAA', min_body_px:int, tap_target_min_px:int, motion_safety, semantic_rules:[string] } },
  mobile_first:     { stance, parameters:{ base_viewport_px:int, edge_to_edge_policy, type_floor_px:int, nav_pattern, thumb_reach_rules:[string], breakpoints:[int] } }
}
```
> Note: `conversion` **absorbs** today's `analysis.conversion_strategy` (same shape, now owned by CIL). During transition, CIL can seed it *from* `analysis.conversion_strategy` so nothing regresses.

### 8.5 References, Coherence, Validation, Provenance
```
references { style_ids:[string], style_fusion_note, motion_id, section_ids:[string], resolution_method:'niche'|'vibe'|'directive' }
coherence  { signature_moment, do_not_list:[string], resolved_conflicts:[{between,resolution}], consistency_checks_passed:[string] }
validation { passed:bool, score:int, issues:[{severity,area,problem,fix}], revised_count:int }
provenance { model, cilMode, stageTimings:{}, inputsHash, confidenceOverall:0..1, schemaVersion }
```

### 8.6 Supabase table
```
create table if not exists creative_directives (
  id          uuid default gen_random_uuid() primary key,
  project_id  uuid,                 -- optional link to projects.id
  niche       text,
  tier        text,                 -- premium_level.tier (for learning queries)
  directive   jsonb not null,       -- the full CDO
  critique_score int,               -- attached post-build
  outcome     jsonb,                -- {userEdits, exported, ...}
  created_at  timestamptz default now()
);
```

---

## 9. API ROUTES REQUIRED (summary table)

| Route | Method | Model? | In | Out | maxDuration |
|---|---|---|---|---|---|
| `/api/creative/understand` | POST | Claude | scrapedData, facts, brandObserved | understanding | 300 |
| `/api/creative/strategize` | POST | Claude | understanding, facts, priorDirectives? | strategy | 300 |
| `/api/creative/decide` | POST | Claude | understanding, strategy, palette, seedDefaults | philosophies | 300 |
| `/api/creative/resolve` | POST* | none | philosophies, strategy, libraries, avoid lists | references | 60 |
| `/api/creative/synthesize` | POST | Claude | understanding, strategy, philosophies, references | coherence + adjustments | 300 |
| `/api/creative/validate` | POST | Claude | directiveDraft | validation | 300 |
| `/api/creative/direct` (opt) | POST | Claude | scrapedData, analysis | full CDO | 300 |

\* `resolve` can be pure JS in `lib/creative/resolver.js` (no route needed) — a route is only for parity/testing.

Existing routes gaining an optional `directive`/guide field: `design-brief`, `generate-copy`, `generate-images`, `build-site`, `critique-site`.

---

## 10. HOW EXISTING PROMPTS CHANGE

> Prompts are **augmented, never rewritten destructively**. Legacy prompt text stays; new behavior is additive and mode-gated.

### 10.1 `build-site` — the biggest shift: inventor → executor
- **Add an EXECUTION-CONTRACT preamble** (only when `directive` present), roughly:
  > "The creative decisions for this page have ALREADY been made by the Creative Intelligence Layer and are provided below as an EXECUTION CONTRACT. Your job is flawless implementation, not invention. Implement each philosophy's parameters exactly: the typography scale, spacing base unit and density, color role map, the single signature motion, the named signature structural move, and every bespoke compositional move. You retain craft latitude ONLY within these constraints. Do not substitute your own direction. If a parameter is missing, and only then, use your judgment."
- **Reframe the ANTI-GENERIC LEDGER**: keep it, but note "the directive already guarantees non-genericness; implement its `signature_moment` and `bespoke_moves` — these ARE your three-plus moves." The mandatory HTML comment now lists the directive's moves.
- **Keep 100% unchanged**: GHL output contract (`.velpi-page`, `@import` fonts, viewport meta, single `<style>`, no JS, no `position:fixed`), MOBILE-FIRST CONTRACT, LEGIBILITY rules, `%%IMG:id%%` token rules, content-only facts. These are execution constraints Build must always honor; the directive never overrides them (accessibility/mobile philosophies are *tightenings*, never loosenings).
- **User prompt**: inject `renderBuildContract(directive)` (the literal parameters) in place of the ad-hoc brief+styles blob; keep the existing `factsBlock`, copy JSON, image slots, and motion snippet.

### 10.2 `design-brief` — inventor → renderer
- When `directive` present, the route returns `renderBrief(directive)` (deterministic prose from CDO fields) — no model call, or a light "polish" call. The AUTONOMY prompt is retained only for the legacy path.

### 10.3 `analyze` — deferred slimming (Phase 4)
- Until Phase 4: unchanged. In Phase 4: drop `inferred_vibe`, `design_direction`, `conversion_strategy` from its schema (CIL owns them) and keep RECON facts + observed brand + image inventory. The `REPAIR_SYSTEM` and JSON-safety rules stay.

### 10.4 `generate-copy` / `generate-images` — CDO-aware enrichment
- `generate-copy`: append `renderCopyGuide(directive)` — archetype voice adjectives, emotional goals (evoke/avoid), and the conversion philosophy emphasis. The existing rules (reading level, no verbatim reviews, JSON-safety) stay.
- `generate-images`: blend `renderImageGuide(directive)` (art direction, grade, lighting, crop language, subject rules) into `THEME_LINE`/`PRO_TOUCHUP`. Existing retouch/theme-lock logic stays.

### 10.5 `critique-site` — add directive-adherence axis
- When `directive` present, add rubric items: "Does the build implement the decided typography scale / spacing density / color role map / single signature motion / named signature structural move?" This makes the critique measure *fidelity to the decided direction*, not just generic quality. Existing 9 criteria stay.

### 10.6 New CIL prompts (kept in `lib/creative/prompts/`)
Each stage gets a focused system prompt authored to agency standards: the Understanding prompt reasons like a strategist (jobs-to-be-done, anxieties, positioning); the Strategy prompt like a brand strategist (archetype, premium tier, the gamble); the Decide prompt like a design-systems architect (produce executable parameters, honor the governing-dial defaults, justify overrides); the Synthesis prompt like an ECD (enforce one thesis, resolve conflicts); the Validate prompt like a design critic (coherence, feasibility, non-generic, constraint-safe). All return strict JSON matching `schema.js`, with the same JSON-safety discipline as the existing routes.

---

## 11. INCREMENTAL ROLLOUT WITHOUT BREAKING PRODUCTION

A five-phase plan; each phase is independently shippable, flag-gated, and reversible. **No phase weakens an existing guarantee.**

### Phase 0 — Scaffolding (zero production impact)
- Add `lib/creative/schema.js`, `defaults.js`, `prompts/`, and the CIL routes. Add the `creative_directives` table SQL to `lib/supabase.js` header (run manually).
- Nothing calls the CIL yet. `CIL_MODE` defaults to `legacy`.
- **Exit criteria:** CIL routes callable in isolation; `validateDirective` passes on hand-authored fixtures.

### Phase 1 — Shadow mode (measure, don't touch output)
- `CIL_MODE=shadow`. Studio runs the CIL after analyze, persists the CDO to `creative_directives` and `projects.data.directive`, but **Build ignores it** (legacy path).
- Build a small internal diff view: CDO's decided direction vs. what the legacy Build actually produced (via critique-site scoring both).
- **Exit criteria:** CDOs are coherent (validate passes ≥90% of runs) and their decisions look right on a sample of niches. Zero change to shipped HTML.

### Phase 2 — Assist mode (additive context, low risk)
- `CIL_MODE=assist`. Pass `directive` into `design-brief` (as extra context, not replacement), `generate-copy` (copy guide), `generate-images` (image guide). Build still invents layout/CSS but now sees the directive as guidance.
- Compare critique scores assist vs. legacy on a canary percentage.
- **Exit criteria:** assist ≥ legacy on critique score and human spot-check; no regressions in facts/mobile/GHL constraints.

### Phase 3 — Execute mode (the inversion), canaried
- `CIL_MODE=execute` for a **canary subset** (e.g., an internal flag or a percentage). Build uses the EXECUTION CONTRACT; `design-brief` becomes a renderer; `critique-site` adds the adherence axis and is **wired into a bounded auto-fix loop** (finally activating the dormant `enhance-site` surgical mode — see `ARCHITECTURE.md` §13.1).
- Keep legacy path one flag-flip away.
- **Exit criteria:** execute ≥ assist on critique score AND directive-adherence, across niches, with equal-or-better constraint safety. Then ramp canary → 100%.

### Phase 4 — Own the decisions + smarter resolution
- Slim `analyze` to extraction (CIL owns vibe/direction/conversion). Switch `resolver.js` to CDO-driven (semantic/embeddings) reference selection. Seed `strategize` with `priorDirectives` (high-scoring CDOs per niche).
- **Exit criteria:** no downstream stage still depends on the removed analyze fields; resolution quality ≥ Phase 3.

### Phase 5 — Learning loop
- `attachOutcome` feeds critique score + user edits back. Tune `defaults.js` from aggregate high-scoring CDOs per niche/tier. Distill top CDOs into new reusable DESIGN.md systems for the self-expanding library. Optionally A/B two CDOs per business and keep the winner.

### Rollback & safety at every phase
- **Global kill switch:** `CIL_MODE=legacy` restores exact current behavior with no redeploy (env-driven).
- **Per-stage fallback:** any CIL stage failure → orchestrator degrades that run to legacy; CDO marked `partial`.
- **Invariant protection:** the GHL output contract, `%%IMG%%` tokens, mobile-first, legibility, fact-preservation, streaming, and `maxDuration=300` (see `ARCHITECTURE.md` §16) are **never** overridden by a directive — the directive can only *tighten* accessibility/mobile, never loosen them. Validate enforces this.
- **Golden fixtures:** `test/golden-directives/` freeze known-good CDOs per niche for regression + shadow-diff.

---

## 12. EXTENSIBILITY, MAINTAINABILITY, AND FUTURE LEARNING (why this design)

- **Extensibility:** philosophies conform to one interface; adding a 17th (e.g., "sound philosophy," "internationalization philosophy") is a new module + CDO section + renderer line — no changes to existing modules. The CDO is versioned; `migrations.js` keeps old directives readable.
- **Maintainability:** decision logic lives in small, single-responsibility, individually testable routes/libs — not buried in one 100-line Build prompt. Prompts live in `lib/creative/prompts/` (reusable, diffable, unit-testable). Renderers are pure functions.
- **Determinism where it counts:** `defaults.js` makes most system parameters derive by rule from a few governing dials, cutting tokens, increasing cross-run consistency, and giving a clean surface to *learn* better defaults.
- **Learning by construction:** every run yields `(CDO → build → critique score → user edits)` — a labeled example. This is the substrate for tuning defaults, distilling new library styles, and eventually predicting a strong directive without a full model pass.
- **Auditability & trust:** the CDO is the answer to "why does the site look like this?" — every decision has a rationale and a confidence, persisted and inspectable, extending the project's existing transparency ethos (prompt trace, image attestation, decisions.md).

---

## 13. OPEN DECISIONS FOR THE OPERATOR (flagged, not assumed)

1. **How many model calls per run is acceptable?** The CIL adds ~4–6 Claude calls (~20–30k tokens) before Build. Options: (a) full granular (best quality/observability), (b) merge understand+strategize and decide+synthesize into 2 calls (cheaper), (c) the single `direct` orchestrator route (fewest calls, weakest observability). Recommendation: start granular in shadow, collapse to 2–3 calls for production once prompts stabilize.
2. **Premium tier: model-decided vs. operator-set?** A world-class agency sets the tier *with the client*. Consider a per-run operator override (`premium_level.tier`) that the CIL must honor.
3. **Execute-mode aggressiveness:** how much craft latitude Build keeps within the directive (strict executor vs. "execute the decisions, interpret the craft"). Recommendation: strict on system philosophies (type/space/color/motion/a11y/mobile), interpretive on micro-craft.
4. **Learning autonomy** (ties to `ARCHITECTURE.md` §14): do high-scoring CDOs auto-distill into the library, or land in a review queue? Recommendation: review queue first, autonomy once the critique gate is trusted.

---

*End of Creative Intelligence Layer design specification. Nothing here changes production until a phase is switched on behind `CIL_MODE`. The existing pipeline remains the ground truth and the safety net.*
