// Creative Intelligence Layer — CDO schema (Stage 5 / Validator slice).
//
// Fifth and final slice of the Creative Decision Object (docs/CDO_SCHEMA.md
// §19,21,24). The Validator judges the DIRECTIVE (the assembled blueprint), not
// any HTML. This schema describes ONLY the MODEL's subjective assessment; the
// deterministic hard-gate checks (constraint/a11y/mobile/non-generic) are
// computed in lib/creative/validator.mjs and merged by the route.
//
// The Validator may recommend revisions but MUST NEVER modify the blueprint.
//
// Pure module. Node-testable. Uses the shared schema engine.

import { SCHEMA_VERSION } from './schema.mjs'
import { renderContract, validateAgainst, emptyFrom, sectionsOf } from './schema-core.mjs'

export { SCHEMA_VERSION }
export const CIL_STAGE = 'validation'

export const VALIDATOR_SCHEMA = Object.freeze({
  assessment: {
    _desc: 'Subjective dimension scores in [0,1]. Judge honestly — a strong directive scores high, a weak one does not.',
    creative_coherence: { type: 'number01', required: true, desc: 'Do all philosophies ladder to the one thesis?', example: 0.9 },
    brand_consistency: { type: 'number01', required: true, desc: 'Does it elevate the real brand, not replace it?', example: 0.88 },
    conversion_quality: { type: 'number01', required: true, desc: 'Is the conversion architecture strong and proof-adjacent?', example: 0.85 },
    originality: { type: 'number01', required: true, desc: 'Is it distinctive vs. the category?', example: 0.82 },
    signature_moment_quality: { type: 'number01', required: true, desc: 'Is the signature moment concrete, bold, and buildable?', example: 0.87 },
    design_hierarchy: { type: 'number01', required: true, desc: 'Is there one clear focal point per section, strong type hierarchy?', example: 0.86 },
    visual_consistency: { type: 'number01', required: true, desc: 'Do type/space/color/motion cohere into one system?', example: 0.88 },
    feasibility: { type: 'number01', required: true, desc: 'Buildable in scoped, JS-free, mobile-first CSS?', example: 0.92 },
    overall_impression: { type: 'string', required: true, desc: 'One-paragraph verdict a creative director would give.', example: 'A confident, coherent luxury direction with a genuine signature moment.' },
    confidence: { type: 'number01', required: true, desc: 'Your confidence in this assessment.', example: 0.85 },
  },
  verdict: {
    _desc: 'The model pass/score. (The route combines this with deterministic hard gates for the final verdict.)',
    model_pass: { type: 'bool', required: true, desc: 'Does the directive pass on subjective grounds?', example: true },
    model_score: { type: 'int0100', required: true, desc: 'Directive-quality score 0..100.', example: 91 },
    summary: { type: 'string', required: true, desc: 'One-line summary of the verdict.', example: 'Ships — one minor hierarchy tweak recommended.' },
  },
  internal_critique: {
    _desc: 'Self-review: strengths, weaknesses, risks, and the anti-generic check.',
    strengths: { type: 'string[]', required: true, desc: 'What is strong about this direction.', example: ['clear thesis', 'brave hero'] },
    weaknesses: { type: 'string[]', required: true, desc: 'Where it is weak or risky.', example: ['customer read is thin'] },
    risk_flags: { type: 'string[]', required: true, desc: 'Explicit risks Build/critique should watch.', example: ['dark hero legibility'] },
    generic_check: { type: 'object', required: true, desc: '{ avoided: bool, cliches_dodged: [string] } — did it avoid the niche cliches?', example: { avoided: true, cliches_dodged: ['red spice close-ups'] } },
  },
  issues: {
    _desc: 'Every issue found: array of { severity: "critical"|"major"|"minor", area, problem, fix }. Empty array if none.',
    _rootArray: 'object[]',
  },
  revisions: {
    _desc: 'Targeted revision recommendations: array of { target_stage, target_fields:[string], problem, fix, priority: "high"|"medium"|"low" }. You recommend; you never modify the blueprint.',
    _rootArray: 'object[]',
  },
})

const FOOTER = 'Rules: score honestly; list issues worst-first each with a concrete fix; recommend revisions by target stage + fields but NEVER modify the blueprint yourself. The platform/accessibility/mobile constraints are already machine-verified and provided — do not re-check them; spend your judgment on coherence, brand, originality, the signature moment, hierarchy, and feasibility. Every score is a number in [0,1]; model_score is 0..100.'

export function validatorContract() { return renderContract(VALIDATOR_SCHEMA, { footer: FOOTER }) }
export function validateValidator(obj) { return validateAgainst(VALIDATOR_SCHEMA, obj) }
export function emptyValidator() { return emptyFrom(VALIDATOR_SCHEMA) }
export const VALIDATOR_SECTIONS = sectionsOf(VALIDATOR_SCHEMA)
