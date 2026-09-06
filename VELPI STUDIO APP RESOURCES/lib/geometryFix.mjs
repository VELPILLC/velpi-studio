// Deterministic layout-overlap check + surgical fix for generated mockups.
//
// Sibling to lib/contrastFix.mjs's "detect deterministically, patch with one
// targeted CSS override, never a section regenerate" pattern — but this
// checks something contrastFix structurally cannot: contrastFix parses CSS
// as text, which has no notion of where two elements actually render. An
// oversized decorative numeral colliding with a real text block (the bug
// this module exists to catch) is a real-layout problem — it needs actual
// getBoundingClientRect() geometry from a real browser render, which lives
// in lib/geometryProbe.js (the one browser-only piece; everything here is
// pure and synthetic-rect-testable, deliberately mirroring contrastFix's
// split between "parse/compute" and "orchestrate").
//
// The build prompt (app/api/build-site/route.js) already tells the model to
// keep decorative layering "genuinely faint (roughly <=15% visual weight)"
// and to offset it so it "never sits directly beneath a heading or body text
// at similar tone and weight" — this module enforces that same rule in code
// instead of trusting the model followed prose instructions.
//
// Fix strategy: only a DECORATIVE element sitting over CONTENT gets patched
// (force it faint and non-interactive) — nudging or resizing REAL content via
// blind CSS would be guessing at intent. Two content-bearing elements
// overlapping each other has no safe automatic fix at all; those always
// escalate for a human to look at (the manual Inspect & Fix tool).

const DECORATIVE_NAME_RE = /numeral|ghost|watermark|decorative|deco-|backdrop|bg-text|display-num/i
const OVERLAP_WEIGHT_THRESHOLD = 0.15 // mirrors the build prompt's own "<=15% visual weight" budget
const MIN_OVERLAP_AREA_PX = 64 // ignore rounding/hairline overlap noise

// node shape (see lib/geometryProbe.js): { vid, parentVid, tag, classes,
// sectionClass, rect:{top,left,right,bottom,width,height}, opacity, position,
// hasText, ariaHidden, pointerEvents }

export function classifyRole(node) {
  if (node.ariaHidden) return 'decorative'
  const nameBlob = [node.sectionClass, ...(node.classes || [])].filter(Boolean).join(' ')
  if (DECORATIVE_NAME_RE.test(nameBlob)) return 'decorative'
  const opacity = typeof node.opacity === 'number' && !Number.isNaN(node.opacity) ? node.opacity : 1
  if (opacity <= 0.15 && node.position === 'absolute') return 'decorative'
  return 'content'
}

function isContentBearing(node) {
  // Fully transparent elements cannot visually collide with anything, and
  // pages now open with scroll-reveal content parked at opacity:0 until it
  // enters the viewport. Measuring those as real overlaps produced fixes for
  // collisions no visitor could ever see — and the "fix" (forcing opacity on
  // the other element) would have been permanent.
  const opacity = typeof node.opacity === 'number' && !Number.isNaN(node.opacity) ? node.opacity : 1
  if (opacity === 0) return false
  return !!(node.hasText || node.tag === 'img' || node.tag === 'svg')
}

function rectArea(rect) {
  return Math.max(0, rect.width) * Math.max(0, rect.height)
}

function intersectArea(a, b) {
  const left = Math.max(a.left, b.left)
  const right = Math.min(a.right, b.right)
  const top = Math.max(a.top, b.top)
  const bottom = Math.min(a.bottom, b.bottom)
  if (right <= left || bottom <= top) return 0
  return (right - left) * (bottom - top)
}

// Ancestor sets built from parentVid chains, so "normal nesting" (a heading
// inside its own section) is never mistaken for an overlap bug.
function buildAncestrySets(nodes) {
  const byVid = new Map(nodes.map(n => [n.vid, n]))
  const cache = new Map()
  const climb = vid => {
    if (cache.has(vid)) return cache.get(vid)
    const set = new Set()
    let cur = byVid.get(vid)
    const guard = new Set() // cycle safety — malformed input should never infinite-loop
    while (cur && cur.parentVid && !guard.has(cur.parentVid)) {
      guard.add(cur.parentVid)
      set.add(cur.parentVid)
      cur = byVid.get(cur.parentVid)
    }
    cache.set(vid, set)
    return set
  }
  for (const n of nodes) climb(n.vid)
  return cache
}

