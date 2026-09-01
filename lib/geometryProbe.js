// The one browser-only piece of the layout-overlap check. Real overlap
// detection needs real browser layout, not text parsing — there is no
// server-side rendering anywhere in this app (no Playwright/Puppeteer), so
// this reuses the exact hidden-iframe-at-a-real-viewport technique
// components/Studio.js already relies on for html2canvas capture
// (captureFullPageCanvas): render off-screen at a fixed width, let fonts and
// images settle, then read back real geometry instead of rasterizing.
//
// Only call this with HTML that already has lib/elementIds.mjs's data-vid
// attributes injected AND has had its %%IMG:id%% tokens substituted for real
// URLs — broken image placeholders would throw off the very measurements
// this exists to get right.

export async function probeGeometry(renderableHtml, { width, height }) {
  if (!renderableHtml || typeof document === 'undefined') return []
  const frame = document.createElement('iframe')
  try {
    frame.style.cssText = `position:fixed;left:-99999px;top:0;width:${width}px;height:${height}px;border:none;`
    frame.setAttribute('sandbox', 'allow-same-origin')
    document.body.appendChild(frame)
    frame.srcdoc = renderableHtml
    await new Promise(res => { frame.onload = res })
    await new Promise(res => setTimeout(res, 1200)) // let fonts/images settle, same as captureFullPageCanvas

    const doc = frame.contentDocument
    if (!doc) return []
    const view = doc.defaultView
    const els = Array.from(doc.querySelectorAll('[data-vid]'))

    return els.map(el => {
      const rect = el.getBoundingClientRect()
      const cs = view.getComputedStyle(el)
      const parentVidEl = el.parentElement ? el.parentElement.closest('[data-vid]') : null
      const opacity = parseFloat(cs.opacity)
      const text = (el.textContent || '').trim()
      return {
        vid: el.getAttribute('data-vid'),
        parentVid: parentVidEl ? parentVidEl.getAttribute('data-vid') : null,
        tag: el.tagName.toLowerCase(),
        classes: el.classList ? Array.from(el.classList) : [],
        sectionClass: el.closest('section[class]')?.classList?.[0] || null,
        rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
        opacity: Number.isNaN(opacity) ? 1 : opacity,
        position: cs.position,
        hasText: text.length > 1,
        ariaHidden: el.getAttribute('aria-hidden') === 'true',
        pointerEvents: cs.pointerEvents,
        vslot: el.getAttribute('data-vslot') || null,
      }
    })
  } finally {
    try { document.body.removeChild(frame) } catch (_) {}
  }
}
