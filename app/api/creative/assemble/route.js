export const maxDuration = 60

import { serverCilMode, isCilEnabled, CIL_MODES } from '../../../../lib/creative/flags.mjs'
import { assembleDirective } from '../../../../lib/creative/assembler.mjs'
import { saveAssembledDirective } from '../../../../lib/creative/persistence.mjs'

// CIL — unified Creative Directive assembler (Phase 1 / SHADOW ONLY).
//
// Combines the five stage outputs into ONE versioned CDO and persists a single
// row per generation for the shadow dashboard. Deterministic; not connected to
// Build. Gated by CIL_MODE.

export async function POST(request) {
  const mode = serverCilMode()
  if (!isCilEnabled(mode)) {
    return Response.json({ ok: false, disabled: true, mode: CIL_MODES.OFF })
  }
  try {
    const body = await request.json()
    const { runId, businessName, createdAt, stages, metas, niche, tier } = body

    const directive = assembleDirective({
      runId, businessName, createdAt: createdAt || new Date().toISOString(),
      mode, stages: stages || {}, metas: metas || {},
    })

    const persisted = await saveAssembledDirective({ id: runId, niche, tier, directive })
    try { console.log('[CIL:shadow:assembled]', JSON.stringify({ id: runId, partial: directive.partial, rollup: directive.rollup })) } catch (_) {}

    return Response.json({ ok: true, stage: 'assembled', directive, persisted })
  } catch (err) {
    try { console.warn('[CIL:shadow:assemble] error:', err?.message) } catch (_) {}
    return Response.json({ ok: false, error: err?.message || 'assemble failed', mode })
  }
}
