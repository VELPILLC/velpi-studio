# CIL PHASE 1 — SHADOW VALIDATION PLAN & SUCCESS CRITERIA

**Goal:** prove the Creative Intelligence Layer consistently produces *higher-quality creative decisions* before it is allowed to influence website generation. Nothing here enables production behavior. All measurement happens in **shadow mode** (`CIL_MODE=shadow` + `NEXT_PUBLIC_CIL_MODE=shadow`), with zero effect on shipped output.

---

## 1. WHAT WE ARE VALIDATING

Two questions, in order:
1. **Reliability** — does the CIL run end-to-end without breaking (valid schema, low repair/failure, acceptable latency/cost)?
2. **Quality** — are the creative decisions genuinely better than today's implicit "Build invents everything" approach?

Reliability is measured by the dashboard metrics. Quality is measured by (a) the Validator's own scores, (b) the deterministic non-genericness gates, and (c) a **human blind review** comparing CIL directives against the legacy build's implied direction.

---

## 2. TEST CORPUS — 100+ DIVERSE BUSINESSES

Assemble at least **100 real business websites** spanning the industries the style/niche libraries target. Suggested distribution (≈ even, ~5 each) so no tier/archetype is under-sampled:

| # | Industry cluster | Examples to source (real sites) |
|---|---|---|
| 1 | Restaurant — fine dining | steakhouse, sushi, tasting-menu |
| 2 | Restaurant — casual/fast | pizza, burger, taco, cafe |
| 3 | Coffee / bakery | roastery, patisserie |
| 4 | Bar / brewery / cocktail | taproom, wine bar, distillery |
| 5 | Law firm | litigation, family, corporate |
| 6 | Accounting / finance / insurance | CPA, wealth, brokerage |
| 7 | Medical / dental | clinic, orthodontist, derm |
| 8 | Wellness / spa / therapy | massage, acupuncture, counseling |
| 9 | Gym / fitness | crossfit, boxing, yoga studio |
| 10 | Salon / beauty / lashes | hair, nails, medspa |
| 11 | Real estate / architecture | brokerage, firm, interior design |
| 12 | Home services / trades | HVAC, plumbing, roofing, landscaping |
| 13 | Auto | repair, detailing, dealership |
| 14 | Retail / boutique / jewelry | apparel, home goods, jeweler |
| 15 | SaaS / tech / startup | app, dev tool, AI product |
| 16 | Agency / creative / photography | studio, freelancer portfolio |
| 17 | Events / wedding / florist | planner, venue, florist |
| 18 | Hospitality / hotel / travel | boutique hotel, BnB, tour |
| 19 | Kids / childcare / education | daycare, tutoring, courses |
| 20 | Nonprofit / church / community | ministry, charity, museum |

Within each cluster, deliberately vary: **premium tier** (include mass, mid, premium, luxury, ultra), **brand archetype** likelihood, **palette richness** (1-color vs. 4-color sites), **content density** (thin vs. review-heavy), and **crawlability** (JS-heavy vs. static). Record the input URL + expected tier per business in a fixtures list.

**How to run the corpus:** with shadow enabled, generate each business through the normal UI (or script the `/api/scrape`→`/api/analyze`→CIL chain). Each run auto-assembles one `creative_directives` row (stage `assembled`). Target **≥100 assembled runs** before evaluating.

---

## 3. HOW TO OBSERVE

- **Dashboard:** `/creative-debug` — fleet metrics (pass rate, score distribution, confidence, overrides, per-stage latency & tokens, failure reasons, repair frequency, bespoke-adherence) + a run browser that opens the full assembled CDO per run.
- **Raw logs:** each stage logs `[CIL:shadow:<stage>]`; the assembler logs `[CIL:shadow:assembled]` with the rollup.
- **DB:** `creative_directives` table; the `creative_runs` SQL view flattens the rollup for ad-hoc queries.
- **Per-run inspection:** `GET /api/creative/inspect?id=<runId>` returns the full CDO (understanding→…→validation + provenance + rollup).

---

## 4. METRICS DEFINITIONS (what the dashboard computes)

| Metric | Definition | Source |
|---|---|---|
| Validator pass rate | % of runs with `validation.passed === true` | rollup.passed |
| Score distribution | mean / p50 / p95 / histogram of `validation.score` | rollup.score |
| Confidence distribution | mean / p05 / histogram of `confidence.overall` | rollup.overall_confidence |
| Overrides detected | mean per run + most-overridden seed params | rollup.overrides_detected |
| Stage latency | per-stage + total mean/p50/p95 ms | provenance/per_stage durationMs |
| Token usage | per-stage + total input/output means, total sum | usage.input/output_tokens |
| Failure reasons | count by reason (unrecoverable, invalid-schema, hard-fail, missing-meta) | rollup.failures |
| Repair frequency | per-stage + any-repair rate | rollup.repairs |
| Bespoke ≥3 rate | % of blueprints with ≥3 bespoke moves | rollup.bespoke_ok |

