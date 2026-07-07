# VELPI STUDIO — CREATIVE DECISION OBJECT (CDO) SCHEMA

**Canonical schema specification — v1.0 (design only, no implementation code)**
Companion to `docs/CREATIVE_INTELLIGENCE_LAYER.md` and `ARCHITECTURE.md`.
Status: **the single source of truth.** Every creative decision originates here; no downstream prompt re-invents a decision the CDO already carries.

> Design mandate: optimize for **long-term evolution**, not the current implementation. This schema must remain readable and stable for years as new modules are added. It achieves that through four mechanisms defined below: (1) a uniform **Decision primitive**, (2) **additive-only** versioning with tombstones, (3) **open enums**, and (4) **extension bags**. Follow the Stability Contract (§0.2) and the schema will not need breaking changes.

---

## 0. FOUNDATIONS

### 0.1 What the CDO is
The Creative Decision Object is a single, versioned, typed JSON document that captures **every** creative decision for one website build as executable data plus reasoning. It is produced by the Creative Intelligence Layer (CIL) and consumed by Build, Copy, Images, Critique, and the learning system. It is persisted per project and, selectively, into long-term memory.

The CDO answers three questions at once, for every decision:
- **What** was decided (executable `value`/`parameters`),
- **Why** (`rationale`, `alternatives`),
- **How sure** (`confidence`) and **from where** (`provenance`, `source`).

### 0.2 The Stability Contract (read before changing anything, ever)
These rules keep the schema stable for years:
1. **Additive only.** New fields may be added; existing fields are **never removed or renamed**. To retire a field, mark it `deprecated` with a `deprecatedSince` and (optionally) a `supersededBy`; readers keep tolerating it — it becomes a **tombstone**, never a deletion.
2. **Reader tolerance.** Any consumer MUST ignore unknown fields and MUST tolerate missing optional fields. A newer producer + older reader must not crash.
3. **Open enums.** Every enum permits an out-of-set string plus a companion free-text field (the `_other` convention). Vocabularies grow without a schema bump.
4. **Extension bags.** Every object may carry an `ext: {}` free-form bag and `x_*` prefixed fields for experimental data that has not yet earned a first-class field. Nothing experimental forces a schema change.
5. **Semantic schema version.** `schemaVersion` (integer major) bumps **only** on a structural change that additive rules cannot cover (should be rare). `minReaderVersion` tells consumers the floor they must support. Per-field `since` records when a field was introduced. `migrations.js` upgrades old CDOs on read.
6. **Decisions are uniform.** Every creative decision is a `Decision<T>` (§0.4). New decision types cost one node, not a new sub-schema.
7. **Separation of decision and constraint.** A **Design Constraint** (§22) is a hard boundary Build may never cross; a **Philosophy parameter** is a decision Build must implement. Constraints can only *tighten*, never loosen, the platform invariants.

### 0.3 Field-metadata legend (used in every table below)
Every field row carries production/consumption/memory/learning metadata.

**Producer modules (who writes the field):**
| Code | Module | Route / lib |
|---|---|---|
| UE | Understanding Engine | `/api/creative/understand` |
| SE | Strategy Engine | `/api/creative/strategize` |
| PE | Philosophy Engine | `/api/creative/decide` |
| RR | Reference Resolver | `lib/creative/resolver.js` |
| SY | Synthesis Engine | `/api/creative/synthesize` |
| DC | Directive Critic | `/api/creative/validate` |
| DEF | Deterministic defaults | `lib/creative/defaults.js` (seed, then PE overrides) |
| SYS | Orchestrator/system | `lib/creative/orchestrator.js` (ids, timestamps, hashes) |
| OUT | Outcome writer | `lib/creative/persistence.js#attachOutcome` (post-build) |

**Consumer modules (who reads the field):**
`BR`=design-brief renderer · `BLD`=build-site (executor) · `CP`=generate-copy · `IMG`=generate-images · `RES`=reference resolver · `CRIT`=critique-site · `STORE`=Directive Store/learning · `UI`=Studio UI/reports.

**Mem (persistent-memory tier):**
- `G` — **Global memory**: belongs in long-term, cross-project memory (learning, defaults tuning, self-expanding library).
- `P` — **Project memory**: persisted with the project only (`projects.data.directive`), not generalized.
- `—` — **Ephemeral/derivable**: recomputed each run; not stored beyond the CDO row.

**Learn (learning-signal role):**
- `F` — **Feature**: an input the learner conditions on (e.g., niche, premium tier, a philosophy parameter).
- `L` — **Label/outcome**: a target the learner predicts or optimizes (e.g., critique score, user-edit count).
- `R` — **Reasoning trace**: kept for explainability/auditing; usable for later distillation.
- `—` — not used for learning.

### 0.4 The `Decision<T>` primitive (the reusable heart of the schema)
Every creative choice is expressed with this uniform shape. New decisions never invent a new structure — they instantiate `Decision<T>`.

| Field | Type | R | Description | Example |
|---|---|---|---|---|
| `value` | T (scalar/enum/object) | ✓ | The decision itself — the executable answer. | `"airy"` |
| `parameters` | object | ○ | Structured executable detail behind the value. | `{ base_unit: 8, density: "airy" }` |
| `rationale` | string | ✓ | One–three sentences: why this, here, now. | `"Luxury tier + calm archetype → generous negative space signals confidence."` |
| `confidence` | number 0..1 | ✓ | Model/derivation certainty. | `0.82` |
| `source` | enum(`model`,`default`,`operator`,`memory`,`hybrid`)+`_other` | ✓ | Where the value originated. | `"model"` |
| `alternatives` | array of `{value, why_not}` | ○ | Considered-and-rejected options (agency thinking + learning). | `[{value:"tight", why_not:"reads as budget"}]` |
| `locked` | boolean | ○ | If true, Build must implement verbatim; false allows craft latitude. | `true` |
| `provenance` | object | ○ | `{ producer, since, revisedBy?, derived_from:[dial keys] }`. | `{producer:"PE", since:1}` |
| `ext` | object | ○ | Extension bag for experimental sub-data. | `{}` |

> Convention: in the tables below, a field described as "`Decision<…>`" is a full `Decision` node whose `value`/`parameters` carry the noted type. Scalar-looking rows in philosophy sections are the `parameters` inside that node.

### 0.5 Common types & open-enum convention
- **Scalars:** `string`, `int`, `number`, `bool`, `hex` (`^#[0-9a-fA-F]{6}$`), `iso_datetime`, `uuid`, `pct` (0..100), `unit01` (0..1).
- **Open enum:** any `enum(...)` field is paired with an optional `<field>_other: string` for values outside the current set. Readers treat unknown enum values as valid strings.
- **Ref id:** `style_id`/`motion_id`/`section_id` are opaque strings matching existing library ids (`builtin_*`, `refero_*`, motion/section manifest ids).

