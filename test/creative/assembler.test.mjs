// Unified CDO assembler tests — pure, deterministic, no deps.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assembleDirective, buildRollup, CDO_SCHEMA_VERSION } from '../../lib/creative/assembler.mjs'
import { computeDefaults } from '../../lib/creative/defaults.mjs'
import { assembleBlueprint } from '../../lib/creative/blueprint.mjs'

const SEEDS = computeDefaults({ strategy: { creative_direction: { premium_tier: 'luxury', premium_score: 80, archetype_primary: 'Lover' }, emotional_objectives: { primary_emotion: 'warmth', evoke: ['intimacy'], avoid: ['loud'] } }, director: {}, palette: ['#7a1f2b', '#f5ead6', '#c9a26a', '#1c1a17'] })
const MODEL_BP = {
  typography: { display_family: 'Cormorant Garamond', body_family: 'Inter', scale_ratio: 1.414, hero_clamp: 'x', h2_clamp: 'y', body_px: 17, weights: {}, confidence: 0.9 },
  spacing: { density: 'airy', section_rhythm: 128, grid_asymmetry: 'subtle', confidence: 0.85 },
  color: { gradient_policy: 'subtle', dark_surface_policy: 'restricted', contrast_strategy: 'x', confidence: 0.85 },
  layout: { section_order: ['hero'], hero_construction: 'x', signature_structural_move: 'y', bespoke_moves: ['a', 'b', 'c'], rhythm_pattern: 'z', density_target: 'rich', confidence: 0.83 },
  component: { radius_language: 'soft', button_style: 'x', iconography: 'line', shadow_depth: 'refined', ornamentation: 'restrained', confidence: 0.84 },
  motion: { placement: 'hero', intensity: 'subtle', micro_interactions_allowed: [], forbidden: [], color_mapping_rule: 'x', confidence: 0.8 },
  imagery: { art_direction: 'x', grade: 'amber-warm', lighting: 'soft', crop_language: 'x', subject_rules: [], real_vs_generated_bias: 'prefer_real', theme_lock: 'x', confidence: 0.8 },
  mobile: { nav_pattern: 'logo + CTA', confidence: 0.82 },
  conversion_execution: { cta_ubiquity_rule: 'x', proof_adjacency_rule: 'y', friction_reducers: [], confidence: 0.83 },
  refinement: { overrides: [] },
}
const BLUEPRINT = assembleBlueprint(MODEL_BP, SEEDS).blueprint

const STAGES = {
  understanding: { business_understanding: { true_offering: 'candlelit dining', category: 'restaurant' }, customer_psychology: { who: 'couples' }, market_positioning: { competitive_frame: 'x', price_posture: 'premium' }, brand_identity_observed: { palette: ['#7a1f2b'] }, assumptions: ['a1'] },
  strategy: { emotional_objectives: { north_star_feeling: 'romance' }, creative_direction: { premium_tier: 'luxury', premium_score: 80, archetype_primary: 'Lover', positioning_tension: 't' }, market_positioning_intended: { statement: 's' }, brand_identity_intended: { brand_promise: 'p', brand_continuity_rule: 'keep maroon' }, conversion_strategy: { primary_action: 'Reserve' }, assumptions: ['a2'] },
  director: { creative_concept: { creative_thesis: 'candlelit love letter', gamble_move: 'dark hero', gamble_justification: 'occasion', gamble_risk: 'medium', art_direction_statement: 'warm' }, design_philosophy: { visual_language: 'editorial' }, signature_moment: { name: 'Threshold' }, design_dna_seed: { descriptors: ['editorial', 'warm'] }, creative_reasoning: { key_insights: ['occasion>everyday'] }, assumptions: ['a3'] },
  blueprint: BLUEPRINT,
  seedDefaults: SEEDS,
  validation: { validation: { passed: true, score: 91, issues: [] }, internal_critique: { self_score: 91 }, confidence: { overall: 0.86 }, revisions: [] },
}
const METAS = {
  understanding: { promptVersion: 'understanding@1.0.0', model: 'claude-sonnet-4-5', valid: true, repaired: false, durationMs: 3000, usage: { input_tokens: 4000, output_tokens: 900 } },
  strategy: { promptVersion: 'strategy@1.0.0', valid: true, repaired: true, durationMs: 2500, usage: { input_tokens: 2000, output_tokens: 700 } },
  creative_director: { promptVersion: 'creative-director@1.0.0', valid: true, durationMs: 2200, usage: { input_tokens: 1500, output_tokens: 800 } },
  blueprint: { promptVersion: 'blueprint@1.0.0', valid: true, durationMs: 5000, defaultsVersion: 'defaults@1.0.0', overrides_detected: [{ param: 'motion.intensity', from: 'subtle', to: 'medium' }], bespoke_ok: true, usage: { input_tokens: 3000, output_tokens: 1800 } },
  validation: { promptVersion: 'validator@1.0.0', modelValid: true, deterministicHardFail: false, durationMs: 2000, usage: { input_tokens: 2500, output_tokens: 600 } },
}

