export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { serverCilMode, isCilEnabled, CIL_MODES } from '../../../../lib/creative/flags.mjs'
import { listAssembledRuns, getAssembledRun } from '../../../../lib/creative/persistence.mjs'
import { computeFleetMetrics } from '../../../../lib/creative/metrics.mjs'

// CIL — developer inspection + shadow metrics (Phase 1 / SHADOW ONLY).
//
//   GET /api/creative/inspect            -> { metrics, runs:[{id, created_at, rollup, ...}] }
//   GET /api/creative/inspect?id=<runId> -> { run: full assembled directive }
//
// Read-only. Gated by CIL_MODE. Never affects generation.

export async function GET(request) {
  const mode = serverCilMode()
  if (!isCilEnabled(mode)) {
    return Response.json({ ok: false, disabled: true, mode: CIL_MODES.OFF, hint: 'Set CIL_MODE=shadow to enable the inspector.' })
  }
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const limit = Math.min(500, Number(url.searchParams.get('limit')) || 200)

    if (id) {
      const run = await getAssembledRun(id)
      if (!run) return Response.json({ ok: false, error: 'Run not found.' })
      return Response.json({ ok: true, run })
    }

    const rowsRaw = await listAssembledRuns(limit)
    const runs = rowsRaw.map(r => ({
      id: r.id,
      created_at: r.created_at,
      niche: r.niche,
      tier: r.tier,
      businessName: r.meta?.businessName || null,
      partial: !!r.meta?.partial,
      rollup: r.meta?.rollup || null,
    }))
    const metrics = computeFleetMetrics(runs)
    return Response.json({ ok: true, metrics, runs })
  } catch (err) {
    return Response.json({ ok: false, error: err?.message || 'inspect failed' })
  }
}
