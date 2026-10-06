# Locations & map design reference

Design reference for every place in *Bleach* that can become a playable map, an arena or a story set piece in
the voxel brawler. For each location: what it is in canon, which fights happened there (story-mode stages),
what must exist for it to be recognisable, scale, palette, materials, lighting, and a **procedural generator
spec** (layout → terrain → structures → props → set pieces → weathering → bake, matching `PLAN.md` §13.1),
with destruction/collapse rules and memory estimates.

Sources: cleaned Bleach Wiki dumps (location pages, event/battle pages, character pages) — URLs are listed per
section and in §14. Everything is paraphrased. Where canon gives no number, the value is **marked `est.`** (an
informed estimate from manga/anime framing). Hex colours are **approximations** of the anime/manga colouring,
not official values.

---

## 0. Conventions

| Item | Rule |
|---|---|
| Units | metres (m). Generators work in metres and rasterise at the map's voxel size (`PLAN.md` §5.1). |
| Voxel size | Research brief: **0.25 m**. `PLAN.md` §5.1 (post look-dev): **0.125 m default**, 0.25 m override for big maps. Each map below states a recommended size. |
| Conversions | 0.25 m → 4 vx/m, **16 vx per m² of surface**, **64 vx per m³**, chunk (32³) = 8 m cube. 0.125 m → 8 vx/m, 64 vx/m², 512 vx/m³, chunk = 4 m cube. Going 0.25 → 0.125 multiplies surface voxel counts ×4 and solid counts ×8. |
| Human scale | 1.74 m character ≈ 7 vx (0.25) / 14 vx (0.125) tall. Door 2.0–2.2 m. Japanese floor-to-floor 2.8–3.0 m. Jidanbō (gatekeeper giant) is **9.88 m** — the only hard canon number for Seireitei architecture scale. |
| Memory estimate | `PLAN.md` stores a non-uniform chunk densely (32 KB); uniform chunks (all air / all solid) cost ~0. **Dense chunks ≈ (W/c)·(D/c)·L**, with c = chunk edge and L = average number of non-uniform chunk layers per column (table in §5). Memory ≈ dense chunks × 32 KB. |
| Flags | `est.` = estimate · `anime-only` · `movie (non-canon)` · `novel` · `design` = a game-design invention, not canon. |
| Colours | sRGB hex. Palettes list a base and 2–3 ramp shades for the `PLAN.md` §5.3 colour ramps. |

Section template for each map: **Canon** · **Story stages** · **Must-haves** · **Scale** · **Palette** ·
**Materials** · **Light / sky / weather / ambience** · **Generator** · **Spawns** · **Destruction & collapse** ·
**Performance** · **Gameplay hooks** · **Sources**.

---

## 1. Map list (drop-in for `PLAN.md` §13 `MAP_LIST_SECTION`)

Memory column = dense-chunk estimate from §5 (rough planning numbers, ±40 %).

| id | Map | World · arc | PLAN milestone | Voxel | Bounds W×H×D (m) | Dense chunks / MB | Signature stages |
|---|---|---|---|---|---|---|---|
| `urahara_study` | Urahara's underground training ground | Human World (under the shop) | M8 (**recommend first**, see §13) | 0.125 | 128×48×128 | ~3.3k / ~105 | Ichigo vs Ururu, Shattered Shaft, Ichigo vs Urahara, Chad & Renji |
| `karakura` | Karakura Town district | Human World · Agent → TYBW | M5 vertical slice | 0.25 (0.125 for a 128 m block arena) | 320×80×320 | ~4k / ~125 | Fishbone D, Grand Fisher, Menos, Byakuya in the rain, Grimmjow ×2, Yammy & Ulquiorra |
| `fake_karakura` | Fake Karakura Town + 4 transfer pillars | Human World (replica) · Fake Karakura | M7 | 0.25 | 320×112×320 | ~3.6k / ~115 | Pillar guards, captains vs Espada, Aizen vs everyone |
| `karakura_ss` | Real Karakura on the Rukongai outskirts | Soul Society · Fake Karakura | M7 | 0.25 | 384×160×384 | ~4.5k / ~145 | Gin vs Aizen, Ichigo vs Aizen (Mugetsu) |
| `seireitei` | Seireitei: West Gate + white wall maze + barracks | Soul Society · Soul Society arc | M6 | 0.25 | 256×64×256 | ~2.3k / ~75 | Jidanbō, Ikkaku, Kenpachi, Mayuri vs Uryū |
| `sokyoku` | Sōkyoku Hill, halberd & Senzaikyū | Soul Society · Soul Society arc | M6 (+ title diorama) | 0.25 | 320×224×320 | ~4.5k / ~145 | Rukia's execution, Ichigo vs Byakuya, Aizen's betrayal |
| `sokyoku_study` | Study Chamber under Sōkyoku Hill | Soul Society | M6 | 0.125 | 128×48×128 | ~3.3k / ~105 | Ichigo's 3-day Bankai, Renji's Bankai |
| `muken` | Muken (8th level of the underground prison) | Soul Society | M9 | 0.125 | 128×64×128 | ~1.7k / ~55 | Kenpachi vs Unohana |
| `rukongai` | Rukongai + Shiba house & cannon | Soul Society | M8 | 0.25 | 384×96×384 | ~4.1k / ~130 | Ganju's gang, cannon launch, Hollowfication incident (Fugai forest) |
| `seireitei_tybw` | Invaded Seireitei (blue fire pillars) / replaced by the Wandenreich city | Soul Society · TYBW | M9 | 0.25 | 256×160×256 | ~3k / ~100 | Yamamoto vs Royd/Yhwach, Byakuya vs Äs Nödt, Hitsugaya vs Cang Du |
| `hm_desert` | Hueco Mundo White Sands | Hueco Mundo | M7 | 0.25 | 384×128×384 | ~3.5k / ~110 | Runuganga, Ichigo & Ayon vs Quilge |
| `menos_forest` | Forest of Menos | Hueco Mundo (underground) | M7 | 0.25 | 256×128×256 | ~4.2k / ~135 | Gillian horde (anime-only arc) |
| `lasnoches_dome` | Las Noches dome rooftop | Hueco Mundo | M7 | 0.25 | 256×192×256 | ~3.6k / ~115 | **Ichigo vs Ulquiorra** |
| `lasnoches_interior` | Las Noches interior under the fake sky | Hueco Mundo | M7 | 0.25 | 320×160×320 | ~4.6k / ~150 | Grimmjow final fight, Kenpachi vs Nnoitra |
| `lasnoches_halls` | Las Noches corridors, Tres Cifras, Espada palaces | Hueco Mundo | M7 | 0.125 | 128×48×128 per hall | ~4k / ~130 | Dordoni, Cirucci, Gantenbainne, Aaroniero, Szayelaporro, Zommari |
| `wandenreich` | Wandenreich city & Silbern (Schatten Bereich) | Soul Society (shadow) · TYBW | M9 | 0.25 | 256×256×256 | ~3.6k / ~115 | 2nd invasion fights, Ichigo vs Uryū at the tower |
| `wahrwelt` | Wahrwelt | Royal Realm · TYBW finale | M9 | 0.25 | 384×320×384 | ~4.5k / ~145 | Final Yhwach fights, Lille, Gerard, Uryū vs Haschwalth |
| `reiokyu_*` | Soul King Palace: Vestibule Road & Greater Palace / Kirinji / Nimaiya / Ichibe'e sub-arenas | Royal Realm · TYBW | M9 | 0.25 | 256×256×256 each | 2.5–4k / 80–125 | Royal Training, Royal Guard vs Schutzstaffel, Ichibe'e vs Yhwach |
| `dangai` | Dangai (Precipice World) | Between worlds | M6 (cheap) | 0.125 | 16×16 cross-section, streamed | ~1.6k / ~50 | Kōtotsu chase, Isshin's Final Getsuga training |
| `hell` | Gates of Hell + two Hell levels | Outside the Three Worlds | M10 | 0.25 | 256×256×256 | ~3.5k / ~110 | Szayelaporro (2021 one-shot), Hell Verse fights (movie) |
| `garganta` | Garganta / Valley of Screams transit | Void | transit only | — | streamed strip | small | Arrivals, Hueco Mundo invasion, Royal Realm infiltration |

Small extra arenas (0.125 m, ≤ 96 m): **Visored warehouse + its study chamber**, **Karakura General Hospital
silver training chamber** (Ryūken vs Uryū), **Central 46 assembly hall**, **Kuchiki Manor**, **Shin'ō Academy**.

---

## 2. Cross-world rules (lore → engine)

### 2.1 The worlds and their matter
| World | Canon matter | Engine consequence (`design` where noted) |
|---|---|---|
| Human World | made of *kishi* (spirit-poor matter); ambient reishi lower than the spirit worlds | materials `absorbable = false` (Quincy cannot strip buildings); reishiDensity 0.5 → slower Quincy reishi gathering, air-step works but costs a little more (`design`) |
| Soul Society | made of *reishi* — **voxels are reishi** | `absorbable = true` for almost everything; Sklaverei/`absorb` turns voxels into reishi streams; reishiDensity 1.0 |
| Hueco Mundo | reishi-rich "paradise of sand"; small Hollows feed on ambient reishi | `absorbable = true`; reishiDensity 1.2; sand is granular |
| Schatten Bereich / Wahrwelt | Quincy city built from Seireitei reishi | `absorbable = true`; Yhwach's side gains on absorb (`design`) |
| Soul King Palace | extremely dense reishi (Ichibe'e's city chokes visitors) | `absorbable = true` but high hardness; reishiDensity 2.0 near Ichibe'e's temple (movement/stamina debuff until adapted) |
| Dangai | walls are the Kōryū current; time 2000× denser | walls indestructible + sticky; nothing absorbable |
| Hell | not part of the Three Worlds; its blobs (Jigoku no Rinki) are a non-reishi substance | Hell materials `absorbable = false` (Quincy feel weak there — `design`) |

### 2.2 Sekkiseki & the Shakonmaku (global rule)
- **Sekkiseki** (殺気石, "Spirit Reducing Stone") repels/negates reiryoku. It is rare; most of it forms the
  **Seireiheki** (wall around the Seireitei); it also lines the Shishinrō cells in the Senzaikyū and the old
  Spirit-Sealing execution pits (now garbage dumps).
- Cut faces emit a wave that forms the **Shakonmaku**: a spherical membrane above and below the Seireitei that
  vaporises reishi passing through it; very dense reishi can force through with difficulty; it also blocks
  direct teleport in/out.
- Engine: material flag `reiatsuBlocking`. Spiritual damage types (Kidō, Cero, Getsuga, Heilig Pfeil, Bala,
  reiatsu flares) are multiplied by **×0.05** against it and dissipate in a shower of white sparks; kinetic
  damage (giant axes, thrown fragments, bodies, punches) applies normally against a very high hardness (§3).
  Standing next to Sekkiseki: −50 % reiatsu sensing range, no lock-on through it, reiatsu regen halved; inside a
  Sekkiseki room: regen 0, slow drain (Shishinrō). Fall into a Sekkiseki pit: **no air-step / flight** until out.
- Shakonmaku volume: entering it costs heavy HP/s and pushes back; a **Reishukaku** "cannonball" barrier (see
  Rukongai) or an ultimate with power above a threshold punches a temporary hole.

### 2.3 Transit devices between maps (set pieces & loading transitions)
| Device | Canon look | Use |
|---|---|---|
| **Senkaimon** (穿界門) | Soul Society's single permanent gate stands in a large courtyard on top of a tall tower and throws a beam of white light into the sky when opened (Kidō Corps operate it). Opened ad hoc with a Zanpakutō turned like a key ("Kaijō!"), it appears as shōji doors in mid-air; Jigokuchō (black butterflies, purple wings) guide the traveller. Urahara's version: four tall rectangular pillars wrapped in paper tags slide together into a frame. | Human World ↔ Soul Society transitions; without a Jigokuchō you are dumped into the Dangai |
| **Garganta** (黒腔) | black tear in the sky; inside, a featureless black void with turbulent reishi — travellers must keep creating footholds | Hueco Mundo arrivals; menace set piece over Karakura |
| **Keikaigi** | portal opened between two tall wooden posts set on two rock formations | Urahara's training ground → Hueco Mundo |
| **Tenkai Kecchū** (転界結柱) | four huge pillars at the corners of a one-Reiri-radius area swap that whole area with another of equal size via a giant Senkaimon | Fake Karakura (§6.8) |
| **Kakaku Taihō** | Kūkaku's tall black chimney-like cannon | Ryoka launch into the Seireitei; launching the Tenchūren back up |
| **Tenchūren** | Royal Guard's huge pillar-palanquin; slams down on arrival; cannot fly back on its own | Soul King Palace arrivals |
| **Chōkaimon** | Royal Guard gate to the Human World, needs synced round-trip timing | Ichigo's night trip home during Royal Training |
| **Gates of the Sun** | ornate metal plates, activated with Keys of the Sun | Wandenreich fast travel / invasion entry |
| **Valley of Screams rail room** | a Valley of Screams stuffed in a box (Riruka) and shaped into a room on rails (Yukio) | stealth infiltration of the Royal Realm (TYBW) |
| **Gates of Hell** | huge chained double doors with bandaged skeleton figures | appear when a sinful Hollow is cut down (§12) |

### 2.4 Universal ambience props
Jigokuchō swarms (Soul Society), Pluses with chains of fate (Human World), Hollow howls and cracks in the sky
(Garganta foreshadowing), reishi motes (air-step footholds are faint pale-blue hexes), dust motes in shafts of
light, Kidō Corps barrier panels (constructs) during story events.

---

## 3. Shared material library (starting values for `PLAN.md` §5.3)

Hardness `H` is in the same units as attack power (break if `power × falloff > H`). Suggested anchor: an
unseated Shinigami slash ≈ 40, a lieutenant Shikai special ≈ 150, a captain Shikai ≈ 400, a Bankai special ≈
1 500, an ultimate ≈ 6 000+. Toughness `T` = crack threshold as a fraction of `H`. Density in kg/m³ (fragment
mass). `Abs` = absorbable by Quincy Sklaverei; `dep.` = follows the world rule of §2.1 (Human World no, Soul
Society / Hueco Mundo / Wandenreich yes).

| id | Material | Ramp (base → shades) | Pattern | H | T | Density | SFX | Flags / transforms | Abs |
|---|---|---|---|---|---|---|---|---|---|
| `paper` | shōji/fusuma paper, posters | `#F4EFE3` `#E3DCCB` `#CFC6B2` | none | 1 | 1.0 | 300 | wood | flammable, transparent-ish | dep. |
| `glass` | window glass | `#A9CBE0` `#8DB4CF` `#CFE4F1` | none | 4 | 0.9 | 2500 | glass | transparent, shatters to shards | no (HW) |
| `wood_light` | Japanese timber walls/posts | `#9C7752` `#86643F` `#B38B62` | wood grain | 18 | 0.5 | 600 | wood | flammable → `charred` → ash | dep. |
| `wood_dark` | aged shop timber, verandas | `#5E4632` `#4A3626` `#76593F` | wood grain | 20 | 0.5 | 650 | wood | flammable | dep. |
| `thatch` | Rukongai roofs | `#A68B5B` `#8C7348` `#BFA474` | straw | 6 | 0.7 | 250 | wood | very flammable | yes |
| `kawara` | ceramic roof tiles | `#454E5C` `#353D49` `#5E6878` | roof tile | 14 | 0.8 | 1900 | concrete | sheds as sliding tile debris | dep. |
| `plaster` | Seireitei/house plaster | `#F0ECE3` `#DCD5C7` `#C8C0B0` | plaster mottling | 30 | 0.5 | 1700 | concrete | paintable (scorch/blood) | yes (SS) |
| `stone_plinth` | wall bases, steps, lanterns | `#BDB6A8` `#A39C8E` `#D2CCBF` | brick courses (large) | 55 | 0.4 | 2500 | concrete | — | yes (SS) |
| `concrete` | roads' kerbs, walls, school | `#B4B0A6` `#9C988E` `#CBC7BE` | mottling | 50 | 0.4 | 2400 | concrete | — | no (HW) |
| `rc_concrete` | reinforced slabs/columns | `#C2BEB4` `#A6A296` `#D6D2C9` | mottling | 75 | 0.3 | 2500 | concrete | rebar sparks on cut | no |
| `asphalt` | roads | `#55585E` `#474A4F` `#6A6D72` | fine noise | 35 | 0.4 | 2300 | earth | lane paint as `paint` layer | no |
| `steel` | bridges, poles' fittings, railings | `#8A9099` `#6E747D` `#A9AEB5` | none | 120 | 0.2 | 7850 | metal | bends (fragment) rather than crumbles | no |
| `soil` | topsoil/earth | `#7A5B3E` `#654A31` `#8E6C4B` | noise | 8 | 0.6 | 1500 | earth | — | dep. |
| `grass` | lawns, embankments (top layer) | `#78A24A` `#628A3A` `#8DB85A` | blades tint | 6 | 0.6 | 1400 | earth | flammable (burns to soil) | dep. |
| `rock_brown` | Study Chamber crags | `#A1805F` `#8A6B4E` `#B99872` | strata | 45 | 0.5 | 2400 | earth | — | HW: no / SS: yes |
| `rock_mesa` | Sōkyoku Hill | `#A79E8D` `#8C8374` `#BFB7A6` | strata | 70 | 0.5 | 2600 | earth | — | yes |
| `sekkiseki` | Seireiheki, Shishinrō, sealing pits | `#D9D5CC` `#BFBAB0` `#ECE9E2` | huge ashlar blocks | 3000 | 0.2 | 3000 | concrete | `reiatsuBlocking`, spirit dmg ×0.05 | **no** |
| `sand_white` | Hueco Mundo sand | `#EEECE6` `#D9D7D2` `#C3C6CF` | sand ripple | 2 | 1.0 | 1600 | sand | granular CA (angle of repose 34°); heat ≥ Cero → `glass_sand` (`design`) | yes |
| `rock_hm` | Hueco Mundo boulders/mesas | `#C8C5BE` `#A9A69F` `#DEDBD4` | strata | 60 | 0.5 | 2500 | earth | — | yes |
| `quartz` | quartz "trees" | `#E4E9EE` `#C6CED8` `#FFFFFF` | quartz facets | 40 | 0.95 | 2650 | glass | brittle: shatters into shard debris, faint emissive edges | yes |
| `ln_stone` | Las Noches white walls | `#F2F0EB` `#D8D8D6` `#C2C5CC` | plaster mottling | 90 | 0.4 | 2600 | concrete | **not** Sekkiseki (Uryū confirms) | yes |
| `ln_shell` | Las Noches dome shell | outer `#F0EEE9` / inner fake-sky `#7FB6E6` | inner face emissive sky | 110 | 0.35 | 2600 | concrete | inner face = emissive `fake_sky` paint | yes |
| `ice_wr` | Wandenreich ice crust | `#CFE7F3` `#9CC3DB` `#F2FBFF` | ice cracks | 25 | 0.9 | 917 | ice | transparent, meltable → water → steam | yes |
| `wr_stone` | Wandenreich/Silbern stone | `#E9EDF1` `#C3CBD5` `#8C99A8` | ashlar | 100 | 0.4 | 2600 | concrete | — | yes |
| `palace_stone` | Soul King Palace | `#ECE6DA` `#D3CBBB` `#F7F3EA` | ashlar | 150 | 0.4 | 2700 | concrete | — | yes (slow) |
| `koryu` | Dangai walls (current) | `#3A1F3D` `#5C2D63` `#7A3E7F` | flowing streaks (animated) | ∞ | — | — | reishi | indestructible, **sticky trap** | no |
| `bone` | bones, skeleton reliefs | `#E8E0CC` `#CFC6B0` `#F5EFE0` | none | 20 | 0.7 | 1900 | bone | — | dep. |
| `hell_rock` | Hell basalt | `#1C1919` `#2B2523` `#3A302C` | strata | 90 | 0.4 | 2900 | earth | — | **no** |
| `lava` | Hell lava | `#FF4E12` `#FFB347` `#5A1A0A` crust | emissive flow | — | — | 2600 | earth | liquid, emissive, burns, revives Togabito | no |
| `chain_hell` | Hell chains | `#5C5A57` `#3F3D3B` `#7A3B22` rust | links | ∞ | — | 7800 | metal | indestructible | no |
| `water` | rivers, ponds, onsen | `#4E86A8` `#3B6E8F` `#7FB0C9` | ripples | — | — | 1000 | water | liquid CA; freezes → `ice` | — |
| `bedrock` | map floor | `#2E2B28` | none | ∞ | — | — | earth | indestructible anchor | no |

