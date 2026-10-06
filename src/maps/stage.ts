// Small neutral stage for the model viewer / animation review: flat stone floor, a low wall.
import { createBaseMaterials } from '../voxel/materials';
import { VoxelWorld } from '../voxel/world';
import { Builder } from './build';

export function generateStage(): VoxelWorld {
  const mats = createBaseMaterials();
  const w = VoxelWorld.fromMeters(mats, { x: 32, y: 16, z: 32 }, 0.125);
  const b = new Builder(w);
  const G = b.v(2);
  b.box(0, 0, 0, w.sx, 2, w.sz, b.id('bedrock'));
  b.box(0, 2, 0, w.sx, G - 1, w.sz, b.id('stone'));
  b.box(0, G - 1, 0, w.sx, G, w.sz, b.id('pavement'));
  // a darker tiled disc under the model
  const c = w.sx / 2, r = b.v(3.2);
  const tile = b.id('stone');
  for (let z = -r; z <= r; z++) for (let x = -r; x <= r; x++) if (x * x + z * z <= r * r) b.set(c + x, G - 1, c + z, tile);
  // back wall for silhouette contrast
  b.box(b.v(6), G, b.v(24), b.v(26), G + b.v(3), b.v(25), b.id('seireitei_wall'));
  w.compressAll();
  return w;
}
