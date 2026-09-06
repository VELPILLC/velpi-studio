---
name: velpi-landing-mockup
description: Build VELPI landing page mockups from a visual reference rather than a description. Use whenever the user asks for a mockup, a landing page, a website design, a 3D or Three.js page, a hero section, a "motion" or "still" direction, or pastes a URL and asks to recreate or take inspiration from it. Also use when molding an existing mockup — adding depth, parallax, weather, time-of-day lighting, textures, or transparent layers.
---

# VELPI landing page mockups

## The rule that matters most

**Never build from a description alone.** "A premium site for a concrete
contractor" describes ten thousand pages, so the output is the average of them.
That average is what the user calls AI slop, and they are right.

Always anchor to something specific:
- a URL the user pasted
- a file in `REFERENCE DROP/`
- a template in `design-inspiration/templates/` (1,610 of them)
- a previous build in `SITE BUILDS/`

If the user asks for a mockup with no reference, **ask for one or propose two or
three specific candidates from the local library** before building. One question
is cheaper than a generic page.

## Output contract

Every mockup is ONE self-contained `.html` file that opens by double-clicking.
No build step, no server, no dependencies beyond pinned CDN scripts.

- Scripts are siblings of the page wrapper, **never nested inside a `<div>`** —
  this is the one GoHighLevel rule that silently breaks everything.
- Pin exact library versions. Never `@latest`.
- All 3D geometry generated in code. No `.glb`/`.gltf`/`.fbx` fetches — this is
  how a full 3D scene stays under 1MB.
- Every JS-driven region needs a CSS fallback that looks finished on its own.
- Honour `prefers-reduced-motion`. Lazy-init on scroll, tear down on exit.
- Mobile gets a reduced scene, not the desktop one.

Save to `MOCKUP GENERATOR/<project>/`. Moving a file to `SITE BUILDS/` is the
approval step — never do it unprompted.

## Two directions, always

Explore both before anything is chosen:

- **Premium motion** — real movement. WebGL, scroll-driven scenes, generated
  video or 3D. Higher ceiling, heavier.
- **Premium still** — no ambient motion. Carries weight through typography,
  composition, photography and restraint. The right answer for trust-driven
  niches: law, medical, dental, funeral, accounting.

Neither is the default.

## Molding vocabulary

The replica is the base, not the deliverable. These words change the render:

**Depth** — transparent PNG layers in front of content; foreground/midground/
background separation; parallax (nearer layers travel further); orbit rather
than spin.

**Atmosphere** — commit to one time of day (sunset, night, overcast, hard noon)
and light everything from it; fog or haze graded toward the surface colour;
rain, drifting particles, falling leaves.

**Surface** — vary roughness; procedural or canvas-drawn texture so materials
read as stone, concrete, cloth or metal rather than default plastic. Never fetch
a texture file.

**Structure** — scenes that change on scroll; large type partially occluded by
foreground elements.

Full notes: `design-inspiration/3d-effects/reference-first-3d-workflow.md`

## Assets

Higgsfield generates images, video and 3D. Ask specifically for **transparent
PNGs** — elements that float over the page rather than sitting in a rectangle.
That alone buys parallax depth without any 3D.

**Settle the layout before generating anything.** Assets made for a layout that
then changes get thrown away.

## Working style

Take the time. Under-worked output is indistinguishable from generic output.
Self-verify in the browser — open it, scroll it, check the console, screenshot
it — before calling a mockup done. Do not hand the user something unopened.