Material **states** (palette rows, no remesh): `charred`, `molten` (emissive), `frozen`, `wet`, `bloodied`,
`rotted` (Respira grey-brown `#8D8676` → dust), `inked`, `reishi-glow` (being absorbed, `#7EC8F8`).

---

## 4. Destruction archetypes (build them like real structures)

`PLAN.md` §6 handles carving, connectivity and fragments; these recipes make each structure type **fail the
way it does in Bleach**. "Members" are what the generator must model so the structural search finds them.

| Archetype | Members to model | Failure behaviour |
|---|---|---|
| **Japanese wooden house** (Karakura, Rukongai) | sill on stone footing, posts every 1.8–2.7 m inside walls, 2nd-floor joists, roof purlins + tiles | Remove ground-floor posts on one side → upper storey + roof tilt and drop as 1–3 fragments; tiles slide off first as debris; paper/glass burst outward; burns fast. |
| **RC mid-rise** (mansions, school, hospital) | columns on a 6 m grid, 0.25–0.3 m slabs, shear walls at stair cores, balcony cantilevers | Diagonal `cut` → upper block **slides along the cut plane** then topples (signature image); losing ≥ 60 % of a floor's columns → pancake of the stack above; Cero `bore` leaves clean round tunnels with charred rims; fragments > 400 k vx split per floor. |
| **Steel girder bridge** | piers, bearings, 2–3 girder spans, deck slab | Pier destroyed → adjacent spans hinge down into the river; deck cracks along span joints; railings bend. |
| **Utility pole + wires** | 0.35 m concrete pole (voxel), crossarms, transformer can, wires as rope physics (non-voxel lines) | Snaps at the impact height; wires whip and spark (1 s stun on contact, `design`). |
| **Seireitei wall segment** | stone plinth (1 m) + plaster body + tiled coping; pilasters every 4–6 m | Breaks per panel between pilasters into 1–2 m plaster blocks; coping tiles cascade; through-holes when a body is thrown through (Kenpachi bursting through walls). |
| **Seireitei hall** (barracks) | stone platform, wooden column grid (3 m), tie beams, heavy tiled irimoya roof | Heavy roof makes collapse dramatic: when ≥ 40 % of columns go, the roof drops nearly intact, then shatters on impact. |
| **Sekkiseki wall / gate** | monolithic ashlar slabs 20–30 m wide | Chips only; a slab only moves as a whole (rigid fragment) — e.g., the gate lifted by a giant. |
| **Slender tower** (Senzaikyū, Las Noches towers, Silbern rear tower) | shell + floors every 4–8 m + core | Cut high → top section topples in the impulse direction; cut at the base → whole tower falls as 3–6 fragments split along floors; Getsuga through a tower leaves a crescent gap. |
| **Shell dome** (Las Noches) | outer shell 1.5–2 m + internal ribs (meridians/parallels every 20–30 m) | Holes grow panel by panel (rib-bounded); panels whose ribs are all cut fall inward as curved slabs onto the interior; massive Cero (Cero Oscuras) can delete a whole sector (scripted large carve). Standing on it is always allowed. |
| **Mesa / cliff** (Sōkyoku Hill) | solid rock; undercut overhang | Undercut further → overhang breaks off in large rock fragments; cliffs carve into terraces. |
| **Crystal tree** (quartz) | segmented trunk + angular branches | No bending: shatters at hit point; segments above fall and burst into shards. |
| **Sand** | granular voxels | Craters slump to 34°; explosions throw sand clouds; buried things get exposed. |
| **Ice overlay** (Wandenreich) | ice crust on stone, icicles, stalagmites | Ice shards off first, revealing stone; fire melts to water that runs off/evaporates. |
| **Floating island** (Soul King Palace, Wahrwelt) | disc + hidden anchor core at the centre + bridges | Bridges cut → island stays (floating is reishi-held); destroying the anchor core tilts and drops the island (`design`, used for the Wahrwelt tower-fall set piece). |
| **Giant set-piece objects** (Sōkyoku halberd, execution scaffold, transfer pillars, Gates of Hell) | hand-built members | Each has a custom rule (see their sections). |

---

## 5. Performance planning

**L table** (average non-uniform chunk layers per column) for the dense-chunk estimate in §0:

| Content | L at 8 m chunks (0.25 m) | L at 4 m chunks (0.125 m) |
|---|---|---|
| Flat or gently rolling ground only | 1.2–1.5 | 1.5–2 |
| Dunes (±15 m) | 1.5–2 | 3–4 |
| Low-rise town (≤ 8 m buildings) | 2–2.5 | 3–4 |
| Mid-rise mix (≤ 35 m) | 3–4 | 5–8 |
| Cave (floor + ceiling shell) | +1 for the ceiling | +1–1.5 |
| Tower / cliff column (h = height in m) | +h/8 per affected column | +h/4 |

Guidelines:
1. **Arenas** (≤ 128–160 m) at 0.125 m; **districts** (256–384 m) at 0.25 m; beyond bounds use low-res backdrop
   rings (`PLAN.md` §13.1).
2. Massive solids (mesa interiors, the Seireiheki core, the ground below 4 m) end up as **uniform chunks** and
   cost nothing; keep generators producing clean solid interiors (no noise caves unless wanted).
3. Furnish interiors only where fights enter (set pieces + ~20 % of houses); other buildings get cheap
   partitions. The **Fake Karakura replica can have empty interiors** (`design`, ~15 % fewer dense chunks).
4. Giants (Menos Grande, Gillian herds, Kushanāda, Runuganga, Ayon) use 4–8 vx/m models (`PLAN.md` §5.1).
5. Cellular automata (sand slump, water, fire, decay) run only in "awake" regions around recent edits.
6. Long thin structures (wall mazes, bridges, corridors) are cheap per metre; tall towers and hollow shells are
   the expensive items — cap tower counts per map (numbers per section).
7. Prefer shader-side variation (hash shading, patterns) over many materials so greedy meshing merges faces.

---

## 6. Human World

### 6.1 Karakura Town (空座町) — `karakura`

**Canon.** Ichigo's hometown: an ordinary small city in western Tokyo (one anime scene places it near Yokohama),
average population, mostly unaware of spirits. The Shinigami file it as **District 3600**, under the 13th
Division, normally with one stationed Shinigami. It is the current **Jūreichi** — the spot in the Human World
with the densest concentration of spiritual beings — which is why Aizen wanted it: forging an Ōken needs
100,000 souls and a Jūreichi of one spiritual *ri* radius. Urahara's shop, the Visored hideout and Isshin's
clinic all sit here; Naruki City (Xcution HQ) borders it to the west, Kagamino City is ~20 km east.

Official map landmarks (Character Book *SOULs*, no coordinates given): Kurosaki Clinic · Tatsuki's home ·
Furin Hall karate dojo · Inoue family home · Matsukura Hospital (abandoned) · Urahara Shop · Karakura High ·
**Onose River** · Sunflower Sewing · Karakura General Hospital · Mizuiro's & the Asanos' homes · **Karakura
shopping street (shōtengai)** · old **Karakura Honchō station** · **Karasu River** · Sado's home · Hirohyaku
Supermarket · Orihime's apartment · **Tsubakidai Park** · Uryū's home · **Karakura Community ("Fureai") Park** ·
Mashiba Middle School · **Yumisawa Children's Park** · remains of the Sukari Building.

**Story stages** (time of day in brackets)
| Arc | Stage | Where |
|---|---|---|
| Agent of the Shinigami | Rukia & Ichigo vs **Fishbone D** — Ichigo becomes a Shinigami (night) | Kurosaki Clinic → street |
| | Ichigo vs **Acidwire** (Sora) (night) | Orihime's apartment & nearby |
| | Ichigo vs **Shrieker** — first Gates of Hell | streets |
| | Ichigo vs **Grand Fisher** on Masaki's death anniversary (rain preset suggested — rain is the motif of her death) | hillside cemetery |
| | Ichigo & Uryū vs Hollow swarm from Hollow bait → **Menos Grande** through a sky crack (day) | whole town, Menos over a park — `Hollow Horde` mode |
| | Ichigo vs **Byakuya**, Uryū vs **Renji** — Rukia's arrest (rainy night) | residential street |
| Arrancar | Chad, Orihime, Ichigo, then Urahara & Yoruichi vs **Yammy & Ulquiorra** (day) | the park they crash into (crater) |
| | Grimmjow's raid (night): Ichigo vs **Grimmjow**, Rukia vs Di Roy, Hitsugaya vs Shawlong, Rangiku vs Nakeem, Ikkaku vs Edrad, Renji vs Yylfordt (near the Urahara Shop) | streets, rooftops, sky |
| | **Grimmjow rematch** (Hollow mask), Luppi vs Hitsugaya/Rangiku/Ikkaku/Yumichika, Urahara vs Yammy (day) | Garganta over the park, sky |
| | Visored training: Ichigo vs Hiyori, vs his inner Hollow | Visored warehouse & its underground chamber |
| | Uryū vs **Ryūken** (power restoration) | hospital silver chamber |
| Fullbring | Ichigo vs Ginjō / Tsukishima / Xcution members | Naruki City HQ, Tsukishima's mansion (out of scope here) |
| TYBW | Ichigo vs **Asguiaro Ebern** (first Quincy) | Karakura streets |
| Hell (2021 one-shot) | Renji & Ichigo vs **Szayelaporro**, the Jailer of Hell | Human World, 14 years after his death |

**Must-haves.** Concrete utility poles with sagging wire bundles on every street · narrow lanes lined by
1.2–1.6 m block walls · tiled-roof houses mixed with boxy modern ones · vending-machine clusters glowing at
night · convex traffic mirrors at blind corners · a wide river with grassy levees, a girder road bridge and a
footbridge · a park with a playground · a hillside cemetery · a covered shopping arcade · an elevated railway with
a station · a few 6–12-storey "mansions" · Kurosaki Clinic, Urahara Shop, Karakura High.

**Scale.** Canon: if a spiritual ri equals a traditional ri (3.93 km — speculative), the transferable town disc
is ~7.9 km across. **Game:** 320 × 320 m district (0.25 m) + low-res skyline/hill ring to ~1.5 km; or a
128 × 128 m "clinic block" arena at 0.125 m. Heights: houses 7–9 m to ridge; apāto 6–7 m; mansions 18–36 m;
school 15 m; hospital ~30 m; rail viaduct deck 8 m; poles 11–12 m.

**Palette (est.)**
| Element | Base | Ramp |
|---|---|---|
| Asphalt / lane paint | `#55585E` | `#474A4F` `#6A6D72` · white `#EDEDED`, yellow `#E2B93B` |
| Block walls / kerbs | `#B4B0A6` | `#9C988E` `#CBC7BE` |
| House walls (mix) | cream `#EFE8D8`, beige `#E3D5B8`, grey `#D7DBDF`, white `#F4F1EA` | darker 8–12 % |
| Roofs | kawara `#454E5C`, brown `#5B3F33`, charcoal `#2E3440`, metal `#7C8A99` | ±8 % |
| Timber / doors | `#7A5A3E` | `#5E4632` `#946F4E` |
| Glass | `#A9CBE0` | `#8DB4CF` |
| Grass / trees | `#78A24A` / `#4E7D3A` | `#628A3A` / `#3E6B2F` `#6E9B4B`; cherry `#F3C1D0` |
| River water | `#4E86A8` | shallows `#6FA3B8`, foam `#E8F1F5` |
| Utility poles / wires | `#8E8C86` / `#1E1E1E` | — |
| Vending machines | red `#D93A3A`, blue `#2F6DB5`, white `#F2F2F2` | lit panels emissive |

**Light / sky / weather presets**
| Preset | Sun / key | Sky gradient (zenith → horizon) | Extras |
|---|---|---|---|
| `afternoon` | sun 35°, `#FFE6C2` | `#6FA8DC` → `#CFE5F5` | fog `#CFDCE6` from 150 m |
| `dusk` (the Bleach orange) | sun 6–10°, `#FF9A55` | `#2E3F70` → `#E9845E` → `#FFD09A` | long shadows, 20 % windows lit `#FFD9A3` |
| `night` | moon `#C8D4FF` (low) | `#0E1428` → `#253055` | LED street lamps `#F2F6FF`, sodium `#FFC27A`, vending machines, 40 % windows lit `#FFE6B0` |
| `rain_night` | none (overcast `#2A3140`) | flat | rain streaks, surfaces ×0.7 darker & glossy, puddles, distant thunder |
| `festival` | night | night | paper lanterns `#FF6B3D`/`#FFD27A` along the Onose, fireworks (canon summer fireworks spot) |

**Generator** (`maps/karakura/generator.ts`)
1. **Layout**
   - *River:* the **Onose** as a spline across the map: water 25–35 m wide, flood terraces 8–12 m each side
     (lawn, a few trees), levee crest path 4 m at +1.5 m; optional **Karasu** as a 10–15 m concrete canal.
   - *Railway:* gentle curve (R ≥ 400 m) on an 8 m viaduct along one edge; **Karakura Honchō** station
     (120 × 18 m, two side platforms); General Hospital beside it (canon).
   - *Roads:* two arterials 14 m (2 × 3.5 m lanes, 1.5 m shoulders, 2 m sidewalks) forming a skewed cross, one
     crossing the river; collectors 8 m in a perturbed grid (blocks 60–100 × 40–70 m, ±8° jitter, some curving
     with the river); residential lanes 4–5 m (no sidewalk, white edge line, painted 止まれ at junctions);
     2–3 m alleys and dead ends.
   - *Zoning:* within 120 m of the station → mid-rise + shops + shōtengai (150–200 m covered street); arterial
     frontage → 2–4-storey shop-houses; interiors → houses (70 %), apāto (20 %), corner shops (10 %);
     institutional blocks: school 180 × 140 m, hospital 120 × 90 m; parks: Fureai 100 × 80 m (lawn, trees,
     pond), Tsubakidai 50 × 40 m, Yumisawa playground 25 × 25 m; cemetery terraces 60 × 40 m on the hill.
   - *Landmark constraints:* Clinic on a corner lot along a collector, 250–450 m from the school; Urahara Shop
     at the edge next to a vacant patch; Visored warehouse in an industrial/vacant lot; Orihime's apāto in
     the residential band; hospital at the station.
2. **Terrain** — flat base sloping 1–2 % to the river; one 20–30 m hill in a corner (cemetery + small shrine
   with a vermilion torii `#C8352B` and stone stairs); strata: paving 0.25 m → soil 1–2 m → gravel → bedrock
   at −6 m (bottom 1 m indestructible).
3. **Structures** (lot grammar: recursive OBB split, frontage 8–12 m, depth 12–18 m, 0.5–1 m setbacks)

   | Type | Footprint (m) | Height | Share | Notes | vx @0.25 |
   |---|---|---|---|---|---|
   | Detached house | 7–10 × 6–9 | 2F, 7–8.5 m ridge | 55 % | kawara gable/hip 60 %, metal 25 %, flat 15 %; genkan canopy; balcony; block wall + gate | 12–18 k |
   | Apāto | 16–20 × 6–7 | 2F, 6.5 m | 15 % | external steel stair + open corridor, laundry balconies | 18–26 k |
   | Mansion | 25–40 × 10–14 | 6–12F × 3.0 m | 8 % | RC frame (columns 6 m grid), continuous balconies, rooftop tank | 150–300 k |
   | Shop-house | 5–7 × 10–14 | 2–3F | 12 % | roll-up shutter, signboard, awning, AC units | 10–20 k |
   | Convenience store / supermarket | 15 × 12 / 40 × 30 | 1F, 4.5 m | 2–4 | glass front, generic (non-brand) sign band | 15 k / 60 k |
   | Covered arcade | 6–8 m street × 150–200 m | roof 8–9 m | 1 | polycarbonate on steel arches, hanging banners | ~120 k |
   | Warehouse | 40 × 25 | 9–11 m | 2–4 | corrugated steel, roll doors | ~40 k |
4. **Props** — utility poles Ø0.35 × 11–12 m every 30–40 m (alternating sides; crossarms 1.8 m; transformer
   cans; 3–6 rope-physics wires + house drops) · street lamps every 25–35 m · vending machines 1.0 × 0.8 × 1.85
   m in clusters of 2–4 · traffic mirrors Ø0.8 on 2.5 m posts at lane junctions · horizontal 3-lamp traffic
   lights on arterials · parked kei cars 3.4 × 1.5 × 1.6, sedans 4.6 × 1.7 × 1.45, vans · bicycles · red
   mailboxes · garbage nets · benches · playground (slide, swings, jungle gym, sandbox) · street trees 8–14 m
   every 10 m on arterials · laundry poles, AC units, satellite dishes, potted plants (facade grammar) ·
   family graves 0.7 × 0.7 × 1.3 m on the hill.
5. **Set pieces** — Kurosaki Clinic (§6.2), Urahara Shop (§6.3), Karakura High (§6.4), river & bridges, parks,
   cemetery, station + hospital, shōtengai (§6.5), Visored warehouse (§6.6).
