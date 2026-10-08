# Shūhei Hisagi - kit spec            (source: docs/roster/C1-lieutenants-1.md § Hisagi; tier A)

## 1. Identity
Fear, in his own hands. A disciplined swordsman who would rather not release; when he does, two pinwheel
sickles on one chain come at you from where you were not looking.

## 2. Loadouts
One loadout, the main look (Soul Society → Fake Karakura): short spiky black hair, three scars down over the right
eye, "69" on the left cheek, the blue stripe across the left cheek and the bridge of the nose, the black choker and
the black bands on both upper arms (explosives), the sleeveless kosode of the 9th Division, the badge tied on the
left arm. The novel Bankai is the third form, flagged [novel]. Later skins: academy (long hair), new seated officer
(sleeves, no stripe), TYBW (hair over the face); the PePe-controlled variant is an enemy for later.

## 3. Forms
| Form | Release | Power | Movement | Model | Notes |
|---|---|---|---|---|---|
| Sealed | - | ×1 | expert Shunpo (longer) | katana with an octagonal guard | three explosive bands: choker, left arm, right arm (each one used is gone from the model) |
| Shikai Kazeshini | F: "Kare, Kazeshini" (刈れ 風死) | ×1.35 | Shunpo | two kusarigama, each two curved blades pointing opposite ways on a spiked rod, one chain between them | the chain is life [novel]: G toggles it |
| Bankai Fushi no Kōjō [novel] | F: "Bankai — Fushi no Kōjō" (卍解 風死絞縄) | ×1.1 | Shunpo | a noose of chain round his own neck running up to a black orb of tangled chains floating over him | the life-link (Q): a noose round the target's neck too |

## 4. Inputs per form
| Key | Sealed | Shikai | Bankai [novel] |
|---|---|---|---|
| Shift | expert Shunpo | Shunpo | Shunpo |
| LMB | diagonal cut, elbow, rising cut (launcher), heel drop | right sickle thrown and hauled back, left sickle the same, the chain swung wide (both), the yank: the far sickle brought round from behind | the Shikai string; chains cut regrow |
| RMB | the draw-cut (a lunging iai) | **fan spin**: both sickles whirl round him at full chain length, cutting all round and swatting shots | **chain rain** from the orb (game-origin) |
| Q | Bakudō #62 **Hyapporankan**: a rod that splits into a rain of rods and pins the target (rooted, stunned) | **steered throw**: a sickle flies out, curves round and comes at them from behind, and the yank brings the other | **noose link**: the life-link (see Timelines) |
| E | **explosive band** (3 charges, shared with Shikai): a blinding blast and a pall of smoke (blindT) | **Kubikake**: the chain loops the neck, hauls them off balance and slams them down | **orb tethers**: chains from the orb bind and drag |
| R | Hadō #11 **Tsuzuri Raiden**: the blade is electrified for 6 s; its hits paralyse (stun) | **chain bind + Tsuzuri Raiden**: the chain wraps them (rooted, disarmed) and the current runs through it (paralysis) | **Hangman's Verdict** (game name): with the shared pool nearly empty, he cuts his own noose and drops the finishing blow (costs most of his HP) |
| F | "Kare, Kazeshini" | "Bankai — Fushi no Kōjō" | unlink (the nooses drop, back to Shikai) |
| G | Bakudō #63 **Sajō Sabaku**: a yellow rope binds the upper body (no attacks, 2.5 s) | **chain-life** [novel]: while on, wounds are re-linked: damage is paid from his reiatsu instead of HP (drains) | the explosive band |
| V | green flare | flare | flare |

