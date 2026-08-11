import manifest from '../presets/sections/manifest.json'

// Section/layout reference pass: for each build, pick a handful of harvested
// structural patterns (hero, pricing, testimonials, footer…) that match the
// page's persuasion flow. They're handed to the builder as REFERENCES to study
// and re-express in its own scoped CSS — never copied verbatim (the originals
// are Tailwind/React; the output is plain scoped CSS).

const SECTION_TO_CATEGORY = {
  hero: 'hero',
  services: 'features',
  menu: 'pricing',
  pricing: 'pricing',
  reviews: 'testimonials',
  testimonials: 'testimonials',
  about: 'features',
  gallery: 'card',
  stats: 'stats',
  credentials: 'stats',
  hours: 'footer',
  contact: 'cta',
  faq: 'faq',
  footer: 'footer',
  team: 'card',
  process: 'features',
  location: 'cta',
  locations: 'card',
  offer: 'cta',
  cta: 'cta',
  booking: 'cta',
  awards: 'stats',
  press: 'stats',
  menu_highlights: 'pricing',
  shipping: 'features',
  story: 'features',
  sustainability: 'features',
  header: 'nav',
  nav: 'nav',
}

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
const FRAMEWORK_WEIGHT = { 'html-css': 2, 'html-tailwind': 1, css: 0 }

function stableHash(s) {
  let h = 0
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function pickSectionBlueprints(analysis, { lockedMap = null, maxRefs = 12 } = {}) {
  const entries = (manifest.sections || []).filter(s => s.reference && s.framework !== 'react-tsx')
  if (!entries.length) return { refs: [], map: {} }

  const flow = analysis?.layout?.section_order || analysis?.sections || []
  const industryText = `${analysis?.industry || ''} ${analysis?.niche || ''}`.toLowerCase()
  const domain = analysis?._source?.domain || analysis?.business_name || ''

  const rankedForCategory = cat => entries
    .filter(e => e.category === cat)
    .map(e => {
      let score = FRAMEWORK_WEIGHT[e.framework] ?? 0
      for (const niche of e.niches || []) {
        if (niche && industryText.includes(String(niche).toLowerCase())) score += 3
      }
      return { e, score }
    })
    .sort((a, b) => b.score - a.score || (a.e.id < b.e.id ? -1 : 1))

  const rankedCache = {} // category -> ranked candidate list
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
  const keys = ['nav', 'footer', ...flow.map(k => String(k).toLowerCase())]
  for (const key of keys) {
    if (map[key]) continue
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
    // First use of a category: choose among NEAR-TIES — everything within
    // one point of the top score — so a decisively niche-matched winner
    // still can't be beaten by a weak pattern, but close seconds rotate
    // across businesses instead of one entry monopolizing a whole niche.
    // Repeat uses widen to the top-3 so six same-category sections don't
    // all clone one pattern. Both choices hash on (domain, section) —
    // fully deterministic per input.
    const nth = usedPerCategory[cat] || 0
    usedPerCategory[cat] = nth + 1
    const nearTies = ranked.filter(x => x.score >= ranked[0].score - 1).length
    const window = nth === 0 ? nearTies : Math.min(3, ranked.length)
    const idx = (stableHash(`${domain}:${key}`) + nth) % window
    assign(key, ranked[idx].e, cat)
  }
  return { refs, map }
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