6. **Weathering** — grime gradient `#8C8170` on the bottom 0.5 m of walls, rust streaks under steel, moss on
   north-facing block walls, asphalt cracks/patches, seasonal leaves or cherry petals, puddles in `rain_night`.
7. **Bake** — spawns, nav grid, one light probe per block; skyline backdrop ring (static low-poly boxes 6–40 m)
   and distant hills.

**Spawns.** Versus: `clinic_front`, `shop_yard`, `school_roof`, `bridge_mid`, `park_lawn`, `cemetery_top`,
`arcade_mid`, `station_platform`. Horde: Garganta tears 60–120 m up over parks and the river; Menos rift 80 m
wide (est.) above the Fureai park.

**Destruction & collapse.** Houses = wooden-house archetype (fire spreads house to house except in rain);
mansions/school/hospital = RC archetype (diagonal slide-off cuts); bridge = girder archetype with river
splash; poles snap and whip wires; cars and bikes are physics props; river water runs the region-limited
water CA (Hitsugaya freezes it, Harribel floods the lanes). Giants (Menos, Yammy) carve as they walk.

**Performance.** 320 m district @0.25: 40 × 40 columns × L≈2.5 → ~4k dense chunks ≈ 125 MB. Block arena
128 m @0.125: 32 × 32 × L≈3.5 → ~3.6k ≈ 115 MB. Interiors only for set pieces + 20 % of houses.

**Gameplay hooks.** Pluses (chains of fate) to Konsō; Hollow bait horde (Uryū's contest); a Shinigami leaves
the Gigai/body lying on the street (a prop that can be knocked around — `design`); captains/lieutenants arrive
with the **limiter** (power sealed to 20 %) and can trigger *Gentei Kaijo* (limit release) as a story event;
Yumichika once asks the SRDI for a **spatial freeze** around a fight — usable as a "no civilian casualties"
toggle (`design` interpretation); the Jūreichi makes Hollow spawns denser here.

**Sources.** wiki/Karakura_Town · Template:KarakuraTown (map key) · Human_World · Arrancar_Invasion ·
Ichigo_Kurosaki_vs_Grimmjow_Jaegerjaquez (+Rematch) · Grand_Fisher · Trials_of_the_Shattered_Shaft (Onose River
fireworks).

### 6.2 Kurosaki Clinic (クロサキ医院) — set piece
**Canon.** Isshin's private clinic and the family home (Isshin, Ichigo, Karin, Yuzu, Kon; Rukia lodges in
Ichigo's closet during missions; later Orihime and Kazui). Isshin handles everything but major surgery; the
twins help as nurses. Sora Inoue died here. Fishbone D smashed into the house in chapter 1 (the family later
believes a truck crashed into it); part of the Acidwire fight happened here.

**Build (est.).** Corner lot 18 × 14 m · building 14 × 10 m, 2 floors × 3.0 m + 2 m roof · ground floor front:
**clinic** (waiting room benches, reception window, exam room with curtained bed, 2–3-bed ward, medicine
shelves), back: kitchen–dining–living with Isshin's **giant poster of Masaki** on the wall · upstairs:
**Ichigo's room** (bed, desk, **sliding-door closet/oshiire** where Rukia sleeps, the street-facing window used
as an entry), the twins' room, Isshin's room · clinic signboard on the façade · small parking bay · block wall.

**Palette (est.).** walls `#EFE9DD` → `#DCD3C2`; frames `#8E9196`; roof `#4D5560`; sign plate `#F7F7F2` with
`#2A2A2A` lettering; doors `#6B4E37`; tatami `#C9C08A`.

**Hooks.** Story opener: start inside Ichigo's room at night → Fishbone D breaches the wall → fight spills into
the street. Post-stage "truck crash" cover story card. The poster is an indestructible easter egg (`design`).

### 6.3 Urahara Shop (浦原商店) — set piece
**Canon.** Looks like a normal shop, but stocks Shinigami supplies; Urahara's base with Tessai, Jinta and Ururu;
Renji lodges here on Human World missions; a small van is sometimes parked outside. Renji vs Yylfordt happened
nearby. Underneath lies the giant training room (§6.7) with a Senkaimon and the Garganta posts.

**Build (est.).** Lot 26 × 22 m on the town edge · single-storey timber shop 12 × 9 m, eaves 3.2 m, tiled gable
roof ridge ~6.5 m · big signboard 浦原商店 across the front · four glass-and-wood sliding doors · inside: low
shelves of dagashi, a raised tatami step where Urahara sits with his fan, back tea room, kitchen, storerooms ·
**floor hatch → 1.5 × 1.5 m shaft with a very long ladder** down to the Study Chamber · packed-earth yard
15 × 12 m (Jinta's bat, Ururu's broom) · the van · low fence.

**Palette (est.).** timber `#5E4632` → `#76593F`; boards `#8A6A4A`; roof `#3C4048`; signboard `#E7DBBF` with
`#151515` characters; yard `#B59B76`.

**Hooks.** Hub/shop interior; the hatch is the map transition to `urahara_study`.

### 6.4 Karakura High School (空座一校) — set piece
**Canon.** In the Gakuenchō area, surrounded by trees; buildings of 1–4 storeys with open areas; the
**railed rooftop is the lunch spot**; sports pitches, a **six-lane running track** and a gym; strong karate
club. Uniform: grey blazer, grey trousers/skirt, white shirt, red bow tie (girls), beige sleeveless jumper. An
absurd number of mid-semester transfers land in Ichigo's class.

**Build (est.).** Campus 180 × 140 m · main block 4F, 65 × 16 × 16 m (classrooms on the sunny side, corridor on
the other, stair towers at both ends, shoe-locker entrance) · annex 3F 50 × 14 m joined by a covered 2F bridge ·
gym 40 × 25 m, arched roof to 12 m · 6-lane track band (7.3 m) around a ~110 × 60 m dirt field with goals ·
rooftop: 1.5 m railing/fence, stair house, water tank · perimeter trees, 2 m fence and gate plate · classroom
8 × 9 m, 30–36 desks, blackboard, windows on two-thirds of the outer wall.

**Palette (est.).** walls `#EDEAE2` → `#D6D2C8`; frames `#7F8C8D`; glass `#9CC3D9`; roof slab `#BDBAB2`; railing
`#6D8C6A`; track `#B4553E`; field `#C8A97B`; gym roof `#5E7D95`; desks `#C9A36B` + legs `#8A9099`.

**Hooks.** Rooftop spawn; glass-heavy RC building = great shatter showcase; desks/chairs as throwables.

### 6.5 River, bridges, parks, cemetery, arcade, station — set pieces
- **Onose River.** Wide, grassy levees; the summer fireworks spot; Orihime chased red dragonflies along its bank.
  Masaki died beside a swollen river while Grand Fisher's lure waited on the bank (canon does not name that
  river — use the Onose, `design`). Main road bridge: 3 spans × ~35 m (est.), 12 m deck, steel girders on
  concrete piers; steel-truss footbridge 2.5 m wide; concrete low-water revetments; stepping blocks optional.
- **Parks.** Fureai (big lawn, trees, pond, public toilet), Tsubakidai (neighbourhood park), Yumisawa
  Children's Park (Hexapodus attacked a Plus there). Pick Fureai as **"the park"** where Yammy and Ulquiorra
  crash down and where the later Garganta opens (`design` choice; canon only says "the park").
- **Cemetery.** Terraced hillside with family graves, stone stairs, a small temple; Masaki's grave → Grand
  Fisher stage.
- **Shōtengai & station.** Covered arcade with banners and shutters; elevated Honchō station; the ~8-storey (est.)
  General Hospital beside it (Ryūken is director).

### 6.6 Small Human World arenas
- **Visored warehouse** — an empty lot in a deserted area; corrugated warehouse ~40 × 25 × 10 m (est.); hidden
  by Hachigen's **Hachigyō Sōgai** barrier (passers-by and animals avoid it; Reiatsu doesn't leak; Orihime walked
  through it). Inside: the Visored's hangout clutter (the "Super Trainer" exercise machine gag) and a hatch to
  an underground **study chamber** like Urahara's. Stages: Ichigo vs Shinji (warehouse), Ichigo vs Hiyori,
  inner-Hollow fight.
- **Karakura General Hospital silver chamber** — Ryūken's secret basement training room built from
  *soul-synthesised silver* and *soul-synthesised glass*: multi-level, upper-level windows look onto grass,
  a handle-less door at the bottom; strong but pockmarked by arrows. Material `reika_silver` (`#C9CED6` →
  `#A7AEB8`, H 140, T 0.3). Stage: Uryū vs Ryūken.

### 6.7 Urahara's underground training ground (勉強部屋, "Study Chamber") — `urahara_study`
**Canon.** A huge chamber under the shop, built by Urahara with Soul Society tech "in a day and a night" as a
copy of the secret playground he and Yoruichi dug under Sōkyoku Hill. Ceiling and walls are **painted like a
cloudy sky**; the floor is **desolate brown, craggy land dotted with dead trees** and rock spires. Lessons:
Ururu's sparring, the **Shattered Shaft** (a deep pit Ururu digs, filled with gas that speeds up Encroachment),
Urahara's Benihime duel where Ichigo's first Getsuga carves a chasm. The Senkaimon to Soul Society is raised here
(four tag-wrapped pillars slide together), and later the Garganta to Hueco Mundo (two wooden posts on rock
formations). Chad trains with Renji here. When Hollowfied Ichigo bursts out of the Shaft, something skids
along the painted ceiling.

**Story stages.** Ichigo vs Ururu (lesson 1) · Shattered Shaft survival (lesson 2: climb out before
Encroachment completes; Tessai's Bakudō binding & falling cube) · **Ichigo vs Urahara** (lesson 3, first
Getsuga) · Senkaimon departure · Chad vs Renji sparring · Mod-Soul trio stage (anime-only) · Training Ground mode.

**Must-haves.** Painted sky ceiling with clouds · brown crags, rock spires, dead trees · the ladder from the
ceiling · the Shattered Shaft · Senkaimon frame · Garganta posts.

**Scale.** Canon: vast (horizon looks far). Game: **128 × 48 × 128 m @0.125** (arena) or 256 × 64 × 256 m
@0.25 (large). Ceiling 40–55 m.

**Palette (est.)**
| Element | Base | Ramp |
|---|---|---|
| Painted sky (ceiling/walls) | `#9ECBEC` | clouds `#F5F8FB`, haze toward walls `#CFE3F2` |
| Ground dust | `#B48C60` | `#9C7650` `#C9A57A` `#7E5F41` |
| Rock spires | `#A1805F` | `#8A6B4E` `#6E543D` `#B99872` |
| Dead trees | `#6B5B4D` | `#4E4237` |
| Pebbles | `#CDB592` | — |
| Senkaimon pillars / tags | `#4A4038` / `#F2EAD3` with `#B3261E` script | — |
| Shaft gas | `#9FA98A` (α 0.4) | — |

**Light.** No sun: bright, even top-light (hemisphere sky `#DCEEFF`, ground `#8A6A4A`), soft shadows under rocks,
light haze; the painted sky is emissive at low intensity.

**Generator**
1. **Layout** — square floor; 3–5 flat dueling clearings (Ø 25–40 m) kept free by Poisson masks; 8–20 rock
   formations (Poisson disc, min 25 m apart).
2. **Terrain** — fBm heightfield ±2–6 m + ridged noise for crags; strata `rock_brown` under 0.5 m of dust;
   bedrock at −8 m. Ceiling = rounded box or spherical cap at 40–55 m, curved walls meeting the floor;
   the inner skin is a **1-voxel `painted_sky` layer over 3–4 voxels of rock** (breaking it reveals dark rock).
3. **Structures** — rock spires (stacked noisy cylinders/mesas, 10–35 m tall, bases 6–20 m, overhangs);
   dead trees 4–9 m (L-system, 2–3 kinks, no leaves); entrance ledge + ladder dropping from a 1.5 m hatch
   in the ceiling.