test('assembleDirective produces a complete, non-partial CDO', () => {
  const cdo = assembleDirective({ runId: 'run_1', businessName: 'Amrit', createdAt: '2026-07-07T00:00:00Z', stages: STAGES, metas: METAS })
  assert.equal(cdo.schemaVersion, CDO_SCHEMA_VERSION)
  assert.equal(cdo.id, 'run_1')
  assert.equal(cdo.partial, false)
  assert.equal(cdo.creative_direction.creative_thesis, 'candlelit love letter')
  assert.equal(cdo.creative_direction.premium_tier, 'luxury')
  assert.equal(cdo.philosophies.typography.display_family, 'Cormorant Garamond')
  assert.equal(cdo.brand_identity.intended.brand_promise, 'p')
  assert.equal(cdo.signature_moment.name, 'Threshold')
  assert.deepEqual(cdo.creative_reasoning.assumptions, ['a1', 'a2', 'a3'])
})

test('assembleDirective marks partial when a stage is missing', () => {
  const cdo = assembleDirective({ runId: 'r', stages: { ...STAGES, blueprint: null }, metas: METAS })
  assert.equal(cdo.partial, true)
})

test('assembleDirective embeds authoritative constraints from the blueprint', () => {
  const cdo = assembleDirective({ runId: 'r', stages: STAGES, metas: METAS })
  assert.deepEqual(cdo.constraints.color_role_map, SEEDS.seeds.color.role_map.value)
  assert.equal(cdo.constraints.accessibility.contrast_floor, SEEDS.seeds.accessibility.contrast_floor.value)
})

test('rollup aggregates tokens, latency, repairs, overrides, and pass/score', () => {
  const cdo = assembleDirective({ runId: 'r', stages: STAGES, metas: METAS })
  const r = cdo.rollup
  assert.equal(r.passed, true)
  assert.equal(r.score, 91)
  assert.equal(r.tokens.input, 13000)
  assert.equal(r.tokens.output, 4800)
  assert.equal(r.tokens.total, 17800)
  assert.equal(r.latency_ms_total, 14700)
  assert.deepEqual(r.repairs, ['strategy'])
  assert.deepEqual(r.overrides_detected, ['motion.intensity'])
  assert.equal(r.bespoke_ok, true)
  assert.deepEqual(r.failures, [])
  assert.equal(r.per_stage.blueprint.output_tokens, 1800)
})

test('rollup records failures for unrecoverable/invalid stages', () => {
  const metas = { ...METAS, validation: { ...METAS.validation, unrecoverable: true } }
  const r = buildRollup(metas, STAGES.validation, SEEDS, BLUEPRINT)
  assert.ok(r.failures.includes('validation:unrecoverable'))
})

test('provenance captures per-stage prompt versions + usage', () => {
  const cdo = assembleDirective({ runId: 'r', stages: STAGES, metas: METAS })
  assert.equal(cdo.provenance.understanding.promptVersion, 'understanding@1.0.0')
  assert.equal(cdo.provenance.blueprint.usage.output_tokens, 1800)
  assert.equal(cdo.provenance.defaultsVersion, 'defaults@1.0.0')
})

test('never throws on empty input', () => {
  const cdo = assembleDirective({})
  assert.equal(cdo.partial, true)
  assert.ok(cdo.rollup)
})
