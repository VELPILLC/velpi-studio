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

const SYSTEM = `You are a senior brand and web strategist analyzing a scraped business website.
${INDUSTRY_PATTERNS}

Return ONLY valid JSON (no markdown, no prose) in exactly this shape:
{
  "business_name": "string",
  "industry": "string (e.g. HVAC, Restaurant, Law firm)",
  "niche": "string — the specific sub-focus",
  "primary_service": "string",
  "target_customer": "string",
  "tone": "string — e.g. trustworthy, bold, premium, friendly",
  "sections": ["ordered list of section keys appropriate for this industry, e.g. hero, services, about, trust, testimonials, contact"],
  "color_palette": ["#hex", "#hex"],
  "images": [
    { "url": "string", "type": "real_photo | cartoon | stock | logo", "keep": true|false, "role": "short description e.g. hero background, team photo" }
  ]
}

Rules:
- Classify each provided image. type "real_photo" and "logo" => keep:true. type "cartoon" (illustration/clipart) or low-quality "stock" => keep:false (it should be replaced).
- If a palette was provided, keep it as color_palette. Otherwise infer a sensible 2-4 color palette from the content/industry.
- Never invent the business name — derive it from the title/content. If unknown, use a clean name from the domain.
- Choose sections that match the detected industry pattern.`

export async function POST(request) {
  try {
    const { scrapedData } = await request.json()
    if (!scrapedData) {
      return Response.json({ error: 'Missing scraped data to analyze.' }, { status: 400 })
    }

    const user = `Analyze this scraped website data and return the JSON analysis.

TITLE: ${scrapedData.title || '(none)'}
DESCRIPTION: ${scrapedData.description || '(none)'}
DOMAIN: ${scrapedData.domain || '(none)'}
EXISTING PALETTE: ${(scrapedData.palette || []).join(', ') || '(none — infer one)'}
LOGO URL: ${scrapedData.logo || '(none)'}

IMAGES FOUND (${(scrapedData.images || []).length}):
${(scrapedData.images || []).slice(0, 25).map((u, i) => `${i + 1}. ${u}`).join('\n') || '(none)'}

PAGE CONTENT:
${(scrapedData.content || '').slice(0, 9000)}`

    const raw = await callClaude({ system: SYSTEM, user, maxTokens: 2500 })
    const analysis = parseJson(raw)
    if (!analysis || !analysis.business_name) {
      return Response.json({ error: 'Could not analyze the website content. Try a different site.' }, { status: 502 })
    }

    // Make sure the logo is represented as a kept image.
    if (scrapedData.logo) {
      const hasLogo = (analysis.images || []).some(im => im.url === scrapedData.logo)
      if (!hasLogo) {
        analysis.images = [
          { url: scrapedData.logo, type: 'logo', keep: true, role: 'logo' },
          ...(analysis.images || []),
        ]
      }
    }
    if (!analysis.color_palette || !analysis.color_palette.length) {
      analysis.color_palette = scrapedData.palette || ['#2990fa', '#060d1f']
    }
    analysis._source = { url: scrapedData.url, domain: scrapedData.domain, logo: scrapedData.logo }

    return Response.json({ analysis })
  } catch (err) {
    console.error('analyze error:', err)
    return Response.json({ error: `Analysis failed: ${err.message}` }, { status: 500 })
  }
}
