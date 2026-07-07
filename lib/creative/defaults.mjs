// Creative Intelligence Layer — deterministic Defaults Engine.
//
// Implements docs/CIL_DEFAULTS_ENGINE.md. Turns the governing dials decided by
// Stages 2-3 (premium tier, archetype, emotional objectives, brand palette,
// Creative Director concept) into a complete set of SEED design parameters that
// Stage 4 (Blueprint) will refine rather than invent.
//
// PURE + DETERMINISTIC: no model calls, no I/O, no Date/random. Same signals ->
// same seeds, byte-for-byte. Never throws; always returns a complete seed set.
// Not connected to any stage yet.
//
// Node-testable exactly like schema-core.mjs.

export const DEFAULTS_VERSION = 'defaults@1.0.0'

// ── Precedence (voting weight + authority order) ─────────────────────────────
export const PRECEDENCE = Object.freeze({
  operator: 1000, stage3: 100, tier: 50, archetype: 30, emotion: 25, industry: 15, base: 5,
})

// ── Tier table (ordered) ─────────────────────────────────────────────────────
const TIER_ORDER = ['mass', 'mid', 'premium', 'luxury', 'ultra']
const TIER_CENTER = { mass: 10, mid: 30, premium: 55, luxury: 80, ultra: 95 }
export const TIER_TABLE = Object.freeze({
  mass:    { density: 'balanced', section_rhythm: 56,  scale_ratio: 1.20,  body_px: 16, motion_intensity_score: 58, ornamentation: 'restrained', gradient_policy: 'subtle', radius_language: 'soft',  shadow_depth: 'low',      real_bias: 'balanced' },
  mid:     { density: 'balanced', section_rhythm: 72,  scale_ratio: 1.25,  body_px: 16, motion_intensity_score: 50, ornamentation: 'restrained', gradient_policy: 'subtle', radius_language: 'soft',  shadow_depth: 'medium',   real_bias: 'balanced' },
  premium: { density: 'airy',     section_rhythm: 104, scale_ratio: 1.333, body_px: 17, motion_intensity_score: 35, ornamentation: 'restrained', gradient_policy: 'subtle', radius_language: 'soft',  shadow_depth: 'layered',  real_bias: 'prefer_real' },
  luxury:  { density: 'airy',     section_rhythm: 128, scale_ratio: 1.414, body_px: 17, motion_intensity_score: 25, ornamentation: 'restrained', gradient_policy: 'subtle', radius_language: 'soft',  shadow_depth: 'refined',  real_bias: 'prefer_real' },
  ultra:   { density: 'palatial', section_rhythm: 160, scale_ratio: 1.50,  body_px: 18, motion_intensity_score: 15, ornamentation: 'none',       gradient_policy: 'none',   radius_language: 'sharp', shadow_depth: 'hairline', real_bias: 'prefer_real' },
})
const INTERP_PARAMS = { section_rhythm: 'section_rhythm', scale_ratio: 'scale_ratio', body_px: 'body_px', motion_intensity_score: 'motion_intensity_score' }

// ── Archetype table (Jung 12 + neutral fallback) ─────────────────────────────
const NEUTRAL_ARCHETYPE = { type_personality: 'sans', ornament_bias: 'restrained', radius_bias: 'soft', motion_flavor: 'subtle', color_temp: 'neutral', layout_bias: 'balanced' }
export const ARCHETYPE_TABLE = Object.freeze({
  Innocent:  { type_personality: 'sans',    ornament_bias: 'restrained', radius_bias: 'pill',  motion_flavor: 'gentle',     color_temp: 'warm',    layout_bias: 'symmetric' },
  Sage:      { type_personality: 'serif',   ornament_bias: 'restrained', radius_bias: 'sharp', motion_flavor: 'minimal',    color_temp: 'cool',    layout_bias: 'grid' },
  Explorer:  { type_personality: 'sans',    ornament_bias: 'restrained', radius_bias: 'soft',  motion_flavor: 'kinetic',    color_temp: 'earthy',  layout_bias: 'asymmetric' },
  Outlaw:    { type_personality: 'display', ornament_bias: 'expressive', radius_bias: 'sharp', motion_flavor: 'aggressive', color_temp: 'dark',    layout_bias: 'broken' },
  Magician:  { type_personality: 'display', ornament_bias: 'expressive', radius_bias: 'soft',  motion_flavor: 'drift',      color_temp: 'deep',    layout_bias: 'layered' },
  Hero:      { type_personality: 'sans',    ornament_bias: 'restrained', radius_bias: 'sharp', motion_flavor: 'energetic',  color_temp: 'bold',    layout_bias: 'focal' },
  Lover:     { type_personality: 'serif',   ornament_bias: 'restrained', radius_bias: 'soft',  motion_flavor: 'gentle',     color_temp: 'warm',    layout_bias: 'asymmetric' },
  Jester:    { type_personality: 'display', ornament_bias: 'expressive', radius_bias: 'pill',  motion_flavor: 'bouncy',     color_temp: 'bright',  layout_bias: 'playful' },
  Everyman:  { type_personality: 'sans',    ornament_bias: 'restrained', radius_bias: 'soft',  motion_flavor: 'subtle',     color_temp: 'neutral', layout_bias: 'grid' },
  Caregiver: { type_personality: 'sans',    ornament_bias: 'restrained', radius_bias: 'pill',  motion_flavor: 'gentle',     color_temp: 'warm',    layout_bias: 'symmetric' },
  Ruler:     { type_personality: 'serif',   ornament_bias: 'restrained', radius_bias: 'sharp', motion_flavor: 'minimal',    color_temp: 'deep',    layout_bias: 'symmetric' },
  Creator:   { type_personality: 'mixed',   ornament_bias: 'expressive', radius_bias: 'soft',  motion_flavor: 'kinetic',    color_temp: 'vivid',   layout_bias: 'broken' },
})
const MOTION_FLAVOR_DELTA = { minimal: -12, subtle: -6, gentle: -4, drift: 0, kinetic: 8, energetic: 14, bouncy: 12, aggressive: 20 }
const COLOR_TEMP_GRADE = { warm: 'amber-warm', cool: 'cool-clean', earthy: 'muted-film', dark: 'deep-moody', deep: 'deep-moody', bold: 'bright', bright: 'bright', vivid: 'bright', neutral: 'neutral' }
const LAYOUT_ASYMMETRY = { symmetric: 'none', grid: 'subtle', asymmetric: 'bold', broken: 'bold', focal: 'subtle', layered: 'bold', playful: 'bold', balanced: 'subtle' }

