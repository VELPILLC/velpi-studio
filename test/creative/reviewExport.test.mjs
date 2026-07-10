// Plain-markdown reviews export tests (v3.0.0 — 5-question 1-5 scoring model) — pure, deterministic, no deps.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { REVIEW_EXPORT_VERSION, buildReviewsMarkdown } from '../../lib/creative/reviewExport.mjs'

const ALL_NULL_SCORES = { overall: null, layout: null, images: null, trust: null, copy: null }

test('version constant is stable', () => {
  assert.equal(REVIEW_EXPORT_VERSION, 'review-export@3.0.0')
  assert.match(REVIEW_EXPORT_VERSION, /^review-export@\d+\.\d+\.\d+$/)
})

test('empty input produces a readable "no reviews" file with a 0 count, not an error', () => {
  const md = buildReviewsMarkdown([], { generatedAt: '2026-07-09T00:00:00.000Z' })
  assert.match(md, /^# /)
  assert.match(md, /Dev Reviews Export/)
  assert.match(md, /0 reviews/i)
  assert.match(md, /no reviews/i)
})

test('selectionDescription is echoed in the header when provided', () => {
  const md = buildReviewsMarkdown([], { selectionDescription: 'single project' })
  assert.match(md, /single project/)
})

test('the generated/count line reflects the number of rows passed in', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'A', scores: { ...ALL_NULL_SCORES, overall: 4 }, note: '', viewport: 'mobile', createdAt: '2026-07-08T10:00:00.000Z' },
    { buildName: 'B', scores: { ...ALL_NULL_SCORES, overall: 3 }, note: '', viewport: 'desktop', createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  assert.match(md, /2 reviews/i)
})

test('a build line renders all five scores in fixed order: overall, layout, images, trust, copy', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'ScoreOrderBuild', scores: { overall: 5, layout: 4, images: 3, trust: 2, copy: 1 }, note: '', viewport: 'mobile', createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  const line = md.split('\n').find((l) => l.includes('ScoreOrderBuild'))
  assert.ok(line, 'the build appears on its own line')
  const i5 = line.indexOf('5')
  const i4 = line.indexOf('4')
  const i3 = line.indexOf('3')
  const i2 = line.indexOf('2')
  const i1 = line.indexOf('1')
  assert.ok(i5 >= 0 && i4 >= 0 && i3 >= 0 && i2 >= 0 && i1 >= 0, 'all five scores appear on the build line')
  assert.ok(i5 < i4 && i4 < i3 && i3 < i2 && i2 < i1, 'scores appear in overall, layout, images, trust, copy order')
})

test('a missing/null score renders as a dash, never as 0 or blank', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'DashFallbackBuild', scores: { overall: 4, layout: null, images: null, trust: null, copy: null }, note: '', viewport: 'mobile', createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  const line = md.split('\n').find((l) => l.includes('DashFallbackBuild'))
  assert.ok(line, 'the build appears on its own line')
  const dashCount = (line.match(/[-–—]/g) || []).length
  assert.ok(dashCount >= 4, 'the four missing scores each render as a dash placeholder')
  assert.ok(!/\b0\b/.test(line), 'a missing score never renders as the literal digit 0')
})

test('a non-empty single-line note prints as a quoted line', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'NoteBuild', scores: { ...ALL_NULL_SCORES, overall: 3 }, note: 'hero feels cramped on mobile', viewport: 'mobile', createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  assert.match(md, /"hero feels cramped on mobile"/)
})

test('an empty note prints no quoted line for that build', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'NoNoteBuild', scores: { ...ALL_NULL_SCORES, overall: 4 }, note: '', viewport: 'mobile', createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  const lines = md.split('\n')
  const idx = lines.findIndex((l) => l.includes('NoNoteBuild'))
  assert.ok(idx >= 0)
  const nextLine = (lines[idx + 1] || '').trim()
  assert.ok(!nextLine.startsWith('"'), 'no quoted note line follows a build with an empty note')
})

test('a multi-line note renders as one quoted, indented line per newline-separated segment', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'MultiLineNoteBuild', scores: { ...ALL_NULL_SCORES, overall: 3 }, note: 'line one\nline two\nline three', viewport: 'mobile', createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  const lines = md.split('\n')
  const l1 = lines.find((l) => l.includes('line one'))
  const l2 = lines.find((l) => l.includes('line two'))
  const l3 = lines.find((l) => l.includes('line three'))
  assert.ok(l1 && l2 && l3, 'all three note segments appear on separate lines')
  assert.match(l1, /"line one"/)
  assert.match(l2, /"line two"/)
  assert.match(l3, /"line three"/)
  for (const l of [l1, l2, l3]) {
    assert.ok(l.length > l.trimStart().length, 'each note line is indented')
  }
})

