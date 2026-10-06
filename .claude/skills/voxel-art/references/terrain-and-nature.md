# Terrain and nature

Terrain is world voxels (0.125 m, 8/m). It is the largest visible surface in every map, so it must be calm,
structured and believable when cratered, sliced and slumped. Biome specs, palettes and scales come from
`docs/lore/locations.md`; colour ramps from `color-and-palettes.md` §6.2; noise/SDF/scattering algorithms from
`procedural-techniques.md`.

---

## 1. Strata - every terrain is a layer cake

Craters and cuts expose the inside of the ground, so the inside must be designed:

| Biome (map) | Stack from the surface down | Notes |
|---|---|---|
| Karakura | paving/asphalt 0.25 m (2 vox) or grass/topsoil → soil 1-2 m (8-16) → gravel → bedrock at −6 m (bottom 1 m indestructible) | flat base sloping 1-2 % to the river; one 20-30 m hill (cemetery, shrine) |
| Urahara's study chamber | ground dust 0.5 m (4) over `rock_brown` strata → bedrock at −8 m | fBm heightfield ±2-6 m + ridged noise crags |
| Seireitei | packed earth / paving over stone; canal tunnels 6-10 m below | mostly flat with ±1-4 m terraces |
| Sōkyoku Hill | `rock_mesa` strata to the top; gravel cap | sheer cliffs 70-90 m, undercut overhang 30-40 m deep |
| Rukongai | grass/dirt over soil over rock | rolling hills amp 5-20 m, rivers, terraced paddies, forests |
| Hueco Mundo desert | **8-20 m of white sand** over uniform `rock_hm` | dunes, mesas 10-40 m, boulders 2-15 m |
| Forest of Menos | dark sand floor `#3A3C42` → rock; ceiling (desert crust underside) 80-110 m up | moonlight shafts and sand falls through cracks |
| Hell | basalt `#1C1919` strata, lava pockets | |

Rules:
- **Bands, not noise:** strata are horizontal-ish bands 0.5-3 m thick (4-24 voxels) with domain-warped boundaries
  (warp amplitude 0.5-2 m); each band its own material (the engine has no ramp-offset-by-height pattern yet,
  `color-and-palettes.md` §3.4). Alternate hard and soft bands so erosion and
  cliffs form ledges.
- Topsoil/grass is a 1-2-voxel skin; crater walls show soil → rock transitions within 1-2 m (look-dev 02's crater
  bowl read well because of this).
- Keep deep interiors uniform (uniform bricks are free) - no noise caves unless designed.
- A thin dirt gradient (one ramp step darker) in the top 1-2 voxels under grass, never per-voxel speckle.

## 2. Heightfields and erosion
- Base: fBm (4-6 octaves, lacunarity 2, gain 0.5) at a wavelength matching the biome (hills 60-200 m; crags
  10-40 m); **ridged noise** `(1 − |n|)²` for crests and crags; **domain warp** for natural, non-grid shapes.
- **Terraces:** quantise height with smoothed steps where strata are hard → ledges; leave soft bands as slopes.
- **Slope-based materials:** grass below ~30°, dirt/scree 30-40°, bare rock above ~40° (tune per biome); sand
  everywhere in Hueco Mundo with rock only on mesas.
- **Thermal erosion** (cheap, region-limited): where slope > talus angle (sand 34°, loose dirt 38-40°, scree 40-45°),
  move material downhill until stable; the same rule drives the runtime sand CA (craters slump to 34°).
- Optional droplet hydraulic erosion for hero mountains; otherwise fake it: smooth valleys, sharpen ridges, darker
  wet/dirt bands in gullies (structured paint).
- Voxel stepping on slopes is natural - avoid regular "staircase" artefacts on long gentle slopes by adding
  low-amplitude (≤ 1 voxel) low-frequency noise to the heightfield.

## 3. Cliffs, mesas and overhangs
- Vertical faces show strata bands clearly; add **vertical fractures** from Worley F2−F1 as 1-voxel recesses
  (AO draws them), spaced 2-6 m.
- **Overhangs and undercuts** need 3D shapes (SDF subtract or 3D noise) - heightfields cannot overhang. Sōkyoku
  Hill's undercut end holds the halberd; overhangs break off as large rock fragments when undercut further.
- **Talus** at the foot: rubble piles at 35-40° using the rock ramp's darker shades.
- Cliff tops get a 1-voxel lip of the top material (grass/gravel) and a lighter sun-bleached top ramp step.
- Mesas (Hueco Mundo, Sōkyoku): flat tops, strata, slightly flared bases; zigzag stairs carved into the cliff
  (3 m wide, 8-12 switchbacks) where canon has them.