---

## 5. OBJECTIVE SUCCESS CRITERIA (gate to ASSIST mode)

Assist mode may be enabled **only when ALL of the following hold across ≥100 assembled runs** spanning ≥15 industry clusters:

### Reliability gates (from the dashboard)
- **Completion:** ≥ 98% of runs are non-`partial` (all five stages produced usable output).
- **Schema validity:** ≥ 95% of each stage's outputs pass their schema validator (`provenance.*.valid`).
- **Repair rate:** ≤ 15% any-stage repair rate; **0** stages exceed 25% repair.
- **Unrecoverable failures:** ≤ 2% of runs have any `*:unrecoverable` failure.
- **Constraint safety:** **0** runs with `constraint.authoritative_intact === false` and **0** `validation:hard-fail` caused by authoritative drift (the overlay must be perfect — any drift is a bug to fix before proceeding).
- **Latency:** total CIL chain p95 ≤ 120 s (it runs off the critical path in shadow, but Assist will add it to context assembly).
- **Cost:** total tokens/run mean ≤ 45k (budget check for turning it on for every generation).

### Quality gates
- **Validator pass rate:** ≥ 70% of runs pass the full Validator (deterministic + model) with score ≥ 85 and no critical/major issues.
- **Non-genericness:** ≥ 95% `bespoke_ok` (≥3 bespoke moves) AND signature moment present on every passing run.
- **Confidence calibration:** mean `confidence.overall` ≥ 0.75; p05 ≥ 0.55 (few low-confidence directives).
- **Human blind review (the decisive gate):** sample **30 runs** (≥1 per cluster). Two reviewers, blind to which is which, compare the CIL directive's stated direction (thesis, palette map, type system, signature moment, layout moves) against the legacy build's implied direction for the same business. **CIL must be judged "clearly better" or "equal" in ≥ 80% of pairs, and "clearly worse" in 0%.** A single "clearly worse" that stems from a systemic flaw blocks the gate until fixed.
- **Override sanity:** the most-overridden seeds are inspected; if the model overrides the same seed >40% of the time, that's a `defaults.js` tuning task (fix the seed, re-baseline) — not necessarily a blocker, but must be triaged.

### Stability gate
- Re-running the same 10 businesses twice yields **coherent, non-contradictory** directives each time (variety is fine; incoherence is not). Deterministic seeds must be identical across re-runs (already guaranteed by `defaults.mjs` + golden tests).

**If any gate fails:** fix the root cause (prompt, schema, or `defaults.js` table), bump the relevant `PROMPT_VERSION`/`DEFAULTS_VERSION`, re-baseline the affected metric, and do not proceed.

---

## 6. EVALUATION WORKFLOW

1. Create the table (`db/creative_directives.sql`) in Supabase.
2. Enable shadow (`CIL_MODE=shadow`, `NEXT_PUBLIC_CIL_MODE=shadow`), restart.
3. Run the ≥100-business corpus.
4. Open `/creative-debug`; confirm reliability gates. Triage every failure reason.
5. Export 30 runs for the human blind review; score the pairs.
6. Review `overrides.top`; tune `defaults.js` tables where the model systematically disagrees; re-baseline.
7. Record the results in a short go/no-go memo. Only on a clean sweep, proceed to the ASSIST rollout checklist.

---

## 7. WHAT "BETTER CREATIVE DECISIONS" MEANS HERE

Not "the site looks nicer" (Build hasn't changed). It means the **explicit directive** is:
- **Coherent** — every philosophy ladders to one thesis (Validator `creative_coherence`).
- **Distinctive** — breaks category clichés, has a real signature moment (deterministic non-generic gate + Validator `originality`).
- **Brand-true** — elevates, not replaces (Validator `brand_consistency`).
- **Executable & safe** — concrete parameters, floors intact (deterministic gates + Validator `feasibility`).
- **Consistent** — deterministic seeds anchor it; variety without incoherence.
- **Auditable** — every decision has a rationale, confidence, and provenance.

Proving these at ≥100-run scale, with a human blind review confirming the direction is at least as good as today's, is the bar for letting the CIL touch generation.
