# Rangiku Matsumoto - kit spec            (source: docs/roster/C1-lieutenants-1.md § Rangiku; tier A)

## 1. Identity
Lazy grace with a knife in it: a kick and a cocky smile while sealed; released, the blade is a cloud and the cloud
does the cutting wherever it settles. She controls space at mid range and never trades blows she does not have to.

## 2. Loadouts
One loadout, the main look (Soul Society → Fake Karakura): long wavy hair, open kosode, pink stole, badge on the
sash, Haineko across the back of the obi. The Human-World limiter is part of it (the daffodil Gentei Reiin on her
chest). Later looks (Isshin era, gigai, TYBW short hair and slit hakama, epilogue) are skins for later; the zombie
(TYBW) is an enemy variant for later.

## 3. Forms
| Form | Release | Power | Movement | Model | Notes |
|---|---|---|---|---|---|
| Sealed (limited) | - | ×0.85 | Shunpo | katana in her right hand, empty sheath on the obi, daffodil seal on the chest | G removes the limiter once |
| Sealed (Gentei Kaijo) | G: "Gentei kaijo" | ×1.2 | Shunpo | seal gone | the limiter stays off for the fight |
| Shikai Haineko | F: "Unare, Haineko" (唸れ 灰猫) | ×1.25 (×1.5 unlimited) | Shunpo, an ash trail | the hilt and its cat-head guard only; the ash cloud | the cloud has a **density** (0-1) that her moves spend and regrow; G "Hausu!" recalls it |
| (no Bankai) | - | - | - | - | F in Shikai is the ash shield |

## 4. Inputs per form
| Key | Sealed | Shikai |
|---|---|---|
| Shift | Shunpo | Shunpo (she leaves a wisp of ash) |
| LMB | cut, roundhouse kick, backhand cut, flying kick | flick right, flick left (ribbons of ash), the ash spear (thrust), the ash geyser (launcher) |
| RMB | the wide cut | **ash tide**: a dense wave that sandblasts through what it meets |
| Q | Hadō #31 Shakkahō (anime) | **ash veil**: the cloud pours over the target; ash settles on them and the ground round them |
| E | **Provoke** (Tres Bestias bait): the target is rattled (takes more damage); in a crowd, enemies turn on each other | **flick-cut**: every grain that settled cuts at once; damage by how much ash clung |
| R | **Play dead**: down in her own blood; struck or approached, she Shunpos behind and puts the blade to the throat, then cuts | **Neko Rinbu**: the cloud whirls into a cutting tornado that traps whoever it engulfs; an energy blast from inside breaks it |
| F | "Unare, Haineko" | **ash shield**: a dome of dense ash that swats shots away |
| G | Gentei Kaijo (once), then Bakudō #77 Tenteikūra | **"Hausu!"**: the ash splits into thin layers before her (a layered wall), then returns to the blade (sealed) |
| V | white flare | flare: the cloud blasts outward from her |

## 5. Completeness (inventory 33 → rows 33)
| # | Dossier item | Destination |
|---|---|---|
| 1 | Sealed form | form (default) |
| 2 | Shikai "Unare" | F (sealed) |
| 3 | Recall "House" | G (Shikai) |
| 4 | Gentei Kaijo (seal, reiatsu column) | G (sealed, first press) |
| 5 | Zombified (TYBW enemy) | skin/enemy variant, later |
| 6 | No Bankai | F (Shikai) is the shield; no third form |
| 7 | Swordsmanship (blocked Shinsō, cut Nakeem down) | LMB cuts, RMB wide cut |
| 8 | Hakuda (kicks, held off a stomp) | LMB kicks; the stomp catch is merged into Play dead's counter |
| 9 | Reflexes (flattens Kon/Keigo without looking) | passive: a melee blow from behind while she is idle is answered with a back kick (cooldown) |
| 10 | Shunpo (behind Nakeem) | Shift; the Play dead counter appears behind |
| 11 | Bakudō #77 Tenteikūra | G (sealed, after the limiter): the reiatsu net - for a while she cannot be blinded or turned around, allies hit harder |
| 12 | Hadō #31 Shakkahō (anime) | Q (sealed) |
| 13 | Hadō #58 Tenran (anime) | optional (anime-only), not built |
| 14 | Bait & provoke | E (sealed) |
| 15 | Play dead | R (sealed) |
| 16 | Blade to the throat | merged into Play dead's counter |
| 17 | Ash blade core rule (settled ash cuts on a flick) | Q (veil) + E (flick-cut) |
| 18 | Ash shaping (forms, engulf from any side) | LMB ribbons/spear/geyser, RMB tide |
| 19 | Ash shield | F (Shikai) |
| 20 | Neko Rinbu | R (Shikai) |
| 21 | House layers / Operation Mille-feuille with Hitsugaya | G (Shikai) layered wall + recall; the duo combo is a team system, later |
| 22 | Weightless blade (shrugs off weight) | passive: releasing clears slows; slows on her run half as long in Shikai |
| 23 | Spirit Haineko (anime) | optional (anime-only), not built |
| 24 | Zone control; ash reaches round cover | passive: the flick-cut needs no line of sight |
| 25 | White reiatsu | aura colour |
| 26 | Weakness: wind, explosions, Ceros scatter the cloud | rule: energy blows near her thin the cloud (density); a blast from inside breaks Neko Rinbu |
| 27 | Weakness: only a hilt while the ash is out | rule: she takes more damage in Shikai |
| 28 | Weakness: slacker | AI quirk: dawdles, taunts, plays dead when low |
| 29 | Main look | skin (built) |
| 30 | Isshin-era look (short hair, scarf) | skin, later |
| 31 | Gigai (school uniform, shopping outfits) | skin, later |
| 32 | TYBW look (shorter hair, slit hakama) | skin, later |
| 33 | Epilogue look | skin, later |

