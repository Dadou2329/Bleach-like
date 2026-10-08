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
  Ichigo's with `look: 'white'`; Ichigo's eras are separate roster entries sharing `group: 'ichigo'` — one start-screen
  card with era chips — e.g. `ichigoTybw.ts`, whose small blade sweeps through `game/offBlade.ts`, `ichigoDangai.ts`,
  `ichigoAgent.ts`, `ichigoFullbring.ts` and `ichigoLizard.ts` (the Hollowfied body: it sheds into an inner
  `IchigoKit` in Bankai with the mask on), whose forms swap stance and clip sets with the body; Hitsugaya's TYBW era
  (`hitsugayaTybw.ts`) subclasses `HitsugayaKit` (its bodies come from `captainAsset()`/`bankaiAsset()`, Ryūsenka's
  cross from `crest()`); Renji's TYBW era (`renjiTybw.ts`) subclasses `RenjiKit` (the Ōken body; F from the
  Shikai is Sōō Zabimaru, whose Hihiō moves bring the arm out with `showHihio(secs, fist)`); `f.data.quincy` marks a Quincy (Hollow reiatsu is poison to it); the Agent's Shikai and
  the Lost Agent's restored Shikai run an inner `IchigoKit` with `era: 'agent' | 'lostagent'`, and the Soul Society
  entry is `IchigoKit` with `era: 'ss'`, where G lets the Hollow out: `Kit.possessed()` hands the player's body to a
  `DuelistAI` and the player's only input is the mash that tears the mask off), AI in `game/ai/`, projectiles in
  `game/projectiles/`. Fighter statuses: `slow`, `dilate`
  (time field: actions and animation crawl too), `agedK/agedT` (more damage taken), `wetT`, `energyTaken`, `knockTaken`,
  `blindT` (Enma Kōrogi: `nearestEnemy` finds no one, the duel AI gropes, the HUD goes dark), `armLockT` (the weapon arm
  seized by Amor: LMB/RMB do nothing, the weapon stays in the hand), `scrambleT/scrambleA` (Spirit Body Fusion: every
  step it wants to take is turned by `scrambleA`), `sealT/sealK`
  (power rejected: no releases or states, strength cut); `game.drain()` is damage over time without hitstun.
  `game.rejectNear(at, r, by, fields)` undoes enemy shots (and fields) that implement `Projectile.reject`.
  `BladeSpec.onHit(o)` runs after a blade sweep damages a fighter (Ashisogi Jizō's numbing stabs); `unblockable` (on a
  BladeSpec, `TetherHit` or `DamageOpts`) skips the target's `parry` hook (Ikkaku's hand swap and "Sakero"). `disarmT`
  (weapon knocked away: the player and duel AI cannot use LMB/RMB, the blade prop hides). `mounted`/`mountVy`:
  riding a summon (the body floats, the kit steers the climb rate; jumps and air-steps are off). `rooted`: no
  walking, jumping or Shunpo (Shinji inside his flower). `invertT` (the Inverted World: `nearestEnemy` finds no one,
  the duel AI goes for the mirror image through itself, the player's canvas rolls 180° and the lock drops;
  `inhale(k, dur)` builds `scent` to it, then `invertImmuneT`). `iffT` (friend and foe reversed: `enemiesOf` returns
  its own side, so its blows and targeting turn on its allies; an AI with none drifts away from `iffFrom`). `puppetT/
  puppetBy` (the body taken over by someone's blood: its own controller lets go — the player can only mash G to cut
  it short, the duel and Hollow AIs stand down — and the puppeteer's kit moves it; `chars/reactionClips.ts` has
  `puppet_stab`, a weapon driven into its own chest). `veiled`
  (reiatsu on a higher plane: beyond `VEIL_RANGE` 8 m `nearestEnemy` skips it, a lock on it drops, the duel AI gropes).
  `heavyB/heavyW` (Wabisuke's doublings on the body and the weapon: `bodyPace` slows the feet, Shunpo and knockback,
  `canJump` is false from ×8, `weaponPace` slows actions and animation; a form change clears the weapon's; the kit
  that adds them kneels, pins and clears them). `lastHurt` (game time, damage, shrug and source of the last blow
  that reached it: an `onHit` can tell whether a cut really cut). `chars/reactionClips.ts` holds poses any humanoid rig
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
  `vfx/heilig.ts` (TYBW Uryū: the Heilig Bogen and its string, Antithesis' red link and the eyes, Leiden Scherben
  chips, the Standspitze, the Vollständig flechettes and their orbit, Sternenstaub, the Reishi Cage, Federzwinger,
  the Icosahedron Barrier and its beams, the pillar of light, the Schatten pool, `sklaverei()`),
  `vfx/explode.ts` (Bambietta: `blast()`, her explosion; `BombTag`, a fuse on a fighter or a point of the world;
  `BombOrb`, which flies or falls and sticks; `KickedOrb`; `ArmedBoulder`; `ExplosiveGlobe`, the tantrum that hits
  her own side too; `OrbRain`), the Sternritter kits share `game/kits/sternritter.ts` (Hirenkyaku's puff and streak,
  `vollFlight`),
  `vfx/thunder.ts` (Candice: `ThickBolts`, lightning as camera-facing ribbons (a core over a sheath) that read at a
  distance; `Zap`, a flickering branching bolt between two points; `Crackle`, arcs crawling over a body — her charges
  on a target, the flare, Barbarriel's coiling thread; `SkyBolt`, a mark then a bolt from the sky; `GalvanoBolt`, a
  beam boring a tunnel; `WingJavelin` (a blade swung into it breaks it); `SixWheel`; `StreamBolt`; `ElectroPillar`
  and `ElectroBlast`; `lightningBurst`),
  `vfx/glutton.ts` (Liltotto: `GluttonMaw`, two jaws of voxel flesh on her mouth (or set in the world) whose `bite()`
  erases their volume and returns the bodies in it; `BiteArrow`; `SporkTrap` and `GoldenCrunch`, bear traps (the
  Crunch catches everyone, friend or foe); `SpifeWhip`, a whip of fang links; `arterie()`, Blut Arterie's veins),
  `vfx/zombie.ts` (Giselle: `BloodSpray`, the shared pool of voxel blood drops; `BloodDrops`, flung blood that doses
  what it touches and leaves `BloodPools` (wet decals that dose whoever stands in them); `bloodBurst()`; `SkullArrow`;
  `ShadowGate`, the pool a zombie climbs out of; `BonePin`; `BoneRattle`; `infectionTint()`, a body reddening with her
  blood. Her kit keeps the infection per fighter, raises roster characters as zombies (`rosterById` + the entry's kit +
  a `DuelistAI` wrapped in a `ZombieAI` that keeps the tint and cuts the strings when she falls) and makes puppets
  with the `puppetT/puppetBy` status),
  `vfx/power.ts` (Meninas: `LiftedChunk`, a chunk of the world ripped out — `fragments.grab(keys)` pulls the voxels into
  one rigid piece at once, `held` (kinematic, never settled) until `release()` throws it — carried, thrown on an arc or
  carried over the target and dropped; `chunkKeys()` (the breakable voxels in a box); `DiamondPush`, a box carve turned
  45° about its axis that bores a diamond tunnel and `Plow`s whoever it meets; `HeartArrow`; `flexCracks`; her swollen
  arms are `muscle.upper/fore` props on the `bicep.*`/`fore.*` sockets, scaled as they grow),
  `vfx/deathdealing.ts` (Askin: `GiftBall`, a slow ball that hangs as a mine (water bursts it); `GiftBad`, the oil-slick
  pool (a thin-film shader); `GiftDeluxe`, the poison dome — `raise()` stretches it into a narrowing egg, `runWild()` when
  he dies; `GiftBereich`, a one-way barrier — bodies inside are held at its edge, outsiders walk in; `GiftRing`;
  `GiantGiftBall`; `PfeilShot`, a piercing arrow; `poisonTint`; `circleTrail`. His kit keeps a poison load per fighter
  (drained with `game.drain`, a kneel at 1) and an immunity meter per attacker, keyed on its aura style (Hasshein: on
  Hollow-or-not), enforced through `Fighter.parry`),
  `vfx/visionary.ts` (Gremmy: `dreamRipple`, the prismatic ring every creation appears with; `StoneSpike`, `SteelBar`,
  `FallingBlock`, `PillarRam` (a column emerging like a piston, carving), `StoneHand`, `FirearmRing` (hitscan rifles),
  `MissileSalvo`, `WaterCube` (holds and drowns; `crevice()` carves a slot, sinks it and fills the seal back in with
  world voxels), `Meteor`, `OuterSpace`, `BladedDome`, `MetalBarBlock`; `raiseFort()` builds a platform on pillars out
  of world voxels and lifts everyone on that ground (it keeps the platform's own voxels), `crumbleFort()` smashes the
  pillars and hands those voxels to the fragment system, so it falls even where it fused with a building. Bulk voxel
  writes at runtime (`world.fillBox`, end-exclusive, no edit hook) call `physics.invalidateBox()` to refresh colliders. His clones are roster-less fighters (`GremmyCloneKit` + a `DuelistAI`); his creations are kept and
  ended when he dies, and a `BrainCapsule` drops out of the body),
  `vfx/xaxis.ts` (Lille: `tunnel()`, a straight bore segmented along any length; `xAxis()`/`xAxisLine()` — the
  X-Axis, instant, `unblockable`, a round hole in the target and everything before it (the line version runs on through
  every body and building); `PfeilBullet` (leads a runner); `Reticle`; `WingBarrage` from the wing barrels;
  `divinePressure` (pins); `spiralTeleport`; `JudgementColumn`; `ExplosionTrail`, Sabaki no Kōmyō's wake;
  `lightBall` (burns away lures and veils); `goldenRain`; `haloShatter`; `Trompete`, the trumpet drawn out of the
  ground and its blast of spherical waves. His god forms are giants at 24 and 16 vox/m (`chars/lilleGod.ts`; the
  wings' holes are sockets `barrel.0`…`barrel.23`), his heads ride the `headProp` socket as props. `Fighter.intangible`
  lets every blow and drain pass through (`onPhase` sees what passed) except one carrying `DamageOpts.reflected` equal
  to the target — his own power turned back on him (Freund Schild, Shiten Kōshun and Sōgyo no Kotowari's returned
  shots set it; `CeroOpts`/`ShotOpts` carry it). A stance grip with `two` puts the left hand on the weapon too (a rifle)),
  `vfx/heat.ts` (Bazz-B: `BurnerBeam`, an instant thin beam boring through every wall on its line; `TwinFlame` and
  its `FlamePillar`s; `LavaField`, the floor's surface turned `molten` in a rolling disc, cooled to `scorched`;
  `ThrownFlameSword`; `FullFingers`, the spiralling cone; `FireRing`, the Burning Stomp's counter-flame; his right hand
  carries the finger counts as hand variants `fing1-5.R`, shown by the kit),
  `vfx/balance.ts` (Haschwalth: `StarBlast`, the four-point stars; `BalanceScales`, the giant scales that tip;
  `TheKey`, the Hagal rune and its pillar; `InversionMark`; `BlackTorrent`; the black mend; the shield's flash; his
  kit's Balance halves wounds through `damageTaken`, reflects them onto `lastHurt.from` in `onHurt` and stores the
  shield's half; the night's foresight is a `parry` hook); the Sternritter models share `chars/sternritter.ts`
  (pixel badges and Zeichen set into a coat, the order's long cape, a sheet of long hair on spring bones, `peakedCap()`:
  the order's cap, liftable and tipped back to sit on a mass of hair),
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
  visual, hurt capsule, speeds and gait with his rage),
  `vfx/brujeria.ts` (Zommari: Amor's `SunMark` decal bound to a limb, the purple glint and gaze streak, the
  `FoldingSword` of the release, the foam, the copies' blood; his kit's holds use `Fighter.armLockT` (the weapon arm
  seized: no LMB/RMB, the weapon kept), `rooted` and the `amor_hostage` reaction)
  `vfx/glotoneria.ts` (Aaroniero: the `CapsuleGlass` pill of glass and red liquid round his true head, Nejibana's
  `WaveWall`, `TentacleStrike` — a voxel tentacle raised and slammed or swept — Spirit Body Fusion's lash, the blade
  shatter, the pool's boil, the slough of Kaien's face; the kit's `sunlit(g, p)` is the light query: a ray toward
  `atmo.sunDir` (32 m); `Fighter.scrambleT/scrambleA` turn a hooked victim's steps; `KitAI.goal` sends the duel AI
  somewhere first — he walks for the shade); Kaien Shiba shares Nejibana with him: `chars/nejibana.ts` (the props),
  `chars/kaienClips.ts` (the fencer's and the trident's clips), `game/kits/nejibanaMoves.ts` (the cuts with their water
  arcs, Shakkahō, the release, the tide, the wave, the spiral; a kit implements `NejibanaHost`) and
  `game/kits/soulHooks.ts` (Spirit Body Fusion's hooks: drain + scrambled steps); `Kit.bareHands()` lets a disarmed
  fighter's LMB/RMB still reach its kit (fists) and
  `vfx/tybw.ts` (TYBW Ichigo: `ChainBlade` thrown and beckoned home, `CrossGetsuga` for Jūjishō, `PlanarSlash` — a cut
  through everything in one plane — the Blood Chains wall and bind, `Eclipse` (sky tint and moon), `SkyCrescent`),
  `vfx/dangai.ts` (post-Dangai Ichigo: the shockwave every Bankai v2 blow throws, black smoke, the Final Getsuga and
  Mugetsu skies, `MugetsuCurtain` — a wall of black swept across everything ahead that seals what it strikes),
  `vfx/fullbring.ts` (Lost Agent Ichigo: `ManjiBlast`, the spinning manji whose bite is its blade count, Bringer Light),
  `vfx/lizard.ts` (Hollowfied Ichigo: `WormMaw` — the worm out of the left arm's stump, a chain of ring meshes that
  bites and drags back — white-matter regeneration and the husk cracking off),
  `vfx/hitsugayaTybw.ts` (TYBW Hitsugaya: `RokuiTrap`, `WovenWall` (real ice voxels, melted when it goes),
  `VacuumBlade` (pins: `rooted`), `FrostMarker`, `FreezeBox` — Shikai Hyōketsu), `flashFreeze`,
  `vfx/sooZabimaru.ts` (TYBW Renji: `HihioArm`, the giant arm on his left shoulder — a mirror rig copying his left
  arm's rotations, with a pose of its own for the umbrella and a furless ghost — Hihi Tenshō's hands, Zaga Teppō's
  burning skull, Zagai Zekkō's whirl and disc; `TetherBlade` in `vfx/shiro.ts` takes a bead tether, `bore` and
  `pullOwner` for the red-hot Orochiō) and
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
- Roster exclusions (the user's decision): never add Huburt Alexander Kleich, Shaz Domino, Royd Lloyd, Loyd Lloyd,
  Nianzol Weizol, Guenael Lee, NaNaNa Najahkoop, James, Mask De Masculine, Jerome Guizbatt, Berenice Gabrielli,
  Driscoll Berci, Robert Accutrone, PePe Waccabrada, BG9, Quilge Opie, Äs Nödt or Cang Du.
