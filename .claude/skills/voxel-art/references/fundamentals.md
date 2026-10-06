# Fundamentals - what makes voxel art read as high quality

Voxel art is pixel art in three dimensions: every voxel is a deliberate decision. Quality here means three
things, tested by screenshots, not by intention:

1. **Identity at gameplay distance** - the asset is recognisable as a flat silhouette and as 2-3 colour masses
   at ~20 m, where a character voxel is about one pixel.
2. **Craft at close range** - at ~2 m (cinematics, photo mode, character select) faces, trims, emblems and folds
   look hand-placed: clean lines, intentional colour steps, no stray voxels.
3. **Structure under destruction** - assets are built from real members and solid volumes, so cuts, craters
   and collapses look plausible and debris inherits sensible colours.

---

## 1. Screen-size math (do this before deciding detail)

Pixels per metre at distance `d` for vertical FOV `f` and image height `H`:
`px_per_m = H / (2 · d · tan(f/2))`. With the look-dev camera (f = 42°, `tan 21° = 0.384`):

| Distance | 720p px/m | Character voxel (1/48 m) | Prop voxel (1/16 · 1/24 m) | World voxel (1/8 m) | 1.74 m character |
|---|---|---|---|---|---|
| 2 m (close-up) | 469 | 9.8 px | 29 · 20 px | 59 px | head ≈ 117 px |
| 5 m | 188 | 3.9 px | 12 · 8 px | 23 px | 326 px |
| 10 m | 94 | 2.0 px | 5.9 · 3.9 px | 12 px | 163 px |
| 20 m (gameplay) | 47 | **1.0 px** | 2.9 · 2.0 px | 5.9 px | **≈ 82 px** |
| 40 m | 23 | 0.5 px | 1.5 · 1.0 px | 2.9 px | 41 px |

Multiply by 1.5 for 1080p. Update `f` when the game camera exists.

Consequences:
- At 20 m **anything smaller than ~4-6 character voxels (8-12 cm) is invisible**. Identity must come from shapes
  ≥ 6 voxels and colour masses ≥ 6×6 voxels: hair mass, haori, weapon, mask, coat flare.
- Details of 1-3 voxels are close-up rewards. Put them where the camera goes close: face, hands, weapon, chest
  emblem, back numeral.
- World voxels (≈ 6 px at 20 m) are visible as texture: world surfaces need calm, structured variation, or they
  become a field of flickering squares (the "tiles" look of look-dev 01).
- Props at 16/m sit between: a vending machine (1.85 m = 30 voxels) is ~87 px at 20 m - its identity is its
  box + lit panel + colour, not its buttons.

## 2. Silhouette and negative space

- **Test:** render the asset unlit, flat black on white, at ~80 px tall (20 m) and at 200 px; also put it in a
  lineup with 3+ similar assets (e.g. Ichigo between Renji, Kaien and Hisagi). If you cannot name it, it fails.
- **Bleach shape language:** tall, slender vertical bodies (≈ 1:7 heads), big clean black and white masses,
  oversized blades, flowing cloth (sleeves, haori, coats, capes, scarves), sharp spiky hair. Hollows invert it:
  hunched or animal bodies, a bone mask as the focal shape, a through-hole.
- **Exaggerate identity shapes by 10-30 %** at block-out: hair spikes, weapon size, coat flare, mask horns,
  shoulder plates. Real proportions look timid at 1 px per voxel.
- **Negative space:** keep readable gaps - between arms and torso in idle (≥ 2 voxels at the waist), between
  legs/hakama legs, around the weapon (it must break the body outline, e.g. Zangetsu over the shoulder).
- **Avoid tangents:** shapes that *just* touch (sword tip meeting the hakama edge, hair spike ending at the
  shoulder line) merge into mush at distance. Overlap clearly or separate by ≥ 2 voxels.
- **Distinct per faction:** Shinigami = black column + white collar V + wide hakama triangle; captains add a
  white rectangle (haori) with a dark numeral; Arrancar = white column + black sash + bone fragment + hole;
  Quincy = long white coat/cape with crosses; Hollows = white mask on a dark or odd body.
