import { callClaude, stripFences } from '../../../lib/claude'

const SYSTEM = `You edit an existing single-page HTML website.

RULES:
- You are given the CURRENT full HTML and ONE change instruction.
- Make ONLY the requested change. Keep everything else byte-for-byte the same where possible.
- Preserve the existing structure, palette, fonts, images (including any data: URIs and remote URLs), and inline-CSS-only approach.
- No external dependencies, no animations/transitions, no gradients. Keep it iframe-safe.
- Return ONLY the complete, updated HTML document. Start with <!DOCTYPE html>. No markdown, no commentary.`

export async function POST(request) {
  try {
    const { html, instruction } = await request.json()
    if (!html || !instruction || !instruction.trim()) {
      return Response.json({ error: 'Need both the current HTML and a change to make.' }, { status: 400 })
    }

    const user = `CHANGE TO MAKE: ${instruction.trim()}

CURRENT HTML:
${html}`

    const raw = await callClaude({ system: SYSTEM, user, maxTokens: 8000 })
    const updated = stripFences(raw)
    if (!/<html|<!doctype/i.test(updated)) {
      return Response.json({ error: 'The edit could not be applied. Try rephrasing the change.' }, { status: 502 })
    }
    return Response.json({ html: updated })
  } catch (err) {
    console.error('edit-site error:', err)
    return Response.json({ error: `Edit failed: ${err.message}` }, { status: 500 })
  }
}
