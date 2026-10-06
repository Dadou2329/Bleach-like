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
mass). `Abs` = absorbable by Quincy Sklaverei (§2.1).

| id | Material | Ramp (base → shades) | Pattern | H | T | Density | SFX | Flags / transforms | Abs |
|---|---|---|---|---|---|---|---|---|---|
| `paper` | shōji/fusuma paper, posters | `#F4EFE3` `#E3DCCB` `#CFC6B2` | none | 1 | 1.0 | 300 | wood | flammable, transparent-ish | dep. world |
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
| Tower / cliff column | +H/8 per affected column | +H/4 |

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
| | Ichigo vs **Shrieker** — first Gates of Hell (night) | streets |
| | Ichigo vs **Grand Fisher** on Masaki's death anniversary (rain) | hillside cemetery |
| | Ichigo & Uryū vs Hollow swarm from Hollow bait → **Menos Grande** through a sky crack (day → dusk) | whole town, Menos over a park — `Hollow Horde` mode |
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
  Fisher stage in the rain.
- **Shōtengai & station.** Covered arcade with banners and shutters; elevated Honchō station; the 8-storey
  General Hospital beside it (Ryūken is director).

### 6.6 Small Human World arenas
- **Visored warehouse** — an empty lot in a deserted area; corrugated warehouse ~40 × 25 × 10 m (est.); hidden
  by Hachigo's **Hachigyō Sōgai** barrier (passers-by and animals avoid it; Reiatsu doesn't leak; Orihime walked
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

### 6.8 Fake Karakura Town (偽空座町) — `fake_karakura`
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
the Dangai but land "a little way off" because Aizen destroyed the Kōtotsu. Tatsuki, Keigo, Mizuiro, Chizuru
and Don Kanonji wake up there; Gin turns on Aizen; Ichigo arrives from the Dangai and drags Aizen away from
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

<!-- LOCATIONS_BODY -->
