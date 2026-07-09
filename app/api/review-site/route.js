// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { callClaudeWithUsage, parseJson, stripFences } from '../../../lib/claude'
import { runDirectorReview } from '../../../lib/director/engine.mjs'
import { REPAIR_SYSTEM } from '../../../lib/director/prompts.mjs'
import { substituteTokens } from '../../../lib/creative/exportPackage.mjs'
import { getProject } from '../../../lib/supabase'

// Creative Director Review (Phase 1 — engine only, nothing calls this
// automatically yet). Reviews ONE generated site with evidence-backed scores:
//   POST { html?, projectId?, businessName?, screenshots?: { desktop?, mobile? } }
//   -> { ok, review }
// - html may carry %%IMG%% tokens or be fully substituted; with projectId the
//   stored project is loaded and substituted server-side.
// - screenshots are data URIs captured from a REAL render (client iframe or
//   preview). Without a desktop screenshot the five visual categories return
//   not_evaluated; without a mobile screenshot mobile_responsiveness does.
//   If the project has a stored thumbnail (real render of the top of the page)
//   it is used as a fallback desktop capture, labeled as partial coverage.
// - Never modifies the site. Never fabricates: unverifiable = not_evaluated.

function dataUriToImage(uri) {
  const m = String(uri || '').match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/)
  if (!m) return null
  return { media_type: m[1] === 'image/jpg' ? 'image/jpeg' : m[1], data: m[2] }
}

export async function POST(request) {
  const startedAt = Date.now()
  try {
    const body = await request.json()
    let { html, businessName = '' } = body
    const screenshots = { ...(body.screenshots || {}) }
    let coverageNote = screenshots.coverageNote || ''

    if (!html && body.projectId) {
      const proj = await getProject(body.projectId).catch(() => null)
      const d = proj?.data
      if (!d?.htmlTemplate) {
        return Response.json({ ok: false, error: 'Project not found or has no HTML.' }, { status: 404 })
      }
      html = substituteTokens(d.htmlTemplate, {
        assetsById: d.assetsById || {},
        ghlUrls: d.ghlUrls || {},
        logoSrc: d.refinedLogo || d.logoUrl || null,
      })
      businessName = businessName || d.bizName || ''
      if (!screenshots.desktop && d.thumb) {
        screenshots.desktop = d.thumb
        coverageNote = 'Stored gallery thumbnail — top portion of the page only; judge only the visible region.'
      }
    }
    if (!html || typeof html !== 'string' || html.length < 200) {
      return Response.json({ ok: false, error: 'Need the generated HTML (or a projectId) to review.' }, { status: 400 })
    }

    const usage = { input_tokens: 0, output_tokens: 0 }
    const add = u => { usage.input_tokens += u?.input_tokens || 0; usage.output_tokens += u?.output_tokens || 0 }

    // One repair pass on malformed JSON — same convention as every judge route.
    async function judgeJson({ system, user, images = [], maxTokens }) {
      const r1 = await callClaudeWithUsage({ system, user, images, maxTokens })
      add(r1.usage)
      let obj = parseJson(r1.text)
      if (!obj || typeof obj !== 'object') {
        const r2 = await callClaudeWithUsage({ system: REPAIR_SYSTEM, user: stripFences(r1.text), maxTokens })
        add(r2.usage)
        obj = parseJson(r2.text)
      }
      if (!obj || typeof obj !== 'object') throw new Error('judge returned unparseable JSON')
      return obj
    }

    const judges = {
      content: ({ system, user }) => judgeJson({ system, user, maxTokens: 7000 }),
      vision: ({ system, user, images }) => judgeJson({
        system, user, maxTokens: 4000,
        images: images.map(dataUriToImage).filter(Boolean),
      }),
    }

    // If a "screenshot" isn't a decodable raster image, don't pretend we have one.
    if (screenshots.desktop && !dataUriToImage(screenshots.desktop)) delete screenshots.desktop
    if (screenshots.mobile && !dataUriToImage(screenshots.mobile)) delete screenshots.mobile

    const review = await runDirectorReview({
      html,
      businessName,
      screenshots: { desktop: screenshots.desktop || null, mobile: screenshots.mobile || null, coverageNote },
      judges,
    })

    review.usage = usage
    review.durationMs = Date.now() - startedAt
    review.generatedAt = new Date().toISOString()

    try {
      console.log('[director-review]', JSON.stringify({
        business: businessName || '(unknown)',
        overall: review.overall?.score ?? null,
        evaluated: review.method_summary.evaluated.length,
        not_evaluated: review.method_summary.not_evaluated.length,
        voided: review.evidence_verification.voided_categories,
        durationMs: review.durationMs,
      }))
    } catch (_) { /* logging must never throw */ }

    return Response.json({ ok: true, review })
  } catch (err) {
    console.error('review-site error:', err)
    return Response.json({ ok: false, error: err?.message || 'review failed' }, { status: 500 })
  }
}
