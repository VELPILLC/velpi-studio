export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { isDevReviewServer } from '../../../../../lib/creative/flags.mjs'
import { listReviewsForExport } from '../../../../../lib/creative/persistence.mjs'
import { buildReviewsMarkdown } from '../../../../../lib/creative/reviewExport.mjs'

// "Export Reviews" — plain markdown, DEV ONLY.
//   GET ?projectId=&since=&until=
// Defaults to ALL reviews. One line per build, grouped by day, no ids, no raw
// JSON — meant to be pasted directly into a chat. Refuses in production.
// Never touches generation.

export async function GET(request) {
  if (!isDevReviewServer()) return Response.json({ ok: false, disabled: true })
  try {
    const url = new URL(request.url)
    const projectId = url.searchParams.get('projectId') || undefined
    const since = url.searchParams.get('since') || undefined
    const until = url.searchParams.get('until') || undefined

    const rows = await listReviewsForExport({ projectId, since, until })
    const selectionParts = [projectId && 'single project', since && `since ${since}`, until && `until ${until}`].filter(Boolean)
    const md = buildReviewsMarkdown(rows, {
      generatedAt: new Date().toISOString(),
      selectionDescription: selectionParts.length ? selectionParts.join(', ') : 'all reviews',
    })

    return new Response(md, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="velpi-reviews-${new Date().toISOString().slice(0, 10)}.md"`,
      },
    })
  } catch (err) {
    return Response.json({ ok: false, error: err?.message || 'reviews export failed' })
  }
}
