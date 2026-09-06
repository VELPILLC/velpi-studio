// Blueprint FAMILY selection — the fix for pages that read as assembled
// rather than designed.
//
// Blueprints were picked one section at a time, each by its own independent
// hash, from a pool spanning ~22 unrelated upstream codebases. A single page
// routinely drew its hero, its cards and its testimonials from three
// different design languages, and the only cross-section logic that existed
// actively pushed them further apart (widening the candidate window on repeat
// use so same-category sections wouldn't look alike). Anti-repetition was
// implemented; anti-incoherence never was.
//
// This commits the whole page to ONE family, scored on how completely that
// family can actually cover the sections this page needs. Where the winning
// family genuinely has no entry for a category, a capped, REPORTED borrow is
// taken from the closest compatible family — visible in the build report
// rather than hidden, because a silent borrow is how incoherence creeps back.
//
// Determinism is preserved throughout: the same domain always resolves to the
// same family and the same map, which the regeneration contract depends on.

// Section key -> blueprint category. Lives here (not in sectionPresets.js)
// because both the builder and the guided flow must derive the SAME needed
// categories — if they disagree, guided mode offers options from a family the
// build won't actually use.
export const SECTION_TO_CATEGORY = {
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
  service_areas: 'card',
  service_area: 'card',
  areas_served: 'card',
  coverage_area: 'card',
  offer: 'cta',
  cta: 'cta',
  booking: 'cta',
  awards: 'stats',
  press: 'stats',
  // A trust bar is fundamentally numbers-and-labels (years, projects,
  // rating, insurance) — the same shape as credentials/awards above, never
  // the generic 'features' bucket. Forcing it into a features blueprint
  // built for feature-tile SaaS copy is what produced a trust bar with a
  // stray photo tile crammed in beside three text blurbs.
  trust: 'stats',
  guarantee: 'stats',
  menu_highlights: 'pricing',
  shipping: 'features',
  story: 'features',
  sustainability: 'features',
  // A portfolio is a photo showcase, not a features list — it belongs with
  // gallery/team in 'card', which is where the actual portfolio-tagged
  // blueprint lives (velpi--card--stacked-profile-tilt).
  portfolio: 'card',
  work: 'card',
  projects: 'card',
  header: 'nav',
  nav: 'nav',
}

// The categories a page actually needs, given its section flow. Nav and
// footer are always present whether or not the flow names them.
export function neededCategoriesFor(sectionOrder) {
  const keys = ['nav', 'footer', ...(sectionOrder || []).map(k => String(k).toLowerCase())]
  return [...new Set(keys.map(k => SECTION_TO_CATEGORY[k] || 'features'))]
}

const FRAMEWORK_WEIGHT = { 'html-css': 2, 'html-tailwind': 1, css: 0 }

// Compatibility between a family's CSS approach — borrowing a Tailwind-shaped
// skeleton into an html-css page costs little, borrowing bare utility CSS
// costs more because it carries no composition of its own.
const FRAMEWORK_AFFINITY = { 'html-css': { 'html-css': 3, 'html-tailwind': 2, css: 0 }, 'html-tailwind': { 'html-tailwind': 3, 'html-css': 2, css: 0 }, css: { css: 3, 'html-css': 1, 'html-tailwind': 1 } }

// When even a borrow isn't available, reuse a structurally adjacent category
// from INSIDE the family — repeating the family's own vocabulary beats
// importing a third codebase for one section.
export const CATEGORY_FALLBACK = {
  nav: 'footer', testimonials: 'card', stats: 'features', pricing: 'card',
  faq: 'features', cta: 'features', card: 'features', hero: 'features',
}

