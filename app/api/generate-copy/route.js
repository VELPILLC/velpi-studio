// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { callClaude, parseJson } from '../../../lib/claude'

const SYSTEM = `You are a direct-response copywriter rewriting website copy.

RULES:
- Short sentences. Simple words. Third-grade reading level.
- Lead with the customer's problem or desire, then the solution.
- Every section that needs action gets a clear, specific CTA (e.g. "Call Now", "Book Online", "Get a Free Quote").
- Cater the language to the specific industry and target customer.
- NEVER invent facts, numbers, names, awards, or claims that are not supported by the original content. If a fact is unknown, write benefit-driven copy without specifics.
- Keep the brand's real business name.

Return ONLY valid JSON (no markdown) shaped as:
{
  "sections": {
    "<sectionKey>": {
      "heading": "string",
      "subheading": "string (optional)",
      "body": "string (optional, 1-3 short sentences)",
      "cta": "string (optional button label)",
      "items": ["optional list of short bullet/feature/service strings"]
    }
  }
}
Use exactly the section keys provided in the analysis.`

export async function POST(request) {
  try {
    const { analysis } = await request.json()
    if (!analysis) {
      return Response.json({ error: 'Missing analysis to write copy from.' }, { status: 400 })
    }

    const user = `Write the copy for each section listed below.

BUSINESS: ${analysis.business_name}
INDUSTRY: ${analysis.industry}
NICHE: ${analysis.niche || ''}
PRIMARY SERVICE: ${analysis.primary_service || ''}
TARGET CUSTOMER: ${analysis.target_customer || ''}
TONE: ${analysis.tone || ''}
SECTIONS (use these exact keys): ${JSON.stringify(analysis.sections || ['hero', 'services', 'about', 'contact'])}

REAL FACTS (use these in copy and CTAs — never invent others):
${JSON.stringify(analysis.facts || {}, null, 2)}

CONVERSION STRATEGY (execute this exactly — it is the thinking behind the page):
${JSON.stringify(analysis.conversion_strategy || {}, null, 2)}

Execution rules for the strategy:
- Use the strategy's primary_action as THE CTA label wherever the main CTA appears; secondary_action for lower-commitment moments.
- Each section's copy does the job named in persuasion_flow for that section.
- Answer each listed objection inside the section the strategy assigns it to — using the real fact given, woven naturally into the copy.
- Work the offer into the hero and the closing conversion moment.

Base everything on what is true for this business. Do not invent facts.`

    const raw = await callClaude({ system: SYSTEM, user, maxTokens: 3000 })
    const copy = parseJson(raw)
    if (!copy || !copy.sections) {
      return Response.json({ error: 'Could not generate copy for this business.' }, { status: 502 })
    }
    return Response.json({ copy })
  } catch (err) {
    console.error('generate-copy error:', err)
    return Response.json({ error: `Copy generation failed: ${err.message}` }, { status: 500 })
  }
}
