# VFX - voxel-native and energy effects

Effects sell "power you can see" (PLAN §1 pillar 3). The system is data-driven emitters + shaped energy meshes +
voxel-native effects, all colour-parametrised per character (PLAN §8.3). Colours come from the dossiers via
`bleach-style-guide.md` §9; bloom/emissive rules from `color-and-palettes.md` §4.

---

## 1. Two families - pick deliberately

| Use **voxel-native** effects when… | Use **smooth energy** effects when… |
|---|---|
| matter is involved: debris, rubble, crumbling, slicing, freezing a surface, burning, absorbing, restoring | the thing is spiritual energy: reiatsu auras, Getsuga, Cero, Kidō, arrows, wings, halos, pillars, domes |
| the result should persist in the world (craters, scorch, frost, ice constructs) | it is transient light (flashes, beams, trails) |
| a body dies or transforms (dissolve into motes, ash, halves) | it must read as glowing and fast |

- **Voxel-native:** debris cubes (instanced, per-instance colour), voxel dissolve into reishi motes, sliced halves
  re-meshed, voxel recolour decals (paint states), constructs that add voxels (ice, Kidō walls, Senkei sword rings).
- **Smooth energy:** shaped meshes with scrolling-noise additive shaders (crescents, beams, domes, pillars,
  rings/shockwaves, crosses, wings, dragons, coffins, lightning), ribbon trails, sprites (dust, smoke, sparks, petals,
  feathers, ash, snow), stretched billboards (speed lines), all with depth fade.
- Mixed is normal: a Getsuga is a smooth crescent that leaves a voxel `cut` canyon and voxel debris.

## 2. Readability rules
1. **One dominant shape per technique** - crescent (Getsuga), beam (Cero, Byakurai), sphere (Gōkei, Cero charge),
   pillar (releases), dome (Dankū, Enma Kōrogi), ring (shockwave, Zangerin), cross (Jūjishō), coffin (Kurohitsugi).
   If you cannot draw the technique as a silhouette, players cannot read it.
2. **Telegraph → active → residue:** charge-up glow or gesture (6-20 frames at 60 Hz; long for big moves: the Gillian's
   Cero swells visibly), a sharp active phase, then residue (scorch, dust, ice, cut marks) that fades over 1-5 s or
   persists as paint.
3. **Contrast with the map:** white energy on Seireitei walls or Hueco Mundo sand needs a coloured rim and a darker
   inner edge; dark energy at night needs a bright rim. Test each signature effect on `seireitei_noon`, `hm_night` and
   `karakura_dusk`.
4. **Brightness hierarchy / bloom budget:** one hero effect at full bloom at a time; supporting effects stay at the
   low end of the multiplier ranges. Overlapping additive layers blow out to white - cap intensity and alpha.
5. **Keep fighters visible:** auras and beams must not hide the target's silhouette for more than a few frames;
   non-ultimate effects cover ≤ ~30-40 % of the screen.
6. **Colour discipline:** effects use the owner's colours (style guide §9) - never generic white-blue for everyone.
7. **Accessibility:** flash frames ≤ 2-3 frames, respect the flash-reduction and screen-shake settings (PLAN §14.5).

## 3. Colour and bloom intensity

| Layer | Multiplier (linear HDR; bloom threshold 1.0 in PLAN, 0.92 in the engine) | Notes |
|---|---|---|
| Core | ×4-8 | reads white-hot; hue mostly lost |
| Body | ×1.5-3 | carries the hue - keep ≤ 3 so tone mapping does not bleach it |
| Rim / edge | ×1.1-1.5 | thin outline that just blooms |
| Glow halo | from bloom, not geometry | bloom `intensity` ~1.6, `radius` ~0.7 as in look-dev |
| Smoke, ash, dark cores | ≤ 0.3, alpha-blended | shape only |

