# Look-dev experiments (planning phase)

Headless captures made with three 0.186.1 + postprocessing 6.39.5 + n8ao 2.0.1 in Chromium 141
(`--use-angle=swiftshader --enable-unsafe-swiftshader`). SwiftShader renders ~1 frame/s, so these are about
looks, not performance. `voxel-lookdev.html` contains the prototype greedy mesher (per-vertex AO, AO-aware quad
flipping) and the voxel material shader injection (`onBeforeCompile`) — reuse them as the starting point in M1.

| File | Experiment | Takeaway |
|---|---|---|
| `01-world-0.25m.png` | World at 0.25 m voxels, strong per-voxel edge lines, 32/m character | Reads as Minecraft. Crater is blocky; windows are 4×4 blocks. Grid lines look like tiles. |
| `02-world-0.125m.png` | Same scene at 0.125 m | Reads as voxel art: smooth crater bowl, finer slash cut, smaller gap with character detail. **Chosen default.** |
| `03-world-0.125m-post.png` | + N8AO, mipmap bloom, AgX, vignette, SMAA, brick pattern, subtle edges, thicker strata, Getsuga test mesh | Post stack works headless. AgX washes out the anime palette → use Neutral/ACES + LUTs. Energy VFX need much hotter HDR values to bloom. Brick courses at 0.125 m look good. |
| `04-character-48-vs-32.png` | The same metric bust rasterised at 48/m (left) and 32/m (right) | At 32/m the eyes vanish entirely; at 48/m they read. **Characters at 48/m.** Faces must be authored as voxel-space pixel art, not rasterised from tiny metric shapes. The naive spike-hair generator leaves floating voxels → hair must be built from connected clumps, and the model lint must flag disconnected components. |

Other notes:
- r186 removed `PCFSoftShadowMap` (falls back to `PCFShadowMap`).
- `WEBGL_multi_draw` is available (even on SwiftShader) → `BatchedMesh` multi-draw path works.
- n8ao imports `three/examples/jsm/...` paths — fine under Vite; raw import maps need that prefix mapped.
- Greedy meshing triangle counts (for scale): small scene 2.0k tris at 0.25 m vs 5.6–6.5k at 0.125 m;
  crude busts 1.0k tris (32/m) vs 2.4k tris (48/m).