function isRelated(aVid, bVid, ancestorsOf) {
  return !!(ancestorsOf.get(aVid)?.has(bVid) || ancestorsOf.get(bVid)?.has(aVid))
}

// -> Array<{ a, b, kind: 'decorative-over-content'|'content-content', decorativeVid?, weight }>
export function detectOverlaps(nodes) {
  const contentNodes = (nodes || []).filter(isContentBearing)
  const ancestorsOf = buildAncestrySets(nodes || [])
  const overlaps = []

  for (let i = 0; i < contentNodes.length; i++) {
    for (let j = i + 1; j < contentNodes.length; j++) {
      const a = contentNodes[i], b = contentNodes[j]
      if (isRelated(a.vid, b.vid, ancestorsOf)) continue

      const areaA = rectArea(a.rect), areaB = rectArea(b.rect)
      if (!areaA || !areaB) continue
      const inter = intersectArea(a.rect, b.rect)
      if (inter < MIN_OVERLAP_AREA_PX) continue

      const roleA = classifyRole(a), roleB = classifyRole(b)
      if (roleA === 'decorative' && roleB === 'decorative') continue

      if (roleA === 'content' && roleB === 'content') {
        const weight = inter / Math.min(areaA, areaB)
        if (weight >= OVERLAP_WEIGHT_THRESHOLD) {
          overlaps.push({ a: a.vid, b: b.vid, kind: 'content-content', weight })
        }
        continue
      }

      const decorative = roleA === 'decorative' ? a : b
      const content = roleA === 'decorative' ? b : a
      const contentArea = rectArea(content.rect)
      if (!contentArea) continue
      // "Visual weight" (the build prompt's own term) is coverage SCALED by
      // how visible the decorative element actually is — a numeral fully
      // covering a heading at 8% opacity is still a faint ghost (weight
      // 0.08), while the same shape at 90% opacity is the reported bug.
      // Geometric coverage alone would flag the legitimate ghost too.
      const decoOpacity = typeof decorative.opacity === 'number' && !Number.isNaN(decorative.opacity) ? decorative.opacity : 1
      const weight = (inter / contentArea) * decoOpacity
      if (weight >= OVERLAP_WEIGHT_THRESHOLD) {
        overlaps.push({ a: a.vid, b: b.vid, kind: 'decorative-over-content', decorativeVid: decorative.vid, weight })
      }
    }
  }
  return overlaps
}

// A durable selector for the decorative element being demoted — NEVER
// data-vid, which is stripped before anything ships. Mirrors contrastFix's
// buildSelector shape (section-scoped class, own class, section+tag
// fallback) against this module's flatter node shape.
function buildDurableSelector(node) {
  const sectionClass = node.sectionClass || null
  const ownClass = (node.classes || [])[0] || null
  if (ownClass && sectionClass && ownClass !== sectionClass) return `.velpi-page .${sectionClass} .${ownClass}`
  if (ownClass) return `.velpi-page .${ownClass}`
  if (sectionClass && node.tag) return `.velpi-page .${sectionClass} ${node.tag}`
  return null
}

// -> { fixes: [{vid, selector, css, reason}], escalate: [...] }
export function buildOverlapFixes(overlaps, nodesById) {
  const fixes = []
  const escalate = []
  const seenSelectors = new Set()

  for (const ov of overlaps) {
    if (ov.kind === 'content-content') { escalate.push(ov); continue }

    const decoNode = nodesById?.[ov.decorativeVid]
    if (!decoNode) { escalate.push({ ...ov, reason: 'decorative node missing from probe' }); continue }

    const selector = buildDurableSelector(decoNode)
    if (!selector) { escalate.push({ ...ov, reason: 'no durable selector for decorative element' }); continue }
    if (seenSelectors.has(selector)) continue // already patched via another overlap pair
    seenSelectors.add(selector)

    fixes.push({
      vid: ov.decorativeVid,
      selector,
      css: 'opacity: 0.12 !important; pointer-events: none !important;',
      reason: `decorative element overlapped real content (${Math.round(ov.weight * 100)}% of its area)`,
    })
  }
  return { fixes, escalate }
}

export function renderCssOverrideBlock(fixes) {
  if (!fixes || !fixes.length) return ''
  return '\n/* velpi: client-enforced layout overlap fix */\n'
    + fixes.map(f => `${f.selector} { ${f.css} }`).join('\n')
    + '\n'
}
