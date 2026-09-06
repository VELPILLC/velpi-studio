'use client'

// The guided design conversation — one decision per screen.
//
// This is where the decisions that used to be made by a domain hash (which
// design system, which section blueprints, which motion, which palette) get
// handed to a person instead. Every option shown here is a real catalog entry
// the builder can execute; the agent still writes the site, the answers just
// tell it what to commit to.

import { useState } from 'react'

const BLUE = '#2990fa'
const PANEL = 'rgba(10, 22, 40, 0.82)'
const BORDER = 'rgba(41, 144, 250, 0.16)'
const GREEN = '#39d98a'

export default function GuidedPanel({ questions = [], onDone, onSkip, source }) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})

  if (!questions.length) return null
  const q = questions[Math.min(idx, questions.length - 1)]
  const chosen = answers[q.id]
  const isLast = idx >= questions.length - 1

  const choose = (optId) => {
    const next = { ...answers, [q.id]: optId }
    setAnswers(next)
    if (isLast) onDone(next)
    else setIdx(idx + 1)
  }

  return (
    <div style={{
      maxWidth: 1140, margin: '18px auto 0', background: PANEL,
      border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>
          {q.q}
        </div>
        <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>
          {idx + 1} / {questions.length}
        </div>
      </div>

      {q.why && (
        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', marginTop: 6, lineHeight: 1.5 }}>
          {q.why}
        </div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: 12, marginTop: 16,
      }}>
        {q.options.map(o => {
          const active = chosen === o.id
          return (
            <button
              key={o.id}
              onClick={() => choose(o.id)}
              style={{
                textAlign: 'left', cursor: 'pointer',
                background: active ? 'rgba(41,144,250,0.14)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? BLUE : BORDER}`,
                borderRadius: 12, padding: 14, color: '#fff', font: 'inherit',
              }}
            >
              <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: '0.86rem', marginBottom: 5 }}>
                {o.label}
              </div>
              <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.74rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>
                {o.desc}
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
          style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: 8,
            padding: '8px 14px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.7rem',
            cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.4 : 1,
          }}
        >← Back</button>

        {/* Answering fewer questions is always allowed: whatever is left
            unanswered simply stays the agent's own call, which is the
            behavior of the normal one-shot path. */}
        <button
          onClick={() => onDone(answers)}
          style={{
            background: 'transparent', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.7)',
            borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.7rem', cursor: 'pointer',
          }}
        >Build with what I've chosen</button>

        <button
          onClick={onSkip}
          style={{
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.68rem', cursor: 'pointer', textDecoration: 'underline',
          }}
        >Let the agent decide everything</button>

        {source === 'fallback' && (
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', color: '#f5c164', marginLeft: 'auto' }}>
            Showing plain option names — the description writer was unavailable.
          </span>
        )}
        {Object.keys(answers).length > 0 && (
          <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: '0.68rem', color: GREEN, marginLeft: source === 'fallback' ? 0 : 'auto' }}>
            {Object.keys(answers).length} chosen
          </span>
        )}
      </div>
    </div>
  )
}
