// Developer Review System — review model (constants + validators).
//
// Per docs/DEV_REVIEW_SYSTEM.md §3. Pure + versioned so the rubric stays stable
// for longitudinal learning. Node-testable. Dev-only feature; this module has no
// side effects and no production coupling.

export const REVIEW_SCHEMA_VERSION = 1

// 12 score dimensions (fixed order — the training data depends on this).
export const SCORE_DIMENSIONS = Object.freeze([
  'overall', 'premium_feel', 'originality', 'conversion',
  'brand_consistency', 'typography', 'color_system', 'layout',
  'spacing', 'animations', 'images', 'mobile',
])
export const SCORE_LABELS = Object.freeze({
  overall: 'Overall quality', premium_feel: 'Premium feel', originality: 'Originality',
  conversion: 'Conversion potential', brand_consistency: 'Brand consistency', typography: 'Typography',
  color_system: 'Color system', layout: 'Layout', spacing: 'Spacing', animations: 'Animations',
  images: 'Images', mobile: 'Mobile experience',
})

// 12 section tags (fixed order).
export const TAG_KEYS = Object.freeze([
  'hero', 'navigation', 'typography', 'colors', 'layout', 'cards',
  'cta', 'images', 'animations', 'footer', 'mobile', 'copy',
])
export const TAG_LABELS = Object.freeze({
  hero: 'Hero', navigation: 'Navigation', typography: 'Typography', colors: 'Colors',
  layout: 'Layout', cards: 'Cards', cta: 'CTA', images: 'Images', animations: 'Animations',
  footer: 'Footer', mobile: 'Mobile', copy: 'Copy',
})

export const TAG_VERDICTS = Object.freeze(['love', 'needs_work', 'dislike'])
export const REVIEW_FLAGS = Object.freeze(['love', 'regenerate', 'dislike'])

const SCORE_SET = new Set(SCORE_DIMENSIONS)
const TAG_SET = new Set(TAG_KEYS)
const VERDICT_SET = new Set(TAG_VERDICTS)
const FLAG_SET = new Set(REVIEW_FLAGS)

export function emptyReview(runId = null, projectId = null) {
  return {
    runId: runId || null,
    projectId: projectId || null,
    reviewer: 'dev',
    flag: null,
    scores: {},
    tags: {},
    notes: '',
    reviewVersion: REVIEW_SCHEMA_VERSION,
  }
}

// Validate a review (full or partial). Returns { valid, errors }.
export function validateReview(obj) {
  const errors = []
  if (!obj || typeof obj !== 'object') return { valid: false, errors: ['review is not an object'] }
  if (obj.flag != null && !FLAG_SET.has(obj.flag)) errors.push(`flag: must be one of ${REVIEW_FLAGS.join('|')}`)
  if (obj.scores != null) {
    if (typeof obj.scores !== 'object' || Array.isArray(obj.scores)) errors.push('scores: must be an object')
    else for (const [k, v] of Object.entries(obj.scores)) {
      if (!SCORE_SET.has(k)) errors.push(`scores.${k}: unknown dimension`)
      else if (v != null && !(Number.isInteger(v) && v >= 1 && v <= 10)) errors.push(`scores.${k}: must be an integer 1..10 or null`)
    }
  }
  if (obj.tags != null) {
    if (typeof obj.tags !== 'object' || Array.isArray(obj.tags)) errors.push('tags: must be an object')
    else for (const [k, v] of Object.entries(obj.tags)) {
      if (!TAG_SET.has(k)) errors.push(`tags.${k}: unknown tag`)
      else if (v != null && !VERDICT_SET.has(v)) errors.push(`tags.${k}: must be one of ${TAG_VERDICTS.join('|')} or null`)
    }
  }
  if (obj.notes != null && typeof obj.notes !== 'string') errors.push('notes: must be a string')
  return { valid: errors.length === 0, errors }
}

// Merge a partial patch into a prior review (for debounced autosave upserts).
// scores/tags merge key-by-key; setting a value to null clears that key.
export function mergeReview(prev, patch) {
  const base = prev && typeof prev === 'object' ? prev : emptyReview(patch?.runId, patch?.projectId)
  const p = patch && typeof patch === 'object' ? patch : {}
  const scores = { ...(base.scores || {}) }
  if (p.scores) for (const [k, v] of Object.entries(p.scores)) { if (v == null) delete scores[k]; else scores[k] = v }
  const tags = { ...(base.tags || {}) }
  if (p.tags) for (const [k, v] of Object.entries(p.tags)) { if (v == null) delete tags[k]; else tags[k] = v }
  return {
    runId: p.runId ?? base.runId ?? null,
    projectId: p.projectId ?? base.projectId ?? null,
    reviewer: p.reviewer || base.reviewer || 'dev',
    flag: 'flag' in p ? p.flag : (base.flag ?? null),
    scores,
    tags,
    notes: 'notes' in p ? (p.notes || '') : (base.notes || ''),
    reviewVersion: base.reviewVersion || REVIEW_SCHEMA_VERSION,
  }
}

// 0..1 — how much of the rubric was filled (for weighting labels later).
export function reviewCompleteness(review) {
  const r = review || {}
  const flag = r.flag ? 1 : 0
  const filledScores = SCORE_DIMENSIONS.filter(d => Number.isInteger(r.scores?.[d])).length / SCORE_DIMENSIONS.length
  const filledTags = TAG_KEYS.filter(t => VERDICT_SET.has(r.tags?.[t])).length / TAG_KEYS.length
  const notes = r.notes && r.notes.trim() ? 1 : 0
  return Math.round(((flag + filledScores + filledTags + notes) / 4) * 100) / 100
}
