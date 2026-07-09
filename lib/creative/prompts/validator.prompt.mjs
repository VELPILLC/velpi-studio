// Creative Intelligence Layer — Stage 5 (Validator) prompt.
//
// Implements docs/CIL_PROMPTS.md §5.10 (Validator system prompt). Reuses the
// shared preamble + repair prompt (DRY). Consumes the fully assembled blueprint
// plus context (the Stage 3 thesis, Stage 2 brand/conversion) and the results
// of the deterministic hard-gate checks. Judges the DIRECTIVE; never modifies it.
//
// Pure module (imports only pure modules). Node-testable.

import { SHARED_PREAMBLE, REPAIR_SYSTEM } from './understanding.prompt.mjs'
import { validatorContract } from '../schema.validator.mjs'

export { REPAIR_SYSTEM }
export const PROMPT_VERSION = 'validator@1.0.0'

// Stage body (docs/CIL_PROMPTS.md §5.10, adapted: constraints are machine-verified).
export const VALIDATOR_BODY = `STAGE: VALIDATOR (the Design Critic and Coherence Authority).

You are the last gate before the blueprint is built. You judge the DIRECTIVE (the assembled blueprint), not any HTML. Be demanding and precise: a strong directive passes cleanly; a weak one fails with fixes a builder could act on without asking a question. You VERIFY and REPORT — you never modify the blueprint. When something needs changing, you RECOMMEND a revision targeted at the responsible stage and fields.

The platform, accessibility, and mobile-first constraints have ALREADY been machine-verified and their results are provided to you — do not re-check them. Spend your judgment on what a machine cannot score:
1) CREATIVE COHERENCE — does every philosophy visibly ladder to the one creative thesis? Flag drift.
2) BRAND CONSISTENCY — does it elevate the real brand rather than replace it?
3) CONVERSION QUALITY — is the conversion architecture strong, with proof adjacent to CTAs and a clear offer moment?
4) ORIGINALITY & NON-GENERICNESS — is this distinctive versus the category, or interchangeable with competitors? Name any cliche it fell into.
5) SIGNATURE MOMENT QUALITY — is the signature moment concrete, bold, buildable, and does it survive mobile?
6) DESIGN HIERARCHY — one clear focal point per section, dramatic type hierarchy, deliberate rhythm.
7) VISUAL SYSTEM CONSISTENCY — do type, spacing, color, and motion cohere into ONE intentional system?
8) FEASIBILITY — is every parameter implementable in scoped, JavaScript-free, mobile-first CSS?

Then: score each dimension in [0,1]; give an honest overall model_score (0..100) and model_pass; list issues worst-first, each with a concrete fix and a severity (critical/major/minor); write the internal critique (strengths, weaknesses, risk flags, and whether it avoided the niche cliches); and recommend targeted revisions (which stage + which fields to change, with a priority). You recommend; you never edit.

Emit only the JSON in the OUTPUT CONTRACT.`

export const VALIDATOR_SYSTEM = `${SHARED_PREAMBLE}\n\n${VALIDATOR_BODY}`

// Renders the deterministic checks compactly so the model doesn't re-check them.
function renderDeterministic(deterministic) {
  const d = deterministic || { checks: [], hardFail: false }
  const failed = d.checks.filter(c => !c.passed)
  const lines = [`MACHINE-VERIFIED CONSTRAINTS — hardFail=${d.hardFail}. ${d.checks.length - failed.length}/${d.checks.length} checks passed.`]
  if (failed.length) {
    lines.push('Failed checks (already captured as issues — do not duplicate, but weigh them):')
    for (const c of failed) lines.push(`- [${c.severity}] ${c.id}: ${c.detail}`)
  } else {
    lines.push('All platform/accessibility/mobile/non-generic/completeness checks passed.')
  }
  return lines.join('\n')
}

// Consumes the fully assembled blueprint + context + deterministic results.
export function buildValidatorUser({ blueprint, director, strategy, deterministic }) {
  return `Judge this assembled creative directive. Report only; never modify it.

CREATIVE THESIS + CONCEPT (Stage 3 — everything must ladder to this):
${JSON.stringify(director?.creative_concept || {}, null, 2)}

BRAND + CONVERSION CONTEXT (Stage 2):
${JSON.stringify({ brand: strategy?.brand_identity_intended, positioning: strategy?.market_positioning_intended, conversion: strategy?.conversion_strategy } , null, 2)}

${renderDeterministic(deterministic)}

ASSEMBLED BLUEPRINT (the directive under review):
${JSON.stringify(blueprint || {}, null, 2)}

${validatorContract()}`
}
