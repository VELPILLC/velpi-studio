// Developer review model tests (v4 — 5-question 1-5 scoring model) — pure, deterministic, no deps.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  REVIEW_SCHEMA_VERSION, SCORE_KEYS, SCORE_LABELS, SCORE_QUESTIONS,
  SCORE_MIN, SCORE_MAX, LOW_SCORE_MAX, isLowScore,
  VIEWPORTS, VIEWPORT_LABELS,
  emptyReview, validateReview, mergeReview,
} from '../../lib/creative/review.mjs'

test('constants: schema version 4, 5 fixed score keys, 2 viewports, fixed vocab', () => {
  assert.equal(REVIEW_SCHEMA_VERSION, 4)
  assert.deepEqual(SCORE_KEYS, ['overall', 'layout', 'images', 'trust', 'copy'])
  assert.deepEqual(VIEWPORTS, ['mobile', 'desktop'])
  for (const k of SCORE_KEYS) assert.ok(SCORE_LABELS[k], `label exists for ${k}`)
  for (const v of VIEWPORTS) assert.ok(VIEWPORT_LABELS[v], `label exists for ${v}`)
  assert.equal(SCORE_LABELS.overall, 'Overall')
  assert.equal(SCORE_LABELS.layout, 'Layout & Design')
  assert.equal(SCORE_LABELS.images, 'Images')
  assert.equal(SCORE_LABELS.trust, 'Trust Signals')
  assert.equal(SCORE_LABELS.copy, 'Copy')
  assert.deepEqual(VIEWPORT_LABELS, { mobile: 'Mobile', desktop: 'Desktop' })
})

test('SCORE_QUESTIONS only defines the "overall" question, no others', () => {
  assert.deepEqual(Object.keys(SCORE_QUESTIONS), ['overall'])
  assert.equal(SCORE_QUESTIONS.overall, 'Does this feel premium or generic?')
})

test('score range constants: min 1, max 5, low-score ceiling 3', () => {
  assert.equal(SCORE_MIN, 1)
  assert.equal(SCORE_MAX, 5)
  assert.equal(LOW_SCORE_MAX, 3)
})

test('isLowScore is true only for numbers at or below 3', () => {
  assert.equal(isLowScore(1), true)
  assert.equal(isLowScore(2), true)
  assert.equal(isLowScore(3), true)
  assert.equal(isLowScore(4), false)
  assert.equal(isLowScore(5), false)
})

test('isLowScore is false for non-numbers, including null and undefined', () => {
  assert.equal(isLowScore(null), false)
  assert.equal(isLowScore(undefined), false)
  assert.equal(isLowScore('2'), false)
  assert.equal(isLowScore('3'), false)
})

test('emptyReview is well-shaped, all scores null, and valid', () => {
  const r = emptyReview('build_1', 'proj_1', 'mobile')
  assert.equal(r.buildId, 'build_1')
  assert.equal(r.projectId, 'proj_1')
  assert.equal(r.viewport, 'mobile')
  assert.deepEqual(r.scores, { overall: null, layout: null, images: null, trust: null, copy: null })
  assert.equal(r.note, '')
  assert.equal(r.reviewVersion, 4)
  assert.equal(validateReview(r).valid, true)
})

test('emptyReview defaults buildId, projectId, and viewport to null when omitted', () => {
  const r = emptyReview()
  assert.equal(r.buildId, null)
  assert.equal(r.projectId, null)
  assert.equal(r.viewport, null)
})

test('emptyReview: an invalid viewport becomes null, not silently accepted', () => {
  assert.equal(emptyReview('b', 'p', 'tablet').viewport, null)
  assert.equal(emptyReview('b', 'p').viewport, null)
})

test('emptyReview: updatedAt defaults to null (nothing has been saved yet)', () => {
  assert.equal(emptyReview('b', 'p', 'mobile').updatedAt, null)
})

test('emptyReview returns an independent scores object on every call', () => {
  const a = emptyReview('b1', null, 'mobile')
  const b = emptyReview('b2', null, 'desktop')
  a.scores.overall = 5
  assert.equal(b.scores.overall, null, 'mutating one review\'s scores must not leak into another\'s')
})

test('validateReview accepts a valid partial review with a single score key set', () => {
  assert.equal(validateReview({ scores: { overall: 4 } }).valid, true)
  assert.equal(validateReview({ scores: { layout: 1 }, viewport: 'desktop', note: 'ok' }).valid, true)
  assert.equal(validateReview({}).valid, true)
  assert.equal(validateReview({ scores: {} }).valid, true)
})

