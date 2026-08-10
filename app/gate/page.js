'use client'

// Minimal password-entry page — plain, no design system. Gated pages/API
// routes redirect here (middleware.js) with ?next=<original path>.

import { useState } from 'react'

export default function GatePage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (!password || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Incorrect password.')
        setSubmitting(false)
        return
      }
      const next = new URLSearchParams(window.location.search).get('next') || '/'
      window.location.href = next
    } catch (_) {
      setError('Could not reach the server. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', background: '#0b0d10', color: '#e8eaed' }}>
      <form onSubmit={onSubmit} style={{ width: 280, padding: 24, border: '1px solid #2a2e37', borderRadius: 8, background: '#151821' }}>
        <p style={{ margin: '0 0 12px', fontSize: 14, opacity: 0.8 }}>Enter password</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', boxSizing: 'border-box', borderRadius: 4, border: '1px solid #3a3f4a', background: '#0b0d10', color: '#e8eaed', marginBottom: 10, fontSize: 14 }}
        />
        <button
          type="submit"
          disabled={submitting || !password}
          style={{ width: '100%', padding: '9px 10px', borderRadius: 4, border: 'none', background: submitting || !password ? '#1f4e85' : '#2990fa', color: '#fff', fontSize: 14, cursor: submitting || !password ? 'default' : 'pointer' }}
        >
          {submitting ? 'Checking…' : 'Enter'}
        </button>
        {error && <p style={{ color: '#ff8a8a', fontSize: 13, marginTop: 10, marginBottom: 0 }}>{error}</p>}
      </form>
    </div>
  )
}
