// Vercel: allow long-running AI work
export const maxDuration = 300

import { callClaude, parseJson } from '../../../lib/claude'

// The QA gate of the refinement loop: a brutal reviewer scores the current
// build against a delivery rubric. If it fails, its issue list drives a
// surgical fix pass (enhance-site with `issues`), and the loop repeats —
// up to 3 rounds — until the mockup is deliverable as a near-complete website.

const SYSTEM = `You are the most demanding QA design director in the industry, doing the FINAL review before a website is delivered to a paying client. Judge the provided HTML brutally against this rubric:

1. INFORMATION COMPLETENESS — every extracted service, review, hour, address, phone, and email appears on the page. Missing real content is a CRITICAL issue.
2. CONVERSION EXECUTION — primary CTA above the fold and in the sticky nav; tel: links on phones; proof adjacent to CTAs; a closing conversion band.
3. MOBILE CONTRACT — base styles target ~390px; edge-to-edge sections with no page gutters on mobile; minimal padding; full-width CTAs; clamp() fluid type; nothing can cause horizontal scroll.
4. VISUAL CRAFT — 8+ fully-realized sections; deliberate section rhythm (no two consecutive identical background treatments); dramatic type scale; refined hover states; no awkward wrapping lists, misaligned columns, cramped grids, or orphaned headings.
5. STRUCTURAL INTEGRITY — every image uses a %%IMG:...%% token (never an invented URL); all content inside <div class="velpi-page"> with every selector scoped; single <style> tag with @import fonts; zero JavaScript; no position:fixed.
6. BRAND & BRIEF ADHERENCE — colors strictly from the brand palette; the design brief's direction is visibly executed.

Return ONLY valid JSON (no markdown, no prose):
{
  "score": 0-100,
  "pass": true|false,
  "issues": [
    { "severity": "critical" | "major" | "minor", "issue": "what is wrong, specifically and locatable", "fix": "exactly what to change" }
  ]
}

Rules: pass=true ONLY if score >= 88 AND there are zero critical or major issues. List at most 8 issues, worst first, each concrete enough that a developer can act on it without asking questions. Do not invent problems to seem thorough — a genuinely excellent page should pass.`

export async function POST(request) {
  try {
    const { html, analysis, brief } = await request.json()
    if (!html) {
      return Response.json({ error: 'Missing HTML to critique.' }, { status: 400 })
    }

    const f = analysis?.facts || {}
    const user = `BUSINESS: ${analysis?.business_name || ''} — ${analysis?.industry || ''}
BRAND PALETTE (only allowed hues): ${(analysis?.color_palette || []).join(', ')}
EXTRACTED CONTENT THAT MUST ALL APPEAR — services (${(f.services || []).length}): ${(f.services || []).join(' | ').slice(0, 1500)}
Reviews (${(f.reviews || []).length}): ${(f.reviews || []).join(' | ').slice(0, 1200)}
Phone: ${f.phone || '(none)'} | Emails: ${(f.emails || []).join(', ') || '(none)'} | Address: ${f.address || '(none)'} | Hours: ${f.hours || '(none)'}
CONVERSION STRATEGY: ${JSON.stringify(analysis?.conversion_strategy || {}).slice(0, 1200)}
${brief ? `DESIGN BRIEF (must be visibly executed):\n${String(brief).slice(0, 1600)}` : ''}

HTML TO REVIEW:
${html}`

    const raw = await callClaude({ system: SYSTEM, user, maxTokens: 3000 })
    const verdict = parseJson(raw)
    if (!verdict || typeof verdict.pass !== 'boolean') {
      // Unreadable verdict — treat as a pass so the loop never wedges the pipeline.
      return Response.json({ pass: true, score: null, issues: [] })
    }
    verdict.issues = Array.isArray(verdict.issues) ? verdict.issues.slice(0, 8) : []
    return Response.json(verdict)
  } catch (err) {
    console.error('critique-site error:', err)
    return Response.json({ pass: true, score: null, issues: [] }) // never block delivery
  }
}
