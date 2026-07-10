export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { isDevReviewServer } from '../../../../../lib/creative/flags.mjs'
import { listAssembledFull, getReviewsForBuild } from '../../../../../lib/creative/persistence.mjs'
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
    const rating = url.searchParams.get('rating') || undefined
    const niche = url.searchParams.get('niche') || undefined
    const tier = url.searchParams.get('tier') || undefined
    const since = url.searchParams.get('since') || undefined
    const includeHtml = url.searchParams.get('includeHtml') === 'true'

    const dirRows = await listAssembledFull(limit, { niche, tier, since })
    // Join each directive with its reviews (N+1, bounded to <=100 for a dev export).
    const toClientShape = row => row ? { buildId: row.run_id, rating: row.rating, flags: row.flags || [], note: row.notes || '', reviewVersion: row.review_version } : null
    const rows = []
    for (const dirRow of dirRows) {
      const found = await getReviewsForBuild(dirRow.id).catch(() => ({ mobile: null, desktop: null }))
      const reviews = { mobile: toClientShape(found.mobile), desktop: toClientShape(found.desktop) }
      if (rating && reviews.mobile?.rating !== rating && reviews.desktop?.rating !== rating) continue
      rows.push({ directive: dirRow.directive, reviews })
    }

    const metrics = computeFleetMetrics(rows.map(x => ({ rollup: x.directive?.rollup })))
    const artifact = buildBatchArtifact({
      rows, metrics, selection: { limit, rating, niche, tier, since, includeHtml },
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
