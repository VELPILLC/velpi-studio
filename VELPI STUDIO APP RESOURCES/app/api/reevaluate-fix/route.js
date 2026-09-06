// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { callClaude, stripFences } from '../../../lib/claude'
import { checkFixedHtml } from '../../../lib/reevaluateGates.mjs'

// Targeted multi-issue fix for elements a HUMAN selected in the Inspect &
// Fix preview. Deliberately a sibling of enhance-site rather than a revival
// of it: enhance-site's punch-list prompt is the right shape, but its other
// half ("elevate the whole page") is the opposite of what's wanted here, and
// this route needs rules enhance-site has no reason to know — above all,
// that data-vid attributes are the addressing scheme and must survive
// byte-for-byte so the caller can verify only the named elements changed.
//
// The whole document is sent (not a fragment) because all CSS lives in one
// shared <style> tag — you cannot fix an element's layout without seeing the
// cascade it sits in. "Surgical" is enforced by the prompt plus the
// structural gates in lib/reevaluateGates.mjs, not by slicing the input.
const SYSTEM = `You are a senior developer executing a QA punch list on a finished website an hour before delivery. You are given the full HTML of the page and a numbered list of specific issues, each naming the exact element it applies to.

TARGETING:
- Every issue names its target by a data-vid="vNN" attribute that already exists in the HTML. Find that exact element and fix ONLY it (and whatever CSS rules govern it).
- If an issue says "DIAGNOSE FROM IMAGE N", an attached screenshot shows exactly that element as it currently renders. Study it, decide what is actually wrong (illegible text, collision, awkward crop, weak hierarchy, wrong emphasis), and fix that.
- If an issue carries a USER NOTE, the note is the authority on what is wrong — do exactly what it asks, even if you would have judged differently.

RULES:
- Fix EVERY listed issue completely and precisely.
- Change NOTHING that is not required by an issue — untouched sections stay byte-for-byte identical.
- Preserve every data-vid="..." attribute on EVERY element exactly as it appears — same set, same values, none added, renamed, or removed, including on elements you edit. These are the review system's addressing scheme; losing one invalidates the whole fix and your work will be discarded.
- Preserve every %%IMG:...%% placeholder token exactly — same tokens, none added, renamed, or removed.
- Preserve all real content (copy, services, prices, hours, contacts, reviews) unless an issue explicitly asks otherwise. Never invent facts.
- Keep every existing constraint: ALL body content inside <div class="velpi-page">, every CSS selector prefixed .velpi-page, ALL CSS in ONE <style> tag with Google Fonts via @import at its top, no position:fixed (sticky is fine).
- SCRIPTS ARE LOAD-BEARING — NEVER DELETE OR "CLEAN UP" A <script> TAG. The page's 3D/WebGL and interaction layer lives in scripts that sit as SIBLINGS after </div class="velpi-page">, plus pinned CDN <script src> tags. Return every script you were given, byte-for-byte, unless the requested fix is explicitly about that script's behavior. Never move a script inside .velpi-page (GoHighLevel mangles nested scripts), never unpin a CDN version, and never remove a canvas or its CSS fallback. A fix that silently strips the 3D treatment is a failed fix and is rejected automatically.
- Keep the brand palette — no new hues, only tints/shades of what is already there, plus white and one near-black.
- Keep the desktop-first, mobile-safe contract: the page is designed on a ~1440px canvas and adapts downward via max-width media queries. Never introduce horizontal scroll at 390px, and never drop a mobile override that already exists.
- Preserve every velpi-stack-mobile / velpi-edge-mobile / velpi-full-mobile / velpi-hide-mobile / velpi-hide-desktop class already present on an element — these are the page's server-guaranteed responsive behavior, and removing one silently breaks that element on phones. If an issue calls for new responsive behavior, prefer adding one of these classes over writing an @media rule your own selectors would out-specify.
- Return ONLY the complete corrected HTML document, starting with <!DOCTYPE html>. No markdown, no commentary.`

export async function POST(request) {
  try {
    const { html, issues, images, analysis } = await request.json()
    if (!html) return Response.json({ error: 'Missing HTML to fix.' }, { status: 400 })
    if (!Array.isArray(issues) || !issues.length) {
      return Response.json({ error: 'No issues were selected to fix.' }, { status: 400 })
    }

    const palette = analysis?.color_palette || []
    const issueLines = issues.map((it, i) => {
      const target = `[target data-vid="${it.target}"]`
      const what = it.tag ? `<${it.tag}>` : ''
      const snippet = it.textSnippet ? ` "${String(it.textSnippet).slice(0, 80)}"` : ''
      const body = it.note?.trim()
        ? `USER NOTE: ${it.note.trim()}`
        : (typeof it.imageIndex === 'number'
          ? `DIAGNOSE FROM IMAGE ${it.imageIndex + 1} — the attached screenshot is this exact element. Decide what is visually wrong with it and fix it.`
          : 'DIAGNOSE THIS ELEMENT — the reviewer flagged it as visually wrong. Judge what is off (legibility, spacing, collision, hierarchy, crop) and fix it.')
      return `${i + 1}. ${target} ${what}${snippet} — ${body}`
    }).join('\n')

    const user = `BRAND: ${analysis?.business_name || ''} — ${analysis?.industry || ''}${analysis?.niche ? ` (${analysis.niche})` : ''}
BRAND PALETTE (locked): ${palette.join(', ') || '(use the page’s existing palette)'}

QA PUNCH LIST — FIX EXACTLY THESE (${issues.length}):
${issueLines}

HTML TO CORRECT:
${html}`

    const attached = Array.isArray(images) ? images.filter(im => im?.data).map(im => ({ media_type: im.media_type || 'image/jpeg', data: im.data })) : []
    const raw = await callClaude({ system: SYSTEM, user, images: attached, maxTokens: 64000 })
    const fixed = stripFences(raw)

    // Structural gates. A failure is NOT an error the user must handle — it
    // means the model's rewrite can't be trusted, so the caller keeps the
    // pre-fix HTML. Reported honestly rather than swallowed.
    const gate = checkFixedHtml(html, fixed)
    if (!gate.ok) {
      console.error('reevaluate-fix rejected by structural gates:', gate.failures.join('; '))
      return Response.json({ html, applied: false, failures: gate.failures })
    }
    return Response.json({ html: fixed, applied: true, failures: [] })
  } catch (err) {
    console.error('reevaluate-fix error:', err)
    return Response.json({ error: `Reevaluate failed: ${err.message}` }, { status: 500 })
  }
}
