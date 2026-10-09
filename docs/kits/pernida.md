# Pernida Parnkgjas - kit spec            (source: docs/roster/H1-vandenreich-leaders.md § Pernida Parnkgjas; tier B → built as A)

## 1. Identity
The Left Arm of the Soul King: a small hooded thing that never needs to touch you — its nerves are already in you.
Your arm turns on you, your body folds, a giant is wrung into a ball. Every blow teaches it, every finger you cut off
becomes another of it, and under the cloak there is only a hand that keeps growing.

## 2. Loadouts
One card: the Schutzstaffel (cloak → hand → arm). The Vollständig is the anime's (ep391-392) and lives on G inside the
cloak. Not built: limb occupancy (living in Ichibē's arm) and the Almighty-sealing spectral arm (story, Ichibē's
truce), the Royal Guard set pieces (Senjumaru's sand, Hikifune's wood: story).

## 3. Forms
| Form | Trigger | Power | Movement | Model | Timers |
|---|---|---|---|---|---|
| Cloaked (外套) | - | ×1, damage taken ×1 | **Phantom Step** (a Hirenkyaku blink that lands behind the target) | **150 cm (72 vox)** hooded figure: long white Schutzstaffel cloak, three buttons, dark-red **Hagal rune** on its left side, a deep hood whose face is a void with **two gold eye-points**; a pale long-fingered **left hand** out of the sleeve (the right sleeve hangs closed). The hood **swells and ripples** when it is hurt | regen 0.2 %/s (not within 2 s of a blow) |
| Vollständig (anime) | G in the cloak | ×1.3; damage taken ×0.9 | flight (Hirenkyaku on air); the dash is a wingbeat | the cloak + a **Zeichen halo** (gold) + **two wings shaped like huge flat hands** on its back (gold-white, translucent) | drains 4 reiatsu/s; G again ends it |
| The Left Hand (左手) | F; or forced: an acid blow, or its health below 55 % | ×1.4, damage taken ×0.85 | skitters on four nerve roots; **Finger Gallop** | the cloak shreds: an **enormous pale left hand, 4.4 m**, fingers up, **chains linking the fingertips**, a **palm eye** (two pupils, gold iris), the **Hagal rune on the wrist**, standing on a knot of nerve roots | regen 0.4 %/s (not within 2 s of a blow) |
| The Left Arm (左腕) | F in the Hand (the chains break) | ×1.8, damage taken ×0.8, a giant (no jumping) | strides on its roots; **Root Fling** | the arm grows out of the wrist to a **stump spilling tendon, muscle and bone**, standing like a tree on splayed nerve roots: **11 m** | regen 0.4 %/s (not within 2 s of a blow) |
| Gargantuan Arm (A ep400) | V in the Arm with the Progress meter ≥ 60 | ×2.4 | as the Arm, ×2.4 bigger (26 m) | the same arm, towering over the rooftops | 20 s, then back to 11 m |
| Clones (分体) | a severed finger: G in the Hand/Arm (two at once), or a single blow of ≥ 10 % of its health while a hand is out | AI, ×0.6 | skitter | a 2.6 m hand: **one pupil, no wrist rune** | at most 4; each 260 HP |

