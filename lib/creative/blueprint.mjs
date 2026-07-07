// Creative Intelligence Layer — Blueprint assembly logic (Stage 4).
//
// Pure helpers that (1) render the Defaults Engine seeds for the Blueprint
// prompt, (2) assemble the final executable blueprint by stitching the
// AUTHORITATIVE seeds over the model's judgment output (so floors, platform
// constants, and the palette role map can never be model-overridden), and
// (3) detect which seeds the model chose to override (a learning signal).
//
// Pure module (no model, no I/O). Node-testable.

// Params that are AUTHORITATIVE: taken verbatim from the Defaults Engine and
// never model-decided. These are constraint floors, platform constants, and the
// derived palette role map. The model never sees them as editable.
export const IMMUTABLE_PATHS = Object.freeze([
  'color.role_map',
  'color.accent_reservation',
  'accessibility.contrast_floor',
  'accessibility.min_body_px',
  'accessibility.tap_target_min_px',
  'accessibility.motion_safety',
  'mobile.base_viewport_px',
  'mobile.type_floor_px',
  'mobile.edge_to_edge',
  'mobile.breakpoints',
  'motion.reduced_motion_policy',
  'interaction.nav_behavior',
  'spacing.base_unit',
])

// Seeds carried through as defaults the model wasn't asked to decide (minor).
export const SEED_STITCHED_PATHS = Object.freeze([
  'interaction.hover_behavior',
  'interaction.feedback_language',
])

// Seeded params the model IS asked to refine (adopt-or-override). Used to render
// the SEED DEFAULTS block and to detect overrides after generation.
export const JUDGMENT_SEED_PATHS = Object.freeze([
  'typography.scale_ratio', 'typography.body_px', 'typography.type_personality',
  'spacing.density', 'spacing.section_rhythm', 'spacing.grid_asymmetry',
  'color.gradient_policy', 'color.dark_surface_policy',
  'component.radius_language', 'component.button_style', 'component.iconography', 'component.shadow_depth', 'component.ornamentation',
  'motion.intensity',
  'imagery.grade', 'imagery.lighting', 'imagery.crop_language', 'imagery.real_vs_generated_bias',
])

// blueprint model-field -> seed path, for override detection.
const OVERRIDE_MAP = Object.freeze({
  'typography.scale_ratio': 'typography.scale_ratio',
  'typography.body_px': 'typography.body_px',
  'spacing.density': 'spacing.density',
  'spacing.section_rhythm': 'spacing.section_rhythm',
  'spacing.grid_asymmetry': 'spacing.grid_asymmetry',
  'color.gradient_policy': 'color.gradient_policy',
  'color.dark_surface_policy': 'color.dark_surface_policy',
  'component.radius_language': 'component.radius_language',
  'component.button_style': 'component.button_style',
  'component.iconography': 'component.iconography',
  'component.shadow_depth': 'component.shadow_depth',
  'component.ornamentation': 'component.ornamentation',
  'motion.intensity': 'motion.intensity',
  'imagery.grade': 'imagery.grade',
  'imagery.lighting': 'imagery.lighting',
  'imagery.crop_language': 'imagery.crop_language',
  'imagery.real_vs_generated_bias': 'imagery.real_vs_generated_bias',
})

function seedVal(seedDefaults, path) {
  const [g, n] = path.split('.')
  return seedDefaults?.seeds?.[g]?.[n]?.value
}
function seedConf(seedDefaults, path) {
  const [g, n] = path.split('.')
  return seedDefaults?.seeds?.[g]?.[n]?.confidence
}
function seedConflicted(seedDefaults, path) {
  const [g, n] = path.split('.')
  return !!seedDefaults?.seeds?.[g]?.[n]?.conflicted
}

