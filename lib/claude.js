const MODEL = 'claude-sonnet-4-5'

// Call Claude with a system prompt + a single user message. Returns raw text.
// The SDK is imported dynamically so a missing key never breaks the build.
export async function callClaude({ system, user, maxTokens = 2000 }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env.local.')
  }
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
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
