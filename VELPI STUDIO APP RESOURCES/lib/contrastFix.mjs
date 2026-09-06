// Deterministic text-contrast check + surgical fix for generated mockups.
//
// "Activates" the dormant critique/enhance-site PATTERN (detect issues, then
// patch minimally without a full regenerate) — scoped to contrast, and with
// a different detection mechanism on purpose: the build prompt already asks
// the model to self-check contrast in text form (LEGIBILITY & CONTRAST) as
// one bullet among 100+ others, and testing showed it reliably misses ~1
// element per generation even after prompt hardening. A second LLM call
// re-reading the same CSS as text is the same kind of check run twice — not
// reliably better. This instead PARSES the actual generated CSS cascade
// (custom properties, ancestor background inheritance, layered backgrounds)
// and computes real WCAG ratios in code, so detection is deterministic.
//
// Scope: ALL rendered text — headings, paragraphs, labels, list items,
// links, buttons — not just interactive elements (the original version
// checked only a/button and skipped image/gradient backdrops entirely; the
// confirmed misses were a hero eyebrow over a weak photo scrim and a section
// intro over a tinted band — both non-interactive, both over non-solid
// backdrops).
//
// Backdrop model: walking outward from the text element, every background
// layer is collected top-to-bottom — semi-transparent solids (tinted bands),
// gradient scrims (each stop is a spatial alternative), full-cover
// ::before/::after overlays — until an OPAQUE terminator: a solid color, an
// image, or the page base. Ratios are then evaluated worst-case across every
// stop combination; an image terminator is bounded by compositing the scrim
// stack over pure white AND pure black (if text passes both, no photo can
// break it). Thresholds follow WCAG AA: 4.5:1 normal text, 3:1 large text
// (>=24px, or >=18.66px at weight >=600).
//
// Fix strategy, still surgical (one targeted !important override per failing
// element, never a section regenerate):
//   - computable backdrop (solid / tinted band / opaque gradient): walk the
//     original hue in HSL lightness steps to the nearest value passing every
//     stop combination — a pure recolor.
//   - image involved (photo with weak/no scrim) or unverifiable stack: a
//     paint-only text-shadow scaled to the text tone (dark halo under light
//     text, light halo under dark ink), plus a recolor to solid white/ink
//     when the text itself is translucent or mud-toned. No pseudo-elements,
//     no layout-affecting properties — GHL-safe by construction.

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)) }

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  if (h.length === 4 || h.length === 8) {
    // #rgba / #rrggbbaa
    const full = h.length === 4 ? h.split('').map(c => c + c).join('') : h
    const n = parseInt(full, 16)
    if (Number.isNaN(n)) return null
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255]
  }
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  if (full.length !== 6) return null
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return null
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function hexAlpha(hex) {
  const h = hex.replace('#', '')
  if (h.length === 4) return parseInt(h[3] + h[3], 16) / 255
  if (h.length === 8) return parseInt(h.slice(6, 8), 16) / 255
  return 1
}

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')
}

// Small named-color map — the handful the build model actually emits.
// (Full CSS named-color coverage is deliberately out of scope; generated CSS
// is hex/rgb/var-based, with named colors showing up mostly in scrims.)
const NAMED_COLORS = {
  transparent: [0, 0, 0, 0], white: [255, 255, 255, 1], black: [0, 0, 0, 1],
  gray: [128, 128, 128, 1], grey: [128, 128, 128, 1], silver: [192, 192, 192, 1],
  whitesmoke: [245, 245, 245, 1], ivory: [255, 255, 240, 1], snow: [255, 250, 250, 1],
  beige: [245, 245, 220, 1], cream: [255, 253, 208, 1], linen: [250, 240, 230, 1],
  navy: [0, 0, 128, 1], midnightblue: [25, 25, 112, 1], charcoal: [54, 69, 79, 1],
  currentcolor: null, inherit: null, initial: null, unset: null,
}

// ── Modern color-space conversions ──────────────────────────────────────
// The generator's LLM increasingly emits modern CSS color syntax — the same
// color()/oklch()/lab() family that broke html2canvas 1.4.1 captures. A
// contrast checker that returns null on those silently skips exactly the
// declarations most likely to be recent additions, so all of them parse here.

function srgbGamma(c) { // linear -> gamma, 0..1
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

function linearRgbTo255([r, g, b]) {
  return [r, g, b].map(v => clamp(Math.round(srgbGamma(clamp(v, 0, 1)) * 255), 0, 255))
}

function oklabToRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3
  return linearRgbTo255([
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ])
}

// CIE Lab (D50, as CSS lab()/lch() specify) -> sRGB. Bradford-adapted
// D50->D65 matrix folded into the XYZ->sRGB step.
function cieLabToRgb(L, a, b) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200
  const finv = t => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787)
  const X = 0.96422 * finv(fx), Y = 1.0 * finv(fy), Z = 0.82521 * finv(fz)
  return linearRgbTo255([
    3.1338561 * X - 1.6168667 * Y - 0.4906146 * Z,
    -0.9787684 * X + 1.9161415 * Y + 0.0334540 * Z,
    0.0719453 * X - 0.2289914 * Y + 1.4052427 * Z,
  ])
}

function parseAlphaToken(tok) {
  if (tok === undefined || tok === null || tok === '') return 1
  const t = String(tok).trim()
  if (t.endsWith('%')) return clamp(parseFloat(t) / 100, 0, 1)
  const n = parseFloat(t)
  return Number.isNaN(n) ? 1 : clamp(n, 0, 1)
}

function parseHueToken(tok) {
  const t = String(tok).trim().toLowerCase()
  const n = parseFloat(t)
  if (Number.isNaN(n)) return 0
  if (t.endsWith('grad')) return n * 0.9
  if (t.endsWith('rad')) return n * (180 / Math.PI)
  if (t.endsWith('turn')) return n * 360
  return n // deg or unitless
}

// Split a function body on top-level whitespace/commas/slash, keeping nested
// function calls (e.g. calc(...)) intact. Returns { parts, alphaPart }.
function splitColorArgs(body) {
  const parts = []
  let buf = '', depth = 0, alphaPart
  const flush = () => { if (buf.trim()) parts.push(buf.trim()); buf = '' }
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (depth === 0 && (ch === ' ' || ch === '\t' || ch === '\n' || ch === ',')) { flush(); continue }
    if (depth === 0 && ch === '/') { flush(); alphaPart = body.slice(i + 1).trim(); break }
    buf += ch
  }
  flush()
  return { parts, alphaPart }
}

