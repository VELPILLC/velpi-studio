// The one browser-only piece of the layout-overlap check. Real overlap
// detection needs real browser layout, not text parsing — there is no
// server-side rendering anywhere in this app (no Playwright/Puppeteer), so
// this renders the page off-screen at a fixed viewport and reads geometry
// back.
//
// WHY THIS TALKS OVER postMessage INSTEAD OF READING contentDocument
// Generated pages now carry real JavaScript. The old probe used
// sandbox="allow-same-origin" with NO allow-scripts, so those scripts never
// ran and it measured a half-built page: a WebGL <canvas> reported its
// default 300x150, and scroll-reveal elements sat at opacity:0. Those wrong
// numbers were then written into htmlTemplate as permanent !important
// overrides — silent corruption of the shipped site.
//
// Running the scripts requires allow-scripts, and allow-scripts together with
// allow-same-origin would hand the generated page same-origin access to the
// Studio tab. So the frame is opaque-origin (allow-scripts only) and an
// injected bridge reports the measurements out. See lib/previewBridge.mjs.
//
// Only call this with HTML that already has lib/elementIds.mjs's data-vid
// attributes injected AND has had its %%IMG:id%% tokens substituted for real
// URLs — broken image placeholders would throw off the very measurements
// this exists to get right.

import { injectBridge, newBridgeToken, onBridgeMessage, BRIDGE_TIMEOUT_MS } from './previewBridge.mjs'

export async function probeGeometry(renderableHtml, { width, height }) {
  if (!renderableHtml || typeof document === 'undefined') return []

  const token = newBridgeToken()
  const frame = document.createElement('iframe')
  let stopListening = () => {}

  try {
    frame.style.cssText = `position:fixed;left:-99999px;top:0;width:${width}px;height:${height}px;border:none;`
    // allow-scripts and deliberately NOT allow-same-origin.
    frame.setAttribute('sandbox', 'allow-scripts')

    const measured = new Promise(resolve => {
      let settled = false
      const finish = nodes => {
        if (settled) return
        settled = true
        resolve(nodes)
      }
      stopListening = onBridgeMessage(frame, token, msg => {
        if (msg.event === 'measured') finish(Array.isArray(msg.nodes) ? msg.nodes : [])
      })
      // A page that never reports (a script that throws before the bridge
      // runs, a hung library) must degrade to "no findings" rather than
      // wedging the whole generation.
      setTimeout(() => finish([]), BRIDGE_TIMEOUT_MS)
    })

    document.body.appendChild(frame)
    frame.srcdoc = injectBridge(renderableHtml, { token, mode: 'measure' })
    return await measured
  } catch (e) {
    console.error('geometry probe failed (non-fatal):', e?.message || e)
    return []
  } finally {
    stopListening()
    try { document.body.removeChild(frame) } catch (_) {}
  }
}
