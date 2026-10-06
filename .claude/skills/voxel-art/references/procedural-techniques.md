# Procedural techniques

Generators work **in metres** and rasterise at the target density (PLAN §5.1: resolution is a parameter, not a
rewrite). Everything here must be deterministic (seeded) and runnable headless in Node/workers (PLAN §3.2
architecture rule). Formulas follow Inigo Quilez's distance-function articles (iquilezles.org), written out so you do
not need to look them up.

Pipeline: shape (SDF / grammar / L-system) → bounds → evaluate per brick and voxel → material & paint masks →
connectivity and thickness clean-up → lint → mesh.

---

## 1. SDF basics
A signed distance function `d(p)` is negative inside, positive outside, and (for exact SDFs) equals the Euclidean
distance to the surface. Evaluate in the part's local frame. Notation: `length`, `dot`, `abs`, `max`, `min`,
`clamp(x, lo, hi)`, `mix(a, b, t) = a + (b − a)t`, `dot2(v) = dot(v, v)`.

## 2. Primitives

| Primitive | Formula | Notes |
|---|---|---|
| Sphere (radius s) | `length(p) − s` | exact |
| Box (half-extents b) | `q = abs(p) − b; length(max(q, 0)) + min(max(q.x, max(q.y, q.z)), 0)` | exact |
| Round box (half-extents b incl. rounding, radius r) | `q = abs(p) − b + r; length(max(q, 0)) + min(max(q.x, max(q.y, q.z)), 0) − r` | heads, torsos, crates, vending machines |
| Ellipsoid (radii r) | `k0 = length(p / r); k1 = length(p / (r·r)); k0·(k0 − 1) / k1` | bound, not exact - fine for rasterising |
| Capsule / segment a→b (radius r) | `pa = p − a; ba = b − a; h = clamp(dot(pa, ba) / dot(ba, ba), 0, 1); length(pa − ba·h) − r` | limbs, hair clumps, branches, poles |
| Tapered capsule (round cone, r1 at origin, r2 at y = h) | `b = (r1 − r2)/h; a = sqrt(1 − b²); q = (length(p.xz), p.y); k = dot(q, (−b, a)); if k < 0: length(q) − r1; if k > a·h: length(q − (0, h)) − r2; else dot(q, (a, b)) − r1` | limbs and hair tapering to a tip |
| Capped cylinder (vertical, radius r, half-height h) | `d = abs((length(p.xz), p.y)) − (r, h); min(max(d.x, d.y), 0) + length(max(d, 0))` | columns, barrels, poles |
| Capped cone (r1 at y = −h, r2 at y = +h) | `q = (length(p.xz), p.y); k1 = (r2, h); k2 = (r2 − r1, 2h); ca = (q.x − min(q.x, q.y < 0 ? r1 : r2), abs(q.y) − h); cb = q − k1 + k2·clamp(dot(k1 − q, k2)/dot2(k2), 0, 1); s = (cb.x < 0 && ca.y < 0) ? −1 : 1; s·sqrt(min(dot2(ca), dot2(cb)))` | hakama legs, horns, spikes, towers |
| Torus (major R, minor r) | `q = (length(p.xz) − R, p.y); length(q) − r` | rings, Gōkei-style ring constructs, halos |
| Plane (unit normal n, offset h) | `dot(p, n) + h` | cuts, roofs (intersect two planes for a gable) |
| Extrusion of a 2D SDF f (half-depth h) | `d = f(p.xy); w = (d, abs(p.z) − h); min(max(w.x, w.y), 0) + length(max(w, 0))` | footprints, lozenges, glyph plates, blades |
| Revolution (lathe) of a 2D SDF f (offset o) | `q = (length(p.xz) − o, p.y); f(q)` | lanterns, vases, bells, domes |
| Bézier / spline tube | sample the curve into short segments, union of capsules with a radius profile | hair strands, tails, scarves, wires |

2D helpers for extrusion: circle `length(p) − r`; 2D box `q = abs(p) − b; length(max(q, 0)) + min(max(q.x, q.y), 0)`;
segment as the capsule formula in 2D; rhombus/lozenge = intersect two rotated half-planes or use IQ's `sdRhombus`.