// Parse a CSS color into [r,g,b,a] (0-255 channels, 0-1 alpha). Unknown
// formats (unresolved var(), gradients, url()) return null — callers treat
// null as "could not resolve".
export function parseColorRaw(value) {
  if (!value) return null
  const v = value.trim().toLowerCase()
  if (v in NAMED_COLORS) return NAMED_COLORS[v] ? NAMED_COLORS[v].slice() : null
  if (v.startsWith('#')) {
    const rgb = hexToRgb(v)
    return rgb ? [...rgb, hexAlpha(v)] : null
  }
  const fnMatch = /^([a-z-]+)\(([\s\S]*)\)$/.exec(v)
  if (!fnMatch) return null
  const [, fn, body] = fnMatch
  const { parts, alphaPart } = splitColorArgs(body)

  if (fn === 'rgb' || fn === 'rgba') {
    if (parts.length < 3) return null
    const chan = t => (String(t).endsWith('%') ? clamp(parseFloat(t) * 2.55, 0, 255) : clamp(parseFloat(t), 0, 255))
    const a = alphaPart !== undefined ? parseAlphaToken(alphaPart) : (parts[3] !== undefined ? parseAlphaToken(parts[3]) : 1)
    const rgb = [chan(parts[0]), chan(parts[1]), chan(parts[2])]
    return rgb.some(Number.isNaN) ? null : [...rgb, a]
  }
  if (fn === 'hsl' || fn === 'hsla') {
    if (parts.length < 3) return null
    const h = parseHueToken(parts[0]), s = parseFloat(parts[1]), l = parseFloat(parts[2])
    if ([s, l].some(Number.isNaN)) return null
    const a = alphaPart !== undefined ? parseAlphaToken(alphaPart) : (parts[3] !== undefined ? parseAlphaToken(parts[3]) : 1)
    return [...hslToRgb(h, s, l), a]
  }
  if (fn === 'hwb') {
    if (parts.length < 3) return null
    const h = parseHueToken(parts[0])
    let w = parseFloat(parts[1]) / 100, bk = parseFloat(parts[2]) / 100
    if ([w, bk].some(Number.isNaN)) return null
    if (w + bk >= 1) { const g = w / (w + bk); return [g * 255, g * 255, g * 255, parseAlphaToken(alphaPart)] }
    const [r, g, b] = hslToRgb(h, 100, 50).map(c => c / 255)
    const mix = c => (c * (1 - w - bk) + w) * 255
    return [mix(r), mix(g), mix(b), parseAlphaToken(alphaPart)]
  }
  if (fn === 'oklch' || fn === 'oklab') {
    if (parts.length < 3) return null
    let L = parts[0].endsWith('%') ? parseFloat(parts[0]) / 100 : parseFloat(parts[0])
    if (Number.isNaN(L)) return null
    if (fn === 'oklch') {
      const C = parts[1].endsWith('%') ? parseFloat(parts[1]) / 100 * 0.4 : parseFloat(parts[1])
      const H = parseHueToken(parts[2]) * Math.PI / 180
      if (Number.isNaN(C)) return null
      return [...oklabToRgb(L, C * Math.cos(H), C * Math.sin(H)), parseAlphaToken(alphaPart)]
    }
    const a = parts[1].endsWith('%') ? parseFloat(parts[1]) / 100 * 0.4 : parseFloat(parts[1])
    const b = parts[2].endsWith('%') ? parseFloat(parts[2]) / 100 * 0.4 : parseFloat(parts[2])
    if ([a, b].some(Number.isNaN)) return null
    return [...oklabToRgb(L, a, b), parseAlphaToken(alphaPart)]
  }
  if (fn === 'lab' || fn === 'lch') {
    if (parts.length < 3) return null
    const L = parseFloat(parts[0])
    if (Number.isNaN(L)) return null
    if (fn === 'lch') {
      const C = parts[1].endsWith('%') ? parseFloat(parts[1]) * 1.5 : parseFloat(parts[1])
      const H = parseHueToken(parts[2]) * Math.PI / 180
      if (Number.isNaN(C)) return null
      return [...cieLabToRgb(L, C * Math.cos(H), C * Math.sin(H)), parseAlphaToken(alphaPart)]
    }
    const a = parts[1].endsWith('%') ? parseFloat(parts[1]) * 1.25 : parseFloat(parts[1])
    const b = parts[2].endsWith('%') ? parseFloat(parts[2]) * 1.25 : parseFloat(parts[2])
    if ([a, b].some(Number.isNaN)) return null
    return [...cieLabToRgb(L, a, b), parseAlphaToken(alphaPart)]
  }
  if (fn === 'color') {
    // color(<space> c1 c2 c3 [/ a]) — every RGB-ish space is approximated as
    // sRGB (channels clamped). Exact wide-gamut mapping is irrelevant for a
    // WCAG ratio; being ~right beats skipping the declaration entirely.
    if (parts.length < 4) return null
    const space = parts[0]
    const nums = parts.slice(1, 4).map(t => (t.endsWith('%') ? parseFloat(t) / 100 : parseFloat(t)))
    if (nums.some(Number.isNaN)) return null
    const a = parseAlphaToken(alphaPart)
    if (space === 'xyz' || space === 'xyz-d65' || space === 'xyz-d50') {
      const [X, Y, Z] = nums
      return [...linearRgbTo255([
        3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z,
        -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z,
        0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z,
      ]), a]
    }
    if (space === 'srgb-linear') return [...linearRgbTo255(nums), a]
    // srgb, display-p3, rec2020, a98-rgb, prophoto-rgb: treat channels as sRGB
    return [...nums.map(n => clamp(n, 0, 1) * 255), a]
  }
  if (fn === 'color-mix') {
    // color-mix(in <space>, C1 [p1%], C2 [p2%]) — linear sRGB-channel mix is
    // a close-enough approximation for contrast math in any space.
    const m = /^in\s+[a-z0-9-]+\s*(?:\s+(?:shorter|longer|increasing|decreasing)\s+hue)?\s*,([\s\S]+)$/.exec(body.trim())
    if (!m) return null
    const argsSplit = []
    let buf = '', depth = 0
    for (const ch of m[1]) {
      if (ch === '(') depth++
      if (ch === ')') depth--
      if (ch === ',' && depth === 0) { argsSplit.push(buf); buf = '' } else buf += ch
    }
    argsSplit.push(buf)
    if (argsSplit.length !== 2) return null
    const parseSide = s => {
      const pm = /^([\s\S]*?)(?:\s+([\d.]+)%)?\s*$/.exec(s.trim())
      return { color: parseColorRaw(pm[1].trim()), pct: pm[2] !== undefined ? parseFloat(pm[2]) : null }
    }
    const s1 = parseSide(argsSplit[0]), s2 = parseSide(argsSplit[1])
    if (!s1.color || !s2.color) return null
    let p1 = s1.pct, p2 = s2.pct
    if (p1 === null && p2 === null) { p1 = 50; p2 = 50 }
    else if (p1 === null) p1 = 100 - p2
    else if (p2 === null) p2 = 100 - p1
    const tot = p1 + p2 || 100
    const w1 = p1 / tot, w2 = p2 / tot
    return [0, 1, 2, 3].map(i => s1.color[i] * w1 + s2.color[i] * w2)
  }
  return null
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0; const l = (max + min) / 2
  const d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return [h, s * 100, l * 100]
}

