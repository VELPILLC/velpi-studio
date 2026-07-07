export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { isDevReviewServer } from '../../../../../lib/creative/flags.mjs'
import { listAssembledFull, getReview } from '../../../../../lib/creative/persistence.mjs'
import { computeFleetMetrics } from '../../../../../lib/creative/metrics.mjs'
import { buildBatchArtifact } from '../../../../../lib/creative/exportPackage.mjs'

// "Export All Reviews" batch export (DEV ONLY, future-ready).
//   GET ?limit=50..100&flag=&niche=&tier=&since=&includeHtml=false&format=json
// HTML/screenshots are excluded by default (too large for many runs). Refuses
// in production. Never touches generation.

export async function GET(request) {
  if (!isDevReviewServer()) return Response.json({ ok: false, disabled: true })
  try {
    const url = new URL(request.url)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50))
    const flag = url.searchParams.get('flag') || undefined
    const niche = url.searchParams.get('niche') || undefined
    const tier = url.searchParams.get('tier') || undefined
    const since = url.searchParams.get('since') || undefined
    const includeHtml = url.searchParams.get('includeHtml') === 'true'

    const dirRows = await listAssembledFull(limit, { niche, tier, since })
    // Join each directive with its review (N+1, bounded to <=100 for a dev export).
    const rows = []
    for (const row of dirRows) {
      const review = await getReview(row.id).catch(() => null)
      const r = review
        ? { runId: review.run_id, flag: review.flag, scores: review.scores || {}, tags: review.tags || {}, notes: review.notes || '', reviewVersion: review.review_version }
        : null
      if (flag && (!r || r.flag !== flag)) continue
      rows.push({ directive: row.directive, review: r })
    }

    const metrics = computeFleetMetrics(rows.map(x => ({ rollup: x.directive?.rollup })))
    const artifact = buildBatchArtifact({
      rows, metrics, selection: { limit, flag, niche, tier, since, includeHtml },
      includeHtml, generatedAt: new Date().toISOString(),
    })

    return new Response(JSON.stringify(artifact, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="velpi-reviews-batch-${rows.length}.json"`,
      },
    })
  } catch (err) {
    return Response.json({ ok: false, error: err?.message || 'batch export failed' })
  }
}