4. **Props** — training dummies (straw/Hollow targets), Tessai's tools, rocks 0.5–3 m.
5. **Set pieces** — **Shattered Shaft** (Ø 6–8 m, 30–40 m deep est., green-grey gas volume = Encroachment
   field); **Senkaimon frame** (four 2 × 2 × 14 m tagged pillars that slide into a ~10 × 12 m gate, est.);
   **Keikaigi posts** (two 1 m × 12 m timber posts on rock outcrops); **Bakudō cube** (Tessai's giant metal block).
6. **Weathering** — none (it's a set); scatter scuffs.
7. **Bake** — Training Ground hooks: dummy spawner ring, frame-data overlay, **"rebuild" = restoration replay**.

**Spawns.** `ladder_foot`, `clearing_1..n` (opponents 30–50 m apart), `shaft_rim`, `senkaimon`.

**Destruction.** Soft-ish rock (H 45) so craters and Getsuga chasms read clearly; spires topple as big
fragments; the ceiling is breakable (revealing rock), the bedrock skin is not.

**Performance.** 128 m @0.125: 32 × 32 × L≈3.2 (floor + ceiling + spires) → ~3.3k chunks ≈ 105 MB.

**Variants (same generator).** `sokyoku_study` (§7.4: hot spring, cliff cave entrance, ladder) and the Visored
warehouse chamber (§6.6).

**Sources.** wiki/Study_Chamber · Trials_of_the_Shattered_Shaft · Garganta (Keikaigi) · Urahara_Shop.

### 6.8 Fake Karakura Town — `fake_karakura`
**Canon.** To let the Gotei 13 fight Aizen at full power, Urahara and the SRDI built **an exact replica of
Karakura on the Rukongai outskirts** and swapped it with the real town (people included) using **Tenkai Kecchū**
— four huge pillars set at the corners of a one-*Reiri*-radius area, which wrap the area in a giant Senkaimon and
exchange it with an equal space. Aizen arrives to find an empty facsimile; Baraggan learns that **four pillars
at the town's corners** keep the real town in Soul Society and sends Findorr's giant Hollows, then four Fracción,
against them. If a pillar falls, the real town starts returning in a spreading zone (**Tensō Kaiki**), which can
be halted with **stakes driven into the ground** — fragile ones that careless fighting can break. Chōjirō
opens and closes the barrier around the battlefield. After Aizen's defeat Mayuri swaps the towns back.

**Story stages**
| Stage | Matchup |
|---|---|
| Arrival | Yamamoto traps Aizen, Gin and Tōsen in **Jōkaku Enjō** (a sphere of fire in the sky) |
| Pillar defence ×4 | Yumichika vs **Charlotte Chuhlhourne** · Kira vs **Abirama Redder** · Hisagi vs **Findorr Calius** · Ikkaku vs **Choe Neng Poww** (pillar destroyed) → Komamura (Bankai) vs Poww, Iba plants the stakes |
| Sky battles | Suì-Fēng vs Ggio Vega · Ōmaeda vs Nirgge Parduoc · Suì-Fēng, Ōmaeda (+Hachigen) vs **Baraggan** · Hitsugaya (+Lisa, Hiyori) vs **Harribel** · Shunsui & Ukitake (+Love, Rose) vs **Starrk & Lilynette** · Rangiku & Momo vs **Tres Bestias** → **Ayon** (incinerated by Yamamoto) · Komamura & Hisagi vs **Tōsen** · Mashiro & Kensei vs **Wonderweiss** · Yamamoto vs Wonderweiss + **Fura** |
| Finale | Gotei 13 & Visored vs **Aizen** · Ichigo vs **Gin** (rooftops; Kamishini no Yari slices buildings) · Isshin, Urahara & Yoruichi vs Aizen · Ichigo's first Aizen attempt |

**Must-haves.** Identical Karakura layout (same seed) · **no people** · the four pillars · the barrier
boundary · Jōkaku Enjō fire sphere in the sky · the battle mostly happening **in the air** above rooftops.

**Tenkai Kecchū pillar (look not described in the wiki — reconstruct from anime ep. 215–216; values `est.`).**
Tall dark square-section obelisk, base 4 × 4 m tapering to 3 × 3 m, **30–40 m** tall, banded with paper-tag
strips and a vertical Kidō seam that glows; sits on a 10 × 10 m stone footing. Material `pillar_kecchu`
(`#3C3F46` → `#2B2E33`, tags `#F2EAD3`, glow `#9FE3FF`), H 600, T 0.6.

**Scale.** Canon: whole town (km). Game: 320 × 112 × 320 m @0.25, pillars at the four corners of a 260 m
square (inside bounds), sky ceiling 112 m for aerial combat.

**Palette / light.** Karakura palette; `afternoon` preset with towering cumulus `#FFFFFF`/`#DDE3EA`; optional
`late_afternoon` for the Aizen finale. Fire VFX: Ryūjin Jakka `#FF6A1A` → core `#FFE08A`.

**Generator.** Run `karakura` with `replica = true`: civilians off, interiors empty (`design`), shop signs
blank-ish (SRDI copy, `design`), then:
- place 4 pillars on open ground (park lawn, levee lawn, empty lot, a rooftop if no lot fits) — each with a
  guard spawn and a 30 m clearing;
- barrier: translucent wall at the bounds (`#CDE9FF`, α 0.12, hex ripple on contact);
- Jōkaku Enjō: emissive fire sphere Ø 60–80 m (est.) at 80 m above the centre (story only).

**Tensō Kaiki mechanic.** Pillar HP → 0: a dome grows from the pillar at ~10 m/s up to ~120 m (est.). Chunks
inside are **swapped** for the "real town" variant (same layout + furnished interiors + civilians + lit windows);
damage inside it counts as collateral (score penalty / story fail). An ally (Iba) can drive **4 stakes**
(1.5 m, H 30 — fragile) to freeze the boundary; stray hits can break a stake and resume the spread.

**Signature destruction moments.** Gin's Bankai cutting straight through blocks (map-wide `cut`); Baraggan's
**Respira** rotting buildings to dust (`rot`); Starrk's Cero Metralleta carpet; Harribel's water flooding streets;
Hitsugaya's ice over whole rooftops; Komamura's Bankai giant stomping blocks flat; Yamamoto's flames.

**Spawns.** `gotei_line` (hovering 40–80 m over the centre), `espada_garganta` (opposite edge, 60 m up),
`pillar_1..4`, `rooftop_*`.

**Performance.** ~3.6k dense chunks ≈ 115 MB (empty interiors save ~15 %); the "real" swap variant streams
in per affected chunk.

**Sources.** wiki/Senkaimon (Tenkai Kecchū section) · The_Armies_Assemble:_Battle_at_Fake_Karakura_Town ·
The_Gotei_13_&_The_Visored_vs._Sousuke_Aizen · Ichigo_Kurosaki_vs._Gin_Ichimaru · Tetsuzaemon_Iba ·
Karakura_Town/Image_Gallery captions.

### 6.9 The real Karakura on the Rukongai outskirts — `karakura_ss`
**Canon.** While swapped, the real Karakura sits at the edge of the Rukongai. Aizen and Gin reach it through
the Dangai but land "a little way off" because Aizen destroyed the Kōtotsu. Most townspeople sleep, but Keigo and
Tatsuki wake up and Aizen hunts them; Don Kanonji steps in to shield Tatsuki; Gin turns on Aizen; Ichigo arrives from the Dangai and drags Aizen away from
the town; their fight **cuts a mountain in half**, blasts a huge crater, and ends with **Mugetsu** plunging the
land into darkness.

**Generator.** A disc of `karakura` (Ø 240 m, `design`) set into Rukongai outskirts terrain (§7.7): visible
**seam ring** where town ground meets meadow (raw earth edge `#7A5B3E`), rolling hills, scattered
farmhouses, a rocky mountain range 100–200 m high at 300–400 m from the town (cliffs `rock_mesa`).
Set piece: the **mountain-cut** (a pre-authored mountain with a guaranteed clean planar slice when an attack of
Aizen/Ichigo-tier power passes through). **Mugetsu event:** sky and light ramp to near-black (`#05050A`,
fog density ×6) for ~6 s, then a single black crescent slash.

**Light.** Late afternoon `#FFD8A8` → dusk; Rukongai sky `#86C1EC`.

**Performance.** 384 m @0.25: ~4.5k dense chunks ≈ 145 MB (mountains as uniform interiors).

---

## 7. Soul Society

Soul Society's "East Branch" (the one in the story) = the **Seireitei** at the centre and the **Rukongai**
around it; life looks like feudal Japan with odd pockets of high tech. Oceans exist but very far away.

### 7.1 Seireitei (瀞霊廷) — `seireitei`

**Canon.** A large circular walled city at the centre of Soul Society, home of the Shinigami and the noble
houses. Four great gates, guarded by giant gatekeepers, are said to be **ten days' walk apart**; each gate is so
heavy only a giant like Jidanbō can lift it, though small doors inside let individuals through. The wall
(**Seireiheki**, Sekkiseki) generates the **Shakonmaku** sphere. Normally the wall is "held up" to protect the
Soul King Palace and **drops down around the Seireitei in emergencies**. Details are confidential, but known:
the white **Senzaikyū** tower stands at the centre with the **Sōkyoku Hill** next to it. Shinigami live in their
**division barracks**; senior officers commute from homes in an **officers' mansion district** (Ikkaku's dojo,
the Abarai home). Light novels add a government district (Central 46), a noble district *Kizokugai* entered by a
*sukiyamon* gate, a fancy restaurant and a pharmaceutical institute (`novel`). No farmland inside — "Seireitei
territories" in the Rukongai farm, hunt and fish for it. A **canal network** with walkways runs under the streets
(Hanatarō's 4th Division knows it; a cell-key storage room is down there). Shops named in canon: Gin Tonbo
(eyewear), Purgatory Company (mail order, near the Black Ridge Gate), Shinigami's Health Land (spa), Tomorrow's
Tiger Pharmacy. Each division has ~200 members (~3,000 total). Old **Spirit-Sealing Pits** (Sekkiseki-walled
execution pits, now garbage dumps) exist — Ganju nearly falls into a deep pit while fleeing Yumichika. The Quincy
**Schatten Bereich** hides in the Seireitei's shadows (§9).

**Story stages**
| Arc | Stage | Where |
|---|---|---|
| Soul Society | Ryoka crash through the Shakonmaku and scatter | random points (§7.2) |
| | Ichigo vs **Ikkaku** · Ganju vs **Yumichika** (pit edge) | streets/alleys near the landing |
| | Uryū & Orihime vs Jirōbō · Uryū vs **Mayuri** | streets |
| | Chad vs **Shunsui** | open plaza (est.) |
| | Ichigo vs **Renji** (2nd fight) | **steps up to the Senzaikyū compound**, then rooftops |
| | Ichigo vs **Kenpachi** | walled corridors around the Senzaikyū precinct |
| | Hinamori vs **Kira** → Hitsugaya vs **Gin** | the **East Holy Wall** where Aizen's fake corpse hung (Hinamori's discovery), then nearby rooftops |
| | Kenpachi vs **Tōsen & Komamura** | streets → Tōsen's Bankai dome |
| | Renji vs **Byakuya** (Bankai debut) | under an archway on the way to the hill |
| | Aizen vs Hitsugaya | Central 46 compound / Seijōtōkyorin |
| TYBW 1st invasion | Blue-fire reishi pillars erupt; Kira shot by Bazz-B near the 3rd Division; Yamamoto vs **Driscoll**, **Royd**, **Yhwach** (1st Division destroyed); Byakuya vs **Äs Nödt** (6th Division); Hitsugaya vs **Cang Du**; Ichigo vs **Yhwach** in the rubble | `seireitei_tybw` |
| TYBW 2nd invasion | Seireitei replaced by the Wandenreich city: Rukia & Byakuya vs Äs Nödt, Renji vs Mask, Kenpachi vs **Gremmy** (imagined meteor), Komamura vs Bambietta, Suì-Fēng vs BG9, Hitsugaya & Rangiku vs Bazz-B | `seireitei_tybw` / `wandenreich` |
| Hell (2021) | Konsō Reisai for Ukitake; black Jigoku no Rinki blobs drift around the grave | rebuilt Seireitei |

**Must-haves.** White plaster walls everywhere forming long corridors and dead ends · dark blue-grey tiled
roofs with white ridges · wide avenues converging on the centre · the **Senzaikyū** tower and **Sōkyoku Hill**
visible from everywhere · barracks gates with the division numeral · squads in black shihakushō · Jigokuchō ·
on the edge: the colossal Sekkiseki wall and gate.

**Scale.** Canon: tens of km across. Game: **256 × 64 × 256 m district slices @0.25** (or 160 m @0.125) with the
rest as a backdrop skyline (roof sea + Senzaikyū + hill + wall ring). Avenues 12–16 m; alleys 3–6 m; walls
4–6 m tall (est., must read clearly above a 1.75 m character and below a 2-storey hall).

**Palette (est.)**
| Element | Base | Ramp |
|---|---|---|
| Plaster walls | `#F0ECE3` | `#DCD5C7` `#C8C0B0` |
| Wall plinth / steps | `#BDB6A8` | `#A39C8E` `#D2CCBF` |
| Roof tiles | `#475565` | `#39434F` `#5D6B7B` |
| Ridge caps / eave boards | `#E9E6DE` / `#2F363F` | — |
| Timber (columns, verandas, gates) | `#6E4B33` | `#573A27` `#8A6244` |
| Streets / packed earth | `#DCD4C4` | `#CBC2B0` `#E8E2D5` |
| Gravel courtyards | `#CFC6B4` | `#BDB3A0` |
| Pines & garden trees | `#4F7B3F` | `#3E6531` `#62904F` |
| Sky | `#86C1EC` → horizon `#D6ECF8` | clouds `#FFFFFF` |
| Sekkiseki | `#D9D5CC` | `#BFBAB0` `#ECE9E2` |
| Shakonmaku | `#CDE9FF` α 0.12 | impact ripples `#FFFFFF` / `#7FD3FF` |
| Jigokuchō | body `#111111` | wings `#6A3D8F` edged black |

**Division identity (banners, gate plaques, lanterns).** Insignia flower and division colour from the Gotei 13
page; hex = the standard value for that colour name.
| Div | Insignia | Colour | Hex | Barracks notes (canon) |
|---|---|---|---|---|
| 1 | Chrysanthemum | deep purple | `#3E1F5C` | captains' assembly hall, lieutenants' room, Captain-Commander's office with a sweeping view, near a bathhouse with stone saunas; the **Central Great Underground Prison** is directly beneath |
| 2 | Pasque flower | dark orange | `#FF8C00` | lavish (automatic doors, heated floors, hot spring), Shihōin crest embossed in the audience chamber, **Nest of Maggots** in the north-west corner |
| 3 | Marigold | magic mint | `#AAF0D1` | — |
| 4 | Bellflower | puce | `#CC8899` | **Sōgō Kyūgo Tsumesho** relief station with deep underground wards (a "75th underground relief cell" exists), pink-uniformed nurses |
| 5 | Lily of the valley | pale turquoise | `#AFEEEE` | division prison ward |
| 6 | Camellia | cobalt blue | `#0047AB` | prison ward (wide cell: mattress, window, ornate chair), Byakuya's book-lined office, Hisana's shrine |
| 7 | Iris | dark tan | `#918151` | — |
| 8 | Strelitzia | raspberry rose | `#B3446C` | Shunsui's office |
| 9 | White poppy | tenné | `#CD5700` | Seireitei Communication editing office |
| 10 | Daffodil | dark green | `#013220` | Hitsugaya's office |
| 11 | Yarrow | lavender | `#B57EDC` | sword-only fighters, rough yards, dojo |
| 12 | Thistle | olive green | `#6B8E23` | **SRDI** with its own gate and newer buildings; Kakaku Taihō replica underneath; Mayuri's hidden shadowless lab |
| 13 | Snowdrop | maroon | `#800000` | **Ugendō** pavilion on a koi pond (koi stolen from the Kuchiki lake by Yachiru), training fields |

**Light / weather.** `noon`: sun 60°, `#FFF4E0`, crisp shadows on white walls (bloom threshold high so walls
don't blow out); `dusk` (title diorama): sun 5°, `#FF9F5A`, walls turn peach `#F5C9A4`; `night`: moon
`#C9D6FF`, paper lanterns `#FFC873`, alarm bell event with torches. Ambience: Jigokuchō swarms, distant bell,
patrol footsteps, wind in pines.

**Generator** (`maps/seireitei/generator.ts`)
1. **Layout (global plan, mostly backdrop).** Circle with 4 cardinal gates and 4 grand avenues to the centre;
   centre = Senzaikyū + Sōkyoku Hill; inner ring = 1st Division, Central 46 compound, Senkaimon tower; middle
   ring = 13 division compounds (relative order is not canonical — pick by seed), noble quarter (Kuchiki,
   Shihōin), officers' mansion district, Shin'ō Academy, 4th relief station; ring roads every ~300 m (est.).
   The playable slice is a 256 m window chosen around a target (e.g., West Gate → 11th Division → Senzaikyū
   steps).
2. **Wall maze (playable slice).**
   1. Carve avenues (12–16 m) and ring streets (8 m) from the global plan.
   2. Fill blocks with compounds: barracks 70–150 m, officer houses 20–40 m, storehouse yards 10–20 m.
   3. Rasterise leftover space to a 6 m grid; run a randomised spanning tree (Wilson/Kruskal) over free cells
      to create alleys; add 10–15 % extra edges for loops; keep ~50 % of dead ends (chase gameplay).
   4. Every alley edge touching a compound or void becomes a **wall**: stone plinth 1 m + plaster to 4–6 m,
      0.75–1 m thick, tiled coping with 0.4 m overhang, pilasters every 4–6 m; doors (2.5 × 3 m) every 20–60 m,
      roofed gatehouses on main compound entrances.
   5. Terraces: ±1–4 m steps between neighbourhoods with stone stairs 3–8 m wide.
   6. Add 1–3 **Spirit-Sealing Pits** (Ø 10–20 m, 25–35 m deep, `sekkiseki` lined, garbage at the bottom) in
      dead-end courtyards.
3. **Terrain.** Flat paved/earth plane; canal network 6–10 m below streets: vaulted stone tunnels 4–5 m high,
   3–4 m water channel + 1 m walkways, grates/stairs to the surface every ~60 m.
4. **Structures (compound template).** Gatehouse with the division numeral plaque and two colour banners
   (nobori 4–5 m) · main hall 30 × 18 m, 1–2 floors, ridge 10–12 m, heavy irimoya roof · dormitory wings
   40 × 10 m, 2 floors · dojo 25 × 15 m · captain's office/quarters · *kura* storehouses (white plaster on a
   black base) · gravel courtyard with pines, a well, stone lanterns · sand training yard · optional watchtower
   6 × 6 × 15 m. Verandas (engawa) 1.2 m around halls. vx @0.25: hall ~25 k, dorm ~20 k, gatehouse ~4 k.
5. **Props.** Stone lanterns (2 m), pines, water barrels, fire-bucket pyramids, notice boards, alarm bell
   towers (hanshō), banners, carts, bamboo screens, stacked practice swords; Jigokuchō particle swarms.
6. **Set pieces.** Senzaikyū precinct (§7.3), Sōkyoku Hill (§7.4), Seireiheki + gate (§7.2), plus §7.5 sites
   when the slice covers them; the **East Holy Wall** (a towering wall face where Aizen's illusory corpse was
   pinned — vertical surface 30–40 m, est.).
7. **Weathering & bake.** Light grime on plinths, moss in alleys, roof-tile colour variation; spawns, nav, probes.

**Spawns.** `west_gate`, `landing_crater_1..4` (Ryoka scatter), `senzaikyu_steps`, `div11_yard`, `rooftop_*`,
`canal_exit`.

**Destruction & collapse.** Wall panels break between pilasters (Kenpachi bursts through walls); halls drop
their heavy roofs; Getsuga leaves crescent gaps through rows of walls; reishi materials are absorbable (Quincy
pull streets apart in TYBW). Rubble of white plaster stays bright — great contrast for blood/scorch paint.

**Performance.** 256 m @0.25: 32 × 32 × L≈2.2 → ~2.3k dense chunks ≈ 75 MB (walls are thin and cheap);
@0.125 keep the slice ≤ 160 m. Use the PLAN's camera dither in alleys.

**Gameplay hooks.** Alarm state (Ryoka): squads converge on noise; the **Shakonmaku** stops flight over the wall
line; drawing a Zanpakutō near the Senzaikyū is forbidden without the Captain-Commander's say-so (story rule:
patrols turn hostile instantly); canal network as stealth routes; sealing pits disable air-step.

**Sources.** wiki/Seireitei · Template:Seireitei (district guide) · Gotei_13 (insignia, colours) · First/Second/
Fourth/Sixth/Eleventh/Twelfth/Thirteenth_Division · Ryoka_Invasion · Ichigo_Kurosaki_vs._Kenpachi_Zaraki ·
Fall_of_the_Seireitei · Quincy_Blood_War.

### 7.2 Seireiheki, the Four Great Gates & the Shakonmaku
| Gate | Direction | Gatekeeper (giant) | Suggested identity (`design`, from the gate names) |
|---|---|---|---|
| **Hakutōmon** 白道門 (White Way) | West | **Jidanbō Ikkanzaka** (9.88 m, two giant axes, 300 years undefeated) | pale stone, white lacquer, faces West Rukongai District 1 (Junrinan) |
| **Shuwaimon** 朱洼門 (Red Hollow) | South | Higonyūdō | vermilion lacquer `#C8352B` |
| **Kokuryōmon** 黒陵門 (Black Ridge) | North | Danzōmaru | black lacquer `#1E1E22` |
| **Shōryūmon** 青流門 (Blue Stream) | East | Kaiwan | blue-green lacquer `#2E6F7E` |

**Build (est.).** Wall 40–50 m tall, 5–8 m thick, made of Sekkiseki slabs 20–30 m wide (core = uniform solid
chunks). Gate leaf: one vertical sliding slab ~30 m tall × 20–25 m wide × 3 m thick (Jidanbō lifts it overhead
by the bottom edge), framed by a roofed gate tower; a 2.5 × 3 m wicket door in the leaf.

**Events.**
- **Wall drop.** Slabs fall from the sky in sequence around the perimeter, each slamming down with a dust
  ring (Ichigo's first approach).
- **Gate lift.** A Grab/Throw-capable giant (Jidanbō, Komamura's Bankai, Yammy) can lift the leaf (rigid
  fragment on a vertical track). Gin's Shinsō punishes the gatekeeper in canon.
- **Jidanbō's axe walls.** His axe swing upturns the ground into a barrier slab (`construct`, `rock_brown`).

**Shakonmaku visual.** Invisible until touched: a sphere centred on the Seireitei (radius = wall radius);
contact shows hexagonal ripples spreading from the point; the Ryoka's cannonball hit becomes a vortex of light
then an explosion that flings the party into 4 groups across the city (spawn scatter).

**Sources.** wiki/Seireitei · Sekkiseki · Template:Gatekeepers · Jidanbō_Ikkanzaka · Ichigo_Kurosaki_vs._Jidanbō_Ikkanzaka · Reishukaku.

### 7.3 Senzaikyū (懺罪宮, "Palace of Penitence")
**Canon.** The white tower at the very centre of the Seireitei where prisoners awaiting the Sōkyoku are held
(a capital offender usually waits a month). Its **Shishinrō** cells are walled with Sekkiseki: prisoners can't
sense Reiatsu and their reiryoku drains to its minimum. A long **bridge** links it to Sōkyoku Hill (Rukia is
escorted across it; Gin waylays her there; Byakuya cuts down Ganju on the bridge and Ukitake intervenes). The
compound around its base is walled; long **steps** lead up to it (Ichigo vs Renji); Kenpachi waits on top of the
precinct walls.

**Build (est.).** Precinct wall 300 × 300 m (4–6 m walls) · approach steps 12 m wide climbing ~20 m · tower:
base 30 m wide, shaft 18–20 m (slightly tapering, banded rings near the top), **160–220 m tall** (dominant
skyline mark) · top cell chamber 12 × 12 × 8 m with one tall barred slit window facing the hill · bridge 6 m wide,
250–400 m long, at hill-top height (~80–100 m), stone deck with low dark-timber railings, slender piers.

**Palette (est.).** tower `#F4F2EC` → `#C9C6BE`; rings `#8E96A3`; cell `sekkiseki`; bridge deck `#DAD4C8`,
railings `#4E3A2B`.

**Destruction.** Tower = slender-tower archetype with H 120 shell (prison-grade); the cell is Sekkiseki
(inside it: no reiatsu regen, abilities ×0.25 — `design`). Bridge spans fall when piers go; the deck is the
classic "fight on a narrow bridge" stage.

### 7.4 Sōkyoku Hill (双殛の丘), the Sōkyoku & Kikōō — `sokyoku`
**Canon.**
- *Hill:* a large rocky **mesa with sheer cliffs on all sides**, visible from most of the Seireitei, overlooked by
  the Senzaikyū. Two ways up: the long **bridge** from the Senzaikyū and a long **zigzag stairway** carved into a
  cliff. One end is **heavily undercut** — that's where the Sōkyoku and the bridge are; the far end is covered by
  a **white forest**. A small **cave** in a cliff hides the entrance (ladder) to the **Study Chamber** Urahara
  and Yoruichi dug as kids (copied later under the shop), which also has a **healing hot spring** modelled on
  Kirinji's.
- *Sōkyoku:* a gigantic **halberd (naginata)** planted in the hill, held by thick ropes wound round its shaft;
  the Kidō Corps unseal it and the ropes uncoil and fly off the cliff. Wreathed in flame it rises and becomes
  **Kikōō**, a phoenix with the power of a million Zanpakutō (×10 at the moment of piercing). The prisoner is
  raised before it on the **execution scaffold** (three cubes rise from the platform to splay the arms and lock
  the legs). The scaffold is built to withstand a million-Zanpakutō blast; Ichigo still wrecks its centre by
  driving Zangetsu in and pouring reiatsu into it. Ukitake and Shunsui destroy Kikōō with the **Shihōin Shield**
  (a cable anchored to the ground, cut along its length by both).

**Story stages.** Rukia's execution & rescue (Ichigo blocks Kikōō) · **Ichigo vs Byakuya** (final fight, hill
top) · Yoruichi vs Suì-Fēng (off the cliff into the forest below) · Shunsui & Ukitake leap off to face Yamamoto
· **Aizen's betrayal**: Aizen vs Renji and Komamura, Hōgyoku extraction, captains restrain him, Menos Grande in
the sky bathe Aizen/Gin/Tōsen in **Negación** light pillars · *movies (non-canon):* DiamondDust Rebellion
finale; the Zanpakutō rebellion opener · **Title screen diorama** (PLAN: Sōkyoku Hill at dusk) · Bankai training
underground (`sokyoku_study`).

