import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reconcilePalette, hueDistance, isChromatic } from '../../lib/brandPalette.mjs'

// The reported failure: a red/yellow Mexican-restaurant logo produced an
// indigo + gold site, and every later stage treated indigo as ground truth.
const KASA_LOGO = ['#C8102E', '#F2B824'] // red wordmark + yellow accent
const KASA_ANALYZED = ['#2B2E6B', '#D8A24A', '#FFFFFF'] // what the analyzer invented

test('re-anchors a lead color that appears nowhere in the logo', () => {
  const res = reconcilePalette(KASA_ANALYZED, KASA_LOGO)
  assert.equal(res.anchored, true)
  assert.equal(res.palette[0], '#C8102E', 'the brand red must lead instead of the invented indigo')
  const change = res.changes.find(c => c.from === '#2B2E6B' && c.to === '#C8102E')
  assert.ok(change, 'the substitution must be reported, not silent')
  assert.match(change.reason, /re-anchored/)
})

test('keeps the analyzer\'s other colors when re-anchoring', () => {
  const res = reconcilePalette(KASA_ANALYZED, KASA_LOGO)
  assert.ok(res.palette.includes('#D8A24A'), 'the gold was already on-brand and must survive')
  assert.ok(res.palette.includes('#FFFFFF'), 'neutrals are never touched')
  assert.ok(res.palette.includes('#2B2E6B'), 'the displaced lead is demoted, not deleted')
})

test('leaves an already on-brand palette completely untouched', () => {
  const onBrand = ['#C4102A', '#F0B41E', '#FFFFFF']
  const res = reconcilePalette(onBrand, KASA_LOGO)
  assert.deepEqual(res.palette, onBrand)
  assert.equal(res.anchored, true)
  assert.equal(res.changes.filter(c => !c.flagged).length, 0, 'no corrections on an on-brand palette')
})

test('a monochrome logo never forces a hue onto the palette', () => {
  // A black wordmark carries no brand hue; demanding a match would fire on
  // every monochrome mark and invent an identity the business does not have.
  const res = reconcilePalette(['#2B2E6B', '#FFFFFF'], ['#111111', '#FFFFFF'])
  assert.equal(res.anchored, false)
  assert.deepEqual(res.palette, ['#2B2E6B', '#FFFFFF'])
  assert.equal(res.changes.length, 0)
  assert.match(res.reason, /no chromatic color/)
})

test('an all-neutral palette gains the brand hue as an accent rather than a rewrite', () => {
  const res = reconcilePalette(['#FDFBF7', '#141414'], KASA_LOGO)
  assert.equal(res.palette[0], '#FDFBF7', 'the cream/charcoal choice is preserved')
  assert.ok(res.palette.includes('#C8102E'))
  assert.equal(res.anchored, true)
})

test('an empty palette is seeded from the logo instead of left to a fallback', () => {
  const res = reconcilePalette([], KASA_LOGO)
  assert.deepEqual(res.palette, ['#C8102E', '#F2B824'])
  assert.equal(res.anchored, true)
})

test('off-brand secondary colors are flagged but never silently rewritten', () => {
  // Only the lead owns large fields of page; a brand may legitimately use a
  // supporting hue that never appears in its mark.
  const res = reconcilePalette(['#C8102E', '#1FA97E'], KASA_LOGO)
  assert.deepEqual(res.palette, ['#C8102E', '#1FA97E'], 'secondaries are left alone')
  const flagged = res.changes.filter(c => c.flagged)
  assert.equal(flagged.length, 1)
  assert.equal(flagged[0].from, '#1FA97E')
})

test('hue tolerance accepts a shade of the brand color but rejects a different hue', () => {
  assert.ok(hueDistance('#C8102E', '#E33A52') < 28, 'a lighter red is the same brand hue')
  assert.ok(hueDistance('#C8102E', '#2B2E6B') > 28, 'indigo is not red')
  // wraparound: 350° and 10° are 20° apart, not 340°
  assert.ok(hueDistance('#FF0033', '#FF3300') < 28)
})

test('isChromatic separates brand hues from neutrals', () => {
  assert.equal(isChromatic('#C8102E'), true)
  assert.equal(isChromatic('#FFFFFF'), false)
  assert.equal(isChromatic('#111111'), false)
  assert.equal(isChromatic('#8A8A8A'), false, 'mid gray carries no hue')
})

test('unparseable input degrades instead of throwing', () => {
  const res = reconcilePalette(['not-a-color', '#C8102E'], KASA_LOGO)
  assert.ok(Array.isArray(res.palette))
  assert.ok(!res.palette.includes('not-a-color'))
  assert.doesNotThrow(() => reconcilePalette(null, null))
})
