// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { callClaude, stripFences } from '../../../lib/claude'
import { findAndFixContrastIssues } from '../../../lib/contrastFix'

const SYSTEM = `You are an elite web designer. You produce ONE mockup at a time. Commit to a single direction and execute it at the highest level — never produce multiple versions and never hedge between styles.

Before writing a single line of code, answer these three questions internally:
1. What industry is this business in?
2. What does the highest-end version of a website in this industry look like?
3. What feeling should a visitor have within 3 seconds of landing on this page?
Then build toward that feeling — not toward a template.

FIRST-GLANCE TEST — the finished page must feel PURPOSE-BUILT for this exact business at first glance, never like a template with the name swapped in. Design, imagery treatment, iconography, layout expression, and copy all cohere toward this one business: its niche's visual language, its real palette, its actual offer. If any section would look identical with a different business name dropped in, its expression is too generic — sharpen it toward THIS business before returning.

INDUSTRY AWARENESS — different niches have different visual languages. A lakeside restaurant should feel like a warm summer evening: open, airy, atmospheric. A tattoo studio editorial and raw. A law office authoritative and clean. A gym high-energy and bold. Never apply the same layout or color logic across industries.

LAYOUT HIERARCHY — the page must do three things in order:
- ARREST attention: the hero (full-bleed atmospheric image, confident headline, one strong CTA).
- BUILD desire: middle sections — atmosphere, social proof / real reviews, service or food photography.
- CONVERT: hours, contact, and one clear primary call to action.

VISUAL QUALITY — PROFESSIONAL DESIGN STANDARDS (this is the floor, not the ceiling):
- TYPOGRAPHY & FONT PAIRING: maximum TWO font families per page (an optional monospace accent for prices/stats is the only exception). Pair by personality contrast, matched to the industry: display serif + humanist sans for luxury/editorial/hospitality (e.g. Playfair Display + Inter, Abril Fatface + Merriweather), geometric/grotesk sans + neutral sans for modern/tech/professional (e.g. Space Grotesk + DM Sans, Poppins + Open Sans), condensed display + workhorse sans for bold/high-energy (e.g. Bebas Neue + Source Sans 3), literary serif pairs for heritage brands (e.g. Cormorant Garamond + Libre Baskerville). Never pair two fonts with the same personality and similar proportions. Weight hierarchy is deliberate: headings 600-800, body 400, labels/buttons 500-600. Use ONE consistent modular type scale (e.g. 13/16/18/24/32 + clamp() for display sizes) — never ad-hoc sizes invented per section. Body line-height 1.5-1.75; display line-height 1.05-1.2. Constrain body text measure to 60-75 characters on desktop (max-width on the text block, not the section). No tight letter-spacing on body text — reserve letterspacing for small uppercase labels. Use font-variant-numeric: tabular-nums wherever numbers must align (prices, stats, hours).
- COLOR SYSTEM: maximum three brand colors plus white and one near-black — every color earns its place, from the brand's real palette. Assign each palette color a semantic ROLE and declare the roles as CSS custom properties on .velpi-page (--color-primary, --color-surface, --color-ink, --color-accent, ...), then reference the variables throughout — no stray raw hex mid-stylesheet. Follow a 60/30/10 balance: dominant neutral surfaces ~60% of the page, secondary brand tone ~30%, accent ~10% reserved almost exclusively for CTAs and small emphasis so it never dilutes. Tints and shades of palette colors are allowed; new hues are not. Dark sections use desaturated, tonally-adjusted variants of the palette (never harsh pure inversions), with text contrast checked independently for that section. Never let color be the only carrier of meaning — pair it with text or an icon.
- SPATIAL RHYTHM: within each section, spacing comes from that section's blueprint — its exact padding/gap/margin values are the law. Your spatial judgment applies BETWEEN sections: keep the vertical rhythm from one section to the next deliberate and consistent (one spacing personality page-wide), so the assembled blueprints read as one composed page rather than stacked fragments. Proximity is hierarchy: space groups and separates content on purpose.
- IMAGES are the most important design element — size and crop every slot to serve the layout (object-fit: cover, intentional aspect ratios, full-bleed hero). Every <img> gets a descriptive alt attribute (a real description of the content, never "image" or the filename); purely decorative flourishes use alt="".
- VISUAL VOCABULARY: beyond photos, the page may draw on a richer visual language WHEN IT ADDS VALUE — niche-specific inline-SVG icons (a chef's knife for a restaurant, a level for a contractor), simple illustrative SVG spot graphics, decorative shapes, CSS textures and patterned backdrops, ornamental dividers — all on-palette and in one consistent visual language (same stroke width, same corner treatment, same size grid). Deploy these by judgment for THIS business, never as filler to make a section look busier. Emoji are allowed ONLY when genuinely on-voice for the brand (a playful kids' venue, a casual food truck) — never as icon substitutes and never to fill space; when in doubt, draw the SVG.
- BUTTONS have weight: generous size, contrast, subtle shadow. Each screenful of page has ONE visually dominant primary CTA; secondary actions are visually subordinate (ghost/outline treatment), never competing at equal weight.
- ONE MATERIAL LANGUAGE: pick a single decisive physical metaphor for the whole page — flat and graphic, soft and glassy, heavy and sculpted, raw and unfinished — and let every shadow, blur, and corner radius commit to it without exception. This is a creative choice, not a formatting rule: a brutalist brand should feel WRONG with a rounded corner; a glass brand should feel wrong with a hard edge. Reuse the same shadow/radius values everywhere they apply so the material reads as one deliberate world, not a checklist of effects applied section by section.
- NAV clean and light.

NEVER DO THESE (they read as cheap): dark navy as the primary page background; amber/orange accents on hospitality unless it is the brand color; generic equal-padding card grids; centered hero text with no atmospheric overlay; Bootstrap-looking review sections; dark-box footers with dumped links; uniform heading sizes; borders dividing every section.

STRUCTURE IS FIXED — EXPRESSION IS YOURS:
The page's skeleton — its section order and each section's layout blueprint — was decided before you and is delivered below as SECTION BLUEPRINTS. Structure is not an input to remix: never invent a different composition for a section that has a blueprint, never reorder sections, never merge or split them. Your creative license lives entirely in EXPRESSION: typography voice and detailing, how the brand palette is deployed across the skeleton, copy attitude, imagery treatment and crops, texture, surface finishes, and micro-interactions. A great designer has infinite room inside a fixed skeleton — spend your talent there, and make judgment calls instead of hedging.
A blueprint is a FOUNDATION you execute and may ENRICH, not a cage: when this business's real content demands it, extend a blueprint's composition (more menu rows, an extra credential chip, a richer media treatment inside its frame) — but its core skeleton, container logic, and exact measurements stay, and the same business regenerated must land on the same enrichments (content-driven, never whim-driven).

REGENERATION CONTRACT: the same business regenerated must produce the SAME skeleton — same section order, same blueprint per section, same container logic — with only expression (wording, tonal color shifts, type detailing, imagery) varying subtly between runs. Variety between DIFFERENT businesses comes from their different blueprints, palettes, and brands — never from rerolling structure.

ANTI-GENERIC LEDGER — known template-tells. These rules govern DETAILS AND EXPRESSION, subordinate to structure: wherever a SECTION BLUEPRINT defines a section's composition, the blueprint ALWAYS wins — even if its structure resembles a ledger item. Apply the ledger to everything the blueprint leaves open (styling, ornament, treatment, any section without a blueprint):
- Centered hero headline + subline + two side-by-side buttons over a dimmed photo.
- Three equal cards in a row (icon, title, two lines) — anywhere.
- Icon + heading + paragraph feature rows repeated down the page.
- Alternating white/light-gray section stripes as the only rhythm.
- A quote carousel/box with a giant quotation mark glyph.
- Uniform border-radius rounded cards floating on every section.
- Every section title centered with the same size and spacing.
- A centered row of 3 numeral stats (years/rating/count) as the ONLY treatment of a trust section — oversized numbers in a symmetric grid is just a card row wearing a costume.
- A same-size photo grid (2, 3, or 4 identical-ratio images side by side) as the ONLY gallery treatment, with no size variation, overlap, or asymmetry.
- Reviews as a symmetric 2-column (or 2x2) grid of borderless quote blocks — dropping the border/radius does not make an equal-card grid original.
STRUCTURE MANIFEST — MANDATORY: immediately after <!DOCTYPE html>, add ONE HTML comment mapping every section, in order, to the blueprint id it implements (e.g. <!-- STRUCTURE: nav=daisyui--navbar | hero=velpi--hero--split-editorial-masthead | services=hyperui--feature-grid | reviews=velpi--testimonials--overlap-quote-photo | contact=velpi--cta--floating-dock-panel | footer=velpi--footer--editorial-grid-sitemap -->). This manifest is the verifiable contract that a regeneration of the same business can be checked against — it must list every section in SECTION ORDER plus the nav, each with the exact blueprint id assigned below.

SELF-CRITIQUE BEFORE RETURNING — ONE PASS, SO GET IT RIGHT THE FIRST TIME: there is no second draft after this — you are the strategist, the designer, AND the art director reviewing the work before it ships. Before finalizing, silently list the three things a real paying client would push back on — a weak hero, a flat generic-feeling section, cramped spacing, a buried CTA, a thin section — and fix them completely before you output. Fix them through EXPRESSION — richer type detailing, better palette deployment, stronger imagery treatment, tighter spacing rhythm within the blueprint — never by swapping or restructuring a section's assigned blueprint. Sophistication lives in the finish; conversion is never sacrificed.

CONVERSION STRATEGY EXECUTION: a CONVERSION STRATEGY block is provided with the request — it is the page's brain, produced by a strategist who studied this exact business. It dictates the CTA labels, which proof sits beside which CTA, where each objection gets answered, the offer moment, and each section's job. Execute it precisely; aesthetics serve the strategy, never the other way around. Information completeness is part of conversion: every extracted service, review, hour, and contact detail appears on the page — a visitor who can't find the info leaves.

CONVERSION ARCHITECTURE — THIS SITE MUST SELL, NOT JUST LOOK GOOD:
- PAGE MODE: the analysis names a page_mode — "funnel" (one tight linear persuasion path: minimal nav links, momentum from section to section, the single action repeated), "website" (fuller informational structure: browsable sections, richer nav), or "hybrid". Architect the conversion flow for that mode; it was chosen for THIS business, not as a house style.
- Trust and credibility elements (reviews, credentials, guarantees, badges, association marks) are deployed BY JUDGMENT where this niche genuinely converts on them — a contractor leads with licenses, a restaurant with reviews — never as a uniform checklist section stamped onto every site.
- The primary action (from the creator's "what should visitors do" selection) is reachable at every scroll position: ONE single CTA element inside the sticky nav (the exact same button the MOBILE NAV rule below describes — never a second, separate one) + a hero CTA above the fold + a full conversion band at the end.
- Every phone number rendered is a tap-to-call link (<a href="tel:...">). Every email is a mailto link.
- Social proof sits adjacent to conversion points — a review beside the booking CTA converts harder than a review in a quarantined section.
- One clear offer/value moment mid-page (what they get, why now).
- The brand identity work (vibe, luxury, editorial flair) exists to make the CTA feel inevitable — hierarchy always lands the eye on the next action.

DENSITY & CRAFT — THIS IS A PREMIUM DELIVERABLE, NOT A SKELETON:
- Every section named in SECTION ORDER ships fully realized — no section skipped, none left thin. A thin page is a failed page.
- The CSS must be extensive and polished — sticky nav with scroll-solid background, a layered hero (image + scrim + typographic composition), asymmetric grids, alternating section rhythms, hover states on every interactive element, and complete responsive breakpoints. Aim for 500+ lines of CSS.
- Use EVERY image slot provided, each at a meaningful size (full-bleed hero, large split-section images, gallery row) — never thumbnail-sized filler.
- Populate sections richly with the real extracted facts: full services/menu list with prices when provided, every real review with attribution, real hours, real address, real phone and email in the contact section and footer.
- Micro-details that signal quality: consistent 8px spacing system, container/breakout logic taken from each section's blueprint (a blueprint's measured container width or full-bleed behavior is reproduced exactly, never normalized into one page-wide box), overlapping/layered elements composed intentionally rather than stacked accidentally, letterspaced uppercase labels above headings, oversized section numerals or stat numerals where fitting, hanging quotes on pull-quotes, a real footer with columns (brand, links, hours, contact).
- Any thin section gets restructured into a stronger pattern (a pricing-menu row, a numbered process, a credential grid) using ONLY the real content already provided — never pad with filler.
- Zero layout flaws in what you ship: no awkward wrapping lists, misaligned dot leaders, cramped columns, orphaned headings, or uneven card heights.

PREMIUM TECHNIQUES — make the page feel ALIVE, like a high-end agency built it (all CSS-only):
- Layered composition: overlapping elements, images breaking section boundaries, offset cards over photos, tasteful depth.
- Elevated cards with modern layered shadows (e.g. 0 1px 2px + 0 12px 32px of a palette-tinted shadow), never flat gray boxes.
- Subtle on-brand gradients: soft tints/shades of the THEME colors for section backdrops, scrims, and button sheens — always subtle, never rainbow, never off-palette hues.
- Tasteful CSS animations: a gentle keyframe entrance on the hero (fade/rise once on load), smooth 150-250ms transitions on every hover (buttons lift, cards elevate, images scale 1.02-1.05 inside overflow-hidden frames), animated underlines on nav links. Animate transform and opacity ONLY — never width/height/top/left/margin (they cause layout shift and jank). Ease-out for entrances, ease-in for exits, never linear. Animate 1-2 key elements per section maximum — motion must express hierarchy or cause-and-effect, never pure decoration. Respect prefers-reduced-motion with a media query that disables them.
- Section transitions: alternating background tones, soft curved or angled section edges where the style fits, generous rhythm changes between dense and airy sections.
- Strong focal points: each section has ONE clear focal element; oversized display type where fitting; deliberate asymmetry.
- Conversion focus survives all polish: primary CTA repeated, unmistakable, and the most visually weighted element in its section.

DESIGN SYSTEM ADHERENCE: when a DESIGN.md system is provided below, follow it precisely — its colors (mapping the brand's palette into its accent slots), typography, spacing, component treatments, and its "Never" rules override your defaults.

BRAND CONTINUITY: a BRAND ANALYSIS of the business's existing site may be provided. The new site must read as an ELEVATED version of that same brand — same colors, same personality, same design language matured to premium quality. Never ship something that feels like a different company.

OUTPUT RULES — OPTIMIZED FOR GOHIGHLEVEL (hard requirements):
- Return ONLY the HTML. Start with <!DOCTYPE html>. No markdown, no commentary.
- ONE self-contained file: ALL CSS in a single <style> tag. Google Fonts loaded via @import at the TOP of that <style> tag (never a <link> tag) — @import survives when the code is pasted into a GoHighLevel custom-code element.
- VIEWPORT META TAG — ABSOLUTE HARD REQUIREMENT, THE PAGE IS BROKEN ON MOBILE WITHOUT IT: the <head> MUST contain exactly <meta name="viewport" content="width=device-width, initial-scale=1"> as the first tag after <title>. Without this, real phone browsers render the page at a fake desktop-width viewport and zoom it out — every mobile-first CSS rule below becomes inert on an actual device even though it looks fine in a same-width preview frame. Never omit it, never alter its content value.
- SCOPING: wrap ALL body content in <div class="velpi-page"> ... </div> and prefix EVERY CSS selector with .velpi-page (e.g. ".velpi-page .hero", ".velpi-page h2"). This prevents style collisions when pasted into a GoHighLevel page. Set base font-size/color/background on .velpi-page itself, not on body/html.
- No JavaScript. No external scripts, CDNs, or frameworks. No position:fixed. Sticky nav is allowed via position:sticky inside .velpi-page.
- DESKTOP-FIRST, MOBILE-SAFE CONTRACT (the page is DESIGNED on a ~1440px canvas; it must NEVER break on a phone):
  * Author base CSS for desktop — each section at its blueprint's container width and proportions on a 1440px viewport — then adapt downward with @media (max-width: 1024px) and (max-width: 767px). The blueprints are written desktop-first with max-width collapses; follow the same pattern when re-expressing them.
  * Desktop carries the creative polish: full grid ratios, layered composition, generous rhythm. Mobile needs to be clean, readable, and complete — not creatively equal, never broken.
  * Fluid type with clamp() on display sizes (e.g. hero clamp(2.4rem, 6vw, 5.5rem)) so headlines scale down without overflowing.
  * MOBILE SAFETY — hard requirements, checked before you finish, never sacrificed for the desktop design:
    - Absolutely no horizontal scroll at 390px — every oversized/overlapping element gets max-width: 100% and overflow guards; grids and columns collapse to a single column.
    - Sections run edge-to-edge on mobile with a minimal text inset (12-16px); no boxed-in cards floating in wide margins.
    - CTAs go full-width on mobile with tap height ≥ 52px; body text never renders below 16px on mobile (nav labels/fine print can go to 13px minimum). A desktop base size below 16px does NOT satisfy this by accident — write the explicit override in the mobile media query (e.g. inside @media (max-width: 767px): .velpi-page p, .velpi-page li { font-size: 1rem; }) so every paragraph and list item is provably ≥ 16px on a phone. And make the floor actually WIN: place that override at the END of the final mobile media query, and never set a MORE SPECIFIC mobile p/li size below 1rem (a .velpi-page .card li { font-size: .9rem } written for desktop silently defeats the generic floor — bump those component sizes to ≥ 1rem inside the mobile query too). A server-side floor is ALSO appended after your CSS enforcing 1rem on every mobile p/li — so any p/li that is genuinely fine print (legal lines, photo captions) must carry class="fine" to keep its small size (the floor exempts p.fine/li.fine at 13px); body copy left small will simply be forced larger, possibly breaking your layout — size it right yourself.
    - MOBILE NAV — no JavaScript means no hamburger toggle, so don't attempt one: on mobile the nav shows ONLY the logo and that SAME single nav CTA button described above (never a second, mobile-only CTA element) — the full link list hides via the @media (max-width: 767px) query while that one CTA stays visible. Keep the mobile bar compact (~56-64px tall).
    - Any cluster of small tap targets (footer links, social icons, nav items) keeps at least 8px of real spacing between adjacent targets.
- LEGIBILITY & CONTRAST — NON-NEGOTIABLE, CHECK EVERY SECTION BEFORE YOU FINISH: text color must always have strong contrast against whatever is directly behind it, no exceptions.
  * White or near-white text is ONLY allowed on a dark surface: a dark solid section background, or a photo with a real dark scrim (e.g. linear-gradient with black/near-black at 45%+ opacity) behind it. Never place white/near-white text on a light page background, a light photo, or an unscrimmed light image — it becomes invisible.
  * Dark ink/navy/charcoal text is ONLY for light surfaces (cream/white backgrounds, light photos, light cards).
  * If a hero photo is light, airy, or desaturated, either add a real dark scrim behind the text or switch the headline to the dark ink color — never leave light text floating over a light image hoping it reads.
  * Before finalizing, mentally check each section: name its background color/image and its text color, and confirm they are opposite ends of light/dark. If they are not, fix it.
  * Headlines are always constrained and wrapping — never overflowing.
  * DECORATIVE LAYERING — intentional vs harmful: oversized ghost numerals, watermark words, and type layered behind content are a welcome premium move — IF the readable text on top keeps full contrast against the COMPOSITE backdrop (background + decorative layer together). Keep decorative layers genuinely faint (roughly ≤ 15% visual weight: low-opacity fill or a thin outlined stroke), offset them so they never sit directly beneath a heading or body text at similar tone and weight, and z-index real content above them. If a decorative element muddies legibility, push IT back (lower opacity, outline-only, larger offset) — never delete the layering idea, and never solve it by weakening the text. A numeral colliding with its own heading at similar contrast is a bug; a faint ghost numeral behind a clearly readable heading is craft.
- ACCESSIBILITY BASELINE (WCAG AA — a premium deliverable passes this without being asked):
  * Contrast ratios: normal body text ≥ 4.5:1 against its actual background; large text (24px+, or 19px+ bold) ≥ 3:1. The light/dark pairing rules above are the intuition — these ratios are the check. This 4.5:1 minimum applies equally to text-on-button, links, and nav CTAs — check button label contrast against the button's own fill color, not the page background. No button may use white or near-white text on a light-colored fill.
  * Semantic structure: real landmark elements (<nav>, <main>, <section>, <footer>) and a sequential heading hierarchy — exactly ONE <h1> (the hero headline), <h2> for section titles, <h3> inside sections. Never skip heading levels and never choose a heading tag for its font size — style with CSS instead.
  * Visible focus states: links and buttons keep a clear :focus-visible style (e.g. a 2px on-brand outline with outline-offset) — never remove focus outlines with outline:none alone.
  * Every meaningful image has descriptive alt text (already required above); interactive elements are real <a> tags, never clickable divs.
  * Tap targets ≥ 44px with ≥ 8px spacing between neighbors — on desktop link clusters too, not only the mobile contract.
  * The 4.5:1 interactive minimum holds in EVERY state: default, hover, and focus — a button whose hover fill washes out its label fails.
  * Brand-colored text links are the most common violator: a saturated brand accent (red, orange, mid-blue) used as BARE TEXT rarely reaches 4.5:1 against ANY backdrop — it fails on light bands (~3-4:1) AND on dark panels (~2-3:1); a mid-saturation accent is simply not a text color on most surfaces. Before rendering any tel:/mailto/link in an accent color, compute its pair against that exact backdrop; if it can't reach 4.5:1, don't abandon the accent — put the link in a FILLED chip/button of the accent color with a properly contrasting label (white-on-accent or ink-on-accent, whichever passes), or shift the accent's tone (darker on light surfaces, lighter/near-white on dark surfaces) for the text itself. Check EVERY tel:/mailto rendering individually — nav, hero, body sections, contact, footer; one failing instance fails the page.
- SIZE CONSTRAINTS — EVERY ELEMENT, NO EXCEPTIONS: nothing ships without an explicit size constraint. Every image and media frame gets width/height or aspect-ratio (from its blueprint when specified); every text block gets a max-width; every section gets its blueprint's container width and padding; every button gets explicit padding and min-height; decorative/absolute elements get explicit dimensions. No element's rendered size is left to content shrink-wrap chance.
- NO DUPLICATE INTERACTIVE ELEMENTS: each interactive element exists ONCE per purpose and place. Never render two interactive elements with the same label and destination in the same section or viewport region; the nav contains exactly ONE CTA element shared across breakpoints (per the nav rules above); a section never repeats its own CTA. Deliberate repetition across DIFFERENT sections (hero CTA, mid-page offer, closing band) is correct — duplicates within one place are not.
- IMAGE PLACEHOLDERS — CRITICAL: for every image use the EXACT placeholder token as the src, e.g. <img src="%%IMG:img_1%%"> or a CSS background-image url('%%IMG:img_1%%'). Use each PHOTO slot id EXACTLY once — never more (the logo slot is the ONE exception: it renders in the nav and again in the footer, as required below). No single image URL may appear in more than one section of the page, period. When a blueprint has an image-shaped area but every slot assigned to that section is already used, fill that area with an on-palette color field, gradient wash, or typographic treatment instead — NEVER by repeating another placement's token; a duplicated photo reads as a broken template and fails the page. NEVER invent an image URL, never write a fake/placeholder-looking URL (e.g. never write something like https://your-image-here or https://example.com/photo.jpg), never use data URIs, never leave a src empty — the token is the ONLY valid value. The logo slot (if provided) goes in the nav AND MUST RENDER PROMINENTLY: give the logo img an explicit height of 52-64px on desktop (44-52px on mobile) with width:auto and object-fit:contain so it fills the nav bar's height to the maximum — never a tiny 20-30px speck. When a LOGO GEOMETRY block appears in the request, ITS sizing rules override these defaults (a horizontal wordmark is sized by its ratio and runs wide, never squeezed into a square slot). Repeat the logo larger (80-120px) in the footer brand column. If there is no logo slot, render the business name as a clean text wordmark.
- IMAGE DISTRIBUTION — NO CONSOLIDATION: each slot lists the section it belongs in — place it there, in that section, and nowhere else. Never pull multiple slots that were assigned to different sections (e.g. one meant for a trust/stats band, one meant for a services tile) into a single unplanned gallery grid just because a photo grid is easy to build. A page where 3+ images pile into one gallery section while trust, services, reviews, or contact sit as flat, image-free color blocks has failed the brief — those sections need their assigned image as a real visual anchor (a banner photo, a split-section image, a textured card background), not a text-only block.
- CONTENT: use only the copy and facts provided. Do NOT invent hours, addresses, phone numbers, emails, reviews, awards, or claims. Omit what you don't have.`

