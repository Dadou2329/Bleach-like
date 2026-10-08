# Tōshirō Hitsugaya - kit spec            (source: docs/roster/B3-captains-3.md § Tōshirō Hitsugaya; tier S)

## 1. Identity
Cool, analytical, conserving power: the ice does the work, and every release is a bigger glacier. A child captain whose
Bankai is still growing — the petals count down to the moment he stops being a child.

## 2. Loadouts
Hitsugaya is one card with era chips (roster entries sharing `group: 'hitsugaya'`).

| Era (id) | Ladder (F) | G | Model(s) | Status |
|---|---|---|---|---|
| **Captain** (`hitsugaya`) — Soul Society → Fake Karakura | sealed → Shikai → Bankai (12 petals; at 0 the Bankai breaks) | Bankai: Hyōten Hyakkasō | child captain; Daiguren | built |
| **Thousand-Year Blood War** (`hitsugaya-tybw`) — *peak, the card's default* | sealed → Shikai → Bankai (12 petals; at 0: **Complete Bankai**, the adult) | Shikai: Ryōjin Hyōheki / the vacuum blade · Bankai: **Hollowfied Daiguren** · adult: contact-freeze aura | TYBW child (longer hair); Daiguren; Hollowfied ice mask, horns and sash; the adult Complete Bankai | built |