## 4. Inputs
| Key | Cloaked | Vollständig | Hand | Arm |
|---|---|---|---|---|
| Shift | **Phantom Step**: behind a target within 18 m, otherwise a Hirenkyaku glide | a wingbeat dash (air or ground) | **Finger Gallop**: tips onto its fingertips and rushes 16 m, trampling | **Root Fling**: the roots catapult it 14 m; the landing cracks the ground |
| LMB | **Nerve Flicks**: left-sleeve lash → right-sleeve lash → rising double lash (launch) → nerve spear (6 m). Each hit plants a **nerve** (stack, max 5) | **Wing Slaps**: the hand-wings slap left → right → clap → a palm drive (each plants a nerve) | **finger rake → palm slam → backhand** | **sweep → palm slam** (crater + groundwave) **→ backhand** |
| RMB | **Compulsory** (強制執行, 10 m): the eyes flare (tell 0.3 s), nerves fire into the target: its **weapon arm twists into a spiral** (arm seized: no LMB/RMB, 4 % HP/s). With 3+ nerves, or after 1.6 s held: **the whole body folds** (big damage, down 1.4 s) | same | **Compulsory, five fingers** (14 m): the twist, then **crushed into a ball** ("Za Konparusorī") and flung | same, 22 m, up to two targets |
| Q | **Nerve Lance**: a bundle of nerves bores straight 24 m (two nerves on what it hits) | **Wing Grab**: a hand-wing reaches 12 m, seizes, crushes and hurls | **Nerve Storm**: thick nerves in every direction 18 m, tearing the ground and holing buildings | **Nerve Storm**, 30 m |
| E | **Stone Hands**: two stone left hands rise from the ground at the target's sides and **clap** | same | **Twin Stone Hands**, bigger; out of a wall when one is near | **Wall Hands**: every building face near the target grows a hand (up to four) that grabs and slams |
| R | **Heilig Bogen**: a bow between its fingers, one huge **nerve-tethered** arrow (homing; misses circle back once; tunnels; a tower-killer) | same | **Five-Bow Volley**: five fingertip bows, five homing nerve arrows | same, giant arrows |
| G | **Vollständig** (on) | Vollständig (off) | **Self-Replication**: tears off two fingers — two clones grow out of them; the fingers regrow | same |
| F | **Unveil** → the Hand | Unveil | **Break the chains** → the Arm | **Devour**: the hand seizes a downed, folded or balled body within reach; a mouth opens in the palm (a tongue with an eye) and eats: heals 30 % of the bite, +15 Progress; poisoned flesh (Mayuri, Askin, Szayelaporro) backfires (−12 % of its own health, it swells) |
| V | **Progress** (Progress ≥ 60): straight to the Arm, heals 25 %, every adaptation doubled; below 60: **silent pressure** (the hood ripples, near enemies flinch, +8 Progress) | same | **Progress** → the Arm | **Gargantuan Arm** (20 s; the stone hands rise twice as many) |

Passives:
- **Nerves** (stacks on a victim, 0-5, fade after 6 s untouched): every nerve hit plants one; the Compulsory reads them.
- **Self-amputation** (the canon counter): a twisted victim that dashes (Shunpo, Sonído…) **tears the arm free**: it
  costs 8 % of its health and its weapon arm is gone for 3 s (`disarmT`). The duel AI does it after 0.5 s half the
  time. A fold or a ball cannot be escaped.
- **Progress / adaptation** (前進): each technique that hurts it (one per attacker and action; a shot counts by its
  owner) deals 12 % less every time it lands again, down to 40 %; the third time it says **ADAPTED**. Forgotten after
  20 s unused.
- **The Progress meter** (0-100): +4 per nerve planted, +10 per fold or ball, +6 per technique adapted, +15 per
  devour. Its speech evolves with it: murmurs → its name → "I have always been a Quincy" (at 100, a deeper voice).
- **Regeneration**: the rates above; a finger cut off grows back at once (the clone grows from the old one).
- **Reconstitution**: the first death of the Hand or the Arm is not one — the shreds sprout eyes and fingers and pull
  back together into the Hand with 35 % health (once).
