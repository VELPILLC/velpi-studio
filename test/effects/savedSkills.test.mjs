import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeSavedSkill, normalizeSavedSkills, scoreSavedSkill, selectSavedSkills,
  savedSkillsPromptBlock, SKILL_KINDS, DETAIL_CATEGORIES, MAX_DETAIL_SKILLS,
} from '../../lib/savedSkills.mjs'

const RECIPE = 'A layered card treatment: 1px hairline border at 8% ink, a 20px blurred shadow tinted with the brand primary at 12%, 14px radius, and a 1.02 scale lift on hover over 180ms ease-out.'

const skill = (over = {}) => ({
  id: over.id || 'card-lift',
  name: over.name || 'Layered card lift',
  kind: over.kind || 'detail',
  category: over.category || 'card',
  recipe: over.recipe || RECIPE,
  niches: over.niches ?? ['restaurant'],
  universal: over.universal ?? false,
  sourceDomain: over.sourceDomain || 'lakesidegrill.com',
})

const restaurant = { industry: 'restaurant', niche: 'lakeside dining' }
const machineShop = { industry: 'manufacturing', niche: 'machine shop' }

test('normalize rejects entries that cannot carry a real treatment', () => {
  assert.equal(normalizeSavedSkill(null), null)
  assert.equal(normalizeSavedSkill({}), null)
  assert.equal(normalizeSavedSkill({ recipe: 'nice card' }), null, 'a stub recipe is a failed distillation')
  assert.ok(normalizeSavedSkill(skill()), 'a real recipe survives')
})

test('normalize coerces unknown kinds and categories into safe lanes', () => {
  const s = normalizeSavedSkill(skill({ kind: 'nonsense', category: 'nonsense' }))
  assert.ok(SKILL_KINDS.includes(s.kind))
  assert.ok(DETAIL_CATEGORIES.includes(s.category))
  const hero = normalizeSavedSkill(skill({ kind: 'hero', category: 'whatever' }))
  assert.equal(hero.category, 'hero', 'a hero skill always occupies the hero slot')
})

test('normalize accepts both camelCase and snake_case rows from the database', () => {
  const s = normalizeSavedSkill({ ...skill(), sourceDomain: undefined, source_domain: 'x.com', created_at: '2026-01-01' })
  assert.equal(s.sourceDomain, 'x.com')
  assert.equal(s.createdAt, '2026-01-01')
})

test('niches are cleaned from either a string or an array', () => {
  assert.deepEqual(normalizeSavedSkill(skill({ niches: 'Restaurant, Cafe' })).niches, ['restaurant', 'cafe'])
  assert.deepEqual(normalizeSavedSkill(skill({ niches: ['Bar', 'bar', ''] })).niches, ['bar'], 'deduped and emptied')
})

test('a skill scores high in the niche it came from and low outside it', () => {
  const s = normalizeSavedSkill(skill())
  assert.ok(scoreSavedSkill(s, { industryText: 'restaurant lakeside dining' }) > 0)
  assert.ok(scoreSavedSkill(s, { industryText: 'manufacturing machine shop' }) < 0)
})

test('universal skills stay eligible everywhere but never outrank a niche match', () => {
  const uni = normalizeSavedSkill(skill({ id: 'u', universal: true, niches: [] }))
  const niche = normalizeSavedSkill(skill({ id: 'n', niches: ['restaurant'] }))
  const text = 'restaurant lakeside dining'
  assert.ok(scoreSavedSkill(uni, { industryText: text }) > 0, 'universal applies off-niche')
  assert.ok(scoreSavedSkill(niche, { industryText: text }) > scoreSavedSkill(uni, { industryText: text }))
})

test('off-niche skills are simply not applied', () => {
  const sel = selectSavedSkills([skill()], { analysis: machineShop, domain: 'precisionmachine.com' })
  assert.equal(sel.applied.length, 0, 'a restaurant card treatment must not land on a machine shop')
  assert.equal(sel.considered.length, 1, 'but it is still reported as considered')
})