## 3. Operations

| Operation | Formula | Use |
|---|---|---|
| Union | `min(d1, d2)` | |
| Subtraction (d2 minus d1) | `max(−d1, d2)` | windows, holes, the Hollow hole |
| Intersection | `max(d1, d2)` | trimming, gables |
| Smooth union | `h = clamp(0.5 + 0.5(d2 − d1)/k, 0, 1); mix(d2, d1, h) − k·h(1 − h)` | organic joins (muscle, Hollow bodies), k ≈ 2-6 voxels |
| Smooth subtraction | `h = clamp(0.5 − 0.5(d2 + d1)/k, 0, 1); mix(d2, −d1, h) + k·h(1 − h)` | soft carved sockets, eye holes |
| Smooth intersection | `h = clamp(0.5 − 0.5(d2 − d1)/k, 0, 1); mix(d2, d1, h) + k·h(1 − h)` | rounded trims |
| Round | `d − r` | inflate (aura shells, clothing thickness) |
| Onion / shell | `abs(d) − t` | walls, domes, open garments, Las Noches shell |
| Elongate | `q = p − clamp(p, −h, h); d(q)` | stretch a sphere into a pill without distortion |
| Mirror | `p.x = abs(p.x)` | bilateral symmetry (prefer index mirroring after rasterising, §4) |
| Repeat | `q = p − s·round(p / s)` | columns, balusters, tiles, pleats |
| Limited repeat | `q = p − s·clamp(round(p / s), −l, l)` | n windows per floor, n pleats |
| Twist / bend | rotate `p.xz` by `k·p.y` (twist) or `p.xy` by `k·p.x` (bend) | horns, hair, tails - not Lipschitz: sample conservatively |
| Displacement | `d + amp·noise(p)` | rocks, bark, eroded crater rims - no longer exact; keep `amp` small or add a safety threshold |

Smooth `k` and every offset are in metres in the generator; convert to voxels mentally (48/m: 2 vox ≈ 4 cm;
8/m: 2 vox = 25 cm).

## 4. Rasterising into voxels without losing thin features
- **Centre sampling:** voxel `(i, j, k)` is solid if `d(centre) ≤ τ`, centre = `((i, j, k) + 0.5) · vs` in the part's
  frame. With `τ = 0` features thinner than one voxel vanish or alias.
- **Conservative threshold:** `τ = 0.5·vs` (face-touch) or `≈ 0.87·vs` (corner-touch) keeps thin features but
  fattens everything by up to half a voxel - apply it **per primitive** (blades, hair tips, wires, crossarms), not
  globally.
- **Supersampling:** 2×2×2 or 3×3×3 sub-samples; solid if coverage ≥ 1/8 for thin primitives, ≥ 1/2 for bulk. The
  coverage value also picks anti-aliased paint shades on painted lines (`fundamentals.md` §6).
- **Author thin things in voxel space:** strokes, cracks, hair strand lines, 1-voxel accents and voxel wires use a
  3D DDA (Amanatides-Woo) or 3D Bresenham that steps **one axis at a time** so the line is 6-connected.
- **Faces, glyphs, emblems:** stamp pixel-art grids, never rasterise metric shapes (D2b).
- **Parity and symmetry:** pick the mirror plane first - on a voxel boundary (even width) or through voxel centres
  (odd width). Rasterise one half and **mirror by index** (`x' = W − 1 − x`), so floating-point noise cannot make the
  halves differ.
- **Pivots** snap to the voxel grid (whole or half voxel, consistent per model); rasterise each part in its own frame
  so rotations stay clean.
- **Connectivity clean-up:** label components with 6-connectivity (BFS or union-find); keep the component attached to
  the part root; reattach or regenerate islands (never silently delete a hair clump); report voxels that touch the
  rest only by an edge or corner - they look attached in one view and floating in another.
- **Thickness check:** flag voxels with empty neighbours on both sides along an axis (1-voxel-thin) outside the
  allowed accent masks.
- **Brick culling:** evaluate `d` at each 8³ brick centre; if `|d| >` the brick's half-diagonal the whole brick is
  uniform (solid or air) - skip per-voxel work and store it as a uniform brick (PLAN §5.2).

