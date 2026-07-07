// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { callClaude, parseJson, stripFences } from '../../../lib/claude'

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
STEP — DIRECTION: commit to ONE highest-end creative direction appropriate to THIS industry (never a generic template) and name the single feeling a visitor should have within 3 seconds.
STEP — INFER THE VIBE YOURSELF: the creator does not configure feel/look/CTA — YOU determine all three (inferred_vibe) from what you can see: the crawled copy's tone and vocabulary → feel; their existing imagery, palette, and niche norms → look; the business type's natural money action → primary_cta. If the creator DID provide manual vibe selections (in the user message), align inferred_vibe with them instead of contradicting them.
STEP — CONVERSION STRATEGY: think like a direct-response strategist about THIS business before any design happens:
  1. The ONE primary action that makes this business money (call, book, quote, order, visit) and the strongest secondary action.
  2. The top 3 objections THIS specific customer has before acting — and which REAL extracted fact answers each (a review, years in business, a credential, a guarantee, pricing). Never manufacture an answer.
  3. A proof map: every piece of real proof (each review, credential, stat) assigned to the exact section where it converts hardest — proof belongs NEXT TO the CTA it supports, not quarantined in its own section.
  4. The honest offer/hook: from the real facts, why act now (same-day service, free consult, seasonal relevance). If no urgency exists, use clarity of value instead — never fake scarcity.
  5. The persuasion flow: order the sections as attention → problem/desire → proof → offer → action, and say in one line what job each section does.
STEP — IMAGE PLAN: plan between 5 and 8 photographic images for the new site — the hero is mandatory; spend the rest on whichever sections most need visual weight so nothing reads as a bare color block. Distribute images across AT LEAST 5 different sections — never pile 3+ into one gallery/collage while leaving trust, services, reviews, or contact with zero imagery. For each image, write a complete, standalone image-generation prompt that specifies FOUR things: the SUBJECT (what is in the image and what is happening), what STAYS THE SAME (the business's real mood, setting, industry authenticity), what CHANGES (crisp, modern, professional, well-lit, photorealistic), and the THEME LOCK — reference this site's real or chosen palette (see EXISTING PALETTE below, or the palette you commit to) and its 3-second feeling, so every image — real or generated — is graded and lit like it belongs to the same shoot. Each prompt must be detailed enough to hand to any image generator on its own. No text, logos, or watermarks in any image. NEVER put a real person's name in a "generate" prompt (image APIs refuse to depict named individuals and the slot fails every retry) — describe people by role only: "the owner", "a technician", "the two-person team". For "enhance" prompts on real photos, refer to "the same person/people", never by name.

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
  "target_feeling": "the single feeling a visitor should have within 3 seconds",
  "inferred_vibe": {
    "feel": "the feel this brand should give off, inferred from the crawled copy's tone + niche norms (e.g. 'Luxurious & refined', 'Warm & welcoming', 'Bold & high-energy', 'Minimal & modern', 'Classic & trusted', 'Editorial & artistic')",
    "look": "the visual treatment inferred from their existing imagery + industry (e.g. 'Dramatic full-screen imagery', 'Airy whitespace', 'Dark & moody', 'Clean structured grid', 'Rich & layered', 'Bold color-blocked sections')",
    "primary_cta": "the single action this business type most needs visitors to take (a gym: 'Join now'; a law firm: 'Book a consultation'; a boutique: 'Browse the collection')"
  },
  "color_palette": ["#hex", "#hex"],
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
      "prompt": "Subject: ... Keep the same: ... Change: ..."
    }
  ]
}

