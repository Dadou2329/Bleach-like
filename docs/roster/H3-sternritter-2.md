# Roster H3 — Sternritter (2/2) & full Sternritter index

Design dossiers for the second half of Yhwach's Sternritter: the four **Bambies** covered here (**Candice Catnipp**, **Liltotto Lamperd**, **Giselle Gewelle**, **Meninas McAllon** — Bambietta herself is in H2), the gunslinger **Robert Accutrone**, the copy-twins **Loyd & Royd Lloyd**, the deflector **Nianzol Weizol**, Kenpachi's three off-screen victims (**Berenice Gabrielli**, **Jerome Guizbatt**, plus Loyd), the knife-thrower **Shaz Domino**, and the Arrancar turncoat **Asguiaro Ebern**. The file closes with a **complete A–Z Sternritter index** (who exists, where they are covered, what is anime-only / novel-only / barely shown) and a summary of the **engine features** these kits need beyond the brief's primitive list.

Conventions used below
- Heights → voxels at **32 vox/m** (rounded). Hex colors are *estimates* from anime/colour-page references unless stated; anything marked **(verify)** must be checked against reference art before modeling.
- Engine tags use the brief's vocabulary in `[brackets]`. Needs not covered by that list are tagged `[NEW: …]` and collected in the **Engine features** section at the end.
- **anime-only**, **novel-only** (Ryōgo Narita's *Can't Fear Your Own World*, "CFYOW", and the *13 BLADEs* short story), **game-only** (our proposal, not canon) and **Brave Souls** (mobile game) are flagged explicitly.
- Sources: the bleach.fandom.com pages linked per character (fetched via the MediaWiki API), plus the shared Quincy pages (Quincy, Quincy: Vollständig, Sklaverei, Blut, Heilig Pfeil, Hirenkyaku, Gintō, Shadow, Medallion, Schrift, Sternritter, Schutzstaffel, Bambies) and battle pages (*Ichigo Kurosaki vs. The Bambies*, *Battle of the Zombies*, *Yamamoto vs. Royd Lloyd*, *Ichigo vs. Asguiaro Ebern*). Everything is paraphrased.
- Answering the brief's "confirm" questions up front:
  - **Robert Accutrone is "N", not "E".** "E" is Bambietta's *The Explode*. Robert's Schrift **name and effect were never revealed**; the wiki only infers from his feats that it relates to speed. There is no Schrift called "The Exactly" (a wiki search for it returns nothing Quincy-related).
  - **Nianzol's Schrift is "W: The Wind"** (紆余曲折, read *za waindo* — "wind" as in *winding/twisting*, the kanji mean "meandering, twists and turns"). It is a deflection power, not air/wind, and not "Wind-Up" (see his dossier for the naming note).
  - **Shaz Domino** has **no letter in the manga**. The *13 BLADEs* short story gives him an honorary letter **"Ϛ" (Stigma)**, previously the fake "V: The Viability" invented by Gremmy, with a **reishi-based regeneration** power (see his dossier).
  - **Asguiaro Ebern is not a Sternritter and has no Schrift**; he is an Arrancar soldier serving the Wandenreich with a Quincy Cross and a Medallion. The wiki never explicitly places him in the **Jagdarmee** (the Hueco Mundo hunting unit led by Quilge Opie) — treat that link as plausible but unconfirmed.

---

## 0. Quick reference

| Character | Letter : Schrift | Height → vox | Vollständig (name, wings, halo) | Signature energy | Tier | Power |
|---|---|---|---|---|---|---|
| Candice Catnipp | **T : The Thunderbolt** (雷霆) — electrokinesis | 166 cm → 53 | **Barbarriel** (神の雷霆) — 6 lightning-bolt wings, electric star halo | blue lightning → **neon green** in Vollständig | **A** | 6 |
| Liltotto Lamperd | **G : The Glutton** (食いしんぼう) — devour anything | 149 cm → 48 | **Gagael** (神の飢え) — golden fang-spike wings (+ jaw wings in Sklaverei), star halo | **gold** | **A** | 7 |
| Giselle Gewelle | **Z : The Zombie** (死者) — blood → corpse puppets | 160 cm → 51 | **Azhalbiora** (神の死) — purple bone wings + skeletal tail | **purple**, blood red | **A** | 5 (8 with army) |
| Meninas McAllon | **P : The Power** (力) — super strength | 191 cm → 61 | **Pornipora** (神の力) — pink stacked-heart wings, spiky star halo | **pink** | **B** (A-candidate) | 6 |
| Robert Accutrone | **N : (unrevealed)** — implied speed | 176 cm → 56 | **Grimaniel** (神の歩み) — wings + star halo, reiatsu turns green | blue-white shots; **green** Vollständig | **B** | 7 |
| Loyd / Royd Lloyd | **Y : The Yourself** (貴方自身) — become anyone | 170 cm → 54 | never shown (Q&A: can overlay on a copied body) | target's colors | **A** as "Copycat" slot (C as individuals) | copy-dependent |
| Nianzol Weizol | **W : The Wind** (紆余曲折) — attack aversion | 156 cm → 50 | never shown | none (invisible deflection) | **C** (B if a trickster slot is wanted) | 6 |
| Berenice Gabrielli | **Q : The Question** (異議) — "objection" rules | 174 cm → 56 | never shown | none (verbal) | **C** | 5 |
| Jerome Guizbatt | **R : The Roar** (咆哮) — ape form + sonic roar | 189 cm → 60 (ape form much larger) | never shown | sound shockwave | **C** | 5 |
| Shaz Domino | none in manga; **Ϛ : Stigma** (novel) — regeneration | unknown (≈178 cm proposed) | never shown | blue-white knives | **C** | 4 |
| Asguiaro Ebern | — (Arrancar, no Schrift) | 181 cm → 58 | n/a (Resurrección never shown) | reishi cannon blasts | **C** (prologue boss) | 4 |

