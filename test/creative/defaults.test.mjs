// Defaults Engine unit tests + golden snapshots — pure, deterministic, no deps.
// Run: npm run test:creative

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULTS_VERSION, computeDefaults, normalizeSignals, explainDefaults,
  derivePaletteRoles, TIER_TABLE, ARCHETYPE_TABLE, PARAM_REGISTRY,
} from '../../lib/creative/defaults.mjs'

// Flatten seeds → { 'group.name': value } for concise assertions.
function flatten(result) {
  const out = {}
  for (const [g, gg] of Object.entries(result.seeds)) for (const [n, s] of Object.entries(gg)) out[`${g}.${n}`] = s.value
  return out
}

// ── Canonical fixture (also the golden snapshot) ─────────────────────────────
const F1 = {
  strategy: {
    creative_direction: { premium_tier: 'luxury', premium_score: 80, archetype_primary: 'Lover', archetype_secondary: 'Sage' },
    emotional_objectives: { primary_emotion: 'warmth', secondary_emotion: 'intimacy', north_star_feeling: 'romantic anticipation', evoke: ['intimacy', 'occasion'], avoid: ['loud', 'cheap'] },
  },
  director: { design_philosophy: { ornamentation: 'restrained' }, imagery_concept: { real_vs_generated_bias: 'prefer_real' } },
  palette: ['#7a1f2b', '#f5ead6', '#c9a26a', '#1c1a17'],
  industry: 'fine dining restaurant',
}

// GOLDEN — frozen expected output for F1. Any table/logic change diffs here.
const GOLDEN_F1 = {
  'color.role_map': { page_bg: '#f5ead6', alt_bg: '#eae0cc', ink: '#1c1a17', muted: '#7e786d', cta: '#7a1f2b', accent: '#c9a26a' },
  'color.gradient_policy': 'subtle',
  'color.dark_surface_policy': 'restricted',
  'color.accent_reservation': 'CTA and small emphasis only',
  'typography.scale_ratio': 1.414,
  'typography.body_px': 17,
  'typography.type_personality': 'serif',
  'spacing.base_unit': 8,
  'spacing.density': 'airy',
  'spacing.section_rhythm': 128,
  'spacing.grid_asymmetry': 'subtle',
  'motion.intensity_score': 18,
  'motion.intensity': 'subtle',
  'motion.reduced_motion_policy': 'disable ambient keyframes on prefers-reduced-motion',
  'motion.micro_interactions_allowed': ['hover lift', 'nav underline', 'image scale 1.03'],
  'imagery.grade': 'amber-warm',
  'imagery.lighting': 'soft',
  'imagery.real_vs_generated_bias': 'prefer_real',
  'imagery.crop_language': 'standard',
  'component.ornamentation': 'restrained',
  'component.radius_language': 'soft',
  'component.button_style': 'solid-weighty',
  'component.iconography': 'line',
  'component.shadow_depth': 'refined',
  'interaction.hover_behavior': 'lift',
  'interaction.feedback_language': 'gentle',
  'interaction.nav_behavior': 'sticky nav; JS-free mobile: logo + one CTA',
  'layout.rhythm_pattern': 'alternating',
  'mobile.base_viewport_px': 390,
  'mobile.type_floor_px': 16,
  'mobile.edge_to_edge': true,
  'mobile.breakpoints': [768, 1200],
  'accessibility.contrast_floor': 'WCAG AA',
  'accessibility.min_body_px': 16,
  'accessibility.tap_target_min_px': 44,
  'accessibility.motion_safety': 'all ambient motion disabled on prefers-reduced-motion',
}

// ── Golden snapshot ──────────────────────────────────────────────────────────
test('GOLDEN: F1 produces the exact frozen seed values', () => {
  assert.deepEqual(flatten(computeDefaults(F1)), GOLDEN_F1)
})

test('GOLDEN: F1 meta is stable (overall confidence + conflict set)', () => {
  const r = computeDefaults(F1)
  assert.equal(r.version, DEFAULTS_VERSION)
  assert.equal(r.meta.overall_confidence, 0.95)
  assert.deepEqual(r.meta.conflicts.map(c => c.param), ['spacing.grid_asymmetry'])
})

// ── Determinism / reproducibility ────────────────────────────────────────────
test('deterministic: two identical calls are byte-for-byte equal', () => {
  assert.equal(JSON.stringify(computeDefaults(F1)), JSON.stringify(computeDefaults(F1)))
})

