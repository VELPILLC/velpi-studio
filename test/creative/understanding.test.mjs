// Stage 1 (Understanding) unit tests — pure functions only, no network, no deps.
// Run: npm run test:creative   (or)   node --test test/creative/understanding.test.mjs
//
// These cover the flag logic, the schema-driven output contract, the validator,
// the prompt assembly, and the user-message builder. The API route itself is
// integration-tested manually (it calls the live model) — see docs/how-to-test.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { normalizeMode, serverCilMode, isCilEnabled, isStage1ShadowEnabled, CIL_MODES } from '../../lib/creative/flags.mjs'
import {
  SCHEMA_VERSION, understandingContract, validateUnderstanding,
  emptyUnderstanding, UNDERSTANDING_SECTIONS,
} from '../../lib/creative/schema.mjs'
import {
  PROMPT_VERSION, SHARED_PREAMBLE, UNDERSTANDING_SYSTEM, buildUnderstandingUser,
} from '../../lib/creative/prompts/understanding.prompt.mjs'

// ── Flags ──────────────────────────────────────────────────────────────────
test('flags: normalizeMode maps off/legacy/unknown/empty to off', () => {
  assert.equal(normalizeMode(''), CIL_MODES.OFF)
  assert.equal(normalizeMode('legacy'), CIL_MODES.OFF)
  assert.equal(normalizeMode('nonsense'), CIL_MODES.OFF)
  assert.equal(normalizeMode(undefined), CIL_MODES.OFF)
})

test('flags: normalizeMode recognizes shadow/assist/execute case-insensitively', () => {
  assert.equal(normalizeMode('SHADOW'), CIL_MODES.SHADOW)
  assert.equal(normalizeMode(' Assist '), CIL_MODES.ASSIST)
  assert.equal(normalizeMode('execute'), CIL_MODES.EXECUTE)
})

test('flags: isCilEnabled / isStage1ShadowEnabled', () => {
  assert.equal(isCilEnabled('off'), false)
  assert.equal(isCilEnabled('shadow'), true)
  assert.equal(isStage1ShadowEnabled('assist'), true)
  assert.equal(isStage1ShadowEnabled('legacy'), false)
})

test('flags: serverCilMode reads env fresh and defaults off', () => {
  const prev = process.env.CIL_MODE
  delete process.env.CIL_MODE
  assert.equal(serverCilMode(), CIL_MODES.OFF)
  process.env.CIL_MODE = 'shadow'
  assert.equal(serverCilMode(), CIL_MODES.SHADOW)
  if (prev === undefined) delete process.env.CIL_MODE
  else process.env.CIL_MODE = prev
})

// ── Schema / contract ────────────────────────────────────────────────────────
test('schema: SCHEMA_VERSION is 1 and sections are the expected five', () => {
  assert.equal(SCHEMA_VERSION, 1)
  assert.deepEqual(UNDERSTANDING_SECTIONS, [
    'business_understanding', 'customer_psychology', 'market_positioning',
    'brand_identity_observed', 'assumptions',
  ])
})

test('schema: understandingContract lists every required section', () => {
  const c = understandingContract()
  for (const s of ['business_understanding', 'customer_psychology', 'market_positioning', 'brand_identity_observed', 'assumptions']) {
    assert.ok(c.includes(s), `contract should mention ${s}`)
  }
  assert.ok(c.includes('OUTPUT CONTRACT'))
})

function goodUnderstanding() {
  return {
    business_understanding: {
      true_offering: 'a candlelit special-occasion dining experience',
      category: 'fine dining restaurant', maturity: 'established',
      differentiators: ['30-year chef'], proof_assets: ['4.8-star Google'], confidence: 0.86,
    },
    customer_psychology: {
      who: 'couples planning a milestone night', jobs_to_be_done: ['impress a partner'],
      anxieties: ['is it worth the price?'], desires: ['a memorable evening'],
      sophistication: 'high', decision_trigger: 'an anniversary', confidence: 0.78,
    },
    market_positioning: {
      competitive_frame: 'vs. casual family spots', price_posture: 'premium',
      category_conventions: ['red spice close-ups'], confidence: 0.81,
    },
    brand_identity_observed: { palette: ['#7a1f2b', '#f5ead6'], confidence: 0.8 },
    assumptions: ['reviews imply a romance angle'],
  }
}