---

## 1. TOP-LEVEL ENVELOPE

The CDO root. Namespaces are the 25 required domains plus metadata. Each namespace is independently extensible.

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `schemaVersion` | int | ✓ | Major schema version for structural changes. | `1` | SYS | all | P | — |
| `minReaderVersion` | int | ✓ | Lowest reader version that can safely consume this doc. | `1` | SYS | all | P | — |
| `id` | uuid | ✓ | Unique CDO id. | `"7f3a…"` | SYS | all,STORE | P | F |
| `projectId` | uuid | ○ | Link to `projects.id` if saved. | `"a19…"` | SYS | STORE,UI | P | F |
| `businessName` | string | ✓ | Convenience denorm of the business. | `"Amrit Palace"` | UE | all,UI | P | F |
| `createdAt` | iso_datetime | ✓ | Creation timestamp. | `"2026-07-07T…"` | SYS | STORE,UI | P | — |
| `mode` | enum(`shadow`,`assist`,`execute`) | ✓ | How this CDO was used in the run. | `"execute"` | SYS | BLD,STORE | P | F |
| `partial` | bool | ✓ | A stage fell back to legacy; CDO is incomplete. | `false` | SYS | BLD,CRIT | P | L |
| `business_understanding` | object §1 | ✓ | See §"1. Business Understanding". | — | UE | many | see rows | — |
| `brand_identity` | object §2 | ✓ | — | — | UE/SE | many | — | — |
| `customer_psychology` | object §3 | ✓ | — | — | UE | many | — | — |
| `market_positioning` | object §4 | ✓ | — | — | UE/SE | many | — | — |
| `emotional_objectives` | object §5 | ✓ | — | — | SE | many | — | — |
| `creative_direction` | object §6 | ✓ | — | — | SE/SY | many | — | — |
| `design_philosophy` | object §7 | ✓ | — | — | PE | many | — | — |
| `typography_philosophy` | Decision §8 | ✓ | — | — | PE | BLD,BR | — | — |
| `color_philosophy` | Decision §9 | ✓ | — | — | PE | BLD,IMG | — | — |
| `layout_philosophy` | Decision §10 | ✓ | — | — | PE | BLD | — | — |
| `component_philosophy` | Decision §11 | ✓ | — | — | PE | BLD | — | — |
| `motion_philosophy` | Decision §12 | ✓ | — | — | PE | BLD | — | — |
| `imagery_philosophy` | Decision §13 | ✓ | — | — | PE | IMG,BLD | — | — |
| `conversion_philosophy` | object §14 | ✓ | — | — | SE/PE | CP,BLD | — | — |
| `mobile_philosophy` | Decision §15 | ✓ | — | — | PE | BLD | — | — |
| `accessibility_philosophy` | Decision §16 | ✓ | — | — | PE | BLD,CRIT | — | — |
| `signature_moment` | object §17 | ✓ | — | — | SY | BLD,CRIT | — | — |
| `design_dna` | object §18 | ✓ | Compact reusable fingerprint. | — | SY | RES,STORE | G | F |
| `confidence` | object §19 | ✓ | Per-section + overall confidence. | — | DC/SYS | UI,STORE | P | L |
| `creative_reasoning` | object §20 | ○ | Narrative thinking trace. | — | SY | UI,STORE | P | R |
| `validation` | object §21 | ✓ | Critic result + rule checks. | — | DC | BLD,UI,STORE | P | L |
| `constraints` | object §22 | ✓ | Hard, non-overridable boundaries. | — | SYS/PE | BLD,CRIT | P | — |
| `references` | object §23 | ✓ | Library assets chosen. | — | RR | BLD,STORE | P | F |
| `internal_critique` | object §24 | ○ | Self-critique + revision history. | — | DC | UI,STORE | P | L |
| `learning` | object §25 | ✓ | Learning metadata + outcomes. | — | SYS/OUT | STORE | G | L |
| `ext` | object | ○ | Root-level extension bag. | `{}` | any | tolerant | — | — |

---

## 1. BUSINESS UNDERSTANDING (`business_understanding`)
*Producer: UE. Consumers: SE, CP, BLD, CRIT, UI.*

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `true_offering` | string | ✓ | What they *actually* sell (job, not SKU). | `"a candlelit special-occasion experience"` | UE | SE,CP,BLD | P | F |
| `category` | string | ✓ | Business category. | `"fine dining restaurant"` | UE | RES,SE | G | F |
| `subcategory` | string | ○ | Finer niche. | `"North Indian fine dining"` | UE | RES | G | F |
| `maturity` | enum(`new`,`growing`,`established`,`legacy`)+_other | ✓ | Business lifecycle stage. | `"established"` | UE | SE | P | F |
| `differentiators` | string[] | ✓ | Real, defensible advantages. | `["30-yr chef","candlelit room"]` | UE | CP,BLD,SE | P | F |
| `proof_assets` | string[] | ✓ | Real proof available (reviews, awards, credentials). | `["4.8★ Google","Zagat 2019"]` | UE | CP,BLD | P | F |
| `business_model` | string | ○ | How money is actually made. | `"dine-in + private events"` | UE | SE,CP | P | F |
| `geography` | string | ○ | Service area / locality. | `"Austin, TX"` | UE | CP | P | F |
| `confidence` | unit01 | ✓ | UE certainty for this block. | `0.86` | UE | DC,UI | P | L |
| `ext` | object | ○ | Extension bag. | `{}` | UE | — | — | — |

---