## 5. Noise for structured variation

Deterministic integer hash (murmur3 finaliser style) - the base of everything random:

```ts
export function hash3(x: number, y: number, z: number, seed = 0): number {
  let h = (seed ^ Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(z | 0, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296; // [0, 1)
}
```

| Noise | Construction | Typical use |
|---|---|---|
| Value noise | hash at lattice points, quintic fade `6t⁵ − 15t⁴ + 10t³`, trilinear blend | cheap masks, patch variation |
| Gradient (Perlin) / simplex | random gradients at lattice points (simplex: fewer directional artefacts, cheaper in 3D) | terrain, rock displacement, cloth wobble |
| Worley / cellular | distance to nearest feature points: F1 (cells, pebbles), F2 − F1 (cracks, cell borders), cell id (per-cell shade) | stone blocks, cracked ground, scales, crystal facets |
| fBm | `Σ gainⁱ · noise(p · lacunarityⁱ)`, 3-6 octaves, lacunarity ≈ 2, gain ≈ 0.5 | terrain, clouds |
| Ridged | `Σ wᵢ (1 − abs(noiseᵢ))²` (multifractal: weight each octave by the previous) | crests, crags, mountain ridges |
| Domain warp | `f(p + A·(n(p + o1), n(p + o2), n(p + o3)))` | strata wobble, natural dune/cliff lines |

Turning noise into *structured* variation (never raw per-voxel colour):
- **Posterise:** `index = floor(n · k)` into k = 2-3 ramp steps; wavelength ≥ 6-8 voxels so patches are shapes.
- **Meaningful gradients:** grime toward the ground `mask = clamp((y0 − y)/band + 0.3·n, 0, 1)`; sun bleaching on
  up-facing faces; soot above openings; moss on north/up faces.
- **Streaks:** anisotropic noise (one axis scaled ×4-8) for rust and water stains under metal and ledges.
- **Edge wear / crevice dirt:** convexity from neighbour counts (≥ 3 empty neighbours = convex edge → lighter;
  ≥ 3 solid diagonal neighbours = crevice → darker).
- **Thresholded masks with clusters** for accents (flowers, pebbles, stains) - cluster 3-7, cover ≤ 2-5 %.

## 6. Shape grammars for buildings
A split grammar in the spirit of CGA: rules rewrite labelled boxes until terminals (members, modules, props).

```
Lot        → Extrude(h_storeys) → Comp(faces){ front: Facade | side: SideFacade | top: Roof }
Facade     → Split(y){ GroundFloor(3.0 m) | Repeat(Floor, 3.0 m) | Parapet(0.6 m) }
Floor      → Split(x){ Edge(0.6 m) | Repeat(Tile, 2.4 m) | Edge(0.6 m) }
Tile       → Split(x){ Wall(~) | Window(1.7 m) | Wall(~) }   // ~ = flexible size
Window     → Frame(1 vox) + Glass(inset 1 vox) + Sill(1 vox proud) + [Balcony? p=0.4 above ground]
Roof       → Gable(25°, overhang 0.75 m) | Hip | Flat(+WaterTank p=0.5)
```

- Output **semantic labels** for every voxel (slab, column, wall, beam, roof, stair, window, prop socket) so
  materials, collapse members and prop placement (AC units, signs, lights) come for free.
- Seeds: `seed = hash(mapSeed, lotId)`; each rule draws from its lot's stream so editing one lot does not reshuffle
  the city.
- Constraints: doors face the street; windows ≥ 2 voxels apart; balconies only above the ground floor; signs on
  shop-houses only; no module may float (every module attaches to a member).
- Archetype grammars to write: Karakura detached house, apāto, RC mansion, shop-house; Seireitei wall segment
  (plinth → plaster → coping, pilasters by `Repeat(4-6 m)`), compound hall (platform → column grid → engawa →
  irimoya roof); Wandenreich block (base slab → shaft with window bands → crown with buttress fins and cross relief).

## 7. Layout algorithms
- **Spanning-tree mazes** (Seireitei alleys, locations §7.1): rasterise free space to a 6 m grid, run Wilson's
  algorithm (uniform spanning tree) or Kruskal with random weights, add 10-15 % extra edges for loops, keep ~50 % of
  dead ends; walls follow every grid edge that is not a passage.
