# CLAUDE.md — working on REISHI

Bleach fan game: a third-person voxel brawler in Three.js with a fully destructible world. Read `PLAN.md` for
scope and milestones and `README.md` for controls and modes.

## Commands
- `npm run dev`: Vite dev server. `npm run check` runs the typecheck (tsc 7, strict, `override` required) and
  vitest (`tests/*.test.ts`, node).
- Headless visuals: `node tools/shots/shoot.mjs --url "/?..." --out shots/x.png --script "js1||js2"` takes one
  screenshot per script after `__reishi.ready()`. `tools/shots/probe.mjs --file script.js` evaluates JS and can
  screenshot. SwiftShader runs at about 1 fps, so drive the simulation deterministically with
  `__reishi.freeze()` plus `play(n)` (step and render) or `advance(n)` (step only). Use `freeCam(...)` for
  framing. Add `&q=low` for speed. `shots/` is git-ignored. The tools start Vite with
  `tools/shots/vite.shots.config.ts` (HMR off), so editing sources while a capture runs does not reload its
  page; a server you started yourself with `npm run dev` on the same port still has HMR.

## Architecture (where things live)
- World: `src/voxel/world.ts` holds 32³ brick-paletted chunks at 0.125 m. Materials are in
  `src/voxel/materials.ts` (hardness, flags, patterns). Meshing runs in workers (`meshPool`) into a BatchedMesh
  (`render/worldRenderer.ts`).
- Destruction: `destruction/` has carve shapes (sphere, capsule, box, crescent, cone), the integrity search,
  Rapier fragments, slide planes and debris. Use `engine.destruction.carve(shape, {mode, power})`; mode `'rot'`
  crumbles what it beats to dust and turns the rest to `decayed` matter (`rotOnly` only decays).
- Characters: author models with the DSL in `src/models/builder.ts`, in **voxel units** at 48 vox/m. The model
  faces +Z and +X is the character's LEFT. Ramps are ordered light → dark. Each bone has its own grid, so
  parts may overlap at joints. Run `autoShade()` then `lint()`.
- Animation: `anim/animator.ts`. Locomotion is procedural; clips use eased Hermite keys. Sword clips are
  authored as swing arcs (`anim/swing.ts` → IK channels `@gripR/@dirR/@edgeR/@poleR/@ikR`). A left-hand weapon has
  its own channels (`@gripL/@dirL/@edgeL/@poleL/@ikL`, `swingKeys({ hand: 'L' })`); a gauntlet blade along the
  forearm swings with `swingKeys({ pata: true })`. A second pair of arms uses `'R2'`/`'L2'`. Arcs wider than 60° are
  split into steps along the circle (channels interpolate in straight lines), so key the swing's real angles and
  let the split follow them; probe blade paths numerically when a cut misses. Spring bones handle cloth and coats. Euler conventions: limbs swing forward with −X, the knee bends with +shin X, the elbow with
  −forearm X, the torso bends forward with +X, and +Y turns left.
- Gameplay: `game/game.ts` provides combat services (blade sweeps cut the world and hit fighters; damage,
  hitstop, shake, ground impacts). `game/fighter.ts` holds movement and actions (subclass `FighterAction`).
  Kits are in `game/kits/`, AI in `game/ai/`, projectiles in `game/projectiles/`. Fighter statuses: `slow`, `dilate`
  (time field: actions and animation crawl too), `agedK/agedT` (more damage taken), `wetT`, `energyTaken`, `knockTaken`,
  `blindT` (Enma Kōrogi: `nearestEnemy` finds no one, the duel AI gropes, the HUD goes dark);
  `game.drain()` is damage over time without hitstun.
- VFX: `vfx/aura.ts` (flame cards + rim shell + pillar), `vfx/trail.ts`, `vfx/afterimage.ts`,
  `vfx/energy.ts` (crescents, rings), `vfx/water.ts` (voxel droplets, floods that slow and soak, torrents,
  the water shader), `vfx/respira.ts` (miasma, rot, the time dome), `vfx/teresa.ts` (chains, thrown weapons),
  `vfx/tengen.ts` (mirror rigs: a giant built on a fighter's skeleton copies his bone rotations each frame, so his
  clips drive it; its sword sweeps through `bladeSweep` with its own hit set and `BladeSpec.thick`),
  `vfx/suzumushi.ts` (sound rings, the blade rain, the Bankai dome, wing flutter) and
  `vfx/sprites.ts` (glow/dust sprites, atlas: puff, glow, streak, ring).
- Maps: `maps/karakura.ts` (default), `maps/testArena.ts`, `maps/stage.ts` (viewer).

## Conventions
- Skills: use `.claude/skills/voxel-art` for any model, map or VFX work (scales, palettes, review
  checklist). Use `bleach-kit-design` for new characters and `wiki-research` for canon facts (dossiers live
  in `docs/roster/`).
- Keep whites at or below `#F3F3F0` and blacks at or above `#141418` (bloom threshold 0.92, ACES).
- Review every visual change with screenshots before committing, using several angles plus a close-up.
- Commit and push to the working branch at each milestone. Never commit `shots/` or `node_modules`.
