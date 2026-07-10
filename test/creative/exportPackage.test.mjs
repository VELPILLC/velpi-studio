// Export packager tests — pure, deterministic, no deps.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  EXPORT_VERSION, SINGLE_INSTRUCTIONS, BATCH_INSTRUCTIONS,
  substituteTokens, buildSingleArtifact, buildBatchArtifact,
} from '../../lib/creative/exportPackage.mjs'

const CDO = {
  schemaVersion: 1, assemblerVersion: 'cdo-assembler@1.0.0', id: 'run_1', businessName: 'Amrit Palace',
  createdAt: '2026-07-07T00:00:00Z', mode: 'shadow',
  creative_direction: { creative_thesis: 'candlelit love letter', premium_tier: 'luxury', brand_archetype: { primary: 'Lover' } },
  design_dna: { descriptors: ['editorial', 'warm'], tier: 'luxury' },
  signature_moment: { name: 'The Candlelit Threshold' },
  validation: { passed: true, score: 91, issues: [] },
  internal_critique: { self_score: 91 },
  confidence: { overall: 0.86 },
  revisions: [],
  seedDefaults: { version: 'defaults@1.0.0', seeds: {} },
  provenance: {
    understanding: { promptVersion: 'understanding@1.0.0', model: 'claude-sonnet-4-5', usage: { input_tokens: 4000, output_tokens: 900 } },
    strategy: { promptVersion: 'strategy@1.0.0' },
    creative_director: { promptVersion: 'creative-director@1.0.0' },
    blueprint: { promptVersion: 'blueprint@1.0.0', model: 'claude-sonnet-4-5' },
    validation: { promptVersion: 'validator@1.0.0' },
    defaultsVersion: 'defaults@1.0.0',
  },
  rollup: { passed: true, score: 91, overall_confidence: 0.86, tokens: { input: 13000, output: 4800, total: 17800 }, latency_ms_total: 14700, overrides_detected: ['motion.intensity'] },
}
const MOBILE_REVIEW = { buildId: 'run_1', projectId: 'proj_1', viewport: 'mobile', scores: { overall: 5, layout: 4, images: 5, trust: 4, copy: 5 }, note: 'strong hero', reviewVersion: 4 }
const DESKTOP_REVIEW = { buildId: 'run_1', projectId: 'proj_1', viewport: 'desktop', scores: { overall: 2, layout: 2, images: 3, trust: 3, copy: 3 }, note: 'Layout & Design: nav feels cramped', reviewVersion: 4 }
const REVIEWS = { mobile: MOBILE_REVIEW, desktop: DESKTOP_REVIEW }
const PROJECT = { bizName: 'Amrit Palace', sourceUrl: 'https://amrit.example', htmlTemplate: '<img src="%%IMG:img_0%%"><img src="%%IMG:logo%%">', assetsById: { img_0: 'data:image/png;base64,AAA' }, refinedLogo: 'data:image/png;base64,LOGO', thumb: 'data:image/jpeg;base64,THUMB', imagesMeta: { aiCalls: 5 }, savedAt: '2026-07-07T00:01:00Z' }

test('substituteTokens replaces %%IMG%% with assets/ghl/logo', () => {
  const out = substituteTokens('<img src="%%IMG:img_0%%"><img src="%%IMG:logo%%">', { assetsById: { img_0: 'A' }, logoSrc: 'L' })
  assert.ok(out.includes('src="A"') && out.includes('src="L"'))
  const ghl = substituteTokens('%%IMG:img_0%%', { assetsById: { img_0: 'A' }, ghlUrls: { img_0: 'https://ghl/x' } })
  assert.equal(ghl, 'https://ghl/x') // GHL url wins
})