- **Dark energies** (Black Getsuga, Cero Oscuras, Kurohitsugi, Mugetsu, Final Getsuga smoke, Yhwach's Black,
  masked Tōsen, Baraggan's release flames): additive light cannot make darkness. Use an **alpha-blended near-black
  core** (`#050507`-`#0B0B0D`, 60-90 % opacity, noise-eroded edges) **plus an additive coloured rim** (×1.5-3:
  crimson `#8E1F3F`/`#B3122E` for Ichigo, green `#2EE06A` for Ulquiorra, violet `#5A2A88` for Aizen's Kurohitsugi,
  dark purple `#3E1E63` for Tōsen). Never pure `#000000` - it reads as a hole in the screen.
- Per-map calibration: `hm_night` shows bloom strongly (low end); `seireitei_noon` needs the high end.
- Effects that should light their surroundings get a short-lived point light in their body colour (look-dev Getsuga:
  `#88AAFF`, intensity 6, range 8 m).

## 4. Reiatsu auras
- **Flame shell:** the character mesh (or a low-res proxy) inflated along normals by 4-12 cm, fragment shader with
  upward-scrolling noise and fresnel-weighted alpha, additive, coloured core → body → rim from the style guide.
- **Rising wisps:** stretched sprites rising 1-3 m/s, fading, body colour; density scales with the flare level.
- **Ground response:** crack rings in the floor (paint + small carve on big flares), dust kicked outward, loose debris
  levitating (PLAN §7 "reiatsu flare levitates rubble"), weak NPCs kneeling.
- **Intensity tiers:** idle shimmer (no bloom) → C flare (aura shell + wisps + ground cracks) → release pillar (a
  column into the sky + shockwave that clears nearby voxels) → ultimate (sky/lighting change).
- **Shaped auras (canon):** Kenpachi's reiatsu forms a **giant yellow skull** (`#FFE066`, dark eye sockets);
  Yachiru's an **angry pink cat** (`#FF6FA8`, outline `#FF3D8B`); Ichigo's golden reiatsu can take the shape of his
  Hollow mask. Build these as authored meshes inside the aura.
- **Dark-core auras:** Bankai Ichigo black `#0A0A0C` with crimson rim `#B3122E`; Final Getsuga smoky black `#050506`
  with violet-grey fringe `#2B2533`, densest around the right arm; Ulquiorra's Segunda Etapa green-black `#0E3B1E`
  edged `#38D46A`; Visored masks add a black-crimson outer rim `#2A0B10` around the owner's colour.
- Elemental reiatsu: Yamamoto's is heat (haze + embers, sealed blade glowing), Hitsugaya's is cold (frost particles,
  snow), Quincy's C flare *inhales* (motes spiral into them, then the aura flashes).

## 5. Signature effects

| Effect | Shape and timing | Colours | World interaction (`DamageShape`) |
|---|---|---|---|
| Getsuga Tenshō | crescent mesh released from the blade tip on the swing; Shikai ≈ 2-3× Ichigo's height, grows by era; ground variant = travelling upheaval | gold `#FDFFD9` / `#FEF698`→`#F4D761` / `#C6923D` (classic anime blue `#F9FFFF` / `#7DDFFD` / `#2D74D0`) | `cut` - leaves a crescent-shaped canyon; ground variant `groundwave` |
| Black Getsuga | larger, faster, steerable crescent; dark core + crimson outline | core `#050203`, inner `#2A0A12`, rim `#8E1F3F`, glow `#C2304F` | `cut`, building-sized |
| Getsuga Jūjishō | two crescents merging into a cross | gold | `cut` along two planes |
| Cero | charge sphere at the emitter (mouth/palm/finger/horn per dossier) growing with hold time, then a beam with core/body/rim; can sweep ~1 s | per user (style guide §9); default crimson `#FFD6D6` / `#E0262B` | `bore` cylinder 0.5 → 4 m by charge, ending in an `explode` blast |
| Gran Rey Cero | spinning razor-disc front, compress/decompress pulse, screen-space distortion along the path; blood drop into the charge | per user (Grimmjow blue `#2C6BFF`, rim `#2A1E5C`) | `bore` + large blast; nearby voxels jitter |
| Cero Oscuras | huge black beam with the user's rim | black + Ulquiorra green `#2EE06A`, corona `#9CFFB8` | massive `bore`/sector delete |
| Bala | fast fist bullets in bursts | crimson `#E0302A` | small `smash` craters |
| Heilig Pfeil | thin, very bright arrows; volleys and rains of hundreds | per Quincy (Uryū `#59B7EE` / TYBW `#14C1F3`; Wandenreich `#79C6FF`) | small `bore` holes in bulk |
| Vollständig activation | pillar of light topped by a Quincy Zeichen, church bells (anime); halo and wings form | per Sternritter (anime colours) | pillar destroys anything encasing the user |
| Sklaverei | world voxels dissolve from the surface inward into particle streams sucked into the halo | reishi-glow `#7EC8F8` → owner colour | `absorb` (Soul Society / Hueco Mundo only) |
| Medallion theft | five dark streams (`#1D1426`, violet edges `#6A4BA8`) wrap the Bankai → motes → ring → disc | | none |
| Senbonzakura | thousands of tiny instanced blades with boids and authored formations (stream, wave, wall, dome, sphere-collapse, cones, rotating sword rings); glints | petals pink `#F5A9C4` → `#E77FA6` (manga white `#F7F7FA`), glints emissive | thin `cut` swarms that strip walls |
| Byakuya Bankai release | sword dropped into the ground with a water-like ripple, scene darkens, two rows of giant blades rise, then shatter into petals | | blast clears nearby voxels |
| Hyōrinmaru | segmented ice dragon body + ice wings/petals (Bankai) | ice `#C9EEFB` / `#8FD4F2` / `#4EA8D9`, rim `#F2FBFF`; petals `#A89BE3` | `freeze` + ice `construct` |
| Ryūjin Jakka / Zanka no Tachi | flame walls and blades; Bankai = no flame, heat haze, ember cracks, molten ground | `#FFF4C2` → `#FFB23E` → `#FF6A12` → `#C4260B`; edge `#FFF1C9` | `burn`, molten ground |
| Kendō / Kenpachi slash | yellow skull aura, ground split for a hundred metres | `#FFE066` | long `cut` + `groundwave` |
| Bankai pillar (Ichigo) | white column into the sky + dust ring | `#F4F7FF` | release blast |
| Mugetsu | the sky blacks out; a horizon-wide black curtain | void `#050507`, haze `#1B1A22` | scripted massive `cut` |
| Movement signatures | Shunpo: blink + afterimage, "swish" · Sonído: static-crackle afterimage, no trail, "bun" · Hirenkyaku: pale blue-white reishi skate streak under the soles · Bringer Light: green flicker `#7DFFB0` + 0.5 m ring on springy ground | | |

### Kidō looks (mechanics.md §1 + dossiers)

| Spell | Look | Colours | Shape |
|---|---|---|---|
| Hadō #1 Shō | short invisible push, ring distortion | - | `smash` (small) |
| Hadō #4 Byakurai | thin white lightning beam from a fingertip | `#E8F4FF` / `#9CC9FF` | `bore` (thin) |
| Hadō #31 Shakkahō | crimson fireball, size by power | core `#FFC9A0`, body `#E3262E` | `explode` |
| Hadō #32 Ōkasen | yellow fire flash | `#FFD34A` | |
| Hadō #33 Sōkatsui | blue fire blast from the palm | core `#CFEFFF`, body `#3FA9FF` (Rukia `#F1FCFD` / `#AFE8F9` / `#7FC7EC`) | `explode` / cone `burn` |
| Hadō #63 Raikōhō | roaring yellow lightning | `#FFE45A` with white core | `bore` + `explode` |
| Hadō #73 Sōren Sōkatsui | twin blue fire blasts | core `#F9FEFE`, `#8FD3F0` / `#74A8D7` | cone `burn` |
| Hadō #88 Hiryū Gekizoku Shinten Raihō | colossal lightning cannon | core white, `#DEFFFE` → `#A1F6FD`, outer `#4FD8F0`, arcs `#7FE6FF` | huge `bore` |
| Hadō #90 Kurohitsugi | black coffin of spikes enclosing the target | black `#0B0B0D`, violet rim `#5A2A88` | `construct` → internal damage |
| Hadō #96 Ittō Kasō | pillar of fire (costs an arm) | `#E3260F`, hot core `#FFD39A` | huge `burn`/`explode` |
| Hadō #99 Goryūtenmetsu | five dragons, tinted per caster | Aizen light purple `#E3D3FF` + yellow `#F3E38C`; Urahara dark red `#7A0F1C` / glow `#C8102E` | |
| Bakudō #4 Hainawa · #63 Sajō Sabaku | crackling yellow rope · thick yellow rope binding the upper body | `#FFE45C` / `#FFF6B0` · `#F2D04A` | bind |
| Bakudō #37 Tsuriboshi | blue ball → six cords → elastic net | `#4FA8FF`, ropes `#8CC8FF` | `construct` |
| Bakudō #39 Enkōsen | dull-yellow spinning disc shield | `#C9B14A` | shield |
| Bakudō #61 Rikujōkōrō | six slabs/rods of light pinning the target | `#FFE066` (Rukia `#FFF2A6`) | bind |
| Bakudō #62 Hyapporankan | one rod splitting into ~100 rods raining down | `#D6ECFF`, glow `#7FC0FF` | bind + small `bore` |
| Bakudō #73 Tōzanshō | inverted blue pyramid barrier | `#3F86FF`, edges `#BFE0FF` | shield |
| Bakudō #75 Gochūtekkan | five iron pillars with chains, yellow orbs | iron `#3A3D42`, orbs `#FFE15A` | `construct` |
| Bakudō #79 Kuyō Shibari | nine black holes with purple rims | `#0A0A0F`, rims `#8E4FD8` | bind |
| Bakudō #81 Dankū | translucent wall that eats explosions | `#D9F0FF` at ~35 % | `construct` (owned, expiring) |
| Kaidō | green palm glow, healing motes | `#6FE08A`, core `#D8FFE2` | heal / restore |

## 6. Voxel-native effects
- **Debris:** removed voxels spawn instanced cubes (1-4 world voxels) inheriting the material colour (one ramp step
  darker on hidden faces), plus dust sprites in the material's dust colour and chips/sparks by material (metal sparks,
  wood splinters, glass shards, ice glitter). Budget 10-20k active (Low 5k), sleep/fade/deposit into rubble piles
  (PLAN §7, §18).