The zombie (Giselle's) belongs with Giselle Gewelle's kit (Sternritter wave), not here.

## 3. Forms (TYBW)
| Form | Release | Power | Movement | Model | Timers / rules |
|---|---|---|---|---|---|
| Sealed | - | ×1 | Shunpo | TYBW child: hair longer, the fringe to the eyes; sheath on the back | - |
| Shikai | "Sōten ni zase, Hyōrinmaru" | ×1.25 | Shunpo | chain and crescent off the pommel | storm clouds |
| Bankai | "Bankai — Daiguren Hyōrinmaru" | ×1.6 | flight on the wings | wings, tail, dragon gauntlet, claws, 12 petals | a petal every 6 s and one per big technique |
| Hollowfied Daiguren (G) | the Shin'eiyaku pill | ×2 | flight | white ice half-mask over the left eye, two horns, an ice sash across the chest | 20 s, once a match; techniques bigger; double damage to Quincy; Bankai theft impossible |
| **Complete Bankai** (adult) | the last petal falls | ×2.2 | Shunpo; F: thin ice wings | 175 cm adult; white spikes grown long; ice on the shoulders, forearms, knees and shoes | the body pays: 0.6 % HP/s; 40 s, then exhausted (sealed, no release for 20 s) |

## 4. Inputs (TYBW)
| Key | Sealed | Shikai | Bankai | Complete Bankai (adult) |
|---|---|---|---|---|
| LMB | nodachi string | sword and chain | dragon arm, claw, tail | long adult swordplay; every hit stacks frost — the third flash-freezes |
| RMB | thrust | dragon burst | Ryūsenka | **Freeze-Cut**: a plane slash that flash-freezes everything on it and splits it |
| Q | frost | ice dragon | Gunchō Tsurara | **Flash-freeze**: a gesture — the target freezes where it stands; shots in the cone stop dead |
| E | ice wave | chain-sickle | Hyōryū Senbi; E again: **Zekkū** (the crescent re-aimed at the target) | **Function Stop**: a frozen (or near) target's power is shut off — no releases, no states, strength cut |
| R | - | **Rokui Hyōketsujin**: six snowflake sigils round the target; inside, ice lines from each, then a pillar | Sennen Hyōrō | **Shikai Hyōketsu**: the box between his last four Shunpo landings (frost markers) freezes — earth, water, fire, wind and every power in it |
| F | Shikai | Bankai | **Hyōten Hyakkasō** | thin ice wings (flight burst) |
| G | - | **Ryōjin Hyōheki** (woven-ice wall); G again: **Shinkū no Kōri no Yaiba** fired out of it — impales and pins | **Hollowfied Daiguren** | **contact freeze**: who strikes him in melee freezes |
| Passive | - | water command (incoming water shots freeze and drop) | **Zanhyō Ningyō**: the first big blow of a fight hits an ice double; he reappears behind | body toll |

## 5. Completeness (TYBW items; inventory 24 → rows 24)
| # | Dossier item | Destination |
|---|---|---|
| 1 | TYBW look (longer hair, lankier) | TYBW body |
| 2 | TYBW bandanna (verify) | not built: canon art unclear, left out |
| 3 | Ice dragon | Shikai Q (built) |
| 4 | Chain-sickle | Shikai E (built) |
| 5 | Ice wave | sealed E (built) |
| 6 | Tensō Jūrin | Shikai release storm (built) |
| 7 | Water command | Shikai passive |
| 8 | Shinkū Tasō Hyōheki (with Rangiku) | merged into Ryōjin Hyōheki (solo version; the team version needs ally assists) |
| 9 | Shinkū no Kōri no Yaiba | Shikai G again |
| 10 | Ryōjin Hyōheki | Shikai G |
| 11 | Rokui Hyōketsujin | Shikai R |
| 12 | Freezing fog | merged into the Shikai release storm |
| 13 | Zanhyō Ningyō | Bankai passive |
| 14 | Ryūsenka / Sennen Hyōrō / Gunchō Tsurara / Hyōten Hyakkasō | Bankai RMB / R / Q / F (built) |
| 15 | Hyōryū Senbi | Bankai E (built) |
| 16 | Zekkū | Bankai E again |
| 17 | Petal timer | Bankai passive (built) → at 0: Complete Bankai |
| 18 | Hollowfied Daiguren (mask, horns, sash, Quincy poison, theft-proof) | Bankai G |
| 19 | Hyōrinmaru's crest (the cross of ice that entombed Cang Du) | Hollowfied Ryūsenka |
| 20 | Flash-freezing | adult Q |
| 21 | Function suspension | adult E |
| 22 | Contact freeze | adult G |
| 23 | Shikai Hyōketsu | adult R (frost markers from Shunpo) |
| 24 | Thin ice wings / body toll | adult F / passive |

## 6. Timelines (60 Hz)
- Rokui Hyōketsujin: 0-12 sigils bloom (one every 2 frames) on a 3.6 m hexagon round the target · 20 the ice lines fire
  (6 × 18 dmg, slow) · 34 the pillar closes (freeze 2.5 s, 70 dmg on shatter). A foe that leaves before 34 escapes.
- Ryōjin Hyōheki: a woven wall 5 × 3.5 m, 2 m ahead, 0.4 m thick (ice voxels), lasts 8 s; shots that reach it are
  rejected. G again (within 8 s): the vacuum blade — a 3 m hollow ice spear out of the wall at 45 m/s, 110 dmg,
  pins (rooted 2.5 s).
- Zekkū: E again within 1.2 s of Senbi: the flying crescent turns toward the target (one re-aim).
- Hollowfied Daiguren: 0-40 the pill, the mask forms (ice), the horns; 20 s; Ryūsenka becomes the crest (a cross 8 m tall).
- Flash-freeze: 8 the gesture · 12 IcePrison 1.6 s on the target (≤ 40 m in a 25° cone); enemy shots in the cone rejected.
- Function Stop: sealT 6 s, sealK 0.35 on the target (≤ 20 m), double if it is frozen.
- Shikai Hyōketsu: each Shunpo landing drops a marker (max 4, 12 s life); R with ≥ 3 → the box (markers' bounds, 6 m
  tall) freezes: fighters inside IcePrison 2.5 s + seal 4 s, terrain frosted, shots inside rejected. With < 3 markers:
  a 3 m box round the lock target.

## 7. VFX / callouts
Ice core `#C9EEFB`, body `#8FD4F2`, depth `#4EA8D9`, rim `#F2FBFF`; petals violet `#A89BE3`; Hollowfied darker ice
`#6C9DBE`, mask `#EAF3F9`. Callouts: "Rokui Hyōketsujin", "Ryōjin Hyōheki", "Shinkū no Kōri no Yaiba", "Hyōryū Senbi —
Zekkū!", "Shikai Hyōketsu", "Daiguren Hyōrinmaru" (adult), "Hyōrinmaru's crest".

## 8. AI
Opens sealed/Shikai at mid range; releases Bankai when the foe releases or lands a big hit; Rokui when the foe is
slow or committed; the wall when shots come; Hollowfied below 50 % in Bankai; in the adult form: flash-freeze and
Function Stop on a foe in a state; Shikai Hyōketsu after two or three Shunpo landings near the foe.

## 9. Test plan
Probe: Rokui pillar on a standing foe (freeze + damage) and a foe that walks out; wall rejects a Getsuga; vacuum blade
pins; Zekkū turns; Hollowfied state + crest; petals to 0 → adult; flash-freeze stops a shot; Function Stop seals a
released foe; Shikai Hyōketsu with four markers and with none. Screenshots: TYBW child, Hollowfied, adult (front,
back, ¾, face), the wall, the pillar, the box.
