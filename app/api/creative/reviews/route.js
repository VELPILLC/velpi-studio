export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { isDevReviewServer } from '../../../../lib/creative/flags.mjs'
import { listReviews } from '../../../../lib/creative/persistence.mjs'

// Developer Reviews — list (DEV ONLY). For the dashboard / triage.
//   GET ?limit=&rating=
export async function GET(request) {
  if (!isDevReviewServer()) return Response.json({ ok: false, disabled: true })
  try {
    const url = new URL(request.url)
    const limit = Math.min(500, Number(url.searchParams.get('limit')) || 200)
    const rating = url.searchParams.get('rating') || undefined
    const reviews = await listReviews({ limit, rating })
    return Response.json({ ok: true, count: reviews.length, reviews })
  } catch (err) {
    return Response.json({ ok: false, error: err?.message || 'reviews list failed' })
  }
}