// Alpha-composite a foreground color over an opaque backdrop.
function compositeOver(fg, bg) {
  const a = fg[3] ?? 1
  if (a >= 1) return fg.slice(0, 3)
  return [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a))
}

export function relLuminance([r, g, b]) {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

export function contrastRatio(rgb1, rgb2) {
  const l1 = relLuminance(rgb1), l2 = relLuminance(rgb2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

// ── CSS custom properties ────────────────────────────────────────────────

function extractCssVars(css) {
  const vars = {}
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;}]+)[;}]/g
  let m
  while ((m = re.exec(css))) {
    // First definition wins: base (desktop) blocks come before media-query
    // overrides in generated CSS, and the check models the desktop state.
    if (!(m[1] in vars)) vars[m[1]] = m[2].trim()
  }
  return vars
}

// Balanced-paren var() substitution — a fallback like
// var(--scrim, rgba(0,0,0,.5)) contains nested parens a regex substitution
// mangles (the original implementation left a stray ")" when the var was
// defined). Scans and splits properly instead.
function resolveVarRefs(value, vars, depth = 0) {
  if (!value || depth > 5) return value
  let out = ''
  let i = 0
  while (i < value.length) {
    const at = value.indexOf('var(', i)
    if (at === -1) { out += value.slice(i); break }
    out += value.slice(i, at)
    let j = at + 4, d = 1
    while (j < value.length && d > 0) {
      if (value[j] === '(') d++
      if (value[j] === ')') d--
      j++
    }
    const inner = value.slice(at + 4, j - 1)
    let name = inner, fallback
    let k = 0, id = 0
    for (; k < inner.length; k++) {
      if (inner[k] === '(') id++
      if (inner[k] === ')') id--
      if (inner[k] === ',' && id === 0) { name = inner.slice(0, k); fallback = inner.slice(k + 1); break }
    }
    const resolved = vars[name.trim()] ?? (fallback !== undefined ? fallback.trim() : '')
    out += resolveVarRefs(resolved, vars, depth + 1)
    i = j
  }
  return out
}

// Custom properties INHERIT and can be redefined per scope (a dark section
// re-declaring --ink for its subtree is a pattern the build prompt invites).
// Per-element resolution: the global (first-wins) map as the base, then each
// chain node's own matched declarations from outermost in — nearest wins.
function varsForNode(node, rules, globalVars) {
  if (node._vars) return node._vars
  const out = Object.assign({}, globalVars)
  const chain = [...node.ancestors].reverse() // outermost first
  chain.push(node)
  for (const n of chain) {
    const decls = resolveDirectStyle(n, rules)
    for (const k in decls) if (k.startsWith('--')) out[k] = decls[k]
  }
  node._vars = out
  return out
}

// ── CSS rule parsing (flat selector -> declarations) ─────────────────────

export function extractRules(css) {
  const raw = []
  let depth = 0, buf = '', selector = ''
  for (let i = 0; i < css.length; i++) {
    const ch = css[i]
    if (ch === '{') {
      if (depth === 0) selector = buf.trim()
      depth++
      buf = ''
      continue
    }
    if (ch === '}') {
      depth--
      if (depth === 0 && selector && !selector.startsWith('@')) {
        raw.push({ selector, body: buf })
      }
      buf = ''; selector = ''
      continue
    }
    buf += ch
  }
  const rules = []
  const pseudoOverlays = [] // ::before/::after rules — candidate scrim layers
  for (const { selector, body } of raw) {
    const decls = {}
    for (const part of body.split(';')) {
      const idx = part.indexOf(':')
      if (idx === -1) continue
      const prop = part.slice(0, idx).trim().toLowerCase()
      const val = part.slice(idx + 1).trim()
      if (prop && val) decls[prop] = val
    }
    for (const sel of selector.split(',')) {
      const trimmed = sel.trim()
      // INTERACTIVE-STATE pseudo-classes describe a DIFFERENT rendered state
      // than the default/resting one being checked — a rule like
      // ".footer-col a:hover { color: red }" must be EXCLUDED entirely, not
      // stripped-and-kept: stripping ":hover" would leave a selector
      // identical to the real base rule, and since a :hover override always
      // has to be authored AFTER its base rule to take effect, that (falsely
      // base-looking) rule would then always win the merge — silently
      // resolving every element to its HOVER color as if it were default.
      if (/:(hover|active|focus(-visible|-within)?|visited)\b/i.test(trimmed)) continue
      // ::before/::after rules are NOT merged into their base element (the
      // old version did, which painted decorative bars as if they were the
      // element's own background). They're kept separately: a full-cover
      // positioned pseudo (the classic hero scrim overlay) re-enters the
      // backdrop model as an overlay layer on its base element.
      if (/::?(before|after)\b/i.test(trimmed)) {
        const base = trimmed.replace(/::?(before|after)\b/gi, '').replace(/:{1,2}[a-zA-Z-]+(\([^)]*\))?/g, '').trim()
        if (base) pseudoOverlays.push({ selector: base, decls })
        continue
      }
      // Purely structural/cosmetic pseudo-classes (:nth-child, :not(...),
      // :first-child, ...) don't change based on interaction, so stripping
      // them and keeping the rule for base-state matching is correct.
      const clean = trimmed.replace(/:{1,2}[a-zA-Z-]+(\([^)]*\))?/g, '').trim()
      if (clean) rules.push({ selector: clean, decls, specificity: specificityOf(clean) })
    }
  }
  return { rules, pseudoOverlays }
}

