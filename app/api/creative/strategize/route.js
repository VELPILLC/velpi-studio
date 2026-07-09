// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { createHash, randomUUID } from 'node:crypto'
import { generateStageJson } from '../../../../lib/creative/llm.mjs'
import { serverCilMode, isCilEnabled, CIL_MODES } from '../../../../lib/creative/flags.mjs'
import { STRATEGY_SYSTEM, REPAIR_SYSTEM, PROMPT_VERSION, buildStrategyUser } from '../../../../lib/creative/prompts/strategy.prompt.mjs'
import { validateStrategy, emptyStrategy, SCHEMA_VERSION } from '../../../../lib/creative/schema.strategy.mjs'
import { saveShadowStrategy } from '../../../../lib/creative/persistence.mjs'

// CIL Stage 2 — STRATEGY (Phase 1 / SHADOW ONLY).
//
// Consumes ONLY the Stage 1 Understanding output. Not connected to any
// downstream stage: nothing here influences Analyze, Brief, Copy, Build, or the
// shipped HTML. Runs only when CIL_MODE is enabled (server flag) AND is invoked
// (the client only calls it, after Stage 1, when NEXT_PUBLIC_CIL_MODE is on).
// Output is logged and best-effort persisted for inspection.

export async function POST(request) {
  const startedAt = Date.now()
  const mode = serverCilMode()

  if (!isCilEnabled(mode)) {
    return Response.json({ ok: false, disabled: true, mode: CIL_MODES.OFF })
  }

  try {
    const { understanding } = await request.json()
    if (!understanding || typeof understanding !== 'object') {
      return Response.json({ ok: false, error: 'Missing Stage 1 understanding for Strategy.' })
    }

    const system = STRATEGY_SYSTEM
    const user = buildStrategyUser({ understanding })

    const { obj, repaired, usage } = await generateStageJson({ system, user, repairSystem: REPAIR_SYSTEM, maxTokens: 5000 })
    let strategy = obj
    const unrecoverable = !strategy || typeof strategy !== 'object'
    if (unrecoverable) strategy = emptyStrategy()

    const { valid, errors } = validateStrategy(strategy)

    const id = randomUUID()
    const niche = understanding?.business_understanding?.category || ''
    const tier = strategy?.creative_direction?.premium_tier || ''
    const inputsHash = hashInputs({ u: understanding?.business_understanding?.true_offering, cat: niche })
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
      console.log('[CIL:shadow:strategy]', JSON.stringify({ niche, tier, meta, strategy }))
    } catch (_) { /* logging must never throw */ }

    const persisted = await saveShadowStrategy({ id, niche, tier, strategy, meta })

    return Response.json({ ok: true, stage: 'strategy', strategy, meta, persisted })
  } catch (err) {
    try { console.warn('[CIL:shadow:strategy] error:', err?.message) } catch (_) {}
    return Response.json({ ok: false, error: err?.message || 'strategy failed', mode })
  }
}

function hashInputs(obj) {
  try {
    return 'in_' + createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16)
  } catch (_) {
    return null
  }
}