test('only ONE hero skill can apply, no matter how many are saved', () => {
  const heroes = ['h1', 'h2', 'h3'].map(id => skill({ id, kind: 'hero', name: id }))
  const sel = selectSavedSkills(heroes, { analysis: restaurant, domain: 'lakesidegrill.com' })
  assert.ok(sel.hero, 'one hero is chosen')
  assert.equal(sel.applied.filter(s => s.kind === 'hero').length, 1)
})

test('two saved button treatments can never both apply', () => {
  const buttons = [
    skill({ id: 'b1', category: 'button', name: 'Pill button' }),
    skill({ id: 'b2', category: 'button', name: 'Square button' }),
  ]
  const sel = selectSavedSkills(buttons, { analysis: restaurant, domain: 'lakesidegrill.com' })
  assert.equal(sel.details.length, 1, 'one lane, one winner')
})

test('details are capped so a page never becomes a collision of borrowed parts', () => {
  const many = DETAIL_CATEGORIES.map((c, i) => skill({ id: `d${i}`, category: c, name: `d${i}` }))
  const sel = selectSavedSkills(many, { analysis: restaurant, domain: 'lakesidegrill.com' })
  assert.ok(sel.details.length <= MAX_DETAIL_SKILLS, `got ${sel.details.length}`)
  assert.equal(new Set(sel.details.map(d => d.category)).size, sel.details.length, 'no duplicate lanes')
})

test('a section skill only applies to a section the page actually has', () => {
  const s = skill({ id: 's1', kind: 'section', category: 'testimonials' })
  const without = selectSavedSkills([s], {
    analysis: restaurant, domain: 'lakesidegrill.com', sectionOrder: ['hero', 'services', 'contact'],
  })
  assert.equal(without.sections.length, 0, 'no testimonials section, no testimonials skill')

  const with_ = selectSavedSkills([s], {
    analysis: restaurant, domain: 'lakesidegrill.com', sectionOrder: ['hero', 'testimonials'],
  })
  assert.equal(with_.sections.length, 1)
})

test('selection is deterministic for the same business', () => {
  const pool = ['a', 'b', 'c'].map(id => skill({ id, kind: 'hero', name: id }))
  const runs = new Set()
  for (let i = 0; i < 25; i++) {
    runs.add(selectSavedSkills(pool, { analysis: restaurant, domain: 'lakesidegrill.com' }).hero.id)
  }
  assert.equal(runs.size, 1, 'regeneration must not reroll saved skills')
})

test('selection does not depend on the order rows come back from the database', () => {
  const pool = ['a', 'b', 'c'].map(id => skill({ id, kind: 'hero', name: id }))
  const forward = selectSavedSkills(pool, { analysis: restaurant, domain: 'lakesidegrill.com' }).hero.id
  const reversed = selectSavedSkills([...pool].reverse(), { analysis: restaurant, domain: 'lakesidegrill.com' }).hero.id
  assert.equal(forward, reversed)
})

test('a forced id always wins, even off-niche', () => {
  const sel = selectSavedSkills([skill({ id: 'forced-me' })], {
    analysis: machineShop, domain: 'precisionmachine.com', forcedIds: ['forced-me'],
  })
  assert.equal(sel.details.length, 1, 'an explicit pick overrides scoring')
  assert.equal(sel.details[0].id, 'forced-me')
})

test('the prompt block adopts direction without importing the original content', () => {
  const sel = selectSavedSkills([skill()], { analysis: restaurant, domain: 'lakesidegrill.com' })
  const block = savedSkillsPromptBlock(sel)
  assert.match(block, /SAVED TREATMENTS/)
  assert.match(block, /never copy the original's colors, wording or content/i)
  assert.match(block, /DETAIL: card/)
  assert.ok(block.includes('Layered card lift'))
})

test('an empty selection yields no block rather than a stray header', () => {
  assert.equal(savedSkillsPromptBlock({ applied: [] }), '')
  assert.equal(savedSkillsPromptBlock(null), '')
})

test('malformed rows never reach selection', () => {
  const sel = selectSavedSkills([null, {}, { recipe: 'x' }, skill()], {
    analysis: restaurant, domain: 'lakesidegrill.com',
  })
  assert.equal(sel.considered.length, 1, 'only the valid row survives normalization')
})