export function stableHash(s) {
  let h = 0
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// A deterministic full permutation of 0..length-1, seeded by `seed`.
//
// This is what actually delivers "repeats don't collide until the pool is
// exhausted" — a property a per-KEY hash cannot provide. When N different
// section keys share one category (e.g. portfolio/trust/services/
// service_areas all defaulting to 'features'), each key hashes independently,
// so nothing stops two unrelated keys from landing on the same residue mod
// the pool size — which is exactly how a page ended up with the SAME
// blueprint stamped across four different sections. A single permutation
// shared by the whole category guarantees its first `length` draws are all
// distinct; only draw `length+1` ever repeats.
export function permutationFor(seed, length) {
  const arr = Array.from({ length }, (_, i) => i)
  let s = stableHash(seed) || 1
  const rand = () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296 }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// The manifest has no `family` field — it carries `source`, which is either
// the literal "velpi original" or an upstream URL. Derive a stable family id.
export function familyOf(entry) {
  const src = String(entry?.source || '').trim()
  if (!src) return 'unknown'
  if (/velpi/i.test(src)) return 'velpi'
  const gh = /github\.com\/[^/]+\/([^/#?]+)/i.exec(src)
  if (gh) return gh[1].toLowerCase()
  const host = /^https?:\/\/(?:www\.)?([^/]+)/i.exec(src)
  if (host) return host[1].split('.')[0].toLowerCase()
  return src.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'
}

export function groupFamilies(entries) {
  const families = new Map()
  for (const e of entries || []) {
    const id = familyOf(e)
    if (!families.has(id)) families.set(id, { id, entries: [], byCat: {}, frameworks: {} })
    const fam = families.get(id)
    fam.entries.push(e)
    ;(fam.byCat[e.category] = fam.byCat[e.category] || []).push(e)
    fam.frameworks[e.framework] = (fam.frameworks[e.framework] || 0) + 1
  }
  // A family's framework is whichever its entries mostly use.
  for (const fam of families.values()) {
    fam.framework = Object.entries(fam.frameworks).sort((a, b) => b[1] - a[1])[0]?.[0] || 'css'
  }
  return families
}

export function scoreFamily(fam, { neededCats = [], industryText = '' } = {}) {
  const covered = neededCats.filter(c => (fam.byCat[c] || []).length).length
  const missing = neededCats.length - covered
  let nicheHits = 0
  for (const e of fam.entries) {
    for (const n of e.niches || []) {
      if (n && industryText.includes(String(n).toLowerCase())) nicheHits++
    }
  }
  // Depth matters: a family with two options in a category can vary across
  // repeated sections without leaving the family.
  const depth = neededCats.filter(c => (fam.byCat[c] || []).length >= 2).length
  return (covered * 10) - (missing * 6)
    + (FRAMEWORK_WEIGHT[fam.framework] ?? 0) * 2
    + Math.min(6, nicheHits)
    + Math.min(3, depth)
}

/**
 * Pick the ONE family the page commits to.
 * Near-ties break on a domain hash so different businesses still diverge,
 * while any single business is perfectly reproducible.
 */
export function chooseFamily(entries, { neededCats = [], industryText = '', domain = '', forcedFamily = null } = {}) {
  const families = groupFamilies(entries)
  if (!families.size) return { family: null, runnerUp: null, scores: [] }

  if (forcedFamily && families.has(forcedFamily)) {
    const rest = [...families.values()].filter(f => f.id !== forcedFamily)
      .map(f => ({ id: f.id, score: scoreFamily(f, { neededCats, industryText }) }))
      .sort((a, b) => b.score - a.score)
    return {
      family: families.get(forcedFamily),
      runnerUp: rest[0] ? families.get(rest[0].id) : null,
      scores: [{ id: forcedFamily, score: Infinity, forced: true }, ...rest],
    }
  }

  const scored = [...families.values()]
    .map(f => ({ f, score: scoreFamily(f, { neededCats, industryText }) }))
    .sort((a, b) => b.score - a.score || (a.f.id < b.f.id ? -1 : 1))

  const top = scored[0].score
  const nearTies = scored.filter(s => s.score >= top - 1)
  const pick = nearTies[stableHash(`${domain}|family`) % nearTies.length]
  return {
    family: pick.f,
    runnerUp: scored.find(s => s.f.id !== pick.f.id)?.f || null,
    scores: scored.map(s => ({ id: s.f.id, score: s.score })),
  }
}

/**
 * Cover categories the winning family lacks, from the closest compatible
 * family, capped. Every borrow is returned for disclosure.
 */
export function planBorrows(family, entries, neededCats, { maxBorrow = 2, industryText = '' } = {}) {
  const borrowFor = {}
  const borrowed = []
  if (!family) return { borrowFor, borrowed }

  const families = groupFamilies(entries)
  const gaps = neededCats.filter(c => !(family.byCat[c] || []).length)

  for (const cat of gaps) {
    if (borrowed.length >= maxBorrow) break
    const donors = [...families.values()]
      .filter(f => f.id !== family.id && (f.byCat[cat] || []).length)
      .map(f => ({
        f,
        affinity: (FRAMEWORK_AFFINITY[family.framework]?.[f.framework] ?? 0)
          + scoreFamily(f, { neededCats, industryText }) / 100,
      }))
      .sort((a, b) => b.affinity - a.affinity || (a.f.id < b.f.id ? -1 : 1))
    if (!donors.length) continue
    const donor = donors[0].f
    const entry = [...donor.byCat[cat]].sort((a, b) => (a.id < b.id ? -1 : 1))[0]
    borrowFor[cat] = entry
    borrowed.push({ category: cat, blueprintId: entry.id, fromFamily: donor.id, reason: `the ${family.id} family has no ${cat} blueprint` })
  }
  return { borrowFor, borrowed }
}

// Rank within the committed family. Same signals as before (framework, niche,
// real desktop composition for heroes) — the pool is just no longer global.
export function rankWithinFamily(pool, { industryText = '', category = '' } = {}) {
  return [...(pool || [])]
    .map(e => {
      let score = FRAMEWORK_WEIGHT[e.framework] ?? 0
      for (const n of e.niches || []) {
        if (n && industryText.includes(String(n).toLowerCase())) score += 3
      }
      // A centered hero blown up to 1440px is the loudest "phone site on
      // desktop" tell, so heroes with a real multi-column composition rank up.
      if (category === 'hero' && /grid-template-columns/i.test(String(e.reference || ''))) score += 1
      return { e, score }
    })
    .sort((a, b) => b.score - a.score || (a.e.id < b.e.id ? -1 : 1))
    .map(x => x.e)
}
