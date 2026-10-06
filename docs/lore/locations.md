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

<!-- LOCATIONS_BODY -->
