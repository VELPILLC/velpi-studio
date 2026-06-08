// Cap how many images we generate per run to keep generation fast and affordable.
const MAX_GENERATIONS = 3

export async function POST(request) {
  try {
    const { analysis } = await request.json()
    if (!analysis) {
      return Response.json({ error: 'Missing analysis for image generation.' }, { status: 400 })
    }

    const allImages = Array.isArray(analysis.images) ? analysis.images : []

    // Keep real photos + logos exactly as found.
    const kept = allImages
      .filter(im => im.keep !== false && (im.type === 'real_photo' || im.type === 'logo'))
      .map((im, i) => ({
        id: im.type === 'logo' ? 'logo' : `keep_${i}`,
        kind: im.type === 'logo' ? 'logo' : 'photo',
        src: im.url,
        role: im.role || '',
      }))

    // Images flagged for replacement.
    const toReplace = allImages
      .filter(im => im.keep === false || im.type === 'cartoon' || im.type === 'stock')
      .slice(0, MAX_GENERATIONS)

    const generated = []
    let warning = null

    if (toReplace.length && process.env.OPENAI_API_KEY) {
      const OpenAI = (await import('openai')).default
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      for (let i = 0; i < toReplace.length; i++) {
        const im = toReplace[i]
        const prompt = `Professional, high-quality photograph for a ${analysis.industry || 'business'} website. ${im.role || analysis.primary_service || 'brand imagery'}. Photorealistic, clean, modern, well-lit, no text, no logos, no watermarks.`
        try {
          const res = await openai.images.generate({
            model: 'gpt-image-1',
            prompt,
            n: 1,
            size: '1024x1024',
            quality: 'medium',
          })
          const b64 = res.data?.[0]?.b64_json
          if (b64) {
            generated.push({
              id: `gen_${i}`,
              kind: 'generated',
              src: `data:image/png;base64,${b64}`,
              role: im.role || '',
              replacesUrl: im.url || null,
            })
          }
        } catch (e) {
          console.error('image gen error:', e.message)
        }
      }
    } else if (toReplace.length && !process.env.OPENAI_API_KEY) {
      warning = 'OPENAI_API_KEY not set — kept original images instead of generating replacements.'
    }

    return Response.json({ images: { assets: [...kept, ...generated], warning } })
  } catch (err) {
    console.error('generate-images error:', err)
    return Response.json({ error: `Image generation failed: ${err.message}` }, { status: 500 })
  }
}