- **Silhouette in motion:** check one extreme pose per animation archetype (overhead swing, lunge, kick) - a
  pose that hides the weapon behind the body loses the read.

## 3. Scale consistency

- One density per class (see `SKILL.md`). Never mix arbitrary densities - a 48/m arm next to a 32/m hand reads
  as broken ("mixels"). Sub-parts at a higher density only at exact integer ratios (Gillian body 4/m with mask and
  hands 8/m; a Visored mask needing more detail at 96/m on a 48/m head; Kon's plush at 96/m scaled ×0.5).
- Size everything from canon numbers in the dossiers/locations (cm, m) and convert; never eyeball.
- Reference objects in every scale check: Ichigo (84 char vox, 1.74 m), a 2.1 m door (17 world vox), an 11-12 m
  utility pole, a 1.85 m vending machine, Jidanbō (9.88 m), a Gillian (~36 m).
- Place props and buildings on the 0.125 m world grid; a prop's base must sit exactly on the ground surface.
- Watch heads: kids and adults alike end up with ~11-13 voxel heads at 48/m, so faces stay readable at the same
  camera distance. Giants choose a density that keeps the head ≥ 12 voxels.

## 4. Detail density hierarchy

Spend detail where the eye goes; leave rest areas calm so detail has contrast to read against.

| Priority | Where | Allowed detail |
|---|---|---|
| 1 | Face, hands, weapon/guard, mask, emblems (back numeral, badges, crosses) | 1-voxel features, pixel-art faces and glyphs, highlights |
| 2 | Chest/upper costume, hair, shoulders, collar V, belts/straps | 2-voxel trims, 3-5 folds, clump shading |
| 3 | Lower costume (hakama, coat skirt), forearms | big folds/pleats, hem bands |
| 4 | Back, legs, soles, undersides, building backs, terrain interiors | flat ramps, structure only |

- Rule of thumb **60/30/10**: ~60 % calm surface, ~30 % medium detail, ~10 % busy focal detail.
- Detail must follow structure (a seam where garments meet, wear on convex edges, a crack along a mortar line),
  never be sprinkled.
- A trim or line that matters at 20 m must be ≥ 2 voxels thick; a 1-voxel line is a close-up accent.

## 5. Noise budgeting - structured variation vs "noise soup"

**Noise soup** = per-voxel random colour scatter with no spatial structure, usually several noise sources
stacked. It destroys form, flickers in motion, multiplies triangles (every colour change breaks a greedy quad)
and reads as dirt.

Our noise sources and who owns them:

| Source | Owner | Character models | Props | World |
|---|---|---|---|---|
| Per-voxel hash shade (PLAN §5.5) | shader | off or ≤ 2-3 % (faces 0) | low (≈ ±3 %) | on (look-dev: ±7 % per voxel) |
| Low-frequency patches (7-voxel cells) | shader | off | optional | on (look-dev: ±4 %) |
| Material pattern (brick, grain, tile, ripple) | shader | none | per material | per material |
| Painted variation | generator/model | **structured only** | structured only | **structured only, low frequency** |

Rules:
1. **Never add your own per-voxel random paint on top of the shader hash.** If a world surface needs more life,
   use structured variation (below), not more randomness.
2. **The 8×8 test:** inside any 8×8-voxel patch of one material, ≤ 3 distinct painted shades, and adjacent
   painted changes form shapes ≥ 3 voxels (patches, bands, lines), not single dots.
3. **Structured variation recipes:**
   - *Gradients with meaning:* dirt/grime darkening toward the ground (bottom 0.5 m of walls), sun bleaching on
     top faces, soot above windows, moss on north and top faces, rust streaks below metal.
   - *Posterised low-frequency noise:* noise with wavelength ≥ 6-8 voxels, quantised into 2-3 bands → shade index.
   - *Edge wear:* lighter shade on convex edges only (top/outer corners), darker in concave corners.
   - *Pattern aligned to structure:* brick courses, plank/grain along the member, tile rows along the slope,
     strata along terrain layers, pleats along the hakama.
   - *Grouping:* accent colours (flowers, pebbles, stains) in clusters of 3-7, never uniformly spread; accents
     ≤ 2-5 % of a surface.
4. Characters: zero random paint. Texture where needed (fur, straw, hair strands) is a deliberate repeating motif
   aligned to the form (e.g. 1-voxel darker strand lines along a hair clump, every 3-4 voxels).

## 6. Stepping, aliasing and edge tricks

- **Clean lines.** A painted or modelled line uses consistent run lengths: 1:1 (45°), 2:1, 3:1; curves use
  monotonic runs (3-2-2-1-1, then mirrored), never irregular (2-1-3-1). Irregular runs read as "jaggies".
- **No doubles:** a line meant to be 1 voxel must not thicken to 2 at its stair steps (an "L" corner becomes a
  blob). Remove the inner corner voxel.
- **Intermediate colour steps (voxel anti-aliasing):** on painted lines and gradients across a surface (eye
  shapes, diagonal stripes, a hem edge on a curved panel), put a mid-tone voxel in the inner corner of each stair
  step. Do not AA silhouette edges - in 3D the AA voxel becomes a visible odd-coloured cube.
- **1-voxel accent lines:** a lighter line along an important edge (sword edge, haori hem, armour rim) or a
  darker line in a crease (panel line, garment overlap). Keep them continuous and on one surface.
- **Bevels by colour:** on hard-surface forms (blades, armour, bone masks, building corners) paint the outermost
  row of convex edges one shade lighter on top/key-light-facing edges and one shade darker on bottom/back edges.
  It reads as a chamfer without geometry. The shader's subtle face-edge darkening (D15) is separate and mild -
  do not add painted grid lines.
- **Chamfer geometry:** remove corner voxels on box forms (1 voxel on 6-12-voxel boxes, 2 on larger) unless the
  object is a crisp architectural block. Unchamfered boxes are the Minecraft tell.
- **Roundness needs size:** a circle needs ≥ 5 voxels diameter to read round (7+ to look clean); a sphere ≥ 7.
  Below that, use a cross/plus shape on purpose.
- **Parity:** a shape symmetric about a plane needs the right width parity - even widths when the plane lies on a
  voxel boundary, odd widths when it passes through voxel centres. Off-by-half errors produce 1-voxel lopsided
  heads, faces and blades. Decide each model's mirror plane up front (characters: on a voxel boundary,
  face plate 10 wide; or on a centre, 11 wide - pick one and keep templates consistent).

