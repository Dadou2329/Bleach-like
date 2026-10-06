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
  - **Battle damage:** right arm burned from hand to elbow (Cero clash with Ulquiorra; Orihime heals it at Ichigo's request before their duel — a short-lived damage state); deep chest slashes from Ichigo in the final fight.
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
    - `Power-control device` — a room-scale mechanism built from that data: **Bankai fizzles on activation**, Seele Schneider does no damage, the Quincy bow won't form; he can switch it off (he did for his "second act", so his opponents — and their clones — fought at full power). [Field, NEW: AbilitySealField]
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
    - `Gabriel (受胎告知, "Annunciation")` — rebirth: a branch/tentacle pierces the victim's **navel** and lays an **egg** among their organs; the strand can grow a **mouth** and speak; the egg feeds on the host (the belly swells), drains every fluid, and within seconds he **re-emerges from the host's mouth** (anime: as an embryo that grows), leaving a desiccated husk (Nemu survived; Mayuri revived her). Risk: he absorbs whatever is in the host — Mayuri had seeded Nemu with his Superhuman Drug, which left Szayelaporro helpless for the killing blow. [Heal/Reject (self-revive), Status (drain), NEW: HostRespawn]
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

---

## 5. Aaroniero Arruruerie (アーロニーロ・アルルエリ) — Noveno (9th) Espada, aspect of Greed; last of the first-generation Espada, the only Gillian among them

- **Wiki:** https://bleach.fandom.com/wiki/Aaroniero_Arruruerie · Metastacia, Spirit_Body_Fusion, Zanpakutō_Destruction · battle: *Rukia Kuchiki vs. Aaroniero Arruruerie* · Kaien Shiba (A3 dump) for Nejibana
- **Roster tier:** **B** — boss built around a disguise gimmick (fight "Kaien" in the dark, expose him to light by breaking the walls); playable as a shapeshifter whose library grows by eating Hollows.
- **Canon power:** **6/10** — overpowered Rukia with Kaien's skill and Nejibana and tore apart a Bakudō #61 by hand, but a Shikai lieutenant killed him with one stab through his glass head.
- **Body:** 205 cm → **66 vox**; 91 kg. Tall, upright, aristocratic, body fully hidden by long garments. His **head is a large upright glass cylinder** full of red liquid with **two small Hollow heads** floating inside: the top one ¾ masked (deep voice), the bottom one ½ masked (high, childlike voice); both tattooed **"9"**. In daylight and among the Espada he covers it with a **tall white mask pierced by eight holes**. Hole in the **left thigh** (hidden). The left hand is Glotonería, hidden under a single white glove.
  - Capsule ≈40 cm tall × 25 cm wide (estimate) → 13 × 8 vox; heads ≈8–10 cm → ~3 vox — consider a 64 vox/m sub-model for the capsule interior.
  - Glotonería mass ≈8–10 m wide × 4–6 m tall (estimate) → build at 16 vox/m.
- **Palette (hex estimates):**
  - Outer mask `#F2F0E9`, holes `#141414` · capsule glass `#DCEFF3` (~30% opacity, rim highlight `#FFFFFF`) · liquid red `#B3142C` (~75% opacity, deep `#6E0A1A`) · small heads: skin pale grey `#C9C3BD` (verify), mask bone `#F1EDE3`, eye sockets `#141414`, "9" `#111114`
  - Clothing: full-length white garb `#F4F3EF` (shade `#D8D5CE`), **frilly noble's coat** white with ruffled collar and cuffs `#FAF9F6`, one white glove `#FFFFFF` (left hand)
  - Glotonería (sealed): tentacles brown `#6E4B2F` (shade `#4B3220`, tips `#8A6242`), maw `#3B0D16`, teeth `#E9E1CB`
  - Released mass: dark purple `#5E2A72` (shade `#3F1B4D`, highlight `#8A4BA0`), stubby tentacles likewise, **large red eyes** `#D3202F` (pupils `#140508`), toothed mouths `#3A0B17` / teeth `#EDE5D0`, central bubbling pool `#4A1A58` with surfacing white masks `#EEEAE0` (Heat the Soul's golden tentacles are game-only)
  - Reiatsu dark purple `#4A1E6E`
  - Kaien aspect: skin `#F2D0B0`, spiky black hair `#141414`, aqua-green eyes `#3FB8A8` · Nejibana: silver `#C8CDD3`, blue tassel `#2C6FD8`; sealed hilt dark-blue wrap `#1F2E5A`, square gold guard `#C9A53A`, brown sheath `#6B4A2E` · water `#3AA6E6`, foam `#E9F8FF`
- **Look by form/outfit:**
  - **Masked (meetings, light):** the tall eight-hole mask (hole arrangement — verify), frilly noble's coat over full-length garb, one glove; very still and formal.
  - **True head (exposed to sunlight):** the flesh disguise sloughs off his head to reveal the glass capsule and the two bickering heads.
  - **Kaien aspect (only in shadow):** Kaien Shiba's head and face (spiky black hair, aqua-green eyes) rebuilt around the capsule, with Kaien's voice, memories, skills and Nejibana; he keeps Aaroniero's white clothing (verify against anime frames).
  - **Glotonería:** the "Kaien" upper body (or the capsule head, in light) rising from a **gigantic purple mass** — a bloated octopus with dozens of stubby tentacles, large red eyes, toothed mouths and a huge blobfish-like face; its center boils, flashing the masks of the Hollows he has eaten.
  - *Brave Souls "Beyond" (game-only):* smaller patchwork humanoid, six toothed tentacles from mouths at the pelvis, hands in place of feet, enlarged heads on separate necks behind a red-black veil.
- **Weapons:**
  - **Glotonería (sealed):** not a sword — a **brown tentacled appendage with a gaping central maw** ringed by coiled tentacles, worn as/under the left glove.
  - **Nejibana (taken from Kaien):** sealed katana — square gold guard with cut-off corners and wave reliefs, dark-blue hilt wrap, brown sheath. Shikai = **long silver trident-spear** (leaf-shaped central blade plus two outward-curving side blades joined to it by two bars), thick **blue tassel**, **corkscrew/drill-shaped butt**; constantly sheds water. ≈2.2 m long (estimate) → ~70 vox.
- **Forms & states (ordered):**
  1. **Masked / true form** — sealed; one absorbed aspect at a time.
  2. **Aspect Manifestation: Kaien Shiba** — shadow-only disguise with Kaien's full kit.
  3. **Resurrección: Glotonería** — "**Kuitsukuse, Glotonería**" (喰い尽くせ「喰虚」, *Devour, Devouring Hollow*; Sp. "gluttony"): every absorbed power usable at once.
  4. **Sunlit** — debuff state: disguise and manifested powers off.
- **Abilities (complete):**
  - `Hollow Absorption (Glotonería)` — he eats **dead Hollows** and keeps all their powers and reiatsu, evolving without limit (why a Gillian made Espada); **33,650 eaten**, including **Metastacia**, and through it Kaien Shiba. [Absorb/Reflect/Redirect, NEW: AbilityAbsorb]
  - `Aspect Manifestation` — reproduces any absorbed being's body, knowledge, memories, muscle memory and powers; **one at a time while sealed, any number while released**. Works **only in darkness**: sunlight nullifies it and the false flesh falls away; he rebuilds Kaien's head the moment he is back in shadow. [Transform, NEW: Shapeshift, NEW: LightExposure]
  - `Nejibana (捩花, "twisted flower") — Kaien's Shikai` — command "**Suiten Sakamake, Nejibana**" (水天逆巻け, *Watery Heaven, surge back*): he twirls the sword, it becomes the trident and releases a wave. Kaien's dance-like spear style pivots on one wrist; every swing throws water and heavy blows raise **crushing waves**, trapping the foe between thrust and wave. Shown: lunging thrust; **twirl-and-drive into the ground beneath the target, ripping the floor up** (launching them on a rock slab); twirl along the ground into a crashing overhead; a **water torrent massed over the spear and slammed down** (destroyed a large stretch of floor); flick-disarm; and, released, the impaling thrust that **snapped Sode no Shirayuki** and skewered Rukia. [MeleeArc, Environmental (flood/waves), GroundWave, Projectile]
  - `Spirit Body Fusion (霊体融合)` — Metastacia's power: red tentacles shot into a body let him merge into it (his old body collapses as a husk; the host's look shifts toward his mask pattern). [Status (possession), NEW: Possession]
  - `Zanpakutō Destruction` — Metastacia's power: a Shinigami whose blade touches certain back tentacles has the Zanpakutō **shattered instantly**; Metastacia could do it **once per night**. [Status (weapon break), NEW: WeaponBreakOnTouch]
  - `Cognition Synchronization (認識同期)` — broadcasts whatever he sees and experiences to all his comrades instantly (he did so as he died, briefing the Espada). [Sensing/Stealth, NEW: SharedVision]
  - `Sonído (expert)` · `Strength` — reappeared behind Rukia the instant her Kidō wore off; broke Bakudō #61 Rikujōkōrō barehanded.
  - `Psychological warfare` — uses Kaien's voice and memories to demand self-sacrifice or betrayal (asked Rukia to die, then to kill her friends). [Status (hesitation)]
  - `Glotonería: an army of 33,650` — released, he fields every devoured Hollow's power at once; tentacle bludgeons (one blow broke Rukia's will to fight). [Summon, Swarm, Status]
  - Game-only: Versus Crusade gives him a light-blue tentacle Cero.