## 2. BRAND IDENTITY (`brand_identity`)
*Producer: UE (observed) + SE (intended). Consumers: PE, BLD, IMG, CP.*
Split cleanly into **observed** (what the crawled site shows) and **intended** (the elevated identity CIL commits to) so learning can compare the two.

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `observed.palette` | hex[] | ✓ | Colors detected on the source site. | `["#7a1f2b","#f5ead6"]` | UE | PE,IMG | P | F |
| `observed.typography` | string | ○ | Fonts/feel detected. | `"serif headers, humanist body"` | UE | PE | P | F |
| `observed.design_language` | string | ○ | One-line read of current site. | `"dated but warm"` | UE | SE | P | F |
| `observed.assets` | object | ○ | `{ logo_url, imagery_style }`. | `{logo_url:"…"}` | UE | IMG,BLD | P | — |
| `intended.brand_promise` | string | ✓ | The elevated promise. | `"the city's most romantic table"` | SE | CP,BLD | P | F |
| `intended.personality` | string[] | ✓ | 3–5 adjectives (intended). | `["warm","refined","timeless"]` | SE | CP,BLD | G | F |
| `intended.voice` | Decision<object> | ✓ | Voice/tone spec for copy. | `{value:"warm-authoritative",parameters:{reading_level:"low",person:"second"}}` | SE | CP | P | F |
| `brand_continuity_rule` | string | ✓ | How much to elevate vs. preserve. | `"elevate, never reinvent — keep the maroon"` | SE | BLD,IMG | P | F |
| `confidence` | unit01 | ✓ | — | `0.8` | UE/SE | DC | P | L |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 3. CUSTOMER PSYCHOLOGY (`customer_psychology`)
*Producer: UE. Consumers: SE, CP, BLD, CRIT.*

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `who` | string | ✓ | Primary customer in one line. | `"couples planning a milestone night"` | UE | SE,CP | P | F |
| `segments` | object[] | ○ | `{name, share_estimate, notes}` for multiple audiences. | `[{name:"date-night",…}]` | UE | SE | P | F |
| `jobs_to_be_done` | string[] | ✓ | Functional/emotional/social jobs. | `["impress a partner","feel taken care of"]` | UE | CP,BLD | G | F |
| `anxieties` | string[] | ✓ | Objections/fears before acting. | `["is it worth the price?","will it be loud?"]` | UE | CP,BLD | P | F |
| `desires` | string[] | ✓ | What they truly want to feel/gain. | `["a memorable evening","effortless booking"]` | UE | CP,BLD | P | F |
| `sophistication` | enum(`low`,`medium`,`high`)+_other | ✓ | Design/brand literacy of the audience. | `"high"` | UE | PE | P | F |
| `decision_trigger` | string | ✓ | The moment/reason they act. | `"an upcoming anniversary"` | UE | CP,SE | P | F |
| `emotional_state_on_arrival` | string | ○ | Mindset when they land on the page. | `"hopeful, comparison-shopping"` | UE | SE,BLD | P | F |
| `confidence` | unit01 | ✓ | — | `0.78` | UE | DC | P | L |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 4. MARKET POSITIONING (`market_positioning`)
*Producer: UE + SE. Consumers: SE, PE, BLD, CP, RES.*

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `statement` | string | ✓ | One-line positioning statement. | `"the special-occasion restaurant, not the everyday one"` | SE | BLD,CP | P | F |
| `competitive_frame` | string | ✓ | Who/what we're positioned against. | `"vs. casual family Indian spots"` | UE | SE | P | F |
| `price_posture` | enum(`value`,`mid`,`premium`,`luxury`)+_other | ✓ | Where price sits. | `"premium"` | UE | PE(defaults) | G | F |
| `primary_promise` | string | ✓ | The core promise the page must land. | `"a night you'll remember"` | SE | BLD,CP | P | F |
| `reasons_to_believe` | string[] | ✓ | Proof that backs the promise. | `["30-yr chef","private candlelit room"]` | UE | CP,BLD | P | F |
| `category_conventions` | string[] | ✓ | The clichés everyone in the niche uses. | `["red spice photos","gold borders"]` | UE | PE,BLD | G | F |
| `conventions_to_break` | string[] | ✓ | Which conventions we deliberately reject. | `["stock curry close-ups"]` | SE | BLD,IMG | P | F |
| `visual_bar_reference` | string | ○ | Who sets the aspirational visual bar. | `"a boutique hotel restaurant site"` | UE | PE | P | F |
| `confidence` | unit01 | ✓ | — | `0.81` | SE | DC | P | L |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 5. EMOTIONAL OBJECTIVES (`emotional_objectives`)
*Producer: SE. Consumers: PE, BLD, IMG, CP, CRIT.* One of the **governing dials**.

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `north_star_feeling` | string | ✓ | The single 3-second feeling. | `"romantic anticipation"` | SE | BLD,CRIT | P | F |
| `primary_emotion` | string | ✓ | Dominant emotion to evoke. | `"warmth"` | SE | PE,IMG | G | F |
| `secondary_emotion` | string | ○ | Supporting emotion. | `"reverence"` | SE | PE | P | F |
| `evoke` | string[] | ✓ | Feelings to actively create. | `["intimacy","occasion","trust"]` | SE | BLD,IMG,CP | P | F |
| `avoid` | string[] | ✓ | Feelings to prevent. | `["cheap","loud","generic"]` | SE | BLD,IMG,CRIT | P | F |
| `emotional_arc` | object[] | ○ | Feeling target per scroll stage `{section, feeling}`. | `[{section:"hero",feeling:"awe"}]` | SE | BLD | P | F |
| `confidence` | unit01 | ✓ | — | `0.84` | SE | DC | P | L |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 6. CREATIVE DIRECTION (`creative_direction`)
*Producer: SE + SY. Consumers: PE, BLD, BR, CRIT, UI.* Governing dials live here.

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `creative_thesis` | string | ✓ | ONE sentence every philosophy must ladder to. | `"A candlelit love letter to a 30-year kitchen."` | SY | BLD,PE,CRIT | P | F |
| `premium_level` | Decision<object> | ✓ | Tier dial. `parameters:{tier, score_0_100}`. | `{value:"luxury",parameters:{tier:"luxury",score_0_100:88}}` | SE | PE(defaults),BLD | G | F |
| `brand_archetype` | Decision<object> | ✓ | Jungian anchor. `parameters:{primary, secondary}`. | `{value:"Lover",parameters:{primary:"Lover",secondary:"Sage"}}` | SE | PE,CP | G | F |
| `the_gamble` | Decision<object> | ✓ | The single bold move + risk. | `{value:"near-black room-lit hero",parameters:{risk:"medium"}}` | SE | BLD,CRIT | P | F |
| `positioning_tension` | string | ✓ | The interesting contrast leaned into. | `"heritage kitchen × modern restraint"` | SE | BLD | P | F |
| `art_direction_statement` | string | ✓ | The look, stated as an ECD would. | `"editorial warmth, cinematic light, zero clutter"` | SY | BLD,IMG | P | F |
| `confidence` | unit01 | ✓ | — | `0.83` | SY | DC | P | L |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 7. DESIGN PHILOSOPHY (`design_philosophy`)
*Producer: PE. Consumers: BLD, BR.* The overarching visual-language decision that the specific philosophies (§8–16) refine.

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `visual_language` | Decision<string> | ✓ | The overall aesthetic stance. | `{value:"warm editorial luxury",parameters:{descriptors:["editorial","warm","restrained"]}}` | PE | BLD,RES | G | F |
| `movement_refs` | string[] | ○ | Art/design movements referenced. | `["mid-century editorial","slow food"]` | PE | BLD | G | F |
| `ornamentation` | enum(`none`,`restrained`,`expressive`)+_other | ✓ | Decoration level. | `"restrained"` | PE | BLD | P | F |
| `surface_language` | string | ✓ | Materiality: flat/layered/paper/glass/etc. | `"warm paper with soft depth"` | PE | BLD | P | F |
| `design_principles` | string[] | ✓ | 3–5 principles Build must honor. | `["let the room breathe","one hero moment"]` | PE | BLD,CRIT | P | F |
| `rationale` | string | ✓ | Why this language for this business. | `"…"` | PE | UI | P | R |
| `confidence` | unit01 | ✓ | — | `0.82` | PE | DC | P | L |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 8. TYPOGRAPHY PHILOSOPHY (`typography_philosophy`) — `Decision<object>`
*Producer: PE (seeded by DEF from premium tier + archetype). Consumers: BLD, BR, CRIT.*

