// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { callClaude, parseJson } from '../../../lib/claude'

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
STEP — IMAGE PLAN: plan EXACTLY 5 photographic images for the new site — the hero plus the 4 most valuable supporting images for this industry. For each, write a complete, standalone image-generation prompt that specifies THREE things: the SUBJECT (what is in the image and what is happening), what STAYS THE SAME (the business's real mood, setting, industry authenticity), and what CHANGES (crisp, modern, professional, well-lit, photorealistic). Each prompt must be detailed enough to hand to any image generator on its own. No text, logos, or watermarks in any image.

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
    "services": ["every service or menu item found, with price if shown"],
    "reviews": ["every real quote found, with attribution if shown"]
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
- image_inventory must contain EXACTLY 5 photographic items (this is a hard requirement), plus ONE optional logo item FIRST (section "header", action "keep", with the logo URL) only if a logo URL was provided.
- REUSE REAL PHOTOS AGGRESSIVELY: when an image URL or its alt text clearly indicates a real photograph of the business (team, owner, storefront, interior, work examples, food, community events — e.g. uploads paths, descriptive alts), assign it to the matching slot with source:"real", action:"enhance" (the prompt describes the cleanup: sharpen, correct lighting, keep everything identical). Real photos of the actual business ALWAYS beat generated stand-ins for authenticity. Use source:"none", action:"generate" only when no plausible real photo fits the slot.
- Never invent the business name, hours, phone, address, or reviews — only use what appears in the crawled content.
- Keep the provided palette if present; otherwise infer a tasteful 2-4 color palette.
- BRAND CONTINUITY: if the existing website has an established palette and design language, the new site must feel like an ELEVATED version of the same brand — never a different brand. Extract the brand block as completely as the content allows.`

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
${(scrapedData.content || '').slice(0, 20000)}`

    const raw = await callClaude({ system: SYSTEM, user, maxTokens: 3500 })
    const analysis = parseJson(raw)
    if (!analysis || !analysis.business_name) {
      return Response.json({ error: 'Could not analyze the website content. Try a different site.' }, { status: 502 })
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
    // Cap photographic items at 5 (defensive) and renumber slots.
    const logoItems = analysis.image_inventory.filter(im => /logo/i.test(im.what || '') || im.section === 'header')
    const photoItems = analysis.image_inventory.filter(im => !logoItems.includes(im)).slice(0, 5)
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