**Must-haves.** Cliffs + flat top · the halberd with its ropes · the scaffold · the bridge to the white tower ·
zigzag stair · white forest at the far end · overhang · Seireitei roof-sea all around below.

**Scale (est.).** Mesa top 220 × 140 m in game (canon reads bigger), cliffs 70–90 m, overhang 30–40 m deep ·
halberd 60–75 m total (shaft Ø 2.5 m, 50–58 m; curved blade 15–20 m), 8–12 binding ropes Ø 1–1.5 m anchored to
bollards around the hill · scaffold 25–35 m tall frame on a 12 × 12 m platform · Kikōō wingspan 80–120 m ·
zigzag stair 3 m wide, 8–12 switchbacks · white trees 10–18 m.

**Palette (est.)**
| Element | Base | Ramp |
|---|---|---|
| Mesa rock | `#A79E8D` | `#8C8374` `#BFB7A6` `#6F675B` |
| Hilltop ground / gravel | `#CFC6B4` | `#B7AE9B` |
| White forest | bark `#EAE7DF`, foliage `#F1F1EC` | shadows `#C9CBC6` |
| Halberd blade / shaft | `#C7CBD0` / `#5A3B2A` | edge `#EEF2F5`; shaft wraps `#2E2A26` |
| Ropes | `#C9A66B` | `#A8864F` |
| Scaffold | `#8A8F99` | `#5E636C` |
| Kikōō flame | `#FF7A1A` | core `#FFE08A`, edges `#C2410C` |
| Negación light | `#F6E9B5` α 0.5 | — |

**Light.** Execution: bright late morning, sun 45°. **Title diorama:** dusk, sun 5° `#FF9F5A`, long cliff
shadows, Seireitei roofs catching orange, the Senzaikyū lit like a candle, Jigokuchō drifting.

**Generator** (`maps/sokyoku/generator.ts`)
1. **Layout.** Mesa footprint = superellipse 220 × 140 m with noisy edge; Senzaikyū precinct 150–250 m from the
   undercut end; bridge as a straight span from tower to undercut end; zigzag stair on the long side; forest
   polygon at the far end; ring of Seireitei blocks around (use §7.1 compound templates at low density).
2. **Terrain.** Mesa = extruded footprint with cliff profile (vertical + 10 % noise + strata ledges every
   8–15 m); undercut end: overhang carved 30–40 m deep under the top edge; cave mouth (4 × 3 m) on a cliff face
   leading to a ladder shaft down to `sokyoku_study`.
3. **Structures.** Senzaikyū (§7.3); bridge; scaffold; stair cut (steps 0.3 m, landings every switchback);
   bollards/anchors for the ropes; a simple Kidō Corps ritual ring (stone circle Ø 40 m) around the halberd.
4. **Props.** White trees (straight trunks, rounded pale crowns), boulders, rope coils, captains' viewing
   spots, banners.
5. **Set pieces.** **Halberd** (hand-built; ropes as rope physics that uncoil and fall off the cliff when
   released); **Kikōō** (boss/hazard summon: flame phoenix, fire trails `burn` mode, passes through
   non-Sekkiseki voxels melting them); **Shihōin Shield** (two rods + cable — destroys Kikōō in the cinematic);
   **scaffold** (H 1 500 = can survive almost anything; `overload` rule: a character standing on it channelling
   for 3 s breaks its centre, `design`).
6. **Weathering.** Rock streaks, lichen dots `#9AA084`, scorch ring after Kikōō.
7. **Bake.** Title-diorama camera path; spawns.

**Spawns.** `scaffold_platform`, `hill_center`, `bridge_end`, `stair_top`, `forest_edge`, `cave_mouth`.

**Destruction.** Mesa rock H 70 (cliffs carve into terraces; the overhang can shear off as huge fragments if
undercut further); halberd shaft H 900 steel-like, blade H 1 200; ropes cut by any `cut` ≥ 100; white trees
shatter/topple; Kikōō burns everything flammable on the hill.

**Performance.** 320 × 224 × 320 m @0.25: hill top ~1k chunks (uniform below) + cliff columns ~1.5k + town
ring ~1.6k + tower/bridge/halberd ~0.4k ≈ **4.5k ≈ 145 MB**.

**`sokyoku_study` variant.** §6.7 generator + rocky cliffs inside, a **healing hot spring** (emissive-tinted water
`#9FD3E0`, HP regen zone — `design` numbers), ladder up to the cave, and Yoruichi's **Tenshintai** doll prop
(manifests a Zanpakutō spirit for 3 days of training). Stages: Ichigo vs Zangetsu (Bankai training), Renji's
Bankai training.

**Sources.** wiki/Sōkyoku_Hill · Sōkyoku · Rukia's_Execution · Bankai_Training · Study_Chamber · Kirinden ·
Yoruichi_Shihōin_vs._Suì-Fēng.

### 7.5 Other Seireitei sites (set pieces / small arenas)
| Site | Canon | Build notes (est.) | Hooks |
|---|---|---|---|
| **1st Division barracks** | assembly hall where captains meet (two facing rows); lieutenants' room; Captain-Commander's office with a sweeping view; destroyed by a pillar of blue reishi flame when Yhwach appears | hall 50 × 30 × 15 m with 8 m doors; office tower ~35 m; stone sauna/bath house nearby | Yamamoto vs Royd → Yhwach stage; the shattered Ryūjin Jakka is later returned here |
| **Central Great Underground Prison** | 8 levels under the 1st Division; **Shugō** (3rd) for forbidden Kidō; **Muken** (8th) at the bottom | elevator shaft from the barracks | see `muken` (§7.6) |
| **Central 46 compound** | mostly underground; octagonal **assembly hall** in a large open space, stairs down into it, wise men's benches in two concentric raised rings, judges' alcoves up stairs in the walls, big banners, 13 security levels · **Seijōtōkyorin**: tall thin residence towers, raised entrance up a short stair, wooden walkway around, a tall slit window from door to top · **Daireishokairō** archive with touch-screen consoles · anime: circular building on a lake reached by a bridge | hall Ø 40 m, 15 m deep; towers 4 × 4 × 20–25 m in a grove | Aizen's massacre (blood-soaked hall), Aizen vs Hitsugaya, Aizen's trial (dark hall, spotlights on the accused) |
| **Kuchiki Manor** | grounds so vast Byakuya has a private river; entrance lake with huge golden koi; parents' graves; Byakuya's childhood training yard; guards in purple ninja garb with Kuchiki headbands; Yachiru's tunnels and secret SWA clubroom | 300 × 200 m compound, lake 80 × 50 m, river 8–12 m | Byakuya home turf stage; destroy Nemu's swimming pool (canon gag) |
| **2nd Division & Nest of Maggots** | lavish barracks with hot spring; the Nest (Onmitsukidō Detention Unit) sits in the north-west of the grounds inside a **30-ken (54.5 m) moat** and a high wall, reached by a wooden bridge; inside it's a cave; inmates roam free; **no Zanpakutō may be carried in** | moat ring 54.5 m wide around a 60 × 60 m walled island; cave interior 40 × 40 × 8 m | **weapons-sealed zone** (hand-to-hand only) |
| **4th Division relief station** | main hospital of Soul Society; deep underground wards (75th underground relief cell); also does chores like cleaning | 3 above-ground floors + stacked underground ward levels (6 m each) | Uryū/Chad/Ganju jailbreak; Kenpachi drops through the ceiling |
| **6th Division** | prison ward cell (mattress, window, ornate chair), Byakuya's book-lined office, Hisana's shrine | — | Rukia's first cell; Byakuya vs Äs Nödt (TYBW) |
| **12th Division / SRDI** | labs (Reinō research facility, spiritual-wave measurement, communications research incl. the 9th Communication Room), own gate, Kakaku Taihō replica below; Mayuri's shadowless lab | blocky lab halls, pipes, chimneys, tanks, screens (`#59E0B0` monitor glow) | Mayuri's traps; TYBW gate-building platform raised on giant limbs |
| **13th Division / Ugendō** | pavilion over a pond full of stolen Kuchiki koi; training grounds (Rukia trained Orihime there) | pond 40 × 30 m, pavilion 12 × 10 m on stilts | calm duel arena on water |
| **Shin'ō Academy** | multi-storey campus in Seireitei style; courtyard, classrooms, dorms, halls for Zanjutsu/Hakuda/Hohō/Kidō; uniforms red (girls)/blue (boys) with white | campus 150 × 120 m; Kidō range with targets | Kidō tutorial range |
| **Senkaimon tower** | the only permanent gate, in a large courtyard on top of a tall tower; white light beam when open; run by the Kidō Corps (white hoods) | tower 40 × 40 × 50 m, gate 20 × 15 m | map transition, arrival cinematic |

### 7.6 Muken (無間) — `muken`
**Canon.** The 8th and last level of the Central Great Underground Prison: a voided space cut off from the
world except for a **main tower** (entrance/exit); its darkness feels endless. Reserved for criminals who can't
be executed. Aizen sits there bound by black seal straps; **19 keyholes in the floor** undo them (Shunsui may use
up to 3; the key to Muken is sealed inside his chest so the gates lock forever if he dies). Unohana gets it as the arena to train Kenpachi; an **elevator**
reaches the floor; the space contains **pillars**, and the fight leaves it full of blood and Minazuki's liquid.

**Build.** 128 × 64 × 128 m @0.125 · floor `#0B0B0D` (very dark stone with faint grid seams `#15151A`) · pillars
Ø 3–5 m rising into black (no visible ceiling; fog `#000000` density high beyond 40 m) · elevator shaft and
tower base at one edge · Aizen's chair on a low dais with 19 floor keyholes · lighting only from characters'
auras, a cold top light on the chair, and blood/liquid reflections.

**Stage.** Kenpachi vs Unohana (Kenpachi repeatedly "dies" and is healed — story rule: respawn in place).
**Performance.** ~1.7k chunks ≈ 55 MB.

### 7.7 Rukongai (流魂街) — `rukongai`
**Canon.** The largest, most populous part of Soul Society: **320 districts** — 80 in each of North, South,
East and West — numbered by distance from the centre. District 1 is peaceful and orderly; the higher the
number, the poorer and more violent, with a sharp drop beyond District 50; statistics say **nobody wears sandals
beyond District 59**; District 80 is a lawless wasteland. Families are strangers living together. Shinigami
defend assigned districts; Seireitei-controlled farmland and fisheries exist out here.

| # | District | Region | Note |
|---|---|---|---|
| 1 | Junrinan 潤林安 | West | Hitsugaya, Hinamori, Jidanbō grew up here; faces the West Gate |
| 3 | Hokutan 北端 | West | **Mt. Koifushi**, where Kaien trained Rukia |
| 37 | Ryūgon 流厳 | East | Sasakibe showed Yamamoto his Bankai here (`anime-only`, TYBW) |
| 62 | Kagarashi 花枯 | North | Rangiku & Gin's origin (video-game source) |
| 64 | Sabitsura 錆面 | West | villager disappearances investigated (TYBW) |
| 76 | Sakahone 逆骨 | East | Ukitake's childhood; Mimihagi worshipped |
| 78 | Inuzuri 戌吊 | South | Rukia & Renji's childhood; Hisana arrived here |
| 79 | Kusajishi 草鹿 | North | Kenpachi found and named Yachiru here |
| 80 | Zaraki 更木 | North | Kenpachi's origin |
| ? | Fugai 郛外 | ? | forest in its 6th ward: **Hollowfication incident** (night) |

**Story stages.** Arrival in West Rukongai → Ichigo vs Jidanbō at the gate · Ganju's boar gang chase ·
**Kūkaku's cannon launch** (Reishukaku training then Kagizaki) · flashbacks: Kenpachi meets Yachiru (corpse field,
District 79), Rukia & Renji's gang in Inuzuri, Kaien & Rukia at Mt. Koifushi, **Hollowfication incident** in Fugai
forest (Visored vs Aizen/Gin/Tōsen, night, moon behind clouds).

**Must-haves.** Feudal villages of wood and thatch along dirt roads · the Seireitei wall looming at the
inner edge · rice paddies and forests · the Shiba house with its two giant stone arms holding a name banner and
the tall black cannon.

**Palette (est.)**
| Element | District 1–30 | 31–60 | 61–80 |
|---|---|---|---|
| Roofs | kawara `#4A4E57` | thatch `#A68B5B` | rotten thatch `#7E6A4A`, planks |
| Walls | plaster `#E8E0CF`, timber `#7C5C3F` | timber `#7A5A3C`, mud `#9E8261` | weathered `#6B5B4A`, scraps |
| Ground | stone paving `#C9C1B1` | dirt `#A88B63` | mud `#7D6648`, dead grass `#A59A6A` |
| Vegetation | gardens `#6E9E4C`, bamboo `#8CB255` | paddies `#9BC25A`, forest `#4E7A3A` | scrub `#7F8150`, dead trees `#5B4C3F` |
| Sky / haze | `#86C1EC` / distant mountains `#8DA3B5` → `#B9C8D2` | same | dustier `#C9C3B0` haze |

**Generator** (`maps/rukongai/generator.ts`)
1. **Layout.** Pick a quadrant and a district range; district index `d` grows with distance from the Seireitei
   edge; wealth `w(d)` = 1.0 at d=1 → 0.7 at d=50 → 0.1 at d=80 (steep after 50). Villages = Poisson clusters
   along roads; road quality and density fall with `w`.
2. **Terrain.** Rolling hills (amp 5–20 m), rivers, paddies on terraces in mid districts, forests (Fugai-like
   dense cedar forest), mountains at the outer edge; the Seireitei wall + gate as backdrop at the inner edge.
3. **Structures by `w`.** w > 0.7: tiled machiya rows, shops, small temples, inns · 0.4–0.7: thatched minka
   farmhouses (12 × 8 m, 6 m ridge) with storehouses · 0.2–0.4: shacks 4 × 4 m, lean-tos · < 0.2: burned-out
   ruins, collapsed huts, stockades.
4. **Props.** Wells, carts, drying racks, scarecrows, Jizō statues, lanterns, fences, boars (Ganju's gang mounts).
5. **Set pieces.** **Shiba house** (below); **West Gate** (§7.2); **Mt. Koifushi** (grassy slope with a carp-shaped
   rock, `design`); **Fugai forest clearing** (camp, moonlight); optional: the **real Karakura disc** (§6.9).
6. **Weathering.** Soot on poor huts, mud splashes, rot.
7. **Bake.** NPC rules: footwear off beyond District 59; hostility up with `d`.

**Shiba house & Kakaku Taihō (花鶴大砲).** Kūkaku moves and redesigns her house at will; it used to be near the
West Gate. Current look: a modest central house fronted by **two huge stone human arms rising from the ground,
gripping a banner with her name** (Koganehiko and Shiroganehiko crank the arms so the fists open). Behind it
the **Kakaku Taihō**: a tall, slender **black** cannon that dwarfs the house, normally hidden by a **tan mould**
(Uryū mistakes it for a chimney). It rests in a dark underground chamber (vents near the ceiling) reached by a
passage from the house; the ground roof splits into two halves and a wooden platform with stone steps lifts the
cannon up. Passengers enter through a round hatch that spirals open when punched; the inside is dark and
featureless. **Reishukaku**: clear orb with a red crane emblem that turns pooled reiryoku into a semi-transparent
blue "cannonball" barrier (unstable if concentration slips → explodes). *Kagizaki* (Flower Crane Archery 2nd
Style): Kūkaku fires, Ganju steers by incantation. The cannon later launches the Tenchūren straight up.
Build (est.): house 14 × 10 m; arms 12–15 m tall; banner 16 × 3 m (`#F3EFE6`, black text); cannon 6 m wide,
40–50 m tall (`#1F1F22`, mould `#C8B08A`); underground chamber 20 × 20 × 50 m.
Hooks: **launch mini-game** (balance the barrier, steer — crash into the Shakonmaku if interrupted).

**Destruction.** Low-H wood, thatch and mud: the most satisfying collapses in the game; fire spreads
fast (very flammable thatch).

**Performance.** 384 m @0.25: 48 × 48 × L≈1.8 → ~4.1k chunks ≈ 130 MB.

**Sources.** wiki/Rukongai · Template:RukongaiDistricts · Shiba_Clan · Kūkaku_Shiba · Kakaku_Taihō · Reishukaku ·
Battle_in_Fugai_Forest · The_Hollowfication_Incident.

### 7.8 Seireitei TYBW variants — `seireitei_tybw`
- **1st invasion.** Several gigantic **pillars of blue fire** (Ø 8–15 m, 150 m+, emissive `#79C6FF` core
  `#E6F6FF`) erupt across the city; Sternritter step out of them. Black-and-blue Wandenreich presence;
  the **1st Division barracks** is erased by a giant reishi flame column. Yamamoto's Bankai **Zanka no Tachi**
  turns the area around him into a dried, cracked heat field (`Field`: water evaporates, ground paints `#B9A27A`
  cracked, heat haze). Yhwach's **time limit** outside the Schatten Bereich ends the invasion (shadow tendrils
  pull the Quincy back) — canon story rule.
- **2nd invasion ("replaced").** The Seireitei is swallowed by shadow and **replaced by the ice-covered
  Wandenreich city** (§9.1) on the same footprint. Implement as a **swap event**: chunks of the Seireitei layout
  dissolve into reishi particles (shadow wipe `#05070C`) while Wandenreich chunks condense in; roads keep their
  rough alignment so both layouts share spawns. Mayuri's lab survives because it casts no shadows.
