---
name: bleach-kit-design
description: Use when turning a Bleach character dossier (docs/roster/*.md) into a playable REISHI kit, when writing or updating docs/kits/<id>.md, or when implementing or reviewing a character's forms, releases, abilities, inputs, timelines, destruction specs, VFX/SFX hooks, callouts or AI. Covers the PLAN §11.5 kit spec template, the control scheme, the engine effect-primitive and DamageShape vocabulary, cross-character systems, era loadouts plus "All Eras", the completeness rule (every documented ability lands somewhere - nothing silently dropped), feel guidelines, AI profile fields and a worked Byakuya example.
---

# Bleach kit design

**Purpose.** Every character must "play like the manga" (PLAN §1 pillar 2): every form, named technique and signature
trick, unbalanced on purpose. A kit is designed **on paper first** - `docs/kits/<id>.md` - from the dossier, then
implemented as `AbilityDef` data + scripts on shared primitives (PLAN §10.4). No kit code before the spec exists.

**Read first:** the character's dossier section in `docs/roster/` (`Forms & states`, `Abilities (complete)`, `TYBW anime
additions`, `Passives & weaknesses`, `Signature moments`, `Kit proposal`, `AI notes`, `Callouts`, plus the file's shared
baseline and its "Engine needs" table); `docs/lore/mechanics.md` (§1 Kidō catalogue and chant system, §2 race layers,
§3 power rules); `PLAN.md` §2.3 (controls), §6.1 (DamageShape), §10 (combat), §11 (roster plan), §12 (AI), §14.4
(story stages); the stage tables in `docs/lore/locations.md` for story hooks. The voxel model side is the `voxel-art`
skill.

## 1. Workflow
1. **Inventory.** Copy every item from the dossier into a flat list: abilities, forms/states, passives, weaknesses,
   anime additions, signature moments, outfits. Keep the canon flags (`[manga]`, `[anime-only]`, `[novel]`,
   `[movie-only]`, `[game-only name]`, `[X]` extrapolation). Count them.
2. **Identity line** - one sentence on how the character must *feel*.
3. **Loadouts** - era loadouts (§4) and the default (peak era); "All Eras" for multi-era characters.
4. **Forms table** per loadout.
5. **Input mapping** per form (§3) - start from the race-layer defaults, then the dossier's kit proposal.
6. **Completeness table** - one row per inventory item with a destination (§5). Row count = inventory count.
7. **Timelines** for every slotted ability (frames at 60 Hz) with hitboxes and **destruction specs** (§6, §7).
8. **VFX/SFX list and callouts** with colours from the dossier palette (`voxel-art` skill, `bleach-style-guide.md` §9).
9. **AI profile** (§8) from the dossier's AI notes.
10. **Story hooks** (canon battles the kit must recreate) and **test plan** (headless sims + screenshots).
11. **Engine needs:** map every special mechanic to an existing primitive or cross-character system (§2.3); list
    anything genuinely new as `[NEW: Name]` with a one-line spec - never hack it into one kit silently.
12. Self-review with §10 before handing over to implementation.

## 2. Engine vocabulary

### 2.1 Ability data (PLAN §10.4)
```ts
interface AbilityDef {
  id; name; kanji?; meaning?; callout?;        // "Getsuga Tenshō", "月牙天衝"
  forms: FormId[]; slot: Slot; air?: boolean;  // where it lives
  cost: { reiatsu?; hp?; meter? }; cooldown;
  hold?: { min; max; chargeFx };               // charge / chant
  timeline: TimelineEvent[];                   // anim / hitbox / spawn / move / camera / callout / sfx / script
  ai?: { range: [min, max]; weight; when? };
}
```

### 2.2 Effect primitives (each carries a destruction spec)
`MeleeArc` (swept blade/limb arc) · `Projectile` (orb, bolt, crescent, arrow; multishot; tethered) · `Beam` ·
`Blast` (radial) · `GroundWave` (travelling upheaval) · `Slice` (planar cut through everything) · `Field` (area with
rules/status) · `Summon` · `Swarm` (many small agents, e.g. petals) · `Construct` (adds owned voxels/entities: walls,
cages, ice, sword rings) · `Transform` · `Stance` · `Bind` · `Grab/Throw` · `Teleport` · `Afterimage/Clone` · `Status`
· `Heal/Reject` · `Absorb/Reflect` · `Shield` · `Environmental` (weather, terrain, world state) · `Mobility` ·
`Sensing/Stealth`. Unique mechanics are scripts that **reuse** primitives (Kyōka Suigetsu, Sakanade, Enma Kōrogi,
Katen Kyōkotsu games, The Almighty, Book of the End, The Visionary - PLAN §10.4).

**DamageShape modes** (PLAN §6.1): `smash` (crater, debris outward) · `cut` (1-3-voxel kerf, separated part keeps its
shape and slides along the plane) · `bore` (cylinder/cone tunnel, melted rim) · `explode` (radial, fragments + fire) ·
`groundwave` (lifts surface voxels into debris along a path) · `freeze` (ice coat + constructs) · `burn` (heat → charred
/ molten / ash, spreads) · `rot` (decay to dust) · `absorb` (voxels stream to a point, no debris; reishi worlds only) ·
`construct` (adds owned, optionally expiring voxels) · `paint` (scorch, blood, ink, frost residue).

**Reactions** (PLAN §10.3): flinch, stagger, launch, knockdown, wall-splat, ground-bounce, crumple, freeze-encase,
paralysis; guard, parry, blade lock (mash), beam struggle, super-armour, i-frames, juggles, cancels.

### 2.3 Cross-character systems (PLAN §11.4) - check these before inventing anything
| System | Use it for |
|---|---|
| Perception layer | illusions, decoys, mirrored positions, disguises, unsensable flags (Aizen, Shinji, Tōsen, Rose, Aaroniero, Lloyd) |
| Rule zones & arena rules | Katen Kyōkotsu games, pocket dimensions with rules, Hell rules, limiters, contracts |
| Weather & sky | evaporation, humidity/snow, lightning domes, eclipses, giant crescents, fake skies |
| Elements & material reactions | freeze-disables, melt, burn, char, ash, water ↔ ice ↔ steam, flowing sand, decay |
| Body system | per-limb HP, sever/regrow, extra arms, tails, breakable masks/horns/halos, Hollow-hole hitbox voids, outfit layers that tatter, growth, death variants |
| Weapon system | segmented whips/chains, tethered throws and recall, embedding in walls, shell breaking, disarm & pickup, weight stacking, extending blades, weapon meters |
| Projectile extensions | steerable, merging, catch/absorb/return, growing, curving, chain lightning, delayed echo hits, marks |
| Copies, summons & theft | AI copies, zombies, full-kit copies, slot theft, **medallion Bankai theft**, armies, pose-mirroring giants |
| Status library | per-limb paralysis, poison, weight, rot, fear, death mark, deafness, inversion, mind control, time slow… |
| Time & history | restore world/HP (edit log), damage-history reassignment, replay ghosts, Almighty rewrites |
| Name & meta | Ichibē's true names, Tsukishima's past insertion, persistent profile flags |
| Destruction extensions | erase-cut, absorb, eat terrain, cut & throw world chunks, debris telekinesis, springy ground |
| Shadow & light queries | Kageoni, Schatten portals, Aaroniero's sunlight weakness |
| Transformation extensions | timed states with meters/lockouts, forced transforms, revive-into-form, AI takeover, depower after ultimate |
| Team systems | duo moves, shared pools, carrying allies, assists, life links |
| Souls & civilians · Spawns & portals · Camera modes & mini-inputs · Sensing | Pluses/Konsō, Garganta/Senkaimon, blind/deprivation cameras, mash/rhythm prompts, reiatsu sensing and suppression |

## 3. Controls (PLAN §2.3) and race-layer defaults

| Input | Meaning |
|---|---|
| WASD / Space / Ctrl | move · jump, **air-step on reishi** (hold = ascend) · descend |
| Shift | race movement (Shunpo / Sonído / Hirenkyaku / Bringer Light / Shunkō dash); double-tap with lock-on = appear behind |
| LMB | light chain (directional: fwd = lunge, back = launcher, air chain, down-in-air = slam, sprint = dash attack) |
| Hold LMB | charged heavy (guard break, big knockback, carves terrain) |
| RMB | guard (hold) / parry (timed tap) → clash and counter windows |
| Q E R F Z X | 6 ability slots **per form** (hold = charged/alt; air variants) |
| G | special-state toggle (Hollow mask, eyepatch off, Blut Vene, Hierro, Shunkō, Gemelos…) |
| C (hold) | reiatsu flare: aura pillar, ground cracks, weaker enemies pinned/crushed, charges the next technique |
| T / hold T | release to the next form with cinematic (tap = quick release) / seal back down |
| V | ultimate (meter) |
| Tab (hold) | technique wheel for large libraries (Kidō by number, Cero variants, Gintō, gadgets, travel) |
| MMB / wheel · E (context) · 1-4 | lock-on / cycle · grab/throw when near · tag-swap in team modes |

| Race layer | Defaults (mechanics.md §2, dossier baselines) |
|---|---|
| Shinigami | Shift Shunpo (tiered); RMB blade guard/parry; Tab Kidō wheel (tap = Eishōhaki, hold = chant verse by verse, Nijū Eishō for experts); T Shikai → Bankai (hold T reseals); G per character (Shunkō, mask, eyepatch; Human World: Gentei Kaijo); Z can carry Konsō/purify; X Senkaimon if free |
| Arrancar | Shift Sonído (invisible to sensing); RMB guard / Hierro catch-parry; G Hierro brace; C flare (lesser Hollows cower); T Resurrección (heals on release; hold T reseals); Tab Cero (quick/charged), Bala, Pesquisa, Descorrer + extras |
| Visored | G = Hollow mask with a 180 s gauge (drain, Cero cost, chip damage, shatter → 12 s lockout); while masked **X becomes the character's Cero** |
| Quincy | Shift Hirenkyaku; RMB guard (Vene guard); G Blut Vene ⇄ Arterie (0.25 s gap); C *inhales* reishi then flashes; T Vollständig, hold T inside it = Sklaverei; Tab Shadow (teleport/gate/retreat), Medallion, arrow variants |
| Fullbringer | Shift Bringer Light (springy ground); object-soul manipulation; stamina-based |
| Hybrids | stack layers (Ichigo, Tōsen, Visored); the dossier decides which layer owns each key |

## 4. Era loadouts and "All Eras" (PLAN §11.1)
- Characters who change across the story ship **era loadouts** chosen at character select (Ichigo has nine, K0-K8;
  Rukia, Renji, Uryū, Chad, Hitsugaya, Kenpachi, Byakuya, Aizen, Grimmjow… have 2-4).
- Inside a loadout, **T climbs the form ladder** and **G toggles states**.
- Every multi-era character also gets **"All Eras"**: T cycles through *every* form and the Tab wheel exposes *every*
  technique - the "do everything they can do" mode.
- **Default selection = the character's peak era.**
- Tiers: S flagship (full era loadouts, built first in its wave), A full kit, B full kit with fewer forms, C NPC /
  enemy / summon / cameo. Waves W0-W5 map to milestones M3-M10.
- Era changes may alter visuals only (skins), numbers, or the move list; say which in the forms table.

## 5. Completeness - nothing silently dropped
Every inventory item gets exactly one primary destination (and may appear in more):

| Destination | Meaning |
|---|---|
| `slot <form>/<key>` | Q E R F Z X, LMB string, heavy, air variant, hold variant |
| `T` / `G` / `C` / `V` | release, toggle state, flare behaviour, ultimate |
| `wheel <ring>` | Tab wheel entry (Kidō, Cero variants, gadgets, travel, utilities) |
| `passive` | always-on rule (Hierro threshold, Hurtless Area, resilience, immunities) |
| `merged into <ability>` | folded into another ability as a variant (e.g. "ground-plow Getsuga" → Getsuga hold-down variant) |
| `system <name>` | handled by a cross-character system (Bankai theft, Medallion, perception layer…) |
| `cinematic` | release/ultimate cinematic beat or a scripted story moment |
| `story <stage>` | only in a Story Arcs stage (§11 of the kit) |
| `skin` | outfit/era look without mechanics |
| `optional (anime-only / movie / game-only)` | built as an optional extra, flagged; still listed |

Rules: the completeness table has **one row per inventory item** (state the counts: "inventory 38 → rows 38");
weaknesses become counterplay rules (they are part of canon feel); anime-only/game-only material is never the default
but is never omitted from the table; if an item truly cannot be built yet, the row says which `[NEW: …]` system blocks it.

## 6. Feel guidelines
- **Identity first:** every slot should express the identity line (Byakuya: "noble stillness, the petals do the work";
  Kenpachi: "no guard, every swing bigger than the last"). Cut generic filler moves.
- **Movement signature per race:** Shunpo blink + afterimage, Sonído static boom with no trail, Hirenkyaku glowing glide,
  Bringer Light green flicker + springy ground.
- **Light chain** 3-6 hits with directional variants; **heavy** guard-breaks and carves terrain; cancels: special-cancel
  and Shunpo-cancel late in recovery.
- **Hitstop** 40-200 ms scaled by damage (PLAN §4.1): light 40-60 ms · heavy/launcher 80-120 · signature special
  100-160 · ultimate/finisher 160-200 plus 0.3-0.5× slow-mo for 0.3-1 s. Multi-hit swarms: hitstop on the first and
  last hit only. Trauma shake and FOV punch scale with the same tier.
- **Callouts:** romaji + kanji ("散れ 千本桜 - Chire, Senbonzakura"), release commands, Bankai name cards, Kidō number
  + name ("Hadō no sanjūichi - Shakkahō"). Chants show as a **verse meter**, not copied incantation text (paraphrase rule).
- **Destruction per hit:** every hitbox declares `DamageShape { mode, power, size }`. Size by SDC (§7). Bleach's
  signature is the planar `cut` that makes the top of a building slide off - use `cut` for blade techniques.
- **Telegraphs and canon tells** (Byakuya lifts his hand before a wave; Yamamoto opens an eye; Gillian's Cero swells) are
  both counterplay and flavour. Canon weaknesses are mechanics (Senbonzakura's release can be interrupted; Hierro can
  be adapted to; Aaroniero fears sunlight).
- **OP is the point** (pillar 5): do not nerf canon feats; make opponents OP too and give clear tells.

## 7. Numbers (starting points, tuned for spectacle)
- **Reiatsu Level** (mechanics §3.1): log₂ scale, `RL = 21 − SpiritClass`. Lieutenants 16-17, captains/Espada/
  Sternritter 18-20, Royal Guard/Yamamoto 21-22, Hōgyoku Aizen/final Ichigo/Yhwach 23-26. Form modifiers: Shikai +1,
  Bankai +2.3…+3.3, mask +1.5, Resurrección +2.5, Segunda Etapa +3.5, Vollständig +2.5, Shunkō +1, Gentei −2.3.
- **Release multipliers** (§3.6): Shikai ×1.5-2; Bankai ×5-10 of Shikai (SDC +1 tier, reiryoku drain); mask ×1.5 with
  timer; Resurrección ×5-10 (full heal on activation); Vollständig ×4 (halo is a weak point); Letzt Stil ×10 then powers
  sealed.
- **Damage anchors** (F §B.1): a lieutenant-level light hit ≈ 100; a captain's Bankai super ≈ 5k-20k.
- **Material hardness anchors** (locations §3): unseated slash ≈ 40, lieutenant Shikai special ≈ 150, captain Shikai ≈
  400, Bankai special ≈ 1,500, ultimate ≈ 6,000+.
- **SDC** (mechanics §0.5): 0 scuffs ≤ 0.5 m · 1 ~1-2 m (Shakkahō, Bala) · 2 ~3-6 m (Cero, Raikōhō) · 3 ~8-20 m
  (Zangerin, Hadō #88) · 4 ~25-60 m (Ittō Kasō, Cero Oscuras, Gran Rey Cero) · 5 60-250 m (top Bankai, full-chant
  Kurohitsugi) · 6 map-scale (scripted). Blade reach = blade + `1 m + 0.5 m × max(0, RL − 15)`.

## 8. AI profile fields (PLAN §12.1)
| Field | Content |
|---|---|
| Personality | aggression, patience, range preference (m), guard rate, parry rate, dodge style, risk tolerance |
| Signature strings | 2-4 canon combos/sequences the AI favours |
| Ability hints | per ability `ai: { range, weight, when }` |
| Release logic | thresholds (HP %, "taking it seriously" after a big hit, opponent's form level), cinematic interruptible? |
| Tells & taunts | visual/audio tells; short paraphrased taunt hooks |
| Boss phases | phase scripts: threshold → release/arena change → new abilities |
| Team role | frontline / ranged / support; assists; healer or shield timing |
| Quirks | canon behaviour (Kenpachi never guards; Ulquiorra walks then explodes into speed; Gin pokes from range) |

## 9. Kit spec template (`docs/kits/<id>.md`)
PLAN §11.5's nine sections (identity, forms, inputs, completeness, timelines, VFX/SFX/callouts, AI, story hooks,
test plan) plus three additions that keep kits honest: loadouts, engine needs and open questions.
```markdown
# <Name> - kit spec            (source: docs/roster/<file>.md § <section>; tier <S/A/B/C>; wave <W#>)
## 1. Identity
## 2. Loadouts                 (era loadouts, default = peak era, All Eras)
## 3. Forms                    | Form | Release command | Multipliers / RL | Movement | Model overrides | Timers |
## 4. Inputs per form          Shift · LMB string (hits, ranges, cancels) · Heavy · Q E R F Z X · G · C · V · Tab · context
## 5. Completeness             | # | Dossier item (flag) | Destination | Notes |   inventory N → rows N
## 6. Timelines                per ability: frames (windup/active/recovery @60 Hz), hitboxes, DamageShape mode + power, hitstop, camera
## 7. VFX / SFX / callouts     colours from the dossier palette; romaji + kanji
## 8. AI profile
## 9. Story hooks
## 10. Test plan               headless sim scenarios + screenshots
## 11. Engine needs            existing systems used; [NEW: …] with one-line specs
## 12. Open questions          (verify) items from the dossier
```

## 10. Self-review before implementation
- [ ] Inventory count = completeness rows; every row has a destination; weaknesses are counterplay rules.
- [ ] Each form has all six slots meaningful (or justified empty), plus Shift, LMB string, heavy, G, C, V, Tab.
- [ ] Every hitbox has a DamageShape and power; SDC matches canon feats.
- [ ] Colours, callouts and kanji match the dossier; anime-only items flagged.
- [ ] AI uses the dossier's personality and tells; release thresholds defined.
- [ ] Story hooks cover the dossier's signature moments; test plan names concrete assertions.
- [ ] Special mechanics map to §2.3 systems; new needs listed as `[NEW: …]`.

---

## 11. Worked mini-example - Byakuya Kuchiki (from `docs/roster/B1-captains-1.md` §6)

**Identity:** noble stillness - the petals do the work. Barely moves, never wastes motion; distance belongs to him.

**Loadouts (proposal):** Soul Society (sealed → Shikai → Bankai with Senkei/Hakuteiken; kenseikan, scarf) · Lost Agent
(post-time-skip look: high-collared gold-trimmed haori, no kenseikan; same kit) · TYBW (Ōken clothing; TYBW Shikai with
conic constructs and the torrent ultimate; Senkei with six rows + two counter-rotating sets) - **default** (peak) · All Eras.

**Forms**
| Form | Release command | Multipliers / RL | Movement | Model overrides | Timers |
|---|---|---|---|---|---|
| Sealed | - | ×1, RL 19 | master Shunpo (long, silent); Utsusemi | katana (bronze window-frame guard, lavender cord, white sheath) | - |
| Shikai Senbonzakura | "Chire, Senbonzakura" (散れ 千本桜) | ×1.5-2, RL +1 | same; petals orbit outside an 85 cm Hurtless Area | bladeless hilt; ~1,000-blade swarm | release interruptible while the blade scatters (frames 0-24) |
| Bankai Senbonzakura Kageyoshi | "Bankai - Senbonzakura Kageyoshi" (卍解 千本桜景厳); drops the sword | ×5-10 of Shikai, RL +2.3…3.3 | walks; Shunpo | hands empty; petal ocean; scene darkens | reiryoku drain/s; hold T reseals |
| Senkei (Bankai scene) | "Senkei - Senbonzakura Kageyoshi" (殲景) | melee ×2, petal defence off | arena-locked with the target | rings of glowing swords (4 rows; TYBW 6 + 2 sets) | costs HP (his blood) on entry |
| Shūkei: Hakuteiken | from Senkei (V) | one decisive clash | - | white wings, vertical halo, white sword | V meter |

**Inputs per form** (from the dossier's kit proposal)
| Key | Sealed | Shikai | Bankai |
|---|---|---|---|
| Shift | long silent Shunpo; double-tap = behind (feeds Senka) | same | same |
| LMB | 4-5-hit precise katana string; fwd thrust, back rising cut, sprint iai dash | hilt swings send petal streams (20-30 m thin `cut`); fwd lance, back swirl launcher, air petal rain, down-air drill | gesture-directed waves (each click a hand motion) |
| Heavy | clean bifurcation (`DelayedHit` split through target and wall) | dense torrent that tunnels and strips walls | grand wave that flattens a city block |
| Q | **Senka** | petal wall | **Gōkei** |
| E | Utsusemi | pitfall (bores a deep shaft under the target) | fortress (full dome) |
| R | Byakurai | conic constructs (TYBW) | **Senkei** (costs HP, arena) |
| F | Sōkatsui | cocoon (full enclosure vs shockwaves) | **Ikka Senjinka** (inside Senkei) |
| Z | Rikujōkōrō | limb lock (petals swirl round a limb) | palm catch (take his own blades, thrust them point-blank) |
| X | Dankū | Kidō quick-cast | glowing swords hurled to impale/pin |
| G | stillness stance (auto counter-cut on melee entering his reach) | Hurtless Area override (blades inside 85 cm; self-hit risk) | hand-guided ⇄ mental control (hand-guided = 2× swarm speed, no sword-hand actions) |
| C | white flare (weak foes kneel) | same | petal flare (swarm explodes outward) |
| V | Senka execution | TYBW torrent mistaken for Bankai | **Shūkei: Hakuteiken** (from Senkei) |
| Tab | Shō, quick ally barrier, self-sever, shared captain Kidō wheel (Sajō Sabaku as a generic entry) | same | same |

**Completeness (inventory 31 → rows 31; `[A]` = anime-only)**
| # | Dossier item | Destination |
|---|---|---|
| 1 | Zanjutsu master (vital-point strikes, delayed bisection) | slot Sealed/LMB + Heavy (`DelayedHit`) |
| 2 | Senka | slot Sealed/Q; V (execution) |
| 3 | Utsusemi | slot Sealed/E (low AI weight - he dislikes Yoruichi's tricks) |
| 4 | Shunpo master | Shift (all forms) |
| 5 | Byakurai | slot Sealed/R; wheel Hadō #4 |
| 6 | Sōkatsui | slot Sealed/F; wheel Hadō #33 |
| 7 | Rikujōkōrō | slot Sealed/Z; wheel Bakudō #61 |
| 8 | Dankū | slot Sealed/X; wheel Bakudō #81 |
| 9 | Shō | wheel Hadō #1 |
| 10 | Quick barrier shielding allies from Gōkei's shockwave | wheel (utility) |
| 11 | Sajō Sabaku (not documented for him) | wheel, generic captain entry, flagged |
| 12 | Hakuda (bare-handed vs Hisagi) | merged into the universal disarmed Hakuda chain |
| 13 | Ruthless problem-solving (severs own tendons, discards hijacked sword) | wheel "self-sever" (cleanse control for HP) + `system Disarm` |
| 14 | Resilience | passive (durability tier) |
| 15 | Petal storm (range shredding, deep shaft, limb threat) | slot Shikai/LMB, Heavy, E, Z |
| 16 | Petal defence (walls, erase projectiles, full enclosure) | slot Shikai/Q, F |
| 17 | Hurtless Area (85 cm) | passive + G (Shikai) - `[NEW: ExclusionRadius]` |
| 18 | TYBW Shikai (conic constructs, cutting the Tatarforas dome) | slot Shikai/R (TYBW), V (torrent) |
| 19 | Elementary Bankai (waves, dome, flood) | slot Bankai/LMB, Heavy, E |
| 20 | Unnamed Senkei-like swords | slot Bankai/X |
| 21 | Gōkei | slot Bankai/Q |
| 22 | Senkei | slot Bankai/R - `[NEW: ArenaLock]` |
| 23 | Ikka Senjinka | slot Bankai/F |
| 24 | Shūkei: Hakuteiken | V (Bankai) |
| 25 | Hand-guided double speed | G (Bankai) - `[NEW: SwarmFormations]` |
| 26 | Shikai / Bankai releases, reseal | T / hold T (cinematics; `[NEW: AmbientOverride]` for the Bankai ripple) |
| 27 | Release can be stopped before the blade scatters | passive weakness: hits/grabs/wraps during frames 0-24 cancel the release |
| 28 | Concussive blasts disperse the petals | passive weakness: `Blast`-class hits thin the swarm |
| 29 | Bankai stolen by Äs Nödt; hijacked by PePe's Love | `system` Medallion theft / mind-control status; TYBW Ōken garb grants immunity to The Love |
| 30 | TYBW anime additions (caves the ground under Mask, swirling petals vs thorns, blocks his hijacked blade by hand) | merged into Shikai/E, Shikai/Q, parry flavour `[A]` |
| 31 | Looks: Soul Society, post-time-skip, Ōken clothing, young Byakuya, anime Senbonzakura spirit | skins per loadout; young Byakuya story-only; spirit optional `[A]` |

**Timelines (60 Hz)**
- *Senka* (Sealed Q): 0-5 vanish (afterimage left) → 6 blink behind the target (path sweep; whiff if blocked) →
  8-10 strike 1 `MeleeArc cut` power 60 → 12-14 strike 2 `cut` 60 + `Status reiryoku-sealed 3 s` → 15-40 recovery
  (Shunpo-cancel from 30). Hitstop 60 ms per strike. SDC 0.
- *Chire* (T, Sealed → Shikai): 0-24 callout, blade disperses (**interrupt window**) → 24 swarm spawns (~1,000 blades,
  `Swarm`) → 24-40 recovery.
- *Gōkei* (Bankai Q): 0-20 hand raised (tell) → 20-80 sphere forms around the target (`Construct` sphere r 4 m +
  `Bind`) → 80-110 inward `Swarm cut` ticks every 4 frames, power 40 each → 105 auto-Shunpo out → 110 collapse
  `Blast explode` power 1,500, r 6 m (SDC 3) → 110-150 recovery. Camera orbit; 0.5× slow-mo for 20 frames at
  collapse; hitstop 120 ms on the blast.
- *Bankai release* (T): 0-30 sword dropped, ground ripples like water, scene darkens → 30-90 two rows of giant blades
  rise left and right (`Construct`, cosmetic + 2 m knockback) → 90-120 they shatter into the petal ocean; release
  blast clears voxels within 6 m (`smash` 200, SDC 2); name card; skippable.
- *Ikka Senjinka* (Bankai F, requires Senkei): 0-20 left hand raised → 20-60 every sword turns to the target →
  60-150 six waves of homing `Projectile bore` (power 80 each) → final `explode` 3,000 (SDC 4).

**Destruction specs:** petal streams `cut` 1-3-voxel kerf along 20-30 m · torrent `cut` + `smash` 150, 2 m tunnel ·
pitfall `bore` straight down 10-20 m, Ø 2 m · grand wave `groundwave` + `cut`, 30 m wide (SDC 3) · Hakuteiken `cut` on a
huge plane, power 6,000 (SDC 4-5).

**VFX / SFX / callouts:** petals anime pink `#F5A9C4` → `#E77FA6` (manga white `#F7F7FA` alt palette), glints emissive
×2; Senkei swords `#FFD7E8` / rim `#F59AC0` (×2-3); Hakuteiken `#FFFFFF` with fringe `#EAF6FF` (×6); white reiatsu with
a pink-white tint; Byakurai `#E8F4FF`/`#9CC9FF`, Sōkatsui `#3FA9FF`/`#CFEFFF`, Rikujōkōrō `#FFE066`, Dankū `#D9F0FF` at
35 %. SFX: granular metallic shimmer + wind for the swarm; low resonant ripple, grinding blade rows and a crystalline
shatter for the Bankai; two sharp "shing"s for Senka; a rising hiss and a deep implosion for Gōkei. Callouts: "Chire -
Senbonzakura" (散れ 千本桜), "Bankai - Senbonzakura Kageyoshi" (卍解 千本桜景厳), "Gōkei" (吭景), "Senkei" (殲景),
"Ikka Senjinka" (一咬 千刃花), "Shūkei: Hakuteiken" (終景・白帝剣), "Senka" (閃花), Kidō by number.

**AI profile:** aggression 0.25 · patience 0.9 · range 8-25 m (Shikai), 15-40 m (Bankai) · guard 0.6 · parry 0.5 ·
Utsusemi weight low. Signature strings: Senka on over-commit; "Chire" walls + streams from distance; Gōkei on
stationary or cornered targets. Releases: Shikai at ~70 % HP or when the player closes in; Bankai at ~45 % or when the
player releases Bankai; Senkei at ~20 % or vs a Bankai opponent; finale = Hakuteiken clash as a beam struggle. Tells:
lifts his hand before a wave, lets the blade fall before Bankai, blood on his hand before Senkei. Taunt hooks: formal,
uses full names, irritated by his given name without an honorific. Exploit for players: the Hurtless Area - get close.

**Story hooks:** Karakura in the rain (Senka seals Ichigo) · Shishinrō bridge (Yoruichi wraps his release) · vs Renji
under the archway (Senka and release blocked, Bankai) · Sōkyoku Hill vs Ichigo (Shikai vs Getsuga → Bankai → Senkei →
Hakuteiken vs Getsuga) · takes Gin's Shinsō for Rukia · Las Noches vs Zommari (Utsusemi, self-sever, Gōkei) · TYBW: Bankai
stolen by Äs Nödt, return in Ōken clothing, Wahrwelt Senkei around giant Gerard → Ikka Senjinka.

**Test plan:** headless - Senka applies `reiryoku-sealed` and locks the target's abilities for 3 s; no self-damage
inside 0.85 m unless G is on; Gōkei vs a stationary dummy deals ≥ N hits and the auto-Shunpo leaves Byakuya outside the
blast; hitting him during release frames 0-24 cancels Shikai; a Getsuga-class `Blast` lowers swarm density; Medallion
theft locks T → Bankai. Screenshots - Bankai release strip (ripple, blade rows, shatter), Senkei arena, Hakuteiken
wings, petal palettes (manga vs anime), a building before/after Gōkei.
