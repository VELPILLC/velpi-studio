'use client'
import { useEffect, useRef, useState } from 'react'
import { RATINGS, RATING_LABELS, FLAG_KEYS, FLAG_LABELS } from '../../lib/creative/review.mjs'
import { emptyReview } from '../../lib/creative/review.mjs'

// Developer Review Star — DEV ONLY. Lives inside the device preview overlay
// (mobile or desktop), one instance per viewport, so a rating always belongs
// to the device view it was given in. Resting state is a small gold star;
// tapping it expands to the same fast Love/Okay/Needs-Work + flag-row flow as
// before. Rehydrates from the server on mount so a build you've already rated
// always reopens showing that saved state, never a reset.
//
// Props: buildId, projectId, viewport ('mobile'|'desktop', required).

const C = { panel: '#121a2b', panel2: '#0d1524', border: '#22304a', text: '#e8eefc', dim: '#8ea0c0', muted: '#61708c', gold: '#e5c07b', blue: '#4c8dff', green: '#39d98a', amber: '#e5c07b', red: '#ff6675' }
const RATING_STYLE = { love: C.green, okay: C.amber, needs_work: C.red }

export default function ReviewPanel({ buildId, projectId, viewport }) {
  const [review, setReview] = useState(() => emptyReview(buildId, projectId, viewport))
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState('idle') // idle | saving | saved | error
  const [saveReason, setSaveReason] = useState('')
  const timer = useRef(null)

  useEffect(() => {
    setOpen(false)
    setExpanded(false)
    if (!buildId || !viewport) return
    fetch(`/api/creative/review?buildId=${encodeURIComponent(buildId)}&viewport=${viewport}`)
      .then(r => r.json())
      .then(d => { if (d?.ok && d.review) setReview(d.review) })
      .catch(() => {})
  }, [buildId, viewport])

  function scheduleSave(next) {
    if (!buildId && !projectId) return
    setSaved('saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch('/api/creative/review', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buildId, projectId, viewport, rating: next.rating, flags: next.flags, note: next.note }),
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

  const ringColor = review.rating ? RATING_STYLE[review.rating] : 'rgba(255,255,255,0.35)'
  const savedLabel = { idle: '', saving: 'Saving…', saved: '✓ Saved', error: '⚠ Not saved' }[saved]

  return (
    <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 5, fontFamily: 'var(--font-inter, sans-serif)' }} onClick={e => e.stopPropagation()}>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title={review.rating ? `Rated: ${RATING_LABELS[review.rating]}` : 'Rate this view'}
          style={{
            width: 40, height: 40, borderRadius: '50%', background: C.panel, cursor: 'pointer',
            border: `2px solid ${ringColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(0,0,0,0.4)', fontSize: 18, color: C.gold, lineHeight: 1,
          }}
        >★</button>
      )}

      {open && (
        <div style={{ width: 260, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 11, color: C.dim, letterSpacing: '0.03em', textTransform: 'uppercase' }}>★ Rate {viewport}</span>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '10px 10px 0', flexWrap: 'wrap' }}>
            {RATINGS.map(r => {
              const on = review.rating === r
              return (
                <button key={r} onClick={() => pickRating(r)} style={{
                  padding: '6px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  background: on ? `${RATING_STYLE[r]}29` : 'transparent',
                  color: on ? RATING_STYLE[r] : C.dim,
                  border: `${on ? 2 : 1}px solid ${on ? RATING_STYLE[r] : C.border}`,
                }}>
                  {r === 'love' ? '♥ ' : r === 'needs_work' ? '⚠ ' : '~ '}{RATING_LABELS[r]}
                </button>
              )
            })}
          </div>

          {expanded && (
            <div style={{ padding: '10px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {FLAG_KEYS.map(f => {
                  const on = review.flags.includes(f)
                  return (
                    <button key={f} onClick={() => toggleFlag(f)} style={{
                      padding: '5px 9px', borderRadius: 999, fontSize: 11, cursor: 'pointer',
                      background: on ? 'rgba(76,141,255,0.18)' : 'transparent',
                      color: on ? C.blue : C.dim,
                      border: `1px solid ${on ? C.blue : C.border}`,
                    }}>{FLAG_LABELS[f]}</button>
                  )
                })}
              </div>
              <input
                value={review.note}
                onChange={e => setNote(e.target.value)}
                placeholder="Optional note — what to fix"
                style={{ width: '100%', background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, padding: '7px 9px', fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div style={{ padding: '0 10px 10px' }}>
            <span title={saveReason} style={{ fontSize: 10, color: saved === 'error' ? C.red : C.green }}>{savedLabel}</span>
            {saved === 'error' && (
              <div style={{ marginTop: 4, fontSize: 10, color: C.red }}>Not saved — {saveReason || 'unknown error'}.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