// ── Emotion → affect quality map ─────────────────────────────────────────────
export const EMOTION_QUALITY_MAP = Object.freeze({
  warmth: ['warm', 'cozy', 'inviting', 'welcoming', 'friendly'],
  energy: ['exciting', 'energetic', 'bold', 'dynamic', 'alive', 'vibrant', 'loud', 'busy', 'flashy'],
  calm: ['calm', 'serene', 'quiet', 'peaceful', 'soothing', 'still'],
  drama: ['dramatic', 'moody', 'cinematic', 'intense'],
  playfulness: ['fun', 'playful', 'whimsical', 'cheerful', 'quirky'],
  trust: ['trust', 'reliable', 'credible', 'professional', 'secure', 'trusted'],
  luxury: ['premium', 'refined', 'elegant', 'luxurious', 'sophisticated', 'exclusive'],
  intimacy: ['romantic', 'intimate', 'sensual', 'tender'],
  nostalgia: ['nostalgic', 'timeless', 'heritage', 'classic', 'vintage'],
  freshness: ['fresh', 'clean', 'crisp', 'light', 'airy'],
})

// Quality -> contributions. Each: { param, value, kind } (kind: 'enum'|'delta').
export const QUALITY_TABLE = Object.freeze({
  warmth: [{ param: 'imagery.grade', value: 'amber-warm', kind: 'enum' }, { param: 'component.radius_language', value: 'soft', kind: 'enum' }, { param: 'interaction.feedback_language', value: 'gentle', kind: 'enum' }],
  energy: [{ param: 'motion.intensity_score', value: 15, kind: 'delta' }, { param: 'color.gradient_policy', value: 'expressive', kind: 'enum' }, { param: 'spacing.grid_asymmetry', value: 'bold', kind: 'enum' }, { param: 'interaction.feedback_language', value: 'lively', kind: 'enum' }, { param: 'imagery.grade', value: 'bright', kind: 'enum' }],
  calm: [{ param: 'motion.intensity_score', value: -15, kind: 'delta' }, { param: 'spacing.density', value: 'airy', kind: 'enum' }, { param: 'color.gradient_policy', value: 'subtle', kind: 'enum' }, { param: 'accessibility.contrast_floor', value: 'WCAG AAA', kind: 'enum' }, { param: 'interaction.feedback_language', value: 'gentle', kind: 'enum' }],
  drama: [{ param: 'color.dark_surface_policy', value: 'hero-allowed', kind: 'enum' }, { param: 'imagery.lighting', value: 'low-key', kind: 'enum' }, { param: 'imagery.grade', value: 'deep-moody', kind: 'enum' }, { param: 'motion.intensity_score', value: 5, kind: 'delta' }],
  playfulness: [{ param: 'component.radius_language', value: 'pill', kind: 'enum' }, { param: 'component.ornamentation', value: 'expressive', kind: 'enum' }, { param: 'imagery.grade', value: 'bright', kind: 'enum' }, { param: 'interaction.feedback_language', value: 'lively', kind: 'enum' }],
  trust: [{ param: 'accessibility.contrast_floor', value: 'WCAG AAA', kind: 'enum' }, { param: 'component.ornamentation', value: 'restrained', kind: 'enum' }, { param: 'motion.intensity_score', value: -10, kind: 'delta' }, { param: 'imagery.grade', value: 'cool-clean', kind: 'enum' }, { param: 'spacing.grid_asymmetry', value: 'subtle', kind: 'enum' }],
  luxury: [{ param: 'spacing.density', value: 'airy', kind: 'enum' }, { param: 'component.ornamentation', value: 'restrained', kind: 'enum' }, { param: 'motion.intensity_score', value: -10, kind: 'delta' }, { param: 'color.gradient_policy', value: 'subtle', kind: 'enum' }, { param: 'imagery.real_vs_generated_bias', value: 'prefer_real', kind: 'enum' }],
  intimacy: [{ param: 'imagery.grade', value: 'amber-warm', kind: 'enum' }, { param: 'imagery.lighting', value: 'soft', kind: 'enum' }, { param: 'component.radius_language', value: 'soft', kind: 'enum' }, { param: 'spacing.grid_asymmetry', value: 'subtle', kind: 'enum' }, { param: 'motion.intensity_score', value: -5, kind: 'delta' }],
  nostalgia: [{ param: 'imagery.grade', value: 'muted-film', kind: 'enum' }, { param: 'typography.type_personality', value: 'serif', kind: 'enum' }],
  freshness: [{ param: 'imagery.grade', value: 'cool-clean', kind: 'enum' }, { param: 'spacing.density', value: 'airy', kind: 'enum' }, { param: 'component.radius_language', value: 'soft', kind: 'enum' }],
})

