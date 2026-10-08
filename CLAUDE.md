# CLAUDE.md — working on REISHI

Bleach fan game: a third-person voxel brawler in Three.js with a fully destructible world. Read `PLAN.md` for
scope and milestones and `README.md` for controls and modes.

## Commands
- `npm run dev`: Vite dev server. `npm run check` runs the typecheck (tsc 7, strict, `override` required) and
  vitest (`tests/*.test.ts`, node).
- Headless visuals: `node tools/shots/shoot.mjs --url "/?..." --out shots/x.png --script "js1||js2"` takes one
  screenshot per script after `__reishi.ready()`. `tools/shots/probe.mjs --file script.js` evaluates JS and can
  screenshot. SwiftShader runs at about 1 fps, so drive the simulation deterministically with
  `__reishi.freeze()` plus `play(n)` (step and render) or `advance(n)` (step only); blade sweeps are sampled when a
  fighter renders, so a probe that checks sword hits must `play` every frame. Use `freeCam(...)` for
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
  parts may overlap at joints. Run `autoShade()` then `lint()`. Rigs carry both hand variants (`palm.*` open, `fist.*`
  gripping): a Fighter shows the fist on a side whose `grip.*` socket holds a prop and the open hand otherwise
  (`autoHands()`, at spawn and on `setForm`); kits that pose the hands themselves set them afterwards.
