# Izuru Kira - kit spec            (source: docs/roster/C1-lieutenants-1.md § Izuru Kira; tier B)

## 1. Identity
The wretched one. Gloom and patience: he keeps you at Kidō range until you come close enough, and then every
cut doubles what it touches, your sword, your legs, your whole body, until you kneel with your head bowed, and he
apologises as he takes it.

## 2. Loadouts
One loadout, the main look (Soul Society → Fake Karakura): shoulder-length pale-blond hair combed into three points
(two at the back, one long bang hiding the left eye), a gloomy face with shadows under the eyes, the standard
shihakushō, the 3rd Division lieutenant's badge tied on the left upper arm, Wabisuke at the left hip. Later skins:
academy (shorter, shaggier hair, blue uniform), 17 months later (shorter hair), TYBW "dead man" (the rod-braced
hole through the right side of the chest, the bare prosthetic-looking right arm), 12 years later (white hood with
black dots).

## 3. Forms
| Form | Release | Power | Movement | Model | Notes |
|---|---|---|---|---|---|
| Sealed | - | ×1 | Shunpo; appears behind | plain katana with a rectangular guard (Ω motif), black sheath at the left hip | Kidō-heavy |
| Shikai Wabisuke | F: "Omote o agero, Wabisuke" (面を上げろ 侘助) | ×1.3 (the power is the weight) | Shunpo | the blade goes straight and its end turns 90° twice: a square hook, edge on the inside | every cut doubles what it cuts; F reseals and all of it vanishes (canon) |
| TYBW "dead man" | - | - | - | skin, later | - |

## 4. Inputs per form
| Key | Sealed | Shikai Wabisuke |
|---|---|---|
| Shift | Shunpo | Shunpo |
| LMB | thrust (lunge), short cut, rising cut (launcher), flat horizontal cut; air: plunging stab | hook thrust, backhand cut, rising hook (a heavy target barely leaves the ground), the downward chop; **every cut doubles** |
| RMB | ground: Bakudō #39 **Enkōsen** (a spinning disc shield in front); air: Hadō #31 **Shakkahō** (fireball, smoke) | **hook pull**: the square hook catches the neck and drags them down in front of him (+1 doubling) |
| Q | Hadō #58 **Tenran** (the sword spun like a fan, then a widening tornado) | a kneeling target in reach: **"Omote o agero"**, the reverse guillotine (pinned at ×256: **Penance**, ten strikes then the guillotine); otherwise the **weighted parry** (a blow is turned and the attacker's weapon doubles twice) |
| E | Bakudō #63 **Sajō Sabaku**; a bound or stunned target within 2.5 m: **Gaten** (the knockout drop) | **Heavy Step**: his own foot doubled seven times (×128): a crater stomp; in the air a meteor drop |
| R | Bakudō #73 **Tōzanshō**: a target ahead is caged in the inverted pyramid; with none, it closes round him (no damage gets in) | **Debris Rain** [novel]: Tenran tears rubble out of the ground, he strikes each chunk (×16) and they fall on the target |
| F | "Omote o agero, Wabisuke" | seal (all the weight vanishes) |
| G | **Kaidō** (channel: heals, rooted, a hit stops it) | Kaidō |
| V | flare (pale blue) | flare |
| passive | Bakudō #37 **Tsuriboshi**: when he is knocked flying, a net of light catches him (12 s) | Tsuriboshi; **heavy deflection** [novel]: shots touching his swinging blade turn heavy and drop short |

### Weight (Wabisuke's doublings)
- A Shikai cut that lands doubles the **body** (2^n); if the target was swinging, or it parried the cut, it doubles
  the **weapon** instead (2^m). Skin that shrugs the blow off gains nothing (it must actually cut); a weapon that is
  not a blade (ash, petals, fists) cannot be weighted, so the cut goes to the body.
