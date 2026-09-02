import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  MOBILE_UTILITIES_CSS,
  MOBILE_UTILITY_CLASSES,
  MOBILE_BREAKPOINT_MAX,
  MOBILE_BREAKPOINT_MIN,
} from '../../lib/mobileUtilities.mjs'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const readRoute = p => readFileSync(join(repo, 'app', 'api', p, 'route.js'), 'utf8')

test('every utility class is defined, .velpi-page-scoped, and forced', () => {
  for (const cls of MOBILE_UTILITY_CLASSES) {
    const rule = new RegExp(`\\.velpi-page \\.${cls}\\s*\\{[^}]*!important`)
    assert.ok(rule.test(MOBILE_UTILITIES_CSS), `${cls} must be scoped and use !important`)
  }
})

test('breakpoints are the fixed 767/768 pair, not per-generation invention', () => {
  assert.ok(MOBILE_UTILITIES_CSS.includes(`@media (max-width: ${MOBILE_BREAKPOINT_MAX}px)`))
  assert.ok(MOBILE_UTILITIES_CSS.includes(`@media (min-width: ${MOBILE_BREAKPOINT_MIN}px)`))
  assert.equal(MOBILE_BREAKPOINT_MIN - MOBILE_BREAKPOINT_MAX, 1, 'no gap or overlap between the two ranges')
})

test('hide-mobile is declared after stack-mobile so hiding wins on a shared element', () => {
  const stack = MOBILE_UTILITIES_CSS.indexOf('.velpi-stack-mobile')
  const hide = MOBILE_UTILITIES_CSS.indexOf('.velpi-hide-mobile')
  assert.ok(stack !== -1 && hide !== -1)
  assert.ok(hide > stack, 'both set display:!important — source order decides')
})

test('stacking uses grid so an existing gap survives the collapse', () => {
  assert.match(MOBILE_UTILITIES_CSS, /\.velpi-stack-mobile \{[^}]*display: grid !important/)
  assert.match(MOBILE_UTILITIES_CSS, /\.velpi-stack-mobile \{[^}]*grid-template-columns: 1fr !important/)
})

test('edge and full utilities force box-sizing so insets cannot overflow the viewport', () => {
  assert.match(MOBILE_UTILITIES_CSS, /\.velpi-edge-mobile \{[^}]*box-sizing: border-box !important/)
  assert.match(MOBILE_UTILITIES_CSS, /\.velpi-full-mobile \{[^}]*box-sizing: border-box !important/)
})

test('CTA utility guarantees a real tap target', () => {
  assert.match(MOBILE_UTILITIES_CSS, /\.velpi-full-mobile \{[^}]*min-height: 52px !important/)
  assert.match(MOBILE_UTILITIES_CSS, /\.velpi-full-mobile \{[^}]*width: 100% !important/)
})

test('CTA utility survives a flex parent instead of being shrunk by it', () => {
  // Regression: width:100% alone measured 285px of a 375px viewport inside a
  // flex row, because flex-shrink beats the declared width. Button pairs are
  // routinely flex, so the width guarantee is meaningless without this.
  assert.match(MOBILE_UTILITIES_CSS, /\.velpi-full-mobile \{[^}]*flex: 1 1 100% !important/)
  // ...and stays shrinkable, so sharing a row can never cause overflow.
  assert.match(MOBILE_UTILITIES_CSS, /\.velpi-full-mobile \{[^}]*min-width: 0 !important/)
})

test('never clips overflow on .velpi-page — that would break the sticky nav', () => {
  // position:sticky stops working inside any ancestor with overflow clipping,
  // and the conversion rules require a sticky nav. Guarding this explicitly
  // because "just hide the horizontal scroll" is a tempting one-line fix.
  assert.ok(!/overflow[^:]*:\s*(hidden|clip|auto|scroll)/.test(MOBILE_UTILITIES_CSS))
})

test('braces balance — a malformed block would silently kill the rules after it', () => {
  const opens = (MOBILE_UTILITIES_CSS.match(/\{/g) || []).length
  const closes = (MOBILE_UTILITIES_CSS.match(/\}/g) || []).length
  assert.equal(opens, closes)
})

// ── drift guards: the CSS is worthless if the prompts don't know about it ──

test('build-site injects the utilities and teaches every class by name', () => {
  const src = readRoute('build-site')
  assert.ok(src.includes('MOBILE_UTILITIES_CSS'), 'the block must actually be spliced into the page')
  assert.match(src, /TYPE_FLOOR \+ MOBILE_UTILITIES_CSS/, 'must be appended at the end of the style tag to win the cascade')
  for (const cls of MOBILE_UTILITY_CLASSES) {
    assert.ok(src.includes(cls), `the build prompt must tell the model that ${cls} exists`)
  }
})

test('the fix route is told to preserve the classes rather than strip them', () => {
  const src = readRoute('reevaluate-fix')
  for (const cls of MOBILE_UTILITY_CLASSES) {
    assert.ok(src.includes(cls), `reevaluate-fix must know about ${cls} so a "surgical" fix cannot drop it`)
  }
})

test('no route still claims the page is mobile-first', () => {
  // build-site authors desktop-first; a since-removed dormant route (enhance-
  // site) used to say the opposite, which would have inverted the whole
  // responsive strategy if it were ever revived. Guarded here so a future
  // route can't reintroduce the same contradiction.
  for (const route of ['build-site', 'reevaluate-fix']) {
    const src = readRoute(route)
    assert.ok(!/MOBILE-FIRST contract/i.test(src), `${route} contradicts the desktop-first build`)
  }
})
