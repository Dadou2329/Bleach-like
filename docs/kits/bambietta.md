# Bambietta Basterbine - kit spec            (source: docs/roster/H2-sternritter-1.md § 3 Bambietta; tier A)

## 1. Identity
Everything her reishi touches becomes a bomb — a sadistic mid-range bomber who hates melee and turns the world itself
into ammunition: what her blade cuts, her orbs touch and her hands throw goes off a beat later.

## 2. Loadouts
One card (the Blood War). Not built: the Zombie (Giselle's) as a playable state, the stolen Bankai page.

## 3. Forms
| Form | Release | Power | Movement | Model | Timers |
|---|---|---|---|---|---|
| Sternritter "E" — The Explode | - | ×1 | Hirenkyaku; with a lock: behind the target, a bomb tag on its back | 156 cm, slender; long straight dark-purple hair to the hips; the white peaked cap (gold trim, black peak, the Zeichen); the white thigh-length coat over a miniskirt, black stockings, knee boots and gloves trimmed red, the red heart buckle; the reishi dao with a forked tip | - |
| Quincy: Vollständig — Zofiel | F: a red column of reiatsu ending in a Zeichen | ×1.45, damage taken ×0.85 | flight | great crimson wings (orbs budding under them), the star halo | 40 s, then 20 s |

## 4. Inputs
| Key | Sternritter | Zofiel |
|---|---|---|
| Shift | Hirenkyaku; with a lock (7 s): behind the target, a **bomb tag** slapped on its back (1.2 s fuse) | same |
| LMB | the dao: three quick cuts and a kick that sends an orb point-blank; every cut that lands **arms the target** (a small tag, 0.8 s fuse, stacking to 3) | **wing barrage**: five orbs sprayed from under the wings |
| RMB | **Tag Strike**: a heavy cut whose arc arms everything it passes — the target (a big tag) and the ground and walls along it (a row of charges going off 0.6 s later) | **carpet bombing**: she darts 14 m forward dropping a line of orbs |
| Q | **Bomb orbs**: three orbs flicked at the target; each sticks to what it touches and goes off after 0.5 s | **retreat fire**: she darts back 10 m hosing the pursuer with orbs |
| E | **Kick bomb**: a big orb kicked along the ground, bouncing twice; it goes off on a body or at the end — cutting it does not help | **armor trap**: the target itself becomes the bomb (2.5 s fuse, unblockable) |
| R | **Explosive globe** (the tantrum): a sphere of explosion out of her whole body (12 m) that flattens what stands round her — allies included | 16 m |
| G | **Arm & throw**: she rips a boulder out of the ground before her, arms it and throws it | **bomb shell**: a ring of blasts round her that breaks binds and throws attackers off |
| F | Zofiel | **Flatland** [game-only name]: she rises and a rain of orbs falls over a 22 m disc round the target |
| V | the pink flare | same |

## 5. Completeness (inventory 24 → rows 24)
| # | Dossier item | Destination |
|---|---|---|
| 1 | The Explode (whatever her reishi touches becomes a bomb) | every slot (tags, orbs, chunks) |
| 2 | Unblockable by cutting (a cut orb still blows) | E: the kicked orb ignores parries and blade-catches |
| 3 | Armor becomes the bomb | Zofiel E (armor trap, unblockable) |
| 4 | Explosions round her own body | Zofiel G (bomb shell) |
| 5 | Huge explosive globe (the tantrum) | R |
| 6 | Arm-and-throw (the Medallion, a tower wall) | G (a boulder of the ground) |
| 7 | Chain effects (Komamura's giant) | system (a tag on a summon hurts it; not mirrored) |
| 8 | Kicked bomb | E |
| 9 | Reishi sword (dao, forked tip) | LMB |
| 10 | Shadow | not built |
| 11 | Blut | not built (she is fourth of five) |
| 12 | Medallion (Komamura's Bankai) | story (not built) |
| 13 | Zofiel flight | F |
| 14 | Wing orbs by the dozen | Zofiel LMB |
| 15 | Blanket-bombing while flying | Zofiel RMB |
| 16 | Hundreds of orbs while fleeing | Zofiel Q |
| 17 | Durability (blew herself out of a building) | Zofiel G |
| 18 | Zombie state | story (not built) |
| 19 | Weakness: sufficient force knocks a bomb away | orbs and tags are knocked off by a heavy blow (a tag on her attacker is not) |
| 20 | Weakness: fuse freeze (Mayuri) | system (Mayuri's fields reject her orbs) |
| 21 | Weakness: nothing to detonate | n/a |
| 22 | Weakness: weak in melee | the dao string is light (10-14) |
| 23 | Weakness: temper (the globe hits allies) | R hurts allies |
| 24 | Survival instinct (flees what she can't hurt) | AI |

## 6. Timelines (60 Hz)
- Dao string: cuts at 8 / 8 / 9 (10, 10, 12; each arms the target: a 12 tag after 0.8 s) · kick 12 (an orb point-blank, 20).
- Tag Strike: 0-20 drawn back · 24 the cut (28; a 40 tag on whatever it cuts; charges every 0.8 m along the arc, 24 each in r 1.4, going off from 0.6 s, staggered 0.05 s).
- Bomb orbs: 10 · three orbs at 34 m/s (stick, 0.5 s, 20 in r 1.8 each).
- Kick bomb: 14 · the orb at 22 m/s, two bounces, 45 in r 3.
- Explosive globe: 0-30 the glow swells round her · 36 the globe (r 12, 70 at the centre falling off, explode power 900).
- Arm & throw: 14 the boulder out of the ground · 30 thrown (26 m/s, arcing) · on landing 60 in r 3.5.
- Zofiel: barrage 5 × 14 · carpet 10 × 22 · retreat 12 × 14 · armor trap 90 (2.5 s) · bomb shell 30 in r 4 · Flatland 40 orbs × 18 over 2.5 s.

## 7. VFX / callouts
Orbs: core `#FFF1F4`, glow `#FF4D6D`; armed surfaces pulse with `#FF4D6D` sparks; explosions white `#FFF4E0` → orange
`#FF8A2A` → crimson `#C0102C` → smoke `#2B2024`. Zofiel crimson `#B3122E`, wings `#D11A3A` edged `#FF6B7F`, halo `#FF4058`.
Callouts: "The Explode", "Quincy: Vollständig — Zofiel".

## 8. AI
Holds mid range (8-14 m) and backs off from melee; orbs and kick bombs at range, Tag Strike when close; the globe when
cornered (below 60 % HP with the target within 8 m); Zofiel below 55 %; flees (retreat fire) when the target shrugs off
her bombs.

## 9. Test plan
Probe: string tags pop, Tag Strike charges along the arc, orbs stick and pop, the kick bomb bounces and pops, the
globe's radius and the ally hit, arm & throw lands, Zofiel flight, barrage, carpet, retreat, armor trap, bomb shell,
Flatland. Screenshots: body (front, back, ¾, face), the dao, each technique, Zofiel.

## 10. Engine needs
`BombTag` (a fuse on a fighter or a point in the world, then an explosion), `BombOrb` (flies, sticks, fuse),
`KickedOrb` (bounces), `ArmedBoulder` (a prop thrown; a hole left in the ground); Zofiel flight like Uryū's.
