export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { isDevReviewServer } from '../../../../lib/creative/flags.mjs'
import { getAssembledRun, getReviewsForBuild } from '../../../../lib/creative/persistence.mjs'
import { getProject } from '../../../../lib/supabase'
import { buildSingleArtifact } from '../../../../lib/creative/exportPackage.mjs'

// "Ask ChatGPT" single-generation export (DEV ONLY).
//   GET ?runId=&projectId=&format=json
// Assembles one portable artifact from the CDO + review + project. The optional
// full-page screenshot is merged client-side (the server can't render). Refuses
// in production. Never touches generation.

export async function GET(request) {
  if (!isDevReviewServer()) return Response.json({ ok: false, disabled: true })
  try {
    const url = new URL(request.url)
    const runId = url.searchParams.get('runId') || url.searchParams.get('buildId')
    const projectId = url.searchParams.get('projectId')
    if (!runId && !projectId) return Response.json({ ok: false, error: 'buildId (or runId) or projectId required' })

    const cdoRow = runId ? await getAssembledRun(runId) : null
    const cdo = cdoRow?.directive || null

    let reviews = { mobile: null, desktop: null }
    if (runId) {
      const rows = await getReviewsForBuild(runId)
      const toClientShape = r => r ? { buildId: r.run_id, projectId: r.project_id, viewport: r.viewport, rating: r.rating, flags: r.flags || [], note: r.notes || '', reviewVersion: r.review_version } : null
      reviews = { mobile: toClientShape(rows.mobile), desktop: toClientShape(rows.desktop) }
    }

    let projectData = null
    if (projectId) {
      const proj = await getProject(projectId).catch(() => null)
      projectData = proj?.data || null
    }

    const artifact = buildSingleArtifact({
      cdo, reviews, project: projectData, generatedAt: new Date().toISOString(),
    })

    const safe = (artifact.business?.name || 'velpi').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40)
    return new Response(JSON.stringify(artifact, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="velpi-review-${safe}-${(runId || projectId).slice(0, 8)}.json"`,
      },
    })
  } catch (err) {
    return Response.json({ ok: false, error: err?.message || 'export failed' })
  }
}
