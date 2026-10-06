# Roster G — Fullbringers (Xcution)

Design dossiers for the Fullbringers of the *Lost Substitute Shinigami* arc: **Kūgo Ginjō**, **Shūkurō Tsukishima**, **Riruka Dokugamine**, **Yukio Hans Vorarlberna**, **Giriko Kutsuzawa**, **Jackie Tristan** and **Moe Shishigawara** — plus **Fullbring itself as a shared mechanic** (Bringer Light, pulling on the souls of world voxels, power transfer and theft), the supporting summons (Mr. Pork & co.), the Xcution locations and "chat room" arenas, the engine features these kits need beyond the brief's primitive list, and open questions.

Conventions used below
- Heights → voxels at **32 vox/m** (rounded). Only Ginjō, Tsukishima, Riruka and Yukio have official heights; the other three are **estimates (verify)**.
- Hex colors are *estimates* from the anime (eps. 343–366) / colour-page memory unless the wiki states a color in words (e.g. "light-green Reiryoku", "magenta Cero", "light-purple Getsuga"); anything marked **(verify)** must be checked against reference art before modeling.
- Engine tags use the brief's vocabulary in `[brackets]`. Needs not covered by that list are tagged `[NEW: …]` and collected in §11.
- Canon-status flags: **[M]** manga (Lost Agent arc = ch. 423–479, plus the TYBW cameo) · **[A-ep N]** anime-only detail (original run, ep. 343–366) · **[N]** novel *Can't Fear Your Own World* (CFYOW, Ryōgo Narita) · **[KO]** Kubo's *Klub Outside* Q&A · **[BS]** *Brave Souls* (game-only names) · **[X]** our own extrapolation for the game (the brief's "everything they can do" rule pushed one step further — never canon, always flagged).
- Sources: the bleach.fandom.com pages linked per dossier (fetched through the MediaWiki API), plus *Fullbringer*, *Xcution*, *Energy Blade*, *Insert Presence*, *Addiction Shot*, *Number Attack*, *Mr. Pork*, *Valley of Screams*, *Naruki City*, *Aura Michibane*, *Kūgo Ginjō/Expanded Universe*, the fight pages (*Ichigo & Ginjō vs. Tsukishima*, *… vs. Tsukishima & Xcution*, *Byakuya vs. Tsukishima*, *Rukia vs. Riruka*, *Hitsugaya vs. Yukio*, *Kenpachi vs. Giriko*, *Renji vs. Jackie*, *Ikkaku vs. Moe*, *Ichigo vs. Ginjō*), the chapter pages (*Welcome To Our Xcution*, *Fullbring Training* rounds 1–3, *Death & Strawberry: Deathberry Returns*, volumes 50–54) and anime episode pages 346, 351–354, 358, 363, 365, 366. Everything is paraphrased.
- Answering the prompt's question marks up front:
  - **"Time Tells No Lies: Time Bomb?"** — no canon technique has that name, but the canon rule *is* time-bomb-shaped: a **timer + terms**; break the terms before time runs out and the bound people **and the area itself** burn in the **"flames of time"**. §6 turns that into an object **Time Bomb clause**, a zone clause and a target clause.
  - **Ginjō's "Bankai"** is not a Zanpakutō Bankai — it is his **Hollowfied Fullbring**, possible because he copied Ichigo's powers through his Reiatsu; he simply *calls* it Bankai [M].
  - **Tsukishima "slashing his own past"** — never shown. What *is* canon: cutting the **ground** so a trap "was set long ago" [M], cutting a **tree** so it "had always" grown huge [N], cutting a **weapon** to learn it or to give it an unbroken past [M], cutting **people** to become part of their lives [M]. §3 keeps all of those and adds doors / faults / restoration as cases of the wiki's "alter its structure".
  - **The Fullbring springboard Ichigo learned** — canon: pulling on the soul of the ground raises its *elasticity* for jumps; Fullbringing the *air* accelerates movement and strengthens blows; the green flicker that precedes it is **Bringer Light** [M]. Spec in §1.2.

---

## 0. Quick reference

| Character | Role | Height → vox | Fullbring (focus object) | Upgrade from Ichigo's power | Signature energy | Tier | Power |
|---|---|---|---|---|---|---|---|
| Kūgo Ginjō | Xcution leader No. 001; the first Substitute Shinigami | 187 cm → 60 | **Cross of Scaffold** (X pendant → claymore), later fused with his Substitute badge | stolen **Clad-type** bone armor → Hollowfied "**Bankai**" | light-green blade energy; light-purple → black/purple Getsuga; magenta Cero | **A** | 7 |
| Shūkurō Tsukishima | Ginjō's protégé, ex-Xcution | 198 cm → 63 | **Book of the End** (bookmark → katana) | none | none shown (design: ink/sepia "insert" FX); Bringer Light green | **A** | 6 (hax 9) |
| Riruka Dokugamine | Xcution No. 003 | 156 cm → 50 | **Dollhouse** (anything she adores) + **Love Gun** gadget | **Enhanced Dollhouse** (gauntlets: Addiction Shot, Human Container) | pink "R" heart passes | **B** | 3 (hax 6) |
| Yukio Hans Vorarlberna | Xcution No. 005; company president | 154 cm → 49 | **Invaders Must Die** (handheld game console) | **Digital Radial Invaders** (the game leaks into reality) | black/green pixels; red Save gauge | **B** | 4 (hax 8 in his space) |
| Giriko Kutsuzawa | Xcution member; bartender | ≈185 cm → ≈59 (verify) | **Time Tells No Lies** (gold pocket watch) | Enhanced (9 floating clocks) → knob-"3" **giant** | green numerals; "flames of time" | **C** (→ B) | 3 (hax 7) |
| Jackie Tristan | Xcution member | ≈175 cm → ≈56 (verify) | **Dirty Boots** (her leather boots) | Enhanced: 4 motorcycle exhausts → black oil armor | dirt / mud / oil | **B** | 3 |
| Moe Shishigawara | Tsukishima's self-made "underling" (not Xcution) | ≈160 cm → ≈51 (verify) | **Jackpot Knuckle** (777 brass knuckle) | none (Ginjō refused to share) | gold "777" flashes | **C** | 2 (jackpot ≈5) |

---

## 1. Fullbring (完現術, Furuburingu) — shared racial layer (read first)

Every dossier below inherits this layer; dossiers only list deviations.

### 1.1 Lore → rules
- **Who:** spiritually aware humans with a parent who survived a Hollow attack before they were born — the Hollow's power lingered in the mother and passed to the child. Their power is **Hollow-type Reiryoku**, closer to a Hollow's than a Shinigami's [M]; Ginjō calls Fullbringers the polar opposite of Substitute Shinigami.
  - Rule: Fullbringer reiatsu reads as "Hollow-like" to sensors. **Hueco Mundo's atmosphere promotes Fullbring growth** [M] → in Hueco Mundo stages Fullbringers get a passive buff (e.g. +10 % meter gain) [X].
- **What:** every piece of matter — a lamppost, a chair, a drink, water, concrete, the air — has a tiny soul. Fullbringers **pull on it** to move the object or change its properties; with an object they love (affinity), they pull its soul out, reinforce it with their own and **transform** it → their unique Fullbring [M]. A user may have affinity with more than one object [M].
- **Body, not soul:** they fight in their **flesh-and-blood bodies** (no soul/body split) and Fullbring burns physical **stamina** — Ginjō drills Ichigo with sets of 100 push-ups and warns that overuse wrecks the body [M]; in his human body Ichigo gets winded and struggles to breathe [M].
- **Growth:** a Fullbring's *nature* never changes once realized, but it passes through **incomplete stages**; reaching the final form releases a violent **energy burst** that can wreck the user unless another Fullbringer smothers it [M]. Battles are **engraved into the souls of objects**, so a veteran's tool becomes a stronger Fullbring (Ichigo's badge "remembered" every fight) [M].
- **Transfer:** Fullbringers can pour their power into someone with both Human and Shinigami power (a Substitute Shinigami); a Substitute can redistribute it among Fullbringers, attach **voluntary restrictions**, or **steal** another Substitute's Fullbring [M]. Leftover Shinigami power merges with a completed Fullbring, and vice versa [M].
- **Death clause:** when a Fullbringer dies, every trace of their ability vanishes and its victims return to normal [M]. (Hitsugaya was not sure Yukio's dimensions would vanish if Yukio died — the one case the engine must decide on.)
- Powers survive death: Ginjō, Tsukishima and Giriko still fight as souls in TYBW / CFYOW [M][N].

### 1.2 Universal verbs (every Fullbringer below unless noted)
- **Bringer Light (完現光, "Full Manifestation Light") — `Shift`.** A flicker of **green light at the feet** is the preliminary of every high-speed move [M]. Three canon uses, all on `Shift`/`Space`:
  1. *Springboard:* pull on the soul of the ground so it turns elastic → huge jump. Implementation: hold `Space` on any solid voxel (0.2–0.8 s); the ~2×2 m patch under the feet **visibly sags and rebounds like rubber** (vertex displacement, no voxel destruction), a green ring flashes at the contact, then launch (height scales with charge).
  2. *Air pull:* Fullbring the air itself to accelerate (Ichigo leapt off the roof and then pushed off the air toward Tsukishima; Ginjō retreats through the air with it) [M]. Up to 3 air dashes/steps before landing, each leaving a faint green ring.
  3. *Strike boost:* a blow thrown out of an air-pull dash hits harder (canon: accelerating through the air strengthens blows) → +knockback / +stagger on the first hit after a dash.
  - Also: last-instant dodges (Tsukishima's specialty), several flickers chained to circle a target, and the brief's double-tap-with-lock-on "appear behind" (canon: Tsukishima behind Orihime/Yukio/Byakuya, Jackie behind Renji, Ichigo behind Jackie, Riruka cutting off fleeing Rukia).
  - **Not available to Moe** (never shown; he can't stand on air).
  - `[Mobility] [Teleport] [NEW: SoulSpring]`
- **Soul Pull** (Tab-wheel entry for every Fullbringer): draw a small object, liquid or loose debris toward the hand or into the mouth (Ginjō's drink) [M]; **walk on water** (passive) [M]; run faster (Ginjō's example) [A-ep 346]. [X] scaling: pull a ~1 m³ debris chunk to the hand and throw it. `[Grab/Throw] [Environmental]`
- **Spiritual awareness:** all of them see Shinigami and Hollows; Ginjō and Yukio sense at long range, and Ginjō can judge how long a fading reiatsu has left [M]. `[Sensing/Stealth]`
- **Stamina gate** `[NEW: Stamina]`: Fullbring abilities draw from a body-stamina bar in addition to the reiatsu meter; at 0 the character is *winded* (slower, no Bringer Light) for a few seconds.
- **Caster-owned effects** `[NEW: CasterRegistry]`: every persistent effect (trap, contract, prisoner, clone, room, converted ally, edited voxel) is tagged with its Fullbringer and **reverts / despawns on their death** (death clause).
- **Completion Burst** (transform VFX + hazard): a radial blast in the Fullbring's color when a form completes (Ichigo's pinned and injured Jackie in the fish tank) [M]. Usable as `T` cinematics.

### 1.3 Shared visual language
- Bringer Light: green `#7DFFB0`, core `#D9FFE9` — thin sparks under the soles + a 0.5 m ring on the surface pushed off.
- Activation glow: a brief **green** glow on the focus object as it transforms (Ginjō's pendant) [A-ep 346].
- **"Ichigo-power" upgrades** (Ginjō's transference): each member grows **white armor "structures"** like Ichigo's completed Fullbring [M] — shared material: matte white `#F2F2EE` with black seams `#1E1E22`, then a personal motif (clock hands, exhaust pipes, gauntlets, heart plate).
- **Clad-type (装衣型, Kuraddotaipu):** a Fullbring that shrouds its user (Ichigo's; the one Ginjō steals). Yukio sums up Ichigo's power as letting you "wear your powers as a mantle and expel them" [M].

### 1.4 Xcution systems
- **Pact:** when they joined, the members traded slivers of power with each other as a loyalty token, each with a small restriction [M]. The only one shown: Yukio **cannot dismiss** a dimension that holds Ginjō unless Ginjō orders it. Game: pair-passives between allied Xcution characters in co-op [X beyond the Yukio rule].
- **Transference event** (Ginjō): slashing an allied Fullbringer upgrades them to their Enhanced form — a team power-up beat in boss fights and a co-op skill (§2).

### 1.5 Fullbringers elsewhere in the roster (not dossiered here)
- **Ichigo** — incomplete Fullbring (Tensa Zangetsu's tsuba in black reiatsu around the badge; spinning six-bladed blasts that lose a blade per shot), clad shihakushō of black(-red) reiatsu, completed white armor + machete blade (group A1). Required as the **donor kit** for Ginjō's stolen form.
- **Yasutora Sado** — Brazo Derecha de Gigante / Brazo Izquierda del Diablo, a Fullbring of his own skin (A2). **Orihime** — a Hōgyoku-awakened Fullbringer per CFYOW [N] (A2).
- **Aura Michibane** [N] (novel antagonist, in no group): no fixed object, only the basic verbs at "miracle" scale — manipulating the souls of air, earth, blood and bone; intangibility; healing even decapitation; nitrogen barriers that stopped a Hadō #91; water-and-lava dragons that cancelled a Hadō #99; weak to Kidō. Candidate **C-tier novel-pack boss** — she shows the ceiling of the §1.2 verbs.

---

## 2. Kūgo Ginjō (銀城 空吾) — Xcution leader (No. 001), the first Substitute Shinigami
- **Wiki:** https://bleach.fandom.com/wiki/K%C5%ABgo_Ginj%C5%8D · https://bleach.fandom.com/wiki/Energy_Blade · https://bleach.fandom.com/wiki/Ichigo_Kurosaki_vs._K%C5%ABgo_Ginj%C5%8D · https://bleach.fandom.com/wiki/K%C5%ABgo_Ginj%C5%8D/Expanded_Universe
- **Roster tier:** **A** — the arc's final boss with three escalating forms and a signature "steal your power" mechanic; cheap once Ichigo exists (Getsuga, Clad-type and Ichigo's Fullbring tech are reused).
- **Canon power (1–10):** **7** — beat Fullbring-Ichigo twice; held off Jackie, Riruka, Giriko and Moe at once with swordplay alone; his stolen armor took a Shikai-strength Getsuga without a mark; traded Getsuga with the restored Ichigo and met his Bankai with a copied "Bankai" before his sword broke; as a Substitute he killed many of the Shinigami sent after him.
- **Body:** 187 cm → **60 vox**; 90 kg; 28 years old in 2003 [KO]. Tall and long-legged, lean but wide-shouldered with big hands (sells the giant sword); head ≈1/7.5 of height. Lazy, confident stance — sword resting on his shoulder or planted point-down. **Silhouette keys:** slicked-back shoulder-length black hair; a bulky **fur collar** breaking the neckline; thin chain with an **X (saltire) pendant**; a two-handed sword almost as long as he is tall with an **open gold "window"** just above the guard.
- **Palette (hex estimates):**
  - Skin `#EFD2B8` (shadow `#D3AE8E`) · hair black `#141417` (sheen `#2B2E35`) → "Bankai" white `#F4F3EF` (shade `#C9CCD2`)
  - Eyes brown `#5A3B26` (vol. 50 cover; the ch. 449 colour page shows **blue** — pick brown, verify) → "Bankai": iris white `#FAFAFA`, sclera red `#B3122A`; cross mark on the face red `#C4162E`
  - Jacket black `#1B1B1F`; fur collar charcoal `#2F2F33` with grey tips `#5E5E64` (verify) → "Bankai": fur **red** `#B3202C` (shade `#7A1219`), enlarged
  - Sleeveless undershirt white `#ECECEA` · pants black `#19191C` · shoes black `#121214` · pendant & chain silver `#C8CCD2`
  - **Cross of Scaffold:** blade steel `#B8C0C8` / edge `#E8EDF2`; guard + window frame **gold** `#C9A23A` (shade `#8E6F1F`) [M + A-ep 346]; center gem red `#C0182B`; grips dark leather `#2A2522`
  - Badge-fused sword: guard skull bone `#E9E3D1` with a dark X `#2A2A2E`; spine-shaped inner handle `#D8D2C2`; window interior dark metal `#3A3D43`
  - Clad armor bone-white `#EBE6D9` (shade `#BDB6A5`); gloves black `#1A1A1D` with bone backs; belt black + bone X buckle
  - Reiatsu / energy: Energy Blade **light green** `#8FF0A4` (core `#DFFFE6`, also his base C-flare aura); enhanced blast green `#4FE07A`; Clad Getsuga **light purple** `#B59CFF`; "Bankai" Getsuga **black** `#0B0910` with a **purple outline** `#8A4DFF`; Cero **magenta** `#E0218A` (core `#FF9AD0`); back "X" branches black `#0D0A12` with violet rim `#8A4DFF` (verify); Bringer Light `#7DFFB0`
- **Look by form/outfit:**
  - *Xcution leader (default):* hair combed back to the nape; black fur-collared jacket over a white sleeveless shirt; black pants; X pendant. After Tsukishima's second cut (the reveal) he wears his hair messy with strands over his face, and after his rooftop duel with Tsukishima he carries a **small vertical scar above the left eyebrow** (the fight summary puts that cut on the right side of his face — check the art).
  - *Cross of Scaffold:* same outfit, pendant gone from the chain, sword in hand.
  - *Stolen Clad-type ("Usurper" — our working label):* jacket stays on; a **bone ribcage lattice** over the chest running down into bony plates on the abdomen; gloves whose backs are **hand bones**; bone **shoulder plates**; bone **shin guards** rising into knee plates that reach mid-thigh; belt with a large **X buckle**.
  - *"Bankai" (Hollowfied Fullbring):* armor hugs the body tighter and looks more skeletal; the jacket fur turns **red and swells** into a mane-like collar; **fur pants** (color not stated — reads dark/red, verify) and black shoes; **hair and eyebrows turn white**; inverted Hollow eyes (white iris, red sclera); a red **cross-shaped mark** on the side of his face; four energy "branches" spread from his back in an **X**. As he dies the marks fade and the eyes revert but the hair stays white [A-ep 366].
  - *Substitute-Shinigami era (flashback / [N]):* much shorter, unkempt hair. His original Zanpakutō is **never shown** — do not invent one.
  - *Afterlife (TYBW cameo, [N]):* no distinct design in our sources (verify; Brave Souls has a game-only Soul-Society outfit).
- **Weapons:**
  - *Sealed:* silver X pendant on a thin chain.
  - *Cross of Scaffold* [M]: two-handed broadsword/claymore, ≈1.7 m overall → **≈54 vox** (est.): outer grip ≈30 cm; crossguard of two straight ornate arms ending in **simplified fleurs-de-lis** with a small **red gem** in the center; above it a rectangular **open window (gold frame) ≈40–45 cm long** through which the handle continues as an **inner grip**; then a broad double-edged blade ≈90 × 12 cm with a point. Handle (outer + inner grip) ≈ the blade's length. Heavy enough to sink into a tiled floor when he sets it down [A-ep 346].
  - *Badge-fused (Enhanced)* [M]: his own Substitute badge merges into the sword; the gem becomes a **small skull with an X over it**; the inner handle becomes a **spinal column**; the window turns dark metal.
  - *"Bankai"* [M]: guard and hilt more skeletal; a rigid **bone plate** divides the window from the blade. The sword (and his badge) break in the final clash.
- **Forms & states (ordered):**
  1. **Sealed** — pendant; fists + Fullbring basics.
  2. **Cross of Scaffold** — grips the pendant (green glow) → sword. No spoken command.
  3. **Enhanced Cross of Scaffold + stolen Clad-type** — presses his badge into the sword; impaling a Fullbringer absorbs them (story: Ichigo) → bone armor, Getsuga, much higher reiatsu.
  4. **"Bankai"** — "Bankai." — reiatsu surge, white hair, X branches; Bankai-tier stats, black Getsuga, Cero.
  - Weapon stance: **long grip / inner grip**.
- **Abilities (complete, grouped by form/source):**
  - *Physical / racial*
    - **Master swordsman** — fought four Fullbringers at once on sword skill alone; twice beat Ichigo; matched Tsukishima [M]. `[MeleeArc(cut/smash)]`
    - **Hand-to-hand** — threw his sword aside and brawled the blinded Ichigo; elbowed Ichigo back to the ground to keep him out of a fight [M]. `[MeleeArc(smash)] [Grab/Throw]`
    - **Strength / durability / endurance** — swings the huge sword like it weighs nothing; pushed a large Hollow to the ground; shrugged off a Hollow's blow to the back from high up; stood after taking a Fullbring-completion explosion point-blank [M].
    - **Reflexes** — deflected Uryū's Heilig Pfeil **without looking**; blocked or dodged his later arrow barrages [M]. `[Absorb/Reflect/Redirect]`
    - **Sensing** — long range; read Tsukishima's dying reiatsu and gave him "ten seconds at best" [M]. `[Sensing/Stealth]`
    - **Bringer Light** — pulls on concrete and air for speed and jump height; dodged Giriko's Number Attack, Riruka's Love Gun and Jackie's kicks; retreated through the air [M]; tackled Tsukishima from behind [A-ep 354]. `[Mobility] [NEW: SoulSpring]`
    - **Soul pull** — made his drink float into his mouth [M] (the anime draws the liquor out as vapour [A-ep 346]). `[Grab/Throw]`
  - *Cross of Scaffold*
    - **Inner grip** — chokes up on the handle inside the window to fight at close range; cut Ichigo's leg with it [M]. `[Stance] [MeleeArc(cut)]`
    - **Energy Blade** (wiki label; unnamed in canon) — grips the inner handle and whirls the sword so **light-green Reiryoku** sheathes the blade, then swings: a column/beam that **explodes on impact**. Canon scale: blew apart part of a building; Tsukishima walked out of the dust [M][A-ep 353]. `[Projectile(crescent, explode)] [Beam] [Blast]`
    - **Eye cut** — a precise slash across both eyes to blind (the training trick that let Ichigo perceive reiatsu) [M]. `[MeleeArc(cut)] [Status(blindness)]`
    - **Impale** — runs a target through and holds them on the blade [M]. `[Grab/Throw]`
    - **Overseer's grip** — caught Ichigo's newly completed blade barehanded as it detonated and smothered the burst with his body [M]. `[Absorb/Reflect/Redirect]`
    - **Intercept** — crossed a long distance in an instant to take a point-blank cut meant for Ichigo [M]. `[Teleport] [Shield]`
    - **Isolation demolition** — wrecked the mansion staircase so nobody else could reach the fight upstairs [M]. `[MeleeArc(smash)] [Environmental] [NEW: WeakPoint]`
  - *Enhanced Cross of Scaffold (badge fused)*
    - **Fullbring Absorption** — impale a Fullbringer: their Fullbring breaks down, **liquefies and crawls up the blade** into the sword; the stab leaves **no wound** [M]. `[Grab/Throw] [Status(Fullbring theft)] [NEW: AbilitySteal]`
    - **Ability Replication** — uses every technique contained in the stolen Fullbring, with the victim's reiatsu blended into his own (Uryū noticed Ichigo's reiatsu inside his attacks) [M]. `[NEW: AbilitySteal]`
    - **Fullbring Transference** — slashes allies (no wound) to hand each a share of a stolen Fullbring → their Enhanced forms [M]. `[Status(buff)] [NEW: AbilitySteal]`
    - **Pact override** — Yukio can't close a dimension holding Ginjō without his order [M].
    - **Enhanced Energy Blast** — a big green blast from the blade that damaged several buildings of the replica Karakura in one shot [M]. `[Beam] [Blast]`
  - *Stolen Clad-type (Ichigo's)*
    - **Bone armor** — took Ichigo's Shikai-level Getsuga with no visible damage; Ginjō admits he'd be dead without it [M]. `[Shield] [Stance]`
    - **Getsuga Tenshō (月牙天衝, "Moon Fang Heaven-Piercer")** — **light-purple** crescent at Ichigo's Shikai strength; he **cut through Ichigo's Getsuga and fired his own back**; Getsuga-vs-Getsuga collisions [M]. `[Projectile(crescent, slice)] [Slice]`
    - **Reiatsu boost** — enough to fight the restored Ichigo evenly at first [M].
    - [X] via Ability Replication (allowed by canon, never shown): the rest of Ichigo's Fullbring kit — six-blade black wheel blasts, energy held in the blade to empower swings, afterimage speed, a single-leg focused kick. `[Projectile(disc)] [Afterimage/Clone]`
  - *"Bankai"*
    - **Bankai-tier reiatsu** — briefly on par with Bankai Ichigo [M].
    - **Enhanced Getsuga Tenshō** — **black with a purple outline**, at Ichigo's Bankai strength [M]. `[Projectile(crescent, tunnel/slice)] [Slice]`
    - **Cero (虚閃)** — charged at the **sword tip**, fired as a wide **magenta** beam (ch. 476's "energy blast"; the anime makes it an explicit Cero, and Ichigo stops it with his hand) [M][A-ep 366]. `[Beam]`
    - Getsuga → Cero chain: a [BS] combo ("Combination Slash"), fine to adopt.
    - X branches: canon visual only; [X] used here for air-standing and a flare shockwave. `[Mobility]`
  - *Lore notes:* the wiki says his Substitute-era killing spree "siphoned power" from slain Shinigami (never shown); he disabled his badge's surveillance somehow; [N] the surveillance was planted by Tokinada Tsunayashiro to track and massacre his Fullbringer friends.
- **Passives & weaknesses:**
  - Passives: Pact leader (above); huge weapon reach; long-range sensing; real body (bleeds, gets winded).
  - Weaknesses: arrogant, talks mid-fight (punish windows) and underestimates outside factors; his theft only takes the **top layer** of a Substitute's power — the part fused with their Fullbring (Rukia) [M]; the copied "Bankai" loses to the original and his sword snaps; a terrible actor (needed Tsukishima's edit to fool Ichigo).
- **Signature moments to recreate (story-mode set pieces):**
  1. *The drink trick* — Xcution HQ: the drink floats into his mouth, the pendant becomes the sword and sinks into the floor tiles (Giriko bills him for them).
  2. *Six lives* — training inside Yukio's game: HP crosses over both heads and a 60-s countdown; inner-grip leg cut, eye cut, sword thrown aside for a brawl, Ichigo impaled — then Ginjō catches the completion explosion barehanded.
  3. *"Only the empty ones"* — rooftop duel vs Tsukishima over Naruki City; the Energy Blade levels part of an abandoned building; Tsukishima lunges out of the dust cloud.
  4. *Hold the line* — Tsukishima's mansion: Ginjō vs Jackie, Riruka, Giriko and Moe at once; a coin drops the chandelier; Moe cracks his guard; Ginjō dives to take the cut meant for Ichigo.
  5. *The betrayal* — badge fused, Ichigo impaled, the Fullbring liquefies up the blade; Ginjō walks away.
  6. *Deathberry returns* — he tries to flee through the air, Ichigo grabs his jacket and hurls him, then a full Getsuga; he walks out of the smoke in the stolen bone armor.
  7. *Sharing the loot* — slashes his four comrades to power them up (team power-up event).
  8. *Karakura replica* — chat-room duel vs Ichigo + Uryū; razes the fake town to flush them out; cuts through a Getsuga and counters; Ichigo's Bankai shatters the dimension; Ginjō's "Bankai"; Cero caught by hand; final clash, sword breaks, death.
  9. *TYBW cameo* — arrives with Tsukishima at the Soul King Palace to repay Ichigo (assist character).
  10. [N] *Rukongai brawl* — with Tsukishima and Giriko vs Candice & Meninas; Grimmjow crashes in through a Garganta.
- **Kit proposal:**
  - *Form 1 — Cross of Scaffold*
    - Shift: Bringer Light dashes, 3 air pulls, hold-Space springboard; double-tap with lock-on = behind target.
    - LMB chain: heavy, sweeping claymore — diagonal cut → horizontal sweep → rising cut → spinning cleave → overhead chop (smash, small crater). Forward = long thrust; back = rising launcher; air = 3 wide arcs; down-air = plunge that buries the blade (crater); sprint = dash cleave. In inner-grip stance the chain becomes fast short jabs and guard/pommel strikes.
    - Heavy (hold LMB): the blade whirls as it charges green, release = explosive green slash that cracks a building.
    - Q **Energy Blade** — tap: green explosive wave; hold: full column that demolishes a building section; in air: angled downward.
    - E **Scaffold Impale** — lunging skewer-grab; follow with lift-and-slam or kick-off.
    - R **Soul Leap** — pull the concrete's soul: crater-ring takeoff into a towering leap, air pull, slam landing `[GroundWave]`.
    - F **Intercept** — Bringer Light to an ally (or a locked point) and body-block the next hit.
    - Z **Eye Cut** — fast head-height slash that blinds.
    - X **Unwatched Deflect** — 2-s stance that swats projectiles from any direction, including behind.
    - G **Inner Grip** toggle (reach/power ↔ speed/close range).
    - C flare: light-green aura, ground cracks.
    - V **Demolition Swing** [X scale] — Soul Leap above the target zone, whirl, bring down a giant green column that splits and detonates a whole structure `[Slice] [Blast]`.
    - Tab: Soul Pull · Barehanded mode (drop the sword) · Staircase Breaker (cut a structure's supports so floors/stairs collapse) · Overseer's Grip (catch an enemy's charged blade or exploding projectile and smother it) · emote: offers ramen.
  - *Form 2 — Enhanced + Clad (T: badge-fusion cinematic; story-locked behind a successful Absorption)*
    - Shift: Bringer Light with afterimages. LMB: same chain with energy held in the blade (the finisher spits a small purple crescent). Heavy: Getsuga-charged overhead.
    - Q **Getsuga Tenshō** (light purple; hold = bigger). Timed against an incoming projectile it **cuts through it** and keeps going.
    - E **Fullbring Absorption** — impale grab: vs a Fullbringer/Substitute, steals their Fullbring (their form collapses to base and their Fullbring slots move into Ginjō's Tab) until Ginjō dies; vs anyone else, a plain impale + reiatsu drain (canon only shows theft from Fullbringers).
    - R **Fullbring Transference** — slash an ally: instant Enhanced form, or gift them one stolen ability.
    - F **Enhanced Energy Blast** — multi-building green blast.
    - Z **Bone Guard** — brace in the armor: blocks beams and projectiles, ends in a shoulder charge.
    - X **Getsuga Clash** — fire into an enemy beam to lock a clash point (struggle).
    - G Inner Grip · C flare (green-purple).
    - V **Stolen Moon** — negates the next enemy super/beam by cutting through it, then returns a giant light-purple Getsuga.
    - Tab: **Stolen Fullbrings** — default Ichigo's (six-blade wheel, tsuba block, focused kick), plus anything absorbed this match: Dollhouse pass, Number Attack, Dirty-Boots stomp, Jackpot punch, Digital Blade… [X]
  - *Form 3 — "Bankai" (T: "Bankai.")*
    - Shift: near-teleport dashes with dark afterimages; free air-standing.
    - LMB: fast brutal chain, finisher = black crescent burst. Heavy: Getsuga-charged cleave `[Slice]`.
    - Q **Black Getsuga Tenshō** (black, purple rim; tunnels/slices large structures).
    - E **Cero** — tip-charged magenta beam; hold to sustain and sweep (bores cylinders through terrain).
    - R **Getsuga → Cero** chain [BS].
    - F **Sword Lock** — bind and overpower; the loser is blasted through walls.
    - Z **Bone Guard** (tighter armor, damage-reduction stance).
    - X **X-Burst** [X] — the four branches flare into an X-shaped shockwave `[Blast]`.
    - G Inner Grip · C flare: X branches ignite, X-shaped ground cracks [X].
    - V **Final Clash** — maximal black Getsuga + Cero, then a dash-through slash (cinematic).
    - Tab: Stolen Fullbrings.
- **AI notes:**
  - Phase 1 (Cross of Scaffold): measured and chatty; uses his reach; dodges projectiles with Bringer Light; when the player hides he **destroys cover and whole buildings to flush them out**; on story maps he avoids civilian-flagged buildings ("only the empty ones").
  - Phase 2 (story: after the Absorption; versus: ~60 % HP): badge-fusion cinematic; Getsuga duels; **baits** the player's beam by lowering his guard, then cuts through it and counters.
  - Phase 3 (≤35 % HP, after a "negotiations are over" line): "Bankai"; aggressive Getsuga/Cero, finishing with one big charge.
  - Group fights: shields allies (intercepts hits aimed at Tsukishima or Yukio) and fires the **Transference** power-up on all living Xcution allies once.
  - Tells: psychotic grin when excited; scratches his head before committing; sword resting on the shoulder = taunting (open).
- **Callouts:** "Getsuga Tenshō!" · "Bankai." · naming the sword (not a shout): "Kurosu obu Sukyafforudo." The Energy Blade and the Cero are unshouted in canon.

---

## 3. Shūkurō Tsukishima (月島 秀九郎) — Fullbringer; Ginjō's protégé and former Xcution member
- **Wiki:** https://bleach.fandom.com/wiki/Sh%C5%ABkur%C5%8D_Tsukishima · https://bleach.fandom.com/wiki/Insert_Presence · https://bleach.fandom.com/wiki/Byakuya_Kuchiki_vs._Sh%C5%ABkur%C5%8D_Tsukishima
- **Roster tier:** **A** — the showcase "history-edit" kit for a destructible world (terrain that "always was" trapped / doored / grown / intact) and a unique ally-conversion fantasy. High systems cost: ship v1 with Trap + Insert Presence + Weapon Reading, add Door / Growth / Fault / Restore later.
- **Canon power (1–10):** **6** (utility **9**) — fought Ginjō to a standstill; toyed with incomplete-Fullbring Ichigo; sliced Byakuya's Zanpakutō in half and neutralized Senbonzakura through stolen knowledge, falling only to an improvised move; rewrote the lives of Ichigo's family, friends and all of Xcution; in TYBW his cut let Orihime undo a breakage The Almighty had locked in.
- **Body:** 198 cm → **63 vox**; 73 kg — extremely lanky: narrow shoulders, long arms and legs, small head (≈1/8 of height). Upright, relaxed, unhurried; often holding a paperback. **Silhouette keys:** tallest of the cast; wavy shoulder-length black hair framing the face; suspenders over a pale long-sleeved shirt; a katana with a **rectangular bookmark-shaped tsuba** and a hanging **tassel**.
- **Palette (hex estimates):**
  - Skin `#EED3BE` · hair black `#16141A` (sheen `#2F2B36`) · eyes brown `#5A3D2B` · scar line `#C99A90` (a long vertical scar running beside the **left eye**, from a childhood wound)
  - Shirt white/off-white `#F1F0EC` (verify) · suspenders black `#1C1C20` · slacks charcoal `#24242A` · shoes dark brown `#2B211B`
  - Paperback: cream pages `#EFE6D2`, cover unknown (propose dark green `#2F4A3A`) — the book he reads is the fictional *The Return of Aion*
  - **Book of the End:** blade steel `#C3C9CF`, edge `#EEF2F5`; tsuba (bookmark) metal — color unverified, propose aged brass `#B8954A`; handle wrap black `#1E1E22` over pale rayskin `#E9E4D8` (est.); **tassel green `#3FAE5B` (manga colour) / purple `#8A5CC7` (anime)**
  - Reiatsu / FX (design proposal — canon shows no glow): aura = faint sepia `#C8A46A` with ink-black wisps `#111114`; the "insert" cut = a hair-thin **ink-black** line that leaves no wound + fluttering page scraps `#F3EBD8`; history edits "age in" with a **sepia** wash that fades into the normal material; Bringer Light `#7DFFB0`.
- **Look by form/outfit:**
  - *Default:* as above, collar open, sleeves down. Ichigo's reiatsu once scorched his right sleeve and arm (the sleeve is intact again later — art error, ignore).
  - *Arm lost:* in the manga Ichigo **severs his left arm** and Orihime regrows it; the anime only wounds it.
  - *Afterlife (TYBW / [N]):* no distinct design in our sources (verify).
- **Weapons:**
  - *Sealed:* his **bookmark** (with tassel), kept in the book he's reading.
  - *Book of the End* [M]: a standard-length katana (≈1 m overall → ≈32 vox; blade ≈70 cm; est.) whose **tsuba is shaped like the bookmark** (an elongated rectangle); the tassel hangs from the guard. Ginjō describes it as a sword with high cutting power that can cut literally anything.
- **Forms & states (ordered):**
  1. **Reading** — book open; Bringer Light still available.
  2. **Book of the End drawn** — the ritual: he closes the book, remarks that he has "lost his page", pulls the bookmark out → katana. (No Ichigo-power upgrade — Ginjō never gave him one.)
  - Cut modes: **Wound** / **Insert** / **Both** — he decides per cut whether it injures, rewrites, or does both [M].
- **Abilities (complete):**
  - *Physical / racial*
    - **Expert swordsman / speed** — strikes before targets can react; Byakuya kept his guard up against him; dodged Senbonzakura's Shikai and, once he knew its blind spot, its Bankai [M]. `[MeleeArc(cut)]`
    - **Bringer Light virtuoso** — evades every swing at the very last instant; chains several flickers to circle an opponent; appears behind Orihime, Yukio, Byakuya [M] and Chad [A-ep 354]. `[Mobility] [Teleport]`
    - **Toughness** — kicked down into his mansion's roof from a great height without serious injury; calm after losing an arm; still struck after a mortal wound [M].
    - **Sensing** — has seen Shinigami since childhood; sensed a Jibakurei [M].
    - **Gadgeteer** — built Riruka's **Love Gun** [M].
  - *Book of the End — the edge*
    - **Cuts anything** — sliced Xcution's door, Riruka's fish tank (forcing the Dollhouse to eject Ichigo and Jackie), Ichigo's incomplete reiatsu blade (dissolving the shroud on his arm), and **Byakuya's Zanpakutō clean in half** [M]. `[MeleeArc(cut)] [Slice] [NEW: WeaponBreak]`
    - **Redirect** — knocked Ichigo's Getsuga Tenshō off course [M]. `[Absorb/Reflect/Redirect]`
  - *Book of the End — Insert Presence (unnamed in canon; wiki label)*
    - **Two kinds of cut** — a wounding cut and a "past-splitting" cut that leaves no mark and no pain; or both at once [M].
    - **On people** — splits the victim's past and inserts himself as someone intimate (relative, friend, lover, mentor, benefactor), even **usurping a real person's role**: Orihime's protector instead of her brother, the giver of Chad's pendant, "cousin Shū" to the Kurosakis, Byakuya's teacher and benefactor [M]. Victims trust and defend him whatever they knew before — Chad and Orihime fought Ichigo for him [M]. It usually settles over days, but **in under an hour during battle** [M]. `[Status(mind control)] [NEW: FactionSwap]`
    - **Full knowledge** — he learns the victim's memories and abilities (all of Byakuya's techniques, the secret 85 cm "Hurtless Area", the counters to his Kidō) [M]. `[NEW: KnowledgeReveal]`
    - **Over-writing → breakdown** — he can keep adding to a victim's past later, but when the new past clashes with what they see they break down ("ruined" people; Orihime and Chad started to collapse) [M]. `[Status(stun/fear)]`
    - **Second cut dispels** — and works the other way on allies, making them remember him as a **traitor** (Ginjō's fake backstory) [M].
    - **Objects** — cutting the **ground** rewrites its structure so a **trap was set "long ago"** (a wall erupts and topples when Byakuya steps on its trigger) [M]; cutting a **weapon** (even Senbonzakura's petal blades) gives complete knowledge of its techniques and weaknesses [M]; cutting a small **tree** made it have grown huge, turning it into a **lightning rod** that soaked up Candice's Thunderbolt [N]; cutting Ichigo in TYBW inserted an **unbroken past for his Bankai**, which Orihime's Sōten Kisshun could then reject back to, getting around The Almighty [M]. `[Construct] [Environmental] [Heal/Reject] [NEW: HistoryEdit]`
    - Leaves a **residual reiatsu trace** on the people and objects he touched — Uryū followed it from victim to victim [A-ep 358]. → counterplay for sensor characters.
    - **Death clause** — when he dies every insertion and edit vanishes [M].
  - *Feints* — cuts a falling leaf and taps the ground so the opponent wonders what he set up [M]. `[Afterimage/Clone]` (misdirection)
- **Passives & weaknesses:**
  - Passives: cut-anything edge; full knowledge after a cut; death clause.
  - Weaknesses: the power needs **a cut to land** — Ginjō: they can't afford to be cut even once [M]; knowing a target isn't controlling them — someone with a stronger loyalty can still strike him (Byakuya) [M]; **improvised, never-used moves** blindside him (Byakuya's hand-thrown Senbonzakura blades) [M]; slim body (impaled, arm severed); emotionally dependent on Ginjō — if Ginjō dies he goes berserk and careless [M]; residual reiatsu trail.
- **Signature moments to recreate (story-mode set pieces):**
  1. *"I lost my page"* — bookmark → katana to punish Moe; then he stabs Orihime from behind without leaving a wound.
  2. *Door and fish tank* — cuts his way into Xcution HQ and slices the fish tank; Ichigo bursts out in his clad Fullbring.
  3. *Rooftop lesson* — Bringer Light makes every one of Ichigo's swings miss; he strips Ichigo's arm shroud and kicks him off the roof; Ginjō intercepts; Yukio's Save gauge fills while Tsukishima lunges at Yukio's arm.
  4. *"Cousin Shū"* — a psychological-horror walk: Ichigo's home, sisters, friends and boss all treat him as family; every NPC turns on the player for attacking him.
  5. *Mansion* — Ichigo severs his arm, Orihime regrows it, Chad and Orihime defend him; he cuts Ginjō (the reveal).
  6. *Byakuya duel* (moonlit chat room with a red moon [A-ep 363]) — leaf cut, ground cut, the wall trap, cutting Senbonzakura to "know" it, splitting Byakuya's blade, the Bankai fight inside the 85 cm blind spot, Byakuya's improvised blade throw.
  7. *Grief* — screams at the dying Ginjō and cuts Riruka (who bursts out of Rukia); Moe carries him out of the forest at dawn.
  8. *TYBW* — stabs the defeated Ichigo in the Soul King Palace to give his broken Bankai an unbroken past; Orihime restores it.
  9. [N] *Lightning-rod tree* vs Candice.
- **Kit proposal (single form):**
  - T: draw Book of the End (from Reading); hold T: return to the bookmark.
  - Shift: Bringer Light with a **wide perfect-dodge window** ("last page": dodging inside it blinks him just outside the attack and opens a free counter-cut); chain ×3 to circle; double-tap = behind target.
  - LMB chain: economical katana — draw cut → diagonal → thrust → rising cut → horizontal finisher, all thin clean cuts that can split structures `[MeleeArc(cut)]`. Forward = lunge thrust; back = rising launcher; air = 3 quick slashes; down-air = falling cut that plants a **bookmark** in the ground (pre-arms E there); sprint = passing cut. Every hit applies the current cut mode.
  - Heavy (hold LMB): **Cut Through Anything** — one deliberate cut that ignores guard and armor, **breaks weapons** (halved-blade state), splits barriers and **containers** (ejecting Dollhouse / pocket-dimension prisoners) and slices structures along a clean plane (≈10 m, est.) `[Slice] [NEW: WeaponBreak]`.
  - G **Cut mode** — tap cycles Wound ↔ Insert; hold = Both (costs meter).
  - Q **Insert Presence** — on hit, stacks "Bookmarked": mooks convert to allies within seconds; elites stop targeting him and body-block for him; bosses and players get **friendly-fire masking** (their AoEs pass through him unless they aim at him manually) and their summons/allies treat him as a friend [X scaling]. Hold Q on a Bookmarked target = **Rewrite** → Breakdown (long stun/collapse), which ends the conversion `[Status(mind control/stun)] [NEW: FactionSwap]`.
  - E **History Edit** (cut a surface; pick the edit by tap/hold or Tab): **Trap** — hidden trigger; a wall erupts and topples, or a spike pillar / pitfall [M]; **Growth** — a sapling becomes a decades-old tree: lightning rod, barrier, climbing route [N]; **Door** — "it always had a door": carve a doorway or tunnel with no debris [X, within "alter its structure"]; **Fault** — "it was always cracked": the next hit collapses it [X]; **Restore** — "it was never broken": revert the area to its pre-damage snapshot [X, mirrors the TYBW restoration]. In air: edit the wall/ceiling he's next to. `[Construct] [Environmental] [Heal/Reject] [NEW: HistoryEdit]`
  - R **Weapon Reading** — cut an enemy's weapon, Zanpakutō, Fullbring object or projectile swarm (e.g. Senbonzakura's petals): reveals their kit, cooldowns, next intended move and **hidden safe zones** (an 85 cm ring around Byakuya); every move they have already used is marked **known** and auto-countered for the rest of the fight. Hold R on an ally's broken weapon = **Unbroken Past** (restore it; with an Orihime ally, even "locked" breakage) `[NEW: KnowledgeReveal] [Heal/Reject]`.
  - F **Redirect** — angled parry that sends a beam or crescent off course `[Absorb/Reflect/Redirect]`.
  - Z **Feint** — "was that meaningful?": cuts a leaf or taps the ground to plant a **fake** edit marker; AI routes around it.
  - X **Second Cut** — dispel one of his edits/insertions (or flip an ally into "remembering" him as an enemy, for story use).
  - C flare: pages flutter in a sepia aura; weaker Fullbringers buckle.
  - V **Epilogue** [X scale] — one wide, non-damaging circular insertion cut: every non-boss enemy inside becomes an ally, bosses inside are Read + Bookmarked, and the terrain inside takes a chosen edit preset (traps everywhere / restore everything).
  - Tab: edit library (trap types, door/tunnel, growth, fault, restore) · insertion roles (*family* = won't attack him; *mentor* = hesitates; *debtor* = defends him) · Soul Pull · [X] Love Gun (he built it).
  - Passive: **death clause** — if he is KO'd, every edit, trap, door, restoration and conversion reverts at once.
- **AI notes:**
  - Calm, minimal movement, never wastes an action. Opens at range by cutting the ground and leaves (real traps + fakes) and baits the player onto them.
  - Goes for the player's **allies first** to turn them; once a cut lands on the player or their weapon, enters a **knowledge phase** that auto-counters every move the player has already used in the fight — only *new* moves, ally combos or environmental hits land reliably (the Byakuya lesson).
  - Rage phase (story, if Ginjō falls in the same fight): drops composure, Wound-only killing cuts, ignores defense.
  - Tells: closes the book / "lost my page"; a small smile right before a trap fires; glances at the player's feet when they Bringer-Light.
- **Callouts:** "Bukku obu ji Endo." (quiet, never shouted). No other named attacks in canon.

---

## 4. Riruka Dokugamine (毒ヶ峰 リルカ) — Xcution member No. 003
- **Wiki:** https://bleach.fandom.com/wiki/Riruka_Dokugamine · https://bleach.fandom.com/wiki/Addiction_Shot · https://bleach.fandom.com/wiki/Rukia_Kuchiki_vs._Riruka_Dokugamine · https://bleach.fandom.com/wiki/Mr._Pork
- **Roster tier:** **B** — popular, with a unique trap/polymorph kit; reuses the pocket-dimension tech built for Yukio.
- **Canon power (1–10):** **3** (hax **6**) — sealed Rukia into a plush (Rukia was holding back and refused to kill a human, and still froze her foot); hid inside a person so completely that Byakuya found no trace of her; her own blows are weak (punching Chad only hurt her hand [A-ep 346]).
- **Body:** 156 cm → **50 vox**; 43 kg; 15 years old in 2003 [KO]. Petite and slim; head ≈1/6.5 of height (slightly stylized). **Silhouette keys:** two long **magenta twin tails** with a **rabbit-eared hat** sitting between them; short dark dress with a white chest panel; **thigh-high boots**; heart-shaped gun.
- **Palette (hex estimates):**
  - Skin `#F7DECD` · hair **magenta** `#C8327F` (shade `#8F1D59`, highlight `#E86AA6`) · eyes magenta `#B4246B`
  - Hat light/off-white `#F0EAE2` (shade `#CFC6BA`) with two rabbit-ear flaps at the back (trim color: verify)
  - Dress near-black plum `#241D2C` (verify) · white chest panel `#F4F2F5` · dark ribbon above it `#141418` · thigh boots `#1A171E`
  - Enhanced: forearm bands white `#F4F4F1`, two **yellow spikes** at each hand `#F2C230`, **yellow collar** `#F2C230`, **pink tie** `#F07AA8`, white **broken-heart chest plate** `#F6F6F3`, white leg armor, stiff rabbit ears white
  - Dollhouse pass: pink heart `#FF5FA2` with a white **"R"** `#FFFFFF`, glow `#FFB3D6`
  - Love Gun (verify all): heart body `#E8457A`, wing fins white `#F4F4F6`, vial glass `#CDEEFA` with pink fluid `#FF7FB6`; heart glows `#FF9ACB` when the vial is twisted
  - Aura (C flare, design): pink `#FF7FB6` hearts. Human Container exit: green flash on the host's chest `#7DFFB0` [A-ep 366]
- **Look by form/outfit:**
  - *Default:* fringe over the forehead and one loose strand down the **right** side of her face; hat between the pigtails; dark dress with white cloth over the chest and a dark ribbon above it; thigh boots. Props: flashlight (myopia), doughnut box, tissue (to force a sneeze).
  - *Enhanced Dollhouse:* white forearm bands with two yellow spikes at each hand and a round **"R" badge** on the back of each gauntlet; the hat's flaps become upright **rabbit ears**; yellow collar, pink tie, white broken-heart chest armor, white leg armor.
  - *After Tsukishima's slash:* gash at the collarbone/shoulder; most of her **left pigtail cut off** [A-ep 366].
  - *TYBW:* same outfit assumed (verify).
- **Weapons:**
  - **Love Gun (ラブ・ガン)** — a handheld heart with wing-like fins on both sides and a **fluid vial** jutting out of the back; invented by Tsukishima [M]. ≈25 cm heart, ≈40 cm fin span (est.) → ≈8 × 13 vox.
  - Enhanced gauntlets (white, yellow spikes) — stab for Human Container, fire Addiction Shot.
- **Forms & states (ordered):**
  1. **Dollhouse** (base) — innate; the only "command" is the permission line.
  2. **Enhanced Dollhouse** — after Ginjō's transference.
  - Target states: **marked** (pass attached) → **permitted** (inside a container / turned into a vessel).
- **Abilities (complete):**
  - *Dollhouse (ドールハウス)*
    - **The rule** — she can freely move people and objects **into and out of anything she adores or finds cute**; she calls it a power of "love" that draws out the full power of whatever she loves [M].
    - **Pass** — she forms a small **heart-shaped pass marked "R"** in her hand and throws it; once it sticks, "**Anta wo kyoka suru wa**" ("I permit you") shrinks the target into the chosen object [M]. `[Projectile(homing)] [Status(mark)]`
    - **Release** — she **sneezes on the object** and everyone inside pops out at normal size (she forces the sneeze with a twist of tissue or by tickling her nose with her own hair) [M].
    - **Container destroyed → forced ejection** at full size (Tsukishima cut the fish tank [M]; a bird cage burst when Ichigo won [A-ep 351]).
    - **Container interiors are little worlds** — the dollhouse has rooms and walls; the fish tank holds a rocky, wet, muddy landscape big enough for Ichigo vs Jackie [M]; the bird cage [A-ep 351]. `[NEW: PocketDimension]`
    - **Vessels** — a person can be put *into* an object so that they become it: the yakuza "Mr. Pork" inside a pig plush walks, talks and fights; Rukia became a small **rabbit plush** that could run and Shunpo but couldn't hold her sword, and her Kidō **exploded inside the plush** [M]. `[Transform(polymorph)] [Status] [NEW: Polymorph]`
    - **Plush flood** — fills a room with giant stuffed animals that fly at, cling to and pin the target (mechanism unstated) [M]. `[Swarm] [Bind] [Construct]`
    - Childhood: locked a boy she liked in a **chest** and brought him sweets every day [M].
    - TYBW: she put a small **Valley of Screams into a box** so Yukio could shape it into a room on rails (Urahara's way into the Royal Realm) [M].
  - *Love Gun*
    - Fires **miniaturized objects stored inside it, which grow to full size** in flight (a heart-shaped cabinet at Rukia) [M]; twisting the vial drains the fluid and lights up the heart → a bigger, harder shot [M]. `[Projectile(explode)] [Construct] [NEW: ProjectileGrowth]`
  - *Enhanced Dollhouse*
    - **Addiction Shot (アディクション・ショット)** — she points her arm, the "R" lights up on the gauntlet's round plate, a heart flies from her fist and sticks; she calls the target's name and admits them → sealed into an object of her choice (Rukia → plush) [M]. `[Projectile(homing)] [Status] [NEW: Polymorph]`
    - **Human Container** (unnamed) — stabs a target with the gauntlet; the "R" glows and light pours from the wound; she **hides inside them**. The host keeps control but she has **limited control**, can read their **thoughts** and is **undetectable** (no reiatsu, no body); the host faints when she enters and when she leaves; to exit, door-like markings (a sideways "H" with rivet dots) open on the host's chest and launch her out [M]. She used it to shield Rukia and Ichigo from Tsukishima's killing cut. `[Sensing/Stealth] [NEW: Possession] [NEW: KnowledgeReveal]`
  - *Other*: Bringer Light (drops from rooftops, cuts off fleeing Rukia, vanishes at the end) [M]; senses spiritually aware humans such as Tatsuki [M]; **Mr. Pork contract** — she handed him a phone; he must turn up within 15 minutes of her call [M] `[Summon]`.
- **Passives & weaknesses:**
  - Only things she finds **cute** qualify — and an enemy who doesn't find something cute can simply cut it (Rukia vs the cabinet) → Love Gun objects and containers have HP; breaking a container frees everyone.
  - **Sneeze = release all**; [X] thick dust from destruction gives a small per-second chance of an involuntary sneeze.
  - **Severe myopia** (refuses glasses and contacts) → short sight / lock-on range; needs a flashlight in the dark.
  - Hot-tempered and vain ("always clean and cute"); physically weak; her death presumably frees every prisoner (death clause).
- **Signature moments to recreate (story-mode set pieces):**
  1. *Berry in the Box* — Ichigo shrunk into the dollhouse vs Mr. Pork (15-minute timer, Giriko's Beast Mode), freed by a snotty sneeze.
  2. *Bird cage* [A-ep 351] — Ichigo vs Mr. Pork and the chicken plush "Bone-Skin"; the cage shatters.
  3. *Fish tank* — Ichigo vs Jackie inside the tank world.
  4. *"Get lost"* — Love Gun pressed to Tsukishima's back on the rooftop.
  5. *Doughnut table* — inside Yukio's game with Orihime (quiet social scene).
  6. *Padded toy room* (chat room) vs Rukia: plush flood, heart cabinet, Addiction Shot → bunny-Rukia, Bringer Light stomp, Kidō backfire, Tsukishiro freezing her foot, sneeze release, then she vanishes **into Rukia**.
  7. *Bursting out* of Rukia's chest to take Tsukishima's killing cut.
  8. *Farewell* — thanks everyone from a rooftop and vanishes with Bringer Light.
  9. *TYBW* — the Valley-of-Screams room ride into the Royal Realm with Yukio; she scolds Orihime.
- **Kit proposal:**
  - *Form 1 — Dollhouse + Love Gun*
    - Shift: Bringer Light hops; can perch on railings and rooftops; double-tap = in front of/behind target.
    - LMB: Love Gun rapid shots — mini hearts, sweets and plushes that **pop to full size on impact** (small knockback, soft debris obstacles). Forward = point-blank blast; back = backflip shot; air = 3 shots; down-air = stomp (as on bunny-Rukia); sprint = door kick.
    - Heavy (hold LMB): **Vial Twist** — the heart glows and a stored furniture-sized object (heart cabinet, wardrobe…) grows in flight and crushes `[Projectile] [Construct] [NEW: ProjectileGrowth]`; limited vial charges.
    - Q **Dollhouse Pass** — homing "R" heart; marks a target (several marks allowed).
    - E **"I permit you"** — every marked target goes into the selected container: *Container mode* (shrunk into a pocket arena inside a world object she can carry or set down; smashing the object frees them) or *Vessel mode* (turned into a plush: tiny, no weapons, Kidō-type moves backfire). Lasts until a sneeze, the container breaks, or Riruka is KO'd.
    - R **Plush Flood** — a wave of giant stuffed animals bounces in, clings and piles on (stacking slow → pinned), leaving soft walls.
    - F **Call Mr. Pork** — phone call; he arrives a few seconds later (her "15 minutes") — brawler summon; under a Giriko clause he goes Beast Mode.
    - Z **Sneeze** — release a container/plush (prisoners re-enlarge where it sits; [X] drop a released heavyweight onto a target); hold Z = tickle-nose wind-up.
    - X **Keep / Take Out** — pull a nearby object, debris chunk or ally into a cute item she carries and take it out later (the canon rule "into and out of anything she adores"; these uses are [X]).
    - G **Adore** — aim at a world object to "fall in love" with it = make it the active container (only cute-tagged objects: toys, plushes, aquariums, cages, dollhouses, her own Love-Gun furniture).
    - C flare: pink-heart aura (tsundere "hmph").
    - V **Grand Opening** [X] — a full-vial shot of a dollhouse that grows to **building size** where it lands; enemies in its footprint are pulled inside to face Mr. Pork in Beast Mode until the house is wrecked.
    - Tab: container select (Dollhouse / Fish tank / Bird cage [A] / Chest / Rabbit plush / Pig plush / Heart cabinet) · Love Gun ammo · Flashlight · Soul Pull.
  - *Form 2 — Enhanced Dollhouse (T)*
    - LMB adds gauntlet-spike jabs and kicks between shots.
    - Q **Addiction Shot** — fast long-range fist heart; calling the name seals instantly into the chosen object (E becomes a mass permit).
    - F **Human Container** — gauntlet stab on any target (ally or enemy): she vanishes inside them — invisible and undetectable, sees their intent (AI: next actions; PvP: their cooldowns/aim), nudges their movement and aim slightly, and can **burst out** through the chest doors (stuns the host; can intercept a blow aimed at the host). The host faints briefly on entry and exit `[NEW: Possession]`.
    - Other slots as Form 1; V can be fired from inside a host as she bursts out.
- **AI notes:** keeps her distance, flits across rooftops, floods with plushes, tags with passes and permits as soon as anyone is marked; if the player closes in she kicks/stomps and Bringer-Lights away; when losing she **hides inside a nearby NPC** and pops out to block a killing blow aimed at that host. Short sight range (≈half normal), squints, uses a flashlight on dark maps; the sneeze wind-up is a clear tell that prisoners are about to drop out.
- **Callouts:** "Anta wo kyoka suru wa!" (I permit you) · "Adikushon Shotto!" · naming: "Dōruhausu", "Rabu Gan" · sneeze SFX.

---

## 5. Yukio Hans Vorarlberna (雪緒・ハンス・フォラルルベルナ) — Xcution member No. 005; president of Y. Hans Enterprise
- **Wiki:** https://bleach.fandom.com/wiki/Yukio_Hans_Vorarlberna · https://bleach.fandom.com/wiki/T%C5%8Dshir%C5%8D_Hitsugaya_vs._Yukio_Hans_Vorarlberna · https://bleach.fandom.com/wiki/Valley_of_Screams
- **Roster tier:** **B** as a playable — but build his **Game Space / chat-room / arena-rules tech early**: it is the "boss rewrites the arena" mechanic, the in-lore **Training Mode** (HP crosses, fast-forward, spawned dummies), and the base for Riruka's containers and Giriko's clauses.
- **Canon power (1–10):** **4** (hax **8** inside his space) — imprisoned and rule-bound Ichigo, Ginjō, Orihime and Chad; ran six parallel chat rooms holding captains, and only Ichigo's Bankai broke one open; but Hitsugaya found him and froze his hands, which shut everything down.
- **Body:** 154 cm → **49 vox**; 40 kg; a slight boy (age not given in our sources). Hunched over his console; head ≈1/6 of height. **Silhouette keys:** spiky blond hair with bangs over the **left eye**; black cap; dark coat with a white cravat; white gloves; handheld console + headphones.
- **Palette (hex estimates):**
  - Skin `#F6E2D2` · hair blond `#E8CF6A` (shade `#BE9F3F`, highlight `#FFF0A8`) · eyes green `#3BAA62`
  - Cap black `#18181C` · coat near-black `#1C1C21` (verify; may be very dark navy) · cravat white `#F5F5F2` · gloves white `#F2F2EF` · pants `#25252B` · boots `#1D1B1F` · headphones `#2A2A30` (verify)
  - Console (verify): body `#E6E7EA`, screen `#0F1418`, buttons `#E23D3D` / `#3D7BE2` / `#F2C230` / `#3DBE6B`
  - Digital Radial Invaders: white gauntlets `#F3F3F1` with colored button pads; white headphone spikes; white shin/foot armor (**manga only** — the anime keeps his normal boots)
  - Game FX [A-ep 354, 363]: pixel walls **green `#1FD16A` on black `#050806`** (also his C-flare glitch aura); Save = black pixel tessellation `#050505` with dim edges + a **red Save gauge** `#E02F2F` that flips to "COMPLETE"; digital blades = black pixel matter `#0A0A0C`; shield **green** `#3DEB7A`; corridor blue `#2E5BD6` with yellow doors `#F2C230`; HP crosses (verify color)
- **Look by form/outfit:** *Default* as above (headphones on while gaming). *Digital Radial Invaders:* white gauntlets with control pads (a small **radar antenna** extends from one), headphones with **two pointed spikes**, white shin/foot armor (manga). *Inside his dimension* he usually appears only on **floating screens**, or sits in a monitor-lined **control room** [A-ep 363]. *TYBW:* same look assumed (verify). *Epilogue* [M]: ten years later his company, as "Y.Hans", sponsors Chad's title fight (no design shown).
- **Weapons/tools:** the **Invaders Must Die** console (handheld; runs on battery; can be plugged into a wall socket) [M]; the enhanced form's gauntlet controls (the anime shows the console mounted on his arm) [A-ep 363].
- **Forms & states (ordered):**
  1. **Invaders Must Die** (base) — works through the console screen.
  2. **Digital Radial Invaders (画面外の侵略者, "invaders from outside the screen")** — after Ginjō's transference; the only Xcution upgrade with its own name.
- **Abilities (complete):**
  - *Invaders Must Die (インヴェイダーズ・マスト・ダイ)*
    - **Save** — a swarm of black pixels engulfs the target into a tessellated box; a Save gauge fills (interruptible — Tsukishima nearly cut Yukio's arm mid-save) and the target is stored with their **reiatsu completely cut off** [M][A-ep 354]. Costs battery; he lacked the charge to Save Tsukishima [M]. `[Bind] [Sensing/Stealth] [NEW: EntityStore]`
    - **Load** — releases stored people anywhere (Ichigo was dropped at the backup HQ) [M]. `[Teleport] [NEW: EntityStore]`
    - **Game Space** — an internal dimension he runs from the screen: **HP lives** (six crosses over each head; option to mirror real damage; "You Die" / Game Over) [M]; countdown timers [A-ep 354]; **weather, gravity, time flow and terrain types** [M]; separate rooms (Chad's high-intensity training room) [M]; daily necessities (table and chairs, toothbrushes, soft beds, tap water, a whole house) [M]; the "**Forbidden Zone**" cage, which can't be broken by rule and blocks sound both ways [M]; spawned **Hollows** as training dummies [A-ep 358]; painted 2D backdrops (a cheering feudal town) [A-ep 354]. `[Field] [Construct] [Summon] [NEW: PocketDimension] [NEW: ArenaRules]`
    - **Fast-forward** — days inside pass in ~90 minutes outside [M]. `[Field(time)]`
    - **Tracking bug** — tags people to find them later (how he found Ginjō's secret base) [M]. `[Sensing/Stealth]`
    - **Holographic clones** (as a child, of his parents) [M]. `[Afterimage/Clone]`
    - Emits **zero reiatsu** → hides trainees from sensors [M].
    - Pact: can't dismiss a space holding Ginjō without his order [M].
  - *Digital Radial Invaders (デジタル・ラジアル・インヴェイダーズ)* — "wears" the game into the real world:
    - **Camouflage** — a radar antenna from the gauntlet; near-invisible [M]. `[Sensing/Stealth] [NEW: ActiveCamo]`
    - **Digital clones** of anyone, made of hard-light pixels, behaving and reacting exactly like the originals; created or deleted in seconds — the decoys Ichigo "killed" [M]. `[Afterimage/Clone] [NEW: Hologram]`
    - **Digital Blade** — black pixel blades formed anywhere [M]. `[MeleeArc(cut)] [Swarm]`
    - **Chat rooms** — encases each Shinigami-vs-Fullbringer pair in its own themed dimension; a room dissolves when one fighter dies; if a fight is settled without a death he can **fold the room** (the sky darkens and caves in) and kill everyone inside; supposedly unbreakable, yet **breakable from inside** with enough power (Ichigo's Bankai release) [M]. `[Field] [NEW: PocketDimension]`
    - **Digital missiles** — explode even when cut [M]. `[Projectile(homing, explode)]`
    - **Digital shield** (green [A-ep 363]) [M]. `[Shield]`
    - **Digital monsters** — programmed hunters of many sizes, set to chase "forever" through every wall, floor and ceiling of his space [M]. `[Summon]`
    - **Delete / repair** — digitizes crumbled walls and rooms out of existence [M] and repairs damaged walls [A-ep 363]. `[Environmental] [Heal/Reject(voxels)] [NEW: HistoryEdit]`
    - TYBW: shaped Riruka's boxed **Valley of Screams** into a **room with rails** ("manipulating space with electrical power"); a **stake** marks the destination; it slipped into the Royal Realm with nobody releasing reiatsu (Grimmjow and Nel rode in it too) [M].
- **Passives & weaknesses:**
  - **Physical controls** — he must press buttons; ice over his hands and console shut him down completely, and he couldn't call off his own monsters [M].
  - **Battery** — limits Saves; plugging in solves it [M] `[NEW: Battery]`.
  - Frail; panics when threatened; brags (Hitsugaya walked up to him mid-speech) [M].
  - His death may *not* close his rooms (Hitsugaya's doubt) — design decision.
- **Signature moments to recreate (story-mode set pieces):**
  1. *Save on the rooftop* — pixels swallow Ichigo and the red gauge fills while Tsukishima lunges at Yukio's arm and Ginjō blocks.
  2. *Game Space training* — HP crosses, 60-s countdown, Orihime's table and chairs, the Forbidden Zone cage, fast-forward at two minutes to midnight.
  3. *Decoys* — Ichigo cuts down the Xcution clones; Ikkaku stabs Yukio's clone.
  4. *"Choosing a game room"* — the battlefield splits into chat rooms.
  5. *Maze vs Hitsugaya* — blue corridors, missiles cut and exploding, a frozen yellow door, Yukio taunting from screens, walls deleted, monsters summoned, then Hitsugaya freezing his legs and controls while the monsters close in.
  6. *Folding the sky* over Renji and Jackie.
  7. *Bankai breakout* — the Karakura room cracks and shatters.
  8. *TYBW* — the Valley-of-Screams room rides its rails into the Royal Realm; he refuses to leave it.
- **Kit proposal:**
  - *Form 1 — Invaders Must Die*
    - Shift: Bringer Light. LMB: petulant kicks + console bonks (canon: a bad habit of kicking things [A-ep 366]); [X] small pixel-cube pellets. Heavy: [X] short black-pixel burst.
    - Q **Save** — channel on a target (red gauge ≈3 s, broken by damaging Yukio or losing line of sight); stores the target off-world; battery cost scales with target power (bosses need a full charge and may fail: "not enough memory").
    - E **Load** — drop a stored entity anywhere (rescue/reposition allies; put enemies in a cage, in mid-air, or into a chat room).
    - R **Game Space** — pull everyone in a radius into his pocket dimension (his body stays outside; he plays through a screen/HUD).
    - F **Forbidden Zone** — unbreakable, soundproof pixel cage around a target `[Bind] [Construct]`.
    - Z **Tracking Bug** — tagged targets stay visible through walls.
    - X **Spawn Item** — tables, chairs, walls, beds, tap water: instant cover/platform Constructs.
    - G **Plug In** — plug into a wall socket in any building: stationary, fast battery recharge.
    - C flare: glitch aura. V **Game Over** — fold the active Game Space/chat room (massive damage to everyone inside who wasn't Saved first); outside a space: mass Save of weak targets.
    - Tab (**Game Settings**): HP-lives mode · gravity (0.3× / 1× / 2.5×) · weather (clear / rain / snow / storm) · time (fast-forward / slow) · terrain preset (city, park, rocky obelisks, padded toy room, maze, Karakura replica) · indestructible walls · countdown · backdrop · poison swamp [A omake] · spawn training Hollows [A].
  - *Form 2 — Digital Radial Invaders (T)*
    - Shift: Bringer Light; [X] double-tap swaps places with a digital clone.
    - LMB: **Digital Blades** erupt from surfaces near the target (forward = blade line along the ground; back = blade from below as a launcher; air = blades around him; down-air = blade rain; sprint = trailing blade wall). Heavy: blade array `[Swarm]`.
    - Q **Digital Missiles** (homing; explode even when cut). E **Digital Shield** (green). R **Digital Monsters** (pursue forever; can't be recalled).
    - F **Digital Clone** — hard-light copy of any visible character (model, kit, AI) for a duration; [X] once per cooldown a lethal hit lands on a clone instead of him.
    - Z **Delete / Repair** — pixel-dissolve a wall or structure section (no debris), or restore damaged walls.
    - X **Chat Room** — seal the lock-on target with one fighter (an ally or himself) in a themed private arena; it ends when one dies; V can fold it.
    - G **Camouflage** (breaks on attack). C flare.
    - V **Game Over** (fold rooms) or **Split** (pair everyone off into chat rooms at once).
    - Tab: Game Settings — [X] now also applicable to a radius of the real world.
- **AI notes:** never fights head-on; hides (camo or a control room) and taunts from floating screens; spawns missiles and monsters, splits the player's team into chat rooms, and folds any room whose fight is "settled". **Arena-rewrite boss rule:** every ~30 s a SETTINGS pop-up announces a rule change (gravity / weather / terrain / HP mode) with a 3-s warning. Defeat condition: reach him and **Bind or Freeze his hands** → every construct freezes, while his "forever" monsters keep coming — at him too. Panic tell: shrieks and Saves/Loads himself away when a melee enemy gets close (if the battery allows).
- **Callouts:** "Sēbu." · "Rōdo." · naming: "Inveidāzu Masuto Dai", "Dejitaru Rajiaru Inveidāzu" · on-screen text "YOU DIE" / "COMPLETE".

---

## 6. Giriko Kutsuzawa (沓沢 ギリコ) — Xcution member; bartender
- **Wiki:** https://bleach.fandom.com/wiki/Giriko_Kutsuzawa · https://bleach.fandom.com/wiki/Number_Attack · https://bleach.fandom.com/wiki/Kenpachi_Zaraki_vs._Giriko_Kutsuzawa
- **Roster tier:** **C** (boss/NPC first) → promote to **B** once the clause engine exists (it is shared with Yukio's rules and Riruka's training traps).
- **Canon power (1–10):** **3** (contract hax **7**) — his contracts are absolute (they can incinerate everyone bound, and he once killed his wife with a look), but in open combat Kenpachi bisected his giant form before he landed a blow.
- **Body:** height not given → **≈185 cm → ≈59 vox (verify)**; a tall, middle-aged man of average build, upright butler-like posture. **Empowered Form:** a hulking giant that **dwarfs Kenpachi (202 cm)** → ≈3.5 m (est.) → build at 16 vox/m (≈56 vox) and scale ×2. **Silhouette keys:** bartender waistcoat and bow tie; thick mustache; a **leather strap slanting over the right eye**; cane; gold pocket watch on a chain; Enhanced: **nine floating clocks** and clock-hand arrows on the armor.
- **Palette (hex estimates):**
  - Skin `#E3BFA1` · hair & mustache `#221B17` · eye brown `#4A3426` · eye strap leather `#3A2A1F`
  - Shirt white `#EFEFEB` · waistcoat dark `#2A2530` (verify) · bow tie black `#121214` · trousers `#1E1E22` · shoes `#141416`
  - Cane dark wood `#3B2A1E` with a silver cap `#BFC3C8` (verify) · pocket watch gold `#C9A24A` (shade `#8C6B22`), face `#FFF6DC`, black numerals
  - Reiatsu: Number Attack numerals **green** `#5EF08A` (glow `#C8FFD8`) — also his C-flare aura
  - Enhanced: white armor `#F1F1EE`, clock-hand arrows black `#1E1E22`, floating clocks with gold rims `#C9A24A` and white faces, strap with linked circles (gold, verify)
  - Empowered skin **green** `#4E9E58` (anime) / normal skin (manga)
  - "Flames of time" — never depicted; proposal: pale green-gold fire `#CFFF9A` → `#4FD06A` with numeral-shaped embers
- **Look by form/outfit:** *Default:* short dark hair, mustache, eye strap, white shirt, dark waistcoat, bow tie, cane. *Enhanced:* white armor wrapped around the **upper chest** with an **upward clock hand on the left shoulder**; white armor around the hips with a **downward clock hand on the right thigh**; nine clocks floating around him (they pop in and out between pages in ch. 463 — an art slip; keep them always visible); the eye strap gains a chain of linked circular dials; a **knob labeled "3"** on the left shoulder. *Empowered:* enormously muscled and hunched, much like Mr. Pork's Beast Mode; green-skinned in the anime. *Backstory:* younger, both eyes. *Afterlife:* no specific design (verify).
- **Weapons/tools:** an antique gold **pocket watch** — the Kutsuzawa family's "Good Luck Watch", the only god he believes in [M]; a cane-like stick (carried, never used to fight).
- **Forms & states (ordered):**
  1. **Time Tells No Lies** (base).
  2. **Enhanced Time Tells No Lies** (transference).
  3. **Empowered Form** — turn the "3" knob.
- **Abilities (complete):**
  - *Time Tells No Lies (タイム・テルズ・ノー・ライズ)*
    - **Timers + terms** — attaches "timers" (タイマー) to targets (usually people, also a whole box) with terms and conditions he chooses; the subjects must obey them until time runs out [M]. `[Status(death-mark)] [Field] [NEW: RuleZone]`
    - **Immutable** — once set, not even Giriko can cancel one; a mistake in his own terms kills **him** instantly [M].
    - **Flames of time (時の炎)** — if the terms are broken before time is up (by the subject *or* by an outsider), everyone under the timer **and the area itself** burn away without a trace: the punishment of the "god of time" (時の神) [M]. `[Blast] [Environmental(fire)]`
    - **Examples:** Mr. Pork had to kill Ichigo within **15 minutes** or stay a toy forever; when time ran out he mutated into **Beast Mode** (bulkier, longer arms, **five eyes**, tears up floors with his teeth) [M]; the dollhouse itself carried a **30-minute** "survive, then you may leave" timer — pulling Ichigo out early would have incinerated him, Mr. Pork and the house [M]; a fulfilled condition can also end a transformation (Mr. Pork turned back once Ichigo's true Fullbring appeared) [M].
    - **Gaze kill (backstory)** — the watch's "true ability": killing someone without touching them; he killed his wife just by looking at her, then wavered and **lost his right eye** — it was a contract with a god, not a prayer [M]. `[Status(death-mark)]`
    - **Number Attack** (unnamed; wiki label) — green reiatsu pours from the watch, the face glows and its numerals peel off as **guided projectiles** that burst in small explosions [M]. `[Projectile(homing, explode, multishot)]`
  - *Enhanced* — nine floating clocks (no function shown) [M].
  - *Empowered Form* — turning the knob makes him a giant; he says his strength grows **the simpler the clauses are**, and this contract is the simplest of all: raw, brutal strengthening [M]. True ceiling unknown (killed instantly). [N] he used Time Tells No Lies again to power up and **hurl an uprooted tree** back at Candice and Meninas. `[Transform] [Grab/Throw]`
  - *Other:* smooths over police, firemen, neighbors and reporters after Xcution's messes [M][A-ep 353 omake]; bartending.
- **Passives & weaknesses:** bound by his own rules (self-death on a bad clause); boasts while transforming (Kenpachi cut him mid-speech); slow, telegraphed contracts; human body.
- **Signature moments to recreate (story-mode set pieces):**
  1. *The bar* — orange juice for Ichigo; billing Ginjō for the floor tiles; refusing Ginjō another drink.
  2. *The Time Discipline* — Mr. Pork's 15-minute timer, Beast Mode, "survive 30 minutes or burn".
  3. *Mansion* — Number Attack at Ginjō, who flickers away with Bringer Light.
  4. *"Youth overflowing"* — receiving Ichigo's power.
  5. *Knob 3* — the giant, the boast, and Kenpachi's single vertical cut.
  6. *Flashback* — the Good Luck Watch, his wife, the lost eye.
  7. [N] *Tree throw* at Candice & Meninas.
- **Kit proposal:**
  - *Form 1 — Time Tells No Lies*
    - Shift: Bringer Light (dapper sidesteps). LMB: [X] cane fencing (light jabs, sweeps, hook-pull). Heavy: hold to charge a full Number Attack.
    - Q **Number Attack** — tap = 3 homing numerals; hold = all twelve in sequence.
    - E **Survival Clause** (zone) — a clock-face dome: nobody inside may leave until the hand comes round; leaving, being pulled out or breaking the dome → flames of time on everyone bound and on the area (voxels → ash). Fighting inside is allowed.
    - R **Task Clause** (target/summon) — "do X within N s or suffer Y" (stay a plush / mutate into Beast Mode / burn); on an allied summon = timed Beast Mode.
    - F **Time Bomb Clause** (object) — the prompt's idea: a timer on a structure or object: "untouched until zero"; any hit or touch before then detonates the flames of time on it and everything near; left alone, it expires harmlessly. Variant **Evacuation**: everyone still inside the radius at zero burns.
    - Z **Gaze Contract** — stare at a target to start a death timer (≈15 s); he must keep line of sight; looking away or being staggered = **penalty** (one-eye blindness vignette + heavy self-damage); expiry kills mooks and deals massive damage to bosses [X scaling].
    - X **Self-Clause** — accept a simple restriction ("don't move", "Number Attacks only", "no guarding") for N s in exchange for a buff proportional to how simple/harsh it is [X — extends the Empowered rule].
    - G **Watch open / closed** — open: faster Number Attacks and clause casting; closed: cane fighting with better defense.
    - C flare: ticking green aura, clock-tick SFX.
    - V **Verdict of the God of Time** [X scale] — a 30 m Survival Clause over a whole block; one violation incinerates the entire zone.
    - Tab: clause editor (duration 10 / 30 / 60 s · scope zone / target / object · term: stay / don't touch / defeat X / no ranged / survive) · Soul Pull.
  - *Form 2 — Enhanced (T)* — the nine clocks orbit him: [X] each can catch a projectile or be launched as a slow homing bomb; clauses cast faster.
  - *Form 3 — Empowered (T, "3" knob)* — giant brute: haymakers that cave in buildings, ground-pound GroundWaves, a charge that barges through buildings (Brave Souls calls it "Allness" [BS]), tree/boulder hurling [N]; contracts and Number Attack locked (the simplest clause = brute force only) [X]; entering it plays a **long boast** (punishable).
- **AI notes:** a polite bartender; opens by dropping a Survival Clause around the player, then peppers them with Number Attacks while they can't leave; puts Time Bomb clauses on the bridges and buildings the player relies on; checks his watch before every clause (tell); at ≤30 % HP turns the knob and boasts — a deliberate punish window (the Kenpachi kill).
- **Callouts:** naming: "Taimu Teruzu Nō Raizu" · "Taimā." · "Toki no kami" · "Toki no honō".

---

## 7. Jackie Tristan (ジャッキー・トリスタン) — Xcution member
- **Wiki:** https://bleach.fandom.com/wiki/Jackie_Tristan · https://bleach.fandom.com/wiki/Renji_Abarai_vs._Jackie_Tristan
- **Roster tier:** **B** — her dirt-scaling power is the most direct showcase of the destructible world: every crater, rubble pile and dust cloud feeds her.
- **Canon power (1–10):** **3** — dirt-charged kicks shatter rock obelisks and fling slabs of earth, but Renji shrugged off her best kick and dropped her with a hilt strike; her self-destruct still injured and pinned him.
- **Body:** height not given → **≈175 cm → ≈56 vox (verify)**; tall, athletic, curvy, long legs (a kicker); head ≈1/7.5 of height. **Silhouette keys:** straight chin-length black bob; Fullbring: **thigh-high boots**, a hat with a **cloth hanging over the right side of her face**, scarf, pauldrons and bracers; Enhanced: **four motorcycle exhausts** (two on the right shoulder, two on the backs of the thighs) and a cropped sweater; oil-black full body.
- **Palette (hex estimates):**
  - Skin deep brown `#5E3B28` (highlight `#7A5038`) · hair black `#121014` · eyes brown `#3E2A1F` · lips `#4A2A22`
  - Base: low-cut long-sleeved shirt dark brown `#4A3324`; fitted trousers `#2E2A29` (verify); knee boots dark `#231C18`
  - Dirty Boots: boots `#2A211B`; pauldrons/bracers `#3B3029` with rivets `#8D8F93`; scarf `#D9CDB8`; hat `#1F1A18` with face cloth `#2B2522` (all verify)
  - Enhanced: exhausts chrome `#C7CCD2` with heat-blued tips `#5A6E9A`; cropped wool sweater `#D8D0C2` (verify); black undershirt `#141416`; black gloves `#121214`; leg armor `#3A3633`; exhaust smoke `#3A3A3E`
  - Oil armor glossy black `#0B0B0D` with an oily sheen `#2A3140` / faint iridescence `#3E2E52`
  - Aura (C flare, design): dusty amber `#C89B5A` (Dirty Boots) → oily black-violet `#2A2236` (Enhanced). Grime overlay states: dust `#9A8A74`, mud `#5A4630`, blood `#7A0F14`
  - Childhood boots (flashback prop): black in the manga (ch. 471), white in the anime
- **Look by form/outfit:** *Base:* as above. *Dirty Boots:* activated by **rubbing her boots together** — the boots lengthen up the thigh, armor forms on her shoulders and forearms, a scarf wraps her neck, and a dark hat appears with a cloth hanging over the right side of her face. *Enhanced:* the four exhausts; a long-sleeved wool sweater cropped to bare the stomach over a black shirt; black gloves; leg armor. *Oiled:* everything turns glossy black except a small patch of her pants at the crotch. *Powerless* (after self-destruct): base clothes, battered.
- **Weapons:** her **boots** — leather boots from her father, her first present; the first thing to stain them was her murdered brother's blood, which awakened the power [M].
- **Forms & states (ordered):**
  0. **Human** (kicks only).
  1. **Dirty Boots** — rub the boots together.
  2. **Enhanced Dirty Boots** — transference.
  - States: **Oil armor** (exhausts revved) · **Grime level** (0–V).
- **Abilities (complete):**
  - **Kick specialist** — fights almost only with kicks, to dirty her boots with mud and blood faster [M]. `[MeleeArc(smash)]`
  - **Dirty Boots (ダーティ・ブーツ)** — strength rises with **how dirty the boots are**, whatever the dirt is (mud, blood…); she built it up slowly at first, then deliberately ground her boots into the mud and said her strength would now climb **exponentially** [M]; her blows send tremors through the ground [M]. `[Stance] [NEW: GrimeMeter]`
  - **Speed** — surprised Ichigo with it; reappears behind Renji in an instant [M]. `[Mobility] [Teleport]`
  - **Projectile kicking** — kicked Ichigo's energy blast away and said she could shatter any of his blasts with four or fewer blades [M]. `[Absorb/Reflect/Redirect]`
  - **Enhanced: oil armor** — the exhausts belch thickening smoke, then a black oil that bonds to her like armor; now **all the filth on her whole body** counts, not just the boots [M]; a casual stomp breaks the ground into flying slabs [M] (anime: a shockwave that topples the tall rocks behind her [A-ep 363]); a kick's aftershock destroyed an obelisk-sized rock behind Renji [M]; much faster. `[GroundWave] [Blast] [Environmental]`
  - **Self-destruction** — detonates her Fullbring in a large explosion; she survives but loses Fullbring for good; it moderately injured Renji and left him unable to move for a while [M]. `[Blast]`
- **Passives & weaknesses:** needs dirt (weak on clean, hard surfaces); human durability (one hilt strike ended her fight); hates her power and avoids pointless risks [M]; self-destruct is a one-way door.
- **Signature moments to recreate (story-mode set pieces):**
  1. *Fish tank* — kicks Ichigo's blast away, grinds her boots into the mud and kicks him into the water; Ichigo's three-shot bait and Bringer Light kick from behind; his Fullbring runs wild and she tries to call off the session.
  2. *Mansion* — her kick at Ginjō (dodged).
  3. *Rainy obelisk field* (chat room) vs Renji: the exhausts, oil armor, the stomp, the obelisk-breaking kick, Renji's hilt to the gut.
  4. *The sky folds* — Renji refuses to kill her; she self-destructs to blast him free.
  5. *Aftermath* — buries Giriko with his watch; farewell with Yukio.
- **Kit proposal:**
  - **Grime meter** (0–100, tiers I–V, ≈×1.3 damage per tier ≈ ×3.7 at V; the Enhanced cap doubles and the oil armor keeps a floor at tier II) `[NEW: GrimeMeter]`. Gains: walking on soil/mud/rubble, kicking terrain and debris, Mud Rub, being hit by debris or dust, enemy blood on hits. Losses: water and rain slowly wash it off; self-destruct empties it. Visual: boots (later the whole body) progressively caked — voxel colors lerp toward mud / dust / blood.
  - *Form 0 — Human:* plain kicks; T = rub the boots → Form 1.
  - *Form 1 — Dirty Boots*
    - Shift: Bringer Light — low, fast dashes that kick up dust (+grime).
    - LMB chain (kicks only): snap front kick → roundhouse → spinning back kick → axe kick (smash) → jumping spin kick. Forward = flying side kick; back = rising crescent launcher; air = 3 aerial kicks; down-air = heel-drop dive (crater, +grime); sprint = slide through rubble (+lots of grime).
    - Heavy: charged kick — power and crater size scale with grime (tier V ≈ building-cracking).
    - Q **Mud Rub** — crouch and grind the boots (0.8 s, interruptible): a big grime gain scaled by the surface (mud > soil > rubble > concrete).
    - E **Tremor Stomp** — `[GroundWave]`; from tier III it throws slabs of earth into the air.
    - R **Rubble Kick** — punt a nearby slab or debris cluster as a projectile `[Projectile(explode)]`.
    - F **Boot Block** — kick-parry a projectile; weak ones shatter outright.
    - Z **Shadow Kick** — Bringer Light behind the target straight into a kick.
    - X **Scuff Sweep** — low sweeping kick that tears up the surface (short GroundWave, +grime).
    - G **Brace** [X] — plant the feet: no knockback, slow grime trickle.
    - C flare: dust-storm ring, steaming boots. V **Dirt-Max Kick** — spend all grime on one colossal kick.
  - *Form 2 — Enhanced (T)*
    - G **Oil Armor** — rev the exhausts: smoke, then oil coats her (armor, grime floor, speed up). Stomps and kicks scale off whole-body grime.
    - E becomes a **slab-throwing stomp**; heavy kicks push an aftershock through the target into whatever stands behind it (the canon obelisk).
    - V **Self-Destruct** — a huge blast centered on her; she survives at low HP and **permanently drops to Human form** for the rest of the match.
- **AI notes:** reluctant and efficient; before engaging she looks for mud or rubble and grinds her boots in it (clear tell); avoids clean hard ground; smashes terrain to manufacture dirt; respects opponents who won't fight dirty; story: when beaten and spared, she self-destructs to save the enemy who spared her.
- **Callouts:** "Dāti Būtsu." (activation). No other named attacks in canon.

---

## 8. Moe Shishigawara (獅子河原 萌笑) — Tsukishima's self-proclaimed underling; student at Miyashita Commercial High
- **Wiki:** https://bleach.fandom.com/wiki/Moe_Shishigawara · https://bleach.fandom.com/wiki/Ikkaku_Madarame_vs._Moe_Shishigawara
- **Roster tier:** **C** — a fun, cheap comic-relief brawler; needs the luck RNG and structural weak-point tech (both reusable).
- **Canon power (1–10):** **2** (jackpots ≈**5**) — luck broke Ginjō's sword guard and Ikkaku's Hōzukimaru and dislocated Ikkaku's shoulder, but his raw punches are weak, his luck drains on repeat targets, and a single headbutt knocked him out.
- **Body:** height not given → **≈160 cm → ≈51 vox (verify)**; short, wiry teenage delinquent; slouched yankee posture, big expressive face, oversized fists for readability. **Silhouette keys:** shaved head with a **buzzed mohawk strip**; open school jacket over a **red T-shirt printed with a face**; **bandaged right fist** (brass knuckle underneath).
- **Palette (hex estimates):**
  - Skin `#EFCFB4` · hair (buzz + strip) color **uncertain** — propose dark brown `#3A2A20` (verify) · eyes grey `#8C9198`
  - School jacket and trousers (Miyashita Commercial High; color unverified) — propose dark navy `#1E2433` · red shirt `#C8282E` with a black/white face print · sneakers `#E8E8E8` (verify)
  - Bandages `#E9E4D8`
  - **Jackpot Knuckle:** brass `#C99A3A` (shade `#8C6A22`), three reel windows showing red **"7" `#D3212D` on white `#FAFAF5`**; aura and jackpot flash gold `#FFD84A`; coin silver `#C8CCD2`
- **Look by form/outfit:** *Default* (bandaged right hand); *Unwrapped* — bandages off, the brass knuckle with its 777 reels on top.
- **Weapons:** **Jackpot Knuckle (ジャックポット・ナックル)** — a brass knuckle on the right hand bearing three sevens in a row, with slot "reels" on top [M]; ≈10 cm → 3 vox (exaggerate to ~5 for readability).
- **Forms & states (ordered):** single form; state **Wrapped / Unwrapped**; hidden **luck odds**.
- **Abilities (complete):**
  - **Jackpot Knuckle** — anything that comes into contact with the knuckle has its probability bent toward a "jackpot" [M]: his punch "just happened" to land at the exact angle where Ginjō's sword guard "just happened" to be weak, and broke it [M]; one weak punch snaps a **tree** in half [M]; a **coin** he flicked "just happened" to hit a chandelier that "just happened" to hang loose → it fell between Ginjō and Ichigo [M]; his punches dislocated Ikkaku's shoulder, snapped a tendon in his finger and broke **Hōzukimaru's blade** off [M]; a two-fisted punch to the body badly hurt Ikkaku [M]. `[MeleeArc(smash)] [Environmental] [NEW: LuckRNG] [NEW: WeakPoint] [NEW: WeaponBreak]`
  - **Diminishing returns** — repeated jackpots on the same target lower his odds; good luck in general lowers them, bad luck (injuries included) raises them; the odds reset every midnight [M][KO]. `[NEW: LuckRNG]`
  - **Endurance** — kept fighting through heavy hits; grabbed Ikkaku's leg after being knocked out [M]. `[Bind]`
  - Spiritual awareness; **no Bringer Light / air movement** (he yelled at Ikkaku to stop "flying") [M].
- **Passives & weaknesses:** weak, unskilled punches without luck (Ikkaku: they couldn't snap a wooden sword); per-target luck decay; can't bring himself to fight a girl he finds pretty (Orihime floored him just by turning around) [M]; grounded.
- **Signature moments to recreate (story-mode set pieces):**
  1. *Orihime* — announces he'll kill her, is floored by her looks, rallies when she gets angry.
  2. *The fork* — pinned to the table by Tsukishima's fork.
  3. *Chandelier* — the coin flip that blocks Ginjō; the cracked guard; the 777 reveal.
  4. *Park chat room* vs Ikkaku: trees snapping, the dislocated shoulder Ikkaku flexes back into place, Hōzukimaru broken, a bare-knuckle exchange as his luck fades, headbutt KO, the leg grab.
  5. *Dawn* — carries the dying Tsukishima out of the forest.
- **Kit proposal:**
  - Shift: plain ground dash (no Bringer Light); Space = normal jump, **no air steps**.
  - LMB chain: jab → **right straight (roll)** → hook → **right uppercut (roll)**. Every right-hand hit spins three reels (0.3-s UI on the knuckle): blank = weak hit; cherry/bar tiers = crits; **777 = jackpot**, routed by what was hit: *weapon* → breaks (halved-blade state); *limb* → dislocated (arm disabled); *body* → massive damage; *structure/tree/pillar* → snaps at its weakest point and falls. Forward = lunging straight; back = uppercut launcher; down-air = falling hammer fist; sprint = shoulder tackle.
  - Heavy: **All-In** haymaker — a guaranteed roll with better jackpot odds, but double "luck debt".
  - Q **Coin Flip** — flick a coin that ricochets to the "luckiest" point in range: a loose hanging object (chandelier, sign, lamp, beam), a structural weak point, or an enemy's weak spot; jackpot = it fails/falls `[Projectile] [Environmental] [NEW: WeakPoint]`.
  - E **Double Punch** — both fists into the body, two rolls.
  - R **Weapon Breaker** — punch-parry an incoming weapon; jackpot snaps it.
  - F **Timber!** — punch a tree, pillar or lamppost; jackpot = it snaps and falls toward the nearest enemy.
  - Z **Won't Stay Down** — once per fight at 0 HP: back at 1 HP, grabbing the attacker's leg `[Bind]`.
  - X **Underdog** [X] — deliberately eat the next hit; bad luck → big boost to jackpot odds.
  - G **Bandage** — wrapped: plain punches while the odds recover; unwrapped: reels active.
  - C flare: a burst of gold coins and 7s, yankee yell.
  - V **JACKPOT!!** — the next right-hand hit within 5 s is a guaranteed 777 at ×5 (one punch can fold a building section); afterwards the odds crash to minimum until the next "midnight" (round start or in-game 00:00).
  - Passives: per-target diminishing returns · luck debt · bad-luck bonus (missing HP raises the odds) · midnight reset.
- **AI notes:** loud, charges straight in, punches scenery to show off; against an airborne opponent he yells and uses Coin Flips to drop things on them; visible frustration as his luck runs dry (shaking his fist, reels landing on blanks); after a KO he crawls over and grabs a leg. Story gag: his first engagement with a "pretty" female NPC staggers him for a second.
- **Callouts:** naming: "Jakkupotto Nakkuru!" · "Jakkupotto!" (on a 777).

---

## 9. Supporting NPCs & summons
- **Mr. Pork (ブタ肉さん, Butaniku-san)** [M] — a kidnapped yakuza (overweight, short dark hair, big round-rimmed glasses, small mustache, flowered shirt, light trousers, a wristwatch; an anime omake reveals he's actually a nursery-school teacher) stuffed into a **pig plush**: pig face, humanoid body, stubby teddy-bear limbs, vertical seam lines plus three thicker horizontal bands, each with a big **button**. **Beast Mode (野獣モード, Yajū Mōdo; also called Mad/Full Beast Mode)** under Giriko's timer: wider, hunched, longer muscular arms, **five eyes**, punches through walls and rips up floors with his mouth. Uses: Riruka's summon (F), target for Giriko's Task Clause, story training boss. Size ≈1.4 m plush → ≈2.4 m Beast (est.). `[Summon] [Transform]`
- **Bone-Skin** [A-ep 351] — a chicken plush that fought beside Mr. Pork in the bird cage and also went Beast Mode; no further design info — build freely as a chicken plush.
- **Digital monsters & digital Hollows** [M][A] — Yukio's programmable spawns of any size ("pursue forever").
- **Digital clones** [M] — hard-light copies of any character.

## 10. Locations & arenas
- **Xcution HQ** — building 1, block 7, Chōbara district, **Naruki City** (west of Karakura Town). A run-down apartment block hiding a lavish **3rd-floor hall** reached with the calling card + keypad code; Yukio paid to knock out the five rooms on each side and the three floors above and below → a huge secret interior inside a derelict shell (a great destructible reveal). Bar, sofas, expensive furniture; Giriko tends bar. Chad blasted a hole through its wall; Tsukishima cut its door in half.
- **Backup HQ** (plainer) — where Ichigo completed his Fullbring. **Ginjō's secret third base** — a boarded-up abandoned building.
- **Tsukishima's mansion in the woods** — grand staircase (Ginjō wrecks it), chandelier (Moe's coin), upper rooms, windows to crash through, a roof to be kicked into; the surrounding forest ("I'd have put the traps in the forest").
- **The Kurosaki home under Tsukishima's spell** — a story horror level.
- **Yukio's Game Space** — an endless green-on-black pixel void; fully editable (§5 Tab).
- **Chat rooms (Lost Agent finale):** Karakura Town replica (Ichigo & Uryū vs Ginjō) · padded room of giant plushies and toys (Rukia vs Riruka) · rainy rocky field of tall obelisk rocks (Renji vs Jackie) · Japanese park / rural grove with trees (Ikkaku vs Moe) · moonlit grounds under a **red moon** [A-ep 363] (Byakuya vs Tsukishima) · blue maze corridors with yellow doors and a control room [A-ep 363] (Hitsugaya vs Yukio) · unspecified (Kenpachi vs Giriko).
- **Riruka's container worlds** — dollhouse interior, fish-tank interior (rock, water, mud), bird cage [A-ep 351].
- **Valley-of-Screams room** (TYBW) — a box-room on rails, built by Riruka and Yukio, that slides to a staked destination — even into the Royal Realm — without anyone releasing reiatsu: a stealth-transport / rail-shooter set piece.

## 11. Engine features these kits need (beyond the brief's primitive list)

| Tag | What it must do | Used by |
|---|---|---|
| `[NEW: SoulSpring]` | Elastic voxel patch under the feet (sag + rebound, no destruction), transient air footholds with rings, water-walk surfaces | all Fullbringers (Bringer Light) |
| `[NEW: Stamina]` | Body-stamina pool for Fullbring use, separate from reiatsu; "winded" state at 0 | all Fullbringers |
| `[NEW: CasterRegistry]` | Every persistent effect is tagged with its caster and reverts/despawns on the caster's death (converted allies flip back, traps vanish, prisoners pop out, edited voxels revert) | all — essential for Tsukishima, Riruka, Giriko, Yukio |
| `[NEW: AbilitySteal]` | Remove ability components from one character's kit at runtime, install them in another's wheel, grant copies to allies, return them on death | Ginjō |
| `[NEW: HistoryEdit]` | Retroactive structure edits from templates: hidden-trigger traps (erupting/toppling walls, spikes, pitfalls), "always-there" doors/tunnels with no debris, accelerated growth, pre-fractures, revert-to-snapshot restoration; needs a pristine/previous voxel snapshot per chunk | Tsukishima; Yukio's wall repair |
| `[NEW: FactionSwap]` | Per-NPC allegiance with a gradual bond meter, friendly-fire masks, AI that defends a new "friend", a breakdown state | Tsukishima |
| `[NEW: KnowledgeReveal]` | Expose a target's move list, cooldowns, next intended action and hidden safe zones; mark moves as "known" for auto-counter AI | Tsukishima; Riruka (Human Container) |
| `[NEW: WeaponBreak]` | Weapons have integrity; a snapped weapon changes the owner's moveset (halved blade, forced release, disarm) | Tsukishima, Moe; Ginjō's own sword breaking |
| `[NEW: PocketDimension]` | Instanced sub-arenas (own voxel world + rule set) tied to a container object or caster; move entities in/out; destroy container → eject; fold/collapse event; break-out from inside above a power threshold; time dilation | Yukio (Game Space, chat rooms), Riruka (containers) |
| `[NEW: EntityStore]` | Serialize an entity off-world (Save, with an interruptible channel gauge) and restore it anywhere (Load); stored entities emit no reiatsu | Yukio; Riruka (Keep / Take Out) |
| `[NEW: ArenaRules]` | Runtime per-arena modifiers: gravity, weather, time scale, HP-lives mode, indestructible voxels, terrain-preset swap, prop spawning, backdrop | Yukio |
| `[NEW: RuleZone]` | Clause engine: timers bound to zones/targets/objects with predicates (left zone, removed, object touched/damaged, ability X used, Y defeated), immutable once set, violation → punishment event (flames of time) | Giriko (also Yukio's cages, Riruka's training traps) |
| `[NEW: Polymorph]` | Swap a character into another model/skeleton (plush) with a restricted kit and a Kidō-backfire rule | Riruka |
| `[NEW: Possession]` | Hide one character inside another: camera ride-along, invisibility, intent read, limited steering, burst-out exit through the host | Riruka |
| `[NEW: ProjectileGrowth]` | A projectile that scales from miniature to a full-size object/Construct in flight | Riruka (Love Gun) |
| `[NEW: Hologram]` | Spawn a hard-light copy of any character (model + kit + AI) with a pixel-dissolve | Yukio |
| `[NEW: ActiveCamo]` | Near-invisibility shader that breaks on attack | Yukio |
| `[NEW: Battery]` | Consumable charge resource recharged at wall sockets in world buildings | Yukio |
| `[NEW: GrimeMeter]` | Resource fed by terrain-material contact, debris impacts, dust volumes and blood; washed off by water; drives a dirt overlay on the character's voxels | Jackie |
| `[NEW: LuckRNG]` | Per-hit slot roll with per-target diminishing returns, pity from damage taken, luck debt and a clock reset; jackpot outcomes routed into the break systems | Moe |
| `[NEW: WeakPoint]` | Structural analysis that finds the weakest support of a voxel structure or the loosest hanging object and triggers its failure | Moe; Ginjō (staircase), Tsukishima (Fault) |

## 12. Open questions / unverified
- Heights of Giriko, Jackie and Moe — no official numbers found; estimates only.
- Most hex values (see the "verify" tags), especially: Ginjō's base fur-collar color, his "Bankai" fur-pants and X-branch colors, and his eye color (brown vs. blue in color art); Tsukishima's shirt color, tsuba shape/color and handle wrap; Riruka's hat and dress colors and the Love Gun; Yukio's console model and coat color; Giriko's waistcoat; Jackie's Fullbring outfit (scarf, hat, armor) and sweater; Moe's hair and uniform colors.
- The "flames of time" were threatened but never shown → their look is a proposal.
- What Giriko's nine floating clocks actually do (never shown).
- Bone-Skin's design (anime ep. 351 only).
- Ginjō's original Zanpakutō as a Substitute (never shown), and how he "siphoned" power from slain Shinigami (a wiki claim, never shown).
- Member numbers for Tsukishima, Giriko and Jackie (only 001 Ginjō, 003 Riruka and 005 Yukio are given).
- Whether Yukio's rooms vanish on his death (Hitsugaya's doubt vs. the general death clause).
- How (and whether) the TYBW anime adapts the Xcution return (Valley-of-Screams room, Tsukishima restoring Tensa Zangetsu) — this file's TYBW details come from the manga pages.
- Afterlife outfits of Ginjō, Tsukishima and Giriko (TYBW / CFYOW) are not described in our sources.
