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
    - `Bakudō #26 Kyokkō (曲光, Bent Light)` — **exclusive**: bent light hid her body and reiatsu (how she got next to Apacci) and masked the net's reiryoku. [Sensing/Stealth] `[NEW: TrapConcealment]`
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

<!-- C2-APPEND -->
