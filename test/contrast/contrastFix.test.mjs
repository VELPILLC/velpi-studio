import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  findAndFixContrastIssues,
  parseColorRaw,
  contrastRatio,
} from '../../lib/contrastFix.mjs'

// Wrap a style block + body markup in the exact page shape the generator
// emits (single <style>, .velpi-page scoping).
const page = (css, body) => `<!DOCTYPE html>
<html><head><title>t</title><style>${css}</style></head>
<body><div class="velpi-page">${body}</div></body></html>`

const approx = (got, want, tol = 3) => Math.abs(got - want) <= tol

// ── modern color parsing (the same syntax family that broke html2canvas) ──

test('parses legacy hex/rgb/hsl', () => {
  assert.deepEqual(parseColorRaw('#fff'), [255, 255, 255, 1])
  assert.deepEqual(parseColorRaw('rgba(10, 20, 30, 0.4)'), [10, 20, 30, 0.4])
  const white = parseColorRaw('hsl(0, 0%, 100%)')
  assert.ok(approx(white[0], 255) && approx(white[1], 255) && approx(white[2], 255))
})

test('parses #rrggbbaa alpha hex', () => {
  const c = parseColorRaw('#00000080')
  assert.deepEqual(c.slice(0, 3), [0, 0, 0])
  assert.ok(Math.abs(c[3] - 0.502) < 0.01)
})

test('parses space-separated rgb()/hsl() with slash alpha', () => {
  assert.deepEqual(parseColorRaw('rgb(255 128 0 / 0.5)'), [255, 128, 0, 0.5])
  const c = parseColorRaw('hsl(120deg 50% 50% / 80%)')
  assert.ok(c && Math.abs(c[3] - 0.8) < 0.001)
})

test('parses color(srgb) and color(display-p3)', () => {
  assert.deepEqual(parseColorRaw('color(srgb 1 0 0)'), [255, 0, 0, 1])
  const c = parseColorRaw('color(display-p3 0 0 0 / 0.5)')
  assert.deepEqual(c, [0, 0, 0, 0.5])
})

test('parses oklch/oklab/lab endpoints', () => {
  const w = parseColorRaw('oklch(1 0 0)')
  assert.ok(approx(w[0], 255) && approx(w[1], 255) && approx(w[2], 255))
  const b = parseColorRaw('oklch(0 0 0)')
  assert.ok(approx(b[0], 0) && approx(b[1], 0) && approx(b[2], 0))
  const labW = parseColorRaw('lab(100 0 0)')
  assert.ok(approx(labW[0], 255) && approx(labW[1], 255) && approx(labW[2], 255))
})

test('parses hwb and color-mix', () => {
  const w = parseColorRaw('hwb(0 100% 0%)')
  assert.ok(approx(w[0], 255) && approx(w[1], 255) && approx(w[2], 255))
  const mix = parseColorRaw('color-mix(in srgb, #000000 50%, #ffffff)')
  assert.ok(approx(mix[0], 127.5, 2) && approx(mix[1], 127.5, 2))
})

test('unknown formats return null', () => {
  assert.equal(parseColorRaw('var(--x)'), null)
  assert.equal(parseColorRaw('linear-gradient(#000, #fff)'), null)
  assert.equal(parseColorRaw('currentcolor'), null)
})

// ── legacy regression: interactive element inheriting panel background ──

test('still fixes a failing link over an inherited solid panel background', () => {
  const html = page(
    `.velpi-page .panel { background: #0a1628; padding: 2rem; }
     .velpi-page .panel a { color: #123456; }`,
    `<section class="panel"><a href="tel:+15551234567" class="panel-link">Call now today</a></section>`
  )
  const res = findAndFixContrastIssues(html)
  const fix = res.fixes.find(f => f.selector.includes('panel-link'))
  assert.ok(fix, 'expected a fix for the failing link')
  assert.equal(fix.kind, 'recolor')
  assert.ok(fix.newRatio >= 4.5)
  assert.ok(res.html.includes('!important'))
  assert.ok(res.html.lastIndexOf('</style>') > res.html.indexOf(fix.selector))
})

// ── the two reported misses ──

