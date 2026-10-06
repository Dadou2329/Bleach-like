# Colour & palettes

Colour is where voxel art is won or lost. This file covers the rules, how colour flows through our renderer, and
a **material palette library** to start from. Canon colours come from `docs/roster/*.md` (character palettes,
hex *estimates*; `(verify)` = check reference art) and `docs/lore/locations.md` (§3 shared material library,
per-map palettes). Values marked † below are hue-shifted extensions generated in OKLab around the documented
values (procedure in §7) - adjust them by eye in renders, keep the documented ones unless a review says otherwise.

---

## 1. Rules

### 1.1 Ramps
- Every hue lives in a **ramp of 3-6 shades** ordered dark → light. Typical: `deep · shade · base · light ·
  highlight`. Small accents may use 2-3 shades; big readable materials (cloth, hair, skin, walls) 4-5.
- **Form ramps** (characters, props: painted shading) step ≈ 0.07-0.10 in OKLab L per shade.
  **Variation ramps** (world/prop materials: picked per voxel by the shader) step ≈ 0.02-0.05 per shade around
  the base. The material's accent colour handles mortar, grout, seams and flecks (§3.1).
- Share shades across ramps to save colours: lash line = darkest cloth shade, sclera = lightest white,
  mouth line = skin deep, teeth = bone/white highlight.

### 1.2 Hue-shifted shading
Pure lightness ramps look grey and dead. Shift hue along the ramp, moderately (the engine already lights the
voxels - ramps are albedo, not baked lighting, so ≤ ~15-20° across the whole ramp):

| Hue family (OKLCh hue) | Shadows move toward | Highlights move toward |
|---|---|---|
| Reds, oranges, yellows (≈ 15-120°) | red / crimson (lower hue), never toward olive green | yellow, lose 10-15 % chroma |
| Greens (≈ 120-200°) | teal / blue-green | yellow-green |
| Blues (≈ 200-290°) | violet | cyan |
| Magentas, pinks (≈ 290-15°) | violet | pink-orange |
| Near-neutrals (chroma < 0.035: whites, greys, blacks, plaster, stone, sand) | slight blue-violet tint (do not rotate) | slight warm tint |

Gold is the classic trap: shading gold toward olive (`#84871A`) looks sick; shade it toward orange-brown
(`#C2901A`, `#AB7416`).

### 1.3 Saturation
- Large areas low-to-mid saturation (walls, ground, big garments); accents higher (sashes, eyes, emblems, hair,
  linings); energy/VFX highest. Environments slightly less saturated than characters so fighters pop.
- Keep chroma in the dark mid-steps, reduce it at the very darkest and the lightest steps.
- Avoid saturated darks over large areas (muddy or neon). Two saturated hues of similar value side by side
  vibrate - separate them by a value step or a neutral.

### 1.4 Value structure
- Key masses must differ by ≥ 0.15 L (face vs hair, haori vs kosode, mask vs body) so the asset reads in
  greyscale. Check with a desaturated screenshot.
- **Never `#000000` or `#FFFFFF` in albedo.** Pure black kills AO and lighting cues (reads as a hole); pure
  white blooms and clips. Limits: darkest accents ≈ `#141418`-`#15151A` (pupils, lash lines, deepest creases;
  only Hollow-hole interiors, voids and ink states go down to `#050507`-`#060609`), lightest ≈ `#F3F3F0`.
  Emissive cores may be white - they are light, not surface.

### 1.5 Black and white garments (the Bleach problem)
The cast is dressed in black shihakushō and white haori/uniforms. A single near-black colour renders as a
formless blob (look-dev 04 robe `#15151A`). Use full ramps and paint folds:

| Ramp | deep | shade | **base** | lit | highlight | Use |
|---|---|---|---|---|---|---|
| Shihakushō black | - | `#141418` | **`#24232B`** | `#3A3944` | `#4B4A57`† | shade in fold valleys/undersides, lit on ridges/shoulders, highlight 1-voxel rims only |
| Cloth white (haori, Arrancar, Quincy, juban, tabi) | `#9FA5B2`† | `#C6CAD2` / `#D8D5CE` | **`#EEEDE8`**† | `#F3F3F0` | - | cool shade in deep folds/inside sleeves; warm shade `#D8D5CE` in shallow folds |

Dossiers that list black cloth as `#16161A`/`#141416` describe the shadow; map it to this ramp's shade step
(source: Ichigo's dossier `#3A3944 / #24232B / #141418`; whites from Hollow Ichigo `#F1F0EC / #CFCDC8`, Arrancar
`#F4F3EF / #D8D5CE`, Grimmjow cool shade `#CDD3DB`, Uryū `#C6CAD2`).

### 1.6 Palette budget
- Character body + outfit: **≤ ~24 colours** in ramps; each held weapon mesh ≤ ~8 more; emissive VFX excluded.
- Prop ≤ ~12. Building ≤ ~8 materials (each with its ramp). Hollow T1-T2 ≤ ~16.
- A lint should count unique palette indices per part and list near-duplicates (ΔE_OK < 0.02 → merge).

---

## 2. How colour flows through our renderer

**The engine source wins over this file.** `src/voxel/materials.ts` (material table, flags, patterns),
`src/render/palette.ts` (palette textures), `src/render/voxelMaterial.ts` (voxel shader) and
`src/render/renderer.ts` (lights, post stack) define what actually renders. Values quoted here are as of writing:
re-read those files when in doubt, and fix this file when they disagree.

