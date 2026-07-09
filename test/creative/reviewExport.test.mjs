// Plain-markdown reviews export tests — pure, deterministic, no deps.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { REVIEW_EXPORT_VERSION, buildReviewsMarkdown } from '../../lib/creative/reviewExport.mjs'

test('version constant is stable', () => {
  assert.match(REVIEW_EXPORT_VERSION, /^review-export@\d+\.\d+\.\d+$/)
})

test('empty input produces a readable "no reviews" file, not an error', () => {
  const md = buildReviewsMarkdown([], { generatedAt: '2026-07-09T00:00:00.000Z' })
  assert.match(md, /^# Velpi Studio — Dev Reviews Export/)
  assert.match(md, /0 reviews/)
  assert.match(md, /No reviews match this selection/)
})

test('one build per line, no ids, no raw JSON anywhere', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'Mr. Heatmizer Heating and Cooling', rating: 'love', flags: [], note: '', createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  assert.match(md, /\*\*Mr\. Heatmizer Heating and Cooling\*\* — Love/)
  assert.ok(!/\{|\}/.test(md), 'no JSON braces anywhere in the file')
  assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(md), 'no uuid ever printed')
})

test('flags render inline in parentheses; empty flags print no parens', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'A', rating: 'needs_work', flags: ['copy', 'images'], note: '', createdAt: '2026-07-08T10:00:00.000Z' },
    { buildName: 'B', rating: 'love', flags: [], note: '', createdAt: '2026-07-08T09:00:00.000Z' },
  ])
  assert.match(md, /\*\*A\*\* — Needs Work \(Copy, Images\)/)
  assert.match(md, /\*\*B\*\* — Love\n/) // no trailing "()" for an unflagged build
})

test('note prints as a quoted line under its build; missing note prints nothing extra', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'A', rating: 'okay', flags: ['layout'], note: 'hero feels cramped on mobile', createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  assert.match(md, /"hero feels cramped on mobile"/)
})

test('missing build name falls back to "Untitled build" (never prints an id)', () => {
  const md = buildReviewsMarkdown([{ buildName: null, rating: 'love', flags: [], note: '', createdAt: '2026-07-08T10:00:00.000Z' }])
  assert.match(md, /\*\*Untitled build\*\* — Love/)
})

test('grouped chronologically by day, newest day first; within a day newest first', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'Old', rating: 'love', flags: [], note: '', createdAt: '2026-07-06T12:00:00.000Z' },
    { buildName: 'NewerSameDay', rating: 'love', flags: [], note: '', createdAt: '2026-07-08T15:00:00.000Z' },
    { buildName: 'OlderSameDay', rating: 'love', flags: [], note: '', createdAt: '2026-07-08T09:00:00.000Z' },
  ])
  const iNewDay = md.indexOf('July 8, 2026')
  const iOldDay = md.indexOf('July 6, 2026')
  assert.ok(iNewDay >= 0 && iOldDay > iNewDay, 'newest day heading appears before the older day heading')
  const iNewer = md.indexOf('NewerSameDay')
  const iOlder = md.indexOf('OlderSameDay')
  assert.ok(iNewer < iOlder, 'within the same day, newest-first')
})

test('summary line counts ratings correctly', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'A', rating: 'love', flags: [], note: '', createdAt: '2026-07-08T10:00:00.000Z' },
    { buildName: 'B', rating: 'okay', flags: [], note: '', createdAt: '2026-07-08T10:00:00.000Z' },
    { buildName: 'C', rating: 'needs_work', flags: [], note: '', createdAt: '2026-07-08T10:00:00.000Z' },
    { buildName: 'D', rating: 'needs_work', flags: [], note: '', createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  assert.match(md, /Love: 1 · Okay: 1 · Needs Work: 2/)
})

test('selectionDescription is echoed in the header when provided', () => {
  const md = buildReviewsMarkdown([], { selectionDescription: 'single project' })
  assert.match(md, /single project/)
})