test('hero eyebrow (small text) over weak photo scrim gets a shadow fix; large H1 passes at 3:1', () => {
  const html = page(
    `.velpi-page .hero { background: linear-gradient(rgba(10,10,10,0.45), rgba(10,10,10,0.45)), url('%%IMG:hero%%') center/cover; padding: 6rem 2rem; }
     .velpi-page .hero-eyebrow { color: #ffffff; font-size: 0.85rem; letter-spacing: 0.14em; }
     .velpi-page .hero-title { color: #ffffff; font-size: clamp(2.5rem, 5vw, 4rem); }`,
    `<section class="hero">
       <p class="hero-eyebrow">SERVING MUNDELEIN AND SURROUNDING AREAS</p>
       <h1 class="hero-title">Custom Stone And Outdoor Living</h1>
     </section>`
  )
  const res = findAndFixContrastIssues(html)
  const eyebrow = res.fixes.find(f => f.selector.includes('hero-eyebrow'))
  assert.ok(eyebrow, 'eyebrow over a 45% scrim must be flagged (worst-case photo)')
  assert.ok(eyebrow.kind === 'shadow' || eyebrow.kind === 'recolor+shadow')
  assert.ok(eyebrow.textShadow.includes('rgba(0,0,0'), 'light text gets a dark halo')
  const title = res.fixes.find(f => f.selector.includes('hero-title'))
  assert.equal(title, undefined, 'large hero title passes the 3:1 large-text threshold — design preserved')
})

test('muted section intro over an opaque tinted band gets a deterministic recolor', () => {
  const html = page(
    `.velpi-page .process { background: linear-gradient(180deg, #ece5da, #e2d9cb); padding: 4rem; }
     .velpi-page .process-intro { color: #b8b0a4; font-size: 1.05rem; max-width: 60ch; }`,
    `<section class="process"><p class="process-intro">From your first idea to final installation, we handle everything.</p></section>`
  )
  const res = findAndFixContrastIssues(html)
  const fix = res.fixes.find(f => f.selector === '.velpi-page .process .process-intro')
  assert.ok(fix, 'intro text over tinted band must be flagged')
  assert.equal(fix.kind, 'recolor')
  assert.ok(fix.newRatio >= 4.5, `recolor passes every gradient stop (got ${fix.newRatio})`)
})

// ── non-interactive coverage via inheritance ──

test('plain paragraph inheriting page ink over a dark band is caught and fixed', () => {
  const html = page(
    `.velpi-page { color: #222222; background: #ffffff; }
     .velpi-page .band { background: #14181d; padding: 3rem; }`,
    `<section class="band"><p>Plain inherited paragraph text sitting on a dark band</p></section>`
  )
  const res = findAndFixContrastIssues(html)
  const fix = res.fixes.find(f => f.selector === '.velpi-page .band > p')
  assert.ok(fix, 'inherited-color paragraph must be flagged (old version skipped no-own-color text)')
  assert.equal(fix.kind, 'recolor')
  assert.ok(fix.newRatio >= 4.5)
})

// ── backdrops the old version bailed on ──

test('strong translucent tint band over an image passes without a fix', () => {
  const html = page(
    `.velpi-page .gallery { background: url('%%IMG:g1%%') center/cover; }
     .velpi-page .quote-band { background: rgba(12,18,24,0.85); padding: 2rem; }
     .velpi-page .quote-band p { color: #ffffff; font-size: 1rem; }`,
    `<section class="gallery"><div class="quote-band"><p>Every project starts with listening carefully.</p></div></section>`
  )
  const res = findAndFixContrastIssues(html)
  assert.equal(res.fixes.length, 0, 'an 85% tint over any photo already guarantees contrast')
})

test('full-cover ::before scrim is recognized as a real scrim', () => {
  const html = page(
    `.velpi-page .cta { position: relative; background: url('%%IMG:cta%%') center/cover; }
     .velpi-page .cta::before { content: ''; position: absolute; inset: 0; background: rgba(8,8,8,0.7); }
     .velpi-page .cta h2 { position: relative; color: #ffffff; font-size: 1rem; }`,
    `<section class="cta"><h2>Ready to start your project with us</h2></section>`
  )
  const res = findAndFixContrastIssues(html)
  assert.equal(res.fixes.length, 0, '70% pseudo-element scrim over any photo passes worst-case')
})