test('validateReview rejects an unknown score key', () => {
  const result = validateReview({ scores: { overall: 4, bogus: 3 } })
  assert.equal(result.valid, false)
  assert.ok(result.errors.length > 0)
})

test('validateReview rejects out-of-range score values', () => {
  assert.equal(validateReview({ scores: { overall: 0 } }).valid, false)
  assert.equal(validateReview({ scores: { overall: 6 } }).valid, false)
  assert.equal(validateReview({ scores: { copy: -1 } }).valid, false)
})

test('validateReview rejects non-integer score values', () => {
  assert.equal(validateReview({ scores: { overall: 2.5 } }).valid, false)
  assert.equal(validateReview({ scores: { layout: 4.99 } }).valid, false)
})

test('validateReview rejects non-numeric score values', () => {
  assert.equal(validateReview({ scores: { overall: '4' } }).valid, false)
  assert.equal(validateReview({ scores: { overall: true } }).valid, false)
  assert.equal(validateReview({ scores: { overall: [] } }).valid, false)
})

test('validateReview allows a null or undefined score for any key', () => {
  assert.equal(validateReview({ scores: { overall: null } }).valid, true)
  assert.equal(validateReview({ scores: { overall: undefined } }).valid, true)
  assert.equal(validateReview({ scores: { overall: null, layout: null, images: null, trust: null, copy: null } }).valid, true)
})

test('validateReview rejects a scores value that is not a plain object', () => {
  assert.equal(validateReview({ scores: ['4', '3'] }).valid, false)
  assert.equal(validateReview({ scores: [] }).valid, false)
  assert.equal(validateReview({ scores: 'nope' }).valid, false)
})

test('validateReview rejects an invalid viewport', () => {
  assert.equal(validateReview({ viewport: 'tablet' }).valid, false)
  assert.equal(validateReview({ viewport: '' }).valid, false)
  assert.equal(validateReview({ viewport: 'mobile' }).valid, true)
  assert.equal(validateReview({ viewport: 'desktop' }).valid, true)
})

test('validateReview rejects a non-string note', () => {
  assert.equal(validateReview({ note: 5 }).valid, false)
  assert.equal(validateReview({ note: {} }).valid, false)
  assert.equal(validateReview({ note: 'a valid note' }).valid, true)
})

test('validateReview rejects a non-object top-level value', () => {
  assert.equal(validateReview(null).valid, false)
  assert.equal(validateReview('nope').valid, false)
  assert.equal(validateReview(42).valid, false)
})

test('mergeReview: a single-key score patch updates only that key, leaving other scores and note untouched', () => {
  const prev = {
    buildId: 'b', projectId: 'p', viewport: 'mobile',
    scores: { overall: 4, layout: 3, images: 2, trust: 5, copy: 1 },
    note: 'hello', reviewVersion: 4,
  }
  const merged = mergeReview(prev, { scores: { layout: 5 } })
  assert.deepEqual(merged.scores, { overall: 4, layout: 5, images: 2, trust: 5, copy: 1 })
  assert.equal(merged.note, 'hello')
  assert.equal(merged.viewport, 'mobile')
})

test('mergeReview: sequential single-key patches accumulate correctly into all five score keys', () => {
  let review = emptyReview('b', 'p', 'mobile')
  review = mergeReview(review, { scores: { overall: 5 } })
  review = mergeReview(review, { scores: { layout: 4 } })
  review = mergeReview(review, { scores: { images: 3 } })
  review = mergeReview(review, { scores: { trust: 2 } })
  review = mergeReview(review, { scores: { copy: 1 } })
  assert.deepEqual(review.scores, { overall: 5, layout: 4, images: 3, trust: 2, copy: 1 })
})

test('mergeReview: a note-only patch does not disturb any existing scores', () => {
  const prev = {
    buildId: 'b', viewport: 'desktop',
    scores: { overall: 4, layout: 3, images: 2, trust: 5, copy: 1 },
    note: 'old',
  }
  const merged = mergeReview(prev, { note: 'new note' })
  assert.deepEqual(merged.scores, { overall: 4, layout: 3, images: 2, trust: 5, copy: 1 })
  assert.equal(merged.note, 'new note')
})

test('mergeReview: omitting note entirely preserves the prior note', () => {
  const prev = { buildId: 'b', viewport: 'mobile', scores: { overall: 3, layout: null, images: null, trust: null, copy: null }, note: 'kept' }
  const merged = mergeReview(prev, { scores: { overall: 4 } })
  assert.equal(merged.note, 'kept')
})

