// Deterministic interactive-element contrast check + surgical fix.
//
// "Activates" the dormant critique/enhance-site PATTERN (detect issues, then
// patch minimally without a full regenerate) — but scoped to contrast only,
// and with a different detection mechanism on purpose: the build prompt
// already asks the model to self-check contrast in text form (LEGIBILITY &
// CONTRAST) as one bullet among 100+ others, and testing showed it misses
// ~1 interactive element per generation even after two rounds of prompt
// hardening. A second LLM call re-reading the same CSS as text is the same
// kind of check, just run twice — not reliably better. This instead PARSES
// the actual generated CSS cascade (resolving CSS custom properties and
// ancestor background inheritance — the exact case a plain "read the hex
// values" check misses, per the confirmed failure: a transparent link
// inheriting its parent panel's solid background) and computes real WCAG
// contrast ratios in code, so detection is deterministic instead of guessed.
// The one part beyond code's reach (backgrounds behind a gradient/image
// scrim) is left as a known gap — flagged in the return value, not silently
// declared "fine".
//
// The fix step is equally deterministic: given a real background color and
// a failing foreground, walk the original hue in HSL lightness steps to the
// nearest passing value and emit ONE targeted !important override per
// element — never touching anything else, never regenerating a section.

const encoder = null // (unused — keeps this file dependency-free)

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)) }

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  if (full.length !== 6) return null
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return null
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')
}

// Parse #hex / rgb()/rgba() / hsl()/hsla() into [r,g,b,a]. Unknown formats
// (var(), named colors beyond the CSS-wide keywords used here, gradients)
// return null — callers treat null as "could not resolve".
function parseColorRaw(value) {
  if (!value) return null
  const v = value.trim().toLowerCase()
  if (v === 'transparent') return [0, 0, 0, 0]
  if (v === 'white') return [255, 255, 255, 1]
  if (v === 'black') return [0, 0, 0, 1]
  if (v.startsWith('#')) {
    const rgb = hexToRgb(v)
    return rgb ? [...rgb, 1] : null
  }
  let m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/.exec(v)
  if (m) return [+m[1], +m[2], +m[3], m[4] !== undefined ? +m[4] : 1]
  m = /^hsla?\(\s*([\d.]+)\s*,?\s*([\d.]+)%\s*,?\s*([\d.]+)%\s*(?:[,/]\s*([\d.]+))?\s*\)$/.exec(v)
  if (m) {
    const [r, g, b] = hslToRgb(+m[1], +m[2], +m[3])
    return [r, g, b, m[4] !== undefined ? +m[4] : 1]
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

// Alpha-composite a foreground color over a backdrop.
function compositeOver(fg, bg) {
  const a = fg[3] ?? 1
  if (a >= 1) return fg.slice(0, 3)
  return [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a))
}

function relLuminance([r, g, b]) {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relLuminance(rgb1), l2 = relLuminance(rgb2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

// ── CSS custom properties ────────────────────────────────────────────────

function extractCssVars(css) {
  const vars = {}
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g
  let m
  while ((m = re.exec(css))) vars[m[1]] = m[2].trim()
  return vars
}

function resolveVarRefs(value, vars, depth = 0) {
  if (!value || depth > 5) return value
  return value.replace(/var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*([^)]+))?\)/g, (_, name, fallback) => {
    const resolved = vars[name] ?? fallback ?? ''
    return resolveVarRefs(resolved, vars, depth + 1)
  })
}

// ── CSS rule parsing (flat selector -> declarations; last-wins per prop,
//    which approximates the cascade correctly for the single-file, mostly
//    single-specificity-tier CSS this pipeline generates) ──────────────────

