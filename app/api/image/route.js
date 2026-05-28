export async function POST(request) {
  const OpenAI = (await import('openai')).default
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const { prompt } = await request.json()

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1536',
      quality: 'medium',
    })

    const b64 = response.data[0]?.b64_json || ''
    return Response.json({ b64 })
  } catch (err) {
    console.error('Image API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
