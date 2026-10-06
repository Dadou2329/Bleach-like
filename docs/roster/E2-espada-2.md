# Roster E2 — Espada 6–10 & Nelliel

Design dossiers for the lower half of Aizen's Espada and the former Tres: **Grimmjow Jaegerjaquez** (deep dive: sealed brawler, TYBW partial claws, Pantera, every canon fight incl. TYBW and the CFYOW novel), **Zommari Rureaux** (Gemelos Sonído, Amor limb-hijacking), **Szayelaporro Granz** (Fornicarás, lab gadgets, edible Fracción, and his Hell-arc return as Jailer of Hell), **Aaroniero Arruruerie** (Glotonería, the Kaien Shiba disguise with Nejibana, absorbed Hollow powers), **Yammy Llargo** (Ira — a kaiju boss that keeps growing) and **Nelliel Tu Odelschwanck** (child / adult / Gamuza centaur, Cero Doble; with Pesche, Dondochakka and Bawabawa as assists).

Conventions used below
- Heights → voxels at **32 vox/m** (cm × 0.32, rounded). Giants (> 4 m) are specced at a coarser build density (16, 8 or 4 vox/m) and scaled in engine.
- Hex colors are **estimates** (manga color pages / anime); **(verify)** = the hue is not stated by any source or is uncertain — check reference art before modeling.
- Engine tags use the brief's vocabulary in `[brackets]`; needs beyond that list are tagged `[NEW: …]` and collected in **§8**. Names already coined by sibling files are reused (`PortalRender`, `PocketDimension`, `ScreenSpaceDistortion`, `DamageThreshold`, `HoleHitbox`, `AshDeath`).
- Source flags: **anime-only**, **novel-only** (Ryōgo Narita's *Can't Fear Your Own World* = CFYOW; *Spirits Are Forever With You* = SAFWY), **one-shot** (*NO BREATHES FROM HELL*, 2021), **game-only** (Brave Souls, Heat the Soul, Versus Crusade, Soul Resurrección — optional inspiration, never canon), **proposal** (our gameplay extrapolation).
- Canon power scale (same as F): 10 = Yhwach / final Aizen · 9 = Yamamoto, final Ichigo · 8 = top-4 Espada, strongest captains · 7 = average captain, lower Espada · 6 = Privaron Espada, elite Fracción, strong lieutenant · 5 = lieutenant / Números · ≤4 = seated officers and below.
- Sources: bleach.fandom.com pages listed per character (MediaWiki API dumps in `wiki/E2/` and `wiki/E2/extra/`, incl. full plot pages and the battle pages named in each dossier). Everything is paraphrased.
- Answers to the brief's open questions up front:
  - **Cero Sincrético is not a Nel or Grimmjow technique.** It is the fused Cero of Nel's Fracción **Pesche + Dondochakka** (purple + yellow). No manga, anime, novel or game source pairs Nel and Grimmjow in a combined Cero. It is included as a Nel **assist** (§7a); a Nel × Grimmjow duo ultimate is listed only as a non-canon proposal.
  - **Szayelaporro does return.** In the 2021 one-shot *NO BREATHES FROM HELL* (wiki: "Echoing Jaws of Hell arc") he climbs out of Hell as its **Jailer**, with chains, horns, clairvoyance and a heavily altered body (§4b). Nothing beyond the one-shot is in the fetched pages.
  - **Grimmjow's Bala is never shown on-page** (games give it to him); his canon Cero is **red**, his Gran Rey Cero **blue**.
  - Nel's TYBW fight beside Uryū against Soul-King Yhwach (Galope into his darkness, Lanzador Verde severing his arm, rescuing Harribel from Silbern) is **TYBW anime** material; the manga never shows it and CFYOW contradicts parts of it. Flagged anime-only.

---

## 0. Quick reference