function extractRules(css) {
  const rules = []
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
        rules.push({ selector, body: buf })
      }
      buf = ''; selector = ''
      continue
    }
    buf += ch
  }
  const out = []
  for (const { selector, body } of rules) {
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
      // Purely structural/cosmetic pseudo-classes and pseudo-elements
      // (:nth-child, ::before, :not(...), :first-child, ...) don't change
      // based on interaction, so stripping them and keeping the rule for
      // base-state matching is correct.
      const clean = trimmed.replace(/:{1,2}[a-zA-Z-]+(\([^)]*\))?/g, '').trim()
      if (clean) out.push({ selector: clean, decls, specificity: specificityOf(clean) })
    }
  }
  return out
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
// Checking only the rightmost token (as an earlier version of this file
// did) is exactly the bug class this exists to avoid: ".footer-col a"'s
// last token is the bare tag "a" with no class, which would otherwise
// match literally every <a> on the page, not just ones inside .footer-col.
function selectorMatches(selector, ownNode, ancestorNodes) {
  const tokens = selector.split(/\s+/).filter(Boolean)
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

// CSS specificity of a full selector (sum across every compound token, per
// the real cascade algorithm — NOT just the rightmost one). Encoded as a
// single comparable integer: ids*10000 + classes*100 + types, which is safe
// as long as no tier ever reaches 100 matches in one selector (true for any
// selector this pipeline generates). This exists because "later rule in the
// file wins" — a reasonable approximation for equal-specificity rules — is
// simply WRONG when a lower-specificity rule (e.g. ".footer-col a", spec
// 1 class + 1 type) happens to be followed later in the file by a higher-
// specificity one for an unrelated context, or vice versa: a generic
// "a[href]"-style rule appearing after a specific class rule must NOT win.
function specificityOf(selector) {
  let ids = 0, classes = 0, types = 0
  for (const token of selector.split(/\s+/).filter(Boolean)) {
    ids += (token.match(/#[a-zA-Z0-9_-]+/g) || []).length
    classes += (token.match(/\.[a-zA-Z0-9_-]+/g) || []).length
    if (/^[a-zA-Z][a-zA-Z0-9]*/.test(token)) types += 1
  }
  return ids * 10000 + classes * 100 + types
}

// Direct (non-inherited) declarations that apply to one element given its
// own {tag, classes} and its ancestor chain (nearest-first). Matching rules
// are merged in ASCENDING specificity order (stable sort — equal-specificity
// ties still resolve by source order, exactly like a real cascade), so a
// more specific match always wins regardless of where it sits in the file.
// An inline style="..." attribute on the node itself is merged LAST,
// unconditionally — inline style always beats any selector-based rule in
// the real cascade regardless of specificity, and the build model does
// occasionally write one-off inline colors instead of a class.
function resolveDirectStyle(ownNode, ancestorNodes, rules) {
  const matched = rules.filter(r => selectorMatches(r.selector, ownNode, ancestorNodes))
  matched.sort((a, b) => a.specificity - b.specificity) // stable: ties keep source order
  const merged = {}
  for (const { decls } of matched) Object.assign(merged, decls)
  if (ownNode.inlineStyle) Object.assign(merged, ownNode.inlineStyle)
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

function backgroundColorOf(decls, vars) {
  const raw = decls['background-color'] || decls['background']
  if (!raw) return { color: null, isGradientOrImage: false }
  const resolved = resolveVarRefs(raw, vars)
  if (/gradient|url\(/i.test(resolved)) return { color: null, isGradientOrImage: true }
  // "background" shorthand: pull the first color-looking token.
  const colorToken = (resolved.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)/) || [])[0]
  const rgba = parseColorRaw(colorToken || resolved)
  return { color: rgba, isGradientOrImage: false }
}

// ── HTML structure: interactive elements + their ancestor class chain,
//    via a lightweight open/close tag tracker (not a full parser — this
//    app's generated HTML is always well-formed, single style tag, class-
//    based, which is exactly the shape this is built for) ─────────────────

const VOID_TAGS = new Set(['img', 'br', 'input', 'meta', 'link', 'hr', 'source', 'area', 'col', 'base', 'embed'])

function extractInteractiveElements(bodyHtml) {
  const stack = [] // [{tag, classes}]
  const elements = []
  const tagRe = /<(\/?)([a-zA-Z0-9]+)((?:\s+[a-zA-Z-:]+(?:=(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)>/g
  let m
  while ((m = tagRe.exec(bodyHtml))) {
    const [full, closing, tagName, attrsRaw, selfClose] = m
    const tag = tagName.toLowerCase()
    if (closing) {
      for (let i = stack.length - 1; i >= 0; i--) if (stack[i].tag === tag) { stack.splice(i, 1); break }
      continue
    }
    const classMatch = /class=["']([^"']*)["']/.exec(attrsRaw)
    const classes = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : []
    const hrefMatch = /href=["']([^"']*)["']/.exec(attrsRaw)
    const styleMatch = /style=["']([^"']*)["']/.exec(attrsRaw)
    const inlineStyle = styleMatch ? parseInlineStyle(styleMatch[1]) : null

    if (tag === 'a' || tag === 'button') {
      // Capture inner text up to the matching close tag (non-nested-tag
      // fast path; sufficient for this app's simple interactive elements).
      const closeRe = new RegExp(`</${tag}>`, 'i')
      const closeIdx = bodyHtml.slice(tagRe.lastIndex).search(closeRe)
      const inner = closeIdx >= 0 ? bodyHtml.slice(tagRe.lastIndex, tagRe.lastIndex + closeIdx) : ''
      const text = inner.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim()
      elements.push({
        tag, classes, href: hrefMatch ? hrefMatch[1] : '',
        text, inlineStyle,
        ancestors: stack.map(s => ({ tag: s.tag, classes: s.classes, inlineStyle: s.inlineStyle })).slice().reverse(), // nearest first
      })
    }
    if (!selfClose && !VOID_TAGS.has(tag)) stack.push({ tag, classes, inlineStyle })
  }
  return elements
}

// Resolve the effective background an element sits on: itself, else walk
// ancestors nearest-first (each {tag, classes}, so bare-tag-selector
// backgrounds like ".velpi-page footer{...}" resolve same as class-based
// ones). Stops at the first solid color found. If a gradient/image is hit
// before any solid color resolves, that's reported as ambiguous (code
// cannot safely guarantee a fix without seeing the actual gradient stops
// against the actual text position).
function resolveEffectiveBackground(ownNode, ancestorNodes, rules, vars) {
  const own = backgroundColorOf(resolveDirectStyle(ownNode, ancestorNodes, rules), vars)
  if (own.color && own.color[3] > 0) return { rgb: own.color, ambiguous: false }
  if (own.isGradientOrImage) return { rgb: null, ambiguous: true }
  // Each ancestor's OWN selector match needs ITS OWN outer ancestor chain
  // (everything further up than it), not the original element's — a
  // compound selector on an ancestor is resolved relative to what's above it.
  for (let i = 0; i < ancestorNodes.length; i++) {
    const node = ancestorNodes[i]
    const outerChain = ancestorNodes.slice(i + 1)
    const style = backgroundColorOf(resolveDirectStyle(node, outerChain, rules), vars)
    if (style.color && style.color[3] > 0) return { rgb: style.color, ambiguous: false }
    if (style.isGradientOrImage) return { rgb: null, ambiguous: true }
  }
  return { rgb: null, ambiguous: false } // never resolved anything at all
}

function resolveForeground(ownNode, ancestorNodes, rules, vars) {
  const decls = resolveDirectStyle(ownNode, ancestorNodes, rules)
  const raw = decls['color']
  if (!raw) return null
  return parseColorRaw(resolveVarRefs(raw, vars))
}

// Walk the original hue toward pass/fail-safe lightness. Tries darkening
// first when the backdrop is light, lightening first when it's dark —
// whichever direction reaches 4.5:1 sooner — and falls back to the other
// direction, then to pure near-black/near-white, if the hue truly can't
// reach it (e.g. a very light backdrop paired with a saturated warm hue).
function pickAccessibleForeground(bgRgb, fgRgb) {
  const bgLum = relLuminance(bgRgb)
  const [h, s] = rgbToHsl(...fgRgb)
  const tryDirection = dir => {
    for (let step = 0; step <= 50; step++) {
      const l = clamp(dir === 'down' ? 50 - step : 50 + step, 2, 98)
      const rgb = hslToRgb(h, s, l)
      if (contrastRatio(rgb, bgRgb) >= 4.5) return rgbToHex(rgb)
    }
    return null
  }
  const first = bgLum > 0.5 ? 'down' : 'up'
  const second = first === 'down' ? 'up' : 'down'
  return tryDirection(first) || tryDirection(second) || (bgLum > 0.5 ? '#000000' : '#ffffff')
}

// ── Orchestration ───────────────────────────────────────────────────────

export function findAndFixContrastIssues(html) {
  const styleMatch = /<style[^>]*>([\s\S]*?)<\/style>/i.exec(html)
  // Strip CSS comments BEFORE rule extraction — otherwise a comment like
  // "/* FOOTER */" immediately preceding a selector gets absorbed into the
  // selector buffer (the extractor only tracks { }, nothing else), turning
  // ".velpi-page footer" into "/* FOOTER */ .velpi-page footer" and adding
  // bogus tokens that can never match any real ancestor — silently breaking
  // every rule that happens to follow a comment (a very common CSS style).
  const css = styleMatch ? styleMatch[1].replace(/\/\*[\s\S]*?\*\//g, ' ') : ''
  const bodyMatch = /<div class="velpi-page"[^>]*>([\s\S]*)<\/div>\s*(?:<\/body>|$)/i.exec(html)
  const body = bodyMatch ? bodyMatch[0] : html

  const vars = extractCssVars(css)
  const rules = extractRules(css)
  const elements = extractInteractiveElements(body)

  // hrefs usable in a fallback targeting selector: only "real" destinations
  // (tel:, mailto:, absolute http(s) URLs) — generic in-page anchors (#,
  // #contact) and empty placeholder links ("#") are routinely reused by many
  // unrelated elements (nav CTA, hero CTA, footer social icons...) and must
  // never anchor a selector, or a fix meant for one element repaints every
  // element that happens to share that href. A real phone/email href is
  // commonly ALSO reused across several elements that each already have
  // their own class (nav, hero, footer all showing the same number) — the
  // fix selector below adds :not([class]) so it only ever matches the
  // classless instance(s), never touching the already-distinct classed ones.
  const isMeaningfulHref = href => !!href && /^(tel:|mailto:|https?:\/\/)/i.test(href)

  const fixes = []
  const ambiguous = []
  const unfixable = [] // real failure, but no safe unique selector to override
  const checked = []

  for (const el of elements) {
    if (!el.text) continue // no visible label — nothing to check for legibility
    const ownNode = { tag: el.tag, classes: el.classes, inlineStyle: el.inlineStyle }
    // Foreground/background resolution works regardless of whether the
    // element itself has a class — a rule like ".contact-info a { color }"
    // matches via the bare-tag + ancestor chain either way. Only BUILDING a
    // scoped fix selector needs the element to be individually targetable.
    const fg = resolveForeground(ownNode, el.ancestors, rules, vars)
    if (!fg) continue // no explicit color anywhere in the chain — inherits page ink, out of scope
    const bgRes = resolveEffectiveBackground(ownNode, el.ancestors, rules, vars)
    if (bgRes.ambiguous) {
      ambiguous.push({ text: el.text.slice(0, 30) })
      continue
    }
    if (!bgRes.rgb) continue // could not resolve any background at all — don't guess
    const bg = compositeOver([...fg.slice(0, 3), fg[3] ?? 1], bgRes.rgb)
    const ratio = contrastRatio(bg, bgRes.rgb)
    checked.push({ text: el.text.slice(0, 30), ratio: +ratio.toFixed(2) })
    if (ratio >= 4.5) continue

    // A real failure — pick the most specific safe, unique selector to
    // override: the element's own class if it has one, else its href
    // (tel:/mailto: links are effectively unique per page) as an attribute
    // selector. If neither exists, the failure is real but not safely
    // targetable without risking an unrelated element — reported, not fixed.
    const fixedHex = pickAccessibleForeground(bgRes.rgb, fg.slice(0, 3))
    const newRatio = contrastRatio(hexToRgb(fixedHex), bgRes.rgb)
    let selector = null
    if (el.classes.length) selector = `.velpi-page .${el.classes[0]}`
    else if (isMeaningfulHref(el.href)) selector = `.velpi-page ${el.tag}[href="${el.href.replace(/"/g, '\\"')}"]:not([class])`
    if (!selector) {
      unfixable.push({ text: el.text.slice(0, 40), originalRatio: +ratio.toFixed(2) })
      continue
    }
    fixes.push({
      selector, className: el.classes[0] || null, text: el.text.slice(0, 40),
      originalRatio: +ratio.toFixed(2), fixedColor: fixedHex, newRatio: +newRatio.toFixed(2),
    })
  }

  if (!fixes.length) return { html, fixes, ambiguous, unfixable, checked: checked.length }

  const overrideBlock = '\n/* velpi: server-enforced interactive contrast fix */\n'
    + fixes.map(f => `${f.selector} { color: ${f.fixedColor} !important; }`).join('\n')
    + '\n'
  const lastStyleClose = html.lastIndexOf('</style>')
  const fixedHtml = lastStyleClose !== -1
    ? html.slice(0, lastStyleClose) + overrideBlock + html.slice(lastStyleClose)
    : html
  return { html: fixedHtml, fixes, ambiguous, unfixable, checked: checked.length }
}
