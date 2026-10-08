# Yumichika Ayasegawa - kit spec            (source: docs/roster/C1-lieutenants-1.md § Yumichika Ayasegawa; tier B)

## 1. Identity
Beauty with a secret. An elegant, vain duelist who fights in the open with a sulking false Shikai, and the moment
no one from the 11th Division can see, lets the real one out: peacock vines that drink the enemy dry and bloom.

## 2. Loadouts
One loadout, the 5th-Seat look (Soul Society → Fake Karakura): a jaw-length black bob with face-framing locks, yellow
and orange feathers on the right eyebrow and lashes, purple eyes, the orange piece round the neck and over the chest
joined to an orange undersleeve on the right arm under the shihakushō, the fuchsia sheath at the left hip. Later
skins: the Lost Agent / TYBW look (a braid down the right side, feathers on both sides, a sash and turtleneck), 10
years later (the white cape), Rukongai (long hair).

## 3. Forms
| Form | Release | Power | Movement | Model | Notes |
|---|---|---|---|---|---|
| Sealed | - | ×1 | graceful Shunpo | katana with a bronze cross-pattée guard, purple hilt | Kidō (anime) and Daichi Ten'yō |
| Fuji Kujaku | F: "Sake, Fuji Kujaku" (咲け 藤孔雀) | ×1.05 (it sulks) | Shunpo | four curved sickle blades fanned from a hinge on the hilt | wisteria glow |
| Ruri'iro Kujaku | F (from Fuji Kujaku): "Sakikurue, Ruri'iro Kujaku" (裂き狂え 瑠璃色孔雀) | ×1.2 | Shunpo | the blades flare into peacock vines (VFX) | **witness lock**: refused while any 11th-Division fighter (Ikkaku, Kenpachi) is within 40 m |

## 4. Inputs per form
| Key | Sealed | Fuji Kujaku | Ruri'iro Kujaku |
|---|---|---|---|
| Shift | Shunpo (a flutter of feathers) | Shunpo | Shunpo |
| LMB | fencing chain: the lunge, a slash, the rising flourish (launcher), the pirouette | four-sickle hooks and fan sweeps | vine lashes at mid range (5 m) |
| RMB | **Beautiful Swordfight**: a flurry of clashes that grinds guards | the **fan spin**: the four blades whirled round him | the **vine burst**: a fan of vines in a cone |
| Q | Hadō #57 **Daichi Ten'yō**: rubble lifted and hurled; the stones swat shots | Daichi Ten'yō | **Ensnare**: the vines wrap the target and drink (rei and HP), buds swell in its colour |
| E | Hadō #31 **Shakkahō** [anime] | the **blade catch**: the first blow is caught between the sickles (disarmed 2.5 s) and he riposts | **Bloom**: the buds open and turn the stolen reiatsu on the victim (damage by fill) |
| R | Bakudō #4 **Hainawa** [anime]: a rope of light (slowed, disarmed 1.6 s) | Beautiful Swordfight | **Petal**: he eats a petal: heals by what the buds hold |
| F | "Sake, Fuji Kujaku" | "Sakikurue" (witness lock) | seal: the vines wither into the hilt |
| G | **hair fix** (vanity): a breath to fix himself: a little HP, clears slow, blind, soak, age, inversion | hair fix | the **vine thicket**: vines over the ground round him snag whoever enters (rooted 0.6 s, drained) |
| V | green flare | flare | flare |

