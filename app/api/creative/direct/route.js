// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { createHash, randomUUID } from 'node:crypto'
import { generateStageJson } from '../../../../lib/creative/llm.mjs'
import { serverCilMode, isCilEnabled, CIL_MODES } from '../../../../lib/creative/flags.mjs'
import { DIRECTOR_SYSTEM, REPAIR_SYSTEM, PROMPT_VERSION, buildDirectorUser } from '../../../../lib/creative/prompts/director.prompt.mjs'
import { validateDirector, emptyDirector, SCHEMA_VERSION } from '../../../../lib/creative/schema.director.mjs'
import { saveShadowDirector } from '../../../../lib/creative/persistence.mjs'

// CIL Stage 3 — CREATIVE DIRECTOR (Phase 1 / SHADOW ONLY).
//
// Consumes ONLY the Stage 2 Strategy output. Not connected to any downstream
// stage: nothing here influences Analyze, Brief, Copy, Images, Build, or the
// shipped HTML. Runs only when CIL_MODE is enabled (server flag) AND is invoked
// (the client only calls it, after Stage 2, when NEXT_PUBLIC_CIL_MODE is on).
// Output is logged and best-effort persisted for inspection.

export async function POST(request) {
  const startedAt = Date.now()
  const mode = serverCilMode()

  if (!isCilEnabled(mode)) {
    return Response.json({ ok: false, disabled: true, mode: CIL_MODES.OFF })
  }

  try {
    const { strategy } = await request.json()
    if (!strategy || typeof strategy !== 'object') {
      return Response.json({ ok: false, error: 'Missing Stage 2 strategy for Creative Director.' })
    }

    const system = DIRECTOR_SYSTEM
    const user = buildDirectorUser({ strategy })

    const { obj, repaired, usage } = await generateStageJson({ system, user, repairSystem: REPAIR_SYSTEM, maxTokens: 5000 })
    let director = obj
    const unrecoverable = !director || typeof director !== 'object'
    if (unrecoverable) director = emptyDirector()

    const { valid, errors } = validateDirector(director)

    const id = randomUUID()
    const tier = strategy?.creative_direction?.premium_tier || ''
    const niche = strategy?.market_positioning_intended?.statement || ''
    const inputsHash = hashInputs({ tier, tension: strategy?.creative_direction?.positioning_tension })
    const meta = {
      id,
      mode,
      promptVersion: PROMPT_VERSION,
      schemaVersion: SCHEMA_VERSION,
      model: 'claude-sonnet-4-5',
      valid,
      repaired,
      unrecoverable,
      validationErrors: errors,
      inputsHash,
      usage,
      durationMs: Date.now() - startedAt,
      at: new Date().toISOString(),
    }

    try {
      console.log('[CIL:shadow:creative_director]', JSON.stringify({ tier, meta, director }))
    } catch (_) { /* logging must never throw */ }

    const persisted = await saveShadowDirector({ id, niche, tier, director, meta })

    return Response.json({ ok: true, stage: 'creative_director', director, meta, persisted })
  } catch (err) {
    try { console.warn('[CIL:shadow:creative_director] error:', err?.message) } catch (_) {}
    return Response.json({ ok: false, error: err?.message || 'creative director failed', mode })
  }
}

function hashInputs(obj) {
  try {
    return 'in_' + createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16)
  } catch (_) {
    return null
  }
}
