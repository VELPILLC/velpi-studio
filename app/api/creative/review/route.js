export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { isDevReviewServer } from '../../../../lib/creative/flags.mjs'
import { VIEWPORTS, validateReview, mergeReview, emptyReview } from '../../../../lib/creative/review.mjs'
import { getReview, saveReview } from '../../../../lib/creative/persistence.mjs'

// Developer Review — autosave upsert + rehydrate (DEV ONLY).
//   POST { buildId, projectId?, viewport, rating?, flags?, note? }  (partial patch)
//   GET  ?buildId=&viewport=  -> existing review for that device view
// Independent of the Creative Intelligence Layer — buildId is generated for
// every run whether or not CIL shadow mode is on. Refuses in production.
// Never touches generation.
//
// viewport ('mobile' | 'desktop') is required on every save — a rating always
// belongs to the device view it was given in, and a mobile rating never
// overwrites a desktop one for the same build.

function toClientShape(row) {
  return row
    ? { buildId: row.run_id, projectId: row.project_id, viewport: row.viewport, rating: row.rating, flags: row.flags || [], note: row.notes || '', reviewVersion: row.review_version }
    : null
}

export async function POST(request) {
  if (!isDevReviewServer()) return Response.json({ ok: false, disabled: true })
  try {
    const patch = await request.json()
    if (!patch?.buildId && !patch?.projectId) {
      return Response.json({ ok: false, error: 'Need a buildId (or projectId) to attach the review.' })
    }
    if (!VIEWPORTS.includes(patch?.viewport)) {
      return Response.json({ ok: false, error: `viewport is required and must be one of ${VIEWPORTS.join('|')}` })
    }
    const { valid, errors } = validateReview(patch)
    if (!valid) return Response.json({ ok: false, error: 'Invalid review patch.', errors })

    const existing = patch.buildId ? await getReview(patch.buildId, patch.viewport) : null
    const prior = toClientShape(existing) || emptyReview(patch.buildId, patch.projectId, patch.viewport)

    const merged = mergeReview(prior, patch)
    const res = await saveReview(merged)
    return Response.json({ ok: true, review: merged, persisted: res })
  } catch (err) {
    return Response.json({ ok: false, error: err?.message || 'review save failed' })
  }
}

export async function GET(request) {
  if (!isDevReviewServer()) return Response.json({ ok: false, disabled: true })
  try {
    const url = new URL(request.url)
    const buildId = url.searchParams.get('buildId')
    const viewport = url.searchParams.get('viewport')
    if (!buildId) return Response.json({ ok: false, error: 'buildId required' })
    if (!VIEWPORTS.includes(viewport)) return Response.json({ ok: false, error: `viewport is required and must be one of ${VIEWPORTS.join('|')}` })
    const row = await getReview(buildId, viewport)
    const review = toClientShape(row) || emptyReview(buildId, null, viewport)
    return Response.json({ ok: true, review, exists: !!row })
  } catch (err) {
    return Response.json({ ok: false, error: err?.message || 'review fetch failed' })
  }
}
