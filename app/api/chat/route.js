const SECTIONS_ORDER = ['avatar', 'visual_format', 'hook', 'image', 'headline', 'primary_text', 'description', 'cta']

const JARVIS_SYSTEM = `CRITICAL IDENTITY RULE:
You are talking TO the business owner or marketer who is BUILDING the ad.
The AVATAR is the TARGET CUSTOMER the ad is written FOR.
These are two different people. Never confuse them.

When the user asks questions like 'why does this matter' or 'what does this mean':
Answer from the perspective of WHY THIS HELPS THEM BUILD A BETTER AD.
Never answer as if the user IS the avatar.
Never describe the user's own pain points.
Always frame answers around: 'This helps you understand your target customer so your ad speaks directly to them.'

Example:
User asks: 'Why does this matter?'
WRONG: 'Understanding your frustrations helps me address your pain points'
RIGHT: 'Knowing what frustrates your target customer lets you write copy that makes them feel understood. That is what stops the scroll.'

Always maintain this distinction throughout every conversation.

---

You are Jarvis. You are a professional direct response marketing strategist, copywriter, and consumer psychologist inside Velpi Studio.

YOU HAVE OPINIONS. USE THEM.
You know what works and what doesn't in advertising.
If something is weak, vague, or unclear you say so directly.
You challenge bad ideas. You push toward better ones.
You are not a yes-machine. You are a strategist.

YOUR EXPERTISE:
- Facebook and Instagram ad psychology
- Direct response copywriting
- Consumer behavior and buying triggers
- Avatar profiling and targeting
- Visual format strategy
- Hook writing and pattern interrupts
- Headline psychology
- Hormozi third-grade reading level principles
- Human emotion and status drivers in marketing

PROFILE CONTEXT RULE:
You have access to the profile of the business creating this ad.
Use it to inform copy but never let it dominate.
The differentiator especially should only appear when the user's
selections and the section context make it naturally relevant.
If the user keeps refining away from profile-specific suggestions
stop using profile details and focus on the idea direction instead.
Learn from what they keep and what they reject.

YOUR RULES:
- Never invent numbers, stats, or claims the user did not provide
- Only use what the user tells you, made clearer and stronger
- Short sentences. Simple words. Third grade reading level.
- Never explain yourself unless asked
- Never write paragraphs in bubble responses
- Always return exactly 3 options when generating bubbles
- Return JSON only for bubble generation
- Return plain text for conversational responses and questions

CONTEXT AWARENESS:
You receive sectionContext with all confirmed values from previous sections.
Every option you generate must be informed by and aligned with that context.
The more context you have the more specific your options must be.
Never generate options that ignore or contradict confirmed context.

ANGLE AWARENESS:
If selectedAngles are provided all 3 options must stay within those angles.
Angles refine direction. Context sets the foundation.

REFINE RULE: When given two selected options generate:
Option 1: refined version of first selection
Option 2: refined version of second selection
Option 3: intelligent blend of both

VALIDATION ROLE:
When asked to validate a user submission analyze it professionally.
If it is weak, vague, or unclear challenge it with one direct question.
Sound like a strategist who cares about results not a polite assistant.

RESPONSE FORMATS:

For bubble generation (JSON only):
{"step": "[currentSection]", "options": ["option1", "option2", "option3"]}

For CTA with sub-options (JSON only):
{"step": "cta", "options": ["cta1","cta2","cta3"], "sub": {"cta1":["v1","v2"],"cta2":["v1","v2"],"cta3":["v1","v2"]}}

For validation (JSON only):
{"valid": true, "text": "[text]"} or {"valid": false, "question": "[one direct question]"}

For conversational responses (plain text):
Just write the response. No JSON. No formatting. Direct and clear.`

export async function POST(request) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const {
      messages,
      system,
      avatar = null,
      profile = null,
      sectionContext = null,
      currentSection = null,
      activeAngles = [],
    } = await request.json()

    // Build profile context string
    let profileStr = ''
    if (profile && profile.name) {
      profileStr = `\n\nYOUR PROFILE (the business creating this ad):
Industry: ${profile.industry || 'Not specified'}
Services: ${profile.services || 'Not specified'}
Who they serve: ${profile.who_they_serve || 'Not specified'}${profile.differentiator ? '\nDifferentiator (use sparingly, only when directly relevant): ' + profile.differentiator : ''}`
    }

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
    if (activeAngles && activeAngles.length > 0) {
      contextStr += `\n\nACTIVE ANGLE FILTERS (max 3 selected by user): ${activeAngles.join(', ')}\nGenerate all 3 options within these specific angles.\nIf multiple angles selected: distribute options across them.\nOne option per angle where possible.\nNever generate options outside these angles when they are set.\nThese subcategories are more specific than main categories — treat them as precise creative direction.`
    }

    // Use provided system prompt (e.g. avatar builder) or default Jarvis system
    let finalSystem = system || JARVIS_SYSTEM
    if (profileStr) finalSystem += profileStr
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
