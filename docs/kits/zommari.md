# Zommari Rureaux - kit spec            (source: docs/roster/E2-espada-2.md § 3; tier B; wave W2)

## 1. Identity
Serene, preaching, untouchable: the fastest Sonído of the Espada fills the field with bleeding copies of himself, and
once released every one of his fifty eyes is a hand on your body. He does not hit you so much as take you away from
yourself: your legs walk you to him, your arm stops answering, your blade turns on your own throat.

## 2. Loadouts
One loadout (Hueco Mundo / Las Noches): the long white mandarin-collar coat to the shins with a small opening at the
chest, white hakama, the black sash, black kung-fu shoes with white soles; a bald head with the ridge of bone spikes
from the forehead to the nape, skull earrings, a necklace of bone beads; dark brown skin, golden eyes, full lips; the
estigma: three downward triangles on the chin, four thin lines ending in dots above each eye. Brujería at the hip:
the katana with the pink grip and the spiked disc guard.

## 3. Forms
| Form | Release | Power | Movement | Model | Notes |
|---|---|---|---|---|---|
| Sealed (Séptima) | - | ×1 | the fastest Sonído (longest blink, shortest recovery) | 196 cm, 94 vox at 48 vox/m | Hierro: blows under 10 barely scratch |
| Brujería | F: "Shizumare, Brujería" (鎮まれ「呪眼僧伽」): the sword hovers level before his chest and folds five times, he claps and twists his head 90°, foam swallows him | ×1.2, full heal | a slow hover on the bulb; Shift a short gliding Sonído | ≈3.2 m: the human torso, bone-armoured and studded with eyes, on a ribbed pink bulb 2.6 m across ringed by one-eyed faces; a big eye in the right palm, the skull neck brace with one eye, eight slits across the forehead | 58 eyes, one hold each |
| El Embrion (inside Brujería) | G | damage ×0.05 | rooted | the bulb grown up over him into a closed sphere | on leaving it the body eyes are blind for 12 s (white, bleeding): only the forehead eyes work |

## 4. Inputs per form
| Key | Sealed | Brujería |
|---|---|---|
| Shift | the fastest Sonído (no trail) | a short gliding Sonído |
| LMB | calm one-handed sword chain: thrust, rising cut, flat cut, the long finishing cut | **palm-eye snap**: Amor on the weapon arm of whoever is under the reticle |
| RMB | **triangulated strike**: he and two copies cut from three sides at once | **forced march**: every marked leg walks its owner a step toward him (marks the legs if none are) |
| Q | **Gemelos Sonído**: he Sonídos behind the target and leaves up to five bleeding copies round it, which fight | **Amor: legs**: the target's legs are his — they walk it toward him, no jumps or Shunpo |
| E | **substitution**: he swaps places with his nearest copy (with none, a Sonído away leaving one) | **Amor: head**: the whole body is his for 4 s: it stands, blade to its own throat (bleeding), and turns on its own side if it has one |
| R | **all-sides assault**: every copy lunges at once | **Amor: objects**: shots and blades in his gaze are seized and dropped; the target's weapon is taken from its hand |
| F | release | **forehead eyes**: the eight slits open, an instant volley on the legs of everyone in front (works while the body eyes are blind) |
| G | **meditation**: hands together, rooted; he heals and regains reiatsu | **El Embrion**: the bulb closes over him (×0.05 damage, up to 5 s), then the body eyes are blind |
| V | pink flare | pink flare |
| passive | Hierro; copies bleed (nobody can tell which is real) | 58 eyes, one hold each; the gaze needs line of sight (walls and dust block it); a bound victim (rooted by Kidō or a construct) cannot be moved; a heavy blow to him breaks one hold |