| Parameter | Type | R | Description | Example | Mem | Learn |
|---|---|---|---|---|---|---|
| `philosophy` | string | ✓ | The typographic stance. | `"editorial serif authority over quiet sans"` | P | F |
| `display_family` | string | ✓ | Google Font for headlines. | `"Cormorant Garamond"` | G | F |
| `body_family` | string | ✓ | Google Font for body. | `"Inter"` | G | F |
| `accent_family` | string | ○ | Optional third family. | `"IBM Plex Mono"` | P | F |
| `scale_ratio` | number | ✓ | Modular scale ratio. | `1.333` | P | F |
| `hero_clamp` | string | ✓ | Fluid hero size. | `"clamp(2.6rem, 9vw, 6.5rem)"` | P | F |
| `h2_clamp`/`h3_clamp` | string | ✓ | Fluid subhead sizes. | `"clamp(1.8rem,5vw,3rem)"` | P | F |
| `body_px` | int | ✓ | Base body size (≥ a11y floor). | `17` | P | F |
| `weights` | object | ✓ | Role→weight map. | `{display:600,body:400,label:500}` | P | F |
| `tracking` | object | ○ | Role→letter-spacing. | `{label:"0.14em"}` | P | F |
| `case_rules` | string[] | ○ | Casing treatments. | `["small-caps eyebrows"]` | P | F |
| `pairing_rationale` | string | ✓ | Why this pairing. | `"serif = heritage, sans = clarity"` | P | R |
*(Node also carries `rationale`, `confidence`, `source`, `locked`, `alternatives` per `Decision<T>`.)*

---

## 9. COLOR PHILOSOPHY (`color_philosophy`) — `Decision<object>`
*Producer: PE (seeded by observed palette + tier). Consumers: BLD, IMG, CRIT.*

| Parameter | Type | R | Description | Example | Mem | Learn |
|---|---|---|---|---|---|---|
| `philosophy` | string | ✓ | Color stance. | `"warm monochrome with a single ember accent"` | P | F |
| `source_palette` | hex[] | ✓ | Brand palette to theme-lock to. | `["#7a1f2b","#f5ead6","#1c1a17"]` | P | F |
| `role_map` | object | ✓ | Semantic roles → hex/derivation. | `{page_bg:"#f5ead6",ink:"#1c1a17",cta:"#7a1f2b",accent:"#c9a26a"}` | P | F |
| `contrast_strategy` | string | ✓ | How contrast is guaranteed. | `"dark ink on cream; white only on scrimmed photos"` | P | F |
| `gradient_policy` | enum(`none`,`subtle`,`expressive`)+_other | ✓ | Gradient usage. | `"subtle"` | P | F |
| `dark_surface_policy` | string | ✓ | When dark sections are allowed. | `"hero + closing band only"` | P | F |
| `restraint_rule` | string | ✓ | The one-line "never" for color. | `"max one accent; never off-palette hues"` | P | F |
| `accent_reservation` | string | ○ | What the accent is reserved for. | `"CTAs and small emphasis only"` | P | F |
*(Plus `Decision<T>` meta.)*

---

## 10. LAYOUT PHILOSOPHY (`layout_philosophy`) — `Decision<object>`
*Producer: PE + SY. Consumers: BLD, CRIT, RES.*

| Parameter | Type | R | Description | Example | Mem | Learn |
|---|---|---|---|---|---|---|
| `philosophy` | string | ✓ | Layout stance. | `"editorial asymmetry over grid symmetry"` | P | F |
| `section_order` | string[] | ✓ | The persuasion-ordered sections. | `["hero","story","menu","proof","visit"]` | P | F |
| `grid` | object | ✓ | `{columns, gutter, asymmetry}`. | `{columns:12,gutter:"24px",asymmetry:"bold"}` | P | F |
| `spacing` | object | ✓ | `{base_unit, density, section_rhythm}`. | `{base_unit:8,density:"airy",section_rhythm:"120px"}` | P | F |
| `hero_construction` | string | ✓ | Exactly what the hero is. | `"full-bleed candlelit room, headline bottom-left over scrim"` | P | F |
| `signature_structural_move` | string | ✓ | The one layout move that defines the page. | `"menu as two-column dotted-leader list"` | P | F |
| `bespoke_moves` | string[] | ✓ | ≥3 compositional moves (the anti-generic proof). | `["8/4 About split","image-bleed headline","off-grid stat"]` | P | F |
| `density_target` | enum(`minimal`,`balanced`,`rich`)+_other | ✓ | Content density. | `"rich"` | P | F |
| `rhythm_pattern` | string | ✓ | Alternation of dense/airy, light/dark. | `"airy → dense → airy → dark CTA"` | P | F |
*(Plus `Decision<T>` meta. `spacing` is embedded here since spacing serves layout; it is also queryable independently — see §26 alias note.)*

---

## 11. COMPONENT PHILOSOPHY (`component_philosophy`) — `Decision<object>`
*Producer: PE. Consumers: BLD.* Governs buttons, cards, forms, nav, dividers, trust chips — the reusable UI atoms Build renders inline.

| Parameter | Type | R | Description | Example | Mem | Learn |
|---|---|---|---|---|---|---|
| `philosophy` | string | ✓ | Component stance. | `"quiet, hairline-defined, no floating cards"` | P | F |
| `buttons` | object | ✓ | Shape/weight/treatment. | `{radius:"999px",weight:"solid ink",hover:"lift 2px"}` | P | F |
| `cards` | object | ✓ | Elevation/border/shadow language. | `{border:"1px hairline",shadow:"layered tinted",radius:"16px"}` | P | F |
| `forms` | object | ○ | Input/field treatment. | `{style:"underline fields"}` | P | F |
| `navigation` | object | ✓ | Nav construction (desktop + mobile). | `{desktop:"wordmark+links+CTA",mobile:"logo+CTA only"}` | P | F |
| `dividers` | string | ○ | Section-edge language. | `"thin top rule; no boxes"` | P | F |
| `trust_marks` | string | ○ | How credibility chips render. | `"styled text-mark chips near CTA"` | P | F |
| `iconography` | enum(`none`,`line`,`filled`,`duotone`)+_other | ✓ | Icon style. | `"line"` | P | F |
| `radius_language` | enum(`sharp`,`soft`,`pill`)+_other | ✓ | Corner language. | `"soft"` | P | F |
*(Plus `Decision<T>` meta.)*

---