// Does one compound selector fragment (".foo", "footer", "footer.foo") match
// a {tag, classes} node? A fragment with neither a class nor a recognized
// tag (e.g. "*", an unhandled pseudo-selector remnant) never matches —
// conservative by design, since a false match corrupts every property below
// it in cascade order.
function tokenMatches(token, node) {
  const classes = (token.match(/\.[a-zA-Z0-9_-]+/g) || []).map(c => c.slice(1))
  const tagName = (token.match(/^[a-zA-Z][a-zA-Z0-9]*/) || [])[0]
  if (!classes.length && !tagName) return false
  const classesOk = classes.length ? classes.every(c => node.classes.includes(c)) : true
  const tagOk = tagName ? tagName.toLowerCase() === (node.tag || '').toLowerCase() : true
  return classesOk && tagOk
}

// Full (descendant-combinator only — this app's generated CSS never uses
// child/sibling combinators) selector match: the RIGHTMOST compound must
// match the element itself; every earlier compound (right to left) must
// match SOME ancestor at or beyond where the previous compound matched.
function selectorMatches(selector, ownNode, ancestorNodes) {
  const tokens = selector.split(/\s+/).filter(t => t && t !== '>')
  if (!tokens.length) return false
  if (!tokenMatches(tokens[tokens.length - 1], ownNode)) return false
  let ai = 0
  for (let ti = tokens.length - 2; ti >= 0; ti--) {
    let found = false
    while (ai < ancestorNodes.length) {
      if (tokenMatches(tokens[ti], ancestorNodes[ai])) { found = true; ai++; break }
      ai++
    }
    if (!found) return false
  }
  return true
}

// CSS specificity encoded as one comparable integer (ids*10000 +
// classes*100 + types) — see the original rationale: "later in the file
// wins" alone is wrong when a lower-specificity rule follows a higher one.
function specificityOf(selector) {
  let ids = 0, classes = 0, types = 0
  for (const token of selector.split(/\s+/).filter(Boolean)) {
    ids += (token.match(/#[a-zA-Z0-9_-]+/g) || []).length
    classes += (token.match(/\.[a-zA-Z0-9_-]+/g) || []).length
    if (/^[a-zA-Z][a-zA-Z0-9]*/.test(token)) types += 1
  }
  return ids * 10000 + classes * 100 + types
}

// Direct (non-inherited) declarations for one node, memoized on the node
// (each node's ancestor chain is fixed at parse time). Matching rules merge
// in ASCENDING specificity (stable sort — equal specificity keeps source
// order, like the real cascade); the node's inline style merges LAST.
function resolveDirectStyle(node, rules) {
  if (node._decls) return node._decls
  const matched = rules.filter(r => selectorMatches(r.selector, node, node.ancestors))
  matched.sort((a, b) => a.specificity - b.specificity)
  const merged = {}
  for (const { decls } of matched) Object.assign(merged, decls)
  if (node.inlineStyle) Object.assign(merged, node.inlineStyle)
  node._decls = merged
  return merged
}

function parseInlineStyle(styleAttr) {
  const decls = {}
  if (!styleAttr) return decls
  for (const part of styleAttr.split(';')) {
    const idx = part.indexOf(':')
    if (idx === -1) continue
    const prop = part.slice(0, idx).trim().toLowerCase()
    const val = part.slice(idx + 1).trim()
    if (prop && val) decls[prop] = val
  }
  return decls
}

// ── Background layer parsing ─────────────────────────────────────────────

// Split a CSS value on top-level commas (function-call commas stay intact).
function splitLayers(value) {
  const out = []
  let buf = '', depth = 0
  for (const ch of value) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) { out.push(buf.trim()); buf = '' } else buf += ch
  }
  if (buf.trim()) out.push(buf.trim())
  return out
}

