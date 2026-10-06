# Architecture - detailed, canon-faithful and damage-friendly

World structures are rasterised at **0.125 m (8 vox/m)** from metric generators (PLAN §5.1, §13.1). Canon layouts,
dimensions, palettes and collapse recipes come from `docs/lore/locations.md` (§3 materials, §4 destruction
archetypes, §6-§10 per map). Numbers below are voxels at 0.125 m. Under a per-map 0.25 m override, halve the counts,
keep members ≥ 1 voxel and expect much less detail - avoid 0.25 m for maps full of Japanese houses.

---

## 1. Build like real structures

The destruction engine runs a structural search from removed voxels toward anchors (bedrock/footings) and turns
unsupported components into falling fragments (PLAN §6.2). Buildings that are solid lumps or hollow shells collapse
wrongly; buildings made of members collapse like Bleach (a diagonal cut, the top slides off along the cut plane).

| Member | Real size | Voxels | Notes |
|---|---|---|---|
| Exterior wall | 0.25 m | **2** thick | 1-voxel walls read as paper and shatter into noise |
| Interior partition, shōji/fusuma | 0.125 m | 1 | only where fights enter (locations §5 rule 3) |
| RC floor slab | 0.25-0.3 m | 2-3 | connects columns; one slab per floor |
| Wooden floor/joists | 0.125-0.25 m | 1-2 | sits on beams |
| RC column | 0.5-0.6 m square on a ~6 m grid | 4-5 square, grid 48 | shear walls at stair cores |
| RC beam | 0.3 × 0.6 m | 2-3 × 5 | |
| Wooden post (Japanese house) | 0.105-0.12 m | 1×1 (2×2 at corners) | every 1.8-2.7 m (14-22 vox) inside the walls |
| Footing / stone base | 0.3-1 m | 3-8 | anchors into the terrain, which is anchored to bedrock |
| Floor-to-floor | 2.8-3.0 m | 22-24 | Japanese houses and mansions |

Rules:
1. **Every voxel belongs to a member** (wall, slab, column, beam, roof, stair, footing). Tag member type in the
   generator output so the structure worker can split huge fragments per floor/member (> ~400k voxels split per
   floor, locations §4).
2. **Load paths exist:** roof → beams/walls → columns/posts → footing → ground. Nothing hovers; ornaments (signs, AC
   units, lanterns) are face-connected to a member or are separate props.
3. **Interiors are air** between slabs, not solid fill. Massive solids (Seireiheki core, mesa interiors, ground
   below 4 m) stay solid so they compress to uniform chunks (free in memory).
4. **Two-voxel minimum** for anything that should survive a hit; 1-voxel elements (frames, railings, posts,
   partitions) are allowed but expect them to break first - that is good for detail, bad for structure.
5. Materials per member (plaster walls, timber posts, kawara roofs, RC slabs) with correct hardness and debris
   (locations §3). One material + ramp + shader pattern per surface type; do not paint per-voxel noise.

## 2. Detailing at 0.125 m

| Element | Spec in voxels | Tips |
|---|---|---|
| Door | 16-18 tall × 6-7 wide; genkan door 7; frame 1 | recess the door 1 voxel for an AO reveal |
| Window (Japanese aluminium sash) | living room 14 × 9, small 7 × 7; sill at 7 above the floor, head at 16 | frame 1 voxel in `#8E9196`; glass **inset 1 voxel**; sill 1 proud; lintel 1 |
| Lit/occupied window | back wall or room 2-4 behind the glass; curtain as a 1-voxel cloth plane (partly drawn); ceiling light strip emissive at night | never a flat dark fill - look-dev windows read as holes |
| Eave (Japanese house) | overhang 5-7; fascia board 1; rafter ends as 1-voxel stripes every 2 under the eave | AO under the eave gives depth for free |
| Roof slope | kawara ~25°: steps of rise 1 : run 2; Seireitei irimoya upper roof ~34°: rise 2 : run 3 | keep one consistent run pattern per roof plane |
| Ridge | stacked ridge tiles 4-8 tall, white caps `#E9E6DE` (Seireitei) | onigawara ornaments at ridge ends |
| Onigawara (ridge-end tile) | 8-10 tall × 6-8 wide plaque, 2 thick | stylised relief in 2 shades; no tiny noise |
| Gutter / downpipe | 1 voxel | rust streak below metal (structured) |
| Balcony | slab 2; railing 9 tall (1.1 m): 1-voxel balusters every 2-3 or a solid panel + top rail | laundry poles and AC units as props |
| Cornice, string course, sill band | 1-voxel band, 1 proud | the cheapest way to add scale cues |
| Stairs | riser 1 + tread 2 (gentle) or riser 2 + tread 2 (steep Japanese stairs) | controllers autostep 0.5 m - any works |
| Block wall (Karakura lanes) | 10-13 tall (1.2-1.6 m), 2 thick with a 1-voxel cap | block courses 2 tall, joints every 3 |
| Kawara tiles | 1-voxel course steps in geometry + the `tile` pattern (a flat 0.5 m grid today; slope-aligned kawara rows are an engine request, `color-and-palettes.md` §3.4) | tiles slide off as debris first when struck |

