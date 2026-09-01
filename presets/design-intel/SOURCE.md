# Design intelligence catalogs

Vendored from the locally installed **`ui-ux-pro-max`** skill
(`~/.claude/skills/ui-ux-pro-max/data/`).

## Why these are copied into the repo

The skill's data lives in the user's home directory and its query tooling is
Python. Neither survives a Vercel deploy — the app has no Python runtime and
no access to `~/.claude`. So the CSVs are vendored here and converted to JSON
at build time, which also matches how every other preset catalog in this repo
is loaded (`import manifest from '../presets/sections/manifest.json'`).

## What each file is for

| File | Rows | Role in the pipeline |
|---|---|---|
| `colors.csv` → `palettes.json` | 192 | **Primary palette catalog.** Full semantic token sets, already WCAG-adjusted upstream, keyed by product type — including Restaurant/Food Service, Bakery/Cafe, Hotel/Hospitality, Home Services, Legal, Beauty/Spa, Automotive, Fitness, Hyperlocal. Replaces LLM-invented palettes. |
| `typography.csv` → `pairings.json` | 74 | **Primary font-pairing catalog.** Carries a ready `@import`, which the single-`<style>`-tag output contract needs. |
| `ui-reasoning.csv` → `reasoning.json` | 161 | Per-category recommended pattern, color/typography mood, and anti-patterns. Secondary ranking signal. |
| `motion.csv` → `motionGuidance.json` | 16 | **Timing/easing/intensity guidance only.** The source GSAP snippets are deliberately dropped by the converter: GSAP is JavaScript and the GoHighLevel output contract forbids JS. A test enforces that no snippet leaks through. |

## Deliberately NOT vendored

`styles.csv` (84) and `landing.csv` (34) are product/app-UI oriented — only
three style rows mention food/dining, and the landing patterns are things like
Waitlist, Pricing Page and Webinar Registration. For local-business marketing
sites the repo's own 82 harvested refero systems (`lib/refero/`,
`lib/referoStyles.json`) are the better source and remain primary.

## Refreshing

```bash
cp ~/.claude/skills/ui-ux-pro-max/data/{colors,typography,ui-reasoning,motion}.csv presets/design-intel/
node scripts/build-design-intel.mjs
npm run test:designintel
```

The `.json` files are generated and committed; do not hand-edit them.