// Pull every color token out of a gradient body: hex, named, and functional
// colors (with balanced parens). Position/angle/keyword tokens are ignored —
// each stop color is treated as a spatial alternative the text might sit on.
function gradientStopColors(gradientValue) {
  const inner = gradientValue.slice(gradientValue.indexOf('(') + 1, gradientValue.lastIndexOf(')'))
  const colors = []
  const fnRe = /(rgba?|hsla?|hwb|oklch|oklab|lab|lch|color-mix|color)\(/gi
  let m
  while ((m = fnRe.exec(inner))) {
    let depth = 1, j = m.index + m[0].length
    while (j < inner.length && depth > 0) {
      if (inner[j] === '(') depth++
      if (inner[j] === ')') depth--
      j++
    }
    const c = parseColorRaw(inner.slice(m.index, j))
    if (c) colors.push(c)
  }
  const hexRe = /#[0-9a-fA-F]{3,8}\b/g
  while ((m = hexRe.exec(inner))) {
    const c = parseColorRaw(m[0])
    if (c) colors.push(c)
  }
  for (const nm of inner.toLowerCase().match(/\b(transparent|white|black|navy|charcoal|ivory|cream|beige|snow|whitesmoke|linen)\b/g) || []) {
    const c = parseColorRaw(nm)
    if (c) colors.push(c)
  }
  return colors
}

// Parse one node's background declarations into ordered paint layers
// (top-most first) plus the flat background color:
//   { layers: [{type:'gradient', stops:[[r,g,b,a],...]} | {type:'image'}],
//     color: [r,g,b,a] | null, unparsed: bool }
export function parseBackgroundValue(decls, vars) {
  const layers = []
  let color = null
  let unparsed = false
  const shorthand = decls['background'] ? resolveVarRefs(decls['background'], vars) : null
  const bgImage = decls['background-image'] ? resolveVarRefs(decls['background-image'], vars) : null
  const bgColor = decls['background-color'] ? resolveVarRefs(decls['background-color'], vars) : null

  const consumeLayerList = value => {
    for (const layer of splitLayers(value)) {
      const v = layer.trim()
      if (!v || v === 'none') continue
      if (/url\(/i.test(v)) {
        layers.push({ type: 'image' })
        // A single shorthand layer may carry "url(...) center/cover #123456"
        // — any color token in an image layer paints UNDER the image; it
        // only matters as the flat color, so fish it out for that role.
        const noUrl = v.replace(/url\([^)]*\)/gi, ' ')
        const tok = (noUrl.match(/#[0-9a-fA-F]{3,8}\b|(rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\([^)]*\)/) || [])[0]
        if (tok && !color) color = parseColorRaw(tok)
        continue
      }
      if (/[a-z-]*gradient\(/i.test(v)) {
        const stops = gradientStopColors(v)
        if (stops.length) layers.push({ type: 'gradient', stops })
        else unparsed = true
        continue
      }
      const asColor = parseColorRaw(v)
      if (asColor) { color = asColor; continue }
      // Shorthand keyword soup (positions/sizes/attachment) — ignore; a
      // color-bearing token was already tried above.
      const tok = (v.match(/#[0-9a-fA-F]{3,8}\b|(rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\([^)]*\)/) || [])[0]
      if (tok) { const c = parseColorRaw(tok); if (c) color = c }
    }
  }

  if (shorthand) consumeLayerList(shorthand)
  if (bgImage) consumeLayerList(bgImage)
  if (bgColor) {
    const c = parseColorRaw(bgColor)
    if (c) color = c
    else if (!/^(inherit|initial|unset|none)$/.test(bgColor.trim())) unparsed = true
  }
  return { layers, color, unparsed }
}

// ── HTML structure: every text-bearing element + ancestor chain ──────────

const VOID_TAGS = new Set(['img', 'br', 'input', 'meta', 'link', 'hr', 'source', 'area', 'col', 'base', 'embed', 'wbr', 'track', 'param'])
const SKIP_SUBTREES = new Set(['svg', 'script', 'style', 'noscript', 'title', 'select', 'template'])
const TEXT_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'a', 'button', 'span', 'label',
  'blockquote', 'figcaption', 'strong', 'em', 'b', 'i', 'small', 'cite', 'q',
  'td', 'th', 'dt', 'dd', 'time', 'address', 'summary', 'div', 'legend', 'caption',
])

// Walk the body markup once, tracking the open-element stack. Text runs
// between tags belong to the innermost open element (DIRECT text — a <p>
// wrapping a <span> is checked as two elements, each with its own resolved
// style, which is exactly how the cascade paints them).
export function extractTextElements(bodyHtml) {
  const clean = bodyHtml.replace(/<!--[\s\S]*?-->/g, ' ')
  const stack = []
  const elements = []
  const tagCounts = {} // `${sectionKey}|${tag}` -> count of opened elements
  let skipDepth = 0, skipTag = null
  const tagRe = /<(\/?)([a-zA-Z0-9]+)((?:\s+[a-zA-Z-:]+(?:=(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)>/g
  let lastIndex = 0
  let m

  const feedText = (upto) => {
    if (skipDepth > 0 || !stack.length) { lastIndex = upto; return }
    const run = clean.slice(lastIndex, upto)
    if (run) stack[stack.length - 1].directText += run
    lastIndex = upto
  }

  const popNode = (tag) => {
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].tag === tag) {
        const [node] = stack.splice(i, 1)
        finishNode(node)
        return
      }
    }
  }

  const finishNode = (node) => {
    if (!TEXT_TAGS.has(node.tag)) return
    const text = node.directText
      .replace(/&#?[a-zA-Z0-9]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    // Require some real content — lone glyph dividers ("·", "—") aren't
    // legibility-bearing text and would only add noise.
    if (!text || !/[a-zA-Z0-9][a-zA-Z0-9]/.test(text)) return
    elements.push({
      tag: node.tag, classes: node.classes, href: node.href, text,
      inlineStyle: node.inlineStyle, ancestors: node.ancestors,
      sectionKey: node.sectionKey,
    })
  }

  while ((m = tagRe.exec(clean))) {
    feedText(m.index)
    lastIndex = tagRe.lastIndex
    const [, closing, tagName, attrsRaw, selfClose] = m
    const tag = tagName.toLowerCase()

    if (skipDepth > 0) {
      if (tag === skipTag) {
        if (closing) { skipDepth--; if (skipDepth === 0) skipTag = null }
        else if (!selfClose) skipDepth++
      }
      continue
    }
    if (closing) { popNode(tag); continue }
    if (SKIP_SUBTREES.has(tag)) {
      if (!selfClose) { skipDepth = 1; skipTag = tag }
      continue
    }

    const classMatch = /class=["']([^"']*)["']/.exec(attrsRaw)
    const classes = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : []
    const hrefMatch = /href=["']([^"']*)["']/.exec(attrsRaw)
    const styleMatch = /style=["']([^"']*)["']/.exec(attrsRaw)
    const node = {
      tag, classes,
      href: hrefMatch ? hrefMatch[1] : '',
      inlineStyle: styleMatch ? parseInlineStyle(styleMatch[1]) : null,
      ancestors: stack.slice().reverse(), // nearest-first, SHARED node refs (memoization key)
      directText: '',
      sectionKey: null,
    }
    // sectionKey: the outermost classed ancestor below the page root — the
    // section wrapper in this app's generated markup. Used to scope fix
    // selectors and to know whether a bare tag is unique within its section.
    const outermostClassed = [...node.ancestors].reverse().find(a => a.classes.length && !a.classes.includes('velpi-page'))
    node.sectionKey = node.classes.length && !stack.length ? node.classes[0] : (outermostClassed ? outermostClassed.classes[0] : '::root')
    const countKey = `${node.sectionKey}|${tag}`
    tagCounts[countKey] = (tagCounts[countKey] || 0) + 1
    if (!selfClose && !VOID_TAGS.has(tag)) stack.push(node)
    else finishNode(node)
  }
  feedText(clean.length)
  while (stack.length) finishNode(stack.pop())
  return { elements, tagCounts }
}

// ── Style resolution: foreground, font, backdrop ─────────────────────────

function parseSizePx(value, vars) {
  if (!value) return null
  let v = resolveVarRefs(String(value), vars).trim().toLowerCase()
  const clampM = /^clamp\(([^,]+),/.exec(v)
  if (clampM) v = clampM[1].trim() // model the desktop check on the floor size — conservative
  const n = parseFloat(v)
  if (Number.isNaN(n)) return null
  if (v.endsWith('rem') || v.endsWith('em')) return n * 16
  if (v.endsWith('px')) return n
  if (v.endsWith('pt')) return n * (96 / 72)
  return null // %/vw/keywords — caller falls back to tag defaults
}

const TAG_SIZE_DEFAULTS = { h1: 34, h2: 28, h3: 22, h4: 18, h5: 16, h6: 14, small: 13 }

function resolveInheritable(node, rules, prop) {
  const own = resolveDirectStyle(node, rules)[prop]
  if (own !== undefined) return own
  for (const anc of node.ancestors) {
    const v = resolveDirectStyle(anc, rules)[prop]
    if (v !== undefined) return v
  }
  return undefined
}

function resolveFontMetrics(node, rules, globalVars) {
  const vars = varsForNode(node, rules, globalVars)
  const rawSize = resolveInheritable(node, rules, 'font-size')
  let size = parseSizePx(rawSize, vars)
  if (size === null) size = TAG_SIZE_DEFAULTS[node.tag] ?? 16
  const rawWeight = resolveInheritable(node, rules, 'font-weight')
  let weight = 400
  if (rawWeight !== undefined) {
    const w = String(rawWeight).trim().toLowerCase()
    weight = w === 'bold' ? 700 : (parseInt(w, 10) || 400)
  } else if (/^h[1-6]$/.test(node.tag) || node.tag === 'strong' || node.tag === 'b') {
    weight = 700
  }
  return { size, weight, large: size >= 24 || (size >= 18.66 && weight >= 600) }
}

function resolveForeground(node, rules, globalVars) {
  const own = resolveDirectStyle(node, rules)['color']
  if (own !== undefined) {
    const c = parseColorRaw(resolveVarRefs(own, varsForNode(node, rules, globalVars)))
    if (c) return { color: c, from: 'own' }
  }
  for (const anc of node.ancestors) {
    const v = resolveDirectStyle(anc, rules)['color']
    if (v !== undefined) {
      // Resolve the inherited value in the SCOPE THAT DECLARED IT — the
      // ancestor's own var scope, not the leaf's.
      const c = parseColorRaw(resolveVarRefs(v, varsForNode(anc, rules, globalVars)))
      if (c) return { color: c, from: 'inherited' }
    }
  }
  return { color: [16, 16, 16, 1], from: 'default' } // page ink fallback
}

// Is a pseudo-element rule a full-cover overlay (the hero-scrim pattern)?
function isFullCoverOverlay(decls) {
  if (!('content' in decls)) return false
  const pos = (decls['position'] || '').trim().toLowerCase()
  if (pos !== 'absolute' && pos !== 'fixed') return false
  const zeroish = v => v !== undefined && /^0(px|%)?$/.test(String(v).trim())
  const fullish = v => v !== undefined && /^100(\.0*)?%$/.test(String(v).trim())
  if (decls['inset'] !== undefined && /^0(px)?$/.test(String(decls['inset']).trim())) return true
  if (zeroish(decls['top']) && zeroish(decls['left']) && (zeroish(decls['right']) || fullish(decls['width'])) && (zeroish(decls['bottom']) || fullish(decls['height']))) return true
  return false
}

function nodeOpacity(node, rules) {
  const v = resolveDirectStyle(node, rules)['opacity']
  if (v === undefined) return 1
  const n = parseFloat(v)
  return Number.isNaN(n) ? 1 : clamp(n, 0, 1)
}

// Background layers contributed by one node: its own background plus any
// full-cover ::before/::after overlay attached to it (overlay paints ABOVE
// the node's own background). Overlay opacity multiplies into its colors.
function nodeBackgroundContribution(node, rules, globalVars, pseudoOverlays) {
  const vars = varsForNode(node, rules, globalVars)
  const decls = resolveDirectStyle(node, rules)
  const own = parseBackgroundValue(decls, vars)
  const overlayLayers = []
  for (const po of pseudoOverlays) {
    if (!selectorMatches(po.selector, node, node.ancestors)) continue
    if (!isFullCoverOverlay(po.decls)) continue
    const opacity = po.decls['opacity'] !== undefined ? clamp(parseFloat(po.decls['opacity']) || 1, 0, 1) : 1
    const parsed = parseBackgroundValue(po.decls, vars)
    const applyOpacity = c => [c[0], c[1], c[2], (c[3] ?? 1) * opacity]
    for (const layer of parsed.layers) {
      if (layer.type === 'gradient') overlayLayers.push({ type: 'gradient', stops: layer.stops.map(applyOpacity) })
      else overlayLayers.push({ type: 'image' }) // image in a pseudo — rare; treated like any image layer
    }
    if (parsed.color) overlayLayers.push({ type: 'tint', color: applyOpacity(parsed.color) })
  }
  return { own, overlayLayers, decls }
}

// Resolve the full backdrop under a text element: an overlay stack
// (top->bottom: gradients as stop-alternatives, translucent tints) over a
// terminator. Returns:
//   { kind: 'solid'|'image'|'none', overlays, base, contribIdx, unparsed }
function resolveBackdrop(node, rules, globalVars, pseudoOverlays) {
  const overlays = []
  let contribIdx = null // ancestor index of first node contributing paint (-1 = element itself)
  const chain = [node, ...node.ancestors]
  for (let i = 0; i < chain.length; i++) {
    const { own, overlayLayers } = nodeBackgroundContribution(chain[i], rules, globalVars, pseudoOverlays)
    const contributes = overlayLayers.length || own.layers.length || (own.color && own.color[3] > 0) || own.unparsed
    if (contributes && contribIdx === null) contribIdx = i - 1
    if (own.unparsed) return { kind: 'unparsed', overlays, base: null, contribIdx }

    // Pseudo overlays paint above the node's own background stack.
    const ordered = [...overlayLayers, ...own.layers.map(l => l)]
    for (const layer of ordered) {
      if (layer.type === 'image') return { kind: 'image', overlays, base: null, contribIdx }
      if (layer.type === 'tint') {
        if ((layer.color[3] ?? 1) >= 1) return { kind: 'solid', overlays, base: layer.color, contribIdx }
        if (layer.color[3] > 0) overlays.push({ alternatives: [layer.color] })
        continue
      }
      // gradient: opaque everywhere -> terminates (stops are the spatial
      // alternatives); any translucency -> scrim overlay, keep walking.
      const allOpaque = layer.stops.every(s => (s[3] ?? 1) >= 1)
      if (allOpaque) return { kind: 'gradient', overlays, stops: layer.stops, base: null, contribIdx }
      overlays.push({ alternatives: layer.stops })
    }
    if (own.color && own.color[3] > 0) {
      if (own.color[3] >= 1) return { kind: 'solid', overlays, base: own.color, contribIdx }
      overlays.push({ alternatives: [own.color] })
    }
  }
  return { kind: 'none', overlays, base: null, contribIdx }
}

// All worst-case candidate backdrops for a resolved backdrop description.
// Caps the cartesian product; over the cap the caller treats the element as
// unverifiable (shadow-fix path) rather than silently truncating coverage.
const MAX_COMBOS = 96

function candidateBackdrops(backdrop) {
  let bases
  if (backdrop.kind === 'solid') bases = [backdrop.base.slice(0, 3)]
  else if (backdrop.kind === 'gradient') bases = backdrop.stops.map(s => s.slice(0, 3))
  else if (backdrop.kind === 'image') bases = [[255, 255, 255], [0, 0, 0]] // worst-case photo bounds
  else if (backdrop.kind === 'none') bases = [[255, 255, 255]] // page default canvas
  else return null
  let combos = bases
  for (let i = backdrop.overlays.length - 1; i >= 0; i--) {
    const layer = backdrop.overlays[i]
    const next = []
    for (const base of combos) {
      for (const alt of layer.alternatives) next.push(compositeOver(alt, base))
    }
    combos = next
    if (combos.length > MAX_COMBOS) return null
  }
  return combos
}

// Walk the original hue toward a lightness that passes against EVERY
// candidate backdrop. Tries the direction away from the average backdrop
// first, falls back to the other, then to pure near-black/near-white.
function pickAccessibleForeground(bgCandidates, fgRgb, threshold) {
  const avg = [0, 1, 2].map(i => bgCandidates.reduce((s, c) => s + c[i], 0) / bgCandidates.length)
  const avgLum = relLuminance(avg)
  const [h, s] = rgbToHsl(...fgRgb)
  const passesAll = rgb => bgCandidates.every(bg => contrastRatio(rgb, bg) >= threshold)
  const tryDirection = dir => {
    for (let step = 0; step <= 50; step++) {
      const l = clamp(dir === 'down' ? 50 - step : 50 + step, 2, 98)
      const rgb = hslToRgb(h, s, l)
      if (passesAll(rgb)) return rgbToHex(rgb)
    }
    return null
  }
  const first = avgLum > 0.5 ? 'down' : 'up'
  const second = first === 'down' ? 'up' : 'down'
  const byHue = tryDirection(first) || tryDirection(second)
  if (byHue) return byHue
  const black = [8, 8, 8], white = [255, 255, 255]
  if (passesAll(black)) return rgbToHex(black)
  if (passesAll(white)) return rgbToHex(white)
  return null // no single color passes every candidate (wide gradient) — caller shadows
}

// Paint-only shadow fix for text over photos/unverifiable stacks. Tone
// follows the text: light text gets a dark halo, dark ink a light one.
function shadowFor(fgRgb) {
  return relLuminance(fgRgb) >= 0.35
    ? '0 1px 2px rgba(0,0,0,0.55), 0 2px 12px rgba(0,0,0,0.35)'
    : '0 1px 2px rgba(255,255,255,0.65), 0 0 12px rgba(255,255,255,0.45)'
}

// ── Orchestration ───────────────────────────────────────────────────────

export function findAndFixContrastIssues(html) {
  // Generated pages now ship real JavaScript, and GoHighLevel REQUIRES those
  // <script> tags to sit as siblings of the .velpi-page wrapper (a script
  // nested in a div doesn't run there). That puts a script between the
  // wrapper's </div> and </body> — exactly where the body match below used to
  // demand nothing but whitespace, so the match failed and `body` silently
  // became the ENTIRE document. Scripts are irrelevant to contrast anyway
  // (the walker already treats them as an opaque subtree), so drop them up
  // front and let the structural match see the shape it expects.
  const scriptless = html.replace(/<script\b[\s\S]*?<\/script>/gi, '')

  // EVERY style tag, not just the first. This used to read the first block
  // (non-greedy) while the patch below appended to the LAST one — fine when a
  // page had exactly one, wrong the moment a library or effect ships its own.
  const css = [...scriptless.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(m => m[1])
    .join('\n')
    // Strip CSS comments BEFORE rule extraction — otherwise a comment like
    // "/* FOOTER */" immediately preceding a selector gets absorbed into the
    // selector buffer, silently breaking every rule that follows a comment.
    .replace(/\/\*[\s\S]*?\*\//g, ' ')

  const bodyMatch = /<div class="velpi-page"[^>]*>([\s\S]*)<\/div>\s*(?:<\/body>|$)/i.exec(scriptless)
  const body = bodyMatch ? bodyMatch[0] : scriptless

  const globalVars = extractCssVars(css)
  const { rules, pseudoOverlays } = extractRules(css)
  const { elements, tagCounts } = extractTextElements(body)

  // hrefs usable in a fallback targeting selector: only "real" destinations
  // (tel:, mailto:, absolute http(s) URLs) — generic in-page anchors (#,
  // #contact) are reused by many unrelated elements and must never anchor a
  // selector. See the :not([class]) note where the selector is built.
  const isMeaningfulHref = href => !!href && /^(tel:|mailto:|https?:\/\/)/i.test(href)

  const fixes = []
  const ambiguous = [] // could not verify, and no safe fix either
  const unfixable = [] // real failure, but no safe unique selector to override
  let checked = 0

  const buildSelector = el => {
    const sectionClass = el.sectionKey && el.sectionKey !== '::root' ? el.sectionKey : null
    const ownClass = el.classes[0] || null
    if (ownClass && sectionClass && ownClass !== sectionClass) return `.velpi-page .${sectionClass} .${ownClass}`
    if (ownClass) return `.velpi-page .${ownClass}`
    const parent = el.ancestors[0]
    if (parent && parent.classes.length) return `.velpi-page .${parent.classes[0]} > ${el.tag}`
    if (isMeaningfulHref(el.href)) return `.velpi-page ${el.tag}[href="${el.href.replace(/"/g, '\\"')}"]:not([class])`
    if (sectionClass && tagCounts[`${el.sectionKey}|${el.tag}`] === 1) return `.velpi-page .${sectionClass} ${el.tag}`
    return null
  }

  for (const el of elements) {
    const decls = resolveDirectStyle(el, rules)
    // Skip elements that don't render at the desktop state being modeled.
    if ((decls['display'] || '').trim() === 'none') continue
    if ((decls['visibility'] || '').trim() === 'hidden') continue
    // Gradient-clipped text (background-clip:text) uses its background AS
    // the fill — out of scope for the backdrop model; only flag the truly
    // broken variant (transparent fill with no clip) elsewhere.
    if (/\btext\b/.test(decls['-webkit-background-clip'] || decls['background-clip'] || '')) continue

    const fgRes = resolveForeground(el, rules, globalVars)
    const backdrop = resolveBackdrop(el, rules, globalVars, pseudoOverlays)

    // Opacity on the element or on pure text wrappers between it and the
    // first painted layer fades the text against an unfaded backdrop —
    // multiply it into the foreground alpha.
    let opacityMul = nodeOpacity(el, rules)
    const wrapperCount = backdrop.contribIdx === null ? el.ancestors.length : Math.max(backdrop.contribIdx, 0)
    for (let i = 0; i < wrapperCount; i++) opacityMul *= nodeOpacity(el.ancestors[i], rules)
    const fg = [fgRes.color[0], fgRes.color[1], fgRes.color[2], (fgRes.color[3] ?? 1) * opacityMul]

    const { large } = resolveFontMetrics(el, rules, globalVars)
    const threshold = large ? 3.0 : 4.5

    const candidates = backdrop.kind === 'unparsed' ? null : candidateBackdrops(backdrop)
    checked++

    let minRatio = null
    if (candidates) {
      minRatio = Infinity
      for (const bg of candidates) {
        const eff = compositeOver(fg, bg)
        minRatio = Math.min(minRatio, contrastRatio(eff, bg))
      }
    }

    const verifiable = candidates !== null
    const involvesImage = backdrop.kind === 'image'
    if (verifiable && minRatio >= threshold) continue

    const selector = buildSelector(el)
    const entry = {
      selector, className: el.classes[0] || null, text: el.text.slice(0, 40), tag: el.tag,
      originalRatio: minRatio === null ? null : +minRatio.toFixed(2),
      threshold, context: backdrop.kind,
    }
    if (!selector) {
      unfixable.push({ text: el.text.slice(0, 40), originalRatio: entry.originalRatio, context: backdrop.kind })
      continue
    }

    if (verifiable && !involvesImage) {
      // Deterministic backdrop — recolor along the original hue.
      const fixedHex = pickAccessibleForeground(candidates, fg.slice(0, 3), threshold)
      if (fixedHex) {
        const newRatio = Math.min(...candidates.map(bg => contrastRatio(hexToRgb(fixedHex), bg)))
        fixes.push({ ...entry, kind: 'recolor', fixedColor: fixedHex, newRatio: +newRatio.toFixed(2) })
        continue
      }
      // No single color passes every stop of a wide gradient — halo it.
      const avg = [0, 1, 2].map(i => candidates.reduce((s, c) => s + c[i], 0) / candidates.length)
      const toneFg = relLuminance(avg) > 0.5 ? [16, 16, 16] : [255, 255, 255]
      fixes.push({ ...entry, kind: 'recolor+shadow', fixedColor: rgbToHex(toneFg), textShadow: shadowFor(toneFg) })
      continue
    }

    // Image involved (photo under a weak/no scrim) or unverifiable stack:
    // paint-only halo; solidify the color too when the text itself is
    // translucent or fails even against the scrim's average tone.
    const scrimAvgBase = [127, 127, 127] // mid-gray stand-in for the unknown photo
    let avgUnderText = scrimAvgBase
    for (let i = backdrop.overlays.length - 1; i >= 0; i--) {
      const alts = backdrop.overlays[i].alternatives
      const avgAlt = [0, 1, 2, 3].map(ch => alts.reduce((s, c) => s + (c[ch] ?? 1), 0) / alts.length)
      avgUnderText = compositeOver(avgAlt, avgUnderText)
    }
    const needsRecolor = (fg[3] ?? 1) < 1 || contrastRatio(compositeOver(fg, avgUnderText), avgUnderText) < threshold
    if (needsRecolor) {
      const toneFg = relLuminance(avgUnderText) > 0.5 ? [16, 16, 16] : [255, 255, 255]
      fixes.push({ ...entry, kind: 'recolor+shadow', fixedColor: rgbToHex(toneFg), textShadow: shadowFor(toneFg) })
    } else {
      fixes.push({ ...entry, kind: 'shadow', textShadow: shadowFor(fg) })
    }
  }

  // Dedupe by selector — nested direct-text elements (a <p> and a <span>
  // inside it) can produce the same target; merged props, strongest wins
  // (recolor+shadow > recolor > shadow).
  const bySelector = new Map()
  const rank = { 'recolor+shadow': 3, recolor: 2, shadow: 1 }
  for (const f of fixes) {
    const prev = bySelector.get(f.selector)
    if (!prev || rank[f.kind] > rank[prev.kind]) bySelector.set(f.selector, { ...prev, ...f })
    else if (prev && f.textShadow && !prev.textShadow) prev.textShadow = f.textShadow
  }
  const finalFixes = [...bySelector.values()]

  if (!finalFixes.length) return { html, fixes: finalFixes, ambiguous, unfixable, checked }

  const overrideBlock = '\n/* velpi: server-enforced text contrast fix */\n'
    + finalFixes.map(f => {
      const props = []
      if (f.fixedColor) props.push(`color: ${f.fixedColor} !important`)
      if (f.textShadow) props.push(`text-shadow: ${f.textShadow} !important`)
      return `${f.selector} { ${props.join('; ')}; }`
    }).join('\n')
    + '\n'
  const lastStyleClose = lastStyleCloseOutsideScripts(html)
  const fixedHtml = lastStyleClose !== -1
    ? html.slice(0, lastStyleClose) + overrideBlock + html.slice(lastStyleClose)
    : html
  return { html: fixedHtml, fixes: finalFixes, ambiguous, unfixable, checked }
}

// The override has to land in real page CSS, and pages now carry JavaScript
// that can contain the literal text "</style>" inside a string (a script that
// builds markup, for instance). A bare lastIndexOf would splice the fix into
// the middle of that JS, breaking the script and losing the fix. Find the
// last real one instead: the last </style> that isn't inside a <script> block.
export function lastStyleCloseOutsideScripts(html) {
  const src = String(html || '')
  const scriptRanges = []
  for (const m of src.matchAll(/<script\b[\s\S]*?<\/script>/gi)) {
    scriptRanges.push([m.index, m.index + m[0].length])
  }
  const inScript = i => scriptRanges.some(([a, b]) => i >= a && i < b)
  let at = -1
  for (const m of src.matchAll(/<\/style>/gi)) {
    if (!inScript(m.index)) at = m.index
  }
  return at
}
