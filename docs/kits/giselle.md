# Giselle Gewelle - kit spec            (source: docs/roster/H3-sternritter-2.md § Giselle Gewelle; tier A)

## 1. Identity
The helpless girl who wants you to cut her. Every drop of her blood that lands on someone is a string she pulls
later: she pleads, she giggles, she bites her thumb and flicks it at you — and once the blood has reached the heart she
says "Die!" and the body obeys. She barely fights herself; her dead do, the Bambies and the captains she has raised.

## 2. Loadouts
One card (the Blood War, Gigi as drawn: biologically male, presenting as a girl). Not built: the post-Auswählen state
without Vollständig, the novel epilogue.

## 3. Forms
| Form | Release | Power | Movement | Model | Timers |
|---|---|---|---|---|---|
| Sternritter "Z" — The Zombie | - | ×1, damage taken ×0.9 (the second-best Blut of the Bambies) | Hirenkyaku | 160 cm (77 vox), slim; very long straight black hair to the lower back with two thin strands standing up like antennae, a small white peaked cap pinned to the side of her head; big blue eyes and a goofy grin (a fang); the white long-sleeved coat to mid-thigh, the sleeves long and loose over the hands, the black belt, the blue heart case on her hip; black leggings, white boots | Infection on everyone else |
| Quincy: Vollständig — Azhalbiora (神の死) [anime name and look] | F: a purple pillar | ×1.3, damage taken ×0.85 | flight | large purple wings of bones off the shoulder blades, a skeletal reishi tail, a small purple skull-star halo (design choice) | 30 s, then 22 s |
| Sklaverei (anime-only) | G inside Azhalbiora | - | rooted while it drinks | bones rattle down out of the wings; skull constructs over the fists | + 8 s; the skull fists grow |

## 4. Inputs
| Key | Sternritter | Azhalbiora |
|---|---|---|
| Shift | Hirenkyaku | flight dash |
| LMB | the floppy string: a sleeve slap, a backhand, a flailing kick and a shoulder bump; while she is **bleeding** every hit flicks her blood on the target | the bones: a tail sweep, a wing slash, a tail sweep and a tail whip that throws |
| RMB | **Bait**: she drops her guard and pleads for 1.3 s; whoever cuts or hits her in that window is drenched (a big dose), she takes half and grows the rest back over 4 s, then straightens up grinning | **Munchy Munchy Babies** [anime-only]: skulls bloom over her fists and she charges; they bite (and infect) |
| Q | **Finger Bite**: she bites her thumb and flings a fan of blood (12 drops, 7 m); drops that land leave puddles that infect whoever stands in them; she bleeds for 6 s | **Dancing Dead Boys Club** [anime-only]: bones shaken out of the wings assemble into four cartoon skeletons that dance at the target; smashed, their bones fly back and pin its limbs |
| E | **Command**: "Die!" — every enemy fully infected turns its own weapon on itself (a fifth of its life; fodder dies); "Kneel!" — the half-infected drop to their knees; her zombies "Attack!" (frenzied) | same |
| R | **Raise**: the fully infected living become her puppets for 5 s (they strike themselves or turn on their own side; G struggles); else a fresh corpse rises as her zombie; else **Call Corpse**: a stored zombie climbs out of her shadow — Bambietta, Hitsugaya, Rangiku, Candice in turn (two out at once) | same, three out at once |
| G | **Drink** with one of her zombies at hand while she is hurt (the Bambietta scene: she heals, it whines); otherwise **Heilig Bogen**: the bone bow out of the heart case, three skull arrows that bite and infect | **Sklaverei** [anime-only] |
| F | Azhalbiora | **Dead March** [game-only name]: every stored zombie climbs out at once (four out in all) and everyone at half infection or more becomes her puppet for 6 s |
| V | the flare: her giggle; corpses twitch | same |

