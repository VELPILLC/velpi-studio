# VELPI STUDIO — COMPLETE TECHNICAL ARCHITECTURE DOCUMENT

> Audience: a senior AI engineer who has never seen this project. Goal: full architectural transparency so the system can be improved **without breaking existing functionality**.
> Method: every claim below is grounded in the actual source at `C:\Users\angel\velpi-studio`. Where something could not be verified from source, it is explicitly marked **[UNVERIFIED]** or **[GAP]**.
> Snapshot date: 2026-07-07. Git branch at time of writing: `main` (clean).

---

## 0. SOURCE-OF-TRUTH NOTES & WHAT WAS NOT READ

Files read **in full** and quoted from directly: `lib/claude.js`, `lib/supabase.js`, `lib/designStyles.js`, `lib/motionPresets.js`, `lib/sectionPresets.js`, all 15 route files under `app/api/**`, `app/preview/[id]/route.js`, `app/layout.js`, `app/page.js`, `components/Studio.js` (all 1609 lines), `scripts/build-refero-json.cjs`, `package.json`, `next.config.js`.

Files **partially read**: `components/LightningBackground.js` (first 40 of 168 lines — enough to characterize it as a decorative canvas animation).

Files **NOT read** (flagged so no assumptions are made about them): `app/globals.css`, `tailwind.config.js`, `postcss.config.js`, `start-velpi.bat`, `.env.local` (secrets), `package-lock.json`, the 38 `lib/refero/*.md` source files, and the `presets/styles/*/{design.md,tokens.json,css-vars.css,tailwind.config.snippet.js}` token artifacts (their existence and role are documented, but their individual contents were not audited). Statements about these are marked **[UNVERIFIED]**.

---

## 1. PROJECT OVERVIEW

### 1.1 What this project does
Velpi Studio is a **single-page website mockup generator**. A user pastes a business's existing website URL (or a business name) and uploads that business's logo. The system crawls the site, extracts every real fact, infers a brand + conversion strategy, generates copy and imagery, and produces **one self-contained HTML file** — a premium redesign of that business's site — optimized to be pasted into **GoHighLevel** (a CRM/website builder). The output is a scoped, JS-free, single-`<style>`-tag HTML document with tokenized image placeholders.

The intended commercial use (per user context, not in code): the operator sells premium websites to local businesses and transfers the generated HTML into GoHighLevel, swapping tokenized images for GoHighLevel-hosted media URLs.

### 1.2 Overall workflow (high level)
`URL + logo` → crawl (Firecrawl) → analyze (Claude) → [client-side selection of design systems + motion + section references] → design brief (Claude) → copy (Claude) ∥ images (OpenAI gpt-image-1) → build HTML (Claude) → post-generation options (alt-layouts, per-slot regenerate, refine chat) → auto-save to library → export HTML / images / decision artifacts.

### 1.3 Design philosophy (as encoded in the prompts and code)
- **Anti-template, anti-generic.** The build prompt (`app/api/build-site/route.js`) contains an explicit "ANTI-GENERIC LEDGER" of template-tells to avoid and *requires* at least three "compositional moves a template builder could not produce," self-declared in an HTML comment after `<!DOCTYPE html>`.
- **Conversion-first.** A `conversion_strategy` object (objections→answers, proof map, offer, persuasion flow) is produced during analysis and is treated as "the page's brain" that aesthetics must serve.
- **Brand continuity / elevation, not reinvention.** Every stage insists the new site be an *elevated version of the same brand* (same palette, personality, design language), never a different company.
- **Deterministic-but-varied selection.** Design-system, motion, and section choices use scoring + seeded random sampling + an anti-repetition memory (last 5 runs) so two runs of the same business differ without becoming inappropriate.
- **Autonomy/agency in prompts.** The analyze, brief, and build prompts repeatedly grant the model "creative license," instruct it to "own the outcome," form a POV, take a "gamble," and never ask questions.
- **Graceful degradation everywhere.** Nearly every route has a non-fatal fallback (empty brief, pass-through images, "treat as pass," etc.) so no single failure wedges the pipeline.
- **GoHighLevel constraints as hard requirements.** `.velpi-page` selector scoping, `@import` fonts (never `<link>`), single `<style>` tag, no JavaScript, no `position:fixed`.

### 1.4 Intended user experience
A minimal, mobile-styled dark UI (`components/Studio.js`) with two required inputs (Step 1 Website, Step 2 Logo), a single **Generate Website** button, a live step tracker (7 steps), then a results area: a phone-scale live preview, a refine chat box, alternate-structure cards, an Assets manager (download/replace/regenerate/paste-GHL-URL per slot), an Export row (copy/download HTML + `decisions.md` + `assets.json` + `prompt-trace`), a collapsible Project Details panel, a Save-to-Library button, and a persistent Library gallery of past builds with shareable `/preview/{id}` links.

### 1.5 Core objectives
1. Turn any local-business site into a premium, conversion-optimized mockup in ~1–3 minutes.
2. Preserve every real fact (no hallucinated hours/phones/reviews).
3. Produce GoHighLevel-ready, single-file, JS-free HTML.
4. Provide full auditability (exact prompt trace, image-API attestation, decision report).
5. Never ship a broken or all-placeholder page (image completion gate, validation gates).

### 1.6 Current maturity level
**Production, live, single-operator.** Deployed on Vercel (auto-deploy on push to `main`), backed by Supabase. The pipeline is complete and robust with extensive guardrails. Two routes (`critique-site`, `enhance-site`) are fully built but **currently dormant** (not invoked by the client — see §3.10). No test suite exists. No CI beyond Vercel build. The reference libraries are static (read-only at runtime) — the system does **not** learn or self-expand today.

---

## 2. COMPLETE WEBSITE GENERATION PIPELINE

The orchestration is **client-side** in `components/Studio.js` → `runGeneration()` (lines 569–870). Each server route is a Next.js App-Router `POST` handler. All AI routes declare `export const maxDuration = 300` (5-minute Vercel limit).

### 2.1 Exact execution order (verbatim from `runGeneration`)
1. **Reset state** (569–584): clears all prior results, sets `generating=true`.
2. **`mark('crawl','active')` → `POST /api/scrape { input }`** (595–597). Returns `scrapedData`.
3. **`mark('logo','active')`** (602). Builds `refinePayload`:
   - if a logo was uploaded → `{ b64: logo.data, instructions: logoNotes }`
   - else if `scrapedData.logo` exists → `{ url: scrapedData.logo, instructions: logoNotes }`
   - else → `null`.
   - Fires `POST /api/refine-logo` as a **non-blocking promise `refineP`** (607–630). On success sets `refinedLogo` + `assetsById.logo`. Marks logo complete in every branch.
4. **Uploaded-logo palette merge** (633–635): if a logo was uploaded and colors were extracted client-side, they are prepended to `scrapedData.palette` (deduped, capped at 6).
5. **`mark('analyze','active')` → `POST /api/analyze { scrapedData, vibe }`** (637–639). `vibe` = `vibeSummary()`, which is empty `''` for fresh runs (manual vibe UI removed). Returns `analysis`.
6. **Vibe inference resolution** (644–649): `vibeText` = manual vibe if present, else composed from `analysis.inferred_vibe` (`feel`/`look`/`primary_cta`).
7. **Slot derivation** (654–659): maps `analysis.image_inventory` → `photoSlots` (`{id,name,section,prompt}`), then appends a `logo` slot. `slotIdFor` returns `'logo'` for header/logo items, else `img_<slot>`.
8. **Anti-repetition memory read** (663–666): reads `localStorage['velpi_gen_history']` (array, last 5). Derives `avoidMotionIds` and `avoidMixSigs`.
9. **Design-system selection** (668–682): `pickCreativeMix(styles, nicheText, vibeText, 3, avoidMixSigs)` → `chosenStyles` (up to 4 systems). Sets `matchedStyleName`. `mark('analyze','complete')`.
10. **Motion selection** (688): `pickSignatureMotion(analysis, vibeText, avoidMotionIds)` → one motion preset.
11. **Section references** (692): `pickSectionReferences(analysis, 4)` → up to 4 structural patterns.
12. **`mark('brief','active')` → `POST /api/design-brief { analysis, vibe, styleMds, motion }`** (696–708). Non-fatal (marks `error`, continues) — returns `brief` text or `''`.
13. **`mark('images','active')` → `POST /api/generate-images { analysis }`** as a **non-blocking promise `imagesPromise`** (710–733). On resolve: builds `assetsById` from returned assets, stores `imagesMeta`, surfaces any warning as an error banner, sets `imagesReady`.
14. **`mark('copy','active')` → `POST /api/generate-copy { analysis }`** — **awaited** (735–737). Returns `copy`.
15. **`mark('build','active')` → `POST /api/build-site { analysis, copy, vibe, slots, styleMds, brief, motion, sectionRefs }`** — **awaited** (739–758). Stores `buildPayload` in `lastRunRef` (for alt-layout rebuilds). Returns `{ html, trace }`. Sets `htmlTemplate`, `built=true`, `promptTrace`.
16. **Alt-layouts** (762–765): `POST /api/alt-layouts { analysis, currentOrder }` fired in background; sets `altLayouts`.
17. **Compose decision report** (770–774): `composeReport(...)` + auto-inferred-vibe block + motion block + section-refs block → `buildReport`.
18. **`await Promise.all([imagesPromise, refineP])`** (776).
19. **IMAGE COMPLETION GATE** (778–808): up to 2 rounds; for each still-missing photo slot, re-calls `/api/generate-images` with a single synthetic `image_inventory` item (`action:'generate'`). Any slot still missing after 2 rounds → `mark('images','error')` + a specific error message telling the user to use Regenerate.
20. **Write anti-repetition memory** (810–821): pushes `{motionId, mixSig, palette0, hero, at}` to front of history, slices to 5, writes `localStorage`.
21. **AUTO-SAVE** (823–862): substitutes tokens into HTML, captures a thumbnail (`captureThumb` via html2canvas in a hidden iframe), builds `projData`, `POST /api/projects { name, data }`. Prepends to `projects`. Any failure surfaces loudly as an error (a prior silent failure hid a missing table for weeks).
22. **`finally`**: `setGenerating(false)`.

