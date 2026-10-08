# Kaien Shiba - kit spec            (source: docs/roster/A3-urahara-shop-and-shiba.md § 7; tier B; wave W2)

## 1. Identity
The grinning lieutenant who taught Rukia to fight: an honest fencer with an expert's Shunpo and quick Kidō, and in
Shikai a dance — the trident pivoting round one wrist, water pouring off every arc, the foe crushed between the thrust
and the rising wave. Possessed by Metastacia he is the same body turned predator.

## 2. Loadouts
- **Lieutenant** (default): the standard shihakushō, the 13th Division badge (十三 and a snowdrop) tied on the left arm,
  the Shiba crest (a whirlpool) on the left wrist (verify), Nejibana at the left hip.
- **Possessed** (a roster entry of its own, "Kaien (Possessed)"): the boss variant of the night hunt — grey-green skin,
  black sclera with orange flame marks round the eyes, Metastacia's tentacles writhing from the back; no sword (it was
  destroyed before the fusion).
- Training (sleeves tied, Mt. Koifushi): skin only, not built yet.

## 3. Forms
| Form | Release | Power | Movement | Model | Notes |
|---|---|---|---|---|---|
| Sealed | - | ×1 | expert Shunpo | 183 cm, the standard body at 45.9 vox/m (84 vox) | the katana: gold wave guard, dark-blue wrap |
| Shikai: Nejibana | F: "Suiten sakamake, Nejibana" (水天逆巻け「捩花」) — the sword held upside down, twirled, glowing yellow, spilling water | ×1.3 | Shunpo leaving a splash | the 2.4 m trident | every swing sheds water; his waves leave puddles that slow and soak |
| Disarmed | his sword shattered (Zanpakutō destruction) or knocked away | ×1 | same | the fists | LMB punches, RMB the grab & rip, Kidō still works |
| Possessed | separate entry | ×1.2 | lunging, erratic | grey-green, black eyes, back tentacles | his tentacles shatter the first blade that strikes them |

