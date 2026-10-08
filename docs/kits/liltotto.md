# Liltotto Lamperd - kit spec            (source: docs/roster/H3-sternritter-2.md § Liltotto Lamperd; tier A)

## 1. Identity
Deadpan and always hungry: the smallest Bambie eats the map. Her mouth pushes out into a maw of jagged teeth bigger
than she is and whatever it closes on is simply gone — walls, floors, shots, people — and behind the bored face she
has the best fists and the best Blut of the five.

## 2. Loadouts
One card (the Blood War). Not built: the post-war (novel) state without Vollständig, the Zombie-era team scenes.

## 3. Forms
| Form | Release | Power | Movement | Model | Timers |
|---|---|---|---|---|---|
| Sternritter "G" — The Glutton | - | ×1 | Hirenkyaku | 149 cm, petite (head ≈ 1/5.5); a chin-length straight blonde bob with bangs under the white peaked cap; half-lidded gold eyes; the white uniform with a skirt instead of the long coat, gloves, dark patterned leggings, short white boots; the gold heart case at the back of her belt; a lollipop in her cheek | Hunger 0-100 |
| Quincy: Vollständig — Gagael (神の飢え) | F: a golden pillar | ×1.45, damage taken ×0.85 | flight | golden wings of fangs, the star halo, the fang cuffs and anklets | 36 s, then 20 s |
| Sklaverei (anime-only) | G in Gagael | - | rooted while it drinks | a second pair of wings shaped like jaws | + time; the jaw wings snap at whoever comes close |

## 4. Inputs
| Key | Sternritter | Gagael |
|---|---|---|
| Shift | Hirenkyaku | flight dash |
| LMB | the cleanest string of the Bambies: palm, knee, a low sweep and a lunging chomp (a small maw that takes a bite out of whatever it reaches) | the same, the chomp bigger |
| RMB | **Arterie haymaker**: Blut Arterie's red veins down the arm, a punch that craters what it hits | **Glutton (Vollständig)**: a maw big enough to take a floor out of a building |
| Q | **Glutton Bite**: the maw lunges 4 m forward and erases every voxel in a jaw-shaped volume; a body caught is bitten hard and held for a beat; a Hollow is eaten whole (she heals) | **Spork** [anime-only]: a fang cuff fired that unfolds into a bear trap in flight, snapping on what it meets |
| E | **Swallow**: the maw held open before her — shots and beams that reach it are eaten (each one feeds her) | **Spife** [anime-only]: a cuff unrolled into a bladed whip, slammed down |
| R | **Heilig Bogen**: the bear-trap bow out of the heart case; three toothed arrows that bite a ball out of whatever they hit | **Golden Crunch** [anime-only]: a wave of reishi along the ground to the target, where a giant bear trap rises and snaps shut — on whoever stands in it, friend or foe |
| G | **Feast**: the maw kept open as she walks, eating a tunnel through whatever is in her way (toggle) | **Sklaverei** [anime-only] |
| F | Gagael | **Full Course**: a house-sized maw erupts round the target and bites a sphere out of the world; a target that weak is swallowed whole (the PePe scene) |
| V | the flare (a growl: dust and debris drift into her mouth) | same |

