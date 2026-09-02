// SAVED SKILLS — the library that grows from outcomes you approved.
//
// This is deliberately NOT adaptive learning. Nothing here changes on its own
// from build history, because a system that silently rewrites its own rules is
// unpredictable and can wreck a build that would otherwise have been fine.
// Instead: you select something you liked in Inspect & Fix, it is distilled
// into a named, readable entry, and from then on it is a catalogue option
// scored exactly like the built-in ones. The library grows; the rules never
// move by themselves. Every entry is inspectable and deletable.
//
// A captured element is NOT reusable as captured — it carries one business's
// copy, images and hex codes. What gets stored is the DISTILLED recipe: the
// treatment expressed so it can be re-applied to a different business with
// different colors and content. Distillation happens in /api/save-skill; this
// module owns the shape, the scoring and the selection.
//
// Storage is Supabase, not a repo file: Vercel's filesystem is read-only at
// runtime, so a file-backed library would appear to work locally and silently
// never persist in production.

import { stableHash } from './sectionFamily.mjs'

// What a saved skill can govern. `kind` decides how it competes for a slot,
// which is the whole coherence guard for a single mixed catalogue.
export const SKILL_KINDS = ['hero', 'section', 'detail']

// Detail skills compete within their own lane, so two saved button treatments
// can never both apply to one page.
export const DETAIL_CATEGORIES = ['type', 'card', 'button', 'motion', 'surface', 'layout', 'other']

// More than a few detail skills on one page stops being a style and starts
// being a collision of borrowed parts.
export const MAX_DETAIL_SKILLS = 3

function slug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function cleanNiches(value) {
  const raw = Array.isArray(value)
    ? value
    : String(value || '').split(/[,\n]/)
  return [...new Set(
    raw.map(n => String(n || '').trim().toLowerCase()).filter(Boolean),
  )].slice(0, 12)
}

/**
 * Shape and validate one stored row into a usable catalogue entry.
 * Returns null for anything unusable rather than letting a malformed row reach
 * the build prompt — a half-formed recipe is worse than no recipe.
 */
export function normalizeSavedSkill(raw) {
  if (!raw || typeof raw !== 'object') return null

  const recipe = String(raw.recipe || '').trim()
  // A recipe shorter than this cannot carry a real treatment; it is almost
  // always a failed distillation.
  if (recipe.length < 80) return null

  const kind = SKILL_KINDS.includes(raw.kind) ? raw.kind : 'detail'
  const name = String(raw.name || '').trim() || 'Untitled treatment'
  const id = String(raw.id || '').trim() || slug(name) || `skill-${stableHash(recipe)}`

  let category = String(raw.category || '').trim().toLowerCase()
  if (kind === 'detail' && !DETAIL_CATEGORIES.includes(category)) category = 'other'
  if (kind === 'hero') category = 'hero'
  if (kind === 'section' && !category) category = 'features'

  return {
    id,
    name,
    kind,
    category,
    recipe,
    niches: cleanNiches(raw.niches),
    universal: raw.universal === true,
    sourceDomain: String(raw.sourceDomain || raw.source_domain || '').trim() || null,
    createdAt: raw.createdAt || raw.created_at || null,
  }
}

export function normalizeSavedSkills(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map(normalizeSavedSkill)
    .filter(Boolean)
}

/**
 * Score a saved skill against this business.
 *
 * A skill captured from a restaurant should surface strongly for restaurants
 * and weakly for a machine shop — unless it was explicitly marked universal,
 * which is how a purely formal treatment (a type pairing, a shadow language)
 * escapes the niche it happened to be born in.
 */
export function scoreSavedSkill(skill, { industryText = '' } = {}) {
  const text = String(industryText || '').toLowerCase()
  let score = 0

  let hits = 0
  for (const n of skill.niches || []) {
    if (n && text.includes(n)) hits++
  }
  score += Math.min(12, hits * 6)

  // Universal entries stay eligible everywhere, but never outrank a genuine
  // niche match — a treatment proven in this exact industry wins.
  if (skill.universal) score += 4
  else if (hits === 0) score -= 6

  return score
}

// Below this, a saved skill is a bad enough fit that applying it would hurt
// the page more than leaving the slot to the built-in engines.
export const ELIGIBILITY_FLOOR = 0