### 2.2 Step-by-step subsystem detail

**Website analysis / content extraction — `/api/scrape` (`app/api/scrape/route.js`).** Pure deterministic JS + Firecrawl + Supabase.
- `looksLikeUrl` / `normalizeUrl` decide URL vs. business-name search. Business name → `app.search(input,{limit:1})` → first result URL.
- `app.scrapeUrl(targetUrl,{formats:['markdown','html']})` for the home page.
- `app.mapUrl(targetUrl,{limit:60})` to enumerate site links; filters same-domain, prioritizes pages matching `PRIORITY = /about|service|menu|contact|team|gallery|pricing|location|hour|review|testimonial|portfolio|work|faq/i`, takes up to `EXTRA_PAGE_LIMIT = 5` extra pages.
- Extra pages scraped in parallel (`Promise.allSettled`, markdown only), merged; total `content` capped at **40 000 chars**.
- `extractImages` regex-parses `<img src>` from home HTML (≤40, no `data:`); markdown images `![alt](url)` also collected (≤60) with alt text; merged, deduped, capped at 40.
- `extractLogo` best-source-first: `<img>` whose src/alt/class contains "logo" (prefer png/svg/webp) → `apple-touch-icon` → `<link rel=icon>` (largest, non-`.ico`) → `og:image`.
- `extractPalette` counts 3/6-digit hex codes in HTML, drops `#ffffff`/`#000000`, returns top 6 by frequency.
- **Palette caching:** `getSavedPalette(domain)` (Supabase `domain_palettes`); if absent, extract + `savePalette`. `paletteFromCache` flag returned.
- Output: `scrapedData = { url, domain, pagesCrawled, title, description, content, images[{url,alt}], logo, palette, paletteFromCache }`.

**Brand analysis / conversion strategy / image plan — `/api/analyze` (`app/api/analyze/route.js`).** Claude, `maxTokens:16000`.
- System prompt = `SYSTEM` (a ~115-line strategist prompt) + `INDUSTRY_PATTERNS`. Full verbatim in §4.2.
- 5 internal steps: RECON (exhaustive fact extraction) → DIRECTION → INFER THE VIBE → CONVERSION STRATEGY → IMAGE PLAN (5–8 photographic prompts).
- Returns a large JSON: `business_name, industry, niche, primary_service, target_customer, tone, design_direction, target_feeling, inferred_vibe{feel,look,primary_cta}, color_palette[], sections[], layout{section_order,notes}, facts{phone,emails,address,hours,socials,credibility,services,reviews}, conversion_strategy{primary_action,secondary_action,objections[],proof_map[],offer,persuasion_flow[]}, brand{...many...}, image_inventory[{slot,what,section,source,action,url,prompt}]`.
- **Self-repair:** if parse fails or `business_name` missing, one repair pass via `REPAIR_SYSTEM` (fixes unescaped inner quotes / truncation). If still bad → 502.
- **Normalization** (159–188): backfills `sections`/`layout.section_order`; guarantees a logo item is first if `scrapedData.logo` exists; caps photographic items at 8 and renumbers slots; backfills `color_palette`; attaches `_source`.

**Logo refinement — `/api/refine-logo` (`app/api/refine-logo/route.js`).** OpenAI `gpt-image-1` **edit**.
- Accepts `{b64}` (uploaded) or `{url}` (crawled; server fetches with a browser User-Agent + Referer). SVG/ICO are rejected for the edit endpoint → returns original.
- Prompt (verbatim §4.7): "refinement, NOT redesign" — preserve full lockup, 1:1, fill ≥92% of frame, transparent background, 4K clean. Optional user `instructions` appended.
- Two `images.edit` attempts (full params → minimal params on rejection) + one retry with a fresh file handle. Non-fatal: falls back to `{b64:null, src:url, refined:false}`.

**Color extraction.** Two independent paths: (1) server-side from crawled HTML (`extractPalette` in scrape), cached per domain in Supabase; (2) client-side from an uploaded logo (`extractLogoColors`, `Studio.js:459`) — canvas 48×48 sampling, skips near-white/black, buckets by 5-bit-quantized RGB, returns top 3. Uploaded-logo colors are merged into `scrapedData.palette` before analyze.

**Typography selection.** Not a discrete step — decided *inside* the design brief (`TYPE SYSTEM` section) and the build prompt (Google Fonts pairing via `@import`). The DESIGN.md reference systems specify concrete font families. No programmatic font selector exists.