- Body ×2^n: feet 11 % slower per doubling (at least 25 % left), Shunpo shorter, launches and knockback shrink,
  it falls faster; from ×8 no jumps or air-steps; at **×64 it kneels** (2.4 s, bosses 0.8 s; head bowed, rooted, no
  attacks) and every new doubling sets it down again; at **×256 it is pinned** and the ground under it gives way.
- Weapon ×2^m: its actions run at 1 / (1 + 0.16 m) (×16: 61 %); at ×128 the weapon falls from the hand (disarmed
  3 s) and comes back at ×16.
- The weight holds while Wabisuke is released; after 6 s without a new cut it sheds one doubling every 5 s (game).
  F (reseal), his death or a change of form on the victim (a new weapon: the weapon's doublings) clears it.
- Tags: each doubling floats its multiplier (×2, ×4 … ×1024) over the target in pale blue deepening to indigo;
  weight rings slide down the weighted part.

## 5. Completeness (inventory 33 → rows 33)
| # | Dossier item | Destination |
|---|---|---|
| 1 | Sealed form | form (default) |
| 2 | Shikai Wabisuke "Omote o agero" | F (sealed) |
| 3 | TYBW "dead man" (Mayuri's reconstruction) | skin + boss variant, later |
| 4 | Swordsmanship (cold, lets it get close) | LMB strings |
| 5 | Shunpo (behind Abirama unseen) | Shift; the AI's appear-behind |
| 6 | Hadō #58 Tenran | Q (sealed); the lift in R (Shikai) |
| 7 | Bakudō #39 Enkōsen | RMB (sealed, ground) |
| 8 | Bakudō #73 Tōzanshō | R (sealed): cage ahead or round himself |
| 9 | Bakudō #63 Sajō Sabaku [anime] | E (sealed) |
| 10 | Bakudō #37 Tsuriboshi [anime] | passive (the net that catches him) |
| 11 | Hadō #31 Shakkahō (+ smoke screen [novel]) | RMB (sealed, air) |
| 12 | Kaidō + field medicine | G (both forms) |
| 13 | Gaten | E (sealed) on a bound or stunned target |
| 14 | Tactician (plays built round the rule) | AI profile (bait, weapon on guard, legs on dodge) |
| 15 | Weight doubling | passive of every Shikai cut (see Weight) |
| 16 | Penitent kneel | at ×64 |
| 17 | Reverse guillotine | Q (Shikai) on a kneeling target |
| 18 | Self-weighting (the ×128 foot) | E (Shikai): Heavy Step |
| 19 | Heavy deflection [novel] | passive (Shikai swings) |
| 20 | Debris rain [novel] | R (Shikai) |
| 21 | Sink [novel] | at ×256: pinned, the ground gives way |
| 22 | Anime spirit Wabisuke (iron ball on a chain) | optional (anime-only), not built |
| 23 | Despair aura (flavour) | callouts and the AI's apologies |
| 24 | Expert Kidō without incantation | every Kidō is instant (no chant meter) |
| 25 | Healer | G |
| 26 | Weakness: melee range only | rule: the weight comes only from his own cuts and the hook |
| 27 | Weakness: needs a real cut | rule: shrugged blows add nothing |
| 28 | Weakness: effects vanish on reseal | rule: F clears all the weight |
| 29 | Weakness: blades that stop being blades | rule: a form change clears the weapon's doublings; non-blade weapons cannot be weighted |
| 30 | Weakness: frail body | rule: knockTaken 1.1, hp 950 |
| 31 | Weakness: gloomy, indecisive (flavour) | the AI keeps its distance at first |
| 32 | TYBW: half the torso missing | variant, later |
| 33 | Main look (+ academy, 17 months, TYBW, 12 years later) | skin (built: main), others later |

## 6. Timelines (60 Hz)
- *Omote o agero* (F): 0-14 the blade raised upright before his face, the left hand drawn along the flat; 14 the
  callout; 16-24 the blade straightens and its end folds twice into the square hook (a pale blue flash); 24-40 he
  lowers it, the hook toward them.
- *LMB (Shikai)*: hook thrust (8 wind, 8-14 active), backhand cut, rising hook (launch 7 ÷ (1 + n/2)), the downward
  chop (heavy). Each cut: one doubling; the chain carves `cut` 320.
- *Hook pull* (RMB): 0-10 the reach; 10 the hook catches within 2.6 m in a 70° cone; 10-24 drags them 1.6 m toward
  him and down (stumble 0.5 s), one doubling.
- *Reverse guillotine* (Q on a kneeling target within 6 m): 0-6 Shunpo to them; 6-18 the hook set under the chin;
  18 the lift: 160 + 20 % of their max HP, unblockable, hitstop 0.2 (bosses 100 + 8 %); 18-40 he lowers the blade
  ("don't forgive me").
- *Penance* (Q on a pinned target, ×256 and more): 0-60 ten strikes (each a doubling and 12 damage), the ground
  sinking under them; 60-78 the guillotine: 240 + 30 %.
- *Weighted parry* (Q, nobody kneeling): 0-36 the stance (the hook out): the first blow is turned, the attacker's
  weapon doubles twice and the counter cut follows.
- *Heavy Step* (E): ground: 0-18 the foot lifted, the fist clenched (tell), the weight rings climbing ×2 → ×128 on
  the foot; 18 the stomp: crater 2.2 m (`smash` 900), a 3.5 m shockwave (60, knockdown) that doubles everyone in it;
  air: he drops at 40 m/s; landing crater 2.8 m (`smash` 1200), 4 m shockwave (90); a fighter right under him takes
  140 and two doublings.
- *Debris Rain* (R): 0-22 the blade spun like a fan, a whirlwind tears six chunks of ground out between him and the
  target (six small craters); 22-52 he strikes each (rings ×2 … ×16); 52-70 they fall on the target 0.08 s apart: 35
  each, one doubling a hit, `smash` craters 0.8 m.
- *Enkōsen* (RMB sealed, ground): 0-5 the palm out; 5-65 a spinning yellow disc (1.5 m) in front: it turns frontal
  blows (two of them, or one heavy, shatter it) and stops shots from the front.
- *Shakkahō* (RMB sealed, air): 0-10 the palm; 10 the fireball (30 m/s): 40 damage, `explode` 260, r 1.3 m, a puff of
  smoke that blinds within 2 m for 0.6 s.
- *Tenran* (Q sealed): 0-24 the sword spun like a fan before him (tell); 24 the tornado leaves (9 m/s, 16 m, radius
  0.6 → 2.2 m): it pushes (knock 10), lifts (launch 5), 6 damage per 0.15 s, and tears up the surface it crosses.
- *Sajō Sabaku* (E sealed): 0-19 the palm; 19 the rope binds the upper body within 12 m (no attacks 2.5 s, bosses
  1 s). *Gaten*: 0-10 he steps in; 10 a drop on the neck: asleep 3.5 s (bosses 1 s; maxRei ≥ 200: 1.5 s).
- *Tōzanshō* (R sealed): 0-12 the hands form the triangle; 12 an inverted pyramid of light (2.6 m) closes round the
  target within 12 m ahead: rooted, its blows and shots stay inside, 3 s (bosses 1.2 s); with no target it closes
  round him: no damage gets in for 2.5 s, he is rooted, Kaidō heals twice as fast inside.
- *Kaidō* (G): toggled on: 22 HP/s for 8 rei/s, rooted, the green glow over the wound; a blow ends it.
- *Tsuriboshi* (passive): a hit with knock ≥ 10 or launch ≥ 7: the net catches him (push gone, hitstun ≤ 0.15), 12 s.

## 7. VFX / SFX / callouts
Reiatsu pale blue `#4F8FE0` (core `#DCEBFF`); Shikai steel `#C9CED4`, inner edge `#EEF1F4`; weight tags and rings
`#9FC2FF` → indigo `#3B3F9E`; Tenran wind `#D9F2FF`; Tōzanshō faces `#3F86FF`, edges `#BFE0FF`; Enkōsen disc
`#C9B14A`; Sajō Sabaku rope `#F2D04A`; Tsuriboshi net `#5AA8FF`; Kaidō `#6BE08A`; Shakkahō `#E3262E`; Gaten
`#5ED16A`. Callouts: 面を上げろ「侘助」 OMOTE O AGERO, WABISUKE · 破道の五十八「闐嵐」 TENRAN · 縛道の三十九「円閘扇」
ENKŌSEN · 縛道の七十三「倒山晶」 TŌZANSHŌ · 縛道の六十三「鎖条鎖縛」 SAJŌ SABAKU · 縛道の三十七「吊星」 TSURIBOSHI ·
破道の三十一「赤火砲」 SHAKKAHŌ · 回道 KAIDŌ · 穿点 GATEN.

## 8. AI profile
Methodical, defensive, never flashy. Sealed at range: Tenran, Shakkahō from a hop, Sajō Sabaku then Gaten,
Tōzanshō to cage a rushing target; releases once he has the measure of them (releaseAt 0.8). In Shikai he closes
in: the weighted parry against sword strings, the hook pull when they back off, Heavy Step on a target in the air or
crowding him, Debris Rain at 5-12 m, the guillotine on anyone kneeling (top priority). Below 35 %: Tōzanshō round
himself and Kaidō when sealed, Kaidō at range in Shikai. Tells: the palm raised (Sajō Sabaku), the sword spun like
a fan (Tenran, Debris Rain), the fist clenched (Heavy Step), the hook lowered to the neck (the guillotine).

## 9. Story hooks
The academy field trip (Shakkahō volley with Renji and Momo) · Kira vs Momo on the rooftops (Hitsugaya stops both)
· vs Rangiku at Central 46 (seven parries: her sword through the roof tile, then "Unare, Haineko": weightless ash)
· Fake Karakura vs Abirama Redder (Enkōsen shattered, Tenran swatted, four cuts to the wings, the marigold speech,
the guillotine) · field medic (Gaten on Yumichika) · TYBW vs Lille Barro's clones ("I'm a dead man") · Jigoku: the
×128 foot on a Jigoku no Gaki.

## 10. Test plan
Probes: every sealed strike lands at 1.2-2.4 m; Shikai cuts add a body doubling, a weapon doubling on a swinging or
parrying target, none on a shrugged blow; ×8 stops jumping; ×64 kneels and the guillotine lands only then; ×256
pins and sinks; ×128 on the weapon disarms; F clears all of it; the weight decays after 6 s; Heavy Step cratering
and doubling; Debris Rain chunks land and double; Tenran pushes and lifts; Enkōsen turns a blow and stops a shot;
Shakkahō in the air; Sajō Sabaku binds and Gaten sleeps; Tōzanshō cages a target / shields himself; Kaidō heals;
Tsuriboshi catches a big knock. Screenshots: the model (front, ¾, back, face: the bang over the left eye, the
shadows), the sealed katana and the square hook, the kneel on several rigs, each move in play.

## 11. Engine needs
Existing: `SajoRope` (vfx/kazeshini.ts), `g.rejectNear`, `parry`, statuses `rooted`, `disarmT`, `blindT`, hitstun.
New: **[NEW: MassMultiplier]** Fighter `heavyB` / `heavyW` (body / weapon doublings): slower feet and actions,
no jumps from ×8, launches and knockback shrink, heavier fall; the kit adds, decays and clears them, and drives the
kneel and the pin. `Fighter.lastHurt` (when, how much, shrugged) so a cut that did not cut adds nothing. A shared
**kneel** clip any humanoid rig can play (registered on demand).

## 12. Open questions
(verify) the sealed hilt wrap and sheath colours, the Ω guard motif's colour, the exact hook size (estimate 15 cm),
whether Wabisuke's weight clears on a seal mid-fight in the anime as in the manga (assumed yes).
