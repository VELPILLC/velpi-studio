// Stage 4 (Blueprint Generator) unit tests — pure functions only, no network, no deps.
// Run: npm run test:creative

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { typeOk } from '../../lib/creative/schema-core.mjs'
import {
  SCHEMA_VERSION, CIL_STAGE, blueprintContract, validateBlueprint,
  emptyBlueprint, BLUEPRINT_SECTIONS,
} from '../../lib/creative/schema.blueprint.mjs'
import {
  IMMUTABLE_PATHS, SEED_STITCHED_PATHS, JUDGMENT_SEED_PATHS,
  renderSeedsForPrompt, assembleBlueprint, detectOverrides, bespokeMovesOk,
} from '../../lib/creative/blueprint.mjs'
import {
  PROMPT_VERSION, BLUEPRINT_SYSTEM, buildBlueprintUser, REPAIR_SYSTEM,
} from '../../lib/creative/prompts/blueprint.prompt.mjs'
import { SHARED_PREAMBLE } from '../../lib/creative/prompts/understanding.prompt.mjs'
import { computeDefaults } from '../../lib/creative/defaults.mjs'

// A representative seedDefaults produced by the real engine.
const SEEDS = computeDefaults({
  strategy: { creative_direction: { premium_tier: 'luxury', premium_score: 80, archetype_primary: 'Lover' }, emotional_objectives: { primary_emotion: 'warmth', evoke: ['intimacy'], avoid: ['loud'] } },
  director: { design_philosophy: { ornamentation: 'restrained' }, imagery_concept: { real_vs_generated_bias: 'prefer_real' } },
  palette: ['#7a1f2b', '#f5ead6', '#c9a26a', '#1c1a17'],
})

// ── schema-core: new number/int types ────────────────────────────────────────
test('core: typeOk supports number and int', () => {
  assert.equal(typeOk({ type: 'number' }, 1.414), true)
  assert.equal(typeOk({ type: 'number' }, 128), true)
  assert.equal(typeOk({ type: 'number' }, NaN), false)
  assert.equal(typeOk({ type: 'int' }, 128), true)
  assert.equal(typeOk({ type: 'int' }, 1.5), false)
})

// ── Blueprint schema ─────────────────────────────────────────────────────────
test('blueprint: version + stage + sections', () => {
  assert.equal(SCHEMA_VERSION, 1)
  assert.equal(CIL_STAGE, 'blueprint')
  assert.deepEqual(BLUEPRINT_SECTIONS, [
    'typography', 'spacing', 'color', 'layout', 'component', 'motion',
    'imagery', 'mobile', 'conversion_execution', 'refinement',
  ])
})

test('blueprint: contract mentions sections and excludes authoritative fields', () => {
  const c = blueprintContract()
  for (const s of BLUEPRINT_SECTIONS) assert.ok(c.includes(s), `contract should mention ${s}`)
  // authoritative fields are NOT declared as emittable fields in the model contract
  assert.ok(!c.includes('"role_map":'))
  assert.ok(!c.includes('"contrast_floor":'))
  assert.ok(!c.includes('"min_body_px":'))
})

function goodModelOut() {
  return {
    typography: { display_family: 'Cormorant Garamond', body_family: 'Inter', scale_ratio: 1.414, hero_clamp: 'clamp(2.6rem,9vw,6.5rem)', h2_clamp: 'clamp(1.8rem,5vw,3rem)', body_px: 17, weights: { display: 600, body: 400 }, confidence: 0.9 },
    spacing: { density: 'airy', section_rhythm: 128, grid_asymmetry: 'subtle', confidence: 0.85 },
    color: { gradient_policy: 'subtle', dark_surface_policy: 'restricted', contrast_strategy: 'dark ink on cream', confidence: 0.85 },
    layout: { section_order: ['hero', 'story', 'menu', 'proof', 'visit'], hero_construction: 'full-bleed room', signature_structural_move: 'dotted-leader menu', bespoke_moves: ['8/4 split', 'image-bleed headline', 'off-grid stat'], rhythm_pattern: 'airy->dense->dark', density_target: 'rich', confidence: 0.83 },
    component: { radius_language: 'soft', button_style: 'solid ink', iconography: 'line', shadow_depth: 'refined', ornamentation: 'restrained', confidence: 0.84 },
    motion: { placement: 'hero backdrop', intensity: 'subtle', micro_interactions_allowed: ['hover lift'], forbidden: ['autoplay carousels'], color_mapping_rule: 'secondary/neutral only', confidence: 0.8 },
    imagery: { art_direction: 'warm low-key', grade: 'amber-warm', lighting: 'soft', crop_language: 'full-bleed hero', subject_rules: ['real dishes'], real_vs_generated_bias: 'prefer_real', theme_lock: 'one shoot', confidence: 0.8 },
    mobile: { nav_pattern: 'logo + one CTA', confidence: 0.82 },
    conversion_execution: { cta_ubiquity_rule: 'sticky + hero + closing', proof_adjacency_rule: 'review beside CTA', friction_reducers: ['tap-to-call'], confidence: 0.83 },
    refinement: { overrides: [] },
  }
}