**Interior hints** (cheap depth): furnish only set pieces and ~20 % of houses; the rest get lit windows with a back
plane + curtain + light strip, and simple partitions. Fake Karakura's replica can have empty interiors.

---

## 3. Karakura Town (Human World, `karakura`)

Ordinary western-Tokyo town (locations §6.1). Heights: houses 7-9 m to the ridge, apāto 6-7 m, mansions 18-36 m,
school 15 m, hospital ~30 m, rail viaduct deck 8 m, poles 11-12 m.

| Type | Footprint (m) | Construction | Facade modules |
|---|---|---|---|
| Detached house (55 %) | 7-10 × 6-9, 2F, ridge 7-8.5 m | wooden posts + 2-voxel walls, joists, purlins; kawara gable/hip 60 %, metal 25 %, flat 15 % | genkan canopy, balcony, sash windows, block wall + gate, AC units, satellite dish |
| Apāto (15 %) | 16-20 × 6-7, 2F | light frame + external steel stair and open corridor | row of identical doors, laundry balconies |
| Mansion (8 %) | 25-40 × 10-14, 6-12F × 3.0 m | RC frame, columns on a 6 m grid, slabs, shear walls at the stair core | continuous balconies, rooftop water tank |
| Shop-house (12 %) | 5-7 × 10-14, 2-3F | RC or wood | roll-up shutter, signboard (prop), awning, AC units |
| Convenience store / supermarket | 15 × 12 / 40 × 30, 1F 4.5 m | steel frame, glass front | generic sign band (no real brands) |
| Covered arcade (shōtengai) | street 6-8 × 150-200, roof 8-9 m | polycarbonate on steel arches | hanging banners, shutters |
| Warehouse | 40 × 25, 9-11 m | steel frame, corrugated cladding | roll doors |

Palette (locations §6.1): asphalt `#55585E`, block walls `#B4B0A6`, house walls cream `#EFE8D8` / beige `#E3D5B8` /
grey `#D7DBDF` / white (≤ `#F3F3F0`), roofs kawara `#454E5C` / brown `#5B3F33` / charcoal `#2E3440` / metal `#7C8A99`,
timber `#7A5A3E`, glass `#A9CBE0`. Ramps in `color-and-palettes.md` §6.1.

Must-haves: concrete utility poles with sagging wire bundles on every street, narrow lanes between 1.2-1.6 m block
walls, tiled-roof houses mixed with boxy modern ones, glowing vending-machine clusters, convex traffic mirrors at
blind corners, a wide river with grassy levees, a girder road bridge and a footbridge, a park, a hillside cemetery,
a covered arcade, an elevated railway with a station, a few 6-12-storey mansions (props in `props.md`).

Weathering (structured): grime gradient `#8C8170` on the bottom 0.5 m of walls, rust streaks under steel, moss on
north-facing block walls, asphalt cracks and patches, puddles in `rain_night`.

### Set pieces (locations §6.2-6.4)
- **Kurosaki Clinic:** corner lot 18 × 14 m; building 14 × 10 m, 2 floors × 3.0 m + 2 m roof; clinic at the front
  (waiting room, reception window, exam room, ward), family rooms behind (the giant Masaki poster), upstairs
  Ichigo's room with the sliding closet and street-facing window; signboard on the facade; walls `#EFE9DD`, frames
  `#8E9196`, roof `#4D5560`, doors `#6B4E37`, tatami `#C9C08A`.