## 5. Completeness (inventory 30 → rows 30)
| # | Dossier item | Destination |
|---|---|---|
| 1 | Sealed form | form (default) |
| 2 | Fuji Kujaku "Sake" | F (sealed) |
| 3 | Ruri'iro Kujaku "Sakikurue" | F (Fuji Kujaku) |
| 4 | Swordsmanship | LMB string |
| 5 | Byūtifuru Chanbara | RMB (sealed), R (Fuji) |
| 6 | Shunpo | Shift |
| 7 | Hadō #57 Daichi Ten'yō | Q (sealed, Fuji) |
| 8 | Anime Kidō: Shakkahō | E (sealed) |
| 9 | Anime Kidō: Bakudō #4 Hainawa | R (sealed) |
| 10 | Keen nose (sensing) | passive: blindness wears off three times as fast (he smells them out) |
| 11 | Perceptive | AI: never parries explode-on-contact shots (dodges) |
| 12 | Durable | rule: hp 1000, keeps fighting |
| 13 | Four-sickle fan | Fuji LMB, RMB fan spin |
| 14 | Blade catch (inference) | E (Fuji) |
| 15 | Ensnare | Q (Ruri'iro) |
| 16 | Drain → buds | Q (Ruri'iro): the drain fills the buds |
| 17 | Bloom | E (Ruri'iro) |
| 18 | Petal heal | R (Ruri'iro) |
| 19 | Release & wither | F (Ruri'iro) |
| 20 | Anime counters (cut vines, blasts loosen, absorbers reverse) | rule: two blows from the wrapped target, or an energy blast, tear it free |
| 21 | Thicket / structures (game extrapolation) | G (Ruri'iro) |
| 22 | Anime spirit Ruri'iro Kujaku | optional (anime-only), not built |
| 23 | Vanity aura | the hair fix (G), callouts ("not beautiful") |
| 24 | Scent tracking | merged into #10 |
| 25 | Weakness: witness lock | F refused near the 11th Division |
| 26 | Weakness: false Shikai underpowered | Fuji ×1.05 |
| 27 | Weakness: outmuscled by brutes | rule: knockTaken 1.15 |
| 28 | Weakness: vines can be cut / blasted / hijacked | merged into #20 |
| 29 | Weakness: loses composure (face/hair hit) | rule: a heavy blow to him makes him sloppy for 4 s (the AI presses harder, his chain hits harder and he takes 10 % more) |
| 30 | Looks (5th Seat main, TYBW, 10 years, Rukongai) | skin (built: main) |

## 6. Timelines (60 Hz)
- *Beautiful Swordfight* (RMB sealed): 0-6 the step in; 6-54 eight quick cuts (each 9 damage, hitstop on the first and
  last), `cut` 260; the last one pushes them off.
- *Daichi Ten'yō* (Q): 0-14 the palm up, four chunks torn out of the ground round him; 14-30 they hover; 30+ hurled
  one after another at the target (30 m/s, 30 damage each, `smash`); shots that touch a hovering stone are undone.
- *Hainawa* (R sealed): 0-12 the palm; 12 a rope of light round the target within 12 m: slowed 50 %, disarmed 1.6 s.
- *Sake, Fuji Kujaku* (F): 0-14 the palm drawn along the blade (it glows); 14-24 the blade curves into a sickle and
  the hinge fans it into four; the callout.
- *Fan spin* (RMB Fuji): 0-60 the four blades whirled round him at arm's length (2 turns), `cut` 340, 18 damage per
  pass.
- *Blade catch* (E Fuji): 0-36 the fan held out; the first blow from the front is caught: the attacker is disarmed
  2.5 s and the riposte follows.
- *Sakikurue* (F Fuji): 0-20 the fan raised, the callout; 20 the blades split into a mass of vines.
- *Ensnare* (Q Ruri): 0-12 the vines lash out (12 m); 12+ wrapped: rooted, disarmed; drain 14 rei/s and 10 HP/s
  (their actions double it); the buds fill toward 1 over 6 s; it holds until bloomed, sealed or torn free.
- *Bloom* (E Ruri): the buds open: 40 + 300 × fill damage (unblockable), the vines let go and wither.
- *Petal* (R Ruri): heals 260 × fill (fill halves).
- *Vine thicket* (G Ruri): 6 s of vines on the ground in 5 m: enemies entering are rooted 0.6 s and drained.

## 7. VFX / SFX / callouts
Reiatsu green `#4CC46A` (core `#D5F7DE`); Fuji Kujaku's wisteria glow `#A59ACA`; Ruri'iro Kujaku lapis `#1E50A2`; the
vines peacock green `#2E8B57` / teal `#1FA79A` with gold eye-rings `#E8C14A` and cobalt eyes `#1E50A2`, turning blue
`#1E50A2` once they hold a victim; buds in the victim's reiatsu colour; flowers lapis/white `#3F6FD1` / `#EAF0FF`;
withered vines `#6B5B3E`. Callouts: 咲け「藤孔雀」 SAKE, FUJI KUJAKU · 裂き狂え「瑠璃色孔雀」 SAKIKURUE, RURI'IRO KUJAKU ·
破道の五十七「大地転踊」 DAICHI TEN'YŌ · 縛道の四「這縄」 HAINAWA · 破道の三十一「赤火砲」 SHAKKAHŌ ·
ビューティフルチャンバラ BEAUTIFUL SWORDFIGHT · 美しくない UTSUKUSHIKU NAI.

## 8. AI profile
Vain duelist: opens with the hair fix, fences in the open with Fuji Kujaku (releaseAt 0.75), throws Daichi Ten'yō at
range and Hainawa then Beautiful Swordfight up close. When no 11th-Division fighter is near and he is hurt (0.45) he
lets Ruri'iro Kujaku out and plays for ensnare → drain → bloom (blooms at fill ≥ 0.7 or when the victim is about to
tear free), eats a petal when hurt. Tells: the palm sliding along the blade (release), the fan raised (the true release).

## 9. Story hooks
The Seireitei chase vs Ganju (the singed hair → the wig) · the rooftop vs Hisagi (fanned blades, the true name, "don't
tell Ikkaku") · Fake Karakura vs Charlotte (the arm broken, the black-thorn dome where no one can see, the bloom, the
petal) · TYBW vs Giselle and zombie Bambietta (Daichi Ten'yō against the explosive spheres).

## 10. Test plan
Probes: every sealed and Fuji strike lands at 1.5-2.5 m; Beautiful Swordfight lands its eight cuts; Daichi Ten'yō's
stones hit and swat a shot; Hainawa slows and disarms; the blade catch disarms an attacker; the true release is
refused next to Ikkaku and allowed alone; ensnare roots and drains, the buds fill; bloom's damage scales with fill;
the petal heals; the thicket roots an enemy walking in; two blows from the wrapped target tear it free.
Screenshots: the model (front, ¾, back, face: the feathers at the right eye, the bob), the sealed sword, the fan, the
vines wrapped round a target with buds, the bloom.

## 11. Engine needs
Existing: `DebrisChunk` (vfx/wabisuke.ts) for Daichi Ten'yō's stones, `Shakkaho`, `SajoRope`-like rope, `rejectNear`,
`parry`, statuses `rooted`, `disarmT`, `slow`. New, kept in the kit: the drain-growth meter (buds); the witness lock (a
query over the fighters by id) — no engine change.

## 12. Open questions
(verify) the feathers' count and colours, the Fuji Kujaku blade length (estimate 80 cm), the flower colours.
