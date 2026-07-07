'use client'
import { useEffect, useRef, useState } from 'react'
import {
  SCORE_DIMENSIONS, SCORE_LABELS, TAG_KEYS, TAG_LABELS,
  REVIEW_FLAGS, emptyReview,
} from '../../lib/creative/review.mjs'

// Developer Review Panel — DEV ONLY. Docked below the generated site. Lets the
// operator score / flag / tag / note a generation in under 30 seconds and
// export an "Ask ChatGPT" package. Autosaves to the Creative Directive for the
// run. Rendered by Studio ONLY when isDevReviewClient() is true; never in prod.
//
// Props: runId (CIL assembled-CDO id | null), projectId (auto-saved project id),
// businessName, getRenderedHtml() -> html string (for the optional screenshot).

const C = { panel: '#121a2b', panel2: '#0d1524', border: '#22304a', text: '#e8eefc', dim: '#8ea0c0', muted: '#61708c', blue: '#4c8dff', green: '#39d98a', amber: '#e5c07b', red: '#ff6675' }

export default function ReviewPanel({ runId, projectId, businessName, getRenderedHtml }) {
  const [review, setReview] = useState(() => emptyReview(runId, projectId))
  const [open, setOpen] = useState(true)
  const [saved, setSaved] = useState('idle') // idle | saving | saved | error
  const [exporting, setExporting] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    setReview(emptyReview(runId, projectId))
    if (!runId) return
    fetch(`/api/creative/review?runId=${encodeURIComponent(runId)}`)
      .then(r => r.json()).then(d => { if (d?.ok && d.review) setReview(d.review) }).catch(() => {})
  }, [runId, projectId])

  function patch(p) {
    setReview(prev => {
      const next = { ...prev, ...p, scores: { ...prev.scores, ...(p.scores || {}) }, tags: { ...prev.tags, ...(p.tags || {}) } }
      // strip null-cleared keys
      if (p.scores) for (const k in p.scores) if (p.scores[k] == null) delete next.scores[k]
      if (p.tags) for (const k in p.tags) if (p.tags[k] == null) delete next.tags[k]
      scheduleSave(next)
      return next
    })
  }
  function scheduleSave(next) {
    if (!runId && !projectId) return
    setSaved('saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch('/api/creative/review', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId, projectId, flag: next.flag, scores: next.scores, tags: next.tags, notes: next.notes }),
        }).then(x => x.json())
        setSaved(r?.ok ? 'saved' : 'error')
      } catch (_) { setSaved('error') }
    }, 600)
  }

  function setFlag(f) { patch({ flag: review.flag === f ? null : f }) }
  function setScore(dim, v) { patch({ scores: { [dim]: review.scores[dim] === v ? null : v } }) }
  function setTag(tag, verdict) { patch({ tags: { [tag]: review.tags[tag] === verdict ? null : verdict } }) }

  async function askChatGpt() {
    if (exporting || (!runId && !projectId)) return
    setExporting(true)
    try {
      let fullpage = null
      try { fullpage = await captureFullPage(getRenderedHtml ? getRenderedHtml() : null) } catch (_) {}
      const q = new URLSearchParams()
      if (runId) q.set('runId', runId)
      if (projectId) q.set('projectId', projectId)
      const artifact = await fetch(`/api/creative/export?${q.toString()}`).then(r => r.json())
      if (fullpage) artifact.screenshots = { ...(artifact.screenshots || {}), fullpage_dataUri: fullpage }
      const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `velpi-review-${(businessName || 'velpi').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40)}.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      try { await navigator.clipboard?.writeText(artifact.instructions || 'Review this Velpi CIL export.') } catch (_) {}
      window.open('https://chat.openai.com/', '_blank', 'noopener')
    } finally { setExporting(false) }
  }

  const flagStyle = (f, on) => ({
    flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, cursor: 'pointer',
    background: on ? (f === 'love' ? 'rgba(57,217,138,0.16)' : f === 'dislike' ? 'rgba(255,102,117,0.16)' : 'rgba(229,192,123,0.16)') : 'transparent',
    color: on ? (f === 'love' ? C.green : f === 'dislike' ? C.red : C.amber) : C.dim,
    border: `${on ? 2 : 1}px solid ${on ? (f === 'love' ? C.green : f === 'dislike' ? C.red : C.amber) : C.border}`,
  })
  const savedLabel = { idle: '', saving: 'Saving…', saved: '✓ Saved', error: '⚠ Save failed' }[saved]

  return (
    <div style={{ maxWidth: 1140, margin: '16px auto 0', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, color: C.text, fontFamily: 'var(--font-inter, sans-serif)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: open ? `1px solid ${C.border}` : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>🧪 Dev review</span>
          <span style={{ fontSize: 12, color: C.muted, fontFamily: 'var(--font-ibm-plex-mono, monospace)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {businessName || '—'} · run {runId ? String(runId).slice(0, 8) : '(enable shadow mode)'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: saved === 'error' ? C.red : C.green }}>{savedLabel}</span>
          <button onClick={askChatGpt} disabled={exporting || (!runId && !projectId)} style={{ background: C.blue, border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', opacity: exporting ? 0.6 : 1 }}>
            {exporting ? 'Packaging…' : 'Ask ChatGPT ↗'}
          </button>
          <button onClick={() => setOpen(o => !o)} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.dim, borderRadius: 6, padding: '5px 9px', fontSize: 12, cursor: 'pointer' }}>{open ? '▲' : '▼'}</button>
        </div>
      </div>

      {!runId && (
        <div style={{ padding: '8px 16px', fontSize: 12, color: C.amber }}>
          No Creative Directive for this run — set CIL_MODE=shadow and NEXT_PUBLIC_CIL_MODE=shadow to link reviews to a directive. (Reviews still save against the project.)
        </div>
      )}

      {open && (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {REVIEW_FLAGS.map(f => (
              <button key={f} onClick={() => setFlag(f)} style={flagStyle(f, review.flag === f)}>
                {f === 'love' ? '♥ Love' : f === 'regenerate' ? '⟳ Regenerate' : '👎 Dislike'}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Scores (1–10)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 24px', marginBottom: 16 }}>
            {SCORE_DIMENSIONS.map(dim => (
              <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                <span style={{ width: 140, fontSize: 12, color: C.dim, flexShrink: 0 }}>{SCORE_LABELS[dim]}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                    <button key={v} onClick={() => setScore(dim, v)} title={String(v)} style={{
                      width: 17, height: 20, fontSize: 10, borderRadius: 3, cursor: 'pointer',
                      background: review.scores[dim] === v ? C.blue : 'transparent',
                      color: review.scores[dim] === v ? '#fff' : (review.scores[dim] >= v ? C.blue : C.muted),
                      border: `1px solid ${review.scores[dim] >= v ? C.blue : C.border}`,
                    }}>{v}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Section tags (♥ love · ✎ needs work · ✕ dislike)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 16 }}>
            {TAG_KEYS.map(tag => (
              <div key={tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 8px' }}>
                <span style={{ fontSize: 12 }}>{TAG_LABELS[tag]}</span>
                <span style={{ display: 'flex', gap: 4 }}>
                  {[['love', '♥', C.green], ['needs_work', '✎', C.amber], ['dislike', '✕', C.red]].map(([verdict, icon, col]) => (
                    <button key={verdict} onClick={() => setTag(tag, verdict)} aria-label={`${tag} ${verdict}`} style={{
                      width: 24, height: 22, borderRadius: 5, fontSize: 12, cursor: 'pointer',
                      background: review.tags[tag] === verdict ? col : 'transparent',
                      color: review.tags[tag] === verdict ? '#0b1220' : C.muted,
                      border: `1px solid ${review.tags[tag] === verdict ? col : C.border}`,
                    }}>{icon}</button>
                  ))}
                </span>
              </div>
            ))}
          </div>

          <textarea
            value={review.notes}
            onChange={e => patch({ notes: e.target.value })}
            placeholder="Optional notes — what to fix, what worked"
            style={{ width: '100%', minHeight: 46, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
          />
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Autosaves to the Creative Directive for this run. Development only.</div>
        </div>
      )}
    </div>
  )
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
