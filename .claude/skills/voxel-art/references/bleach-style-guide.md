# Bleach style guide - the visual language as voxel rules

Canon sources: `docs/roster/*.md` (per-character `Body`, `Palette`, `Look by form/outfit`, `Weapons`; shared
baselines at the top of each file), `docs/lore/locations.md` (division identity, materials), `docs/lore/mechanics.md`
(racial markers, Cero colours). Hex values are dossier *estimates*; `(verify)` = check reference art. Sides are the
**character's** left/right (a front view mirrors them). Voxel numbers are at 48 vox/m.

---

## 1. Visual language → voxel rules

- **Stark black and white.** Kubo designs in big black and white masses with clean edges. Keep them clean: no
  noise on black or white cloth, crisp boundaries (no anti-aliasing between black kosode and white haori), folds by
  value steps (ramps in `color-and-palettes.md` §1.5).
- **Tall, elegant, fashionable silhouettes.** ≈ 7 heads, long legs, flowing cloth (sleeves, haori, coats, capes,
  scarves), asymmetric accessories. Exaggerate the flow at block-out.
- **Oversized weapons and signature props** carry identity (Zangetsu, Santa Teresa, Kenpachi's notched sword, the
  Sōkyoku halberd, Urahara's cane and hat).
- **Faction shape and colour codes:** Shinigami = black + white collar + (captains) white haori; Arrancar = inverted
  (white + black sash) + bone fragment + hole; Quincy = white coats/capes, crosses, blue reishi; Hollows = bone-white
  mask on a dark or odd body; Fullbringers = street clothes + green Bringer Light + white armour structures.
- **Energy is colour-coded per person** (§9). A character's aura, Cero, arrows and release pillars use their
  colour; keep it consistent across every effect of that character.

---

## 2. Shinigami

### 2.1 Shihakushō construction (base for every Shinigami)
| Element | Construction at 48/m | Colour |
|---|---|---|
| Kosode (upper robe) | 1-2 off the body; wraps **left over right** (lowercase "y" to the viewer); sleeves = wide bags hanging 12-16 below the forearm, opening at the wrist | black ramp `#141418 / #24232B / #3A3944` |
| Juban / shitagi collar | white band 2 wide per side, 1 proud, forming the V that meets ~10-12 below the chin; also shows at the cuffs | cloth white |
| Hakama | 2 off the hips flaring to 4-7 at the hem; 5 front + 2 back pleats (1-voxel grooves converging to the waist); side slits at the hips; hem 1-3 above the ground | black ramp |
| Hakama-himo / obi | white ties at the waist (1-voxel cords, short tails); most characters wear a white sash 3-4 tall | cloth white |
| Tabi + waraji | white split-toe socks (1-voxel notch); straw sole 1 thick with straps | tabi white; straw `#B59C6A` (+ `#8A6A3E` straps) |
| Division emblem | printed *inside* the kosode - not visible | - |

Variants from the dossiers: **9th Division** kosode is sleeveless (Hisagi's bare arms); Kenpachi: ragged haori, white
bandage band at the midsection; Byakuya: white fingerless tekkō on the hand backs; Yamamoto in battle strips the
haori and the top half (kosode hangs from the sash - model the scarred muscular torso); Yoruichi (captain era):
sleeveless black top, white inner collar, black neck ribbon, long black arm guards; Sasakibe: white sleeveless
Western-style jinbaori, white turtleneck, long white arm guards; Nemu: short black kimono to mid-thigh, white obi
with a red cord, white gloves; Rangiku: plunging open kosode + pink stole, sword clipped horizontally across the
back of the obi; Ikkaku: gold pauldron on the right shoulder (later arcs); Hanatarō: 4th Division medical pack.

**Onmitsukidō:** Suì-Fēng's *Keisen Shōzoku* - sleeveless, backless black top, black hakama, black arm bands, white
sash plus a yellow sash `#E2BF3F` worn a layer above and slightly lower, black Chinese shoes with white socks; Shunkō
blows the back open. Executive Militia (Keigun): black-clad corps, hooded and masked (verify against reference).
Correction Corps (Urahara's past): white uniform (verify).
**Kidō Corps:** Tessai-era commander - navy over-robe `#23356E` with an enormous fan-shaped standing collar
`#2B4262` with gold ribs `#C9B33A`; Hachigen - long purple mantle `#5A3E8C`.

### 2.2 Captain haori
- White (cloth white ramp), **2 voxels thick**, worn open over the shihakushō, shoulders to knee/calf.
- **Back:** the division numeral kanji, black, inside a **rhombus (◇) outline**, centred on the upper back with the
  top tip 4-6 voxels below the collar.
- **Hem:** a band of black *hishigata* (lozenge/diamond) motifs along the bottom edge. The dossiers disagree on the
  exact drawing - B1 describes a band of black lozenges, the Royal Guard dossier calls the captain hem pattern
  "alternating black circles and diamonds" (and puts it on Nimaiya's and Kirinji's jackets): **verify against
  reference art once, then use one shared hem generator for every captain.** Starting spec: motifs ≈ 5 wide × 7
  tall with 1-voxel gaps, band 1-2 voxels above the hem. Urahara's dark haori inverts it: tall **white** lozenges
  on dark cloth.
- **Lining = division colour** (§2.4): known - Aizen `#AFEEEE`, Komamura `#918151`, Kyōraku `#B3446C` (as
  Captain-Commander deep purple ≈ `#4B1F5E`), Tōsen `#CD5700`, Ukitake `#9C1B2B`, Rukia (captain) `#6B2218`; others
  undocumented - use the division colour (verify). Show the lining 1-2 voxels at the front edges and sleeve mouths.
- **Sleeves per captain:** long - Aizen, Kyōraku, Ukitake, Shinji, Unohana (verify), Gin (verify); short - Byakuya;
  sleeveless - Suì-Fēng, Hitsugaya, Kensei, Rose, Love, Isshin (captain era), young Yamamoto, Tōsen (inferred,
  verify); ragged short sleeves -
  Kenpachi; oversized, long-sleeved, **worn draped as a cape** with arms out of the sleeves - Yamamoto.
- Special: post-time-skip Byakuya - high collar, light-gold edges and tassels `#D9C27A`; Isshin (Shinigami) - the
  haori reduced to a white tattered sash slanting across the robe from the left shoulder.
- "Haori lost" is an outfit damage state (captains treat it as their rank).

**Numeral glyphs** (paint `#151515` on white; `#` = ink). Single numerals 7×7 inside a 17×17 rhombus outline
(half-diagonal 8, 1-voxel stepped line); compounds 十一 / 十二 / 十三 are written **vertically** as two 5×5 glyphs
(5 wide × 11 tall) inside a 19×19 rhombus.

```
一        二        三        四        五        六        七        八        九        十
.......  .......  .#####.  #######  .#####.  ...#...  ..#....  ..#.#..  ..#....  ...#...
.......  .#####.  .......  #.#.#.#  ..#....  ...#...  ..#....  ..#.#..  ######.  ...#...
.......  .......  .......  #.#.#.#  ..#....  #######  #######  ..#.#..  ..#..#.  ...#...
#######  .......  ..###..  #.#.#.#  ..####.  .......  ..#....  .#...#.  ..#..#.  #######
.......  .......  .......  ##...##  ..#..#.  ..#.#..  ..#....  .#...#.  .#...#.  ...#...
.......  #######  .......  #.....#  ..#..#.  .#...#.  ..#...#  #.....#  .#...#.  ...#...
.......  .......  #######  #######  #######  #.....#  ...####  #.....#  #....##  ...#...

5×5 for compounds:   十      一      二      三
                    ..#..   .....   .###.   .###.
                    ..#..   .....   .....   .....
                    #####   #####   .....   .###.
                    ..#..   .....   .....   .....
                    ..#..   .....   #####   #####
```
Render the glyph and rhombus at 2 m and 20 m: at 20 m the numeral is a dark mark in a diamond (fine); at 2 m it
must read as the kanji.

### 2.3 Lieutenant badge (fukukanshō)
- A small plaque on the **upper left arm**, lashed with a white cloth band (2-3 tall around the arm, a knot and two
  short tails). Plaque ≈ 6 wide × 5 tall × 1 thick at 48/m (≈ 12 × 10 cm; verify plaque design): cream face
  `#EFE6CF`/`#E6D9BD`, dark wood rim `#6B4A2B`/`#B59A6A`.
- Face: division numeral as a simplified glyph (3×5) + the division flower as a 2×2 accent in the division colour;
  for close-up cinematics use a higher-resolution decal (`NEW: DecalOnVoxel` in the dossiers).
- Exceptions: Rangiku wears it on her sash tied in a bow; Renji does not wear it; Ikkaku only in the epilogue;
  Yumichika has none (3rd seat).
- **Gentei Reiin** (Human World limiter): the division flower appears as a mark on the body (Rangiku's on her
  chest); on Gentei Kaijo it glows and vanishes in a reiatsu column.

### 2.4 Division identity (banners, plaques, linings, badge accents)
| Div | Flower (meaning) | Colour | Notes |
|---|---|---|---|
| 1 | Chrysanthemum (truth and innocence) | deep purple `#3E1F5C` (docs also give `#800080`, ≈`#4B1F5E` - pick one per project, verify) | Captain-Commander's division |
| 2 | Pasque flower (seek nothing) | dark orange `#FF8C00` | Onmitsukidō |
| 3 | Marigold (despair) | magic mint `#AAF0D1` | |
| 4 | Bellflower (those who grieve are loved) | puce `#CC8899` | relief station, medical packs |
| 5 | Lily of the valley (sacrifice, danger, pure love, humility, sweetness) | pale turquoise `#AFEEEE` | |
| 6 | Camellia (noble reason) | cobalt blue `#0047AB` | |
| 7 | Iris (courage) | dark tan `#918151` | |
| 8 | Strelitzia (everything is obtained) | raspberry rose `#B3446C` | |
| 9 | White poppy (oblivion) | tenné `#CD5700` | sleeveless kosode |
| 10 | Daffodil / narcissus (mystery, egoism) | dark green `#013220` | |
| 11 | Yarrow (fight) | lavender `#B57EDC` (C2 dossier: `#734F96`) | |
| 12 | Thistle (vengeance, strictness, independence) | olive green `#6B8E23` (C2: `#808000`) | SRDI |
| 13 | Snowdrop | maroon `#800000` | Ugendō pavilion |

### 2.5 Sealed Zanpakutō - quick visual keys (from the dossiers)
| Owner | Guard (tsuba) | Grip / sheath |
|---|---|---|
| Byakuya (Senbonzakura) | bronze, an open four-pane window frame `#A47B3B` | lavender cord `#B9A2D6`, white sheath |
| Hitsugaya (Hyōrinmaru) | 4-point star `#A97B3B` (8-point in Bankai) | light-blue wrap `#8DC8EB`, dark-blue sheath `#1E3564` |
| Aizen (Kyōka Suigetsu) | hexagonal, gold `#C8A23C` | green wrap `#2E6B3E`, green (manga) / black (anime) sheath |
| Yamamoto (Ryūjin Jakka) | circular bronze `#9C773A` | dark purple wrap `#3B2756`, brown sheath; disguised as a cane |
| Rukia (Sode no Shirayuki) | gold `#B7AA7C` | maroon wrap `#734749`; Shikai all white with a long ribbon |
| Renji (Zabimaru) | bronze `#9C6B2E` | red wrap `#A3192A`, red lacquer sheath |
| Kaien (Nejibana) | square gold with cut corners and wave reliefs `#C9A646` | dark-blue wrap with gold rhombus gaps |
| Ichigo (first sword) | rectangular bronze with flame motif `#8E7543` | red wrap, two light-blue tassels, oversized brown sheath |
| Kenpachi (Nozarashi) | dark iron `#3F3F44` | bandaged hilt and sheath; notched blade |
| Gin (Shinsō) | steel (verify) | light-blue hilt `#8CC6E3` |
| Ukitake (Sōgyo no Kotowari) | rectangular bronze `#A67D3D` | dark red hilt; Shikai twin blades joined by a red rope with five square charms |

---

## 3. Hollows

### 3.1 Mask design language
- The mask *is* the Hollow's identity (the lost heart) - make it the **highest-contrast, most detailed part** of the
  model and readable at 20 m with **one dominant feature**: long nose (Gillian), beak, horns, tusks, fish snout,
  lion face, insect eyes.
- Bone ramp: crevice `#3A3631` · `#A99F90` · `#C7C1B4` · **`#F1EDE3`** · `#F5F1E6`. Eye holes ≥ 2 voxels deep with
  interior `#060609`, optional glowing eyes (yellow `#F2D33A` or per creature, emissive ×2-3). Teeth: rows of
  1-voxel teeth `#EFE9DE` separated by 1-voxel gaps `#120D0D`, slightly warmer than the mask.
- **Markings:** crimson `#9E1B26` / maroon `#4A1A1F` / black `#141416` stripes or flame shapes, 1-3 voxels wide,
  following the mask's contours, often asymmetric (Ichigo's stripes on the left; Shrieker's black flames).
- The mask is a separate sub-part, 1 voxel proud of the skin, with HP and crack stages (hairline → chunks missing →
  split); cracks reveal the human face of named Hollows. Unsplit masks regrow.
- Bodies are darker or more saturated than the mask so the mask pops: greys, grey-greens, purples, black fur,
  slate; markings as bands; claws/spikes in bone white.
- **The hole** is a real through-hole (empty voxels, inner faces `#060609`), placement per individual (usually
  mid-chest), excluded from the hitbox; projectiles pass through it.
- Examples (F §B.5): Brute (Bulbous G) grey `#8E9094` with dark S-marks, guardian-lion mask; Biter (Fishbone D)
  `#3C3F45` with mask-plated shoulders and a dorsal fin; Hexapod grey-green `#7E8C6A` with orange joints `#E07B2A`;
  Shrieker: ape-like, black fur, bat wings on the hands, long vertical mask with bared teeth and black flame marks.
- Death: Zanpakutō kill = dissolve into pale reishi motes `#CFE7FF` and a translucent Plus for ~1.5 s; Quincy kill =
  implosion into blue-white particles `#9FD8FF`.

### 3.2 Menos Grande (Gillian) and the Menos tiers
- **Gillian:** ~36 m (±20 %), built at **4 vox/m** (≈ 144 voxels tall) with mask and hands at **8 vox/m**. A
  towering black cloak head to feet (`#121216`, blue-violet sheen `#1E1F2B`); white mask with a **long pointed
  nose**, eye holes and mouth `#060609`; a **collar of thin white spikes** round the neck `#F3F1EA`; big pointed
  feet wrapped in white bandages (`#E6E1D6`, creases `#BDB6A8`); large white hands with long nails, usually hidden in
  the cloak; very long tongue `#5E1A24` (?). All Gillians look identical (mass-produced) - instance them.
  Cero from the mouth, crimson `#FFD6D6` / `#E0262B`. Arrival: white fingers prying a cracked sky open (Kūmon).
- **Adjuchas** (2-12 m, 16-32/m): animal-hybrid templates with one strong mask feature; **Vasto Lorde**
  (1.6-2.5 m, 32/m, consider 48/m): humanoid, mask covering the head, sleek.
- **Arrancar Hollow forms** (Grimmjow's panther, Ulquiorra's bat, Harribel's shark…) are specialised from the
  Espada dossiers.

---

## 4. Arrancar

- **Uniform = inverted shihakushō:** white jacket and hakama `#F4F3EF` (shadow `#D8D5CE`), black sash `#17171B`,
  black boots `#121216` with white lines `#ECECEC`. Jackets vary wildly per character (open, high collar, coat
  tails, hood) - the dossier's cut is a silhouette key.
- **Mask remnant** (bone `#F1EDE3`, crevice `#C7C1B4`) floats **1 voxel above the skin** (Kubo Q&A #646).
- **Hollow hole:** true hole, placement per character; **estigma** face marks per character, often intensified on
  release; **number tattoos** (Espada) black `#111114`.
- **Resurrección:** the form echoes the Hollow self (animal motif + bone armour + extra silhouette: wings, tails,
  horns, arms); keep the face readable except where canon hides it (Baraggan's skeleton).
- Death: decompose into reishi dust/ash blowing away (no corpse).

| Espada | Aspect | Number tattoo | Hole | Mask remnant | Release (command) → look |
|---|---|---|---|---|---|
| Coyote Starrk (1) | Solitude | back of the left hand (under the glove) | sternum, just under the jaw-collar | fanged lower jawbone round the front of the neck | Los Lobos ("Kechirase") → fur-collared jacket, ribbon bandoleers, eyepatch-mask with chains, twin pistols, fur boots |
| Baraggan (2) | Old Age | never shown | centre of the chest | five-pointed crown above the forehead | Arrogante ("Kuchiro") → crowned skeleton, purple cloak `#4A2560`, black fur collar, gold chains, red eye pendant |
| Tier Harribel (3) | Sacrifice | inner (left) side of the right breast | lower abdomen | lower jaw/mouth, collar, plates (hidden) | Tiburón ("Ute") → shark-fin spaulders, bone armour, shark-tooth pata blade |
| Ulquiorra (4) | Nihility | left pectoral | sternum / base of the throat | broken one-horned helmet, top-left of the head | Murciélago ("Tozase") → black bat wings, two horns; Segunda Etapa: tail, bat ears, black-furred limbs |
| Nnoitra (5) | Despair | on the tongue | left eye socket (under the eyepatch) | small jaw + teeth ringing the hole | Santa Teresa ("Inore") → crescent horns, 4 → 6 arms with scythes |
| Grimmjow (6) | Destruction | lower back, right side | centre of the abdomen | right half of a toothed jawbone on the right cheek/jaw | Pantera ("Kishire") → bone armour, long hair, forearm/calf blades, tail, black paws |
| Zommari (7) | Intoxication | never shown | right pectoral | bone-spike ridge forehead→nape + skull earrings | Brujería ("Shizumare") → bone-clad body covered in eyes, pink bulb lower body |
| Szayelaporro (8) | Madness | unknown | never shown | rectangular-framed glasses | Fornicarás ("Susure") → purple tentacle skirt, wing branches |
| Aaroniero (9) | Greed | "9" on both small heads | left thigh | ¾ and ½ masks on the two heads; tall 8-hole white mask over the glass capsule | Glotonería ("Kuitsukuse") → dark purple tentacle mass with mouths and red eyes |
| Yammy (10 → 0) | Rage | "10" on the left shoulder → "0" | centre of the chest | lower jawbone with 8 teeth on the chin | Ira ("Buchikirero") → kaiju that keeps growing |
| Nelliel (ex-3) | Sacrifice | large "3" mid-back | "inside her heart" (none visible) | ram-horned skull helmet (child: cartoon skull cracked down its left side) | Gamuza ("Utae") → centaur with a lance |

---

## 5. Visored masks

Masks condense from white reishi over the face (gesture per character); while masked the sclera turns black and the
iris recolours (Shinji grey, Hiyori stays brown, default yellow); a black-crimson outer rim `#2A0B10` joins the aura.
Bone `#EFEBE0`, shade `#C9C3B4`, recesses `#3A3631`; no coloured markings confirmed (verify). Build at 48/m or as an
exactly 2× (96/m) sub-part; 1 voxel proud of the skin; hair inside the mask volume clipped.

| Visored | Mask (the 2-3 features that must read) | Cero port / colour |
|---|---|---|
| Shinji | pharaoh death mask: smooth crown, nemes-style hood flaring behind the ears with a lappet down the nape, long almond eye openings, long toothy grin | sword hand (horizontal bar) / yellow (TYBW), crimson (classic anime) |
| Kensei | flat hockey-goalie plate, six slit eyes in two columns of three, three rib-like extensions per side gripping the head | mouth / orange |
| Mashiro | hornet head: two big rounded compound-eye domes, segmented centre plate, mandible points; goggles stay on her hair | kicked arc / lime |
| Lisa | tall rhombus with a cross-shaped opening (sees through the horizontal bar) | sword tip / blue |
| Rose | plague-doctor beak jutting forward (1-1.3× head length), round eye openings | beak tip / violet |
| Love | Japanese oni: horns curving up out of the afro, heavy brows, flared nose, fanged mouth; worn over his sunglasses | mouth / cyan |
| Hachigen | Balinese demon (Barong/Rangda): bulging eyes, flared nostrils, tusks, crest of 7-9 feather-like spikes | mouth / pink |
| Hiyori | skull with one central forehead horn and a row of diamond marks across the brow; often pushed up on the side of her head | jaw (+ both palms) / red |
| Ichigo | (a) left half of the face (possession); (b) skull with teeth and three red stripes on the left; (c) Hueco Mundo: ten stripes in three clusters over the left half; (d) post-Ulquiorra: one thick vertical stripe down each side | mask / crimson-black Getsuga, crimson Cero |
| Tōsen (Hollowfied) | off-white mask with a black centre seam | - / lime (La Mirada) |

---

## 6. Quincy and the Vandenreich

- **Quincy crosses:** Uryū's first cross = a simple cross with a ring (verify), later a **pentacle** (five-pointed star
  in a ring); Ryūken: silver pentacle in a ring `#B8B8BE`; silver `#C8CCD4`. **Wandenreich insignia / Quincy
  Zeichen:** a five-armed "star cross" with thin rays between the arms - it is the Vollständig halo, the shape of large
  Shadow gates, buttons, banners. **Lichtreich** (1,000 years ago): three points with a tick mark between each pair.
- **Uryū's whites:** white high-collared coat with cape flaps and blue cross/stripe trim (`#2B78D0`, deep `#0A51B4`);
  bow of light in the **left** hand; Letzt Stil: huge reishi wing on the **right** shoulder + left-side armour;
  Vollständig (anime): two crystalline wings, cyan.
- **Sternritter uniform:** white double-breasted, high-collared military coat with shoulder straps, black belt with a
  decorative buckle, white trousers, trench boots; white ankle-length **hooded cloak** with the insignia on the back
  and insignia-shaped buttons; many wear a white peaked cap with gold trim, black peak and the insignia in front.
  The **Bambies** customise everything (heart-shaped bow case on the belt).
- **Schutzstaffel hooded coat:** white, ankle-length, sleeveless, with a hood; three insignia buttons; a large
  **Hagal rune** on the left side, dark red `#6D111A` (one source says black - material swap). Hagal rune = a vertical
  stroke crossed by an X (six-armed asterisk with no horizontal bar); Yhwach's Wahrwelt throne uses the shape.
- **Medallion:** palm-sized disc ≈ 9 cm ≈ 4-5 voxels across at 48/m (the dossier's "3 vox" is at 32/m),
  gunmetal `#3A3D44` with the emblem etched `#8E949E` (decal for close-ups).
- **Blut:** Vene = faint blue vein web `#4C9BFF` flashing only where struck; Arterie = red web `#D5232F` along the
  striking limb (paint/emissive overlay on the skin, not geometry).
- **Vollständig:** pillar of light capped by a Quincy Zeichen on activation; **Heiligenschein** halo (usually the star
  Zeichen) + **Heiligen Fliegen** reishi wings; the halo is a separate hittable part. Colours follow the TYBW anime
  (§9).
- **Yhwach:** white double-breasted trench coat with big buttoned cuffs and lapels; tattered ankle-length cloak
  (maroon-black `#2A1518` with a red neck ribbon, fastened on the **left** with one large button - 1st invasion;
  white - 2nd invasion); Quincy-cross medal on the left breast; straight black hair to the lower back; mutton chops.

---

## 7. Fullbringers

- **Bringer Light:** green `#7DFFB0` (core `#D9FFE9`) sparks under the soles + a 0.5 m ring where the ground pushes
  back; activation = brief green glow on the focus object.
- **"Ichigo-power" upgrades:** white armour structures, matte white `#F2F2EE` with black seams `#1E1E22`, plus a
  personal motif (clock hands, exhaust pipes, gauntlets, heart plate).
- Ichigo's Fullbring stages: FB1 black reiatsu manji outlined crimson in his fist; FB2 ragged black reiatsu
  shihakushō with white (manga) / yellow (anime) trims and an arm blade; FB3 black bodysuit + bone-white segmented
  armour, white face band over the nose bridge, black machete in a white sheath.
- Chad's arms: Brazo Derecha de Gigante - black `#19171C` with a dark-magenta centre stripe `#8D4557` and thin white
  outline, shoulder fin rising above the head; Brazo Izquierda del Diablo - bone white `#F4EFE3` with a crimson
  centre stripe `#B0283C`.
- Xcution keys: Ginjō (fur collar, X pendant, sword with an open gold "window"), Tsukishima (suspenders, book,
  bookmark-shaped tsuba with a tassel), Riruka (magenta twin tails, rabbit-eared hat, heart gun), Yukio (blond, cap,
  console), Giriko (bartender waistcoat, strap over the right eye, clocks), Jackie (thigh-high boots, exhausts),
  Moe (buzzed mohawk strip, bandaged right fist).

## 8. Royal Guard (Zero Division)
- Insignia: a **Winter Daphne** flower inside the Gotei rhombus on the back of every member's haori/jacket
  (4-petal star cluster, black on white; verify drawing). Shared: haori white `#F4F3EE`, shihakushō black.
- **Ōken clothing** (Senjumaru's weaving, worn by Ichigo/Renji/Rukia/Byakuya in TYBW): layered white/cream cloaks,
  head wraps and mufflers - an outer layer that can be destroyed to reveal the TYBW uniform.
- Ichibē: very broad, bald dome, huge black beard, thick upswept brows, big red prayer-bead necklace, giant brush.
  Senjumaru: six long golden skeletal arms from the back, golden crescent ornament behind the head, layered white
  robes, thick okobo. Nimaiya: dark skin, black hair top with green-dyed shaved sides, gold-framed blue sunglasses,
  white sleeveless puffer jacket. Kirinji: gigantic black pompadour projecting forward, stick in the mouth, yellow
  haramaki. Hikifune: purple hair, black lipstick, red swirl marks under the eyes (slim and plump forms).

---

## 9. Reiatsu and energy colour table

Format: aura (C flare / pillar) · signature energies as core / body / rim. Status: **canon** = the wiki states the
colour in words; **est.** = estimated from art; **ext./proposal** = canon silent, our choice (keep consistent).

| Character | Form / state | Aura | Signature energies | Status |
|---|---|---|---|---|
| Ichigo | base (manga, TYBW anime) | gold `#FDE671` / `#F6C343`, flame-orange `#F8B368` | Getsuga `#FDFFD9` / `#FEF698`→`#F4D761` / `#C6923D` | canon gold; classic-anime alt light blue `#8FD8FF`, Getsuga `#F9FFFF` / `#7DDFFD` / `#2D74D0` |
| | Bankai release | pillar `#F4F7FF` | | est. |
| | Bankai (Visored era), mask | black `#0A0A0C` + crimson rim `#B3122E` | Black Getsuga core `#050203`, inner `#2A0A12`, rim `#8E1F3F`, glow `#C2304F` | canon black + red outline |
| | Full Hollow | - | Cero `#FFF3F4` / `#F81E1A` / `#D95E55` (lore alt violet `#8B2BE2`) | anime red |
| | Final Getsuga / Mugetsu | smoky `#050506` + violet-grey fringe `#2B2533` | Mugetsu void (use `#050507`) + edge haze `#1B1A22` | est. |
| | Fullbring | black `#120709` + crimson outline `#8C1A2A` (glow `#D02A3A`) | Bringer Light `#7CFF6B` (core `#DFFFD6`) | est. |
| | Lost Agent Bankai | black + blue rim `#3A7BFF`; rage red-black crackle `#FF3B3B` | | est. |
| | TYBW / Half-Hollow | gold; Blut Vene `#E6FBFF` / `#9CDFF1` / `#2D74D0` | Gran Rey Cero / Cero Creciente `#F6E6FF` / `#9B30FF` / `#5A0FA0` | violet canon |
| | Blood Chains (anime-only) | - | chains `#FFD0B8` / `#FF3B2F` / `#B0101C`, smoke `#3A0508`; Getsuga black with a hard white outline | anime |
| Hollow Ichigo | inner world / possessing / Bankai | white + red rim / black + red rim / red | Getsuga black with red outline (real world), white with red outline (inner world) | canon |
| Isshin | Shinigami | golden-orange `#F1D47B` / `#E4BF60` / `#CE9C4A` | Engetsu flames `#FFFBE0`→`#FDFE44`, `#F7A23A`, `#F07A32`; Getsuga TYBW `#FFE08A` / `#F07A32` | est. |
| Rukia | all | white `#FFFFFF` + pale cyan fringe `#BFE6F7` | ice `#FDFDFD` / `#E6F4FA` / `#BFE3F2` / `#8CC4E0`; Bankai mist `#C2DCEC` | canon white |
| Orihime | Shun Shun Rikka | warm gold `#FFD98A` | Santen Kesshun `#FAFDE4` / rim `#FFC94A` / glow `#F0A040`; Sōten Kisshun `#F8F0BA` / `#D7B570` | est. |
| Chad | Fullbring | white-cyan `#DDF6F5` + dark edge `#2D353D` | El Directo `#F8FDFC` / `#DDF6F5` / `#849DAB`; La Muerte arcs `#9CC8FF` | est. |
| Uryū | Quincy | light blue `#8FD0FF` | arrows `#9AFFFE` / `#59B7EE` / `#0F6BCE`; TYBW `#85F4FA` / `#14C1F3` / `#0554B8`; Vollständig (anime) `#8FE9F8` / `#5CD6F5` | canon light blue |
| Ryūken | Quincy | white | bow `#F4F6FA` glow `#C8D4F0`, arrows `#E0F0FF` | canon white bow |
| Urahara | all | red: core `#FF4D5E`, aura `#C8102E`, haze `#6A0A18` | Benihime Nake `#FFD6DC` / `#D01E3C`; Bankai stitch glow `#E8503A`→`#FF7A4A` | canon red |
| Yoruichi | base / Shunkō | red `#C8102E` | Shunkō classic white-lavender (`#FEFDFE`, fringe `#B8A8FF`, verify); TYBW lightning `#FFFDE0` / `#F3EE51` / `#F2B21C`→`#D17B07`, molten interior `#6C1A01` | canon red |
| Yamamoto | Shikai / Bankai | fiery red-orange `#FF5A1F` | fire `#FFF4C2` → `#FFB23E` → `#FF6A12` → `#C4260B`; Bankai edge `#FFF1C9` + halo `#FF8A2A` | canon |
| Suì-Fēng | all | yellow-gold `#F2C94C` | Shunkō wind `#EEF6FF` → `#A9CFEA`; Bankai blast `#FFE07A` → `#FF8C2A` | proposal (verify) |
| Gin | all | violet `#8D5BD6` (glow `#C7A8FF`) | Shinsō extension streak `#F6FBFF` / rim `#BFE3FF` | canon violet |
| Unohana | Retsu / Yachiru | soft green-white / deep crimson `#8E1420` | Kaidō `#7DFFA0`; Bankai fluid `#5C0A12`→`#8E1420` | proposal |
| Byakuya | all | white `#FFFFFF` (anime leans pink-white) | petals anime pink `#F5A9C4`→`#E77FA6` / manga white `#F7F7FA`; Senkei `#FFD7E8` / `#F59AC0`; Hakuteiken `#FFFFFF` / `#EAF6FF` | canon white |
| Aizen | all | violet: core `#7F3FD8`, glow `#B48CFF`, rim `#3C1670` | Kurohitsugi black `#0B0B0D` + violet rim `#5A2A88`; Hōgyoku `#5E54D6`; Fragor `#D6D2FF` / `#6E6CFF` | canon violet |
| Tōsen | Shinigami / masked | pink `#FF8CC6` / black `#0A0A0D` + dark-purple outline `#3E1E63` | Bankai dome `#050507`; La Mirada lime `#A8FF3A` | canon |
| Komamura | all | red `#D8322B` | Dangai Jōe eye-socket flames `#FF6A1A` → `#FFD34D` | anime |
| Kyōraku | all | golden-yellow `#F2C744` | Bankai theatre panels (anime) `#E6B84A` | canon |
| Hitsugaya | all | white + cold cyan fringe `#D9F3FF` | ice `#C9EEFB` / `#8FD4F2` / `#4EA8D9`, rim `#F2FBFF`; Bankai petals violet `#A89BE3` | canon white |
| Kenpachi | all | golden yellow `#F6C823` (core `#FFF2B3`), giant skull `#FFE066` | Bankai pillar `#FFF4C2` | canon |
| Mayuri | Shikai / Bankai | pink `#F28FC0` / red `#D3262A` | poison vapour violet `#8B5FBF` | anime trivia |
| Ukitake | all | pale silver-white `#F3F6F2` | redirected attacks keep their colour + white-gold pulse `#FFF2C9` | proposal |
| Renji | Shikai/Bankai / Sōō Zabimaru | light red `#FF6B6B` (core `#FFD1D1`) / gold `#F5C542` | Hikotsu Taihō `#FFD0C8` / `#FF2E2E`; Zaga Teppō `#FF6A2A` | est. |
| Ikkaku · Yumichika · Hisagi · Kira | all | red `#E2363B` · green `#4CC46A` · green `#3CC45A` · blue `#4F8FE0` | Ikkaku's Bankai crest fills `#C3141F` → `#FF3B3B` | anime |
| Rangiku · Hinamori · Ōmaeda | all | white `#F4F4F6` · red `#E53935` · pink `#FF7FB6` | Haineko ash `#BDB8B1`; Tobiume `#FFF3B0` → `#FFB33E` → `#FF5A1F` | anime / canon (Ōmaeda) |
| Sasakibe · Nanao · Nemu · Isane · Iba | all | pale gold `#F5E07A` · violet-white `#CFC6FF` · gold-green `#D9E8A0` · ice-blue `#CFEFFF` · smoky orange `#F28C38` | Sasakibe Bankai lightning `#FFFFF2` → `#FFD84A` → `#FFB300` | proposals |
| Yachiru Kusajishi | all | angry-cat aura pink `#FF6FA8` (outline `#FF3D8B`) | | canon shape |
| Shinji · Kensei · Rose · Love | all (masked) | pale gold `#F3E2A0` · silver-white `#E6E9EE` · gold `#F5D46A` · flame orange `#FF8A2E` | Cero: yellow `#FFFDE8` / `#FFE44D` / `#F0B400` · orange `#FFF2DD` / `#FF8A1F` / `#D45A00` · violet `#F3E8FF` / `#9B4DFF` / `#5B1FC0` · cyan `#E9FFFF` / `#27E1F1` / `#0AA3C2` | auras ext.; Ceros canon |
| Lisa · Mashiro · Hachigen · Hiyori | all (masked) | teal `#3FB6C8` · lime `#B5F23A` · orange `#FF9A2E` · pink `#FF7FB6` | Cero: blue `#EAF2FF` / `#3D7BFF` / `#1B47C9` · lime `#F6FFE0` / `#B5F23A` / `#6FBF12` · pink `#FFF0F7` / `#FF6FB5` / `#D9348A` · red `#FFE9EA` / `#E3192B` / `#8E0712` | Hachi, Hiyori auras canon |
| Starrk (+ Lilynette) | sealed / Los Lobos | blue `#4FA3FF` (glow `#9FD0FF`) | Cero `#E6F4FF` / `#6DB6FF` / `#2F7DEB`; wolves `#CFE9FF` edged `#4FA3FF`; Lilynette Cero `#EFFFE6` / `#A8FF8A` | canon blue |
| Baraggan | all | dark red `#8B0E16` (flare `#D12A2A`) | release flames black + purple `#6A2C91`; Respira `#120A18` → `#5B2A7A`, sparks `#9B5BD1` | canon dark red |
| Harribel | all | golden yellow `#F2C230` (glow `#FFE58A`) | Cero `#FFF6CF` / `#FFD84A`; water `#3FA9F5` / `#1E6FB8` | canon |
| Ulquiorra | sealed / R1 / R2 | green `#38D46A`; R2 dense green-black `#0E3B1E` edged `#38D46A` | Cero `#E8FFE8` / `#46F07A` / `#1FA34A`; Bala red `#E0302A`; Cero Oscuras black `#050505` + rim `#2EE06A` + corona `#9CFFB8`; Lanza `#D8FF7A` / `#3CFF7A` | canon green |
| Nnoitra | all | yellow `#F5D33B` (glow `#FFE98A`) | Cero gold `#FFF4C2` / `#FFC930` | canon |
| Grimmjow | all | light blue `#5CC8FF` (core `#E6FAFF`) | Cero red `#FFD2D6` / `#E31B2E` / `#8C0C18`; Gran Rey Cero `#DDEBFF` / `#2C6BFF`, warped rim `#2A1E5C`; Desgarrón `#A8F0FF` (glow `#44C8FF`) | canon |
| Yammy | released | orange-red `#FF5A1E` (core `#FFB070`) | Cero `#FFD0C8` / `#E01A28`; Cero Oscuras black `#0B0B0E` + crimson rim `#9E0F1C` (manga) | est. |
| Zommari · Szayelaporro · Aaroniero | all | pink `#F27DB8` · pink `#FF79B8` (novel) · dark purple `#4A1E6E` | Amor purple `#A64DFF`; Szayel Gran Rey Cero pink `#FF4FA3` (novel) | mixed |
| Nelliel | all | pink `#FF7AB8` | Cero `#FFD6EA` / `#FF5FA8`; Cero Doble braids the returned beam with her pink | aura proposal; Cero canon |
| Ginjō | Fullbring / "Bankai" | light green `#8FF0A4` (core `#DFFFE6`) | Clad Getsuga light purple `#B59CFF`; "Bankai" Getsuga black `#0B0910` + purple outline `#8A4DFF`; Cero magenta `#FF9AD0` / `#E0218A` | canon words |
| Tsukishima | Book of the End | sepia `#C8A46A` + ink wisps `#111114` | insert cut = hair-thin ink line + page scraps `#F3EBD8` | design |
| Yhwach | base / Soul King | blue `#4A78F0` / crimson `#A80F1C` | The Black `#050507` (sheen `#1C1A24`) with red-pupilled eyes; blue flames `#E3F1FF` / `#8FC0FF` / `#2E66F2`; Auswählen `#F4F9FF` fringed `#9CC4FF` | est. |
| Haschwalth | night / The Balance | black `#050507` | Balance scales spectral gold `#E8C55A`; Freund Schild `#E0B44A` | est. |
| Bazz-B | Vollständig | red `#E3262F` | flames `#FFF6C8` → `#FFC23A` → `#FF7A1A` → rim `#D9361C`; Burner Finger 1 `#FFFBEA` / `#FF8A1E` | canon red |
| Äs Nödt | Tatarforas | dark purple `#3A1458` (glow `#6A2A9A`) | fear ooze purple-black `#3C1A5C` (anime); thorns `#F4FBFF` / `#B8DCFF` | canon |
| Bambietta · Candice · Liltotto · Giselle · Meninas | Vollständig (anime colours) | crimson `#B3122E` · neon green `#5CFF5C` · gold `#FFC83A` · purple `#9A5CF2` · pink `#FF7EB8` | explosions `#FFF4E0` → `#FF8A2A` → `#C0102C`; Candice lightning core `#F2FFEC` / `#2BE86E` | canon (anime) |
| Lille Barro | Jilliel / God form | green halo `#4FE38A`, wings `#3DDB7C` / gold `#F2C74E` | X-Axis (see dossier) | canon green; gold est. |
| Gerard · Pernida · Askin · Quilge | Vollständig / powers | gold star `#E6B93E` · yellow-gold `#F2C84B` · poison purple `#9850DA` · white-cyan halo `#9ED8FF` | Quilge's Jail bars `#CFEAFF` | mixed |
| Royal Guard | Ichibē / Senjumaru / Kirinji | none (ink halo `#050505` + indigo `#1F1F2A`) / yellow `#F3D33B` / Shikai light `#FFF7D6` + halo `#FFD34D` | | Senjumaru canon |
| Shared | Kaidō · Hollow purification · Garganta · Negación | green `#6FE08A` (core `#D8FFE2`) · motes `#CFE7FF` · void `#050507` · gold `#F6E27A` (?) | | |

---

## 10. Must-have features of the main cast

What a model **must** show to be recognised. Heights are `cm → vox at 48/m` (body only). "20 m" = silhouette and
colour-block keys; "2 m" = close-up keys (face templates in `characters.md` §2). Asymmetries are character's side.

| Character | Height | 20 m must-haves | 2 m must-haves | Palette anchors | Canon asymmetries |
|---|---|---|---|---|---|
| Ichigo (Shikai, default) | 174 → 84 (181 → 87 from Lost Agent) | spiky orange hair mass (+5-8 above the crown); cleaver as tall as he is on the back (no guard, cloth tang); black shihakushō; chest strap | scowl (T2), brown eyes | hair `#F7962F` ramp; black `#24232B`; red kite-link strap `#A3242B` | first sword's belt strap from the right shoulder |
| Ichigo (Bankai v1) | 84 | ankle-length black coat with flame-like tattered hem, crimson lining in motion; slim black daitō with manji guard and chain | as above; mask variants per era | coat `#1D1C22`, lining `#9E1F27` | masks: stripes on the left |
| Hollow Ichigo | 84 | Ichigo's silhouette, inverted: white shihakushō, black obi, white Zangetsu | black sclera, gold iris, manic grin, blue tongue | white `#EDEBE6`/`#F1F0EC`; obi `#141414` | - |
| Rukia | 144 → 69 | petite; chin-length black hair flaring at the tips; oversized sleeves; Shikai: all-white sword + long white ribbon; Bankai: ice collar/shoulder plates, floor-length sleeves, looping back ribbons | the lock between the eyes; violet eyes | hair `#25252E`; ice whites | lieutenant badge on the left arm |
| Orihime | 157 → 75 | hair to the hips (a cape of hair); two six-petal hairpins at the temples; TYBW: puffy white shoulder caps, very wide white trousers | soft round face, grey/brown eyes | hair `#DE7F36` / TYBW `#CB764C`; pins `#B0E4F0` / TYBW `#79C9C4` | - |
| Chad | 197 → 95 | massive shoulders (~30 vox); wavy brown hair hiding the eyes; armoured arms (right black/magenta with a fin above the head, left bone-white Diablo) | goatee (post-time-skip), coin pendant | skin `#C59272`; arm `#19171C` / `#8D4557`; Diablo `#F4EFE3` / `#B0283C` | tattoo on the left shoulder; right = Gigante, left = Diablo |
| Uryū | 171 → 82 (177 → 85) | slender, long legs; straight chin-length dark hair; white high-collared Quincy coat with cape flaps; bow of light | thin glasses; steel-blue eyes | white + blue trim `#2B78D0` | bow in the left hand; Letzt Stil wing on the right shoulder |
| Urahara | 183 → 88 (+hat) | striped bucket hat pulled low (brim ≈ 19 vox); green-grey samue with a deep open V; dark haori with white hem lozenges; cane; geta | eyes in a hard shadow band; stubble; pale strands between the eyes | stripes `#4B6453`/`#F4F4F4` (TYBW `#99A78B`/`#EBE9E2`); samue `#4F5A4C` | - |
| Yoruichi | 156 → 75 | long ponytail (30-36 vox), side bangs; orange wrap top over a black backless undershirt; cat-like crouch | golden cat eyes | skin `#9C6B4E` (TYBW `#A26F4D`); hair plum `#5A2A4E` / indigo `#322C3B`; orange `#D2783A` | - |
| Yamamoto | 168 → 81 (stooped ~76) | bald dome; hip-length white beard bound by a purple band; oversized haori worn as a cape; gnarled cane | drooping white brows, shut eyes | beard `#F2F0EA`; band `#6B3F8E`; 一 | two scars above the right eye; left arm missing from the end of the Aizen fight |
| Suì-Fēng | 150 → 72 | two long white-wrapped braids ending in big gold rings; sleeveless haori over the backless top; short sword horizontal across the small of the back | grey eyes | rings `#D7B03A`; yellow sash `#E2BF3F` | Shikai gauntlet + stinger on the right hand/middle finger |
| Gin | 185 → 89 | tall, thin, hunched; ear-length silver hair with a long fringe; haori 三 or the Hueco Mundo robe whose bell sleeves swallow the hands | fox grin, closed slit eyes | silver `#CBD0DA`; violet aura | - |
| Unohana | 159 → 76 | thick single braid down the front to the waist; long-sleeved haori with a wide obi; long sword over the shoulder on a rope strap (Yachiru form: loose hair, collarbone scar) | gentle face, blue eyes | hair `#1D2130`; 四 | - |
| Byakuya | 180 → 86 | upright; long black hair with white kenseikan; long white scarf to about the knees; short-sleeved haori 六; white tekkō | calm, slate eyes | scarf manga `#EEF0F2` / anime `#D7E7DA`; petals pink | kenseikan: 3 on top, 2 on the right side |
| Aizen | 186 → 89 | captain: curtain bangs, glasses, long-sleeved haori 五 (turquoise lining); traitor: slicked hair + one strand, tall standing-collar white coat; Hōgyoku stages per dossier | glasses / sharp eyes; brown hair and eyes | violet aura; green wrap `#2E6B3E`, gold hex tsuba | - |
| Komamura | 288 → 138 | huge wolf; Soul Society arc: giant cylindrical komusō-style helmet hiding the head + big shoulder weights; plated boots; haori 七 | golden eyes, long muzzle | fur `#B4824F`, chest `#E8D2A6`; lining `#918151` | - |
| Kyōraku | 192 → 92 (+hat) | straw sugegasa; flowery pink kimono over the haori; lazy slouch; two swords | stubble, grey eyes, pinwheel hairpins | kimono `#E98FB5`; lining `#B3446C` | TYBW: black eyepatch on the right eye, notched right ear |
| Tōsen | 176 → 84 | dark skin, braided hair, orange scarf, white boots; captain: clear goggles, rolled sleeves, purple obi; traitor: band visor, white coat | pupil-less lavender eyes | skin `#5B3A29`; scarf `#E57B2C`; lining `#CD5700` | traitor: orange rope from the right shoulder to under the left arm |
| Hitsugaya | 133 → 64 (adult ~175 → 84) | child; tall spiky white hair; sleeveless haori 十; green sash with a round star clip; nodachi longer than he is; Bankai ice wings and tail | turquoise eyes, frown | hair `#F4F6F8`; sash `#3E8C57`; ice | hilt and star guard behind the right shoulder |
| Kenpachi (+ Yachiru) | 202 → 97 | very tall; spiky hair tipped with bells (pre-time-skip) / long loose hair (later); ragged haori 十一; notched sword; Yachiru perched on the left shoulder | eyepatch, scar, no brows, fangs grin | bells `#D8B23C`; skin `#C8966E`; yellow skull aura | eyepatch on the right eye; scar through the left eye |
| Mayuri | 174 → 84 | gaunt; era headgear (Soul Society: white hat with two spikes); golden ear cones; big purple cravat; sword hanging vertically in front | painted face, bared-teeth grin, gold eyes | paint `#F2F1EB`/`#111111`; cravat `#6B3FA0`; nails `#2F5DC4` | hat spikes jut to his right; right middle fingernail as long as the finger |
| Ukitake | 187 → 90 | tall, thin; long white hair nearly to the waist; long-sleeved haori 十三 (crimson lining); twin blades joined by a red rope with five charms | black eyebrows, green eyes | hair `#F1F0EC`; lining `#9C1B2B`; rope `#B32025` | a lock over the right eye |
| Renji | 188 → 90 (+ponytail 10-12) | crimson "pineapple" ponytail; forehead band/bandana/goggles by era; tribal tattoos; segmented whip-blade; Bankai bone snake + baboon pelt | tattooed jagged brows | hair `#C7202F`; tattoos `#141414`; bone `#E6DCC4` | - |
| Ikkaku | 182 → 87 | gleaming bald head; sword in one hand, sheath reversed in the other / spear; brawler stance | red marks at the outer eye corners | skin `#E8BC92`; pauldron `#D4A62A` | gold pauldron on the right shoulder (later arcs) |
| Rangiku | 172 → 83 | long wavy strawberry-blond hair; pink stole; open kosode; sword across the back of the obi; Shikai = a bare hilt + ash cloud | beauty mark, blue eyes | hair anime `#F3A65A` / manga `#F2C14E`; stole `#F3A9BE` | badge on the sash; mark under the right mouth corner |
| Hisagi | 181 → 87 | short spiky black hair; bare muscular arms; black choker and arm bands; chained twin sickles | three scars, "69", blue stripe | stripe `#3E86C9` | scars over the right eye; 69 and stripe on the left cheek |
| Shinji | 176 → 84 | blond blunt bob with a straight fringe; lanky slouch, hand in pocket, sword on the shoulder; long-sleeved haori 五 | half-lidded eyes, huge upper-teeth grin | hair `#EFD27E` | - |
| Starrk | 187 → 90 | slouch; upturned high collar framing a bone jaw-collar; released: fur-collared jacket, ribbon bandoleers into the forearms, twin pistols, fur boots | sleepy eyes, faded goatee | hair `#3A2A1F`; fur `#8A8D93` | "1" on the back of the left hand |
| Baraggan | 166 → 80 | barrel-chested old man; crown hovering above the forehead; huge white mustache; fur-lined coat; chain belt with a sun disk; double axe; released: crowned skeleton in a purple cloak | olive left eye, scars | gold `#D4AF37`; cloak `#4A2560` | scar across the right eye |
| Harribel | 175 → 84 | short blonde hair with three braided locks; high collar covering the face to the nose; wide hollow sword across the upper back; paw-like black gloves; released: shark-fin spaulders, pata blade | aqua eyes; blue estigma when released | hair `#E8C24A`; skin `#B4805A` | "3" on the right breast |
| Ulquiorra | 169 → 81 | slender, hands in pockets; long coat tails, high collar; broken one-horned helmet; R1 bat wings, R2 tail and black-furred limbs | tear lines, green slit pupils, black lip | skin `#F2F0EC`; green `#38D46A` | helmet horn on the left; "4" on the left pectoral |
| Nnoitra | 215 → 103 | very tall, rail-thin, hunched; spoon-shaped hood; long curled boots; giant double-crescent weapon with a chain; released: crescent horns, 4-6 arms | white eyepatch, huge grin | weapon `#D9B23A` | hair curtain, eyepatch and hole on the left |
| Grimmjow | 186 → 89 | spiky swept-back cyan hair; high upturned collar; open jacket, bare chest with the abdominal hole; hands in pockets | teal estigma; right jaw mask; scar after fight 1 | hair `#4FC6E8`; estigma `#23A383` | jaw mask on the right; "6" lower back right; scar left shoulder → right hip |
| Yammy | 230 → 110 | hulking, slumped; ridged bald scalp, black sideburns, thin ponytail; open jacket, big chest hole; released kaiju | red estigma, orange brows, jaw bone with teeth | skin `#C99364` | "10" on the left shoulder |
| Nelliel | 176 → 84 (child ≈ 95 cm → 46) | ram-horned skull helmet; long wavy green hair; TYBW: green fur sleeves, red pauldrons, hoof gauntlets; child: cartoon skull, oversized robe | scar from the forehead down between the eyes; crimson estigma | hair `#6CC08A` | "3" mid-back; child mask cracked on its left |
| Ginjō | 187 → 90 | slicked-back shoulder-length black hair; bulky fur collar; X pendant; big two-handed sword with an open gold window | confident smirk | energy green `#8FF0A4` | - |
| Tsukishima | 198 → 95 | tallest of the cast, lanky; wavy shoulder-length black hair; suspenders over a pale shirt; katana with a bookmark tsuba and tassel; book | calm | sepia/ink effects | - |
| Yhwach | 200 → 96 | tall, regal; straight black hair to the lower back; white coat with big cuffs; tattered ankle-length cloak; hand on hip | mutton chops + moustache; Almighty eyes | cloak `#2A1518` / white; blue aura `#4A78F0` | cloak fastened on the left; medal on the left breast |
| Haschwalth | 189 → 91 | sheet of straight blonde hair past the waist; calf-length white coat with a dark-green fur strip; angular gold shield; cruciform sword | a strand hanging over the left eye | hair `#EBD9A0`; fur `#2E4632`; gold `#E0B44A` | fur strip down the left front; shield on the left forearm |
| Bazz-B | 179 → 86 (+mohawk 9-12) | tall swept-back red mohawk over shaved sides; cropped white trousers, chunky black boots; skull armbands | green eyes; ear hardware | mohawk `#D42A2F` | two hex nuts in the upper-left ear, one bolt through the lower-right ear |
| Ichibē | 181 → 87 (+geta 6) | very broad; bald dome; huge black beard; big red prayer beads; long white sleeves; a brush taller than a staff | thick upswept brows, grin, red eyes | beard `#121212`; skin `#C68A5E` | - |

---

## 11. Canon variants - choose once per model
- Many colours differ between manga colour pages, the classic anime (2004-12) and the TYBW anime (2022-26):
  Ichigo's Getsuga (gold vs blue), Byakuya's petals and scarf (white/silver vs pink/light green), Shinji's Cero
  (yellow vs crimson), Rangiku's hair (golden vs strawberry blond), Yoruichi's hair (black/plum/indigo), Urahara's hat
  and cane, Nelliel's hair (green vs turquoise). **Default: TYBW anime / modern colour pages**; classic-anime values
  are alternate palettes. Record the choice in the model brief and keep every effect of that character consistent.
- Anime-only, movie-only and game-only looks (Blood Chains Ichigo, Zanpakutō spirits, Brave Souls skins) are flagged
  in the dossiers; build them as optional skins/forms, never as the default.
