# Props (16-24 vox/m)

Props bridge the world (8/m) and characters (48/m): detail at eye level, sizes everyone recognises, and the most
satisfying things to smash and throw. Catalogue and placement rules come from `docs/lore/locations.md` (§6.1
Karakura props, §7.1 Seireitei props, per-map set pieces); palettes from `color-and-palettes.md`.

---

## 1. What a prop is
- A separate **`VoxelObject`** (PLAN §4.2, §6.2, §7): its own voxel grid, mesh and Rapier voxel collider; mass from
  material density; breaks with material hardness/toughness; can be grabbed and thrown by strong characters.
- **Density:** 16 vox/m for big props (cars, vending machines, poles, benches, barrels); 24 vox/m for hand-scale
  props and anything with text (bikes, lanterns, signs, shop goods). Ratios to the world grid stay integer (2:1, 3:1).
- **Placement:** snap to the 0.125 m world grid; the base sits exactly on the ground surface; keep 2 m movement
  corridors clear.
- **Lifetime:** props stay objects when they come to rest - re-rasterising a 16/24 prop into the 8/m world would
  erase its detail. Only their debris and rubble become world voxels.
- **Budgets (proposal):** ≤ 12 colours; ≤ ~4k triangles for small props, ≤ ~10k for cars; sub-parts that detach
  (crossarms, mirrors, lamp heads, glass panels) are separate small objects or pre-split fragments.
- **Construction:** same rules as everything else - 6-connected parts, ≥ 2-voxel structural members (1-voxel bars
  are fine at 16-24/m because a voxel is only 4-6 cm), chamfered boxes, structured paint, no noise soup.
- **No real brands or logos** (decision D8) - generic shapes, colours and invented signage.

## 2. Catalogue

| Prop | Real size (m) | Voxels | Construction and palette | Destruction |
|---|---|---|---|---|
| Vending machine | 1.0 × 0.8 × 1.85 | 16/m: 16×13×30 · 24/m: 24×19×44 | body red `#D93A3A` / blue `#2F6DB5` / white `#EDEDEA` (ramps §6.1); display window with 2-3 rows of sample cans (2×3 at 24/m, varied colours); emissive price lights and button row; coin slot; recessed take-out slot (2 deep, dark); emissive top panel at night (×1.0-1.5); clusters of 2-4 | glass front shatters, cans spill as debris, body dents (shallow carve + darkened rim) or is cut in half |
| Utility pole | Ø 0.35 × 11-12 | 16/m: Ø 5-6 × 176-192 | concrete `#8E8C86` ramp; 1-voxel step bolts alternating every 0.45 m from ~2 m; yellow/black striped guard sleeve at the base; blue/white address plate; steel crossarms 1.8 m `#8A9099`; insulators; transformer can Ø 0.5 × 1.0; every 30-40 m, alternating sides | snaps at the impact height; top falls as a fragment; crossarm and can detach |
| Wires | 3-6 per pole + house drops | not voxels | rope-physics lines `#1E1E1E`, catenary sag 2-4 % of the span (0.6-1.6 m over 30-40 m) | whip and spark when a pole snaps (brief stun on contact, design) |
| Street light | 6-8 tall, curved 1.5 m arm | 16/m: 96-128 tall | steel ramp; LED head emissive `#F2F6FF` or sodium `#FFC27A`; every 25-35 m | head detaches, pole bends/snaps |
| Traffic mirror | Ø 0.8 on a 2.5 post | 16/m: Ø 13 on 40 | orange post and rim (design `#E2702B`), mirror face = light blue-grey ramp with a 1-voxel highlight arc | mirror shatters |
| Traffic light | horizontal 3-lamp ≈ 1.2 × 0.4 × 0.3 | 16/m: 19×6×5, lamps Ø 5 | dark housing, visors; green/yellow/red emissive (only one lit) | |
| Kei car / sedan / van | 3.4×1.48×1.6 / 4.6×1.7×1.45 / 4.7×1.7×2.0 | 16/m: 54×24×26 / 74×27×23 / 75×27×32 | shell 2 thick with coarse interior (seats, dashboard) so cuts show insides; tinted glass `#3A4450` with a reflection streak; tyres `#1E1E22`, grey rims; emissive lights; body colours white, silver, black, red, pastel kei | crumples (`smash`), slices in half (`cut`), optional fire (design) |
| Bicycle (mamachari) | 1.7 long, wheels Ø 0.66 | 24/m: 41 long, wheels Ø 16 | 1-voxel tube frame, basket, spokes implied by 2-3 voxel hub + rim ring | bends, wheels detach |
| Bench | 1.8 × 0.6 × 0.8 | 16/m: 29×10×13 | wooden slats (wood light ramp) on concrete/steel legs | slats splinter |
| Mailbox | ≈ 0.4 × 0.4 × 1.3 | 16/m: 6×6×21 | red (design `#C8352B`), slot, plate | |
| AC outdoor unit | 0.8 × 0.3 × 0.55 | 16/m: 13×5×9 | off-white box, circular fan grille Ø 6-7 (ring + cross), pipes 1 voxel to the wall | |
| Satellite dish, laundry pole, garbage net, potted plant | small | 16/m | dish Ø 7; 1-voxel rods; net as a dark 1-voxel grid; pots with leaf clusters | |
| Playground (slide, swings, jungle gym, sandbox) | slide 3-4 long | 16/m | 1-voxel bars (6 cm), primary colours (design), swing chains as rope lines | bars bend, frames topple |
| Stone lantern (tōrō) | 2 tall | 16/m: 32 tall | base, pillar Ø 5, light box 8 wide with openings (emissive `#FFC873` at night), roof cap 13 wide with upturned corners, finial; stone plinth ramp | crumbles into blocks |
| Paper lantern (chōchin) | Ø 0.3 × 0.5 | 24/m: Ø 7 × 12 | ribbed (alternating 1-voxel bands), red/white, black kanji, emissive interior (`#FF6B3D` / `#FFD27A`) | tears/burns |
| Water barrel, fire-bucket pyramid | Ø 0.6 × 0.9; buckets Ø 0.3 | 16/m: Ø 10 × 14; Ø 5 | wood staves with 2 dark hoops; buckets stacked in a pyramid | splinters, water splash |
| Nobori banner (Seireitei) | 4-5 tall × 0.6 | 16/m: 64-80 × 10 | pole + cloth in the division colour with the numeral glyph; slight curve | cloth tears |
| Alarm bell (hanshō), notice board, cart, bamboo screen, practice-sword rack | various | 16/m | wood ramps; bokken 1 voxel thick | |
| Senkaimon pillars (study chamber) | 2 × 2 × 14 each | world scale | dark wood `#4A4038` with paper tags `#F2EAD3` and red script `#B3261E`; slide together into a ~10 × 12 m frame | set piece |
| Urahara Shop goods | shelves 1.8 tall | 24/m | dagashi shelves (43 tall) packed with small colourful 2×2×3 candy blocks; glass jars; Urahara's fan; Jinta's bat; Ururu's broom; the small van (kei-van size) | goods scatter |
| Hollow bone props | ribcages 20-40 m | world scale (bone ramp) | Menos ribcages and skulls half-buried in sand (design) | |
| Braziers, Wandenreich banners, Gates of the Sun | various | 16/m / world | iron bowl + emissive coals `#FFB45A`; white banners with black Zeichen; ornate metal plates `#B8A46A` | |

