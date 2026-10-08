# Yammy Llargo - kit spec            (source: docs/roster/E2-espada-2.md § 6, 6a; tier A (boss) / B playable; wave W2)

## 1. Identity
A bored, lazy giant who keeps getting bigger. Every blow that lands makes him angrier and every rise in anger makes
him larger: sealed he is a wall of muscle that swats people through buildings; released he is a kaiju that walks
through the city, and if he is pushed far enough he erupts into something even bigger.

## 2. Loadouts
One loadout (Hueco Mundo / the desert): the Espada jacket worn open over a bare chest, the hole in its centre, "10" on
his left shoulder, the bone lower jaw (eight teeth) on his chin, a bald scalp lined with bony ridges, black sideburns
and a thin ponytail, orange eyebrows, red estigma under the eyes. Ira never drawn (red grip, a rounded-rectangle guard
with two prongs a side) at his left hip. Kukkapūro, his puppy, trots after him (cameo).

## 3. Forms
| Form | Release | Power | Movement | Model | Notes |
|---|---|---|---|---|---|
| Sealed (Diez) | - | ×1 | heavy Sonído | 2.3 m, 43.5 vox/m | Hierro: blows under 18 barely scratch (second hardest after Nnoitra's 24-28) |
| Ira, the kaiju | F: "Buchikirero, Ira!" (ブチ切れろ「憤獣」): the sword bursts, the "1" melts off the tattoo | ×1.15 on top of the giant move numbers (×1.5 at a full meter), full heal | a thundering four-legged trot; walls in his way are trampled | an 11 m centaur at 8 vox/m: the human torso grown colossal on a white quadruped trunk with elephant legs, white carapace joints, a bony tail club, piston tubes on the elbows, black tubes on the back, black nodules on the forearms, bone plates sweeping back over the head, the flame estigma | rage meter: grows ×1.0 → ×1.45 |
| Ira, rage evolution | F at a full rage meter (or automatic when it overflows) | ×1.35 (×1.75 at a full meter), full heal | knuckle-walking ape, fast for his size | a 15 m ape: a portly belly, hairy legs, a crown of horns, two huge horns on the back, a hairy tail | keeps growing (to ×1.3) |

## 4. Inputs per form
| Key | Sealed | Ira (both) |
|---|---|---|
| Shift | heavy Sonído (a cracked landing) | trample charge (ape: gorilla charge) |
| LMB | haymaker, backhand, hammer fist, shoulder check — every blow cracks the ground | giant slaps and punches, each followed by the elbow piston's second impact; the tail club sweeps to finish (ape: alternating knuckle slams, a belly flop) |
| RMB | **Bala**: red bullets from the fists, a rapid string | **giant Bala** |
| Q | **Cero** from the mouth: it opens a fissure in the ground | **giant Cero**, swept across what is in front of him |
| E | **Gonzui**: one huge breath that pulls in whoever is near, sucks the souls out of weak Hollows, refills his reiatsu | **stomp quake** |
| R | **limb rip**: a grab; he tears at the arm (big damage, their weapon arm useless for a while) | **Cero Oscuras**: black, a long charge in front of his mouth — a strong shot into it while it charges blows it up in his face |
| F | "Buchikirero, Ira!" | **rage evolution** (meter full) |
| G | **Hierro brace**: super armour for a few seconds | **reiatsu shield → burst**: wrapped in reiatsu, then the shell blown outward |
| V | red flare | orange-red flare that cracks the ground for blocks |
| passive | Hierro; sleeping and eating: out of combat (nobody hurt him for 10 s, standing still) he dozes and banks reiatsu and rage | rage: damage taken fills the meter and the meter sets his size; poor Pesquisa (lock-on-free aiming: his skills fly where he faces) |

## 5. Completeness (inventory 30 → rows 30)
| # | Dossier item | Destination |
|---|---|---|
| 1 | Sealed (Diez) | form (default) |
| 2 | Well-fed sealed (bigger) | passive: sleeping and eating grows the sealed body a little (×1.1 at most) |
| 3 | Resurrección: Ira | F (sealed) |
| 4 | Rage growth | passive rage meter (Ira) |
| 5 | Rage evolution (ape) | F (Ira, meter full) / automatic overflow |
| 6 | Brawling / immense strength | LMB (sealed) |
| 7 | Cero (mouth, fissure) | Q (sealed) |
| 8 | Bala (fists, rapid) | RMB (sealed) |
| 9 | Hierro | passive (toughness 18; Ira 26, the ape 30) |
| 10 | Gonzui | E (sealed) |
| 11 | Descorrer | story (stage arrival) |
| 12 | Stored power from sleep and food | passive |
| 13 | Reiatsu shield & burst | G (Ira) |
| 14 | Enhanced Cero | Q (Ira) |
| 15 | Cero Oscuras | R (Ira) |
| 16 | Cero Oscuras backfire | rule: an energy hit of ≥ 60 on him during the charge detonates it on him |
| 17 | Enhanced Bala | RMB (Ira) |
| 18 | Enhanced Hierro & endurance | passive (Ira) |
| 19 | Enhanced strength (bites buildings, stomps, swats) | LMB (Ira), E (Ira), trample |
| 20 | Elbow pistons | LMB (Ira): a second impact |
| 21 | High-Speed Regeneration on evolution | F (Ira): full heal |
| 22 | Weakness: poor Pesquisa | rule: his skills ignore lock-on assist (they fly where he faces) |
| 23 | Weakness: reckless | AI quirk: walks straight in, never guards |
| 24 | Weakness: huge target | rule: radius and height grow with him |
| 25 | Weakness: attacks annoying allies | AI quirk (team modes: an ally that hits him by accident is swatted) |
| 26 | Limb rip (Chad's arm) | R (sealed) |
| 27 | Grabs, crushes, throws | merged into R (sealed) and the Ira string's last hit |
| 28 | Kukkapūro | cameo companion (not built yet) |
| 29 | "Suerte!", insults | callouts |
| 30 | Brave Souls "Beyond" [game-only] | optional, not built |

## 6. Timelines (60 Hz)
- *String* (sealed LMB): haymaker 0-9 wind, 9-14 active (34), backhand 6-12 (30), hammer fist 9-15 (36, a crack in
  the ground), shoulder check 8-16 (40, knocked flying).
- *Bala* (RMB sealed): a string of 6 red bullets, 0.08 s apart, 14 damage each, alternating fists.
- *Cero* (Q sealed): 0-24 the charge in front of his mouth; 24 the beam (6 m wide burst, 110 damage, 40 m, it opens a
  fissure along the ground: `explode` 260).
- *Gonzui* (E sealed): 0-20 the breath drawn in: everyone within 14 m in front is pulled toward him; weak Hollows
  (`hollow` fighters) die and their souls stream into his mouth; +40 reiatsu, +10 rage.
- *Limb rip* (R sealed): a lunge and grab (2 m): held 0.8 s, then the tear: 120 damage, disarmed 6 s (bosses: 60, 1.5 s).
- *Release* (F): 0-30 "Buchikirero", the reiatsu column; 30-60 the body swells into the kaiju (a scale ramp), the
  ground cracks round him; full heal.
- *Ira string*: punch 0-14 wind, 14-20 the fist (90, 3 m sphere), 26 the piston (60, a ring); the tail sweep (110,
  a 7 m arc behind and beside him).
- *Giant Bala*: 4 bullets the size of cars, 70 each, 1.6 m blasts.
- *Giant Cero*: 0-40 charge; 40-100 the beam swept 50° across (180 damage over its length, 14 m blast trail).
- *Cero Oscuras*: 0-90 the black orb grows in front of his mouth; 90 the beam (420, `explode` 900); an energy hit ≥ 60
  to him between 0 and 90 detonates it on him (180 to himself, stunned 1.5 s).
- *Stomp quake*: a 12 m ring: 60 damage, knocked down, `groundwave` power 400.
- *Shield → burst*: G held: damage ×0.2 for up to 3 s; released (or at 3 s): the shell bursts outward, 14 m, 120.
- *Rage*: +1 per 8 damage taken, +10 per Gonzui, +0.5/s asleep; size ×(1 + 0.45·rage/100) (the ape ×(1 + 0.3·rage/100)),
  strength ×(1 + 0.3·rage/100); at 100 the evolution is ready (F), at 130 it happens on its own.
- *Evolution*: 0-40 an explosion of reiatsu (20 m, 150), the body morphs into the ape, full heal; the meter resets.

## 7. VFX / SFX / callouts
Released reiatsu orange-red `#FF5A1E` (core `#FFB070`); Cero red `#E01A28` (core `#FFD0C8`); Cero Oscuras black
`#0B0B0E` with a crimson rim `#9E0F1C`; Bala red `#E43A2E`; Gonzui pale soul wisps `#DDE8F2`. Callouts:
ブチ切れろ「憤獣」 BUCHIKIRERO, IRA! · 虚閃 CERO · 黒虚閃 CERO OSCURAS · 虚弾 BALA · 魂吸 GONZUI · ¡SUERTE!

## 8. AI profile
Walks straight at the target, never guards; Bala at mid range, Cero at range, Gonzui when several are near or a weak
Hollow is around; the limb rip when he gets hold of someone. Releases at 55 %; then tramples in, Ceros sweep the
street, Cero Oscuras when the target is far; the shield when he is being shot; evolves as soon as the meter is full.

## 9. Story hooks
The Karakura landing (Gonzui on the crowd, Chad's arm); Urahara and the portable Gigai decoy; the fall through Las
Noches ("mala suerte"); "I'm the Cero Espada" in the desert; Kenpachi and Byakuya; the rage evolution.

## 10. Test plan
Probes: the string lands at 1.5-3 m; Bala and Cero hit at 12 m; Gonzui pulls and refills; the limb rip disarms; the
release heals and scales him; Ira's punches and piston hit, the tail sweeps behind; the trample breaks walls; the
giant Cero sweeps; Cero Oscuras fires, and a strong shot during its charge blows it up on him; the shield takes
little and bursts; rage grows him and the evolution heals. Screenshots: all three models (front, ¾, back, face), the
release, the trample through a building, Cero Oscuras, the evolution.

## 11. Engine needs
Existing: the quad stance and leg IK (the centaur rig, also used for the ape: its arms are the front legs),
`CeroBeam`, Bala-like orbs (`Shakkaho` with a red palette), destruction carve (trample), `setForm`. New, kept in the
kit: the giant body (def height/radius and the visual scale follow the rage meter, the camera pulls back for a player
giant), the trample (capsules carved round his legs as he moves), the Cero Oscuras backfire.

## 12. Open questions
(verify) Ira's leg count (built with four), the evolved crack marks' colour, the sword guard's metal.
