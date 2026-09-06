# Capability playbook

What Claude can actually do in this studio, what it cannot, and the workaround
for each. Written so that when something is blocked, the answer is "try this
instead" rather than "I can't."

Sources: four workflow walkthroughs supplied by Angel (Sept 2026), plus findings
from actually running the tools here. Detailed technique notes live in
`design-inspiration/3d-effects/`.

---

## 1. Hard limits, and what to do instead

| Blocked | Do this instead |
|---|---|
| **Watching video files** (.mp4/.mov) | Ask for a screenshot of the frame showing the effect, the site's exported `.html`, or a link. Any of the three beats the video. Name the library if the video says one. |
| **Cropping/resizing images** | No ImageMagick, sharp, ffmpeg or cwebp here. `convert` on this machine is `C:\WINDOWS\system32\convert.exe`, the FILESYSTEM converter — never call it on image files. Generate at the framing and size wanted instead. |
| **Seeing a page without serving it** | `file://` renders as a static snapshot with JavaScript disabled, so WebGL shows nothing. Serve over HTTP on a local port and open that. |
| **Bash heredocs with HTML/JS** | They break on backticks, `content:''` and `$`. Use the Write tool for any file with code in it. |
| **Interactive CLI prompts** | Non-interactive flags only (`-y`, `--yes`). Never `git rebase -i`, never a command that opens an editor. |
| **`npx next build` while a dev server runs** | It overwrites `.next` and desyncs webpack chunks — the running server then throws `Cannot find module './948.js'`. Stop the server first, or use `node --check` on the file. |

## 2. Higgsfield — what it costs and when to reach for it

Preflight ANY generation with `get_cost: true`. It submits nothing and returns
the exact credit price. Do it before spending on anything unfamiliar.

| Need | Tool / model | Cost | Notes |
|---|---|---|---|
| Product / commercial image | `generate_image` `marketing_studio_image` | **2 credits** | Best value in the whole toolkit. Excellent garments, products, objects. |
| 4K, text in image, diagrams | `generate_image` `nano_banana_pro` | ~2 | |
| People, portraits, fashion, UGC | `generate_image` `soul_2` | ~2 | |
| Video clip | `generate_video` | ~7.5 | ~$0.36. Generate 2-3, keep the best. |
| Textured 3D mesh | `generate_3d` `multi_image_to_3d` | **30 credits** | 1-4 views. See the warning below. |

**Chaining without re-uploading:** pass a previous job's `job_id` straight into
`medias[].value`. No download-and-reupload round trip.

**Polling:** `jobs_wait` with up to 12 jobs at once. Images take ~30s; a textured
PBR mesh took ~25 minutes. Start long jobs, do other work, poll back.

### The 30-credit lesson: GLB is usually the wrong answer for web

A textured PBR shirt mesh came back at **5.6MB** — more than five times the
entire page budget — and needs `GLTFLoader` plus hosting on top. The flat
generated PNG of the same shirt was 1.2MB and looked better on a page.

Reach for a mesh only when the object must genuinely rotate in 3D under user
control. For anything that just needs to look real, generate the image.

## 3. The four build workflows

1. **Reference-first** — paste a URL, "recreate this in a single HTML file,
   self-verify until it's perfect". No adjectives. Then mold it.
2. **Image-first (preferred for originality)** — blend 4-6 inspiration
   screenshots into ONE generated image, save as `reference/reference.png`,
   build that. The design is original before any code exists.
3. **Video-asset** — generate a clip; hero background with an inward masking
   gradient; for scroll, extract frames as optimised JPEGs and tie them to
   scroll position rather than playing the video.
4. **Multi-view → mesh** — 4 views of an object → `multi_image_to_3d` → GLB →
   Three.js. Subject to the size warning above.

## 4. Settings that decide quality

- **Effort: extra / max.** The single biggest quality lever. Low effort means
  less research and fewer self-checks. Real builds run 40+ minutes.
- **`ACESFilmicToneMapping`** on every Three.js renderer. Without tone mapping,
  3D renders dark and muddy — the most common complaint about AI-built 3D.
- **Static first, animation second.** Never both in one pass.
- **Reviewer capped at 3-5 rounds.** Uncapped, a reviewer always finds something
  and never terminates.
- **Iterate video at 480p, encode once at 1080p.** Most of the credit spend saved.
- **Scope corrections.** Name two or three things, say ignore the rest.
- **Polish rough feedback into a precise prompt** before sending it to a builder.

## 5. VELPI's own constraints

- **GoHighLevel takes ONE HTML block.** A `<script>` must be a sibling of the
  page wrapper, never nested inside a `<div>`. This is the rule that silently
  breaks everything.
- **Self-contained means code.** Geometry generated in JavaScript pastes in
  whole and stays under 1MB. Images, video, GLB and frame sequences all need
  hosting and absolute URLs. Decide this BEFORE building.
- **Pin exact CDN versions.** Never `@latest`.
- Every JS-driven region needs a CSS fallback that looks finished alone.
- Honour `prefers-reduced-motion`; lazy-init on scroll; tear down on exit.
- Generated PNGs land at ~1.2MB. Convert to WebP before production — there is
  no local tooling for it, so it is a deliberate step, not an automatic one.

## 6. When to speak up

Offer the alternative rather than reporting the block:

- Asked for something photoreal and building it from primitives → generate it.
- Handed a video to learn from → ask for a frame or the HTML.
- A page needs to look real but must paste into GHL → images are hosted, code 3D
  is not; raise it before building, not after.
- Something must rotate under user control → that is code or a mesh, never a clip.
- An asset is about to be generated for a layout still in flux → settle the
  layout first, or it gets thrown away.
