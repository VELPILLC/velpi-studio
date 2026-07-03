// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

// Logo refinement: NEVER redesign — produce the highest-quality version of the
// exact same mark. Accepts either:
//   { b64 }  — a user-uploaded image (client rasterizes to PNG base64), or
//   { url }  — the logo/icon URL auto-detected from the crawled website;
//              the server fetches it and refines it automatically.
// Output contract: the ICON MARK ALONE (no surrounding wordmark text), on a
// transparent background, 1:1 square, filling the frame edge-to-edge, premium
// 4K-clean quality — visually identical branding, just flawless.

const EDITABLE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

export async function POST(request) {
  let url = null
  try {
    const body = await request.json()
    const { b64, instructions } = body
    url = body.url || null
    if (!b64 && !url) {
      return Response.json({ error: 'Missing logo image or logo URL to refine.' }, { status: 400 })
    }
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ b64: null, src: url || null, refined: false })
    }

    const mod = await import('openai')
    const openai = new mod.default({ apiKey: process.env.OPENAI_API_KEY })

    // Resolve the source image into an editable file.
    let file = null
    if (b64) {
      file = await mod.toFile(Buffer.from(b64, 'base64'), 'logo.png', { type: 'image/png' })
    } else {
      let fetched
      try {
        fetched = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (VelpiStudio logo fetch)' } })
      } catch (e) {
        return Response.json({ b64: null, src: url, refined: false })
      }
      if (!fetched.ok) return Response.json({ b64: null, src: url, refined: false })
      const type = (fetched.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
      const buf = Buffer.from(await fetched.arrayBuffer())
      if (!buf.length) return Response.json({ b64: null, src: url, refined: false })
      // SVG / ICO can't go through the image-edit endpoint — use the original as-is.
      if (!EDITABLE_TYPES.includes(type) && !/\.(png|jpe?g|webp)(\?|$)/i.test(url)) {
        return Response.json({ b64: null, src: url, refined: false })
      }
      const ext = type.includes('webp') ? 'webp' : type.includes('jpe') ? 'jpg' : 'png'
      file = await mod.toFile(buf, `logo.${ext}`, { type: EDITABLE_TYPES.includes(type) ? type : 'image/png' })
    }

    const prompt = `Recreate this exact brand logo as a flawless, production-ready icon asset.
CRITICAL — this is a refinement, NOT a redesign. Preserve with total fidelity:
- the exact mark: identical shapes, letterforms inside the icon, colors, and proportions
- the complete visual identity — it must read as the SAME logo, just perfect
ISOLATE THE ICON: if the source contains a wordmark or company-name text AROUND or BESIDE the icon, output ONLY the icon mark itself — no surrounding text. (Text that is an integral part of the mark itself, like a monogram letter, stays.)
COMPOSITION: 1:1 square canvas. The mark fills the frame edge-to-edge as large as possible with only a minimal safe margin, perfectly centered. Fully TRANSPARENT background.
QUALITY: premium 4K-grade cleanliness — razor-sharp edges, no compression artifacts, no noise, no shadows, no background remnants, colors pure and flat where they should be flat.
${instructions && instructions.trim() ? `USER REFINEMENT REQUESTS (apply these, still without redesigning): ${instructions.trim()}` : ''}
Output: the same icon, pristine, huge in frame, on transparency.`

    let res
    try {
      res = await openai.images.edit({
        model: 'gpt-image-1',
        image: file,
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
        background: 'transparent',
      })
    } catch (e) {
      // Some parameter combos can be rejected — retry with the minimal set.
      res = await openai.images.edit({
        model: 'gpt-image-1',
        image: file,
        prompt,
        n: 1,
        size: '1024x1024',
      })
    }

    const out = res.data?.[0]?.b64_json
    if (!out) {
      return Response.json({ b64: null, src: url || null, refined: false })
    }
    return Response.json({ b64: out, refined: true })
  } catch (err) {
    console.error('refine-logo error:', err)
    // Never block the pipeline on logo refinement — fall back to the raw source.
    return Response.json({ b64: null, src: url, refined: false })
  }
}
