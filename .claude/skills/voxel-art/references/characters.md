# Characters at 48 vox/m

Characters are built code-first with the model DSL (`src/models`, see `dsl.md` once it exists) as
**rigid-part voxel models**: each part is a voxel grid on one bone, greedy-meshed into one rigid-skinned mesh
(PLAN §9.1), weapons on sockets. Every number here is in **voxels at 48/m** (1 vox = 2.08 cm) unless stated.

- Height: `vox = round(cm × 0.48)`. Dossier voxel numbers are at 32/m: **× 1.5**.
- Proportions are anime-stylised: head ≈ 1/6.5-1/7 of height for adults (dossiers' realistic heads of ~7 vox at
  32/m = 10.5 would lose the face - use 11-13), slightly larger hands and feet, long legs (PLAN §9.2).
- Canon facts (heights, silhouette keys, palettes, outfits per era, weapons) come from the dossier; the
  "must-have" list per character is in `bleach-style-guide.md` §10.

---

## 1. Proportion tables

### 1.1 Build archetypes (voxels)

| Build (example) | Height | Head chin→crown | Head W×D | Shoulder W | Chest D | Waist W | Hip W | Crotch h | Knee h | Upper arm / forearm / hand | Foot L×W |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Adult male (Ichigo 174 cm) | 84 | 12 | 10×11 | 21 | 10 | 13 | 15 | 40 | 23 | 15 / 13 / 9 | 12×5 |
| Tall slender male (Aizen, Grimmjow, Gin 185-186 cm) | 89 | 13 | 10×11 | 22 | 10 | 13 | 15 | 43 | 25 | 16 / 14 / 9 | 13×5 |
| Very tall, lanky (Nnoitra 215 cm) | 103 | 14 | 10×12 | 22 | 10 | 12 | 14 | 52 | 30 | 19 / 17 / 11 | 14×5 |
| Large, muscular (Chad 197 cm) | 95 | 13 | 11×12 | 30 | 14 | 18 | 19 | 45 | 26 | 17 / 15 / 11 | 14×6 |
| Adult female (Orihime 157 cm) | 75 | 11 | 9×10 | 18 | 9 (+bust) | 11 | 15 | 36 | 21 | 13 / 11 / 8 | 10×4 |
| Petite female (Rukia 144, Suì-Fēng 150 cm) | 69-72 | 11 | 9×10 | 15 | 8 | 10 | 13 | 32-34 | 19 | 12 / 10 / 7 | 9×4 |
| Child, ~5 heads (Hitsugaya 133 cm) | 64 | 13 | 11×11 | 14 | 8 | 11 | 12 | 27 | 16 | 10 / 9 / 7 | 9×4 |
| Small child, ~4.5 heads (Yachiru 109 cm) | 52 | 12 | 11×11 | 11 | 7 | 10 | 11 | 20 | 12 | 8 / 7 / 5 | 7×3 |
| Giant humanoid (Komamura 288 cm, wolf) | 138 | 20 (head + muzzle) | 16×22 | 46 | 22 | 30 | 32 | 60 | 34 | 25 / 23 / 17 | 22×9 |

Widths are outer silhouette at rest; add clothing thickness (§4). Hair, hats and geta/okobo are **outside**
the height budget (Urahara's hat +3-5, Kyōraku's hat +6-9, Renji's ponytail +10-12, geta +3, Senjumaru's okobo +6).

### 1.2 Vertical landmarks (fraction of height H; adult male 84 in brackets)

| Landmark | Fraction | Adult male |
|---|---|---|
| Crown (top of skull) | 1.00 | 84 |
| Eye line | 0.93 | 78 |
| Chin | 0.857 | 72 |
| Shoulder line / shoulder pivot | 0.81 | 68 |
| Chest (nipple) line | 0.72 | 61 |
| Elbow pivot | 0.63 | 53 |
| Navel / waist | 0.60 | 50 |
| Wrist / crotch | 0.476-0.50 | 40 |
| Fingertips | 0.37 | 31 |
| Knee pivot | 0.27 | 23 |
| Ankle pivot | 0.05 | 4 |

