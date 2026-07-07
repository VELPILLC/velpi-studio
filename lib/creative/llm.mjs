// Creative Intelligence Layer — stage LLM helper.
//
// Centralizes the "call model → parse JSON → one repair pass → capture token
// usage" pattern shared by every CIL stage route. Behavior is identical to the
// inline logic each route used before; it now also returns token usage for the
// shadow metrics. Imported only by the routes (not by unit tests).

import { callClaudeWithUsage, parseJson, stripFences } from '../claude'

export async function generateStageJson({ system, user, repairSystem, maxTokens = 4000 }) {
  const usage = { input_tokens: 0, output_tokens: 0 }
  const add = u => { usage.input_tokens += u?.input_tokens || 0; usage.output_tokens += u?.output_tokens || 0 }

  const r1 = await callClaudeWithUsage({ system, user, maxTokens })
  add(r1.usage)
  let obj = parseJson(r1.text)
  let repaired = false

  if (!obj || typeof obj !== 'object') {
    try {
      const r2 = await callClaudeWithUsage({ system: repairSystem, user: stripFences(r1.text), maxTokens })
      add(r2.usage)
      obj = parseJson(r2.text)
      repaired = true
    } catch (_) { /* fall through — caller substitutes an empty skeleton */ }
  }

  return { obj, repaired, usage }
}
