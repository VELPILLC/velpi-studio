// Creative Director Review — deterministic checks tests. Pure, no network.
// Run: npm run test:director

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  gradeFor, parseColor, contrastRatio, stripDataUris,
  extractCssRules, checkContrast, checkHeadings, checkAltText,
  checkSeoFacts, checkConversionFacts, collectFacts,
  buildAccessibilityCategory, buildSeoCategory,
  verifyEvidence, aggregateOverall, prioritize, notEvaluated,
} from '../../lib/director/checks.mjs'

// ── grades ────────────────────────────────────────────────────────────────────
test('gradeFor maps boundaries correctly', () => {
  assert.equal(gradeFor(100), 'A+')
  assert.equal(gradeFor(97), 'A+')
  assert.equal(gradeFor(96), 'A')
  assert.equal(gradeFor(90), 'A-')
  assert.equal(gradeFor(89), 'B+')
  assert.equal(gradeFor(83), 'B')
  assert.equal(gradeFor(80), 'B-')
  assert.equal(gradeFor(73), 'C')
  assert.equal(gradeFor(60), 'D-')
  assert.equal(gradeFor(59), 'F')
  assert.equal(gradeFor(null), null)
})

// ── color math (known WCAG values) ───────────────────────────────────────────
test('contrastRatio: black on white = 21:1; #777 on white fails AA; #757575 passes', () => {
  const white = parseColor('#ffffff')
  assert.equal(Math.round(contrastRatio(parseColor('#000'), white)), 21)
  const c777 = contrastRatio(parseColor('#777777'), white)
  assert.ok(c777 < 4.5 && c777 > 4.4, `#777 on white ≈ 4.48, got ${c777}`)
  const c757 = contrastRatio(parseColor('#757575'), white)
  assert.ok(c757 >= 4.5, `#757575 on white ≥ 4.6, got ${c757}`)
})

test('parseColor: hex3, hex6, rgb, named; refuses translucent rgba', () => {
  assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255 })
  assert.deepEqual(parseColor('#0a0B0c'), { r: 10, g: 11, b: 12 })
  assert.deepEqual(parseColor('rgb(1, 2, 3)'), { r: 1, g: 2, b: 3 })
  assert.deepEqual(parseColor('white'), { r: 255, g: 255, b: 255 })
  assert.equal(parseColor('rgba(0,0,0,0.5)'), null) // backdrop unknown — no guess
  assert.equal(parseColor('var(--ink)'), null)
})

// ── css rule extraction + contrast pairs ─────────────────────────────────────
const CSS_HTML = `<html><head><style>
.velpi-page { background: #ffffff; color: #757575; }
.velpi-page .hero { background-color: #0d1b2a; color: #ffffff; }
.velpi-page .bad { background: #f5f5f5; color: #ffffff; }
.velpi-page .grad { background: linear-gradient(#000, #fff); color: #fff; }
@media (min-width: 768px) { .velpi-page .inner { background: #000; color: #eee; } }
</style></head><body></body></html>`

test('extractCssRules finds same-rule color/background pairs, skips gradients', () => {
  const rules = extractCssRules(CSS_HTML)
  const bySel = Object.fromEntries(rules.map(r => [r.selector, r]))
  assert.equal(bySel['.velpi-page'].background, '#ffffff')
  assert.equal(bySel['.velpi-page .hero'].background, '#0d1b2a')
  assert.equal(bySel['.velpi-page .grad'].background, null) // gradient — unmeasurable
  assert.ok(bySel['.velpi-page .inner'], 'rule inside @media is still found')
})

test('checkContrast measures real ratios and flags failures', () => {
  const r = checkContrast(CSS_HTML)
  assert.ok(r.measured >= 3)
  const bad = r.pairs.find(p => p.selector.includes('.bad'))
  assert.equal(bad.passesAA, false)
  assert.ok(bad.ratio < 1.2, 'white on #f5f5f5 ≈ 1.07')
  const hero = r.pairs.find(p => p.selector.includes('.hero'))
  assert.equal(hero.passesAA, true)
  assert.ok(r.failing.some(f => f.selector.includes('.bad')))
})

