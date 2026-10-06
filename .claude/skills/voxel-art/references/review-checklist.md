# Review checklist - the rubric for every screenshot

Apply this to every asset before it is called done, and to every change that touches looks. Read the PNGs with the
image reader and judge what you **see**; when in doubt, render another angle. Be harsh: the goal is the best voxel
art in a browser game, and Bleach fans know these characters by heart.

## 0. How to run a review

**Inputs:** the model brief (`SKILL.md` §2 step 1), the dossier/locations section, and these captures (planned
`scripts/render-model.mjs` / `render-scene.mjs`, or the look-dev-based Playwright fallback):

| Capture | Settings |
|---|---|
| Turntable | front, back, left, right, ¾ front, ¾ back - `studio` preset, ~512 px each, contact sheet |
| Silhouette | flat black on white, front and ¾, scaled so the asset is ~80 px tall (20 m equivalent) and ~200 px |
| Gameplay distance | in-scene, camera at 20 m (engine camera: 62° vertical FOV, 1920×1080; at 1280×720 every size is ÷1.5) |
| Close-up | face/emblem at 2 m (head ≈ 110 px tall at 1080p) |
| Lighting set | `karakura_afternoon`, `seireitei_noon`, `hm_night` (+ `karakura_dusk` for VFX); name the engine `Atmosphere` used when a preset does not exist yet (`fundamentals.md` §9) |
| Poses (rigged models) | T, A, deep lunge, overhead two-handed swing, high kick, crouch |
| Lineup | next to the Ichigo reference and 2-3 similar characters/assets |
| World assets | + collapse test frames (before/after diagonal `cut`, column removal, Cero `bore`, fire) |

**Severity:** **blocker** (wrong identity, floating/holes, wrong scale, canon error, crash in lint) → must fix;
**major** (readability, palette, rig gaps, noise soup, budget) → fix before done; **minor** (polish) → may ship if
listed in the brief.

**Order:** A → C → E first (identity, scale, integrity are cheap to check and expensive to fix late), then B, D, F,
G, H, I, J, K.

---

## A. Silhouette and identity (20 m)
- [ ] **A1 Silhouette lineup** - Pass: the flat-black shape is nameable among 3+ similar assets, front and ¾; at
  least 2 of the dossier's silhouette keys are visible. *Fixes:* exaggerate hair mass/weapon/coat flare/mask horns by
  10-30 %; open negative space (arm-torso gap ≥ 2 voxels at the waist); move the weapon to break the outline.
- [ ] **A2 Colour blocks** - Pass: downsampled 8× (or blurred), the 2-3 dominant colour masses still identify it.
  *Fixes:* merge small competing colour areas; push the identity colour (hair, haori, mask) to a larger area.
- [ ] **A3 Value read** - Pass: greyscale screenshot keeps key masses ≥ 0.15 L apart (face vs hair, mask vs body,
  haori vs kosode). *Fixes:* shift ramp bases, not hues.
- [ ] **A4 Tangents and clutter** - Pass: no shapes that just touch; no accessory blobs merging with the body.
- [ ] **A5 Action pose read** - Pass: the weapon and key shapes stay readable in the overhead swing and lunge.

## B. Face and close-up (2 m)
- [ ] **B1 Eyes** - Pass: lid line, iris, highlight and sclera read; highlights on the same side in both eyes; no
  inset darkening by AO. *Fixes:* use the `characters.md` templates; flatten the face plate; paint flush.