## 5. Completeness (inventory 30 → rows 30)
| # | Dossier item | Destination |
|---|---|---|
| 1 | Sealed form | form (default) |
| 2 | Resurrección: Brujería | F (sealed) |
| 3 | El Embrion | G (Brujería) |
| 4 | Blinded after El Embrion | rule: body eyes blind 12 s (LMB/Q/E/R off), forehead eyes still work |
| 5 | Sonído, the fastest | Shift (sealed) |
| 6 | Gemelos Sonído (up to five bleeding copies) | Q (sealed) |
| 7 | Swordsmanship | LMB (sealed) |
| 8 | Hierro (implied) | passive (toughness 10) |
| 9 | Descorrer (implied) | story (arrival) |
| 10 | Cero / Bala (never shown) | not built (no canon use) |
| 11 | Amor (gaze, the sun mark) | LMB/Q/E/R (Brujería) |
| 12 | Amor: a limb obeys him | Q (legs), LMB (arm) |
| 13 | Amor: the head takes the whole body (hostage) | E (Brujería) |
| 14 | Amor: objects (blades, the weapon) | R (Brujería) |
| 15 | One eye, one target (58) | rule: at most 58 holds |
| 16 | Kidō-like: binding Kidō on the victim, Dankū in the way | rule: a rooted victim cannot be moved; walls/constructs in the line of sight stop the gaze |
| 17 | Cutting the marked limb frees it | rule: a heavy blow on him breaks one hold; holds expire (6 s) |
| 18 | Hidden forehead eyes | F (Brujería) |
| 19 | Mass control (crowds) | F (Brujería) and the 58 cap (Hollows in free mode) |
| 20 | Released movement (slow) | Shift / movement (Brujería) |
| 21 | Weakness: line of sight | rule (raycast) |
| 22 | Weakness: El Embrion blinds him | rule (#4) |
| 23 | Weakness: arrogant, lectures | AI quirk: an opening speech; he stops to preach after a hold lands |
| 24 | Meditation / prayer | G (sealed) |
| 25 | Release motion (sword folding, clap, head twist, foam) | cinematic (F) |
| 26 | Hostage: "drop your sword" | E (Brujería): the head hold also takes the weapon |
| 27 | Triangulated strike | RMB (sealed) |
| 28 | Substitution | E (sealed) |
| 29 | Brave Souls "Beyond" (game-only) | optional, not built |
| 30 | Callouts: "Gemelos Sonído", "Shizumare, Brujería", "Amor", "El Embrion", praise of Aizen-sama | callouts |

## 6. Timelines (60 Hz)
- *String* (sealed LMB): thrust 0-8 wind, 8-13 active (24); rising cut 6-12 (22); flat cut 7-13 (24); finishing cut
  10-18 (34, a long `cut` 260).
- *Triangulated strike* (RMB): 0-12 he and two copies appear on three sides; 12-16 three cuts at once (26 each).
- *Gemelos Sonído* (Q): 0-6 he blinks behind the target; up to five copies (60 HP each, 8 s) round it; they fight with
  the sword string. A copy cut bleeds; at 0 it bursts into afterimage.
- *Substitution* (E): instant swap with the nearest copy.
- *All-sides assault* (R): every copy lunges (30 each).
- *Meditation* (G): rooted, 25 HP/s and 12 reiatsu/s until he moves or is hit.
- *Release* (F): 0-40 the sword hovers and folds, the clap at 40, the head twist at 50, foam 60-90, reveal at 90; full heal.
- *Amor* (Brujería): the eye glows purple 0-18 (the tell), the mark lands at 18 (instant, invisible, the sun mark
  printed on the limb), holds 6 s. Legs: walked 2.6 m/s toward him, no jumps or Shunpo. Arm: LMB/RMB off, and every
  1.1 s it strikes its own owner (26, with the owner's own strength). Head (4 s): the body frozen, its blade at its own
  throat (30/s), the weapon dropped; held to the end, the blade is drawn across (60). Objects: shots in his gaze
  dropped, the weapon taken for 4 s.
- *Forehead eyes* (F): 0-24 the slits open; at 24 a volley: the legs of everyone within 30 m in a 50° cone.
- *El Embrion* (G): 0-20 the bulb closes; ×0.05 damage while closed (up to 5 s, G again opens it); 12 s blind after.

## 7. VFX / SFX / callouts
Reiatsu pink `#F27DB8`; Amor glow purple `#A64DFF`; the sun mark dark violet `#2A1438` with a purple rim; the foam
white; blood from the copies. Callouts: 双児響転 GEMELOS SONÍDO · 鎮まれ「呪眼僧伽」 SHIZUMARE, BRUJERÍA · 愛 AMOR ·
守胚姿勢 EL EMBRION.

## 8. AI profile
Opens polite and preachy (a short speech before the first blow). Sealed: keeps two or three copies alive, strikes from
behind, triangulates. Releases at 60 %: legs first (forced walking), then the weapon arm, then the head; El Embrion
when hurt hard; forehead eyes while blind.

## 9. Story hooks
Aaroniero's tower: he comes to finish the unconscious Rukia; Byakuya refuses to give his name. Gemelos vs. Shunpo. The
release; Byakuya cutting his own tendons; the hostage; the storm that levels the building; El Embrion; Dankū catching
the mark; cut down from behind, praising Aizen.

## 10. Test plan
Probes: the string lands at 1.5-2.5 m; the copies appear (≤ 5), fight, bleed and burst; substitution swaps; the
assault hits from every side; meditation heals; the release heals and swaps the body; Amor on legs walks the target
toward him and blocks its dash; the arm hold stops LMB; the head hold freezes it and bleeds it; objects drop shots and
take the weapon; walls block the gaze; a rooted target cannot be walked; a heavy blow breaks a hold; the forehead eyes
mark several; El Embrion takes ×0.05 then blinds the body eyes. Screenshots: both models (front, ¾, back, face), the
copies round a target, the release, a sun mark, a forced march, the hostage, El Embrion.

## 11. Engine needs
Existing: `g.spawn` + `DuelistAI` for the copies (a small copy kit), `disarmT` (the arm, the weapon), `iffT` (the
head hold turns the victim on its allies), `rooted` (a bound victim), `rejectNear` (objects), voxel raycasts (line of
sight). New, kept in the kit: the holds (limb → effect, expiry, the sun mark drawn on the limb's bone), the El Embrion
shell, the blinded body eyes.

## 12. Open questions
(verify) the colour of the estigma (near-black assumed), the guard's metal (antique gold), the released body eyes'
iris colour (gold), the faces round the bulb.
