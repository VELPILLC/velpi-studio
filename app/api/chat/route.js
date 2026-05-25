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

CONTEXT RULE: You always receive confirmed values from previous sections.
Every option you generate must be informed by and aligned with that context.
Never generate options that ignore or contradict what was already confirmed.
The more context you have the more targeted and specific your options must be.

ANGLE RULE: When ACTIVE ANGLE FILTERS are provided:
- All 3 options must stay within the specified angle directions.
- If one angle: all 3 options lean that direction.
- If two angles: options blend those two directions.
- If three or more angles: options rotate across all specified angles.
- Never generate options that contradict or ignore active angle filters.

REFINE RULE: When given two selected options generate:
Option 1: refined version of first selection
Option 2: refined version of second selection
Option 3: intelligent blend of both

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
    const {
      messages,
      system,
      avatar = null,
      sectionContext = null,
      currentSection = null,
      selectedAngles = [],
    } = await request.json()

    // Build confirmed-sections context string (appended to system prompt)
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

    // Append active angle filters — hard requirement
    if (selectedAngles && selectedAngles.length > 0) {
      contextStr += `\n\nACTIVE ANGLE FILTERS: ${selectedAngles.join(', ')}\nAll 3 options must stay within these angle directions.\nDo not generate anything outside these angles.`
    }

    // Use provided system prompt (e.g. avatar builder) or default Jarvis system
    let finalSystem = system || JARVIS_SYSTEM
    if (contextStr) finalSystem += contextStr

    // Build context messages to inject as conversation turns (non-avatar sections only)
    let contextMessages = []
    if (sectionContext) {
      const confirmedEntries = Object.entries(sectionContext)
        .filter(([k, v]) => v !== null && k !== 'avatar')
      if (confirmedEntries.length > 0) {
        const contextContent =
          'CONTEXT FROM PREVIOUS SECTIONS:\n' +
          confirmedEntries
            .map(([k, v]) => k.toUpperCase().replace(/_/g, ' ') + ': ' + v)
            .join('\n')
        contextMessages = [
          { role: 'user', content: contextContent },
          { role: 'assistant', content: 'Understood. I will use all of this context to generate options.' },
        ]
      }
    }

    // Build base messages: avatar context → section context → actual chat
    let baseMessages
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
      baseMessages = [...avatarContext, ...contextMessages, ...messages]
    } else {
      baseMessages = [...contextMessages, ...messages]
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