test('schema: validateUnderstanding accepts a well-formed object', () => {
  const { valid, errors } = validateUnderstanding(goodUnderstanding())
  assert.equal(valid, true, 'expected valid, got errors: ' + errors.join('; '))
})

test('schema: validateUnderstanding flags a missing required section', () => {
  const bad = goodUnderstanding()
  delete bad.customer_psychology
  const { valid, errors } = validateUnderstanding(bad)
  assert.equal(valid, false)
  assert.ok(errors.some(e => e.startsWith('customer_psychology')))
})

test('schema: validateUnderstanding flags a wrong type and a missing required field', () => {
  const bad = goodUnderstanding()
  bad.business_understanding.differentiators = 'not-an-array'
  delete bad.business_understanding.confidence
  const { valid, errors } = validateUnderstanding(bad)
  assert.equal(valid, false)
  assert.ok(errors.some(e => e.includes('differentiators')))
  assert.ok(errors.some(e => e.includes('confidence')))
})

test('schema: open enum accepts an out-of-set value', () => {
  const ok = goodUnderstanding()
  ok.market_positioning.price_posture = 'ultra-luxury' // not in the base enum, still allowed
  const { valid } = validateUnderstanding(ok)
  assert.equal(valid, true)
})

test('schema: confidence must be within [0,1]', () => {
  const bad = goodUnderstanding()
  bad.business_understanding.confidence = 1.5
  const { valid, errors } = validateUnderstanding(bad)
  assert.equal(valid, false)
  assert.ok(errors.some(e => e.includes('business_understanding.confidence')))
})

test('schema: emptyUnderstanding is well-shaped and not valid (nulls)', () => {
  const e = emptyUnderstanding()
  assert.deepEqual(Object.keys(e).sort(), [
    'assumptions', 'brand_identity_observed', 'business_understanding',
    'customer_psychology', 'market_positioning',
  ])
  assert.equal(validateUnderstanding(e).valid, false)
})

// ── Prompt assembly ──────────────────────────────────────────────────────────
test('prompt: system prompt includes the shared preamble and the stage marker', () => {
  assert.ok(UNDERSTANDING_SYSTEM.includes('Velpi Creative Intelligence Layer'))
  assert.ok(UNDERSTANDING_SYSTEM.includes('STAGE: UNDERSTANDING'))
  assert.ok(UNDERSTANDING_SYSTEM.startsWith(SHARED_PREAMBLE))
})

test('prompt: PROMPT_VERSION is a stable identifier', () => {
  assert.match(PROMPT_VERSION, /^understanding@\d+\.\d+\.\d+$/)
})

test('prompt: buildUnderstandingUser injects the contract and slices content to 36k', () => {
  const big = 'x'.repeat(50000)
  const msg = buildUnderstandingUser({
    scrapedData: { title: 'Amrit Palace', domain: 'amrit.com', content: big, images: [{ url: 'u', alt: 'a' }] },
    facts: { phone: '555' },
    brandObserved: { palette: ['#7a1f2b'] },
  })
  assert.ok(msg.includes('OUTPUT CONTRACT'))
  assert.ok(msg.includes('Amrit Palace'))
  assert.ok(msg.includes('"phone": "555"'))
  // 36000 content chars + the rest of the template; ensure content was sliced.
  assert.ok(!msg.includes('x'.repeat(36001)), 'content should be sliced to 36000 chars')
  assert.ok(msg.includes('x'.repeat(36000)))
})

test('prompt: buildUnderstandingUser is safe with empty inputs', () => {
  const msg = buildUnderstandingUser({})
  assert.ok(msg.includes('OUTPUT CONTRACT'))
  assert.ok(msg.includes('(none)'))
})