// Render the SEED DEFAULTS + AUTHORITATIVE blocks injected into the prompt.
export function renderSeedsForPrompt(seedDefaults) {
  const lines = []
  lines.push('SEED DEFAULTS (deterministic starting points) — adopt each unless the concept genuinely demands otherwise; when you override one, record it in refinement.overrides with a reason. Items marked [JUDGMENT NEEDED] had conflicting signals — spend your judgment there:')
  for (const p of JUDGMENT_SEED_PATHS) {
    const v = seedVal(seedDefaults, p)
    if (v === undefined) continue
    const flag = seedConflicted(seedDefaults, p) ? '  [JUDGMENT NEEDED]' : ''
    lines.push(`- ${p} = ${JSON.stringify(v)} (confidence ${seedConf(seedDefaults, p)})${flag}`)
  }
  lines.push('')
  lines.push('AUTHORITATIVE — FIXED. Implement these EXACTLY; never restate, weaken, or change them (they are applied automatically):')
  lines.push(`- color.role_map = ${JSON.stringify(seedVal(seedDefaults, 'color.role_map'))}`)
  lines.push(`- accessibility: contrast_floor ${seedVal(seedDefaults, 'accessibility.contrast_floor')}, min body ${seedVal(seedDefaults, 'accessibility.min_body_px')}px, tap target ${seedVal(seedDefaults, 'accessibility.tap_target_min_px')}px`)
  lines.push(`- mobile: base ${seedVal(seedDefaults, 'mobile.base_viewport_px')}px, type floor ${seedVal(seedDefaults, 'mobile.type_floor_px')}px, edge-to-edge ${seedVal(seedDefaults, 'mobile.edge_to_edge')}, breakpoints ${JSON.stringify(seedVal(seedDefaults, 'mobile.breakpoints'))}`)
  lines.push('- reduced-motion required; accent reserved for CTA + small emphasis; nav: sticky, JS-free mobile (logo + one CTA); spacing base unit 8')
  return lines.join('\n')
}

// Assemble the final executable blueprint: model judgment + authoritative overlay.
// Any attempt by the model to set an authoritative field is discarded — the seed
// value always wins.
export function assembleBlueprint(modelOut, seedDefaults) {
  const m = modelOut && typeof modelOut === 'object' ? modelOut : {}
  const set = (obj, path, val) => { const [g, n] = path.split('.'); (obj[g] = obj[g] || {})[n] = val }

  const bp = {
    typography: { ...(m.typography || {}) },
    spacing: { ...(m.spacing || {}) },
    color: { ...(m.color || {}) },
    layout: { ...(m.layout || {}) },
    component: { ...(m.component || {}) },
    motion: { ...(m.motion || {}) },
    imagery: { ...(m.imagery || {}) },
    mobile: { ...(m.mobile || {}) },
    interaction: {},
    accessibility: {},
    conversion_execution: { ...(m.conversion_execution || {}) },
    refinement: { ...(m.refinement || {}) },
  }

  // Overlay authoritative seeds (immutable) — these overwrite anything the model set.
  for (const p of IMMUTABLE_PATHS) set(bp, p, seedVal(seedDefaults, p))
  // Overlay seed-stitched defaults the model wasn't asked to decide.
  for (const p of SEED_STITCHED_PATHS) set(bp, p, seedVal(seedDefaults, p))

  return {
    blueprint: bp,
    authoritative: [...IMMUTABLE_PATHS],
    seed_stitched: [...SEED_STITCHED_PATHS],
  }
}

// Detect which seeded judgment params the model overrode (learning signal).
export function detectOverrides(modelOut, seedDefaults) {
  const out = []
  for (const [field, seedPath] of Object.entries(OVERRIDE_MAP)) {
    const [g, n] = field.split('.')
    const mv = modelOut?.[g]?.[n]
    if (mv === undefined) continue
    const sv = seedVal(seedDefaults, seedPath)
    if (sv !== undefined && JSON.stringify(mv) !== JSON.stringify(sv)) out.push({ param: field, from: sv, to: mv })
  }
  return out
}

// Convenience: does the blueprint honor the >=3 bespoke moves rule?
export function bespokeMovesOk(modelOut) {
  const moves = modelOut?.layout?.bespoke_moves
  return Array.isArray(moves) && moves.length >= 3
}