- **Passives & weaknesses:** **sunlight** (disguise and aspect powers off in light — Las Noches' artificial dome sky counts); the **glass capsule is a critical weak point** (a direct hit is near-fatal — model as instant kill / massive crit); once exposed he is a Gillian-grade body; arrogant (gloats while a "beaten" enemy recovers).
- **Signature moments to recreate:**
  1. The dark tower across the bridge: "Kaien" lifts his mask; cushions laid out; the false survival story.
  2. Nejibana duel in near-darkness: floor ripped up, wave slam, disarm.
  3. Rukia's double incantation: **Rikujōkōrō + Sōren Sōkatsui** blows out the wall — sunlight pours in and the flesh melts off the capsule (two heads bicker).
  4. Back in shadow: Kaien's head rebuilds; the Glotonería truth ("I am a Gillian…") → release (purple mass, tentacles) → Nejibana snaps Sode no Shirayuki and impales Rukia.
  5. **San no mai, Shirafune:** the broken blade regrows in ice and spears through his head and capsule; the liquid spills, the mass collapses into a wave of fluid; the bottom head screams for Aizen, the top head curses and cracks; his last sight is broadcast to the Espada.
  6. *(Movie tie-in, optional)* in Hell with Szayelaporro against Shuren's group (Taikon, Gunjō, Garogai).
- **Kit proposal:**
  - *True form*
    - **Shift:** Sonído. **LMB:** Glotonería maw-hand bites and tentacle lashes, right-hand chops. **Hold LMB:** tentacle grab → devour (on a dead or near-dead Hollow-type, absorb its kit). **RMB:** guard.
    - **Q** Devour — eat a corpse/downed Hollow and add its powers to Tab. **E** Aspect Manifestation — become a devoured being (default Kaien; blocked while lit). **R** Spirit Body Fusion — tentacle volley; on hit, possess the target for N s. **F** Zanpakutō Destruction — arm the back tentacles: the next blade that strikes them shatters (once per stage). **Z** Cognition Synchronization — every ally sees what he sees (enemy markers + kit intel). **X** Kaien's voice (proposal) — a taunt that applies "hesitation" to anyone bonded to Kaien (Rukia, Ukitake, Ganju, Kūkaku).
    - **G** mask on/off (on = no light penalty but no aspect; off = full kit). **C** purple flare. **V** Hollow mimic burst — the strongest absorbed power at full strength. **T** release.
  - *Kaien aspect:* Kaien Shiba's Nejibana kit from **A3** (shout "Suiten Sakamake, Nejibana", water waves, spear dance), keeping Aaroniero's Sonído and a per-frame light check.
  - *Glotonería*
    - **Movement:** slow tentacle crawl, climbs walls; **Shift** = tentacle surge.
    - **LMB:** tentacle slams and whips. **Hold LMB:** Nejibana impale from the upper body.
    - **Q** Hollow horde — spawn eaten Hollows from the boiling pool (draws from the game's Hollow bestiary in **F**). **E** Absorbed power — fire any Tab-selected stolen ability. **R** Tentacle grab & swallow. **F** Wave crush (Nejibana flood). **Z** Zanpakutō Destruction field. **X** Giant blobfish bite.
    - **V** "Army of 33,650" (proposal name) — every absorbed power fires at once plus a Hollow flood. **Tab:** absorbed library (Kaien/Nejibana, Metastacia's fusion and weapon-break, plus any Hollow eaten in-game).
- **AI notes:** stages fights in his dark tower; uses Kaien's voice to manipulate (guilt dialogue, demands self-harm or betrayal); avoids lit zones, retreating into shadow to re-disguise. **Core counterplay is voxel destruction:** breaking walls and ceilings to let light in strips the disguise. Releases when exposed and cornered; while released he shields his head with curled tentacles and prioritizes impaling. Dies instantly to a capsule-breaking hit.
- **Callouts:** "Kuitsukuse, Glotonería!" · as Kaien: "Suiten Sakamake, Nejibana!" · when exposed, the two heads alternate lines (deep / squeaky).

**Metastacia (メタスタシア)** — the source of Aaroniero's Kaien powers (flashback boss; also an absorbed aspect): one of Aizen's experimental Hollows; six-limbed, large flame-patterned mask, a mass of **red tentacles on its back**. Bodies it fuses with turn grey-green, with all-black eyes and orange flame blotches around them. Abilities: Spirit Body Fusion; Zanpakutō Destruction (once per night). Killed Miyako's squad, possessed Kaien, was killed by Rukia; Aaroniero ate it in Hueco Mundo.

---

## 6. Yammy Llargo (ヤミー・リヤルゴ) — Diez (10) / Cero (0) Espada, aspect of Rage

- **Wiki:** https://bleach.fandom.com/wiki/Yammy_Llargo · Gonzui, Cero_Oscuras, High-Speed_Regeneration, Kukkapūro · battles: *Kisuke Urahara vs. Yammy Llargo*; *Ichigo Kurosaki, Kenpachi Zaraki & Byakuya Kuchiki vs. Yammy Llargo*
- **Roster tier:** **A** as a **set-piece boss** — a kaiju that keeps growing until neither Karakura nor Las Noches can contain him. Playable "kaiju mode" is optional (B as a playable).
- **Canon power:** sealed **6/10** (outmuscled Chad and crushed Tsubaki, but lost an arm to Bankai Ichigo and was toyed with by Urahara and Yoruichi); **Ira 7.5/10** (flattened Chad, Renji and Rukia, took a masked Getsuga for a nick, kept Byakuya and Kenpachi busy and wounded them).
- **Body:** 230 cm → **74 vox**; 303 kg. Hulking giant — massive shoulders and arms, barrel chest, thick neck, heavy jaw; slumped, bored posture. Bald scalp **lined with bony ridges**; black **bushy sideburns** and a **thin black ponytail** to the upper back; **orange eyebrows**; red estigma under the eyes. Jacket always open. Big hole in the **center of the chest** (≈20 cm → 6 vox, estimate). "10" on the **left shoulder**. He **grows** from food and sleep (visibly bigger in Hueco Mundo than in Karakura) and from rage.
  - Ira stage 1: ≈12–15 m tall (estimate — big enough to hold a person in one fist) → build at 8 vox/m (≈100–120 vox) and scale.
  - Ira evolved: keeps growing (towers over the captains; Mayuri worried it would complicate dissection if it got any bigger) — suggest 25 m rising toward 60 m+ across the fight.
- **Palette (hex estimates):**
  - Skin tan `#C99364` (shade `#A4734A`, highlight `#E0AE80`) · hair black `#141414` · eyebrows orange `#E5772A` · eyes brown `#6A3E1F` · estigma red `#C51E2B` · jaw mask and teeth `#EFEBDF` · tattoo `#111114`
  - Uniform per §1 (jacket worn open)
  - Ira sword: handle **red** `#B3222C`; guard = rounded rectangle with two prongs on each side (metal not stated — suggest dark steel `#5E5E62`, verify)
  - Ira stage 1: upper body tan; head plates bone `#F0EEE6`; flame estigma `#C51E2B` sweeping back; legs, joint carapace and tail club white `#EEEBE2` (shade `#C9C4B5`); elbow piston tubes purplish-grey `#77708A` (shade `#57516A`); back tubes black `#1B1B1E`; forearm nodules black `#1B1B1E`
  - Ira evolved: horn crown and jaw horns bone `#EFEBDF`; crack marks around the eyes (color not stated — suggest red `#C51E2B`, verify); leg and tail hair dark brown-black `#2A1E17` (verify); back horns bone; belly tan
  - Energy: released reiatsu orange-red `#FF5A1E` (core `#FFB070`) · Cero red `#E01A28` (core `#FFD0C8`) · Cero Oscuras black `#0B0B0E` with crimson rim `#9E0F1C` (manga; the anime recolors it red) · Bala red `#E43A2E` · Gonzui: pale soul wisps `#DDE8F2` streaming into his mouth
- **Look by form/outfit:**
  - **Sealed (Diez):** see Body; the mask is a bone lower jaw with eight teeth sitting on his chin.
  - **Well-fed sealed (Hueco Mundo):** same, noticeably bigger (proposal: ×1.3).
  - **Ira stage 1 — "kaiju centaur":** the torso stays largely human but colossal; the skull ridges become two big white bone plates sweeping back over the head; the mask fuses into his real lower jaw; the red estigma stretches back into two long flame marks; longer ponytail. The lower body extends backward as a long white quadruped trunk on **elephant-like legs** (the wiki says "eight … on each side" — ambiguous; check the release splash, ch. 354, verify) with **three big toes** each and **white carapace joints**, ending in an **Ankylosaurus-style bony tail club**; **purplish-grey piston tubes on the elbows** (rams); **five black tubes on the back** (half the elbow tubes' length); **six black nodules along each forearm**. The wiki likens the whole to a kaiju. Number: "0".
  - **Ira — rage evolution (ape):** an explosion of reiatsu leaves him bigger and more monstrous: the extra legs are gone; he **knuckle-walks like an ape** on hairy legs with stubby toes; a **portly belly** hides the abs; the back pistons become spine-like extensions with **two huge horns** on the back; the mask grows into a **crown of horns** (some curling down over the jaw); crack-like marks frame the eyes; the tail turns hairy and loses its club. Fully healed, mask restored.
  - *Brave Souls "Beyond" (game-only):* grey carapace armor, huge head horn plus four V-shaped back horns, yellow eyes, molten-red cracks, Hōgyoku floating behind him.
- **Weapons:**
  - **Ira (sealed):** katana with a red handle and a rounded-rectangle guard with two prongs on each side; **never used in combat** — he fights barehanded.
  - **Released:** fists, elbow pistons, teeth (bites through buildings), tail club, sheer bulk.
- **Forms & states (ordered):**
  1. **Sealed (Diez)** — plus "fed" growth from eating and sleeping.
  2. **Resurrección: Ira** — "**Buchikirero, Ira!**" (ブチ切れろ「憤獣」, *Get pissed off, Wrathful Beast*): the sword bursts into reiatsu; the "1" of his tattoo melts away ("the ranks run 0 to 9; I'm the Cero").
  3. **Rage growth** — continuous size/strength gain as his anger climbs.
  4. **Rage evolution** — threshold burst into the ape form with full regeneration (repeatable? not shown — proposal: once per boss phase).
- **Abilities (complete):**
  - *Sealed*
    - `Brawling / immense strength` — tore off and snapped Chad's Brazo Derecha arm (manga), crushed Tsubaki in his fist, backhanded Menoly through a Las Noches wall; even casual swings break walls; never draws Ira. [MeleeArc smash, Grab/Throw]
    - `Cero (虚閃)` — red, **from the mouth**; opened a fissure in the ground even after Benihime's Nake had blunted it. [Beam, Blast, GroundWave (fissure)]
    - `Bala (虚弾)` — red, **from the fists**, fired in rapid strings (Cero power traded for twenty times the speed, as he gloated to Urahara); carpet-bombed Urahara. [Projectile (orb/bolt, multishot), Blast]
    - `Hierro` — second hardest among the Espada after Nnoitra: Yoruichi damaged her own arm and leg hitting him; he resisted a Ginrei Kojaku arrow and survived Mayuri's anti-Arrancar mine (Uryū's Hakumen Kudashi). [passive, NEW: DamageThreshold]
    - `Gonzui (魂吸, "soul inhalation")` — one huge in-breath sucks the souls out of everyone in a wide radius: ordinary people die on the spot and their souls stream into his mouth, feeding his reiryoku (he complained they tasted awful); anyone with a little spiritual power resists (Tatsuki only fainted; Orihime and Chad were unaffected). [Field (vacuum), Absorb/Reflect/Redirect, Status (death on non-spiritual NPCs), NEW: SoulVacuum]
    - `Descorrer` — opens a Garganta (first raid). [Teleport, NEW: PortalRender]
    - `Rage empowerment / stored power` — the only Espada who banks reiryoku by **sleeping and eating** for long stretches; stored power raises his size; anger instantly adds mass and strength. [Stance, NEW: OfflineCharge, NEW: RuntimeScale]
  - *Ira*
    - `Reiatsu shield & burst` — wraps himself in reiatsu as a shield, then blows it outward as an explosion that hits the whole surrounding area. [Shield, Blast]
    - `Enhanced Cero` — charged **in front of his mouth**; its width scales with his size (a beam that wipes out a large section of terrain). [Beam, Blast]
    - `Cero Oscuras (黒虚閃, "black hollow flash")` — black Espada-release Cero (manga; the anime made it red); Ichigo fired a Getsuga into the charging orb and it **exploded in Yammy's mouth** (he came out dazed but unharmed). [Beam, Blast, NEW: Backfire]
    - `Enhanced Bala` — enormous red bullets that fling a Bankai user across the battlefield and tear it up. [Projectile, Blast]
    - `Enhanced Hierro & endurance` — a point-blank Sōkatsui was a sting; a masked Getsuga left a nick on his neck; Chad's La Muerte to the face did nothing; he kept getting up after Kenpachi took fingers and legs. [passive]
    - `Enhanced strength` — bites through buildings; hurls a person into the ground so hard she can't get up; stomps; swats a captain into a building. [MeleeArc smash, Grab/Throw, GroundWave]
    - `Elbow pistons` — the elbow tubes work as rams (proposal: a second impact on every punch). [MeleeArc smash]
    - `Rage-powered growth & evolution` — the angrier, the bigger; at a threshold he erupts into the ape form, and **High-Speed Regeneration** heals every wound and rebuilds his mask in the process. [Transform, Heal/Reject (self), NEW: RuntimeScale]
- **Passives & weaknesses:** gigantic damage threshold; regeneration on evolution. **Poor Pesquisa** — misreads threats, which is how he lost an arm in his first exchange with Bankai Ichigo. Reckless (walked onto Uryū's mine and fell through every floor of Las Noches). A charging Cero Oscuras can be detonated in his face. Huge target. Attacks allies who annoy him (killed the medic who reattached his arm to test it, swatted Rudbornn, hit Menoly).
- **Signature moments to recreate:**
  1. **Karakura landing (first raid):** crater landing beside Ulquiorra; **Gonzui** on the gawking crowd (only Tatsuki survives); Chad's arm torn off; Orihime's Tsubaki crushed; Bankai Ichigo takes his arm; Urahara's Chikasumi no Tate shield and Yoruichi's beatdown; Ulquiorra calls it off.
  2. **Second raid:** taunts Hitsugaya about both being "number 10"; Bala ambush on Urahara → the **portable Gigai decoy** befuddles him → Tsuppane, Benihime deflects his fist → Negación beam extraction mid-tantrum.
  3. **Las Noches throne tower:** swats Menoly through a wall, smashes Loly; Uryū's arrow; **the mine** → he falls through every floor of the fortress ("mala suerte").
  4. **"I'm the Cero Espada":** release in the desert against Chad, Renji and Rukia (all down); Rukia's point-blank Sōkatsui; Ichigo returns — Cero Oscuras backfires in his mouth, "stop scuttling around", masked Getsuga slams him into the sand, Bala barrage, he grabs Ichigo.
  5. **Kenpachi & Byakuya:** Byakuya's Sōkatsui; Kenpachi severs a leg, cuts off fingers, runs up his arm and slashes his face, severs more legs; the captains bicker while he rises; a giant Cero; Bankai and Kenpachi's full swing to the face; **rage evolution** into the ape → final defeat.
  6. Epilogue: Kukkapūro trots up to his dying master.
- **Kit proposal:**
  - *Sealed (Diez)*
    - **Shift:** heavy Sonído (shorter blink, ground-cracking landing).
    - **LMB:** haymaker → backhand → hammer fist → shoulder check. Forward = straight punch; back = uppercut launcher; air = body splash; down-in-air = double-axe hammer (crater); sprint = shoulder charge through walls.
    - **Hold LMB:** giant wind-up haymaker (crater + long knockback).
    - **RMB:** Hierro block (no parry window, just a huge damage threshold).
    - **Q** Bala — tap = one red bullet from the fist, hold = machine-gun barrage. **E** Cero — mouth, hold to charge; leaves a fissure. **R** Gonzui — inhale cone/radius: kills civilians and mooks below a spiritual threshold, pulls light enemies in, refills reiatsu. **F** Limb rip — grab an arm and tear/snap it. **Z** Backhand — swat the target through walls. **X** Eat & sleep — out of combat, bank reiryoku (raises sealed size and pre-fills the rage meter).
    - **G** Hierro brace (super armor). **C** red flare. **V** Point-blank Cero — grab + mouth Cero. **T** "Buchikirero, Ira!" (10 → 0). **Tab:** Cero/Bala variants.
  - *Ira (stage 1)*
    - **Movement:** thundering multi-leg trot; **Shift** = trample charge (flattens everything in the path); every jump lands as a quake.
    - **LMB:** giant slaps and punches, each followed by the **elbow piston** for a second impact; tail-club sweep to finish. Forward = charging punch; back = scooping uppercut; down = stomp quake; sprint = trample. **Hold LMB:** double piston hammer.
    - **Q** Giant Bala. **E** Giant Cero (wide, sweepable mouth beam). **R** Cero Oscuras (black, long charge; can be **detonated in his mouth** if a strong projectile hits it mid-charge). **F** Reiatsu shield → burst (hold = shield dome, release = explosive shove). **Z** Building bite — bite chunks off buildings and spit/throw them. **X** Grab & slam — one-hand crush, piledrive into the ground.
    - **G** rage display (the meter fills from damage taken, taunts, allies falling; his size follows it). **C** orange-red flare that cracks terrain for blocks. **V** **Rage evolution** — at a full meter: explosion, full heal and mask regen, morph into the ape, size step up. **Tab:** Cero variants.
  - *Ira (evolved ape)*
    - Knuckle-walk (fast for his size); holding sprint = gorilla charge. LMB = alternating knuckle slams, belly flop, tail swipe. Q/E/R/F scaled up. **V** = colossal growth surge — the meter refills and he keeps getting bigger (proposal cap ≈60 m).
- **AI notes:** bored and lazy, calls everyone "trash", shouts **"Suerte!"** when he finds a fun target. **Phase 1 (sealed):** walks straight at the player; Bala spam; Gonzui on civilians in story stages; grabs. His bad Pesquisa makes him underestimate — scripted chance for the player to take a limb in the first big exchange. **Phase 2 (release at ≤50% HP or when humiliated):** giant Cero sweeps and stomps; aggro always goes to whoever damaged him last; he ignores small fry. **Phase 3+ (a rage step every 25% HP lost or ~60 s):** growth step; at max meter → evolution with full heal → keeps growing. Weak points: interrupt the Cero Oscuras charge; cut the legs to topple him; slash the face/eyes (Kenpachi). Friendly fire: he hits his own allies when annoyed.
- **Callouts:** "Suerte!" · "Buchikirero, Ira!" · "Cero!" · "Bala!" · insults ("trash").

### 6a. Kukkapūro (クッカプーロ) — Yammy's puppy (tier C, companion / cameo)
- 34 cm → **11 vox**, 2.5 kg; Números #35 ("35" tattooed on its back). A puppy with soft white fur (character book; the anime colors it light brown `#C9A27A`), white `#F6F4EE`; Hollow mask with big eye sockets and two little horns above long, drooping ears.
- Canon: follows Yammy because he resembles its old master; barks at him, dodges a thrown bone; reaches him as he dies; survives Hueco Mundo and the Wandenreich invasion; guides Arrancar in TYBW.
- Game-only (Brave Souls): light-purple reiatsu, tiny red Cero, barked red Bala, Sonído, dash attack, howl.
- Use: Yammy's idle companion, an Easter-egg playable, or a collectible "find Kukkapūro" quest in Las Noches.

---

## 7. Nelliel Tu Odelschwanck (ネリエル・トゥ・オーデルシュヴァンク) — former Tres (3rd) Espada, aspect of Sacrifice; Ichigo's ally ("Nel Tu" in child form)

- **Wiki:** https://bleach.fandom.com/wiki/Nelliel_Tu_Odelschwanck · https://bleach.fandom.com/wiki/Nelliel_Tu_Odelschwanck/Expanded_Universe · Cero_Doble, Lanzador_Verde, Galope, Nel_Shower, Nel_Tamapunch, Cero_Sincrético, Pesche_Guatiche, Dondochakka_Birstanne, Bawabawa · battles: *Nelliel Tu Odelschwanck vs. Nnoitra Gilga*; *Kisuke Urahara vs. Askin Nakk Le Vaar*
- **Roster tier:** **A** — three forms (comic child, elegant swordswoman, centaur jouster), a defensive signature (Cero Doble), and the Arrancar side's ally through TYBW.
- **Canon power:** adult **7/10**, Gamuza **7.5** — beat Nnoitra repeatedly in the past; in the present she cut him before he could react, kicked his weapon away, stopped his Cero barehanded and returned it, and broke Santa Teresa with Lanzador Verde. TYBW anime: severed Soul-King Yhwach's arm while he was caught off guard. Child **2/10**. (Aspect of death: Sacrifice per Kubo; Brave Souls says Lamentation — use Sacrifice.)
- **Body:**
  - **Adult:** 176 cm → **56 vox**; 63 kg. Tall, curvy and very busty (Kubo: the largest bust in the cast), long legs; long wavy green hair; **ram-horned skull helmet** worn on top of the head (upper skull with eye sockets, some teeth missing); **scar from the forehead down between the eyes**; crimson horizontal line across the cheeks and nose; prominent **lower canines**. Big "3" in the **middle of the back**. Her hole is "inside her heart" (Kubo) — **no visible through-hole**.
  - **Child (Nel Tu):** height not given — estimate ≈95 cm → **≈30 vox**. Super-deformed: oversized head (~⅓ of height), **huge eyes**, the cartoon skull mask perched on top of her head (a crack down its left side, four teeth on the left broken off), big scar from forehead to nose, crimson line under the eyes, even bigger lower fangs; drool and snot; a small green hooded gown that covers her whole body.
  - **Gamuza (centaur):** human torso on a chamois/ibex quadruped body — estimate ≈2.4–2.6 m tall, ≈2.4 m long → ~80 vox tall; double-ended lance ≈3 m (estimate).
- **Palette (hex estimates):**
  - Skin `#F7DECC` (shade `#DDBBA6`) · hair **green** `#6CC08A` (shadow `#4A9A68`, highlight `#A6E0B8`) — the original anime used turquoise `#45C2B8`; the TYBW anime went back to green · eyes hazel `#A27B3D` · scar `#E2B2A2` · estigma crimson `#C0182D` · mask and horns bone `#F3F0E6` (horn shade `#C9C0AC`), sockets `#161616`; the mask's eyes glow during Chōkasoku / child Cero Doble (color not stated — proposal pink-white `#FFC6E0`, verify)
  - Child gown green `#62B567` (shade `#46914C`); adult torn gown the same green
  - Espada uniform (flashback): white `#F4F3EF`, black line `#17171B`, two thin black sashes, white gloves, flared white trousers
  - TYBW outfit: white skin-tight suit `#F4F4F2`; tan fur at the hips and gauntlet ends `#C9A57A`; **green fur sleeves** to the elbows `#5FA36B`; **red pauldrons** `#C2262F`; white gloves with **hoof-shaped gauntlets** `#EFEAE0`; white thigh-high leggings; shoes with ram-hoof heels (color not stated — verify); Urahara's armband (look not described — verify)
  - Gamuza sword: sheath green `#2E7B49`, hilt light green `#A3D9A9`, double-crescent guard (metal not stated — suggest silver `#BFC5CB`)
  - Gamuza form: body brownish-green (olive) `#7D7A49` (shade `#5C5935`, highlight `#9C9963`); black horse tail `#141414` with a white ring at its root `#F3F1EA`; white spaulders, elbow guards and gauntlets `#F3F1EA`; black arm sheathing `#151517`; hooves not stated (suggest `#2A2622`); lance ivory `#EEEBE1` (verify) · Lanzador Verde spin energy emerald `#38E08A` (core `#C9FFE2`)
  - Energy: Cero **pink** `#FF5FA8` (core `#FFD6EA`) · Cero Doble = the returned beam in its own color braided with her pink · Galope flash blue `#6FA8FF` · reiatsu color not stated (proposal pink `#FF7AB8`, as in Brave Souls' Beyond design)
- **Look by form/outfit:**
  - **Nel Tu (child):** see Body; big tears, a lisp ("Itsygo"), clings to Ichigo's head or back.
  - **Adult, Hueco Mundo:** the child's gown, torn by the growth, becomes a **green top and short skirt** joined by a single strip of cloth across the belly; the mask turns sharper, with a pair of **curled horns**.
  - **Espada flashback:** tight long-sleeved white top with shoulder pads and **puffy cuffs**, a black line from the collar down the left side of the chest, a **puffy three-layer hem**, two thin black sashes (one carries Gamuza), white gloves, white bell-bottom trousers, standard shoes; mask intact.
  - **Gamuza:** horns grow longer and curve down to frame the cheeks; the mask's crack seals (the missing teeth stay missing); white spaulders from the shoulder blades to the neck, white elbow guards and gauntlets, black-sheathed arms and hands; brownish-green chamois/ibex lower body; black horse tail with a white ring at its root; double-ended jousting lance.
  - **TYBW (armband):** see palette — white suit, tan hip fur, green fur sleeves, red pauldrons, hoof gauntlets, ram-hoof heels, bare upper arms and thighs; fluffier hair; mask more goat-like, with longer, more ornate horns like Gamuza's.
  - *Brave Souls "Beyond" (game-only):* four black-and-white horns, darker fur over the whole body, glowing pink markings, cracked glowing scar, flaming tail tip, slit pupils, Hōgyoku spear.
- **Weapons:**
  - **Gamuza (sealed):** katana (≈70 cm blade); green sheath, light-green hilt, **guard of two crescent moons joined back to back**.
  - **Gamuza (released):** **double-ended lance** — long tapered points at both ends, grip in the middle; thrown like a javelin for Lanzador Verde.
- **Forms & states (ordered):**
  1. **Nel Tu (child)** — powers leaking out of the cracked mask; limited kit.
  2. **Adult transformation** — triggered by intense emotion (Ichigo being hurt); restores all powers and her Zanpakutō; **times out** back to the child. TYBW: Urahara's **Reiatsu Transformation Armband** keeps her adult (switch at will).
  3. **Resurrección: Gamuza** — "**Utae, Gamuza**" (謳え「羚騎士」, *Declare/sing, Antelope Knight*): she holds the sword level in front of her, it steams and hazes, she names it, and a huge reiatsu burst throws back anyone close (Nnoitra). Before the armband, releasing burned her remaining adult time (she reverted right after winning).
- **Abilities (complete):**
  - *Child*
    - `Chōkasoku (超加速, "super acceleration")` — a rudimentary Sonído; the mask's eyes glow and she rockets into people (bowled Ichigo over). [Mobility, MeleeArc smash]
    - `Cero Doble (child)` — mask eyes glow, she **swallows** an incoming Cero and spits it straight back harder (without mixing in her own); one use leaves her exhausted (returned a released Privaron Espada's Cero). [Absorb/Reflect/Redirect, NEW: AbsorbAndMerge]
    - `Nel Shower (ネルシャワー)` — rubs her uvula to bring up "saliva" (really vomit) with weak healing power. [Heal/Reject]
    - `Nel Tamapunch (ネル一打パンチ)` — a groin punch; big damage to males. [MeleeArc smash, Status (stun)]
    - `Adult transformation` — emotion trigger. [Transform, NEW: EmotionTimerForm]
  - *Adult*
    - `Master swordsmanship` — economical and flowing; stops a strike instantly; cuts Espada Hierro in one swing; weaves kicks into her blade work. [MeleeArc cut]
    - `Hand-to-hand` — kicks a giant weapon's blade aside mid-air and follows with a kick to the neck; one punch launches a foe several meters. [MeleeArc smash]
    - `Hierro` — stops an Espada's Cero with her palm; kick-parries a blade unhurt. [Shield, NEW: DamageThreshold]
    - `Sonído (master)` — hit-and-run; whisks a wounded ally out of an attack; Urahara trusted her speed to pull four people out of Askin's collapsing Gift Ball Deluxe (she did it in **two round trips**, after leaping off a tower hard enough to shatter it). [Teleport, Mobility, NEW: CarryAlly]
    - `Cero (pink)` — fired from the mouth. [Beam]
    - `Cero Doble (重奏虚閃, "ensemble Cero")` — **her trademark**: she stops an incoming reiatsu attack with her palm, **swallows** it, and fires it back fused with her own pink Cero — Nnoitra took both at once. Kubo: it also works on **non-Cero** reiatsu attacks (Getsuga Tenshō, Kidō blasts). Novel: she returned a **Gran Rey Cero** (winded, bleeding at the mouth). [Absorb/Reflect/Redirect, Beam, NEW: AbsorbAndMerge]
    - `Descorrer` — fled Hueco Mundo to Karakura in TYBW. [Teleport]
    - `Bala` (novel-only) — disciplined Grimmjow with one. [Projectile]
    - `High intellect / code` — reads opponents; refuses to kill the beaten.
  - *Gamuza*
    - `Released reiatsu` — the release blast alone shoves Nnoitra back; after it she overpowers him easily. [Blast, NEW: SignatureSwap]
    - `Mounted combat` — fights like a jousting knight: charges, lance thrusts, rearing. [MeleeArc, Mobility]
    - `Lanzador Verde (翠の射槍, "emerald shooting lance"; Sp. "green thrower")` — she flips the lance, rears back and **hurls it like a javelin**; in flight it spins up, gathers reiatsu and **drills** on impact — it **punched straight through Nnoitra's blade into his shoulder** and drove him into a rock wall. TYBW anime: it tore through and **severed Soul-King Yhwach's right arm** while he was caught off guard, and served as misdirection for Uryū's gambit. [Projectile (tunnel/drill), Slice (limb sever)]
    - `Galope (超加速, "super acceleration"; Sp. "gallop")` — vanishes in a flash of blue light and reappears charging the target at huge speed. TYBW anime: pushed into Yhwach's flowing darkness for several seconds before failing. [Teleport, Mobility, MeleeArc]
  - *Assists:* Pesche and Dondochakka (Cero Sincrético, Infinite Slick, Dondochakka Press) and Bawabawa — §7a.
- **Passives & weaknesses:** child form exhausts after one Cero Doble; pre-armband adult timer reverts her mid-fight at the worst moment; refuses to finish opponents (beaten foes get back up — Nnoitra did); dislikes fighting; the old head wound is the cause (reiatsu leaks from the cracked mask).
- **Signature moments to recreate:**
  1. "Eternal tag" across the dunes with Pesche, Dondochakka and Bawabawa (tutorial chase); riding Bawabawa toward Las Noches; Runuganga's sand pit.
  2. **Dordoni's Cero** swallowed and returned (child Cero Doble) → Nel Shower on the beaten Dordoni.
  3. Watching Ichigo vs. Grimmjow; the tackle-hug that knocks Ichigo off the tower.
  4. **Adult awakening vs. Nnoitra:** Sonído rescue of Ichigo; a cut across Nnoitra's chest; the scythe kicked away and a kick to the neck; **palm-stop his tongue Cero → swallow → Cero Doble**; "Utae, Gamuza" burst; **Lanzador Verde** through Santa Teresa → she spares him → **reverts to a child** at the worst moment.
  5. Flashback: Nnoitra and Szayelaporro's ambush (illusion device, blow to the head from behind → mask cracks → thrown out of Las Noches → becomes Nel Tu).
  6. **TYBW:** falls out of the sky into Karakura (Hueco Mundo has fallen); adult entrance at the Soul King Palace thanks to the armband; the **Gift Ball Deluxe rescue run**; *(anime-only)* frees Harribel from Silbern, Galope into Yhwach's darkness, Lanzador Verde takes his arm, Uryū's Antithesis swaps her and Harribel to safety.
- **Kit proposal:**
  - *Nel Tu (child)*
    - **Shift:** Chōkasoku — mask eyes glow, homing headbutt dash that knocks targets down. Proposal: she can ride on an ally's head or back.
    - **LMB:** flailing slaps → headbutt → spin. **Hold LMB:** Nel Tamapunch (huge vs. male targets, stun). **RMB:** cower/duck.
    - **Q** Cero Doble (child) — open-mouth catch window (~0.5 s timing) on an incoming beam/orb; auto-spits it back stronger; drains most stamina (one use, then exhausted). **E** Nel Shower — healing splash on self or an ally. **R** Call the brothers — Pesche & Dondochakka assist: Cero Sincrético beam, Infinite Slick puddle, Dondochakka Press. **F** Bawabawa — summon and ride (sand-swimming mount).
    - **G** adult awakening — needs the emotion meter (fills when allies take heavy damage); cinematic; lasts until the timer runs out. **V** max Cero Doble (bigger reflect window that also covers nearby allies). **Tab:** assist list.
  - *Adult*
    - **Shift:** master Sonído; carries an ally if she is holding one; double-tap with lock-on = behind the target.
    - **LMB:** horizontal cut → reverse cut → kick to the neck → spinning kick. Forward = lunging cut; back = rising-kick launcher; air = crescent kicks and slashes; down = drop cut; sprint = Sonído slash-through. **Hold LMB:** precision cut (ignores armor/Hierro).
    - **RMB:** guard; parry = **kick-parry** (kicks the attacker's weapon out of line; heavy weapons get kicked away).
    - **Q** Cero (pink). **E** **Cero Doble** — hold E to open the palm-catch/mouth and absorb beams, projectiles, Kidō or Getsuga for up to N s; release E to fire the combined beam. **R** Palm stop — catch a beam on the hand and hold it in place. **F** Bala (novel-only, flagged). **Z** Rescue — scoop up an ally and Sonído out. **X** Descorrer.
    - **G** armband — TYBW: lock the adult form; before it: shows the remaining time. **C** flare. **V** **Cero Doble: max** (catch + merge + mega beam). **T** "Utae, Gamuza" (reiatsu-burst shove).
  - *Gamuza*
    - **Movement:** centaur gallop (fastest ground speed in this file), big jumps, rearing; can carry one ally (proposal).
    - **Shift:** **Galope** — blue-flash teleport, then a locked charge; pushes through darkness, fields and weather for a few seconds.
    - **LMB:** lance thrust → sweep with the rear point → reverse thrust → hind kick. Forward = jousting lunge; back = rear-up launch (front hooves); air = spinning lance; down = hoof-stomp quake; sprint = **lance charge** (continuous pierce). **Hold LMB:** rearing double-hoof stomp + plunging thrust.
    - **Q** **Lanzador Verde** — flip, rear back, javelin throw: a spinning emerald drill that bores a straight tunnel through terrain, breaks blocking weapons and severs limbs on a clean hit; the lance re-forms in her hand after ~3 s. **E** Cero Doble. **R** Cero. **F** Hoof stomp (GroundWave). **Z** Rescue run — carry up to two allies out of a hazard zone. **X** release burst (repeatable shove).
    - **G** armband/timer. **C** flare. **V** **Lanzador Verde: max** — a fully spun-up throw; a drill comet that bores through a mountain. **Tab:** Cero variants.
  - *Non-canon proposal (only if wanted):* a Nel × Grimmjow duo ultimate (her Cero Doble swallows his Gran Rey Cero and returns it fused pink-blue). **No source supports this.**
- **AI notes:** **as an ally NPC:** shields Ichigo/the player, swallows enemy beams for them (Cero Doble), rescues downed allies. **As a boss** (sparring/rival scenario): calm, silent, precise; won't finish a downed player (the fight ends when they drop); answers every reiatsu beam with Cero Doble, so the counterplay is melee pressure and purely physical attacks; releases Gamuza when the player overpowers her adult form; Lanzador Verde when the player turtles behind a guard; Galope to close distance. Child-form scripted beats are comedic: Chōkasoku into the player, and the timed revert at the climax.
- **Callouts:** "Utae, Gamuza." · "Lanzador Verde!" · "Cero Doble!" · "Galope!" · child: "Itsygo!", "Nel Shower!", "Nel Tamapunch!"

### 7a. Pesche Guatiche, Dondochakka Birstanne & Bawabawa — Nel's former Fracción and "brothers" (tier C, assist summons)
- **Pesche Guatiche** (ペッシェ・ガティーシェ) — 175 cm → 56 vox, 58 kg. Purple body (verify shade, ~`#7A4A9E`); full-head insect mask with big mandibles and horns `#EEE8DA`, a large yellow left eye `#F2C230` visible through it, a purple eyepatch over the right; blond hair `#E8C766` poking out at the back; white armored vest, forearm and shin plates; lighter-purple loincloth `#A77CC2`; barefoot, three toes; hole near the stomach just under the vest. Abilities: Cero (**purple**, fired from Última); **Infinite Slick** — sprays a translucent green fluid `#8FE3A0` that kills friction (weapons slide off, foes lose footing and grip; actually finite); **Última** — a retractable reishi blade glowing blue (purple when firing Cero), guard of two outward crescents, szabla-like, stored under his loincloth; "Super Speed".
- **Dondochakka Birstanne** (ドンドチャッカ・ビルスタン) — 204 cm → 65 vox, 162 kg. Dumpy body, huge **tiki-mask head** (the mask covers the whole head and its eyes and mouth work; colorful exaggerated eyes, teeth and nose); **yellow hooded bodysuit with black polka dots** `#F2C230` / `#141414`; small white hands and feet. Abilities: solid Hierro (Renji nearly broke his foot kicking him); **Dondochakka Press** (body slam); a karate chop that breaks floors; a **kanabō** kept in his stomach; Cero (**yellow**, from a metal nozzle in his mouth); **stomach containment** (spits out spirit combat insects, Bawabawa among them).
- **Bawabawa** (バワバワ) — giant eyeless worm/eel Hollow; plate mask with two horns; big pink lips and teeth; smooth back and lighter segmented belly; sand-swimming mount and charge attack (Szayelaporro stopped it with one wing); cries when left out of the team's sentai-style intro.
- `Cero Sincrético (融合虚閃, "fusion Cero")` — Pesche and Dondochakka charge their Ceros together and merge them into a big swirling sphere, fired as a **multicolor beam (purple + yellow)** with a large explosion; leaves both exhausted. **Flaw:** the two Ceros never fully blend — pressing the seam splits the beam so it passes harmlessly around the target (Szayelaporro). [Beam, Blast]
- Kit hooks: Nel (child) **R** = call the brothers; **F** = ride Bawabawa. CFYOW (novel-only): they fire Cero Sincrético at the Pícaro during an "eternal tag" game gone wrong.

---

## 8. Engine features beyond the brief's primitive list

Grouped by system; each line says what it must do and who needs it.

**Control & possession**
- `[NEW: LimbControl]` — individual limbs of another character can be hijacked: a marked limb ignores its owner's input/AI and follows the controller; marking the head = whole body; disabling the limb (self-damage) frees it. *Zommari (Amor).*
- `[NEW: GazeTargeting]` — many independent "eye" emitters with line-of-sight cones, one target each (cap 58); barrier Constructs and binding Kidō block them; marks render as decals (the sun mark), even on the barrier that blocked them. *Zommari.*
- `[NEW: Possession]` — long-duration takeover of another body (Spirit Body Fusion). *Aaroniero.*
- `[NEW: PossessOnConsume]` — when a creature/summon "eats" the character, the character takes control of it. *Szayelaporro.*
- Hostage AI — a boss uses a controlled ally to force the player to drop their weapon (input lock / weapon-drop prompt). *Zommari.*

**Copies, dolls & rebirth**
- `[NEW: CloneCopyKit]` — spawn AI copies of *any* character (player included) with their full moveset and forms (incl. Bankai), cosmetic overrides (blank eyes), split-on-death, and a mass dispel. *Szayelaporro (Carbon-Copy)*; Zommari's bleeding Gemelos clones need the same "indistinguishable decoy" flag.
- `[NEW: VoodooDoll]` — a linked miniature of the victim as a held item: surface hit-zones cause pain/cuts on the real body; detachable internal pieces (named organs, tendons) map to damage and debuffs on the target; a "dummy organs" counter flag. *Szayelaporro.*
- `[NEW: HostRespawn]` — implant a marker in a target; when the implanter dies, he respawns from the host after a delay while draining it; anything inside the host (drugs, poisons) transfers to him. *Szayelaporro (Gabriel).*
- `[NEW: ConsumeAlly]` — eat one of your own summons to heal. *Szayelaporro.*

**Absorb, mimic & weak points**
- `[NEW: AbsorbAndMerge]` — catch an incoming beam/projectile, store its data (power, color, type), then fire it back fused with your own. *Nelliel (Cero Doble).*
- `[NEW: AbilityAbsorb]` — permanently add a defeated enemy's abilities to the character's runtime library. *Aaroniero.*
- `[NEW: Shapeshift]` — swap model + full kit into another roster character (incl. their Zanpakutō), keeping own HP/meters. *Aaroniero (Kaien).*
- `[NEW: LightExposure]` — per-frame query of sunlight/strong light reaching the character (sky raycasts through the destructible voxel world, light volumes) that toggles states — light floods in when players break walls. *Aaroniero.*
- `[NEW: WeakPointCrit]` — a fragile sub-part with its own tiny HP pool that causes instant defeat. *Aaroniero (capsule).*
- `[NEW: WeaponBreakOnTouch]` — contact with a specific hitbox shatters the attacker's weapon (their blade moves are locked until it re-forms). *Aaroniero / Metastacia.*

**Scale, bodies & locomotion**
- `[NEW: RuntimeScale]` — continuous scaling of model, skeleton, hitboxes, mass, reach, footstep destruction radius and camera framing, including switching voxel build density (32 → 8 → 4 vox/m) as the character grows. *Yammy.*
- `[NEW: OfflineCharge]` — a meter that fills while resting/eating out of combat. *Yammy.*
- Non-biped rigs: feline quadruped mode (Pantera), centaur (Gamuza), multi-legged kaiju (Ira 1), knuckle-walking ape (Ira 2), bulb-hover (Brujería), tentacle blob (Glotonería), skirted glide with four wing-branches (Fornicarás), plus physics for the long hair, tails, tassels and dripping darkness. *All six.*
- `[NEW: ClawClimb]` — wall-cling, wall-run and ceiling pounce on any voxel surface. *Grimmjow (Pantera).*
- `[NEW: PartialTransform]` — per-limb form swap without a full release. *Grimmjow (TYBW claws).*
- `[NEW: CarryAlly]` + mount — pick up and carry up to two allies while moving; ride a creature. *Nelliel, Bawabawa.*
- `[NEW: EmotionTimerForm]` — an involuntary transformation on an emotion/story trigger with a countdown revert, removable by an item (armband). *Nelliel.*

**Projectiles, beams & costs**
- `[NEW: GestureControlledProjectiles]` — projectiles that follow the player's swipe input during a short window. *Grimmjow (Desgarrón).*
- `[NEW: HPCostCast]` — an ability paid for with the user's own HP (blood). *Grimmjow (Gran Rey Cero).*
- `[NEW: ScreenSpaceDistortion]` (shared with E1) — the space-warp ripple of Gran Rey Cero.
- `[NEW: Backfire]` — hitting a charging beam detonates it on the caster. *Yammy (Cero Oscuras).*
- `[NEW: SoulVacuum]` — an inhalation field that kills NPCs below a spiritual threshold (a civilian layer of the world) and charges the user. *Yammy (Gonzui).*
- `[NEW: ChainNetwork]` — homing chains that erupt from terrain, pierce and pin. *Szayelaporro (Hell).*

**Level, data & stealth systems**
- `[NEW: SignatureSwap]` — release changes the character's reiatsu ID; keyed barriers and sensors stop recognizing them. *All Espada (canon: Grimmjow vs. Askin's Gift Bereich).*
- `[NEW: DataTag]` + `[NEW: AdaptiveImmunity]` + `[NEW: AbilitySealField]` — tag enemies to record their techniques; once data is complete, take ~0 from that technique and/or disable it for tagged targets inside a room field. *Szayelaporro.*
- `[NEW: RoomRearrange]` — runtime reconfiguration of level geometry (corridors loop back), trap panels, a camera network. *Szayelaporro's palace.*
- `[NEW: SharedVision]` — broadcast one character's vision/intel to all allies. *Aaroniero.*
- `[NEW: PocketDimension]` (shared with E1) — Caja Negación. *Grimmjow.*
- `[NEW: PortalRender]` (shared) — Garganta tears, Szayelaporro's Garganta device, the toothed Hell portal. *Most.*
- `[NEW: CutToAcidHazard]` — floating blobs that turn into acid only when cut by a blade. *Hell (Jigoku no Rinki).*
- Story-only: a time-dilation cinematic (Superhuman Drug: one sword thrust experienced as a century) and the Las Noches artificial sky as a light source for LightExposure.
- Shared with E1/F: `DamageThreshold` (Hierro), `HoleHitbox` (true holes — skip it for Nel and Szayelaporro, whose holes aren't visible), `AshDeath`.

---

## 9. Gaps — what could not be confirmed

- **Never shown in any source:** Zommari's and Szayelaporro's Espada tattoo locations; Grimmjow's Bala; Cero use by Zommari, Szayelaporro (outside the novel and games) and Aaroniero; whether Szayelaporro can still release in his Hell form.
- **Sizes not stated:** Nel Tu's child height (≈95 cm is an estimate); Yammy's released sizes (estimates above); the dimensions of Zommari's bulb, Aaroniero's mass and capsule, Szayelaporro's wings, Nel's centaur body and lance.
- **Ambiguous wording:** Ira's leg count ("eight … on each side") — check the ch. 354 release splash.
- **Colors not stated (marked verify above):** Pantera's tsuba and tail; Zommari's forehead lines, sword guard/sheath, bulb faces and Amor mark; Szayelaporro's stripes, cape, skirt layers and Hell half-cloak; Aaroniero's capsule fittings, head skin and mask-hole arrangement; Yammy's evolved eye cracks, body hair and sword guard; Nel's mask-eye glow, reiatsu, lance, armband and shoes; Grimmjow's Adjuchas form; the acid color of Jigoku no Rinki.
- **Unverified details:** whether Aaroniero keeps his white noble's garb while wearing Kaien's head (I believe so); which arm carries Kaien's Shiba-crest tattoo; whether Grimmjow ever shouts "Garra de la Pantera" on-page.
- **Anime-only, not cross-checked against episodes:** Nel's TYBW fight against Soul-King Yhwach (rescuing Harribel, Galope, Lanzador Verde severing his arm, Uryū's Antithesis swap) comes from the wiki's plot text only.
- **Hell arc:** only the 2021 one-shot is in the fetched pages; any later adaptation material is not covered.
