// Developer Review System — review model (constants + validators).
//
// v2: flat, fast-to-fill shape. The old 12-score + 12-tag rubric was too slow
// to fill per build and nothing consumed the granularity — replaced with a
// single tap (love/okay/needs_work) plus an optional multi-select flag row
// that only appears for okay/needs_work, plus one note. This is what makes
// bulk export → paste-into-a-chat → pattern-analysis actually usable.
//
// Dev-only feature; this module has no side effects and no production coupling.

export const REVIEW_SCHEMA_VERSION = 2

export const RATINGS = Object.freeze(['love', 'okay', 'needs_work'])
export const RATING_LABELS = Object.freeze({ love: 'Love', okay: 'Okay', needs_work: 'Needs Work' })

// 6 flags (fixed order), only shown/settable for okay/needs_work.
export const FLAG_KEYS = Object.freeze(['copy', 'visual_design', 'images', 'layout', 'trust_signals', 'overall_feel'])
export const FLAG_LABELS = Object.freeze({
  copy: 'Copy', visual_design: 'Visual Design', images: 'Images',
  layout: 'Layout', trust_signals: 'Trust Signals', overall_feel: 'Overall Feel',
})

const RATING_SET = new Set(RATINGS)
const FLAG_SET = new Set(FLAG_KEYS)

export function emptyReview(buildId = null, projectId = null) {
  return {
    buildId: buildId || null,
    projectId: projectId || null,
    rating: null,
    flags: [],
    note: '',
    reviewVersion: REVIEW_SCHEMA_VERSION,
  }
}

// Validate a review (full or partial patch). Returns { valid, errors }.
export function validateReview(obj) {
  const errors = []
  if (!obj || typeof obj !== 'object') return { valid: false, errors: ['review is not an object'] }
  if (obj.rating != null && !RATING_SET.has(obj.rating)) errors.push(`rating: must be one of ${RATINGS.join('|')} or null`)
  if (obj.flags != null) {
    if (!Array.isArray(obj.flags)) errors.push('flags: must be an array')
    else for (const f of obj.flags) if (!FLAG_SET.has(f)) errors.push(`flags: unknown flag "${f}"`)
  }
  if (obj.note != null && typeof obj.note !== 'string') errors.push('note: must be a string')
  return { valid: errors.length === 0, errors }
}

// Merge a partial patch into a prior review (for debounced autosave upserts).
// `flags` is replaced wholesale (it's a small multi-select, not a keyed map).
// Picking a rating of 'love' clears flags — they only apply to okay/needs_work.
export function mergeReview(prev, patch) {
  const base = prev && typeof prev === 'object' ? prev : emptyReview(patch?.buildId, patch?.projectId)
  const p = patch && typeof patch === 'object' ? patch : {}
  const rating = 'rating' in p ? p.rating : (base.rating ?? null)
  const flags = 'flags' in p
    ? (Array.isArray(p.flags) ? p.flags.filter(f => FLAG_SET.has(f)) : [])
    : (rating === 'love' ? [] : (base.flags || []))
  return {
    buildId: p.buildId ?? base.buildId ?? null,
    projectId: p.projectId ?? base.projectId ?? null,
    rating,
    flags: rating === 'love' ? [] : flags,
    note: 'note' in p ? (p.note || '') : (base.note || ''),
    reviewVersion: base.reviewVersion || REVIEW_SCHEMA_VERSION,
  }
}
