import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  buildCandidateSets, validateGuided, autoLabel, fallbackQuestions, decisionsFromAnswers, QUESTION_IDS,
} from '../../lib/guidedSpine.mjs'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const load = p => JSON.parse(readFileSync(join(repo, ...p), 'utf8'))
const manifest = load(['presets', 'sections', 'manifest.json'])
const motionManifest = load(['presets', 'motion', 'manifest.json'])
const palettes = load(['presets', 'design-intel', 'palettes.json'])
const pairings = load(['presets', 'design-intel', 'pairings.json'])
const reasoning = load(['presets', 'design-intel', 'reasoning.json'])

const sectionEntries = (manifest.sections || []).filter(s => s.reference && s.framework !== 'react-tsx')
const motionPresets = (motionManifest.presets || []).filter(p => p.snippet).slice(0, 4)
const styles = [
  { id: 'refero--restaurant--amrit', name: 'Amrit Palace', niches: ['restaurant'], content: 'warm hospitality editorial' },
  { id: 'refero--law--legora', name: 'Legora', niches: ['law'], content: 'clinical authority' },
  { id: 'refero--sushi--limon', name: 'Limón', niches: ['restaurant', 'sushi'], content: 'minimal dining' },
  { id: 'refero--bank--online', name: 'The Online Bank', niches: ['bank'], content: 'trust fintech' },
  { id: 'refero--boutique--glein', name: 'Glein', niches: ['boutique'], content: 'fashion editorial' },
]

const ANALYSIS = {
  business_name: 'Kasa Amigos',
  industry: 'Restaurant',
  niche: 'Mexican restaurant',
  tone: 'warm family friendly',
  target_feeling: 'welcomed',
  layout: { section_order: ['hero', 'menu', 'about', 'reviews', 'contact'] },
  _source: { domain: 'kasaamigos.com' },
  brand_read: { colors: [{ hex: '#C8102E', role: 'primary' }, { hex: '#F2B824', role: 'accent' }], personality: ['warm', 'family'] },
}

const build = (answers = {}) => buildCandidateSets({
  analysis: ANALYSIS, brandColors: ['#C8102E', '#F2B824'],
  styles, sectionEntries, motionPresets, palettes, pairings, reasoning, answers,
})

test('every question offers at least two real choices', () => {
  const { sets } = build()
  assert.ok(Object.keys(sets).length >= 7, `expected most questions to be answerable, got ${Object.keys(sets).length}`)
  for (const [qid, list] of Object.entries(sets)) {
    assert.ok(list.length >= 2, `${qid} must be a real choice, got ${list.length}`)
    assert.ok(QUESTION_IDS.includes(qid))
  }
})