## 5. Completeness (inventory 40 → rows 40)
| # | Dossier item | Destination |
|---|---|---|
| 1 | Blood Infection: anyone splattered becomes her puppet | passive Infection meter on every enemy (the body reddens as it fills); E and R spend it |
| 2 | Dose scales with reiatsu: one drop for a weak soul, strong ones need it to pool in the heart and spread | doses × clamp(450 / max HP, 0.25, 1); ≤ 300 max HP: one drop is enough; above half it spreads by itself, below it ebbs |
| 3 | Does not work on living Quincy | passive: `data.quincy` targets take no infection ("Quincy blood… boring") |
| 4 | Bait (provokes a cut, the spray) | RMB |
| 5 | Bites her own finger for a quick dose | Q (Finger Bite) |
| 6 | Corpse Summon (dead Quincy at any time, powers remotely activated) | R (Call Corpse: zombie Bambietta / Candice keep their kits) |
| 7 | Parks zombies and calls them later | R: the stored zombies; fighters that die near her join the store |
| 8 | Zombie Army (a horde of Shinigami) | R on fresh corpses (Hollow waves: fallen Hollows rise for her) |
| 9 | Zombies crave her blood | Drink (G) whine callouts; idle zombies drift to her side |
| 10 | Zombified before death: no personality, flawless reflexes | zombie Hitsugaya: aggression 1, sharper AI |
| 11 | Zombified after death: personality (Bambietta) | zombie Bambietta callouts ("Gigi… give me blood…") |
| 12 | Zombies only stop when smashed to pieces | a zombie downed is gone for 30 s before she can call it again |
| 13 | Their blood is not infectious | zombies never infect |
| 14 | Flesh Graft (heals with flesh from the dead; reattaches limbs) | passive: her zombies within 6 m regenerate 2 % max HP/s |
| 15 | Undying (survived a stab through the heart) | passive: a lethal blow (once per 75 s) leaves her sprawled at 1 HP (invulnerable 1.6 s), then up with 15 % |
| 16 | Recovered by drinking zombie Bambietta's blood | Undying drinks from a zombie in 6 m (+25 %); G Drink |
| 17 | Heilig Bogen (linked-bone limbs, heart grip) | G (no zombie at hand) |
| 18 | Heilig Pfeil (skull heads) | G: the arrows' skulls bite (a small bore, a dose) |
| 19 | Azhalbiora (bone wings, skeletal tail, flight) | F |
| 20 | Dancing Dead Boys Club | Azhalbiora Q (optional, anime-only) |
| 21 | Munchy Munchy Babies | Azhalbiora RMB (optional, anime-only; effect proposed: biting skull fists that infect) |
| 22 | Sklaverei-Azhalbiora | Azhalbiora G (optional, anime-only) |
| 23 | Hirenkyaku | Shift |
| 24 | Shadow | R: the zombies climb out of her shadow |
| 25 | Blut (second best of the Bambies) | passive: damage taken ×0.9 |
| 26 | Durable (a building, Burner Finger 1) | passive toughness 4 |
| 27 | Zombie Bambietta | R (stored zombie 1) |
| 28 | Zombie Hitsugaya (Bankai, the ice wave) | R (stored zombie 2: the TYBW Hitsugaya kit) |
| 29 | Zombies Kensei, Rose, Rangiku | R (Rangiku stored; Kensei and Rose when the Visored are built) |
| 30 | Zombies Candice and Meninas (partial Vollständig, horns, red eyes) | R (Candice stored; Meninas when built) |
| 31 | Novel: Hollows hard to zombify | passive: Hollows take half a dose; a raised Hollow crumbles after 25 s |
| 32 | Control can be stolen (PePe, Mayuri) | not built ([NEW: ControlTheft]) |
| 33 | Weak in melee | LMB string: low damage, short reach |
| 34 | Panics when her life is truly at risk; dislikes Vollständig | AI: runs below 25 %; Azhalbiora only from 55 % |
| 35 | The bait (the 11th Division) | RMB → E ("Die!" on fodder) |
| 36 | Battle of the Zombies (zombie Hitsugaya) | R escalation |
| 37 | Regrowing Candice's arm | merged into Flesh Graft (#14) |
| 38 | Base look (antenna strands, side cap, long sleeves, leggings, heart case, grin) | skin |
| 39 | Bait state (the gaping wound, still smiling) | Bait's clip and blood burst |
| 40 | Callouts ("Za Zonbi", "Azarubiora", "Danshingu Deddo Boisu Kurabu!", "Manchi Manchi Bebīsu!") | callouts |

## 6. Timelines (60 Hz)
- String: slap 6 (8) · backhand 7 (8) · kick 9 (11) · bump 12 (14, knock 10); bleeding: a drop (0.04 dose) a hit.
- Bait: 0-6 the plea, 6-84 the window (damage ×0.5); a melee blow → the drench (1.0 dose to the striker, 0.4 to
  everyone else in 2.5 m, the HP healed back over 4 s) and 0.5 s of the grin; unanswered: 0.3 s.
