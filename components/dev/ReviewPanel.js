'use client'
import { useEffect, useRef, useState } from 'react'
import {
  SCORE_KEYS, SCORE_LABELS, SCORE_QUESTIONS, SCORE_MIN, SCORE_MAX,
  isLowScore, emptyReview,
} from '../../lib/creative/review.mjs'

// Developer Review Star — DEV ONLY. Lives inside the device preview overlay
// (mobile or desktop), one instance per viewport, so a rating always belongs
// to the device view it was given in. Resting state is a small gold star
// whose ring reflects the saved "overall" score. Tapping it expands into a
// one-question-at-a-time stepper: five fixed rating questions (overall,
// layout, images, trust, copy) each answered 1-5, followed by one optional
// free-text note screen. Low scores (<= LOW_SCORE_MAX) require a short note
// before you can move on. Every tap autosaves (debounced) as a partial patch.
// Rehydrates from the server on mount so a build you've already rated always
// reopens on the first unanswered question — never a reset.
//
// Props: buildId, projectId, viewport ('mobile'|'desktop', required).

const C = { panel: '#121a2b', panel2: '#0d1524', border: '#22304a', text: '#e8eefc', dim: '#8ea0c0', muted: '#61708c', gold: '#e5c07b', blue: '#4c8dff', green: '#39d98a', amber: '#e5c07b', red: '#ff6675' }

const SCORE_RANGE = []
for (let v = SCORE_MIN; v <= SCORE_MAX; v++) SCORE_RANGE.push(v)

const TOTAL_STEPS = SCORE_KEYS.length // question steps are 0..TOTAL_STEPS-1; TOTAL_STEPS itself is the final free-note screen

function numberColor(n) {
  if (n >= 4) return C.green
  if (n === 3) return C.amber
  return C.red
}

function emptyPerQuestionNotes() {
  return Object.fromEntries(SCORE_KEYS.map(k => [k, '']))
}

// Compose the single opaque note string the server stores, from the
// per-question notes (only ever populated for low-score answers) plus the
// optional trailing free note. Always recomputed in full — never a delta.
function composeNote(perQuestionNotes, finalNote) {
  const lines = []
  for (const key of SCORE_KEYS) {
    const t = (perQuestionNotes[key] || '').trim()
    if (t) lines.push(`${SCORE_LABELS[key]}: ${t}`)
  }
  const ft = (finalNote || '').trim()
  if (ft) lines.push(ft)
  return lines.join('\n')
}

// Best-effort inverse of composeNote for rehydration. Any line that doesn't
// start with one of the five known "Label: " prefixes is treated as part of
// the trailing free note (leftover lines rejoined in order). Not bulletproof
// against coincidental prefix collisions in free text — acceptable for this
// internal dev tool.
function parseNote(note) {
  const perQuestionNotes = emptyPerQuestionNotes()
  const leftover = []
  const lines = (note || '').split('\n')
  for (const line of lines) {
    let matched = false
    for (const key of SCORE_KEYS) {
      const prefix = `${SCORE_LABELS[key]}: `
      if (line.startsWith(prefix)) {
        perQuestionNotes[key] = line.slice(prefix.length)
        matched = true
        break
      }
    }
    if (!matched && line) leftover.push(line)
  }
  return { perQuestionNotes, finalNote: leftover.join('\n') }
}

// Where to land after rehydrating: the first still-unanswered question, or
// the first low score (<= LOW_SCORE_MAX) that never got its required note —
// closing the panel right after a low tap must not let it slip through
// silently — or the final free-note screen if all five are properly answered.
function firstUnansweredStep(scores, perQuestionNotes) {
  for (let i = 0; i < SCORE_KEYS.length; i++) {
    const key = SCORE_KEYS[i]
    const v = scores[key]
    if (v == null) return i
    if (isLowScore(v) && !(perQuestionNotes[key] || '').trim()) return i
  }
  return TOTAL_STEPS
}

