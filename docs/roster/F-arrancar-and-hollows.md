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
  build density (16 or 8 voxels/m) and scaled up in engine.
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

<!-- CONTINUE -->
