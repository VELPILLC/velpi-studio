// Creative Intelligence Layer — Validator logic (Stage 5).
//
// Pure helpers that (1) run DETERMINISTIC hard-gate checks over the assembled
// blueprint (constraint safety, accessibility floors, mobile-first, platform,
// non-genericness, completeness, visual consistency) and (2) MERGE those with
// the model's subjective assessment into the final validation / internal
// critique / confidence / revisions + overall pass/fail.
//
// The Validator NEVER modifies the blueprint — it only reads and reports.
//
// Pure module (no model, no I/O). Node-testable.

import { IMMUTABLE_PATHS } from './blueprint.mjs'

const SEV_RANK = { critical: 3, major: 2, minor: 1 }
export function severityRank(s) { return SEV_RANK[s] || 0 }

function seedVal(seedDefaults, path) { const [g, n] = path.split('.'); return seedDefaults?.seeds?.[g]?.[n]?.value }
function bpVal(bp, path) { const [g, n] = path.split('.'); return bp?.[g]?.[n] }
const contrastRank = { 'WCAG AA': 0, 'WCAG AAA': 1 }

// Run the deterministic checks. Returns { checks:[{id,area,passed,detail,severity,fix}], hardFail }.
export function runDeterministicChecks(blueprint, seedDefaults) {
  const checks = []
  const add = (id, area, passed, detail, severity, fix) => checks.push({ id, area, passed: !!passed, detail, severity, fix })
  const bp = blueprint || {}

  // 1) CONSTRAINT SAFETY — every authoritative field must equal its seed value.
  let intact = true
  const drift = []
  for (const p of IMMUTABLE_PATHS) {
    const a = JSON.stringify(bpVal(bp, p))
    const b = JSON.stringify(seedVal(seedDefaults, p))
    if (a !== b) { intact = false; drift.push(p) }
  }
  add('constraint.authoritative_intact', 'constraint_safety', intact,
    intact ? 'all authoritative values match the Defaults Engine' : `authoritative drift: ${drift.join(', ')}`,
    'critical', 'restore the authoritative seed values (they must never be changed)')

  // 2) ACCESSIBILITY floors.
  const cf = bpVal(bp, 'accessibility.contrast_floor')
  add('a11y.contrast_floor', 'accessibility', contrastRank[cf] >= 0, `contrast_floor=${cf}`, 'critical', 'set contrast_floor to WCAG AA or AAA')
  const minBody = bpVal(bp, 'accessibility.min_body_px')
  add('a11y.min_body_px', 'accessibility', typeof minBody === 'number' && minBody >= 16, `min_body_px=${minBody}`, 'critical', 'min_body_px must be >= 16')
  const tap = bpVal(bp, 'accessibility.tap_target_min_px')
  add('a11y.tap_target', 'accessibility', typeof tap === 'number' && tap >= 44, `tap_target_min_px=${tap}`, 'major', 'tap_target_min_px must be >= 44')
  const bodyPx = bpVal(bp, 'typography.body_px')
  add('a11y.body_px', 'accessibility', typeof bodyPx === 'number' && bodyPx >= 16, `typography.body_px=${bodyPx}`, 'critical', 'body_px must be >= 16')

  // 3) PLATFORM constants.
  add('platform.reduced_motion', 'platform', !!bpVal(bp, 'motion.reduced_motion_policy'), 'reduced_motion_policy present', 'major', 'add a prefers-reduced-motion policy')
  add('platform.nav', 'platform', !!bpVal(bp, 'interaction.nav_behavior'), 'nav_behavior present', 'minor', 'define the nav behavior')
  add('platform.base_unit', 'platform', bpVal(bp, 'spacing.base_unit') === 8, 'spacing.base_unit=8', 'minor', 'base unit should be 8')
  add('platform.single_motion', 'platform', typeof bpVal(bp, 'motion.placement') === 'string' && bpVal(bp, 'motion.placement').length > 0, 'single signature motion placement present', 'minor', 'name a single signature motion placement')

  // 4) MOBILE-FIRST.
  add('mobile.edge_to_edge', 'mobile', bpVal(bp, 'mobile.edge_to_edge') === true, 'edge_to_edge=true', 'major', 'mobile must be edge-to-edge')
  const tf = bpVal(bp, 'mobile.type_floor_px')
  add('mobile.type_floor', 'mobile', typeof tf === 'number' && tf >= 16, `type_floor_px=${tf}`, 'major', 'mobile type floor must be >= 16')
  add('mobile.breakpoints', 'mobile', Array.isArray(bpVal(bp, 'mobile.breakpoints')) && bpVal(bp, 'mobile.breakpoints').length >= 1, 'breakpoints present', 'minor', 'define breakpoints')
  add('mobile.nav_pattern', 'mobile', !!bpVal(bp, 'mobile.nav_pattern'), 'mobile nav_pattern present', 'major', 'define a JS-free mobile nav pattern')

  // 5) NON-GENERICNESS.
  const moves = bpVal(bp, 'layout.bespoke_moves')
  add('non_generic.bespoke_moves', 'non_generic', Array.isArray(moves) && moves.length >= 3, `bespoke_moves=${Array.isArray(moves) ? moves.length : 0}`, 'major', 'provide at least three bespoke compositional moves')
  add('non_generic.signature_move', 'non_generic', !!bpVal(bp, 'layout.signature_structural_move'), 'signature_structural_move present', 'major', 'name the signature structural move')

  // 6) COMPLETENESS of key executable fields.
  for (const [path, sev] of [['typography.display_family', 'major'], ['typography.body_family', 'major'], ['typography.hero_clamp', 'major'], ['color.contrast_strategy', 'minor'], ['imagery.art_direction', 'minor'], ['conversion_execution.cta_ubiquity_rule', 'major']]) {
    add(`completeness.${path}`, 'completeness', !!bpVal(bp, path), `${path} present`, sev, `provide ${path}`)
  }
  const order = bpVal(bp, 'layout.section_order')
  add('completeness.section_order', 'completeness', Array.isArray(order) && order.length > 0, 'section_order present', 'major', 'provide a section order')

  // 7) VISUAL CONSISTENCY (light).
  const sr = bpVal(bp, 'typography.scale_ratio')
  add('visual.scale_ratio_sane', 'visual_consistency', typeof sr === 'number' && sr >= 1.1 && sr <= 1.75, `scale_ratio=${sr}`, 'minor', 'keep scale_ratio between 1.1 and 1.75')
  add('visual.body_ge_floor', 'visual_consistency', typeof bodyPx === 'number' && typeof tf === 'number' && bodyPx >= tf, 'body_px >= mobile type floor', 'minor', 'body_px must be >= mobile type floor')

  const hardFail = checks.some(c => !c.passed && c.severity === 'critical')
  return { checks, hardFail }
}

