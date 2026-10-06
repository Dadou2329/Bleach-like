# Roster F — Arrancar, Hollows & enemy bestiary

Design reference for the secondary Arrancar cast (tier B/C dossiers) and for the game's generic
Hollow enemy roster. Written from the Bleach fandom wiki (cleaned dumps + extra pages fetched for
this file), paraphrased. Everything here follows the project brief: 32 character voxels per metre,
0.25 m world voxels, every surface destructible, balance irrelevant.

**Conventions used in this file**

- **Hex colours are estimates** read from manga/anime memory and the wiki's colour words. Where the
  hue itself is uncertain (not just the shade) the value is marked `(?)` — check against anime
  stills before final modelling.
- **Source flags:** *anime-only* = filler/anime-original; *novel-only* = Ryōgo Narita's *Can't Fear
  Your Own World* (CFYOW) or other light novels; *game-only* = Brave Souls / Heat the Soul /
  Soul Resurrección (listed only as optional inspiration, never as canon).
- **Canon power scale (1–10)** used below: 10 = Yhwach/Final Aizen · 9 = Yamamoto, final Ichigo ·
  8 = top-4 Espada, strongest captains · 7 = average captain, lower Espada · 6 = Privaron Espada,
  elite Fracción, strong lieutenant · 5 = lieutenant / Números · 4 = seated officer ·
  3 = strong Hollow, early Ichigo · 2 = common Hollow · 1 = spiritually aware human.
- **Voxel heights:** `cm × 0.32` = voxels tall at 32/m. Giants (> 4 m) are specified at a coarser
  build density (16, 8, 4 or 2 voxels/m, finer on faces/hands) and scaled up in engine.
- Engine tags use exactly the brief's vocabulary in `[brackets]`; anything that needs a system the
  brief doesn't list is called out with **NEW:** and collected in the last section.

---

## 0. Shared Arrancar & Hollow racial kit

Every Arrancar dossier below assumes this baseline; individual entries only list colour, strength or
quirks on top of it.

| Racial power | What it does in canon | Game mapping | Tags |
|---|---|---|---|
| **Sonído** (響転) | Hollow/Arrancar high-speed step, equal in speed to Shunpo/Hirenkyaku. Instinctive; makes a booming/static "bun" sound instead of Shunpo's swish. Converts body reishi into "something that is not reishi", so it leaks no reiatsu and slips past Pesquisa and sensing. | **Shift.** Burst-dash/blink with a short static-crackle afterimage. While dashing the user is invisible to sensing/lock-on assist; double-tap Shift with lock-on = appear behind. | [Mobility] [Teleport] [Afterimage/Clone] [Sensing/Stealth] |
| **Cero** (虚閃) | Concentrated reiatsu blast. Mostly from the mouth, but per user also from palm, finger, horn, eye. Usually needs a pose; power, size and charge time scale with the user. Default colour crimson; many personal colours. | Tap = fast orb that explodes; hold = sweeping beam that bores a cylinder through terrain. Colour/origin point per character. | [Projectile] [Beam] [Blast] |
| **Bala** (虚弾) | Hardened reiatsu "bullet" from the fist. Weaker than Cero but ~20× faster, fired in rapid succession, more concussive. | Rapid-fire knock-back bolts; small craters, shatters thin walls. | [Projectile: bolt, multishot] [Blast] |
| **Hierro** (鋼皮) | Reiryoku-compressed steel skin; strong ones stop Zanpakutō bare-handed. Not absolute — opponents can adapt and cut through. | Passive damage reduction + bare-hand blade catch on a perfect parry. **G** toggles "Hierro brace" (more reduction, slower movement). | [Stance] [Shield] |
| **High-Speed Regeneration** (超速再生) | Regrows anything except the head/vital organs. Most Arrancar trade it away for raw power. | Only for characters marked with it: regrows lost voxel limbs over seconds. | [Heal/Reject] (self) |
| **Pesquisa** (探査神経) | Radar pulse that locates and gauges reiatsu sources; used meditatively by Grimmjow's Fracción. Cannot detect Sonído. | Tab-wheel pulse: x-ray outlines of enemies through walls, colour-coded by power. | [Sensing/Stealth] |
| **Descorrer** (解空) / **Garganta** (黒腔) | Espada-level (and some others) tear the dimensional fabric open into the Garganta, a black void of turbulent reishi where walkers must solidify their own footholds. | Tab-wheel: open a black rift (portal pair). Inside the Garganta the player builds a reishi path step by step — traversal set piece. | [Teleport] [Construct] |
| **Resurrección** (帰刃) | Releases the Hollow power sealed in the sword; the form echoes the old Hollow body. Heals prior injuries on release. Ends when resealed, on knock-out, or on defeat; the sword can be half-drawn. Discarding a body part while released makes the change permanent ("like burning off an arm"). A broken sword means no release. | **T** = release cinematic + partial HP refill. Hold T = reseal. Parts shed while released (Cirucci) flag the form as permanent. | [Transform] [Heal/Reject] |
| **Gran Rey Cero** (王虚の閃光) | Espada-only: blood mixed into a Cero; distorts space; banned inside Las Noches. | Only for a character who canonically held an Espada rank (Luppi). | [Beam] [Blast] |
| **Negación** (反膜) | Gillian-only: a rescue field that isolates a fellow Hollow (nothing can reach it) and lifts it away. Espada use a cube version, **Caja Negación**, as a punishment prison (an Espada breaks out within hours). | Enemy-side extraction beam for retreating bosses (see bestiary §B.2). | [Field] [Shield] [Teleport] |
| **Kūmon** (空門) | Gillian method of tearing the sky between worlds. | Sky-crack spawner for Menos (bestiary §B.2). | [Environmental] [Summon] |

**Common model language (all Arrancar):**
- Uniform is an inverted shihakushō: white jacket/hakama, black sash, black boots/tabi with white
  lines. Palette: uniform white `#F4F3EF`, uniform shadow `#D8D5CE`, sash black `#17171B`,
  boot black `#121216`, boot line `#ECECEC`.
- Mask fragment ("hovers" just above the skin per Kubo): bone `#F1EDE3`, crevice shade `#C7C1B4`.
- **Hollow hole**: a real through-hole in the voxel model (no voxels; dark inner faces `#060609`).
- **Estigma**: per-character face marks, often intensified on release.
- Number tattoos for Espada (Luppi: "6" on right hip) in black `#111114`.
- Arrancar killed decompose into reishi (pale motes `#CFE7FF`), they do not leave corpses.

**Default Arrancar control skeleton** (each dossier only overrides what differs):
Shift = Sonído · RMB = guard / Hierro catch-parry · G = Hierro brace · C = reiatsu flare in the
character's colour (lesser Hollows cower, mooks kneel, ground cracks) · T = Resurrección ·
Tab wheel = Cero (charged/quick), Bala, Pesquisa, Descorrer + character extras.

---

## Roster at a glance

| # | Character | Tier | Power | Height → voxels | Game role |
|---|---|---|---|---|---|
| A1 | Wonderweiss Margela | **B** | 7 | 155 cm → 50 | Fire-nullifier boss / wildcard playable; rides Hooleer |
| A2 | Luppi Antenor | **B** | 6 | 161 cm → 52 | Tentacle crowd-control playable / Karakura raid boss |
| A3 | Ggio Vega | **C** | 5 | 163 cm → 52 | Speed-blade mini-boss (Suì-Fēng duel) |
| A4 | Dordoni Alessandro Del Socaccio | **B** | 6 | 190 cm → 61 | Kick-fighter with tornado legs; Hueco Mundo tutorial boss |
| A5 | Cirucci Sanderwicci | **B** | 5 | 158 cm → 51 | Curving whip-disc / blade-wing flyer |
| A6 | Gantenbainne Mosqueda | **B** | 5 | 201 cm → 64 | Boxer with dragon-head beam cannons |
| A7 | Grand Fisher | **C** | 3 (Hollow) / 5 (Arrancar) | Hollow ≈ 5 m; Arrancar 342 cm → 109 | Story boss: lure/decoy Hollow |
| A8 | Ayon | **C** | 6 | 7.9 m (→ 15.1 m) | Summoned chimera / giant boss |
| A9 | Emilou Apacci | **C** | 5 | 156 cm → 50 | Tres Bestias (deer) |
| A10 | Franceska Mila Rose | **C** | 5 | 177 cm → 57 | Tres Bestias (lioness) |
| A11 | Cyan Sung-Sun | **C** | 5 | 154 cm → 49 | Tres Bestias (snake) |
| A12 | Shawlong Koufang | **C** | 5 | 190 cm → 61 | Grimmjow's Fracción leader; claw duelist |
| A13 | Edrad Liones | **C** | 5 | 200 cm → 64 | Grimmjow's Fracción; volcanic brawler |
| A14 | Rudbornn Chelute | **C** | 5 | 172 cm → 55 | Exequias commander; infinite skeleton army |
| A15 | Tesra Lindocruz | **C** | 4 | 178 cm → 57 | Nnoitra's Fracción; warthog bruiser |

Team-up note: the **Tres Bestias** play best as a 3-character tag/assist unit (one slot on the
select screen, swap with Shift+1/2/3 or AI partners) whose shared super summons **Ayon**. That
combined package is worth **B**.

---

## A. Arrancar dossiers

## A1. Wonderweiss Margela (ワンダーワイス・マルジェラ) — Arrancar #77, the only "modified Arrancar" (改造破面)
- **Wiki:** https://bleach.fandom.com/wiki/Wonderweiss_Margela · companion: https://bleach.fandom.com/wiki/Hooleer
- **Roster tier:** **B** — the game's hard counter to fire kits (built to beat Yamamoto) and the Fake Karakura "second wave" boss; a chaotic, wordless wildcard when playable.
- **Canon power:** **7** — impaled Ukitake from behind, knocked out a masked Mashiro with one punch, traded blows with Kensei's Bankai (result off-panel, Wonderweiss returns later), caught Ryūjin Jakka bare-handed and threw Yamamoto, survived Ikkotsu — then was erased by Sōkotsu.
- **Body:** 155 cm → **50 voxels**; 42 kg. Thin, childlike, narrow shoulders, slightly oversized head, long skinny arms; idle posture is a loose slouch with head tilts. **Released:** shoulders and thighs balloon (shoulder domes rise above the jawline), forearms and shins become stick-thin — top-heavy "boulders on stilts" silhouette about 1.6× his sealed width; same height.
- **Palette (hex estimates):**
  - Skin `#F4DCC8`, freckles `#C8956E`, hair pale blond `#F3E3A2` (tips `#FAF0C8`), eyes bright violet `#9B4FD6`, two front teeth `#FFFFFF`.
  - Tiara mask fragment bone `#F1EDE3`; standard white uniform (see §0) with large white arm cuffs lined black `#17171B` (?).
  - Sealed sword *Extinguir*: purple blade/sheath `#5D3A8E`, wrapped grip `#E6E0F0` (?), Eye-of-Horus guard antique gold `#B8913A` (?).
  - Cero violet `#B35CFF` (core `#F1E2FF`); Bala pink with static `#FF6EC7` / arcs `#FFE6F6`. Reiatsu colour undocumented → use pale violet `#C9A8FF`.
  - Released body bone-white `#ECE8E0` with violet-grey shading `#9C93A8` (?), mask bone `#F1EDE3`, eye hollows void `#060609`.
  - Sealed flames (absorbed Ryūjin Jakka): swirl `#FF7A1A` → core `#FFD27A`; same for the death burst.
- **Look by form/outfit:**
  - *Birth (cutscene):* bandage-wrapped humanoid Hollow with lumps under the wraps, floating inside a spherical barrier while the Hōgyoku works; speaks his own name once.
  - *Sealed:* side-parted blond hair whose tips fan outward; three-point tiara (centre point tallest) on top of the head; freckles; vacant violet stare; Arrancar jacket with a window at the centre of the chest showing the Hollow hole and the tip of a mark; bell-shaped oversized cuffs; the purple two-hander strapped across his back (from behind it reads as a claymore).
  - *Resurrección: Extinguir:* tall mask with three small horns covering the upper half of the face (eyes become black hollows); swollen shoulders/thighs, twig limbs; **four extra holes in the abdomen**, each with 2–3 slats inside like vents; Centurion arms sprout from back/shoulders on demand.
- **Weapons:** *Extinguir* (滅火皇子, "fire-extinguishing prince") — sealed: European long-hilted greatsword ≈ his own height (~150 cm), braided grip, eye-shaped guard; never actually swung in canon (he fights bare-handed). Released: no weapon.
- **Forms & states (ordered):**
  1. **Sealed** — instinctive brawler with screams.
  2. **Resurrección: Extinguir** — release command never shown (canon gap; use a wordless shriek). On release the fire-seal activates (below); massive strength/durability, regeneration, Centurion.
  3. **Death "overflow"** — the stored flames burst out when he dies.
- **Abilities:**
  - *Sealed*
    - `Instinctive brawling` — no style: punches, grabs, and a spear-hand that goes clean through a torso (Ukitake). [MeleeArc smash] [Grab/Throw]
    - `Clothes-grab hurl` — snags an opponent by scarf/clothing and flings them through several blocks of buildings (Mashiro). [Grab/Throw]
    - `Cero` — violet, charged in front of the mouth; its only use was interrupted, so power is unknown (treat as Espada-tier mouth beam). [Beam] [Projectile]
    - `Bala` — pink, crackling; fired defensively at Urahara. [Projectile: bolt]
    - `Sonído` — rarely used, but he appears behind captains unnoticed. [Teleport] [Sensing/Stealth]
    - `Hierro` — unfazed by a beating and by being hurled into buildings. [Stance]
    - `Descorrer` — opened an extremely large Garganta big enough for Hooleer. [Teleport]
    - `Vagido` (ヴァヒード, "newborn's cry") — banshee scream; the shockwave shattered Hitsugaya's ice obelisk (freeing Harribel) and blew away a smoke cloud; Hooleer obeys it ("his words have meaning"). [Blast: sonic cone] [Environmental: clears smoke/fog] [Summon: command]
    - `I Bu` (イ・ブー) — a short piercing yelp whose shockwave dissolves an incoming Cero (cancelled Mashiro Super Cero). [Absorb/Reflect: projectile nullify]
    - `Strength` — one punch knocked out a Hollowfied Mashiro. [MeleeArc smash]
  - *Extinguir*
    - `Ryūjin Jakka Seal` — his reason for existing: every new flame of Ryūjin Jakka is sealed inside the sword, and every flame already released is stored inside Wonderweiss as long as he lives (paid for by deleting his speech, memory and reason). **Game:** on release, all fire-tagged effects in a huge radius (fire abilities, burning voxels, flame prisons) spiral into him; every enemy with a fire kit gets *Sealed: fire* (fire moves greyed out) until he dies; a stored-fire meter fills. [Absorb/Redirect] [Status: element seal] [Environmental: extinguish] — **NEW: element tags + element-seal status**
    - `Death burst` — when he dies, his body explodes and releases every flame he absorbed (canon: shortly after Sōkotsu shattered him). Scale = stored-fire meter. [Blast] [Environmental: fire]
    - `Enhanced Hierro` — catches a swinging Zanpakutō bare-handed; tanks Ikkotsu. [Shield] [Stance]
    - `Enhanced strength` — throws Yamamoto across the city. [Grab/Throw]
    - `High-Speed Regeneration` — regrew half his mid-section in seconds. [Heal/Reject: self, restores own voxels]
    - `Centurion` (百奇皇手) — many huge arms burst from back and shoulders, stretch to long range, act singly or all together. [Swarm] [Grab/Throw] [Bind] [MeleeArc smash] — **NEW: Tendril (segmented extendable limbs)**
- **Passives & weaknesses:** no speech, callouts are cries; childlike distraction (plays with a dragonfly mid-mission, grabs at Urahara's hat); clings to Tōsen and blocks Gin from approaching him; still capable of fear (cowers before the killing blow); no guard technique — he dodges or tanks; pure physical force beats him (Yamamoto's fists); dying punishes whoever killed him.
- **Signature moments to recreate:**
  1. *Hōgyoku birth* in Las Noches before the assembled Espada.
  2. *Karakura raid:* sneaks up to steal Urahara's hat, Bala when spotted, then sits down bored; Negación pulls him home.
  3. *Fake Karakura arrival:* a colossal Garganta tears open and Hooleer looms out; Wonderweiss spears Ukitake through the back while Hooleer's breath snuffs out Yamamoto's fire prison around Aizen, Gin and Tōsen; Vagido shatters Hitsugaya's ice obelisk (freeing Harribel); his continued screaming makes Hooleer vomit a stream of Gillians.
  4. *Vs Mashiro:* she kills Hooleer with one kick; his mouth Cero is kicked shut; scarf-throw through buildings; I Bu cancels her Super Cero; when her mask cracks he knocks her out; Kensei catches the follow-up and releases Bankai — explosion.
  5. *Vs Yamamoto:* released Wonderweiss catches Ryūjin Jakka bare-handed and hurls the Captain-Commander; the flames are gone; Ikkotsu punches a hole through him, he regenerates and sprouts Centurion arms, Yamamoto tears them off and Sōkotsu shatters him; minutes later the corpse detonates with the stored inferno.
