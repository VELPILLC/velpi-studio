// Creative Director Review — engine orchestration tests (fake judges, no network).
// Run: npm run test:director

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { runDirectorReview } from '../../lib/director/engine.mjs'
import { CONTENT_CATEGORIES, VISION_CATEGORIES } from '../../lib/director/prompts.mjs'

const PAGE = `<html lang="en"><head><title>Mr. Heatmizer — HVAC Repair in Austin</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Emergency heating and cooling repair by licensed technicians. Same-day service across Austin with honest pricing and a satisfaction guarantee.">
<style>.velpi-page{background:#ffffff;color:#1c1a17}.velpi-page .hero{background-color:#0d1b2a;color:#ffffff}</style>
</head><body><div class="velpi-page">
<nav><a href="#services">Services</a></nav>
<h1>Same-Day HVAC Repair, Done Right</h1>
<p>Patrick and Nick have fixed 4,000+ Austin furnaces since 1994.</p>
<a class="btn" href="tel:+15125550100">Call (512) 555-0100</a>
<h2>Our Services</h2><img src="f.jpg" alt="Technician servicing a furnace">
<footer>© Mr. Heatmizer</footer>
</div></body></html>`

// A fake content judge that quotes REAL page text for most categories and
// fabricates evidence for one (to prove the verification gate voids it).
function fakeContentJudge() {
  const good = (score, quote) => ({
    score,
    explanation: 'test',
    evidence: [quote],
    deductions: score < 95 ? ['minor gap'] : [],
    recommendations: score < 95 ? [{ fix: 'tighten it', refinement_prompt: 'Tighten the hero copy.', impact: { level: 'medium', rationale: 'clarity' } }] : [],
  })
  const out = {}
  for (const c of CONTENT_CATEGORIES) out[c] = good(88, 'Same-Day HVAC Repair, Done Right')
  out.headline_quality = good(92, 'Same-Day HVAC Repair, Done Right')
  out.social_proof = good(85, 'fixed 4,000+ Austin furnaces since 1994')
  out.trust_signals = good(90, 'licensed technicians') // in meta description — still on page
  out.generic_ai_copy = { score: 40, explanation: 'fabricated', evidence: ['Elevate your comfort experience today'], deductions: ['x'], recommendations: [] } // NOT in page → must be voided
  out.navigation = { status: 'not_evaluated', reason: 'single anchor only' } // judge declines honestly
  return out
}

function fakeVisionJudge() {
  const cat = score => ({
    score, explanation: 'visible in screenshot',
    evidence: ['hero headline dominates top third with strong contrast'],
    deductions: [], recommendations: [],
  })
  return {
    visual_hierarchy: cat(87), layout: cat(84), spacing: cat(82),
    color_usage: cat(90), typography: cat(88),
    mobile_responsiveness: cat(80),
  }
}

const PNG_1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

test('full run: deterministic + content + vision, evidence gate voids fabricated category', async () => {
  const review = await runDirectorReview({
    html: PAGE,
    businessName: 'Mr. Heatmizer',
    screenshots: { desktop: PNG_1x1, mobile: PNG_1x1 },
    judges: { content: async () => fakeContentJudge(), vision: async () => fakeVisionJudge() },
  })

  // Deterministic categories always evaluated with real measurements.
  assert.equal(review.categories.accessibility.status, 'evaluated')
  assert.equal(review.categories.seo.status, 'evaluated')
  assert.ok(review.categories.seo.score >= 85)

  // Content categories: real-quote ones evaluated…
  assert.equal(review.categories.headline_quality.status, 'evaluated')
  assert.equal(review.categories.headline_quality.evidence_verified, true)
  // …fabricated-evidence one VOIDED by the gate.
  assert.equal(review.categories.generic_ai_copy.status, 'not_evaluated')
  assert.match(review.categories.generic_ai_copy.reason, /evidence could not be verified/)
  assert.ok(review.evidence_verification.voided_categories.includes('generic_ai_copy'))
  // …judge-declined one honest.
  assert.equal(review.categories.navigation.status, 'not_evaluated')

  // Vision categories evaluated from the provided screenshots.
  for (const v of VISION_CATEGORIES) assert.equal(review.categories[v].status, 'evaluated')
  assert.equal(review.categories.mobile_responsiveness.status, 'evaluated')
  assert.match(review.categories.mobile_responsiveness.method, /mobile \(375px viewport\)/)

  // Overall = mean of evaluated only, formula shown.
  assert.equal(review.overall.status, 'evaluated')
  assert.ok(review.overall.evidence[0].startsWith('Formula:'))

  // All 22 categories present (the spec's 21 + generic_ai_copy detection).
  assert.equal(Object.keys(review.categories).length, 22)
})