## 3. Signs and pixel-art kanji

Text is pixel art on a flat panel (1-voxel relief only for carved wooden signs). Legibility needs grid size, not
wishful thinking:

| Glyph complexity | Examples | Minimum grid | Comfortable |
|---|---|---|---|
| Simple (≤ 4 strokes) | 一 二 三 十 七 八 人 大 上 下 山 川 止 | 5×5 | 7×7 |
| Medium (5-9 strokes) | 四 五 六 九 町 店 空 | 9×9 | 11×11 |
| Complex (10+ strokes) | 浦 原 商 座 霊 | 13×13 | 15×15 - simplify radicals, merge parallel strokes |
| Kana | ま れ ロ コ | 5×7 | 7×9 |

- At 24 vox/m a 15×15 glyph is 0.62 m: Urahara Shop's ~4 m signboard (≈ 96 × 19 voxels) fits 浦原商店 at 15×15 with
  margins; a 0.6 m shop sign fits one or two simple glyphs - otherwise use a decal.
- Strokes 1 voxel wide; 2 voxels only on big signs. Ink `#151515` on cream `#E7DBBF` / white; shop banners and
  lanterns use the palette's accent colours.
- **Road markings** (止まれ, lane lines) are world-scale paint on asphalt: Japanese road text is stretched along
  the driving direction, so each character can be 12-20 world voxels long - legible from a car or a rooftop.
- Division numerals use the glyph set in `bleach-style-guide.md` §2.2.
- When close-up legibility needs more resolution than the prop density allows (posters, fine print, badges),
  use a decal at 2× density over the voxels (`NEW: DecalOnVoxel` in the dossiers) - and keep the voxel version
  as a readable simplification.

## 4. Destruction behaviour by material

| Material | Behaviour | Debris / FX |
|---|---|---|
| Glass (vending fronts, car windows, mirrors) | shatters entirely on any real hit | glass shards (transparent debris), tinkle SFX |
| Thin metal bodies (vending, cars, AC units) | dents (shallow carve + darkened rim paint) under `smash`, clean halves under `cut` | sparks, metal chips |
| Steel members (crossarms, poles' fittings, railings) | bend rather than crumble (fragment pivots), snap at high power | sparks |
| Wood (benches, carts, barrels, lantern frames) | splinters | elongated chips, dust, flammable |
| Concrete / stone (poles, lanterns, bases) | crumbles into blocks; poles snap at the impact height | grey dust, chunks |
| Paper / cloth (lanterns, banners, shōji) | tears, burns fast | flakes, embers |

Props inherit the attack's `DamageShape` mode (PLAN §6.1): `cut` gives clean halves that slide along the cut plane
(sliced cars and vending machines are a Bleach image), `smash` crumples and launches, `bore` punches round holes,
`burn` chars and ignites flammables, `freeze` coats and makes them brittle, `absorb` (Quincy) strips them into reishi
in Soul Society/Hueco Mundo only (Human World matter is not absorbable).

## 5. Placement recipes (Karakura street, per 100 m)
- 3 utility poles (alternating sides) with wire bundles and house drops; 3-4 street lights.
- 1-2 vending-machine clusters (2-4 machines) at corners or shop fronts; glowing at night.
- Traffic mirrors at every blind lane junction; a traffic light on arterial crossings.
- 2-6 parked cars (driveways, lanes) and bikes near apāto and the station; a mailbox near shops/station.
- AC units, laundry poles, satellite dishes and potted plants come from the building facade grammar, not street
  scattering.
- Seireitei courtyards: stone lanterns in pairs, water barrels and fire-bucket pyramids by halls, nobori banners at
  gatehouses, notice boards at alley junctions.
- Night presets: emissive props carry the scene - vending panels, LED/sodium lamps, lanterns, lit windows
  (`#FFD9A3`-`#FFE6B0`).