- [ ] **B2 Expression** - Pass: matches the dossier personality (Ichigo's scowl, Gin's grin, Ulquiorra's blank, Byakuya's
  calm, Kenpachi's fanged grin).
- [ ] **B3 Signature marks** - Pass: all canon marks present on the correct side (tear lines, scars, eyepatches,
  tattoos, estigma, kenseikan, glasses, beauty mark…), exaggerated ≤ 2× if needed for legibility.
- [ ] **B4 Hair and face** - Pass: hair never covers the eyes unless canon; bangs end above/at the brows.
- [ ] **B5 Emblems and glyphs** - Pass: division numerals, Espada numbers, Quincy crosses, badges read at 2 m and as a
  clean mark at 20 m. *Fixes:* glyph grids from the style guide; larger grid or decal.

## C. Proportion and scale
- [ ] **C1 Height** - Pass: body height = `round(cm × 0.48)` ± 1 (hair/hats/footwear excluded) at 48/m; world assets
  match their metric spec at 8/m; props at 16-24/m.
- [ ] **C2 Head and limbs** - Pass: head 1/6.5-1/7 of height for adults (children per table); landmarks within ±2
  voxels of `characters.md` §1.2; hands/feet slightly large, legs long.
- [ ] **C3 Lineup** - Pass: relative heights match canon (Rukia 69 < Ichigo 84 < Kenpachi 97 < Komamura 138).
- [ ] **C4 Weapon size** - Pass: dossier size × 1.5 (32/m numbers) or metric size at 48/m.
- [ ] **C5 Density consistency** - Pass: one density per class; sub-parts only at exact integer ratios; no visible
  voxel-size mismatch between neighbouring parts.
- [ ] **C6 World fit** - Pass: doors 16-18 world voxels, floors 22-24, character ≈ 14 world voxels tall; props sit on
  the grid and on the ground.

## D. Palette and colour
- [ ] **D1 Count** - Pass: ≤ ~24 colours per character body + outfit (weapon ≤ ~8, emissive VFX excluded), ≤ ~12 per
  prop; near-duplicates (ΔE_OK < 0.02) merged.
- [ ] **D2 Ramps** - Pass: each material is a 3-6-shade ramp; hue-shifted (warm hues shade toward red, not olive;
  blues toward violet; neutrals tinted, not rotated).
- [ ] **D3 Limits** - Pass: no `#000000`/`#FFFFFF` in albedo; darkest ≈ `#141418`, whitest ≈ `#F3F3F0`.
- [ ] **D4 Canon colours** - Pass: base colours match the dossier/locations hex (or a documented readability tweak);
  manga/anime variant chosen and consistent across model and effects.
- [ ] **D5 Black and white** - Pass: black garments show lit/base/shade folds (not a blob); whites keep form and do not
  bloom.
- [ ] **D6 Saturation balance** - Pass: environment less saturated than characters; accents small; no vibrating
  saturated neighbours.
- [ ] **D7 Engine materials** (world/prop `MaterialDef`) - Pass: `colors` is a variation band whose base sits on
  the pattern's centre shade (6 entries when it matters), not a pasted form ramp; `accent` set when the pattern
  uses it; glyph/sign materials flat; an existing base-library material reused or edited instead of duplicated
  (`color-and-palettes.md` §3).

## E. Construction integrity
- [ ] **E1 Floating voxels** - Pass: lint reports 0 components not 6-connected to their part root, 0 edge/corner-only
  contacts. *Fixes:* reattach or regenerate (thicker) - never just delete a clump.
- [ ] **E2 Thin features** - Pass: no unsupported 1-voxel spikes; 1-voxel features only as accents on a solid surface or
  as the last 1-2 voxels of a ≥ 2-thick clump.
- [ ] **E3 Holes** - Pass: no see-through gaps in rest pose or the six test poses except deliberate holes (Hollow
  hole, windows, sleeve mouths).
- [ ] **E4 Z-fighting** - Pass: no flickering coplanar faces between overlapping parts (child joint caps inset 1 voxel).
- [ ] **E5 Joints** - Pass: pivots at joint-sphere centres; sleeves/hakama/collars cover seams; no gaps or poke-through
  in any test pose.
- [ ] **E6 Symmetry diff** - Pass: every asymmetric cluster is on the brief's canon list; no off-by-half lopsidedness.
- [ ] **E7 Bounds** - Pass: bounds vs height and width match the brief (no stray voxels extending bounds).

## F. Noise and detail density
- [ ] **F1 No noise soup** - Pass: any 8×8 patch of one material shows ≤ 3 painted shades, grouped into shapes
  ≥ 3 voxels; no per-voxel random paint on characters; world variation comes from the shader.
- [ ] **F2 Detail hierarchy** - Pass: < 3-voxel detail only on face, hands, weapon, emblems; ~60 % calm surface.
- [ ] **F3 Folds** - Pass: 3-5 major folds per garment piece converging on pinch points; no fold confetti.
- [ ] **F4 Clean lines** - Pass: consistent stair-step runs, no doubles, AA only on painted lines (not silhouettes).
- [ ] **F5 Structure-aligned patterns** - Pass: grain, tiles, strata, pleats and stripes follow the form.

## G. Lighting robustness
- [ ] **G1 Day** (`karakura_afternoon`) - Pass: reads with correct colours.
- [ ] **G2 Noon whites** (`seireitei_noon`) - Pass: white plaster/haori/sand show form, no bloom halo, no clipping;
  black garments still show folds.
- [ ] **G3 Night** (`hm_night`) - Pass: silhouette readable against the black sky via rim light and the lit shade of
  dark ramps; whites do not glow; emissive parts glow as intended.
- [ ] **G4 AO** - Pass: AO separates layers without crushing eyes, mouths, emblems or narrow slots.
- [ ] **G5 Tone mapping** - Pass: judged under the renderer's tone mapping (ACES in the engine today, Neutral
  allowed), never AgX; colours judged in the final render.

## H. Rig and form readiness
- [ ] **H1 Parts and pivots** - Pass: named parts per `characters.md` §5.1, pivots on joints, grid-snapped.
- [ ] **H2 Sockets** - Pass: `hand.R`, `hand.L`, `back`, `hip.L`, `head` (+ custom ones the brief lists); weapon grips
  align with hand sockets; sheathed weapons sit correctly.
