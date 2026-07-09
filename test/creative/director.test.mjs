// Stage 3 (Creative Director) unit tests — pure functions only, no network, no deps.
// Run: npm run test:creative

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { typeOk } from '../../lib/creative/schema-core.mjs'
import {
  SCHEMA_VERSION, CIL_STAGE, directorContract, validateDirector,
  emptyDirector, DIRECTOR_SECTIONS,
} from '../../lib/creative/schema.director.mjs'
import {
  PROMPT_VERSION, DIRECTOR_SYSTEM, buildDirectorUser, REPAIR_SYSTEM,
} from '../../lib/creative/prompts/director.prompt.mjs'
import { SHARED_PREAMBLE } from '../../lib/creative/prompts/understanding.prompt.mjs'

// ── schema-core: the newly added bool type ───────────────────────────────────
test('core: typeOk supports bool', () => {
  assert.equal(typeOk({ type: 'bool' }, true), true)
  assert.equal(typeOk({ type: 'bool' }, false), true)
  assert.equal(typeOk({ type: 'bool' }, 'yes'), false)
  assert.equal(typeOk({ type: 'bool' }, 1), false)
})

// ── Director schema ──────────────────────────────────────────────────────────
test('director: version + stage + sections', () => {
  assert.equal(SCHEMA_VERSION, 1)
  assert.equal(CIL_STAGE, 'creative_director')
  assert.deepEqual(DIRECTOR_SECTIONS, [
    'creative_concept', 'design_philosophy', 'imagery_concept',
    'signature_moment', 'design_dna_seed', 'creative_reasoning', 'assumptions',
  ])
})

test('director: contract mentions every section', () => {
  const c = directorContract()
  for (const s of DIRECTOR_SECTIONS) assert.ok(c.includes(s), `contract should mention ${s}`)
  assert.ok(c.includes('OUTPUT CONTRACT'))
})

function goodDirector() {
  return {
    creative_concept: {
      creative_thesis: 'A candlelit love letter to a 30-year kitchen.',
      gamble_move: 'a near-black, room-lit hero', gamble_justification: 'occasion beats appetite',
      gamble_risk: 'medium', art_direction_statement: 'editorial warmth, cinematic light', confidence: 0.83,
    },
    design_philosophy: {
      visual_language: 'warm editorial luxury', descriptors: ['editorial', 'warm', 'restrained'],
      ornamentation: 'restrained', surface_language: 'warm paper with soft depth',
      design_principles: ['let the room breathe', 'one hero moment'], rationale: 'restraint signals confidence', confidence: 0.82,
    },
    imagery_concept: {
      philosophy: 'cinematic candlelight, real room', art_direction: 'warm low-key',
      grade: 'amber-warm', lighting: 'candlelit key', subject_stance: 'real dishes; no named individuals',
      real_vs_generated_bias: 'prefer_real', confidence: 0.8,
    },
    signature_moment: {
      name: 'The Candlelit Threshold', description: 'full-bleed dark room hero with a warm glow',
      location: 'hero', why_unforgettable: 'it feels like walking into the room',
      must_survive_mobile: true, confidence: 0.87,
    },
    design_dna_seed: { descriptors: ['editorial', 'warm', 'candlelit', 'restrained'] },
    creative_reasoning: { key_insights: ['occasion > everyday', 'heritage is the moat'] },
    assumptions: ['reviews imply an occasion angle'],
  }
}

test('director: validateDirector accepts a well-formed object', () => {
  const { valid, errors } = validateDirector(goodDirector())
  assert.equal(valid, true, 'errors: ' + errors.join('; '))
})

test('director: must_survive_mobile is optional and bool-typed', () => {
  const d = goodDirector()
  delete d.signature_moment.must_survive_mobile
  assert.equal(validateDirector(d).valid, true) // optional
  d.signature_moment.must_survive_mobile = 'true' // wrong type
  const { valid, errors } = validateDirector(d)
  assert.equal(valid, false)
  assert.ok(errors.some(e => e.includes('must_survive_mobile')))
})

test('director: flags missing section + missing required + wrong type', () => {
  const bad = goodDirector()
  delete bad.signature_moment
  delete bad.creative_concept.creative_thesis
  bad.design_philosophy.descriptors = 'nope'
  const { valid, errors } = validateDirector(bad)
  assert.equal(valid, false)
  assert.ok(errors.some(e => e.startsWith('signature_moment')))
  assert.ok(errors.some(e => e.includes('creative_thesis')))
  assert.ok(errors.some(e => e.includes('descriptors')))
})

test('director: gamble_risk + ornamentation are open enums', () => {
  const d = goodDirector()
  d.creative_concept.gamble_risk = 'audacious'
  d.design_philosophy.ornamentation = 'maximal'
  assert.equal(validateDirector(d).valid, true)
})

test('director: confidence must be within [0,1]', () => {
  const d = goodDirector()
  d.creative_concept.confidence = 2
  const { valid, errors } = validateDirector(d)
  assert.equal(valid, false)
  assert.ok(errors.some(e => e.includes('creative_concept.confidence')))
})

test('director: emptyDirector is well-shaped and invalid', () => {
  const e = emptyDirector()
  assert.equal(validateDirector(e).valid, false)
  assert.deepEqual(Object.keys(e).sort(), [
    'assumptions', 'creative_concept', 'creative_reasoning', 'design_dna_seed',
    'design_philosophy', 'imagery_concept', 'signature_moment',
  ])
})

// ── Prompt assembly ──────────────────────────────────────────────────────────
test('director prompt: reuses shared preamble + carries the stage marker', () => {
  assert.ok(DIRECTOR_SYSTEM.startsWith(SHARED_PREAMBLE))
  assert.ok(DIRECTOR_SYSTEM.includes('STAGE: CREATIVE DIRECTOR'))
  assert.match(PROMPT_VERSION, /^creative-director@\d+\.\d+\.\d+$/)
  assert.ok(typeof REPAIR_SYSTEM === 'string' && REPAIR_SYSTEM.length > 0)
})

test('director prompt: user message injects strategy + contract, consumes only Stage 2', () => {
  const strategy = { creative_direction: { premium_tier: 'luxury', positioning_tension: 'heritage x restraint' } }
  const msg = buildDirectorUser({ strategy })
  assert.ok(msg.includes('OUTPUT CONTRACT'))
  assert.ok(msg.includes('heritage x restraint'))
  assert.ok(msg.includes('Stage 2 output'))
})
