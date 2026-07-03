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

    // Resolve the source image into an editable file. Keep the raw bytes so a
    // retry can rebuild a fresh file handle.
    let srcBuf = null
    let srcType = 'image/png'
    let srcName = 'logo.png'
    if (b64) {
      srcBuf = Buffer.from(b64, 'base64')
    } else {
      let fetched
      try {
        const origin = (() => { try { return new URL(url).origin } catch (_) { return undefined } })()
        fetched = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
            Accept: 'image/*,*/*;q=0.8',
            ...(origin ? { Referer: origin } : {}),
          },
        })
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
      srcBuf = buf
      srcType = EDITABLE_TYPES.includes(type) ? type : 'image/png'
      srcName = `logo.${type.includes('webp') ? 'webp' : type.includes('jpe') ? 'jpg' : 'png'}`
    }
    const mkFile = () => mod.toFile(srcBuf, srcName, { type: srcType })
    const file = await mkFile()

    const prompt = `Recreate this exact brand logo as a flawless, production-ready brand asset.
CRITICAL — this is a refinement, NOT a redesign. Preserve with total fidelity:
- the COMPLETE logo lockup exactly as it appears in the source: the icon/mark AND any lettermark or initials that belong to it (e.g. a monogram or short letters beside the mark). Identical shapes, letterforms, colors, gradients, and proportions.
- it must read as the SAME logo, just perfect.
Only omit long taglines or full sentences that are clearly separate from the logo itself.
COMPOSITION — THIS MATTERS: 1:1 square canvas. Scale the logo UP so it fills the frame to the absolute maximum — at least 92% of the canvas width or height — perfectly centered, with only a sliver of safe margin. Never output a small logo floating in empty space. Fully TRANSPARENT background.
QUALITY: premium 4K-grade cleanliness — razor-sharp edges, no compression artifacts, no noise, no drop shadows unless they are part of the mark, no background remnants; metallic/gradient finishes preserved faithfully.
${instructions && instructions.trim() ? `USER REFINEMENT REQUESTS (apply these, still without redesigning): ${instructions.trim()}` : ''}
Output: the same complete logo, pristine, HUGE in frame, on transparency.`

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

    let out = res.data?.[0]?.b64_json
    if (!out) {
      // One clean retry with a fresh file handle before giving up.
      try {
        const res2 = await openai.images.edit({ model: 'gpt-image-1', image: await mkFile(), prompt, n: 1, size: '1024x1024', quality: 'high' })
        out = res2.data?.[0]?.b64_json
      } catch (_) {}
    }
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
