# REISHI 霊子 — a Bleach voxel brawler

A non-commercial **Bleach fan game**: a third-person action brawler in detailed voxel art, built with
**Three.js**. The whole world is destructible, and attacks cut, crush and tunnel through it. Balance is not a
goal: overpowered characters stay overpowered.

## Play

```bash
npm install
npm run dev        # open the printed URL (http://127.0.0.1:5173)
```

Click **PLAY**. The mouse is captured, and **Esc** pauses. A desktop browser with WebGL2 is required.
`?q=low` lowers graphics quality for weaker GPUs.

| Input | Action |
|---|---|
| WASD · mouse | move · look |
| Space | jump; in the air: **air-step** off reishi; hold: **stand on air** |
| Shift | **Shunpo** (flash step with afterimages); hold: flash-run |
| Ctrl / C | descend |
| LMB | Zangetsu combo (5 hits, lunges, ground-cracking chop, spin, leaping finisher) |
| RMB | heavy chop (air: diving slam) |
| Q | **Getsuga Tenshō**: a crescent that carves a canyon through anything in its path |
| F | **Bankai**: Tensa Zangetsu (new form, black Getsuga, speed) |
| G | **Hollow mask**: 11 s of black, bigger Getsuga, speed, power and toughness, then it cracks and shatters (G again tears it off) |
| V | reiatsu flare (aura, more damage, drains reiatsu) |
| Tab / middle mouse | lock-on |
| H | controls panel |

The table shows Ichigo. Every character uses the same slots (LMB string, RMB heavy, Q/E/R skills, F release,
G state, V flare); press **H** in game for the current character's moves.

### What's in this build
- **Kurosaki Ichigo**: Shikai and Bankai forms with full voxel models, IK-driven sword animation, a procedural
  gait, spring-bone cloth, a flame aura and afterimages. His **Hollow mask** forms under a claw across the
  face, cracks as its time runs out and breaks into voxel shards.
- **Grimmjow Jaegerjaquez**: a street-brawler string, Cero, Gran Rey Cero and Sonído, then **Pantera**
  (a new body, claws that rake grooves into the world, Garra de la Pantera, Desgarrón).
- **Kuchiki Byakuya**: a clean sword chain and Kidō, then **Senbonzakura**: a thousand-petal swarm streams
  through buildings. His **Bankai** raises rows of giant blades that shatter into a petal ocean (Gōkei, Senkei,
  Hakuteiken).
- **Renji Abarai**: rough 11th-Division cuts with a katana. Hadō #31 **Shakkahō** goes off in his own hand
  when he fires it again too soon; the fully chanted one is much bigger (and burns him too at point-blank range).
  - F: **"Hoero, Zabimaru"**. The blade splits into six segments on a red thread. Each lash cuts along its
    whole length, so a sweep slices a building in two. He also has the 25 m full-reach lash (RMB), the
    blind-angle lash that curls round and strikes from behind (Q), the constriction (E), the whirlwind (R) and
    **Higa Zekkō** (G).
  - F again: **Bankai, Hihiō Zabimaru**. A thirty-metre bone snake rises out of a dust storm. Its skull
    lunges, sweeps and smashes craters (RMB). **Hikotsu Taihō** (Q) fires a red beam from its jaws. It can bite
    an enemy, lift it and drive it into the ground (E). Every vertebra can ring the target and strike at once
    (R), and part of the body can burrow and burst up under the enemy (G).
- **Zaraki Kenpachi**: no pattern. Each press draws a different wild swing, punch or kick, and every hit of a
  string lands harder than the last. Weak hits bounce off his reiatsu. His moves:
  - RMB: a lazy wrist flick that cuts a building in half.
  - Q: **Kendō: Ryōdan**, which splits the ground into a trench.
  - E: a reiatsu shock wave.
  - R: the **Leg Burst** charge through walls.
  - G: the **eyepatch** comes off: a golden pillar, the reiatsu skull, swings that cut far past the blade.
  - F: **"Nome, Nozarashi"**: the giant war-cleaver and Meteor Cleaver.
  - F again: **Bankai**: the crimson oni, a distant bisection, power that tears at his own body.
- **Ulquiorra Cifer**: hands in his pockets. His sealed moves:
  - kicks and the hand-spear;
  - a green finger **Cero** and red **Bala**;
  - Sonído;
  - **G**: draws Murciélago.
- **Ulquiorra, Murciélago**: black bat wings and flight, green rain, Luz de la Luna swung and thrown, and **Cero
  Oscuras**, which tunnels through the town.
- **Ulquiorra, Segunda Etapa**: claws, a tail whip, a head-grab rush through buildings, and **Lanza del
  Relámpago**, whose explosion swallows a block. He regenerates while his reiatsu lasts.
