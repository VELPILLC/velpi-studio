export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { isDevReviewServer } from '../../../../lib/creative/flags.mjs'
import { validateReview, mergeReview, emptyReview } from '../../../../lib/creative/review.mjs'
import { getReview, saveReview } from '../../../../lib/creative/persistence.mjs'

// Developer Review — autosave upsert + rehydrate (DEV ONLY).
//   POST { buildId, projectId?, rating?, flags?, note? }  (partial patch)
//   GET  ?buildId=  -> existing review
// Independent of the Creative Intelligence Layer — buildId is generated for
// every run whether or not CIL shadow mode is on. Refuses in production.
// Never touches generation.

function toClientShape(row) {
  return row
    ? { buildId: row.run_id, projectId: row.project_id, rating: row.rating, flags: row.flags || [], note: row.notes || '', reviewVersion: row.review_version }
    : null
}

export async function POST(request) {
  if (!isDevReviewServer()) return Response.json({ ok: false, disabled: true })
  try {
    const patch = await request.json()
    if (!patch?.buildId && !patch?.projectId) {
      return Response.json({ ok: false, error: 'Need a buildId (or projectId) to attach the review.' })
    }
    const { valid, errors } = validateReview(patch)
    if (!valid) return Response.json({ ok: false, error: 'Invalid review patch.', errors })

    const existing = patch.buildId ? await getReview(patch.buildId) : null
    const prior = toClientShape(existing) || emptyReview(patch.buildId, patch.projectId)

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
    if (!buildId) return Response.json({ ok: false, error: 'buildId required' })
    const row = await getReview(buildId)
    const review = toClientShape(row) || emptyReview(buildId)
    return Response.json({ ok: true, review, exists: !!row })
  } catch (err) {
    return Response.json({ ok: false, error: err?.message || 'review fetch failed' })
  }
}
