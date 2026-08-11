// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

// Logo refinement: STRICT PRESERVE — an image-to-image upscale/cleanup of the
// exact source logo, never a recreation. Accepts either:
//   { b64 }  — a user-uploaded image (client rasterizes to PNG base64), or
//   { url }  — the logo/icon URL auto-detected from the crawled website;
//              the server fetches it and refines it automatically.
// Output contract: the SAME logo — identical elements in identical relative
// positions, nothing moved/re-typeset/omitted — cleaned, sharpened, on a fully
// transparent background, at the image API's maximum output resolution
// (gpt-image-1 tops out at 1536px on the long edge; true 4K would need an
// external upscaler and is deliberately not faked here).
//
// The source's dimensions are probed BEFORE refinement to classify its shape:
//   square   (w/h 0.8–1.25) — icon/mark; keep 1:1 canvas, never stretched.
//   wide     (w/h ≥ 2)      — horizontal wordmark/lockup; refined on a wide
//                             canvas and reported so the builder sizes headers
//                             by ratio instead of cramming it into a square slot.
//   landscape/tall           — intermediate shapes, reported as measured.
// { shape, ratio, width, height } is returned alongside the refined image and
// travels with the project so header sizing stays correct on reload.

const EDITABLE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

// Minimal image-dimension probe (PNG/JPEG/GIF/WebP) — no image libs in this
// project, and only the header bytes are needed.
function probeImageSize(buf) {
  try {
    if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
    }
    if (buf.length > 10 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
      return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) }
    }
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) { i++; continue }
        const marker = buf[i + 1]
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
        }
        i += 2 + buf.readUInt16BE(i + 2)
      }
    }
    if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      const fmt = buf.toString('ascii', 12, 16)
      if (fmt === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) }
      if (fmt === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
      if (fmt === 'VP8L') {
        const b = buf.readUInt32LE(21)
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }
      }
    }
  } catch (_) { /* fall through */ }
  return null
}

function classifyShape(width, height) {
  if (!width || !height) return { shape: 'unknown', ratio: null }
  const ratio = +(width / height).toFixed(2)
  if (ratio >= 2) return { shape: 'wide', ratio }
  if (ratio >= 0.8 && ratio <= 1.25) return { shape: 'square', ratio }
  if (ratio > 1.25) return { shape: 'landscape', ratio }
  return { shape: 'tall', ratio }
}

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

    // Probe the SOURCE geometry before any AI touches it — this drives the
    // canvas choice here and the header-sizing rules in the builder.
    const dims = probeImageSize(srcBuf)
    const geometry = classifyShape(dims?.width, dims?.height)
    const logoMeta = { ...geometry, width: dims?.width || null, height: dims?.height || null }
    // Wide wordmarks get the API's wide canvas so they aren't letterboxed into
    // a square; everything else keeps 1:1. Never stretch either way.
    const size = geometry.shape === 'wide' || geometry.shape === 'landscape' ? '1536x1024' : '1024x1024'

    const prompt = `Refine this exact logo image. This is an image-to-image UPSCALE AND CLEANUP of the source — the same operation as professionally upscaling a photo — NOT a redesign, NOT a recreation, NOT an interpretation.
ABSOLUTE PRESERVATION CONTRACT — the output is the SAME IMAGE, only cleaner:
- Every element stays exactly where it is in the source: identical layout, identical relative positions and sizes, identical letterforms and spelling, identical colors, gradients, textures, and style.
- Do NOT move, resize, rearrange, re-typeset, restyle, redraw, add, or remove ANY element. Keep every word, tagline, and mark exactly as it appears — omit nothing.
- Where any detail is uncertain, reproduce the source as-is rather than reinterpreting it.
The ONLY changes allowed: sharpen edges, remove compression artifacts and noise, and cleanly separate the logo from its background so the background is fully TRANSPARENT.
CANVAS: keep the logo's own proportions exactly — never stretch, squeeze, or crop it to a different shape. Center it on the transparent canvas with a small even margin.
${instructions && instructions.trim() ? `USER REFINEMENT REQUESTS (apply these, still within the preservation contract): ${instructions.trim()}` : ''}
Output: the identical logo, clean and sharp, on full transparency.`

    let res
    try {
      res = await openai.images.edit({
        model: 'gpt-image-1',
        image: file,
        prompt,
        n: 1,
        size,
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
        size,
      })
    }

    let out = res.data?.[0]?.b64_json
    if (!out) {
      // One clean retry with a fresh file handle before giving up.
      try {
        const res2 = await openai.images.edit({ model: 'gpt-image-1', image: await mkFile(), prompt, n: 1, size, quality: 'high', background: 'transparent' })
        out = res2.data?.[0]?.b64_json
      } catch (_) {}
    }
    if (!out) {
      return Response.json({ b64: null, src: url || null, refined: false, logoMeta })
    }
    return Response.json({ b64: out, refined: true, logoMeta })
  } catch (err) {
    console.error('refine-logo error:', err)
    // Never block the pipeline on logo refinement — fall back to the raw source.
    return Response.json({ b64: null, src: url, refined: false })
  }
}