- **Heart of the Soul King's left arm**: The Almighty does not see it (`data.unforeseen`).
- **Weaknesses** (counterplay):
  1. **Exposed nerves** — acid and chemicals (Mayuri, Askin, Szayelaporro): ×1.3 damage, the grip breaks, it flinches
     back; in the cloak the first such blow forces the Hand.
  2. **Changing the anatomy** of the invaded limb — Mayuri tears free of a twist in 0.6 s at no cost.
  3. **Electric shocks** drive nerves out — Candice and Yoruichi shake off a twist in 0.5 s; lightning deals ×1.3.
  4. **Anaesthetic in the air** neutralises the nerves in the ground and in the arrows — merged into 1 (a chemical
     blow also breaks the arrows' tethers within 6 m).
  5. **Overwhelming raw force** — a single blow of ≥ 12 % of its health to the palm (from the front) staggers the
     Hand/Arm 0.8 s (and cuts a finger: a clone).
  6. **Poisoned biomass** makes it self-destruct — Devour backfires on poisonous bodies.

## 5. Completeness (inventory 54 → rows 54)
| # | Dossier item | Destination |
|---|---|---|
| 1 | Cloaked: 150 cm hooded figure, void face, two glowing eye-points | form: Cloaked |
| 2 | A human-like arm out of the cloak (manga debut) | model: the pale left hand from the sleeve |
| 3 | The hooded head swells and ripples when hurt | model: the hood bone swells on a heavy blow; V's silent pressure |
| 4 | True body: an enormous pale left hand | form: the Hand |
| 5 | Chains linking the fingertips | Hand: the fingertip chains (they snap on F) |
| 6 | Palm eye: two pupils, golden iris | model; the eye glows before every Compulsory (tell) |
| 7 | Grows the rest of the arm; a stump with tendon, muscle, bone | form: the Arm |
| 8 | Stands upright on nerves anchored in the ground (8-12 m) | Arm: the root legs (quad stance) |
| 9 | Gargantuan arm above the rooftops (A ep400) | V in the Arm |
| 10 | Hagal rune on the wrist (clones lack it) | model; the clone variant |
| 11 | Gender: none ("it") | text (callouts, docs) |
| 12 | Cloak: long white, three buttons, dark-red Hagal rune, deep hood | model: Cloaked |
| 13 | Mutters unintelligibly; Lille translates | callouts: the murmurs |
| 14 | Clones: a severed finger sprouts fingers and eyes and grows into a hand and arm | G (Hand/Arm) + passive on big blows |
| 15 | Clones: one pupil, no rune | the clone model |
| 16 | Scraps of a torn clone grow eyes and fingers and stay alive | passive: Reconstitution (the shreds pull back together) |
| 17 | While eating, a clone grows a tongue with an eyeball on its palm | F (Arm): Devour's palm mouth |
| 18 | Vollständig (A): Zeichen halo + hand-shaped wings | G (Cloaked), optional (anime-only) |
| 19 | Heilig Bogen between ring and index fingers, drawn with the thumb | R (Cloaked) |
| 20 | Five small bows over the fingertips | R (Hand/Arm) |
| 21 | Huge arrows; one destroyed a tower | R: the arrows bore and carve |
| 22 | Nerve-tethered arrows: infiltrate; misses steered back by ground nerves | R: homing + one circle back; a hit plants two nerves |
| 23 | Clones make bows too | the clone kit's R |
| 24 | Hirenkyaku expert: behind Yoruichi at Yhwach's word | Shift: Phantom Step |
| 25 | Reiatsu beyond captain level | stats (HP 1000, power by form) |
| 26 | Nerve invasion: nerves from the fingers take over a body; eyes glow each time | RMB: Compulsory |
| 27 | Twisting limbs into spirals | RMB: the twist |
| 28 | An arm wrung into a puddle of blood | RMB: the twist's end (the arm's blood spray when held 2.4 s) |
| 29 | Folding a whole body until the legs break | RMB: the fold (Cloaked) |
| 30 | Crushing a giant into a ball with a breath | RMB (Hand/Arm): the ball; giants and summons are always balled |
| 31 | Compressing a corpse into a ball | merged into 30 (Devour prefers a balled body) |
| 32 | Forcing a victim's own weapon toward its head | RMB: the twist plays the puppet stab when held past 1.2 s (the blade at its own throat) |
| 33 | Only counter: amputate the invaded limb | passive: self-amputation (dash) |
| 34 | Inorganic compulsion: giant stone hands from ground and walls; clap | E |
| 35 | Rippling a building's wall outward | E (Arm): Wall Hands |
| 36 | Nerve storm: every direction, ground ripped, buildings holed | Q (Hand/Arm) |
| 37 | Remote Compulsory: a severed finger's knuckle eye infects its holder | clones: a clone in reach of a downed enemy grips it (the clone's RMB) |
| 38 | Adaptive replication: learns from what its nerves touch (Kenpachi's power, Mayuri's layers) | passive: the Progress meter; V doubles the adaptations |
| 39 | Copied layered nerves: sheds infected skin layers | V (Progress) clears every status; the Hand/Arm shed statuses 2× faster |
| 40 | Organic evolution: eats biomass for traits | F (Arm): Devour |
| 41 | Anatomy manipulation: grows parts, sheds parts, changes size | F/V: the form ladder and the Gargantuan Arm |
| 42 | Self-replication: rips off its own fingers on purpose | G (Hand/Arm) |
| 43 | Regeneration; reforms from shreds | passive |
| 44 | Speech evolution (murmurs → words → mimicked laugh → "I have always been a Quincy") | passive: callouts by the Progress meter |
| 45 | Precognitive immunity | passive (`data.unforeseen`) |
| 46 | Limb occupancy (A ep390) | story, not built |
| 47 | The Almighty's bane: shows the Soul King's past, seals The Almighty (A ep390) | story, not built (Yhwach duel flavour: its Compulsory ignores his foresight) |
| 48 | Vollständig: prehensile hand-wings grab and strike; fast flight | Vollständig: LMB Wing Slaps, Q Wing Grab, flight |
| 49 | Crushed Hikifune's wood, burst out of a wooden prison (A ep392) | Vollständig: binds and roots last a third as long |
| 50 | Weakness: exposed nerves (acid, chemicals) | counterplay 1 |
| 51 | Weakness: anatomy change breaks control | counterplay 2 |
| 52 | Weakness: electric shocks | counterplay 3 |
| 53 | Weakness: anaesthetic in the air; raw force; poisoned biomass | counterplay 4-6 |
| 54 | Callouts ("Za Konparusorī", "Hairihhi Bōgen", its name, "Kuinshī da", a cackle) | callouts |

