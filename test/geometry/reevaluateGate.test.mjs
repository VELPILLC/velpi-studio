import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkFixedHtml, imgTokensOf, vidsOf } from '../../lib/reevaluateGates.mjs'

// A stand-in for a real generated page: the structural things the gates care
// about (doctype, .velpi-page scoping, image tokens, element ids) plus enough
// filler that the 55%-length gate behaves like it would on a real document.
const filler = 'x'.repeat(600)
const before = `<!DOCTYPE html><html><head><style>.velpi-page{color:#111}/* ${filler} */</style></head>
<body><div class="velpi-page">
<section data-vid="v1" class="hero"><h1 data-vid="v2">Title</h1><img data-vid="v3" data-vslot="img_1" src="%%IMG:img_1%%" alt=""></section>
<section data-vid="v4" class="specials"><ul data-vid="v5"><li data-vid="v6">Monday</li></ul></section>
</div></body></html>`

test('an honest surgical fix passes every gate', () => {
  const after = before.replace('<li data-vid="v6">Monday</li>', '<li data-vid="v6">Monday — Taco Night</li>')
  const res = checkFixedHtml(before, after)
  assert.equal(res.ok, true, res.failures.join('; '))
  assert.deepEqual(res.failures, [])
})

test('a dropped image token is rejected', () => {
  const after = before.replace('src="%%IMG:img_1%%"', 'src="https://cdn.example.com/photo.jpg"')
  const res = checkFixedHtml(before, after)
  assert.equal(res.ok, false)
  assert.ok(res.failures.some(f => /image placeholder tokens/.test(f)))
})

test('a renamed element id is rejected', () => {
  const after = before.replace('data-vid="v6"', 'data-vid="v99"')
  const res = checkFixedHtml(before, after)
  assert.equal(res.ok, false)
  assert.ok(res.failures.some(f => /data-vid/.test(f)))
})

test('a dropped element id is rejected', () => {
  const after = before.replace(' data-vid="v5"', '')
  const res = checkFixedHtml(before, after)
  assert.equal(res.ok, false)
  assert.ok(res.failures.some(f => /data-vid/.test(f)))
})

test('a truncated response is rejected', () => {
  const after = before.slice(0, Math.floor(before.length * 0.4))
  const res = checkFixedHtml(before, after)
  assert.equal(res.ok, false)
  assert.ok(res.failures.some(f => /shorter/.test(f)))
})

test('a missing .velpi-page wrapper is rejected', () => {
  const after = before.replace(/velpi-page/g, 'page')
  const res = checkFixedHtml(before, after)
  assert.equal(res.ok, false)
  assert.ok(res.failures.some(f => /velpi-page/.test(f)))
})

test('a non-document response (prose/markdown) is rejected', () => {
  const res = checkFixedHtml(before, `Here is your fixed page! ${filler}${filler}`)
  assert.equal(res.ok, false)
  assert.ok(res.failures.some(f => /complete HTML document/.test(f)))
})

test('gates report every independent failure at once, not just the first', () => {
  const after = `<!DOCTYPE html><html><body><div class="velpi-page"><p data-vid="v1">tiny</p></div></body></html>`
  const res = checkFixedHtml(before, after)
  assert.equal(res.ok, false)
  assert.ok(res.failures.length >= 3, `expected several failures, got: ${res.failures.join('; ')}`)
})

test('token/vid extractors are order-insensitive', () => {
  assert.equal(imgTokensOf('%%IMG:b%% %%IMG:a%%'), imgTokensOf('%%IMG:a%% %%IMG:b%%'))
  assert.equal(vidsOf('data-vid="v2" data-vid="v1"'), vidsOf('data-vid="v1" data-vid="v2"'))
})
