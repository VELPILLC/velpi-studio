export async function POST(request) {
  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const { prompt, size = '1024x1536', referenceB64s } = await request.json()

    const VALID_SIZES = ['1024x1024', '1024x1536', '1536x1024']
    const resolvedSize = VALID_SIZES.includes(size) ? size : '1024x1536'

    let response

    if (referenceB64s && referenceB64s.length > 0) {
      // Use edit endpoint with reference image
      const { toFile } = await import('openai')
      const buffer = Buffer.from(referenceB64s[0], 'base64')
      const imageFile = await toFile(buffer, 'image.png', { type: 'image/png' })

      response = await openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        prompt,
        n: 1,
        size: resolvedSize,
      })
    } else {
      response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: resolvedSize,
        quality: 'medium',
      })
    }

    const b64 = response.data[0]?.b64_json || ''
    return Response.json({ b64 })
  } catch (err) {
    console.error('Image API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
