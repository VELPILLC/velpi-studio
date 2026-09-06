import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyRole, detectOverlaps, buildOverlapFixes, renderCssOverrideBlock } from '../../lib/geometryFix.mjs'

// Minimal synthetic node builder — mirrors lib/geometryProbe.js's shape
// without needing a real browser.
function node(vid, { parentVid = null, tag = 'div', classes = [], sectionClass = null, rect, opacity = 1, position = 'static', hasText = true, ariaHidden = false } = {}) {
  return { vid, parentVid, tag, classes, sectionClass, rect, opacity, position, hasText, ariaHidden, pointerEvents: 'auto' }
}

const rect = (top, left, width, height) => ({ top, left, right: left + width, bottom: top + height, width, height })

test('classifyRole: faint absolutely-positioned numeral is decorative', () => {
  const n = node('v1', { classes: ['section-numeral'], opacity: 0.1, position: 'absolute' })
  assert.equal(classifyRole(n), 'decorative')
})

test('classifyRole: a numeral-named element is decorative by role regardless of its current opacity', () => {
  // classifyRole answers "what KIND of element is this" (so a fix knows which
  // side of an overlap to demote) — whether an overlap is actually a BUG is
  // a separate, opacity-weighted question decided in detectOverlaps below.
  const n = node('v1', { classes: ['section-numeral'], opacity: 1, position: 'absolute' })
  assert.equal(classifyRole(n), 'decorative')
})

test('classifyRole: opaque absolute element with no decorative naming is content', () => {
  const n = node('v1', { classes: ['badge'], opacity: 1, position: 'absolute' })
  assert.equal(classifyRole(n), 'content')
})

test('classifyRole: aria-hidden is always decorative', () => {
  const n = node('v1', { classes: ['x'], opacity: 1, position: 'static', ariaHidden: true })
  assert.equal(classifyRole(n), 'decorative')
})

test('a legitimately faint ghost element behind readable text is NOT flagged', () => {
  const ghost = node('v1', { classes: ['ghost-numeral'], rect: rect(0, 0, 300, 300), opacity: 0.08, position: 'absolute' })
  const heading = node('v2', { classes: ['specials-title'], rect: rect(50, 50, 200, 40), tag: 'h2' })
  const overlaps = detectOverlaps([ghost, heading])
  assert.equal(overlaps.length, 0, 'faint ghost numeral behind readable heading is craft, not a bug')
})

test('a high-opacity decorative numeral overlapping real text IS flagged and patched (the reported bug)', () => {
  const numeral = node('v1', { classes: ['section-numeral'], rect: rect(0, 0, 300, 300), opacity: 0.9, position: 'absolute' })
  const specials = node('v2', { classes: ['specials-list'], rect: rect(50, 50, 250, 200), tag: 'ul' })
  const overlaps = detectOverlaps([numeral, specials])
  assert.equal(overlaps.length, 1)
  assert.equal(overlaps[0].kind, 'decorative-over-content')
  assert.equal(overlaps[0].decorativeVid, 'v1')

  const { fixes, escalate } = buildOverlapFixes(overlaps, { v1: numeral, v2: specials })
  assert.equal(escalate.length, 0)
  assert.equal(fixes.length, 1)
  assert.equal(fixes[0].selector, '.velpi-page .section-numeral')
  assert.match(fixes[0].css, /opacity: 0\.12 !important/)
  assert.match(fixes[0].css, /pointer-events: none !important/)

  const block = renderCssOverrideBlock(fixes)
  assert.ok(block.includes(fixes[0].selector))
  assert.ok(block.includes('!important'))
})

test('two real content elements overlapping always escalates — never silently auto-fixed', () => {
  const a = node('v1', { classes: ['hero-title'], rect: rect(0, 0, 300, 100), tag: 'h1' })
  const b = node('v2', { classes: ['hero-subtitle'], rect: rect(20, 20, 280, 90), tag: 'p' })
  const overlaps = detectOverlaps([a, b])
  assert.equal(overlaps.length, 1)
  assert.equal(overlaps[0].kind, 'content-content')

  const { fixes, escalate } = buildOverlapFixes(overlaps, { v1: a, v2: b })
  assert.equal(fixes.length, 0, 'content-content collisions never get an automatic CSS patch')
  assert.equal(escalate.length, 1)
})