test('never throws on empty / garbage input and always returns a complete set', () => {
  for (const input of [{}, undefined, { strategy: null }, { palette: 'bad' }, { strategy: { creative_direction: {} } }]) {
    const r = computeDefaults(input)
    assert.ok(r.seeds.color.role_map.value.page_bg)
    // every registry param is present in the output
    for (const reg of PARAM_REGISTRY) {
      const [g, n] = reg.key.split('.')
      assert.ok(r.seeds[g] && n in r.seeds[g], `missing ${reg.key}`)
    }
  }
})

// ── Palette derivation ───────────────────────────────────────────────────────
test('palette: cta picks the dark saturated brand color, not a light bg tint', () => {
  const { role_map } = derivePaletteRoles(['#7a1f2b', '#f5ead6', '#c9a26a', '#1c1a17'])
  assert.equal(role_map.cta, '#7a1f2b')   // maroon, not cream
  assert.equal(role_map.accent, '#c9a26a')
  assert.equal(role_map.page_bg, '#f5ead6')
  assert.equal(role_map.ink, '#1c1a17')
})

test('palette: empty palette falls back to white bg + near-black ink', () => {
  const { role_map, confidence } = derivePaletteRoles([])
  assert.equal(role_map.page_bg, '#ffffff')
  assert.equal(role_map.ink, '#111214')
  assert.ok(confidence < 1)
})

test('palette: contrast guarantee forces near-black ink on a low-contrast palette', () => {
  const { role_map } = derivePaletteRoles(['#eeeeee', '#dddddd'])
  assert.equal(role_map.ink, '#111214')
})

// ── Tier scalar behavior ─────────────────────────────────────────────────────
test('tier: luxury vs mass drive scale_ratio + density', () => {
  const lux = computeDefaults({ strategy: { creative_direction: { premium_tier: 'luxury', premium_score: 80 } } })
  const mass = computeDefaults({ strategy: { creative_direction: { premium_tier: 'mass', premium_score: 10 } } })
  assert.equal(lux.seeds.typography.scale_ratio.value, 1.414)
  assert.equal(lux.seeds.spacing.density.value, 'airy')
  assert.equal(mass.seeds.typography.scale_ratio.value, 1.2)
  assert.equal(mass.seeds.spacing.density.value, 'balanced')
})

test('tier: near-boundary premium_score lowers tier signal confidence', () => {
  const sig = normalizeSignals({ strategy: { creative_direction: { premium_tier: 'luxury', premium_score: 88 } } })
  assert.equal(sig.tier.confidence, 0.6) // 88 is within 5 of the 87.5 luxury/ultra midpoint
  const clean = normalizeSignals({ strategy: { creative_direction: { premium_tier: 'luxury', premium_score: 80 } } })
  assert.equal(clean.tier.confidence, 1)
})

// ── enum-owner (ornamentation) ───────────────────────────────────────────────
test('enum-owner: Stage 3 ornamentation wins over tier/archetype', () => {
  const r = computeDefaults({
    strategy: { creative_direction: { premium_tier: 'luxury', premium_score: 80, archetype_primary: 'Jester' } },
    director: { design_philosophy: { ornamentation: 'restrained' } },
  })
  assert.equal(r.seeds.component.ornamentation.value, 'restrained')
  assert.deepEqual(r.seeds.component.ornamentation.sources, ['stage3'])
})

test('enum-owner: conflict flagged when a lower layer disagrees strongly', () => {
  // luxury (tier→restrained) + Outlaw (archetype→expressive), no Stage 3 → tier owns, conflicted
  const r = computeDefaults({ strategy: { creative_direction: { premium_tier: 'luxury', premium_score: 80, archetype_primary: 'Outlaw' } } })
  assert.equal(r.seeds.component.ornamentation.value, 'restrained')
  assert.equal(r.seeds.component.ornamentation.conflicted, true)
  assert.ok(r.meta.conflicts.some(c => c.param === 'component.ornamentation'))
})

// ── Scalar conflict is directional ───────────────────────────────────────────
test('scalar: same-direction deltas are agreement (not conflicted)', () => {
  const r = computeDefaults(F1) // Lover/Sage/intimacy all pull motion DOWN, agreeing with luxury
  assert.equal(r.seeds.motion.intensity_score.conflicted, false)
})

test('scalar: deltas opposing the tier intent are conflicted', () => {
  // luxury tier wants LOW motion; Outlaw (aggressive) pushes it UP → conflict
  const r = computeDefaults({ strategy: { creative_direction: { premium_tier: 'luxury', premium_score: 80, archetype_primary: 'Outlaw' }, emotional_objectives: { primary_emotion: 'dramatic', evoke: ['dramatic'] } } })
  assert.equal(r.seeds.motion.intensity_score.conflicted, true)
})