- **Urahara Shop:** single-storey timber shop 12 × 9 m, eaves 3.2 m, tiled gable roof ridge ~6.5 m; big signboard
  浦原商店 across the front (cream `#E7DBBF`, black characters); four glass-and-wood sliding doors; dagashi shelves,
  raised tatami step; floor hatch → 1.5 × 1.5 m shaft with a very long ladder (map transition); packed-earth yard
  `#B59B76`; timber `#5E4632` → `#76593F`, roof `#3C4048`.
- **Karakura High:** 4F main block 65 × 16 × 16 m (classrooms on the sunny side, corridor on the other, stair towers),
  3F annex joined by a covered bridge, gym with an arched roof to 12 m, 6-lane track, railed rooftop with a 1.5 m
  fence and water tank; glass-heavy RC = shatter showcase.

---

## 4. Seireitei (Soul Society, `seireitei`)

A circular walled city of **white plaster walls forming long corridors and dead ends**, dark blue-grey tiled roofs
with white ridges, wide avenues converging on the white **Senzaikyū** tower and **Sōkyoku Hill** (locations §7.1).

| Element | Spec |
|---|---|
| Alley wall | stone plinth 1 m (8 vox) + plaster to 4-6 m (32-48), **0.75-1 m thick (6-8)**, tiled coping with 0.4 m overhang (3), pilasters every 4-6 m (32-48) protruding 1-2; doors 2.5 × 3 m (20 × 24) every 20-60 m; roofed gatehouses at compound entrances |
| Avenues / alleys | avenues 12-16 m, ring streets 8 m, alleys 3-6 m; terraces ±1-4 m with stone stairs 3-8 m wide |
| Compound | gatehouse with the division numeral plaque and two 4-5 m division-colour banners (nobori); main hall 30 × 18 m, 1-2 floors, ridge 10-12 m, heavy irimoya roof; dormitory wings 40 × 10 m; dojo 25 × 15 m; captain's office; *kura* storehouses (white plaster on a black base); gravel courtyard with pines, well, stone lanterns; sand training yard; optional 6 × 6 × 15 m watchtower |
| Hall construction | stone platform 0.6-1 m; wooden column grid 3 m (24) with 3×3 columns; tie beams 2×3; **engawa** veranda 1.2 m (10) wide on posts; eaves 1.2-1.8 m (10-14) with rafter ends; heavy kawara roof, ridge 1 m of stacked tiles with white caps and onigawara |
| Canals | 6-10 m below the streets: vaulted stone tunnels 4-5 m high, 3-4 m channel + 1 m walkways, grates/stairs every ~60 m |
| Seireiheki & gates | Sekkiseki wall 40-50 m tall, 5-8 m thick, slabs 20-30 m wide (solid core); gate leaf ~30 × 20-25 × 3 m with a 2.5 × 3 m wicket; gate colours: West Hakutōmon white, South vermilion `#C8352B`, North black `#1E1E22`, East blue-green `#2E6F7E` (design) |
| Senzaikyū | precinct wall 300 × 300 m; approach steps 12 m wide climbing ~20 m; tower base 30 m, shaft 18-20 m tapering, banded rings near the top, 160-220 m tall; top cell 12 × 12 × 8 m with one barred slit window; bridge 6 m wide at hill-top height with dark-timber railings |

Palette: plaster `#F0ECE3`, plinth `#BDB6A8`, roof tiles `#475565`, ridge caps `#E9E6DE`, eave boards `#2F363F`, timber
`#6E4B33`, streets `#DCD4C4`, gravel `#CFC6B4`, pines `#4F7B3F`, Sekkiseki `#D9D5CC`. Division banners/plaques use
the division colours (`bleach-style-guide.md` §2.4). Under `seireitei_noon` the white walls are the bloom stress test.

Maze generation: carve avenues and ring streets, fill blocks with compounds, rasterise leftovers to a 6 m grid, run a
randomised spanning tree (Wilson/Kruskal) for alleys, add 10-15 % extra edges for loops, keep ~50 % of dead ends
(`procedural-techniques.md` §7). Every alley edge touching a compound becomes a wall segment.