// ── Industry advisory table (weight 15) ──────────────────────────────────────
export const INDUSTRY_TABLE = Object.freeze([
  { match: ['restaurant', 'cafe', 'food', 'dining', 'bakery', 'coffee'], contributions: [{ param: 'imagery.real_vs_generated_bias', value: 'prefer_real', kind: 'enum' }, { param: 'imagery.grade', value: 'amber-warm', kind: 'enum' }] },
  { match: ['law', 'legal', 'attorney', 'finance', 'accounting', 'insurance', 'bank'], contributions: [{ param: 'accessibility.contrast_floor', value: 'WCAG AAA', kind: 'enum' }, { param: 'component.ornamentation', value: 'restrained', kind: 'enum' }, { param: 'component.radius_language', value: 'sharp', kind: 'enum' }] },
  { match: ['gym', 'fitness', 'crossfit', 'sport', 'training'], contributions: [{ param: 'motion.intensity_score', value: 15, kind: 'delta' }, { param: 'spacing.grid_asymmetry', value: 'bold', kind: 'enum' }] },
  { match: ['salon', 'spa', 'beauty', 'wellness', 'aesthetic'], contributions: [{ param: 'component.ornamentation', value: 'restrained', kind: 'enum' }, { param: 'imagery.grade', value: 'amber-warm', kind: 'enum' }] },
  { match: ['tech', 'saas', 'software', 'app', 'startup', 'ai'], contributions: [{ param: 'typography.type_personality', value: 'sans', kind: 'enum' }, { param: 'color.gradient_policy', value: 'expressive', kind: 'enum' }] },
  { match: ['kids', 'childcare', 'daycare', 'preschool', 'children'], contributions: [{ param: 'component.radius_language', value: 'pill', kind: 'enum' }, { param: 'imagery.grade', value: 'bright', kind: 'enum' }] },
  { match: ['jewelry', 'luxury', 'real estate', 'realtor', 'boutique'], contributions: [{ param: 'imagery.real_vs_generated_bias', value: 'prefer_real', kind: 'enum' }, { param: 'component.ornamentation', value: 'restrained', kind: 'enum' }] },
])

// ── Base defaults + constraint floors ────────────────────────────────────────
const CONTRAST_RANK = { 'WCAG AA': 0, 'WCAG AAA': 1 }
const BASE = Object.freeze({
  'spacing.base_unit': 8,
  'spacing.density': 'balanced',
  'spacing.section_rhythm': 72,
  'spacing.grid_asymmetry': 'subtle',
  'typography.scale_ratio': 1.25,
  'typography.body_px': 16,
  'typography.type_personality': 'sans',
  'color.gradient_policy': 'subtle',
  'color.dark_surface_policy': 'restricted',
  'color.accent_reservation': 'CTA and small emphasis only',
  'motion.intensity_score': 50,
  'motion.reduced_motion_policy': 'disable ambient keyframes on prefers-reduced-motion',
  'motion.micro_interactions_allowed': ['hover lift', 'nav underline', 'image scale 1.03'],
  'imagery.grade': 'neutral',
  'imagery.lighting': 'natural',
  'imagery.real_vs_generated_bias': 'balanced',
  'imagery.crop_language': 'standard',
  'component.ornamentation': 'restrained',
  'component.radius_language': 'soft',
  'component.button_style': 'solid-weighty',
  'component.iconography': 'line',
  'component.shadow_depth': 'low',
  'interaction.hover_behavior': 'lift',
  'interaction.feedback_language': 'crisp',
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
})