- [ ] **H3 Spring chains** - Pass: long hair, sleeves, haori/coat tails, scarves, ribbons, tails, wings defined with 2-4
  bones and do not intersect the body at rest.
- [ ] **H4 Forms** - Pass: forms of a loadout share the skeleton; form diffs add/replace parts cleanly; revealed layers
  (under haori/coat/Ōken garb) exist; masks fit the head socket with hair clipped.
- [ ] **H5 Expressions** - Pass: face variants are colour-only swaps on the same face-plate voxels.

## I. Budgets
- [ ] **I1 Triangles** (proposal until M3 benches) - fighter ≤ 40k incl. weapon; T1 Hollow ≤ 15k; Gillian ≤ 60k; prop ≤ 4k
  (cars ≤ 10k). *Fixes:* remove painted noise (it breaks greedy quads), simplify hidden geometry, merge colours.
- [ ] **I2 Voxels and materials** - Pass: world assets use the shared material library (≤ 255 per map); massive
  interiors solid/uniform.

## J. Canon fidelity
- [ ] **J1 Must-haves** - Pass: every item of the character's row in `bleach-style-guide.md` §10 and the dossier's
  `Look by form/outfit` for the chosen era is present.
- [ ] **J2 Era consistency** - Pass: outfit, hair, weapon and effects belong to the same era/loadout.
- [ ] **J3 Asymmetries and sides** - Pass: correct character's side for every asymmetric feature.
- [ ] **J4 Verify markers** - Pass: open `(verify)` items listed in the brief; anime-only/game-only looks are optional
  skins, not defaults.

## K. World, props and VFX specifics
- [ ] **K1 Buildings** - Pass: members present (walls ≥ 2 voxels, slabs, columns/posts, beams, footings); nothing
  hovers; collapse test behaves per the recipe (top slides along a diagonal cut; floors pancake; tiles shed first).
- [ ] **K2 Detailing** - Pass: windows framed and inset with interior hints (no flat dark holes); eaves, sills, cornices
  give scale; patterns aligned.
- [ ] **K3 Terrain** - Pass: strata visible in cuts and craters; slope-appropriate materials; no speckle; sand slumps
  to 34°; quartz faceted.
- [ ] **K4 Props** - Pass: correct density and metric size; sits on the grid; breaks per material (glass shatters, metal
  dents, wood splinters); readable signs (glyph grid sizes in `props.md` §3); no real brands.
- [ ] **K5 VFX** - Pass: one dominant readable shape; telegraph present; owner's colours; bloom only on emissive layers,
  hero effect dominant; dark effects have a rim; target stays visible; residue present; tested on three maps; respects
  flash/shake settings; within particle/overdraw budgets.

---

## Common fixes (quick table)

| Symptom in the screenshot | Likely cause | Fix |
|---|---|---|
| "Looks like Minecraft" | boxy unchamfered forms, 0.25 m world, strong edges | chamfer, 0.125 m, subtle edges, smaller voxels relative to form |
| Character unreadable at 20 m | identity in small details | enlarge silhouette keys, simplify, stronger colour blocks |
| Face looks wrong | rasterised metric eyes, curved face plate, mirrored highlights | pixel-art template on a flat plate |
| Hair looks like confetti | spikes not rooted, 1-voxel tips, no shading | clumps rooted in a cap, ≥ 2 thick, 3-tone shading |
| Black clothes are a blob | one near-black colour | full black ramp + fold shading |
| White areas glow | albedo too bright / light too strong | cap at `#F3F3F0`, calibrate light, check bloom threshold |
| Surface looks dirty/noisy | stacked random variation | remove painted noise, use structured masks |
| World material grey, dark or speckled | a 5-step form ramp pasted into `MaterialDef.colors` (the pattern centres on the wrong shade, steps too big) | convert to a 6-entry variation band (`color-and-palettes.md` §3.2) |
| Gaps at elbows/knees | no joint spheres, wrong pivots | ball joints, sleeve/hakama coverage, ROM limits |
| Flicker where parts overlap | coplanar faces (z-fighting) | inset the child's joint cap by 1 voxel |
| Building falls as one block | solid lump or missing members | rebuild with members; tag floors |
| Energy does not glow / glows grey | colour ≤ 1.0 or body multiplier too high | core ×4-8, body ×1.5-3, rim ×1.1-1.5 |

## Report template

```
Asset: <name / form / loadout>   Source: <dossier file § / locations §>   Date: <yyyy-mm-dd>
Captures: <paths>
Verdict: PASS | FAIL (n blockers, n majors, n minors)
Blockers:
- [E1] 3 floating voxels in hair clump near the right temple -> regenerate clump with root depth 3
Majors:
- [D5] kosode reads as a flat blob in hm_night -> apply black ramp, add 4 folds
Minors (accepted / to do):
- [B5] division numeral slightly heavy at 2 m -> thin the vertical stroke
Verify items still open: <list>
```
