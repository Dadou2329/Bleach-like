# Roster C1 — Lieutenants & 11th Division officers

Design dossiers for six Gotei 13 officers: **Renji Abarai** (6th Division lieutenant — whip-sword Shikai plus *two* Bankai: the "unrealized" Hihiō Zabimaru and the true Sōō Zabimaru), **Ikkaku Madarame** (11th Division 3rd Seat → lieutenant — naginata/three-section staff and the secret, self-escalating Bankai Ryūmon Hōzukimaru), **Yumichika Ayasegawa** (11th Division 5th → 3rd Seat — the decoy Shikai Fuji Kujaku and the hidden, draining true Shikai Ruri'iro Kujaku), **Shūhei Hisagi** (9th Division co-lieutenant — chained twin sickles Kazeshini, novel-only Bankai Fushi no Kōjō), **Izuru Kira** (3rd Division lieutenant — weight-doubling Wabisuke) and **Rangiku Matsumoto** (10th Division lieutenant — ash-blade Haineko).

Conventions used below
- Heights → voxels at **32 vox/m** (the brief's constant), rounded; the figure in parentheses is the **48 vox/m** density that `docs/research/lookdev` recommends for faces — use whichever the pipeline settles on.
- Hex colors are **estimates** from the anime palette unless stated; anything marked **(verify)** must be checked against reference art before modeling.
- Engine tags use the brief's primitive vocabulary in `[brackets]`. Needs **not** covered by the brief's list are tagged `[NEW: …]` and collected in the section *Engine features beyond the brief* near the end.
- Canon labels: unmarked = manga canon. **anime-only**, **movie-only**, **novel** (Expanded Universe, e.g. *Can't Fear Your Own World*, not manga canon) and **game-origin** (named by licensed video games) are flagged. Game-origin moves are offered only as optional fillers, never as canon.
- Sources: the bleach.fandom.com pages listed per character, pulled through the MediaWiki API (`tools/wiki_fetch.py`), plus battle/technique pages. Everything is paraphrased.
- Kidō callouts follow the in-series pattern "Hadō no sanjūichi — Shakkahō".

---

## Quick reference

| Character | Rank (latest) | Height → vox @32 (@48) | Lieutenant badge / division flower | Sealed sword ID | Shikai (command) | Bankai | Reiatsu | Tier |
|---|---|---|---|---|---|---|---|---|
| Renji Abarai | Lieutenant, 6th Div. (ex-6th Seat, 11th) | 188 cm → **60** (90) | **Not worn** (canon). 6th = camellia | jagged rectangular **bronze** guard, **red** hilt, **red** sheath | Zabimaru — *"Hoero"* (Howl) | Hihiō Zabimaru (false name) → **Sōō Zabimaru** (true) | light red → **gold** in Sōō Zabimaru | **S** |
| Ikkaku Madarame | 3rd Seat 11th → Lieutenant 11th (epilogue) | 182 cm → **58** (87) | only in the 10-years-later epilogue, left arm. 11th = yarrow | **oval** guard with three teardrops in relief top & bottom; carried in hand with the **sheath in the other hand** | Hōzukimaru — *"Nobiro"* (Grow/Extend), then *"Sakero"* (Split) | **Ryūmon Hōzukimaru** (kept secret) | red | **A** |
| Yumichika Ayasegawa | 5th → 3rd Seat, 11th Div. | 169 cm → **54** (81) | none (seated officer) | bronze **cross-pattée** guard, **purple** hilt, **fuchsia** sheath | Fuji Kujaku — *"Sake"* (Bloom) · true name Ruri'iro Kujaku — *"Sakikurue"* (Split and Deviate) | none | green | **B** |
| Shūhei Hisagi | Co-lieutenant, 9th Div. | 181 cm → **58** (87) | upper **left** arm. 9th = white poppy | **octagonal** guard | Kazeshini — *"Kare"* (Reap) | manga: claims mastery, never shown · **novel:** Fushi no Kōjō | green (anime/novel) | **A** |
| Izuru Kira | Lieutenant, 3rd Div. | 173 cm → **55** (83) | upper **left** arm. 3rd = marigold ("despair") | plain rectangular guard with an **Ω** motif top & bottom | Wabisuke — *"Omote o agero"* (Raise your head) | none (not achieved) | blue (anime) | **B** |
| Rangiku Matsumoto | Lieutenant, 10th Div. | 172 cm → **55** (83) | worn **on the sash at the waist, tied in a bow**. 10th = daffodil | **cat-head** guard, **dark red** hilt; sword clipped **horizontally across the back** of the obi | Haineko — *"Unare"* (Growl) | none (training) | white (anime) | **A** |

---

## Shared baseline (applies to all six)

**Racial / Gotei 13 basics** — per-character sections only list deviations.
- `Shunpo (瞬歩, "flash step")` — Shift. Wiki skill tiers: **Renji and Hisagi = expert**; Ikkaku, Yumichika, Kira, Rangiku = practitioner (still fast: Kira appeared behind an Arrancar, Yumichika behind Ganju before he could react, Rangiku outmaneuvered a lieutenant-level Arrancar). Double-tap Shift on lock-on = appear behind. [Teleport, Mobility, Afterimage/Clone]
- **Air-standing** on reishi; Ikkaku visibly stops a fall in mid-air (Hohō) vs Edrad. Space/Ctrl. [Mobility]
- **Silent release** — once a wielder has Bankai, Shikai can be released without calling its name (Renji did this vs Byakuya, which tipped Byakuya off). After Bankai is unlocked, tapping T may skip the callout for a faster release. [Transform]
- `Gentei Reiin (限定霊印) / Gentei Kaijo (限定解除, "limit release")` — captains and lieutenants entering the Human World carry a seal shaped like their division flower that holds back ~80% of their power; once Soul Society authorizes it, the seal dissolves in a column of reiatsu and their strength is multiplied by five. Renji's released pressure alone burned the tip off Yylfordt's horn; Rangiku showed her seal **on her chest** before releasing vs Nakeem (Renji's seal location is not shown in the fetched text → verify). **Game:** G toggle that exists only in Human-World/Arrancar-arc contexts — flower decal glows and vanishes, reiatsu column, ×5 damage. [Stance, Blast, NEW: LimiterState]
- `Kaidō (回道)` — every academy graduate learns basics; **Kira** is the only genuine healer here (ex-4th Division). Kubo (Klub Outside) names **Renji and Ikkaku** as officers who *can't* heal physical wounds with it.
- `Jinzen (刃禅)` — sword meditation (Yumichika and Rangiku do it in the Arrancar arc; Yumichika tries to snap his blade afterward). Non-combat training scene.
- **Zanpakutō spirits** — Zabimaru manifests in the manga; the other five are **anime-only** (Zanpakutō Unknown Tales / Beast Swords arcs). Good material for "subdue your blade" trial bosses, optional summons or alt-skins. Each spirit is summarized in its owner's dossier.
- **Reigai doubles** (**anime-only**, Gotei 13 Invading Army arc) — artificial copies of officers; the fetched pages show Reigai-Renji, Reigai-Ikkaku, Reigai-Hisagi and Reigai-Izuru Kira fighting their originals' friends. Cheap mirror-match enemies: same kit, desaturated palette.

**Uniform & insignia spec**
- **Shihakushō:** black kosode + black hakama `#16161A` (shadow `#0C0C0E`, sheen `#2A2A31`), white shitagi showing at the collar `#EDEDED`, white hakama-himo ties `#E6E6E6`, white tabi `#F2F2F2`, straw waraji `#CDB78A` with white thongs `#EFEFEF`. The division emblem is inside the kosode (not visible). **All 9th Division members wear sleeveless kosode** (Hisagi).
- **Lieutenant badge** (副官章, "armband"): a small rectangular plaque carrying the division number in kanji and the division flower, lashed to the **upper left arm** with a white cloth band (it's only strictly required at meetings). Exceptions in this file: **Rangiku** wears it on her sash at the waist tied in a bow; **Renji** doesn't wear it at all; **Ikkaku** only in the epilogue; **Yumichika** has none. Model: plaque ≈10×6 cm → 3×2 vox @32 (5×3 @48) — put the kanji + flower on a **decal**; plaque face cream `#EFE6CF`, rim dark wood `#6B4A2B`, ink `#151515`; band `#F3F3F3` with a knot and two short tails. (verify plaque design)
- **Division flowers** (badge decal + Gentei Reiin seal). Only the 3rd Division's marigold = "despair" is stated in the fetched pages (Kira says it); the rest come from series lore → (verify):

  | Div. | Flower | Meaning | Wearer here |
  |---|---|---|---|
  | 3rd | Marigold (金盞花) | despair | Kira |
  | 6th | Camellia (椿) | noble reason | Renji |
  | 9th | White poppy (白罌粟) | oblivion | Hisagi |
  | 10th | Daffodil / narcissus (水仙) | mystery, egoism | Rangiku |
  | 11th | Yarrow (鋸草) | fight | Ikkaku, Yumichika |

**Kidō used by this group** (Tab-wheel entries; no-incantation unless noted)

| Spell | Users here | Look & effect | Tags |
|---|---|---|---|
| Hadō #11 `Tsuzuri Raiden (綴雷電, "bound lightning")` | Hisagi | runs an electric current through any object the caster touches — sword, or **Kazeshini's chain** — hurting whoever touches that object | [Status (paralysis), NEW: Conduction] |
| Hadō #31 `Shakkahō (赤火砲, "red fire cannon")` | Renji, Kira; **anime:** Rangiku, Yumichika | crimson fireball, size scales with power; blast or pillar; can be tuned into a light source | [Projectile orb, Blast] |
| Hadō #57 `Daichi Ten'yō (大地転踊, "upturned earth dance")` | Yumichika | thrust hands out → nearby objects levitate and are flung where he chooses; accurate enough to swat incoming projectiles | [Grab/Throw, Projectile, NEW: DebrisTelekinesis] |
| Hadō #58 `Tenran (闐嵐, "vigorous tempest")` | Kira (**anime:** Rangiku) | the sword floats and spins like a fan, then a widening tornado blast fires forward (a hand can replace the sword) | [Projectile (wind cone), Field, NEW: DebrisTelekinesis] |
| Bakudō #4 `Hainawa (這縄, "crawling rope")` | **anime:** Renji, Yumichika | crackling yellow rope thrown to bind arms and torso | [Bind] |
| Bakudō #37 `Tsuriboshi (吊星, "suspending star")` | Kira | blue ball shoots six cords to anchors and flattens into an elastic catch-net; **anime:** used to snare Kazeshini's spirit | [Construct, Bind] |
| Bakudō #39 `Enkōsen (円閘扇, "round lock fan")` | Kira | dull-yellow spinning disc shield in front of the caster | [Shield] |
| Bakudō #62 `Hyapporankan (百歩欄干, "hundred-step railing")` | Hisagi | a blue-white rod thrown at the target splits into ~100 rods that rain down and pin it to a surface | [Bind, Projectile multishot] |
| Bakudō #63 `Sajō Sabaku (鎖条鎖縛, "locking bondage stripes")` | Hisagi (listed user); **anime:** Kira | palm → fist, a thick yellow rope binds the upper body; raw strength alone shouldn't break it | [Bind] |
| Bakudō #73 `Tōzanshō (倒山晶, "inverse mountain crystal")` | Kira | blue energy rises from one point to four corners → inverted-pyramid barrier around the caster; can also cage others | [Shield, Construct, Bind] |
| Bakudō #77 `Tenteikūra (天挺空羅)` | Rangiku | telepathic broadcast to chosen listeners in an area; glowing rectangle with root-like threads | [Sensing, NEW: TeamComms] |
| `Kaidō (回道)` | Kira | green palm glow heals wounds and reiatsu | [Heal/Reject] |
| `Jigoku no Kidō (地獄鬼道)` | Renji — **movie-only** (*Hell Verse*) | special spell from Yamamoto: blue charm of two concentric diamonds, golden glyphs snake down the arms, target is forcibly ejected from Hell | [Teleport (banish), Status] |

---

## Renji Abarai (阿散井 恋次) — Lieutenant, 6th Division (former 6th Seat, 11th Division)

- **Wiki:** https://bleach.fandom.com/wiki/Renji_Abarai · technique pages: Higa_Zekkō, Hikotsu_Taihō, Hihiō, Orochiō, Zazekka, Hihi_Tenshō, Sōō_Zabimaru,_Zaga_Teppō, Sōō_Zabimaru,_Zagai_Zekkō, Reiatsu_Ropes · Zabimaru_(Zanpakutō_spirit) (+ /Anime_Continuity) · Renji_Abarai/Anime_Continuity · battles: Renji Abarai vs. Byakuya Kuchiki; Renji Abarai vs. Yylfordt Granz; Renji Abarai vs. Mask De Masculine; Renji Abarai vs. Uryū Ishida
- **Roster tier:** **S** (core, ship first). Main cast, three very different weapon states (whip-sword → giant bone snake → compact "twin kings" gauntlet with a giant ghost arm), dozens of named techniques, and the best showcase in this file for tether physics + destructible terrain.
- **Canon power (1–10):** **7** at TYBW peak (≈**5.5** pre-timeskip). After Royal Guard training his *Shikai alone* deflected Mask De Masculine's Star Flash and overpowered a Sternritter who had just crushed two Bankai-using captains; his elbow cratered the street; Sōō Zabimaru broke Mask's arm and burned him to an ash husk; traded heavy blows with a partially Vollständig Uryū (Zagai Zekkō leveled dozens of buildings); stood up to Soul-King-empowered Yhwach's pressure. Pre-timeskip: forced Byakuya to one knee with Hihiō Zabimaru, killed Yylfordt; lost to Byakuya, Aizen, Yammy and (first invasion) Mask.
- **Body:** 188 cm / 78 kg → **60 vox** (90 @48). Tall, broad-shouldered, long-limbed, lean-muscular; head ≈ 1/7.5 of height; cocky forward lean. The spiky ponytail adds ~20–25 cm above the skull — keep it outside the height budget. Silhouette keys: **crimson "pineapple" ponytail**, a **forehead band** (white / maroon / tiger-stripe by era) or goggles, **tattooed jagged brows**, black tribal tattoos down neck/chest/arms, long segmented blade.
- **Palette (hex estimates):**
  - Skin `#E9BA90` (shade `#C99671`, deep `#A8765A`) · hair crimson `#C7202F` (shadow `#871321`, highlight `#E84652`), hair tie white `#F2F2F2` (verify) · eyes brown `#6B3B26` (anime reads red-brown) · tattoos `#141414`.
  - Headgear: pre-timeskip headband white `#F4F4F4`; Agent-arc sunglasses frame `#222226`, dark lenses `#2E2A2A` (verify); post-timeskip bandana maroon `#6E1A22` (shade `#4B1016`); wrist straps `#2B2B2E`; forearm bandages `#E8E2D6`.
  - Off-duty yukata `#F5F2EE` with pink florals `#E89AB0`, dark-gray sash `#4A4A4E`.
  - Ōken clothing (TYBW, colors verify): tiger-stripe bandana + jacket base ochre `#D9962A` with black stripes `#1A1A1A`, fur hem `#EEE7D8`, visor black `#111114` (gloss `#5A5F66`), double-breasted cape white `#F2F2EF`.
  - Zabimaru sealed: guard bronze `#9C6B2E` (edge highlight `#C89A55`), hilt wrap red `#A3192A` over pale ray-skin `#EDE7DA`, sheath red lacquer `#8C1622` (highlight `#C2343A`). (The anime spirits' copy of the Shikai has a black hilt — Renji's is red.)
  - Shikai blade steel `#C9CDD2`, edge `#EEF1F4`, dark spine & pick-teeth `#8B9096`, connecting thread `#A9AEB4` (game option: faint red reiatsu line `#FF6B6B` when stretched).
  - Hihiō Zabimaru: bone `#E6DCC4` (shade `#B9AC8E`, crevice `#8E8268`), **mane red** `#B5232E` (dark `#7E1620`); Renji's Bankai garb: furred pauldrons red-brown `#9E2B2B` (verify), baboon skull `#EEE6D2`, tooth necklace `#F2EAD8` on dark cord `#3A2A22` (verify).
  - Sōō Zabimaru: skull gauntlet `#EDE5D0`, fur ruff at its base red `#B3262B`, **cowl & Hihiō fur green** `#6F9E7C` (dark `#4C7559`, tips `#9CC3A3`) — the wiki states green; matches the green-furred baboon half (Saru) of the anime spirit; still verify vs the TYBW anime — shoulder disk `#E9E0C8` (nozzle `#3A2A22`, jet flame `#FF8A2A`), pauldron collar `#DDD3BC`, vertebral tail & waist cords `#E4DAC2`, blade `#CDD1D6`; Orochiō heated blade `#FF5A1F` → core `#FFC24A`.
  - Reiatsu light red `#FF6B6B` (core `#FFD1D1`); **Sōō Zabimaru: gold** `#F5C542` (core `#FFF1B8`).
  - Signature energies: Hikotsu Taihō (Hihiō Zabimaru) bright red `#FF2E2E` / core `#FFD0C8`; Hikotsu Taihō (Sōō, low-power shot) orange `#FF8A1F` / core `#FFE0B0`; Zaga Teppō burning-reishi serpent skull `#FF6A2A` (outer flame `#E2361C`, core `#FFD27A`); Zagai Zekkō flaming disc `#FF9A2E`, rim `#FFD36B`; Zazekka tip blast `#FF5A2A`; Higa Zekkō segment glow `#FF6B6B`; Shakkahō crimson `#E3262E` / core `#FFC9A0`; Kidō light warm white `#FFE9C4`; Jigoku no Kidō blue `#3F86FF` + gold glyphs `#F2C84B`.
- **Tattoo map** (all `#141414`, 1-voxel strokes; author as pixel art at 48/m): **brows** are tattoos, not hair — each a thick jagged stroke from the inner brow splitting into 2–3 points toward the temple; **forehead** marks along the hairline (normally hidden by the band; exposed when it's shredded — pattern verify); **neck**: jagged tribal bands from behind the ears down both sides to the collarbones (visible at the kosode collar); **chest/ribs**: stripes flaring across the pectorals and down the obliques; **back**: full, spine-symmetric pattern; **arms**: bands on upper arms and forearms. The tattoos grew from academy days (brows only) to full coverage. His subordinate Rikichi copies one above his left brow.
- **Look by form/outfit:**
  - **Rukongai child (Inuzuri, flashback):** ragged clothes, flat "leveled" hairline even then; part of Rukia's street gang.
  - **Shin'ō Academy (flashback):** shorter hair tied up, brow tattoos only, male academy robes (blue-and-white — verify shades).
  - **Lieutenant, pre-timeskip (main look):** high spiky ponytail with a pronounced **widow's peak**; **white headband** tied at the back (Soul Society → Hueco Mundo); in the Agent arc **sunglasses** pushed up on the forehead instead; standard shihakushō, **no badge**, Zabimaru on the left hip. **Hair-down damage state:** when Senbonzakura shreds the band, long loose hair falls past the shoulders and forehead tattoos show.
  - **Hihiō Zabimaru garb:** **furred pauldrons** with a **baboon skull on the left shoulder**, joined by a **tooth necklace**; fur also runs down the right arm; he holds the **tail end of the snake as a bone handle**.
  - **Arrancar arc (Human World):** Gentei Reiin camellia seal somewhere on the body (location verify); Gigai street clothes (cosmetic).
  - **Lost Agent / early TYBW (17 months later):** longer hair; **maroon bandana** hiding all forehead tattoos; **long dark straps wrapped on each wrist**; **bandages over the forearms**.
  - **TYBW, return from the Royal Palace:** **Ōken clothing** woven from Royal Guard bone and hair (made to survive punching through the 72 barriers): **tiger-striped bandana**, **black visor over the eyes**, **tiger-striped fur-hemmed jacket**, **white double-breasted cape** over the shihakushō. Destroyed by Mask's Star Flash: Super Nova → torn-shihakushō damage state.
  - **Sōō Zabimaru:** right forearm in a snake-skull gauntlet with a red fur ruff; a big **green fur cowl** on the left shoulder with a small round bony disk; bone **pauldrons forming an armored collar**; a vertebral tail wound loosely around the waist like a sash; extra **vertebral cords hanging from the waist**.
  - **Epilogue (10 years later):** **one long braid** down the back replaces the ponytail; married to Rukia, father of Ichika.
  - **Off-duty:** white yukata with pink flowers + dark gray sash (he wanders around in it); "Red Pineapple" shirt gag (Jinta's nickname for him).
- **Weapons:**
  - **Sealed Zabimaru** — standard katana, ~100 cm total ≈ 32 vox (blade ~70 cm / 22 vox, hilt ~25 cm / 8 vox); jagged rectangular bronze guard; red hilt; red sheath.
  - **Shikai Zabimaru** — the blade lengthens to roughly 1.3–1.5× a katana blade (~1.0–1.1 m ≈ 33–35 vox) and becomes **six segments**, each wider than the one behind it (≈3 cm at the guard to ≈9 cm at the tip; exaggerate for readability), every segment carrying **two long pick-like teeth on the cutting side and two short ones on the back**; the tip segment is a broad arrowhead. The segments ride on a **stretchable thread** — whip mode separates them with gaps; canon says the segment count can grow almost without limit (game: 25 m base reach ≈ 800 vox of chain path). Guard and hilt unchanged.
  - **Hihiō Zabimaru** — a colossal **snake skeleton**: dozens of huge vertebra segments (each ~1.5 m, estimate) mixed with the Shikai's pick-teeth, total ~30–40 m (estimate), skull **about the size of a small car** (~4 m long) ringed by a **red fur mane**; Renji holds the bony tail end as the handle. Segments are held by his reiatsu, so they can be split apart and re-joined; broken segments can stay lost (Mayuri notes the ones Byakuya destroyed never came back). Build at 8–16 vox/m and scale.
  - **Sōō Zabimaru** — (1) **right-forearm gauntlet** shaped like the upper half of a snake skull (~60 cm ≈ 19 vox) with a red fur ruff at its base; a **blade slides out of the mouth** at will (~1.2 m ≈ 38 vox; Orochiō makes it bigger and **serrated**, ~1.8–2 m); (2) a **vertebral tail** trailing from the back of the skull, normally slung round his waist, that unfurls into a long snake spine (Orochiō / Zagai Zekkō); (3) a **green fur cowl** on the left shoulder with a bony circular disk (jet nozzle) that becomes **Hihiō** — a giant skeletal, green-furred arm (~3–4 m, hand ~1 m wide; estimate) mounted on his left shoulder; (4) bone pauldron collar and hanging vertebral cords. With the blade retracted, the skull itself is a bludgeon/biter.
- **Forms & states (ordered):**
  1. **Sealed** — katana + brawling + weak Kidō.
  2. **Shikai** — *"Hoero, Zabimaru"* (咆えろ, "howl"); silent release possible once Bankai is learned.
  3. **Bankai (false name): Hihiō Zabimaru (狒々王蛇尾丸, "baboon king snake tail")** — torrent of reiatsu and a dust storm, then the bone snake; slower, huge reach, no cutting edge. Zabimaru had only half-acknowledged him and hid its true name, so this was an incomplete Bankai.
  4. **True Bankai: Sōō Zabimaru (双王蛇尾丸, "twin kings snake tail")** — unlocked after Ichibe'e Hyōsube reveals the real name and Renji proves himself to Zabimaru; compact, mobile, **gold** reiatsu. Sub-states: **Hihiō arm** out/in · **Orochiō** (tail unfurled; sword mode ⇄ whip-snake mode; optional **red-hot** blade) · **Zazekka** (segmented whip blade) · **furless / spectral Hihiō** (survives his Bankai being drained).
  5. **Gentei Kaijo** (Human World only) — ×5 power state (see shared baseline).
- **Abilities (complete, grouped by form/source):**
  - *Sealed / base*
    - **11th-Division Zanjutsu** — rough, powerful kenjutsu learned from Ikkaku; swings that pop foes into the air and drive them through buildings; he read and blocked Byakuya's Senka from behind. [MeleeArc cut/smash]
    - **Brawling / raw strength** — caught Mask's Star Satsujin Punch bare-handed; blocked Jackie's Fullbring kick with his wrist (the shockwave toppled a stone column) and knocked her out with a hilt jab; an elbow to Mask's back left a large crater; crushed a Senkei sword in his free hand and threw the shards. [MeleeArc smash, Blast, Grab/Throw]
    - **Release interrupt** — whipped Zabimaru around Senbonzakura's blade *during* Byakuya's release and cancelled it. [Bind (weapon), NEW: ReleaseInterrupt]
    - `Hadō #31 Shakkahō` — no incantation; firing several in a row risks a misfire that **explodes on him**; with the full chant at point-blank he burned Szayelaporro (and himself badly) to set up Uryū's Sprenger. [Projectile orb, Blast, NEW: Backfire]
    - **Kidō light** — a tweaked Shakkahō as a small light ball for dark corridors; only small without the full chant. [Environmental (light), Sensing]
    - `Bakudō #4 Hainawa` — **anime-only**: restrains several weak foes at once. [Bind]
    - `Jigoku no Kidō` — **movie-only** banishment spell (see Kidō table). [Teleport, Status]
    - **Gentei Kaijo** — the released reiatsu alone seared off Yylfordt's horn tip. [Stance, Blast]
  - *Shikai — Zabimaru*
    - **Whip lash** — segments shoot out at range and snap back; in canon he can manage **three consecutive lashes** before he must reassemble the blade (a known opening he covers with Shunpo). [MeleeArc cut (long), NEW: SegmentedWhip]
    - **Blind-angle strikes** — the whip curls to hit from behind, left or right without telegraphing. [MeleeArc, NEW: SegmentedWhip]
    - **Constriction** — encircle a target with the extended blade and retract to crush/slice from every side (the anime spirit Hebi turns this into a spinning sphere of segments). [Bind, Grab/Throw]
    - **Whirlwind** — spinning Zabimaru overhead raises a vortex strong enough to blow back huge enemies. [Field (wind), Blast (knockback)]
    - **Launch & pin** — sweeps that toss foes into the air and through buildings meters away. [Grab/Throw]
    - **Deflect** — after Royal Guard training, the Shikai batted Mask's Star Flash into a building. [Absorb/Reflect/Redirect]
    - `Higa Zekkō (狒牙絶咬, "bite of a broken baboon's fang")` — **Shikai version**: he levitates broken/disconnected segments with reiryoku and fires them in a single omnidirectional strike; it damages the sword, works once, and leaves him defenseless (in the anime Byakuya notes he can't re-release for a while). Shikai version is shown in the anime's Zanpakutō arc. [Swarm, Projectile multishot, Status (self: Shikai lock)]
    - *Game-origin fillers (optional, not canon):* Shunsenben (two side lashes + a wall-bouncing thrust), Sanrengeki, Senkō (crouching flail spin), **Garetsukō / Shōsenga** (drive the blade into the ground; it tunnels and bursts up under the target — perfect for destructible terrain), Renzoku Bachiki (headbutt command grab), Zabimaru Tsukisashi (straight extension), Uchi Oroshi / Hienkō (overhead whip slam), Tengajin (reaping arc all around), Higa Hōkō / Hisei Kyōjin / Higa Senkō (rapid whip barrages), Zaga Shakuhō (Jump Force: flail, hook the floor, point-blank Shakkahō).
  - *Bankai — Hihiō Zabimaru*
    - **Bone-snake bludgeon** — doesn't cut; he snaps the skull onto a foe and slams them into the ground/buildings; the skull bites hard; one sweep tore through several towers on a bridge to reach Byakuya. [MeleeArc smash, Grab/Throw, Blast]
    - **Segment reconstruction** — joints are reiatsu, so he separates them to let attacks pass (Senbonzakura's first pass), then re-forms; damaged segments are discarded and the snake re-closes. [NEW: ModularWeapon]
    - **Burrowing segments** — split-off segments tunneled and **erupted from the ground** under Byakuya. [Projectile (tunnel), GroundWave]
    - `Hikotsu Taihō (狒骨大砲, "baboon bone cannon")` — dense **bright red** beam from the skull's mouth; costly, usually knocks the segments out of formation afterward; it incinerated Yylfordt after Gentei Kaijo (**anime:** the spirit's version flattened the SRDI building; Renji's finished the Tōjū Kirikaze). [Beam]
    - **Enhanced Higa Zekkō** — every segment detaches, glows and sharpens with reiatsu, rings the target and strikes from all directions, then the snake reassembles. [Swarm, Projectile multishot]
    - **Reiatsu Ropes** — **anime-only**: ring the target with loose segments and re-link them with reiatsu as a binding (Yammy snapped it). [Bind]
    - **Bite-and-carry** — the jaws can follow a target through the air and ram it into structures (spirit version explicitly). [Grab/Throw, Mobility]
    - *Game-origin fillers:* Hihiō Zabimaru "Chi"/"Ten" (ground-level / skyward lunges that carry victims), Gajintotsu (thrust), Tsuisaikō (coil guard → counter-bite), Mekkōjin (bite, carry up, juggle, head-first piledriver).
  - *True Bankai — Sōō Zabimaru*
    - **Mouth blade + skull bludgeon** — gives the Bankai the cutting edge Hihiō Zabimaru lacked; with the blade retracted the skull **bites objects** (it grabbed a flying brick and smashed it into Uryū) or catches a foe and slams them into surfaces. [MeleeArc cut/smash, Grab/Throw]
    - `Hihiō (狒々王, "baboon king")` — the cowl becomes a giant skeletal arm with green fur that **copies his left arm's movements**: crushed Mask's arm, hurls large enemies, lifts and crumbles wall slabs, **palm-up shield** that ate a Licht Regen barrage, a swipe along the ground that ruptured the pavement into a shockwave, a punch that sent Uryū through several buildings; flames from the shoulder disk **jet-boost** its punches. If his reiatsu is drained to nothing, a **furless skeletal Hihiō** can still tear itself out of his arm ("Sōō" = two kings). [Summon (bound limb), Shield, Grab/Throw, MeleeArc smash, GroundWave, NEW: MirrorLimb, NEW: JetBoost]
    - `Orochiō (オロチ王, "great snake king")` — the waist tail unfurls and the blade grows **serrated**; use it as a sword, or **wrap the tail end around the forearm** to fight like Hihiō Zabimaru (whip-snake with grabbing jaws); swap modes freely. He can **heat the blade red-hot** — it melts stone and explodes on contact: thrown on its tail at Uryū, it dispersed an arrow, punched through a wall and blew up the next three buildings. **Retracting the tail pulls Renji to whatever the head has pinned.** [MeleeArc cut, Projectile (tethered), Blast, Environmental (melt), Grab, Mobility, NEW: SegmentedWhip, NEW: HeatMelt]
    - `Zazekka (蛇舌谺, "snake tongue's echo")` — the blade becomes a segmented whip-blade like the Shikai; the **tip explodes** on contact; deflected a building-boring composite Heilig Pfeil. [MeleeArc, Blast, Absorb/Reflect/Redirect, NEW: SegmentedWhip]
    - `Hihi Tenshō (狒皮転生, "baboon pelt reincarnation")` — he pinches thumb and forefinger together (Hihiō mirrors the sign); the cowl sheds fur clumps around the enemy that writhe and sprout **giant copies of Hihiō's arms/hands** which grab, smother and hold them. [Summon, Bind, Construct]
    - `Sōō Zabimaru, Zaga Teppō (双王蛇尾丸・蛇牙鉄炮, "snake fang iron gun")` — impale the foe on the blade, clench and **twist like turning a key**: a giant serpent skull of **burning reishi** forms and bites down while a blast tears through the victim; it left Mask an ashen husk and engulfed a street block when used on Uryū (Blut Vene saved him). [Grab (command), Blast, Beam, Status (burn → ash)]
    - `Sōō Zabimaru, Zagai Zekkō (双王蛇尾丸・蛇骸絶吼, "snake bone's absolute roar")` — attach the skull to the tail end; Hihiō grabs and **whirls it overhead** like a flail until it swells into a Hihiō-Zabimaru-like shape wreathed in flame and a huge reishi disc; thrown, it detonates across **dozens of buildings** and leaves an enormous crater. Needs about **20 seconds of charging** (he used Hihi Tenshō to buy the time). [Projectile (disc), Blast, NEW: LongChargeUlt]
    - `Hikotsu Taihō (Sōō)` — blast from Hihiō's skeletal arm; his one shown use was a weaker **orange** shot fired while drained. [Beam]
- **Passives & weaknesses:**
  - Passives: **monstrous endurance** (kept fighting after Senbonzakura Kageyoshi plus Senkei blades through his arm; survived his own point-blank Shakkahō; Szayelaporro had to cut his tendons because crushing his organs didn't stop him) · immense strength & durability (TYBW) · Shunpo expert · light-red → gold reiatsu pressure · can **sleep anywhere** (dozed off in enemy territory — comedic idle).
  - Weaknesses: poor Kidō (misfires when chaining) · Shikai **three-lash limit** and recovery window (pre-timeskip) · Shikai can be broken (Ichigo; Mask grabbed it mid-Bankai and snapped it) · Hihiō Zabimaru is huge and clumsy — Byakuya: a Bankai needs ~10 more years to master; Kidō (Sōkatsui) can knock segments loose; Hikotsu Taihō scatters the snake; lost segments stay lost · Zagai Zekkō's 20-second charge · Federzwinger-style reiatsu drains strip the Bankai · hesitates on killing blows (Uryū called it) · refuses to strike a woman first (Jackie).
- **Signature moments to recreate (story-mode set pieces):**
  1. **Karakura back alley (Agent arc):** cuts down Uryū, first *"Hoero, Zabimaru"* on Ichigo; Byakuya finishes the job; Renji stamps Ichigo down and opens the Senkaimon.
  2. **Seireitei stairs rematch vs Ichigo:** Zabimaru shattered; Renji grips Ichigo's collar and begs him to save Rukia.
  3. **Bankai training with Zabimaru's spirit** in the underground training ground (white baboon with purple markings + talking snake tail) — "tame your blade" trial boss.
  4. **The bridge vs Byakuya:** release interrupt on Senbonzakura, *"Bankai! Hihiō Zabimaru"*, towers smashed, segments burst from the ground, Byakuya forced to one knee → Sōkatsui, Rikujōkōrō, Senbonzakura Kageyoshi shreds his headband (hair-down state), Senkei swords pin his arm; he crushes one, throws the shards and charges with a crumbling sword — the hilt disintegrates on Byakuya's chest; Byakuya leaves his bloodied scarf on him.
  5. **Sōkyoku Hill:** carries Rukia away; Aizen shatters Hihiō Zabimaru with one swing.
  6. **Karakura rooftops vs Yylfordt:** impaled through a snake segment → Gentei Kaijo → Hihiō Zabimaru severs an arm → Hikotsu Taihō incinerates him.
  7. **Las Noches vs Szayelaporro** (with Uryū): Bankai vs an enemy who already has data on it — Enhanced Higa Zekkō (which fight it debuted in: verify), then full-chant point-blank Shakkahō straight into Uryū's Sprenger; Szayelaporro's Teatro de Titere crushes his organs and finally his tendons.
  8. **Lost Agent:** catches Jackie's Dirty Boots kick with his wrist; carries her out of Yukio's collapsing dimension.
  9. **First Wandenreich invasion:** Mask grabs Zabimaru mid-Bankai and snaps it (scripted loss).
  10. **Royal Palace:** Kirinji's hot springs; Ichibe'e reveals the true name (training montage).
  11. **Second invasion vs Mask:** drops in with Rukia wearing the Ōken clothes, swats Star Flash with his Shikai, elbow-crater, catches the Star Satsujin Punch, cuts James apart, Star Flash: Super Nova shreds the Ōken clothes → **Sōō Zabimaru reveal** → Hihiō breaks Mask's arm → Orochiō + Zaga Teppō.
  12. **Wahrwelt vs Uryū:** Zazekka, Orochiō smash through a spire, red-hot thrown blade blows up three buildings, Hihiō umbrella vs Licht Regen, brick-bite, Zaga Teppō, Hihi Tenshō, **20-second Zagai Zekkō**, Federzwinger drain, spectral Hihiō's last orange Hikotsu Taihō, shot through the chest.
  13. **Epilogue / Echoing Jaws of Hell:** blindsided by a Jigoku no Gaki, then bound by hell-empowered Szayelaporro's chains while Ichika is threatened.
- **Kit proposal:**
  - **Sealed** — *Shift:* Shunpo (expert: long, crisp; double-tap = behind target) · *LMB:* rough 11th-Division chain — wide horizontal cuts, overhead chops, shoulder checks; forward = lunging stab, back = rising launcher cut, air chain, down-in-air = **elbow drop** (crater), sprint = shoulder tackle · *Heavy:* two-handed overhead cleave · **Q** Shakkahō (tap = instant fireball; chaining within ~1.5 s gives each extra cast a backfire chance; hold = full incantation, big blast) · **E** Hainawa (anime) · **R** Catch (open-hand parry that stops a punch/kick dead, follow-up hilt KO jab) · **F** Point-blank Shakkahō grab (huge damage, self-burn) · **Z** Kidō light (light orb for dark areas; reveals hidden passages) · **X** Headbutt grab (*game-origin* Renzoku Bachiki; mash for more) · *G:* Gentei Kaijo (Human-World contexts only) · *C:* light-red flare · *T:* Shikai · *V:* — (release first) · *Tab:* Shakkahō (no-chant / full chant / light), Hainawa, Jigoku no Kidō (Hell stages, movie).
  - **Shikai — Zabimaru** — *Shift:* Shunpo; while the blade is extended, Shift also auto-recalls it (his canonical cover) · *LMB:* hybrid chain — close slashes that flick into 2–3 m segment snaps; forward = straight extension thrust, back = rising lash launcher, air = circling lashes, down-air = overhead whip slam (gouge line), sprint = sliding sweep lash · *Heavy:* full-reach overhead lash (25 m) that cuts a long trench and splits light structures · **Lash pips:** 3 long extensions, then a forced 1.2 s recall (pre-timeskip skins; TYBW skin removes the limit) · **Q** Blind-angle lash (hold to bend the path left/right/behind) · **E** Constrict (wrap → hold to crush → release to fling) · **R** Whirlwind (spin overhead; knockback vortex, deflects projectiles while held) · **F** Higa Zekkō (omnidirectional segment burst; afterward the Shikai is locked ~20 s and Renji is open) · **Z** Garetsukō (*game-origin*: blade tunnels underground and erupts beneath the target, upturning voxels) · **X** Deflect stance (timed lash that redirects a projectile) · *G:* Gentei Kaijo (Human World) · *C:* flare · *T:* Bankai / *hold T:* seal · *V:* Higa Senkō (*game-origin* name): a storm of whip lashes in a cone that shreds building faces · *Tab:* Kidō list.
  - **Bankai — Hihiō Zabimaru** — *Shift:* shorter Shunpo; the snake slithers after him · *LMB:* giant snake sweeps and head-butts (smash, no cut); forward = lunging bite, back = upward snake rise (launcher), air = snake dive, down = skull slam (big crater), sprint = **snake plow** along the ground (trench GroundWave) · *Heavy:* overhead skull smash · **Q** Hikotsu Taihō (hold to charge; bright red beam, slight sweep; afterward the snake is scattered for ~3 s) · **E** Bite & Carry (grab in the jaws, steer, ram through structures, release to throw) · **R** Enhanced Higa Zekkō (all segments glow, encircle, strike, reassemble) · **F** Burrow (send segments under the ground to erupt beneath a target) · **Z** Coil guard (snake coils round Renji as a shield; counter-bite on hit — Tsuisaikō, *game-origin*) · **X** Reiatsu Ropes (anime bind) · *G:* Gentei Kaijo (Human World) · *C:* red flare · *T:* (TYBW, after the true name is learned) evolve to Sōō Zabimaru / *hold T:* seal · *V:* max-power Hikotsu Taihō (a beam that bores a tunnel through a city block) · *Tab:* Kidō; **segment HP:** individual segments can be shot off and stay gone until the next release.
  - **True Bankai — Sōō Zabimaru** — *Shift:* Shunpo; hold Shift at a surface/target = fire the tail and **reel himself in** · *LMB:* arm-blade sword chain with skull-bash finishers; forward = blade lunge, back = skull uppercut launcher, air = spinning blade, down-air = Hihiō hammer-fist slam, sprint = blade dash · *Heavy:* jet-boosted Hihiō punch (launches the target through several buildings) · *RMB guard:* Hihiō palm umbrella (absorbs barrages; under sustained fire the fur shreds to bare bone = guard broken) · **Q** Orochiō (tap: serrated long blade; hold: wrap tail → whip-snake mode with grab-bite; Q + Heavy: heat the blade red-hot — melt & explode) · **E** Zazekka (explosive-tip whip; also deflects big projectiles) · **R** Hihi Tenshō (finger sign → fur clumps → giant hands grab and hold for ~6 s) · **F** Hikotsu Taihō (gold/orange beam from Hihiō's palm) · **Z** Thrown red-hot Orochiō (tethered throw that pierces walls and detonates; recall reels him in) · **X** Zaga Teppō (command grab: impale → key-twist → burning serpent skull + blast; executes weakened foes into ash) · *G:* Hihiō out/in (out = Hihiō guard/heavies; in = faster movement) · *C:* gold flare · *hold T:* seal · *V:* **Zagai Zekkō** — 20 s canonical charge is kept as a **channel he can walk during** (super-armor, visible spinning-snake tell; meter-gated); release = thrown flaming disc, crater the size of a district block · *Passive "Two Kings":* if the Bankai is forcibly drained/sealed, one spectral furless Hihiō can still manifest for a single weak Hikotsu Taihō.
- **AI notes:** Cocky opener (grin, taunt), turns deadly serious once hurt. Fights one-on-one by 11th-Division habit and **won't strike a female opponent first**. *Pre-timeskip boss:* Phase 1 Shikai keep-away at whip range — after his 3rd lash he Shunpo-retreats to recall (the player's punish window); Phase 2 (≤60% HP) Hihiō Zabimaru: wide sweeps, bite-and-carry, Hikotsu Taihō when the player is far or airborne; snake segments are shootable weak points that shrink his reach; Phase 3 (Bankai broken) desperate charge with the cracking sealed sword, ignores flinch. *TYBW boss:* calm, Shikai-only until the player lands something big, then the Sōō reveal; turtles behind the Hihiō umbrella vs projectile spam; Hihi Tenshō if the player keeps dodging, then starts the Zagai Zekkō spin (huge tell — interrupt it); pulls his killing blow once (gives the player a last chance). Tells: cracks his neck, rolls his shoulders, "Hoero!" before the first lash, raises the left-hand pinch sign before Hihi Tenshō, tail spinning overhead = 20 s countdown.
- **Callouts:** "Hoero, Zabimaru!" · "Bankai! Hihiō Zabimaru!" · "Hikotsu Taihō!" · "Higa Zekkō!" · "Bankai — Sōō Zabimaru!" · "Hihiō!" · "Orochiō!" · "Zazekka!" · "Hihi Tenshō!" · "Sōō Zabimaru — Zaga Teppō!" · "Sōō Zabimaru — Zagai Zekkō!" · "Hadō no sanjūichi — Shakkahō!" · "Gentei kaijo!"

---

## Ikkaku Madarame (斑目 一角) — 3rd Seat → Lieutenant, 11th Division

- **Wiki:** https://bleach.fandom.com/wiki/Ikkaku_Madarame · Hōzukimaru_(Zanpakutō_spirit) · Ikkaku_Madarame/Anime_Continuity · battles: Ichigo Kurosaki vs. Ikkaku Madarame; Ikkaku Madarame vs. Edrad Liones; Ikkaku Madarame & Sajin Komamura vs. Choe Neng Poww; Ikkaku Madarame vs. Moe Shishigawara
- **Roster tier:** **A** (major). Fan favorite with a moveset nobody else has — sword-and-sheath dual wield → spear that secretly splits into a three-section staff → a three-blade chained Bankai whose power **ramps up the longer the fight lasts**. Pairs naturally with Yumichika.
- **Canon power (1–10):** **5.5** with a full dragon crest (≈4.5 in Shikai). The Bankai sliced cleanly through Edrad's flaming Resurrección fist, bit into his armored forearm and in the final clash destroyed his right arm and a chunk of his torso; sealed and in Shikai he matched near-captain-level swordsmen and fought Ichigo evenly early on, but lost badly to Choe Neng Poww while refusing to reveal his Bankai, and Edrad's fire punch snapped his Shikai.
- **Body:** 182 cm / 76 kg → **58 vox** (87 @48). Tall, lean, wiry-strong, long arms; loose, rough brawler's stance. Silhouette keys: **gleaming bald head**, **red marks at the outer corners of both eyes**, a weapon **held in hand rather than worn** (sword in one hand, sheath reversed in the other), and in later arcs a **gold shoulder plate on the right shoulder**.
- **Palette (hex estimates):**
  - Skin `#E8BC92` (shade `#C49570`) · scalp specular hotspot `#FFF4E2` (it's reflective enough to be mistaken for the moon) · eye-corner marks red `#D7262E` · eyes dark brown `#2E2420` (verify) · chest scar `#C98E74` · lips `#B9786A`.
  - Gold pauldron `#D4A62A` (shade `#9C7518`, highlight `#F2D271`) with the kanji 龍 ("dragon") `#1A1A1A` (ink color verify).
  - Sealed Hōzukimaru: guard `#B58A3A` (verify), hilt wrap (verify; suggest deep blue `#2B3A55` over `#E6E0D2`), sheath black lacquer `#1C1C1E` (verify), removable pommel cap `#8D8F92`; the styptic inside is a **tan paste** `#C8A97A`.
  - Shikai: spearhead steel `#CFD3D8` (edge `#EEF1F4`), wax-wood shaft pale tan `#C9A46A` (grain `#A9844C`), hidden-joint ferrules `#4A4D52`, horsehair tassel red `#C41E2A`, sansetsukon chain links `#6C7076`.
  - Bankai: blades steel `#BFC5CC` (edge `#E8ECEF`, flats `#7D848C`), tassels red `#C41E2A`, cylindrical pommel weights dark iron `#3F4247`, chains `#4A4D52`, center-blade handle wrap `#2E2E33`; **dragon crest** engraving empty `#5E636A` → fills **crimson** `#C3141F` → full and glowing `#FF3B3B` (anime spirit adds a yellow-lit eye `#FFD23A` at 100%).
  - Reiatsu red `#E2363B` (one anime episode tints it orange `#FF8A3D`).
- **Look by form/outfit:**
  - **Rukongai brawler (flashback):** roaming fighter who beat everyone barehanded until Kenpachi beat him.
  - **3rd Seat (Soul Society → Fake Karakura):** bald, shiny head; small red marks flicking out from the outer corners of the eyes; a long scar down the **left side of his chest** (from Ichigo) visible in the kosode's opening; standard shihakushō, **no tabi** — bare feet in waraji; sealed sword carried in the hand, sheath in the other hand. In the Human World he carries a **wooden sword** everywhere (school disguise) and lops off Keigo's hair with it for calling him bald.
  - **Lost Agent / TYBW (17 months later):** adds a **gold-plated shoulder plate on the right arm** stamped 龍; the shihakushō page lists his kosode as **sleeveless** (verify against art — earlier art has sleeves).
  - **Epilogue (10 years later):** lieutenant of the 11th, **badge on the left arm**; 12 years later he runs a martial-arts dojo and spars with Ichika Abarai.
- **Weapons:**
  - **Sealed Hōzukimaru** — ordinary-looking katana (~100 cm ≈ 32 vox); oval guard with three little teardrops in relief at top and bottom; the **pommel unscrews** to reach a styptic paste in the hollow hilt (Kubo: the paste is Hōzukimaru's own natural ability). The **sheath is a second weapon** — reverse grip, used to guard and to brace the blade.
  - **Shikai** — he slams the hilt (or pommel) into the sheath: sword and sheath fuse into a **wax-wood spear** with a single-edged Kikuchi-yari-style head (~35–40 cm ≈ 12 vox) and a **red horsehair tassel at the butt end**; total ~2.0–2.1 m ≈ 65–67 vox (verify). On *"Sakero"* it reveals its real form: a **three-section staff** (three ~70 cm ≈ 22 vox sections) joined by chains long enough to flail at mid range; the sections can bend 90° around a guard and re-lock into a rigid spear at will. Fragile.
  - **Bankai — Ryūmon Hōzukimaru** — three giant blades: a **Chinese monk's spade** (crescent head) and a **guandao** (curved glaive), each ~2.5–3 m (estimate) with a horsehair tassel at the hilt and a long cylindrical pommel weight; both pommels are chained to a **central axe-like blade** (~1.8 m wide, estimate) with a handle forged parallel to its spine and a **dragon crest** engraved on one face. He wields the two outer weapons and lets the center piece **float behind his back**, or grabs the center handle and spins the whole rig. Build at 16–24 vox/m and scale.
- **Forms & states (ordered):**
  1. **Sealed** — sword + sheath dual-wield, brawling.
  2. **Shikai: Hōzukimaru (鬼灯丸, "demon light")** — *"Nobiro"* (延びろ, "grow/extend"): spear. **2b. Sansetsukon** — *"Sakero"* (裂けろ, "split apart"): three-section staff; re-joins without a command.
  3. **Bankai: Ryūmon Hōzukimaru (龍紋鬼灯丸, "dragon crest demon light")** — called by slamming the (even broken) Shikai pieces back together; a wide **tornado crackling with reiatsu** envelops him, then the three blades are in his hands. **State meter: dragon crest 0 → 100%.**
  4. **Full crest** — crest completely red: maximum power, but the overstrained edges turn brittle.
- **Abilities (complete):**
  - *Sealed / base*
    - **Sword-and-sheath style** — attacks from the left with the blade, guards on the right with the reversed sheath; ambidextrous, so he can **swap hands mid-exchange**. Against Edrad he deliberately looked predictable, swapped sheath and sword at the last instant, and slashed his face. Braces the blade with the sheath for a two-handed push. [MeleeArc cut/smash, NEW: HandSwapFeint]
    - **Misdirection & recklessness** — leaves holes on purpose to bait counters, accepting huge risk. [Stance]
    - **Hakuda** — undefeated street brawler before joining; headbutts (he headbutts Yumichika as a gag), punches. [MeleeArc smash]
    - **Shunpo / mid-air stop** — uses speed mainly to keep up so the fight can continue. [Mobility]
    - **Hilt styptic** — pops the pommel and smears the tan paste on a wound; sealed Ichigo's chest wound completely. [Heal/Reject (self/ally), NEW: Consumable]
    - **Muscle control** — re-sets a dislocated shoulder by flexing; shrugs off injuries (stood up under Edrad's flame-pillar punch, bracing it with his back). [Heal (minor), Stance (super-armor)]
    - `Tsuki-Tsuki no Mai (ツキツキの舞, "lucky dance")` — pre-fight good-luck shuffle-dance and chant ("tsuiteru, tsuiteru, tsuitteru"); the anime spirit performs it with him to prove its identity. [Stance (taunt/buff)]
    - **Formal introduction** — announces rank and name before killing ("last courtesy") and expects the same. [cinematic]
    - **No Kidō at all.**
  - *Shikai — Hōzukimaru*
    - **Spear work** — long thrusts, sweeping cuts, **jabs with the tassel end** too; power to shatter ground and smash an opponent through rock. [MeleeArc cut/smash]
    - **"Sakero" surprise** — what everyone reads as a spear is a sansetsukon: blocked at the shaft, it **folds around the guard at right angles** so the blade section hits the back of the head; caught Ichigo's forearm this way. [MeleeArc, NEW: SegmentedWhip (3-link)]
    - **Chain guard / blade trap** — blocks a sword with the connecting chain, then **re-locks the sections around the enemy blade** to wrench them off balance. [Bind (weapon), Shield]
    - **Flail strikes** — whirls a section by its chain for mid-range hits and a hurled-segment blast that knocks foes flying. [MeleeArc, Projectile (tethered)]
    - **Reconnect** — instant staff ⇄ spear switching. [Transform]
  - *Bankai — Ryūmon Hōzukimaru*
    - **Pure destructive power** — no special trick, no Kidō/speed/defense boost — just an enormous amount of reiatsu behind three giant blades (Edrad's own read). [MeleeArc cut/smash, Slice (full crest)]
    - **Dragon-crest awakening** — Hōzukimaru is "asleep" when released; **exchanging blows wakes it**: dealing and taking damage turns the dragon crest red bit by bit and raises the Bankai's reiatsu; **spinning the rig by the center handle** speeds it up; fully red = full power. [Stance, NEW: RampMeterOnWeapon]
    - **Center-handle spin** — the whole three-blade assembly as a giant pinwheel; (anime spirit) strong enough to raise a whirlwind. [MeleeArc, Field (wind)]
    - **Chained blade throws** — (anime spirit) flings the segments at range on their chains. [Projectile (tethered)]
    - **Reiatsu Explosion** — **anime-only (spirit), unnamed:** raises the center blade, spins overhead, slams it into the ground → red reiatsu explosion that blows everyone back; doubles as a smoke screen for escaping. [Blast, GroundWave]
    - **Release flourish** — manga: wide reiatsu tornado; anime spirit variants: Bankai drops from the sky, or two dragons of red reiatsu climb into the sky. [Transform, Field]
- **Passives & weaknesses:**
  - Passives: battle joy (he **grins wider as he gets hurt**), extreme endurance, red reiatsu pressure, "it's a lucky day" (survived Ichigo, Edrad).
  - Weaknesses: **zero Kidō**; Shikai breaks under strong blows (Ichigo, Edrad); Bankai edges go **brittle** at full power — a chunk tore out of the spade, and the final clash **shattered the guandao**; after Akon rebuilt it Mayuri calls it noticeably weaker; insists on one-on-one fights; **hides his Bankai** so he won't be promoted away from Kenpachi (lost to Poww rather than use it).
- **Signature moments to recreate:**
  1. **Ryoka invasion rooftop vs Ichigo:** the lucky dance, "Men with *Ichi* in their names are talented", "Nobiro" (sword + sheath become the spear), tassel-end jabs, "Sakero" folds around Ichigo's guard; Ichigo breaks the tassel section barehanded, cuts him down, uses the hilt styptic on him; Ikkaku laughs his wound open and tells him where Rukia is held — and warns him about Kenpachi.
  2. **Karakura at night vs Edrad Liones:** bargains for a bed at Keigo's; formal introduction; hand-swap misdirection; Palma Plancha knocks two teeth out; Volcánica's fire pillar; "watch closely and don't tell anyone" — **Bankai** tornado; guandao cuts through a flaming fist; crest fills while he spins; final clash → the broken guandao blade falls out of the smoke; he crawls off leaving a blood trail, "luckier than you can imagine".
  3. **Fake Karakura vs Choe Neng Poww:** refuses Bankai, loses, the pillar falls; Iba punches him and lectures him while Komamura pretends not to hear.
  4. **Lost Agent vs Moe Shishigawara:** wins while lecturing him that no life is worth more than another.
  5. **TYBW:** pummeled by Mask De Masculine; with Yumichika vs Giselle's zombie Bambietta (Yumichika's Daichi Ten'yō clears the bombs, Ikkaku stabs her, Yumichika cuts off the arm that grabs his face); zombie Hitsugaya freezes his leg and runs him through.
  6. **Anime:** two duels vs his own spirit Hōzukimaru, ending in a Bankai-vs-Bankai full-crest clash.
  7. **Epilogue:** dojo sparring with Ichika.
- **Kit proposal:**
  - **Sealed** — *Shift:* short, aggressive Shunpo · *LMB:* sword (left) / sheath (right) alternating chain; forward = lunge stab, back = sheath uppercut launcher, air = spinning sword-and-sheath, down-in-air = sheath slam, sprint = shoulder ram · *Heavy:* crossed sword-and-sheath press (guard break) · **Q** Hand Swap (the next two hits come from the opposite side; beats directional guard) · **E** Brawl grab (headbutts) · **R** Styptic (pommel off: heal + stop bleeding; 3 charges per fight, can be used on a downed ally) · **F** Last Courtesy (formal introduction: marks a duel target — bonus damage vs it, lost if a third party hits it) · **Z** Shoulder re-set (cleanses stun / limb-disable) · **X** Tsuki-Tsuki dance (interruptible taunt → crit-chance buff) · *G:* — · *C:* red flare · *T:* Shikai (hilt slammed into sheath) · *V:* — · *Tab:* —
  - **Shikai — spear / sansetsukon** — *Shift:* Shunpo · *LMB (spear):* long thrusts and tassel-end jabs; forward = triple thrust, back = rising sweep launcher, air = pole-vault spin, down = spear plant that shatters the ground, sprint = charging thrust · *LMB (sansetsukon):* flail chain at mid range, segments bend around guards · *Heavy:* two-handed overhead smash (crater) · **Q** "Sakero" toggle (spear ⇄ staff; the first hit after a split ignores block) · **E** Around-the-guard strike (hinged section whips over/behind a guard) · **R** Blade trap (catch the enemy weapon in the chain, re-lock to wrench/disarm) · **F** Hurled segment (fling a section on its chain; knockback) · **Z** Ground-shatter slam (GroundWave) · **X** Styptic · *C:* flare · *T:* Bankai — **witness lock**: unavailable while an allied Shinigami NPC has line of sight within ~40 m (he hides it) · *V:* —
  - **Bankai — Ryūmon Hōzukimaru** — *Shift:* short heavy dash · *LMB:* alternating guandao (cut) and spade (cut/smash) blows, the floating center blade swinging in as a delayed third hit; forward = spade thrust, back = guandao rising launcher, air = three-blade spin, down-in-air = center-blade drop (crater), sprint = cleaving charge · *Heavy:* both outer blades crashing together in an X · **Q (hold)** Ryūmon Spin — grab the center handle and whirl the rig (whirlwind, deflects projectiles, fills the crest 3× faster) · **E** Chain throw (fling spade or guandao on its chain, yank back) · **R** Center-blade hurl (launch the axe-blade like a guillotine on its chain) · **F** Reiatsu Explosion (anime: overhead spin → slam) · **Z** "Wake up!" stance (eat one hit on purpose: +crest and an instant counter) · **X** Styptic · *Crest meter:* +% per damage dealt/taken, ++ while spinning; damage, reach and aura size scale with it; at 100% each heavy clash chips the blades (brittle) · *C:* red flare (small crest gain) · *hold T:* seal · *V (needs 100% crest):* **Full-Crest Clash** (*game name*) — all three blades driven through the target and a line of buildings behind it; the guandao shatters afterward (forced seal, canon cost).
- **AI notes:** Showboat duelist: dances, introduces himself, demands the player's name. Fights strictly one-on-one — if a second player/NPC joins he complains and keeps hunting his original opponent. Releases Shikai early (loves a fight) but **hides the Bankai** until HP < 30% *and* no allied Shinigami can see him; then the boss gets stronger every exchange (crest = enrage timer) — players should burst him before 100% or bait clashes to chip the brittle blades. Never retreats, always tries to finish properly ("that's respect"). Tells: hilt slammed into sheath (Shikai), shouts "Sakero!" right before the folding strike, hand on the center handle = spin incoming, grin widening as HP drops. Rage trigger: being called bald.
- **Callouts:** "Nobiro, Hōzukimaru!" · "Sakero, Hōzukimaru!" · "Bankai — Ryūmon Hōzukimaru!" · "Tsuiteru, tsuiteru, tsuitteru~!" · "Jūichibantai daisanseki, Madarame Ikkaku!" (rank + name) · "Hage ja nē!" ("I'm not bald!")

---

## Yumichika Ayasegawa (綾瀬川 弓親) — 3rd Seat (former 5th Seat), 11th Division

- **Wiki:** https://bleach.fandom.com/wiki/Yumichika_Ayasegawa · Ruri'iro_Kujaku_(Zanpakutō_spirit) · Yumichika_Ayasegawa/Anime_Continuity · battles: Yumichika Ayasegawa vs. Shūhei Hisagi; Yumichika Ayasegawa vs. Charlotte Chuhlhourne; Ganju Shiba vs. Yumichika Ayasegawa · Kidō: Daichi_Ten'yō, Hainawa, Shakkahō
- **Roster tier:** **B** (secondary). Thin feat list, but the "secret true Shikai" (only usable unobserved) and the drain-vine kit are unique and cheap once the bind/tether systems exist.
- **Canon power (1–10):** **4.5** (≈**5** with Ruri'iro Kujaku). Lieutenant-level swordsman (fought Hisagi, Charlotte), but brutes overpower him (Charlotte broke his arm in three places, Luppi tossed him around, Ganju's fireworks beat him). Ruri'iro Kujaku drained a lieutenant and a Fracción to defeat; the wiki compares its scale to a Bankai.
- **Body:** 169 cm / 59 kg → **54 vox** (81 @48). Slim, graceful, narrow waist, long neck; posed, theatrical body language (hand on hip, hair flips). Silhouette keys: **jaw-length black bob** with face-framing locks, **colorful feathers at the right eye**, **orange high collar + orange right undersleeve**, a four-bladed sickle fan in Shikai, a mass of peacock-patterned vines in the true form.
- **Palette (hex estimates):**
  - Skin `#F2D3B7` with a glossy highlight `#FFF1E4` (canon: "shiny skin") · hair black `#121216` with violet sheen `#2E2440` · eyes purple `#7B4FA6` · lips `#D99A8E`.
  - Right-eye feathers on the outer brow and lashes: yellow `#F5C83A` and orange `#EE7F2D`, red-orange tips `#D9452B` (exact count/colors verify).
  - Orange neck piece + right undersleeve `#E46F2A` (shade `#B9521C`).
  - 10-years-later cape white `#F2F2F0`, single button `#C9A04A` (verify).
  - Sealed sword: cross-pattée guard bronze `#A8742F`, hilt wrap purple `#6B3FA0` over `#EAE2D6`, sheath fuchsia `#C8358F` (lacquer highlight `#E866B3`).
  - Fuji Kujaku blades steel `#D0D5DB`; transformation glow white `#FFFFFF`. **Game tint idea:** the sulking false form glows faint **wisteria** `#A59ACA` (fuji-iro), the true form **lapis** `#1E50A2` (ruri-iro = lapis lazuli) — the sword literally loves one color and hates the other.
  - Ruri'iro Kujaku vines: they burst out **multicolored** (peacock green `#2E8B57`, teal `#1FA79A`, gold eye-rings `#E8C14A`, cobalt "eyes" `#1E50A2`) and **turn blue** `#1E50A2` once they've wrapped a victim (anime spirit description); buds glow in the **victim's reiatsu color** (Hisagi green `#3CC45A`, Charlotte pink `#FF7FC8`); open flowers lapis/white `#3F6FD1` / `#EAF0FF` (verify); spent vines shrivel to `#6B5B3E`.
  - Reiatsu green `#4CC46A` (core `#D5F7DE`).
- **Look by form/outfit:**
  - **Pre-Gotei (Rukongai):** simple flower-patterned kimono, long hair down his back in a loose ponytail with shoulder-length front locks, no feathers.
  - **5th Seat (Soul Society → Fake Karakura):** jaw-length black bob; feathers on the **right** eyelashes and eyebrow; **orange piece** worn over the uniform around the neck that covers the chest the kosode would show, connected to an **orange sleeve on the right arm** under the looser shihakushō sleeve. **Wig gag:** after Ganju's firework singed his hair he hides it under a wig.
  - **Lost Agent / TYBW (17 months later):** same bob plus a **braid hanging down the right side of his face**, feathers sticking out of the hair on both sides, extended lashes on both eyes, a **sash over the right shoulder** and a **turtleneck** (colors verify).
  - **3rd Seat, 10 years later:** hair a bit past the shoulders, no braid; a **white cape** from the right shoulder covering the whole left arm, closed by one button; no lashes or feathers.
  - **12 years later:** trimmed bangs; small feather ornaments on both sides of the head again.
- **Weapons:**
  - **Sealed:** katana (~100 cm ≈ 32 vox), bronze guard shaped like a cross pattée ("German cross"), purple hilt, fuchsia sheath.
  - **Shikai Fuji Kujaku** — he runs his palm along the glowing blade; it becomes a **sickle/falx-like blade with the edge on the inside** (shotel-like), ~75–85 cm ≈ 26 vox (verify); a **hinge at the top of the hilt** fans it out into **four identical curved blades evenly spaced** like a peacock's tail. Guard and hilt unchanged.
  - **True Shikai Ruri'iro Kujaku** — the four blades flare into **dozens of glowing vines patterned like peacock feathers**, many meters long (enough to wrap a released Fracción); afterward the vines wither, retract into the hilt and the sealed blade re-forms.
- **Forms & states (ordered):**
  1. **Sealed.**
  2. **Fuji Kujaku (藤孔雀, "wisteria peacock")** — *"Sake"* (咲け, "bloom"). Deliberately crippled: the sword *hates* wisteria and the nickname, so it sulks and won't give full power.
  3. **Ruri'iro Kujaku (瑠璃色孔雀, "lapis/azure peacock")** — *"Sakikurue"* (裂き狂え, "split and deviate"). The real, **Kidō-type** release; the 11th Division despises non-melee blades, so he only uses it **when no one from his division can see** (he begged Hisagi not to tell Ikkaku or Kenpachi).
  - No Bankai.
- **Abilities (complete):**
  - *Sealed / base*
    - **Swordsmanship** — lieutenant-level, elegant and quick. [MeleeArc cut]
    - `Byūtifuru Chanbara (ビューティフルチャンバラ, "Beautiful Swordfight")` — a rapid series of repeated clashes with the opponent. [MeleeArc (flurry)]
    - **Shunpo** — got behind Ganju before he could react. [Teleport]
    - `Hadō #57 Daichi Ten'yō` — lifts rubble and hurls it with precision; he used it to smash zombie Bambietta's explosive spheres in mid-air and clear a lane for Ikkaku. [Grab/Throw, Projectile, NEW: DebrisTelekinesis]
    - **Anime-only Kidō** — low-level Bakudō with no chant; vs his Zanpakutō spirit, Shakkahō blasted the vines loose and Bakudō #4 Hainawa stopped them from re-binding him. [Projectile, Bind]
    - **Keen nose** — smelled a Hollow across Karakura; sniffed out (he insists) that Giselle is male. [Sensing]
    - **Perceptive** — worked out that Bambietta's spheres make whatever they touch explode (so: dodge, never parry), and that Giselle *wanted* to be wounded. [Sensing]
    - Durable — fireworks only singed him; kept fighting with an arm broken in three places.
  - *Fuji Kujaku*
    - **Four-sickle fan** — wide hooking slashes; the inside edges can hook limbs/blades (game inference); Charlotte simply caught it barehanded. [MeleeArc cut]
  - *Ruri'iro Kujaku*
    - **Ensnare** — vines lash out and wrap the target; (anime) struggling with reiatsu only speeds the drain. [Bind]
    - **Drain → buds → bloom** — the vines siphon the target's reiatsu; **energy buds** swell along them as they fill; when the flowers **bloom**, the stored reiatsu is turned against the victim — crippling or killing. [Absorb/Reflect/Redirect (drain), Status (drain), Blast, NEW: DrainGrowth]
    - **Petal heal** — chewing a bloomed petal heals him in proportion to the reiatsu it holds (he nibbled one after Charlotte). [Heal/Reject, NEW: PickupSpawn]
    - **Release & wither** — the spent victim is dropped, vines shrivel and retract. [—]
    - **Anime-only counters (useful as rules):** cutting a vine interrupts the drain; an explosion (Shakkahō) loosens the grip; a target already bound by other Kidō can't be wrapped; an enemy that can absorb reiatsu (the Tōjū Kirikaze) **reverses the flow** and drains Ruri'iro Kujaku instead. [NEW: DrainGrowth]
    - *Game extrapolation (not canon):* in a world where buildings are reishi, rooted vines could drain structures so they wither and crumble — flag clearly if used.
- **Passives & weaknesses:**
  - Passives: vanity aura (constant "beauty" commentary); green reiatsu; scent tracking.
  - Weaknesses: **witness lock** on the true form; false Shikai is underpowered by design; physically outmuscled by brutes; vines can be cut, blasted or hijacked by absorbers; **loses composure** if his face/hair is damaged or Ikkaku is in danger (abandoned his pillar post; Kira knocked him out).
- **Signature moments to recreate:**
  1. **Seireitei chase vs Ganju:** Ganju's earth tricks and a big firework win; Yumichika's only damage is his hair → wig.
  2. **Rooftop vs Hisagi:** battered and leaning on Fuji Kujaku, explains he took 5th Seat because 五 looks like 三; fans the blades, calls the true name — vines erupt; "don't tell Ikkaku or the captain"; Hisagi ends up drained flat on the tiles while Yumichika walks off without a scratch in a fresh uniform.
  3. **Fake Karakura vs Charlotte Chuhlhourne:** arm broken by the Guillotine Attack; cuts Charlotte's hair to provoke Reina de Rosas, laughs at it; trapped inside the black-thorn dome **Rosa Blanca** where nobody can see — the perfect place for Ruri'iro Kujaku; buds bloom, petal heal, "it wasn't Bankai".
  4. **Ikkaku falls:** panics, leaves his post, threatens Hisagi; Kira knocks him out with a knockout drop.
  5. **TYBW vs Giselle & zombie Bambietta:** Daichi Ten'yō rock volley vs the explosive spheres, slices off Bambietta's arm as she grabs Ikkaku's face; later tries Ruri'iro Kujaku on zombie Hitsugaya and is kneed by an ice-spiked knee.
  6. **Anime:** duel with his spirit Ruri'iro Kujaku (ensnared, escapes with Kidō, wins by playing to its ego).
- **Kit proposal:**
  - **Sealed** — *Shift:* graceful Shunpo (leaves a feather-flutter afterimage) · *LMB:* fencing chain; forward = lunge, back = rising flourish launcher, air = pirouette slashes, down-in-air = falling stab, sprint = gliding cut · *Heavy:* **Beautiful Swordfight** (hold: a clash flurry that grinds down guards) · **Q** Daichi Ten'yō (press: levitate loose voxel debris in a radius; release: hurl at the target; can swat incoming projectiles) · **E** Shakkahō (anime) · **R** Hainawa (anime) · **F** Scent (Sensing ping: reveals hidden/stealthed enemies and Hollows) · **Z** Read (Perception: flags enemy "don't touch/don't hit" traps — e.g. explode-on-contact projectiles glow red) · **X** Hair fix (vanity emote: small heal, clears debuffs) · *G:* — · *C:* green flare · *T:* Fuji Kujaku · *Tab:* Daichi Ten'yō, Shakkahō, Hainawa.
  - **Fuji Kujaku** — *LMB:* four-sickle hooks and fan sweeps · *Heavy:* fan spin · **Q** Daichi Ten'yō · **E** Blade catch (hook the enemy weapon between the sickles) · **R** Beautiful Swordfight · *Passive "Sulk":* −30% damage · *T:* **Ruri'iro Kujaku** — **witness lock**: greyed out while an allied 11th-Division NPC has line of sight (an eye icon on the HUD) · *V:* —
  - **Ruri'iro Kujaku** — *Shift:* Shunpo (vines trail and retract) · *LMB:* vine lashes at mid range · *Heavy:* vine burst (fan of vines) · **Q** Ensnare (wrap one target, or several if bunched) · **E** Drain (channel: buds fill with the victim's color, victim loses reiatsu/HP; struggling drains faster) · **R** Bloom (detonate filled buds; damage scales with what they hold) · **F** Petal (eat: heal by stored amount; or toss to an ally) · **Z** Vine thicket (vines spread over the ground and walls and snag anything entering; anchors on structures) · **X** Daichi Ten'yō · *hold T:* seal · *V:* **Full Bloom** (*game name*): a giant peacock-fan of vines grabs everything in a cone, mass drain, synchronized bloom.
- **AI notes:** Vain duelist: opens with commentary on the opponent's looks, guards his face (blocks high more often), flares up if his hair or face gets hit (more aggressive, sloppier). Uses Fuji Kujaku in the open; if the player is isolated from allied 11th-Division NPCs (none within ~40 m), he switches to Ruri'iro Kujaku and plays for ensnare-and-drain (wants a long fight). Partner AI with Ikkaku: **never interferes** in Ikkaku's duel (11th Division code) unless Ikkaku is about to die; in group fights supports with Daichi Ten'yō. Tells: palm sliding along the blade (release), fanning the sickles (true release coming).
- **Callouts:** "Sake, Fuji Kujaku!" · "Sakikurue, Ruri'iro Kujaku!" · "Hadō no gojūnana — Daichi Ten'yō!" · "Bakudō no yon — Hainawa!" (anime) · "Utsukushiku nai…" ("not beautiful")

---

## Shūhei Hisagi (檜佐木 修兵) — Co-Lieutenant, 9th Division

- **Wiki:** https://bleach.fandom.com/wiki/Sh%C5%ABhei_Hisagi · Shūhei_Hisagi/Expanded_Universe (novel Bankai) · Shūhei_Hisagi/Anime_Continuity · Kubikake · Kazeshini_(Zanpakutō_spirit) · battles: Shūhei Hisagi vs. Findorr Calius; Sajin Komamura & Shūhei Hisagi vs. Kaname Tōsen; Yumichika Ayasegawa vs. Shūhei Hisagi · Kidō: Tsuzuri_Raiden, Hyapporankan, Sajō_Sabaku
- **Roster tier:** **A** (major). Fan favorite with the most distinctive chain-weapon in the cast, a strong story arc (fear doctrine, Tōsen, Kensei) and — via the novel — a Bankai with a genuinely unusual rule set.
- **Canon power (1–10):** **5** in the manga: killed a captain-claiming Findorr in Shikai, landed the killing blow on Resurrección Tōsen (with Komamura), lifted and slammed Ayon with his chains; outclassed by Ayon, Driscoll Berci and Mask. **Novel:** his Bankai doesn't raise his power — it **equalizes** a fight by making both sides unkillable while reiatsu lasts (he held off the far stronger Hikone Ubuginu).
- **Body:** 181 cm / 67 kg → **58 vox** (87 @48). Tall, lean, athletic; **bare, muscular arms** (sleeveless kosode). Silhouette keys: short spiky black hair; **three parallel scars straight down over the right eye**; **"69" on the left cheek**; **blue stripe across the left cheek and the bridge of the nose**; black **choker** and **bands on both upper arms**; chained twin pinwheel-sickles.
- **Palette (hex estimates):**
  - Skin `#E7B993` (shade `#C2916C`) · hair black `#141418` (blue-gray sheen `#2C3340`) · eyes dark gray `#4B4F57` · scars `#B86F5E` (raised edges `#D4917E`) · "69" tattoo `#111111` · cheek/nose stripe blue `#3E86C9` (verify — reads cyan-blue in the anime).
  - Choker & armbands matte black `#1C1C20` (faint sheen `#3A3A42`) — **these are explosives**.
  - 9th Division badge (white poppy) tied on the left upper arm.
  - Sealed Kazeshini: octagonal guard dark iron `#3B3B40`, hilt wrap and sheath (verify; suggest black `#1E1E22` over `#E6E2DA`, sheath `#18181B`).
  - Shikai: sickle blades steel `#C7CCD3` (edge `#EEF1F4`), central spiked rod black `#1C1C20` with steel spikes `#9DA3AA`, chain `#8A8F96` (shade `#5B6066`).
  - Reiatsu **green** `#3CC45A` (core `#D3F8DD`) — anime and novel.
  - Kidō: Tsuzuri Raiden arcs `#CFE8FF` with violet fringe `#8A7CFF` (verify), Hyapporankan rods `#D6ECFF` (glow `#7FC0FF`), Sajō Sabaku rope `#F2D04A`. Explosive bands: white flash `#FFFFFF` → thick smoke `#9A9A9E`.
  - Novel Bankai: chain orb black `#121216` (glints `#4A4E57`), noose chains `#2A2D33`, stagnant-reishi haze `#3A4A4A` (game).
- **Look by form/outfit:**
  - **Rukongai childhood (flashback):** small boy holding a stick against a Hollow; saved by Kensei Muguruma — whose chest "69" he later copies on his cheek.
  - **Shin'ō Academy, final year:** famous prodigy; much longer hair (to the neck in back, near the chin in front); the right-eye scars come from the Hollow ambush on the field trip he led (with Renji, Kira and Momo in the class). Academy robes (blue-and-white, verify).
  - **New seated officer:** shihakushō *with* sleeves, no blue stripe yet.
  - **Lieutenant (main look):** short spiky black hair; three straight scars from brow to cheek over the right eye; "69" left cheek; blue stripe across the left cheek and nose bridge; black choker; matching black bands around both upper arms; **sleeveless kosode** (9th Division custom); lieutenant badge tied on the left arm; Kazeshini at the waist (sometimes across the back).
  - **17 months later / TYBW:** hair grown out to fall over the face and down near the ears (flatter, less spiky).
  - **Novel (Can't Fear Your Own World):** same look; owns a Human-World **motorcycle** bought from Urahara (he once caused an uproar riding it around the Seireitei) — vehicle prop.
  - **Hobbies (props):** electric guitar (a Fender Stratocaster per Kubo), editor-in-chief of the Seireitei Communication magazine.
- **Weapons:**
  - **Sealed Kazeshini** — katana (~100 cm ≈ 32 vox) with an **octagonal guard**.
  - **Shikai Kazeshini** — **two kusarigama**; each has **two curved scythe blades pointing opposite ways** (one inverted) so it reads like a **pinwheel/fan**; the blades sit on a **spiked rod**, and one **long chain** joins the two weapons. Blade span ~40–45 cm ≈ 14 vox per weapon (estimate). The chain extends at will — Kubo says he prefers to keep it short; game: 3–4 m in hand, up to ~20 m thrown.
  - **Novel Bankai Fushi no Kōjō** — Kazeshini's chain forms a **noose around his own neck** that runs up to a **large black orb of tangled chains** floating above him (~2–3 m, estimate); more nooses can link an opponent's neck to the same system.
- **Forms & states (ordered):**
  1. **Sealed** — his preferred state; he trained his swordsmanship precisely so he wouldn't need the Shikai.
  2. **Shikai: Kazeshini (風死, "wind of death")** — *"Kare"* (刈れ, "reap"). He dislikes it because its shape looks "made for reaping lives".
  3. **Bankai: Fushi no Kōjō (風死絞縄, "wind-of-death hangman's noose")** — **novel only**. In the manga epilogue he merely claims to have mastered a Bankai nobody has seen.
  - Variant state: **PePe-controlled** (TYBW boss variant — fights for "PePe-sama" with Kazeshini *and* Byakuya's dropped Senbonzakura).
- **Abilities (complete):**
  - *Sealed / base*
    - **Swordsmanship** — regularly fights released opponents while still sealed. [MeleeArc cut]
    - **Hakuda** — **anime:** acrobatic unarmed takedowns from odd angles; an elbow sent his own spirit through a wall. [MeleeArc smash]
    - **Shunpo (expert)** — dodged most of a Bala barrage. [Teleport, Mobility]
    - **Explosive bands** — rips off the choker or an armband and throws it: a blinding blast with heavy smoke (vs Findorr it set up a binding). [Projectile (grenade), Blast, Field (smoke/blind), NEW: Consumable]
    - `Bakudō #62 Hyapporankan` — after the band explosion, the rods **pinned Findorr to a wall**; it also appears in the movie *The DiamondDust Rebellion*. [Bind, Projectile multishot]
    - `Bakudō #63 Sajō Sabaku` — listed among his spells. [Bind]
    - `Hadō #11 Tsuzuri Raiden` — sent through **Kazeshini's chains** into Ayon, which dropped it as if paralyzed. [Status (paralysis), NEW: Conduction]
    - Strength/durability — slammed the giant Ayon down with his chains; cracked a concrete wall with his body (Driscoll) and stayed in the fight.
  - *Shikai — Kazeshini*
    - **Fan spin** — swing the sickles by the chain in big circles so the blades whirl like a fan. [MeleeArc cut (wide), Projectile (disc)]
    - **Steered throws** — throws a sickle and steers it through the chain; yanking the chain brings the *other* sickle around from behind (vs Findorr: "you can't read its movements"). [Projectile (steered), NEW: Tether]
    - **Weapon entangle** — wraps an opponent's sword (Tōsen escaped only by vibrating his blade free). [Bind (weapon), NEW: WeaponLock]
    - **Chain binding** — ties up even a giant like Ayon. [Bind]
    - `Kubikake (首挂, "neck-hanging")` — loops the chain round the target's neck, hauls them off balance toward him and slams them into the ground/roof (Tōsen). [Grab/Throw, Bind]
    - **Cutting attacks out of the air** — sliced through Findorr's water jets and through his Cero (the halves still wrecked part of the town). [Absorb/Reflect/Redirect (cut)]
    - **Bisecting cuts** — split Findorr's crab-claw arm lengthwise, then killed him. [MeleeArc cut]
    - **Release inside the wound** — stabbed the sealed blade down through Tōsen's head from his back, then released Kazeshini *inside* him so a blade burst out of his throat. [MeleeArc, Transform, NEW: ReleaseInside]
    - **Chain = life** (**novel**) — Kazeshini embodies a Shinigami: the blades are death, the chain is life. As long as Hisagi has reiatsu, the chain **instantly re-links any injury**, even total destruction of his body — this explains his old toughness and how he survived Lille Barro's shot through his Saketsu & Hakusui. Pain remains; injuries from before the release aren't healed. [Heal/Reject (self), NEW: SelfRestore]
  - *Bankai — Fushi no Kōjō (novel)*
    - **Noose & orb** — the chains can't be permanently destroyed; they simply grow back. [Construct, NEW: Tether]
    - **Stagnant reishi** — the reishi around it stagnates, said to recreate conditions of the primordial world. [Field]
    - **Shared survival** — extends the chain's life-preservation to any opponent he chooses: a chain round **both necks**; every wound on either side is instantly undone, paid from their **combined** reiatsu. He absorbed 100+ "deaths" (bisection, crushed organs, incineration by Cero) without breaking. [Bind, Heal/Reject, Status (link), NEW: LifeLink]
    - **Limit** — if the shared reiatsu runs dry while linked, a final blow kills *both*, so someone else must land it. Novel feats: also parried Tokinada's Enrakyōten imitations (Benihikō, Ryūjin Jakka, Senbonzakura) and cut off Tokinada's arm in the same motion.
  - *Anime spirit Kazeshini (boss/summon)* — **black tornado** form racing around the arena, **shadow wind-blades** fired in rapid volleys, and a **wind-disk wrap** that chains the target while his arm turns into a sickle. [Field, Projectile, Bind, Mobility]
- **Passives & weaknesses:**
  - Passives: the **fear doctrine** ("he who doesn't fear his blade has no right to wield it") — game: perfect parries build *Fear*, which raises Shikai damage; (novel) chain-life regeneration while Kazeshini is out.
  - Weaknesses: reluctant to release (AI); overwhelmed by raw power (Ayon, Driscoll, Mask); entanglements can be shaken off; mind control (PePe); novel Bankai needs outside help to finish a linked foe.
- **Signature moments to recreate:**
  1. **Academy field trip:** student leader orders the freshmen to run and faces giant Hollows alone; gets the eye scars; Renji, Kira and Momo turn back to help; Aizen and Gin arrive.
  2. **Rooftop vs Yumichika:** wins the swordfight, then gets drained flat by Ruri'iro Kujaku.
  3. **Sōkyoku Hill:** holds Tōsen at blade-point before the Negación beams lift the traitors away.
  4. **Fake Karakura vs Findorr Calius:** Findorr chips his mask to climb seat by seat; band explosion → Hyapporankan pins him → water jets → *"Kare, Kazeshini"* → "doesn't this shape look made for reaping lives?" → chain-steered strike from behind → claw split in half → "now you know fear; now we're equals".
  5. **Vs Ayon:** chains + Tsuzuri Raiden drop it — then it breaks free and crushes him (scripted loss).
  6. **With Komamura vs Tōsen:** entangles Tōsen's sword; Kubikake slams him into a roof; impaled and thrown off; returns as Tōsen's Resurrección looms over Komamura — blade through the head, Kazeshini released inside; Tōsen dies asking to see his face.
  7. **TYBW:** loses to Driscoll (Yamamoto steps in), Bankai training ambush by Kensei & Mashiro, clotheslined by Mask, mind-controlled by PePe into attacking Byakuya with two swords, shot by Lille Barro.
  8. **Novel:** Fushi no Kōjō vs Hikone Ubuginu; duel with Tokinada.
  9. **Anime:** feud with his spirit Kazeshini (and the baby the spirit ends up guarding).
- **Kit proposal:**
  - **Sealed** — *Shift:* Shunpo (expert) · *LMB:* disciplined, economical kenjutsu mixed with kicks/elbows; forward = draw-lunge, back = rising cut launcher, air chain, down-in-air = heel drop, sprint = sliding low cut · *Heavy:* draw-cut · **Q** Hyapporankan (rods rain and pin) · **E** Sajō Sabaku · **R** Tsuzuri Raiden (electrify the held weapon; anything touching/hit is shocked) · **F** Explosive band (3 charges — choker, left, right; the model visibly loses each band; blind + smoke) · **Z** "Half-step back" (parry stance; success builds Fear) · **X** — · *G:* — · *C:* green flare · *T:* Shikai · *Tab:* Hyapporankan, Sajō Sabaku, Tsuzuri Raiden.
  - **Shikai — Kazeshini** — *Shift:* Shunpo; hold Shift at a surface = throw a sickle as a **grapple** and zip to it · *LMB:* alternating left/right sickle throws and recalls at mid range, sickle slashes up close; forward = straight throw, back = chain uppercut launcher, air = spinning chain dance, down-in-air = scythe dive, sprint = ankle-height chain sweep · *Heavy:* **fan spin** (both sickles whirling around him at full chain length) · **Q** Steered throw (hold: mouse steers the flying sickle; release: yank the other one round from behind) · **E** Kubikake (neck loop → pull → slam) · **R** Entangle (lock/disarm the enemy weapon) · **F** Tsuzuri Raiden through the chain (paralyze whatever the chain is touching) · **Z** Chain net (anchor both sickles to structures — tripwire/bind zone) · **X** Explosive band bolas (*game extension*: band tied to the chain) · *G:* **Chain-life** toggle (novel: incoming damage converted into reiatsu drain) · *C:* flare · *T:* Bankai (novel) / *hold T:* seal · *V:* **Reaper's Wheel** (*game name*): both sickles orbit him at maximum chain length, cutting incoming projectiles and slicing a ring through every structure in reach · *Finisher:* **Release Inside** — while a sealed-blade stab is embedded (grab state), pressing T releases Kazeshini inside the target.
  - **Bankai — Fushi no Kōjō (novel)** — *LMB:* Shikai chain kit, chains regrow if cut · **Q** Noose link (lasso the target's neck: life-link begins — both sides heal every wound instantly, cost paid from a **shared reiatsu bar** shown over both heads) · **E** Orb tethers (extra chains from the orb bind and drag) · **R** Pain through (ignore flinch/stagger while linked) · **F** Chain rain (*game-origin* — Brave Souls shows chains raining from the orb) · **Z** Unlink (cut a link early) · *V:* **Hangman's Verdict** (*game name*): when the shared bar is nearly empty, cut his own noose at the last instant and drop the finishing blow — canon says he can't survive finishing it himself, so the game version costs nearly all his HP.
- **AI notes:** Calm, mature, defensive; fights sealed until the opponent releases or he drops below ~50%. Mid-range chain control, Kubikake on jumping/airborne players, entangle vs sword users, band + Hyapporankan combo when cornered; never gloats. *PePe variant:* reckless, dual-wields Kazeshini + Senbonzakura, heart-struck dialogue. *Novel-Bankai boss:* links the player and turns the fight into a reiatsu-economy duel; an ally NPC must land the last hit. Tells: hand on the hilt and a deep breath (release), chain wound around his forearm (Kubikake), tugging a band (explosive).
- **Callouts:** "Kare, Kazeshini!" · "Bakudō no rokujūni — Hyapporankan!" · "Bakudō no rokujūsan — Sajō Sabaku!" · "Hadō no jūichi — Tsuzuri Raiden!" · "Bankai — Fushi no Kōjō!" (novel)

---

## Izuru Kira (吉良 イヅル) — Lieutenant, 3rd Division

- **Wiki:** https://bleach.fandom.com/wiki/Izuru_Kira · Wabisuke_(Zanpakutō_spirit) · Izuru_Kira/Anime_Continuity · battles: Izuru Kira vs. Abirama Redder; Rangiku Matsumoto vs. Izuru Kira · Kidō: Tenran, Tōzanshō, Enkōsen, Sajō_Sabaku, Tsuriboshi, Shakkahō, Kaidō
- **Roster tier:** **B** (secondary). One brilliant mechanic (stacking weight) on a gloomy, Kidō-rich support/assassin. Strong boss/rival value; cheap to build once a mass-multiplier system exists.
- **Canon power (1–10):** **5**. Lieutenant-level; four cuts to Abirama Redder's wings (16× weight) brought a Fracción crashing through a building and then to his knees for decapitation; seven blocked strikes left Rangiku's sword at ~225 lb (×128); healed otherwise-fatal wounds on Rangiku and Momo; later crushed a Jigoku no Gaki by making his own foot 128× heavier. But Bazz-B's first shot blew a hole through his side, and he never reached Bankai (Kubo said imagining it would be "nauseating").
- **Body:** 173 cm / 56 kg → **55 vox** (83 @48). Slender, narrow-shouldered, slight slouch, melancholy face. Silhouette keys: **pale-blond hair combed into three points — two at the back, one long bang hiding the left eye**; the **square-hooked** Shikai blade; in TYBW the **open hole in the right side of his chest** braced with rods.
- **Palette (hex estimates):**
  - Skin pale `#F3D7BF` (shade `#D4B29A`), faint under-eye shadow `#C9A99A` · hair light blond `#EED98E` (shade `#CDB66C`, highlight `#FFF2C4`) · eyes blue `#4C79C2`.
  - 3rd Division badge (marigold) tied on the left upper arm.
  - Sealed Wabisuke: guard steel `#9A9EA4` with the Ω motif (color verify); hilt & sheath (verify; suggest navy wrap `#1F2A44` over `#E6E0D2`, black sheath `#18181B`).
  - Shikai blade steel `#C9CED4`, inner (cutting) edge `#EEF1F4`.
  - **Weight-stack VFX** (game): rings stamped "×2/×4/×8…" on struck objects, pale blue `#9FC2FF` deepening to indigo `#3B3F9E` as stacks climb; downward heat-haze shimmer under very heavy objects.
  - Reiatsu blue `#4F8FE0` (core `#DCEBFF`) — anime.
  - Kidō: Tenran tornado `#D9F2FF`; Tōzanshō pyramid `#3F86FF` (edges `#BFE0FF`); Enkōsen disc dull yellow `#C9B14A`; Sajō Sabaku rope `#F2D04A`; Tsuriboshi net `#5AA8FF`; Kaidō glow `#6BE08A`; Shakkahō `#E3262E`; Gaten knockout liquid green `#5ED16A`.
  - TYBW reconstruction: support rods gray metal `#7E848C` (scuffs `#6B4A3A`), wound interior dark red `#5A1218`, prosthetic-looking right arm with seams `#B9A99A` (verify).
  - 12-years-later hood white `#F2F2F0` with small black dots `#1A1A1A`.
- **Look by form/outfit:**
  - **Academy:** shorter, shaggier blond hair, bangs just above the left eye; blue male academy uniform; top of his class and a little cocky.
  - **Lieutenant (main look):** shoulder-length pale-blond hair in three points, long bang covering the left eye; standard shihakushō; badge on the left arm; gloomy expression.
  - **17 months later:** shorter hair; bang now reaches just below the left eye.
  - **TYBW (after Bazz-B, rebuilt by Mayuri):** a big hole through the **right side of his chest/abdomen held open by thick rods**; the shihakushō re-cut so the upper right torso is bare except the **right arm**, which now looks prosthetic; hair back to the original length and style; calls himself "a dead man".
  - **12 years later:** modified shihakushō with a **white hood dotted with small black dots**; a thinner bang.
- **Weapons:**
  - **Sealed Wabisuke** — plain katana (~100 cm ≈ 32 vox), rectangular guard with an **Ω** motif on the top and bottom halves.
  - **Shikai** — the blade **loses its curve and goes straight**; where a katana would end it turns **90° twice**, forming three sides of a square — a square hook with the **cutting edge on the inside** of the angles. Total ~90–100 cm; hook ~15×15 cm ≈ 5×5 vox.
- **Forms & states (ordered):**
  1. **Sealed** — Kidō-heavy.
  2. **Shikai: Wabisuke (侘助, "the wretched one")** — *"Omote o agero"* (面を上げろ, "raise your head").
  3. **TYBW "dead man"** — Mayuri-reconstructed variant (visual + boss variant).
  - No Bankai.
- **Abilities (complete):**
  - *Sealed / base*
    - **Swordsmanship** — cold and efficient; he deliberately lets a fight become close-range for Wabisuke (bait: waited out a "slow" attack to get next to Abirama). [MeleeArc cut]
    - **Shunpo** — appeared behind Abirama unseen. [Teleport]
    - `Hadō #58 Tenran` — spins the sword like a fan, then a widening tornado (Abirama swatted it away). [Projectile (wind), Field]
    - `Bakudō #39 Enkōsen` — spinning yellow disc shield (Abirama smashed it). [Shield]
    - `Bakudō #73 Tōzanshō` — inverted-pyramid barrier around himself, can also trap others. [Shield, Construct, Bind]
    - `Bakudō #63 Sajō Sabaku` — **anime:** bound the Kazeshini spirit with it. [Bind]
    - `Bakudō #37 Tsuriboshi` — elastic catch-net; **anime:** used to restrain the Kazeshini spirit and escape with Hisagi. [Construct, Bind]
    - `Hadō #31 Shakkahō` — fireballs, also as a smoke screen (novel). [Projectile orb, Blast]
    - `Kaidō` + **field medicine** — ex-4th Division; diagnoses at a glance; carries medical kit. [Heal/Reject]
    - `Gaten (穿点, "piercing point")` — green liquid; one drop knocks out anyone with weak enough reiatsu (he put a hysterical Yumichika to sleep; one page calls the tool "Shinten"). [Status (sleep), NEW: Consumable]
    - **Tactician** — always building plays around Wabisuke's rule.
  - *Shikai — Wabisuke*
    - **Weight doubling** — everything the blade strikes **doubles in weight, cumulatively**, objects and living things alike: blades that parry it, limbs, wings, whole bodies, debris. ~8–9 strikes bring most enemies down under their own sword. Examples: 7 parries took Rangiku's ~2 lb sword to ~225 lb; 4 cuts made Abirama's wings 16× heavier and he fell through a building. It must actually **cut** (**anime:** Kenpachi's unbroken skin was unaffected). Effects end when the Shikai is sealed. [Status (weight), NEW: MassMultiplier]
    - **Penitent kneel** — the growing weight forces victims to their knees, heads bowed "in apology" — the 3rd Division's despair motif. [Status]
    - **Reverse guillotine** — hooks the square tip under the kneeling victim's neck and lifts: decapitation. [Grab, NEW: Execute]
    - **Self-weighting** — he can double his *own* body parts: a foot doubled seven times (×128) crushed a giant Jigoku no Gaki from above, then he beheaded it. [MeleeArc smash, Blast, NEW: MassMultiplier]
    - **Heavy deflection** (**novel**) — projectiles he knocks aside become heavier (Shaz Domino's daggers). [Absorb/Reflect/Redirect]
    - **Debris rain** (**novel**) — Tenran blows rubble into the air, he strikes the chunks repeatedly, and they fall as super-dense projectiles that skewer the target. [Projectile, NEW: DebrisTelekinesis, NEW: MassMultiplier]
    - **Sink** (**novel**) — kept stabbing a regenerating Quincy until his own weight drove him down into the earth. [Status]
  - *Anime spirit Wabisuke (boss/summon)* — gaunt man with long black hair, ringed eyes, red chains around his head, a slab of white rock chained to his back, dark-green cloth, swinging an iron ball on a chain; whispers "your back is open" before striking; same weight power (quadrupled Kira's sword in four light taps). [Summon]
- **Passives & weaknesses:**
  - Passives: **despair aura** (flavor); expert Kidō without incantation; healer.
  - Weaknesses: power is **melee-range only**; needs a real cut; effects vanish on reseal; useless against blades that stop being blades (Rangiku switched to ash); frail body; gloomy, indecisive outside combat. TYBW variant: half his torso is literally missing.
- **Signature moments to recreate:**
  1. **Academy field trip:** with Renji and Momo, turns back to rescue Hisagi from giant Hollows (anime adds a three-way Shakkahō volley).
  2. **Kira vs Momo:** blocks his grieving friend to protect Gin; Tobiume blasts vs Wabisuke; Hitsugaya drops in between and stops both mid-clash, then has them jailed.
  3. **Central 46 rooftops vs Rangiku:** counts her seven parries — her sword crashes through a roof tile under its own weight — "Unare, Haineko": the blade turns to weightless ash.
  4. **Fake Karakura vs Abirama Redder:** Enkōsen shattered, Tenran swatted, a deliberate "hit me" to get close, four cuts to the wings, the marigold-means-despair speech, reverse-guillotine execution, "don't forgive me".
  5. **Field medic:** knocks out Yumichika with Gaten, heals Rangiku and Momo after Ayon.
  6. **TYBW:** Bazz-B's Burner Finger 1 erases his right side; rebuilt by Mayuri with rods; vs Lille Barro's feather-clones: splits one's head, floors two with Wabisuke, "I'm a dead man".
  7. **Echoing Jaws of Hell:** prefers perimeter duty for the late entrance — then ×128 foot-stomp on a Jigoku no Gaki and a decapitation.
  8. **Novel:** vs Shaz Domino at Central 46 (Tenran debris rain, sinking regenerator).
  9. **Anime:** ambushed by the Kazeshini and Wabisuke spirits; Kenpachi blows up the building.
- **Kit proposal:**
  - **Sealed** — *Shift:* Shunpo (behind-target specialist) · *LMB:* precise, cold kenjutsu (thrusts, short cuts); forward = thrust, back = rising cut launcher, air chain, down-in-air = plunging stab, sprint = iai dash · *Heavy:* draw-cut · **Q** Tenran (fan-spin windup → widening tornado; lifts loose debris) · **E** Sajō Sabaku · **R** Tōzanshō (pyramid barrier on self; aim at an enemy to cage them) · **F** Kaidō (channel heal; self or ally) · **Z** Enkōsen (instant disc shield) · **X** Gaten (thrown/applied knockout drop: sleeps weak enemies, long stun on minibosses) · *G:* — · *C:* blue flare · *T:* Shikai · *Tab:* Tenran, Sajō Sabaku, Tōzanshō, Enkōsen, Tsuriboshi, Shakkahō (smoke), Kaidō.
  - **Shikai — Wabisuke** — *Shift:* Shunpo · *LMB:* hook-blade chain; **every connecting hit doubles the weight of the part it hits** — the enemy's weapon if they guarded, a limb or the body otherwise, or any world object/voxel chunk; forward = hook thrust, back = rising hook launcher (heavy targets barely leave the ground), air chain, down-in-air = **weighted-foot drop**, sprint = dash cut · *Heavy:* **hook pull** — catch a limb/neck and drag the target down · **Q** "Omote o agero" — execution: on a kneeling or pinned target (≥ ~6 stacks), reverse guillotine · **E** Weighted parry (timed RMB variant: the attacker's weapon gains 2 stacks) · **R** Heavy Step (double his own foot up to ×128: stomp crater / meteor drop from the air) · **F** Debris Rain (Tenran lifts debris → each chunk he strikes multiplies → it slams down; novel combo) · **Z** Heavy deflect (projectiles he bats aside become heavy and drop short) · **X** Tōzanshō · *Weight effects:* ×2–×8 slows attacks/movement; ×16–×64 weapon dragging and kneeling; ×128+ pinned, sinks into soft voxels and crushes floors it stands on · *C:* flare · *hold T:* seal (all weight stacks vanish — canon) · *V:* **Penance** (*game name*): a ten-strike flurry stacking ×1024 on one target, who is driven through floor after floor into the ground, then the reverse guillotine.
- **AI notes:** Methodical, defensive, never flashy. Keeps distance with Kidō until he can bait the player into hook range; **targets the player's weapon when they guard** (their swings slow down) and **legs when they dodge**; executes kneeling players. Below ~30% HP: Tōzanshō + Kaidō, then resumes. Speaks about despair, apologizes to the people he kills. *TYBW variant:* no flinch, eerily calm "dead man". Tells: palm raised before Sajō Sabaku, sword spinning like a fan (Tenran), fist clench before the self-weight stomp.
- **Callouts:** "Omote o agero, Wabisuke!" · "Hadō no gojūhachi — Tenran!" · "Bakudō no rokujūsan — Sajō Sabaku!" · "Bakudō no nanajūsan — Tōzanshō!" · "Bakudō no sanjūkyū — Enkōsen!" · "Bakudō no sanjūnana — Tsuriboshi!" · "Hadō no sanjūichi — Shakkahō!"

<!-- C1-CONTINUES -->
