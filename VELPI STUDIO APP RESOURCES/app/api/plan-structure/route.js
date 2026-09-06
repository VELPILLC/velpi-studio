export const maxDuration = 60

import { planStructure } from '../../../lib/structurePlan'
import { BUILT_IN_STYLES } from '../../../lib/designStyles'
import { listStyles } from '../../../lib/supabase'

// Deterministic structure planning — no AI, pure JS. Given the analyze
// output (and an optional lock from a previous run of the same input),
// resolves the full structural skeleton: design systems, signature motion,
// per-section blueprints, section order. Same input -> same skeleton;
// regenerate = refine, not reroll. The client persists the returned lock
// per-domain and sends it back on the next regeneration.

export async function POST(request) {
  try {
    const { analysis, vibe, lock, manualStyleId, guidedDecisions } = await request.json()
    if (!analysis) {
      return Response.json({ error: 'Missing analysis to plan structure from.' }, { status: 400 })
    }
    // Same merged library the /api/styles picker shows: built-ins + DB rows.
    let allStyles = BUILT_IN_STYLES
    try {
      const dbStyles = await listStyles()
      if (Array.isArray(dbStyles) && dbStyles.length) allStyles = [...BUILT_IN_STYLES, ...dbStyles]
    } catch (_) { /* built-ins alone are fine */ }

    const plan = planStructure({
      analysis,
      allStyles,
      vibe: typeof vibe === 'string' ? vibe : '',
      lock: lock || null,
      manualStyleId: manualStyleId || guidedDecisions?.styleId || null,
      guidedDecisions: guidedDecisions || null,
    })
    return Response.json({
      sectionOrder: plan.sectionOrder,
      styles: plan.styles.map(s => ({ id: s.id, name: s.name, content: s.content })),
      motion: plan.motion,
      sectionRefs: plan.sectionRefs,
      sectionMap: plan.sectionMap,
      // family/borrowed are attestation: which single design language the page
      // committed to, and any category it had to source from outside it.
      family: plan.family,
      borrowed: plan.borrowed,
      lock: plan.lock,
    })
  } catch (err) {
    console.error('plan-structure error:', err)
    return Response.json({ error: `Structure planning failed: ${err.message}` }, { status: 500 })
  }
}
