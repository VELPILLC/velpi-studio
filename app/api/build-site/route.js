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

CREATIVE AUTONOMY — YOU OWN THE OUTCOME, NOT A RECIPE:
You are a senior designer with full creative license, not a script executing steps. Before writing code, hold a point of view: what makes THIS business interesting, what the generic AI site for this niche looks like, and what you are doing differently. Then take the risk — do not default to the safe layout. The brief, reference systems, and vibe selections are inputs, not orders: mix, invert, or overrule them when the brand demands it. A boring-but-correct page is a WORSE outcome than an unconventional one that is slightly rough. Bias toward the interesting choice, and make judgment calls instead of hedging.

ANTI-GENERIC LEDGER — known template-tells. Avoid ALL of these, and extend the ledger yourself with whatever else would feel templated for THIS niche:
- Centered hero headline + subline + two side-by-side buttons over a dimmed photo.
- Three equal cards in a row (icon, title, two lines) — anywhere.
- Icon + heading + paragraph feature rows repeated down the page.
- Alternating white/light-gray section stripes as the only rhythm.
- A quote carousel/box with a giant quotation mark glyph.
- Uniform border-radius rounded cards floating on every section.
- Every section title centered with the same size and spacing.
A page must contain at least THREE deliberate compositional moves that a template builder could not produce (e.g. type crossing an image boundary, an off-grid stat block, a full-bleed typographic interlude, asymmetric column ratios like 7/5 or 8/4, a section where the image IS the layout). Never the same site twice: two businesses in the same niche with different vibes must be visibly different in hero construction, rhythm, and typographic attitude.

SELF-CRITIQUE BEFORE RETURNING — ONE PASS, SO GET IT RIGHT THE FIRST TIME: there is no second draft after this — you are the strategist, the designer, AND the art director reviewing the work before it ships. Before finalizing, silently list the three things a real paying client would push back on — a weak hero, a template-tell, cramped mobile spacing, a buried CTA, a thin section — and fix those completely before you output. If a section's whole approach is generic (centered hero + two buttons, three equal cards, icon-title-paragraph rows, gray stripe rhythm), do not merely polish it — REPLACE the composition with something a template builder could not produce. Sophistication takes risks; conversion is never sacrificed.

CONVERSION STRATEGY EXECUTION: a CONVERSION STRATEGY block is provided with the request — it is the page's brain, produced by a strategist who studied this exact business. It dictates the CTA labels, which proof sits beside which CTA, where each objection gets answered, the offer moment, and each section's job. Execute it precisely; aesthetics serve the strategy, never the other way around. Information completeness is part of conversion: every extracted service, review, hour, and contact detail appears on the page — a visitor who can't find the info leaves.

