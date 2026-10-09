# Kenpachi Zaraki - kit spec            (source: docs/roster/B3-captains-3.md § Kenpachi Zaraki; tier S)

## 1. Identity
No guard, every swing bigger than the last. In the war he finally hears his sword: the hidden reiatsu, the real
Shunpo, a war-cleaver that cuts space itself and swats meteors and lasers out of the sky — and a crimson oni of a
Bankai that bites giants apart, eats his own body to do it and finally tears his right arm off at the elbow.

## 2. Loadouts
Kenpachi is one card with era chips (roster entries sharing `group: 'kenpachi'`).

| Era (id) | Ladder (F) | Model(s) | Status |
|---|---|---|---|
| **Soul Society** (`kenpachi`) — Soul Society → Hueco Mundo | sealed (G: eyepatch) · F previews Nome → Bankai (kept from before the era split) | spiked hair with bells, gold-trimmed eyepatch on a chain, black choker, Yachiru on the shoulder | built |
| **Thousand-Year Blood War** (`kenpachi-tybw`) — *peak, the card's default* | sealed → **Shikai Nozarashi** → **Bankai** | hair grown long and hanging free to mid-back, no bells, no choker, the **strapless grey-rimmed eyepatch**; Bankai: crimson oni with horns, black kumadori and a wild mane | new |