- **Post-war / Hell arc.** Rebuilt Seireitei; Konsō Reisai at a captain's grave with floating **Jigoku no Rinki**
  black blobs (harmless until cut — then acid splash).

---

## 8. Hueco Mundo (虚圏)

**Canon (world).** The Hollows' realm, between the Human World and Soul Society, one of the Three Worlds (the
"paradise of sand"). **Unchanging night**; an **endless white desert** of dunes, boulders and rock formations;
the "trees" are **quartz-like minerals**, not plants; no visible water. Its moon is always in the **opposite
phase** to the Human World's moon. The air is reishi-rich, so weak Hollows can feed on it. Most Hollows live
**below the surface** until something draws them out. No government — the strongest rules (a currency exists
nowadays). Reached through the **Garganta**. Known sites: **Las Noches**, the **Forest of Menos** below the
desert, and the **Negal Ruins** (Urahara's base in TYBW).

### 8.1 The White Sands (desert) — `hm_desert`
**Story stages.** Ichigo, Chad and Uryū arrive through Urahara's Garganta and meet Nel, Pesche, Dondochakka and
Bawabawa (sand-worm ride) · **Runuganga**, "Guardian of the White Sands" (sand giant with a sand-castle head:
sinkholes, sand tornadoes, endless reforming; only water/ice kills it — Rukia's *Hakuren*) · Adjuchas skirmishes ·
TYBW: the Jagdarmee hunting Arrancar; Tres Bestias vs Quilge; **Ichigo & Ayon vs Quilge Opie** (Quilge's
*Jail* cage) · Orihime & Chad training at the Negal Ruins · the Lanza del Relámpago explosion from the dome fight
lands out here.

**Must-haves.** Blinding white sand under a black sky · crescent moon · quartz trees · white boulders and mesas ·
Las Noches' dome dominating the horizon.

**Scale.** Canon: endless. Game: **384 × 128 × 384 m @0.25**, desert backdrop ring (dune silhouettes) and the
Las Noches impostor (dome ~600 m wide) 2–3 km away.

**Palette (est.)**
| Element | Base | Ramp |
|---|---|---|
| Sky | `#050608` | horizon `#10131C` |
| Moon | `#F3EFD9` | halo `#D9D6C3` |
| Sand | `#EEECE6` | `#D9D7D2`, cool shadow `#C3C6CF`, crest `#FAFAF8` |
| Boulders / mesas | `#C8C5BE` | `#A9A69F` `#DEDBD4` |
| Quartz trees | `#E4E9EE` | `#C6CED8`, glints `#FFFFFF`, faint inner blue `#BFD3E6` |
| Sand dust clouds | `#E8E6E0` | — |
| Hollow bones (props) | `#EDE6D6` | `#CFC5B0` |

**Light / sky.** Moon as key light (cool `#CFE0FF`, low elevation 25–35°, long blue-black shadows); sky ambient
near-black `#0A0E18`; strong ground bounce from white sand (hemisphere ground `#8E8C88`) so the floor reads
bright against the sky; distance fog `#0C0F16`; stars absent or extremely sparse (uncertain — keep it empty).
Ambience: wind hiss, sand trickles, distant Hollow howls, nothing else. Optional sandstorm weather (`design`).

**Generator** (`maps/hm_desert/generator.ts`)
1. **Layout.** Wind vector → transverse/barchan dune field; rock outcrops (Poisson, 60–120 m apart); quartz
   groves (clusters of 5–20 within 30–60 m, biased near "vents" where Menos Forest trunks breach); 0–2 ruins;
   sinkhole sites; a Garganta arrival point.
2. **Terrain.** Ridged noise along the wind (wavelength 60–200 m, amplitude 5–25 m) + ripple pattern; 8–20 m of
   `sand_white` over uniform `rock_hm`; optional Hollow burrows (tunnels Ø 3–6 m) under dunes.
3. **Structures.** Mesas 10–40 m (flat tops, strata), boulders 2–15 m, ruins (broken white columns Ø 1.5 m ×
   6–15 m, stair fragments, wall stubs half-buried).
4. **Props / quartz grammar.** Trunk = hexagonal or square prism 1–3 m wide, straight segments 2–5 m, kinks of
   15–40° at nodes; 2–4 thinner branches per node, ending in crystal points; 6–30 m tall; no leaves. Giant
   bone props (Menos ribcages 20–40 m, `design`).
5. **Set pieces.** Garganta tear; **Runuganga basin** (Ø 60 m sinkhole, tornado spawners); **Quilge's Jail**
   (cage of blue reishi bars `#79C6FF`, `construct`); **Negal Ruins** camp (pillars, stairs, monitors);
   TYBW Jagdarmee camp (white tents with five-point crosses, `design`).
6. **Weathering.** Sand drifts on windward faces; ripples re-form slowly after combat (`design`).
7. **Bake.** Horizon dunes, Las Noches impostor, spawns.

**Spawns.** `garganta_exit`, `ruins_center`, `dune_crest_1..4`, `quartz_grove`.

**Destruction.** Sand = granular CA: craters slump to 34°, blasts throw dust curtains (visibility drop),
giants raise sand waves; boulders/mesas carve normally; quartz shatters into glittering shards (no bending);
very hot attacks (Cero, Ryūjin Jakka) fuse sand into glassy patches `#BFC7C9` (`design`).

**Performance.** 48 × 48 × L≈1.5 → ~3.5k chunks ≈ 110 MB. Sand CA only in disturbed regions.

**Gameplay hooks.** Hollows burst out of the sand (ambush spawns); sinkholes drop players into
`menos_forest`; **Las Noches mirage** — running toward it barely shrinks the distance until a scripted arrival
(canon: Ichigo suspects an illusion; Nel says crossing to a gate takes ~3 days); the moon phase is the inverse
of the Karakura map's (`design` link).

**Sources.** wiki/Hueco_Mundo · Template:HuecoMundoLocations · Runuganga · Ichigo_Kurosaki_&_Ayon_vs._Quilge_Opie ·
Wandenreich_vs._The_Arrancar · Royal_Training (Negal Ruins).

### 8.2 Forest of Menos (メノスの森) — `menos_forest`
**Canon.** A region **below the desert** where ordinary Hollows hide from the Arrancar; full of huge **silvery
quartz trees** whose tops reach the surface. Countless **Gillian** obey Adjuchas guardians under Aizen's
command. In the anime, Runuganga's sinkhole drops the group here, they meet the stranded Shinigami **Ashido
Kanō**, fight the guardians, and escape through a **long narrow crack in a cliff** that is sealed behind them.
The arc was planned for the manga but cut for time (so its look is `anime-only`).

**Build (est.).** 256 × 128 × 256 m @0.25 · floor of dark sand · ceiling 80–110 m up = the underside of the
desert crust, with cracks where moonlight shafts and sand falls pour in · giant quartz trunks Ø 6–20 m, 25–40 m
apart, branching near the top and fusing into the ceiling · cliff walls at the edges with Adjuchas nest caves and
the escape slit (2 × 30 m) · Gillian 40–60 m tall (est.; build at 4–8 vx/m).

**Palette (est.).** ambient `#1A1C22`; floor `#3A3C42` → `#2C2E33`; trunks `#B9C2CC` with faint emissive edges
`#DCE6F0`; mist `#5A5F6B` α 0.3; moon shafts `#CFE0FF`; Gillian black `#141414` with white masks `#EDEDED`.

**Hooks.** Gillian volleys of Cero from the dark; guardians (Teres Holcan & co., `anime-only`); fall in from
the desert, escape through the slit. **Performance:** ~4.2k chunks ≈ 135 MB (trunks dominate; cap at 25).

**Sources.** wiki/Forest_of_Menos · Guardians_of_the_Forest_of_Menos · Ashido_Kanō · Runuganga.

### 8.3 Las Noches (虚夜宮) — exterior & dome rooftop — `lasnoches_dome`
**Canon.** Once **Baraggan's** castle with **no roof or walls** (he called the sky his ceiling). Aizen turned it
into a fortress visible for miles: a **main building with a domed centre**, ringed by **several large towers
and smaller buildings**, all **white**. **Five smaller towers stand on top of the dome** (throne rooms, the Espada
meeting hall; Aizen's rooms are in the **5th tower**, where Orihime is also held). It is as big as the Seireitei
or bigger — Ichigo's group runs toward it to exhaustion without seeming to get closer, and Nel says getting from
one spot to a gate takes about three days. The dome's inside simulates a **blue sky**. The halls can be
rearranged by whoever controls them. Its walls are **not Sekkiseki**. Laws: Espada ranked 4 and above may not
**release** inside, and no Espada may fire a **Gran Rey Cero** inside. After Aizen's defeat, the Wandenreich
conquest leaves **more than half of it in ruins**, with a Jagdarmee camp.

**Story stages (rooftop & exterior).** **Ichigo vs Ulquiorra, final fight:** Ichigo crashes up through the floor
of the 5th tower into Orihime's room → they wreck pillars and floors (Uryū mines the floor below, Yammy falls
through) → Ulquiorra climbs the tower face and **blasts through the dome** → on the roof, among the rooftop
towers, Ulquiorra releases (forbidden inside), towers lose their tops, Ichigo is hurled through tower walls →
**Segunda Etapa**; the **Lanza del Relámpago** explodes in the desert taller than the fortress → Hollowfied Ichigo
fires a Cero down **through the dome**, a pillar of energy to the ground. Uryū brings Orihime up to the hole on a
reishi platform. Elsewhere: Ulquiorra's **Cero Oscuras** destroys a large part of the dome (wiki: "half").

**Must-haves.** Immense white dome under black sky and moon · the five rooftop towers · a hole in the dome
**glowing with the fake blue sky below** · desert horizon.

**Scale (est.).** Canon: city-sized. Game: drum radius 280–320 m, drum wall 50–70 m tall, dome cap rising another
80–110 m (apex ~150–170 m above the sand; cap sphere radius ≈ 540 m). Shell 1.5–2 m thick (6–8 vx) with
internal ribs (meridians + parallels, 3 m deep, every ~25 m). **Rooftop towers** (`design` arrangement): the
5th tower near the apex + four at ~60 % radius; 18–24 m square, 50–100 m above the shell, slit windows, flat
rimmed tops. **Outer towers**: 4–8 around the drum, 30–40 m wide, 120–200 m tall. The playable rooftop is a
256 × 192 × 256 m sector at the crest; the rest of the dome is a LOD backdrop.

**Palette (est.)**
| Element | Base | Ramp |
|---|---|---|
| Dome / towers (moonlit) | `#F0EEE9` | `#D8D8D6` `#A9AEB8` |
| Window slits / interiors | `#1A1C22` | `#2A2D35` |
| Inner fake sky (seen through holes) | `#7FB6E6` | clouds `#FFFFFF`, horizon `#CFE6F5` |
| Night sky / moon | `#050608` / `#F3EFD9` | — |
| Orihime's cell | walls `#F2F0EB`, rug `#7A2E2E` with `#C9A45C` pattern | — |

**Light.** Moon key (cool, low) + strong rim light on edges; **upward light leaking from holes** (`#BFE3FF`,
emissive inner face of the shell) — the defining shot of the stage.

**Generator** (`maps/lasnoches_dome/generator.ts`)
1. **Layout.** Choose the sector; place the 5th tower + 2 others in-bounds; outer towers and desert as backdrop.
2. **Terrain.** None in-bounds (shell is the ground); 60–80 m of air below the shell, then the low-res interior
   (sand + tower tops) for the view through holes.
3. **Structures.** Shell SDF = sphere cap ∩ drum; ribs on the inside; towers with floors every 6 m and stairs;
   the 5th tower interior: Orihime's cell (10 × 8 m, tall window with the crescent moon, Middle-Eastern-style rug
   facing outward), Aizen's rooms, pillared hall levels.
4. **Props.** Rubble, rails along tower tops (`design`), Uryū's Seele Schneider mines (story).
5. **Set pieces.** **Breach event** (a 20–30 m hole carved by a `bore` from below); **Cero Oscuras sector delete**
   (scripted massive carve + panels falling inward); Lanza explosion VFX in the desert backdrop.
6. **Weathering.** Clean white; hairline cracks after damage.
7. **Bake.** Spawns; interior impostor through holes; light probes along the crest.

**Spawns.** `hole_edge`, `tower5_top`, `tower5_cell`, `towerA_top`, `crest`.

**Destruction.** Shell archetype (§4): panels fall inward when their ribs are cut; standing on the dome is
always safe; towers = slender archetype (tops shear off). Material `ln_shell` H 110 (holes take real power), towers
`ln_stone` H 90.

**Performance.** ~3.6k chunks ≈ 115 MB.

**Gameplay hooks.** **Release rule**: inside the dome, Espada 0–4 releases and Gran Rey Cero are locked (AI and
story); on the roof they unlock — encourages the canon "take it outside" moment.

### 8.4 Las Noches interior under the fake sky — `lasnoches_interior`
**Canon.** Beneath the dome lies an inner world of **white sand under a simulated blue sky** with **towers** rising
from the sand. Grimmjow and Ichigo fight **on top of towers** (Grimmjow blows tower tops apart with Garra de la
Pantera; his Gran Rey Cero gouges a trench in the sand); Kenpachi vs Nnoitra happens on the sand among tall
buildings (Kenpachi smashed into a building's side; Nnoitra slices its top off onto him; Yachiru perches on a
broken, tilted pillar); Byakuya vs Zommari; Ichigo, Kenpachi & Byakuya vs a released, giant Yammy. Aaroniero claims
the sky lets Aizen watch everywhere — but he himself flees the light when a wall breaks open.

**Build (est.).** 320 × 160 × 320 m @0.25 · fake-sky dome overhead (inner face of the shell, emissive gradient) ·
low dunes (amp 2–5 m) · **12–15 towers** (square, round or stepped; 10–25 m wide; 40–150 m tall; flat roof
platforms; slit windows; some hollow with stairs) placed by Poisson disc (min 35 m) with lognormal heights ·
1–3 Espada palaces in view (white blocky complexes with colonnades and small domes) · corridor mouths in the
drum wall.

**Palette.** Sand and stone as §8.1/§8.3 but **daylit**: sand `#F4F2EC`, shadows warm-grey `#CFCBC2`; sky
`#7FB6E6` → `#CFE6F5`, clouds `#FFFFFF`.

**Light.** A warm-white directional light (`#FFF8EA`, 45°) **without a visible sun disc** (canon unclear —
`design`), bright ambient from the sky dome, crisp shadows; feels uncanny compared with the black world outside.

**Hooks.** Aaroniero's palaces are dark: any hole that lets "sky light" in cancels his abilities in the lit area
(light/shadow zones). The interior sky is part of the shell → breaking through shows real black night.

**Performance.** ~4.6k chunks ≈ 150 MB with 15 towers ≤ 20 m wide (hollow shells).

### 8.5 Las Noches halls, Tres Cifras & palaces — `lasnoches_halls`
**Canon rooms (illustrated guide).** Entrance · **Tres Cifras** (home of the demoted *Privaron Espada*, areas in
wildly different styles: **Dordoni's**, **Cirucci's**, **Gantenbainne's**) · Starrk's resting room · Harribel's
palace · Nelliel's former residence · Zommari's meditation room · **Szayelaporro's palace & lab** · **Aaroniero's
palace** (dark) · the Palace of the Espada · **two throne rooms** · Aizen's rooms (5th tower) · **Tōsen's and
Gin's control rooms** (monitors; they move the halls to steer intruders) · **Orihime's cell** · Espada
meeting room (long table) · medical facilities and detention wings.

**Story stages.** Ichigo vs **Dordoni** · Chad vs **Gantenbainne** (then cut down by Nnoitra) · Uryū vs
**Cirucci** · Rukia vs **Aaroniero** · Renji & Uryū vs **Szayelaporro** → Mayuri vs Szayelaporro · Ichigo vs
Ulquiorra (first fight: corridor → a Cero blasts Ichigo through the wall onto the sand) · Loly & Menoly vs Orihime,
Grimmjow's rescue.

**Corridor kit (est.).** Straight halls 8–12 m wide × 10–14 m tall, square pilasters every 6 m, polished white
floor `#E6E4DF`, ceiling slits letting in fake-sky light or cold panel light `#F7F7F2`; junctions, long stairs,
massive slab doors; halls 40–80 m. **Throne room:** 80 × 40 m, 40 m ceiling, colonnade, throne atop a tall
stepped dais (~20 m). **Lab:** tubes, specimen tanks (`#7FE0C0` liquid), consoles. **Dordoni's area:** bright hall
with a monumental staircase (est.). Each hall is its own 128 × 48 × 128 m arena @0.125.

**Generator.** Room catalogue + corridor graph (A* between rooms on a 6 m grid, then widen); **reconfiguration
set piece**: corridor segments are kinematic voxel blocks that slide/rotate when an operator triggers them
(dynamic maze; crushers if you stand in the seam — `design`).

**Destruction.** `ln_stone` (not Sekkiseki) — fully breakable; breaking an outer wall can open onto the sand
under the fake sky.

### 8.6 Hueco Mundo variants
- **Baraggan-era Las Noches** — open-air palace with no roof or walls; bone throne on a dais; Baraggan's army of
  Hollows; flashback stage (Aizen's arrival).
- **Ruined Las Noches (TYBW)** — more than half the structure in ruins, Jagdarmee tents, Soldat patrols, captured
  Arrancar; Quilge vs Tres Bestias, Ichigo & Ayon vs Quilge (the *Jail* cage), Harribel's capture.
- **Negal Ruins (TYBW)** — broken pillars and stairs where Urahara sets up camp; Orihime rests against a pillar
  while Chad trains.

**Sources.** wiki/Las_Noches · Template:LasNoches · Ichigo_Kurosaki_vs._Ulquiorra_Cifer (+Final_Fight) ·
Ichigo_Kurosaki_vs._Grimmjow_Jaegerjaquez:_Final_Fight · Kenpachi_Zaraki_vs._Nnoitra_Gilga · Aaroniero_Arruruerie ·
Ulquiorra_Cifer · Cero_Oscuras · Las_Noches/Image_Gallery captions.

---

## 9. The Wandenreich (見えざる帝国)

### 9.1 Silbern (銀架城) & the Wandenreich city — `wandenreich`
**Canon.** After losing the war 1,000 years ago, the Quincy fled into the Seireitei and used reishi to carve a
world out of its **shadows**, the **Schatten Bereich**, invisible to the Shinigami ("Invisible Empire"). They can
step out anywhere in the Seireitei (they were always inside the wall) and can break down the Seireitei's reishi
to reveal their city; Yhwach can only stay outside for a limited time. HQ = **Silbern**, a **large ice-encrusted
palace** inside an equally iced-over city of seemingly **abandoned buildings**, about as big as the Seireitei.
- **Silbern:** a wide **two-tier** building — the lower tier stands on **six thick columns**, the upper tier is about
  half as wide and long and rests on **pillars**; windows are **pairs of thin vertical slats**; a **stairway** climbs
  to the lower tier; the complex is enclosed by an **angular barrier with octagonal joints**; in front, two **gutted,
  curving tusk-like structures** arch toward each other (once a single arch); behind it, a **huge rectangular tower
  with a cross on each face** dwarfs everything (Haschwalth's quarters; Yhwach's launch platform to the Soul King
  Palace). Ice everywhere, with dozens of jagged **stalagmites**; exteriors are run-down. In Lichtreich days the city
  formed **three concentric rings** like the Seireitei.
- **Interiors:** big assembly halls; **Wörtlich Hall** (Sternritter meet around a long **silver table**); Yhwach's
  small **torch-lit throne room** with filigree and a little throne on a platform; later an **open-air torch-lit
  throne room** and an open-air sleeping chamber; a **room suspended in mid-air** (stairs up to it) where Harribel is
  imprisoned; wide hallways lined by the upper tier's pillars; **Gates of the Sun** (ornate metal plates, used with
  Keys of the Sun) for moving around and for the invasion; the **Seed of Destruction** — a giant sphere of swirling
  energy vortexes in an ice-encrusted chamber in the middle of Silbern (it disperses or redirects arrows; only a
  collision with a "distortion" can destroy it).

**Story stages.** Sternritter assemblies; Uryū named successor · 2nd invasion fights in the city that replaced
the Seireitei (Rukia & Byakuya vs **Äs Nödt**, Renji vs **Mask De Masculine**, Kenpachi vs **Gremmy** and his
imagined meteor, Komamura vs **Bambietta**, Suì-Fēng vs **BG9**, Hitsugaya & Rangiku vs **Bazz-B**) · **Ichigo vs Uryū
at the tower behind Silbern** while Yhwach ascends · Ryūken & Isshin's Gate of
the Sun trip.

**Must-haves.** Ice crusts and stalagmites on everything · blocky white city under a dark sky · Silbern's two tiers
on columns · the cross-faced tower behind it · the tusk arches · Quincy five-point crosses on banners and walls.

**Scale (est.).** Canon: Seireitei-sized city. Game: **256 × 256 × 256 m @0.25** around Silbern; ring city backdrop.
Silbern lower tier 140 × 90 × 25 m on six Ø 8–10 m columns; upper tier 70 × 45 × 20 m on Ø 2–3 m pillars; stair
40 m wide; barrier walls 6–10 m with octagonal pylons around a 300 × 250 m precinct; tusks 80–100 m; rear tower
30 × 30 m, 200–250 m tall (crosses 20 m tall); city blocks 15–60 m tall; avenues 15–25 m.

**Palette (est.)**
| Element | Base | Ramp |
|---|---|---|
| Stone | `#E9EDF1` | `#C3CBD5` `#8C99A8` |
| Trim / roofs | `#5B6B7E` | `#45525F` |
| Ice | `#CFE7F3` | deep `#9CC3DB`, glint `#F2FBFF` |
| Frozen ground | `#DDE9EF` | `#C4D6E0` |
| Sky (Schatten Bereich) | `#0B0F17` (anime darkness) | manga-like overcast `#9FB4C6` |
| Torches / braziers | `#FFB45A` | embers `#FF7A2E` |
| Quincy reishi | `#79C6FF` | `#4FA3E3` `#E6F6FF` |
| Gate of the Sun metal | `#B8A46A` | `#8F7E4E` |
| Banners | white `#F4F6F8` with black `#1A1A1A` five-point cross | — |

**Light.** Two presets: `shadow` (black sky, ice glow, torches, cold blue rim) and `overcast` (flat white-grey).

**Generator** (`maps/wandenreich/generator.ts`)
1. **Layout.** Three concentric ring zones around the Silbern precinct (ring roads + broken ring walls), 8 radial
   avenues, rectangular blocks between.
2. **Terrain.** Flat frozen plaza levels with steps; ice sheets on roads.
3. **Structures.** Blocky grammar: base slab → shaft (tall narrow window bands) → crown with buttress fins and cross
   reliefs; 20–40 % have collapsed corners/facades (abandoned look).
4. **Ice pass (SDF growth).** Crust 0.25–1 m on upward faces; icicles 0.5–4 m under overhangs; stalagmite clusters
   2–12 m on roofs and streets (slight lean); frozen drifts against walls.
5. **Set pieces.** Silbern (two tiers + interiors), rear tower, tusk arches, barrier walls, **Gates of the Sun**
   (4 × 6 m metal plates in walls/floors = teleport pads), **Seed of Destruction** chamber (60 m ice cave; Seed
   Ø 30–40 m of emissive swirling bands that eat projectiles and wrap them into a reishi dome), Wörtlich Hall,
   throne rooms, Harribel's floating cell.
6. **Weathering.** Frost gradients, wind-scoured ice.
7. **Bake.** Spawns; shadow-wipe transition data (shared footprint with `seireitei`).

**Spawns.** `silbern_stairs`, `tower_base`, `plaza_*`, `gate_of_the_sun_*`.

**Destruction.** Ice shatters first (H 25, glassy shards, meltable → water → steam), stone underneath H 100;
everything is reishi → Quincy `absorb` strips walls into blue streams; Gremmy's meteor = scripted massive `smash`.

**Performance.** ~3.6k chunks ≈ 115 MB (cap ice spikes; they create many small dense chunks).

**Sources.** wiki/Silbern · Wandenreich · Quincy_Blood_War · Fall_of_the_Seireitei · Uryū's_Gambit.

### 9.2 Wahrwelt (真世界城) — `wahrwelt`
**Canon.** After absorbing the Soul King, Yhwach hauls Silbern and the whole Wandenreich city up to the Royal
Realm and **rebuilds the Soul King Palace**: the main palace is put at ground level and partly iced over; the
**five floating cities** are joined to the Wandenreich city in a giant **Quincy Zeichen** (five-point star) of
blue energy; in the middle rises a **massive, wide, multi-layered castle with Silbern on its peak**. Five
**branches** (Ast) are each guarded by a Schutzstaffel member (Uryū was assigned *Zwei Ast*, moved to *Eins Ast*;
Pernida guards *Vier Ast*). **Large stone guardian statues** line the halls; Yhwach sits on a **throne shaped like
the Hagal rune** in a new, bigger throne room behind huge doors. **Five bridges** link the branches to the central
tower. A **distortion** grows beneath. In the manga Wahrwelt has a normal day/night cycle; the anime keeps it in
perpetual darkness. Entry: Gates of the Sun, or Urahara's modified **Valley of Screams**.

**Story stages.** Sado vs the guardian statues · Shunsui (+Nanao) vs **Lille Barro** (Trompete wrecks districts) ·
Gotei & Visored vs **Gerard Valkyrie** (giant; Hitsugaya freezes him) · Mayuri vs **Pernida** (a gargantuan
left arm towering over Wahrwelt's buildings) · **Askin** vs Ichigo, Grimmjow, Yoruichi & Yūshirō, then
Urahara's Bankai (Yoruichi's electric Shunkō levels a whole block of Wahrwelt buildings; Grimmjow lands the kill) · Bazz-B vs **Haschwalth**, Uryū vs **Haschwalth** · Ichigo & Orihime vs **Yhwach** (throne room) ·
Ichigo merged-Hollow burst **destroys Silbern** · Ichigo, Renji & Aizen vs Yhwach (final) · **Uryū's gambit**:
Leiden Scherben detonations sever the inner ends of the five bridges, the central tower falls, Harribel's Cascada
and Nelliel's Lanzador Verde expose the Seed, which collides with the distortion; Uryū wraps the blast in tens of
thousands of arrow strips.

**Build (est.).** Central castle: 200 × 200 m base, stepped tiers (shrink 15–25 % per 30–50 m tier) to 250–300 m,
Silbern (§9.1) on top · branch cities: former Royal Guard discs Ø 250–400 m re-skinned with Quincy blocks and ice ·
bridges 20–30 m wide, 300–500 m long · Zeichen energy lines `#5FB6FF` (emissive ribbons 6 m wide) · distortion:
black swirling mass Ø 500 m+ with flashes `#FF3BD1` `#3BFFE8` `#FFE53B` · guardian statues 15–25 m (golems at 4–8
vx/m) · throne room 120 × 60 × 40 m, Hagal-rune throne, 20 m doors.

**Game bounds.** 384 × 320 × 384 m @0.25: the central castle (partial) + one branch + 1–2 bridges; other branches
as impostors on the horizon; the void below with the distortion as a skybox element that grows during the stage.

**Light.** `manga_day` (overcast white `#D9DEE4`) or `anime_dark` (`#07080C` sky, blue reishi glow, ice sparkle).

**Destruction & set pieces.** Bridges = girder archetype on reishi; the **tower-fall**: destroying the 5 bridge
roots (or the scripted Leiden Scherben) detaches the central castle → it sinks toward the distortion (stage clock);
Lille's Trompete carves straight trenches through districts; Gerard's Godly Size stomps flatten branches.

**Performance.** ~4.5k chunks ≈ 145 MB (floating islands only; void is free).

**Sources.** wiki/Wahrwelt · Silbern · Fall_of_the_Soul_King · Uryū's_Gambit · Wahrwelt/Image_Gallery captions.

---

## 10. The Royal Realm

### 10.1 Soul King Palace (霊王宮, Reiōkyū) — `reiokyu_*`
**Canon.** A separate dimension suspended far above the Seireitei: the Soul King's residence and the Royal
Guard's (Zero Division) home. Layers: the **lowest level** is a district of Seireitei-style buildings; a **large
stairway** climbs to a **wide flat expanse**; both are lined with **rows of huge round pillars**; above float
**five discs** carrying cities (the *Zeroban Riden*, one per Royal Guard member); higher still floats the **Soul
King Greater Palace** — a big **cylinder with conical top and bottom** — miles away and wrapped in barriers.
**72 barriers** separate the realm from the Seireitei (Ōken-cloth garments forcing them leave them open 1 h 40
min); the Seireitei's Sekkiseki wall normally protects it. Entry needs a Royal Guard's consent or an **Ōken** (the
Royal Guard's own bones). Visitors move between sections by being **catapulted through the sky**. The main
entrance is the **Front Approach / Vestibule Road**, a long paneled path hanging in the air. The **Tenchūren**
pillar lands on a platform there; that platform can open into a **circular staircase spiralling down into the
clouds** toward the Seireitei. Guards: **Divine Soldiers** (black hakama, purple sash, black masks with four pale
lines, hair in a long spike, Asauchi) and giant **Second-Class Divine Soldiers** (round black hat, halves of a huge
black pentagonal shield).

| City | Canon content | Build (est.) |
|---|---|---|
| **Kirinji** | **Kirinden**: wooden feudal-era onsen, two name signs at the entrance, big open interior with two healing springs — **White Bone Hell** (squeezes out damaged blood/reiatsu; keep the towel on your head) and **Blood Pond Hell** (red, boiling; refills blood); a loud rocking bamboo fountain | disc Ø 250 m; onsen hall 40 × 30 m; pools 15 × 10 m each; steam |
| **Hikifune** | **Gatonden** "palace of food": linked pillared rotundas whose walls are **gigantic noren** curtains; huge dining hall, one enormous table, hanging lanterns | rotundas Ø 20–30 m; noren 8–12 m tall |
| **Nimaiya** | city at the edge of a large body of water; **Hōōden** = a tiny shack on a **cliff edge** whose inside drops into a **deep pit**; a **water slide** leads to a **forge cavern at the cliff's base surrounded by waterfalls** (a bay — the water is needed to reforge Bankai); the flashy **Galaxy Hōōden** party hall (spotlights, speakers); the "women" in town are his Zanpakutō | cliff 60–80 m; bay Ø 150 m; forge cavern 30 × 30 m with a water trench and a furnace |
| **Senjumaru** | a room covered entirely in dozens of fabrics, a cushioned seat of wooden bars at the top of stairs (measuring for Ōken clothing); her Bankai weaves a loom-like domain | fabric hall 30 × 20 m, drapes as cloth physics or voxel sheets |
| **Ichibe'e** | a **mountain range** with dozens of peaks; **Itanoma** = a small dojo at the top of **stairs carved into a mountain**; the air is so reishi-dense newcomers can barely move or breathe; the inner chamber opens onto the **Irazu Sandō** (walls and floor peel away: a long path of jumbled stones under constant drizzle, luminous grass floating in water, white shide, a plain wooden torii at the end; pressure grows each step; exits into Senjumaru's palace) | disc Ø 400 m; peaks 60–150 m; stair 2 m wide, 400+ steps |
| **Greater Palace** | Soul King's chamber: the limbless Soul King sealed in a red-tinted crystal | cylinder Ø 100–150 m, 200 m tall + cones; chamber Ø 40 m |

**Story stages.** **Royal Training** (Kirinden springs, Gatonden feast, Nimaiya's pit and forge, Senjumaru's
measurements, Ichibe'e's Irazu Sandō) · Royal Guard vs Schutzstaffel on the Vestibule Road (Hikifune's **Cage of Life**
— a giant tree of reiatsu-eating branches — walls the Quincy in; Senjumaru's Bankai; **Nimaiya vs Askin** with a
Blood Pond Hell transfusion) · **Ichibe'e vs Yhwach** on the walkway before the Greater Palace (Ichibe'e brushes
boundary lines and a seal across it; Yhwach's Auswählen drains his own soldiers below; Yhwach then smashes the
road's pillars into **glowing blue stairs** up to the Greater Palace) · **Ichigo vs Yhwach**: clash in the Greater Palace → both crash
into **Kirinji's hot springs** → mid-air duel → Yhwach smashes into the **shrine on top of Ichibe'e's city** (crater)
→ Ichigo is hurled up through the floor of the Soul King's chamber → the Soul King's death, the palace lists with a
diagonal fissure → Wahrwelt (§9.2).

**Must-haves.** Cloud sea far below · floating discs · huge round pillars along the Vestibule Road · the cylinder
palace hanging in the sky · catapult traversal.

**Sub-arenas** (each 256 × 256 × 256 m @0.25): `reiokyu_vestibule` (road segment + landing platform + distant Greater
Palace + Divine Soldiers), `reiokyu_kirinji` (onsen city), `reiokyu_nimaiya` (cliff, bay, forge, Galaxy Hōōden),
`reiokyu_ichibee` (mountains, stair, dojo, Irazu Sandō instance), `reiokyu_greater` (Soul King's chamber).

**Palette (est.)**
| Element | Base | Ramp |
|---|---|---|
| Cloud sea | `#F4F6FA` | shadows `#C9D3E0` |
| Sky (high altitude) | `#4F8FD8` zenith | horizon `#BFDCF5` |
| Palace stone / plaster | `#ECE6DA` | `#D3CBBB` `#F7F3EA` |
| Roof tiles | `#3F4756` | `#2F3542` |
| Gold trim | `#C8A24A` | `#9E7C2F` |
| Vermilion pillars / shrine | `#B9402B` | `#8E2F1F` |
| Timber | `#7A5539` | `#5C3F2A` |
| White Bone Hell / Blood Pond Hell | `#EDEFF2` / `#B3121B` | steam `#FFFFFF` α |
| Galaxy Hōōden neon | `#FF3EA5` `#7A3CFF` `#3CF0FF` | — |
| Forge waterfalls | `#9ED3F0` | spray `#FFFFFF` |
| Irazu Sandō | darkness `#0E1412`, glowing grass `#7CFF9A`, shide `#F4F4EE` | rain |
| Divine Soldiers | black `#141414`, sash `#5B2C83`, mask lines `#D8D8D0` | — |
| Soul King crystal | `#C8202A` α 0.6 | — |

**Light.** High-altitude glare: sun 50°, white `#FFFFFF`, deep blue zenith, bloom on clouds, haze below;
Ichibe'e's city misty; Irazu Sandō dark and wet.

**Generator.** Floating-island grammar: disc = lens-shaped rock underside (noise-eroded, stalactite tips) + flat top
city (Seireitei templates with gold/vermilion accents) + a hidden **anchor core** (`design`) + catapult pads at the
rim (ballistic arcs to the next disc). Vestibule Road = deck 30 m wide (segment in bounds), pillars Ø 8–10 m × 60 m
every 25 m, landing platform Ø 60 m with a retractable Ø 20 m spiral stair. Ichibe'e disc = mountain heightfield
(dozens of peaks) + carved stairs + summit dojo. Reishi-density field near the dojo (movement and stamina penalty
that fades as the player "adapts").

**Destruction.** `palace_stone` H 150 (tough but breakable); pillars topple like dominoes; discs survive bridge/edge
damage but drop if their anchor core is destroyed (`design`); hot springs are liquids (healing zones).

**Performance.** 80–125 MB per sub-arena (2.5–4k chunks); cloud sea is a shader plane, not voxels.

**Sources.** wiki/Soul_King_Palace · Royal_Guard · Kirinden · Gatonden · Hōōden · Irazu_Sandō · Royal_Training ·
Fall_of_the_Soul_King · Ichibe'e_Hyōsube_vs._Yhwach · Ōken.

---

## 11. Between worlds

### 11.1 Dangai (断界, Precipice World) — `dangai`
**Canon.** The corridor dimension linking Soul Society and the Human World, cut off from space and time and floating
inside the Garganta. Once a **penal colony**. Its time is layered and **~2,000× denser** than outside (1 hour out =
2,000 hours in). Two defences: the **Kōryū** — a current that coats the walls and grabs anything that touches it
(one caught foot is nearly inescapable; Uryū's cape got caught and Chad tore him free; a drawn Zanpakutō gets
caught too) — and the **Kōtotsu**, a "sweeper" made of reason rather than reiatsu, shaped like a **bullet train**
out of the Dangai's own material with a **golden eye** at the top centre of its front; it appears **every seven
days**, kills on contact and flings victims across time. Inside it looks like **dripping sludge littered with
bones**, with a path toward a **rectangular opening**. *Kaikyō Kotei* (Realm Boundary Fixation) freezes the current:
normally many low-ranked Shinigami pour in reiatsu; a strong individual can do it alone by planting **four small
forked blades** in the walls and staying linked to them (Isshin could hold it ~2,000 Dangai-hours). Aizen (fused
with the Hōgyoku) destroyed the Kōtotsu by walking into it (anime-only: Amagai also destroyed one).

**Story stages.** **Kōtotsu chase** (Ryoka run; Orihime's Santen Kesshun blocks it — Yoruichi warns that letting
the current touch her fairies could have killed them all) · Ulquiorra intercepts Orihime (defences off) · Aizen
destroys the Kōtotsu · **Isshin's training**: Ichigo vs Zangetsu inside the frozen Dangai for the Final Getsuga
Tenshō.

**Build (est.).** Corridor 14 m wide × 12 m tall, rounded organic walls; floor of uneven sludge with a 4–6 m path of
dark stones; bones (skulls, ribcages 0.3–2 m); sludge drips; exit = glowing rectangle 6 × 8 m. Kōtotsu: fills the
corridor (12 × 10 m section), 80–120 m long, golden eye 3 m, headlight glow.

**Palette (est.).** walls `#3A1F3D` → `#5C2D63`, flowing streaks `#7A3E7F` with amber flecks `#C27A3A`; sludge
`#241A17` → `#3B2A24`; bones `#E6DDC8`; ambient `#120A14`; exit `#FFFFFF`; Kōtotsu eye `#E8B83A`, glow `#FFF3C4`.

**Light.** Darkness lit by the exit ahead and the Kōtotsu's glare behind (rim-lit silhouettes running).

**Generator.** Spline corridor with gentle curves/slopes; cross-section profile + noise; path stones; bone Poisson
scatter; drip emitters; streamed 32 m segments; finite run 500–1,000 m ending at the exit portal.
**Chase event:** the Kōtotsu spawns ~150 m behind with a horn-like roar and light, moves slightly faster than a
sprint (Shunpo/Sonído needed), destroys everything in the corridor except the walls.

**Rules.** Walls `koryu`: indestructible and **sticky** (contact roots the player; allies can pull/break them free;
a drawn sword touching it gets stuck) · Kōtotsu: invulnerable, contact = instant KO / "thrown through time"
(story reset); only an Aizen-tier ultimate can break it (scripted) · **Fixed variant** (`dangai_fixed`): four forked
blades in the walls stop the current → a still arena for the Ichigo vs Zangetsu training stage; Training Ground
option "Dangai time" (cooldowns tick ×2, `design`).

**Performance.** 16 × 16 m section @0.125, ±200 m streamed → ~1.6k chunks ≈ 50 MB.

**Sources.** wiki/Dangai · Trials_of_the_Shattered_Shaft (sludge/bones description) · Invasion_of_Soul_Society.

### 11.2 Garganta (黒腔) & Valley of Screams (叫谷)
- **Garganta.** A featureless black void between the Three Worlds (it contains all of them and can reach the
  Dangai) with turbulent reishi; travellers must keep creating footholds. Openings: *Kūmon* (Gillian air gate),
  *Descorrer* (Espada-level Arrancar), *Keikaigi* (Urahara's posts), Mayuri's captured device (pillars Nemu sets up
  and stands on as the focus). **Transit level** (`garganta`): black `#000000` with faint streaks `#1B2A3A`; the player
  holds Space to lay pale-blue reishi tiles `#7FD3FF` (α 0.6) as a path; tiles fade behind; losing the path = fall
  (respawn) — `design`.
- **Valley of Screams.** Pockets of space inside the Garganta made of souls thrown out of the reincarnation cycle
  (film *Memories of Nobody*; canon in TYBW). Urahara has Riruka stuff one into a box and Yukio shape it into a
  **room on rails** that travels to a marker stake and even enters the Royal Realm without anyone exerting reiatsu
  (stealth). **Transit scene:** a small room (game-UI-styled interior, `design`) gliding on rails through blackness
  to `wahrwelt`.

---

## 12. Hell (地獄) — `hell`

**Canon (manga + 2021 one-shot *No Breathes From Hell*).**
- Where souls go if they sinned gravely as humans: a Zanpakutō only cleanses sins committed as a Hollow. When such a
  Hollow is cut down (Shrieker), the **Gates of Hell** form from light out of the wound: two doors **chained shut**,
  each bearing the **bandaged head and torso of a skeleton** whose arms are set to haul the door open; inside, two
  thick **ropes hung with charms** stop them opening fully; a huge **demon** (only face and left arm visible —
  armour plate on the upper arm, tribal-looking tattoos) **skewers the Hollow with a blade** and drags it in,
  laughing; the doors shut and the gate **cracks and crumbles away**.
- Hell **reshapes Arrancar**: Szayelaporro returns as the **Jailer of Hell** — Hollow hole moved outside as a **ring
  behind his back**, charred skeletal arm, chain tattoos, horns; he raises **black-crimson chains from the ground**
  and has clairvoyance.
- **Captains go to Hell**: their reishi is too dense for Soul Society to reabsorb, so the Konsō Reisai held 12
  years after a captain's death sends them there (Yamamoto "Founder of the Gotei", Unohana "Death Sword", Ukitake
  "Kamikake"); Ukitake's Shikai reappears several times larger.
- **Balance**: Aizen's and Yhwach's reiatsu kept Hell's maw shut; with them gone and captains sent down, its
  denizens can force it open. Then **Jigoku no Rinki** appear — black blobs of a **non-reishi** substance, harmless to
  touch but acidic once cut by a Zanpakutō. Escapees come out through a **circular, Garganta-like portal lined with
  teeth**, and can be dragged back through the ordinary Gates.
- Not part of the Three Worlds (a novel claims it predates them and that the Human World acts as its lid — `novel`);
  the Quincy afterlife connects to the other worlds somewhere near Hell (Kubo Q&A).

**Movie layer (*Bleach: The Hell Verse*, `movie (non-canon)`) — the only full depiction of Hell's interior.**
- **Kushanāda** — Hell's guardians: huge, walk on all fours, long skull-like heads, armour on the right shoulder,
  **pass through solid structures**, eat Togabito (who revive), can grab their otherwise invisible chains; grant the
  *Skull-Clad* armour.
- **Togabito** — chained sinners (in Hell: white garb with thin black stripes; outside: black cloak with white
  rectangular buttons and a bulb-shaped mask split black/white); they die and regenerate endlessly (revived from a
  lava pit).
- **Levels.** The **First Level** (entrance) has **red miasma** overhead and an **ocean dotted with huge lotus- and
  lily-pad-shaped islands** whose petals form walls, plus towers and a **Kushanāda graveyard** (skeletons propped on
  spikes); slopes lead down; the **Fourth Level** has hills, **lava pits**, a **skeletal monument** with a cage
  hanging over lava, **finger-shaped stone pillars** and stone walkways; deeper still a chained figure lies in a **pit
  of skulls** under a river of lava. Seen from inside, the Gates open on a **red chasm crossed by huge chains**.

**Story stages.** Ichigo vs **Shrieker** → first Gates of Hell (canon) · Renji & Ichigo vs **Szayelaporro** (2021) ·
movie: Ichigo vs **Shuren**, **Garogai**, **Gunjō**, **Taikon**, **Kokutō** (Fourth Level monument; Hollowfied Ichigo's
Cero obliterates the monument and blasts through the levels to the Gates).

**Set piece `hell_gate`** (usable on any map): doors 40–60 m tall (est.), black stone/iron `#2A2826`, chains with
1–1.5 m links `#5C5A57` (rust `#7A3B22`), bandaged skeleton reliefs (bandage `#DCD2BC`, bone `#E8E0CC`), interior
glow `#C21A10` → `#FF4A1A`; a giant tattooed arm with a blade grabs the target (cinematic Bind) and the structure
crumbles to dust afterwards.

**Map `hell`** (256 × 256 × 256 m @0.25, two stacked levels joined by a chasm and slopes):
| Layer | Content (est. sizes) | Palette |
|---|---|---|
| Upper — First Level | dark sea `#1B0F12` (red reflections); lotus islands Ø 60–120 m with petal walls 15–30 m (`#C9B9A6` → `#E3D3C0` edges); towers; Kushanāda skeletons on spikes (bone); red miasma ceiling at ~240 m (`#7A0E0E` → `#B0201A`, dim emissive) | crimson/black |
| Lower — Fourth Level | basalt hills `#1C1919`; lava pits Ø 30–80 m (`#FF4E12`, crust `#5A1A0A`, glow `#FFB347`); skeletal monument 40–60 m with a cage; finger pillars Ø 3–6 m × 20–60 m `#3A302C`; walkways 3 m; skull pits `#E2DACA` | orange underlight |

**Light.** No sun: red miasma above, lava underlighting below, heavy bloom, heat haze, embers and ash.

**Rules / hooks.** Kushanāda = giant hazards that **ignore voxel collision** and hunt chained targets; Togabito
respawn from lava pits; chains are indestructible `Bind`s; non-spiritual humans suffer a miasma DoT (Yuzu could not
withstand the air); materials are not absorbable (§2.1); Jigoku no Rinki blobs can be spawned on any map for
Hell-arc variants.

**Destruction.** `hell_rock` H 90; lotus walls H 60; finger pillars topple; lava is a burning liquid; chains ∞.
**Performance.** ~3.5k chunks ≈ 110 MB.

**Sources.** wiki/Hell · Kushanāda · Togabito · Bleach:_The_Hell_Verse · Szayelaporro_Granz · NO_BREATHES_FROM_HELL ·
Jigokuchō.

---

## 13. Story-mode stage index & build order

### 13.1 Chronological stage index (map ids)
| Arc | Stage → map |
|---|---|
| Agent of the Shinigami | Fishbone D → `karakura` (clinic, night) · Acidwire → `karakura` · Shrieker + Gates of Hell → `karakura` + `hell_gate` · Grand Fisher → `karakura` (cemetery, rain) · Menos Grande / Hollow bait → `karakura` (Hollow Horde) · Byakuya & Renji arrest Rukia → `karakura` (rain night) |
| Soul Society | Urahara's lessons & Shattered Shaft → `urahara_study` · Kōtotsu chase → `dangai` · Jidanbō → `seireitei` (West Gate) or `rukongai` edge · cannon launch → `rukongai` · Ikkaku / Yumichika / Mayuri / Chad vs Shunsui → `seireitei` · Renji → `sokyoku` (Senzaikyū steps) · Kenpachi → `seireitei` / `sokyoku` precinct · Bankai training → `sokyoku_study` · execution, Byakuya, Aizen's betrayal → `sokyoku` |
| Arrancar | Yammy & Ulquiorra → `karakura` (park) · Grimmjow's raid, rematch → `karakura` · Visored training → Visored warehouse arena |
| Hueco Mundo | arrival, Runuganga → `hm_desert` · (anime) Gillian horde → `menos_forest` · Dordoni / Cirucci / Gantenbainne / Aaroniero / Szayelaporro → `lasnoches_halls` · Grimmjow final, Nnoitra vs Kenpachi, Byakuya vs Zommari → `lasnoches_interior` · **Ulquiorra final** → `lasnoches_dome` · Orihime intercepted → `dangai` |
| Fake Karakura | pillar guards, captains vs Espada, Visored, Aizen → `fake_karakura` · Final Getsuga training → `dangai_fixed` · Gin vs Aizen, Ichigo vs Aizen (Mugetsu) → `karakura_ss` |
| TYBW | Ebern → `karakura` · Ichigo & Ayon vs Quilge → `hm_desert` (ruined Las Noches) · 1st invasion (Yamamoto vs Yhwach, Byakuya vs Äs Nödt…) → `seireitei_tybw` · Kenpachi vs Unohana → `muken` · Royal Training → `reiokyu_*` · 2nd invasion fights → `wandenreich` (replaced Seireitei) · Ichigo vs Uryū at the tower → `wandenreich` · Royal Guard vs Schutzstaffel, Ichibe'e vs Yhwach → `reiokyu_vestibule` · Ichigo vs Yhwach (Greater Palace → Kirinji springs → Ichibe'e shrine) → `reiokyu_*` · Lille, Gerard, Pernida, Askin, Haschwalth, final Yhwach, Uryū's gambit → `wahrwelt` |
| Hell | Szayelaporro → `karakura` + `hell_gate` · Hell Verse (movie) → `hell` |

### 13.2 Recommended build order
1. **`urahara_study` — Urahara's underground training ground.** Cheapest map that exercises the whole destruction
   stack (heightfield, rock spires that topple, a breakable ceiling shell, a pit) with no props grammar, no
   interiors and no backdrop (it is enclosed). It is the Training Ground mode home and the dev "destruction
   playground"; build it alongside the engine milestones even though `PLAN.md` lists it in M8.
2. **`karakura` — Karakura Town district.** The M5 vertical slice ("Karakura Night": Hollows + Menos through a
   Garganta). Proves the city grammar (lots, wooden houses vs RC mid-rises, poles + wires, river + bridge) and gets
   reused almost for free as `fake_karakura` (+ pillars), `karakura_ss` and the Hollow Horde mode.
3. **`sokyoku` — Sōkyoku Hill & Senzaikyū (with a slice of the white-wall maze).** Wave 1 (M6) climax: Rukia's
   execution, Ichigo vs Byakuya, Aizen's betrayal; also the title-screen diorama. Introduces cliffs/mesa, a slender
   tower, a bridge, Sekkiseki rules and the halberd/Kikōō set piece; the compound templates it needs are the same
   ones `seireitei` uses.

Next: `seireitei` (gate + maze) → `dangai` (tiny, high impact) → `hm_desert` + `lasnoches_dome` (wave 2 headline:
Ulquiorra) → `lasnoches_interior` / `lasnoches_halls` → `fake_karakura` → TYBW maps → `hell`.

### 13.3 Open questions / not found
- **No canon dimensions** for almost anything except Jidanbō's height (9.88 m) and the Nest of Maggots moat
  (30 ken ≈ 54.5 m). All other sizes are `est.`; tune against reference screenshots during look-dev.
- **Not described in text:** the look of the Tenkai Kecchū pillars, the three non-West gates, the exact arrangement
  of the five rooftop towers and outer towers of Las Noches, the Las Noches fake sky's "sun", whether Hueco Mundo has
  stars, Seireitei roof colour (anime reads blue-grey), Senzaikyū height, the Shiba banner text layout. Reconstruct
  from anime frames.
- **Hell's interior** is only shown in the non-canon movie *The Hell Verse*; canon (manga + 2021 one-shot) only shows
  the Gates, the toothed portal, Jigoku no Rinki and transformed residents.
- **Forest of Menos** content is anime-only (cut from the manga).
- **Wiki pages that do not exist** (content lives in parent pages): *Gates of Hell*, *Tenkai Kecchū/Kekkai*
  (→ Senkaimon), *Negal Ruins*, *Itanoma*, *Ugendō*, *Spirit-Sealing Pit*, *Reiō Daidairi*. **Redirects:** Fake
  Karakura Town → Karakura Town, Senzaikyū → Seireitei, Shakonmaku/Shishinrō → Sekkiseki, Kōtotsu → Dangai, Muken →
  Central Great Underground Prison, Tres Cifras → Las Noches, Schatten Bereich / Gate of the Sun / Seed of
  Destruction → Silbern, Tenchūren → Royal Guard. The fetched pages also strip their location tables; the map keys
  above come from the raw templates (*KarakuraTown*, *Seireitei*, *RukongaiDistricts*, *HuecoMundoLocations*,
  *LasNoches*, *Gatekeepers*).
- The Karakura map key (Character Book *SOULs*) has **no coordinates** — the town layout must be procedural.
- Manga vs anime differences to decide per map: Wahrwelt/Schatten Bereich lighting (manga day/night vs anime
  darkness); Central 46 exterior (anime: circular building on a lake).

---

## 14. Sources (Bleach Wiki, fetched via the MediaWiki API)

Base URL `https://bleach.fandom.com/wiki/` + title.
- **Worlds & locations:** Karakura_Town · Template:KarakuraTown · Kurosaki_Clinic · Urahara_Shop ·
  Karakura_High_School · Karakura_Hospital · Human_World · Study_Chamber · Senkaimon · Garganta · Valley_of_Screams ·
  Soul_Society · Seireitei · Template:Seireitei · Template:Gatekeepers · Gatekeepers · Sekkiseki · Sōkyoku ·
  Sōkyoku_Hill · First_Division · Second_Division · Fourth_Division · Sixth_Division · Eleventh_Division ·
  Twelfth_Division · Thirteenth_Division · Gotei_13 · Shinigami_Research_and_Development_Institute ·
  Central_46_Compound · Central_Great_Underground_Prison · Nest_of_Maggots · Kuchiki_Manor · Shin'ō_Academy ·
  Kidō_Corps · Rukongai · Template:RukongaiDistricts · Shiba_Clan · Kakaku_Taihō · Reishukaku · Hueco_Mundo ·
  Template:HuecoMundoLocations · Forest_of_Menos · Guardians_of_the_Forest_of_Menos · Runuganga · Las_Noches ·
  Template:LasNoches · Wandenreich · Silbern · Wahrwelt · Soul_King_Palace · Royal_Guard · Ōken · Kirinden ·
  Gatonden · Hōōden · Irazu_Sandō · Dangai · Hell · Kushanāda · Togabito · Jigokuchō · Three_Worlds · Primordial_Sea ·
  Locations · */Image_Gallery captions (Seireitei, Las Noches, Hueco Mundo, Karakura Town, Soul King Palace,
  Wahrwelt).
- **Events & battles:** Trials_of_the_Shattered_Shaft · Ryoka_Invasion · Rukia's_Execution · Bankai_Training ·
  Ichigo_Kurosaki_vs._Jidanbō_Ikkanzaka · Ichigo_Kurosaki_vs._Kenpachi_Zaraki · Arrancar_Invasion ·
  Ichigo_Kurosaki_vs._Grimmjow_Jaegerjaquez (+ Rematch, Final Fight) · Ichigo_Kurosaki_vs._Ulquiorra_Cifer
  (+ Final Fight) · Kenpachi_Zaraki_vs._Nnoitra_Gilga · The_Armies_Assemble:_Battle_at_Fake_Karakura_Town ·
  The_Gotei_13_&_The_Visored_vs._Sousuke_Aizen · Ichigo_Kurosaki_vs._Gin_Ichimaru · Invasion_of_Soul_Society ·
  Ichigo_Kurosaki_vs._Sousuke_Aizen · Fall_of_the_Seireitei · Quincy_Blood_War · Genryūsai_Shigekuni_Yamamoto_vs._Royd_Lloyd ·
  Kenpachi_Zaraki_vs._Retsu_Unohana · Ichigo_Kurosaki_&_Ayon_vs._Quilge_Opie · Royal_Training · Fall_of_the_Soul_King ·
  Ichibe'e_Hyōsube_vs._Yhwach · Uryū's_Gambit · Ichigo_Kurosaki_vs._Yhwach (+ Final Fight) · Battle_in_Fugai_Forest ·
  Bleach:_The_Hell_Verse · NO_BREATHES_FROM_HELL.
- **Characters (for scale/details):** Jidanbō_Ikkanzaka · Kūkaku_Shiba · Kisuke_Urahara · Tetsuzaemon_Iba ·
  Chōjirō_Sasakibe · Szayelaporro_Granz · Aaroniero_Arruruerie · Ulquiorra_Cifer · Grand_Fisher.