// ── Param registry (resolution strategy per parameter) ───────────────────────
// strategy: 'const' | 'floor-up' | 'scalar' | 'enum-owner' | 'enum-vote' | 'set' | 'derived'
const ORD_DENSITY = ['tight', 'balanced', 'airy', 'palatial']
export const PARAM_REGISTRY = Object.freeze([
  { key: 'color.role_map', group: 'color', strategy: 'derived' },
  { key: 'typography.scale_ratio', group: 'typography', strategy: 'scalar', owner: 'tier', range: [1.15, 1.6], round: 3 },
  { key: 'typography.body_px', group: 'typography', strategy: 'scalar', owner: 'tier', range: [16, 20], round: 0 },
  { key: 'typography.type_personality', group: 'typography', strategy: 'enum-vote' },
  { key: 'spacing.base_unit', group: 'spacing', strategy: 'const' },
  { key: 'spacing.density', group: 'spacing', strategy: 'enum-vote', ordered: ORD_DENSITY },
  { key: 'spacing.section_rhythm', group: 'spacing', strategy: 'scalar', owner: 'tier', range: [40, 200], round: 0 },
  { key: 'spacing.grid_asymmetry', group: 'spacing', strategy: 'enum-vote', ordered: ['none', 'subtle', 'bold'] },
  { key: 'color.gradient_policy', group: 'color', strategy: 'enum-vote', ordered: ['none', 'subtle', 'expressive'] },
  { key: 'color.dark_surface_policy', group: 'color', strategy: 'enum-vote', ordered: ['restricted', 'hero-allowed', 'freely-allowed'] },
  { key: 'color.accent_reservation', group: 'color', strategy: 'const' },
  { key: 'motion.intensity_score', group: 'motion', strategy: 'scalar', owner: 'tier', modifiers: true, range: [0, 100], round: 0 },
  { key: 'motion.intensity', group: 'motion', strategy: 'derived' },
  { key: 'motion.reduced_motion_policy', group: 'motion', strategy: 'const' },
  { key: 'motion.micro_interactions_allowed', group: 'motion', strategy: 'set' },
  { key: 'imagery.grade', group: 'imagery', strategy: 'enum-vote' },
  { key: 'imagery.lighting', group: 'imagery', strategy: 'enum-vote' },
  { key: 'imagery.real_vs_generated_bias', group: 'imagery', strategy: 'enum-owner', fallbackOrder: ['operator', 'stage3', 'tier', 'industry', 'emotion'] },
  { key: 'imagery.crop_language', group: 'imagery', strategy: 'enum-vote' },
  { key: 'component.ornamentation', group: 'component', strategy: 'enum-owner', fallbackOrder: ['operator', 'stage3', 'tier', 'archetype', 'emotion', 'industry'] },
  { key: 'component.radius_language', group: 'component', strategy: 'enum-vote' },
  { key: 'component.button_style', group: 'component', strategy: 'const' },
  { key: 'component.iconography', group: 'component', strategy: 'enum-vote' },
  { key: 'component.shadow_depth', group: 'component', strategy: 'enum-vote' },
  { key: 'interaction.hover_behavior', group: 'interaction', strategy: 'const' },
  { key: 'interaction.feedback_language', group: 'interaction', strategy: 'enum-vote' },
  { key: 'interaction.nav_behavior', group: 'interaction', strategy: 'const' },
  { key: 'layout.rhythm_pattern', group: 'layout', strategy: 'const' },
  { key: 'mobile.base_viewport_px', group: 'mobile', strategy: 'const' },
  { key: 'mobile.type_floor_px', group: 'mobile', strategy: 'floor-up', rank: n => n },
  { key: 'mobile.edge_to_edge', group: 'mobile', strategy: 'const' },
  { key: 'mobile.breakpoints', group: 'mobile', strategy: 'const' },
  { key: 'accessibility.contrast_floor', group: 'accessibility', strategy: 'floor-up', rank: v => CONTRAST_RANK[v] ?? 0 },
  { key: 'accessibility.min_body_px', group: 'accessibility', strategy: 'floor-up', rank: n => n },
  { key: 'accessibility.tap_target_min_px', group: 'accessibility', strategy: 'floor-up', rank: n => n },
  { key: 'accessibility.motion_safety', group: 'accessibility', strategy: 'const' },
])

// ── Color utilities (deterministic) ──────────────────────────────────────────
function hexToRgb(hex) {
  let h = String(hex || '').trim().replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}
function toHex({ r, g, b }) {
  const h = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}
function relLuminance({ r, g, b }) {
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
function saturation({ r, g, b }) {
  const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255
  const l = (mx + mn) / 2
  if (mx === mn) return 0
  return l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn)
}
function contrastRatio(l1, l2) { const a = Math.max(l1, l2), b = Math.min(l1, l2); return (a + 0.05) / (b + 0.05) }
function mixHex(a, b, t) {
  const ra = hexToRgb(a), rb = hexToRgb(b)
  if (!ra || !rb) return a
  return toHex({ r: ra.r + (rb.r - ra.r) * t, g: ra.g + (rb.g - ra.g) * t, b: ra.b + (rb.b - ra.b) * t })
}
const NEAR_BLACK = '#111214'
const WHITE = '#ffffff'