test('missing build name falls back to "Untitled build", never printing an id', () => {
  const md = buildReviewsMarkdown([
    { buildName: null, scores: { ...ALL_NULL_SCORES, overall: 4 }, note: '', viewport: 'mobile', createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  assert.match(md, /Untitled build/)
})

test('output never contains curly braces or uuid-looking strings, even with full data present', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'Acme Corp', scores: { overall: 4, layout: 3, images: 5, trust: 2, copy: 4 }, note: 'multi\nline\nnote', viewport: 'desktop', createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  assert.ok(!/[{}]/.test(md), 'no JSON braces anywhere in the file')
  assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(md), 'no uuid ever printed')
})

test('rows are grouped into sections in fixed order: Mobile, then Desktop, then Unspecified', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'MobileSectionBuild', scores: { ...ALL_NULL_SCORES, overall: 4 }, note: '', viewport: 'mobile', createdAt: '2026-07-08T10:00:00.000Z' },
    { buildName: 'DesktopSectionBuild', scores: { ...ALL_NULL_SCORES, overall: 3 }, note: '', viewport: 'desktop', createdAt: '2026-07-08T10:00:00.000Z' },
    { buildName: 'UnspecifiedSectionBuild', scores: { ...ALL_NULL_SCORES, overall: 2 }, note: '', viewport: null, createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  const iMobile = md.indexOf('MobileSectionBuild')
  const iDesktop = md.indexOf('DesktopSectionBuild')
  const iUnspecified = md.indexOf('UnspecifiedSectionBuild')
  assert.ok(iMobile >= 0 && iDesktop >= 0 && iUnspecified >= 0, 'all three rows appear somewhere in the output')
  assert.ok(iMobile < iDesktop && iDesktop < iUnspecified, 'Mobile section precedes Desktop precedes Unspecified')
})

test('no Unspecified section appears when every row has a valid viewport', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'M', scores: { ...ALL_NULL_SCORES, overall: 4 }, note: '', viewport: 'mobile', createdAt: '2026-07-08T10:00:00.000Z' },
    { buildName: 'D', scores: { ...ALL_NULL_SCORES, overall: 3 }, note: '', viewport: 'desktop', createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  assert.ok(!/unspecified/i.test(md), 'no Unspecified heading when there is nothing to put there')
})

test('grouped chronologically by day, newest day first; within a day newest first', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'Old', scores: { ...ALL_NULL_SCORES, overall: 4 }, note: '', viewport: 'mobile', createdAt: '2026-07-06T12:00:00.000Z' },
    { buildName: 'NewerSameDay', scores: { ...ALL_NULL_SCORES, overall: 4 }, note: '', viewport: 'mobile', createdAt: '2026-07-08T15:00:00.000Z' },
    { buildName: 'OlderSameDay', scores: { ...ALL_NULL_SCORES, overall: 4 }, note: '', viewport: 'mobile', createdAt: '2026-07-08T09:00:00.000Z' },
  ])
  const iNewDay = md.indexOf('July 8, 2026')
  const iOldDay = md.indexOf('July 6, 2026')
  assert.ok(iNewDay >= 0 && iOldDay > iNewDay, 'newest day heading appears before the older day heading')
  const iNewer = md.indexOf('NewerSameDay')
  const iOlder = md.indexOf('OlderSameDay')
  assert.ok(iNewer < iOlder, 'within the same day, newest-first')
})

test('summary shows the average overall score per viewport, computed only over rows with a numeric overall score', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'ZzAvgOne', scores: { ...ALL_NULL_SCORES, overall: 5 }, note: '', viewport: 'mobile', createdAt: '2026-07-08T10:00:00.000Z' },
    { buildName: 'ZzAvgTwo', scores: { ...ALL_NULL_SCORES, overall: 2 }, note: '', viewport: 'mobile', createdAt: '2026-07-08T09:00:00.000Z' },
    { buildName: 'ZzAvgThree', scores: { ...ALL_NULL_SCORES, overall: null }, note: '', viewport: 'mobile', createdAt: '2026-07-08T08:00:00.000Z' },
  ])
  // average of the two scored rows (5, 2) is 3.5; the unscored row must not be counted
  const summaryPart = md.slice(0, md.indexOf('ZzAvgOne'))
  assert.match(summaryPart, /Mobile[\s\S]{0,60}3\.5/i)
})

test('summary shows a dash instead of an average for a viewport with no numeric overall scores', () => {
  const md = buildReviewsMarkdown([
    { buildName: 'ZzNoScoreBuild', scores: ALL_NULL_SCORES, note: '', viewport: 'desktop', createdAt: '2026-07-08T10:00:00.000Z' },
  ])
  const summaryPart = md.slice(0, md.indexOf('ZzNoScoreBuild'))
  assert.match(summaryPart, /Desktop[\s\S]{0,60}[-–—]/i)
})