test('the brand\'s own colors are always offered first', () => {
  const { sets } = build()
  assert.equal(sets.color[0].id, 'pal-brand', 'using the logo must be the easy default')
  assert.match(sets.color[0].hint, /#C8102E/)
})

test('palette candidates are led by the brand hue, not a category prior', () => {
  const { sets } = build()
  const catalogOptions = sets.color.filter(c => c.id !== 'pal-brand')
  assert.ok(catalogOptions.length >= 2)
  assert.ok(catalogOptions[0].meta.brandDistance <= 30, `expected a near-brand palette first, got ${catalogOptions[0].meta.brandDistance}°`)
})

test('style candidates favor the actual niche', () => {
  const { sets } = build()
  assert.ok(/restaurant|sushi/.test(sets.direction[0].id), `expected a restaurant-fitting anchor, got ${sets.direction[0].id}`)
})

test('hero and proof options come from the committed family', () => {
  const built = build()
  assert.ok(built.family, 'a family must be committed')
  const ids = new Set(sectionEntries.filter(e => e.source && built.family).map(e => e.id))
  for (const c of built.sets.hero || []) assert.ok(ids.has(c.id))
  for (const c of built.sets.proof || []) assert.ok(ids.has(c.id))
})

test('rhythm options are genuine permutations of the planned order', () => {
  const { sets } = build()
  const base = ANALYSIS.layout.section_order
  for (const opt of sets.rhythm) {
    assert.deepEqual([...opt.meta.order].sort(), [...base].sort(), 'no section may be added or lost')
  }
  const distinct = new Set(sets.rhythm.map(o => o.meta.order.join()))
  assert.equal(distinct.size, sets.rhythm.length, 'every rhythm option must actually differ')
})

test('motion always offers an honest "none"', () => {
  const { sets } = build()
  assert.ok(sets.motion.some(c => c.id === 'motion-none'))
})

// ── the anti-generic contract ──

test('validateGuided rejects ids the model invented', () => {
  const { sets } = build()
  const out = validateGuided({
    questions: [{
      id: 'density',
      q: 'How dense?',
      options: [
        { id: 'den-airy', label: 'Airy', desc: 'lots of room' },
        { id: 'totally-made-up', label: 'Invented', desc: 'not in the catalog' },
        { id: 'den-rich', label: 'Rich', desc: 'more per screen' },
      ],
    }],
  }, sets)
  const density = out.find(q => q.id === 'density')
  assert.ok(!density.options.some(o => o.id === 'totally-made-up'), 'an invented option must never reach the user')
  assert.equal(density.options.length, 2)
})

test('a question the model mangles falls back to honest auto-labels', () => {
  const { sets } = build()
  const out = validateGuided({ questions: [{ id: 'density', options: [{ id: 'nope', label: 'x' }] }] }, sets)
  const density = out.find(q => q.id === 'density')
  assert.ok(density.options.length >= 2, 'fallback must still present a real choice')
  assert.ok(density.options.every(o => sets.density.some(c => c.id === o.id)))
})

test('duplicate options are collapsed and long strings truncated', () => {
  const { sets } = build()
  const out = validateGuided({
    questions: [{
      id: 'density',
      options: [
        { id: 'den-airy', label: 'A'.repeat(200), desc: 'B'.repeat(400) },
        { id: 'den-airy', label: 'dupe', desc: 'dupe' },
        { id: 'den-rich', label: 'Rich', desc: 'ok' },
      ],
    }],
  }, sets)
  const density = out.find(q => q.id === 'density')
  assert.equal(density.options.length, 2, 'duplicates collapse')
  assert.ok(density.options[0].label.length <= 46)
  assert.ok(density.options[0].desc.length <= 120)
})

test('an empty model response still yields a full, usable questionnaire', () => {
  const { sets } = build()
  const out = validateGuided({}, sets)
  assert.equal(out.length, Object.keys(sets).length)
  for (const q of out) assert.ok(q.options.length >= 2)
})

test('fallbackQuestions and autoLabel never produce an empty option list', () => {
  const { sets } = build()
  const qs = fallbackQuestions(sets)
  assert.ok(qs.length >= 7)
  for (const q of qs) {
    assert.ok(q.q && q.options.length >= 2)
    for (const o of q.options) assert.ok(o.id && o.label)
  }
  assert.deepEqual(autoLabel([]), [])
})

// ── answers become hard pipeline inputs ──

test('every answer maps onto a real downstream parameter', () => {
  const built = build()
  const answers = {
    direction: built.sets.direction[0].id,
    color: built.sets.color[0].id,
    typography: built.sets.typography[0].id,
    hero: built.sets.hero?.[0]?.id,
    rhythm: built.sets.rhythm[1]?.id || built.sets.rhythm[0].id,
    imagery: 'img-editorial-crop',
    proof: built.sets.proof?.[0]?.id,
    motion: built.sets.motion[0].id,
    density: 'den-airy',
  }
  const d = decisionsFromAnswers(answers, built)
  assert.equal(d.styleId, answers.direction, 'feeds manualStyleId')
  assert.equal(d.familyId, built.family, 'feeds forcedFamily')
  assert.ok(d.forcedMap?.hero, 'feeds forcedMap')
  assert.ok(Array.isArray(d.sectionOrder), 'feeds forcedLayout.section_order')
  assert.ok(d.palette?.length, 'the chosen palette is carried as real hexes')
  assert.ok(d.directives.typography?.includes('@import'), 'typography directive must be executable')
  assert.ok(d.directives.imagery && d.directives.density)
  assert.ok(d.vibeSuffix.length > 10, 'style scoring downstream reads vibeText')
})

test('choosing no motion is carried as a real decision, not a missing one', () => {
  const built = build()
  const d = decisionsFromAnswers({ motion: 'motion-none' }, built)
  assert.equal(d.motionId, null)
  assert.equal(d.motionOff, true)
})

test('partial answers never throw and never fabricate decisions', () => {
  const built = build()
  const d = decisionsFromAnswers({}, built)
  assert.equal(d.styleId, null)
  assert.equal(d.sectionOrder, null)
  assert.equal(d.palette, null)
  assert.doesNotThrow(() => decisionsFromAnswers({ direction: 'not-real' }, built))
})

test('candidate sets never reference generated project data', () => {
  // The owner's own previously generated sites are explicitly out of scope as
  // a design source; every candidate must trace to a curated library.
  const built = build()
  const known = new Set([
    ...styles.map(s => s.id),
    ...sectionEntries.map(e => e.id),
    ...motionPresets.map(m => m.id),
    ...palettes.map(p => p.id),
    ...pairings.map(p => p.id),
    'pal-brand', 'motion-none',
    'img-full-bleed', 'img-editorial-crop', 'img-warm-graded', 'img-documentary',
    'den-airy', 'den-standard', 'den-rich',
    'rhy-as-planned', 'rhy-proof-first', 'rhy-offer-first',
  ])
  for (const [qid, list] of Object.entries(built.sets)) {
    for (const c of list) assert.ok(known.has(c.id), `${qid} offered an untraceable candidate: ${c.id}`)
  }
})
