# CIL ROLLOUT CHECKLIST — Shadow → Assist → Execute → Own+Learn

Every transition is a single `CIL_MODE` flag change with a one-flip rollback to `legacy`.
No stage may weaken a platform invariant (`ARCHITECTURE.md` §16). Do not advance a stage until its exit criteria are met and signed off.

Legend: ☐ = to do · flag values: `legacy|off` (default), `shadow`, `assist`, `execute`.

---

## STAGE 0 — SHADOW (current) — measure, zero production impact
**State:** `CIL_MODE=shadow`, `NEXT_PUBLIC_CIL_MODE=shadow`. CIL runs fire-and-forget; Build unaffected.

- ☐ `creative_directives` table created (`db/creative_directives.sql`).
- ☐ ≥100-business corpus run (`docs/CIL_VALIDATION_PLAN.md` §2).
- ☐ Reliability gates green on `/creative-debug` (completion ≥98%, schema ≥95%, repair ≤15%, unrecoverable ≤2%, **authoritative drift = 0**, latency p95 ≤120s, tokens/run ≤45k).
- ☐ Quality gates green (validator pass ≥70%, bespoke ≥95%, confidence mean ≥0.75).
- ☐ Human blind review: CIL ≥80% better-or-equal, 0% clearly-worse.
- ☐ `defaults.js` tables tuned from `overrides.top`; golden snapshots re-frozen; `DEFAULTS_VERSION` bumped if changed.
- ☐ Go/no-go memo written and signed off.

**Exit → build the ASSIST plumbing (design refs: `CREATIVE_INTELLIGENCE_LAYER.md` §5,10).**

---

## STAGE 1 — ASSIST — CDO becomes *extra context*, Build may still invent
**State:** `CIL_MODE=assist`. The assembled CDO is passed as guidance to `design-brief`/`generate-copy`/`generate-images`/`build-site`, but Build is not required to obey it.

Build first (still additive, flag-gated):
- ☐ Server-side orchestrator so the CIL chain runs as one awaited step (not 5 client calls) — survives tab close, controls latency.
- ☐ Renderers: `renderBrief(cdo)`, `renderCopyGuide(cdo)`, `renderImageGuide(cdo)`, `renderBuildContract(cdo)` (pure, tested).
- ☐ Each consumer route accepts an optional `directive`/guide field; when absent → **exact current behavior** (verified by diff).
- ☐ Canary switch: enable assist for an internal flag / % of runs only.

Validate before ramping:
- ☐ A/B on a canary: assist vs. legacy `critique-site` score is **≥** legacy (no regression), on ≥50 runs.
- ☐ Fact-preservation, mobile, GHL, and legibility contracts unchanged (spot-check 20 outputs).
- ☐ Latency and token budget acceptable with CIL now on the critical path.
- ☐ Rollback drill: flip to `legacy`, confirm identical output.

**Exit criteria:** assist ≥ legacy on critique score and human spot-check across all clusters; zero constraint regressions.

---

## STAGE 2 — EXECUTE — Build *executes* the CDO; Brief becomes a renderer
**State:** `CIL_MODE=execute`. `build-site` runs in execution mode from `renderBuildContract(cdo)`; `design-brief` returns `renderBrief(cdo)`; the dormant `critique-site → enhance-site` loop is wired with a directive-adherence axis.

Build first:
- ☐ `build-site` EXECUTION-MODE preamble (design ref `CREATIVE_INTELLIGENCE_LAYER.md` §10.1) — additive, only active when `directive` present; all hard constraints byte-for-byte preserved.
- ☐ `critique-site` gains directive-adherence criteria; wire `critique → enhance-site(issues) → re-critique` bounded loop (≤2).
- ☐ Authoritative params (floors, palette role_map, platform constants) fed to Build verbatim, model cannot touch them (mirror the Stage-4 overlay guarantee).
- ☐ Canary (internal / %) before fleet.

Validate before ramping:
- ☐ Execute ≥ Assist on critique score AND directive-adherence, across clusters, on ≥100 canary runs.
- ☐ Equal-or-better constraint safety (a11y/mobile/GHL) — **0** regressions.
- ☐ No increase in fact-loss or truncation vs. legacy.
- ☐ Rollback drill green.

**Exit criteria:** execute beats assist on quality and adherence with no safety regression; then ramp canary → 100%.

---

## STAGE 3 — OWN + LEARN — slim Analyze, CDO-driven resolution, learning loop
**State:** `execute` at 100% + learning enabled.

- ☐ Slim `analyze` to extraction (CIL owns vibe/direction/conversion); remove now-unused fields only after confirming no downstream dependency.
- ☐ `resolver.js`: CDO-DNA-driven reference selection (semantic/embeddings) replacing niche-substring matching; seed `strategize` with high-scoring `priorDirectives`.
- ☐ Learning loop: `attachOutcome(cdoId, {critiqueScore, adherence, userEdits, exported})`; tune `defaults.js` tables from aggregate best-scoring CDOs per niche/tier.
- ☐ Distillation: high-scoring CDOs → new reusable DESIGN.md styles (review queue, per the open product decision).
- ☐ Optional A/B: two CDOs per business, keep the winner.

**Exit criteria:** measurable, sustained quality lift attributable to learning (rising validator pass + critique scores over time); no drift in safety.

---

## CROSS-CUTTING (every stage)
- ☐ **Kill switch verified:** `CIL_MODE=legacy` (env, no redeploy of logic) restores exact current behavior.
- ☐ **Per-stage fallback verified:** any CIL stage failure degrades that run to legacy; run marked `partial`.
- ☐ **Invariants protected:** GHL scoping, `@import` fonts, viewport meta, no-JS, `%%IMG%%` tokens, fact-preservation, streaming, `maxDuration=300` — never overridden by a directive; a directive may only *tighten* a11y/mobile.
- ☐ **Golden fixtures updated** for any prompt/schema/table change; `PROMPT_VERSION`/`DEFAULTS_VERSION`/`schemaVersion` bumped and stamped into provenance.
- ☐ **Dashboards watched** for the ramp: pass rate, adherence, latency, tokens, failures — set alert thresholds before each ramp.
- ☐ **Product decisions resolved** before Own+Learn: learning autonomy vs. review queue; premium tier operator-set vs. model; execute-mode strictness.
