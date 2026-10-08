# Momo Hinamori - kit spec            (source: docs/roster/C2-lieutenants-2.md § 2 Momo Hinamori; tier B)

## 1. Identity
The Kidō trap-layer. Fragile up close, frightening once she has had time: hidden nets strung where you will walk,
fireballs off a forked blade, and one spark that sets the whole web off at once.

## 2. Loadouts
One loadout, the lieutenant look (Soul Society → Fake Karakura): petite, big round brown eyes, near-black hair in a
round bun at the back wrapped in an off-white cloth and tied, two long locks framing the face, the 5th Division
badge on the left arm, Tobiume at the left hip (it looks long on her). Later skins: the academy uniform (pigtails, red
hakama), the hospital kimono, 17 months later (a chin-length bob with a clip), 10 years later (no cloth).

## 3. Forms
| Form | Release | Power | Movement | Model | Notes |
|---|---|---|---|---|---|
| Sealed | - | ×1 | Shunpo (silent while hidden) | katana, light-red wrap, rectangular brass guard stamped with plum blossoms | the caster |
| Shikai Tobiume | F: "Hajike, Tobiume" (弾け 飛梅) | ×1.4 | Shunpo | the blade straightens, double-edged, three jutte prongs along it | fireballs |

## 4. Inputs per form
| Key | Sealed | Shikai Tobiume |
|---|---|---|
| Shift | Shunpo (no afterimage while Kyokkō hides her) | Shunpo |
| LMB | textbook string: the thrust, two cuts, the rising cut (launcher) | the same string; the last cut flicks a small fireball off the prongs |
| RMB | Hadō #31 **Shakkahō** from the palm | the **fireball** (Tobiume's, with its seagull cry) |
| Q | Hadō #12 **Fushibi**: a hidden net strung round the target's ground (or round her); touching it snares; **fire sets it off**: the strands blow up one after another | Fushibi |
| E | Bakudō #37 **Tsuriboshi** launch: the star net under her and a fireball beneath it: she is flung high, the blast hits round her | the **volley**: five fireballs fanned |
| R | Bakudō #26 **Kyokkō**: bent light: she fades from sight (enemies chase where she was); her next attack from hiding hits harder | **Ignite**: a fireball to every net she has laid |
| F | "Hajike, Tobiume" | seal |
| G | **Hakufuku**: purple blossoms in the face (3 m): the target's senses blur (blind) and it sleeps | **Kaidō** (channel heal) |
| V | red flare | flare |
| passive | Tsuriboshi catches her when she is knocked flying (12 s) | same |

