// Developer review model tests (v2 — flat shape) — pure, deterministic, no deps.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  REVIEW_SCHEMA_VERSION, RATINGS, RATING_LABELS, FLAG_KEYS, FLAG_LABELS,
  emptyReview, validateReview, mergeReview,
} from '../../lib/creative/review.mjs'

test('constants: 3 ratings, 6 flags, fixed vocab', () => {
  assert.equal(REVIEW_SCHEMA_VERSION, 2)
  assert.deepEqual(RATINGS, ['love', 'okay', 'needs_work'])
  assert.equal(FLAG_KEYS.length, 6)
  assert.deepEqual(FLAG_KEYS, ['copy', 'visual_design', 'images', 'layout', 'trust_signals', 'overall_feel'])
  for (const r of RATINGS) assert.ok(RATING_LABELS[r])
  for (const f of FLAG_KEYS) assert.ok(FLAG_LABELS[f])
})

test('emptyReview is well-shaped and valid', () => {
  const r = emptyReview('build_1', 'proj_1')
  assert.equal(r.buildId, 'build_1')
  assert.equal(r.projectId, 'proj_1')
  assert.equal(r.rating, null)
  assert.deepEqual(r.flags, [])
  assert.equal(r.note, '')
  assert.equal(r.reviewVersion, 2)
  assert.equal(validateReview(r).valid, true)
})

test('validateReview accepts a good partial and rejects bad values', () => {
  assert.equal(validateReview({ rating: 'love', flags: [], note: 'x' }).valid, true)
  assert.equal(validateReview({ rating: 'okay', flags: ['copy', 'images'], note: '' }).valid, true)
  assert.equal(validateReview({ rating: 'meh' }).valid, false)
  assert.equal(validateReview({ rating: 'dislike' }).valid, false) // old v1 value, no longer valid
  assert.equal(validateReview({ flags: 'copy' }).valid, false) // must be an array
  assert.equal(validateReview({ flags: ['bogus'] }).valid, false)
  assert.equal(validateReview({ note: 5 }).valid, false)
})

test('validateReview allows rating: null and flags: []', () => {
  assert.equal(validateReview({ rating: null, flags: [] }).valid, true)
})

test('mergeReview replaces rating/flags/note; unspecified fields persist', () => {
  const prev = { buildId: 'b', projectId: 'p', rating: 'okay', flags: ['copy'], note: 'a', reviewVersion: 2 }
  const merged = mergeReview(prev, { flags: ['images', 'layout'] })
  assert.equal(merged.rating, 'okay') // untouched
  assert.deepEqual(merged.flags, ['images', 'layout'])
  assert.equal(merged.note, 'a') // untouched
})

test('mergeReview: picking "love" clears flags (even if the patch tried to set some)', () => {
  const prev = { buildId: 'b', rating: 'needs_work', flags: ['copy', 'images'], note: 'n' }
  const merged = mergeReview(prev, { rating: 'love' })
  assert.equal(merged.rating, 'love')
  assert.deepEqual(merged.flags, [])
  assert.equal(merged.note, 'n') // note is independent of rating

  const withFlagsAnyway = mergeReview(prev, { rating: 'love', flags: ['copy'] })
  assert.deepEqual(withFlagsAnyway.flags, [], 'love always wins over any flags in the same patch')
})

test('mergeReview: switching okay -> needs_work keeps existing flags (only love clears them)', () => {
  const prev = { buildId: 'b', rating: 'okay', flags: ['copy'], note: '' }
  const merged = mergeReview(prev, { rating: 'needs_work' })
  assert.equal(merged.rating, 'needs_work')
  assert.deepEqual(merged.flags, ['copy'])
})

test('mergeReview: unknown flag values are silently dropped, not stored', () => {
  const merged = mergeReview(emptyReview('b'), { flags: ['copy', 'bogus', 'images'] })
  assert.deepEqual(merged.flags, ['copy', 'images'])
})

test('mergeReview on empty prior produces a valid review', () => {
  const merged = mergeReview(null, { buildId: 'b', rating: 'okay', flags: ['layout'] })
  assert.equal(validateReview(merged).valid, true)
  assert.equal(merged.buildId, 'b')
})

test('mergeReview: note patch alone does not disturb rating/flags', () => {
  const prev = { buildId: 'b', rating: 'needs_work', flags: ['trust_signals'], note: 'old' }
  const merged = mergeReview(prev, { note: 'new note' })
  assert.equal(merged.rating, 'needs_work')
  assert.deepEqual(merged.flags, ['trust_signals'])
  assert.equal(merged.note, 'new note')
})