Rules:
- image_inventory must contain between 5 and 8 photographic items (never fewer than 5, never more than 8) — choose the count based on how many sections genuinely benefit from a real image, and spread them across at least 5 different sections rather than clustering most into one gallery — plus ONE optional logo item FIRST (section "header", action "keep", with the logo URL) only if a logo URL was provided.
- REUSE REAL PHOTOS AGGRESSIVELY — AND ALWAYS ENHANCE + THEME THEM: when an image URL or its alt text clearly indicates a real photograph of the business (team, owner, storefront, interior, work examples, food, community events — e.g. uploads paths, descriptive alts), assign it to the matching slot with source:"real", action:"enhance" — NEVER "keep" for photographic slots; every real photo gets a professional retouch pass AND a color-grade toward this site's palette/mood so it never looks like a bare stock photo dropped onto a themed page. If the real photo is especially plain, poorly lit, or generic (a flat product shot, a dim phone photo, a cluttered background), push the prompt further — restyle its lighting and color grade decisively toward the theme rather than a light touch-up, keeping only the real subject and setting. The prompt must stay authentic (same people, place, composition) while directing: people → cinematic professional lighting; buildings → straightened, aligned verticals, clean; backgrounds → subtly evened out. Real photos of the actual business ALWAYS beat generated stand-ins. Use source:"none", action:"generate" only when no plausible real photo fits the slot — generated images must match the same palette/mood so they're indistinguishable in tone from the enhanced real photos.
- Never invent the business name, hours, phone, address, or reviews — only use what appears in the crawled content.
- Keep the provided palette if present; otherwise infer a tasteful 2-4 color palette.
- BRAND CONTINUITY: if the existing website has an established palette and design language, the new site must feel like an ELEVATED version of the same brand — never a different brand. Extract the brand block as completely as the content allows.
- JSON SAFETY — this breaks the ENTIRE response if missed: reviews and credibility text often contain the reviewer's own quoted word or aside (e.g. they wrote something like their annual "checkup" or a "nickname"). Every double-quote character that appears INSIDE a string value MUST be escaped as \\" or rewritten with a single quote (') — a single unescaped inner quote makes the whole JSON unparsable. Scan every review and quoted phrase for this before finishing.`

export async function POST(request) {
  try {
    const { scrapedData, vibe } = await request.json()
    if (!scrapedData) {
      return Response.json({ error: 'Missing scraped data to analyze.' }, { status: 400 })
    }

    const user = `Analyze this crawled website (${scrapedData.pagesCrawled || 1} page(s)) and return the JSON analysis.
${vibe ? `\nCREATOR'S VIBE SELECTIONS (multiple-choice answers from the person commissioning this site — fold these directly into design_direction, target_feeling, and tone; they outrank your own instincts): ${vibe}\n` : ''}
TITLE: ${scrapedData.title || '(none)'}
DESCRIPTION: ${scrapedData.description || '(none)'}
DOMAIN: ${scrapedData.domain || '(none)'}
EXISTING PALETTE: ${(scrapedData.palette || []).join(', ') || '(none — infer one)'}
LOGO URL: ${scrapedData.logo || '(none)'}

IMAGES FOUND ON SITE (${(scrapedData.images || []).length}) — url plus alt text when the site provided one:
${(scrapedData.images || []).slice(0, 30).map((im, i) => typeof im === 'string' ? `${i + 1}. ${im}` : `${i + 1}. ${im.url}${im.alt ? ` — alt: "${im.alt}"` : ''}`).join('\n') || '(none)'}

FULL CRAWLED CONTENT:
${(scrapedData.content || '').slice(0, 36000)}`

    const raw = await callClaude({ system: SYSTEM, user, maxTokens: 16000 })
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
    // Cap photographic items at 8 (defensive) and renumber slots.
    const logoItems = analysis.image_inventory.filter(im => /logo/i.test(im.what || '') || im.section === 'header')
    const photoItems = analysis.image_inventory.filter(im => !logoItems.includes(im)).slice(0, 8)
    analysis.image_inventory = [...logoItems.slice(0, 1), ...photoItems].map((im, i) => ({ ...im, slot: i }))

    if (!analysis.color_palette || !analysis.color_palette.length) {
      analysis.color_palette = scrapedData.palette || ['#2990fa', '#0a1628']
    }
    analysis._source = { url: scrapedData.url, domain: scrapedData.domain, logo: scrapedData.logo }

    return Response.json({ analysis })
  } catch (err) {
    console.error('analyze error:', err)
    return Response.json({ error: `Analysis failed: ${err.message}` }, { status: 500 })
  }
}