## 5. Rukongai (`rukongai`)

Feudal villages whose wealth falls with district number (locations §7.7): w > 0.7 tiled *machiya* rows, shops,
small temples (kawara `#4A4E57`, plaster `#E8E0CF`, timber `#7C5C3F`, stone paving); 0.4-0.7 thatched *minka*
12 × 8 m with 6 m ridges (thatch `#A68B5B`, mud walls `#9E8261`); 0.2-0.4 shacks 4 × 4 m; < 0.2 burned-out ruins.
Thatch, wood and mud = the most satisfying, fastest-burning collapses. **Shiba house:** modest house fronted by two
huge stone arms (12-15 m) gripping a 16 × 3 m name banner, and the tall black Kakaku Taihō cannon (6 m wide,
40-50 m tall, `#1F1F22`, hidden by a tan mould `#C8B08A`) over an underground chamber.

## 6. Las Noches (Hueco Mundo)

White, monumental, minimal: a domed main building ringed by towers, five smaller towers on the dome, all **white
stone that is not Sekkiseki** (locations §8.3-8.5).

| Element | Spec |
|---|---|
| Dome | drum radius 280-320 m, drum wall 50-70 m, cap rising another 80-110 m; **shell 1.5-2 m** with internal ribs (meridians + parallels, 3 m deep, every ~25 m); inner face painted as an emissive fake blue sky `#7FB6E6` |
| Rooftop towers | 18-24 m square, 50-100 m above the shell, slit windows `#1A1C22`, flat rimmed tops |
| Outer towers | 4-8 around the drum, 30-40 m wide, 120-200 m tall |
| Interior (under the fake sky) | daylit white sand, 12-15 towers (square, round or stepped; 10-25 m wide; 40-150 m tall; hollow with stairs), white blocky palaces with colonnades and small domes |
| Corridors / halls | straight halls 8-12 m wide × 10-14 m tall, square pilasters every 6 m, polished floor `#E6E4DF`, ceiling slits with fake-sky light; throne room 80 × 40 × 40 m with a 20 m stepped dais |

Palette: stone `#F2F0EB` → `#D8D8D6` → `#C2C5CC` (cool shadows under the moon), slits `#1A1C22`. The defining shot:
light leaking **upward** from holes in the dome (emissive inner face) against the black sky. Ruined TYBW variant:
more than half in ruins, Jagdarmee tents.

## 7. Wandenreich - Silbern and Wahrwelt

Gothic-modern Quincy city carved from the Seireitei's shadows (locations §9): blocky white buildings under a dark
sky, iced over, run-down.

- **Block grammar:** base slab → shaft with tall narrow window bands → crown with buttress fins and cross reliefs;
  20-40 % of blocks have collapsed corners/facades; Quincy five-point crosses on banners (white `#F4F6F8` with black
  `#1A1A1A` Zeichen) and walls.
- **Silbern:** wide two-tier building - lower tier 140 × 90 × 25 m on **six thick columns** (Ø 8-10 m), upper tier
  70 × 45 × 20 m on Ø 2-3 m pillars; windows as **pairs of thin vertical slats**; a 40 m wide stairway; an angular
  barrier with octagonal pylons; two gutted tusk-like arches (80-100 m) in front; a 30 × 30 m rear tower 200-250 m tall
  with a **20 m cross on each face**.
- **Ice pass (SDF growth):** crust 0.25-1 m on upward faces, icicles 0.5-4 m under overhangs, stalagmite clusters
  2-12 m on roofs and streets with a slight lean, frozen drifts against walls. Ice shatters first (H 25), revealing
  stone (H 100).
- Palette: stone `#E9EDF1` → `#C3CBD5` → `#8C99A8`, trim/roofs `#5B6B7E`, ice `#CFE7F3` / `#9CC3DB`, torches `#FFB45A`,
  Quincy reishi `#79C6FF`, Gate of the Sun metal `#B8A46A`.