test('no screenshots → all 6 visual categories not_evaluated, never inferred', async () => {
  const review = await runDirectorReview({
    html: PAGE,
    judges: { content: async () => fakeContentJudge(), vision: async () => { throw new Error('should not be called') } },
  })
  for (const v of VISION_CATEGORIES) {
    assert.equal(review.categories[v].status, 'not_evaluated')
    assert.match(review.categories[v].reason, /no rendered screenshot/)
  }
  assert.equal(review.categories.mobile_responsiveness.status, 'not_evaluated')
  assert.match(review.categories.mobile_responsiveness.reason, /never inferred from desktop CSS/)
  // overall still computed from what WAS evaluated
  assert.equal(review.overall.status, 'evaluated')
})

test('desktop-only screenshot → visual evaluated, mobile still not_evaluated', async () => {
  const review = await runDirectorReview({
    html: PAGE,
    screenshots: { desktop: PNG_1x1 },
    judges: { content: async () => fakeContentJudge(), vision: async () => fakeVisionJudge() },
  })
  assert.equal(review.categories.layout.status, 'evaluated')
  assert.equal(review.categories.mobile_responsiveness.status, 'not_evaluated')
})

test('judge failure degrades those categories honestly, deterministic ones survive', async () => {
  const review = await runDirectorReview({
    html: PAGE,
    screenshots: { desktop: PNG_1x1 },
    judges: {
      content: async () => { throw new Error('model down') },
      vision: async () => { throw new Error('model down') },
    },
  })
  assert.equal(review.categories.hero_section.status, 'not_evaluated')
  assert.match(review.categories.hero_section.reason, /content judge call failed: model down/)
  assert.equal(review.categories.layout.status, 'not_evaluated')
  assert.equal(review.categories.accessibility.status, 'evaluated') // measurement never depends on a model
  assert.equal(review.categories.seo.status, 'evaluated')
  assert.equal(review.overall.status, 'evaluated')
})

test('no judges wired → content/vision not_evaluated with "no verification method"', async () => {
  const review = await runDirectorReview({ html: PAGE, judges: {} })
  assert.match(review.categories.copywriting.reason, /no verification method implemented/)
  assert.match(review.categories.visual_hierarchy.reason, /no rendered screenshot|no verification method/)
  assert.equal(review.categories.accessibility.status, 'evaluated')
})

test('partial evidence: unverifiable quotes discarded, verified ones kept, flag = partial', async () => {
  const judge = () => ({
    hero_section: {
      score: 90, explanation: 'x',
      evidence: ['Same-Day HVAC Repair, Done Right', 'This sentence is not on the page at all'],
      deductions: [], recommendations: [],
    },
  })
  const review = await runDirectorReview({ html: PAGE, judges: { content: async () => judge() } })
  const hero = review.categories.hero_section
  assert.equal(hero.status, 'evaluated')
  assert.equal(hero.evidence.length, 1)
  assert.equal(hero.evidence_verified, 'partial')
  assert.ok(hero.deductions.some(d => d.includes('unverifiable quote')))
})

test('priorities are impact-sorted and every entry carries a refinement prompt', async () => {
  const review = await runDirectorReview({
    html: '<html><body><h2>weak page with no title meta or alt</h2><img src="x.png"><p>call (512) 555-0100</p></body></html>',
    judges: {},
  })
  assert.ok(review.priorities.length >= 3)
  const ranks = { high: 3, medium: 2, low: 1 }
  for (let i = 1; i < review.priorities.length; i++) {
    assert.ok(ranks[review.priorities[i - 1].impact] >= ranks[review.priorities[i].impact], 'sorted by impact desc')
  }
  assert.ok(review.priorities.every(p => typeof p.refinement_prompt === 'string' && p.refinement_prompt.length > 10))
})

test('method_summary partitions all 22 categories', async () => {
  const review = await runDirectorReview({ html: PAGE, judges: {} })
  const total = review.method_summary.evaluated.length + review.method_summary.not_evaluated.length
  assert.equal(total, 22)
})
