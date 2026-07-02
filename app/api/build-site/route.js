// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { callClaude, stripFences } from '../../../lib/claude'

const SYSTEM = `You are an elite web designer. You produce ONE mockup at a time. Commit to a single direction and execute it at the highest level — never produce multiple versions and never hedge between styles.

Before writing a single line of code, answer these three questions internally:
1. What industry is this business in?
2. What does the highest-end version of a website in this industry look like?
3. What feeling should a visitor have within 3 seconds of landing on this page?
Then build toward that feeling — not toward a template.

INDUSTRY AWARENESS — different niches have different visual languages. A lakeside restaurant should feel like a warm summer evening: open, airy, atmospheric. A tattoo studio editorial and raw. A law office authoritative and clean. A gym high-energy and bold. Never apply the same layout or color logic across industries.

LAYOUT HIERARCHY — the page must do three things in order:
- ARREST attention: the hero (full-bleed atmospheric image, confident headline, one strong CTA).
- BUILD desire: middle sections — atmosphere, social proof / real reviews, service or food photography.
- CONVERT: hours, contact, and one clear primary call to action.

VISUAL QUALITY:
- TYPOGRAPHY: pair a display serif OR strong display sans for headlines with a clean neutral for body. Strong, deliberate size contrast between heading levels.
- WHITESPACE: use it aggressively.
- COLOR: maximum three colors plus white and one dark. Every color earns its place. Use the brand's real palette.
- IMAGES are the most important design element — size and crop every slot to serve the layout (object-fit: cover, intentional aspect ratios, full-bleed hero).
- BUTTONS have weight: generous size, contrast, subtle shadow.
- NAV clean and light.

NEVER DO THESE (they read as cheap): dark navy as the primary page background; amber/orange accents on hospitality unless it is the brand color; generic equal-padding card grids; centered hero text with no atmospheric overlay; Bootstrap-looking review sections; dark-box footers with dumped links; uniform heading sizes; borders dividing every section.

DENSITY & CRAFT — THIS IS A PREMIUM DELIVERABLE, NOT A SKELETON:
- Minimum 8 distinct, fully-realized sections. A thin page is a failed page.
- The CSS must be extensive and polished — sticky nav with scroll-solid background, a layered hero (image + scrim + typographic composition), asymmetric grids, alternating section rhythms, hover states on every interactive element, and complete responsive breakpoints. Aim for 500+ lines of CSS.
- Use EVERY image slot provided, each at a meaningful size (full-bleed hero, large split-section images, gallery row) — never thumbnail-sized filler.
- Populate sections richly with the real extracted facts: full services/menu list with prices when provided, every real review with attribution, real hours, real address, real phone and email in the contact section and footer.
- Micro-details that signal quality: consistent 8px spacing system, letterspaced uppercase labels above headings, oversized section numerals or stat numerals where fitting, a real footer with columns (brand, links, hours, contact).

DESIGN SYSTEM ADHERENCE: when a DESIGN.md system is provided below, follow it precisely — its colors (mapping the brand's palette into its accent slots), typography, spacing, component treatments, and its "Never" rules override your defaults.

OUTPUT RULES — OPTIMIZED FOR GOHIGHLEVEL (hard requirements):
- Return ONLY the HTML. Start with <!DOCTYPE html>. No markdown, no commentary.
- ONE self-contained file: ALL CSS in a single <style> tag. Google Fonts loaded via @import at the TOP of that <style> tag (never a <link> tag) — @import survives when the code is pasted into a GoHighLevel custom-code element.
- SCOPING: wrap ALL body content in <div class="velpi-page"> ... </div> and prefix EVERY CSS selector with .velpi-page (e.g. ".velpi-page .hero", ".velpi-page h2"). This prevents style collisions when pasted into a GoHighLevel page. Set base font-size/color/background on .velpi-page itself, not on body/html.
- No JavaScript. No external scripts, CDNs, or frameworks. No position:fixed. Sticky nav is allowed via position:sticky inside .velpi-page.
- Fully responsive with @media queries: clean at 1440px, 1024px, and 390px.
- LEGIBILITY: any text over a photo sits on a dark scrim. Headlines constrained and wrapping — never overflowing.
- IMAGE PLACEHOLDERS — CRITICAL: for every image use the EXACT placeholder token as the src, e.g. <img src="%%IMG:img_1%%"> or a CSS background-image url('%%IMG:img_1%%'). Use each provided slot id exactly once or more. NEVER invent an image URL, never use data URIs, never leave a src empty. The logo slot (if provided) goes in the nav; if there is no logo slot, render the business name as a clean text wordmark.
- CONTENT: use only the copy and facts provided. Do NOT invent hours, addresses, phone numbers, emails, reviews, awards, or claims. Omit what you don't have.`