Kubo's own Bambies rankings (Klub Outside Q&A #525, as listed on the wiki's Bambies page) — use them to tune the four Bambies against each other and against Bambietta (H2):
- **Hand-to-hand:** Liltotto > Meninas > Candice > Giselle > Bambietta
- **Blut proficiency:** Liltotto > Giselle > Meninas > Bambietta > Candice
- (Giselle's wiki page adds an "overall" order Liltotto > Meninas > Giselle > Candice > Bambietta but contradicts itself in the same note — treat it as unofficial.)

---

## 1. Shared Quincy / Sternritter layer (read first)

Every character in this file (Ebern partially) inherits this layer; dossiers only list deviations.

### 1.1 Racial basics
- `Reishi Absorption` — Quincy fight with power drawn **from outside**: they pull ambient reishi and bind it with their own reiryoku to form weapons. Easier in reishi-dense places (Soul Society, Hueco Mundo). **Game:** a "Reishi" resource that regenerates faster on Soul Society / Hueco Mundo maps, slower in the Human World; standing next to freshly destroyed voxels gives a small burst (voxels *are* reishi). [Environmental, Absorb/Reflect/Redirect, NEW: MapReishiDensity]
- `Hirenkyaku (飛廉脚)` — Quincy high-speed step: they **ride a stream of reishi gathered under their feet**. Kubo: trained via reishi control (vs Shunpo = body training, Sonído = converting reishi into "non-reishi"); the novel calls it the most energy-efficient of the three. Also used to hover and travel long distances. **Shift** for all Quincy: a pale blue-white reishi "skate" streak under the soles; double-tap Shift with lock-on = appear behind. [Mobility, Teleport]
- `Air-standing` — like everyone else they stand on reishi in midair (**Space** / **Ctrl**). [Mobility]
- `Spirit Weapon` — weapon built from gathered reishi around a **Quincy Cross**; the classic is a bow (**Heilig Bogen** 神聖弓) firing **Heilig Pfeil** (神聖滅矢) — each Sternritter customizes the bow/arrowhead shape (listed per character). Firing nonstop eventually hurts the hands. [Projectile arrow, multishot]
- `Blut (血装)` — reishi pumped into the blood vessels. **Blut Vene** (静血装, defense): a faint blue vein network flashes under the skin *where it is struck*; can protect the eyes and staunch bleeding from critical wounds; at full power can no-sell even Bankai attacks but **can be torn** by enough force. **Blut Arterie** (動血装, offense): the only way non-Schrift attacks seriously hurt Bankai users (per Quilge). The two run on separate reishi systems → **never both at once**. Yhwach regulates everyone's Blut strength. **G toggle** by default: Vene ⇄ Arterie with a short switch gap. Visual: Vene = blue vein web `#5AA9FF`; Arterie = red vein web `#FF4A4A` (verify anime color). [Stance, Shield]
- `Shadow (影)` — a power **Yhwach lends** to his chosen (Kubo Q&A #937): the user's shadow expands into a door between dimensions (Schatten Bereich, Soul King Palace…); reiatsu vanishes from the departure point. Gestures can widen it into a tower-sized portal **shaped like the Quincy cross** to move whole Soldat units. **Requires an existing shadow** — impossible in a shadowless room. Users can act from *inside* a shadow (Nianzol protected Yhwach from his shadow). **Tab wheel:** teleport / open gate / retreat. [Teleport, Summon (Soldat squad), NEW: ShadowQuery — test whether a spot is in shadow using the lighting/shadow map]
- `Spiritual Awareness` — Quincy sense Hollows and spirits at long range and read reiatsu acutely. [Sensing/Stealth]
- **Hollow poison** — Quincy have no spiritual antibodies against Hollows: Hollow reiatsu erodes their reiryoku and soul. **Game:** Hollow-element damage applies a *Soul Decay* DoT to Quincy. [Status (decay)]

### 1.2 Sternritter equipment
- **Uniform** — white, double-breasted, high-collared military coat with shoulder straps, black belt with decorative buckle, white trousers and trench boots; most Sternritter add a white **ankle-length hooded cloak** with the Wandenreich insignia on the back and insignia-shaped buttons. Many wear a **white peaked cap with gold trim, black peak and the insignia on the front**. The **Bambies** wear heavily customized versions (the four in this file skip the cloak; Bambietta keeps hers).
- **Wandenreich insignia / Quincy Zeichen** — the five-pointed "star cross" (a five-armed cross with thin rays between the arms); it is the halo shape of most Vollständig, the shape of large Shadow gates, of Robert's muzzle flash, Shaz's knife handles and Ebern's wrist cross.
- **Bambies' heart case** — each Bambie keeps her collapsed bow in a **heart-shaped buckle/case on her belt**; clicking the heart makes the bow **spring out above her head** and she grabs the heart-shaped grip. Draw animation shared by Candice, Liltotto, Giselle, Meninas.
- **Medallion (メダリオン)** — palm-sized metal disc etched with the insignia, carried by **every Sternritter**; an application of Yhwach's *Sankt Altar*. Shown to a **currently released Bankai** nearby, it emits five streams of dark energy that disintegrate the Bankai and pull it into the disc as a ring ("medalize", 星章化). The thief can then use that Bankai, even after its owner dies, but **below its full potential** unless they train with it, and **cannot use Vollständig while holding a Bankai**. Cannot steal: Arrancar Resurrección; Hollowfied Bankai (Ichigo's, or any Bankai after a Shin'eiyaku — which also poisons a stolen Bankai until it returns to its owner); a Bankai the thief cannot *comprehend* (Yamamoto's explanation for Zanka no Tachi). **Game:** Tab-wheel interrupt usable when a Shinigami in range enters Bankai: short channel; on success the victim's T-to-Bankai is locked and the thief gains a "Stolen Bankai" ability page at ~70% power; locks the thief's Vollständig. [Bind, Status (Bankai theft), Absorb, NEW: CrossKitTheft]
- **Leiden Hant** — the Wandenreich name for the Sanrei-Glove-type gauntlet worn on the hand; its insignia blazes when Vollständig activates (Robert and Bambietta are confirmed wearers; assume all).
- **Blue flame pillars** — at the start of the first invasion every Sternritter raises a **pillar of blue flame** before engaging (staging/marker effect). [Construct, Environmental]

### 1.3 Quincy: Vollständig (滅却師完聖体) — the **T** release for every Sternritter
- Activation: the Leiden Hant flares; a **tall pillar of light capped by a Quincy Zeichen** erupts around the user (anime: **church bells toll**). If the user is trapped/encased, the pillar **breaks the prison** (escape from ice, binds, rubble). Some users (Robert) can activate **instantly without the pillar**. In very reishi-dense places an untrained user's Vollständig can **switch on by itself** (Candice). Deactivate/reactivate freely (Bazz-B did it several times a day).
- Grants: **Heiligen Fliegen** (光翼, reishi wings) → high-speed **flight**; a **Heiligenschein** (光輪) halo, usually a star-like Quincy Zeichen; a Spirit Weapon formed straight from the gauntlet; a **greatly amplified Schrift** with new techniques; sensing strong enough to see through concealment of weaker foes. Each Vollständig name means "<something> of God" (神の…) and most end in *-el*.
- Costs/weaknesses: **heavy stamina drain** (Candice, Giselle complain); **if the halo is destroyed** the powers vanish though the look remains; impossible while holding a stolen Bankai; Auswählen strips it permanently (Liltotto, Giselle).
- Colour note: the digital-colour manga paints most Vollständig blue; **the anime and Brave Souls give each one its own color** — we follow the anime.
- **Game:** T = activate (cinematic pillar, destroys anything encasing the user), tap T again = revert. A **Vollständig stamina bar** drains while active (per-character rate; Candice fastest); at zero the user force-reverts into a brief Exhausted state. The **halo is a separate hittable hitbox** with its own HP. [Transform, Mobility (flight), Blast (activation pillar), NEW: StaminaLimitedForm, NEW: WeakPointHitbox]

### 1.4 Sklaverei (聖隷) — hold **T** while in Vollständig
- The "most basic Quincy ability at its highest level": absolute enslavement of reishi through the halo. It **tears apart the reishi that makes up the world** — trees, sand, rocks, buildings in Soul Society/Hueco Mundo — and can absorb spiritual techniques (Orihime's Santen Kesshun) and whole spiritual beings (Quilge absorbing Ayon). Absorbing a Hollow is inefficient: the Quincy grows temporary Hollow features and can't fully control the gained power. Restores stamina and seems to heal minor wounds. Stops instantly if the halo is broken.
- Canon status: the manga only shows **Quilge**; the **TYBW anime** gives Sklaverei-enhanced looks and new techniques to **Giselle, Meninas, Liltotto, Candice, Robert** (and Uryū); the novel states every Sternritter can do it in Vollständig. Everything listed under "Sklaverei" below is therefore **anime-only**.
- **Game (the brief's lore hook):** while T is held, every reishi voxel within a radius (8–15 m, scaling with power) **dissolves from the surface inward into particle streams sucked into the halo** — the arena literally gets eaten. Refills Vollständig stamina and HP slowly; destroys enemy reishi constructs (ice, barriers, summons) caught in the radius; weak spiritual NPCs (Soldat, small Hollows) are drained outright; draining a Hollow grants a temporary unstable buff + Hollow cosmetic (mask shards/horns). Unlocks each character's Sklaverei accessory layer and extra moves. [Absorb, Environmental (absorb reishi from structures), Heal/Reject (self), NEW: VoxelAbsorptionStream]

### 1.5 Shared control template (dossiers override where noted)
| Input | Quincy default |
|---|---|
| Shift | Hirenkyaku (double-tap + lock = behind target) |
| RMB | Guard / parry; with **Blut Vene** on, guard becomes "Vene Guard" (vein flash, chip damage only) |
| G | Blut Vene ⇄ Blut Arterie |
| C (hold) | Reishi flare — Quincy version *inhales*: ambient motes and loose voxel dust spiral **into** the user, then the aura flashes in their color; weak NPCs kneel |
| T / hold T | Vollständig / (in Vollständig) Sklaverei; tap again to revert |
| Tab | Quincy wheel: Shadow (teleport · gate · retreat), Medallion (steal Bankai), arrow variants |

### 1.6 Shared story beats for this file
- **First invasion** (Fall of the Seireitei): blue flame pillars; Kenpachi kills Loyd, Berenice and Jerome off-screen; Royd impersonates Yhwach vs Kenpachi and Yamamoto; Robert vs Shunsui; Shaz massacres the SRDI; Meninas cuts down Rukia; Ebern's Karakura raid is the prologue.
- **Second invasion** (Wandenreich city replaces the Seireitei): the Bambies hunt Kenpachi → Ichigo arrives → Bambies vs Ichigo → Bazz-B's sniping → 8-on-1 → Byakuya vs Robert/NaNaNa/Candice → PePe's betrayal → Giselle vs Mayuri.
- **Auswählen**: Yhwach's beams of light drain every Sternritter left in the Seireitei to revive his Schutzstaffel; Robert is stripped to a skeleton mid-sentence; Liltotto and Giselle dodge the beam (losing only Vollständig); Candice and Meninas are hit.
- **Wahrwelt**: Liltotto + Giselle (with zombie Bambietta, Candice, Meninas) storm Yhwach's castle with Bazz-B, slaughter Soldat, and are swatted down by Yhwach.
- **Royal Palace**: Nianzol rides in Yhwach's shadow and dies to Senjumaru.

---

## Candice Catnipp (キャンディス・キャットニップ) — Sternritter "T": The Thunderbolt · Bambies
- **Wiki:** https://bleach.fandom.com/wiki/Candice_Catnipp (also Galvano_Blast, Galvano_Javelin, Electrocution, Ichigo_Kurosaki_vs._The_Bambies, Bambies)
- **Roster tier:** **A** — the most "fighting-game ready" Bambie: readable elemental kit, a flashy six-sword Vollständig and a built-in beam clash.
- **Canon power (1–10): 6** — captain-class per the wiki; one sky-bolt wiped a squad of 11th Division officers and her lightning kept an exhausted Kenpachi down; Galvano Blast (5 gigajoules) shredded Ichigo's Ōken robe but not Ichigo; her Electrocution lost a beam clash to Getsuga Jūjishō; her Vollständig ran out of stamina against Byakuya.
- **Body:** 166 cm → **53 vox**; tall, long-legged, curvy. Heeled bulky boots add ~2–3 vox. Silhouette keys: **very long, voluminous light-green hair** (past the waist), cap worn on top, **cropped open jacket + short shorts + chunky boots**, **zig-zag (lightning-bolt) eyebrows**, long lashes. In Vollständig: **three lightning-bolt wings per side** fanned behind the shoulders (each ≈1.1 m → 35 vox, est.) and a crackling star halo.
- **Palette (hex estimates):**
  - Skin `#F6D5C1` (shade `#E2B49C`); lips `#E68C98`
  - Hair light green `#A9E2A0`, shade `#6FBF84`, highlight `#DDF7CF`; eyebrows darker green `#5DA36F`
  - Eyes **green `#36B86A`** (anime, Brave Souls, ch.581 colour page) — the ch.640 spread made them **blue `#3D8BE0`**; pick green for consistency with the anime
  - Uniform white `#F3F3F0` / shade `#C8CDD7`; belt black `#18181C`; **heart case/buckle green `#2FD07A`**; boots white `#EFEFEF`, heel/sole `#7F8794`
  - Cap: white, gold trim `#C9A641`, black peak `#17171B`, black insignia
  - **Base-state lightning: electric blue** `#3FB8FF`, core `#EAFBFF` (anime + digital manga; Brave Souls uses green everywhere)
  - **Vollständig lightning, wings, halo: neon green** `#5CFF5C` / `#2BE86E`, white-hot core `#F2FFEC`, outer glow `#1A9C4A`
  - Galvano Blast: blue-white `#9AE6FF` with white core; Electrocution: green column + white core
  - Zombie variant: darker dusky skin `#9C8079` (verify), **red eyes `#E1262E`**, reishi horns/arm blades (described as **yellow** `#F2D21B` in one place and **green** in another on the wiki — verify), bone-white ankle skulls `#EDE6D6`
- **Look by form/outfit:**
  - **Base (TYBW):** white Sternritter cap (gold trim, black peak, insignia) on long green hair; white double-breasted jacket worn **unbuttoned and knotted up under the bust** (bare midriff) with the **side panels removed** to show cleavage; white **short-shorts** held by a black belt with a **green heart case on the side** (the folded bow); **bulky shaft-heeled white boots**. No cloak. Vain about her hair — dirt/rubble on her is a rage trigger.
  - **Barbarriel (Vollständig):** activation = **electric explosion in every direction**; six green lightning-edged wings behind the shoulders, a **star-shaped Quincy Zeichen halo made of electricity**, and a thin **thread of lightning coiling around her body**.
  - **Sklaverei-Barbarriel (anime-only):** adds **lightning-bolt markings on legs, boots and chest**.
  - **One-armed → regrown arm:** her left arm is blown off by Getsuga Jūjishō and rebuilt by Giselle from a dead Shinigami's flesh (optional mismatched-skin detail is *game-only*).
  - **Zombie Candice** (raised by Giselle after Auswählen): darker skin, red eyes, **two horns from the sides of the head**, a partial Vollständig: **blade-like reishi pieces on the forearms** and **skulls at the ankles**.
- **Weapons:**
  - **Heilig Bogen** — short bow folded inside the heart case; click → it pops out above her head; heart-shaped grip in the middle, the two limbs are **zig-zag lightning bolts**; ≈0.85 m (27 vox, est.), reishi string.
  - **Heilig Pfeil** — electrified arrows with **jagged lightning-bolt heads**.
  - **Lightning Swords (Vollständig)** — any of her six wings pulls off as a zig-zag sword (≈1.1 m); she dual-wields and boasts she has six of them.
- **Forms & states (ordered):**
  1. **Base** — Schrift usable anytime (hand bolts, sky strikes, lightning dodge).
  2. **Quincy: Vollständig "Barbarriel" (神の雷霆, "Thunder of God"; the name is very likely anime-given — see Open questions)** — Leiden Hant release; flight, six wing-swords, javelins, stronger lightning. Drains her stamina **very fast** (canon weakness); in reishi-rich air it once **turned on by itself**.
  3. **Sklaverei-Barbarriel** (anime-only) — environmental drain, Electrocution at full size.
  4. **Zombie** (story/NPC variant under Giselle's control) — retains Schrift and the partial Vollständig above.
- **Abilities (complete):**
  - *Schrift — The Thunderbolt (雷霆, ザ・サンダーボルト):* generates, controls and projects lightning, usually from her hands toward wherever she points.
    - `Hand Bolt` — forked lightning thrown from the palm/fingers at a pointed target; repeatable, chains between bodies. [Beam (short bursts), Projectile bolt, Status (paralysis)]
    - `Sky Strike` — calls heavy bolts down from the sky onto a group; one strike killed/maimed a whole squad of unseated Shinigami. [Blast (vertical), Environmental (scorch/fire)]
    - `Lightning Engulf` — a surge of lightning between her two hands that swallows a nearby target (how she floored the wounded Kenpachi after he got behind her). [Field (small), Status (paralysis, burn)]
    - `Rage Discharge` — omnidirectional lightning blast (she erupts out of the tower Ichigo threw her into; also used to knock Ichigo back after a sword clash). [Blast]
    - `Electrified Swat` — a charged backhand that bats people away (she swats her own teammates aside midair). [MeleeArc smash, knockback]
    - `Lightning Jump` — turns her body into lightning to **dodge a short distance around an attack or an opponent**. [Teleport, i-frames]
  - *Spirit Weapon:*
    - `Heilig Pfeil` (electric) [Projectile arrow, multishot, Status (paralysis)]
    - `Galvano Blast (ガルヴァノ ブラスト)` — bow-fired **5-gigajoule** lightning bolt she claims turns targets to dust; destroyed Ichigo's Ōken clothing, a garment Yhwach praised as the best protection a Shinigami can wear. [Projectile bolt / Beam, explode carving, Status (armor shred)]
  - *Quincy: Vollständig — Barbarriel:*
    - `Activation Burst` — lightning explodes in all directions as the wings form. [Blast]
    - `Flight` — high-speed flight on the six wings. [Mobility (wings)]
    - `Lightning Swords` — wings pulled off as dual swords; her strikes knock Ichigo back several meters. [MeleeArc cut]
    - `Galvano Javelin (ガルヴァノ ジャベリン)` — hurls one wing-sword as a javelin; can be **cancelled by an equal and opposite attack** (Ichigo nulls it with a small Getsuga from his short blade). [Projectile (javelin), explode]
    - `Electrocution (電滅刑 エレクトロキューション)` — points an arm skyward, a **huge pillar of electricity** surges around her, she condenses it around the arm (lightning also **leaks from her eyes**) and throws it as a **massive electric blast**. Manga: used in plain Vollständig; anime: right after Sklaverei. Lost the clash to Getsuga Jūjishō and cost her the left arm. [Beam (huge), Blast, Environmental, NEW: BeamClash]
    - `Sklaverei` (anime-only) — see §1.4. [Absorb, Environmental]
  - *Racial/other:* Hirenkyaku; Blut (**weakest of the Bambies**); hand-to-hand **3rd** among Bambies; durable (thrown through a tower with minor injuries) and enduring (stands up after Burner Finger 1 through the gut); Shadow; Medallion (no Bankai stolen).
  - *Other media:* **Brave Souls** — paralysis chance on every hit, second strong attack = Galvano Javelin, special move named "The Thunderbolt" (a huge electrocution with paralysis). **CFYOW (novel-only)** — survives as Mayuri's captive/test subject and is made to fight for him.
- **Passives & weaknesses:**
  - **Vollständig stamina drain (canon)** — her wings vanish mid-fight vs Byakuya → instant defeat. Our fastest-draining Vollständig.
  - **Short fuse / vanity:** dirty hair or a wrecked outfit = Rage (more damage, worse decisions, refuses to retreat).
  - **Weakest Blut** of the Bambies (low Vene/Arterie multipliers).
  - Javelin cancelled by equal-force attacks; beam clashes against stronger beams cost her a limb.
  - **Involuntary Vollständig** in very reishi-dense zones (fun quirk: at max charge the wings can pop out by themselves).
- **Signature moments to recreate:**
  1. **Lightning on the 11th Division** — sky-bolt the squad rushing to Kenpachi, dodge Kenpachi's Shunpo slash with a Lightning Jump and engulf him.
  2. **"My hair!"** — Ichigo hurls her into a tower; she erupts in rage and fires Galvano Blast; smoke clears, Ichigo's Ōken robe is gone but he is fine.
  3. **Six swords** — Barbarriel duel vs dual-Zangetsu Ichigo; she reveals she has six; Galvano Javelin gets erased by a line-drawn Getsuga; elbow to the gut.
  4. **Electrocution vs Getsuga Jūjishō** — beam clash, the X-shaped Getsuga cuts through, her left arm is gone; Giselle regrows it from a corpse.
  5. **Burner Finger snipe** — Bazz-B drills all four Bambies from a rooftop (event interrupt).
  6. **3-on-1 vs Byakuya** with Robert and NaNaNa; Barbarriel sputters out; Meninas carries her off and both are caught by Auswählen.
  7. **Zombie Bambies** storm Wahrwelt with Liltotto and Giselle.
- **Kit proposal:**
  - **Base form**
    - **Shift:** Hirenkyaku; tapping Shift *during an incoming attack* = **Lightning Jump** (6–8 m bolt-blink through enemies and projectiles, leaves a damaging arc trail). [Teleport, i-frames]
    - **LMB chain:** street-brawler palms and boot kicks; each hit adds a *Charge* stack (5 stacks = paralysis). Forward = electrified dropkick lunge · back = rising knee launcher with an upward zap · air chain = spinning heel kicks · down-in-air = **thunder stomp** (small crater + radial arcs) · sprint = sliding tackle in lightning form.
    - **Hold LMB:** charged palm thrust → cone discharge that blows targets through walls.
    - **Q — Thunderbolt:** aimed forked bolt (tap = instant, hold = sustained stream that sweeps and **chains to 3 targets and along conductive voxels — metal, water**). [Beam, NEW: ChainLightning]
    - **E — Sky Strike:** place a reticle; 1–5 bolts slam down (hold = 10-bolt barrage over a wide circle); craters, wood ignites. [Blast, Environmental]
    - **R — Heilig Bogen:** pop the bow from the heart; electrified jagged arrows (hold = 3-arrow fan).
    - **F — Galvano Blast:** 1.2 s draw; huge blue-white bolt that **disintegrates voxels along its path** (bores a tunnel) and strips armor/garment buffs.
    - **Z — Lightning Engulf:** short-range grab; lightning surges between her hands (channel, paralyze + burn).
    - **X — Rage Discharge:** omnidirectional blast (breaks grabs/binds).
    - **G:** Blut toggle (weak multipliers).
    - **C:** hair lifts and crackles, a scorched ring spreads, weak NPCs twitch-paralyzed.
    - **T:** Barbarriel. **V:** *The Thunderbolt* (Brave Souls special name) — dozens of sky bolts across the arena, then one colossal strike; mass paralysis.
    - **Tab:** Shadow, Medallion, arrow variants.
  - **Barbarriel (Vollständig)**
    - **Shift:** flight dash with a green lightning trail; Lightning Jump range ×2.
    - **LMB chain:** dual Lightning Swords — fast criss-cross slashes, arcs jump between hit targets; finisher = crossed double cut that **splits a building** (MeleeArc *cut*).
    - **Hold LMB:** draws **all six** wings for a spinning six-blade flurry ("I've got six").
    - **Q — Galvano Javelin:** throw a wing. Resource: **6 wings**; each thrown wing regrows after ~8 s; fewer wings = slower flight. [NEW: DetachableWingResource]
    - **E — Sky Strike** (green, bigger) · **R — Thunderbolt Stream** (green, thicker) · **F — Wing Barrage:** throw every remaining wing as homing javelins · **Z — Jump Chain:** three Lightning Jumps, each ending in a slash · **X — Discharge Nova:** repeat the activation explosion (≈15 m).
    - **Hold T:** Sklaverei (leg/boot/chest lightning marks; refill stamina).
    - **V — Electrocution** (needs Sklaverei): arm up, a lightning pillar engulfs her (damage aura), eyes spark, then a massive sweepable blast that gouges a long trench; enters **beam-clash** with opposing beams.
    - **Stamina:** fastest drain of any Vollständig; at zero she reverts and is *Exhausted* (no Hirenkyaku, slow) for ~6 s.
- **AI notes:** opens by sky-bolting groups; quick to anger — once hit by debris she spams Galvano Blast and pops Barbarriel early, then burns out; overcommits into beam clashes; berates her own team (friendly fire on); retreats only when exhausted.
- **Callouts:** "Garuvano Burasuto!" · "Garuvano Jaberin!" · "Erekutorokyūshon!" · "Barubarieru!" · "Sukuraverai!" · "Kuinshī: Forushutendihhi!" (nicknamed **"Candi"** by the others).

---

## Liltotto Lamperd (リルトット・ランパード) — Sternritter "G": The Glutton · Bambies
- **Wiki:** https://bleach.fandom.com/wiki/Liltotto_Lamperd (also Liltotto_Lamperd/Expanded_Universe, Spork, Spife, Golden_Crunch, Ichigo_Kurosaki_vs._The_Bambies)
- **Roster tier:** **A** — the showcase for the destructible world: she **eats the map**.
- **Canon power (1–10): 7** — tops both of Kubo's Bambie rankings (hand-to-hand and Blut) and has above-average reiryoku even for a Sternritter; ate PePe whole in Vollständig, took a The-Power punch from Meninas with only a bruise, bit off the upper bodies of several Shinigami at once; still never landed a real blow on Ichigo and was swatted by Yhwach.
- **Body:** 149 cm → **48 vox**; petite, child-like proportions (big head ≈ 1:5.5), short limbs. Silhouette keys: **chin-length straight blonde bob**, white cap, white skirt-uniform, **deadpan half-lidded eyes**, usually **munching something** (candy, an apple). **The Glutton:** her mouth area pushes forward into a **gaping, jagged-toothed maw much larger than her head** — big enough to bite the top halves off several adults in one go (≈2 m opening at full stretch, est.), like a bear trap made of flesh, her bored eyes still above it.
- **Palette (hex estimates):**
  - Skin `#F8DCCB`; hair blonde `#F0D27C`, shade `#C9A24E`, highlight `#FFF1BE`
  - Eyes **gold `#E2AE34`** (anime, ch.581); the ch.640 spread made them **purple `#8A5BC4`** — use gold
  - Uniform/skirt/gloves white `#F4F4F1`; **patterned leggings** — color/pattern not specified in our sources (proposal: charcoal `#2A2A33` with a small light cross motif) **(verify)**
  - **Golden heart case/buckle `#E9C24A`** worn on the **back** of her belt; cap white/gold/black
  - Glutton maw: lips/gums `#C4475A`, interior `#5E1222`, teeth `#FFF6E8`, tongue `#D96A7A`
  - Reishi / Vollständig: **gold** `#FFC83A`, edge `#FFF0A6`, glow `#E59A1E`
- **Look by form/outfit:**
  - **Base:** white peaked cap; blonde bob with bangs; Sternritter uniform variant with a **skirt instead of the long coat**, gloves, patterned leggings; gold heart case at the back of the belt. Flat, profane, food-obsessed.
  - **The Glutton (active):** lower face extends into the huge toothed maw (the rest of her body unchanged).
  - **Gagael (Vollständig):** **golden wings made of tooth/fang-like spikes**, star-shaped Quincy Zeichen halo.
  - **Sklaverei-Gagael (anime-only):** an **extra pair of wings shaped like jaws**, plus **fang-studded bracelets (cuffs) and anklets** — the cuffs are her Sklaverei weapons.
  - **After Auswählen:** Vollständig gone for good (she dodged the light; novel confirms it never returned).
- **Weapons:**
  - **Heilig Bogen** — short bow kept in the heart case; the whole bow looks like a **closed set of jagged jaws / a bear trap** with the heart grip in the middle; the "jaws" open slightly as she fires. ≈0.8 m (26 vox, est.).
  - **Heilig Pfeil** — arrowheads are **balls ringed with spiky teeth** (little biting mouths).
  - **Sklaverei cuffs** (anime-only) — fang bracelets that become a flying bear trap (Spork), a bladed whip (Spife, ≈6–8 m reach, est.) or a colossal ground trap (Golden Crunch, jaws large enough to swallow two people, ≈8–10 m, est.).
- **Forms & states (ordered):**
  1. **Base** — The Glutton usable anytime.
  2. **Quincy: Vollständig "Gagael" (神の飢え, "Hunger of God"; name very likely anime-given)** — fang wings, flight.
  3. **Sklaverei-Gagael** (anime-only) — jaw wings + cuffs; Spork, Spife, Golden Crunch.
  4. **Post-war (novel-only)** — no Vollständig; the novel also reveals that The Glutton lets her *assimilate* what she eats (see below).
- **Abilities (complete):**
  - *Schrift — The Glutton (食いしんぼう, ザ・グラタン):* she can **eat whatever she chooses** by pushing her mouth outward into a huge maw of jagged teeth. Side effect: **she is always hungry.** Canon meals: unseated Shinigami (several halves per bite), Ichigo's cape (snagged him), PePe Waccabrada (whole, alive), Rudbornn's Calaveras and an arm of Loly's Escolopendra (novel). She comments on how everyone tastes — **every victim has a personal flavor** (PePe disgusting, Loly "spicy", Calaveras tasteless). [Grab/Throw, Absorb, NEW: VoxelDevour]
    - `Digestive Assimilation` (**novel-only**) — she gains the special powers of what she digests: **The Love** (PePe's Schrift — she refuses to use it on principle) and Escolopendra's **corrosive poison**. [Absorb, NEW: AbilityAssimilation]
    - `Hollow Resistance` (**novel-only**) — eating Hollow matter only upsets her stomach (normally poison to Quincy); she still prefers Sklaverei for Hollows because "poison is still poison".
  - *Spirit Weapon:* `Heilig Pfeil` (toothed-ball heads). [Projectile arrow, multishot]
  - *Quincy: Vollständig — Gagael:* flight on fang wings. [Mobility (wings)]
  - *Sklaverei-Gagael (anime-only):*
    - `Spork (スポーク)` — fires one cuff as a high-speed projectile that **unfolds mid-flight into a large bear trap**; punches through and can wreck a building. [Projectile, Bind, explode carving]
    - `Spife (スパイフ)` — unrolls a cuff into a **bladed whip** (slammed Ichigo down to the ground). [MeleeArc cut (long reach)]
    - `Golden Crunch (ゴールデン クランチ)` — presses the cuffs to the ground and **sends a reishi wave along it** to the target, where it solidifies and **snaps shut as a gigantic bear trap**; it caught Ichigo *and* Giselle (Ichigo held the halves apart barehanded; the trap then closed on Giselle's neck). [GroundWave, Construct, Bind, NEW: ClosingTrapConstruct]
    - `Sklaverei` (§1.4). [Absorb, Environmental]
  - *Racial/other:* Hirenkyaku; **Blut — the best among the Bambies**; **best hand-to-hand of the Bambies**; Shadow (jumped from the edge of Wahrwelt straight to Silbern); high durability (building impact, The Power punch) and endurance (Burner Finger 1); captain-plus reiryoku. Perceptive — the only Bambie who recognized Ichigo immediately.
- **Passives & weaknesses:**
  - **Constant hunger** (canon side effect) — game: a *Hunger* meter that rises over time and with Glutton use; high Hunger = bonus bite damage but slower recovery; eating (enemies, voxels, snacks) lowers it.
  - Couldn't touch Ichigo; one-shot by Yhwach; lost Vollständig to Auswählen.
  - Golden Crunch has **no friend/foe check** (it trapped Giselle).
- **Signature moments to recreate:**
  1. **Lunch on the 11th Division** — she lands among Kenpachi's men and bites the top halves off several at once, complaining they're bland.
  2. **Biting Ichigo's cape**, getting punched into a building, then deadpanning that a Special War Power should manage at least that much.
  3. **Bambies Sklaverei combo vs Ichigo (anime-only):** Spork through a building → Spife whip slams him down → Golden Crunch catches Ichigo + Giselle → Meninas' Halteres crashes into the trap.
  4. **PePe's execution** — after PePe's Love Kiss turns Meninas on her, she activates Gagael, makes him beg, and **devours him**.
  5. **Auswählen escape** — dodges the beam that skeletonizes Robert, drags Giselle clear, screams at the sky.
  6. **Truce** — charges a gate orb with the Shinigami; Wahrwelt raid with Bazz-B and Giselle; zombie Bambies vs Soldat; beaten down by Yhwach.
  7. **Novel bonus:** Hueco Mundo — eats a tide of Calaveras and a limb of Loly's Escolopendra (gains poison), then confronts Hikone, a being built from Gremmy's remains.
- **Kit proposal:**
  - **Base form**
    - **Shift:** Hirenkyaku.
    - **LMB chain:** the cleanest martial-arts string of the Bambies — palm strikes, knees, low sweep; Arterie hits crack walls. Forward = **lunging chomp** (mini-maw, deletes a 0.5 m bite of anything) · back = rising kick launcher · air chain = scissor kicks · down-in-air = drop stomp · sprint = tackle.
    - **Hold LMB:** Arterie haymaker (crater).
    - **Q — Glutton Bite:** the maw lunges 4 m forward and **deletes every voxel inside a jaw-shaped volume** (≈2×2×2 m) — walls, floors, armor, projectiles. Weak NPCs caught are eaten (kill + heal); strong targets take heavy damage + bleed and are held for a beat. **Hold = Feast:** keep the maw open and walk, **eating a 2.5 m tunnel** through buildings/terrain at walking speed (each voxel lowers Hunger). [Grab/Throw, NEW: VoxelDevour]
    - **E — Swallow:** timed open-mouth parry that **eats incoming projectiles and beams** (beams are drunk for as long as held; costs Hunger). [Absorb/Reflect/Redirect]
    - **R — Heilig Bogen:** toothed arrows that **bite a spherical chunk** out of whatever they hit (carving projectile).
    - **F — Assimilate (novel-only flavor):** use one signature move of the **last strong target she devoured** (PePe's Love Kiss, Loly's poison spit, a Hollow's Cero…) until replaced. [NEW: AbilityAssimilation]
    - **Z — Snack:** eat the apple/candy she carries → small heal, Hunger down (quirk animation).
    - **X — Gnash:** three rapid bites in a forward cone.
    - **G:** Blut toggle (best Bambie multipliers). **C:** stomach-growl shockwave; dust and debris drift into her open mouth.
    - **T:** Gagael. **V — Full Course:** a **house-sized maw** erupts and bites a sphere (~8 m radius) out of the world — everything inside is gone.
  - **Gagael (Vollständig)** — flight; Glutton bites scale up (can take a whole floor out of a building).
    - **Hold T:** Sklaverei → cuffs + jaw wings.
    - **Q — Glutton (Vollständig)** · **E — Spork** · **R — Spife** (hold = whip spin) · **F — Golden Crunch** (ground wave → colossal closing trap; friendly fire on) · **Z — Jaw Wings** (*game-only extrapolation*: the jaw-shaped Sklaverei wings snap at adjacent enemies) · **X — Sklaverei drain**.
    - **V — Execution:** cinematic grab → the PePe scene (giant maw closes over the target; instant kill below 25% HP, massive damage otherwise).
- **AI notes:** patient and flat; snipes with arrows, closes when the target is weakened, uses Golden Crunch in crowds without caring who's inside; eats weak NPCs mid-fight to heal; prioritizes traitors (anyone who hit an ally of hers last); at low HP keeps eating rather than retreating.
- **Callouts:** "Supōku!" · "Supaifu!" · "Gōruden Kuranchi!" · "Gagaeru." · "Za Guratan." (nicknamed **"Lil"**; deadpan remarks about taste and hunger).

---

## Giselle Gewelle (ジゼル・ジュエル) — Sternritter "Z": The Zombie · Bambies
- **Wiki:** https://bleach.fandom.com/wiki/Giselle_Gewelle (also Battle_of_the_Zombies, Dancing_Dead_Boys_Club, Munchy_Munchy_Babies, Bambies; zombie Bambietta data from Bambietta_Basterbine in H2)
- **Roster tier:** **A** — the necromancer/summoner archetype; her kit *borrows the rest of the roster* as zombies.
- **Canon power (1–10): 5 personally, 8 with her army** — weak in a straight fight (4th in hand-to-hand among the Bambies) but 2nd in Blut; her zombie Hitsugaya (Bankai, perfect reflexes) mauled Ikkaku and Yumichika and pressed Mayuri; she survived a stab through the heart.
- **Body:** 160 cm → **51 vox**; slim, girlish build. Per Kubo (Q&A #288) **Giselle is biologically male** — model exactly as drawn (presents as a girl; nickname **"Gigi"**). Silhouette keys: **long black hair down to the lower back with two strands sticking straight up like antennae**, a **small cap clipped on the side of the head**, a long-sleeved white coat, black leggings; perpetual goofy grin, often tongue out.
- **Palette (hex estimates):**
  - Skin `#F6E0D6`; hair black `#15131B` with cool sheen `#343A57`; eyes **blue `#4C84D6`**
  - Coat white `#F4F4F1` / shade `#C9CDD8`; leggings black `#1B1B21`; shoes white; **blue heart case `#3C78DE`** on the side of the belt; cap white/black peak/insignia
  - Blood: fresh `#B3122A`, dark `#8C0F1C` (her blood is the weapon — make it bright and readable)
  - **Vollständig: purple** bones `#9A5CF2`, highlights `#D9C2FF`, glow `#6A2BC7`; skull arrowheads purple-white
  - Zombies: captain-class victims get **reddish skin** (`#C66A5E`, verify) because her blood saturates their whole body; zombified Quincy (Candice, Meninas) get **darker skin + red eyes `#E1262E` + reishi horns**
- **Look by form/outfit:**
  - **Base:** white long-sleeved trench-coat variant (the sleeves read long/loose — verify whether they cover the hands), black leggings, white shoes, side-tilted mini cap, blue heart case. Plays the helpless girl.
  - **Bait state:** deliberately takes a slash — gaping shoulder/chest wound, arm hanging limp, still smiling (wound closes afterwards).
  - **Azhalbiora (Vollständig):** **large purple wings shaped like bones** and a **skeletal reishi tail**. The wiki does not describe a halo for her (design choice: a small purple skull-star halo if one is needed for the Sklaverei hitbox rule).
  - **Sklaverei (anime-only):** bones rain out of the shaken wings; **skull constructs form over her fists**.
- **Weapons:**
  - **Heilig Bogen** — short bow from the heart case; heart grip, **limbs made of linked bones**; ≈0.8 m (26 vox, est.).
  - **Heilig Pfeil** — **skull-shaped arrowheads**.
  - **Her own blood** — the actual weapon (spray, droplets, splatter on attackers).
- **Forms & states (ordered):**
  1. **Base** — The Zombie works at all times (blood contact).
  2. **Quincy: Vollständig "Azhalbiora" (神の死, "Death of God"; name and look cited only to the anime)** — bone wings, tail, flight; she avoids it because it's tiring.
  3. **Sklaverei-Azhalbiora** (anime-only) — Dancing Dead Boys Club, Munchy Munchy Babies.
  4. **Post-Auswählen** — loses Vollständig (dodged the light) but keeps The Zombie and her zombies.
- **Abilities (complete):**
  - *Schrift — The Zombie (死者, ザ・ゾンビ):*
    - `Blood Infection` — **anyone splattered with her blood becomes her puppet-corpse** and obeys any order, including **killing themselves**. Dose scales with the victim's reiatsu: a single drop that reaches the brain is enough for weak souls; strong ones need the blood to **pool in the heart and spread through the whole body** first (hence the reddish skin of captain zombies; takes longer). Doesn't work on **living Quincy**. [Status (mind control), NEW: InfectionMeter]
    - `Bait` — she provokes people into cutting her (acting defenseless, begging) so the spray lands on them; she bites her own finger for a quick dose. [Shield (counter), NEW: SelfDamageResource]
    - `Corpse Summon` — a **dead Quincy can be summoned at any time and their powers remotely activated**; zombified Sternritter **keep their Schrift** and a partial Vollständig. She parks zombies somewhere and calls them later (the zombie Bambies were left in the city so they'd already be in Wahrwelt). [Summon, Teleport (summon)]
    - `Zombie Army` — she quietly builds a horde through a battle (dozens of zombified Shinigami, mostly 11th Division). [Summon (swarm), NEW: CorpsePersistence]
    - Zombie rules: zombies speak in fragments and **crave her blood** as a reward; their own blood is **not** infectious; those zombified **before death** keep fresh cells → **faster movement and reflexes** and **no personality** (perfect control); those raised **after death** keep a personality (Bambietta). Zombies keep fighting through lost limbs — Charlotte notes they may only stop when **smashed to pieces**. [NEW: ZombieAIConversion]
    - `Flesh Graft (healing)` — heals comrades by **replacing lost flesh with flesh from the dead**, even a whole limb (Candice's arm, rebuilt from a dead Shinigami floating up into place); **reattaches severed zombie limbs** by holding them in place. [Heal/Reject (organic only), NEW: LimbSever/Regrow]
    - `Undying` — endures and heals the fatal injuries she suffers as bait; survived Kensei's stab through the heart and **recovered by drinking zombie Bambietta's blood**. [Heal/Reject (self)]
  - *Spirit Weapon:* `Heilig Pfeil` (skull heads). [Projectile arrow]
  - *Quincy: Vollständig — Azhalbiora:* flight on bone wings; skeletal tail. [Mobility (wings)]
  - *Sklaverei-Azhalbiora (anime-only):*
    - `Dancing Dead Boys Club (ダンシング デッド ボイス クラブ)` — she shakes bones out of her wings and they assemble into **four cartoonish skeletons** that rush the enemy; if they're smashed, the **scattered bones fly back and pin the target's limbs**. [Summon, Bind]
    - `Munchy Munchy Babies (マンチ マンチ ベビース)` — **skull constructs form in front of her fists** and she charges; canon effect unknown (Golden Crunch interrupted it). Proposal: biting skull-fists that infect. [MeleeArc smash, Status]
    - `Sklaverei` (§1.4).
  - *Racial/other:* Hirenkyaku; Shadow; Blut (2nd best Bambie); durability/endurance (building impact, Burner Finger 1).
  - *Known zombies (Tab-wheel summon list):*
    - **Zombie Bambietta** (raised after death, keeps personality, begs for blood): The Explode — reishi orbs that turn whatever they touch into a bomb, barrages and omnidirectional bursts; a shrunken, **darker-red** version of her Vollständig wings. Arm can be reattached.
    - **Zombie Tōshirō Hitsugaya** (zombified *before* death: silent, flawless reflexes, reddish skin): Bankai Daiguren Hyōrinmaru, a **colossal wave of ice**, icicle kneecap stab, headbutt, ice-cast splint on a burned leg. (Use the Hitsugaya kit from B3 at full power.)
    - **Zombie Kensei Muguruma**, **zombie Rōjūrō "Rose" Ōtoribashi**, **zombie Rangiku Matsumoto** (captain/lieutenant zombies; later hijacked by Mayuri).
    - **Zombie Candice** and **zombie Meninas** (after Auswählen; partial Vollständig, horns, red eyes).
    - **Horde**: zombified unseated Shinigami (swarm fodder).
  - *Other media (novel-only):* survives the war (rescued by Haschwalth's aide), still runs zombie Bambietta, finds **Hollows hard to zombify**.
- **Passives & weaknesses:**
  - **Control can be stolen:** PePe's *The Love* has hijacked her zombies before; **Mayuri's blood-replacing drug** turns them against her (Kensei stabs her).
  - Can't infect living Quincy; strong targets take time to convert; weak in melee; panics when her own life is truly at risk; dislikes Vollständig (stamina).
  - Zombie fodder dies only when crushed/dismembered enough.
- **Signature moments to recreate:**
  1. **The bait** — 11th Division officers swear she's dangerous; she pleads innocence; one slashes her; blood sprays across them; she straightens up smiling and orders them all to kill themselves.
  2. **"Taking care of" Bambietta** — she finishes off the beaten, begging Bambietta and raises her (cutscene; tone it down).
  3. **Battle of the Zombies** — zombie Bambietta bombs Ikkaku & Yumichika; Mayuri arrives "shining"; his Reishi-suspension spheres delay the bombs; she reveals her horde; Mayuri answers with four revived Arrancar (Dordoni, Cirucci, Luppi, Charlotte); she calls **zombie Hitsugaya**; Mayuri hijacks Kensei & Rose; **stabbed through the heart**.
  4. **Recovery in the rubble** — drinks Bambietta's blood, beats her for protesting.
  5. **Regrowing Candice's arm** from a corpse mid-battle.
  6. **Wahrwelt** — summons zombie Bambietta, Candice and Meninas against a Soldat platoon; defeated by Yhwach.
- **Kit proposal:**
  - **Shift:** Hirenkyaku.
  - **LMB chain:** weak, floppy sleeve slaps and kicks — every hit flicks a droplet if she's bleeding (adds Infection). Forward = stumbling lunge with a blood fling · back = pratfall launcher · air chain = flailing kicks · down-in-air = splash landing (blood puddle that infects anyone who steps in) · sprint = shoulder bump.
  - **Hold LMB — Bait:** she drops her guard and pleads. If struck by **melee** during the window, the attacker is drenched (Infection jumps by their reiatsu tier) and the damage she takes is converted to slow regen. [NEW: SelfDamageResource]
  - **RMB:** guard as normal.
  - **Q — Finger Bite:** spits/flicks a spray of blood droplets (short cone; infects).
  - **E — Command:** order all zombies: *Attack my target* / *Guard me* / *Hold* — or **"Die"**: instantly kills fully infected low-tier NPCs; on players/bosses it forces a self-hit stagger.
  - **R — Raise:** convert a fully infected enemy or a fresh corpse into an allied zombie; weak souls convert instantly, captain-class needs a 3–8 s "spread from the heart" channel (their skin reddens as a progress bar).
  - **F — Call Corpse:** summon a stored zombie through a Shadow (Tab wheel: Bambietta, Hitsugaya, Kensei, Rose, Rangiku, Candice, Meninas, horde). Stored zombies use their **own full kit under AI**.
  - **Z — Flesh Graft:** tear flesh from a nearby corpse to heal an ally/self and regrow a lost limb; reattach a zombie's severed limb.
  - **X — Heilig Bogen:** skull arrows (on hit, skulls "bite" and add Infection).
  - **G:** Blut toggle. **C:** giggling flare; corpses nearby twitch and crawl (weak crawlers).
  - **T:** Azhalbiora (bone-wing flight; LMB chain gains **tail sweeps** — *game-only*). **Hold T:** Sklaverei → **Q: Dancing Dead Boys Club**, **E: Munchy Munchy Babies**.
  - **V — Dead March:** every corpse in a large radius rises at once, and every enemy above 50% Infection converts (respecting tiers).
  - **Passive — Drink:** consume an adjacent zombie's HP to heal herself (the Bambietta scene).
- **AI notes:** never opens with an attack — taunts and pleads to bait melee; stays behind zombies; escalates zombie quality as she loses (horde → Bambietta → Hitsugaya); bolts when her HP gets low; abusive to her own zombies (slaps them back into line); vulnerable to control-stealing enemies (PePe, Mayuri).
- **Callouts:** "Za Zonbi." · "Danshingu Deddo Boisu Kurabu!" · "Manchi Manchi Bebīsu!" · "Azarubiora." (sing-song taunts while baiting).

---

## Meninas McAllon (ミニーニャ・マカロン) — Sternritter "P": The Power · Bambies
- **Wiki:** https://bleach.fandom.com/wiki/Meninas_McAllon (also Diamond_Push, Dumbbell_Duster, Dumbbell_Duster:_Baton_Beat, Dumbbell_Duster:_Halteres)
- **Roster tier:** **B** (strong A-candidate) — the purest showcase of **picking up the world and throwing it**.
- **Canon power (1–10): 6** — 2nd in hand-to-hand and 3rd in Blut among the Bambies; floored Rukia (anime confirms it was her), punched a wounded Kenpachi into a crater, crushed a crowd under a building held in **one hand**, drove Ichigo head-first through several buildings; still easily outclassed by Ichigo and Byakuya.
- **Body:** 191 cm → **61 vox** — the tallest Bambie; slender but curvy, long limbs. Silhouette keys: **big purple bow at the throat**, **cap turned sideways**, long **wavy pink hair** with short bangs, frills at skirt, gloves and boots; dreamy, innocent face. **The Power** visibly **inflates her arm muscles** (forearm/bicep to 2–3× volume, one or both arms) — needs a per-arm swell morph. [NEW: MuscleSwellMorph]
- **Palette (hex estimates):**
  - Skin `#F9E1D2`; hair pink `#F59CC4`, shade `#D46E9E`, highlight `#FFD3E6`
  - Eyes **pink `#E0609A`** (wiki description); ch.581 colour page used purple hair+eyes, ch.640 pink hair + **green eyes `#3DBE7A`** — use pink unless anime reference says otherwise (verify)
  - Uniform/frills white `#F5F5F2`; leggings (color unspecified — verify); heart buckle `#FF6FAE` (verify); **neck bow purple `#7A3FB7` with a white Wandenreich emblem**; cap white/gold `#C9A641`/black
  - **Vollständig pink** `#FF7EB8`, highlight `#FFD6EA`, glow `#E0408A`; dumbbells and heart armor same pink
  - Zombie: darker skin `#9E7F78` (verify), red eyes `#E1262E`, **pink skulls on the shoulders**, small reishi flares on arms and legs, horns
- **Look by form/outfit:**
  - **Base:** sideways cap; long wavy pink hair, short forehead bangs; huge purple neck bow; **frilled skirt, frilled gloves, frilled boots**, leggings; heart-buckle belt carrying the bow case.
  - **The Power (active):** arm(s) swell into massive, veiny muscle — the only part that grows.
  - **Pornipora (Vollständig):** **pink wings built from four big heart shapes stacked per side** and a **spiky star-Zeichen halo**.
  - **Sklaverei-Pornipora (anime-only):** **heart-shaped kneeguards and a heart-shaped chestplate**, two **pink reishi dumbbells** in hand. (In the anime this enhanced look appears *before* her plain Vollständig.)
  - **Zombie Meninas:** darker skin, red eyes, horns, pink shoulder skulls, flares on limbs.
- **Weapons:**
  - **Heilig Bogen** — a *small* bow in the heart case; heart grip, plain arms; ≈0.6 m (19 vox, est.).
  - **Heilig Pfeil** — **heart-shaped arrowheads**.
  - **Dumbbells (Sklaverei, anime-only):** two pink reishi dumbbells (≈0.5 m each, est.) — *Baton Beat* stretches the handles into **long staves** (≈1.6–2 m); *Halteres* reshapes one into a **large broad axe-like blade** (≈1.5 m head, est.).
- **Forms & states (ordered):**
  1. **Base** — The Power always on; muscle swell on demand.
  2. **Quincy: Vollständig "Pornipora" (神の力, "Power of God"; name very likely anime-given)** — flight, heart wings.
  3. **Sklaverei-Pornipora** (anime-only) — heart armor + dumbbell techniques.
  4. **Mind-controlled** (story state) — PePe's Love Kiss makes her swell an arm and punch Liltotto.
  5. **Zombie** (story/NPC).
- **Abilities (complete):**
  - *Schrift — The Power (力, ザ・パワー):* superhuman strength — punches with tremendous force, **lifts and throws large buildings with ease**, **pushes an opponent through several buildings one-handed**, and can **drastically enlarge her muscles**. [MeleeArc smash, Grab/Throw, NEW: WorldChunkThrow]
    - `Diamond Push (ダイヤモンド・プッシュ)` — presses her hands together so the fingers and thumbs frame a **diamond-shaped gap**, then **thrusts forward** with huge force: Ichigo is blasted **through a building and high into the air**. (The name is cited only to anime ep. 387, where she is in Pornipora; in the manga she simply shoves him.) [Blast (directional), MeleeArc smash]
    - `Head-Grab Drive` — grabs the target's head and **rams them through a row of buildings** before they can react. [Grab/Throw, Mobility, NEW: CarryThroughWalls]
    - `Crater Punch` — hammer punch that drives a target into the ground (Kenpachi). [MeleeArc smash, GroundWave]
    - `Building Drop` — holds a large building aloft in one hand and drops it on a crowd. [NEW: WorldChunkThrow]
    - `Back-strike` — punishes anyone who turns their back in a fight (how she cut down Rukia). [MeleeArc]
  - *Spirit Weapon:* `Heilig Pfeil` (heart heads). [Projectile arrow]
  - *Quincy: Vollständig — Pornipora:* flight on heart wings. [Mobility (wings)]
  - *Sklaverei-Pornipora (anime-only):*
    - `Dumbbell Duster (ダンベルダスター)` — a barrage of dumbbell-weighted blows (Ichigo has to block with both Zangetsu blades). [MeleeArc smash]
    - `Dumbbell Duster: Baton Beat (バトンビート)` — stretches the handles into long batons and fights with them as staves (rapid clashes). [MeleeArc]
    - `Dumbbell Duster: Halteres (ハルテレス)` — turns one dumbbell into a **huge blade** and **dives from above** onto the target (she crashes into Liltotto's Golden Crunch). [MeleeArc cut, Blast (impact crater)]
    - `Sklaverei` (§1.4).
  - *Racial/other:* Hirenkyaku (fast enough to seize Ichigo's head before he reacts); Shadow (left the Seireitei by shadow after the first invasion); Blut (3rd among the Bambies); durability/endurance. Carries a collapsed ally to safety (Candice).
  - *Other media (novel-only):* Mayuri's captive/test subject with Candice; fights Hikone's Hollow swarm in the Rukongai.
- **Passives & weaknesses:** naive and easily mind-controlled (PePe); proud — **turning your back on her is an insult she punishes**; no ranged pressure besides a weak bow; Auswählen victim.
- **Signature moments to recreate:**
  1. **First invasion (anime):** while Rukia turns to look at Byakuya's defeat, Meninas strikes her down from behind and politely says goodbye to the unconscious lieutenant.
  2. **Kenpachi into the pavement**, then **a building dropped on his rescuers** one-handed.
  3. **Dumbbell duel vs Ichigo (anime-only)** → Baton Beat flurry → Halteres dive into the Golden Crunch mess.
  4. **Head-grab through the city + Diamond Push** to stop Ichigo from reaching Yhwach's tower.
  5. **PePe's Love Kiss** — swollen-arm punch on her best friend Liltotto.
  6. **Carrying exhausted Candice** across the battlefield when the Auswählen light hits them.
- **Kit proposal:**
  - **Shift:** Hirenkyaku bursts — short and explosive; dashing into a wall **bursts through it** (shoulder first).
  - **LMB chain:** heavy, deliberate punches that launch targets **through walls**; forward = lunging straight · back = uppercut launcher · air chain = double-axe hammer fists · down-in-air = meteor drop crater · sprint = shoulder tackle that bulldozes a path.
  - **Hold LMB:** swollen-arm megapunch (big crater, enemies ragdoll through several buildings).
  - **Q — Diamond Push:** diamond hand-frame → forward shove that blasts a cone and carries the target along. [Blast, MeleeArc smash]
  - **E — Lift & Throw:** rip a chunk of the world (rubble → whole building section, scaled by Muscle Up) and hurl it; hold to carry it as a shield. [Grab/Throw, Projectile, NEW: WorldChunkThrow]
  - **R — Head-Grab Drive:** grab, Hirenkyaku through every building in a line (each wall broken adds damage), finish with a slam. [Grab/Throw, NEW: CarryThroughWalls]
  - **F — Ground Breaker:** fist into the ground → crater + radial GroundWave.
  - **Z — Muscle Up:** stance (≈10 s): arms swell, super armor, damage ↑, throwable chunk size ↑. [Stance]
  - **X — Heilig Bogen:** heart arrows (light poke).
  - **G:** Blut toggle. **C:** flex flare — ground spiderwebs, nearby loose voxels jump.
  - **T:** Pornipora; **hold T:** Sklaverei → LMB chain becomes **Dumbbell Duster**; **Q:** Baton Beat (long staff combos, hold = spin) · **E:** Halteres (blade-dumbbell dive from the air) · **R:** Diamond Push (flying) · others unchanged.
  - **V — Building Drop:** she uproots the largest structure within reach and slams it onto the target area (in Sklaverei: Halteres from the stratosphere).
- **AI notes:** soft-spoken and a bit airheaded; closes distance relentlessly; throws buildings at kiting enemies; **gets a damage bonus vs targets facing away**; protects downed allies (picks them up and retreats); susceptible to charm effects.
- **Callouts:** "Daiyamondo Pusshu!" · "Danberu Dasutā!" · "Danberu Dasutā: Baton Bīto!" · "Danberu Dasutā: Haruteresu!" · "Pōnipora." (nicknamed **"Meni"**).

---

## Robert Accutrone (ロバート・アキュトロン) — Sternritter "N" (Schrift unrevealed)
- **Wiki:** https://bleach.fandom.com/wiki/Robert_Accutrone
- **Roster tier:** **B** — a clean speed-gunslinger archetype the Quincy roster otherwise lacks.
- **Canon power (1–10): 7** — fought Shunsui on even terms and took his right eye; one bullet kills and burns a Riteitai at range without looking; startled post-Royal-Palace Ichigo by appearing with a gun at his head; lasted longest vs Byakuya and **forced Senbonzakura Kageyoshi**.
- **Letter check:** his designation is **N**; the Schrift's **name and effect were never revealed**. The wiki only infers a speed link from his feats. (Not "E" — that is Bambietta's The Explode.)
- **Body:** 176 cm → **56 vox**; lean, upright, older gentleman. Silhouette keys: **swept-back hair, full mustache, thin glasses**, long hooded cloak over a calf-length coat, a **blue tie**, pistol in hand, sometimes a **silver briefcase**.
- **Palette (hex estimates):**
  - Skin `#EAC7AC` (slightly weathered); hair light brown `#9B7552`; mustache `#8A6646`; eyes dark brown `#3E2F24` **(verify)**
  - Glasses: thin silver frame `#B9BDC5`, faint lens tint `#DDE8F0`
  - Cloak / coat / trousers / shoes white `#F2F3F0`, shade `#C7CCD6`; **white belt** at the waist; shirt white; **tie blue `#2C59A6`**; briefcase silver `#B7BCC4`
  - Pistol and bullets: blue-white reishi `#A9DDFF`; **muzzle flash shaped like the Wandenreich cross**; kill-flames **blue** `#5FB8FF`
  - **Grimaniel: green** — anime broadcast first showed it blue (like Quilge's), the Blu-ray recolored it **teal `#2EC4B6`**, later episodes a **deeper green `#22A35A`** → pick one green family, e.g. `#2FCB86`
- **Look by form/outfit:**
  - **Base:** hooded Sternritter cloak; calf-length white trench coat cinched by a white belt; white shirt, blue tie, white trousers and shoes; swept-back light-brown hair, full mustache, thin-framed glasses; silver briefcase (prop only).
  - **Grimaniel (Vollständig):** reishi accessories including **wings and a star-Zeichen halo**; his reiatsu turns green.
  - **Sklaverei-Grimaniel (anime-only):** **green reishi boots** and a **green reishi mouth mask**; the air around him visibly warps.
  - **Death:** the Auswählen light strips his flesh mid-rant; **his skeleton drops** (needs a flesh-strip death effect). [NEW: FleshStripDeath]
- **Weapons:**
  - **Reishi Pistol** — a powerful handgun (≈28 cm → 9 vox, est.; model as a heavy automatic/revolver hybrid — exact form **(verify)**); **muzzle flash = Wandenreich five-point cross**.
  - **Heilig Pfeil** — small **bullet-shaped** arrows; one can kill a Riteitai and **wrap the body in blue reishi flame**, and knocks Shunsui back.
- **Forms & states (ordered):**
  1. **Base** — gunslinger, Hirenkyaku expert.
  2. **Quincy: Vollständig "Grimaniel" (神の歩み, "Walk of God"; Viz: "Ghrimaniel (God's Step)" — manga-named, ch. 497)** — can be activated **instantly, with no light pillar**, even for a split second (vs Shunsui).
  3. **Sklaverei-Grimaniel** (anime-only) — maximum speed; boots + mouth mask.
- **Abilities (complete):**
  - `Speed (implied Schrift)` — extremely fast even in base; Vollständig amplifies it further. [Mobility]
  - `Flash Vollständig` — a momentary Grimaniel burst to dodge a close-range Shikai strike and reappear behind the opponent (the eye shot). [Transform (instant), Teleport]
  - `Marksmanship` — point-blank precision (shot Shunsui's eye at arm's length) and **no-look kills at range** (shot a Riteitai while facing the other way). [Projectile (bullet), NEW: NoLookShot]
  - `Bullet Heilig Pfeil` — small, fast, deceptively heavy; **blue reishi flame** consumes weak victims. [Projectile, Status (burn)]
  - `Point-Blank Execution` — appears beside a target with the muzzle at their temple (Ichigo barely pushes the gun aside). [Teleport, Projectile]
  - `Shadow Gate` — places a hand on the ground and **swings the arm outward**, stretching his shadow into a **tower-sized Quincy-cross portal** to pour Soldat into an area — or steps into it to leave. [Teleport, Summon (Soldat), NEW: ShadowQuery]
  - `Blue Flame Pillar` — the invasion-opening pillar. [Construct, Environmental]
  - `Sklaverei rush` (anime-only) — at full speed, **merely dashing forward throws out a huge shockwave** and visually **warps the surroundings**. [GroundWave, Blast, Mobility, NEW: ScreenSpaceDistortion]
  - *Racial/other:* Hirenkyaku expert; flight (Grimaniel); parries/dodges Ichigo's dual blades; high pain tolerance (keeps fighting after Shunsui's slash); Medallion (none stolen).
- **Passives & weaknesses:** zealot whose faith breaks when he learns he's expendable (story state: *Hysterical*); offense fully stonewalled by Byakuya's Bankai; Auswählen death.
- **Signature moments to recreate:**
  1. **Blue flame pillars → duel with Shunsui:** shot clips his hat; a kick to the gut; flash-Grimaniel, appear behind, **shoot Shunsui's right eye**; no-look kill of a Riteitai; shoots Shunsui again while he mourns Yamamoto.
  2. **Shadow Gate** — opens the giant cross-shaped portal and orders the Soldat in.
  3. **8-on-1 vs Ichigo** — appears with his gun against Ichigo's head, compliments his toughness, fires (pushed aside).
  4. **vs Byakuya** with NaNaNa and Candice — the last one standing; **Sklaverei shockwave rush** forces Senbonzakura Kageyoshi; defeated.
  5. **The truth about Auswählen** — puts his gun to Liltotto's head and raves that the Sternritter are fuel, then the light **reduces him to a skeleton** mid-sentence.
- **Kit proposal:**
  - **Shift:** Hirenkyaku — the fastest in this file (longer, quicker dashes); **double-tap + lock = appear behind with the gun drawn** (opens a 0.5 s crit window).
  - **LMB chain:** gun-kata — pistol-whip, palm, knee, point-blank shot finisher; forward = sliding muzzle-jab · back = kick-off launcher with an upward shot · air chain = spinning shots · down-in-air = downward volley · sprint = drive-by shot.
  - **Hold LMB:** charged piercing round (passes through several targets and walls; ignites weak targets in blue flame).
  - **Q — Marksman:** aim mode (over-shoulder, precise single shots, headshot multiplier; hold to steady). [Projectile]
  - **E — No-Look Shot:** instant shot at a locked or recently-marked target **anywhere around him**, without turning. [NEW: NoLookShot]
  - **R — Point Blank:** blink beside the target and fire into their head (big damage unless parried).
  - **F — Shadow Gate:** hand to ground, arm sweep → giant cross-shaped shadow portal: teleport, **summon a Soldat squad**, or exit. Needs shade (fails in full light).
  - **Z — Blue Flame Pillar:** raise a pillar of blue fire (zone denial / territory marker).
  - **X — Flash Grimaniel:** 1.5 s Vollständig flash → perfect-dodge + appear-behind counter shot (no transformation).
  - **G:** Blut toggle. **C:** flare (green tint once Grimaniel has been used).
  - **T — Grimaniel:** instant activation (no pillar); wings, flight, speed ×1.5; **hold T — Sklaverei:** green boots + mouth mask, every dash emits a shockwave, screen-space warp around him.
  - **V — Zenith Rush** (needs Sklaverei): a burst of afterimages; he fires from every direction at once in slowed time, then reappears behind the target with the final shot.
- **AI notes:** formal and silent in combat, opens with flash shots from mid-range, never stands still; pops Grimaniel the moment an enemy gets close; at low HP goes Sklaverei and all-in; in the Auswählen set piece switches to a *Hysterical* scripted state (rants, aims at allies).
- **Callouts:** no attack names recorded beyond "Gurimanieru." / "Sukuraverai."; speaks with stiff, ceremonial courtesy and reveres "Heika" (His Majesty).

---

## Loyd Lloyd & Royd Lloyd (〝Ｌの〞ロイド・ロイド / 〝Ｒの〞ロイド・ロイド) — Sternritter "Y": The Yourself (twins)
- **Wiki:** https://bleach.fandom.com/wiki/Loyd_Lloyd · https://bleach.fandom.com/wiki/Royd_Lloyd (also Genryūsai_Shigekuni_Yamamoto_vs._Royd_Lloyd, Kirchenlied:_Sankt_Zwinger)
- **Roster tier:** **A as one "Copycat" slot** (the twins share a model and swap modes) — *the* system character that can become any other roster member. **C** as individual personalities (Loyd is basically off-screen: anime ep. 371 adds a short scene).
- **Canon power (1–10): copy-dependent.** Own base unknown (≈5). Royd-as-Yhwach (≈70–80% of Yhwach's power) **crushed a worn-out Kenpachi** and **held off Yamamoto** for a while, convincing him he was Yhwach; Loyd-as-Kenpachi was the hardest of Kenpachi's three opponents until Kenpachi outgrew the copy.
- **Names:** identical twins "Loyd" (older, the "L" one) and "Royd" (younger, the "R" one) — a pun, since Japanese pronounces Loyd/Royd/Lloyd the same way.
- **Body:** 170 cm → **54 vox**; tall, slender. Silhouette keys: **completely bald**, a **third eye in the middle of the forehead**, **round headphone-like casings over both ears with a dark rim**, Sternritter hooded cloak. Childhood flashback: short light hair with center-parted bangs and a small **forehead scar** where the third eye later appears (acquired after age 12). To tell them apart in-game (*game-only*): an "L"/"R" engraving on the ear casings.
- **Palette (hex estimates):** skin pale `#EFD8C8`; eyes (all three) dark `#2B2B30` **(verify)**; ear casings off-white `#E6E8EC` with black trim `#222327`; cloak/uniform white; childhood hair pale blond `#E2CF9A` (verify). **When copying, they take the target's palette exactly.** Royd's spells (as Yhwach): pale blue-white reishi `#BFE6FF`; Sankt Zwinger columns white-blue with glowing script.
- **Look by form/outfit:**
  - **Base:** bald, third eye, ear casings, hooded cloak.
  - **The Yourself:** an exact physical replica of the target — face, build, clothes, weapon; the third eye and ear casings vanish. On release or defeat they revert (Royd lies dying as himself when the real Yhwach arrives).
  - **Vollständig (Kubo Q&A #944):** usable while disguised — the **halo and wings simply appear on the copied body**. Their own Vollständig was never shown or named.
- **Weapons:** own weapon unknown; they **inherit the target's weapons**. Royd-as-Yhwach manifests Yhwach's **ornate broadsword** (Dadao-like, long hilt, **bird-shaped cross-guard**, ≈1.2 m est.), and fires **oversized Heilig Pfeil formed between both palms** once the sword breaks.
- **Forms & states (ordered):**
  1. **Base** (own body).
  2. **The Yourself (貴方自身, ジ・ユアセルフ)** — become a target:
     - **Loyd's version:** copies the target's **powers and techniques perfectly**, but their **memories/personality only ~70–80%**.
     - **Royd's version:** copies **memories and personality flawlessly** (perfect impersonation), but only **~70–80% of the power**.
     - (Q&A #549: each twin *can* copy the other half too, just at the 70–80% level — i.e., both copy everything, each is perfect at one half.)
  3. **Vollständig overlay** while disguised (Q&A only).
- **Abilities (complete):**
  - `The Yourself (copy)` — assume someone's exact likeness (Loyd did it the moment he faced Kenpachi). [Transform, NEW: RuntimeKitSwap]
  - **Copy weakness — "the original can outgrow you":** the copy is a snapshot; if the original becomes stronger than when copied, the copy is surpassed (Kenpachi beat Loyd this way). [NEW: SnapshotCopy]
  - **As Yhwach (Royd):**
    - `Blut Vene` — no-sold Kenpachi's sword; kept him alive inside the heat aura of Zanka no Tachi (Nishi) at distance; torn by Ryūjin Jakka (left forearm cut). [Stance, Shield]
    - `Enhanced Strength` — held Kenpachi off the ground by the throat one-handed; a kick that sent Yamamoto (blocking) flying onto a roof; **tore roof tiles up and threw them**. [Grab/Throw, NEW: WorldChunkThrow (small)]
    - `Hirenkyaku expert` — evaded Zanka no Tachi swings (cloak still cut). [Mobility]
    - `Reishi Sword` — Yhwach's sword; one swing **split a wave of Ryūjin Jakka's fire**; the blade was later erased by Zanka no Tachi, Higashi. [MeleeArc cut]
    - `Palm Heilig Pfeil` — huge arrows formed between both palms and launched with a flick. [Projectile, explode]
    - `Kirchenlied: Sankt Zwinger (聖唱「聖域礼賛」)` — the Quincy "ultimate defense spell that unites offense and defense", cast **instantly, without incantation**: he holds out a hand, reishi bands shoot from all five fingers and **project a giant Quincy Zeichen onto the ground**; a ring of **towering reishi columns** (one shaped like the Quincy cross) erupts around its rim; **anyone who steps inside is torn apart by "the light of God"**. Yamamoto's skeleton army simply overran it. [Field, Construct, NEW: ZoneEntryTrigger]
    - `Quincy spell knowledge` — through Yhwach's memories he knows Quincy "spells" that behave like Kidō (Tab wheel: also *Qual Kreis* from Yhwach's list, if desired). [Field, Bind]
    - `Medallion` — he did not take Zanka no Tachi (Yhwach's order; per Yamamoto, the Wandenreich couldn't comprehend it anyway).
  - **As Kenpachi (Loyd):** full Kenpachi power at the moment of copying (off-screen). [Transform]
  - *Racial/other:* Hirenkyaku, Blut, endurance (Royd stayed conscious with much of his torso and left arm burned away by Zanka no Tachi, Kita).
- **Passives & weaknesses:** the 70–80% caps (Royd: power; Loyd: memory → may *act* wrong); snapshot copy can be surpassed; Royd's composure breaks when he recognizes (through Yhwach's memories) fallen subordinates among Yamamoto's skeletons — Yamamoto notes he still has a human heart.
- **Signature moments to recreate:**
  1. **Loyd vs Kenpachi (first invasion):** Loyd turns into Kenpachi; two Kenpachis slug it out until the real one grows past the copy (then carries three Sternritter corpses to "Yhwach").
  2. **"Yhwach" holds Kenpachi by the throat** — Yamamoto lands behind him.
  3. **Royd vs Yamamoto (full set piece):** Äs Nödt, Bazz-B and NaNaNa ambush Yamamoto and are incinerated → forearm cut → tile throw → Reishi Sword splits a fire wave → **Zanka no Tachi** — Higashi erases his blade; Nishi's 15-million-degree aura (only Blut Vene keeps him from ash) → palm Heilig Pfeil → **Sankt Zwinger** → Minami raises the charred dead, among them Yhwach's long-dead Schutzstaffel (Huburt, Seydlitz, Algora), whom Royd recognizes through the copied memories → Kita burns away his torso → the real Yhwach appears, praises him, and **vaporizes him with a fingertip arrow** (only his legs remain).
- **Kit proposal ("Sternritter Y — Copycat" slot):**
  - **Base kit (uncopied):** shared Quincy layer; **LMB** plain martial chain; **Q — The Yourself (Copy)**; **E — Palm Heilig Pfeil** (giant two-hand arrow); **R — Blut Vene surge** (short invulnerability-ish block); **F — Shadow**; **Z — Mimic Voice** (taunt in the target's voice — Royd mode); **X — Medallion**.
  - **Copy rules:**
    - **Q (hold):** lock a target in line of sight within ~30 m, 1.5 s channel — the third eye glows and a **voxel "re-skin" wave** sweeps over the body — then you **are that character**: model, voice, kit, forms, V.
    - **Mode (chosen at character select or toggled with G while uncopied):**
      - **L-mode (Loyd):** 100% damage/area/speed of the target, but only ~75% of the target's technique list is available (a random subset is greyed out in the Tab wheel/slots), and AI-voice lines glitch.
      - **R-mode (Royd):** **75% scale** on damage/areas, but the **full technique list** (incl. Kidō/spells/Gintō) and perfect mannerisms; **enemy NPCs treat him as the real character** (aggro, dialogue, "it's really Yhwach").
    - **Snapshot:** the copy only has the forms the target had unlocked when copied; if the original later reaches a higher state (Bankai/Vollständig/Resurrección) the copy cannot follow and the original deals **bonus damage vs the copy** ("you've already been surpassed").
    - **T while copied:** the target's next form if it was in the snapshot; **hold T:** Quincy Vollständig overlay (halo + wings on the copied body; Q&A #944).
    - **Uncopy:** tap Q again (or forced at 0 HP: revert to the bald three-eyed body).
  - **Royd-as-Yhwach preset** (story boss): Blut Vene armor, Reishi Sword combos, tile throw, palm arrows, **V = Kirchenlied: Sankt Zwinger** (place the Zeichen; columns rise; anything entering takes massive light damage; destroys constructs inside).
  - **Twin co-op (*game-only*):** if both twins copy the same target in co-op, their halves combine into a 100%/100% copy for a short duration.
- **AI notes:** Loyd — silent, copies the strongest enemy on sight and fights in that style. Royd — perfect actor: speaks and taunts exactly like the target; arrogant as "Yhwach"; drops the act only when dying; devoted, apologizes to his king.
- **Callouts:** "Ji Yuaserufu." · as Royd-Yhwach: "Kiruhienrīto: Zankuto Tsuvingā!" · otherwise **the copied character's callouts**.

---

## Nianzol Weizol (ニャンゾル・ワイゾル) — Sternritter "W": The Wind
- **Wiki:** https://bleach.fandom.com/wiki/Nianzol_Weizol
- **Roster tier:** **C** (Royal Palace mini-boss / Yhwach's escort); **B** if we want a pure "untouchable trickster" slot.
- **Canon power (1–10): 6** — kept every guard's blade off Yhwach in the Soul King Palace and **bisected palace guards with a finger gesture**; undone in one move by Senjumaru, who attacked him from inside his own coat.
- **Naming note:** the epithet is **"The Wind" (紆余曲折, *za waindo*)** — the kanji mean "twists and turns / meandering", so it's *wind* as in **winding**, not air. No source we found calls it "The Wind-Up".
- **Body:** 156 cm → **50 vox**; small, wiry youth. Silhouette keys: **long shaggy black hair**, **two tongues** (he sticks both out), **barefoot**, a white **collarless double-breasted coat with two slit openings for the arms** (arms come out of holes rather than sleeves — verify against art), **four four-pointed star motifs on the lower coat**.
- **Palette (hex estimates):** skin `#F0D8C8`; hair `#15151A`; eyes **grey `#9AA0A9`** (anime) — **gold `#D9A93A`** in the manga; tongues `#D9566E`; coat white `#F3F3F0` with black star motifs `#1E1E24`; bare feet.
- **Look by form/outfit:** single form (no Vollständig shown). In the Palace he **rises out of Yhwach's shadow**.
- **Weapons:** none shown (no Spirit Weapon on screen).
- **Forms & states:** base only.
- **Abilities (complete):**
  - `The Wind (紆余曲折, ザ・ワインド)` — **aversion field**: attacks aimed at any target he chooses are not blocked but **pushed aside** so they miss; solid weapons **visibly bend away** around him. Works for others too (he shielded Yhwach while hidden in his shadow), and against attacks he can't see (instinct). He let a **torrent of boiling water** sweep away the Soldat he didn't care to protect — so it also deflects fluids. [Shield, Absorb/Reflect/Redirect, NEW: TrajectoryBend, NEW: WeaponBendDeform]
  - `Bend-Bisect` — points/moves a finger toward people and their bodies **bend out of the way so hard they split in half**. [Slice (small), NEW: TwistCut]
  - `Shadow ride` — travels inside Yhwach's shadow and acts from it. [Teleport, Sensing/Stealth]
  - *Racial:* Hirenkyaku, Shadow, Blut (assumed), captain-class reiryoku.
- **Passives & weaknesses:** **can't counter attacks too fast or too hidden for him to notice** — Senjumaru had secretly **re-sewn his coat**, and spikes stabbed him from inside the garment; cocky, never finishes his sentences (he admits people keep telling him so).
- **Signature moments:** rising from Yhwach's shadow as the guards' swords bend away; "you can't hit me" monologue; finger-flick bisecting a second wave of guards; the coat impales him, Senjumaru kicks his corpse off the walkway.
- **Kit proposal:**
  - **Passive — Aversion:** projectiles curve around him and melee weapons bend around his hitbox (render the bend on the attacker's weapon). Bypassed by: attacks from *unnoticed* sources (stealthed attackers, traps, his own equipment, attacks while he is stunned/looking away) and attacks above a speed threshold.
  - **Shift:** Hirenkyaku. **LMB:** lazy slaps/kicks (weak). **Q — Ward:** grant Aversion to an ally (he can hide in their shadow while doing it). **E — Finger Bend:** point → target is bent at the waist (heavy damage; bisects weak NPCs); also **twist-cuts voxel pillars**. **R — Redirect (*game-only*):** bent projectiles are flung at a new target. **F — Shadow Ride:** sink into an ally's shadow and travel with them. **Z — Fluid Part:** push floods/fire/lava away from a cone. **X — Taunt** (tongues out; enemies who attack him in melee get their weapon bent and are disarmed briefly). **V — Twists and Turns:** for 8 s every attack in a large dome is deflected, then he finger-bends everything in front of him.
- **AI notes:** stands still and lets enemies whiff; mocks; punishes with Finger Bend; never expects attacks from his own gear or the environment.
- **Callouts:** "Za Waindo." (half-finished sentences).

---

## Berenice Gabrielli (ベレニケ・ガブリエリ) — Sternritter "Q": The Question
- **Wiki:** https://bleach.fandom.com/wiki/Berenice_Gabrielli
- **Roster tier:** **C** — barely shown (killed off-screen by Kenpachi; the anime's ep. 371 adds a short scene of him talking). Great **gimmick boss** though.
- **Canon power (1–10): 5** — captain-class on paper; Kenpachi **tore his throat out** mid-objection.
- **Body:** 174 cm → **56 vox**; slender young man with youthful features (gender ambiguous in the manga; the anime and Viz confirm male). Silhouette keys: short blonde hair with a **longer purple lock on the right side of the bangs**, **painted nails each with a dark diagonal stripe**, hooded cloak, trench coat and a **bolo tie** at the throat.
- **Palette (hex estimates):** skin `#F3D9C8`; hair **blonde `#EBCB6A` + purple right-side bangs `#8A4FC0`** (anime; manga used pink/purple, digital colour black/blonde); nails base `#8A4FC0` (verify) with black stripe `#1A1A1A`; cloak/coat white; bolo tie cord black, clasp silver `#B9BDC5` (verify).
- **Weapons:** none shown.
- **Abilities:**
  - `The Question (異議, ザ・クエスチョン)` — he **raises an objection ("igi" / *Sollen* — "how things *ought* to be") against an opponent's existence or actions**; the target is **compelled to answer it**, and is **penalized if they fail to overcome the objection**. He opened by objecting to Kenpachi's very *murderous intent*. [Status (rule/compulsion), NEW: ObjectionRuleEngine]
  - *Racial:* Hirenkyaku, Blut, Shadow.
- **Weaknesses (canon):** **useless if he can't speak fully** or **if the target can't hear him fully**; talkative and overconfident.
- **Signature moment:** his grand "I object to everything about you!" speech — Kenpachi rips out his throat before he finishes the first objection.
- **Kit proposal (boss/NPC):**
  - **Q — Objection:** names a *rule* on a target in earshot (≈25 m): e.g. **"your intent to attack"** (attacking him → heavy backlash), **"your movement"** (moving → damage per meter), **"your guard"** (blocking → guard break), **"your power"** (using an ability → it fizzles and damages the user). The target can **overcome** it by a counter-action (QTE / answering with a reiatsu flare or breaking line of hearing).
  - **E — Second Objection** (stack a second rule), **R — Sustain** (keeps talking: rules last while he speaks), **F — Shadow**, **X — Blut Vene**.
  - **Counters** (needs speech/hearing systems): **Silence** (throat hit, gag) cancels everything; **Deafen** (Jerome's roar, explosions, earplug-type effects) makes the target immune.
- **Callouts:** "Za Kuesuchon!" · then "Igi…" / "Zoruren…" (*Sollen*) framing each objection — exact phrasing beyond the Schrift name is our proposal.

---

## Jerome Guizbatt (ジェローム・ギズバット) — Sternritter "R": The Roar
- **Wiki:** https://bleach.fandom.com/wiki/Jerome_Guizbatt
- **Roster tier:** **C** — barely shown (Kenpachi bifurcates him off-screen; anime ep. 371 shows him roaring low-rank Shinigami to death).
- **Canon power (1–10): 5** — lethal to weak Shinigami at close range; only **temporarily deafened** Kenpachi.
- **Body:** 189 cm → **60 vox** base — huge and muscular. **The Roar** makes him **far bigger and more ape-like** (scale not given — propose ×2–2.5, ≈4–4.7 m → build coarser and scale). Silhouette keys: **brown skin, cornrows running down into the sideburns, unibrow, big upper canines, sharp nails, dark hair patches on forearms and fingers**, hooded cloak, trench coat, trench boots.
- **Palette (hex estimates):** skin `#7A4A2E`; hair **white `#EDEDED`** per the wiki text (ch.640 colour profile) — the trivia says early art was dark, then light, then **black `#1C1A18`** again (verify; pick one); body-hair patches `#2A1E18`; eyes amber `#C98A2E` (unknown, verify); uniform white.
- **Abilities:**
  - `The Roar (咆哮, ザ・ロア)` — **enlarges into a feral ape form** that amplifies his roar into a **sound-based shockwave**: at close range it **mutilates or kills lower-ranked Shinigami** and left Kenpachi deaf for a while. [Transform, GroundWave, Blast (cone), Status (deafen), NEW: SonicDeafen]
  - *Racial:* Hirenkyaku, Blut, Shadow; brute strength (implied by build).
- **Look by form:** *base* — giant cloaked Sternritter with simian features; *Roar form* — hunched, much larger, hairier, longer arms, jaw and canines exaggerated (exact design not described in our sources — verify against anime ep. 371). No weapon or Vollständig shown.
- **Weakness:** useless against high-ranked fighters beyond the deafness.
- **Signature moment:** with Loyd and Berenice he corners Kenpachi in the first invasion; his roar shreds the low-ranked officers around them (anime), Kenpachi keeps coming half-deaf and cuts him in two.
- **Kit proposal (mini-boss):** **T** = ape form (size up, super armor). **Q — Roar:** cone shockwave that **shatters loose voxels/glass and strips debris**, kills weak NPCs, **Deafens** others (audio muffled for players; immune to hearing-based effects such as Berenice's). **E — Chest-beat:** radial pulse. **R — Ground pound** (GroundWave). **F — Leap slam.** **V — Howl:** sustained sonic beam that bores a cylinder through buildings.
- **AI notes:** charges in and roars at the weakest targets first.
- **Callouts:** (roars) · "Za Roa!"

---

## Shaz Domino (シャズ・ドミノ) — Sternritter (no letter in the manga; novel: "Ϛ": Stigma)
- **Wiki:** https://bleach.fandom.com/wiki/Shaz_Domino · https://bleach.fandom.com/wiki/Shaz_Domino/Expanded_Universe (13 BLADEs short story *Beginning of the Revive of Tomorrow*, by Ryōgo Narita — **non-canon**)
- **Roster tier:** **C** — one manga scene (one-shotted by Ichigo); the short story gives him a full fight vs **Izuru Kira**.
- **Canon power (1–10): 4** in the manga (massacred SRDI researchers, pierced a Kidō barrier and **Akon** with knives, then dropped by a single Ichigo attack); the novel makes him **effectively unkillable**.
- **"Vampire?" — no.** Nothing in the sources makes him a vampire or a blood-drinker. What the short story adds: he was **imagined into existence by Gremmy Thoumeaux** (like Guenael Lee) with a fake Schrift **"V: The Viability" (生存能力)**; by constantly repairing himself he **replaced his imaginary body with real reishi** and escaped Gremmy's control. Yhwach then made him an honorary Sternritter with the archaic Greek letter **"Ϛ" — Stigma (聖痕, "holy scar")**. His power **heals any damage by absorbing reishi from his surroundings**, regrowing limbs — the closest thing to the "vampire" vibe is that he *drains the environment* to live.
- **Body:** height unknown (propose ≈178 cm → 57 vox); slender. Silhouette keys: **blonde hair shaved into five sections**, **leopard-spot markings over the right side of his face**, **full-rimmed glasses**, hooded Sternritter cloak, uniform with **rows of buttons along cuffs and trousers**, **coattails under a yellow leopard-print vest**.
- **Palette (hex estimates):** skin `#F1D5C2`; hair blonde `#E8C766` with shaved-line scalp `#E9C9B0`; face spots dark brown `#6B4A25`; glasses frame black `#222226` (verify); vest yellow `#E8C23A` with brown rosettes `#3B2A12`; uniform white; knives blue-white reishi `#BFE8FF`.
- **Weapons:** **Reishi throwing knives** — large solid blades with tiny handles shaped like the Wandenreich cross (≈30 cm, est.); he **throws them gripped by the blade**; enough force to punch through a Kidō barrier and the officer behind it.
- **Abilities:**
  - `Reishi Knives` — multi-knife throws; in the story he also **reflects a Shakkahō with a knife**. [Projectile (needle/knife), multishot]
  - `Blut Vene` — concentrated in one arm it took a Wabisuke hit unhurt (but Wabisuke doubles weight with each hit). [Stance]
  - `Stigma / The Viability` (**novel-only**) — automatic regeneration fed by **absorbing reishi from the ground and air** (regrew an arm cut off by Kira, regrew the arm **he cut off himself** to shed Wabisuke's weight). The healing **can't be switched off**: pinned by Wabisuke-weighted rubble, his regeneration kept eating the floor beneath him and he **sank into the ground**, swearing revenge. [Heal/Reject (self), Environmental (absorb reishi), NEW: RegenConsumesVoxels]
  - *Racial:* Hirenkyaku, Shadow.
- **Weaknesses:** (manga) arrogance — brags about his power instead of fighting; (novel) uncontrollable regeneration can trap him; heavy-weight/sealing effects.
- **Signature moments:** SRDI ruins — three knives in Akon's back, starts bragging about his special power to an unknown orange-haired Shinigami, **cut down mid-sentence by Ichigo**; (novel) Central 46 raid looking for Hōgyoku data to become a Hollowfied Quincy, duel with Kira, sinking into the floor.
- **Kit proposal (NPC/boss):** **Q — Knife Fan** (3–7 knives), **E — Barrier Breaker** (single heavy knife that pierces shields), **R — Knife Parry** (reflect a projectile with a knife), **F — Self-Amputation** (cleanse a weight/bind/poison by cutting off the limb; regrow), **passive — Stigma:** regen that **eats surrounding voxels** (he slowly sinks/craters the floor while healing; standing on non-reishi materials stops it), **V — Undying:** full regeneration from near-death by draining a large crater of terrain.
- **Callouts:** none recorded (cut off mid-introduction).

---

## Asguiaro Ebern (アズギアロ・イーバーン) — Arrancar soldier of the Wandenreich
- **Wiki:** https://bleach.fandom.com/wiki/Asguiaro_Ebern (also Ichigo_Kurosaki_vs._Asguiaro_Ebern, Medallion, Luders_Friegen)
- **Roster tier:** **C** — **TYBW prologue boss** (first contact with the Wandenreich).
- **Affiliation check:** an **Arrancar** who serves the Wandenreich (wiki: "Soldier of Wandenreich"; the Wandenreich navbox lists him with **Luders Friegen** as "Arrancar soldiers"). Not a Sternritter, no Schrift. The **Jagdarmee** is the Wandenreich unit that captured Arrancar for service after Hueco Mundo fell, so he is *probably* one of its conscripts — **unconfirmed** in our sources. He denies being an Arrancar and acts like a Quincy.
- **Canon power (1–10): 4** — briefly kept Ichigo busy; survived a Bankai Getsuga Tenshō thanks to Hierro (grievously hurt); his Medallion failed.
- **Body:** 181 cm → **58 vox**; tall, slender. Silhouette keys: **short red hair swept back into two peaks at the sides**, a **mask fragment over the left eye with three holes**, a **right eyebrow that points upward**, long white double-breasted Wandenreich trench coat with shoulder straps, black belt with decorative buckle, white trousers, trench boots, **a Quincy-Zeichen-shaped Quincy Cross on the left wrist**.
- **Palette (hex estimates):** skin `#EFD9C9`; hair red `#C8352B`; mask bone `#EDE6D6` with dark holes `#2A2A2A`; eyes (unknown — propose amber `#D9A441`, verify); coat white; belt black; buckle silver; reishi cannon blue-white `#A9DDFF`; Medallion activation: **black energy `#0B0B10` → white light columns**.
- **Weapons:** **Reishi Cannon** — a **crescent-shaped construct several times his own size** (≈4–5 m span, est.) carrying **four cannon barrels** that fire heavy reishi blasts.
- **Abilities:**
  - `Reishi Cannon barrage` — volleys from the four barrels while he hovers. [Projectile (orb), Beam, multishot]
  - `Medallion (with incantation)` — unlike Quincy, he must **recite a long German-style chant** ("Aufreide…" — "Melt…"); **black energy** pours out and draws a **giant star/X sigil** in the sky, then **columns of white light** surround the target and start disintegrating the Bankai (Ichigo's sleeve cracked away). Breaking out quickly nullifies it; Ichigo's Bankai is immune anyway (inherently Hollowfied). [Bind, Status (Bankai theft), NEW: CrossKitTheft]
  - `Sonído` — reappears behind Ichigo. [Teleport]
  - `Hierro` — survived the full brunt of a Bankai Getsuga Tenshō. [Shield (damage threshold)]
  - `Shadow` — escapes in a shadow that "only covers the chosen". [Teleport]
  - `Hollow Bait` — two nights earlier he scattered Hollow Bait over Karakura to lure Hollows and study Ichigo. [Summon (Hollow waves)]
  - `Spiritual Awareness`, `Reishi Absorption` (Quincy-style, via the cross). Resurrección never shown.
- **Weaknesses:** slow Medallion chant; can be broken out of; arrogant; bickers with Luders; terrified of Yhwach (who **decapitates him** after his report).
- **Signature moments (prologue):** sitting on **Ichigo's bed**, refusing to move → **kicked out the window**; chase over Karakura; reveals the Quincy cross and cannon; goads Ichigo into Bankai → Medallion chant, the light columns, Ichigo smashes free → Getsuga point-blank → escape through a Shadow; later beheaded by Yhwach in Silbern.
- **Kit proposal (boss):** **Shift** Sonído; **Q — Cannon Volley** (4-barrel spread), **E — Charged Crescent** (all barrels into one beam), **R — Hollow Bait** (spawns a wave of Hollows), **F — Medallion Chant** (5 s channel; if the player is in Bankai and doesn't break the light columns with mashing/attacks, their Bankai is locked for the fight), **X — Shadow Escape** (phase transition), passive **Hierro** (per-hit damage threshold). Phases: cannon kiting → Medallion attempt at player's Bankai → wounded escape.
- **Callouts:** the Medallion chant (keep short: "Aufurīde… Rosu!!!").

---

## Bambies — team play & shared set pieces
- **Members:** Bambietta "Bambi" (E, leader — H2), Liltotto "Lil" (G), Meninas "Meni" (P), Candice "Candi" (T), Giselle "Gigi" (Z). The group name was coined by Kubo after serialization ended; never said on-page.
- **Shared visual language:** customized white uniforms (Bambietta alone keeps the hooded cloak), white caps, a **colored heart buckle/case** on each belt (Bambi red, Lil gold, Meni pink-ish (verify), Candi green, Gigi blue). The four in this file keep their folded bow in it, each bow/arrowhead themed on the Schrift (jaws, hearts, lightning, bones/skulls); Bambietta uses a reishi sword instead (H2).
- **Team dynamics to simulate:** chronic bickering; **friendly fire is on** (when Ichigo deflects their combined arrows, the explosion slams them into each other; Golden Crunch traps Giselle; Candice swats teammates aside); they still cover each other (Giselle regrows Candice's arm, Meninas carries Candice, Liltotto drags Giselle out of the Auswählen beam). Gag beat: arguing over who gets the kill with "rock-only rock-paper-scissors".
- **Co-op mode idea:** 4-player "Bambies" squad with friendly fire on and a shared *Glory* meter — whoever lands the kill takes all of it (Liltotto's rule in the 8-on-1; Bazz-B's counterpoint is that glory belongs to whoever steals it late).
- **Story chain (second invasion):** hunt the wounded Kenpachi → Ichigo crashes down → thrown into buildings → combined Heilig Pfeil volley deflected into themselves → Candice goes Barbarriel alone → (anime) the others go Sklaverei → Electrocution vs Getsuga Jūjishō → arm regrowth → **Bazz-B's Burner Finger 1 drills all four** → 8-on-1 with Bazz-B, NaNaNa, PePe, Robert → Shinigami reinforcements → Byakuya fight → PePe betrayal → Auswählen.
- **Endgame chain (Wahrwelt):** Liltotto + Giselle with **zombie Bambietta, Candice and Meninas** massacre a Soldat platoon (the downed Soldat **rise again covered in Yhwach's black, many-eyed substance** — creepy reanimation VFX), then are crushed by Yhwach.

---

## Full Sternritter index (A–Z, plus extras)

Status flags: **major** (long on-screen fights) · **moderate** · **minor** · **barely shown** (off-screen or a single scene) · **anime-only** / **novel-only** where relevant. "File" = which roster file holds the dossier.

| Letter | Schrift (kanji) | Holder | Vollständig | Role / notes | Screen time | File |
|---|---|---|---|---|---|---|
| A | The Almighty (全知全能) — *nominal* | **Yhwach** | — | Emperor; source of every Schrift; Haschwalth borrows The Almighty while Yhwach sleeps | major | H1 |
| A | Antithesis (完全反立) | **Uryū Ishida** | unnamed (no halo in the manga; anime adds a Sklaverei form) | Crown Prince, Schutzstaffel, defects; event reversal | major | A2 (Uryū) |
| B | The Balance (世界調和) | **Jugram Haschwalth** | none shown | Sternritter Grandmaster; misfortune redirection | major | H1 |
| C | The Compulsory (強制執行) — *honorary* | **Pernida Parnkgjas** | unknown | Schutzstaffel; the Soul King's left arm | moderate | H1 |
| D | The Deathdealing (致死量) | **Askin Nakk Le Vaar** | Hasshein (神の毒見) | promoted to Schutzstaffel; lethal-dose control | major | H1 |
| E | The Explode (爆撃) | **Bambietta Basterbine** | Zofiel (神の炎) | Bambies leader; later Giselle's zombie | moderate | H2 |
| F | The Fear (恐怖) | **Äs Nödt** | Tatarforas (神の怯え) | fear inducement | moderate | H2 |
| G | The Glutton (食いしんぼう) | **Liltotto Lamperd** | Gagael (神の飢え) *(name likely anime-given)* | Bambies; survives (novel) | moderate | **H3** |
| H | The Heat (灼熱) | **Bazz-B** | unnamed | pyrokinesis; defects | moderate | H2 |
| I | The Iron (鋼鉄) | **Cang Du** | unnamed | iron skin | moderate | H2 |
| J | The Jail (監獄) | **Quilge Opie** | Piskiel (神の正義) | Executive Hunting Captain of the 1st Jagdarmee | moderate | H2 |
| K | *epithet never revealed* | **BG9** | none | machine-bodied ("mechanical doll"); stole Suì-Fēng's Bankai | moderate | H2 |
| L | The Love (愛) | **PePe Waccabrada** | Gudoero (神の情愛) | infatuation control; eaten by Liltotto | moderate | H2 |
| M | The Miracle (奇跡) — *honorary* | **Gerard Valkyrie** | Aschtonig (神の権能) *(per wiki)* | Schutzstaffel; the Soul King's heart | major | H1 |
| N | *never revealed* | **Robert Accutrone** | Grimaniel (神の歩み) *(manga-named; Viz "Ghrimaniel")* | gunslinger; implied speed | moderate | **H3** |
| O | The Overkill (大量虐殺) | **Driscoll Berci** | none | killing-fueled growth; Sasakibe's Bankai | minor | H2 |
| P | The Power (力) | **Meninas McAllon** | Pornipora (神の力) *(name likely anime-given)* | Bambies | moderate | **H3** |
| Q | The Question (異議) | **Berenice Gabrielli** | none shown | objection compulsion | **barely shown** | **H3** |
| R | The Roar (咆哮) | **Jerome Guizbatt** | none shown | ape form + sonic roar | **barely shown** | **H3** |
| S | The Superstar (英雄) | **James** (true holder) / **Mask De Masculine** (James's manifested "ideal hero") | Mask: unnamed (cape that doubles as wings, small wings at the neck/chest, star halo) | cheering-powered hero | moderate (Mask) / minor (James) | H2 (Mask); James → note below |
| T | The Thunderbolt (雷霆) | **Candice Catnipp** | Barbarriel (神の雷霆) *(name likely anime-given)* | Bambies | moderate | **H3** |
| U | The Underbelly (無防備) | **NaNaNa Najahkoop** | unnamed | reiatsu weak-point detection; ends in Mayuri's corpse unit (novel) | moderate | H2 |
| V | The Visionary (夢想家) | **Gremmy Thoumeaux** | none | imagination made real; the "monster" kept in a cell | moderate | H2 |
| V | Vanishing Point (消尽点) — *nominal* | **Guenael Lee** | none | an imaginary creation of Gremmy | minor | note below |
| W | The Wind (紆余曲折) | **Nianzol Weizol** | none shown | aversion field | **barely shown** (one chapter) | **H3** |
| X | The X-Axis (万物貫通) | **Lille Barro** | Jilliel (神の裁き) + second form | Schutzstaffel leader; first Schrift ever | major | H1 |
| Y | The Yourself (貴方自身) | **Loyd Lloyd** & **Royd Lloyd** | none shown | twins; copy powers / copy memories | Loyd **barely shown**; Royd moderate | **H3** |
| Z | The Zombie (死者) | **Giselle Gewelle** | Azhalbiora (神の死) *(name and look cited only to anime ep. 387)* | Bambies; zombie army | moderate | **H3** |
| Ϛ | Stigma (聖痕) — *honorary, **novel-only*** (formerly "V: The Viability", 生存能力) | **Shaz Domino** | none | Gremmy-made, self-made-real; undying regeneration | manga: **barely shown** | **H3** |

Not on the A–Z grid, but part of the Sternritter/Wandenreich cast:
- **James** (S, true holder of The Superstar) — tiny, chubby, bald fan in sunglasses and overalls who **rings a bell** to start Mask's bouts and **cheers him stronger and heals him**; immortal while Mask lives, regrows into **many small naked copies** from every cut-off piece (each copy cheers, powering Mask up further); dies when both are dead. 92 cm → 29 vox. Suggested: **Mask De Masculine's support summon** (C).
- **Guenael Lee** (V: Vanishing Point, nominal) — short, elderly-looking, big pink hair, exposed teeth, glasses, a lazy right eye, a head ornament pinned to four points on his face, short legs; 155 cm → 50 vox. **Version 1** = invisible, **Version 2** = intangible + leaves a decoy afterimage, **Version 3** = erases himself from people's memory (they forget being hit); *Vanishing Slider* = burst backstep beyond reaction speed; reishi dagger + a reverse-grip larger blade. Erased by Gremmy. Suggested **C** enemy (great stealth tech demo). [Sensing/Stealth, Afterimage/Clone, NEW: MemoryWipeStatus]
- **Huburt Alexander Kleich** — Sternritter **Vice-Captain** 1,000 years ago (under Haschwalth) and original **Schutzstaffel**; appears in Bazz-B's flashbacks (manga ch. 634) and as a **charred skeleton raised by Yamamoto** against Royd.
- **Johann Seydlitz**, **Algora Lallau** — the other Lichtreich-era Schutzstaffel; burned by Yamamoto 1,000 years ago, skeletons in the Royd fight (Algora also shields Nikita in the anime flashback).
- **Nikita Deslock** — **anime-only** (created by Kubo for the anime): blonde ponytail with aquamarine tips over the left eye, white jacket with grey arrow marks and aquamarine stripes, red neck ribbon, black pants, white heeled boots; a **bayonet rifle** that fires bullet-arrows in rapid bursts with a Wandenreich-cross muzzle flash. Flashback-only.
- **Haschwalth's Aide** — **novel-only** Wandenreich woman stronger than most Sternritter who **declined a Schrift** out of loyalty to Haschwalth; rescues Liltotto and Giselle after the war.
- **Arrancar soldiers:** **Asguiaro Ebern** (this file) and **Luders Friegen** (184 cm; long robe with hood and black face mask, black-and-white split hair, silver facial piercings; delivered the declaration of war to Yamamoto; killed by Yhwach for arguing with Ebern).
- **Units:** **Schutzstaffel** (Yhwach's elite guard: Lille, Gerard, Pernida, then Askin, then Uryū — Hagal-rune hooded coats), **Jagdarmee** (Hueco Mundo hunting army that captures Arrancar), **Soldat** (rank-and-file: beret, black goggles with white lenses, full gas mask, short collared cloak; long katana + basic bow).
- **Unrevealed / unnamed Sternritter:** group shots in both invasions show more cloaked Sternritter than are named; every letter A–Z is accounted for by the people above.

---

## Engine features — needs beyond the brief's primitive list

| `[NEW: …]` tag | Needed by | What it has to do |
|---|---|---|
| **VoxelAbsorptionStream** | every Sternritter (Sklaverei), Shaz | Dissolve reishi voxels in a radius from the surface inward and stream them as particles into a point (halo); feed stamina/HP; also consumes enemy constructs/summons in range. The brief's lore hook made literal. |
| **StaminaLimitedForm** + **WeakPointHitbox** | all Vollständig | A transformation with its own draining bar and forced revert (+ Exhausted state); the halo is a separate destructible hitbox that cancels the form's powers (not the look). |
| **ShadowQuery** | Shadow (all), Robert's gate, Nianzol | Ask the lighting system whether a spot is in shadow (shadowmap/light-probe sample) — Shadow travel fails in fully lit spaces; gates sized by gesture. |
| **CrossKitTheft** | Medallion (all Sternritter), Ebern | Lock another player's Bankai form and hand the thief a reduced-power copy of that kit; immunity rules (Hollowfied Bankai, Shin'eiyaku poison that returns it, "incomprehensible" Bankai); thief's Vollständig disabled while holding it. |
| **MapReishiDensity** | Quincy resource regen | Per-map/per-zone reishi value (Soul Society/Hueco Mundo high, Human World low) scaling Quincy regen; freshly broken voxels add local density; can trigger Candice's involuntary Vollständig. |
| **VoxelDevour** | Liltotto | Bite volumes that delete voxels (no debris), swallow projectiles/beams, grab-and-eat NPCs; "Feast" = sustained tunnel-eating while walking. |
| **AbilityAssimilation** | Liltotto (novel) | After devouring a strong target, grant one of its moves in a temporary slot (needs a per-character "signature move" export). |
| **ClosingTrapConstruct** | Liltotto (Spork, Golden Crunch) | Construct that travels/unfolds then snaps shut with a crush + bind; holdable open by strong targets (Ichigo); no friend/foe filter. |
| **InfectionMeter** + **SelfDamageResource** | Giselle | Blood particles/decals that tag whoever they touch; infection threshold scales with the victim's reiatsu tier; self-inflicted wounds as a resource; "bait" counter state. |
| **CorpsePersistence** + **ZombieAIConversion** | Giselle | KO'd bodies stay in the world; any roster character can be re-spawned as an AI ally **with its own full kit** (zombie Hitsugaya uses Hitsugaya's Bankai); faction can be **stolen** by other effects (PePe's Love, Mayuri's drug); zombies keep fighting until dismembered enough. |
| **LimbSever/Regrow** | Candice (arm lost/regrown), Giselle (grafts, reattach), Royd (forearm/torso burned off), Shaz (self-amputation + regrowth) | Per-limb damage states, detachable limb objects, regrowth from a donor corpse or regeneration. |
| **RuntimeKitSwap** + **SnapshotCopy** | Loyd/Royd | Swap a player's model, voice and kit at runtime to any roster character with multipliers (L-mode: 100% power, partial move list; R-mode: 75% power, full list, NPCs fooled); copy frozen at the target's current forms; original gets a "surpassed" bonus if it later transforms higher. |
| **WorldChunkThrow** + **CarryThroughWalls** | Meninas (buildings), Royd (roof tiles) | Cut a connected voxel chunk out of the world into a rigid-body projectile/shield; drag an enemy through a line of walls, breaking each. |
| **MuscleSwellMorph** | Meninas, Jerome (ape form) | Per-limb inflation of the voxel model (arm 2–3× volume) / whole-body size-up. |
| **ChainLightning** + **BeamClash** | Candice | Arcs that jump between targets and along conductive voxels (metal, water); two opposing beams meet, push back and forth, loser takes the overflow (Electrocution vs Getsuga Jūjishō). |
| **DetachableWingResource** | Candice | Wing count as a resource: wings become held weapons or thrown javelins and regrow on a timer; flight speed scales with wings left. |
| **TrajectoryBend** + **WeaponBendDeform** + **TwistCut** | Nianzol | Curve projectiles around a protected target; visibly bend an attacker's blade mesh around the hitbox; "awareness" check (unnoticed/too-fast attacks bypass); finger gesture that bends and splits a body or a voxel pillar. |
| **ObjectionRuleEngine** (+ *Silence*, *Deafen*, hearing radius) | Berenice, Jerome | Attach a rule to a target ("don't attack / don't move / don't block / don't use powers") with a penalty on violation; voided if the caster is silenced or the target can't hear (deafness, distance, loud environments). |
| **SonicDeafen** | Jerome | Cone shockwave that shatters weak voxels and applies Deafen (muffled audio for players, immunity to hearing-based effects). |
| **NoLookShot** | Robert | Fire at a marked target in any direction without turning (aim-assist outside the camera frustum). |
| **ScreenSpaceDistortion** | Robert (Sklaverei speed), shared with Gran Rey Cero etc. | Heat-haze/space-warp around a fast-moving body; dash shockwaves. |
| **FleshStripDeath** | Robert (Auswählen), Royd/Yhwach story beats | Death effect that peels the skin/flesh voxel layers off to reveal a skeleton model (needs a skeleton sub-model). |
| **ZoneEntryTrigger** | Royd (Sankt Zwinger) | A projected ground sigil + ring of pillars; anything entering the zone gets struck ("light of God"). |
| **RegenConsumesVoxels** | Shaz | Regeneration that eats the floor under the user (he sinks/craters as he heals). |
| **MemoryWipeStatus** | Guenael Lee (index note) | Victims "forget" recent hits: lock-on lost, damage numbers hidden, UI target cleared. |

Also implied: **friendly fire flags** (Bambies), **every roster character AI-drivable** (zombies, copies), a **Hunger** meter (Liltotto), **charm/mind-control faction swap** (PePe → Meninas), and story-state power removal (Auswählen strips Vollständig from Liltotto/Giselle/Bazz-B/NaNaNa).

---

## Open questions / not found
- **Robert's Schrift**: name and effect never revealed (only the letter N). "The Exactly" does not exist in our sources.
- **Vollständig name origins**: for Barbarriel, Gagael and Pornipora the wiki pairs a manga chapter (for the look: ch. 583 / 586) with an anime episode (383 / 387), and Azhalbiora is cited *only* to anime ep. 387; the wiki gives a Viz rendering only for Grimaniel (manga ch. 497, "Ghrimaniel (God's Step)"). So the four Bambie names are very likely anime-introduced — verify before using them as "manga canon".
- **Unconfirmed visuals (need reference art):** Liltotto's legging pattern; Meninas's legging color and heart-buckle color; whether Giselle's sleeves cover her hands and whether she has a halo; Nianzol's arm-slit coat; eye colors for Robert, the Lloyd twins, Jerome and Ebern; Robert's pistol model; Jerome's hair color (white vs black) and his ape-form size; zombie Candice's accessory color (yellow vs green); Shaz's height and glasses color.
- **Mechanics canon never specifies:** Munchy Munchy Babies' effect (interrupted); the exact penalty of Berenice's objections; the Lloyds' copy trigger (we assume line of sight) and their own Vollständig; how big The Glutton's maw can get.
- **Ebern ↔ Jagdarmee**: plausible, not stated.
- **Anime coverage**: the dump includes TYBW anime material through at least episode 406 (Part 4); if later episodes expand the Wahrwelt fight of the zombie Bambies or the Kenpachi trio, re-check for anime-only moves.

