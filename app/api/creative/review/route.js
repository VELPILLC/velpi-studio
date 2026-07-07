export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { isDevReviewServer } from '../../../../lib/creative/flags.mjs'
import { validateReview, mergeReview, emptyReview } from '../../../../lib/creative/review.mjs'
import { getReview, saveReview } from '../../../../lib/creative/persistence.mjs'

// Developer Review — autosave upsert + rehydrate (DEV ONLY).
//   POST { runId, projectId?, reviewer?, flag?, scores?, tags?, notes? }  (partial patch)
//   GET  ?runId=&reviewer=  -> existing review
// Refuses in production. Never touches generation.

export async function POST(request) {
  if (!isDevReviewServer()) return Response.json({ ok: false, disabled: true })
  try {
    const patch = await request.json()
    if (!patch?.runId && !patch?.projectId) {
      return Response.json({ ok: false, error: 'Need a runId (or projectId) to attach the review.' })
    }
    const { valid, errors } = validateReview(patch)
    if (!valid) return Response.json({ ok: false, error: 'Invalid review patch.', errors })

    const reviewer = patch.reviewer || 'dev'
    const existing = patch.runId ? await getReview(patch.runId, reviewer) : null
    const prior = existing
      ? { runId: existing.run_id, projectId: existing.project_id, reviewer: existing.reviewer, flag: existing.flag, scores: existing.scores, tags: existing.tags, notes: existing.notes, reviewVersion: existing.review_version }
      : emptyReview(patch.runId, patch.projectId)

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
    const runId = url.searchParams.get('runId')
    const reviewer = url.searchParams.get('reviewer') || 'dev'
    if (!runId) return Response.json({ ok: false, error: 'runId required' })
    const row = await getReview(runId, reviewer)
    const review = row
      ? { runId: row.run_id, projectId: row.project_id, reviewer: row.reviewer, flag: row.flag, scores: row.scores || {}, tags: row.tags || {}, notes: row.notes || '', reviewVersion: row.review_version }
      : emptyReview(runId)
    return Response.json({ ok: true, review, exists: !!row })
  } catch (err) {
    return Response.json({ ok: false, error: err?.message || 'review fetch failed' })
  }
}
