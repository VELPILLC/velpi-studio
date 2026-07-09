// Creative Intelligence Layer — unified Creative Directive assembler.
//
// Combines the outputs of all five CIL stages into ONE versioned Creative
// Decision Object (per docs/CDO_SCHEMA.md), with provenance and a metrics
// rollup. Pure + deterministic (no I/O, no Date): the caller passes runId,
// businessName, createdAt, and mode. Never throws; missing/invalid stages are
// tolerated and reflected in `partial`.
//
// Node-testable.

export const CDO_ASSEMBLER_VERSION = 'cdo-assembler@1.0.0'
export const CDO_SCHEMA_VERSION = 1

// stages: { understanding, strategy, director, blueprint, seedDefaults, validation }
//   validation = the Stage 5 result { validation, internal_critique, confidence, revisions }
// metas: { understanding, strategy, creative_director, blueprint, validation } (each a stage meta)
export function assembleDirective({ runId, businessName, createdAt, mode = 'shadow', stages = {}, metas = {} }) {
  const u = stages.understanding || {}
  const s = stages.strategy || {}
  const d = stages.director || {}
  const bp = stages.blueprint || {}
  const seed = stages.seedDefaults || {}
  const v = stages.validation || {}

  const present = {
    understanding: isNonEmpty(u),
    strategy: isNonEmpty(s),
    director: isNonEmpty(d),
    blueprint: isNonEmpty(bp),
    validation: isNonEmpty(v.validation),
  }
  const partial = !Object.values(present).every(Boolean)

  const cd = s.creative_direction || {}
  const cc = d.creative_concept || {}

  const directive = {
    schemaVersion: CDO_SCHEMA_VERSION,
    assemblerVersion: CDO_ASSEMBLER_VERSION,
    id: runId || null,
    businessName: businessName || u?.business_understanding?.true_offering || null,
    createdAt: createdAt || null,
    mode,
    partial,

    // §1-4 understanding
    business_understanding: u.business_understanding || null,
    customer_psychology: u.customer_psychology || null,
    market_positioning: mergeDefined(u.market_positioning, s.market_positioning_intended),
    brand_identity: {
      observed: u.brand_identity_observed || null,
      intended: s.brand_identity_intended || null,
      continuity_rule: s.brand_identity_intended?.brand_continuity_rule || null,
    },

    // §5-6 strategy + creative direction
    emotional_objectives: s.emotional_objectives || null,
    creative_direction: {
      creative_thesis: cc.creative_thesis || null,
      premium_tier: cd.premium_tier || null,
      premium_score: cd.premium_score ?? null,
      brand_archetype: cd.archetype_primary ? { primary: cd.archetype_primary, secondary: cd.archetype_secondary || null } : null,
      positioning_tension: cd.positioning_tension || null,
      the_gamble: cc.gamble_move ? { move: cc.gamble_move, justification: cc.gamble_justification, risk: cc.gamble_risk } : null,
      art_direction_statement: cc.art_direction_statement || null,
    },

    // §7 + §8-16 philosophies (executable blueprint)
    design_philosophy: d.design_philosophy || null,
    philosophies: {
      typography: bp.typography || null,
      spacing: bp.spacing || null,
      color: bp.color || null,
      layout: bp.layout || null,
      component: bp.component || null,
      motion: bp.motion || null,
      imagery: bp.imagery || null,
      mobile: bp.mobile || null,
      accessibility: bp.accessibility || null,
      interaction: bp.interaction || null,
    },

    // §14 conversion (strategic + execution)
    conversion_philosophy: mergeDefined(s.conversion_strategy, bp.conversion_execution),

    // §17 signature moment
    signature_moment: d.signature_moment || null,

    // §18 design DNA (seed from Stage 3; enriched with tier/archetype/palette)
    design_dna: {
      descriptors: d.design_dna_seed?.descriptors || [],
      tier: cd.premium_tier || null,
      archetype: cd.archetype_primary || null,
      palette_signature: bp.color?.role_map ? Object.values(bp.color.role_map).filter(x => typeof x === 'string' && x.startsWith('#')) : [],
      type_signature: bp.typography?.display_family && bp.typography?.body_family ? `${bp.typography.display_family}/${bp.typography.body_family}` : null,
    },

    // §22 constraints (from the authoritative blueprint fields)
    constraints: {
      accessibility: bp.accessibility || null,
      mobile_numerics: bp.mobile ? { base_viewport_px: bp.mobile.base_viewport_px, type_floor_px: bp.mobile.type_floor_px, edge_to_edge: bp.mobile.edge_to_edge, breakpoints: bp.mobile.breakpoints } : null,
      color_role_map: bp.color?.role_map || null,
    },

    // §19,21,24 validation
    validation: v.validation || null,
    internal_critique: v.internal_critique || null,
    confidence: v.confidence || null,
    revisions: v.revisions || [],

    // §20 reasoning
    creative_reasoning: {
      thesis: cc.creative_thesis || null,
      narrative: d.creative_reasoning?.narrative || null,
      key_insights: d.creative_reasoning?.key_insights || [],
      assumptions: [
        ...(Array.isArray(u.assumptions) ? u.assumptions : []),
        ...(Array.isArray(s.assumptions) ? s.assumptions : []),
        ...(Array.isArray(d.assumptions) ? d.assumptions : []),
      ],
    },

    // §25 learning + provenance
    provenance: buildProvenance(metas),
    rollup: buildRollup(metas, v, seed, bp),
    seedDefaults: seed || null,
  }

  return directive
}