**Image extraction / enhancement / generation — `/api/generate-images` (`app/api/generate-images/route.js`).** OpenAI `gpt-image-1`.
- Reads `analysis.image_inventory`; each item has `action ∈ {keep, enhance, generate}` and `source ∈ {real, none}` decided during analyze.
- `MAX_AI_OPS = 8` budget. Plans pass 1: logo/keep/plain-real → passthrough; `enhance`/`generate` → AI op (until budget exhausted).
- **Theme cohesion:** `THEME_LINE` (palette + mood color-grade) appended to every AI prompt; `PRO_TOUCHUP` (authentic retouch contract) appended for `enhance`.
- **`enhance`** → `openai.images.edit({model:'gpt-image-1', image:<fetched file>, ...})`; **`generate`** → `openai.images.generate(...)`. Hero slots (section/what matches `hero`) → `1536x1024` `high`; others → `1024x1024` `medium`.
- **Concurrency** via `mapLimit(plans, 3, ...)` (3 at a time — OpenAI rate-limit safety).
- **Retries:** up to 2 attempts/op. Attempt 2 distinguishes rate-limit (429 → 20s backoff, same prompt) from content-policy (→ sanitized `fallbackPrompt` stripping parenthetical names, generic role language). `enhance` never swaps to fallback (keeps the real image).
- **Failure recording:** falls back to original photo but records a `failures[]` entry (so a dead key can't masquerade as success). A 401 across ops sets a loud `warning`.
- Output: `{ assets:[{id,role,section,prompt,kind:'logo'|'photo'|'enhanced'|'generated',src}], warning, meta{apiCalled,aiCalls,generated,enhanced,keptOriginal,logo,failures,at} }`.

**Layout generation.** Two mechanisms: (1) primary `section_order` comes from `analyze`'s `layout.section_order`; (2) `/api/alt-layouts` proposes exactly two alternate section orderings post-build; the user can rebuild with one via `switchLayout` → `build-site` with `forcedLayout`.

**Component / copy generation — `/api/generate-copy` (`app/api/generate-copy/route.js`).** Claude, `maxTokens:16000`. Direct-response copywriter. Returns `{sections:{<key>:{heading,subheading?,body?,cta?,items?[]}}}` using exact section keys from analysis. Executes the conversion strategy (primary_action as CTA, objection answers in assigned sections, offer in hero + closing). Does **not** reproduce full review quotes verbatim (paraphrase ≤12 words) — reviews are rendered separately by the builder from `facts.reviews`. Same self-repair pass as analyze.

**Animation generation.** No per-run AI generation of animations. A single **signature motion** preset is *selected* (not generated) by `pickSignatureMotion` from `presets/motion/manifest.json`, and its CSS-only `snippet` is injected into the build prompt with strict containment/weight/visibility rules. The build prompt also mandates tasteful CSS-only micro-animations (hero entrance, hover transitions, animated underlines) with `prefers-reduced-motion` respected.

**Responsive behavior.** Enforced entirely by the build system prompt's "MOBILE-FIRST OUTPUT CONTRACT": base CSS ~390px, enhance via `@media (min-width:768px)` and `(min-width:1200px)`, edge-to-edge sections, `clamp()` fluid type, full-width CTAs, ≥16px body text, no horizontal scroll, JS-free mobile nav (logo + one CTA on mobile). A **mandatory viewport meta tag** is a hard requirement.

**Code generation — `/api/build-site` (`app/api/build-site/route.js`).** Claude, `maxTokens:64000`, streamed. Full system + user prompt verbatim in §4.5. Produces the entire single-file HTML with `%%IMG:id%%` tokens (never substituted server-side here). Validates output starts with `<html`/`<!doctype`. Returns `{html, trace:{system,user}}`.

**Preview generation.** Client-side: `previewHtml()` (Studio.js:425) substitutes tokens (GHL URL > asset > logo > placeholder SVG) into an `<iframe srcDoc>` (mini preview + full mobile modal). Server-side public preview: `/preview/[id]` (`app/preview/[id]/route.js`) fetches the saved project and substitutes tokens into a real HTML response.

**Export.** `finalHtml()` (Studio.js:433) substitutes tokens preferring pasted GHL URLs, then generated assets, then `https://PASTE-IMAGE-N-URL-HERE` placeholders. Buttons: Copy HTML, Download `.html`, `decisions.md`, `assets.json`, `prompt-trace.txt`, full-page PNG (html2canvas), Download-All images.

**Saving to memory.** Auto-save (every run) + manual Save button → `POST /api/projects` → Supabase `projects.data` jsonb. Anti-repetition memory → `localStorage`. Palette cache → Supabase `domain_palettes`. (Full detail §5.)

---

## 3. AGENT ARCHITECTURE

There is **no multi-agent framework**. "Agents" here = logical subsystems, most of which are a single Claude call with a specialized system prompt, plus deterministic JS selectors. All Claude calls go through `callClaude()` (`lib/claude.js`) using model **`claude-sonnet-4-5`**, streamed via `client.messages.stream(...).finalMessage()`. All image ops use OpenAI **`gpt-image-1`**.

### 3.1 Scrape subsystem (deterministic)
- **Purpose:** gather all raw material from the target site.
- **Inputs:** `{input}`. **Outputs:** `scrapedData`.
- **Prompt:** none (Firecrawl + regex). **Interacts with:** Supabase palette cache; feeds `analyze`.
- **Decisions:** URL vs. search; which extra pages; logo source priority; palette by frequency.

### 3.2 Analyze agent (Claude)
- **Purpose:** brand/strategy recon → the pipeline's structured brain.
- **Inputs:** `{scrapedData, vibe}`. **Outputs:** `analysis` (see §2.2). **Prompt:** §4.2. **maxTokens:** 16000 (+16000 repair).
- **Interacts with:** feeds every downstream stage (client selectors, brief, copy, images, build, critique).
- **Decision-making:** infers vibe itself when no manual vibe; commits to one creative direction; builds a conversion strategy from *only real facts*; plans 5–8 image prompts with `source`/`action` per slot.

### 3.3 Design-system selector `pickCreativeMix` (deterministic, `lib/designStyles.js:309`)
- **Purpose:** choose 4 DESIGN.md systems to fuse. **Inputs:** `(styles, industryText, vibeText, n=4, avoidMixes)`. **Outputs:** array of style objects.
- **Algorithm:** score each style by niche-substring match (tags >4 chars = +2 else +1) and vibe-keyword hits against `name+tags+first-700-chars`. Anchor = top niche match (deterministic). Candidate pool = top 14 by `total = niche*2 + vibe`. Sample the remaining slots with `Math.pow(Math.random(),1.6)*bag.length` (front-weighted). Up to 6 redraws to avoid `avoidMixes` signatures.
- **Note:** called from `Studio.js:674` with `n=3` (so 3 additional + anchor patterns; effectively up to 4 total, but n=3 means the loop fills to 3 picks — see §13 for the n-value nuance).

### 3.4 Motion selector `pickSignatureMotion` (deterministic, `lib/motionPresets.js:32`)
- **Purpose:** choose exactly ONE background/motion treatment. **Inputs:** `(analysis, vibeText, avoidIds)`. **Outputs:** one preset `{id,name,effect,intensity,dependency,niches,summary,snippet}` or null.
- **Algorithm:** compute target intensity (`SUBTLE_NICHES`/`BOLD_NICHES` + vibe nudges), score presets (`effect==='background'` +3; intensity gap 0→+4/1→+1/>1→−3; niche match +3 each; `css-only` +1), sample from top 6 with `Math.pow(Math.random(),1.5)`. Filters out `avoidIds` when ≥3 remain.

### 3.5 Section-reference selector `pickSectionReferences` (deterministic, `lib/sectionPresets.js:26`)
- **Purpose:** pick up to 4 structural HTML patterns matching the page's section flow. **Inputs:** `(analysis, n=4)`. **Outputs:** array of `{id,name,category,reference,...}`.
- **Algorithm:** map `section_order` keys → categories via `SECTION_TO_CATEGORY`; for each wanted category, pick the highest niche-scored entry of that category. (Only categories in the map are reachable; `nav`-category presets are unreachable — see §13.)

### 3.6 Design-brief agent (Claude)
- **Purpose:** fuse brand + vibe + chosen systems + motion into ONE committed text brief. **Inputs:** `{analysis,vibe,styleMds,motion}`. **Outputs:** `{brief}` (≤700 words) or `{brief:''}`. **Prompt:** §4.3. **maxTokens:** 2500.
- **Decision-making:** forms a POV, names a "GAMBLE," commits palette map/type system/hero/section treatments/signature details/motion placement/mobile behavior. Non-fatal.

### 3.7 Copy agent (Claude)
- **Purpose:** section-by-section conversion copy. **Inputs/Outputs/Prompt:** §2.2 / §4.4. **maxTokens:** 16000 (+repair).

### 3.8 Image agent (OpenAI, orchestrated by deterministic JS)
- **Purpose:** enhance real photos / generate missing ones, all theme-graded. Detail §2.2. Note: the *decisions* (keep/enhance/generate, prompts) are made by the analyze agent; this subsystem executes them.

### 3.9 Build agent (Claude)
- **Purpose:** write the entire HTML. **Inputs:** `{analysis,copy,slots,brief,motion,sectionRefs,vibe,styleMds,forcedLayout}`. **Outputs:** `{html,trace}`. **Prompt:** §4.5. **maxTokens:** 64000.
- **Decision-making:** executes the brief and conversion strategy; enforces anti-generic + mobile + GHL + legibility contracts; performs an internal one-pass self-critique (prompted, not a separate call).

### 3.10 Critique agent + Enhance agent (Claude) — **BUILT BUT DORMANT**
- `/api/critique-site` (`app/api/critique-site/route.js`): brutal QA director → `{score,pass,issues[]}`, `pass` only if `score>=88` and zero critical/major, with a hard "signature moment" gate (missing gamble → score 0, cannot pass). Prompt §4.6. maxTokens 3000. Unreadable verdict → `{pass:true,score:null}` (never wedges).
- `/api/enhance-site` (`app/api/enhance-site/route.js`): two modes — **elevation** (`SYSTEM`) full rebuild for polish, and **surgical fix** (`SYSTEM_FIX`, triggered when `issues[]` non-empty) that changes only listed issues. Safety gates: output must be valid HTML, ≥55% of original length, identical `%%IMG:%%` token set, contains `velpi-page`; otherwise returns the original untouched (`pass2:false`). maxTokens 64000. Prompts §4.6.
- **Critical fact:** `Studio.js` does **not** call either route. Lines 767–769 state the critique/elevation loop was "baked directly into the one build-site call." So these two routes are live, deployable, and unused. (This is the single most important extension seam — see §14.)

### 3.11 Alt-layouts agent (Claude)
- `/api/alt-layouts`: two alternate section orders. Prompt §4.8. maxTokens 1500. Non-fatal (`{alternates:[]}`).

### 3.12 Edit agent (Claude)
- `/api/edit-site`: single-instruction HTML patch preserving everything else and all tokens. Prompt §4.9. maxTokens 64000.

### 3.13 Interaction map
```
scrape ─► analyze ─┬─► pickCreativeMix ─┐
                   ├─► pickSignatureMotion ─┤
                   ├─► pickSectionReferences ┤
                   ├─► design-brief ◄────────┘ (uses styles+motion)
                   ├─► generate-copy
                   └─► generate-images (executes analyze's image plan)
design-brief + copy + images + styles + motion + sectionRefs ─► build-site ─► HTML
build-site ─► alt-layouts (bg) ; HTML ─► edit-site (user) ; HTML ─► [critique-site ─► enhance-site]* DORMANT
refine-logo runs in parallel from scrape.logo/upload
```

---

## 4. PROMPTS (verbatim)

All prompts live inline in their route files as template literals. Below, each is identified by file and constant name. **These are the exact strings in source** (reproduced faithfully; where extremely long, the full text is in the cited file — quoted here in full for the load-bearing ones).

### 4.1 Shared Claude wrapper (`lib/claude.js`)
- `MODEL = 'claude-sonnet-4-5'`. `callClaude({system,user,images,maxTokens})` streams and returns `final.content[0].text`.
- `stripFences(raw)` removes ```` ```html|```json|``` ````.
- `parseJson(raw)` = `JSON.parse(stripFences)` with a `{...}` regex fallback; returns null on failure.

### 4.2 `analyze` — `SYSTEM`, `INDUSTRY_PATTERNS`, `REPAIR_SYSTEM` (`app/api/analyze/route.js`)
- `REPAIR_SYSTEM`: instructs the model that the text was meant to be one JSON object; fix unescaped inner double-quotes first, else complete truncation; return JSON only.
- `INDUSTRY_PATTERNS`: per-industry structure hints (HVAC, Restaurant, Law, Gym, Medical/Dental, Contractor, Salon, Retail, Real estate, Auto).
- `SYSTEM`: the strategist prompt with the 5 STEP blocks (RECON, DIRECTION, INFER THE VIBE, CONVERSION STRATEGY, IMAGE PLAN), the full output JSON schema, and the Rules block (5–8 images across ≥5 sections; "REUSE REAL PHOTOS AGGRESSIVELY — AND ALWAYS ENHANCE + THEME THEM"; never invent facts; brand continuity; JSON-safety on inner quotes). **Full text: `app/api/analyze/route.js:20–115`.**
- User prompt (124–136): includes optional creator vibe, title/description/domain, existing palette, logo URL, up to 30 images with alts, and the crawled content sliced to **36 000 chars**.

### 4.3 `design-brief` — `SYSTEM` (`app/api/design-brief/route.js:12–33`)
Creative-director fusion prompt. AUTONOMY RULES ("form your own POV," references are inputs not orders, bias toward the interesting choice). Output parts: **POV, THE GAMBLE, CONCEPT, PALETTE MAP, TYPE SYSTEM, HERO CONCEPT, SECTION TREATMENTS, SIGNATURE DETAILS, SIGNATURE MOTION, MOBILE BEHAVIOR**, ≤700 words. User prompt (42–52) supplies business/tone/locked palette/brand JSON/vibe/conversion strategy/section order/pre-selected motion/up to 3 systems (each sliced to 4000 chars).

### 4.4 `generate-copy` — `SYSTEM`, `REPAIR_SYSTEM` (`app/api/generate-copy/route.js:6–33`)
Direct-response copywriter rules (third-grade reading level, CTA per action-section, only verifiable facts, no verbatim reviews, JSON-safety). Output `{sections:{...}}` with exact keys. User prompt (42–64) supplies business/industry/niche/service/customer/tone/section keys/`facts` JSON/`conversion_strategy` JSON + execution rules.

### 4.5 `build-site` — `SYSTEM` (`app/api/build-site/route.js:6–104`)
The largest prompt. Blocks: three internal questions; INDUSTRY AWARENESS; LAYOUT HIERARCHY (arrest/build/convert); VISUAL QUALITY (typography/whitespace/color/images/buttons/nav); "NEVER DO THESE"; CREATIVE AUTONOMY; **ANTI-GENERIC LEDGER** (+ mandatory 3 compositional moves declared in an HTML comment after `<!DOCTYPE html>`); SELF-CRITIQUE ONE PASS; CONVERSION STRATEGY EXECUTION; CONVERSION ARCHITECTURE; DENSITY & CRAFT (≥8 sections, ~500+ lines CSS); PREMIUM TECHNIQUES (CSS-only); DESIGN SYSTEM ADHERENCE; BRAND CONTINUITY; **OUTPUT RULES — OPTIMIZED FOR GOHIGHLEVEL** (single file, `@import` fonts, mandatory viewport meta, `.velpi-page` scoping, no JS, no `position:fixed`, MOBILE-FIRST CONTRACT, LEGIBILITY & CONTRAST, `%%IMG:id%%` placeholders only, image distribution rules, content-only facts). User prompt (143–176): business/vibe/industry/tone/direction/feeling/**THEME-LOCK palette**/section order/layout note/`factsBlock`/**signature motion snippet + containment rules**/`conversion_strategy` JSON/brand JSON/`brief`/style systems (1 or mixed)/structural references (each sliced to 2500 chars)/copy JSON/image slot list.

### 4.6 `critique-site` `SYSTEM` and `enhance-site` `SYSTEM` + `SYSTEM_FIX`
- `critique-site/route.js:11–32`: 9-criterion rubric (information completeness, conversion execution, mobile contract, visual craft, structural integrity, brand/brief adherence, genericness, motion discipline, **signature-moment hard gate**). `pass` requires `score>=88` and zero critical/major. Output JSON `{score,pass,issues[]}`, ≤8 issues.
- `enhance-site/route.js:11–41`: `SYSTEM` (art-director elevation — critique like the owner, push composition/type/rhythm/depth/density, hard constraints preserving content/tokens/palette/GHL/mobile) and `SYSTEM_FIX` (surgical punch-list mode — fix only listed issues, untouched sections byte-for-byte).

### 4.7 `refine-logo` prompt (`app/api/refine-logo/route.js:67–75`)
"Recreate this exact brand logo as a flawless, production-ready brand asset… refinement, NOT redesign… 1:1 square… ≥92% of canvas… fully transparent background… premium 4K-grade." Optional user `instructions` appended.

### 4.8 `alt-layouts` `SYSTEM` (`app/api/alt-layouts/route.js:9–27`)
Information-architect prompt: two meaningfully different structures, same content, both arrest→build→convert, each differing in ≥3 positions. Output `{alternates:[{name,hook,section_order,structure_notes}]}`.

### 4.9 `edit-site` `SYSTEM` (`app/api/edit-site/route.js:6–14`)
Single-change editor: make only the requested change, preserve everything else + all `%%IMG:%%` tokens + GHL constraints; return full document.

### 4.10 Prompt classification requested by the brief
- **System prompts:** all `SYSTEM`/`SYSTEM_FIX`/`REPAIR_SYSTEM` constants above (passed as `system` to `callClaude`).
- **Developer/tool prompts:** the per-route **user** templates that inject analysis/copy/facts/JSON (also in each route).
- **Hidden prompts:** none beyond these — there is no global preamble, no hidden middleware. `stripFences` post-processing is the only implicit transform.
- **Generation prompts:** analyze image `prompt` strings + `generate-images` `THEME_LINE`/`PRO_TOUCHUP`/`fallbackPrompt` + `refine-logo` prompt.
- **Evaluation prompts:** `critique-site` `SYSTEM` (dormant).
- **Memory prompts:** none — memory is data (localStorage/Supabase), not prompted.

---

## 5. MEMORY SYSTEM

There are **four** distinct persistence mechanisms. **No embeddings, no vector database, no semantic memory** exist anywhere in the codebase.

### 5.1 Anti-repetition memory (browser `localStorage`)
- **Key:** `velpi_gen_history`. **What:** array of the last **5** generations: `{motionId, mixSig, palette0, hero, at}` (`Studio.js:811–821`).
- **When stored:** after each successful build, before auto-save.
- **Retrieval:** read at the start of selection (`Studio.js:663–666`) into `avoidMotionIds` and `avoidMixSigs`.
- **Influence:** `pickCreativeMix` rejects style combos whose signature is in `avoidMixes` (up to 6 redraws); `pickSignatureMotion` filters `avoidIds` when ≥3 presets remain. This forces visible variation across consecutive runs.
- **Ranking/filtering/expiration:** FIFO window of 5 (`.slice(0,5)`); no scoring, no TTL beyond the window; per-browser (not shared across devices/users).

### 5.2 Domain palette cache (Supabase `domain_palettes`)
- **Columns:** `domain (PK), palette (jsonb), updated_at`. **Functions:** `getSavedPalette`, `savePalette` (`lib/supabase.js:38–62`).
- **When:** written during `/api/scrape` if no cache exists; read first. **Influence:** reuses a domain's extracted palette to avoid recomputation. **Expiration:** none (upsert on conflict). Best-effort (try/catch swallows errors).

### 5.3 Saved design styles (Supabase `design_styles`)
- **Columns:** `id uuid, name, niches (csv text), content, created_at`. **Functions:** `listStyles/saveStyle/deleteStyle` (`lib/supabase.js:66–95`).
- **When written:** only via `POST /api/styles` (manual paste of a DESIGN.md). **Never written by a build.**
- **Retrieval/influence:** `GET /api/styles` merges `BUILT_IN_STYLES` (marked `builtIn:true`) + DB rows (`builtIn:false`); the client loads this into `styles` once (`Studio.js:305`) and passes it to `pickCreativeMix`. **Thus a DB style automatically enters the selection pool** on next page load — the key seam for a future learning loop (§14). No ranking/embeddings/expiration.

### 5.4 Project library (Supabase `projects`)
- **Columns:** `id uuid, name, data (jsonb), created_at`. **Functions:** `listProjects/getProject/saveProject/deleteProject` (`lib/supabase.js:99–137`). `listProjects` uses jsonb arrow-selectors (`data->>thumb`, `->>niche`, `->>sourceUrl`) to avoid shipping multi-MB blobs.
- **`data` shape** (from `Studio.js:835–853`): `{bizName, niche, sourceUrl, analysisData, slots, assetsById, ghlUrls, htmlTemplate, buildReport, promptTrace, imagesMeta, vibe, refinedLogo, logoUrl, input, thumb, savedAt}`. `assetsById` holds **base64 data URIs** of generated/enhanced images (large).
- **When:** auto-saved every run (823–862) + manual Save button (`saveProjectToLibrary`, 310–330). **Retrieval:** `GET /api/projects` (light list) / `?id=` (full) → `loadProject` rehydrates all state; `/preview/[id]` renders publicly.
- **Influence on generation:** none automatically — a saved project can be *loaded* and edited, but past projects do **not** feed future style/motion selection. **Expiration:** none.

### 5.5 Reference libraries (disk, read-only at runtime)
`lib/designStyles.js` (`BUILT_IN_STYLES`: 44 handwritten + 38 refero = **82**), `lib/referoStyles.json` (38 entries, each with `cssVars`), `presets/motion/manifest.json` (**49** presets), `presets/sections/manifest.json` (**47** patterns). These are imported at build time and **never mutated at runtime**. (Counts verified via node at snapshot time.)

---

## 6. DESIGN LIBRARY

### 6.1 Design systems (`lib/designStyles.js` + `lib/referoStyles.json`)
- **Structure of a style:** `{id, name, niches[], content:"# DESIGN.md …", cssVars?}`. `content` is prose in a house format: `Mood / Colors / Typography / Layout / Components / Never`. Refero entries also carry `cssVars` (exact token values), appended to `content` at load time by `referoWithTokens` (`designStyles.js:257–259`) under an "EXACT DESIGN TOKENS" header.
- **Counts:** 82 total (44 `builtin_*` handwritten + 38 `refero_*`). Handwritten cover niches (restaurant, trades, clinic, law, gym, salon, spa, real-estate, auto, retail, tattoo/barber, coach, saas, home-services, church, kids, gallery, brewery, hotel, wedding) plus 24 advanced aesthetics added 2026-07 (neo-brutalism, glassmorphism, bento, swiss, editorial, art-deco, retro-futurism, cyberpunk, claymorphism, kinetic-type, maximalist, organic, mesh, y2k, memphis, quiet-couture, dark-saas, scandi, corporate, broadsheet, botanical, vivid-gradient, concrete, festival).
- **How new items enter:** (1) hand-edit `HANDWRITTEN_STYLES`; (2) harvest refero `.md` → `lib/refero/*.md` (via `/api/ingest-style` on localhost) → recompile `lib/referoStyles.json` via `scripts/build-refero-json.cjs`; (3) user paste → Supabase `design_styles` (`POST /api/styles`).
- **How searched:** `matchStyleToIndustry` (top-1), `matchTopStyles` (top-N), `pickCreativeMix` (anchored + sampled), `findBuiltIn(id)`. All niche-tag substring scoring + vibe keyword scoring (§3.3).
- **How generations use it:** `chosenStyles.map(s=>s.content)` is sent as `styleMds` to `design-brief` and `build-site`. Multiple systems → the builder is told to fuse the strongest ideas into one cohesive system (never a "franken-page").

### 6.2 Motion / animations (`presets/motion/manifest.json`, 49 presets)
- **Structure:** `{id,file,name,source,license,effect,intensity,dependency,niches[],summary,snippet}`. `snippet` is self-contained `<style>…</style>` + wrapper HTML, using `.vm-<id>-` class prefixes, `--vm-c1`/`--vm-c2` color vars, and a `prefers-reduced-motion` rule.
- **effect ∈** background/text-effect/card-effect/scroll-trigger/hover/divider; **intensity ∈** subtle/medium/bold; **dependency ∈** css-only/framer-motion/webgl/js-library (only `css-only` ports cleanly to the no-JS output and is preferred by the scorer).
- The 27 originals were harvested/authored; 22 CSS-only advanced effects were added 2026-07 (conic-halo, mesh-morph, grain-veil, gradient-flow, floating-orbs, starfield-drift, diagonal-sheen, contour-lines, plasma-drift, scanline-glow, gradient-text-flow, glitch-text, typewriter-line, underline-sweep, word-rise, tilt-hover, glow-lift, conic-border-rotate, clip-reveal, reveal-on-scroll, parallax-scroll, wavy-divider).
- There are also `presets/motion/*.tsx` source components (the original React/framer references) — **not consumed at runtime**; the manifest `snippet` strings are the runtime artifact.
- **Selection & use:** `pickSignatureMotion` → one preset → passed to `design-brief` (as name/summary/effect/intensity) and `build-site` (full `snippet` + containment/weight/visibility rules).

### 6.3 Sections / layouts (`presets/sections/manifest.json`, 47 patterns)
- **Structure:** `{id,file,name,source,license,category,framework,niches[],summary,reference}`. `reference` = HTML markup (Tailwind/React for the harvested ones; plain HTML/CSS for the 21 velpi-original ones added 2026-07). `category ∈` hero/features/pricing/testimonials/stats/cta/faq/footer/card (+ unreachable `nav`).
- Harvested sources (license-verified MIT only): shadcn/ui, HyperUI, Flowbite, DaisyUI. Sources with restrictive licenses were **explicitly excluded** (React Bits, Animate UI, Aceternity, Preline — documented in the manifest `notes`).
- **Use:** `pickSectionReferences` selects up to 4 by category+niche; the builder is told to *re-express* their structure in scoped CSS, never copy Tailwind classes verbatim.

### 6.4 Per-style token artifacts (`presets/styles/<key>/`) — **[UNVERIFIED contents]**
Each harvested style has a directory with `design.md`, `tokens.json`, `css-vars.css`, `tailwind.config.snippet.js`. Per `designStyles.js` comments these are the source of the `cssVars` baked into `referoStyles.json`. **These directories are NOT imported at runtime** (only `referoStyles.json` is). Grep confirms `presets/styles` appears only in a *comment* in `designStyles.js`.

### 6.5 Items the brief lists but that do NOT exist as libraries
There is **no** dedicated library for: icons, buttons, cards, forms, backgrounds/patterns (beyond motion), color palettes (palettes are per-domain cache + per-build analysis), or full-page templates. These are all *generated inline* by the build model, guided by the DESIGN.md systems and section references. **[GAP]** If future work assumes a component/icon library exists, it must be created — it does not today.

### 6.6 Images in the library
Generated/enhanced images are **not** a reusable library; they are stored per-project as base64 in `projects.data.assetsById` and are not indexed or reused across businesses.

---

## 7. WEBSITE ANALYSIS (how the source site is understood)

- **DOM analysis:** none in the browser sense. Firecrawl returns markdown + HTML; the server regex-extracts `<img>`, `<link rel=icon>`, `apple-touch-icon`, `og:image`, and hex colors. No DOM tree walking, no computed styles.
- **Image analysis:** URL + alt-text heuristics only. The analyze model reads image URLs/alts (≤30) to decide `source:'real'|'none'` and `action:'keep'|'enhance'|'generate'`. **No vision model is applied to the site's images** (`callClaude` supports an `images` param, but no route passes site screenshots to it).
- **Logo analysis:** heuristic detection (`extractLogo`) + optional client-side color extraction from an uploaded logo. The logo is refined by `gpt-image-1` but not semantically analyzed.
- **Color analysis:** frequency count of hex codes in HTML (server) + canvas sampling of an uploaded logo (client). Cached per domain.
- **Brand analysis:** performed by the analyze model → `brand{primary/secondary/accent colors, typography, button_style, border_radius, spacing, icon_style, imagery_style, visual_hierarchy, design_language, brand_personality, ui_patterns, recurring_motifs}`.
- **SEO extraction:** limited — `metadata.title/description/ogTitle/ogDescription` from Firecrawl; no keyword/structured-data/schema.org extraction.
- **Copy extraction:** the full crawled markdown (≤40k stored, ≤36k sent to analyze) is the copy source; the model extracts facts and later rewrites copy.
- **Navigation analysis:** implicit — the crawler prioritizes nav-like pages (`PRIORITY` regex); the analyze model infers `sections`/`section_order`. No explicit nav-structure object.
- **Layout analysis:** the model infers a `section_order` and `layout.notes`; there is no geometric/visual layout parsing of the source.
- **Visual hierarchy:** captured as a prose field in `brand.visual_hierarchy`; not measured.
- **Context understanding:** the analyze model's whole job — industry, niche, target customer, tone, target feeling, conversion strategy — all inferred from crawled text.

---

## 8. IMAGE SYSTEM

- **Collection:** `/api/scrape` gathers ≤40 image URLs (HTML `<img>` + markdown images with alts).
- **Planning:** `/api/analyze` produces `image_inventory` (5–8 photographic slots + optional logo), each with `source`, `action`, and a full standalone `prompt` (Subject / Keep the same / Change / Theme-lock).
- **Enhancement:** real photos (`action:'enhance'`) → `gpt-image-1` **edit** with `PRO_TOUCHUP` (authentic same-people/place/composition, cinematic lighting for people, straightened verticals for buildings, decisive re-grade if plain) + `THEME_LINE`.
- **Refinement (logo):** `/api/refine-logo` (separate route, edit endpoint, transparent 1:1 mark).
- **Replacement:** user can `replaceAsset(slotId,file)` (client rasterizes to PNG) or paste a GHL URL per slot.
- **Generation:** missing/`generate` slots → `gpt-image-1` **generate**; hero `1536x1024/high`, others `1024x1024/medium`.
- **Resolution/lighting/cropping:** dictated by the prompts (retouch directives) and the `size`/`quality` params; cropping to layout is done in CSS (`object-fit:cover`) by the build model, not by the image API.
- **Asset management:** `assetsById` (client state, id→src), mirrored to `localAssets` for auto-save; `ghlUrls` (id→pasted URL) overrides at export/preview.
- **Storage:** base64 data URIs in Supabase `projects.data.assetsById`. **No object storage (S3/Cloud) exists.** This makes project rows large.
- **Reuse:** none across businesses; images are per-project. The **image completion gate** (`Studio.js:778–808`) guarantees no photo slot ships empty (2 retry rounds).
- **Attestation:** `meta{apiCalled,aiCalls,generated,enhanced,keptOriginal,failures}` proves the API actually ran; surfaced in the Assets header and `assets.json`.

---

## 9. DESIGN DECISION PROCESS (who decides what)

Almost every visual decision is made **by the build model** guided by prompts + the fused brief + selected reference systems. Precisely:

- **Spacing / grid:** build prompt ("consistent 8px spacing system," "asymmetric grids," `7/5`/`8/4` splits) + DESIGN.md `Layout` lines. Not computed.
- **Typography / font pairing:** brief `TYPE SYSTEM` + DESIGN.md `Typography` + build prompt (display + neutral pairing, `clamp()` scale). Fonts via `@import`.
- **Colors / gradients / shadows:** **THEME-LOCK** to the analyzed palette (build prompt: "Every color must come from this palette plus white and one near-black"); DESIGN.md maps brand colors into accent slots; build prompt allows on-brand tints/shades and "modern layered shadows."
- **Animations / micro-interactions:** one selected signature motion (`pickSignatureMotion`) + build-prompt-mandated CSS-only hover/entrance transitions; `prefers-reduced-motion` required.
- **Buttons / cards:** build prompt (weighty buttons, elevated cards, no flat gray boxes) + DESIGN.md `Components` + section references.
- **Section ordering:** `analysis.layout.section_order` (or `forcedLayout` from alt-layouts).
- **Responsive behavior:** MOBILE-FIRST CONTRACT in the build prompt (hard requirements).
- **Hero design:** brief `HERO CONCEPT` + build prompt (layered image + scrim + typographic composition).
- **CTAs:** `conversion_strategy.primary_action`/`secondary_action` (from analyze) placed per the CONVERSION ARCHITECTURE rules (sticky nav + hero + closing band; `tel:`/`mailto:` links).
- **Backgrounds / patterns:** signature motion snippet + on-brand gradient washes (build prompt).
- **Visual hierarchy / modern & premium styling:** build prompt "PREMIUM TECHNIQUES," "DENSITY & CRAFT," anti-generic ledger, and the one-pass self-critique.

Determinism vs. model: **selection of which references to use** is deterministic JS (scored + seeded random); **how they're expressed** is entirely the model.

---

## 10. CODE GENERATION

- **HTML:** produced by `/api/build-site` (Claude, 64k). Starts with `<!DOCTYPE html>`; a required HTML comment lists the 3+ compositional moves; all body wrapped in `<div class="velpi-page">`.
- **CSS:** one `<style>` tag, every selector prefixed `.velpi-page`, Google Fonts via `@import` at the top; ~500+ lines targeted; mobile-first base + `min-width` media queries; layered shadows, on-brand gradients, CSS-only motion.
- **JavaScript:** **none** — hard prohibition (GoHighLevel safety). No `<script>`, no CDNs, no frameworks, no `position:fixed` (sticky allowed).
- **Component generation:** inline within the single HTML — no componentization/partials.
- **Responsiveness:** §9 / MOBILE-FIRST CONTRACT.
- **Accessibility:** partial and prompt-driven — legibility/contrast rules, ≥16px body text, ≥8px tap spacing, `alt` usage implied; **no formal ARIA/a11y audit** exists. **[GAP]**
- **Performance:** single file, no JS, `@import` fonts; images may be large base64 in preview/export unless GHL URLs are pasted (the export UI nudges toward GHL URLs for a "lighter" file). No minification.
- **SEO:** viewport meta enforced; `<title>` present; no meta-description/OG/schema generation in the output. **[GAP/UNVERIFIED — output `<head>` contents beyond title/viewport are model-driven and not validated.]**
- **Optimization:** none automated (no minify/purge). Tailwind is a dev dependency but the **output uses plain CSS**, and the Studio UI uses inline styles — Tailwind appears effectively unused in shipped artifacts. **[UNVERIFIED — `tailwind.config.js`/`globals.css` not read.]**
- **GoHighLevel compatibility:** the central output contract — `.velpi-page` scoping, `@import` fonts, single style tag, no JS, no fixed positioning, tokenized images.
- **Asset replacement:** `%%IMG:id%%` tokens substituted at three points — client preview (`previewHtml`), client export (`finalHtml`), server public preview (`/preview/[id]`). Priority everywhere: pasted GHL URL → generated asset → logo fallback → placeholder.
- **Final export:** `finalHtml()` (GHL URL > asset > `PASTE-IMAGE-N` placeholder), plus `decisions.md`, `assets.json`, `prompt-trace.txt`, full-page PNG.

---

## 11. PROJECT STRUCTURE

```
velpi-studio/
├─ app/                          # Next.js 14 App Router
│  ├─ layout.js                  # Root layout; loads Inter/IBM Plex Mono/Bebas Neue via next/font; imports globals.css
│  ├─ page.js                    # Renders <Studio/>
│  ├─ globals.css                # [UNVERIFIED] global styles + (per LightningBackground comment) a CSS-animation kill-switch
│  ├─ api/
│  │  ├─ scrape/route.js         # Firecrawl crawl + regex extraction + palette cache (deterministic)
│  │  ├─ analyze/route.js        # Claude: brand/strategy/image-plan JSON (+repair)
│  │  ├─ design-brief/route.js   # Claude: fuse into one committed brief
│  │  ├─ generate-copy/route.js  # Claude: section copy JSON (+repair)
│  │  ├─ generate-images/route.js# OpenAI gpt-image-1 enhance/generate (concurrency, retries, attestation)
│  │  ├─ build-site/route.js     # Claude: full single-file HTML (64k) + prompt trace
│  │  ├─ critique-site/route.js  # Claude: QA rubric {score,pass,issues} — DORMANT
│  │  ├─ enhance-site/route.js   # Claude: elevation + surgical-fix modes — DORMANT
│  │  ├─ alt-layouts/route.js    # Claude: 2 alternate section orders
│  │  ├─ edit-site/route.js      # Claude: single-instruction HTML patch
│  │  ├─ refine-logo/route.js    # OpenAI gpt-image-1 edit (logo)
│  │  ├─ ingest-style/route.js   # Localhost-only: write lib/refero/*.md (CORS-open)
│  │  ├─ styles/route.js         # GET merge built-in+DB; POST save; DELETE
│  │  └─ projects/route.js       # GET list/one; POST save; DELETE
│  └─ preview/[id]/route.js      # Public server-rendered preview of a saved project
├─ components/
│  ├─ Studio.js                  # THE app: all state + runGeneration orchestration + full UI (1609 lines)
│  └─ LightningBackground.js     # Decorative canvas animation (ambient brand-blue lightning; rAF; DPR-capped)
├─ lib/
│  ├─ claude.js                  # callClaude (streamed, claude-sonnet-4-5), stripFences, parseJson
│  ├─ supabase.js                # Supabase client + palette/styles/projects CRUD + SQL schema in header
│  ├─ designStyles.js            # BUILT_IN_STYLES (44 handwritten + 38 refero) + matchers + pickCreativeMix
│  ├─ motionPresets.js           # targetIntensity + pickSignatureMotion (reads presets/motion/manifest.json)
│  ├─ sectionPresets.js          # pickSectionReferences (reads presets/sections/manifest.json)
│  └─ referoStyles.json          # 38 compiled refero styles (each with cssVars) — imported by designStyles.js
│  └─ refero/*.md                # 38 source DESIGN.md files (compiled into referoStyles.json)
├─ presets/
│  ├─ motion/manifest.json       # 49 motion presets (snippets) + 27 *.tsx source refs (unused at runtime)
│  ├─ sections/manifest.json     # 47 section patterns + raw *.html/.css/.tsx source refs
│  └─ styles/<key>/…             # per-style token artifacts (design.md/tokens.json/css-vars.css/tw snippet) — NOT imported at runtime
├─ scripts/build-refero-json.cjs # Recompiles lib/referoStyles.json from lib/refero/*.md (see §13 desync)
├─ next.config.js                # empty config object
├─ package.json                  # deps below
├─ tailwind.config.js            # [UNVERIFIED]
├─ postcss.config.js             # [UNVERIFIED]
└─ start-velpi.bat               # [UNVERIFIED] local launcher (auto-start at login per user context)
```

**Dependencies (`package.json`):** runtime — `@anthropic-ai/sdk ^0.39.0`, `@mendable/firecrawl-js ^1.29.1`, `@supabase/supabase-js ^2.106.1`, `openai ^4.77.0`, `html2canvas ^1.4.1`, `next 14.2.30`, `react/react-dom ^18`. dev — `tailwindcss ^3.4.1`, `postcss ^8`, `autoprefixer ^10`.

**Environment variables:** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `FIRECRAWL_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. On Vercel these live in project settings; AI routes need `maxDuration=300`.

**Supabase schema (SQL in `lib/supabase.js` header):** `domain_palettes(domain PK, palette jsonb, updated_at)`, `design_styles(id uuid, name, niches text, content, created_at)`, `projects(id uuid, name, data jsonb, created_at)`. RLS disabled manually (per user context).

---

## 12. CURRENT STRENGTHS

### 12.1 What works extremely well
- **Fact fidelity + anti-hallucination:** repeated, enforced "never invent facts" across analyze/copy/build; credibility elements preserved; reviews rendered from real `facts.reviews` only.
- **Conversion architecture:** the `conversion_strategy` object threaded through copy + build produces genuinely sales-oriented pages, not just pretty ones.
- **Anti-generic enforcement:** the ledger + mandatory declared compositional moves + one-pass self-critique measurably push away from template output.
- **GoHighLevel output contract:** the scoping/`@import`/no-JS rules make the HTML paste-ready — a real, specific product advantage.
- **Robustness:** JSON self-repair (analyze/copy), image completion gate, per-route non-fatal fallbacks, enhance-site safety gates, loud failure surfacing (dead-key detection, auto-save failure banner). The pipeline almost never hard-fails.
- **Variety without chaos:** `pickCreativeMix` + `pickSignatureMotion` + anti-repetition memory produce different-but-appropriate results across runs.
- **Auditability:** exact prompt trace, image-API attestation, decision report — unusually transparent.
- **Theme-locked imagery:** every image graded to one palette/mood so generated and real photos read as one shoot.

### 12.2 What should NEVER be changed (see also §16)
- The **GoHighLevel output contract** (`.velpi-page` scoping, `@import` fonts, single `<style>`, no JS, no `position:fixed`, tokenized images). Breaking any of these breaks real deployments.
- The **`%%IMG:id%%` token system** and its 3-point substitution (client preview, client export, server `/preview/[id]`), plus the token-set equality gate in `enhance-site`.
- **Fact-preservation prompting** and **JSON-safety (inner-quote escaping)** rules + the repair passes.
- **THEME-LOCK** palette discipline.
- The **image completion gate** and image-API **attestation**.
- **Streaming** Claude calls (large `max_tokens` are rejected non-streaming — see `lib/claude.js` comment).
- **maxDuration=300** on AI routes.

### 12.3 Behaviors that make outputs successful (preserve)
- One committed direction (no hedging/variants), executed at high density (≥8 sections, ~500+ CSS lines).
- Mobile-first, edge-to-edge, contrast-checked output.
- Single signature motion (never stacked), contained + subtle.
- Proof adjacent to CTAs; CTA reachable at every scroll position.

---

## 13. CURRENT WEAKNESSES / LIMITATIONS / TECH DEBT

### 13.1 Unfinished / dormant systems
- **`critique-site` + `enhance-site` are built but never called** (`Studio.js:767–769`). The advertised QA/refinement loop does not run at runtime. Re-wiring is low-risk but currently absent.
- **Manual vibe UI removed** but `VIBE_QUESTIONS`, `vibe` state, and `vibeSummary()` remain (dead-ish scaffolding kept only to rehydrate old projects). `readyToGenerate` still requires a logo upload even though the code can auto-detect one.

### 13.2 Technical debt / desync
- **`build-refero-json.cjs` does NOT emit `cssVars`, but the committed `referoStyles.json` has `cssVars` on all 38 entries.** Re-running the script as-is would **strip the exact design tokens** from the refero library — a silent quality regression. The script is out of sync with how the JSON was actually produced. **[HIGH-RISK if anyone regenerates the file.]**
- **`presets/styles/<key>/` token artifacts are unused at runtime** (only referenced in a comment). Their relationship to `cssVars` is documented but not wired.
- **`pickCreativeMix` is called with `n=3`** (`Studio.js:674`) though its default is 4 and the anchor+pool logic reads as "up to 4." The effective mix size is 3 picks (anchor + 2 sampled) — worth confirming intent. Comments elsewhere say "4 systems."
- **`sectionPresets` `SECTION_TO_CATEGORY` never produces `nav`,** so `nav`-category section presets are unreachable.
- **Auto-save stores base64 images in Postgres jsonb** → large rows, potential Supabase row/size pressure at scale; `listProjects` mitigates read cost but writes are heavy.
- **No test suite, no type safety (plain JS), no CI checks** beyond Vercel build.
- **Supabase free tier pauses after inactivity** (per user context) → writes can fail until restored; handled only by error banners.

### 13.3 Design / generation limitations
- **No visual grounding:** the source site's *appearance* is never seen (no screenshots to a vision model); analysis is text+URL heuristic only. Layout/visual-hierarchy claims are inferred from prose.
- **Reviews often missing** when rendered by JS widgets the crawler can't see (the report even says so).
- **Single-page only:** no multi-page site generation, no nav routing.
- **Copy length risk:** dense businesses can still truncate JSON (mitigated by repair + the "no verbatim reviews" rule, not eliminated).
- **Accessibility/SEO are prompt-hoped, not verified** (no ARIA/schema/meta-description checks).
- **Static creativity ceiling:** the system only *recombines* fixed reference libraries; it never invents and never learns from good outputs.

### 13.4 Architectural limitations
- **Client-orchestrated pipeline:** `runGeneration` runs in the browser; closing the tab mid-run interrupts it. No server-side job/queue.
- **No embeddings/semantic search** → style/section/motion matching is coarse niche-substring scoring.
- **No write-back loop** from builds into any reference library (the core limitation the operator wants solved).
- **Single-tenant assumptions:** `localStorage` memory is per-browser; Supabase RLS disabled.

---

## 14. FUTURE IMPROVEMENT OPPORTUNITIES (non-destructive)

> These are *opportunities*, described without changing the system. Each notes the seam it would attach to.

### 14.1 Self-expanding library (the operator's stated goal)
- **Seam:** `GET /api/styles` already merges Supabase `design_styles` into the selector pool with zero selector changes. A new `POST`-only "distill" route could, after an excellent build, extract the build's reusable DNA into a DESIGN.md and `saveStyle` it (optionally with new columns `origin/parent_ids/score/usage_count` via `ALTER TABLE`). Learned styles would then compete in `pickCreativeMix` automatically.
- **Risks to design for:** library pollution (gate on a critique score; dedupe by name/niche/signature), library collapse onto one winner (usage-count decay in the scorer), and the `referoStyles.json` desync (§13.2) if disk writes are attempted (prefer DB over disk — Vercel disk is ephemeral).

### 14.2 Autonomous quality loop
- **Seam:** re-wire the dormant `critique-site` → `enhance-site` (surgical `issues` mode) → re-critique loop client-side in `runGeneration` (bounded rounds, keep best-scoring HTML). All safety gates already exist in `enhance-site`.

### 14.3 Synthesis ("form something new")
- A new route that *invents* a design system seeded by (not limited to) matched styles, feeding `build-site` as the single `styleMds` entry — and a strong candidate for the learning loop.

### 14.4 Evaluation improvements
- Turn `critique-site` into a persisted score per project (new column/audit table) to enable ranking, A/B, and learning signals. Add automated a11y/SEO/contrast linting of the output HTML (deterministic, cheap).

### 14.5 Memory improvements
- Replace niche-substring matching with embeddings (pgvector) for styles/sections/motion; add semantic dedupe for learned styles; make the anti-repetition memory server-side/shared instead of `localStorage`.

### 14.6 Scalability / performance
- Move generated images to object storage (Supabase Storage/S3) and store URLs instead of base64 in jsonb. Consider a server-side job/queue so runs survive tab closure. Add HTML minification for export.

### 14.7 Analysis improvements
- Add a screenshot-to-vision pass (the `callClaude` `images` param already exists) so the model *sees* the source site; render-based review of the generated page for real layout QA.

### 14.8 Inspiration harvesting
- A gated `WebSearch`/`WebFetch` "what's trending for this niche" note feeding synthesis; keep the existing localhost refero harvest path for bulk curation.

---

## 15. INTERNAL THINKING PROCESS (URL → final HTML, step by step)

1. **Receive inputs.** User provides a URL (or business name) and a required logo upload. Client validates `readyToGenerate = input && logo`.
2. **Crawl.** Resolve to a URL (search if a name). Scrape home + up to 5 priority pages; merge markdown (≤40k). Extract images (with alts), logo (source-priority), palette (frequency; cached per domain).
3. **Refine logo in parallel.** Fire `refine-logo` (never blocks) — isolate/clean the mark to a transparent 1:1 asset.
4. **Analyze.** The model performs RECON (exhaustive facts) → commits ONE creative direction + 3-second feeling → **infers vibe** (feel/look/CTA) from copy tone + imagery + business type → builds a **conversion strategy** (primary/secondary action, top objections each answered by a *real* fact, proof map, honest offer, persuasion flow) → plans **5–8 image prompts** (deciding keep/enhance/generate per slot, theme-locked). Emits one large JSON; self-repairs if malformed.
5. **Select references (deterministic).** Read anti-repetition memory. `pickCreativeMix` chooses ~3–4 DESIGN.md systems (niche anchor + vibe/wildcard, avoiding recent combos). `pickSignatureMotion` picks ONE motion treatment (intensity matched, avoiding recent). `pickSectionReferences` picks up to 4 structural patterns by section flow.
6. **Commit a brief.** The creative-director model fuses brand + vibe + systems + motion into ONE brief with a **POV** and a **GAMBLE** — a decision, not a pile of references.
7. **Write copy + source images in parallel.** Copy executes the conversion strategy (CTA labels, objection placement, offer). Images enhance real photos / generate missing ones, all graded to the palette/mood; concurrency-limited with retries and attestation.
8. **Build the page.** The build model answers 3 internal questions (industry / highest-end version / 3-second feeling), then writes one dense, mobile-first, GHL-scoped HTML file: layered hero, ≥8 sections, anti-generic compositional moves (declared in a comment), theme-locked colors, one signature motion, CTAs everywhere the strategy demands, `%%IMG:id%%` tokens for every image. It performs a prompted one-pass self-critique before returning. The exact payload is captured as `trace`.
9. **Post-process.** Fetch two alternate structures (background). Compose a decision report. Await images + logo. **Image completion gate**: retry any empty slot up to twice. Write anti-repetition memory. **Auto-save** the whole build (HTML, assets, analysis, trace, thumbnail) to Supabase with a shareable `/preview/{id}`.
10. **User iterates (optional).** Refine chat (`edit-site`, one change at a time), switch to an alternate layout (`build-site` with `forcedLayout`), regenerate/replace individual images, paste GoHighLevel URLs, then export HTML (+ decisions.md / assets.json / prompt-trace / full-page PNG).

Major decision owners: **facts & strategy → analyze model**; **which references → deterministic selectors**; **committed direction → brief model**; **final visual execution → build model**; **image keep/enhance/generate → analyze model, executed by OpenAI**; **variation → seeded sampling + anti-repetition memory**.

---

## 16. DO NOT CHANGE (preserve exactly)

Be conservative around all of the following — they are load-bearing for correctness, deployability, or quality:

1. **GoHighLevel output contract** in `build-site`/`enhance-site`/`edit-site` system prompts: `<div class="velpi-page">` wrapper, every selector prefixed `.velpi-page`, ALL CSS in one `<style>`, Google Fonts via `@import` at the top (never `<link>`), **no JavaScript**, no `position:fixed` (sticky OK), mandatory `<meta name="viewport" content="width=device-width, initial-scale=1">`.
2. **`%%IMG:id%%` tokenization** and the 3 substitution points (`previewHtml`, `finalHtml`, `/preview/[id]`), including the priority order GHL-URL → asset → logo → placeholder, and the **token-set equality gate** in `enhance-site` (`tokensOf(upgraded) === tokensOf(html)`).
3. **Streaming Claude calls** via `client.messages.stream(...).finalMessage()` (non-streaming rejects large `max_tokens`). Keep `MODEL = 'claude-sonnet-4-5'` unless deliberately migrating.
4. **`maxDuration = 300`** on all AI routes; `60` on projects/preview.
5. **Fact-preservation + JSON-safety prompting** in analyze/copy/build, and the **`REPAIR_SYSTEM` self-repair passes** in analyze/copy.
6. **Conversion-strategy threading** (analyze → copy → build → critique) and the **CONVERSION ARCHITECTURE** rules (CTA in sticky nav + hero + closing band; `tel:`/`mailto:`; proof adjacent to CTAs).
7. **THEME-LOCK** palette discipline (only palette + white + one near-black; motion maps to `--vm-c1/--vm-c2` = secondary/neutral, never the accent).
8. **ANTI-GENERIC LEDGER** + the mandatory "3 compositional moves" HTML comment; the **one signature motion** rule (containment/weight/visibility) and `prefers-reduced-motion`.
9. **MOBILE-FIRST OUTPUT CONTRACT** (base ~390px, edge-to-edge, `clamp()` type, full-width CTAs, ≥16px body, no horizontal scroll, JS-free mobile nav).
10. **Image completion gate** (2 rounds, no placeholders ship) and **image-API attestation** (`meta` + dead-key 401 warning).
11. **`generate-images` concurrency=3 + retry logic** (429 backoff vs. content-policy sanitized fallback; `enhance` never swaps to fallback).
12. **`enhance-site` safety gates** (valid HTML, ≥55% length, token-set equality, `velpi-page` present → else return original).
13. **Non-fatal fallbacks** that keep the pipeline alive: brief `''`, critique "treat as pass," alt-layouts `[]`, refine-logo original, images passthrough.
14. **Anti-repetition memory** (`velpi_gen_history`, last 5) + `pickCreativeMix`/`pickSignatureMotion` seeded sampling — this is what produces variety.
15. **`GET /api/styles` merge** (built-in first, then DB, `builtIn` flag) and **built-in-undeletable** rule (`id.startsWith('builtin_')`).
16. **Auto-save loudness** (never silently swallow a save failure) and the `/preview/{id}` public route substitution logic.
17. **Do NOT regenerate `referoStyles.json` with the current `build-refero-json.cjs`** — it would strip `cssVars` (fix the script first; see §13.2).

---

## 17. APPENDIX

### 17.1 Model & token budget table
| Route | Provider/Model | maxTokens / size | Notes |
|---|---|---|---|
| analyze | Claude sonnet-4-5 | 16000 (+16000 repair) | densest JSON |
| design-brief | Claude | 2500 | non-fatal |
| generate-copy | Claude | 16000 (+repair) | no verbatim reviews |
| build-site | Claude | 64000 | streamed |
| critique-site | Claude | 3000 | dormant |
| enhance-site | Claude | 64000 | dormant; 2 modes |
| alt-layouts | Claude | 1500 | background |
| edit-site | Claude | 64000 | per-edit |
| generate-images | OpenAI gpt-image-1 | 1536×1024 hero / 1024×1024 | concurrency 3, ≤8 ops |
| refine-logo | OpenAI gpt-image-1 (edit) | 1024×1024 high, transparent | 2–3 attempts |

### 17.2 Client state inventory (`Studio.js`, key pieces)
`input, logo{data,preview,name}, logoNotes, logoPalette, refinedLogo, vibe(deprecated), generating, steps[7], error, bizName, analysisData, slots[], assetsById{}, logoUrl, ghlUrls{}, htmlTemplate, built, imagesReady, buildReport, promptTrace{system,user}, imagesMeta, altLayouts[], rebuilding, lastRunRef, projects[], libraryOpen, savingProject, loadingProjectId, regenIds{}, styles[], styleId('auto' const), matchedStyleName, mobilePreview{html,label}, showCode, detailsOpen, chatInput, editing`.
Steps array (`STEP_DEFS`): `crawl, logo, analyze, brief, copy, build, images` (note UI order lists images after build, though images run concurrently).

### 17.3 Key client helpers
`callRoute(path,body)` (POST JSON, throws on `!ok||data.error`), `fileToPng` (canvas rasterize ≤1024px), `extractLogoColors` (48×48 canvas sampling), `substituteImageTokens` (shared token replacer), `composeReport` (decision log), `captureThumb`/`downloadFullImage` (html2canvas in hidden iframe), `finalHtml`/`previewHtml`, `switchLayout(alt)`, `regenerateSlot(slot)`, `sendEdit()`.

### 17.4 Reference-library counts (verified at snapshot)
- `BUILT_IN_STYLES`: **82** (44 `builtin_*` + 38 `refero_*`, each refero with `cssVars`).
- `presets/motion/manifest.json`: **49** presets (mix of css-only/framer/webgl/js-library; only css-only is preferred for the JS-free output).
- `presets/sections/manifest.json`: **47** patterns across 9 reachable categories (+ unreachable `nav`).

### 17.5 Deployment & ops (from code + user context)
- Vercel, auto-deploy on push to `main`; env vars in Vercel settings; AI routes need `maxDuration=300` (fluid compute).
- Local dev via `start-velpi.bat` (**[UNVERIFIED]** contents) — background servers started ad hoc die at session end.
- Supabase project holds the three tables; RLS disabled manually; free tier can pause after inactivity.
- `/api/ingest-style` is a **localhost-only** harvest tool (CORS-open, writes `lib/refero/*.md`); not part of the deployed user flow.

### 17.6 Notable invariants for any future editor
- The build/enhance/edit models must always return a **full document starting `<!DOCTYPE html>`/`<html>`**; routes reject otherwise.
- `parseJson` tolerates fences + surrounding prose but returns `null` on failure — callers must handle null (analyze/copy do via repair; others via fallbacks).
- Image slot ids are `logo` and `img_<n>`; the same id may appear multiple times in HTML (allowed).
- `pickCreativeMix`/`pickSignatureMotion` rely on `Math.random()` — **not reproducible**; do not assume determinism.

### 17.7 Explicitly unverified items (re-audit before relying on them)
`app/globals.css` (suspected global CSS-animation kill-switch referenced by `LightningBackground`), `tailwind.config.js`, `postcss.config.js`, `start-velpi.bat`, the 38 `lib/refero/*.md` contents, the `presets/styles/*` token files, and the full body of `components/LightningBackground.js` (only its header + first 40 lines were read).

---

*End of architecture document. Every functional claim is traceable to a cited file; unverifiable items are marked. Preserve §16 during any modification.*
