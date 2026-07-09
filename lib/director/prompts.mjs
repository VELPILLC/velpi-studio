// Creative Director Review System — judge prompts (Phase 1).
//
// Two judges:
//   CONTENT judge — reads the actual page HTML/copy. Every score MUST cite
//   verbatim quotes from the page; the engine mechanically verifies each quote
//   against the document and voids any category whose evidence doesn't check out.
//   VISION judge — looks at a real rendered screenshot (never the source code)
//   and scores only what is visible in that image.
//
// Pure module. Node-testable.

import { REPAIR_SYSTEM } from '../creative/prompts/understanding.prompt.mjs'
export { REPAIR_SYSTEM }

export const CONTENT_PROMPT_VERSION = 'director-content@1.0.0'
export const VISION_PROMPT_VERSION = 'director-vision@1.0.0'

export const CONTENT_CATEGORIES = Object.freeze([
  'hero_section', 'value_proposition', 'headline_quality', 'offer_clarity',
  'calls_to_action', 'copywriting', 'branding_consistency', 'trust_signals',
  'social_proof', 'generic_ai_copy', 'navigation', 'user_experience',
  'conversion_optimization',
])

export const VISION_CATEGORIES = Object.freeze([
  'visual_hierarchy', 'layout', 'spacing', 'color_usage', 'typography',
])

const CATEGORY_SHAPE = `{
  "score": <integer 0-100>,
  "explanation": "<one line — what earned this score>",
  "evidence": ["<verbatim quote copied EXACTLY from the page, 8-160 chars>", "..."],
  "deductions": ["<why points were lost, tied to the evidence>", "..."],
  "recommendations": [
    { "fix": "<one concrete change>",
      "refinement_prompt": "<imperative instruction ready to send to the site editor, e.g. 'Rewrite the hero headline to lead with the 24/7 emergency promise'>",
      "impact": { "level": "high|medium|low", "rationale": "<why fixing this matters>" } }
  ]
}
refinement_prompt rule: NEVER invent concrete values (phone numbers, hours, prices, city names). Reference real values already on the page by quoting them, or refer to them abstractly ("the business's real phone number") — an invented placeholder would be inserted into the site verbatim.`

export const CONTENT_SYSTEM = `You are a review panel of senior specialists — web designer, UX designer, CRO specialist, direct-response copywriter, brand strategist, and creative director — auditing ONE generated small-business landing page before delivery to a paying client. You are demanding but fair: a genuinely strong page scores high.

NON-NEGOTIABLE EVIDENCE RULES:
- You may only judge what is IN the provided HTML. Never assume content exists off-screen.
- Every category's "evidence" array MUST contain verbatim quotes copied EXACTLY from the page text or markup (8-160 chars each). Quotes are mechanically checked against the document — a paraphrase counts as fabrication and voids the category.
- If you cannot produce at least one verbatim quote for a category, return {"status":"not_evaluated","reason":"<why>"} for that category instead of a score. A missing score is acceptable; an unevidenced one is not.
- Deductions must reference the quoted evidence, never vague impressions.
- MEASURED FACTS are provided (computed mechanically from the DOM). Use them to inform judgment, but your evidence quotes must still come from the page itself.

Category notes:
- generic_ai_copy: HIGH score = copy is specific, concrete, human (names, numbers, local detail). LOW score = interchangeable AI filler ("elevate your experience", "look no further"). Quote the offending phrases as evidence when deducting.
- calls_to_action / conversion_optimization: weigh CTA wording, placement per the markup order, tel:/mailto: wiring (see MEASURED FACTS), proof adjacency.
- navigation / user_experience: judge from the actual markup structure (nav links, section order, anchor targets) and cite the elements.
- Scores: 95+ exceptional agency work; 85-94 strong with minor gaps; 70-84 competent but with real issues; 50-69 weak; below 50 broken/missing.

Return ONLY valid JSON (no markdown, no commentary):
{
  ${CONTENT_CATEGORIES.map(c => `"${c}": ${'{...category object or {"status":"not_evaluated","reason":"..."}}'}`).join(',\n  ')}
}
Each evaluated category object has exactly this shape:
${CATEGORY_SHAPE}
JSON SAFETY: any double-quote inside a string value must be escaped (\\") or rewritten with a single quote.`

export function buildContentUser({ html, facts, businessName }) {
  return `Audit this generated landing page${businessName ? ` for "${businessName}"` : ''}.

MEASURED FACTS (computed from the DOM — context only; your evidence must be verbatim page quotes):
- tel: links: ${facts.conversion.telLinks}; mailto: links: ${facts.conversion.mailtoLinks}
- phone numbers visible as text: ${facts.conversion.phoneTexts.join(', ') || '(none)'}${facts.conversion.phoneWithoutTelLink ? ' — WITHOUT any tel: link' : ''}
- CTA-like elements (buttons / .btn/.cta anchors): ${facts.conversion.ctaCandidates}
- word count (visible text): ${facts.conversion.wordCount}
- headings: ${facts.headings.sequence.map(l => 'h' + l).join(' ') || '(none)'} (${facts.headings.h1Count} h1)
- unresolved image tokens: ${facts.conversion.leftoverTokens}

FULL PAGE HTML (data URIs replaced with [image-data]):
${html}`
}

export const VISION_SYSTEM = `You are a senior art director reviewing a REAL RENDERED SCREENSHOT of a generated landing page. You judge only what is visible in the image — never speculate about code, hidden sections, or anything below the captured area.

EVIDENCE RULES:
- "evidence" entries must be concrete visual observations that someone else could verify by looking at the same screenshot: name the element, its position, and what you see (e.g. "hero headline overlaps the photo's dark edge, top-left", "three identical white cards in row 2 with equal gaps").
- If the screenshot does not show enough of the page to judge a category, return {"status":"not_evaluated","reason":"not visible in the captured area"} for it.
- If the image is a partial capture (e.g. top of page only), restrict every judgment to the visible region and say so in the explanation.

Categories to score (0-100, same bar as a top agency): ${VISION_CATEGORIES.join(', ')}${'' /* mobile added dynamically */}.

Return ONLY valid JSON:
{ ${VISION_CATEGORIES.map(c => `"${c}": {...}`).join(', ')}, "mobile_responsiveness": {...only when the prompt says a mobile screenshot is attached...} }
Each evaluated category object has exactly this shape:
${CATEGORY_SHAPE}
(For vision categories, "evidence" is the concrete visual observation, not a text quote.)
JSON SAFETY: escape any inner double quotes.`

export function buildVisionUser({ coverageNote, hasMobile }) {
  return `Attached: ${hasMobile
    ? 'TWO screenshots — first the DESKTOP rendering, second the MOBILE rendering (375px-width viewport). Score the five visual categories from the desktop image, and score "mobile_responsiveness" from the mobile image (layout integrity, tap-target size, text legibility, horizontal overflow).'
    : 'ONE screenshot — the DESKTOP rendering. Score the five visual categories from it. Do NOT return "mobile_responsiveness" (no mobile capture was provided).'}
${coverageNote ? `Coverage note: ${coverageNote}` : ''}
Judge only what is visible.`
}