/**
 * Choose which saved skills apply to this page.
 *
 * The coherence guard for a single mixed catalogue lives here:
 *   - at most ONE hero skill (it competes with the built-in hero treatment)
 *   - at most one section skill per section category
 *   - at most MAX_DETAIL_SKILLS details, one per detail category
 *
 * Deterministic per domain, same as every other engine: the same business
 * always resolves to the same set, so the regeneration contract holds.
 */
export function selectSavedSkills(skills, {
  analysis = {},
  domain = '',
  sectionOrder = [],
  forcedIds = [],
  maxDetails = MAX_DETAIL_SKILLS,
} = {}) {
  const pool = normalizeSavedSkills(skills)
  const industryText = [
    analysis.industry, analysis.niche, analysis.primary_service, analysis.business_type,
  ].filter(Boolean).join(' ').toLowerCase()

  const forced = new Set((forcedIds || []).filter(Boolean))
  const wantedSections = new Set(sectionOrder || [])

  const scored = pool
    .map(s => ({ s, score: forced.has(s.id) ? Infinity : scoreSavedSkill(s, { industryText }) }))
    // Stable ordering before the tie-break so selection never depends on the
    // order rows came back from the database.
    .sort((a, b) => b.score - a.score || (a.s.id < b.s.id ? -1 : 1))

  const eligible = scored.filter(x => x.score >= ELIGIBILITY_FLOOR || forced.has(x.s.id))

  const pickOne = (candidates, seedKey) => {
    if (!candidates.length) return null
    const forcedHit = candidates.find(x => forced.has(x.s.id))
    if (forcedHit) return forcedHit.s
    const top = candidates[0].score
    const ties = candidates.filter(x => x.score >= top - 1)
    return ties[stableHash(`${domain}|${seedKey}`) % ties.length].s
  }

  const hero = pickOne(eligible.filter(x => x.s.kind === 'hero'), 'saved-hero')

  const sections = []
  const usedSectionCats = new Set()
  for (const cat of [...new Set(eligible.filter(x => x.s.kind === 'section').map(x => x.s.category))]) {
    // Only apply a section skill to a section this page actually has.
    if (wantedSections.size && !wantedSections.has(cat)) continue
    if (usedSectionCats.has(cat)) continue
    const pick = pickOne(eligible.filter(x => x.s.kind === 'section' && x.s.category === cat), `saved-section-${cat}`)
    if (pick) { sections.push(pick); usedSectionCats.add(cat) }
  }

  const details = []
  const usedDetailCats = new Set()
  for (const x of eligible.filter(e => e.s.kind === 'detail')) {
    if (details.length >= maxDetails) break
    if (usedDetailCats.has(x.s.category)) continue
    const pick = pickOne(eligible.filter(e => e.s.kind === 'detail' && e.s.category === x.s.category), `saved-detail-${x.s.category}`)
    if (pick) { details.push(pick); usedDetailCats.add(pick.category) }
  }

  return {
    hero,
    sections,
    details,
    applied: [hero, ...sections, ...details].filter(Boolean),
    considered: scored.map(x => ({ id: x.s.id, kind: x.s.kind, score: x.score })),
  }
}

/**
 * The block spliced into the build prompt.
 *
 * Saved skills are stated as adopted DIRECTION, not as code to paste: the
 * captured page's copy and palette belong to a different business, and the
 * page-wide structure and coherence rules still outrank them.
 */
export function savedSkillsPromptBlock(selection) {
  const applied = selection?.applied || []
  if (!applied.length) return ''

  const lines = applied.map(s => {
    const where = s.kind === 'hero'
      ? 'HERO'
      : s.kind === 'section'
        ? `SECTION: ${s.category}`
        : `DETAIL: ${s.category}`
    return `- [${where}] ${s.name}\n    ${s.recipe.replace(/\n/g, '\n    ')}`
  })

  return `SAVED TREATMENTS — the operator explicitly approved these from earlier work and wants them reused here. Apply them as creative DIRECTION, re-expressed in THIS business's palette, copy and imagery — never copy the original's colors, wording or content. They rank with the DESIGN BRIEF: they lose to the brand's real identity, to factual content, and to the assigned section blueprints' structure and measurements, and they win over your own defaults for everything else.
${lines.join('\n')}`
}
