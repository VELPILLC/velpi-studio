import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  productTypeFor, palettesFor, rankPalettesByBrand, pairingsFor, reasoningFor,
} from '../../lib/designIntel.mjs'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const load = n => JSON.parse(readFileSync(join(repo, 'presets', 'design-intel', `${n}.json`), 'utf8'))
const palettes = load('palettes')
const pairings = load('pairings')
const reasoning = load('reasoning')
const motionGuidance = load('motionGuidance')

const HEX = /^#[0-9A-Fa-f]{6}$/

test('the vendored catalogs converted completely', () => {
  assert.ok(palettes.length >= 150, `palettes: ${palettes.length}`)
  assert.ok(pairings.length >= 60, `pairings: ${pairings.length}`)
  assert.ok(reasoning.length >= 100, `reasoning: ${reasoning.length}`)
  assert.ok(motionGuidance.length >= 10, `motion: ${motionGuidance.length}`)
})

test('every palette carries usable hexes and a product type', () => {
  for (const p of palettes) {
    assert.match(p.primary, HEX, `${p.id} primary`)
    assert.match(p.background, HEX, `${p.id} background`)
    assert.match(p.foreground, HEX, `${p.id} foreground`)
    assert.ok(p.productType, `${p.id} needs a product type`)
  }
})

test('every pairing carries both fonts and a ready CSS @import', () => {
  // The output contract loads fonts via @import inside the single <style>
  // tag, so a pairing without one can't actually be executed.
  for (const p of pairings) {
    assert.ok(p.heading && p.body, `${p.id} needs both fonts`)
    assert.match(p.cssImport, /@import url\(/, `${p.id} needs a usable @import`)
  }
})

test('quoted CSV fields survived the conversion intact', () => {
  // These files use commas inside quoted fields heavily; a naive split would
  // shear columns and it would only show up as subtly wrong data.
  const multi = pairings.find(p => (p.mood || '').includes(','))
  assert.ok(multi, 'mood keywords are comma-separated inside one field')
  assert.ok(!Object.values(multi).some(v => String(v).startsWith('"')), 'no stray quote characters leaked through')
})

test('local-business niches resolve to their own product type', () => {
  assert.equal(productTypeFor(palettes, 'Restaurant', 'Mexican restaurant'), 'Restaurant/Food Service')
  assert.ok(/Legal/i.test(productTypeFor(palettes, 'Law firm', 'legal services') || ''))
  assert.ok(/Beauty|Spa/i.test(productTypeFor(palettes, 'Salon', 'beauty spa wellness') || ''))
})

test('an unmatchable niche returns null instead of a wrong palette', () => {
  assert.equal(productTypeFor(palettes, '', ''), null)
  assert.equal(productTypeFor(palettes, 'zzzz', 'qqqq'), null)
})

test('the restaurant palette is the appetizing red + gold, not a category prior', () => {
  const list = palettesFor(palettes, 'Restaurant/Food Service', { limit: 6 })
  assert.ok(list.length > 0)
  const primary = list[0].primary.toUpperCase()
  assert.equal(primary, '#DC2626')
  assert.match(list[0].notes, /red/i)
})

test('palettes re-rank toward the brand\'s real colors', () => {
  // The reported failure: a red/yellow logo produced an indigo site.
  const KASA_LOGO = ['#C8102E', '#F2B824']
  const ranked = rankPalettesByBrand(palettes, KASA_LOGO, { limit: 5 })
  assert.ok(ranked.length === 5)
  assert.ok(ranked[0].brandDistance <= 25, `top match should be near the brand hue, got ${ranked[0].brandDistance}°`)
  for (let i = 1; i < ranked.length; i++) {
    assert.ok(ranked[i].brandDistance >= ranked[i - 1].brandDistance, 'results are ordered by closeness to the brand')
  }
})

test('a monochrome logo leaves palette order alone rather than inventing a hue', () => {
  const ranked = rankPalettesByBrand(palettes, ['#111111', '#FFFFFF'], { limit: 4 })
  assert.deepEqual(ranked.map(p => p.id), palettes.slice(0, 4).map(p => p.id))
})

test('pairings match on mood words', () => {
  const warm = pairingsFor(pairings, ['elegant', 'luxury', 'editorial'], { limit: 5 })
  assert.ok(warm.length === 5)
  assert.ok(warm.some(p => /elegant|luxur|editorial/i.test(`${p.mood} ${p.bestFor}`)), 'top results should actually match the mood')
})

test('reasoning lookup finds a category or honestly returns null', () => {
  assert.ok(reasoningFor(reasoning, 'SaaS (General)'))
  assert.equal(reasoningFor(reasoning, ''), null)
  assert.equal(reasoningFor(reasoning, 'zzzzz'), null)
})

test('motion guidance carries timing but no JavaScript', () => {
  // GSAP snippets are deliberately dropped: the output contract forbids JS,
  // so shipping them would invite the model to emit unusable code.
  for (const m of motionGuidance) {
    assert.ok(m.duration || m.easing, `${m.id} should carry timing guidance`)
    assert.ok(!('snippet' in m), `${m.id} must not carry a GSAP snippet`)
    assert.ok(!/gsap\./i.test(JSON.stringify(m)), `${m.id} must not smuggle JS in another field`)
  }
})
