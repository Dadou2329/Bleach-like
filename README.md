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
| V | reiatsu flare (aura, more damage, drains reiatsu) |
| Tab / middle mouse | lock-on |
| H | controls panel |

### What's in this build
- **Kurosaki Ichigo**: Shikai and Bankai forms with full voxel models, IK-driven sword animation, a procedural
  gait, spring-bone cloth, a flame aura and afterimages.
- **Karakura Town**, generated procedurally: houses, apartments, a shopping street, Karakura High, the Kurosaki
  Clinic, the river with its bridge, parks and utility poles. Every voxel is destructible. Cut buildings slide
  apart along the cut and shatter into rubble.
- **Hollows** come in waves with seeded masks. They roar, claw and pounce.
- Every third wave, a **Menos Grande** tears the sky open (Kūmon), crushes the town as it walks and fires a
  **Cero** that drills through buildings. Its mask is the weak point.

## Developer modes
- `/?mode=model[&char=ichigo|hollow|menos][&form=bankai][&aura=1]`: model and animation viewer
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
- `src/chars`: Ichigo (Shikai, Bankai, Zangetsu, Tensa Zangetsu), Hollows, Menos Grande, and their clips.
- `src/game`: fighters, combat, kits, AI, projectiles (Getsuga, Cero), camera, input.
- `src/vfx`, `src/audio`, `src/ui`: auras, trails, energy shaders, procedural sound, HUD, start screen.
- `src/maps`: Karakura Town generator and test maps.
- [`PLAN.md`](PLAN.md): the full plan (roster of about 95 characters, maps, systems, milestones).
- [`docs/`](docs/): wiki-based dossiers and lore research.
- `.claude/skills/`: voxel-art, kit-design and wiki-research skills.

*Bleach* © Tite Kubo / Shueisha and the respective anime rights holders. No official assets are used. Wiki
material is paraphrased with source links (Bleach Wiki content is CC BY-SA).
