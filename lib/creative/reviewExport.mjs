// Developer Review System — plain-markdown reviews export.
//
// Pulls stored reviews (5-question 1-5 scores/note/viewport) into one
// readable file meant to be pasted straight into a chat for pattern
// analysis. No IDs, no raw JSON, one line per build+viewport, grouped by
// viewport first (Mobile, then Desktop, then Unspecified viewport for
// legacy/missing-viewport rows), and within each viewport by day (newest
// first). A mobile score and a desktop score for the same build are never
// merged — each is its own line, labeled, since they usually point to
// different fixes. Pure builder — the route does the DB reads and joins to
// a build name; this only formats.

import { SCORE_KEYS, SCORE_LABELS } from './review.mjs'

export const REVIEW_EXPORT_VERSION = 'review-export@3.0.0'

// Fixed print order for the five per-build scores — shared with the
// stepper UI/model, not hand-duplicated, so the two can never drift apart.
const SCORE_FIELDS = SCORE_KEYS
const SCORE_TEXT = SCORE_LABELS
const VIEWPORT_SECTIONS = [
  { key: 'mobile', heading: 'Mobile' },
  { key: 'desktop', heading: 'Desktop' },
  { key: 'unspecified', heading: 'Unspecified viewport' },
]

function dayHeading(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Undated'
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
function dayKey(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? 'undated' : d.toISOString().slice(0, 10)
}

function isNumericScore(v) {
  return typeof v === 'number' && Number.isFinite(v)
}
function scoreText(scores, field) {
  const v = scores && scores[field]
  return isNumericScore(v) ? `${v}/5` : '-/5'
}
function avgOverallText(rows) {
  const nums = rows.map(r => r.scores && r.scores.overall).filter(isNumericScore)
  if (!nums.length) return '-'
  return (nums.reduce((sum, v) => sum + v, 0) / nums.length).toFixed(1)
}

function groupByDay(rows) {
  const groups = []
  const byKey = new Map()
  for (const r of rows) {
    const key = dayKey(r.createdAt)
    if (!byKey.has(key)) { const g = { key, heading: dayHeading(r.createdAt), rows: [] }; byKey.set(key, g); groups.push(g) }
    byKey.get(key).rows.push(r)
  }
  return groups
}

// rows: [{ buildName, scores: { overall, layout, images, trust, copy }, note,
// viewport, createdAt }] — buildName defaults to "Untitled build" when the
// project it pointed to has no name (never an id). Each score is a 1-5
// number, or null/undefined/missing (printed as "-/5"). viewport is
// 'mobile' | 'desktop' | null and rows without a recognized viewport are
// grouped under "Unspecified viewport".
export function buildReviewsMarkdown(rows = [], { generatedAt, selectionDescription } = {}) {
  const sorted = [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const byViewport = { mobile: [], desktop: [], unspecified: [] }
  for (const r of sorted) {
    if (r.viewport === 'mobile') byViewport.mobile.push(r)
    else if (r.viewport === 'desktop') byViewport.desktop.push(r)
    else byViewport.unspecified.push(r)
  }

  const lines = []
  lines.push('# Velpi Studio — Dev Reviews Export')
  lines.push(`Generated: ${generatedAt || new Date().toISOString()} · ${sorted.length} review${sorted.length === 1 ? '' : 's'}${selectionDescription ? ` · ${selectionDescription}` : ''}`)
  lines.push(`Mobile: ${byViewport.mobile.length} (avg overall ${avgOverallText(byViewport.mobile)}) · Desktop: ${byViewport.desktop.length} (avg overall ${avgOverallText(byViewport.desktop)})`)
  lines.push('')

  for (const section of VIEWPORT_SECTIONS) {
    const rows = byViewport[section.key]
    if (!rows.length) continue
    lines.push(`## ${section.heading}`)
    for (const g of groupByDay(rows)) {
      lines.push(`### ${g.heading}`)
      for (const r of g.rows) {
        const name = (r.buildName && r.buildName.trim()) || 'Untitled build'
        const scoreSuffix = SCORE_FIELDS.map(f => `${SCORE_TEXT[f]} ${scoreText(r.scores, f)}`).join(' · ')
        lines.push(`- **${name}** — ${scoreSuffix}`)
        if (r.note && r.note.trim()) {
          for (const segment of r.note.split('\n')) {
            const t = segment.trim()
            if (t) lines.push(`  "${t}"`)
          }
        }
      }
      lines.push('')
    }
  }
  if (!sorted.length) lines.push('_No reviews match this selection._')

  return lines.join('\n').replace(/\n+$/, '\n')
}
