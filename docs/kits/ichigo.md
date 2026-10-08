# Ichigo Kurosaki - kit spec            (source: docs/roster/A1-ichigo.md § 0-1; tier S; waves W0-W3)

## 1. Identity
The boy who keeps getting up: a raw, scowling brawler whose power arrives in bursts bigger than he can hold, then
learns to hold it. Every era must feel like a different fighter wearing the same stubbornness — a street karateka, a
kid swinging a sword taller than himself, the Getsuga-throwing Substitute, the Visored on a timer, the god-tier Dangai
swordsman who burns everything on one cut, the human Fullbringer, and the TYBW hybrid with two blades and four races
in his blood.

## 2. Loadouts
Ichigo is **one card** on the start screen with **era chips** under it (the roster entries share `group: 'ichigo'`).
Each era is its own loadout; inside one, **F climbs the form ladder** and **G toggles the era's state**.

| Era (id) | Ladder (F) | G | Model(s) | Status |
|---|---|---|---|---|
| **Agent of the Shinigami** (`ichigo-agent`) | Human (K0) → Kon's pill: the soul pops out → Substitute Shinigami with the first sword (K1) → "Zangetsu!": Shikai v1 | Human: spirit sight · Substitute: the reiatsu surge · Shikai: - | school uniform 174 cm; shihakushō + brown strap, the giant katana and sheath | planned (W3) |
| **Soul Society** (`ichigo-ss`) | Shikai v1 → Bankai v1 | **"Let it out"**: the Hollow takes over (K8a half mask) | Shikai v1 / Bankai v1 + half mask | planned (W3) |
| **Hueco Mundo** (`ichigo`) | Shikai v1 → Bankai v1 | Hollow mask (11 s) | existing | **built** (K2/K3/K8c) |
| **Hollowfied** (`ichigo-lizard`, boss entry) | the husk cracks and sloughs: Bankai v1 masked | - | the lizard Hollow body | planned (W3) |
| **Fake Karakura** (`ichigo-dangai`) | Bankai v2 → Saigo no Getsuga Tenshō → Mugetsu → spent (human, no powers) | higher-plane presence | long-hair Bankai v2; the Final Getsuga form; school uniform | planned (W2) |
| **Lost Agent** (`ichigo-fullbring`) | FB1 badge guard → FB2 clad → FB3 complete → Rukia's sword: Shikai v2 → Bankai v3 | FB1 manji guard · FB2 berserk surge · FB3 the catch · Shikai v2 cloth wrap · Bankai v3 rage aura | Lost Agent casual 181 cm; FB2 clad; FB3 armour; restored Shikai v2; Bankai v3 | planned (W2) |
| **Thousand-Year Blood War** (`ichigo-tybw`) — *peak, the card's default* | True Shikai (dual) → Half-Hollow → True Bankai (→ the shell breaks) | Blut Vene · in Half-Hollow: **Blood Chains** [anime-only] | TYBW uniform with the twin blades; Half-Hollow (horn, white blade); Blood Chains; True Bankai's white cleaver | **this wave** |

Skins (no mechanics): **Ōken garb** (TYBW; planned: the outer layers burn off on the first big energy hit),
**adult** (epilogue; planned), white shihakushō [anime-only] (optional). "All Eras" (one ladder through every form) is
not built: the era chips cover every form.

