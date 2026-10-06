# Roster C2 — Lieutenants (2/2)

Design dossiers for **Momo Hinamori**, **Chōjirō Sasakibe**, **Marechiyo Ōmaeda**, **Nanao Ise**, **Nemu Kurotsuchi**, **Yachiru Kusajishi**, **Hanatarō Yamada**, **Isane Kotetsu** and **Tetsuzaemon Iba** (plus their anime-only Zanpakutō spirits, Reigai copies and Nemu's successor Hachigō Nemuri as variants).

Conventions used below
- Heights → voxels at **32 vox/m** (height × 0.32, rounded). Hex colours are *estimates* from the anime look unless the wiki states a colour; anything marked **(verify)** must be checked against reference art before modelling.
- Engine tags use the brief's primitive vocabulary in `[brackets]`. Needs **not** covered by that list are tagged `[NEW: …]` and collected in §11.
- Source tags: *canon* = manga (+ databook / Klub Outside Q&A cited by the wiki); *TYBW anime* = scenes added or expanded by the 2022+ adaptation; *anime-only* = original-anime filler arcs (Bount, Amagai, Zanpakutō Rebellion, Beast Swords, Reigai); *game* = Brave Souls etc. (inspiration only); *extrapolation* = my design proposal where canon is silent (not canon). All text is paraphrased from bleach.fandom.com pages (character pages, /Anime_Continuity subpages, Kidō spell pages, battle pages, Zanpakutō-spirit pages).
- **Canon power scale (1–10):** 10 = Yhwach / final Aizen / final Ichigo · 9 = Yamamoto, Bankai Kenpachi · 8 = top captains · 7 = typical captain · 6 = captain-class lieutenant · 5 = strong lieutenant · 4 = typical lieutenant · 3 = weak lieutenant · 2 = seated officer · 1 = non-combatant.

---

## 0. Quick reference

| Character | Rank (latest) | Height → vox | Badge (left arm) | Zanpakutō / release | Reiatsu colour | Tier |
|---|---|---|---|---|---|---|
| Momo Hinamori | Lt., 5th Div | 151 cm → 48 | 五 + lily of the valley | Tobiume — **"Hajike"** (Snap); no Bankai | red (anime) | **B** (top B) |
| Chōjirō Sasakibe † | Lt., 1st Div | 179 cm → 57 | 一 + chrysanthemum | Gonryōmaru — **"Ugate"** (Pierce) → Bankai **Kōkō Gonryō Rikyū** | not stated (lightning gold) | **B** (Bankai at A quality — shared with Driscoll) |
| Marechiyo Ōmaeda | Lt., 2nd Div / Onmitsukidō Patrol Corps cmdr | 210 cm → 67 | 二 + pasque flower | Gegetsuburi — **"Buttsubuse"** (Crush); no Bankai | pink | **C** |
| Nanao Ise | Co-Lt., 1st Div (ex-8th) | 164 cm → 52 | 八 + strelitzia → 一 + chrysanthemum | none (Kidō) → clan sword **Shinken Hakkyōken** | not stated | **B** |
| Nemu Kurotsuchi † | Lt., 12th Div | 167 cm → 53 | 十二 + thistle | thin katana (unused); body-tech fighter | not stated (Gikon blast gold) | **B** |
| Yachiru Kusajishi | Lt., 11th Div (vanished) | 109 cm → 35 | 十一 + yarrow | Sanpo Kenjū — **no command** | pink (angry cat face) | **B** |
| Hanatarō Yamada | 3rd Seat (ex-7th), 4th Div | 153 cm → 49 | — (seated officer: none) | Hisagomaru — auto Shikai **"Mitase"** (Fulfill) | not stated | **C** |
| Isane Kotetsu | Captain, 4th Div (ex-Lt.) | 187 cm → 60 | 四 + bellflower (Lt. era) | Itegumo — **"Hashire"** (Run) | not stated | **C** (B if a healer class is wanted) |
| Tetsuzaemon Iba | Captain, 7th Div (ex-Lt.) | 182 cm → 58 | 七 + iris (Lt. era) | unnamed — command unknown | not stated | **C** |

---

## 1. Shared group notes (read first)

**Base Shihakushō palette** (everyone unless the dossier overrides): kosode + hakama `#141416` (fold shade `#26262B`), white shitagi showing at collar and cuffs `#F2F1EC`, white hakama-himo `#EFEEE8`, white tabi `#F4F4F0`, straw waraji `#C8A46A` with dark thongs `#4E3B28`. The division insignia is printed *inside* the kosode (not visible).

**Lieutenant armband (fukukanshō)** — canon: lieutenants wear an armband with their division's number and symbol, usually on the **left** arm; compulsory only when summoned to meetings. Model spec (anime look, **verify**): white cloth band `#F2F0EA` ~2 vox tall around the upper arm, holding a rounded-rectangle wooden plaque `#E6D9BD` (edge `#B59A6A`) ≈ 4 × 5 vox. The division kanji (`#151515`) and the flower emblem are **not legible at 32 vox/m → render them as a decal on the plaque** `[NEW: DecalOnVoxel]`. Optional accent = the wiki's division colour.

| Div | Who in this file | Insignia flower | Meaning (wiki) | Wiki division colour |
|---|---|---|---|---|
| 1 | Chōjirō; Nanao (TYBW) | Chrysanthemum | Truth and Innocence | deep purple `#800080` |
| 2 | Ōmaeda | Pasque flower | Seek Nothing | dark orange `#FF8C00` |
| 4 | Isane (Lt. era) | Bellflower | Those Who Grieve Are Loved | puce `#CC8899` |
| 5 | Momo | Lily of the valley | Sacrifice, Danger, Pure Love, Humility, Sweetness | pale turquoise `#AFEEEE` |
| 7 | Iba (Lt. era) | Iris | Courage | dark tan `#918151` |
| 8 | Nanao (pre-TYBW) | Strelitzia (bird of paradise) | Everything is Obtained | raspberry rose `#B3446C` |
| 11 | Yachiru | Yarrow | Fight | lavender `#734F96` |
| 12 | Nemu | Thistle | Vengeance, Strictness, Independence | olive `#808000` |

**Captain haori** (Isane and Iba, 10 years after the war): white haori `#F5F5F2` with the division number (四 / 七) inside the Gotei rhombus on the back; the lining colour is captain-specific and **not documented** for either (pick one).

**Gentei Reiin (limiter seal):** in the Human World captains and lieutenants are capped to ~20% power and their division flower appears as a mark on the body until a *Gentei Kaijo* release is granted. Suggest: Human-World stages apply the cap + a flower decal; release is a story beat, not a kit button.

**Racial baseline (Shinigami):** Shift = **Shunpo** (exceptions: Hanatarō cannot Shunpo; Nemu and Yachiru are written as raw physical speed — see dossiers) · RMB guard / timed parry · C = reiatsu flare in the colours above (proposals where canon is silent) · **Kaidō** (回道, Turn Way) = palms glow green while the healer restores the patient's reiatsu first and then the body — colour `#6FE08A`, core `#D8FFE2` · Tab = Kidō wheel.

### 1.1 Kidō actually used by this group (wiki "Known Practitioners" cross-checked)

| # / class | Spell | What it does + visual (paraphrased from the spell page) | Used by (this file) | Tags |
|---|---|---|---|---|
| Hadō #1 | Shō (衝, Thrust) | Fingertip flick of force that shoves the target back several feet; near-invisible pulse | Isane (anime-only) | [Projectile] knockback |
| Hadō #4 | Byakurai (白雷, Pale Lightning) | Thin, dense pale-lightning bolt from the index finger (or both hands) | Nanao (anime-only) | [Beam] short, piercing |
| Hadō #12 | Fushibi (伏火, Ambush Flare) | Momo-exclusive. Used together with a Kidō net that has already entangled the targets and with fire (Shakkahō / Tobiume) → the whole net goes off in one big explosion | Momo (canon) | [Construct] net → [Blast] chain `[NEW: TrapNetwork/IgnitionPropagation]` |
| Hadō #31 | Shakkahō (赤火砲, Red Fire Cannon) | Crimson fire orb from palm or finger, small/medium/large; explodes or becomes a fire pillar; concussion + burn; also usable as a lamp | Momo (canon); Nanao, Isane (anime-only); Reigai-Nanao/Isane | [Projectile] orb, [Blast], [Status] burn |
| Hadō #58 | Tenran (闐嵐, Vigorous Tempest) | Spin the sheathed sword like a fan (or use a hand) → widening tornado blast | Nanao (anime-only); Reigai-Isane | [Projectile] cone/tornado, [GroundWave] |
| Bakudō #4 | Hainawa (這縄, Crawling Rope) | Crackling yellow rope thrown to wrap arms and body | Nanao (anime-only); Reigai-Momo | [Bind] |
| Bakudō #9 | Hōrin (崩輪, Disintegrating Circle) | Orange tendril with yellow spirals from two fingers; caster keeps hold of the end and steers it before/after capture; two captured tendrils can be tied together | Momo (anime-only) | [Bind], [Grab/Throw] `[NEW: SteerableTether]` |
| Bakudō #21 | Sekienton (赤煙遁, Red Smoke Escape) | Palms slapped on the ground → red smoke bursts out and swallows the area for a quick getaway | Ōmaeda (canon) | [Field] smoke, [Sensing/Stealth] |
| Bakudō #26 | Kyokkō (曲光, Bent Light) | Momo-exclusive. Bends light to hide the caster's body **and reiatsu**; can also mask the reiryoku of a trap being laid | Momo (canon) | [Sensing/Stealth] `[NEW: TrapConcealment]` |
| Bakudō #37 | Tsuriboshi (吊星, Suspending Star) | Blue energy ball fires six ropes that latch onto sturdy objects; its centre flattens into an elastic cushion that catches falling things | Momo (canon + anime) | [Construct] `[NEW: ElasticConstruct]` |
| Bakudō #39 | Enkōsen (円閘扇, Round Lock Fan) | Dull-yellow spinning disk of condensed reiatsu raised in front (hands or sword) to block | Momo (anime-only) | [Shield] |
| Bakudō #58 | Kakushitsuijaku (摑趾追雀, Footprint-Attentive Pursuing Sparrows) | Draw a circle with symbols in four quadrants in black powder, palms down → it glows blue and numbers cycle until the target's coordinates (latitude/longitude) lock | Isane (canon) | [Sensing] map reveal |
| Bakudō #62 | Hyapporankan (百歩欄干, Hundred-Step Balustrade) | Blue-white rod thrown that multiplies into ~100 rods raining down to pin the target to a surface (or launched from around the body) | Nanao (anime-only) | [Bind], [Projectile] multishot |
| Bakudō #77 | Tenteikūra (天挺空羅, Heavenly Rickshaw in Silken Air) | Markings drawn on arms/ground in black powder or blood; a glowing rectangle plus root-like threads form a network; voice is sent mentally to everyone in a chosen area (only to those who know the caster's reiatsu; skilled sensors notice the disturbance) | Isane (canon) | [Sensing] `[NEW: TeamBroadcast]` |
| unnumbered | Hakufuku (白伏, White Crawl) | Target sees purple cherry blossoms falling, sight blurs, mind muddles, then they black out and wake with a hazy memory | Momo (canon per wiki — scene not in my sources) | [Status] confusion → sleep `[NEW: MemoryWipe]` |
| unnumbered | Hakudan Keppeki (白断結壁, White Severing Boundary Wall) | Nanao's own spell: a wall bearing the Kidō Corps emblem around the kanji 一; built from traces of Quincy reiatsu, it completely bars **Quincy power** for a limited time | Nanao (canon) | [Construct], [Shield] `[NEW: FactionKeyedBarrier]` |
| — | Kaidō (回道) | Green-palm healing (see above) | Momo, Nanao, Hanatarō, Isane | [Heal/Reject] |

**Generic spells proposed for Tab wheels where a character is called "Kidō expert" but canon never names their spells** (*extrapolation*; visuals on the wiki spell pages): Sai (B#1), Seki (B#8), Geki (B#9), Byakurai (H#4), Tsuzuri Raiden (H#11), Shitotsu Sansen (B#30), Ōkasen (H#32), Sōkatsui (H#33), Rikujōkōrō (B#61), Sajō Sabaku (B#63), Raikōhō (H#63), Tōzanshō (B#73), Gochūtekkan (B#75), Kuyō Shibari (B#79), Dankū (B#81).

---

## 2. Momo Hinamori (雛森 桃) — Lieutenant, 5th Division

- **Wiki:** https://bleach.fandom.com/wiki/Momo_Hinamori · /Anime_Continuity · spells: Fushibi, Kyokkō, Tsuriboshi, Shakkahō, Hakufuku, Hōrin, Enkōsen · battles: *Rangiku Matsumoto and Momo Hinamori vs. Emilou Apacci, Franceska Mila Rose, and Cyan Sung-Sun*; *Rangiku Matsumoto & Momo Hinamori vs. Haineko & Tobiume*; *The Gotei 13 & The Visored vs. Gerard Valkyrie*; Tobiume (Zanpakutō spirit)
- **Roster tier:** **B — top of this file.** She is the game's natural *Kidō-trap / fire caster* (pre-laid nets, concealment, chain detonations). Promote to **A** if the roster wants a dedicated caster archetype.
- **Canon power:** **4/10** — her own judgement is that her swordplay can't beat the Tres Bestias; but she laid a single huge, intricate Fushibi net that caught all three Fracción and blew them up (Rangiku had never seen one that big), her fireballs are rated close to a Fracción's Cero, and Hitsugaya calls her a Kidō master. One punch from Ayon broke her.
- **Body:** 151 cm → **48 vox**; 39 kg. Petite and slim, narrow shoulders, big round eyes, youthful face (head ≈ 1/6.3 of height). Silhouette keys: **round bun at the back of the head wrapped in a cloth and tied**, two long front locks framing the face, armband on the left arm, a katana that looks long on her (left hip).
- **Palette (hex estimates):**
  - Skin `#F6DCC9` (shade `#E2BBA5`) · hair near-black brown `#221A1A` (sheen `#3B2B27`) · eyes brown `#6A3F2A`
  - Bun cloth off-white `#EEE9DF`, tie `#D6CDBE` (cloth colour not in the wiki — **verify**)
  - Shihakushō = base palette · armband 五 + lily-of-the-valley decal, accent `#AFEEEE`
  - Tobiume sealed: hilt wrap light red `#E0646B` (under-wrap `#EDE6DA`), rectangular tsuba brass `#C9A24A` with stamped five-petal plum blossoms, blade `#D5D9DE`, scabbard not described → dark lacquer `#2A1C1E` (**verify**)
  - Tobiume Shikai: straight double-edged blade `#DDE2E7`, prongs same steel; release spark `#FF7A45`
  - Fireball: core `#FFF3B0` → body `#FFB33E` → rim `#FF5A1F`; smoke `#3A3434`; scorch decal `#2A2222`
  - Reiatsu **red** `#E53935` (wiki trivia: red in the anime)
  - Kidō: Shakkahō crimson `#D3242C` · Fushibi threads (colour unstated) hot-orange filament `#FF8A50` when live, nearly invisible under Kyokkō · Tsuriboshi blue `#4FA8FF`, ropes `#8CC8FF` · Kyokkō = refraction shimmer only · Hakufuku petals purple `#9B6BD0` · anime: Hōrin orange `#FF8C1A` with yellow spiral `#FFE14D`, Enkōsen dull yellow `#C9B35A`
- **Look by form/outfit:**
  - **Shin'ō Academy:** girls' red-and-white student uniform (white top `#F4F2EE`, red hakama `#B3262E`), hair in two pigtails tied low at the nape.
  - **Lieutenant, Soul Society → Fake Karakura (default model):** cloth-wrapped bun, front locks, armband, Tobiume at left hip. Hospital variant: plain pale kimono `#EFECE6` as pyjamas, hair in a loose ponytail, chest bandage.
  - **17 months after Aizen's defeat (Lost Agent → TYBW):** hair let down into a chin-length bob with a clip on the left side (clip colour not given).
  - **10 years after Yhwach:** hair tied up again but with **no cloth**, chin-length locks on both sides, medium bangs parted to her left.
  - **Anime-only:** Reigai-Hinamori — identical copy used to confuse Hitsugaya (enemy variant).
- **Weapons:**
  - **Tobiume (飛梅, Flying Plum Tree), sealed:** ordinary katana (~100 cm → 32 vox, ≈⅔ of her height), light-red hilt, rectangular tsuba stamped with five-petal flowers. Fire-type.
  - **Shikai:** blade straightens and becomes double-edged; short jutte-like hooked prongs grow out of it at intervals (seven-branched-sword silhouette). Prongs: 2 in the early manga, 3 after Aizen's defeat; the anime always shows 3. Model 3 prongs ≈4 vox long angled toward the tip, alternating edges (exact placement varies — **verify**).
- **Forms & states (ordered):**
  1. **Sealed** — caster with a katana.
  2. **Shikai** — *"Hajike, Tobiume"* (弾け, Snap) — fireballs from the blade. (Anime once shows it already released as she draws, no command.)
  3. **Bankai** — not achieved.
  - States: **Kyokkō** concealment · full-incantation vs. incantation-less casting · **rage** when her captain falls.
- **Abilities (complete):**
  - *Racial / base*
    - `Shunpo (瞬歩, Flash Step)` — lieutenant grade (anime: keeps pace with lieutenant-level fighters). [Mobility, Teleport]
    - `Zanjutsu` — lieutenant level; duelled Kira and attacked Hitsugaya, but avoids melee against stronger foes. [MeleeArc(cut)]
    - `Kidō mastery` — alters common spells so they behave unpredictably and fuses spells with each other and with Tobiume; anime adds hitting **two targets with one cast**. [passive] `[NEW: SpellCombo]`
    - `Presence masking / barrier breaking` — shadowed Hitsugaya while hiding her presence; broke the cell barrier he set around her from the inside. [Sensing/Stealth]
    - `Kaidō` — "some skill": patched up Shinji, Ōmaeda and Renji in TYBW. [Heal/Reject (HP)]
  - *Kidō — canon*
    - `Hadō #31 Shakkahō (赤火砲, Red Fire Cannon)` — crimson orb, three sizes, explosion or fire pillar. At the academy she was the only student to fire it at the giant Hollow (manga). Scale: blows chunks off buildings. [Projectile(orb, explode), Blast, Status(burn)]
    - `Hadō #12 Fushibi (伏火, Ambush Flare)` — **her signature, exclusive spell and the canon form of "delayed/chained Kidō":** she strung a large, intricate Kidō net all around Rangiku *before* the Arrancar closed in, hid it, caught all three Fracción in it, then lit it with Tobiume → one massive explosion that forced them into Resurrección to heal. [Construct(net trap), Bind(snare), Blast(chain)] `[NEW: TrapNetwork/IgnitionPropagation]`
    - `Bakudō #26 Kyokkō (曲光, Bent Light)` — **exclusive**: bends light to hide her body and reiatsu and masks the reiryoku of a trap being laid. Her plot only says she used "Kidō to conceal her presence" to sneak up on Apacci; Kyokkō is the one concealment spell the wiki credits to her, so that's almost certainly it. [Sensing/Stealth] `[NEW: TrapConcealment]`
    - `Bakudō #37 Tsuriboshi (吊星, Suspending Star)` — six-rope blue cushion; caught a falling Rangiku ("star-shaped Kidō net"). [Construct] `[NEW: ElasticConstruct]`
    - `Hakufuku (白伏, White Crawl)` — purple-blossom illusion → blur → blackout with fuzzy memory (wiki credits Momo and Gin). [Status(confusion→sleep)] `[NEW: MemoryWipe]`
  - *Kidō — anime-only / TYBW anime*
    - `Bakudō #9 Hōrin` — two tendrils, one on Haineko and one on Tobiume's spirit; she swung her arms and smashed them into each other in mid-air. [Bind, Grab/Throw] `[NEW: SteerableTether]`
    - `Bakudō #39 Enkōsen` — spinning shield that covered her, Rangiku and Ichigo from Senbonzakura's Bankai. [Shield]
    - `Tsuriboshi slingshot` — bounced Tobiume's spirit into Haineko. `Tsuriboshi launch pad` (*TYBW anime*, absent from her manga plot) — a Tsuriboshi under herself and Shinji with a fireball under it; the blast catapulted them up to Gerard's eye level. [Construct + Blast impulse]
    - `Shakkahō ×3` — three quick shots at Ashisogi Jizō. [Projectile multishot]
    - `Joint reiatsu seal` — helped close Muramasa's giant Garganta with allies' combined reiatsu. [Construct]
    - `Hainawa (#4)` — appears in the Reigai-Hinamori episode; the wiki credits it to the Reigai copy.
  - *Tobiume Shikai*
    - `Fireball` — explodes on impact; launch sounds like a **seagull's cry**; power compared to a Fracción's Cero (knocked Apacci off Rangiku). [Projectile(orb, explode), Status(burn)]
    - `Multi-fireball` — by TYBW she fires several at once (cleared the Soldat off Ōmaeda). [Projectile multishot]
    - `Net ignition` — Tobiume fire fed into a Fushibi net. [Blast chain]
    - `Weak-point lob` (*TYBW anime*) — threw a large fireball straight into the giant Gerard's open mouth. [Projectile(precision)]
- **Passives & weaknesses:**
  - + *Kidō Expert*: incantation-less casting up to mid level; spells can be fused with each other and with Tobiume.
  - − Fragile up close (Ayon "broke all her bones" with one punch); low poise.
  - − Emotional hooks: devotion to Aizen made her a manipulation target; when her captain falls she charges recklessly (Bambietta — Komamura had to shield her).
  - − Kidō is a surprise weapon (strongest when unseen); vulnerable to poison (anime: Ashisogi Jizō).
- **Signature moments to recreate:**
  1. Academy field exercise — giant Hollow ambush; Momo's Shakkahō (tutorial).
  2. Soul Society — attacks Gin over Aizen's "death", Kira blocks, *"Hajike, Tobiume"* lieutenant duel, Hitsugaya stops both.
  3. With Aizen's forged letter she turns on Hitsugaya; later breaks out of his barrier cell from inside; Central 46 reunion → Aizen stabs her (cutscene).
  4. Fake Karakura — hidden fireball saves Rangiku from Apacci → reveal → Fushibi net detonation on the Tres Bestias → Tsuriboshi catches Rangiku → Ayon one-punch (scripted loss) → later "stabbed by Hitsugaya" through Kyōka Suigetsu (cutscene).
  5. TYBW — charges Bambietta (Komamura shields her); fireball volley rescue of Ōmaeda from Soldat; heals Shinji; vs Gerard: Tsuriboshi launch + fireball into his mouth (*TYBW anime*), then hiding in a building while the giant searches for her.
  6. *Anime-only:* Momo & Rangiku vs Tobiume & Haineko (Hōrin double-bind); Enkōsen vs Senbonzakura; the two Hinamoris in front of Hitsugaya.
- **Kit proposal:**
  - **Sealed (caster):**
    - Shift: Shunpo; while Kyokkō is active it leaves no afterimage or sound.
    - LMB: fast 4-hit textbook katana chain; forward = thrust lunge, back = rising-cut launcher, air = 3 cuts, down-air = falling stab, sprint = dash cut.
    - Hold LMB: slash into a point-blank palm Shakkahō.
    - **Q `Shakkahō`** — tap: incantation-less small orb; hold: full incantation → large orb or fire pillar; up to 3 rapid casts.
    - **E `Fushibi`** — paint a net between anchor points (walls, ground, props; up to 3 nets, ~10 m spans). Enemies touching it are snared; **any fire** (hers, an ally's, even an enemy's) ignites all connected strands → chain of cutting explosions that slice voxel lines along the strands.
    - **R `Tsuriboshi`** — tap: cushion at the reticle (catches falls, zero fall damage, bounce); hold: slingshot whatever is on it; with a Shakkahō under it = super-launch.
    - **F `Kyokkō`** — cloak body + reiatsu + her nets; breaks on her next attack (ambush crit).
    - **Z `Hakufuku`** — short-range hex: blur/confusion → sleep; wipes the target's lock-on and markers.
    - **X `Kaidō`** — channelled heal (HP only).
    - **G `Spell-weave`** (*extrapolation*) — queue up to 3 spells silently and release them together; while on, binds split onto two targets (anime "two targets, one cast").
    - **C:** red flare (lieutenant-sized dust ring; mobs flinch).
    - **V `Kidō-Net Inferno`** (game name; Brave Souls' *Hidden Fire* is the same idea) — throws a concealed Fushibi web over ~25 m and lights it with a Shakkahō salvo → rolling chain detonation.
    - **Tab:** canon — Shakkahō, Fushibi, Kyokkō, Tsuriboshi, Hakufuku, Kaidō · anime — Hōrin, Enkōsen · *extrapolated library* — Sai, Geki, Byakurai, Sōkatsui, Shitotsu Sansen, Rikujōkōrō, **Sajō Sabaku, Gochūtekkan** (requested for her, but **not attested** for Momo on the wiki: their listed users are Hachigen, Urahara, Hisagi, etc.), Tōzanshō · game-only — Kurohitsugi (3rd Phantom lets her cast it).
  - **Shikai (Tobiume):**
    - T: *"Hajike, Tobiume!"* — blade straightens, prongs pop out in a spark burst; hold T = seal.
    - LMB: same chain; the finisher flicks a small fireball off the prongs. Timed RMB parry catches the enemy blade in a prong → short disarm window (*extrapolation from the jutte shape*).
    - Hold LMB: overhead slash that launches a large fireball.
    - **Q `Fireball`** — tap single / hold charged large one (seagull-cry SFX).
    - **E `Volley`** — 3–5 fireballs fanned (TYBW).
    - **R `Ignite`** — fireballs home onto every Fushibi net she has placed.
    - **F `Tsuriboshi Launch`** (*TYBW anime*) — instant cushion + fireball under it = super-jump, can carry an ally.
    - **Z `Weak-point Lob`** — slow arcing fireball, crits on mouths/eyes/cores.
    - X `Kaidō` · G `Spell-weave` · V `Kidō-Net Inferno` (lit by a Tobiume volley).
  - **Optional anime-only summon — Tobiume's spirit** (Zanpakutō Rebellion / Beast Swords): petite girl, brown eyes, long brown hair held by cylindrical clips into two long front locks plus a clip of three yellow-pink circles with a yellow tree-shaped charm above the left lock; white kimono with pink hem, long yellow sash, long light-purple skirt; a long pink ribbon with a large bell on each end looped around her upper body; brown sandals over white socks; red reiatsu. Fires seagull-crying fireballs from the bells in rapid succession and throws the bells hard enough to crater walls. [Summon, Projectile]
- **AI notes:** Opens hidden (Kyokkō), lays Fushibi on chokepoints and around allies, starts with a stealth fireball and releases Shikai immediately; stays at mid range and Shunpo-retreats when rushed; top priority is catching falling allies with Tsuriboshi; heals her captain between waves. **Rage phase** if her captain drops (volley spam, guard down — tell: shouts his name). Story boss vs Hitsugaya: hesitates before each lunge. Reigai-Hinamori: same kit + Hainawa, impersonates the real one.
- **Callouts:** "Hajike, Tobiume!" · "Hadō no sanjūichi — Shakkahō!" · "Hadō no jūni — Fushibi!" · "Bakudō no nijūroku — Kyokkō" · "Bakudō no sanjūnana — Tsuriboshi!" · (anime) "Bakudō no kyū — Hōrin!" · (anime) "Bakudō no sanjūkyū — Enkōsen!" · "Shirō-chan!" · "Hirako-taichō!"

---

## 3. Chōjirō Sasakibe (雀部 長次郎 忠息) — Lieutenant, 1st Division (†)

- **Wiki:** https://bleach.fandom.com/wiki/Ch%C5%8Djir%C5%8D_Sasakibe · Gonryōmaru (Zanpakutō spirit) · *Genryūsai Shigekuni Yamamoto vs. Driscoll Berci* · Driscoll Berci · Genryūsai Shigekuni Yamamoto (scar history)
- **Roster tier:** **B**, but build the Bankai at **A quality**: the exact same Bankai kit is Driscoll Berci's stolen weapon (reuse with a purple palette at reduced power), so it is built once and used twice.
- **Canon power:** **6/10 sealed/Shikai, 7/10 Bankai** — captain-class reiryoku known to the old guard; fought alongside the first (strongest) Gotei 13 and ran the young Yhwach through from behind; reached Bankai before Kyōraku and Ukitake and used it to scar young Yamamoto; never released it in battle for 2,000 years, then had it stolen and died in a 182-second raid.
- **Body:** 179 cm → **57 vox**; 66 kg. Lean, ramrod-straight "English butler" posture, hands often behind his back. Silhouette keys: **white sleeveless jinbaori** (self-made, Western-looking) over the black shihakushō, **long white arm guards**, **white turtleneck** collar at the throat, **small black handlebar moustache** under neat silver-gray hair, armband on the left arm, **pupil-less eyes**.
- **Palette (hex estimates):**
  - Skin light tan `#CFA07C` (shade `#B5865F`) · hair silver-gray `#B8BBBF` (light `#DADDE0`) · moustache `#17171A` · eyes pupil-less flat pale `#ECEBE6` ringed `#3A3A3A` (the original anime drew pupils: dark gray `#4A4A4A`)
  - Jinbaori `#F3F2EE` (shade `#D9D7D0`) · arm guards `#EFEEE9` · turtleneck `#F5F5F2` · armband 一 + chrysanthemum, accent `#800080`
  - Gonryōmaru sealed: handle yellowish-green `#A9B545`, double-fan guard (colour unstated) brass `#C6A44C`, blade `#D7DBE0` · Shikai rapier blade `#E4E7EB`, guard (style unstated) brass swept hilt `#C6A44C` (**verify**)
  - Bankai lightning: core `#FFFFF2` → gold `#FFD84A` → amber glow `#FFB300`; sky pillar halo `#FFF6C8` · storm clouds `#2B2D38` / `#41444F` · rain `#9AA4B3`
  - Reiatsu: **not stated** → pale gold `#F5E07A` (proposal)
  - **Stolen-Bankai palette (Driscoll):** purple bolts `#9B6BFF` / `#CFB4FF` (wiki: "purple electric shocks"); the anime-only Gonryōmaru spirit also uses purple lightning.
- **Look by form/outfit:**
  - **Present (Soul Society → TYBW):** as above.
  - **~110 years ago:** same, without the moustache.
  - **Youth (~2,000 years ago, visiting Yamamoto's school):** short light-coloured hair, short eyebrows, standard uniform with a white robe over it tied at the front with a simple knot. Use for the "young Bankai vs young Yamamoto" flashback.
  - **1,000 years ago (first Quincy war):** not described in my sources → reuse the youth model without moustache.
  - **Bankai:** outfit unchanged; storm overhead; sword stays the Shikai rapier.
- **Weapons:**
  - **Gonryōmaru (厳霊丸, Stern Spirit; Viz: Solemn Spirit), sealed:** average katana with an ornate **double-fanned guard** and a yellow-green handle (~100 cm → 32 vox).
  - **Shikai — "Ugate, Gonryōmaru"** (穿て, Pierce; Viz: Bite): becomes a **rapier** — long, slender, thrust-oriented (est. 105 cm → 34 vox, blade ≤2 vox wide). Strong enough to impale the young Yhwach.
  - **Bankai:** the blade keeps its Shikai shape for the whole Bankai.
- **Forms & states (ordered):**
  1. **Sealed** — fencer-style katana.
  2. **Shikai** — rapier thrust specialist.
  3. **Bankai — "Kōkō Gonryō Rikyū"** (黄煌厳霊離宮, Yellow-Glittering Royal Villa of the Stern Spirit; Viz: Golden Lightning Palace) — storm + lightning palace.
  - State: **reiatsu suppression / feigned death**.
  - Event state: **Bankai stolen** (Wandenreich Medallion) → Bankai removed for the rest of the match `[NEW: BankaiTransfer]`.
- **Abilities (complete):**
  - *Base*
    - `Captain-class reiryoku` — stayed a lieutenant by choice (vowed to serve while Yamamoto lived; declined acting-captain posts).
    - `Reiatsu suppression` — damped his reiatsu so completely that he lay among the corpses under Yhwach's feet unnoticed, then stabbed him from behind, opening the shot for Yamamoto's Bankai. [Sensing/Stealth, Teleport(backstab)] `[NEW: ReiatsuSignature]`
    - `Shunpo` — appeared behind Shinji when the Visored breached the barrier. [Mobility, Teleport]
    - `Kidō: barrier operator` — opens and closes very large, powerful barriers (the Fake Karakura Town dome; let the Visored in). [Construct(barrier), Shield] `[NEW: BarrierGate]`
    - `Fencing speed` — of the three lieutenants who chased Renji, he alone reacted to Ichigo fast enough to counterattack (then got punched in the jaw).
  - *Shikai*
    - `Pierce` — thrust/impale specialist. [MeleeArc(cut, thrust) → narrow tunnel carve]
  - *Bankai*
    - `Release` — raises the blade: dark clouds gather, a bolt leaves the tip, climbs and spreads into a **dome of lightning far overhead**, anchored to the ground by **many lightning pillars**, with **one more pillar from the dome's top into the sky**. [Transform, Construct(arena dome), Environmental(weather)] `[NEW: SkyAnchoredArenaStructure]`
    - `Weather control` — thunderstorms; compared to Hyōrinmaru's weather control (Hisagi had never heard of another weather Zanpakutō). [Environmental(weather), Field] `[NEW: WeatherSystem]`
    - `Gesture-directed lightning` — blade gestures call bolts down from the sky onto targets. As used by Driscoll (weaker, untrained): a big energy disc overhead pouring columns of lightning, single huge bolts, and a sustained, intensifying barrage that only singed Yamamoto — who said it was never this weak in Chōjirō's hands. [Beam(vertical bolt), Blast, Status(paralysis — game choice)]
    - `Lightning Infusion` (unnamed) — run the blade along a lightning pillar to load it with immense lightning, then strike. 2,000 years ago it carved the second scar across Yamamoto's forehead scar (his nickname changed from "Eijisai" to "Jūjisai", the cross). [Stance(charged), MeleeArc(smash), Slice] `[NEW: ChargeFromEnvironmentObject]`
    - Canon scale: arena-sized storm; the dome hangs "far above" (scale not given — suggest 60–100 m radius, pillars every ~15 m).
  - *Anime-only (Zanpakutō Rebellion / Beast Swords) — Gonryōmaru's spirit* (he left Chōjirō for "having no presence in his own division"): man with all-black eyes and long dark hair in two face-framing bangs, white cloth round the forehead, white baggy-sleeved robe under a dark-blue vest that also covers the legs, closed by dozens of large tan beads looping over the shoulders to two gray discs (each trailing a string of small white beads and a yellow lightning-bolt spike toward the shoulder), white side pockets, gray elbow gloves and knee boots, a **shrine-shaped box on his back**; carries a **white pike** with a paper-wrapped grip. Powers: purple lightning — rings of lightning that pen foes in, bolts from the pike, a powerful electric sphere made by striking with two bolts at once, electrified pike blows; *Storm Generation*: holds the crackling pike forward, two fingers raised, the shrine roof breaks open and releases storm clouds that bombard foes on command; stronger in rain. Fought Rukia, Suì-Fēng (with Tenken) and Kenpachi. [Summon, Field(weather), Bind(lightning ring)]
  - *Flavour / comedy* — Anglophile: brews his own black tea (once blew up a tower by switching on a boiling machine), eats only Western food, made his own jinbaori to look Western; still represents the Tea Ceremony Club.
- **Passives & weaknesses:**
  - + Almost no sensing signature; precision thrusts (crit on pierce).
  - − Bankai can be stolen — its first real battle use *was* stolen; − duty-bound: rarely leaves the commander's side; − overwhelmed by Driscoll's Overkill (106 of his division died in the same raid).
- **Signature moments to recreate:**
  1. **Youth flashback:** visits Yamamoto ("Eijisai-dono"), refuses to be his student ("a right hand covers what you cannot"), challenges him with a newborn Bankai — set piece: land one Lightning-Infused strike to carve the cross scar.
  2. **1,000 years ago:** lie among the dead with suppressed reiatsu, stab Yhwach from behind → cue Yamamoto's Bankai (stealth set piece).
  3. **Soul Society:** chasing Renji with Ōmaeda and Isane; "Ugate, Gonryōmaru" vs Ichigo; only one to react; KO punch (scripted loss).
  4. **Fake Karakura:** guarding / opening the barrier for the Visored; warning the wounded before the towns are swapped back.
  5. **TYBW — Driscoll's raid on the 1st Division (182 s):** first battle Bankai → **stolen mid-fight** (player loses the form) → a giant Heilig Pfeil pins him to the wall of Yamamoto's office; dying warning; funeral pyre.
  6. **Boss reuse:** Yamamoto vs Driscoll wielding Kōkō Gonryō Rikyū.
  7. *Anime-only:* Gonryōmaru's spirit (with Tenken) vs Suì-Fēng in the rain; vs Kenpachi.
- **Kit proposal:**
  - **Sealed:**
    - Shift: silent Shunpo (no flash while G is on). LMB: fencing-style katana chain (cut-cut-thrust-thrust); forward = lunge, back = riposte launcher, air = plunging thrust, down-air = stab-slam, sprint = flèche. Hold LMB: pinning thrust (impales a target to a wall/floor briefly).
    - **Q `Lunge`** · **E `Riposte`** (timed counter-thrust) · **R `Barrier Gate`** — raise a large dome barrier, or cut a doorway in any barrier (enemy or ally) · **F `Silent Step`** — from suppression, teleport behind the lock-on target · **Z `Feign Death`** — drop motionless; enemy AI stops targeting him; rising strike crits · **X `Tea Time`** — sip black tea for a small heal (5% chance the kettle explodes — canon gag) · **G `Reiatsu Suppression`** toggle — no aura, invisible to sensing/minimap, cannot flare · **C:** gold flare · **V `Thousand-Year Thrust`** (*extrapolated name*; canon basis = the Yhwach stab) — from suppression, an unblockable impaling lunge · **Tab:** barrier spells (generic Dankū / Tōzanshō — *extrapolation*).
  - **Shikai (rapier):** T *"Ugate, Gonryōmaru!"*. LMB: rapid lunge chain; forward = long lunge that pins to walls, back = parry-riposte launcher, air = plunging thrust, sprint = flèche dash. Hold LMB: charged thrust that **bores a ~0.5 m tunnel** through a wall. Q `Pierce` (lance line through several targets) · E `Riposte` · R `Barrier Gate` · F `Silent Step` · Z `Feign Death` · X `Tea Time` · G suppression · V `Thousand-Year Thrust`.
  - **Bankai (T from Shikai):** *"Bankai — Kōkō Gonryō Rikyū!"* — cinematic: clouds → bolt from the tip → dome + pillars; the arena darkens under thunderclouds (rain is optional — canon only shows rain with the anime spirit). Field passive: pillars ring the fight (touch = heavy shock; where they meet terrain they bore vertical shafts).
    - LMB: rapier chain; every hit arcs to the nearest extra enemy (chain lightning — game choice).
    - **Q `Command Bolt`** — flick at the reticle → bolt from the dome (small crater, stun); hold Q to paint up to 6 marks, release for a timed sequence.
    - **E `Barrage`** — 3 s of intensifying columns on a zone (Driscoll's usage).
    - **R `Lightning Infusion`** — Shunpo to the nearest pillar, drag the blade along it; next attack becomes a massive thunder strike.
    - **F `Pillar Fence`** (*extrapolation*) — re-anchor 3–5 pillars into a wall or cage line.
    - **Z `Arc Flèche`** — bolt-riding lunge through several targets and walls.
    - **X `Downpour`** (*extrapolation*) — intensify the storm: soaked enemies take extra lightning damage.
    - **G `Conductor View`** — hold for a top-down camera and paint strikes with the mouse (the "gestures direct the bolts" fantasy). `[NEW: TopDownTargetPainting]`
    - **C:** thunderclap flare (screen flash, ground scorch ring).
    - **V `Cross Scar`** (*extrapolated name*; canon basis = the infusion slash that crossed Yamamoto's scar) — drain every pillar and the dome into the rapier, then two crossing slashes: cross-shaped Slice + explosion; Bankai ends.
    - **Theft hook:** if hit by a Bankai-theft effect, the Bankai leaves his kit and becomes the thief's (Driscoll: ~60–70% damage, purple bolts, no Lightning Infusion).
- **AI notes:** Stands motionless behind the Captain-Commander with zero aura (tell: he *disappears from sensors* right before he strikes). Fights in Shikai with precise thrusts and parries; protects the boss before chasing kills; Bankai only as a last stand or when the commander is threatened. Driscoll variant: brash Barrage spam, never infuses.
- **Callouts:** "Ugate, Gonryōmaru!" · "Bankai — Kōkō Gonryō Rikyū!" · "Eijisai-dono" (youth flashback).

---

## 4. Marechiyo Ōmaeda (大前田 希千代) — Lieutenant, 2nd Division · Corps Commander, Onmitsukidō Patrol Corps

- **Full name:** Ōmaeda Nikkōtarōemon Yoshiayamenosuke Marechiyo (大前田 日光田郎右衛門 美菖蒲介 希千代).
- **Wiki:** https://bleach.fandom.com/wiki/Marechiyo_%C5%8Cmaeda · /Anime_Continuity · Gegetsuburi (Zanpakutō spirit) · battles: *Marechiyo Ōmaeda vs. Nirgge Parduoc*; *Suì-Fēng & Marechiyo Ōmaeda vs. Baraggan Louisenbairn*; *Suì-Fēng vs. BG9*; *Ichigo Kurosaki vs. Gegetsuburi* (anime)
- **Roster tier:** **C** — comic support NPC; a cheap playable once chain/flail physics exist (bump to B if flail tech is built for other characters anyway).
- **Canon power:** **3/10** — held even with lieutenant-grade Arrancar Nirgge and outwitted him twice; his Shikai cracks against a Fracción and shattered from one Ichigo punch; strong enough to brace Suì-Fēng through Jakuhō Raikōben's recoil.
- **Body:** 210 cm → **67 vox**; 151 kg (almost twice Suì-Fēng's height and over four times her weight). Huge round torso and belly, thick arms and neck, heavy jaw, small eyes. Silhouette keys: **big puffy purple collar**, gold jewellery, a bag of rice crackers, the spiked ball.
- **Palette (hex estimates):**
  - Skin `#E0B38D` (**verify**) · hair black `#121212` (cut not described in the wiki — short, combed back: **verify**) · eyes `#2A2A2A`
  - Purple collar `#6A3FA0` (shade `#4E2C7A`) · gold jewellery `#E2B23C` (glint `#FFE58A`) · armband 二 + pasque flower, accent `#FF8C00`
  - Gegetsuburi sealed: handle bright yellow `#F2C230`, octagonal brass guard `#B58B3A` with two square notches, blade `#D5D9DE`
  - Shikai: ball gunmetal `#4B4D54`; long spikes silver `#C8CCD2` (or short ball-coloured spikes, FKT look); chain `#8E9198`
  - Reiatsu **pink** `#FF7FB6` (canon) · Sekienton smoke `#C8352B` → `#E06A5E`
- **Look by form/outfit:** standard shihakushō + purple collar + self-made gold rings and bracelets (he crafts gold and owns a jewellery factory). Family lookalikes (father, mother, elder sister, younger brother — all built like him; youngest sister Mareyo is small and "normal"). *Anime-only:* his Zanpakutō spirit and his Reigai (see abilities).
- **Weapons:**
  - **Gegetsuburi (五形頭, Five-Formed Head; Viz: Five Heads), sealed:** normal katana (~100 cm → 32 vox — toy-sized in his hand), bright yellow handle, brass octagonal guard with two square notches; carried through his waist tie.
  - **Shikai — "Buttsubuse, Gegetsuburi"** (打っ潰せ, Crush; Viz: Smash 'Em): an oversized **spiked ball on a long chain anchored to the hilt** — a flail that can be hurled at distant targets. Ball est. Ø 0.9–1.1 m (29–35 vox); chain est. 6–10 m (**verify**). Spikes: long and silver in Soul Society and vs BG9, short and ball-coloured vs Nirgge/Ggio (wiki notes the inconsistency → two skins). When sealed, reiatsu wraps the ball and it morphs back into the katana. No special ability, no element (his own complaint).
- **Forms & states:** 1. Sealed · 2. Shikai (flail) · Bankai not achieved · states: *clumsy act* / *serious* / *family rage*.
- **Abilities (complete):**
  - *Base*
    - `Shunpo (Onmitsukidō expert)` — blinked onto Nirgge's shoulders and held a sword to his head; lifted Suì-Fēng's body away from BG9 to another rooftop without it reacting. [Mobility, Teleport]
    - `Subterfuge` — plays slow and clumsy so enemies underestimate him ("in a city fight it's cleverness, not speed"). [Sensing/Stealth (aggro)]
    - `Strength` — braced himself *and* Suì-Fēng against Jakuhō Raikōben's recoil (normally she needs the Ginjōtan wrap); carried his captain and his sister a long way while wounded. [Grab/Throw] `[NEW: CarryAlly]`
    - `Endurance` — dug himself out of a collapsed building with scratches; kept attacking BG9 while skewered by its tendrils.
    - `Bear hug` — grabbed Ggio and held him for Suì-Fēng. [Grab/Throw, Bind]
    - `Bakudō #21 Sekienton` — cast without incantation (he admits he's bad at Kidō): red smoke to hide his escape from Baraggan. [Field(smoke), Sensing/Stealth]
    - `Cut away` — sliced off his own armband when Respira touched it; on Suì-Fēng's order cut off her decaying arm. [Status counter] `[NEW: LimbSever]`
    - `Shin'eiyaku` — handed Suì-Fēng Urahara's pill so she could use her Bankai again (item, TYBW). [Status cleanse: Bankai theft]
    - `Zanjutsu` — lieutenant level; skilled with the flail.
  - *Gegetsuburi Shikai*
    - `Throw` — long-range flail strike (pure mass). [Projectile(tethered), MeleeArc(smash)] `[NEW: FlailChainPhysics]`
    - `Block / spin guard` — ball used as a shield; spinning it deflected Nirgge's follow-ups. [Shield, Absorb/Reflect]
    - `Momentum ram` — when Nirgge reeled him in for a point-blank Cero, he rode the flail's momentum into the Arrancar's face (KO). [Mobility, MeleeArc(smash)]
    - `Sky drop` — Shunpo above the foe and bring the ball down (opened and finished the Nirgge fight). [MeleeArc(smash), Blast(crater)]
    - `Rubble shot` — crushed a piece of building to fling fragments at Baraggan (they rotted before arriving). [Projectile(debris, multishot)]
    - `Fragile` — cracks against a Fracción, shatters against a captain-class punch. `[NEW: WeaponDurability]`
  - *Anime-only*
    - Understands his gagged spirit perfectly (Mayuri calls it telepathy); tried to bribe Reigai-Byakuya (failed).
    - **Gegetsuburi's spirit:** obese shirtless man, very flat nose, red hair in five spikes, light-blue cape fastened by a big gold chain with a padlock, crescent-moon scar above the chest, piercing on the right of the lower lip, dark-blue pants with a red belt and a long hollow buckle; his sealed sword is a **bag of chips** he snacks from; pink reiatsu; Onmitsukidō hit-and-run style; throws the flail hard enough to shatter ground; survived a Getsuga Tenshō that cut the ball in half. [Summon]
    - **Reigai-Ōmaeda:** copy wielding a far larger Gegetsuburi (enemy variant; the wiki also credits it with Raikōhō).
  - *Flavour:* gold-crafting; abura-senbei crackers (crumbs in Suì-Fēng's hair earn beatings); the "Marechiyo Chop" he fires lazy workers with (never shown).
- **Passives & weaknesses:** + heavy (hard to knock back — *extrapolation*); + underestimated (lower enemy threat rating while "clumsy"); − bad at Kidō; − fragile Shikai; − cowardly against overwhelming foes (runs, screams for help); family in danger flips him into rage.
- **Signature moments to recreate:**
  1. Soul Society — chases Renji; Ichigo smashes the ball with a bare fist and KOs him (scripted).
  2. **FKT vs Nirgge** — slapped into a roof; runs up a building; Shunpo onto Nirgge's shoulders ("Onmitsukidō!"); flail from above; building collapses on him and he walks out; momentum ram; final sky drop.
  3. Bear-hugging Ggio so Suì-Fēng can strike (and getting punched by her for meddling).
  4. **Decoy vs Baraggan** — run for your life, cut off the rotting armband, rubble shot, Sekienton; amputating Suì-Fēng's arm; bracing her Bankai; catching her when she falls.
  5. **TYBW** — defending his home and sister Mareyo from BG9 (rage); retrieving Suì-Fēng; Shin'eiyaku; bracing her last shot; carrying captain + sister; Soldat ambush (Momo saves him); Bazz-B's Burner Finger 3 (saved by Sakanade).
  6. *Anime-only* — vs his own spirit; vs Reigai-Ōmaeda's giant flail.
- **Kit proposal:**
  - Shift: Onmitsukidō Shunpo (surprisingly long for his bulk); double-tap with lock-on = appear **standing on the target's shoulders** (free head strike / short ride) `[NEW: MountEnemy]`.
  - **Sealed:** LMB heavy slashes + body checks; forward = belly charge, back = uppercut slash (launcher), air = slash, down-air = butt-drop ground pound, sprint = shoulder charge. Hold LMB: two-hand overhead chop.
  - **Sealed-form slots:** only Z / X / G / C (and Tab items) — Q, E, R, F, V need the flail, so T is meant to be pressed early (he released at once vs Ichigo; vs Nirgge he opened with the sword, then released mid-fight).
  - **Shikai** (T *"Buttsubuse, Gegetsuburi!"*): LMB wide flail arcs (wind-up; 3rd hit craters), chain whip at mid range; hold LMB: overhead smash.
    - **Q `Throw`** — tap straight / hold lob; reels back in (hits on the return).
    - **E `Spin Guard`** — spinning ball deflects projectiles; can walk while spinning (debris tornado).
    - **R `Momentum Ram`** — whip the ball out and let it drag him into a ram.
    - **F `Sky Drop`** — Shunpo above the target and drop the ball (crater AoE).
    - **Z `Bear Hug`** — grab and hold (allies hit freely).
    - **X `Sekienton`** — red smoke screen (enemies lose targets; he can flee).
    - **G `Clumsy Act ↔ Serious`** — while clumsy he moves sloppily and enemies deprioritise him; the first Shunpo out of it = shoulder mount + crit.
    - **C:** pink flare. **V `Rubble Meteor`** (*extrapolation* from the Baraggan and Nirgge scenes) — pulverise a building chunk into a debris rain, then a full-height sky drop on the marked foe.
    - **Tab (items):** Abura senbei (snack heal) · Shin'eiyaku (give an ally: restores / protects a stolen Bankai) · Carry (lift up to two allies) · Cut Away (sever a decaying limb or item) · Bribe (gold toss; greedy NPCs hesitate — anime gag) · Marechiyo Chop (gag; never shown in canon).
- **AI notes:** Keeps his distance and complains; feigns clumsiness, then Shunpo-ambushes; if his captain is losing he jumps in to grapple; flees anything far stronger behind Sekienton; rage mode when family is threatened (ignores pain, all-in). Tells: munching crackers before engaging; yelling "Taichō!".
- **Callouts:** "Buttsubuse, Gegetsuburi!" · "Bakudō no nijūichi — Sekienton!" · "Nibantai fukutaichō, Ōmaeda Marechiyo!" · "Taichō!"

---

## 5. Nanao Ise (伊勢 七緒) — Co-Lieutenant, 1st Division (ex-Lieutenant, 8th Division) · Head of the Ise Clan

- **Wiki:** https://bleach.fandom.com/wiki/Nanao_Ise · /Anime_Continuity · Ise Clan (Shinken Hakkyōken) · Hakudan Keppeki · battles: *Nanao Ise vs. Lille Barro*; *Katen Kyōkotsu vs. Nanao Ise vs. Bearded Tōjū* (anime)
- **Roster tier:** **B** — a barrier/heal controller with a unique late-game "anti-god mirror" sword; strong duo synergy with Shunsui.
- **Canon power:** **4/10** baseline (Kidō expert, no Zanpakutō of her own; couldn't breathe under Yamamoto's reiatsu). **Situationally decisive** against "divine"/Vollständig enemies: with Shinken Hakkyōken she cut off Lille Barro's otherwise-untouchable hand and turned his city-erasing Trompete back on him, destroying him.
- **Body:** 164 cm → **52 vox**; 48 kg. Slim, upright, prim. Silhouette keys: **long black hair pinned back** (updo at the back of the head), **flat bangs hanging to the right side of her face**, **slightly oval glasses**, a **heavy book** under one arm (paper fan for smacking Shunsui).
- **Palette (hex estimates):**
  - Skin `#F8E1D2` · hair black `#121219` (blue-black sheen `#2A2D3F`) · eyes light blue with a deep violet tint `#8C8FD6`
  - Glasses: thin dark frame `#2B2B33`, lens glint `#DDE8F4` · book cover (unstated) dark red-brown `#5B2A22` (**verify**) · fan (unstated) cream `#EFE6D2`
  - Armband: 八 + strelitzia (accent `#B3446C`) until TYBW, then 一 + chrysanthemum (accent `#800080`)
  - **Shinken Hakkyōken:** wood-look blade light brown `#B98A57` (grain `#8E6640`); 8 rhombus mirrors `#CFE3F2` (sky-reflection highlight `#FFFFFF`); gold collar `#D4AF37` with two blue tassels `#2C5BD4`; long hilt wrapped in gray fabric `#8E8E8E`; gold ring pommel `#D4AF37` with two red tassels `#C8102E`; carrying wrap (unstated) off-white `#E8E2D2`
  - Hakudan Keppeki: white `#F7F8FA` with the Kidō Corps emblem around 一 (emblem `#1C1C24`) · hex-plate wall (colour unstated) translucent pale blue `#DDEBFF`, plate seams `#9DB8E8`
  - Reiatsu: not stated → violet-white `#CFC6FF` (proposal; matches her eyes)
- **Look by form/outfit:**
  - **Child:** short black bob, plain white kimono. **Shin'ō Academy:** longer hair, rounder glasses, student uniform.
  - **8th Division lieutenant (default, SS → FKT):** as above, 八 armband, book.
  - **17 months after Aizen:** bangs tucked behind her right ear.
  - **TYBW:** 1st Division co-lieutenant (一 armband); Shinken Hakkyōken first as a **cloth-wrapped bundle**, then unwrapped. Combat wounds: deep cut on the left leg vs Lille.
  - **10 years after Yhwach:** original hairstyle again; per Klub Outside Q&A #338 she walks with a **cane** as an after-effect of the Lille fight.
  - *Anime-only:* Reigai-Nanao (enemy variant, uses Shakkahō).
- **Weapons:**
  - **Pre-TYBW: none.** Ise women are spiritually bound to the clan sword and cannot imprint on an Asauchi; she graduated on Kidō alone.
  - **Shinken Hakkyōken (神剣・八鏡剣, Divine Sword, Eight-Mirror Sword):** the Ise Clan's sacred ceremonial sword — no edge, no Shikai/Bankai, not bound to one soul. An ornate, medium-sized sword whose blade is a **flat, rectangular, oar-like slab with blunt edges** that looks wooden, with **four rhombus mirrors inlaid on each face (8 total)**; instead of a guard, a habaki-like **gold collar** (~2.5 cm) with **two blue tassels**; a hilt long enough for two hands, wrapped in **gray cloth**, ending in a **gold ring pommel with two red tassels**. Size est.: 110 cm overall (35 vox), blade 9 cm wide (3 vox) — **verify**. Story: entrusted by her mother Isuzu to Shunsui to spare Nanao the Ise Curse; hidden inside Katen Kyōkotsu's small spirit girl (pulled out of her mask).
- **Forms & states (ordered):**
  1. **Base** — Kidō specialist, unarmed (book/fan).
  2. **Shinken Hakkyōken** (TYBW; unwrap = state change, not a release).
  3. **"Together"** — Shunsui rises from her shadow and closes his hand over hers on the hilt; her fear-freeze ends (duo state).
- **Abilities (complete):**
  - *Base / Kidō (canon)*
    - `Kidō expert` — low- and mid-level spells without incantation; builds intricate new spells quickly when given data; told Haschwalth that no captain could cast Hakudan Keppeki. [passive]
    - `Hakudan Keppeki (白断結壁, White Severing Boundary Wall)` — her own creation (built from traces of Quincy reiatsu): a wall bearing the Kidō Corps emblem around 一 that completely bars Quincy power for a limited time; Haschwalth could only break it by slowly absorbing the reishi on his side. [Construct, Shield] `[NEW: FactionKeyedBarrier]` + reishi-absorption drains it `[NEW: BarrierErodedByAbsorption]`
    - `Hexagonal plate wall` (unnamed) — raised while Haschwalth was absorbing the first wall: a wall of many small joined hexagonal plates; looks weaker than a single slab but would have to be smashed by force (Haschwalth complimented it). [Construct, Shield] `[NEW: MultiPlateBarrier]`
    - `Kaidō` — not at Isane's or Unohana's level by her own account, but heals several gravely injured people at once. [Heal/Reject (AoE)]
    - `Shunpo` — kept up with Kyōraku and Ukitake fleeing Yamamoto (exhausted); by Wahrwelt she matches her captain's pace without tiring (he praised it). [Mobility]
    - `Reiatsu palm` — gathered dense reiatsu around her right hand to finish off Chad (Kyōraku forbade it). [MeleeArc(smash), Blast(point-blank)]
    - `The glasses` — when truly angry she removes her glasses; people who see it are reduced to gibbering wrecks (even Mayuri). [Status(fear)] `[NEW: FearAura]`
    - `Fan smack` — slaps Kyōraku with a fan (gag).
  - *Kidō — anime-only*
    - `Bakudō #4 Hainawa` (bound Katen Kyōkotsu's girl) · `Hadō #4 Byakurai` · `Hadō #31 Shakkahō` · `Bakudō #62 Hyapporankan` · `Hadō #58 Tenran` (last two per the spell pages' practitioner lists).
    - Opens a **Senkaimon** (Human World → Dangai) and spent a month raising barriers around Karakura Town (Reigai arc). [Teleport, Construct] `[NEW: PortalGate]`
  - *Shinken Hakkyōken (canon, TYBW)*
    - `Absorb / disperse divine power` — takes "the power of a god" into the blade and scatters it in all directions; Lille's light-body was dispersed where it struck. [Absorb/Reflect] `[NEW: TagBasedReflection(divine)]`
    - `Cuts the uncuttable` — severed Lille's hand at the wrist although Kyōraku's attacks had passed through him. [MeleeArc(cut) ignoring intangibility vs divine-tagged]
    - `Blinding to gods` — to a god-class opponent the blade shines too brightly to be seen (Lille couldn't see it). [Status(blind) vs divine]
    - `Mirror reflection` — held before her, it threw Trompete — a spherical, multi-wave blast that erased a huge chunk of the city — back at Lille: a strip of his body vanished, he cracked and burst into golden rain, while the thin strip of ground under Nanao and Kyōraku survived. [Absorb/Reflect, Shield(narrow cone)]
    - `Backlash` — dispersed energy can cut the wielder (her leg was opened by scattered light). [self-damage]
- **Passives & weaknesses:**
  - + Barrier specialist (her walls are faction-keyed and hard to brute-force); + poor-eyesight clan (glasses are her "true sight" — see G).
  - − **Inexperienced swordswoman:** her first wound froze her with fear and pain (legs wouldn't move). − Low resistance to crushing reiatsu (Yamamoto's pressure stopped her breathing). − No Zanpakutō before TYBW.
- **Signature moments to recreate:**
  1. Soul Society — flower-petal entrance for Kyōraku (comedy), watching him fight Chad, then charging the reiatsu palm to finish Chad.
  2. Reaching for her sword-hand to help vs Yamamoto → crushed by his reiatsu; Kyōraku shields and carries her off.
  3. **TYBW — Hakudan Keppeki vs Haschwalth** (he reads her skill; slowly absorbs it; the hex wall reveal).
  4. **Wahrwelt — keeping pace with Kyōraku through Lille's sniping**; finding him fallen; Kageoni pocket dimension; Kyōkotsu's girl pulls the wrapped sword from her mask; Nanao takes the curse by choice; she bursts out of the shadow on Lille's forehead.
  5. **Nanao vs Lille** — severs his hand → fear-freeze from her leg wound → Kyōraku rises from her shadow, hand on hers → **Trompete reflected** → Lille shatters into golden rain; she collapses.
  6. *Anime-only:* vs/with Katen Kyōkotsu's quiet girl and the Bearded Tōjū (Hainawa, Byakurai, Shakkahō); sewer expedition with Hanatarō.
- **Kit proposal:**
  - **Base (Kidō controller):**
    - Shift: Shunpo (expert; longer chain in TYBW skin).
    - LMB: reiatsu-palm strikes with a book-bash finisher (Heat the Soul gave her book + palm — game precedent); forward = palm lunge, back = launcher palm, air = palm slam, sprint = fan swat dash. Hold LMB: **Reiatsu Palm** (dense charge → point-blank burst).
    - **Q `Byakurai`** (anime) — instant thin lightning bolt.
    - **E `Hakudan Keppeki`** — place the white wall: total block vs Quincy-tagged powers (incl. Blut, Heilig Pfeil, Sklavelei drain only slowly erodes it), strong shield vs everything else; timed duration.
    - **R `Hex Wall`** — multi-plate barrier; each plate breaks separately; unbroken plates slowly regrow (*extrapolation*).
    - **F `Kaidō`** — AoE heal (several allies at once).
    - **Z `Hyapporankan`** (anime) — rain of ~100 pinning rods.
    - **X `Hainawa`** (anime) — rope bind, combo starter.
    - **G `Glasses Off`** — fear aura in a front cone (minions cower, bosses flinch), but her own vision blurs (screen blur, wider spread) — the Ise clan's bad eyesight. `[NEW: SelfScreenBlur]`
    - **C:** violet-white flare.
    - **V `Kidō Fortress`** (*extrapolation*) — encloses allies in nested Hakudan Keppeki + hex walls and pulses Kaidō inside.
    - **Tab:** Shakkahō, Tenran, Byakurai, Hainawa, Hyapporankan (all anime-only) · Senkaimon gate (anime) · *extrapolated library* (Seki, Sai, Rikujōkōrō, Dankū, Tōzanshō).
  - **Shinken Hakkyōken (TYBW skin, T = unwrap):**
    - LMB: slow, heavy two-handed blunt swings (smash); vs divine/light-bodied foes they *cut*. Hold LMB: overhead severing downswing.
    - **Q `Disperse`** — hold the blade forward to soak an energy beam and scatter it in all directions (shards can hurt her too).
    - **E `Reflect`** — timed: send the attack back at its source (amplified vs divine tags).
    - **R `Dazzle`** — divine foes in front lose sight of the blade (their lock-on fails).
    - F `Kaidō` · Z `Hakudan Keppeki` · X `Hex Wall`.
    - **G `Together`** — if Kyōraku is on the team (or as a timed assist), he emerges from her shadow: fear-freeze immune, Reflect window widened. Without him she has a chance to freeze for 1 s after taking a big hit.
    - **V `Eight-Mirror Return`** — perfect reflection of the next attack of *any* size back at its caster; only a narrow strip behind her is protected (everything else in the blast still gets erased — canon Trompete scene).
- **AI notes:** Support controller: stays behind her captain, heals, walls off projectile lanes, binds rushers. Tells: adjusts her glasses before a big cast; glasses come off when enraged (fear aura). Shinken boss/ally: baits the enemy's biggest attack and reflects it; freezes in fear on her first serious wound unless Kyōraku is present.
- **Callouts:** "Hakudan Keppeki." · (anime) "Bakudō no yon — Hainawa!" · (anime) "Hadō no yon — Byakurai!" · "Shinken Hakkyōken." · "Kyōraku-taichō!" · "Taigai ni shite kudasai!" ("Please be moderate!" — the title of her Seireitei Communication column; use as a scolding line)

---

## 6. Nemu Kurotsuchi (涅 ネム) — Lieutenant, 12th Division (†) · born Nemuri Nanagō (眠七號, "Sleep No. 7")

- **Wiki:** https://bleach.fandom.com/wiki/Nemu_Kurotsuchi · /Anime_Continuity · Hachigō Nemuri · Mayuri Kurotsuchi · battles: *Mayuri Kurotsuchi & Nemu Kurotsuchi vs. Pernida Parnkgjas*; *Mayuri Kurotsuchi vs. Szayelaporro Granz*; *Rukia Kuchiki vs. Reigai-Rukia Kuchiki & Reigai-Nemu Kurotsuchi* (anime)
- **Race:** Enhanced Artificial Soul — seventh body of Mayuri's **Nemuri Project** (souls grown from Konpaku cells), built with Gigai + Gikon (artificial soul) technology; shares Mayuri's blood.
- **Roster tier:** **B** — a body-horror bruiser/bodyguard with a timed overdrive and a soul-sacrifice cannon; pairs with Mayuri.
- **Canon power:** **4/10 base, 6/10 at 0.8%** — catches a Heilig Pfeil in flight, digs out a hidden lab barehanded (anime: easily pins Uryū in a test); at the threshold she smashed clean through Pernida's palm and her Gikon Jūrinjū punched a hole through a Pernida clone and several buildings behind it.
- **Body:** 167 cm → **53 vox**; 52 kg. Slender and curvy, very still, blank melancholic face. Silhouette keys: **long black braid** (to the hips, **verify** length) with slightly parted bangs, **short black kimono ending mid-thigh** over a white under-kimono, **puffed upper sleeves** (narrower than standard Shinigami sleeves), **wide white obi with a red cord**, **white hand-backs/gloves**, **dark-red choker**, white tabi with **strappy low-heeled black sandals**.
- **Palette (hex estimates):**
  - Skin pale `#F3E0D6` · hair black `#15151C` (cool sheen `#2B3045`, **verify**) · eyes green `#3FA36B` (at 0.8%: **white** `#F5F7FA`)
  - Kimono black `#121214` · nagajuban white `#F1F1EF` · obi white `#F4F4F2` · obijime red `#B3172E` · choker dark red `#7A1222` · gloves white `#F7F7F5` · tabi white · sandals black `#1A1A1A`
  - Armband 十二 + thistle, accent `#808000` (the Konjiki Ashisogi Jizō **antidote is stored under it**)
  - Sword: hilt green `#3E7F49`, warped guard steel `#8A8F86` (**verify**)
  - Gikon Jūrinjū gold `#FFD34A` (core `#FFF6CF`) · Tedoriru = motion-blurred forearm + rock-dust `#8C8578`
  - Reiatsu: not stated → pale gold-green `#D9E8A0` (proposal)
- **Look by form/outfit:**
  - **Default (SS → TYBW):** as above.
  - **Childhood:** untidy hair, white kimono.
  - **TYBW second invasion:** she and Mayuri come out of their lab wearing light-emitting, **shadowless** attire (anti-Quincy-shadow) — exact design **not described in my sources** (Mayuri's matching look: bright white ridged coat with a sun-like hood).
  - **Hachigō Nemuri (眠八號, "Sleep No. 8")** — her successor grown from her retrieved brain, seen 10 years later: **short girl, long black hair, standard black uniform with a light-coloured sash, shouts constantly** (height unknown → ~125 cm / 40 vox, **verify**).
  - *Anime-only:* Reigai-Nemu (identical copy; turns back into a red pill when destroyed).
- **Weapons:** a thin katana with a **green hilt and a warped guard** (rarely carried). She fights with her body (anime: kicks first), her drill-hand, and lab gadgets.
- **Forms & states (ordered):**
  1. **Base** — bodyguard / field technician.
  2. **Power Enhancement** — pushes her body to **0.8% below the point of collapse**: eyes go white, ~6 minutes of output ("400 more seconds"), decomposition accelerates.
  3. **Death → Hachigō Nemuri** — successor respawn (child).
- **Abilities (complete):**
  - *Bio-augmentation (canon)*
    - `Enhanced endurance` — built to survive what kills normal souls (Mayuri's slash through her, his stomping; organs swapped for tougher artificial ones by Mayuri). [passive]
    - `Enhanced strength` — dug out Szayelaporro's hidden lab barehanded; hurls large stone blocks; lifts a big column overhead; erected the Garganta pillars alone. [Grab/Throw] `[NEW: LiftWorldChunk]`
    - `Enhanced speed / reaction` — snatched Mayuri out of Bambietta's bomb radius; **caught a Heilig Pfeil with one hand** mid-flight. [Mobility, Absorb/Reflect(catch)] `[NEW: ProjectileCatch]`
    - `Poison immunity` — same blood as Mayuri (immune to Konjiki Ashisogi Jizō). [passive]
    - `Chemical repository` — Mayuri keeps drugs inside her; whoever consumes or invades her body gets a dose that depends on which part they touch. Szayelaporro, reborn *through* her via Gabriel (draining her to a husk), absorbed the **Superhuman Drug**: his perception sped up so far that one second felt like an eternity — he could barely move. [Status(time-slow on the invader)] `[NEW: OnAbsorbedPayload]`
    - `Revival` — from a deathlike state Mayuri can restore her ("the Mayuri-style *** technique", played for embarrassment). [Heal/Reject (ally-triggered)]
    - `Involuntary Cell Division Acceleration Organ` — implanted in her pituitary so her Konpaku cells outlive their limit; failsafes: if the cerebrum core is removed it links to the parietal lobe and takes over the body; eaten *without* her brain, it makes the eater regenerate out of control and **self-destruct** (how the Pernida clone died). [Status(overgrowth→explode)] `[NEW: OnEatenOvergrowth]`
    - `Tedoriru (手ドリル, Hand Drill)` — spins hand and forearm like a drill at extreme speed; bores through solid rock. [MeleeArc(smash) → tunnel carve]
    - `Power Enhancement` — 0.8% from collapse for ~6 min: her legs alone launch her high and fast enough to **shatter the ground at take-off and blow apart flesh in her path** (smashed a hole through Pernida's palm while carrying Mayuri out). [Transform/Stance, Mobility] `[NEW: TimedOverdriveWithCollapse]`
    - `Konpaku Sessaku (魂魄切削, Soul Cutting; Viz: Soul Slicer)` → `Gikon Jūrinjū (義魂重輪銃, Artificial Soul Heavy Circle Cannon)` — she **shaves off 6% of her own soul** and fires it from the right palm as a golden energy blast that **warps the target's flesh around itself and leaves a clean circular hole**, carrying on through several buildings. [Beam(bore), Blast] `[NEW: SoulSacrificeCost]`
  - *Field technician (canon)*
    - **Antidote** carried under her armband (gave it to Uryū) · **Hojiku-Zai** (supplement: regrew Mayuri's arm and then her own) · **wound binding** (Kenpachi's stump) · **Nerve-Freezing Agent** — injected into one of Pernida's neutralised Heilig Pfeil so the nerve link froze Pernida and a clone (blood coagulates, organs lock in place) · **Reishi fixers** — spherical devices on a 3-second timer that meet Bambietta's bombs *without* setting them off, then burst and **deactivate reishi for a set time** · **Garganta device** — sets up large pillars single-handedly and stands on top as the focus to open a Garganta · pushes Mayuri's loaded wagon. [Heal/Reject, Bind, Status(paralysis), Construct, Teleport] `[NEW: ReishiFixerGrenade]` `[NEW: PortalGate]`
    - **Self-amputation:** caught Pernida's arrow and cut off her own arm with her other hand before its nerves could spread. `[NEW: LimbSever/Regrow]`
    - **Living shield / tackle:** grabbed Uryū's spirit arrow and tackled him so Mayuri could cut through both; "taking me hostage achieves nothing".
  - *Anime-only*
    - Expert hand-to-hand fighter who favours kicks; destroyed Reigai-Nemu with **one hand through the heart** (it reverted to a red pill, which she crushed). [MeleeArc(smash), Grab]
    - Bount arc: tested Uryū in combat, then gave him research material 9-141 (a Quincy battle accessory that controls spiritual force).
    - Dangai survey with a three-eyed scanning device printing on paper (gadget flavour).
- **Passives & weaknesses:**
  - + Poison immunity; + revivable by Mayuri; + drug payloads punish anything that absorbs/devours her.
  - − Obeys orders: stands by until called (AI idle rule); − overdrive ends in collapse; − **died** when the pieces of a Pernida clone grew eyes, drove nerves into her, swelled her flesh and **burst her apart** — Mayuri saved only the brain.
- **Signature moments to recreate:**
  1. SS — grabs Uryū's arrow and tackles him; Mayuri slashes through her; she gives Uryū the antidote from under her armband.
  2. Hueco Mundo — Szayelaporro's Gabriel reborn out of her mouth (she's left a withered husk; *anime softens it to pink vapour*) → Superhuman Drug backfires on him → Mayuri revives her → she tears open the lab door.
  3. FKT — erects the Garganta pillars alone and stands on top as the focus to send Ichigo home.
  4. TYBW — Bambietta's zombie bombs: she yanks Mayuri clear, throws the Reishi fixers.
  5. **vs Pernida** — Heilig Pfeil catch + self-amputation; Hojiku-Zai; Nerve-Freezing Agent injection; **eyes go white**: leap through Pernida's palm with Mayuri; 6% soul → Gikon Jūrinjū through a clone and the city behind it; nerves burst her; Mayuri retrieves her brain → 10 years later, Hachigō Nemuri.
  6. *Anime-only:* heart-strike on Reigai-Nemu (pill crushed).
- **Kit proposal:**
  - **Base:**
    - Shift: augmented sprint/leap (written as raw physical speed, not named Shunpo); double-tap with lock-on = rescue-grab dash to an ally (or behind the target).
    - LMB: kick-heavy Hakuda chain (anime); forward = flying kick, back = rising kick launcher, air = axe kick, down-air = stomp, sprint = sliding tackle. Hold LMB: **heart strike** — open-hand piercing thrust (one-hit KOs mod-soul/Reigai-type foes).
    - **Q `Tedoriru`** — tap: drill jab (armour pierce); hold: continuous bore (tunnels through rock/buildings).
    - **E `Heave`** — rip out a column/stone block and throw it.
    - **R `Catch`** — snatch an incoming projectile mid-flight; if it is "infectious" (nerve/poison/parasite tag), follow-up **Sever** (cut the arm off; regrow later with Hojiku-Zai).
    - **F `Reishi Fixer`** — throw 1–3 spheres with a 3 s fuse: on contact they *freeze* projectiles/bombs without detonating them; on burst they switch off reishi in the radius (projectiles fizzle, constructs stop, voxels stop breaking/repairing) for a few seconds.
    - **Z `Field Kit`** (Tab sub-wheel): Antidote (cleanse poison, ally or self), Hojiku-Zai (regrow a limb/heal), Nerve-Freezing Agent (inject into a target or into its own projectile/tendril → full paralysis spreading along the link), Bandage.
    - **X `Extraction`** — grab an ally and dash them out of an AoE.
    - **G `Bodyguard`** — designate an ally (default Mayuri): she shadows them and auto-intercepts projectiles aimed at them.
    - **C:** flare (colour not canon).
  - **Power Enhancement (T):** eyes white, ~400 s timer, strength/speed way up; Shift becomes ground-shattering launches; LMB hits crater; **R `Burst Through`** — launch through an enemy body/structure carrying an ally. When the timer ends: forced collapse (stunned, HP drain).
  - **V `Gikon Jūrinjū`** — usable in either state; costs **6% of max HP permanently** for the match (soul shaved); golden palm cannon that bores a clean circular tunnel through the target and everything behind it.
  - **Death/successor (optional mode):** on KO, if Mayuri is alive he can "retrieve the brain" → she respawns later as **Hachigō Nemuri** (smaller, louder, weaker kit, shouts every action) `[NEW: SuccessorRespawn]`.
- **AI notes:** Silent bodyguard: idles beside Mayuri until called *or* until she judges he needs a shield (his HP below a threshold) — then she acts on her own. Intercepts arrows, pulls him out of blasts, injects agents on command. Desperation: Power Enhancement → Gikon Jūrinjū. Tells: bows before acting; says "Mayuri-sama" once before moving.
- **Callouts:** "Mayuri-sama." · "Konpaku Sessaku — Gikon Jūrinjū." · (Hachigō Nemuri: everything, loudly)

---

## 7. Yachiru Kusajishi (草鹿 やちる) — Lieutenant, 11th Division · President, Shinigami Women's Association (vanished, TYBW)

- **Wiki:** https://bleach.fandom.com/wiki/Yachiru_Kusajishi · /Anime_Continuity · Nozarashi (Zanpakutō spirit) · Guenael Lee · battles: *Yachiru Kusajishi vs. Guenael Lee*; *Kenpachi Zaraki vs. Gremmy Thoumeaux*
- **Roster tier:** **B** — fan favourite; her *attack-echo* beasts and instinct counters are a unique mechanic, and she is a lore key for Kenpachi's Bankai.
- **Canon power:** **4/10** (true ceiling unknown) — combat-division lieutenant whom grown men fear; her instinct hit a Sternritter who could erase himself from sight *and* memory, and her concentrated Sanpo Kenjū strike split the ground; per Kubo she is a **manifestation of Nozarashi** (Kenpachi's Zanpakutō — specifically its Bankai aspect; the true spirit looks like an adult woman), which explains her powers.
- **Body:** 109 cm → **35 vox**; 15.5 kg. Tiny child, big head (≈1/4.5 of height), short limbs. Silhouette keys: **short fluffy pink hair**, **permanent blush**, oversized armband on a tiny sleeve, a katana almost as long as she is **dragged on wheels**, usually **perched on Kenpachi's left shoulder**.
- **Palette (hex estimates):**
  - Skin `#FBE3D6` · blush `#F4A0AE` · hair pink `#F58FB5` (shade `#E06C98`) · eyes dark pink `#C2275F`
  - Shihakushō = base palette (child-sized) · armband 十一 + yarrow, accent `#734F96`
  - Sanpo Kenjū: hilt wrap pink `#F48FB1`, five-petal-flower tsuba (metal unstated → gold `#D2A63C`), purple scabbard `#7E3FA6`, two little wheels (wood `#5B4636`, tyre `#222222`), loose carrying cord (unstated → white `#F2F0EA`)
  - Cross-bone hair clip (post-Aizen, left side; colour unstated) bone white `#EEE6D2`
  - Angry-cat-face reiatsu pink `#FF6FA8` (outline `#FF3D8B`, 60% alpha)
  - **Lumpy / Moko Moko (前獣, front beast):** plump, covered in yellow fur `#F2CF44` (shade `#D9AE2E`), eyes half-hidden `#1A1A1A`, cleaver `#B9BEC4` with dark grip `#4A3A2A`
  - **Boney / Hone Hone (後獣, back beast):** tall, made of bone `#EDE5CF`, teal hair `#2FB5A5`, black cloak `#151515`, a large bone running vertically through the head, long dagger-like blade with a second blade off its top edge `#C5CAD0`
- **Look by form/outfit:**
  - **Default:** as above, riding Kenpachi.
  - **17 months after Aizen:** flatter hair with a **cross-bone hair clip** on the left.
  - **Cat costume:** prank outfit she wears to steal koi from Byakuya's pond (cosmetic).
  - **Vanished (TYBW):** her empty shihakushō and armband left on the ground after Kenpachi beats Gremmy. **Nozarashi** then appears to Kenpachi *as Yachiru* (same model, mannerisms) to unlock his Bankai.
- **Weapons:** **Sanpo Kenjū (三歩剣獣, Three-Step Sword Beasts)** — an ordinary katana (~100 cm → 32 vox, about her own height): pink hilt wrap, five-petal-flower tsuba, purple scabbard fitted with **two wheels** (Ikkaku installed them after she pestered him), carried on a loose cord rather than at the sash. The blade does **not** change in Shikai. **Beasts (sizes not given — estimates, verify):** Lumpy ≈ 1.2 m / 38 vox, round and furry, cleaver about its own height; Boney ≈ 2.4 m / 77 vox, gaunt skeleton in a cloak, blade ≈ 1.5 m.
- **Forms & states (ordered):**
  1. **Sealed** — fists and the wheeled scabbard.
  2. **Shikai** — **no release command**: she draws and **Lumpy + Boney** manifest beside her.
  3. *(Lore)* **Nozarashi link** — she is the Bankai manifestation of Kenpachi's sword (team-up hook, not a solo form).
  - States: **instinct mode** (auto-reflex), **angry** (cat face).
- **Abilities (complete):**
  - *Base*
    - `High reiatsu` — when angry it takes the shape of a **huge angry pink cat face**; Kenpachi's crushing reiatsu doesn't affect her. [Stance, Status(fear on mobs)] `[NEW: ShapedAuraDecal]`
    - `Hakuda` — swift punches (vs Guenael). [MeleeArc(smash)]
    - `Strength` — lifts Kenpachi (twice her height, 5× her weight) with ease and leaps between buildings carrying him. [Grab/Throw] `[NEW: CarryAlly]`
    - `Endurance` — fights on through blunt trauma and cuts.
    - `Speed` — ran from Seireitei's streets to Sōkyoku Hill in no time without Shunpo (anime: something like Shunpo while chasing Ashisogi Jizō). [Mobility]
    - `Infiltration` — secret tunnels and a hideout under the Kuchiki manor; only used for mischief. [Sensing/Stealth, Teleport(tunnel)]
    - `Detection & analysis` — found Orihime and matched her reiatsu to Ichigo's to deduce she was a Ryoka. [Sensing] `[NEW: ReiatsuSignature]`
    - `Auto-reflexes` — attacks on instinct whoever gives her "the feeling", without needing to know who they are; the longer it runs, the faster her counters and dodges get. It let her hit Guenael Lee, whose Vanishing Point erased him from sight and from her memory between punches. [Stance] `[NEW: InstinctCounterIgnoresStealth]`
  - *Sanpo Kenjū (Shikai)*
    - `Three-step strike` — when she swings, both beasts mimic the swing: **Lumpy hits just before her, Boney just after**, so even if she misses one of the two lands — near-undodgeable. [Summon(×2), MeleeArc(cut)] `[NEW: AttackEcho(timed offsets)]`
    - `Fissure strike` — a concentrated triple strike opens a **deep fissure** in the ground (Guenael barely slid out of being bisected). [GroundWave, Slice]
    - Isane: a Shikai that manifests its power as creatures while the blade stays unchanged is unheard of. She plays with the beasts between fights (they dance and high-five in Brave Souls — game).
  - *Anime-only*
    - Unaffected by Ashisogi Jizō's poison ("held her breath"); chased it, grabbed its wings and pinned it; poked the Dangai wall until it burst; spotted that the Zanpakutō spirits were stalling.
  - *Leadership gag:* Women's Association president — spends the budget on candy, sends members on pranks.
- **Passives & weaknesses:**
  - + Instinct counters ignore stealth/invisibility; + immune to Kenpachi's (and allies') reiatsu pressure.
  - − **No sense of direction** (her navigation gets everyone lost); − childish focus (sweets, games); − tiny reach and mass; − reality warpers break her (Gremmy turned her bones into cookies with a thought).
- **Signature moments to recreate:**
  1. Ryoka invasion — "navigating" Kenpachi in circles; hopping onto Ichigo's shoulder to look at Hanatarō.
  2. After Kenpachi loses to Ichigo — she slings him on her back and bounds across the rooftops to Unohana; their naming flashback (Kusajishi, 79th North district).
  3. Hueco Mundo — "Ken-chan will get mad if you attack me" to Nnoitra (shielded by Orihime).
  4. **TYBW — Guenael Lee:** supply runs for Isane's field hospital; punching an enemy she keeps forgetting; drawing the sword; Sanpo Kenjū reveal; fissure strike.
  5. **Gremmy:** cookie bones (scripted loss) → Kenpachi frees her ("go get your arm fixed").
  6. **Disappearance:** Kenpachi steps on her empty uniform; later Nozarashi wears her face to give him Bankai.
- **Kit proposal:**
  - Shift: kid scamper (very fast, can wall-hop between rooftops); double-tap with lock-on = hop onto the target's head/shoulder and perch (*canon gag on Ichigo*) `[NEW: MountEnemy]`.
  - **Sealed:** LMB flurry of tiny punches + scabbard bonks (game precedent: sheathed-sword fighting style); forward = headbutt dive, back = scabbard uppercut, air = spinning kicks, down-air = scabbard pogo, sprint = rolling tackle. Hold LMB: wheel-scabbard spin. Slots R / F / Z / X / G / C work sealed; Q, E and V need the beasts.
  - **Shikai** (T: no chant — she draws; Lumpy and Boney pop in with a little dance):
    - LMB: every swing = three hits (**Lumpy −0.15 s → Yachiru → Boney +0.15 s**); enemies must dodge three timings.
    - Hold LMB: **Fissure Strike** (concentrated triple strike; long ground split).
    - **Q `Sic 'Em`** — Lumpy and Boney fight independently for ~6 s.
    - **E `Swap Lead`** (*extrapolation*) — reverse the echo order (Boney first) to break enemy parry timing.
    - **R `Piggyback`** — lift an ally (Kenpachi) and bound across rooftops.
    - **F `Secret Tunnel`** — dive into a hidey-hole and pop out at a known tunnel exit.
    - **Z `Nickname`** — taunt (enemy targets her, small "annoyed" accuracy debuff).
    - **X `Candy`** — snack heal.
    - **G `Instinct`** — auto-reflex mode: she auto-counters anything hostile in reach, including invisible or memory-erasing enemies; each successful counter stacks speed.
    - **C `Angry Cat`** — giant pink cat-face reiatsu overhead; weak enemies cower.
    - **V `Triple Beast Rampage`** (game-inspired: dance + high-five, then all three slash) — wide multi-fissure. **Team variant with Kenpachi:** "Nozarashi" — she vanishes into his sword and his Bankai triggers/overcharges (lore-accurate team ultimate).
- **AI notes:** Chaotic scout who runs ahead and gets lost; rides Kenpachi when he's present; attacks anything suspicious on instinct (good vs stealth enemies); flees danger by hopping on rooftops; the cat face appears when insulted. Tells: giggles before a pounce; shouts "Ken-chan!" when he arrives.
- **Callouts:** "Ken-chan!" · "Sanpo Kenjū!" · "Moko Moko! Hone Hone!" (calling the beasts by their names) · nicknames: "Icchi!", "Tsururin!" (Ikkaku), "Byakushi!"

---

## 8. Hanatarō Yamada (山田 花太郎) — 3rd Seat (ex-7th Seat), 4th Division · Leader, 14th Advanced Relief Team

- **Wiki:** https://bleach.fandom.com/wiki/Hanatar%C5%8D_Yamada · /Anime_Continuity · Hisagomaru (Zanpakutō spirit)
- **Roster tier:** **C** — joke/support character: healer NPC, escort target, or comedy playable.
- **Canon power:** **1/10 in combat** (healing 5/10) — "almost no fighting power"; can't use Shunpo; collapses under a captain's reiatsu; but healed Renji from near death to running in a short time.
- **Body:** 153 cm → **49 vox**; 45 kg. Short, slight, hunched and nervous. Silhouette keys: **chin-length black hair with bangs framing the face**, big **blue eyes**, the **4th Division medical pack** on his back/over his shoulder. No armband (seated officer).
- **Palette (hex estimates):**
  - Skin `#F7DECD` · hair `#17171C` · eyes blue `#4C7BD0`
  - Medical pack (colour unstated) tan canvas `#C8B48C`, straps `#5E4A33` (**verify**)
  - Hisagomaru: handle blue `#3467C8`, round guard `#8C8F94` with a brown gourd/bag `#8B5A2B`, blade `#D5D9DE` with a glass-like gauge channel `#CFE6F2` filling **red** `#E3262E`; healing smoke red `#D9333F` (50% alpha)
  - Akeiro Hisagomaru: vermilion scalpel `#E34234`; discharge stream red `#FF2E2E`, core `#FFD0D0`
  - Kaidō green `#6FE08A` · Shinten green liquid `#5FD35F` · skull pill white `#F2F2F2` with black skull
- **Look by form/outfit:** standard shihakushō + pack (default); unarmed most of the time (he keeps misplacing his sword); *anime-only* Bount arc: in a Gigai working at a convenience store.
- **Weapons:** **Hisagomaru (瓠丸, Gourd)** — katana with a blue handle and a round guard with a brown sphere/bag (the "gourd") attached; a **gauge runs along the blade**. **Akeiro Hisagomaru (朱色瓠丸, Vermilion Gourd)** — Shikai shaped like a **scalpel**.
- **Forms & states (ordered):**
  1. **Unarmed** (default — sword misplaced).
  2. **Hisagomaru** — healing blade.
  3. **Akeiro Hisagomaru** — command "Mitase" (満たせ, Fulfill): triggers **automatically when the gauge is full**.
- **Abilities (complete):**
  - `Kaidō` — highly proficient: Renji from near death to running to Sōkyoku Hill; Ichigo overnight in the sewers (then Ganju, until he passed out drooling); TYBW triage for the 11th Division. Anime: also healed by giving his own reiatsu (later "too weak for that"). [Heal/Reject]
  - `Hisagomaru — healing blade` — a cut **heals instead of hurting**; red smoke rises from the wound and flows into the blade, filling the gauge in proportion to the injury (small cuts barely register; per the wiki, an "Encroachment"-grade injury fills it instantly). [Heal/Reject] `[NEW: DamageInversionWeapon + StoredDamageGauge]`
  - `Akeiro Hisagomaru` — at full gauge it auto-releases into the scalpel. *Anime continuity* fills in the payoff: every wound it absorbed is concentrated into **one slash that fires a red, Cero-like stream** (near-fatal to a Gillian); after that it can cut normally (awkward in scalpel form). [Beam, Slice]
  - `Shinten` — green anaesthetic from his pack: one drop knocks out anyone with weak reiatsu (he dropped a guard with it; the wiki notes it was strong enough for Yumichika). [Status(sleep)]
  - `Skull pill` — 4th Division stamina supplement; **his** is a flour placebo his seniors swapped as a prank (he thinks it works). [joke buff]
  - `Expert guide` — knows Seireitei's sewers and hidden passages (4th Division cleaning duty) and carries keys to most buildings; stole the key to Rukia's cell. [Teleport(sewer network)] `[NEW: SewerNetworkTraversal]` `[NEW: KeysAndLocks]`
  - `Can't Shunpo` — Byakuya simply left him behind in Hueco Mundo. [weakness]
  - `Bravery` — walked onto the Senzaikyū bridge alone to stall Byakuya so the others could flee.
  - *Anime-only — Hisagomaru's spirit:* a small white robot-like figure, cylindrical torso, spherical head, thin limbs with flat hands/feet, rectangular mouth, a black round right eye and **a long vertical gauge in place of the left eye**; heals by absorbing damage until the gauges fill, then its **chest opens into a cannon** fired with **"Sosoge"** (注げ, Infuse) — a red beam that one-shot a big Tōjū; lived in the sewers and booby-trapped them (tripwire explosions, a floor panel that flushes victims away with sewer water). [Summon, Beam, Construct(traps)]
  - *Game-only:* Raikōhō (3rd Phantom); riding Ganju's boar Bonnie (Brave Souls).
- **Passives & weaknesses:** + top-tier field healer; + small and unthreatening (enemy AI deprioritises him — *extrapolation*); − no Shunpo, no real offense until the gauge is full; − passes out under strong reiatsu; − the "most bullied kid in the world" (birthday April 1).
- **Signature moments to recreate:** taken "hostage" by Ichigo and Ganju (the 11th Division don't care); sewer shortcut to the Senzaikyū; healing Ichigo underground; Shinten on a guard and the stolen key; standing alone on the bridge before Byakuya; freed by Rikichi to heal Renji; slashed by Zommari-controlled Rukia in Hueco Mundo; *anime-only:* the sewer Tōjū hunt with Nanao and Ikkaku when Hisagomaru's spirit fires its cannon.
- **Kit proposal (joke/support):**
  - Shift: panicked sprint (no Shunpo) with a trip-roll at the end that knocks over anything he runs into.
  - **Unarmed LMB:** flailing slaps; the 3rd hit is a trip that knocks the enemy down.
  - **Hisagomaru LMB:** every hit **heals** the target and fills the gauge by the amount healed (hitting badly wounded enemies — or allies — charges fastest).
  - Hold LMB: big earnest swing (heals a lot, fills a lot).
  - **Q `Kaidō`** — channelled heal; revives downed allies faster.
  - **E `Shinten`** — flick a drop: weak foes sleep instantly; lieutenant-class foes get drowsy.
  - **R `Skull Pill`** — placebo: 0 effect (1% chance of a tiny buff — the joke).
  - **F `Sewer Dive`** — drop into the nearest manhole and resurface at another (also escorts allies).
  - **Z `Key Ring`** — open any locked door/cell/gate.
  - **X `Stand Firm`** — trembling taunt: draws aggro, big damage reduction, can't move.
  - **G `Field Hospital`** — open the pack: healing station zone.
  - **C:** a tiny green shimmer (his flare intimidates nobody — gag).
  - **T (auto at full gauge):** *"Mitase"* → **Akeiro Hisagomaru**; **V `Sosoge`** — release all stored wound-damage as one red Cero-like slash/beam scaled by the gauge (anime-derived).
- **AI notes:** Escort/healer AI: follows the party, heals the lowest HP, flees fights, hides in sewers; trips at bad moments (and accidentally knocks enemies over); never initiates combat unless cornered.
- **Callouts:** "Yamada Hanatarō desu!" · "Mitase, Hisagomaru." · (anime spirit) "Sosoge!"

---

## 9. Isane Kotetsu (虎徹 勇音) — Captain, 4th Division (ex-Lieutenant under Unohana)

- **Wiki:** https://bleach.fandom.com/wiki/Isane_Kotetsu · /Anime_Continuity · Kakushitsuijaku · Tenteikūra · Retsu Unohana · battles: *Isane Kotetsu & Tetsuzaemon Iba vs. Ashisogi Jizō* (anime); *Yachiru Kusajishi vs. Guenael Lee*; *Kenpachi Zaraki vs. Gremmy Thoumeaux*
- **Roster tier:** **C** (promote to **B** if the game wants a dedicated healer/support class — she is the best healer available after Unohana).
- **Canon power:** **4/10** as lieutenant (captain-rank later, no new feats → 5/10) — Ichigo took her down "more lightly" than the other two lieutenants; second-best healer of the 4th Division; physically very strong (Klub Outside #883: snapped a bokken in two at the academy chasing off a man pestering Kiyone).
- **Body:** 187 cm → **60 vox**; 70 kg. Tall, long-limbed, well-endowed, shy slight stoop (self-conscious about her height). Silhouette keys: **short, messy silver hair** with **two thin shoulder-length braids on the right side** and **two more at the back**, **thin dangling red earrings**, Itegumo on the left hip.
- **Palette (hex estimates):**
  - Skin `#F6DFD3` · hair silver `#C7CCD3` (shade `#9EA5AF`) · eyes gray `#8B9098` · earrings red `#C62828`
  - Armband 四 + bellflower (Lt. era), accent `#CC8899`
  - Itegumo: handle deep blue `#1E3A8A`, pointed round snowflake-like guard silver `#C3CAD2`, blade `#D5D9DE`; Shikai side blades `#D5DBE2`
  - Ice/healing-frost (ability visual — **extrapolation**): `#BFE8FF`, core `#F2FBFF`
  - Kakushitsuijaku glow blue `#4FA3FF` · Tenteikūra arm markings black powder `#111111`, network glow (colour unstated) cyan-white `#BFF6FF`
  - Captain look: haori `#F5F5F2` with 四; wide white cloth belt `#F2F1EC`
  - Reiatsu: not stated → pale ice-blue `#CFEFFF` (proposal)
- **Look by form/outfit:**
  - **Lieutenant (default):** as above; when with Unohana she often carries **Minazuki over her shoulder by its rope** (canon: Unohana's sword is carried tachi-style or by Isane).
  - **19 months after Aizen:** hair cut shorter and scragglier.
  - **Captain (10 years after Yhwach):** hair straight and smooth (side braids kept), white captain's haori, large white cloth belt like Unohana's.
  - *Anime-only:* Reigai-Isane (enemy variant; Shakkahō, Tenran).
- **Weapons:** **Itegumo (凍雲, Frozen Cloud; Viz: Frozen Snow)** — katana with a deep-blue handle and a pointed, round, snowflake-like guard (~100 cm → 32 vox). **Shikai — "Hashire, Itegumo"** (奔れ, Run): **two smaller blades sprout from the hilt at 45°** (a three-pronged silhouette near the guard). Kubo (Klub Outside #666): an **ice-type Zanpakutō with healing properties** — no technique is ever shown.
- **Forms & states:** 1. Sealed · 2. Shikai · Bankai not revealed · captain look (post-war skin).
- **Abilities (complete):**
  - `Kaidō` — second only to Unohana in the 4th Division (Nanao rates herself below her); known for speed of treatment (Hueco Mundo, TYBW field hospital, Urahara's lab). [Heal/Reject]
  - `Bakudō #58 Kakushitsuijaku` + `Bakudō #77 Tenteikūra` — on Unohana's order she tracked the fleeing Aizen and broadcast the truth about the traitors to everyone in Soul Society, Ryoka included (spell pages list her for both). [Sensing(map lock), team broadcast] `[NEW: TeamBroadcast]`
  - `Healing barrier` — the force field she raised around the wounded captains during the second invasion (Gremmy still slipped inside). [Shield + Field(heal)] `[NEW: HealingBarrierZone]`
  - `Shunpo` — keeps up with Unohana; leapt down to catch the falling Rose and Kensei when Gremmy raised the building. [Mobility]
  - `Strength` — very strong for her build (bokken snapped). [MeleeArc(smash) bonus]
  - `Itegumo` — ice + healing (*unshown*; see kit).
  - *Anime-only:* `Hadō #1 Shō` (knocked Ashisogi Jizō away), `Hadō #31 Shakkahō` (hit Haineko's ash cloud), blocked Ashisogi Jizō's chest blades (both legs paralysed by the hit).
- **Passives & weaknesses:** + elite healer; + tall reach. − Shy and hesitant (apologises to holograms); − impulsive against hopeless foes (wanted to chase Aizen); − nightmares (kamaboko — gag); − Itegumo's real power is undocumented.
- **Signature moments to recreate:** chase after Renji with Sasakibe and Ōmaeda → *"Hashire, Itegumo"* → downed by Ichigo; Central 46 with Unohana facing Aizen; **Kakushitsuijaku + Tenteikūra broadcast** (story beat: the whole map lights up); Hueco Mundo triage; TYBW field hospital with Yachiru (Guenael, Gremmy, catching Rose & Kensei); learning of Unohana's death from Kenpachi; captain's haori 10 years later; *anime-only:* with Iba vs Ashisogi Jizō, Haineko and Tobiume.
- **Kit proposal:**
  - Shift: Shunpo. LMB: long-reach katana chain (tall); forward = long thrust, back = rising cut, air = descending slash, sprint = dash cut. Hold LMB: strength overhead (guard break — the bokken story).
  - **Q `Shakkahō`** (anime) / in Shikai **`Frost Run`** (*extrapolation* from "Run" + ice: dashing slash leaving a chilling trail).
  - **E `Shō`** (anime) — knockback flick to peel enemies off allies.
  - **R `Kakushitsuijaku`** — powder circle, then all enemies' coordinates are revealed on the map for a while.
  - **F `Tenteikūra`** — broadcast: shares every revealed mark with the whole team + short "coordinated" buff (game).
  - **Z `Healing Barrier`** — dome that heals allies inside and blocks attacks from outside (breakable).
  - **X `Kaidō`** — strong single-target heal / revive.
  - **G (Shikai) `Frozen Cloud`** (*extrapolation* from the name + "ice with healing properties") — cold mist aura: allies inside regenerate and have bleeding sealed with frost; enemies are chilled/slowed.
  - **C:** ice-blue flare. **V `Itegumo — Frozen Cloud`** (*extrapolation*) — a large icy cloud field: heals allies, freezes enemies and water, frosts the terrain.
  - **Tab:** Shō, Shakkahō (anime) + generic Bakudō for a 4th-Division officer (Seki, Tōzanshō — *extrapolation*).
- **AI notes:** Medic first: stays behind the line, heals the most wounded, raises the barrier when allies drop; will rush a foe she cannot beat if her captain/sister is threatened. Tells: draws powder circles before Kakushitsuijaku; apologises when hit.
- **Callouts:** "Hashire, Itegumo!" · "Bakudō no gojūhachi — Kakushitsuijaku." · "Bakudō no nanajūnana — Tenteikūra." · (anime) "Hadō no ichi — Shō!" · "Unohana-taichō!" · "Kiyone!"

---

## 10. Tetsuzaemon Iba (射場 鉄左衛門) — Captain, 7th Division (ex-Lieutenant under Komamura) · President, Shinigami Men's Association

- **Wiki:** https://bleach.fandom.com/wiki/Tetsuzaemon_Iba · /Anime_Continuity · battles: *Ikkaku Madarame vs. Tetsuzaemon Iba*; *Renji Abarai vs. Tetsuzaemon Iba* (anime); *Isane Kotetsu & Tetsuzaemon Iba vs. Ashisogi Jizō* (anime)
- **Roster tier:** **C** — yakuza-flavoured brawler-swordsman; good secondary NPC for Komamura / Ikkaku stories.
- **Canon power:** **4/10** as lieutenant (captain-rank later, feats unchanged → 5/10) — duels Ikkaku as a regular sparring partner; **cut a building in half with one slash of a short blade**; trained every Shinigami art to make lieutenant; blasted away by Ayon's Cero.
- **Body:** 182 cm → **58 vox**; 68 kg. Lean, wiry, square-shouldered swagger (yakuza look; speaks Hiroshima dialect). Silhouette keys: **black sunglasses**, **cigarette**, a **tantō hilt sticking out of the front of his robe**, a **large back tattoo of a cat on fire with the kanji 招福 (shōfuku, "inviting luck")**.
- **Palette (hex estimates):**
  - Skin `#E2B795` · hair black `#141414` · sunglasses `#0B0B0D` (lens sheen `#3A3F46`) · cigarette `#F2F2F2`, ember `#FF6A2A`, smoke `#B9B9B9`
  - Tattoo (colours unstated, **verify**): flames `#F26B1F` / `#C62828`, cat `#F3EFE6` with black linework, kanji `#151515`
  - Armband 七 + iris (Lt. era), accent `#918151`
  - Sealed tantō: red hilt `#B3202A`, no guard, blade `#D5D9DE` · Shikai falchion `#CBD1D8` with pick-like spike
  - Beaded wristband (captain era, colour unstated) dark wood `#5A3A22`
  - Captain look: haori `#F5F5F2` with 七
  - Reiatsu: not stated → smoky orange `#F28C38` (proposal)
- **Look by form/outfit:**
  - **Lieutenant (SS / FKT):** "distinctive" short black haircut (exact cut not described in the wiki — **verify against art**), sunglasses, cigarette, tantō in the robe front, armband.
  - **17 months after Aizen:** fuller moustache, new scar above the left eye, hair shaved closer with **three hairless lines** cut through it.
  - **Captain (10 years after Yhwach):** **crescent-shaped scar around the outside of the right eye**, **pompadour-like** hair, **beaded wristband on the right forearm**, captain's haori.
  - Men's Association meetings: everyone forced to dress like him (sunglasses, same uniform style) — fun NPC crowd skin.
- **Weapons:** unnamed Zanpakutō (name, abilities and command **unknown**). **Sealed:** looks like a **tantō** — red hilt, **no guard**, worn inside his uniform with the hilt showing (~40 cm → 13 vox; chapter 178 once drew it longer by mistake). **Shikai:** extends into a **falchion / broad-bladed scimitar** with a **pick-like spike a short distance below the tip** (est. 95 cm → 30 vox, blade up to 4 vox wide — **verify**).
- **Forms & states:** 1. Sealed tantō · 2. Shikai (unnamed) · Bankai not revealed · captain look. State: *11th-Division grin* (battle joy) vs *7th-Division discipline*.
- **Abilities (complete):**
  - `Zanjutsu (expert)` — ex-11th Division; regular duels with Ikkaku; **a single slash cut a building in half** despite the short blade (anime-only: he sliced a building so its top half slid onto Ashisogi Jizō; one swing knocked back Zabimaru's extended segments). [MeleeArc(cut), Slice]
  - `Hakuda (expert)` — trained in hand-to-hand "because it made becoming lieutenant easier". [MeleeArc(smash)]
  - `Kidō (expert)` — same reason; **no spell named in canon** (Brave Souls gives him Raikōhō — game). [Tab]
  - `Shunpo (expert)` — keeps up with Komamura. [Mobility]
  - `Strength` — held up the defeated Komamura (4× his weight); dragged the wounded Ikkaku away from Poww; jumped off a cliff 10 years later and left a dent where he landed. [Grab/Throw] `[NEW: CarryAlly]`
  - `Bukkomi Dogeza (特攻土下座, Full-Blast Dogeza)` — "advanced" sliding prostration: he slides in on his hands into a full bow (his late entrance at the execution morning). [Mobility (slide)] `[NEW: SlideDash]`
  - `Rod devices` — threw rods for Komamura to stop the Fake Karakura Town from reverting (FKT gadget). [Construct(anchor)]
  - `Ambush` — tried to hit Ayon from behind (it saw him with a hidden eye and blasted him with a Cero).
  - *Anime-only:* released Shikai against Renji (Amagai arc); tossed a fallen Shinigami clear of Ashisogi Jizō's poison.
- **Passives & weaknesses:** + well-rounded (every Shinigami art at expert level); + discipline doctrine — "a frontal attack that ends in defeat is meaningless", retreats to win later. − Stomach trouble (gag); − Zanpakutō unknown (no canon special ability); − ambush-prone vs multi-eyed foes.
- **Signature moments to recreate:** Bukkomi Dogeza late arrival to Komamura (comedy); **Iba vs Ikkaku** duel → sharing sake → rock-paper-scissors for the high ground, interrupted by Isane's Tenteikūra; lunging at Aizen inside the Negación light (Yamamoto stops him); FKT: rods for the pillars, dragging Ikkaku from Poww, lecturing Ikkaku about hiding his Bankai, ambush on Ayon; cut down by "Momo" (Aizen's illusion); TYBW: rallying with the 7th Division when Yamamoto takes the field, carrying the wolf-form Komamura, Shikai vs a Soldat platoon; captain, leaping from the training cliff.
- **Kit proposal:**
  - Shift: Shunpo; double-tap with lock-on = appear behind and grab collar (yakuza headbutt opener).
  - **Sealed:** LMB tantō stabs + brawling (punch-punch-stab-kick); forward = shoulder charge stab, back = knee launcher, air = elbow drop, sprint = flying kick. Hold LMB: **Building Splitter** — one huge horizontal cut that slices a structure in two despite the tiny blade.
  - **Shikai** (T: command unknown → a growl as the blade extends): LMB heavy falchion chops; forward = hooking lunge using the spike (pulls the target in — *extrapolation from the shape*); hold LMB: Building Splitter with Shikai reach.
  - Slots Q–X below are shared by both forms (Shikai only adds reach and the hook).
  - **Q `Kidō`** (unnamed in canon → Raikōhō from Brave Souls / generic Hadō from the Tab wheel).
  - **E `Hakuda Combo`** — 5-hit fist/knee string.
  - **R `Anchor Rods`** — plant rods that lock an area (blocks enemy teleport/terrain swaps inside — *extrapolation* of the FKT rods).
  - **F `Bukkomi Dogeza`** — low sliding prostration: passes under high attacks, knocks down what it hits.
  - **Z `Shoulder Carry`** — pick up/drag a downed ally out of combat.
  - **X `Smoke Break`** — light a cigarette: small stamina regen (gag).
  - **G `11th Division Grin ↔ 7th Discipline`** — grin: +damage, −defence, no retreat; discipline: +defence, AI-style tactical retreats.
  - **C:** smoky-orange flare. **V `Kenka Cleaver`** (*extrapolation*) — Shikai super-slash that splits a building and everyone in front of it.
  - **Tab:** generic Kidō (Raikōhō, Shakkahō, Sai, Hainawa — *extrapolation*) + gadgets (rods, sake bottle: duel-rival buff vs Ikkaku).
- **AI notes:** Sensible brawler: protects his captain, closes distance fast, pulls wounded allies out, retreats when a fight is clearly lost (then comes back). Rival mode vs Ikkaku: grins, drops guard, fights to the end. Tells: pushes his sunglasses up before a Building Splitter; flicks the cigarette away when he gets serious.
- **Callouts:** "Bukkomi Dogeza!" · "Komamura-taichō!" · (no Shikai command exists in canon — give him a wordless release grunt)

---

## 11. Engine needs beyond the brief's primitive list (`[NEW: …]` roll-up)

| Tag | What the engine must support | Used by |
|---|---|---|
| `TrapNetwork / IgnitionPropagation` | Player-placed latent nets (spline/graph between anchor points) that persist, snare on contact and **detonate along every connected strand** when any fire-tagged effect touches them (strand-shaped voxel cuts) | Momo (Fushibi, V) |
| `TrapConcealment` | Hide placed traps from enemy rendering, AI perception and sensing while a stealth effect is active | Momo (Kyokkō) |
| `SpellCombo` | Deferred/queued spell execution (cast now, release later together) + one cast split across two locked targets | Momo (G Spell-weave) |
| `ElasticConstruct` | Trampoline/cushion construct anchored by ropes: absorbs falls, stores and returns impulse, stacks with explosion impulse for launches, can slingshot bodies | Momo (Tsuriboshi) |
| `SteerableTether` | Caster-held binding rope with physics: steer the captured body, tie two captured bodies together, slam them into each other/terrain | Momo (Hōrin, anime) |
| `MemoryWipe` | Status that clears the victim's lock-ons, markers and short-term AI memory | Momo (Hakufuku); also counters Guenael-type foes |
| `ReiatsuSignature` | Every entity emits a sensing signature that can be suppressed to ~0 (feign death, minimap/AI invisibility) or fingerprinted (match two signatures) | Chōjirō (G), Yachiru (detection) |
| `BarrierGate` | Large dome barriers whose owner can open/close doorways and let specific entities through | Chōjirō (Fake Karakura barrier) |
| `BankaiTransfer` | A form can be stolen mid-match and appear in another character's kit with a stat multiplier and palette swap | Chōjirō → Driscoll Berci |
| `SkyAnchoredArenaStructure` | Persistent arena-scale construct high above the map (dome) with emissive pillars that interact with terrain and characters | Chōjirō (Kōkō Gonryō Rikyū) |
| `WeatherSystem` | Cloud layer, darkness, rain, lightning strikes targeted by abilities; weather modifies elemental damage | Chōjirō (Bankai), Gonryōmaru spirit (anime) |
| `ChargeFromEnvironmentObject` | Weapon charge state gained by touching/dragging along a world object (pillar) | Chōjirō (Lightning Infusion) |
| `TopDownTargetPainting` | Alternate camera mode for painting multiple ground targets with the mouse, then releasing | Chōjirō (G Conductor View) |
| `FlailChainPhysics` | Tethered heavy weapon: rope/chain sim, momentum transfer (pull the wielder), spin-shield, retract | Ōmaeda (Gegetsuburi) |
| `WeaponDurability` | Weapon crack/shatter states driven by the attacker's power class | Ōmaeda |
| `MountEnemy` | Teleport onto and ride/stand on another character's shoulders/head (free hits, short ride) | Ōmaeda, Yachiru |
| `CarryAlly` | Pick up and carry 1–2 allies (or drag a downed one) while moving/leaping | Ōmaeda, Yachiru, Iba, Nemu |
| `LimbSever / Regrow` | Voluntarily cut off a limb (or an item) to stop a spreading status; regrow with an item | Ōmaeda (cut away), Nemu (arrow arm + Hojiku-Zai) |
| `FactionKeyedBarrier` + `BarrierErodedByAbsorption` | Barrier that is absolute against one power family (Quincy-tagged) and only slowly drains when that faction absorbs reishi from it | Nanao (Hakudan Keppeki) |
| `MultiPlateBarrier` | Barrier made of many independently breakable plates (and optional regrowth) | Nanao (hex wall) |
| `TagBasedReflection (divine)` | Absorb/disperse/reflect only attacks tagged "divine/god-class" (Vollständig, some Schrift ultimates), with self-damage spill; blade hidden from divine foes | Nanao (Shinken Hakkyōken) |
| `FearAura` + `SelfScreenBlur` | Cone fear status on enemies while the caster's own view blurs | Nanao (glasses off) |
| `PortalGate` | Build/open portals (Senkaimon, Garganta via pillar device) for a team | Nanao (anime), Nemu |
| `LiftWorldChunk` | Rip a destructible chunk (column, block) out of the world and throw it | Nemu |
| `ProjectileCatch` | Grab a projectile mid-flight (then hold/redirect/drop) | Nemu |
| `OnAbsorbedPayload` / `OnEatenOvergrowth` | Reactive effects when an enemy absorbs, devours or invades the character's body (drug statuses, explosive overgrowth) | Nemu |
| `TimedOverdriveWithCollapse` | Form with a hard timer that ends in a forced collapse state | Nemu (0.8% threshold) |
| `SoulSacrificeCost` | Ability paid with permanent max-HP loss for the match | Nemu (Gikon Jūrinjū) |
| `ReishiFixerGrenade` | Timed device that freezes projectiles/bombs without detonating them and then switches off reishi effects (incl. voxel breaking/repair) in a radius | Nemu |
| `SuccessorRespawn` | On death, respawn as a different (successor) character model/kit | Nemu → Hachigō Nemuri |
| `AttackEcho (timed offsets)` | Summons that mirror the owner's attack with configurable pre/post delays and their own hitboxes | Yachiru (Sanpo Kenjū) |
| `InstinctCounterIgnoresStealth` | Auto-counter state that triggers on hostile intent even against invisible/memory-erasing enemies, stacking speed | Yachiru |
| `ShapedAuraDecal` | Reiatsu aura rendered as a specific shape (giant angry cat face) | Yachiru |
| `DamageInversionWeapon` + `StoredDamageGauge` | Weapon hits heal instead of damage, filling a gauge by HP healed; full gauge auto-transforms and discharges the stored amount as damage | Hanatarō (Hisagomaru) |
| `SewerNetworkTraversal` + `KeysAndLocks` | Underground network of linked entry points for travel/escorts; lockable doors/cells openable by key items | Hanatarō |
| `HealingBarrierZone` | Dome that heals inside and blocks from outside | Isane |
| `TeamBroadcast` | Team-wide sharing of revealed enemy positions + a coordinated buff | Isane (Tenteikūra) |
| `SlideDash` | Low-profile slide that passes under high attacks and knocks down | Iba (Bukkomi Dogeza) |
| `DecalOnVoxel` | Texture decals on voxel faces for text/emblems that can't be voxel-legible (armband kanji + flower) | all lieutenants |

**Reuse wins:** Kōkō Gonryō Rikyū is one build for Chōjirō *and* Driscoll; the Tobiume / Gonryōmaru / Gegetsuburi / Hisagomaru spirits and the Reigai copies (Hinamori, Ōmaeda, Nanao, Isane, Nemu) are palette/AI variants of these kits; the Kidō table in §1.1 is shared with every Kidō user in other roster files.

---

## 12. Gaps, unverified items and things I could not find

- **Momo — Gochūtekkan / Sajō Sabaku:** not attested for her anywhere on the wiki (spell pages list Hachigen, Urahara, Hisagi, Kira, Unohana, etc.; her manga and anime-continuity pages never mention them). They are in her Tab wheel only as an *extrapolated library*. Her canon "chained/delayed" Kidō is specifically the **pre-laid Fushibi net hidden with Kyokkō and ignited by fire**; the anime adds one-cast-two-targets (Hōrin). **Hakufuku** is credited to her by the wiki but I found no scene context.
- **Momo — TYBW-anime content:** the Tsuriboshi launch pad and the fireball into Gerard's mouth appear on the Gerard battle page but not in her (manga-based) plot summary → treated as TYBW-anime additions. Verify her TYBW hairstyle (wiki: bob with left clip from 17 months after Aizen), bun-cloth colour, scabbard colour and Shikai prong placement against art.
- **Chōjirō:** rapier guard design, reiatsu colour, Bankai dimensions and his 1,000-years-ago look are not described; the infusion slash is unnamed (my V names are extrapolations).
- **Ōmaeda:** hair style, ball/chain size not given; the "Marechiyo Chop" is mentioned but never shown.
- **Nanao:** Shinken Hakkyōken's size is only "medium-sized"; the hex-plate wall is unnamed and its colour unstated; book/fan colours unstated; reiatsu colour unknown. Her anime-only spells come from the spell pages' practitioner lists (scenes for Hyapporankan/Tenran not checked).
- **Nemu:** the TYBW shadowless outfit design isn't described; braid length, Hachigō Nemuri's height and the full drug list are unknown.
- **Yachiru:** no release command exists; beast sizes are not given (estimates: Lumpy ≈ 1.2 m / 38 vox, round; Boney ≈ 2.4 m / 77 vox, gaunt — **verify**); hair-clip and wheel designs unstated.
- **Hanatarō:** the manga/databook only says Akeiro Hisagomaru auto-releases into a scalpel; the stored-damage discharge comes from the anime continuity (Cero-like slash) and the anime spirit (chest cannon, "Sosoge"). Medical-pack design unstated.
- **Isane:** Itegumo's powers are never shown (only "ice-type with healing properties", Klub Outside #666); Bankai unrevealed; all Itegumo kit effects are extrapolations.
- **Iba:** Zanpakutō name, Shikai command and ability unknown; no Kidō spell named; SS-era haircut and tattoo colours need reference art.
- **All:** reiatsu colours are canon only for Momo (red, anime), Ōmaeda (pink) and Yachiru (pink); armband plaque design is modelled from the anime look, not a wiki description.