- **Tōshirō Hitsugaya**: a child captain with a nodachi longer than he is. When he draws it, the sheath on his
  back dissolves into frost. His ice is written into the world as real voxels, so frost, spikes and prisons
  stay on the battlefield and can be broken again.
  - Sealed: a three-cut string, a point thrust, a burst of cold reiatsu that freezes anyone close, and a short
    ice wave.
  - F: **"Sōten ni zase, Hyōrinmaru"**. Storm clouds swallow the sky, and a chain with a crescent sickle hangs
    from the pommel. He gains the homing **ice dragon** that freezes what it strikes, the chain-sickle that
    hooks and hauls, and a long ice wave.
  - F again: **Bankai, Daiguren Hyōrinmaru**. Ice wings and flight, dragon-arm cuts, the claw and the tail.
    His techniques are **Ryūsenka** (a cross of ice), **Gunchō Tsurara**, **Hyōryū Senbi**, **Sennen Hyōrō**
    (pillars that circle and slam shut into a tomb of real ice) and **Hyōten Hyakkasō** (snow through a hole
    in the clouds that blooms into ice flowers). Twelve petals behind his back fall over time and with every
    great technique. When the last one falls, the Bankai breaks.
- **Sōsuke Aizen**: small, exact cuts with Kyōka Suigetsu held low. A raised finger sometimes stops a light
  frontal blow outright. His moves:
  - RMB: the passing stroke. He is past the target before the wound opens.
  - Q: Hadō #90 **Kurohitsugi**, the black coffin.
  - E: Hadō #63 **Raikōhō**.
  - R: **Kyōka Suigetsu**. A perfect copy stays where he stood while he walks round behind you, then it
    shatters like a mirror.
  - G: the reveal. He crushes the glasses and sweeps his hair back.
  - F: the **Hōgyoku**. The white Chrysalis brings a fused blade and instant regeneration. Q becomes the
    fully incanted Kurohitsugi and E becomes Hadō #99 **Goryūtenmetsu**, five dragons of light.
- **Duels**: pick a rival on the start screen, or use `?vs=<id>`. The duel AI pilots any kit; it releases and
  toggles states as its HP drops.
- **Karakura Town**, generated procedurally: houses, apartments, a shopping street, Karakura High, the Kurosaki
  Clinic, the river with its bridge, parks and utility poles. Every voxel is destructible. Cut buildings slide
  apart along the cut and shatter into rubble.
- **Hollows** come in waves with seeded masks. They roar, claw and pounce.
- Every third wave, a **Menos Grande** tears the sky open (Kūmon), crushes the town as it walks and fires a
  **Cero** that drills through buildings. Its mask is the weak point.

## Developer modes
- `/?mode=model[&char=ichigo|hollow|menos|grimmjow|byakuya|renji|kenpachi|ulquiorra|hitsugaya|aizen][&form=bankai|shikai|pantera|murcielago|segunda|traitor|chrysalis][&drawn=1][&mask=1|cracked][&glasses=0][&aura=1]`: model and animation viewer
  (`window.__reishi.view('face')`, `.scrub('slash1', 0.17)`, `.move(9)`).
- `/?map=arena`: the small test arena. `/?hollows=0`: no waves.
- `/?mode=dev`: destruction playground (fly camera; right-click with tools 1–6).
- `npm run check`: typecheck and tests. `node tools/shots/shoot.mjs --url "/?..." --script "…"`: headless
  screenshots (SwiftShader). `window.__reishi` exposes `play(n)`, `act('getsuga')`, `menos()`, `freeCam(…)`
  and more for scripted captures.

## Project layout
- `src/voxel`, `src/render`: chunked voxel world, greedy mesher (workers), BatchedMesh renderer, voxel and
  character shaders, sky, post stack.
- `src/destruction`, `src/physics`: carve shapes, structural integrity, Rapier fragments and sliding cuts,
  debris.
- `src/models`: voxel model DSL (SDF shapes per bone, auto-shading, pixel-art faces) and mesh building.
- `src/anim`: rig, procedural locomotion, keyframed clips, sword IK, foot planting, spring bones.
- `src/chars`: Ichigo, Grimmjow, Byakuya, Renji, Kenpachi, Ulquiorra, Hitsugaya, Aizen (bodies, forms, weapons), Hollows,
  Menos Grande, and their clips.
- `src/game`: fighters, combat, kits, AI, projectiles (Getsuga, Cero), camera, input.
- `src/vfx`, `src/audio`, `src/ui`: auras, trails, energy shaders, procedural sound, HUD, start screen.
- `src/maps`: Karakura Town generator and test maps.
- [`PLAN.md`](PLAN.md): the full plan (roster of about 95 characters, maps, systems, milestones).
- [`docs/`](docs/): wiki-based dossiers and lore research.
- `.claude/skills/`: voxel-art, kit-design and wiki-research skills.

*Bleach* © Tite Kubo / Shueisha and the respective anime rights holders. No official assets are used. Wiki
material is paraphrased with source links (Bleach Wiki content is CC BY-SA).