## 5. Completeness (inventory 31 → rows 31)
| # | Dossier item | Destination |
|---|---|---|
| 1 | Sealed form | form (default) |
| 2 | Shikai "Kare" | F (sealed) |
| 3 | Bankai Fushi no Kōjō [novel] | F (Shikai) |
| 4 | PePe-controlled variant (TYBW) | enemy variant, later |
| 5 | Swordsmanship | LMB string, RMB draw-cut |
| 6 | Hakuda (anime: acrobatic takedowns) | LMB elbow and heel drop |
| 7 | Expert Shunpo | Shift (longer dash) |
| 8 | Explosive bands | E (sealed) / G (Bankai), 3 charges, model loses each band |
| 9 | Bakudō #62 Hyapporankan | Q (sealed) |
| 10 | Bakudō #63 Sajō Sabaku | G (sealed) |
| 11 | Hadō #11 Tsuzuri Raiden | R (sealed: the blade), R (Shikai: through the chain) |
| 12 | Strength/durability (slammed Ayon) | merged into Kubikake's slam |
| 13 | Fan spin | RMB (Shikai) |
| 14 | Steered throws (the other sickle from behind) | Q (Shikai), LMB 4 (the yank) |
| 15 | Weapon entangle | merged into R (Shikai): disarmT |
| 16 | Chain binding (Ayon) | R (Shikai) |
| 17 | Kubikake | E (Shikai) |
| 18 | Cutting attacks out of the air | merged into the fan spin (swats shots) |
| 19 | Bisecting cuts | LMB sickle hits carve `cut` |
| 20 | Release inside the wound | cinematic finisher: R (sealed) on a stunned target from behind = the stab, then F releases inside — game: the sealed draw-cut from behind a paralysed target releases Kazeshini inside (bonus burst), story Tōsen |
| 21 | Chain = life [novel] | G (Shikai) |
| 22 | Noose & orb [novel] | Bankai model + Q |
| 23 | Stagnant reishi [novel] | Bankai passive: rei regeneration of everyone near the orb stops |
| 24 | Shared survival [novel] | Q (Bankai): the life-link |
| 25 | Limit: a linked foe needs outside help [novel] | R (Bankai): Hangman's Verdict pays for it in HP |
| 26 | Anime spirit Kazeshini | optional (anime-only), not built |
| 27 | Fear doctrine | passive: blows he takes while acting build Fear (0-1), Shikai damage +30 % at full; the AI's reluctance to release |
| 28 | Weakness: overwhelmed by raw power | rule: heavy hits knock him further (knockTaken 1.15) |
| 29 | Weakness: entanglements can be shaken off | rule: the bound target's blows on him break the chain bind early (2 hits) |
| 30 | Weakness: mind control (PePe) | enemy variant, later |
| 31 | Main look (+ TYBW, academy, officer skins) | skin (built: main), others later |

## 6. Timelines (60 Hz)
- *Kare, Kazeshini* (F): 0-12 the sword held flat before him, the left hand on the blade; 12 the callout; 14-22 the
  sword splits into the two sickles in a burst of green, the chain uncoils; 22-40 a spin of both on the chain.
- *Sickle throw* (LMB 1/2): 0-6 wind; 6 the sickle leaves the hand (TetherBlade throwAt, 22 m/s, range 9 m,
  `cut` 360 on what it meets); it comes back on the chain.
- *Steered throw* (Q): 0-8 the throw out wide to the side; 8-30 the sickle curves round (redirect to a point behind
  the target), hits from behind (unblockable: it was not where they were looking); 30-40 the yank.
- *Kubikake* (E): 0-8 the throw; 8 the chain catches the neck (if within 9 m); 8-30 hauled toward him and up;
  30 slammed into the ground (crater 1.4 m, heavy, stun 0.8 s).
- *Fan spin* (RMB): 0-10 the sickles out to full chain; 10-70 orbit at 3.2 m, two passes per second, `cut` 420;
  shots touching the circle are rejected.
- *Hyapporankan* (Q sealed): 0-10 the rod thrown; 10 it splits: 40 rods rain round the target over 0.4 s; pinned:
  rooted + no attacks for 2.5 s (bosses 1 s).
- *Explosive band* (E sealed): 0-8 the band torn off and thrown (arc, 14 m/s); 8+ a white flash (blindT 3 s within
  4 m) and a pall of grey smoke (4 s).