## 5. Completeness (inventory 30 → rows 30)
| # | Dossier item | Destination |
|---|---|---|
| 1 | Sealed | form (default) |
| 2 | Shikai "Hajike, Tobiume" | F (sealed) |
| 3 | Bankai (not achieved) | — (none) |
| 4 | Kyokkō concealment state | R (sealed) |
| 5 | Full incantation vs incantation-less | rule: all her Kidō is instant (Kidō master) |
| 6 | Rage when her captain falls | AI quirk (rage when an ally Hitsugaya/Shinji falls: volleys, no guard) |
| 7 | Shunpo | Shift |
| 8 | Zanjutsu (lieutenant) | LMB string |
| 9 | Kidō mastery (fused, two targets) | rule: Fushibi lit by her fire; the volley splits across two targets |
| 10 | Presence masking / barrier breaking | merged into Kyokkō |
| 11 | Kaidō | G (Shikai) |
| 12 | Hadō #31 Shakkahō | RMB (sealed) |
| 13 | Hadō #12 Fushibi | Q |
| 14 | Bakudō #26 Kyokkō | R (sealed) |
| 15 | Bakudō #37 Tsuriboshi | E (sealed: the launch pad) + passive catch |
| 16 | Hakufuku | G (sealed) |
| 17 | Bakudō #9 Hōrin [anime] | optional, not built |
| 18 | Bakudō #39 Enkōsen [anime] | optional (Kira has it), not built |
| 19 | Tsuriboshi slingshot / launch pad [anime] | E (sealed) |
| 20 | Shakkahō ×3 [anime] | RMB repeats quickly (2.2 s cooldown) |
| 21 | Joint reiatsu seal [anime] | story only |
| 22 | Hainawa (Reigai) | enemy variant, later |
| 23 | Fireball | RMB (Shikai) |
| 24 | Multi-fireball | E (Shikai): the volley |
| 25 | Net ignition | R (Shikai) and any of her fire touching a net |
| 26 | Weak-point lob [anime] | merged into the fireball (it aims at the head) |
| 27 | Kidō expert passive | #5 |
| 28 | Weakness: fragile up close | rule: hp 950, knockTaken 1.2 |
| 29 | Weakness: emotional hooks | AI rage quirk (#6) |
| 30 | Weakness: Kidō strongest unseen | the hidden bonus (#14); nets are faint to whoever did not lay them |

## 6. Timelines (60 Hz)
- *Shakkahō* (RMB sealed): 0-8 the palm; 8 the orb (28 m/s, 36 damage, blast 1.2 m, `explode` 130).
- *Fushibi* (Q): 0-12 the fingers trace the web; 12 a net of 10 strands strung between 8 anchors on the ground and in
  the air round the target (≤ 18 m ahead) or round her: nearly invisible to enemies; it settles for 0.5 s (whoever it
  was strung round has a moment), then touching a strand snares (rooted 1 s, slowed 2.2 s); up to 2 nets; 20 s.
- *Ignition*: any of her fire bursting within 1.5 m of a strand, or R: the strands explode in a chain outward from
  the spark, 0.05 s apart: 80 damage (each fighter hit once per net), `explode` 220 along the strands.
- *Tsuriboshi launch* (E sealed): 0-6 the star net under her feet; 13 the fireball under it: she is flung up 19 m/s
  (about 6 m), the blast (40, 2.4 m) round where she stood.
- *Kyokkō* (R sealed): 0-11 the hands together; 11 she fades (a faint refraction where she moves), the enemies' lure
  stays where she was (the AI and the player's lock-on go for it); 6 s, until she acts (Fushibi stays quiet) or is
  hit; the first blow out of hiding ×1.6 (1.2 s, or until it lands).
- *Hakufuku* (G sealed): 0-12 the palm; 12 purple blossoms within 3 m in front: blind 2 s, then asleep 1.5 s.
- *Hajike, Tobiume* (F): 0-14 the blade raised, the callout; 14-22 it straightens, prongs spring out in sparks.
- *Fireball* (RMB Shikai): 0-10 the blade swung forward; 10 the fireball (26 m/s, 48 damage, blast 1.6 m, `explode`
  200), the seagull cry.
- *Volley* (E Shikai): five fireballs, 24 damage each. At a target they fan out round it and burst as they reach it
  (the blasts land all round it); two go for a second enemy when there is one; with nobody in sight, fanned 40° ahead.
- *Kaidō* (G Shikai): channel: 20 HP/s for 8 rei/s, a blow ends it.

## 7. VFX / SFX / callouts
Reiatsu red `#E53935`; Tobiume fire core `#FFF3B0`, body `#FFB33E`, rim `#FF5A1F`, smoke `#3A3434`; Shakkahō crimson
`#D3242C`; Fushibi threads hot orange `#FF8A50` (faint), Tsuriboshi blue `#4FA8FF` with ropes `#8CC8FF`, Hakufuku
purple `#9B6BD0`, Kaidō `#6BE08A`. Callouts: 弾け「飛梅」 HAJIKE, TOBIUME · 破道の三十一「赤火砲」 SHAKKAHŌ ·
破道の十二「伏火」 FUSHIBI · 縛道の二十六「曲光」 KYOKKŌ · 縛道の三十七「吊星」 TSURIBOSHI · 白伏 HAKUFUKU · 回道 KAIDŌ.

## 8. AI profile
Opens with Fushibi round the target and Kyokkō, then a fireball from hiding; releases Shikai early (releaseAt 0.9);
keeps mid range, Shunpo-retreats when rushed (ranged) and lays Fushibi round herself so the rusher walks into it;
ignites when the target stands in a net; Tsuriboshi launch to escape a rush; Hakufuku when caught close; Kaidō at range
when hurt; from Kyokkō she moves for a moment before the fireball.

## 9. Story hooks
The academy field trip (the Shakkahō at the giant Hollow) · the duel with Kira over Gin · Fake Karakura vs the Tres
Bestias (the hidden fireball, the Fushibi net round Rangiku, the detonation, Tsuriboshi) · TYBW vs Gerard (the launch
and the fireball into his mouth).

## 10. Test plan
Probes: the string lands at 1.5-2.4 m; Shakkahō and the fireball hit at 10 m; a net snares a target walking in and
its ignition hits everyone in it once; R ignites from range; the Tsuriboshi launch lifts her and blasts round her
start; Kyokkō hides her (the AI attacks the lure) and the next hit is stronger; Hakufuku blinds then sleeps; the
volley spreads; Kaidō heals. Screenshots: the model (front, ¾, back, face: the bun cloth, the locks, the big eyes), the
Shikai blade, a net before and during ignition, the launch, the volley.

## 11. Engine needs
Existing: `Shakkaho` (given a palette option and an `onBurst` hook for the ignition), `lure`, `blindT`, hitstun,
`rooted`. New, kept in the kit: the Fushibi net (strands, snare, chain ignition) and Kyokkō's fade (the visual's
opacity and the lure).

## 12. Open questions
(verify) the bun cloth's colour, the sheath's colour, the prong placement on the Shikai blade.