export function derivePaletteRoles(palette) {
  const list = (Array.isArray(palette) ? palette : [])
    .map(hex => ({ hex, rgb: hexToRgb(hex) }))
    .filter(c => c.rgb)
    .map(c => ({
      hex: c.hex, lum: relLuminance(c.rgb), sat: saturation(c.rgb),
      chroma: (Math.max(c.rgb.r, c.rgb.g, c.rgb.b) - Math.min(c.rgb.r, c.rgb.g, c.rgb.b)) / 255,
    }))

  const perRole = {}
  // page background — lightest color if light enough, else white.
  const lightest = [...list].sort((a, b) => b.lum - a.lum)[0]
  const page_bg = lightest && lightest.lum >= 0.7 ? lightest.hex : WHITE
  perRole.page_bg = lightest && lightest.lum >= 0.7 ? 1 : 0.6
  // ink — darkest color if dark enough, else near-black.
  const darkest = [...list].sort((a, b) => a.lum - b.lum)[0]
  let ink = darkest && darkest.lum <= 0.25 ? darkest.hex : NEAR_BLACK
  perRole.ink = darkest && darkest.lum <= 0.25 ? 1 : 0.7
  // cta — the strongest CHROMATIC color that is neither the bg nor the ink.
  // Score favors vivid + darker colors (a CTA must hold contrast), so a dark
  // saturated brand color beats a light pastel background tint.
  const cand = list.filter(c => c.hex !== page_bg && c.hex !== ink && c.chroma > 0.12)
    .map(c => ({ ...c, ctaScore: c.chroma * (1 - c.lum) }))
    .sort((a, b) => b.ctaScore - a.ctaScore)
  const cta = cand[0] ? cand[0].hex : ink
  perRole.cta = cand[0] ? 1 : 0.5
  // accent — next most chromatic color, distinct from cta.
  const accCand = cand.filter(c => c.hex !== cta).sort((a, b) => b.chroma - a.chroma)
  const accent = accCand[0] ? accCand[0].hex : mixHex(cta, page_bg, 0.45)
  perRole.accent = accCand[0] ? 1 : 0.5
  // Contrast guarantee (before deriving tints from ink).
  if (contrastRatio(relLuminance(hexToRgb(ink)), relLuminance(hexToRgb(page_bg))) < 4.5) {
    ink = NEAR_BLACK; perRole.ink = Math.min(perRole.ink, 0.8)
  }
  const alt_bg = mixHex(page_bg, ink, 0.05)
  const muted = mixHex(ink, page_bg, 0.45)
  const role_map = { page_bg, alt_bg, ink, muted, cta, accent }
  const confidence = round2(Object.values(perRole).reduce((s, v) => s + v, 0) / Object.values(perRole).length)
  return { role_map, perRoleConfidence: perRole, confidence }
}

// ── Numeric helpers ──────────────────────────────────────────────────────────
function round2(x) { return Math.round(x * 100) / 100 }
function roundTo(x, n) { const f = Math.pow(10, n); return Math.round(x * f) / f }
function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)) }
function lerp(a, b, t) { return a + (b - a) * t }

// Interpolate an interp param across tier centers by premium score.
function interpTier(param, score) {
  const s = clamp(Number.isFinite(score) ? score : TIER_CENTER.mid, 0, 100)
  for (let i = 0; i < TIER_ORDER.length - 1; i++) {
    const lo = TIER_ORDER[i], hi = TIER_ORDER[i + 1]
    const cl = TIER_CENTER[lo], ch = TIER_CENTER[hi]
    if (s <= cl) return TIER_TABLE[lo][param]
    if (s <= ch) { const t = (s - cl) / (ch - cl); return lerp(TIER_TABLE[lo][param], TIER_TABLE[hi][param], t) }
  }
  return TIER_TABLE[TIER_ORDER[TIER_ORDER.length - 1]][param]
}

