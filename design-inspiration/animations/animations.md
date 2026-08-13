# Premium CSS animation patterns — GHL-safe catalog

Observed across the collected templates (BootstrapMade sites lean on the AOS library
— 35–117 `data-aos` hooks each; HTML5 UP uses pure-CSS transitions, 0.2s–2.5s ease;
Colorlib bs6 is CSS-only with `prefers-reduced-motion` guards; the Webflow
best-sellers use *restrained* interactions — staggered load reveals, marquees, hover
lifts). Every entry below is rewritten to our constraints:

- **transform / opacity only** (compositor-friendly, no layout thrash)
- **no pseudo-elements**, no external libraries — vanilla JS or pure CSS
- scoped class names, single-file friendly, GHL-safe
- Always include the reduced-motion guard once per page:

```css
@media (prefers-reduced-motion: reduce) {
  .vp-reveal, .vp-stagger > * { transition: none !important; animation: none !important; opacity: 1 !important; transform: none !important; }
}
```

Timing rules observed in the premium set: entrances 500–700ms `cubic-bezier(.22,.61,.36,1)`
(ease-out family), hovers 200–300ms `ease`, distances 16–32px. Anything faster feels
cheap, anything farther feels theatrical.

---

## 1. Entrance reveals (scroll-triggered)

### 1a. Fade-up on scroll — the universal default (seen in all 8 BootstrapMade + all Webflow templates)
```css
.vp-reveal { opacity: 0; transform: translateY(24px);
  transition: opacity .6s cubic-bezier(.22,.61,.36,1), transform .6s cubic-bezier(.22,.61,.36,1); }
.vp-reveal.is-in { opacity: 1; transform: translateY(0); }
```
```html
<script>
(function () {
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.vp-reveal').forEach(function (el) { io.observe(el); });
})();
</script>
```
Apply to section inner wrappers, not the `<section>` itself (keeps backgrounds stable
for the contrast pass).

### 1b. Staggered children (Fintech X hero, Outdo logo strip)
```css
.vp-stagger > * { opacity: 0; transform: translateY(20px);
  transition: opacity .55s cubic-bezier(.22,.61,.36,1), transform .55s cubic-bezier(.22,.61,.36,1); }
.vp-stagger.is-in > * { opacity: 1; transform: translateY(0); }
.vp-stagger.is-in > :nth-child(2) { transition-delay: .09s; }
.vp-stagger.is-in > :nth-child(3) { transition-delay: .18s; }
.vp-stagger.is-in > :nth-child(4) { transition-delay: .27s; }
.vp-stagger.is-in > :nth-child(5) { transition-delay: .36s; }
```
Same IntersectionObserver as 1a (also add `.vp-stagger` to its selector). Cap at ~5
children; longer chains read slow.

### 1c. Hero load-in (no scroll needed — Minerva/Fintech X pattern: eyebrow, then headline, then CTA)
```css
.vp-hero-in { opacity: 0; transform: translateY(18px);
  animation: vpHeroIn .65s cubic-bezier(.22,.61,.36,1) forwards; }
.vp-hero-in--2 { animation-delay: .12s; }
.vp-hero-in--3 { animation-delay: .24s; }
@keyframes vpHeroIn { to { opacity: 1; transform: translateY(0); } }
```
Pure CSS, runs on load. Use exactly three steps: eyebrow → headline → subcopy+CTA.

### 1d. Eyebrow slide-in (Minerva)
```css
.vp-eyebrow-in { opacity: 0; transform: translateX(-16px);
  animation: vpEyebrowIn .6s cubic-bezier(.22,.61,.36,1) forwards; }
@keyframes vpEyebrowIn { to { opacity: 1; transform: translateX(0); } }
```

## 2. Hover states

### 2a. Card lift (BootstrapMade service cards; keep shadow static to stay transform/opacity-only)
```css
.vp-card { transition: transform .25s ease; }
.vp-card:hover { transform: translateY(-6px); }
```
If a hover shadow is wanted, put the shadow on the card at rest (soft, low alpha) and
let the lift imply elevation — avoids animating box-shadow.

### 2b. Image zoom in frame (Outdo/Landon work cards; every modern gallery)
```css
.vp-imgframe { overflow: hidden; }
.vp-imgframe img { display: block; width: 100%; transform: scale(1);
  transition: transform .45s cubic-bezier(.22,.61,.36,1); }
.vp-card:hover .vp-imgframe img, .vp-imgframe:hover img { transform: scale(1.04); }
```

### 2c. Arrow nudge (the ↗ detail on Fintech X / Landon / Brooke links)
```html
<a class="vp-arrowlink" href="#">See our work <span class="vp-arrow">&#8599;</span></a>
```
```css
.vp-arrow { display: inline-block; transition: transform .22s ease; }
.vp-arrowlink:hover .vp-arrow { transform: translate(3px, -3px); }
```
`display:inline-block` is required for transform on the span. No pseudo-elements used.

### 2d. Button press
```css
.vp-btn { transition: transform .18s ease, opacity .18s ease; }
.vp-btn:hover { transform: translateY(-2px); }
.vp-btn:active { transform: translateY(0) scale(.98); }
```

