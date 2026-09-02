import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  HERO_EFFECTS, HERO_EFFECT_IDS, heroEffectById, scoreHeroEffect,
  chooseHeroEffect, heroEffectPromptBlock, rankHeroEffects,
} from '../../lib/effectsLibrary.mjs'

const restaurant = { industry: 'restaurant', niche: 'lakeside dining', color_palette: ['#c8452e', '#1d2b1f', '#f7f1e4'] }
const saas = { industry: 'saas', niche: 'b2b software platform', color_palette: ['#5b5bd6', '#0b1020', '#ffffff'] }
const contractor = { industry: 'construction', niche: 'concrete contractor', color_palette: ['#e0a12b', '#1a1a1a', '#ffffff'] }
const funeral = { industry: 'funeral home', niche: 'cremation services', color_palette: ['#2f4858', '#12202a', '#f4f4f2'] }

test('the catalogue is well-formed', () => {
  assert.ok(HERO_EFFECTS.length >= 4, 'expected at least four treatments')
  assert.equal(new Set(HERO_EFFECT_IDS).size, HERO_EFFECT_IDS.length, 'ids must be unique')
  for (const e of HERO_EFFECTS) {
    assert.ok(e.id && e.label && e.summary, `${e.id} missing display fields`)
    assert.equal(typeof e.recipe, 'function', `${e.id} must carry a real recipe`)
  }
  assert.ok(HERO_EFFECT_IDS.includes('none'), 'an explicit opt-out must exist')
})

// The two registers must not bleed into each other: plain words for the person
// choosing, technical vocabulary for the model building. Both directions are
// failures — jargon in a label makes the choice harder, and a vague recipe
// produces exactly the generic output this library exists to prevent.
const JARGON = [
  'shader', 'webgl', 'three.js', 'buffergeometry', 'geometry', 'mesh',
  'attenuation', 'octave', 'uniform', 'fragment', 'vertex', 'fog',
  'pixel ratio', 'intersectionobserver', 'canvas', 'roughness', 'metalness',
  'parallax', 'render loop', 'viewport', 'opacity', 'z-index',
]

test('what a person reads is plain — no jargon in labels, summaries or bestFor', () => {
  for (const e of HERO_EFFECTS) {
    const facing = `${e.label} ${e.summary} ${e.bestFor || ''}`.toLowerCase()
    for (const word of JARGON) {
      assert.ok(!facing.includes(word), `"${word}" leaked into the user-facing copy for ${e.id}: "${e.label} — ${e.summary}"`)
    }
    assert.ok(e.label.length <= 32, `${e.id} label too long to read as a choice: "${e.label}"`)
    assert.ok(e.bestFor && e.bestFor.length > 10, `${e.id} needs a plain "best for" to help someone choose`)
  }
})

test('what the model reads is technical — the depth vocabulary is on every 3D recipe', () => {
  const colors = { primary: '#ff0000', secondary: '#00ff00', surface: '#0000ff', all: [] }
  for (const e of HERO_EFFECTS) {
    if (e.id === 'none') continue
    const recipe = e.recipe({ colors }).toLowerCase()
    // These are the words that actually produce depth instead of a spinning
    // object on a black square.
    for (const term of ['parallax', 'time of day', 'contact shadow', 'texture']) {
      assert.ok(recipe.includes(term), `${e.id} recipe is missing "${term}" — it will produce generic 3D`)
    }
  }
})

test('every recipe is concrete, not prose — it names real Three.js constructs', () => {
  const colors = { primary: '#ff0000', secondary: '#00ff00', surface: '#0000ff', all: [] }
  for (const e of HERO_EFFECTS) {
    const text = e.recipe({ colors })
    assert.ok(text.length > 200, `${e.id} recipe is too thin to steer a build`)
    // Every 3D treatment must state its own fallback and its mobile reduction —
    // those are the two rules that keep a failed scene from shipping an empty box.
    if (e.id !== 'none') {
      assert.match(text, /fallback/i, `${e.id} must specify a CSS fallback`)
      assert.match(text, /mobile/i, `${e.id} must specify a mobile reduction`)
      assert.match(text, /canvas/i, `${e.id} must place a canvas`)
    }
  }
})

test('recipes inject the brand palette rather than inventing colors', () => {
  const choice = chooseHeroEffect({ analysis: saas, domain: 'acme.io' })
  if (choice.effect.id === 'none') return // none is legitimately colorless
  assert.ok(
    choice.recipe.includes(choice.colors.primary),
    'the chosen recipe must reference the real brand primary',
  )
})

