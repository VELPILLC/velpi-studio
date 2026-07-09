'use client'
import { useEffect, useRef, useState } from 'react'
import { RATINGS, RATING_LABELS, FLAG_KEYS, FLAG_LABELS, emptyReview } from '../../lib/creative/review.mjs'

// Developer Review Panel — DEV ONLY. Docked below the generated site, above the
// Refine input. Resting state is ONE tap: Love / Okay / Needs Work. Okay/Needs
// Work reveal a small multi-select flag row + an optional note; Love saves
// silently and stays collapsed. No score sliders, no per-section grid — this is
// built for a fast rate-many-builds loop, not a permanent scoreboard.
//
// Independent of the Creative Intelligence Layer: buildId is generated for
// every run regardless of CIL mode, so there is nothing to configure and
// nothing to show the user about it.
//
// Props: buildId (per-generation id, always present), projectId (auto-saved
// project id), businessName, getRenderedHtml() -> html string (for the
// optional "Ask ChatGPT" screenshot).

const C = { panel: '#121a2b', panel2: '#0d1524', border: '#22304a', text: '#e8eefc', dim: '#8ea0c0', muted: '#61708c', blue: '#4c8dff', green: '#39d98a', amber: '#e5c07b', red: '#ff6675' }
const RATING_STYLE = { love: C.green, okay: C.amber, needs_work: C.red }