## 12. MOTION PHILOSOPHY (`motion_philosophy`) — `Decision<object>`
*Producer: PE + RR. Consumers: BLD, CRIT.* One signature motion + micro-interaction policy.

| Parameter | Type | R | Description | Example | Mem | Learn |
|---|---|---|---|---|---|---|
| `philosophy` | string | ✓ | Motion stance. | `"stillness with one breathing glow"` | P | F |
| `signature_motion` | object | ✓ | `{ motion_id?, spec?, placement, intensity }`. | `{motion_id:"spotlight-halo",placement:"hero",intensity:"subtle"}` | P | F |
| `intensity` | enum(`none`,`subtle`,`medium`,`bold`)+_other | ✓ | Global motion energy. | `"subtle"` | P | F |
| `micro_interactions_allowed` | string[] | ✓ | Permitted CSS-only interactions. | `["hover lift","nav underline","image scale 1.03"]` | P | F |
| `forbidden` | string[] | ✓ | Explicitly banned motion. | `["autoplay carousels","parallax stacks"]` | P | F |
| `reduced_motion_policy` | string | ✓ | Required `prefers-reduced-motion` behavior. | `"disable all keyframes; keep opacity"` | P | F |
| `color_mapping_rule` | string | ✓ | How `--vm-c1/--vm-c2` map to palette. | `"secondary/neutral only; never the accent"` | P | F |
*(Plus `Decision<T>` meta. Enforces the platform invariant: exactly ONE ambient motion.)*

---

## 13. IMAGERY PHILOSOPHY (`imagery_philosophy`) — `Decision<object>`
*Producer: PE. Consumers: IMG, BLD, CRIT.* Drives `renderImageGuide`.

| Parameter | Type | R | Description | Example | Mem | Learn |
|---|---|---|---|---|---|---|
| `philosophy` | string | ✓ | Imagery stance. | `"cinematic candlelight, real room, no stock"` | P | F |
| `art_direction` | string | ✓ | The look of every image. | `"warm low-key, shallow depth, occasion energy"` | P | F |
| `grade` | string | ✓ | Color grade toward palette/mood. | `"amber-warm, lifted blacks"` | P | F |
| `lighting` | string | ✓ | Lighting language. | `"candlelit key, soft falloff"` | P | F |
| `crop_language` | string | ✓ | Crop/aspect intent. | `"full-bleed hero; tight food macros"` | P | F |
| `subject_rules` | string[] | ✓ | What subjects to depict/avoid; role-only for people. | `["real dishes","no named individuals"]` | P | F |
| `real_vs_generated_bias` | enum(`prefer_real`,`balanced`,`prefer_generated`)+_other | ✓ | Sourcing bias. | `"prefer_real"` | P | F |
| `theme_lock` | string | ✓ | The cohesion rule across all images. | `"every image graded to one shoot"` | P | F |
*(Plus `Decision<T>` meta.)*

---

## 14. CONVERSION PHILOSOPHY (`conversion_philosophy`)
*Producer: SE + PE (absorbs legacy `analysis.conversion_strategy`). Consumers: CP, BLD, CRIT.*

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `philosophy` | string | ✓ | Conversion stance. | `"quiet confidence; book without pressure"` | SE | BLD,CP | P | F |
| `primary_action` | string | ✓ | THE money action / CTA label. | `"Reserve a Table"` | SE | CP,BLD | G | F |
| `secondary_action` | string | ✓ | Lower-commitment action. | `"View the Menu"` | SE | CP,BLD | P | F |
| `cta_ubiquity_rule` | string | ✓ | Where the CTA must appear. | `"sticky nav + hero + closing band"` | PE | BLD,CRIT | P | F |
| `proof_adjacency_rule` | string | ✓ | Proof placed next to conversion. | `"a review beside the reserve CTA"` | PE | BLD | P | F |
| `offer_moment` | string | ✓ | The honest reason to act now. | `"private room books out on holidays"` | SE | CP,BLD | P | F |
| `objections` | object[] | ✓ | `{objection, answered_by, where}`. | `[{objection:"pricey?",answered_by:"30-yr chef",where:"story"}]` | SE | CP,BLD | P | F |
| `persuasion_flow` | object[] | ✓ | `{section, job}` per section. | `[{section:"hero",job:"arrest with the room"}]` | SE | BLD,CP | P | F |
| `friction_reducers` | string[] | ✓ | Ways to lower action cost. | `["tap-to-call","one-line reserve"]` | PE | BLD | P | F |
| `confidence` | unit01 | ✓ | — | `0.85` | SE | DC | P | L |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 15. MOBILE PHILOSOPHY (`mobile_philosophy`) — `Decision<object>`
*Producer: PE (seeded by DEF). Consumers: BLD, CRIT.* Can only tighten the platform mobile contract.

| Parameter | Type | R | Description | Example | Mem | Learn |
|---|---|---|---|---|---|---|
| `philosophy` | string | ✓ | Mobile stance. | `"edge-to-edge cinema on a phone"` | P | F |
| `base_viewport_px` | int | ✓ | Design base width. | `390` | P | F |
| `edge_to_edge_policy` | string | ✓ | Gutter/inset rule. | `"full-bleed sections, 14px text inset"` | P | F |
| `type_floor_px` | int | ✓ | Minimum body px on mobile (≥16). | `16` | P | F |
| `nav_pattern` | string | ✓ | JS-free mobile nav. | `"logo + single CTA; links hidden"` | P | F |
| `thumb_reach_rules` | string[] | ✓ | Reachability/tap spacing. | `["≥52px CTAs","≥8px between targets"]` | P | F |
| `breakpoints` | int[] | ✓ | Enhancement breakpoints. | `[768,1200]` | P | F |
| `mobile_signature_adaptation` | string | ○ | How the signature moment survives on mobile. | `"headline stacks over scrim"` | P | F |
*(Plus `Decision<T>` meta.)*

---

## 16. ACCESSIBILITY PHILOSOPHY (`accessibility_philosophy`) — `Decision<object>`
*Producer: PE. Consumers: BLD, CRIT.* Constraint-like: only tightens.

| Parameter | Type | R | Description | Example | Mem | Learn |
|---|---|---|---|---|---|---|
| `philosophy` | string | ✓ | A11y stance. | `"legible-first luxury"` | P | F |
| `contrast_floor` | enum(`WCAG AA`,`WCAG AAA`)+_other | ✓ | Minimum contrast target. | `"WCAG AA"` | P | F |
| `min_body_px` | int | ✓ | Absolute minimum text size. | `16` | P | F |
| `tap_target_min_px` | int | ✓ | Minimum interactive target. | `44` | P | F |
| `motion_safety` | string | ✓ | Reduced-motion requirement. | `"all ambient motion disabled on request"` | P | F |
| `semantic_rules` | string[] | ✓ | Structure/alt/focus requirements. | `["one h1","alt on every img","visible focus"]` | P | F |
| `color_independence` | string | ○ | No meaning by color alone. | `"CTAs labeled, not color-only"` | P | F |
*(Plus `Decision<T>` meta. The Validator enforces these as *floors* Build cannot undercut.)*