Anime legs: crotch at 0.48-0.50 H for long-legged characters (Uryū, Yoruichi, Ginjō, Tsukishima); children's crotch
≈ 0.40-0.42 H with the head carrying the extra height.

### 1.3 Body construction
- **Head:** a *rounded box*, not an ellipsoid - W 10 × D 11 × H 12 (adult male), chamfer 2 at the back corners
  and crown, 1 at the front corners; the bottom 3 rows taper to 8, 6, 4 voxels wide (jaw, chin). The **front face
  plate is flat** (planar) across the eye band rows so pixel-art eyes do not distort on curvature.
- **Ears:** 1 voxel thick, 2 wide × 3 tall at eye height, usually hidden by hair.
- **Neck:** 4-5 wide, 3-4 tall, set 1 voxel forward of the spine line.
- **Torso:** tapered rounded box (chest → waist → hips), shoulders as spheres at the pivots (they are the joint
  balls, §5). Muscle definition by 1-voxel silhouette steps and paint (deltoid, pectoral line, abs on bare
  torsos: Grimmjow, Kensei, Yamamoto stripped), never by noise.
- **Limbs:** tapered capsules: upper arm Ø 5 → forearm Ø 4 → wrist 3 (male); thigh Ø 8 → calf Ø 6 → ankle 4.
- **Hands:** mitten (4 fingers fused, 4-5 wide, 2-3 thick) + separate thumb; split fingers (each ≈ 2×2,
  3×3 for big hands) only for characters whose poses need them (Bazz-B's finger-count Burner Fingers, Byakuya's
  raised hand, gesture casters). Fists are a separate hand variant, not a pose of the mitten.
- **Feet:** tabi = white sock with a **split-toe notch** (1 voxel) at the front; waraji = straw sole 1 voxel thick,
  1 voxel larger than the foot, with 1-voxel straps over the instep.

---

## 2. Faces as pixel-art templates

Faces are painted, voxel by voxel, on the flat face plate (D2b). Never rasterise metric eye/mouth shapes.
At 2 m a face voxel is ~10 px; at 20 m the whole face is ~12 px - so faces matter for close-ups, character select
and cinematics, while gameplay readability comes from hair, mask and silhouette.

### 2.1 Grid and legend
Face plate: **10 columns** (0-9, viewer's left → right = character's right → left) × the head rows
(0 = chin). Adult male head = 12 rows (0-11), female 11, child 12-13. Mirror plane between columns 4 and 5.

```
.  skin base      s  skin shade        H/h  hair base / shade     B  brow
L  lid/lash line (darkest, e.g. #1B120C or #15151A)                W  sclera (#F1EEE8)
I  iris base      i  iris dark/pupil   *  iris highlight (lightest iris shade, near #F7F5F0)
m  mouth line (skin deep / lip)        T  teeth (#F3EFE6)          D  mouth interior (dark red-brown)
```

Conventions: the highlight sits in the **same corner of both irises** (consistent light; mirrored highlights
look cross-eyed); sclera goes on the **outer** side so the gaze converges on the viewer; eyes are painted
**flush** (an inset iris loses up to half its brightness to vertex AO).

### 2.2 Base templates

**T1 - adult male, neutral** (12-row head; rows 10-11 hair):
```
        0 1 2 3 4 5 6 7 8 9
row 9   H H h H H H h H H H    bangs (shape per character)
row 8   . B B B . . B B B .    brows
row 7   . L L L . . L L L .    upper lid line
row 6   . W * I . . * I W .    iris 2x2 with highlight
row 5   . W i i . . i i W .
row 4   . . . . . . . . . .
row 3   . . . . . s . . . .    nose = 1 shade voxel on the side away from the key light (optional 1-voxel bump)
row 2   . . . . . . . . . .
row 1   . . . . m m . . . .    mouth 2 wide
row 0       . . . .            chin row is 4 wide in geometry
```