## 6. Timelines (60 Hz)
- Nerve Flicks: lash 10 (12, 4 m) · lash 10 (12) · rising 14 (16, launch 6) · spear 16 (24, 6 m line, bore r 0.3).
- Compulsory: 0-18 the eyes flare · 20 the nerves fly (0.12 s) · the twist: 4 %/s, arm seized up to 3 s · the fold at
  3 nerves or 1.6 s: 150, down 1.4 s · Hand/Arm: the ball at 1.2 s: 220, flung 18 m (knock 26, launch 9).
- Nerve Lance: 0-14 · a bundle 24 m in 0.25 s: 60, bore r 0.5, two nerves.
- Stone Hands: 0-16 fingers twitch (tell) · the hands rise 0.5 s (craters r 1.6) · clap at 0.8 s: 110 (bigger: 160) ·
  crumble at 1.6 s into rubble.
- Heilig Bogen: 0-30 the draw · loose: an arrow 70 m/s, turn rate 1.6 rad/s, 120, bore r 0.9; one circle back.
- Five-Bow Volley: 0-26 · five arrows 0.06 s apart (55 each; Arm: 80, bore r 1.6).
- Nerve Storm: 0-24 (the hand clenches) · 16 nerves (Arm 24) out to 18 m (30 m) in 0.3 s: 45 each, a furrow
  (groundwave) and bores where they meet walls.
- Phantom Step: 0.08 s blink. Finger Gallop: 0.45 s, 16 m, 40 to what it crosses. Root Fling: 0.7 s, 14 m, landing
  70 within 4 m, a crater r 3.
- Hand string: rake 16 (40, carve along the fingers) · palm slam 22 (70, crater r 1.8) · backhand 18 (55, knock 18).
- Arm string: sweep 22 (70, carve along the arm) · palm slam 28 (110, crater r 3.5 + groundwave 12 m) · backhand 22
  (80, knock 26).
