// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { createHash, randomUUID } from 'node:crypto'
import { generateStageJson } from '../../../../lib/creative/llm.mjs'
import { serverCilMode, isCilEnabled, CIL_MODES } from '../../../../lib/creative/flags.mjs'
import { BLUEPRINT_SYSTEM, REPAIR_SYSTEM, PROMPT_VERSION, buildBlueprintUser } from '../../../../lib/creative/prompts/blueprint.prompt.mjs'
import { validateBlueprint, emptyBlueprint, SCHEMA_VERSION } from '../../../../lib/creative/schema.blueprint.mjs'
import { assembleBlueprint, detectOverrides, bespokeMovesOk, IMMUTABLE_PATHS } from '../../../../lib/creative/blueprint.mjs'
import { computeDefaults } from '../../../../lib/creative/defaults.mjs'
import { saveShadowBlueprint } from '../../../../lib/creative/persistence.mjs'

// CIL Stage 4 — BLUEPRINT GENERATOR (Phase 1 / SHADOW ONLY).
//
// The FIRST stage that consumes the deterministic Defaults Engine. It takes the
// Stage 3 concept + Stage 2 strategy + brand palette, computes the seed defaults
// (computeDefaults), asks the model to REFINE the seeds (never invent), then
// stitches the AUTHORITATIVE seeds (floors, platform constants, palette role map)
// over the model output so they can never be overridden. Not connected to Build:
// nothing here influences Analyze, Brief, Copy, Images, Build, or the shipped
// HTML. Runs only when CIL_MODE is enabled AND invoked (client gated by
// NEXT_PUBLIC_CIL_MODE). Output is logged and best-effort persisted.

export async function POST(request) {
  const startedAt = Date.now()
  const mode = serverCilMode()

  if (!isCilEnabled(mode)) {
    return Response.json({ ok: false, disabled: true, mode: CIL_MODES.OFF })
  }

  try {
    const { director, strategy, palette, industry } = await request.json()
    if (!director || typeof director !== 'object') {
      return Response.json({ ok: false, error: 'Missing Stage 3 director for Blueprint.' })
    }

    // Consume the deterministic Defaults Engine.
    const seedDefaults = computeDefaults({ strategy, director, palette, industry })

    // Section order from the Stage 2 conversion spine (falls back to a sane order).
    const flow = strategy?.conversion_strategy?.persuasion_flow
    const sectionOrderHint = Array.isArray(flow) && flow.length
      ? flow.map(s => s.section).filter(Boolean)
      : ['hero', 'services', 'about', 'proof', 'contact']

    const system = BLUEPRINT_SYSTEM
    const user = buildBlueprintUser({ director, seedDefaults, sectionOrderHint })

    const { obj, repaired, usage } = await generateStageJson({ system, user, repairSystem: REPAIR_SYSTEM, maxTokens: 6000 })
    let modelOut = obj
    const unrecoverable = !modelOut || typeof modelOut !== 'object'
    if (unrecoverable) modelOut = emptyBlueprint()

    const { valid, errors } = validateBlueprint(modelOut)
    const overrides_detected = detectOverrides(modelOut, seedDefaults)
    const bespoke_ok = bespokeMovesOk(modelOut)

    // Stitch the authoritative seeds over the model judgment.
    const { blueprint, authoritative, seed_stitched } = assembleBlueprint(modelOut, seedDefaults)

    const id = randomUUID()
    const tier = strategy?.creative_direction?.premium_tier || ''
    const niche = strategy?.market_positioning_intended?.statement || ''
    const inputsHash = hashInputs({ tier, thesis: director?.creative_concept?.creative_thesis, seedV: seedDefaults.version })
    const meta = {
      id,
      mode,
      promptVersion: PROMPT_VERSION,
      schemaVersion: SCHEMA_VERSION,
      defaultsVersion: seedDefaults.version,
      model: 'claude-sonnet-4-5',
      valid,
      repaired,
      unrecoverable,
      validationErrors: errors,
      bespoke_ok,
      overrides_detected,
      authoritative,
      seed_stitched,
      seed_conflicts: seedDefaults.meta.conflicts.map(c => c.param),
      inputsHash,
      usage,
      durationMs: Date.now() - startedAt,
      at: new Date().toISOString(),
    }

    try {
      console.log('[CIL:shadow:blueprint]', JSON.stringify({ tier, meta, blueprint }))
    } catch (_) { /* logging must never throw */ }

    const persisted = await saveShadowBlueprint({ id, niche, tier, blueprint, seedDefaults, meta })

    return Response.json({ ok: true, stage: 'blueprint', blueprint, seedDefaults, meta, persisted })
  } catch (err) {
    try { console.warn('[CIL:shadow:blueprint] error:', err?.message) } catch (_) {}
    return Response.json({ ok: false, error: err?.message || 'blueprint failed', mode })
  }
}

function hashInputs(obj) {
  try {
    return 'in_' + createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16)
  } catch (_) {
    return null
  }
}
