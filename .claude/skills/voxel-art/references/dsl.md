# Model DSL (`src/models`)

Models are TypeScript functions that drive a `ModelBuilder` (`src/models/builder.ts`). Work in **voxel units**
of the model resolution (48/m for characters, 24/m for lesser Hollows, 4/m for Menos) and keep metres for
gameplay code. The model faces **+Z**, **+X is the character's left**, and the mirror plane is x = 0. Voxel
(i,j,k) has its centre at (i+.5, j+.5, k+.5), so put shape boundaries on integers to avoid half-filled rows.

## Building blocks
```ts
const b = new ModelBuilder('name', 48);
b.mat('hair', ['#FFC867', ..., '#8F3E13'], { base: 2, rough: 0.65, shadeK: 0.85, dither: 0.1, glow: 0 });
b.bone('hips', 'root', [0, 45, 0]);            // pivot in voxels; parents first
b.boneSym('upperarm.L', 'shoulder.L', [9.5, 66.5, -0.5]); // also creates the mirrored .R bone
b.socket('grip.R', 'fist.R', [x, y, z], [rx, ry, rz]);    // weapons, masks, emitters
b.add(bone, sdf, mat, { mirror, shade: 'auto' | 'flat' | rampIndex, thr, only: 'empty' });
b.carve(bone | bones[] | '*', sdf, { mirror });
b.paint(bone | bones[], sdf, mat, { where: b.isMat('black'), shade });
b.stamp('head', x0, yTop, rows, legend, zFrom);  // pixel-art faces on the front plate
b.voxel(bone, x, y, z, mat, shade); b.fill(...)
b.surfaceVoxels(bones, min, max, cb)              // custom surface decals (e.g. the kite-link strap)
b.autoShade(); b.lint(); const model = b.build();
```
- **Ramps run light → dark.** `base` is the main tone. `autoShade()` picks shades from the union's surface
  normal (up = lighter) and openness (creases darker, convex edges lighter). Explicit shades and stamps are
  locked and skipped by it.
- Each bone has its **own grid**, so parts can overlap. Give the parent the full joint ball and the child a
  ball one voxel smaller. The mesher removes duplicate *surface* voxels between bones.
- `lint()` deletes islands smaller than 4 voxels and warns about bigger floating ones (check `b.warnings`).

## Shapes (`src/models/sdf.ts`)
`sphere`, `ellipsoid(c, r, rot)`, `box(c, half, {rot, round})`, `aabb(min, max)`, `capsule(a, b, ra, rb)`
(tapered), `cylinder(a, b, r, r1, round)`, `torus`, `prism(poly2D, origin, u, v, halfDepth)` (blades, guards),
`tube(points, radii)`, `spike(base, dir, len, ra, rb, {side, bend, taper, tip})` (hair, horns, claws, teeth),
`halfSpace`, `fn(d, min, max)` (custom), and the operators `union`, `blend(k, …)`, `intersect`, `subtract`,
`offset`, `shell`, `scale`, `rotate`, `mirrorX`, `displace`. Only the sign matters for rasterisation, plus
magnitudes for `blend`/`offset`. Use `thr: 0.3` on thin features (tips, straps) so they survive.

## Humanoid kit (`src/chars/humanoid.ts`)
`SPEC_ADULT_MALE` landmarks · `humanoidSkeleton(b, spec, {sleeves, hakama})` · `head` (flat face plate, tapered
jaw) · `faceLegend` for the characters.md templates · `hands` (palm and fist variants with a grip channel along
Z) · `feet` (tabi + waraji) · `kosodeTorso` (returns the torso SDF; V collar left-over-right) ·
`kosodeSleeves` (bag on the `sleeve.*` spring bones) · `obi` · `hakama` (lower panels on `hakama.*` springs) ·
`spikeHair(b, L, mat, spikes, bangs, {tufts})` · `shihakushoSprings()`.

## Turning a model into a character
`new CharacterVisual(model, springs, colliders)` (`src/game/characterFactory.ts`) builds the rig and the
rigid-skinned mesh with the palette material. `attach(key, propModel, socket)` adds weapons. Geometry is
cached per model name; cache `CharacterAsset`s for form swaps (`ichigoAsset`). Review the model in the viewer:
`/?mode=model&char=…&view=three|front|face|back|side`.