- Finger Bite: 0-14 the bite · 16 the fling: 12 drops in a 50° cone, 9-14 m/s (4 + 0.07 dose each); puddles r 0.7 for
  10 s (0.2 dose/s); bleeding 6 s.
- Command: 12 the order. "Die!" (≥ 1): self-stab 20 % max HP (at least 60), 1.2 s stagger, infection back to 0.6;
  fodder (≤ 300 max HP) dies. "Kneel!" (≥ 0.5): kneels 1 s, −0.15. Zombies: frenzy 6 s (×1.3).
- Raise: 0-30 the hand down, the shadow spreads · 36: puppet 5 s (a self-blow every 1.2 s for 4 %; G −0.35 s a press;
  infection → 0.6), or a corpse up at 55 % HP, or a stored zombie at 50 %.
- Drink: 0-60 (heals 22 % of her max HP, the zombie loses as much). Bow: 14 the bow up · arrows 18 / 24 / 30 (16 +
  0.12 dose).
- Azhalbiora: release 40 (40 in r 6). Tail string 8 / 8 / 9 / 12 (14, 14, 16, 28 knock 16). Munchy Munchy Babies 16
  the skulls, 16-40 the charge (14 m/s), two bites 30 + 30 (0.25 dose each). Dancing Dead Boys Club 24: four skeletons
  (60 HP, 6.5 m/s, 12 a slap; smashed → bones pin the target: rooted 1.6 s), 8 s. Sklaverei 2 s. Dead March 50.

## 7. VFX / callouts
Blood: fresh `#B3122A`, dark `#8C0F1C`, drops as small voxel cubes with a glint; puddles as dark decals. Infection tints
the victim toward `#C66A5E`. Azhalbiora purple: bones `#9A5CF2`, highlights `#D9C2FF`, glow `#6A2BC7`; the skulls
purple-white. Her shadow gate: a black pool with a purple rim. Callouts: "Za Zonbi", "Die!", "Kneel!", "Rise!",
"Quincy: Vollständig — Azhalbiora", "Dancing Dead Boys Club", "Munchy Munchy Babies", "Sklaverei", "Dead March".

## 8. AI
Never opens with an attack: pleads (Bait) when the target closes and swings, flicks blood at 3-7 m, raises a zombie as
soon as it can (Bambietta first, then Hitsugaya), stays behind them, orders "Die!" the moment someone is full, drinks
from a zombie when hurt, bow at range. Azhalbiora from 55 %: skeletons, skull fists, Dead March when someone is half
infected or the store is full. Below 25 % she runs and lets the dead fight.

## 9. Test plan
Probe: infection doses and spread (strong vs weak, a Quincy immune); Bait drenches a melee attacker and halves the hit;
Finger Bite's drops and puddles; "Die!" (self-stab, fodder dies); "Kneel!"; Raise: puppet (self-blows, G struggle),
a stored zombie (kit + DuelistAI, her team, tinted), a corpse; Drink; the bow; Undying; zombies collapse when she
dies; Azhalbiora flight, tail string, Munchy Munchy Babies, Dancing Dead Boys Club (smashed → pin), Sklaverei, Dead
March. AI duels vs Ichigo and TYBW Hitsugaya. Screenshots: body (front, back, ¾, face), Azhalbiora, each technique.

## 10. Engine needs
New status `puppetT / puppetBy` on Fighter: the body taken over — its own controller lets go (the player can only
struggle with G, each press −0.35 s; the duel AI and Hollow AI stand down) and the puppeteer's kit moves it. New in
`vfx/zombie.ts`: `BloodDrops` (droplets with gravity that dose what they hit and leave `BloodPuddle`s), `SkullArrow`,
`ShadowGate` (the pool a zombie climbs out of), `BoneRain`, the infection tint. New reaction `puppet_stab`
(`chars/reactionClips.ts`). Zombies: `rosterById` + the entry's kit + a `DuelistAI` on her team, wrapped in a
`ZombieAI` that collapses them when she dies. Skeletons: small fighters with their own model and kit (the Lumina and
Verona pattern). Existing: `sklaverei()`, `LightPillar`, `vollFlight`, Hirenkyaku helpers, `weighed_kneel`, `iffT`.
Not built: [NEW: ControlTheft] (PePe's Love, Mayuri's drug hijacking her zombies).