// Merge deterministic checks + model assessment → final validation artifacts.
export function assembleValidation({ modelOut, deterministic, seedConflicts = [], unrecoverable = false }) {
  const m = modelOut && typeof modelOut === 'object' ? modelOut : {}
  const det = deterministic || { checks: [], hardFail: false }

  const detIssues = det.checks.filter(c => !c.passed).map(c => ({ severity: c.severity, area: c.area, problem: c.detail, fix: c.fix }))
  const modelIssues = Array.isArray(m.issues) ? m.issues : []
  const issues = [...detIssues, ...modelIssues]
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 12)
  const hasCriticalOrMajor = issues.some(i => i.severity === 'critical' || i.severity === 'major')

  const detTotal = det.checks.length || 1
  const detPass = det.checks.filter(c => c.passed).length
  const detRatio = detPass / detTotal

  const modelScore = Number.isInteger(m?.verdict?.model_score) ? m.verdict.model_score : 50
  let score = det.hardFail || unrecoverable ? Math.min(modelScore, 40) : modelScore
  if (hasCriticalOrMajor) score = Math.min(score, 84)
  score = Math.round(score)

  const passed = !det.hardFail && !unrecoverable && !!m?.verdict?.model_pass && score >= 85 && !hasCriticalOrMajor

  // Constraint safety summary by area.
  const areaPass = area => det.checks.filter(c => c.area === area).every(c => c.passed)
  const constraint_safety = {
    authoritative_intact: areaPass('constraint_safety'),
    a11y_ok: areaPass('accessibility'),
    mobile_ok: areaPass('mobile'),
    platform_ok: areaPass('platform'),
  }

  // Rules checked = deterministic checks + model dimensions as rules.
  const a = m.assessment || {}
  const dimRules = Object.entries(a)
    .filter(([, v]) => typeof v === 'number')
    .map(([k, v]) => ({ rule_id: `assessment.${k}`, area: 'creative', passed: v >= 0.7, detail: v }))
  const rules_checked = [
    ...det.checks.map(c => ({ rule_id: c.id, area: c.area, passed: c.passed, detail: c.detail })),
    ...dimRules,
  ]

  const coherence_check = {
    consistent: (a.creative_coherence ?? 0) >= 0.7 && (a.visual_consistency ?? 0) >= 0.7 && !hasCriticalOrMajor,
    conflicts: seedConflicts,
  }

  const validation = { passed, score, rules_checked, issues, coherence_check, constraint_safety, revised_count: 0 }

  // Confidence report.
  const by_section = {}
  for (const [k, v] of Object.entries(a)) if (typeof v === 'number' && k !== 'confidence') by_section[k] = v
  const dimEntries = Object.entries(by_section)
  const lowest = dimEntries.length ? dimEntries.reduce((lo, [s, v]) => (v < lo.value ? { section: s, value: v } : lo), { section: dimEntries[0][0], value: dimEntries[0][1] }) : null
  const overall_confidence = round2((typeof a.confidence === 'number' ? a.confidence : 0.7) * (0.7 + 0.3 * detRatio))
  const confidence = {
    overall: overall_confidence,
    by_section,
    lowest,
    fallback_triggered: unrecoverable ? ['validator-unrecoverable'] : [],
  }

  // Internal critique (from model) + a deterministic risk if a hard gate failed.
  const ic = m.internal_critique || {}
  const internal_critique = {
    self_score: modelScore,
    strengths: Array.isArray(ic.strengths) ? ic.strengths : [],
    weaknesses: Array.isArray(ic.weaknesses) ? ic.weaknesses : [],
    risk_flags: [...(Array.isArray(ic.risk_flags) ? ic.risk_flags : []), ...(det.hardFail ? ['deterministic hard-gate failure'] : [])],
    generic_check: ic.generic_check || { avoided: null, cliches_dodged: [] },
  }

  // Revisions (from model) sorted by priority.
  const pr = { high: 3, medium: 2, low: 1 }
  const revisions = (Array.isArray(m.revisions) ? m.revisions : [])
    .slice()
    .sort((x, y) => (pr[y.priority] || 0) - (pr[x.priority] || 0))

  return { validation, internal_critique, confidence, revisions }
}

function round2(x) { return Math.round(x * 100) / 100 }
