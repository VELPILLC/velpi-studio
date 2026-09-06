// Stable per-element addressing for generated mockups.
//
// Nothing below section level is addressable in the generated HTML today —
// `<section>` tags only sometimes get an id (a side effect of the nav-link
// backstop in build-site/route.js), and nothing addresses a card, list item,
// image, or decorative element individually. This assigns a sequential
// data-vid="vN" to every visually-meaningful element in document order, plus
// data-vslot="<id>" on any element still carrying a raw %%IMG:id%% token.
//
// IMPORTANT — these ids must NEVER reach a persisted, exported, or publicly
// served copy of a mockup (app/preview/[id]/route.js serves htmlTemplate
// straight to the internet). injectElementIds is only ever meant to run on a
// throwaway copy used for client-side geometry probing or the Inspect & Fix
// selection UI; the canonical htmlTemplate stays id-free. stripElementIds
// exists as a matching guarantee, not just a courtesy — call it before any
// id-bearing HTML is committed anywhere durable.
//
// Numbering only depends on tag structure (order + which tags are visually
// meaningful), never on attribute VALUES — so running this before or after
// %%IMG:id%% token substitution assigns the same vN to the same element
// (substitution only rewrites text inside an attribute value, never adds or
// removes a tag). That's what lets a vid captured from a click in the
// substituted device-preview safely target a fix built against the
// raw-token HTML actually sent to the LLM.

// Same open/close tag shape contrastFix.mjs's extractTextElements walks.
const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z-:]+(?:=(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)>/g

// Structural/non-visual tags — never selectable, but their contents (if any)
// still get walked normally (html/head/body wrap real content).
const EXCLUDE_TAGS = new Set([
  'html', 'head', 'body', 'meta', 'title', 'link', 'style', 'script', 'noscript', 'template', 'select',
  'br', 'hr', 'input', 'source', 'area', 'col', 'base', 'embed', 'wbr', 'track', 'param',
])

// Tags whose entire subtree is a black box — never walked, so nothing inside
// (icon paths, inline JS/CSS text that might coincidentally contain "<") is
// ever mistaken for markup. svg is the one exception that still gets an id
// on its own root before its interior is skipped, since a whole icon/graphic
// is a meaningful thing to select even though its internals aren't.
const OPAQUE_SUBTREE = new Set(['svg', 'style', 'script', 'noscript', 'template', 'select', 'title'])

const IMG_TOKEN_RE = /%%IMG:([a-z0-9_]+)%%/i

export const VID_ATTR = 'data-vid'
export const SLOT_ATTR = 'data-vslot'

export function stripElementIds(html) {
  return String(html)
    .replace(/\s+data-vid="v\d+"/gi, '')
    .replace(/\s+data-vslot="[a-z0-9_]+"/gi, '')
}

export function selectorFor(vid) {
  return `[data-vid="${vid}"]`
}

// -> { html, count }
export function injectElementIds(rawHtml) {
  const html = stripElementIds(String(rawHtml || ''))
  let n = 0
  let skipDepth = 0
  let skipTag = null

  const out = html.replace(TAG_RE, (full, closing, tagRaw, attrs, selfClose) => {
    const tag = tagRaw.toLowerCase()

    if (skipDepth > 0) {
      if (tag === skipTag) {
        if (closing) { skipDepth--; if (skipDepth === 0) skipTag = null }
        else if (!selfClose) skipDepth++
      }
      return full
    }
    if (closing) return full

    if (OPAQUE_SUBTREE.has(tag)) {
      let replacement = full
      if (tag === 'svg') {
        n++
        replacement = `<${tagRaw}${attrs} data-vid="v${n}"${selfClose ? ' /' : ''}>`
      }
      if (!selfClose) { skipDepth = 1; skipTag = tag }
      return replacement
    }

    if (EXCLUDE_TAGS.has(tag)) return full

    n++
    let extraAttrs = ` data-vid="v${n}"`
    const imgMatch = IMG_TOKEN_RE.exec(attrs)
    if (imgMatch) extraAttrs += ` data-vslot="${imgMatch[1]}"`
    return `<${tagRaw}${attrs}${extraAttrs}${selfClose ? ' /' : ''}>`
  })

  return { html: out, count: n }
}