- **Wahrwelt:** a stepped central castle (200 × 200 m base, tiers shrinking 15-25 % per 30-50 m, Silbern on top),
  five branch cities on floating discs joined by 20-30 m bridges, emissive Zeichen energy ribbons `#5FB6FF`, stone
  guardian statues 15-25 m, a Hagal-rune throne.

## 8. Other realms (brief)
- **Soul King Palace:** floating islands of palace stone `#ECE6DA` (disc + hidden anchor core + bridges; bridges cut
  → island stays, anchor destroyed → island tilts and drops).
- **Study chambers** (Urahara's, Sōkyoku): painted-sky ceiling = a 1-voxel `painted_sky` layer over 3-4 voxels of
  rock; brown crags and spires; dead trees (`terrain-and-nature.md`).
- **Hell:** basalt `#1C1919`, lava, indestructible chains; Gates of Hell as a hand-built set piece.

---

## 9. Collapse recipes (locations §4) - what to model so it fails right

| Archetype | Members to model | Expected failure (verify in the destruction playground) |
|---|---|---|
| Japanese wooden house | sill on stone footing, 1×1 posts every 1.8-2.7 m inside 2-voxel walls, 2nd-floor joists, roof purlins + tiles | remove ground-floor posts on one side → upper storey and roof tilt and drop as 1-3 fragments; tiles slide off first as debris; paper/glass burst outward; burns fast |
| RC mid-rise | columns on a 6 m grid, 2-3-voxel slabs, shear walls at stair cores, balcony cantilevers | diagonal `cut` → the upper block **slides along the cut plane**, then topples (the signature image); losing ≥ 60 % of a floor's columns → the stack above pancakes; Cero `bore` → clean round tunnel with charred rim |
| Steel girder bridge | piers, bearings, 2-3 girder spans, deck slab | pier destroyed → adjacent spans hinge down into the river; deck cracks at span joints; railings bend |
| Utility pole + wires | pole prop, crossarms, transformer can, rope-physics wires | snaps at the impact height; wires whip and spark |
| Seireitei wall segment | stone plinth + plaster body + tiled coping; pilasters every 4-6 m | breaks per panel between pilasters into 1-2 m plaster blocks; coping tiles cascade; body-shaped through-holes when someone is thrown through |
| Seireitei hall | stone platform, 3 m wooden column grid, tie beams, heavy irimoya roof | when ≥ 40 % of columns go, the roof drops nearly intact, then shatters on impact |
| Sekkiseki wall / gate | monolithic slabs 20-30 m | chips only; a slab moves as one rigid fragment (a giant lifting the gate) |
| Slender tower (Senzaikyū, Las Noches, Silbern rear tower) | shell + floors every 4-8 m + core | cut high → top topples in the impulse direction; cut at the base → falls as 3-6 fragments split along floors; a Getsuga leaves a crescent gap |
| Shell dome (Las Noches) | 1.5-2 m shell + internal ribs every 20-30 m | holes grow panel by panel; panels whose ribs are all cut fall inward as curved slabs; Cero Oscuras deletes a sector (scripted carve) |
| Mesa / cliff (Sōkyoku Hill) | solid rock with an undercut overhang | undercut further → overhang breaks off in large rock fragments |
| Crystal tree (quartz) | segmented trunk + angular branches | no bending: shatters at the hit point; segments above fall and burst into shards |
| Ice overlay (Wandenreich) | ice crust, icicles, stalagmites over stone | ice shards off first; fire melts it to water → steam |
| Floating island | disc + hidden anchor core + bridges | see §8 |

Collapse test (required for every new building type): in the destruction playground run (1) a diagonal `cut`
through the upper third, (2) removal of one floor's columns/posts, (3) a Cero `bore` through the facade, (4) fire
for wood/thatch. Capture before/after frames; fail if parts hover, the whole building falls as one rigid block,
or fragments have no internal floors/walls.

## 10. Performance notes
- Prefer shader patterns and ramps over extra materials so greedy meshing merges faces (locations §5 rule 7).
- Tall towers and hollow shells are the expensive items - cap tower counts per map (locations per-map numbers);
  long thin structures (walls, bridges, corridors) are cheap per metre.
- Keep massive interiors solid and uniform (uniform bricks cost nothing; PLAN §5.2).
- Furnish interiors only where fights enter.
