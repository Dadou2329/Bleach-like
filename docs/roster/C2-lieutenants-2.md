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
  - **Bankai (T from Shikai):** *"Bankai — Kōkō Gonryō Rikyū!"* — cinematic: clouds → bolt from the tip → dome + pillars; the arena darkens and rain starts. Field passive: pillars ring the fight (touch = heavy shock; where they meet terrain they bore vertical shafts).
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

<!-- C2-APPEND -->
