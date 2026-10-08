# Uryū Ishida - kit spec            (source: docs/roster/A2-karakura-allies.md § 4 Uryū Ishida; tier S)

## 1. Identity
Cold precision: he stays out of reach and the arrows do the talking. In the Blood War he wears the enemy's white
and carries their power — a Schrift that reverses what has already happened between two points.

## 2. Loadouts
Uryū is one card with era chips (roster entries sharing `group: 'uryu'`).

| Era (id) | Ladder (F) | Model(s) | Status |
|---|---|---|---|
| **Hueco Mundo** (`uryu`) — Ginrei Kojaku (U2) | Letzt Stil (then sealed) | Hueco Mundo whites; Letzt Stil wing | built |
| **Thousand-Year Blood War** (`uryu-tybw`) — Sternritter "A" (U3) — *peak, the card's default* | Quincy: Vollständig [anime] | Sternritter uniform; Vollständig wings and crystal cuffs | built |

## 3. Forms (TYBW)
| Form | Release | Power | Movement | Model | Timers / rules |
|---|---|---|---|---|---|
| Sternritter "A" | - | ×1.2 | Hirenkyaku; Shift at a lock = **Shadow** (steps out behind the target) | 177 cm, longer hair (bangs right, tucked behind the left ear); white double-breasted trench coat under a long white cape, three Zeichen buttons each side, white belt with a gold buckle, the winged-star pin on the right breast; Heilig Bogen (≈ his height, straight limbs) | Blut Vene ⇄ off (G) |
| Quincy: Vollständig [anime] | "Quincy: Vollständig" — a pillar of light | ×2 | wing flight | two sharp crystalline wings, crystal cuffs on wrists and shins, the flechette insignia on the left breast, flechettes drifting round him (no halo) | Sklaverei heals; leaves after 45 s (then Sternritter, F on cooldown) |

