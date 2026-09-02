// Hero EFFECT selection — which advanced treatment the page's hero commits to.
//
// The output contract now allows real JavaScript and WebGL, which removes the
// ceiling on quality but introduces a new failure mode: if the model improvises
// a 3D treatment freely on every build, the same business regenerated lands
// somewhere different and different businesses converge on the same generic
// spinning-object-on-black. That is the exact "a random agent decides how this
// gets built" problem the blueprint engine was written to kill.
//
// So effects are chosen the same proven way blueprints are (see
// sectionFamily.mjs): a small fixed catalogue, scored against this business,
// resolved deterministically per domain, with near-ties broken on a domain hash
// so different businesses diverge while any single business is reproducible.
// Guided mode can force a treatment outright.
//
// Each treatment carries a real parameterized RECIPE, not an adjective. "Make
// it 3D" is what produces slop; "180-260 THREE.Points, size 0.02-0.05, drifting
// on a 40-70s loop, fog matched to the surface color" is what produces a page.
//
// Every recipe is procedural — geometry written in code, no model or texture
// fetches — so the page stays inside the ~1MB budget a pasteable funnel embed
// can carry.

import { stableHash } from './sectionFamily.mjs'

// Roles the recipes reference. Kept deliberately small: a scene that uses three
// brand colors and one ink reads as branded; one that uses six reads as a demo.
function paletteRoles(palette = []) {
  const hexes = (Array.isArray(palette) ? palette : [])
    .map(c => String(c || '').trim())
    .filter(c => /^#[0-9a-f]{3,8}$/i.test(c))
  return {
    primary: hexes[0] || '#2990fa',
    secondary: hexes[1] || '#0a1628',
    surface: hexes[2] || '#ffffff',
    all: hexes.slice(0, 3),
  }
}

// Niches where an animated 3D hero actively hurts credibility. These are
// businesses whose buyers read motion as unserious, or who are legally/
// emotionally sensitive. The catalogue still offers `none`, which is a RICH
// static treatment, never an empty hero.
const GRAVITAS_NICHES = [
  'funeral', 'mortuary', 'cremation', 'hospice', 'estate', 'probate',
  'law', 'lawyer', 'attorney', 'legal', 'bail', 'injury',
  'medical', 'clinic', 'dental', 'dentist', 'surgery', 'doctor', 'physician',
  'therapy', 'counseling', 'psychiatry', 'rehab', 'recovery',
  'accounting', 'accountant', 'tax', 'bookkeeping', 'insurance',
]

export const HERO_EFFECTS = [
  {
    id: 'ambient-particle-depth',
    label: 'Ambient particle depth',
    intensity: 'subtle',
    summary: 'Slow drifting motes with real depth behind the headline — atmosphere, not spectacle.',
    niches: [
      'restaurant', 'cafe', 'coffee', 'bar', 'brewery', 'winery', 'bakery',
      'spa', 'salon', 'wellness', 'yoga', 'massage', 'hotel', 'resort',
      'event', 'wedding', 'venue', 'florist', 'photography', 'boutique',
      'landscaping', 'nursery', 'garden',
    ],
    avoid: [],
    recipe({ colors }) {
      return [
        'AMBIENT PARTICLE DEPTH — a single full-bleed <canvas> layered behind the hero content (canvas at z-index 0, content at z-index 1, both inside the hero).',
        `Build ONE THREE.Points system: 180-260 vertices placed randomly in a box roughly 20 wide x 12 tall x 14 deep, as a BufferGeometry with a Float32Array position attribute. PointsMaterial with sizeAttenuation: true, size 0.02-0.05, transparent: true, opacity 0.35-0.6, depthWrite: false, and color ${colors.primary}.`,
        'Camera: PerspectiveCamera, fov 60, positioned so the field fills the frame with motes both near (large, soft) and far (small, faint) — the depth spread IS the effect.',
        `Scene fog: THREE.FogExp2 tinted to the hero's own background color (${colors.secondary}) with density 0.03-0.06, so far particles dissolve into the surface instead of ending at a hard edge.`,
        'Motion: rotate the whole point cloud on Y at roughly 0.0002-0.0005 rad/frame — one full turn should take 40-70 seconds. Add a gentle per-frame Y drift so motes rise or settle. Nothing pulses, flashes, or reacts fast.',
        'Parallax: lerp the camera 0.02-0.06 units toward the pointer position (and toward scroll offset) with smoothing around 0.05 — a slight, weighted shift, never a 1:1 follow that feels twitchy.',
        `Fallback beneath the canvas: a real layered CSS background — a soft radial-gradient bloom of ${colors.primary} at 12-20% over the ${colors.secondary} surface. With the canvas removed the hero must still look composed and intentional.`,
        'Mobile (<768px): drop to 70-110 particles, disable pointer parallax (keep the slow drift), and cap the pixel ratio at 2.',
      ].join('\n  ')
    },
  },
  {
    id: 'gradient-mesh-flow',
    label: 'Flowing gradient mesh',
    intensity: 'medium',
    summary: 'A slow liquid gradient in the brand colors — modern, premium, zero literal objects.',
    niches: [
      'saas', 'software', 'tech', 'app', 'startup', 'agency', 'marketing',
      'consulting', 'finance', 'fintech', 'crypto', 'design', 'studio',
      'media', 'creative', 'branding', 'digital', 'ai', 'data',
    ],
    avoid: [],
    recipe({ colors }) {
      const [a, b, c] = [colors.primary, colors.secondary, colors.surface]
      return [
        'FLOWING GRADIENT MESH — one full-bleed <canvas> behind the hero content, rendering a single fullscreen PlaneGeometry with a custom ShaderMaterial. No objects, no particles: the whole effect is the shader.',
        'Fragment shader: layer 3-4 octaves of value/simplex noise (write the noise function inline — do not import one) sampled against uv and uTime, and use the result to mix between the brand colors.',
        `Color mix: ${a} -> ${b} -> ${c}, blended smoothly so no hard band ever appears. Stay strictly inside these hues — no rainbow ramps, no hue rotation.`,
        'Uniforms: uTime (advanced ~0.05-0.12 per frame — the surface should visibly move but take 20+ seconds to noticeably change), uResolution, and uMouse if you use pointer influence.',
        'Add a subtle vignette and a very light grain in the shader so the gradient reads as a material rather than a CSS blur.',
        `Fallback beneath the canvas: a static multi-stop linear-gradient using the same three colors at the same proportions, so a failed shader compile or a WebGL-less device still shows the intended composition.`,
        'Mobile (<768px): halve the noise octaves, render at 0.6-0.75 resolution scale upscaled by CSS, and cap pixel ratio at 2.',
      ].join('\n  ')
    },
  },
  {
    id: 'floating-geometry',
    label: 'Floating geometry',
    intensity: 'bold',
    summary: 'Real lit 3D forms orbiting slowly in the brand palette — the most overtly 3D option.',
    niches: [
      'construction', 'contractor', 'builder', 'remodeling', 'roofing',
      'concrete', 'fabrication', 'welding', 'manufacturing', 'industrial',
      'architecture', 'engineering', 'automotive', 'auto', 'detailing',
      'fitness', 'gym', 'crossfit', 'martial', 'sports',
      'hvac', 'plumbing', 'electrical', 'solar', 'flooring',
    ],
    avoid: [],
    recipe({ colors }) {
      return [
        'FLOATING GEOMETRY — one <canvas> behind (or beside, per the blueprint) the hero content, with 3-6 lit primitive forms.',
        'Geometry: build ONLY from Three.js primitives — IcosahedronGeometry, TorusKnotGeometry, BoxGeometry, OctahedronGeometry — at varied scales. Never load an external model.',
        `Material: MeshStandardMaterial with roughness 0.25-0.45 and metalness 0.1-0.6, colored from ${colors.primary} and ${colors.secondary}. Give at most one form a contrasting accent; the rest stay tonal so the cluster reads as one object family.`,
        'Lighting (this is what separates premium from clay): one directional key light at roughly 3-5 units up and to one side with intensity 1.0-1.6, one dimmer fill from the opposite side at 0.3-0.5, and an ambient/hemisphere light at 0.2-0.4 tinted toward the surface color. Never a single flat light.',
        'Motion: each form rotates on its own axis at a different slow rate (0.001-0.004 rad/frame) and bobs on Y via a sine of elapsed time with its own phase offset, so the cluster never pulses in unison. The whole group orbits slowly around the scene center.',
        'Anchor the forms: add a soft contact shadow (a dark radial-gradient ellipse in CSS beneath the cluster, or a shadow-receiving plane) so nothing looks pasted onto the background.',
        `Fallback beneath the canvas: an on-palette gradient field with a large soft ${colors.primary} bloom, so the hero is never an empty box.`,
        'Mobile (<768px): reduce to 2-3 forms, drop geometry detail one level, disable shadows, and cap pixel ratio at 2 — or fall back to the static treatment entirely if the scene cannot hold 50fps.',
      ].join('\n  ')
    },
  },
  {
    id: 'none',
    label: 'No 3D — static premium hero',
    intensity: 'none',
    summary: 'A rich static hero. Chosen where motion would read as unserious rather than premium.',
    niches: GRAVITAS_NICHES,
    avoid: [],
    recipe({ colors }) {
      return [
        'NO 3D IN THE HERO — deliberately. This business converts on gravitas, and animated 3D would undercut it. The hero still has to be the most crafted section on the page.',
        `Build depth with static layers instead: a full-bleed photograph with a real gradient scrim, a measured typographic composition, and a restrained ${colors.primary} accent used once.`,
        'Permitted motion is limited to one gentle CSS entrance (fade/rise, ~600ms, once on load) and hover transitions on interactive elements. No looping animation, no canvas, no parallax.',
        'Spend the effort on typographic detail, image crop and scrim quality, and spacing rhythm — that is where this hero earns its premium feel.',
      ].join('\n  ')
    },
  },
]

export const HERO_EFFECT_IDS = HERO_EFFECTS.map(e => e.id)

export function heroEffectById(id) {
  return HERO_EFFECTS.find(e => e.id === id) || null
}

/**
 * Score one treatment against this business.
 * Mirrors scoreFamily: niche hits dominate, hard mismatches are pushed down,
 * and nothing is random.
 */
export function scoreHeroEffect(effect, { industryText = '' } = {}) {
  const text = String(industryText || '').toLowerCase()
  let score = 0

  let hits = 0
  for (const n of effect.niches || []) {
    if (n && text.includes(String(n).toLowerCase())) hits++
  }
  score += Math.min(12, hits * 6)

  for (const n of effect.avoid || []) {
    if (n && text.includes(String(n).toLowerCase())) score -= 20
  }

  // Gravitas niches are the one hard rule: a funeral home or a personal-injury
  // firm does not get orbiting geometry, no matter what else scores well.
  const isGravitas = GRAVITAS_NICHES.some(n => text.includes(n))
  if (isGravitas && effect.id !== 'none') score -= 25
  if (!isGravitas && effect.id === 'none') score -= 8

  return score
}

/**
 * Pick the ONE hero treatment this page commits to.
 *
 * Deterministic per domain: the same business always resolves to the same
 * treatment (the regeneration contract depends on it), while near-ties break on
 * a domain hash so two different businesses in the same niche still diverge.
 */
export function chooseHeroEffect({
  analysis = {},
  domain = '',
  forcedId = null,
  palette = null,
} = {}) {
  const colors = paletteRoles(palette || analysis.color_palette)
  const industryText = [
    analysis.industry, analysis.niche, analysis.primary_service, analysis.business_type,
  ].filter(Boolean).join(' ').toLowerCase()

  if (forcedId) {
    const forced = heroEffectById(forcedId)
    if (forced) {
      return {
        effect: forced,
        colors,
        forced: true,
        recipe: forced.recipe({ colors }),
        scores: HERO_EFFECTS.map(e => ({
          id: e.id,
          score: e.id === forcedId ? Infinity : scoreHeroEffect(e, { industryText }),
        })),
      }
    }
  }

  const scored = HERO_EFFECTS
    .map(e => ({ e, score: scoreHeroEffect(e, { industryText }) }))
    .sort((a, b) => b.score - a.score || (a.e.id < b.e.id ? -1 : 1))

  const top = scored[0].score
  const nearTies = scored.filter(s => s.score >= top - 1)
  const pick = nearTies[stableHash(`${domain}|hero-effect`) % nearTies.length]

  return {
    effect: pick.e,
    colors,
    forced: false,
    recipe: pick.e.recipe({ colors }),
    scores: scored.map(s => ({ id: s.e.id, score: s.score })),
  }
}

/**
 * The block spliced into the build prompt. Returns '' for `none` handled
 * upstream only when the caller wants silence; by default `none` still emits
 * its instructions, because "deliberately static, spend the effort here
 * instead" is itself a direction the model needs.
 */
export function heroEffectPromptBlock(choice) {
  if (!choice?.effect) return ''
  return `HERO TREATMENT — ${choice.effect.label.toUpperCase()} (chosen for this business; do not substitute a different treatment):
  ${choice.recipe}`
}

/** The best-fitting treatments, for offering a real choice in guided mode. */
export function rankHeroEffects(analysis = {}, n = 4) {
  const industryText = [
    analysis.industry, analysis.niche, analysis.primary_service, analysis.business_type,
  ].filter(Boolean).join(' ').toLowerCase()
  return HERO_EFFECTS
    .map(e => ({ e, score: scoreHeroEffect(e, { industryText }) }))
    .sort((a, b) => b.score - a.score || (a.e.id < b.e.id ? -1 : 1))
    .slice(0, n)
    .map(x => x.e)
}
