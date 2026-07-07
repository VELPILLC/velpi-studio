# VELPI STUDIO — CIL DETERMINISTIC DEFAULTS ENGINE (`lib/creative/defaults.js`)

**Design specification — v1.0 (design only, no Stage 4, no implementation code)**
Companion to `docs/CDO_SCHEMA.md`, `docs/CIL_PROMPTS.md`, `docs/CREATIVE_INTELLIGENCE_LAYER.md`.

> Purpose: turn the *governing dials* already decided by Stages 2–3 (premium tier, brand archetype, emotional objectives, brand palette, plus the Creative Director's concept) into a **complete, deterministic set of seed design parameters** — the `seedDefaults` — that Stage 4 (Blueprint Generator) **refines rather than invents**. The engine is pure, table-driven, and never calls a model. It is the consistency backbone of the whole CIL: it guarantees that "luxury + Lover + warmth" always starts from the same sensible place, and that the model only spends judgment where judgment is actually needed.

---

## 0. PRINCIPLES

1. **Deterministic and pure.** Same signals → same seeds, byte-for-byte. No randomness, no model call, no I/O. Node-testable exactly like `schema-core.mjs`.
2. **Data, not code.** Every design decision lives in a lookup **table**. Adding an archetype, emotion, industry, tier, or parameter is a data edit — never a logic rewrite. This is the extensibility guarantee (§8).
3. **Seed, don't dictate.** The engine outputs *starting points* with confidence + provenance. Stage 4 adopts them unless the concept demands otherwise and records overrides (a learning signal). Low-confidence/conflicted seeds are flagged so Stage 4 knows where to think.
4. **Never throw, always complete.** Unknown inputs degrade to neutral defaults; the engine always returns a full seed set. It is infrastructure — it cannot fail a run.
5. **Constraints only tighten.** Accessibility/mobile floors are BASE constants that higher layers may only make stricter, never looser (§5.4). The engine can never emit a seed that violates a platform invariant.
6. **Explainability by construction.** Every seed carries the list of layers that produced it and the resolution strategy used — so any value is traceable and any table change is reviewable against golden snapshots (§9).

---

## 1. ARCHITECTURE

### 1.1 Where it sits
```
Stage 2 (Strategy) ─┐
Stage 3 (Director) ─┤──►  SIGNAL NORMALIZER ─► DERIVATION LAYERS ─► MERGE ─► seedDefaults ─►  Stage 4 (Blueprint)
brand palette ──────┘                          (tables → contributions)   (+confidence,        (adopts / overrides
operator overrides ─                                                        provenance)          with reason)
```
The engine runs **inside the orchestrator, immediately before Stage 4**. Stage 4's route receives `seedDefaults` as an input and injects it into the Blueprint prompt. Nothing else consumes it. It is additive: when the CIL is off, it never runs.

### 1.2 Internal pipeline (five passes)
1. **Normalize** — collapse raw Stage 2/3 outputs + palette + overrides into a canonical `SignalSet` with per-signal confidence and weights (§2.1).
2. **Derive** — each layer (base, tier, archetype, emotion-qualities, palette, industry, Stage-3 concept, operator) emits typed `Contribution`s per parameter by table lookup (§3).
3. **Veto** — the emotion `avoid` list suppresses contributions that pull toward vetoed qualities (§5.3).
4. **Merge** — resolve all contributions per parameter by its registered strategy (const / scalar / enum-owner / enum-vote / set / derived), producing a `Seed` with value + confidence + provenance + conflicted flag (§4).
5. **Assemble** — group Seeds by philosophy, compute global meta (version, overall confidence, conflict list), return `seedDefaults`.

### 1.3 Layered composition model
Parameters are never computed by one giant function. Each **layer** is an independent contributor; the **merge** combines them. This is what makes the system extensible: a new layer or a new table row adds contributions without touching the merge or any other layer.

Layers, in precedence order (also their base voting weights — §5.1):
| Layer | Weight | Role |
|---|---|---|
| `operator` | 1000 | explicit human overrides (e.g., forced tier) — hard win |
| `stage3` | 100 | Creative Director's committed concept decisions (ornamentation, imagery bias, visual descriptors) |
| `tier` | 50 | premium tier — the master scalar dial |
| `archetype` | 30 | brand archetype — visual-language personality |
| `emotion` | 25 | emotional objectives → affect qualities |
| `industry` | 15 | category advisory nudges |
| `base` | 5 | global platform defaults + constraint floors |

---

## 2. DATA STRUCTURES

### 2.1 `SignalSet` (normalized input)
```
SignalSet {
  tier: { value: 'mass'|'mid'|'premium'|'luxury'|'ultra', score: 0..100, confidence: 0..1 },
  archetypes: [ { name, weight } ],            // primary weight 1.0, secondary 0.5
  qualities:  [ { name, weight } ],            // affect qualities derived from emotions (§3.3)
  avoid:      [ quality ],                      // vetoed qualities from emotional_objectives.avoid
  palette:    [ { hex, luminance, saturation } ],
  industry:   string|null,
  stage3:     { ornamentation?, real_vs_generated_bias?, visual_descriptors?, surface_language?, ... }, // explicit concept decisions
  overrides:  { <paramPath>: value },           // operator forced values
}
```

### 2.2 `Contribution` (what a layer emits for one parameter)
```
Contribution {
  param:  string,                  // registry key, e.g. 'spacing.density'
  value:  any,                     // scalar | enum string | set[] | delta
  kind:   'scalar'|'delta'|'enum'|'set'|'const'|'derived',
  weight: number,                  // layer precedence × signal confidence × quality weight
  source: layerName,
  quality?: string,                // if it originated from an affect quality (for veto matching)
}
```

### 2.3 `Seed` (one resolved parameter)
```
Seed {
  value: any,                      // the resolved starting value
  confidence: 0..1,                // agreement among contributors
  sources: [layerName],            // provenance
  strategy: 'const'|'scalar'|'enum-owner'|'enum-vote'|'set'|'derived',
  conflicted: boolean,             // true when top signals disagreed materially
  alternatives?: [ {value, weight} ] // for enum-vote: the runners-up (kept for Stage 4 + learning)
}
```

### 2.4 `seedDefaults` (the output)
```
seedDefaults {
  version: DEFAULTS_VERSION,
  seeds: {                         // grouped by philosophy → param → Seed
    typography: { scale_ratio: Seed, hero_clamp: Seed, body_px: Seed, weights: Seed, type_personality: Seed, ... },
    spacing:    { base_unit: Seed, density: Seed, section_rhythm: Seed, grid_asymmetry: Seed },
    color:      { role_map: Seed, contrast_floor: Seed, gradient_policy: Seed, dark_surface_policy: Seed, accent_reservation: Seed },
    motion:     { intensity: Seed, intensity_score: Seed, micro_interactions_allowed: Seed, reduced_motion_policy: Seed },
    imagery:    { grade: Seed, lighting: Seed, real_vs_generated_bias: Seed, crop_language: Seed },
    component:  { radius_language: Seed, button_style: Seed, iconography: Seed, shadow_depth: Seed },
    interaction:{ hover_behavior: Seed, feedback_language: Seed, nav_behavior: Seed },
    layout:     { ornamentation: Seed, density_target: Seed, rhythm_pattern: Seed },
    mobile:     { base_viewport_px: Seed, type_floor_px: Seed, edge_to_edge: Seed, breakpoints: Seed },
    accessibility: { contrast_floor: Seed, min_body_px: Seed, tap_target_min_px: Seed, motion_safety: Seed },
  },
  meta: {
    overall_confidence: 0..1,
    conflicts: [ { param, top: [{value,weight}], note } ],  // where Stage 4 must judge
    signals_used: SignalSet (echo, minus palette raw),
  }
}
```

### 2.5 `PARAM_REGISTRY` (the extensibility backbone)
Every output parameter is declared once here. Tables contribute to it by key; merge reads its strategy. Adding a parameter = one registry entry + table rows.
```
PARAM_REGISTRY = {
  'spacing.base_unit':   { kind:'scalar', range:[4,8], step:'set:{4,8}', base:8, strategy:'scalar' },
  'spacing.density':     { kind:'enum', enum:['tight','balanced','airy','palatial'], base:'balanced', strategy:'enum-vote', ordered:true },
  'typography.scale_ratio': { kind:'scalar', range:[1.15,1.6], base:1.25, strategy:'scalar', owner:'tier' },
  'color.contrast_floor':{ kind:'enum', enum:['WCAG AA','WCAG AAA'], base:'WCAG AA', strategy:'floor-up', direction:'tighten' },
  'component.ornamentation': { kind:'enum', enum:['none','restrained','expressive'], base:'restrained', strategy:'enum-owner', owner:'stage3', fallbackOrder:['stage3','tier','archetype','emotion'] },
  'motion.intensity_score': { kind:'scalar', range:[0,100], base:50, strategy:'scalar', owner:'tier', modifiers:['emotion','archetype'] },
  'color.role_map':      { kind:'derived', strategy:'derived', fn:'derivePaletteRoles' },
  ...
}
```

---

## 3. DERIVATION TABLES

> All numbers below are the **v1 starting values**. They are data; tuning them (by hand or by the future learning loop) never changes engine logic. Scalars marked *(interp)* are interpolated by `tier.score` between neighboring tiers rather than snapped.

### 3.1 `TIER_TABLE` (premium tier → scalar + enum contributions)
The master dial. Higher tier ⇒ more space, more restraint, subtler motion, greater type contrast.
| tier | density | section_rhythm_px *(interp)* | scale_ratio *(interp)* | body_px | motion_intensity_score *(interp)* | ornamentation | gradient_policy | radius_language | shadow_depth |
|---|---|---|---|---|---|---|---|---|---|
| mass | balanced | 56 | 1.20 | 16 | 58 | restrained | subtle | soft | low |
| mid | balanced | 72 | 1.25 | 16 | 50 | restrained | subtle | soft | medium |
| premium | airy | 104 | 1.333 | 17 | 35 | restrained | subtle | soft | layered |
| luxury | airy | 128 | 1.414 | 17 | 25 | restrained | subtle→none | soft/sharp | refined |
| ultra | palatial | 160 | 1.50 | 18 | 15 | none | none | sharp | hairline |

Tier also owns: `typography.scale_ratio`, `motion.intensity_score` (as owner; emotion/archetype modify), `spacing.section_rhythm`.

### 3.2 `ARCHETYPE_TABLE` (Jung 12 → visual-language personality)
Archetype drives *character*: type personality, ornament bias, radius, motion flavor, color temperature, layout stance. Contributions are enum votes / deltas (weight 30, secondary 15).
| archetype | type_personality | ornament_bias | radius_bias | motion_flavor | color_temp_bias | layout_bias |
|---|---|---|---|---|---|---|
| Innocent | humanist sans | restrained | pill/soft | gentle | light-warm | airy symmetric |
| Sage | serif display | restrained | sharp | minimal | cool-neutral | structured grid |
| Explorer | condensed sans | restrained | soft | kinetic | earthy | asymmetric |
| Outlaw | display/condensed | expressive | sharp | aggressive | dark | broken grid |
| Magician | display | expressive | soft | glow/drift | deep-violet | layered |
| Hero | bold sans | restrained | sharp | energetic | bold-primary | strong focal |
| Lover | serif | restrained | soft | slow/breathing | warm | editorial asymmetry |
| Jester | rounded display | expressive | pill | bouncy | bright | playful |
| Everyman | humanist sans | restrained | soft | subtle | neutral-warm | simple grid |
| Caregiver | humanist serif/sans | restrained | soft/pill | gentle | soft-warm | airy |
| Ruler | serif | restrained/none | sharp | minimal | deep-gold | symmetric authority |
| Creator | mixed/display | expressive | varied | kinetic | vivid | bento/broken |

Unknown archetype → `NEUTRAL_ARCHETYPE` profile (humanist sans, restrained, soft, subtle, neutral, balanced) at reduced weight.

### 3.3 `EMOTION_QUALITY_MAP` + `QUALITY_TABLE` (emotions → affect qualities → contributions)
Free-text emotions are lossy, so they are resolved to a **small canonical set of affect qualities** via a keyword/synonym map; unknown terms map to nothing (neutral). This is what lets *any* emotion string be added without new logic.

**`EMOTION_QUALITY_MAP`** (keyword → quality; substring/synonym match):
```
warm,cozy,inviting,welcoming → warmth
exciting,energetic,bold,dynamic,alive → energy
calm,serene,quiet,peaceful,soothing → calm
dramatic,moody,cinematic,intense → drama
fun,playful,whimsical,cheerful → playfulness
trust,reliable,credible,professional,secure → trust
premium,refined,elegant,luxurious,sophisticated → luxury
romantic,intimate,sensual,tender → intimacy
nostalgic,timeless,heritage,classic → nostalgia
fresh,clean,crisp,light,airy → freshness
```

**`QUALITY_TABLE`** (quality → contributions; weight 25 × quality strength):
| quality | color | imagery | motion | interaction | layout/other |
|---|---|---|---|---|---|
| warmth | color_temp warm | grade amber-warm | — | feedback gentle | radius soft |
| energy | — | high-contrast | intensity_score +15; gradient expressive | feedback lively | grid_asymmetry bold |
| calm | gradient subtle/none | soft light | intensity_score −15 | feedback gentle | density +1 step; contrast_floor→AAA (upgrade) |
| drama | color deep; dark_surface allow | low-key lighting | intensity_score +5 | — | strong focal |
| playfulness | color bright | — | motion bouncy | feedback lively | radius pill; ornamentation expressive |
| trust | color cool/neutral | clean | intensity_score −10 | feedback gentle | contrast_floor→AAA; symmetric; restraint |
| luxury | gradient subtle/none | prefer_real | intensity_score −10 | — | density +1 step; ornamentation restrained; scale contrast + |
| intimacy | color warm | shallow depth | intensity_score −5 | — | editorial asymmetry; radius soft |
| nostalgia | muted warm | film grade | — | — | serif personality nudge |
| freshness | light bg | crisp | — | — | density +1 step; radius soft |

`emotional_objectives.avoid` terms are mapped through the same map to **vetoed qualities** (§5.3).

### 3.4 `PALETTE_RULES` (algorithmic color-role derivation — `derivePaletteRoles`)
Deterministic from the brand palette (each color pre-annotated with luminance + saturation during Normalize):
```
page_bg   = lightest color with luminance ≥ 0.85, else white (#ffffff)
ink       = darkest color with luminance ≤ 0.2, else near-black (#111214)
cta       = highest-saturation brand color (the signature action color)
accent    = second-highest-saturation color distinct from cta, else a tint of cta
alt_bg    = a subtle tint of page_bg toward ink (≈4–6% mix)
muted     = mid-luminance neutral derived from ink at ~55% toward page_bg
GUARANTEE: if contrast(ink, page_bg) < contrast_floor, force ink → near-black.
Confidence: 1.0 when the palette cleanly supplies bg+ink+cta+accent; lower per missing role (filled by derivation).
```
Role map is emitted as a single `derived` Seed with per-role confidence in `alternatives`.

### 3.5 `INDUSTRY_TABLE` (thin advisory layer, weight 15)
Category keyword → light nudges; overlaps with the existing niche logic and is intentionally low-precedence. Unknown → no contribution.
| category match | nudges |
|---|---|
| restaurant, cafe, food | imagery.real_vs_generated_bias prefer_real; quality warmth |
| law, finance, accounting, insurance | quality trust; ornamentation restrained; radius sharp |
| gym, fitness, sports | quality energy |
| salon, spa, beauty, wellness | quality luxury + warmth |
| tech, saas, software | gradient subtle→expressive; type sans; motion medium |
| kids, childcare, daycare | quality playfulness; radius pill |
| luxury, jewelry, real estate | tier nudge up (advisory); quality luxury |

### 3.6 `BASE_TABLE` (global defaults + constraint floors)
Platform constants and the immutable floors (weight 5, but floors are direction-locked):
```
spacing.base_unit = 8
mobile.base_viewport_px = 390        mobile.type_floor_px = 16     mobile.edge_to_edge = true
mobile.breakpoints = [768, 1200]
accessibility.contrast_floor = 'WCAG AA'   (may only be tightened to AAA)
accessibility.min_body_px = 16       (may only increase)     accessibility.tap_target_min_px = 44 (may only increase)
motion.reduced_motion_policy = 'disable ambient keyframes on prefers-reduced-motion'  (constant)
color.accent_reservation = 'CTA and small emphasis only'   (constant)
interaction.nav_behavior = 'sticky nav; JS-free mobile: logo + one CTA'   (constant)
motion.micro_interactions_allowed = ['hover lift','nav underline','image scale 1.03']  (base set)
```

---

## 4. MERGE ALGORITHM

For each `param` in `PARAM_REGISTRY`:

1. **Collect** all `Contribution`s from every layer that references `param`.
2. **Weight** each: `weight = layerPrecedence × signalConfidence × qualityStrength` (qualityStrength = 1 for non-emotion layers).
3. **Veto pass** (§5.3): zero or halve contributions whose `quality` is in `avoid`.
4. **Resolve by strategy** (from the registry):
   - **`const`** → BASE value, ignore others (unless a `floor` allows tightening).
   - **`floor-up`** → BASE floor; a higher layer may only move it in the `tighten` direction (AA→AAA, body_px 16→18); attempts to loosen are dropped.
   - **`scalar`** → if the param has an `owner`, start from the owner's value; apply other layers as bounded `delta`s; else take the **weighted mean** of contributed values. Clamp to `range`; snap to `step` if defined. Confidence = `1 − normalizedSpread` (single contributor → its signalConfidence).
   - **`enum-owner`** → take the value from the highest-precedence layer in `fallbackOrder` that supplied one; other layers become `alternatives` and lower confidence if they disagree. Confidence = owner signalConfidence × (agreementBonus).
   - **`enum-vote`** → sum weights per candidate value; **winner = max weight**; `confidence = winnerWeight / totalWeight`; `conflicted = (runnerUp / winner) > 0.8`; keep runners-up in `alternatives`. For `ordered` enums (e.g., density) a near-tie resolves toward the higher-precedence layer's value.
   - **`set`** → union of allowed items across layers, minus vetoed items (e.g., `micro_interactions_allowed` gains playful items for Jester, loses energetic ones under an "avoid loud" veto).
   - **`derived`** → run the named function (e.g., `derivePaletteRoles`).
5. **Record** `Seed{ value, confidence, sources, strategy, conflicted, alternatives }`.
6. **Assemble** all Seeds by philosophy; compute `meta.overall_confidence` (weighted mean of seed confidences) and `meta.conflicts` (every `conflicted` seed, so Stage 4 sees exactly where to judge).

Determinism guarantees: iteration order over the registry is fixed; ties are broken by precedence then lexical value; no randomness anywhere.

---

## 5. CONFLICT RESOLUTION

### 5.1 Precedence (the ordering authority)
`operator (1000) > stage3 (100) > tier (50) > archetype (30) > emotion (25) > industry (15) > base (5)`.
Precedence is used two ways: as **voting weight** for scalars/`enum-vote`, and as **authority order** for `enum-owner`/`floor` params.

### 5.2 Scalar conflicts
Weighted mean with clamping. If two high-weight contributions pull in opposite directions such that their spread exceeds half the param's range, the merge **anchors on the highest-precedence contributor**, keeps the value, and drops confidence (marks `conflicted`) so Stage 4 is told to decide deliberately.

### 5.3 Emotion `avoid` veto (cross-cutting)
Before resolution, any contribution tagged with a quality that maps from an `avoid` term is **vetoed** (weight → 0) or **damped** (weight × 0.25) depending on `PARAM_REGISTRY[param].vetoMode`. Example: `avoid: ['loud','cheap']` → vetoes `energy`/`playfulness`/`bright` contributions, so a Jester archetype on a "quiet luxury" brief won't produce pill radii and bouncy motion. The veto is why emotion can override archetype *selectively* without a special-case rule.

### 5.4 Constraint floors (never loosen)
`floor-up` params (`contrast_floor`, `min_body_px`, `tap_target_min_px`) accept upgrades only. `const` platform params (reduced-motion, nav behavior, edge-to-edge, accent reservation) ignore all non-base layers. This makes it structurally impossible for the engine to seed something that breaks a platform invariant (`ARCHITECTURE.md` §16).

### 5.5 Stage-3 authority
Concept decisions the Creative Director already committed (`ornamentation`, `real_vs_generated_bias`, `visual_descriptors`, `surface_language`) enter as `stage3` layer (weight 100) and **win** their owned params — the engine only fills what Stage 3 left open. This preserves the decision-hierarchy: the human-grade creative call outranks the table.

### 5.6 Operator overrides
`overrides` enter as `operator` (weight 1000) and hard-win any param they name, with `confidence = 1.0` and `sources:['operator']`. Reserved for a future UI (e.g., forcing a tier or a font personality).

---

## 6. PUBLIC API (pure module, no model, node-testable)

```
DEFAULTS_VERSION : string                          // e.g. 'defaults@1.0.0'; stamped into seedDefaults + learning

computeDefaults(rawSignals) → seedDefaults
   rawSignals = {
     strategy,            // Stage 2 output (tier, archetype, emotional_objectives, palette-independent)
     director,            // Stage 3 output (concept decisions: ornamentation, imagery bias, descriptors)
     palette,             // hex[] from analyze / brand_identity.observed
     industry?,           // category string
     overrides?,          // { <paramPath>: value }
   }
   → the seedDefaults structure (§2.4). Never throws; always complete.

normalizeSignals(rawSignals) → SignalSet          // exposed for testing/inspection
explainDefaults(rawSignals) → { param → [Contribution] }   // full contribution breakdown for debugging
derivePaletteRoles(palette) → { role_map, perRoleConfidence }

// Tables are exported read-only for golden-snapshot tests and future learning-loop tuning:
TIER_TABLE, ARCHETYPE_TABLE, EMOTION_QUALITY_MAP, QUALITY_TABLE, INDUSTRY_TABLE, BASE_TABLE, PARAM_REGISTRY, PRECEDENCE
```
Consistent with the CIL lib pattern: implemented as `lib/creative/defaults.mjs` (ESM `.mjs`, pure, imported by the Stage-4 route and by `node --test`).

---

## 7. EXAMPLE OUTPUTS

### 7.1 Coherent case — luxury / Lover / warmth+intimacy, avoid loud+cheap
Signals: `tier=luxury(score 88)`, `archetype_primary=Lover`, `qualities=[warmth, intimacy]`, `avoid=[loud, cheap]→veto[energy,playfulness,bright]`, palette `[#7a1f2b (cta), #f5ead6 (bg), #c9a26a (accent), #1c1a17 (ink)]`, Stage3 `ornamentation=restrained, real_vs_generated_bias=prefer_real`.
```
seedDefaults.seeds (excerpt):
  spacing.density        = { value:'airy',       confidence:0.9,  sources:['tier','emotion'], strategy:'enum-vote' }
  spacing.section_rhythm = { value:128,          confidence:0.85, sources:['tier'],           strategy:'scalar' }
  typography.scale_ratio = { value:1.414,        confidence:0.9,  sources:['tier'],           strategy:'scalar', owner:'tier' }
  typography.type_personality = { value:'serif', confidence:0.8,  sources:['archetype','emotion'], strategy:'enum-vote' }
  typography.body_px     = { value:17,           confidence:0.9,  sources:['tier'] }
  color.role_map         = { value:{page_bg:'#f5ead6',ink:'#1c1a17',cta:'#7a1f2b',accent:'#c9a26a',alt_bg:'#efe6d6'}, confidence:0.95, strategy:'derived' }
  color.gradient_policy  = { value:'subtle',     confidence:0.85, sources:['tier','emotion'] }
  component.ornamentation= { value:'restrained', confidence:1.0,  sources:['stage3'], strategy:'enum-owner' }  // Stage 3 wins
  component.radius_language = { value:'soft',    confidence:0.88, sources:['tier','archetype','emotion'] }
  motion.intensity_score = { value:12,           confidence:0.9,  sources:['tier','emotion'] }  // luxury 25 − warmth/intimacy/luxury damping; energy vetoed
  motion.intensity       = { value:'subtle',     confidence:0.9 }
  imagery.grade          = { value:'amber-warm', confidence:0.85, sources:['emotion','stage3'] }
  imagery.real_vs_generated_bias = { value:'prefer_real', confidence:1.0, sources:['stage3'] }
  accessibility.contrast_floor = { value:'WCAG AA', confidence:1.0, sources:['base'] }
meta.overall_confidence = 0.89 ; meta.conflicts = []
```

### 7.2 Conflict case — luxury tier but Outlaw archetype (deliberately edgy luxury)
Signals: `tier=luxury`, `archetype_primary=Outlaw`, `qualities=[drama]`, no avoid. Outlaw pushes `ornamentation=expressive`, `radius=sharp`, `motion=aggressive`; luxury pushes `ornamentation=restrained`, subtle motion.
```
component.ornamentation = {
  value:'restrained', confidence:0.55, conflicted:true,
  strategy:'enum-owner', sources:['tier'],
  alternatives:[{value:'expressive', weight:30 (archetype)}, {value:'restrained', weight:50 (tier)}]
}
motion.intensity_score = { value:38, confidence:0.5, conflicted:true, sources:['tier','archetype'] }  // luxury 25 pulled up by aggressive flavor
meta.conflicts = [
  { param:'component.ornamentation', top:[{restrained:50},{expressive:30}], note:'tier vs archetype — Stage 4 to decide the edge' },
  { param:'motion.intensity_score', top:[...], note:'restraint vs aggression' }
]
```
Here the engine does **not** silently pick — it anchors on precedence (tier), lowers confidence, and **flags the conflict** so Stage 4 spends judgment exactly where the brief is genuinely interesting (an "edgy luxury" gamble the Creative Director may have intended).

---

## 8. EXTENSIBILITY RULES (add without rewriting)

- **New archetype** → add one row to `ARCHETYPE_TABLE`. No logic change. Unknown archetypes fall back to `NEUTRAL_ARCHETYPE`.
- **New emotion** → add keyword(s) to `EMOTION_QUALITY_MAP`. If it needs a genuinely new affect, add a quality to `QUALITY_TABLE` and map to it. Unknown emotion terms are ignored (neutral), never fatal.
- **New industry** → add a row to `INDUSTRY_TABLE`. Unknown → no contribution.
- **New tier** → add a row to `TIER_TABLE` and the `tier` enum in the registry; scalars interpolate automatically by `score`.
- **New parameter** → add one `PARAM_REGISTRY` entry (kind, range/enum, base, strategy, owner) + contributions in whichever tables should influence it. The merge needs no change — it reads the registry generically.
- **New layer** (e.g., `seasonality`, `locale`) → add it to `PRECEDENCE` with a weight and give it a table; it contributes like any other layer.
- **Never rewrite the merge.** All variability is in tables + the registry. The merge is strategy-generic and stable.
- **Graceful degradation is mandatory**: any missing/unknown signal yields neutral defaults so the engine always returns a complete set.

---

## 9. CONFIDENCE, VERSIONING, TESTING

- **Confidence** per seed: scalars → `1 − normalizedSpread` (agreement); `enum-vote` → winner share; `enum-owner`/`const`/`floor` → owner/base signal confidence. Global `overall_confidence` = weighted mean. Low-confidence + `conflicted` seeds are surfaced in `meta.conflicts` — the contract with Stage 4.
- **Signal confidence** inputs: `tier.confidence` drops near a score boundary (e.g., score 79 between premium/luxury → 0.6); archetype primary 1.0 / secondary 0.5; a quality's strength scales with how many `evoke` terms map to it.
- **Versioning**: `DEFAULTS_VERSION` is stamped into `seedDefaults.version` and into `learning.model_versions` on each run, so outputs are attributable and A/B-able. Bump on any table change.
- **Testing**: golden-snapshot tests freeze `computeDefaults(fixtureSignals)` for a matrix of tier × archetype × emotion combos; any table edit shows a reviewable diff. Pure-function unit tests cover the merge strategies, the veto pass, floor tightening, and palette derivation — same `node --test` harness as the other CIL modules.

---

## 10. HOW STAGE 4 (BLUEPRINT GENERATOR) CONSUMES THE DEFAULTS

1. The orchestrator calls `computeDefaults(signals)` right before Stage 4 and passes `seedDefaults` into the Blueprint route.
2. The Blueprint prompt injects the seeds as **"SEED DEFAULTS — adopt unless the concept demands otherwise; override with reason,"** and injects `meta.conflicts` as **"JUDGMENT NEEDED HERE"** so the model spends its reasoning where signals genuinely disagreed.
3. **Deterministic, safe params bypass the model entirely** (Stage 4 uses them verbatim): the constraint floors, the platform constants, and the palette `role_map` skeleton. This saves tokens and guarantees constraint safety — the model never gets a chance to loosen a floor.
4. **Judgment params are model-decided** starting from the seed: font families (from `type_personality`), exact `hero_clamp` and bespoke moves, hero construction, signature-moment execution. For each, Stage 4 emits the final value; if it differs from the seed, it records `override + reason`.
5. **Learning loop**: `(seed → override? → reason → downstream critique/adherence score)` is the training signal. Over time the learner tunes `TIER_TABLE`/`ARCHETYPE_TABLE`/`QUALITY_TABLE` toward the parameter sets that historically scored best per niche/tier — improving the *seeds* (data) without touching the merge or the prompts. The defaults engine is the system's most directly learnable surface.

---

*End of defaults-engine specification. This module is the deterministic backbone: it makes the CIL consistent, cheap, and learnable. Stage 4 refines its seeds; it never starts from a blank page. Implement it (as `lib/creative/defaults.mjs`) before Stage 4, behind the same feature flags, with golden-snapshot tests — but not yet.*