### 2e. Quiet link/logo fade (Andersen's whole hover language; Outdo logo strip)
```css
.vp-fadehover { opacity: 1; transition: opacity .2s ease-in-out; } /* 0.2s ease-in-out is the exact HTML5 UP value */
.vp-fadehover:hover { opacity: .55; }
/* inverse for muted-at-rest items (client logos): rest .55, hover 1 */
```

## 3. Scroll-driven effects

### 3a. Nav that solidifies after scroll (BootstrapMade `.scrolled` pattern, transparent-hero templates)
```css
.vp-nav { position: fixed; inset: 0 0 auto 0; background: rgba(255,255,255,0);
  transition: background-color .3s ease, opacity .3s ease; }
.vp-nav.is-solid { background: rgba(255,255,255,.97); }
```
```html
<script>
(function () {
  var nav = document.querySelector('.vp-nav'); if (!nav) return;
  var on = false;
  addEventListener('scroll', function () {
    var s = scrollY > 40;
    if (s !== on) { on = s; nav.classList.toggle('is-solid', s); }
  }, { passive: true });
})();
</script>
```
(background-color transition on the nav is fine — it's not layout-affecting; if you
want strict transform/opacity, stack a solid nav at opacity 0→1.)

### 3b. Gentle parallax drift (Someday collage, Fintech X render) — rAF-throttled, transform-only
```css
.vp-parallax { will-change: transform; }
```
```html
<script>
(function () {
  var els = [].slice.call(document.querySelectorAll('.vp-parallax')); if (!els.length) return;
  var ticking = false;
  function frame () {
    ticking = false;
    var vh = innerHeight;
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = (r.top + r.height / 2 - vh / 2) / vh;      // -0.5 … 0.5 while on screen
      var speed = parseFloat(el.getAttribute('data-speed') || '18');
      el.style.transform = 'translateY(' + (p * speed).toFixed(1) + 'px)';
    });
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();
})();
</script>
```
Keep `data-speed` between 10 and 24; opposite signs on neighboring images gives the
collage effect. Never parallax text.

### 3c. Infinite marquee (Brooke's giant ticker). Duplicate the track content once in HTML:
```html
<div class="vp-marquee"><div class="vp-marquee-track">
  <span class="vp-marquee-item">Roofing · Siding · Gutters ·&nbsp;</span><span class="vp-marquee-item">Roofing · Siding · Gutters ·&nbsp;</span>
</div></div>
```
```css
.vp-marquee { overflow: hidden; white-space: nowrap; }
.vp-marquee-track { display: inline-flex; animation: vpMarquee 22s linear infinite; }
.vp-marquee-item { display: inline-block; }
@keyframes vpMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
```
Works because the track holds two identical halves. 18–30s duration; slower = more
expensive-feeling.

## 4. Micro-interactions

### 4a. Animated stat counters (BootstrapMade "purecounter" equivalent, vanilla)
```html
<span class="vp-count" data-target="450">0</span>
<script>
(function () {
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      var el = e.target, end = parseInt(el.getAttribute('data-target'), 10) || 0, t0 = null;
      function step (t) { if (!t0) t0 = t;
        var k = Math.min((t - t0) / 1200, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));  // ease-out cubic
        if (k < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.vp-count').forEach(function (el) { io.observe(el); });
})();
</script>
```

### 4b. Accordion/FAQ open (max-height is layout-affecting — use it, but don't call it "animation-safe"; the observed alternative)
Rotate-only chevron keeps the motion transform-only while the panel toggles with
`hidden`:
```css
.vp-acc-icon { display: inline-block; transition: transform .25s ease; }
.vp-acc.open .vp-acc-icon { transform: rotate(45deg); } /* a "+" glyph becomes "×" */
```

### 4c. Scroll-down cue (Minerva's ↓ square, Someday's arrow)
```css
.vp-scrollcue { display: inline-block; animation: vpCue 2.2s ease-in-out infinite; }
@keyframes vpCue { 0%,100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
```
One per page, hero only.

### 4d. Testimonial cross-fade (rotating quotes, no slider library)
```css
.vp-quote { opacity: 0; transition: opacity .5s ease; position: absolute; inset: 0; }
.vp-quote.is-live { opacity: 1; position: relative; }
```
```html
<script>
(function () {
  var qs = [].slice.call(document.querySelectorAll('.vp-quote')); if (qs.length < 2) return;
  var i = 0;
  setInterval(function () {
    qs[i].classList.remove('is-live'); i = (i + 1) % qs.length; qs[i].classList.add('is-live');
  }, 6000);
})();
</script>
```
Wrapper needs `position:relative` and a min-height that fits the tallest quote.

---

## What NOT to reuse from the observed templates
- **AOS/GSAP/jQuery plugins** (all BootstrapMade demos) — replaced by 1a/1b above.
- **Filter transitions** (grayscale→color logo hovers) — `filter` isn't in our safe set; use opacity (2e).
- **Animated box-shadows / height sliders** — layout+paint cost; use static shadow + lift (2a), `hidden` toggles (4b).
- **Preloader spinners** (HTML5 UP `2.5s` body fades, BootstrapMade preloaders) — a single-file GHL page needs no loading theater; at most use 1c.
- **Background-position parallax** (`background-attachment: fixed`) — janky on mobile Safari; use 3b.
- Anything requiring pseudo-elements (underline-grow effects built on `::after`) — draw underlines with a real `<span>` if needed.