// ── Signal normalization ─────────────────────────────────────────────────────
export function normalizeSignals(raw = {}) {
  const strategy = raw.strategy || {}
  const director = raw.director || {}
  const cd = strategy.creative_direction || {}
  const eo = strategy.emotional_objectives || {}

  const tierValue = TIER_ORDER.includes(cd.premium_tier) ? cd.premium_tier : 'mid'
  const score = Number.isFinite(cd.premium_score) ? cd.premium_score : TIER_CENTER[tierValue]
  // Tier confidence drops near a band boundary (midpoints between centers).
  const boundaries = [20, 42.5, 67.5, 87.5]
  const nearBoundary = boundaries.some(b => Math.abs(score - b) < 5)
  const tierConfidence = nearBoundary ? 0.6 : 1.0

  const archetypes = []
  if (cd.archetype_primary) archetypes.push({ name: cd.archetype_primary, weight: 1.0 })
  if (cd.archetype_secondary) archetypes.push({ name: cd.archetype_secondary, weight: 0.5 })

  // Emotions -> qualities (tallied) and avoid -> vetoed qualities.
  const emotionTerms = [eo.primary_emotion, eo.secondary_emotion, eo.north_star_feeling, ...(Array.isArray(eo.evoke) ? eo.evoke : [])]
  const qCounts = tallyQualities(emotionTerms)
  const qualities = Object.entries(qCounts).map(([name, count]) => ({ name, weight: Math.min(1, count / 2) }))
  const avoidQualities = Object.keys(tallyQualities(Array.isArray(eo.avoid) ? eo.avoid : []))

  const stage3 = {}
  const orn = director?.design_philosophy?.ornamentation
  if (orn) stage3['component.ornamentation'] = orn
  const bias = director?.imagery_concept?.real_vs_generated_bias
  if (bias) stage3['imagery.real_vs_generated_bias'] = bias

  const overrides = (raw.overrides && typeof raw.overrides === 'object') ? raw.overrides : {}
  const industry = typeof raw.industry === 'string' ? raw.industry.toLowerCase() : null

  return {
    tier: { value: tierValue, score, confidence: tierConfidence },
    archetypes, qualities, avoid: avoidQualities,
    palette: Array.isArray(raw.palette) ? raw.palette : [],
    industry, stage3, overrides,
  }
}

function tallyQualities(terms) {
  const counts = {}
  for (const term of (terms || [])) {
    const t = String(term || '').toLowerCase()
    if (!t) continue
    for (const [quality, keywords] of Object.entries(EMOTION_QUALITY_MAP)) {
      if (keywords.some(k => t.includes(k))) counts[quality] = (counts[quality] || 0) + 1
    }
  }
  return counts
}

// ── Contribution gathering ───────────────────────────────────────────────────
function gatherContributions(sig) {
  const out = [] // {param, value, kind, weight, source, quality?}
  const push = (param, value, kind, weight, source, quality) => out.push({ param, value, kind, weight, source, quality })

  // base
  for (const [param, value] of Object.entries(BASE)) push(param, value, 'const', PRECEDENCE.base, 'base')

  // tier (enum + scalar-owner via interp)
  const trow = TIER_TABLE[sig.tier.value]
  const tw = PRECEDENCE.tier * sig.tier.confidence
  push('spacing.density', trow.density, 'enum', tw, 'tier')
  push('component.ornamentation', trow.ornamentation, 'enum', tw, 'tier')
  push('color.gradient_policy', trow.gradient_policy, 'enum', tw, 'tier')
  push('component.radius_language', trow.radius_language, 'enum', tw, 'tier')
  push('component.shadow_depth', trow.shadow_depth, 'enum', tw, 'tier')
  push('imagery.real_vs_generated_bias', trow.real_bias, 'enum', tw, 'tier')
  push('typography.scale_ratio', roundTo(interpTier('scale_ratio', sig.tier.score), 3), 'scalar', tw, 'tier')
  push('typography.body_px', Math.round(interpTier('body_px', sig.tier.score)), 'scalar', tw, 'tier')
  push('spacing.section_rhythm', Math.round(interpTier('section_rhythm', sig.tier.score)), 'scalar', tw, 'tier')
  push('motion.intensity_score', Math.round(interpTier('motion_intensity_score', sig.tier.score)), 'scalar', tw, 'tier')

  // archetype (primary + secondary)
  for (const a of sig.archetypes) {
    const row = ARCHETYPE_TABLE[a.name] || NEUTRAL_ARCHETYPE
    const w = PRECEDENCE.archetype * a.weight
    push('typography.type_personality', row.type_personality, 'enum', w, 'archetype')
    push('component.ornamentation', row.ornament_bias, 'enum', w, 'archetype')
    push('component.radius_language', row.radius_bias, 'enum', w, 'archetype')
    push('motion.intensity_score', MOTION_FLAVOR_DELTA[row.motion_flavor] ?? 0, 'delta', w, 'archetype')
    push('imagery.grade', COLOR_TEMP_GRADE[row.color_temp] || 'neutral', 'enum', w, 'archetype')
    push('spacing.grid_asymmetry', LAYOUT_ASYMMETRY[row.layout_bias] || 'subtle', 'enum', w, 'archetype')
    if (row.motion_flavor === 'bouncy') push('motion.micro_interactions_allowed', 'bouncy hover', 'set', w, 'archetype', 'playfulness')
  }

  // emotion qualities
  for (const q of sig.qualities) {
    const contribs = QUALITY_TABLE[q.name] || []
    const w = PRECEDENCE.emotion * q.weight
    for (const c of contribs) push(c.param, c.value, c.kind === 'delta' ? 'delta' : (c.param === 'motion.micro_interactions_allowed' ? 'set' : 'enum'), w, 'emotion', q.name)
  }

  // industry
  if (sig.industry) {
    const row = INDUSTRY_TABLE.find(r => r.match.some(k => sig.industry.includes(k)))
    if (row) for (const c of row.contributions) push(c.param, c.value, c.kind === 'delta' ? 'delta' : 'enum', PRECEDENCE.industry, 'industry')
  }

  // stage3 explicit
  for (const [param, value] of Object.entries(sig.stage3)) push(param, value, 'enum', PRECEDENCE.stage3, 'stage3')

  // operator overrides
  for (const [param, value] of Object.entries(sig.overrides)) push(param, value, 'override', PRECEDENCE.operator, 'operator')

  // Veto pass: drop emotion-quality contributions whose quality is vetoed.
  const vetoed = new Set(sig.avoid)
  return out.filter(c => !(c.quality && vetoed.has(qualityOf(c)) ))
    // qualityOf handles both emotion-sourced and quality-tagged archetype set items
}
function qualityOf(c) { return c.quality }

