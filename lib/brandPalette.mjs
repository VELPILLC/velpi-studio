// Deterministic brand-palette reconciliation.
//
// The analyzer is ASKED to keep the brand's colors, but that instruction is
// advisory and competes with "commit to ONE highest-end creative direction" —
// so premium-category priors (navy + gold for hospitality, for instance) beat
// a red-and-yellow logo, the invented hexes get THEME LOCKed in build-site,
// and every later stage — including image color-grading — treats the
// invention as ground truth and pushes the site further from the real brand.
//
// This is lib/contrastFix.mjs's philosophy applied to brand identity: detect
// deterministically, correct minimally, and report exactly what changed
// instead of silently overriding the model.
//
// The rule is deliberately narrow. The palette's LEAD chromatic color is the
// one that ends up as large fields of page — if that hue appears nowhere in
// the logo, the site reads as a different company no matter how good the
// typography is. Secondary colors are left alone (and merely flagged), since
// a brand legitimately uses supporting hues that never appear in its mark.

import { parseColorRaw } from './contrastFix.mjs'

export const DEFAULT_HUE_TOLERANCE = 28 // degrees; red(0) vs indigo(240) is way out, red vs orange is in

// Colors with (almost) no hue carry no brand identity — a black wordmark or a
// white knockout can't anchor anything, and demanding they match would fire on
// every monochrome logo.
const MIN_CHROMA_SAT = 15 // percent
const NEUTRAL_LIGHT_MIN = 8
const NEUTRAL_LIGHT_MAX = 92

function toRgb(value) {
  const c = parseColorRaw(String(value || '').trim())
  return c ? [c[0], c[1], c[2]] : null
}

// Local HSL (contrastFix keeps its own copy private; duplicating ~10 lines
// beats widening that module's public surface for one consumer).
export function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0, s = 0
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return [h, s * 100, l * 100]
}

export function isChromatic(value) {
  const rgb = toRgb(value)
  if (!rgb) return false
  const [, s, l] = rgbToHsl(rgb)
  return s >= MIN_CHROMA_SAT && l >= NEUTRAL_LIGHT_MIN && l <= NEUTRAL_LIGHT_MAX
}

// Shortest distance around the hue wheel, 0-180.
export function hueDistance(a, b) {
  const ra = toRgb(a), rb = toRgb(b)
  if (!ra || !rb) return Infinity
  const ha = rgbToHsl(ra)[0], hb = rgbToHsl(rb)[0]
  const raw = Math.abs(ha - hb) % 360
  return raw > 180 ? 360 - raw : raw
}

function normalizeLogoColors(logoColors) {
  return (Array.isArray(logoColors) ? logoColors : [])
    .map(c => (typeof c === 'string' ? { hex: c, prominence: null } : c))
    .filter(c => c && c.hex && toRgb(c.hex))
    // Keep the caller's order: both the canvas sampler and the vision read
    // return most-dominant-first, which is what "the brand's lead color" means.
    .map(c => ({ hex: String(c.hex).trim(), prominence: c.prominence ?? null }))
}

/**
 * @param {string[]} analyzedPalette  hexes the analyzer committed to
 * @param {(string|{hex:string,prominence?:number})[]} logoColors  measured/observed brand colors, most dominant first
 * @param {{hueTolerance?:number}} [opts]
 * @returns {{palette:string[], changes:Array, anchored:boolean, reason:string}}
 */
export function reconcilePalette(analyzedPalette, logoColors, opts = {}) {
  const hueTolerance = opts.hueTolerance ?? DEFAULT_HUE_TOLERANCE
  const palette = (Array.isArray(analyzedPalette) ? analyzedPalette : []).filter(c => toRgb(c))
  const logo = normalizeLogoColors(logoColors)
  const changes = []

  const brandHues = logo.filter(c => isChromatic(c.hex))
  if (!brandHues.length) {
    // Monochrome/neutral mark — there is no brand hue to anchor to, and
    // forcing one would be inventing identity rather than preserving it.
    return { palette, changes, anchored: false, reason: 'logo has no chromatic color to anchor to' }
  }
  if (!palette.length) {
    const seeded = brandHues.map(c => c.hex)
    changes.push({ from: null, to: seeded[0], reason: 'analyzer returned no palette — seeded from the logo' })
    return { palette: seeded, changes, anchored: true, reason: 'seeded from logo' }
  }

  const nearestBrand = value => {
    let best = null, bestD = Infinity
    for (const b of brandHues) {
      const d = hueDistance(value, b.hex)
      if (d < bestD) { bestD = d; best = b }
    }
    return { hex: best?.hex ?? null, distance: bestD }
  }

  const leadIdx = palette.findIndex(c => isChromatic(c))
  if (leadIdx === -1) {
    // An all-neutral palette (cream/charcoal) is a legitimate premium choice;
    // give it the brand's lead hue as an accent rather than rewriting it.
    const accent = brandHues[0].hex
    changes.push({ from: null, to: accent, reason: 'palette had no chromatic color — added the logo lead as an accent' })
    return { palette: [...palette, accent], changes, anchored: true, reason: 'accent added' }
  }

  const lead = palette[leadIdx]
  const near = nearestBrand(lead)

  // Anything chromatic and far from every brand hue is surfaced for
  // attestation, but only the LEAD is corrected — see the header note.
  for (let i = 0; i < palette.length; i++) {
    if (i === leadIdx || !isChromatic(palette[i])) continue
    const n = nearestBrand(palette[i])
    if (n.distance > hueTolerance) {
      changes.push({ from: palette[i], to: null, flagged: true, reason: `secondary color is ${Math.round(n.distance)}° off every brand hue` })
    }
  }

  if (near.distance <= hueTolerance) {
    return { palette, changes, anchored: true, reason: `lead color is ${Math.round(near.distance)}° from the brand hue` }
  }

  // The lead hue exists nowhere in the mark: replace it with the brand's
  // dominant color and keep the original as a supporting tone, so the
  // analyzer's intent survives without it owning the page.
  const replacement = brandHues[0].hex
  const next = [...palette]
  next[leadIdx] = replacement
  if (!next.some(c => c.toLowerCase() === lead.toLowerCase())) next.push(lead)

  changes.push({
    from: lead,
    to: replacement,
    reason: `lead color was ${Math.round(near.distance)}° from every brand hue — re-anchored to the logo`,
  })
  return { palette: next, changes, anchored: true, reason: 're-anchored to the logo' }
}