- **Slicing:** sliced bodies and objects split into two re-meshed halves along the cut plane; the separated part gets a
  small impulse along the plane (the top slides before toppling - the signature image).
- **Dissolve into reishi:** Hollow purification - the body breaks into pale motes `#CFE7FF` rising, a translucent Plus
  for ~1.5 s; Quincy annihilation - implosion into blue-white particles `#9FD8FF`; Arrancar - dust/ash blowing away;
  Yamamoto's ash death - flay to skeleton, then ash `#9A948F`; mask shatter - chips dissolving into white motes.
- **Absorption (Quincy, Liltotto):** voxels detach as glowing streams `#7EC8F8` flowing to the caster; the structure
  loses integrity and collapses through the normal structural pass.
- **Restoration:** voxels fly back into place - golden for Orihime's Sōten Kisshun (`#F8F0BA`, rim `#D7B570`),
  black-and-white for Yhwach's Almighty rewrites, clock-like for Giriko.
- **Paint decals:** scorch, frost, blood, ink, rot as palette states on surface voxels - free, persistent and
  destructible (`color-and-palettes.md` §3). Cracks overlay from the damage map before a voxel breaks.
- **Constructs:** ice (Sennen Hyōrō, Hyōrinmaru), Kidō walls (Dankū), Senkei sword rings, Quilge's Jail - owned voxels
  with an expiry; make them visually distinct from world matter (emissive rim, translucency).