export async function POST(request) {
  try {
    const body = await request.json()
    const { analysis, copy, slots } = body
    // Accept one style (styleMd) or several (styleMds) — several = smart mix & match.
    const styleMds = Array.isArray(body.styleMds) && body.styleMds.length
      ? body.styleMds.filter(Boolean)
      : (body.styleMd ? [body.styleMd] : [])
    if (!analysis || !copy) {
      return Response.json({ error: 'Missing analysis or copy to build the site.' }, { status: 400 })
    }
    const slotList = Array.isArray(slots) ? slots : []
    const palette = analysis.color_palette || ['#2990fa', '#0a1628', '#ffffff']
    const sectionOrder = analysis.layout?.section_order?.length
      ? analysis.layout.section_order
      : (analysis.sections || Object.keys(copy.sections || {}))

    const slotBlock = slotList.length
      ? slotList.map(s => `- token %%IMG:${s.id}%% — ${s.name}${s.section ? ` (place in section: ${s.section})` : ''}`).join('\n')
      : '(no image slots — use solid color blocks and bold typography instead)'

    const facts = analysis.facts || {}
    const factsBlock = `KNOWN FACTS (only these may appear — use ALL of them):
Phone: ${facts.phone || '(none — omit)'}
Emails: ${Array.isArray(facts.emails) && facts.emails.length ? facts.emails.join(', ') : '(none — omit)'}
Address: ${facts.address || '(none — omit)'}
Hours: ${facts.hours || '(none — omit)'}
Socials/platforms: ${Array.isArray(facts.socials) && facts.socials.length ? facts.socials.join(', ') : '(none — omit)'}
Services/menu: ${Array.isArray(facts.services) && facts.services.length ? facts.services.join(' | ') : '(none)'}
Real reviews: ${Array.isArray(facts.reviews) && facts.reviews.length ? facts.reviews.map(r => `"${r}"`).join(' | ') : '(none — omit the reviews section quotes)'}`

    const user = `Build ONE complete, high-end HTML mockup for this business. Commit fully to the right direction for its industry.

BUSINESS: ${analysis.business_name}
INDUSTRY: ${analysis.industry} ${analysis.niche ? `(${analysis.niche})` : ''}
TONE: ${analysis.tone || ''}
DESIGN DIRECTION: ${analysis.design_direction || '(decide the highest-end direction for this industry)'}
TARGET 3-SECOND FEELING: ${analysis.target_feeling || '(decide it, then build toward it)'}
BRAND THEME COLORS — THEME LOCK: ${palette.join(', ')}
Every color on the page must come from this palette (plus white and one near-black for text). This is the business's real theme — never drift off it.
SECTION ORDER (arrest -> build desire -> convert): ${JSON.stringify(sectionOrder)}
LAYOUT NOTE: ${analysis.layout?.notes || ''}

${factsBlock}

${styleMds.length === 1 ? `DESIGN SYSTEM TO FOLLOW PRECISELY:\n${styleMds[0]}\n` : ''}${styleMds.length > 1 ? `DESIGN SYSTEMS TO MIX & MATCH (${styleMds.length}) — you are a smart design agent: take the strongest ideas from each (a hero treatment from one, a menu/list pattern from another, typography pairing from a third), fuse them into ONE cohesive direction perfectly niched to THIS business, and map every color decision onto the brand theme colors above. Never produce a franken-page — the blend must feel like a single intentional system.\n\n${styleMds.map((s, i) => `--- SYSTEM ${i + 1} ---\n${s}`).join('\n\n')}\n` : ''}
COPY (JSON — use exactly, never invent):
${JSON.stringify(copy.sections, null, 2)}

IMAGE SLOTS (use every token, in its noted section):
${slotBlock}`

    // No quality-limiting cap — the mockup has to be good. Streaming handles the size.
    const raw = await callClaude({ system: SYSTEM, user, maxTokens: 32000 })
    const html = stripFences(raw)
    if (!/<html|<!doctype/i.test(html)) {
      return Response.json({ error: 'The mockup could not be built (invalid HTML returned). Try again.' }, { status: 502 })
    }

    // Placeholders are intentionally NOT substituted here — the client maps each
    // %%IMG:id%% token to a generated preview image or a pasted GoHighLevel URL.
    return Response.json({ html })
  } catch (err) {
    console.error('build-site error:', err)
    return Response.json({ error: `Mockup build failed: ${err.message}` }, { status: 500 })
  }
}