1. Author sRGB hex ramps (dark → light); three.js `Color` converts them to linear.
2. **World and props:** each voxel stores only a material id (`MaterialTable`, ≤ 255, id 0 = air; maps register
   extra materials after the base library `createBaseMaterials()`). `buildPaletteTextures()` resamples every
   ramp to **6 shades** (rows 0-5) plus **1 accent** (row 6) in a 256 × 7 texture, and packs pattern id,
   roughness, metalness and glow into a 256 × 1 params texture. The shader finds the voxel cell behind each
   fragment and picks a shade by hash and **pattern** (§3). Fragments, and props built from world materials,
   use the same shader in object mode, so a broken-off piece keeps its colours. "Painted" variation in the world
   therefore means *another material* (grime band, sun-bleached top, moss): budget those against the 255 slots.
   **Models (characters, held weapons):** each voxel stores an index into the model's own palette, painted by the
   model DSL and drawn by the character shader (§3.5, `dsl.md`).
3. Lighting (`ATMO_DAY` today): sun `#FFF1DC` ×3.1 with PCF shadows, hemisphere sky `#CFE2FF` / ground `#6E604E`
   ×1.15, fog `#B9D2EA` 70-330 m → in-shader vertex AO, edge darkening and top bias (§3.1) → N8AO (radius 1.4,
   intensity 2.2, half resolution).
4. Bloom (`luminanceThreshold` 0.92, smoothing 0.18, intensity 1.1, mipmap blur, on the HalfFloat HDR buffer) →
   tone mapping (**ACES** in the engine; PLAN allows Neutral or ACES, never AgX) → grade (`ATMO_DAY`: saturation
   +0.12, contrast +0.06; PLAN: per-map LUT) → vignette → chromatic aberration (hit pulses) → SMAA.
5. Judge colour **only in the final render** under the review presets. Hex swatches lie, and the grade adds
   saturation, so do not pre-saturate albedo.

## 3. Per-voxel shade selection (world and prop materials)

### 3.1 What the engine does (`vxAlbedo` in `src/render/voxelMaterial.ts`)

- **Resampling:** `colors` (2-6 sRGB hex, dark → light; 1 also works) are spread linearly, in linear light, over
  6 shades. With **6 entries, shade *i* = entry *i***. With fewer, in-between shades are blends and the middle
  of the list lands on shades 2-3. One entry = 6 identical shades = a flat colour.
- **Accent** (row 6): mortar, grout, plank seams, siding lines, tatami borders, stone/wood flecks, bright grass
  tips. Default = shade 0 × 0.8; set it explicitly whenever the pattern uses it.
- **Every material** also gets: vertex AO `mix(0.42, 1, (ao/3)^1.25)` ≈ `[0.42, 0.57, 0.77, 1.0]`; −7 % edge
  darkening in the outer 10 % of each voxel face (the faint cell grid of D15); tops ×1.05, bottoms ×0.95; a
  global `uTint` multiply.
- **Flags:** `F_EMISSIVE` adds *shade (linear) × `glow`* on top of lighting (`glow` 0-8, stored in 1/32 steps).
  `F_TRANSPARENT` draws at opacity 0.62 without depth write. `F_FOLIAGE` casts no AO. Roughness defaults to 0.9,
  metalness to 0.
- **Patterns** work in voxel units on axis-aligned faces. They scale with the density (in object mode, the prop's
  own voxels) and do not follow a member's direction:

| `pattern` | Shades picked (centre) | Accent | Notes for authors |
|---|---|---|---|
| `none` | 1-4 uniform per voxel | - | The noisiest pattern (no centre weighting): amplitude = the ramp's spread. Base-library values for shades 1-4 span ≈ 0.04-0.05 OKLab L in total (paint, road markings, bone), up to 0.08 for rough dirt. Use 1 entry for a flat colour. |
| `plaster` | 3; ±1 common, ±2 rare; ~11-voxel patches | - | Base on shade 3. |
| `stone` | 1-4 per 3×2×3 "rock", +1 on 20 % of voxels | 7 % flecks | Accent = fleck colour. |
| `brick` | 1-4 per brick, +1 on 15 % | every 2nd row + every 4th column, side faces only (≈ 60 % of the face) | 3 × 1 bricks read as stripes at 8 vox/m. Keep the accent within ≈ 0.1 L of the bricks (as `sekkiseki` does), or use the pattern on props ≥ 16 vox/m. |
| `tile` | 2-4 per tile | grout every 4th row and column, all faces | 0.5 m grid at 8 vox/m. Used for roofs, paving, shōji, Las Noches. |
| `wood` | 1-4 by grain noise | 4 % flecks | Streaks run vertically on side faces and along z on tops, not along the member. |
| `plank` | 1-4 per board | seam every 3rd column in x, tops only | 2-voxel boards + seam, running along z. |
| `grass` | 2; ±1 common, ±2 rare; patches | 10 % tips on tops | The accent is the *light* tip colour. |
| `sand` | 2 ± 1-2 in ripple bands | - | Fixed direction (crests roughly along z), wavelength ≈ 10 voxels. |
| `stripe` | 2-4 | every 3rd row, side faces | Siding, corrugated metal. |
| `tatami` | 2 / 3 alternating by x | borders at x ≡ 0 (mod 16) and z ≡ 0 (mod 8), tops | 2 × 1 m mats on the world grid; align rooms to it. |
| `glass` | 2-3, diagonal sheen bands at 5 (≈ 15 %) | - | Also used for water, ice, quartz, lit windows, reishi crystals. |
| `leaves` | 0-5 clustered | - | Uses the whole ramp. |
| `metal` | 2-4 in brushed streaks | - | Streaks run horizontally on side faces. |
| `scale`, unknown | 2-4 uniform | - | `scale` is declared but not implemented. |

### 3.2 Authoring a material for the engine

1. **`colors` is a variation band, not a form ramp.** It holds only the shades the pattern scatters across one
   flat surface: ΔL ≈ 0.02-0.05 per shade around the base (§1.1 "variation ramps"). Form shading comes from
   lighting and AO, and on models from painting with separate colours (§1.1 "form ramps").
