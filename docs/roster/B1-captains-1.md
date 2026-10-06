# Roster B1 — Gotei 13 captains (1/3)

Design dossiers for **Genryūsai Shigekuni Yamamoto** (1st Division, Captain-Commander — incl. his young founding-era self), **Suì-Fēng** (2nd, Onmitsukidō), **Gin Ichimaru** (3rd), **Retsu Unohana** (4th — incl. **Yachiru Unohana, the first Kenpachi**) and **Byakuya Kuchiki** (6th — incl. TYBW anime additions).

**Conventions used below**
- Heights → voxels at **32 vox/m** (research brief); the value at **48 vox/m** (PLAN §5.1 decision) follows in parentheses.
- Hex colors are *estimates* from the anime color designs unless stated; **(verify)** = check against reference art before modeling. Where manga and anime colors differ, both are given.
- Engine tags use the brief's primitive vocabulary in `[brackets]`; the PLAN §6.1 `DamageShape` mode is named where it matters (`cut`, `smash`, `bore`, `burn`, …). Needs covered by neither list are tagged `[NEW: …]` and collected in §7.
- *anime-only*, *game-only* (moves invented by licensed video games — optional filler, never required) and *novel* are flagged explicitly.
- Sources: bleach.fandom.com character, technique, battle and TYBW-episode pages fetched through the MediaWiki API; everything is paraphrased.

---

## 0. Quick reference

