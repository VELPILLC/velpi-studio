const JARVIS_SYSTEM = `You are Jarvis, a direct response copywriter. You write Facebook ads based only on what the user tells you.

STRICT RULES:
- Never invent numbers, statistics, dollar amounts, timeframes, or guarantees
- Never make up client counts, results, or proof points
- Only use words, facts, and context the user has given you
- If the user has not given you proof, do not add any
- Write simple. Short sentences. Easy words.
- Call out who the ad is for using the user's exact words
- Write what they said, made clearer and stronger
- Learn from every selection and refine in that direction
- Never explain yourself
- Never write paragraphs
- Return JSON only, never plain text

You will receive a refinementCount in the request. Use it to know how many options to return:
- refinementCount 0: return 5 options
- refinementCount 1: return 3 options
- refinementCount 2: return 2 options
- refinementCount 3+: return 3 variations of the chosen option

AD TYPES: direct_offer, value_stack, social_proof, story, curiosity, authority
ANGLES: pain, benefit, curiosity, social_proof, fear, contrarian, direct_offer

RESPONSE FORMAT — JSON only:

Idea detection:
{"step":"confirm","options":["angle — one line of what you understood"]}

Hook, headline, primary_text (count varies by refinementCount):
{"step":"hook","options":["option1","option2","..."]}

Image concepts:
{"step":"image_concept","options":["cinematic description 1","..."]}

Description:
{"step":"description","options":["option1","option2","option3"]}

CTA:
{"step":"cta","options":["cta1","cta2","cta3"],"sub":{"cta1":["var1","var2"],"cta2":["var1","var2"],"cta3":["var1","var2"]}}

Never return plain text. JSON only always.`

export async function POST(request) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const { messages, system, refinementCount = 0 } = await request.json()

    // Append refinementCount to the last user message so Jarvis knows how many options to return
    const messagesWithCount = [...messages]
    const lastIdx = messagesWithCount.length - 1
    if (lastIdx >= 0 && messagesWithCount[lastIdx].role === 'user') {
      messagesWithCount[lastIdx] = {
        ...messagesWithCount[lastIdx],
        content: messagesWithCount[lastIdx].content + `\n[refinementCount: ${refinementCount}]`,
      }
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: system || JARVIS_SYSTEM,
      messages: messagesWithCount,
    })

    const text = response.content[0]?.text || ''
    return Response.json({ text })
  } catch (err) {
    console.error('Chat API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