test('blueprint: validateBlueprint accepts a well-formed model output', () => {
  const { valid, errors } = validateBlueprint(goodModelOut())
  assert.equal(valid, true, 'errors: ' + errors.join('; '))
})

test('blueprint: flags missing section, missing required field, and bad number/int', () => {
  const bad = goodModelOut()
  delete bad.motion
  delete bad.typography.hero_clamp
  bad.spacing.section_rhythm = 12.5 // not int
  bad.typography.scale_ratio = 'big' // not number
  const { valid, errors } = validateBlueprint(bad)
  assert.equal(valid, false)
  assert.ok(errors.some(e => e.startsWith('motion')))
  assert.ok(errors.some(e => e.includes('hero_clamp')))
  assert.ok(errors.some(e => e.includes('section_rhythm')))
  assert.ok(errors.some(e => e.includes('scale_ratio')))
})

// ── Authoritative overlay (the core guarantee) ───────────────────────────────
test('assemble: authoritative seeds always win, even if the model tries to change them', () => {
  const tampered = goodModelOut()
  // model illegally tries to loosen a floor + change the palette
  tampered.accessibility = { contrast_floor: 'none', min_body_px: 9 }
  tampered.color.role_map = { page_bg: '#000000', ink: '#000000' }
  tampered.mobile.type_floor_px = 8
  tampered.spacing.base_unit = 3
  const { blueprint } = assembleBlueprint(tampered, SEEDS)
  assert.equal(blueprint.accessibility.contrast_floor, SEEDS.seeds.accessibility.contrast_floor.value)
  assert.equal(blueprint.accessibility.min_body_px, 16)
  assert.deepEqual(blueprint.color.role_map, SEEDS.seeds.color.role_map.value)
  assert.equal(blueprint.mobile.type_floor_px, 16)
  assert.equal(blueprint.spacing.base_unit, 8)
})

test('assemble: every IMMUTABLE path is present and equals its seed value', () => {
  const { blueprint, authoritative } = assembleBlueprint(goodModelOut(), SEEDS)
  assert.deepEqual(authoritative, IMMUTABLE_PATHS)
  for (const p of IMMUTABLE_PATHS) {
    const [g, n] = p.split('.')
    assert.deepEqual(blueprint[g][n], SEEDS.seeds[g][n].value, `authoritative ${p} not stitched`)
  }
})

test('assemble: seed-stitched defaults (hover/feedback) are filled from seeds', () => {
  const { blueprint } = assembleBlueprint(goodModelOut(), SEEDS)
  for (const p of SEED_STITCHED_PATHS) {
    const [g, n] = p.split('.')
    assert.equal(blueprint[g][n], SEEDS.seeds[g][n].value)
  }
})

test('assemble: model judgment fields are preserved', () => {
  const { blueprint } = assembleBlueprint(goodModelOut(), SEEDS)
  assert.equal(blueprint.typography.display_family, 'Cormorant Garamond')
  assert.deepEqual(blueprint.layout.bespoke_moves.length >= 3, true)
})

// ── Override detection (learning signal) ─────────────────────────────────────
test('detectOverrides: reports seeded params the model changed', () => {
  const m = goodModelOut()
  m.motion.intensity = 'bold'          // seed was subtle
  m.spacing.density = 'palatial'       // seed was airy
  const diffs = detectOverrides(m, SEEDS)
  const params = diffs.map(d => d.param)
  assert.ok(params.includes('motion.intensity'))
  assert.ok(params.includes('spacing.density'))
  const mi = diffs.find(d => d.param === 'motion.intensity')
  assert.equal(mi.to, 'bold')
})

