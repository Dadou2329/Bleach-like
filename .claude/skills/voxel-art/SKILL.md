---
name: voxel-art
description: Use for ALL voxel art work in the REISHI Bleach fan game (Three.js destructible voxel brawler). Trigger whenever you create, generate, modify or review voxel models or their screenshots - characters and their forms/costumes, Hollows/Menos/Arrancar, weapons and Zanpakutō, Hollow/Visored masks, buildings and map generators, props, terrain and nature, materials/palettes, and VFX (reiatsu auras, Getsuga/Cero/Kidō, debris, dissolves). Encodes the project's voxel scales (world 8 vox/m, props 16-24, characters 48, giants 4-8), palette discipline, pixel-art faces, connected hair clumps, damage-friendly construction, the build workflow and the screenshot review rubric.
---

# Voxel art for REISHI

**Purpose.** Make every voxel asset in this game read as *high-quality voxel art* (not Minecraft, not noise),
stay faithful to Bleach canon, survive the destruction engine, and pass a screenshot critique before it ships.
The research behind these rules: `PLAN.md` §5.1, §8, §9, §16.1, §19.1 (decisions D2, D2b, D14, D15) and
`docs/research/lookdev/README.md` (real render experiments). Canon facts come from `docs/roster/*.md` (characters)
and `docs/lore/locations.md` (places, materials, collapse recipes) - never invent canon; mark guesses `(verify)`.

## 1. Non-negotiable rules

**Scales (decision D2 - do not re-litigate).** Generators work in metres and rasterise at the class density.

| Class | Density | Voxel | Notes |
|---|---|---|---|
| World (terrain, buildings, rubble) | **8 vox/m** | 0.125 m | 0.25 m looked like Minecraft (look-dev 01 vs 02). Chunk = 32³ = 4 m. |
| Props (poles, vending machines, cars, lanterns) | **16-24 vox/m** | 6.25-4.2 cm | 16 for big props, 24 for hand-scale props and legible signs. |
| Characters & held weapons | **48 vox/m** | 2.08 cm | 174 cm → 84 vox; head ≈ 12-13 vox. At 32/m eyes vanished (look-dev 04). |
| Giants (Menos, Bankai giants, Ira Yammy, Gerard) | **4-8 vox/m** | 25-12.5 cm | Pick the coarsest density that still gives the head ≥ 12 vox; mask/hands may use exactly 2×. |

- Convert canon heights with `vox = round(cm × 0.48)`. Dossiers give voxels at 32/m: **multiply by 1.5**.
- Mixed densities inside one object only at **integer ratios (2×, 3×)** so grids align; never stretch a model
  non-uniformly; snap props to the 0.125 m world grid.

**Construction.**
1. **Silhouette first.** Identity must survive as a flat black shape ~80 px tall (20 m). Fix shape before colour.
2. **No floating voxels.** Every part is one **6-connected** (face-connected) component; edge/corner-only
   contacts count as floating. Hair is built from **connected clumps** (no 1-voxel spikes) - look-dev 04 failure.
3. **Faces, emblems, kanji and numbers are authored as voxel-space pixel art** on a flat face plate / panel,
   never rasterised from tiny metric shapes (D2b). Templates: `references/characters.md`.
4. **Minimum thickness:** 2 voxels for anything structural or that must survive a hit; 1-voxel lines only as
   accents attached flat to a solid surface.
5. **World assets are built like real structures** (slabs, walls, columns, beams, footings) so the structural
   search and collapses look right; walls ≥ 2 world voxels thick. Recipes: `references/architecture.md`.
6. **Rigid-part characters hide their joints:** overlap spheres at pivots, sleeves over elbows, hakama over knees,
   no coplanar overlapping faces (z-fighting).

**Colour.**
7. **Palette discipline:** colours come in ramps of 3-6 hue-shifted shades; ≤ ~24 colours per character body +
   outfit (each weapon mesh ≤ ~8 more; emissive VFX excluded), ≤ ~12 per prop. Hex values start from the
   dossier/locations palettes (`references/color-and-palettes.md` has the library).
8. **Never pure black `#000000` or pure white `#FFFFFF` in albedo.** Darkest accent ≈ `#15151A`, black cloth
   base ≈ `#24232B` (a `#15151A` robe rendered as a formless blob in look-dev 04), whitest ≈ `#F3F3F0`.
9. **No noise soup.** Per-voxel variation is the shader's job (hash shade selection, PLAN §5.5); models and
   generators paint *structured* variation only. No strong per-voxel grid lines (D15).
10. **Render pipeline assumptions:** Neutral (default) or ACES tone mapping + per-map LUT - **never AgX** (D14,
    it washed out the anime palette); bloom threshold 1.0 on HDR buffers, so only emissive VFX glow.