---

## 17. SIGNATURE MOMENT (`signature_moment`)
*Producer: SY. Consumers: BLD, CRIT, UI.* The one unforgettable thing; the hard gate the critic checks.

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `name` | string | ✓ | Short evocative name. | `"The Candlelit Threshold"` | SY | UI,BLD | P | F |
| `description` | string | ✓ | Exactly what it is. | `"full-bleed dark room hero, single warm glow behind the headline"` | SY | BLD,CRIT | P | F |
| `location` | string | ✓ | Which section it lives in. | `"hero"` | SY | BLD,CRIT | P | F |
| `execution_notes` | string | ✓ | How Build must implement it. | `"scrim 55%, headline bottom-left, halo motion behind"` | SY | BLD | P | F |
| `must_survive_mobile` | bool | ✓ | Whether it is required on phones. | `true` | SY | BLD,CRIT | P | F |
| `critique_gate` | bool | ✓ | If true, absence fails critique (hard gate). | `true` | SY | CRIT | P | L |
| `confidence` | unit01 | ✓ | — | `0.87` | SY | DC | P | L |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 18. DESIGN DNA (`design_dna`)
*Producer: SY. Consumers: RES, STORE, learning.* A **compact, portable fingerprint** of the whole directive — the unit of long-term memory and the seed for the self-expanding library. Designed so two CDOs can be compared, clustered, and distilled.

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `dna_version` | int | ✓ | DNA format version (independent of schemaVersion). | `1` | SY | STORE | G | — |
| `descriptors` | string[] | ✓ | 5–8 canonical aesthetic tags. | `["editorial","warm","candlelit","restrained"]` | SY | RES,STORE | G | F |
| `tier` | string | ✓ | Premium tier (denorm). | `"luxury"` | SY | RES,STORE | G | F |
| `archetype` | string | ✓ | Brand archetype (denorm). | `"Lover"` | SY | RES,STORE | G | F |
| `palette_signature` | hex[] | ✓ | Canonical 3–5 color signature. | `["#7a1f2b","#f5ead6","#c9a26a"]` | SY | RES,STORE | G | F |
| `type_signature` | string | ✓ | `display/body` pairing key. | `"CormorantGaramond/Inter"` | SY | RES,STORE | G | F |
| `layout_signature` | string | ✓ | Compact layout descriptor. | `"asymmetric-editorial"` | SY | RES,STORE | G | F |
| `motion_signature` | string | ✓ | Motion id/intensity key. | `"spotlight-halo:subtle"` | SY | RES,STORE | G | F |
| `embedding` | number[] | ○ | Vector of the DNA for semantic search (Phase 4+). | `[0.01,…]` | SYS | RES,STORE | G | F |
| `hash` | string | ✓ | Stable content hash of the DNA (dedupe). | `"dna_9f2…"` | SYS | STORE | G | F |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 19. CONFIDENCE SCORES (`confidence`)
*Producer: DC + SYS. Consumers: UI, STORE, learning, orchestrator (fallback decisions).*

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `overall` | unit01 | ✓ | Aggregate confidence in the CDO. | `0.83` | DC | UI,BLD | P | L |
| `by_section` | object | ✓ | `section_key → unit01`. | `{typography_philosophy:0.9,…}` | DC | UI,STORE | P | L |
| `lowest` | object | ○ | `{section, value}` — the weakest decision. | `{section:"customer_psychology",value:0.6}` | DC | UI | P | L |
| `fallback_triggered` | string[] | ✓ | Sections that fell back to legacy/default. | `[]` | SYS | BLD,STORE | P | L |
| `calibration_note` | string | ○ | How confidence was computed. | `"model self-report × critic agreement"` | DC | STORE | P | R |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 20. CREATIVE REASONING (`creative_reasoning`)
*Producer: SY (+ each engine contributes). Consumers: UI, STORE, learning distillation.* The narrative "why" — explainability and future training data. **Never** consumed by Build (Build reads decisions, not prose).

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `narrative` | string | ○ | The ECD's paragraph on the whole direction. | `"We reject the red-spice cliché because…"` | SY | UI | P | R |
| `key_insights` | string[] | ✓ | The 3–5 insights that drove decisions. | `["occasion > everyday","heritage is the moat"]` | SY | UI,STORE | G | F |
| `decision_log` | object[] | ○ | `{decision, because, tradeoff}` chain. | `[{decision:"dark hero",because:"occasion",tradeoff:"harder legibility"}]` | SY | STORE | P | R |
| `assumptions` | string[] | ✓ | Explicit assumptions made (esp. when data thin). | `["reviews imply romance angle"]` | UE/SE | UI,STORE | P | R |
| `open_questions` | string[] | ○ | What a human might refine. | `["is private-room the lead story?"]` | DC | UI | P | R |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 21. VALIDATION RULES (`validation`)
*Producer: DC. Consumers: BLD (proceed/degrade), UI, STORE.* The machine-checkable gate before Build executes.

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `passed` | bool | ✓ | Whether the CDO is coherent + feasible + safe. | `true` | DC | BLD,STORE | P | L |
| `score` | pct | ✓ | Directive-quality score. | `91` | DC | STORE,UI | P | L |
| `rules_checked` | object[] | ✓ | `{rule_id, area, passed, detail}`. | `[{rule_id:"coherence.thesis_ladder",passed:true}]` | DC | STORE | P | L |
| `issues` | object[] | ✓ | `{severity, area, problem, fix}`. | `[]` | DC | BLD,UI | P | L |
| `coherence_check` | object | ✓ | Cross-philosophy consistency result. | `{consistent:true,conflicts:[]}` | DC | UI | P | L |
| `constraint_safety` | object | ✓ | Confirms no constraint (§22) is violated. | `{a11y_floor_ok:true,mobile_ok:true}` | DC | BLD | P | L |
| `revised_count` | int | ✓ | Revision-loop iterations used. | `1` | DC | STORE | P | L |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

**Standing validation rule families (rule_id namespaces):** `coherence.*` (all philosophies ladder to `creative_thesis`; no conflicting parameters), `feasibility.*` (implementable in scoped CSS, no-JS), `constraint.*` (never loosens a platform invariant), `non_generic.*` (≥3 bespoke moves; signature moment present), `completeness.*` (required sections present), `brand.*` (palette-locked, continuity honored).

---

