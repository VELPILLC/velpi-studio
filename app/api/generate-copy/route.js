// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { callClaude, parseJson, stripFences } from '../../../lib/claude'

const REPAIR_SYSTEM = `You are given text that was supposed to be a single valid JSON object but failed to parse. The single most common cause: a stray, UNESCAPED double-quote mark inside a string value — a quoted word or aside (e.g. a "nickname") left as a literal " instead of \\" (or a single quote). Scan every string value for this first and fix any you find. The next most common cause is truncation (cut off mid-response) — if that's what happened instead, complete it sensibly using the surrounding context. Return ONLY the corrected, complete, valid JSON object with the exact same content and meaning. No markdown, no commentary, no explanation — JSON only.`

const SYSTEM = `You are a direct-response copywriter rewriting website copy.

RULES:
- Short sentences. Simple words. Third-grade reading level.
- Lead with the customer's problem or desire, then the solution.
- Every section that needs action gets a clear, specific CTA (e.g. "Call Now", "Book Online", "Get a Free Quote").
- Cater the language to the specific industry and target customer.
- Use only verifiable facts from the crawled source; never invent claims, credentials, or numbers.
- NEVER invent facts, numbers, names, awards, or claims that are not supported by the original content. If a fact is unknown, write benefit-driven copy without specifics.
- Keep the brand's real business name.
- Do NOT reproduce full review quotes verbatim anywhere in this JSON — reviews are sourced and rendered separately by the page builder. If a review needs referencing, paraphrase it in under 12 words (e.g. "praised for same-day service"). This keeps the output short enough to never truncate.
- JSON SAFETY — this breaks the ENTIRE response if missed: if any copy you write quotes a word or short phrase for emphasis, every double-quote character INSIDE that string value MUST be escaped as \\" or rewritten with a single quote (') — a single unescaped inner quote makes the whole JSON unparsable.

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

    const raw = await callClaude({ system: SYSTEM, user, maxTokens: 16000 })
    let copy = parseJson(raw)

    // Self-repair: a truncated or malformed response gets one automatic fix
    // pass before we give up and surface an error to the user.
    if (!copy || !copy.sections) {
      console.error('generate-copy: initial parse failed, attempting repair. Raw tail:', stripFences(raw).slice(-400))
      try {
        const repaired = await callClaude({ system: REPAIR_SYSTEM, user: stripFences(raw), maxTokens: 16000 })
        copy = parseJson(repaired)
      } catch (repairErr) {
        console.error('generate-copy: repair attempt failed:', repairErr.message)
      }
    }

    if (!copy || !copy.sections) {
      console.error('generate-copy: unrecoverable. Raw response length:', raw?.length || 0, 'tail:', stripFences(raw).slice(-400))
      return Response.json({ error: 'Could not generate copy for this business — the response was malformed even after a retry. Try generating again.' }, { status: 502 })
    }
    return Response.json({ copy })
  } catch (err) {
    console.error('generate-copy error:', err)
    return Response.json({ error: `Copy generation failed: ${err.message}` }, { status: 500 })
  }
}