export default function ReviewPanel({ buildId, projectId, businessName, getRenderedHtml }) {
  const [review, setReview] = useState(() => emptyReview(buildId, projectId))
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState('idle') // idle | saving | saved | error
  const [saveReason, setSaveReason] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportingReviews, setExportingReviews] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    setReview(emptyReview(buildId, projectId))
    setExpanded(false)
    if (!buildId) return
    fetch(`/api/creative/review?buildId=${encodeURIComponent(buildId)}`)
      .then(r => r.json())
      .then(d => {
        if (d?.ok && d.review) {
          setReview(d.review)
          if (d.review.rating === 'okay' || d.review.rating === 'needs_work') setExpanded(true)
        }
      }).catch(() => {})
  }, [buildId, projectId])

  function scheduleSave(next) {
    if (!buildId && !projectId) return
    setSaved('saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch('/api/creative/review', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buildId, projectId, rating: next.rating, flags: next.flags, note: next.note }),
        }).then(x => x.json())
        // Reflect the REAL persistence result — the request can be ok while the
        // DB write failed (e.g. the creative_reviews table hasn't been created).
        if (r?.ok && r.persisted?.saved) { setSaved('saved'); setSaveReason('') }
        else { setSaved('error'); setSaveReason(r?.persisted?.reason || r?.error || 'not persisted') }
      } catch (_) { setSaved('error'); setSaveReason('network error') }
    }, 500)
  }

  function pickRating(r) {
    const flags = r === 'love' ? [] : review.flags
    const next = { ...review, rating: r, flags }
    setReview(next)
    setExpanded(r !== 'love')
    scheduleSave(next)
  }
  function toggleFlag(f) {
    const has = review.flags.includes(f)
    const next = { ...review, flags: has ? review.flags.filter(x => x !== f) : [...review.flags, f] }
    setReview(next)
    scheduleSave(next)
  }
  function setNote(note) {
    const next = { ...review, note }
    setReview(next)
    scheduleSave(next)
  }

  async function askChatGpt() {
    if (exporting || (!buildId && !projectId)) return
    setExporting(true)
    try {
      let fullpage = null
      try { fullpage = await captureFullPage(getRenderedHtml ? getRenderedHtml() : null) } catch (_) {}
      const q = new URLSearchParams()
      if (buildId) q.set('buildId', buildId)
      if (projectId) q.set('projectId', projectId)
      const artifact = await fetch(`/api/creative/export?${q.toString()}`).then(r => r.json())
      if (fullpage) artifact.screenshots = { ...(artifact.screenshots || {}), fullpage_dataUri: fullpage }
      downloadBlob(JSON.stringify(artifact, null, 2), 'application/json', `velpi-review-${safeName(businessName)}.json`)
      try { await navigator.clipboard?.writeText(artifact.instructions || 'Review this Velpi export.') } catch (_) {}
      window.open('https://chat.openai.com/', '_blank', 'noopener')
    } finally { setExporting(false) }
  }

  async function exportReviews() {
    if (exportingReviews) return
    setExportingReviews(true)
    try {
      const md = await fetch('/api/creative/export/reviews').then(r => r.text())
      downloadBlob(md, 'text/markdown', `velpi-reviews-${new Date().toISOString().slice(0, 10)}.md`)
    } finally { setExportingReviews(false) }
  }

  const savedLabel = { idle: '', saving: 'Saving…', saved: '✓ Saved', error: '⚠ Not saved' }[saved]
  const tableMissing = /schema cache|does not exist|creative_reviews/i.test(saveReason || '')

  return (
    <div style={{ maxWidth: 1140, margin: '16px auto 0', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontFamily: 'var(--font-inter, sans-serif)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {RATINGS.map(r => {
            const on = review.rating === r
            return (
              <button key={r} onClick={() => pickRating(r)} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                background: on ? `${RATING_STYLE[r]}29` : 'transparent',
                color: on ? RATING_STYLE[r] : C.dim,
                border: `${on ? 2 : 1}px solid ${on ? RATING_STYLE[r] : C.border}`,
              }}>
                {r === 'love' ? '♥ ' : r === 'needs_work' ? '⚠ ' : '~ '}{RATING_LABELS[r]}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span title={saveReason} style={{ fontSize: 11, color: saved === 'error' ? C.red : C.green, minWidth: 0 }}>{savedLabel}</span>
          <button onClick={exportReviews} disabled={exportingReviews} title="Export all saved reviews as markdown" style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.dim, borderRadius: 7, padding: '5px 10px', fontSize: 11, cursor: 'pointer', opacity: exportingReviews ? 0.6 : 1 }}>
            {exportingReviews ? '…' : '⬇ Export Reviews'}
          </button>
          <button onClick={askChatGpt} disabled={exporting || (!buildId && !projectId)} style={{ background: C.blue, border: 'none', color: '#fff', borderRadius: 7, padding: '6px 11px', fontSize: 11, cursor: 'pointer', opacity: exporting ? 0.6 : 1 }}>
            {exporting ? 'Packaging…' : 'Ask ChatGPT ↗'}
          </button>
        </div>
      </div>

      {saved === 'error' && (
        <div style={{ padding: '0 14px 10px', fontSize: 11, color: C.red }}>
          Not saved — {saveReason || 'unknown error'}.{tableMissing ? ' Run db/creative_reviews.sql in the Supabase SQL editor, then retry.' : ''}
        </div>
      )}

      {expanded && (
        <div style={{ padding: '0 14px 12px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0' }}>
            {FLAG_KEYS.map(f => {
              const on = review.flags.includes(f)
              return (
                <button key={f} onClick={() => toggleFlag(f)} style={{
                  padding: '5px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
                  background: on ? 'rgba(76,141,255,0.18)' : 'transparent',
                  color: on ? C.blue : C.dim,
                  border: `1px solid ${on ? C.blue : C.border}`,
                }}>{FLAG_LABELS[f]}</button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={review.note}
              onChange={e => setNote(e.target.value)}
              placeholder="Optional note — what to fix"
              style={{ flex: 1, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, padding: '7px 10px', fontSize: 12, fontFamily: 'inherit' }}
            />
            <button onClick={() => setExpanded(false)} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.dim, borderRadius: 7, padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

function safeName(s) { return (s || 'velpi').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40) }

function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

// Best-effort full-page screenshot for the export (returns a data URI or null).
async function captureFullPage(html) {
  if (!html) return null
  const frame = document.createElement('iframe')
  try {
    frame.style.cssText = 'position:fixed;left:-99999px;top:0;width:1440px;height:2000px;border:none;'
    frame.setAttribute('sandbox', 'allow-same-origin')
    document.body.appendChild(frame)
    frame.srcdoc = html
    await new Promise(res => { frame.onload = res })
    await new Promise(res => setTimeout(res, 1000))
    const doc = frame.contentDocument
    const fullH = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight || 0)
    frame.style.height = `${Math.min(fullH + 40, 20000)}px`
    await new Promise(res => setTimeout(res, 200))
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(doc.documentElement, { useCORS: true, backgroundColor: '#ffffff', windowWidth: 1440, width: 1440, height: Math.min(fullH, 20000), scale: 0.5, logging: false })
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch (_) {
    return null
  } finally {
    try { document.body.removeChild(frame) } catch (_) {}
  }
}
