// The bridge between the Studio tab and a rendered generated page.
//
// WHY THIS EXISTS
// Generated pages now ship real JavaScript (WebGL heroes, scroll behavior,
// CDN libraries). To measure or preview one honestly, its scripts have to
// actually run — which means the iframe needs `allow-scripts`.
//
// But `allow-scripts` together with `allow-same-origin` on a srcdoc frame
// gives that page full same-origin access to the Studio tab: its cookies,
// its storage, its DOM. The page is LLM-authored and partly derived from
// scraped third-party sites, so that is not a trade worth making.
//
// So the frame gets `allow-scripts` and NOT `allow-same-origin` — an opaque
// origin. The parent can no longer reach in via contentDocument, so instead a
// small script is injected into the page copy and everything flows over
// postMessage. Nothing here is ever part of the exported site: the bridge is
// injected only into the transient copy used for probing and previewing,
// exactly like the data-vid attributes it depends on.
//
// Verification on the parent side is by `event.source === frame.contentWindow`
// plus a per-frame token, NOT by origin — an opaque-origin frame reports its
// origin as "null", so an origin check would be meaningless here.

export const BRIDGE_MESSAGE = 'velpi-bridge'

// How long the injected script waits for fonts, images and any JS-mounted
// content (a WebGL canvas sizing itself) before reporting measurements.
const SETTLE_MS = 1200
// Ceiling so a page whose fonts never resolve still reports rather than
// hanging the caller forever. Deliberately timer-based, not rAF-based:
// requestAnimationFrame is throttled to a stop in a backgrounded tab, which
// would silently wedge the probe.
const CEILING_MS = 4000

