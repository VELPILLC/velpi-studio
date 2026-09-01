import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  familyOf, groupFamilies, scoreFamily, chooseFamily, planBorrows, rankWithinFamily,
} from '../../lib/sectionFamily.mjs'

// Run against the REAL manifest — the whole point is that one family can
// actually cover a real page. (sectionPresets.js itself can't be imported
// here: it's a .js ESM module with a JSON import, so it only loads under
// Next's bundler. The pure logic lives in sectionFamily.mjs for this reason.)
const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const manifest = JSON.parse(readFileSync(join(repo, 'presets', 'sections', 'manifest.json'), 'utf8'))
const entries = (manifest.sections || []).filter(s => s.reference && s.framework !== 'react-tsx')

const PAGE_CATS = ['nav', 'footer', 'hero', 'features', 'pricing', 'testimonials', 'stats', 'cta', 'faq', 'card']

test('the manifest actually has entries to work with', () => {
  assert.ok(entries.length >= 20, `expected a real pool, got ${entries.length}`)
})

test('familyOf derives a stable id from both source shapes', () => {
  assert.equal(familyOf({ source: 'velpi original' }), 'velpi')
  assert.equal(familyOf({ source: 'https://github.com/themesberg/flowbite/blob/main/x.html' }), 'flowbite')
  assert.equal(familyOf({ source: 'https://github.com/markmead/hyperui' }), 'hyperui')
  assert.equal(familyOf({}), 'unknown')
})

test('every real manifest entry resolves to a named family', () => {
  const unknown = entries.filter(e => familyOf(e) === 'unknown')
  assert.equal(unknown.length, 0, `unfamilied: ${unknown.map(e => e.id).join(', ')}`)
})

test('the winning family covers nearly the whole page on its own', () => {
  const { family } = chooseFamily(entries, { neededCats: PAGE_CATS, industryText: 'restaurant mexican', domain: 'kasaamigos.com' })
  assert.ok(family, 'a family must be chosen')
  const missing = PAGE_CATS.filter(c => !(family.byCat[c] || []).length)
  assert.ok(missing.length <= 1, `one family should cover nearly everything; missing ${missing.join(', ')}`)
})

test('gaps are covered by a capped, DISCLOSED borrow', () => {
  const { family } = chooseFamily(entries, { neededCats: PAGE_CATS, industryText: 'restaurant', domain: 'kasaamigos.com' })
  const { borrowFor, borrowed } = planBorrows(family, entries, PAGE_CATS, { industryText: 'restaurant' })
  const missing = PAGE_CATS.filter(c => !(family.byCat[c] || []).length)
  for (const cat of missing.slice(0, 2)) {
    assert.ok(borrowFor[cat], `gap "${cat}" must be filled`)
  }
  for (const b of borrowed) {
    assert.ok(b.category && b.blueprintId && b.fromFamily && b.reason, 'every borrow is fully described for disclosure')
    assert.notEqual(b.fromFamily, family.id)
  }
  assert.ok(borrowed.length <= 2, 'borrowing is capped so a page never becomes a collage again')
})

test('the same domain always resolves to the same family', () => {
  const runs = new Set()
  for (let i = 0; i < 50; i++) {
    runs.add(chooseFamily(entries, { neededCats: PAGE_CATS, industryText: 'restaurant', domain: 'kasaamigos.com' }).family.id)
  }
  assert.equal(runs.size, 1, 'the regeneration contract requires a stable family per domain')
})

test('forcedFamily overrides the deterministic pick', () => {
  const all = [...groupFamilies(entries).keys()]
  const other = all.find(id => id !== chooseFamily(entries, { neededCats: PAGE_CATS, domain: 'x.com' }).family.id)
  if (!other) return // single-family manifest — nothing to force
  const { family } = chooseFamily(entries, { neededCats: PAGE_CATS, domain: 'x.com', forcedFamily: other })
  assert.equal(family.id, other, 'a guided-mode choice must win')
})

test('an unknown forcedFamily falls back instead of returning nothing', () => {
  const { family } = chooseFamily(entries, { neededCats: PAGE_CATS, domain: 'x.com', forcedFamily: 'does-not-exist' })
  assert.ok(family, 'a stale locked family id must never wedge the build')
})

test('scoreFamily rewards coverage over raw size', () => {
  const wide = { id: 'wide', framework: 'html-css', entries: [], byCat: { hero: [1], features: [1], cta: [1] } }
  const deep = { id: 'deep', framework: 'html-css', entries: [], byCat: { hero: [1, 1, 1, 1, 1] } }
  const cats = ['hero', 'features', 'cta']
  assert.ok(scoreFamily(wide, { neededCats: cats }) > scoreFamily(deep, { neededCats: cats }))
})

test('rankWithinFamily prefers a niche match, then a real desktop hero composition', () => {
  const pool = [
    { id: 'a', framework: 'html-css', niches: [], reference: 'display:block' },
    { id: 'b', framework: 'html-css', niches: [], reference: 'grid-template-columns: 1fr 1fr' },
    { id: 'c', framework: 'html-css', niches: ['restaurant'], reference: 'display:block' },
  ]
  const ranked = rankWithinFamily(pool, { industryText: 'restaurant mexican', category: 'hero' })
  assert.equal(ranked[0].id, 'c', 'a decisive niche match wins')
  assert.equal(ranked[1].id, 'b', 'then the multi-column hero over a centered stack')
})

test('groupFamilies buckets by category and resolves a framework per family', () => {
  const fams = groupFamilies(entries)
  assert.ok(fams.size >= 2)
  for (const fam of fams.values()) {
    assert.ok(fam.framework, `${fam.id} must resolve a framework`)
    assert.ok(fam.entries.length > 0)
    for (const [cat, list] of Object.entries(fam.byCat)) {
      assert.ok(list.every(e => e.category === cat))
    }
  }
})