## 4. Inputs per form
| Key | Sealed | Shikai (Nejibana) | Possessed |
|---|---|---|---|
| Shift | Shunpo | Shunpo with a splash | a lunging leap |
| LMB | the kendō string (4 cuts) / disarmed: fists (jab, hook, uppercut) | the **spear dance**: thrust, spin (the drill butt comes round and bores), rising sweep, crushing overhead (a wave bursts all round); each swing sheds a water arc | claw, claw, bite |
| RMB | **blink double cut**: a Shunpo to the target's side and two cuts at two limbs | **crushing tide**: a thrust that pins (weapon flicked away) while a wave rises behind and slams it onto the spear | **tentacle grab**: Spirit Body Fusion — hooked, drained, its steps scrambled |
| Q | Shakkahō (anime) | **rising wave** (a wave wall lifts; as it falls back the **undertow** drags enemies toward him) | a tentacle volley |
| E | **grab & rip** (bare hands: seizes and tears; the victim's weapon arm numb for 3 s) | **spiral thrust** (a corkscrew jet, bores 20 m) | the pounce (a leap onto the target) |
| R | rapid Kidō: three Shakkahō | **tidal sweep**: a fan of water blades | Metastacia's touch: the next blade on him shatters (once per fight) |
| F | release | **Surge**: the ground floods, a giant wave carries him in, the crushing thrust at its crest | - |
| G | **mentor's guard**: a counter stance (a blow inside 0.7 s is turned and answered with a cut: "Again!") | **spinning guard**: the trident twirled before him — shots in front are swept away, frontal blows ×0.3 (held; G again ends it) | - |
| V | flare | flare | flare |
| passive | his heart: when he falls, his nearest ally gains +15 % power for the rest of the fight (extrapolation) | the water: soaked targets (wetT) | blades that strike his tentacles shatter (once) |

## 5. Completeness (inventory 27 → rows 27)
| # | Dossier item | Destination |
|---|---|---|
| 1 | Sealed form | form (default) |
| 2 | Shikai: Nejibana (twirl release) | F (sealed), cinematic |
| 3 | Possessed by Metastacia | roster entry "Kaien (Possessed)" |
| 4 | Shunpo (expert), the double-limb blink cut | Shift; RMB (sealed) |
| 5 | Swordsmanship (trained Rukia) | LMB (sealed); G (sealed) counter stance |
| 6 | Kidō: rapid, no incantation | R (sealed): three Shakkahō |
| 7 | Shakkahō [anime-only] | Q (sealed), flagged anime-only |
| 8 | Bare-handed fighting, ripped a tentacle off | E (sealed); LMB/RMB while disarmed |
| 9 | Every arc sheds water | LMB (Shikai) water arcs |
| 10 | Crushing blows raise waves | LMB 4th (Shikai): the ring wave |
| 11 | The dance pivoting round one wrist | LMB (Shikai), the spin |
| 12 | Crushing the foe between the thrust and the wave | RMB (Shikai): crushing tide; F: Surge |
| 13 | Tidal sweeps and wave walls (anime, via Aaroniero) | R (Shikai) tidal sweep; Q (Shikai) rising wave |
| 14 | Drill butt | merged into LMB 2 (Shikai): the butt bores |
| 15 | "Heart" philosophy | passive (extrapolation): his heart passes to the nearest ally |
| 16 | Noble-grade reiatsu | stats (rei 220) |
| 17 | Water aura in Shikai (puddles slow, soak) | passive: the ring wave and the Surge leave floods (slow, wetT) |
| 18 | Weakness: no Bankai | rule: F in Shikai is the Surge, not a release |
| 19 | Weakness: Zanpakutō destruction / Spirit Body Fusion | rule: the disarmed state (fists); Aaroniero's and the possessed kit's tricks |
| 20 | Weakness: fights fair (won't let others help) | AI quirk: "Leave this one to me" opener |
| 21 | Mt. Koifushi training with Rukia | story (not built) |
| 22 | The night hunt for Metastacia | story; the possessed entry |
| 23 | Rukia's memory fight (Aaroniero) | Aaroniero's kit |
| 24 | Lieutenant outfit | default model |
| 25 | Training outfit (sleeves tied) | skin (not built) |
| 26 | Callouts | release and Shakkahō callouts |
| 27 | Kit-proposal extras: spinning guard, undertow, dance stance, surge | G (Shikai); merged into Q; merged into LMB; F (Shikai) |

## 6. Timelines (60 Hz)
- *Sealed string*: four cuts 22/20/22/30 (`cut` 300-420). *Blink double cut*: 0-8 Shunpo to the target's side, 8-14 cut
  (24), 20-26 cut (24). *Shakkahō*: 30, blast 1.3 m; rapid: three at 18-frame intervals (22 each).
- *Grab & rip*: 0-12 the reach (1.6 m), held 30 frames, the tear at 36 (40, heavy; arm numb 3 s).
- *Counter*: armed 0-42; a blow inside it does nothing and he answers with kn_s3 (30, launch).
- *Fists* (disarmed): jab 14, hook 16, uppercut 22 (launch).
- *Shikai*: the dance 30/28/30/44 with water arcs (8 m, 18); the 4th a 6 m ring wave (30, launch) and a flood (r 4,
  6 s). *Crushing tide*: the pin 0-14 (40), the wave 24 (50). *Rising wave*: 8 m × 3 m wall, 0.8 s (25, lift); at its
  end the undertow pulls enemies within 9 m 3 m toward him. *Spiral*: 20 m (70, bore 260). *Tidal sweep*: five water
  blades in a 70° fan (30 each). *Surge* (60 rei): 0-30 the flood (r 10, 8 s), 30-80 he rides a 14 m wave toward the
  target (60 to what it meets), 80 the crushing thrust (90, heavy).
- *Spinning guard*: up to 3 s; frontal blows ×0.3, enemy shots within 6 m in front rejected.
- *Possessed*: claws 24/24, bite 34 (heals 20); tentacle grab 3 s hook (12/s drain, scrambled steps); volley five
  tendrils 12 m; pounce 10 m (40); the touch: 6 s armed, the blade shatters (disarm 10 s, bosses 3 s).

## 7. VFX / SFX / callouts
Reiatsu teal-blue `#5EC4D6`; water `#3AA6E6` / foam `#E9F8FF`; Nejibana's release glow yellow `#FFE45C`; possessed
aura sickly green `#8FA08A` with orange `#E8762A`. Callouts: 水天逆巻け「捩花」 SUITEN SAKAMAKE, NEJIBANA ·
破道の三十一 赤火砲 HADŌ #31 · SHAKKAHŌ.

## 8. AI profile
A mentor duelist: honest, aggressive, smiling ("Again!"). Sealed fencing with Shunpo and quick Kidō; releases Nejibana
at 70 % (the twirl is the tell); then dance strings, wave walls and the tide; the Surge when the target is hurt and in
front. Disarmed: fists and Kidō. Possessed: erratic lunges and bites, grabs, the touch armed against sword users.

## 9. Story hooks
Mt. Koifushi (sparring with Rukia); the night hunt (rain; he asks to fight alone; the blink cut takes two arms; his
sword shatters on a tentacle; he rips a tentacle off barehanded; the fusion; the possessed attack on Rukia; Rukia's
thrust; dying words).

## 10. Test plan
Probes: the string and the blink cut land; Shakkahō and the rapid three; the grab tears and numbs the arm; the counter
turns a blow; disarmed fists work; the release swaps to the trident; the dance sheds arcs, the 4th raises the ring and
a flood; the tide pins and slams; the wave lifts then the undertow pulls; the spiral bores; the sweep fans out; the
Surge floods, rides and thrusts; the spinning guard rejects shots and cuts frontal blows; the possessed claws, grab,
volley, pounce and the touch. Screenshots: both models (front, ¾, back, face), the release, the dance arcs, the wave,
the Surge, the guard, the possessed grab.

## 11. Engine needs
Existing: `nejibanaMoves.ts` (shared with Aaroniero), `WaveWall`, `Flood`, `Torrent`, `WaterBlade`, `Shakkaho`,
`FusionTendril`, `bladeShatter`, `disarmT`, `armLockT`, `scrambleT`, `rejectNear`. New: `Kit.bareHands()` — while it
returns true the player's and the duel AI's LMB/RMB still reach the kit when disarmed (Kaien keeps fighting with his
fists).

## 12. Open questions
(verify) the Shiba crest's place (left arm or left wrist), the badge's flower, the sheath colour, the possessed
tentacles' number and origin.
