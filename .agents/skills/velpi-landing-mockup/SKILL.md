---
name: velpi-landing-mockup
description: Build VELPI landing page mockups from a visual reference rather than a description. Use whenever the user asks for a mockup, a landing page, a website design, a 3D or Three.js page, a hero section, a scroll animation, an exploded view, a "motion" or "still" direction, or pastes a URL and asks to recreate or take inspiration from it. Also use when molding an existing mockup — adding depth, parallax, weather, time-of-day lighting, textures, or transparent layers.
---

# VELPI landing page mockups

## The rule that matters most

**Never build from a description alone.** "A premium site for a concrete
contractor" describes ten thousand pages, so the output is the average of them.
That average is what the user calls AI slop, and they are right.

Always anchor to something specific: a URL, a file in `REFERENCE DROP/`, a
template in `design-inspiration/templates/` (1,610 of them), or a generated
reference image (below).

If asked for a mockup with no reference, **ask for one or propose two or three
specific candidates from the local library** before building. One question is
cheaper than a generic page.

## The image-first pipeline (preferred)

This is how you get an ORIGINAL design rather than a copy of someone's site:

1. Collect 4-6 inspiration screenshots (Pinterest, Dribbble, Awwwards,
   collectui, mobbin, or `design-inspiration/`).
2. Feed them all to an image model (Higgsfield: Seedream / Nano Banana Pro) with
   a prompt naming the section and the business — "design a hero section for a
   premium architectural studio, using the reference images for visual
   inspiration". 16:9. The output is a synthesis, not a copy of any one input.
3. Save it as `reference/reference.png` in the project folder.
4. Rebuild THAT IMAGE as HTML/CSS.

The generated image is the **single source of truth** for the build. This is
what separates "inspired by" from "copied" — the design is genuinely new before
a line of code is written.

## Build discipline

**Back up before every change.** A wrong turn with no reference point is
expensive.

**Two phases, never at once.** Build the static page to match the reference
image FIRST. Only once it is right, add animation. Doing both together burns
tokens and produces a page that is wrong in two dimensions at the same time.

**Self-verify in a headless browser.** Screenshot the build, compare against the
reference image, fix the gaps. Never hand over something unopened.

**Reviewer pass with a hard cap.** A reviewer with fresh eyes compares build to
reference and sends back specifics. Stop at "pass" OR after a set number of
rounds (3-5). Without the cap a reviewer always finds something and it never
ends. Aim for close, not pixel-identical.

**Restrict feedback scope.** When correcting, name the two or three things that
matter and say to ignore everything else. Vague "make it better" wastes a round.

## Output contract

Every mockup is ONE self-contained `.html` file with plain CSS that opens by
double-clicking. No npm, no build step, no framework.

- Scripts are siblings of the page wrapper, **never nested inside a `<div>`** —
  the one GoHighLevel rule that silently breaks everything.
- Pin exact library versions. Never `@latest`.
- All 3D geometry generated in code — no `.glb`/`.gltf` fetches. This is how a
  full 3D scene stays under 1MB.
- Every JS-driven region needs a CSS fallback that looks finished on its own.
- Honour `prefers-reduced-motion`. Lazy-init on scroll, tear down on exit.
- Mobile gets a reduced scene. Run mobile optimisation three or four times.

Save to `MOCKUP GENERATOR/<project>/`. Moving a file to `SITE BUILDS/` is the
approval step — never do it unprompted.

## Two directions, always

- **Premium motion** — real movement. Higher ceiling, heavier.
- **Premium still** — no ambient motion; typography, composition and restraint.
  The right answer for law, medical, dental, funeral, accounting.

Neither is the default.

## Choosing the 3D path

**Code 3D (Three.js)** — geometry in JavaScript. Under 1MB, pastes into
GoHighLevel whole, re-promptable freely ("make it night", "add rain") at no
asset cost. Best for stylised, abstract or brand-coloured scenes.

**Video 3D (Higgsfield)** — a generated clip. Photoreal, fast, ~$0.36 a clip.
Best for real interiors, materials, exploded product views. Changing it means
regenerating.

**The GoHighLevel constraint that decides it:** a funnel paste is ONE HTML
block. Code 3D is self-contained. Video and frame-sequence assets are NOT —
they need public hosting and absolute URLs. If the target is a GHL funnel with
nowhere to host assets, use code 3D.

## Scroll-driven animation

**Scroll-scrub, not playback.** Playing a video on scroll lags. Extract frames
as optimised JPEGs, preload them, tie each frame to scroll position. The user
scrubs by scrolling. This is the Apple product-page technique.

**Exploded views: axis discipline.** The common failure is parts *scattering* —
tumbling and fanning out. What reads as engineered is each component travelling
along **its own mounting axis**, the direction it would actually be removed in.
Say this explicitly or it will scatter.

**Iterate at 480p, finish at 1080p.** Animations take many rounds. Low-res
iteration then one final high-res encode saves most of the credit spend.

**Reverse must work.** Scrolling back should run the animation backwards to the
starting frame.

**Loader.** A short loading animation lets heavy assets preload so the first
scroll is smooth.

## Asset prompts

Always: white background, no text, "should read like something on a landing
page". For a rotating object, state the centre of mass must not move. For an
exploded view, state that nothing may leave the frame bounds. Generate 2-3 and
keep the best — retries are cheaper than nursing one.

Settle the layout before generating anything.

## Molding vocabulary

**Depth** — transparent PNG layers in front of content; foreground/midground/
background separation; parallax; orbit rather than spin.

**Atmosphere** — one committed time of day (sunset, night, overcast, hard noon)
lighting everything; fog graded toward the surface colour; rain, drifting
particles, falling leaves.

**Surface** — vary roughness; procedural texture so materials read as stone,
concrete, cloth or metal rather than default plastic. Never fetch a texture file.

**Structure** — scenes that change on scroll; large type partially occluded by
foreground elements.

Full notes: `design-inspiration/3d-effects/` (three workflow documents).

## Optimisation is conversational

"It's laggy, make it load significantly faster", "make the hero faster", "mobile
optimise this" all do real work. Compression of a 5MB hero to ~250KB is routine.

## Working style

Take the time. Under-worked output is indistinguishable from generic output.