## 7. Symmetry with deliberate asymmetry

1. Build the base bilaterally symmetric (mirror op) - bodies, faces, generic clothing.
2. Add **canon asymmetries** from the dossier (listed per character in `bleach-style-guide.md`: Grimmjow's right
   jaw mask, Ulquiorra's left horn, Kenpachi's right eyepatch + left scar, Byakuya's two kenseikan on the right,
   Hisagi's right-eye scars and left-cheek 69, Yumichika's right-eye feathers, Ikkaku's right gold pauldron…).
   Always write "character's left/right" - a front view mirrors it.
3. Add **natural asymmetries**: hair part and stray locks, sword at the left hip, kimono overlap (left over
   right), one sleeve fold different, weight shift in the idle pose.
4. Run a symmetry diff; every asymmetric cluster must be on the brief's list. Accidental asymmetry is a bug;
   perfect symmetry everywhere looks dead.

## 8. Layering

- Build inside-out: body → under-layer (white juban collar) → main garment (kosode) → lower garment (hakama) →
  belt/obi → outer garment (haori, coat, cape) → straps, armour, accessories → hair → weapon.
- Each visible layer edge needs **visible thickness**: ≥ 1 voxel for thin garments, 2 for haori/coat hems
  (so the hem reads in profile), 2-3 for armour plates.
- Separate overlapping layers by **value contrast** or by a **1-voxel recess** (AO draws the line for you), not by
  an outline colour.
- Keep each layer a separate part/paint pass so forms, outfit damage states (haori lost, coat shredded, Ōken
  outer layer destroyed) and costume swaps can add/remove it - and model the layer underneath wherever it can be
  revealed.

## 9. Readability under AO, bloom, tone mapping and fog

- **Vertex AO** (greedy mesher, look-dev curve `[0.5, 0.68, 0.84, 1.0]`) darkens concave corners to as low as 50 %,
  and N8AO adds screen-space darkening. Use it: 1-voxel recesses become free separation lines. Respect it: an
  iris set 1 voxel into the face loses half its brightness at the corners - paint eyes flush on a flat face plate.
- **Bloom** (threshold 1.0, HDR) should only catch emissive voxels and VFX. Sunlit white plaster, white haori,
  Hueco Mundo sand and bone masks are the risk: keep albedo whites ≤ `#F3F3F0` and confirm no halo in
  `seireitei_noon`. Things that should glow (Hollow eyes, lanterns, reishi crystals) must be emissive, not just
  bright.
- **Tone mapping:** Neutral (Khronos PBR Neutral) keeps albedo hues near their sRGB values - default. ACES adds
  contrast and shifts saturated colours (bright blues toward purple, hot colours toward white) - judge colours in
  the final render, not as hex swatches. AgX desaturated the anime palette in look-dev (D14) - never.
- **Fog/aerial perspective** flattens distant values: important silhouettes (towers, the Senzaikyū, Las Noches
  towers) need strong value contrast against the sky of their map.
- **Rim light:** characters get a fresnel rim (PLAN §8.1). In `hm_night` (near-black sky) black-clad characters
  survive only through rim light plus the lit shade of their black ramp - check it.
- **Lighting presets for review** (from `docs/lore/locations.md`): `studio` (neutral grey background, key 45°
  front-left, fill, rim), `karakura_afternoon` (sun 35°, `#FFE6C2`), `karakura_dusk` (sun 6-10°, `#FF9A55`),
  `seireitei_noon` (sun 60°, `#FFF4E0`, white walls), `hm_night` (moon `#CFE0FF` at 25-35°, sky `#050608`,
  ambient `#0A0E18`, sand bounce `#8E8C88`), `lasnoches_interior` (warm white `#FFF8EA` at 45°, sky `#7FB6E6`).

## 10. Surface and material conventions

- Everything is matte (roughness ≈ 0.9). Metals are a palette + bevel convention (bright edge line, darker
  flats, a 1-voxel highlight), not reflections.
- Glass and ice are transparent materials with a tinted ramp; never a flat dark block (look-dev windows read as
  holes).
- Emissive voxels are a separate stream (PLAN §5.4) - lanterns, vending panels, Hollow eyes, reishi crystals,
  lava. Give them a ramp too (hot core → cooler rim).

## 11. Failure gallery (seen in look-dev - do not repeat)

| Symptom | Cause | Fix |
|---|---|---|
| Scene reads as Minecraft | 0.25 m world voxels, unchamfered boxes, strong grid lines | 0.125 m world, chamfers, subtle edge shading only |
| Walls look tiled | per-voxel outlines / high-contrast hash | D15 subtle edges; low-amplitude hash; patterns aligned to structure |
| Black robe is a blob | albedo `#15151A` for a whole garment | black ramp `#141418 / #24232B / #3A3944`, fold shading |
| Eyes vanish | 32 vox/m, rasterised metric eye shapes | 48/m, pixel-art face plate |
| Hair has floating cubes | spike generator without connectivity | clumps rooted in a hair cap, lint for components |
| Windows look like holes | flat dark glass colour | frame + inset glass ramp + interior hint |
| Energy does not glow | VFX colours ≤ 1.0 | HDR multipliers (core ×4-8) |
| Washed-out anime colours | AgX tone mapping | Neutral/ACES + LUT |
