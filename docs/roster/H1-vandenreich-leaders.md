# Roster H1 — Yhwach & the Schutzstaffel

Covers **Yhwach**, **Jugram Haschwalth** and the Schutzstaffel members **Gerard Valkyrie**, **Lille Barro**, **Pernida Parnkgjas** and **Askin Nakk Le Vaar**. Uryū Ishida (the fifth Schutzstaffel, Schrift "A: Antithesis") belongs to roster group A2 and only appears here as a counter.

**Sources.** Bleach Wiki (bleach.fandom.com) character, technique, battle and episode pages, fetched 2026-10-06. I checked each claim against the page's citation templates (manga chapter or anime episode) to separate manga canon from anime additions. Everything below is paraphrased.

**Conventions**
- Canon tags: **(M)** manga canon · **(A)** anime-only addition. Mostly from TYBW Part 4 *The Calamity* (eps. 407–414 on the wiki at time of writing); a few are from Parts 2–3 (eps. 380–406) · **(G)** video-game-only (Brave Souls / Rebirth of Souls) · **(N)** novel (*Can't Fear Your Own World*). Untagged means manga canon that the anime also adapts.
- `chNNN` = manga chapter, `epNNN` = overall anime episode number (TYBW ep. 1 = 367).
- Scale: 32 character voxels per metre (**vox**). Giant sizes marked *(est.)* are my estimates from panels and scenes, not stated figures.
- Hex colours are estimates from the anime's palette (the manga is black and white). Anything the sources don't describe is marked *(est.)* or *(unverified)*.
- Engine tags use the brief's primitives in `[brackets]`. Anything a kit needs that is **not** in the brief's list is tagged `[NEW:…]` and specified in **Appendix A**.

### Roster at a glance
| Character | Letter / Schrift | Vollständig | Tier | Power | Height → vox | Playable forms |
|---|---|---|---|---|---|---|
| Yhwach | A — The Almighty (全知全能) | none (Soul King form instead) | **S** | 10 | 200 cm → 64 | Emperor → The Almighty → Soul King (+ boss-only King of the Three Worlds, A) |
| Jugram Haschwalth | B — The Balance (世界調和) | none (anime: **hAschwAlth**) | **A** | 8 (9 at night) | 189 cm → 60 | Day (The Balance) → Night (borrowed The Almighty) → hAschwAlth (A) |
| Gerard Valkyrie | M — The Miracle (奇跡, honorary) | **Aschtonig** (神の権能) | **A** | 9 | 222 cm → 71 (Godly Size ≈ 20–150 m *(est.)*) | Human → Godly Size → Aschtonig → Enhanced Aschtonig |
| Lille Barro | X — The X-Axis (万物貫通) | **Jilliel** (神の裁き) | **A** | 9 | 182 cm → 58 | Sniper → Eye-open → Jilliel → True Form (→ remnant swarm) |
| Pernida Parnkgjas | C — The Compulsory (強制執行, honorary) | unnamed (anime: halo + hand-wings) | **B** | 8.5 | 150 cm → 48 (giant hand/arm ≈ 8–60 m *(est.)*) | Cloaked → Left Hand/Arm → Gargantuan (+ clones) |
| Askin Nakk Le Vaar | D — The Deathdealing (致死量) | **Hasshein** (神の毒見) | **B** | 8 | 187 cm → 60 | Base → Hasshein |

---

## Shared Vandenreich systems (used by every dossier below)

### S1. Quincy baseline (all six characters)
- **Reishi absorption.** Quincy build weapons from ambient Reishi and are stronger where Reishi is dense (Soul Society, Hueco Mundo, the Royal Realm). In-game, every Quincy passively pulls loose voxels and debris in a small radius to refill their meter, and actively with hold-C. Voxels shrink into blue motes that stream into the hand. `[Environmental absorb]`
- **Hirenkyaku** (飛廉脚, "Pure Flying Step"). High-speed movement riding a Reishi flow under the feet. More energy-efficient than Shunpo or Sonído. This is the Quincy **Shift**. Quincy can also stand on condensed Reishi in mid-air (Space). `[Mobility]`
- **Heilig Bogen / Heilig Pfeil** (神聖弓 / 神聖滅矢, "Sacred Bow / Sacred Destruction Arrows"). Spirit weapons. Each character's bow is customised (rifle, longbow, finger-bow, giant bow). `[Projectile]`
- **Blut** (血装, "Blood Guise"). Reishi pumped through the blood vessels. Two independent systems that **cannot run at the same time**:
  - **Blut Vene** (静血装, "Stilled Blood Guise"): defence. A faint **blue** vein web (#4C9BFF) flashes only where the body is struck. At full conscious power it can null a Bankai hit. It can also shield the eyes and stop heavy bleeding (Askin's last stand). `[Stance]`
  - **Blut Arterie** (動血装, "Moving Blood Guise"): offence. Red vein web (#D5232F) along the striking limb. It is what lets a Quincy's non-Schrift attacks hurt Bankai users. `[Stance]`
  - Game: **G toggles Vene ↔ Arterie**. Switching takes a 0.25 s "re-route" during which neither is active.
- **Quincy: Vollständig** (滅却師完聖体). The angelic final form: a **Heiligenschein** (光輪, star-shaped halo) and **Heiligen Fliegen** (光翼, Reishi wings). It amplifies the Schrift and unlocks new techniques. Rules the engine must enforce:
  1. Activation fires a **pillar of light ending in a Quincy Zeichen**, with church bells in the anime. The pillar destroys anything the user is encased in (escape from cages and ice). `[Transform][Blast]`
  2. **Sklaverei** (聖隷, "Holy Slave"): with the halo up, the user tears Reishi out of structures, terrain, abilities and even living souls to fuel themselves and heal small wounds. Voxel structures in range dissolve into the halo. `[Environmental absorb][Absorb]`
  3. **Halo = weak point.** Destroying the Heiligenschein ends the form's powers. For Lille it ends his phasing and regeneration.
  4. **A stolen Bankai locks out Vollständig** (see S2).
  5. **Being drained by Auswählen locks out Vollständig**, even if the light column missed (see S3).
- **Shadow** (影, *Kage*; the Quincy hideout is the *Schatten Bereich* 影の領域). A portal through a shadow. It is Yhwach's power, which he shares with his followers. Needs an existing shadow at both ends, so it cannot be used in a room with no shadows. Large ones take the shape of a Quincy cross. Engine: query the shadow map at source and destination before allowing the portal. `[Teleport][NEW:ShadowGate]`
- **Hollow poison.** Hollow Reiatsu decays Quincy souls. Quincy take bonus damage and a decay DoT from Hollow-type attacks. Exceptions: Yhwach after absorbing the Soul King, and Uryū (resistant).
- **Wandenreich time limit (story rule).** Outside the Schatten Bereich the Wandenreich can only operate for a limited time. When it runs out, **shadows start dripping off their bodies** and they are pulled home (ch514).
- **Wahrwelt rule.** After absorbing the Soul King, Yhwach controls all ambient Reishi in the Royal Realm. **Only Quincy can make air footholds there**; Shinigami and Arrancar lose air-step and Shunpo footing (ch628). Global movement modifier: `[Field][NEW:WorldRule]`.

### S2. Medallion — universal Bankai theft (メダリオン, *Medarion*)
Every Sternritter (and Yhwach) carries one. It is a mechanical form of Yhwach's **Sankt Altar** technique.
- **Model.** A thin metal disc about palm size (≈ 9 cm = 3 vox) with the Wandenreich insignia etched on it. Gunmetal #3A3D44 with the emblem engraved in a lighter steel #8E949E *(est.)*.
- **Trigger.** Usable when a Shinigami **with an active Bankai** is within ≈ 30 m and in line of sight. A context prompt appears (*Tab wheel → Medallion*, or the default "use item" key). Steals **one** released Bankai per use.
- **Sequence (≈ 1.4 s).**
  - 0.0 s: the thief holds the medallion up and the emblem glows.
  - 0.2 s: **five streams of dark energy** (near-black indigo #1D1426 with violet edges #6A4BA8) lance out and wrap the Bankai: the weapon plus its constructs (petals, ice wings, giant armour and so on).
  - 0.6 s: the Bankai **disintegrates into motes**. Treat it as a voxel-dissolve of the weapon mesh.
  - 1.0 s: the motes swirl into a **ring** that collapses back into the disc.
  - Asguiaro Ebern's variant needs a long German incantation and makes a star of dark energy that shoots columns of light at the target.
- **Victim.** Forced back to sealed or Shikai state. **T (release to Bankai) is locked** and the Zanpakutō spirit falls silent. Status `Bankai Stolen` `[Status: Bankai theft]`.
- **Thief.** The medallion stores the victim's **Bankai as a data object**: moveset, VFX, constructs, voice lines. The thief gains it as an extra form (T or Tab). In canon the thieves manifest the stolen Bankai's actual look (Cang Du grows Hitsugaya's ice wings; Äs Nödt wields Senbonzakura Kageyoshi). `[NEW:AbilityTransfer]`
  - **Potency** starts reduced (≈ 70 %). A per-Bankai **mastery meter** raises it with use (Yamamoto: thieves are weaker unless they train with it).
  - **Power gate.** If the thief's power rating is below the Bankai's, control fails with recoil. Yhwach reserved Zanka no Tachi for himself because nobody else could hold it.
  - **Vollständig is locked while a stolen Bankai is held**, even when it isn't in use. Dropping the Bankai unlocks it.
  - The stolen Bankai keeps working even after its owner dies.
- **Immunities and counters.**
  1. **Hollowfied Bankai** (Urahara's Shin'eiyaku pill, or Ichigo's naturally Hollow-fused Bankai) cannot be stolen. If it is already stolen and becomes Hollowfied, it turns into **poison**: the thief takes a decay DoT, their body functions are impaired, and the Bankai **flies back to its owner**.
  2. **Arrancar Resurrección cannot be stolen** (Hollow power poisons Quincy).
  3. Story rule: the Sternritter who took a captain's Bankai is ordered to kill that captain. Flag the matching NPC as their "assigned prey".
- **Other use (Yhwach).** The medallion is a harmless object, so barrier cages let it through. Throwing it out of a cage lets Uryū's Antithesis **swap it with Yhwach** (Cage of Life escape, ch605). Make it a throwable "swap token".

### S3. Auswählen as a world event (聖別, "Holy Selection")
Yhwach's power-reclaiming technique works on every Quincy-tagged entity, including allies, so it is a cross-roster system:
- **Targets.** "Impure" or "unnecessary" Quincy chosen by Yhwach, or a single named Quincy. Victims are drained oldest and weakest first. Weak victims die with their **flesh stripped to bare bones**. Strong ones survive powerless. Quincy who dodge the light still **lose Vollständig**. It can even hit Soul King parts that identify as Quincy (Gerard; Mimihagi in the anime).
- **Still Silver** (静止の銀, "Silver of Stillness"). Victims who die keep a **clot of silver in the heart**. Spawn a "Still Silver" pickup on their corpse. If Still Silver touches **Yhwach's blood**, all his powers shut off briefly, The Almighty included. This is the only canon way to open him up (Uryū's silver arrowhead, ch684). `[Status]`
- **Redistribution.** The stolen power heals and restores Yhwach, or revives and empowers chosen Quincy. Revived Schutzstaffel come back with a **partial Vollständig**. The canon visuals for that differ between manga and anime; see each dossier.
- **Cannot be blocked by Reishi barriers**, because it moves pure energy. Kirio Hikifune's Cage of Life failed to stop it.

### S4. Day/Night power swap (Yhwach ↔ Haschwalth)
While Yhwach sleeps at night, **The Almighty passes to Haschwalth** and Yhwach holds The Balance, which he can't use because he's asleep. At dawn they swap back. Yhwach sinks into a shadow and Haschwalth rises out of it to take his place. After absorbing the Soul King, Yhwach can stay awake at night, but the swap still happens. Engine: tie both kits to the world clock `[NEW:DayNight]`. Modes can disable this for PvP.

### S5. Common outfit element: the Schutzstaffel "Hooded Coat" (フーデッドコート)
A white, ankle-length, sleeveless cloak with a hood. It closes at the front with **three buttons** shaped like the Wandenreich insignia and has a **large Hagal rune on the left side**. Most pages say **dark red** (#6D111A); the Wandenreich uniform page says black. Make it a material swap. The members take it off to fight. The **Hagal rune** (Armanen "Hagal", ᛡ) is a vertical stroke crossed by an X, like a six-armed asterisk with no horizontal bar. Yhwach's Wahrwelt throne and the pillars of Sankt Zwinger also use this shape.
- **Insignia note.** The modern Wandenreich emblem is a variant of the five-pointed Quincy Zeichen. **1,000 years ago (Lichtreich) it had only three points**, with a tick mark between each pair. Lichtreich-era flashback costumes must use the 3-point version.

---

## Yhwach (ユーハバッハ) — Quincy King, Emperor of the Wandenreich, usurper of the Soul King
- **Wiki:** https://bleach.fandom.com/wiki/Yhwach. Technique pages: [The Almighty](https://bleach.fandom.com/wiki/The_Almighty), [Auswählen](https://bleach.fandom.com/wiki/Ausw%C3%A4hlen), [Sankt Altar](https://bleach.fandom.com/wiki/Sankt_Altar), [Medallion](https://bleach.fandom.com/wiki/Medallion), [Black](https://bleach.fandom.com/wiki/Black), [Kirchenlied: Sankt Zwinger](https://bleach.fandom.com/wiki/Kirchenlied:_Sankt_Zwinger), [Qual Kreis](https://bleach.fandom.com/wiki/Qual_Kreis), [Blut Vene Anhaben](https://bleach.fandom.com/wiki/Blut_Vene_Anhaben). Battles: vs Yamamoto, vs Ichigo (×3), vs Ichibe'e, Fall of the Soul King.
- **Roster tier:** **S.** Final boss of the game and a playable "god-tier" character. Three playable forms plus a boss-only fourth.
- **Canon power: 10.** The strongest being in the series.
  - Stole Yamamoto's Bankai and cut him in half.
  - Killed Ichibe'e after nullifying Futen Taisatsuryō, then killed and absorbed the Soul King.
  - Broke Ichigo's true Bankai "in the future" and rewrote his own death.
  - Only fell to a stack of counters: Aizen's illusion, a Still Silver arrow, Tsukishima's past-editing, and Ichigo's hidden original blade.
- **Body:** 200 cm → **64 vox**.
  - Tall, broad-shouldered, upright and regal. Long face, broad chin, pronounced cheekbones, thin eyebrows.
  - **Straight black hair to the lower back** (≈ 26 vox long, falling as one curtain).
  - Well-kept **mutton chops joined to a moustache**. Chin clean-shaven.
  - Silhouette keys: ankle-length **tattered cloak** flaring off broad shoulders, big lapels and cuffs, hair curtain, and an idle with **one hand on the hip** and a faint smile.
  - Lichtreich-era self (1,000 years ago): softer, younger face; **shoulder-length** hair; stubble instead of mutton chops. Ōetsu notes that Ichigo's "old man Zangetsu" spirit looks like this Yhwach, and the spirit's Bankai form (young Zangetsu) looks like teenage Yhwach. Share base meshes.
- **Palette (hex estimates):**
  - **Skin & hair:** skin #E2C6AE, shadow #B99880. Hair, chops and moustache #141217 with sheen #2B2731.
  - **Eyes:**
    - Normal: reddish-brown iris #7A2A22, sclera #F1ECE4.
    - The Almighty: crimson irises #B5121B, splitting to 2 then **3 iris/pupil sets per eye**.
    - Final form: the **left eye inverts** (black sclera #0A0A0C, pale iris #E8E2D6) *(colour split est.)*.
  - **Clothing:**
    - Uniform white #EEEDE7, shade #C7C9CF, crease #9EA2AA. Buttons silver #C9CCD2 *(est.)*. Front emblem dark #1B1D24 *(unverified)*.
    - Boots: white-grey #E4E3DC with dark sole #5A5A60 *(unverified; could be dark leather)*.
    - Cloak (1st invasion): maroon-black #2A1518, highlight #45222A, lining #1A0E10. Neck ribbon red #A3141E. Large button #3A3236 *(est.)*.
    - Cloak (2nd invasion): white #ECEAE3, shade #BFC1C7.
    - Quincy Cross medal: silver #C8CCD4, stars #E9ECF2. Ribbon stripes *(colours not documented)*.
  - **Weapons & projectiles:**
    - Reishi Sword: steel blade #CFD6E0 with blue Reishi rim #8EC2FF, grip #2A2730, bird guard #8C929C *(est.)*.
    - Reishi Broadsword: core #E6F3FF, body #A9D2FF, edge glow #5DA8FF.
    - Heilig Pfeil #9FCFFF (core #F2FAFF). Sankt Bogen: translucent #7FB8FF with rim #E8F4FF.
    - Blue flames #2E66F2 / #8FC0FF / core #E3F1FF.
  - **Reiatsu & effects:**
    - Base Reiatsu blue #4A78F0. Soul King Reiatsu **crimson** #A80F1C.
    - The **Black**: #050507 with an oily sheen #1C1A24. Eyes on it: sclera #E9E3D6, **red pupils** #C8141F.
    - Eye-beams crimson #E01A2B with black core (A). Zeichen blast violet #8C3CFF → #C7A1FF (A).
    - Auswählen light #F4F9FF fringed #9CC4FF; after the Soul King its ring is **black**.
    - Blut Vene veins #4C9BFF; Arterie #D5232F.
- **Look by form/outfit:**
  - **Infant (lore cameo, ≈ 1,200 years ago):** born blind, deaf, mute and unable to move. People touching him are healed.
  - **Lichtreich king (flashbacks, ≈ 1,000 years ago):** younger features as above. Uniform and cloak in the same family as today *(details unverified)*. Any insignia uses the **3-point** Lichtreich emblem.
  - **Wandenreich Emperor, 1st invasion (base skin):**
    - White double-breasted trench coat with the Wandenreich symbol in the middle, **large buttoned cuffs and lapels**, white trousers, trench boots.
    - **Tattered ankle-length maroon-black cloak** with a red ribbon at the neck, fastened on the left with one large button.
    - Quincy Cross medal on the left breast, usually hidden by the cloak: a five-point cross set in an ornate round medal with stars and a hanging striped ribbon.
  - **2nd invasion / Royal Realm:** identical, but the cloak is **white**.
  - **"Black Ant" (Ichibe'e fight):** covered in black **ink splashes**, with the brush characters for his new name written across the body; they flake off when The Almighty wakes. Good damage/flavour skin.
  - **The Almighty awake:** same outfit, eyes as above. In-game the extra pupils should *visibly* split in during the T cinematic.
  - **Absorption state (transitional):**
    - (M) He first absorbs **Mimihagi**, which gives him the **eye-pattern down the left side of his face**, and drops a lid of darkness over the Seireitei.
    - (M) His body then **dissolves into a swarm of one-eyed black baby-like creatures**.
    - (M) Finally he kneels in the darkened chamber with **many eyes on his face**.
    - (A) The anime skips straight to absorbing the King in a tornado of energy, right after shattering the crystal.
  - **Soul King form (Wahrwelt):**
    - A **viscous black mask over the upper half of the face** carrying multiple bulbous eyes of uneven size with red pupils.
    - An amorphous black mass covers the body. Only hands, feet, knees, part of the face, the **white dress shirt** and the chest show through.
    - **Eyes open anywhere on the Black** at will.
  - **Eye-chain look (after absorbing Mimihagi; M):** a **chain of black eye markings down the left side of the face onto the chest**, and the left eye inverted. In the anime Mimihagi is only absorbed at the very end (ep413), so use this as the "final fight" skin.
  - **Rewritten-death body:** reforms as a **writhing black mass** that covers even the face, then resolves back into him.
  - **King of the Three Worlds (A, ep414):** three simultaneous bodies, each erupting a spherical, many-eyed **Black Domain**.
  - **Remnant (epilogue, 10 years later):** a seeping leak of his Reiatsu, no body. Cameo VFX only.
  - Note on "multiple faces": canon has no multi-headed Yhwach. The faces are the **eyeball-baby swarm**, the many eyes on mask and shroud, and the anime's three bodies.
- **Weapons:**
  - **Reishi Sword** (spirit weapon). An ornate **dādāo-like** sword with a **relatively long handle** and a **cross-guard shaped like a bird**, wings spread.
    - Size ≈ 1.4 m overall (≈ 45 vox) *(est.)*. Wielded one-handed so the off hand stays free for grabs; dual-wield capable.
    - **Its name was erased** by Ichimonji: in the UI, show the name as "■■■■".
    - Quincy-blooded people who hold it get his Reiatsu pumped in through Blut veins and are puppeted (see Reiatsu Infusion).
  - **Reishi Broadsword:** a giant Heilig Pfeil used as a sword. **About as long as Yhwach is tall** (≈ 2.0 m = 64 vox).
    - Two diagonal prongs form the guard; guard plus handle make the **Wandenreich insignia** silhouette.
    - Summoned from a sky-bow shot or drawn from the hip. After the Soul King, **multiple copies** can exist at once.
  - **Sankt Bogen:** an enormous remote bow (≈ 15–30 m *(est.)*) that appears anywhere nearby and fires on its own.
  - **Finger:** Heilig Pfeil fire straight from an extended index finger. No bow needed.
  - **Medallion** (S2) and the **Quincy Cross medal** (focus for his spirit weapons; disabled when Ichimonji erased its name).
- **Forms & states (ordered):**
  0. **Emperor (eyes closed).** Default. The Almighty is sealed (in canon by the Soul King's Left Arm until ≈ 999 years later). Full Quincy, spell and Soul Distribution kit.
  1. **The Almighty (eyes open).** **T.** The waking also **erases every injury and debuff taken before it**: ink, name-halving, wounds. Pupils split. Adds future sight and future rewriting. At night (S4) The Almighty belongs to Haschwalth unless Yhwach is in Soul King form.
  2. **Soul King (the Black).** **Hold T** (story: absorb the Soul King's halves). Crimson Reiatsu, many-eyed mask, darkness kit, world-scale Reishi and matter control, Hollow immunity.
  3. **Rewritten Death (auto, once).** Lethal damage in form 1 or 2 → he reforms from black mass at high HP. Only Still Silver contact, an illusion that fooled the kill, or a past-altering effect can prevent it. (M ch684)
  4. **King of the Three Worlds (boss-only, A ep414).** Splits into three bodies across three arenas, each throwing a Black Domain.
  5. **Remnant (epilogue).** Non-combat event.
- **Abilities (complete, grouped by form/source):**
  - *Raw power & body (all forms)*
    - `Reiatsu pressure` — pins dozens of people to the ground at once (Lichtreich flashback). Pressure overcame Ichigo's raging Bankai. In Soul King form his crimson Reiatsu forces captain-class fighters flat, and **simply exerting it destroys large structures**: the Greater Soul King Palace, the upper Wahrwelt tower, part of Sōkyoku Hill. `[Field][Status][Blast]`
    - `Master swordsman` — even with Ichibe'e's sealed brush. One-hand sword plus off-hand takedowns. **Dual-wields** two Broadswords (ch677). `[MeleeArc cut]`
    - `Hand-to-hand` — pins Bankai Ichigo before he can react; **catches Sado's Brazo Izquierda one-handed**; stops Yoruichi's lightning Raiōken with the other hand; **catches sword strikes barehanded**. `[Grab/Throw]`
    - `Strength / endurance` — a neck-stab cracks the ground. He shrugs off self-impalement and being hurled 1,000 ri (≈ 4,000 km). He breaks a Heilig Pfeil lodged in his own gut without injury. `[MeleeArc smash]`
    - `Hirenkyaku (master)` — matches Bankai Ichigo's hypersonic speed and appears behind Yamamoto unnoticed. Kirinji and the Divine Soldiers "couldn't touch him", but that was **Nianzol's The Wind** hidden in his shadow (credit Nianzol, not Yhwach). `[Mobility][Teleport]`
  - *Reishi manipulation*
    - `Reishi construction` — gathers and solidifies Reishi **without a gesture**. Builds and dismantles an ornate throne; turns it into stairs. Pulls apart the Vestibule Road pillars and reassembles them as **glowing blue stairs** up to the Greater Palace. Voxel rule: deconstruct nearby structures and re-place their voxels as steps or walls. `[Construct][Environmental absorb]`
    - `Blue Flames` — condensed Reishi fire that burns even "incombustible" spirit matter (Hueco Mundo rock and sand).
      - (M) Hueco Mundo invasion: floats above his army with **both hands aflame**.
      - (M ch631) A Sankt Bogen arrow sets a whole castle ablaze (Lichtreich flashback).
      - (A) Palm blasts that throw Yoruichi and Sado away; an attempt to burn Mimihagi off the Soul King.
      - (A) **Ignition by will alone**, burning only what he chooses: Yoruichi's razor-wire net and the King's curtains, nothing else. In the manga he was still inside the wires at that point.
      - (A ep413–414) Arriving over the Seireitei, he **wipes out whole districts with chains of giant fire pillars** from a raised hand.
      - `[Projectile][Environmental burn][Field]`
    - `Reishi pillar eruption` — (M) engulfs the **1st Division barracks in a colossal column of blue Reishi** (his entrance). (M, cut from the anime) right after restoring his power he hurls **pillars of light** at Ichibe'e, who crushes them between his clapped hands. `[Blast][Projectile]`
    - `Concussive Force` — invisible pressure waves from the hand. Point-blank, it **destroyed Ichibe'e's torso**, leaving only head and limbs (M). Lighter versions throw Yoruichi off the palace and blast Ichigo away (M). (A) A radial version briefly **inverts the colours** of the surroundings (vs Mimihagi). `[Blast][Projectile]`
    - `Quincy Zeichen blast` — a finger shot that erupts into a **star-shaped (Zeichen) burst**. It erased Royd Lloyd's upper body. `[Projectile explode]`
  - *Blut*
    - `Blut Vene` — tanked a Bankai Getsuga at range unhurt; a point-blank one only burned his left arm and sleeve. He blocks a blade tip with a Vene palm and blocks with his wrist. `[Stance][Shield]`
    - `Blut Arterie` — racial offensive Blut. Not explicitly shown for Yhwach, but he **regulates the strength of Blut for the entire Wandenreich**. `[Stance][NEW:TeamAura]`
    - `Blut Vene Anhaben` (外殻静血装, "Shell of Stilled Blood Guise") — projects Blut Vene from the hand into a **spherical barrier**. It blocks mid-level Kidō (Hyapporankan from a Royal Guard).
      - **Its real power is consumption.** Anything touching the barrier or Yhwach gets **Blut vein lines crawling over it** while it is absorbed into him. Living beings included; the ground under him veins over.
      - It survives the shell breaking. Ichibe'e was grabbing his throat when he reversed it by flexing his muscles, which ruptured Yhwach's facial veins.
      - `[Shield][Absorb][Status][Environmental absorb]`
  - *Spells*
    - `Qual Kreis` (苦悶の環, "Ring of Agony") — Reishi **crackles like lightning** around the target, then hardens into a ring of large Heilig Bogen that fire giant arrows from every side.
      - Arrows that are countered can **transfer their momentum into nearby rubble**, burying the target under debris.
      - A giant version is preceded by a **column of crackling blue flame** in the sky, with Yhwach standing behind the bows.
      - `[Construct][Projectile multishot][Environmental]`
    - `Kirchenlied: Sankt Zwinger` (聖唱「聖域礼賛」, "Hymn: Sanctuary Praise") — the Quincy "ultimate defence spell uniting offence and defence".
      - The caster holds out a hand and five **Reishi bands inscribed with Roman numerals** shoot from the fingers, projecting a **huge Quincy Zeichen onto the ground**.
      - **Towering Reishi columns erupt in a ring** along its edge: one shaped like a **Quincy cross**, the rest like **Hagal runes**.
      - Anyone stepping inside is torn apart by the "light of God". Getsuga Jūjishō shattered it.
      - Game: a cylindrical dome-field. The user's "dome" reading works as the VFX shell; the canon shape is a column ring. `[Field][Construct][Shield]`
  - *Spirit weapons*
    - `Reishi Sword` — see Weapons. Clashes evenly with Ichibe'e and Bankai Ichigo. `[MeleeArc cut]`
    - `Heilig Pfeil` (finger) — simple Reishi blasts that **explode into a Quincy Zeichen** and dig deep cavities. `[Projectile explode]`
    - `Heilig Pfeil Erobern` (神聖征滅矢, "Sacred Subjugating Destruction Arrows"; name from the game *Rebirth of Souls*, the move itself is manga) — charges Reishi at the fingertip, then fires a **dense, high-speed barrage**. It **obliterated Yamamoto's remains** and left a deep crater Shunsui later visits. `[Projectile multishot][Blast]`
    - `Sankt Bogen` (大聖弓, "Great Holy Bow") — a **giant bow appears anywhere around him** and fires giant arrows remotely.
      - Arrows can annihilate or burn a castle in one shot.
      - **Self-launch**: he shot six upward and let one impale him to rocket back up to Ichibe'e.
      - **Ground-level horizontal shot** to break a pin.
      - `[Summon turret][Projectile tunnel/explode][Mobility]`
    - `Reishi Broadsword` — summoned in one of two ways:
      - Slash horizontally at the sky: a Sankt Bogen forms above and fires an arrow into the ground in front of him; he pulls it out as the sword.
      - Draw it straight from the **hip**.
      - Bisected Yamamoto in a single diagonal stroke. After the Soul King he keeps several at once: one **pinning Rukia**, one **left stuck in Ichigo**, and **two dual-wielded** (A ep411; dual-wield also M ch677).
      - It blocks Cero Creciente (A).
      - `[MeleeArc cut][Slice][Bind]`
    - `Massive Heilig Pfeil` (A) — forms a giant arrow between both hands and fires it point-blank. The blast surged off the side of the Greater Palace. `[Projectile explode]`
  - *Soul Distribution Power* (魂を分け与える力)
    - `Flawless Healing` — anyone who touches him is healed of physical, mental or spiritual wounds. The cost is a **drastically shortened lifespan**; their skills and knowledge return to him when they die. `[Heal/Reject][Status: death-mark]`
    - `Power Bestowal / Schrift engraving` — makes a follower drink his blood and carves a **letter** on their soul. He can foresee which letter each candidate would get. `[NEW:AbilityTransfer]`
    - `Soul Absorption` — retakes distributed soul pieces when holders die (absorbed James/Mask's power in his sleep). Each piece makes him stronger and longer-lived. Without it he would slide back into his senseless state. `[Absorb]`
    - `Auswählen` (聖別) — see S3. Visuals and modes:
      - **Mass, with incantation:** a dense sphere of Reishi in his palm expands into a **ring around the whole Soul King Palace**. Thick, vein-like light pillars rain down to the Seireitei far below, with **church bells** in the anime.
      - The ring then condenses into a sphere that engulfs him, **shattering the Cage of Life** around it, and **pours the power into the Schutzstaffel**, reviving them with partial Vollständig.
      - **After the Soul King:** the ring is **black** and needs **no incantation**.
        - (M) The third Auswählen, after he beat Ichigo, drained **Haschwalth and Gerard** (Gerard became a skeleton).
        - (A ep412) A **single-target** cast on Haschwalth alone, made *before* breaking Tensa Zangetsu to fuel that rewrite.
        - (A ep413) A final cast also took the **Lille remnants and Mimihagi**. Afterwards he claims every Schrift is now subsumed in The Almighty, with Mimihagi hiding in one of his eyes.
      - Also restores his own power and name after Ichibe'e halved them.
      - `[Field][Beam][Absorb][Heal/Reject][NEW:PowerDrain]`
    - `Self-Power Restoration` — twice in the Ichibe'e fight:
      - Voice crushed: he **digs his fingers into his own throat** and pours Reishi in to give himself a voice.
      - Power and name halved: he pulls in **ribbons of Reishi printed with Roman letters**.
      - Game: cleanse silence, stat-halving and similar. `[Heal/Reject][Status cleanse]`
    - `Sankt Altar` (簒奪聖壇, "Usurpation Altar") — five Reishi orbs rise from his fingers and move around the target. They fire beams that **draw a large Quincy Zeichen** with the target at its centre and **siphon its powers and abilities into Yhwach**.
      - Vs Ichibe'e it failed, because the black that Ichimonji commands always returns to its owner. In the manga the power flowed back almost at once.
      - (A) The anime lets him drain the black out of Ichibe'e's beard and brows (turning them white) and throw it back as blue fire before it returns.
      - Basis of the Medallion (S2). `[Bind][Absorb][NEW:AbilityTransfer]`
    - `Reiatsu Infusion` — he leaves Reiatsu in an object (his sword stuck through the Soul King). A Quincy-blooded person who touches it gets Blut veins up the arm and face and is **forced to act**: Ichigo was made to bisect the Soul King. `[Status: mind control][NEW:Puppet]`
    - `Consumption` — absorbs beings by touch and keeps their power. Instant for weaker beings, slower for great ones: the Soul King, Mimihagi, Ichigo's Quincy + Hollow powers (black veins spread over Ichigo and the ground). `[Absorb][NEW:AbilityTransfer]`
    - `Medallion` — stole **Zanka no Tachi** on the spot (S2). He offered to use it to raise the dead but never actually used it on panel. `[Status: Bankai theft]`
  - *Shadow* — portals **at will with no stance or gesture**. He **picks exactly who comes through**: Schutzstaffel, Soldat squads, Nianzol hidden in his shadow, Pernida called to his side instantly. Asleep, he sinks into a shadow and Haschwalth rises from it. `[Teleport][Summon][NEW:ShadowGate]`
  - *The Almighty* (全知全能, "All-Knowing and All-Powerful"; Schrift **"A"**)
    - `Omni-precognition` — sees every possible future at once, "like grains of sand in the wind". It covers whatever is in view and reaches far ahead.
      - **Blind spots:** pieces of the Soul King (Mimihagi, Pernida, Gerard). Trying to read Mimihagi **cracked his pupil** (A visual, ep395).
      - **Fooled by** Kyōka Suigetsu illusions.
      - `[NEW:Foresight]`
    - `Future acausality ("transform the future")` — he shifts reality to another grain of sand:
      - **Traps placed where you will be:** shadow blades burst from the exact spots Ichigo landed and from the wall he backed into (ch677–678).
      - **Pre-emptive weapon destruction**, even at range: true Tensa Zangetsu snapped the instant it formed, and Kyōka Suigetsu "already cracked" (M).
      - **Delayed wounds:** (M) trap hits to Ichigo's foot and shoulder; (A) the shoulder and pauldron burst as delayed damage from the previous clash.
      - (A) **Orihime's future rewritten**: her self-sacrificing rejection of him "never happened", and she is left unable to protect Ichigo.
      - Any harm taken before activation is undone.
      - **Rewrites his own death**, even erasure. His last remnant re-surfaced 10 years later.
      - Limit (A ep412): big rewrites need enough power, so he drained Haschwalth to break the true Bankai.
      - `[NEW:FateRewrite][Status]`
    - `Instant adaptability` — any power he has "seen" **stops working on him and becomes usable by him**. He read Futen Taisatsuryō and spoke Ichibe'e's own sentence in unison with him before nullifying it. `[NEW:Adaptation]`
    - `Power surge` — waking it boosts his Reiatsu enough to overwhelm Ichibe'e and post-Irazu-Sandō Ichigo. `[Stance]`
    - Visual grammar: **pupils split 1→2→3** (the second pair pushes the first to the corners of the eye; the third sits centred). He can deliberately leave it off (to savour a reunion with Ichigo) and switch it on mid-fight.
  - *The Balance* — at night he holds Haschwalth's Schrift but sleeps through it (S4).
  - *Soul King form (the Black, 黒 / "Chaos")*
    - `Black torrents / spikes / tendrils` — ever-shifting tangible darkness.
      - Tidal waves through his throne room; **spikes shooting up from the floor**; tendrils that grab, bind and impale.
      - It swallowed Getsuga Tenshō and Getsuga Jūjishō whole (the Jūjishō swallow is A).
      - **Lifts and reshapes city blocks** from thousands of km away.
      - (A) Barrages of **spinning discs**.
      - `[Bind][GroundWave][Construct][Absorb][Projectile disc]`
    - `Barrier generation` — a **black dome over the entire Seireitei**, cast from a fingertip hundreds of miles away. Hadō #90 Kurohitsugi cracked it, and enough Reiatsu aimed at the crack collapses it inward. `[Construct][Field]`
    - `Torrent of the Soul King's Power` (霊王の力の奔流) — overflow power pours out as **masses of tiny black, baby-like creatures, each a single eyeball with sharp fangs**.
      - They swarm **only Shinigami** ("enemies of the King") and ignore Quincy.
      - They shrug off cuts but are **crushed flat by strong Reiatsu** and erased by high Hadō.
      - Swallowed whole blocks, overpowered Senbonzakura, flooded through windows.
      - `[Swarm][NEW:FactionSwarm]`
    - `Black Possession` — infusing the Black into bodies or objects animates them **with The Almighty's eyes on them** and **self-repairs** them:
      - Defeated Soldat get back up (M ch661).
      - Giant **stone statues with spears** guard the Wahrwelt halls and reassemble after Sado's La Muerte (statues M; eye-leaking Black on them A).
      - `[Summon][NEW:Puppet][Heal/Reject]`
    - `Eye beams` (A ep411) — crimson or black beams from **any of dozens of eyes**: on the mask, the shroud, floating eyes, eye-studded pillars of darkness.
      - Huge penetration: they carved a distant tower, punched through Ichigo and Rukia, and **curved away from Ichigo's blade**.
      - He can **coat his whole body in eyes** and fire **hundreds of beams** in every direction.
      - `[Beam][Projectile homing]`
    - `Zeichen Energy Blast` (A ep411) — pillars of eye-bearing darkness merge into a **Quincy-Zeichen emblem** in front of him. Energy gathers in its huge central eye, then a **violet** beam erases everything ahead and **destroys the upper part of Wahrwelt** in a giant explosion. `[Beam][Blast]`
    - `Self-regeneration` — reforms from gashes. (A) He survived **complete bifurcation** and being **shredded by Blood-Chains Getsuga** by reassembling. He also **slides his body along the darkness out of an attack's path**. `[Heal/Reject][Teleport]`
    - `Increased Reishi control` — all Reishi in the Royal Realm obeys him: **Quincy-only air footholds** (S1). Fire-pillar chains (A). `[Field][NEW:WorldRule]`
    - `Matter transmutation (Wahrwelt)` — creates his capital:
      - Lifts the **entire Wandenreich city** (which had replaced the Seireitei) up to the Royal Realm.
      - Fuses it with the **five palace cities into one giant Quincy Zeichen**.
      - **Raises a towering multi-layered fortress in seconds**, with Silbern on top and a **Hagal-rune-shaped throne**.
      - Earlier he shattered the Greater Palace top just by "overflowing", with the rubble carried on black matter.
      - `[Construct][NEW:WorldReshape]`
    - `Dimensional portal` — a circular, darkness-shrouded portal for long jumps (Royal Realm → Seireitei). He leaves it open as bait. `[Teleport]`
    - `Worldly assimilation` — as the linchpin he can **merge the Human World, Soul Society and Hueco Mundo** (M ch684).
      - (A ep414) He **splits into three bodies**, one per realm, calls himself **King of the Three Worlds** (三界の王), and erupts a **spherical, many-eyed Black Domain** over the Seireitei, the Hueco Mundo desert and Karakura Town.
      - `[NEW:MultiPresence][Field]`
    - `Enhanced strength` — (M) catches Half-Hollow Ichigo's sword barehanded and **crushes Cero Creciente with his bare hand**. (A) The anime has him smash it with a Broadsword instead. `[Grab/Throw]`
    - `Hollow immunity` — absorbed Ichigo's Hollow power with no ill effect.
  - *Epilogue* — `Remnant` — his last Reiatsu leaks out near the 13th Division ten years later. Kazui Kurosaki seals it with a touch of his hand. (M ch686)
- **Passives & weaknesses:**
  - **Passives:**
    - Hirenkyaku and air footholds always.
    - Day: The Almighty available (form 1+). Rewritten Death once (form 1+).
    - Soul King form: permanent shroud (auto-block chance, regeneration), Hollow immunity, Quincy-only air rule.
  - **Weaknesses:**
    1. **Night swap**: no Almighty while Haschwalth holds it (before the Soul King he is also **asleep and defenceless**). Killing Haschwalth while he holds it **destroys The Almighty**.
    2. **Still Silver in his blood**: all powers off for a few seconds.
    3. **Kyōka Suigetsu-class illusions** poison his foresight. Aizen also **distorted his sense of time** to make him overstay the Wandenreich time limit.
    4. **Past-altering powers** override his future edits: Tsukishima's Book of the End let Orihime repair Tensa Zangetsu; Uryū's Antithesis swaps a chosen future back.
    5. **Soul King parts** are invisible to The Almighty.
    6. Rewrites need **enough power** (A: big ones need fuel, e.g. a single-target Auswählen).
    7. **Ichimonji**: the black it controls can't be stolen; ink erases names and their power.
    8. Blut Vene Anhaben consumption can be **reversed by sheer strength** (Ichibe'e).
- **Signature moments to recreate (story set pieces):**
  1. **Rain over the Seireitei (M ch510–511):**
     - Royd's disguise ends and the **1st Division barracks vanish in a blue Reishi pillar**. Yhwach appears behind Yamamoto and erases Royd with a Zeichen-burst.
     - Yamamoto releases Zanka no Tachi and **the Medallion takes it**.
     - Sky-slash, Sankt Bogen, Broadsword. **Yamamoto bisected.** Yhwach cuts off the hand gripping his cloak, then a finger barrage leaves a smoking crater.
  2. **First clash with Ichigo in the rubble (M ch512–514):**
     - Sword clashes across rooftops and into the air. Pin and neck-stab; Blut Vene flickers on Ichigo's neck. A point-blank Getsuga burns his left sleeve.
     - Qual Kreis buries Ichigo in rubble. **Shadows drip from Yhwach**: time's up (Aizen fooled his clock).
     - Haschwalth cuts Tensa Zangetsu in half. Yhwach leaves, telling Ichigo to heal and wait for him, and calls him his son born in darkness.
  3. **Hueco Mundo prelude:** Las Noches taken. Floating above the Jagdarmee with burning hands. Harribel caged behind his throne.
  4. **The Key:** Haschwalth's Hagal rune lights the tower roof and a beam pierces the sky. Yhwach explains that Ichigo's Ōken robe tore open the 72 barriers for 6,000 s, and rides the light up.
  5. **Soul King Palace gate (M ch599–604):**
     - Kirinji's slashes and the Divine Soldiers' blades bend around him (Nianzol in his shadow).
     - He summons the Schutzstaffel from his shadow.
     - Caged by the Cage of Life, he **throws his Medallion out** and Uryū swaps them.
  6. **Ichibe'e (M ch605–610):**
     - Senri Tsūtenshō hands bat him 1,000 ri away and his **voice is crushed**. Fingers in his throat. A **Sankt Bogen self-impale rocket** back up.
     - The brush halves him ("ar" arms, "Yhw").
     - **Auswählen ring around the palace, bells**: the Cage shatters, the Schutzstaffel revive, Sternritter below are stripped to bones.
     - Blut Vene Anhaben stops Hyapporankan; Teppūsatsu breaks it; the throat-grab turns into vein consumption until Ichibe'e ruptures his face.
     - Ichimonji ink, then **"Black Ant"** written on him, then crushed between giant palms.
     - **Eyes open (2 pupils)**. A Reishi beam bursts through the floor and he stabs Ichibe'e. Futen Taisatsuryō's mausoleum is spoken back in unison. **3 pupils.** Hand raised, torso erased.
     - He walks to the Seal and breaks it by touch; the pillars become **glowing stairs**.
  7. **Death of the Soul King (M ch611–621):**
     - Sword through the King's crystal. **Ichigo puppeted** by Quincy blood into cutting the King in half.
     - Mimihagi wraps the halves; Yhwach can't see its future (A: his pupil visibly cracks). "Pernida." Yoruichi's arm is mangled.
     - (M) He rips Mimihagi away and absorbs it: eye-chain on his face, **darkness beam through the floor**, black lid over the Seireitei. He dissolves into an **eyeball-baby flood**, then absorbs the King. Aizen's Kurohitsugi answers below.
     - (A) Variant: the Schutzstaffel **raise their swords and he fuses them into one blade**, shatters the crystal and absorbs the King in a tornado of energy.
  8. **Wahrwelt rising (M ch626–628):** the palace top shatters; Schutzstaffel stand on floating rubble; five cities + Wandenreich city lock into a **giant Zeichen**; the fortress rises; the Hagal-rune throne.
  9. **Throne room (M ch672–680 + A eps407–413):**
     - The prophetic **nightmare**: Haschwalth's vision of Ichigo cutting him down.
     - (M) Darkness swallows Getsuga and pins Ichigo and Orihime.
     - (M) Ichigo's horned **Half-Hollow form** blows the throne room's walls and ceiling away; his **Cero Creciente** (Getsuga fused with Gran Rey Cero) cuts him deeply.
     - (A) Spinning-disc and tendril barrages; Rukia freezes the darkness; the **eye-beam storm**; **Blood Chains** Ichigo's clones shred him; the **violet Zeichen blast destroys the top of Wahrwelt**; Orihime's self-sacrifice is rewritten out of existence.
     - (M) **Dual Broadswords**; traps of fate; **true Tensa Zangetsu snapped as it forms**; Ichigo's horn snapped off and thrown back at him.
     - (A) Renji is cut to pieces, Rukia's arm snapped, Sado and Ganju run through by darkness pillars.
     - (M) Ichigo's **Quincy + Hollow power absorbed**. Third Auswählen: Gerard becomes a skeleton and Haschwalth falls. Rukia and Renji arrive and he **tears Zabimaru apart barehanded** as he steps into his portal.
  10. **Seireitei finale (M ch681–686 + A ep414):**
      - Portal to the Seireitei; Aizen's chair destroyed by his arrival blast; Goryūtenmetsu dragon.
      - **Kyōka Suigetsu fools his eyes**. Ichigo's Getsuga bisects him. **Death rewritten**, and the darkness floods the Shakonmaku. (A) Three bodies and the Black Domain.
      - **Uryū's Still Silver arrowhead**. Tensa Zangetsu's outer blade crumbles to reveal the original Zangetsu, and he is cut in two.
  11. **Epilogue:** the remnant leak, dispelled by a child's touch.
  - **Flashbacks:**
    - Lichtreich: Reiatsu pins the village; he chooses Haschwalth as "other half"; a Sankt Bogen arrow burns Bazz-B's castle.
    - 1,000 years ago: duel with the young Yamamoto, ended by Sasakibe's stab from behind.
    - The **truce talk with Ichibe'e**, where the Left Arm seals The Almighty.
- **System designs — The Almighty in-game (deep design).** These are fun-first translations, each tied to a canon feat. They run in **form 1+** during the day (or at night after the Soul King).
  1. **Future Ghosts (passive overlay).** Every enemy in Yhwach's view shows a translucent, sand-textured **"ghost" 0.6–1.5 s ahead**.
     - For AI: read the planner's queued action and path.
     - For players: extrapolate from the input buffer, attack wind-ups and the current animation.
     - Ghosts draw as streaming **grains of blue-white sand** (#CFE6FF) that settle into a silhouette.
     - Soul King parts (Gerard, Pernida, Mimihagi) **never show a ghost**: render a static/"cracked lens" shimmer around them instead.
     - `[NEW:Foresight]`
  2. **Already Seen (auto pre-dodge).** Any attack whose ghost he has seen, and which would hit, triggers an **automatic Foreseen Step**: a 0.15 s Hirenkyaku blink to a safe "grain" that's usually **directly behind the attacker** (canon: he kept reappearing behind Ichigo).
     - No auto-dodge vs unseen sources: attacks from behind outside his view cone, illusions, Soul King parts.
     - Cosmetic counter: a sand-burst ring at the old position.
     - `[Teleport][NEW:Foresight]`
  3. **"All that I see is powerless" (adaptation registry).** Each **distinct ability ID** that hits him or detonates within view gets logged.
     - After the first exposure it deals **0** to him (shows a sand-white "absorbed" flash).
     - It is added to a **Seen Powers** page on his Tab wheel, castable with Yhwach's VFX recolour (blue and black).
     - Canon basis: any power he has come to know adapts to him and becomes his to use.
     - `[NEW:Adaptation][NEW:AbilityTransfer]`
  4. **Rewrite (active, E in form 1).** Target an enemy who is **winding up, casting or transforming** within view. Yhwach "picks another grain" and the ability **resolves as already failed**:
     - Projectiles fizzle at the muzzle.
     - Summons never appear.
     - **Transformations complete already broken.** The weapon or form is flagged `BrokenInEveryFuture`: Bankai breaks as it forms (Tensa Zangetsu), illusion weapons arrive cracked (Kyōka Suigetsu). It stays locked until a **past-altering** effect clears it.
     - **Power gate (from the anime's framing, ep412):** rewriting a target whose power rating ≥ Yhwach's current rating needs a sacrifice: a single-target Auswählen on an ally Quincy, or a full meter.
     - `[NEW:FateRewrite][Status]`
  5. **Future Wound (R, form 1).** A swing that visibly misses but registers "in the future": the wound blooms on the target **0.5–1.0 s later**, ignoring guard and parry, and can **shatter armour pieces** (Ichigo's pauldron). `[MeleeArc cut][Status: delayed damage]`
  6. **Traps of Fate (F, form 1).** Mark up to 5 points where enemy ghosts will be. When the real body arrives, **black shadow-blades spike up from floor or wall** (Bind + damage). Works through walls: blades come out of the surface behind the target. `[Construct][Bind][NEW:Foresight]`
  7. **Sand Cloud (hold G, form 1).** Time slows to ≈ 10 % for up to 2 s and the world turns to drifting sand.
     - Every enemy shows their **next 3 actions** as branching ghost trails.
     - Clicking a branch **deletes it**: that action becomes the Rewrite target.
     - Release: time resumes.
     - `[Field: time slow][NEW:FateRewrite]`
  8. **Overwrite Injury (Z, form 1).** Roll his own state (HP, limbs, debuffs) back to any moment in the last 5 s. Waking The Almighty does a full reset to pre-fight state once. `[Heal/Reject][NEW:StateRollback]`
  9. **Rewritten Death (passive, once).** Lethal damage turns his body into **writhing black mass** for 1.5 s, then he reforms at ≈ 60 % HP. The killer gets a "FUTURE REWRITTEN" banner. Blocked if: Still Silver is in his blood, the killing blow came through a successful illusion, or it's a story-scripted final blow. `[NEW:StateRollback][Transform]`
  10. **Counter-play the engine must support:**
      - `Still Silver` (status hard-off, 3–5 s).
      - `Illusion` (ghosts lie; adaptation and auto-dodge suppressed vs the illusionist).
      - `Past-edit` (clears `BrokenInEveryFuture`; Uryū's Antithesis can **swap a Rewrite back** onto Yhwach's own ability).
      - `Soul-King-part` (invisible to all of the above).
      - Night swap (S4).
  11. **Haschwalth's borrowed version** is deliberately weaker: a **single ghost pulse every 3 s**, with no Rewrite, no adaptation and no death rewrite. See his dossier.
  - *Optional mode ("Sealed King", inspired by Rebirth of Souls (G)):* Yhwach starts with a reduced kit. Each Auswählen "verse" (drain events on Quincy NPCs) unlocks a technique in Kaiser Gesang order. The 9th automatically awakens The Almighty. The 900-90-9 song makes good loading-screen lore.
- **Kit proposal:**
  - **Form I — Emperor (eyes closed; maroon-black or white cloak)**
    - **Shift:** Hirenkyaku glide. Blue flow lines under the boots and almost no leg motion, so he "slides" regally. Double-tap with lock-on: appear behind the target. Air: Reishi footholds leave faint Zeichen ripples.
    - **LMB (Reishi Sword):** measured one-hand chain.
      - (1) diagonal cut → (2) backhand → (3) thrust → (4) off-hand **grab-and-slam** into the floor.
      - Forward: lunging thrust. Back: rising launcher. Air chain: 3 slashes.
      - Down-in-air: **plunging stab that cracks a crater**. Sprint: passing cut.
      - `[MeleeArc cut/smash][Grab/Throw]`
    - **Hold LMB:** **Pin & Pierce.** Seize the weapon arm, drive the head into the ground, stab the neck. The ground shatters. `[Grab/Throw][MeleeArc smash]`
    - **RMB:** sword guard. Timed tap: **bare-hand catch** (Blut Vene palm) of blades, fists and small projectiles, followed by a shove.
    - **Q:** Heilig Pfeil from the finger, Zeichen-burst impact. **Hold Q:** **Heilig Pfeil Erobern** fingertip barrage.
    - **E:** **Sankt Bogen.** Aim anywhere within ≈ 60 m; a giant bow appears there and fires at the lock-on.
      - Hold E: 6-arrow volley.
      - In mid-air while looking down: **self-impale rocket** (big vertical launch, small self-damage).
    - **R:** **Reishi Broadsword.** Sky-slash, the arrow drops, he pulls the sword out and LMB switches to the Broadsword moveset (longer and slower; every 3rd swing is a structure-splitting `Slice`). **Hold R:** **Bisect**, a diagonal planar cut through target and buildings. `[Slice]`
    - **F:** **Qual Kreis.** Lightning crackle, ring of bows, crossfire; missed arrows ram rubble into the target. **Hold F:** blue-flame column into Giant Qual Kreis.
    - **Z:** **Blut Vene Anhaben** sphere (radius ≈ 4 m). Blocks projectiles and Kidō. Anything touching it veins over and is drained: heals Yhwach and dissolves voxels. Stays up after the shell breaks while contact persists.
    - **X:** **Blue Flames** palm blast. **Hold X:** **Will-Ignite**: target any object, construct, barrier, net or curtain in view and it bursts into controlled blue fire that **only burns what you picked**.
    - **G:** Blut Vene ↔ Arterie. **Hold G:** **Regulate Blut**: allied Quincy within 40 m get boosted Blut; enemy Blut users are suppressed.
    - **C (hold):** blue Reiatsu flare. Weaker enemies fall prone, rubble lifts, the floor cracks.
    - **T:** wake **The Almighty** (Form II). Cinematic: ink and wounds flake away, pupils split 1→2→3, full cleanse and heal. **Hold T** (gated): **absorb the Soul King** (Form III).
    - **V:** **Auswählen.** Sphere in palm, then a sky ring, then vein-pillars on **every Quincy-tagged entity on the map**, allies included.
      - Victims are drained. Kills leave a skeleton plus a **Still Silver pickup**.
      - The power goes to Yhwach (full heal, cleanse, meter) or is split into **reviving fallen allies** with partial Vollständig.
      - Skip the chant for a faster, weaker cast. **Hold V:** single-target Auswählen on one ally Quincy: absorb their Schrift and fuel a power-gated Rewrite.
    - **Tab wheel:**
      - Medallion (S2) · Sankt Altar · Kirchenlied: Sankt Zwinger · Shadow Gate (portal; **summon a named Schutzstaffel** as an AI ally, or a Soldat squad).
      - Concussive Force · Reishi Pillars (hurl) · Reishi Architecture (dismantle nearby structures into stairs, walls or a throne).
      - Self-Restoration (cleanse silence and halving) · Power Bestowal (give an ally a random Schrift buff) · Flawless Healing (heal an ally and mark them; reclaim power when they die).
      - Reiatsu Infusion (plant the sword: Quincy-blooded wielders get puppeted) · **Zanka no Tachi** (if stolen: the four Bankai techniques at Yhwach strength).
  - **Form II — The Almighty (eyes open)**
    - Keeps all of Form I. Adds passives 1–3 and 9 from the system design above.
    - **Shift:** **Foreseen Step.** Short blink to the predicted safe spot. Pressed while an attack is incoming, it lands behind the attacker.
    - **LMB:** the same chains, now **unblockable vs foreseen guards**: if the target's ghost shows a guard, his hit routes around it.
    - **Q:** **Fate Pfeil.** Arrows fly to the ghost position: perfect lead, and they curve around cover.
    - **E:** **Rewrite.**
    - **R:** **Future Wound.**
    - **F:** **Traps of Fate.**
    - **Z:** **Overwrite Injury.**
    - **X:** **Grasp & Column.** Grab the face (Blut veins spread), then a column of energy hurls the target upward through ceilings and floors. **Hold X:** **Torso-breaker** concussive blast at point-blank.
    - **G (hold):** **Sand Cloud.**
    - **C:** stronger blue flare plus foresight pulse: every enemy ghost is revealed through walls for 3 s.
    - **V:** **All-Consuming One** (name borrowed from Rebirth of Souls (G)). Knock the weapon out of the target's hands (the camera takes the victim's view), run them through with the Broadsword, **absorb their power** (copy their current form's ability set for 30 s), then blast them away. Hold V: Auswählen.
    - **Tab:** + **Seen Powers** page (copied abilities) · Night toggle (S4) · everything from Form I.
  - **Form III — Soul King (the Black)**
    - **Shift:** **Dark Transit.** Melt into a strand of Black and pop out from any other strand or eye within 25 m. **Double-tap:** circular darkness portal for long jumps.
    - **LMB:** **dual Broadswords** with tendril lashes woven in (every 3rd hit a tendril strikes from the shroud). Down-in-air: a broadsword driven through the target into the floor.
    - **Hold LMB:** **Impale & Pin.** Leave a Broadsword planted through the target (Bind) and grow another in hand. Planted swords stay as hazards.
    - **RMB:** **the Black guards for him.** Guard is a dark wall. **Parry swallows** the projectile (Getsuga) whole.
    - **Q:** **Eye Beams.** Tap: one crimson beam. **Hold:** open dozens of eyes on the mask, shroud and floating eyes, then a barrage of hundreds of beams that **curve around blades**. (A)
    - **E:** **Torrent.** Tidal wave of darkness. **Hold E:** a forest of spikes from the ground. Air version: tendril grab and fling.
    - **R:** **Zeichen Energy Blast** (A). Eye-pillars merge into a Zeichen, the central eye charges for 1.2 s, then a violet erase-beam and a mega explosion.
    - **F:** **Black Possession.** Infuse statues, rubble giants or corpses: self-repairing golems (stone spearmen), possessed Soldat.
    - **Z:** **Torrent of the Soul King's Power.** Eyeball-baby swarm that hunts **Shinigami-faction** targets only.
    - **X:** **Black Dome.** A fingertip flick raises an enormous barrier dome over a chosen area, even far away. Seals or cages everything inside. It cracks under extreme hits.
    - **G:** **All Eyes.** Omnidirectional vision (no back-attacks). Crimson Reiatsu aura forces captain-class enemies within 15 m prone while held.
    - **C:** **Crimson exertion.** Exerting alone damages and **demolishes surrounding structures**.
    - **T (hold, boss/arena-gated):** **King of the Three Worlds** (A).
    - **V:** **Wahrwelt.**
      - Every structure in a huge radius lifts on black matter and reassembles into a **Quincy-Zeichen city with a fortress rising at the centre**.
      - While it lasts, only Quincy may air-step.
      - Alt V (hold): **Black Auswählen**, no chant.
    - **Tab:** Matter Transmutation (raise a wall, tower or Hagal-rune throne) · Fire-Pillar Chains (A) · **Consume** (grab and absorb: steal forms permanently in story) · Spinning Disc barrage (A) · Dark Portal · Reishi Lockdown (toggle the Quincy-only air rule) · Seen Powers · Medallion · Sankt Altar.
  - **Boss-only — King of the Three Worlds (A ep414).**
    - Three synced bodies in three arenas (Seireitei, Hueco Mundo dunes, Karakura Town). Each arena's player fights one body; damage is shared.
    - Each body grows a **Black Domain** sphere that keeps expanding and darkens its arena.
    - Defeat needs Still Silver on any one body, which opens a vulnerability window on all three.
- **AI notes:**
  - **Personality tells:**
    - Unhurried; talks mid-fight; **idles with a hand on his hip**; smiles faintly.
    - Says he has *already seen* an attack right before countering it.
    - Despises infighting and executes underlings for it.
    - Calls his favourites "my son" (Haschwalth, Uryū, Ichigo). Sacrifices anyone without hesitation.
  - **Phase plan (boss):**
    1. **Emperor:**
       - If an enemy uses Bankai, he **uses the Medallion immediately**.
       - Opens with finger Pfeil and the Broadsword. Uses Qual Kreis when the player turtles.
       - **Story timer**: when shadows drip, he disengages.
    2. **Halved / cornered:** casts Auswählen (revives allies, heals), then **wakes The Almighty** when crushed or sealed (Ichibe'e pattern).
    3. **Almighty:** may deliberately fight **without** The Almighty at first ("savouring"), then cracks his neck, says it's time, and switches it on.
       - Afterwards he **blinks behind the player after every swing**, uses Traps of Fate on landing spots, and Rewrites any transformation the player starts.
       - Telegraph: the **eyes gain a pupil** 0.5 s before a Rewrite.
    4. **Soul King:**
       - Starts **seated on the throne** and only stands after a real hit.
       - Darkness attacks while seated. Eyes open on the Black **before** beams (telegraph). A Zeichen forming means the violet blast is coming.
       - When the player reaches their top form, he **Auswählens Haschwalth** (if alive) and breaks that form.
       - On victory he **absorbs the player's powers** (story).
    5. **Final:** portal chase. First lethal blow is **rewritten**. He's only killable after a **Still Silver** hit (scripted ally arrow) or through an illusion.
  - **Releases** only when the opponent shows real power. He never runs; he leaves when his time limit hits.
- **Callouts:** *"Ausuvēren"* (Auswählen) · *"Zankuto Bōgen"* · *"Kuvāru Kuraisu"* · *"Kiruhienrīto: Zankuto Tsuvingā"* · *"Zankuto Arutāru"* · *"Burūto Vēne Anhāben"* · *"Hairihhi Pufairu"* · *"Ji Ōrumaiti"* · *"Medarion"*. Short barks (my renderings of recurring lines, not verbatim quotes): *"Mieru"* ("I can see it") before counters; *"Yūhabahha da"* ("I am Yhwach") as the third-pupil sting; a sung line of the **Kaiser Gesang** for Auswählen; the Auswählen chant is long (it names Adnyeus' coffin), so use only the opening words.

---

## Jugram Haschwalth (ユーグラム・ハッシュヴァルト) — Sternritter Grandmaster "B", Imperial Adviser, Yhwach's "other half"
- **Wiki:** https://bleach.fandom.com/wiki/Jugram_Haschwalth. Battles: [Uryū Ishida vs. Jugram Haschwalth](https://bleach.fandom.com/wiki/Ury%C5%AB_Ishida_vs._Jugram_Haschwalth), [Bazz-B vs. Jugram Haschwalth](https://bleach.fandom.com/wiki/Bazz-B_vs._Jugram_Haschwalth), [The Royal Guard vs. The Wandenreich](https://bleach.fandom.com/wiki/The_Royal_Guard_vs._The_Wandenreich).
- **Roster tier:** **A.** Elegant sword-and-shield counter-fighter with a day/night split personality and kit.
- **Canon power: 8** (9 at night with The Almighty; anime hAschwAlth ≈ Vollständig-level).
  - Cut Bankai Ichigo's blade in half in one stroke.
  - Executed Cang Du straight through The Iron.
  - Took Bazz-B's arm and then cut him down.
  - Beat Vollständig Uryū until Antithesis and an Auswählen intervened.
  - Lost cleanly to Kirinji, who was sealed by the Blood Oath at the time.
- **Body:** 189 cm → **60 vox**.
  - Tall, **thin**, young-looking and handsome. Composed, almost expressionless.
  - **Straight blonde hair falling past the waist** (≈ 30 vox long).
  - Long, faintly choppy bangs parted off-centre to the right, **one strand hanging between the eyes over the left eye**. Blonde lashes.
  - Silhouette keys: sheet of pale hair, calf-length coat with a **dark-green fur strip** down the left front, angular **gold shield on the left forearm**, long-gripped cruciform broadsword.
  - Signature "Balance" pose: blade held level at arm's length, **left hand supporting the far end of the blade**.
- **Palette (hex estimates):**
  - **Skin & hair:** skin #F2E0D0, shadow #CDB4A0. Hair #EBD9A0, shade #CBB672, highlight #FFF3C8. Lashes #D9C383.
  - **Eyes:** **light green-blue** #8CC7B4. The wiki says "light-green", while later text says the eyes "return to blue", so treat the hue as *(unverified)*.
    - The Almighty: **crimson irises** #C0182A with **3 pupils**, flickering back toward blue.
  - **Clothes:**
    - Hood-cloak and coat #F0F0EB, shade #C5C8CE.
    - Fur strip #2E4632 (highlight #44614A). Belt green #3D6A48. Buckle gold #D4AF45.
    - Trousers and shoes white #ECEBE6.
  - **Freund Schild:** gold Zeichen frame #E0B44A (shade #A9802A). Panel fill: translucent pale gold-white #F6ECC8 at ≈ 60 % *(fill colour est.)*.
  - **Blade of Judgment:** steel #D8DCE3, fuller #B9BFC9. Gold cross-guard and pommel #C9A43E. **Black grip** #19191D.
  - **Effects:**
    - Sword energy blasts #CFE6FF *(est.)*.
    - Night Reiatsu: **black** #050507.
    - The Balance scales VFX: spectral gold #E8C55A.
    - Key beam and Hagal rune: white #FFFFFF / #E6F0FF.
- **Look by form/outfit:**
  - **Child (flashback, Lichtreich):** light dress shirt, plain wooden bow and quiver, **chin-length hair**. Hunts rabbits for his abusive uncle.
  - **Teen:** sleeveless black shirt, light trousers, **white gloves**, a medium double-edged sword in a black sheath at the hip. Trains with sword and bow for five years beside Bazz-B.
  - **Lichtreich Sternritter captain:** **dark cape** and a standard Wandenreich peaked cap. Use the **3-point** Lichtreich emblem.
  - **War-declaration messenger (Seireitei, 1st arc):**
    - Wandenreich **hooded cape with a black mask** over the face.
    - A thin **black sash** running diagonally around the body from the left epaulette.
    - Simplified uniform underneath.
  - **Grandmaster (main skin):**
    - The order's hooded cloak over a **trench coat (calf-length; thigh-length during the 1st invasion)**.
    - **Dark green fur from the left collar down the front**, green belt with gold buckle, white trousers and shoes.
    - The Freund Schild appears on the left arm when needed.
  - **Night / The Almighty:** same outfit; **eyes triple-pupilled and red**; a **black** Reiatsu haze.
  - **hAschwAlth (A; Kubo designed it for the anime):** the "vessel" of The Almighty.
    - Black Reiatsu **leaks from his eyes and runs down his face like tears**. The eyes turn back to blue.
    - The black **coats both hands and boots**.
    - It forms a long **sash-like shroud** that wraps **twice across the chest in an X** and trails far behind his back.
    - Black energy **surges along the whole blade**.
    - Kubo's intent: let his inner darkness show outside, contrasting his "dazzling" normal look.
- **Weapons:**
  - **Blade of Judgment** (処断の刃, *Shodan no Yaiba*). A long-handled **cruciform broadsword**, recovered as a teenager from the ruins of Bazz-B's family mansion.
    - **Black handle, golden hilt**, with **Bazz-B's family crest on the hilt**, revealed under his hand when he dies.
    - Overall ≈ 1.5 m (≈ 48 vox) including a two-hand grip *(est.)*. Used one- or two-handed; pommel strikes.
  - **Freund Schild** (身代わりの盾, "Substitute Shield"): a **gold Quincy Zeichen whose bottom limb extends well past the others**, with solidified Reishi filling the spaces between the limbs. An angular kite shape, ≈ 1.1 m tall (≈ 35 vox) *(est.)*, worn on the left forearm.
    - It can be **re-summoned** if knocked away.
    - It **cracks** when reflecting enormous wounds.
  - **Youth gear:** an ordinary bow and arrows, then the teenage double-edged sword.
- **Forms & states (ordered):**
  1. **Grandmaster — Day (The Balance).** Default.
  2. **Mask of the Ruler — Night (borrowed The Almighty).** Automatic at night while Yhwach sleeps (S4); manual T in modes that allow it. Adds limited foresight and black Reiatsu. He loses The Balance to Yhwach while this lasts.
  3. **hAschwAlth (A).** Hold T at night. Vollständig-equivalent power, but he still can't manipulate Reishi (no Hirenkyaku).
  - Haschwalth has **no Quincy: Vollständig** in canon.
- **Abilities (complete, grouped by form/source):**
  - *Soul Distribution Power (power-sharing Quincy)*
    - `Power Amplification` — merely being near other Quincy makes them stronger. This was the secret behind child Bazz-B's prodigious growth. He was born unable to **take back** what he gives. `[Field][NEW:TeamAura]`
    - `Nocturnal power swap` — trades The Balance for The Almighty with Yhwach each night (S4). Yhwach sinks into a shadow and Haschwalth rises from it. `[NEW:DayNight]`
  - *Racial / physical*
    - `Reishi manipulation` — as a child he couldn't even form a Heilig Bogen. As an adult he absorbs Reishi so subtly that nobody notices. `[Environmental absorb]`
    - `Enhanced speed` — he moves and cuts before an opponent registers it, and slashed Uryū from a distance instantly.
      - **Air footholds:** in canon he does not use Hirenkyaku in the air. He **springs off enemy projectiles** (Uryū's flechettes) and, in the anime, off **ramps of black Reiatsu**.
      - `[Mobility]`
    - `Enhanced reflexes` — catches an arrow in mid-flight (twice; bled as a teen, unhurt as an adult). Blocks Kirinji's Shunpo strikes with the shield. Dodges or cuts down dozens of Vollständig Heilig Pfeil and laser volleys when combined with The Almighty. `[Absorb/Reflect/Redirect]`
    - `Durability` — stood unharmed in the heat of Zanka no Tachi, which reduces others to ash. As a teen he kept standing under Yhwach's crushing Reiatsu.
    - `Master swordsman` — vertically **bisected Kajōmaru** before he could move, **sliced Tensa Zangetsu's blade in two**, pommel-struck Bazz-B, took Bazz-B's arm and then bisected him shoulder to hip. Spent five teen years compensating with steel. `[MeleeArc cut][Slice]`
    - `Archer` — mastered the plain bow as a youth. `[Projectile]`
    - `Energy blasts` — fires energy from the sword shaped like **four points curving backward** (top, bottom, both sides; a curved, cross-like star). (M ch672; cut from the anime.) `[Projectile crescent]`
    - `Keen intellect` — realised the flame-cloak of Zanka no Tachi (Zanjitsu Gokui) was Yamamoto's own Reiatsu, read Yhwach's successor gambit as a deliberate test, and spotted the trap in Nanao's barrier joints.
  - *Wandenreich powers*
    - `Shadow` — creates a shadow in his hand and **drops it to the ground**, where it spreads into a **huge six-pointed-cross portal** for mass Soldat deployment. `[Teleport][Summon][NEW:ShadowGate]`
    - `The Key` (鍵を, *Kagiwo*) — **raises his sword overhead**, light shines from the tip and burns a **white Hagal rune** onto the ground or roof. A **pillar of light** then carries him and his companions to the Royal Realm.
      - The beam is damaging and its discharge blasts nearby fighters apart.
      - It needs a pre-opened path; in canon, Ichigo's descent left the 72 barriers open for 6,000 s.
      - `[Teleport][Beam][Blast]`
  - *Schrift: The Balance* (世界調和, "World Harmony"; **"B"**)
    - `Misfortune redistribution` — misfortune arising in his sphere of influence is moved onto those enjoying good fortune.
      - **Execution:** BG9 and Cang Du's "lucky survival" was cancelled out, and his sword went **straight through The Iron's** steel skin.
      - **Structures:** Nimaiya's luck at not having to fight Yhwach was converted into misfortune for the **Cage of Life**, which **split into two halves**.
      - `[Status][NEW:Luck]`
    - `Freund Schild — misfortune absorption` — every injury that would befall him is absorbed **into the shield instead of his body**. **Any wound he does take is reflected back in equal measure** onto whoever had the "good fortune" to land it.
      - Uryū's arrows simply **stuck harmlessly into the floor**, and a matching gash opened on Uryū.
      - When Antithesis swapped their wounds, the shield **absorbed them again and reflected them onto Uryū**, healing Haschwalth fully. The shield cracked slightly from the strain.
      - (A, anime-expanded) **A giant spectral pair of scales** appears behind him and visibly tips.
      - `[Absorb/Reflect/Redirect][Shield][NEW:DamageReflect]`
  - *Borrowed: The Almighty (night)*
    - `Foresight` — sees the future, but can't alter it.
      - The futures he sees are limited and can still be changed. He saw Uryū draw the Leidenhant but not how Uryū would use it.
      - **One look per 3 seconds**: made explicit in the anime, ep411; manga status unclear.
      - Eyes: 3 pupils, red irises.
      - **If he dies or loses his powers while holding it, The Almighty is destroyed**: Bazz-B's and Uryū's plan.
      - `[NEW:Foresight]`
    - `Prophetic dream` (M) — before dying, he **sent Yhwach a dream** of Ichigo cutting him down. Yhwach dismissed it as a delightful nightmare; it turned out to be the true future.
    - `Black (Soul King Reiatsu)` (A eps407–409):
      - Coats the blade to multiply its destructive power, and **slashes through several floors**.
      - **Auto-shields** him against blows.
      - **Heals** his wounds by covering or filling them with black.
      - Forms **solid ramps or slopes** to walk on.
      - Floods out in **torrents and tendrils** that crush strong barriers (Uryū's Icosahedron Barrier).
      - Fires **black thorns** that pierce arms and legs.
      - Binds wrists with a strand. **Spins around him** to repel flechettes.
      - `[MeleeArc][Shield][Heal/Reject][Construct][GroundWave][Projectile needle][Bind]`
    - `hAschwAlth` (A) — the vessel form above. Power on par with a Vollständig. `[Transform][Stance]`
- **Passives & weaknesses:**
  - **Passives:**
    - **The Balance**: damage is absorbed into the Freund Schild and reflected onto the attacker, with a short delay and a scales-tipping cue.
    - Power Amplification aura for Quincy allies.
    - Night: The Almighty foresight pulses.
  - **Weaknesses:**
    1. **No shield, no Balance.** Kirinji wrenched the shield out of his grip and hurled it away, then cut him down in the next exchange. While the shield is gone, damage lands on his body; it can be re-summoned later.
    2. **Limited foresight.** The 3-second cadence (see above). It only shows what he looks at.
    3. **Leidenhant (Sanrei Glove)** jammed onto him and broken strips Quincy powers. Uryū's attempt only failed because dawn had just swapped The Almighty back to Yhwach.
    4. **Antithesis** can swap wounds (though The Balance re-reflects them).
    5. **Auswählen**: Yhwach can drain him at will. His death also means The Almighty can be destroyed while he holds it.
    6. No Reishi air-walking (canon nuance).
- **Signature moments to recreate (story set pieces):**
  1. **Lichtreich childhood:** failing to shoot a rabbit; Bazz-B ("Jugo") takes him under his wing; the burnt forest and mansion; finding the broadsword in the ashes; five years training.
  2. **The selection:** Yhwach's Reiatsu flattens the village but Jugo stays standing; he is chosen as the "other half"; he **catches Bazz-B's Heilig Pfeil barehanded** to protect Yhwach.
  3. **Declaration of war (masked messenger):** Kajōmaru vertically bisected at the 1st Division.
  4. **Halving Tensa Zangetsu** with one stroke as Ichigo lunges at the departing Yhwach. The blade spins away and sticks in the ground.
  5. **Judgement of the defeated:** BG9 and Cang Du tied before the throne. The Balance turns their luck, and his sword goes through The Iron.
  6. **Shadow invasion and The Key:** Soldat pour from his six-pointed shadow. A Hagal rune and light beam spear the sky from the Silbern tower.
  7. **Royal Guard:** the Cage of Life splits in two. Kirinji's Kinpika duel, shield ripped away, one decisive cut.
  8. **Bazz-B's last challenge (Wahrwelt):** Burner Finger 1–4 and lava floors; arrow caught; arm severed; shoulder-to-hip bisection. Bazz-B, dying, admits his old friend finally beat him.
  9. **Night duel with Uryū:**
     - Triple-pupil reveal; lasers dodged by twisting at the last instant; running across flechettes as stepping stones.
     - A slash that drives Uryū down through several floors (A: the blade coated in black).
     - (A) Icosahedron Barrier crushed by black torrents; **hAschwAlth** materialises behind Uryū.
     - Leidenhant on his hand, but **dawn swaps him out** the second before.
     - The Balance scales tip; Antithesis; re-reflection.
  10. **The end:** Yhwach's Auswählen strikes him.
      - (M) After Ichigo's defeat, alongside Gerard. (A) Mid-fight, to break Tensa Zangetsu.
      - He insists it's an honour. He orders Uryū to **move Uryū's wounds onto him with Antithesis** and go save his friends.
      - He dies thinking of Bazz-B; his open hand shows Bazz-B's crest on the hilt.
- **Kit proposal:**
  - **Form I — Grandmaster (day)**
    - **Shift:** **Unseen Step.** A burst-dash that ends in a blade already drawn; it reads as a teleport-cut at range. **No Reishi air-step** (canon flavour). In the air he can **kick off any enemy projectile or construct** within reach (flechette-hopping), and off debris.
    - **LMB (Blade of Judgment):** precise knightly chain.
      - (1) rising cut → (2) horizontal → (3) **pommel strike** (stagger) → (4) overhead execution.
      - Forward: lunging thrust. Back: launcher with a shield-bash.
      - Air: 2 cuts plus a downward plunge. Sprint: draw-cut.
      - `[MeleeArc cut]`
    - **Hold LMB:** **Judgment.** A vertical bisecting cut. On a parried or blocking weapon it **sunders the weapon** (`Status: weapon broken`); vs structures it is a planar `Slice`.
    - **RMB:** **Freund Schild guard.**
      - Blocks melee.
      - Projectiles stick harmlessly into the ground around him (absorb).
      - **Perfect parry** banks double "misfortune".
    - **Q:** **Sword energy blast** (four-point curved star). Hold: three in a fan.
    - **E:** **The Balance: Tip the Scales.** Dump all stored misfortune onto the last attacker(s) as **matching wounds**. Hold E: spread it across everyone who scored a hit in the last 10 s.
    - **R:** **Fortune Inversion.** Mark a target for 6 s: their next "lucky" event becomes misfortune.
      - A block becomes a failed guard; a dodge becomes a trip; a defensive buff (iron skin, intangibility) **fails**.
      - On barriers and constructs: the target **splits in two**.
    - **F:** **Shadow Gate.** Drop a six-pointed shadow and summon a Soldat squad or reposition allies.
    - **Z:** **Arrow Catch.** A stance that snatches the next projectile mid-flight. Tap again to crush it or flick it back.
    - **X:** **The Key.** Sword raised, Hagal rune, a **pillar of light** that wrecks the area (big AoE blast plus vertical beam). In story mode it is a fast-travel to the Royal Realm map.
    - **G:** **Soul Distribution aura** toggle. Nearby Quincy allies get +power while it's on; Haschwalth gets nothing from it.
    - **C:** Reiatsu flare (gold-white, calm). Shrugs off enemy pressure effects (canon: he stood under Yhwach's pressure).
    - **T:** **Night swap** to Form II, if the world clock is night or the mode allows it.
    - **V:** **"World Harmony."**
      - For 8 s, **100 % of damage he takes** is absorbed into the shield.
      - At the end the giant scales appear and **every source is repaid in full**, ×1.5.
      - Reminiscent of the Brave Souls (G) special.
    - **Tab:** Execution mode (bonus vs bound or downed foes) · Soldat command orders · Re-summon Freund Schild · Hunting bow (youth costume move set).
  - **Form II — Mask of the Ruler (night, The Almighty)**
    - **Passive Foresight Pulse:** every 3 s he sees one **ghost (1 s ahead) of each enemy in view**. While a pulse is live, his RMB auto-parries and Shift auto-dodges the shown attack (hard cap: one per pulse).
    - Black Reiatsu aura; the eyes swap on transform.
    - **Q:** (A) **Black-coated slash**, a wave of black from the blade that cuts through floors.
    - **E:** (A) **Black torrent.** A swirling mass that chases its target and eats projectiles in its path.
    - **R:** (A) **Black thorns.** A volley of black spikes that pin limbs (Bind).
    - **F:** (A) **Black ramp.** Raise a walkable slope or bridge, his air mobility at night.
    - **Z:** (A) **Black mend.** Cover wounds with black to heal over time.
    - **X:** **Foreseen Verdict.** Spend the current pulse to guarantee that his next swing lands where the target *will be*.
    - **G:** Freund Schild re-summon. In this form, damage is mitigated by auto-black-shielding instead (A).
    - **T (hold):** **hAschwAlth** (A).
    - **V:** **"Despair Begins."** The black envelops him and he chains 5 foreseen strikes; each one is unblockable if the pulse was live.
  - **Form III — hAschwAlth (A)**
    - Vollständig-tier stats. Black sash VFX.
    - LMB: black-surging blade with long reach.
    - Q/E/R: as Form II, but double size. The torrent can **bury a whole floor**.
    - V: **Vessel of the King.** A wide black wave that crushes barriers and constructs, then a teleport-strike from behind.
- **AI notes:**
  - Calm, economical, never wastes words or motion. Stands still and lets enemies come.
  - **Doesn't chase** when he has foreseen the outcome.
  - Uses The Balance mostly passively: tanks hits so the reflection kills the attacker.
  - Executes downed foes.
  - At night he becomes **noticeably more emotional and blunt** and switches to an aggressive black-Reiatsu kit (anime).
  - Tells:
    - Lifts the blade level with his left hand under its tip before a Balance release; the scales shimmer.
    - Eyes flash blue between foresight pulses (vulnerability window).
  - Boss logic:
    - **Phase 1:** sword and shield; reflect.
    - **Phase 2 (night):** foresight dodges; flechette-hopping.
    - **Phase 3 (anime):** hAschwAlth.
    - **Scripted break:** Leidenhant or dawn swap.
- **Callouts:** *"Furointo Shiruto"* · *"Za Baransu"* · *"Ji Ōrumaiti"* (night) · *"Kagi o"* ("the key"; it is Yhwach's order to him) · a short flavour line paraphrasing his "the scales have tipped" remark, e.g. *"Tenbin wa katamuita"* (my rendering, not a verbatim quote).

---

## Gerard Valkyrie (ジェラルド・ヴァルキリー) — Sternritter "M", Schutzstaffel, Heart of the Soul King
- **Wiki:** https://bleach.fandom.com/wiki/Gerard_Valkyrie. Also [Godly Size](https://bleach.fandom.com/wiki/Godly_Size) and [The Gotei 13 & The Visored vs. Gerard Valkyrie](https://bleach.fandom.com/wiki/The_Gotei_13_%26_The_Visored_vs._Gerard_Valkyrie).
- **Roster tier:** **A.** Signature **giant / raid boss**, and playable with live size-scaling. The game's showcase for "destroys a city by being hit".
- **Canon power: 9.**
  - Single-handedly flattened four captains, several lieutenants and the eight Visored.
  - Fought Kenpachi's Bankai, Hitsugaya's completed Bankai and Byakuya's Senkei.
  - **Came back from bisection, freezing and shattering**.
  - Only Yhwach's Auswählen actually killed him.
- **Body:** 222 cm → **71 vox**.
  - Very tall, broad and heavily muscled; a booming, laughing presence.
  - Light blonde **shoulder-length** hair; a **thin black braid** circling the scalp; **pupil-less eyes**.
  - Under the helmet's mask: **red sideways-"M" marks** covering both sides of the face.
  - **Godly Size:** grows with damage, from ≈ 20–30 m at first trigger to ≈ 80–150 m at his largest *(est.)*. He towers over multi-storey towers, Kenpachi stands on his hand, and a fall of his body could crush the Seireitei far below.
    - Build Godly Size as a **world-voxel-scale rig (0.25 m voxels)**, with LODs keyed to scale steps.
  - Silhouette keys: **winged helmet**, big **round shield on the left forearm** (it doubles as the sword's sheath), red cape, X-belt.
- **Palette (hex estimates):**
  - **Skin & face:** skin #E6C3A2, shadow #B98F6E. Hair #F2E2A6, shade #CDB66E. Braid #121212. Eyes pale #E7EEF5, glowing white #FFFFFF when giant. Face marks red #B71C27.
  - **Armour & clothes:**
    - Helmet steel #BCC2CA with **white wings** #F2F1EC *(est.)*.
    - Cloak #EFEEE9 with Hagal rune #6D111A. **Cape red** #A3161F (shade #6E0F16).
    - Gauntlets steel #9097A1 *(est.)*. Trousers black #18181C.
    - X-belt, shin guards and knee discs white #ECEBE5. Buckle disc silver #C3C7CE.
  - **Weapons:**
    - Shield **bronze #A8703A + silver #C7CBD1**.
    - **Hoffnung blade black** #121216 (edge glint #3A3A44). Hilt black. V-guard star silver #C8CCD2, turning **gold #E6B93E** in Vollständig.
    - **Heilig Bogen red** #C3232B.
  - **Effects:**
    - Wings (anime partial Vollständig) red feathers #C8232E.
    - Aschtonig Reishi helmet and patterns pale gold #F2E3A8 / #E2B33C *(est.)*.
    - Enhanced Aschtonig body golden-white #F3E3A8, energy veins #E8B83A, plume #F7EBC0.
    - Hoffnung beams #FFE7A0 *(est.)*. Regenerated limbs carry **red marking lines** #C1121F.
- **Look by form/outfit:**
  - **Schutzstaffel Hooded Coat** (S5) over his armour.
  - **Battle gear:**
    - **Winged helmet** with a face mask.
    - White cloak with three buttons and a dark-red Hagal rune on the left; **red cape pinned at both shoulders**.
    - Gauntlets on both arms; black trousers; **white X-shaped belt with a disc buckle**; white shin guards with **discs on the kneecaps**.
  - **Helmet off** (Byakuya's Senbonzakura knocks it away): face marks, braid and glowing eyes exposed. It stays off in Godly Size.
  - **Partial Vollständig after the 2nd Auswählen:**
    - (A ep391) A **Quincy-Zeichen halo** plus **red feathery Heiligen Fliegen**.
    - (M) Plain feathered wings, same as every revived Schutzstaffel; no halo.
  - **Godly Size:** the same outfit scaled up. The cape still works as a wall.
  - **Aschtonig (Vollständig):**
    - A **Norse-style Reishi helmet**.
    - A **star spreading over the shield's rim**.
    - **Thick patterns over arms and legs**.
    - Hoffnung's star turns **gold**.
    - **No halo**. Wings appear and vanish at will.
  - **Enhanced Aschtonig** (M ch672–673): **re-forms from golden light** after being shattered.
    - The head becomes a **knight's-helm face with a vertical plume** running over the top and back of the head.
    - **Two large spikes on the shoulders**.
    - **No clothing**; golden energy patterns on shoulders and waist.
    - **Only roars**: the voice is gone.
  - **Death:** the Auswählen strips him to a **colossal skeleton** that topples onto the city.
- **Weapons:**
  - **Hoffnung** (希望の剣, "Sword of Hope"): a black **double-edged** sword with a black hilt and a **V-shaped guard with a star in the centre**, sheathed inside the shield. ≈ 1.3 m (≈ 42 vox) at human scale *(est.)*. It scales with him.
    - Shattered Senjumaru's needle; dented the Cage of Life; took Nozarashi with only a nick.
  - **Shield:** large, circular, bronze-and-silver, ≈ 1.1 m (≈ 35 vox) *(est.)*.
    - Took a direct slash from Kenpachi's sealed sword undamaged. **Cut in half by Kenpachi's Bankai**.
    - Can be **thrown** (Hitsugaya froze it in mid-air).
  - **Cape:** can be **stretched into a wall** to stop opponents getting past.
  - **Heilig Bogen:** a **large red bow with two sets of handles** (one bent at a smaller angle) carrying a thick string. Summoned by **clasping both hands, then pulling them apart**.
- **Forms & states (ordered):**
  1. **Sternritter M (human scale).**
  2. **Godly Size.** **Automatic** whenever he takes "massive harm" in a short window. Heals every wound and grows larger and stronger. **Stacks**: each new threshold grows him again.
  3. **Aschtonig** (神の権能, "Authority of God").
     - Activated through the **Quincy Cross inside his heart**. It can also be triggered by **drawing a Quincy Zeichen in the air with his own blood**.
     - In canon it fired when Kenpachi bisected him: a Zeichen rose from his remains, gathered his blood into a beating heart and pulled both halves together.
     - Works at any size.
  4. **Enhanced Aschtonig.** Triggers when his body is destroyed while in Aschtonig.
  5. *(Partial Vollständig after Auswählen; story state.)*
- **Abilities (complete, grouped by form/source):**
  - *Base*
    - `Reiatsu` — beyond most captains. Boasts he can take whole squads of captains and lieutenants at once. `[Field]`
    - `Swordsman` — "basic but precise" blows with enormous force. One swing **blew a hole through the Vestibule Road** and damaged the **Tree of Life**. `[MeleeArc smash][GroundWave]`
    - `Flying slash` — sends a slash wave through smoke (vs Ganju; Orihime deflected it). `[Projectile crescent]`
    - `Strength and leaps` — vaults across the vast gaps between Wahrwelt's branches in a single bound and crashes down in front of the Gotei. `[Mobility]`
    - `Cape wall` — `[Construct]`
    - `Heart of the Soul King`:
      - His heart is far tougher than the rest of him: (A ep392) it **glows red** and stopped Shigarami after an inch, then pushed the needle out.
      - **Precognitive immunity**: he never appears in The Almighty's visions.
      - `[Passive]`
    - `Blut Vene` — (A ep410) a Vene patch on his neck stopped Kenpachi's Bankai slash there. Racial for him in any case. `[Stance]`
  - *The Miracle* (奇跡, **"M"**; an honorary Schrift: an innate power of the Soul King's heart, not a gift from Yhwach)
    - `Probability manipulation` — "the thoughts of the people given form": **the more impossible an outcome, the more likely The Miracle makes it happen.**
      - Outnumbered by Byakuya, Shinji and Renji, his power rose to make victory possible.
      - Unable to sense the hidden Visored, he **found them anyway** "because it was impossible".
      - Game: an **Improbability meter** that rises with the number and strength of enemies around him, low HP and failed attacks. At thresholds it grants power steps, auto-reveals hidden enemies and lets him shrug off control effects.
      - `[NEW:Luck][Sensing/Stealth]`
    - `Damage → size (Godly Size)` (神の尺度, "God's Scale") — "a miracle born of the people's **fear**". He converts all wounds, fatal ones included, into **size and strength**.
      - Grows instantly and **heals completely**. "Largest he has ever been" after the Gotei barrage.
      - Godly Size feats:
        - (M) **Rips off and throws the top of a tower**; **backhands a building flat**; **swats Senbonzakura aside**; **exhales a gale** that blows Rukia and Renji away with rubble.
        - (M) Swats the Visored with his shield; brushes off Hiyori's triple Cero with his fist.
        - (A) Takes an incantation-less **Hadō #91 Senju Kōten Taihō** to the face without a scratch (it still hurts).
        - (A) Tanks the **combined Ceros of all eight Visored** and flattens them with a **lariat**.
        - (M) Winds up a punch to **drop the whole Wahrwelt branch** onto the Seireitei; stopped when Hitsugaya froze his arm.
      - `[Transform][NEW:Scaling][Grab/Throw][Blast]`
    - `Regeneration` — lost body parts regrow **in a flash of light, with red markings, stronger than before** (his arm after Kenpachi's cut).
      - If cut **vertically in half**, the **heart regenerates from his core and pulls the halves together with his blood**.
      - `[Heal/Reject]`
    - `Hope Infusion → Hoffnung damage reflection` — "the people's hope bundled together". **Damaging Hoffnung wounds the attacker disproportionately.**
      - A small nick becomes a huge gash on Kenpachi.
      - (A) Byakuya and Hitsugaya get identical stomach slashes when their Bankai chip it.
      - **Freezing the blade solid stops the effect**: Hitsugaya's completed Daiguren flash-froze it and then cut it in half harmlessly.
      - `[Absorb/Reflect/Redirect][NEW:DamageReflect]`
  - *Heilig Bogen*
    - `Torrent of power` — an **enormous arrow**: pure power with no special properties, to beat abilities that cancel effects. In canon it was frozen with the bow by Shikai Hyōketsu before he could fire. `[Projectile tunnel/explode]`
  - *Aschtonig (Vollständig)*
    - `Heiligen Fliegen` — wings on demand (flight) that also wrap Hoffnung in an energy aura. He sprouted them when Kenpachi's uppercut knocked him **off the edge of Wahrwelt**. `[Mobility]`
    - `Hoffnung energy beams` — two modes, both **levelling city blocks**:
      - **Charge a Cero-like sphere at the blade tip**, then fire it in a straight line.
      - **Release energy along the path of a slash** so everything it covered **detonates**.
      - `[Beam][Blast][Slice]`
    - `Enhanced durability` — completed Daiguren Hyōrinmaru's flash-freeze barely hurts him more than ordinary ice. He **breaks out of Shikai Hyōketsu**, saying he "can't be bound by this world's elements". `[Stance][NEW:StatusImmunity]`
    - `Shield throw` — a giant spinning shield throw. `[Projectile disc]`
  - *Enhanced Aschtonig* (M)
    - Reforms out of **golden light**, starting at the legs, after Ikka Senjinka destroyed his head and Daiguren froze and shattered his body.
    - Mindless, roaring, fires **energy blasts**, swipes at Rukia and Renji.
    - `[Transform][Heal/Reject][Projectile]`
- **Passives & weaknesses:**
  - **Passives:** Miracle meter; damage-to-size; limb regrowth; heart revival; Hoffnung reflection; immune to The Almighty.
  - **Weaknesses:**
    1. **The Quincy Cross in his heart**: destroying it is permanent death.
    2. **Auswählen** strips him instantly.
    3. **Freezing** Hoffnung disables the reflection.
    4. Being giant makes him a **huge, slow target**. Kenpachi tripped him by holding his foot so his own momentum toppled him. Hitsugaya pinned him by freezing arms and hands that touched him.
    5. "Basic" sword skill: he relies on power.
- **Signature moments to recreate (story set pieces):**
  1. **Royal Guard, round one (M):**
     - Emerges from Yhwach's shadow and tosses his cloak.
     - Shatters Senjumaru's needle; the slash **blows a hole in the Vestibule Road**.
     - Yells at Lille for leaving a corpse in His Majesty's path.
     - Nimaiya "dodges his hug" and drops him with one cut.
  2. **Revived (anime ep392):** pinned by Senjumaru's threads, Shigarami stalls at his **glowing heart**, he rips free and stomps her. Frozen in Senjumaru's glacier tapestry (A foreshadowing).
  3. **Soul King's palace:** catches the falling Pernida; sends flying slashes at Orihime, Sado and Ganju.
  4. **Wahrwelt, the Miracle (M ch654–671):**
     - A huge leap; the cape-wall; "come all at once".
     - Byakuya's Senbonzakura shreds his helmet off, then **a foot the size of a street** lands next to Rukia. Godly Size.
     - Tower-top throw; gale breath; flattening the captains.
     - Visored assault (A: all eight Ceros, then the lariat). Hitsugaya freezes the branch-drop punch.
     - Kenpachi cuts off his forearm; it **regrows with red veins**. He clashes with Nozarashi Shikai and the **chips reflect** onto Kenpachi.
     - Kenpachi's Bankai **bites and rips his arm off**, then cuts **hand and shield** in half. An uppercut sends him **off the edge of Wahrwelt**; wings out; **bisected vertically**.
     - **The heart rebuilds him** into Aschtonig. A sword beam levels the branch.
     - Hitsugaya's completed Bankai: shield frozen in mid-air, **Hoffnung frozen and bisected**, Heilig Bogen frozen with Shikai Hyōketsu. He breaks free.
     - Kenpachi topples him. **Ikka Senjinka** takes his head and he shatters.
     - **Golden plumed rebirth**.
  5. **Death:** the Auswählen beams strip him to bone and the **giant skeleton crashes** across Wahrwelt.
- **Kit proposal:**
  - **Form I — Noble Warrior (human scale)**
    - **Shift:** **Valkyrie Leap.** Huge bounding leaps that crater on landing. Ground Shift is a shield-forward charge.
    - **LMB:** Hoffnung and shield, heavy and simple: (1) overhead → (2) shield bash → (3) horizontal → (4) shockwave slam. Every hit chips terrain. Forward lunge = shield charge.
    - **Hold LMB:** **Road-Breaker.** An overhead that punches a crater or hole straight through bridges and floors.
    - **RMB:** shield guard (very high block strength). Timed parry: a bash that flings the attacker.
    - **Q:** Hoffnung **flying slash**.
    - **E:** **Cape Wall.** Stretch the cape across a corridor or street: a red barrier that blocks passage.
    - **R:** **Heilig Bogen.** Clasp and pull to form the red bow; tap for a large arrow; **hold** for the "torrent of power" mega-arrow (tunnels through structures).
    - **F:** **Miracle Sense.** Pulse that reveals hidden and invisible enemies and builds the Improbability meter.
    - **Z:** **Hope Infusion** toggle: while active, any damage to Hoffnung (blocked hits, clashes) is reflected ×3 on the attacker.
    - **X:** **Shield throw** (boomerang disc).
    - **G:** **Heiligen Fliegen** (red wings, flight).
    - **C:** golden-red Reiatsu flare. Laughs.
    - **T:** **Aschtonig.** Draw the Zeichen in blood in the air, then a pillar of light (works at any size).
    - **Passive — The Miracle:** a damage-in-window meter. Crossing the threshold **auto-triggers Godly Size** (Form II) with a full heal. Further thresholds grow him again.
    - **V:** **"A Miracle Requires a Crisis."** Instantly take the next Godly Size step, fully heal, and stomp everything nearby.
    - **Tab:** Hoffnung sheath and draw · Taunt "come at me all at once" (fills the Improbability meter faster the more enemies are locked on).
  - **Form II — Godly Size (giant)** (camera pulls far back; each step is a GroundWave)
    - **Shift:** a **giant stride or jump between city sections**.
    - **LMB:** backhand (demolishes a building) → hammer-fist → stomp. Down-in-air: a body-slam that craters a district.
    - **Hold LMB:** **Branch Breaker.** A charged punch into the ground that **cracks and collapses the whole platform or terrain chunk** under his feet. Needs a big `[Environmental]` collapse system.
    - **RMB:** giant shield block (blocks beams and petal swarms; parry flings them back).
    - **Q:** **Tower Toss.** Rip off a building top or terrain chunk and throw it. `[Grab/Throw][Environmental]`
    - **E:** **Gale Breath.** A huge exhaled cone that knocks back, lifts debris and blows out fires.
    - **R:** **Lariat** (A). Arm-out charge through a line of enemies and buildings.
    - **F:** **Grab & Crush.** Snatch a human-sized enemy and squeeze.
    - **Z:** giant **shield throw**.
    - **X:** **Hoffnung Beam.** Sphere-charge at the tip, then a straight city-levelling beam. Hold: a **slash-wake detonation**: swing, and everything under the arc explodes after a beat.
    - **G:** wings (lift the giant body).
    - **C:** Reiatsu of a god. Enemy Reiatsu reads as "too faint", which **jams enemy lock-on and sensing** briefly.
    - **T:** Aschtonig (also auto-triggers on "death" by bisection).
    - **V:** **Heart of the King.** If killed in this form, the heart rebuilds him at full HP once (canon revival).
  - **Form III — Aschtonig** (any size)
    - Norse helm look. Beams get +range; **immune to freeze, bind and elemental statuses** (`[NEW:StatusImmunity]`).
    - Wings at will.
    - **Auto-revive** into Form IV when destroyed.
  - **Form IV — Enhanced Aschtonig** (boss-only)
    - Mindless golden knight. Roars, swipes, energy volleys. No speech.
    - Can only be ended by an Auswählen-style drain, or by destroying the heart-cross (story weak point).
- **AI notes:**
  - Loud and jovial; praises strong foes; **challenges groups to attack together**.
  - **Wants to take damage**: he deliberately wades into hits early to charge The Miracle.
  - Never retreats; protects allies he likes.
  - **Phases:**
    1. Human: sword and shield, cape-walls choke points.
    2. On threshold, Godly Size cinematic (the helmet usually already gone).
    3. Giant: area denial; throws terrain at fast or far targets; gale vs fliers; tries to drop the platform when bored.
    4. When "killed": heart revival into Aschtonig (beams).
    5. When shattered: golden knight berserk until Auswählen.
  - Tells: he **sheathes Hoffnung in the shield** before switching to fists, and **pulls back his arm with a long laugh** before a ground-breaking punch.
- **Callouts:** *"Za Mirakuru"* · *"Kami no Saizu"* · *"Hōfunungu"* · *"Ashutonigu"* · *"Hairihhi Bōgen"* · battle laughs ("Gahaha!"). He introduces himself loudly by name and rank before big moves.

---

## Lille Barro (リジェ・バロ) — Sternritter "X", Leader of the Schutzstaffel, first ever Schrift-bearer
- **Wiki:** https://bleach.fandom.com/wiki/Lille_Barro. Also [Shunsui Kyōraku vs. Lille Barro](https://bleach.fandom.com/wiki/Shunsui_Ky%C5%8Draku_vs._Lille_Barro), [Nanao Ise vs. Lille Barro](https://bleach.fandom.com/wiki/Nanao_Ise_vs._Lille_Barro), [Trompete](https://bleach.fandom.com/wiki/Trompete), [Sabaki no Kōmyō](https://bleach.fandom.com/wiki/Sabaki_no_K%C5%8Dmy%C5%8D).
- **Roster tier:** **A.** The sniper: hitscan that ignores every collider. Escalates into an untouchable angel and then an owl-headed god.
- **Canon power: 9.**
  - Sniped the five Royal palace cities (a decoy) and punched X-Axis holes through Nimaiya past two Royal Guard blades.
  - Forced Shunsui into Bankai and **survived it decapitated**.
  - Erased a large part of a Wahrwelt city with one blast.
  - Undone only by **his own power reflected** (Nanao's Shinken Hakkyōken).
- **Body:** 182 cm → **58 vox**.
  - Adult, lean, upright and composed.
  - **Dark skin**; **short white hair** with short sideburns.
  - **Left eye always shut**, overlaid by a black **tattoo of an X inside a circle** (reads like a tilted ⊕).
  - Silhouette keys:
    - **Dark-green fur bicorne** (tiny Wandenreich emblem on each side).
    - **Dark-green furred pauldron on the right shoulder**.
    - Long white cloak.
    - **A rifle longer than he is** carried on the back, ≈ 2.2 m (≈ 70 vox) *(est.)*.
  - **Jilliel:** ≈ 3–4 m robed angel with **eight wings** *(est.)*.
  - **True form:** ≈ 6–10 m long *(est.)*: a towering body on long split stilt-legs, with a **long snake-like neck** and an **owl head**.
- **Palette (hex estimates):**
  - **Skin, hair, eyes:** skin #5B3A2B, shadow #3E271C. Hair #F3F3EF, shade #CFCFCB. Tattoo #121212. Open eye colour not documented; render dark #3A2A1E *(unverified)*.
  - **Clothes:**
    - Cloak #EFEFEA.
    - Gloves white #F2F2EE with a **winged-X embroidery** (thread colour *unverified*; suggest dark green #2C4632).
    - Sleeveless shirt light #E6E3DA.
    - Fur (pauldron and bicorne) #2C4632 / highlight #3E5E45.
    - Trousers dark green #2B3D2C. White leg panels #ECEBE6. Shoes #DCD9D0.
  - **Diagramm:** metal **black** #16171A, fur #2C4632, button #3A3A40, lens #1E2A24 with an X reticle. Reformed parts in **green Reishi** #46D17A.
  - **Shots:**
    - X-Axis shot: almost invisible. A faint green shimmer #7CF0A8 at the muzzle and along the line; **perfectly round holes**.
    - Bullet-type Heilig Pfeil: bright green-white #B8FFD2 *(est.)*.
  - **Jilliel:**
    - Robe #F4F4EE with dark holes.
    - **Wings green** #3DDB7C (translucent #9FF3C0), three holes each.
    - **Halo green** #4FE38A, oversized and thin.
    - White face lines #FFFFFF. Reiatsu green.
  - **True form:**
    - Fair head #EFD9C6. Owl eyes yellow #F0C030, beak #C9A060 *(both est.)*.
    - Neck fur white #F5F5F2.
    - **Gold** halo, wings and Reiatsu #F2C74E. Inner light #FFF6D0.
    - Arms white #F2F0EA.
    - **Trompete** gold #E9B93C.
  - **Remnant birds:** pale gold-white #F4E6C0 *(est.)*.
- **Look by form/outfit:**
  - **Schutzstaffel Hooded Coat** (S5).
  - **Battle dress:**
    - Long white cloak; white gloves with the winged X.
    - Light **sleeveless** shirt; dark-green furred pauldron on the **right** shoulder.
    - Dark-green trousers with **white trouser-leg pieces that have sections cut away near the calves** and are fastened up to the shirt.
    - Light shoes; furred bicorne.
  - **Both eyes open:** the left eye opens behind the glowing tattoo. Intangibility is active.
  - **Jilliel (Vollständig):**
    - A Quincy Zeichen forms in the air **centred on his left eye**.
    - A **huge white priestly robe/carapace riddled with holes** covers everything below the eyes, so he looks **mouthless**.
    - **Eight green wings, each pierced by three holes** (24 "barrels").
    - White lines across the face; an **oversized green halo**.
    - Echoing voice.
    - He can **split the robe's hem into a skirt over stilt-boots**, each with **two long downward points (toe and heel)**: deer- or stilt-like legs.
  - **Partial Jilliel after the Auswählen:** (A ep391) one pair of wings and a basic halo. (M) Generic feathered wings like the other revived Schutzstaffel.
  - **True form (evolved Jilliel):** after **beheading**, energy rises from the stump.
    - A **new fair-skinned head with slicked-back hair**, but **owl eyes, nose and beak**. The eyelids close sideways.
    - A **long snake-like neck with white fur along its back**.
    - A **shrunken, spiked halo**.
    - Boots stretched far out horizontally into a **split, centaur-like stance**.
    - Halo, wings and Reiatsu turn **gold**.
    - **Long white arms with pauldrons and long fingers** grow out.
    - **Pure light inside**: no organs or blood.
    - He can **flatten and stretch his head**, resize it, and **move his eyes anywhere on it**.
    - High-pitched voice.
  - **Remnants:** gold rain falls from his exploded body, and the pieces become **flamingo-like birds**: stubby wings, long necks and legs, heads like the true form.
- **Weapons:**
  - **Diagramm** (ディアグラム), his "bow": a **huge black-metal rifle** worn on the back under the cloak.
    - Receiver and forestock wrapped in **dark-green fur** fastened by **one button underneath**.
    - The massive **buttstock** has two thick, square, **wing-shaped fins** (one up, one down) to brace against shoulder and chest.
    - The **rear grip doubles as an oversized trigger guard** (right hand); a **foregrip** under the front (left hand).
    - **Extremely long, thin barrel** ending in a **plus-shaped muzzle with notched arms**.
    - **Scope with an adjustment knob** and an X-shaped reticle that echoes his tattoo.
    - It still fires with the barrel cut off. It can be **re-formed with green Reishi**: the fur goes missing and **holes along the top of the stock** show. A re-formed barrel is shorter, with no plus muzzle.
- **Forms & states (ordered):**
  1. **Sniper (left eye shut).**
  2. **Eye open (Intangibility).** Allowed only in crisis. **The third opening in one fight locks it open** for the rest of the battle.
  3. **Jilliel** (神の裁き, "Judgement of God").
  4. **Jilliel True Form.** Triggered by being **decapitated** or killed in Jilliel.
  5. **Remnants.** Triggered when his own power is reflected onto him or his halo is lost. Becomes an NPC swarm.
- **Abilities (complete, grouped by form/source):**
  - *Base*
    - `Master marksman` — aims at vital points from extreme range while firing fast.
      - Picked off Hisagi, Ōmaeda, Kiyone, Isane and Sentarō one by one from far away, unnoticed.
      - **Snipes the cities around the Soul King Palace** (a fabric decoy).
      - Uses a scope dial to range shots.
      - `[Projectile][Sensing/Stealth]`
    - `Reflexes` — first person ever to dodge Shunsui's Kageoni on the first try (leapt clear the instant the shadow blade rose). `[Mobility]`
    - `Heilig Pfeil bullets` — hyper-condensed Reishi bullets. **One shot can destroy a palace city** (Kirio Hikifune's assessment). A fast enough blade can still cut or deflect them: Nimaiya split one in two. `[Projectile tunnel/explode]`
  - *The X-Axis* (万物貫通, "Piercing All Things"; **"X"**; the first Schrift Yhwach ever granted)
    - `X-Axis shot` — not a bullet but an **intangible piercing force**.
      - It **instantly** puts a **perfectly round hole** in the target **and in everything on the straight line between muzzle and target**.
      - **Cannot be blocked**: it went straight between Kirinji's and Hikifune's crossed Zanpakutō into Nimaiya's chest.
      - It **stops at the chosen target**, so nothing behind is harmed. (A ep392) He shot Nimaiya while Yhwach stood right behind him.
      - "Dodging loses its meaning."
      - Game: a **true hitscan that ignores all colliders, guards and shields**. It carves a clean cylindrical tunnel (≈ 0.3–0.5 m diameter) through every voxel on the line and ends **at** the locked target.
      - `[Beam][NEW:PierceAll]`
    - `Intangibility ("quintessence")` — with **both eyes open**, The X-Axis applies to his own body: attacks **pass through him** (a blade slid out of his chest as if through liquid).
      - Claims no weapon in the world can kill him in this state.
      - Rule: the left eye stays shut until crisis; **after the 3rd opening in a fight it stays open**.
      - `[NEW:Intangible][Stance]`
  - *Jilliel (Vollständig)*
    - `Divine pressure` — his Reiatsu at activation **paralyses** even Shunsui for a moment. `[Status: paralysis][Field]`
    - `Flight` — `[Mobility]`
    - `Teleport` — appears as a **spiralling green circle that expands into his body**, so he can catch fleeing targets. `[Teleport]`
    - `24-barrel X-Axis` — fires X-Axis shots as **green energy** from any of the **24 wing holes**. **Six holes at once** produce a blast that **blows through a large part of a city** and severed part of the district under Shunsui. `[Beam multishot][Blast][NEW:PierceAll]`
    - `Permanent intangibility` — Kidō too: Hadō #78 Zangerin passed through him. `[NEW:Intangible]`
  - *Jilliel True Form*
    - `Divinity` — a "god's messenger" who **can only be hurt by his own godly power reflected back** (Shinken Hakkyōken reflects a god's power). `[NEW:Intangible]`
    - `Regeneration` — any damage that does land heals at once. He grew back from **decapitation** by Shunsui's Bankai finale, along with the holes, bleeding and illness the Bankai inflicted. `[Heal/Reject]`
    - `Light body` — wounds **spray sparks that maim** anyone touching them. `[Status: burn][NEW:DamageReflect]`
    - `Limb generation` — long white arms with pauldrons. `[Transform]`
    - `Head and eye shaping` — flatten, stretch and resize the head; relocate the eyes (all-round watch for shadows). `[Sensing]`
    - `Golden X-Axis light` — all-piercing light fired mainly from the new arms and fingers, at any range. `[Beam][Projectile][NEW:PierceAll]`
    - `Shadow-purging light ball` — a dazzling sphere from his fingertips **erases every shadow on the ground** to flush out Kageoni. The catch: it **casts shadows onto his own body**, and Nanao came out of the small shadow over his beak. `[Field: light][NEW:ShadowGate counter]`
    - `Sabaki no Kōmyō` (裁きの光明, "Ray of Judgement") — a raised arm and a chopping motion send out **expanding, ultra-fast waves of thin golden light**. They **pierce entire cities** and leave a trail of explosions along their path. `[Slice][Beam][GroundWave][Blast]`
    - `Trompete` (神の喇叭, "Trumpet of God") — draws in huge amounts of ambient Reishi to form a **golden trumpet with a wing-like flourish, bigger than himself**, floating above him. He holds a fist in front of his beak like a mouthpiece and **"blows"**.
      - The result is a **colossal X-Axis blast** in multi-hued spherical waves that **erases most of a Wahrwelt city**. The anime adds an actual trumpet sound.
      - Reflected back by Shinken Hakkyōken, it **erased a vertical strip of his own body**: left arm and wings sheared off, cracks all over, then an explosion into golden rain.
      - `[Beam][Blast][Environmental absorb]`
  - *Remnants (weakened clones)*
    - `Bird-clones` — many weak flamingo-like copies.
      - Shapeshift their heads; fire **energy blasts from in front of the mouth** that erase low-level Shinigami and explode on impact.
      - **Spin their heads** to fire in several directions in quick succession.
      - Hitting a shot while it's still charging makes it **explode on the clone**.
      - (M; removed in the anime) One kept Lille's mind, raged over his lost halo, and vowed to flatten the Seireitei out of spite for Shunsui.
      - `[Swarm][Projectile][Summon]`
- **Passives & weaknesses:**
  - **Passives:** perfect aim; X-Axis ignores defences; intangibility (eye-open or in Jilliel); regeneration (true form).
  - **Weaknesses:**
    1. **His own attacks reflected** at him bypass everything.
    2. **Destroy or remove the halo**: no more phasing or regeneration.
    3. The eye-shut rule: he refuses to use intangibility until the third crisis.
    4. **Shadow tricks**: Kageoni attacks from his own shadow. **Kageokuri** afterimages and **solidified-Reiatsu decoys** fool his Reikaku (he shot a hardened Reiatsu decoy of Shunsui).
    5. He is easily unsettled by things he doesn't understand.
    6. Remnants: charge disruption; Auswählen drained them.
- **Signature moments to recreate (story set pieces):**
  1. **Royal Guard, round one (M):**
     - Translates Pernida's mumble ("size doesn't matter").
     - "The losing side is always slow to understand." A bullet through "Senjumaru's" head.
     - **Shoots down the five floating cities**, which turn out to be fabric.
     - Cage of Life branches grow faster than his rapid fire can pierce.
     - Nimaiya **splits his bullet in two**, cuts the gun, and cuts him down.
  2. **Revived (M):** two fist-sized holes appear in Nimaiya's shoulder. "Line up so I can kill you in one shot." The **X-Axis goes through two crossed Zanpakutō**. (A ep392) He phases through Sayafushi and shoots Nimaiya with Yhwach right behind him. (A) Trapped in Senjumaru's eight-mirror hall, his shots come back as holes in his own body: foreshadowing.
  3. **Wahrwelt sniper alley (M):** stragglers drop one by one with fist-sized holes. Shunsui gets "shot", and it's a Reiatsu decoy.
  4. **Shunsui duel (M ch644–649):**
     - Daruma-san ga Koronda severs most of the barrel; Kageoni dodge; Kageokuri clones; the barrel cut again and re-formed in metal.
     - Impaled, he opens the eye: "third time".
     - **Jilliel** paralysis and three wing shots; the tower blasted apart; Zangerin does nothing.
     - Karamatsu Shinjū's darkness: **shared wounds, wasting illness, drowning in a bottomless sea, a thread around the neck**, and his head explodes.
  5. **God's messenger reborn (M ch649–653):**
     - The headless body shoots Shunsui through the gut. An **owl head on a long neck** rises from the stump; arms grow.
     - **Sabaki no Kōmyō** splits the city.
     - He flattens his head looking for Shunsui; light ball vs Kageoni; Nanao drops out of the shadow over his beak.
     - **Shinken Hakkyōken cuts off his hand**.
     - **Trompete**, then reflection: he shatters into golden rain falling on the Seireitei.
  6. **Remnants vs Izuru Kira** in the burning Seireitei; Kira calls himself "a dead man". The final Auswählen drains them away.
- **Kit proposal:**
  - **Form I — Sniper (eye shut)**
    - **Shift:** Hirenkyaku **backstep or reposition**; prefers rooftops. Double-tap with lock-on: blink to a high perch with line of sight to the target.
    - **LMB:** **rapid Heilig Pfeil bullets** (fast projectiles, small craters). Close-range combo: stock-butt → hip shot → wing-fin smash. Air: downward shots.
    - **Hold LMB:** **Scoped Shot.** Zoom, range dial, charged hyper-condensed bullet that **destroys a building or city section** on impact.
    - **RMB:** rifle guard. Timed tap: **reflex leap** (vertical dodge that auto-evades ground-emerging attacks such as shadow blades and traps).
    - **Q:** **The X-Axis.** Hitscan pierce-all to the locked target. Tunnels a perfect hole through everything in between; cannot be blocked or parried. Stops at the target, so it is friendly-fire safe.
    - **E:** **Cull the Straggler.** Mark up to 5 enemies flagged as isolated, injured or slow; Q then auto-cycles through them.
    - **R:** **Bullet Hail.** Fan of bullet Heilig Pfeil.
    - **F:** **Diagramm Reform.** Rebuild a damaged rifle in green Reishi (clears `weapon damaged`; the re-formed look is shorter, fur missing, holes along the top).
    - **Z:** **Long Snipe.** Map-scale shot at any visible structure or landmark (deletes a building or bridge from huge range).
    - **X:** **Pierce Line.** An X-Axis variant that targets a spot on the ground. Every enemy standing on the line gets holed (canon: "line up so I can kill you all with one shot").
    - **G:** **Open the left eye.** Intangible for 4 s. Counter shows "1/3, 2/3". The **third opening locks it open** for the rest of the match and unlocks T.
    - **C:** green Reiatsu flare: a **beacon** that briefly reveals him and paralyses weaker enemies.
    - **T:** **Jilliel.** Zeichen over the left eye, then a pillar. Requires a 3rd eye opening or 50 % meter.
    - **V:** **"Sinners in a Row."** Time slows; tag every enemy in view; release fires simultaneous X-Axis shots through all of them and all the buildings between.
    - **Tab:** Scope zoom levels · ammo swap (bullet / X-Axis) · Daten (reveal the target's known abilities: the Wandenreich has "data on every captain").
  - **Form II — Jilliel (green angel)**
    - **Passive:** **permanent intangibility** (blade, Kidō, explosions all pass through). Exceptions: his own power reflected; halo shattered.
    - **Shift:** **Spiral Teleport** (green circle expands into him).
    - **Mobility:** 8-wing flight; robe-to-stilts landing animation.
    - **LMB:** single-hole wing shots: 24 independent barrels, auto-aim spread.
    - **Hold LMB:** **Six-Hole Blast.** City-section erasure in a line.
    - **RMB:** wing-wrap. Doesn't block; repositions or teleports.
    - **Q:** X-Axis from any hole (pierce-all).
    - **E:** **Judgement Pressure.** Reiatsu pulse that paralyses for 1 s in radius.
    - **R:** **24-Barrel Barrage.** Saturates an area.
    - **F:** **Descent.** Drop onto the stilt-points: a stomp that pins.
    - **Z:** Diagramm X-Axis (if still carried).
    - **X:** **Teleport-Snipe.** Blink behind the target and fire point-blank through it.
    - **G:** robe ↔ stilt legs (ground stance vs hover stance).
    - **C:** green god-flare.
    - **T:** (auto) True Form on lethal damage or decapitation.
    - **V:** **Judgement of God.** All 24 holes converge on one point: a giant green column that bores a pit through the terrain.
  - **Form III — True Form (owl god, gold)**
    - **Passive:** only reflected own-power damages him; instant regeneration; **spark-burst** maims melee attackers.
    - **Shift:** teleport. **Head-stretch** lets him "peek" around cover and relocate eyes.
    - **LMB:** **long-arm slashes and golden finger-beams**.
    - **Hold LMB:** **Sabaki no Kōmyō.** Arm chop: thin golden waves that cut through cities and leave explosion trails. `[Slice]`
    - **Q:** Golden X-Axis volley.
    - **E:** **Light Ball.** Erases all shadows in a big radius: cancels Shadow portals, Kageoni and shadow-hiding. Creates shadows on him, a deliberate counter-window.
    - **R:** **Grow Arms.** Extra pairs of attack arms (more beam sources).
    - **F:** **Owl Eyes.** 360° vision while held.
    - **X:** **Trompete.** 1.5 s Reishi draw (voxels around dissolve upward into the trumpet), then a **sector-erasing blast**.
    - **V:** **Last Trumpet.** Bigger Trompete; fills the screen.
  - **Form IV — Remnants (NPC):** a flock of bird-clones; area denial; dies to Auswählen.
- **AI notes:**
  - Zealot. Calls everyone "sinners"; believes he is God's messenger and Yhwach's masterpiece.
  - Starts **far away**, picks off isolated targets first, and stays out of melee.
  - Reacts badly to the unexplained: brief freeze-frames, and he backs off to re-scope.
  - Opens the eye only when hit or cornered. Ramps to Jilliel on the third opening.
  - In true form he talks down, **hunts shadows**, and spams Sabaki no Kōmyō before the Trompete finale.
  - Tells: **adjusts the scope dial** before a long shot; the tattoo glows green before intangibility; draws a fist to his beak before Trompete.
- **Callouts:** *"Ji Ikusakushisu"* · *"Diaguramu"* · *"Jirieru"* · *"Sabaki no Kōmyō"* · *"Toronpēte"*. Taunt bark: *"Tsumibukai"* ("sinful"), his recurring word for enemies (single word, not a quote).

---

## Pernida Parnkgjas (ペルニダ・パルンカジャス) — Sternritter "C", Schutzstaffel, Left Arm of the Soul King ("Progress")
- **Wiki:** https://bleach.fandom.com/wiki/Pernida_Parnkgjas. Also [Mayuri Kurotsuchi & Nemu Kurotsuchi vs. Pernida Parnkgjas](https://bleach.fandom.com/wiki/Mayuri_Kurotsuchi_%26_Nemu_Kurotsuchi_vs._Pernida_Parnkgjas) and [Mimihagi](https://bleach.fandom.com/wiki/Mimihagi) (its counterpart, the Right Arm, "Stillness").
- **Roster tier:** **B.** Horror boss and creature encounter. Playable later as a "monster" character (hand locomotion, puppeteering, clones).
- **Canon power: 8.5.**
  - Crushed a giant Divine Soldier into a ball with a breath.
  - Wrecked Kenpachi's arm instantly, so he had to tear it off; then folded his whole body.
  - Evolved past Mayuri's Bankai counters.
  - Only fell to Nemu's sacrifice and Mayuri's cell-bomb trap.
- **Body:**
  - **Cloaked:** **150 cm → 48 vox**, shorter than most Quincy and Shinigami. A small hooded figure; the face is pure shadow with **two glowing eye-points**.
    - In its manga debut a **human-like arm** showed from the cloak. Kubo says it was meant to take humanoid shape at will.
  - **True body: an enormous pale left hand.**
    - **Chains link the fingertips together.**
    - A **large eye in the centre of the palm** with **polycoria**: two pupils and golden irises.
    - Once the chains break it grows the rest of a giant **left arm**, ending in a stump with **tendon, muscle and bone spilling out**.
    - It stands the arm upright by **anchoring nerves into the ground**, towering over Ikkaku and Yumichika (≈ 8–12 m *(est.)*).
    - It can keep growing into a **gargantuan arm above the Wahrwelt rooftops** (A ep400; ≈ 30–60 m *(est.)*).
  - Wrist bears a **Hagal rune** (clones lack it).
  - Gender: none ("it").
- **Palette (hex estimates):**
  - **Cloak:** #EFEEE9 (shade #C5C6CB). Hagal rune dark red #6D111A. Hood void #0C0C10. Glowing eyes gold-yellow #FFD34D *(hue est.)*.
  - **Hand:** skin pale **#E9DED3** (shade #BFAE9F). Nails #D9C8BA. Chains dark iron #4B4B52 *(est.)*.
  - **Palm eye:** sclera #F1EDE6, **iris gold #D9A520**, two black pupils.
  - **Stump:** muscle #8E2A2C, tendon #EDE3D2, bone #E6DCC6, blood #6E0E12.
  - **Nerves:** dark sinewy threads #2A2228 with pale highlights #E8D0C8 where exposed. Some depictions read them as "shadowy tendrils" *(colour unverified)*.
  - **Vollständig (A):** halo and hand-wings **yellow-gold** #F2C84B / translucent #F7DD84. Reiatsu yellow-gold.
  - **Heilig Bogen:** pale gold-white #F3E7B0 *(est.)*.
- **Look by form/outfit:**
  - **Cloaked Schutzstaffel:** long white cloak, three buttons, dark-red Hagal rune on the side, deep hood.
    - It mutters unintelligibly; Lille translates.
    - Under the hood, its "head" **swells and ripples** when hurt.
  - **Hand (cloak shredded):** palm eye exposed; fingertip chains.
  - **Arm (chains broken):** full arm grown from the wrist; nerve roots splayed into the ground; it stands like a tree.
  - **Clones:**
    - A severed finger **sprouts more fingers and eyes** and grows into a full hand and arm.
    - Only **one pupil** and **no wrist rune**.
    - Scraps of a torn-up clone grow **eyes and fingers** and stay alive.
    - While eating, a clone grows a **tongue with an eyeball** on its palm.
  - **Vollständig (A ep391):** a **Quincy-Zeichen halo** and **two wings shaped like huge flat hands** (prehensile).
- **Weapons:**
  - **Heilig Bogen:** a large traditional bow formed **between ring and index fingers**, drawn and loosed **with the thumb**.
    - **Five small bows over its fingertips** for volley fire.
    - Arrows are huge; one **destroyed a tower**.
    - Arrows can carry **nerve tethers**.
  - Clones can make bows too.
- **Forms & states (ordered):**
  1. Cloaked.
  2. Hand, then Arm (tear cloak → break chains).
  3. Evolved giant arm (grows after absorbing data or biomass).
  4. *(A)* Vollständig.
  - **Clones** can be spawned at any stage.
- **Abilities (complete, grouped by form/source):**
  - *Base*
    - `Hirenkyaku expert` — appears behind Shunpo master Yoruichi the instant Yhwach calls its name, and strikes before she reacts. `[Teleport][Mobility]`
    - `Reiatsu` — beyond captain level. `[Field]`
  - *The Compulsory* (強制執行, "Compulsory Execution"; **"C"**; honorary Schrift: it has always had this power)
    - `Nerve invasion` — shoots **nerves from its fingers into a target's body** and takes over their movement, its eyes glowing each time.
      - Uses: **twisting limbs into spirals**, turning an arm into a **puddle of blood**, folding a whole body until the legs break.
      - **Crushing a giant into a compact ball** (the Second-Level Divine Soldier).
      - **Compressing a corpse into a ball** to clear Yhwach's path (Senjumaru's decoy).
      - **Forcing a victim's own weapon toward their head.**
      - Only counter in canon: **amputate the invaded limb** fast (Kenpachi tore his own arm off; Nemu cut hers off).
      - `[Bind][Status: mind control][NEW:Puppet][Grab/Throw]`
    - `Inorganic compulsion` — sends nerves into **stone and buildings** and raises **giant stone left hands** from the ground and walls. They **clap** a target between them or ripple a building's wall outward. `[Construct][Grab/Throw][NEW:TerrainLimbs]`
    - `Nerve storm` — fires thick nerves in every direction, **ripping up the ground** and **punching holes in buildings**. `[Projectile needle][Environmental]`
    - `Remote Compulsory` — a severed finger opens an **eye on its knuckle** and infects whoever is holding it (Mayuri). `[Summon][NEW:Puppet]`
    - `Nerve-tethered arrows` — Heilig Pfeil with nerves on the fletching **infiltrate the target**. If they miss, **nerves laid through the ground steer them back around**. `[Projectile homing][Bind]`
  - *Progress / Evolution* (前進, "advance")
    - `Adaptive replication` — **learns from everything its nerves touch**.
      - Took on **Kenpachi's power level and mentality**: started talking like him and calling Mayuri by surname.
      - Copied the modified Ashisogi Jizō's **layered nerves**, so it could **shed skin layers** infected by Mayuri's nerve-freezing agent.
      - `[NEW:Evolve][NEW:AbilityTransfer]`
    - `Organic evolution` — eats biomass to gain traits. It backfired when the clone ate Nemu's flesh with its cell-division organ and swelled until it exploded. `[NEW:Evolve][Absorb]`
    - `Anatomy manipulation` — grows appendages, sheds parts, changes size up to a towering arm (size growth: A ep400). `[Transform][NEW:Scaling]`
    - `Self-replication` — each severed finger becomes a **clone** with full powers: Compulsory, bows, regeneration. It will **rip off its own fingers on purpose** to spawn them. `[Summon][NEW:SelfReplicate]`
    - `Regeneration and reconstitution` — regrows lost fingers instantly. Reforms from **shreds**; pieces sprout eyes and fingers and keep fighting. `[Heal/Reject]`
    - `Speech evolution` — starts with mumbles, gains vocabulary mid-fight, mimics Mayuri's laugh, and at one point speaks in a **deeper voice** ("I have always been a Quincy").
  - *Soul King part*
    - `Precognitive immunity` — absent from The Almighty's visions. Explicit in the anime (ep390); in the manga it is the shared rule for the King's parts. `[Passive]`
    - `Limb occupancy` (A ep390) — can live inside another being's **left arm**, as Ichibe'e carried it 1,000 years ago. `[NEW:Possession]`
    - `The Almighty's bane` (A ep390) — can show wielders of The Almighty the Soul King's past, and **seal The Almighty for up to a thousand years** by engulfing the target in a **spectral version of its arm**. Ichibe'e did exactly this to Yhwach at the truce. `[Status: seal][NEW:FateRewrite counter]`
  - *Vollständig (A ep391)* — Zeichen halo; **prehensile hand-shaped wings** that grab and strike; fast flight; yellow-gold Reiatsu.
    - (A ep392) Crushed Hikifune's sprouting wood and burst out of a building-size wooden prison.
    - `[Transform][Mobility][Grab/Throw]`
- **Passives & weaknesses:**
  - **Passives:** regeneration; evolution (stacks copied traits); clone spawn on finger loss; immunity to foresight.
  - **Weaknesses:**
    1. **Exposed nerves**: acid or chemicals cause agonising pain and make it pull back.
    2. **Changing the anatomy** of an invaded limb breaks its control (Mayuri re-stitched his own arm).
    3. **Strong electric shocks** drive nerves out.
    4. **Concentrated anaesthetic in the air** neutralises nerves in the ground and arrows.
    5. **Overwhelming raw force** blows it apart (Nemu punched a hole through the palm).
    6. Eating poisoned biomass makes it self-destruct.
- **Signature moments to recreate (story set pieces):**
  1. **Royal Guard (M):**
     - Inhales, and the giant Divine Soldier is **twisted into a ball**.
     - Folds Senjumaru's "corpse" into a ball and rolls it aside.
     - Nimaiya throws Sayafushi through it.
     - (A ep392) Crushes Hikifune's wood cage from inside and flies at her.
     - Sinks in Senjumaru's black-sand pit (A).
  2. **"Pernida."** Appears behind Yoruichi on Yhwach's word; her **arm corkscrews**. It **falls off the crumbling palace** and Gerard catches it.
  3. **Vier Ast (M ch635–643):**
     - Kenpachi's first slash cracks its hooded head open, which bleeds and **swells**, but **his own arm spirals** in exchange. He **tears the arm off** before it can turn his sword on himself, and it is wrung into a puddle.
     - Nerves riddle buildings; **Kenpachi folds** until Mayuri paralyses him to save him.
     - Mayuri's acid; the cloak shreds into the **giant hand**, which grows its arm.
     - "My name is Pernida Parnkgjas."
     - **Stone hands from the street and a tower clap shut**; Mayuri's explosive armour blows.
     - The pinky clone. The modified Ashisogi Jizō **swallows it and its clones**, and it shoots its way out of the stomach.
     - Five-bow barrage with nerve arrows; Nemu **cuts off her own arm** to stop an infected arrow.
     - Nerve-freezing agent, shed off. **Nemu punches a hole through the palm**; the clone explodes her; Mayuri's cell-division bomb pops the clone.
- **Kit proposal:**
  - **Form I — Cloaked**
    - **Shift:** **Phantom Step.** A Hirenkyaku blink that always appears **behind** the target. Doubles as "summon to Yhwach's side" in co-op.
    - **LMB:** short-range nerve flicks from the sleeves: pokes that **stack "Compulsion"** on a limb.
    - **Hold LMB:** **Compulsory Grip.** Lock onto one limb. The limb twists (disabled, DoT) and, if held, the **whole body folds** (big damage plus stun).
      - Victim counter: **Self-Amputate** (lose the limb, break free). Electricity or acid also frees.
    - **RMB:** nerve-net guard (catches projectiles in mid-air and crushes them).
    - **Q:** **Nerve Lance.** Nerves bore into buildings or terrain.
    - **E:** **Stone Hand.** Infest a surface: a giant stone left hand rises to slam or grab (2 charges = clap).
    - **R:** **Heilig Bogen** (finger bow; huge arrow; tower-killer).
    - **F:** **Crush to Ball.** Compress a target, corpse or object (car, statue, golem) into a dense ball, which can then be thrown.
    - **Z:** **Evolve.** Absorb data from the last thing its nerves touched: copy a stat profile and one passive (e.g. the target's strength, armour-shedding, elemental resistance) for the match.
    - **X:** **Finger Sever.** Spawn a clone (AI) from a torn-off finger.
    - **G:** eyes-glow "focus": Compulsory grips are faster, but its own nerves become exposed to counters.
    - **C:** silent pressure; the hood ripples.
    - **T:** **Unveil.** Shred the cloak into the giant **Left Hand** (Form II). Hold T: break the chains into the **Arm**.
    - **V:** **Progress.** Rapid evolution: grow several size steps (to a gargantuan arm), regenerate fully, and gain all copied traits at double strength.
  - **Form II — Left Arm** (giant)
    - **Shift:** **finger-gallop** (runs on its fingertips) or a nerve-root slingshot. Air: anchors nerves to walls and swings.
    - **LMB:** finger swipes → palm slam → backhand. Down-in-air: a palm-flat crush that craters.
    - **Hold LMB:** **Palm Crush** (grab and squeeze).
    - **RMB:** fold the fingers into a shield (closed fist).
    - **Q:** **Nerve Storm.** Radial nerve barrage that rips up the ground.
    - **E:** **Twin Stone Hands** (clap trap).
    - **R:** **Five-Bow Volley.** Five fingertip bows with **nerve-tethered homing arrows** that re-route through ground nerves.
    - **F:** **Self-Replication** burst. Tear off 2 fingers, spawn 2 clones, regrow the fingers.
    - **Z:** **Layer Shed** (cleanse statuses: poison, freeze, paralysis, nerve agents).
    - **X:** **Devour.** Consume biomass or a corpse to heal and gain its traits.
    - **G:** **Palm Eye** toggle: an all-seeing pulse that reveals stealthed enemies.
    - **C:** yellow-gold Reiatsu (in Vollständig).
    - **T:** **Vollständig** (A): halo plus hand-wings. Flight; the wings grab and throw.
    - **V:** **Gargantuan Arm.** Grow to tower over the city; every structure in reach becomes a nerve-puppet hand for 15 s.
- **AI notes:**
  - Silent, creepy, proud of being a Quincy. **Insults to the Quincy enrage it**: increased aggression and a forced unveil.
  - Opens with Compulsory at range rather than melee.
  - Rips off its own fingers when outnumbered, to make clones.
  - Learns: each time the player uses a technique on it, it gains resistance to that technique (a visible "adapted" icon).
  - Tells:
    - **The eyes under the hood / the palm eye glow** right before a Compulsory grab.
    - **The hood bulges and ripples** before an unveil.
    - Fingers twitch before stone hands rise.
  - Weak-point script: exposing nerves (acid) or shocking it staggers it; anatomy-change items break a grab.
- **Callouts:** *"Za Konparusorī"* · *"Hairihhi Bōgen"*. Mostly unintelligible murmurs evolving into speech: barks of its own name (*"Perunida Parunkajasu"*), *"Kuinshī da"* ("I'm a Quincy", my rendering), and a mimicked cackle.

---

## Askin Nakk Le Vaar (アスキン・ナックルヴァール) — Sternritter "D", Schutzstaffel (the only member promoted from the ranks)
- **Wiki:** https://bleach.fandom.com/wiki/Askin_Nakk_Le_Vaar. Techniques: [Gift Ball](https://bleach.fandom.com/wiki/Gift_Ball), [Gift Ball Deluxe](https://bleach.fandom.com/wiki/Gift_Ball_Deluxe), [Gift Bad](https://bleach.fandom.com/wiki/Gift_Bad), [Gift Bereich](https://bleach.fandom.com/wiki/Gift_Bereich), [Gift Ring](https://bleach.fandom.com/wiki/Gift_Ring). Battles: [Yoruichi Shihōin vs. Askin](https://bleach.fandom.com/wiki/Yoruichi_Shih%C5%8Din_vs._Askin_Nakk_Le_Vaar), [Kisuke Urahara vs. Askin](https://bleach.fandom.com/wiki/Kisuke_Urahara_vs._Askin_Nakk_Le_Vaar).
- **Name check:** his Vollständig is **Hasshein** (神の毒見, "God's Poison-Taster"). **"Todesschnee" is not a canon name** for anything of his. Full technique list: Gift Ball, Hybrid Gift Ball, Gift Bad, Gift Ball Deluxe, Gift Bereich, Gift Ring, plus the Reishi Staff.
- **Roster tier:** **B.** A zone-control poisoner: slow, smug, deadly, and immune to whatever you just hit him with.
- **Canon power: 8.**
  - Brought Nimaiya to his knees with his own blood.
  - Floored Grimmjow, Ichigo, Sado and Orihime, then Yoruichi and Yūshirō.
  - Forced Urahara into Bankai and was only killed by an ambush Urahara planned in advance.
- **Body:** 187 cm → **60 vox**.
  - Tall and **slim**, loose and lazy posture; fair skin.
  - **Neck-length black hair slicked back**, except **one strand falling down his face to the mouth**.
  - High cheekbones; **kinky ("wiggly") eyebrows**; full lips; **lavender eyes**.
  - Silhouette keys: **gathered harem trousers tucked into pointy boots**, a ribbed V-collar, a **stack of three coloured bracers on the left wrist**.
- **Palette (hex estimates):**
  - **Skin, hair, eyes:** skin #F0DCCC, shadow #C9AE9B. Hair #131216. Eyes **lavender #B39BD8**. Lips #C99A92.
  - **Clothes:**
    - **Ribbed V-collar light grey** #CACACE.
    - Long-sleeve shirt white #F2F2EF with a grey ribbed hem #B8B8BC. **Disc brooch grey** #9A9AA1 (pink #E79AB9 in the colour manga).
    - Harem trousers white #F1F1EE with grey ribbing.
    - **Boots black** #17171A, grey soles #8A8A91, knobbed hoop trims #9C9CA3.
    - Wandenreich cloak #EFEFEA. Schutzstaffel hooded coat with a **red** Hagal rune #8E1620.
  - **Bracers on the left wrist:** **magenta #C0186F, pink #F07DB2, orange #F08A2A**. Disc knobs grey #8E8E95 (pink in the manga), one stamped with a **Quincy Zeichen**.
  - **Bow:** white stave #F4F4F2, string blue #6CB6FF. Arrows blue #8CC6FF.
  - **Poison:**
    - Miasma **purple-violet** #8B3FD1, glow #C79BFF. Alternative green #5DBE4A.
    - **Gift Ball glossy purple** #9850DA, highlight #E0C4FF (blue in the coloured ch543).
    - **Gift Bad oil-slick**: iridescent green #3E7A3C ↔ purple #7A3FA6, sheen #C6F0B0.
  - **Hasshein:** Reishi **purple** #9C5CEB (bright #D3B0FF); **orange see-through visor** #FF9A3C at 50 %.
- **Look by form/outfit:**
  - **Sternritter (1st invasion):** white Wandenreich cloak with a **standing collar and lapels**, buttons shaped like the emblem, and the **emblem on the back**.
  - **Schutzstaffel:** the hooded coat (S5) with a big **red Hagal rune on the left front**.
  - **Wahrwelt, cloakless:**
    - Light-grey ribbed **V-neck collar** over a long-sleeved white shirt with a grey ribbed hem; a front overlap holding a **grey disc brooch**.
    - White **harem trousers** with grey ribbing, tucked below the knee into **black pointed boots with grey soles and knobbed hoops**.
    - Three stacked **bracers on the left wrist** (magenta, pink, orange) with grey disc knobs; the bow comes out of the Zeichen knob.
  - **Burned:** Yūshirō's fire burns the shirt away, leaving **only the ribbed collar** on a bare torso.
  - **Partial Hasshein** (anime depiction): a rounder star halo and two wings that are each a single beam.
  - **Hasshein (full):**
    - **Two wings**, each two **purple Reishi beams linking circles in a zigzag**, like **molecular chains**.
    - A floating **belt of linked circles** at the waist (dropped in later chapters).
    - **Ring-and-bead bracelets**: one above the left wrist and three above the right. The wiki's count says five, which doesn't add up; treat as ≈ 4–5.
    - Bare upper body except the **ribbed grey collar**; **purple Reishi trousers and boots**; one **anklet** per foot.
    - **Free-floating Reishi circles**: five over the left arm, three over the right forearm, and **ten stuck to the abs** (one over the navel, nine fanning out in a ⊥ shape).
    - **Purple Zeichen halo with a circle on every point**.
    - An **orange, transparent visor** over the eyes.
- **Weapons:**
  - **Heilig Bogen:** a longbow drawn out of the Zeichen knob on his left bracer.
    - **Blue Reishi string**; a solid **white** stave, round in section at the limbs, with the **middle made of rings linked in a zigzag**.
    - Can also **spring out of two bracers at once** so the bow sits braced on his wrist without being held.
  - **Heilig Pfeil:** medium arrows with **Zeichen-shaped fletching**, 2–3 per shot. He also fires them **from a finger-gun**.
  - **Reishi Staff (Hasshein):** a long, **flexible purple rod studded with balls**.
    - It extends into a **vaulting pole**.
    - Each ball can split into **up to five Gift Balls**.
    - When prepping Gift Balls, both ends branch into **vein-like segments**.
  - **Bracelet rings:** thrown as Gift Rings.
- **Forms & states (ordered):**
  1. **Base** (he lives in "Lethal Dose" mode; no form change).
  2. **Partial Hasshein** (after the Auswählen; anime look).
  3. **Hasshein** (神の毒見, full Vollständig).
- **Abilities (complete, grouped by form/source):**
  - *Base*
    - `Hirenkyaku expert` — **leaps back at exactly the speed of Nimaiya's swing** so the cut looks fatal but isn't. Keeps pace with Yoruichi and gets behind her Raijin Senkei. `[Mobility][Afterimage]`
    - `Hand-to-hand` — dislikes melee but drops a recovering Yoruichi with **one gut punch**; kicks; dodged a Shunkō blow. `[MeleeArc smash]`
    - `Durability` — took Raijin Senkei, which levelled a block, with light wounds, then survived Bakuen Musō badly burned. `[Passive]`
    - `"Can't die" endurance` — the reason Yhwach picked him.
      - Only Schutzstaffel left in fighting shape after Nimaiya's first assault.
      - Kept talking **after Grimmjow tore out and crushed his heart** and punched through him again.
      - `[Passive]`
    - `Blut Vene` (A ep408) — slowed the bleeding from the heart wound. `[Stance]`
    - `Physiology expertise` — reads a target's mass and blood volume at a glance: Nimaiya ≈ 62 kg, so ≈ 4 L of blood, and losing 2 L kills him. He then sets the lethal dose of Nimaiya's blood to ≈ 1.6 L. `[Sensing]`
    - `Feint and flight` — fakes cowardice, runs away mid-fight, and baits pursuers into his zones. `[AI behaviour]`
  - *The Deathdealing* (致死量, "Lethal Dose"; **"D"**)
    - `Perfect lethal dose` — after **taking a substance into his body** (usually by drinking or eating it), he calculates the exact dose at which it is 100 % fatal, then **moves that threshold anywhere he likes**. `[NEW:Chemistry]`
    - `Poisoning (lower the dose)` — harmless or vital things become lethal:
      - **Blood**: licks Nimaiya's blood from his hand and then the victim's own blood kills him. Bleeding it out instead kills by blood loss.
      - **Reishi**: lethal in the Reishi-dense Royal Realm.
      - **Oxygen, nitrogen.**
      - **Water**: in the anime he poisons Kirinji's own hot-spring water to paralyse him (A ep392).
      - The more he ingests, the faster it acts. Very strong targets resist longer.
      - `[Status: poison][Field]`
    - `Poison miasma` — visible **purple-violet (or green) mist** from his body, thrown as shots or spread over the battlefield. `[Field: poison][Projectile]`
    - `Gift Ball` (毒入りボール, "Poison Ball") — **slow-floating purple balls**. Throw them, or leave them hanging in the air as **mines**.
      - **One touch** dropped Grimmjow on the spot. He **lobbed one behind him while running away**, and it ended Grimmjow's chase.
      - He also broke up a Bazz-B / Haschwalth confrontation with one.
      - `[Projectile orb][Status]`
    - `Hybrid Gift Ball` — layered **Reishi + oxygen + nitrogen** in one ball. It pushed Yoruichi to the edge of unconsciousness. `[Projectile orb][Status: multi-poison]`
    - `Gift Bad` (毒入りプール, "Poison Pool/Bath") — a big **round oil-slick pool** of green-purple poison on the ground. Not lethal itself: anyone standing in it has their **tolerance for a substance of his choice** slashed. Ichigo's group collapsed from **Reishi poisoning** in Wahrwelt. `[Field][Status]`
    - `Immunity (raise the dose)` — **absorbs and analyses an enemy's Reiatsu** after enough exposure and pushes its lethal dose sky-high. He becomes **immune to every attack carrying that Reiatsu**, typically **within about a minute**.
      - Became immune to Yoruichi's and Yūshirō's Shunkō; Yūshirō's next attack fizzled on him.
      - `[NEW:Adaptation][Absorb]`
    - `Healing factor` — once immune, **injuries from that source heal within seconds** (his full-body burns vanished). `[Heal/Reject]`
  - *Hasshein (Vollständig)*
    - `Flight` (A ep396) — `[Mobility]`
    - `Enhanced Hirenkyaku` — moves in **zig-zags**, leaving **trails of interlinked circles**. It left the range of Urahara's Bankai in an instant. `[Mobility][Afterimage]`
    - `Reishi Staff` — parries swords; **vault-pole extension** dodges; staff balls fan into Gift Balls. `[MeleeArc][Projectile]`
    - `Mutation-proof immunity` — adapts to changes in a poison's "surface", so his immunity holds while the "base" is the same.
      - Took in all **48 per-second variations** of Yoruichi's Shunryū Kokubyō Senki Reiatsu in one second.
      - Still loses it if the **base** changes (an Arrancar switching to Hollow Reiatsu with Resurrección).
      - `[NEW:Adaptation]`
    - `Mass Gift Balls` — **dozens at once**, plus single **huge** ones. `[Swarm][Projectile orb]`
    - `Gift Ball Deluxe` (極上毒入りボール, "First-Rate Poison Ball") — his biggest: a sphere centred on himself that **swallows the battlefield** and **dwarfs several buildings**.
      - Everyone inside is poisoned slowly, **at a rate he chooses**.
      - He can **raise the concentration**; the sphere then stretches into an **ellipse that narrows to a point**.
      - He holds back for fear of poisoning himself. **When he dies the restraint fails** and it **intensifies uncontrollably**.
      - `[Field: poison][Construct]`
    - `Gift Bereich` (猛毒領域, "Deadly-Poison Domain") — scatters **interlinked Reishi circles (nodes)** around a space, such as the Deluxe's boundary, to form a **one-way barrier**.
      - **Nobody inside can leave, but people can still come in.** Urahara stitched a path in from outside so Grimmjow could ambush him.
      - `[Construct][Field][NEW:OneWayBarrier]`
    - `Gift Ring` (猛毒の指輪, "Deadly Poison Ring") — for enemies too tough to poison. He **spins a bracelet ring, enlarges it and hurls it**. It **shrinks to near-invisible** in flight, **pierces a chosen body part**, and focuses all of The Deathdealing into it: **"instant death" of that part**.
      - It **burst both of Urahara's eyes** one after the other.
      - His plan was to do it organ by organ.
      - `[Projectile needle][Status: death-mark / limb kill]`
- **Passives & weaknesses:**
  - **Passives:** immunity build-up per enemy Reiatsu signature (heals the related wounds); endurance (stays up through mortal wounds); poison aura.
  - **Weaknesses:**
    1. **He must take the substance in first.** He has to drink or eat a lot of it, or soak up enough Reiatsu from hits, before he can tune it.
    2. **Dilution**: targets can drain the poisoned substance below the dose. With vital fluids that is usually suicide (Nimaiya survived only because Kirinji's Blood Pond Hell water refilled his blood).
    3. Strong foes resist.
    4. **Immunity resets if the Reiatsu changes.** Base form: any change. Hasshein: only a change in the base, such as an Arrancar's Resurrección. Yoruichi's 48-variation Reiatsu beat his base form.
    5. **Urahara's immunity booster** (5-minute prototype) and Benihime Aratame's **restructuring** remove the poison.
    6. Gift Bereich is **enterable from outside**.
    7. **Avoids raw power fights.** Kirinji was a "fatally bad matchup" (his water wiped out the Gift Balls), and he fled him.
- **Signature moments to recreate (story set pieces):**
  1. **Peacemaker (M ch543):** a Gift Ball stops Bazz-B from attacking Haschwalth. Askin points out that His Majesty hates infighting and that people are watching.
  2. **Picnic spectator:** watches Kenpachi vs Gremmy through **binoculars**, eating, with a **thermos of café au lait**.
  3. **Nimaiya (M ch601–602):**
     - Feigns a fatal cut. Throat slashed, he gets up anyway.
     - **Licks blood off his hand** and Nimaiya collapses.
     - The blood-volume lecture (62 kg / 4 L / 1.6 L).
     - Nimaiya slits his own throat, and Kirinji's Blood Pond Hell refills him. Askin is stabbed and admits that one was fatal.
  4. **Kirinji (A ep392):** runs from him, then the hot water underfoot **turns poison**, and an arrow goes through Kirinji's side. (A) Crushed under Senjumaru's spiked-armour silhouettes.
  5. **Grimmjow chase (M):** flees, tosses a Gift Ball over his shoulder, and Grimmjow drops.
  6. **Gift Bad trap (M):** Ichigo, Sado and Orihime are pinned by Reishi poisoning.
  7. **Yoruichi and Yūshirō (M ch656–662):**
     - His arrow is caught and stabbed back into his shoulder. **Raijin Senkei** levels the block.
     - Yūshirō's punches, then **Bakuen Musō**.
     - He walks out healing: **immune**. Three arrows through Yūshirō.
     - Hybrid Gift Ball on Yoruichi.
     - Urahara's booster jab; **Shunryū Kokubyō Senki**, and Askin is blasted through towers.
  8. **Hasshein vs Urahara (M ch663–666):**
     - **Gift Ball Deluxe** swallows the area; the **Gift Bereich** seals it.
     - He admits he follows Yhwach out of curiosity about the world Yhwach will make.
     - **Gift Ring blinds Urahara**.
     - **Kannonbiraki Benihime Aratame** splits his arm open; he gets out of range coolly; Urahara rides stitches through the air.
     - The concentration rises.
     - **Grimmjow** (Pantera, a base-changed Reiatsu) comes in through a stitched tunnel and **rips his heart out**.
     - Dying, the Deluxe **intensifies**; he politely apologises and, just this once, refuses to call it fatal.
- **Kit proposal:**
  - **Form I — Deathdealer (base)**
    - **Shift:** **Lethal Step.** Hirenkyaku backstep. On a perfect timing vs a melee swing he takes a scratch, plays a fake-death ragdoll and is untargetable for 0.8 s, then reappears.
    - **LMB:** lazy jabs and kicks, then a **finger-gun Pfeil** pop. Forward: gut punch (stagger). Air: kick plus finger shots.
    - **Hold LMB:** **Point-blank arrow.** The bow springs out on the wrist and fires a piercing shot through the body.
    - **RMB:** guard. Perfect parry: **Feint Collapse** (the enemy thinks he's down; free backstab window).
    - **Q:** **Gift Ball.** Tap throws one slow orb; hold places up to 6 floating mines; detonate or recall with Q again.
    - **E:** **Gift Bad.** Place the oil-slick pool. Cycle the "chosen substance" with E-tap:
      - **Reishi** (strong in dense Reishi areas, and drains Reishi users' meter).
      - **Oxygen** (stamina drain).
      - **Blood** (needs a blood sample; see R).
    - **R:** **Taste.** "Drink" a sample: an enemy's blood from a hit, a puddle, hot water, the air. Adds that substance to the poison palette. On blood: that enemy's own blood becomes a DoT that **worsens if they heal or bleed**.
    - **F:** **Heilig Bogen.** 2–3 Zeichen-fletched arrows.
    - **Z:** **Hybrid Gift Ball.** Mix up to 3 owned substances: a stacking multi-poison that also slows.
    - **X:** **Analyse.** Instantly complete immunity to the last enemy who hit him, fully healing that damage. Long cooldown; otherwise it accrues passively over ≈ 60 s of exposure.
    - **G:** **Blut Vene** (last-stand damage reduction plus bleed stop).
    - **C:** poison-miasma aura: a purple haze field that slowly poisons everyone nearby who isn't immune.
    - **T:** **Hasshein** (pillar of light).
    - **V:** **Perfect Lethal Dose.** Choose one target with a sample taken. Its lethal dose drops below its current level: escalating damage until it purges (bleeds itself, uses a cleanse) or dies.
    - **Tab:** substance palette (Blood, Reishi, O₂, N₂, Water, Enemy Reiatsu signatures) · thermos break (café au lait: small heal and taunt).
  - **Form II — Hasshein**
    - **Shift:** **Zig-zag Hirenkyaku** that leaves trails of linked purple circles (afterimage decoys).
    - **Mobility:** flight (A) via molecular-chain wings.
    - **LMB:** **Reishi Staff** chain (whips, sweeps, thrusts). Forward: extend-poke. Back: **pole-vault** dodge.
    - **Hold LMB:** staff slam that fans the balls out into Gift Balls.
    - **RMB:** staff parry (vs blades).
    - **Q:** **Gift Ball Swarm.** Every staff ball splits ×5 into dozens of orbs that home slowly.
    - **E:** **Gift Ball Deluxe.** A giant poison dome centred on him (≈ 80–120 m radius *(est.)*). Hold E to **raise the concentration**: the dome stretches into a narrowing ellipse and the DoT ramps.
    - **R:** **Gift Bereich.** Scatter linked circle nodes on the dome boundary: a **one-way wall** (can't leave; outsiders can enter).
    - **F:** **Gift Ring.** Choose a body region:
      - Eyes: **blind** for 8 s.
      - Arm: arm disabled.
      - Legs: rooted.
      - Heart: "instant death" on non-bosses; huge damage on bosses.
    - **Z:** **Giant Gift Ball** (one huge slow orb that rolls through buildings).
    - **X:** **Adaptive Immunity.** For 20 s, immunities also ignore "surface" changes of a signature (e.g. form-changing Reiatsu).
    - **G:** visor toggle (shows every enemy's poison load and immunity bars).
    - **C:** purple Reiatsu flare (miasma burst).
    - **V:** **Fatal.** Max concentration in the Deluxe. On his death, the Deluxe auto-triggers a final uncontrolled spike (a canon death effect, also usable by AI).
- **AI notes:**
  - **Personality tells:**
    - Laid-back, chatty, polite to enemies; explains his power at length; self-deprecating.
    - Catchphrase **"Chimei-teki da ze" ("that's fatal")** whenever an opponent slips up.
    - Hates "tough-guy" words. Sips café au lait.
  - **Behaviour:**
    - **Never fights fair.** Opens by dropping Gift Bad and mines, then backs off and **runs away** to drag pursuers into his zones.
    - Fakes deaths.
    - Waits about a minute while soaking hits to build immunity, then turns aggressive.
    - Uses Gift Ring only on "too tough" targets.
  - **Phases:**
    1. Base zoning.
    2. When immune, he advances and taunts.
    3. When his immunity is broken, he shows a brief panic, then goes **Hasshein**: Deluxe, Bereich, Gift Ring.
    4. When killed, the Deluxe spikes out of control (escape sequence).
  - Avoids enemies with water or flushing abilities (Kirinji) and complicated scientists (Mayuri).
- **Callouts:** *"Gifuto Baru"* · *"Haiburiddo Gifuto Baru"* · *"Gifuto Bāto"* · *"Hasuhain"* · *"Gifuto Baru Derakkusu"* · *"Gifuto Beraihi"* · *"Gifuto Ringu"* · *"Za Desudīringu"* · catchphrase *"Chimei-teki da ze"*.

---

## Appendix A — Engine features these kits need beyond the brief's primitive list
Each `[NEW:…]` tag used above, with what it has to do.

| Tag | Needed by | Requirement |
|---|---|---|
| `NEW:Foresight` | Yhwach, Haschwalth (night) | A **prediction layer**. For every entity in view, produce a "future ghost" 0.6–1.5 s ahead: from the **AI planner's queued action and path** for NPCs, and from **input buffer + current animation + wind-up data** for players. **Predicted hit-tests** drive auto-dodge and auto-parry. Per-entity **blind-spot flag** (Soul King parts) and **illusion-poisoning** (an illusionist can feed false ghosts). Variable **pulse cadence** (continuous for Yhwach, one look every 3 s for Haschwalth). |
| `NEW:FateRewrite` | Yhwach (+ Pernida's spectral seal as counter) | **Cancel another entity's in-progress ability** at resolution time. A persistent **`BrokenInEveryFuture` state** on a weapon or form: broken-mesh swap, ability locked until a `PastEdit` effect clears it. **Delayed damage** scheduled on predicted positions (future wounds). **Traps spawned at predicted coordinates**, including out of walls behind the target. A **power gate** (power-rating comparison plus a sacrifice cost). |
| `NEW:StateRollback` | Yhwach | A rolling 5 s **snapshot** of an entity (HP, limbs, statuses, form) plus a pre-activation snapshot. Restore on demand; **intercept death** and restore once (Rewritten Death). Suppression flags (Still Silver, illusion kill). |
| `NEW:Adaptation` | Yhwach, Askin | Per-entity **registry keyed by ability ID or Reiatsu signature**. After N exposures (Yhwach: 1, Askin: ≈ 60 s of exposure), that source deals 0 and **heals its own past damage** (Askin). Askin's signatures need a **two-level hash (base / surface)**: the base form loses immunity on *any* change, Hasshein only on a *base* change. Optional **mimic** (Yhwach's Seen Powers). |
| `NEW:AbilityTransfer` | Medallion (all Sternritter), Sankt Altar, Consumption, Auswählen, Schrift bestowal, Pernida's copying | Abilities and forms as **portable data packages** (moveset, VFX, constructs, UI, voice set) with **owner**, **potency multiplier**, **mastery meter**, **lockouts** (no Vollständig while holding a stolen Bankai), **return conditions** (Hollowfied Bankai poisons the holder and flies home) and **immunities** (Hollow-type Bankai, Resurrección, black owned by Ichimonji). |
| `NEW:PowerDrain` | Auswählen | A **map-wide event** that selects entities by tag (Quincy, including allies and Soul King parts) and runs per-entity drain beams. Weak victims are **skeletonised** (flesh-strip VFX) and **drop a Still Silver item**. Survivors lose Vollständig. Drained power is **redistributed** (revive allies with partial Vollständig; heal and cleanse the caster). |
| `NEW:DayNight` | Yhwach ↔ Haschwalth | Hooks on the **world clock** that swap kit modules between two paired characters (The Almighty ↔ The Balance), with a shadow-swap teleport between them. Mode toggle for PvP. |
| `NEW:TeamAura` | Yhwach (Blut regulation), Haschwalth (Soul Distribution) | Radius or global buff/debuff applied by faction tag. |
| `NEW:ShadowGate` | Shadow (all Wandenreich), Lille's light ball | Portals that **require real shadows**: query the **shadow map** at origin and destination. **Light sources that erase shadows** cancel or deny gates (and Kageoni-style shadow attacks). Size scaling up to army gates. |
| `NEW:WorldRule` | Wahrwelt (Yhwach), Wandenreich time limit | **Global movement rules by faction** (only Quincy can air-step in Yhwach's Reishi field). **Operation timers** with VFX (shadows dripping off bodies) and forced recall. |
| `NEW:WorldReshape` | Yhwach Soul King form | **City-scale voxel transmutation**: lift huge chunks on spline paths (carried by black matter), recombine them into a target layout (five cities plus the capital into one Quincy Zeichen), and **grow a fortress** in seconds. Needs chunk streaming, so no hitches. |
| `NEW:MultiPresence` | Yhwach "King of the Three Worlds" (A) | One boss controlling **several bodies in separate arenas** with shared HP and state, synchronised vulnerability windows, and per-arena Black Domain spheres. |
| `NEW:FactionSwarm` | Torrent of the Soul King's Power | A large swarm (hundreds to thousands of small "eyeball babies") with a **faction filter** (targets Shinigami only), resistant to cuts, killed by Reiatsu-pressure fields and high Kidō. GPU-instanced. |
| `NEW:Puppet` | Pernida (The Compulsory), Yhwach (sword compulsion, Black Possession) | **Take over another character's skeleton**: AI/input override, forced animations, **per-limb twist/fold deformation**, and limb-kill. The victim's **escape by self-amputation** needs a dismemberment system. **Possession of voxel props/statues**: they animate as golems and **self-repair** while infused. |
| `NEW:TerrainLimbs` | Pernida | Procedurally extrude **giant hands and arms out of nearby voxel material** (street stone, building walls) with IK, slam or clap, then crumble. |
| `NEW:Scaling` | Gerard (Godly Size), Pernida (growth) | **Continuous scale change** of a character (2 m → 100 m+): rig and LOD swaps, voxel-resolution switch (32/m → 0.25 m world voxels), collision and physics re-tune, camera auto-frame, footstep GroundWaves, small characters **standing or running on the giant** (Kenpachi on his hand and blade). A HP→size conversion curve. |
| `NEW:SelfReplicate` | Pernida (finger clones), Lille (remnant birds) | Severed parts or shards **become new AI entities** that inherit the kit and can themselves be split. |
| `NEW:Evolve` | Pernida | Runtime acquisition of stats, passives and abilities from **contact** (nerves) or **consumption** (biomass), visible as mutation steps. |
| `NEW:PierceAll` | Lille | **Instant hitscan that ignores all colliders, guards and shields**, **stops at the designated target** (everything beyond is masked), and **carves a clean cylinder** through every voxel on the line. Multi-emitter variant (24 wing holes). |
| `NEW:Intangible` | Lille | A phasing state: every incoming attack passes through (melee, projectiles, Kidō, explosions). **Exception list**: the entity's own reflected power; halo destroyed. |
| `NEW:DamageReflect` | Gerard (Hoffnung), Haschwalth (Freund Schild), Lille (sparks) | Three flavours: **weapon-integrity reflection** (chipping the weapon wounds the attacker ×N; disabled by a `frozen` status); a **ledger reflection** (absorb into the shield, repay later); **on-hit sparks**. |
| `NEW:Luck` | Haschwalth (The Balance), Gerard (The Miracle) | A probability layer. A **misfortune ledger** that tracks "good-fortune events" (hits landed, crits, dodges, survivals) and **inverts** them. An **improbability meter** (Gerard) that scales with odds against him. Effects that can **split structures** or **void defences** (the Cang Du execution). |
| `NEW:Chemistry` | Askin | Per-entity **substance loads** (blood, Reishi, O₂, N₂, water, Reiatsu signatures), **sampling by ingestion**, lethal-dose thresholds the caster can move, purge actions (bleeding), environment links (Reishi density makes Reishi poisoning stronger). |
| `NEW:OneWayBarrier` | Askin (Gift Bereich) | A directional barrier volume: enterable, not exitable. |
| `NEW:StatusImmunity` | Gerard (Aschtonig) | Flags that make freeze, elemental bind and similar effects fail or break. |
| `NEW:Possession` | Pernida (limb occupancy, A) | An entity living inside another entity's limb (cutscene/lore use). |

**Other system notes**
- A **weapon-break state** for any weapon: Tensa Zangetsu cut by Haschwalth or broken by Yhwach; Hoffnung frozen and bisected; Diagramm's barrel severed.
- Yhwach's erased sword name ("■■■■") needs a UI hook.
- **Bell-toll audio** cue for Vollständig pillars and Auswählen (anime).
- **Blackness material**: viscous, oily black with procedurally spawning eyes that act as **beam emitters**. Shared by Yhwach, anime Haschwalth, Black Possession, the eyeball swarm and Mimihagi.

## Appendix B — Cross-roster counters these kits must respond to
| Counter | Owner (other groups) | Effect on H1 kits |
|---|---|---|
| Still Silver | Uryū / Ryūken | Hard-disables all of Yhwach's powers on contact with his blood (3–5 s). |
| Kyōka Suigetsu | Aizen | False ghosts. Yhwach's foresight, auto-dodge and adaptation are fooled. |
| Book of the End | Tsukishima | **PastEdit**: clears `BrokenInEveryFuture`, so a broken weapon can be restored. |
| Antithesis | Uryū | Swaps events or wounds between two points. Can swap a Yhwach rewrite back; The Balance re-reflects it. Also enables the Medallion swap. |
| Shin'eiyaku / Hollowfied Bankai | Urahara, captains, Ichigo | Unstealable by Medallion; poisons the thief; the Bankai returns. |
| Leidenhant (Sanrei Glove) | Uryū | Strips Quincy powers when broken on the target (Haschwalth). |
| Shinken Hakkyōken | Nanao | Reflects "god's power" (Lille's true form, Trompete) back on its source. |
| Freezing (Daiguren complete) | Hitsugaya | Turns off Hoffnung's reflection; freezes Gerard's limbs that touch him. |
| Kageoni / Kageokuri / Reiatsu decoys | Shunsui | Shadow attacks and Reikaku decoys vs Lille. |
| Resurrección (base Reiatsu change) | Arrancar | Resets Askin's immunity. |
| Immunity booster / Benihime Aratame | Urahara | Purges Askin's poison; restructures poisoned tissue. |
| Acid / electricity / anaesthetic / layered nerves | Mayuri | Pernida's nerve counters. |
| Ichimonji (black ownership, name ink) | Ichibe'e | Sankt Altar can't keep black-based power; named weapons can be disabled. |
| Cage of Life | Hikifune | Blocks Reishi attacks, but not harmless objects (Medallion) or Auswählen (pure energy). |

## Appendix C — Unverified / could not find
- **Exact anime colours** for several small items: Yhwach's boots, the front emblem and medal ribbon; the Freund Schild's panel fill; Lille's open-eye colour and glove embroidery; the colour of Pernida's chains, nerves and wrist rune; Gerard's gauntlets and helmet-wing material. The hex values given are estimates. The Schutzstaffel Hagal rune is **dark red** on most pages and **black** on one.
- **Yhwach's Reishi Sword**: only "dādāo-like, long handle, bird-shaped guard" is documented. Its true name was erased in-story and never revealed.
- **Lichtreich-era Yhwach costume**: only the face and hair are described. Use the "old man Zangetsu" resemblance plus the 3-point Lichtreich emblem.
- **Haschwalth's eye colour** is inconsistent across the wiki (light green vs blue).
- **Haschwalth's "one foresight per 3 seconds"** limit is made explicit in the anime (ep411); I couldn't confirm the exact manga wording.
- **The Balance's giant scales VFX** is an anime expansion; the manga only uses scales as a metaphor.
- **Sizes**: Godly Size maximum height, Pernida's giant-arm size, Lille's true-form proportions, and the scale of Sankt Bogen and Qual Kreis bows are not stated in sources. All sizes marked *(est.)* are mine.
- **Askin's Hasshein bracelets**: the wiki says "five" but lists four (1 left + 3 right).
- **TYBW Part 4 is still airing.** The wiki snapshot covers up to ep414 ("THE END TWO WORLD"). Later episodes may add more anime-only material, especially to Yhwach's finale (three bodies, Black Domain).
- **Royal Guard round two** (Gerard vs Senjumaru's heart stab, Pernida vs Hikifune, Askin vs Kirinji's poisoned water, Lille vs Nimaiya's phasing shot) and Senjumaru's six "fate" techniques are **anime-only (ep392)**. They're good set pieces, but tag them (A) in story mode.