- **Heat:** molten voxels glow along the lava ramp and cool down it; heat haze above.

## 7. Screen effects (PLAN §8.3, §10)
- **Hitstop** 40-200 ms scaled by damage (attacker and victim freeze); trauma-based **shake**; **FOV punch** (+3-8°)
  on heavy hits; **radial blur** and **chromatic aberration** pulses on huge hits and dashes; **speed lines** on
  Shunpo/Sonído; a one-frame **colour inversion** on ultimate impacts; **letterbox** for cinematics; a **manga-panel
  freeze frame** for ultimates.
- **Callouts:** big brush-kanji + romaji ("月牙天衝 GETSUGA TENSHŌ", "Chire, Senbonzakura"), Bankai name cards, chanted
  Kidō verse meters.
- All screen effects scale with the accessibility settings (screen-shake scale, flash reduction).

## 8. Performance
- Instanced particles and debris; few large additive layers (overdraw kills fill rate on beams and auras): prefer one
  shaped mesh with a rich shader over many stacked quads; depth-fade soft particles.
- Distant effects drop layers (LOD); cap simultaneous auras and beams; reuse meshes (crescent, beam, sphere, pillar)
  with per-character colour uniforms.

## 9. VFX review (also in `review-checklist.md` §K)
- Shape readable as a silhouette; telegraph present; colours from the owner's table; bloom only on emissive layers,
  hero effect dominant; dark effects have a rim; target remains visible; residue present and correctly persistent;
  tested on three maps; flash/shake respect settings; within particle and overdraw budgets.
