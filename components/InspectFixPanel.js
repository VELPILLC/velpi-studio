'use client'

// Inspect & Fix — click anything in the rendered preview and send it back to
// the Studio tab to be reworked.
//
// How it reaches into the preview: the preview iframe is srcDoc +
// sandbox="allow-same-origin" (deliberately WITHOUT allow-scripts, because
// generated sites are contractually JS-free). Same-origin means this parent
// page can read frame.contentDocument directly and attach its own listeners
// — the same access captureFullPage/html2canvas already relies on. Nothing is
// injected into the generated HTML itself; the highlight boxes are plain
// divs in THIS document, positioned over the iframe.
//
// Every element in the iframe carries data-vid="vNN" (lib/elementIds.mjs),
// assigned in document order. Because that numbering depends only on tag
// structure and never on attribute values, the ids seen here match the ids
// the Studio tab computes from the raw token-bearing template — which is what
// lets a click here address the right element in the HTML sent to the model.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MAX_SCREENSHOTS = 4 // vision crops are the expensive part of a fix; cap and disclose

const box = (r) => ({ left: r.left, top: r.top, width: r.width, height: r.height })

export default function InspectFixPanel({ frameRef, vslotByVid = {}, onSubmit, busy, result, onClose }) {
  const [hover, setHover] = useState(null)      // { vid, rect }
  const [selected, setSelected] = useState([])  // [{ vid, tag, label, note }]
  const [rects, setRects] = useState({})        // vid -> viewport-space box
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  const doc = () => frameRef.current?.contentDocument || null

  // Element rects are relative to the IFRAME's viewport; the overlay divs are
  // position:fixed in the parent. Adding the iframe's own viewport offset
  // converts between the two, and because getBoundingClientRect already
  // accounts for the iframe's internal scroll, this stays correct as the
  // preview scrolls — we just have to recompute on scroll.
  const rectFor = useCallback((vid) => {
    const d = doc(), frame = frameRef.current
    if (!d || !frame) return null
    const el = d.querySelector(`[data-vid="${vid}"]`)
    if (!el) return null
    const r = el.getBoundingClientRect()
    const f = frame.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) return null
    return { left: f.left + r.left, top: f.top + r.top, width: r.width, height: r.height }
  }, [frameRef])

  const recompute = useCallback(() => {
    const next = {}
    for (const s of selectedRef.current) {
      const r = rectFor(s.vid)
      if (r) next[s.vid] = r
    }
    setRects(next)
    setHover(h => (h ? { ...h, rect: rectFor(h.vid) || h.rect } : h))
  }, [rectFor])

  const describe = useCallback((el) => {
    const tag = el.tagName.toLowerCase()
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
    if (tag === 'img') return el.getAttribute('alt')?.trim() || 'image'
    if (text) return text.slice(0, 60)
    return el.getAttribute('class')?.split(/\s+/)[0] || tag
  }, [])

  // Wire hover/click into the preview document.
  useEffect(() => {
    const d = doc()
    if (!d) return

    const onMove = e => {
      const el = e.target?.closest?.('[data-vid]')
      if (!el) { setHover(null); return }
      const vid = el.getAttribute('data-vid')
      const r = rectFor(vid)
      if (r) setHover({ vid, rect: r })
    }
    const onLeave = () => setHover(null)
    // Capture phase + preventDefault: generated pages are full of real <a>
    // tags, and without this a click to select would navigate the preview.
    const onClick = e => {
      const el = e.target?.closest?.('[data-vid]')
      e.preventDefault()
      e.stopPropagation()
      if (!el) return
      const vid = el.getAttribute('data-vid')
      setSelected(prev => prev.some(s => s.vid === vid)
        ? prev.filter(s => s.vid !== vid)
        : [...prev, { vid, tag: el.tagName.toLowerCase(), label: describe(el), note: '' }])
    }
    const onScroll = () => recompute()

    d.addEventListener('mousemove', onMove, true)
    d.addEventListener('mouseleave', onLeave, true)
    d.addEventListener('click', onClick, true)
    d.defaultView?.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    window.addEventListener('scroll', onScroll, true)

    // Scroll and resize aren't the only things that move an element: a photo
    // served from a remote URL can finish decoding after a selection is made
    // and push everything below it down, stranding the highlight over the
    // wrong content. Watch the document itself for reflow, and catch late
    // image loads directly.
    let ro = null
    try {
      ro = new ResizeObserver(onScroll)
      if (d.documentElement) ro.observe(d.documentElement)
      if (d.body) ro.observe(d.body)
    } catch (_) { /* older browser — scroll/resize coverage still applies */ }
    d.addEventListener('load', onScroll, true) // bubbles:false on <img>, so capture phase

    return () => {
      d.removeEventListener('mousemove', onMove, true)
      d.removeEventListener('mouseleave', onLeave, true)
      d.removeEventListener('click', onClick, true)
      d.removeEventListener('load', onScroll, true)
      d.defaultView?.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('scroll', onScroll, true)
      try { ro?.disconnect() } catch (_) {}
    }
  }, [frameRef, rectFor, recompute, describe])

  useEffect(() => { recompute() }, [selected, recompute])

  // Replace a selection with its nearest addressable ancestor — the way to
  // grab "this whole section" after clicking a headline inside it.
  const widen = (vid) => {
    const d = doc()
    if (!d) return
    const el = d.querySelector(`[data-vid="${vid}"]`)
    const parent = el?.parentElement?.closest('[data-vid]')
    if (!parent) return
    const pvid = parent.getAttribute('data-vid')
    setSelected(prev => {
      if (prev.some(s => s.vid === pvid)) return prev.filter(s => s.vid !== vid)
      return prev.map(s => s.vid === vid
        ? { vid: pvid, tag: parent.tagName.toLowerCase(), label: describe(parent), note: s.note }
        : s)
    })
  }

  const setNote = (vid, note) => setSelected(prev => prev.map(s => (s.vid === vid ? { ...s, note } : s)))

  async function submit() {
    const d = doc()
    if (!d || !selected.length) return

    // Screenshot only what actually needs a visual diagnosis: a selection
    // with a note already says what's wrong, so a crop would add cost and
    // latency for nothing.
    const needShot = selected.filter(s => !s.note.trim() && !vslotByVid[s.vid])
    const shotFor = new Map()
    if (needShot.length) {
      try {
        const html2canvas = (await import('html2canvas-pro')).default
        for (const s of needShot.slice(0, MAX_SCREENSHOTS)) {
          const el = d.querySelector(`[data-vid="${s.vid}"]`)
          if (!el) continue
          try {
            const canvas = await html2canvas(el, {
              useCORS: true, allowTaint: false, backgroundColor: '#ffffff',
              scale: Math.min(1, 900 / Math.max(el.offsetWidth || 900, 1)), logging: false,
            })
            shotFor.set(s.vid, canvas.toDataURL('image/jpeg', 0.7).split(',')[1])
          } catch (_) { /* one failed crop just falls back to text-only diagnosis */ }
        }
      } catch (_) { /* html2canvas unavailable — every issue goes text-only */ }
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
