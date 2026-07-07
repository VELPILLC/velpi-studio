export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { isDevReviewServer } from '../../../../lib/creative/flags.mjs'
import { getAssembledRun, getReview } from '../../../../lib/creative/persistence.mjs'
import { getProject } from '../../../../lib/supabase'
import { emptyReview } from '../../../../lib/creative/review.mjs'
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
    const runId = url.searchParams.get('runId')
    const projectId = url.searchParams.get('projectId')
    if (!runId && !projectId) return Response.json({ ok: false, error: 'runId or projectId required' })

    const cdoRow = runId ? await getAssembledRun(runId) : null
    const cdo = cdoRow?.directive || null

    let reviewObj = null
    if (runId) {
      const r = await getReview(runId)
      reviewObj = r
        ? { runId: r.run_id, projectId: r.project_id, reviewer: r.reviewer, flag: r.flag, scores: r.scores || {}, tags: r.tags || {}, notes: r.notes || '', reviewVersion: r.review_version }
        : emptyReview(runId, projectId)
    }

    let projectData = null
    if (projectId) {
      const proj = await getProject(projectId).catch(() => null)
      projectData = proj?.data || null
    }

    const artifact = buildSingleArtifact({
      cdo, review: reviewObj, project: projectData, generatedAt: new Date().toISOString(),
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
