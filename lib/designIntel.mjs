// Accessors over the vendored design-intelligence catalogs
// (presets/design-intel/*.json — see scripts/build-design-intel.mjs).
//
// These exist so the guided flow can offer options that are REAL entries a
// builder can execute, instead of adjectives a model invented on the spot.
// Vague direction is how "premium" turns into generic output.
//
// Pure by design: every function takes its catalog as an argument rather than
// importing the JSON, so the same code is unit-testable under plain `node
// --test` and importable from a Next route (which does the static import).

import { hueDistance, isChromatic } from './brandPalette.mjs'

const STOP = new Set(['and', 'the', 'for', 'with', 'general', 'service', 'services', 'app', 'site', 'business', 'a', 'of'])

function tokens(s) {
  return String(s || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 2 && !STOP.has(t))
}

/**
 * Map this app's freeform industry/niche onto a catalog product type.
 * Returns null rather than guessing when nothing matches meaningfully — a
 * wrong product type would hand the business someone else's palette.
 */
export function productTypeFor(palettes, industry, niche) {
  const want = new Set([...tokens(industry), ...tokens(niche)])
  if (!want.size) return null
  let best = null, bestScore = 0
  for (const p of palettes || []) {
    const have = tokens(p.productType)
    let score = 0
    for (const t of have) {
      if (want.has(t)) score += 2
      // Partial stem overlap ("restaurants" vs "restaurant", "dental" vs "dentist")
      else if ([...want].some(w => w.startsWith(t.slice(0, 5)) || t.startsWith(w.slice(0, 5)))) score += 1
    }
    if (score > bestScore) { bestScore = score; best = p.productType }
  }
  return bestScore >= 2 ? best : null
}

export function palettesFor(palettes, productType, { limit = 6 } = {}) {
  if (!productType) return []
  const exact = (palettes || []).filter(p => p.productType === productType)
  if (exact.length >= limit) return exact.slice(0, limit)
  // Top up with related types so a narrow category still offers real choice.
  const want = new Set(tokens(productType))
  const related = (palettes || [])
    .filter(p => p.productType !== productType)
    .map(p => ({ p, score: tokens(p.productType).filter(t => want.has(t)).length }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.p)
  return [...exact, ...related].slice(0, limit)
}

/**
 * Re-rank palettes by how close they sit to the brand's own colors.
 * This is the step that stops a category prior ("premium restaurants use
 * navy and gold") from beating the actual logo in front of us.
 */
export function rankPalettesByBrand(palettes, logoColors, { limit = 6 } = {}) {
  const brand = (logoColors || [])
    .map(c => (typeof c === 'string' ? c : c?.hex))
    .filter(c => c && isChromatic(c))
  if (!brand.length) return (palettes || []).slice(0, limit)

  const nearest = value => Math.min(...brand.map(b => hueDistance(value, b)))
  return (palettes || [])
    .map(p => {
      // The primary carries the page; weight it hardest, but let a strong
      // accent match rescue a palette whose primary is a neutral.
      const dPrimary = nearest(p.primary)
      const dAccent = nearest(p.accent)
      return { p, distance: Math.min(dPrimary, dPrimary * 0.5 + dAccent * 0.5) }
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(x => ({ ...x.p, brandDistance: Math.round(x.distance) }))
}

export function pairingsFor(pairings, moodWords, { limit = 6 } = {}) {
  const want = new Set(tokens(Array.isArray(moodWords) ? moodWords.join(' ') : moodWords))
  if (!want.size) return (pairings || []).slice(0, limit)
  return (pairings || [])
    .map(p => {
      const hay = tokens(`${p.mood} ${p.bestFor} ${p.category}`)
      let score = 0
      for (const t of hay) if (want.has(t)) score += 1
      return { p, score }
    })
    .sort((a, b) => b.score - a.score || (a.p.id < b.p.id ? -1 : 1))
    .slice(0, limit)
    .map(x => x.p)
}

export function reasoningFor(reasoning, category) {
  if (!category) return null
  const want = new Set(tokens(category))
  let best = null, bestScore = 0
  for (const r of reasoning || []) {
    const score = tokens(r.category).filter(t => want.has(t)).length
    if (score > bestScore) { bestScore = score; best = r }
  }
  return bestScore > 0 ? best : null
}