// ── headings / alt / seo / conversion ────────────────────────────────────────
test('checkHeadings: counts h1s and detects level jumps', () => {
  const r = checkHeadings('<h1>A</h1><h2>B</h2><h4>C</h4><h2>D</h2>')
  assert.equal(r.h1Count, 1)
  assert.deepEqual(r.sequence, [1, 2, 4, 2])
  assert.equal(r.jumps.length, 1)
  assert.match(r.jumps[0], /h2 → h4/)
  assert.equal(checkHeadings('<h2>no h1</h2>').h1Count, 0)
})

test('checkAltText: coverage and missing snippets', () => {
  const r = checkAltText('<img src="a.png" alt="Team photo"><img src="b.png"><img src="c.png" alt="">')
  assert.equal(r.total, 3)
  assert.equal(r.withAlt, 1)
  assert.equal(r.missing.length, 2)
})

test('checkSeoFacts: title, description, viewport, landmarks', () => {
  const html = `<html lang="en"><head><title>Mr. Heatmizer — HVAC in Austin</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="24/7 heating and cooling repair by licensed techs in Austin, TX. Same-day service, honest pricing, 30 years of experience.">
    </head><body><nav>x</nav><footer>y</footer></body></html>`
  const s = checkSeoFacts(html)
  assert.equal(s.title, 'Mr. Heatmizer — HVAC in Austin')
  assert.ok(s.titleLength > 10 && s.titleLength < 65)
  assert.ok(s.metaDescription.startsWith('24/7'))
  assert.equal(s.viewport, true)
  assert.equal(s.nav, true)
  assert.equal(s.footer, true)
  assert.equal(s.lang, true)
  const none = checkSeoFacts('<html><body></body></html>')
  assert.equal(none.title, null)
  assert.equal(none.viewport, false)
})

test('checkConversionFacts: tel links, phone-without-tel, tokens, CTAs', () => {
  const withTel = checkConversionFacts('<a href="tel:+15125551234" class="btn">Call (512) 555-1234</a>')
  assert.equal(withTel.telLinks, 1)
  assert.equal(withTel.phoneWithoutTelLink, false)
  assert.ok(withTel.ctaCandidates >= 1)

  const withoutTel = checkConversionFacts('<p>Call us at (512) 555-1234 today</p>')
  assert.equal(withoutTel.telLinks, 0)
  assert.deepEqual(withoutTel.phoneTexts, ['(512) 555-1234'])
  assert.equal(withoutTel.phoneWithoutTelLink, true)

  const tokens = checkConversionFacts('<img src="%%IMG:img_1%%">')
  assert.equal(tokens.leftoverTokens, 1)
})

// ── deterministic categories ─────────────────────────────────────────────────
const GOOD_PAGE = `<html lang="en"><head><title>Good Biz — Plumbing in Denver</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Licensed Denver plumbers with same-day service, upfront pricing, and a 5-star record across 200+ local reviews. Call now for a free estimate.">
<meta property="og:title" content="Good Biz">
<style>.velpi-page{background:#ffffff;color:#1a1a1a}</style></head>
<body><div class="velpi-page"><nav>n</nav><h1>Denver Plumbing</h1><h2>Services</h2>
<img src="x.jpg" alt="Plumber fixing a sink"><a href="tel:+13035550000" class="btn">Call</a>
<footer>f</footer></div></body></html>`

test('accessibility category: clean page scores high with measured evidence', () => {
  const cat = buildAccessibilityCategory(collectFacts(GOOD_PAGE))
  assert.equal(cat.status, 'evaluated')
  assert.ok(cat.score >= 95, `expected >=95, got ${cat.score}`)
  assert.ok(cat.evidence.some(e => e.includes('pairs measured')))
  assert.ok(cat.evidence.some(e => e.includes('Viewport meta tag: present')))
  assert.equal(cat.evidence_verified, true)
})

