'use client'

// Dedicated device-preview PAGE — replaces the old popup/modal previews.
// Both modes share this one route (?mode=mobile|desktop) and render the
// EXACT substituted HTML a client would see, with no height clamping and no
// scaling — the old modal's min(844px, 78vh) frame was precisely the
// divergence that made popups differ from the real page.
//
// The HTML arrives from the opener tab via a postMessage handshake
// (sessionStorage is per-tab and multi-MB session HTML with data-URI images
// doesn't reliably survive the new-tab copy): this page announces readiness,
// the Studio tab answers with { html, label, buildId, projectId }. A
// same-origin check guards both directions. The payload is cached in this
// tab's own sessionStorage so a refresh keeps working.
//
// Inspect & Fix mode adds a second, opt-in rendering of the same HTML with
// per-element data-vid attributes injected, so the reviewer can click any
// element and send it back to the Studio tab to be reworked. Ids exist ONLY
// in this transient view — never in what gets saved, exported, or served
// publicly.

import { useEffect, useMemo, useRef, useState } from 'react'
import InspectFixPanel from '../../components/InspectFixPanel'
import { injectElementIds } from '../../lib/elementIds.mjs'

const CACHE_KEY = 'velpi_device_preview_payload'

export default function DevicePreviewPage() {
  const [payload, setPayload] = useState(null)
  const [mode, setMode] = useState('mobile')
  const [waited, setWaited] = useState(false)
  const [inspect, setInspect] = useState(false)
  const [frameLoads, setFrameLoads] = useState(0)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const gotRef = useRef(false)
  const frameRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setMode(params.get('mode') === 'desktop' ? 'desktop' : 'mobile')

    // Refresh path: this tab already holds the payload.
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        setPayload(JSON.parse(cached))
        gotRef.current = true
      }
    } catch (_) {}

    const onMessage = e => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'velpi-reevaluate-result') {
        setBusy(false)
        setResult({ ok: !!e.data.ok, message: e.data.message || (e.data.ok ? 'Applied.' : 'Nothing was changed.') })
        return
      }
      if (e.data?.type !== 'velpi-preview-html' || typeof e.data.html !== 'string') return
      gotRef.current = true
      const p = {
        html: e.data.html,
        label: e.data.label || 'Preview',
        buildId: e.data.buildId || null,
        projectId: e.data.projectId || null,
        vslotByVid: e.data.vslotByVid || null,
        canInspect: !!e.data.canInspect,
      }
      setPayload(p)
      if (e.data.reevaluateResult) {
        setBusy(false)
        setResult(e.data.reevaluateResult)
      }
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(p)) } catch (_) { /* oversized html — live handshake alone is fine */ }
    }
    window.addEventListener('message', onMessage)
    if (window.opener) {
      try { window.opener.postMessage({ type: 'velpi-preview-ready' }, window.location.origin) } catch (_) {}
    }
    const t = setTimeout(() => setWaited(true), 2500)
    return () => { window.removeEventListener('message', onMessage); clearTimeout(t) }
  }, [])

  // Ids are injected into the ALREADY-SUBSTITUTED html on purpose: vid
  // numbering depends only on tag structure, never on attribute values, so
  // this yields exactly the same vNN the Studio tab derives from the raw
  // token-bearing template — no need to ship a second copy of the document.
  const idedHtml = useMemo(
    () => (payload?.html && inspect ? injectElementIds(payload.html).html : null),
    [payload?.html, inspect],
  )

  const canInspect = !!(payload?.canInspect && typeof window !== 'undefined' && window.opener && !window.opener.closed)

  function submitReevaluate({ selections, skippedScreenshots }) {
    if (!window.opener || window.opener.closed) {
      setResult({ ok: false, message: 'The Studio tab was closed — reopen the preview from Studio to use Inspect & Fix.' })
      return
    }
    setBusy(true)
    setResult(null)
    try {
      window.opener.postMessage({ type: 'velpi-reevaluate-request', selections, skippedScreenshots, viewport: mode }, window.location.origin)
    } catch (e) {
      setBusy(false)
      setResult({ ok: false, message: `Could not reach the Studio tab: ${e.message}` })
    }
  }

  const isMobile = mode !== 'desktop'
  const switchHref = `/device-preview?mode=${isMobile ? 'desktop' : 'mobile'}`

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1c', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 14px', flexShrink: 0 }}>
        <span style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 600, fontSize: '0.82rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isMobile ? '📱' : '🖥'} {payload?.label || 'Preview'} · {isMobile ? '390px' : 'full width'}
        </span>
        <span style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {canInspect && (
            <button
              onClick={() => { setInspect(v => !v); setResult(null) }}
              style={{
                fontFamily: 'monospace', fontSize: '0.68rem', cursor: 'pointer',
                color: inspect ? '#fff' : '#ff9db1',
                background: inspect ? '#ff4d6d' : 'transparent',
                border: `1px solid ${inspect ? '#ff4d6d' : 'rgba(255,157,177,0.45)'}`,
                borderRadius: 6, padding: '4px 10px',
              }}
            >{inspect ? '✓ Inspecting' : '🔍 Inspect & Fix'}</button>
          )}
          <a
            href={switchHref}
            style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#7ab5ff', textDecoration: 'none', border: '1px solid rgba(122,181,255,0.4)', borderRadius: 6, padding: '4px 10px' }}
          >
            {isMobile ? '🖥 Desktop' : '📱 Mobile'}
          </a>
          <button
            onClick={() => { if (window.opener && !window.opener.closed) window.close(); else window.location.href = '/' }}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 12px', fontSize: '0.72rem', cursor: 'pointer' }}
          >✕ Close</button>
        </span>
      </div>

      {payload ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minHeight: 0, padding: isMobile ? '0 0 10px' : 0 }}>
          <div style={{
            width: isMobile ? 'min(390px, 100vw)' : '100%',
            flex: 1, maxWidth: isMobile ? 390 : 'none',
            position: 'relative',
            border: isMobile ? '1px solid rgba(255,255,255,0.15)' : 'none',
            borderRadius: isMobile ? 12 : 0,
            overflow: 'hidden', background: '#fff',
          }}>
            <iframe
              ref={frameRef}
              title={`${mode} preview`}
              srcDoc={inspect && idedHtml ? idedHtml : payload.html}
              sandbox="allow-same-origin"
              onLoad={() => setFrameLoads(n => n + 1)}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#fff', cursor: inspect ? 'crosshair' : 'auto' }}
            />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.55)', fontFamily: 'system-ui, sans-serif', fontSize: '0.85rem', textAlign: 'center', padding: 24 }}>
          {waited
            ? 'No preview content received. Open this page from the Preview buttons in Velpi Studio.'
            : 'Loading preview…'}
        </div>
      )}

      {/* Remounted per iframe load so its listeners always bind to the live document. */}
      {inspect && payload && frameLoads > 0 && (
        <InspectFixPanel
          key={frameLoads}
          frameRef={frameRef}
          vslotByVid={payload.vslotByVid || {}}
          onSubmit={submitReevaluate}
          busy={busy}
          result={result}
          onClose={() => setInspect(false)}
        />
      )}
    </div>
  )
}
