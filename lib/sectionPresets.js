import manifest from '../presets/sections/manifest.json'
import { chooseFamily, planBorrows, rankWithinFamily, permutationFor, CATEGORY_FALLBACK, SECTION_TO_CATEGORY, neededCategoriesFor } from './sectionFamily.mjs'

// Section/layout reference pass: for each build, pick a handful of harvested
// structural patterns (hero, pricing, testimonials, footer…) that match the
// page's persuasion flow. They're handed to the builder as REFERENCES to study
// and re-express in its own scoped CSS — never copied verbatim (the originals
// are Tailwind/React; the output is plain scoped CSS).

// Re-exported from sectionFamily.mjs so the builder and the guided flow can
// never drift apart on what category a section needs.
export { SECTION_TO_CATEGORY }

export function findBlueprint(id) {
  return (manifest.sections || []).find(s => s.id === id && s.reference) || null
}

// Blueprint assignment — the deterministic structural backbone. Unlike the
// legacy pickSectionReferences (up to 4 loose references), this assigns ONE
// authoritative blueprint to EVERY section in the page's flow (plus the nav),
// and returns the explicit section->blueprint map the builder must follow.
//   - Fully deterministic: scoring + a stable per-(domain, section) hash, so
//     the same input always maps to the same skeleton — while sections that
//     share a category still rotate across that category's top candidates
//     instead of six sections repeating one identical pattern.
//   - React component primitives (framework react-tsx) are excluded: they
//     are JS component code, not layout skeletons, and some (carousel)
//     cannot exist in the no-JS output at all. Full HTML/CSS sections rank
//     above bare utility-CSS patterns for the same reason.
//   - A lockedMap ({ sectionKey: blueprintId }) from a previous run is
//     honored per-section; ids that no longer resolve fall back to the
//     deterministic pick so old locks survive library changes.
export function pickSectionBlueprints(analysis, {
  lockedMap = null,
  maxRefs = 12,
  forcedFamily = null, // a locked or guided-mode family choice
  forcedMap = null,    // guided-mode per-section blueprint choices
} = {}) {
  const entries = (manifest.sections || []).filter(s => s.reference && s.framework !== 'react-tsx')
  if (!entries.length) return { refs: [], map: {}, family: null, borrowed: [] }

  const flow = analysis?.layout?.section_order || analysis?.sections || []
  const industryText = `${analysis?.industry || ''} ${analysis?.niche || ''}`.toLowerCase()
  const domain = analysis?._source?.domain || analysis?.business_name || ''

  const keys = ['nav', 'footer', ...flow.map(k => String(k).toLowerCase())]
  const neededCats = neededCategoriesFor(flow)

  // ONE family for the whole page. This is the cohesion fix: the candidate
  // pool below is the winning family's own entries, so every section speaks
  // the same design language instead of each hashing independently across
  // ~22 unrelated codebases.
  const { family } = chooseFamily(entries, { neededCats, industryText, domain, forcedFamily })
  const { borrowFor, borrowed } = family
    ? planBorrows(family, entries, neededCats, { industryText })
    : { borrowFor: {}, borrowed: [] }

  const rankedForCategory = cat => {
    const pool = family?.byCat?.[cat] || []
    if (pool.length) return rankWithinFamily(pool, { industryText, category: cat })
    if (borrowFor[cat]) return [borrowFor[cat]]
    // No borrow available (cap reached, or nothing upstream has it): reuse a
    // structurally adjacent category from inside the family rather than
    // pulling in yet another codebase for one section.
    const alt = CATEGORY_FALLBACK[cat]
    const altPool = alt ? (family?.byCat?.[alt] || []) : []
    return altPool.length ? rankWithinFamily(altPool, { industryText, category: alt }) : []
  }

  const rankedCache = {} // category -> ranked candidate list
  const permCache = {} // category -> a full deterministic permutation of its ranked list
  const usedPerCategory = {} // category -> how many sections drew from it
  const refs = []
  const map = {}

  const assign = (sectionKey, preferred, cat) => {
    let entry = preferred
    if (entry && !refs.includes(entry) && refs.length >= maxRefs) {
      // Ref budget full: reuse an already-included blueprint of this
      // category rather than leaving the section structureless.
      entry = refs.find(r => r.category === cat) || null
    }
    if (!entry) return
    if (!refs.includes(entry)) refs.push(entry)
    map[sectionKey] = entry.id
  }

  // Nav and footer are on every page whether or not the flow names them —
  // both get guaranteed assignments (processed FIRST, so the ref budget can
  // never squeeze them out) and the STRUCTURE manifest stays complete and
  // identical across regenerations.
  for (const key of keys) {
    if (map[key]) continue
    // A guided-mode answer outranks the lock: the user just chose this, and
    // the choice becomes the new lock so it holds on later regenerations.
    const forcedId = forcedMap?.[key]
    const forced = forcedId ? entries.find(e => e.id === forcedId) : null
    if (forced) { assign(key, forced, forced.category); continue }
    // Locked id wins when it still resolves.
    const lockedId = lockedMap?.[key]
    const locked = lockedId ? entries.find(e => e.id === lockedId) : null
    if (locked) { assign(key, locked, locked.category); continue }
    // Unknown section keys get the generic 'features' structure rather than
    // freeform — consistency beats novelty for uncatalogued sections.
    const cat = SECTION_TO_CATEGORY[key] || 'features'
    if (!(cat in rankedCache)) rankedCache[cat] = rankedForCategory(cat)
    const ranked = rankedCache[cat]
    if (!ranked.length) continue
    // Rotation is round-robin across the WHOLE in-family list, via ONE
    // permutation shared by every section that draws from this category —
    // not a per-key hash. A per-key hash looked equivalent but wasn't: when
    // several different section keys default to the same category (e.g.
    // portfolio/trust/services/service_areas all falling through to
    // 'features'), each key's hash is independent, so nothing stopped every
    // one of them from landing on the same residue — which is exactly what
    // stamped one SaaS bento-grid blueprint across four unrelated sections on
    // a real page. A shared permutation guarantees the first `ranked.length`
    // draws are all distinct; only the next one after that repeats.
    if (!(cat in permCache)) permCache[cat] = permutationFor(`${domain}:${cat}`, ranked.length)
    const nth = usedPerCategory[cat] || 0
    usedPerCategory[cat] = nth + 1
    const idx = permCache[cat][nth % ranked.length]
    assign(key, ranked[idx], cat)
  }
  return { refs, map, family: family?.id || null, borrowed }
}

export function pickSectionReferences(analysis, n = 4) {
  const entries = (manifest.sections || []).filter(s => s.reference)
  if (!entries.length) return []

  const flow = analysis?.layout?.section_order || analysis?.sections || []
  const industryText = `${analysis?.industry || ''} ${analysis?.niche || ''}`.toLowerCase()

  const wantedCategories = [...new Set(flow.map(sec => SECTION_TO_CATEGORY[String(sec).toLowerCase()] || null).filter(Boolean))]

  const picked = []
  for (const cat of wantedCategories) {
    if (picked.length >= n) break
    const candidates = entries
      .filter(e => e.category === cat && !picked.includes(e))
      .map(e => {
        let score = 1
        for (const niche of e.niches || []) {
          if (niche && industryText.includes(String(niche).toLowerCase())) score += 2
        }
        return { e, score }
      })
      .sort((a, b) => b.score - a.score)
    if (candidates[0]) picked.push(candidates[0].e)
  }
  return picked.slice(0, n)
}