test('mergeReview: an explicit empty-string note patch clears the note', () => {
  const prev = { buildId: 'b', viewport: 'mobile', scores: { overall: null, layout: null, images: null, trust: null, copy: null }, note: 'something' }
  const merged = mergeReview(prev, { note: '' })
  assert.equal(merged.note, '')
})

test('mergeReview: viewport is sticky when the patch omits it or supplies an invalid value', () => {
  const prev = { buildId: 'b', viewport: 'desktop', scores: { overall: 3, layout: null, images: null, trust: null, copy: null }, note: '' }
  const omitted = mergeReview(prev, { scores: { layout: 2 } })
  assert.equal(omitted.viewport, 'desktop')
  const invalid = mergeReview(prev, { viewport: 'tablet', scores: { layout: 2 } })
  assert.equal(invalid.viewport, 'desktop')
})

test('mergeReview: buildId and projectId fall back to the prior review when the patch omits them', () => {
  const prev = { buildId: 'b1', projectId: 'p1', viewport: 'mobile', scores: { overall: 3, layout: null, images: null, trust: null, copy: null }, note: '' }
  const merged = mergeReview(prev, { scores: { overall: 4 } })
  assert.equal(merged.buildId, 'b1')
  assert.equal(merged.projectId, 'p1')
  const overridden = mergeReview(prev, { buildId: 'b2', projectId: 'p2' })
  assert.equal(overridden.buildId, 'b2')
  assert.equal(overridden.projectId, 'p2')
})

test('mergeReview on a null/missing prior review starts every score at null before applying the patch', () => {
  const merged = mergeReview(null, { buildId: 'b', viewport: 'mobile', scores: { overall: 4 } })
  assert.deepEqual(merged.scores, { overall: 4, layout: null, images: null, trust: null, copy: null })
  assert.equal(validateReview(merged).valid, true)
})

test('mergeReview: reviewVersion is always at least the current schema version', () => {
  const fromNull = mergeReview(null, { buildId: 'b' })
  assert.equal(fromNull.reviewVersion, 4)
  const prev = { buildId: 'b', viewport: 'mobile', scores: { overall: null, layout: null, images: null, trust: null, copy: null }, note: '', reviewVersion: 4 }
  const merged = mergeReview(prev, { scores: { overall: 3 } })
  assert.equal(merged.reviewVersion, 4)
})

test('mergeReview: a stale pre-v4 reviewVersion is upgraded to the current version, never left behind', () => {
  // A build rated under the old rating/flags model (review_version 3) that
  // gets new scores data written to it must be stamped as v4 going forward —
  // otherwise it's permanently invisible to the v4-only export filter.
  const legacyRow = { buildId: 'b', viewport: 'mobile', scores: { overall: null, layout: null, images: null, trust: null, copy: null }, note: '', reviewVersion: 3 }
  const merged = mergeReview(legacyRow, { scores: { overall: 2 } })
  assert.equal(merged.reviewVersion, 4)
})

test('mergeReview: updatedAt carries over from the prior review when the patch omits it, and is overridable', () => {
  const prev = { buildId: 'b', viewport: 'mobile', scores: { overall: 3, layout: null, images: null, trust: null, copy: null }, note: '', updatedAt: '2026-01-01T00:00:00.000Z' }
  const carried = mergeReview(prev, { scores: { layout: 4 } })
  assert.equal(carried.updatedAt, '2026-01-01T00:00:00.000Z')
  const overridden = mergeReview(prev, { updatedAt: '2026-02-02T00:00:00.000Z' })
  assert.equal(overridden.updatedAt, '2026-02-02T00:00:00.000Z')
})

test('mergeReview: a mobile review and a desktop review for the same build accumulate independently', () => {
  const mobile = mergeReview(null, { buildId: 'b', viewport: 'mobile', scores: { overall: 5 } })
  const desktop = mergeReview(null, { buildId: 'b', viewport: 'desktop', scores: { overall: 2, copy: 1 } })
  assert.deepEqual(mobile.scores, { overall: 5, layout: null, images: null, trust: null, copy: null })
  assert.deepEqual(desktop.scores, { overall: 2, layout: null, images: null, trust: null, copy: 1 })
  assert.equal(mobile.viewport, 'mobile')
  assert.equal(desktop.viewport, 'desktop')
})
