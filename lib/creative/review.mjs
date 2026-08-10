// Developer Review System — review model (constants + validators).
//
// v2: flat, fast-to-fill shape. The old 12-score + 12-tag rubric was too slow
// to fill per build and nothing consumed the granularity — replaced with a
// single tap (love/okay/needs_work) plus an optional multi-select flag row
// that only appears for okay/needs_work, plus one note. This is what makes
// bulk export → paste-into-a-chat → pattern-analysis actually usable.
//
// v3: viewport-scoped. A rating now always belongs to a specific device view
// (mobile or desktop) — a layout complaint on mobile and one on desktop
// usually point to different fixes, so they're never merged into one rating.
// Flags are narrowed to four that map directly to the systems that get fixed
// (preset/variance logic, image generation, crawl-based trust-badge
// detection, copy generation) — anything else wasn't actionable.
//
// v4: the single love/okay/needs_work rating plus flags array is replaced by
// five fixed 1-5 questions, asked in a fixed order (overall, layout, images,
// trust, copy). This gives per-area granularity back without reintroducing
// the old 12-score rubric's fill-time cost — it's still one screen, still
// fast, but now yields a signal per system instead of one blended tap.
//
// Dev-only feature; this module has no side effects and no production coupling.

export const REVIEW_SCHEMA_VERSION = 4

// 5 fixed questions (fixed order = question order 1-5).
export const SCORE_KEYS = Object.freeze(['overall', 'layout', 'images', 'trust', 'copy'])
export const SCORE_LABELS = Object.freeze({
  overall: 'Overall', layout: 'Layout & Design', images: 'Images', trust: 'Trust Signals', copy: 'Copy',
})
// Only 'overall' gets custom question text; the rest show just their label.
export const SCORE_QUESTIONS = Object.freeze({ overall: 'Does this feel premium or generic?' })

export const SCORE_MIN = 1
export const SCORE_MAX = 5
export const LOW_SCORE_MAX = 3

export function isLowScore(v) { return typeof v === 'number' && v <= LOW_SCORE_MAX }

// Every rating belongs to exactly one device viewport it was given in.
export const VIEWPORTS = Object.freeze(['mobile', 'desktop'])
export const VIEWPORT_LABELS = Object.freeze({ mobile: 'Mobile', desktop: 'Desktop' })

const SCORE_SET = new Set(SCORE_KEYS)
const VIEWPORT_SET = new Set(VIEWPORTS)

function emptyScores() {
  return Object.fromEntries(SCORE_KEYS.map(k => [k, null]))
}

export function emptyReview(buildId = null, projectId = null, viewport = null) {
  return {
    buildId: buildId || null,
    projectId: projectId || null,
    viewport: VIEWPORT_SET.has(viewport) ? viewport : null,
    scores: emptyScores(),
    note: '',
    reviewVersion: REVIEW_SCHEMA_VERSION,
    updatedAt: null, // set from the DB row once this review has actually been saved
  }
}

// Validate a review (full or partial patch). Returns { valid, errors }.
export function validateReview(obj) {
  const errors = []
  if (!obj || typeof obj !== 'object') return { valid: false, errors: ['review is not an object'] }
  if (obj.viewport != null && !VIEWPORT_SET.has(obj.viewport)) errors.push(`viewport: must be one of ${VIEWPORTS.join('|')}`)
  if (obj.scores != null) {
    if (typeof obj.scores !== 'object' || Array.isArray(obj.scores)) errors.push('scores: must be an object')
    else {
      for (const [k, v] of Object.entries(obj.scores)) {
        if (!SCORE_SET.has(k)) { errors.push(`scores: unknown key "${k}"`); continue }
        if (v == null) continue
        if (!Number.isInteger(v) || v < SCORE_MIN || v > SCORE_MAX) {
          errors.push(`scores.${k}: must be an integer between ${SCORE_MIN} and ${SCORE_MAX} or null`)
        }
      }
    }
  }
  if (obj.note != null && typeof obj.note !== 'string') errors.push('note: must be a string')
  return { valid: errors.length === 0, errors }
}

// Merge a partial patch into a prior review (for debounced autosave upserts).
// `note` is replaced wholesale, but ONLY when the literal key 'note' is
// present in patch (including an empty string) — otherwise it carries over
// from prev unchanged. Callers must always send the FULL current note text
// whenever they include it at all, never a fragment to append.
// `scores` is deep-merged key by key: start from prev.scores (or all-null
// defaults if prev has none), then overwrite only the keys present in
// patch.scores. A patch will typically only ever contain ONE scores key at a
// time — unanswered keys must never be reset to null by a later patch.
// `viewport` is sticky once set (a patch normally always carries it, since the
// caller always knows which device view it's rating).
// `reviewVersion` always advances to at least the CURRENT schema version on
// every merge — it never carries a stale pre-v4 stamp forward. A build with
// an old rating/flags row from before this migration gets its version
// upgraded the moment it's touched with new scores data; that's what makes
// it eligible for the v4-only export filter in listReviewsForExport.
export function mergeReview(prev, patch) {
  const base = prev && typeof prev === 'object' ? prev : emptyReview(patch?.buildId, patch?.projectId, patch?.viewport)
  const p = patch && typeof patch === 'object' ? patch : {}
  const baseScores = (base.scores && typeof base.scores === 'object') ? base.scores : emptyScores()
  const scores = { ...emptyScores(), ...baseScores }
  if (p.scores && typeof p.scores === 'object' && !Array.isArray(p.scores)) {
    for (const k of SCORE_KEYS) if (k in p.scores) scores[k] = p.scores[k]
  }
  return {
    buildId: p.buildId ?? base.buildId ?? null,
    projectId: p.projectId ?? base.projectId ?? null,
    viewport: (VIEWPORT_SET.has(p.viewport) ? p.viewport : null) ?? base.viewport ?? null,
    scores,
    note: 'note' in p ? (p.note || '') : (base.note || ''),
    reviewVersion: Math.max(Number(base.reviewVersion) || 0, REVIEW_SCHEMA_VERSION),
    updatedAt: 'updatedAt' in p ? p.updatedAt : (base.updatedAt ?? null),
  }
}
