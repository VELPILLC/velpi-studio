// Stage 5 (Validator) unit tests — pure functions only, no network, no deps.
// Run: npm run test:creative

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  SCHEMA_VERSION, CIL_STAGE, validatorContract, validateValidator,
  emptyValidator, VALIDATOR_SECTIONS,
} from '../../lib/creative/schema.validator.mjs'
import {
  runDeterministicChecks, assembleValidation, severityRank,
} from '../../lib/creative/validator.mjs'
import {
  PROMPT_VERSION, VALIDATOR_SYSTEM, buildValidatorUser, REPAIR_SYSTEM,
} from '../../lib/creative/prompts/validator.prompt.mjs'
import { SHARED_PREAMBLE } from '../../lib/creative/prompts/understanding.prompt.mjs'
import { computeDefaults } from '../../lib/creative/defaults.mjs'
import { assembleBlueprint } from '../../lib/creative/blueprint.mjs'

// Build a realistic assembled blueprint from real seeds + a good model output.
const SEEDS = computeDefaults({
  strategy: { creative_direction: { premium_tier: 'luxury', premium_score: 80, archetype_primary: 'Lover' }, emotional_objectives: { primary_emotion: 'warmth', evoke: ['intimacy'], avoid: ['loud'] } },
  director: { design_philosophy: { ornamentation: 'restrained' }, imagery_concept: { real_vs_generated_bias: 'prefer_real' } },
  palette: ['#7a1f2b', '#f5ead6', '#c9a26a', '#1c1a17'],
})
const MODEL_BP = {
  typography: { display_family: 'Cormorant Garamond', body_family: 'Inter', scale_ratio: 1.414, hero_clamp: 'clamp(2.6rem,9vw,6.5rem)', h2_clamp: 'clamp(1.8rem,5vw,3rem)', body_px: 17, weights: { display: 600, body: 400 }, confidence: 0.9 },
  spacing: { density: 'airy', section_rhythm: 128, grid_asymmetry: 'subtle', confidence: 0.85 },
  color: { gradient_policy: 'subtle', dark_surface_policy: 'restricted', contrast_strategy: 'dark ink on cream', confidence: 0.85 },
  layout: { section_order: ['hero', 'story', 'menu', 'proof', 'visit'], hero_construction: 'full-bleed room', signature_structural_move: 'dotted-leader menu', bespoke_moves: ['8/4 split', 'image-bleed headline', 'off-grid stat'], rhythm_pattern: 'airy->dense->dark', density_target: 'rich', confidence: 0.83 },
  component: { radius_language: 'soft', button_style: 'solid ink', iconography: 'line', shadow_depth: 'refined', ornamentation: 'restrained', confidence: 0.84 },
  motion: { placement: 'hero backdrop', intensity: 'subtle', micro_interactions_allowed: ['hover lift'], forbidden: ['autoplay'], color_mapping_rule: 'secondary/neutral only', confidence: 0.8 },
  imagery: { art_direction: 'warm low-key', grade: 'amber-warm', lighting: 'soft', crop_language: 'full-bleed hero', subject_rules: ['real dishes'], real_vs_generated_bias: 'prefer_real', theme_lock: 'one shoot', confidence: 0.8 },
  mobile: { nav_pattern: 'logo + one CTA', confidence: 0.82 },
  conversion_execution: { cta_ubiquity_rule: 'sticky + hero + closing', proof_adjacency_rule: 'review beside CTA', friction_reducers: ['tap-to-call'], confidence: 0.83 },
  refinement: { overrides: [] },
}
const GOOD_BLUEPRINT = assembleBlueprint(MODEL_BP, SEEDS).blueprint

// ── schema-core object[] root arrays ─────────────────────────────────────────
test('schema: version + stage + sections', () => {
  assert.equal(SCHEMA_VERSION, 1)
  assert.equal(CIL_STAGE, 'validation')
  assert.deepEqual(VALIDATOR_SECTIONS, ['assessment', 'verdict', 'internal_critique', 'issues', 'revisions'])
})