## 4. Rocks and outcrops
- Shape: noise-displaced ellipsoids/round boxes (displacement 10-20 % of size, low frequency) + **faceting** by
  subtracting 3-6 random half-spaces (crisp planes read as rock, blobs read as dough).
- Embed 20-40 % below the ground; cluster in groups (one big + 2-4 small) placed by Poisson-disc
  (`procedural-techniques.md` §8), 60-120 m apart in deserts, denser in crags.
- Colour: rock ramp; top faces one step lighter (sun), bottom 0.3 m one step darker (dirt/moisture); moss (grass ramp
  shade) on tops and north faces in Karakura/Rukongai only; never per-voxel speckle.
- Sizes: Karakura garden rocks 0.5-2 m; study chamber spires 10-35 m (stacked noisy cylinders/mesas, bases 6-20 m,
  overhangs); Hueco Mundo boulders 2-15 m, mesas 10-40 m.

## 5. Sand dunes and ripples (Hueco Mundo)
- Generate dunes from a wind vector: transverse ridges or barchans (wavelength 60-200 m, amplitude 5-25 m), gentle
  windward slope (10-15°), steep slip face at the angle of repose (~34°), sharp crest.
- Crest line: one lighter ramp step along the crest (clamped ≤ `#F3F3F0`); slip faces and troughs take the cool
  shadow shades (`#C3C6CF`, `#ADB1C3`) - moonlit sand reads cool.
- **Ripples:** real ripples (5-15 cm) are ~1 voxel - use the shader's `sand` pattern, not geometry. Today its
  bands have a fixed world direction (crests roughly along z, ≈ 1.3 m apart); orienting them perpendicular to the
  map's wind is an engine request (`color-and-palettes.md` §3.4). Megaripples (0.5-2 m) may be 1-voxel height
  steps.
- Runtime: sand is a granular CA material - craters slump to 34°, blasts throw dust curtains, things get buried and
  exposed; ripples re-form slowly after combat (design). Very hot attacks fuse sand into glassy patches `#BFC7C9`.
- Ruins half-buried (broken white columns Ø 1.5 m × 6-15 m, stair fragments, wall stubs) and giant Hollow bones
  (Menos ribcages 20-40 m, design) give scale.

## 6. Trees

Trees are destructible world-voxel structures: cut the trunk and the crown falls as a fragment.

- **Architecture:** tapering trunk (pipe model: parent radius^2 ≈ Σ child radius^2), branches from **space
  colonisation** (natural broadleaf crowns) or **L-systems** (stylised, dead trees, pines, bamboo), leaf clusters at
  branch tips. Algorithms in `procedural-techniques.md` §9.
- **Thickness:** branches that should survive ≥ 2 voxels (0.25 m); 1-voxel twigs only inside leaf clusters as
  connectors. Every leaf cluster is face-connected to a branch - no floating leaf blobs.
- **Leaf clusters:** noise-displaced ellipsoid blobs 1-3 m (8-24 vox) with 5-15 % air holes so the sky reads through;
  3-4 shades: deep inside/underneath, base, light outer shell, highlight on top-facing voxels. Group clusters into
  3-7 big masses per crown (silhouette first) instead of hundreds of small puffs.
- **Species:**

| Tree | Where | Spec |
|---|---|---|
| Street/park broadleaf | Karakura arterials every 10 m, parks | 8-14 m, foliage ramp `#4E7D3A`, trunk dark wood ramp |
| Cherry | Karakura parks, levees | spreading crown, blossom ramp `#F3C1D0` + petal particles; dark trunk |
| Pine (niwaki) | Seireitei courtyards | twisted trunk, layered horizontal pads (cloud-pruned), pine ramp `#4F7B3F` |
| Bamboo | Rukongai | straight 1-2-voxel stalks `#8CB255` with 1-voxel darker node rings every 2-4 voxels; leaf tufts at the top |
| Cedar forest | Fugai forest (Rukongai) | tall straight trunks, conical dark crowns, dense |
| Dead tree | study chamber | 4-9 m, 2-3 kinks, no leaves, `#6B5B4D` |
| White forest | far end of Sōkyoku Hill | 10-18 m, bark `#EAE7DF`, foliage `#F1F1EC`, shadows `#C9CBC6` |

## 7. Quartz trees (Hueco Mundo, Forest of Menos)

The "trees" of Hueco Mundo are quartz-like minerals, not plants (locations §8.1).

