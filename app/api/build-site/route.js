import { callClaude, stripFences } from '../../../lib/claude'

const VERSION_BRIEFS = {
  1: 'VERSION 1 — Clean and modern. The standard, trustworthy layout for this industry. Generous whitespace, clear hierarchy, conventional section order.',
  2: 'VERSION 2 — Bold and aggressive. Much bigger headlines, high-contrast color blocks, stronger and more urgent CTAs repeated through the page. Punchy and confident.',
  3: 'VERSION 3 — Most unique layout that still fits the niche. Unexpected but tasteful structure (e.g. split-screen hero, asymmetric grid, sticky side nav) while staying appropriate for the industry.',
}

function neutralImage(color) {
  const c = (color || '#11223a').replace('#', '%23')
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='${c}'/></svg>`
  return `data:image/svg+xml,${svg}`
}

export async function POST(request) {
  try {
    const { analysis, copy, images, version } = await request.json()
    if (!analysis || !copy) {
      return Response.json({ error: 'Missing analysis or copy to build the site.' }, { status: 400 })
    }
    const v = Number(version) || 1
    const assets = images?.assets || []
    const palette = analysis.color_palette || ['#2990fa', '#0a1628', '#ffffff']

    // Give Claude only ids + roles (never the base64) and tell it to use placeholders.
    const assetList = assets.map(a => `- id "${a.id}" (${a.kind}${a.role ? `, ${a.role}` : ''}) -> use src="%%IMG:${a.id}%%"`).join('\n') || '(no images available — use solid color blocks instead of images)'

    const system = `You build a complete, single-page marketing website as ONE valid HTML document.

OUTPUT RULES (critical):
- Return ONLY the HTML. Start with <!DOCTYPE html>. No markdown, no commentary.
- ALL CSS must be inline in a single <style> tag in the <head>. No external stylesheets.
- NO external dependencies of any kind: no <link>, no external <script>, no web-font imports, no CDN URLs. Use a system font stack only.
- No animations, no transitions, no JavaScript behavior required. Solid colors only, no gradients.
- It must render correctly inside a sandboxed iframe with no network access for code (images may be remote URLs or data URIs that are already provided).
- Use ONLY the colors from the provided palette plus white/near-black for text.
- For images, use the EXACT placeholder string for the matching asset id, e.g. <img src="%%IMG:logo%%" ...>. Do not invent image URLs. Place the logo in the header exactly as provided.
- Use only the copy provided. Do not invent facts, numbers, testimonials, or claims.
- Build every section listed. Make it look like a real, modern, professional business website.

${VERSION_BRIEFS[v] || VERSION_BRIEFS[1]}`

    const user = `Build the complete HTML site.

BUSINESS: ${analysis.business_name}
INDUSTRY: ${analysis.industry} ${analysis.niche ? `(${analysis.niche})` : ''}
TONE: ${analysis.tone || ''}
COLOR PALETTE (use these): ${palette.join(', ')}
SECTIONS (in order): ${JSON.stringify(analysis.sections || Object.keys(copy.sections || {}))}

COPY (JSON):
${JSON.stringify(copy.sections, null, 2)}

AVAILABLE IMAGE ASSETS (reference by placeholder):
${assetList}`

    const raw = await callClaude({ system, user, maxTokens: 8000 })
    let html = stripFences(raw)
    if (!/<html|<!doctype/i.test(html)) {
      return Response.json({ error: 'The site could not be built (invalid HTML returned). Try again.' }, { status: 502 })
    }

    // Swap image placeholders for the real srcs.
    const byId = {}
    assets.forEach(a => { byId[a.id] = a.src })
    html = html.replace(/%%IMG:([a-z0-9_]+)%%/gi, (_, id) => byId[id] || neutralImage(palette[0]))

    return Response.json({ html })
  } catch (err) {
    console.error('build-site error:', err)
    return Response.json({ error: `Site build failed: ${err.message}` }, { status: 500 })
  }
}