| Character | Rank / aspect of death | Height → vox | Number tattoo | Hollow hole | Mask remnant | Release (command) | Reiatsu · Cero | Tier · Power |
|---|---|---|---|---|---|---|---|---|
| Grimmjow Jaegerjaquez | Sexta (6) / Destruction (破壊) | 186 cm → 60 | "6" on the **lower back, right side**, beside the rear opening of his hole | **Center of the abdomen** (through-hole) | **Right half of a toothed jawbone** hugging the right cheek and jaw | Pantera — **"Kishire"** (軋れ, Grind) | light blue · Cero **red**, Gran Rey Cero **blue** | **S** · 7 (Pantera 7.5) |
| Zommari Rureaux | Séptima (7) / Intoxication (陶酔; Viz: Ecstasy) | 196 cm → 63 | **Never shown** (hidden by his uniform) | **Right nipple / right pectoral** | **Row of bone spikes along the skull crest** (mohawk) + **two skull earrings**; thick bone necklace possibly part of it | Brujería — **"Shizumare"** (鎮まれ, Suppress; Viz: Subside) | pink · none shown (games: violet-black palm-eye blast) | **B** · 6.5 |
| Szayelaporro Granz | Octava (8) / Madness (狂気) | 185 cm → 59 | **Unknown** (none visible even shirtless) | **Glans** (never shown); Hell form: **white ring floating behind his back** + a new chest hole | **Rectangular-framed glasses** | Fornicarás — **"Susure"** (啜れ, Sip) | pink (novel) · none shown (games: pink from mouth; novel: pink Gran Rey Cero) | **A** · 6 (Hell 7) |
| Aaroniero Arruruerie | Noveno (9) / Greed (強欲) | 205 cm → 66 | "9" on **both small heads** inside his glass head | **Left thigh** | On both heads: **top head ¾ masked, bottom head ½ masked**; wears a separate **tall 8-hole white mask** over the capsule | Glotonería — **"Kuitsukuse"** (喰い尽くせ, Devour) | dark purple · none shown (Versus Crusade: light blue from tentacles) | **B** · 6 |
| Yammy Llargo | Diez (10) → Cero (0) / Rage (憤怒) | 230 cm → 74 (released: kaiju, keeps growing) | "10" on the **left shoulder**; on release the "1" melts away → "0" | **Center of the chest** | **Lower jawbone with 8 teeth** resting on his chin (becomes his real jaw when released) | Ira — **"Buchikirero"** (ブチ切れろ, Get Pissed Off; Viz: Enrage) | released: orange-red · Cero **red**; Cero Oscuras **black** (manga) | **A** (boss) · 6 (Ira 7.5) |
| Nelliel Tu Odelschwanck | ex-Tres (3) / Sacrifice (犠牲) | adult 176 cm → 56; child ≈95 cm → ≈30 (estimate) | large **"3" in the middle of the back** | **"Inside her heart"** (Kubo Q&A #463) — no visible hole | **Ram-horned skull helmet** on top of the head (child: cartoon skull, cracked on its left side, 4 left teeth missing) | Gamuza — **"Utae"** (謳え, Declare; Viz: Praise) | not stated · Cero **pink**; Galope flash blue | **A** · 7 (Gamuza 7.5; child 2) |

---

## 1. Shared Arrancar baseline — deltas for this file

The full racial kit (Sonído, Cero, Bala, Hierro, Pesquisa, Descorrer/Garganta, High-Speed Regeneration, Resurrección rules, Gran Rey Cero, Cero Oscuras, Caja Negación, Las Noches laws, true-hole hitboxes, ash death) is written up in **E1 §1** and **F §0**; all of it applies here. What each of these six actually shows in canon:

| | Sonído | Cero | Bala | Gran Rey Cero | Cero Oscuras | Hierro | Pesquisa | Descorrer | Regeneration |
|---|---|---|---|---|---|---|---|---|---|
| Grimmjow | master | red; palm or fist, either hand | not shown | **blue**; blood from a palm cut on his own blade | — | very high | yes (meditative, with Fracción) | yes | none (release heals) |
| Zommari | "fastest of the Espada" + Gemelos Sonído | not shown | not shown | not shown | — | implied | — | implied | — |
| Szayelaporro | yes | not shown (games: pink, mouth) | not shown | novel: **pink** | — | yes | — | Garganta device in his lab | eats Fracción to heal; Gabriel rebirth |
| Aaroniero | expert | not shown | not shown | not shown | — | not stated | — | — | — |
| Yammy | yes (heavy) | red, **mouth** | red, **fists**, rapid | not shown | **black** (manga; anime recolors red) | 2nd hardest Espada | **poor** (weakness) | yes | full heal on each rage evolution |
| Nelliel | master; child: Chōkasoku | **pink**, mouth | novel-only | — | — | yes (palm-stops a Cero) | — | yes | — |

Notes specific to this file:
- **Release swaps the reiatsu signature** (Aizen-made Arrancar go from Arrancar to Hollow reiatsu). Urahara exploited this to slip a released Grimmjow through Askin's Gift Bereich, which only recognized reiatsu it had already "read". → `[NEW: SignatureSwap]`: keyed barriers/sensors stop recognizing a character after T.
- Released Espada reiatsu triggers **primal fear** in weaker Arrancar (Harribel): each released **C** flare freezes Números-tier NPCs.
- Model constants (same values as F §0): uniform white `#F4F3EF` / shadow `#D8D5CE`, sash `#17171B`, boots `#121216` with white lines `#ECECEC`, mask bone `#F1EDE3` / crevice `#C7C1B4`, number tattoos `#111114`, hole interior `#060609`. Mask fragments float 1 voxel above the skin (Kubo Q&A #646).

---

## 2. Grimmjow Jaegerjaquez (グリムジョー・ジャガージャック) — Sexta (6th) Espada, aspect of Destruction; Ichigo's rival, later a free agent

- **Wiki:** https://bleach.fandom.com/wiki/Grimmjow_Jaegerjaquez · https://bleach.fandom.com/wiki/Grimmjow_Jaegerjaquez/Expanded_Universe · technique pages Desgarrón, Garra_de_la_Pantera, Sonic_Wave, Gran_Rey_Cero, Caja_Negación · battles: *Ichigo Kurosaki vs. Grimmjow Jaegerjaquez* (+ *Rematch*, + *Final Fight*), *Ichigo Kurosaki & Ayon vs. Quilge Opie*, *Kisuke Urahara vs. Askin Nakk Le Vaar*
- **Roster tier:** **S** — fan favorite, Ichigo's rival across three arcs plus TYBW; the purest "destruction" brawler and the best showcase for the destructible world (towers, pillars, trenches). Ship first.
- **Canon power:** **7/10** sealed, **7.5** in Pantera. One-armed he held off masked Bankai Ichigo and then a masked Shinji; released he briefly overpowered masked Bankai Ichigo and cut through a masked Getsuga barehanded; in TYBW one stroke from behind bisected a Vollständig Quilge through Blut Vene, and released he punched through Askin's Vollständig chest and crushed his heart. Novel (CFYOW) Grimmjow is a confirmed Vasto Lorde and clearly stronger (≈8).
- **Body:** 186 cm → **60 vox**; 80 kg. Tall, lean-muscular brawler: broad shoulders, narrow waist, long limbs, defined abs. Idle: slouched with **hands jammed in his hakama pockets**, head cocked, wide toothy grin. Silhouette keys: spiky swept-back cyan hair; **high upturned jacket collar**; open jacket over a bare chest with the abdominal hole; asymmetric **right-side jaw mask**; teal marks under the eyes; from fight 1 on a **long diagonal scar from the left shoulder to the right hip**.
  - Hole: center of the abdomen, just below the sternum, ≈12 cm wide → ~4 vox through-hole (estimate). Tattoo "6": lower back, right of the hole's rear opening, ≈10 cm → 3–4 vox.
  - Pantera keeps the same body height, but adds a mane to the hips, swept-back cat ears, a whip tail **longer than his body** (≥190 cm → 60+ vox, 2–3 vox thick, tapering), forearm blades and calf blades.
- **Palette (hex estimates):**
  - Skin `#F2D2B6` (shade `#D8AE8E`) · hair cyan `#4FC6E8` (shadow `#2B93BE`, highlight `#A4E6F6`) · eyes light blue `#6ED3F4` (pupil `#10303C`) · estigma (green "eyeshadow" under the eyes, like big-cat markings) teal-green `#23A383` (shade `#187560`)
  - Jaw mask bone `#F3F0E6` (crevice `#CCC6B5`), teeth `#FBF9F2` · scar `#D49A86` (edge `#B97C69`) · tattoo `#111114`
  - Espada uniform: jacket and hakama white `#F4F3EF` (cool shade `#CDD3DB`), **jacket lining black** `#141416`, sash `#17171B`, boots `#121216` with white lines
  - TYBW: zip shirt black `#19191C` (zipper `#AEB4BA`), pants `#1D1D21`, boots `#121214`, two black leather belts `#2B2B2E` with steel buckles `#A9B0B6` (verify), white Espada jacket on top
  - Pantera sword: blade `#D5DCE2` (edge `#F2F6F9`), handle wrap light blue `#77C3E3`, sheath light blue `#86CBE6` (lacquer shade `#5DAFD1`), crooked-"S" tsuba steel `#9FA8AF` (color not stated — verify)
  - Pantera form: armor bone-white `#F3F1E8` (segment seams `#A9A495`, shade `#CBC6B6`); hands, claws and paws black `#141418` (sheen `#3B4250`); forearm and calf blades `#EFECE2` (edge `#FFFFFF`); tail white `#F3F1E8` (verify); brow headpiece `#F3F1E8`; extended markings `#23A383`; fangs `#FBF9F2`
  - Energy: reiatsu light blue `#5CC8FF` (core `#E6FAFF`) · release torrent pale blue `#9FE0FF` · Cero red `#E31B2E` (core `#FFD2D6`, glow `#FF4A4A`, rim `#8C0C18`) · Gran Rey Cero blue `#2C6BFF` (core `#DDEBFF`, glow `#5FA2FF`, warped-space rim dark violet `#2A1E5C`) · Desgarrón talons cyan-white `#A8F0FF` (glow `#44C8FF`) · Garra de la Pantera darts dark-green crystal `#1D5A43` (facets `#2E8C67`, glints `#7FD8AE`)
- **Look by form/outfit:**
  - **Espada (first Karakura raid):** white jacket with the collar flipped up high around the neck, sleeves pushed up to mid-forearm, worn wide open with no shirt so the black lining shows at the lapels; white hakama, black sash, katana thrust through the sash on the **left** hip; black boots. Spiky cyan hair swept back with a few strands falling forward. **Jaw mask:** a bone piece hugging the right side of his face from below the ear to the chin, shaped like the right half of a lower jaw with a row of teeth along the cheek. No scar yet.
  - **Scarred (from fight 1 on):** permanent diagonal Getsuga scar, left shoulder → right hip, across chest and abs. He keeps it on purpose; it stays on every later look.
  - **One-armed (second raid):** left arm gone **at the shoulder** (Tōsen cut it off and burned it away with Hadō #54); no "6" (his tattoo was burned off with the demotion). Orihime later restores both arm and tattoo.
  - **Battle damage:** right arm burned from hand to elbow (Cero clash with Ulquiorra, before the final fight); deep chest slashes from Ichigo in the final fight.
  - **Pantera (released):** mane-like very long cyan hair to the hips; ears become cat ears swept straight back; the under-eye marks stretch back to the ear tips; jagged fangs; jaw mask gone, replaced by a **white bone headpiece across the brow/forehead**; **form-fitting white segmented armor** over torso, arms and legs (his Adjuchas look), hole still open; **black clawed hands**; **black clawed cat paws** for feet; **blades jutting back from the forearms near the elbows** and **from the calves**; a long thin whip tail.
  - **Partial transformation (TYBW):** TYBW outfit with only the fingers/hands turned into black Pantera claws.
  - **TYBW outfit:** black zip-up shirt left half open (scar visible), black trousers, differently styled black boots, **two belts**, katana sheathed along the upper belt on his left side, the white Espada jacket still worn over it all.
  - **Adjuchas (flashback):** a small, sleek panther-like Hollow (bit a chunk out of Di Roy's head when they met). Colors unknown — reuse Pantera's armor language on a quadruped (verify against the manga flashback).
  - *Brave Souls "Beyond Resurrección" (game-only, Kubo design):* no mask; long white hair fading to blue/black at the tips; black-flame eyebrows outlined in blue; black tattoos wrapping the chest; scar split open and filled with blue reiatsu; white fur with black stripes and spots; **two flaming tails**; Hōgyoku glowing blue in the hole; sickle spurs on the ankles. Optional alt skin only.
- **Weapons:**
  - **Pantera (sealed):** standard katana (~70 cm blade → 22–24 vox, ~25 cm handle → 8 vox); light-blue handle and sheath; tsuba a rigid crooked "S" (zig-zag). He fights mostly barehanded: draws it for serious exchanges, tosses it aside mid-fight, **stabs it through an opponent's wrist to pin them to the ground**, and drags his palm along it to bleed for Gran Rey Cero.
  - **Pantera (released):** no sword — ten black claws, forearm blades (he blocks swords on them; Garra de la Pantera fire from the elbows), calf blades, and the tail (canon: used as a downward whip to the head).
- **Forms & states (ordered):**
  1. **Sealed — "Sexta Espada"** (default): brawler + Cero; sword optional.
  2. **Partial Transformation** (TYBW): hands become Pantera claws without releasing — G toggle.
  3. **Resurrección: Pantera** — "**Kishire, Pantera**" (軋れ「豹王」, *Grind, Panther King*; "grind" as in grinding teeth). Motion: right hand holds the sword low as if starting an upward sweep, the blade glows light blue, he presses the left hand to the flat and **rakes his fingers along it like claws** while saying the command → torrent of reiatsu and violent gale. Speed, strength and Hierro jump; prior wounds heal; reiatsu turns Hollow (fear + signature swap). When he is too wounded, Pantera dissolves back into the sword.
  4. *(Optional, game-only)* Beyond-Resurrección skin with "Pantera Destrucción".
- **Abilities (complete):**
  - *Sealed*
    - `Sonído (響転, "echo turn")` — master level; keeps pace with Bankai Ichigo unreleased. Habit: blinks behind the target and smashes the ground where they stand. Visual: blue-white static streak with a booming "bun". [Teleport, Mobility, Afterimage/Clone, Sensing/Stealth]
    - `Hand-to-hand (primary style)` — unpredictable punches and kicks: forearm blocks against a Bankai blade, kick to the head → flurry → downward stomp into the street; kicks that wreck several buildings; open-hand **nukite** stabs through a Shinigami's stomach (Rukia) and through Hierro (Luppi's chest). [MeleeArc smash, Grab/Throw]
    - `Blade catch & throw` — stops a Shikai blade with his bare palm and sends the wielder flying with a **wrist-flick burst of reiatsu**; grabs a Bankai blade by the edge and hurls the wielder down the street; holds an enemy blade still while Ceroing its owner. [Absorb/Reflect/Redirect (parry), Grab/Throw]
    - `Zanjutsu with Pantera` — on par with masked Bankai Ichigo while one-armed; **one slash from behind cut Vollständig Quilge vertically in half**, through Blut Vene, before he could react; pins limbs by stabbing through them into the ground. [MeleeArc cut, Slice (small), Bind]
    - `Cero (虚閃, "hollow flash")` — **red**, from the palm or a closed fist, either hand, and he switches hands mid-exchange (left-hand Cero, then throws his sword aside and charges a right-hand Cero at the head). Strong enough to punch through a Getsuga Tenshō. **Point-blank** use is his signature: holding a victim's head, or fired inside a body he has impaled (vaporized Luppi's upper half; blasted Menoly). Also **defensive**: cancelled Ulquiorra's Cero (burning his own arm) and blunted Shinji's Cero by countering at the last instant. Destruction: shears tower tops, gouges street-length trenches. [Beam, Blast, Absorb/Reflect/Redirect (counter-beam clash)]
    - `Gran Rey Cero (王虚の閃光, "flash of the king hollow")` — he drags his palm along his own blade, aims the **bleeding hand**, and fires a huge blue Cero that spins like a razor, pulses (compress/decompress) and warps space as it travels. Espada-only and **banned in Las Noches**; he fired it there anyway, not caring that Orihime and Nel were behind his target. Canon damage: tore a long gap through the sand and engulfed the upper half of a Las Noches tower; masked Ichigo blocked it. CFYOW: shredded several of revived Luppi's tentacles. [Beam, Blast, Environmental, NEW: HPCostCast, NEW: ScreenSpaceDistortion]
    - `Bala (虚弾)` — racial; **never shown for him on-page** (Shattered Blade and The 3rd Phantom give him one). Optional, flagged. [Projectile]
    - `Hierro (鋼皮, "steel skin")` — bare hands vs. Shikai and Bankai edges; survived a point-blank masked Getsuga (badly hurt) and broke straight out of Rukia's Hakuren ice ("freezing the top layer of skin won't kill me"); one-armed he took two masked hits with minor injuries. [passive, NEW: DamageThreshold]
    - `Pesquisa (探査神経)` — meditative radar sweep (eyes closed) with his Fracción to count enemies before a raid. CFYOW: dodges an ambush on instinct; **very sharp hearing**. [Sensing/Stealth]
    - `Descorrer (解空)` — tears open a Garganta with a gesture (his unauthorized Karakura raid; enters the Soul King Palace through a Garganta in TYBW). [Teleport, NEW: PortalRender]
    - `Caja Negación (反膜の匪)` — the Espada's punishment cube; it has to be **planted into the target's Hollow hole**, then seals them in a pocket dimension (used on Ulquiorra; an Espada breaks out in ~2–3 hours). Visual: small dark cube → black box of void folding around the victim. [Bind, Status, NEW: PocketDimension]
    - `Instinctive combat read` — reads stamina and limits from tells (Ichigo has 2–3 Getsugas left; the mask has a time limit, judged from his breathing). AI flavor, see AI notes.
    - `Partial Transformation` (TYBW) — at will, fingers and hands become Pantera claws without a full release; used to chase Askin across Wahrwelt rooftops. [Transform (partial), NEW: PartialTransform]
    - `Fracción command` — Shawlong, Edrad, Yylfordt, Di Roy, Nakeem (dossiers in **F**). Story summon for the first Karakura raid only.
  - *Pantera (released)*
    - `Enhanced Hierro` — tanked a point-blank masked Getsuga, and later **cut through a massive Getsuga with his bare hand**, unhurt. [passive]
    - `Feline speed & agility` — matches masked Bankai Ichigo; crosses tower to tower in seconds and catches opponents mid-flight. Proposal: all-fours gallop, wall-run and wall-cling on claws, ceiling pounce. [Mobility, NEW: ClawClimb]
    - `Enhanced strength` — collateral alone topples Las Noches' skyscraper-sized pillars; one blow sends Ichigo **through two towers in a row**; a downward swipe drives a target **vertically through a whole tower**; a few light hits launch a man hundreds of meters; punched through Askin's Vollständig chest, **tore out and crushed his heart**, then stabbed his other hand into Askin's back. [MeleeArc smash, Grab/Throw]
    - `Sonic Wave (roar; unnamed in canon)` — a roar loud enough to throw out visible concentric shockwaves that slam into foes (Ichigo had to brace) and unsettle them. Low structural damage, high knockback. [Blast (sound ring), Status (fear/stagger)]
    - `Spin-kick → tail whip` — spins in the air to load a huge downward kick; when it is dodged, the same rotation brings the **tail** down onto the target's head (canon). [MeleeArc smash]
    - `Forearm-blade guard & double nukite` — catches a sword on the forearm blade (it grinds along it) and kicks with the free leg; stabs a hand into each of the opponent's flanks. [MeleeArc cut, Shield]
    - `Garra de la Pantera (豹鉤, "panther hook"; Sp. "panther's claw")` — up to **five** dark-green, unevenly cut crystalline dart-bombs fired at high speed from the elbow blades; **one dart destroys a column more than 30 m across** (demo: blew the top half off a tower). Masked Ichigo absorbed all five with his back to shield Orihime and kept fighting. Soul Resurrección calls it *Afilado* (game-only). Explosion radius ≈ 15 m (≈60 world vox). [Projectile (needle/bolt, multishot, explode carving)]
    - `Desgarrón (豹王の爪, "panther king's claws"; Sp. "tear/rip")` — his self-declared strongest attack: the claws glow, **five long reishi talons form over each hand** (ten max), and he throws them like claw strikes that follow his slashing motions — the left set brought down like a cleaver, the right set hurled as a volley. Talons are tower-scale (≈10–15 m each, estimate). Counter shown: Ichigo blocked a set and **ground his sword through one talon until it shattered**. CFYOW: gravely wounded a weakened Ikomikidomoe; a clash with Luppi's eight simultaneous Gran Rey Ceros was feared to level a Rukongai district. [Projectile (crescent/claw, multishot), Slice, MeleeArc cut, NEW: GestureControlledProjectiles]
    - `Primal fear` — released Hollow reiatsu terrifies weaker Arrancar. [Status (fear), Field]
    - `Release heal / signature swap` — all prior wounds heal on release; keyed barriers stop recognizing him (Askin's Gift Bereich). [Heal/Reject (self), NEW: SignatureSwap]
    - Cero while released: not shown in canon (Versus Crusade keeps it) — allowed in game.
  - *Novel-only (CFYOW):* toxin resistance acquired from surviving Askin's poison; enhanced hearing; Vasto Lorde-level reiatsu (Harribel avoids fighting him; Kenpachi wants to).
- **Passives & weaknesses:** Hierro damage threshold; full heal on release; Hollow-signature swap. Poison: a single Gift Ball dropped him the moment he slashed it. Impulsive (Gran Rey Cero into allies' line; picks fights with interlopers; won't fight an injured rival, so he heals them first). Pantera dissolves when he is too wounded. Shallow freezing and binding Kidō stop him only briefly.
- **Signature moments to recreate:**
  1. **First Karakura raid (night):** Pesquisa with the Fracción → nukite through Rukia → catches Ichigo's Shikai barehanded and flicks him away → forearm-blocks the Bankai, kick-flurry-stomp → Ichigo's black Getsuga scars him (diagonal gash cinematic) → he draws his sword ("my turn") → Tōsen arrives; exit line: remember my name.
  2. **Throne room:** Tōsen severs and incinerates his left arm (cutscene; demotion; Luppi becomes Sexta).
  3. **Second raid, one-armed vs. 11-second mask:** point-blank masked Getsuga wounds him → the mask breaks → he pins Ichigo's wrist with his sword and readies a head-range Cero → Rukia's Hakuren freezes him → he breaks out and grabs Rukia's head for a point-blank Cero → masked Shinji intervenes; Grimmjow blunts Shinji's Cero with his own, starts "Kishire…" and Ulquiorra drags him off in a Negación beam.
  4. **"I am the Sexta":** Orihime restores arm and tattoo → hand through Luppi's chest → Cero vaporizes his upper body (playable execution).
  5. **Orihime's room:** knocks out and maims Loly, Ceros Menoly point-blank, takes Orihime to heal Ichigo → clash with Ulquiorra (Cero vs. Cero, burned arm) → **Caja Negación into Ulquiorra's hole**.
  6. **Final fight among the Las Noches towers:** sword lock, alternating Ceros (one pierces a Getsuga) → **Gran Rey Cero** from a bleeding palm → **"Kishire, Pantera"** in the sand → roar → tower-to-tower brawl (Ichigo through two towers; driven vertically through another) → spin-kick + tail whip → **Garra volley that streaks toward Orihime's tower** → double nukite → **Desgarrón** (Ichigo shatters a talon) → Pantera dissolves → he gets up anyway → Nnoitra's ambush.
  7. **TYBW, Hueco Mundo:** one slash from behind cuts the revived Quilge Opie in half; blade at Urahara's throat (deal scene).
  8. **TYBW, Wahrwelt:** leaps out of Yoruichi's Garganta to restart his rematch with Ichigo (adult Nel bowls him over); hunts Askin over rooftops with partial claws; slashes a Gift Ball and collapses; Urahara heals him and opens a Bankai-made path into the Gift Bereich → **Pantera, hand through Askin's chest, heart crushed** → Askin's dying Gift Ball Deluxe intensifies → Nel's rescue.
  9. *(Novel, optional)* CFYOW: Grimmjow vs. revived Luppi (Desgarrón vs. eight Gran Rey Ceros), vs. Hikone/Ikomikidomoe.
- **Kit proposal:**
  - *Sealed (Sexta)*
    - **Shift:** Sonído burst (short blink, static streak, "bun"); chain ×3; double-tap with lock-on = behind the target, auto-follow-up ground smash if they don't move.
    - **LMB chain (brawler):** jab → hook → spinning back-kick → rising knee. Forward = lunging nukite (impales light enemies, sticks into heavy ones for 0.5 s); back = upward-kick launcher; air = punch/kick flurry ending in a stomp; down-in-air = stomp slam (crater); sprint = shoulder tackle that carries the target through walls.
    - **Hold LMB:** charged **nukite impale** — on hit the victim stays skewered; press Q while impaling = **internal Cero** (Luppi execution).
    - **RMB:** Hierro forearm guard; timed parry = **blade catch** (grab the weapon; LMB = wrist-flick reiatsu burst throw, Q = point-blank Cero while holding it).
    - **Q** Cero — tap = quick palm/fist shot (alternates hands), hold = charged beam; tapping while an enemy beam is hitting you = counter-Cero clash.
    - **E** Pantera draw-cut — Sonído behind + one vertical draw slash, cut mode, ignores armor buffs (Quilge kill).
    - **R** Sword pin — stab Pantera through a downed target's limb into the ground (Bind) or throw it to pin at range; he brawls barehanded until he picks it up.
    - **F** Bala (optional, game-sourced) — rapid blue bolts from the fist.
    - **Z** Caja Negación — grab, plant the cube in the hole/chest, banish for N s (Números: until the fight ends; Espada and captains: a short time-out).
    - **X** Descorrer — tear a Garganta (portal to a marked point / arena exit); hold X = Pesquisa pulse (eyes closed, rooted).
    - **G** Partial Transformation — claws on: LMB becomes five-line claw rakes with longer reach that carve grooves in walls; wall-cling enabled.
    - **C** light-blue flare (ground cracks; Números kneel).
    - **V** **Gran Rey Cero** — palm drag on the blade (HP cost ~5%), spinning blue beam with a space-warp shader; bores a long trench and decapitates towers.
    - **T** "Kishire, Pantera" cinematic (claw-rake on the blade, gale knocks everything back, full heal).
    - **Tab:** Cero (palm / fist / alternating), point-blank Cero, counter-Cero, Bala, Gran Rey Cero, Pesquisa, Descorrer, Caja Negación, (story) call Fracción.
  - *Pantera*
    - **Shift:** Pantera Sonído — longer, faster, chainable **off walls and pillars**; double-tap with lock-on = pounce from above/behind. Holding sprint = **all-fours gallop**; jumping at a wall = claw-cling, wall-run, ceiling pounce.
    - **LMB:** claw rake L → claw rake R → spinning heel kick → tail lash. Forward = pounce-lunge claw; back = rising-kick launcher (sends the target above the tower); air = claw flurry + spin kick; down-in-air = **downward swipe that drives the target vertically through whatever is below**; sprint = tackle that carries the target through two towers.
    - **Hold LMB:** spinning axe-kick → tail whip (canon two-hit heavy).
    - **RMB:** block on the forearm blades (sparks as swords grind along them); parry = blade catch.
    - **Q** Garra de la Pantera — tap = one dart from the elbow, hold = five-dart volley (fan or focused, light homing); each dart is a huge explosion.
    - **E** Pantera Roar (Sonic Wave) — radial sound rings: knockback + fear; shatters glass and thin walls.
    - **R** Double nukite / **Heart Rip** — stab both flanks; from behind on a staggered target = grab-finisher through the chest that tears out and crushes the heart (goes through Blut Vene-class armor).
    - **F** Pounce — long leap onto a target or surface, landing claws-first (pin + maul) (proposal).
    - **Z** Blade spin — spinning kick with the calf blades, cut mode (proposal from the model).
    - **X** Cero (released; Versus Crusade-sourced) — hold = Gran Rey Cero, palm cut on a forearm blade (proposal).
    - **G** feral locomotion toggle (quadruped default vs. upright).
    - **C** Hollow-reiatsu flare = primal fear (weaker Arrancar and NPCs freeze).
    - **V** **Desgarrón** — five talons form over each hand; for ~4 s each LMB swipe flings the next set along the swipe path (left set, then right set, or both crossed); talons carve five parallel trenches through everything; a stronger blade clash can shatter a talon (canon counter).
    - **T (hold):** reseal (Pantera dissolves back into the sword).
    - **Tab:** Garra count/spread, Desgarrón pattern (cleave / volley / cross), Cero variants.
    - *Optional (game-only):* Beyond-Resurrección skin with **V "Pantera Destrucción"** (ignite the twin tails, front-flip, Desgarróns in every direction, burn).
- **AI notes:** grins, taunts, keeps his hands in his pockets until he is hit. **Phase 1 (sealed):** toys with the player (one-hand blocks, goads them to "show" their power), punishes with nukite and point-blank Cero; counts the player's big attacks and comments when they are running low; if the player uses a timed G-state (mask, Shunkō…) he pressures until it expires. **Phase 2:** fires **Gran Rey Cero** regardless of allies/civilians behind the player (telegraph: palm dragged along the blade). **Phase 3 (HP ≤ 50% or the player masks/Bankais):** releases → pillar-hopping, roar to interrupt charges, Garra volleys aimed at whatever the player is protecting (escort NPCs). **Desperation (HP ≤ 20%):** Desgarrón. Never retreats; when "defeated" he gets up again (Pantera dissolves → sealed last stand) until hard-killed or the story intervenes (Tōsen, Ulquiorra, Nnoitra). Fair-fight code: heals a wounded player before a scripted rematch; attacks any third party who interferes (Ulquiorra, Askin, guards).
- **Callouts:** "Kishire — Pantera!" · "Gran Rey Cero!" · "Desgarrón!" · "Garra de la Pantera!" (no on-page shout confirmed) · roars · "Kurosaki!!" · self-intro "Sexta Espada — Grimmjow Jaegerjaquez".

---

## 3. Zommari Rureaux (ゾマリ・ルルー) — Séptima (7th) Espada, aspect of Intoxication (Viz: Ecstasy)

- **Wiki:** https://bleach.fandom.com/wiki/Zommari_Rureaux · technique pages Gemelos_Sonído, Amor, El_Embrion · battle: *Byakuya Kuchiki vs. Zommari Rureaux*
- **Roster tier:** **B** — secondary playable / standout boss. Only one canon fight, but Amor's limb-hijacking is mechanically unique in the whole roster.
- **Canon power:** **6.5/10** — kept up with Byakuya's Shunpo, forced him to cripple his own left leg and left arm to break Amor, took Rukia hostage; but once Byakuya went Bankai and threw up Dankū he was outclassed and cut down in a single Shunpo strike.
- **Body:** 196 cm → **63 vox**; 100 kg. Tall, broad, muscular; serene upright posture, palms often pressed together as in prayer. Bald, with a **ridge of bone spikes running from the forehead to the nape** (mohawk silhouette); large full lips; **skull-shaped earrings** on both ears; a thick necklace of bone beads. Hole at the **right nipple** (≈8 cm → 3 vox), under the coat except at its small chest opening. The "7" is never shown.
  - Brujería: his upper body stays human-sized and sits on a **round bulb ≈2.5–3 m across** (estimate) → ≈3–3.5 m total height (≈100–110 vox at 32/m).
- **Palette (hex estimates):**
  - Skin deep brown `#4E3326` (shade `#34221A`, highlight `#6E4A38`) · lips `#4A2A26` · eyes golden yellow `#E8B923` (pupil `#111114`)
  - Bone crest, skull earrings, necklace `#EEE8DA` (shade `#C8C0AE`)
  - Estigma: three **downward triangles on the chin** `#141414`; above each eye **four thin lines run up the forehead, each ending in a dot** (eight "!" marks in total) — color not stated, assume the same near-black `#141414` (verify)
  - Uniform: long mandarin-collar coat white `#F4F3EF` (to the shins), white hakama, sash `#17171B`; kung-fu-style cloth shoes black `#1C1C1C` with white soles `#ECECEC`
  - Brujería sword: blade `#D3D7DB`; handle wrap **pink** `#E78FBB`; guard = thick disk with spikes around the rim (metal not stated — suggest antique gold `#B8954A` to echo the sun motif, verify); sheath not described (suggest white `#F4F3EF`)
  - Released: bone-clad torso and arms `#EFEBDF` (plates `#D5CFBF`); body eyes white sclera `#FFFFFF` with golden iris `#E8B923` (verify); active eyes glow **purple** `#A64DFF` with widened pupils; lower bulb pink `#E890B8` (ribs `#C96C98`, highlights `#F6B6D2`); rim faces (single-eyed, resembling his own face) — tone unclear, suggest skin `#4E3326` faces set into the pink bulb (verify); skull neck brace `#EEE8DA` with one eye; released face marks `#141414`
  - Energy: reiatsu pink `#F27DB8` · Amor glow purple `#A64DFF` · **Amor sun mark** dark violet `#2A1438` with purple rim `#A64DFF` (color not stated — verify)
- **Look by form/outfit:**
  - **Sealed:** see Body. The long coat has a **small opening at the chest**; the bones and skull earrings give a witch-doctor look.
  - **Brujería (released):** white foam swallows him and drips away to reveal a **bone-armored torso and arms studded with eyes** (50 including the two on his face), a big eye in the **right palm**, a **skull-shaped neck brace** with one eye at the front, and **eight slits across the forehead** that open into hidden eyes (58 total). His face marks change to two **downward triangles under the eyes** and **five triangles under the mouth** (a beard). His legs are replaced by a **huge ribbed pink bulb** (pumpkin / sea-urchin), ringed by **cyclopean faces** that resemble his own; he sits upright on it.
  - **El Embrion:** the bulb grows up over him and seals into a closed pink sphere.
  - **After El Embrion:** every body eye is blank white and bleeding (blinded); only the face and forehead eyes still work.
  - *Brave Souls "Beyond" (game-only):* four arms, scattered eyes of varied size, three floating eyes, one vertical forehead eye, violet reiatsu necklace, floating tiki-skull shields, open-lotus bulb, Hōgyoku in the right-pectoral hole.
- **Weapons:**
  - **Brujería (sealed):** ordinary katana (≈70 cm blade → 22 vox) with the spiked-disk guard and pink handle. On release it hovers horizontally in front of his chest and **bends at a right angle five times**, folding into a squared spiral that gushes white smoke/foam.
  - **Released:** no weapon — the eyes are the weapon.
- **Forms & states (ordered):**
  1. **Sealed** — sword, fastest Sonído, Gemelos Sonído.
  2. **Resurrección: Brujería** — "**Shizumare, Brujería**" (鎮まれ「呪眼僧伽」, *Suppress, Cursed-Eye Sangha*; Sp. "witchcraft"). Motion: sword levitates level with his chest, he claps his hands together, **twists his head 90° to the right** and braces; the sword folds; foam covers him; reveal.
  3. **El Embrion** — defensive shell state inside Brujería.
- **Abilities (complete):**
  - *Sealed*
    - `Sonído (響転)` — claims the fastest among the Espada; matched Byakuya stride for stride. [Teleport, Mobility]
    - `Gemelos Sonído (双児響転, "twin Sonído")` — by adding a few extra steps he leaves up to **five** solid-looking speed clones: one appears behind the target and strikes while his "image" stays in front; clones **bleed when cut**, so nobody can tell which is real. Used for distraction, substitution and attacks from every side ("just a magic trick"). [Afterimage/Clone, Mobility]
    - `Swordsmanship` — clean but not exceptional; Byakuya cut him and drilled a Byakurai through a clone's chest.
    - Racial: Hierro and Descorrer implied; Cero and Bala never shown.
  - *Brujería*
    - `Amor (愛, "love")` — **gaze control**. He fixes one (or several) of his eyes on a target, usually with a gesture such as raising the palm eye; the pupil widens and glows purple and the effect lands **instantly and invisibly** (Byakuya dodged "nothing"). A **sun-shaped mark** appears on whatever was taken and Zommari holds sovereignty over it: a marked limb no longer obeys its owner's brain and moves at his command (he made Byakuya step toward him; can force self-harm); marking the **head** takes the whole body (he made Rukia hold her own sword to her throat as a hostage); it also works on **objects** — "anything his eyes see" (he tried to seize Senbonzakura's blades). **One eye = one target**: 50 body eyes + 8 forehead eyes = 58 simultaneous holds. Kidō-like in nature: **Bakudō #61 Rikujōkōrō** on the victim stopped him from moving her, and **#81 Dankū** in his line of sight took the gaze instead (the sun mark printed itself on the barrier). Counter shown: cut the hijacked limb's muscles and tendons (Byakuya disabled his own leg and arm). [Status (mind control, per limb), Bind, NEW: LimbControl, NEW: GazeTargeting]
    - `Hidden forehead eyes` — eight slits above his eyes open for a fresh Amor volley even after his body eyes are blinded. [NEW: GazeTargeting]
    - `El Embrion (守胚姿勢, "embryo-guarding posture")` — the bulb expands into a full sphere around his upper body; it survived Byakuya's Bankai storm that **leveled the large building** they were in. Cost: every exposed body eye is destroyed (white, bleeding). [Shield, Stance]
    - `Mass control` — enough eyes to puppet a crowd (proposal: up to 58 NPCs); failed against a hundred million blade petals (too many targets).
    - Movement while released: barely shown (he leans back, pushes a blade away); proposal: slow hover/glide with short Sonído hops.
- **Passives & weaknesses:** hard cap of 58 holds; Kidō-type, so barrier Constructs and binding Kidō block or neutralize it; needs line of sight; El Embrion blinds him; arrogant — lectures instead of finishing, and stops watching his surroundings when frustrated (Byakuya simply Shunpo'd behind him).
- **Signature moments to recreate:**
  1. Aaroniero's tower: Zommari comes to "finish" the unconscious Rukia — Byakuya appears and refuses to give his name.
  2. Gemelos Sonído vs. Shunpo: clone strikes from behind; clones stab Byakuya's afterimage.
  3. Release (head twist, sword folding) → Amor lands on Byakuya's left ankle (sun mark) → forced step → Byakuya slashes his own leg tendons; then the left arm → he cuts that too.
  4. **Hostage:** Rukia's head taken, her blade at her throat; "drop your sword" — Byakuya drops it… into **Bankai**, and binds Rukia with Kidō so Amor can't move her.
  5. Senbonzakura storm levels the building → **El Embrion** → eight forehead eyes open → **Dankū** catches the sun mark → Byakuya at his back, Zommari begs, then rants that Shinigami have no right to judge Hollows → bisected; dies praising Aizen and turns to ash.
- **Kit proposal:**
  - *Sealed*
    - **Shift:** Sonído with the longest range and shortest cooldown in this file; **holding Shift** drops a Gemelos clone along the path.
    - **LMB:** calm, flowing sword chain. Forward = thrust; back = rising cut; air chain; down = drop cut; sprint = dash slash escorted by two clones.
    - **Hold LMB:** triangulated strike — he and two clones hit from three angles at once.
    - **RMB:** guard / parry.
    - **Q** Gemelos Sonído — spawn 1–5 bleeding clones (hold to choose formation: surround / line / decoy). **E** Substitution — swap places with any clone. **R** All-sides assault — every clone lunges at once. **F** Clone feint — the next hit he takes lands on a clone that pops (proposal). **Z/X** Tab extras (Descorrer; optional Cero, flagged).
    - **G** Meditation — rooted: regen + perception. **C** pink flare. **V** Fivefold Sonído — five clones + himself in a six-way encirclement (proposal). **T** release.
  - *Brujería*
    - **Movement:** slow hover on the bulb; **Shift** = short gliding Sonído hop.
    - **LMB:** palm-eye snap Amor — short cone that tags the limb under the reticle. **Hold LMB:** forced march — drag a tagged limb toward him (walk the victim off a ledge or into a beam).
    - **Q** Amor: limb — aim at an arm, leg or weapon hand; while held: lock it, swing it at its owner, swing it at an ally. **E** Amor: head — full puppet for N s (hostage options: blade to own throat, drop weapon). **R** Amor: object — take a weapon, projectile, summoned construct or chunk of voxel terrain and move/throw it. **F** Forehead eyes — eight instant casts in a forward cone (works while the body eyes are blind). **Z** El Embrion — sphere, near-invulnerable; on exit the body eyes stay blind for X s. **X** Puppet orders — all controlled targets: attack nearest / attack each other / harm self / hold still.
    - **G** sight mode — camera shows each eye's cone and the free/used eye count. **C** pink flare. **V** **Amor: Dominion** — every free eye fires at once: up to 58 marks on everything in view (NPC crowds, limbs, weapons). **Tab:** body-part target wheel + order list.
- **AI notes:** opens polite and preachy (introduces himself, demands the player's name). **Phase 1:** clone shell game — keeps two or three Gemelos clones alive and strikes from behind the camera. **Phase 2 (≤60% HP, or the player outclasses him):** releases; tags **legs first** (forced walking), then the weapon arm, then the head; if a weaker ally/NPC is nearby he takes them hostage and demands the player drop their weapon. **Phase 3:** El Embrion whenever a big AoE is charging; emerges and spams forehead Amor. Tells: pupils widen with a purple glint ~0.3 s before each Amor; the sun mark appears instantly. Counterplay hooks: barrier Constructs, binding Kidō on puppets, self-damaging the marked limb (frees it), and breaking line of sight with dust and destruction.
- **Callouts:** "Gemelos Sonído" · "Shizumare, Brujería" · "Amor" · "El Embrion" · (dying) praise of "Aizen-sama".

---

## 4. Szayelaporro Granz (ザエルアポロ・グランツ) — Octava (8th) Espada, aspect of Madness; later Jailer of Hell

- **Wiki:** https://bleach.fandom.com/wiki/Szayelaporro_Granz · https://bleach.fandom.com/wiki/Szayelaporro_Granz/Expanded_Universe · technique pages Carbon-Copy, Telon_Balon, Teatro_de_Titere, Gabriel · Lumina_and_Verona, Medazeppi, NO_BREATHES_FROM_HELL, Hell · battles: *Renji Abarai & Uryū Ishida vs. Szayelaporro Granz*, *Mayuri Kurotsuchi vs. Szayelaporro Granz*
- **Roster tier:** **A** — major boss with a science-horror kit (clones of the player, a voodoo doll, rebirth from a victim) and a modern Hell-arc return; playable as a trickster/controller.
- **Canon power:** **6/10** — he admits his direct combat is weak, but his kit crushed Renji's organs, crippled Uryū and nullified Bankai; **Hell form 7/10** (chains post-timeskip Renji couldn't break; held his own against Ichigo).
- **Body:** 185 cm → **59 vox**; 67 kg. Tall, very slender, long-legged; theatrical body language (hand to chin, hip cocked, fingers fanned). Chin-length straight pink hair, bangs swept to the right side of the forehead, **two thin shaved lines on the left side** of the head; **rectangular glasses** (his mask). Hole on the glans — never visible, omit. Tattoo location unknown — never visible even shirtless, omit.
  - Fornicarás: same height; **four wing-branches** on his back (≈2–2.5 m each at rest, can stretch to 10 m+), long layered skirt to the floor.
- **Palette (hex estimates):**
  - Skin `#F7E0CF` (shade `#DDBFAA`) · hair pink `#F27BB1` (shadow `#CF5A92`, highlight `#FFB0D3`) · eyes amber `#DFA03A` · glasses frame bone `#F1EDE3`, lenses `#CFE3EC` at ~35% opacity
  - Uniform: white `#F4F3EF`, three stripes `#17171B` (stripe color assumed black — verify), white gloves `#FFFFFF`, cropped white trousers, standard boots; mid-fight cape-like mantle white (verify)
  - Fornicarás sword: handle grey-blue `#7C8DA6`, sheath grey `#8D9096`, atom-shaped guard silver `#B9BFC6` (verify), hanging cords light purple `#C9A6E3`
  - Released: tentacles purple `#7A3E9E` (shade `#552A70`); layered skirt lilac `#9C6BC4` with pale-lilac edges `#CDB3E6` (verify); segmented bodice grey `#9B9AA3` (seams `#6F6E77`); sleeves white `#F5F5F5` with purple lining `#6F2C8E`; elbow spikes and hanging drop-strands dark purple `#4A1F62`; hands white `#FFFFFF`, fingertips purple `#7A3E9E`; hair droplets purple `#7A3E9E`; left-eye marks purple `#7A3E9E`; headband and half-glasses bone `#F1EDE3`; wing branches grey `#8F8E97`; drop-strands red `#C3122F` (swollen feathers `#E04A5E`)
  - Carbon-Copy fluid black `#0A0A0D` (oily sheen `#2C2440`); clone eyes blank `#F4F4F4` ringed by four marks `#111114`
  - Teatro de Titere: swelling strand purple `#8E3FC0`; doll = palm-size miniature of the victim; organ pieces toy-colored (stomach `#E58A9A` etc.) with white tags `#FFFFFF` and black Spanish labels
  - Energy: release glow pink `#FF6FB5`, release mist `#F8E3EE` · reiatsu pink `#FF79B8` (novel) · Gran Rey Cero (novel) pink `#FF4FA3`
  - Hell form: see §4b
- **Look by form/outfit:**
  - **Espada uniform:** a long white shirt-tunic that covers him up to the neck (only the face shows), **three stripes from the collar** — two running down each side of the chest and one down the middle; white gloves; slightly cropped white trousers; the sword hangs at **thigh height** from **two frilly light-purple cords** tied at the waist. After changing clothes mid-fight: the same outfit plus a **short cape-like mantle**.
  - **Privaron era (flashback):** messier hair; all three stripes run down to the **right hip**; ankle-length, lab-coat cut.
  - **Fornicarás:** his lower half first becomes a **sea anemone of purple tentacles**, which retract to show his legs and form a **long layered skirt**; upper body in a **segmented, form-fitting grey bodice**; **white sleeves from the elbow** flaring to a wide cuff with purple lining, **three small dark-purple spikes** rising from each elbow and **four long drop-shaped dark-purple strands** hanging under each sleeve; white hands with **elongated purple fingertips**; purple **droplet strands** in the hair; the mask becomes a **thin bone band across the forehead** with the lower half of his old glasses frame mounted on **fan-like plates** at each side of the head; the **left eye** gets four purple lines above and four below; on the back, **four grey branches** (two per side) in a butterfly-wing outline, each hung with **twelve evenly spaced red drop-strands** that can swell into feathers (bird wings).
  - **Hell form:** §4b.
  - *Brave Souls "Beyond" (game-only):* bare-chested with four flesh ribbons ending in pink globules, canine white-furred legs with talons, white pelvic wings, pink-red winged carapace, six eye-tipped tendrils, Hōgyoku in a flower-shaped appendage.
- **Weapons:**
  - **Fornicarás (sealed):** standard katana; **guard shaped like an atom** (orbits around a nucleus); grey-blue handle; grey sheath; carried on two cords at thigh height. Released by **swallowing the blade**.
  - **Released:** no blade — wing-branches, fingertips, dolls and the lab. Hell form: chains.
- **Forms & states (ordered):**
  1. **Sealed** — scientist with traps, gadgets and Fracción.
  2. **Resurrección: Fornicarás** — "**Susure, Fornicarás**" (啜れ「邪淫妃」, *Sip, Lewd Consort*; the English localization renames it **La Lujuriosa**). He shoves the sword down his throat with a pink glow from the mouth; his body **inflates like a balloon**, gushes fluid and a fine mist, then slims into the tentacle anemone, which recedes into legs and skirt.
  3. **Telon Balon** — sphere shell state.
  4. **Gabriel rebirth** — after death, if an egg is planted.
  5. **Hell form (Jailer of Hell)** — one-shot appearance; whether he can still release is not shown.
- **Abilities (complete):**
  - *Sealed — scientist & inventor*
    - `Traps & palace control` — his palace is effectively his body: **pitfall panels** ("my simplest trap") drop intruders down a cylindrical slide into his lab; **cameras in every wall**; **corridors he rearranges at will**, so fleeing enemies loop back into the same room; intercom plus an **earpiece microphone**. [Environmental, Construct, NEW: RoomRearrange]
    - `Rokureichū (録霊蟲, "spirit-recording bugs")` — tiny insects planted on a subject record everything (form, abilities, reiatsu, down to reishi composition); he bugged his brother Yylfordt to steal Renji's Bankai data, and drew on Cirucci's fight for Uryū. [Sensing/Stealth, NEW: DataTag]
    - `Power-control device` — a room-scale mechanism built from that data: **Bankai fizzles on activation**, Seele Schneider does no damage, the Quincy bow won't form; he can switch it off (he did, to make the second act "fair"). [Field, NEW: AbilitySealField]
    - `Investigative immunization` — after analyzing a technique's structure and reiatsu he nullifies or blunts it: Seele Schneider through the throat did nothing; Sprenger was minimized; **Cero Sincrético split at its seam**. Needs time — it failed against Mayuri's fresh poison gas. [Absorb/Reflect/Redirect, NEW: AdaptiveImmunity]
    - `Illusion device` — projected a fake Nnoitra to distract Nel (the ambush that cracked her mask). [Afterimage/Clone, Sensing/Stealth]
    - `Garganta device` — found in his lab after his death; Mayuri used it to open a flawless Garganta. [Teleport, NEW: PortalRender]
    - `Consumable Fracción` — every Fracción is modified to be **eaten as medicine**: he devoured Lumina to heal blast wounds and promised Verona he'd "make a new one". Two large Fracción with **shelled fronts** form his **throne** and intercept attacks (arrows and Bankai alike); Medazeppi is a berserk brute. [Summon, Heal/Reject, NEW: ConsumeAlly]
    - `Swordsmanship / Hierro / Sonído / strength` — parries Shikai Zabimaru one-handed and blocks with the back of his wrist; Sonído that caught a Hirenkyaku user off guard; survived a point-blank Shakkahō followed by Sprenger. [MeleeArc cut]
    - *Novel-only:* pink reiatsu; **pink Gran Rey Cero**; *Soul Separation* (he split his violent side off as Yylfordt, dropping to Adjuchas level); created Roka Paramia.
  - *Fornicarás*
    - `Carbon-Copy` — a **huge black fountain** gushes from his back and rains over the whole room; any target touched by a drop **sprouts a clone of itself** with the same abilities (limiters removed, even Bankai), blank pupil-less eyes ringed by **four black marks**; he restyles them to his taste (no spots on Dondochakka, trousers on Pesche). Destroyed clones **split and multiply**; a **finger snap pops them like balloons** (heads burst). The Bankai clones mirrored Renji and wrecked the palace. [Summon, Swarm, NEW: CloneCopyKit]
    - `Telon Balon (球体幕, "sphere curtain")` — the wings wrap around him, swell thick and ball up; survives a collapsing building and **floats**. [Shield, Mobility]
    - `Wing-branches` — stretch at will; **engulf/grab** people (Uryū, Renji, Nemu); **burrow and burst out of the ground or rubble** behind a target; restrain giants (held back Bawabawa's charge with one); shield. [Bind, Grab/Throw, MeleeArc]
    - `Teatro de Titere (人形芝居, "puppet play")` — a wing engulfs the victim and **spits them back out** ("thanks for the meal"); one red strand swells purple and **bursts, leaving a palm-size doll** of the victim in his hand. The doll's surface remote-controls the victim's senses (thumb pressed to its head → pressure on the real head; a flick → a cut on the temple). The doll **pops apart at the waist** to reveal tiny, oddly shaped organ pieces **labelled in Spanish**; crushing one ruptures the real organ (the "stomach" piece made Uryū cough blood; Renji lost several), and **tendon pieces** cripple (left Achilles tendon → Renji collapses mid-run; a right-arm tendon next). Stomping every piece of Mayuri's doll jerked his body around — but Mayuri had swapped in **dummy organs**. [Status (organ damage, cripple, pain), NEW: VoodooDoll]
    - `Possession (when eaten)` — if something devours him, his body liquefies into its nervous system and he takes over: one finger flick made Mayuri's Bankai, Konjiki Ashisogi Jizō, turn on its master. [Status (mind control), NEW: PossessOnConsume]
    - `Gabriel (受胎告知, "Annunciation")` — rebirth: a branch/tentacle pierces the victim's **navel** and lays an **egg** among their organs; the strand can grow a **mouth** and speak; the egg feeds on the host (the belly swells), drains every fluid, and within seconds he **re-emerges from the host's mouth** (anime: as an embryo that grows), leaving a desiccated husk (Nemu survived; Mayuri revived her). Risk: he absorbs whatever is in the host — Mayuri's Superhuman Drug killed him this way. [Heal/Reject (self-revive), Status (drain), NEW: HostRespawn]
    - `Feather wings` — the 48 red drop-strands swell into feathers (bird wings) — proposal: hover/glide plus extra shielding. [Mobility, Shield]
- **Passives & weaknesses:** Gabriel extra life (needs an implanted host); eat-a-Fracción heal; adaptive immunity (time-gated — a brand-new poison outpaced it); Teatro is useless against **dummy organs** (game: counter-consumable); Gabriel imports host toxins/drugs; weak in a straight fight once his tools are off; vanity (alters clones, changes clothes mid-fight, monologues, mourns his ruined hair).
- **Signature moments to recreate:**
  1. Pitfall and slide into his palace; intro over the intercom; Renji's Bankai fizzles (power-control device).
  2. Fracción ambush — Medazeppi goes berserk; Uryū arrives through the wall; Seele Schneider through the throat does nothing.
  3. Renji wraps them both in Zabimaru and fires Shakkahō point-blank; Uryū's **Sprenger** pentagon detonates.
  4. Eats Lumina in front of them; leaves to change clothes; the corridors loop the fleeing heroes back.
  5. Release (sword swallowed, balloon inflation, mist) → **Carbon-Copy** rain → clone brawl → Renji's Bankai clones wreck the palace → finger snap pops every clone.
  6. **Teatro de Titere** on Uryū and Renji (stomach crushed, tendons crushed); Pesche's Infinite Slick makes him drop the dolls; one wing stops Bawabawa's charge; Cero Sincrético split at its seam.
  7. **Mayuri:** dummy organs → tentacle from the rubble grabs Nemu → Konjiki Ashisogi Jizō's poison and bite → **Gabriel** out of Nemu → he possesses the Bankai → it self-destructs → **Superhuman Drug**: a single slow sword thrust he experiences as a century (time-dilation death set piece).
  8. **Hell one-shot:** Ukitake's Konsō Reisai; Jigoku no Rinki drift over Karakura; Szayelaporro chains Renji while Renji shields Ichika; Ichigo cuts the chains; the truth about Hell; a gigantic Hell-Ukitake's Sōgyo no Kotowari impales him from behind and drags him back through the Gates.
- **Kit proposal:**
  - *Sealed*
    - **Shift:** Sonído biased backwards (he habitually keeps distance).
    - **LMB:** one-handed fencing with wrist blocks. Forward = flèche thrust; back = wrist-block counter → flick launch; air = spinning slashes; down = plunge; sprint = gliding slash.
    - **Hold LMB:** analysis strike — tags the target with Rokureichū.
    - **RMB:** back-of-wrist guard (Hierro) / parry.
    - **Q** Rokureichū — tag; a data bar fills per enemy technique observed. **E** Power-control device — place a room field that disables techniques he has full data on (Bankai, bows, specific Kidō) for tagged enemies. **R** Summon Fracción (Lumina & Verona, throne pair, Medazeppi, generic). **F** Eat Fracción — consume the nearest summon for a big heal. **Z** Trap panel — delete a floor patch under the target (pit + slide); inside his palace, loop the corridors. **X** Illusion device — decoy hologram of an ally or enemy.
    - **G** Analysis stance — once data is complete, the chosen technique deals ~0 to him. **C** pink flare. **V** Gran Rey Cero, pink (novel-only, flagged). **T** release. **Tab:** Fracción roster, gadget list.
  - *Fornicarás*
    - **Movement:** gliding walk; **Shift** = Sonído; **G** = feather wings (hover).
    - **LMB:** wing-branch lashes (reach grows with combo length) and fingertip flicks. Forward = branch spear; back = branch uppercut-lift; air = branch whirl; down = branches slam; sprint = skirting glide.
    - **Hold LMB:** underground branch — burrows, erupts under/behind the target and grabs.
    - **Q** **Carbon-Copy** — black rain; every enemy hit spawns a hostile clone of itself with its kit; tap again = finger snap, pop all clones. **E** **Teatro de Titere** — engulf → spit → doll; then operate the doll from Tab. **R** **Telon Balon** — ball shield; can float and roll. **F** Wing grab — bind and lift; restrains even giants. **Z** **Gabriel** — branch to the navel: arms an extra life tied to that host. **X** Liquefy (proposal) — if swallowed by a creature/summon, take control of it; active version: dive into a large summon's maw.
    - **C** pink flare. **V** **"Teatro: Gran Final"** (proposal name) — with a doll in hand, crush the whole organ set in a staged act (near-lethal internal damage); without a doll, a mass Carbon-Copy flood.
    - **Tab (doll wheel):** face/surface (pain, cuts) · senses (blind/deafen through the doll's eyes/ears — proposal) · *estómago* / stomach (canon: blood, stagger) · *pulmones* / lungs (stamina, breath — proposal) · *corazón* / heart (heavy damage — proposal) · *hígado / riñón / intestino* (damage over time — proposal) · *tendón de Aquiles* (canon: collapse) · arm tendons (canon: arm disabled) · pop all.
  - *Hell form* — kit in §4b.
- **AI notes:** opens with a monologue and keeps his distance; leads with traps and Fracción; tags the player with Rokureichū and gains immunity to a player technique after seeing it 2–3 times (show a "DATA COMPLETE" tell); eats a Fracción when wounded (interruptible); releases after losing ≥50% HP or when his palace is wrecked; then Carbon-Copy (clones of the player and allies), Telon Balon against big attacks, Teatro grab when the player gets close; once he holds a doll he plays with it (flick, stomach, then tendons). He keeps a Gabriel egg in some NPC or ally as a backup life — kill or cleanse the host, or feed him a drug item, to stop the rebirth. Theatrical and narcissistic; damage to his hair or clothes triggers a rage phase.
- **Callouts:** "Susure, Fornicarás" · "Teatro de Titere" · "Telon Balon" · "Gabriel" · mocking "Suerte!" (Yammy's catchphrase).

### 4a. Szayelaporro's Fracción (summons; tier C)
- **Lumina & Verona** (ルミーナ / ベローナ) — very short, obese near-twins in Szayelaporro-style three-stripe uniforms; Lumina has black pigtails, Verona a short black ponytail; repeat each other's words, cheer, panic. No abilities except being edible (Lumina). Height not given — estimate ≈100 cm → 32 vox.
- **Medazeppi** (メダゼピ) — much larger than the others with disproportionately long arms; clown-like tufts of black hair on both sides of the head; mask fragment over the right eye and nose with teeth along its lower edge; left eye solid yellow; dark-pink eyebrow estigma; standard uniform. Wordless grappler (punch, grab, throw); goes berserk when cut. Killed by one Uryū arrow.
- **Throne pair** — two big Fracción whose fronts are durable shells (Uryū's arrows don't scratch them); they form his seat and body-block attacks for him.
- **Generic Fracción** — many incomplete, human-looking Arrancar, mostly without Zanpakutō, in three-stripe uniforms. All edible.

### 4b. Hell form — Jailer of Hell (地獄の獄吏, Jigoku no Gokuri) — one-shot *NO BREATHES FROM HELL* (2021)
- **Look:** 14 years after his death. Hair far longer, pushed back behind the ears with one lock framing the right side of the face; **left eye gone**, glasses-mask gone; **left arm reduced to charred black bones** trailing dark smoke; broad **dark-blue chain-link tattoos** wrapped around head and torso — one link circles a **new hole in the middle of his chest**, another rings the empty **left eye socket** with **four thin vertical lines** running down the left cheek to the next link; his Hollow hole has left his body and floats as a **white ring behind his back**; darkness drips off him in shapes around and below the waist; a **half-cloak** covers his right side (the rest is "clothed" in that darkness); black boots; **curling ram horns** burst from his temples at will, drawing blood.
- **Palette:** hair `#F27BB1`; empty socket `#1A0E12`; charred arm `#1C1919` with smoke `#2B2533`; chain tattoos `#1E2D5C`; floating ring `#F4F4F4`; dripping darkness `#0B0A10` (violet sheen `#2A1B3A`); half-cloak color not stated (verify); boots `#121214`; horns `#E8E1D0` with blood `#8E0E18`; chains black-crimson `#1A0B0E` / `#8E1022`; Hell portal teeth `#E9E2D0` around a void `#050507`; Jigoku no Rinki blobs `#0A0A0C` (acid color when cut not stated — proposal `#9BE15D`, verify).
- **Abilities:**
  - `Chain manifestation` — black-crimson chains erupt from the ground, coil around a foot, chase a fleeing target, **pierce through the body in several places** and hold; Renji couldn't break them, Ichigo cut them. [Bind, Projectile (needle), NEW: ChainNetwork]
  - `Horns` — ram horns at will, bleeding (display of hate/power; proposal: power stance). [Stance]
  - `Clairvoyance` — knows hidden things (that Ichika is Renji's daughter, the true purpose of the Konsō Reisai, the balance that holds Hell's maw shut). [Sensing/Stealth]
  - `Hell portal` — crosses into the Human World through a **round Garganta lined with teeth**; can be dragged back through the Gates of Hell. [Teleport, NEW: PortalRender]
  - `Jigoku no Rinki (地獄の燐気, "hellish phosphor air")` — black non-reishi blobs that drift wherever Hell leaks into the world; harmless to touch, **acidic once cut by a Zanpakutō**. [Field, Environmental, NEW: CutToAcidHazard]
  - `Immense reiatsu` — pressured post-timeskip Renji; fought Ichigo without faltering.
- **Kit (Hell form, proposal):** Shift = short Hell-portal blink · LMB = chain lashes · Q chain eruption (bind) · E chain lance (pierce) · R chain cage (Construct) · F clairvoyance pulse (reveal every enemy, weak points, "who matters to whom" for hostage AI) · Z Hell portal (two-way) · X Rinki release (drifting acid-on-cut field) · G horns (power stance, slow HP bleed) · C dark flare · V **"Jaws of Hell"** (proposal) — open a toothed portal under the target and chain-drag them in · Tab chain patterns. Story exit: gigantic Hell-Ukitake's Sōgyo no Kotowari impales him and pulls him back.

<!-- CONTINUE -->