// ── Emotion veto ─────────────────────────────────────────────────────────────
test('veto: avoiding "loud" suppresses energy contributions', () => {
  const mk = avoid => ({ strategy: { creative_direction: { premium_tier: 'mid', premium_score: 30, archetype_primary: 'Everyman' }, emotional_objectives: { primary_emotion: 'energetic', evoke: ['exciting', 'dynamic'], avoid } } })
  const noVeto = computeDefaults(mk([]))
  const veto = computeDefaults(mk(['loud']))
  assert.ok(veto.seeds.motion.intensity_score.value < noVeto.seeds.motion.intensity_score.value)
  assert.equal(noVeto.seeds.interaction.feedback_language.value, 'lively')
  assert.equal(veto.seeds.interaction.feedback_language.value, 'crisp')
})

// ── Constraint floors ────────────────────────────────────────────────────────
test('floors: contrast_floor upgrades to AAA under a trust brief, never below AA', () => {
  const trust = computeDefaults({ strategy: { creative_direction: { premium_tier: 'mid', premium_score: 30 }, emotional_objectives: { primary_emotion: 'professional', evoke: ['trust', 'reliable'] } } })
  assert.equal(trust.seeds.accessibility.contrast_floor.value, 'WCAG AAA')
  const plain = computeDefaults({ strategy: { creative_direction: { premium_tier: 'mid', premium_score: 30 } } })
  assert.equal(plain.seeds.accessibility.contrast_floor.value, 'WCAG AA')
})

test('floors: an operator override cannot LOWER a constraint floor', () => {
  const r = computeDefaults({ strategy: { creative_direction: { premium_tier: 'mid', premium_score: 30 } }, overrides: { 'accessibility.min_body_px': 12, 'mobile.type_floor_px': 10 } })
  assert.equal(r.seeds.accessibility.min_body_px.value, 16) // override ignored
  assert.equal(r.seeds.mobile.type_floor_px.value, 16)
})

// ── Operator overrides (non-floor params) ────────────────────────────────────
test('override: operator hard-wins a non-constraint param with confidence 1', () => {
  const r = computeDefaults({ strategy: { creative_direction: { premium_tier: 'mid', premium_score: 30 } }, overrides: { 'spacing.density': 'palatial' } })
  assert.equal(r.seeds.spacing.density.value, 'palatial')
  assert.equal(r.seeds.spacing.density.confidence, 1)
  assert.deepEqual(r.seeds.spacing.density.sources, ['operator'])
})

// ── Extensibility / graceful degradation ─────────────────────────────────────
test('extensibility: unknown archetype degrades to neutral (no throw, sensible output)', () => {
  const r = computeDefaults({ strategy: { creative_direction: { premium_tier: 'premium', premium_score: 55, archetype_primary: 'Trickster-Sage' } } })
  assert.ok(r.seeds.typography.type_personality.value) // still produces a value
  assert.equal(r.meta.overall_confidence > 0, true)
})

test('extensibility: unknown emotion terms are ignored, not fatal', () => {
  const r = computeDefaults({ strategy: { creative_direction: { premium_tier: 'mid', premium_score: 30 }, emotional_objectives: { primary_emotion: 'zorptastic', evoke: ['flibbertigibbet'] } } })
  assert.deepEqual(normalizeSignals({ strategy: { emotional_objectives: { primary_emotion: 'zorptastic' } } }).qualities, [])
  assert.ok(r.seeds.imagery.grade.value) // still complete
})

// ── Derived: motion.intensity buckets ────────────────────────────────────────
test('derived: motion.intensity maps score → subtle/medium/bold', () => {
  const sub = computeDefaults({ strategy: { creative_direction: { premium_tier: 'ultra', premium_score: 95 } } })
  assert.equal(sub.seeds.motion.intensity.value, 'subtle') // score 15
  const bold = computeDefaults({ strategy: { creative_direction: { premium_tier: 'mass', premium_score: 10 }, emotional_objectives: { primary_emotion: 'energetic', evoke: ['exciting', 'dynamic'] } } })
  assert.ok(['medium', 'bold'].includes(bold.seeds.motion.intensity.value))
})

// ── explainDefaults debug helper ─────────────────────────────────────────────
test('explainDefaults returns a per-param contribution breakdown', () => {
  const ex = explainDefaults(F1)
  assert.ok(Array.isArray(ex['spacing.density']))
  assert.ok(ex['spacing.density'].some(c => c.source === 'tier'))
})

// ── Sanity on tables ─────────────────────────────────────────────────────────
test('tables: every Jung archetype and every tier is present', () => {
  assert.equal(Object.keys(ARCHETYPE_TABLE).length, 12)
  assert.deepEqual(Object.keys(TIER_TABLE), ['mass', 'mid', 'premium', 'luxury', 'ultra'])
})
