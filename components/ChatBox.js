'use client'
import { useState, useRef, useEffect } from 'react'

export default function ChatBox({ messages, onSend, loading, extraButtons }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [messages])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    onSend(text)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #152840', borderRadius: 10, overflow: 'hidden', background: '#080f1e' }}>
      {/* message list */}
      <div style={{ minHeight: 300, maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : m.role === 'system' ? 'center' : 'flex-start',
            }}
          >
            {m.role === 'system' ? (
              <div style={{
                background: 'rgba(0,229,200,0.07)',
                border: '1px solid rgba(0,229,200,0.2)',
                color: '#00e5c8',
                padding: '0.5rem 1rem',
                borderRadius: 8,
                fontSize: '0.72rem',
                fontFamily: 'var(--font-ibm-plex-mono)',
                textAlign: 'center',
              }}>
                {m.content}
              </div>
            ) : m.role === 'user' ? (
              <div style={{
                background: '#1d6ff5',
                color: 'white',
                padding: '0.65rem 1rem',
                borderRadius: 10,
                maxWidth: '78%',
                fontSize: '0.82rem',
                lineHeight: 1.5,
              }}>
                {m.content}
              </div>
            ) : (
              <div style={{
                background: '#0b1525',
                border: '1px solid #152840',
                color: '#c8dcf5',
                padding: '0.65rem 1rem',
                borderRadius: 10,
                maxWidth: '82%',
                fontSize: '0.82rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {m.content}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#0b1525', border: '1px solid #152840', color: '#4a6a8a', padding: '0.65rem 1rem', borderRadius: 10, fontSize: '0.8rem' }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* extra buttons row */}
      {extraButtons && (
        <div style={{ padding: '0 1rem 0.75rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {extraButtons}
        </div>
      )}

      {/* input row */}
      <div style={{ display: 'flex', gap: 8, padding: '0.75rem', borderTop: '1px solid #0e1e35' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          style={{
            flex: 1,
            height: 44,
            background: '#060e1c',
            border: '1px solid #152840',
            borderRadius: 8,
            padding: '0.6rem 0.75rem',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.8rem',
            resize: 'none',
            color: '#c8dcf5',
          }}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{
            background: loading ? '#152840' : '#1d6ff5',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '0 1rem',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-ibm-plex-mono)',
            letterSpacing: '0.04em',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          SEND
        </button>
      </div>
    </div>
  )
}
