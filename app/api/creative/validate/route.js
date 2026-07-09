// Vercel: allow long-running AI work (up to 5 min with fluid compute)
export const maxDuration = 300

import { createHash, randomUUID } from 'node:crypto'
import { generateStageJson } from '../../../../lib/creative/llm.mjs'
import { serverCilMode, isCilEnabled, CIL_MODES } from '../../../../lib/creative/flags.mjs'
import { VALIDATOR_SYSTEM, REPAIR_SYSTEM, PROMPT_VERSION, buildValidatorUser } from '../../../../lib/creative/prompts/validator.prompt.mjs'
import { validateValidator, emptyValidator, SCHEMA_VERSION } from '../../../../lib/creative/schema.validator.mjs'
import { runDeterministicChecks, assembleValidation } from '../../../../lib/creative/validator.mjs'
import { computeDefaults } from '../../../../lib/creative/defaults.mjs'
import { saveShadowValidation } from '../../../../lib/creative/persistence.mjs'

// CIL Stage 5 — VALIDATOR (Phase 1 / SHADOW ONLY). The final CIL stage.
//
// Consumes the fully assembled Blueprint (Stage 4) plus context (Stage 3 thesis,
// Stage 2 brand/conversion). It runs DETERMINISTIC hard-gate checks (recomputing
// the seed defaults to verify authoritative fields weren't drifted), then a MODEL
// critique of the subjective dimensions, and merges them into the final verdict.
// It NEVER modifies the blueprint. Not connected to Build: nothing here
// influences Analyze, Brief, Copy, Images, Build, or the shipped HTML.

export async function POST(request) {
  const startedAt = Date.now()
  const mode = serverCilMode()

  if (!isCilEnabled(mode)) {
    return Response.json({ ok: false, disabled: true, mode: CIL_MODES.OFF })
  }

  try {
    const { blueprint, director, strategy, palette, industry } = await request.json()
    if (!blueprint || typeof blueprint !== 'object') {
      return Response.json({ ok: false, error: 'Missing assembled blueprint to validate.' })
    }

    // Recompute the deterministic seeds to independently verify authoritative fields.
    const seedDefaults = computeDefaults({ strategy, director, palette, industry })
    const deterministic = runDeterministicChecks(blueprint, seedDefaults)

    // Model critique of the subjective dimensions.
    const system = VALIDATOR_SYSTEM
    const user = buildValidatorUser({ blueprint, director, strategy, deterministic })

    const { obj, repaired, usage } = await generateStageJson({ system, user, repairSystem: REPAIR_SYSTEM, maxTokens: 4000 })
    let modelOut = obj
    const unrecoverable = !modelOut || typeof modelOut !== 'object'
    if (unrecoverable) modelOut = emptyValidator()

    const { valid: modelValid, errors: modelErrors } = validateValidator(modelOut)

    const result = assembleValidation({
      modelOut,
      deterministic,
      seedConflicts: seedDefaults.meta.conflicts.map(c => c.param),
      unrecoverable,
    })

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
      modelValid,
      repaired,
      unrecoverable,
      modelValidationErrors: modelErrors,
      deterministicHardFail: deterministic.hardFail,
      deterministicPassed: deterministic.checks.filter(c => c.passed).length,
      deterministicTotal: deterministic.checks.length,
      inputsHash,
      usage,
      durationMs: Date.now() - startedAt,
      at: new Date().toISOString(),
    }

    try {
      console.log('[CIL:shadow:validation]', JSON.stringify({
        tier,
        passed: result.validation.passed,
        score: result.validation.score,
        issues: result.validation.issues.length,
        meta,
        result,
      }))
    } catch (_) { /* logging must never throw */ }

    const persisted = await saveShadowValidation({ id, niche, tier, result, meta })

    return Response.json({ ok: true, stage: 'validation', ...result, meta, persisted })
  } catch (err) {
    try { console.warn('[CIL:shadow:validation] error:', err?.message) } catch (_) {}
    return Response.json({ ok: false, error: err?.message || 'validation failed', mode })
  }
}

function hashInputs(obj) {
  try {
    return 'in_' + createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16)
  } catch (_) {
    return null
  }
}
