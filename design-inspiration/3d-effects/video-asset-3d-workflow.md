# Video-asset 3D (the cheaper, faster path)

Extracted from a second walkthrough supplied by Angel, Sept 2026. This is a
DIFFERENT technique from `reference-first-3d-workflow.md`, not a variation of
it. Both are valid; they trade off against each other.

## The two paths

| | Code 3D (Three.js) | Video 3D (Kling/Higgsfield) |
|---|---|---|
| Build time | 40+ min | ~15 min |
| File size | under 1MB, self-contained | needs hosted assets |
| Cost per site | tokens only | ~$2-5 in credits |
| Look | stylised, geometric | photoreal |
| Changing it | re-prompt freely ("make it night") | regenerate the clip |
| Self-contained | YES | NO -- assets need hosting |

Photoreal interiors, exploded product views and real materials are far easier as
video. Stylised, abstract or brand-coloured scenes are better in code.

## The flow

1. Bullet points + a taste/design skill -> one-shot the page.
2. Generate a 5s clip in Higgsfield (Kling 3.0), 16:9, 1080p.
3. Hand the file to the agent and have it integrated.
4. Deploy.

Generate 2-3 clips at once and keep the best. Roughly $0.36 a clip, so the
retries are cheaper than the time spent nursing one.

## Asset prompt patterns that work

Consistent elements: white background, no text, "should read like something on a
landing page", explicit framing constraints.

- **Panning scene** — "high quality 3D render style video panning through a
  [scene]. White background. High quality."
- **Rotating object** — say the centre of mass must not move and it should
  rotate on its axis. Without that it drifts across frame and cannot loop.
- **Exploded view** — "explode in all directions, vertically and horizontally,
  none of it leaving the bounds of the video." The bounds clause is what stops
  parts flying off-frame.

## The two integration techniques

**Hero background.** Video behind the headline, centred, with an **inward
masking gradient** so the clip's edges dissolve into the page instead of ending
at a hard rectangle. If a visible seam appears between the video and the page
background, the fix is "make the gradient stronger at top and bottom".

**Scroll-scrub (the valuable one).** Playing a video on scroll is laggy. Instead:
extract the video's frames as optimised JPEGs, preload them, and tie each frame
to scroll position. The user scrubs the animation by scrolling. This is the
Apple product-page technique and it is dramatically smoother than video
playback.

Trigger it with: "extract the frames as optimised JPEGs and tie each to scroll
position, with preloading."

## Optimisation is conversational

Plain instructions do real work here:
- "it's laggy, make it load significantly faster" -> frame extraction, preloading
- "make the hero faster" -> compression (5.3MB down to ~252KB in the demo)
- "mobile optimise this" -> run it three or four times, not once

## VELPI-SPECIFIC WARNING

Neither video deploys to GoHighLevel, so neither hits this:

**Video and frame-sequence assets are NOT self-contained.** A GHL funnel paste is
one HTML block. A hosted .mp4 or a folder of JPEG frames must live somewhere
with a public URL and be referenced from the page.

So for a GHL build:
- Code 3D (Three.js) pastes in whole and works. Nothing external.
- Video 3D needs the assets hosted first (Supabase storage, a CDN, or the
  Netlify/Vercel deploy), then referenced by absolute URL.

This does not rule out video — it means the hosting step is mandatory rather
than optional, and it must be decided before the build, not after.