function goodModelOut() {
  return {
    assessment: { creative_coherence: 0.9, brand_consistency: 0.88, conversion_quality: 0.85, originality: 0.82, signature_moment_quality: 0.87, design_hierarchy: 0.86, visual_consistency: 0.88, feasibility: 0.92, overall_impression: 'strong', confidence: 0.85 },
    verdict: { model_pass: true, model_score: 91, summary: 'ships' },
    internal_critique: { strengths: ['clear thesis'], weaknesses: ['thin customer read'], risk_flags: ['dark hero legibility'], generic_check: { avoided: true, cliches_dodged: ['red spice'] } },
    issues: [],
    revisions: [],
  }
}

test('schema: validateValidator accepts a well-formed model output (object[] arrays)', () => {
  const m = goodModelOut()
  m.issues = [{ severity: 'minor', area: 'design_hierarchy', problem: 'weak h3 step', fix: 'increase h3 clamp' }]
  m.revisions = [{ target_stage: 'blueprint', target_fields: ['typography.h3_clamp'], problem: '...', fix: '...', priority: 'low' }]
  const { valid, errors } = validateValidator(m)
  assert.equal(valid, true, 'errors: ' + errors.join('; '))
})

test('schema: object[] root array rejects a non-object array', () => {
  const m = goodModelOut()
  m.issues = ['not-an-object']
  const { valid, errors } = validateValidator(m)
  assert.equal(valid, false)
  assert.ok(errors.some(e => e.startsWith('issues')))
})

test('schema: flags missing assessment field and bad verdict types', () => {
  const bad = goodModelOut()
  delete bad.assessment.feasibility
  bad.verdict.model_score = 200 // not int0100
  const { valid, errors } = validateValidator(bad)
  assert.equal(valid, false)
  assert.ok(errors.some(e => e.includes('feasibility')))
  assert.ok(errors.some(e => e.includes('model_score')))
})

// ── Deterministic checks ─────────────────────────────────────────────────────
test('deterministic: a clean assembled blueprint passes all hard gates', () => {
  const d = runDeterministicChecks(GOOD_BLUEPRINT, SEEDS)
  assert.equal(d.hardFail, false)
  assert.ok(d.checks.every(c => c.passed), 'failed: ' + d.checks.filter(c => !c.passed).map(c => c.id).join(', '))
})

test('deterministic: authoritative drift is a CRITICAL hard fail', () => {
  const tampered = JSON.parse(JSON.stringify(GOOD_BLUEPRINT))
  tampered.accessibility.contrast_floor = 'none'   // loosened a floor
  tampered.color.role_map.page_bg = '#000000'      // changed the palette
  const d = runDeterministicChecks(tampered, SEEDS)
  assert.equal(d.hardFail, true)
  assert.ok(d.checks.find(c => c.id === 'constraint.authoritative_intact').passed === false)
})

test('deterministic: body_px below 16 is a critical hard fail', () => {
  const bad = JSON.parse(JSON.stringify(GOOD_BLUEPRINT))
  bad.typography.body_px = 12
  const d = runDeterministicChecks(bad, SEEDS)
  assert.equal(d.hardFail, true)
})

test('deterministic: fewer than 3 bespoke moves is a (non-hard) major failure', () => {
  const bad = JSON.parse(JSON.stringify(GOOD_BLUEPRINT))
  bad.layout.bespoke_moves = ['only-one']
  const d = runDeterministicChecks(bad, SEEDS)
  assert.equal(d.hardFail, false) // major, not critical
  assert.equal(d.checks.find(c => c.id === 'non_generic.bespoke_moves').passed, false)
})

// ── assembleValidation merge + pass/fail ─────────────────────────────────────
test('assemble: clean blueprint + strong model → PASS', () => {
  const d = runDeterministicChecks(GOOD_BLUEPRINT, SEEDS)
  const r = assembleValidation({ modelOut: goodModelOut(), deterministic: d, seedConflicts: [] })
  assert.equal(r.validation.passed, true)
  assert.equal(r.validation.score, 91)
  assert.equal(r.validation.constraint_safety.a11y_ok, true)
  assert.equal(r.validation.constraint_safety.authoritative_intact, true)
  assert.ok(r.confidence.overall > 0)
})

