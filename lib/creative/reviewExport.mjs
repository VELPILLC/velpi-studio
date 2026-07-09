// Developer Review System — plain-markdown reviews export.
//
// Pulls stored reviews (rating/flags/note) into one readable file meant to be
// pasted straight into a chat for pattern analysis. No IDs, no raw JSON, one
// line per build, grouped by day (newest first). Pure builder — the route does
// the DB reads and joins to a build name; this only formats.

export const REVIEW_EXPORT_VERSION = 'review-export@1.0.0'

const RATING_TEXT = { love: 'Love', okay: 'Okay', needs_work: 'Needs Work' }
const FLAG_TEXT = { copy: 'Copy', visual_design: 'Visual Design', images: 'Images', layout: 'Layout', trust_signals: 'Trust Signals', overall_feel: 'Overall Feel' }

function dayHeading(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Undated'
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
function dayKey(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? 'undated' : d.toISOString().slice(0, 10)
}

// rows: [{ buildName, rating, flags, note, createdAt }] — buildName defaults to
// "Untitled build" when the project it pointed to has no name (never an id).
export function buildReviewsMarkdown(rows = [], { generatedAt, selectionDescription } = {}) {
  const sorted = [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const groups = []
  const byKey = new Map()
  for (const r of sorted) {
    const key = dayKey(r.createdAt)
    if (!byKey.has(key)) { const g = { key, heading: dayHeading(r.createdAt), rows: [] }; byKey.set(key, g); groups.push(g) }
    byKey.get(key).rows.push(r)
  }

  const counts = { love: 0, okay: 0, needs_work: 0 }
  for (const r of sorted) if (counts[r.rating] != null) counts[r.rating]++

  const lines = []
  lines.push('# Velpi Studio — Dev Reviews Export')
  lines.push(`Generated: ${generatedAt || new Date().toISOString()} · ${sorted.length} review${sorted.length === 1 ? '' : 's'}${selectionDescription ? ` · ${selectionDescription}` : ''}`)
  lines.push(`Love: ${counts.love} · Okay: ${counts.okay} · Needs Work: ${counts.needs_work}`)
  lines.push('')

  for (const g of groups) {
    lines.push(`### ${g.heading}`)
    for (const r of g.rows) {
      const name = (r.buildName && r.buildName.trim()) || 'Untitled build'
      const ratingText = RATING_TEXT[r.rating] || 'Unrated'
      const flagList = (r.flags || []).map(f => FLAG_TEXT[f] || f)
      const flagSuffix = flagList.length ? ` (${flagList.join(', ')})` : ''
      lines.push(`- **${name}** — ${ratingText}${flagSuffix}`)
      if (r.note && r.note.trim()) lines.push(`  "${r.note.trim()}"`)
    }
    lines.push('')
  }
  if (!sorted.length) lines.push('_No reviews match this selection._')

  return lines.join('\n').replace(/\n+$/, '\n')
}