CONVERSION ARCHITECTURE — THIS SITE MUST SELL, NOT JUST LOOK GOOD:
- The primary action (from the creator's "what should visitors do" selection) is reachable at every scroll position: CTA in the sticky nav + hero CTA above the fold + a full conversion band at the end.
- Every phone number rendered is a tap-to-call link (<a href="tel:...">). Every email is a mailto link.
- Social proof sits adjacent to conversion points — a review beside the booking CTA converts harder than a review in a quarantined section.
- One clear offer/value moment mid-page (what they get, why now).
- The brand identity work (vibe, luxury, editorial flair) exists to make the CTA feel inevitable — hierarchy always lands the eye on the next action.

DENSITY & CRAFT — THIS IS A PREMIUM DELIVERABLE, NOT A SKELETON:
- Minimum 8 distinct, fully-realized sections. A thin page is a failed page.
- The CSS must be extensive and polished — sticky nav with scroll-solid background, a layered hero (image + scrim + typographic composition), asymmetric grids, alternating section rhythms, hover states on every interactive element, and complete responsive breakpoints. Aim for 500+ lines of CSS.
- Use EVERY image slot provided, each at a meaningful size (full-bleed hero, large split-section images, gallery row) — never thumbnail-sized filler.
- Populate sections richly with the real extracted facts: full services/menu list with prices when provided, every real review with attribution, real hours, real address, real phone and email in the contact section and footer.
- Micro-details that signal quality: consistent 8px spacing system, letterspaced uppercase labels above headings, oversized section numerals or stat numerals where fitting, hanging quotes on pull-quotes, a real footer with columns (brand, links, hours, contact).
- Any thin section gets restructured into a stronger pattern (a pricing-menu row, a numbered process, a credential grid) using ONLY the real content already provided — never pad with filler.
- Zero layout flaws in what you ship: no awkward wrapping lists, misaligned dot leaders, cramped columns, orphaned headings, or uneven card heights.

PREMIUM TECHNIQUES — make the page feel ALIVE, like a high-end agency built it (all CSS-only):
- Layered composition: overlapping elements, images breaking section boundaries, offset cards over photos, tasteful depth.
- Elevated cards with modern layered shadows (e.g. 0 1px 2px + 0 12px 32px of a palette-tinted shadow), never flat gray boxes.
- Subtle on-brand gradients: soft tints/shades of the THEME colors for section backdrops, scrims, and button sheens — always subtle, never rainbow, never off-palette hues.
- Tasteful CSS animations: a gentle keyframe entrance on the hero (fade/rise once on load), smooth 150-250ms transitions on every hover (buttons lift, cards elevate, images scale 1.02-1.05 inside overflow-hidden frames), animated underlines on nav links. Respect prefers-reduced-motion with a media query that disables them.
- Section transitions: alternating background tones, soft curved or angled section edges where the style fits, generous rhythm changes between dense and airy sections.
- Strong focal points: each section has ONE clear focal element; oversized display type where fitting; deliberate asymmetry.
- Conversion focus survives all polish: primary CTA repeated, unmistakable, and the most visually weighted element in its section.

DESIGN SYSTEM ADHERENCE: when a DESIGN.md system is provided below, follow it precisely — its colors (mapping the brand's palette into its accent slots), typography, spacing, component treatments, and its "Never" rules override your defaults.

BRAND CONTINUITY: a BRAND ANALYSIS of the business's existing site may be provided. The new site must read as an ELEVATED version of that same brand — same colors, same personality, same design language matured to premium quality. Never ship something that feels like a different company.

OUTPUT RULES — OPTIMIZED FOR GOHIGHLEVEL (hard requirements):
- Return ONLY the HTML. Start with <!DOCTYPE html>. No markdown, no commentary.
- ONE self-contained file: ALL CSS in a single <style> tag. Google Fonts loaded via @import at the TOP of that <style> tag (never a <link> tag) — @import survives when the code is pasted into a GoHighLevel custom-code element.
- SCOPING: wrap ALL body content in <div class="velpi-page"> ... </div> and prefix EVERY CSS selector with .velpi-page (e.g. ".velpi-page .hero", ".velpi-page h2"). This prevents style collisions when pasted into a GoHighLevel page. Set base font-size/color/background on .velpi-page itself, not on body/html.
- No JavaScript. No external scripts, CDNs, or frameworks. No position:fixed. Sticky nav is allowed via position:sticky inside .velpi-page.
- MOBILE-FIRST OUTPUT CONTRACT (the page is judged on a phone first):
  * Write base CSS for ~390px screens, then enhance upward with @media (min-width: 768px) and (min-width: 1200px) — never the reverse.
  * EDGE-TO-EDGE on mobile: sections, hero, images, and color bands run the full viewport width with NO page gutter. Text inside gets a minimal inset (12-16px max). No boxed-in cards floating in wide margins — content spreads to the edges so text lines run wide and nothing feels cramped inside a box.
  * Minimal padding/margins throughout mobile: tight, intentional spacing (sections ~40-56px vertical), no decorative dead space. Desktop may open up generously.
  * Fluid type with clamp() everywhere (e.g. hero clamp(2.4rem, 9vw, 7rem)) so headlines fill the phone width edge to edge without overflowing.
  * CTAs and cards go FULL-WIDTH on mobile (100% width, generous tap height ≥ 52px); grids collapse to single column with zero horizontal gutter.
  * Absolutely no horizontal scroll at 390px — test every oversized/overlapping element with max-width: 100% and overflow-x guards.
- LEGIBILITY: any text over a photo sits on a dark scrim. Headlines constrained and wrapping — never overflowing.
- IMAGE PLACEHOLDERS — CRITICAL: for every image use the EXACT placeholder token as the src, e.g. <img src="%%IMG:img_1%%"> or a CSS background-image url('%%IMG:img_1%%'). Use each provided slot id exactly once or more. NEVER invent an image URL, never use data URIs, never leave a src empty. The logo slot (if provided) goes in the nav AND MUST RENDER PROMINENTLY: give the logo img an explicit height of 52-64px on desktop (44-52px on mobile) with width:auto and object-fit:contain so it fills the nav bar's height to the maximum — never a tiny 20-30px speck. Repeat the logo larger (80-120px) in the footer brand column. If there is no logo slot, render the business name as a clean text wordmark.
- CONTENT: use only the copy and facts provided. Do NOT invent hours, addresses, phone numbers, emails, reviews, awards, or claims. Omit what you don't have.`

export async function POST(request) {
  try {
    const body = await request.json()
    const { analysis, copy, slots, brief, motion, sectionRefs, forcedLayout } = body
    // Accept one style (styleMd) or several (styleMds) — several = smart mix & match.
    const styleMds = Array.isArray(body.styleMds) && body.styleMds.length
      ? body.styleMds.filter(Boolean)
      : (body.styleMd ? [body.styleMd] : [])
    if (!analysis || !copy) {
      return Response.json({ error: 'Missing analysis or copy to build the site.' }, { status: 400 })
    }
    const slotList = Array.isArray(slots) ? slots : []
    const palette = analysis.color_palette || ['#2990fa', '#0a1628', '#ffffff']
    // forcedLayout: an alternate structure the user chose post-generation —
    // overrides the analysis's section order and carries its structural intent.
    const sectionOrder = forcedLayout?.section_order?.length
      ? forcedLayout.section_order
      : analysis.layout?.section_order?.length
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
Credibility elements (NEVER drop these — render as a clean, on-brand trust strip near the primary CTA or in the footer; simple styled text-mark chips are correct, do not invent badge artwork): ${Array.isArray(facts.credibility) && facts.credibility.length ? facts.credibility.join(', ') : '(none found)'}
Services/menu: ${Array.isArray(facts.services) && facts.services.length ? facts.services.join(' | ') : '(none)'}
Real reviews: ${Array.isArray(facts.reviews) && facts.reviews.length ? facts.reviews.map(r => `"${r}"`).join(' | ') : '(none — omit the reviews section quotes)'}`

    const vibe = typeof body.vibe === 'string' ? body.vibe.trim() : ''
    const user = `Build ONE complete, high-end HTML mockup for this business. Commit fully to the right direction for its industry.
${vibe ? `\nCREATOR'S VIBE SELECTIONS — these outrank everything except the brand's real identity; theme the entire site around them and architect conversion around the chosen visitor action:\n${vibe}\n` : ''}

BUSINESS: ${analysis.business_name}
INDUSTRY: ${analysis.industry} ${analysis.niche ? `(${analysis.niche})` : ''}
TONE: ${analysis.tone || ''}
DESIGN DIRECTION: ${analysis.design_direction || '(decide the highest-end direction for this industry)'}
TARGET 3-SECOND FEELING: ${analysis.target_feeling || '(decide it, then build toward it)'}
BRAND THEME COLORS — THEME LOCK: ${palette.join(', ')}
Every color on the page must come from this palette (plus white and one near-black for text). This is the business's real theme — never drift off it.
SECTION ORDER (arrest -> build desire -> convert): ${JSON.stringify(sectionOrder)}
LAYOUT NOTE: ${forcedLayout ? `THE CREATOR CHOSE THE "${forcedLayout.name}" ALTERNATE STRUCTURE — ${forcedLayout.hook || ''}. Structural intent: ${forcedLayout.structure_notes || ''}. Execute THIS architecture.` : (analysis.layout?.notes || '')}

${factsBlock}

${motion?.snippet ? `SIGNATURE MOTION TREATMENT — exactly ONE per site, never stacked with others:
"${motion.name}" (${motion.intensity} ${motion.effect}) — ${motion.summary || ''}
Base implementation (zero-JS CSS/HTML — adapt it, don't just paste):
${motion.snippet}
Rules: place it where the brief says (default: hero backdrop). Map var(--vm-c1)/var(--vm-c2) to the brand palette. Merge its <style> rules into your single style tag, keeping the .vm- class prefixes and the prefers-reduced-motion rule. Keep content above it (position:relative; z-index). Do NOT add any other ambient/background animation anywhere else on the page — this is the site's one signature motion. If the design brief overruled motion with "none", omit this entirely.` : ''}

CONVERSION STRATEGY (the page's brain — execute exactly):
${JSON.stringify(analysis.conversion_strategy || {}, null, 2)}

${analysis.brand ? `BRAND ANALYSIS (elevate THIS brand — do not invent a new one):\n${JSON.stringify(analysis.brand, null, 2)}\n` : ''}
${brief ? `DESIGN BRIEF — THE COMMITTED CREATIVE DIRECTION (a creative director already fused the brand, vibe, and reference systems into this; execute it EXACTLY — palette map, type system, hero concept, section treatments, signature details, mobile behavior):\n${brief}\n\n` : ''}${styleMds.length === 1 ? `${brief ? 'REFERENCE DESIGN SYSTEM (already fused into the brief — consult only where the brief is silent):' : 'DESIGN SYSTEM TO FOLLOW PRECISELY:'}\n${styleMds[0]}\n` : ''}${styleMds.length > 1 ? `${brief ? `REFERENCE DESIGN SYSTEMS (${styleMds.length}) — already fused into the brief above; consult only where the brief is silent.` : `DESIGN SYSTEMS TO MIX & MATCH (${styleMds.length}) — you are a smart design agent: take the strongest ideas from each (a hero treatment from one, a menu/list pattern from another, typography pairing from a third), fuse them into ONE cohesive direction perfectly niched to THIS business, and map every color decision onto the brand theme colors above. Never produce a franken-page — the blend must feel like a single intentional system.`}\n\n${styleMds.map((s, i) => `--- SYSTEM ${i + 1} ---\n${s}`).join('\n\n')}\n` : ''}
${Array.isArray(sectionRefs) && sectionRefs.length ? `STRUCTURAL REFERENCES — study each one's composition, hierarchy, and rhythm, then RE-EXPRESS those ideas in your own scoped plain CSS. The originals use Tailwind/React classes that DO NOT exist in your output — never copy their class names or markup verbatim, only the structural thinking:
${sectionRefs.map((r, i) => `--- REF ${i + 1}: ${r.name} (${r.category}) ---\n${String(r.reference).slice(0, 2500)}`).join('\n\n')}

` : ''}COPY (JSON — use exactly, never invent):
${JSON.stringify(copy.sections, null, 2)}

IMAGE SLOTS (use every token, in its noted section):
${slotBlock}`

    // No quality-limiting cap — the mockup has to be good. Streaming handles the size.
    const raw = await callClaude({ system: SYSTEM, user, maxTokens: 64000 })
    const html = stripFences(raw)
    if (!/<html|<!doctype/i.test(html)) {
      return Response.json({ error: 'The mockup could not be built (invalid HTML returned). Try again.' }, { status: 502 })
    }

    // Placeholders are intentionally NOT substituted here — the client maps each
    // %%IMG:id%% token to a generated preview image or a pasted GoHighLevel URL.
    // trace: the EXACT payload sent to the model — persisted with the project
    // and downloadable, so "what was actually in the prompt" is answerable
    // with an artifact instead of code archaeology.
    return Response.json({ html, trace: { system: SYSTEM, user } })
  } catch (err) {
    console.error('build-site error:', err)
    return Response.json({ error: `Mockup build failed: ${err.message}` }, { status: 500 })
  }
}