test('single artifact includes every required section', () => {
  const a = buildSingleArtifact({ cdo: CDO, reviews: REVIEWS, project: PROJECT, generatedAt: 'now' })
  assert.equal(a.artifact, 'velpi-cil-review-export')
  assert.equal(a.version, EXPORT_VERSION)
  assert.equal(a.instructions, SINGLE_INSTRUCTIONS)
  assert.equal(a.creative_directive.creative_direction.creative_thesis, 'candlelit love letter')
  assert.equal(a.validation.report.score, 91)
  assert.equal(a.defaults.seedDefaults.version, 'defaults@1.0.0')
  assert.deepEqual(a.overrides, ['motion.intensity'])
  assert.equal(a.metrics.rollup.total ?? a.metrics.rollup.tokens.total, 17800)
  assert.deepEqual(a.developer_review.mobile.scores, { overall: 5, layout: 4, images: 5, trust: 4, copy: 5 })
  assert.equal(a.developer_review.mobile.note, 'strong hero')
  assert.deepEqual(a.developer_review.desktop.scores, { overall: 2, layout: 2, images: 3, trust: 3, copy: 3 })
  assert.equal(a.prompt_versions.blueprint, 'blueprint@1.0.0')
  assert.equal(a.prompt_versions.defaults, 'defaults@1.0.0')
  assert.equal(a.build.tokens.total, 17800)
  assert.equal(a.security, 'contains no API keys, env vars, or secrets')
})

test('single artifact renders HTML + includes thumbnail', () => {
  const a = buildSingleArtifact({ cdo: CDO, reviews: REVIEWS, project: PROJECT })
  assert.ok(a.html.template.includes('%%IMG:img_0%%'))
  assert.ok(a.html.rendered.includes('data:image/png;base64,AAA')) // asset substituted
  assert.ok(a.html.rendered.includes('data:image/png;base64,LOGO')) // logo substituted
  assert.equal(a.screenshots.thumbnail_dataUri, 'data:image/jpeg;base64,THUMB')
})

test('single artifact tolerates missing project and missing reviews', () => {
  const a = buildSingleArtifact({ cdo: CDO, reviews: null, project: null })
  assert.equal(a.html, null)
  assert.equal(a.screenshots, null)
  assert.equal(a.developer_review, null)
  assert.equal(a.creative_directive.id, 'run_1')
})

test('single artifact tolerates only one viewport being rated', () => {
  const a = buildSingleArtifact({ cdo: CDO, reviews: { mobile: MOBILE_REVIEW, desktop: null }, project: null })
  assert.deepEqual(a.developer_review.mobile.scores, { overall: 5, layout: 4, images: 5, trust: 4, copy: 5 })
  assert.equal(a.developer_review.desktop, null)
})

test('single artifact contains no secret-looking fields', () => {
  const a = buildSingleArtifact({ cdo: CDO, reviews: REVIEWS, project: PROJECT })
  const s = JSON.stringify(a).toLowerCase()
  assert.ok(!s.includes('api_key') && !s.includes('apikey') && !s.includes('anthropic_api') && !s.includes('sk-'))
})

test('batch artifact summarizes runs + carries fleet metrics', () => {
  const rows = [{ directive: CDO, reviews: REVIEWS }, { directive: { ...CDO, id: 'run_2', businessName: 'B2' }, reviews: null }]
  const metrics = { n: 2, validator: { pass_rate_pct: 100 } }
  const a = buildBatchArtifact({ rows, metrics, selection: { limit: 50 }, generatedAt: 'now' })
  assert.equal(a.artifact, 'velpi-cil-review-batch')
  assert.equal(a.count, 2)
  assert.equal(a.instructions, BATCH_INSTRUCTIONS)
  assert.equal(a.fleet_metrics.n, 2)
  assert.equal(a.runs[0].directive_summary.thesis, 'candlelit love letter')
  assert.deepEqual(a.runs[0].developer_review.mobile.scores, { overall: 5, layout: 4, images: 5, trust: 4, copy: 5 })
  assert.deepEqual(a.runs[0].developer_review.desktop.scores, { overall: 2, layout: 2, images: 3, trust: 3, copy: 3 })
  assert.equal(a.runs[1].developer_review, null)
  assert.equal(a.runs[1].business, 'B2')
})

test('batch artifact excludes HTML by default', () => {
  const a = buildBatchArtifact({ rows: [{ directive: CDO, reviews: null }], metrics: {}, selection: {} })
  assert.ok(!('html' in a.runs[0]))
})
