'use client'

// Inspect & Fix — click anything in the rendered preview and send it back to
// the Studio tab to be reworked.
//
// How it reaches into the preview: it doesn't, deliberately. Generated sites
// now ship real JavaScript (WebGL heroes, scroll behavior, CDN libraries), so
// the preview frame needs allow-scripts for the page to be honest — and
// allow-scripts alongside allow-same-origin would give that page, which is
// LLM-authored and partly derived from scraped third-party sites, full
// same-origin access to this Studio tab.
//
// So the frame is opaque-origin (allow-scripts, NO allow-same-origin) and
// this panel talks to it purely over postMessage via lib/previewBridge.mjs:
// hover/select/reflow come in as messages, crops are rendered inside the
// frame and returned as base64. The highlight boxes are still plain divs in
// THIS document, positioned over the iframe from the reported rects.
//
// (The previous design read frame.contentDocument directly. That only worked
// while generated pages were contractually JS-free.)
//
// Every element in the iframe carries data-vid="vNN" (lib/elementIds.mjs),
// assigned in document order. Because that numbering depends only on tag
// structure and never on attribute values, the ids seen here match the ids
// the Studio tab computes from the raw token-bearing template — which is what
// lets a click here address the right element in the HTML sent to the model.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { onBridgeMessage, sendToBridge } from '../lib/previewBridge.mjs'

const MAX_SCREENSHOTS = 4 // vision crops are the expensive part of a fix; cap and disclose
const CROP_TIMEOUT_MS = 8000 // a frame that never answers must not hang the submit

const box = (r) => ({ left: r.left, top: r.top, width: r.width, height: r.height })