test('detectOverrides: empty when the model adopts every seed', () => {
  // Build a model output that matches the seeds for the mapped judgment params.
  const m = goodModelOut()
  m.motion.intensity = SEEDS.seeds.motion.intensity.value
  m.spacing.density = SEEDS.seeds.spacing.density.value
  m.spacing.section_rhythm = SEEDS.seeds.spacing.section_rhythm.value
  m.spacing.grid_asymmetry = SEEDS.seeds.spacing.grid_asymmetry.value
  m.typography.scale_ratio = SEEDS.seeds.typography.scale_ratio.value
  m.typography.body_px = SEEDS.seeds.typography.body_px.value
  m.color.gradient_policy = SEEDS.seeds.color.gradient_policy.value
  m.color.dark_surface_policy = SEEDS.seeds.color.dark_surface_policy.value
  m.component.radius_language = SEEDS.seeds.component.radius_language.value
  m.component.button_style = SEEDS.seeds.component.button_style.value
  m.component.iconography = SEEDS.seeds.component.iconography.value
  m.component.shadow_depth = SEEDS.seeds.component.shadow_depth.value
  m.component.ornamentation = SEEDS.seeds.component.ornamentation.value
  m.imagery.grade = SEEDS.seeds.imagery.grade.value
  m.imagery.lighting = SEEDS.seeds.imagery.lighting.value
  m.imagery.crop_language = SEEDS.seeds.imagery.crop_language.value
  m.imagery.real_vs_generated_bias = SEEDS.seeds.imagery.real_vs_generated_bias.value
  assert.deepEqual(detectOverrides(m, SEEDS), [])
})

test('bespokeMovesOk enforces >=3', () => {
  assert.equal(bespokeMovesOk(goodModelOut()), true)
  const two = goodModelOut(); two.layout.bespoke_moves = ['a', 'b']
  assert.equal(bespokeMovesOk(two), false)
})

// ── Seed rendering for the prompt ────────────────────────────────────────────
test('renderSeedsForPrompt lists judgment seeds and the authoritative block', () => {
  const txt = renderSeedsForPrompt(SEEDS)
  assert.ok(txt.includes('SEED DEFAULTS'))
  assert.ok(txt.includes('AUTHORITATIVE'))
  assert.ok(txt.includes('typography.scale_ratio'))
  assert.ok(txt.includes('color.role_map'))
  assert.ok(txt.includes('contrast_floor'))
  // judgment paths are documented, immutable numeric floors are in the fixed block
  for (const p of JUDGMENT_SEED_PATHS) { if (SEEDS.seeds[p.split('.')[0]]?.[p.split('.')[1]]) assert.ok(txt.includes(p)) }
})

// ── Prompt assembly ──────────────────────────────────────────────────────────
test('blueprint prompt: reuses shared preamble + carries stage marker + version', () => {
  assert.ok(BLUEPRINT_SYSTEM.startsWith(SHARED_PREAMBLE))
  assert.ok(BLUEPRINT_SYSTEM.includes('STAGE: BLUEPRINT GENERATOR'))
  assert.match(PROMPT_VERSION, /^blueprint@\d+\.\d+\.\d+$/)
  assert.ok(typeof REPAIR_SYSTEM === 'string' && REPAIR_SYSTEM.length > 0)
})

test('blueprint prompt: user message injects director + seeds + section order + contract', () => {
  const msg = buildBlueprintUser({
    director: { creative_concept: { creative_thesis: 'a candlelit love letter' } },
    seedDefaults: SEEDS,
    sectionOrderHint: ['hero', 'menu', 'visit'],
  })
  assert.ok(msg.includes('OUTPUT CONTRACT'))
  assert.ok(msg.includes('candlelit love letter'))
  assert.ok(msg.includes('AUTHORITATIVE'))
  assert.ok(msg.includes('hero'))
})

test('blueprint: emptyBlueprint is invalid but assembles safely with authoritative seeds', () => {
  const e = emptyBlueprint()
  assert.equal(validateBlueprint(e).valid, false)
  const { blueprint } = assembleBlueprint(e, SEEDS)
  // even from an empty model output, authoritative seeds are present
  assert.deepEqual(blueprint.color.role_map, SEEDS.seeds.color.role_map.value)
  assert.equal(blueprint.accessibility.contrast_floor, SEEDS.seeds.accessibility.contrast_floor.value)
})
