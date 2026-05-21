export async function POST(request) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const { messages, system } = await request.json()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1200,
      system: system || '',
      messages,
    })

    const text = response.content[0]?.text || ''
    return Response.json({ text })
  } catch (err) {
    console.error('Chat API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