## 5. Completeness (inventory 30 → rows 30)
| # | Dossier item | Destination |
|---|---|---|
| 1 | The Glutton (eats whatever she chooses, a maw bigger than her head) | Q, LMB chomp, G Feast, Gagael RMB/F |
| 2 | Always hungry | passive Hunger: it climbs over time and with each bite; the fuller her belly, the less her bites do; eating feeds her (heals) |
| 3 | Every victim has a flavour | callouts on a bite ("Bland." "Disgusting." "Spicy.") |
| 4 | Digestive Assimilation (novel) | not built |
| 5 | Hollow resistance (novel) | passive: Hollow reiatsu does not poison her (`quincy` flag off for her) |
| 6 | Heilig Bogen (bear-trap bow, heart grip) | R |
| 7 | Heilig Pfeil (toothed-ball heads) | R (the arrows bite a ball out of what they hit) |
| 8 | Gagael (fang wings, flight) | F |
| 9 | Sklaverei-Gagael (jaw wings, cuffs) | Gagael G (the model's jaw wings) |
| 10 | Spork | Gagael Q (optional, anime-only) |
| 11 | Spife | Gagael E (optional, anime-only) |
| 12 | Golden Crunch (no friend/foe check) | Gagael R — it catches everyone, her allies too |
| 13 | Sklaverei drain | Gagael G |
| 14 | Hirenkyaku | Shift |
| 15 | The best Blut of the Bambies | RMB (Arterie) and passive (Vene: damage taken ×0.85) |
| 16 | The best hand-to-hand of the Bambies | LMB string |
| 17 | Shadow | not built |
| 18 | Durability (The Power's punch, a building) | passive toughness 7 |
| 19 | Perceptive (recognised Ichigo) | n/a |
| 20 | Weakness: never landed a real blow on Ichigo | the maw is slow to close: a dash out of the jaws before they shut escapes |
| 21 | Weakness: lost Vollständig to Auswählen | story (not built) |
| 22 | Lunch on the 11th Division | Q against groups (several bodies in one bite) |
| 23 | Biting Ichigo's cape | Q (a bite that catches only the edge of a body still holds it) |
| 24 | The Sklaverei combo (Spork → Spife → Golden Crunch) | Gagael Q E R |
| 25 | PePe's execution | Gagael F (swallowed whole below 25 %) |
| 26 | Auswählen escape | story (not built) |
| 27 | Kit proposal: Swallow | E |
| 28 | Kit proposal: Feast | G |
| 29 | Kit proposal: Snack (candy) | merged into the idle (the lollipop) and Feast (eating heals) |
| 30 | Kit proposal: Full Course | Gagael F |

## 6. Timelines (60 Hz)
- String: palm 7 (10) · knee 8 (12) · sweep 10 (12, a trip) · chomp 14 (18 and a bite r 0.6 out of what it reaches).
- Arterie haymaker: 0-20 the veins light down the arm · 24 the punch (40, knock 16, a smash crater r 1.4).
- Glutton Bite: 10 the maw out · 22 it closes 4 m ahead (60 in the jaw, a 2 × 2 × 2 m erase, the target held 0.8 s).
- Swallow: 1.2 s open; each shot eaten heals 8 and feeds Hunger −6.
- Heilig Bogen: 30 the draw · three arrows at 34 / 40 / 46 (16 each, a bite r 0.8 where they land).
- Feast: on while held — 1.6 m/s walk, a 2.5 m erase sphere ahead every 0.2 s, 10 a bite to whoever is in it.
- Gagael: Spork 18 the cuff (40 m/s; the trap snaps 70 on a body, holds 1.2 s) · Spife 14-30 the whip (9 m reach, 46,
  slams down) · Golden Crunch 20 the wave (14 m/s), at the target the trap rises and snaps 0.5 s later (120 in r 2.6,
  friend or foe) · Full Course 40 the maw rises round the target, 64 it closes (200, or swallowed below 25 %; a sphere
  r 5 erased).

## 7. VFX / callouts
The maw: lips and gums `#C4475A`, the inside `#5E1222`, teeth `#FFF6E8`, tongue `#D96A7A`; eaten voxels vanish with
no rubble, a few crumbs. Gold reishi `#FFC83A` / `#FFF0A6` / `#E59A1E` for the bow, the wings, the halo and the cuffs.
Blut Arterie: a red vein web `#FF4A4A`. Callouts: "The Glutton", "Quincy: Vollständig — Gagael", "Spork", "Spife",
"Golden Crunch", "Sklaverei".

## 8. AI
Patient and flat: arrows at range, closes when the target is hurt, bites from 3-4 m, swallows shots it sees coming,
Golden Crunch without caring who else is in it, Full Course on a weak target; at low HP keeps eating instead of running.

## 9. Test plan
Probe: the string and the chomp's bite; the haymaker's crater; Glutton Bite erases its volume and holds the target;
Swallow eats a Getsuga; the arrows bite; Feast tunnels through a wall; Gagael flight; Spork's trap, Spife's whip,
Golden Crunch (an ally caught too), Full Course (swallowed below 25 %); Hunger. AI duels. Screenshots: body (front,
back, ¾, face), the maw open and closing, Gagael, each technique.

## 10. Engine needs
New: `GluttonMaw` (a two-jaw voxel maw that opens, lunges and closes: an `erase` carve in its volume, bodies inside
bitten and held), `SporkTrap`, `SpifeWhip` (a chain of fang links), `GoldenCrunch` (a ground wave, then a giant trap of
two jaws rising and snapping), `FullCourse`. Existing: `rejectNear` (Swallow), `beamStop`, `sklaverei()`, `LightPillar`,
`vollFlight`, Hirenkyaku helpers.