test('accessibility category: contrast failure + missing alt + no h1 all deduct with evidence', () => {
  const bad = `<html><head><style>.x{background:#eeeeee;color:#ffffff}</style></head>
    <body><h2>No h1</h2><img src="a.png"></body></html>`
  const cat = buildAccessibilityCategory(collectFacts(bad))
  assert.ok(cat.score < 60, `expected heavy deductions, got ${cat.score}`)
  assert.ok(cat.deductions.some(d => d.includes('ratio') && d.includes('4.5')))
  assert.ok(cat.deductions.some(d => d.includes('alt')))
  assert.ok(cat.deductions.some(d => d.includes('no <h1>')))
  assert.ok(cat.deductions.some(d => d.includes('viewport')))
  assert.ok(cat.recommendations.length >= 3)
  assert.ok(cat.recommendations.every(r => r.refinement_prompt && r.impact.level))
})

test('seo category: missing title/description deduct; clean page passes', () => {
  const good = buildSeoCategory(collectFacts(GOOD_PAGE))
  assert.ok(good.score >= 90, `got ${good.score}`)
  const bare = buildSeoCategory(collectFacts('<html><body><div>hello world content</div></body></html>'))
  assert.ok(bare.score <= 40, `got ${bare.score}`)
  assert.ok(bare.deductions.some(d => d.includes('<title>')))
  assert.ok(bare.deductions.some(d => d.includes('meta description')))
})

// ── evidence verification gate ───────────────────────────────────────────────
test('verifyEvidence: exact quote passes, whitespace-normalized passes, fabricated fails', () => {
  const html = '<div class="velpi-page"><h1>Denver’s   Most Trusted\n Plumbers</h1></div>'
  const { verified, failed } = verifyEvidence(html, [
    'Denver’s Most Trusted Plumbers',        // whitespace-normalized match
    'Denver’s   Most Trusted',               // raw with extra spaces
    'The best plumbing team in Colorado',    // fabricated — not in page
    'short',                                 // too short to count as evidence
  ])
  assert.equal(verified.length, 2)
  assert.equal(failed.length, 2)
})

test('verifyEvidence matches against data-uri-stripped page (what the judge saw)', () => {
  const html = `<img src="data:image/png;base64,${'A'.repeat(200)}"><p>Real page copy here</p>`
  const { verified } = verifyEvidence(html, ['Real page copy here'])
  assert.equal(verified.length, 1)
})

// ── aggregation + priorities + not_evaluated ─────────────────────────────────
test('aggregateOverall: mean of evaluated only; ignores not_evaluated', () => {
  const cats = {
    a: { status: 'evaluated', score: 90 },
    b: { status: 'evaluated', score: 70 },
    c: notEvaluated('no method'),
  }
  const o = aggregateOverall(cats)
  assert.equal(o.score, 80)
  assert.equal(o.grade, 'B-')
  assert.ok(o.evidence[0].includes('a:90'))
  const none = aggregateOverall({ x: notEvaluated('nope') })
  assert.equal(none.status, 'not_evaluated')
  assert.equal(none.score, null)
})

test('prioritize: high impact first, then lower score first; capped', () => {
  const cats = {
    seo: { status: 'evaluated', score: 85, recommendations: [{ fix: 'f1', refinement_prompt: 'p1', impact: { level: 'medium', rationale: '' } }] },
    accessibility: { status: 'evaluated', score: 55, recommendations: [{ fix: 'f2', refinement_prompt: 'p2', impact: { level: 'high', rationale: '' } }] },
    copywriting: { status: 'evaluated', score: 70, recommendations: [{ fix: 'f3', refinement_prompt: 'p3', impact: { level: 'high', rationale: '' } }] },
    skipped: notEvaluated('x'),
  }
  const p = prioritize(cats)
  assert.deepEqual(p.map(x => x.fix), ['f2', 'f3', 'f1']) // high(55) → high(70) → medium
  assert.ok(p.every(x => x.refinement_prompt))
})

test('stripDataUris replaces base64 blobs but keeps short srcs', () => {
  const html = `<img src="data:image/png;base64,${'B'.repeat(500)}"><img src="logo.png">`
  const out = stripDataUris(html)
  assert.ok(out.includes('[image-data]'))
  assert.ok(!out.includes('B'.repeat(100)))
  assert.ok(out.includes('logo.png'))
})

test('notEvaluated carries the honest reason and null score', () => {
  const n = notEvaluated('no verification method implemented')
  assert.equal(n.status, 'not_evaluated')
  assert.equal(n.score, null)
  assert.equal(n.grade, null)
  assert.match(n.reason, /no verification method/)
})