// ── Resolution per strategy ──────────────────────────────────────────────────
function resolveConst(param) { return seed(BASE[param], 1, ['base'], 'const') }

function resolveFloorUp(reg, contribs) {
  const rank = reg.rank
  let best = BASE[reg.key]; let bestRank = rank(best); const sources = ['base']
  for (const c of contribs) {
    if (c.source === 'base') continue
    const r = rank(c.value)
    if (r > bestRank) { best = c.value; bestRank = r; if (!sources.includes(c.source)) sources.push(c.source) }
  }
  return seed(best, 1, sources, 'floor-up')
}

function resolveScalar(reg, contribs) {
  const owner = contribs.find(c => c.source === (reg.owner || 'tier') && c.kind === 'scalar')
  const base = owner ? owner.value : (contribs.find(c => c.kind === 'scalar')?.value ?? BASE[reg.key])
  const deltas = reg.modifiers ? contribs.filter(c => c.kind === 'delta') : []
  let val = base
  let applied = 0
  for (const d of deltas) { const eff = d.value * (d.weight / PRECEDENCE.tier); val += eff; applied += eff }
  val = clamp(val, reg.range[0], reg.range[1])
  val = reg.round === 0 ? Math.round(val) : roundTo(val, reg.round)
  const ownerConf = owner ? tierConfOf(contribs) : 0.7
  const range = reg.range[1] - reg.range[0]
  // Conflict is DIRECTIONAL: deltas pulling AGAINST the tier's intent (the tier
  // value's position relative to the scale midpoint). Same-direction deltas
  // reinforce the tier and are agreement, not conflict.
  const tierDir = base < (reg.range[0] + range / 2) ? -1 : base > (reg.range[0] + range / 2) ? 1 : 0
  const deltaDir = applied > 0.5 ? 1 : applied < -0.5 ? -1 : 0
  const conflicted = !!reg.modifiers && tierDir !== 0 && deltaDir !== 0 && tierDir !== deltaDir && Math.abs(applied) > range * 0.1
  const spreadPenalty = reg.modifiers ? clamp(Math.abs(applied) / range, 0, 0.3) : 0
  const conf = round2(clamp(ownerConf - (conflicted ? spreadPenalty : spreadPenalty * 0.4), 0.3, 1))
  const sources = [...new Set([reg.owner || 'tier', ...deltas.map(d => d.source)])]
  return { value: val, confidence: conf, sources, strategy: 'scalar', conflicted }
}
function tierConfOf(contribs) { const t = contribs.find(c => c.source === 'tier'); return t ? (t.weight / PRECEDENCE.tier) : 1 }

function resolveEnumOwner(reg, contribs) {
  const order = reg.fallbackOrder || ['operator', 'stage3', 'tier', 'archetype', 'emotion', 'industry', 'base']
  let owner = null
  for (const layer of order) { owner = contribs.find(c => c.source === layer); if (owner) break }
  if (!owner) return resolveConst(reg.key)
  const disagreeing = contribs.filter(c => c.source !== owner.source && c.source !== 'base' && c.value !== owner.value)
  const disWeight = disagreeing.reduce((s, c) => s + c.weight, 0)
  const conflicted = disWeight >= owner.weight * 0.5
  const conf = round2(conflicted ? clamp((owner.weight / (owner.weight + disWeight)), 0.3, 0.9) : 1)
  const alternatives = dedupeAlts(contribs)
  return { value: owner.value, confidence: conf, sources: [owner.source], strategy: 'enum-owner', conflicted, alternatives }
}

function resolveEnumVote(reg, contribs) {
  const votes = new Map() // value -> {weight, topPrec}
  for (const c of contribs) {
    if (c.kind !== 'enum' && c.kind !== 'const') continue
    const cur = votes.get(c.value) || { weight: 0, topPrec: 0 }
    cur.weight += c.weight
    cur.topPrec = Math.max(cur.topPrec, PRECEDENCE[c.source] || 0)
    votes.set(c.value, cur)
  }
  if (!votes.size) return resolveConst(reg.key)
  const ranked = [...votes.entries()].sort((a, b) => b[1].weight - a[1].weight || b[1].topPrec - a[1].topPrec)
  const [winVal, winInfo] = ranked[0]
  const total = ranked.reduce((s, [, v]) => s + v.weight, 0)
  const runner = ranked[1]
  const conflicted = !!runner && (runner[1].weight / winInfo.weight) > 0.8
  const conf = round2(clamp(winInfo.weight / total, 0.3, 1))
  const sources = contribs.filter(c => c.value === winVal).map(c => c.source)
  return {
    value: winVal, confidence: conf, sources: [...new Set(sources)], strategy: 'enum-vote', conflicted,
    alternatives: ranked.slice(1, 3).map(([value, v]) => ({ value, weight: round2(v.weight) })),
  }
}

