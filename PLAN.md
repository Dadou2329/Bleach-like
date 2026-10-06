# BLEACH-LIKE — Master Plan

> **Codename: REISHI.** A Bleach fan game: a third-person action brawler in **highly detailed voxel art**,
> running in the browser on **Three.js**, where **everything is destructible** and every character can do
> **everything they can do in the manga/anime**. Balance is explicitly a non-goal: if a character is
> overpowered in canon, they are overpowered here.
>
> This document is my working plan. It is written for me (and future sessions of me) to execute without
> further approval. Research that feeds it lives in `docs/` (character dossiers, mechanics, locations,
> look-dev experiments). Decisions are recorded in §19 so they don't get re-litigated.

---

## Table of contents

0. [TL;DR](#0-tldr)
1. [Vision & pillars](#1-vision--pillars)
2. [Game overview: modes, camera, controls](#2-game-overview)
3. [Tech stack & repository layout](#3-tech-stack--repository-layout)
4. [Engine architecture](#4-engine-architecture)
5. [Voxel world engine](#5-voxel-world-engine)
6. [Destruction engine](#6-destruction-engine)
7. [Physics](#7-physics)
8. [Rendering, VFX & camera](#8-rendering-vfx--camera)
9. [Characters: models, rigs & animation](#9-characters-models-rigs--animation)
10. [Combat & ability system](#10-combat--ability-system)
11. [Roster plan](#11-roster-plan)
12. [Enemies & AI](#12-enemies--ai)
13. [Maps](#13-maps)
14. [Modes, UI & game flow](#14-modes-ui--game-flow)
15. [Audio](#15-audio)
16. [Skills & tooling (incl. the voxel-art skill)](#16-skills--tooling)
17. [Milestones](#17-milestones)
18. [Performance budgets, testing & QA](#18-performance-budgets-testing--qa)
19. [Decision log, risks & IP notes](#19-decision-log-risks--ip-notes)

---

## 0. TL;DR

- **What:** a browser game (Three.js r186 + TypeScript + Vite) with a 0.125 m voxel world that can be cratered,
  tunnelled, sliced and collapsed; ~90 playable characters across every arc (Substitute Shinigami → Hell arc),
  each with all their forms (Shikai, Bankai, Hollow mask, Resurrección, Vollständig, Fullbring…) and techniques.
- **Feel:** fast Shunpo-style movement, air combat on reishi footholds, hitstop + screen shake + huge callouts,
  Bankai release cinematics, attacks that cut buildings in half and leave the top sliding off.
- **How:**
  1. Foundations & skills (`voxel-art`, `bleach-kit-design`, `wiki-research`, `visual-qa`) + tooling
     (model DSL, model viewer, Playwright screenshot loop).
  2. Voxel world: chunked storage, greedy + AO meshing in workers, `BatchedMesh` rendering, palette shader.
  3. Destruction: carve/slice operators, structural integrity → falling fragments (Rapier voxel colliders),
     impact fracture, debris, rubble settling, restoration (Orihime can literally rebuild the city).
  4. Characters & combat: rigid-part voxel rigs, animation layers, kinematic controller, ability timelines.
  5. Vertical slice: Ichigo (Shikai, Bankai, Hollow mask) vs Hollows and a Menos Grande in Karakura Town.
  6. Roster waves by arc (Soul Society → Arrancar/Hueco Mundo → Visored/lieutenants/Fullbringers → TYBW → Hell).
  7. Modes & polish: Story Arcs, Versus/Team, Hollow Horde, Boss Rush, Training Ground, Photo mode.
- **Research already done:** wiki dossiers for ~120 characters (`docs/roster/`), Kidō & racial mechanics
  (`docs/lore/mechanics.md`), locations (`docs/lore/locations.md`), rendering look-dev (`docs/research/lookdev/`).

---

## 1. Vision & pillars

1. **"Everything is reishi."** In Bleach, everything in Soul Society — ground, walls, bodies — is made of
   spirit particles. In this game voxels *are* reishi. That gives the destruction a lore reason and enables
   canon mechanics: Quincy pull voxels out of buildings to form arrows (Sklaverei), Hollows dissolve into
   particles, Orihime "rejects" destruction and the voxels fly back into place.
2. **Every character plays like the manga.** Not a 4-move moveset per character: every form, every named
   technique, every signature trick. A character like Ichigo has 40+ abilities across ~10 forms.
3. **Power you can see.** A Getsuga Tenshō leaves a crescent-shaped canyon. A Cero bores a tunnel through a
   building. Kenpachi's Kendō splits the ground for a hundred metres. Hitstop, shake, slow-mo, callouts, reiatsu
   pillars and dust clouds sell every hit.
4. **Highly detailed voxel art.** Fine voxels (world 8/m, props 16–24/m, characters 48/m), per-voxel colour
   variation, AO, bloom, careful palettes and silhouettes. Every model goes through a screenshot review loop.
5. **No balance, maximum fun.** OP is the point. Systems are designed for spectacle and expression, not
   fairness. Difficulty comes from opponents being OP too.

Non-goals (for now): online multiplayer, monetisation, story cutscene fidelity, voice acting, licensed music.

---

## 2. Game overview

### 2.1 Genre & camera
Third-person 3D action brawler (character-action combat + sandbox destruction). Over-the-shoulder orbit camera
with lock-on, cinematic cameras for releases and ultimates. Ground and **air combat** are equally important:
Shinigami stand on reishi in mid-air, Arrancar and Quincy too — fights happen above rooftops as much as in streets.

### 2.2 Modes (details in §14)
| Mode | Description |
|---|---|
| **Free Battle / Sandbox** | Pick any character, any map, spawn anything (Hollows, Menos, captains, Espada, Sternritter), toggles (infinite reiatsu, time scale, god mode, AI on/off). The core toy. |
| **Versus** | 1v1, team (up to 4v4), tag-team (swap 1–4). vs AI; local 2-player split-screen is a stretch goal. |
| **Story Arcs** | Curated canon battles as stages with the right map, opponents, weather and twists (Ichigo vs Byakuya on Sōkyoku Hill, Ichigo vs Ulquiorra on the Las Noches dome, Yamamoto vs Yhwach…). |
| **Hollow Horde** | Survival in Karakura: Hollow bait (Uryū's contest), waves escalate to Gillian/Adjuchas/Arrancar and a Garganta full of Menos. |
| **Boss Rush** | Espada ladder, Sternritter ladder, Captains ladder, "Final bosses" (Aizen stages, Yhwach stages). |
| **Training Ground** | Urahara's underground study hall: dummy targets, frame data, rebuild-the-world button. |
| **Photo mode** | Freeze time, free camera, DOF, filters, hide HUD. |

### 2.3 Control scheme (keyboard & mouse; gamepad mirrors it)
| Input | Action |
|---|---|
| WASD | move (camera-relative) |
| Space | jump; in air: **air-step** (stand on reishi); hold = ascend |
| Ctrl | descend / crouch |
| Shift | race movement: **Shunpo / Sonído / Hirenkyaku / Bringer Light / Shunkō dash**; double-tap with lock-on = appear behind target |
| LMB | light chain (directional: fwd = lunge, back = launcher, air chain, down-in-air = slam, sprint = dash attack) |
| Hold LMB | charged heavy (guard break, big knockback, carves terrain) |
| RMB | guard (hold) / parry (timed tap) → clash & counter windows |
| **Q E R F Z X** | 6 ability slots **per form** (hold = charged/alt variant; air variants) |
| G | special-state toggle (Hollow mask, eyepatch off, Blut Vene, Hierro, Shunkō, Gemelos…) |
| C (hold) | **reiatsu flare**: aura pillar, ground cracks, weaker enemies are pinned/crushed, charges next technique |
| T / hold T | release to next form with cinematic (tap = quick release) / seal back down |
| V | ultimate (meter) — Mugetsu, Kendō, Zanka no Tachi, Kurohitsugi (full incantation), The Almighty… |
| Tab (hold) | technique wheel for large libraries: Kidō (by number), Cero variants, Gintō, gadgets |
| MMB / wheel | lock-on toggle / cycle target |
| 1–4 | tag-swap teammate (team modes) |
| E (context) | grab/throw (enemies, fragments, props) when near; reuses E if no ability is bound to context |
| F1 / Esc | move list / pause |

Gamepad: LS move, RS camera, A jump/air-step, B dash, X light, Y heavy, RB guard, LB+face = slots 1–4,
LT+face = slots 5–6 + toggle + flare, D-pad up/down = release/seal, D-pad left = wheel, LB+RB = ultimate,
R3 = lock-on. All bindings are rebindable.

---

## 3. Tech stack & repository layout

### 3.1 Stack (verified versions, Oct 2026)
| Concern | Choice | Notes |
|---|---|---|
| Rendering | **three 0.186.x** (`WebGLRenderer`, WebGL2) | Mature, works headless via SwiftShader for screenshots. Keep a renderer seam so `WebGPURenderer` can be trialled later. `PCFSoftShadowMap` is removed in r186 → use `PCFShadowMap`/VSM. |
| Post-processing | **postprocessing 6.39.x** + **n8ao 2.0.x** | Verified working with three 0.186 headless (N8AO, mipmap bloom, tone mapping, SMAA, vignette). |
| Physics | **@dimforge/rapier3d-compat 0.21.x** | Has a native **voxels collider** (`ColliderDesc.voxels`, `setVoxel`, `combineVoxelStates`, `propagateVoxelChange`) — ideal for destructible chunks and voxel fragments. KCC for characters. |
| Language/build | **TypeScript 7** (native `tsc`), **Vite 8**, ES modules, Web Workers (`?worker`) | Node 22 available. |
| UI | **Preact + TSX** for menus; direct DOM for 60 fps HUD bars | Small, fast. |
| Tests | **Vitest 5** (unit + bench), **Playwright** (screenshots/smoke) with `/opt/pw-browsers/chromium` | Headless WebGL renders ~1 fps (SwiftShader): fine for looks, not perf. |
| Noise/math | own small libs (hash, simplex, SDFs) | No heavy deps. |
| Fonts | `@fontsource/*` OFL Japanese fonts (Noto Sans JP + a brush/calligraphy face) | Bundled locally, no network. |
| Audio | Web Audio API, procedural synthesis | No copyrighted audio; user can load their own music files. |

### 3.2 Repository layout (target)
```
/
├─ PLAN.md                     ← this plan
├─ CLAUDE.md                   ← conventions/commands for future sessions (M0)
├─ .claude/skills/
│  ├─ voxel-art/               ← SKILL.md + references/ + scripts/ (§16.1)
│  ├─ bleach-kit-design/       ← dossier → kit → abilities → AI checklist (§16.2)
│  ├─ wiki-research/           ← how to fetch/update dossiers (§16.3)
│  └─ visual-qa/               ← screenshot loop & review rubric (§16.4)
├─ docs/
│  ├─ roster/*.md              ← per-faction character dossiers (done)
│  ├─ roster/STATUS.md         ← per-character progress tracker (model/kit/AI/story)
│  ├─ lore/mechanics.md        ← Kidō catalogue, racial layers, power rules (done)
│  ├─ lore/locations.md        ← map references & generator specs (done)
│  ├─ kits/<character>.md      ← finalized kit specs (written per character before coding)
│  └─ research/lookdev/        ← rendering experiments & screenshots
├─ tools/
│  ├─ wiki/wiki_fetch.py       ← MediaWiki API fetcher for bleach.fandom.com (done)
│  ├─ shots/                   ← Playwright screenshot/turntable scripts
│  └─ bench/                   ← perf benches (mesher, destruction, physics)
├─ src/
│  ├─ main.ts                  ← boot
│  ├─ core/                    ← loop, time (hitstop/slow-mo), events, rng, pools, math, input
│  ├─ sim/                     ← **pure simulation** (no DOM/WebGL): entities, combat, abilities, AI, rules
│  ├─ voxel/                   ← world, chunks, materials, edits, raycast, meshing (workers), connectivity
│  ├─ destruction/             ← damage shapes, carve/slice ops, fragments, fracture, debris, restore log
│  ├─ physics/                 ← Rapier glue, character controller, voxel colliders
│  ├─ render/                  ← renderer, post, sky, lighting/CSM, materials/shaders, BatchedMesh world
│  ├─ vfx/                     ← particles, trails, beams, slashes, auras, decals, screen fx, callouts
│  ├─ anim/                    ← skeleton, poses, clips, layers, IK, spring bones, smears
│  ├─ models/                  ← voxel model DSL, generators (body, hair, face, cloth, weapons, creatures)
│  ├─ content/
│  │  ├─ characters/<id>/      ← model.ts, forms.ts, abilities/*.ts, ai.ts, vfx.ts, palette.ts
│  │  ├─ enemies/              ← Hollow archetypes, Menos, Exequias, Kushanāda…
│  │  ├─ maps/<id>/            ← generator.ts, palette.ts, lighting.ts, setpieces.ts
│  │  ├─ props/                ← vending machines, poles, lanterns, cars, trees…
│  │  └─ story/                ← arc stage definitions
│  ├─ audio/                   ← synth engine, sfx recipes, music
│  ├─ ui/                      ← Preact menus, HUD, move list, character select, photo mode
│  └─ dev/                     ← model viewer, pose editor, map viewer, destruction playground
└─ tests/                      ← vitest unit/bench, playwright smoke & visual
```

**Architecture rule:** `sim/`, `voxel/` (data + algorithms), `destruction/` (algorithms) and content *definitions*
must run in Node without a DOM, so combat/destruction can be unit-tested and benchmarked headlessly. Rendering,
audio, input and UI consume sim state and events.

---

## 4. Engine architecture

### 4.1 Main loop
- **Fixed-step simulation at 60 Hz** (accumulator), rendering interpolated at display rate.
- **Time layers:** global time scale (slow-mo during releases/ultimates), per-entity local time scale
  (**hitstop**: attacker and victim freeze 40–200 ms scaled by damage), real time for UI.
- Seeded RNG streams (sim, vfx, generation) so scenes and bugs are reproducible.

### 4.2 Entities
Lightweight entity-component composition (plain TS classes + typed component bags; no heavy ECS lib):
`Transform`, `Body` (controller/rigid), `Health`, `Reiatsu`, `Meter`, `Fighter` (forms, abilities, state machine),
`Hurtboxes`, `Hitboxes`, `StatusEffects`, `AI`, `Projectile`, `Field`, `Summon`, `VoxelObject` (fragments/props),
`Renderable` (render-side handle). Systems iterate typed arrays/lists in a fixed order:
input → AI → fighter state machines/abilities → movement/physics → hit detection → damage/reactions →
destruction requests → status ticks → spawn/despawn → events to render/audio.

### 4.3 Threads
| Thread | Work |
|---|---|
| Main | sim, Rapier step, render, audio scheduling, UI |
| Mesher pool (2–6 workers) | chunk greedy meshing + AO; fragment/prop meshing; LOD meshing |
| Structure worker | connectivity/structural integrity searches, fragment extraction, fracture partitions |
| (Later) Debris worker | debris particle integration if the main thread is over budget |

World voxel storage uses **SharedArrayBuffer** when `crossOriginIsolated` (Vite dev/preview send COOP/COEP;
static hosting uses a `coi-serviceworker` shim). Fallback path: copy padded chunk snapshots into jobs and run
connectivity time-sliced on the main thread. Every result is validated against chunk version numbers before
being applied (stale results are discarded and re-queued).

### 4.4 Events
Typed event bus (`HitEvent`, `CarveEvent`, `FragmentSpawned`, `FormChanged`, `AbilityCast`, `Callout`,
`CameraCue`, `SfxCue`…). Sim emits; render/audio/UI subscribe. Keeps sim headless-testable.

### 4.5 Perception layer (designed in M4, required by half the roster)
The research made this non-optional: Kyōka Suigetsu, Sakanade, Shinji's and Rose's Bankai, Enma Kōrogi, Gin's
"sealed-looking" Bankai, Aaroniero/Lloyd disguises, camouflage and stealth all need **what an observer perceives**
to differ from **what is true**. So:
- The sim holds the **authoritative state**; each observer (the local player, every AI) reads the world through an
  `ObserverView` that applies active perception effects: hide/spawn decoy entities, swap identities/appearances,
  mirror positions, overlay fake terrain, suppress senses (sight/sound/reiatsu), relabel friend/foe.
- Rendering, HUD, lock-on and auto-aim use the local player's view; **AI targets through its own view** (so Aizen's
  decoys fool bots too). Damage and destruction always resolve against the truth (illusions never carve voxels
  unless an ability says otherwise).
- Perception effects carry tells (shimmer, sound mismatch, shadow mismatch) so observant players can see through
  them, plus accessibility toggles.

### 4.6 Persistence
Local profile (IndexedDB): settings, bindings, story progress, photo gallery, cached map/model builds — and canon
gags such as a permanent **"has seen Kyōka Suigetsu's release"** flag.

---

## 5. Voxel world engine

### 5.1 Scales (decided after look-dev, see `docs/research/lookdev/`)
| Thing | Resolution | Why |
|---|---|---|
| World (terrain, buildings) | **0.125 m (8 voxels/m)** | 0.25 m looked Minecraft-like; 0.125 m reads as voxel art (smooth crater bowls, brick courses) at acceptable cost. Per-map override allowed (0.25 m for very large maps / low preset). |
| Props (lamp posts, vending machines, furniture, cars) | 16–24 voxels/m | Detail at eye level, bridges the gap between world and characters. |
| Characters | **48 voxels/m** (a 174 cm character ≈ 84 voxels tall) | Faces need it: a head ≈ 13 voxels tall allows anime eyes, Ulquiorra's tear lines, Mayuri's paint, Byakuya's kenseikan. Fallback 32/m if perf demands. |
| Giants (Menos, Bankai giants, Ira Yammy, Gerard) | 4–8 voxels/m, scaled | Keep voxel counts sane. |
| Chunk | 32³ voxels (4 m cube at 0.125 m) | Good meshing granularity; ~1–3 ms per chunk mesh. |

Content generators work **in metres** (SDFs, shapes, grammars) and rasterise at the map's voxel size, so
resolution is a parameter, not a rewrite.

### 5.2 Storage
- Bounded maps (e.g. up to 256 × 96 × 256 m → 2048 × 768 × 2048 voxels → 64 × 24 × 64 chunk slots).
- `Chunk { data: Uint8Array(32768) | null, uniform: u8, solidCount, version, flags }` — uniform chunks (all air,
  all bedrock) store no array. Index `x | y<<5 | z<<10`.
- Optional sparse `damage: Map<index, u8>` per chunk for cracks (repeated hits weaken before breaking).
- Optional overlay layers allocated on demand: `temperature` (fire/ice spread), `wet`, `owner` (constructs like
  Orihime's shields or Sennen Hyōrō ice that should expire).
- Bedrock: bottom N voxels flagged indestructible (anchors for structural integrity, keeps the map from
  falling into the void).
- Budget target: ≤ 200 MB voxel data for the largest map; typical arena 40–120 MB.

### 5.3 Materials (≤ 255 per map, table-driven)
Each material: `name`, colour ramp (3–6 shades, sRGB authored → linear), `pattern` (none / brick / wood grain /
roof tile / tatami / sand ripple / quartz / plaster mottling…, evaluated in the shader from voxel coordinates),
`hardness` (energy to break), `toughness` (crack before break), `density` (fragment mass), `debris` profile
(cube size distribution, dust colour, spark/chip type), `sfx` class (concrete, wood, glass, metal, earth, sand,
ice, reishi, bone, flesh), flags (`flammable`, `meltable`, `freezable`, `transparent`, `emissive`, `liquid`,
`indestructible`, `reiatsuBlocking` for **Sekkiseki**/Shakonmaku), and transforms (`onBurn → charred`,
`onFreeze → iced variant`, `onRot → dust/air` for Baraggan's Respira, `onAbsorb → air` for Sklaverei).

### 5.4 Meshing
- **Greedy meshing with per-vertex AO** (validated in look-dev): per axis/direction slice masks keyed by
  (material, 4×2-bit AO); quads flipped along the brighter diagonal to avoid AO anisotropy.
- Runs in mesher workers on a **34³ padded copy** (or SAB view) of the chunk + neighbours' borders.
- Vertex format (compact): position `u8×3` (chunk-local), normal+AO `u8`, material `u8` (+ pad). Index `u32`.
- Separate output streams: **opaque**, **transparent** (glass, ice, water: sorted, alpha), **emissive**
  (lanterns, neon, reishi crystals — also contributes to bloom).
- **LOD:** chunks beyond ~60 m meshed at 2× downsample (majority material), beyond ~120 m at 4×; fog hides seams.
- Remesh scheduling: dirty set prioritised by (recent destruction, distance to camera, on-screen), N jobs in
  flight, results applied within a per-frame upload budget. Neighbour chunks re-meshed when border voxels change.

### 5.5 World rendering
- **`BatchedMesh`** per stream (opaque / transparent / emissive) — one multi-draw call each for thousands of
  chunks; per-instance frustum culling; geometry slots reserved with headroom and `optimize()` defragmentation;
  `setGeometrySize` growth. Chunk instance matrix = translate(chunk origin) × scale(voxel size).
- **Voxel material shader** (MeshStandardMaterial + `onBeforeCompile`, so Three lighting/shadows/fog keep working):
  - material colour from a **palette DataTexture** (256 materials × N shades/states) → recolouring (scorched,
    frozen, blood, ink) without remeshing;
  - per-voxel **shade selection** by hashing the voxel cell (`floor(worldPos/vs − n/2)`) → picks a ramp shade
    like a hand-placed voxel palette, plus low-frequency patches; **very subtle** face-edge darkening
    (strong grid lines looked like tiles — rejected in look-dev);
  - material patterns (brick courses, wood grain, roof tiles) computed procedurally per voxel;
  - crack overlay from damage, wetness darkening, heat glow (emissive ramp) for molten/burning voxels.
- **Camera occlusion:** dither-cutout of world fragments between camera and player (screen-space circle),
  so tight Seireitei alleys stay playable.

### 5.6 Edit & query API (sim-side, headless)
`get/set`, `fill(shape, material, op)`, `carve(DamageShape)`, `paint(shape, materialState)`,
`transform(shape, rule)` (freeze, burn, rot, absorb), `raycast` (3D DDA, returns voxel/normal/material),
`sweepBox`/`overlap` for controllers and hit tests, `sampleSolid(p)` for particles, region snapshots for
restoration. All edits are batched per frame into an **edit log** (feeds remeshing, colliders, restoration,
replays).

---

## 6. Destruction engine

The core promise: attacks crater the ground, cut through structures, and make them collapse.

### 6.1 Damage shapes
Abilities emit `DamageShape`s with a power profile and a **mode**:
| Mode | Behaviour | Typical users |
|---|---|---|
| `smash` | sphere/ellipsoid/capsule crater with noise-eroded rim, debris launched outward | punches, Bala, Kenpachi's swings, ground slams |
| `cut` | thin slab along a plane/arc/swept blade (1–3 voxels thick) — **no material loss beyond the kerf**, separated part keeps shape | sword slashes, Getsuga, Kendō, Senbonzakura blades, Shinsō |
| `bore` | cylinder/cone tunnel along a ray, melted rim | Cero, Byakurai, Hikotsu Taihō, Heilig Pfeil, X-Axis |
| `explode` | radial blast, fragments + fire | Bambietta's bombs, Sōkatsui, Gran Rey Cero impact |
| `groundwave` | travelling upheaval along the surface (lifts voxels into debris) | ground Getsuga, Komamura, Kenpachi |
| `freeze` | converts/coats voxels with ice; adds ice constructs | Hyōrinmaru, Sode no Shirayuki |
| `burn` | heats voxels → charred / molten / ash, spreads on flammables | Ryūjin Jakka, Tobiume, Bazz-B |
| `rot` | decays voxels to dust over time | Baraggan's Respira |
| `absorb` | pulls voxels out as reishi streams toward a point (no debris) | Quincy Sklaverei, Liltotto eating terrain |
| `construct` | adds voxels (owned, optionally expiring) | Sennen Hyōrō, Danku, Senkei blade rows, Santen Kesshun, Quilge's cage |
| `paint` | recolours surfaces (scorch, blood, ink, frost) | everything, for residue |

Power vs material: a voxel breaks if `power × falloff(distance) > hardness`; between toughness and hardness it
gets cracked (damage map). Sekkiseki laughs at most attacks, Hueco Mundo sand gives way to anything.

### 6.2 Pipeline per frame
1. **Resolve** shapes against the grid (AABB-bounded, SDF evaluated per voxel) → removed/changed voxel sets.
2. **Debris emission** from removed voxels (sampled: big chunks → physical debris cubes inheriting material
   colours, the rest → dust and chips), velocities from shape normal/impulse.
3. **Apply** edits (edit log), mark chunks dirty (mesh + collider), update Rapier voxel colliders via `setVoxel`
   (bulk rebuild if > threshold).
4. **Structural integrity** (structure worker): seeds = solid neighbours of removed voxels. For each unvisited seed,
   run a **gravity-guided search** (priority on lowest *y*, then flood) toward an anchor (bedrock/anchored material).
   Supported components are found in ~O(height); unsupported components are explored fully and become fragments.
   Huge components (> ~400k voxels) are split into several fragments along a coarse grid so collapses look like
   collapses. Budgets per frame; results versioned.
5. **Fragment extraction:** copy component into a local grid → `VoxelObject` (mesh built in worker) → Rapier
   dynamic body with **voxel collider** (mass from material density) → initial impulse from the cause.
   Swap is atomic: world chunks and fragment mesh appear in the same frame (no flicker/holes).
6. **Slicing feel:** for `cut` shapes, the separated part gets a small impulse *along the cut plane* + gravity, so
   the top of a building slides off the diagonal cut before toppling — the signature Bleach image.
7. **Impact fracture:** contact-force events above a material/fragment threshold split fragments into Voronoi
   pieces around the impact point + debris burst + dust; tiny fragments convert to debris particles.
8. **Settling:** a fragment asleep for N seconds is **re-rasterised into the world grid** (rubble becomes terrain,
   destructible again) and its body removed. Caps: ~150–300 active fragments; overflow crumbles the oldest.
9. **Rubble accumulation:** resting debris particles may deposit voxels into empty cells (capped) → piles.

### 6.3 Characters as destruction
Knocked-back bodies above a speed threshold carry a `smash` capsule: they **crash through walls** and carve
tunnels, then wall-splat or ground-bounce. Giants (Menos, Yammy, Komamura's Bankai) carve as they walk.
Reiatsu flares crack the ground in rings; releases blow out nearby voxels.

### 6.4 Restoration ("Sōten Kisshun" & map reset)
Every edit is logged with timestamp and region. Restoration replays the inverse for a region/time window with an
animated "voxels fly back into place" effect (golden for Orihime's rejection, black-white for Yhwach's Almighty
rewriting, clock-like for Giriko). Also powers the Training Ground "rebuild" button and quick map resets.

### 6.5 Environmental simulations (cheap cellular automata, region-limited)
All abilities and materials carry **element tags** (fire, ice, water, lightning, sand, poison, reishi, darkness…)
and a **temperature overlay** drives reactions:
- **Fire:** spreads over `flammable` voxels; burnt → charred → ash (removed). Red-hot blades and Burner Fingers
  **melt** voxels (no debris, glowing rims); molten ground cools into slag.
- **Ice:** freezing coats surfaces with ice voxels; ice constructs shatter into glassy debris; **frozen targets are
  "switched off"** (abilities/auras paused) until they break out; Rukia's contact freezing leaves ice footsteps.
- **Water (Harribel, Kaien, rain, Gremmy):** coarse water-voxel CA in limited regions + splashes; water ↔ ice ↔
  steam conversions (Hitsugaya vs Harribel, Bazz-B vs Hitsugaya); lava as a hot liquid variant.
- **Sand (Hueco Mundo):** granular material that slumps to its angle of repose, swallows craters, and lets Hollows
  burrow.
- **Decay (Baraggan):** voxels in the Respira cone age (colour → grey → dust), the rot spreads through connected
  structures and collapses them; projectiles and Kidō age in the field.
- **Absorption (Quincy Sklaverei, Liltotto):** voxels detach as glowing particle streams to the caster (or into a
  mouth); structures lose integrity → collapse via the normal structural pass.
- **Bomb tagging (Bambietta):** any voxel chunk, fragment, prop or enemy can carry a fuse; chain reactions,
  knock-away, freezable fuses.
- **Weather layer** (§11.4): humidity, rain, snow, storms and heat states that feed these reactions map-wide.

---

## 7. Physics

- **Rapier 0.21 (WASM)** single world on the main thread (move to a worker only if profiling says so).
  - World chunks: fixed bodies with **voxel colliders** (32³ each), coupled across borders with
    `combineVoxelStates`/`propagateVoxelChange` to avoid internal-edge snagging.
  - Fragments & props: dynamic bodies with voxel colliders; sleeping enabled; CCD for fast pieces.
  - Characters: kinematic capsules driven by our controller (Rapier `KinematicCharacterController` for
    collide-and-slide, autostep up to 0.5 m, snap-to-ground), plus custom states: air-step, flight, Shunpo
    blink (sweep test along the path; blinks *through* thin obstacles if the race allows), knockback-carving.
  - Contact-force events → fracture, impact SFX, camera shake.
- **Debris particles (not in Rapier):** SoA typed arrays, CPU integration, collision by sampling the voxel grid
  (axis-separated response, restitution/friction per material), sleep/fade/deposit. 10–20k active, rendered as
  instanced cubes with per-instance colour; dust/smoke as soft sprites.
- **Physics-y fun:** grab & throw enemies, fragments and props (strong characters can hurl a building chunk),
  stomps, shockwaves that lift loose debris, reiatsu flare that levitates rubble.

---

## 8. Rendering, VFX & camera

### 8.1 Renderer & lighting
- WebGL2, sRGB output, `HalfFloat` composer buffers, **cascaded shadow maps** (three `CSM`, 3 cascades) for the
  sun, `PCFShadowMap`, hemisphere + ambient probe per map, distance fog/aerial perspective.
- Per-map lighting rigs: Karakura (warm afternoon / dusk), Seireitei (bright noon, white walls), Hueco Mundo
  (eternal night, crescent moon, cold rim light), Las Noches interior (fake blue sky dome), Soul King Palace
  (high-altitude glare), Silbern (Wahrwelt grey-white), Hell (red underlighting).
- Characters get a subtle **fresnel rim** and optional **ink outline** (inverted-hull or Sobel pass) as a
  "manga mode" style toggle.

### 8.2 Post stack (verified in look-dev)
RenderPass → **N8AO** → Bloom (mipmap, threshold 1.0, HDR VFX) → (heat haze / shockwave distortion when active)
→ Tone mapping (**Neutral or ACES**, AgX washed out the anime palette) + per-map LUT grade → chromatic aberration
& radial blur pulses on big hits/dashes → vignette → SMAA. Cinematic DOF in releases/photo mode.

### 8.3 VFX system
Data-driven emitters + custom shader meshes, all colour-parametrised per character:
- **GPU-instanced particles:** sprites (dust, smoke, sparks, petals, feathers, ash, snow), voxel cubes (debris,
  reishi dissolution), stretched billboards (speed lines), all with depth-fade.
- **Ribbon trails** for blades (sampled from blade sockets every sim tick, smoothed with Catmull-Rom).
- **Shaped energy meshes** with scrolling-noise additive shaders: crescents (Getsuga), beams (Cero, Byakurai),
  domes (Enma Kōrogi, Sankt Zwinger, Danku), pillars (reiatsu pillars, Rikujōkōrō rods), rings/shockwaves,
  cross blasts (Getsuga Jūjishō), wings (Hakuteiken, Vollständig halos), dragons (Hyōrinmaru — segmented ice
  body), black coffins (Kurohitsugi), lightning (procedural bolts with branching).
- **Auras:** inflated-silhouette flame shells driven by noise, coloured per character/form (Ichigo blue-white →
  black/red Bankai, Kenpachi yellow skull, Byakuya pink-white, Ulquiorra green, Aizen violet, Yamamoto fire).
- **Voxel-native effects:** Hollow death = model dissolves voxel-by-voxel into rising reishi motes; sliced
  enemies split into two re-meshed halves; Senbonzakura = thousands of tiny instanced blades with boids.
- **Decals/residue** by painting voxels (scorch, frost, blood, ink) — free, persistent, destructible.
- **Screen FX:** impact flash frames, hitstop, trauma-based shake, FOV punch, radial blur, speed lines, colour
  inversion frame on huge hits, letterbox for cinematics, **manga-panel freeze frame** for ultimates.
- **Callouts:** big brush-kanji + romaji typography ("月牙天衝 GETSUGA TENSHŌ"), release commands
  ("Scatter, Senbonzakura"), Bankai name cards. Damage numbers optional.

### 8.4 Camera
Spring-arm orbit with voxel-raycast collision + dither cutout; lock-on framing both fighters; cinematic cues from
ability timelines (dolly, orbit, punch-in, slow-mo, cut-to); shake by trauma; photo mode free cam.

---

## 9. Characters: models, rigs & animation

### 9.1 Voxel model DSL (`src/models/`)
Code-first modelling (I build everything as code + review screenshots):
- **Primitives (SDF-based):** box, rounded box, ellipsoid, capsule, cylinder, cone, torus, wedge, tube along a
  Bézier/Catmull-Rom path with radius profile, extruded polygon, lathe, heightfield; booleans (union, subtract,
  intersect, smooth union), mirror/symmetry, repeat, bend/twist/taper deformers, noise displacement.
- **Paint ops:** solid, gradient along axis, noise mottling, stripes/checker patterns, stamp decals (pixel-art
  kanji for division numbers, Espada numbers, Wandenreich emblem), edge accent pass, "shade by normal" bake.
- **Parts & sockets:** named parts with pivots/joint limits; sockets (`hand.R`, `hand.L`, `back`, `hip.L`, `head`)
  for weapons, sheaths, masks, haori.
- **Generators:** parametric humanoid body (height, head ratio, shoulder/waist/hip, limb thickness, musculature,
  gender, age), face presets (eyes, brows, mouth, marks), hair (spike/strand clumps with roots, direction,
  length, taper, curl, 2–3 tone shading), clothing shells (kosode, hakama with pleats, haori with division
  number & hishigata hem, Arrancar uniform, Vandenreich coat & cape, Fullbring outfits, school uniforms),
  armour/bone plates (Hollow masks, Resurrección carapaces), weapons (katana with sori/tsuba/tsuka-ito, cleavers,
  scythes, bows, spears, chains), creatures (spine-and-limb Hollow generator with mask generator).
- **Output:** `VoxelModel { parts: Map<name, {grid, pivot, parent}>, palette, sockets, bounds }` → greedy meshed
  into one **rigid-skinned `SkinnedMesh`** per character (one draw call; each part's vertices weighted 100% to its
  bone) + separate weapon meshes on sockets so forms can swap weapons.
- Model build is fast at runtime (ms) and cached (IndexedDB) by content hash.

### 9.2 Proportions & style (Bleach)
Bleach characters are tall and slender (≈ 1:7.5 heads). Voxel readability calls for a slight stylisation:
head ≈ 1/6.5–1/7 of height, slightly larger hands/feet, long legs. Shihakushō silhouette = black kosode with
white collar V, wide pleated hakama, white tabi + waraji; captains add the white haori with the division number
on the back. Detailed rules live in the `voxel-art` skill.

### 9.3 Rig & animation (`src/anim/`)
- Standard humanoid skeleton + optional chains: hair (2–4 bone chains), haori tails/sleeves, scarves (Byakuya's
  Ginpaku Kazahana no Usuginu), tails (Grimmjow, Ulquiorra), wings (Ulquiorra, Aizen, Vollständig),
  extra arms (Nnoitra), mask/horn attachments.
- **Clips** authored as data (keyframed poses in degrees, easing, events for hitboxes/VFX/SFX), **layers**
  (full body, upper-body overrides, additive recoil), **procedural**: look-at, foot IK on voxel terrain,
  lean/bank, breathing, spring bones for hair/cloth, weapon trails, **smear afterimages** for fast moves.
- **Archetype libraries** shared across characters: katana 1H/2H, giant cleaver (Zangetsu), dual blades
  (Kyōraku, TYBW Ichigo), whip-sword (Zabimaru), extending spear (Shinsō), polearm (Hōzukimaru), chain-sickle
  (Hyōrinmaru, Kazeshini), martial arts (Yoruichi, Suì-Fēng, Kensei, Chad), bow (Uryū, Quincy), claws
  (Grimmjow), giant weapon (Nnoitra), cane/staff (Urahara), pistols (Starrk), Kidō casting poses, giant/beast
  locomotion.
- Dev tool: pose editor page with sliders + screenshot export for review.

---

## 10. Combat & ability system

### 10.1 Stats (fun-first)
`HP`, `Reiatsu` (energy, regenerates, spent by techniques), `Meter` (ultimates), **`SPL`** (spiritual pressure
level, drives crush/pin effects and damage thresholds), speed tier (dash distance/afterimages), durability tier.
Forms multiply stats. Canon peaks map to big numbers; nobody is "balanced".

### 10.2 Universal rules (from `docs/lore/mechanics.md`)
- **Reiatsu crush:** flaring near beings with much lower SPL pins (kneel), suffocates or KOs them.
- **Defence layers:** Hierro (Arrancar), Blut Vene (Quincy), Kenpachi's raw reiatsu — damage below a threshold
  relative to the attacker's SPL is negated ("not even a scratch").
- **Bankai theft:** Sternritter medallions can steal a Bankai (the victim's Bankai slot locks; the thief gains it).
  Hollowfied Bankai (Ichigo) can't be stolen and poisons the medallion — canon detail kept.
- **Incantations:** Kidō can be cast instantly (Eishōhaki) or **chanted** (hold, text scrolls) for bonus power;
  double incantation chains two spells.

### 10.3 Combat mechanics
Swept hitboxes (capsules/arcs per sim tick) vs per-part hurtboxes; damage types (slash, blunt, pierce, energy,
fire, ice, lightning, poison, soul); reactions (flinch, stagger, launch, knockdown, wall-splat, ground-bounce,
crumple, freeze-encase, paralysis); guard, **parry**, **blade lock** (mash contest, camera close-up),
**beam struggles** (Getsuga vs Cero push contest; loser eats both), super-armour, i-frames, juggles, air combos,
wall-crash-through, grabs/throws, cancels (special-cancel, Shunpo-cancel), combo counter.

### 10.4 Abilities as data + scripts
```ts
interface AbilityDef {
  id; name; kanji?; meaning?; callout?;       // "Getsuga Tenshō", "月牙天衝"
  forms: FormId[]; slot: Slot; air?: boolean; // where it lives
  cost: { reiatsu?; hp?; meter? }; cooldown;
  hold?: { min; max; chargeFx };              // charge/chant
  timeline: TimelineEvent[];                  // anim / hitbox / spawn / move / camera / callout / sfx / script
  ai?: { range: [min, max]; weight; when? };
}
```
Effects spawned by timelines are composable primitives (matching the research brief vocabulary):
`MeleeArc, Projectile, Beam, Blast, GroundWave, Slice, Field, Summon, Swarm, Construct, Transform, Stance, Bind,
Grab/Throw, Teleport, Afterimage/Clone, Status, Heal/Reject, Absorb/Reflect, Shield, Environmental, Mobility,
Sensing/Stealth`, each with a destruction spec (`DamageShape` mode + power). Unique mechanics are scripts that
reuse primitives: Kyōka Suigetsu (illusory clones, hidden true position, enemies attack decoys), Sakanade
(screen/inputs mirrored inside the field with a learnable visual cue), Enma Kōrogi (darkness dome: only sound
cues), Katen Kyōkotsu games (rules UI: "Takaoni — the higher one wins"), The Almighty (pre-dodge, ability
nullify, future rewrite), Book of the End (convert target to ally / "remember" doors in walls), The Visionary
(imagination menu: meteors, liquid floor, copy fighter).

### 10.5 Forms & releases
Forms are state machines with model overrides, stat multipliers, movement profile, 6 slots, passives and
timers (Hollow mask duration, Hitsugaya's Bankai petals, Gerard's growth). Releasing triggers a cinematic
(skippable) with the release command, a reiatsu blast that clears nearby voxels, and the form name card.

### 10.6 Race layers
Every character inherits a race layer (movement, defence, projectile family, sensing) from
`docs/lore/mechanics.md`: Shinigami (Shunpo, Kidō wheel, Zanjutsu/Hakuda), Hollow/Arrancar (Sonído, Cero
family, Bala, Hierro, Pesquisa, Garganta, regeneration), Visored (mask layer), Quincy (Hirenkyaku, Heilig Pfeil,
Blut, Ransōtengai, Sklaverei, Gintō, Vollständig), Fullbringer (Bringer Light, object-soul manipulation).

---

## 11. Roster plan

Full dossiers: `docs/roster/*.md` (appearance & palette, forms, complete abilities, kit proposal, AI notes).
*(Roster tiers, wave order and the exemplar kit are finalised in §11.1–11.4 from the dossiers.)*

### 11.1 Packaging: era loadouts + "All Eras"
Characters who change across the story ship as **era loadouts** chosen at character select (Ichigo has nine,
K0–K8; Rukia, Renji, Uryū, Chad, Hitsugaya, Kenpachi, Byakuya, Aizen, Grimmjow… have 2–4). Inside a loadout,
**T climbs the form ladder** and **G toggles states**. Every multi-era character also gets an **"All Eras"**
loadout: T cycles through *every* form and the Tab wheel exposes *every* technique — the "do everything they
can do" mode. Default selection = the character's peak era.

Tiers: **S** = flagship, full era loadouts, built first in its wave · **A** = full kit · **B** = full kit,
fewer forms · **C** = NPC / enemy / summon / cameo (may be promoted later). Waves map to milestones:
**W0** = M3–M5 vertical slice, **W1** = M6, **W2** = M7, **W3** = M8, **W4** = M9, **W5** = M10.
Heights in dossiers are given at 32 voxels/m (brief) — multiply by 1.5 for the 48/m standard.

### 11.2 Roster
**Karakura & allies** — `A1-ichigo.md`, `A2-karakura-allies.md`, `A3-urahara-shop-and-shiba.md`
| Character | Tier | Wave | Forms / loadouts | Signature systems |
|---|---|---|---|---|
| Ichigo Kurosaki | S | W0 | 9 era loadouts, 20 forms (see §11.3) | soul/body split, tethered blade, Hollow takeover, Mugetsu depower |
| Hollow Ichigo | A | W1 | white Shikai/Bankai, lizard body, monochrome Full Hollow | flail-chain Zangetsu, horn Cero, "King and Horse" passive |
| Rukia Kuchiki | S | W1 | sealed, Sode no Shirayuki dances, Hakka no Togame (TYBW) | absolute-zero freeze, Kidō specialist |
| Uryū Ishida | S | W1 | Kojaku, Ginrei Kojaku, Letzt Stil, Seele Schneider, Sternritter "A" | Heilig Pfeil rain, Sklaverei, The Antithesis |
| Orihime Inoue | A (needed early) | W1 | Shun Shun Rikka, six fairies, Rokuten Shishun (anime) | Santen Kesshun shields, **Sōten Kisshun restores destroyed voxels, limbs and weapons** |
| Yasutora "Chad" Sado | A | W1 | right arm → both arms → Fullbring arms | El Directo / La Muerte, Diablo arm |
| Kisuke Urahara | S | W1 | cane sword, Benihime, Kannonbiraki Benihime Aratame | Kidō master, gadget wheel, **restructure** (open bodies/buildings along seams and sew them back), analyse-and-cancel counters, time-stop volume |
| Yoruichi Shihōin | S | W1 | Onmitsukidō, Shunkō, Raijin Senkei, Raijū Senpū beast form (TYBW), cat form | Flash-goddess speed, Hakuda, Hanki Kidō cancel, adaptation-proof cycling reiatsu |
| Isshin Kurosaki | A | W3 | doctor, Shinigami, Engetsu (Bankai locked) | fire Getsuga, flow-freeze field |
| Kon | B | W3 | plushie, Kon-in-body, Muscle Kon, Karakura-Raizer | body piloting, co-op hook |
| Kaien Shiba | B | W3 | Nejibana; Metastacia-possessed boss variant | water trident, moving water waves |
| Tessai Tsukabishi | B (A if the Kidō library lands early) | W3 | Kidō master | forbidden Kidō, barriers, seals |
| Kūkaku Shiba | B | W3 | fireworks, Flower Crane Cannon | cannonball ride set piece (one rides, one steers) |
| Ganju Shiba (+ Bonnie) | B | W1 | sand, fireworks | voxels → flowing sand, boar mount |
| Jidanbō Ikkanzaka | C | W1 | gatekeeper giant | West Gate boss / NPC, lifts the gate |
| Ryūken Ishida | B | W4 | Quincy | Heilig Pfeil precision |

**Gotei 13 captains** — `B1-captains-1.md`, `B2-captains-2.md`, `B3-captains-3.md`
| Character | Tier | Wave | Forms / loadouts | Signature systems |
|---|---|---|---|---|
| Genryūsai S. Yamamoto | S | W2 | Ryūjin Jakka, Zanka no Tachi (East/West/South/North) | map-wide heat → evaporation, erase-cut, skeleton army from kill registry, self-burning Bankai timer |
| Byakuya Kuchiki | S | W1 | Senbonzakura, Kageyoshi, Senkei, Gōkei, Shūkei: Hakuteiken | million-blade swarm with hand-gesture formations, 85 cm no-blade zone |
| Sōsuke Aizen | S | W2 | captain, traitor, 4 Hōgyoku stages, TYBW prisoner | **Kyōka Suigetsu** per-observer illusions, incantation-less Kurohitsugi, Fragor |
| Tōshirō Hitsugaya | S | W2 | child Shikai/Bankai (petal timer), adult Bankai | humidity/weather-driven ice, "frozen = switched off", Hyōten Hyakkasō |
| Kenpachi Zaraki | S | W1 | eyepatch tiers, Kendō, Nozarashi, Bankai demon | damage threshold, per-opponent escalation, space-cutting cleaves |
| Shunsui Kyōraku | A | W2 | Katen Kyōkotsu games, Karamatsu Shinjū (4 acts) | **rule zones** (Takaoni, Kageoni, Irooni, Daruma…), shadow play |
| Suì-Fēng | A | W2 | Suzumebachi, Shunkō, Jakuhō Raikōben | Nigeki Kessatsu death mark, missile Bankai |
| Gin Ichimaru | A | W2 | Shinsō, Kamishini no Yari | km-long extending blade, Korose poison fragment |
| Retsu / Yachiru Unohana | A | W2 | healer, first Kenpachi, Minazuki | rideable manta summon, liquid arena |
| Mayuri Kurotsuchi | A | W2 | Ashisogi Jizō, Konjiki A.J., Matai Fukuin Shōtai | paralysis per limb, liquefaction, time-loop drug, gadgets |
| Sajin Komamura | B→A | W2 | Tenken, Kokujō Tengen Myō'ō, human form | ~100 m pose-mirroring giant with linked damage |
| Kaname Tōsen | B | W2 | Suzumushi, Enma Kōrogi, mask, Grillar Grillo | sensory-deprivation dome, blind camera |
| Jūshirō Ukitake | B | W2 | Sōgyo no Kotowari, Kamikake | absorb & return projectiles |

**Lieutenants & seated officers** — `C1-lieutenants-1.md`, `C2-lieutenants-2.md`
| Character | Tier | Wave | Signature systems |
|---|---|---|---|
| Renji Abarai | S | W1 | segmented whip-blade, Hihiō Zabimaru, true Sōō Zabimaru (Orochiō, Zaga Teppō…) |
| Ikkaku Madarame | A | W3 | three-section staff, Bankai dragon crest that fills |
| Shūhei Hisagi | A | W3 | chain-scythes, Kidō through chain, (novel) Bankai life link |
| Rangiku Matsumoto | A | W3 | ash cloud that cuts where it lands, ash + ice duo combo |
| Yumichika, Kira, Hinamori, Sasakibe, Nanao, Nemu, Yachiru | B | W3 | Ruri'iro Kujaku drain · Wabisuke weight stacking · Fushibi trap nets · lightning dome · divine reflection · Nemu body tech · echo summons |
| Isane, Ōmaeda, Iba, Hanatarō | C | W1–W3 | healers / flail / support NPCs |

**Visored** — `D-visored.md`
| Character | Tier | Wave | Signature systems |
|---|---|---|---|
| Shinji Hirako | A | W3 | **Sakanade** mirrored-position inversion, friend/foe-swap Bankai |
| Kensei Muguruma | A | W3 | explosive slashes, Tekken Tachikaze |
| Rōjūrō "Rose" Ōtoribashi | A | W3 | whip, music-illusion Bankai (deafness immunity) |
| Love, Lisa, Hiyori, Mashiro, Hachigen | B | W3 | Tengumaru, Haguro Tonbo, Kubikiri Orochi, kick Cero, barrier Kidō (systems built early) |

**Espada & Arrancar** — `E1-espada-1.md`, `E2-espada-2.md`, `F-arrancar-and-hollows.md`
| Character | Tier | Wave | Signature systems |
|---|---|---|---|
| Ulquiorra Cifer | S | W2 | Murciélago → Segunda Etapa, Lanza del Relámpago, tail, regeneration |
| Grimmjow Jaegerjaquez | S | W2 | Pantera, Desgarrón (swipe-steered), Gran Rey Cero |
| Coyote Starrk (+ Lilynette) | A | W2 | Los Lobos pistols, Cero Metralleta, exploding wolves, partner-in-weapon |
| Baraggan Louisenbairn | A | W2 | Respira decay spreading through structures |
| Tier Harribel | A | W2 | persistent water volumes, Tres Bestias + Ayon |
| Nnoitra Gilga | A | W2 | six arms sprouting mid-fight, adaptive Hierro |
| Szayelaporro Granz | A | W2 | voodoo organs, AI copies, Gabriel rebirth, Hell form |
| Nelliel Tu Odelschwanck | A | W2 | child ↔ adult ↔ centaur, Cero Doble |
| Yammy Llargo | A boss / B | W2 | continuous growth (voxel density switching) |
| Zommari, Aaroniero | B | W2 | limb hijack · Kaien disguise (cancelled by sunlight) |
| Wonderweiss, Luppi, Dordoni, Cirucci, Gantenbainne, Tres Bestias | B | W2 | fire sealing · tentacles · tornado legs · whip-disc · dragon beams · tag team |
| Ggio, Grand Fisher, Ayon, Shawlong, Edrad, Rudbornn, Tesra | C | W1–W2 | enemies / summons / Calavera army |

**Fullbringers** — `G-fullbringers.md`
| Character | Tier | Wave | Signature systems |
|---|---|---|---|
| Kūgo Ginjō | A | W3 | Cross of Scaffold, steals ability slots, Bankai-fused armour |
| Shūkurō Tsukishima | A | W3 | **Book of the End**: retroactive edits (terrain "always was" doored/trapped), enemies → allies |
| Riruka, Jackie, Yukio | B | W3 | Dollhouse · dirt meter fed by the world · **pocket-dimension arenas with runtime rules** |
| Giriko, Moe | C→B | W3 | contract engine · slot-machine luck |

**Vandenreich** — `H1-vandenreich-leaders.md`, `H2-sternritter-1.md`, `H3-sternritter-2.md`
| Character | Tier | Wave | Signature systems |
|---|---|---|---|
| Yhwach | S | W4 | **The Almighty**: future-ghost pre-dodge/parry, cancel abilities as they land, weapons stay broken, undo deaths; Auswählen map-wide faction drain; Medallion Bankai theft; shadows; Soul King form |
| Jugram Haschwalth | A | W4 | The Balance (misfortune transfer, 3 reflection types), Freund Schild, day/night swap with Yhwach, anime "hAschwAlth" |
| Gerard Valkyrie | A | W4 | The Miracle: grows with damage from ~2 m to a climbable 100 m+ giant, Vollständig Aschtonig |
| Lille Barro | A | W4 | X-Axis shots that pass every guard and stop only at the target, Jilliel → God form |
| Pernida Parnkgjas | B | W4 | the Compulsory: nerve takeover of skeletons (escape by cutting your own limb), limbs from terrain |
| Askin Nakk Le Vaar | B | W4 | lethal-dose poison with adaptive immunity, Gift Ball, Gift Bereich, Vollständig Hasshein |
| Gremmy Thoumeaux | A (S-candidate) | W4 | The Visionary: ~30-entry imagination menu (meteors, liquid floor, "bones made of cookies", clones), Focus meter |
| Bazz-B, Bambietta, Quilge, Äs Nödt, Mask De Masculine (+ James) | A | W4 | Burner Finger 1–4 escalation · **bomb-tag anything** (voxel chunks too) · Sklaverei arena absorption & Jail, Vollständig Piskiel · line-of-sight fear · cheer-powered life link |
| Candice, Liltotto, Giselle, Lloyd twins | A | W4 | chain lightning · **eats terrain and attacks** · zombifies roster characters · **copies any roster character (model + kit)** |
| Cang Du, BG9, PePe, Meninas, Robert | B | W4 | iron skin · tendrils · love control (turns Zanpakutō on owners) · cuts & throws world chunks · rifle |
| Driscoll, NaNaNa, Nianzol, Berenice, Jerome, Shaz, Ebern | C | W4 | stolen Sasakibe Bankai (purple) · weak-point overlay · deflection · objections · ape roar · regen · prologue boss |

**Royal Guard, Hell & others** — `I-zero-division-and-others.md`
| Character | Tier | Wave | Signature systems |
|---|---|---|---|
| Ichibē Hyōsube | A | W4 | **name system** (rename / halve / erase powers), ink, Shirafude Ichimonji |
| Senjumaru Shutara | A | W4 | weaving: re-tailor outfits, tapestry scenery, seal-flat |
| Ōetsu Nimaiya, Tenjirō Kirinji, Kirio Hikifune | B | W4 | swords, hot springs & light, growing tree / food healing |
| Kokutō (non-canon movie) | B | W5 | Hell chains |
| Hell enemies, Soul King, Mimihagi, palace NPCs | C | W4–W5 | Kushanāda, Togabito, boss phases |

**Totals:** ≈ 95 playable (S/A/B) + ≈ 35 C-tier NPCs/enemies/summons + 15 Hollow archetypes and the Calavera army.

### 11.3 Exemplar kit — Ichigo (from `A1-ichigo.md`, ~110 abilities)
| Loadout | Forms (T ladder) | What makes it play differently |
|---|---|---|
| **K0 Human** | human teen | karate, parkour, improvised weapons; badge slap ejects the soul — **the empty body stays in the world** and **Kon can pilot it** as an ally |
| **K1 Substitute Shinigami** | first oversized sword | lunge-dash only; swings bite into walls; absorb a Cero on the blade into an overload meter and fling it back |
| **K2 Shikai Zangetsu** | Shikai | Shunpo; cleaver chain that shears building corners; Getsuga Tenshō / ground plow; **cloth-tethered blade throw** with mid-flight re-aim and reel-in; "Let it out" partial possession |
| **K3 Bankai Tensa Zangetsu** | + Hollow mask on G | hyper Shunpo with aggro afterimages, steerable Black Getsuga, bare-hand catch; **mask timer + mask HP**; masked Getsuga lets him blink ahead of his own crescent to fire again (×3) |
| **K4 Post-Dangai → Final Getsuga** | Bankai v2 → Mugetsu form | higher-plane presence (weaker foes can't lock on); a ~20 s countdown form ending in **Mugetsu** (sky blacks out, horizon-wide black curtain) → **forced human for the rest of the match** |
| **K5 Fullbring** | FB1 → FB2 → FB3 | Bringer Light with **springy ground**; segmented manji projectiles that lose blades per shot; reawakening into K6 |
| **K6 Restored** | Shikai v2 → Bankai v3 | weather-clearing Getsuga, weapon-breaker cuts, pocket-dimension breaking, rage aura |
| **K7 TYBW** | dual True Shikai → Half-Hollow → Blood Chains (anime) → True Bankai | **Getsuga Jūjishō merges two projectiles**, Chain recall, Blut Vene; Half-Hollow unlocked by a Quincy-exposure meter; Blood Chains footstep clones with **delayed echo hits** and a giant crescent left hanging in the sky; True Bankai shell-break cut |
| **K8 Inner-Hollow states** | possession / lizard body / Full Hollow revive | **AI takes over the player's character** until RMB-mashing rips the mask off; KO in the Hueco Mundo era **revives him as the Full Hollow** (horn Cero, Sonído, limb rip; breaking a horn ends it) |

Hollow Ichigo ships separately (A tier) on the same rig with an inverted palette and a flail-chain kit.

### 11.4 Cross-character systems (consolidated from the dossiers' `[NEW]` tags)
| System | What it enables (examples) | First needed |
|---|---|---|
| **Perception layer** (authoritative truth + per-observer views) | Kyōka Suigetsu decoys/fake terrain, Sakanade mirrored positions, Shinji's friend/foe swap, Rose's victim-only illusions, Enma Kōrogi, Gin's Bankai shown as sealed, disguises (Aaroniero, Lloyd), camouflage, unsensable flags | M4 (design), M7 |
| **Rule zones & arena rules** | Katen Kyōkotsu games, Yukio's/Riruka's pocket dimensions with gravity/time/lives rules, Hell rules, Gentei limiter, faction-locked barriers, Berenice's objections, Giriko's contracts | M7–M8 |
| **Weather & sky** | Yamamoto evaporating the map, Hitsugaya's humidity/snow, Sasakibe's lightning dome, eclipses/blackouts, giant crescent in the sky, Las Noches fake sky, Kirinji whiteout | M5, M7 |
| **Elements & material reactions** | element tags on abilities and voxels; freeze-disables; melting, burning, charring, ash; persistent water ↔ ice ↔ steam; flowing sand; lava/acid/hot springs; decay | M2, M7 |
| **Body system** | per-limb HP, sever/regrow, extra arms, tails, breakable horns/masks/halos, Hollow-hole hitbox voids, blood stat, outfit layers that tatter, growth with voxel-density switching, liquefaction, soul/body split, death variants (reishi dissolve, ash, skeleton strip, Gates of Hell) | M4, M7 |
| **Weapon system** | segmented whips/chains/flails, tethered throws & recall, embedding in walls, breaking/shell shedding, disarm & pickup, weight stacking, length-animating blades, red-hot blades, weapon meters | M4, M6 |
| **Projectile extensions** | steerable, merging (Jūjishō, combined Ceros), catch/absorb/return (Ukitake, Cero Doble), growing, freezing mid-air, curving, chain lightning, delayed echo hits, marks | M4–M6 |
| **Copies, summons & theft** | AI copies of anyone incl. the player, zombified roster characters, Lloyd/Aaroniero full-kit copies, Ginjō slot theft, **medallion Bankai theft**, wolf/skeleton armies, pose-mirroring giants, echo summons | M7–M9 |
| **Status library** | per-limb paralysis, poison/lethal dose, weight, rot, fear, death mark, deafness, inversion, conversion/mind control, silence, glue, time loop, single-entity time slow, infection meters | M4 onward |
| **Time & history** | per-entity time scale, restore world/HP to earlier states (Orihime, Hachigen, Tsukishima), damage-history reassignment (Aizen, Kyōraku), replay ghosts, The Almighty rewrites | M2 (edit log), M7–M9 |
| **Name & meta** | Ichibē's true names, Tsukishima's past insertion, persistent "has seen Aizen's Shikai" profile flag | M8–M9 |
| **Destruction extensions** | erase-cut, absorb (Sklaverei), eat terrain (Liltotto), cut & throw world chunks (Meninas), debris telekinesis, dirt meter (Jackie), weakest-support finder (Moe), reishi-disabling grenades (Nemu), springy ground (Fullbring), kanji barriers, tapestry scenery | M2, then per character |
| **Shadow & light queries** | Kageoni shadow overlap, Schatten shadow portals, Aaroniero's sunlight weakness (break walls to let light in) | M7 |
| **Transformation extensions** | timed states with meters & lockouts, conditional/forced transforms, revive-into-form on KO, AI takeover, depower after ultimate, Vollständig halos, Bankai locks/interrupts | M4, M6 |
| **Team systems** | duo moves, shared reiatsu pool, carrying allies, broadcasts, assists, life links | M6 |
| **Souls & civilians** | Pluses, Konsō, possession, soul theft, Hollow bait, Yammy's lethal inhale | M5, M7 |
| **Spawns & portals** | Garganta, sky cracks, Negación pillars, Senkaimon, shadow pools, off-map launch and return, Hollows merging into a Gillian | M5, M7 |
| **Camera modes & mini-inputs** | blind sight, deprivation black, mirror-shatter reveal, face-guard ADS; mash contests, rhythm prompts, charades, slot machine | M4, per character |
| **Sensing** | reiatsu sensing, suppression/fake death, signature matching, precognition immunity, AI attracted to flares | M4 |

### 11.x Kit spec template (`docs/kits/<id>.md`, produced with the `bleach-kit-design` skill)
1. **Identity:** one line on how this character must *feel* (e.g. Byakuya: "noble stillness, the petals do the
   work"; Kenpachi: "no guard, every swing bigger than the last").
2. **Forms table:** form → release command → stat multipliers → movement profile → model overrides → timers.
3. **Inputs per form:** Shift style, LMB string (hit count, ranges, cancels), heavy, Q/E/R/F/Z/X, G toggle,
   C flare behaviour, V ultimate, Tab wheel entries, context actions.
4. **Completeness table:** every ability in the dossier → slot / wheel / passive / "merged into …" / "cinematic only".
   Nothing silently dropped.
5. **Timelines:** frame sketches (windup/active/recovery), hitboxes, `DamageShape` mode + power per hit.
6. **VFX/SFX list** with colours from the dossier palette; callouts (romaji + kanji).
7. **AI profile:** personality params, signature strings, release thresholds, boss phases.
8. **Story hooks:** canon battles this kit must recreate.
9. **Test plan:** headless sim scenarios + screenshots to capture.

---

## 12. Enemies & AI

### 12.1 Fighter AI (characters as opponents/partners)
- **Utility AI over a fighter state machine.** Each tick (10–20 Hz, per-entity LOD) score candidate actions —
  approach, strafe, dash in/out, combo string, ability (from `AbilityDef.ai` hints: range, conditions, weight),
  guard/parry/dodge, flare, release/transform, taunt, retreat/heal, assist — and commit with hysteresis.
- **Perception:** threat & distance target selection, line of sight by voxel raycast, sensing races
  (Pesquisa, Shinigami reiatsu sensing) see through walls; an **incoming-attack registry** (every projectile,
  beam and telegraphed swing registers its future volume) drives dodge/guard/parry/counter decisions with a
  reaction-time + skill model.
- **Personality profiles** from the dossiers' AI notes: aggression, patience, range preference, guard rate,
  signature strings and tells (Kenpachi never guards and grins through hits; Byakuya barely moves and lets
  Senbonzakura work; Aizen hides behind Kyōka Suigetsu decoys; Ulquiorra walks calmly then explodes into speed;
  Grimmjow charges wildly; Gin pokes from range with Shinsō; Mayuri kites with poison and gadgets; Yhwach
  pre-dodges with The Almighty).
- **Release logic:** canon-flavoured thresholds (HP %, "taking it seriously" after being hit by a big move,
  opponent's form level), with a cinematic the player can watch or interrupt (interrupting a Bankai release is
  a fun high-risk play).
- **Navigation in a world that keeps breaking:** no baked navmesh. Flyers/air-walkers (most named characters)
  use 3D pursuit with obstacle probes, going *over* (air-step), *around*, or ***through*** (AI may decide to carve a
  wall). Ground-bound enemies use a coarse 2.5D height grid updated from the edit log with A* for individuals and
  **flow fields** for hordes.
- **Difficulty:** reaction time, execution accuracy, guard/parry odds, aggression; "Canon" toggle gives bosses
  their full kit immediately.
- **Bosses:** phase scripts (thresholds → release cinematics, new abilities, arena changes such as Ulquiorra's
  Segunda Etapa on the dome roof or Aizen's Hōgyoku evolutions), short paraphrased taunts as callouts.
- **Team AI:** roles (frontline / ranged / support), focus fire, assists, healer behaviours (Orihime,
  Unohana, Hanatarō), shield timing (Santen Kesshun), tag-swap logic for AI partners.
- **Hordes:** Hollows are lightweight agents (simplified state machines, staggered updates, 60 active budget).

### 12.2 Bestiary (full spec: `docs/roster/F-arrancar-and-hollows.md` §B)
| Tier | Class | Size / density | Archetypes | First wave |
|---|---|---|---|---|
| T0 | Vermin (swarm) | 0.3–1.5 m, 32/m | Hueco Mundo critters | W2 |
| T1 | Lesser Hollow | 2–6 m, 16–32/m | Brute, Biter, Hexapod, Demi-Hollow | **W0** |
| T2 | Named-class (one gimmick) | 3–10 m, 16/m | Shrieker-type, Acidwire-type, Puppeteer, Lurer (Grand Fisher), Possessor (White) | W1 |
| T3 | Huge Hollow / colossus | 10–35 m, 8/m | Huge Hollow, Sand Colossus (Runuganga) | W2 |
| T4 | Menos Grande: Gillian | ~36 m (±20 %), 4/m (mask & hands 8/m) | Gillian, unique-mask Gillian, split Menos | **W0** (boss) |
| T4+ | Carrier | ~120 m, 2/m | Hooleer (Wonderweiss's mount, disgorges Gillians) | W2 |
| T5 | Adjuchas | 2–12 m, 16–32/m | 10 templates, Gillian commanders | W2 |
| T6 | Vasto Lorde | 1.6–2.5 m, 32/m | multi-bar bosses | W2 |
| Army | Calavera (Exequias) | 1.72 m | Rudbornn's skull soldiers | W2 |

Shared rules: masks are sub-models with HP and crack stages (a clean cut through the mask kills T0–T2; cracks reveal
the human face; unsplit masks regrow); the Hollow hole is a real hole projectiles pass through; acidic grabs;
soul extraction from NPCs; regrowing limbs unless burned/frozen; **death router** (Zanpakutō → purification with a
brief Plus, Quincy → annihilation, sinner → Gates of Hell event, Hollow killer → may eat the remains);
**reiatsu-radar AI** (flares attract Hollows, weak ones cower before captain-level pressure), cannibalism and
**merging into a Gillian**, leaders that command Gillians, retreat into rifts. Arrival systems: Garganta tears,
Kūmon sky cracks (Gillian fingers prying the sky open), rift-wrap retreat, Negación extraction pillars, sand
emergence, Hollow Bait events, Demi-Hollow transformation, Carrier disgorge, Calavera fruiting.

---

## 13. Maps

### 13.1 Map framework
`MapDef { id, name, voxelSize, bounds, seed, materials, lighting, sky, fog, weather, postGrade, music mood,
generate(), setPieces[], spawns[], storyHooks[] }`. Generation is deterministic per seed, runs in workers, and is
cached (IndexedDB) by `(map, seed, generator version)`:
1. **Layout** — 2D plan: roads/blocks/plazas (city), wall-maze graph (Seireitei), dune/rock fields (Hueco Mundo),
   floating islands (Soul King Palace).
2. **Terrain** — heightfield + strata (topsoil, earth, stone, bedrock) + noise; sand ripples; rock outcrops.
3. **Structures** — shape grammars: lot → building type → floors → facade modules (windows, balconies, signs,
   AC units, pipes) → roof (kawara tiles, onigawara ends, flat roofs with water tanks); **constructed like real
   buildings** (floor slabs, walls, columns, beams) so they break and collapse believably.
4. **Props** — rule-based placement + Poisson-disc scattering (utility poles + sagging wires, vending machines,
   lanterns, benches, bicycles, cars, quartz trees, barrels…), as voxel objects that can be knocked around.
5. **Set pieces** — hand-coded landmark builders (Kurosaki Clinic, Urahara Shop, Senzaikyū, Sōkyoku halberd,
   Las Noches dome, the four transfer pillars of Fake Karakura, Silbern's palace).
6. **Weathering pass** — dirt gradients near the ground, moss, cracks, sun-bleaching, puddles.
7. **Bake** — chunks, voxel colliders, spawn points, coarse nav height grid, light probes.

Beyond the playable bounds: low-resolution backdrop rings (skylines, mountains, dunes, the Seireitei skyline)
and a soft "reishi barrier" boundary with a visual shimmer.

<!-- MAP_LIST_SECTION -->

---

## 14. Modes, UI & game flow

### 14.1 Flow
Boot (fonts, Rapier WASM, worker pool) → Title (live voxel diorama: Sōkyoku Hill at dusk) → Main menu
(Free Battle, Story Arcs, Versus, Hollow Horde, Boss Rush, Training Ground, Gallery/Photo, Settings) →
Character select → Map select → Battle setup → Battle → Results (stats, destruction %, replay highlights).

### 14.2 Character select
Grid by faction with **live-rendered voxel portraits** (rendered once at startup to a texture atlas), form
carousel (each form shown on the turntable model), move list per form, alt costumes (pre-/post-timeskip, TYBW,
Hell arc), "random", team slots. Everything unlocked from the start.

### 14.3 HUD
Bleach-styled (black/white brush strokes, kanji): HP + reiatsu bars, form name + kanji, 6 slot icons with
cooldowns and costs, ultimate meter, lock-on target panel, combo counter, callout layer, teammate portraits,
mini status icons. Toggle for minimal HUD.

### 14.4 Settings
Graphics presets (Low/Med/High/Ultra: shadows, AO, bloom, draw/LOD distance, resolution scale, debris &
fragment caps, VFX density, outline/manga mode), controls (rebinding, sensitivity, invert, auto-lock), audio
buses, accessibility (screen-shake scale, flash reduction, colour-blind safe telegraphs), performance overlay.

---

## 15. Audio

- **Procedural SFX** (Web Audio synthesis, cached variations): blade swing whoosh, metal clash ring (inharmonic
  partials), flesh/blunt impacts, material-specific breaking (concrete crunch, wood snap, glass shatter, ice
  tinkle, sand hiss), explosions with sub-bass, crumbling (granular noise), energy charge hums, Getsuga roar,
  Cero beam, Kidō chimes/thunder, Shunpo "shun", Sonído static, Hirenkyaku airy chime, reiatsu flare rumble,
  Menos growl, Garganta tear.
- Spatial audio (HRTF panners), per-map convolution reverb (generated IRs), ducking on huge hits, slow-mo pitch.
- **Music:** procedural battle-intensity layers (drums/bass/pads) + **"load your own music"** (local files,
  per-mode playlists) so players can use their own Bleach OST copies.

---

## 16. Skills & tooling

### 16.1 `voxel-art` skill (requested) — `.claude/skills/voxel-art/`
Purpose: make me consistently produce **high-quality, highly detailed voxel models, buildings, props, terrain and
VFX** for this game, and review them critically.
```
.claude/skills/voxel-art/
├─ SKILL.md                    ← when to use; workflow; non-negotiable rules; review rubric
├─ references/
│  ├─ fundamentals.md          ← silhouette, scale, readability, detail density, noise budgeting
│  ├─ color-and-palettes.md    ← ramps (3–6 shades), hue-shifted shading, no pure black/white, AO interplay,
│  │                              material palettes (plaster, wood, kawara tiles, sand, quartz, bone, reishi)
│  ├─ characters.md            ← anime-voxel proportions at 48/m, faces (eyes 3–4 voxels), hair clumps,
│  │                              cloth folds by stepped voxels, joints that hide gaps, forms/costume layering
│  ├─ bleach-style-guide.md    ← shihakushō, haori (division kanji, hishigata hem), lieutenant badges,
│  │                              Arrancar uniforms/holes/mask fragments/number tattoos, Vandenreich coats,
│  │                              Hollow mask design language, Menos, Kidō/reiatsu colour table
│  ├─ architecture.md          ← Japanese houses, Karakura urban blocks, Seireitei walls/kawara roofs/onigawara,
│  │                              Las Noches, Wandenreich gothic-modernism; window/frame/eave/ledge detailing;
│  │                              interior hints; damage-friendly construction (floors, beams, shells)
│  ├─ terrain-and-nature.md    ← strata, erosion, sand ripples, rocks, trees (space colonisation), quartz trees
│  ├─ props.md                 ← vending machines, utility poles + wires, signs with pixel kanji, cars, lanterns
│  ├─ vfx.md                   ← voxel-native vs smooth energy effects, colour/bloom thresholds, readability
│  ├─ dsl.md                   ← the project's model DSL API & recipes (generated from source)
│  ├─ procedural-techniques.md ← SDF modelling (IQ distance functions), noise (value/simplex/worley), grammars
│  │                              for buildings, WFC for tile layouts, L-systems/space colonisation, Voronoi
│  └─ review-checklist.md      ← the rubric used on every screenshot
└─ scripts/
   ├─ render-model.mjs         ← turntable (front/back/left/right/¾/face close-up) PNG contact sheet
   ├─ render-scene.mjs         ← map/prop/VFX captures from fixed cameras
   └─ check-model.mjs          ← automated lint: floating voxels, holes, palette size, bounds vs height,
                                  symmetry diff, voxel/tri budgets
```
Workflow encoded in the skill: **reference** (dossier palette & look) → **block-out** (silhouette only, 1–2
colours) → **screenshot** → **form pass** (shapes, folds, hair clumps) → **colour pass** (ramps, hue shift, accents)
→ **detail pass** (trims, emblems, stitching, wear) → **lint + turntable** → **critique against rubric** →
iterate until the rubric passes; then in-game capture next to other characters for scale consistency.
Rubric highlights: recognisable from silhouette alone at 20 m; recognisable face at 2 m; palette ≤ ~24 colours
per character with ramps; no floating voxels; no noise soup; consistent scale; reads in both day and Hueco
Mundo night lighting.

### 16.2 `bleach-kit-design` skill
Turns a dossier into a playable kit: completeness table (every documented ability → slot/wheel/passive/"merged
into X"), input mapping per form, timeline sketches, destruction specs, VFX/SFX list, AI profile, callouts,
test plan. Output goes to `docs/kits/<id>.md` before any code.

### 16.3 `wiki-research` skill
How to use `tools/wiki/wiki_fetch.py` (MediaWiki API; HTML pages are bot-blocked), dossier format, paraphrase
rules, how to update `docs/roster` when canon (e.g. TYBW anime) adds material.

### 16.4 `visual-qa` skill
Playwright capture recipes (models, maps, VFX sequences as frame strips), headless flags
(`--use-angle=swiftshader --enable-unsafe-swiftshader`), how to read captures with the image reader, golden
images for regressions.

### 16.5 Dev pages (`src/dev/`)
Model viewer (turntable, parts, sockets, forms, palette, stats), pose editor, VFX lab, destruction playground,
map viewer with generator seeds, AI arena (bots vs bots), perf overlay (draw calls, tris, chunk queue,
fragments, debris, frame breakdown).

### 16.6 Repo hygiene
`CLAUDE.md` (commands, architecture rules, conventions), conventional commits, `npm run check` (typecheck +
lint + tests), screenshot artefacts kept out of git except curated ones in `docs/`.

---

## 17. Milestones

Each milestone ends with: tests green, `docs/roster/STATUS.md` updated, curated screenshots reviewed with the
`visual-qa` rubric, perf counters within budget, commit + push. No milestone waits for approval.

### M0 — Foundations, skills & tooling
- Scaffold: Vite 8 + TypeScript 7 + Vitest 5 + Playwright config; COOP/COEP headers (dev/preview) +
  `coi-serviceworker` for static hosting; scripts `dev`, `build`, `preview`, `test`, `bench`, `shots`, `check`.
- `CLAUDE.md` (architecture rules, commands, conventions).
- Skills: **`voxel-art`** (full references + scripts), `bleach-kit-design`, `wiki-research`, `visual-qa`.
- Screenshot harness (ported from the look-dev prototype), dev page shell, perf overlay skeleton.
- `docs/roster/STATUS.md` tracker seeded from the roster tables.
- **Done when:** `npm run check` green; `npm run shots` renders a dev scene to PNG; skills are discoverable.

### M1 — Voxel world core
- Chunk storage (+SAB path), material table + palette texture, edit log, 3D DDA raycast, overlap queries.
- Greedy + AO mesher workers (opaque/transparent/emissive streams), LOD meshing, remesh scheduler.
- `BatchedMesh` world renderer, voxel shader (palette shades, per-voxel hash, patterns, cracks), CSM sun, sky,
  fog, post stack, fly camera, carve-sphere debug tool.
- Test map: terrain + 30 generic buildings at 0.125 m.
- **Done when:** 160 m test map generates in < 5 s; sphere carve visible within ≤ 2 frames; mesher unit tests
  (face counts, AO, winding) and benches pass; draw calls < 50 for the world.

### M2 — Destruction & physics
- All `DamageShape` modes (§6.1), debris particles, Rapier world with chunk voxel colliders, structure worker,
  fragment extraction with atomic swap, slicing impulse, impact fracture, sleeping-fragment re-rasterisation,
  rubble deposition, restoration log, fire/ice/rot/absorb automata (basic).
- Destruction playground dev page (cut / smash / bore / explode / freeze / burn / absorb / restore tools).
- **Done when:** a diagonal cut through a 30 m tower makes the top slide, topple, hit the street and fracture;
  200 fragments + 15k debris stay within budget; structure search < 30 ms for a 500k-voxel building (worker);
  no holes or flicker during swaps; restore brings a flattened block back.

### M3 — Character foundation
- Model DSL + generators (body, face, hair, cloth, weapons, Hollow creatures, masks), rigid-skinned mesh
  builder, sockets; skeleton, clips, layers, foot IK, spring bones, smears; kinematic controller (ground,
  air-step, flight, Shunpo blink); camera (orbit, lock-on, dither occlusion); input (KB/M, gamepad, rebinding).
- **Ichigo** model: Substitute Shinigami, Shikai, Bankai, Hollow-mask variants — passes the voxel-art rubric.
- **Done when:** running, jumping, air-stepping and Shunpo across the test city feels snappy; turntables pass.

### M4 — Combat core
- Hit/hurtboxes, damage pipeline, reactions, guard/parry/blade lock/beam struggle, hitstop/shake/slow-mo,
  knockback-carving, ability framework + effect primitives, VFX system (trails, crescents, beams, blasts, auras,
  dust, debris), callouts, HUD v1, status effects, reiatsu flare & crush.
- Foundations the roster research showed everyone needs: **body system v1** (per-part hurtboxes, breakable
  sub-parts such as masks/horns, Hollow holes as real holes, limb sever), **weapon tether/recall** (Zangetsu's
  cloth throw), **timed states** (mask timer + mask HP + lockout), **perception layer** skeleton (§4.5),
  element tags + temperature overlay hooks, death router (purify / annihilate / dissolve).
- Ichigo kit (K2 Shikai, K3 Bankai + Hollow mask, K8a takeover), 3 Hollow archetypes (T1) with reiatsu-radar AI.
- **Done when:** 1 vs 10 Hollows is fun; Getsuga leaves crescent canyons and cuts houses; Getsuga vs Cero
  beam struggle works.

### M5 — Vertical slice: "Karakura Night"
- Karakura Town generator v1 (residential/commercial blocks, Kurosaki Clinic, Urahara Shop, river + bridge,
  park, Karakura High), props, dusk/night lighting; a **Gillian prying the sky open (Kūmon)** as the boss, plus a
  Hollow Bait wave event; Ichigo K0 human body + soul ejection; Bankai release cinematic; procedural SFX v1;
  title/select/settings menus; Free Battle mode.
- **Done when:** a 10-minute session feels like a Bleach episode; Playwright smoke run has zero console errors;
  screenshot set reviewed.

### M6 — Wave 1: Soul Society arc
- Rukia, Renji, Byakuya, Kenpachi, Uryū, Chad, Orihime, Yoruichi, Urahara (+ Ganju, Jidanbō as giant NPC,
  Hanatarō support NPC).
- Kidō system (wheel by number, incantation & double incantation, Eishōhaki) with the full catalogue from
  `docs/lore/mechanics.md`; Seireitei map (wall maze, barracks, Senzaikyū, Sōkyoku Hill + halberd, gates);
  Versus & Team modes, tag-swap; Story Arcs v1 (Agent of the Shinigami + Soul Society stages).

### M7 — Wave 2: Captains & Espada (Arrancar → Fake Karakura)
- Captains: Yamamoto, Suì-Fēng, Gin, Unohana, Aizen (every stage), Komamura, Kyōraku, Tōsen, Hitsugaya,
  Mayuri, Ukitake.
- Espada & co: Grimmjow, Ulquiorra, Nnoitra, Starrk + Lilynette, Baraggan, Harribel, Yammy, Szayelaporro,
  Zommari, Aaroniero, Nelliel, Wonderweiss, Luppi, Ggio, Dordoni, Cirucci, Gantenbainne, Grand Fisher.
- Maps: Hueco Mundo desert (+ Menos Forest), Las Noches (exterior, dome rooftop, interior), Fake Karakura Town.
- Modes: Hollow Horde, Boss Rush v1, Story Arcs (Arrancar, Hueco Mundo, Fake Karakura).

### M8 — Wave 3: Visored, lieutenants, Fullbringers, family
- Visored (Shinji, Kensei, Mashiro, Lisa, Rose, Love, Hachi, Hiyori); lieutenants & 11th Division (Ikkaku,
  Yumichika, Hisagi, Kira, Rangiku, Hinamori, Sasakibe, Ōmaeda, Nanao, Nemu, Yachiru, Isane, Iba);
  Fullbringers (Ginjō, Tsukishima, Riruka, Yukio, Giriko, Jackie, Moe); Isshin, Kon, Kaien, Kūkaku, Tessai;
  Ichigo Fullbring forms.
- Maps: Urahara's underground training ground (Training mode home), Rukongai, Xcution hideout.

### M9 — Wave 4: Thousand-Year Blood War
- Yhwach (every stage), Haschwalth, Gerard, Lille Barro, Pernida, Askin, and the Sternritter (Bazz-B, Äs Nödt,
  Bambietta, Cang Du, Quilge, Gremmy, Mask, NaNaNa, Driscoll, BG9, PePe, Candice, Liltotto, Giselle, Meninas,
  Royd/Loyd, Berenice, Jerome, Nianzol, …); Squad Zero (Ichibē, Nimaiya, Hikifune, Kirinji, Senjumaru).
- TYBW variants of existing characters (Ichigo true Shikai/Bankai, Uryū Antithesis, Renji Sōō Zabimaru,
  Rukia Hakka no Togame, Kenpachi Nozarashi/Bankai, Byakuya, Yamamoto Zanka no Tachi, Kyōraku Bankai,
  Mayuri's new Bankai, Ukitake Mimihagi, Komamura's human/werewolf form, adult Hitsugaya).
- Medallion Bankai-theft system; maps: Silbern/Wahrwelt, Soul King Palace, "invaded Seireitei" variant.

### M10 — Wave 5 & polish
- Hell arc (Kushanāda, Togabito, Hell map), remaining cameos, Photo mode, gallery, local split-screen
  (stretch), adaptive quality, accessibility pass, final art QA on every model, performance pass.

---

## 18. Performance budgets, testing & QA

### 18.1 Budgets ("High" preset, 1080p, mid-range desktop GPU)
| Metric | Budget |
|---|---|
| Frame | 16.6 ms (60 fps); main-thread sim ≤ 6 ms, render submission ≤ 4 ms |
| Draw calls | ≤ 300 (world ≈ 3–6 via `BatchedMesh`, characters 1–3 each, VFX instanced) |
| Visible triangles | ≤ 3 M (Low: ≤ 1 M with earlier LOD, AO off, 0.75 resolution scale) |
| Remesh throughput | ≥ 200 chunks/s across workers; carve-to-visible ≤ 2 frames |
| Structure search | ≤ 30 ms for a 500k-voxel component (worker) |
| Active fragments / debris | 300 / 20k (Low: 100 / 5k) |
| Characters on screen | 12 full fighters + 60 Hollow-class enemies |
| Memory | ≤ 1 GB tab total on the largest map; voxel data ≤ 200 MB |
| Map load | ≤ 6 s (workers + cache) |

Adaptive quality: if frame time exceeds budget for 2 s, step down resolution scale → debris caps → AO → shadows.
Perf overlay always available (F3).

### 18.2 Testing
- **Unit (Vitest, Node):** mesher (face counts, AO, winding), DDA, carve/slice shapes, connectivity & fragment
  extraction, material rules, damage formula & defence thresholds, ability timeline execution, form transitions,
  input mapping, generator determinism (output hashes).
- **Benches:** mesher chunks/s, structure search, carve ops, debris step, model build time.
- **Headless sim tests:** bot-vs-bot fights for N seconds per character (no exceptions, no NaN, invariants hold).
- **Playwright smoke:** load each mode/map/character, run scripted inputs for 300 frames, assert no console errors.
- **Visual QA:** deterministic capture mode (fixed seed, paused sim, fixed cameras); reviewed with the rubric; a
  curated set kept in `docs/` as regression references. (Headless GPU is SwiftShader ≈ 1 fps: captures are for
  looks; perf is judged from CPU timings and counts.)

---

## 19. Decision log, risks & IP notes

### 19.1 Decisions (made; don't re-litigate without new evidence)
| # | Decision | Why |
|---|---|---|
| D1 | `WebGLRenderer` (WebGL2), not `WebGPURenderer` | Mature, post libs verified, works headless for my screenshot loop. Revisit at M10. |
| D2 | World 0.125 m, props 16–24/m, characters 48/m | Look-dev comparisons (`docs/research/lookdev/01–04`): 0.25 m world reads as Minecraft; at 32/m character eyes vanish, at 48/m they read. |
| D2b | Faces/emblems authored as voxel-space pixel art; hair from connected clumps | Rasterising tiny metric features is unreliable; naive spikes left floating voxels (`04`). |
| D3 | Greedy meshing + vertex AO (not raymarching) | Integrates with three's lighting, shadows, post; proven in look-dev. |
| D4 | `BatchedMesh` for chunks | Thousands of chunks in a handful of multi-draw calls (`WEBGL_multi_draw` available, even in SwiftShader). |
| D5 | Rapier 0.21 voxel colliders + custom debris particles | Native voxel shapes for chunks/fragments; particles too numerous for rigid bodies. |
| D6 | Sim/render split, TypeScript, Vite, Preact UI | Headless tests and benches; fast iteration. |
| D7 | Code-first voxel modelling (DSL) + screenshot critique | I can't drive MagicaVoxel; code is parametric (forms, costumes, variants) and reviewable. |
| D8 | No copyrighted assets | Procedural audio, OFL fonts, original voxel models; wiki text paraphrased with source links. |
| D9 | Everything unlocked from the start | Fun first; no grind. |
| D10 | Story = curated canon battles, not cutscene retellings | Spend effort on gameplay. |
| D11 | English UI, Japanese technique names + kanji callouts | Authentic flavour, readable. |
| D12 | Desktop-first (KB/M + gamepad) | Combat depth needs it. |
| D13 | Static hosting + `coi-serviceworker` | SharedArrayBuffer without server config. |
| D14 | Tone mapping Neutral/ACES + LUTs, not AgX | AgX desaturated the anime palette in look-dev. |
| D15 | Subtle face-edge shading only | Strong per-voxel grid lines read as tiles, not voxel art. |

### 19.2 Risks & mitigations
| Risk | Mitigation |
|---|---|
| 0.125 m worlds too heavy in JS | LOD meshing, `BatchedMesh`, worker pool, SAB, uniform-chunk compression, per-map 0.25 m fallback, early benches (M1/M2). |
| Physics cost of many voxel colliders | Bulk rebuild thresholds, fragment caps, re-rasterising sleeping fragments, profiling in M2. |
| ~100 characters is a lot of content | Shared generators, archetype animation libraries, primitive-based abilities, kit-design skill, wave plan, STATUS tracker. |
| Rigid-part animation looks stiff | Strong key poses, spring bones, smears/afterimages, heavy VFX, camera work. |
| Rule-bending powers frustrate | Clear tells, short durations, counterplay, accessibility toggles (e.g. "Sakanade: visual-only inversion"). |
| Can't measure GPU fps here | CPU timings + counts in CI; in-game perf overlay; adaptive quality. |
| SAB/COOP/COEP hosting quirks | `coi-serviceworker`; copy-based fallback path. |
| Headless captures are slow | Deterministic capture mode, small contact sheets, only review what changed. |

### 19.3 IP note
*Bleach* © Tite Kubo / Shueisha and the respective anime rights holders. This is a non-commercial fan project:
no official art, audio, logos or text are used; all models, effects and sounds are made from scratch.
Character research is summarised from the Bleach Wiki (bleach.fandom.com, CC BY-SA) in my own words, with
source links in each dossier.