- Animation: `anim/animator.ts`. Locomotion is procedural; clips use eased Hermite keys. Sword clips are
  authored as swing arcs (`anim/swing.ts` → IK channels `@gripR/@dirR/@edgeR/@poleR/@ikR`). A left-hand weapon has
  its own channels (`@gripL/@dirL/@edgeL/@poleL/@ikL`, `swingKeys({ hand: 'L' })`); a gauntlet blade along the
  forearm swings with `swingKeys({ pata: true })`. A second pair of arms uses `'R2'`/`'L2'`. Arcs wider than 60° are
  split into steps along the circle (channels interpolate in straight lines), so key the swing's real angles and
  let the split follow them; probe blade paths numerically when a cut misses. Spring bones handle cloth and coats. A centaur is a stance with `quad` (Nelliel's Gamuza): 'hips' is the animal body, the hind legs
  `thigh/shin/foot`, the front legs `fthigh/fshin/ffoot`; the locomotion walks, trots and gallops them and the leg IK plants all four.
  `anim.twoHandGap` sets how far behind the right hand the left takes a two-handed grip (a lance is held wide). Euler conventions: limbs swing forward with −X, the knee bends with +shin X, the elbow with
  −forearm X, the torso bends forward with +X, and +Y turns left.
- Gameplay: `game/game.ts` provides combat services (blade sweeps cut the world and hit fighters; damage,
  hitstop, shake, ground impacts). `game/fighter.ts` holds movement and actions (subclass `FighterAction`).
  Kits are in `game/kits/` (`vasto.ts`: the Full Hollow's moves, shared by Ichigo and Hollow Ichigo, whose models are
  Ichigo's with `look: 'white'`), AI in `game/ai/`, projectiles in `game/projectiles/`. Fighter statuses: `slow`, `dilate`
  (time field: actions and animation crawl too), `agedK/agedT` (more damage taken), `wetT`, `energyTaken`, `knockTaken`,
  `blindT` (Enma Kōrogi: `nearestEnemy` finds no one, the duel AI gropes, the HUD goes dark), `sealT/sealK`
  (power rejected: no releases or states, strength cut); `game.drain()` is damage over time without hitstun.
  `game.rejectNear(at, r, by, fields)` undoes enemy shots (and fields) that implement `Projectile.reject`.
  `BladeSpec.onHit(o)` runs after a blade sweep damages a fighter (Ashisogi Jizō's numbing stabs); `unblockable` (on a
  BladeSpec, `TetherHit` or `DamageOpts`) skips the target's `parry` hook (Ikkaku's hand swap and "Sakero"). `disarmT`
  (weapon knocked away: the player and duel AI cannot use LMB/RMB, the blade prop hides). `mounted`/`mountVy`:
  riding a summon (the body floats, the kit steers the climb rate; jumps and air-steps are off). `rooted`: no
  walking, jumping or Shunpo (Shinji inside his flower). `invertT` (the Inverted World: `nearestEnemy` finds no one,
  the duel AI goes for the mirror image through itself, the player's canvas rolls 180° and the lock drops;
  `inhale(k, dur)` builds `scent` to it, then `invertImmuneT`). `iffT` (friend and foe reversed: `enemiesOf` returns
  its own side, so its blows and targeting turn on its allies; an AI with none drifts away from `iffFrom`).
  `heavyB/heavyW` (Wabisuke's doublings on the body and the weapon: `bodyPace` slows the feet, Shunpo and knockback,
  `canJump` is false from ×8, `weaponPace` slows actions and animation; a form change clears the weapon's; the kit
  that adds them kneels, pins and clears them). `lastHurt` (game time, damage and shrug of the last blow that
  reached it: an `onHit` can tell whether a cut really cut). `chars/reactionClips.ts` holds poses any humanoid rig
  can be forced into (`registerReactions(o.anim)`, then play `weighed_kneel` / `weighed_pin` / `slumber`). `lure`: where
  opponents believe the fighter stands (a decoy, Kyokkō's bent light): the duel AI fights it and the player's lock-on
  and reticle follow it (`seenCenter()`). Kits that build another roster character while a fight runs (Carbon-Copy's
  copies: `g.spawn` + the entry's kit + a `DuelistAI`) look it up with `rosterById` (`game/registry.ts`), since the
  roster imports every kit.
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
  fighter smashing through walls),
  `vfx/gamuza.ts` (Nelliel: Lanzador Verde's drilling lance, Galope's flash, the release burst, Nel's smoke and shower),
  `vfx/ryumon.ts` (Ikkaku: `RyumonRig` — the centre blade floating on its chains with the dragon crest filling slice by
  slice, held as a pinwheel, hurled as a wheel, swooping after a cut — the Bankai tornado, the reiatsu blast),
  `vfx/haineko.ts` (Rangiku: `AshGrains`, voxel grains in groups, each group a formation — cloud, stream, line,
  column, tornado, wave, dome, layers, coat, patches, burst; `move`/`close` hand grains between groups so the ash
  pours from move to move; driven by `game/projectiles/haineko.ts`'s `HainekoAsh`: density, coats, settled tags,
  the flick-cut),
  `vfx/kazeshini.ts` (Hisagi: Tsuzuri Raiden arcs, Hyapporankan's rod rain, the explosive band, Sajō Sabaku's rope,
  `ChainWrap`, `FushiOrb` — the novel Bankai's orb with its nooses and chain rain; the sickles themselves fly on
  `TetherBlade`),
  `vfx/wabisuke.ts` (Kira: weight tags and rings, `TenranWind`, the Enkōsen disc, the Tōzanshō pyramid, the
  Tsuriboshi net, Kaidō and Gaten, the Debris Rain chunks, the heavy stomp),
  `vfx/kujaku.ts` (Yumichika: `VineMesh`, a tube rebuilt along a moving path each frame in the peacock pattern;
  `PeacockVines`: lashes, the ensnare's coils with buds in the victim's colour, the bloom, the wither, the thicket),
  `vfx/tobiume.ts` (Momo: `FushibiNet`, the hidden web — threads between anchors that snare and, lit by her fire, blow
  up strand by strand outward from the spark; the Tsuriboshi star net; `KyokkoVeil`, a hidden fighter's faint
  refraction drawn with its own afterimage pool; Hakufuku's blossoms),
  `vfx/fornicaras.ts` (Szayelaporro: Rokureichū's `BugTag`, the device's `LabDome`, the `BurrowRidge` under the
  ground, Carbon-Copy's `CopyFountain`, a copy bursting, the doll's strand, Gabriel's egg; his wing-branches are
  `PeacockVines` with `BRANCH_LOOK`),
  `vfx/ira.ts` (Yammy: the `IraShell` shield, Gonzui's `soulWisps`, the Cero's `Fissure`, the Oscuras backfire, the
  rage burst; his giant forms set `Fighter.giant` (no jumps) and `ghosts.enabled = false`, and the kit scales the
  visual, hurt capsule, speeds and gait with his rage) and
  `vfx/sprites.ts` (glow/dust sprites, atlas: puff, glow, streak, ring; a streak's length is
  `size × (1 + stretch·|v|·0.05)`, so a still streak needs a large stretch).
- Maps: `maps/karakura.ts` (default), `maps/testArena.ts`, `maps/stage.ts` (viewer).

## Conventions
- Skills: use `.claude/skills/voxel-art` for any model, map or VFX work (scales, palettes, review
  checklist). Use `bleach-kit-design` for new characters and `wiki-research` for canon facts (dossiers live
  in `docs/roster/`).
- Keep whites at or below `#F3F3F0` and blacks at or above `#141418` (bloom threshold 0.92, ACES).
- Review every visual change with screenshots before committing, using several angles plus a close-up.
- Commit and push to the working branch at each milestone. Never commit `shots/` or `node_modules`.
