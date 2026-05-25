const SECTIONS_ORDER = ['avatar', 'visual_format', 'hook', 'image', 'headline', 'primary_text', 'description', 'cta']

const JARVIS_SYSTEM = `You are Jarvis, a direct response ad strategist inside Velpi Studio.

RULES:
- Always return exactly 3 options. Never more. Never less.
- Never invent numbers, stats, or claims the user did not provide.
- Only use what the user tells you. Make it clearer and stronger.
- Short sentences. Simple words. Third grade reading level.
- Never explain yourself.
- Never write paragraphs.
- Return JSON only. Never plain text.

YOU RECEIVE:
- currentSection: which section you are generating for
- sectionContext: all confirmed values from previous sections
- avatar: full avatar profile if one is selected
- messages: the chat history for this section

USE sectionContext to inform every response.
The more sections confirmed above, the more targeted your options should be.

RESPONSE FORMAT — always exactly this structure:
{
  "step": "[currentSection]",
  "options": ["option1", "option2", "option3"]
}

For image section return cinematic photo descriptions as the 3 options.
For cta section also return sub-variations:
{
  "step": "cta",
  "options": ["cta1", "cta2", "cta3"],
  "sub": {
    "cta1": ["var1", "var2"],
    "cta2": ["var1", "var2"],
    "cta3": ["var1", "var2"]
  }
}

Never return plain text. JSON only always.`

export async function POST(request) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const { messages, system, avatar = null, sectionContext = null, currentSection = null } = await request.json()

    // Build confirmed-sections context string
    let contextStr = ''
    if (sectionContext && currentSection) {
      const currentIdx = SECTIONS_ORDER.indexOf(currentSection)
      const confirmedParts = []
      for (let i = 0; i < currentIdx; i++) {
        const sec = SECTIONS_ORDER[i]
        if (sectionContext[sec]) {
          const label = sec.toUpperCase().replace(/_/g, ' ')
          confirmedParts.push(`${label}: ${sectionContext[sec]}`)
        }
      }
      if (confirmedParts.length > 0) {
        contextStr = `\n\nCONFIRMED SO FAR:\n${confirmedParts.join('\n')}`
      }
    }

    // Use provided system prompt (e.g. avatar builder) or default Jarvis system
    let finalSystem = system || JARVIS_SYSTEM
    if (contextStr) finalSystem += contextStr

    // Prepend avatar context as first two messages if an avatar is selected
    let baseMessages = [...messages]
    if (avatar && avatar.name) {
      const avatarContext = [
        {
          role: 'user',
          content: `AVATAR CONTEXT — write everything for this person:
Name: ${avatar.name}
Age Range: ${avatar.age_range || 'Not specified'}
Niche: ${avatar.niche || 'Not specified'}
What they want: ${avatar.what_they_want || 'Not specified'}
What they fear: ${avatar.what_they_fear || 'Not specified'}
What they trust visually: ${avatar.what_they_trust || 'Not specified'}
Primary emotion: ${avatar.primary_emotion || 'Not specified'}`,
        },
        {
          role: 'assistant',
          content: '{"step":"ready","message":"Avatar locked in. I know exactly who we are writing for."}',
        },
      ]
      baseMessages = [...avatarContext, ...messages]
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: finalSystem,
      messages: baseMessages,
    })

    const text = response.content[0]?.text || ''
    return Response.json({ text })
  } catch (err) {
    console.error('Chat API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
