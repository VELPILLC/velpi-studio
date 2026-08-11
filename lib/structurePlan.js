// Deterministic structure planning — the backbone of "regenerate = refine,
// not reroll". For a given (domain) input, every STRUCTURAL choice — design
// systems, signature motion, per-section blueprint, section order — resolves
// the same way on every run:
//
//   1. All selection randomness is a seeded PRNG keyed by the domain, so the
//      same input hashes to the same picks with zero storage.
//   2. A structure LOCK (captured on the first successful run, persisted by
//      the client per-domain and inside saved projects) pins the exact ids —
//      including the section_order the analyze model emitted on run one —
//      so later regenerations survive analyze's nondeterminism and library
//      changes without the skeleton shifting.
//
// Creative expression (fonts, palette, copy, imagery) stays free to vary
// downstream; only structure is planned here.

import { pickCreativeMix, findBuiltIn } from './designStyles'
import { pickSignatureMotion } from './motionPresets'
import { pickSectionBlueprints, findBlueprint } from './sectionPresets'

// xmur3 string hash -> mulberry32 PRNG. Deterministic across runs/platforms.
export function seededRng(seedText) {
  let h = 1779033703 ^ String(seedText).length
  for (let i = 0; i < String(seedText).length; i++) {
    h = Math.imul(h ^ String(seedText).charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = (() => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  })()
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function resolveStyleById(allStyles, id) {
  return allStyles.find(s => s.id === id) || findBuiltIn(id) || null
}

// Plan (or re-resolve) the full structural skeleton for one business.
//   analysis      — the analyze model's output (must carry _source.domain)
//   allStyles     — full style library (built-ins + DB rows)
//   vibe          — vibe text (nudges style/motion scoring, not structure ids)
//   lock          — a previously issued lock to honor (regeneration path)
//   manualStyleId — creator picked one style explicitly; overrides the mix
// Returns { sectionOrder, styles, motion, sectionRefs, sectionMap, lock }.
// The returned lock is the serializable record the client persists and sends
// back on the next regeneration of the same input.
export function planStructure({ analysis, allStyles, vibe = '', lock = null, manualStyleId = null }) {
  const domain = analysis?._source?.domain || analysis?.business_name || 'velpi-site'
  const rng = seededRng(`velpi-structure:${domain}`)

  // Section order: the lock's order (captured from run one's analyze) always
  // wins — this is what makes regeneration structurally stable even though
  // analyze re-runs nondeterministically.
  const freshOrder = analysis?.layout?.section_order?.length
    ? analysis.layout.section_order
    : (analysis?.sections || [])
  const sectionOrder = lock?.sectionOrder?.length ? lock.sectionOrder : freshOrder

  // Design systems: manual pick > locked ids > deterministic seeded mix.
  const nicheText = `${analysis?.industry || ''} ${analysis?.niche || ''} ${analysis?.primary_service || ''}`
  const vibeText = `${vibe || ''} ${analysis?.tone || ''} ${analysis?.brand?.brand_personality || ''} ${analysis?.brand?.design_language || ''}`
  let styles = []
  if (manualStyleId) {
    const manual = resolveStyleById(allStyles, manualStyleId)
    if (manual) styles = [manual]
  }
  if (!styles.length && Array.isArray(lock?.styleIds) && lock.styleIds.length) {
    styles = lock.styleIds.map(id => resolveStyleById(allStyles, id)).filter(Boolean)
  }
  if (!styles.length) {
    styles = pickCreativeMix(allStyles, nicheText, vibeText, 3, [], rng)
  }

  // Signature motion: locked id > deterministic seeded pick.
  let motion = null
  if (lock?.motionId) {
    motion = pickSignatureMotion(analysis, vibeText, [], null, lock.motionId)
  }
  if (!motion) {
    motion = pickSignatureMotion(analysis, vibeText, [], rng)
  }

  // Section blueprints: one authoritative reference per section (locked map
  // honored per-section; anything missing re-resolves deterministically).
  const { refs: sectionRefs, map: sectionMap } = pickSectionBlueprints(
    { ...analysis, layout: { ...(analysis?.layout || {}), section_order: sectionOrder } },
    { lockedMap: lock?.sectionMap || null },
  )

  return {
    sectionOrder,
    styles,
    motion,
    sectionRefs,
    sectionMap,
    lock: {
      v: 1,
      domain,
      sectionOrder,
      styleIds: styles.map(s => s.id).filter(Boolean),
      motionId: motion?.id || null,
      sectionMap,
      plannedAt: lock?.plannedAt || new Date().toISOString(),
    },
  }
}