## 3. Forms (TYBW)
| Form | Release | Power | Movement | Model | Timers / rules |
|---|---|---|---|---|---|
| Sealed | - | ×1, toughness 12 | **real Shunpo** (TYBW: outran Ikkaku and Yumichika, took Gerard's hand before he could react): dash 15, double-tap behind | long loose hair, strapless eyepatch, ragged short-sleeved haori, bandage band, the chipped nodachi at the hip | V: **hidden reiatsu** |
| Unbound (G) | the eyepatch torn off | ×1.4, toughness 18 | same | eyepatch gone; skull aura | rest of the fight |
| **Shikai — Nozarashi** | 「呑め、野晒」 *Nome, Nozarashi* | ×1.5, toughness 22 | Shunpo | the war-cleaver (axe/cleaver hybrid, brass cap, green tassel) | - |
| **Bankai** | no name — a roar; Nozarashi, shaped like Yachiru, pours the power into his hand | ×2.1, toughness 30, heals 30 % | **Oni Pounce** (Shift) | crimson skin, black kumadori, two horns, the long hair flared into a mane, the jagged broken cleaver; steam | **Overload** meter: +4/s, +12-16 per technique, +1.5 per landed hit; at 100 the right arm tears apart at the elbow |
| Torn arm (forced) | overload 100, or after **The Perfect Crimson** | ×1.2 | Shunpo | Shikai body, right forearm gone (a raw stump), no weapon | 22 s: fists and kicks; then the arm is bound back and the cleaver returns; Bankai locked 30 s more |

## 4. Inputs (TYBW)
| Key | Sealed | Shikai | Bankai |
|---|---|---|---|
| Shift | Shunpo | Shunpo | **Oni Pounce**: a huge bound at the target (≤ 24 m), landing crater + shock (30 dmg) |
| LMB | **no pattern** (inherited): sweep / chop / riser / thrust / left jab / front kick, every landed hit +8 % | **cleaver string** (inherited) — the cleaver **shreds what it passes**: enemy shots and constructs near the blade are rejected | **oni hacks** (inherited) |
| RMB | **building cutter** (wrist flick) | **Meteor Cleaver** — the leap reaches a giant's head height; at the top of the leap everything falling on him is erased (rejects shots in 8 m) | **Distant Bisection** |
| Q | **Ryōdan** (Kendō) | **Space Cut**: a two-handed diagonal cleave that splits space — a black rift full of stars opens along the cut (26 m): shots and fields along it are undone, fighters near it are sucked toward it, and he cuts himself free of whatever holds him (root, blindness, inversion, scramble, arm lock, slow, time field) | **Bite & Rip**: lunge, seize, bite, shake, rip — the victim's weapon arm is torn useless (disarm 4 s); ×1.6 on giants |
| E | **Shock Wave** | **Deflect**: the flat of the cleaver across his body for 1 s — any beam or shot from the front is dumped into the ground beside him (a glowing furrow + crater); a blade from the front is beaten down and answered with a cut | **Launch Uppercut**: a crouch and a left uppercut that launches the target sky-high (giants too), a pillar of crimson force rising after it |
| R | **Bait & Grab**: chest bared for 1.2 s ("cut me anywhere") — the first blow from ≤ 5 m lands at half damage and the attacker is seized: head-butt, lifted, slammed (90 dmg); a shot is caught bare-handed and tossed aside | **Giant Grapple**: seize the target with the free hand — a normal foe is hurled overhead into the ground behind; a giant (≥ 3.5 m) has its leg torn out from under it and topples (knockdown + quake) | **Shield Breaker**: a 14 m rush dragging the jagged blade, then an upswing — **unblockable** (skips parries, guards, Blut Vene), it tears through fields and walls on the way |
| G | eyepatch off | eyepatch off (if still on) | **Roar**: 16 m — everyone, **allies included**, is driven back, frozen in fear 0.9 s and slowed 2.5 s |
| F | Nome | Bankai | reseal to the Shikai (the overload drains instead of tearing the arm) |
| V | **Hidden reiatsu**: the aura goes out and he cannot be sensed beyond 8 m (`veiled`), reiatsu regenerates +2/s; the first blow out of hiding is an **ambush** (×1.5, stagger); any special, a heavy hit or V reveals him | **Skyfall Cleave** (50): a leap into the sky (14 m) that erases everything above (shots and fields in 20 m), a golden crescent across the sky, then one cut straight down — 60 m of world split, a crater at the landing | **The Perfect Crimson** (60): both hands high, a blade of crimson reiatsu 30 m tall, one vertical cut — a 140 m slab through the arena, a molten seam left in the ground; then the overload hits 100 |
| Passive | reiatsu armour, near-death surge, **adaptation** | same | + Overload, berserk (Roar strikes allies), no guard |

**Adaptation** (all forms): the third time the same technique from the same foe hits him, he has its measure —
`見切った` flashes, and that technique deals −25 % (−40 % from the fifth); forgotten after 20 s without it.

## 5. Completeness (TYBW items; inventory 40 → rows 40)
| # | Dossier item | Destination |
|---|---|---|
| 1 | TYBW look: hair grown to mid-back, hanging free, no bells | skin (`tybw` body) |
| 2 | Strapless grey-rimmed eyepatch (TYBW) | prop `eyepatch-tybw`; G tears it off |
| 3 | No choker after Hueco Mundo | skin |
| 4 | Real Shunpo (outran Ikkaku and Yumichika; took Gerard's hand before he could react) | Shift (sealed / Shikai) |
| 5 | Reiatsu masked completely after Unohana (nobody sensed him before Gremmy) | V (sealed): hidden reiatsu |
| 6 | Shikai "Nome, Nozarashi" | F |
| 7 | One swing obliterated Gremmy's meteorite | V (Shikai) Skyfall Cleave; Meteor Cleaver erases what falls |
| 8 | Space-cutting: cut a clone in half and himself out of the vacuum pocket | Q (Shikai) Space Cut |
| 9 | Construct shredding (lava, water prison, pillars, a wall of guns, hardened flesh) | passive: the cleaver string rejects shots/constructs it passes |
| 10 | Trades blows evenly with Hoffnung (every chip on it opens a wound on him) | story (Gerard) — Gerard's kit already reflects the damage |
| 11 | Beam deflection: Hoffnung's laser dumped into the ground (anime: run along the branch) | E (Shikai) Deflect |
| 12 | Blocks a Godly-Size stomp and throws the giant into a tower | R (Shikai) Giant Grapple |
| 13 | Trips the reborn giant with one arm | Torn arm: RMB one-armed trip (Giant Grapple) |
| 14 | Climbs the enemy (runs up Hoffnung's flat, leaps off Gerard's fist at his face) | merged into Meteor Cleaver (the leap scales to a giant's head) |
| 15 | Severed the giant's forearm | merged into Shield Breaker (R, Bankai) |
| 16 | Bankai activation: golden pillar, the wave levels buildings; anime: magma ground | F (Shikai) cinematic + molten ring |
| 17 | Nozarashi appears as Yachiru and pours the power into his hand | cinematic (the spirit rises, touches his hand, fades into him) |
| 18 | Bit the giant's knuckle and ripped the whole arm off | Q (Bankai) Bite & Rip |
| 19 | Cut through Gerard's shield and forearm | R (Bankai) Shield Breaker |
| 20 | An uppercut launched the skyscraper-tall giant off the edge of the sky-city | E (Bankai) Launch Uppercut |
| 21 | Bisected the giant with a single cut at a distance (anime: through the nose) | RMB (Bankai) Distant Bisection; V The Perfect Crimson |
| 22 | Berserk: can't tell friend from foe, roars instead of speaking, leapt at Hitsugaya and Byakuya | G (Bankai) Roar (allies too); AI quirk |
| 23 | Overload: the right arm tears apart at the elbow | passive Overload → Torn arm |
| 24 | Nozarashi apologises for releasing too much | cinematic line at the overload |
| 25 | Pernida's nerves warp his limbs; he rips off his own arm | system: Pernida's Compulsory (dash tears the arm free) — shared |
| 26 | Legs warped; Mayuri paralyses him to save him | story (Pernida) |
| 27 | Unohana: death-and-revive loop, the limiter erodes | passive near-death surge (inherited) |
| 28 | Gremmy's stone fort: lava, water prison, pillars, guns | merged into 9 (construct shredding) |
| 29 | Gremmy's vacuum pocket and clone explosions | merged into Space Cut (cuts free of enclosures) |
| 30 | The Bambies' ambush while crippled; Ichigo saves him | story |
| 31 | First invasion: carries three Sternritter corpses, loses to "Yhwach" (Royd) | story (scripted loss) |
| 32 | Kendō — Ryōdan | Q (sealed), inherited |
| 33 | Instinct swordsmanship, gets better with every exchange | LMB growth (inherited) |
| 34 | Adaptation: tunes his reiatsu to an obstacle | passive adaptation |
| 35 | Reiatsu armour (weak blows bounce) | passive (toughness), inherited |
| 36 | Bait-and-grab (takes a stab to seize the hilt) | R (sealed) Bait & Grab |
| 37 | Bare-hand Cero catch | merged into Bait & Grab (a shot is caught and tossed aside) |
| 38 | Shock Wave (anime) | E (sealed), inherited |
| 39 | Golden skull aura | aura (inherited `SkullAura`) |
| 40 | Mercy rule: won't finish a foe who can't fight | AI quirk (walks off a downed foe for 3 s) |

## 6. Timelines (60 Hz)
- Space Cut: 0-21 wind-up (the cleaver back over the right shoulder, both hands) · 25 the cleave, a 26 × 6 m cut slab
  tilted 55° (cut power 1600, 85 dmg to anyone in its plane) · 25-110 the rift: a black slit full of stars along the
  cut, opening to 1.4 m then closing; shots/fields within 3 m of it rejected on open; fighters within 7 m pulled toward
  it (vacuum, 0.8 s) · recovery to 60. Cost 30, cd 9 s.
- Deflect: 0-4 the flat across the body · 4-60 active: a hit from the front (±80°) is cancelled — a shot/beam:
  sparks + a glowing furrow from his feet out to the side, crater r 1.4; a blade: the attacker staggered, answered at
  once with a downward cut (70 dmg, knock 14) · recovery to 72. Cost 14, cd 7 s.
- Giant Grapple: 0-12 reach (seize ≤ 3.6 m ahead, ≤ 6 m for a giant) · normal: 12-34 lifted overhead · 40 hurled down
  behind (75 dmg, crater r 2.4) · giant: 12-30 the heave · 30 it topples: 110 dmg, heavy, hitstun 1.6, quake ring
  r 9 · whiff recovery 20. Cost 18, cd 8 s.
- Skyfall Cleave: 0-12 crouch · 12 the leap (vy 24) · 34 the apex: rejects shots/fields in 20 m, golden crescent ·
  34-60 the dive · landing: a 60 × 10 m vertical cut slab ahead (power 2400, 160 dmg in its plane), crater r 5
  (110 dmg within 5 m), hitstop 0.12, slow-mo 0.3. Cost 50, cd 20 s.
- Bait & Grab: 0-72 open (armour 0.5 against the first blow) · on a melee blow from ≤ 5 m: 0-10 the seize, 18 the
  head-butt (30 dmg), 24-40 lifted, 46 slammed (90 dmg, crater r 2) · a shot: caught, thrown aside (rejected), the
  stance ends. Cost 10, cd 7 s.
- Oni Pounce: 0-8 crouch · 8-30 the bound (to the target or 14 m ahead) · landing crater r 1.6, 30 dmg within 3 m.
  Cost 4 (the dash cost).
- Bite & Rip: 0-10 lunge (≤ 6 m) · 10 seize · 16 the bite (30 dmg) · 28/38 two shakes (18 each) · 52 the rip (72 dmg,
  blood burst, disarm 4 s, thrown 8 m) · giants ×1.6. Cost 20, cd 9 s, overload +14.
- Launch Uppercut: 0-14 crouch · 16 the uppercut (85 dmg, launch 26, ignores boss knock resistance) · 16-40 a crimson
  pillar rises 30 m from the target (carve power 900) · he follows 6 m up. Cost 18, cd 8 s, overload +12.
- Shield Breaker: 0-10 the lean · 10-34 the rush (14 m, carve smash 500 along it, rejects fields/shots) · 34 the
  upswing (unblockable 100 dmg) + an 18 m vertical cut. Cost 20, cd 7 s, overload +12.
- Roar: 0-12 head back · 12 the roar: 16 m, knock 10, fear 0.9 s, slow 2.5 s; dust ring; shots in 10 m rejected.
  Cost 10, cd 10 s, overload +8.
- The Perfect Crimson: 0-54 both hands high, armour 0.8, the crimson blade grows to 30 m · 60 the cut: a 140 × 40 m
  vertical slab (power 4000, 190 dmg in its plane), a molten seam 60 m along the ground, red sky flash, slow-mo 0.5 ·
  80 the overload jumps to 100. Cost 60.

## 7. VFX / callouts
Gold reiatsu `#F6C823` / core `#FFF2B3`, skull `#FFE066`; Bankai ember `#FF6A1A` / crimson `#B3231D`, pillar core
`#FFF4C2`, magma `#FF5A00` / crust `#7A1A00`; the space rift: black `#0B0812` edged violet `#6A4AA8`, star motes
`#E8E4FF`; deflected beams streak gold-white into the ground. Nozarashi as Yachiru: her prop as a pink glowing spirit
(`#FFB3CF` glow). Callouts: 「呑め、野晒」 *NOME, NOZARASHI* · 「空間斬り」 *SPACE CUT* · 「弾き」 *DEFLECT* · 「天落」
*SKYFALL* · 「卍解」 *BANKAI* (no name — he roars) · 「噛み千切り」 *BITE & RIP* · 「咆哮」 *ROAR* · 「真紅の両断」 *THE
PERFECT CRIMSON* · 「見切った」 *READ IT* · 「ゴメンね、剣ちゃん」 *SORRY, KEN-CHAN* (the overload). The torn arm: blood
`#7A0E10`, flesh `#B33A3A`, bone `#E6DCC8`.

## 8. AI
Joyful berserker. Opens with "cut me anywhere" (inherited taunt) — in TYBW he hides his reiatsu first and walks in
unseen. Brawls with the string, Shunpo-closes from range; Bait & Grab when the foe keeps hitting him; eyepatch off at
62 % or after three strong hits; Shikai at 50 %; in Shikai: Deflect when the foe charges a beam or shoots, Space Cut
when he is bound/blinded or the foe hides behind a field, Giant Grapple on giants and close foes, Skyfall Cleave when
the foe is airborne or a giant. Bankai at 25 %: pounces, Bite & Rip, Launch Uppercut, Shield Breaker on a guarding
foe; Roar when crowded; The Perfect Crimson when the foe is below 35 % or the overload passes 80; reseals at overload
90 if the foe still stands. Tells: both hands on the hilt (Ryōdan, Space Cut), the crouch (Skyfall, Uppercut), the
flat of the blade (Deflect), arms spread (Bait & Grab). Mercy: a downed foe gets 3 s.

## 9. Story hooks
Unohana (the prison depths: the revive loop, Nozarashi's voice → Nome); Gremmy (the stone fort, the meteorite, the
vacuum pocket); Pernida (the nerves, the self-amputation); Gerard (the stomp thrown back, the laser dumped, Bankai: bite,
uppercut off the edge, bisection, the arm shatters, the one-armed trip of the reborn giant).

## 10. Test plan
Probe: Shunpo dash length; hidden reiatsu veils (nearestEnemy beyond 8 m skips him) and the ambush bonus; Bait & Grab
seizes a melee attacker and slams; Space Cut rejects a Getsuga and frees a rooted/blind self; Deflect cancels a Cero
from the front; Giant Grapple on Ichigo (thrown) and on a giant (topples); Skyfall Cleave damage + rejection; Bankai:
Yachiru spirit spawns, Oni Pounce lands, Bite & Rip disarms, Uppercut launch, Shield Breaker unblockable vs a parry,
Roar fear, overload fills → torn arm (forearm hidden, stump shown, LMB fists), arm restored after 22 s, The Perfect
Crimson forces it. Screenshots: TYBW body (front, back, ¾, face, eyepatch close-up), Bankai body (front, ¾, face),
torn arm, Space Cut rift, Deflect furrow, Skyfall, Perfect Crimson, the Yachiru spirit.

## 11. Engine needs
Shots and fields undone → `game.rejectNear`. Hidden reiatsu → `Fighter.veiled`. Torn arm → bone scale on `forearm.R`
+ a stump prop + `disarmT` with `Kit.bareHands()`. Unblockable → `DamageOpts.unblockable`. Fear → hitstun + `slowT`.
The space rift and the Yachiru spirit are new VFX in `vfx/nozarashi.ts`.

## 12. Open questions
TYBW haori: kept ragged and short-sleeved (verify); whether the Bankai keeps the haori (kept); the exact words
Nozarashi says at the overload (paraphrased); the Shikai's size (≈2.4 m, readable rather than the wiki's "twice his
size").