function resolveSet(reg, contribs) {
  const base = new Set(BASE[reg.key] || [])
  for (const c of contribs) if (c.kind === 'set' || (c.source === 'base' && Array.isArray(c.value))) {
    if (Array.isArray(c.value)) c.value.forEach(v => base.add(v)); else base.add(c.value)
  }
  return { value: [...base], confidence: 0.9, sources: ['base'], strategy: 'set', conflicted: false }
}

function dedupeAlts(contribs) {
  const m = new Map()
  for (const c of contribs) { if (c.source === 'base') continue; const cur = m.get(c.value) || 0; m.set(c.value, cur + c.weight) }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([value, weight]) => ({ value, weight: round2(weight) }))
}

function seed(value, confidence, sources, strategy) { return { value, confidence: round2(confidence), sources, strategy, conflicted: false } }

// ── Public: computeDefaults ──────────────────────────────────────────────────
export function computeDefaults(raw = {}) {
  const sig = normalizeSignals(raw)
  const contribs = gatherContributions(sig)
  const byParam = new Map()
  for (const c of contribs) { const a = byParam.get(c.param) || []; a.push(c); byParam.set(c.param, a) }

  const seeds = {}
  const palette = derivePaletteRoles(sig.palette)

  for (const reg of PARAM_REGISTRY) {
    const cs = byParam.get(reg.key) || []
    // operator override short-circuit — but NEVER for constraint floors or
    // platform constants (those can only tighten, never be lowered by an override).
    const override = (reg.strategy !== 'const' && reg.strategy !== 'floor-up')
      ? cs.find(c => c.source === 'operator')
      : null
    let s
    if (override) {
      s = { value: override.value, confidence: 1, sources: ['operator'], strategy: 'override', conflicted: false }
    } else if (reg.strategy === 'derived' && reg.key === 'color.role_map') {
      s = { value: palette.role_map, confidence: palette.confidence, sources: ['palette'], strategy: 'derived', conflicted: false, alternatives: palette.perRoleConfidence }
    } else if (reg.strategy === 'derived' && reg.key === 'motion.intensity') {
      const score = seeds['motion']?.intensity_score?.value ?? 50
      const v = score < 30 ? 'subtle' : score < 60 ? 'medium' : 'bold'
      s = { value: v, confidence: seeds['motion']?.intensity_score?.confidence ?? 0.8, sources: ['motion.intensity_score'], strategy: 'derived', conflicted: false }
    } else if (reg.strategy === 'const') {
      s = resolveConst(reg.key)
    } else if (reg.strategy === 'floor-up') {
      s = resolveFloorUp(reg, cs)
    } else if (reg.strategy === 'scalar') {
      s = resolveScalar(reg, cs)
    } else if (reg.strategy === 'enum-owner') {
      s = resolveEnumOwner(reg, cs)
    } else if (reg.strategy === 'enum-vote') {
      s = resolveEnumVote(reg, cs)
    } else if (reg.strategy === 'set') {
      s = resolveSet(reg, cs)
    } else {
      s = resolveConst(reg.key)
    }
    const [group, name] = reg.key.split('.')
    if (!seeds[group]) seeds[group] = {}
    seeds[group][name] = s
  }

  // Global meta.
  const allSeeds = []
  for (const g of Object.values(seeds)) for (const sd of Object.values(g)) allSeeds.push(sd)
  const overall = round2(allSeeds.reduce((s, sd) => s + (sd.confidence || 0), 0) / allSeeds.length)
  const conflicts = []
  for (const [group, gg] of Object.entries(seeds)) for (const [name, sd] of Object.entries(gg)) {
    if (sd.conflicted) conflicts.push({ param: `${group}.${name}`, top: sd.alternatives || [], note: `${sd.strategy} conflict` })
  }

  return {
    version: DEFAULTS_VERSION,
    seeds,
    meta: {
      overall_confidence: overall,
      conflicts,
      signals_used: { tier: sig.tier, archetypes: sig.archetypes, qualities: sig.qualities, avoid: sig.avoid, industry: sig.industry },
    },
  }
}

// Debug helper: full contribution breakdown per parameter.
export function explainDefaults(raw = {}) {
  const sig = normalizeSignals(raw)
  const contribs = gatherContributions(sig)
  const byParam = {}
  for (const c of contribs) { (byParam[c.param] = byParam[c.param] || []).push(c) }
  return byParam
}