## 22. DESIGN CONSTRAINTS (`constraints`)
*Producer: SYS + PE. Consumers: BLD, CRIT.* **Hard boundaries Build may never cross.** These are distinct from philosophies: a philosophy is a decision to implement; a constraint is a rule that cannot be broken. Constraints may only **tighten** platform invariants, never loosen them.

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `platform` | object | ✓ | Immutable platform rules (mirrors `ARCHITECTURE.md` §16). | `{scoping:".velpi-page",fonts:"@import",no_js:true,no_fixed:true,viewport_meta:true,image_tokens:"%%IMG:id%%"}` | SYS | BLD,CRIT | P | — |
| `palette_lock` | hex[] | ✓ | Only these colors (+white+near-black+tints). | `["#7a1f2b","#f5ead6","#c9a26a"]` | PE | BLD,CRIT | P | F |
| `content_truth` | string[] | ✓ | Facts that must appear; none may be invented. | `["phone","hours","real reviews"]` | UE | BLD,CRIT | P | — |
| `a11y_floors` | object | ✓ | Minimums Build cannot undercut. | `{contrast:"WCAG AA",body_px:16,tap:44}` | PE | BLD,CRIT | P | — |
| `mobile_contract` | object | ✓ | Mobile rules Build cannot weaken. | `{base:390,edge_to_edge:true,no_h_scroll:true}` | PE | BLD,CRIT | P | — |
| `motion_limit` | object | ✓ | At most one ambient motion; reduced-motion required. | `{max_ambient:1,reduced_motion:true}` | PE | BLD,CRIT | P | — |
| `forbidden` | string[] | ✓ | Things Build must never do. | `["invent facts","external scripts","position:fixed"]` | SYS | BLD,CRIT | P | — |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 23. REFERENCES USED (`references`)
*Producer: RR. Consumers: BLD, STORE, learning.* The concrete library assets selected to realize the direction.

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `style_ids` | string[] | ✓ | Chosen DESIGN.md system ids. | `["refero_amrit_palace","builtin_editorial_warm"]` | RR | BLD,STORE | P | F |
| `style_fusion_note` | string | ✓ | How to blend them into one system. | `"amrit's menu list + warm-editorial hero"` | RR | BLD | P | F |
| `motion_id` | string | ○ | Chosen signature motion id. | `"spotlight-halo"` | RR | BLD | P | F |
| `section_ids` | string[] | ○ | Structural section references. | `["velpi--hero--split-editorial-masthead"]` | RR | BLD | P | F |
| `resolution_method` | enum(`niche`,`vibe`,`directive`,`semantic`)+_other | ✓ | How references were chosen. | `"directive"` | RR | STORE | P | L |
| `rejected` | object[] | ○ | `{id, why_not}` — considered but rejected. | `[{id:"builtin_bold_trades",why_not:"too loud"}]` | RR | STORE | P | F |
| `avoided_recent` | string[] | ○ | Ids skipped for anti-repetition. | `["aurora-veil"]` | RR | STORE | P | F |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 24. INTERNAL CRITIQUE (`internal_critique`)
*Producer: DC. Consumers: UI, STORE, learning.* The CIL's self-review of its own directive (separate from the post-build `critique-site`, which reviews the HTML).

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `self_score` | pct | ✓ | The critic's score of the directive. | `89` | DC | STORE,UI | P | L |
| `strengths` | string[] | ✓ | What is strong about this direction. | `["clear thesis","brave hero"]` | DC | UI | P | R |
| `weaknesses` | string[] | ✓ | Where it is weak/risky. | `["customer read is thin"]` | DC | UI,STORE | P | L |
| `revision_history` | object[] | ○ | `{iteration, changed, why}` for the loop. | `[{iteration:1,changed:"softened gamble",why:"legibility risk"}]` | DC | STORE | P | R |
| `risk_flags` | string[] | ✓ | Explicit risks Build/critique should watch. | `["dark hero legibility"]` | DC | BLD,CRIT | P | L |
| `generic_check` | object | ✓ | Did it avoid the niche clichés? | `{avoided:true,cliches_dodged:["red spice"]}` | DC | CRIT | P | L |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 25. FUTURE LEARNING METADATA (`learning`)
*Producer: SYS (features) + OUT (outcomes, post-build). Consumers: STORE, the learning system.* This is the section that makes Velpi a *self-improving* agency — it binds each directive to what actually happened.

| Field | Type | R | Description | Example | Prod | Consumers | Mem | Learn |
|---|---|---|---|---|---|---|---|---|
| `inputs_hash` | string | ✓ | Hash of the CIL inputs (repro/dedupe). | `"in_5c1…"` | SYS | STORE | G | F |
| `feature_vector_ref` | string | ○ | Pointer to the derived feature set (niche, tier, archetype, DNA). | `"fv_amrit_v1"` | SYS | STORE | G | F |
| `model_versions` | object | ✓ | Which model produced each stage. | `{understand:"claude-sonnet-4-5",…}` | SYS | STORE | G | F |
| `outcome.build_critique_score` | pct | ○ | Post-build HTML critique score. | `92` | OUT | STORE | G | L |
| `outcome.directive_adherence` | pct | ○ | How faithfully Build executed the CDO. | `95` | OUT | STORE | G | L |
| `outcome.user_edits` | object | ○ | `{count, categories[]}` of post-gen edits. | `{count:2,categories:["hero"]}` | OUT | STORE | G | L |
| `outcome.exported` | bool | ○ | Did the operator export/ship it? | `true` | OUT | STORE | G | L |
| `outcome.won` | bool | ○ | Did it win the client (if tracked)? | `null` | OUT | STORE | G | L |
| `distillation_eligible` | bool | ○ | High enough to distill into a library style? | `true` | OUT | STORE | G | L |
| `distilled_style_id` | string | ○ | If distilled, the new library id created. | `null` | OUT | STORE | G | F |
| `experiment` | object | ○ | A/B metadata `{arm, cohort}`. | `{arm:"A",cohort:"jul26"}` | SYS | STORE | G | L |
| `notes` | string | ○ | Human learning notes. | `""` | OUT | STORE | G | R |
| `ext` | object | ○ | — | `{}` | — | — | — | — |

---

## 26. CROSS-CUTTING DESIGN NOTES

### 26.1 Producer → Consumer matrix (at a glance)
- **UE** writes §1,2(observed),3,4 → feeds **SE** and copy/imagery.
- **SE** writes §2(intended),4,5,6,14 → the governing dials.
- **DEF** seeds §8–16 parameters deterministically from §6 dials → **PE** overrides.
- **PE** writes §7–16 → **BLD** executes, **CRIT** checks.
- **RR** writes §23, contributes §12/§18 signatures.
- **SY** writes §6(thesis),17,18,20 and reconciles §7–16.
- **DC** writes §19,21,24.
- **OUT** writes §25 outcomes after the build + user actions.
- **BLD** consumes §6–17,22,23; **CP** consumes §2(voice),5,14; **IMG** consumes §9,13; **CRIT** consumes §16,17,21,22,24.