- **Kit proposal:**
  - *Sealed:* **Shift** Sonído (bias: reappear behind the target) · **LMB** flailing slaps and punches with irregular timing; forward = spear-hand impale (pierce + hold); back = headbutt launcher; air = clawing flurry; down-air = stomp · **Hold LMB** two-handed hammer-fist crater · **Q** Vagido cone scream (shatters Constructs, clears smoke/Fields, staggers; hold = sustained scream that also commands his summons) · **E** I Bu parry-yelp (nullifies beams/projectiles in front) · **R** Bala barrage (pink) · **F** mouth Cero (hold = beam) · **Z** clothes-grab hurl · **X** Call Hooleer (giant Garganta; Hooleer's breath extinguishes fires/Fields in a cone and disgorges 2–4 Gillians; see bestiary B-12) · **G** Hierro brace · **C** violet flare · **T** Extinguir · **Tab** Cero, Bala, Descorrer.
  - *Extinguir:* **Shift** bounding lunge (shoulder-first, smashes thin walls) · **LMB** long-reach slaps and shoulder checks · **Hold LMB** double-fist smash · **Q** Centurion (6–10 Tendril arms; tap = arms jab independently at nearby targets, hold = all slam one point) · **E** Blade Catch (counter-grab any melee weapon → throw) · **R** Regenerate (channel; rebuilds lost voxels/limbs) · **F** Fire Swallow (re-pulse the seal: drains fire from the area, refills meter) · **Z** Centurion grapple (pin with several arms and pummel) · **X** Vagido (released, larger radius) · **V** *Overflow* — vent the stored inferno in one detonation centred on himself (game extrapolation of the death burst; leaves him at 1 HP, form ends).
- **AI notes:** Phase 1: idles erratically (chases a dragonfly particle), then Sonído-ambushes whoever is busy fighting someone else, always from behind; I Bu reflexively vs incoming beams; screams when a summon is nearby. Releases **immediately** if a fire-kit character is in the arena, else at 50 % HP. Phase 2: relentless grappler, regenerates, Centurion below 30 %. Death: 3-second swelling glow, then fire explosion (arena should offer a "contain" interaction for fire-immune/Yamamoto-class characters).
- **Callouts:** wordless — drawn-out infant syllables ("aaa… uu…"), a shriek for Vagido, a sharp "I-bū!"; at birth only: "Wan-dā-wai-su".

## A2. Luppi Antenor (ルピ・アンテノール) — interim Sexta (6th) Espada, later 12th Division Corpse Unit
- **Wiki:** https://bleach.fandom.com/wiki/Luppi_Antenor
- **Roster tier:** **B** — an eight-tentacle crowd-control kit nobody else has; Espada rank gives access to Gran Rey Cero if wanted.
- **Canon power:** **6** — took on Hitsugaya, Rangiku, Ikkaku and Yumichika at once and held three of them captive; but Sennen Hyōrō froze him solid and Grimmjow killed him in one move.
- **Body:** 161 cm → **52 voxels**; 45 kg. Slim, androgynous, delicate; sleeves swallow his hands. **Released:** eight enormous tentacles (≈ 8–10 m each when extended) anchored on an octagonal plate on his back — a spider/octopus halo many times his size.
- **Palette (hex estimates):**
  - Skin `#F6E0D2`; hair black `#141218` (short, curly, unevenly cut); eyes lavender `#B49CE0`; estigma — three pink stars above the left eyebrow `#FF6FAE`; mask fragment (a row of upper teeth on the left side of the head) bone `#F1EDE3`.
  - Uniform white; black sash `#17171B`; black tabi `#141416`; open-toe low-heeled shoes white `#EDEDED` (?); Espada "6" on the right hip `#111114`.
  - Kodachi: pink grip and sheath `#E46FA6`, silver four-pronged tsuba `#C9CCD3`.
  - Tentacles bone-white `#EEE7DC` with segment rings `#CFC5B6` (?); Hierro Virgen spikes `#D9D2C6` (?); back plate and bone cowl `#F1EDE3`.
  - Reiatsu/Cero undocumented → lavender `#C7A6FF` (?).
  - Corpse Unit stitches `#3A2E2E`.
- **Look by form/outfit:**
  - *Sealed:* long-sleeved top with a slit under the left arm (sword pocket) and two large square cut-outs showing both sides of the abdomen; white hakama, black sash; smug half-smile, often licks his lips.
  - *Trepadora:* bone cowl over the head; octagonal emblem on the back with a tentacle rooted at each of its eight corners.
  - *TYBW Corpse Unit:* same, plus two vertical surgical seams running down over both eyes.
- **Weapons:** *Trepadora* (蔦嬢, "ivy maiden") sealed as a kodachi (~50 cm blade), kept in the pocket under his left arm.
- **Forms & states:** **Sealed** → **Resurrección: Trepadora** — `Kubire` ("Strangle") → *(TYBW)* **Corpse Unit** variant (same kit; Mayuri can shock his brain).
- **Abilities:**
  - *Sealed:* agile kodachi fencing (out-fought Yumichika) [MeleeArc cut]; Hierro (lieutenant blows bounce) [Stance]; Sonído [Teleport]; Descorrer (raid via Garganta) [Teleport]; Cero/Bala are racial but never shown for him (Tab only).
  - *Trepadora — tentacles attack and bind from range:*
    - `Lanza Tentáculo` (触槍, "tentacle lance") — one tentacle thrusts at high speed to impale. [MeleeArc cut: pierce] [Projectile-like reach]
    - `Jaula Tentáculo` (触檻, "tentacle cage") — all tentacles converge from every angle and crush. [Bind] [Blast smash]
    - `La Hélice` (旋腕陣, "the propeller") — spins the tentacles like rotor blades: whip storm on everything around him. [MeleeArc 360°]
    - `Hierro Virgen` (鉄の処女, "iron maiden") — tentacle tips sprout spikes. [Stance: damage buff] [Status: bleed]
    - `Multi-capture` — holds several opponents at once, dangling them as hostages/shields. [Bind] [Grab/Throw]
  - *Espada option:* `Gran Rey Cero` — legal for any Espada (§0) but never shown for Luppi (Brave Souls only) → flag as extrapolation. [Beam] [Blast]
  - *Corpse Unit (later material):* `Postcognition drug` — Mayuri's drug, sprayed via Luppi's blood, traps its user in a mental time-loop that resets to a checkpoint until the single escape is found; more than ten loops → 30 s of total paralysis. Source looks like post-manga supplementary material (novel/Brave Souls tie-in) — verify before use. [Status: time-loop] — **NEW: rewind**
- **Passives & weaknesses:** arrogant, invites more opponents ("4 against 8"); toys with prey, which gives openings; tentacles can be frozen (Hitsugaya) or sliced at the tip (Urahara); vengeful — always vows to return; Corpse Unit: Mayuri's brain-shock override.
- **Signature moments to recreate:**
  1. *Karakura raid:* releases mid-fight ("Kubire, Trepadora"), bats Hitsugaya out of the sky, then dangles Rangiku, Ikkaku and Yumichika; Urahara clips a tentacle tip; Hitsugaya freezes the tentacles and seals him in Sennen Hyōrō — a Negación pillar shatters the ice and lifts him away.
  2. *Las Noches throne room:* sneers that Orihime can't restore an arm that was burned to ash; Grimmjow, arm restored, spears him through the chest and blows his upper body away with a Cero.
  3. *TYBW:* Mayuri's zombie Arrancar charge Giselle's zombie army; Luppi takes on zombie Rangiku.
- **Kit proposal:**
  - *Sealed:* **Shift** Sonído · **LMB** quick kodachi cuts mixed with flicking kicks; forward = lunge stab; back = rising kick launcher · **Hold LMB** spinning double cut · **Q** Sonído slash (dash-through cut) · **E** launcher kick · **R** Bala · **F** Cero · **Z** Hierro catch-counter · **X** taunt ("Sorry~": draws AI aggro, small damage buff when hit) · **T** Trepadora.
  - *Trepadora:* **Shift** tentacle vault (plants two tentacles and flings himself; works off walls and ceilings) · **LMB** alternating tentacle lashes with long reach; forward = Lanza; back = tentacle uppercut; air chain = rotor lashes; down-air = all-tentacle slam crater · **Hold LMB** Jaula Tentáculo · **Q** Lanza Tentáculo (hold = fan of four lances) · **E** Jaula Tentáculo (cage + crush) · **R** La Hélice (360° rotor; airborne version hovers) · **F** Multi-capture (grab up to 4 targets; held targets can be smashed into terrain or used as shields) · **Z** Hierro Virgen (12 s spike buff) · **X** Anchor & rip (tentacles bore into a building and tear a chunk free to hurl — destructible-world extrapolation) · **V** Iron-Maiden Cage: Hierro Virgen + Jaula Tentáculo on one target, then all eight tentacles drive into the ground around it (crater) · **Tab** Cero, Bala, Descorrer, Gran Rey Cero (flagged).
- **AI notes:** opens sealed and taunting; releases as soon as he faces 2+ enemies or takes a clean hit; keeps 1–3 captives (each captive = shield; player must sever the tentacle to free them); telegraphs "skewer the hostage" with a 1.5 s wind-up as an interrupt window. Weak to freeze: frozen tentacles stop for 6 s. At low HP a Negación pillar extracts him (escapes the fight; returns in a later chapter).
- **Callouts:** "Kubire, Trepadora!" · "Gomen ne~" (mock apology) · "Yon tai hachi!" ("four against eight") · "Lanza Tentáculo!" · "Jaula Tentáculo!" · "La Hélice!" · "Hierro Virgen!"

## A3. Ggio Vega (ジオ＝ヴェガ) — Arrancar #26, Baraggan Louisenbairn's Fracción
- **Wiki:** https://bleach.fandom.com/wiki/Ggio_Vega
- **Roster tier:** **C** — speed/blade mini-boss; good upgrade candidate to B (three-blade tiger kit with a bulk-up battle form).
- **Canon power:** **5** — kicked Suì-Fēng into a building and pinned her with fired fangs, blasted out of her bind with a Cero; one Nigeki Kessatsu killed him.
- **Body:** 163 cm → **52 voxels**; 48 kg. Slim and wiry, youthful feminine face; saber-tooth skull helmet adds ~6 voxels on top. **Tigre Estoque:** more feline, wrist blades lengthen the forearm line, knee-length striped braid with a blade at the end. **El Sable:** hulking (≈ +40 % mass, hunched ~180 cm), forearms replaced by giant fang-blades.
- **Palette (hex estimates):**
  - Skin `#F2D6C0`; hair black `#141416` (short braid at the nape); eyes gold `#E2B33C`; skull helmet bone `#F1EDE3`.
  - Uniform: white mandarin jacket and close-fitting white hakama; martial-arts shoes black `#18181B` (?).
  - Sword: light-yellow grip `#F0DE8E`, silver slitted oval guard `#C8CCD2`, blade `#D9DEE6`.
  - Reiatsu and Cero magenta `#E0218A`.
  - Released: red stripe estigma `#D42A2A`; black stripe bands `#141416`; blond fur `#E8C76A`; wrist and braid blades `#D5D9E0` (?); braid striped `#E8C76A`/`#141416`.
  - El Sable: the white parts turn brown `#7B4A2B`; mane `#E8C76A`; fang-blades bone `#EFE9DC` (?).
- **Look by form/outfit:**
  - *Sealed:* saber-tooth cat skull worn like a helmet, scruffy black hair, short braid; mandarin-style jacket with a small chest opening, upturned collar, sleeves rolled to the elbow; seamless close-fit hakama.
  - *Tigre Estoque:* red stripes on cheeks and forehead; helmet elongated at the back with bigger fangs; jacket continues into a black-embroidered white loincloth; thick black stripes down the jacket sides and legs; thigh-length form-fitting white leggings; furred cat feet; blond fur at knees and elbows; a squared-off blade on each wrist; braid grown to the knees, striped blond/black, ending in a blade.
  - *El Sable:* brown, bulging, veined beast; small blond mane; forearms and hands are giant canine-tooth blades; stronger stripes plus a widow's peak running down the nose; even longer braid.
- **Weapons:** *Tigre Estoque* (虎牙迅風, "swift tiger-fang wind") — sealed: short, squared-off, double-edged straight blade (~50 cm), held reverse-grip for wide swings and stabs. Released: two wrist blades + braid blade (three-blade style). El Sable: two forearm fang-blades.
- **Forms & states:** **Sealed** → **Resurrección: Tigre Estoque** — `Kuichigire` ("Bite Off") → **Tigre Estoque El Sable** (battle form; raises the right blade, it glows; afterwards his body needs two months to shed the muscle).
- **Abilities:**
  - *Sealed:* reverse-grip swordplay — fast stabs and wide strokes [MeleeArc cut]; surprise kicks (sent Suì-Fēng through a building) [MeleeArc smash]; `Cero` magenta from the palm, bores through several walls (also used to blow apart the wall he was bound to) [Beam] [Projectile]; Sonído expert [Teleport].
  - *Tigre Estoque:* three-blade combos [MeleeArc cut]; `Misil Diente` (双射牙, "twin shooting fangs") — fires the helmet's fangs like missiles; they pierce building walls and pinned Suì-Fēng to a wall [Projectile: needle, multishot] [Bind]; enhanced speed/strength [Stance].
  - *El Sable:* `Tigre Estoque El Sable` (虎牙迅風・大劍) — bulk transformation, forearm fang-blades [Transform] [MeleeArc cut/smash].
- **Passives & weaknesses:** cocky lecturer ("you should have used Shunpo"); hates being underestimated; loyal to "His Majesty" Baraggan; death-mark kills (Suzumebachi's Nigeki Kessatsu) end him instantly.
- **Signature moments to recreate:** Baraggan's Fracción conjure his bone throne in the sky; Ggio and Nirgge volunteer to finish the Shinigami; Suì-Fēng binds him to a wall — he Ceros the wall away; kicks her into a building, then into Nirgge (killing his own comrade); pins her with Misil Diente; Ōmaeda grabs him; he triggers El Sable — and Suì-Fēng appears behind him: the butterfly crest blooms and obliterates him.
- **Kit proposal:**
  - *Sealed:* **Shift** Sonído · **LMB** reverse-grip stab chain with kicks woven in; forward = lunge stab; back = spinning heel launcher · **Hold LMB** wide reverse-grip sweep · **Q** palm Cero (hold = beam) · **E** feint kick (guard break) · **R** Sonído thrust · **F** counter stance (reverse-grip parry → riposte) · **Z** Bala (racial) · **X** wall-kick rebound (bounces off any surface; extrapolation) · **T** Tigre Estoque.
  - *Tigre Estoque:* **Shift** cat-dash (also runs on walls) · **LMB** wrist-blade combos + braid-blade lash at mid range · **Hold LMB** pouncing X-cut · **Q** Misil Diente (2 fangs; hold to charge → pins targets to walls) · **E** braid whip (long-range blade lash) · **R** pounce (leap + pin) · **F** Cero · **Z** claw-rake flurry · **X** tiger roar stagger (extrapolation) · **T** El Sable · **V** El Sable rampage (form + 8 s super-armour fang combo).
  - *El Sable:* heavy fang-blade cleaves that cut and crater; Shift becomes a short charge; no Misil Diente.
- **AI notes:** fights close with constant pressure and taunts; Ceros out of any Bind; releases after the first clean hit taken; El Sable below 30 % HP; extremely vulnerable to death-mark/assassination finishers (scripted instant-kill window).
- **Callouts:** "Kuichigire, Tigre Estoque!" · "Misil Diente!" · "Tigre Estoque El Sable!"

## A4. Dordoni Alessandro Del Socaccio (ドルドーニ・アレッサンドロ・デル・ソカッチオ) — Privaron Espada #103
- **Wiki:** https://bleach.fandom.com/wiki/Dordoni_Alessandro_Del_Socaccio
- **Roster tier:** **B** — flamboyant kick-only fighter whose release turns his legs into twin tornadoes; the natural "first Las Noches boss" that teaches the player about transformations.
- **Canon power:** **6** — handled Ichigo's Shikai with his feet alone and countered Getsuga Tenshō with a kick; fell to Bankai + Hollow mask. (Supplementary novel: formerly the 3rd Espada.)
- **Body:** 190 cm → **61 voxels**; 87 kg. Tall, muscular, long legs; theatrical stances (one knee raised, hand flourishes). **Giralda:** shoulder horns widen the silhouette; he floats on two tornado columns that roar out of his leg armour, each ending in bird-headed extensions.
- **Palette (hex estimates):**
  - Skin `#EBC6A6`; hair black `#18161A` (two short horn-like tufts); blue eyes `#3E6FD0`; black van-dyke beard and moustache `#18161A`; right-ear earring gold `#D6B04A` (?).
  - Uniform white with forearm fringes, shoulder pads; black undershirt `#1A1A1E` visible through front openings; red sash `#B3262E`.
  - Mask plate (small horned forehead plate) bone `#F1EDE3`.
  - Sword: purple grip `#5A2E85`, long down-curved crossguard `#C8A24A` (?), green sheath `#2F6B3B`.
  - Cero and Bala red `#E3262E`; reiatsu undocumented → crimson `#E3262E`.
  - Giralda armour bone `#EEE8DC`; cyclones pale wind `#E7ECEF` streaked with sand `#CBB892`; bird-heads bone-white `#F1EDE3` (?).
  - Corpse Unit: horizontal surgical seam across the face over the nose bridge `#3A2E2E`.
- **Look by form/outfit:**
  - *Sealed:* hair styled into two little horns, mirrored by the horns on his forehead plate; pointed beard; fringed sleeves; shoulder pads; black undershirt peeking through; red sash; single earring.
  - *Giralda:* emerges from a small tornado; large horns jut from the shoulders; armour starts at his feet, spirals up the calves and flares at the waist with two more spikes; mask extends to frame the face; exhaust spouts on the leg armour feed two huge cyclones with bird-like heads at their tips.
  - *TYBW Corpse Unit:* stitched seam across the face.
- **Weapons:** *Giralda* (暴風男爵, "storm baron") — sealed katana with purple grip, long down-curved guard, green sheath; he can release with the blade only half drawn. He almost never cuts with it.
- **Forms & states:** **Sealed** → **Resurrección: Giralda** — `Maware` ("Whirl").
- **Abilities:**
  - *Sealed*
    - `Kick-only martial art` (capoeira-like) — blocks blades with his legs; craters the ground, snaps support beams, kicks Ichigo through walls. [MeleeArc smash]
    - `Barón Puntapiés Alto` (男爵蹴踋術・上段, "baron's kicking art: high") — explosive backward kick strong enough to disperse a Shikai Getsuga Tenshō. [MeleeArc smash] [Absorb/Reflect: projectile cancel]
    - `Hierro` — blocks Zangetsu with his shin and grabs it bare-handed. [Shield]
    - `Sonído` expert — chains repeated counters. [Teleport] [Afterimage/Clone]
    - `Cero` — red; a rapid sequence of arm movements, then a pentagon framed between index and little fingers of both hands, blast fired from its centre. [Beam] [Blast]
    - `Bala` — red, knocked Nel flying. [Projectile: bolt]
  - *Giralda*
    - `Cyclones` — two tornado columns from the leg spouts keep him airborne; their bird-like extensions strike at long range. The birds are fragile (a Getsuga cuts them) but regrow endlessly. [Mobility: hover/flight] [Summon: semi-autonomous wind birds] [Environmental: wind]
    - `El Uno Picotear` (単鳥嘴踋, "single bird's beak") — one bird snaps an opponent in its beak; Dordoni then swings/slams the captive at will. [Grab/Throw] [Bind]
    - `Ave Mellizos` (双鳥踋, "twin birds") — wild tornadoes that spawn multiple bird-heads at once. [Projectile: homing, multishot] [Environmental: wind]
    - `Enhanced Hierro` — took his own Cero, swallowed and spat back by Nel (Cero Doble), with minor wounds. [Shield]
  - *Corpse Unit (later material):* same postcognition drug as Luppi (flag, verify source); Mayuri's brain-shock override.
- **Passives & weaknesses:** insists on fighting the opponent at full power — goads them to transform even at his own risk; refuses to finish weaker foes early; bird extensions are cuttable; once beaten he's marked for execution by the Exequias.
- **Signature moments to recreate:**
  1. *Tres Cifras ambush:* he sneaks up on Ichigo and Nel, gets noticed, and topples over in embarrassment; then kicks a Getsuga away and smashes Ichigo through a wall.
  2. *Release and the cyclones* hammering Ichigo, who refuses to use Bankai; Ichigo cuts a cyclone; Dordoni's Cero is swallowed by Nel and fired back (Cero Doble).
  3. *Provocation:* he attacks Nel to force out Ichigo's Hollow mask, laughs with joy when it appears — and is cut down in one stroke.
  4. *Last stand:* healed by Nel's drool, attacks again, has his sword broken; the Exequias arrive to "clean up"; he fights them with a broken blade, telling Ichigo to become a demon to win, and dies.
  5. *TYBW:* revived as one of Mayuri's zombie Arrancar against Giselle's army.
- **Kit proposal:**
  - *Sealed:* **Shift** Sonído with a spinning flourish · **LMB** kick chain (no weapon); forward = flying kick; back = Barón Puntapiés Alto launcher; air = scissor kicks; down-air = axe-kick crater · **Hold LMB** spinning heel-kick shockwave (GroundWave) · **Q** Barón Puntapiés Alto parry-kick (cancels incoming crescents/projectiles on timing) · **E** shin-block & grab (catch a blade with the leg, throw the wielder) · **R** Cero (pentagon hand-sign, hold = beam) · **F** Bala · **Z** capoeira handstand spin (360° AoE) · **X** "Niño!" provocation (enemy AI is pushed to transform; player-side: next hit received is converted into meter) · **T** Giralda.
  - *Giralda:* **Shift** cyclone glide (fast air dash; sustained hover by holding Space) · **LMB** bird-beak pecks from both cyclones at mid range · **Hold LMB** twin-cyclone stomp (crater + debris lift) · **Q** El Uno Picotear (grab & slam the captive through buildings) · **E** Ave Mellizos (volley of homing bird-heads that carve voxels) · **R** tornado wall (moving Field that drags debris and enemies) · **F** Cero · **Z** regrow birds (instant reset after they're cut) · **X** cyclone drill dive (plunge through floors; extrapolation) · **V** *Giralda Tempest* — both cyclones merge into one giant tornado that rips voxels and carries everything airborne (game extrapolation) · **Tab** Cero, Bala, Pesquisa.
- **AI notes:** duelist with a "full power" rule: if the player still has an unused release, Dordoni stays sealed and taunts; once the player transforms he releases and his aggression doubles. Uses hostage-threat on a weaker NPC to provoke the player. When defeated, triggers the Exequias clean-up event (see A14).
- **Callouts:** "Maware, Giralda!" · "Barón Puntapiés Alto!" · "El Uno Picotear!" · "Ave Mellizos!" · "¡Niño!"

## A5. Cirucci Sanderwicci (チルッチ・サンダーウィッチ) — Privaron Espada #105
- **Wiki:** https://bleach.fandom.com/wiki/Cirucci_Sanderwicci
- **Roster tier:** **B** — steerable whip-disc in base form, blade-winged flyer when released, and a third irreversible "amputated" form: a unique three-stage kit.
- **Canon power:** **5** — cuts building-sized pillars and forced Hueco Mundo-arc Uryū to bring out Seele Schneider; lost.
- **Body:** 158 cm → **51 voxels**; 47 kg. Petite; very puffy dress and sleeves widen the upper silhouette; small decorative wings on the back. **Golondrina:** two huge bladed wings (≈ 3 m span each), a feathery mane that trails past her feet, long prehensile tail, long slender clawed arms. **Amputated:** wings and arms gone, tail ending in a giant pink energy blade.
- **Palette (hex estimates):**
  - Skin `#F6E2D8`; short purple hair `#7A4BA8`; purple eyes `#8C5CCB`; light-purple lipstick `#B89AD8`; light-purple teardrop estigma on each cheek `#C7A6E8`; black nails `#141416`.
  - Dress: white `#F3F0F2` with black lace/frill trim `#1C1A20` (?); fingerless evening gloves black `#1A1A1E` (?); knee-high boots black `#17171B` (?); leg warmers on garters (?); small wings white `#F3F1F5` (?). Mask hairpin bone `#F1EDE3`.
  - *Golondrina* whip: steel wheel-blade `#C7CDD6`, dark handle/cord `#2A2830` (?).
  - Reiatsu pink `#FF5FA2`.
  - Released: blade-feathers steel `#C5CCD6` with pink vibration glow `#FF7AB8`; mane white-lavender `#EDE3F2` (?); beak headpiece and disc-shaped shoulder armour bone/steel `#E7E2DA`; tail bone `#EEE8DC`; Hachador/Gradiator energy pink `#FF6FAE`.
  - Corpse Unit: seam from right cheek to forehead `#3A2E2E`; no wings.
- **Look by form/outfit:**
  - *Sealed:* gothic-lolita frilled dress with huge shoulder-cut puffed sleeves, knee-high boots, fingerless evening gloves, leg warmers clipped to thigh garters, little wings on the back, spiked hairpin mask fragment above the left forehead (canon gag: armour under the skirt).
  - *Golondrina:* two large wings, each with ten crescent blades instead of feathers; beak-shaped headpiece with a huge feathered mane covering most of her body and trailing below her feet; long prehensile tail; shoulder armour shaped like the sealed wheel-blade; long thin arms with big claws.
  - *Amputated:* wings and arms gone for good; the tail's tip splits to emit energy weapons.
  - *TYBW Corpse Unit:* sealed outfit, wingless, cheek-to-forehead seam.
- **Weapons:** *Golondrina* (車輪鉄燕, "wheel iron swallow") — sealed as a whip with a disc-shaped wheel blade (~60 cm) looped into it: thrown and pulled back like a flail; its path can curve and even home on a target when there's room; deflects Heilig Pfeil; a flick can cut a person in half.
- **Forms & states:** **Sealed** → **Resurrección: Golondrina** — `Kakkire` ("Rip Off") → **Amputated** (self-inflicted, irreversible: can't reseal) → *(TYBW)* **Corpse Unit** (sealed kit only).
- **Abilities:**
  - *Sealed*
    - `Golondrina whip-disc` — straight throws and recalls, wide sweeps that topple building-sized pillars and grind craters. [Projectile: disc, slice carving] [MeleeArc cut]
    - `Curving / homing flight` — the disc bends its path and follows a target given enough open space (she hides this until cover is gone). [Projectile: homing] — **NEW: steerable Tendril-projectile**
    - `Deflection` — snaps the disc fast enough to swat arrows. [Shield] [Absorb/Reflect]
    - `Battle strategy` — baits opponents into destroying their own cover. (AI behaviour)
  - *Golondrina*
    - `Flight` with wings that also move like limbs. [Mobility: wings]
    - `Vibrating edges` — the wings' reishi edges vibrate at ~1.1–1.3 million times per second: huge cutting power and they bat reishi projectiles away; blades vibrating faster (Seele Schneider) cut through them. [Shield] [Stance] — **NEW: frequency clash rule**
    - `Ala Cortadola` (断翼, "severing wing") — wings extended as giant blades that cut through solid objects. [Slice] [MeleeArc cut]
    - `Ala Cortadola Dispersion` (断翼"散") — blade-feathers fired in volleys, then called back to the wings for repeated passes. [Projectile: crescent, multishot, return path] [Swarm]
    - `Claws & tail` — slashes and grabs. [MeleeArc cut] [Grab/Throw]
  - *Amputated*
    - `Body Alteration` — sheds wings and arms (which drain her reiatsu) to pour everything into one weapon; permanent. [Transform: irreversible]
    - `Ala Cortadola Hachador` (断人"大斧", "great axe") — tail tip splits and projects a giant pink fan of energy. [Slice] [MeleeArc cut]
    - `Ala Cortadola Gradiator` (断人"剣士", "swordsman") — the energy shaped into a sword at the tail tip for sword duels at range. [MeleeArc cut]
- **Passives & weaknesses:** light and fast; arrogant and easily irritated (Pesche drives her mad); a precise Quincy shot at the point where the Chain of Fate would be seals her powers, mask fragment and release (Arrancar share Shinigami anatomy) — give Quincy kits a "chain point" crit vs Arrancar; higher-frequency blades cut her wings.
- **Signature moments to recreate:** the pillared hall of Tres Cifras: she cracks Golondrina through pillars while Uryū uses them as cover, then reveals the curving flight once the hall is wrecked; Pesche's antics force her release; Seele Schneider saws through her vibrating wings; she rips off wings and arms, forms a giant pink blade — and Uryū fires Seele Schneider through her like an arrow, sealing her power; spared; executed off-panel by the Exequias; *TYBW:* revived, she cuts a zombie Shinigami in half with Golondrina and takes on zombie Rōjūrō.
- **Kit proposal:**
  - *Sealed:* **Shift** Sonído · **LMB** whip-disc lashes at mid range; forward = straight throw (pierces); back = yank-recall (pulls the target in); air = spinning lash · **Hold LMB** overhead disc slam (crater) · **Q** steer-throw (third-person guided disc; carves voxels along its path; hold = auto-home) · **E** pillar breaker (wide sweep that cuts columns/supports → structural collapse) · **R** deflect spin (disc rotor shield vs projectiles) · **F** Cero (racial; colour pink by her reiatsu) · **Z** tether swing (wrap the whip round a structure and swing; extrapolation) · **X** Bala · **T** Golondrina.
  - *Golondrina:* **Shift** wing-burst dash · flight (Space/Ctrl) · **LMB** wing-blade slashes + claw swipes · **Hold LMB** Ala Cortadola (wings as giant blades in an arc — slices buildings) · **Q** Ala Cortadola Dispersion (20 crescent feathers; hold = recall through enemies for a second hit) · **E** vibration guard (wings wrap into a shield; reflects reishi projectiles unless the attacker's blade has higher frequency) · **R** tail grab / lash · **F** strafing dive-cut · **Z** feather orbit (blade-feathers circle her as a Swarm; extrapolation) · **X** **Body Alteration** → Amputated form (confirmation prompt: irreversible this match) · **V** *Hachador Finale*: forces amputation and swings a building-sized pink fan-axe.
  - *Amputated:* **LMB** Gradiator tail-sword duelling at 4–6 m reach · **Hold LMB / Q** Ala Cortadola Hachador · **E** spinning fan sweep · no flight, ground mobility only.
- **AI notes:** kites at range and deliberately destroys the player's cover first; releases when cornered or when cover is gone; once more than half her blade-feathers are broken she chooses amputation (phase 3, permanent, high damage, low defence).
- **Callouts:** "Kakkire, Golondrina!" · "Ala Cortadola!" · "Ala Cortadola Dispersion!" · "Hachador!" · "Gradiator!"

## A6. Gantenbainne Mosqueda (ガンテンバイン・モスケーダ) — Privaron Espada #107
- **Wiki:** https://bleach.fandom.com/wiki/Gantenbainne_Mosqueda
- **Roster tier:** **B** — honourable boxer with prong-charged punches who becomes an armoured dragon-cannon brawler; a perfect rival for Chad.
- **Canon power:** **5** — out-boxed Chad and overpowered Brazo Derecha de Gigante's second form; destroyed by La Muerte, then one-shot by Nnoitra.
- **Body:** 201 cm → **64 voxels** (afro adds ~8 voxels of volume); 121 kg. Heavy boxer build. **Dragra:** longer armoured arms, domed plates running down the back into a tail — an armadillo-boxer.
- **Palette (hex estimates):**
  - Skin brown `#8A5A3C` (?); big afro, thick sideburns and goatee burnt orange `#C2541C`; eyes brown `#5A3A22`.
  - Mask: sunglasses-shaped plate on the forehead with four teeth above each eye, bone `#F1EDE3`, a blue star at its centre `#2F7FE0` (lens he sees through).
  - Uniform white with big frills at collar and thighs.
  - Punch daggers steel `#C9CED6`; energy arcs between prongs orange `#FF8A1F`.
  - Released armour plates bone `#EEE7D8` with dark seams `#5C5348` (?); dragon-head gauntlets bone with glowing mouths `#FF8A1F`.
  - Reiatsu orange `#FF8C1A`; Rugir del Dragón orange `#FF7A12` with hot core `#FFE0A0`.
- **Look by form/outfit:**
  - *Sealed:* huge afro, sideburns, goatee; the "sunglasses" mask plate pushed up on the forehead; frilled collar and thigh frills; two-pronged punch daggers hinged to the wrists.
  - *Dragra:* arms lengthened and covered in dome-shaped plates; daggers become dragon heads over the fists; plates continue down the spine into a tail; he pulls the mask plate down over his eyes like shades.
- **Weapons:** *Dragra* (龍拳, "dragon fist") — sealed: a pair of two-pronged punch daggers on wrist hinges; energy collects and discharges between the prongs. Released: dragon-head gauntlets that fire beams.
- **Forms & states:** **Sealed** → **Resurrección: Dragra** (release command never shown — canon gap).
- **Abilities:**
  - *Sealed*
    - `Boxing` — slips and counters every punch; catches a charged punch one-handed and throws Chad across the room. [MeleeArc smash] [Grab/Throw]
    - `Prong charge` — energy gathered between the prongs amplifies each strike (crackling arcs). [Stance] [Blast small]
    - `Uno Dos Cientos` (1・2・100) — three stages: *Uno* a chambered right to the gut, *Dos* a storm of jabs from both hands, *Cientos* an overhand smash that shatters the floor. [MeleeArc smash] [Blast]
    - `Sonído` expert. [Teleport]
  - *Dragra*
    - `Energy blast` — both palms together, a wide blast. [Blast] [Beam]
    - `Rugir del Dragón` (龍哮拳, "dragon roar fist") — orange beams and bursts of many sizes from the dragon gauntlets; the strongest takes the shape of a dragon head. [Beam] [Projectile: orb, multishot] [Blast]
- **Passives & weaknesses:** fights fair — holds back until truly hit and won't strike a downed foe; warns his opponent about a deadlier enemy; the armour shatters under a decisive blow (La Muerte).
- **Signature moments to recreate:** Chad vs Gantenbainne in Tres Cifras — Chad is out-boxed until he reveals Brazo Derecha de Gigante's true form; Gantenbainne releases and fires a blast; lifts his visor in the dust to see Chad standing with two armoured arms (Brazo Izquierda del Diablo); La Muerte smashes his release; Chad spares him; Gantenbainne warns him to run from Nnoitra, who downs both; the Exequias come to execute them and withdraw when Unohana arrives; Isane heals him.
- **Kit proposal:**
  - *Sealed:* **Shift** Sonído bob-and-weave (short evasive hops) · **LMB** boxing combo with prong sparks; forward = straight cross; back = uppercut launcher; air = hammer fists; down-air = diving overhand · **Hold LMB** prong-discharge punch (Blast) · **Q** Uno Dos Cientos (cinematic three-stage combo; Cientos craters the floor) · **E** slip-counter (timed dodge → hook) · **R** prong charge (next 3 hits explode) · **F** catch & throw (grab an incoming fist/blade) · **Z** Cero (racial; orange) · **X** visor down (precision lock-on, sees through smoke/darkness Fields) · **T** Dragra.
  - *Dragra:* **Shift** armadillo roll (curls and plows through walls; extrapolation of the armadillo form) · **LMB** dragon-gauntlet punches with burst explosions · **Hold LMB** two-palm energy blast · **Q** Rugir del Dragón (dragon-head beam; hold to sweep) · **E** burst volley (multishot orbs) · **R** plate guard (curl into a Shield; deflects small projectiles) · **F** tail sweep · **Z** dragon uppercut beam (anti-air) · **X** visor (as above) · **V** *Rugir del Dragón Máximo*: both gauntlets fire one giant dragon-head beam that bores a tunnel through the map (game naming).
- **AI notes:** honour code — never attacks a downed player, lets the player stand back up; releases after taking a heavy hit; ends fights with a warning line about a stronger enemy (story hook) and can become an ally NPC later.
- **Callouts:** "Uno! … Dos! … ¡Cientos!" · "Rugir del Dragón!"

## A7. Grand Fisher (グランドフィッシャー) — infamous Hollow, later an imperfect Arrancar
- **Wiki:** https://bleach.fandom.com/wiki/Grand_Fisher
- **Roster tier:** **C** — two-encounter story boss (Masaki's killer; then Isshin's reveal). Also the template for the generic **Lurer** Hollow (bestiary B-07).
- **Canon power:** **3** as a Hollow (evaded Shinigami for 54 years, stopped early Ichigo's blade bare-handed) · **5** as a transformed Arrancar (killed by Isshin in one cut).
- **Body:**
  - *Hollow:* no official height — estimate a 5–6 m hunched, round, hamster-like mass of fur (build at 16 vox/m → ~90 voxels); lure puppet ≈ 1.3 m (girl-sized, ~42 voxels at 32/m).
  - *Arrancar (official):* 342 cm → **109 voxels**; 806 kg.
  - *Transformed:* giant — Kon calls him bigger than a Menos Grande; suggest 40 m (build at 4–8 vox/m), with a sword ~2/3 of his height (Isshin mocks "skyscraper-sized" blades).
- **Palette (hex estimates):**
  - Hollow fur greyish ivory `#CFC8BD` (?) — the anime coat colour wasn't verifiable; bird-like hands and feet red `#C3262C`; lure stalk red flesh `#B23040`; mask bone `#F1EDE3`.
  - Lure "girl": long brown hair `#5A3B28` (?), pale dress `#EDEAE4` (?), human skin `#F2DCC8`; when the skin "peels", the inside is grey-white Hollow flesh `#D8D2C8`.
  - Arrancar reappearance: green fur `#5F7F3E` (?); dark face tattoo `#2A2A2E` (?); sword steel `#BFC5CE`, black grip `#1C1C20`, rectangular tsuba `#3A3A40` (?).
- **Look by form/outfit:**
  - *Hollow:* huge furry hamster-like body that stays hidden in shadows/foliage; white mask with holes beneath the eyes (tentacles shoot from them); red, bird-like clawed hands and feet; from the forehead/neck hangs a red, anglerfish-style stalk ending in a human-shaped lure.
  - *Arrancar, first form:* smaller, more humanoid version of himself; tattooed face; mask remnant is the whole lower jaw, hiding half his face.
  - *Arrancar, reappearance:* green fur all over, much larger, mask unbroken with its upper half pushed up on the forehead, Hollow hole sits higher, giant sword on his back.
  - *Transformed ("true strength"):* balloons in size; horns jut from the front and back of each shoulder; sheds some fur; mask shifts to reveal the top half of his head.
- **Weapons:** Arrancar Zanpakutō — absurdly oversized (described as about a two-storey building) with a rectangular tsuba; scales up with the transformation. Release (if any) unknown.
- **Forms & states:** **Hollow** (lure hunter) → *[off-screen: Aisslinger Wernarr shatters his mask → imperfect Arrancar]* → **Arrancar** → **Transformation** (giant). No Resurrección known.
- **Abilities:**
  - *Hollow form*
    - `Lure` (擬似餌) — hides his body and dangles the lure; it looks like a person (usually a girl), can detach and walk around on its own, and can be shaped into someone the enemy treasures so they won't strike it. [Summon: decoy] [Sensing/Stealth] — **NEW: disguise/mimic**
    - `Transcribe` (脳写) — needles hidden in the fingers of one claw pierce the victim and read their memories for "something they cannot cut"; the other hand then reshapes the lure into it (Masaki). [Status: mind-read] → feeds the Lure
    - `Migration` (移胴) — lure and body are both "real"; when one is hurt he jumps into the other (escape / swap). [Teleport] [Heal/Reject]
    - `Oppression` (圧髪) — extends limbs and fur to strike, impede or restrain. [Bind] [MeleeArc smash] — **NEW: Tendril**
    - `Eye-hole tentacles` — tentacles from the holes beneath his eyes snatch people (caught Yuzu). [Grab/Throw] [Bind]
    - `High-Speed Regeneration` — fur closes over a severed stump and forms a new hand. [Heal/Reject: restores voxels]
    - `Speed & strength` — out-dodges and counters early Ichigo; stops his blade with a bare hand. [Mobility] [Shield]
  - *Arrancar form*
    - `Descorrer` — Garganta travel. [Teleport]
    - `Transformation` — growth to giant size. [Transform]
    - `Giant sword` — building-scale swings. [MeleeArc cut] [Slice]
- **Passives & weaknesses:** cruel ambush predator (anime: prefers female victims); believes size equals power; arrogant — mocks "twig-sized" swords; the lure is a weak point if the player sees through it.
- **Signature moments to recreate:**
  1. *Rainy riverbank (flashback):* young Ichigo runs toward a girl about to fall into the river; Masaki shields him and dies — the girl was the lure.
  2. *Masaki's grave:* Karin sees the lure; Grand Fisher pins her and catches Yuzu with an eye tentacle; Ichigo severs the tentacle and a hand; the lure's skin peels away and it snaps back to the body; Grand Fisher regrows the hand, catches Ichigo's blade, reads his memories with finger needles and turns the lure into Masaki — then punches through "her" into Ichigo; Ichigo grabs the arm and stabs back; Grand Fisher escapes by leaping into the lure.
  3. *Isshin's reveal:* the Arrancar Grand Fisher hunts Kon-in-Ichigo's-body; Isshin's talisman throws up a barrier; Isshin appears in shihakushō; Grand Fisher transforms into a giant and draws his colossal sword; one cut from Isshin ends him, followed by a lecture on compressing a Zanpakutō.
- **Kit proposal** (boss kit; playable as a joke unlock):
  - *Hollow:* **Shift** burrow-dash (sinks into ground/foliage and resurfaces) · **LMB** red-claw swipes · **Hold LMB** body slam crater · **Q** Lure (deploy/recall the decoy; AI allies and enemies treat it as a civilian) · **E** Oppression (fur Tendrils grab/bind at range) · **R** eye tentacles (snatch and pull) · **F** Transcribe (finger-needle stab; on hit the lure copies a character from the victim's "bonds" list) · **Z** Migration (swap places with the lure; heals 20 %) · **X** regrow limb.
  - *Arrancar (transformed giant):* **LMB** colossal sword sweeps (Slice through blocks) · **Hold LMB** overhead cleave · **Q** stomp (crater, debris) · **E** Descorrer.
- **AI notes:** Encounter 1: body hidden underground or behind buildings; the lure wanders as a lost child near the player; approaching it triggers tentacle ambush. Mid-fight he Transcribes the player and the lure becomes a beloved character (cutscene) used as a shield — hitting it hurts the player too; below 25 % he Migrates and flees. Encounter 2 (Arrancar): chases a decoy body, transforms into a giant; designed as a "one-hit" spectacle kill for Isshin, or a short giant fight for others.
- **Callouts:** taunts only (no named-technique shouts in canon); wiki technique names can appear as on-screen captions.

## A8. Ayon (アヨン) — chimera Hollow born from Quimera Parca (Tres Bestias)
- **Wiki:** https://bleach.fandom.com/wiki/Ayon
- **Roster tier:** **C** — the Tres Bestias' ultimate summon and a stand-alone giant boss.
- **Canon power:** **6** — tore through four lieutenants (Rangiku, Hinamori, Hisagi, Iba), shrugged off Kidō and a hole in the chest, kept fighting after being cut in half by Yamamoto's Nadegiri; in TYBW it brutalised Quilge Opie in Vollständig and snapped his neck before Sklaverei dissolved it.
- **Body:** **7.9 m** (9.5 t), grows to **15.1 m** when enraged. Build at 16 vox/m → 126 voxels tall (242 enlarged). Silhouette: hunched gorilla torso, a long mane pouring down the back, a deer skull with antlers set in the centre of the head, digitigrade deer legs with black hooves, a long serpent tail emerging from under the mane.
- **Palette (hex estimates):**
  - Deer-skull mask bone `#F0ECE2`, antler tips `#E3DCCD`.
  - Mane dark brown `#3A281D`; arm/leg fur lighter brown `#8B6542`; torso skin dark umber `#4B3326` (?).
  - Snake tail greenish-white `#D5E2C6` with scale lines `#AFC0A0`; hooves black `#151515`.
  - Eyes: black voids `#050507` ("like looking into a bottomless hole"); mouth interior `#5A1418`.
  - Cero red `#E0262B` (?).
- **Look by form/outfit:** deer skull and antlers at the centre of the head; two large eyes under the antlers hidden by the mane until it "opens" them; an enormous mouth beneath the mane that can swallow a person whole; long dark mane to the lower back; lighter fur on arms and legs; hooves; snake tail. Body parts map to its makers: legs and mask = Apacci (deer), mane and arms = Mila Rose (lion), tail = Sung-Sun (snake). Creepy contortions: head turns 180°, arms twist backwards to punch, legs fold over its head to stand.
- **Weapons:** none — fists, mouth, tail, eye Cero.
- **Forms & states:** **Base** (7.9 m) → **El Martillo** enrage (grows to 15.1 m; can also enlarge a single arm).
- **Abilities:**
  - `Cero` from the left eye (opened from beneath the mane; engulfed Iba). [Beam] [Blast]
  - `Immense strength` — rips a chunk out of a torso, one-punch KO, breaks Kazeshini's chains, breaks a Vollständig Quincy's neck. [MeleeArc smash] [Grab/Throw]
  - `Devour` — grabs a victim and opens its giant mouth to eat them. [Grab/Throw] [Heal/Reject: self]
  - `El Martillo` (怪槌, "monster hammer") — rage growth of the whole body or a single arm. [Transform] — **NEW: runtime part scaling**
  - `Immense endurance` — ignores Kidō, a hole through the chest, being halved. [Stance]
  - `Speed for its size` — crosses big distances in a blink and strikes at once. [Mobility]
  - `Contortion` — 180° head turns, backward-twisting punches, legs-over-head stand-up. (animation set; enables attacks behind it without turning)
  - `Feigned defeat` — plays dead under Kidō to lure an attacker in. (AI behaviour)
- **Passives & weaknesses:** obeys no-one (its makers think it has no ears) yet shows concern for them; burns to nothing under Ryūjin Jakka; Quincy Sklaverei can unravel it; blind rage makes it predictable.
- **Signature moments to recreate:** *Fake Karakura* — the three Fracción tear off their left arms (anime original: red beams from their arms instead) and the mass becomes Ayon; it tears into Rangiku, KOs Hinamori, feigns defeat against Hisagi, breaks his chains, Ceros Iba from beneath its mane; a large hole opens in its chest as Yamamoto arrives; enraged, its right arm swells to colossal size — Yamamoto catches it, halves it with Nadegiri, then incinerates it. *TYBW Hueco Mundo* — summoned again, it looks back at its injured makers, roars, mauls Quilge Opie, and is broken down and absorbed by Sklaverei.
- **Kit proposal** (controllable summon for the Tres Bestias' V, or a monster playable): **Shift** leaping charge · **LMB** haymakers and backhands (huge reach) · **Hold LMB** double-fist hammer (crater) · **Q** eye Cero (hold = sweeping beam) · **E** grab & devour (heals) · **R** El Martillo arm (one arm swells for a mega punch; Blast crater) · **F** contortion counter (strikes behind itself without turning) · **Z** tail lash (snake tail sweep) · **X** feign death (next attacker gets grabbed) · **T** El Martillo full growth (7.9 → 15.1 m) · **V** rampage (berserk super-armour, 10 s).
- **AI notes:** picks targets by threat to its makers (whoever hurt the trio most); plays dead once per fight; grows at 50 % HP; enlarged arm telegraphed by a visible swelling (dodge window); fire damage ×2 (Ryūjin Jakka lore); when summoned by players it ignores manual targeting 30 % of the time (canon disobedience).
- **Callouts:** roars only; the trio shouts "Ayon!".

### Tres Bestias (3獣神) — Tier Harribel's three Fracción
Wiki: https://bleach.fandom.com/wiki/Tres_Bestias · Shared beats: in Fake Karakura they gang up on Rangiku, get caught in Hinamori's hidden Kidō net and blasted, release (which heals them), then perform **Quimera Parca** to make Ayon; after Yamamoto burns Ayon they dive at him and are downed by Ryūjin Jakka. In TYBW Hueco Mundo they slaughter Jagdarmee soldiers, lose to Quilge Opie, summon Ayon again, then hide the wounded under Sung-Sun's **Muda** — which Quilge absorbs with Sklaverei until Ichigo intervenes. Personality loop: Apacci and Mila Rose bicker constantly, Sung-Sun mocks them both as "primates"; all three are fanatically loyal to Harribel.

**Unit design (recommended, tier B as a package):** one select-screen slot; the active member is played, the other two act as AI assists (call-in on Shift+1/2/3 or swap). **Shared V — Quimera Parca (混獣神, "mixed-beast god"):** all three tear off their left arms; the arms fuse into **Ayon** (A8) which fights on its own AI for 45 s (or until killed). Afterwards all three models switch to their **one-armed** variants (left arm missing, bleeding stump wrapped) until healed — **NEW: persistent dismemberment state.** The anime-original version (red beams from the arms, arms later replaced by red auras) can be a "censored" toggle.

## A9. Emilou Apacci (エミルー・アパッチ) — Arrancar #54, Tres Bestias (deer)
- **Wiki:** https://bleach.fandom.com/wiki/Emilou_Apacci
- **Roster tier:** **C** (part of the Tres Bestias B-unit).
- **Canon power:** **5** — fought Rangiku evenly, caught her with Sonído and threw her one-handed, dispersed Haineko with Bala, blew a Jagdarmee soldier's head apart with a backhand.
- **Body:** 156 cm → **50 voxels**; 42 kg. Small, athletic tomboy; the central horn on her mask adds ~4 voxels. **Cierva:** antlers above the brow (span ≈ 60 cm), digitigrade hoofed legs, small tail.
- **Palette (hex estimates):** skin `#F2D5BF`; hair black `#141418` (manga) — **anime: dark blue `#1F2A55`**; heterochromia: right eye ice blue `#8FD3F2`, left eye amber `#E3A12F` ringed in blue `#2E7BE0` (the ring is her estigma); mask/horn bone `#F1EDE3`; uniform white with black cuffs `#17171B`; wrist collars (her sealed Zanpakutō) bone-white `#EEE8DC` (?) → chakram blades steel `#C9CED6`. Cero red `#E3262E` (from the horn); sneeze-Cero green `#56D66A`; Bala red `#E3262E`. TYBW: red legionary crest `#C42B2B`; blue lightning-bolt tattoo on the left shoulder `#2E7BE0`; black under-cloth and elbow gloves `#17171B` with bone armour plates on hands/forearms. Cierva: brown fur `#7A5130`; antlers `#D9C8A8`; hooves `#1C1A18`; both eyes amber with red outlines `#D2262B`; lightning-bolt marks on both cheeks `#D2262B` (?). Hollow (Adjuchas) form: grey skin `#8D8E90`, brown fur on the hind half `#7A5130`.
- **Look by form/outfit:** *Base:* jaw-length black hair; mask fragment on top of the head with one central horn; shoulder-length sleeves with black cuffs, V-neck; gloves and the collar-bracelets on both wrists. *TYBW (17 months later):* a red crest rises behind the horn like a Roman helmet plume; lightning tattoo on the left shoulder; chest armour over black cloth; black elbow gloves armoured on the backs of the hands and forearms. *Cierva:* brown-furred body, antlers, hooves, small tail, amber eyes with red rims, lightning marks on both cheeks. *Hollow past:* deer with a forehead horn and large antlers.
- **Weapons:** *Cierva* (碧鹿闘女, "jade deer battle-maiden") — the bracelets on her wrists; drawn, they open into **chakrams with three blades each**.
- **Forms & states:** **Sealed** → **Resurrección: Cierva** — `Tsukiagero` ("Thrust") → (V) Quimera Parca → one-armed state.
- **Abilities:** `Sonído` [Teleport] · `Cero` from the horn tip (stronger in Cierva — overpowered Tobiume's fireball) [Beam] [Blast] · `Sneeze Cero` — involuntary green Cero fired by sneezing (comic, uncontrolled direction) [Projectile] · `Bala` from the fists [Projectile: bolt, multishot] · `Hierro` — head bent a metal railing; tanked Tobiume fireballs [Stance] · `Strength` — shatters stone pillars with the side of her fist [MeleeArc smash] · `Pulsera Cuerno` (角輪, "horn bracelets") — throws the chakrams like boomerangs; they shred flesh and return [Projectile: disc, return path] · `Quimera Parca` [Summon].
- **Passives & weaknesses:** hot-headed — easily provoked (Rangiku baits her into wasting time), walks into traps (Kidō net).
- **Signature moments to recreate:** "can I take a break?" mid-fight then catching and hurling Rangiku; chakram throw blocked by Haineko; caught in Hinamori's net; release + Quimera Parca; TYBW: kills two Jagdarmee on the spot when Quilge insults Harribel.
- **Kit proposal:** *Base:* **LMB** fist/kick combos with chakram slashes · **Hold LMB** horn-charge headbutt · **Q** Pulsera Cuerno (two boomerang chakrams; hold = curve) · **E** Bala burst · **R** horn Cero · **F** sneeze Cero (random direction, big damage) · **Z** grab & hurl · **X** Sonído tackle · **T** Cierva. *Cierva:* hoof stomp GroundWave; antler ram that bursts through walls; bounding leaps (high jump); horn Cero becomes a wider beam.
- **AI notes:** rushdown aggressor; takes bait — reacts to taunts by charging straight in; first of the three to release.
- **Callouts:** "Tsukiagero, Cierva!" · "Pulsera Cuerno!" · "Quimera Parca!"

## A10. Franceska Mila Rose (フランチェスカ・ミラ・ローズ) — Arrancar #55, Tres Bestias (lioness)
- **Wiki:** https://bleach.fandom.com/wiki/Franceska_Mila_Rose
- **Roster tier:** **C** (part of the Tres Bestias B-unit).
- **Canon power:** **5** — forced Rangiku back with heavy swordplay; a single downward cut cratered Hueco Mundo sand; mowed down dozens of Jagdarmee.
- **Body:** 177 cm → **57 voxels**; 68 kg. Tall, muscular Amazon; crown adds ~3 voxels (TYBW horns ~8). **Leona:** huge lion mane down the back, armoured boots to the upper thigh.
- **Palette (hex estimates):** dark skin `#6B432E`; long thick wavy brown hair `#4A2D1E`; green eyes `#3DA65A`; mask crown and thick necklace bone `#F1EDE3`; breast/upper-arm armour and gauntlets bone `#EEE8DC`; white skirt `#F4F3EF`. TYBW: crown thickened with long bull horns; white cape `#F4F3EF` held by a purple gem `#7A3FB0`; skirt of white strips on a red belt `#B3262D` with purple clasp; gold bands on the right arm and leg `#D4A93A`. Leona: orange X on the forehead `#FF7A1A`; mane brown with gold streaks `#C99A2E`; armour bone `#EEE8DC`; sword recoloured (?) — suggest bronze-gold `#B98A3A`. Reiatsu orange-red `#FF5A1F`; Cero orange `#FF8A1F`. Hollow (Adjuchas) form: lioness, brown body `#7A4E30`, white leg armour, dark-brown back hair forming the tail `#3E2618`, golden mask and mane `#D4AF37`.
- **Look by form/outfit:** *Base:* Amazon-style armour over chest and upper arms, forearm gauntlets, short white skirt; three-part crown mask and heavy necklace; Hollow hole between navel and breasts. *TYBW:* horned crown, revealing high-collared top with white bra, white cape, strip skirt, gold brackets on right arm/leg. *Leona:* claw-shaped plates cupping the chest, armoured thong, armoured neck guard, thigh-high armoured boots, lion fangs, orange X mark, long gold-streaked mane; her sword changes size, shape and colour.
- **Weapons:** *Leona* (金獅子将, "golden lion general") — sealed western broad/longsword (~100 cm blade); released form reshapes it (details unspecified).
- **Forms & states:** **Sealed** → **Resurrección: Leona** — `Kuichirase` ("Devour" / Viz "Eat your fill") → (V) Quimera Parca → one-armed state.
- **Abilities:** `Expert swordsmanship` — heavy, driving cuts [MeleeArc cut/smash] · `Crater strike` — downward cut that craters sand [MeleeArc smash] [Blast] · `Cero` — charged in the left hand, then *punched* forward with the right [Projectile: orb] [Blast] · `Sonído` [Teleport] · `Quimera Parca` [Summon].
- **Passives & weaknesses:** brute pride (bickers with Apacci), but protective — carries the unconscious Apacci out of danger.
- **Signature moments to recreate:** heavy sword pressure on Rangiku; TYBW: cutting through Jagdarmee ranks; fleeing Quilge with Apacci over her shoulder.
- **Kit proposal:** *Base:* **LMB** broadsword chain (slow, heavy, cleaving) · **Hold LMB** overhead crater cut · **Q** Cero punch (charge in left hand, punch to fire; hold = bigger orb) · **E** shoulder charge · **R** Sonído slash · **F** troop-mower sweep (wide horizontal Slice through crowds/light walls) · **Z** carry ally (pick up a downed teammate and run) · **X** war cry (team damage buff; extrapolation) · **T** Leona. *Leona:* bigger sword reach, pouncing lunges, mane-armour super-armour on heavies.
- **AI notes:** bruiser of the trio; soaks hits for the others; prioritises the target attacking Apacci.
- **Callouts:** "Kuichirase, Leona!" · "Quimera Parca!"

## A11. Cyan Sung-Sun (シアン・スンスン) — Arrancar #56, Tres Bestias (snake)
- **Wiki:** https://bleach.fandom.com/wiki/Cyan_Sung-Sun
- **Roster tier:** **C** (part of the Tres Bestias B-unit) — the unit's support/stealth piece.
- **Canon power:** **5** — Sonído behind Rangiku; offered to fight Quilge's whole unit alone; her Muda barrier only failed to Sklaverei.
- **Body:** 154 cm → **49 voxels**; 41 kg. Slender, long hair, sleeves that hang far past her hands. **Anaconda:** lamia — human torso, from the stomach down a long slender anaconda tail (≈ 8–10 m; coils on the ground).
- **Palette (hex estimates):** skin `#F4E1D4`; long olive-green hair `#7A8C46`; lavender eyes `#B7A3DA`; three pink dots under the right eye `#FF7FB6` (+3 under the left when released); mask hair-clip spikes bone `#F1EDE3`; furry black necklace `#1A1A1E`; long white dress `#F4F3EF` with two thin criss-crossed belts `#2A2A2E` (?). TYBW: white fabric drape from the mask over the right side of head and shoulder; thigh slit; black fur hem `#1A1A1E`; high heels. Anaconda: pink release glow `#FF6FAE`; tail white scales `#EEECE4` with pale pattern `#C9C6BC` (?); mask extended into an armoured snake-head hood `#F1EDE3`; necklace thicker, feather-like. White snakes `#F2F0EA` with three pink dots behind the eyes. Cero dark pink `#D6337F`; reiatsu pink `#FF7FB6`. Hollow (Adjuchas) form: big snake, light grey `#B9BBBE`, white belly `#EEECE6`, three pink dots each side of the head, mask on top with three pearl earrings `#F3EFE6`.
- **Look by form/outfit:** *Base:* three clip-like mask spikes on the right side of her bangs; furry black collar; long-sleeved white gown, sleeves with slits, extending well beyond the hands; criss-cross belts. *TYBW:* thicker spikes connected to a cloth drape; slit dress with fur hem; heels. *Anaconda:* lamia body, extra pink dots, feathery necklace, snake-head-like armoured mask wrapping the back of the head.
- **Weapons:** *Anaconda* (白蛇姫, "white snake princess") — a sai hidden in her sleeve.
- **Forms & states:** **Sealed** → **Resurrección: Anaconda** — `Shimekorose` ("Strangle to death") → (V) Quimera Parca → one-armed state.
- **Abilities:** `Cero` — charged in the right hand, fired from the left [Beam] · `Sonído` [Teleport] · `Hidden sai` jabs from the sleeves [MeleeArc cut] · `Muda` (蛇殻砦, "snake-husk fortress") — sheds her skin into a dome that hides everything inside: optical camouflage plus a reiatsu barrier that blocks sensing (Quincy Sklaverei can absorb it) [Field: invisibility/sensory block] [Shield] [Sensing/Stealth] · `Snake manipulation` (released) — white snakes lunge from her sleeves [Summon] [Swarm] [Bind] · `Constriction` (released body) — the anaconda tail coils and crushes (implied by form/release command) [Bind] [Grab/Throw] · `Quimera Parca` [Summon].
- **Passives & weaknesses:** cool, sarcastic tactician of the trio; physically the most fragile.
- **Signature moments to recreate:** the sleeve-hidden Cero switch (charge right, fire left); TYBW: Muda dome hiding Orihime, Chad and the wounded — then Quilge drinks the barrier.
- **Kit proposal:** *Base:* **LMB** sleeve whips + sai jabs · **Hold LMB** sai lunge · **Q** Cero (right charge/left fire) · **E** Muda (team invisibility dome; enemies' lock-on and sensing fail inside; collapses after 12 s or if absorbed) · **R** Sonído behind · **F** sleeve bind (sleeves wrap a limb) · **Z** shed-skin decoy (leaves a husk as a dodge; extrapolation of Muda) · **X** Pesquisa · **T** Anaconda. *Anaconda:* slither movement (fast, can climb walls; extrapolation), **LMB** tail sweeps, **Q** constrict (Grab/Bind + squeeze DoT), **E** snake volley (white snakes as homing bite projectiles), **R** tail crush slam.
- **AI notes:** stays behind the other two, Ceros from range, casts Muda when the unit is below 40 % HP to reset aggro; first to call Quimera Parca.
- **Callouts:** "Shimekorose, Anaconda!" · "Muda." · "Quimera Parca!"

## A12. Shawlong Koufang (シャウロン・クーファン) — Arrancar #11, leader of Grimmjow's Fracción
- **Wiki:** https://bleach.fandom.com/wiki/Shawlong_Koufang
- **Roster tier:** **C** — cool-headed claw duelist; mini-boss of the first Arrancar raid.
- **Canon power:** **5** — beat a 20 %-limited Hitsugaya in Bankai, cut through Daiguren Hyōrinmaru and sliced off an ice wing; frozen and shattered the instant the limiter was lifted.
- **Body:** 190 cm → **61 voxels**; 74 kg. Tall, slim, long face; long braid draped over one shoulder; mask spike juts sideways to his right. **Tijereta:** armoured forearms and upper torso, long blade-claws (manga: longer and sharper than the anime's), claw-tipped tail mounted at the back of the head.
- **Palette (hex estimates):** skin `#EED8C4`; braid black `#141416`; grey eyes `#8D949B`; mask bone `#F1EDE3`; standard white uniform. Released armour bone with a lilac undertone `#E6E0EE` / shade `#C9C0D8` (?); claws pale steel `#D8D6DC` (?); tail bone. Reiatsu undocumented → pale lilac `#C6B6E6` (?). Adjuchas form: light-purple body `#B9A3D6` with two black lines `#141416` down the body.
- **Look by form/outfit:**
  - *Sealed:* mask on top of the head with a section dropping over the upper-left of his face and a long spike pointing right; braided hair over the shoulder; standard uniform hiding a mid-abdomen Hollow hole.
  - *Tijereta:* mask grows down into a half-helmet over the left side of the face; the right spike becomes a claw-tipped tail on the back of his head; armour on arms and chest; hands turn into long claws (five blade-fingers each — the "five-pincer" earwig).
  - *Adjuchas past (flashback):* tall skeletal humanoid in light purple with black stripes, medieval knight-helm mask with a very long claw-tipped tail sprouting from its back, chest armour, skeletal limbs with long claws. (Earlier still a Gillian with a similar mask.)
- **Weapons:** *Tijereta* (五鋏蟲, "five-pincer insect" = earwig) — sealed katana with an oval guard split by a central gap and hollow corners.
- **Forms & states:** **Sealed** → **Resurrección: Tijereta** — `Tate` ("Snip").
- **Abilities:** `Swordsmanship` — matched Hitsugaya's limited Bankai [MeleeArc cut] · `Sonído` [Teleport] · `Pesquisa` (team scan of Karakura) [Sensing] · `Tactical analysis` — read the falling ice petals behind Hitsugaya as a countdown to his Bankai collapsing [Sensing: reveals timers] · *Tijereta:* `Blade claws` — cut through Daiguren Hyōrinmaru's ice, severed an ice wing [MeleeArc cut — bonus vs Constructs] · `Enhanced speed` — a shoulder-to-hip cut on Hitsugaya before he could react [Mobility] · `Claw tail` [MeleeArc cut] [Grab/Throw].
- **Passives & weaknesses:** courteous and formal (releases "out of politeness" toward a captain); explains rules to enemies; flees once outclassed — and dies.
- **Signature moments to recreate:** the five Fracción doing Pesquisa on a Karakura rooftop; vs Hitsugaya: noticing the petal countdown, releasing Tijereta, slashing him before he can move, clipping an ice wing; his lecture on Arrancar numbering ("birth order, not strength") and the Espada; Gentei Kaijo — his arm freezes as his fellow Fracción die in an instant around the town, he runs, Hitsugaya touches him and he shatters with the ice.
- **Kit proposal:** *Sealed:* **Shift** Sonído · **LMB** precise katana forms · **Hold LMB** iai cut · **Q** Pesquisa · **E** analysis stance (shows enemy buff timers and the next attack direction; parry window doubled for 6 s) · **R** Sonído cut · **F** Cero (racial) · **Z** Bala (racial) · **X** courtesy bow (cancel into release with full HP restore once — canon: release heals) · **T** Tijereta. *Tijereta:* **Shift** blur-step (startup-less Sonído) · **LMB** five-claw rakes (long reach) · **Hold LMB** X-cross claw cut (Slice-lite that splits ice/walls/Constructs) · **Q** claw lunge (hits before the target can react — unblockable if the target is mid-animation) · **E** head-tail sting (stab/grab behind him) · **R** construct shred (cone that deletes enemy Constructs) · **F** wing/limb sever (targeted part break on summons and winged forms) · **Z** retreat Sonído (long escape) · **V** *Tijereta: Cinco Garras* — ten-claw cyclone of cuts around one target (game naming).
- **AI notes:** plays defensively while the player has a timed buff active, then releases and punishes when it ends; disengages and flees below 20 % HP or when the player's power spikes (limiter-release analogue).
- **Callouts:** "Tate, Tijereta."

## A13. Edrad Liones (エドラド・リオネス) — Arrancar #13, Grimmjow's Fracción
- **Wiki:** https://bleach.fandom.com/wiki/Edrad_Liones
- **Roster tier:** **C** — volcanic brawler; Ikkaku's duel partner.
- **Canon power:** **5** — overpowered Ikkaku's Shikai, broke his Bankai blade in the final exchange; died in a mutual knockout.
- **Body:** 200 cm → **64 voxels**; 120 kg. Huge, muscular, long black hair with the left side shaved; mask remnant is just the eye-holes resting on his nose like glasses. **Volcánica:** bulkier armoured body, gigantic arms with large extensions rising past the shoulders, each with an exhaust spout; mask reforms as small wings at the sides of the face.
- **Palette (hex estimates):** skin `#E9C9A9` (?); hair black `#121214`; shaved left side red `#B0302A`; brown eyes `#5A3A22`; mask bone `#F1EDE3`; open white jacket showing the chest hole. Volcánica: cooled-lava armour — basalt `#3E3A3A` with ember seams `#FF6A1A` (?) (hue unverified: it may instead be pale bone like most releases — check anime stills); fist flames `#FF7A1A` → `#FFD45A`; molten patches during release `#FF4E12` cooling to `#2C2626`. Reiatsu orange `#FF8C1A`. Adjuchas form: red-haired `#B0302A`, broad chest, huge shoulders, furred legs and hips.
- **Look by form/outfit:** *Sealed:* open jacket, glasses-like mask on the nose, half-shaved head. After Ikkaku's surprise right-handed cut he carries a scar across his head. *Volcánica:* the mask and sword disintegrate in a blast of fiery reiatsu that spirals into the sky; molten lava patches form on his body and cool into a heavier armoured shape; gigantic arms with shoulder-mounted vents that blast flame while he charges an attack; small mask "wings" either side of the face.
- **Weapons:** *Volcánica* (火山獣, "volcano beast") — katana with a hexagonal guard and slightly long grip; destroyed by the release.
- **Forms & states:** **Sealed** → **Resurrección: Volcánica** — `Okiro` ("Erupt" / Viz "Awaken").
- **Abilities:** `Unarmed mastery` — blocks most attacks and finds openings [MeleeArc smash] [Shield] · `Palma Plancha` (鉄甲掌, "iron-armour palm") — reiatsu packed into the hands for crushing palm strikes (knocked out Ikkaku's teeth) [MeleeArc smash] [Blast] · `Hierro` — stops blades without even sliding his arm [Shield] · `Sonído` [Teleport] · `Pesquisa` [Sensing] · `Tactical reading` — deduced Ikkaku attacks left/defends right [Sensing] · `Swordsmanship` when pressed [MeleeArc cut] · *Volcánica:* `Eruption release` — fire-reiatsu explosion and lava armour [Transform] [Blast] [Environmental: fire] · `Fire fists` — flames from the fists; punches send people flying across town [MeleeArc smash] [Status: burn] · `Vent boost` — shoulder spouts flare when charging [Stance] [Mobility].
- **Passives & weaknesses:** respects worthy foes (asks for a name too late — dies glad he asked); overconfident in Hierro; tunnel-visions on "who releases first".
- **Signature moments to recreate:** punching Ikkaku across Karakura while Keigo watches; Ikkaku's ambidextrous trick scars him; "Okiro, Volcánica" — fire tornado into the sky, lava cooling into armour; fire fists hammering Ikkaku; Ikkaku's Bankai Ryūmon Hōzukimaru with its crimson dragon dye filling; the final mid-air clash and both falling.
- **Kit proposal:** *Sealed:* **Shift** Sonído · **LMB** boxing and palm strikes · **Hold LMB** Palma Plancha (charged palm Blast) · **Q** Palma Plancha flurry · **E** Hierro catch-block · **R** read (reveals the enemy's guard side for 5 s) · **F** draw sword (switch to katana chain) · **Z** shoulder tackle · **X** Pesquisa · **T** Volcánica. *Volcánica:* **Shift** vent-jet dash (shoulder thrusters) · **LMB** burning haymakers (Burn; knock targets through buildings) · **Hold LMB** vent-boosted mega punch (Blast crater) · **Q** fire-fist barrage · **E** vent burst (heat Field around him) · **R** lava re-armour (regenerating Shield plates) · **F** meteor dive (aerial fist slam + fire) · **Z** grab & pound · **X** magma floor (sets the ground burning; Environmental) · **V** *Final Clash* — full-thrust vent punch that splits the sky and the ground (Blast + fire).
- **AI notes:** learns the player's guard habit (after three guards on one side he attacks the other); releases after taking a facial wound or 40 % HP; at low HP he stops, flares his vents and invites a final clash (duel prompt).
- **Callouts:** "Okiro, Volcánica!" · "Palma Plancha!"

## A14. Rudbornn Chelute (ルドボーン・チェルート) — Arrancar #61, founder and sole true member of the Exequias
- **Wiki:** https://bleach.fandom.com/wiki/Rudbornn_Chelute (the "Exequias" page redirects here)
- **Roster tier:** **C** — commander boss and the source of the game's best generic army, the **Calaveras** (bestiary B-15).
- **Canon power:** **5** — crossed swords briefly with Ichigo, broke Rukia's ice effortlessly, endless soldiers; beaten by Rukia freezing his branches and then swatted by a giant Yammy. (Supplementary novel: survives, later overwhelms Bambietta — novel-only.)
- **Body:** 172 cm → **55 voxels**; 60 kg. Upright, militaristic; face entirely hidden by a bull skull with outward horns. **Árbol:** his right side is wrapped in branches down to the waist, splitting into roots that flare out on both sides like a skirt; four zig-zag branches from the upper right arm with skull "fruit"; up to ten branches covering the whole upper body.
- **Palette (hex estimates):** bull-skull mask bone `#EDE8DC`, horn tips `#D9D2C2`, eye sockets void `#0C0C10`; long white jacket `#F4F3EF` with a black line `#151518` from the high collar curving to the right hip; black sash `#17171B`; white hakama; black gloves `#18181C`; sword hilt white `#F2F2F2`. **Reiatsu deep violet `#4B1F7A`** (anime). Árbol branches pale bark `#A89C88` (?) with lighter grain `#CDBFA3`; skull fruit bone `#EFEAE0`; zig-zag branch-staff same bark.
- **Look by form/outfit:** *Sealed:* bull skull mask, long jacket with the curved black line, black sash and gloves, white hakama; usually flanked by his identical skull troops. *Árbol:* tree-man silhouette — branches over the right half of the body, root skirt, lightning-bolt branches with hanging skulls, sword turned into a lightning-bolt-shaped stick; at full growth branches cover the whole torso. After Yammy's blow part of his mask is broken.
- **Weapons:** *Árbol* (髑髏樹, "skull tree") — sealed katana, longer and thinner than standard (~85 cm blade), white hilt. Released: zig-zag branch staff (~120 cm).
- **Forms & states:** **Sealed** (with a standing Calavera squad) → **Resurrección: Árbol** — `Oiagare` ("Grow") → **full growth** (4 → 10 branches).
- **Abilities:** `Swordsmanship` [MeleeArc cut] · `Sonído` — appears without warning, even behind Ichigo [Teleport] · `Strength` — breaks free of Rukia's ice [Status resist] · `Command` — the Exequias execute defeated Arrancar and wounded intruders after collecting their data, and withdraw from captain-level threats · *Árbol:* `Calaveras` (髑髏兵団, "skull army") — skulls drop from the branches and become soldiers: unlimited, durable, replicas of his outfit and sword (no tsuba), jawless human skulls with elongated incisors [Summon] [Swarm] — **NEW: infinite spawner tied to a destructible emitter** · `Calavera Wall` — soldiers lock bodies into a wall that stopped Chad's El Directo [Construct] [Shield] · `Branch growth` — 4 → 10 branches [Stance].
- **Passives & weaknesses:** **branches are the factory** — destroy or freeze them (ice/cold works best) and production stops; bitter that he never reached Espada level ("birds against a shield"); retreats from captain-class enemies; *anime:* frozen solid by Rukia's Juhaku and then smashed by Yammy.
- **Signature moments to recreate:** 1) the Exequias materialise around a defeated Dordoni and cut him down while Ichigo watches; 2) they come for the wounded Chad and Gantenbainne, then melt away when Unohana arrives; 3) in the Las Noches climax they block Ichigo's path, Ichigo's friends hold them off, Rukia freezes his sword hand, he releases Árbol and buries her in Calaveras — she freezes the branches; 4) a rampaging, giant Yammy smashes him aside (anime: after Juhaku freezes him).
- **Kit proposal:** *Sealed:* **Shift** Sonído (ambush-behind bias) · **LMB** disciplined katana chain (thrusts, executioner cuts) · **Hold LMB** "execution" overhead cleave (bonus damage on downed/stunned targets) · **Q** squad call (3 Calaveras from a Garganta) · **E** Calavera Wall (soldiers become a wall; blocks beams and projectiles) · **R** execution order (death-mark a target: all Calaveras converge) · **F** formation (squad switches spear-line / circle / wedge) · **Z** data harvest (scan a downed enemy: reveals its moves to the squad — +damage vs that character) · **X** withdraw (Sonído retreat with the squad) · **T** Árbol. *Árbol:* **LMB** branch-staff strikes · **Hold LMB** root slam (GroundWave of roots) · **Q** skull drop (3 Calaveras) · **E** Calavera Wall (bigger) · **R** grow (4 → 10 branches: spawn rate ×2.5, slower) · **F** shield-rank charge (the wall marches forward, bulldozing) · **Z** branch regrow (slow) · **X** execution order · **V** *Endless Exequias* — all branches fruit continuously for 15 s while the army forms ranks and charges · **G** Hierro · **C** violet flare.
- **AI notes:** stays behind his troops; releases once his sealed squad is wiped (canon); keeps a Calavera Wall between himself and any channelled attack; executes downed NPCs; if a captain-tier player character arrives he retreats with the Exequias (canon vs Unohana). Freezing the branches cancels spawning for 20 s.
- **Callouts:** "Oiagare, Árbol!" · "Calaveras!" · "Exequias!"

## A15. Tesra Lindocruz (テスラ・リンドクルツ) — Arrancar #50, Nnoitra Gilga's only Fracción
- **Wiki:** https://bleach.fandom.com/wiki/Tesra_Lindocruz
- **Roster tier:** **C** — bodyguard mini-boss attached to Nnoitra's fight.
- **Canon power:** **4** — stopped Chad's last-ditch attack on Nnoitra, kicked Ichigo aside, beat and crippled an exhausted Ichigo in release; cut down in one vertical slash by Kenpachi.
- **Body:** 178 cm → **57 voxels**; 65 kg. Slim, neat, lab-coat jacket. **Verruga:** a hulking warthog beast — estimate ~2.6 m tall (→ ~83 voxels) and much wider.
- **Palette (hex estimates):** skin `#F0D6BE`; dirty-blond hair `#B9A06A`; brown eye `#6B4A2E`; black eyepatch over the right eye `#121214`; turquoise estigma on the right cheek `#2EC4B6`; white lab-coat jacket with sleeves rolled to the elbow and medals across the chest (gold `#D4AF37`, silver `#C9CED6`, ribbon red `#B3262D` (?)); black gloves and boots `#141416`; mask circlet bone `#F1EDE3`. Reiatsu yellow `#F2D23C`; Cero Córnea yellow `#F2D23C` (?). Verruga: full-face bone mask with tusks `#EFE8DA`, scar over the right eye; hide grey-brown `#7A6A5A` (?); dirty-blond mane `#B9A06A`; six "!" marks on the chest `#141416` (?).
- **Look by form/outfit:** *Sealed:* mask remnant is a thin upper jaw forming a circlet around the forehead; eyepatch; lab-coat style jacket with medals; (earlier, while Nnoitra was 8th: longer hair, no eyepatch). *Verruga:* full mask with a pair of tusks, hair grown into a mane, six exclamation-mark shapes on the chest (three per pectoral), a scar on the mask over the right eye.
- **Weapons:** *Verruga* (牙鎧士, "fang-armoured warrior") — sealed falchion-like blade with a chakram ring set into it just above the hilt, spiked knuckle guard, scale-ribbed guard. `Plato Colmillo` (牙盾, "fang shield") — he can fill the ring with solid reiatsu to make a shield, then hollow it again.
- **Forms & states:** **Sealed** → **Resurrección: Verruga** — `Uchifusero` ("Crush" / Viz "Gore them").
- **Abilities:** `Cero Córnea` (視虚閃, "sight Cero") — a small Cero fired from the pupil; breaks boulders (provenance unclear — not shown in the manga plot summary; treat as anime/databook) [Beam: instant] · `Sonído` — interposes himself between his master and an attacker [Teleport] · `Swordsmanship` [MeleeArc cut] · `Plato Colmillo` ring shield [Shield] · *Verruga:* `Brute strength` — overpowers and crushes (stamped on Ichigo's leg) [MeleeArc smash] [Grab/Throw].
- **Passives & weaknesses:** devoted to Nnoitra (who scorns him); obeys cruel orders; mediocre durability (one-shot by Kenpachi).
- **Signature moments to recreate:** blocks Chad's final attack on Nnoitra; restrains Orihime during Ichigo vs Nnoitra and kicks Ichigo away; releases and beats Ichigo under orders, crushing his leg; Kenpachi stops the killing blow and slices him in half vertically; dying, he sheds a tear for Nnoitra.
- **Kit proposal:** *Sealed:* **Shift** Sonído (interpose: auto-teleports to block for a marked ally) · **LMB** falchion cuts · **Hold LMB** spiked-knuckle punch · **Q** Plato Colmillo (ring shield parry stance) · **E** Cero Córnea (instant eye beam) · **R** restrain (grab & hold a target as hostage) · **F** bodyguard mark (link to an ally; you take a share of their damage) · **Z** kick-away (big knockback) · **X** Bala (racial) · **T** Verruga. *Verruga:* **LMB** tusk gores · **Hold LMB** charge (bulldozes walls) · **Q** stomp (huge damage to downed targets) · **E** tusk toss · **R** rampage charge chain · **F** body slam · **V** *Uchifusero* — trampling charge that ends with a crushing stomp crater.
- **AI notes:** spawns as the boss's guard; intercepts the player's big attacks on the boss (shield); restrains hostage NPCs; releases when ordered (boss below 50 %) or when cornered.
- **Callouts:** "Uchifusero, Verruga!" · "Plato Colmillo!"

---

## B. Generic enemy bestiary

Sources: https://bleach.fandom.com/wiki/Hollow (Menos, Gillian, Adjuchas, Vasto Lorde, Huge Hollow, Demi-Hollow and Jigoku no Gaki all live on this page) · https://bleach.fandom.com/wiki/List_of_Hollows · individual pages linked per archetype.

### B.0 Canon rules the bestiary is built on
- Hollows are souls that lost their hearts; the lost heart becomes the **white, skull-like mask**, and the mask *is* their power — every Hollow's gimmick comes from it. The **hole** sits where the Chain of Fate was (usually mid-chest, sometimes elsewhere).
- They are driven by hunger for souls — living or dead — and prefer whoever has the **most reiryoku** nearby (Bulbous G ignored ordinary people to chase Chad; Uryū warns that Hollows go for anyone with high reiryoku).
- Many Hollows can grab with **acidic hands** (burns on contact) and some can **rip a living soul out of its body** (Acidwire, Shrieker).
- Killing blow = **split the mask/head**. A Zanpakutō **purifies** (the soul goes to Soul Society); a Quincy **annihilates** the soul; a Hollow who sinned as a human triggers the **Gates of Hell** instead.
- A cracked-but-unsplit mask temporarily reveals the human beneath (Acidwire) and **regrows** later.
- Hollows **eat each other**. Mass cannibalism creates a **Gillian**; a Gillian whose dominant Hollow keeps eating can become an **Adjuchas**, and rarely a **Vasto Lorde**. An Adjuchas that stops eating regresses; one that has *any* part of it eaten stops evolving forever — so Adjuchas fear being bitten.
- Size varies wildly: pet-sized critters in Hueco Mundo, man-sized to building-sized "Huge Hollows", towering Gillians, smaller Adjuchas, human-sized Vasto Lorde.
- Menos skills: **Cero**, **Kūmon** (tearing the sky), **Negación** (Gillian rescue beam), **Garganta** (Adjuchas+), **Sonído** (Vasto Lorde+), **High-Speed Regeneration**.

### B.1 Tiers — size, build density, HP
Reference: a lieutenant-level light hit ≈ **100** damage; a captain's Bankai super ≈ 5k–20k.

| Tier | Class | Size | Build density | HP (game) | Mask rule | Canon anchors |
|---|---|---|---|---|---|---|
| T0 | Vermin / pet-size | 0.3–1.5 m | 32 vox/m | 150–400 | any mask hit kills | pet-sized Hollows; Kukkapūro (34 cm) |
| T1 | Lesser Hollow | 2–6 m | 16–32 vox/m | 1.2k–3k | mask = ×3 crit; split = kill | Fishbone D, Bulbous G, Hexapodus, the Demi-Hollow |
| T2 | Named-class Hollow (one big gimmick) | 3–10 m (tentacles/tails longer) | 16 vox/m | 5k–9k | split = kill; crack = face reveal | Shrieker, Acidwire, Numb Chandelier, Grand Fisher, Metastacia |
| T3 | Huge Hollow / colossus | 10–35 m | 8 vox/m | 20k–40k | mask = 25 % of HP | Shin'ō Academy Huge Hollows, Cuerno, Runuganga |
| T4 | Menos: Gillian | 30–45 m (default **36 m**) | 4 vox/m (mask/hands 8) | 60k | split needs a Slice-class cut or 3 charged heavies | Gillian, unique-mask Gillian, the split "Menos Grande" (5.5 m outlier) |
| T4+ | Carrier | ~120 m | 2 vox/m (eye/nails 8) | 120k | single eye = ×5 crit | Hooleer |
| T5 | Menos: Adjuchas | 2–12 m | 16–32 vox/m | 40k–70k + regen | mask = 30 % of HP | Fracción Hollow forms, Forest of Menos guardians |
| T6 | Menos: Vasto Lorde | 1.6–2.5 m | 32 vox/m | 200k+ (multi-bar boss) | mask breakable only in final phase | pre-Arrancar Espada |
| Army | Calavera (Exequias) | 1.72 m | 32 vox/m | 600 | skull = crit | Rudbornn's soldiers |

Gillian height: the wiki gives a floor of "at least 2–6 storeys"; the Karakura and Fake Karakura panels show them dwarfing multi-storey buildings, hence a 36 m default with ±20 % per-instance variation.

### B.2 Spawn & arrival systems
1. **Garganta tear (Descorrer)** — Arrancar, Adjuchas, Exequias squads, lesser Hollows. A vertical black seam appears in mid-air, its edges crack and pull apart like a mouth/curtain into a pitch-black void with turbulent pale reishi `#CFE7FF` streaming inside; glowing eyes in the dark; the arrivals step out onto solidified reishi. Lesser Hollows tear through with a roar and drop. Size 3–8 m (Arrancar) up to "extremely large" (Hooleer). Opening inside a building slices the voxels in its plane. Closes by zipping shut. [Teleport] [Environmental] — **NEW: sky/air rift actor**
2. **Kūmon sky crack (Menos)** — the sky distorts, then cracks like glass; in Karakura the cracks converged on one point while every lesser Hollow in town gathered beneath it and stared up as if praying. White fingers with long nails pry the crack open, the long-nosed mask pushes through, then the Gillian pulls itself out and steps down (landing crater, shock ring). The crack stays as a wave spawner; repair needs a Kidō specialist (Tessai fixes the sky after the fight). Sōkyoku Hill variant: an enormous rift packed with rows of Gillian masks.
3. **Rift-wrap retreat** — a wounded Gillian grabs the edge of its Kūmon and pulls it closed around itself, vanishing (canon Karakura retreat). Use as the T4 escape at 25 % HP.
4. **Negación extraction** — a Gillian projects a **square** beam of light around an ally: the inside is cut off from this dimension (untouchable, all attacks stop at the wall) and the ally is drawn up to the Gillian/rift. Used to rescue Aizen/Gin/Tōsen, Luppi, the Karakura raiders. Game: any Arrancar boss below 15 % HP with a Gillian in range escapes unless the player kills the caster first. Colour gold `#F6E27A` (?). [Field] [Shield] [Teleport] — **NEW: extraction pillar**
5. **Ground/sand emergence** — Hueco Mundo Hollows burrow up from dunes; sand colossi rise; sinkholes drop the party into the Forest of Menos layer.
6. **Hollow Bait event** — a Quincy crushes a fingernail-sized white tablet with symbols round its rim; the dust spreads on the wind and pulls Hollows from Hueco Mundo across the whole town for 24 h (compress to a 10–15 min mission). Normally only weak Hollows answer; a scripted Gillian (sent by Aizen in canon) is the finale. Lesser Hollows keep tearing in at random points; score = purifications. [Summon: event]
7. **Demi-Hollow transformation** — a chained earthbound ghost becomes a Hollow when its Chain of Fate is broken: the body shatters into fragments and reassembles as a masked Hollow nearby (rooftop). Trigger by player error, NPC meddling (Don Kanonji), or chain-erosion timers on unpurified ghosts.
8. **Carrier disgorge** — Hooleer vomits a black liquid full of masks that separates into individual Gillians.
9. **Calavera fruiting** — skulls drop from Rudbornn's branches and unfold into soldiers; patrol squads also arrive by Garganta.
10. **Merge (evolution)** — when enough cannibal Hollows gather (or are left alive too long), they pile together and fuse into a Gillian (canon Menos genesis; the anime's Angila — many weak Hollows glowing red and fusing into a big eel-tailed Hollow — is the visual reference). [Transform] — **NEW: merge system**

### B.3 Hollow anatomy, damage & death (shared rules)
- **Mask sub-model** with its own HP and crack stages (hairline → chunks missing → split). Hits on the mask deal ×3; a **clean cut through the mask** (`MeleeArc: cut` crossing the mask volume) kills any T0–T2 instantly.
- **Face reveal:** at ≥ 30 % of mask voxels lost, the human face shows through (named Hollows get a dialogue beat; Acidwire's purification is self-inflicted with the player's sword). Unsplit masks regrow after ~20 s. (Anime: Hollows retreat to Hueco Mundo to heal and restore masks → AI "retreat to rift" option.)
- **The hole** is a true hole in the voxel mesh: projectiles and thin beams can pass through it; grabbing attacks can hook it.
- **Acidic grip:** every Hollow grab applies a burn DoT (`#7BE04F` sizzle smoke).
- **Soul extraction** (named Hollows): yanks a living NPC's soul out; the body slumps; the soul stays tethered by its Chain of Fate (a thin chain `#A8ADB5` from the chest). Cutting the chain dooms the soul (it can be pushed into an animal — Shrieker's parakeet). **NEW: body/soul NPC model**
- **Regeneration:** T1+ regrow lost limbs in 5–15 s unless the stump is burned/frozen; voxels re-grow from the stump.
- **Death outcomes (router):**
  - *Zanpakutō kill → Purification:* the body crumbles into pale reishi motes `#CFE7FF`; a translucent Plus (the human they were) appears for ~1.5 s, at peace, and drifts upward.
  - *Quincy kill → Annihilation:* the body implodes into blue-white particles `#9FD8FF` with no soul left behind.
  - *Sinner flag → Gates of Hell* (see B.6, Kushanāda event).
  - *Other (Fullbring, Kidō, Arrancar, Hollow):* dissolve into motes; if a Hollow kills it, the killer may **eat** the remains (heal + evolution points).
- **Fear of reiatsu:** a C flare at ≥ captain level makes T0–T1 cower or flee and staggers T2–T3.

### B.4 Shared Hollow AI
- **Perception = reiatsu radar.** Each actor emits "reiatsu noise" (rank × activity); C flares, releases and Bankai spike it; Sonído/stealth/suppression hide it. Hollows home on the loudest source in range — a player leaking power attracts spawns just as Ichigo did.
- **Target priority:** highest reiatsu → Pluses/souls → spiritually aware humans → ordinary humans (only when hungry).
- **Hunger loop:** eating a soul or a Hollow heals 15–30 % and adds evolution points; hungry Hollows get bolder.
- **Cannibal pressure:** wounded Hollows (< 25 %) can be eaten by stronger ones; enough eating triggers a merge (B.2-10).
- **Leaders:** Adjuchas command Gillians (focus-fire Ceros on a marked target; summon them into ambush positions — anime guardians); kill the leader and the Gillians turn mindless and easy.
- **Retreat:** many Hollows flee into a rift to regenerate; Adjuchas retreat the moment any part of them is bitten off (evolution panic).
- **Locomotion classes:** walker, wall/ceiling crawler, burrower, flyer (wings/serpentine), floater (tentacle-propped), giant (trample-carving). **NEW: surface-crawling & burrowing on destructible voxels; trample-carving for giants.**

### B.5 Archetypes (15)

#### B-01 Hueco Mundo Vermin — T0 swarm
- **Canon basis:** the Hollow page notes that some Hollows in Hueco Mundo are no bigger than pets and that small ones live off ambient reishi; Kukkapūro (https://bleach.fandom.com/wiki/Kukkap%C5%ABro) — a 34 cm puppy with a horned mask and drooping ears, white fur per the character book / light brown in the anime — is the look reference (he is technically a Números, but reads as a pet Hollow).
- **Size/HP:** 0.3–1.5 m · 150–400 HP · 32 vox/m.
- **Silhouette & mask:** small animals (dogs, lizards, crabs, carrion birds) with oversized bone masks — big round eye sockets, nub horns — and a visible hole.
- **Palette:** bodies sand `#CDBB97`, ash `#7D7A75`, soot `#16161A`; masks bone `#F1EDE3`; eye glints yellow `#F5D142`.
- **Attacks:** bite (acid burn) [MeleeArc] [Status: burn] · pounce-latch [Grab/Throw] · swarm pile-on [Swarm] · a few spit tiny red Ceros (game-only inspiration) [Projectile].
- **Spawn:** packs of 5–20 burrowing out of sand, scattering from ruins; flee if a strong C flare goes off.
- **AI:** scavengers — rush to dissolving Hollow remains to feed (heal/grow); dog-pile downed targets; a single one may "adopt" a big character and follow it around (Kukkapūro trailing Yammy) — neutral pet variant.
- **World:** gnaw through 1-voxel walls; nest in collapsed structures.
- **Weak point/death:** any mask hit; dissolve into motes.

#### B-02 Demi-Hollow (chained Jibakurei) — event → T1
- **Canon basis:** https://bleach.fandom.com/wiki/The_Demi-Hollow — an earthbound ghost chained to an abandoned hospital he coveted in life; Don Kanonji jams his cane into the half-open chest hole, the chains snap, the ghost shatters and a Hollow forms on the roof.
- **Size/HP:** 3.5 m · 1.5k HP · 32 vox/m (~112 voxels).
- **Silhouette & mask:** *ghost:* translucent young man (spiky dark hair, sideburns, long-sleeved pink T-shirt `#E58FB5`) with chains from his chest into the building. *Hollow:* lanky green biped; frog-face mask with two long pigtail-like prongs and yellow eyes; long thin arms ending in big human hands, bony forearms on ball joints ringed by two black bands; thick haunches tapering to normal feet; black bands round the thighs and a stripe up the chest disappearing under a layered purple carapace that rises behind the head; chest hole.
- **Palette:** skin `#5E8C3A`, markings `#141416`, carapace `#6B3F8C`, mask `#F1EDE3`, eyes `#F2D33A`.
- **Attacks:** `Sticker Phlegm` — adhesive spit that instantly glues two surfaces: hands to a sword hilt, feet to the floor, a door shut [Projectile] [Bind] [Status: glue] — **NEW: glue status** · leaping bite [MeleeArc] · wall-climb pounce [Mobility].
- **Spawn:** scripted transformation of a chained-ghost NPC when its chain breaks (player error, meddling NPC, or erosion timer).
- **AI:** territorial — never leaves its building; bursts up through floors under the player; crashes through walls (and briefly gets stuck in them: punish window); climbs the outer walls to the roof.
- **World:** interior fight — low ceilings snag long weapons (canon: Ichigo's sword stuck in the ceiling) → **NEW: weapon-vs-voxel collision in tight spaces**.
- **Weak point/death:** mask split → the human ghost shows for an instant, then fades (purification).

#### B-03 Lesser Hollow — T1 (three body plans)
- **Canon basis:** https://bleach.fandom.com/wiki/Bulbous_G · https://bleach.fandom.com/wiki/Fishbone_D · https://bleach.fandom.com/wiki/Hexapodus
- **Size/HP:** 2.5–6 m · 1.2k–3k HP · 16–32 vox/m.
- **Body plans:**
  - **Brute (Bulbous G):** wordless, hugely muscled biped dwarfing a 197 cm man; arms widen into cube-like fists as large as its mask; grey skin with dark S-shaped marks from the shoulders to mid-back (anime: yellow, running down to the thighs); mask like a Chinese guardian-lion face. Palette: skin `#8E9094`, marks `#3A3C40` / anime `#E3C23A`, mask `#F1EDE3`.
  - **Biter (Fishbone D):** big humanoid with a fish-like mask and a dorsal fin; shoulders and arms plated with mask material; dark grey scale-stripes over the body; neck extends several metres to bite at range. Palette: body `#3C3F45`, stripes `#23252A`, plates/fin/mask `#F1EDE3`.
  - **Hexapod (Hexapodus):** large six-legged insect; grey-green skin with orange joints and orange back spots; plain white humanoid-face mask framed by two brown hair tufts and a purple forelock hanging over it. Palette: skin `#7E8C6A`, joints/spots `#E07B2A`, tufts `#6A4A2E`, forelock `#7A4FA0`, mask `#F5F3EE`.
- **Attacks:** Brute — hammer fists that crater concrete, ground-upheaval slam [GroundWave], swing-wake that shatters glass [Blast: small], grab-and-smash [Grab/Throw] · Biter — stretch-neck bite (grabs from range) [Grab/Throw] (**Tendril**), punches that send people flying [MeleeArc smash], wall-breach charge, snatch-and-run with a civilian · Hexapod — pounce from behind, leg stabs [MeleeArc cut], wall/ceiling skitter. All grabs burn (acid).
- **Spawn:** rips through a small Garganta tear with a roar and drops to the street; Hollow Bait waves; night spawns near spiritually aware NPCs.
- **AI:** Brute charges the strongest reiatsu, ignores ordinary people, never retreats, gets *angrier* when wounded. Biter hunts Pluses, snatches hostages, crashes into houses. Hexapod stalks child souls, attacks the moment the player turns away (canon: struck at Ichigo's back while he talked).
- **World:** Brutes bulldoze walls and upend road slabs; Biters punch through house walls and shove their necks through windows; Hexapods run on façades and ceilings.
- **Weak point/death:** mask; leg/arm severs topple them (Ichigo's leg-then-mask finish on Fishbone D).

#### B-04 Winged Bomber (Shrieker-type) — T2
- **Canon basis:** https://bleach.fandom.com/wiki/Shrieker — a serial killer reborn as a Hollow; the first Hollow sent to Hell on-panel.
- **Size/HP:** 4.5 m on all fours (2–3× human height) · 7k HP · 16 vox/m.
- **Silhouette & mask:** ape-like, mostly on all fours; shaggy black fur round neck and shoulders plus two fur lines arcing to the chest centre; large black bat wings attached to the hands (retractable); long, narrow vertical mask with thick bared teeth framed by black flame-shaped markings, skull nose, big round chin, half-circle notch at the top of the forehead; tongue split into two prongs that close into a ring (a tuning fork); chest hole.
- **Palette:** hide dark slate `#4A4E5A` (?), fur `#141416`, wing membrane `#1B1A1F`, mask `#F1EDE3` with black flames `#141416`, tongue `#8E2A3A`; Targets pale grey `#D8D4CC`; leeches dark violet `#3E3550` (?); detonation green-black smoke (anime censor) `#5C7A3A`.
- **Attacks:** `Target` — little Hollow-like creatures secreted from his body (painless, semi-conscious) that swarm and pin victims [Summon] [Swarm] [Bind] · `Spouting` — Targets spit leeches that stick to whatever they hit [Projectile: sticky] · `Tuning Fork Bomb` — vibrating his ring-tongue detonates every leech remotely, even leeches still inside living or dead Targets [Blast: remote trigger] — **NEW: attachable projectiles + remote detonation** · flight to hover just out of reach [Mobility: wings] · one-hand pin to a wall [Grab/Throw] · soul extraction (caged a boy's soul in a parakeet) [Status] · staged "accidents" — drops I-beams, launches motorbikes, causes car pile-ups [Environmental: physics traps].
- **Spawn:** lairs in abandoned factories/rooftops; ceiling-drop ambush.
- **AI:** sadist and coward — feigns defeat, then releases Targets; grabs a hostage (child NPC/Plus) to freeze the player; flies away from anyone strong enough to hurt him; begs when cornered; severs his own limb to escape a pin.
- **World:** crawls walls and ceilings; drops heavy props from height; leech mines on walls blow out masonry.
- **Weak point/death:** **rip out the tongue** (canon) → no more detonations; mask split → **Gates of Hell** (sinner flag, B.6).

#### B-05 Serpent Flyer (Acidwire-type) — T2
- **Canon basis:** https://bleach.fandom.com/wiki/Sora_Inoue (Acidwire) — Orihime's brother turned Hollow; regains himself when his mask cracks and purifies himself with Ichigo's blade.
- **Size/HP:** 3 m torso + 9 m tail · 6k HP · 16 vox/m.
- **Silhouette & mask:** nāga — muscular humanoid torso on a long serpent tail; shoulder-length black hair; skull-like mask with narrow yellow eyes, a human face underneath; flies sinuously like a Chinese dragon.
- **Palette:** body dark brown `#4A3022`; arms deep red `#8E1E22`; black saw-blade stripe from the small of the back down the tail `#121214`; tail tip black; hair `#141416`; eyes `#F2D33A`; mask `#F1EDE3`.
- **Attacks:** `Tail Shaker` — whip strikes that smash people through walls into the road below [MeleeArc smash] (**Tendril**) · armoured tail scales (resist cuts until a charged attack) [Shield] · `Vitriol Shot` — long-range acid spit; burns the hand → **drops the weapon** [Projectile] [Status: acid, disarm] · crushing grip [Grab/Throw] · soul extraction [Status] · bite to devour a soul.
- **Spawn:** comes at night through a bedroom window; circles rooftops in the air.
- **AI:** obsession-driven — locks on to one "beloved" NPC and attacks anyone near them; talks; if the mask cracks, a story beat can end the fight peacefully (self-purification).
- **World:** coils round pillars and crushes them; tail sweeps flatten walls; acid eats small voxel holes [Environmental: decay].
- **Weak point/death:** mask; severed arms/tail regrow unless the mask breaks first.

#### B-06 Puppeteer (Numb Chandelier-type) — T2
- **Canon basis:** https://bleach.fandom.com/wiki/Numb_Chandelier — drawn by Hollow Bait; made Karakura High students attack each other; first victim of Orihime's powers.
- **Size/HP:** mask/body ~3 m; twelve tentacles each 12–15 m (props herself between buildings) · 5k HP · 16 vox/m (tentacles as Tendrils).
- **Silhouette & mask:** a floating jellyfish-octopus — twelve long lavender tentacles; jellyfish-dome mask with six tentacle-like appendages hanging under it and three rings of knobbly protrusions on top (the knobs are her seeds); heart-shaped eye holes; long lipless teeth; the hole sits above the mask where the tentacles meet.
- **Palette:** tentacles `#B79BD9` with darker underside `#8E74B5` (?); mask `#F1EDE3`; heart-hole interiors `#E0507A` (?); seeds `#E6E2D2` (?).
- **Attacks:** `Bulb Scatter` — fires the seed knobs: a person struck is possessed starting from the hit limb, spreading to the whole body; a seed in the head = total control [Projectile: multishot] [Status: mind control] — **NEW: possession of civilians/allies** · seeds as explosive missiles [Projectile: explode] · tentacle caress/grab [Grab/Throw].
- **Spawn:** Hollow Bait events; perches straddling two buildings over a schoolyard.
- **AI:** never fights directly — turns civilians (or ally NPCs, or co-op players) into puppets that brawl for her, uses friends against friends; flies into a rage and spams seeds if she is ever hurt.
- **World:** tentacles bridge streets (cuttable to drop her); puppets smash windows and doors; seed volleys pock walls.
- **Counterplay/death:** knock puppets out or pop the seed (precise hit); severing the mask appendages stops seed production; cut her in half or split the mask.

#### B-07 Lurer (Grand Fisher-type) — T2 mini-boss
- **Canon basis:** https://bleach.fandom.com/wiki/Grand_Fisher (full detail in dossier A7).
- **Size/HP:** body 5–6 m (16 vox/m), lure 1.2–1.6 m (32 vox/m) · 8k HP split across body + lure.
- **Silhouette & mask:** hidden, round, furry predator with red bird-like claws; an anglerfish stalk from the forehead ending in a human-looking puppet; tentacles from holes under the eyes.
- **Palette variants:** ivory `#CFC8BD`, moss `#5F7F3E`, dusk brown `#5C4636` fur; claws `#C3262C`; stalk `#B23040`.
- **Attacks:** lure decoy that copies a person the target cares about [Summon] [Sensing/Stealth] (**NEW: disguise/mimic**) · finger-needle memory read [Status] · eye tentacles [Grab/Throw] · fur Oppression [Bind] (**Tendril**) · Migration body swap [Teleport] · regrow limbs [Heal/Reject].
- **Spawn:** riverbanks, cemeteries, rainy nights; the lure stands alone looking lost.
- **AI:** the lure wanders toward spiritually aware characters; the body stays buried or behind buildings until the target reaches the lure; then tentacle ambush. Uses the copied loved one as a shield (its own punches pass through the lure). Flees by Migration at 25 %.
- **World:** burrows under streets (sinkholes), drags victims underground.
- **Weak point/death:** must kill both bodies; Pesquisa/sensing reveals the lure's Hollow nature (outline).

#### B-08 Possessor (Metastacia-type) — T2 elite
- **Canon basis:** https://bleach.fandom.com/wiki/Metastacia — Aizen's experiment that killed Miyako Shiba's squad and possessed Kaien. Variants: the anime-filler **Tapeworm Hollow** (https://bleach.fandom.com/wiki/Tapeworm_Hollow) and Aizen's **White** (https://bleach.fandom.com/wiki/White) as a flashback boss.
- **Size/HP:** 4.5 m · 9k HP · 16 vox/m.
- **Silhouette & mask:** six-limbed crawler with a big flame-patterned mask and a sheaf of tentacles on its back.
- **Palette:** body grey-green `#6E7F5E` (?), mask `#F1EDE3` with orange flames `#E86A1E` and black outlines `#141416`, back tentacles `#2E3A2A` (?). Possessed victim recolour: skin `#7C8C6A`, sclera black `#050507`, orange flame blotches round the eyes `#E86A1E`.
- **Attacks:** `Zanpakutō Destruction` — touching its back tentacles shatters the weapon instantly (once per night/encounter) → the victim loses weapon moves until it re-manifests [Status: weapon break] — **NEW** · `Spirit Body Fusion` — fires tentacles into a body; they burrow in, the victim's look changes and the Hollow's own body crumbles; canon says it's permanent [Status: mind control] [Transform] · six-limb rush and tentacle lashes [MeleeArc] (**Tendril**).
- **Spawn:** infiltration events (night barracks, patrol routes in Seireitei).
- **AI:** picks off stragglers; after fusing, it fights with the victim's kit and the HUD keeps showing an ally tag until it reveals itself; taunts friends of the victim.
- **World:** sneaks through ceilings/floorboards; bodies left in dark rooms.
- **Weak point/death:** fused host must be killed (canon: Rukia ends Kaien) — design a heavy story choice, or a rare "separation" item as a game-only mercy; it flees to Hueco Mundo on death in canon (Aaroniero later eats it).
- **Variants:** *Tapeworm (anime):* skeletal worm with a two-faced skull mask, hides inside humans (unsensable while inside), stretches the host's nails/arms. *White (flashback boss):* almost entirely black body, white mask like Ichigo's Hollow mask, long white hair, two forward horns, bladed forearms, red filled-in hole; purple Cero, extreme speed, grows stronger and smarter with every Shinigami it eats, Hollowfication venom bite, can merge into a soul; when badly hurt the matter in its hole swells and **self-destructs** — palette body `#0E0E12`, mask `#F4F2EE`, hair `#F2F2F2`, hole `#B3121C`, Cero `#9B4FD6`.

#### B-09 Huge Hollow (Cuerno-type brute) — T3
- **Canon basis:** the Hollow page's *Huge Hollows* — building-sized Hollows that terrify academy students but die to a single captain's stroke (Shin'ō Academy flashback); visual template **Cuerno** (https://bleach.fandom.com/wiki/Cuerno), the Hollow Ichigo purifies after regaining his nerve post-Yammy: large green muscular body, horn-shaped mask, thick blade claws ("burrowing-claw Hollow" in the Chinese game localisation), huge tail, sharp chin, **two mouths, one inside the other**.
- **Size/HP:** 12–25 m · 20k–35k HP · 8 vox/m.
- **Palette:** skin `#4F7A3A`, shadow `#2F4A24`, claws `#E9E3D6`, mask `#F1EDE3`, inner mouths `#7A1A22`.
- **Attacks:** blade-claw swipes that gouge concrete [MeleeArc cut] · burrow-dive with the claws and resurface under the target [Mobility] [Blast] · tail sweep [MeleeArc smash] · inner-mouth lunge — the second mouth shoots out to bite and drag [Grab/Throw] (**Tendril**) · stomp [GroundWave] · grab-and-throw cars or wall chunks [Grab/Throw].
- **Spawn:** sky tears over training grounds or districts, 2–4 at a time.
- **AI:** slow pursuit; prefers weak/young NPCs (students); flinches from captain-level reiatsu flares.
- **World:** walks *through* houses (trample carve), tears roofs off, digs trenches.
- **Weak point/death:** mask (25 % of HP); one captain-class heavy can split it — perfect "show off the captain" fodder.

#### B-10 Sand Colossus (Runuganga-type) — T3/T4 environmental boss
- **Canon basis:** https://bleach.fandom.com/wiki/Runuganga — the "Guardian of the White Sands" outside Las Noches (anime adds a second sand giant, Battikaroa, inside Las Noches).
- **Size/HP:** 30–40 m · 30k HP per body (unlimited bodies while sand remains) · 4–8 vox/m — the body **is** world sand.
- **Silhouette & mask:** grey sand giant, long arms with forearms much thicker than the upper arms, head shaped like a sand castle with crenellations, chest hole, low-slung waist cloth, decorated bracelets on both wrists; jaw unhinges to swallow a whole group.
- **Palette:** dry sand `#B8B2A6`, damp shadow `#8C8579`, castle-head highlights `#D6D0C2`, cloth `#6E5A44` (?), bracelets `#C9A24A` (?), eye/mouth voids `#141416`.
- **Attacks:** sinkhole pits that funnel everyone to the centre (and, in the anime, down into the Forest of Menos) [Field: gravity/pull] [Environmental] · multiple sand tornadoes [Environmental: weather] [Projectile] · sand-fist slams [Blast] · jaw swallow [Grab/Throw] · reforms from any dune — physical and Kidō hits just rebuild [Heal/Reject: restores voxels] · many bodies — killing one doesn't kill "him" [Summon].
- **Weakness:** **water and ice** — wet or frozen sand can't regenerate (Rukia's Hakuren killed it in one move); fire turns sand to glass? (game-only idea: vitrified sand also stops regen).
- **Spawn:** rises from the dunes guarding the approach to Las Noches.
- **AI:** blocks the path, opens pits under the party, swallows clusters; reforms wherever it is destroyed until frozen/soaked.
- **World:** it is terrain — reshapes dunes, opens chasms. **NEW: granular sand material** (flows, slumps, can be re-absorbed).

#### B-11 Gillian (Menos Grande) — T4 giant
- **Canon basis:** Gillian section of https://bleach.fandom.com/wiki/Hollow · Karakura fight: https://bleach.fandom.com/wiki/Ichigo_Kurosaki_%26_Ury%C5%AB_Ishida_vs._The_Menos_Grande · https://bleach.fandom.com/wiki/Negaci%C3%B3n · https://bleach.fandom.com/wiki/K%C5%ABmon
- **Size/HP:** default 36 m (±20 %) · 60k HP · 4 vox/m body (≈ 144 voxels tall), mask and hands at 8 vox/m.
- **Silhouette & mask:** a towering black cloak from head to feet; white mask with a long, pointed nose; a collar of thin white spikes round the neck; big pointed feet wrapped in white bandages; large white hands with long nails, usually hidden inside the cloak; a very long tongue. All Gillians look the same (mass-produced foot soldiers).
- **Palette:** cloak `#121216` with blue-violet sheen `#1E1F2B`; mask `#F1EDE3`; eye holes/mouth `#060609`; neck spikes `#F3F1EA`; foot bandages `#E6E1D6` with creases `#BDB6A8`; hands/nails `#F1EDE3`; tongue `#5E1A24` (?); Cero crimson `#E0262B` / core `#FFD6D6`; Negación gold `#F6E27A` (?).
- **Attacks:** `Cero` from the mouth — long, telegraphed charge (its reiatsu visibly swells; Rukia's "it's going to fire!" cue), straight beam that bores tunnels through whole blocks; can be held and swept [Beam] [Blast] · `Tongue skewer` — whips out to impale and reel prey into the mouth; it eats lesser Hollows to heal and can crack a Hollow mask [Grab/Throw] [Heal/Reject] (**Tendril**) · kick/stomp — kicked Ichigo away after he cut its ankle [Blast] [GroundWave] · cloak sweep (debris wave) · pain roar shockwave [Blast] · `Negación` (rescue pillar, B.2-4) · `Kūmon` (open/close sky rifts, B.2-2/3).
- **Spawn:** Kūmon sky crack; single Gillian finales (Hollow Bait), packs of 3–30 in war events, a wall of masks in a giant rift (Sōkyoku Hill).
- **AI:** slow and mindless when alone — targets the strongest reiatsu, eats nearby Hollows to heal; **obeys an Adjuchas** if one is present (focus-fire Ceros on its marked target); casts Negación on bosses below 15 %; at 25 % HP grabs its rift and wraps it round itself to escape.
- **World:** legs carve paths through buildings (trample capsule), Cero leaves 3–6 m tunnels in a line, a falling Gillian flattens a block.
- **Weak point/death:** mask split; ankles are the reachable stagger points; a single head-to-toe Slice (Ichigo's first Menos) is the iconic finisher.
- **Variants:**
  - *Unique-mask Gillian (elite):* one dominant Hollow controls the composite, shown by a one-off mask; smarter (dodges, uses cover) and can evolve into an Adjuchas if it keeps eating.
  - *The split "Menos Grande" (Uryū's ambush, https://bleach.fandom.com/wiki/The_Menos_Grande):* only 5.5 m / 400 kg; light-grey body; skull mask broken at the lower left exposing a pale human mouth and chin; very long dangling tongue; pointed hood; two-layer fleshy mantle over the shoulders; bulbous upper arms, slender forearms, human hands; huge chest hole. Its lower half is a **separate spinning-top Hollow** with its own eyes, mouth and small hole. `Predation` (tongue thrust that shatters pavement and drags prey to the mouth) [Grab/Throw], fast regeneration (regrew an arm in seconds — useless if hit before healing), the halves split up to flank. Palette body `#B9BBBE`, mantle shade `#8E9094`, mouth/chin `#E9D7C8`.

#### B-12 Carrier (Hooleer-type) — T4+ event giant
- **Canon basis:** https://bleach.fandom.com/wiki/Hooleer — Aizen's colossal Hollow, Wonderweiss's favourite; lurked behind the Gillians during the Sōkyoku escape; in Fake Karakura it blew out Yamamoto's fire prison and vomited Gillians on Wonderweiss's scream; Mashiro killed it with one kick.
- **Size/HP:** ~120 m (it dwarfs everyone and Gillians come out of its mouth) · 120k HP (eye ×5) · 2 vox/m body, eye and nails 8 vox/m.
- **Silhouette & mask:** a bulbous mass with long tufts of hair down its back (same colour as its skin); one huge eye; **its fingernails are Gillian masks**.
- **Palette:** skin/hair ash violet-grey `#7E7686` (?); eye **purple `#8C3FD6` inside the Garganta, yellow `#F2D33A` outside**; nail masks `#F1EDE3`; disgorged mass black `#0A0A0E` studded with masks.
- **Attacks:** `Regüeldo` — a breath that "smells of death": cone that extinguishes fires and dispels Fields/prisons [Field] [Environmental: extinguish] · `Menos Generation` — spits a black liquid mass of masks that separates into 3–8 Gillians per cycle [Summon] · nail-mask swipes [MeleeArc smash] · `Kūmon` [Environmental].
- **Spawn:** only through a colossal Garganta (scripted); usually with Wonderweiss.
- **AI:** looms behind the battlefield; obeys Wonderweiss's Vagido (disgorge on command); breathes on any big fire or barrier.
- **World:** its bulk shears the skyline when it moves; breath cone deletes fire voxels.
- **Weak point/death:** the eye. Canon-accurate "one big kick" kill is allowed for Hollowfied/captain-class heavies on the eye.

#### B-13 Adjuchas — T5 elite hunters
- **Canon basis:** Adjuchas section of https://bleach.fandom.com/wiki/Hollow; Hollow forms described on the Tres Bestias, Shawlong and Edrad pages; anime-only Forest of Menos guardians: https://bleach.fandom.com/wiki/Guardians_of_the_Forest_of_Menos
- **Shared rules:** smaller than Gillians, far rarer, much smarter and stronger; usually solitary; often lead Gillians into battle; Cero + Garganta; regenerate; must keep eating or regress; if any piece of them is eaten they stop evolving — so they disengage when bitten. Size 2–12 m · 40k–70k HP · 16–32 vox/m · mask = 30 % of HP.
- **Templates (canon forms):**

| Template | Source | Look | Signature behaviour |
|---|---|---|---|
| Feline stalker | Grimmjow's past (roster E2) | panther-like, lean | pounce-and-vanish, Cero from the mouth |
| Antlered charger | Apacci's past | deer with a forehead horn and big antlers; grey skin `#8D8E90`, brown fur on the hind half `#7A5130` | antler rams through walls, horn Cero |
| Lioness | Mila Rose's past | brown body `#7A4E30`, white armour on four legs, dark-brown back hair running into the tail `#3E2618`, golden mask and mane `#D4AF37` | pride leader, pounces, sword-like claws |
| Great serpent | Sung-Sun's past | huge snake, light grey `#B9BBBE`, white belly `#EEECE6`, three pink dots `#FF7FB6` each side of the head, mask on top with three pearl earrings | constriction, sand-swimming |
| Knight mantis | Shawlong's past | tall skeletal light-purple body `#B9A3D6` with two black lines, medieval knight-helm mask with a very long claw-tipped tail from its back, chest armour, skeletal limbs with long claws | tail strikes from range, claw duelling |
| Red brute | Edrad's past | red mane `#B0302A`, massive chest and shoulders, furred hips and legs | charges, ground slams |
| Turtle warlord *(anime)* | Teres Holcan | purplish body, snapping-turtle skull mask with two red lines `#C22B2B`, shell on the back from which the tail grows, body wrap at the waist, hole on the left chest | tail whips; tail **burrows and fires spines up from below the ground**; extra limbs stretch from the back; mouth Cero; commands Gillians |
| Ape commander *(anime)* | Aromazon | greenish body, chest/arms far bigger than legs, walks on its arms with legs dangling, gorilla mask, hole with two small vents above it | rapid-fire punches, high-speed hops, summons Gillians into ambush and orders Ceros |
| Spike lancer *(anime)* | Becunes | extremely tall and lithe grey-green, shoulders rising above the head, long pig-eared mask with a bulbous chin, tooth-spikes on shoulders and hips | arms sharpen into lances, shoulder spikes extend; reads and **erases reiatsu traces** to set Gillian ambushes |
| Rat duelist *(anime)* | Parateraul | humanoid rat, pale-brown skin, long jackal/anteater-snout mask with slit eyes glowing yellow, two knobbed antennae, samurai-helmet back; dark hands with white wrist armour, armoured shins, two-toed feet, long segmented tail | fast martial arts, palm Cero, hostage bait, rallies Gillians — they turn mindless when he falls |

- **AI:** solitary hunters that test the player and withdraw when hurt; with Gillians present they become commanders (mark target → Gillian Cero volleys; summon Gillians to flank); set traps with hostages or erased trails; flee instantly if the player "bites" (devour-type attacks) a piece off them.
- **World:** leap across rooftops, carve with claws, tunnel with tails.
- **Weak point/death:** mask; killing the commander drops all linked Gillians into mindless mode.

#### B-14 Vasto Lorde — T6 boss
- **Canon basis:** Vasto Lorde section of https://bleach.fandom.com/wiki/Hollow — the highest Menos, so rare their number in Hueco Mundo fits on two hands, individually above a Gotei captain, roughly human in size and shape; signature Cero and Sonído; most Espada were Vasto Lorde (supplementary sources: Baraggan, Harribel, Ulquiorra, Nel, Grimmjow, Szayelaporro). Nobody knows how one is made — Shawlong's group ate three thousand Hollows without getting there.
- **Size/HP:** 1.6–2.5 m · 200k+ HP over 3 bars · 32 vox/m.
- **Silhouette & mask:** human-sized, full unbroken mask, bone armour plates over a dark body; minimal and elegant — the threat is the stillness. Use each Espada's Resurrección silhouette as its "natural" Vasto Lorde form (cross-reference rosters E1/E2).
- **Palette:** bone `#F1EDE3` over void-dark `#0B0B10`; Cero colour unique per individual.
- **Attacks:** instant, uncharged Ceros and Cero barrages [Beam] [Projectile] · Sonído chains with afterimages [Teleport] [Afterimage/Clone] · constant reiatsu pressure — weaker NPCs kneel or faint, lesser Hollows flee [Field: weight/fear] · regeneration [Heal/Reject] · one unique power derived from the matching Espada's release (e.g. decay, smoke wolves, water/blades).
- **Spawn:** story/endgame only — Hueco Mundo deep desert, never from Hollow Bait.
- **AI:** ignores weak opponents until provoked; duels, reads patterns, punishes greed; leaves through a Garganta rather than be cornered.
- **World:** few but enormous actions — Ceros carve canyons, Sonído departures crack the ground.

#### B-15 Calavera (Exequias trooper) — army unit
- **Canon basis:** dossier A14 / https://bleach.fandom.com/wiki/Rudbornn_Chelute
- **Size/HP:** 172 cm → 55 voxels · 600 HP each ("durable"), unlimited supply while Rudbornn's branches stand.
- **Look:** exact copies of Rudbornn's uniform (white long jacket with the black collar-to-hip line, black sash, white hakama, black gloves) and of his long thin katana *without a tsuba*; the head is a common human skull with long incisors and **no jaw**.
- **Palette:** skull `#EDE8DC`, sockets `#0C0C10`, uniform `#F4F3EF` / line `#151518`, gloves `#18181C`, blade `#D9DEE6`.
- **Attacks:** disciplined katana drills [MeleeArc cut] · spear-line and encirclement formations · `Calavera Wall` — bodies lock into a living wall that stopped Chad's El Directo [Construct] [Shield] · execution strikes on downed targets.
- **Spawn:** skull fruit from Árbol branches; Garganta patrols in Las Noches; scripted "clean-up" after Privaron bosses.
- **AI:** squads of 6–12; shield the commander; finish wounded enemies first ("collect data, then kill survivors"); spread out after seeing the same big attack three times; withdraw when a captain-tier character arrives.
- **World:** the Wall acts as destructible cover; squads march over rubble without breaking formation.
- **Death:** skull shatters → body dissolves into reishi.

### B.6 Event entities & expansion enemies (outside the 15)
- **Gates of Hell / Kushanāda** (https://bleach.fandom.com/wiki/Kushan%C4%81da) — Hell's guardians: huge beings on all fours with elongated skull heads and a big armour plate on the right shoulder; they pass through solid structures inside Hell, shrugged off Zabimaru + Hakuren + Licht Wind together, and eat the damned (who revive later). **Event:** when a sinner Hollow is purified, a massive, ornate two-door gate erupts from the ground behind it; the doors crack open on a red-black void; a Kushanāda's giant blade thrusts out, impales the Hollow and drags it inside; the doors slam and the gate crumbles to dust (exact gate ornamentation: check the manga's Shrieker chapter / anime ep. 4 before modelling). The blade damages anything in its path (stand clear). [Summon: scripted] [Slice] [Grab/Throw]. Palette: gate stone `#2A2426`, ornament bone `#D9D2C2` (?), interior `#3A0A0E` → `#000000`, chains `#6B6E74` (?).
- **Jigoku no Gaki** (Hell Hollows, Hollow page) — massive Hollows native to Hell; varied shapes unified by **huge rings** sticking out of or forming parts of their bodies and **thick chain patterns** on the skin; very strong; they emit **no reiatsu**, so sensing/Pesquisa can't see them and lock-on assist fails until visual contact — ideal for a Hell expansion. **NEW: zero-signature stealth class**.
- **Bawabawa** (https://bleach.fandom.com/wiki/Bawabawa) — neutral giant sand-worm "pet" of Nel's brothers, actually one of Dondochakka's spiritual combat insects: eyeless, horned plate mask, big pink lips `#E58FA5` and teeth, smooth hard back `#8E7F68` (?), paler segmented belly `#CDBF9F` (?); lives on sand and won't follow into Las Noches. Use as a **ridable sand-swimming mount** across Hueco Mundo (cries when left out of team poses).
- **Kukkapūro** — pet-companion variant of B-01 (follows the strongest nearby character).

### B.7 Set-piece encounters (canon-driven)
1. **Kurosaki Clinic, night one** — Fishbone D (B-03 Biter) smashes through the kitchen wall and snatches Yuzu; tutorial for mask kills.
2. **Hollow Bait challenge** — Uryū crushes the bait; Hollows tear in all over Karakura; Puppeteer at the high school (B-06), Brute at the field (B-03); the sky cracks converge, every Hollow gathers and "prays", the Gillian emerges, tongue-eats the crowd, kicks the hero, fires its Cero, gets split head-to-toe and wraps its rift around itself to flee.
3. **Live ghost-hunt broadcast** — Don Kanonji's show at the abandoned hospital: Demi-Hollow transformation (B-02) and an indoor fight with glue spit.
4. **Parakeet hunt** — Shrieker (B-04): staged accidents, Target swarms, leech bombs, tongue rip, Gates of Hell.
5. **Rainy riverbank / grave** — Grand Fisher (A7 / B-07).
6. **Sōkyoku Hill extraction** — Negación pillars lift Aizen, Gin and Tōsen into a sky rift full of Gillian masks, with Hooleer's eye in the dark.
7. **Forest of Menos** (anime arc) — Runuganga's sinkhole drops the party into the quartz forest; Adjuchas guardians command Gillian Cero ambushes; escape through a cliff fissure.
8. **Exequias clean-up** — after each Privaron boss the Calaveras arrive to execute the loser; optional "protect the defeated boss" objective.
9. **Fake Karakura second wave** — colossal Garganta, Hooleer disgorges Gillians, Visored brawl; Wonderweiss boss (A1).
10. **Naruki City flashback** — Isshin vs White (B-08 variant), ending with White's self-destruct.

### B.8 Hueco Mundo biome notes for enemies
- **Desert surface:** endless white sand, permanent night, crescent moon; Hollows burrow and ambush; sand colossi guard the approaches to Las Noches.
- **Forest of Menos** (https://bleach.fandom.com/wiki/Forest_of_Menos): a layer *under* the desert full of huge trees of silvery quartz `#D7DEE6` / `#AEB8C4` whose tops poke out of the dunes above; where ordinary Hollows hide from Arrancar; countless Gillians wander under orders of the Adjuchas guardians (Aizen's men); lesser Hollows bow when an Arrancar passes. (Kubo cut it from the manga for time; the anime used it.) Quartz trees should shatter into glassy voxels.

---

## C. Engine features needed beyond the brief's primitive list

Collected from every **NEW:** tag above, ordered by how many entries depend on them.

1. **Tendril (segmented extendable limb)** — a physics chain of voxel segments that can whip, thrust, grab, bind, carry, be steered in flight and be **severed** segment by segment. Needed by: Luppi's tentacles, Wonderweiss's Centurion arms, Cirucci's whip-disc (steerable, homing), Grand Fisher's fur/eye tentacles/lure stalk, Gillian and split-Menos tongues, Fishbone-type necks, Numb Chandelier's tentacles, Metastacia's back tentacles, Acidwire/Sung-Sun/Ayon tails, Teres Holcan's burrowing tail, Cuerno's inner mouth.
2. **Giant actors** — coarse build densities (2–8 vox/m), trample-carving locomotion (legs/body delete voxels along their path), long tunnel-boring beams, LOD and camera framing for 15–120 m bodies, ankle/hand hit zones reachable from the ground.
3. **Sky/air rift actors** — Garganta tears (plane-cut voxels where they open), Kūmon sky cracks on the skybox that act as wave spawners, the Gillian "rift-wrap" retreat, the **Negación extraction pillar** (square column; occupant untargetable and lifted away), and a "sky repair" interaction.
4. **Mask weak-point system** — per-part HP with crack stages, ×3 crit zone, split-detection for `cut` arcs, face reveal under broken masks, timed mask regrowth.
5. **Death-outcome router** — purification (reishi motes + fading Plus), Quincy annihilation, and the scripted **Gates of Hell** event with the Kushanāda blade; Arrancar decomposition.
6. **Reiatsu-noise perception** — every actor emits a signature (rank × activity); Hollow AI hunts the loudest; C flares/releases attract spawns; Sonído and suppression hide it; Jigoku no Gaki emit nothing (zero-signature class that defeats lock-on assist).
7. **Surface crawling & burrowing** on destructible voxels (Hexapods, Demi-Hollow, Shrieker, Lurers, Huge Hollow claw-digging, sand-swimmers, Sung-Sun's lamia form).
8. **Granular sand material** — flows, slumps into sinkholes, can be absorbed and re-formed (Runuganga), swum through (Bawabawa); freezes/wets into a non-regenerating state.
9. **Element tags on abilities and world voxels** — fire/ice/water/sand; drives Wonderweiss's *element seal* (disable all fire moves, absorb burning voxels, stored-fire death blast), Hooleer's extinguishing breath, Runuganga's water/ice weakness, freeze-to-disable on Rudbornn's branches and Luppi's tentacles, Ayon's fire vulnerability.
10. **Body/soul NPC model** — civilians and Pluses with a visible Chain of Fate; soul extraction, soul-in-animal, possession and puppeting (Numb Chandelier seeds, Metastacia fusion, Tapeworm), puppets that attack friends, and a fake ally tag until reveal.
11. **Disguise/mimic** — Grand Fisher's lure copies a character from the target's bond list (memory read); Metastacia wears its victim (recolour + kit borrow).
12. **Persistent model states** — dismemberment that survives the fight (Tres Bestias one-armed after Quimera Parca, Cirucci's irreversible amputation), scars (Edrad), Corpse Unit stitches; "irreversible transform" flag on releases.
13. **Runtime part scaling** — Ayon's El Martillo (one arm or the whole body grows), Grand Fisher's giant transformation.
14. **Emitter-bound infinite spawners + formation AI** — Calaveras from Árbol's branches (Calavera Wall as live cover), Gillians from Hooleer's mouth, Targets from Shrieker's fur; destroying/freezing the emitter stops the flow.
15. **Merge/evolution system** — cannibal Hollows feed, pile up and fuse into a Gillian; unique-mask Gillians can become Adjuchas; bitten Adjuchas flee.
16. **New statuses** — *glue* (Sticker Phlegm), *weapon break* (Metastacia), *disarm* (Vitriol Shot), *element seal* (Wonderweiss), *attached charge + remote detonation* (Shrieker's leeches), *time-loop/rewind* (Corpse Unit postcognition — later/supplementary material, optional).
17. **Frequency clash rule** — vibrating blades carry a frequency value; the higher one cuts through (Cirucci's wings vs Seele Schneider).
18. **Weapon-vs-voxel collision in tight interiors** — long blades snag on low ceilings (Demi-Hollow hospital fight).
19. **Multi-actor sacrifice summon** — Quimera Parca needs all three Tres Bestias alive and costs each an arm.
20. **Physics-prop traps** — Hollows weaponise I-beams, vehicles and traffic (Shrieker's "accidents").

## D. Gaps, uncertainties and things I couldn't find
- **Colours not stated anywhere in the text** (marked `(?)` above): Hooleer's skin, Grand Fisher's Hollow fur and lure, Edrad's Volcánica armour hue, Cirucci's dress/gloves, Luppi's tentacles, Shawlong's released armour/claws, Rudbornn's branches, Ayon's torso skin and Cero, the Gillian tongue, the Negación beam colour, Tesra's released hide; reiatsu colours of Wonderweiss, Luppi, Dordoni, Shawlong. Anime notes that *are* sourced: Apacci's hair is dark blue in the anime; Rudbornn's reiatsu is deep violet; Bulbous G's marks are yellow; Kukkapūro is light brown in the anime.
- **Unknown release commands:** Wonderweiss (Extinguir) and Gantenbainne (Dragra); Grand Fisher's Resurrección (if any) was never shown.
- **Sizes without canon numbers:** Gillian (only "at least 2–6 storeys"), Grand Fisher's Hollow and transformed forms, Hooleer, Runuganga, Kushanāda, Bawabawa — all values above are proposals.
- **Provenance flags:** the Corpse Unit postcognition drug is listed on the wiki without a source tag and appears to come from later supplementary material (novel/game tie-in) — verify before shipping it; Tesra's Cero Córnea doesn't appear in the manga plot summary (likely anime/databook); the Forest of Menos guardians, Battikaroa, the Tapeworm Hollow and Angila are anime-only; Cuerno's name comes only from the video game *Rebirth of Souls*; the Shrieker Togabito return and Kushanāda's "Skull-Clad" are movie-tie-in material (not used).
- **Off-panel results:** Wonderweiss vs Kensei's Bankai ends in an explosion; the wiki implies Wonderweiss won.
- **Thin canon kits:** Sung-Sun's released abilities beyond snake summoning (constriction is inferred from the form and command), Mila Rose's released sword (changes size/shape/colour, unspecified), Luppi's sealed-form Cero/Bala (never shown), the Tres Bestias' released fights (brief in the manga, longer in the anime).
- **Vasto Lorde forms** of individual Espada are mostly supplementary material — the generic B-14 entry should be specialised from the E1/E2 Espada dossiers.