- **Wave Function Collapse** for small tile layouts (courtyard tiles, roof-scape patterns, facade module
  arrangements): tiles + adjacency rules, collapse the lowest-entropy cell (seeded tie-break), propagate, restart on
  contradiction. Keep WFC regions small (≤ 64×64 cells) and validate the result (paths connected, no orphans).
- **Road and lot layout:** perturbed grids (±8° jitter) and splines that follow rivers; recursive oriented-bounding-
  box splitting of blocks into lots (frontage 8-12 m, depth 12-18 m).

## 8. Poisson-disc scattering (Bridson 2007)
1. Background grid with cell size `r / √2` (each cell holds at most one sample).
2. Start from a random point; keep an active list.
3. For an active point, try `k = 30` candidates uniformly in the annulus `[r, 2r]`; accept a candidate if no sample
   lies within `r` (check the 5×5 neighbouring cells); otherwise, after k failures, retire the point.
4. Variable density: `r(x)` from a density map (noise × slope × distance to roads); size the grid by `r_min` and test
   pairs against `max(r_a, r_b)`.
5. Reject by masks (roads, buildings, water); seed per map region for determinism.

Uses: rocks, trees, quartz groves, props along streets (with rule-based offsets), Hollow spawn points, debris piles.
For very large counts a jittered grid is a cheaper approximation.

## 9. Trees: space colonisation and L-systems
**Space colonisation (Runions et al. 2007):**
1. Scatter 200-1000 attraction points inside the crown envelope (ellipsoid, cone, umbrella).
2. Start from the trunk top node.
3. Each step: every attractor picks its nearest node within the influence distance `d_i`; every node with attractors
   grows a child at `node + D · normalize(Σ normalize(a − node) + tropism)`; attractors within the kill distance `d_k`
   of any node are removed.
4. Stop when attractors are gone or growth stalls.
5. Radii by the pipe model: tips `r0`; parent `r = (Σ r_childⁿ)^(1/n)`, n ≈ 2-3.

At 0.125 m: `D` = 0.25-0.5 m (2-4 vox), `d_i` = 2-4 m, `d_k` = 0.5-1 m. Rasterise branches as tapered capsules;
branches thinner than 2 voxels become leaf-cluster connectors only; place leaf clusters at tips (`terrain-and-nature.md`
§6).

**L-systems** for stylised forms: axiom `F`, rule `F → F[+F]F[−F][F]` with 20-30° angles and length decay 0.7,
interpreted by a 3D turtle (yaw/pitch/roll) with random jitter. Dead trees: 2-3 iterations, no leaves, 2-3 kinks.
Bamboo: straight segments with node markers. Pines: whorls of near-horizontal branches carrying flat pad clusters.
Quartz trees (`terrain-and-nature.md` §7): a grammar of prism segments with 15-40° kinks and 2-4 branches per node.

## 10. Voronoi fracture
- Seeds: K points inside the fragment, biased toward the impact (density ∝ 1/(d + ε)²); K from impact energy and
  fragment size.
- Assign each voxel to the nearest seed (perturb distances with low-frequency noise for jagged faces).
- Each cell becomes a fragment; split cells that are not 6-connected; cells below a minimum size become debris
  particles.
- Pre-fracture brittle props offline (glass panes, ice constructs, quartz) so runtime only picks pieces.
- Seed the fracture from the event id so replays and restoration are deterministic.

## 11. Determinism, caching, performance
- RNG streams per purpose (sim, vfx, generation; PLAN §4.1). Prefer **counter-based** randomness (`hash3(x, y, z,
  seed)`) over sequential generators so results do not depend on iteration order; use mulberry32/sfc32 when you need a
  sequence.
- Cache generated models and maps by content hash of `(generator id, version, seed, params)` (PLAN §9.1, §13.1).
- Run generators in workers on typed arrays with flat loops; cull with bounds and brick tests; avoid per-voxel
  closures and object allocation.
- Unit-test generators headlessly: output hash stability per seed, voxel counts, connectivity, bounds vs spec.
