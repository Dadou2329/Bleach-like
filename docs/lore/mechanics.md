# Shared mechanics — Kidō, racial techniques & power rules

> **What this is:** the cross-character design reference for *Bleach-like* (Three.js, detailed voxels, fully
> destructible world). It covers the systems many characters share: the full **Kidō** library, the
> **racial technique layers** (Shinigami, Hollow/Arrancar, Visored, Quincy, Fullbringer touch-points), and the
> **power-scaling rules** (Reiatsu pressure, Hierro/Blut thresholds, release multipliers).
> Character dossiers reference this file instead of re-describing shared moves.
> Everything here is written for *fun and canon-faithfulness*, not balance.

- Source: Bleach Wiki (bleach.fandom.com) pages listed in [§6 Sources](#6-sources), read via cleaned dumps in
  `wiki/J1/` plus ~150 extra spell/technique pages fetched for this doc. Text is paraphrased; incantations are
  **not** reproduced (only "short / medium / long" is noted).
- Where the wiki was silent and a value/visual had to be proposed, it is marked **(proposal)**; where canon is
  unclear it is marked **(uncertain)** or **(verify)**.

## Contents

0. [Conventions used in this file](#0-conventions-used-in-this-file)
1. [Kidō](#1-kidō)
   - [1.1 Fundamentals](#11-fundamentals) · [1.2 Incantation rules](#12-incantation-rules-canon) ·
     [1.3 Chant gameplay](#13-gameplay-the-chant-system) · [1.4 Skill tiers](#14-kidō-skill-tiers-roster) ·
     [1.5 Shared implementation](#15-shared-kidō-implementation-rules) · [1.6 Index](#16-kidō-index-all-known-spells)
   - [1.7 Hadō](#17-hadō-catalogue-way-of-destruction) · [1.8 Bakudō](#18-bakudō-catalogue-way-of-binding) ·
     [1.9 Barriers & seals](#19-barriers--seals-kekkai--fū) · [1.10 Uncategorized / forbidden / ritual](#110-uncategorized-forbidden--ritual-kidō) ·
     [1.11 Kaidō](#111-kaidō-healing-kidō) · [1.12 Other media](#112-other-media-only-kidō) · [1.13 Combos & interactions](#113-kidō-combos-chains--interactions)
2. [Race kits / universal layers](#2-race-kits--universal-layers)
   - [2.0 Cross-race comparison](#20-cross-race-comparison) · [2.1 Shinigami](#21-shinigami) ·
     [2.2 Hollow & Arrancar](#22-hollow--arrancar) · [2.3 Visored / Hollowfication](#23-visored--hollowfication) ·
     [2.4 Quincy](#24-quincy) · [2.5 Fullbringers](#25-fullbringers-touch-points) · [2.6 Hybrids](#26-hybrids--cross-race-access)
3. [Power-scaling rules](#3-power-scaling-rules-fun-not-balance)
4. [Engine features required](#4-engine-features-required-checklist)
5. [Gaps & uncertain points](#5-gaps--uncertain-points)
6. [Sources](#6-sources)

---

## 0. Conventions used in this file

### 0.1 Canon flags

| Flag | Meaning |
|---|---|
| *(none)* | Manga canon (and its faithful anime adaptation). |
| **(A)** | Anime-only (filler arcs, anime originals, incl. TYBW anime additions where flagged). |
| **(N)** | Light-novel only (Ryōgo Narita's *Can't Fear Your Own World* / *Spirits Are Forever With You*, etc.). |
| **(Mv)** | Movie only. **(G)** Game only. |

### 0.2 Engine primitive tags

Tags use the brief's vocabulary with parameters, e.g. `Projectile(orb, explode)`, `Beam(thin, bore)`,
`Bind(rods)`, `Shield(wall, tier≤89)`. Every Kidō entry ends with an **Impl** line: how it is built from those
primitives and how it touches the destructible voxel world.

### 0.3 Scale reminders (from the brief)

- Characters: **32 voxels / m** (174 cm ≈ 56 voxels). World: **0.25 m voxels** (4 per metre).
- Lore hook used throughout: **voxels are Reishi** in Soul Society and Hueco Mundo. The Human World is mostly
  **Kishi** (ordinary matter) — this distinction matters for Quincy absorption (§2.4.1) and Fullbring (§2.5).

### 0.4 World material tags (proposal — needed by several rules below)

| Material tag | Where | Rules |
|---|---|---|
| `reishi` | Default for everything in Soul Society, Hueco Mundo (sand, rock, Las Noches walls), Wahrwelt | Destructible; absorbable by Quincy (Letzt Stil / Vollständig / Seele Schneider). |
| `kishi` | Human World buildings, roads, objects | Destructible; **not** absorbable by Quincy; Fullbringers can "pull its soul". |
| `kishi.nature` | Human World trees, grass, parks, rivers | Holds free Reishi → slow Quincy absorption allowed. |
| `sekkiseki` | Seireitei outer wall (Seireiheki), Senzaikyū cells, Sekkiseki pits | Repels/negates Reiryoku: energy attacks deal ×0.1 to it; not absorbable; drains Reiryoku of anyone standing inside a Sekkiseki enclosure; its Shakonmaku dome vaporises low-density Reishi passing through (blocks Shunpo/teleport *into* Seireitei unless dense enough). |
| `construct.kido` | Voxels spawned by Kidō (pillars, cubes, walls) | Owned by caster; HP ∝ caster power; **erodes** over time (§1.1); absorbable by Sklaverei. |
| `construct.other` | Ice, bone, blade forests etc. from Zanpakutō/Resurrección | Per-ability rules. |
| `void` | Garganta interior, Dangai walls | Not walkable without Reishi footholds; Dangai walls carry the Kōryū current (grabs whoever touches). |

### 0.5 Structure Damage Class (SDC) — canon-anchored destruction scale (proposal)

Used to size every destructive effect in world voxels (0.25 m).

| SDC | Canon anchor examples | Default radius / extent | Voxel handling |
|---|---|---|---|
| 0 | Normal sword swing on stone | scuffs, ≤ 0.5 m | Chip voxels, sparks. |
| 1 | Shakkahō from a lieutenant, Bala, Tesshō | ~1–2 m | Carve, small debris. |
| 2 | Average Cero, Raikōhō, Mashiro Drop Kick crater | ~3–6 m | Crater + building-wall breach, debris physics. |
| 3 | Zangerin ("level a building"), Hadō #88, Senju Kōten Taihō | ~8–20 m | Collapse whole structures (connectivity check), heavy debris. |
| 4 | Ittō Kasō (all buildings nearby), Cero Oscuras (half the Las Noches dome), Gran Rey Cero (could wreck Las Noches) | ~25–60 m | Chunked macro-destruction: delete big chunks, spawn fewer large debris + dust. |
| 5 | Top-tier Bankai, Yhwach's arrow craters at scale, full-chant Kurohitsugi space distortion | 60–250 m | Macro + scripted collapse, terrain deformation. |
| 6 | World-level events (scripted only) | map | Set-piece. |

---

## 1. Kidō

### 1.1 Fundamentals

- **What it is.** Kidō (鬼道, "Demon/Spirit Way"; Viz *Demon Arts*) is one of the four Shinigami combat arts
  (*Zankensoki*: **Zan** sword, **Ken** fist, **Sō** movement, **Ki** Kidō). Spells are powered by Reiryoku and
  are normally triggered by an incantation; skilled users can drop the chant at a cost in power.
- **Categories.**
  - **Hadō** (破道, Way of Destruction) — direct attack spells. **Gisei Hadō** (犠牲破道) are sacrificial
    Hadō that consume part of the caster's body (Ittō Kasō).
  - **Bakudō** (縛道, Way of Binding) — everything else: binds, shields, repulsion, sensing, communication,
    escape, sealing. Includes **barriers** (結界 *kekkai*: solid Reiryoku shapes; can block, contain, attack,
    mask Reiatsu, even make people invisible) and **seals** (封 *fū*: stronger, need long preparation, used on
    dangerous beings/artifacts).
  - **Kaidō** (回道, Turn Way) — healing Kidō with no names/numbers/chants (§1.11).
  - **Forbidden Kidō** — space/time manipulation and self-sacrifice spells; illegal in Soul Society. A spell
    reclassified as forbidden **loses its number** (Kubo Q&A).
- **Numbers.** Spells are ranked 1–99; higher = stronger and harder. Many numbers are unrevealed; two
  Bakudō share #9 (Geki/Hōrin, anime) and #99 is a two-part spell (Kin / Bankin).
- **User power dominates.** The same low-number spell is devastating from a strong caster. → Kidō damage scales
  with the caster's Reiatsu Level (§3.1), not just the spell number.
- **Practical tweaks.** Spells can be modified (Renji's dim Shakkahō as a torch; Urahara's *Kaizō Kidō*
  "modified Kidō" Jūgeki Byakurai). Masters create/alter spells.
- **Erosion.** No Kidō lasts forever: constructs and barriers decay over time, and time-acceleration (Baraggan's
  Respira) dissolves them almost instantly. → `construct.kido` voxels lose HP over time and crumble to Reishi dust.
- **Noble barriers.** Barriers made by noble blood are said to be unbreakable by those of lower status → barrier
  rule: attacks from a lower-status/lower-RL source deal ×0 to a noble's barrier (fun rule, Kuchiki/Shihōin).
- **Surprise weapon.** Kidō works best when unseen (AI note: Kidō masters open with no-chant casts from stealth).
- **Name-only casting.** A spell can be fired with just its name (no number, no chant).
- **Kidō Corps** (鬼道衆) — secret Kidō specialist branch (masked white hoods, eyes only). Officially opens the
  **Senkaimon** and releases the **Sōkyoku** seal. Ranks: Commander & Grand Kidō Chief (Tessai, ~100 yrs ago),
  Vice-Chief (Hachigen).
- **Typical reach (Kubo Q&A):** an ordinary unseated Shinigami graduates able to cast spells up to the **30s**.

### 1.2 Incantation rules (canon)

| Mode | Japanese | What it does | Canon examples |
|---|---|---|---|
| **Full incantation** | — | Recite the spell's chant (often several seconds) → full power. | Aizen's chanted Kurohitsugi (space-time distorting version); Isane chanting Kakushitsuijaku and Tenteikūra. |
| **Eishōhaki** | 詠唱破棄 "incantation abandonment" | Skip the chant: much faster, **much weaker**; in unskilled hands it can misfire and **explode in the caster's face**. Masters still get great results. | Aizen's chantless Kurohitsugi at only ~⅓ power; Byakuya's chantless Byakurai/Rikujōkōrō/Dankū. |
| **Nijū Eishō** | 二重詠唱 "twofold incantation" | Interleave the chants of **two different spells** → both ready in less total time, and the enemy can't tell what is coming. | Rukia vs. Aaroniero: chanted bind + blast together (Bakudō #61 then Hadō #73). |
| **Kōjutsu Eishō** | 後述詠唱 "spoken-after incantation" | Cast first, recite the chant **afterwards** to power up the spell already in play. | Hachigen reinforcing Ryūbi no Jōmon against Baraggan. |

Kubo's difficulty ranking (easiest → hardest): **full chant → Nijū Eishō → Eishōhaki → Kōjutsu Eishō**.

### 1.3 Gameplay: the chant system

**Core rule: tap = Eishōhaki (instant, weaker), hold = chant (slower, full power).** Works on any Kidō slot
(Q/E/R/F/Z/X) and on the Tab wheel.

1. **Verses.** Each spell's chant is split into *verses* (VO line + floating glyph ring around the caster's hands).
   Verse count comes from the incantation length class noted in every catalogue entry:

   | Chant class | Canon length | Verses | Time @0.7 s/verse |
   |---|---|---|---|
   | short | ≤ 20 words | 2 | 1.4 s |
   | medium | 21–35 words | 3 | 2.1 s |
   | long | 36–60 words | 4–5 | 2.8–3.5 s |
   | very long | > 60 words (Senju Kōten Taihō) | 7 | 4.9 s |
   | unrevealed | canon chant unknown | by number: #1–29 → 2, #30–59 → 3, #60–79 → 4, #80–99 → 5 | — |

   For **unrevealed** chants the VO is a low murmur with no subtitle (never invent canon text).
2. **Power factor.** Releasing the key fires the spell at the factor reached:
   `ChantFactor = lerp(f_skip, 1.0, versesDone / versesTotal)`; a full, uninterrupted chant gets **×1.1**
   ("clean chant" bonus). `f_skip = clamp(M_tier − 0.5 × n/99, 0.2, 1.0)` where `n` = spell number (use 50 for
   unnumbered) and `M_tier` = 0.85 Master / 0.70 Expert / 0.55 Practitioner / 0.40 Novice.
   → A Master's chantless #90 lands at ~0.4 (canon: Aizen's ⅓ Kurohitsugi); a Master's chantless #4 is ~0.83.
3. **Misfire.** Eishōhaki above the caster's comfort cap risks backfire: `p = clamp((n − cap)/40, 0, 0.75)`,
   cap = 10 Novice / 30 Practitioner / 60 Expert / 99 Master. Backfire = small `Blast` on the caster + stagger.
4. **Chant caps (can't cast at all above):** Novice/unseated 39, Practitioner 69, Expert 89, Master 99.
   Forbidden spells need a story flag regardless of tier.
5. **Moving while chanting.** Walk at 60 % speed; guard allowed; Shunpo/Sonído/Hirenkyaku cancels the chant
   except for Masters (who keep the verse count). A hit that staggers the caster interrupts: Practitioners
   lose the spell, Experts/Masters may fire immediately at the current factor.
6. **Telegraph.** The glyph ring is visible to enemies (AI reads it and dodges/shields) — chantless casts have no
   tell, which is why Eishōhaki is the surprise tool.
7. **Nijū Eishō (Experts+).** Hold spell A, then press spell B during the chant (or pick a "pair" on the Tab
   wheel). Total time = `max(T_A, T_B) + 0.3 s`; **both** fire at full factor in the chosen order (typical: bind
   → blast). The glyph ring shows scrambled mixed glyphs so enemies/AI cannot predict either spell.
8. **Kōjutsu Eishō (Masters).** After an instant (Eishōhaki) cast of a *persistent* spell (barrier, bind, field,
   construct), hold the same key within 5 s to chant afterwards: each verse raises the live effect's HP/duration/
   strength until it reaches **×1.2** of a normal full chant.
9. **Callouts.** On release the caster shouts the spell name; formal casters prefix the number:
   *"Hadō no sanjūichi — Shakkahō!"*, *"Bakudō no rokujūichi — Rikujōkōrō!"* Number readings:

   | n | reading | n | reading | n | reading | n | reading |
   |---|---|---|---|---|---|---|---|
   | 1 | ichi | 21 | nijūichi | 57 | gojūnana | 78 | nanajūhachi |
   | 4 | yon | 26 | nijūroku | 58 | gojūhachi | 79 | nanajūkyū |
   | 8 | hachi | 30 | sanjū | 61 | rokujūichi | 81 | hachijūichi |
   | 9 | kyū | 31 | sanjūichi | 62 | rokujūni | 88 | hachijūhachi |
   | 11 | jūichi | 32 | sanjūni | 63 | rokujūsan | 90 | kyūjū |
   | 12 | jūni | 33 | sanjūsan | 73 | nanajūsan | 91 | kyūjūichi |
   | — | — | 37 | sanjūnana | 75 | nanajūgo | 96 | kyūjūroku |
   | — | — | 39 | sanjūkyū | 77 | nanajūnana | 99 | kyūjūkyū |
   | — | — | 54 | gojūyon | — | — | — | — |

10. **Kidō power formula (starting point, tune freely):**
    `KidōPower = Base(n) × 2^((RL − 16)/2) × ChantFactor × FormMult`, with `Base(n) = 10 × 1.04^n`
    (unnumbered: by the spell's described scale). `FormMult` = 1.5 while a Visored wears the mask (Hachigen's
    masked Bakudō decapitated Gillians), 1.0 otherwise. Blast radius in metres ≈ `0.25 × √KidōPower`
    (lieutenant Shakkahō ≈ 1.5 m; Tessai's #88 ≈ 7 m + beam).

### 1.4 Kidō skill tiers (roster)

From the wiki's tier lists (manga unless flagged). Use these to set `M_tier`, caps and Nijū/Kōjutsu unlocks.

| Tier | Characters |
|---|---|
| **Master** (high spells chantless, rapid chains, can invent/modify spells; Kōjutsu Eishō allowed) | Sousuke Aizen, Byakuya Kuchiki, Shinji Hirako, Yoruichi Shihōin, Ichibe'e Hyōsube, Tenjirō Kirinji, Rōjūrō Ōtoribashi, Tessai Tsukabishi, Jūshirō Ukitake, Retsu Unohana, Kisuke Urahara, Hachigen Ushōda, Genryūsai Shigekuni Yamamoto · other media: Shūsuke Amagai (A), Ōko Yushima (A), Sōya Azashiro (N) |
| **Expert** (mid spells chantless, chant for high ones; most lieutenants/captains; Nijū Eishō allowed) | Yumichika Ayasegawa, Momo Hinamori, Shūhei Hisagi, Tōshirō Hitsugaya, Tetsuzaemon Iba, Nanao Ise, Izuru Kira, Isane Kotetsu, Kiyone Kotetsu, Ginrei Kuchiki, Rukia Kuchiki, Mayuri Kurotsuchi, Shunsui Kyōraku, Rangiku Matsumoto, Chōjirō Sasakibe, Kaien Shiba, Kūkaku Shiba, Isshin Kurosaki, Suì-Fēng, Kaname Tōsen, Yasochika Iemura · other media: Maki Ichinose, Ryūsei Kenzaki, Kōga Kuchiki (A), Tokinada Tsunayashiro (N), Ran'Tao (A) |
| **Practitioner** (low–mid chantless, struggles with high spells) | Gin Ichimaru, Hanatarō Yamada, Harunobu Ogidō, Hiyosu, Marechiyo Ōmaeda, Ōetsu Nimaiya, Renji Abarai · other media: Ashido Kanō, Kagerōza Inaba, Nozomi Kujō (A) |
| **Novice** (proposal) | Unseated members, Ichigo Kurosaki (never shown casting Kidō successfully), Kenpachi Zaraki (no Kidō). |

### 1.5 Shared Kidō implementation rules

- **Spell tier for blocking.** Every projectile/beam carries a `kidoTier` (= spell number; non-Kidō attacks get an
  equivalent from their power: Shikai special ≈ 60–80, Bankai special ≈ 90–110, Gran Rey Cero ≈ 95). Shields
  compare tiers (Dankū stops ≤ 89).
- **Binds.** `Bind` = movement + action lock with a **break meter**. Break speed ∝ `2^(ΔRL)` where ΔRL =
  target RL − caster RL; a Transform (mask, release) mid-bind grants an instant break roll (Hollowfied Kensei
  snapping Sajō Sabaku). Raw strength never breaks "Reiatsu-only" binds (Sajō Sabaku) — only RL or transforms.
- **Pins need surfaces.** Spells that pin (Shitotsu Sansen, Hyapporankan, Gochūtekkan) embed into world voxels;
  destroying the pinning voxels frees the target early.
- **Constructs.** Kidō constructs are `construct.kido` voxels: they collide, block, can be climbed, take damage,
  erode, and can be **absorbed by Quincy Sklaverei** (Kidō is Reishi).
- **Barriers vs. world.** Barrier planes do not delete world voxels they overlap; nothing (characters,
  projectiles, debris) passes through them until broken.
- **Light & fire.** Fire spells ignite `flammable` voxels (wood, paper screens, tatami, cloth, trees); lightning
  chains through `conductive` voxels (metal, water).
- **Callout + glyph.** Every Kidō shows a brief kanji/number glyph at the hand on release (readability).

### 1.6 Kidō index (all known spells)

IDs are stable handles for dossiers and data files (`kido.H31`, `kido.B61`, …). "Chant" = whether a canon
incantation exists and how long it is (text deliberately not reproduced).

**Hadō (destruction)**

| ID | No. | Name | Kanji | Meaning | Chant | Canon | Main tags |
|---|---|---|---|---|---|---|---|
| H01 | 1 | Shō | 衝 | Thrust | unrevealed | | `Projectile(push)` |
| H04 | 4 | Byakurai | 白雷 | Pale Lightning | unrevealed | | `Beam(thin, pierce)` |
| H11 | 11 | Tsuzuri Raiden | 綴雷電 | Bound Lightning | unrevealed | | `Status(shock)` `Environmental(electrify)` |
| H12 | 12 | Fushibi | 伏火 | Ambush Flare | unrevealed | | `Field(trap)` `Blast` |
| H31 | 31 | Shakkahō | 赤火砲 | Red Fire Cannon | medium | | `Projectile(orb, explode)` |
| H32 | 32 | Ōkasen | 黄火閃 | Yellow Fire Flash | unrevealed | | `Projectile(crescent, slice)` |
| H33 | 33 | Sōkatsui | 蒼火墜 | Blue Fire, Crash Down | long | | `Beam(wave)` |
| H54 | 54 | Haien | 廃炎 | Abolishing Flames | unrevealed | | `Projectile(bolt, disintegrate)` |
| H57 | 57 | Daichi Ten'yō | 大地転踊 | Upturned Earth Dance | unrevealed | TYBW (verify manga) | `Grab/Throw(telekinesis)` |
| H58 | 58 | Tenran | 闐嵐 | Vigorous Tempest | unrevealed | | `Projectile(tornado)` |
| H63 | 63 | Raikōhō | 雷吼炮 | Thunder Roar Sear | medium | | `Beam(lightning)` `Blast` |
| H73 | 73 | Sōren Sōkatsui | 双蓮蒼火墜 | Twin Lotus Blue Fire, Crash Down | long | | `Beam(twin)` `Blast` |
| H78 | 78 | Zangerin | 斬華輪 | Cutting Flower Ring | unrevealed | | `Blast(ring)` |
| H88 | 88 | Hiryū Gekizoku Shinten Raihō | 飛竜撃賊震天雷炮 | Flying-Dragon-Striking, Heaven-Shaking Thunder Cannon | unrevealed | | `Beam(huge, bore)` `Blast` |
| H90 | 90 | Kurohitsugi | 黒棺 | Black Coffin | long | | `Construct` `Bind` `Field(gravity)` |
| H91 | 91 | Senju Kōten Taihō | 千手皎天汰炮 | Thousand-Hand Bright-Heaven Cannon | very long | | `Projectile(×10, homing)` `Blast` |
| H96 | 96 | Ittō Kasō | 一刀火葬 | Single-Blade Cremation | unrevealed | forbidden (sacrificial) | `Blast(pillar)` `Status(self limb loss)` |
| H99 | 99 | Goryūtenmetsu | 五龍転滅 | Five Dragons' Annihilation | unrevealed | (N: forbidden) | `Summon(5 dragons)` `GroundWave` |
| HX1 | — | Gaki Rekkō | 牙気裂光 | Raging Light Fang | unrevealed | (A) | `Projectile(cage multishot)` |
| HX2 | — | Hyōga Seiran | 氷河晴嵐 | Glacier Vapor Storm | unrevealed | (A) | `GroundWave(ice)` `Environmental(freeze)` |
| HX3 | — | Kongōbaku | 金剛爆 | Adamantine Blast | unrevealed | (A) | `Projectile(orb, explode)` |
| HX4 | — | Jūgeki Byakurai (Kaizō Kidō) | 重撃白雷 | Heavy-Strike Pale Lightning (modified) | unrevealed | | `Beam(thin, long, pierce)` |
| HX5 | — | Mushikuidama | 虫喰玉 | Worm-Eaten Ball | unrevealed | | `Projectile(orb, tunnel)` |
| HX6 | — | Ura Hadō: Sannodō — Teppūsatsu | 裏破道・三の道・鉄風殺 | Hidden Destruction, 3rd Path: Iron Wind Murder | unrevealed | | `Beam(wind)` shield-breaker |

**Bakudō (binding / support)**

| ID | No. | Name | Kanji | Meaning | Chant | Canon | Main tags |
|---|---|---|---|---|---|---|---|
| B01 | 1 | Sai | 塞 | Restrain | unrevealed | | `Bind(arms)` |
| B04 | 4 | Hainawa | 這縄 | Crawling Rope | unrevealed | | `Bind(rope)` |
| B08 | 8 | Seki | 斥 | Repulse | unrevealed | | `Shield` `Reflect` |
| B09a | 9 | Geki | 撃 | Strike | short (shared w/ Hōrin) | (A; manga shows chant only) | `Status(paralysis)` |
| B09b | 9 | Hōrin | 崩輪 | Disintegrating Circle | short (shared w/ Geki) | (A) | `Bind(tendril)` |
| B21 | 21 | Sekienton | 赤煙遁 | Red Smoke Escape | unrevealed | | `Field(smoke)` `Stealth` |
| B26 | 26 | Kyokkō | 曲光 | Bent Light | unrevealed | | `Stealth(invisible)` |
| B30 | 30 | Shitotsu Sansen | 嘴突三閃 | Beak-Thrust Triple Flash | unrevealed | | `Projectile(×3)` `Bind(pin)` |
| B37 | 37 | Tsuriboshi | 吊星 | Suspending Star | unrevealed | | `Construct(net)` `Mobility` |
| B39 | 39 | Enkōsen | 円閘扇 | Round Lock Fan | unrevealed | | `Shield(disc)` |
| B58 | 58 | Kakushitsuijaku | 摑趾追雀 | Footprint-Seizing Pursuing Sparrows | medium | | `Sensing(locate)` |
| B61 | 61 | Rikujōkōrō | 六杖光牢 | Six-Rod Light Prison | short | | `Bind(6 rods)` |
| B62 | 62 | Hyapporankan | 百歩欄干 | Hundred-Step Balustrade | unrevealed | | `Projectile(×100 rods)` `Bind(pin)` |
| B63 | 63 | Sajō Sabaku | 鎖条鎖縛 | Locking Bondage Stripes | unrevealed | | `Bind(chains)` |
| B73 | 73 | Tōzanshō | 倒山晶 | Inverted Mountain Crystal | unrevealed | | `Shield(pyramid)` `Construct` |
| B75 | 75 | Gochūtekkan | 五柱鉄貫 | Five-Pillar Iron Penetration | short | | `Construct(pillars)` `Bind` |
| B77 | 77 | Tenteikūra | 天挺空羅 | Heavenly Rickshaw in Silken Air | long | | `Sensing(broadcast)` |
| B79 | 79 | Kuyō Shibari | 九曜縛 | Binding of the Nine Luminaries | unrevealed | | `Bind(9 nodes)` |
| B81 | 81 | Dankū | 斷空 | Splitting Void | unrevealed | | `Shield(wall, tier≤89)` |
| B99a | 99 (pt 1) | Kin | 禁 | Prohibition | unrevealed | | `Bind(heavy)` |
| B99b | 99 (pt 2) | Bankin | 卍禁 | Full Prohibition | 3 short stage calls | | `Bind` `Construct(cube)` `Blast` |
| BX1 | — | Hakufuku | 白伏 | White Crawl | unrevealed | | `Status(confuse→KO)` |
| BX2 | — | Inemuri | 威眠 | Forced Slumber | unrevealed | | `Status(sleep)` |
| BX3 | — | Tanma Otoshi | タンマ落とし | Time-Out Drop | unrevealed | | `Status(KO)` |
| BX4 | — | Shibireyubi | しびれ指 | Numbing Finger | unrevealed | | `Status(paralysis)` |

**Barriers & seals (numbers unknown)**

| ID | Name | Kanji | Meaning | Chant | Canon | Main tags |
|---|---|---|---|---|---|---|
| KS01 | El Escudo | エル・エスクド | "The Shield" (Sp.) | unrevealed | | `Shield` |
| KS02 | Millón Escudo | ミジョン・エスクド | "Million Shields" (Sp.) | unrevealed | | `Shield(auto)` `Redirect` |
| KS03 | Fūsatsu Kakei | 封殺火刑 | Seal-Slaying Fire Penance | unrevealed | | `Status(vent seal → self-burn)` |
| KS04 | Kyūjūrokkei Kakafūmetsu | 九十六京火架封滅 | 96-Capital Fire-Frame Sealing Annihilation | unrevealed | | `Status(delayed seal)` `Bind` |
| KS05 | Goyōgai | 五養蓋 | Five-Support Cover | unrevealed | | `Status(stasis)` |
| KS06 | Hachigyō Sōgai | 八爻双崖 | Eight-Line Twin Cliffs | unrevealed | | `Field(imperceptible zone)` `Stealth` |
| KS07 | Ryūbi no Jōmon | 竜尾の城門 | Dragon-Tail Castle Gate | medium | | `Construct(gate)` `Shield` |
| KS08 | Kokō no Jōmon | 虎咬の城門 | Tiger-Bite Castle Gate | unrevealed | | `Shield(fang ports)` |
| KS09 | Kigai no Jōmon | 亀鎧の城門 | Turtle-Armor Castle Gate | unrevealed | | `Shield(honeycomb)` |
| KS10 | Hōyoku no Jōmon | 鳳翼の城門 | Phoenix-Wing Castle Gate | unrevealed | | `Construct` `Shield` |
| KS11 | Shijū Saimon | 四獣塞門 | Four-Beast Blockade Gate | (combo) | | `Construct(prison)` `Field(containment)` |
| KS12 | Hako Okuri | 匣遺 | Farewell Box | unrevealed | | `Teleport(object)` |
| KS13 | Roppō Fūjin | 六方封陣 | Six-Direction Seal Array | unrevealed | | `Bind(cross seal)` |
| KS14 | Standing Ovation | スタンディング・オベーション | — | unrevealed | | `Construct(head boxes)` `Status(execute)` |
| KS15 | Hakudan Keppeki | 白断結壁 | White-Severing Boundary Wall | unrevealed | (A, TYBW — verify) | `Shield(anti-Quincy)` |
| KS16 | Kyōmon | 鏡門 | Mirror Gate | unrevealed | | `Shield(doorway)` |
| KS17 | Shisō Keppū | 四槍血封 | Four-Spear Blood Seal | long | (A) | `Bind` `Construct(coffin)` |
| KS18 | Unnamed barriers | — | domes, pyramids, Kidō nets | — | | `Shield` / `Construct` |

**Uncategorized, forbidden & ritual**

| ID | Name | Kanji | Meaning | Chant | Canon | Main tags |
|---|---|---|---|---|---|---|
| KU01 | Chocolate Bar Slider | チョコレート・バー・スライダー | — | unrevealed | | `Projectile(blocks, multiply)` |
| KU02 | Hanki | 反鬼 | Reverse Demon | unrevealed | | `Absorb/Reflect(counter-spell)` |
| KU03 | Jikanteishi | 時間停止 | Time Stop | unrevealed | **forbidden** | `Field(time stop)` |
| KU04 | Kūkanten'i | 空間転位 | Spatial Displacement | unrevealed | **forbidden** | `Teleport(region)` |
| KU05 | Kagizaki | 拘咲 | Arrested Bloom | two long chants | | `Mobility(launch)` |
| KU06 | Keikaigi | 繫界儀 | World-Tying Rite | long | | `Teleport(portal)` |
| KU07 | Noren Mekuri | 暖簾捲り | Curtain Flip | unrevealed | | `Sensing(dispel illusion)` |
| KU08 | Sentan Hakuja | 千反白蛇 | Thousand-Coil White Snake | unrevealed | | `Bind` `Teleport` |
| KU09 | Jigoku no Kidō | 地獄鬼道 | Hell Kidō | unrevealed | (Mv) | `Teleport(realm escape)` |
| KA | Kaidō | 回道 | Turn Way (healing) | none | | `Heal` |
| KO | Keikatsu / Meiyu / Shimoku / Sōeigeki / Kidō Cannon | 啓活 / 明癒 / 紫木 / 蒼霙撃 / 鬼道砲 | — | — | (G)/(Mv) | see §1.12 |

### 1.7 Hadō catalogue (Way of Destruction)

#### H01 · Hadō #1 Shō (衝, "Thrust")
- **Effect:** a fingertip point releases a burst of pure kinetic force that shoves the target back a few metres; a
  rebuff/opener, not a damage spell.
- **Visual:** almost nothing — a faint ripple at the fingertip (proposal: transparent air-distortion ring).
- **Users:** Byakuya Kuchiki; Isane Kotetsu (A).
- **Chant:** unrevealed.
- **Tags:** `Projectile(push, short hitscan)` `Status(knockback)`
- **Impl:** 3 m hitscan cone; impulse ∝ caster RL; no voxel damage itself, but slamming the target into a wall
  converts velocity into impact damage that can crack/break the wall (high-RL casters punt people through houses).

#### H04 · Hadō #4 Byakurai (白雷, "Pale Lightning")
- **Effect:** condensed high-density Reiryoku discharged as a lightning bolt from the index finger (or both hands);
  fast, narrow, piercing.
- **Visual:** razor-thin pale white/ice-blue bolt with jittery edges; near-instant.
- **Users:** Rukia Kuchiki, Byakuya Kuchiki; (A) Rangiku, Hisagi, Nanao, Kagerōza Inaba and others. Upgrade: HX4.
- **Chant:** unrevealed.
- **Tags:** `Beam(thin, instant, pierce)`
- **Impl:** hitscan ray, pierces up to 3 characters; bores a 1-voxel (0.25 m) tunnel through world voxels to a
  depth ∝ power (≈2 m at lieutenant level, 20 m+ for Byakuya/Aizen); scorched rim voxels; 0.2 s flinch.

#### H11 · Hadō #11 Tsuzuri Raiden (綴雷電, "Bound Lightning")
- **Effect:** sends an electric current through whatever the caster is touching; anyone in contact with that
  object is shocked.
- **Visual:** crackling arcs crawling along the touched object (color unrevealed — proposal: yellow-white arcs).
- **Users:** Shūhei Hisagi.
- **Chant:** unrevealed.
- **Tags:** `Status(shock/stun)` `Environmental(electrify)`
- **Impl:** touch-cast on a weapon, chain, wall, pipe or puddle → flood-fill through the **connected voxel
  component** (cap ~2 000 voxels; full speed through `conductive`, ¼ speed through others) → stun + damage every
  character touching that component. Perfect with chain weapons (Kazeshini) and binds that physically connect.

#### H12 · Hadō #12 Fushibi (伏火, "Ambush Flare")
- **Effect:** a prepared ambush fire: Momo combined it with a Kidō net and Shakkahō to blow up enemies caught in
  the net all at once.
- **Visual:** dormant fuse-lines that flash into a large orange-red explosion along the net.
- **Users:** Momo Hinamori.
- **Chant:** unrevealed.
- **Tags:** `Field(trap)` `Blast` `Environmental(fire)`
- **Impl:** place an invisible "fuse net" (`Construct` strands, can be hidden with B26 Kyokkō); when a fire spell or
  the detonate key hits it, every net node produces a small `Blast` (chain explosion, SDC1–2 each), igniting
  flammables.

#### H31 · Hadō #31 Shakkahō (赤火砲, "Red Fire Cannon")
- **Effect:** the default Academy attack spell: a ball of hot flame from palm or fingertip; small/medium/large by
  power; blows up on contact or becomes a pillar of energy; concussive + burn damage. A tamed version is a light
  source.
- **Visual:** crimson-red orb with a hot core; explosion sphere or vertical red pillar.
- **Users:** Izuru Kira, Renji Abarai, Momo Hinamori, Kaien Shiba; (A) Rukia, Rangiku, Hitsugaya, Isane, Yumichika,
  Ukitake, Yoruichi, Nanao and others.
- **Chant:** medium.
- **Tags:** `Projectile(orb, explode)` `Blast` `Environmental(fire, light)`
- **Impl:** tap = small orb; hold = 3 growth stages (orb 0.3 → 0.8 → 2 m). Crater SDC1 (lieutenant) to SDC2
  (captain); aimed at the ground at full charge = **pillar mode**: a column that blows a vertical shaft upward
  through floors. Ignites flammables. **Torch mode** (alt-fire): a hovering low-power orb = dynamic light, no damage.

#### H32 · Hadō #32 Ōkasen (黄火閃, "Yellow Fire Flash")
- **Effect:** the caster holds the Zanpakutō horizontally; a yellow orb spreads along the blade and is released as
  a wide horizontal arc. Using a bare hand gives a shorter arc.
- **Visual:** yellow-gold flat crescent, very wide.
- **Users:** Kisuke Urahara.
- **Chant:** unrevealed.
- **Tags:** `Projectile(crescent, slice)`
- **Impl:** planar crescent ~3× blade length wide (hand: 1.5×), 1 voxel thick; slices a horizontal slot through
  walls/pillars (`slice` carving) — columns cut this way topple (structural check).

#### H33 · Hadō #33 Sōkatsui (蒼火墜, "Blue Fire, Crash Down")
- **Effect:** blue flame torrent from the palm — a direct blast at low power or a broad wave at high power; a
  skilled user can even damage a Bankai. Kuchiki-clan staple.
- **Visual:** blue fire stream (games sometimes miscolor it orange/purple — use **blue**).
- **Users:** Rukia, Byakuya, Rōjūrō Ōtoribashi; (A) Ran'Tao.
- **Chant:** long.
- **Tags:** `Beam(short, wide)` / `Projectile(wave)` `Environmental(fire)`
- **Impl:** charge-scaled cone: 1 m blast → 5 m-wide wave. Erodes a shallow trench of voxels along its path, ignites
  flammables, **+50 % vs. constructs and released forms** (Bankai bodies, summons, ice).

#### H54 · Hadō #54 Haien (廃炎, "Abolishing Flames")
- **Effect:** an "erasing" flame: an oblong purple blast that burns the target out of existence on contact.
- **Visual:** elongated violet fire bolt; target crumbles to purple embers (one anime use was red).
- **Users:** Kaname Tōsen (disposing of Grimmjow's severed arm); (A) Reigai-Urahara.
- **Chant:** unrevealed.
- **Tags:** `Projectile(bolt, disintegrate)` `Status(erase)`
- **Impl:** world: deletes a capsule-shaped volume with **no debris** (embers only). Characters: heavy burn; instantly
  erases severed limbs, corpses, downed mooks and summons below a HP threshold (execute).

#### H57 · Hadō #57 Daichi Ten'yō (大地転踊, "Upturned Earth Dance")
- **Effect:** thrust of the hands lifts surrounding objects and flings them wherever the caster wants, precisely
  enough to shoot down incoming projectiles.
- **Visual:** debris and rubble rising in a slow spiral, then whipping out (no energy color described).
- **Users:** Yumichika Ayasegawa (TYBW; manga status to verify).
- **Chant:** unrevealed.
- **Tags:** `Grab/Throw(telekinesis)` `Absorb/Reflect/Redirect(intercept)`
- **Impl:** grabs up to N loose debris chunks/props within 12 m (prefers existing debris; can pry loose small voxel
  clusters ≤ 1 m³) and orbits them. Tap: fire chunks one by one (homing). Passive while orbiting: each chunk can
  auto-intercept one incoming projectile. Gets stronger the more the arena is already wrecked.

#### H58 · Hadō #58 Tenran (闐嵐, "Vigorous Tempest")
- **Effect:** the caster levitates the sheathed Zanpakutō, flicks it so it spins like a fan, then lets loose a
  widening tornado blast; a hand can stand in for the sword.
- **Visual:** horizontal white tornado cone.
- **Users:** Izuru Kira, Tokinada Tsunayashiro (N); (A) Yoruichi, Rangiku, Nanao, others.
- **Chant:** unrevealed.
- **Tags:** `Projectile(tornado cone)` `Environmental(wind)`
- **Impl:** expanding cone (2 → 8 m) that pushes characters, **sucks loose debris into the vortex and sprays it
  outward**, strips light surface voxels (roof tiles, sand, grass, paper walls), fans/extinguishes fires.

#### H63 · Hadō #63 Raikōhō (雷吼炮, "Thunder Roar Sear")
- **Effect:** a palm-held orb of yellow lightning is released as a huge lightning strike; devastating. Shiba-clan
  specialty.
- **Visual:** yellow lightning orb → massive yellow bolt with forks.
- **Users:** Kūkaku Shiba, Sousuke Aizen, Retsu Unohana; (A) Ukitake, Reigai copies.
- **Chant:** medium.
- **Tags:** `Beam(lightning)` `Blast`
- **Impl:** fast beam with forked side-arcs; terminal crater SDC2 (lieutenant) to SDC3 (captain); arcs chain to
  `conductive` voxels and nearby characters (chain lightning, 3 jumps).

#### H73 · Hadō #73 Sōren Sōkatsui (双蓮蒼火墜, "Twin Lotus Blue Fire, Crash Down")
- **Effect:** the doubled, twice-as-strong Sōkatsui: two bursts of blue fire pushed out with both palms.
  (Databook moved it from #63 to #73.)
- **Visual:** twin blue flame torrents that braid together.
- **Users:** Rukia Kuchiki; (A) Reigai-Byakuya.
- **Chant:** long.
- **Tags:** `Beam(twin)` `Blast` `Environmental(fire)`
- **Impl:** two converging Sōkatsui beams; where they meet → `Blast` SDC2–3. Canon combo partner for B61 via Nijū
  Eishō (Rukia vs. Aaroniero).

#### H78 · Hadō #78 Zangerin (斬華輪, "Cutting Flower Ring")
- **Effect:** a large charge of energy gathered in the Zanpakutō and blasted outward — enough to level a building.
- **Visual:** radial energy burst from the blade (manga only, no canonical color → use the caster's Reiatsu tint).
- **Users:** Shunsui Kyōraku.
- **Chant:** unrevealed.
- **Tags:** `Blast(ring)` `Slice`
- **Impl:** horizontal ring blast centered on the blade (SDC3): everything at blade height is cut by the ring,
  structures above slide/collapse ("flower ring" cut) — a building-flattening panic button.

#### H88 · Hadō #88 Hiryū Gekizoku Shinten Raihō (飛竜撃賊震天雷炮, "Flying-Dragon-Striking, Heaven-Shaking Thunder Cannon")
- **Effect:** a high-level spell only Kidō masters can wield: from an outstretched arm (often braced by the other
  hand) the caster fires a colossal beam of electrical + spiritual energy that ends in a huge explosion. Bakudō #81
  Dankū can stop it.
- **Visual:** arm braced at the wrist, gigantic beam with lightning coiling around it (anime: white-blue electric —
  verify exact hue).
- **Users:** Tessai Tsukabishi; (A) Reigai-Unohana, Reigai-Urahara.
- **Chant:** unrevealed.
- **Tags:** `Beam(huge, bore)` `Blast`
- **Impl:** 2–3 m diameter beam that bores a cylinder through everything (SDC3, SDC4 at full chant) + terminal
  explosion; caster recoils backward; strong screen flash and camera shake.

#### H90 · Hadō #90 Kurohitsugi (黒棺, "Black Coffin")
- **Effect:** a torrent of gravity forms a black box around the target; spear-like protrusions pierce the box and
  lacerate whoever is inside. Very hard: Aizen's chantless cast had only about a third of its power. With the full
  chant it looks different — the sky darkens, several black boxes topped with cross-shaped spears multiply and close
  in, and it can distort space-time.
- **Visual:** violet/black energy → glossy black coffin bristling with spikes; full version: multiple boxes + crosses.
- **Users:** Sousuke Aizen; Sōya Azashiro (N).
- **Chant:** long.
- **Tags:** `Field(gravity)` `Construct(coffin)` `Bind` `Projectile(spikes)` `Status(space distortion)`
- **Impl:** gravity well pins the target → black `construct.kido` box (indestructible from outside while active)
  → inward spike multi-hit → box shatters. The box volume crushes/compacts world voxels inside it (gravity crush,
  no debris). **Full chant:** 5–9 boxes converge on the target and a warp field (shader + 2 s time-slow inside)
  shears world voxels along the box edges (SDC4–5 visual impact).

#### H91 · Hadō #91 Senju Kōten Taihō (千手皎天汰炮, "Thousand-Hand Bright-Heaven Cannon")
- **Effect:** ten points of energy form around the caster and all fire at the target, causing an exceptionally
  destructive explosion.
- **Visual:** ten glowing points/lances fanned behind the caster (anime: brilliant white-gold — verify).
- **Users:** Kisuke Urahara, Shinji Hirako, Sousuke Aizen.
- **Chant:** very long (the longest known).
- **Tags:** `Projectile(multishot ×10, homing)` `Blast`
- **Impl:** spawns 10 lances in a fan; they home and converge → each a small blast + combined `Blast` SDC3 at the
  convergence point. Chant synergy: **each verse adds lances** (partial chant = fewer lances).

#### H96 · Hadō #96 Ittō Kasō (一刀火葬, "Single-Blade Cremation")
- **Effect:** forbidden Gisei Hadō: it can only be activated with the caster's own body as the catalyst ("spell of
  sacrifice"). A brief shockwave, then a gigantic pillar of red fire shaped like the tip of a katana erupts from the
  ground and obliterates every building nearby. Yamamoto lost his left arm to it.
- **Visual:** red-orange flame column with a blade-tip silhouette, shockwave ring first.
- **Users:** Genryūsai Shigekuni Yamamoto; Sōya Azashiro (N — used Gigai copies as catalysts, casting it many
  times).
- **Chant:** unrevealed.
- **Tags:** `Blast(pillar)` `Environmental(fire)` `Status(self: limb loss)`
- **Impl:** usually from a grab/hold on the target. Cost = **permanently remove one arm** for the match (character
  voxels deleted, arm-dependent moves disabled, one-handed fallback set). Effect: SDC4 pillar (≈25–40 m) deleting
  world voxels in the column + shockwave ring collapse + fires. Novel variant: consume decoys/clones instead of a limb.

#### H99 · Hadō #99 Goryūtenmetsu (五龍転滅, "Five Dragons' Annihilation")
- **Effect:** the caster raises a hand; a flood of energy bursts out, the ground lifts in chunks, and the energy
  takes the form of five enormous serpentine dragons that tear into the enemy. (Novel: forbidden because it draws on
  the surrounding Reimyaku/ley-line energy.)
- **Visual:** golden energy; dragons tinted by the caster's Reiatsu (Aizen: pale purple/yellow; Urahara: dark red).
- **Users:** Sousuke Aizen; Kisuke Urahara (other media).
- **Chant:** unrevealed.
- **Tags:** `GroundWave(uplift)` `Summon(5 dragons, homing)` `Blast`
- **Impl:** radial uplift (voxel chunks in 20 m float upward) → five dragon summons built from energy **plus the
  lifted voxel chunks** (bodies visibly made of rubble) → they tunnel through terrain toward the target and burst
  (SDC3 each). Reishi-rich maps +25 % power (ley lines). Leaves a field of craters and floating debris that falls.

#### HX1 · Gaki Rekkō (牙気裂光, "Raging Light Fang") (A)
- **Effect / Visual:** an energy circle that fires many green light blasts in a cage-like pattern (Kōga fires it
  from his halberd tip).
- **Users:** Kōga Kuchiki (A). **Chant:** unrevealed.
- **Tags:** `Projectile(multishot, cage)` · **Impl:** 8 beams converge in a lattice that blocks dodge lanes;
  each beam carves shallow grooves.

#### HX2 · Hyōga Seiran (氷河晴嵐, "Glacier Vapor Storm") (A)
- **Effect:** a massive wave of ice that freezes targets and the surroundings; destroyed a group of Menos and broke
  through Dankū (taking ~15 s).
- **Visual:** white-cyan ice tide with spikes.
- **Users:** Kōga Kuchiki (A). **Chant:** unrevealed.
- **Tags:** `GroundWave(ice)` `Environmental(freeze)` `Construct(ice)`
- **Impl:** wave converts surface voxels to `ice` material and raises ice spikes; `Status(freeze)`; vs. shields it
  applies sustained pressure (breaks Dankū after a timer instead of instantly).

#### HX3 · Kongōbaku (金剛爆, "Adamantine Blast") (A)
- **Effect / Visual:** a red spherical blast about as strong as Sōkatsui, fired from Kōga's halberd tip.
- **Users:** Kōga Kuchiki (A). **Tags:** `Projectile(orb, explode)` · **Impl:** SDC1–2 orb.

#### HX4 · Jūgeki Byakurai — Kaizō Kidō (重撃白雷, "Heavy-Strike Pale Lightning", modified Kidō)
- **Effect:** Urahara's re-engineered Byakurai: a red beam that pierced even Aizen's body from long range.
- **Visual:** crimson needle-beam (unlike Byakurai's white).
- **Users:** Kisuke Urahara. **Chant:** unrevealed.
- **Tags:** `Beam(thin, long-range, pierce)`
- **Impl:** like H04 but 3× range, ignores shields of tier ≤ 80 and Hierro/Blut thresholds by 50 %; tunnels 30 m+.

#### HX5 · Mushikuidama (虫喰玉, "Worm-Eaten Ball")
- **Effect:** a small but potent shot that leaves a neat circular hole in whatever it hits.
- **Visual:** small energy ball (color unrevealed — proposal: sickly yellow-green, Mayuri's palette).
- **Users:** Mayuri Kurotsuchi. **Chant:** unrevealed.
- **Tags:** `Projectile(orb, tunnel)`
- **Impl:** **clean bore**: removes a perfect 1 m cylinder through walls with no debris (great for peepholes and
  surgical entries).

#### HX6 · Ura Hadō: Sannodō — Teppūsatsu (裏破道・三の道・鉄風殺, "Hidden Way of Destruction, Third Path: Iron Wind Murder")
- **Effect:** a chopping hand motion summons a golden aura shaped like a great dragon's head that breathes a
  crushing wind — strong enough to shatter Yhwach's Blut Vene Anhaben dome.
- **Visual:** golden dragon-head silhouette, gale streaks.
- **Users:** Ichibe'e Hyōsube. **Chant:** unrevealed.
- **Tags:** `Beam(wind cone)` `Absorb/Reflect/Redirect`-breaker
- **Impl:** cone that deals **×5 to shields/barriers/Blut Vene** (shield-breaker), blows away debris and light
  structures (SDC2 push-destruction), knocks targets far back.

### 1.8 Bakudō catalogue (Way of Binding)

#### B01 · Bakudō #1 Sai (塞, "Restrain")
- **Effect:** pointing two fingers at the target snaps their arms behind their back.
- **Visual:** no construct described (proposal: faint white bands flash at the wrists).
- **Users:** Rukia Kuchiki (on Ichigo, first chapter — he later forced his way out of it, which shocked her);
  (A) Renji.
- **Chant:** unrevealed.
- **Tags:** `Bind(arms)` `Status(disarm)`
- **Impl:** disables LMB/RMB/weapon abilities for 1.5–3 s; legs free. Break meter uses ΔRL — a much stronger soul
  (Ichigo-type) can tear out of it with a mash + Reiatsu burst.

#### B04 · Bakudō #4 Hainawa (這縄, "Crawling Rope")
- **Effect:** a crackling yellow energy rope thrown from the hand coils around the target's arms and body.
- **Visual:** crackling yellow rope of light.
- **Users:** Rukia Kuchiki; (A) Renji, Yumichika, Ginrei, Nanao, Urahara, Reigai-Momo.
- **Chant:** unrevealed.
- **Tags:** `Bind(rope projectile)`
- **Impl:** fast rope projectile, 2–4 s bind. **Combo:** B61 Rikujōkōrō cast on a Hainawa-bound target within 3 s
  is instant (its six rods are formed from Hainawa's light).

#### B08 · Bakudō #8 Seki (斥, "Repulse")
- **Effect:** a light-blue orb/disc that repels whatever strikes it.
- **Visual:** small light-blue disc.
- **Users:** Jūshirō Ukitake.
- **Chant:** unrevealed.
- **Tags:** `Shield(small)` `Absorb/Reflect/Redirect`
- **Impl:** quick parry-shield (1 m disc, 0.6 s): melee attackers are knocked back; projectiles of tier ≤ caster's
  cap are deflected along the reflection vector (deflected shots keep destroying terrain where they go).

#### B09a · Bakudō #9 Geki (撃, "Strike") (A — manga shows only the chant)
- **Effect:** the caster draws the spell's symbols in the air; red energy saturates their body and engulfs the
  target, completely paralysing it.
- **Visual:** red aura flowing from caster to target.
- **Users:** Rukia Kuchiki.
- **Chant:** short (identical to Hōrin's).
- **Tags:** `Status(paralysis)` `Bind`
- **Impl:** 0.5 s glyph-drawing gesture, then a red tether; full paralysis 3 s (break by ΔRL).

#### B09b · Bakudō #9 Hōrin (崩輪, "Disintegrating Circle") (A)
- **Effect:** an orange tendril with spiralling yellow patterns shoots from two fingers and wraps the target; the
  caster keeps hold of the end and can steer it before and after capture; two tendrils that each caught someone can
  be tied together.
- **Visual:** orange energy tendril, yellow spiral pattern.
- **Users:** Momo Hinamori (A).
- **Chant:** short (same as Geki).
- **Tags:** `Bind(tendril, steerable)` `Grab/Throw`
- **Impl:** steerable tether (mouse-guided); captured targets can be swung into walls (impact damage breaks voxels);
  "tie" input links two captured targets so they share movement.

#### B21 · Bakudō #21 Sekienton (赤煙遁, "Red Smoke Escape")
- **Effect:** palms on the ground release a burst of red smoke that quickly fills the area and hides movement for a
  getaway.
- **Visual:** dense red smoke cloud.
- **Users:** Marechiyo Ōmaeda; Tokinada Tsunayashiro (N).
- **Chant:** unrevealed.
- **Tags:** `Field(smoke)` `Sensing/Stealth`
- **Impl:** volumetric red smoke, 12 m radius, 5 s; blocks vision & breaks lock-on; caster +30 % speed for 2 s;
  smoke drifts with wind and is blown away by blasts/Tenran.

#### B26 · Bakudō #26 Kyokkō (曲光, "Bent Light")
- **Effect:** bends light to hide the caster's body and Reiatsu; also used to hide the Reiryoku of a trap being set.
- **Visual:** refraction shimmer, then nothing.
- **Users:** Momo Hinamori.
- **Chant:** unrevealed.
- **Tags:** `Sensing/Stealth(invisibility, Reiatsu mask)`
- **Impl:** refraction shader → invisible + no Reiatsu signature (Pesquisa/sensing can't see it) until the caster
  attacks or takes a hit; can be cast on a placed trap/construct instead (hides B37/H12 setups).

#### B30 · Bakudō #30 Shitotsu Sansen (嘴突三閃, "Beak-Thrust Triple Flash")
- **Effect:** from crackling yellow energy the caster draws an inverted triangle; three wedge-shaped solid triangles
  shoot from its corners and nail the target to a nearby surface at three points.
- **Visual:** yellow triangle → three yellow wedges.
- **Users:** Suì-Fēng; (A) Yoruichi, Kira, Kagerōza Inaba, Nozomi Kujō, Ōko Yushima.
- **Chant:** unrevealed.
- **Tags:** `Projectile(×3 wedges)` `Bind(pin)`
- **Impl:** on hit the target is carried to the nearest surface within 6 m and pinned 2–4 s (wedges embed into
  voxels); destroying those voxels frees the target. No surface → strong knockback instead.

#### B37 · Bakudō #37 Tsuriboshi (吊星, "Suspending Star")
- **Effect:** a blue ball fires six ropes that anchor to nearby solid objects; the centre flattens into an elastic
  cushion that catches falling people.
- **Visual:** blue star-net with six taut lines.
- **Users:** Momo Hinamori, Izuru Kira, Kisuke Urahara.
- **Chant:** unrevealed.
- **Tags:** `Construct(net/cushion)` `Mobility(rescue, trampoline)`
- **Impl:** raycasts 6 ropes to solid voxels within 10 m (needs ≥ 3 anchors); cushion cancels fall damage and acts
  as a trampoline (super-jump); collapses if anchors are destroyed. Can double as the Fushibi trap net (H12).

#### B39 · Bakudō #39 Enkōsen (円閘扇, "Round Lock Fan")
- **Effect:** a blocking motion with both hands or the Zanpakutō conjures a large spinning disc of condensed Reiatsu
  that stops an attack.
- **Visual:** dull-yellow spinning disc.
- **Users:** Izuru Kira; (A) Momo Hinamori.
- **Chant:** unrevealed.
- **Tags:** `Shield(disc)`
- **Impl:** hold-shield, 2.5 m disc, HP ∝ caster power; spinning deflects projectiles sideways (deflections can hit
  walls).

#### B58 · Bakudō #58 Kakushitsuijaku (摑趾追雀, "Footprint-Seizing Pursuing Sparrows")
- **Effect:** a tracking spell: a circle with quadrant symbols is drawn in black powder; when activated it glows
  blue and numbers scroll until the target's coordinates (latitude/longitude) are found.
- **Visual:** ground circle of black powder glowing blue, spinning numerals.
- **Users:** Isane Kotetsu, Mayuri Kurotsuchi; (A) Rangiku.
- **Chant:** medium.
- **Tags:** `Sensing(locate)`
- **Impl:** stationary 2–4 s channel (decal circle) → marks one *known* Reiatsu signature on the map and outlines it
  through walls for 10 s. Fails on targets using Kyokkō / Urahara-cloak / Sekkiseki shelter.

#### B61 · Bakudō #61 Rikujōkōrō (六杖光牢, "Six-Rod Light Prison")
- **Effect:** a fingertip spark summons six thin, wide plates of light that slam into the target's midsection; the
  whole body is locked, not just the struck parts. Can be built from the light of a prior Hainawa.
- **Visual:** six yellow-white light blades around the waist in a ring.
- **Users:** Byakuya Kuchiki, Rukia Kuchiki, Kisuke Urahara; (A) Reigai-Unohana.
- **Chant:** short.
- **Tags:** `Bind(6 rods)`
- **Impl:** near-hitscan, 2–5 s full lock (works mid-air: target hangs in place). Rods are intangible to the world.
  The classic first half of a Nijū Eishō (→ H73).

#### B62 · Bakudō #62 Hyapporankan (百歩欄干, "Hundred-Step Balustrade")
- **Effect:** a glowing rod is thrown and splits into about a hundred rods that rain down and pin the target to a
  surface — very hard to dodge in tight spaces; rods can also be spawned around the caster and flung with a gesture.
- **Visual:** blue-white rods, falling like a fence.
- **Users:** Shūhei Hisagi, Ichibe'e Hyōsube; (A) Nanao, Unohana.
- **Chant:** unrevealed.
- **Tags:** `Projectile(multishot ×100 rods)` `Bind(pin)`
- **Impl:** area rain (6 m footprint); each rod punches a 0.25 m hole and embeds; ≥ 6 rods on one target = pinned
  (Bind). Alternative "volley" mode fires the rods horizontally from around the caster.

#### B63 · Bakudō #63 Sajō Sabaku (鎖条鎖縛, "Locking Bondage Stripes")
- **Effect:** palm raised, fist closed: a very thick rope/chain of yellow energy binds the upper body. Raw physical
  strength shouldn't break it (Hachigen) — though a Hollowfied Kensei did.
- **Visual:** thick yellow chain-rope.
- **Users:** Hachigen Ushōda, Kisuke Urahara, Shūhei Hisagi, Ginjirō Shirogane; (A) Hitsugaya, Kira, Unohana.
- **Chant:** unrevealed.
- **Tags:** `Bind(chains)`
- **Impl:** strong 3–6 s bind whose break meter ignores button-mashing — only ΔRL ≥ 2 or a mid-bind Transform/mask
  gives a break roll.

#### B73 · Bakudō #73 Tōzanshō (倒山晶, "Inverted Mountain Crystal")
- **Effect:** blue energy spreads from one point to four and forms an upside-down pyramid barrier around the caster;
  it can coexist with other active spells and can also trap others.
- **Visual:** translucent blue inverted pyramid.
- **Users:** Izuru Kira; (A) Yoruichi.
- **Chant:** unrevealed.
- **Tags:** `Shield(enclosure)` `Construct` `Bind(trap mode)`
- **Impl:** 4 m pyramid enclosure blocking all projectiles until broken; trap mode = cast on an enemy to box them in.
  Planes ignore world voxels (no carving).

#### B75 · Bakudō #75 Gochūtekkan (五柱鉄貫, "Five-Pillar Iron Penetration")
- **Effect:** five small tailed yellow orbs rise from clasped hands into a ring overhead; the caster slams the hands
  down, light flares in the sky above the target, and five tall, thick pillars joined by chains crash down to pin the
  target to the ground.
- **Visual:** yellow orbs → massive dark iron pillars with golden light and linking chains.
- **Users:** Hachigen Ushōda; (A) Urahara, Reigai-Unohana.
- **Chant:** short.
- **Tags:** `Construct(pillars)` `Bind(chains)` `Blast(impact)`
- **Impl:** five pillars (1.5 m × 10 m `construct.kido`) drop around the target — each impact is an SDC1–2 crater
  that crushes anything under it; chains bind the target flat. Pillars persist (HP) and erode into Reishi dust.

#### B77 · Bakudō #77 Tenteikūra (天挺空羅, "Heavenly Rickshaw in Silken Air")
- **Effect:** telepathic mass broadcast. Markings are drawn on the arms, hands and ground in powder or blood; a
  glowing rectangle sprouts a root-like network; messages reach everyone in a chosen area who knows the caster's
  Reiatsu (others can still feel the disturbance).
- **Visual:** glowing rectangle in front of the palms, root lines spreading outward, animated arm markings.
- **Users:** Isane Kotetsu, Kaname Tōsen, Rangiku Matsumoto.
- **Chant:** long.
- **Tags:** `Sensing(broadcast)`
- **Impl:** 3 s channel → all allies' positions shared, AI allies receive a command (regroup / focus target /
  retreat). Enemies with sensing get a "transmission detected" ping toward the caster.

#### B79 · Bakudō #79 Kuyō Shibari (九曜縛, "Binding of the Nine Luminaries")
- **Effect:** eight black holes ringed in purple appear around the target and a ninth opens in the centre of its
  chest, immobilising it.
- **Visual:** nine black void-spheres with violet outlines.
- **Users:** Kisuke Urahara.
- **Chant:** unrevealed.
- **Tags:** `Bind(9 nodes)`
- **Impl:** works on airborne targets (they hang in place); nodes visually suck in dust/small debris (cosmetic).

#### B81 · Bakudō #81 Dankū (斷空, "Splitting Void")
- **Effect:** a large translucent rectangular wall that stops destructive spells up to Hadō #89 (Aizen blocked
  Tessai's #88 with it).
- **Visual:** pale translucent pane.
- **Users:** Byakuya Kuchiki, Sousuke Aizen; (A) Unohana, Urahara, Yamamoto, Reigai-Byakuya.
- **Chant:** unrevealed.
- **Tags:** `Shield(wall, tier≤89)`
- **Impl:** 6 × 4 m pane (scales with RL); **blocks 100 % of any projectile/beam with kidoTier ≤ 89**; above that,
  a time-to-break model (Hyōga Seiran needed ~15 s). Characters can walk around it; it does not carve terrain.

#### B99a · Bakudō #99, Part 1: Kin (禁, "Prohibition")
- **Effect:** arms spread wide, then hands clasped with intricately interlaced fingers: the target's arms are
  bound behind its back with spiritual cloth and iron shafts. A stronger version mummifies the whole body, piles the
  cloth on the ground and pins it with X-shaped shafts.
- **Visual:** pale cloth bands + dark iron bars.
- **Users:** Tessai Tsukabishi, Hachigen Ushōda; (A) Urahara, Ōko Yushima.
- **Chant:** unrevealed.
- **Tags:** `Bind(heavy)`
- **Impl:** strong bind; the full version embeds shafts into ground voxels (immobile until shafts or ground break);
  break requires ΔRL ≥ 3 or a Transform.

#### B99b · Bakudō #99, Part 2: Bankin (卍禁, "Full Prohibition")
- **Effect:** fingers driven into the ground release white energy: (1) **Prologue** — white cloth wraps the target
  head to toe; (2) **Refrain** — a hundred metal bolts skewer them; (3) **Finale** — an immense metal block slams
  down from above. Ichigo tore through the first two stages before the cube landed.
- **Visual:** white cloth cocoon → silver bolts → huge grey metal cube.
- **Users:** Tessai Tsukabishi.
- **Chant:** three short stage calls.
- **Tags:** `Bind` `Projectile(bolts)` `Construct(cube)` `Blast(crush)`
- **Impl:** three-stage cast (one stage per press/verse); the target gets a break check before each stage. Finale
  drops a 4 m `construct.kido` cube: SDC2 crater, crushes anything under it, leaves the cube as cover until it erodes.

#### BX1 · Hakufuku (白伏, "White Crawl")
- **Effect:** the victim sees purple cherry blossoms falling; vision blurs, the mind fogs, then they black out and
  wake with hazy memories.
- **Visual:** purple petals overlay, screen blur.
- **Users:** Momo Hinamori, Gin Ichimaru. **Chant:** unrevealed.
- **Tags:** `Status(confusion → unconscious)` `Field(illusion)`
- **Impl:** touch/close range; 1 s control inversion + blur, then KO (sleep) on non-bosses; bosses resist if ΔRL ≥ 0.

#### BX2 · Inemuri (威眠, "Forced Slumber")
- **Effect / Visual:** a hand held before the face makes the victim's pupils dilate repeatedly and glaze over before
  they collapse unconscious.
- **Users:** Genryūsai Shigekuni Yamamoto. **Tags:** `Status(sleep)` · **Impl:** close-range takedown.

#### BX3 · Tanma Otoshi (タンマ落とし, "Time-Out Drop")
- **Effect / Visual:** palm over the face; white light disorients and knocks the victim out.
- **Users:** Shinji Hirako (to put Ichigo under for his inner-Hollow fight). **Tags:** `Status(KO)`.

#### BX4 · Shibireyubi (しびれ指, "Numbing Finger")
- **Effect / Visual:** a fingertip flash of white energy in front of the eyes; the victim drops, fully conscious but
  paralysed.
- **Users:** Kisuke Urahara. **Tags:** `Status(paralysis, conscious)`.
- **Impl (BX1–BX4):** a "non-lethal takedown" set: instant on mooks, NPC civilians and willing/downed allies
  (story use); bosses only when ΔRL ≤ −3 (caster far stronger).

### 1.9 Barriers & seals (kekkai / fū)

#### KS01 · El Escudo (エル・エスクド, "The Shield")
- Raising an arm calls up a **light-green** barrier that blocks an incoming attack. **User:** Aizen.
- **Tags:** `Shield` · **Impl:** instant directional shield, short duration, tier ≤ caster RL-equivalent.

#### KS02 · Millón Escudo (ミジョン・エスクド, "Million Shields")
- **Effect:** a light-green hexagonal barrier anchored to one point, invisible until something hits it; then it
  expands to cover what it protects, collects the attack's energy into one spot, holds it, and throws it outward
  so the attack disperses. It stopped a point-blank Bankai Getsuga Tenshō.
- **User:** Aizen. **Tags:** `Shield(auto)` `Absorb/Reflect/Redirect`
- **Impl:** passive auto-trigger (cooldown 8 s): absorbs one projectile/beam, then ejects it in a random outward
  direction → the redirected blast wrecks whatever it hits (collateral destruction is the point).

#### KS03 · Fūsatsu Kakei (封殺火刑, "Seal-Slaying Fire Penance")
- **Effect:** Urahara's anti-Aizen seal: glowing yellow-gold rings clamp the target's wrists and close the Reiatsu
  vents every Shinigami has there, so the victim's own Reiatsu burns them from the inside.
- **User:** Kisuke Urahara. **Tags:** `Status(vent seal → self-incineration)`
- **Impl:** applied via a delivered strike/grab; DoT **proportional to the victim's own RL** (the stronger, the
  worse it burns) — inverse scaling, deliberately fun. Only beings with wrist vents (Shinigami, Visored, Hōgyoku
  Aizen) are affected; Arrancar/Quincy take a weak version (proposal). The victim's body glows white-hot at the
  wrists; burning pieces flake off as voxels.

#### KS04 · Kyūjūrokkei Kakafūmetsu (九十六京火架封滅, "96-Capital Fire-Frame Sealing Annihilation")
- **Effect:** a seal planted in advance that fires by itself once the target is weakened: cross-shaped beams of light
  pierce the target from inside and merge into a star-shaped barrier that seals them.
- **User:** Kisuke Urahara. **Tags:** `Status(delayed mark)` `Bind(seal)`
- **Impl:** a hit applies "Urahara's mark"; when the marked target drops below 25 % HP (or is staggered) it
  auto-triggers a 6 s seal (boss may break out with a phase transition — canon: Aizen did).

#### KS05 · Goyōgai (五養蓋, "Five-Support Cover")
- **Effect:** a translucent yellow prism enclosing a person and freezing their state — it holds off death from mortal
  wounds.
- **User:** Hachigen Ushōda. **Tags:** `Status(stasis)` `Heal/Reject`-adjacent
- **Impl:** co-op revive tool: a downed ally is encased; bleed-out timer paused, immune to damage, can't act; healers
  can then work on them.

#### KS06 · Hachigyō Sōgai (八爻双崖, "Eight-Line Twin Cliffs")
- **Effect:** Hachigen claps twice — above and below his head — and raises a building-sized **two-layer
  dislocation barrier** (二重断層結界). Whatever is inside is wiped from existence *as far as outsiders are concerned*:
  the space drops out of their awareness so completely that the idea of approaching it never occurs to them (it hid
  the Visored's warehouse hideout). Standard Shinigami Kidō can't undo it and even other Visored can't slip through;
  only Orihime, whose power works similarly, perceived and entered it.
- **User:** Hachigen Ushōda. **Tags:** `Field(imperceptible zone)` `Sensing/Stealth`
- **Impl:** box volume (~15 × 15 × 10 m) that becomes **unperceivable** to anyone outside: contents not rendered for
  them, no Reiatsu signatures leak, no lock-on, AI pathing routes around it without "noticing"; only
  rejection-type powers (Orihime) can see/enter. Not dispellable by normal Kidō (Noren Mekuri fails). It does **not**
  damage voxels — it is the hideout/safe-room tool (story hub, co-op rest zone, ambush nest).

#### KS07–KS10 · The four Castle Gates (城門 *jōmon*) and KS11 Shijū Saimon (四獣塞門, "Four-Beast Blockade Gate")
- **KS07 Ryūbi no Jōmon** (Dragon-Tail): a dozen-plus pillars arranged by hand gestures into a giant door/shield wall.
  Chant: medium; Hachigen powered it up with **Kōjutsu Eishō**.
- **KS08 Kokō no Jōmon** (Tiger-Bite): a watermill-shaped barrier whose inner part opens like fangs so the defender
  can attack *through* it.
- **KS09 Kigai no Jōmon** (Turtle-Armor): a honeycomb of hexagonal plates.
- **KS10 Hōyoku no Jōmon** (Phoenix-Wing): an obelisk with planks folding around it like a lampshade/bird's wings.
- **KS11 Shijū Saimon**: all four combine into a rectangular prison around the enemy; it contained Suì-Fēng's
  Jakuhō Raikōben missile blast (cracking and bulging but holding).
- **User:** Hachigen Ushōda. **Tags:** `Construct` `Shield` `Field(containment)`
- **Impl:** each gate is a `construct.kido` wall with its own gimmick (KS08 has open/close firing ports; KS09 is
  segmented — individual hexes break). Casting all four on one target fuses them into a **containment box**:
  explosions inside do full damage to the occupant but **zero voxel damage outside** (bulge + crack VFX) — the tool
  for protecting the map from an enemy ultimate.

#### KS12 · Hako Okuri (匣遺, "Farewell Box")
- **Effect:** seals an object in an orange box barrier, cutting it off from whatever it was attached to, then teleports
  the box anywhere — even inside another object or person (Hachigen sent his own rotting arm into Baraggan).
- **User:** Hachigen Ushōda. **Tags:** `Teleport(object)` `Construct`
- **Impl:** select a small object/limb/projectile/status-carrier → box → teleport to a target point or **into an
  enemy** (internal damage + transfers the item's status, e.g. Respira decay). Can also "post" an ally's severed limb
  to a healer.

#### KS13 · Roppō Fūjin (六方封陣, "Six-Direction Seal Array")
- **Effect:** a 3-D cross-shaped transparent green barrier closes around the opponent. Baraggan's Respira dissolved one
  (Kidō erosion).
- **User:** Hachigen Ushōda. **Tags:** `Bind(seal)` · **Impl:** encasing bind; erodes ×20 faster under
  time-acceleration effects.

#### KS14 · Standing Ovation (スタンディング・オベーション)
- **Effect:** repeated finger snaps put transparent blue cubes around opponents' heads; a clap sends out a Reiatsu
  shockwave; when it hits, the cubes turn red and fall away — taking the heads with them. Multi-target.
- **User:** Hachigen Ushōda. **Tags:** `Construct(head boxes)` `Blast(shockwave)` `Status(execute)`
- **Impl:** each snap marks one target (max 8); clap = shockwave: decapitates mooks/Gillian-tier (voxel head
  separation), heavy damage + long stagger on bosses.

#### KS15 · Hakudan Keppeki (白断結壁, "White-Severing Boundary Wall") (A — TYBW, verify)
- **Effect:** Nanao's wall bearing the Kidō Corps emblem around the kanji for "one"; for a limited time it completely
  bars any Quincy power. Built using traces of Quincy Reiatsu.
- **User:** Nanao Ise. **Tags:** `Shield(race filter)`
- **Impl:** wall/dome that blocks **100 % of Quincy-type** projectiles/abilities (incl. Shadow teleport through it),
  but nothing else; timed.

#### KS16 · Kyōmon (鏡門, "Mirror Gate")
- **Effect:** a transparent barrier stretched across an opening to keep intruders out; much easier to break from the
  inside if the protected person wants to leave.
- **User:** Tōshirō Hitsugaya. **Tags:** `Shield(doorway, asymmetric)`
- **Impl:** seals a door/window/hole; outside hits use full HP, inside hits ×0.1 HP.

#### KS17 · Shisō Keppū (四槍血封, "Four-Spear Blood Seal") (A)
- **Effect:** four halberds pin the target's hands and feet; the target is lifted into the sky, sealed inside a
  chained black coffin, and the halberds pierce it simultaneously. Holds indefinitely (the prisoner keeps aging);
  only a specific release incantation opens it.
- **User:** Genryūsai Shigekuni Yamamoto (sealing Kōga Kuchiki, A). **Chant:** long.
- **Tags:** `Bind` `Construct(coffin)` `Status(sealed)` · **Impl:** story/boss-defeat finisher.

#### KS18 · Unnamed barriers
Dome, pyramid, wall and net barriers used by Byakuya, Isane, Ginrei, Kidō Corps squads and others → generic
`Shield(dome|wall|pyramid)` and `Construct(net)` presets in the Kidō wheel of whichever character used them.

### 1.10 Uncategorized, forbidden & ritual Kidō

#### KU01 · Chocolate Bar Slider (チョコレート・バー・スライダー)
- **Effect:** five rectangular bars formed between the hands are launched; they multiply and batter the opponent from
  many angles.
- **User:** Hachigen Ushōda. **Tags:** `Projectile(blocks, multiply, bludgeon)`
- **Impl:** 5 → 20 ricocheting blunt blocks; each impact chips SDC1 craters.

#### KU02 · Hanki (反鬼, "Reverse Demon")
- **Effect:** cancels an opponent's Kidō by hitting it with a Kidō of identical quality and quantity spinning the
  opposite way; it can also neutralise an opponent's movement. Two users pincering one target = *Hanki Sōsai*.
- **User:** Yoruichi Shihōin. **Tags:** `Absorb/Reflect/Redirect(counter-spell)`
- **Impl:** timed counter (RMB-tap with Kidō stance) during an incoming Kidō → nullified (counter-rotating swirl
  VFX); vs. melee → 0.5 s "neutralise" stun. Hanki Sōsai = co-op variant on a single target.

#### KU03 · Jikanteishi (時間停止, "Time Stop") — **forbidden**
- **Effect:** pulling the palms apart creates a green cuboid of light that expands and halts time for everything
  inside. Using it earns a life sentence in the third level of the underground prison.
- **User:** Tessai Tsukabishi. **Tags:** `Field(time stop)`
- **Impl:** region freeze: entities, projectiles, physics debris and collapsing voxels freeze mid-motion (stunning
  set-piece: a building frozen halfway through falling). Also preserves dying allies. Gated by a story flag.

#### KU04 · Kūkanten'i (空間転位, "Spatial Displacement") — **forbidden**
- **Effect:** teleports a chosen chunk of space — anything from a whole landscape with people in it to a tiny object;
  spells and powers active inside keep running during the transfer. Mis-targeting can be fatal.
- **Users:** Tessai Tsukabishi, Hachigen Ushōda. **Tags:** `Teleport(region)`
- **Impl:** pick a sphere/box (≤ 30 m) → copy its voxels and entities to a destination (overwrite) and leave a clean
  crater behind. "Move a building", "swap the battlefield". A destination overlap with a character = instant kill
  (canon risk). Story-flagged.

#### KU05 · Kagizaki (拘咲, "Arrested Bloom") — Shiba ritual
- **Effect:** Flower-Crane Launch Method 2 for the Shiba **Kakaku Taihō** cannon: occupants are sealed in a Reiryoku
  cannonball (Reishukaku), the platform is bound with four ritual ropes, a black circle is painted, a flame-wrapped arm
  ignites it, the flames sever the ropes and the cannon fires; a second chant from inside steers speed and angle.
- **Users:** Kūkaku Shiba, Koganehiko & Shiroganehiko, Ganju Shiba. **Chant:** two long incantations.
- **Tags:** `Mobility(launch)` `Projectile(self)` · **Impl:** set-piece launch across the map with in-flight steering;
  impact crater on the Shakonmaku/landing site.

#### KU06 · Keikaigi (繫界儀, "World-Tying Rite")
- **Effect:** ties the space between worlds to open a **Garganta** to Hueco Mundo between two great wooden posts set
  in rock formations.
- **User:** Kisuke Urahara. **Chant:** long. **Tags:** `Teleport(portal)` · **Impl:** story portal between worlds.

#### KU07 · Noren Mekuri (暖簾捲り, "Curtain Flip")
- **Effect:** the caster grips thin air and peels away an illusion/concealment; the revealed thing glows blue-violet
  as it fades in.
- **User:** Shinji Hirako. **Tags:** `Sensing(dispel)`
- **Impl:** cone dispel: strips Kyokkō, ordinary stealth fields and illusory clones in range. It cannot undo
  Hachigyō Sōgai (canon: standard Kidō can't), and Kyōka Suigetsu's complete hypnosis is a dossier-level exception.

#### KU08 · Sentan Hakuja (千反白蛇, "Thousand-Coil White Snake")
- **Effect:** a long white cloth is spun to wrap targets in its coils; it tightens, flashes white, and teleports them
  elsewhere.
- **Users:** Kaname Tōsen, Gin Ichimaru, Tokinada Tsunayashiro (N). **Tags:** `Bind` `Teleport(group)`
- **Impl:** wraps everyone in 3 m (allies or enemies) → teleport to a preset/marked point (extraction, kidnap).

#### KU09 · Jigoku no Kidō (地獄鬼道, "Hell Kidō") (Mv — *The Hell Verse*)
- **Effect:** a special spell *granted* by the Captain-Commander rather than learned: a blue double-diamond charm runs
  golden down the caster's arms and strikes the target, who is bathed in blue light and expelled from Hell to the
  Human World from any depth — but only after the Gates of Hell have been broken open by someone else.
- **User:** Renji Abarai (Mv). **Tags:** `Teleport(realm escape)` · **Impl:** Hell-map escape item/ability.

### 1.11 Kaidō (healing Kidō)

- **Mechanics:** no names, numbers or chants. Palms held over the wound glow **green**. The healer first restores the
  patient's Reiatsu, then rebuilds the body using the patient's restored Reiatsu plus the healer's own. Full use needs
  medical knowledge — the healer must *visualise* the organs being rebuilt. Invented by Tenjirō Kirinji, which earned
  him his Royal Guard post (Kidō as a whole was invented by an unnamed Shinigami who, per Kubo, was never promoted).
  All Academy students learn the basics.
- **Proficiency tiers (Kubo Q&A):** stop bleeding in battle ≈ 30 % of Shinigami; pain relief (4th Division baseline)
  < 10 %; heal physical injuries ≈ 5 % (most captains, Rukia — but not Renji, Kenpachi, Ikkaku, Suì-Fēng); restore
  internal organs ≈ 2 %.
- **Known users:** Tenjirō Kirinji, Retsu Unohana, Isane & Kiyone Kotetsu, Yoruichi, Ukitake, Hachigen, Tessai, Momo,
  Izuru Kira, Hanatarō Yamada, Rukia, Nanao, Nayura Amakado.
- **Tags:** `Heal/Reject`
- **Impl:** hold-to-channel (self or ally in 2 m). Tier unlocks: **T1** cleanse `bleed`; **T2** cleanse
  stagger/fear + small HP regen; **T3** strong HP regen and **re-attach a held severed limb** (restores character
  voxels); **T4** revive from the "critical/organ" state. Restores Reiryoku alongside HP. Kaidō **does not** rebuild
  world voxels (that is Orihime-style rejection, not Kidō).

### 1.12 Other-media-only Kidō

| Name | Source | Effect | Tags |
|---|---|---|---|
| Keikatsu (啓活, "Opening Revival") | (G) *The 3rd Phantom* | heals one ally | `Heal` |
| Meiyu (明癒, "Luminous Healing") | (G) *The 3rd Phantom* | heals up to five allies in a small area | `Heal(area)` |
| Shimoku (紫木, "Purple Tree") | (G) *The 3rd Phantom* | poisons the opponent | `Status(poison)` |
| Sōeigeki (蒼霙撃, "Blue Sleet Attack") | (G) *The 3rd Phantom* | freezes the opponent | `Status(freeze)` |
| Kidō Cannon (鬼道砲, Kidōhō) | (Mv) *Memories of Nobody* | a crystal-tipped tower powered by hundreds of Shinigami; its blast takes roaring animal shapes, can wipe out a small dimension and even damages the worlds; burns itself to scrap after one shot | set-piece `Beam` SDC6 |
| Jūsō Ittō Kasō (重奏・一刀火葬) | (G) *Brave Souls* name for Azashiro's multi-cast Ittō Kasō | see H96 | — |

### 1.13 Kidō combos, chains & interactions

| Combo / rule | Canon basis | Game rule |
|---|---|---|
| **Hainawa → Rikujōkōrō** | B61 can form from B04's light | B61 instant-casts on a Hainawa-bound target. |
| **Rikujōkōrō + Sōren Sōkatsui (Nijū Eishō)** | Rukia vs. Aaroniero | Signature pair for Rukia's Tab wheel. |
| **Kidō net + Fushibi + Shakkahō** | Momo's trap | B37/net placement → H31 detonation → H12 chain blast. |
| **Kyokkō on traps** | Momo hides trap Reiryoku | Any placed construct can be stealthed. |
| **Kin → Bankin** | #99 parts 1 and 2 | Bankin's Prologue is free on a Kin-bound target. |
| **Four Gates → Shijū Saimon** | Hachigen | Four gate casts on one target fuse into the containment prison. |
| **Dankū vs. ≤ #89** | Byakuya's statement, Aizen vs. Tessai | Tier rule in §1.5. |
| **Hanki** | Yoruichi | Universal Kidō parry for Masters (proposal: Masters get a weaker Hanki parry). |
| **Hollow mask amplifies Kidō** | Hachigen's masked Bakudō beheading Gillians | `FormMult = 1.5` for masked Visored. |
| **Erosion vs. time powers** | Respira dissolving Roppō Fūjin | Time-acceleration erodes Kidō constructs ×20. |
| **Kidō is Reishi** | Sklaverei absorbs spiritual abilities (Orihime's shield) | Quincy in Vollständig can absorb Kidō constructs/projectiles (§2.4). |
| **Cero Doble eats Kidō** | Kubo Q&A: it can swallow non-Cero attacks | Nel can absorb and return Hadō. |
| **Reiatsu overpowers spells** | Aizen shrugging off weaker abilities | Bind/Status Kidō fail if target ΔRL ≥ 4 (§3.3). |
| **Hakudan Keppeki vs. Quincy** | Nanao's wall | Race-filtered barrier. |

---

## 2. Race kits / universal layers

Every character = **race layer** (this section) + **form layers** (Shikai/Bankai, Resurrección, mask,
Vollständig…) + **personal kit** (dossier). The race layer fills any control slot the dossier doesn't override.

### 2.0 Cross-race comparison

| Aspect | Shinigami | Hollow / Arrancar | Visored (Hollowfied Shinigami) | Quincy | Fullbringer |
|---|---|---|---|---|---|
| **Power source** | Own Reiryoku through body and Zanpakutō | Own (Hollow) Reiryoku; devoured souls; Reishi-rich air feeds small Hollows | Shinigami + inner Hollow ("dual" Reiatsu) | **Ambient Reishi** gathered + own Reiryoku (power depends on the environment) | Souls inside matter, Hollow-derived Reiryoku, physical stamina |
| **High-speed move** | **Shunpo** — trained body | **Sonído** — turns the body's Reishi into "something that isn't Reishi"; instinctive | Shunpo (Ichigo's Hollow forms also Sonído) | **Hirenkyaku** — rides a Reishi current under the feet; most energy-efficient | **Bringer Light** — pulls the soul of the ground (elastic launch) and air (acceleration) |
| **Canon sound/look** | Swish, or silent | Booming/static "*bun*" | — | Gliding on Reishi | Green flicker before each burst |
| **Sensor visibility** | Emits Reiatsu → readable by Pesquisa | **No Reiatsu while moving** → bypasses Pesquisa | Mask on: reads as Hollow | Emits | (Hollow-like, standard type) |
| **Air movement** | Reishi footholds | Reishi footholds | Same | Reishi platforms (even in the Garganta, easily) | Pull air/water souls (walk on water) |
| **Defense layer** | Reiatsu hardening, blade guard, Kidō barriers, Utsusemi | **Hierro** steel skin; High-Speed Regeneration (some); release heals | + mask endurance; mask reforming to block fatal blows | **Blut Vene**; Ransōtengai; Vollständig shields | Clad-type Fullbring armour |
| **Energy projectiles** | Hadō Kidō; Zanpakutō techniques | **Cero**, **Bala**, Gran Rey Cero, Cero Oscuras | Cero + amplified Kidō | **Heilig Pfeil**, Seele Schneider, Gintō spells | Object-specific |
| **Energy colors** | Personal Reiatsu + fixed Kidō colors | Crimson Cero default + personal colors | Personal Cero colors | Light blue (traditional); Vollständig personal colors | Green |
| **Sensing** | Reikaku (Reiatsu perception); B58 tracker, B77 broadcast | **Pesquisa** pulse; Indice Radar | Shinigami sense; signature flips to Hollow when masked | Acute Reiatsu perception; Vollständig sees through concealment if stronger | Sense Reiryoku |
| **World travel** | Senkaimon + Jigokuchō (else the Dangai) | **Garganta** (Kūmon / Descorrer); Negación rescue | Senkaimon (Hollowfied Tōsen could also open Garganta) | **Shadow** (Wandenreich gift) | — |
| **Healing** | Kaidō | HSR; Resurrección heals on activation | (Tōsen/Ichigo-Hollow HSR) | Sklaverei heals minor wounds; Blut Vene stops bleeding | — |
| **Forms** | Shikai → Bankai (+ Shunkō, limiter release) | Resurrección → Segunda Etapa; partial / permanent release | Hollow mask (+ Bankai), Hollow forms | Letzt Stil (one-shot) / Vollständig (+ Sklaverei) | Fullbring stages |
| **Classic weaknesses** | Wrist vents sealed; Saketsu/Hakusui pierced; decapitation | Head/organs (HSR can't fix); Quincy arrows destroy outright | Mask time limit; fear blocks the mask | Hollow Reiatsu is poison; Reishi-poor areas; Auswählen | Stamina; object loss |
| **Garb identity** | Black shihakushō, white under-kimono | White, color-inverted shihakushō, black sash; Hollow hole + mask fragment | Shihakushō + skull mask | White high-collared tunic, crosses / Quincy Zeichen | Street clothes |

**Shift-move visual signatures** (canon cues + **proposal** for rendering):

| Move | Departure | Travel | Arrival | Audio | Sensors |
|---|---|---|---|---|---|
| Shunpo | One-frame stretch smear; black cloth afterimage dissolving into dark motes; small dust/leaf ring from the leg push (absent for Masters) | invisible | Haori/sleeves snap and settle | soft "shun" whoosh (Masters silent) | visible to Pesquisa |
| Sonído | Body flickers with static/glitch distortion | invisible, no trail | Static crackle; brief chromatic tear | deep "*bun*" boom; 1 m air-shock shakes dust, can crack glass | **hidden** from Pesquisa/sensing, breaks lock-on 0.3 s |
| Hirenkyaku | Pale-blue Reishi plate/stream forms under the soles | Glide pose (feet together, no running), thin light streak | Reishi motes scatter | airy hiss | visible |
| Bringer Light | Green flicker luminescence | Bouncy arc; ground under the foot bulges like rubber | Elastic rebound ripple | springy "thoom" | visible |
| Shunkō dash | Elemental burst (Yoruichi lightning, Suì-Fēng wind) | Damaging trail | Shockwave | thunder/wind | very visible |

### 2.1 Shinigami

#### 2.1.1 Physiology & base rules
- Bodies of pure Reishi with large Reiryoku; invisible to non-aware humans; live for centuries (Yamamoto, Unohana,
  Royal Guard: thousands of years and more).
- **Durability:** they survive stabbings, dismemberment, even being cut in half with treatment; **decapitation** is the
  only sure kill → engine: "critical" state instead of death from torso cuts; head separation = KO/kill.
- **Reiatsu never stops while the heart beats** (why Aizen had to be imprisoned rather than executed).
- **Wrist Reiatsu vents:** if sealed, the Shinigami is incinerated from within (KS03 exploits this).
- **Saketsu (鎖結) & Hakusui (魄睡):** spiritual organs; piercing both seals the Shinigami's powers, usually for good
  (Byakuya's Senka targets them; Uryū's Seele Schneider hit the equivalent spot on an Arrancar and stripped her
  release) → `Status(power seal)` on a precise strike.
- **Spirit Class** (霊威, 1–20, 1 densest): captains 1–3, lieutenants 4–5; Kaien entered the Academy at 6. Class ≤ 3
  bodies can't dissolve back into Soul Society (Konsō Reisai sends them to Hell) → used for the RL scale (§3.1).
- Using Reiryoku makes them hungry (flavour).

#### 2.1.2 Hohō — Shunpo (瞬歩, "Flash Steps")
- **Canon:** the peak of Hohō footwork; speed is measured by how few steps cover a distance. Rusty or weak users need
  more steps and tire quickly. Per Kubo it has three stages: **Joritsu** (序立, opening stance) → **Bakkyaku** (抜脚,
  drawing the leg) → **Shunpo** (the move); Tenjirō Kirinji's Bakkyaku was legendary. Onmitsukidō specialise in it;
  Yoruichi is the "Flash Goddess" (瞬神 *Shunshin*); Kirinji was "Lightning-Fast Tenjirō".
- **Animation spec (proposal):** 2-frame stance + 1-frame leg draw + vanish; Masters compress stance+draw to 1 frame.
- **Tiers (wiki rosters → game numbers, proposal):**

| Tier | Roster | Step | Chain before winded | Recovery | Perks |
|---|---|---|---|---|---|
| Master | Aizen, Ichibe'e, Kirinji, Nimaiya, Byakuya, Suì-Fēng, Shunsui, Yoruichi, Ukitake, Urahara, Yamamoto, Ichigo · (A) Kōga | 15 m (Yoruichi 20 m) | 8 (Yoruichi 12) | 0.6 s | no dust tell; Utsusemi; chant kept through Shunpo |
| Expert | Renji, Love, Kirio Hikifune, Shinji, Hisagi, Hitsugaya, Nanao, Iba, Gin, Komamura, Ginrei, Rukia, Isshin, Mayuri, Nemu, Kensei, Ōmaeda, Rose, Yūshirō, Senjumaru, Tōsen, Lisa | 10 m | 5 | 1.0 s | air Shunpo |
| Practitioner | Yumichika, Momo, Kira, Isane, Ikkaku, Rangiku, Unohana, Hachigen, Sasakibe, Kenpachi | 6 m | 3 | 1.5 s | — |
| None | Hanatarō | — | — | — | walks/runs |

- **Advanced Shunpo techniques** (dossier-specific, listed here as shared primitives):

| Technique | Canon | Users | Tags / impl |
|---|---|---|---|
| **Utsusemi** (空蝉, "cicada shell"; Onmitsu Hohō, 3rd of the Shihō) | Dodge so fast a lifelike afterimage stays behind — it can even look wounded; fools Shunpo/Sonído masters | Yoruichi, Byakuya; (A) Suì-Fēng | `Afterimage/Clone` — perfect-timed Shift during an enemy hit: a decoy takes the hit (Byakuya leaves his scarf/haori) |
| **Senka** (閃花, "Flash Blossom") | Appear behind and strike Saketsu + Hakusui in two lightning cuts; victim can't tell front from back | Byakuya; Hikone (N) | `Teleport(behind)` + `MeleeArc` ×2 + `Status(power seal)` (mooks) / heavy damage (bosses) |
| **Speed Clones** | ≥ 15 short-lived clones that mirror her movements | Suì-Fēng | `Afterimage/Clone` swarm that splits enemy lock-on |

#### 2.1.3 Shunkō (瞬閧, "Flash War Cry") — Hakuda + Kidō
- **Canon:** the highest Hakuda art: Kidō is driven into the arms, legs and back and can be fired from the body; it
  manifests as an element (wind, lightning, fire…). The backless, sleeveless **Keisen Shōzoku** exists because sleeves
  and back are torn apart when Shunkō fills them. Concentrating it on one body part stops attacks from piercing there.
  Yoruichi invented it; Suì-Fēng rediscovered it.
- **Variants:** Suì-Fēng's wind Shunkō → **Mukyū Shunkō** (無窮, "Tireless" — Reiatsu revolves round her like a
  perpetual vortex, so she can hold it indefinitely); Yoruichi's lightning Shunkō → **Raijin Senkei** (雷神戦形, drum
  ring on the back, bangs rise like horns, giant lightning column) and **Raijū Senkei: Shunryū Kokubyō Senki**
  (雷獣戦形・瞬窿黒猫戦姫 — lightning claws/fur on limbs, tongue, ears, hair; her Reiatsu shifts 48 times a second, which
  defeats adaptation-based powers like Askin's; she turns cat-like and can't understand speech).
- **Universal implementation (for anyone who has it):** `Stance` on **G**: Reiatsu aura on back/arms (shirt voxels
  shred away), `Shift` becomes an elemental dash that damages what it passes, LMB strikes emit short elemental
  shockwaves (`GroundWave`/`Blast` SDC1–2), **hold RMB** = "concentrated Shunkō" local hardening (block piercing on the
  guarded side). Golden-yellow Reiatsu for Yoruichi's (Reiatsu color table).

#### 2.1.4 Zanjutsu (斬術, swordsmanship)
- **Canon:** the formal sword style taught at the Shin'ō Academy — shameful for a Shinigami not to master. Distinct from
  general sword skill (Grimmjow, Uryū, Tsukishima fight well without it) and from Zanpakutō training (Jinzen).
  Kendō is one of its arts (Unohana a master). **Specialised variants:** whip-sword mastery (Renji's Zabimaru, hardest
  lieutenant blade), dual-wielding (Shunsui, Ukitake, post-reforge Ichigo).
- **Universal LMB chain (proposal):** kendō-based katana string: 4-hit chain (kesa-giri → gyaku-kesa → yoko → tsuki);
  forward = lunging thrust; back = rising launcher (kiri-age); air chain = 3 slashes; down-in-air = overhead cleave
  (karatake-wari) that craters (`MeleeArc(smash)`); sprint = iai draw-cut (`MeleeArc(cut)`).
  **Hold LMB** = Reiatsu-charged cut: blade aura → `MeleeArc(cut)` that splits structures at captain RL (canon:
  Kenpachi's Reiatsu shockwaves, Renji channelling Reiatsu through the blade).
- **Tier rosters (wiki):**
  - *Master swordsmen:* Aizen, Suì-Fēng, Shinji, Hitsugaya, Ichibe'e, Gin, Kenpachi Kiganjō, Komamura, Byakuya, Isshin,
    Shunsui, Kensei, Nimaiya, Tōsen, Unohana, Urahara, Yamamoto, Kenpachi Zaraki, Kirinji, Renji, Ichigo, Ikkaku ·
    other media: Amagai, Seizo Harugasaki, Kōga Kuchiki, Kenpachi Kuruyashiki.
  - *Expert:* Love, Yumichika, Tatsufusa Enjōji, Momo, Hisagi, Iba, Kinroku Izuhara, Kira, Rukia, Mayuri, Rangiku,
    Danjirō Obana, Ōmaeda, Rose, Furōfushi Saitō, Hiyori, Kaien, Chigiri Shijima, Ukitake, Lisa, Yachiru.
  - *Swordsmen:* Shinobu Eishima, Izaemon Tōdō, Heizō Kasaki, Miyako Shiba, Hachigen, Hanatarō.
- **Named Zanjutsu moves (for dossiers):**

| Move | User | What it does | Tags |
|---|---|---|---|
| Agitowari (顎割) | Isshin | One cut from the jaw down, halving the foe | `MeleeArc(cut)` |
| Beautiful Swordfight | Yumichika | Rapid repeated two-handed clashes | melee flurry |
| Deadly Darts | Ichigo (Shikai Zangetsu) | Throws the blade by its cloth like a flail; can wreck buildings | `Projectile(tethered blade)` |
| Hitotsume: Nadegiri (一ツ目・撫斬) | Yamamoto | Ultra-precise, ultra-fast cut through multi-storey armoured foes; victims notice late | `Slice` |
| Hōzan Kenbu | Tatsufusa Enjōji (A) | Whirling blade guard around the whole body | `Stance` |
| Hōzuri (頬摺) | Urahara | Precise grazing slash | `MeleeArc(cut)` |
| Ichigo Homerun | Ichigo | Backhand bat-swing | launcher |
| Onibi (鬼火) | Yamamoto | Blunt thrust punching a gaping cylindrical hole | `MeleeArc(smash)` bore |
| Ryōdan (両断) | Kenpachi | Two-handed overhead halving cut; overpowered a Resurrección | `Slice` |
| Senmaioroshi (千枚卸) | Lisa | Blade flurry that shreds a target | `MeleeArc` multi |
| Shitonegaeshi (褥返し) | Urahara | Coercive pin — cane tip hovering at a downed foe's face | `Status(intimidate)` |
| Suikawari (西瓜割) | Hiyori | Two-handed skull-splitting overhead | `MeleeArc(cut)` |

#### 2.1.5 Hakuda (白打, unarmed combat)
- **Canon:** high-speed martial arts (*taijutsu*); Onmitsukidō specialty; the Detention Unit head must be a Hakuda master
  because the Nest of Maggots is weapon-free. Masters take on armed foes and giants barehanded.
- **Universal use (proposal):** **Disarm** status (weapon knocked away → the Zanpakutō becomes a pick-up object in the
  world) switches LMB to a Hakuda chain (jab-cross-elbow-roundhouse; back = rising knee launcher; down-air = axe-kick
  slam). Everyone keeps a **grab/throw** (Z or LMB+RMB): Taketonbo-style flip.
- **Tier rosters (wiki):** *Masters:* Aizen, Suì-Fēng, Komamura, Mashiro, Kensei, Yoruichi, Yūshirō, Urahara, Yamamoto ·
  *Experts:* Hisagi, Iba, Isshin, Nemu, Ikkaku, Hiyori, Kūkaku, Chika Shihōin, Tessai, Lisa · *Combatants:* Hitsugaya,
  Byakuya, Rukia, Shunsui, Eikichirō Saidō, Tōsen, Love, Unohana · *Practitioners:* Makizō Aramaki, Rangiku.
- **Named Hakuda moves (for dossiers):**

| Move | User | What it does |
|---|---|---|
| Bukkomi Dogeza | Iba | Advanced sliding prostration (comedy apology) |
| Chikangoroshi Savate / Toekick | Rangiku | Shin kick that launches / toe kick to the face |
| Chōhigezutsuki | Isshin | Headbutt that sends the foe flying |
| Gatling Mad-Stomping | Hiyori | Rapid face-stomps (shattered Ichigo's mask) |
| Ikkotsu (一骨) | Yamamoto | Punch that caves the abdomen and hurls the foe down a street through a building |
| Isshin Flying Double Knee / Handstand Dash | Isshin | Leaping double-knee / handstand sprint |
| Kagamibiraki (鏡開) | Love | Finger-stab into the torso, then rips the foe in half |
| Kazaguruma (風車) | Suì-Fēng | Airborne scissor-kick that sends the target flying |
| Kūkaku Heel Crush / Smash | Kūkaku | Heel drop / hammer fist to the skull |
| Mashiro Kick / Drop Kick / Super Kick | Mashiro | Chain kicks (break a Gillian mask); crater drop-kick that cancels a Cero; rising kick that killed Hooleer |
| Oni Dekopin | Isshin | Finger flick that sends a foe through several structures |
| Panty-Flash Tornado | Lisa | Upside-down spinning split kicks |
| Raiōken (雷王拳) | Yoruichi | Ultra-fast two-arm barrage (cracked Hōgyoku-Aizen with anti-Hierro gear) |
| Sandbag Beat | Kensei | Ultra-fast strike flurry that destroyed a Menos |
| Super Harisen Slipper | Hiyori | Slipper slap through walls and a Hachigen barrier |
| Sōkotsu (双骨) | Yamamoto | Two-fisted punch that destroys in one blow |
| Taketonbo (竹蜻蛉) | Yoruichi | Spinning flip-throw onto the back |
| Takigoi (滝鯉) | Suì-Fēng | Block-then-counter pattern that opens a guard |
| Tesshō (鉄掌) | Tessai | Open palm that shatters a Hollow's head |
| Tsukiyubi (撞指) | Shunsui | Two-finger Reishi push at point-blank range |
| Tsurigaki (吊柿) | Suì-Fēng, Yoruichi | Wrap the incoming limb and pivot into a counter |

#### 2.1.6 Zanpakutō rules (shared by every Shinigami kit)
- **Sealed forms:** katana (most), wakizashi (Gin), ōdachi (Kenpachi), tantō (Iba), or disguised (Yamamoto's walking
  stick, Urahara's cane sword). **Size reflects Reiryoku** — captain-class users must actively hold the size down or
  wield building-sized swords (fun rule: a maxed C-flare visibly grows the blade, proposal).
- **Shikai (始解):** shout the release call (*Kaigō*) + the name; requires harmony with the spirit. Mental instability
  breaks the bond → `Status(despair)` blocks T. A **wrong name** gives a weaker, altered release (Yumichika's
  "Fuji Kujaku"). Bankai users may release Shikai without the call. Kidō-type Shikai may not change the blade's shape.
- **Bankai (卍解):** requires materialising and subduing the spirit; normally 10+ years (Urahara's Tenshintai: 3 days,
  lethal beyond). Power **5–10× Shikai** plus a big Reiatsu surge. Can keep evolving; a suppressed/false Bankai is
  weaker until the spirit acknowledges the wielder. **Drawbacks:** needs ~10 years of practice or the user can lose
  control/injure themselves; **a broken Bankai never fully recovers** (exceptions: Komamura's heals with him,
  Hitsugaya's regrows from moisture, Mayuri rebuilds his; Nimaiya reforging or Orihime's rejection also fix it); a
  Bankai vanishing without the user's consent signals imminent death; maintaining it drains Reiryoku — when drained
  it can't be held or re-activated.
- **Types:** Melee/"Power" (incl. *Projectile* subtype that flies independently), **Kidō-type** (Ice, Fire, Water
  subtypes; **one element per Zanpakutō**), Constant-release (Ichigo), Dual (Shunsui, Ukitake, Kazeshini, reforged
  Zangetsu); novels add living-type, anime adds illusion-type.
- **General powers:** Konsō, Hollow purification, Senkaimon key (below). A broken sealed/Shikai blade regrows from the
  wielder's will if the hilt survives. Unconsciousness reverts the sword to sealed (immense-Reiryoku users stay in
  Shikai). Some blades use powers sealed (Hanatarō's healing Hisagomaru, Rose's Arpeggio, Ichibe'e's Ichimonji).
- **Arrancar contrast:** an Arrancar sword is the sealed core of its Hollow power; released by Resurrección only;
  broken sword = no release. Tōsen is the only known wielder of Shikai + Bankai + Resurrección.

#### 2.1.7 Duties, tools & travel
- **Konsō (魂葬, Soul Burial):** tap the hilt's pommel to a Plus's forehead → a glowing crest appears, the soul sinks
  into a pool of blue light toward Soul Society and a Jigokuchō flutters from the spot (pressing too hard hurts).
  `Z` interaction on Plus NPCs (chained ghost civilians) — prevents them decaying into Demi-Hollows (proposal).
- **Hollow purification:** a Hollow killed by a Zanpakutō is cleansed of its Hollow sins: mask splits, body dissolves
  into light, the human soul ascends; souls with grave human-life sins summon the **Gates of Hell** instead (cinematic).
  A Hollow killed by a **Quincy** is annihilated soul and all (§3.8).
- **Senkaimon (穿界門):** thrust the Zanpakutō into the air and turn it like a key ("*Kaijō!*" — "Unlocking!") → a
  traditional Japanese doorway with shōji panels appears, doors open on white light. Travellers need a **Jigokuchō**
  (black body, purple wings with black edges) or they are dumped into the **Dangai**: a corridor with the **Kōryū**
  current that traps anyone touching the walls and the **Kōtotsu** "cleaner" (bullet-train-shaped, golden eye) every
  7 days; time inside runs ~2 000× denser. The permanent gate is run by the Kidō Corps; noble houses have private
  ones. Variants: Reishi Henkanki (converts Kishi bodies to Reishi), **Tenkai Ketchū** (four pillars swap a one-Reiri
  area with a replica — Fake Karakura), Chōkaimon (Royal Guard direct gate).
  → `Teleport(portal)` for fast-travel/escape with a 2 s cast; the Dangai is a chase level.
- **Gentei Reiin (限定霊印) limiter:** captains/lieutenants entering the Human World are sealed to ~20 % output (a mark
  shaped like their division insignia); "*Gentei Kaijo*" releases it on approval; skipped in emergencies. The Royal
  Guard wear an even stronger Blood-Oath seal. → map rule §3.10.
- **Mission kit:** Gigai (artificial body), **Gikongan / Soul Candy** (pill that pushes the soul out and runs the body
  with an artificial personality — Chappy & co.), **Gokon Tekkō** (red fingerless glove with a blue-flamed skull; shoves
  souls out of bodies), Substitute Shinigami Badge (leave the body; Hollow alarm), Denreishinki (phone + Hollow
  alerts), Kikanshinki (memory-replacement puff for witnesses), Jigokuchō messengers.
  → "Leave the body" mechanic for living Shinigami (Ichigo, Substitutes): the human body stays behind as an NPC object
  (or runs around under a Mod Soul).

#### 2.1.8 Shinigami race signature (summary)
- **Movement:** Shunpo (see visual table above); air-standing on Reishi footholds.
- **Defense layer:** Reiatsu hardening (§3.3) + blade guard/parry + Kidō shields (B08, B39, B73, B81) + Utsusemi (Masters).
- **Projectile family:** Hadō Kidō (fixed per-spell colors) and personal Zanpakutō energy (Getsuga-type).
- **Colors:** personal Reiatsu color (table §3.2); Kidō colors as catalogued; Kaidō green; Senkaimon white; Konsō blue.
- **Sensing:** Reikaku — everyone with Reiatsu half-"sees" with it; patterns of friends are recognisable at range,
  including their mental/physical state; can suppress own Reiatsu to hide; Kidō trackers (B58) and broadcast (B77).

#### 2.1.9 Shinigami universal kit layer (sealed form defaults)

| Input | Universal move | Notes / variants |
|---|---|---|
| WASD / Space / Ctrl | Move · jump & **air-step on Reishi** (hold to climb) · descend | everyone with Reiatsu can stand on air |
| **Shift** | **Shunpo** step (tier table) | double-tap + lock-on = behind target; Masters: perfect-dodge → **Utsusemi** |
| LMB | Zanjutsu chain (kendō string, directional variants) | disarmed → Hakuda chain |
| Hold LMB | Reiatsu-charged cut `MeleeArc(cut)` | splits structures at captain RL |
| RMB | Blade guard / timed parry | Kidō Masters: tap during incoming Kidō = weak **Hanki** |
| Q | **Hadō quick-slot** (character's go-to: H04 / H31 / H33 / H63) | tap = Eishōhaki, hold = chant |
| E | **Bakudō bind slot** (B04→B61, B63, B30) | combos per §1.13 |
| R | **Kidō shield slot** (B39 / B81 / B08 / B73) | |
| F | **Kaidō** (hold) if T1+; else Hakuda grab/throw | |
| Z | **Konsō / purify** contextual (pommel tap) · otherwise character skill | finisher on downed Hollow = purification cinematic |
| X | **Senkaimon** (2 s cast: escape/fast travel) or character skill | |
| G | Special state — character-specific (Shunkō, Hollow mask, eyepatch, …); generic: **Gentei Kaijo** in the Human World | |
| C (hold) | Reiatsu flare (§3.2) | aura shape per character |
| T / hold T | Shikai (Kaigō + name) → T again Bankai · hold T = seal back | §3.6 multipliers |
| V | Ultimate (dossier); generic fallback: best Hadō the character knows at full chant | |
| Tab (hold) | **Kidō wheel** — all known spells; "pair" mode for Nijū Eishō (Experts+) | |

### 2.2 Hollow & Arrancar

#### 2.2.1 Hollow classes (enemy-design layer)

| Class | Canon traits | Signature skills | Game notes |
|---|---|---|---|
| **Demi-Hollow** | Earthbound spirit turning Hollow, chained to a territory; hard to sense | — | spawns from neglected Pluses (proposal) |
| **Hollow** (common) | White skull mask grown from the lost heart (can crack and regrow); hole in chest; shapes vary wildly (pet-sized to huge) | acidic grab (burns humans), soul-body separation (rip a living soul out), unique powers | mask is the weak point (split mask = kill) |
| **Huge Hollow** | Building-sized ordinary Hollow | as above | coarse-voxel giant |
| **Gillian** (Menos) | 2–6 storeys; white long-nosed mask, black cloak-like body, white neck spikes, bandaged pointed feet, rarely-seen white clawed hands, long tongue | **Cero, Kūmon, Negación** | slow, mindless; crowds; captain-class one-shots |
| **Adjuchas** | Smaller, smarter, solitary, varied (bulky humanoids to Grimmjow's panther) | **Cero, Garganta** | lieutenants of Gillian packs |
| **Vasto Lorde** | Human-sized; rare (countable on two hands); above captain level | **Cero, Sonído** | most Espada were Vasto Lorde |
| **Arrancar** | Mask removed → humanoid, hole remains, mask fragment, Zanpakutō | full kit below | |
| **Jigoku no Gaki** (Hell) | Huge Hell-born Hollows with rings and chain patterns; **emit no Reiatsu** | — | invisible to all sensing (stealth ambushers) |

Menos evolve by devouring other Hollows; losing a bite of oneself ends evolution (flavour for AI: Hollows try to bite
chunks out of each other).

#### 2.2.2 The Cero family (虚閃, Sero)

**Canon basics:** a concentrated blast of spiritual energy used by Menos, Arrancar and Visored. Usually fired from the
mouth, but also from hands, fingers or other body parts, normally from a set pose (Starrk needs none). Charge time
ranges from long build-ups to instant shots; power, speed and blast area scale with the user. Most are crimson.

**Standard Cero implementation:** `Beam` (or `Projectile(orb)` for orb-style users) — **hold** to charge a growing
sphere at the fire point (mouth/palm/finger/tongue/horn per dossier), **release** to fire; the beam can be swept for
~1 s. Bores a cylinder through terrain whose diameter grows with charge (0.5 → 4 m) and ends in a `Blast` (SDC2 for
an Arrancar, SDC3 for Espada). **Cero clash:** two beams meeting push against each other; the higher `RL × charge`
wins and continues. **Swat rule:** a heavy melee/Kick with RL ≥ the shooter's can deflect or cancel a Cero (Mashiro's
Drop Kick, swords cutting Ceros).

**Cero colors (wiki table):**

| Color | Users |
|---|---|
| Crimson (default) | Zangetsu (Hollow), Hiyori Sarugaki, Menoly, Yammy, Grimmjow, Apacci, Hammerhead Arrancar, Battikaroa, Dordoni, Ayon, Michel, Guardians of the Forest of Menos |
| Magenta | Ggio Vega, Kūgo Ginjō (anime) |
| Indigo | Findorr Calius, Muramasa |
| Burnt orange | Mila Rose, Kensei Muguruma |
| Green | Ulquiorra Cifer, Choe Neng Poww |
| Lime green | Lilynette, Mashiro Kuna, Kaname Tōsen |
| Golden yellow | Nnoitra, Tier Harribel, Dondochakka, Patros, Shinji Hirako (TYBW anime; original anime: crimson) |
| Cyan | Nirgge Parduoc, Love Aikawa |
| Blue | Coyote Starrk, Lisa Yadōmaru |
| Violet | Nelliel, Pesche, Wonderweiss, White, Ichigo Kurosaki, Rōjūrō Ōtoribashi |
| Pink | Charlotte Chuhlhourne, Cyan Sung-Sun, Szayelaporro, Hachigen Ushōda |

**Cero variants:**

| Variant | Kanji | Users | Canon effect | Visual | Tags / implementation |
|---|---|---|---|---|---|
| **Gran Rey Cero** ("Grand King Cero") | 王虚の閃光 | Espada; Ichigo (Merged Hollow Form) | Blood mixed into the Cero → far stronger and faster, in the user's own color; it spins like a razor, compressing and decompressing, and warps space as it flies. Forbidden inside Las Noches (could wreck it). | Personal color (Ichigo: violet; Grimmjow: blue in the anime — verify) with a pulsing, spinning disc-like front | `Beam(spinning)` — blood-mix animation (bite thumb / cut palm, a drop falls into the charge) → ×4 standard Cero; screen-space warp along the path; nearby voxels jitter and shear (SDC4 terminal). Las Noches map: blocked (§3.10). |
| **Cero Oscuras** ("Black Cero") | 黒虚閃 | Espada **in Resurrección** (Ulquiorra; Yammy charged one in the manga) | Far stronger than a Cero with huge range; pitch-black. Shattered Ichigo's whole mask and blew away half the Las Noches dome; likened to the black Getsuga. | Black core, user-color rim (Ulquiorra: green) | `Beam(huge)` SDC4; mask-break rule: hits on a Hollow mask force it off. Released-form only. |
| **Cero Metralleta** ("Machine-gun Cero") | 無限装弾虚閃 | Coyote Starrk (Los Lobos) | Many Ceros charged round a pistol barrel fire as a continuous barrage; he can re-aim mid-stream. | Blue Ceros in a ring around the gun | `Projectile(multishot, continuous)` hose: area-denial carpet of SDC2 craters; aim can sweep. |
| **Cero Doble** ("Double Cero") | 重奏虚閃 | Nelliel (also child form) | Swallows an incoming energy attack and fires it back fused with her own Cero; Kubo: works on non-Cero attacks (Getsuga, Kidō) too. | Violet; mouth intake swirl | `Absorb/Reflect/Redirect`: hold to open the mouth-cone — absorbs one beam/projectile with tier ≤ her cap, then fires `absorbed power + own Cero`. Child form: tires her (long cooldown). |
| **Cero Sincrético** ("Fused Cero") | 融合虚閃 | Pesche & Dondochakka | Both charge at once and merge into a big swirling sphere fired as a multicolored beam; drains them. Flaw: a fine seam between the two halves — pressure on it splits the blast harmlessly around the target. | Swirled violet/gold rainbow | Duo `Beam`; weakness: a precise hit on the visible seam line splits it into two beams that miss. |
| **Cero Córnea** ("Eye Cero") | 視虚閃 | Tesra Lindocruz | Small but powerful Cero from the pupil; destroys boulders. | Thin eye-beam | Instant, no pose, narrow `Beam` SDC1–2. |
| **Mashiro Super Cero** | 白スーパー虚閃 | Mashiro (masked) | Kicking the air fires a fast, wide lime-green Cero that follows the arc of the kick. | Lime-green crescent | `Projectile(crescent beam)` shaped by the kick path. |
| **La Mirada** ("The Gaze") | — | Kaname Tōsen (Resurrección) | Two round Ceros charge in front of his insect eyes, fuse in the middle, fire as one highly destructive blast. | Lime green | Dual charge → merge → `Beam` SDC3. |
| **Cero Creciente** (name from G) | 月虚閃 | Ichigo (Merged Hollow Form) | A violet Gran Rey Cero charged on his single horn, combined with a Getsuga Tenshō from the long Zangetsu → a huge crescent that wounded Soul-King-empowered Yhwach. | Violet crescent | `Projectile(crescent, slice)` + `Beam`; SDC5. |
| **"Beautiful Charlotte Chuhlhourne's Final Holy Wonderful Pretty Super Magnum Sexy Sexy Glamorous Cero"** | — | Charlotte Chuhlhourne | Joke-named personal Cero. | Pink | Standard Cero, absurdly long callout. |
| Cero Gigante (G) / Hell Verse giant Cero | — | Hollow-Ichigo (Mv/G) | Enormous Cero that broke Hell's chains and damaged the Gates of Hell. | — | ultimate-tier `Beam`. |
| Cero Apocalipsis (G) | — | Hollow-Ichigo (Rebirth of Souls) | Cleave → stomp-pin → point-blank downward Cero. | — | `Grab/Throw` + `Beam` down: drills a pit. |
| Elemental Ceros (Mv) | — | Yin & Yang (*DiamondDust Rebellion*) | Ceros made of lightning/fire, plus rapid small ones. | — | elemental `Beam`. |

Related: Aizen's **Fragor** (Hōgyoku form) resembles a Cero; Ginjō's anime "energy beam" is depicted as a Cero.

#### 2.2.3 Bala (虚弾, "Hollow Bullet")
- **Canon:** Arrancar-only: a bullet of hardened Reiatsu. Weaker than a Cero but **20× faster**, can be fired in quick
  succession, and hits with more concussive force. Strength varies (Yammy's ≈ a heavy punch; Ulquiorra's punch big holes
  in bodies).
- **Colors:** crimson (Ulquiorra, Yammy, Dordoni, Loly, Apacci), pink (Wonderweiss), indigo (Findorr), violet
  (Hollowfied Muramasa).
- **Impl:** `Projectile(bolt, fast)` launched by a **punch** animation (Yammy-style) or a finger flick; tap = single,
  hold = rapid barrage (8/s); ~120 m/s; high knockback; SDC1 dents; cannot be charged. Great for juggling.

#### 2.2.4 Sonído (響転, "echo step")
- **Canon:** the Hollow/Arrancar counterpart of Shunpo/Hirenkyaku, roughly equal in speed but instinctive (no study
  needed). Booming/static "*bun*" sound. Per Kubo it works by converting the body's Reishi into something that isn't
  Reishi, which lets users slip past senses; Ulquiorra: Sonído evades **Pesquisa** where Shunpo doesn't (novel: no
  Reiatsu emitted while moving → ideal for hit-and-run). Zommari claims the fastest among the Espada; Starrk's covers
  such distances it looks like teleportation. Also used by Vasto Lorde, Zangetsu's Hollow side, Ikomikidomoe, and the
  hybrid Hikone (who stacks it with Shunpo, Hirenkyaku and Bringer Light — N).
- **Variants:**
  - **Gemelos Sonído** (双児響転, "twin echo step") — Zommari packs extra steps into each move to leave up to **five**
    after-images that act as clones and are convincing enough to bleed when cut. `Afterimage/Clone` ×5 (clones attack
    with weak copies of his moves; hits on clones show blood VFX).
  - **Galope** (超加速, Nel in Gamuza) — vanishes in a blinding **blue** flash and reappears charging into the foe;
    pushed through Yhwach's flowing darkness for seconds. Child Nel's rudimentary **Chōkasoku** (mask eyes glow, rocket
    tackle). `Teleport` + `Mobility(charge)` with super-armor.
- **Impl:** see Shift table (§2.0): step 12 m for Espada (Starrk 30 m), chain 6; **no Reiatsu trail** (hidden from
  Pesquisa/sense UI, homing/lock-on drops for 0.3 s); boom air-shock 1 m.

#### 2.2.5 Hierro (鋼皮, "steel skin")
- **Canon:** condensed Reiryoku makes the skin steel-hard — enough to stop a Zanpakutō, so Arrancar can fight swordsmen
  barehanded. Strength generally tracks Reiryoku but not strictly (Nnoitra, #5, had the hardest). Not absolute:
  attackers can adapt and cut through (Kenpachi vs. Nnoitra).
- **Impl:** passive damage threshold (§3.4); RMB guard works **barehanded** against blades (no chip); blade-on-Hierro
  VFX: sparks + metallic clang, no blood, faint white scratch lines; G (optional) = **Hierro boost**: threshold ×1.5,
  move speed −15 %.

#### 2.2.6 Pesquisa (探査神経, "search nerve") & Indice Radar
- **Canon:** sends out a radiating pulse that reacts to Reiatsu, locating beings and gauging their real strength;
  Grimmjow's group closed their eyes and meditated to use it. Ulquiorra is the best — he reads power at a glance and
  tracks unseen foes; Sonído slips past it. Users: Grimmjow, Ulquiorra, Nnoitra, Shawlong, Di Roy, Edrad, Nakeem,
  Yylfordt. **Indice Radar** (捜指法, Nnoitra): finger stabbed into the ground sends a glowing **yellow** trail racing
  toward a Reiatsu; once connected it reveals location and Reiryoku amount.
- **Impl:** R tap = quick 25 m pulse; **hold R** = meditative channel (stationary, eyes closed) → 120 m sonar ring
  (proposal: faint white ring rippling over terrain and air) → all non-hidden Reiatsu signatures outlined through walls
  for 8 s with a power readout. Ulquiorra passive: lock-on shows the target's RL. Indice Radar: a yellow line crawls
  along the ground to one chosen signature and stays attached (tracking + RL readout).

#### 2.2.7 Garganta (黒腔), its doors, and Negación
- **Garganta:** the featureless black void between the Three Worlds (it can reach the Dangai too). Reishi storms blow
  inside; travellers must solidify footholds/paths of Reishi (Uryū does it effortlessly; Ichigo and Chad struggled).
  Only Hollows/Arrancar (and Hollowfied Shinigami like Tōsen) open it at will (Kubo).
- **Ways in:**

| Method | User | Canon | Implementation |
|---|---|---|---|
| **Kūmon** (空門, "air gate") | Gillians, Menos | Tearing the barrier between worlds — a spatial distortion | Sky cracks open in a ragged rift; Gillian spawner. |
| **Descorrer** (解空, "untie the sky"; Sp. "draw back") | Espada-level Arrancar | A simple hand gesture opens a stable Garganta they can just walk into; it closes neatly behind and reopens at the destination | X ability: 1 s gesture → black rift with jagged, tooth-like edges (anime look — proposal) slides open; walk in → reposition/escape. |
| **Keikaigi** (Kidō, KU06) | Urahara | Ritual portal between two wooden posts | story portal |
| Device | Mayuri + Nemu | Captured Hueco Mundo tech, two operators | story portal |
| **Garganta Broadcast** | Ulquiorra | Several small Garganta used as screens to show distant fights | picture-in-picture UI / cutscene |

- **Negación** (反膜, "anti-membrane"): Gillians project square beams of light (anime: golden-yellow) that isolate the target
  from the current dimension — impenetrable from outside — and draw them up toward the Menos (Aizen's escape).
  `Field(isolation)`: boss-escape ultimate; anyone inside is untargetable and floats away.
- **Caja Negación** (反膜の匪): Espada punishment cube that mimics Negación, trapping the subject in a pocket dimension
  forever; an Espada breaks out in hours (Ulquiorra: 2–3 h). It must be pushed into the target's **Hollow hole**.
  `Grab` finisher vs. hole-bearing targets → removed from the fight (mooks permanently, Espada for N seconds).

#### 2.2.8 High-Speed Regeneration (超速再生)
- **Canon:** many Hollows, some Arrancar and Hollowfied Shinigami close wounds and regrow lost limbs in moments; most
  Arrancar traded it away for power (Ulquiorra kept it). The brain and internal organs **cannot** regenerate, and enough
  damage at once (or damage faster than healing) still kills. Every Resurrección heals all wounds on activation.
- **Known possessors (wiki):** Ulquiorra, Yammy, Nnoitra, Wonderweiss, Grand Fisher, Abirama Redder, Battikaroa,
  Runuganga, Menos Grande, Kaname Tōsen (Hollowfied), Zangetsu (Hollow), Muramasa (A), Ikomikidomoe, Hikone (N),
  Roka Paramia (N).
- **Impl:** `Heal/Reject(self, voxels)`: severed/destroyed **character voxels** regrow over 1–3 s (Reishi strands knit,
  then flesh voxels pop back in), costs Reiryoku; each body has protected **core voxels** (brain/organ volume) — if
  those are destroyed the regen stops and the character dies. Burst damage above X % HP in 1 s overwhelms it.

#### 2.2.9 Resurrección (帰刃, "returning blade") — rules
- An Arrancar's sword holds the **sealed nucleus of its Hollow power** (formed from the mask piece that broke off);
  release = command phrase + sword name (the blade needn't be fully drawn). It restores the Hollow form and powers:
  large boosts to speed, strength, stamina, durability and Reiatsu, stronger and brand-new techniques, sometimes new
  weapons; usually an animal-like look echoing the old Hollow form. Hōgyoku-made Arrancar's Reiatsu turns fully Hollow.
  **All prior wounds heal** when the release completes. Counterpart of Bankai (Urahara/Mayuri); cannot be repaired if
  damaged while released.
- **Constraints:** the Arrancar can only return to human form by resealing into the sword; changing back any other way —
  or discarding part of the released body — is like losing a limb and is permanent. Too injured or unconscious → the
  form dissipates and the sword rematerialises. **Broken sword = no Resurrección.** An Espada's release is "different"
  and can trigger primal fear in weaker Arrancar. Medallions can't steal it (Hollow power poisons Quincy).
- **Variants:** **partial release** (Grimmjow growing claws unreleased); **constant release** (Aisslinger gave up his
  human form permanently); **Resurrección: Segunda Etapa** (刀剣解放第二階層, Ulquiorra only; Kubo: others could with
  training; Uryū felt its Reiatsu as fundamentally different in kind).
- **Sealed-state powers exist:** Tesra's Plato Colmillo, Aaroniero's Glotonería, Baraggan's Senescencia, Harribel's Ola
  Azul. Arrancar sealed swords vary (axe, scythe, own tentacle-arm, even a person — Lilynette) and can change shape as
  the owner grows.
- **Las Noches rule:** Espada ranked 4 or higher may not release inside, and **nobody** may fire a Gran Rey Cero there.
- **Impl:** T = Resurrección (command callout → Reiatsu eruption column, cocoon/burst transform, **full heal**); T again
  = Segunda Etapa where it exists; hold T = reseal (sword re-forms in hand). "Discard part" = permanent body change for
  the match. Release blocked if the sword is broken.

#### 2.2.10 Arrancar identity markers (for modellers)
Hollow hole (location random per individual), mask fragment (hovers slightly above the skin), **Estigma** face markings
(e.g. Ulquiorra's tear lines, Grimmjow's eye marks), white color-inverted shihakushō with black sash and white-lined
black boots, Espada **number tattoo** (placement per member). Ranks: Espada 0–9 (lower number = more Reiryoku, Yammy is
both 10 and 0), Números numbered 11+ by birth order, Privaron Espada three-digit. Each Espada embodies an "aspect of
death" (solitude, old age, sacrifice, nihility, despair, destruction, intoxication, madness, greed, rage) — use for VFX
motifs. Arrancar given a Quincy Cross can form Spirit Weapons and use Shadow (Wandenreich recruits).

#### 2.2.11 Hollow / Arrancar race signature (summary)
- **Movement:** Sonído (static boom, no trail, sensor-invisible) + air-walk; beasts lunge/leap.
- **Defense layer:** Hierro threshold, HSR (if kept), release heal, Cero clashes.
- **Projectile family:** Cero (beam/orb, charged, posed) + Bala (fast fist bullets) + Gran Rey / Oscuras tiers.
- **Colors:** Cero/Bala color tables above; Garganta black; Negación golden-yellow; released Reiatsu often darker.
- **Sensing:** Pesquisa / Indice Radar; dual-type Reiatsu that "feels Hollow".

#### 2.2.12 Arrancar universal kit layer

| Input | Universal move | Notes |
|---|---|---|
| WASD / Space / Ctrl | Move · air-walk · descend | |
| **Shift** | **Sonído** | double-tap + lock-on = behind; Zommari: Gemelos; Nel: Galope |
| LMB | Zanpakutō chain, or claws/unarmed (Hierro brawler) | directional variants as standard |
| Hold LMB | Reiatsu-coated heavy strike | |
| RMB | Guard (barehanded vs. blades OK) / parry | |
| Q | **Bala** (tap single / hold barrage) | |
| E | **Cero** (hold charge, release; sweep) | fire point per dossier |
| R | **Pesquisa** (tap pulse / hold meditative) | Nnoitra: Indice Radar |
| F | **Gran Rey Cero** (Espada; blood-mix) | forbidden in Las Noches |
| Z | Grab/throw; vs. a hole-bearing foe: **Caja Negación** (Espada only, item) | beasts: **devour** (bite heals) |
| X | **Descorrer** (Espada) — open a Garganta to reposition/escape (travel stays on X for every race) | Números: none |
| G | **Hierro boost** or **partial release** (claws etc.) | |
| C (hold) | Reiatsu flare (Hollow type; Espada release → "primal fear" on weaker Arrancar) | |
| T / hold T | **Resurrección** (heal) → Segunda Etapa · hold = reseal | |
| V | **Cero Oscuras** (released Espada) or dossier ultimate | |
| Tab | **Cero wheel** (standard, Gran Rey, Oscuras, personal variants) | |
| Passive | HSR if kept; Hierro; trail-less Sonído | |

**Hollow-beast kit (NPC monsters):** lunge/leap (Vasto Lorde: Sonído), claw & bite chain, acid grab on humans, devour
to heal/evolve, Cero (Menos+), Kūmon & Negación (Gillian), HSR passive, mask = weak point.

### 2.3 Visored / Hollowfication

- **What:** Hollowfication (虚化, *Horōka*) — a Hollow soul is inserted into another soul and the boundary between
  them is broken, raising the soul's power ceiling; it shows as an inner Hollow and, when controlled, a **Hollow
  mask**. Sources: Aizen's Hollow **White** (Ichigo's case via Masaki), the **Hōgyoku** experiments (the Visored,
  about a century before the story), and infection spread by the first Hollowfied victims through wounds (sickness,
  vomiting white Reishi that starts the mask, then body transformation, faster under stress). A Shinigami of high
  Reiryoku is needed to survive it.
- **Taming:** the Shinigami must defeat the inner Hollow in the inner world, usually within about an hour (Hiyori took
  69 min 2 s, Ichigo 62 min 30 s) — meanwhile the Hollow drives the body and must be held off by others (boss phase).
  On victory the Hollowfied husk cracks and bursts and the Shinigami emerges masked; from then on the mask is summoned
  and dismissed at will.
- **Putting it on:** most draw a hand across the face; **Ichigo rips it down**, **Hiyori wills it**, **Hachigen slides it
  on** with one or both hands.
- **While masked:** eyes turn **black sclera + yellow iris**; the voice doubles with a ringing echo; Reiatsu turns
  Hollow-like (observers compare it to an Espada's); big gains in speed, strength and toughness (Kensei punching a
  Gillian apart, Love tearing one in half); body damage can be shrugged off; **energy techniques amplify** (Black
  Getsuga, Hachigen's Bakudō beheading Gillians); Cero access (shown: Shinji, Hiyori, Mashiro; colors per table). Tōsen
  called it a power beyond Bankai. Mask + Bankai stack (Ichigo; Kubo; Kensei in the anime).
- **Limits:** a time limit — most Visored ~**3 minutes** after a century; Ichigo **4 s → 11 s** after a month → much
  longer later; Mashiro held hers 15 hours casually but it broke early in real combat. Visored often drop the mask
  between attacks to save time. After use it can't be re-summoned for a while (damage, Reiryoku spent, or limited
  uses); **fear blocks it**; Ichigo's post-Ulquiorra mask felt heavier and briefly wouldn't come. Strong hits **shatter**
  the mask (Cero Oscuras broke Ichigo's completely).
- **Beyond the mask:** uncontrolled/full Hollow forms — the Visored's original rampage; Ichigo's reptilian armour form
  (tail, HSR); his horned second form vs. Ulquiorra (HSR, Sonído past Pesquisa, Cero beating Cero Oscuras); his willing
  **Merged Hollow Form** vs. Yhwach (Gran Rey Cero, Cero Creciente). Tōsen gained HSR and a full **Resurrección**
  (*Suzumushi Hyakushiki: Grillar Grillo*, regained sight, La Mirada, Los Nueve Aspectos); Kubo says Visored could in
  theory release too.
- **Soul Suicide:** unchecked Hollowfication makes the soul self-destruct. Fixes (Urahara): a vaccine of Quincy Heilig
  Pfeil + human souls (Visored, 100 % success); a human-soul Gigai with a Reishi binding string for a Hollowfied
  **Quincy** (Masaki) — Quincy can't normally Hollowfy, Hollow power is poison to them. Tōsen exploded after defeat.
- **Hollowfied Zanpakutō:** permanent side effects (Ichigo's black Getsuga; his Bankai immune to Medallions).
  **Shin'eiyaku** pills temporarily Hollowfy a Shinigami so a stolen Bankai poisons the Quincy thief and returns
  (Hitsugaya gained an ice half-mask and echo voice).

**Visored kit layer (on top of the Shinigami layer):**

| Input | Change while masked |
|---|---|
| **G** | **Hollow mask toggle** — personal gesture; timer bar (per dossier: 3 min default, Ichigo progression 4 s/11 s/∞); cooldown on removal or break; **mask HP** (big hits shatter it); `Status(fear)` blocks summoning. |
| Stats | speed ×1.3, damage ×1.5, Kidō `FormMult` ×1.5, incoming damage ×0.7, RL +1.5 (§3.6) |
| Q/E slot | gains **Cero** (personal color) — or added to Tab |
| Presentation | eye shader (black sclera, yellow iris), VO echo layer, Reiatsu signature type → Hollow (Pesquisa reads them as Hollow) |
| Stack | allowed with Shikai/Bankai |
| Story | "Inner Hollow takeover" boss phase (Ichigo); Hiyori/Visored rampage flashback; Soul Suicide = cutscene only |

### 2.4 Quincy

Spiritually aware **humans** who pull Reishi from their surroundings, bind it with their own Reiryoku and shape it into
weapons — the reverse of a Shinigami pushing their own power into a blade. White, high-collared tunics; cross / Quincy
Zeichen (five-point star) motifs; German naming. Sharp Reiatsu senses. Hollow power is **poison** to them (no
"antibodies" — infection weakens and then destroys the soul; they can't Hollowfy). Echt (pure-blood) vs. Gemischt
(mixed) lineage matters for Blut and Auswählen.

#### 2.4.1 The Reishi economy — absorbing the world (the voxel hook)

**Canon facts this system is built on:**
- Quincy strength depends directly on how much Reishi is around: easy in Soul Society/Hueco Mundo, harder in the Human
  World, where free Reishi sits mostly in nature. A strong Quincy barely distinguishes Reishi from Reiryoku; the only
  limits are stamina and absorption skill. Arrows can also be built from an **opponent's** Reiryoku.
- **Quincy: Letzt Stil** grants total Reishi dominance — Uryū broke down and absorbed the Reishi structures of Soul
  Society around him.
- **Sklaverei** (聖隷, "holy slave"; the brief's "Sklavelei"; English releases "Sklave Rai") pushes Reishi convergence to
  "absolute enslavement": Vollständig users rip apart the Reishi of trees, sand, rock and buildings in Hueco Mundo and
  Soul Society, absorb spiritual abilities (Orihime's shield) and even whole living souls (Quilge swallowing Ayon). It
  empowers their weapons and their Vollständig (adds ornament), restores stamina and heals minor wounds; it needs the
  Heiligenschein halo (Uryū excepted). Absorbing a Hollow this way doesn't kill the Quincy but gives unstable Hollow
  features that fade (novel: completely decomposed Hollow Reishi is harmless). Quilge's *Piskiel* has the greatest
  capture capacity of any Quincy.
- **Seele Schneider**'s vibrating edge loosens the Reishi bonds of whatever it cuts so the freed particles are easy to
  absorb; its **Anhäufer** function soaks up the opponent's attacks as fuel.
- The Wandenreich absorbed Seireitei's Reishi to unveil their hidden city; **Leiden Scherben** chips dissolve Reishi
  structures (anime: Wahrwelt's bridges melted away with no rubble).
- Sekkiseki repels Reiryoku; the Sanrei Glove *scatters* Reishi (training weight).

**Game system — "Reishi Draw" (F, hold):**

| Tier | Who | What can be pulled | Rate (proposal) | Range | Visual |
|---|---|---|---|---|---|
| Ambient | every Quincy | air Reishi (map density), Reishi debris dust, enemy energy remnants | passive + hold F ×3 | 6 m | faint blue motes stream into the Quincy Cross / hand |
| Edge | Seele Schneider wielders | voxels the blade cuts turn into free Reishi (**no debris**) | ×5 on cut voxels | contact | cut faces dissolve into glittering blue grains |
| Letzt Stil | Uryū (Soul Society arc) | `reishi` structure voxels: walls, floors, rubble, sand | 60 voxels/s | 12 m | walls crumble into blue sand and spiral into the shoulder "quiver" |
| Sklaverei | Vollständig users | any `reishi` voxels (buildings, rock, trees, sand), Kidō constructs, enemy spiritual barriers/summons, **weakened spiritual beings** (finisher) | 200 voxels/s (Quilge ×3) | 20 m | voxels crack, lift and unravel into streams converging on the halo; halo and wings grow extra ornament |

- **Materials:** `reishi` ✔ · `construct.kido` ✔ (Kidō is Reishi) · `kishi` ✘ · `kishi.nature` slow (Ambient only) ·
  `sekkiseki` ✘ · Hollow/Arrancar bodies: Sklaverei only, grants a temporary **Hollowfied** look + unstable buff.
- **Payoff:** each absorbed voxel refills Reiryoku, adds arrow ammo/damage stacks; Sklaverei also heals minor wounds
  and stamina.
- **World consequence:** removed voxels feed the structural-connectivity check — a Quincy literally drinks a building
  until it collapses. In the Human World (mostly `kishi`) Quincy are weaker and must rely on parks/rivers and enemies'
  energy.

#### 2.4.2 Spirit Weapons (霊子兵装, Reishi Heisō) — bow and arrow

- **Requirements:** above-average power, a **Quincy Cross** focus (cross or pentacle — Uryū's went from a Celtic cross to
  a pentacle), and Reishi in the area. The **Quincy Bangle** helps weaker Quincy gather Reishi.
- **Look scales with mastery:** average Quincy → glowing blue energy weapons; masters → solid, metallic-looking weapons
  (e.g. Uryū's metallic Heilig Bogen with blue accents that unfolds from his cross, taller than he is).
- **Heilig Bogen** (神聖弓, "holy bow") — customisable; Uryū's *Kojaku* / *Ginrei Kojaku*. Modern Quincy (last ~200 years)
  shape other weapons but still fire arrows through them.
- **Heilig Pfeil** (神聖滅矢, "holy destruction arrow") — the basic arrow; continuous rapid fire eventually injures the
  hands. Made to annihilate Hollow souls (a Shinigami killed by them still passes on). Strength varies hugely: Quilge >
  Uryū; Yhwach's dig deep craters and vaporised Yamamoto. Uryū later fires by swinging his limbs, no bow.
- **Personal arrow styles (for dossiers):** Quilge — saber with two extensions, 6 arrows at once; Driscoll — giant javelin
  arrows thrown from his tekkō; Robert — bullets from a pistol; Lille — bullets from a big black rifle; Royd — charges with
  both hands; Candice — thunderbolt-tipped arrows from a lightning-shaped bow; Liltotto — mouth-headed arrows from a
  jaw-shaped bow; Meninas — heart-tipped arrows from a bow with branching arms; Giselle — skull-tipped arrows from a bone
  bow; PePe — wispy, feathered arrows from a stubby bow; Yhwach — fingertip blasts, and a gigantic sky-bow whose arrow
  lands as a broadsword.
- **Impl:** archers' LMB = aimed quick shots (`Projectile(arrow)`; forward = piercing shot, back = backstep volley,
  air = arrow rain, down-air = dive shot, sprint = sliding shot); **hold LMB** = charged arrow that tunnels through walls
  (bore ∝ charge and stored Reishi). Continuous fire builds "hand strain" (proposal: brief accuracy loss) unless the
  Quincy is Sanrei-trained.

**Arrow techniques & Quincy spells (shared primitives):**

| Technique | Kanji | User(s) | Canon effect | Tags / implementation |
|---|---|---|---|---|
| **Licht Regen** | 光の雨 "rain of light" | Uryū | Reishi piled along the left arm and beyond the shoulder, then an innumerable volley at one target; later near-instant | Q: hold to stack arrows (visible build-up), release = homing barrage (SDC2 carpet) |
| Licht Wind (Mv) | — | Uryū | Horizontal ground-level Licht Regen | variant |
| **Klavier** | クラヴィーア | Ryūken | Rapid one-handed barrage of powerful arrows | `Projectile(multishot, rapid)` |
| **Qual Kreis** | 苦悶の環 "ring of agony" | Yhwach | Crackling Reishi pillars round the target harden into huge bows that fire equally huge arrows from all sides; arrows can dump their momentum into objects and bury the target in rubble | `Construct(bows)` + `Projectile(×N, inward)`; missed arrows impart impulse to debris voxels → rubble avalanche |
| **Sternenstaub** | 星くず "stardust" | Uryū (Vollständig) | Flechette arrows fused into one giant arrow with a Quincy-Zeichen head; clashed with Getsuga Jūjishō | V-tier `Projectile(huge, pierce)` SDC4 |
| **Heilig Pfeil Erobern** (name from G) | 神聖征滅矢 | Yhwach | Fingertip charge, then a dense barrage that obliterated a body as tough as Yamamoto's and left a crater | `Projectile(barrage)` SDC3–4 |
| **Galvano Blast** | ガルヴァノ ブラスト | Candice (The Thunderbolt) | 5-gigajoule lightning arrow that turns the target to dust | `Projectile(lightning)` |
| **Federzwinger** | — | Uryū (Vollständig) | Flechettes form five rods that fall round the foe into a pentagonal cage that drains Reiatsu and blocks Shikai/Bankai; in Reishi-dense Wahrwelt: a hidden giant bow-and-arrow revealed by shattering the air like glass | `Bind` + `Status(release lock)`; ultimate variant `Projectile(colossal)` |
| **Reishi Trap** | — | Uryū (Vollständig) | Brushes glowing marks onto walls/ceilings while moving; a swipe makes them fire arrow barrages at a passing foe | placeable surface glyphs on voxels → triggered turrets |
| **Icosahedron Barrier** | — | Uryū (Vollständig) | Two-layer shield (icosahedron outside, dodecahedron inside); can unfold the outer layer into panels to fire beams from the inner vertices — not both at once | `Shield` ↔ `Beam(multi)` mode switch |
| **Flechette Barrier** | — | Uryū (Vollständig) | Thick flechette strips wound round a volume many times to *contain* a cataclysmic explosion (km-scale) | `Field(containment)` — zero voxel damage outside |
| **Soul Docking** | ソウル・ドッキング | Uryū + Ichigo | Uryū touches Ichigo's original Zanpakutō and channels its Reiryoku into a giant Kojaku | duo super |
| **Kirchenlied: Sankt Zwinger** | 聖唱「聖域礼賛」 | Royd Lloyd, Yhwach | "Ultimate defense spell uniting offense and defense": Reishi bands with writing shoot from all five fingers and project a giant Quincy Zeichen on the ground; towering Reishi columns erupt round its rim (one shaped like a Quincy cross); whoever steps inside is torn apart by the "light of God" | `Field(holy zone)` r≈15 m + `Construct(columns)`; entering = massive damage |
| **Blue flames** | — | Zangetsu (Quincy side), some Sternritter | Fire of condensed Reishi that can burn Hueco Mundo's rock and sand | `Environmental(fire on reishi)` |

#### 2.4.3 Seele Schneider (魂を切り裂くもの, "soul cutter")
- Thin silver hilt with a glowing blue blade — the only bladed Quincy weapon; Reishi circulates round the edge ~3 million
  times a second like a chainsaw, loosening bonds so cut Reishi can be absorbed (using it raises Uryū's power). As a
  sword it cuts Reishi constructs; fired from Ginrei Kojaku it is a devastating arrow (one shot pierced Cirucci's
  "chain-binding" point and stripped her powers); a button launches the blade if the hand is pinned. **Anhäufer:**
  gathers Reishi by absorbing the opponent's attacks. Users: Uryū, Ryūken. Five of them power **Sprenger** (§2.4.7).
- **Impl (E):** tap = fire as arrow (`Projectile(needle, pierce)`; precise chest hit → `Status(power seal)` on non-boss
  Arrancar/Shinigami); hold = blade mode (`MeleeArc(cut)` that converts cut voxels to free Reishi, no debris); RMB in
  blade mode vs. an energy attack = **Anhäufer** absorb (refills Reiryoku); tap again = launch the blade.

#### 2.4.4 Hirenkyaku (飛廉脚, "Pure Flying Step"; Viz "Flying Bamboo-Blind Slide")
- Gather Reishi under the feet and **ride the current**; usable to hover/fly long distances like the air-walking of
  Shinigami/Arrancar. Uryū claims it beats Shunpo and Sonído (a generalisation — Mayuri was faster). Trained Reishi
  control (Kubo) and the most energy-efficient of the three (novel). Ishida-family name — the Wandenreich likely calls it
  something else. Mayuri built shoes that do it. **Platform manifestation:** a Reishi platform under the feet (trivial
  for Uryū inside the Garganta and Hueco Mundo).
- Users: Uryū, Ryūken, Quilge, Yhwach, Askin, BG9, Bazz-B, Candice, Cang Du, Giselle, Liltotto, Mask, Meninas, PePe,
  Pernida, Robert, Royd, Äs Nödt, Mayuri (shoes), Hikone (N).
- **Impl (Shift):** glide-dash 14 m with curve steering while held; lowest stamina cost of all Shift moves; hold in air =
  hover; double-tap + lock-on = behind target; Letzt Stil/Vollständig ×1.5 distance.

#### 2.4.5 Blut (血装, "blood armament")
- Reishi pumped straight into the blood vessels gives inhuman power — but attack and defense run on **two separate Reishi
  systems and can't be used together**. Echt Quincy have it from birth; Gemischt must train (Ichigo used Vene untrained).
  Yhwach sets the Blut strength of the entire Wandenreich and can change it.
  - **Blut Vene** (静血装, "still blood armament") — defense: a faint **blue vein pattern** under the skin, visible only
    where struck; can shield the eyes; held consciously at full power it can **completely negate even Bankai attacks**,
    but enough force tears it; also stops bleeding from wounds already taken.
  - **Blut Arterie** (動血装, "moving blood armament") — offense: per Quilge the only way a Quincy's non-Schrift attacks
    seriously hurt a Bankai-wielding Shinigami.
  - **Blut Vene Anhaben** (外殻静血装, "outer-shell still blood") — Yhwach pushes Vene out through his hand as a
    **sphere barrier**; its real strength is that it **consumes whatever touches him** — veins crawl over the ground and
    up the victim (Ichibe'e shattered the sphere with Ura Hadō 3 and forced the veins back into Yhwach by sheer strength).
- Users: Quilge, Äs Nödt, Royd, Yhwach, Ichigo, Masaki, Uryū, Askin, Gerard.
- **Impl (G cycles Vene → Arterie → off):** switching leaves a 0.4 s gap with neither active. Vene: blue vein web flashes
  at each impact point; RMB "brace" = full-power Vene (§3.5). Arterie: glowing veins on the striking limbs (anime shows
  them reddish — verify), damage multiplier (§3.5). Anhaben (Yhwach): `Shield(sphere)` + contact `Absorb` that crawls
  vein-decals across voxels and victims.

#### 2.4.6 Ransōtengai (乱装天傀, "Heavenly Wild Puppet Suit")
- Reiryoku strings driven by the brain move the body like a marionette, so the user keeps fighting through paralysis,
  broken limbs or anything that would stop normal movement. Made for elderly Quincy; so rare Mayuri never saw it among the
  2,661 Quincy he studied. Users: Uryū, Quilge (Sternritter combat instructor).
- **Impl (Z stance):** thin glowing blue strings from the head/back to each limb; while active the user **ignores**
  `Bind`, paralysis, stun and "broken limb" debuffs (damage still lands); animation gets a puppet jerk; Reiryoku drain/s.

#### 2.4.7 Gintō (銀筒, "silver tubes") spells
- ~5 cm silver tubes holding Reiryoku condensed into liquid; old-fashioned but they power Kidō-like spells, triggered by
  releasing the liquid — some by a spoken command. Effectiveness depends on the user.
- **Impl:** consumable inventory (e.g. 8 tubes; refill by condensing Reiryoku at rest); **R** throws the selected spell;
  Tab wheel picks it.

| Spell | Kanji | Canon effect | Command | Tags / implementation |
|---|---|---|---|---|
| **Heizen** | 聖噬 "holy bite" | Four tossed tubes mark a space; everything inside is gouged out and purged by a transparent rectangular beam — devastating even to a Menos | short | 4 corners (auto-placed round target) → vertical rectangular `Slice/Beam` prism that deletes the voxels inside cleanly |
| **Gritz** | 五架縛 "five-frame binding" | A Reishi film from a thrown tube wraps the enemy in a man-sized pentagonal Quincy cross | short | `Bind(pentacle)` |
| **Wolke** | 緑杯 "green cup" | A tube's burst cushions a fall | very short | fall-damage negate + small push |
| **Sprenger** | 破芒陣 (lit. "breaking-rays array") | Five Seele Schneider form a pentagon that collects Reishi; a Gintō triggers a massive explosion inside its borders; the fifth blade can root a target in the middle; too slow to set up mid-fight without a partner | none | plant 5 pylons (`Construct`, accumulating) → trigger → `Blast` SDC3 confined to a crisp pentagon crater |
| **Geldschrank** (Mv) | 封庫滅陣 "sealed-vault destruction array" | One Seele Schneider stops mid-air and boxes the target in dense Reishi; earlier micro-cuts bleed their Reishi; a tube triggers an implosion then a huge explosion | none | `Bind` → implosion → `Blast` |

#### 2.4.8 Sanrei Glove, Quincy: Letzt Stil, Leiden Scherben
- **Sanrei Glove** (散霊手套) / **Leiden Hant** (Wandenreich name): Uryū's is white, nearly to the elbow (Wandenreich:
  black, wrist-length, emblem; Mask De Masculine uses a belt). It scatters Reishi so forming a bow is a struggle; a week of
  nonstop firing (hands wrecked) unlocks much higher power (≈ 3rd–6th seat). Can be forced onto another Quincy to strip
  them. Removing it triggers Letzt Stil.
- **Quincy: Letzt Stil** (滅却師最終形態, "final form"): the old last resort. Look: armour over the left side and arm
  (silver shoulder plate with blue Quincy cross), rows of blue vertical lines on the white clothes, the glove's bow stays in
  hand, a blue flame-like **quiver of Reiryoku** on the right shoulder storing absorbed Reishi, an immense blue aura.
  Absorbs surrounding Reishi structures; arrows become solid and enormous (one charged shot split Konjiki Ashisogi Jizō and
  holed Mayuri, then wrecked the buildings behind); Hirenkyaku much faster; above captain level. **Afterwards the body seals
  away all spiritual power** — recovery only by exhausting oneself and taking a Heilig Pfeil exactly 19 mm right of the
  heart (pentacle scar).
  - **Impl (T, Uryū Soul-Society-arc kit only):** one-way transform; huge buff + Letzt-tier Reishi Draw; when it ends:
    `Status(powers sealed)` for the rest of the chapter (story cost).
- **Leiden Scherben** (散霊刻片): small white square chips built from Sanrei tech that break Reishi down. Anime: five chips
  melted Wahrwelt's bridges with no falling rubble; manga ("Demolishing Chips"): they accumulate Reishi and release it with
  city-levelling force. **Impl:** placeable charges — anime mode = delete the connected `reishi` structure within a radius
  with **no debris**; manga mode = SDC4 blast.

#### 2.4.9 Quincy: Vollständig (滅却師完聖体, "perfect holy form")
- **Canon:** the Wandenreich's reusable replacement for Letzt Stil (Bazz-B toggled it several times a day). Usually
  activated through the Leiden Hant (others: Mask's belt, Äs Nödt rolling his eye to show an emblem, Gerard drawing a
  Quincy Zeichen in the air with his blood); normally a **pillar of light topped by a Quincy Zeichen** rises around the
  user (which also smashes whatever they are encased in); Robert can do it instantly without the pillar; dense Reishi can
  set it off involuntarily (Candice). Anime: church bells toll.
- **Features:** **Heiligenschein** (光輪, star-shaped Zeichen halo), **Heiligen Fliegen** (光翼, Reishi wings, high-speed
  flight); a Spirit Weapon from the wrist gauntlet for melee and arrows; the Schrift gets more power/range and new
  techniques; senses sharpen enough to see through concealment from weaker foes; **Sklaverei** (§2.4.1) adds more ornament.
  Exceptions: no halo for Gerard and Uryū (Gerard got one after Auswählen); Mask has a cape construct, neck wings and a giant
  star; Äs Nödt has ring-spikes and a spiky halo. Schutzstaffel members Lille and Gerard enter a **second form** after a
  fatal wound — body transforms, injuries regenerate, Reiatsu turns golden.
- **Drawbacks:** heavy stamina drain; can't be used while holding a stolen Bankai; Auswählen strips it (even on a miss);
  destroying the Heiligenschein removes the power (the look stays); Shinken Hakkyōken can reflect its divine power.

| Vollständig | Kanji ("…of God") | Color | Weapon | User |
|---|---|---|---|---|
| Piskiel | 神の正義 (justice) | traditional blue | sword | Quilge Opie |
| Grimaniel | 神の歩み (steps) | green | pistol | Robert Accutrone |
| Zofiel | 神の炎 (flame) | red | wings | Bambietta Basterbine |
| Barbarriel | 神の雷霆 (thunderbolt) | green | wings/swords | Candice Catnipp |
| Azhalbiora | 神の死 (death) | indigo | bones | Giselle Gewelle |
| (unnamed) | — | crimson | none | Mask De Masculine |
| Tatarforas | 神の怯え (fear) | purple | none | Äs Nödt |
| Pornipora | 神の力 (power) | pink | dumbbells | Meninas McAllon |
| Gagael | 神の飢え (hunger) | yellow | bracelets | Liltotto Lamperd |
| (unnamed) | — | red | none | Bazz-B |
| (unnamed) | — | orange | unknown | NaNaNa Najahkoop |
| Gudoero | 神の情愛 (affection) | magenta | bow | PePe Waccabrada |
| (unnamed) | — | golden | wings | Pernida Parnkgjas |
| Jilliel | 神の裁き (judgement) | lime green → golden (2nd form) | wings | Lille Barro |
| Hasshein | 神の毒見 (poison-tasting) | purple | staff | Askin Nakk Le Vaar |
| Aschtonig | 神の権能 (authority) | red → golden (2nd form) | sword | Gerard Valkyrie |
| (unnamed) | — | traditional blue | feathers/bow | Uryū Ishida |

(Manga colour pages show most forms blue; the anime gives each its own colour as above.)

- **Impl (T):** activation cinematic (light pillar + Zeichen; deletes enclosing voxels within 2 m — breakout), wings →
  `Mobility(flight)`, halo = Sklaverei source with its own HP (destroyed → stat buffs off, look stays), gauntlet weapon,
  Schrift upgrades per dossier; second-form trigger on lethal damage for Lille/Gerard.

#### 2.4.10 Medallions, Sankt Altar & Bankai theft (and the Shin'eiyaku counter)
- **Medallion** (メダリオン): palm-sized metal disc with the Wandenreich emblem — an application of Yhwach's **Sankt
  Altar** (簒奪聖壇, "usurping altar": five Reishi orbs ring the target, their beams draw a Quincy Zeichen and pull the
  target's powers into Yhwach). Held up to a **released Bankai** nearby, it shoots five streams of dark energy that
  disintegrate the Bankai into a ring which sinks into the disc (Asguiaro's version needs a long chant and makes a
  star with columns of light). The thief can use the Bankai at will, even after its owner dies; the victim loses the
  Bankai and contact with the spirit.
- **Limits:** controlling a Bankai takes enough power (Yhwach alone took Yamamoto's); stolen Bankai are weaker until
  mastered; no Vollständig while holding one; can't take a Resurrección; **Hollowfied Bankai are immune** (Ichigo's,
  or any Shinigami dosed with **Shin'eiyaku** — then the stolen Bankai turns poisonous, harms the thief, breaks and
  returns to its owner, briefly Hollowfied).
- **Known thefts:** Yhwach — Zanka no Tachi; Äs Nödt — Senbonzakura Kageyoshi†; Bambietta — Kokujō Tengen Myō'ō†;
  BG9 — Jakuhō Raikōben†; Cang Du — Daiguren Hyōrinmaru†; Driscoll — Kōkō Gonryō Rikyū († = recovered).
- **Impl (X for Sternritter):** "present Medallion" works only on a **released Bankai within 25 m**: 5 dark streams →
  victim drops out of Bankai with the Bankai tier locked (`Status(Bankai stolen)`; proposal: Shikai stays usable at
  reduced power, since the bond with the spirit is cut) → the thief gains a new form whose
  kit is the victim's Bankai data at ~60 % (they can't Vollständig while holding it). Shin'eiyaku-dosed victims: the
  thief gets `Status(Hollow poison)` (DoT + control jitter), and after ~20 s the Bankai cracks and flies home, Hollowfied
  (ice half-mask etc.). **Requires fully data-driven, transferable kits.**

#### 2.4.11 Shadow (影, Kage) — Wandenreich teleport
- Yhwach's gift (not a native Quincy skill): the user's shadow spreads into a doorway between dimensions — the Schatten
  Bereich, the Soul King Palace, even someone's inner world — and the user's Reiatsu vanishes instantly from where they
  left. Gestures resize the portal (big ones take Quincy-cross shapes, enough for whole Soldat units); powers still work
  from inside the shadow. **It needs existing shadow** — useless in a room with none. Users: Yhwach, Haschwalth, most
  Sternritter, Asguiaro, Luders, Uryū (Wandenreich), the old-man Zangetsu.
- **Impl (X):** teleport to any **shadowed** point within 40 m (engine shadow-map query) or sink into a pocket
  "Schatten Bereich" (untargetable, can still cast). Counterplay is destruction: blasting away roofs/walls floods the
  area with light and erases the shadows they need. Reiatsu signature disappears on entry.

#### 2.4.12 Yhwach-class Quincy powers (for those dossiers)
- **Auswählen** (聖別, "consecration"; German "to select"): Yhwach takes back the power — usually the life — of
  Quincy he deems impure or useless (older/weaker first; the light can strip victims to bones; a clot of **Still
  Silver** forms in their hearts) and redistributes it (revived Lille and Gerard came back stronger). Pure energy transfer, so spiritual-matter barriers can't
  stop it; even dodging the light strips Vollständig. Long incantation (optional); after he absorbs the Soul King the ring
  turns black. Still Silver touching Yhwach's blood briefly cancels all his powers. **Impl:** Yhwach ultimate: light
  columns on chosen Quincy (allies!) convert their HP/powers into Yhwach buffs; Still Silver = a world item that can
  disable him.
- **Schrift** (聖文字): a letter carved into a Sternritter's soul via Yhwach's blood, granting a unique ability (dossier
  material); it returns to Yhwach if they die; Vollständig amplifies it.
- **Quincy items:** Quincy Cross, Quincy Bangle, Reishi Heisō armour/bow set, soul-synthesised silver/glass, **Hollow
  Bait** (crush to lure Hollows — even pulled a Menos through: a wave-spawn trigger item), Medallion, Gintō, Sanrei Glove,
  Seele Schneider.

#### 2.4.13 Quincy race signature (summary)
- **Movement:** Hirenkyaku glide + Reishi platforms; Vollständig flight; Shadow teleport (Wandenreich).
- **Defense layer:** Blut Vene (threshold, anti-bleed) · Ransōtengai (ignore disables) · Vollständig shields · Gintō
  Wolke · Anhaben (Yhwach).
- **Projectile family:** Heilig Pfeil (rapid, volley, charged, homing barrages) · Seele Schneider · Gintō spells ·
  Vollständig/Schrift specials.
- **Colors:** light blue Reishi (#8FD6FF core #E9F8FF, est.) for traditional Quincy; Blut Vene blue veins; Vollständig per
  table; Auswählen blue → black.
- **Sensing:** acute Reiatsu perception at long range with direction; Vollständig pierces concealment of weaker foes.

#### 2.4.14 Quincy universal kit layer

| Input | Universal move | Notes |
|---|---|---|
| WASD / Space / Ctrl | Move · **Reishi platform** / hover (hold Space) · descend | |
| **Shift** | **Hirenkyaku** glide-dash | double-tap + lock-on = behind |
| LMB | Archer: aimed Heilig Pfeil string (directional variants) · Melee builds: Spirit Weapon / Seele Schneider chain | |
| Hold LMB | Charged arrow (wall-boring, consumes stored Reishi) | |
| RMB | Guard: Blut Vene brace (if known) / bow-parry; Seele Schneider parry = Anhäufer | |
| Q | Volley (Licht Regen-type; hold to stack) | |
| E | **Seele Schneider** (tap arrow / hold blade / re-tap launch) | if owned |
| R | **Gintō** throw (selected spell) | consumable |
| F | **Reishi Draw** (hold) — tier per form | the voxel-absorption system |
| Z | **Ransōtengai** stance (if known) | Uryū, Quilge |
| X | **Shadow** (Wandenreich) / **Medallion** (Sternritter, vs. released Bankai) | |
| G | **Blut** cycle: Vene ↔ Arterie ↔ off | never both |
| C (hold) | Reiatsu flare — Quincy version also pulls ambient motes inward | |
| T / hold T | **Quincy: Vollständig** (Wandenreich, Uryū TYBW) · **Letzt Stil** (Uryū SS arc, one-shot) | |
| V | Schrift ultimate / Sternenstaub / Erobern / Kirchenlied (dossier) | |
| Tab | **Gintō & Quincy spell wheel** | |

### 2.5 Fullbringers (touch points)

*Details live in the Fullbring dossiers; this is only the shared layer.*

- Humans whose mother survived a Hollow attack before their birth; Hollow-derived power (their Reiatsu still reads as
  "standard" type, though Chad felt at home in Hueco Mundo). **Fullbring** pulls on the soul that every object has
  (lampposts, drinks, water) to move it or change its properties; it is driven by the physical body, so stamina matters.
  Objects they love (Ginjō's cross pendant → claymore) become their personal Fullbring; "Clad-type" Fullbrings armour the
  user. Final forms release a violent burst (another Fullbringer usually suppresses it). Hueco Mundo's atmosphere speeds
  growth. Fullbring can be transferred to/stolen by Substitute Shinigami; leftover Shinigami power can fuse with it.
- **Bringer Light** (完現光, "full-manifestation light"): every high-speed move is preceded by a **flicker of green
  light**; they pull the ground's soul to make it springy (huge jumps) and the air's soul to accelerate — which also adds
  force to their blows. Being able to do it marks the start of Fullbring mastery.
- **Universal layer:** Shift = **Bringer Light** (bouncy launch, can rebound off walls that turn elastic; momentum adds
  damage to the next hit); Space = air/water step (walk on water); F (hold) = **Soul Pull** on world objects — works on
  `kishi` too (drag props, make a wall bulge/elastic, pull a car); G/T = Fullbring forms (dossier). Color: green
  (#78FF6A est.).

### 2.6 Hybrids & cross-race access

| Character / case | Layers | Shift used |
|---|---|---|
| **Ichigo Kurosaki** | Shinigami + Visored (Hollow) + Quincy (Blut Vene, subconscious; Old-man Zangetsu) + Fullbring (Fullbring arc) | Shunpo; Sonído in Hollow forms; Bringer Light in Fullbring forms |
| **Kaname Tōsen** | Shinigami + Hollowfication + Resurrección + HSR; can open Garganta at will | Shunpo / Sonído (listed as a Sonído user) |
| **Arrancar with a Quincy Cross** (Wandenreich recruits) | Arrancar + Spirit Weapons + Shadow | Sonído |
| **Mayuri Kurotsuchi** | Shinigami + gadgets (Hirenkyaku shoes, Garganta device, Kidō) | Shunpo / Hirenkyaku (shoes) |
| **Kūgo Ginjō** | Fullbringer + Substitute Shinigami powers (anime shows a magenta Cero-like beam) | Bringer Light |
| **Hikone Ubuginu** (N) | artificial hybrid stacking Sonído + Shunpo + Hirenkyaku + Bringer Light | all four |
| **Substitute Shinigami** | human body + Shinigami soul; badge to leave the body | Shunpo |

**Stacking rule:** a hybrid gets every layer's passives; the active form decides the Shift move and the Tab wheel
(Kidō / Cero / Quincy spells). Medallions fail on Hollowfied Bankai; Quincy-side abilities can't absorb Hollow power
safely except via Sklaverei; Hollow mask + Bankai may stack.

---

## 3. Power-scaling rules (fun, not balance)

All numbers are **starting proposals** meant to reproduce canon *feel*: the stronger soul simply wins exchanges,
weaker beings kneel, and big releases wreck the map.

### 3.1 Reiatsu Level (RL)

**RL is a log₂ power scale: +1 RL = twice as strong.** It anchors on canon Spirit Class (霊威, 1–20, 1 = densest):
`RL = 21 − SpiritClass`, extended past class 1 for the top tier.

| Being | Spirit Class (canon where known) | Base RL (sealed / unreleased) |
|---|---|---|
| Ordinary human, Plus | ~20 | 1–2 |
| Spiritually aware human (Karakura friends early) | — | 3–6 |
| Unseated Shinigami, Academy graduate, common Hollow | ~11–14 | 7–10 |
| Seated officer, Huge Hollow, Gillian, Soldat | ~7–10 | 11–14 |
| Lieutenant, Adjuchas, Fracción/Números | 4–5 (Kaien entered the Academy at 6) | 16–17 |
| Captain, Vasto Lorde, Espada (sealed), Sternritter | 1–3 | 18–20 |
| Royal Guard, Yamamoto, Shunsui-class veterans | beyond 1 | 21–22 |
| Hōgyoku Aizen, final-arc Ichigo, Yhwach | — | 23–26 |

**Form modifiers (add to RL):** Shikai +1 · Bankai +2.3 to +3.3 (canon ×5–10) · Hollow mask +1.5 (stacks) ·
Resurrección +2.5 · Segunda Etapa +3.5 · Vollständig +2.5 (Sklaverei stacks +0.5) · Letzt Stil +3.3 (temporary) ·
Shunkō +1 · Gentei Reiin limiter −2.3 (canon: 20 % output) · inside a Sekkiseki enclosure −3 · `Status(fear)` −1.

### 3.2 Reiatsu pressure — the **C** flare and passive aura

**Canon effects to reproduce:** being near a far stronger being knocks the wind out of humans/souls, makes sweat roll
*upward*, and drops weaklings to their knees (Hanatarō near Kenpachi); fear saps a fighter's own Reiatsu until willpower
returns (Ichigo vs. Kenpachi); a stare can paralyse (Yamamoto → Nanao, Aizen forcing Grimmjow to kneel); intense
killing intent causes **phantom pain** (Ichigo "feeling" a blade at his neck); released Reiatsu can physically damage
(Hitsugaya's and Renji's limiter releases froze/burned Fracción; Kenpachi's sword shockwaves); at the top it is lethal
(Hōgyoku Aizen reducing a human to ash and disintegrating objects thrown at him; Starrk's mere presence killing Hollows).
Some Reiatsu is elemental by nature: Yamamoto's **heat** (sealed blade glowing dark orange, flames before release),
Hitsugaya's **cold** (froze his grandmother in his sleep as a child). Big releases take shapes: Ichigo's golden Reiatsu
as his Hollow mask, Kenpachi's giant skull, Yachiru's angry pink cat.

**Rules:**
- Passive aura radius `r_p = 2 + 0.75 × max(0, RL − 8)` m; holding **C** ramps to `r_f = 2 × r_p` over 1 s (drains
  Reiryoku; releases the dossier's aura shape and color).
- Pressure difference `ΔP = RL_source − RL_victim − Resolve_victim` (Resolve 0–3 per dossier; a "resolve" trigger —
  low HP + story beat — adds +1, Ichigo-style).

| ΔP | Effect on victims inside the radius | World / VFX |
|---|---|---|
| ≥ 1 | **Pressure:** stamina regen −25 %, micro camera shake | aura shimmer; dust drifts outward |
| ≥ 2 | **Fear:** −15 % move speed, +80 ms input delay (AI hesitates/backs off), aim sway | sweat beads float **upward**; heartbeat SFX |
| ≥ 3 | **Crushing:** mooks drop to one knee (1–3 s), players −30 % speed and no air-step; if the source is in a killing-intent stance, **phantom pain** hit-flashes (no damage) | cracks radiate in the ground; loose debris lifts; glass shatters |
| ≥ 4 | **Pinning:** victims forced prone; **stare paralysis** available (lock-on + hold C on one target = paralysed while held); victims' binds/status skills against the source fail 50 % | shallow crater under the source; low-HP voxels crumble within r/2 |
| ≥ 6 | **Annihilation:** ordinary humans/Pluses/weak Hollows turn to ash; non-spiritual thrown objects disintegrate before contact | ash particles; objects dissolving mid-air |

- **Elemental auras:** heat (Yamamoto) ignites `flammable` voxels inside `r_p` and adds heat haze; cold (Hitsugaya)
  spreads frost decals and freezes water voxels inside `r_p`. Limiter-release bursts (Gentei Kaijo) fire one ΔP pulse
  that carries the elemental effect.
- **Concealment:** any character can suppress their signature (toggle; no flare, −50 % Reiryoku regen). A being
  ΔRL ≥ 5 above the observer is **unsensable** by them without trying (canon: Aizen's second fusion, Ichigo after the
  Dangai, Ichibe'e) — their sense UI simply shows nothing.
- **Reiatsu types** (for sensing UI and interactions): *standard* (most Shinigami & Hollows; all Quincy, humans,
  Fullbringers), *dual* (Visored feel Shinigami-ish, Arrancar Hollow-ish; masked Visored and released Arrancar read as
  Hollow), *black / Chaos* (the Soul King's own Reiatsu: Ichigo's Bankai & blood-chains power, Mimihagi, Soul-King Yhwach,
  Haschwalth holding The Almighty), *elemental* (Yamamoto fire, Hitsugaya ice).
- **Absorption by release:** an explosive Reiatsu release drags surrounding energy in (Ichigo absorbing Quilge's Quincy
  Reiatsu awoke his Blut Vene) → story hook.

**Reiatsu colors (wiki table) — use for flares and auras:**

| Color | Users |
|---|---|
| Black | Ichigo (Bankai & blood chains), Adnyeus, Mimihagi, Yhwach (Soul King), Haschwalth (with The Almighty) |
| Black w/ green outline | Ulquiorra (Resurrección) |
| Light blue | Uryū Ishida, Quilge Opie |
| Violet/purple | Sousuke Aizen; Askin (Vollständig) |
| Magenta | PePe (Vollständig) |
| Pink | Yachiru Kusajishi; Meninas (Vollständig) |
| Red | Bambietta, Mask De Masculine, Bazz-B, Gerard (all Vollständig) |
| Orange | NaNaNa (Vollständig) |
| Golden orange | Isshin Kurosaki |
| Golden yellow | Ichigo, Kenpachi Zaraki, Senjumaru Shutara, Yoruichi (Shunkō); Gerard & Lille (Vollständig 2nd form) |
| Yellow | Liltotto, Pernida (Vollständig) |
| Green | Candice, Robert, Lille (Vollständig) |

### 3.3 Reiatsu collision — who gets hurt

**Canon:** when two spiritual beings collide, the one with weaker Reiatsu takes the impact (Kenpachi let Ichigo cut his
bare chest; Ichigo's hands bled instead); higher Reiatsu hardens the body; per Aizen, Shinigami fights are contests of
Reiatsu and a large enough gap lets one simply overpower the other's abilities (Suì-Fēng's Nigeki Kessatsu not working
on Aizen). Control matters: superior Reiatsu can beat larger raw Reiryoku.

**Rules:**
- For each hit: `ΔD = RL_defender − RL_attacker` (current forms). `DamageMult = 1` if ΔD ≤ 0, else `2^(−0.6·ΔD)`
  (ΔD 1 → 0.66, 2 → 0.44, 3 → 0.29, 4 → 0.19).
- **No-sell:** ΔD ≥ 5 and the move isn't an ultimate → 0 damage and the attacker takes 10 % recoil ("hands bleed").
- **Ability override:** binds, statuses and control effects from a source with ΔD ≥ 4 below the target fail (or −75 %
  duration). Dossiers may flag truly absolute powers (complete hypnosis, The Almighty, concept-freezing) as exempt.
- Applies to everything — Kidō, Cero, arrows, punches — *before* Hierro/Blut thresholds.

### 3.4 Hierro thresholds

- `T_H = 40 × 2^((RL − 16)/2) × personal multiplier` (Nnoitra ×1.6 — hardest despite rank 5; Yammy and Grimmjow ×1.2
  — proposal; others ×1.0). Release raises RL and therefore `T_H`.
- Hit damage `d` (after §3.3): `d ≤ T_H` → `d × 0.05` (clang, sparks, faint scratch, no blood); `d > T_H` → `d − 0.5·T_H`.
- Damage-type factors vs. Hierro: slash ×1.0, blunt ×1.2, energy ×0.9.
- **Adaptation (Kenpachi rule):** each landed hit from the *same* attacker in one fight adds +8 % of `T_H` as
  penetration (cap 60 %); scratches visibly deepen.
- **Anti-Hierro gear** (Yoruichi's armoured gauntlets/boots) ignores 50 % of `T_H`.
- **Hierro boost (G):** `T_H × 1.5`, move speed −15 %.
- Barehanded RMB guard vs. blades takes no chip damage below `T_H`.

### 3.5 Blut thresholds

- **Blut Vene:** `T_V = 48 × 2^((RL − 16)/2)` while active. **Brace** (hold RMB = "consciously at full power") → ×2
  and any hit with `d ≤ T_V` deals **0** — even a Bankai attack. A single hit `> 2·T_V` (or any shield-breaker, e.g.
  Ura Hadō 3) **tears** it: veins shatter, Vene off for 2 s, that hit lands in full. Passive while on: immune to `bleed`,
  eyes protected (immune to blinding flashes).
- **Blut Arterie:** damage ×1.5; ×2.5 against targets in Bankai / Resurrección / Vollständig (Quilge's point that only
  Arterie lets ordinary Quincy attacks seriously hurt a Bankai user).
- **Exclusive:** never both; switching leaves a 0.4 s gap with neither active (an opening for opponents).
- **Wandenreich regulation:** Yhwach (or a story event) can scale all allied Quincy Blut from ×0.5 to ×2.
- **Anhaben (Yhwach):** sphere HP = `4·T_V`; contact applies a consuming vein DoT that crawls up the victim; a grappler
  with ΔRL ≥ 0 and a strength check can push it back into Yhwach (Ichibe'e rule).

### 3.6 Release multipliers, upkeep and failure states

| Form | Damage / destruction | RL | Upkeep | Ends when | Canon notes |
|---|---|---|---|---|---|
| Shikai | ×1.5–2 | +1 | — | unconscious (immense-Reiryoku users stay released) | wrong name → weaker release; despair blocks it |
| **Bankai** | **×5–10 of Shikai**, destruction SDC +1 tier | +2.3…+3.3 | Reiryoku drain/s | Reiryoku 0 (can't re-activate until recovered), unconscious, broken | **broken = permanent loss** for the save (Komamura/Hitsugaya/Mayuri exceptions; Nimaiya reforge, Orihime reject); "Bankai fading without consent" = near-death warning UI; < 10 years' mastery = overload chance (self-damage); a much more experienced Shikai/Kidō user can stall a brand-new Bankai (new Bankai −1 RL vs. veteran captains) |
| Hollow mask | ×1.5 (Kidō ×1.5) | +1.5 | timer | timer out, mask HP 0, fear | stacks with Bankai |
| Resurrección | ×5–10 | +2.5 | Reiryoku drain | too injured / unconscious → sword returns | full heal on activation; broken sword = unavailable; discarded parts permanent |
| Segunda Etapa | ×2 on top | +3.5 total | drain | as above | Ulquiorra (others theoretically) |
| Vollständig | ×4 | +2.5 | stamina drain | halo destroyed (form stays, power off) | unavailable while holding a stolen Bankai; Auswählen strips it |
| Letzt Stil | ×10 | +3.3 | — | fight ends / timer | then **powers sealed** |
| Shunkō | melee ×1.5 + elemental shockwaves | +1 | drain (Mukyū: none) | toggle off | Keisen Shōzoku |
| Gentei Reiin | ×0.2 | −2.3 | — | Gentei Kaijo | Human World captains/lieutenants |

### 3.7 Healing & regeneration (summary)

| Source | Restores | Limits |
|---|---|---|
| Kaidō (T1–T4) | bleed, stagger/fear, HP, re-attached limbs, critical state; Reiryoku | healer tier (Kubo's percentages) |
| High-Speed Regeneration | HP + **regrows character voxels** (limbs) | not brain/organ core voxels; burst damage overwhelms; costs Reiryoku |
| Resurrección activation | full heal | once per release |
| Sklaverei | stamina + minor wounds | Vollständig only |
| Blut Vene | stops bleeding | — |
| Goyōgai | stasis (no death) | can't act |
| Zanpakutō regrowth | broken sealed/Shikai blade regrows | hilt must be intact; never Bankai |
| Rejection-type powers (Orihime, dossier) | bodies **and world voxels** | see dossier |

### 3.8 Kill, disable and soul rules

- **Shinigami:** decapitation = guaranteed kill; bisection/dismemberment → *critical* state with a bleed timer (healable).
  Saketsu + Hakusui pierced → `Status(power seal)`. Wrist vents sealed → self-incineration (KS03).
- **Hollows:** splitting the mask/head kills. Killed by a **Zanpakutō** → purified (mask cracks, body dissolves to light,
  the human soul rises — or the Gates of Hell open for great sinners). Killed by a **Quincy** → annihilated, soul and all
  (blue shatter, no light).
- **Arrancar:** HSR fails on head/organ cores; slain Arrancar don't go to Soul Society (Hell is possible); bodies break
  down into Reishi → corpse voxels dissolve into motes (absorbable by Quincy).
- **Spiritual corpses** in Soul Society dissolve into Reishi; captain-class Reishi is too dense and is sent to Hell
  (Konsō Reisai).
- **Quincy:** Hollow infection (bites, Hollowfication agents, raw Hollow Reishi outside Sklaverei) = `Status(Hollow
  poison)`: Reiryoku decays, then the soul fails — Uryū has special resistance. Auswählen; Letzt Stil aftermath.
- **Pluses:** Konsō sends them on; neglected ones decay into Demi-Hollows (proposal spawn rule).

### 3.9 Destruction scaling (voxel side)

- Size every explosion by **SDC** (§0.5) and `radius_m ≈ 0.25 × √Power` for Kidō-style blasts.
- Blade cuts: `MeleeArc(cut)` reach = blade + Reiatsu extension `1 m + 0.5 m × max(0, RL − 15)` (captain ≈ 3 m,
  Kenpachi/Yamamoto 5 m+; Bankai specials per dossier); cuts are planar and let the upper part of a structure slide.
- Canon anchors: Shakkahō SDC1–2 · Cero SDC2 (Espada SDC3) · Raikōhō SDC2–3 · Zangerin / Hadō #88 SDC3 · Ittō Kasō,
  Gran Rey Cero, Cero Oscuras SDC4 · top Bankai & full-chant Kurohitsugi SDC5 · world-scale finales SDC6 (scripted).

### 3.10 Map & world rules

| Zone | Rules |
|---|---|
| **Seireitei** | Seireiheki walls are `sekkiseki` (drop from the sky to seal the gates); the **Shakonmaku** dome vaporises low-density Reishi → no Shunpo/teleport/fly-in from outside unless RL ≥ 19 (proposal; canon: only Reishi "of sufficient density" gets through) or via the Kagizaki cannon; Sekkiseki cells drain Reiryoku; Senkaimon courtyard. Buildings are `reishi` (Quincy can drink them). |
| **Las Noches** | Espada ranked 4 or higher can't release inside; nobody may fire Gran Rey Cero (proposal: allowed but triggers a dome-collapse event + Aizen's displeasure); walls are **not** Sekkiseki (absorbable); the dome fakes a blue sky (lighting → shadows exist for Shadow teleport). |
| **Hueco Mundo** | Reishi-dense: Quincy absorption ×2; feeds small Hollows; speeds Fullbring growth; sand/rock don't burn except with Reishi blue flames. |
| **Human World** | Captains/lieutenants spawn **limited** (Gentei Reiin −2.3 RL, crest mark on the body) — G/V "Gentei Kaijo" release with a 3 s approval channel; mostly `kishi` (Quincy weak, Fullbringers strong); civilians present (ΔP ≥ 6 kills them — collateral matters); post-fight Kikanshinki memory cleanup. |
| **Fake Karakura (Tenkai Ketchū)** | Replica town — destroy freely; four pillar objectives: if one falls, the real town starts returning in a spreading zone (civilians appear) unless stakes are planted. |
| **Wahrwelt** | Wiki is contradictory ("Reishi-thin" for air-standing vs. "Reishi-dense" for Uryū) → proposal: Reishi enslaved to the Quincy — air footholds unstable for non-Quincy, absorption ×2 for Quincy. |
| **Garganta** | Black void with Reishi storms; non-Quincy pay Reiryoku per Reishi foothold; Quincy platforms free. |
| **Dangai** | Kōryū current on the walls = `Bind` on touch; Kōtotsu cleaner chase every 7 days; time runs ~2 000× denser (training arcs). |
| **Hell** | Jigoku no Gaki emit no Reiatsu (sensing blind); Hollowfication urges amplified (Mv); Jigoku no Kidō escape. |

### 3.11 Cross-race interaction matrix

| Interaction | Rule |
|---|---|
| Sonído vs. Pesquisa / sense UI | invisible while moving |
| Shunpo, Hirenkyaku vs. Pesquisa | visible |
| Zanpakutō vs. Hollow | purifies |
| Heilig Pfeil vs. Hollow | annihilates (no purification) |
| Hierro vs. blades | threshold + adaptation (§3.4) |
| Blut Vene vs. Bankai | can fully negate when braced (§3.5) |
| Blut Arterie vs. released foes | ×2.5 |
| Medallion vs. Resurrección / Hollowfied Bankai | fails |
| Shin'eiyaku | stolen Bankai poisons the thief and returns |
| Quincy vs. Hollow Reishi | poison, except via Sklaverei (temporary Hollow features); Uryū resistant |
| Sklaverei vs. Kidō constructs / barriers | absorbable (Kidō is Reishi) |
| Hakudan Keppeki vs. Quincy | blocks Quincy powers only |
| Dankū vs. Hadō ≤ #89 (and equivalents) | fully blocked |
| Cero Doble vs. Kidō / Getsuga | swallowed and returned |
| Time acceleration (Respira) vs. Kidō | erosion ×20 |
| Fūsatsu Kakei vs. Shinigami/Visored | vent seal burn (weak on others) |
| Hollow mask vs. Kidō | ×1.5 power |
| Sekkiseki vs. energy | ×0.1; drains Reiryoku |
| Shadow vs. light | needs shadow; destroying cover removes shadow |
| Auswählen vs. Quincy | strips Vollständig even on a miss; Uryū immune |
| Still Silver vs. Yhwach | brief total power loss |
| ΔRL ≥ 4 | status/bind immunity (§3.3) |

---

## 4. Engine features required (checklist)

1. **Voxel material tags** (`reishi`, `kishi`, `kishi.nature`, `sekkiseki`, `construct.kido`, `ice`, `flammable`,
   `conductive`) with per-material response tables (absorbable, burnable, conducts, energy resistance).
2. **Structural connectivity & collapse** (absorption, slices and pillar removals bring buildings down).
3. **Carving operations:** sphere crater · thin and huge cylinder bores · planar slice with slide · *no-debris*
   disintegration (Haien, Mushikuidama, Leiden Scherben) · rectangular prism delete (Heizen) ·
   pentagon crater (Sprenger) · radial uplift of chunks (Goryūtenmetsu) · **region copy-move** (Kūkanten'i) · region
   **time-freeze** (Jikanteishi) · material conversion (ice waves).
4. **Debris system:** telekinetic pick-up/throw (Daichi Ten'yō), vortex suction (Tenran), impulse transfer into rubble
   (Qual Kreis), **voxel → Reishi particle streams** into a target (Quincy Reishi Draw), constructs eroding into dust.
5. **Construct system:** owned voxel structures with HP, decay timers, absorbable flag; barrier planes that block
   without carving; **containment volumes** that zero voxel damage outside (Shijū Saimon, Flechette Barrier).
6. **Bounded flood-fill** over connected voxel components (Tsuzuri Raiden electrification, Leiden Scherben, collapse).
7. **Reiatsu signature & sensing:** strength, type (standard/dual/black/elemental), suppression, sense radius,
   Pesquisa pulses, Kyokkō/Sonído/overwhelming-RL invisibility, Tenteikūra broadcast, Kakushitsuijaku map marks.
8. **RL combat math:** pressure field effects, collision damage scaling, ability override, Resolve, form modifiers.
9. **Chant system:** verse timers, glyph rings (visible tells), VO murmur for unrevealed chants, partial factors,
   interrupts, misfire, Nijū pairing, Kōjutsu post-chant buffs, number-reading callouts.
10. **Status library:** binds with break meters, pin-to-surface, paralysis, sleep/KO, confusion/control inversion, fear,
    vent-seal burn, power seal, stasis, time-stop, Hollow poison, Bankai stolen, powers sealed, bleed, freeze, burn, shock.
11. **Character-voxel damage:** limb severing, decapitation, permanent sacrificial limb loss, **voxel regrowth** (HSR,
    Kaidō T3), protected core volumes.
12. **Data-driven form/kit stacks:** race layer + form layers + mask; forced reverts; permanent losses (broken Bankai,
    discarded Resurrección parts); **kit transfer between characters** (Medallion theft).
13. **Meters/timers:** Reiryoku, Hohō/Hirenkyaku stamina, mask timers + cooldowns, Bankai/Resurrección drain, Gintō
    inventory, Kidō construct lifetimes.
14. **Lighting queries:** shadow test for Shadow teleport; dynamic lights from torch Kidō and fires; destruction must
    update shadows.
15. **Portals & spaces:** Senkaimon, Garganta (Descorrer/Kūmon), Shadow, Kūkanten'i swap, Hako Okuri object posting,
    Sentan Hakuja group warp, Negación isolation pillar, pocket dimensions (Caja Negación, Schatten Bereich), Dangai.
16. **Space-distortion shader + time-slow volumes** (full-chant Kurohitsugi, Gran Rey Cero wake).
17. **Afterimage/clone system** (Utsusemi decoys, Speed Clones, Gemelos Sonído clones that bleed).
18. **Beam clash** (Cero vs. Cero/Getsuga push-of-war) and **projectile tiers** for shields/reflect/absorb-return.
19. **Map rule system** (Las Noches restrictions, Human World limiter, Shakonmaku, Reishi density per zone, Dangai current).
20. **Audio/VO:** callouts with Japanese numerals, mask echo layer, Sonído boom, church bells for Vollständig/Auswählen
    (anime cue).

---

## 5. Gaps & uncertain points

- **Missing/stub wiki pages:** "Spiritual Limiter" (no page — taken from the Shinigami/Senkaimon/Reiryoku pages),
  "Hollow Mask" (redirects into Hollow), "Quincy Cross" (no page), "Bringer Light" (section of Fullbringer),
  "Menos Grande" (stub redirect).
- **Incantations:** only ~17 spells have a known chant (Geki/Hōrin, Kakushitsuijaku, Rikujōkōrō, Gochūtekkan,
  Tenteikūra, Bankin stage calls, Shakkahō, Sōkatsui, Sōren Sōkatsui, Raikōhō, Kurohitsugi, Senju Kōten Taihō, Ryūbi no
  Jōmon, Shisō Keppū, Keikaigi, Kagizaki; plus Gintō commands and Auswählen/Medallion chants). Most spell **numbers** for
  barriers and Hachigen's spells are unknown.
- **Colors not given by the source:** Shō, Tsuzuri Raiden, Zangerin, Mushikuidama, the exact anime hues of Hadō #88 and
  #91, Gochūtekkan pillars, Dankū tint, Blut Arterie veins (anime memory: reddish), Gran Rey Cero per Espada (Grimmjow's
  blue is anime memory). Shunpo/Sonído/Hirenkyaku rendering details are proposals built from the canon sound cues.
- **Canon status to verify:** Daichi Ten'yō (only a TYBW anime image cited), Hakudan Keppeki (TYBW anime), Seki,
  Inemuri and Shibireyubi (wiki cites anime episodes without flagging them filler), Urahara's Goryūtenmetsu (other media).
- **Contradiction:** Wahrwelt is called both Reishi-thin and Reishi-dense — reconciled by proposal in §3.10.
- **Sklaverei users:** manga explicitly shows only Quilge; anime extends it to several Sternritter; the novel says all
  can — this doc lets every Vollständig user have it.
- **Game-only names** used for unnamed canon moves: Cero Creciente, Heilig Pfeil Erobern, Cero Gigante/Apocalipsis.
- **Ichigo and Kidō:** never shown casting successfully → set as Novice.
- All formulas, radii, durations and RL values are **proposals** for feel, to be tuned in playtests.

---

## 6. Sources

Base pages (cleaned dumps in `wiki/J1/`): <https://bleach.fandom.com/wiki/Kid%C5%8D>,
[Hohō](https://bleach.fandom.com/wiki/Hoh%C5%8D), [Hakuda](https://bleach.fandom.com/wiki/Hakuda),
[Zanjutsu](https://bleach.fandom.com/wiki/Zanjutsu), [Reiatsu](https://bleach.fandom.com/wiki/Reiatsu),
[Shunkō](https://bleach.fandom.com/wiki/Shunk%C5%8D), [Zanpakutō](https://bleach.fandom.com/wiki/Zanpakut%C5%8D),
[Shinigami](https://bleach.fandom.com/wiki/Shinigami), [Hollowfication](https://bleach.fandom.com/wiki/Hollowfication),
[Visored](https://bleach.fandom.com/wiki/Visored), [Cero](https://bleach.fandom.com/wiki/Cero),
[Bala](https://bleach.fandom.com/wiki/Bala), [Sonído](https://bleach.fandom.com/wiki/Son%C3%ADdo),
[Hierro](https://bleach.fandom.com/wiki/Hierro), [Pesquisa](https://bleach.fandom.com/wiki/Pesquisa),
[Garganta](https://bleach.fandom.com/wiki/Garganta), [Resurrección](https://bleach.fandom.com/wiki/Resurrecci%C3%B3n),
[Arrancar](https://bleach.fandom.com/wiki/Arrancar), [Espada](https://bleach.fandom.com/wiki/Espada),
[Quincy](https://bleach.fandom.com/wiki/Quincy), [Heilig Pfeil](https://bleach.fandom.com/wiki/Heilig_Pfeil),
[Hirenkyaku](https://bleach.fandom.com/wiki/Hirenkyaku), [Blut](https://bleach.fandom.com/wiki/Blut),
[Ransōtengai](https://bleach.fandom.com/wiki/Rans%C5%8Dtengai), [Sklaverei](https://bleach.fandom.com/wiki/Sklaverei),
[Quincy: Vollständig](https://bleach.fandom.com/wiki/Quincy%3A_Vollst%C3%A4ndig),
[Seele Schneider](https://bleach.fandom.com/wiki/Seele_Schneider), [Gintō](https://bleach.fandom.com/wiki/Gint%C5%8D).

Wiki templates read for lists: Template:Bakudō Spells, Template:Hadō Spells, Template:Kidō Barriers & Seals,
Template:CeroColors, Template:CeroVariations, Template:BalaColors, Template:GintōSpells, Template:HeiligPfeilTechniques,
Template:PesquisaTechniques, Template:SonídoTechniques/Users, Template:HirenkyakuTechniques/Users,
Template:VollständigTypes, Template:HighSpeedRegenerationPossessors, Template:Tech-Yoruichi, Template:Tech-Suì-Fēng.

Extra pages fetched for this doc (`wiki/J1/extra/…`, URL pattern `https://bleach.fandom.com/wiki/<Title>`):
- **Kidō:** every spell named in §1.6 (Sai, Hainawa, Seki, Geki, Hōrin, Sekienton, Kyokkō, Shitotsu Sansen,
  Tsuriboshi, Enkōsen, Kakushitsuijaku, Rikujōkōrō, Hyapporankan, Sajō Sabaku, Tōzanshō, Gochūtekkan, Tenteikūra, Kuyō
  Shibari, Dankū, Kin, Bankin, Hakufuku, Inemuri, Tanma Otoshi, Shibireyubi, Shō, Byakurai, Tsuzuri Raiden, Fushibi,
  Shakkahō, Ōkasen, Sōkatsui, Haien, Daichi Ten'yō, Tenran, Raikōhō, Sōren Sōkatsui, Zangerin, Hiryū Gekizoku Shinten
  Raihō, Kurohitsugi, Senju Kōten Taihō, Ittō Kasō, Goryūtenmetsu, Gaki Rekkō, Hyōga Seiran, Kongōbaku, Jūgeki Byakurai
  (Kaizō Kidō), Mushikuidama, Ura Hadō: Sannodō — Teppūsatsu, El Escudo, Millón Escudo, Fūsatsu Kakei, Kyūjūrokkei
  Kakafūmetsu, Goyōgai, Hachigyō Sōgai, Ryūbi/Kokō/Kigai/Hōyoku no Jōmon, Shijū Saimon, Hako Okuri, Roppō Fūjin,
  Standing Ovation, Hakudan Keppeki, Kyōmon, Shisō Keppū, Chocolate Bar Slider, Hanki, Jikanteishi, Kūkanten'i,
  Kagizaki, Keikaigi, Noren Mekuri, Sentan Hakuja, Jigoku no Kidō), Kaidō, Kidō Corps, Kidō/Appearances In Other Media.
- **Shinigami:** Utsusemi, Senka, Speed Clones, Mukyū Shunkō, Shunkō: Raijin Senkei, Shunkō: Raijū Senkei: Shunryū
  Kokubyō Senki, Konsō, Senkaimon, Jigokuchō, Gikon, Gigai, Gokon Tekkō, Shin'eiyaku, Reishi, Reiryoku, Kakaku Taihō,
  and the 38 named Hakuda/Zanjutsu technique pages in §2.1.4–2.1.5.
- **Hollow/Arrancar:** Gran Rey Cero, Cero Oscuras, Cero Metralleta, Cero Doble, Cero Sincrético, Cero Córnea, Mashiro
  Super Cero, La Mirada, Cero Creciente, Gemelos Sonído, Galope, Descorrer, High-Speed Regeneration, Negación, Caja
  Negación, Kūmon, Indice Radar, Hollow, Números.
- **Quincy/Fullbring:** Licht Regen, Klavier, Qual Kreis, Sternenstaub, Heilig Pfeil Erobern, Spirit Weapon, Quincy:
  Letzt Stil, Sanrei Glove, Medallion, Auswählen, Shadow, Kirchenlied: Sankt Zwinger, Sankt Altar, Blut Vene Anhaben,
  Heizen, Gritz, Wolke, Sprenger, Geldschrank, Federzwinger, Flechette Barrier, Icosahedron Barrier, Soul Docking, Reishi
  Trap, Schrift, Quincy Bangle, Gift Bereich, Fullbringer.
- **Locations (group J2, for map rules):** Sekkiseki, Seireitei, Soul Society, Las Noches, Hueco Mundo, Dangai.
