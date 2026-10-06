# Roster I — Royal Guard (Squad Zero), Hell & others

Design dossiers for the five members of the **Royal Guard / Zero Division** (**Ichibe'e Hyōsube**, **Senjumaru Shutara**, **Ōetsu Nimaiya**, **Tenjirō Kirinji**, **Kirio Hikifune**), the *Hell Verse* movie villain **Kokutō**, the **Hell** content (the 2021 one-shot *NO BREATHES FROM HELL*, the Kushanāda, Togabito, Jigoku no Gaki, Szayelaporro as "Jailer of Hell"), the **Soul King (Adnyeus)** and **Mimihagi**. Royal Guard support NPCs (Divine Soldiers, Nimaiya's forge spirits, Kirinji's bath attendants) are covered in the shared layer. The file ends with the **engine features** these kits need beyond the brief's primitive list and a list of **open questions**.

Conventions used below
- Heights → voxels at **32 vox/m** (rounded). Hex colors are *estimates* from anime/colour-page memory unless the wiki states a color in words; anything marked **(verify)** must be checked against reference art before modeling.
- Engine tags use the brief's vocabulary in `[brackets]`. Needs not covered by that list are tagged `[NEW: …]` and collected in section 12.
- Canon-status flags: **[M]** manga · **[A-ep N]** anime-only (TYBW anime, episode number) · **[N]** novel *Can't Fear Your Own World* (CFYOW, Ryōgo Narita) · **[KO]** Kubo's *Klub Outside* Q&A · **[1S]** the 2021 one-shot *NO BREATHES FROM HELL* (canon, by Kubo) · **[Mv]** *Bleach: The Hell Verse* movie (**non-canon**) · **[BS]/[RoS]/[SR]** video games *Brave Souls*, *Rebirth of Souls*, *Soul Resurrección* (**game-only**) · **[X]** our own extrapolation for the game, not canon.
- The wiki romanizes the leader as **Ichibe'e** (also seen as Ichibē / Ichibei). Same person.
- Sources: bleach.fandom.com pages linked per entry (fetched through the MediaWiki API), plus *Ichibe'e Hyōsube vs. Yhwach*, *Fall of the Soul King*, *Black*, *Soul King Palace*, *Royal Guard*, *Blood Oath's Seal*, *Ōken*, *Irazu Sandō*, *Soul King Palace Residents*, *Hōōden*, *Hell*, *Konsō*, *Togabito*, *Kushanāda*, *Hollow* (Jigoku no Gaki), *NO BREATHES FROM HELL*, *Bleach: The Hell Verse*, *Hyapporankan*, *Gikon*, and the Yhwach / Schutzstaffel / Uryū / Ukitake / Szayelaporro pages. Manga vs. anime-only status was checked against each page's chapter/episode citations. Everything is paraphrased.
- Answering the prompt's question marks up front:
  - **"Hakushō?" (Ichibe'e):** no technique of that name exists. His Bankai is **Shin'uchi: Shirafude Ichimonji** ("white brush"); the white-energy circle it makes may be what was meant. His named moves are Senri Tsūtenshō, Futen Taisatsuryō, Bakudō #62 Hyapporankan and Ura Hadō: Sannodō — Teppūsatsu.
  - **"Sayafushi?" (Nimaiya):** yes — his over-sharp, unsheathable "failed" katana. His own **Shikai and Bankai were never revealed**.
  - **"Bankai?" (Hikifune):** never revealed (Blood Oath's Seal). Her **Shikai's name and command are unknown**; only its shape (a giant wok spatula) is known.
  - **"Kinpika?" (Kirinji):** yes — his polearm Zanpakutō; Shikai command **"Tenshō Issen"**. Bankai never revealed.
  - **Senjumaru's Bankai** *Shatatsu Karagara Shigarami no Tsuji* is named in canon material, but **everything it does on screen (the loom, the six "hanks") is anime-only (TYBW eps 392–393)**; the manga skipped the Royal Guard vs. Schutzstaffel rematch.
  - **Kokutō** is from *The Hell Verse* (2010). Kubo is credited as production director but publicly asked not to be credited as executive director and said his scenario ideas did not reach the staff → treat as **non-canon**. Canon Hell content comes from the 2021 one-shot (*NO BREATHES FROM HELL*, spelled "BREATHES" officially).

---

## 0. Quick reference

| Character | Role | Height → vox | Zanpakutō / power source | Signature energy | Tier | Power |
|---|---|---|---|---|---|---|
| Ichibe'e Hyōsube | Zero Division leader | 181 cm → 58 | **Ichimonji** (brush) → Shikai *Kuromeyo* → Shin'uchi **Shirafude Ichimonji**; True-name powers; "Black" | none sensible (zero reiatsu leak); **black ink**, **white** light (Shin'uchi) | **A** (story boss) | 10 |
| Senjumaru Shutara | 4th Officer, Divine General of the North | 158 cm → 51 (+4 okobo) | **Shigarami** (needle) → Bankai **Shatatsu Karagara Shigarami no Tsuji** | **yellow** reiatsu (canon); red thread; gold arms | **A** | 9 (10 unsealed) |
| Ōetsu Nimaiya | 3rd Officer, Divine General of the West | 172 cm → 55 | **Sayafushi** (forged katana); Shikai/Bankai unrevealed | unknown (verify) — propose gold/green | **B** | 9 |
| Tenjirō Kirinji | 1st Officer, Divine General of the East | 193 cm → 62 (+pompadour) | **Kinpika** (polearm) → Shikai *Tenshō Issen*; hot-spring waters | golden-white light; milky-white & blood-red water | **B** | 8.5 |
| Kirio Hikifune | 2nd Officer, Divine General of the South | 174 cm → 56 | unnamed chokutō → Shikai (giant wok spatula); Cage of Life tree; cuisine | unknown; bark/green growth | **B** (support) | 8 |
| Kokutō | Togabito, *Hell Verse* villain **[Mv]** | ≈185 cm → ≈59 (est.) | black curved sword + Hell chains | **blue** blasts/shield (purple in games) | **B** (optional Hell DLC boss) | 7 |
| Hell bestiary (Kushanāda, Togabito, Jigoku no Gaki, Shuren's gang) | enemies | giants / human | Hell | varied | **C** | 5–7 |
| Szayelaporro, "Jailer of Hell" **[1S]** | boss variant (base dossier is in E2) | as base | Hell chains, clairvoyance | black-crimson chains | **C** | 7 |
| Soul King (Adnyeus) | set piece / scenery | unknown (render large) | "Black" (chaos) | black | **C** (event) | n/a |
| Mimihagi | set piece / boss phase | giant hand | "Stillness", Black | black, one eye | **C** | 9 |
| Divine Soldiers, forge spirits, Kazuo & Kazuhiro | NPC / summons | human (giant variant) | — | — | **C** | 3–5 |

---

## 1. Shared Royal Guard layer (read first)

Every Royal Guard dossier inherits this; dossiers only list deviations.

### 1.1 Racial / rank basics
- Souls (Shinigami), each promoted for an **invention that shaped Soul Society** [M]: Ichibe'e — **names** (he named everything incl. "Zanpakutō/Shikai/Bankai"); Kirinji — **Kaidō**; Hikifune — **Gikon** (artificial souls → Gikongan); Nimaiya — **Zanpakutō / Asauchi**; Senjumaru — **the shihakushō** [KO][N].
- **Immeasurable reiatsu**: the five together far surpass the whole Gotei 13. Unsealed, any one of the four Divine Generals makes the Three Worlds tremble → `C` flare at full power should trigger a **global tremor** (camera shake in every loaded zone) `[NEW: GlobalTremor]`.
- **Ōken (王鍵)** imparted in their **bones** [M]: free passage in/out of the Soul King Palace; can admit others by will. Aizen's plan (100,000 souls + a Jūreichi) was to *forge a new Royal Guard member* to get a key.
- **Agelessness / mutual revival [N]**: the Ōken ties their lives to the palace; while it stands and one of them lives, they can revive fallen members **by calling their names** (takes minutes). Ichibe'e has guarded the Soul King ~1 million years. → Royal Guard team-boss rule: downed members revive unless all are beaten within a window `[NEW: NameCallRevive]`.
- Shunpo at expert-to-master level for all five; Kidō at least practitioner level.

### 1.2 Blood Oath's Seal (血盟の封印, Ketsumei no Fūin)
- Kirinji, Hikifune, Nimaiya and Senjumaru use **each other's lives as seals**: true power and **Bankai are locked**. To unlock one, the **other three must die**. Four candles burn beside the seal [M]; the anime shows the three generals **cutting their own throats** so Senjumaru can release her Bankai [A-ep 392]. Nimaiya: the four combined while sealed are nowhere near one of them unsealed [M].
- **Ichibe'e is exempt** (his reiatsu control is perfect; nothing leaks).
- Game: a 4-candle UI. Free play: Divine Generals' `T` is greyed until the "3 candles out" condition (in story: three generals fall; in versus: a long meter). Climax of a Royal Guard raid: kill three → the fourth unseals.

### 1.3 Look & insignia
- **Insignia:** a **Winter Daphne (jinchōge) flower inside the Gotei rhombus** [M], on the back of every member's haori/jacket. Model as a 4-petal star-flower cluster inside a diamond, black on white (verify exact drawing).
- Shared palette: haori white `#F4F3EE` (shadow `#C9C8C2`), shihakushō black `#161616`, insignia black `#1A1A1A`. Nimaiya's and Kirinji's cropped jackets carry the **captain-haori hem pattern** (alternating black circles and diamonds).

### 1.4 Ōken clothing (Senjumaru's weaving, worn by Ichigo/Renji/Rukia/Byakuya) [M]
- Woven from Senjumaru's hair and bones (Ōken). Withstands the friction of breaking the **72 barriers**; holds them open **1 h 40 min**; blocks mind-control (PePe's *The Love*). Not indestructible (Galvano Blast, Star Flash: Super Nova destroyed some). → a craftable **team armor buff** `[Shield][Status-immunity: mind control]`.

### 1.5 Travel, gates, palace map
- **Tenchūren (天柱輦)**: giant pillar-palanquin; slams down with crater-making force; cannot fly back alone (Kūkaku's cannon / Mayuri's replica launcher) `[Blast]` set piece.
- **Chōkaimon (超界門)**: Nimaiya's portal to the Human World; return only with synced timing.
- **Spiral staircase**: Senjumaru manifests stairs down to the Seireitei (half a day to a week by Shunpo) `[Construct]`.
- Between palace districts people are **catapulted** (Kirinji's attendants launch patients to the next palace).
- **Soul King Palace (霊王宮)** level layout [M]: Seireitei-style lower layer → grand stairway → flat expanse lined with **rows of huge round pillars** (the *Vestibule Road / Omotesandō*) → **five floating discs** (*Zeroban Riden*), one city per member → above them the **Reiō Daidairi**, a giant floating **cylinder with conical top and bottom** (Soul King's chamber). 72 barriers separate it from the Seireitei.
  - Kirinji's city: **Kirinden** with an underground **hot-spring complex** (White Bone Hell: clear water, small waterfalls, a giant *sōzu*; Blood Pond Hell: boiling-blood look).
  - Hikifune's city: **Gatonden** ("Lying Pig Palace"), a temple of cooking and dining.
  - Nimaiya's city: flashy **Galaxy Hōōden** party hall by a large body of water; the real **Hōōden** is a tiny shack on a cliff edge whose floor is a **deep pit**; a **water-slide** leads to a cavern forge at the cliff base walled by torrents of water.
  - Senjumaru's city: rooms draped in dozens of fabrics, a cushioned seat of wooden bars at the top of stairs (fitting room).
  - Ichibe'e's city: a **mountain range**; the **Itanoma** dojo sits atop stairs carved into a mountain; the air holds reishi so dense newcomers can't move or breathe → `[Field: heavy air — move/stamina debuff that fades with "adaptation"]`. Entrance to the **Irazu Sandō**.
- **Irazu Sandō (不入参道)** [M]: the temple's walls and floor peel away to a long path of **jumbled irregular stones**, a plain **wooden torii** at the end, **luminous grass floating on water** on both sides, hanging white **shide**, constant **drizzle**. Every step adds crushing pressure; visions of the Soul King's history; Reiatsu of many colors converges into Black. Exit lands in Senjumaru's palace. Candidates carry only a **wooden sword**. → a walk-forward trial level `[Field: escalating weight][NEW: VisionOverlay]`.
- **Wahrwelt**: after the Soul King's absorption Yhwach rebuilds the palace as a Quincy city (Wandenreich buildings in a Zeichen layout) — covered by the Yhwach group.

### 1.6 Royal Guard NPCs (Tier C)
- **Divine Soldiers (神兵, Shinpei)** — "Blade of the Soul King" [M]: black hakama, **purple sash**, black mask with **four light lines** running over the head, hair tied up into a long spike that then hangs loose halfway; armed with Asauchi; cut through Soldat squads easily. Senjumaru commands them; some hide behind camouflage tapestries. `[Summon]`
- **Second-Class Divine Soldier (二級神兵, Nikyū Shinpei)** — "Shield of the Soul King" [M]: a **giant** soldier (towers over Senjumaru; est. 4–6 m), **black round hat**, carries the two halves of a **big black pentagonal shield**. Pernida crushed one instantly. `[Summon][Shield]`
- **Nimaiya's forge spirits** (all Zanpakutō spirits he made; bodyguards + forge crew) [M]:
  - **Mera Hiuchigashima** — slim girl, **spiky red hair in a ponytail**, vest with big **fur collar**, short skirt, barefoot; kicks Nimaiya when he clowns; **breathes fire** after sparking the air with her hands (lights the forge) `[Projectile/Beam: fire cone]`.
  - **Tokie Tonokawa** — long black hair, long dress with black sash, **crescent hairpieces** on both sides, thin neck sash, barefoot; gloomy, cries → **water gushes from the bucket on her shoulder** (quench trough) `[Environmental: flood]`.
  - **Hasuka Hashihara** — long **blonde twin tails**, skirt with a bow, barefoot; **prehensile, extendable hair** that grabs and holds `[Bind][Grab/Throw]`.
  - **Nonomi Nomino** — small, **reddish-pink curly hair**, irises split by a **white cross** (no pupils), fluffy-collared vest and fluffy skirt; two **chisels**, moves faster than the eye, **hollows out stone pillars in seconds** (builds the furnace) `[NEW: rapid terrain sculpting]`.
  - **Tsumiko Tsuchimiya** — long black hair over one eye, body and lower face **wrapped in bandages** (left shoulder bare); pulls out a tooth and **molds it into a long black hammer** for Nimaiya `[Construct: weapon]`.
- **Kazuo & Kazuhiro** — Kirinji's identical twin bath attendants [M]: bespectacled, muscular, short neat black hair; wear protective suits of **super spiritual thread** that burst into flames when removed; hold patients under, and **catapult** them to the next palace `[Grab/Throw]`.

---

## 2. Ichibe'e Hyōsube (兵主部 一兵衛) — Leader of the Zero Division, "Monk Who Calls the Real Name" (真名呼和尚, Manako Oshō)
- **Wiki:** https://bleach.fandom.com/wiki/Ichibe%27e_Hy%C5%8Dsube · fight: https://bleach.fandom.com/wiki/Ichibe%27e_Hy%C5%8Dsube_vs._Yhwach · power: https://bleach.fandom.com/wiki/Black
- **Roster tier:** **A** — late-game unlock and the TYBW Soul-King-Palace story boss. His name mechanics are the most unusual systems in the roster; ship once the name/label system exists (section 12).
- **Canon power (1–10): 10** — with only his sealed brush and Shikai he halved pre-Almighty Yhwach's name and power, deleted the names (and powers) of Yhwach's sword and Quincy Cross, palm-shoved him **1,000 ri (~4,000 km)** and slapped him back, shattered Blut Vene Anhaben with a secret Hadō, and renamed him "Black Ant"; only The Almighty beat him. Regenerates from a severed head.
- **Body:** **181 cm → 58 voxels**. Very **large and broad** — reads much heavier than Ichigo at the same height: shoulders ≈ 64 cm (20 vox), deep barrel chest ≈ 34 cm (11 vox), thick arms/forearms, slight belly. Single-tooth **tengu geta** add ~12 cm (≈4 vox) under the feet (model them; keep 58 vox body). Silhouette keys: **bald dome**, **huge black beard** (spreads wide from the sideburns and hangs to mid-chest, ~30 cm wide × 35 cm long → ~10×11 vox, bushy edges), **thick upswept black eyebrows**, perpetual wide **grin**, **big red prayer-bead necklace**, open collar showing a **hairy chest**, long white haori sleeves, a brush taller than a staff.
- **Palette (hex estimates):**
  - Skin: tan `#C68A5E` (shadow `#9B6643`, scalp highlight `#E0AA7F`).
  - Beard / brows / chest hair: black `#121212`, strand highlights `#2A2A2A`.
  - Eyes: **red** irises `#B3202A` [M text]; "kill-mode" eyes: **pure white, pupilless** `#F4F4F4`.
  - Shihakushō black `#161616`, inner collar `#E9E9E9`; **white long-sleeved haori** `#F4F3EE` with the Royal Guard insignia on the back.
  - **Red japamala prayer beads** `#A3161F` (beads ≈ 5 cm → 2 vox; necklace hangs to the sternum).
  - Tengu geta: wood `#8B5A2B`, black thongs `#1E1E1E`.
  - Ichimonji brush: shaft dark lacquered wood `#3B2416` (verify), ferrule/binding `#B8893A` (verify), bristles **wet black ink** `#0A0A0A` with glossy highlight `#2B2B35`.
  - Shikai blade: steel `#A7ADB4`, edge `#E6EAEE`; **ink halo** `#050505` with a faint indigo sheen `#1F1F2A` so it reads against night skies.
  - Shin'uchi bristles: pure white `#FFFFFF`; energy/circle: white `#F7F9FF` with warm rim `#FFF8E8`.
  - "Black" (Soul King's power): `#050505`, use an indigo/violet edge `#1A1030` for readability.
  - Kidō: Hyapporankan rods **blue-white** `#CFE6FF` (canon wording); Teppūsatsu dragon/wind: pale grey-white translucent `#DDE3EA`.
  - Futen Taisatsuryō: mausoleum black `#0A0A0A`, stone accents `#5E5E5E`, skulls bone `#E7E0CF`, iron fence `#2B2B2B`, broken gravestones `#7A7A7A`.
  - Reiatsu aura: **none** (undetectable — design choice: he never glows; power reads through ink, giant limbs and sound).
- **Look by form/outfit:**
  - **Base (TYBW, only outfit)** [M]: as above. Must-haves: bald head, beard, red beads, open hairy chest, white haori with insignia, tengu geta, giant brush. No division number.
  - **"Kill mode" tell** [M/A-ep 387–388]: when he decides to kill, his **eyes go blank white**; grin stays.
  - **Shikai**: brush head becomes a short blade; a **large halo-ring of black ink** hangs in the air behind his back (≈2.2 m diameter, 2–3 vox thick ring, dripping); his strokes leave **black streaks in the air**.
  - **Shin'uchi**: bristles turn **white** and shed **white energy**; part of it forms a **large circle around him** (ground ring ≈ 6 m diameter, est.).
  - **Revival state**: severed head on the ground → **black mass** wells up under it, lifts it and resolves into his body.
  - **Anime flashback (1,000+ years ago)** [A-ep 390]: same design; his **left palm grows a huge eye**, then the hand **boils and bursts** into a giant phantom hand with an eye.
- **Weapons:**
  - **Ichimonji (一文字), sealed** [M]: a giant **calligraphy brush** used like a staff, ≈ 1.8 m (≈58 vox; about his height) (est.); shaft ≈ 5 cm thick (2 vox), bristle head ≈ 35 cm long × 12 cm wide (11×4 vox) dripping ink.
  - **Shikai** [M]: "a somewhat short glaive": same long handle, the bristles replaced by a **short single-edged blade shaped like a chokutō tip** (≈ 40 cm / 13 vox) (est.). Can **flicker back into a brush** mid-fight (confuses the opponent).
  - **Shin'uchi: Shirafude Ichimonji (しら筆一文字)** [M]: back to brush shape, **white bristles** emitting white light.
- **Forms & states (ordered):**
  1. **Sealed brush** — name-cutting melee, ink kanji, Kidō, giant limbs.
  2. **Shikai "Kuromeyo, Ichimonji" (黒めよ, "Blacken")** — ink halo; every swing splashes ink; inked things lose their names → powers; commands all "Black" in the world.
  3. **Shin'uchi "Shirafude Ichimonji"** — he calls it *Shin'uchi* ("true strike"), the pre-"Bankai" term, because his was the **first evolved Zanpakutō** ever; writes new names on inked targets. Keeps all Shikai powers (KO #949).
  4. **Futen Taisatsuryō** (ritual finisher, Shikai/Shin'uchi).
  5. **Reconstitution** (death → head → black regrowth when someone says his name; powers return slowly).
- **Abilities (complete, grouped by source):**
  - *Innate — True Name Manipulation* [M]
    - `Name Identification` — knows the **true name of everything**; named everything in Soul Society incl. Zanpakutō/Shikai/Bankai; knows every Zanpakutō's name from the moment it is an Asauchi; told Renji his Bankai's real name (Sōō Zabimaru). Game: reveals target's full kit, names and cooldowns on lock-on `[Sensing][NEW: NameSystem]`.
    - `Name Curse` — anyone **unworthy who speaks his name loses their voice** (Yhwach could not speak; he tore his own throat and filled it with reishi to talk again). Game: an enemy who **targets him with a shouted/named special** (or a PvP player who types "Ichibe" in chat) is **Silenced**: no named abilities / callouts for N s `[Status: silence][NEW: NameSystem]`.
    - `Name Censorship` — blots a name out in **black ink** so it can't be spoken (he blocked old-man Zangetsu from telling Ichigo his name; KO #117). Game: black censor bars over one enemy ability in their HUD → that ability is locked `[Status: ability lock]`.
    - `Self-Reconstitution` — if his body is destroyed he stays conscious, **telepathically asks someone nearby to say his name**, steals a sliver of their power and **regrows from blackness**; instant body, slow power recovery `[Heal/Reject][NEW: NameCallRevive]`.
  - *Physical / racial* [M]
    - `Masterful Reiatsu Control` — **no detectable reiatsu** from him or his released sword (Yhwach couldn't sense it); exempt from the Blood Oath's Seal `[Sensing/Stealth: invisible to reiatsu sensing, no aura]`.
    - `Shunpo master` — appeared beside Yhwach 4,000 km away right after launching him; sidestepped a Sankt Bogen volley `[Mobility][Teleport]`.
    - `Immense strength` — sealed-brush swat sent Yhwach ~1,000 ri back; **clapped his hands to crush** a volley of Yhwach's reishi pillars; **flexed the left side of his body** to force Blut Vene Anhaben's corrosion back into Yhwach, bursting the blood vessels in Yhwach's face `[Absorb/Reflect/Redirect]`.
    - `Endurance` — impaled through the chest, kept fighting.
    - `Spirit Appendage Manifestation` — giant copies of his **hands and feet** in the air that mirror his motions with strength proportional to size `[Summon: giant limbs][MeleeArc smash][Blast]`:
      - **Senri Tsūtenshō (千里通天掌, "Heavenly Palm of a Thousand Ri")** — giant palm shove that sends the target **1,000 ri** away; second palm slams them downward.
      - **Giant foot stomp** — stamped Yhwach **through the platform** [M].
      - **Twin-palm crush** — two giant palms clap the target mid-air [M].
      - Scale: palm ≈ 15–25 m (est.); terrain: craters, punches through floors, ring-out of map.
  - *Kidō master* [M] — casts by **name only** (no number, no chant):
    - `Bakudō #62 Hyapporankan (百歩欄干)` — a blue-white rod splits into ~100 rods that rain down and pin the target to a surface; can also be fired from around his body with a gesture `[Projectile multishot][Bind]`.
    - `Ura Hadō: Sannodō — Teppūsatsu (裏破道 三ノ道 鉄風殺, "Reverse Destructive Way, Third Path: Iron Wind Kill")` — a **secret spell no one else has used**: a large **dragon's head** forms around him and blows a gale that **shattered Blut Vene Anhaben**; he then grabbed Yhwach's throat `[Blast][Projectile cone][Shield-break]`.
  - *Ichimonji, sealed* [M]
    - `Ink Kanji` — writes characters whose meaning becomes real `[Construct][Field][NEW: KanjiWriting]`:
      - **隠 Kaku ("Hide")** — hid the **entire Soul King Palace** from view when the Quincy arrived `[Sensing/Stealth: area invisibility]`.
      - **封 Fū ("Seal")** — an **impassable boundary** (he sealed the walkway to the Greater Palace; Yhwach only broke it after killing him) `[Construct: barrier][Shield]`.
      - **Boundary lines** — drew **two lines** across the platform and promised to finish Yhwach between them; Yhwach retorted that Ichibe'e would die three steps from the line — and he did `[Field: arena]`.
    - `Name Severing` — the brush **cuts names, not flesh**: hit the arm (腕 *ude*) → name halved to *u* → **that arm's strength and function halved**; a stroke down the whole body halved **"Yhwach" → "Yhw"** → all physical and spiritual power halved `[MeleeArc][Status: per-limb / global stat halving][NEW: NameSystem, per-limb stats]`.
  - *Shikai — Kuromeyo, Ichimonji* [M]
    - `Ink Splash` — every swing throws black ink; **whatever the ink covers loses its name and so its power** (Yhwach's Reishi sword became unnamable and his Quincy Cross useless). Works on people, weapons, items, constructs `[Projectile: ink splash][Status: Nameless = ability/weapon disable][NEW: NameSystem]`.
    - `Massive ink wave` — a single slash drowned Yhwach and overflowed both sides of the walkway `[GroundWave/Projectile cone]`.
    - `Power of Black` — Ichimonji's power is **"Black", the Soul King's own reiatsu**; on release, **all black from every being in the world, living or dead, becomes his** (black visibly leeches out of people in the Seireitei below) `[Absorb][Environmental][NEW: PaletteDrain]`.
    - `Theft immunity` — Yhwach's Sankt Altar pulled the black out of his **beard and eyebrows** and burned him with blue flames; the black simply **returned** and he was unharmed `[Passive: steal immunity]`.
    - `Futen Taisatsuryō (不転太殺陵, "Mausoleum of Halted Reincarnation")` — long ceremony: with a swing he draws a huge mass of Black from the surroundings (said to be "a hundred nights stolen from Soul Society 100 years in the future"), pours it into a **sake cup made of Black**, drinks, binds the target, chants, and raises a **huge black mausoleum with a fence over shattered gravestones and skulls**; it strips all the target's darkness — **flesh, blood and bones** — until nothing remains and the soul **cannot reincarnate**. Yhwach negated it only by "understanding" it with The Almighty `[Construct: mausoleum][Bind][Status: erase/no-revive][Environmental: darkness pull]`.
  - *Shin'uchi — Shirafude Ichimonji* [M]
    - `Renaming` — writes **kanji on the body** of anything already inked: the target takes the **properties of the new name**. Canon example: **黒蟻 Kuroari ("Black Ant")** — Yhwach's life and power became as frail as an ant's; Ichibe'e then **stomped him through the floor with a giant foot and crushed him between two giant palms** `[Status: archetype rewrite][NEW: NameSystem]`.
    - Keeps every Shikai power (ink erasure) [KO #949].
  - *Anime-only* — flashback, **Lichtreich truce talks 1,000+ years ago** [A-ep 390]: the Soul King's **right and left arms were infused into him**. **Right fist**: Mimihagi's *Stillness* — stops a volley of Heilig Pfeil **mid-air** and sends it back. **Left hand**: grows a giant eye (Pernida's arm); the hand boils, bursts into a **phantom hand with an eye** that engulfs Yhwach and **merges his doubled pupils back into one** — sealing The Almighty "until the day he dies" `[Absorb/Reflect/Redirect][Status: power seal]`.
  - *Anime-only* [A-ep 409]: at the **Blood Oath's Seal**, he draws a **ring of ink that becomes a Japanese giant salamander**, which fills his wide drinking saucer with black ink; the four candles flare; he drinks. [A-ep 412]: when the worlds start collapsing he unveils **a new throne for Ichigo** as the next Soul King (rewritten away by Yhwach's Almighty).
  - *Novel* [N]: after Yhwach dies, Ichibe'e makes **Yhwach's corpse the new linchpin**; Royal Guard revive one another by name-calling; >1M years of service.
  - *Game references*: **[RoS]** "Paint Over Gauge" (attacks fill it; when full the foe is coated in ink → deals half damage, takes more, restricted spirit energy); Awakening = Shin'uchi writes "Black Ant" on them; drinking from the cup (*Futen Taisatsuryō: Eishō*) **four times → fifth use = instant-win mausoleum**. **[BS]** Strong attacks: Senri Tsūtenshō, Ura Hadō Teppūsatsu; special: Futen Taisatsuryō.
- **Passives & weaknesses:**
  - Passives: zero reiatsu signature; steal immunity (Black returns); revival by name-call; Name Curse aura; heavy-air home turf (his dojo).
  - Weaknesses: **The Almighty** (precognition + adaptation) can shrug off renaming and nullify Futen Taisatsuryō by "seeing" it [M]; Futen Taisatsuryō needs a long ritual (interruptible in principle); after revival his **powers return slowly**; overconfidence/excessive force (he Bankai'd an already beaten foe).
- **Signature moments to recreate (story-mode set pieces):**
  1. **Royal Guard descent** via the Tenchūren; Ichibe'e cuffs Kirinji for mouthing off at Suì-Fēng [M].
  2. **Irazu Sandō** walk with Ichigo — reciting a poem as pressure crushes Ichigo [M].
  3. **Renji's true Bankai name** revealed in the inner room [M].
  4. **Hiding the palace** with 隠 as the Quincy arrive [M].
  5. **Two lines and a Seal** on the Vestibule Road → Senri Tsūtenshō launch → he's already waiting beside Yhwach in the sky → second palm; Yhwach rockets back by shooting himself with his own arrow [M].
  6. "Ude → u", "Yhwach → Yhw" — the name-cut sequence; clapping Yhwach's reishi pillars to dust [M].
  7. Hyapporankan → Blut Vene Anhaben → **dragon-head Teppūsatsu** → throat grab → **muscle-flex** that bursts Yhwach's face [M].
  8. **Shikai release**: black drains out of people in the city below; Sankt Altar fails; titanic ink splash [M].
  9. **Shin'uchi**: writes "Black Ant" → giant foot through the floor → giant palms crush [M].
  10. **The Almighty**: impaled, Futen Taisatsuryō mausoleum, torso blown away, head at Yhwach's feet [M].
  11. **Revival**: Ichigo says his name; a black mass lifts his head and becomes his body [M].
  12. [A-ep 390] Lichtreich flashback: stopping arrows with a fist and sealing Yhwach's eyes with the palm-eye. [A-ep 409] salamander ritual at the Seal.
- **Kit proposal:**
  - **All forms — passives:** no aura, invisible to reiatsu sensing; *Name Curse* aura (8 m) silences enemies who use a named special on him; on death → **"Call his name" revive prompt** for allies/co-op (single-player: an NPC calls after 5 s, once per fight); revived with all cooldowns locked 20 s.
  - **Sealed (brush)**
    - Shift: master Shunpo; double-tap with lock-on = appears beside the target **even after launching them out of the map** (pairs with Q).
    - LMB chain (calligraphy strokes, 5 hits): slash ↘, return ↗, horizontal 一, vertical 丨, flick-thrust. **Each hit on a limb applies Name Cut to that limb** (halves that limb's attack/move contribution). Forward = brush-thrust lunge; back = rising stroke launcher; air chain = cursive swirl; down-air = vertical stroke slam (cuts the legs' name → slow); sprint = dashing 一 stroke.
    - Hold LMB: **Full-body Name Halving** — a stroke from crown to foot: target's whole name halved → all stats ×0.5 (60 s or until cleansed) + huge knockback (the 1,000-ri swat).
    - Q: **Senri Tsūtenshō — Palm**: giant palm shove; target is launched **out of the playable area** and returns after ~6 s (or immediately if Ichibe'e Shift-follows). Hold = aim, in air = palm slams downward (crater).
    - E: **Senri Tsūtenshō — Foot**: giant foot stomp from above; pins, craters, punches through floors/levels.
    - R: **Twin-palm Clap**: crush the target or **an incoming projectile/beam** between two giant palms (projectile delete).
    - F: **封 Fū**: tap = barrier wall nothing passes (8 s); hold = paint **two boundary lines** → arena (enemies inside can't exit; he gains damage while inside).
    - Z: **隠 Kaku**: hide a large object/area or allies from enemy view (team-masked invisibility, breaks on attack).
    - X: **Kidō** — tap: Hyapporankan; hold: Ura Hadō Sannodō Teppūsatsu (barrier-breaking gale).
    - G: **Kill mode** toggle — eyes go white: +damage, +poise, no flinch; AI tell.
    - C (hold): **Flex** — no aura; bulging muscles + ground cracks; reverses any attached drain/corrosion back into its source (damage) and cleanses DoTs.
    - T: release Shikai. · V: **True-name Reading** — reads the target's true name: reveals their kit and permanently **censors** one chosen ability for the fight.
    - Tab: Kidō list (canon: Hyapporankan, Teppūsatsu; generic Bakudō/Hadō allowed — he is a Kidō master), Kanji list (canon: 隠, 封; any further kanji are [X]).
  - **Shikai (Kuromeyo, Ichimonji)**
    - Shift: Shunpo leaving black ink streaks in the air (streaks splash nearby enemies).
    - LMB: glaive cuts; **every swing throws ink**; target ink meter fills (Paint Over); at 100% → **Nameless**: weapon and all named abilities disabled, UI nameplate blanked, their summons/constructs lose function.
    - Hold LMB: **Ink tsunami** — a wide wall of ink that floods the platform edge to edge.
    - Q/E/R: as sealed (giant limbs). F/Z: kanji as sealed.
    - X: **Black Harvest** — black drains from everything in range (NPC clothes/hair desaturate, black voxels fade to grey) → refills meter/HP; while active, any power theft against him fails and returns.
    - G: **Halo rain** — the ink halo drips ink in a radius (passive inking field).
    - C: Flex + ink burst. · T: Shin'uchi.
    - V: **Futen Taisatsuryō** — 4 s ritual with super-armor: black gathers from the world (sky darkens, nearby black voxels stream to him) → sake cup → drink → bind (Hyapporankan rods) → chant → black **mausoleum** (≈30 m construct) erupts with fence, skulls, broken graves → target is erased (PvE: deleted, no revive; PvP: KO that can't be revived). Optional [RoS] variant: 4 "Eishō" drinks as stacks, 5th = finisher.
  - **Shin'uchi (Shirafude Ichimonji)**
    - All Shikai inputs, plus: Z becomes **Rename** — on a Nameless target, write a kanji: canon **黒蟻 Kuroari** (stats ×0.05, flinches from everything, model shrinks 25%). Extra names are **[X]** and optional (e.g. 石 "stone" = petrify, 紙 "paper" = blown by wind and shredded by cuts) — keep them clearly non-canon.
    - R becomes **Ant Crusher**: giant foot through the floor → twin palms (canon sequence).
    - G: the **white circle** (6 m) — inside it, Rename has no cooldown.
    - V: Futen Taisatsuryō (empowered; ritual 2 s).
- **AI notes:** jovial, laughs, grins, scolds. **Phase 1 (sealed):** warns the player not to say his name (Name Curse active), draws two lines and a Fū seal behind him; opens with Senri Tsūtenshō ring-out and is already waiting when the player returns; name-cuts limbs. **Phase 2 (eyes turn white)** when the player breaks a Bind or raises a barrier: Hyapporankan → Teppūsatsu → throat grab → flex. **Phase 3:** releases Shikai; floods arena with ink; uses Black Harvest if the player tries any drain/steal. **Phase 4:** at 100% ink → Shin'uchi, writes Kuroari, foot + palms. **Desperation:** Futen Taisatsuryō channel — the player must leave the mausoleum footprint or use a "precognition/counter" item to survive. **Death:** head remains; an NPC calls his name; he returns at reduced power for a short last phase (no Shikai for 30 s). Personality tell: never runs, never shows aura, mock-polite taunts.
- **Callouts:** "Kuromeyo, Ichimonji" · "Shin'uchi — Shirafude Ichimonji" · "Senri Tsūtenshō" · "Hyapporankan" · "Ura Hadō, Sannodō — Teppūsatsu" · "Futen Taisatsuryō" · "Kuroari" · "Kaku" / "Fū" (as written kanji, spoken optional). Short taunt themes: don't say my name; "Yhw"; that which has no name has no power.

---

## 3. Senjumaru Shutara (修多羅 千手丸) — Fourth Officer of the Zero Division, Divine General of the North, "Great Weave Guard" (大織守, Ōorigami)
- **Wiki:** https://bleach.fandom.com/wiki/Senjumaru_Shutara
- **Roster tier:** **A** — a complete, very visual kit: six-armed needle melee, sewing traps, illusion tapestries, decoys, healing, and a domain Bankai with six elemental cloth patterns. Note that the Bankai's on-screen powers are **anime-only**.
- **Canon power (1–10): 9 (10 unsealed)** — killed Nianzol with a tailoring trap, fooled the whole Quincy assault with a fake palace; her Bankai sealed the **entire Auswählen-boosted Schutzstaffel at once** and only The Almighty's interference saved them [A-ep 392–393]; her release shook the Three Worlds.
- **Body:** **158 cm → 51 voxels** — shortest of the Zero Division, but **extremely thick-soled okobo** clogs add ≈ 13 cm (4 vox) → stands ≈ 55 vox. Slender, youthful. Silhouette keys: **six long golden skeletal arms** fanning from her back (3 pairs; resting length ≈ 1.3 m / 42 vox each, can stretch several meters; long elongatable fingers), a **large golden crescent-moon ornament with radiating spikes** behind her head (≈ 50 cm across / 16 vox, est.), long straight black hair, layered **white robes** (shihakushō → white long-sleeved haori → an extra white over-robe fastened at the center of the chest) with long sleeves that hide her real hands.
- **Palette (hex estimates):**
  - Skin `#F7E6DA` (pale); hair black `#0D0D10` (sheen `#2A2A35`); eyes dark (verify).
  - Crescent ornament gold `#D2A429`, highlight `#F2D46B`.
  - Prosthetic arms gold `#C9A227`, joint knobs `#8C6B12`, specular `#F0D36A`.
  - Robes white `#F5F3EE` (shadow `#CFCBC2`); shihakushō black `#161616`; okobo black lacquer `#141414` (straps: verify).
  - Shigarami needle: pale gold-silver `#D9D2B8` (verify); **thread red** `#C8102E`.
  - Reiatsu: **yellow** `#F3D33B` [M/A — the wiki states her reiatsu is yellow].
  - Bankai: darkness `#07070A`; torii (verify color; est. vermilion `#C23B22`) → **golden loom** `#D4AF37` with iridescent shimmer (cycle `#F5D76E → #8FE3FF → #E59BFF`); endless **red tanmono** `#B0141E`.
  - Six hanks: ① purple `#5B2A86` + rhombus/eye pattern `#E8D7FF`; ② gold `#C9A227` + rows of barbed scales `#7A5C10`; ③ black `#151515` + grey spiral fractals `#7A7A7A`; ④ blue `#2E5FA8` + white interlinked snowflakes `#EAF3FF`; ⑤ red `#B3261E` + black trees `#111111` aflame `#FF7A1A`; ⑥ dark blue `#1B2550` + Wandenreich emblem `#DDE8FF` + siphoned particles `#9CC9FF`. Hollow-pattern cloth: white masks on dark ground (verify).
- **Look by form/outfit:**
  - **Base (TYBW)** [M]: as above; the six arms do all the work while her body stays still and upright (a key animation trait — she barely moves her torso).
  - **Arrival** [M]: plays **several musical instruments at once** with the arms (fanfare).
  - **Bankai** [A-ep 392]: same outfit; arms raised back toward the torii "as if in prayer"; the arena becomes a loom-temple.
- **Weapons:**
  - **Shigarami (刺絡, "Piercing Entanglement")**: sealed form **unknown**; Shikai = a **sewing needle** (≈ 50 cm / 16 vox, est.) held by the skeletal hands; **infinite red reishi thread** runs from its eye. Used as a stabbing weapon (heart/neck) and as a weaving tool. Release command unknown.
  - Bankai keeps the needle as a melee weapon.
- **Forms & states (ordered):**
  1. **Shikai (default)** — needle + thread; sewing/tailoring/illusion kit.
  2. **Bankai — Shatatsu Karagara Shigarami no Tsuji (娑闥迦羅骸刺絡辻)** [A-ep 392–393] — gated by the Blood Oath's Seal (three other generals dead). Darkness swallows the area; a **torii-like gate** rises, she lifts her arms to it, it blooms with iridescent light into a **giant golden loom**; red cloth rolls out like carpet to side looms, more red cloth walls the arena in like a barrier, patterned bolts hang from above; tremors across the Three Worlds.
- **Abilities (complete):**
  - *Equipment* — `Prosthetic Arms` [M]: three pairs, thought-controlled, very dexterous, each can hold a grown Shinigami; **arms and fingers elongate** (e.g., to become an umbrella's shaft and ribs) `[Grab/Throw][NEW: limb stretch]`.
  - *Master Weaver* [M]: re-tailors a whole outfit in seconds without the wearer noticing; **sews people to surfaces** with many threads; builds an **umbrella** or a **doll double** just as fast `[Bind][Construct][Afterimage/Clone]`.
  - *Utility* [M]: carried the critically injured (and Ichigo's broken Bankai) in **large translucent orbs** `[Shield: stasis orb]`; locked doors "open by themselves" when she touches them (Mayuri's lab); manifests a **spiral staircase** from the palace to the Seireitei `[Construct]`; takes body measurements and makes **Ōken clothing** (section 1.4); inventor of the **shihakushō** (black so blood stains don't matter — and so they harmonize with Ichibe'e's Black) [M/N/KO].
  - *Lore* [KO #548, #807]: led an unofficial inventors' circle with **Mayuri as her subordinate**; created the **"Shutara Scale"**, the SRDI's threat-level gauge → use the name for the game's threat/danger UI.
  - *Racial*: Shunpo expert (kept pace with Uryū) [A-ep 392]; immeasurable reiatsu (yellow).
  - *Shikai — Shigarami* [M unless noted]
    - `Tapestry Backdrops` — huge tapestries drop to enclose a space and show **photoreal fake scenery**, hiding her and her allies. She staged a **complete fake Soul King Palace**: the Quincy "killed" her (Lille blew a hole through her head, Pernida balled up the corpse), then the whole landscape **lifted away like cloth**, revealing her unharmed and the real palace (hidden by Ichibe'e's 隠) [M ch 598–600] `[Field: illusion][NEW: FakeGeometryLayer]`.
    - `Hidden soldiers` — Divine Soldiers concealed behind camouflage tapestries ambush from behind [M].
    - `Refashion ("my bad habit")` — while Nianzol was busy, she **re-tailored his clothes with her fabric**; on her word, **dozens of spikes inside the garment skewered him** from within; she then quipped that leaving needles in her tailoring is a bad habit of hers [M ch 598–599] `[Status: delayed trap][NEW: OutfitLayer]`.
    - `Sew to the Ground` — pins targets with threads [M] `[Bind]`.
    - `Needle strikes` — thrusts at heart/neck [M]. Gerard's Hoffnung **shattered the needle** in one slash [M ch 599]; in the anime rematch a **decoy dummy** took Hoffnung through the chest, she pinned Gerard's wrists/ankles/waist with thread, but his heart (the Soul King's heart) stopped the needle after an inch, and he tore free [A-ep 392].
    - `Umbrella` — weaves an umbrella in seconds with all six arms; tough enough to take Uryū's **Licht Regen and reflect it back** [A-ep 391] `[Shield][Absorb/Reflect/Redirect]`.
    - `Cotton Suture` — stuffs an ally's wounds with cotton and thread that **rebuild lost flesh** in moments (saved Nimaiya after The X-Axis) [A-ep 392] `[Heal/Reject]` (game: may also patch destroyed voxels with cloth-textured voxels [X]).
    - `Rag-doll Double` — a stuffed dummy of herself takes hits in her place [A-ep 392–393] `[Afterimage/Clone]`.
    - `Call the Shield` — summons a giant **Second-Class Divine Soldier** [M ch 599] `[Summon]`.
  - *Bankai* [A-ep 392–393]
    - `Loom Domain` — she controls the space inside the Bankai with cloth; weavings are **patterned to counter each enemy's nature**; she sets the **number of weavings to the number of foes** (the technique's name/abilities change with the count) `[Field: domain][Construct]`.
    - `Shide no Rokushiki Ukimon no Hata (死出六色浮文機, "Loom of the Six-Colored Floating Patterns of Death")` — six tapestries for six foes; one **hank** unravels at a time, each creating an environment that grinds its victim down while the cloth traps them; then she **cuts all finished pieces off the loom with the victims sealed inside** (seemingly bypassing the one-element limit of elemental Zanpakutō) `[Status: sealed-in-cloth][NEW: ClothSeal]`:
      - ① `Hitokase Tokaba: Banra no Me (一綛解かば 万朶の眼, "Eyes of Many Branches")` — purple rhombus/eye cloth grows **real eyes** and **eight mirrors** that show her image and **reflect the victim's attacks onto them** (used on Lille) `[Field][Absorb/Reflect/Redirect][Afterimage/Clone]`.
      - ② `Futakase Tokaba: Hagane no Yoroi (二綛解かば 刃金のよろい, "Armor of Blade Metal")` — gold barbed-scale cloth turns into **spiked steel sheets cut in her likeness** that close like an iron maiden (Askin) `[Bind][Construct]`.
      - ③ `Mitsukase Tokaba: Kokusa no Harawata (三綛解かば 黒砂の腸, "Bowels of Black Sand")` — black spiral cloth becomes a **whirling black-sand pit** that swallows whole (Pernida) `[Field: quicksand][Environmental: sinkhole]`.
      - ④ `Yotsukase Tokaba: Itetsuku Shitone (四綛解かば 凍てつく褥, "Freezing Bed Linens")` — blue snowflake cloth makes an **arctic zone**, binding and freezing solid (Gerard) `[Field: freeze][Status: freeze][Environmental]`.
      - ⑤ `Itsukase Tokaba: Yakenohara (五綛解かば 焼野原, "Burning Field")` — a row of red cloths of black burning trees frames a **hallway of fire** that burns to ash (Haschwalth) `[Field: heat][Status: burn][Environmental: fire]`.
      - ⑥ `Mutsukase Tokaba: Yamiyo no Hoshiyo (六綛解かば 闇夜の星よ, "Star of the Dark Night")` — dark-blue cloth with the Wandenreich emblem **imitates Auswählen**, draining energy (Uryū) `[Absorb][Status: drain]`.
      - She recites a short ominous verse per hank (paraphrase only; e.g., eyes that stare back are crushed / nothing left to wear / dragged down is fatal / a bed never woken from / no escape until ash / caught by the star of death).
      - Trivia worth a story Easter egg: each pattern **foreshadows how that Schutzstaffel member later dies** in the manga.
    - `Hollow Pattern` — when Uryū escaped, she wove new cloths with a **Hollow design that released Hollows** at him `[Summon: swarm]`.
- **Passives & weaknesses:**
  - Passives: decoy-first defense; tailoring traps placed earlier stay armed; yellow reiatsu flare.
  - Weaknesses: **Blood Oath's Seal** (Bankai needs the other three dead); illusions are broken once someone sees through/pulls the cloth; precognition (The Almighty freed Uryū); **reversal powers** — Uryū's Antithesis swapped their states, sealing her in her own cloth before an arrow pierced her heart [A-ep 393]; overwhelming blades (Hoffnung) break the needle.
- **Signature moments to recreate:**
  1. Fanfare arrival with instruments; orbs carrying the injured; the lab door that "opens itself" (Mayuri bit) [M].
  2. Fitting room: forcing Renji to strip for measurements (comic) [M].
  3. Spiral stairs for Ichigo [M].
  4. **Nianzol trap**: tapestry ambush → "your clothes are mine now" → spikes [M].
  5. **The fake palace**: getting "killed" by Lille, then the world peels away like fabric [M].
  6. Umbrella vs. Licht Regen [A-ep 391]; cotton-healing Nimaiya [A-ep 392].
  7. **Bankai** after the other three generals fall: six hanks seal six Quincy one by one [A-ep 392].
  8. Uryū breaks free → Hollow cloth → Antithesis reversal → death [A-ep 393].
- **Kit proposal:**
  - **Shikai (default)**
    - Shift: Shunpo (expert); a red thread trail lingers 1 s and snags enemies crossing it [X].
    - LMB chain: **six-arm needle flurry** ("thousand hands": 6 rapid stabs per press, thin pierce); each hit leaves a **stitch** (Bind stacks; 5 stacks = sewn in place). Forward = arms stretch for a long-range thrust; back = rising stitch that yanks the target up by thread (launcher); air chain = spinning arm wheel; down-air = **sew-to-ground** spike; sprint = dash-through stitching that tacks enemies to walls.
    - Hold LMB: **Heart Stitch** — precise lethal thrust (armor-piercing, crit vs. stunned).
    - Q: **Sew Down** — threads pin target(s) to floor/wall (hold to widen).
    - E: **Refashion** — tag a target's outfit (1 s channel at close range, or instant on a stunned foe); press again any time later → hidden spikes burst from inside their clothes (big damage + bleed; stacks up to 3 tagged foes).
    - R: **Umbrella** — instant woven umbrella shield that reflects projectiles/beams back.
    - F: **Rag-doll Double** — swap with a doll that takes the next hit (and can be detonated with E's spikes [X]).
    - Z: **Tapestry** — drop a giant curtain-wall that shows fake scenery: blocks enemy vision, hides allies, can enclose a "fake room"; hold to build a full illusion box; pressing again "pulls the cloth" (reveal + stagger enemies inside).
    - X: **Cotton Suture** — heal ally/self, restores lost limbs/limb-cuts; on terrain [X] patches holes with cloth voxels.
    - G: **Long-arm stance** — arms and fingers elongate: reach ×2, slower but multi-target.
    - C: yellow reiatsu flare.
    - T: Bankai (only when 3 Seal candles are out).
    - V: **Ōken Tailoring** — instantly re-dress all allies in Ōken clothing (big damage reduction + mind-control immunity for 30 s).
    - Tab: Divine Soldier squad (summon), Second-Class Divine Soldier (giant shield summon), Spiral Staircase (construct path), Stasis Orb (carry a downed ally), Fanfare (emote: six-instrument music).
  - **Bankai (Shatatsu Karagara Shigarami no Tsuji)** — on release the arena is converted into the loom domain (red cloth barrier walls; patterned bolts overhead).
    - Shift: rides the red carpet-cloth lanes (fast travel along cloth) [X]; LMB: needle + whipping cloth bolts.
    - Q/E/R/F/Z/X = **Hanks ①–⑥** on the locked target (each spawns its environment around that target and traps them for several seconds): Banra no Me (mirror reflect), Hagane no Yoroi (iron maiden), Kokusa no Harawata (black sand pit), Itetsuku Shitone (freeze), Yakenohara (fire hall), Yamiyo no Hoshiyo (drain).
    - G: **Hollow Pattern** — unfurl a cloth that releases a pack of Hollows.
    - V: **Shide no Rokushiki Ukimon no Hata** — weave one bolt per enemy (scales to enemy count), unravel all, then cut: every trapped enemy is **sealed into cloth** (KO; boss enemies take massive damage instead).
    - Tab: pattern assignment wheel — pick which hank goes on which foe (canon: patterns are chosen to counter each foe).
- **AI notes:** polite, unhurried, contemptuous of Quincy. Always opens with **misdirection**: the first "phase" of her boss fight happens inside a tapestry illusion — when the player "kills" her, the scenery peels away and the real fight begins with her untouched. Tags aggressive melee players with Refashion and triggers it when they commit; umbrella vs. ranged; heals allies in the Royal Guard raid; keeps a doll double ready at low HP. Uses Bankai only after the other three Divine Generals are down (candles). Quip after a trap kill: "bad habit".
- **Callouts:** "Bankai — Shatatsu Karagara Shigarami no Tsuji" · "Shide no Rokushiki Ukimon no Hata" · "Hitokase tokaba — Banra no Me" · "Futakase tokaba — Hagane no Yoroi" · "Mitsukase tokaba — Kokusa no Harawata" · "Yotsukase tokaba — Itetsuku Shitone" · "Itsukase tokaba — Yakenohara" · "Mutsukase tokaba — Yamiyo no Hoshiyo" · quip: "warui kuse" (bad habit). (Uses archaic first-person *warawa*.)

---

## 4. Ōetsu Nimaiya (二枚屋 王悦) — Third Officer of the Zero Division, Divine General of the West, "God of the Sword" (刀神, Tōshin)
- **Wiki:** https://bleach.fandom.com/wiki/%C5%8Cetsu_Nimaiya · https://bleach.fandom.com/wiki/H%C5%8D%C5%8Dden · https://bleach.fandom.com/wiki/Soul_King_Palace_Residents
- **Roster tier:** **B** — fantastic swordsman/showman with strong canon set pieces, but **his own Shikai and Bankai were never shown**; his kit leans on Sayafushi, speed, Kidō rings, Asauchi and his forge crew.
- **Canon power (1–10): 9** — cut down Gerard, Lille and Pernida with **one stroke each** and Askin twice using a "failed" sword, while sealed; dodged Lille's instant X-Axis repeatedly; unsealed, his pressure would be felt in all three worlds.
- **Body:** **172 cm → 55 voxels**, 62 kg — slim, light. The puffer jacket adds bulk to the torso (+2 vox per side). Silhouette keys: **dark skin**, a **thick mass of black hair on top with the sides shaved and dyed green**, **gold-framed blue-lens sunglasses**, **white sleeveless puffer jacket**, **short hakama showing the shins**, green gold-trimmed slippers, flamboyant poses.
- **Palette (hex estimates):**
  - Skin dark brown `#5A3A24` (shadow `#3E2716`, highlight `#7A5235`).
  - Hair top black `#111111`; shaved sides green `#3FA34D`.
  - Eyes amber `#D9952B`; sunglasses frame gold `#D4AF37`, lenses blue `#2B6CD4` (60% opacity).
  - Jacket white `#F4F4F2`, quilting seams `#D2D2CE`, insignia + hem pattern black `#1A1A1A`.
  - Undergarment green `#2F8F4E`; shortened hakama black `#171717`; slippers green `#2F8F4E` with gold trim `#D4AF37`.
  - Sayafushi: mirror-bright blade `#D7DCE2` (cool tint), bronze oval tsuba `#A8743A` with raised ring `#C79257`, hilt wrapped in black cloth `#141414`.
  - Sword tank: glass `#CFE8F2` (30%), jelly `#9ED8C8` (50%) (verify).
  - Reiatsu: **unknown** — propose gold `#E8C64A` with green flecks `#3FA34D` [X].
- **Look by form/outfit:** only one outfit (TYBW) [M]. Key details: sunglasses always on; jacket's back insignia; hem pattern of circles/diamonds; bare lower legs. Props: the **jelly sword tank**; a **black long-handled hammer** (Tsumiko's tooth) at the forge.
- **Weapons:**
  - **Sayafushi (鞘伏, "Sheath Cover")** [M]: a standard katana he forged (≈ 100 cm total / 32 vox; blade ≈ 70 cm / 22 vox). He calls it a **failure**: too sharp, too smooth — never chips, blood slides off, and **no scabbard can hold it**, so he keeps it **floating in a tank of jelly**. Its swing makes **no sound**; when it cuts there is only a **soft bass vibration**. Cuts through anything; forte slightly "unstable" from disuse.
  - Own Zanpakutō: **Shikai and Bankai not revealed** (Bankai only usable with the Seal lifted).
- **Forms & states (ordered):** 1. **Sayafushi / sealed general** (only canon form). 2. **[X] "Seal lifted" stance** — optional unsealed state (no canon visuals; aura + speed only) if a release is wanted on `T`.
- **Abilities (complete):**
  - *Master Swordsmith* [M]: forges **every Asauchi** (the "strongest" Zanpakutō because they can become anything); the **only one who can reforge a broken Zanpakutō/Bankai**; creates Zanpakutō spirits with their own will (his female forge crew); makes unbreakable, over-sharp blades. Retired Shinigami's swords come back to him to be reforged into new Asauchi [KO #495].
  - `Zanpakutō Sense` [M/KO #488]: knows **where every Zanpakutō is**, who holds it and what it became `[Sensing: global sword radar]`.
  - `Unloved Blades Break` [M]: shattered Ichigo's and Renji's Zanpakutō on the spot ("a Zanpakutō that is not loved breaks easily") `[Status: weapon break][X: vs. Zanpakutō wielders]`.
  - `Wrath of the Asauchi` [M]: in the Hōōden pit he set **hordes of Asauchi** on Ichigo and Renji for three days and nights (Asauchi manifest as **blank humanoids with two small mouths for eyes** [M, Zanpakutō page]) `[Swarm][Summon]`.
  - `The Forge` [M]: kicks the candidate down a **water slide** to the cavern forge; his five spirits leap out (Mera fire, Tokie water, Hasuka hair-clamp, Nonomi carves the furnace from stone pillars, Tsumiko's tooth-hammer); Nimaiya hammers the Asauchi; when Ichigo seized the blade mid-forging, the heat **vaporized the whole sea around the forge** `[Blast: steam][Environmental: evaporate water]`.
  - `Chōkaimon portal` [M]: restrained Ichigo and **sent him to Karakura Town** through a portal ("Bye-Bye-Bye") `[Teleport: banish][Grab/Throw]`.
  - `Kidō rings` [M]: two **ring-shaped energy restraints** fired from both forefingers at once, no incantation `[Bind]`.
  - *Master Swordsman* [M ch 600–602]: leans back to dodge ("hugs from men are made to be dodged"); one-stroke kills before reaction (Gerard); **deflects and cuts Heilig Pfeil** then cuts the shooter (Lille); **impales through the head** (Pernida); cuts the throat (Askin); can **throw his sword** with pinpoint accuracy to neutralize a distant foe `[MeleeArc cut: ignores hardness][Slice][Projectile: thrown sword]`.
  - *Shunpo master* [M]: the Schutzstaffel couldn't react; second strike on Askin landed before Askin knew; evaded The X-Axis with constant motion [A-ep 392] `[Mobility]`.
  - *Endurance / quick thinking* [M ch 602]: when Askin's *Deathdealing* made his own blood lethal, he **cut his own throat to bleed below the lethal dose**, kept fighting while hemorrhaging, then had **Kirinji replace all his blood** with red spring water and cut Askin down `[NEW: blood-volume stat; self-bleed purge]`.
  - *Showman*: "I am Number 1 Zanpakutō Creator!!", "Welcome to My Shooooow!", "Love It!!!", "So High!!!", "Bye-Bye-Bye", "THX!" (English lines) [M].
  - *Game reference* [BS]: special **"Sayafushi: Itofuri Issatsu"** ("one swing, one kill") — dramatic intro then a single bloody draw-cut with a small instant-kill chance.
- **Passives & weaknesses:**
  - Passives: Zanpakutō radar; silent weapon audio; parry-cuts projectiles.
  - Weaknesses: Seal-locked (no forms); **The X-Axis** pierced the two Royal Guard blades shielding him and hit his heart (post-Auswählen) [M ch 604]; lethal-dose manipulation forces a costly self-bleed; underestimated Lille's precise targeting [A-ep 392].
- **Signature moments to recreate:**
  1. Greeting Ichigo & Renji in the **Galaxy Hōōden** with his Zanpakutō girls; Mera kicks him [M].
  2. The **Hōōden pit**: swords shattered, three days vs. the Asauchi horde [M].
  3. "Bye-Bye-Bye": kicks Ichigo through a portal to Karakura [M].
  4. The **forge**: slide → spirit crew → sea evaporates as Ichigo grabs the blade [M].
  5. **Sayafushi drawn from the jelly tank**: Gerard, Lille, Pernida, Askin fall [M].
  6. **Throat cut** vs. Askin; Kirinji's red water; second kill [M].
  7. Lille's revived X-Axis through his heart; Senjumaru saves him [M/A-ep 392]; he declares the Royal Guard haven't used a fraction of their power and gives his life for the Seal [A-ep 392].
- **Kit proposal (single form):**
  - Shift: master Shunpo — instant; double-tap behind target = "already passed" cut (target bleeds 0.5 s later).
  - LMB chain (iai-speed, 4 hits): silent cuts with a low bass thump on contact; **cuts ignore voxel hardness** (clean `cut`-mode slices through any wall). Forward = head-impaling lunge; back = rising cut launcher; air chain = pinwheel; down-air = plunging stab; sprint = pass-through cut.
  - Hold LMB: **Itofuri Issatsu** [BS name] — one perfect draw-cut: `Slice` plane through structures; executes non-boss enemies below 25% HP.
  - Q: **Sword Throw** — pinpoint thrown Sayafushi (pierces everything in line); press again to Shunpo to the blade and rip it out.
  - E: **Arrow Cutter** — parry stance that slices incoming projectiles/beams (counter-dash on success).
  - R: **Kidō Rings** — twin finger rings bind one target (or two).
  - F: **Bloodletting** — sacrifice HP to purge poison/blood-type debuffs; +speed while bleeding; an ally's red water (Kirinji) refills.
  - Z: **Forge Crew** — call a spirit (Tab picks): Mera fire cone, Tokie flood, Hasuka hair bind, Nonomi terrain carving (bores tunnels/pillars), Tsumiko hammer (swap to heavy hammer combo for 10 s). Combat use is [X] (canon: bodyguards/forge crew).
  - X: **Asauchi Horde** — release a swarm of blank Asauchi spirits that mob the area.
  - G: **Zanpakutō Sense** — toggle: all sword-wielders visible through walls with their release state.
  - C: showman flare (spotlights/stage-light aura [X]); unsealed: global tremor.
  - T: no canon release — either locked, or [X] "Seal lifted" stance.
  - V: **"Welcome to My Show"** — grab a target with Kidō rings, open a Chōkaimon and **kick them out of the arena** ("Bye-Bye-Bye"; ring-out, returns after 10 s); vs. allies: **Reforge** — fully restores a broken weapon/Bankai.
  - Tab: forge spirits, Reforge (ally), Shatter (break a Zanpakutō wielder's sword for 15 s).
- **AI notes:** loud, playful, English one-liners; dodges by leaning back; punishes any projectile with a parry-cut; finishes in one stroke when the player is staggered. Calls out "THX!" after the player reveals a mechanic. Never releases (sealed) — but at 25% HP in a Royal Guard raid he may "give his life for the Seal" (removes himself, buffs Senjumaru).
- **Callouts:** "I am Number 1 Zanpakutō Creator!!" · "Welcome to My Shooooow!" · "Love It!!!" · "Bye-Bye-Bye" · "THX!" · "So High!!!" · (BS) "Sayafushi: Itofuri Issatsu".

---

## 5. Tenjirō Kirinji (麒麟寺 天示郎) — First Officer of the Zero Division, Divine General of the East, "Hot Spring Demon" (泉湯鬼, Sentōki)
- **Wiki:** https://bleach.fandom.com/wiki/Tenjir%C5%8D_Kirinji
- **Roster tier:** **B** — speed brawler with a polearm, scalding/healing water and a blinding-light Shikai; strong support identity (healing, blood refill).
- **Canon power (1–10): 8.5** — beat Sternritter Grandmaster Haschwalth with his Shikai while sealed (stripped and threw away his Freund Schild) [M ch 602, expanded A-ep 391]; faster than Suì-Fēng; inventor of Kaidō. Lost to Vollständig Askin [A-ep 392].
- **Body:** **193 cm → 62 voxels**, lean and very tall with long limbs. Silhouette keys: **gigantic black pompadour** projecting forward (≈ 30 cm / 10 vox forward, +5 vox up; the trivia says it can bear **120 kg** — let characters stand on it [X easter egg]), tapered sideburns, **wide inward-slanted eyes with pinprick pupils**, a **small stick in his mouth**, cropped sleeveless open-chest top, **cropped white jacket**, black hakama, **yellow haramaki** (belly band), **waraji** sandals, bare feet.
- **Palette (hex estimates):**
  - Skin `#E3BC98`; hair black `#0F0F12` with blue sheen `#1F2A3A`; eyes white with tiny black pupils; stick `#C8A06A`.
  - Jacket white `#F4F4F2` + insignia/hem pattern `#1A1A1A`; top & hakama black `#161616`; haramaki yellow `#E5C63A`; waraji straw `#CDB178`, straps `#6B5536`.
  - Kinpika: pole wood `#8A5A2E`, blade steel `#B9BEC4`, wooden sheath `#D1B48A` with brush-written **きりんじ** `#1A1A1A`; Shikai glow core `#FFF7D6`, halo `#FFD34D`.
  - White water: milky `#EDEDE6` + steam `#FFFFFF` (30%); red water: `#A3121C`, pink-tinged steam `#F2B8B8` (30%); Kaidō green `#7CFFB2`.
  - Reiatsu: unknown (verify) — the Shikai light (gold-white) is the safe signature.
- **Look by form/outfit:** single outfit [M]; on arrival he carries a **flag with the Royal Guard emblem** [M]. Shikai: blade blazes with light.
- **Weapons:** **Kinpika (金毘迦, "Gilded Splendor")** [M] — polearm: long wooden pole (≈ 2.4 m / 77 vox, est.) with a small single-edged blade (≈ 30 cm / 10 vox); the blade sits in a **wooden sheath with "Kirinji" written on it**, which makes the sheathed weapon look like an **eku (Okinawan oar)** — broad flat paddle head.
- **Forms & states (ordered):** 1. **Sealed** (sheathed oar-polearm, fists, hot springs). 2. **Shikai "Tenshō Issen" (天照一閃, "Flash from Illuminating Heavens")** — blade glows brightly (original pre-vol. 65 command: "Kirameke", "Sparkle"). 3. Bankai **never revealed** (Seal).
- **Abilities (complete):**
  - *Master Healer* [M]: **invented Kaidō** (healing Kidō) and taught it to Unohana; healed Byakuya, Renji and Rukia when Unohana couldn't. Signature method: **balneotherapy** in two springs under the Kirinden:
    - `White Bone Hell (白骨地獄, Hakkotsu Jigoku)` — clear spring with small waterfalls and a giant sōzu; **flushes damaged reiatsu and blood** out of the body; its hyper-speed healing **erodes and ruptures** anyone not tough enough (attendants need spirit-thread suits).
    - `Blood Pond Hell (血の池地獄, Chi no Ike Jigoku)` — steaming pool like boiling blood; **refills blood**. The cycle (white → red, repeated) mends the gravest wounds. (Inspired by the real "Hells of Beppu".)
  - `Hot-Spring Water Manipulation` [M]: summons the waters anywhere and controls their **movement and temperature**: engulfed the arriving Quincy (Yhwach, Haschwalth, Uryū) in a torrent; **white water** scalds and **rots via over-healing**; **red water** instantly refills or **replaces all of an ally's blood** (Nimaiya) `[Environmental: flood][GroundWave][Status: burn, rot][Heal/Reject]`.
  - `Kaidō` [M] `[Heal/Reject]`.
  - *Shunpo master* [M/KO]: "**Raijin no Tenjirō**" (Lightning-Fast Tenjirō) from his lower-Rukongai days; excels at **Bakkyaku**, the second stage of Shunpo [KO #570]; slipped behind Suì-Fēng into an **arm lock** before she could perceive it `[Mobility][Grab/Throw]`.
  - *Strength* [M]: casually throws a grown man meters; a **punch** sends Ichigo flying (his "you're healed" test); one sealed swing scatters a group of Soldat `[MeleeArc smash]`.
  - *Durability* [M]: soaks in his own springs unprotected.
  - *Kidō master* [M].
  - *Shikai — Kinpika* [M]: the radiant blade **blinds** foes for a moment and **boosts his power** — he pierced Haschwalth's Freund Schild and hurled it off the palace `[Status: blind][Shield-break][NEW: ScreenFlash]`.
  - *Game reference* [BS]: special "Tenshō Issen, Kinpika" — a **wall of spring water** that paralyzes and auto-revives fallen allies once.
- **Passives & weaknesses:**
  - Passives: immune to his own waters; brawler poise.
  - Weaknesses: Seal-locked; Nianzol's *The Wind* made every blow veer off Yhwach [M]; post-Auswählen Askin put a point-blank Heilig Pfeil through his side [A-ep 392]; mouthy (gets struck by Ichibe'e/Hikifune).
- **Signature moments to recreate:**
  1. Arrival with the flag; arm-locking Suì-Fēng; getting floored by Ichibe'e [M].
  2. **Kirinden treatment**: Kazuo & Kazuhiro dunk Ichigo; Kirinji's test punch, Ichigo's counter injures his hand; patients catapulted to the next palace [M].
  3. **Hot-spring flood** on the invading Quincy; Shikai attacks that mysteriously miss Yhwach (The Wind) [M].
  4. **Vs. Haschwalth**: Freund Schild pierced and thrown off the palace [M/A-ep 391].
  5. **Red water transfusion** for Nimaiya mid-battle [M].
  6. Vs. Askin; throat-cut sacrifice for the Seal [A-ep 392].
- **Kit proposal:**
  - **Sealed**
    - Shift: **Raijin Shunpo** (Bakkyaku): longest/fastest dash in the roster; double-tap behind lock-on target = **arm-lock grab** (2 s stun, then throw).
    - LMB chain (yankī brawler + polearm): oar-head smacks, pole spins, a jab-straight-kick string. Forward = long thrust; back = upward scoop launcher (water splash); air = rotor spin; down-air = pole-vault slam; sprint = shoulder charge.
    - Hold LMB: **"You're healed" Punch** — charged straight that sends the target flying a long distance.
    - Q: **White Water** — scalding milky geyser/torrent on target area: burn + **over-heal rot** (damage grows if target is near full HP).
    - E: **Red Water** — ally/self: instant HP + "blood" refill, cleanses bleed/poison; can **replace blood** (removes any blood-based debuff).
    - R: **Hot-Spring Flood** — wave/wall of water sweeping a lane; knocks down, extinguishes fires.
    - F: **Arm Lock / Throw** — grab, joint lock, toss.
    - Z: **Kaidō** — channel heal (green hands).
    - X: **Bath Pool** — sink a steaming pit at the target spot (voxels carved and filled with white water; enemies inside take rot) [X].
    - G: **Temperature toggle** — "Scald" (Q/R apply burn) ↔ "Soothe" (Q/R heal allies instead).
    - C: flare. · T: Shikai.
    - V: **Kirinden Cycle** — drag the target through a white pool then a red pool in a 3 s cinematic: enemies take massive rot; allies are fully restored (revives downed allies in range once — nod to [BS]).
    - Tab: —.
  - **Shikai (Tenshō Issen, Kinpika)**
    - LMB: radiant cuts; every 3rd hit flashes (short blind).
    - Hold LMB: **Shield Piercer** — glowing thrust that breaks any shield/guard and **flings the shield item away** (disarms shield users).
    - Q: **Heavenly Flash** — full-screen whiteout for enemies in view (players' screens flash; AI loses target 2 s).
    - Others as sealed.
    - V: **Tenshō Issen** — light-speed chain of 8 dashing thrusts ending in a blinding flash slash `[Slice]`.
- **AI notes:** opens loud and fast; tests the player with a punch; floods the arena early (water lingers in low ground); arm-locks campers; uses Red Water on allies mid-raid (high priority target for players). Shikai when the player raises a shield/guard twice in a row. Throat-cut sacrifice at low HP in the raid.
- **Callouts:** "Tenshō Issen — Kinpika!" (older version: "Kirameke, Kinpika") · flavor: refers to his springs by name ("Hakkotsu Jigoku", "Chi no Ike Jigoku").

---

## 6. Kirio Hikifune (曳舟 桐生) — Second Officer of the Zero Division, Divine General of the South, "Ruler of Grain" (穀王, Kokuō); former 12th Division Captain
- **Wiki:** https://bleach.fandom.com/wiki/Kirio_Hikifune · Gikon: https://bleach.fandom.com/wiki/Gikon
- **Roster tier:** **B (support/zone)** — buffs through food, a reiatsu-eating tree that cages, partitions and crushes; two body shapes as a resource mechanic. Shikai/Bankai details unknown.
- **Canon power (1–10): 8** — her Cage of Life swallowed Lille's hyper-condensed bullets and held the whole invasion force until a Schrift trick got Yhwach out [M ch 600]; matched Kirinji's speed to intercept Lille [M ch 604]; lost to boosted Pernida [A-ep 392].
- **Body:** **174 cm → 56 voxels**, two shapes:
  - **Plump ("stocked") form** [M, TYBW default]: enormous round body (≈ 1.1 m wide / 35 vox, ≈ 0.9 m deep / 29 vox, est.), small head, **squinting eyes**, hair up in a **bun pinned with a large silver spoon-shaped ornament**.
  - **Slender form** [M]: after cooking or when her reiatsu is spent: slim and curvy, **hair down** (long, smooth, to mid-back, curled ends, side bangs framing the face), **obi hanging loose at the hip**.
  - 110-years-ago captain flashback: slender (verify reference for hair/haori).
- **Palette (hex estimates):**
  - Skin fair `#F6DCCB`; hair purple `#7E4FA3` (highlight `#A47BC7`, shadow `#5A3577`); eyes green `#39A86B`; **black lipstick** `#151515`; **red swirl marks under both eyes** `#C62F3A`; spoon ornament silver `#C3C7CC`.
  - Shihakushō black `#161616` (her first colour page showed it white — colourist slip), **white obi** `#F0F0F0`, white long-sleeved haori `#F4F3EE` with insignia.
  - Sealed sword: grey `#8C9097`, spoon pommel silver `#C3C7CC`. Wok-spatula Shikai: steel head `#9EA3AA`, handle dark wood `#5B3A22` (verify).
  - Cage of Life: bark `#6B4A2E`, grooves `#4A321F`, seedlings/leaves `#78A84B`.
  - Reiatsu: unknown (verify).
- **Look by form/outfit:** Plump (TYBW arrival, Gatonden) · Slender (post-cooking; fight vs. Pernida) · captain-era flashback (verify).
- **Weapons:**
  - **Zanpakutō (name unknown)** [M]: long, thin **grey chokutō**; straight blade; smooth hilt with **no ito wrap and no tsuba**, so it blends into the saya; a **spoon head at the base of the hilt**.
  - **Shikai (name/command/abilities unknown)** [M]: a huge **two-handed wok chuan** (wok spatula) with an oversized head (≈ 1.6 m / 51 vox total, head ≈ 50 cm / 16 vox wide, est.).
  - Bankai: not revealed (Seal).
- **Forms & states (ordered):** Plump (stocked) ↔ Slender (spent) — driven by reiatsu spent on cooking/growing; Shikai (wok spatula) available in either; Bankai unknown.
- **Abilities (complete):**
  - *Master Chef* [M]: to her, controlling food is controlling life. **All ingredients grow from her own body**, infused with her reiatsu from germination; anyone who eats them is pushed **beyond the limit they could ever reach naturally** (Ichigo, Renji, Byakuya, Rukia's TYBW power-ups) `[NEW: Consumables/permanent buffs]`. Throws a **rice-ball parcel** after Ichigo as he leaves [M].
  - *Gikon inventor* [M]: artificial souls and their insertion; principle = **take foreign reiatsu into a body and make it your own** (basis of Gikongan/Soul Candy; her food uses the same idea).
  - `Cage of Life (命の檻, Inochi no Ori)` — a.k.a. **Womb (産褥, Sanjoku)** / **Tree of Life (命の樹, Inochi no Ki)** [M ch 600 + A-ep 390–392]: a tree infused with her reiatsu that has learned to **eat any reiatsu used to attack it**, growing faster as it feeds; she secretly grew a giant cage around the palace entrance; it **auto-extends to block hostile projectiles** but lets harmless objects through (Yhwach's medallion → exploited by Uryū's swap); she **re-knits severed branches with fresh seedlings**, **sprouts seedlings inside to split fighters into separate "rooms"** (walls thicken), and **twists growth into pillars** that ram/overwhelm [A-ep 392]; she can **grow branches from her own body**; a swing of her sword makes **wind that blows seeds** where she wants. Kidō-like, but hers alone (like Ganju's Seppa) [KO #538] `[Construct][Absorb][Shield][Field: partition][NEW: GrowingConstruct]`.
  - *Shunpo expert* [M]. *Physical discipline*: cheerfully hits Shinji and Kirinji over slights [M].
- **Passives & weaknesses:**
  - Passives: tree auto-blocks projectiles while the cage stands; food buffs persist on allies.
  - Weaknesses: **Reiatsu depletion** — cooking/growing burns her reserves, she **slims down and must fatten up again** [M]; the cage **can't stop pure energy** (Auswählen) [M]; Gerard's Hoffnung dented it; Haschwalth's *The Balance* redirected misfortune and **split it in two** [M]; boosted Pernida overpowered her [A-ep 392].
- **Signature moments to recreate:**
  1. Arrival: punches Shinji for not recognizing her; asks after Hiyori [M].
  2. **Gatonden feast** — mountains of reiatsu food; she slims down as the meal finishes; explains Gikon [M].
  3. Rice-ball toss to the departing Ichigo [M].
  4. **Cage of Life** springs shut around the Quincy; Lille's bullets get eaten [M].
  5. Yhwach escapes via medallion swap; Haschwalth splits the tree [M].
  6. Rooms and pillars vs. Pernida, reverting to slender [A-ep 392].
- **Kit proposal:**
  - **Plump (stocked) — G toggles to Slender (spend) and back (eat)**
    - Shift: Shunpo expert (plump: shorter but plows through small debris [X]).
    - LMB chain: sword cuts + **spoon-pommel bonks** + belly bump; forward = lunge; back = belly-bounce launcher; air = spinning cut; down-air = body-slam crater; sprint = rolling charge [X].
    - Hold LMB: **Seed Gale** — charged swing that blows a cone of wind carrying seeds (pushes projectiles away; seeds sprout where they land).
    - Q: **Branch Lance** — branches erupt from her body/ground under target.
    - E: **Seed Scatter** — plant a seed field; tap again to make them all sprout into thorny barricades.
    - R: **Cage of Life** — grow a dome-cage (radius 12–30 m by hold time) that **absorbs energy projectiles and thickens** with each one; hostile projectiles from outside are auto-intercepted; harmless items pass; "pure energy" tagged attacks ignore it.
    - F: **Rooms** — sprout partition walls inside the cage to separate enemies.
    - Z: **Pillar Crush** — twisted trunks slam together on a target.
    - X: **Serve** — throw a dish/rice ball to an ally (heal + big temporary power buff; in campaign hubs, a feast at the Gatonden gives **permanent** upgrades).
    - G: **Cook / Spend** — channel a banquet (team-wide buff + restores allies' reiatsu) → switch to **Slender**: faster, lighter, more damage, no cooking until she eats (re-stock over time or by eating pick-ups).
    - C: flare.
    - T: Shikai (wok spatula): heavy scoop-flips (launch & toss enemies like a stir-fry), ladle smash craters; name/command unknown → callout omitted.
    - V: **Womb (Sanjoku)** — the Cage of Life closes over the **entire battlefield**, trapping every enemy; inside, enemy energy attacks feed the tree (heal her allies).
    - Tab: menu of dishes (each a different buff: speed, damage, defense, reiatsu) [X].
  - **Slender (spent)**: same inputs; Q/E/R cost more, X disabled, LMB faster.
- **AI notes:** cheerful; feeds allies first (raid healer/buffer — kill priority), builds the cage early to block ranged players, then partitions to isolate one player. Becomes slender and aggressive below 40% reiatsu. Throat-cut sacrifice at low HP in the raid [A-ep 392].
- **Callouts:** no canon technique shouts; construct name **"Inochi no Ori"**; flavor: "Gatonden" dinner calls.

---

## 7. Kokutō (黒𠚥) — Togabito, *Bleach: The Hell Verse* antagonist **[Mv — non-canon]**
- **Wiki:** https://bleach.fandom.com/wiki/Kokut%C5%8D · movie: https://bleach.fandom.com/wiki/Bleach:_The_Hell_Verse
- **Roster tier:** **B (optional "Hell Verse" DLC)** — strong boss and a fun chain-sword moveset, but non-canon; keep him out of the canon story path or behind an "alternate tales" menu.
- **Canon power (1–10): 7** (movie scale) — outclassed Bankai Ichigo one-handed, redirected a Bankai Getsuga, cut down Rukia, Renji and Uryū in one pass, and survived a point-blank Hollow Cero in his shield; only Hell-empowered Skull Clad Ichigo beat him.
- **Body:** height not given — tall, lean, long-limbed; **≈185 cm → ≈59 voxels (est., verify)**. Silhouette keys: **upper head wrapped in black bandages** with white hair tufts escaping, **shoulder-length white hair**, **sleeveless striped white shirt**, black sash strapped at the waist, **shackles/chains at both wrists and the neck**, a curved black sword trailing a chain. Unbandaged: **horrible burns over the right side** of face and body down past the abdomen (and the right arm), **much longer hair** with the **right side in cornrows**.
- **Palette (hex estimates):**
  - Skin pale `#EDE7E1`; burns: dark red-brown `#6B2E25`, charred `#2A1A16`, raw cracks `#9E3A2C`.
  - Hair white `#F2F2EE`; bandages black `#121212`; eyes (not documented — verify from film stills).
  - Shirt white `#ECECE6` with thin black stripes `#1A1A1A` (Togabito prison pattern); sash black `#141414`; trousers likely matching stripes (verify).
  - Chains/shackles dark iron `#3B3B42` (Hell chains glow faintly when stressed [X]).
  - Sword black `#101010` with a zigzag fuller; glow/blast/shield **blue** `#3C78FF` (the film also shows a **purple** barrier `#8B3DFF`; the games use purple flames).
- **Look by form/outfit:** **Bandaged** (ally phase) → **Unbandaged** (betrayal/final phase; right arm sleeve burnt away, arm aflame from lava at one point).
- **Weapons:** curved black sword (≈ 1 m / 32 vox) with a **zigzag shape down the blade's center**, tethered to his **right hand by a chain**; he can make it **glow blue and vanish/reappear**. Left-wrist chain used as a whip.
- **Forms & states:** 1. **Bandaged**. 2. **Unbandaged** (no power change stated; more aggressive). 3. **Unchained** (story only: when all chains break he is "free" — and Hell's chains drag him deeper).
- **Abilities (complete) [Mv unless noted]:**
  - `Hell Chains` — manifests the chains binding him to Hell: **whip** (left wrist), **sword tether** for long-range strikes, **chain shield** (nearly indestructible; blocked Renji's and Uryū's attacks), **latch onto a limb and swing the victim** into rocks/the ground `[Bind][Grab/Throw][Shield][NEW: ChainPhysics]`.
  - `Remote Sword` — controls the sword through the chain; when Taikon swallowed it, he yanked the chain and dragged Taikon into lava `[Projectile: tethered][Grab/Throw]`.
  - `Blue Blast` — energy blast from the blade that **redirected a Bankai Getsuga Tenshō** and hurled Ichigo far; pushes beams aside `[Beam][Absorb/Reflect/Redirect]`.
  - `Energy Shield` — envelops himself in a blue (or purple) shell that took a point-blank Hollow Cero — **leaving his chains outside on purpose so they'd be cut** `[Shield]`.
  - Speed — appears beside/behind Ichigo nonchalantly; held off Gunjō and Shuren while carrying Karin `[Mobility][Teleport]`.
  - Strength / swordsmanship — one-handed block of a Getsuga-charged Tensa Zangetsu; sliced Taikon's energy blast; **cut Garogai in half** `[MeleeArc cut]`.
  - Durability — shrugged off tentacle impalements and Shuren's fire; survived Skull Clad's golden Getsuga with a chest cut.
  - Togabito regeneration — in Hell, he **revives almost instantly** (the stronger the Togabito, the faster) `[Heal/Reject: respawn]`.
  - Hell navigation — **opens the Gates of Hell** as a portal for the group; can exit Hell without the Togabito mask/cloak (unexplained).
  - Manipulation — engineered the whole plot (fed other Togabito the idea; kidnapped Yuzu) to make Ichigo go full Hollow and shatter his chains.
  - *Game-only* [SR]: **Yūgokujin** (purple Getsuga-like blast), **Enra Gōmetsu** (purple-aura slash flurry ending in a shockwave), **Engoku Renge** (leap → slam → fire eruption ring), **Banyū Gōka** (purple fire burst "ignition"). [BS]: **Togabito no Akashi** (rapid slashes, paralysis), **Shin'en no Hanmon** (chains strike from every direction).
- **Passives & weaknesses:**
  - Passive: Togabito revival inside Hell zones.
  - Weakness: he is **bound to Hell by his chains** — severing them all frees him, but Hell then binds him anew; Kushanāda can **grab his invisible chains** and crush him; a Hell-empowered (Skull Clad) attack broke his last chain and the earth's chains **dragged him into the depths**.
- **Signature moments to recreate:**
  1. Cold open: a skeleton in a pit of skulls regrowing its organs while watching Ichigo vs. Ulquiorra (lava flares above).
  2. A **blue flash** frees Karin from Gunjō; his chains crack Shuren's mask.
  3. **Opening the Gates of Hell**; the descent: Kushanāda chase on Level 1; Kushanāda rips his chain out of the acid ground (Level 3).
  4. **Sword in Taikon's stomach → chain yank into lava**; dives into lava dragging Gunjō.
  5. **Betrayal**: impales Ichigo, rips off the bandages, cuts down Rukia/Uryū/Renji, drops Yuzu into lava → Hollow Ichigo's Ceros shatter his chains.
  6. **Lowermost level** duel: tree hung with "ripening" corpses, Rukia reborn from lava; Kokutō's chain-swing slams; Kushanāda kneel to Skull Clad Ichigo; golden Getsuga breaks the last chain → thousands of chains drag him down.
- **Kit proposal:**
  - Shift: **Hell-step** (short teleport-like burst; double-tap = appear beside the target, hand on their shoulder).
  - LMB chain: one-handed curved-sword string with chain extensions; forward = impaling lunge; back = chain-yank launcher; air = whirling chain; down-air = plunging stab; sprint = chain-swing dash.
  - Hold LMB: **Blue Blast** slash (beam; destroys light terrain).
  - Q: **Chain Whip** (left wrist; long reach, pulls). E: **Chain Sword** (throw, steer, yank back — drags anything that caught/swallowed it). R: **Limb Latch** (grab a limb, swing the target into terrain twice). F: **Chain Wall** (shield). Z: **Redirect** (catch an incoming beam and send it elsewhere). X: **Blue Shell** (dome shield).
  - G: **Hellfire arm** [X, from the lava scene]: right arm ignites (burn on hit).
  - C: Hell aura (blue/purple). · T: **Unbind** (remove bandages → unbandaged form: +speed, +chain range).
  - V: **Shin'en no Hanmon** [BS] — chains erupt from every direction around the target.
  - Tab: game-only moves (Yūgokujin, Enra Gōmetsu, Engoku Renge, Banyū Gōka).
- **AI notes / boss design:** courteous, then mocking; wants the player to hit him with their **strongest/rage moves** — design the boss with **5 Hell chains** that only ultimate-tier attacks can sever; each severed chain **powers him up** (he's escaping). Final phase is won only by a "Hell-blessed" attack (Skull Clad Ichigo, or a story-granted Kushanāda blessing) that breaks the last chain → scripted chain-drag finisher. In Hell he revives once if not finished by that blessed attack.
- **Callouts:** none canon (taunts about hatred and his sister); game-only move names above.

---

## 8. Hell (地獄, Jigoku) — late-game content pack
- **Wiki:** https://bleach.fandom.com/wiki/Hell · https://bleach.fandom.com/wiki/Konso · https://bleach.fandom.com/wiki/Togabito · https://bleach.fandom.com/wiki/Kushan%C4%81da · https://bleach.fandom.com/wiki/NO_BREATHES_FROM_HELL · https://bleach.fandom.com/wiki/Hollow (Jigoku no Gaki) · https://bleach.fandom.com/wiki/Szayelaporro_Granz
- **Recommended packaging:** a canon chapter built on the **2021 one-shot** (*NO BREATHES FROM HELL*: Konsō Reisai, Jigoku no Gaki, Szayelaporro, Ukitake) + an optional **non-canon "Hell Verse"** DLC (5 Hell levels, Kushanāda, Shuren's gang, Kokutō, Skull Clad Ichigo).

### 8.1 Canon status at a glance
- **Canon [M/1S]:** the **Gates of Hell** (Shrieker arc, ch. ~5); Hell's purpose; the **Konsō Reisai**; **Jigoku no Rinki**; **Jigoku no Gaki**; the teeth-lined **maw portal**; Szayelaporro as **Jailer of Hell**; captains cast into Hell with epithets (**Yamamoto "Gotei Kaiso"**, **Unohana "Shiken"**, **Ukitake "Kamikake"**); Ukitake's giant Shikai.
- **Non-canon [Mv + anime ep 299 filler]:** the names/designs **Kushanāda** and **Togabito** for Hell's guardians/inmates, Hell's five levels, Shuren/Gunjō/Garogai/Taikon/Murakumo, **Skull Clad**, the "Hell Kidō" extraction.
- **Novel [N]:** Hell predates the split of the worlds; the Human World was made partly as a **"lid"** on Hell. **[KO #946]:** the Quincy afterlife connects to Soul Society somewhere near Hell.

### 8.2 Rules of Hell → game rules
- Who goes there: souls whose **human-life sins** were heinous (a Zanpakutō only cleanses sins committed *as a Hollow*) [M]; and, via the Konsō Reisai, **dead captains** whose reishi is too dense (Spirit Class 3rd or higher; lieutenants 4th–5th, average Shinigami 20th) to dissolve into Soul Society [1S]. Hell is **not** one of the Three Worlds [M].
- **Balance** [1S]: Aizen's and Yhwach's immense reiatsu held Hell's maw shut; with both gone and Yamamoto/Unohana/Ukitake added, inmates can pry it open from inside.
- **Transformation** [1S]: Hell reshapes the strong — an Arrancar's **Hollow hole moves outside the body** (a ring floating behind the back) and new powers appear; captains' powers grow (Ukitake's Shikai became gigantic).
- **Death in Hell** [Mv]: chains wrap the dead and make them Togabito; they **revive endlessly** until their spirit breaks → game zone rule: **no permanent death; respawn chained** (chain debuff) after a delay `[NEW: ZoneRules]`.
- **Atmosphere** [Mv]: Hell's air drives low-reiryoku souls mad and **forces hidden instincts out** (Ichigo's Hollow mask formed on its own) → Hollow meter auto-fills, "sanity" drain for weak NPCs `[Field]`.
- Shinigami are **forbidden to interfere** with Hell [Mv].

### 8.3 Locations (level design)
- **Gates of Hell (地獄の門)** [M]: appear (formed of light rising from the slain sinner's wound) behind a sinner Hollow when its mask is cut: massive doors **chained shut**, each door adorned with the **bandaged head and torso of a skeleton** whose arms pull the doors open; inside, two thick **ropes hung with charms** keep them from opening fully; a huge demon (face + left arm visible, **armored upper arm**, tribal-tattooed face and arm) **skewers the soul with a blade and drags it in, laughing**; the doors shut and the whole structure **cracks and crumbles away**. → a cinematic **"Sinner's Gate" finisher** for any enemy flagged as a sinner `[Summon][Grab/Throw][NEW: ExecutionCinematic]`. Movie: a crack in the Gates leaks **miasma**; Hollow Ichigo's Cero blew a chunk off → a **trail of hellfire across Karakura's sky**; Kidō Corps contained it with two **circular barriers**; the Gates **self-repair** [Mv].
- **Hell's maw portal** [1S]: a **circular portal like a Garganta lined with teeth**; also how inmates enter the Human World. Kazui opens one at **Takakomo Shrine** (clap ×3 → **three huge ethereal eyeballs** appear → bow ×2 → clap) [1S] `[Teleport]`.
- **Jigoku no Rinki (地獄の燐気, "Hellish phosphor air")** [1S]: **black globules of non-reishi matter** drifting around a dead captain's grave or where a Hell denizen entered; harmless to touch, but **cut by a Zanpakutō → acid** that sizzles `[Environmental: hazard][Status: acid]`.
- **The five levels [Mv]:**
  1. **First Level** — a road between **floating platforms/structures** under **red miasma**; despairing Togabito watch from ledges; a horn sounds and **Kushanāda rise through the road**; dead end → leap into **violet fog**.
  2. **Second Level** — an **ocean dotted with giant lotus- and lily-pad islands** and towers; a **Kushanāda skeleton impaled on a spike** (graveyard).
  3. **Third Level** — a **cratered wasteland of yellow acid pools** (Kushanāda burst from them; acid overflows in waves).
  4. **Fourth Level** — a cave staircase lined with **hundreds of tiny candle-lit shrines**, a **waterfall of yellow acid**, then a **black desert of crushed Togabito bones** studded with round stones; a **skeletal monument over a lava pit** surrounded by **finger-shaped stone pillars** (Shuren's lair; lava pools **revive** Togabito).
  5. **Lowermost Level** — lightning in black clouds, a tower crowned by a **skull-shaped rock**, a **tree whose branches hang with rotting corpses** of the newly dead, lava that births the "ripe" dead, stalagmites, **towers of lava from which Kushanāda emerge by dozens**.
  - Destruction notes: everything should crumble (Kushanāda smash roads; Getsuga blasts erase towers; a mushroom-cloud explosion in Level 4); acid and lava as flowing hazards `[Environmental]`.

### 8.4 Bestiary (Tier C unless noted)
- **Kushanāda (クシャナーダ)** [Mv; the Gate demon is canon M]: Hell's guardians/jailers. **Gigantic** (est. 25–40 m; build coarse and scale), **walk on all fours**, **elongated skull-like heads**, a big **armor plate on the right shoulder**; tattooed limbs (Gate demon); carry blades (Gate demon). Powers: **walk through solid structures** (intangible in Hell), extreme durability (shrugged off Zabimaru + Hakuren + Licht Wind), **eat** Togabito (who revive later), **grab normally invisible chains** to haul escapees back, impale sinners through the Gates; can **bestow "Skull Clad"** — dissolving into yellow-gold light that clads a worthy person in skull-patterned armor (Ichigo) and makes all Kushanāda treat them as friendly [Mv]. Palette (est.): body charcoal `#26242A`, skull head bone `#E6DFCF`, shoulder armor iron `#4A4038`, gold Skull Clad light `#FFD24A`. AI: patrol, rise from ground/acid/lava, slow huge swipes that crater; immune to non-ultimate attacks; can be cut in half only by ultimate-tier blasts (a Hollow-masked Getsuga) `[Summon/boss][NEW: TerrainIntangible]`.
- **Togabito (咎人, "sinners")** [Mv]: inmates bound by **indestructible chains** (usually short-looking, actually extending far; also usable as shields/tethers). In Hell: **white garb with thin black stripes**. Outside Hell: **black cloak with white rectangular buttons**, **light-bulb-shaped mask split diagonally black/white**, white gloves and boots (hides them from Kushanāda and **dampens their power**; lose too much of it and the Kushanāda drag them back). Powers stronger than their former selves; some exceed Espada. Grunt variant: chained runners that revive at lava pools `[Summon][Bind]`.
- **Shuren (朱蓮)** [Mv; ep 299]: leader; **purple hair** with a long fringe over the left side, white bodysuit with square patterns, black cloth on the left leg, cloak, **red chains/shackles on neck and chest**, wears the Togabito mask **on his chest** (bandages under it outside Hell). **Pyromancy** from the palms: fire bolts (explode), fire arrows (rapid), **flame javelins/lances** used as swords, a sustained flame-stream barrier, **flame doppelgängers**. Beat Resurrección Szayelaporro (ep 299) and matched Bankai Ichigo `[Projectile][Afterimage/Clone][Status: burn]` — Tier C mini-boss.
- **Gunjō (群青)** [Mv]: tall, thin, muscular; long dark hair; **bandaged upper face** with two scars running down from the eyes; armor with vertical lines that turns black at the shins; **tentacles replace his forearms** (also sprout from eyes and chest), regrow when cut, strong enough to **shatter Sode no Shirayuki** and constrict `[Bind][Swarm]`.
- **Garogai (我緑涯)** [Mv]: **giant, red-skinned**, yellow eyes shadowed by hair, **dark-green braided ponytail**, eight black straps over the body, shackled chains on wrists and ponytail; **detachable rocket-arm** on a chain (grapple, pummel, launch foes skyward), **green energy pulse** punch that deflects El Directo / Hikotsu Taihō; throws stone slabs to raise tidal waves; acid-resistant `[Projectile: rocket fist][GroundWave][Grab/Throw]`.
- **Taikon (太金)** [Mv]: obese, pale-blonde hair, four dark **teardrop marks on each cheek** (one on the belly), armor with circular lines, chains at the nipples; **mouths (pink lips with teeth) open anywhere on his body**, **devour energy attacks and weapons**, then **"kiss" the energy back** as a pink blast that leaves **heart-shaped craters**; mouths everywhere for a barrage `[Absorb/Reflect/Redirect][Projectile multishot]`.
- **Murakumo** [Mv]: fifth member, never seen (impaled by a Kushanāda and sent deep) — skip.
- **Shrieker (as Togabito)** [anime ep 299 filler]: faster/stronger than his Hollow self; leeches hidden in his body fired as explosive projectiles through his arm wrappings — optional.
- **Jigoku no Gaki (地獄の餓鬼, "Hell preta")** [1S]: **massive Hollows from Hell**, wildly varied shapes but sharing **large rings protruding from or forming body parts** and **thick chain patterns on their skin**; **emit no reiatsu** (they ambush even sensing-capable Shinigami); great strength (a stray severed arm crushed part of a building). In the one-shot, the lieutenants killed several in Karakura (Rindō's hawks stripped one to the bone; Yuyu's bear-head bite; Akon melted one; Kira's 7× weight crush) — killing them in Ukitake's "sight" completed his Konsō Reisai. → elite enemies invisible to the sensing UI `[NEW: no-reiatsu flag]`.
- **Szayelaporro Granz — "Jailer of Hell" (地獄の獄吏, Jigoku no Gokuri)** [1S] — boss variant (base dossier: E2): **left eye and mask fragments gone**, Hollow hole now a **white ring floating behind his back**, **left arm reduced to charred black bones trailing dark smoke**, **broad dark-blue chain tattoos** wrapping head and torso (one link frames a **new hole in the center of his chest**, another frames the empty left eye socket with four thin lines down the cheek), body **dripping darkness** around/below the waist, a **half-cloak** on his right side, black boots, much longer pink hair (pushed back, one lock framing the right side), **ram horns that sprout from his temples at will (drawing blood)**. Powers: greatly increased reiryoku (pressured Renji, held off Ichigo), **black-crimson chains from the ground** that bind and **pierce** (Renji couldn't break them), **clairvoyance** (knew Ichika was Renji's daughter, knew the Konsō Reisai's secret), enters the Human World through a teeth-lined portal. Defeat: **Ukitake impales him from Hell with a gigantic Sōgyo no Kotowari** and drags him back through the Gates. Palette: hair `#E58AB3` (verify), tattoos `#1E2A5A`, bones `#1A1414` with smoke `#2A2A30`, ring `#F2F2EE`, chains `#3A0E12` `[Bind][Sensing][Summon: chains]`.
- **Hell captains** [1S]: **Yamamoto "Gotei Kaiso"** (Founder of the Gotei), **Unohana "Shiken"** (Death Sword), **Ukitake "Kamikake"** (Divine Possession) — only Ukitake's **enlarged twin-blade Shikai** has been shown. Their Hell forms have **no canon designs** → keep as off-screen threats/teasers; any Hell-form design is [X].

### 8.5 Konsō Reisai (魂葬礼祭) & related canon procedures [1S]
- Performed **12 years after** a captain falls in battle: lieutenants first perform the **Jogimen Reibaku** (capture a Hollow in the Human World), then captains purify it at the grave. True purpose (a myth Shunsui half-knew): cast the captain's over-dense reishi into **Hell**. Flexible format — Ukitake's was completed when Ichigo and the lieutenants slew Jigoku no Gaki while Ukitake "watched" through Ichigo's **Substitute Badge**. A Hell Butterfly's name hints at Hell links.
- One-shot new cast for the set piece (covered in other groups): Kazui Kurosaki, Ichika Abarai, Atau Rindō, Yuyu Yayahara, Genshirō Okikiba.

### 8.6 Skull Clad (スカルクラッド) [Mv]
- Ichigo's **Hell-granted** form (belongs in Ichigo's dossier as an optional non-canon form): a Kushanāda dissolves into gold light and **clads him in golden skull-patterned armor**; can **sever Hell's chains** (freed Rukia, Renji, Uryū), **bind enemies in chains and send them to a lower level**, fire a **golden crescent Getsuga** that carved a trench through a tower; Kushanāda kneel to him. Use as the "blessed attack" that ends Kokutō's fight.

### 8.7 Hell set pieces (story mode)
1. **Shrieker's Gate** [M] — tutorial for the sinner-execution cinematic.
2. **Konsō Reisai night** [1S] — Jigoku no Gaki ambush the lieutenants in Karakura; Jigoku no Rinki at Ukitake's grave; Szayel's chains rise from a portal; Ukitake's giant blade from the Gates.
3. **Kazui's shrine** [1S] — the three-eyeball ritual and a teeth-ringed maw (sequel hook; one skeleton on the Gates turns an eye toward him).
4. **Hell Verse descent** [Mv] — Level 1 chase → Level 2 lotus ocean fights → Level 3 acid → Level 4 lava monument → Lowermost duel vs. Kokutō → escape by running up a Kushanāda's arm.

---

## 9. Soul King (霊王, Reiō) — true name **Adnyeus** (アドナイェウス)
- **Wiki:** https://bleach.fandom.com/wiki/Soul_King · https://bleach.fandom.com/wiki/Fall_of_the_Soul_King · https://bleach.fandom.com/wiki/Black
- **Roster tier:** **C — scenery / event / objective.** He **never acts or speaks** in canon (a vegetative, sealed god); making him a fighting boss would be pure invention [X]. His power fights through his "parts" and through Yhwach.
- **Canon power:** n/a (latent 10) — his absorbed power let Yhwach rival everything; even his severed parts (left arm, heart) are Schutzstaffel-tier; his right arm held Almighty-Yhwach for minutes.
- **Name note:** "Adnyeus" was first hidden in Sōken's journal (anime ep 372) and spoken by Yhwach in **anime ep 394**; it is also part of the Auswählen incantation [A/KO #483].
- **Body:** humanoid; **slicked-back dark hair**, **oval eyes without eyebrows**, **each eye holding four black irises**; **no arms or legs** (amputated); sealed in a **crystal** (manga: **yellow-gold**; anime: **light blue**, turning **dark red** when he is stabbed) **hung by four wires** in a large, elegant chamber with curtains, inside the **Reiō Daidairi** cylinder. Scale is never stated — render the figure larger than life (≈ 3 m torso-to-head, crystal ≈ 6 m) for awe [X]. (His first silhouette in ch. 519 still had limbs; later appearances don't.)
- **Palette (hex estimates):** skin pale grey-ivory `#D8D2C8`; hair `#1A1A1A`; eyes white `#F2F2F2` with four black irises `#000000`; crystal manga `#E7C55A` (50%) / anime `#9FD3F0` (45%) → damaged `#7A0E14` (60%); wires `#2A2A2A`; reiatsu **black** `#050505`.
- **Powers (canon):** immeasurable reiatsu ("**Black**" — the chaos/colorless color; a shifting mass of darkness); **clairvoyance & precognition** (saw the Quincy persecution and his own death 1,000 years ahead); **immunity to precognition** for himself and his parts (The Almighty can't see them) and the ability to **seal** The Almighty (left arm); **Ōken bestowment** (turns Royal Guard bones into keys); **World Splitting** — he divided the Primordial Sea into the Three Worlds, creating **life and death** [M]; the anime stages it as a ritual with an unusual **ceremonial sword** [A-ep 394]. Eons before that he **repelled a "darkness"** that threatened the single original world [A-ep 394 / M ch 564 visions].
- **Weaknesses:** sealed restraints (cannot move); **irreversible death** (nothing — not even Sōten Kisshun — can revive him).
- **Parts with their own identities:** **left arm = Pernida Parnkgjas** ("Progress/Evolution"), **right arm = Mimihagi** ("Stillness"), **heart = hosted by Gerard Valkyrie** ("The Miracle"); Yhwach is his son (the novel leaves open whether he is a "part"). Dismemberment of the left arm dated **January 19** [KO #935]. Anime: he split the worlds himself and was then dismembered with only Ichibe'e present; novel: the **Five Noble Ancestors** betrayed, sealed and mutilated him and used his power to split the worlds.
- **Signature set pieces:**
  1. Ichibe'e checks on him as he **opens his eyes** [M].
  2. Yhwach's **sword through the chest**; the crystal reddens [M/A].
  3. **Ichigo, puppeted by his Quincy blood, bisects him diagonally** through the crystal → a **world-wide shockwave** rolls down from the palace, toppling Seireitei buildings and shaking Hueco Mundo and Karakura `[Slice][NEW: GlobalTremor]` [M].
  4. Orihime's shield shatters trying to undo it; **Mimihagi's black hand** encases the halves; Yoruichi's seal sheets (Chizeimon, Tesshimon, Kozanmon + Sankotsu no Jufu barrier) [M].
  5. Schutzstaffel pour their reishi swords into Yhwach's **broadsword**, the crystal **shatters**, the halves float, Yhwach **absorbs** him in a tornado of energy → a **torrent of tiny one-eyed black creatures** pours from the palace and floods the Seireitei, eating Shinigami (and ignoring Quincy) [M] `[Swarm][Environmental]`.
- **Game use:** (1) **Reiō Daidairi chamber** level; (2) **"Protect the King"** objective with a crystal HP bar (blue → red); (3) the **one-eyed shadow flood** as a swarm event (belongs to Yhwach's kit/story); (4) optional [X] boss rush "Fragments of the King" (Pernida → Gerard → Mimihagi → Soul-King Yhwach).

---

## 10. Mimihagi (ミミハギ) — the Soul King's Right Arm (霊王の右腕), governor of "Stillness" (静止, Seishi)
- **Wiki:** https://bleach.fandom.com/wiki/Mimihagi
- **Roster tier:** **C — set piece / boss phase**; also the summon behind **Ukitake's Kamikake** (Ukitake's own dossier is in group B3).
- **Canon power (1–10): 9** — invisible to The Almighty, kept the Three Worlds from merging while the Soul King lay dead, and physically resisted Soul-King-absorbing Yhwach for minutes.
- **Lore:** a "fallen god" worshipped in the outer districts of **East Rukongai**; grants prayers in exchange for a body part (**anything but an eye** — it already has one); took 3-year-old Ukitake's diseased lungs, halting the disease [M]. Name etymology [KO #924]: *mi-mi-hagi-sama* ≈ "Great Lord Who Joins Bodies". Anime: carried into the Lichtreich talks infused in Ichibe'e's right fist [A-ep 390].
- **Body / look:**
  - **Classic form** (Ukitake's childhood) [M]: a humanoid whose **body is shaped like an arm ending in a clenched right fist**, with **one large eye on the back of the fist**, a simple **tunic**, and a large **hagoromo** (celestial feathered sash) ringing the fist from behind.
  - **Present form** [M]: no physical body — **living darkness**: a **giant intangible black hand and arm**, an **eye that opens in the palm** (it can curve shut like an upside-down smile), or a shadow shaped like the classic form.
  - Size: rises from the Seireitei through the **Shakonmaku** dome to the palace (km-scale stretch); in the chamber its hand engulfs the Soul King's halves (≈ 8–12 m hand, est.).
  - Palette: darkness `#050505` with indigo edge `#1A1030`; eye sclera `#F2F2F2`, pupil `#000000`; classic form: pale skin `#E9E1D6`, white tunic `#F4F3EE`, hagoromo pale gold/cream `#F3E6C2` (verify).
- **Abilities:**
  - `Stillness` [M]: governs **stagnation** — halts growth, progress and change: stops an illness, keeps the Three Worlds from merging; (anime) **stops arrows mid-air and throws them back** `[Field: time-stop/stasis][Absorb/Reflect/Redirect][NEW: StatusFreezeTimers]`.
  - `Blackness Physiology` [M]: darkness hand, **walls of darkness** that block Yhwach's attacks; **encases** objects `[Shield][Construct]`.
  - `Repulse Rings` [M]: expanding circles of its reiatsu **blow Yhwach's blue flames back** out of the palace `[Blast]`.
  - `Crackling Restraint` [M]: arches over Yhwach and **pins him with crackling electric reiatsu** `[Bind]`.
  - `Consumption` [M]: tries to **swallow/absorb** Yhwach `[Grab/Throw][Absorb]`.
  - `Precognitive immunity` + its own precognition [M] — Yhwach's pupil **cracks** when he tries to read its future `[NEW: precog-immune flag]`.
  - `Life Extension / Kamikake` [M]: the bearer of a Mimihagi blessing can perform **Kamikake** — sacrificing the rest of their body and life to become its vessel: their **shadow turns into Mimihagi's shape**, a **large vertical eye** shadow appears on the back, a **Mimihagi tattoo** spreads over the torso, **darkness erupts from eyes and mouth**, and the hand climbs to the sky (Ukitake's prayer is a short two-line chant to "Mimihagi-sama"; paraphrase only).
- **Weaknesses:** **Auswählen** affects it; **Yhwach pulled its eye apart** and tore it to pieces (manga: killed and absorbed with the Soul King; anime: survives through Ukitake, keeps the worlds apart, until Yhwach's fourth Auswählen strips it from Ukitake and Shunsui) [M/A]. After absorbing it, Yhwach gains a **black chain-of-eyes pattern down the left side of his face and chest** and an **inverted left eye**.
- **Signature set pieces:** Ukitake's **Kamikake** in Urahara's lab (haori and top shed, shadow eye on his back, screams as the hand rises) [M]; the **hand bursting through the Shakonmaku**, the **palm-eye opening** over the bisected king, Yhwach's pupil cracking [M]; repulse rings vs. blue flames; crackling restraint; **Yhwach tears out its eye** [M].
- **Boss-phase proposal:** "The Right Arm" — a giant dark hand with a palm-eye. Mechanics: Stillness zones (projectiles freeze and return; DoTs/buff timers freeze), darkness walls, grab-and-consume, repulse rings, crackling cage; the eye is the weak point (opens on a cycle); immune to precognition/lock-on prediction effects.

<!-- PART4 -->
