const MODEL = 'claude-sonnet-4-5'

// Call Claude with a system prompt + a single user turn. Optionally attach images
// (Claude vision) by passing `images: [{ media_type, data }]` where data is raw
// base64 (no data: prefix). Returns raw text. SDK imported dynamically so a missing
// key never breaks the build.
export async function callClaude({ system, user, images = [], maxTokens = 2000 }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env.local.')
  }
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let content
  if (Array.isArray(images) && images.length) {
    content = [
      ...images.map(im => ({
        type: 'image',
        source: { type: 'base64', media_type: im.media_type || 'image/png', data: im.data },
      })),
      { type: 'text', text: user },
    ]
  } else {
    content = user
  }

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content }],
  })
  return res.content?.[0]?.text || ''
}

export function stripFences(raw) {
  return String(raw || '')
    .replace(/```html|```json|```/g, '')
    .trim()
}

// Best-effort JSON parse — tolerates code fences and surrounding prose.
export function parseJson(raw) {
  const cleaned = stripFences(raw)
  try {
    return JSON.parse(cleaned)
  } catch (_) {}
  try {
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
  } catch (_) {}
  return null
}