function bridgeSource(token, mode) {
  return `(function () {
  var TOKEN = ${JSON.stringify(token)};
  var MODE = ${JSON.stringify(mode)};
  var MSG = ${JSON.stringify(BRIDGE_MESSAGE)};

  function post(payload) {
    try {
      // '*' is required: an opaque-origin frame cannot know the parent's
      // origin. The payload is layout data, never anything sensitive.
      parent.postMessage(Object.assign({ type: MSG, token: TOKEN }, payload), '*');
    } catch (e) {}
  }

  function nodeData(el) {
    var rect = el.getBoundingClientRect();
    var cs = getComputedStyle(el);
    var parentEl = el.parentElement ? el.parentElement.closest('[data-vid]') : null;
    var opacity = parseFloat(cs.opacity);
    var text = (el.textContent || '').trim();
    return {
      vid: el.getAttribute('data-vid'),
      parentVid: parentEl ? parentEl.getAttribute('data-vid') : null,
      tag: el.tagName.toLowerCase(),
      classes: el.classList ? Array.prototype.slice.call(el.classList) : [],
      sectionClass: (function () {
        var s = el.closest('section[class]');
        return s && s.classList ? s.classList[0] : null;
      })(),
      rect: {
        top: rect.top, left: rect.left, right: rect.right,
        bottom: rect.bottom, width: rect.width, height: rect.height
      },
      opacity: isNaN(opacity) ? 1 : opacity,
      position: cs.position,
      hasText: text.length > 1,
      ariaHidden: el.getAttribute('aria-hidden') === 'true',
      pointerEvents: cs.pointerEvents,
      vslot: el.getAttribute('data-vslot') || null
    };
  }

  function allNodes() {
    var out = [];
    var els = document.querySelectorAll('[data-vid]');
    for (var i = 0; i < els.length; i++) out.push(nodeData(els[i]));
    return out;
  }

  // ---- measure mode: report once, then go quiet ----
  if (MODE === 'measure') {
    var sent = false;
    function measure() {
      if (sent) return;
      sent = true;
      post({ event: 'measured', nodes: allNodes() });
    }
    function schedule() {
      if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
        document.fonts.ready.then(function () { setTimeout(measure, ${SETTLE_MS}); });
      } else {
        setTimeout(measure, ${SETTLE_MS});
      }
      setTimeout(measure, ${CEILING_MS});
    }
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule);
    return;
  }

  // ---- interactive mode: drive Inspect & Fix from inside the frame ----
  var hoveredVid = null;

  document.addEventListener('mousemove', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-vid]') : null;
    var vid = el ? el.getAttribute('data-vid') : null;
    if (vid === hoveredVid) return;
    hoveredVid = vid;
    post({ event: 'hover', node: el ? nodeData(el) : null });
  }, true);

  document.addEventListener('mouseleave', function () {
    hoveredVid = null;
    post({ event: 'hover', node: null });
  }, true);

  // Generated pages are full of real <a> tags; without preventDefault a click
  // meant to select an element would navigate the preview instead.
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-vid]') : null;
    e.preventDefault();
    e.stopPropagation();
    if (!el) return;
    post({ event: 'select', node: nodeData(el) });
  }, true);

  function repost() { post({ event: 'moved', nodes: allNodes() }); }
  window.addEventListener('scroll', repost, true);
  window.addEventListener('resize', repost);
  // A photo decoding late reflows everything below it and would strand the
  // selection overlays over the wrong content.
  document.addEventListener('load', repost, true);

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.type !== MSG || d.token !== TOKEN) return;
    if (d.request === 'nodes') repost();
    if (d.request === 'parentOf') {
      var el = document.querySelector('[data-vid="' + d.vid + '"]');
      var p = el && el.parentElement ? el.parentElement.closest('[data-vid]') : null;
      post({ event: 'parentOf', of: d.vid, node: p ? nodeData(p) : null });
    }
    if (d.request === 'crop') {
      // html2canvas has to run INSIDE the frame now — the parent can't reach
      // these elements any more. Loaded from a CDN into the preview copy
      // only; if it fails, the caller falls back to text-only diagnosis.
      var el2 = document.querySelector('[data-vid="' + d.vid + '"]');
      if (!el2) return post({ event: 'crop', vid: d.vid, data: null });
      var run = function () {
        try {
          window.html2canvas(el2, { useCORS: true, backgroundColor: '#ffffff', logging: false,
            scale: Math.min(1, 900 / Math.max(el2.offsetWidth || 900, 1)) })
            .then(function (c) { post({ event: 'crop', vid: d.vid, data: c.toDataURL('image/jpeg', 0.7).split(',')[1] }); })
            .catch(function () { post({ event: 'crop', vid: d.vid, data: null }); });
        } catch (err) { post({ event: 'crop', vid: d.vid, data: null }); }
      };
      if (window.html2canvas) return run();
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload = run;
      s.onerror = function () { post({ event: 'crop', vid: d.vid, data: null }); };
      document.body.appendChild(s);
    }
  });

  post({ event: 'ready' });
})();`
}

/**
 * Inject the bridge into a page copy. The script is appended as a SIBLING of
 * the .velpi-page wrapper (never nested inside it) — the same rule the
 * generated output itself must follow for GoHighLevel.
 */
export function injectBridge(html, { token, mode = 'measure' } = {}) {
  const tag = `\n<script>${bridgeSource(token, mode)}</script>\n`
  const src = String(html || '')
  const closeBody = src.toLowerCase().lastIndexOf('</body>')
  if (closeBody === -1) return src + tag
  return src.slice(0, closeBody) + tag + src.slice(closeBody)
}

export function newBridgeToken() {
  return `vb_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

/**
 * Listen for bridge messages from one specific frame.
 * Verification is source + token, never origin: an opaque-origin frame
 * reports origin "null", so an origin check would prove nothing.
 */
export function onBridgeMessage(frame, token, handler) {
  const listener = e => {
    if (!frame || e.source !== frame.contentWindow) return
    const d = e.data
    if (!d || d.type !== BRIDGE_MESSAGE || d.token !== token) return
    handler(d)
  }
  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}

export function sendToBridge(frame, token, request) {
  try {
    frame?.contentWindow?.postMessage({ type: BRIDGE_MESSAGE, token, ...request }, '*')
  } catch (_) { /* frame gone */ }
}

export const BRIDGE_TIMEOUT_MS = CEILING_MS + 2000
