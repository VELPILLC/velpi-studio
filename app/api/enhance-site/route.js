// Vercel: allow long-running AI work
export const maxDuration = 300

import { callClaude, stripFences } from '../../../lib/claude'

// PASS 2 — the art-director elevation. The first draft is good; this pass makes
// it exceptional. Re-prompting against the finished draft beats the single-
// response ceiling: the model spends its entire output budget improving instead
// of laying foundations.

const SYSTEM = `You are a ruthless art director at a top-tier agency reviewing a first-draft website an hour before the client presentation. The draft is competent — competent is not good enough. Rebuild it to be exceptional.

WHAT TO PUSH (spend your entire output budget here):
- COMPOSITION: break template monotony. Overlapping elements, oversized display numerals, editorial pull-quotes, asymmetric splits, images that cross section boundaries, generous negative space used with intent.
- TYPOGRAPHY: dramatic scale contrast (hero display 72-120px on desktop scaling down responsively), refined letterspacing, small-caps labels, hanging quotes. The type alone should feel expensive.
- SECTION RHYTHM: alternate light/dark/accent moments so scrolling feels like a journey with a crescendo at the conversion band. No two consecutive sections with the same background treatment.
- DEPTH & POLISH: layered cards, tasteful long shadows, subtle borders, refined hover states, background tints and washes derived from the brand palette. CSS-only scroll-reveal polish is allowed if it degrades gracefully without JS.
- DENSITY: every thin section gets richer using ONLY the real content already in the draft — restructure lists into stronger patterns (pricing-menu rows, numbered process, credential grid), never pad with filler or lorem.
- FIX EVERY LAYOUT FLAW: awkward wrapping lists, misaligned dot leaders, cramped columns, orphaned headings, uneven card heights.
- CONVERSION: sticky-nav CTA, hero CTA above the fold, tap-to-call tel: links on every phone, proof adjacent to CTAs, a closing conversion band that feels inevitable.

HARD CONSTRAINTS (violating any of these fails the review):
- Preserve EVERY piece of real content: business name, copy, services, prices, hours, addresses, phones, emails, reviews. Nothing invented, nothing dropped.
- Preserve EVERY image placeholder token %%IMG:...%% exactly as written — same tokens, you may reposition/resize/crop their containers but never rename, add, or remove tokens.
- Keep the brand color palette exactly — no new hues, only tints/shades of the existing palette plus white and one near-black.
- Keep the GoHighLevel constraints: ALL body content inside <div class="velpi-page">, every CSS selector prefixed .velpi-page, all CSS in ONE <style> tag, Google Fonts via @import at the top of that style tag, NO JavaScript, no position:fixed (sticky is fine).
- Keep the MOBILE-FIRST contract: base CSS targets ~390px with EDGE-TO-EDGE sections (no page gutters on mobile, 12-16px text insets max, minimal padding, full-width CTAs, clamp() fluid type, zero horizontal scroll), enhanced upward via min-width media queries.
- Return ONLY the complete rebuilt HTML document starting with <!DOCTYPE html>. No markdown, no commentary.`

// Surgical mode — used by the refinement loop: fix EXACTLY the critic's issues.
const SYSTEM_FIX = `You are a senior developer executing a QA punch list on a finished website an hour before delivery. You are given the full HTML and a list of specific issues from the design director.

RULES:
- Fix EVERY listed issue completely and precisely.
- Change NOTHING that is not required by an issue — untouched sections stay byte-for-byte identical.
- Preserve every %%IMG:...%% token exactly (same tokens, none added, renamed, or removed).
- Preserve all real content (copy, services, prices, hours, contacts, reviews) unless an issue explicitly says otherwise.
- Keep all constraints: .velpi-page scoping on every selector, ONE <style> tag with @import fonts at top, no JavaScript, no position:fixed, mobile-first edge-to-edge base styles, brand palette only.
- Return ONLY the complete corrected HTML document starting with <!DOCTYPE html>. No markdown, no commentary.`

export async function POST(request) {
  try {
    const { html, analysis, vibe, brief, issues } = await request.json()
    if (!html) {
      return Response.json({ error: 'Missing HTML to elevate.' }, { status: 400 })
    }
    const fixMode = Array.isArray(issues) && issues.length > 0

    const palette = analysis?.color_palette || []
    const user = `BRAND: ${analysis?.business_name || ''} — ${analysis?.industry || ''}${analysis?.niche ? ` (${analysis.niche})` : ''}
BRAND PALETTE (locked): ${palette.join(', ') || '(use the draft’s existing palette)'}
DESIGN DIRECTION: ${analysis?.design_direction || ''}
3-SECOND FEELING: ${analysis?.target_feeling || ''}
${vibe ? `CREATOR'S VIBE SELECTIONS (honor these): ${vibe}` : ''}
${brief ? `DESIGN BRIEF (the committed creative direction — every elevation must deepen this exact direction, never drift from it):\n${brief}\n` : ''}
${analysis?.conversion_strategy ? `CONVERSION STRATEGY (the page's brain — every elevation must serve it, and no strategic element may be weakened or dropped):\n${JSON.stringify(analysis.conversion_strategy, null, 2)}` : ''}

${fixMode ? `QA PUNCH LIST — FIX EXACTLY THESE (${issues.length}):
${issues.map((it, i) => `${i + 1}. [${it.severity || 'issue'}] ${it.issue}${it.fix ? ` → FIX: ${it.fix}` : ''}`).join('\n')}
` : ''}
${fixMode ? 'HTML TO CORRECT:' : 'FIRST DRAFT TO ELEVATE:'}
${html}`

    const raw = await callClaude({ system: fixMode ? SYSTEM_FIX : SYSTEM, user, maxTokens: 64000 })
    const upgraded = stripFences(raw)

    // Safety gates — if pass 2 mangled anything structural, ship pass 1 untouched.
    const tokensOf = s => (String(s).match(/%%IMG:[a-z0-9_]+%%/gi) || []).sort().join('|')
    const valid =
      /<html|<!doctype/i.test(upgraded) &&
      upgraded.length > html.length * 0.55 &&
      tokensOf(upgraded) === tokensOf(html) &&
      upgraded.includes('velpi-page')

    if (!valid) {
      return Response.json({ html, pass2: false })
    }
    return Response.json({ html: upgraded, pass2: true })
  } catch (err) {
    console.error('enhance-site error:', err)
    return Response.json({ error: `Elevation failed: ${err.message}` }, { status: 500 })
  }
}
