# Sōsuke Aizen - kit spec            (source: docs/roster/B2-captains-2.md § Sōsuke Aizen; tier S)

## 1. Identity
The strongest thing in the war is strapped to a chair at the bottom of the world. Bound, he still tears the sky open
with a seated Kurohitsugi and lets his presence grind whoever comes near to dust; unbound, he draws Kyōka Suigetsu out
of his own hand and lets his enemy fight the wrong man. He never hurries, and he cannot die.

## 2. Loadouts
Aizen is one card with era chips (roster entries sharing `group: 'aizen'`).

| Era (id) | Ladder (F) | Model(s) | Status |
|---|---|---|---|
| **Soul Society → Fake Karakura** (`aizen`) | captain → G: the reveal → F: the Hōgyoku (Chrysalis) | glasses and curtain bangs; slicked back; the white Chrysalis | built |
| **Thousand-Year Blood War** (`aizen-tybw`) — *peak, the card's default* | **chair-bound** → F: **unbound** | the Muken prisoner: a uniform of wide black leather bands with white trim, a grey neckcloth capelet, the band over the right eye; long loose hair; the restraint chair | new |

## 3. Forms (TYBW)
| Form | Release | Power | Movement | Model | Timers / rules |
|---|---|---|---|---|---|
| **Chair-bound** | - (the start) | ×1.1, toughness 20, damage taken ×0.75 | **none**: strapped into the chair (he turns it); Shift: the chair skids a few metres on his reiatsu | seated in the restraint chair (dark iron, pale seal glyphs, straps over arms and legs); bands over both eyes and the mouth until the first key turns (first move) | his reiatsu range capped: every technique reaches 70 % as far |
| **Unbound** | F: the chair bursts apart (canon: Yhwach's blast) — the leather straps fly, Kyōka Suigetsu is drawn out of his palm | ×1.6, toughness 26, damage taken ×0.7 | master Shunpo (appears behind on a double tap) | standing: the banded uniform, the right-eye band, hair loose past the shoulders | - |

**Immortality** (both): his heart cannot be stopped — the first lethal blow leaves him at 1 HP and the Hōgyoku closes
him back up (40 % over 4 s, 4 s untouchable); later lethal blows only knock him down for 3 s at 1 HP, unless the blow
is a seal (none in the roster) — he is beaten when he cannot get up: the third knockdown ends the fight.

## 4. Inputs (TYBW)
| Key | Chair-bound | Unbound |
|---|---|---|
| Shift | the chair skids 4 m | Shunpo; double-tap with a target: appears behind it |
| LMB | **pressure flicks**: a glance — invisible blows of reiatsu at up to 8 m (three, then a heavier fourth) | **Kyōka Suigetsu** string (economical cuts, the palm check, a fast finisher) |
| RMB | **Hadō #90 Kurohitsugi**, seated, at full power: a huge black coffin of stakes round the target | **the passing stroke**: gone past before the wound opens |
| Q | **Hadō #63 Raikōhō** | **Hadō #90 Kurohitsugi** (full power; a bigger coffin) |
| E | **the reiatsu pillar**: a column straight up out of the chair — what stands over him and around him is blasted | **Hadō #99 Goryūtenmetsu**: the ground heaves into slabs, five serpent dragons maul the target |
| R | **Kyōka Suigetsu, from Muken**: the foe's senses taken — it sees him somewhere he is not (a mirror image) | **Substitution**: the foe sees him as its own ally/as a reflection; its next blows go through a decoy while the real Aizen cuts from behind |
| G | **the presence**: an aura that disintegrates — anyone within 5 m takes damage every second and is pushed off (drains reiatsu) | **Bakudō #81 Dankū**: a wall of light that stops shots and beams |
| V | flare: the eyeball tide repelled — every shot within 12 m crushed | **crushing presence**: everyone within 14 m forced to kneel (1.2 s), slowed |
| F | **unbound** | - |
| Passive | immortality; the nape barrier (a blow from behind is stopped once every 8 s) | same + **one finger**: a timed blade stopped dead (a parry when he is idle and faces it) |

## 5. Completeness (TYBW items; inventory 20 → rows 20)
| # | Dossier item | Destination |
|---|---|---|
| 1 | Leather-band prisoner uniform, white trim, grey neckcloth capelet | skin (`tybw` body) |
| 2 | Bands over the face; the left eye and mouth freed, the right eye stays covered | skin (bound: face banded; first move frees mouth/eye) |
| 3 | Seated, strapped into the reiatsu-confining chair | form: chair-bound |
| 4 | Hair long and loose past the shoulders (verify) | skin |
| 5 | The 19 keyholes; Shunsui's three keys | cinematic (the first move turns a key: the face band falls) |
| 6 | Seated self-cast Kurohitsugi that cracks the Shakonmaku | RMB (bound) |
| 7 | The eyeball-creature flood repelled by his aura | V (bound) |
| 8 | The capped reiatsu pillar | E (bound) |
| 9 | The aura that disintegrates Shinigami who come near | G (bound) |
| 10 | Yhwach's blast destroys the chair | F (unbound) |
| 11 | Hadō #99 Goryūtenmetsu (five dragons) | E (unbound) |
| 12 | The blade drawn out of his own hand | F cinematic; sword prop appears from the palm |
| 13 | Substitution: Yhwach sees Aizen as Ichigo | R (unbound) |
| 14 | Hypnotised Yhwach while sealed in Muken | R (bound) |
| 15 | Immortality: survives bisection, the black reiatsu | passive |
| 16 | Kidō master: Kurohitsugi unincanted at full power | Q (unbound) / RMB (bound) |
| 17 | Raikōhō | Q (bound) |
| 18 | Dankū | G (unbound) |
| 19 | One-finger stop | passive (unbound) |
| 20 | Nape barrier | passive |

## 6. Timelines (60 Hz)
- Pressure flicks: 0-8 the glance · 8 an invisible blow at the target (≤ 8 m): 14 dmg (the fourth 30, knock 12) — a
  ripple of air and dust where it lands.
- Kurohitsugi (bound): 0-20 the black box rises round the target (≤ 22 m × 0.7) · 20-60 stakes · 60 it bursts: 120
  dmg; unbound Q: the same, 150 dmg, a bigger box.
- Reiatsu pillar: 0-18 gathering · 18-50 a violet-white column 60 m tall at the chair (r 3.5): 18 dmg/tick to anyone in
  it, everything above carved away.
- Raikōhō: 0-14 · 14 a yellow lightning orb, a blast r 3, 90 dmg.
- Presence (G, bound): toggled, 5 rei/s: anyone within 5 m — 30 dmg/s, pushed out.
- Goryūtenmetsu: 0-30 the hand raised, the ground heaves · 30-90 five dragons in sequence (60 dmg each).
- Substitution: 0-10 · a mirror decoy stands where he was, the real Aizen invisible for 2.5 s, reappearing behind the
  target with a cut (70 dmg); the foe's lock follows the decoy.
- Dankū: 0-8 a wall of light 5 × 3.5 m in front for 2.5 s: rejects shots and beams.
- Crushing presence: 0-10 · 10: everyone within 14 m kneels 1.2 s, slowed 3 s.

## 7. VFX / callouts
Hōgyoku violet `#9B4DFF` / core `#E9E4FF`; Kurohitsugi black `#0B0B0D` with violet rim `#5A2A88`; Goryūtenmetsu dragons
light purple / yellow; leather bands `#121214` (sheen `#2A2A2E`), trim `#E9E9E9`, capelet `#8C8C8E`; the chair dark iron
`#2B2B30` with pale seal glyphs `#D8D2B0`. Callouts: 「破道の九十 黒棺」 *HADŌ #90 — KUROHITSUGI* · 「破道の九十九
五龍転滅」 *HADŌ #99 — GORYŪTENMETSU* · 「破道の六十三 雷吼炮」 *HADŌ #63 — RAIKŌHŌ* · 「縛道の八十一 断空」 *BAKUDŌ #81 —
DANKŪ* · 「鏡花水月」 *KYŌKA SUIGETSU* · 「砕けろ」 *KUDAKERO*.

## 8. AI
Calm, unhurried. Starts bound: flicks and seated Kidō, the presence when the foe closes, the pillar when it hovers above;
unbound at 70 % HP or when the foe stays out of reach for 8 s. Unbound: the passing stroke and Kidō from range,
substitution when the foe presses, Goryūtenmetsu as a finisher below 40 %, Dankū against beams, the crushing presence
when crowded. Never guards with the sword — one finger.

## 9. Test plan
Probe: bound — rooted (no walking), flicks hit at 7 m, Kurohitsugi binds and bursts, pillar damage, presence drains
reiatsu and hurts at 4 m; F frees him (chair props gone, speed back); unbound — Kurohitsugi, Goryūtenmetsu, substitution
decoy + the cut from behind, Dankū rejects a Getsuga, crushing presence slows; immortality survives a lethal blow once.
Screenshots: bound in the chair (front, ¾, face), unbound (front, back, ¾, face), the chair close-up.

## 10. Engine needs
Existing: `BlackCoffin` (Kurohitsugi), `DragonStrike` (dragons), `MirrorDecoy` (illusions), `CeroBeam`-style beam for
Raikōhō, `rooted`, `lure` (the foe's lock follows the decoy), `game.rejectNear`. New: the chair prop and a seated stance;
the bands.

## 11. Open questions
TYBW hair length (verify); the chair's look (not described in canon: estimated); whether the capelet survives the release.
