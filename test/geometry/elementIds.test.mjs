import { test } from 'node:test'
import assert from 'node:assert/strict'
import { injectElementIds, stripElementIds, selectorFor } from '../../lib/elementIds.mjs'

const page = (body) => `<!DOCTYPE html>
<html><head><title>t</title><style>.velpi-page{color:#111}</style></head>
<body><div class="velpi-page">${body}</div></body></html>`

test('excluded structural tags never get an id', () => {
  const html = page('<section class="hero"><h1>Title</h1><input type="text" /><br></section>')
  const { html: out } = injectElementIds(html)
  assert.ok(!/<html[^>]*data-vid/.test(out))
  assert.ok(!/<head[^>]*data-vid/.test(out))
  assert.ok(!/<body[^>]*data-vid/.test(out))
  assert.ok(!/<title[^>]*data-vid/.test(out))
  assert.ok(!/<input[^>]*data-vid/.test(out))
  assert.ok(!/<br[^>]*data-vid/.test(out))
  assert.ok(/<h1 data-vid="v\d+">/.test(out), 'a real content tag must get an id')
})

test('svg root gets exactly one id; nothing inside it does', () => {
  const html = page('<div class="icon"><svg viewBox="0 0 10 10"><path d="M0 0"/><g><circle cx="1" cy="1" r="1"/></g></svg></div>')
  const { html: out } = injectElementIds(html)
  const svgIds = out.match(/<svg[^>]*data-vid="v\d+"/g) || []
  assert.equal(svgIds.length, 1, 'svg root gets one id')
  assert.ok(!/<path[^>]*data-vid/.test(out), 'svg internals never get ids')
  assert.ok(!/<circle[^>]*data-vid/.test(out), 'svg internals never get ids')
  assert.ok(!/<g[^>]*data-vid/.test(out), 'svg internals never get ids')
})

test('style/script subtree content is never mistaken for markup', () => {
  const html = page('<style>.x{content:"<fake-tag>"}</style><script>const a = "<div>"</script><p>Real text</p>')
  const { html: out } = injectElementIds(html)
  assert.ok(!/<fake-tag[^>]*data-vid/.test(out))
  assert.ok(/<p data-vid="v\d+">Real text<\/p>/.test(out))
})

test('image slot tokens get a stable data-vslot from the raw token', () => {
  const html = page('<img src="%%IMG:img_1%%" alt="">' + '<div class="hero" style="background-image:url(\'%%IMG:hero%%\')"></div>')
  const { html: out } = injectElementIds(html)
  assert.ok(/<img[^>]*data-vslot="img_1"/.test(out))
  assert.ok(/<div[^>]*data-vslot="hero"/.test(out))
})

test('re-injection is idempotent — same structure produces the same numbering', () => {
  const html = page('<section class="a"><h1>One</h1><p>Two</p></section><section class="b"><p>Three</p></section>')
  const once = injectElementIds(html)
  const twice = injectElementIds(once.html)
  assert.equal(once.html, twice.html)
  assert.equal(once.count, twice.count)
})

test('stripElementIds round-trips to a vid-free document', () => {
  const html = page('<section class="a"><h1>One</h1><img src="%%IMG:img_1%%"></section>')
  const { html: ided } = injectElementIds(html)
  const stripped = stripElementIds(ided)
  assert.ok(!/data-vid/.test(stripped))
  assert.ok(!/data-vslot/.test(stripped))
  assert.equal(stripped, html)
})

test('vid numbering is identical whether run before or after image-token substitution', () => {
  const raw = page('<section class="hero"><h1>Title</h1><img src="%%IMG:img_1%%" alt=""></section>')
  const substituted = raw.replace('%%IMG:img_1%%', 'https://cdn.example.com/real.jpg')

  const fromRaw = injectElementIds(raw)
  const fromSubstituted = injectElementIds(substituted)

  const vidsOf = html => [...html.matchAll(/data-vid="(v\d+)"/g)].map(m => m[1])
  assert.deepEqual(vidsOf(fromRaw.html), vidsOf(fromSubstituted.html), 'same document order -> same vN assignment regardless of attribute values')

  // The vslot is only recoverable from the raw, token-bearing copy — this is
  // exactly why the real pipeline always injects ids BEFORE substituting.
  assert.ok(/data-vslot="img_1"/.test(fromRaw.html))
  assert.ok(!/data-vslot=/.test(fromSubstituted.html))
})

test('selectorFor produces an attribute selector', () => {
  assert.equal(selectorFor('v42'), '[data-vid="v42"]')
})
