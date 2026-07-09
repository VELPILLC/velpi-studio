// Stage 2 (Strategy) unit tests — pure functions only, no network, no deps.
// Run: npm run test:creative

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { typeOk, renderContract, validateAgainst, emptyFrom, sectionsOf } from '../../lib/creative/schema-core.mjs'
import {
  SCHEMA_VERSION, CIL_STAGE, STRATEGY_SCHEMA, strategyContract,
  validateStrategy, emptyStrategy, STRATEGY_SECTIONS,
} from '../../lib/creative/schema.strategy.mjs'
import {
  PROMPT_VERSION, STRATEGY_SYSTEM, buildStrategyUser, REPAIR_SYSTEM,
} from '../../lib/creative/prompts/strategy.prompt.mjs'
import { SHARED_PREAMBLE } from '../../lib/creative/prompts/understanding.prompt.mjs'

// ── schema-core (shared engine) ──────────────────────────────────────────────
test('core: typeOk enforces number01 and int0100 ranges', () => {
  assert.equal(typeOk({ type: 'number01' }, 0.5), true)
  assert.equal(typeOk({ type: 'number01' }, 1.5), false)
  assert.equal(typeOk({ type: 'int0100' }, 88), true)
  assert.equal(typeOk({ type: 'int0100' }, 88.5), false)
  assert.equal(typeOk({ type: 'int0100' }, 200), false)
  assert.equal(typeOk({ type: 'enum' }, 'anything'), true)
  assert.equal(typeOk({ type: 'string[]' }, ['a', 'b']), true)
  assert.equal(typeOk({ type: 'object[]' }, [{ x: 1 }]), true)
  assert.equal(typeOk({ type: 'object[]' }, ['x']), false)
})

test('core: renderContract + validateAgainst + emptyFrom operate over a mini schema', () => {
  const mini = { s: { _desc: 'x', a: { type: 'string', required: true, desc: 'a' }, n: { type: 'number01', required: true, desc: 'n' } }, tags: { _desc: 'y', _rootArray: 'string[]' } }
  const c = renderContract(mini)
  assert.ok(c.includes('"s"') && c.includes('"tags"'))
  assert.deepEqual(emptyFrom(mini), { s: null, tags: [] })
  assert.equal(validateAgainst(mini, { s: { a: 'x', n: 0.5 }, tags: ['t'] }).valid, true)
  assert.equal(validateAgainst(mini, { s: { n: 0.5 }, tags: ['t'] }).valid, false)
  assert.deepEqual(sectionsOf(mini), ['s', 'tags'])
})

// ── Strategy schema ──────────────────────────────────────────────────────────
test('strategy: version + stage + sections', () => {
  assert.equal(SCHEMA_VERSION, 1)
  assert.equal(CIL_STAGE, 'strategy')
  assert.deepEqual(STRATEGY_SECTIONS, [
    'emotional_objectives', 'creative_direction', 'market_positioning_intended',
    'brand_identity_intended', 'conversion_strategy', 'assumptions',
  ])
})

test('strategy: contract mentions every section', () => {
  const c = strategyContract()
  for (const s of STRATEGY_SECTIONS) assert.ok(c.includes(s), `contract should mention ${s}`)
  assert.ok(c.includes('OUTPUT CONTRACT'))
})

function goodStrategy() {
  return {
    emotional_objectives: {
      north_star_feeling: 'romantic anticipation', primary_emotion: 'warmth',
      evoke: ['intimacy', 'occasion'], avoid: ['cheap', 'loud'], confidence: 0.84,
    },
    creative_direction: {
      premium_tier: 'luxury', premium_score: 88, premium_justification: 'price + proof + audience',
      archetype_primary: 'Lover', archetype_secondary: 'Sage',
      voice_adjectives: ['warm', 'refined'], positioning_tension: 'heritage x restraint', confidence: 0.83,
    },
    market_positioning_intended: {
      statement: 'the special-occasion restaurant', primary_promise: "a night you'll remember",
      reasons_to_believe: ['30-year chef'], conventions_to_break: ['stock curry shots'], confidence: 0.81,
    },
    brand_identity_intended: {
      brand_promise: "the city's most romantic table", personality: ['warm', 'refined'],
      voice_tone: 'warm authority', reading_level: 'low', brand_continuity_rule: 'elevate, keep the maroon', confidence: 0.8,
    },
    conversion_strategy: {
      primary_action: 'Reserve a Table', secondary_action: 'View the Menu', offer_moment: 'holidays book out',
      objections: [{ objection: 'pricey?', answered_by: '30-year chef', where: 'story' }],
      persuasion_flow: [{ section: 'hero', job: 'arrest' }], confidence: 0.85,
    },
    assumptions: ['reviews imply occasion angle'],
  }
}

test('strategy: validateStrategy accepts a well-formed object', () => {
  const { valid, errors } = validateStrategy(goodStrategy())
  assert.equal(valid, true, 'errors: ' + errors.join('; '))
})

test('strategy: flags missing section, missing required field, and bad types', () => {
  const bad = goodStrategy()
  delete bad.conversion_strategy
  delete bad.creative_direction.premium_score
  bad.emotional_objectives.evoke = 'not-an-array'
  const { valid, errors } = validateStrategy(bad)
  assert.equal(valid, false)
  assert.ok(errors.some(e => e.startsWith('conversion_strategy')))
  assert.ok(errors.some(e => e.includes('premium_score')))
  assert.ok(errors.some(e => e.includes('evoke')))
})

test('strategy: premium_score must be int 0..100; premium_tier is an open enum', () => {
  const s = goodStrategy()
  s.creative_direction.premium_score = 150
  assert.equal(validateStrategy(s).valid, false)
  s.creative_direction.premium_score = 90
  s.creative_direction.premium_tier = 'super-ultra' // out of set but allowed (open enum)
  assert.equal(validateStrategy(s).valid, true)
})

test('strategy: archetype open enum accepts non-Jung value', () => {
  const s = goodStrategy()
  s.creative_direction.archetype_primary = 'Trickster-Sage'
  assert.equal(validateStrategy(s).valid, true)
})

test('strategy: emptyStrategy is well-shaped and invalid', () => {
  const e = emptyStrategy()
  assert.equal(validateStrategy(e).valid, false)
  assert.deepEqual(Object.keys(e).sort(), [
    'assumptions', 'brand_identity_intended', 'conversion_strategy',
    'creative_direction', 'emotional_objectives', 'market_positioning_intended',
  ])
})

// ── Prompt assembly ──────────────────────────────────────────────────────────
test('strategy prompt: reuses shared preamble + carries the stage marker', () => {
  assert.ok(STRATEGY_SYSTEM.startsWith(SHARED_PREAMBLE))
  assert.ok(STRATEGY_SYSTEM.includes('STAGE: STRATEGY'))
  assert.match(PROMPT_VERSION, /^strategy@\d+\.\d+\.\d+$/)
  assert.ok(typeof REPAIR_SYSTEM === 'string' && REPAIR_SYSTEM.length > 0)
})

test('strategy prompt: user message injects understanding + contract, consumes only Stage 1', () => {
  const understanding = { business_understanding: { true_offering: 'candlelit dining', category: 'fine dining' } }
  const msg = buildStrategyUser({ understanding })
  assert.ok(msg.includes('OUTPUT CONTRACT'))
  assert.ok(msg.includes('candlelit dining'))
  assert.ok(msg.includes('Stage 1 output'))
})
