// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

// Logo refinement: NEVER redesign — produce the highest-quality version of the
// exact same logo. The client rasterizes all uploads (PNG/SVG/screenshot) to PNG
// base64 before sending.

export async function POST(request) {
  try {
    const { b64, instructions } = await request.json()
    if (!b64) {
      return Response.json({ error: 'Missing logo image to refine.' }, { status: 400 })
    }
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: 'OPENAI_API_KEY is not set — cannot refine the logo.' }, { status: 400 })
    }

    const mod = await import('openai')
    const openai = new mod.default({ apiKey: process.env.OPENAI_API_KEY })
    const file = await mod.toFile(Buffer.from(b64, 'base64'), 'logo.png', { type: 'image/png' })

    const prompt = `Recreate this exact logo as a flawless, production-ready brand asset.
CRITICAL — this is a refinement, NOT a redesign. Preserve with total fidelity:
- the exact branding, lettering and typography (identical letterforms and wording)
- the exact colors
- the exact proportions and layout
- the complete visual identity — it must be visually identical to the original
Improve ONLY: sharpness and edge quality, overall cleanliness, removal of compression artifacts, noise, shadows or background clutter; balanced padding around the mark; and place it on a fully TRANSPARENT background if appropriate for a logo.
${instructions && instructions.trim() ? `USER REFINEMENT REQUESTS (apply these, still without redesigning): ${instructions.trim()}` : ''}
Output: the same logo, pristine, on a transparent background.`

    let res
    try {
      res = await openai.images.edit({
        model: 'gpt-image-1',
        image: file,
        prompt,
        n: 1,
        size: '1024x1024',
        background: 'transparent',
      })
    } catch (e) {
      // Some parameter combos can be rejected — retry without the background flag.
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
      return Response.json({ error: 'Logo refinement returned no image. The original will be used.' }, { status: 502 })
    }
    return Response.json({ b64: out })
  } catch (err) {
    console.error('refine-logo error:', err)
    return Response.json({ error: `Logo refinement failed: ${err.message}` }, { status: 500 })
  }
}