function isNonEmpty(o) { return o && typeof o === 'object' && Object.keys(o).length > 0 }
function mergeDefined(a, b) {
  if (!a && !b) return null
  return { ...(a || {}), ...(b || {}) }
}

function buildProvenance(metas) {
  const out = {}
  for (const stage of ['understanding', 'strategy', 'creative_director', 'blueprint', 'validation']) {
    const m = metas?.[stage]
    if (!m) continue
    out[stage] = {
      promptVersion: m.promptVersion || null,
      schemaVersion: m.schemaVersion ?? null,
      model: m.model || null,
      valid: m.valid ?? m.modelValid ?? null,
      repaired: !!m.repaired,
      unrecoverable: !!m.unrecoverable,
      durationMs: m.durationMs ?? null,
      usage: m.usage || null,
    }
  }
  if (metas?.blueprint?.defaultsVersion) out.defaultsVersion = metas.blueprint.defaultsVersion
  return out
}

// Fast-query metrics rollup (also stored as row columns for the dashboard).
export function buildRollup(metas, validationResult, seedDefaults, blueprint) {
  let input = 0, output = 0, latency = 0
  const repairs = []
  const failures = []
  const perStage = {}
  for (const stage of ['understanding', 'strategy', 'creative_director', 'blueprint', 'validation']) {
    const m = metas?.[stage]
    if (!m) { failures.push(`${stage}:missing-meta`); continue }
    const u = m.usage || { input_tokens: 0, output_tokens: 0 }
    input += u.input_tokens || 0
    output += u.output_tokens || 0
    latency += m.durationMs || 0
    if (m.repaired) repairs.push(stage)
    if (m.unrecoverable) failures.push(`${stage}:unrecoverable`)
    if (m.valid === false || m.modelValid === false) failures.push(`${stage}:invalid-schema`)
    perStage[stage] = { durationMs: m.durationMs ?? null, input_tokens: u.input_tokens || 0, output_tokens: u.output_tokens || 0, repaired: !!m.repaired }
  }
  const val = validationResult?.validation || {}
  if (metas?.blueprint?.deterministicHardFail || metas?.validation?.deterministicHardFail) failures.push('validation:hard-fail')

  return {
    passed: val.passed ?? null,
    score: val.score ?? null,
    overall_confidence: validationResult?.confidence?.overall ?? null,
    issue_count: Array.isArray(val.issues) ? val.issues.length : null,
    overrides_detected: Array.isArray(metas?.blueprint?.overrides_detected) ? metas.blueprint.overrides_detected.map(o => o.param) : [],
    seed_conflicts: (seedDefaults?.meta?.conflicts || []).map(c => c.param),
    tokens: { input, output, total: input + output },
    latency_ms_total: latency,
    per_stage: perStage,
    repairs,
    failures,
    bespoke_ok: metas?.blueprint?.bespoke_ok ?? null,
  }
}