export default function ReviewPanel({ buildId, projectId, viewport }) {
  const [review, setReview] = useState(() => emptyReview(buildId, projectId, viewport))
  const [perQuestionNotes, setPerQuestionNotes] = useState(emptyPerQuestionNotes)
  const [finalNoteText, setFinalNoteText] = useState('')
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0) // 0..TOTAL_STEPS-1 = questions, TOTAL_STEPS = final free-note screen
  const [saved, setSaved] = useState('idle') // idle | saving | saved | error
  const [saveReason, setSaveReason] = useState('')
  const timer = useRef(null)
  const pending = useRef({})

  useEffect(() => {
    setOpen(false)
    setStep(0)
    if (!buildId || !viewport) return
    fetch(`/api/creative/review?buildId=${encodeURIComponent(buildId)}&viewport=${viewport}`)
      .then(r => r.json())
      .then(d => {
        if (d?.ok && d.review) {
          setReview(d.review)
          const { perQuestionNotes: pqn, finalNote } = parseNote(d.review.note || '')
          setPerQuestionNotes(pqn)
          setFinalNoteText(finalNote)
          setStep(firstUnansweredStep(d.review.scores || {}, pqn))
        }
      })
      .catch(() => {})
  }, [buildId, viewport])

  function scheduleSave(patch) {
    if (!buildId && !projectId) return
    pending.current = {
      ...pending.current,
      ...patch,
      scores: patch.scores ? { ...pending.current.scores, ...patch.scores } : pending.current.scores,
    }
    setSaved('saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const toSend = pending.current
      pending.current = {}
      try {
        const body = { buildId, projectId, viewport }
        if (toSend.scores) body.scores = toSend.scores
        if (typeof toSend.note === 'string') body.note = toSend.note
        const r = await fetch('/api/creative/review', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }).then(x => x.json())
        // Reflect the REAL persistence result — the request can be ok while the
        // DB write failed (e.g. the creative_reviews table hasn't been created).
        if (r?.ok && r.persisted?.saved) { setSaved('saved'); setSaveReason('') }
        else { setSaved('error'); setSaveReason(r?.persisted?.reason || r?.error || 'not persisted') }
      } catch (_) { setSaved('error'); setSaveReason('network error') }
    }, 500)
  }

  function pickScore(key, n) {
    setReview(prev => ({ ...prev, scores: { ...prev.scores, [key]: n } }))
    scheduleSave({ scores: { [key]: n } })
  }
  function updatePerQuestionNote(key, text) {
    const next = { ...perQuestionNotes, [key]: text }
    setPerQuestionNotes(next)
    scheduleSave({ note: composeNote(next, finalNoteText) })
  }
  function updateFinalNote(text) {
    setFinalNoteText(text)
    scheduleSave({ note: composeNote(perQuestionNotes, text) })
  }

  const overall = review.scores?.overall
  const ringColor = overall == null ? 'rgba(255,255,255,0.35)' : overall >= 4 ? C.green : overall === 3 ? C.amber : C.red
  const savedLabel = { idle: '', saving: 'Saving…', saved: '✓ Saved', error: '⚠ Not saved' }[saved]

  const onQuestion = step < TOTAL_STEPS
  const key = onQuestion ? SCORE_KEYS[step] : null
  const label = onQuestion ? SCORE_LABELS[key] : null
  const subtitle = onQuestion ? SCORE_QUESTIONS[key] : null
  const score = onQuestion ? review.scores?.[key] : null
  const required = onQuestion && typeof score === 'number' && isLowScore(score)
  const noteText = onQuestion ? (perQuestionNotes[key] || '') : ''
  const hasNoteText = !!noteText.trim()
  const showNoteBox = onQuestion && (required || hasNoteText)
  const canAdvance = onQuestion && typeof score === 'number' && (!isLowScore(score) || hasNoteText)

  return (
    <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 5, fontFamily: 'var(--font-inter, sans-serif)' }} onClick={e => e.stopPropagation()}>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title={overall != null ? `Overall: ${overall}/${SCORE_MAX}` : 'Rate this view'}
          style={{
            width: 40, height: 40, borderRadius: '50%', background: C.panel, cursor: 'pointer',
            border: `2px solid ${ringColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(0,0,0,0.4)', fontSize: 18, color: C.gold, lineHeight: 1,
          }}
        >★</button>
      )}

      {open && (
        <div style={{ width: 270, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: C.dim, letterSpacing: '0.03em', textTransform: 'uppercase' }}>★ Rate {viewport}</span>
              <span style={{ fontSize: 10, color: C.muted }}>
                {onQuestion ? `Question ${step + 1} of ${TOTAL_STEPS}` : 'Additional notes'}
              </span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>

          <div style={{ padding: '10px 10px 4px' }}>
            {onQuestion ? (
              <>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: subtitle ? 2 : 8 }}>{label}</div>
                {subtitle && <div style={{ fontSize: 11, color: C.dim, marginBottom: 8 }}>{subtitle}</div>}
                <div style={{ display: 'flex', gap: 6, marginBottom: showNoteBox ? 8 : 0 }}>
                  {SCORE_RANGE.map(n => {
                    const on = score === n
                    const nColor = numberColor(n)
                    return (
                      <button key={n} onClick={() => pickScore(key, n)} style={{
                        width: 36, height: 32, borderRadius: 8, fontSize: 13, cursor: 'pointer',
                        background: on ? `${nColor}29` : 'transparent',
                        color: on ? nColor : C.dim,
                        border: `${on ? 2 : 1}px solid ${on ? nColor : C.border}`,
                      }}>{n}</button>
                    )
                  })}
                </div>
                {showNoteBox && (
                  <textarea
                    value={noteText}
                    onChange={e => updatePerQuestionNote(key, e.target.value)}
                    placeholder={required ? "What's wrong? (required)" : 'Optional note'}
                    rows={2}
                    style={{ width: '100%', background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, padding: '7px 9px', fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 8 }}>Anything else?</div>
                <textarea
                  value={finalNoteText}
                  onChange={e => updateFinalNote(e.target.value)}
                  placeholder="Optional note"
                  rows={3}
                  style={{ width: '100%', background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, padding: '7px 9px', fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 10px' }}>
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 12,
                cursor: step === 0 ? 'not-allowed' : 'pointer',
                background: 'transparent', color: step === 0 ? C.muted : C.dim,
                border: `1px solid ${C.border}`, opacity: step === 0 ? 0.5 : 1,
              }}
            >‹ Back</button>
            {onQuestion && (
              <button
                onClick={() => setStep(s => Math.min(TOTAL_STEPS, s + 1))}
                disabled={!canAdvance}
                style={{
                  padding: '6px 10px', borderRadius: 8, fontSize: 12,
                  cursor: canAdvance ? 'pointer' : 'not-allowed',
                  background: 'transparent', color: canAdvance ? C.blue : C.muted,
                  border: `1px solid ${canAdvance ? C.blue : C.border}`, opacity: canAdvance ? 1 : 0.5,
                }}
              >Next ›</button>
            )}
          </div>

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
