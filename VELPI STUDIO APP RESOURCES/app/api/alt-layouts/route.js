export const maxDuration = 300

import { callClaude, parseJson } from '../../../lib/claude'

// Post-generation layout alternates: two lightweight OUTLINES (section order +
// structural intent only — not full builds). The user previews them and can
// rebuild with one; no upfront style-choice step is added to the flow.

const SYSTEM = `You are a senior information architect. You are given a business analysis and the section order used by the site that was just built. Propose exactly TWO meaningfully different alternate page structures for the same business and the same content.

Rules:
- Same real content, different ARCHITECTURE: different section order, different lead story (e.g. proof-led vs offer-led vs story-led), different hero construction.
- Both must still follow arrest → build desire → convert, stay conversion-focused, and fit the niche.
- Each alternate must differ from the current structure AND from the other alternate in at least 3 section positions or treatments.

Return ONLY valid JSON:
{
  "alternates": [
    {
      "name": "short evocative name (e.g. 'Proof-First', 'Story Arc')",
      "hook": "one line — why this structure sells differently",
      "section_order": ["ordered section keys, reusing the same section vocabulary as the current site"],
      "structure_notes": "2-3 sentences on hero construction + the one signature structural move"
    },
    { ... }
  ]
}`

export async function POST(request) {
  try {
    const { analysis, currentOrder } = await request.json()
    if (!analysis) return Response.json({ error: 'Missing analysis.' }, { status: 400 })

    const user = `BUSINESS: ${analysis.business_name || ''} — ${analysis.industry || ''}${analysis.niche ? ` (${analysis.niche})` : ''}
CONVERSION STRATEGY: ${JSON.stringify(analysis.conversion_strategy || {}).slice(0, 900)}
CURRENT SECTION ORDER (the structure just built — both alternates must differ from it): ${JSON.stringify(currentOrder || analysis.layout?.section_order || analysis.sections || [])}
AVAILABLE CONTENT: services (${(analysis.facts?.services || []).length}), reviews (${(analysis.facts?.reviews || []).length}), hours ${analysis.facts?.hours ? 'yes' : 'no'}, address ${analysis.facts?.address ? 'yes' : 'no'}.`

    const raw = await callClaude({ system: SYSTEM, user, maxTokens: 1500 })
    const parsed = parseJson(raw)
    const alternates = Array.isArray(parsed?.alternates) ? parsed.alternates.slice(0, 2) : []
    return Response.json({ alternates })
  } catch (err) {
    console.error('alt-layouts error:', err)
    return Response.json({ alternates: [] }) // never block anything
  }
}