**T2 - scowl (Ichigo's permanent frown)** - replace rows 7-8 of T1:
```
row 8   . B B . . . . B B .
row 7   . L L B s s B L L .    inner brow ends drop onto the lid line; 2-voxel furrow shade between
```
Ichigo: brows `#C8661F`, lid line `#1B120C`, iris `#7A4A2C`.

**T3 - adult female** (11-row head; eye 4 rows with a lash wing):
```
        0 1 2 3 4 5 6 7 8 9
row 8   . . B B . . B B . .    thin, short brows (often under the bangs)
row 7   L L L L . . L L L L    lash line with a 1-voxel outer wing
row 6   . W * I . . * I W .
row 5   . W I I . . I I W .
row 4   . . i i . . i i . .    darkest iris at the bottom, no lower lash
row 3   . . . . . . . . . .    nose usually omitted
row 2   . . . . . . . . . .
row 1   . . . . m m . . . .    small mouth (lip colour or skin deep)
```

**T4 - child** (Hitsugaya, Yachiru, child Nel, Lilynette): T3's eye block shifted down one row (rows 3-6),
brows at row 7, forehead and hair take the extra rows; mouth stays at row 1. Large eyes = youth.

### 2.3 Expression variants (left eye block shown; mirror for the right)

| Expression | Eye rows 8 → 5 | Mouth (rows 2 → 0) |
|---|---|---|
| Neutral | `B B B / L L L / W * I / W i i` | `m m` at row 1 |
| Angry | brows as T2; inner lid voxel covers the iris top: `W * L` | `m m m m` row 1, outer voxels one shade darker |
| Sad | inner brow end raised 1 row; outer lid end drops 1 row | corners down (row 0) |
| Happy, eyes closed (^) | row 7: `. L .`, row 6: `L . L` | smile: `m m` row 1 + corners at row 2 |
| Closed / blink | row 6: `L L L`, other rows skin | neutral |
| Surprised | lid line raised to row 8 (brows to row 9), eye 3×3: `W W W / W I W / W i W` | open: 2×2 `D` with `T` on top |
| Bored, half-lidded (Starrk, Shinji, Rose, Lisa) | row 7 skin shade (eyelid), lid line at row 6, only `W i I` at row 5 | neutral or slight smirk |
| Pain / squint | upper lid at row 6, lower lid `L` at row 5 | clenched: `T T T T` row 1 |
| Grin (teeth) | any | row 2: `m T T T T m` (6 wide), row 1: `D D D D`; wide grins up to 8 |
| Shout | brows angry | 2×3 `D` block with `T` top row, 4 wide for big shouts |

Expressions are **colour-only edits on a fixed set of face-plate voxels**, so they can swap at runtime by
re-indexing palette entries (or by swapping a tiny face sub-part) without remeshing the head.

### 2.4 Signature faces and marks
Grids for the hardest three; table for the rest. Sides are **character's** sides.

**Gin - closed-eye fox grin** (brows `#A7ACBD`, teeth `#F7F4EE`):
```
row 8   . B B . . . . B B .
row 6   . . L L . . L L . .    closed eyes: flat lines…
row 5   . L . . . . . . L .    …with outer ends one row lower (fox slant)
row 2   . m . . . . . . m .    grin corners two rows up
row 1   . . T T T T T T . .    wide upper teeth row
row 0       m m m m            lower lip line (chin row)
```
Eyes-open variant (rare, story beats): sky-blue iris `#5EC4F0` in a narrow 1-row slit.

**Ulquiorra - slit pupils and tear lines** (iris `#2E9E4E`, slit `#0C0C0C`, lines `#1E8C84`, lip `#141414`):
```
row 7   . L L L . . L L L .
row 6   . I i I . . I i I .    iris 3 wide, black cat-slit in the centre column
row 5   . I i I . . I i I .
row 4   . . t . . . . t . .    tear lines from under the eye centre…
row 3   . . t . . . . t . .
row 2   . . t . . . . t . .    …down to the jaw
row 1   . . t . m m . t . .    black upper lip line
```
Release 1: lines turn black, 2 wide at row 4 tapering to 1 (triangular); Segunda Etapa: black and larger, iris
yellow `#F2D21C` on green sclera `#2FBF5A`. Expression barely changes - his face is a deliberate blank.

**Kenpachi - eyepatch, scar, no brows, fangs** (patch `#0E0E0E`, scar `#9E5F52`, teeth `#F3EFE6`):
```
row 9   H H H H H H H c H H    scar starts in the hairline (col 7, character's left)
row 8   E s s s . . s c s .    no eyebrows: skin-shade brow ridge, 1 voxel proud; E = patch strap
row 7   E E E E . . L L L .    patch over the character's right eye (cols 0-3)
row 6   E E E E . . * I W .    left eye kept clean - the scar passes above and below it
row 5   E E E E . . i i W .
row 4   . . . . . . . c . .
row 3   . . . . . s . c . .
row 2   . F T T T T F c . .    grin with oversized canines F (2 rows long)
row 1   . F D D D D F . . .
```
Soul Society arc patch: gold trim `#C9A34A`, one strap a chain `#B9B9B9`; later plain straps; TYBW strapless.

| Character | Close-up must-haves (48/m) |
|---|---|
| Ichigo | T2 scowl; masked: sclera `#0C0C10`, iris gold `#F2D84E` |
| Hollow Ichigo | inverted: black sclera `#0B0B0F`, gold iris `#F7E168`, manic grin, blue tongue `#3A5DB8`, black nails |
| Rukia | T3 with violet iris `#5E5590`; the **lock between the eyes** crosses rows 5-8 at the bridge (cols 4-5) without covering the irises |
| Byakuya | calm neutral, lids slightly lowered; slate iris `#6E7480`; kenseikan (3 on top, 2 on the right side) as white `#EEF0F2` 2×2 tubes 5-7 long clipping hair locks (verify placement) |
| Yamamoto | eyes shut (lid line only); long white brows as 2×4 clumps hanging from row 8 to row 5 past the outer eye corners (1 voxel proud); serious variant opens one eye (red `#A8261F`); mustache clumps from row 3 into a hip-length braided beard bound by a purple band `#6B3F8E`; scars above the right eye |
| Mayuri (Soul Society) | white face paint `#F2F1EB` with the inner face (cols 1-8, rows 2-8) painted black `#111111`, nose column left white; gold eyes `#E3B32A`; wide bared-teeth grin; gold ear cones as separate parts (verify paint layout per era) |
| Aizen | captain: square black glasses = 1-voxel frame 1 voxel in front of the plate around each eye, no lens voxels; traitor: no glasses, hair slicked back with **one strand** over the forehead, sharper lids |
| Uryū, Ryūken, Nanao, Lisa | glasses as 1-voxel frames (Uryū/Ryūken silver `#B4B4B5`, Lisa red `#C8202E`); optional 1-voxel glare highlight on the frame |
| Hisagi | three parallel scars straight down over the right eye (cols 1-3, skip the iris rows); blue stripe `#3E86C9` across the left cheek and nose bridge (row 4); "69" on the left cheek as two 3×4 digits (exaggerate size for legibility) |
| Ikkaku | red marks `#D7262E` at the outer corners of both eyes (1×2, extending outward from the lid line); bald scalp with a 2-3 voxel highlight patch |
| Renji | brows replaced by black jagged tattoo lines rising to the temples; forehead band/bandana per era |
| Yumichika | yellow/orange feathers (1×2 voxels, protruding) at the right eye's outer corner |
| Grimmjow | teal-green estigma `#23A383` along the lower lids, thickening outward like big-cat markings; jaw-bone mask on the **right** cheek/jaw as a separate part, 1 voxel proud |
| Shinji | half-lidded eyes; huge grin baring the full upper teeth row (≈ 6 voxels) |
| Hiyori | angry brows, tired lines under the eyes, three freckles `#C78A68` under each eye, one fang at the upper left of the mouth |
| Rangiku | 1-voxel beauty mark `#5A3A2A` under the right corner of the mouth |
| Tōsen | pupil-less pale lavender eyes `#CDBDE3` (uniform iris, no highlight); clear goggles/visor as a transparent band |
| Zommari | three black downward triangles on the chin; four thin lines up the forehead above each eye, each ending in a dot |
| Yammy | red estigma `#C51E2B` under the eyes; orange brows `#E5772A`; jaw bone with 8 teeth resting on the chin |
| Nnoitra | hair curtain over the left side; large white eyepatch over the left eye (the hole is under it); huge upper-teeth grin; tongue-out variant shows "5" |
| Harribel (sealed) | high collar covers the face to the nose - only eyes and brows modelled above it |
| Yhwach | The Almighty variant: crimson irises `#B5121B` with three pupils per eye (widen the eye block to 4×3 for this variant) |
| Kensei | permanent scowl; piercings in the left brow and three in the left ear (1-voxel `#C8CCD2`) |
| Hollow-masked eyes (Visored) | sclera `#080808`-`#0C0C10`, iris per character (Shinji grey `#9E9E9E`, Hiyori stays brown, default yellow); seen through the mask's eye holes |

Small iconic marks may be **exaggerated up to ~2×** to stay legible; check every face in the 2 m close-up.

---

## 3. Hair as connected clumps

Look-dev 04's spike generator left floating cubes; hair is the #1 source of lint failures. Build it as:

1. **Hair cap:** a shell over the skull, 2-3 voxels thick (thicker at the crown), with the hairline at the
   top of the face plate (row 9-10). The cap carries the base colour and AO-friendly volume.
2. **Clumps:** tapered swept shapes (capsule chains, wedges, cones) defined by root (inside the cap, ≥ 2 voxels
   deep), direction (from a flow field around the crown whorl), length, root cross-section (3×3 to 5×4), tip
   cross-section (≥ 2×1 just before the tip), curvature (0-30°) and slight twist.
3. **Rasterise with thin-feature protection** (`procedural-techniques.md` §4) and union with the cap.
4. **Clean up:** keep only voxels 6-connected to the cap; a clump that detaches is regenerated thicker, never
   deleted silently.

Rules:
- Minimum thickness 2 voxels everywhere except the final 1-2 tip voxels, which must be face-connected and
  backed by ≥ 2 thickness. **No lone 1-voxel spikes, no diagonal-only joins.**
- Vary clump length in a long-short rhythm; avoid perfect radial symmetry; tips follow one consistent flow.
- Never cover the eyes unless canon (Chad's bangs hide his eyes, Kira's bang covers his left eye, Ukitake's lock
  falls over his right eye, Yukio's bangs over his left eye, Rukia's lock between the eyes - not over them).
- **Shading (≥ 3 tones):** base; highlight on the upper-facing side of each clump (1-voxel band) or an
  "angel ring" band across the crown for straight glossy hair (Byakuya, Rukia, Ulquiorra, Yhwach); shade on
  undersides and between clumps; deep at roots, nape and inside. Optional 1-voxel strand lines along long sheets
  every 3-4 voxels.
- Volume: spiky characters add **+5-8 voxels above the crown** and 3-5 at sides/nape (Ichigo; dossier +3-5 at 32/m).

| Style | Recipe | Examples |
|---|---|---|
| Spiky short | cap + 14-20 clumps: 5-7 bangs, 4-6 crown spikes angled up/back, 3-4 per side, 3-4 nape | Ichigo, Hitsugaya (tall white spikes), Grimmjow (swept back), Kaien, Isshin |
| Sea-urchin spikes | cap + 25-35 stiff conical spikes, each tipped with a 2×2 brass bell part | Kenpachi pre-time-skip |
| Bob / blunt fringe | cap + 10-14 vertical blades, flat-cut fringe at brow level, jaw-length sides | Shinji, Rukia (tips flare outward), Momo's front locks |
| Straight long | cap + 6-8 sheets (2-3 thick) in two layers + face-framing locks; spring chains below the shoulders | Byakuya (to shoulders), Yhwach and Haschwalth (to the back/waist), Orihime (to the hips), Ulquiorra (released) |
| Ponytail / topknot | tie (2-3 voxel band) + 6-8 clumps radiating (Renji's "pineapple") or a 3-4 bone chain (Yoruichi) | Renji, Yoruichi, Jidanbō |
| Braid | chain of 3×3-4×4 lozenge segments, alternating 2 shades, on a 3-6 bone spring chain | Unohana (front braid), Nemu, Suì-Fēng (two braids ending in gold rings) |
| Afro | noise-displaced sphere with 3-4 large lobes, shade in the creases | Love (≈ +6-8 voxels), Gantenbainne |
| Bald | skin ramp on the scalp, a 2-3 voxel highlight patch; no hair cap | Ikkaku, Yamamoto, Ichibē, Tessai (cornrows = parallel 1-voxel ridges) |
| Hats / headgear | separate part on `head`, hair under it clipped | Urahara's striped bucket hat (brim ≈ 19 voxels wide), Kyōraku's sugegasa, Mayuri's headgear per era |

---

## 4. Clothing as offset shells

- A garment is the body SDF **dilated by t** inside the garment's region mask, **filled solid down to the body**
  (no air gap - air gaps create hidden faces and holes at openings). Use `onion` shells only for genuinely open
  garments (haori, capes, coat tails).
- Openings (sleeve mouths, hakama hems, collars, coat fronts) show 1-2 voxels of inside surface in a darker
  shade or the lining colour (captain haori linings, Ichigo's crimson Bankai lining).

| Piece | Thickness t (vox) | Notes |
|---|---|---|
| Juban collar (white V) | 1 proud of the kosode | 2 wide per side, meets at the sternum ~10-12 below the chin |
| Kosode torso | 1-2 | wraps **left over right** (the collar reads as a lowercase "y" to the viewer; right over left is burial style) |
| Kosode sleeve bag (furi) | 3-4 off the arm | hangs 12-16 below the forearm; opening at the wrist |
| Obi / sash | 1 proud, 3-4 tall | knot or tied ends per character |
| Hakama | 2 at the hips → 4-7 at the hem | 5 front + 2 back pleats as 1-voxel grooves converging to the waist; side slits; hem 1-3 above the ground |
| Haori | 2 (hem must read in profile) | shoulders → knee/calf; hem band; numeral on the back (style guide §2.2) |
| Coats, jackets (Arrancar, Quincy, Bankai) | 2; collars 3-5 tall | Grimmjow's upturned collar, Ulquiorra's coat tails, Quincy capes |
| Armour, bone plates | 2-3 | 1-voxel recess between plates |

**Folds** - 3-5 major folds per piece, built as 1-voxel steps in the silhouette plus shading (ridge = lit, valley =
shade). Use canonical fold types: *pipe* (hanging cloth, vertical tubes: hakama, haori), *zigzag* (bent sleeves
at elbows/knees: alternating diagonal steps), *spiral* (around forearms), *drop* (from a support: shoulders,
obi), *half-lock* (at bends). Fold lines converge on pinch points (obi, shoulders, elbows). Twenty tiny folds =
noise; four big ones = cloth.

Bleach-specific construction (shihakushō, haori, Arrancar, Quincy, armour) is in `bleach-style-guide.md`.

---

## 5. Joints, part splitting and rigging

### 5.1 Rigid parts (humanoid)
| Part (bone) | Contains | Notes |
|---|---|---|
| `pelvis` (root) | hips, hakama top, obi, coat skirt root | |
| `spine` / `chest` | torso, collar, upper haori/coat | split if the character bends a lot |
| `neck`, `head` | neck; skull, face plate, hair cap, rigid hair, ears | jaw part only for creatures/Hollows |
| `upperarm.L/R`, `forearm.L/R`, `hand.L/R` | limbs + sleeve segments + cuffs | hand variants: open, fist, grip, gesture |
| `thigh.L/R`, `shin.L/R`, `foot.L/R` | legs + hakama leg upper / flared hem + tabi/waraji | |
| Spring chains (2-4 bones) | long hair sheets, ponytails, braids, sleeve bags, haori fronts/back, coat tails, scarves (Byakuya, Rangiku's stole), ribbons (Rukia's Shikai ribbon), capes, tails (Grimmjow, Ulquiorra R2), wings | PLAN §9.3 |
| Sockets | `hand.R`, `hand.L`, `back`, `hip.L`, `head` (+ custom: `shoulder.L` for Yachiru on Kenpachi, `waist.back` for Suì-Fēng's sword, `forearm.L` for Haschwalth's/Gerard's shields) | weapons, sheaths, masks, hats |

### 5.2 Hiding the gaps
- **Pivots on joint centres**, snapped to the voxel grid (whole or half voxel - consistent per model).
- **Ball joints:** the parent owns a sphere of the limb's radius centred on the pivot; the child's root is a
  hemisphere around the same pivot, **1 voxel smaller**, so it slides inside the parent's ball when rotating
  and never shares a coplanar face with it (no z-fighting). Overlap 1-2 voxels at rest.
- **Clothing covers joints:** sleeves extend past the elbow, hakama past the knee, collars over the neck seam,
  tabi over the ankle; haori/coat panels hang over hip seams.
- **Telescoping:** for flared garments the lower segment is wider than the upper (hakama hem around the thigh
  tube), so on bend the upper nests inside.
- **Range-of-motion limits** keep seams hidden (elbow 0-145°, knee 0-150°, shoulder raise limited by sleeve
  bulk, neck ±60° yaw).
- **Test poses** (render all six): T-pose, A-pose, deep lunge, overhead two-handed swing, high kick, crouch.
  Any visible gap, inverted face or poking voxel is a blocker.

---

## 6. Weapons

Weapons are separate meshes on sockets at the **same 48/m density**, so forms swap them without touching the body.

| Weapon (dossier) | Real size | Voxels at 48/m | Key construction |
|---|---|---|---|
| Standard sealed katana | ~100 cm (blade 70, grip 25) | 48 (blade 34, grip 12) | blade 1 thick × 2 wide with a light edge line; tsuba 4-5 square/round × 1 thick; 1-voxel habaki; grip 2×2 with diamond wrap (2 colours); saya 2×3 |
| Wakizashi (Gin's Shinsō sealed) | ~60 cm | 29 | as katana |
| Hyōrinmaru (nodachi) | 140 cm | 67 | longer than Hitsugaya (64); hilt and 4-point star guard behind his right shoulder |
| Ichigo first sword | 165 cm | 79 | rectangular bronze guard ≈ 6×4; red wrap; two light-blue tassels |
| Zangetsu (Shikai v1) | 170 cm (blade 46 + grip 8 at 32/m) | 82 (blade 69, grip 12) | 10-11 wide; spine 3 thick tapering to a 1-voxel edge; dark spine half, silver bevel half; no guard; cloth-wrapped tang + streamer chain |
| Tensa Zangetsu (Bankai v1) | 105 cm | 50 (blade 36, handle 14) | black blade 1×2; manji guard of four bent prongs, 7-8 span; short chain with a broken last link |
| Bankai v3 / True Shikai large | 140-160 cm | 67-77 | per A1 dossier |
| True Bankai Tensa Zangetsu | 230 cm | 110 | 16-17 wide white shell over a black core band; chain looping over the back of the blade |
| Senbonzakura (sealed) | ~100 cm | 48 | bronze guard shaped like an open four-pane window frame, lavender cord, white sheath |
| Yhwach's sword | ~140 cm | 67 | dādāo-like, long handle, bird-shaped cross-guard |
| Fullbring blade (Ichigo FB3) | 90 cm | 43 | black machete, silver edge, Substitute badge as guard |

Rules:
- Blades are 1 voxel thick at 48/m; width ≥ 2 so they survive at distance (motion readability comes from trails).
- Edge = 1-voxel light line (`edge glint`), spine one shade darker; a hamon line only for close-up weapons.
- Guards are flat plates 1 voxel thick in the dossier shape (Hitsugaya's 4-point star → 8-point in Bankai,
  Aizen's hexagonal gold tsuba, Yamamoto's circular bronze, Kaien's square gold with cut corners).
- The grip passes through the closed fist with 1 voxel of clearance; pommel and guard must not intersect the
  forearm in idle or swing poses. Align the grip axis with the hand socket axis.
- Sheaths and carried weapons sit on `hip.L` (most katana), `back` (Zangetsu, Hyōrinmaru), `waist.back`
  (Suì-Fēng's horizontal short sword, Rangiku's sword across the back of the obi), or hang in front (Mayuri).

---

## 7. Forms and costume layers on a shared base

- **One base body per character** (proportion parameters) → outfit layers → per-form **diffs**:
  - add / remove / replace parts (Bankai coat replaces kosode upper + haori; a Hollow mask adds a `head` part;
    Resurrección replaces most parts but keeps the skeleton where the body plan allows);
  - palette swaps (Hollow Ichigo's inverted palette; Rukia's Bankai whites and ice armour);
  - hair variants (post-Dangai long hair, Ulquiorra's released hair) as replacement hair parts;
  - weapons swapped at sockets.
- **Same skeleton and pivots across the forms of a loadout** so clips transfer. Size-changing forms are separate
  rigs at a coarser density: Yammy's Ira (keeps growing), Komamura's Bankai giant (separate ~100 m entity),
  Gerard's Godly Size (world-scale rig at 0.25 m per the dossier), Ichibē/Senjumaru giant limbs.
- **Outfit states** (`NEW: OutfitStates`, `LayeredOutfitDestruction`, `ResourceLinkedCosmetics` in the dossiers):
  haori lost, top stripped (Yamamoto's scarred torso, Kenpachi's bandages - the body underneath must exist),
  Tensa Zangetsu's coat in 3-4 damage stages tied to reiatsu, Ōken outer garb destroyed to reveal the TYBW uniform.
  Model every layer that can be revealed.
- **Masks:** separate part on `head`, 1 voxel proud of the skin; hair voxels inside the mask volume are clipped
  while worn; build at 48/m, or as an exactly 2× (96/m) sub-part when teeth/slits/stripes do not survive (the
  Visored dossier's "64/m" was written for 32/m bodies - use 96/m on 48/m bodies). Masks have HP and crack stages;
  shattering spawns chips that dissolve into white reishi motes.

---

## 8. Hollows, creatures and non-human characters

- **Densities by tier (PLAN §12.2):** T0 vermin 32/m · T1 lesser 16-32/m · T2 named 16/m · T3 huge 8/m ·
  T4 Gillian 4/m with mask & hands 8/m · T4+ carrier 2/m (eye/nails 8/m) · T5 Adjuchas 16-32/m ·
  T6 Vasto Lorde 32/m · Calavera 32/m. Human-sized creatures that share close-ups with 48/m fighters
  (Vasto Lorde, Calavera, Arrancar Hollow forms) may go to 48/m - compare side by side.
- **Body plans:** spine-and-limb generator (hunched biped, quadruped, hexapod, serpent, flyer) + mask generator
  (`bleach-style-guide.md` §3). Hollows read by their **mask** first: give it the strongest value contrast.
- **True hole:** the Hollow hole is empty voxels with dark inner faces `#060609`, and excluded from the hitbox.
- **Fur, scales, chitin:** structured motifs aligned to the body (fur = 2-3 voxel clumps in rows; scales = a
  repeating 2×2 pattern with a darker lower edge), never noise.
- **Small characters below ~12-voxel heads at 48/m** (Kon's plush 27 cm, Orihime's fairies 10-15 cm): build at
  96/m and scale ×0.5, or render as glowing particle figures (fairies).
- **Animal heads (Komamura):** muzzle as a separate block (6-8 long), ears 2-3 thick, fur ramp with a lighter chest
  and jaw patch; keep the eye area flat enough for pixel-art eyes.