## 3. Forms
| Era | Form | Release | Power | Movement | Model | Timers / rules |
|---|---|---|---|---|---|---|
| Agent | Human | - | ×0.6 | sprint, a vaulting dash (no Shunpo) | Karakura High: grey blazer open over a white shirt, grey trousers | the body is left behind on ejection |
| Agent | Substitute | F: Kon's pill; the soul pops out (Kon keeps the body and fights) | ×0.9 | a raw lunge-dash, no chaining | shihakushō, the brown strap, the 1.65 m katana; the brown sheath on the back | the blade sticks in walls |
| Agent | Shikai v1 | F: **"Zangetsu!"** — the blade is cut down to the hilt and the cleaver bursts out, the first swing tears a trench | ×1 | Shunpo | Shikai v1 | no Bankai yet |
| SS | Bankai v1 | F: "Ban… kai — Tensa Zangetsu" | ×1.3 | hyper-speed Shunpo, afterimages | Bankai v1 coat | the 3rd Black Getsuga inside 30 s lets the Hollow out |
| SS | possessed (G) | G "let it out"; forced by the 3rd Black Getsuga | ×1.5 | erratic flash steps | half mask over the left of the face, black-gold eye | the Hollow fights on its own 12 s; mash G to tear it off |
| Hollowfied | lizard body | (boss entry) | ×1.4 | lunges | white, maroon marks, spikes, tail, near-full mask | instant regeneration; F: the husk cracks → Bankai v1 masked |
| FK | Bankai v2 | (default) | ×1.6 | near-teleport Shunpo | long hair, the open coat, bare right arm, the glove, the chain spiralling up the arm | - |
| FK | Saigo no Getsuga Tenshō | F: "Saigo no Getsuga Tenshō" — the hair floods black to the waist, bandages wind on, eyes red | ×2.4 | flicker-steps (no travel seen) | the Final Getsuga form | super armour; 20 s, then Mugetsu fires by itself |
| FK | spent | after Mugetsu | ×0.4 | a human's | school uniform | no reiatsu: Q/E/R/F/G off for the rest of the match |
| LA | FB1 | (default) | ×0.8 | Bringer Light (green flicker, springy jump) | Lost Agent casual: black long-sleeve, light grey trousers, the badge in the fist | manji blasts decay |
| LA | FB2 | F: the reiatsu clads him | ×0.95 | faster, afterimages | ragged black reiatsu shihakushō, white trims, the arm blade | - |
| LA | FB3 | F: completion — the explosion | ×1.1 | afterimages, behind-the-target blinks | bone-white armour on a black bodysuit, the face band, the machete | - |
| LA | Shikai v2 | F: Rukia's sword through the chest — the explosion of the Gotei's reiatsu | ×1.3, reiatsu refilled | Shunpo | shihakushō, the thick strap, the forearm lines and tattoo bands; the cleaver with the silver hilt and chain | Getsuga mansion-sized, clears rain |
| LA | Bankai v3 | F: "Bankai" — the release shatters enclosing constructs | ×1.6 | hyper-speed Shunpo | open coat over a white undershirt, white X marks, coat-tails, gloves; the long curved daitō, the chain loop | rage aura (G) |
| TY | True Shikai | (default) | ×1.5 | long Shunpo leaps | TYBW uniform: puffy sleeves, white X plates with red scales, the white waist cloak; large blade right hand, small blade left | Blut Vene (G) |
| TY | Half-Hollow | F: he soaks the large blade in Quincy reiatsu — it whitens, veins crawl over it, his reiatsu explodes | ×1.9 | instant reposition bursts | one horn on the left, the left eye inverted, black marks to a hole at the neck, the tattered black mantle; the large blade white | **horn = weak point** (×3; 140 damage on it snaps it: back to True Shikai) |
| TY | Blood Chains [anime-only] | G (in Half-Hollow): the sky darkens, a blood moon slides into eclipse | ×2.2 | each Shunpo leaves a reiatsu clone (max 8) | deep-red skin, two horns, the open ragged robe, chain flames at neck, wrists and ankles; the silver cleaver with the red tassel | every footstep a black flame; G again: released (wet footprints) |
| TY | True Bankai | F: the two blades side by side — a pillar of fire and the lunar eclipse | ×2.4 | Shunpo | TYBW uniform; the 2.3 m white-shelled cleaver with its chain | **Shell Break** (F): the shell crumbles, the original Zangetsu cuts; a disarm breaks the shell instead |

## 4. Inputs per form

