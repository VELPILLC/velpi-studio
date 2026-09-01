# Three.js-inspired ambient effects — CSS-only catalog

Three.js is a WebGL library — it needs its own runtime loaded via `<script>`
and a `<canvas>` it drives with JavaScript every frame. That makes it an
**external library**, which even the looser [animations.md](../animations/animations.md)
catalog rules out ("no pseudo-elements, no external libraries — vanilla JS or
pure CSS"), and the current build contract (`app/api/build-site/route.js`)
forbids ALL JavaScript outright, since every page must paste cleanly into
GoHighLevel's custom-code element. So nothing here ships as literal Three.js —
ever. What's actually useful about Three.js as a *reference* is the visual
vocabulary it made mainstream on premium sites: gradient mesh backdrops,
particle ambience, floating/orbiting geometry, liquid blobs, holographic
sheen. Every entry below names the WebGL look it's standing in for, then gives
a pure-CSS (occasionally inline-SVG-filter) recipe that approximates the same
*impression* at zero runtime cost — no canvas, no per-frame JS, no library.

Same ground rules as animations.md: transform/opacity/background are the
compositor-friendly properties to animate; keep any looping animation subtle
enough to read as ambient texture, not foreground motion; always pair with
the reduced-motion guard:

```css
@media (prefers-reduced-motion: reduce) {
  .vp-3d-ambient, .vp-3d-ambient * { animation: none !important; transition: none !important; }
}
```

---

## 1. Gradient mesh / aurora backdrop
*Stands in for: a WebGL shader gradient (the "mesh gradient" hero background on countless SaaS/agency sites, usually built with a Three.js or GLSL shader plane.)*

```css
.vp-mesh {
  position: relative;
  background:
    radial-gradient(at 20% 30%, var(--mesh-c1) 0px, transparent 55%),
    radial-gradient(at 80% 20%, var(--mesh-c2) 0px, transparent 50%),
    radial-gradient(at 50% 80%, var(--mesh-c3) 0px, transparent 55%),
    var(--mesh-base);
  background-size: 140% 140%;
  animation: vpMeshDrift 18s ease-in-out infinite alternate;
}
@keyframes vpMeshDrift {
  0%   { background-position: 0% 0%, 100% 0%, 50% 100%; }
  100% { background-position: 10% 15%, 85% 10%, 40% 90%; }
}
```
Map `--mesh-c1/2/3` to tinted/shaded variants of the brand palette (never raw
accent at full saturation — this is a backdrop, not a focal point) and
`--mesh-base` to the section's base surface color. Keep opacity of the three
radial stops soft (mix them at ~40-60% alpha) so text placed on top still
passes the contrast pass.

## 2. Particle field ambience
*Stands in for: `THREE.Points` — a drifting cloud of tiny lit dots, common in dark hero sections.*

Built from one repeating `box-shadow` list (the classic CSS "starfield" trick
— no canvas, no JS, works because `box-shadow` accepts an arbitrary comma list
of offsets):

```css
.vp-particles { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.vp-particles::before, .vp-particles::after {
  content: ''; position: absolute; width: 2px; height: 2px; border-radius: 50%;
  background: transparent;
  /* generate 20-40 comma-separated "Xpx Ypx color" offsets scattered across the frame */
  box-shadow:
    12% 18% 0 var(--particle-c), 34% 62% 0 var(--particle-c), 58% 24% 0 var(--particle-c),
    71% 78% 0 var(--particle-c), 88% 41% 0 var(--particle-c), 6% 84% 0 var(--particle-c);
  animation: vpParticleDrift 40s linear infinite;
}
.vp-particles::after { animation-duration: 65s; animation-direction: reverse; opacity: .5; }
@keyframes vpParticleDrift {
  from { transform: translate(0, 0); }
  to   { transform: translate(-4%, -6%); }
}
```
`--particle-c` should be a low-alpha near-white (dark sections) or near-black
(light sections). This is a *texture*, not a hero focal point — cap total
opacity of the layer around 25-40%.

## 3. Depth-layered parallax scene
*Stands in for: a multi-plane Three.js camera scene (foreground/midground/background objects moving at different rates as the "camera" — i.e. the scroll — moves).*

True CSS 3D (via `perspective`), not the 2D scroll-offset trick in
animations.md §3b — this one actually pushes layers along the Z axis so
closer planes appear to move faster, matching how a real depth scene reads:

```css
.vp-scene { perspective: 1200px; overflow: hidden; }
.vp-scene-layer { position: absolute; inset: 0; transform-style: preserve-3d;
  transition: transform .1s linear; }
.vp-scene-layer--back  { transform: translateZ(-400px) scale(1.33); }
.vp-scene-layer--mid   { transform: translateZ(-150px) scale(1.125); }
.vp-scene-layer--front { transform: translateZ(0); }
```
Drive `--scroll` (0-1 across the section) from the same scroll listener
pattern as animations.md §3b, and apply `translateY(calc(var(--scroll) * Npx))`
per layer with a bigger `N` on `--front` than `--back` — closer layers must
travel farther for the depth illusion to read correctly.

## 4. Liquid blob morph
*Stands in for: a metaball/liquid shader material — the soft, gooey animated shape used as a decorative backdrop behind headlines or images.*

```css
.vp-blob {
  width: 60vw; aspect-ratio: 1; border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%;
  background: var(--blob-fill);
  filter: blur(2px);
  animation: vpBlobMorph 12s ease-in-out infinite alternate;
}
@keyframes vpBlobMorph {
  0%   { border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%; }
  50%  { border-radius: 58% 42% 38% 62% / 62% 55% 45% 38%; }
  100% { border-radius: 50% 50% 60% 40% / 40% 60% 40% 60%; }
}
```
`--blob-fill` should be a soft gradient (radial or linear) of two adjacent
brand-palette tints, never a flat accent color — flat fill reads as a shape,
gradient fill reads as light/material. Position `absolute`, `z-index` below
content, and keep it large and mostly off-canvas (the "glimpsed light source"
placement, not a centered graphic).

## 5. Orbiting elements
*Stands in for: small objects orbiting a central point in a Three.js scene (a common tech/SaaS hero motif — icons or dots circling a central mark).*

The classic wrapper-rotates / child-counter-rotates trick, pure CSS:

```css
.vp-orbit { position: relative; width: 320px; aspect-ratio: 1; }
.vp-orbit-ring { position: absolute; inset: 0; animation: vpOrbitSpin 24s linear infinite; }
.vp-orbit-item { position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  animation: vpOrbitCounter 24s linear infinite; } /* keeps the item upright */
@keyframes vpOrbitSpin    { to { transform: rotate(360deg); } }
@keyframes vpOrbitCounter { to { transform: translateX(-50%) rotate(-360deg); } }
```
Place 3-5 `.vp-orbit-item`s at different `.vp-orbit-ring` rotation offsets
(`transform: rotate(72deg)` etc. on each ring copy) for an evenly-spaced
orbit. Vary radius by nesting rings of different sizes for a multi-orbit feel.

## 6. Holographic / iridescent sheen
*Stands in for: a Three.js `MeshPhysicalMaterial` iridescence/holo-foil shader — the shifting rainbow-metal look on premium fintech/product sites.*

```css
.vp-holo {
  background: conic-gradient(from var(--holo-angle, 0deg),
    #ff9ecd, #a0c4ff, #9bf6ff, #caffbf, #fdffb6, #ffc6ff, #ff9ecd);
  mix-blend-mode: color-dodge; /* over a dark surface; use "overlay" on light surfaces */
  opacity: .35;
  animation: vpHoloShift 8s linear infinite;
}
@keyframes vpHoloShift { to { --holo-angle: 360deg; } }
```
Requires `@property --holo-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }`
once per page for the angle to animate smoothly (falls back to a static angle
without it — still fine, just not spinning). Layer this OVER a real surface
(a card, a button, an image frame), never as a full-bleed background — it's a
material finish, not a scene.

## 7. Fine noise/grain texture
*Stands in for: a shader-based film-grain pass, used to keep flat gradient fields (mesh gradients, blobs) from looking digitally flat/banded.*

Pure SVG filter, no JS, negligible cost:

```html
<svg width="0" height="0" style="position:absolute">
  <filter id="vp-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter>
</svg>
```
```css
.vp-grain::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  filter: url(#vp-grain); opacity: .04; mix-blend-mode: overlay;
}
```
Apply over any large flat or gradient field (§1 and §4 especially benefit).
Opacity above ~0.06 starts reading as dirty rather than textured.

---

## What NOT to do with this catalog
- **Never actually load three.js, a CDN build, or any WebGL library** — it's
  an external dependency the current build contract forbids outright, and
  every recipe above exists specifically to avoid needing one.
- **Never use these as the page's primary content** — like animations.md's
  motion presets, these are ambient backdrop/texture. One effect per page,
  used behind or beside real content, never in front of it.
- **Don't stack more than two of these in one section** — a mesh gradient
  (§1) plus grain (§7) reads as premium material; a mesh gradient plus
  particles plus a blob plus holo sheen reads as a screensaver.
- **Check contrast after adding any of these behind text** — §1, §2, and §4
  all sit at low-but-nonzero opacity, which is exactly the "unverifiable
  backdrop" case `lib/contrastFix.mjs` treats conservatively; if text
  ends up looking close, add a scrim rather than fighting the effect's
  opacity down to nothing.