## 4. Inputs (TYBW)
| Key | Sternritter "A" | Vollständig |
|---|---|---|
| LMB | Heilig Pfeil from the Heilig Bogen (three quick shots); close up (< 2.5 m) a kick and a palm that fire arrows point-blank | flechette arrows; the 4th: the **composite Heilig Pfeil** (bores clean through buildings) |
| RMB | the power shot (a charged arrow that holes bodies and walls) | **Sternenstaub** — flechettes merge into a giant arrow with a Zeichen-star tip; gathered behind the target when it is far |
| Q | **instant Licht Regen** (no charge: a barrage at once) | **Reishi Cage** — a pentagon-panelled orb round the target that detonates in a Quincy Zeichen |
| E | **Antithesis** — the wounds of the last 6 s swapped between him and the target (he heals what he lost, it takes it), and his statuses handed to it | **Antithesis (enhanced)** — also the positions |
| R | **Standspitze** once a match (the Still-Silver arrowhead: the target's power is sealed 10 s); then **Leiden Scherben** — chips planted (≤ 5) that fire arrows at enemies passing, R with chips down detonates them all | **Federzwinger** — five flechette rods round the target: a pentagonal cage that drains its reiatsu and seals its releases |
| F | Vollständig | **Sklaverei** — reishi torn out of the world round him (the voxels dissolve into streams): heals and refills |
| G | **Blut Vene** (on: damage taken ×0.45, reiatsu drains; off: normal) | **Icosahedron Barrier** (shots and blows stopped); G again: the panels unfold and fire dozens of beams |
| Passive | Auswählen immune · Hollow-reiatsu resistant | flight; flechettes orbit him |

## 5. Completeness (TYBW items; inventory 24 → rows 24)
| # | Dossier item | Destination |
|---|---|---|
| 1 | Sternritter uniform (trench coat, cape, buckle, pin) | TYBW body |
| 2 | Heilig Bogen (his height, hardened for melee) | Sternritter LMB / bow prop |
| 3 | Instant Licht Regen | Sternritter Q |
| 4 | Limb-fired arrows | Sternritter LMB close |
| 5 | Blut Vene | Sternritter G |
| 6 | Shadow (Schatten) | Sternritter Shift at a lock |
| 7 | Sun Key | merged into Shadow (gates are a story device) |
| 8 | Leiden Scherben | Sternritter R (after Standspitze) |
| 9 | Antithesis (wounds, situations) | Sternritter E |
| 10 | Precision non-lethal shot | merged into the power shot (AI: "pulls" a killing blow once) |
| 11 | Standspitze | Sternritter R (once a match) |
| 12 | Neigen (four-pronged bow) | skin of the Heilig Bogen (verify; not built) |
| 13 | Vollständig wings, cuffs, insignia | Vollständig body |
| 14 | Flight | Vollständig movement |
| 15 | Sklaverei | Vollständig F |
| 16 | Enhanced arrows | Vollständig LMB |
| 17 | Reishi traps | merged into Leiden Scherben (chips fire arrows) |
| 18 | Reishi flechettes (swarm, tip beams, bind) | Vollständig passive orbit + Federzwinger / Reishi Cage |
| 19 | Composite Heilig Pfeil | Vollständig LMB 4th |
| 20 | Reishi Cage | Vollständig Q |
| 21 | Flechette Barrier (miles wide) | merged into the Icosahedron Barrier (G) |
| 22 | Icosahedron Barrier + beams | Vollständig G |
| 23 | Sternenstaub (remote behind the enemy) | Vollständig RMB |
| 24 | Federzwinger / Federzwinger-Heilig Pfeil / enhanced Antithesis | Vollständig R / merged into Sternenstaub / Vollständig E |

## 6. Timelines (60 Hz)
- Antithesis: 0-14 the two points light (him, the target), eyes flash red · 14 the swap: he heals the damage he took
  in the last 6 s (≤ 260), the target takes the same (unblockable); his slow/seal/root/burn pass to it.
- Standspitze: 0-24 draw · 24 loosed (60 m/s): on a hit 30 dmg, `sealT` 10 s, `sealK` 0.5, its forms' gains cut.
- Leiden Scherben: a chip lands where he aims (≤ 30 m); an enemy within 2.5 m of a chip trips it: 6 arrows (14 dmg);
  R with chips down: every chip dissolves the reishi round it (r 2.5, no rubble) and blasts 40.
- Vollständig: 0-60 the pillar of light, the wings; 45 s; F inside: Sklaverei (2 s channel: heals 18 %/s while
  world voxels within 6 m dissolve toward him).
- Federzwinger: five rods rain round the target (r 2.2) at 18 · cage 5 s: `sealT` 5 s, reiatsu −8/s, rooted.
- Sternenstaub: 0-40 the star-tipped arrow forms (at his palm, or 12 m behind the target when it is > 20 m away) ·
  loosed 70 m/s, 180 dmg, bore r 1.6 through everything, blast r 4 at the end.
- Reishi Cage: 0-20 pentagon panels close round the target (r 2) · 50 the Zeichen blast (120 dmg, explode r 3.5).
- Icosahedron Barrier: G on: the shell (r 1.8) stops shots and blows (60 % of the damage) for 6 s; G again: the
  panels open and 24 beams converge on the target over 1 s (8 dmg each).

## 7. VFX / callouts
Heilig Pfeil cyan `#14C1F3` / `#47E2F8`, core `#85F4FA`, deep `#0554B8`; Vollständig crystal `#8FE9F8` / `#5CD6F5`,
edges `#1E8FD0`; Antithesis red flash `#FF2A3A`; Standspitze silver `#D8DDE6`; Blut Vene vein blue `#6FA8FF`; coat
white `#F1F2EF`; buckle gold `#D4B25A`. Callouts: "Licht Regen", "Antithesis", "Standspitze", "Leiden Scherben",
"Quincy: Vollständig", "Sklaverei", "Federzwinger", "Sternenstaub", "Blut Vene".

## 8. AI
A kiting sniper at 18-35 m; volleys, Licht Regen when the foe commits, Blut Vene when hit hard; Antithesis after
losing a lot in a few seconds; the Standspitze when the foe releases; Vollständig below 60 %; Federzwinger on a
released foe, Sternenstaub at range, Sklaverei when hurt.

## 9. Test plan
Probe: arrow string and the close-range kick; power shot through a wall; Licht Regen; Antithesis heals him and hurts
the target by the same; Standspitze seals; chips fire and detonate; Blut Vene halves damage; Vollständig flight;
Federzwinger seals; Sternenstaub behind a far target; Reishi Cage blast; barrier stops a Getsuga, beams; Sklaverei
heals. Screenshots: Sternritter body (front, back, ¾, face), Vollständig (front, back, wings), Antithesis, Sternenstaub.

## 10. Engine needs
Wound ledger (HP lost per fighter over the last seconds) → a small ring buffer in the kit (damage events via the
`hp` delta each step); everything else maps to existing projectiles, `rejectNear`, `sealT`, `rooted`, `mounted`.