| Captain | Rank / role | Height → vox | Haori (sleeves · back) | Shikai (command) | Bankai | Reiatsu color | Tier |
|---|---|---|---|---|---|---|---|
| Genryūsai Shigekuni Yamamoto | Captain-Commander, 1st Div.; founder of the Gotei 13 and the Shin'ō Academy | 168 cm → 54 (81) | long sleeves, oversized, **worn draped over the shoulders like a cape** · 一 | Ryūjin Jakka — **"Banshō issai kaijin to nase"** (Reduce all creation to ash) | Zanka no Tachi | fiery red-orange, looks like flames | **S** |
| Suì-Fēng | Captain 2nd Div.; Commander-in-Chief of the Onmitsukidō, Corps Commander of the Keigun | 150 cm → 48 (72) | **sleeveless** · 二 | Suzumebachi — **"Jinteki Shakusetsu"** (Sting all enemies to death) | Jakuhō Raikōben | not stated (Shunkō = pale wind) (verify) | **A** |
| Gin Ichimaru | Captain 3rd Div. → traitor, Aizen's right hand | 185 cm → 59 (89) | long sleeves (verify) · 三 | Shinsō — **"Ikorose"** (Shoot to kill) | Kamishini no Yari | **violet** | **A** |
| Retsu / Yachiru Unohana | Captain 4th Div. (Soul Society's best healer); founding 11th-Division captain and **first Kenpachi** | 159 cm → 51 (76) | long sleeves (verify) · 四 (as first Kenpachi presumably 十一, verify) | Minazuki (肉雫唼) — **release command unknown in canon** | Minazuki (皆尽) | not stated; Kaidō glow green | **A** |
| Byakuya Kuchiki | Captain 6th Div.; 28th head of the Kuchiki Clan | 180 cm → 58 (86) | **short sleeves** (post-timeskip: high collar, light-gold trim and tassels) · 六 | Senbonzakura — **"Chire"** (Scatter) | Senbonzakura Kageyoshi | **white** (petals pink in the anime) | **S** |

---

## 1. Shared captain baseline (applies to all five)

- **Shunpo (瞬歩)** on Shift. All five are at least captain-average; Yamamoto, Suì-Fēng and Byakuya are top-tier masters. Air-stepping on reishi is universal. [Teleport, Mobility]
- **Zanjutsu / Hakuda / Kidō**: every captain gets the shared Kidō wheel from `docs/lore/mechanics.md`; each dossier lists what that captain was actually *shown* casting. Incantation-less casting is standard for all five; Yamamoto does not even need to say the spell's name.
- **Reiatsu (C flare):** captain-class pressure pins, chokes or knocks out much weaker beings; sensing others and hiding one's own presence are universal at this level. [Field, Status, Sensing/Stealth]
- **Captain haori (model spec):** white haori over the black kosode/hakama (white under-collar V, white sash, white tabi, waraji); **division-number kanji inside a rhombus** on the upper back; the hem band of black lozenges (hishigata); sleeve style differs per captain (table above). The wiki notes the **lining color is different for every captain** but no shades are documented — pick distinct muted tones (verify). Captains treat the haori as their rank (Yamamoto is furious when captains lose theirs) → "haori lost" is a fitting cosmetic damage state. [NEW: OutfitStates]
- **Bankai theft (TYBW):** Sternritter medallions steal a released Bankai — Suì-Fēng's, Byakuya's and Yamamoto's were all taken. A Bankai Hollowfied by Urahara's Shin'eiyaku poisons the thief and comes back. Story mode needs the slot lock/unlock. [Status: Bankai theft]
- **Captain limiter (Gentei Reiin):** applied in the Human World, but can be waived in wartime (Suì-Fēng confirms everybody fought at full power in Fake Karakura) — story flavor only.
- **After death:** dead captains are cast into Hell by the Konsō Reisai and gain epithets — Yamamoto **"Founder of the Gotei"** (護廷開祖, Gotei Kaiso), Unohana **"Death Sword"** (死剣, Shiken). Hook for later Hell-arc variants (no new abilities shown in canon).

---

## 2. Genryūsai Shigekuni Yamamoto (山本 元柳斎 重國) — Captain-Commander, 1st Division

- **Wiki:** https://bleach.fandom.com/wiki/Genry%C5%ABsai_Shigekuni_Yamamoto · also `/Anime_Continuity`, Ryūjin Jakka (Zanpakutō spirit), Jōkaku Enjō, Taimatsu, Ennetsu Jigoku, Zanka no Tachi Higashi/Nishi/Minami/Kita pages, Ittō Kasō, Hitotsume: Nadegiri, Onibi, Ikkotsu, Sōkotsu · battles: Shunsui & Ukitake vs Yamamoto, Battle of the Chimera (Ayon), vs Wonderweiss, vs Driscoll Berci, vs Royd Lloyd, vs Yhwach, vs Reigai-Shunsui & Reigai-Ukitake · TYBW episodes 5 "Wrath as a Lightning", 6 "The Fire", 7 "Born in the Dark".
- **Roster tier:** **S** (core). The fire showcase, and the only kit that changes the *state of the whole map* (firestorm → total evaporation → rain). Ship with the Fake Karakura wave; his Bankai headlines the TYBW wave.
- **Canon power: 10/10** — unrivalled as Captain-Commander for a thousand years (Aizen concedes he would lose head-on); one Shikai slash flayed a Sternritter to the bone and then to ash; Ennetsu Jigoku can burn an area wider than Karakura Town; Bankai heat ≈ 15,000,000 °C dries out the Seireitei and would eventually burn all of Soul Society; shrugged off Aizen's stab, the explosion of his own sealed flames and Chōjirō's Bankai lightning.
- **Body:** 168 cm, 52 kg → **54 vox** (81); usually stooped (~50 / ~76) until he gets serious. Average height, frail-looking in robes, but under them a dense, very muscular, heavily scarred torso and thick arms. Large bald cranium, narrow wrinkled face, hooked nose, high cheekbones. **Silhouette keys:** bald dome; long white eyebrows drooping past the eyes; long mustache; **hip-length white beard bound by a purple band** (he braids and trims it himself once a month); **oversized long-sleeved haori worn as a cape** (arms not in the sleeves, hem near the ankles); gnarled wooden **cane**; from the end of the Aizen fight onward **no left arm** (empty sleeve).
- **Palette (hex estimates):**
  - Skin (aged, warm fair) `#E3BE9A`, shadow `#B98F6C`, wrinkle lines `#A47A5A`, scar tissue `#C98F7D` · eyes **red** `#A8261F` (normally narrow slits; opening one or both eyes is his tell for surprise/seriousness)
  - Eyebrows / mustache / beard white `#F2F0EA` (shade `#CFCBC2`) · beard band purple `#6B3F8E`
  - Kosode & hakama black `#16161A` · under-collar, sash, tabi white `#ECEBE7` · waraji straw `#B49A6A`
  - Haori white `#F4F3EF`, hem lozenges and back number 一 black `#151515`, lining (verify)
  - Cane: wood `#7B5634`, grain `#5A3D24`, worn highlights `#9C7448`
  - Ryūjin Jakka katana: handle wrap **dark purple** `#3B2756`, **circular bronze** tsuba `#9C773A`, **brown** sheath `#5B3A22`, blade steel `#CDD2D8`
  - Shikai fire: core `#FFF4C2` → `#FFB23E` → `#FF6A12` → deep `#C4260B`; smoke `#3A3431`; ash flakes `#9A948F`; embers `#FF7A1F`
  - Bankai blade: charred black `#231C19`, burnt-rust patches `#5A3828`, hairline ember cracks `#FF5A1A`; Kyokujitsujin edge line `#FFF1C9` with a thin orange halo `#FF8A2A`
  - Zanjitsu Gokui (only when he makes it visible): white-gold `#FFF6D8` → orange `#FF9A3C` flame shell; otherwise heat haze. Molten ground `#FF7A2A` cooling to `#3A1E12`
  - Kaka Jūman'okushi skeletons: charred bone `#2E2724`, ash grey `#8C847D`, ember seams `#FF6A1E`, eye glow `#FFB040`
  - Ittō Kasō pillar red `#E3260F` with hot core `#FFD39A` · reiatsu aura fiery red-orange `#FF5A1F`
- **Look by form/outfit:**
  - **Standard (Soul Society → Fake Karakura):** as above, both arms, eyes shut, leaning on the cane under the caped haori. Two long scars crossing **above his right eye** (one left by Chōjirō), many smaller scars over the whole body.
  - **Battle-serious (Hakuda state):** haori and the top half of the shihakushō taken off (kosode hanging from the sash) → bare, bulging, scarred upper body. He strips before releasing Shikai against Shunsui & Ukitake and before brawling Wonderweiss.
  - **Post-Aizen / TYBW:** left arm gone at the shoulder (he refused to have Orihime restore it); haori still caped until it falls off in the Driscoll scene; then black shihakushō with the empty left sleeve.
  - **Young Yamamoto (founding era, ≈1,000–2,100 years ago):** black hair only on the sides, bald crown, a **topknot tuft sticking up at the back**; thick, tidy black eyebrows; black mustache, **no beard**; creased forehead and under-eye lines, hollow cheeks; one large forehead scar shaped like the stroke 丿 (nickname "Eijisai"), later crossed by Chōjirō's cut into a 十 ("Jūjisai"); standard shihakushō with a **sleeveless captain haori worn properly**; two arms. Whether he carried the cane then is not described (verify vs TYBW ep 6–7 flashbacks).
- **Weapons:**
  - **Sealed:** Ryūjin Jakka disguised as a wooden walking cane (~0.75 × his height, ~40 vox; usable like a short spear). He peels/disintegrates the wood to reveal a standard katana (~1 m overall): dark-purple wrap, circular bronze guard, brown sheath.
  - **Shikai:** the same katana, blade wreathed in fire; flame coils around his body.
  - **Bankai:** an ancient, worn, nicked katana that looks burnt out; no flame is visible while it cuts. After his death the scorched, shattered remains were laid out at the 1st Division.
- **Forms & states (ordered):**
  1. **Sealed (cane)** — Zanjutsu with cane / sealed sword, Hakuda, Kidō, crushing reiatsu. G = strip for battle.
  2. **Shikai: Ryūjin Jakka (流刃若火, "flowing blade like flame")** — "Banshō issai kaijin to nase" — a release blast felt across the whole Seireitei even from outside it; the sky turns to fire and the clouds burn off. Oldest and strongest fire-type Zanpakutō. Resealing does **not** cancel fire already deployed.
  3. **Bankai: Zanka no Tachi (残火の太刀, "longsword of remnant flame")** — "Bankai — Zanka no Tachi" — every flame he ever produced on the field is sucked into the blade and goes out; East and West switch on automatically; map-wide drying heat; **time-limited** (sustained use would burn Soul Society and him). On deactivation the vanished water comes back as torrential rain.
  - Skins: **two-armed (pre-Aizen)**, **one-armed (TYBW)**, **Young Yamamoto** (founding era, see kit).
- **Abilities (complete):**
  - *Sealed / racial*
    - `Reiatsu glare` — he focuses pressure by looking at someone: captains feel dread, lieutenants collapse, cannot breathe, cry and foam (Nanao). Enraged, it is felt across the entire Seireitei and **revitalizes allied Shinigami** who were about to fall (TYBW). The aura looks like flame and can set surroundings alight without the Zanpakutō; anime: an eruption of it shatters four stacked high-level Bakudō. [Field, Status: fear/paralysis/choke, Environmental: ignite]
    - `Hitotsume: Nadegiri (一ツ目・撫斬, "number one: sweeping cut")` — a single cut of extreme speed and precision that splits a multi-storey, hard-skinned giant (Ayon, vertically); the victim notices only afterwards. Visual: one flash from the cane-sword, then the halves part. [MeleeArc `cut`, Slice (~20 m), NEW: DelayedHit]
    - `Onibi (鬼火, "demon fire")` — a thrust with the blunt sealed cane that punches a big cylindrical hole clean through a multi-storey body (Ayon's chest). [MeleeArc, `bore` (~1.5 m wide, short)]
    - `Swordplay feats` — a spinning vertical slash that cuts an entire building in two (vs Royd, in Shikai); bats thrown roof tiles back at the thrower with flame. [MeleeArc `cut`, Slice, Absorb/Reflect/Redirect]
    - `Ikkotsu (一骨, "single bone")` — one punch that blows a hole through the target's abdomen and sends it flying down a street and through several buildings. [MeleeArc `smash`, body-carving knockback]
    - `Sōkotsu (双骨, "double bone")` — a two-fisted blow that shatters the opponent's entire body into pieces. [MeleeArc `smash`, Blast, NEW: ShatterKill]
    - `Bare-hand feats` — stops a giant's swollen punch one-handed and overpowers it; rips tendrils and both arms off a released Arrancar; backhands a javelin-sized Heilig Pfeil into a building; takes a multi-arm barrage (Wonderweiss' Centurion) with scratches. [Grab/Throw, Absorb/Reflect/Redirect, NEW: LimbSever]
    - `Shunpo master` — outran Shunsui and Ukitake and was already sitting at their destination; enters a battlefield inside a roaring fire column; in TYBW he launches into the sky trailing fire, crosses the Seireitei like a comet and slams down behind his target. [Teleport, Mobility]
    - `Kidō master` — full power with no incantation and no name. Shown: **Hadō #96 Ittō Kasō** (below); an unnamed Kidō that instantly knocks Momo out (Arrancar arc). *Anime-only:* a self-sealing barrier (Zanpakutō Rebellion), a massive **Bakudō #81 Dankū** that repels a city-scale blast (Reigai arc), a special sealing Kidō with Ginrei on Kōga Kuchiki (backstory). [Status: sleep, Shield, Construct]
    - `Hadō #96 Ittō Kasō (一刀火葬, "single-sword cremation")` — forbidden sacrificial (Gisei Hadō) spell that consumes part of the caster's body (his burnt left arm, lost for good): a short shockwave, then a gigantic pillar of red fire shaped like a **katana tip** erupts beneath the target and flattens every building nearby. He grabbed Aizen's leg to cast it point-blank. [Blast, Beam (vertical), Environmental `burn`, NEW: LimbSever (self)]
    - `Toughness` — impaled by Aizen without flinching; smothered the explosion of all his sealed flames with his own body (it would have razed an area many times Karakura); cut in half by Yhwach, still grabbed his leg. [passive]
    - `Tactician` — set Ennetsu Jigoku up while his captains fought; found the real Aizen through the reiatsu of the sword stuck in his gut (counter to illusions). [AI hook]
  - *Shikai — Ryūjin Jakka*
    - `Incineration aura (passive)` — whatever he swings at becomes ash; the landscape turns into a firestorm; the heat eats the clouds. Only giants such as Shunsui and Ukitake can withstand it, and only indirectly. Flames are **target-selective** and intensity-controlled (a deliberate "light toasting" for the one-armed Tres Bestias). [Field heat, Environmental `burn` + weather, NEW: AllySafeFire]
    - `Incinerating cut` — one direct slash strips flesh from bone; the victim becomes a skeleton that crumbles to ash (Driscoll). [MeleeArc `burn`, NEW: AshDeath]
    - `Fire waves / blasts` — fire thrown by a swing; one blast took out Äs Nödt, Bazz-B and NaNaNa together. *Anime-only:* flames fanned out in a wide ring; a blazing maelstrom that swallows a wind technique; flames running up an enemy's blade; long-range fire blasts (Kagerōza Inaba fight). [Projectile crescent/orb, Blast `burn`]
    - `Taimatsu (松明, "torch")` — one wave of the sword creates a great inferno that burns everything inside to ash, touching only the targets he chooses. [Field, Blast, Environmental `burn`]
    - `Jōkaku Enjō (城郭炎上, "castle in flames")` — an immense wall of fire rings the targets and closes into a giant sphere prison; it held Aizen, Gin and Tōsen for a long time and **stayed up after he resealed** (only a Menos-sized Hollow's breath blew it out). [Construct (fire dome), Bind, Field heat, NEW: FormIndependentConstructs, NEW: ArenaLock]
    - `Ennetsu Jigoku (焱熱地獄, "scorching hell")` — liquid fire runs down the edge into the ground, spreads in intricate circular patterns and raises **seven or more immense fire pillars** around the area; they merge into a growing inferno that kills everyone inside, Yamamoto included; can be **prepared in advance and sprung later**; can burn an area wider than Karakura Town. *Anime:* sword slammed into the ground, a trickle of flame seeps out, pillars erupt around two Reigai. [Field, Construct (pillars), Blast, Environmental, NEW: DeferredTrap]
    - *Anime-only (Zanpakutō Rebellion):* the manifested **Ryūjin Jakka spirit** is a colossal living inferno — restraining fire tendrils, a fire sphere coiled around a target, a barrier that keeps everyone in, flames that re-form when cut. Good boss/summon reference. [Summon, Bind, Construct]
    - *Game-only (Blade of Fate / Dark Souls), optional filler:* I-no-Kaburi Sōen (fire trail along the ground), Ro-no-Kaburi Shōen (rising flames), Ha-no-Kaburi Kakuen (flames swirling around him), Ni-no-Kaburi Yokuen (forward arc of fire), Ho-no-Kaburi Bakuen (flaming charge), Ama-no-Murakumo (big forward fire blast), Yazuhomura-no-Orochi (fire column splitting into a rain of fireballs).
  - *Bankai — Zanka no Tachi*
    - `Release: fire recall` — all flames he has produced anywhere are drawn into the blade at once; burning stops everywhere. [NEW: GlobalFireRecall]
    - `World heat (passive)` — moisture is drained from an area at least the size of the Seireitei ("hundreds of miles"): water and clouds vanish, the sky goes clear, skin dries, ice Bankai become unusable (Hitsugaya), glass cracks (anime), the ground under his feet melts so he slowly sinks. Prolonged use would incinerate Soul Society and himself. On deactivation: torrential rain. [Field heat, Environmental (evaporate/melt/weather), Status `burn`, NEW: GlobalWeatherState, NEW: MoltenMaterial]
    - `East — Kyokujitsujin (旭日刃, "rising-sun edge")` — always on: every flame is packed into the edge and tip; it neither burns nor explodes — whatever it touches **simply ceases to exist**. A tap on the ground erased a huge trench and the building behind it; most of a reishi sword vanished on contact; Blut Vene is no defense. It has to touch the body (slicing a cloak edge did nothing). *Anime:* erases three thrown boulders; cuts a Heilig Pfeil in half. [MeleeArc, Slice, NEW: EraseCarve]
    - `West — Zanjitsu Gokui (残日獄衣, "remnant-sun prison garb")` — always on, invisible unless he wants it seen: his body is wrapped in reiatsu as hot as the Sun's core (≈15,000,000 °C) — nobody can touch him; reishi weapons striking him disintegrate; Royd survived merely standing nearby only thanks to Blut Vene. *Anime:* he deliberately makes it visible. [Stance, Shield (contact-erase), Field heat, NEW: ContactDamageAura]
    - `South — Kaka Jūman'okushi Daisōjin (火火十万億死大葬陣, "great burial formation of the trillion fire-dead")` — sword driven tip-first into the ground; the reheated ashes of everyone he has ever burned rise as **thousands of charred skeletons** through a rupture strong enough to topple a Quincy pillar-barrier (Sankt Zwinger); they act as his limbs and swarm the target until it turns to dust, can pile up into a protective wall, and he can call **specific** corpses back with their original faces to wound the enemy psychologically (Royd recognizes his dead comrades). [Summon (horde), GroundWave, Construct (bone wall), Status: fear, NEW: KillRegistrySummon]
    - `North — Tenchi Kaijin (天地灰尽, "heaven and earth turned to ash")` — fire gathered on the blade, one slash → an enormous wave of fire that obliterates whatever it touches; Blut Vene can't stop it; it took Royd's arm and a large part of his torso; *anime:* the same wave also wipes out every summoned skeleton. [Slice, Projectile (giant crescent), Environmental `burn` → ash]
    - *Stolen:* the moment he re-releases in front of Yhwach, the medallion takes it (Yhwach claims nobody else could wield it) and Yhwach cuts him in half. The Wandenreich could not steal it earlier because they never understood a power he had never fully shown.
- **Passives & weaknesses:**
  - Fire persists after resealing; fire is selective (ally-safe); overwhelming durability; one-armed in TYBW.
  - **Wonderweiss Margela (Extinguir)** was built to seal Ryūjin Jakka: the blade can't make new flames, existing flames are stored inside Wonderweiss and explode when he dies → hard counter that forces the Hakuda kit. [NEW: AbilitySeal]
  - Bankai clock (self-damage, world burns), Bankai theft, Ennetsu Jigoku burns him too.
- **Signature moments to recreate (story set pieces):**
  1. **Teacher vs students** (Soul Society arc): Shunsui & Ukitake flee Sōkyoku Hill to a deserted ruined district and find him already sitting there; Nanao collapses under his glare; he peels the cane, strips haori and top, releases Shikai — the sky burns — and clashes with both dual-blade Shikai at once.
  2. **Fake Karakura opening:** Jōkaku Enjō cages Aizen, Gin and Tōsen.
  3. **Battle of the Chimera:** Onibi through Ayon's chest, Nadegiri splits it, Shikai burns it to nothing; a "light toasting" for the one-armed Tres Bestias.
  4. **Aizen & Wonderweiss:** arrives in a fire column, takes Aizen's stab, springs the pre-set Ennetsu Jigoku; Wonderweiss seals the fire → bare-chested Hakuda (Ikkotsu through buildings, tearing arms off, Sōkotsu); he smothers the sealed-flame explosion in a crater; burnt arm → Ittō Kasō on Aizen.
  5. **Vengeance for Chōjirō (TYBW ep 5):** swats Driscoll's javelin aside, stands motionless in stolen Kōkō Gonryō Rikyū lightning, one slash → skeleton → ash; comet flight across the Seireitei.
  6. **"Yhwach" (Royd Lloyd) (TYBW ep 6):** one fire blast KOs three Sternritter; building-splitting slash; Bankai — every fire goes out, a ground-erasing trench, visible West, a skeleton army wearing the faces of Yhwach's old officers, Tenchi Kaijin; rain begins; the real Yhwach steals the Bankai and bisects him (scripted loss, or a "what-if" win).
  7. **The founding war (TYBW ep 6–7, anime-expanded):** young Yamamoto with the original captains (Yachiru Unohana among them) massacres the Quincy; first Bankai against Yhwach with Chōjirō's help.
  8. **Chōjirō's challenge (≈2,000 years ago; the anime stages it in Ryūgon):** Yamamoto weathers Kōkō Gonryō Rikyū and keeps only the cross scar.
  9. *Anime-only:* vs Reigai-Shunsui & Reigai-Ukitake with Reigai-Unohana healing them → Ennetsu Jigoku traps all three.
- **Kit proposal:**
  - **Sealed (cane)** — *Shift:* very long, silent Shunpo; hold with lock-on = "already there" (appears seated at the target's predicted landing spot). *LMB:* slow 4-hit cane string (sweep, thrust, overhead, spin) with heavy hitstop; fwd = short Onibi jab, back = cane-flick launcher, air = two overheads, down-air = cane-plant crater, sprint = shoulder ram. *Heavy:* **Onibi** (1.5 m tunnel through target and wall). *Q* **Nadegiri** (iai from the cane; delayed split, ~20 m Slice) · *E* **Ikkotsu** · *R* **Sōkotsu** (needs both arms; in one-armed skins it becomes a one-handed "Ikkotsu II") · *F* **Catch & Tear** (timed grab of a strike or projectile; tears off limbs/tendrils, throws; hold = backhand a giant projectile away) · *Z* **Glare** (cone; fear/paralysis/choke scaled by SPL difference) · *X* nameless Kidō quick-cast (last wheel pick, no callout). *G:* **strip for battle** (haori and top off; fists replace the cane string, super-armor). *C:* fire-aura flare: ignites flammables, lieutenants kneel, allies get a "revitalized" buff. *T:* Shikai cinematic (cane peels away, release command, sky ignites). *V:* **Ittō Kasō** — grab if in reach, then the sword-tip fire pillar; costs his left arm for the rest of the match (one-armed model swap; if already one-armed: large HP cost). *Tab:* Ittō Kasō, Dankū (anime), self-barrier (anime), knockout touch, shared captain wheel.
  - **Shikai** — *Shift:* Shunpo with a fire trail; hold = **comet dash** across the map ending in a fire slam. *LMB:* flaming 5-hit string, every swing sets voxels burning; fwd = incinerating lunge (kills play flay → skeleton → ash), back = rising fire-pillar launcher, air = spinning vertical slash that halves a building, down-air = fire slam, sprint = burning dash cut. *Heavy:* giant fire crescent (40–60 m). *Q* **Taimatsu** (inferno cone; hold sets intensity from "light toasting" to ash) · *E* **Jōkaku Enjō** (ring → sphere prison, persists after resealing) · *R* **Ennetsu Jigoku** (tap: pillars around a ~60 m area; hold: plant a dormant pattern to trigger later, from any form) · *F* fire blast (exploding projectile; hold = maelstrom that eats wind/elemental projectiles) · *Z* flame repel (incoming debris/projectiles thrown back) · *X* flaming Nadegiri. *G:* firestorm aura on/off (passive area incineration, clouds burn away). *C:* fire eruption that breaks binds/Bakudō. *T:* Bankai; *hold T:* reseal (fire stays). *V:* **Ennetsu Jigoku — full**: an arena-sized ring of pillars merging into a total inferno (burns him as well). *Tab:* + game-only fire techniques (optional).
  - **Bankai** — on release all fire flies into the blade, the sky clears, heat haze everywhere; a **Bankai clock** (e.g. 60 s) after which he takes escalating self-damage and the map auto-ignites; ending it triggers rain. *Shift:* Shunpo leaving molten footprints. *LMB:* 3 slow cuts, every hit erases (no debris, glowing rim) and ignores Blut Vene/Hierro/shields; *RMB parry* erases projectiles. *Heavy:* **ground tap** — a trench tens of metres long. *Q* Kyokujitsujin cleave (wide erase arc) · *E* West burst (the hidden flames blow outward and ignite everything nearby, anime) · *R* **Minami** (skeleton horde) · *F* **Kita** (fire wave) · *Z* bone wall (skeletons pile into a shield) · *X* name a corpse (raise one specific character killed by fire this match, original face; fear on enemies related to it). *G:* West visible (flame shell + fear aura) / invisible (haze only). *C:* heat spike — the ground in a radius melts into lava. *V:* **Tenchi Kaijin, full** — a map-scale fire wave that turns a whole wedge of the map to ash. *Hold T:* deactivate → rain.
  - **Young Yamamoto skin:** same kit with two arms, sealed katana at the hip instead of the cane, higher aggression, and (design choice from Yhwach's description of him as "a demon with a sword" who treated everyone as expendable) flames that are **not** ally-safe.
- **AI notes:** Phase 1 barely moves — stooped, eyes closed, cane counters, glare; punishes rushdown with Catch/Ikkotsu. Opens his eyes right before a big move (tell). At ~70 % HP or after eating a big hit: strips, releases Shikai, the arena becomes a firestorm, and he isolates the player with Jōkaku Enjō. Phase 3 reveals an Ennetsu Jigoku planted at the start of the fight. At ≤25 %: Bankai with world heat and the clock — a DPS race in which he burns too. Personality: stern and terse, calls opponents "youngster" and fights "punishment"; refuses help from humans; a stolen Bankai used clumsily (Driscoll) or a lost haori enrages him.
- **Callouts:** "Banshō issai kaijin to nase — Ryūjin Jakka!" (万象一切灰燼と為せ 流刃若火) · "Jōkaku Enjō" · "Taimatsu" · "Ennetsu Jigoku" · "Hitotsume — Nadegiri" · "Onibi" · "Ikkotsu" · "Sōkotsu" · "Hadō no kyūjūroku — Ittō Kasō" · "Bankai — Zanka no Tachi" · "Zanka no Tachi, Higashi — Kyokujitsujin" · "Nishi — Zanjitsu Gokui" · "Minami — Kaka Jūman'okushi Daisōjin" · "Kita — Tenchi Kaijin".

---

## 3. Suì-Fēng (砕蜂) — Captain, 2nd Division; Commander-in-Chief of the Onmitsukidō

- **Wiki:** https://bleach.fandom.com/wiki/Su%C3%AC-F%C4%93ng · also `/Anime_Continuity`, Suzumebachi (Zanpakutō spirit), Nigeki Kessatsu, Shunkō, Mukyū Shunkō, Speed Clones, Kazaguruma, Takigoi, Tsurigaki, Onmitsukidō, Shijū Saimon · battles: Yoruichi vs Suì-Fēng, vs Ggio Vega, Suì-Fēng & Ōmaeda vs Baraggan, Hachigen & Suì-Fēng vs Baraggan, vs BG9 · TYBW episodes 4 "Kill the Shadow", 15 "Peace from Shadows", 16 "The Fundamental Virulence".
- Birth name **Shāolíng Fēng** (蜂 梢綾). Lieutenant: Marechiyo Ōmaeda. Also Corps Commander of the **Executive Militia (Keigun)**, the Onmitsukidō's black-clad assassination/execution corps.
- **Roster tier:** **A** (major). The assassin archetype: an instant-kill mark mechanic, the most fluid Hakuda kit in the game and a deploy-and-fire artillery Bankai. Ship with Yoruichi (mentor/rival) in the Soul Society wave.
- **Canon power: 7/10** — called the fastest fighter in Soul Society by her lieutenant; two stings killed Ggio; her Bankai missile tore off part of Baraggan's skull and arm and cracked Hachigen's four-gate barrier from the inside; Mukyū Shunkō sent BG9 through buildings. Her reiatsu is not top-tier (Aizen-level reiatsu simply wipes her crests away).
- **Body:** 150 cm, 38 kg → **48 vox** (72). Petite, wiry, compact; low, springy stances; small hands and feet in Chinese slippers. **Silhouette keys:** short black hair with **two long braids wrapped in white cloth ending in large gold rings** (pre-TYBW); sleeveless haori over a backless, sleeveless top; long black arm sleeves from wrist to upper arm; short sword slung **horizontally across the small of her back**.
- **Palette (hex estimates):**
  - Skin `#F2D8C4` (shade `#D3B29C`) · hair black with a blue sheen `#1B1C27` (highlight `#3A3F57`) · eyes **grey** `#8D9099`
  - Braid wraps white `#F3F3F1`, rings gold `#D7B03A` (shade `#A9852A`)
  - Keisen Shōzoku top (sleeveless, backless) black `#141418` · hakama black `#16161A` · arm bands black `#101014` · white sash `#EDEBE6` **plus a yellow sash** `#E2BF3F` worn a layer above and slightly lower · black Chinese shoes `#18181C`, plain white socks `#F4F4F2`
  - Haori (sleeveless) white `#F4F3EF`, back number 二 black
  - Suzumebachi sealed: **yellow** hilt `#E0B53A`, sheath dark `#1C1A17` (verify), carrying rope `#C9B28A` (verify)
  - Shikai: gauntlet gold `#D9A928` with black hornet bands `#121212`; chain `#B79A4A`; stinger black with gold base (verify)
  - Hōmonka crest: black butterfly/flower mark `#121212` (verify edge tint)
  - Shunkō wind: translucent white `#EEF6FF` → pale cyan `#A9CFEA` (verify)
  - Bankai: gold `#E1B12C` (shade `#B5871F`), black markings `#111111`; release pillar pale gold `#FFE48A` (verify); blast white → `#FFE07A` → `#FF8C2A` → smoke `#4A4440`
  - Ginjōtan steel sash silver `#BFC4CB`
  - Reiatsu: not stated in canon (her Zanpakutō spirit's reiatsu is yellow) → suggest yellow-gold `#F2C94C` for aura/flare (verify)
- **Look by form/outfit:**
  - **Captain (Soul Society → Fake Karakura):** as above.
  - **Keisen (combat):** haori thrown off → bare shoulders and back (the uniform has no back or sleeves because Shunkō would rip them away).
  - **110 years ago:** softer, shoulder-length hair, no braids; Yoruichi's devoted subordinate in the Onmitsukidō.
  - **After Aizen (Lost Agent arc):** hair back to that softer younger style; left arm restored by the Gotei's healers (it was rotted by Respira and cut off by Ōmaeda at her order).
  - **TYBW:** braids removed, short hair.
  - **Bankai:** gold launcher on the right arm and shoulder, armored face guard over the right half of her face (with sight slits); Ginjōtan wound around her waist and a building.
  - *Anime-only spirit:* **Suzumebachi** (Zanpakutō Rebellion) — a tiny pink-eyed girl with long brown twin tails, white fur collar, yellow-black striped puffy shorts, leggings and shoulder puffs, small yellow-black chest plates, black shoes; her whole right arm is a segmented yellow-black stinger longer than her body; flies; faint yellow glow; yellow reiatsu. Usable as summon, partner or mirror boss.
- **Weapons:**
  - **Sealed:** a wakizashi with a yellow hilt reminiscent of a Chinese dao, hung horizontally behind her lower back by a rope. Fought **reverse-grip** (blade lying back along the forearm): every strike is a punch that whips the blade out in a wide arc; she blocks the same way. She is equally good with a normal grip.
  - **Shikai:** the sword glows white and shrinks into a **black-and-gold gauntlet** on the right hand and forearm, linked by a thin chain to a **stinger on the middle finger** about twice a finger's length (~15 cm). The gauntlet/stinger can block blades and knock thrown knives away.
  - **Bankai:** a gold missile launcher encasing the right arm up past the shoulder, plus the face guard; the missile is a pointed gold cylinder with black markings about **twice her height (~3 m)**; small fins pop out along it before launch.
- **Forms & states (ordered):**
  1. **Sealed** — Hakuda + reverse-grip blade, speed clones, stealth.
  2. **G: Shunkō** — incomplete version (right arm only, short) → **Mukyū Shunkō** (TYBW: indefinite).
  3. **Shikai: Suzumebachi (雀蜂, "hornet")** — "Jinteki Shakusetsu" (尽敵螫殺) — gauntlet + stinger, Nigeki Kessatsu.
  4. **Bankai: Jakuhō Raikōben (雀蜂雷公鞭, "hornet thunder-lord whip")** — a pillar of reiatsu shoots up, the launcher forms; near-immobile artillery stance.
- **Abilities (complete):**
  - *Sealed / racial*
    - `Shunpo master` — keeps pace with Yoruichi; attacks land before they are seen; extremely hard to hit at any range. [Teleport, Mobility]
    - `Speed Clones` — at least **15** simultaneous Shunpo clones, indistinguishable from her and copying her moves; short-lived. [Afterimage/Clone]
    - `Utsusemi` (*anime filler*) — evasive Shunpo leaving a solid-looking afterimage. [Afterimage/Clone]
    - `Reiatsu concealment` — hid from BG9's sensors completely (it could not find her even with stored reiatsu samples, anime). [Sensing/Stealth]
    - `Assassination` — strikes from blind spots; holds a blade to Aizen's throat (with Yoruichi) to capture him. [Bind, NEW: Execution]
    - `Kazaguruma (風車, "windmill")` — throws her body into the air, scissors her legs past each other and lands a devastating kick that sends the target flying. [MeleeArc `smash`, knockback]
    - `Takigoi (滝鯉, "waterfall carp")` — vs. a kicking opponent: blocks the first kick with the forearm, grabs that foot, traps the second kick between her legs, then strikes with the free hand (she then stabbed Yoruichi's cheek). [Grab/Throw, counter]
    - `Tsurigaki (吊柿, "hanging persimmon")` — wraps arms or legs around an incoming strike and uses it as a pivot to hit back. [Grab/Throw, counter]
    - `Keigun ambush` — jabs her sword into the branch she stands on and dozens of Executive Militia appear around the target (they were swept away by Yoruichi, but it's canon). [Summon]
    - `Kidō expert` — mixes Kidō into Hakuda; bound Ggio with an unnamed binding spell before releasing Shikai. *Anime-only:* throws knives (vs Inaba); a joint counter technique with Yoruichi named "Hankisōsai" (mechanics unclear). [Bind, Projectile needle]
    - `Physique` — lifts the concrete slabs she was buried under; throws foes four times her size; kicked through buildings and fights on; kept fighting after losing her left arm. *Anime:* resistant to almost all poisons (Punishment Force training). [passive]
  - *Shunkō*
    - `Shunkō (瞬閧, "flash war cry")` — her element is **wind**: Kidō compressed over back and arms (incomplete form: right arm only) and released as directed blasts that wreck the surroundings. *Anime:* used as a barrier — blocks a lightning blast, stops a blade with a bare hand, concentrates on one body part; it repels a stinger. [Stance, Blast, Shield]
    - `Mukyū Shunkō (無窮瞬閧, "tireless flash war cry")` — she wraps the reiatsu around herself several times so it orbits her like a vortex indefinitely → no time limit; a direct hit makes a big explosion; one fist launched BG9 through the area, then she grabbed its tendril and swung it through several buildings. [Stance, Blast, Grab/Throw]
  - *Shikai — Suzumebachi*
    - `Nigeki Kessatsu (弐撃決殺, "death in two strikes")` — the first sting leaves a deep wound and the **Hōmonka (蜂紋華, "hornet crest")**, a black butterfly-shaped mark spreading from the wound; a second sting **on the same crest** is death: a bigger crest blooms from the two and destroys the body (Ggio crumbles). What counts is the *surface contact point*, not the entry wound. Several crests can coexist (Yoruichi carried four: stomach, upper back, right arm, cheek). Crests last until Suì-Fēng removes them (half an hour max in Yoruichi's day). *Anime:* the mark is a venom that consumes the body in seconds to minutes (slower on high-reiatsu targets); she can stab herself to use it as counter-poison. [Status: death-mark, NEW: SurfaceMarkHitTest]
    - `Gauntlet guard` — blocks blades with the stinger/gauntlet, deflects thrown knives. [Shield, parry]
  - *Bankai — Jakuhō Raikōben*
    - `Missile` — she raises the launcher, aims through the face-guard slits, fins deploy, the missile flies and **homes** on its target, then a gigantic explosion. Recoil hurls her and anyone near her away → she ties herself to a building with the **Ginjōtan** steel sash (it still tore) or has Ōmaeda brace her. Nominal limit **one missile every three days** — she fired a second within the same battle, exhausted. "Too big to hide, too heavy to move, too flashy for an assassin" — she hates using it. Feats: Baraggan (half his skull and his lower arm gone, even though he aged the missile into an early detonation and diverted the blast), cracked Shijū Saimon from within (Hachigen's four-gate box trapping Baraggan and the blast), lifted BG9 into the sky and blew it up through the clouds. [Projectile (homing), Blast, NEW: TetherAnchor, NEW: ADSOverlay]
- **Passives & weaknesses:** crests are negated by vastly superior reiatsu; no crest if the stinger can't pierce (BG9's metal body); Bankai: recoil, immobility, ammo limit, theft (BG9 stole it — Hollowfied version returned via Shin'eiyaku and poisoned BG9); emotional blind spot for Yoruichi.
- **Signature moments to recreate:**
  1. **Sōkyoku Hill forest vs Yoruichi:** a leaf split by two clashing kicks; Keigun ambush wiped out by Yoruichi's afterimages; haori off; Shikai behind Yoruichi's head; four crests; Takigoi; incomplete Shunkō vs Yoruichi's lightning Shunkō; Yoruichi cancels her with Hanki; tearful collapse.
  2. **Fake Karakura vs Ggio:** feigns defeat to study his release, then kills him with two stings he only "felt" as one.
  3. **Vs Baraggan with Ōmaeda:** Respira rots her left arm and Ōmaeda cuts it off; Ōmaeda runs as decoy; Bankai tied to a building; second missile into Hachigen's Shijū Saimon.
  4. **TYBW first invasion:** the stinger won't pierce BG9; Bankai stolen.
  5. **TYBW second invasion:** Mukyū Shunkō vs BG9 → missile barrage → Ōmaeda drops the Shin'eiyaku into her palm → Hollowfied Bankai through the clouds.
  6. *Anime-only:* vs Suzumebachi (crest duel; Shunkō finally repels the stinger); vs Mabashi (poisoned, stings herself for the counter-venom).
- **Kit proposal:**
  - **Sealed** — *Shift:* fastest Shunpo in the roster (short cooldown, chain ×4); double-tap with lock-on = appear behind. *LMB:* 6-hit mix of reverse-grip slashes and kicks; fwd = palm lunge, back = rising Kazaguruma launcher, air = kick flurry, down-air = heel drop, sprint = sliding sweep. *Heavy:* **Kazaguruma** (full windmill kick, launches through walls). *Q* **Speed Clones** (15 copies mimic her for ~2.5 s, scramble lock-on) · *E* **Takigoi** (counter stance vs kicks/strikes) · *R* **Tsurigaki** (grab-counter pivot) · *F* **Keigun ambush** (6–12 ninja NPCs around the target, bind/harass) · *Z* **Conceal reiatsu** (invisible to sensing and lock-on until she attacks; opening hit = assassination bonus) · *X* binding Kidō. *G:* **Shunkō** (haori off, wind vortex; fists and kicks explode; directed wind blasts; bare-hand barrier) — incomplete version = right arm and timer, Mukyū (TYBW skin/unlock) = no timer. *C:* wind-burst flare. *T:* Shikai. *V:* **Mukyū Shunkō blast** (point-blank fist that sends the target through a city block). *Tab:* binding/striking Kidō from the shared wheel, thrown knives (anime).
  - **Shikai** — *LMB:* very fast stinger jabs; every first hit on a body region plants a crest at that surface point; a hit landing on an existing crest = kill (bosses with higher SPL: heavy damage + crest erased instead). *Heavy:* armor-piercing stinger lunge (guaranteed crest). *Q* **Nigeki Kessatsu** (Shunpo to the nearest crest and sting it) · *E* crest flurry (marks several spots in one string) · *R* speed clones · *F* bind-and-sting (Ggio tactic) · *Z* counter-poison (anime; cures poison and grants brief immunity) · *X* gauntlet parry stance. *G:* Shunkō stacks with Shikai. *T:* Bankai. *V:* **Nigeki Kessatsu finisher** — on a crested target, cinematic second sting, the crest blooms and the body crumbles.
  - **Bankai** — *T:* reiatsu pillar, launcher forms; auto-throws the Ginjōtan around the nearest solid structure (no structure → anchor to an ally such as an Ōmaeda NPC, or eat full recoil); movement becomes very slow. *RMB:* aim mode with the face-guard slit overlay. *LMB:* launcher bash. *Q / V:* fire the missile (fins pop, homing, huge explosion; recoil can rip the sash). *E:* re-anchor. *R:* overtaxed second missile (costs HP/stamina). Ammo = 1 + 1 per match (canon "once every three days"). *Hold T:* dismiss.
- **AI notes:** opens fights hidden (concealed reiatsu) and tries to land the first crest; counters with Takigoi/Tsurigaki; clones when pressured; may **feign losing** to study the opponent, then finishes in one exchange (Ggio); Shunkō at ~50 %; Bankai only as a cornered-target finisher, and only once anchored (uses Ōmaeda as decoy/brace if present). Cold, proud, contemptuous; with Yoruichi on the field her accuracy and composure drop. Taunts: wipes blood off her cheek and smirks.
- **Callouts:** "Jinteki Shakusetsu — Suzumebachi!" (尽敵螫殺 雀蜂) · "Nigeki Kessatsu" · "Shunkō" · "Mukyū Shunkō" · "Bankai — Jakuhō Raikōben" · "Kazaguruma" · "Takigoi" · "Tsurigaki".

---

## 4. Gin Ichimaru (市丸 ギン) — Captain, 3rd Division (traitor)

- **Wiki:** https://bleach.fandom.com/wiki/Gin_Ichimaru · also Butō, Butō: Renjin, Korose Kamishini no Yari, Sentan Hakuja, Hakufuku · battles: Tōshirō Hitsugaya vs Gin Ichimaru, Ichigo Kurosaki vs Gin Ichimaru, Gin Ichimaru vs Sousuke Aizen.
- Lieutenant: Izuru Kira. Earlier: 3rd Seat (under Shinji Hirako) and lieutenant of the 5th Division under Aizen.
- **Roster tier:** **A** (major). One of the most popular characters, with a uniquely readable gimmick (a blade that extends from point-blank to kilometres) and a hidden-poison finisher. Ship in the Soul Society wave (Shikai), Bankai with Fake Karakura.
- **Canon power: 8/10** — his Bankai slices a town in half lengthwise from a distance; matched Bankai Ichigo with his sealed sword one-handed; took a point-blank Bankai Getsuga Tenshō with only a scratch on the forehead; the only person to ever mortally wound pre-evolution Aizen.
- **Body:** 185 cm, 69 kg → **59 vox** (89). Tall, very thin, long-limbed, slightly hunched and loose-jointed; narrow, sharp, almost skeletal face; permanent **wide fox-like grin** and closed slit eyes. **Silhouette keys:** ear-length **silver** hair with a long fringe; the grin; captain haori with 三 (Soul Society) or a long white robe with **bell sleeves that swallow his hands** (Hueco Mundo).
- **Palette (hex estimates):**
  - Skin pale `#F1DFCD` (shade `#D2BBA6`) · hair silver `#CBD0DA` with lavender shade `#A7ACBD` · eyes (rarely open) **sky blue** `#5EC4F0` (canon from vol. 20 cover / anime ep 270+; early anime episodes show red, DS games yellow) · teeth `#F7F4EE`
  - Captain: kosode/hakama black `#16161A`, haori white `#F4F3EF` with 三 black, lining (verify)
  - Hueco Mundo: robe white `#EFEEEA`, lining/edges/under-layers black `#141414`; hakama black `#16161A` at first, later white `#ECEBE6`
  - Shinsō: hilt **light blue** `#8CC6E3`; tsuba steel `#AEB4BC` (verify); blade `#D4D9DE`; sheath (verify)
  - Extension streak white `#F6FBFF` with pale-blue rim `#BFE3FF`
  - Reiatsu **violet** `#8D5BD6` (glow `#C7A8FF`)
  - Korose dissolution: flesh breaking into dark-violet dust `#3B2346` around a raw rim `#7A3E5A` (stylized, verify)
  - Hakufuku petals purple `#A77BD1` · Sentan Hakuja cloth white `#F4F4F1`
- **Look by form/outfit:**
  - **Captain (Soul Society arc):** black shihakushō + white haori 三; Shinsō worn at the hip; hands often loose, sometimes hidden.
  - **Hueco Mundo / Fake Karakura:** long white robe over the hakama, open in a narrow V down to the waist, closed to below the hips, then open again to a mid-calf hem; long bell sleeves hiding the hands; black lining; Shinsō hidden (at first its hilt peeks out of the V opening) — he fires the blade **straight out of his sleeve**. Later white Arrancar-style hakama.
  - **Final moments:** vertical chest wound, **right arm torn off** by Aizen, impaled.
  - **Child (Rukongai / Turn Back the Pendulum, ≈110 years ago):** a small boy (height not given — estimate ~130–140 cm) with the same silver hair, grin and closed eyes; ragged Rukongai clothes with dried persimmons, later a seated officer's shihakushō.
  - **Reiatsu-concealing cloak** (made by Urahara): worn to ambush Isshin; hides reiatsu and makes the wearer nearly blend into the air.
- **Weapons:**
  - **Sealed / Bankai look:** Shinsō, an ordinary-looking **wakizashi** (short, ~55 cm overall estimate); light-blue hilt; the guard is two thin metal swirls looping around the blade into an open oval like an "S". The Bankai looks *exactly* like this.
  - **Shikai:** the blade glows white and shoots out at high speed to up to **100 × its length** (≈ 50 m), retracting just as fast and able to **bend** on the way back.
  - **Bankai:** same blade, claimed reach **13 km** at **500 × the speed of sound** (full length in < 0.08 s) — Gin later told Aizen it was a lie and that it is neither that long nor that fast; real numbers unknown.
- **Forms & states (ordered):**
  1. **Sealed** — one-handed wakizashi swordsmanship, Shunpo, Kidō, manipulation.
  2. **Shikai: Shinsō (神鎗, "god spear")** — "Ikorose" (射殺せ, "shoot to kill") — extending blade.
  3. **Bankai: Kamishini no Yari (神殺鎗, "god-killing spear")** — no visual change at all; huge force/reach/speed; Butō stance; the hidden poison "Korose".
- **Abilities (complete):**
  - *Sealed / racial*
    - `Swordsmanship` — always one-handed and effortless; as a child he murdered the 5th Division's 3rd Seat; held off Hitsugaya and Bankai Ichigo without releasing; struck Aizen while turned away. [MeleeArc]
    - `Shunpo expert` — kept pace with Bankai Ichigo; vanishes from fights at will ("bye-bye"). [Teleport]
    - `Reiatsu` — knocked out Chad, Orihime, Uryū, Ganju and a seated officer just by facing them. [Field, Status]
    - `Sentan Hakuja (千反白蛇, "thousand-coil white snake")` — a long white cloth whirls around the targets, tightens, and with a white flash teleports them elsewhere (him and Aizen). [Teleport, Bind]
    - `Hakufuku (白伏, "white crawl")` — the target sees phantom purple cherry blossoms falling, vision blurs, mind fogs, then blacks out and later remembers little (used on Rangiku). [Status: blindness/sleep, Field: illusion]
    - `Senkaimon` — opens a gate between worlds on Aizen's order. [Teleport]
    - `Rope tie` (gag) — trussed up Kenpachi and carried him off a rooftop to stop a fight. [Bind, Grab/Throw]
    - `Manipulator` — pre-positions bystanders so the opponent must choose between defending themselves and saving a third party (Hitsugaya/Hinamori); lies about his abilities to steer the opponent's attention. [AI hook]
    - `Durability` — a point-blank Bankai Getsuga Tenshō only cut his forehead.
    - `Reiatsu-concealing cloak` (gear). [Sensing/Stealth]
  - *Shikai — Shinsō*
    - `Extension` — white-glowing blade shoots out at high speed with enormous force: it shoved Ichigo **and** the braced giant Jidanbō out from under the Seireitei gate (and cut off Jidanbō's arm in the manga); Rangiku's Zanpakutō started cracking from blocking it. Can be held extended and swung in wide arcs to hit many targets; bends while retracting; max 100 × length (his childhood nickname: **Hyapponzashi**, "hundred-span"). Can be fired **through his own haori/sleeve** without a visible draw (at Hitsugaya's eye, at Aizen). Bisected Hiyori at the waist (anime: impaled her instead). [Projectile/MeleeArc hybrid, `cut` + `bore`, push-carving, NEW: ExtendableBlade]
    - `Multi-target lethality` — maximizes Shikai reach to kill several targets in one thrust at long range. [MeleeArc multi-hit]
  - *Bankai — Kamishini no Yari*
    - `Hyper-extension` — the same tricks with vastly more force, cutting power, length and speed: one slash cut the (fake) town in half lengthwise and toppled the buildings; its swing pushed Bankai Ichigo back metres; it retracts as fast as it extends. [Slice (map-scale), `cut`, NEW: ExtendableBlade]
    - `Disguise (passive)` — the Bankai looks identical to the sealed sword. [NEW: FormDisguise]
    - `Butō (無踏, "null step")` — both hands grip the sword with the hilt pressed to the centre of his chest; extension and retraction become almost invisible. [Beam-like hitscan pierce]
    - `Butō: Renjin (無踏連刃, "null step: serial blade")` — Butō repeated many times in an instant → what looks like a mass of blades; destroyed a building and shattered Ichigo's Hollow mask. [MeleeArc multi-hit, Projectile multishot, `cut`/`bore`]
    - `Korose, Kamishini no Yari (死せ 神殺鎗, "kill, god-killing spear")` — the true power: for an instant while extending/contracting the blade **turns into dust**, and inside it is a poison that dissolves cells. Retracting, he leaves a sliver inside the target; saying the command with his hand raised toward them dissolves them from the inside (a gaping hole opened in Aizen's chest around the Hōgyoku). Kubo Q&A: the sliver is poison secreted by the sword and reverts after a while (expiry). [Status: death-mark/poison, NEW: RemoteTriggerStatus]
  - *Game-only, optional filler:* Yarisazame ("Furi sosoge": blades raining from the sky), Shinsō Tenryū / Sōeikan (dash-through thrust + barrage), Shinsō Fukuryū (rush past, fire backwards), Shinsō Jiryū / Gyaku Shigure (blade tunnels underground and erupts below; blade forest), Rakusei Sashi (slash flurry), Shinsō Sōryū (drilling vortex along the extended blade), Shunsōgeki (mid-air rushing slashes), "bye-bye" teleport.
- **Passives & weaknesses:** can be pressured when his extension is blocked (Ichigo stopped the Bankai with his own); the Korose sliver must be planted first and expires; physically frail compared to brawlers; Aizen's post-Hōgyoku evolution simply survived Korose.
- **Signature moments to recreate:**
  1. **The Seireitei gate:** cuts the gatekeeper, extends Shinsō to drive Ichigo and Jidanbō back out under the gate — "bye-bye".
  2. **Rooftops vs Hitsugaya:** the ice dragon, arm frozen and chained; Shinsō bursts through his haori, then retargets Hinamori; Rangiku blocks.
  3. **Sōkyoku Hill:** ordered to kill Rukia — Byakuya takes the thrust; Rangiku holds a blade to Gin; the Negación light lifts the traitors away.
  4. **Fake Karakura:** bisects Hiyori; vs Ichigo — Bankai halves the town, Butō: Renjin shatters Ichigo's mask.
  5. **Real Karakura:** touches Kyōka Suigetsu's blade, shoots the Bankai from his sleeve through Aizen, "Korose" — hole in Aizen's chest — steals the Hōgyoku; Aizen evolves, tears off his arm; dies in Rangiku's arms.
  6. **Childhood vignettes:** dried persimmons with Rangiku in the Rukongai; the night he witnesses Aizen's men steal part of her soul and decides to kill Aizen.
- **Kit proposal:**
  - **Sealed** — *Shift:* lazy Shunpo glide, hands in sleeves; double-tap = "bye-bye" vanish and reappear behind. *LMB:* 5-hit one-handed wakizashi flicks; fwd = lunge thrust, back = rising slash, air = spinning cuts, down-air = plunge, sprint = dash-through cut. *Heavy:* draw thrust. *Q* **Sentan Hakuja** (teleport self + grabbed ally/enemy to a marked point) · *E* **Hakufuku** (blossom illusion → blur → sleep; bosses only blur) · *R* reiatsu glare (cone collapse vs weaker foes) · *F* **back-turned strike** (counter that hits behind him without looking) · *Z* **concealing cloak** (stealth shimmer) · *X* **Senkaimon** (escape gate). *G:* "eyes open" — the grin drops, blue eyes open: serious mode (AI tell, damage up; stylistic, not a canon power-up). *C:* violet flare. *T:* Shikai. *Tab:* rope tie (gag), shared Kidō wheel.
  - **Shikai** — *LMB:* rapid extensions (5–20 m pokes) that cut and bore; fwd = full 100× thrust (~50 m, drills through walls, carries the target), back = bending retract that hits off-axis, air = downward pinning extension, down-air = thrust into the ground that lifts the target from below (inferred), sprint = shove-thrust that rams the target through structures. *Heavy:* **gate push** — full-force extension that drives even a braced giant back and cracks blocking weapons. *Q* **extended sweep** (hold the blade out and swing: ~50 m arc, multi-target, halves buildings) · *E* **bending retract** · *R* **sleeve shot** (no wind-up, no tell; fires through clothing) · *F* **hostage shot** (auto-targets a third party/ally of the enemy to force a block) · *Z* multi-target volley · *X* Yarisazame (game-only, optional). *T:* Bankai. *V:* **Hyapponzashi** spin — a full-length circular sweep.
  - **Bankai** — *T:* no visual change, only a faint reiatsu pulse; the enemy HUD/AI still reads "sealed" (G toggles the disguise). *LMB:* near-hitscan km-range thrusts; each hit plants a **sliver**. *Heavy:* **town splitter** — horizontal swing at full length (map-scale Slice, buildings topple). *Q* **Butō** (invisible ultra-fast pierce) · *E* **Butō: Renjin** (dozens of extensions per second, wall of blades) · *R* long snipe (hold to aim across the map) · *F* **Korose** (hand raised: every slivered target dissolves from the inside — huge damage/instakill, a crumbling hole in the model) · *Z* plant fragment (a deliberate stab-and-retract that guarantees a sliver) · *X* mid-length wide arc. *V:* **"Kamishini no Yari — Korose"** cinematic: Butō: Renjin plants slivers on everything, then Korose.
- **AI notes:** keeps mid-to-long range and pokes; smiles, talks, plays dumb; targets the player's allies or bystanders to force bad blocks; hides that he is in Bankai; when the player closes in → Butō: Renjin; uses Korose as soon as a sliver is planted and the player is low; at low HP vanishes with Sentan Hakuja or Shunpo rather than dying. Kansai-dialect sarcasm; drops the grin only when genuinely threatened (tell for a burst).
- **Callouts:** "Ikorose — Shinsō" (射殺せ 神鎗) · "Bankai — Kamishini no Yari" · "Butō" · "Butō: Renjin" · "Korose, Kamishini no Yari" · "Bai-bai" (vanish, game-flavored) · "Hakufuku" · "Sentan Hakuja".

---

## 5. Retsu Unohana (卯ノ花 烈) / Yachiru Unohana (卯ノ花 八千流) — Captain, 4th Division; the first Kenpachi

- **Wiki:** https://bleach.fandom.com/wiki/Retsu_Unohana · also `/Anime_Continuity`, Minazuki (Zanpakutō spirit), Kaidō, Kenpachi (title) · battle: Kenpachi Zaraki vs Retsu Unohana · TYBW episodes 7 "Born in the Dark", 9 "The Drop", 10 "The Battle".
- "Retsu" is her birth name (given by her father); "Yachiru" ("eight thousand flows/styles") is the name she gave herself as the most notorious criminal in Soul Society's history, before Yamamoto recruited her as a founding captain. First captain of the 11th Division and **first Kenpachi**; later captain of the 4th Division (lieutenants: Seinosuke Yamada, then Isane Kotetsu). Taught healing by Tenjirō Kirinji — she learned it **to make fights last longer**. Died in the Muken passing the Kenpachi title to Zaraki; Hell epithet "Death Sword".
- **Roster tier:** **A** (major). Two characters in one: the serene healer and the most bloodthirsty swordswoman in history; healing + Bankai self-regeneration + a "kill and revive" duel mechanic. Ship the Retsu persona with the Soul Society wave as support/AI partner; Yachiru + Bankai with the TYBW wave.
- **Canon power: 9/10** — by her own account weaker only than Zaraki; Aizen chose not to fight her; repeatedly "killed" eyepatch-free Zaraki and healed herself from a body-length slash in seconds; master of every sword style.
- **Body:** 159 cm, 45 kg → **51 vox** (76). Slender, graceful, youthful; soft, gentle face; deceptive strength. **Silhouette keys (Retsu):** a **single thick braid** starting at the throat and hanging down the front of her body to the waist (it covers her scar), long-sleeved haori, a **wide obi** instead of the normal sash, and a long sword carried **over the shoulder on a rope strap**. **(Yachiru):** hair loose and long, a single **scar between and just below the collarbones**, dead-eyed stare, manic grin.
- **Palette (hex estimates):**
  - Skin `#F4E2D3` · hair black with a dark-blue cast `#1D2130` (highlight `#3B4560`) · eyes **blue** `#3E5FA0` (verify shade) · scar pale `#E6C3B3`
  - Kosode/hakama black `#16161A` · wide obi white `#EEECE6` (verify; Isane later copies "a large white cloth belt like Unohana's") · haori white `#F4F3EF`, back 四 black, lining (verify)
  - Minazuki sealed: **red** handle `#A3202B`, oval tsuba `#8C6E3F` (verify), sheath dark `#2B2420` (verify), rope strap `#D8CFC0` (verify), blade `#CDD2D8`
  - Shikai creature: body green `#8FC79E`, paler belly `#CFE8D3`, single eye orange `#F08A2C` with black pupil (verify), mouth interior `#6E2A33`
  - Bankai fluid: deep red `#5C0A12` → `#8E1420`, wet highlights `#C2303B`, red mist `#7A1A22` (semi-transparent)
  - Kaidō: palms glowing green `#7DFFA0`
  - Daggers: steel `#C9CED4`, black grip `#1E1E22`
  - Reiatsu: not stated in canon → suggest soft green-white for Retsu, deep crimson `#8E1420` for Yachiru (design choice, verify)
- **Look by form/outfit:**
  - **Retsu (Soul Society → TYBW):** front braid, closed-eye kind smile, haori with 四, wide obi, Minazuki over the shoulder (or carried by Isane).
  - **110 years ago:** no big braid — hair gathered in front as a loose ponytail.
  - **Yachiru (Muken, TYBW):** braid undone, hair loose; scar exposed; gloomy, menacing eyes and a depraved grin; captain uniform (whether the haori stays on in the duel is not stated — verify vs TYBW ep 9–10).
  - **First Kenpachi (before meeting Zaraki):** hair always worn loose, no scar. In the founding-era battle with the Quincy (TYBW ep 7 flashback) she fights alongside the original captains; the first anime broadcast mistakenly drew the scar there (removed in the home release). Captain haori presumably bearing 十一 (verify).
  - **Several hundred years ago (anime ep 10 flashback):** stands in rain in the Rukongai beside a mountain of slaughtered gang members, rain washing the blood off her blade, when child Zaraki leaps from the pile and stabs her between the collarbones.
  - *Anime-only spirit:* **Minazuki** manifests as a slim humanoid wrapped in bandages under a very long light-green hood.
- **Weapons:**
  - **Sealed:** Minazuki — slightly longer than a normal katana, shaped like a **nodachi**; oval tsuba, red handle; hung over the shoulder by a rope strap tied to the sheath ("tachi style"). (Her very first appearance drew a curved, scimitar-like blade.)
  - **Hidden daggers:** a set of small blades thrown or stabbed by sleight of hand.
  - **Shikai:** not a weapon but a **giant green one-eyed manta-ray creature** (can be resized from huge down to puppy size); sealing it melts it into a slurry of flesh that pours back into the scabbard.
  - **Bankai:** she drags her clenched left hand along the blade; the blade melts into thick dark-red blood-like fluid, the same fluid pours down from above until it floods the battlefield, then the blade re-solidifies (still dripping) and can clash with other swords.
- **Forms & states (ordered):**
  1. **Retsu (sealed)** — healer captain; elegant swordplay, Kidō, Kaidō.
  2. **G: Yachiru** — braid undone, the original Kenpachi (state change: stats and moveset).
  3. **Shikai: Minazuki (肉雫唼, "flesh-drop gorge")** — release command and process **never shown**; the manta creature: flight, transport, healing stomach.
  4. **Bankai: Minazuki (皆尽, "all things' end")** — blood flood; liquid blades; self-regeneration. If she takes a fatal blow, the fluid vanishes instantly.
- **Abilities (complete):**
  - *Sealed / racial*
    - `Swordsmanship of every style` — her specialty is Kendō; she has mastered countless styles (the meaning of "Yachiru"); outclassed Zaraki for most of their final duel after centuries without melee: parries with the back of her free hand, stops his sword-arm with her foot, **steps on his sword guard** to vault into a counter, **disarms** him, cuts the side of his neck, runs his throat through. [MeleeArc `cut`, NEW: Disarm, NEW: MovesetShuffle]
    - `Hidden daggers` — produced and thrown/stabbed by sleight of hand (stuck one in Zaraki's shoulder: "fighting one-handed and doing nothing with the other hand means you aren't enjoying it"). [Projectile needle, MeleeArc]
    - `Hakuda` — back-hand deflection and foot blocks as above. [counter]
    - `Shunpo` — captain-average; out-flanks Zaraki. [Teleport]
    - `Kidō master` — high-level Hadō and Bakudō without incantation. *Anime-only (Reigai arc):* **Bakudō #62 Hyapporankan** (a barrage of light rods pinning the target), **Bakudō #81 Dankū** (barrier wall that stopped an incantation-less Hadō #88), **Bakudō #63 Sajō Sabaku** (chain of light binding the upper body). [Bind, Shield, Construct]
    - `Kaidō (回道, "turning way") — master` — palms glow green; she restores reiatsu first, then rebuilds the body; restored Ichigo's reiatsu to full **while both were running**; heals humans and Arrancar alike; herbal medicine; diagnoses at a glance (saw that Aizen's "corpse" was a fake). In the Muken she **healed Zaraki again and again** after near-fatal wounds so he would keep breaking his own limiter, and healed her own body-length wound in seconds. [Heal/Reject, Sensing]
    - `Reishi path-building` — took the lead in the Garganta and built a clean, sturdy reishi road where Ichigo's was brittle. [Construct]
    - `Presence` — feared by the 11th Division and by her fellow captains; a smile and an extra-polite request are enough to make Ichigo comply. [Field: fear (gag-canon)]
    - `Strength & endurance` — matched eyepatch-off Zaraki blow for blow; shrugged off his kick; counterattacked through a grievous slash. [passive]
  - *Shikai — Minazuki (creature)*
    - `Healing stomach` — wounded people placed in its mouth are swallowed (at least six at once) and soaked in stomach acids that work as medicine; regurgitates them on command. [Heal/Reject, Summon, NEW: CarryInside]
    - `Transport` — flies with Unohana (and Isane) riding on its back; sprouts a pair of legs to land; resizable down to puppy size. [Summon, Mobility, NEW: Mount]
  - *Bankai — Minazuki*
    - `Blood flood` — the battlefield becomes a pool of dark-red fluid. [Field, Environmental (flood), NEW: LiquidFloorSource]
    - `Liquid slashes` — swings send waves of the fluid at range, in rapid succession; she flows between ranged and melee seamlessly. *Anime-expanded:* forms blades out of the pooled fluid and fires them repeatedly. [Projectile crescent, multishot]
    - `Blade sphere` — rapid slashes in every direction leave a loose sphere of small liquid blades around her (defense/offense); a larger field follows. [Swarm, Shield]
    - `Regeneration` — the fluid acts as a catalyst: her wounds close almost instantly without Kaidō. [Heal/Reject (self)]
    - *Uncertain:* after clashing with her liquid blades Zaraki remarks that he is "melting" — the Bankai may also corrode flesh; canon never states it (verify before making it a mechanic). [Status: decay?]
  - *Not canon:* Minazuki's Shikai release phrase; any attack by the manta itself.
- **Passives & weaknesses:** self-heal and Bankai regeneration; Bankai collapses the instant she takes a lethal wound; Retsu persona is pacifist/support (won't initiate unless duty requires).
- **Signature moments to recreate:**
  1. **Soul Society arc rescue:** releases Minazuki, swallows the wounded, flies with Isane on its back to the relief station.
  2. **Central 46 chambers:** exposes Aizen's fake corpse; Aizen leaves rather than fight her; she saves Hitsugaya and Momo.
  3. **Las Noches:** her arrival makes the Exequias retreat; heals Chad and Gantenbainne.
  4. **Garganta run:** builds the reishi road and refills Ichigo's reiatsu on the move.
  5. **The Muken duel (TYBW ep 9–10):** hair down, scar aching; daggers, disarm, throat thrust; kill-and-revive loop; Zaraki's body-length slash → Kaidō → Bankai flood → liquid blades and sphere; Zaraki finally impales her; she passes the title on.
  6. **The first meeting (anime ep 10):** rain, a mountain of bodies, child Zaraki's stab between her collarbones.
  7. **The founding war (TYBW ep 7):** Yachiru among the original captains slaughtering the Quincy.
  8. *Anime-only:* Kidō duel vs Reigai-Unohana (Hyapporankan vs Sajō Sabaku, Hadō #88 vs Dankū).
- **Kit proposal:**
  - **Retsu (sealed)** — *Shift:* graceful short Shunpo. *LMB:* 4-hit elegant nodachi string (long reach); fwd = drawing cut, back = rising cut, air, down-air, sprint = iai dash. *Heavy:* long iai cut. *Q* **Kaidō** (channel on self/ally; reiatsu first then HP; usable while moving) · *E* **hidden daggers** (1–3, fast) · *R* Hadō (high-level, incantation-less; wheel pick) · *F* Bakudō bind (Hyapporankan / Sajō Sabaku, anime) · *Z* **Dankū** (anime) · *X* **diagnosis** (reveals enemy statuses/weak points; spots illusions and decoys). *G:* **unbraid → Yachiru**. *C:* "the smile" — fear aura. *T:* Shikai (summon Minazuki). *V:* **mass triage** — Minazuki swallows up to six allies and flies off healing them. *Tab:* Kidō wheel incl. the anime Bakudō above.
  - **Shikai (Minazuki creature)** — a mount/summon state: Unohana rides, WASD flies the manta, *Q* swallow ally (heal over time inside), *E* regurgitate, *R* resize (puppy ↔ giant), *F* land on legs / take off; Unohana can still cast Kidō and Kaidō from its back. *Hold T:* seal (it melts back into the scabbard).
  - **Yachiru (G state)** — *LMB:* "eight thousand styles": each string cycles a different sword style (iai, two-handed kendō, one-handed flourish, reverse grip…) so the rhythm is never the same; extremely fast; free hand used for parries. *Heavy:* **disarm** (knocks the opponent's weapon away for several seconds). *Q* throat thrust (execution on stagger) · *E* dagger ambush · *R* hand/foot deflect counter · *F* **guard-step** (step on the enemy's sword guard, vault, counter-cut) · *Z* emergency Kaidō on herself · *X* **revive the enemy** (heal a downed opponent to keep the duel going; grants her a stacking "joy of battle" buff). *T:* Bankai.
  - **Bankai** — *T:* drags her fist down the blade; blood pours from the sky and floods the arena. *LMB:* every swing throws liquid slashes, seamless melee/ranged. *Heavy:* vertical bisecting cut. *Q* liquid-slash volley · *E* **blade sphere** · *R* blades drawn from the pool and fired (anime) · *F* regeneration burst (passive regen always on) · *Z* daggers · *X* revive the enemy. *V:* **"All Things' End"** — dash through the mist, single bisecting slash. *Hold T:* seal; if killed, the flood vanishes instantly.
- **AI notes:** Retsu phase is a support/healer: stays behind allies, heals, binds, smiles; never strikes first unless ordered. Alone or at ~60 %: unbraids — relentless melee, daggers, disarms, mocking corrections of the player's technique. Bankai at ~30 % or when the player lands a big hit (canon trigger: Zaraki's body-length slash). Story/boss variant: when the player "dies", she heals them once and continues (Muken loop). Personality: impeccably polite, uses honorifics even for enemies; as Yachiru, delighted and contemptuous; never shows pain.
- **Callouts:** "Minazuki" (Shikai — no command in canon) · "Bankai — Minazuki" (卍解 皆尽) · "Bakudō no rokujūni — Hyapporankan" · "Bakudō no rokujūsan — Sajō Sabaku" · "Bakudō no hachijūichi — Dankū" · (Yachiru intro, short) "Kenpachi".

---

## 6. Byakuya Kuchiki (朽木 白哉) — Captain, 6th Division; 28th head of the Kuchiki Clan

- **Wiki:** https://bleach.fandom.com/wiki/Byakuya_Kuchiki · also `/Anime_Continuity`, Senbonzakura (Zanpakutō spirit), Senka, Utsusemi, Gōkei, Senkei, Shūkei: Hakuteiken, Byakurai, Sōkatsui, Rikujōkōrō, Dankū, Sajō Sabaku, Kuchiki Clan · battles: Renji vs Byakuya, Ichigo vs Byakuya (rematch), Byakuya vs Zommari, Byakuya vs Tsukishima, Byakuya vs Äs Nödt, Gotei 13 & Visored vs Gerard Valkyrie, Byakuya & Ichigo vs Jin Kariya (anime), Byakuya vs Kōga Kuchiki (anime) · TYBW episodes 4 "Kill the Shadow", 5 "Wrath as a Lightning", 19 "The White Haze", 22–23 "Marching Out the Zombies 1–2", 43 "Blood for My Bone", 44 "The Perfect Crimson".
- Lieutenant: Renji Abarai (earlier Ginjirō Shirogane). Adoptive brother of Rukia (his late wife Hisana's sister).
- **Roster tier:** **S** (core). Ichigo's first great rival and one of the most popular characters; the swarm-blade Zanpakutō is the tech showcase (millions of blades carving the world). Ship in the Soul Society wave (vertical-slice candidate as the Sōkyoku Hill boss).
- **Canon power: 8.5/10** — pre-training Bankai of a hundred million blades, Gōkei erased a large building from inside; after the Royal Guard training he defeated three Sternritter at once, and Ikka Senjinka reduced the head of the giant Gerard Valkyrie to dust.
- **Body:** 180 cm, 64 kg → **58 vox** (86). Tall, lean, perfectly upright posture; minimal, economical movement. **Silhouette keys:** long black hair to the shoulders with face-framing locks, held by white **kenseikan** — **three on top of the head and two on the right side**; a long **white scarf** around the neck and shoulders, ends hanging to the knees; **short-sleeved** haori with 六; fingerless white **tekkō** covering the backs of the hands.
- **Palette (hex estimates):**
  - Skin `#F3E1D2` (shade `#D6BDAA`) · hair black `#15161D` with blue-grey highlight `#2F3445` · eyes **slate grey** `#6E7480`
  - Kenseikan, scarf (Ginpaku Kazahana no Usuginu) and tekkō: **manga silver-white** `#EEF0F2` / **anime light green** `#D7E7DA` (scarf shading `#B9C7BD`)
  - Kosode/hakama black `#16161A` · haori white `#F4F3EF`, 六 black, lining (verify) · post-timeskip haori trim and tassels light gold `#D9C27A`
  - Senbonzakura: bronze guard and hilt fittings `#A47B3B`, **lavender** hilt cord `#B9A2D6`, **white** sheath `#F1F1EE`, blade `#D3D8DE`
  - Blade petals: **manga white** `#F7F7FA` / **anime pink** `#F5A9C4` → `#E77FA6`, glints `#FFFFFF`; lilac `#D8B4E2` when wielded by Äs Nödt
  - Senkei swords: glowing pink-white core `#FFD7E8`, rim `#F59AC0` (lose the glow in his hand)
  - Shūkei: Hakuteiken wings, halo and blade pure white `#FFFFFF` with cool fringe `#EAF6FF`
  - Reiatsu **white** `#FFFFFF` (aura can lean pink-white in the anime)
  - Kidō: Byakurai white-blue `#E8F4FF`/`#9CC9FF`; Sōkatsui blue fire `#3FA9FF` (core `#CFEFFF`); Rikujōkōrō yellow rods `#FFE066`; Dankū translucent `#D9F0FF`
  - Ōken clothing (TYBW): white `#F2F0E8`, thick cream hem `#E3D9BE` (verify), tasseled muffler `#D8CFB4` (verify)
- **Look by form/outfit:**
  - **Captain (Soul Society → Fake Karakura):** as above, with kenseikan and scarf. In Bankai his hands are **empty** (the hilt dissolves too; it reforms when he seals).
  - **Post-timeskip (Lost Agent arc):** no kenseikan (new headpieces replace the three on top), no scarf, finely made haori with a **high collar, light-gold edges and small light-gold tassels** at the corners.
  - **TYBW return from the Royal Palace:** **Ōken clothing** woven from the Royal Guard's bones and hair — a white turban-like wrap covering the upper half of his head and trailing to the shoulders, a tasseled muffler over his mouth, a white cape with a thick light hem over the shihakushō (made to survive the friction of crossing the 72 barriers).
  - **Ten years after Yhwach:** three kenseikan on top again, none on the side.
  - **Young Byakuya (≈110 years ago):** hot-headed heir training at the Kuchiki manor; hair tied back with a hair tie (Yoruichi steals it); no kenseikan, no haori.
  - *Anime-only spirit:* **Senbonzakura** (Zanpakutō Rebellion) — tall masked samurai: ornate mask with golden teeth, black lips and fangs, golden side protrusions and a golden three-blossom crest; long dark-brown hair in a white-ribboned ponytail; blue eyes; long light-purple kimono with white stripes; red-gold pauldrons joined by a gold band with red strips; red elbow-length gauntlets and greaves. Can raise the giant Bankai blades around himself as an instant shield.
- **Weapons:**
  - **Sealed:** a standard katana (~1 m) — bronze guard shaped like an **open four-pane window frame**, bronze fittings, lavender-corded hilt, white sheath.
  - **Shikai:** the blade disperses into ~1,000 tiny slender blades that glitter like cherry petals; he keeps the bladeless hilt and steers them by swinging it.
  - **Bankai:** he lets the sword drop straight down; it sinks into the ground **as if into water** (ripple), the landscape darkens, **two rows of a thousand giant blades** rise to his left and right, then shatter into innumerable petals (100 million pre-training, far more after). Steered mentally — **twice as fast when guided by hand gestures**.
  - **Senkei swords:** a thousand glowing swords (four rotating rows; after training six rows plus two more sets of six) that become copies of his sealed katana when called to his hand. **Hakuteiken:** one white sword.
- **Forms & states (ordered):**
  1. **Sealed** — Zanjutsu, Shunpo arts (Senka, Utsusemi), Kidō.
  2. **Shikai: Senbonzakura (千本桜, "thousand cherry blossoms")** — "Chire" (散れ, "scatter").
  3. **Bankai: Senbonzakura Kageyoshi (千本桜景厳, "vibrant display of a thousand cherry blossoms")** — "Bankai" + drop the blade (he rarely voices "chire").
  4. **Bankai scenes (景):** Gōkei → **Senkei** (costs his blood; offense only; arena) → **Ikka Senjinka** (Senkei's all-out launch) / **Shūkei: Hakuteiken** (Senkei condensed into one sword).
  - **TYBW upgrade (post-Royal Guard):** Shikai power on par with his old Bankai (Äs Nödt mistook it for Bankai); Senkei with far more swords, launched all at once.
- **Abilities (complete):**
  - *Sealed / racial*
    - `Zanjutsu master` — strikes vital points too fast to see; deflects reishi thorns and pistol-shot Heilig Pfeil with the sealed sword; bisected Zommari before he noticed. [MeleeArc `cut`, Slice, NEW: DelayedHit]
    - `Senka (閃花, "flash blossom")` — Shunpo to the opponent's back and two lightning strikes that seal the **Saketsu and Hakusui** (the soul's reiryoku organs), cutting off their spiritual power; so fast that victims can't tell front from back. His preferred finisher (used on Ichigo in Karakura). [Teleport, MeleeArc, Status: reiatsu sealed]
    - `Utsusemi (空蝉, "cicada shell") — Way of Onmitsu, 3rd of the Shihō` — dodge leaving an afterimage so convincing it seems to be hit (taught by Yoruichi — he dislikes using her techniques). [Afterimage/Clone]
    - `Shunpo master` — raced Yoruichi; outpaced Zommari's Sonído; still flash-stepped with severed leg tendons; carried Rukia and Renji to safety under his arms. [Teleport, Mobility]
    - `Kidō master (incantation-less)` — **Hadō #4 Byakurai** (white lightning from a fingertip; pierced Ichigo's shoulder), **Hadō #33 Sōkatsui** (blue fire blast; disrupted Renji's Bankai, blasted Yammy), **Bakudō #61 Rikujōkōrō** (six rods of light pinning Renji, and possessed Rukia), **Bakudō #81 Dankū** (wall stopping spells up to #89; used to cancel Zommari's control), **Hadō #1 Shō** (pushed Rukia free of ice), and a barrier raised in seconds to shield allies from Gōkei's shockwave. *Anime:* trades Kidō with Kariya and Kōga. **Sajō Sabaku is not documented for Byakuya** on the wiki (his Reigai and Unohana use it) — keep it in his Tab wheel only as a generic option. [Beam (`bore`), Blast, Bind, Shield, Construct]
    - `Hakuda` — when his sword was hijacked he fought off Hisagi's two blades bare-handed and dropped Hisagi with a hilt strike; *anime:* blocks his own hijacked sword with his left hand. [MeleeArc]
    - `Ruthless problem-solving` — severs his own leg/hand tendons to stop Zommari's Amor; lets his own Bankai shred his left arm while secretly catching a fistful of blades, then drives them through Tsukishima's chest; discards his hijacked Zanpakutō (regretting he didn't break it). [Grab/Throw (self-damage), NEW: Disarm]
    - `Resilience` — survived Gin's thrust taken for Rukia, Äs Nödt tearing his stomach out with his own Bankai, Gerard's shield blow that collapsed a building; outlasted everyone in Kirinji's healing spring. [passive]
  - *Shikai — Senbonzakura*
    - `Petal storm` — swing the hilt and the blades shred at range, raze structures and pierce most defenses; can **dig a shaft so deep** under an enemy that they need ages to climb out (Mask De Masculine; TYBW anime ep 4 shows him collapsing the ground under Mask on purpose); can swirl around a hand or limb as a "don't move" threat. [Swarm, `cut`, Environmental (excavate), Bind]
    - `Petal defense` — walls that stop blows, parry swordsmen and erase energy projectiles (Äs Nödt's thorns); swirl around himself; after training, **full enclosure** that survived the cataclysmic shockwave of the closing portal to the Soul King Palace. [Shield, Swarm]
    - `Hurtless Area (無傷圏, Mushōken)` — blades never enter an 85 cm radius around him unless he allows it; he can let them in for close defense, but any timing slip cuts him. [NEW: ExclusionRadius]
    - `TYBW Shikai` — vastly greater mass and force: **huge conic constructs** of blades obliterate a multidirectional swarm (Äs's eyes); single passes knock out NaNaNa and Candice; cut open the dome of Äs's Vollständig (Tatarforas) from outside. [Construct, Swarm, Slice]
  - *Bankai — Senbonzakura Kageyoshi*
    - `Elementary form` — torrents of petals in huge waves, used for attack and defense at the same time; full-enclosure dome vs a Bankai release shockwave; after training, simply submerging Robert Accutrone (Sklaverei-boosted Vollständig) in the wave put him down, it finished the regular-size Gerard and repelled the titanic Gerard's strike. Hand-guided = double speed (he resorted to it when Ichigo outpaced him). [Swarm, Shield, GroundWave-like flood, NEW: SwarmFormations]
    - `Senkei-like swords (unnamed)` — a few glowing swords formed in the elementary Bankai; impaled Renji's arm and hovered eight more at his throat. [Projectile, Construct]
    - `Gōkei (吭景, "throat scene")` — the petals form a sphere around the target, attack from every angle with no blind spot, then the whole sphere collapses inward; destroyed a large building from the inside out; the shockwave forced Byakuya himself to flash away. [Swarm, Bind, Blast, Construct (sphere)]
    - `Senkei (殲景, "slaughter scene")` — the true form of Senbonzakura, **requires his blood**: the petals condense into a thousand glowing swords in four rotating rows (TYBW: six rows plus two more sets of six, the outer set counter-rotating) enclosing him and his foe — neither can go far. Gives up all defense. He calls swords into his hand one at a time for melee (they stop glowing and become his sealed katana); each hits far harder than loose petals. Can be built around a giant target (Gerard). [Construct (blade rings), NEW: ArenaLock, Stance]
    - `Ikka Senjinka (一咬 千刃花, "single bite, flower of a thousand blades")` — Senkei's ultimate: he raises his left hand, every sword turns toward the target and they fly in unison like a barrage of pink lights from all sides, pulverizing it in waves; reduced Godly-sized Gerard's head to dust. [Projectile multishot (homing), Blast]
    - `Shūkei: Hakuteiken (終景・白帝剣, "end scene: white emperor sword")` — every Senkei sword condenses into one; colossal reiatsu bursts out as huge pure-white **wings** and a tall vertical **halo** on his back, with energy flowing from the wings around to the front of his waist — like a giant bird of light; the blade shines white. One decisive clash. *Anime-only:* also used to defeat Kōga Kuchiki (shown again in TYBW ep 5 flashbacks). [Stance, MeleeArc, Slice, Transform (VFX)]
- **TYBW anime additions (episodes 4, 5, 19, 22–23, 43–44):** deliberately caves in the ground under Mask De Masculine; swirls petals around himself to annihilate reishi thorns, then fires a stream at Äs's head (blocked by Blut Vene); Äs uses the stolen Bankai with dozens of giant blades rising around him; flashback to Hakuteiken vs Kōga; cuts open the eye-dome *behind Rukia*; **animates his off-screen manga fight vs NaNaNa, Candice and Robert** (NaNaNa's Morphine Pattern finds no openings in his reiatsu; Shikai swallows NaNaNa; Candice runs out of charge; Robert's Sklaverei Grimaniel shot is cut by the Bankai wave that consumes him); blocks his own hijacked blade with his left hand and shrugs off PePe's Love Kiss; Byakuya and Hitsugaya receive mirrored stomach wounds when their attacks chip Gerard's sword Hoffnung.
- **Passives & weaknesses:** release can be **stopped before the blade scatters** (Yoruichi wrapped it in cloth; Renji struck it); strong concussive blasts can **disperse** the petals (Getsuga Tenshō); the Hurtless Area is the exploit (get close); Bankai theft (Äs); a hijacked Zanpakutō turns his own petals on him (PePe).
- **Signature moments to recreate:**
  1. **Karakura, night:** arrives to retrieve Rukia, cuts Ichigo's sword, Senka — Ichigo's spiritual power sealed.
  2. **Shishinrō bridge:** shreds Ganju; Ichigo arrives; Yoruichi wraps his release; Shunpo chase over the rooftops.
  3. **Vs Renji:** Senka blocked, release blocked, Hihiō Zabimaru; Sōkatsui → Rikujōkōrō → Bankai; leaves his scarf on the fallen Renji.
  4. **Sōkyoku Hill vs Ichigo:** Shikai vs Getsuga; Bankai; hand-guided petals; Ichigo's speed; Senkei; Byakurai; the Hollow surge; **Hakuteiken vs Getsuga** final clash.
  5. **Takes Gin's Shinsō for Rukia.**
  6. **Las Noches vs Zommari:** Utsusemi, severing his own tendons, Rikujōkōrō on possessed Rukia, Bankai, Gōkei vs El Embrión, Dankū vs Amor.
  7. **Hueco Mundo with Kenpachi vs Yammy** (bickering tag-team).
  8. **Lost Agent vs Tsukishima:** Hurtless Area exploited, sword cut in half → drops the broken pieces for Bankai, catches blades in his palm.
  9. **TYBW:** Bankai stolen by Äs Nödt → his own petals shred him; **return in Ōken clothing**: cuts the Tatarforas dome, cones of blades, hands the kill to Rukia; three Sternritter at once (anime); PePe and hijacked Senbonzakura; Wahrwelt — Senkei around the giant Gerard → **Ikka Senjinka**.
  10. *Anime-only:* vs Kōga (Senkei + Hakuteiken with his Zanpakutō spirit's help); vs Jin Kariya (both caught in a tornado of petals); vs Reigai-Hitsugaya (Gōkei) and Reigai-Byakuya.
- **Kit proposal:**
  - **Sealed** — *Shift:* master Shunpo (long, silent); double-tap with lock-on = appear behind (feeds Senka). *LMB:* 4–5-hit precise, minimal-motion katana string; fwd = thrust, back = rising cut, air, down-air = plunging cut, sprint = iai dash. *Heavy:* **clean bifurcation** (delayed split, Slice through target and wall). *Q* **Senka** (behind + two strikes → "reiryoku sealed": abilities locked a few seconds) · *E* **Utsusemi** · *R* **Byakurai** (finger beam, bore) · *F* **Sōkatsui** (blue fire blast/wave) · *Z* **Rikujōkōrō** (six-rod pin) · *X* **Dankū** (barrier wall). *G:* "stillness" stance — stands motionless; melee entering his reach triggers an automatic counter-cut (design choice matching his AI identity). *C:* white reiatsu flare (onlookers sweat, weak foes kneel). *T:* Shikai. *V:* **Senka execution**. *Tab:* Shō, quick ally-barrier, shared captain wheel (Sajō Sabaku as a generic entry).
  - **Shikai** — *LMB:* hilt swings send petal streams (20–30 m, thin `cut`); fwd = petal lance, back = upward swirl launcher, air = petal rain, down-air = petal drill into the ground, sprint = petal wake. *Heavy:* dense **torrent** that tunnels and strips walls. *Q* **petal wall** · *E* **pitfall** (bores a deep shaft under the target) · *R* **conic constructs** (TYBW: cones of blades erase swarms and volleys) · *F* **cocoon** (full enclosure vs shockwaves) · *Z* **limb lock** (petals swirl around a hand/limb; moving it shreds it) · *X* Kidō quick-cast (he mixes Kidō with Shikai). *G:* **Hurtless Area override** (blades allowed within 85 cm: close defense, risk of self-hits on hitstun). *T:* Bankai. *V:* **TYBW torrent** — a Shikai flood so big enemies mistake it for Bankai.
  - **Bankai** — *T:* drops the sword → ground ripple → the world darkens → two rows of a thousand giant blades rise → they shatter into the petal ocean; hands now empty. *LMB:* gesture-directed waves (each click a hand motion; camera-relative). *Heavy:* **grand wave** that flattens a city block. *Q* **Gōkei** (sphere → collapse → shockwave; auto-Shunpo out) · *E* **fortress** (full dome) · *R* **Senkei** (costs HP/blood; rings of swords enclose him and the target as an arena; LMB then draws a fresh sword per strike, stronger melee) · *F* **Ikka Senjinka** (inside Senkei: left hand raised, every sword fires) · *Z* **palm catch** (take a hit from his own petals, then thrust the caught blades point-blank — Tsukishima trick) · *X* **glowing swords** (a few Senkei-like swords hurled to impale/pin). *G:* **hand-guided ↔ mental control** (hand-guided = 2× swarm speed but no sword-hand actions). *C:* petal flare (the swarm explodes outward). *V:* **Shūkei: Hakuteiken** (from Senkei: one white sword, wings and halo, a single overwhelming slash). *Hold T:* reseal (the sword reforms in his hand).
- **AI notes:** "noble stillness — the petals do the work": barely moves, walks, lets the player come; Senka finishes opponents who over-commit. ~70 %: "Chire" — walls and streams from a distance. ~45 %: drops the sword; Gōkei on stationary or cornered targets. ~20 %, or if the player releases a Bankai: cuts his palm → Senkei and a sword duel; the final exchange is a Hakuteiken clash (beam-struggle-style showdown). Tells: lifts his hand before a wave, lets the blade fall before Bankai, blood on his hand before Senkei. Calm, formal, addresses opponents by full name; being called by his given name without an honorific annoys him (taunt hook); rarely uses Utsusemi (he hates using Yoruichi's tricks).
- **Callouts:** "Chire — Senbonzakura" (散れ 千本桜) · "Bankai — Senbonzakura Kageyoshi" (卍解 千本桜景厳) · "Gōkei" · "Senkei — Senbonzakura Kageyoshi" · "Ikka Senjinka" · "Shūkei: Hakuteiken" · "Hadō no yon — Byakurai" · "Hadō no sanjūsan — Sōkatsui" · "Bakudō no rokujūichi — Rikujōkōrō" · "Bakudō no hachijūichi — Dankū" · "Senka".

---

## 7. Engine needs beyond the brief's primitive list

| Tag | What it needs | Used by |
|---|---|---|
| `NEW: EraseCarve` | A carve mode that **deletes** voxels/body parts with no debris and a glowing cut rim (not `smash`, not `absorb`); ignores defense thresholds (Blut Vene, Hierro, shields) | Yamamoto (Kyokujitsujin, West contact) |
| `NEW: GlobalWeatherState` | Map-wide state machine: firestorm sky → cloud burn-off → total evaporation (water voxels removed, ice melted, freeze abilities disabled, dehydration DoT) → **rain** when the Bankai ends; plus a Bankai clock that damages the caster and auto-ignites the map | Yamamoto |
| `NEW: GlobalFireRecall` | Query every burning voxel/fire particle on the map and stream it into the blade, extinguishing everything | Yamamoto (Bankai release) |
| `NEW: MoltenMaterial` | Heat transforms ground into molten voxels (feet sink, lava pools, cooling) | Yamamoto (West, C flare) |
| `NEW: ContactDamageAura` | Body aura that destroys melee weapons/projectiles on contact and makes grabs impossible | Yamamoto (West), Suì-Fēng's Shunkō barrier (lighter version) |
| `NEW: AllySafeFire` | Fire/area effects with a per-faction filter and intensity setting (non-lethal "toast" ↔ ash) | Yamamoto |
| `NEW: FormIndependentConstructs` | Constructs that survive the caster's form change/reseal (owner-tagged, own expiry) | Yamamoto (Jōkaku Enjō) |
| `NEW: DeferredTrap` | Place a dormant ability volume now, trigger it later (from any form) | Yamamoto (Ennetsu Jigoku) |
| `NEW: ArenaLock` | Ring/sphere constructs that confine both fighters to a volume | Yamamoto (Jōkaku Enjō), Byakuya (Senkei) |
| `NEW: KillRegistrySummon` | Per-match registry of who died to whose fire; resummon them as burning skeleton minions, or one specific victim with its original look + fear on related characters (needs a small relationship table) | Yamamoto (Minami) |
| `NEW: DelayedHit` | Cut whose damage/split resolves after a delay ("he only noticed afterwards") | Yamamoto (Nadegiri), Byakuya (bifurcation) |
| `NEW: LimbSever` | Persistent dismemberment: one-armed model/animation set (self-inflicted via Ittō Kasō or enemy-inflicted), plus tearing limbs off enemies | Yamamoto, Suì-Fēng (left arm), Gin (right arm) |
| `NEW: ShatterKill` / `NEW: AshDeath` | Kill presentations: body breaks into voxel chunks; body flays to skeleton then crumbles to ash | Yamamoto |
| `NEW: AbilitySeal` | A status that disables a character's elemental output and stores it for later release | Yamamoto vs Wonderweiss |
| `NEW: OutfitStates` | Clothing state swaps mid-fight: haori dropped/lost, top stripped, Keisen back blown open by Shunkō, braid undone, Ōken cape | all five |
| `NEW: SurfaceMarkHitTest` | Store a mark at a **local surface point** on a hit part (bone-space), test later hits against it within a radius; SPL comparison can cancel it | Suì-Fēng (Hōmonka) |
| `NEW: TetherAnchor` | Physics tether from the character to a structure/ally to absorb recoil; can snap; no anchor = flung back | Suì-Fēng (Ginjōtan) |
| `NEW: ADSOverlay` | Aim-down-sights camera with a mask/slit overlay and homing lock | Suì-Fēng (Bankai) |
| `NEW: Execution` | Sneak-attack hold (blade at throat) that binds a target until released or broken | Suì-Fēng |
| `NEW: ExtendableBlade` | Kinematic blade whose length animates from ~0.5 m to 50 m (Shikai) or kilometres (Bankai) in a few frames; sweeps carve along the whole length; retract follows a bending spline; can be fired out of a sleeve without a draw animation | Gin |
| `NEW: RemoteTriggerStatus` | Implanted fragment status with expiry that the caster detonates on command (dissolve-from-inside VFX + voxel hole) | Gin (Korose) |
| `NEW: FormDisguise` | A form that reports a different form to the HUD and AI | Gin (Bankai) |
| `NEW: Mount` / `NEW: CarryInside` | Rideable flying summon; summon that stores allies inside and heals them | Unohana (Minazuki Shikai) |
| `NEW: LiquidFloorSource` | A liquid layer flooding the arena that the caster draws projectiles/blades from (blood-red Bankai fluid; vanishes instantly on caster's death) | Unohana (Bankai) |
| `NEW: MovesetShuffle` | Light-attack strings that rotate between several style libraries | Unohana (Yachiru) |
| `NEW: Disarm` | Knock an opponent's weapon out of their hand into the world as a pickup; weapons can be discarded/hijacked and picked up by others | Unohana, Byakuya (PePe/Hisagi episode) |
| `NEW: SwarmFormations` | GPU swarm of up to millions of blade particles with authored formations (stream, wave, wall, dome, sphere-collapse, cones, rotating sword rings), hand-gesture steering with a speed multiplier, and voxel carving | Byakuya |
| `NEW: ExclusionRadius` | A no-go radius around the caster for his own swarm (85 cm), toggleable, with self-damage risk when disabled | Byakuya (Hurtless Area) |
| `NEW: AmbientOverride` | Release cinematics that darken the scene, ripple solid ground like water, and grow giant blade rows from it | Byakuya (Bankai release) |

Already covered but worth stressing: **Status: Bankai theft** with Hollowfied return (all three Bankai stolen in TYBW), **SPL-based reiatsu crush** (Yamamoto's glare, Gin's stare), **Heal/Reject targeting enemies** (Unohana reviving Zaraki), and **beam struggles** (Hakuteiken vs Getsuga).

---

## 8. Gaps, uncertainties, things not found

- **Haori linings:** the wiki says every captain's lining color differs but documents none; sleeve style for Gin and Unohana marked (verify).
- **Reiatsu colors:** canon states Byakuya = white, Gin = violet, Yamamoto = fiery red; nothing for Suì-Fēng or Unohana (suggestions given).
- **Minazuki:** Shikai release command and transformation never shown; whether the Bankai fluid corrodes flesh (Zaraki's "I'm melting") is unconfirmed.
- **Kamishini no Yari:** Gin admitted the 13 km / 500 × Mach figures were lies; true values unknown.
- **Kidō shown:** Yamamoto — only Ittō Kasō and an unnamed knockout spell in canon (Dankū, barriers: anime); Suì-Fēng — an unnamed binding spell only (knives, "Hankisōsai": anime, mechanics unclear); Unohana — Kaidō in canon, named Bakudō anime-only; Byakuya — Sajō Sabaku is **not** listed for him.
- **Young Yamamoto / founding-era Yachiru:** the wiki describes young Yamamoto's hair, scar and sleeveless haori, but not whether he carried the cane; Yachiru's founding-era outfit (and whether her haori read 十一) is not described — check TYBW ep 6–7 flashbacks.
- **Gin as a child:** no height given (estimate only).
- **Hōmonka color/edge detail, Suzumebachi sheath, Minazuki tsuba/sheath, Shinsō sheath and tsuba metal color:** not specified in the sources (verify).
- **Post-timeskip Byakuya headpieces:** described only as "new headpieces" replacing the kenseikan.
