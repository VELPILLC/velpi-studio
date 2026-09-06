// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { callClaude, parseJson, stripFences } from '../../../lib/claude'
import { findAssetCandidates } from '../../../lib/assetLibrary'
import { reconcilePalette } from '../../../lib/brandPalette.mjs'

// Claude vision accepts these only — a scraped SVG logo (very common) simply
// isn't sent, and the analysis proceeds exactly as it did before.
const VISION_TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }
const MAX_LOGO_BYTES = 3.5 * 1024 * 1024

// The logo is the single most reliable statement of what a brand looks like,
// and until now it only ever reached the model as a URL string. Load the
// actual bytes so the analysis can SEE the mark. Best-effort by design:
// any failure returns null and the caller falls back to the old text-only path.
async function loadLogoImage(src) {
  if (!src || typeof src !== 'string') return null
  const trimmed = src.trim()

  const dataMatch = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(trimmed)
  if (dataMatch) {
    const mt = dataMatch[1].toLowerCase()
    if (!Object.values(VISION_TYPES).includes(mt)) return null
    return { media_type: mt, data: dataMatch[2] }
  }

  if (!/^https?:\/\//i.test(trimmed)) return null
  const ext = (trimmed.split('?')[0].split('.').pop() || '').toLowerCase()
  const res = await fetch(trimmed)
  if (!res.ok) return null
  const headerType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  const media_type = Object.values(VISION_TYPES).includes(headerType) ? headerType : VISION_TYPES[ext]
  if (!media_type) return null // SVG, ICO, or anything vision can't read
  const buf = Buffer.from(await res.arrayBuffer())
  if (!buf.length || buf.length > MAX_LOGO_BYTES) return null
  return { media_type, data: buf.toString('base64') }
}

const REPAIR_SYSTEM = `You are given text that was supposed to be a single valid JSON object but failed to parse. The single most common cause: a stray, UNESCAPED double-quote mark inside a string value — usually a reviewer's own quoted word or aside (e.g. their annual "checkup" or a "nickname") that got left as a literal " instead of \\" (or a single quote). Scan every string value for this first and fix any you find. The next most common cause is truncation (cut off mid-response) — if that's what happened instead, complete it sensibly using the surrounding context (never invent new facts — only close out the structure). Return ONLY the corrected, complete, valid JSON object with the exact same content and meaning. No markdown, no commentary, no explanation — JSON only.`

const INDUSTRY_PATTERNS = `INDUSTRY STRUCTURE PATTERNS — apply the matching one (detect any other industry automatically and apply the best-fit structure):
- HVAC: emergency-availability hero, services, trust signals, phone CTA
- Restaurant: atmosphere hero, menu highlights, reservations, hours
- Law firm: authority hero, practice areas, credentials, free-consult CTA
- Gym: transformation hero, classes, community, trial-offer CTA
- Medical/Dental: trust hero, services, credentials, booking CTA
- Contractor: portfolio hero, services, guarantees, quote CTA
- Salon/Beauty: portfolio hero, services, booking CTA
- Retail: product hero, featured items, offers, hours
- Real estate: listings hero, agent credibility, contact CTA
- Auto: services or inventory hero, trust signals, contact CTA`

const SYSTEM = `You are a senior brand and web strategist analyzing a business website that was crawled across multiple pages. Work this process:

STEP — RECON: extract EVERY piece of real information, exhaustively — business name, every phone number, every email address, every physical address/location, hours, social media links, nav structure, every service/menu item with prices when shown, every review/quote with attribution, taglines, delivery platforms, credentials, years in business. Miss nothing — the user reads this extraction directly.
STEP — DIRECTION: commit to ONE highest-end creative direction appropriate to THIS industry (never a generic template) and name the single feeling a visitor should have within 3 seconds. Also decide the page's MODE by judgment: "funnel" (one linear persuasion path, minimal nav, one repeated action — fits urgent/single-service/offer-driven businesses), "website" (fuller informational structure — fits browse-heavy, menu/portfolio, multi-service businesses), or "hybrid". Choose what converts best for THIS business, not a house default.
STEP — READ THE LOGO (when a logo image is attached): the FIRST attached image is this business's actual logo. It is the most reliable statement of who this brand is — read it before you decide anything visual, and fill in brand_read from what you actually SEE in it:
  * COLORS: the real hexes in the mark, most dominant first, each with the role it plays (primary / secondary / accent / neutral). Report what is THERE, not what you think would look premium.
  * TYPOGRAPHY: classify the lettering — geometric sans, humanist sans, transitional serif, didone, slab, script, hand-drawn, display — plus weight and case. The new site's type should feel related to this, not arbitrary.
  * VISUAL LANGUAGE: era, ornamentation level, geometry (rounded/sharp/organic), and any recurring motif.
  * THE PALETTE RULE — THIS IS WHERE SITES GO WRONG: color_palette must be built from the colors that are actually in this logo. A category prior ("premium restaurants use navy and gold") NEVER outranks the mark in front of you — a red-and-gold logo gets a red-and-gold site. You may add tints, shades, and one neutral, but do not introduce a hue the brand does not own.
  * If NO logo image is attached, leave brand_read null and say so via confidence 0 — never guess a mark you cannot see.
STEP — INFER THE VIBE YOURSELF: the creator does not configure feel/look/CTA — YOU determine all three (inferred_vibe) from what you can see: the crawled copy's tone and vocabulary → feel; their existing imagery, palette, and niche norms → look; the business type's natural money action → primary_cta. If the creator DID provide manual vibe selections (in the user message), align inferred_vibe with them instead of contradicting them.
STEP — CONVERSION STRATEGY: think like a direct-response strategist about THIS business before any design happens:
  1. The ONE primary action that makes this business money (call, book, quote, order, visit) and the strongest secondary action.
  2. The top 3 objections THIS specific customer has before acting — and which REAL extracted fact answers each (a review, years in business, a credential, a guarantee, pricing). Never manufacture an answer.
  3. A proof map: every piece of real proof (each review, credential, stat) assigned to the exact section where it converts hardest — proof belongs NEXT TO the CTA it supports, not quarantined in its own section.
  4. The honest offer/hook: from the real facts, why act now (same-day service, free consult, seasonal relevance). If no urgency exists, use clarity of value instead — never fake scarcity.
  5. The persuasion flow: order the sections as attention → problem/desire → proof → offer → action, and say in one line what job each section does. Shape the flow to the MODE you chose: a funnel page runs one tight linear path; a website mode breathes with informational sections; hybrid blends them.
  6. Apply proven direct-response and funnel principles BY JUDGMENT, never as a checklist: sharp positioning, a value proposition stated in the visitor's language, offer presented with its value obvious, objections answered where they arise, proof adjacent to asks, one unmistakable primary action, messaging a stranger understands in seconds. Trust and credibility sections (reviews, credentials, guarantees, badges, legitimacy signals) appear when THIS business/niche genuinely needs them to convert — a licensed contractor lives on credentials, a beloved chowder counter on reviews — and are omitted where they'd be filler.
STEP — IMAGE PLAN: plan the photographic images for the new site — typically 5 to 8, but this is a DEFAULT, not a ceiling: go up to 12 when more images genuinely make THIS site better (a portfolio-heavy contractor, a menu-rich restaurant, a gallery-driven venue), and stay lean when fewer serve the design — never pad to hit a number. The hero is mandatory; spend the rest on whichever sections most need visual weight so nothing reads as a bare color block. Distribute images across AT LEAST 5 different sections — never pile 3+ into one gallery/collage while leaving trust, services, reviews, or contact with zero imagery. For each image, write a complete, standalone image-generation prompt that specifies FOUR things: the SUBJECT (what is in the image and what is happening), what STAYS THE SAME (the business's real mood, setting, industry authenticity), what CHANGES (crisp, modern, professional, well-lit, photorealistic), and the THEME LOCK — reference this site's real or chosen palette (see EXISTING PALETTE below, or the palette you commit to) and its 3-second feeling, so every image — real or generated — is graded and lit like it belongs to the same shoot. Each prompt must be detailed enough to hand to any image generator on its own. No text, logos, or watermarks in any image. NEVER put a real person's name in a "generate" prompt (image APIs refuse to depict named individuals and the slot fails every retry) — describe people by role only: "the owner", "a technician", "the two-person team". For "enhance" prompts on real photos, refer to "the same person/people", never by name.

${INDUSTRY_PATTERNS}

Return ONLY valid JSON (no markdown, no prose) in exactly this shape:
{
  "business_name": "string",
  "industry": "string",
  "niche": "string",
  "primary_service": "string",
  "target_customer": "string",
  "tone": "string",
  "design_direction": "one committed creative direction for the highest-end version of a site in THIS industry",
  "page_mode": "funnel | website | hybrid — the structure that converts best for THIS business",
  "target_feeling": "the single feeling a visitor should have within 3 seconds",
  "inferred_vibe": {
    "feel": "the feel this brand should give off, inferred from the crawled copy's tone + niche norms (e.g. 'Luxurious & refined', 'Warm & welcoming', 'Bold & high-energy', 'Minimal & modern', 'Classic & trusted', 'Editorial & artistic')",
    "look": "the visual treatment inferred from their existing imagery + industry (e.g. 'Dramatic full-screen imagery', 'Airy whitespace', 'Dark & moody', 'Clean structured grid', 'Rich & layered', 'Bold color-blocked sections')",
    "primary_cta": "the single action this business type most needs visitors to take (a gym: 'Join now'; a law firm: 'Book a consultation'; a boutique: 'Browse the collection')"
  },
  "brand_read": {
    "colors": [{ "hex": "#hex", "role": "primary | secondary | accent | neutral", "prominence": "0-1, how much of the mark it occupies" }],
    "typography": { "classification": "geometric sans | humanist sans | transitional serif | didone | slab | script | hand-drawn | display", "weight": "string", "case": "uppercase | title | lowercase | mixed" },
    "visual_language": { "era": "string", "ornamentation": "none | minimal | moderate | rich", "geometry": "rounded | sharp | organic | mixed" },
    "personality": ["2-4 adjectives the MARK itself communicates"],
    "motifs": ["any repeated shape/symbol in the mark, or empty"],
    "confidence": "0-1 — 0 when no logo image was attached"
  },
  "color_palette": ["#hex", "#hex — built from brand_read.colors; see THE PALETTE RULE"],
  "sections": ["ordered section keys, e.g. hero, services, about, reviews, hours, contact"],
  "layout": {
    "section_order": ["same ordered section keys, arrest -> build desire -> convert"],
    "notes": "short note on structure/atmosphere appropriate to the industry"
  },
  "facts": {
    "phone": "string or null",
    "emails": ["every email found"],
    "address": "string or null",
    "hours": "string or null",
    "socials": ["every social/profile/delivery-platform link found"],
    "credibility": ["every credibility element found: delivery platforms (Uber Eats, DoorDash, Grubhub), review platforms (Google Reviews, Yelp, TripAdvisor), certifications, licenses, association memberships (BBB, ADA, chamber of commerce), awards, payment/security badges — name each exactly as found"],
    "services": ["every service or menu item found, with price if shown"],
    "reviews": ["every real quote found, with attribution if shown"]
  },
  "conversion_strategy": {
    "primary_action": "the one money action, stated as the CTA label to use (e.g. 'Book Your Consultation')",
    "secondary_action": "fallback action label",
    "objections": [
      { "objection": "what stops this customer", "answered_by": "the REAL extracted fact that answers it", "where": "section key where this pairing lives" }
    ],
    "proof_map": [
      { "proof": "the real review/credential/stat", "placement": "section key + why it converts there" }
    ],
    "offer": "the honest reason to act now, built only from real facts",
    "persuasion_flow": [
      { "section": "section key", "job": "one line — what this section does to move the visitor toward the action" }
    ]
  },
  "brand": {
    "primary_colors": ["#hex"],
    "secondary_colors": ["#hex"],
    "accent_colors": ["#hex"],
    "typography": "what the brand's type feels like + any detected font families",
    "button_style": "shape/weight/treatment of CTAs on the existing site",
    "border_radius": "sharp | soft | pill — the site's corner language",
    "spacing": "tight | balanced | airy",
    "icon_style": "line | filled | none detected",
    "imagery_style": "how the brand uses photos/graphics",
    "visual_hierarchy": "how the existing site directs attention",
    "design_language": "one line naming the overall design language",
    "brand_personality": "3-5 adjectives",
    "ui_patterns": ["recurring UI patterns worth keeping"],
    "recurring_motifs": ["visual motifs that repeat across the site"]
  },
  "image_inventory": [
    {
      "slot": 0,
      "what": "short label e.g. Hero — deck at sunset",
      "section": "hero | services | about | gallery | menu | contact | ...",
      "source": "none",
      "action": "generate",
      "url": null,
      "reuse_url": null,
      "prompt": "Subject: ... Keep the same: ... Change: ..."
    }
  ]
}

Rules:
- image_inventory contains at least 5 photographic items and typically 5-8; go up to 12 when more genuinely improves this specific site, never padding to reach a count — choose the count from how many sections genuinely benefit from a real image, and spread them across at least 5 different sections rather than clustering most into one gallery — plus ONE optional logo item FIRST (section "header", action "keep", with the logo URL) only if a logo URL was provided.
- REUSABLE ASSET LIBRARY: when an "AVAILABLE LIBRARY IMAGES" list is provided in the input, you may set action:"reuse" with reuse_url:"<that image's url>" for a slot where a listed image GENUINELY fits this business's subject, niche, and mood — judged per-slot, never to save effort. Fresh "generate"/"enhance" remains the default; real photos of THIS business always beat library reuse; if nothing truly fits, generate. A reused image must never look like another business's identity (no other brand's storefronts, staff, or products presented as this business's own — generic subject matter only: textures, ingredients, ambiance, generic scenes). Still write a full prompt for reuse slots (used as fallback if the library image is unavailable).
- REUSE REAL PHOTOS AGGRESSIVELY — AND ALWAYS ENHANCE + THEME THEM: when an image URL or its alt text clearly indicates a real photograph of the business (team, owner, storefront, interior, work examples, food, community events — e.g. uploads paths, descriptive alts), assign it to the matching slot with source:"real", action:"enhance" — NEVER "keep" for photographic slots; every real photo gets a professional retouch pass AND a color-grade toward this site's palette/mood so it never looks like a bare stock photo dropped onto a themed page. If the real photo is especially plain, poorly lit, or generic (a flat product shot, a dim phone photo, a cluttered background), push the prompt further — restyle its lighting and color grade decisively toward the theme rather than a light touch-up, keeping only the real subject and setting. The prompt must stay authentic (same people, place, composition) while directing: people → cinematic professional lighting; buildings → straightened, aligned verticals, clean; backgrounds → subtly evened out. Real photos of the actual business ALWAYS beat generated stand-ins. GENERATE IS A LAST RESORT, checked slot-by-slot: before assigning action:"generate" to ANY slot, re-scan the ENTIRE "IMAGES FOUND ON SITE" list (judge each by its URL path and alt text) for a real photograph that plausibly serves that slot — if one plausibly fits, assign it with action:"enhance" instead; the retouch-and-theme pass closes most quality gaps, and a real-but-imperfect photo keeps the mockup honest to the business in a way a synthetic image can't. Only generate when nothing real fits the slot's subject at all, and begin that slot's prompt with a one-line reason no site image fit. Generated images must match the same palette/mood so they're indistinguishable in tone from the enhanced real photos.
- Never invent the business name, hours, phone, address, or reviews — only use what appears in the crawled content.
- Keep the provided palette if present; otherwise infer a tasteful 2-4 color palette.
- BRAND CONTINUITY: if the existing website has an established palette and design language, the new site must feel like an ELEVATED version of the same brand — never a different brand. Extract the brand block as completely as the content allows.
- JSON SAFETY — this breaks the ENTIRE response if missed: reviews and credibility text often contain the reviewer's own quoted word or aside (e.g. they wrote something like their annual "checkup" or a "nickname"). Every double-quote character that appears INSIDE a string value MUST be escaped as \\" or rewritten with a single quote (') — a single unescaped inner quote makes the whole JSON unparsable. Scan every review and quoted phrase for this before finishing.`

export async function POST(request) {
  try {
    // logoImage: the uploaded logo's own bytes when the client has them (a
    // data URI) — preferred over scrapedData.logo, which is often an SVG or a
    // hotlink. logoPalette: canvas-sampled brand colors, kept SEPARATE from
    // scrapedData.palette (which is regex-scraped site hexes, framework CSS
    // noise included, and must never be mistaken for brand truth).
    const { scrapedData, vibe, logoImage, logoPalette } = await request.json()
    if (!scrapedData) {
      return Response.json({ error: 'Missing scraped data to analyze.' }, { status: 400 })
    }

    let logoVision = null
    try {
      logoVision = await loadLogoImage(logoImage || scrapedData.logo)
    } catch (e) {
      console.error('logo vision load failed (non-fatal):', e.message)
    }

    // Cross-project asset library: surface previously generated images whose
    // tags match this site's scraped signals, so the model can choose reuse
    // per-slot (action:"reuse") instead of regenerating from scratch. Fully
    // best-effort — an empty/missing library changes nothing.
    let libraryBlock = ''
    try {
      const candidates = await findAssetCandidates(
        `${scrapedData.title || ''} ${scrapedData.description || ''} ${(scrapedData.content || '').slice(0, 4000)}`,
        12,
      )
      if (candidates.length) {
        libraryBlock = `\nAVAILABLE LIBRARY IMAGES (previously generated for other projects — reuse ONLY where one genuinely fits this business; see the REUSABLE ASSET LIBRARY rule):\n${candidates.map((c, i) => `${i + 1}. ${c.url} — ${c.subject || 'image'}${c.niche ? ` (${c.niche})` : ''}${Array.isArray(c.tags) && c.tags.length ? ` [${c.tags.slice(0, 6).join(', ')}]` : ''}`).join('\n')}\n`
      }
    } catch (_) { /* library is optional */ }

    const user = `Analyze this crawled website (${scrapedData.pagesCrawled || 1} page(s)) and return the JSON analysis.
${logoVision ? '\nTHE FIRST ATTACHED IMAGE IS THIS BUSINESS\'S ACTUAL LOGO — read it per the READ THE LOGO step and build color_palette from the colors that are really in it.\n' : '\n(No logo image could be attached — set brand_read.confidence to 0 and infer the palette from the crawled content instead.)\n'}${Array.isArray(logoPalette) && logoPalette.length ? `MEASURED LOGO COLORS (sampled from the mark's own pixels, most dominant first — these are brand truth, unlike the scraped site palette below): ${logoPalette.join(', ')}\n` : ''}
${vibe ? `\nCREATOR'S VIBE SELECTIONS (multiple-choice answers from the person commissioning this site — fold these directly into design_direction, target_feeling, and tone; they outrank your own instincts): ${vibe}\n` : ''}
TITLE: ${scrapedData.title || '(none)'}
DESCRIPTION: ${scrapedData.description || '(none)'}
DOMAIN: ${scrapedData.domain || '(none)'}
EXISTING PALETTE: ${(scrapedData.palette || []).join(', ') || '(none — infer one)'}
LOGO URL: ${scrapedData.logo || '(none)'}

IMAGES FOUND ON SITE (${(scrapedData.images || []).length}) — url plus alt text when the site provided one; scan this whole list before ever choosing action:"generate":
${(scrapedData.images || []).slice(0, 40).map((im, i) => typeof im === 'string' ? `${i + 1}. ${im}` : `${i + 1}. ${im.url}${im.alt ? ` — alt: "${im.alt}"` : ''}`).join('\n') || '(none)'}
${libraryBlock}

FULL CRAWLED CONTENT:
${(scrapedData.content || '').slice(0, 36000)}`

    const raw = await callClaude({ system: SYSTEM, user, images: logoVision ? [logoVision] : [], maxTokens: 16000 })
    let analysis = parseJson(raw)

    // Self-repair: this JSON is the densest in the pipeline (facts + full
    // conversion strategy + brand block + 5 image prompts) — a truncated or
    // malformed response gets one automatic fix pass before we give up.
    if (!analysis || !analysis.business_name) {
      console.error('analyze: initial parse failed, attempting repair. Raw tail:', stripFences(raw).slice(-400))
      try {
        const repaired = await callClaude({ system: REPAIR_SYSTEM, user: stripFences(raw), maxTokens: 16000 })
        analysis = parseJson(repaired)
      } catch (repairErr) {
        console.error('analyze: repair attempt failed:', repairErr.message)
      }
    }

    if (!analysis || !analysis.business_name) {
      console.error('analyze: unrecoverable. Raw response length:', raw?.length || 0, 'tail:', stripFences(raw).slice(-400))
      return Response.json({ error: 'Could not analyze the website content — the response was malformed even after a retry. Try again, or try a different site.' }, { status: 502 })
    }

    // Normalize for the rest of the pipeline.
    if (!Array.isArray(analysis.sections) || !analysis.sections.length) {
      analysis.sections = analysis.layout?.section_order || ['hero', 'about', 'services', 'contact']
    }
    if (!analysis.layout) analysis.layout = { section_order: analysis.sections, notes: '' }
    if (!Array.isArray(analysis.layout.section_order) || !analysis.layout.section_order.length) {
      analysis.layout.section_order = analysis.sections
    }
    if (!Array.isArray(analysis.image_inventory)) analysis.image_inventory = []

    // Guarantee the logo is first when we have one.
    if (scrapedData.logo) {
      const hasLogo = analysis.image_inventory.some(
        im => im.url === scrapedData.logo || /logo/i.test(im.what || '') || im.section === 'header',
      )
      if (!hasLogo) {
        analysis.image_inventory.unshift({
          slot: -1, what: 'Logo', section: 'header', source: 'real', action: 'keep', url: scrapedData.logo, prompt: '',
        })
      }
    }
    // Cap photographic items at 12 (defensive runaway guard, NOT a design
    // ceiling — the prompt's default range is 5-8, extended by judgment) and
    // renumber slots.
    const logoItems = analysis.image_inventory.filter(im => /logo/i.test(im.what || '') || im.section === 'header')
    const photoItems = analysis.image_inventory.filter(im => !logoItems.includes(im)).slice(0, 12)
    analysis.image_inventory = [...logoItems.slice(0, 1), ...photoItems].map((im, i) => ({ ...im, slot: i }))
    if (!['funnel', 'website', 'hybrid'].includes(analysis.page_mode)) analysis.page_mode = 'hybrid'

    if (!analysis.color_palette || !analysis.color_palette.length) {
      analysis.color_palette = scrapedData.palette || ['#2990fa', '#0a1628']
    }

    // BRAND ANCHOR — deterministic, and deliberately NOT another instruction.
    // The prompt above already asks for a logo-derived palette, but that
    // competes with "commit to ONE highest-end direction", and when the
    // category prior wins, the invented hue gets THEME LOCKed downstream and
    // even the generated photography is graded to it. So the palette is
    // checked in code against the mark's real colors — vision-reported hexes
    // first (it actually looked at the logo), canvas samples as backup —
    // and only the LEAD color is corrected, minimally, with a record of why.
    let paletteChanges = []
    try {
      const brandColors = [
        ...(analysis.brand_read?.colors || [])
          .filter(c => c && c.hex)
          .map(c => ({ hex: c.hex, prominence: Number(c.prominence) || null })),
        ...(Array.isArray(logoPalette) ? logoPalette : []).map(hex => ({ hex, prominence: null })),
      ]
      if (brandColors.length) {
        const rec = reconcilePalette(analysis.color_palette, brandColors)
        analysis.color_palette = rec.palette
        paletteChanges = rec.changes
        if (rec.changes.some(c => !c.flagged)) {
          console.log('analyze: palette re-anchored to the logo —', JSON.stringify(rec.changes))
        }
      }
    } catch (e) {
      console.error('palette reconciliation failed (non-fatal):', e.message)
    }

    analysis._source = { url: scrapedData.url, domain: scrapedData.domain, logo: scrapedData.logo }

    // paletteChanges/logoSeen are attestation, same spirit as contrastFixes:
    // prove what the pipeline did to the brand instead of hiding it.
    return Response.json({ analysis, paletteChanges, logoSeen: !!logoVision })
  } catch (err) {
    console.error('analyze error:', err)
    return Response.json({ error: `Analysis failed: ${err.message}` }, { status: 500 })
  }
}
