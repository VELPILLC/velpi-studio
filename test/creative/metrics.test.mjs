// Fleet metrics tests — pure, deterministic, no deps.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeFleetMetrics } from '../../lib/creative/metrics.mjs'

function run(over = {}) {
  return {
    rollup: {
      passed: true, score: 90, overall_confidence: 0.85, issue_count: 0,
      overrides_detected: ['motion.intensity'], seed_conflicts: [],
      tokens: { input: 12000, output: 4000, total: 16000 }, latency_ms_total: 14000,
      per_stage: {
        understanding: { durationMs: 3000, input_tokens: 4000, output_tokens: 900, repaired: false },
        strategy: { durationMs: 2500, input_tokens: 2000, output_tokens: 700, repaired: false },
        creative_director: { durationMs: 2200, input_tokens: 1500, output_tokens: 800, repaired: false },
        blueprint: { durationMs: 5000, input_tokens: 3000, output_tokens: 1800, repaired: false },
        validation: { durationMs: 2000, input_tokens: 2500, output_tokens: 600, repaired: false },
      },
      repairs: [], failures: [], bespoke_ok: true,
      ...over,
    },
  }
}

test('empty input yields a zeroed but well-formed report', () => {
  const m = computeFleetMetrics([])
  assert.equal(m.n, 0)
  assert.equal(m.validator.pass_rate_pct, 0)
  assert.ok(m.tokens && m.stage_latency && m.failures && m.repairs)
})

test('validator pass rate + score stats', () => {
  const rows = [run({ passed: true, score: 90 }), run({ passed: true, score: 88 }), run({ passed: false, score: 70 }), run({ passed: false, score: 40 })]
  const m = computeFleetMetrics(rows)
  assert.equal(m.n, 4)
  assert.equal(m.validator.pass_rate_pct, 50)
  assert.equal(m.validator.passed, 2)
  assert.equal(m.validator.score_p50 >= 70, true)
})

test('confidence distribution', () => {
  const rows = [run({ overall_confidence: 0.9 }), run({ overall_confidence: 0.6 }), run({ overall_confidence: 0.75 })]
  const m = computeFleetMetrics(rows)
  assert.ok(m.confidence.mean > 0.7 && m.confidence.mean < 0.8)
  assert.ok(Array.isArray(m.confidence.histogram))
})

test('overrides detected: mean + top params', () => {
  const rows = [run({ overrides_detected: ['motion.intensity', 'spacing.density'] }), run({ overrides_detected: ['motion.intensity'] }), run({ overrides_detected: [] })]
  const m = computeFleetMetrics(rows)
  assert.equal(m.overrides.total, 3)
  assert.equal(m.overrides.top[0].param, 'motion.intensity')
  assert.equal(m.overrides.top[0].count, 2)
})

test('stage latency + token usage per stage', () => {
  const m = computeFleetMetrics([run(), run()])
  assert.equal(m.stage_latency.blueprint.mean_ms, 5000)
  assert.equal(m.stage_latency.total.mean_ms, 14000)
  assert.equal(m.tokens.total_mean, 16000)
  assert.equal(m.tokens.per_stage.blueprint.output_mean, 1800)
})

test('failure reasons + repair frequency', () => {
  const rows = [
    run({ failures: ['validation:unrecoverable'], repairs: ['strategy'] }),
    run({ failures: [], repairs: [] }),
    run({ failures: ['validation:hard-fail'], repairs: ['blueprint', 'strategy'] }),
  ]
  const m = computeFleetMetrics(rows)
  assert.equal(m.failures.runs_with_failure, 2)
  assert.ok(m.failures.by_reason.find(f => f.reason === 'validation:unrecoverable'))
  assert.equal(m.repairs.by_stage.strategy.count, 2)
  assert.ok(m.repairs.any_rate_pct > 0)
})

test('bespoke adherence rate', () => {
  const rows = [run({ bespoke_ok: true }), run({ bespoke_ok: false }), run({ bespoke_ok: true })]
  const m = computeFleetMetrics(rows)
  assert.ok(Math.abs(m.bespoke_ok_rate_pct - 66.7) < 1)
})