2. **Use 6 entries when the base matters**, and put the base on the pattern's centre shade (table above). Fill
   the outer shades for the rare ±2 picks and the +1 bumps. Fewer entries are fine when exact shades do not
   matter.
3. **Converting a §6 library ramp** (5 entries, base in bold): keep the base, take the next library step as the
   floor, and fill in small OKLab steps. Example, plaster (base `#F0ECE3`, centre shade 3): `['#DCD5C7',
   '#E3DDD0'†, '#E9E4DA'†, '#F0ECE3', '#F2EFE8'†, '#F3F2EE'†]` (L 0.875 → 0.961). The wall then shows mostly
   `#E9E4DA`-`#F2EFE8` (ΔL ≈ 0.03, close to the base library's `seireitei_wall`). Pasting the 5-entry library ramp
   unchanged would centre the wall on `#D0C9BA` (0.11 L darker than the base) and mottle in 0.05-0.06 L steps,
   which looks grey and noisy.
4. **Whites** have little headroom under the `#F3F3F0` cap, so the steps above the base are tiny (≈ 0.01 L). Keep
   the steps below it small too (≤ 0.03 L), or the surface averages darker than its base.
5. **Do not fake variation with extra materials.** It breaks greedy merges (more triangles) and burns the
   255-material budget. Use one material + ramp + pattern per surface type; add materials only for *meaningful*
   regions (grime band, moss, scorch, a strata band).
6. **Do not paint random per-voxel variation in generators.** The shader already varies every voxel; stacking
   the two makes noise soup (`fundamentals.md` §5).
7. **Calm surfaces** (signs, road markings, prop emblems, anything with pixel-art text) need a one-entry ramp or a
   spread ≤ 0.01 L with pattern `none`, so the hash cannot speckle the glyphs.
8. **States** are separate materials reached through `onBurn` / `onFreeze`; the base library has `scorched`,
   `charred`, `ash` and `molten`. Design each state as a ramp, not a single colour. Targets:
   - `charred`: ≈ `#2A2222` → ash `#8C847D`.
   - `molten`: emissive `#FF7A2A`, cooling to `#3A1E12`.
   - `frozen`: blend toward the ice ramp, with a frost rim `#F2FBFF`.
   - `wet`: ×0.7 value, glossier.
   - `bloodied`: `#5C0A12`-`#8E1420`.
   - `inked`: `#050505` with an indigo sheen `#1F1F2A`.
   - `rotted`: Respira grey-brown `#8D8676` → dust.
   - `reishi-glow` (being absorbed): emissive `#7EC8F8`.

### 3.3 Look-dev prototype (history)

`docs/research/lookdev/voxel-lookdev.html` multiplied the lit colour by a per-voxel hash (±7 %) and by 7-voxel
patches (±4 %) instead of picking ramp shades:

```glsl
vec3 cell = floor(p - n * 0.5);   // the voxel behind this fragment (p in voxel units, n = face normal)
diffuse  *= (1.0 + (h13(cell) - 0.5) * 0.14) * (1.0 + (h13(floor(p / 7.0)) - 0.5) * 0.08);
```

The engine keeps the per-fragment `cell` trick, so greedy-merged quads still vary per voxel at no geometry cost.
It replaces the multiply with ramp-shade picking (PLAN §5.5).

### 3.4 Not in the engine yet (request before relying on it)

| Wanted look | Assumed in | Fallback today |
|---|---|---|
| Kawara rows along the roof slope | `architecture.md` | `tile` (flat 0.5 m grid) + 1-voxel course steps in geometry |
| Strata bands / ramp offset by height | `terrain-and-nature.md` §1 | one material per band |
| Quartz facet shading | `terrain-and-nature.md` (quartz trees) | 2-3 quartz materials assigned per facet |
| Sand ripples oriented by map wind | `terrain-and-nature.md` (dunes) | fixed `sand` ripples |
| Grain or brushing along a member | §6.1 ("grain along the member") | accept world-axis grain, or `none` on thin members |
| `scale` pattern | characters, Hollows | painted motif on the model |
| Damage cracks, wetness, heat glow (PLAN §5.5) | destruction, VFX | state materials (`scorched`, `charred`, `molten`), decals |
| Per-material variation amplitude | everywhere | the ramp's spread is the only control |

### 3.5 Models: the DSL palette and the character shader

As of writing (`src/models/builder.ts`, `src/render/charMaterial.ts`; `dsl.md` documents the API once added):

- `ModelBuilder.mat(name, colors, { base, rough, metal, glow, shadeK, dither })` appends a ramp to the model's
  palette (≤ 255 colours per model). **Model ramps are ordered light → dark**, the reverse of
  `MaterialDef.colors` and of the §6 tables, so reverse library ramps when you paste them. `base` is the index of
  the main tone (default: the middle entry).
- An **auto-shade** pass picks each surface voxel's shade from its normal and openness: lit tops, open and
  front-facing voxels go lighter, undersides and creases go darker. A model ramp is therefore a **form ramp**
  (§1.1, ≈ 0.07-0.10 L per step), with `shadeK` scaling the effect. `dither` (default 0.12) jitters the pick by
  hash: keep it low and run the 8×8 test (`fundamentals.md` §5).
- Lock what must not be shaded: `shade: 'flat'` or an explicit index (the `LOCK` flag) for face pixel art,
  emblems, kanji, eyes and seams. Single-colour mats (`brow`, `lid`, `iris`) are flat by construction.
- The character shader multiplies every voxel by ±4 % hash variation and by vertex AO `mix(0.38, 1,
  (ao/3)^1.15)`. It darkens cell edges by 10 % (outer 12 %), and adds a fresnel rim (aura tint), hit flash,
  dissolve and an energy (afterimage) mode. `glow` is an HDR multiplier up to 16.

## 4. Emissive colours and bloom

- PLAN §8.2 sets the bloom threshold at **1.0 luminance** on HDR buffers. The engine currently uses **0.92** with
  0.18 smoothing, so bloom fades in between 0.92 and 1.10. Lit albedo must stay below it; emissive colours are
  specified as `hex × intensity` (linear) and must clear it to glow.
- Estimate for `ATMO_DAY`: the top face of the brightest allowed white (`#F2EFE6`-`#F3F3F0`) in full sun reaches
  ≈ 0.90 linear luminance, just under the threshold. That is why the `#F3F3F0` cap matters; check whites in
  every daylight capture.
- World and prop emissives use `MaterialDef.glow`. Calibrate new ones against the base library: `sign_white`
  0.6, `window_lit` 1.4, `reishi_crystal` 2.0, `lantern` 2.6, `neon_pink`/`neon_cyan` 3.0, `lamp` and `molten`
  4.0, `lava` 5.0.
- Intensity targets per layer of an energy effect:

| Layer | Multiplier | Reads as |
|---|---|---|
| Core | ×4-8 | white-hot centre with a coloured halo (hue mostly lost - fine) |
| Body | ×1.5-3 | the effect's hue, glowing |
| Rim / edge | ×1.1-1.5 | thin coloured outline that just blooms |
| Smoke, dark cores, ash | ≤ 0.3, alpha-blended | shape and contrast, no glow |
| Ambient emissives (signs, lit windows, lanterns, vending panels, quartz edges) | ×0.6-3 (engine values above) | soft glow at night; signs stay readable |
| Creature eye glows, Hollow eyes, emissive crests | ×2-3 | small hot points |

- Look-dev reference: Getsuga test mesh `color(0.55, 0.8, 4.0)` with `toneMapped: false`, bloom
  `luminanceThreshold 1.0, intensity 1.6, radius 0.7, mipmapBlur`, plus a point light `#88AAFF` (6, range 8 m) so
  the effect lights its surroundings. "Energy VFX need much hotter HDR values to bloom."
- Calibrate per map: `hm_night` shows bloom strongly (use the low end); `seireitei_noon` needs the high end.
- Dark energies (Black Getsuga, Cero Oscuras, Kurohitsugi, Mugetsu, Yhwach's Black) cannot glow: alpha-blended
  near-black core (`#050507`-`#0B0B0D`) + additive coloured rim at ×1.5-3. See `vfx.md`.
- Many overlapping additive layers blow out to white: cap particle intensity/alpha.

## 5. Tone mapping and grading

- **The engine currently runs ACES** (`ToneMappingEffect` with `ToneMappingMode.ACES_FILMIC` in
  `src/render/renderer.ts`). PLAN D14 allows Neutral or ACES. Judge palettes under whatever the renderer runs,
  and re-check them if it switches.
- **Neutral** (three `NeutralToneMapping` / postprocessing `ToneMappingMode.NEUTRAL`): keeps base colours close to
  their sRGB values and compresses only highlights.
- **ACES** (`ACESFilmicToneMapping` / `ToneMappingMode.ACES_FILMIC`): more contrast and drama. It desaturates
  bright saturated colours toward white and can skew some hues (strong blues drift toward purple).
- **AgX: never** (D14 - it washed out the anime palette in look-dev 03).
- Per-map grade on top (engine today: `ATMO_DAY` saturation +0.12 and contrast +0.06; PLAN: per-map LUT):
  Karakura afternoon/dusk warm (the "Bleach orange" dusk), Seireitei noon clean and bright, Hueco Mundo night
  cool and contrasty, Las Noches interior uncanny warm-white, Hell red.
- Exposure sanity check: a mid-grey `#777777` card under the map's key light should render close to mid-grey.

---

## 6. Material palette library

Format: ramp dark → light, **base in bold**, † = generated extension. These are design ramps: the base and its
immediate neighbours are the variation band; the other shades are for painted accents, patterns and models.
To register one as an engine `MaterialDef`, convert it (§3.2 rule 3) - do not paste it unchanged; for a model
`mat()`, reverse it to light → dark (§3.5). Where the base
library already has the material (`seireitei_wall`, `sekkiseki`, `hm_sand`, `quartz`, `lasnoches_stone`,
`roof_slate`, …), the engine's ramp is what renders: use this table to review it, and edit that material instead
of adding a duplicate.

### 6.1 Architecture (world, 8 vox/m)
| Material | Ramp | Pattern / notes | Source |
|---|---|---|---|
| Plaster (houses, Seireitei walls) | `#979193`† `#AFA8A2`† `#C8C0B0` `#DCD5C7` **`#F0ECE3`** | plaster mottling; grime `#8C8170` on the bottom 0.5 m; Seireitei walls go peach in dusk light (lighting, not albedo) | locations §3, §7.1 |
| Karakura house walls (mix) | cream `#EFE8D8`, beige `#E3D5B8`, grey `#D7DBDF`, white `#F1EFE8` | each with shades 8-12 % darker; clamp ≤ `#F3F3F0` | §6.1 |
| Stone plinth, steps, stone lanterns | `#88827D`† `#A39C8E` **`#BDB6A8`** `#D2CCBF` `#E8DFCE`† | large brick courses | §3 |
| Sekkiseki (Seireiheki, Shishinrō) | `#A4A1A0`† `#BFBAB0` **`#D9D5CC`** `#ECE9E2` | huge ashlar slabs 20-30 m; `reiatsuBlocking` | §3, §7.2 |
| Kawara roof tiles (Karakura) | `#1F2638`† `#353D49` **`#454E5C`** `#5E6878` `#727A88`† | roof-tile rows along the slope; tiles slide off as debris | §3 |
| Kawara roof tiles (Seireitei) | `#242E3F`† `#39434F` **`#475565`** `#5D6B7B` `#6F7C89`† | ridge caps `#E9E6DE`, eave boards `#2F363F` | §7.1 |
| Roof brown / charcoal / metal | brown `#442922`† **`#5B3F33`** `#695143`†; charcoal `#191F30`† **`#2E3440`** `#3F434D`†; metal `#637187`† **`#7C8A99`** `#909CA8`† | metal roofs: standing seams every 0.5 m | §6.1 |
| Wood light (timber walls, posts) | `#734D30`† `#86643F` **`#9C7752`** `#B38B62` `#BE9F77`† | grain along the member | §3 |
| Wood dark (aged shop timber, verandas) | `#372217`† `#4A3626` **`#5E4632`** `#76593F` `#826B51`† | Urahara Shop timber `#5E4632`→`#76593F` | §3, §6.3 |
| Seireitei timber (columns, engawa, gates) | `#412317`† `#573A27` **`#6E4B33`** `#8A6244` `#977758`† | | §7.1 |
| Karakura timber / doors | `#482E20`† `#5E4632` **`#7A5A3E`** `#946F4E` `#A18463`† | | §6.1 |
| Tatami | `#A0875C`† `#B5A372`† **`#C9C08A`** `#D6D5A6`† `#EDE7BE`† | weave rows along the long side; edge band dark green `#2F3B2E` (design) | §6.2 |
| Paper (shōji, fusuma, posters) | `#A09A98`† `#B7B0A5`† `#CFC6B2` `#E3DCCB` **`#F4EFE3`** | lattice in wood dark; flammable | §3 |
| Thatch (Rukongai) | `#765732`† `#8C7348` **`#A68B5B`** `#BFA474` `#CDBB8E`† | straw streaks down the slope; rotten `#7E6A4A` | §3, §7.7 |
| Concrete / block walls | `#817F7D`† `#9C988E` **`#B4B0A6`** `#CBC7BE` `#E1DACD`† | mottling; block courses 2 vox tall, joints every 3 vox | §3, §6.1 |
| RC concrete (slabs, columns) | `#8B8885`† `#A6A296` **`#C2BEB4`** `#D6D2C9` `#ECE6D9`† | rebar sparks on cut | §3 |
| Asphalt | `#343743`† `#474A4F` **`#55585E`** `#6A6D72` `#7B7B7D`† | fine noise, patches, cracks | §3 |
| Road paint | white `#EDEDEA`; yellow `#D09920`† **`#E2B93B`** `#E8D26C`† | `paint` layer; worn paint = 30-50 % asphalt showing | §6.1 |
| Brick (design) + mortar | brick `#672A2A`† `#814136`† **`#9B5A43`** `#A77055`† `#B38669`†; mortar `#B3ADA9` **`#CFC8BA`** | courses 0.25 × 0.0625 m won't resolve - use 2-vox courses, 4-vox bricks, 1-vox mortar | look-dev 03 |
| Glass | `#667B9B`† `#7997B5`† `#8DB4CF` **`#A9CBE0`** `#CFE4F1` | transparent stream; aluminium frames `#8E9196`; never a flat dark fill | §3 |
| Steel (bridges, railings, fittings) | `#4F5666`† `#6E747D` **`#8A9099`** `#A9AEB5` `#C3C6C9`† | bends rather than crumbles | §3 |
| Gold / bronze / silver trim | gold `#AB7416`† `#C2901A`† **`#D4AF37`** `#DBC767`†; bronze `#794619`† `#8F6029`† **`#A47B3B`** `#AE9158`†; silver `#9197AF`† `#ACB1C1`† **`#C8CCD4`** `#DEDFE4`† | metals = bright edge line + darker flats | dossiers |
| Torii / vermilion lacquer | `#A9112E`† **`#C8352B`** `#D2593A`† | South gate Shuwaimon lacquer, shrine torii | §6.1, §7.2 |
| Las Noches stone | `#9196AE`† `#A9ADBD`† `#C2C5CC` `#D8D8D6` **`#F2F0EB`** | slits `#1A1C22`/`#2A2D35`; floor `#E6E4DF`; fake sky emissive `#7FB6E6` → horizon `#CFE6F5` | §3, §8.3-8.5 |
| Wandenreich stone | `#505A70`† `#6C798F`† `#8C99A8` `#C3CBD5` **`#E9EDF1`** | trim/roofs `#5B6B7E`/`#45525F`; Gate of the Sun `#B8A46A`/`#8F7E4E`; torches `#FFB45A` | §9.1 |
| Soul King Palace stone | `#D3CBBB` **`#ECE6DA`** `#F7F3EA` | ashlar | §3 |

### 6.2 Nature
| Material | Ramp | Notes | Source |
|---|---|---|---|
| Grass | `#427338`† `#628A3A` **`#78A24A`** `#8DB85A` `#ADC672`† | blade tint pattern; burns to soil | §3 |
| Foliage (broadleaf street/park trees) | `#1D5328`† `#3E6B2F` **`#4E7D3A`** `#6E9B4B` `#8FAB62`† | leaf clusters: deep inside, light on top | §6.1 |
| Pine (Seireitei) | `#23502A`† `#3E6531` **`#4F7B3F`** `#62904F` `#7F9E61`† | layered pads | §7.1 |
| Cherry blossom | `#B690A8`† `#D4A8BC`† **`#F3C1D0`** `#FED9E0`† | clusters, petal particles | §6.1 |
| White forest (Sōkyoku Hill) | bark `#EAE7DF`; foliage `#A6A9AD`† `#C9CBC6` **`#F1F1EC`** | | §7.4 |
| Bamboo (Rukongai) | `#8CB255` base | design ramp ±0.08 L, node rings 1 vox darker | §7.7 |
| Soil / dirt | `#533623`† `#654A31` **`#7A5B3E`** `#8E6C4B` `#987D5D`† | dirt paths, crater walls | §3 |
| Ground dust (study chamber) | `#67452E`† `#7E5F41` `#9C7650` **`#B48C60`** `#C9A57A` | 0.5 m over brown rock | §6.7 |
| Rock brown (crags, spires) | `#74523C`† `#8A6B4E` **`#A1805F`** `#B99872` `#C6AD88`† | strata | §3 |
| Rock mesa (Sōkyoku Hill) | `#524C48`† `#6F675B` `#8C8374` **`#A79E8D`** `#BFB7A6` | strata bands, undercut | §3, §7.4 |
| Rock Hueco Mundo | `#6F6F77`† `#8B8A8B`† `#A9A69F` **`#C8C5BE`** `#DEDBD4` | | §3, §8.1 |
| Sand, Hueco Mundo (white) | `#ADB1C3`† `#C3C6CF` `#D9D7D2` **`#EEECE6`** | cool shadows; crest ≤ `#F3F3F0`; ripple pattern; angle of repose 34° | §3, §8.1 |
| Sand, Las Noches interior (daylit) | `#CFCBC2` **`#F2F0EA`** | warm-grey shadows | §8.4 |
| Quartz trees | `#B3BCCE`† `#C6CED8` `#BFD3E6` **`#E4E9EE`** | facets, faint emissive edges ×1.1, inner blue `#BFD3E6` | §3, §8.1 |
| Dead trees | `#312724`† `#4E4237` **`#6B5B4D`** `#83705E`† | | §6.7 |
| Water | `#274E71`† `#3B6E8F` **`#4E86A8`** `#7FB0C9` `#9AC8DA`† | shallows `#6FA3B8`, foam `#E8F1F5` | §3, §6.1 |
| Ice (world crust, Wandenreich) | `#687E9B`† `#81A0BB`† `#9CC3DB` **`#CFE7F3`** | glint `#F2FBFF`; transparent | §3, §9.1 |
| Ice constructs (Hyōrinmaru) | `#30619A`† `#3E84BA`† `#4EA8D9` `#8FD4F2` **`#C9EEFB`** | rim `#F2FBFF` emissive ×1.2; Bankai petals violet `#A89BE3` | B3 Hitsugaya |
| Ice (Sode no Shirayuki) | `#77A5C5`† `#8CC4E0` `#BFE3F2` **`#E6F4FA`** | frost sparkle `#FDFDFD` | A2 Rukia |
| Lava / molten (emissive) | crust `#3A1E12` `#5A1A0A`; glow `#D9361C` **`#FF4E12`** `#FFB347`; white-hot `#FFF4C2` | emissive ×1.5-4 by heat; cooling = slide down the ramp | §3, B1 Yamamoto |
| Hell rock | **`#1C1919`** `#2B2523` `#3A302C` `#463A33`† | | §3 |

### 6.3 Bone, Hollow and void
| Material | Ramp | Notes |
|---|---|---|
| Hollow mask bone | crevice `#3A3631` · `#A99F90` · `#C7C1B4` · **`#F1EDE3`** · `#F5F1E6` | eye holes/mouth interior `#060609`; teeth `#EFE9DE` with gaps `#120D0D` |
| Mask markings | crimson `#9E1B26`, maroon `#4A1A1F`, black `#141416` | Ichigo's mask stripes: anime maroon / colour-page crimson |
| Bone (skeletons, ribcage props, Calavera) | `#B7B0A3`† `#CFC6B0` **`#E8E0CC`** `#F5EFE0` | |
| Hollow hole interior | `#060609` | inner faces of a true hole |
| Menos (Gillian) | cloak `#121216` + sheen `#1E1F2B`; mask `#F1EDE3`; spikes `#F3F1EA`; bandages `#BDB6A8` / `#E6E1D6`; tongue `#5E1A24` | F §B-11 |
| Garganta / void | `#050507` with turbulent reishi `#CFE7FF` | F §B.2 |
| Reishi motes | purification `#CFE7FF`; Quincy annihilation `#9FD8FF`; absorption glow `#7EC8F8` | emissive particles |

### 6.4 Cloth and costume
| Material | Ramp | Notes |
|---|---|---|
| Shihakushō black | `#141418` **`#24232B`** `#3A3944` `#4B4A57`† | §1.5 |
| Cloth white | `#9FA5B2`† `#C6CAD2` `#D8D5CE` **`#EEEDE8`**† `#F3F3F0` | haori, juban collar, obi, tabi, Arrancar/Quincy whites |
| Straw (waraji) | `#8A6A3E` **`#B59C6A`** `#CDB78A` | thongs white `#EFEFEF` or dark `#4E3B28` per dossier |
| Bankai coat lining crimson | `#4E0F14` **`#9E1F27`** `#C0343A` | Ichigo |
| Arrancar sash / boots | sash `#17171B`; boots `#121216` with white lines `#ECECEC` | |
| Quincy blue trim | `#1C3768` `#0A51B4` **`#2B78D0`** | Uryū's Soul Society whites |
| Vandenreich white | crease `#9EA2AA` `#C7C9CF` **`#EEEDE7`**; Hagal rune `#6D111A` | Yhwach, Sternritter |
| Captain haori linings | = division colour (style guide §2.3) | known: Aizen `#AFEEEE`, Tōsen `#CD5700`, Komamura `#918151`, Kyōraku `#B3446C`, Ukitake `#9C1B2B`, Rukia `#6B2218` |

### 6.5 Skin
| Tone | Ramp | Who (dossier) |
|---|---|---|
| Light warm | `#6E413B`† `#8E5F50` `#C08A74` **`#E9BBA0`** `#F7D9C4` | Ichigo (default light skin) |
| Fair | `#8C6B60`† `#AB8B7A` `#D6BDAA` **`#F3E1D2`** | Byakuya, Rukia (`#EED2C4` base), Gin, Unohana |
| Tan | `#663426`† `#85523A`† `#A47250` **`#C8966E`** `#D9B28A`† | Kenpachi, Yammy (`#C99364`), Baraggan (`#C9956F`) |
| Brown | `#512D1F`† `#6E4A34` `#8B6045` **`#C59272`** `#D4AC8E` | Chad |
| Deep brown | `#43251A`† `#5E3F2E` `#885E43` **`#A26F4D`** `#B08C71` | Yoruichi (TYBW); Harribel olive-tan `#B4805A` |
| Dark | `#27110A`† `#3F281C` **`#5B3A29`** `#7A5038` `#89664C`† | Tōsen, Zommari (`#4E3326`), Lille (`#5B3A2B`), Nimaiya (`#5A3A24`) |
| Hollow white | `#9E968E` `#C1BBB3` `#CFCAC2` **`#EAE8DE`** `#F2F0EC` | Hollow Ichigo, Ulquiorra, Full Hollow |
| Accents | blush `#F2B9AE`; lips/mouth = skin deep; teeth `#F3EFE6`; scar = one step redder than shade (Kenpachi `#9E5F52`) | |

### 6.6 Hair and eyes of the main cast
Ramps dark → light, base bold. Sources: each character's dossier palette. Hair needs ≥ 3 tones (shadow, base,
highlight); black hair lives on its sheen.

| Character | Hair ramp | Iris |
|---|---|---|
| Ichigo | `#8F3E13` `#C2591B` `#E8792A` **`#F7962F`** `#FFAD4C` `#FFC867`; brows `#C8661F` | brown `#7A4A2C` |
| Hollow Ichigo | `#C8C8C8` **`#EDEBE6`** | gold `#F7E168` on black sclera `#0B0B0F` |
| Rukia | `#141418` **`#25252E`** `#2E303B` sheen `#888EA1` | violet `#5E5590` (lightened from `#514E69`) |
| Orihime | classic `#B05A26` **`#DE7F36`** `#EBA060`; TYBW `#763F3C` `#B26646` **`#CB764C`** `#D29E7A` | brown `#7A4E36` / anime grey `#6E6E82` |
| Chad | `#2E2422` **`#3F2C2A`** `#784F3F` (TYBW streak `#E9D1BA`) | brown `#6B4A35` (hidden by bangs) |
| Uryū | `#1D2339`† **`#2B3242`** `#354158` `#4B4D58` | steel blue `#607C9A` |
| Urahara | old anime `#8B7F63` `#B6A785` **`#C9B98F`** `#E2D0BD`; TYBW `#8F8574` **`#C5BBA2`** `#CBC2A9` | grey `#6D6D6C` |
| Yoruichi | plum `#281E2A` `#442335` **`#5A2A4E`** `#8E4E86`; TYBW indigo `#27242D` **`#322C3B`** `#4A3E5C` | gold `#D9B035` / `#F2DA7A` |
| Isshin | **`#1F1F23`** `#3C3C46` | `#6A4A34` |
| Yamamoto | brows/beard `#ACA9A9`† `#CFCBC2` **`#F2F0EA`**; beard band `#6B3F8E` | red `#A8261F` (eyes usually shut) |
| Suì-Fēng | **`#1B1C27`** `#3A3F57` | grey `#8D9099` |
| Gin | `#868BA4`† `#A7ACBD` **`#CBD0DA`** `#E6E9EF`† | sky blue `#5EC4F0` (rarely open) |
| Unohana | **`#1D2130`** `#3B4560` | blue `#3E5FA0` |
| Byakuya | `#0F1014`† **`#15161D`** `#22252F`† `#2F3445` `#454C61`† | slate `#6E7480` |
| Aizen | `#3B2516` **`#5B3A24`** `#7D5434` | brown `#5A3A26` |
| Tōsen | braids **`#2A1D17`** (anime alt `#3A2742`) | pupil-less lavender `#CDBDE3` |
| Kyōraku | `#3F1D0B`† **`#5A3920`** `#7A5032` | grey `#8B9096` |
| Hitsugaya | `#7F8EAA`† `#A0AFC4`† `#C3D1DE` **`#F4F6F8`** | turquoise `#2BB7AA` |
| Kenpachi | **`#131315`** `#2B3140`; bells `#D8B23C` | grey `#8B9097` |
| Ukitake | `#ACA8A9`† `#CFCAC2` **`#F1F0EC`**; brows `#1B1B1B` | green `#4E9A63` (anime brown) |
| Renji | `#5A031D`† `#871321` **`#C7202F`** `#E84652` | brown `#6B3B26` |
| Rangiku | anime `#A95723`† `#C97A34` **`#F3A65A`** `#FFD08A`; manga gold `#F2C14E` | blue `#5F8FD1` |
| Hisagi | **`#141418`** `#2C3340` | dark grey `#4B4F57` |
| Kira | `#B49350`† `#CDB66C` **`#EED98E`** `#FFF2C4` | blue `#4C79C2` |
| Yachiru | `#B85289`† `#E06C98` **`#F58FB5`** `#FDB2C3`† | dark pink `#C2275F` |
| Shinji | `#AE7C31`† `#C9A04C` **`#EFD27E`** `#FFF1C2` | brown `#6B4428` |
| Hiyori | `#AF7902`† `#C99E2F` **`#F2D159`** `#FEEF8B`† | brown `#744528` |
| Mashiro | `#4F8F32`† `#7DAE2C` **`#A6D64A`** `#D6F38E` | hazel `#A07D3E` |
| Starrk | `#1F110E`† **`#3A2A1F`** `#5A4232` | blue-grey `#6F8597` |
| Harribel | `#9E6F03`† `#B8932E` **`#E8C24A`** `#F4E07D`† | aqua `#2FB59A` |
| Ulquiorra | **`#0F1012`** `#22262B` `#30353C`† | green `#2E9E4E`, black slit pupils |
| Grimmjow | `#1A70A0`† `#2B93BE` **`#4FC6E8`** `#A4E6F6` | light blue `#6ED3F4` |
| Nelliel | `#247958`† `#4A9A68` **`#6CC08A`** `#A6E0B8` (old anime turquoise `#45C2B8`) | hazel `#A27B3D` |
| Szayelaporro | `#A43E81`† `#CF5A92` **`#F27BB1`** `#FFB0D3` | amber `#DFA03A` |
| Yammy | **`#141414`**; brows orange `#E5772A` | brown `#6A3E1F` |
| Kaien | **`#1C1726`** `#45364A` `#504456` | aqua-green `#5E9C94` |
| Yhwach | **`#141217`** `#2B2731` | red-brown `#7A2A22`; Almighty crimson `#B5121B` ×3 pupils |
| Haschwalth | `#B19356`† `#CBB672` **`#EBD9A0`** `#FFF3C8` | green-blue `#8CC7B4` (verify) |
| Bazz-B | `#64011C`† `#8F1A1F` **`#D42A2F`** `#FF5A4A` | green `#2E9E55` |
| Candice | `#4A9D75`† `#6FBF84` **`#A9E2A0`** `#DDF7CF` | green `#36B86A` |

### 6.7 Energy colours (quick list)
The complete per-character, per-form table with canon flags is in `bleach-style-guide.md` §9 - if the two ever
disagree, the style guide wins. Format: core / body / rim.

| Who / technique | Colours |
|---|---|
| Ichigo reiatsu & Getsuga (manga/TYBW gold) | aura `#FDE671` / `#F6C343`; Getsuga `#FDFFD9` / `#FEF698`→`#F4D761` / `#C6923D` |
| Ichigo Getsuga (classic anime blue) | `#F9FFFF` / `#7DDFFD` / `#2D74D0` |
| Ichigo Black Getsuga, Bankai aura | `#050203` core, `#2A0A12` inner, rim `#8E1F3F`, glow `#C2304F`; aura black + crimson rim `#B3122E` |
| Rukia, Hitsugaya (white/ice) | `#FFFFFF` with cyan fringe `#BFE6F7` / `#D9F3FF` |
| Byakuya petals | anime pink `#F5A9C4`→`#E77FA6` / manga white `#F7F7FA`; Senkei `#FFD7E8` / `#F59AC0` |
| Uryū arrows | `#9AFFFE` / `#59B7EE` / `#0F6BCE`; TYBW `#85F4FA` / `#14C1F3` / `#0554B8` |
| Urahara, Yoruichi reiatsu | red `#FF4D5E` / `#C8102E` / `#6A0A18` |
| Yamamoto fire | `#FFF4C2` → `#FFB23E` → `#FF6A12` → `#C4260B` |
| Aizen | `#B48CFF` / `#7F3FD8` / `#3C1670` |
| Kenpachi | `#FFF2B3` / `#F6C823`, skull `#FFE066` |
| Ulquiorra Cero | `#E8FFE8` / `#46F07A` / `#1FA34A`; Oscuras black + `#2EE06A` rim |
| Grimmjow | reiatsu `#E6FAFF` / `#5CC8FF`; Cero red `#FFD2D6` / `#E31B2E` / `#8C0C18`; Gran Rey Cero `#DDEBFF` / `#2C6BFF` |
| Default Hollow Cero / Bala | crimson `#FFD6D6` / `#E0262B`; Bala `#E0302A` |
| Kidō: Byakurai · Shakkahō · Sōkatsui · Bakudō rods · Kaidō | `#E8F4FF`/`#9CC9FF` · `#FFC9A0`/`#E3262E` · `#CFEFFF`/`#3FA9FF` · `#FFE066` · `#7CE38B` |
| Quincy Blut Vene / Arterie | `#4C9BFF` / `#D5232F` vein webs |
| Bringer Light (Fullbring) | `#DFFFE9` / `#7DFFB0` |

---

## 7. Building a ramp for a new colour

1. Base = the dossier/locations hex (keep it unless a render review proves it unreadable; then note the change).
2. Convert to OKLCh. Form ramps: steps of −0.08…−0.10 L down, +0.06…+0.08 up. Variation ramps: ±0.03-0.05.
3. Shift hue per §1.2 (≤ 10° per step), reduce chroma ~10-15 % per highlight step, keep chroma in dark mids.
   Near-neutrals: add a tiny blue-violet tint to shadows (+a ≈ 0.002, −b ≈ 0.011) and a warm tint to lights.
4. Clamp L to ≈ 0.19 … 0.963 (`#141418` … `#F3F3F0`); clamp to the sRGB gamut by reducing chroma.
5. For an engine material, cut the result down to a 6-entry variation band (§3.2).
6. Render under `studio`, `karakura_afternoon`, `seireitei_noon`, `hm_night`; adjust.

Minimal TypeScript helpers (OKLab, Björn Ottosson):

```ts
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
export function hexToOklab(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => toLin(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
          1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
          0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
export function oklabToHex([L, a, b]: [number, number, number]): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
               -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
               -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  // out-of-gamut values are clamped here; reduce chroma first for accurate hues
  return '#' + rgb.map((c) => Math.round(Math.min(1, Math.max(0, toSrgb(c))) * 255)
    .toString(16).padStart(2, '0')).join('');
}
```

ΔE_OK between two colours = Euclidean distance of their OKLab triples (≈ 0.02 is a just-visible difference).
