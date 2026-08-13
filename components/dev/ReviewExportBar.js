'use client'
import { useState } from 'react'

// Developer Review — export toolbar (DEV ONLY). Global, build-level actions —
// unlike the rating star (which is scoped to one device viewport), a single
// build can carry both a mobile and a desktop rating, so exporting is not
// tied to either. Docked below the preview, above the refine input.
//
// Props: buildId, projectId, businessName, getRenderedHtml() -> html string
// (for the optional "Ask ChatGPT" full-page screenshot).

const C = { panel: '#121a2b', border: '#22304a', dim: '#8ea0c0', blue: '#4c8dff' }

export default function ReviewExportBar({ buildId, projectId, businessName, getRenderedHtml }) {
  const [exporting, setExporting] = useState(false)
  const [exportingReviews, setExportingReviews] = useState(false)

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

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '10px 14px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, marginTop: 16, fontFamily: 'var(--font-inter, sans-serif)' }}>
      <button onClick={exportReviews} disabled={exportingReviews} title="Export all saved reviews as markdown" style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.dim, borderRadius: 7, padding: '5px 10px', fontSize: 11, cursor: 'pointer', opacity: exportingReviews ? 0.6 : 1 }}>
        {exportingReviews ? '…' : '⬇ Export Reviews'}
      </button>
      <button onClick={askChatGpt} disabled={exporting || (!buildId && !projectId)} style={{ background: C.blue, border: 'none', color: '#fff', borderRadius: 7, padding: '6px 11px', fontSize: 11, cursor: 'pointer', opacity: exporting ? 0.6 : 1 }}>
        {exporting ? 'Packaging…' : 'Ask ChatGPT ↗'}
      </button>
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
    const html2canvas = (await import('html2canvas-pro')).default
    const canvas = await html2canvas(doc.documentElement, { useCORS: true, backgroundColor: '#ffffff', windowWidth: 1440, width: 1440, height: Math.min(fullH, 20000), scale: 0.5, logging: false })
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch (_) {
    return null
  } finally {
    try { document.body.removeChild(frame) } catch (_) {}
  }
}