test('bare photo with no scrim under small text gets flagged', () => {
  const html = page(
    `.velpi-page .banner { background: url('%%IMG:b1%%') center/cover; padding: 4rem; }
     .velpi-page .banner p { color: #ffffff; font-size: 1rem; }`,
    `<section class="banner"><p class="banner-note">Family owned and operated since 1998</p></section>`
  )
  const res = findAndFixContrastIssues(html)
  const fix = res.fixes.find(f => f.selector.includes('banner-note'))
  assert.ok(fix, 'unscrimmed photo text is never verifiable — must be fixed')
  assert.ok(fix.textShadow, 'fix is a paint-only halo')
})

// ── scope-aware custom properties ──

test('a section-scoped --ink redefinition produces no false positive', () => {
  const html = page(
    `.velpi-page { --ink: #1a1a1a; color: var(--ink); background: #ffffff; }
     .velpi-page .dark { --ink: #f5f5f5; background: #101418; padding: 3rem; }
     .velpi-page .dark p { color: var(--ink); font-size: 1rem; }`,
    `<section class="dark"><p>Light ink resolved from the section scope</p></section>`
  )
  const res = findAndFixContrastIssues(html)
  assert.equal(res.fixes.length, 0, 'scoped var must resolve to the section value, not the page value')
})

test('var() fallback with nested parens resolves cleanly', () => {
  const c = parseColorRaw('#123456')
  assert.ok(c)
  const html = page(
    `.velpi-page .x { background: var(--missing, rgba(0,0,0,0.9)); padding: 1rem; }
     .velpi-page .x p { color: #ffffff; font-size: 1rem; }`,
    `<section class="x"><p>Fallback scrim should read as ninety percent black</p></section>`
  )
  const res = findAndFixContrastIssues(html)
  assert.equal(res.fixes.length, 0, 'white on rgba(0,0,0,.9)-over-white composite passes')
})

// ── skip rules ──

test('display:none and hover-state rules are ignored', () => {
  const html = page(
    `.velpi-page { background: #ffffff; color: #1a1a1a; }
     .velpi-page .ghost { display: none; color: #eeeeee; }
     .velpi-page .btn { background: #0a1628; color: #ffffff; padding: 1rem; }
     .velpi-page .btn:hover { color: #0a1628; }`,
    `<section class="s"><span class="ghost">invisible text here</span><a class="btn" href="tel:+15550000000">Call the team</a></section>`
  )
  const res = findAndFixContrastIssues(html)
  assert.equal(res.fixes.length, 0, 'hidden text skipped; hover rule must not shadow the base state')
})

test('modern color syntax in generated declarations is understood, not skipped', () => {
  const html = page(
    `.velpi-page .m { background: color(srgb 1 1 1); padding: 2rem; }
     .velpi-page .m p { color: oklch(0.95 0 0); font-size: 1rem; }`,
    `<section class="m"><p>Nearly white text on a white surface fails loudly</p></section>`
  )
  const res = findAndFixContrastIssues(html)
  assert.ok(res.fixes.length === 1, 'oklch near-white on color(srgb) white must be caught')
  assert.equal(res.fixes[0].kind, 'recolor')
})

// ── fix emission ──

test('override block lands inside the style tag with !important', () => {
  const html = page(
    `.velpi-page .p { background: #ffffff; }
     .velpi-page .p a { color: #dddddd; }`,
    `<div class="p"><a class="lnk" href="mailto:hi@x.com">Email us now</a></div>`
  )
  const res = findAndFixContrastIssues(html)
  assert.ok(res.fixes.length >= 1)
  const block = res.html.slice(res.html.indexOf('/* velpi: server-enforced text contrast fix */'))
  assert.ok(block.includes('!important'))
  assert.ok(block.indexOf('</style>') > 0, 'block sits before the closing style tag')
})

test('contrastRatio matches known WCAG anchors', () => {
  assert.ok(Math.abs(contrastRatio([0, 0, 0], [255, 255, 255]) - 21) < 0.01)
  assert.ok(Math.abs(contrastRatio([119, 119, 119], [255, 255, 255]) - 4.48) < 0.05)
})