test('palette falls back safely when analysis has no usable colors', () => {
  const choice = chooseHeroEffect({ analysis: { industry: 'saas' }, domain: 'x.com' })
  assert.match(choice.colors.primary, /^#[0-9a-f]{3,8}$/i)
  const junk = chooseHeroEffect({ analysis: { industry: 'saas', color_palette: ['not-a-color', null, 42] }, domain: 'x.com' })
  assert.match(junk.colors.primary, /^#[0-9a-f]{3,8}$/i, 'junk palette entries must not leak through')
})

test('niche steers the choice — different industries get different treatments', () => {
  const a = chooseHeroEffect({ analysis: saas, domain: 'acme.io' }).effect.id
  const b = chooseHeroEffect({ analysis: contractor, domain: 'acme.io' }).effect.id
  assert.equal(a, 'gradient-mesh-flow', 'a SaaS brand should land on the shader treatment')
  assert.equal(b, 'floating-geometry', 'a concrete contractor should land on lit forms')
  assert.notEqual(a, b)
})

test('gravitas niches never get an animated 3D hero', () => {
  for (const domain of ['a.com', 'b.com', 'c.com', 'restpeace.net', 'zzz.org']) {
    const choice = chooseHeroEffect({ analysis: funeral, domain })
    assert.equal(choice.effect.id, 'none', `funeral home got ${choice.effect.id} on ${domain}`)
  }
  // And the scorer says so directly, not just by luck of the tie-break.
  const text = 'funeral home cremation services'
  for (const e of HERO_EFFECTS) {
    if (e.id === 'none') continue
    assert.ok(
      scoreHeroEffect(e, { industryText: text }) < scoreHeroEffect(heroEffectById('none'), { industryText: text }),
      `${e.id} must score below "none" for a funeral home`,
    )
  }
})

test('the same business always resolves to the same treatment', () => {
  const runs = new Set()
  for (let i = 0; i < 25; i++) {
    runs.add(chooseHeroEffect({ analysis: restaurant, domain: 'lakesidegrill.com' }).effect.id)
  }
  assert.equal(runs.size, 1, 'regeneration must be deterministic')
})

test('a forced id always wins, and is reported as forced', () => {
  const choice = chooseHeroEffect({ analysis: funeral, domain: 'x.com', forcedId: 'floating-geometry' })
  assert.equal(choice.effect.id, 'floating-geometry', 'guided mode must override scoring')
  assert.equal(choice.forced, true)
  assert.equal(choice.scores.find(s => s.id === 'floating-geometry').score, Infinity)
})

test('an unknown forced id falls back to scoring instead of throwing', () => {
  const choice = chooseHeroEffect({ analysis: saas, domain: 'acme.io', forcedId: 'no-such-effect' })
  assert.ok(HERO_EFFECT_IDS.includes(choice.effect.id))
  assert.equal(choice.forced, false)
})

test('different domains in the same niche can still diverge on a genuine tie', () => {
  // Neutral text: nothing matches any niche list, so the treatments tie and the
  // domain hash decides. This is the property that stops every unrecognized
  // business from getting an identical page.
  const ids = new Set()
  for (const d of ['a.com', 'b.com', 'c.com', 'd.com', 'e.com', 'f.com', 'g.com', 'h.com']) {
    ids.add(chooseHeroEffect({ analysis: { industry: 'general' }, domain: d }).effect.id)
  }
  assert.ok(ids.size >= 2, `expected divergence across domains, got ${[...ids].join(',')}`)
})

test('the prompt block names the treatment and forbids substitution', () => {
  const choice = chooseHeroEffect({ analysis: contractor, domain: 'pourright.com' })
  const block = heroEffectPromptBlock(choice)
  assert.match(block, /HERO TREATMENT/)
  assert.match(block, /do not substitute/i)
  assert.ok(block.includes(choice.recipe), 'the block must carry the full recipe')
  assert.equal(heroEffectPromptBlock(null), '', 'a missing choice yields no block, never "undefined"')
})

test('rankHeroEffects offers real, ordered choices for guided mode', () => {
  const ranked = rankHeroEffects(saas, 4)
  assert.equal(ranked.length, 4)
  assert.equal(ranked[0].id, 'gradient-mesh-flow')
  assert.equal(new Set(ranked.map(r => r.id)).size, 4, 'no duplicate options')
})
