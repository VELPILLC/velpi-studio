# Reference-first 3D landing pages

Extracted from a walkthrough of building Three.js landing pages in Claude Code.
Source: video transcript supplied by Angel, Sept 2026.

## The core shift

Do not describe what you want. Point at something and say "make this".

    <paste a URL>
    Recreate this in a single HTML file. Self-verify until it's perfect.

That is the entire starting prompt. No typography notes, no colour direction, no
adjectives. Those come later, during molding.

This matters because a description is lossy and generic -- "premium concrete
contractor site" describes ten thousand pages, so the model returns the average
of them. A reference is specific. The average of one thing is that thing.

## Settings that change the outcome

- **Effort: extra / highest.** Called out repeatedly as the difference between
  good and slop. Lower effort means less research, less patience, fewer
  self-checks. A real build here ran 40+ minutes and was still going.
- **Permission mode: auto.** Manual approval on every edit makes long autonomous
  runs impossible.
- **Desktop app**, because the agent needs a real browser to look at the
  reference, scroll it, record it, and check its own work.

Patience is the mechanism. There is no fast version of this.

## The molding vocabulary

The replica is only the base. Molding is where it stops being someone else's
page. These are the words that actually change the render:

**Depth and layering**
- transparent PNG layers that sit *in front of* content
- foreground / midground / background separation
- parallax -- nearer layers travel further on scroll
- orbit -- camera or object circling rather than spinning in place

**Atmosphere**
- time of day: sunset, nighttime, overcast, hard noon
- weather: rain, fog, drifting particles
- falling leaves, wisps, embers

**Surface**
- textures: stone, grass, cloth, metal, concrete
- ask for generated textures when the default look is too clean/plastic
- shader effects layered over the UI itself (see canvasui.dev)

**Structure**
- multiple scenes that change as you scroll
- large type partially occluded by foreground elements

## Facts worth keeping

- A full 3D scene stays **under 1MB** when it is all code -- no downloaded
  models, geometry generated in JS.
- These pages work on mobile. Not a desktop-only trick.
- The whole thing is one HTML file.

## Asset generation

Higgsfield (already connected) generates images, video and 3D. The specific ask
that matters: **transparent PNGs**, so elements float over the page instead of
sitting in a rectangle. That is what makes parallax layering possible without
3D at all -- a cheaper path to the same depth.

Order matters: settle layout first, generate assets second. Assets made for a
layout that changes get thrown away.

## Anti-slop

Slop is what you get when the ask is vague and broad. The defences:
1. Start from a specific reference, not a category.
2. Build small single-file experiments, not a whole site every time.
3. Spend time. Under-worked is the same as generic.
4. Mold until it no longer resembles the reference -- credit the source, then
   make it yours.
