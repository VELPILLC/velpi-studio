# NONE — motion direction

Open `motion-direction.html` by double-clicking it. No server needed.

## What it does

A sticky stage holds three garments. Scrolling cross-fades shirt → cap → pants
while the copy panels move past. Each garment tilts toward the cursor, floats on
a slow sine, and **flips on click** to reveal fabric / fit / origin on its back.

## How it is built

**No 3D library.** The garments are photographs, so a CSS 3D flip
(`transform-style: preserve-3d` + `backface-visibility`) is lighter, sharper and
more convincing than geometry — and it drops the Three.js dependency entirely.
The only JavaScript is a scroll-progress cross-fade and pointer tilt.

The photography sits on studio white; `mix-blend-mode: multiply` drops that
ground into the paper background so each piece reads as genuinely floating,
without needing a cutout (there is no local image tooling to make one).

## Assets

Generated with Higgsfield `marketing_studio_image`, 2 credits each:

- `assets/shirt-front.png` — oversized boxy tee, oat
- `assets/cap.png` — unstructured six-panel, sage washed twill
- `assets/pants.png` — wide-leg canvas, clay

`assets/shirt.glb` is a textured PBR mesh of the shirt (30 credits,
`multi_image_to_3d`). **It is not used.** At 5.6MB it is over five times the
whole page budget and needs GLTFLoader plus hosting. Kept as a reference for
when something must genuinely rotate under user control.

## Before this goes anywhere real

- **Compress the images.** They are 1024×1024 PNGs at ~1.2MB each, 3.6MB total.
  As WebP at ~640px they should land near 50KB each. There is no ImageMagick,
  sharp, ffmpeg or cwebp on this machine, so this is a deliberate manual step.
  (`convert` here is the Windows FILESYSTEM converter — never point it at images.)
- **Decide hosting.** Images are external files, so this cannot be pasted into a
  GoHighLevel funnel as one self-contained block the way a code-3D build can.

## Verified

Images load (3/3, 1024×1024), no console errors, no horizontal overflow
(scrollWidth === clientWidth), cross-fade weights correct across scroll
(0.84 / 0.16 / 0 at the first handover), geometry centred correctly.

**Not verified:** the scrolled appearance. The preview pane stopped repainting
past the first screen — a plain non-sticky section with its top at the viewport
top also captured blank — so the screenshots were not trustworthy. Open it
locally to judge the look.
