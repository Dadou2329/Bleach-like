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
  Kits are in `game/kits/` (`vasto.ts`: the Full Hollow's moves, shared by Ichigo and Hollow Ichigo, whose models are
  Ichigo's with `look: 'white'`), AI in `game/ai/`, projectiles in `game/projectiles/`. Fighter statuses: `slow`, `dilate`
  (time field: actions and animation crawl too), `agedK/agedT` (more damage taken), `wetT`, `energyTaken`, `knockTaken`,
  `blindT` (Enma Kōrogi: `nearestEnemy` finds no one, the duel AI gropes, the HUD goes dark), `sealT/sealK`
  (power rejected: no releases or states, strength cut); `game.drain()` is damage over time without hitstun.
  `game.rejectNear(at, r, by, fields)` undoes enemy shots (and fields) that implement `Projectile.reject`.
  `BladeSpec.onHit(o)` runs after a blade sweep damages a fighter (Ashisogi Jizō's numbing stabs). `disarmT`
  (weapon knocked away: the player and duel AI cannot use LMB/RMB, the blade prop hides). `mounted`/`mountVy`:
  riding a summon (the body floats, the kit steers the climb rate; jumps and air-steps are off). `rooted`: no
  walking, jumping or Shunpo (Shinji inside his flower). `invertT` (the Inverted World: `nearestEnemy` finds no one,
  the duel AI goes for the mirror image through itself, the player's canvas rolls 180° and the lock drops;
  `inhale(k, dur)` builds `scent` to it, then `invertImmuneT`). `iffT` (friend and foe reversed: `enemiesOf` returns
  its own side, so its blows and targeting turn on its allies; an AI with none drifts away from `iffFrom`).
- Restoration: `engine.editLog` records every voxel edit; `collect()` + `revert(i)` replay them backwards
  (Sōten Kisshun sweeps a sphere nearest-first) and `fragments.dissolveNear()` removes the falling pieces whose
  voxels go back. Never revert into a fighter's capsule.
- VFX: `vfx/aura.ts` (flame cards + rim shell + pillar), `vfx/trail.ts`, `vfx/afterimage.ts`,
  `vfx/energy.ts` (crescents, rings), `vfx/water.ts` (voxel droplets, floods that slow and soak, torrents,
  the water shader), `vfx/respira.ts` (miasma, rot, the time dome), `vfx/teresa.ts` (chains, thrown weapons),
  `vfx/tengen.ts` (mirror rigs: a giant built on a fighter's skeleton copies his bone rotations each frame, so his
  clips drive it; its sword sweeps through `bladeSweep` with its own hit set and `BladeSpec.thick`),
  `vfx/suzumushi.ts` (sound rings, the blade rain, the Bankai dome, wing flutter), `vfx/rikka.ts` (the six
  fairies as voxel props with a rim glow, the Santen triangle, the Sōten dome, Tsubaki, Shiten, Rokuten),
  `vfx/jizo.ts` (Mayuri's gadgets, poison clouds, Kyōdo Yon and the Bankai creature, a giant at 6 vox/m driven
  procedurally as a projectile), `vfx/minazuki.ts` (Unohana: daggers, Hyapporankan pins, Byakurai/Raikōhō, the
  manta mount, the flung weapon, the blood flood's rain, liquid slashes, the blade sphere, pool blades; floods
  take a `FloodLook` for colour and effect), `vfx/sakanade.ts` (Shinji: the pink mist cloud, Hadō #91's ten lights, the
  Cero bar, the Bankai flower — a voxel model at 12 vox/m whose petal bones open about their ring tangents — with
  its mist dome), `vfx/almighty.ts` (Yhwach: Zeichen bursts, Sankt Bogen and Qual Kreis bows of light, the Blut Vene
  Anhaben shell, sand, shadow spikes, future wounds, eye beams, the Zeichen emblem whose eye fires a CeroBeam, the
  eye swarm, Auswählen) and
  `vfx/shiro.ts` (Hollow Ichigo: `TetherBlade`, a sword off the hand on a cloth or chain — thrown, steered,
  orbited round a centre, stuck in a fighter and hauled back — and `Corrosion` of a caught blade), `vfx/engetsu.ts`
  (Isshin: Engetsu's blade and tassel flames, the blood-flame pillar, the Kaikyō Kotei field, `Plow` — a flicked
  fighter smashing through walls) and
  `vfx/sprites.ts` (glow/dust sprites, atlas: puff, glow, streak, ring).
- Maps: `maps/karakura.ts` (default), `maps/testArena.ts`, `maps/stage.ts` (viewer).

## Conventions
- Skills: use `.claude/skills/voxel-art` for any model, map or VFX work (scales, palettes, review
  checklist). Use `bleach-kit-design` for new characters and `wiki-research` for canon facts (dossiers live
  in `docs/roster/`).
- Keep whites at or below `#F3F3F0` and blacks at or above `#141418` (bloom threshold 0.92, ACES).
- Review every visual change with screenshots before committing, using several angles plus a close-up.
- Commit and push to the working branch at each milestone. Never commit `shots/` or `node_modules`.
