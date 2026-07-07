// Developer review model tests — pure, deterministic, no deps.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  REVIEW_SCHEMA_VERSION, SCORE_DIMENSIONS, TAG_KEYS, TAG_VERDICTS, REVIEW_FLAGS,
  emptyReview, validateReview, mergeReview, reviewCompleteness,
} from '../../lib/creative/review.mjs'

test('constants: 12 dimensions, 12 tags, fixed vocab', () => {
  assert.equal(REVIEW_SCHEMA_VERSION, 1)
  assert.equal(SCORE_DIMENSIONS.length, 12)
  assert.equal(TAG_KEYS.length, 12)
  assert.deepEqual(TAG_VERDICTS, ['love', 'needs_work', 'dislike'])
  assert.deepEqual(REVIEW_FLAGS, ['love', 'regenerate', 'dislike'])
  assert.ok(SCORE_DIMENSIONS.includes('conversion') && SCORE_DIMENSIONS.includes('mobile'))
})

test('emptyReview is well-shaped and valid', () => {
  const r = emptyReview('run_1', 'proj_1')
  assert.equal(r.runId, 'run_1')
  assert.equal(r.reviewVersion, 1)
  assert.deepEqual(r.scores, {})
  assert.equal(validateReview(r).valid, true)
})

test('validateReview accepts a good partial and rejects bad values', () => {
  assert.equal(validateReview({ flag: 'love', scores: { overall: 9 }, tags: { hero: 'love' }, notes: 'x' }).valid, true)
  assert.equal(validateReview({ flag: 'meh' }).valid, false)
  assert.equal(validateReview({ scores: { overall: 11 } }).valid, false)
  assert.equal(validateReview({ scores: { overall: 5.5 } }).valid, false)
  assert.equal(validateReview({ scores: { bogus: 5 } }).valid, false)
  assert.equal(validateReview({ tags: { hero: 'meh' } }).valid, false)
  assert.equal(validateReview({ tags: { bogus: 'love' } }).valid, false)
  assert.equal(validateReview({ notes: 5 }).valid, false)
})

test('validateReview allows null to clear a score/tag', () => {
  assert.equal(validateReview({ scores: { overall: null }, tags: { hero: null } }).valid, true)
})

test('mergeReview merges scores/tags and clears on null', () => {
  const prev = { runId: 'r', reviewer: 'dev', flag: 'love', scores: { overall: 9, layout: 7 }, tags: { hero: 'love' }, notes: 'a', reviewVersion: 1 }
  const merged = mergeReview(prev, { scores: { layout: null, spacing: 8 }, tags: { images: 'needs_work' }, notes: 'b' })
  assert.equal(merged.scores.overall, 9)
  assert.ok(!('layout' in merged.scores)) // cleared
  assert.equal(merged.scores.spacing, 8)
  assert.equal(merged.tags.hero, 'love')
  assert.equal(merged.tags.images, 'needs_work')
  assert.equal(merged.notes, 'b')
  assert.equal(merged.flag, 'love') // preserved
})

test('mergeReview can change and clear the flag', () => {
  const m1 = mergeReview({ flag: 'love' }, { flag: 'dislike' })
  assert.equal(m1.flag, 'dislike')
  const m2 = mergeReview({ flag: 'love' }, { flag: null })
  assert.equal(m2.flag, null)
})

test('mergeReview on empty prior produces a valid review', () => {
  const merged = mergeReview(null, { runId: 'r', flag: 'regenerate' })
  assert.equal(merged.flag, 'regenerate')
  assert.equal(validateReview(merged).valid, true)
})

test('reviewCompleteness scales 0..1', () => {
  assert.equal(reviewCompleteness(emptyReview('r')), 0)
  const full = { flag: 'love', notes: 'x', scores: {}, tags: {} }
  SCORE_DIMENSIONS.forEach((d, i) => (full.scores[d] = ((i % 10) + 1)))
  TAG_KEYS.forEach(t => (full.tags[t] = 'love'))
  assert.equal(reviewCompleteness(full), 1)
  const partial = { flag: 'love', scores: { overall: 9 }, tags: {}, notes: '' }
  const c = reviewCompleteness(partial)
  assert.ok(c > 0 && c < 1)
})
