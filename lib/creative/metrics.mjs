// Creative Intelligence Layer — shadow-mode fleet metrics.
//
// Pure aggregation over many assembled directives (their `rollup` blocks). Powers
// the dev dashboard and the objective success criteria. No I/O, no Date.
//
// Input: rows = array of { rollup, provenance?, businessName?, niche?, tier? }
//   (i.e. assembled directives, or {rollup} projections from the DB).
//
// Node-testable.

export const METRICS_VERSION = 'cil-metrics@1.0.0'

function rollups(rows) { return (Array.isArray(rows) ? rows : []).map(r => r?.rollup).filter(Boolean) }
function pct(n, d) { return d ? Math.round((n / d) * 1000) / 10 : 0 }
function mean(xs) { const a = xs.filter(x => typeof x === 'number'); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0 }
function round1(x) { return Math.round(x * 10) / 10 }
function round2(x) { return Math.round(x * 100) / 100 }
function percentile(xs, p) {
  const a = xs.filter(x => typeof x === 'number').sort((x, y) => x - y)
  if (!a.length) return 0
  const idx = Math.min(a.length - 1, Math.max(0, Math.ceil((p / 100) * a.length) - 1))
  return a[idx]
}
function histogram(xs, edges) {
  const buckets = edges.slice(0, -1).map((lo, i) => ({ range: `${lo}-${edges[i + 1]}`, count: 0 }))
  for (const x of xs) {
    if (typeof x !== 'number') continue
    for (let i = 0; i < edges.length - 1; i++) { if (x >= edges[i] && (x < edges[i + 1] || i === edges.length - 2)) { buckets[i].count++; break } }
  }
  return buckets
}

export function computeFleetMetrics(rows) {
  const rs = rollups(rows)
  const n = rs.length

  // 1) Validator pass rate.
  const scored = rs.filter(r => r.passed !== null && r.passed !== undefined)
  const passes = scored.filter(r => r.passed === true).length
  const validator = {
    runs: n, scored: scored.length,
    pass_rate_pct: pct(passes, scored.length),
    passed: passes, failed: scored.length - passes,
    score_mean: round1(mean(rs.map(r => r.score))),
    score_p50: percentile(rs.map(r => r.score), 50),
    score_p95: percentile(rs.map(r => r.score), 95),
    score_histogram: histogram(rs.map(r => r.score), [0, 40, 60, 70, 80, 85, 90, 95, 101]),
  }

  // 2) Confidence distribution.
  const confs = rs.map(r => r.overall_confidence).filter(x => typeof x === 'number')
  const confidence = {
    mean: round2(mean(confs)),
    p50: round2(percentile(confs, 50)),
    p05: round2(percentile(confs, 5)),
    histogram: histogram(confs, [0, 0.5, 0.6, 0.7, 0.8, 0.9, 1.01]),
  }

  // 3) Overrides detected.
  const overrideCounts = {}
  let totalOverrides = 0
  for (const r of rs) for (const p of (r.overrides_detected || [])) { overrideCounts[p] = (overrideCounts[p] || 0) + 1; totalOverrides++ }
  const overrides = {
    mean_per_run: round1(mean(rs.map(r => (r.overrides_detected || []).length))),
    total: totalOverrides,
    top: Object.entries(overrideCounts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([param, count]) => ({ param, count, rate_pct: pct(count, n) })),
  }

  // 4) Stage latency.
  const stages = ['understanding', 'strategy', 'creative_director', 'blueprint', 'validation']
  const stage_latency = {}
  for (const st of stages) {
    const xs = rs.map(r => r.per_stage?.[st]?.durationMs).filter(x => typeof x === 'number')
    stage_latency[st] = { mean_ms: Math.round(mean(xs)), p50_ms: percentile(xs, 50), p95_ms: percentile(xs, 95) }
  }
  const totalLat = rs.map(r => r.latency_ms_total).filter(x => typeof x === 'number')
  stage_latency.total = { mean_ms: Math.round(mean(totalLat)), p50_ms: percentile(totalLat, 50), p95_ms: percentile(totalLat, 95) }

  // 5) Token usage.
  const inTok = rs.map(r => r.tokens?.input || 0)
  const outTok = rs.map(r => r.tokens?.output || 0)
  const totTok = rs.map(r => r.tokens?.total || 0)
  const perStageTokens = {}
  for (const st of stages) {
    const i = rs.map(r => r.per_stage?.[st]?.input_tokens || 0)
    const o = rs.map(r => r.per_stage?.[st]?.output_tokens || 0)
    perStageTokens[st] = { input_mean: Math.round(mean(i)), output_mean: Math.round(mean(o)) }
  }
  const tokens = {
    input_mean: Math.round(mean(inTok)), output_mean: Math.round(mean(outTok)),
    total_mean: Math.round(mean(totTok)), total_sum: totTok.reduce((s, x) => s + x, 0),
    per_stage: perStageTokens,
  }

  // 6) Failure reasons.
  const failCounts = {}
  let runsWithFailure = 0
  for (const r of rs) {
    const fs = r.failures || []
    if (fs.length) runsWithFailure++
    for (const f of fs) failCounts[f] = (failCounts[f] || 0) + 1
  }
  const failures = {
    runs_with_failure: runsWithFailure,
    failure_rate_pct: pct(runsWithFailure, n),
    by_reason: Object.entries(failCounts).sort((a, b) => b[1] - a[1]).map(([reason, count]) => ({ reason, count })),
  }

  // 7) Repair frequency.
  const repair_by_stage = {}
  for (const st of stages) {
    const c = rs.filter(r => (r.repairs || []).includes(st)).length
    repair_by_stage[st] = { count: c, rate_pct: pct(c, n) }
  }
  const anyRepair = rs.filter(r => (r.repairs || []).length > 0).length
  const repairs = { any_rate_pct: pct(anyRepair, n), by_stage: repair_by_stage }

  // Extra: bespoke-moves adherence.
  const bespokeKnown = rs.filter(r => typeof r.bespoke_ok === 'boolean')
  const bespoke_ok_rate_pct = pct(bespokeKnown.filter(r => r.bespoke_ok).length, bespokeKnown.length)

  return {
    version: METRICS_VERSION,
    n,
    validator,
    confidence,
    overrides,
    stage_latency,
    tokens,
    failures,
    repairs,
    bespoke_ok_rate_pct,
  }
}