### 26.2 Persistence tiers, concretely
- **Project (`P`)** → stored in `projects.data.directive` (the full CDO travels with the build).
- **Global (`G`)** → also written to `creative_directives` + a future `design_dna` index; these fields (§18 DNA, §25 learning, category/tier/archetype, key insights) are what the system generalizes from.
- **Ephemeral (`—`)** → derivable; not required to persist beyond the row.

### 26.3 Learning taxonomy, concretely
- **Features (`F`)** = the conditioning inputs (niche, tier, archetype, emotional goals, DNA, chosen references, philosophy parameters).
- **Labels (`L`)** = outcomes (directive validation score, post-build critique, adherence, user edits, export/won).
- **Reasoning (`R`)** = narrative kept for distillation/explainability, not direct optimization.
- The learner's core question: *"given these Features, which philosophy parameter sets historically produced the best Labels for this niche/tier?"* → tunes `defaults.js`, ranks references, and seeds new library styles.

### 26.4 Aliases & queryability without duplication
Some concepts (e.g., `spacing`) live inside a parent philosophy (`layout_philosophy.parameters.spacing`) but are queried independently. Rule: **store once, alias by path.** A `field_index` (maintained in `schema.js`, not in the CDO) maps canonical query names (`spacing`, `grid`, `voice`) to their JSON path. Never duplicate a value into two fields — duplication breaks learning and invites drift.

### 26.5 Versioning & migration policy
- `schemaVersion` starts at `1`. Additive changes do **not** bump it. A structural change bumps it and adds a `migrations.js` upgrader `v(n-1)→v(n)` that is pure and lossless (tombstones preserved).
- `since` on a field records its introduction version; consumers gate new-field logic on `schemaVersion >= since`.
- `dna_version` versions §18 independently, because the DNA/embedding format will evolve faster than the whole schema.
- **Deprecation:** set `deprecated:true`, `deprecatedSince:<v>`, optional `supersededBy:"<path>"`. Readers keep honoring the old field until a major version explicitly drops reader support (documented in `minReaderVersion`).

### 26.6 Why this stays stable for years
Every future capability maps to one of the four extension mechanisms rather than a breaking change: a **new decision** → a new `Decision<T>` node; a **new vocabulary value** → an open-enum string; a **new experimental datum** → `ext`/`x_*`; a **new philosophy** → a new namespace + one renderer line + one `field_index` entry. The 25 domains above are namespaces, not a closed set — a 26th (e.g., `sound_philosophy`, `localization_philosophy`, `personalization_philosophy`) slots in without touching any existing field.

---

## 27. MINIMAL WORKED EXAMPLE (abbreviated CDO, illustrative)

```json
{
  "schemaVersion": 1, "minReaderVersion": 1,
  "id": "cdo_7f3a…", "businessName": "Amrit Palace", "createdAt": "2026-07-07T…", "mode": "execute", "partial": false,
  "business_understanding": { "true_offering": "a candlelit special-occasion experience", "category": "fine dining restaurant", "maturity": "established", "differentiators": ["30-yr chef","private candlelit room"], "proof_assets": ["4.8★ Google"], "confidence": 0.86 },
  "creative_direction": {
    "creative_thesis": "A candlelit love letter to a 30-year kitchen.",
    "premium_level": { "value":"luxury", "parameters":{"tier":"luxury","score_0_100":88}, "rationale":"…", "confidence":0.85, "source":"model" },
    "brand_archetype": { "value":"Lover", "parameters":{"primary":"Lover","secondary":"Sage"}, "rationale":"…", "confidence":0.8, "source":"model" },
    "the_gamble": { "value":"near-black room-lit hero", "parameters":{"risk":"medium"}, "rationale":"occasion over appetite-red cliché", "confidence":0.78, "source":"model" }
  },
  "typography_philosophy": { "value":"editorial serif authority", "parameters": { "display_family":"Cormorant Garamond","body_family":"Inter","scale_ratio":1.333,"hero_clamp":"clamp(2.6rem,9vw,6.5rem)","body_px":17,"weights":{"display":600,"body":400} }, "rationale":"serif heritage + sans clarity", "confidence":0.9, "source":"model", "locked":true },
  "color_philosophy": { "value":"warm monochrome + ember accent", "parameters": { "source_palette":["#7a1f2b","#f5ead6","#1c1a17"], "role_map":{"page_bg":"#f5ead6","ink":"#1c1a17","cta":"#7a1f2b","accent":"#c9a26a"}, "restraint_rule":"one accent only" }, "confidence":0.88, "source":"hybrid", "locked":true },
  "signature_moment": { "name":"The Candlelit Threshold", "description":"full-bleed dark room hero with a single warm glow behind the headline", "location":"hero", "execution_notes":"scrim 55%, headline bottom-left, halo motion behind", "must_survive_mobile":true, "critique_gate":true, "confidence":0.87 },
  "design_dna": { "dna_version":1, "descriptors":["editorial","warm","candlelit","restrained"], "tier":"luxury", "archetype":"Lover", "palette_signature":["#7a1f2b","#f5ead6","#c9a26a"], "type_signature":"CormorantGaramond/Inter", "layout_signature":"asymmetric-editorial", "motion_signature":"spotlight-halo:subtle", "hash":"dna_9f2…" },
  "constraints": { "platform": {"scoping":".velpi-page","fonts":"@import","no_js":true,"no_fixed":true,"viewport_meta":true,"image_tokens":"%%IMG:id%%"}, "palette_lock":["#7a1f2b","#f5ead6","#c9a26a"], "a11y_floors":{"contrast":"WCAG AA","body_px":16,"tap":44}, "motion_limit":{"max_ambient":1,"reduced_motion":true} },
  "references": { "style_ids":["refero_amrit_palace","builtin_editorial_warm"], "style_fusion_note":"amrit menu list + warm-editorial hero", "motion_id":"spotlight-halo", "resolution_method":"directive" },
  "validation": { "passed":true, "score":91, "issues":[], "coherence_check":{"consistent":true,"conflicts":[]}, "constraint_safety":{"a11y_floor_ok":true,"mobile_ok":true}, "revised_count":1 },
  "confidence": { "overall":0.84, "by_section":{"typography_philosophy":0.9,"customer_psychology":0.7}, "fallback_triggered":[] },
  "learning": { "inputs_hash":"in_5c1…", "model_versions":{"decide":"claude-sonnet-4-5"}, "outcome":{ "build_critique_score":null, "directive_adherence":null, "user_edits":null, "exported":null }, "distillation_eligible":null }
}
```

---

*End of CDO schema specification. This document defines the contract; the CIL spec (`CREATIVE_INTELLIGENCE_LAYER.md`) defines the modules that fill it; `ARCHITECTURE.md` defines the pipeline it plugs into. Change this schema only by the Stability Contract (§0.2).*