## 6. Timelines (60 Hz, the key ones)
- *Unare* (F): 0-14 the blade raised before her face; 14 the callout; 18-30 the blade crumbles tip to hilt into ash
  (the cloud spawns along it); 30-50 the flick that sends the cloud out round her.
- *Ash veil* (Q): 0-12 the hilt swirled overhead; 12 the stream pours to the target (0.7 s); every grain that
  reaches them adds ash (`ashK` up to 1), and a few tags settle on the ground and walls round them.
- *Flick-cut* (E): 0-6 the flick; 6 every enemy with ash on them takes `14 + 80 × ashK` (unblockable, it is
  already on them) and the tagged spots split with thin `cut` slits; ash consumed.
- *Neko Rinbu* (R): 0-24 both hands raised in a circle (the tell); 24-174 the tornado (r 2.4 m) round the target:
  pulled to the eye, cuts every 0.15 s, the ground eroded; 174 it bursts outward. An energy action by the
  trapped fighter breaks it early.
- *Ash tide* (RMB): 0-16 both arms sweep forward; 16-60 a wave 7 m wide runs 18 m: one heavy hit each and the
  walls it meets eroded slab by slab.
- *Play dead* (R sealed): 0-30 she drops; up to 4 s down, damage taken halved; an enemy inside 2.5 m (or a hit)
  triggers the counter: Shunpo behind, the blade at the throat for 0.6 s (bound), then the cut (×2, unblockable).

## 7. VFX / SFX / callouts
Ash `#BDB8B1`, clumps `#8F8A84`, glints `#FFFFFF` (×2), cut flashes `#EDEDED`; reiatsu white `#F4F4F6` with a pink rim
`#FFD9E6`; Shakkahō `#E3262E`; the Gentei seal daffodil `#E8C14A`. Callouts: 唸れ「灰猫」 UNARE, HAINEKO · 猫輪舞
NEKO RINBU · ハウス HAUSU! · 破道の三十一「赤火砲」 SHAKKAHŌ · 縛道の七十七「天挺空羅」 TENTEIKŪRA · 限定解除 GENTEI KAIJO.

## 8. AI profile
Playful, mid range. Releases Shikai early (0.9); the limiter at the first sign of trouble (toggleAt 0.8). Opens with
Provoke. Shikai: veil then flick-cut, Neko Rinbu on a close or cornered target, the tide at range, the shield when
shots come in, "Hausu!" rarely when pressed hard at point blank. Below 30 % HP once: Play dead (sealed) - the
counter is the punishment for walking up.

## 9. Story hooks
Sōkyoku Hill (the blade at Gin's throat) · Kira on the rooftops (Unare after the seven parries) · Nakeem (plays dead,
the limiter, Shunpo behind) · the Tres Bestias (provoke, Neko Rinbu broken by a triple Cero, the shield vs Apacci) ·
Tenteikūra in the first invasion · Operation Mille-feuille with Hitsugaya vs Bazz-B.

## 10. Test plan
Headless probes: every LMB step lands at 1.6-2.4 m (sealed) and 3-7 m (Shikai); the veil raises `ashK` and the
flick-cut deals more with more ash and consumes it; Neko Rinbu holds a target and breaks on a Cero from inside;
the tide damages at 10 m and erodes a wall; the shield rejects a Getsuga; Play dead's counter fires on approach
and on a hit; G recalls the ash and returns to the sealed moveset; density never goes negative. Screenshots: the
model (front, three-quarter, back, face), the ash cloud idle, each Shikai move in play, the release.

## 11. Engine needs
Existing: `PetalSwarm` (new formations: cloud, tornado, layers; a look option for ash), `g.rejectNear` (shield,
House), `agedK/agedT` (Provoke), `iffT` (crowd provoke), `blindT/invertT` cleared by Tenteikūra, parry hooks
(Reflexes, Play dead), `unblockable` (flick-cut, the throat cut). New: a per-fighter ash coat (`ashK`) kept by the
kit (an AshCoat effect) - no engine change.

## 12. Open questions
(verify) the hilt guard metal; the sheath colour; the exact Japanese for "Operation Mille-feuille"; the Gentei
seal's colour (game choice).