export default function InspectFixPanel({ frameRef, token, vslotByVid = {}, onSubmit, busy, result, onClose }) {
  const [hover, setHover] = useState(null)      // { vid, rect }
  const [selected, setSelected] = useState([])  // [{ vid, tag, label, note }]
  const [rects, setRects] = useState({})        // vid -> viewport-space box
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  // Rects arrive from inside the frame relative to ITS viewport; the overlay
  // divs are position:fixed in this document. Adding the iframe's own offset
  // converts between the two, and because the reported rect already accounts
  // for the frame's internal scroll, this stays correct as the preview
  // scrolls — the bridge just has to re-report on scroll.
  const toParentSpace = useCallback((rect) => {
    const frame = frameRef.current
    if (!frame || !rect || rect.width < 1 || rect.height < 1) return null
    const f = frame.getBoundingClientRect()
    return { left: f.left + rect.left, top: f.top + rect.top, width: rect.width, height: rect.height }
  }, [frameRef])

  const describe = useCallback((node) => {
    if (!node) return ''
    if (node.tag === 'img') return node.alt?.trim() || 'image'
    if (node.text) return node.text.slice(0, 60)
    return (node.classes && node.classes[0]) || node.tag
  }, [])

  // Everything now arrives as messages from the isolated frame. The parent
  // can no longer read its DOM at all (that is the point — see the header),
  // so hover, selection, reflow and crops are all message-driven.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame || !token) return

    const stop = onBridgeMessage(frame, token, msg => {
      if (msg.event === 'hover') {
        if (!msg.node) return setHover(null)
        const rect = toParentSpace(msg.node.rect)
        if (rect) setHover({ vid: msg.node.vid, rect })
        return
      }
      if (msg.event === 'select') {
        const node = msg.node
        setSelected(prev => prev.some(s => s.vid === node.vid)
          ? prev.filter(s => s.vid !== node.vid)
          : [...prev, { vid: node.vid, tag: node.tag, label: describe(node), note: '' }])
        return
      }
      if (msg.event === 'moved' || msg.event === 'ready') {
        // A late-decoding photo reflows everything below it and would strand
        // the highlights over the wrong content, so the frame re-reports on
        // scroll, resize and image load.
        const byVid = Object.fromEntries((msg.nodes || []).map(n => [n.vid, n]))
        setSelected(prevSel => {
          const next = {}
          for (const s of prevSel) {
            const r = byVid[s.vid] ? toParentSpace(byVid[s.vid].rect) : null
            if (r) next[s.vid] = r
          }
          setRects(next)
          return prevSel
        })
        return
      }
      if (msg.event === 'parentOf' && msg.node) {
        const p = msg.node
        setSelected(prev => {
          if (prev.some(s => s.vid === p.vid)) return prev.filter(s => s.vid !== msg.of)
          return prev.map(s => (s.vid === msg.of
            ? { vid: p.vid, tag: p.tag, label: describe(p), note: s.note }
            : s))
        })
      }
    })

    // The frame reports its own scroll; this covers the parent window moving
    // the iframe itself underneath the overlays.
    const onParentMove = () => sendToBridge(frame, token, { request: 'nodes' })
    window.addEventListener('resize', onParentMove)
    window.addEventListener('scroll', onParentMove, true)

    return () => {
      stop()
      window.removeEventListener('resize', onParentMove)
      window.removeEventListener('scroll', onParentMove, true)
    }
  }, [frameRef, token, toParentSpace, describe])

  useEffect(() => {
    const frame = frameRef.current
    if (frame && token) sendToBridge(frame, token, { request: 'nodes' })
  }, [selected, frameRef, token])

  // Replace a selection with its nearest addressable ancestor — the way to
  // grab "this whole section" after clicking a headline inside it. The frame
  // answers with the parent node; the swap happens in the handler above.
  const widen = (vid) => {
    const frame = frameRef.current
    if (frame && token) sendToBridge(frame, token, { request: 'parentOf', vid })
  }

  const setNote = (vid, note) => setSelected(prev => prev.map(s => (s.vid === vid ? { ...s, note } : s)))

  async function submit() {
    const frame = frameRef.current
    if (!frame || !token || !selected.length) return

    // Screenshot only what actually needs a visual diagnosis: a selection
    // with a note already says what's wrong, so a crop would add cost and
    // latency for nothing.
    const needShot = selected.filter(s => !s.note.trim() && !vslotByVid[s.vid])
    const shotFor = new Map()

    // The crop has to happen INSIDE the frame now — this document can't reach
    // those elements. Each request is answered with a base64 JPEG, or null if
    // the frame couldn't produce one, in which case that issue simply goes to
    // the model as text.
    for (const s of needShot.slice(0, MAX_SCREENSHOTS)) {
      const data = await new Promise(resolve => {
        const done = d => { stop(); resolve(d) }
        const stop = onBridgeMessage(frame, token, msg => {
          if (msg.event === 'crop' && msg.vid === s.vid) done(msg.data || null)
        })
        setTimeout(() => done(null), CROP_TIMEOUT_MS)
        sendToBridge(frame, token, { request: 'crop', vid: s.vid })
      })
      if (data) shotFor.set(s.vid, data)
    }

    onSubmit({
      selections: selected.map(s => ({
        vid: s.vid,
        tag: s.tag,
        textSnippet: s.label,
        note: s.note.trim(),
        imageSlotId: vslotByVid[s.vid] || null,
        screenshot: shotFor.get(s.vid) || null,
      })),
      skippedScreenshots: Math.max(0, needShot.length - MAX_SCREENSHOTS),
    })
  }

  const clearAll = () => { setSelected([]); setHover(null) }

  const hoverIsSelected = hover && selected.some(s => s.vid === hover.vid)
  const panelStyle = useMemo(() => ({
    position: 'fixed', right: 16, bottom: 16, zIndex: 2147483000,
    width: 320, maxHeight: '70vh', display: 'flex', flexDirection: 'column',
    background: 'rgba(12,17,30,0.97)', border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 12, boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
    fontFamily: 'system-ui, sans-serif', color: '#fff', overflow: 'hidden',
  }), [])

  return (
    <>
      {/* hover highlight */}
      {hover?.rect && !hoverIsSelected && (
        <div style={{
          position: 'fixed', ...box(hover.rect), pointerEvents: 'none', zIndex: 2147482000,
          border: '2px solid #7ab5ff', background: 'rgba(122,181,255,0.14)', borderRadius: 2,
        }} />
      )}

      {/* persistent selection highlights */}
      {selected.map((s, i) => rects[s.vid] && (
        <div key={s.vid} style={{
          position: 'fixed', ...box(rects[s.vid]), pointerEvents: 'none', zIndex: 2147482100,
          border: '2px solid #ff4d6d', background: 'rgba(255,77,109,0.16)', borderRadius: 2,
        }}>
          <span style={{
            position: 'absolute', top: -18, left: 0, background: '#ff4d6d', color: '#fff',
            fontSize: 10, fontFamily: 'monospace', padding: '1px 5px', borderRadius: 3,
          }}>{i + 1}</span>
        </div>
      ))}

      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <strong style={{ fontSize: '0.8rem' }}>🔍 Inspect &amp; Fix</strong>
          <button onClick={onClose} style={btnGhost}>Done</button>
        </div>

        <div style={{ padding: '8px 12px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>
          {selected.length === 0
            ? 'Click anything in the preview to select it. Add a note if you know what’s wrong — otherwise it gets diagnosed from a screenshot.'
            : `${selected.length} selected. Notes are optional.`}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
          {selected.map((s, i) => (
            <div key={s.vid} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ color: '#ff4d6d', fontFamily: 'monospace', fontSize: 11 }}>{i + 1}</span>
                <span style={{ fontSize: '0.72rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <code style={{ color: '#7ab5ff' }}>&lt;{s.tag}&gt;</code> {s.label}
                  {vslotByVid[s.vid] && <span style={{ color: '#8fd18f' }}> · image</span>}
                </span>
                <button onClick={() => widen(s.vid)} title="Select its parent instead" style={btnTiny}>↑</button>
                <button onClick={() => setSelected(p => p.filter(x => x.vid !== s.vid))} title="Remove" style={btnTiny}>✕</button>
              </div>
              <input
                value={s.note}
                onChange={e => setNote(s.vid, e.target.value)}
                placeholder={vslotByVid[s.vid] ? 'e.g. warmer, less busy…' : 'What’s wrong? (optional)'}
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        {result && (
          <div style={{
            padding: '8px 12px', fontSize: '0.72rem', lineHeight: 1.45,
            color: result.ok ? '#8fd18f' : '#ffb3b3',
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}>{result.message}</div>
        )}

        <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <button onClick={clearAll} disabled={busy || !selected.length} style={btnGhost}>Clear</button>
          <button onClick={submit} disabled={busy || !selected.length} style={{ ...btnPrimary, opacity: busy || !selected.length ? 0.5 : 1 }}>
            {busy ? 'Working…' : `Reevaluate (${selected.length})`}
          </button>
        </div>
      </div>
    </>
  )
}

const btnGhost = { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 6, padding: '5px 10px', fontSize: '0.72rem', cursor: 'pointer' }
const btnPrimary = { flex: 1, background: '#ff4d6d', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 10px', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }
const btnTiny = { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 11, cursor: 'pointer', lineHeight: 1.4 }
const inputStyle = { width: '100%', marginTop: 5, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 5, color: '#fff', fontSize: '0.72rem', padding: '4px 7px', fontFamily: 'inherit', boxSizing: 'border-box' }