test('two decorative elements overlapping each other is ignored', () => {
  const a = node('v1', { classes: ['ghost-numeral'], rect: rect(0, 0, 200, 200), opacity: 0.1, position: 'absolute' })
  const b = node('v2', { classes: ['watermark-word'], rect: rect(10, 10, 200, 200), opacity: 0.1, position: 'absolute' })
  assert.equal(detectOverlaps([a, b]).length, 0)
})

test('a parent and its own child never count as an overlap', () => {
  const section = node('v1', { classes: ['hero'], rect: rect(0, 0, 500, 400), tag: 'section' })
  const heading = node('v2', { parentVid: 'v1', classes: ['hero-title'], rect: rect(50, 50, 300, 80), tag: 'h1' })
  assert.equal(detectOverlaps([section, heading]).length, 0, 'normal nesting is not a collision bug')
})

test('overlap below the minimum area or weight threshold is not flagged', () => {
  const numeral = node('v1', { classes: ['section-numeral'], rect: rect(0, 0, 300, 300), opacity: 1, position: 'absolute' })
  const text = node('v2', { classes: ['specials-list'], rect: rect(290, 290, 250, 200), tag: 'ul' }) // tiny corner clip only
  assert.equal(detectOverlaps([numeral, text]).length, 0)
})

test('buildOverlapFixes escalates when no durable selector can be built', () => {
  const numeral = node('v1', { classes: [], sectionClass: null, tag: 'div', rect: rect(0, 0, 300, 300), opacity: 1, position: 'absolute' })
  const text = node('v2', { classes: ['specials-list'], rect: rect(50, 50, 250, 200), tag: 'ul' })
  const overlaps = detectOverlaps([numeral, text])
  assert.equal(overlaps.length, 1)
  const { fixes, escalate } = buildOverlapFixes(overlaps, { v1: numeral, v2: text })
  assert.equal(fixes.length, 0)
  assert.equal(escalate.length, 1)
})

test('renderCssOverrideBlock returns empty string for no fixes', () => {
  assert.equal(renderCssOverrideBlock([]), '')
})

// ── pages that carry JavaScript ──

test('a scroll-reveal element parked at opacity:0 is not a collision', () => {
  // Generated pages now open with reveal targets at opacity:0 until they
  // enter the viewport. They are invisible, cannot collide with anything a
  // visitor sees, and "fixing" them would bake a permanent override.
  const hidden = node('v1', { classes: ['reveal'], rect: rect(0, 0, 400, 200), opacity: 0, tag: 'h2' })
  const real = node('v2', { classes: ['hero-copy'], rect: rect(20, 20, 360, 160), tag: 'p' })
  assert.equal(detectOverlaps([hidden, real]).length, 0)
})

test('the same pair IS flagged once the reveal has played', () => {
  // Same geometry, now visible — proves the opacity rule is what suppressed
  // it, not the shapes.
  const shown = node('v1', { classes: ['reveal'], rect: rect(0, 0, 400, 200), opacity: 1, tag: 'h2' })
  const real = node('v2', { classes: ['hero-copy'], rect: rect(20, 20, 360, 160), tag: 'p' })
  assert.equal(detectOverlaps([shown, real]).length, 1)
})

test('a WebGL canvas measured at real size behaves like any content element', () => {
  // The old probe never ran scripts, so a canvas reported its default
  // 300x150 and overlap maths were computed against a phantom box.
  const canvas = node('v1', { tag: 'canvas', classes: ['hero-gl'], rect: rect(0, 0, 1440, 800), hasText: false })
  const numeral = node('v2', { classes: ['section-numeral'], rect: rect(40, 40, 300, 300), opacity: 0.9, position: 'absolute' })
  // canvas isn't text/img/svg, so it is not content-bearing on its own —
  // the decorative numeral over it is not a text-legibility problem.
  assert.equal(detectOverlaps([canvas, numeral]).length, 0)
})