- **Grammar:** trunk = hexagonal or square prism 1-3 m wide (8-24 vox); straight segments 2-5 m; at each node a kink
  of 15-40°; 2-4 thinner branches per node, each ending in a crystal point; total height 6-30 m; **no leaves**.
  Groves of 5-20 within 30-60 m, biased near vents where Menos-Forest trunks breach.
- **Shading = facets:** shade each prism face by orientation (one face light, its neighbours one and two steps
  darker) so the crystal reads; faint emissive edges (×1.1) and an inner blue `#BFD3E6` hint; ramp `#B3BCCE` →
  `#E4E9EE`. Diagonal facets are voxel staircases that lighting cannot shade cleanly, so assign each facet's
  voxels one of 2-3 quartz materials by the facet's orientation (no facet pattern in the engine yet).
- **Destruction:** no bending - shatters at the hit point; the segments above fall and burst into glittering shards.
- **Forest of Menos:** giant trunks Ø 6-20 m, 25-40 m apart, branching near the top and fusing into the ceiling;
  `#B9C2CC` with faint emissive edges `#DCE6F0`, mist `#5A5F6B` at 30 %.

## 8. Grass and ground cover
- The ground reads primarily through the **grass material + shader blade tint** - do not paint green noise.
- World-voxel tufts (1-2 voxels tall, clusters of 3-7) only where they define structure: along walls, path edges,
  rock bases, fences. Place with Poisson-disc (r 0.5-1.5 m) × density masks (noise × slope × distance to paths).
- Flowers/accents ≤ 2 % of grass area, in clusters of 3, colours from the map palette.
- Bushes: small leaf clusters 0.5-1.5 m. Rice paddies: water + rows of tufts. Weeds at wall bases in poor districts.
- Optional render-only instanced grass cards for high presets (not destructible) - a renderer decision, not voxels.
- Paths: trodden paths are a low-frequency mask that swaps grass for dirt with a 1-voxel ragged edge.

## 9. Water bodies
- Water is a liquid material in the transparent stream with a **flat surface at a fixed level**; region-limited CA
  only where disturbed.
- Colour by depth: shallows `#6FA3B8` → base `#4E86A8` → deep `#3B6E8F`; foam `#E8F1F5` as a 1-voxel band at shores,
  obstacles and falls.
- River anatomy (Onose River, Karakura): water 25-35 m wide, flood terraces 8-12 m each side (lawn, a few trees), levee
  crest path 4 m at +1.5 m, concrete revetments, a girder bridge and a footbridge; optional 10-15 m concrete canal.
- Ponds: Ugendō koi pond (13th Division), Fureai park pond.
- Interactions: freezing converts water to ice (Hitsugaya, Rukia), evaporation removes it (Yamamoto's Bankai),
  Harribel floods lanes; rain adds the `wet` state (×0.7 darker, glossier) and puddles.

## 10. Weathering and ground detail (structured)
- Dirt gradient at the base of walls and rocks; darker damp bands in gullies; sun-bleached tops.
- Pebbles as 1-voxel accents in small clusters on paths and riverbeds; leaves/petals as seasonal accents or particles.
- Persistent residue from fights is done with paint states (scorch, frost, blood, ink) - free and destructible.

## 11. Biome recipes (summary)

| Map | Ground | Feature shapes | Vegetation | Palette anchors |
|---|---|---|---|---|
| `karakura` | asphalt, paving, lawns, levees | river terraces, one hill | street trees, cherries, park lawns | asphalt `#55585E`, grass `#78A24A`, water `#4E86A8` |
| `urahara_study` | ground dust over brown rock | spires 10-35 m, Shattered Shaft Ø 6-8 m × 30-40 m, painted-sky ceiling | dead trees | dust `#B48C60`, rock `#A1805F`, sky `#9ECBEC` |
| `seireitei` | packed earth, gravel courtyards | terraces, canals | pines, garden trees | street `#DCD4C4`, gravel `#CFC6B4`, pine `#4F7B3F` |
| `sokyoku` | gravel cap on a mesa | cliffs, overhang, zigzag stair | white forest | rock `#A79E8D`, forest `#F1F1EC` |
| `rukongai` | dirt roads, fields | rolling hills, rivers, paddies | bamboo, cedar forest, gardens | dirt `#A88B63`, paddies `#9BC25A` |
| `hm_desert` | white sand | dunes, mesas, boulders, ruins | quartz groves | sand `#EEECE6`, rock `#C8C5BE`, quartz `#E4E9EE`, sky `#050608` |
| `menos_forest` | dark sand | giant trunks, cliff walls with nest caves | quartz giants | floor `#3A3C42`, trunks `#B9C2CC` |
| `hell` | basalt | lava rivers, chain-hung cliffs | none | `#1C1919`, lava `#FF4E12` |