test('assemble: a deterministic hard fail forces FAIL and caps the score', () => {
  const tampered = JSON.parse(JSON.stringify(GOOD_BLUEPRINT))
  tampered.accessibility.min_body_px = 9
  const d = runDeterministicChecks(tampered, SEEDS)
  const r = assembleValidation({ modelOut: goodModelOut(), deterministic: d, seedConflicts: [] })
  assert.equal(r.validation.passed, false)
  assert.ok(r.validation.score <= 40)
  assert.ok(r.validation.issues.some(i => i.severity === 'critical'))
  assert.ok(r.internal_critique.risk_flags.includes('deterministic hard-gate failure'))
})

test('assemble: model critical/major issue blocks pass and caps score at 84', () => {
  const d = runDeterministicChecks(GOOD_BLUEPRINT, SEEDS)
  const m = goodModelOut()
  m.issues = [{ severity: 'major', area: 'originality', problem: 'reads generic', fix: 'push the hero' }]
  const r = assembleValidation({ modelOut: m, deterministic: d, seedConflicts: [] })
  assert.equal(r.validation.passed, false)
  assert.ok(r.validation.score <= 84)
})

test('assemble: issues are sorted worst-first and revisions by priority', () => {
  const d = runDeterministicChecks(GOOD_BLUEPRINT, SEEDS)
  const m = goodModelOut()
  m.issues = [{ severity: 'minor', area: 'x', problem: 'a', fix: 'b' }, { severity: 'critical', area: 'y', problem: 'c', fix: 'd' }]
  m.revisions = [{ target_stage: 'blueprint', target_fields: ['x'], problem: 'p', fix: 'f', priority: 'low' }, { target_stage: 'strategy', target_fields: ['y'], problem: 'p', fix: 'f', priority: 'high' }]
  const r = assembleValidation({ modelOut: m, deterministic: d, seedConflicts: [] })
  assert.equal(r.validation.issues[0].severity, 'critical')
  assert.equal(r.revisions[0].priority, 'high')
})

test('assemble: confidence report has by_section + lowest', () => {
  const d = runDeterministicChecks(GOOD_BLUEPRINT, SEEDS)
  const r = assembleValidation({ modelOut: goodModelOut(), deterministic: d, seedConflicts: ['spacing.grid_asymmetry'] })
  assert.ok('creative_coherence' in r.confidence.by_section)
  assert.ok(r.confidence.lowest && typeof r.confidence.lowest.value === 'number')
  assert.deepEqual(r.validation.coherence_check.conflicts, ['spacing.grid_asymmetry'])
})

test('assemble: unrecoverable model output → fail, low score, fallback flagged', () => {
  const d = runDeterministicChecks(GOOD_BLUEPRINT, SEEDS)
  const r = assembleValidation({ modelOut: emptyValidator(), deterministic: d, unrecoverable: true })
  assert.equal(r.validation.passed, false)
  assert.deepEqual(r.confidence.fallback_triggered, ['validator-unrecoverable'])
})

test('severityRank orders critical > major > minor', () => {
  assert.ok(severityRank('critical') > severityRank('major'))
  assert.ok(severityRank('major') > severityRank('minor'))
  assert.equal(severityRank('nonsense'), 0)
})

// ── Prompt assembly ──────────────────────────────────────────────────────────
test('validator prompt: reuses shared preamble + stage marker + version', () => {
  assert.ok(VALIDATOR_SYSTEM.startsWith(SHARED_PREAMBLE))
  assert.ok(VALIDATOR_SYSTEM.includes('STAGE: VALIDATOR'))
  assert.match(PROMPT_VERSION, /^validator@\d+\.\d+\.\d+$/)
  assert.ok(typeof REPAIR_SYSTEM === 'string' && REPAIR_SYSTEM.length > 0)
})

test('validator prompt: injects blueprint + thesis + deterministic results + contract', () => {
  const d = runDeterministicChecks(GOOD_BLUEPRINT, SEEDS)
  const msg = buildValidatorUser({ blueprint: GOOD_BLUEPRINT, director: { creative_concept: { creative_thesis: 'a candlelit love letter' } }, strategy: {}, deterministic: d })
  assert.ok(msg.includes('OUTPUT CONTRACT'))
  assert.ok(msg.includes('candlelit love letter'))
  assert.ok(msg.includes('MACHINE-VERIFIED CONSTRAINTS'))
  assert.ok(msg.includes('ASSEMBLED BLUEPRINT'))
})