### TYBW
| Key | True Shikai | Half-Hollow | Blood Chains [anime-only] | True Bankai (→ the original Zangetsu) |
|---|---|---|---|---|
| Shift | long Shunpo | an instant reposition burst | a blinding dash: each leaves a reiatsu clone that fights (max 8, popped by a strong hit) | Shunpo |
| LMB | **twin-blade string** (6): big forehand, small stab, big backhand, small rising, the twin X, the big overhead; the 6th, point-blank, seizes and **hurls the foe through buildings**; in the air from high up: the **descent** (plunge, crater) | **white-blade string** (5) with left-hand grabs; every swing wrecks the ground behind | **cleaver string** (5): every hit schedules a **delayed echo hit** 0.6-1.6 s later | three slow colossal swings that cut whole structures (after the shell breaks: the original Zangetsu's 5-cut string) |
| RMB | **Chain**: the large blade hurled; RMB again (or at its stop) **beckons it back**, cutting along the return (LMB meanwhile: the small blade's quick stabs) | **sword-arm lock**: seizes the weapon arm (numb 3 s) and cuts at the head | **chain bind**: blood chains from the tassel wrap the target (rooted, no actions 2.2 s; held in mid-air if airborne) | overhead **golden cleave** (a planar cut 40 m) |
| Q | **small-blade Getsuga**: point and flick, 3 charges | large-blade Getsuga (white-gold) | **clone volley**: every clone lunges at once | **golden Getsuga** (enormous, bisects buildings) |
| E | **large-blade Getsuga** (point-blank inside 3 m: impale + Getsuga that rips through) | **Gran Rey Cero** off the horn (violet; costs 6 % HP) | **chain wall**: interlocking chains before him reject every shot for 2.5 s | **flat-of-blade guard**: frontal blows ×0.15, shots swatted back, 1.6 s |
| R | **Getsuga Jūjishō**: small then large fuse into a giant cross that eats shots and barriers in its path | **Cero Creciente**: a Getsuga swelling from gold to violet into a massive slash | **Blood Chains Getsuga**: drinks the clones (bigger with each), drops from above; a giant black crescent hangs in the sky 20 s | **impale + point-blank Getsuga** |
| F | Half-Hollowfication | True Bankai (the horn crumbles) | True Bankai | **Shell Break** (once): unblockable bisecting cut; then the original Zangetsu |
| G | **Blut Vene** (×0.5 damage, no bleeding, cyan veins where struck, an arrow caught every 2 s; drains reiatsu) | **Blood Chains** [anime-only] | release Blood Chains | Blut Vene |
| V | gold flare (rain boils to steam) | violet-red flare | blood-red flare | gold flare |
| passive | ambidextrous; immune to Bankai theft | horn weak point; the merged power can be absorbed (Auswählen) | black-flame footprints | a disarm breaks the shell instead |

### Fake Karakura (post-Dangai)
| Key | Bankai v2 | Saigo no Getsuga Tenshō | spent |
|---|---|---|---|
| Shift | near-teleport Shunpo | flicker-step (no travel seen) | a human dash |
| LMB | Bankai string, every hit throws an area shockwave | smoky right-arm strikes | karate string |
| RMB | **mountain-leveller**: one swing, a planar cut 60 m wide | black-blade thrust | concrete-cracker kick |
| Q | Black Getsuga (larger) | - | - |
| E | **seize & relocate**: grabs the target, Shunpo-carries it 40 m, slams it into the ground | - | - |
| R | **bare-hand catch**: a blade caught (the deflected force wrecks the ground), shots and constructs crushed | - | - |
| F | Saigo no Getsuga Tenshō | **Mugetsu** (fires by itself at 0 s): a horizon-wide curtain of black reiatsu, the sky blacked out; then spent | - |
| G | **higher-plane presence**: beyond 8 m no enemy can sense or lock onto him (drains reiatsu) | - | - |
| V | black-crimson flare / suppression | - | - |

### Lost Agent
| Key | FB1 | FB2 | FB3 | Shikai v2 | Bankai v3 |
|---|---|---|---|---|---|
| Shift | Bringer Light step (green flicker); jumps spring off the ground | + afterimages | + blink behind the target | Shunpo | hyper-speed Shunpo |
| LMB | karate + manji-guard bashes | arm-blade slashes + kicks | machete string mixed with kicks | the Shikai string (Hueco Mundo kit) | longer-reach Bankai string |
| RMB | guard ram | berserk arm sweep | energy-held blade swing | heavy | big shockwave swing |
| Q | **manji blast** (6 blades, each shot in a row loses one; under 3 it shatters; 3 in a row: 1 s helpless) | stronger manji blast | **manji barrage** (fan, no decay) | **Getsuga** (mansion-sized, clears rain) | Getsuga (black, blue rim) |
| E | charged six-bar manji | charged manji | **Fullbring Getsuga** (small, very fast) | ground Getsuga | **catch & crush** an energy blast |
| R | focused-leg kick | focused-leg kick | **first-strike cut**: behind the target, a limb taken (arm numb 6 s) | Deadly Darts | **sword-breaker cut** (disarms 8 s) |
| F | → FB2 | → FB3 | → Shikai v2 (Rukia's sword) | → Bankai v3 | **re-release**: the shock wave shatters domes and fields |
| G | **manji guard** (absorbs a big hit) | **berserk surge** (+50 % damage, HP drain, no guard) | **the catch**: a giant blow stopped one-handed → counter | cloth wrap (heal over time) | **rage aura** (red-black lightning: +35 % damage, slower recovery) |
| V | flare | flare | flare | flare | flare |

### Agent of the Shinigami
| Key | Human | Substitute (first sword) | Shikai v1 |
|---|---|---|---|
| Shift | a vaulting dash | raw lunge-dash | Shunpo |
| LMB | karate string: jab, cross, roundhouse, spinning back kick | three wide two-handed swings (they bite into walls and can stick) | Shikai string (Hueco Mundo kit) |
| RMB | **concrete-cracker kick** | **street-upturning cleave** | heavy |
| Q | **catch & throw** (a weapon or arm caught one-handed, the judo throw) | **Ichigo Homerun** (launcher) | Getsuga Tenshō |
| E | **the baseball bat** (night one) | **mask-breaker** (×3 on Hollows; purifies lesser ones) | ground Getsuga |
| R | the protective charm (one barrier on the next big hit) | **Cero block**: the flat raised — beams fill the overload meter, shots go back to their owner; R again (or full): the repel wave; overfilled: it vents skyward, burning him | Deadly Darts |
| F | **Kon's pill**: the soul pops out; Kon keeps the body (an ally with super legs) | **"Zangetsu!"** | - (no Bankai yet) |
| G | **spirit sight**: the red ribbon to the target, Hollows marked | **reiatsu surge** (8 s ×1.4, leaks reiatsu) | - |
| V | flare (the leak: Hollows come to him) | uncontrolled flare | flare |

### Soul Society / Hollowfied
Soul Society = the Hueco Mundo kit's Shikai and Bankai with **G = "let it out"** (K8a) instead of the mask: the
half mask forms over the left of his face; for 12 s the Hollow fights by itself (no guard, chained cuts, +50 %
damage, the pincer Black Getsuga from two sides then above, bare-hand catches); **mash G (6 presses) to tear the mask
off**. The 3rd Black Getsuga inside 30 s forces it. No Full Hollow.
Hollowfied (lizard): LMB claw rakes and tail lashes · RMB the tail sweep (360°) · Q **two-finger Cero** (crimson,
tri-focus) · E **High-Speed Regeneration** (white matter fills the wounds: +25 % HP) · R the **arm-maw**: the left arm
drops, a worm mouth with a studded tongue lunges 7 m from the stump, then a spiked arm regrows · Shift lunges · G a
roar that breaks binds · F the husk cracks from the shoulders and sloughs off → Bankai v1 with the 11 s mask.

## 5. Completeness (inventory 179 → rows 179)
Loadouts: AG Agent, SS Soul Society, HM Hueco Mundo (built), VT Hollowfied, FK Fake Karakura, LA Lost Agent, TY TYBW;
HI = Hollow Ichigo's own kit (built).

| # | Dossier item | Destination |
|---|---|---|
| 1 | Human teen (uniform; casual "15") | AG Human form; FK spent form (uniform); "15" tees: skin (not built) |
| 2 | Substitute Shinigami, first sword | AG Substitute form |
| 3 | Shikai v1 outfit (red kite strap) | HM/SS/AG Shikai (built model) |
| 4 | Bankai v1 coat | HM/SS Bankai (built model) |
| 5 | Mask (a): Soul Society half possession mask | SS G (half-mask prop) |
| 6 | Mask (b): first full mask, three stripes | HM G (built) |
| 7 | Mask (c): Hueco Mundo, ten stripes | skin of HM G (not built) |
| 8 | Mask (d): post-Ulquiorra, a thick stripe each side | FK (not used: no mask in that era) — skin (not built) |
| 9 | Hollow "lizard" body | VT entry |
| 10 | Full Hollow form | HM K8c revive (built); HI monochrome (built) |
| 11 | Post-Dangai Bankai v2 | FK Bankai v2 form |
| 12 | Final Getsuga form | FK F |
| 13 | Fullbring 1 (badge guard) | LA FB1 |
| 14 | Fullbring 2 (clad) | LA FB2 |
| 15 | Fullbring 3 (complete armour) | LA FB3 |
| 16 | Restored Shikai v2 | LA Shikai v2 |
| 17 | Bankai v3 | LA Bankai v3 |
| 18 | Ōken garb | skin of TY (planned: LayeredOutfitDestruction) |
| 19 | TYBW uniform | TY True Shikai / True Bankai |
| 20 | Half-Hollowfication look | TY Half-Hollow |
| 21 | Blood Chains Ichigo [anime-only] | TY G in Half-Hollow (optional) |
| 22 | True Bankai | TY True Bankai |
| 23 | Adult (epilogue) | skin (planned) |
| 24 | White shihakushō [anime-only] | optional skin (not built) |
| 25 | Brave Souls what-ifs [game-only] | optional (not built) |
| 26 | First sword (giant katana, flame guard, tassels, sheath) | AG Substitute prop |
| 27 | Shikai v1 cleaver, cloth tang | built (HM) |
| 28 | Shikai v2 cleaver (silver hilt, chain) | LA Shikai v2 prop |
| 29 | Bankai v1 daitō | built (HM) |
| 30 | Bankai v2 guard and arm chain | FK prop + the arm chain on the model |
| 31 | Bankai v3 curved daitō, chain loop | LA Bankai v3 prop |
| 32 | Fullbring machete (badge guard, white sheath) | LA FB3 prop |
| 33 | True Shikai twin blades | TY props |
| 34 | True Bankai white-shell cleaver | TY prop (+ shell shards) |
| 35 | Half-Hollow white blade | TY Half-Hollow prop |
| 36 | Blood Chains silver cleaver [anime-only] | TY Blood Chains prop |
| 37 | Mugetsu blade | FK Mugetsu (black reiatsu blade VFX) |
| 38 | Karate & street brawling | AG Human LMB; FK spent LMB; LA FB1 LMB |
| 39 | Concrete-cracker kick | AG Human RMB; FK spent RMB |
| 40 | Spirit sight & sensing | AG Human G |
| 41 | Reiraku (spirit ribbons) | merged into AG Human G (the red ribbon) |
| 42 | Pattern reading / growth | passive (all new eras): the 3rd identical blow in a row from one foe is parried |
| 43 | Ambidexterity | TY twin blades (left-hand small blade) |
| 44 | Cannot use Kidō | rule: no Kidō in any era |
| 45 | Soul ejection | AG Human F (Kon's pill) |
| 46 | Konsō / purification | merged into AG Substitute E (mask-breaker purifies) |
| 47 | Reishi footing | Space air-step (all eras, engine) |
| 48 | Shunpo | Shift (from Shikai on) |
| 49 | Monster strength & toughness | TY LMB 6th (hurl); stats |
| 50 | Three-lieutenant KO | story (Sōkyoku Hill) |
| 51 | Reiatsu flare (solid gold in TYBW, boils rain) | V (all eras) |
| 52 | Sōkyoku stop | story; merged into FK R (catch) |
| 53 | Scaffold blast (Kongenzan) | merged into AG Shikai heavy (the existing chop) — story |
| 54 | Immune to Kyōka Suigetsu and Bankai theft | passive (flag `illusionImmune`, `noTheft`; noted for Aizen/Medallions) |
| 55 | Oversized blade sticks in walls | AG Substitute LMB (WeaponEmbed) |
| 56 | Ground upturn | AG Substitute RMB |
| 57 | Cero block / overload | AG Substitute R |
| 58 | Ichigo Homerun | AG Substitute Q |
| 59 | Leech feed | merged into AG Substitute R (small shots go back to their owner) |
| 60 | Reiatsu surge | AG Substitute G |
| 61 | First release swing (the trench) | AG Substitute F (cinematic) |
| 62 | Blade-shield (flat blocks energy) | merged into AG Substitute R; TY True Bankai E |
| 63 | Cloth control (sheath, bandage) | LA Shikai v2 G (bandage) |
| 64 | Deadly Darts | HM R (built); LA Shikai v2 R; AG Shikai R |
| 65 | Getsuga Tenshō | HM Q (built); every Shikai |
| 66 | Ground-plow Getsuga | HM E (built) |
| 67 | Omni-blast Getsuga | merged into HM E (the burst at the start of the plow) |
| 68 | Restored-era Getsuga (mansion, rain) | LA Shikai v2 Q |
| 69 | Kenpachi finisher | merged into HM heavy finisher (slash5) — story |
| 70 | Bankai release burst (breaks binds) | HM F (built); LA Bankai v3 F |
| 71 | Hyper-speed, afterimages | Shift (Bankai) |
| 72 | 360° storm (vs petals) | merged into HM LMB 4 (the spin) |
| 73 | Black Getsuga (steerable) | HM Q in Bankai (built); FK Q |
| 74 | Getsuga bullet | HM E in Bankai (built) |
| 75 | Getsuga-infused blade (Matoi) | HM R in Bankai (built) |
| 76 | Bankai strength (cuts Hierro) | stats |
| 77 | Bankai coat tatters with reiatsu | not built ([NEW: ResourceLinkedCosmetics]) |
| 78 | Low-drain Bankai | rule: no Bankai drain |
| 79 | Bankai v2: one swing flattens a mountain | FK RMB |
| 80 | Bankai v2: catches Aizen's blade bare-handed | FK R |
| 81 | Bankai v2: crushes Kurohitsugi by hand | merged into FK R (constructs and Kidō crushed) |
| 82 | Bankai v2: seizes Aizen, hurls him out of town | FK E |
| 83 | Bankai v2: reiatsu on a higher plane | FK G |
| 84 | Bankai v3: catches and crushes a blast | LA Bankai v3 E |
| 85 | Bankai v3: cuts Ginjō's sword in two | LA Bankai v3 R |
| 86 | Bankai v3: rage aura (red-black lightning) | LA Bankai v3 G |
| 87 | Throw & follow (TYBW) | merged into TY RMB (Chain) |
| 88 | Bankai broken (Haschwalth, Yhwach) | TY rule: a disarm breaks the shell instead; story |
| 89 | Mask summon (claw-rip) | HM G (built) |
| 90 | Masked power | HM G stats (built) |
| 91 | Masked Getsuga (outruns itself) | HM Q masked; HM R masked barrage (built) |
| 92 | Mask regeneration | not built (mask HP is a timer) |
| 93 | Re-summon | HM G cooldown (built) |
| 94 | Hollow combat (instinctive) | SS G (possession) |
| 95 | Reiatsu launch (jump booster) | merged into Shift (Bankai) |
| 96 | Mask limits (4 s → 11 s → minutes; fear) | HM G 11 s (built) |
| 97 | Mask shielding (auto, fatal blows) | SS passive: once a fight a lethal blow is stopped by a mask fragment |
| 98 | Shattered Shaft mask | story |
| 99 | Partial possession (vs Byakuya) | SS G |
| 100 | Lizard body (regeneration, arm-maw, two-finger Cero, pillars, slough) | VT entry (all slots) |
| 101 | Full Hollow (chain recall, horn Cero, Sonído, arm rip, Lanza catch, stomp Cero, horns, regeneration) | HM K8c (built) |
| 102 | Anime takeovers (Bount, Muramasa, Reigai) [anime-only] | story (not built) |
| 103 | Jinzen | story |
| 104 | Saigo no Getsuga Tenshō | FK F |
| 105 | Mugetsu | FK F (Final Getsuga form) |
| 106 | Aftermath: powers lost | FK spent form (Depower) |
| 107 | Badge guard | LA FB1 G |
| 108 | Manji blast (segments decay) | LA FB1/FB2 Q |
| 109 | Clad stage, arm blade | LA FB2 |
| 110 | Completed Fullbring (barrage) | LA FB3 Q |
| 111 | Fullbring Getsuga | LA FB3 E |
| 112 | Bringer Light | LA Shift (FB1-FB3) |
| 113 | Focused leg | LA FB1/FB2 R |
| 114 | Catch Sado's punch | LA FB3 G |
| 115 | First-strike cut (Tsukishima's arm) | LA FB3 R |
| 116 | Fullbring basics (object souls) | merged into LA Shift (springy ground) |
| 117 | Fullbring weaknesses (strain, theft) | rule: FB2 surge drains HP; theft = story |
| 118 | Reawakening (Rukia's sword) | LA FB3 F (cinematic) |
| 119 | Ōken garb (outer layers lost) | skin of TY (planned) |
| 120 | Irazu Sandō [anime-only] | story (not built) |
| 121 | Barrier-breaking descent | TY air LMB from height (the descent) |
| 122 | True dual Shikai | TY True Shikai |
| 123 | Small-blade Getsuga | TY Q |
| 124 | Large-blade Getsuga | TY E |
| 125 | Getsuga Jūjishō | TY R |
| 126 | Chain (recall) | TY RMB |
| 127 | Arrow catch | TY G (Blut Vene catches an arrow every 2 s) |
| 128 | Blut Vene | TY G |
| 129 | Blood hijack (enemy effect) | Yhwach's kit (story) |
| 130 | Point-blank Getsuga | merged into TY E (inside 3 m); TY True Bankai R |
| 131 | Half-Hollowfication | TY F (True Shikai) |
| 132 | Half-Hollow physicals (grab the sword hand, room-levelling flare) | TY Half-Hollow RMB; V |
| 133 | Gran Rey Cero (horn, blood) | TY Half-Hollow E |
| 134 | Cero Creciente | TY Half-Hollow R |
| 135 | Torrent riding | merged into TY Half-Hollow Shift |
| 136 | Half-Hollow weaknesses (horn snapped, absorbed) | TY rule: horn weak point; Yhwach's Auswählen ends the form |
| 137 | Blood Chains Ichigo [anime-only] | TY Half-Hollow G |
| 138 | Blood Chains (wall, restraints) [anime-only] | TY Blood Chains E, RMB |
| 139 | Reiatsu Clones, late hits [anime-only] | TY Blood Chains Shift, Q; LMB echo hits |
| 140 | Suspension strands [anime-only] | merged into TY Blood Chains RMB (held in mid-air) |
| 141 | Blood Chains Getsuga, the crescent in the sky [anime-only] | TY Blood Chains R |
| 142 | Cero Creciente retained [anime-only] | merged into TY Half-Hollow R |
| 143 | True Tensa Zangetsu | TY F (Half-Hollow / Blood Chains) |
| 144 | Golden Getsuga | TY True Bankai Q |
| 145 | Shell break | TY True Bankai F |
| 146 | Hell Verse: Full Hollow, Skull-Clad Rengoku Getsuga [movie-only] | optional (not built) |
| 147 | Game-only move names | labels: *Getsuga Matoi* (built), *Tensa Kyōga* (LMB 4) |
| 148 | Unbreakable will | passive (new eras): once a fight a lethal blow leaves him at 1 HP with +20 % power for 6 s |
| 149 | Vast reiatsu | stats (rei per era) |
| 150 | Weakness: poor reiatsu control (leaks) | AG V (draws Hollows); AG Substitute G drains |
| 151 | Weakness: body/soul split | AG F (Kon keeps the body; if it dies, the soul is stunned 2 s) |
| 152 | Weakness: inner Hollow takeover | SS rule (3rd Black Getsuga) |
| 153 | Weakness: pulls punches with friends / baited through allies | AI quirk |
| 154 | Night one (Rukia, the bat, the one-cut kill) | AG E (the bat); story |
| 155 | Shrieker (leech, Gate of Hell) | story; AG R (shots go back) |
| 156 | Grand Fisher in the rain | story |
| 157 | Menos Grande (Cero block, overload, vent) | AG Substitute R |
| 158 | Byakuya in the rain (blade snapped) | story |
| 159 | Shattered Shaft and Urahara's hat test | AG Substitute F (cinematic) |
| 160 | Seireitei breach (Jidanbō, Ikkaku, Renji, Kenpachi) | story |
| 161 | Bankai in three days (the true blade among many) | story |
| 162 | Sōkyoku Hill (phoenix, scaffold, three lieutenants) | story |
| 163 | Byakuya duel (Hollow surfaces, mask torn off) | SS G |
| 164 | Aizen's betrayal | story |
| 165 | Yammy & Grimmjow I | story |
| 166 | Visored training (inner and outer fight) | VT entry; story |
| 167 | Grimmjow II (the 11-second mask) | HM G (built) |
| 168 | Hueco Mundo (Dordoni, Ulquiorra I, Grimmjow III) | HM (built) |
| 169 | Ulquiorra II on the dome → Full Hollow | HM K8c (built) |
| 170 | Fake Karakura (Dangai, catch Aizen, Kurohitsugi, Mugetsu) | FK |
| 171 | Losing his powers | FK spent form |
| 172 | Lost Agent (dollhouse, fish tank, game world, Tsukishima, Ginjō) | LA; story |
| 173 | Quilge's Jail, Haschwalth breaks the Bankai | story; TY rule (shell) |
| 174 | Royal Realm (Nimaiya's forging, the inner-world truth) | TY (twin blades); story |
| 175 | The return (72 barriers, four Sternritter, Galvano Blast, Jūjishō) | TY descent, LMB 6th hurl, R |
| 176 | Soul King's chamber (arm hijacked, Sternenstaub) | story |
| 177 | Wahrwelt throne room (Half-Hollow, Cero Creciente, Blood Chains) | TY Half-Hollow; Blood Chains |
| 178 | The final fight (edit, illusion, silver arrow, shell break) | TY True Bankai F |
| 179 | Epilogue / No Breaths From Hell | skin (adult, planned) |

## 6. Timelines (60 Hz) — TYBW
- *Twin-blade string*: 6 cuts — big forehand 30 (cut 400), small stab 18, big backhand 30, small rising 20 (launch 6),
  twin X 2×24, big overhead 52 (heavy, ground impact r 2.2); the 6th inside 1.8 m becomes the **hurl**: grab at 10,
  thrown at 28 (60, Plow 0.9 s through what stands behind).
- *Descent* (air LMB, ≥ 5 m above the ground): dive at 40 m/s, impact crater r 3 (90, launch 8).
- *Chain*: the throw at 14, the blade flies 40 m/s up to 26 m (70, cut 700); embeds at the end or in the first foe (a
  60 hit, pinned 0.8 s); RMB (or 1.8 s) beckons it: the return at 46 m/s cuts what it crosses (45).
- *Small Getsuga*: flick at 9, 3 charges (refill 1.1 s each), radius 1.6, 70 m/s, 28 damage, cut 380.
- *Large Getsuga*: at 22, radius 3.8, 52 m/s, range 120, 130 damage, cut 1100; inside 3 m: impale at 12 (40) then the
  Getsuga at 30 (140, heavy) from the impaled foe.
- *Jūjishō*: small at 12, large at 26; they fuse at 0.25 s into the cross (radius 5, 46 m/s, 190 damage, cut 1400);
  every enemy shot within 3.5 m of its path is rejected.
- *Blut Vene*: up to 12 s, ×0.5 damage taken, bleeding off; cyan veins flash where hit; an energy projectile hitting
  him is caught and crushed (one per 2 s); 5 rei/s.
- *Half-Hollowfication*: 0-30 the blade whitens (Blut veins crawl), 34 the explosion (r 12: 60, knock 24; carve r 4).
- *White-blade string*: 34/30/36/40/58, each with a ground wave behind (power 200). *Sword-arm lock*: grab at 10 (arm
  numb 3 s), the head cut at 30 (70, heavy).
- *Gran Rey Cero*: 0-36 charge at the horn (6 % HP), beam 0.6 s (radius 1.1, 90 m, 26/tick → ~180, bore).
- *Cero Creciente*: 0-40 the Getsuga raised, gold → violet; at 42 the crescent (radius 5.5, 40 m/s, 260, cut 1800,
  explode on impact r 4).
- *Blood Chains*: activation 0-60 (the eclipse, sky tint), clones from Shift (max 8, 10 s, 1 HP-hit), echo hits
  (+60 % of each LMB hit, 0.6-1.6 s later), clone volley (each clone a 30 lunge), chain wall (2.5 s, 6 m wide, rejects
  shots), chain bind (2.2 s root), Blood Chains Getsuga (radius 6 + 0.6 per clone, 300 + 30 per clone, the sky
  crescent 20 s).
- *True Bankai*: activation 0-50 (blades side by side, fire pillar, eclipse); swings 70/80/110 (cut 1200, reach 2.8 m);
  golden cleave (a 40 m planar cut at 30, 160); golden Getsuga (radius 7, 60 m/s, 220, cut 2400); guard 1.6 s;
  impale + Getsuga (50 + 180); **Shell Break**: 0-24 the shell cracks and falls, 28 the cut (dash 12 m, 320,
  unblockable, heavy), then the original Zangetsu (Shikai v1 string ×1.6).

## 7. VFX / SFX / callouts
Gold reiatsu `#FDE671` / `#F6C343`, Getsuga gold (core `#FDFFD9`, body `#FEF698`→`#F4D761`, rim `#C6923D`); Blut Vene
cyan (core `#E6FBFF`, glow `#9CDFF1`, outer `#2D74D0`); Half-Hollow violet Cero (core `#F6E6FF`, body `#9B30FF`, rim
`#5A0FA0`); Blood Chains (chain core `#FFD0B8`, flame `#FF3B2F`, outer `#B0101C`, smoke `#3A0508`; Getsuga black with a
hard white outline); True Bankai gold and white. Callouts: 月牙天衝 GETSUGA TENSHŌ · 月牙十字衝 GETSUGA JŪJISHŌ ·
静血装 BLUT VENE · 半虚化 HALF-HOLLOWFICATION · 王虚の閃光 GRAN REY CERO · 月虚閃 CERO CRECIENTE · 血鎖 BLOOD CHAINS ·
卍解 天鎖斬月 BANKAI — TENSA ZANGETSU · チェイン CHAIN (silent beckon: no shout) · 最後の月牙天衝 SAIGO NO GETSUGA TENSHŌ ·
無月 MUGETSU · 斬月 ZANGETSU.

## 8. AI profile
Charges straight in, tests with heavy swings, Getsuga as a finisher or to clear shot swarms. TYBW: dual-blade pressure,
the small Getsuga to poke, Jūjishō against big shots, Blut Vene under burst damage, Half-Hollow at 60 %, True Bankai
at 30 %, the Shell Break as the finisher; Blood Chains only in Half-Hollow (weight 1, anime-only). Fake Karakura: the
calm swordsman; Final Getsuga at 35 % — a countdown boss. Lost Agent: climbs the Fullbring ladder quickly (85/65/45 %),
reawakens at 30 %. Protector: never finishes a downed friend.

## 9. Story hooks
See dossier §1 signature moments (rows 154-179): the TYBW return (descent, four Sternritter thrown, Jūjishō vs
Electrocution), the throne room (Half-Hollow, Cero Creciente, Blood Chains), the final fight (shell break).

## 10. Test plan
TYBW probes: the string lands both blades; the 6th hurls through a wall; the descent craters; Chain throws, embeds and
returns cutting; the small Getsuga fires three then waits; the large Getsuga and the point-blank variant; Jūjishō
fuses and rejects a Cero in its path; Blut Vene halves damage and catches an arrow; Half-Hollow whitens the blade, the
horn takes ×3 and snaps back to Shikai; Gran Rey Cero costs HP; Cero Creciente; Blood Chains spawns clones, echoes hits,
the wall rejects, the bind roots, the Getsuga leaves the sky crescent; True Bankai's golden Getsuga; the Shell Break and
the disarm-to-shell rule. Screenshots: each form front / ¾ / back / face, the weapons, the eclipse, the crescent.

## 11. Engine needs
Existing: `GetsugaProjectile`, `CeroBeam`, `Plow`, `SkyTint`, `rejectNear`, parry hook, `weakAbove`, `disarmT`,
`armLockT`, `rooted`, the Gemelos-style copies (Zommari), the left-blade sampler (Kyōraku/Ukitake). New:
`[NEW: OffBlade]` a shared left-hand blade sampler (trail + sweep with its own hit set); `[NEW: era group]`
`RosterEntry.group/era` and the start-screen era chips; `[NEW: veiled]` a fighter flag (FK G) that `nearestEnemy`
respects beyond 8 m; `[NEW: ShellBreakWeapon]` in the TYBW kit; `[NEW: DelayedHit]` (echo hits) in the TYBW kit.

## 12. Open questions
(verify) Half-Hollow hole position; Blood Chains skin hex; True Bankai handle wrap; Ōken garb colours; which hand holds
the small blade (the left in most panels — chosen); adult Ichigo's weapon in No Breaths From Hell.
