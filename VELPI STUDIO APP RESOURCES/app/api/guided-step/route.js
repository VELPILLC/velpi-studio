export const maxDuration = 120

import { callClaude, parseJson } from '../../../lib/claude'
import { BUILT_IN_STYLES } from '../../../lib/designStyles'
import { buildCandidateSets, validateGuided, fallbackQuestions } from '../../../lib/guidedSpine.mjs'
import manifest from '../../../presets/sections/manifest.json'
import { rankMotionPresets } from '../../../lib/motionPresets'
import palettes from '../../../presets/design-intel/palettes.json'
import pairings from '../../../presets/design-intel/pairings.json'
import reasoning from '../../../presets/design-intel/reasoning.json'

// Guided design mode: the questions that let a person make the decisions the
// pipeline used to make by hash (which style system, which blueprints, which
// palette, which motion).
//
// The model's job here is deliberately small — it writes the wording, not the
// options. Every candidate is assembled server-side from the curated
// libraries, and validateGuided drops anything whose id wasn't on that list.
// That's what keeps the choices executable instead of evocative-but-vague.
//
// NOTE: candidates never come from the app's own previously generated sites.
// Only the supplied reference libraries feed this.

const SYSTEM = `You are a design director walking a client through the decisions for THEIR website, one screen at a time.

You are given a business analysis and, for each question, a fixed list of CANDIDATES. Each candidate has an id and a technical hint.

YOUR JOB — wording only:
- For each question, write a short question line ("q") in plain language, and a one-line "why" saying what this choice actually changes about their site.
- For each candidate, write a "label" (max 46 chars) and a "desc" (max 120 chars) written for THIS business — name their industry, their room, their customer. "Warm cantina editorial" beats "Option B"; "Deep red with warm gold, like the sign out front" beats "A red palette".
- Also write "ai": a richer phrasing of the same choice for a downstream design model.

HARD RULES:
- Use ONLY the candidate ids you are given. Never invent an id, never drop one, never merge two.
- Never invent a font, color, or layout that isn't in the candidate's hint — you are describing real options, not proposing new ones.
- No jargon a restaurant owner wouldn't use. No "leverage", "elevate", "synergy". Plain, concrete, specific.
- Every option must sound genuinely different from its siblings. If two options would read the same to a client, sharpen the distinction.

Return ONLY JSON:
{"questions":[{"id":"<question id>","q":"...","why":"...","options":[{"id":"<candidate id>","label":"...","desc":"...","ai":"..."}]}]}`

export async function POST(request) {
  let built = null
  try {
    const { analysis, answers = {}, brandColors = [] } = await request.json()
    if (!analysis) return Response.json({ error: 'Missing analysis.' }, { status: 400 })

    const sectionEntries = (manifest.sections || []).filter(s => s.reference && s.framework !== 'react-tsx')
    // Same niche/intensity scoring the automatic pick uses, so the options
    // offered are the ones that actually fit this business.
    const vibeText = `${analysis.tone || ''} ${analysis.target_feeling || ''}`
    const motionPresets = rankMotionPresets(analysis, vibeText, 4)

    built = buildCandidateSets({
      analysis,
      brandColors: brandColors.length ? brandColors : (analysis.brand_read?.colors || []).map(c => c.hex).filter(Boolean),
      styles: BUILT_IN_STYLES,
      sectionEntries,
      motionPresets,
      palettes, pairings, reasoning,
      answers,
    })

    const user = `BUSINESS: ${analysis.business_name || ''} — ${analysis.industry || ''}${analysis.niche ? ` (${analysis.niche})` : ''}
WHAT THEY DO: ${analysis.primary_service || ''}
THEIR CUSTOMER: ${analysis.target_customer || ''}
TONE: ${analysis.tone || ''}
FEELING TO CREATE: ${analysis.target_feeling || ''}
${analysis.brand_read ? `WHAT THEIR LOGO SAYS: ${JSON.stringify(analysis.brand_read)}` : ''}
${Object.keys(answers).length ? `ALREADY CHOSEN (narrow everything else to fit these): ${JSON.stringify(answers)}` : ''}

QUESTIONS AND THEIR CANDIDATES:
${JSON.stringify({ questions: Object.entries(built.sets).map(([id, candidates]) => ({ id, candidates: candidates.map(c => ({ id: c.id, hint: c.hint })) })) }, null, 1)}`

    const raw = await callClaude({ system: SYSTEM, user, maxTokens: 4000 })
    const questions = validateGuided(parseJson(raw) || {}, built.sets)
    // sets travel with the questions so the client can turn answers into
    // decisions (palette hexes, font @import, section order) without a second
    // round trip — the metadata is what makes an answer executable.
    return Response.json({ ok: true, source: 'model', questions, sets: built.sets, family: built.family, productType: built.productType })
  } catch (err) {
    console.error('guided-step error:', err)
    // NEVER fail hard: a broken question-writer must not block a generation.
    // Auto-labeled candidates are less charming but completely usable.
    if (built?.sets) {
      return Response.json({ ok: false, source: 'fallback', questions: fallbackQuestions(built.sets), sets: built.sets, family: built.family, reason: err.message })
    }
    return Response.json({ ok: false, source: 'none', questions: [], reason: err.message })
  }
}