- Self-Replication: 0-30 (it bends two fingers back and tears them) · two fingers fall, grow 1.2 s, two clones.
- Devour: 0-16 the reach · the palm opens 0.4 s · bites 3 × (60 each) · drops.
- Unveil: 0-40 the hood bulges, the cloak tears from inside · the hand rises (invulnerable). Break the chains: 0-30
  the links strain · they snap · the arm grows 1.2 s (invulnerable).
- Progress: 0-40 a shudder of growth · the Arm. Gargantuan: 0-60 it grows ×2.4.

## 7. VFX / callouts
Reiatsu yellow-gold (#F2C84B, translucent #F7DD84); nerves dark sinew #2A2228 with pale highlights #E8D0C8; the hand
#E9DED3 (shade #BFAE9F), nails #D9C8BA, chains #4B4B52, the palm eye sclera #F1EDE6 with a gold iris #D9A520; the
stump muscle #8E2A2C, tendon #EDE3D2, bone #E6DCC6, blood #6E0E12; the bow pale gold-white #F3E7B0; the cloak #EFEEE9
(shade #C5C6CB), the rune #6D111A, the hood void #141418. Callouts: "強制執行 — Za Konparusorī" (the Compulsory),
"神聖弓 — Heilig Bogen", murmurs ("…ッ…ゥ…", "…Pe…ru…"), "Perunida Parunkajasu." (its name), "Kuinshī da." ("I'm a
Quincy"), "I have always been a Quincy." (Progress at 100), a mimicked cackle ("Kekeke…") when it adapts.

## 8. AI
Silent and patient; opens with the Compulsory at range (8-10 m) rather than melee, Phantom Steps behind a target that
turns away, flicks to stack nerves, stone hands on a target that stands still, the bow at range. Unveils at 60 %
health (the hood bulges first: the tell); breaks the chains at 35 %. In the Hand/Arm it tears off fingers when
outnumbered or below half health, storms nerves at mid range, volleys at range, devours what it has folded. Progress
as soon as the meter reaches 60. Vollständig when its target flies.

## 9. Story hooks
Vier Ast (vs Kenpachi, Mayuri, Nemu): the arm torn off (self-amputation), the fold, the acid that forces the Hand, the
stone-hand clap, the pinky clone, the volley, the palm punched through (raw force). Royal Guard: the Divine Soldier
balled with a breath; "Pernida." — Yoruichi's arm corkscrews.

## 10. Test plan
Probe: the flick string (nerves planted), the Compulsory (arm seized, drain, the fold at 3 nerves, the self-amputation
by dash, Mayuri/Candice escapes), Nerve Lance (bore), Stone Hands (rise, clap, crumble), the bow (homing, circles
back), Phantom Step (behind), Vollständig (flight, wing slaps, wing grab), Unveil (forced by acid / low health), the
Hand (gallop, string, five-finger ball, nerve storm, volley, clones from G and from a big blow), the chains → the Arm
(size, giant, string, wall hands, devour, poison backfire), Progress, Gargantuan (timer), adaptation (12 % per repeat,
ADAPTED), Reconstitution (once), the Almighty skip. Duels vs Ichigo and TYBW Hitsugaya (and Kenpachi). Screenshots:
the cloak (front, back, ¾, the hood close-up), Vollständig, the Hand (front with the eye, side, back), the Arm, the
clone, each move in the arena and in Karakura.

## 11. Engine needs
Existing: `VineMesh` (nerves, a new nerve look), the reaction clips (+ three new: `compel_twist`, `compel_fold`,
`compel_ball`), `armLockT`, `disarmT`, `rooted`, `g.spawn` + `DuelistAI` (clones), the quad stance (the root legs),
`vollFlight`, `LightPillar`, `PropMesh` (stone hands, the severed finger, the bows), `data.unforeseen`, adaptation
through `Fighter.parry` + `damageTaken`.
New: none beyond the kit (the nerves on a victim, the twist, the fold and the ball are the kit's own bookkeeping).

## 12. Open questions
The Vollständig's name (none given: the callout says "Quincy: Vollständig"); the arm's exact height (8-12 m est.);
the nerve colour (dark sinew vs shadowy tendrils: dark sinew chosen).