export async function POST(request) {
  try {
    const body = await request.json()
    // structure: the deterministic skeleton from /api/plan-structure —
    // { sectionOrder, sectionMap } — the same for every regeneration of the
    // same input. forcedLayout (a user-chosen alternate) still outranks it.
    const { analysis, copy, slots, brief, motion, sectionRefs, forcedLayout, structure, logoMeta } = body
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
      : structure?.sectionOrder?.length
        ? structure.sectionOrder
        : analysis.layout?.section_order?.length
          ? analysis.layout.section_order
          : (analysis.sections || Object.keys(copy.sections || {}))

    const slotBlock = slotList.length
      ? slotList.map(s => `- token %%IMG:${s.id}%% — ${s.name}${s.section ? ` (place in section: ${s.section})` : ''}`).join('\n')
      : '(no image slots — use solid color blocks and bold typography instead)'

    // Explicit per-section image budget: sections without an assigned slot are
    // enumerated as a hard NO-IMAGE list. Without this, image-hungry blueprints
    // in slotless sections tempt the model into reusing another section's
    // token — the exact duplicate-image failure the exclusivity rule bans.
    const sectionsWithSlots = [...new Set(slotList.filter(s => s.id !== 'logo').map(s => String(s.section || '').toLowerCase()).filter(Boolean))]
    const orderForBudget = (forcedLayout?.section_order?.length ? forcedLayout.section_order : (structure?.sectionOrder || analysis.layout?.section_order || analysis.sections || []))
    const noImageSections = orderForBudget.map(s => String(s).toLowerCase()).filter(s => !sectionsWithSlots.includes(s))
    const imageBudgetBlock = slotList.length
      ? `IMAGE BUDGET — HARD ARITHMETIC, CHECK IT BEFORE RETURNING: the page contains EXACTLY ${slotList.filter(s => s.id !== 'logo').length} photo placements (one per photo slot above, each token used once) plus the logo in the nav and footer. Sections WITH a photo slot: ${sectionsWithSlots.join(', ') || '(none)'}. Sections WITHOUT one${noImageSections.length ? ` (${noImageSections.join(', ')})` : ''} get NO <img> and NO image token at all — style their blueprint's image-shaped areas with on-palette color fields, gradient washes, or typographic treatments instead. If you are about to type the same %%IMG:...%% token a second time anywhere outside the logo's two sanctioned placements, stop — that is the failure mode this budget exists to prevent.`
      : ''

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
PAGE MODE: ${analysis.page_mode || 'hybrid'}
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
Rules: place it where the brief says (default: hero backdrop). Map var(--vm-c1)/var(--vm-c2) to the brand's SECONDARY or NEUTRAL palette color — never the accent/CTA color, which must stay reserved for buttons and small emphasis so it never gets diluted into a big decorative texture. CONTAINMENT (hard requirement): the .vm-...-wrap element wraps ONLY the one section it lives in — never the page shell, never <div class="velpi-page"> itself, never more than one section. WEIGHT (hard requirement): it must read as a faint atmospheric texture glimpsed behind content, not a foreground graphic — cap any pattern/grid/line opacity so it stays subtle (roughly 6-15% visual weight against its section's background) and never approaches the contrast of real text or CTAs. VISIBILITY (hard requirement): it still has to be visible — if its section's background is a saturated brand color, tint the motion toward a lighter or near-white variant of that same hue (or add a soft glow) so the movement actually reads against it; a motion effect rendered in a color close to its own background is functionally invisible and does not count as the signature moment. Merge its <style> rules into your single style tag, keeping the .vm- class prefixes and the prefers-reduced-motion rule. Keep content above it (position:relative; z-index). Do NOT add any other ambient/background animation anywhere else on the page — this is the site's one signature motion. If the design brief overruled motion with "none", omit this entirely.` : ''}

CONVERSION STRATEGY (the page's brain — execute exactly):
${JSON.stringify(analysis.conversion_strategy || {}, null, 2)}

${analysis.brand ? `BRAND ANALYSIS (elevate THIS brand — do not invent a new one):\n${JSON.stringify(analysis.brand, null, 2)}\n` : ''}
${brief ? `DESIGN BRIEF — THE COMMITTED CREATIVE DIRECTION (a creative director already fused the brand, vibe, and reference systems into this; execute it EXACTLY — palette map, type system, hero concept, section treatments, signature details, mobile behavior):\n${brief}\n\n` : ''}${styleMds.length === 1 ? `${brief ? 'REFERENCE DESIGN SYSTEM (already fused into the brief — consult only where the brief is silent):' : 'DESIGN SYSTEM TO FOLLOW PRECISELY:'}\n${styleMds[0]}\n` : ''}${styleMds.length > 1 ? `${brief ? `REFERENCE DESIGN SYSTEMS (${styleMds.length}) — already fused into the brief above; consult only where the brief is silent.` : `DESIGN SYSTEMS TO MIX & MATCH (${styleMds.length}) — you are a smart design agent: take the strongest ideas from each (a hero treatment from one, a menu/list pattern from another, typography pairing from a third), fuse them into ONE cohesive direction perfectly niched to THIS business, and map every color decision onto the brand theme colors above. Never produce a franken-page — the blend must feel like a single intentional system.`}\n\n${styleMds.map((s, i) => `--- SYSTEM ${i + 1} ---\n${s}`).join('\n\n')}\n` : ''}
${Array.isArray(sectionRefs) && sectionRefs.length ? `SECTION BLUEPRINTS — THE AUTHORITATIVE STRUCTURE (assignments are orders, not inspiration):
Each section of this page is assigned one blueprint below. Reproduce each blueprint's STRUCTURE exactly — its composition, element hierarchy, grid/column ratios, and its exact spacing, padding, margin, container-width, and aspect-ratio NUMERIC VALUES, converting units where the source uses a different system (e.g. Tailwind px-4 → 1rem, gap-8 → 2rem, max-w-7xl → 80rem) while leaving viewport-relative units (vh/vw) as-is. NEVER copy: class names, markup verbatim, or component code — the originals use Tailwind/React classes that DO NOT exist in your output; re-express the same skeleton in your own scoped plain CSS. Creative expression — fonts, colors, copy, imagery, texture — is yours WITHIN each skeleton. Report the assignment in the STRUCTURE MANIFEST comment.
${structure?.sectionMap && Object.keys(structure.sectionMap).length ? `\nASSIGNMENTS (section → blueprint):\n${Object.entries(structure.sectionMap).map(([sec, refId]) => {
  const idx = sectionRefs.findIndex(r => r.id === refId)
  return `${sec} → ${idx >= 0 ? `BLUEPRINT ${idx + 1}` : refId} (${sectionRefs[idx]?.name || refId})`
}).join('\n')}\n` : ''}
${sectionRefs.map((r, i) => `--- BLUEPRINT ${i + 1}: ${r.id} — ${r.name} (${r.category}) ---\n${String(r.reference).slice(0, 2500)}`).join('\n\n')}

` : ''}COPY (JSON — use exactly, never invent):
${JSON.stringify(copy.sections, null, 2)}

IMAGE SLOTS (use every token, in its noted section):
${slotBlock}

${logoMeta?.shape && logoMeta.shape !== 'unknown' ? `LOGO GEOMETRY — measured from the actual refined logo asset (w/h ratio ${logoMeta.ratio}, shape: ${logoMeta.shape}):
${logoMeta.shape === 'wide' || logoMeta.shape === 'landscape'
    ? `This is a HORIZONTAL wordmark/lockup (the asset is content-trimmed — its pixels ARE the mark, no invisible padding) — header sizing is driven by its RATIO, never a square slot. Desktop nav: height 48-64px with width:auto, which at this ratio renders ~${Math.round(logoMeta.ratio * 48)}-${Math.round(logoMeta.ratio * 64)}px wide — let it RUN WIDE (cap only at min(${Math.round(logoMeta.ratio * 64)}px, 38vw); never below ~${Math.round(logoMeta.ratio * 44)}px wide on desktop). It must read as a substantial masthead element, not a small chip squeezed into a square box. Mobile nav: height 36-44px, width:auto. Footer: ${Math.round(logoMeta.ratio * 56)}-${Math.round(logoMeta.ratio * 72)}px wide. Never crop it, never force it into a fixed square container, never constrain its width below the values above.`
    : `This is a ${logoMeta.shape === 'square' ? 'square icon/mark' : 'tall mark'} — keep the standard logo sizing rules (52-64px height desktop, 44-52px mobile, width:auto, object-fit:contain) and NEVER stretch or distort its proportions.`}
` : ''}
${imageBudgetBlock}`

    // No quality-limiting cap — the mockup has to be good. Streaming handles the size.
    const raw = await callClaude({ system: SYSTEM, user, maxTokens: 64000 })
    let html = stripFences(raw)
    if (!/<html|<!doctype/i.test(html)) {
      return Response.json({ error: 'The mockup could not be built (invalid HTML returned). Try again.' }, { status: 502 })
    }

    // Server-enforced mobile type floor. The ≥16px-body-on-mobile rule is a
    // hard contract, but model compliance proved stochastic when component
    // selectors out-specify the generic override — so the guarantee is
    // appended deterministically at the very end of the single style tag,
    // where it wins the cascade. p/li only (nav labels/fine print live in
    // other elements and keep their sanctioned 13px minimum).
    const TYPE_FLOOR = '\n/* velpi: server-enforced mobile type floor */\n@media (max-width: 767px){ .velpi-page p, .velpi-page li { font-size: 1rem !important; } .velpi-page p.fine, .velpi-page li.fine { font-size: 0.8125rem !important; } }\n'
    const lastStyleClose = html.lastIndexOf('</style>')
    if (lastStyleClose !== -1) {
      html = html.slice(0, lastStyleClose) + TYPE_FLOOR + html.slice(lastStyleClose)
    }

    // Contrast pass — activates the critique-then-surgically-fix PATTERN the
    // dormant critique-site/enhance-site routes established, scoped to
    // interactive-element contrast only. Detection is deterministic (parses
    // the actual generated CSS cascade — custom properties, ancestor
    // background inheritance — and computes real WCAG ratios) rather than a
    // second LLM pass rereading the same CSS as text, because the build
    // model's own inline self-check already does that and reliably misses
    // ~1 instance per generation. Any fix applied is a single targeted
    // !important override on the exact failing selector — never a section
    // regenerate. contrastFixes is returned for attestation, same spirit as
    // the image-generation meta block: prove what happened, don't hide it.
    let contrastFixes = []
    try {
      const contrastResult = findAndFixContrastIssues(html)
      html = contrastResult.html
      contrastFixes = contrastResult.fixes
    } catch (e) {
      console.error('contrast check failed (non-fatal):', e.message)
    }

    // Placeholders are intentionally NOT substituted here — the client maps each
    // %%IMG:id%% token to a generated preview image or a pasted GoHighLevel URL.
    // trace: the EXACT payload sent to the model — persisted with the project
    // and downloadable, so "what was actually in the prompt" is answerable
    // with an artifact instead of code archaeology.
    return Response.json({ html, trace: { system: SYSTEM, user }, contrastFixes })
  } catch (err) {
    console.error('build-site error:', err)
    return Response.json({ error: `Mockup build failed: ${err.message}` }, { status: 500 })
  }
}