**Canon.** The dossier is the source of truth for silhouette, palette, outfit per era, weapon and asymmetries.
Manga/anime colour variants are chosen per model and kept consistent; open questions stay marked `(verify)`.

## 2. Workflow (follow in order; do not skip the screenshots)

0. **Reference.** Read the dossier entry (`Body`, `Palette`, `Look by form/outfit`, `Weapons`, `Forms & states`)
   or the `locations.md` section, plus the matching row of `references/bleach-style-guide.md`.
1. **Write a model brief** (top-of-file comment or PR note): source + section, height cm → voxels, head voxels,
   3-5 silhouette keys, must-have details, palette ramps (hex), canon asymmetries (character's left/right),
   parts/sockets/spring chains, forms and outfit states, `(verify)` items.
2. **Block-out silhouette.** SDF primitives in metres → rasterise; 1-2 flat colours; correct height, head ratio
   and big shapes (hair mass, weapon, coat/hakama flare). Exaggerate key shapes 10-30 %.
3. **Screenshot:** front, back, side, ¾, flat-black silhouette at 20 m, lineup next to the Ichigo reference.
   Do not continue until the silhouette passes rubric section A.
4. **Form pass.** Secondary shapes: hair clumps, 3-5 big folds per garment piece, hakama pleats/flare, sleeves,
   joint overlaps, mask volume, weapon cross-section. Re-shoot.
5. **Colour pass.** Apply ramps, hue-shifted form shading (lit tops, darker undersides and creases), accent
   lines, face pixel art from a template; count colours. Re-shoot under the lighting presets.
6. **Detail pass.** Emblems and kanji, hems (hishigata), straps, stitching, wear - only where the detail
   hierarchy allows (face/hands/weapon > chest/costume > legs/back).
7. **Lint + turntable.** Run the model lint (connectivity, floating voxels, thin features, palette size,
   bounds vs height, symmetry diff, triangle budget) and render the contact sheet: 6 views + face close-up (2 m)
   + gameplay distance (20 m) + action poses, under `studio`, `karakura_afternoon`, `seireitei_noon`, `hm_night`.
8. **Critique against the rubric** (§4 below, full version `references/review-checklist.md`). Write findings
   as `blocker / major / minor` with the fix. Be harsh; compare to the brief's must-haves.
9. **Iterate:** fix blockers, then majors; re-render only what changed; stop when no blocker/major remains
   (list accepted minors in the brief).
10. **In-game scale check:** place it in a real scene (Karakura street: 2.1 m doors = 17 world vox, 11-12 m
    utility poles) beside 2-3 existing characters; check density, scale, colour harmony and readability with
    VFX on, from the actual gameplay camera.

World assets follow the same loop with these substitutions: block-out = massing + structural members; form pass =
facade modules / terrain shapes; extra step = **collapse test** in the destruction playground (diagonal `cut`,
column removal, Cero `bore`, fire) - see `references/architecture.md`.

**Tooling** (check what exists first: `ls .claude/skills/voxel-art/scripts src/models src/dev tools/shots`):
planned `scripts/render-model.mjs` (turntable contact sheet), `scripts/render-scene.mjs` (map/prop/VFX captures),
`scripts/check-model.mjs` (lint) and the `src/dev` model viewer (PLAN §16.1, §16.5). Until they exist, render with a
Playwright page derived from `docs/research/lookdev/voxel-lookdev.html` (headless Chromium flags
`--use-angle=swiftshader --enable-unsafe-swiftshader`, ~1 fps - fine for stills) and write the lint as a vitest
test over the `VoxelModel`. Keep screenshots in the scratchpad or `/shots/` (gitignored); curate keepers into
`docs/`. Read PNGs back with the image reader and critique them - never assume a render looks right.

## 3. Reference files (read the ones your task touches)

| File | Read when |
|---|---|
| `references/fundamentals.md` | Always for a new asset type: silhouette, screen-size math (20 m vs 2 m), detail hierarchy, noise budget, stepping/AA tricks, symmetry, layering, AO/bloom readability. |
| `references/color-and-palettes.md` | Picking or reviewing colours: ramps, hue shifting, saturation, hash shade selection, emissive/bloom, tone mapping, **material palette library** (world, cloth, skin, hair of the cast). |
| `references/characters.md` | Any humanoid or creature: proportions at 48/m, face pixel-art templates & marks, hair clumps, clothing shells & folds, joints/part splitting/spring chains, weapons, forms & costume layers, Hollows. |
| `references/bleach-style-guide.md` | Anything Bleach-specific: shihakushō, captain haori & numerals, lieutenant badges, Onmitsukidō, Arrancar, Visored masks, Hollow masks, Menos, Quincy/Vandenreich, Fullbring; **reiatsu colour table**; **must-have features of ~35 characters**. |
| `references/architecture.md` | Buildings and map structures: real-structure members, 0.125 m detailing, Karakura, Seireitei, Rukongai, Las Noches, Wandenreich, interiors, per-structure collapse recipes. |
| `references/terrain-and-nature.md` | Terrain strata, cliffs, erosion, rocks, dunes/ripples, trees, quartz trees, grass scattering, water. |
| `references/props.md` | Props at 16-24 vox/m: vending machines, poles & wires, lights, signs with pixel kanji, cars, bikes, lanterns, Seireitei and Urahara Shop items; destruction behaviour. |
| `references/vfx.md` | Effects: voxel-native vs smooth energy, readability, colour/bloom intensities, aura design, Getsuga/Cero/Kidō looks, screen effects. |
| `references/procedural-techniques.md` | Writing generators: SDF formulas, noise, shape grammars, WFC/mazes, Poisson-disc, space colonisation, Voronoi fracture, thin-feature rasterisation. |
| `references/review-checklist.md` | Every critique: full pass/fail rubric with common fixes and a report template. |
| `references/dsl.md` | API of `src/models` (added with the DSL by the engine author). Read before writing model code once it exists. |

## 4. Review rubric (condensed - details and fixes in `references/review-checklist.md`)

| # | Check | Pass condition |
|---|---|---|
| A1 | Silhouette at 20 m | Flat-black shape ~80 px tall (720p, 42° FOV) is nameable in a lineup; ≥ 2 dossier silhouette keys visible front and ¾. |
| A2 | Colour blocks | Image downsampled 8× still identifies the asset by its 2-3 dominant colour masses. |
| B1 | Face at 2 m | Eyes (lid line, iris, highlight), brows and mouth read; expression and signature marks match the dossier. |
| C1 | Proportions | Height = round(cm × 0.48) ± 1; head 1/6.5-1/7 (adults); limbs per `characters.md` tables. |
| C2 | Scale consistency | Correct class density; lineup heights match canon ratios; props/buildings sized to doors and characters. |
| D1 | Palette | ≤ ~24 colours/character in 3-6-shade hue-shifted ramps; no `#000`/`#FFF`; dossier hues within a small ΔE or justified. |
| D2 | Black & white | Black garments show lit/base/shade folds; whites keep form and do not bloom in `seireitei_noon`. |
| E1 | Integrity | 0 floating components (6-connected), no unsupported 1-voxel spikes, no holes/see-through gaps, no z-fighting. |
| E2 | Joints | No gaps in the 6 test poses (T, A, lunge, overhead swing, high kick, crouch). |
| E3 | Symmetry | Symmetry diff lists only canon asymmetries (character's left/right as in the brief). |
| F1 | Noise | No noise soup: any 8×8 patch of one material shows ≤ 3 painted shades; variation is structured. |
| F2 | Detail hierarchy | Fine detail (< 3 vox) only on face, hands, weapon, emblems; calm areas left calm. |
| G1 | Lighting | Reads in `karakura_afternoon`, `seireitei_noon` and `hm_night` (rim-lit silhouette, no lost black, no glowing white); AO does not crush eyes. |
| H1 | Rig readiness | Named parts, pivots on joint centres, sockets (`hand.R/L`, `back`, `hip.L`, `head`), spring chains, forms share the skeleton. |
| I1 | Budget | Within the triangle/voxel budget (proposal: fighter ≤ 40k tris incl. weapon, T1 Hollow ≤ 15k, prop ≤ 4k). |
| J1 | Canon | Every must-have from the style-guide table and dossier is present; `(verify)` items listed. |
| K1 | World/VFX | Buildings collapse believably; terrain has strata; props scaled to world; VFX readable, correctly bloomed, on-palette. |

## 5. Quick numbers

- 48/m: 1 vox = 2.08 cm · 174 cm → 84 · 157 cm → 75 · 144 cm → 69 · 133 cm → 64 · 202 cm → 97 · 288 cm → 138.
- World 8/m: door 2.0-2.2 m = 16-18 vox · floor-to-floor 2.8-3.0 m = 22-24 · wall 25 cm = 2 · a 1.74 m
  character ≈ 14 world voxels tall.
- Screen (42° vertical FOV, 720p; ×1.5 at 1080p): px/m ≈ 938 / distance. At 20 m a character voxel ≈ 1 px,
  a world voxel ≈ 6 px, the whole character ≈ 80 px; at 2 m a character voxel ≈ 10 px and the head ≈ 120 px.
  Replace 42° with the game camera's FOV once it exists.
- Bloom: emissive core ×4-8, body ×1.5-3, rim ×1.1-1.5 (linear HDR); albedo never blooms.