- *Noose link* (Q Bankai): 0-14 a chain from the orb drops over the target's neck (within 14 m); while linked
  (until F unlinks or the pool empties) neither of them loses HP: every point of damage either takes is paid ×2 from
  the shared pool (both reiatsu bars); the pool empty, the link snaps and both are stunned 1 s.
- *Hangman's Verdict* (R Bankai): only while linked and the pool below 25 %: he cuts his own noose (costs 60 % of
  his current HP) and the blow lands unlinked: 140 damage, unblockable.

## 7. VFX / SFX / callouts
Reiatsu green `#3CC45A` (core `#D3F8DD`); chain `#8A8F96` (shade `#5B6066`); sickle steel `#C7CCD3`, edge
`#EEF1F4`; spiked rod `#1C1C20`; Tsuzuri Raiden arcs `#CFE8FF` with a violet fringe `#8A7CFF`; Hyapporankan rods
`#D6ECFF` (glow `#7FC0FF`); Sajō Sabaku rope `#F2D04A`; band blast white flash → smoke `#9A9A9E`; the orb
`#121216` (glints `#4A4E57`), nooses `#2A2D33`. Callouts: 刈れ「風死」 KARE, KAZESHINI · 縛道の六十二「百歩欄干」
HYAPPORANKAN · 縛道の六十三「鎖条鎖縛」 SAJŌ SABAKU · 破道の十一「綴雷電」 TSUZURI RAIDEN · 首挂 KUBIKAKE · 卍解「風死絞縄」
FUSHI NO KŌJŌ.

## 8. AI profile
Calm, defensive, mid range in Shikai. Fights sealed until hurt (releaseAt 0.6) or until the opponent releases;
the Bankai only when it is going badly (0.25). Band + Hyapporankan when cornered; Kubikake on airborne targets;
the chain bind on sword users; the steered throw as the opener in Shikai; the fan spin when shots come in. Never
gloats. Tells: a hand on the hilt and a breath (release), the chain wound round his forearm (Kubikake), a tug at a
band (explosive).

## 9. Story hooks
The academy field trip (the scars) · the rooftop vs Yumichika · Sōkyoku Hill (Tōsen at blade-point) · Fake
Karakura vs Findorr (band → Hyapporankan → "Kare" → the sickle from behind → "now you know fear") · vs Ayon (chain +
Tsuzuri Raiden, then the scripted loss) · with Komamura vs Tōsen (entangle, Kubikake, the release inside) · the
novel: Fushi no Kōjō vs Hikone.

## 10. Test plan
Probes: every sealed strike lands at 1.2-2.4 m; sickle throws land at 3-8 m and come back; the steered throw
hits from behind and goes round a parry; Kubikake slams an airborne target; the fan spin hits all round and
rejects a Getsuga; Hyapporankan roots and silences; the band blinds; Tsuzuri Raiden stuns on a blade hit and
through the chain; the noose link keeps both HP flat and drains the pool; Verdict lands only below 25 %; bands
count down 3 → 0 and vanish from the model. Screenshots: the model (front, ¾, back, face: scars, 69, stripe),
the sickles, each Shikai move in play, the Bankai orb and nooses.

## 11. Engine needs
Existing: `TetherBlade` (`vfx/shiro.ts`: throwAt, orbit, redirect, reel; chain style) for both sickles,
`g.rejectNear` (fan spin), statuses `rooted`, `disarmT`, `blindT`, hitstun, `unblockable`, `g.drain`. New, kept
in the kit: the shared-pool life-link (a parry hook on both fighters while linked: damage converted into rei
drain) — no engine change; the stagnant-reishi field (rei regen off near the orb) needs a per-fighter
`reiRegenK` [NEW: ReiRegen] or the kit refunds rei each frame (no engine change).

## 12. Open questions
(verify) the stripe's hue (cyan-blue in the anime), the sheath and hilt colours, the academy robe colours, the
Bankai orb's size (estimate 2-3 m).
