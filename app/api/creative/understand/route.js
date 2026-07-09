// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { createHash, randomUUID } from 'node:crypto'
import { generateStageJson } from '../../../../lib/creative/llm.mjs'
import { serverCilMode, isCilEnabled, CIL_MODES } from '../../../../lib/creative/flags.mjs'
import { UNDERSTANDING_SYSTEM, REPAIR_SYSTEM, PROMPT_VERSION, buildUnderstandingUser } from '../../../../lib/creative/prompts/understanding.prompt.mjs'
import { validateUnderstanding, emptyUnderstanding, SCHEMA_VERSION } from '../../../../lib/creative/schema.mjs'
import { saveShadowUnderstanding } from '../../../../lib/creative/persistence.mjs'

// CIL Stage 1 — UNDERSTANDING (Phase 1 / SHADOW ONLY).
//
// Runs the Understanding reasoning stage and returns its output. It is NOT
// connected to any downstream stage: nothing here influences Analyze, Brief,
// Copy, Build, or the shipped HTML. It only runs when CIL_MODE is enabled
// (server flag) AND is invoked (the client only calls it when
// NEXT_PUBLIC_CIL_MODE is enabled). Output is logged server-side and, when a
// creative_directives table exists, persisted best-effort for inspection.

export async function POST(request) {
  const startedAt = Date.now()
  const mode = serverCilMode()

  // Hard server-side gate: disabled by default. Even if the client calls this,
  // it no-ops unless CIL_MODE is set. Legacy is entirely unaffected.
  if (!isCilEnabled(mode)) {
    return Response.json({ ok: false, disabled: true, mode: CIL_MODES.OFF })
  }

  try {
    const { scrapedData, analysis } = await request.json()
    if (!scrapedData) {
      return Response.json({ ok: false, error: 'Missing scrapedData for Understanding.' })
    }

    const facts = analysis?.facts || {}
    const brandObserved = {
      palette: analysis?.color_palette || scrapedData?.palette || [],
      typography: analysis?.brand?.typography || '',
      design_language: analysis?.brand?.design_language || '',
      logo: analysis?._source?.logo || scrapedData?.logo || '',
    }

    const system = UNDERSTANDING_SYSTEM
    const user = buildUnderstandingUser({ scrapedData, facts, brandObserved })

    const { obj, repaired, usage } = await generateStageJson({ system, user, repairSystem: REPAIR_SYSTEM, maxTokens: 6000 })
    let understanding = obj
    const unrecoverable = !understanding || typeof understanding !== 'object'
    if (unrecoverable) understanding = emptyUnderstanding()

    const { valid, errors } = validateUnderstanding(understanding)

    const id = randomUUID()
    const niche = analysis?.industry || ''
    const tier = understanding?.market_positioning?.price_posture || ''
    const inputsHash = hashInputs({ domain: scrapedData?.domain, contentLen: (scrapedData?.content || '').length, facts })
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

    // Log for inspection (visible in `next dev` terminal / Vercel logs).
    try {
      console.log('[CIL:shadow:understanding]', JSON.stringify({
        business: analysis?.business_name || scrapedData?.domain || '(unknown)',
        meta,
        understanding,
      }))
    } catch (_) { /* logging must never throw */ }

    // Durable shadow record — best-effort, never fatal.
    const persisted = await saveShadowUnderstanding({ id, niche, tier, understanding, meta })

    return Response.json({ ok: true, stage: 'understanding', understanding, meta, persisted })
  } catch (err) {
    // Shadow must never surface a hard error into the run — return ok:false.
    try { console.warn('[CIL:shadow:understanding] error:', err?.message) } catch (_) {}
    return Response.json({ ok: false, error: err?.message || 'understanding failed', mode })
  }
}

function hashInputs(obj) {
  try {
    return 'in_' + createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16)
  } catch (_) {
    return null
  }
}
