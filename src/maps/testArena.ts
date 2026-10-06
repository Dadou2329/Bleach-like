// Small test arena for engine development (look-dev, destruction, characters).
import { Rng } from '../core/rng';
import { createBaseMaterials } from '../voxel/materials';
import { VoxelWorld } from '../voxel/world';
import { Builder } from './build';

export function generateTestArena(seed = 1): VoxelWorld {
  const mats = createBaseMaterials();
  const w = VoxelWorld.fromMeters(mats, { x: 96, y: 40, z: 96 }, 0.125);
  const b = new Builder(w);
  const rng = new Rng(seed);
  const G = b.v(4); // ground level (voxels)
  const [bed, stone, dirt, grass] = ['bedrock', 'stone', 'dirt', 'grass'].map((n) => b.id(n));
  b.box(0, 0, 0, w.sx, 2, w.sz, bed);
  b.box(0, 2, 0, w.sx, G - 8, w.sz, stone);
  b.box(0, G - 8, 0, w.sx, G - 1, w.sz, dirt);
  b.box(0, G - 1, 0, w.sx, G, w.sz, grass);

  // road along X with sidewalks
  const asphalt = b.id('asphalt'), white = b.id('road_white'), pave = b.id('pavement'), curb = b.id('curb');
  const rz0 = b.v(40), rz1 = b.v(47);
  b.box(0, G - 2, rz0, w.sx, G, rz1, asphalt);
  for (let x = 0; x < w.sx; x += b.v(4)) b.box(x, G - 1, (rz0 + rz1) >> 1, x + b.v(2), G, ((rz0 + rz1) >> 1) + 1, white);
  b.box(0, G - 1, rz0 - b.v(2), w.sx, G + 1, rz0, pave);
  b.box(0, G - 1, rz1, w.sx, G + 1, rz1 + b.v(2), pave);
  b.box(0, G, rz0 - 1, w.sx, G + 1, rz0, curb);
  b.box(0, G, rz1, w.sx, G + 1, rz1 + 1, curb);

  // a two-storey house
  house(b, b.v(20), G, b.v(52), b.v(8), b.v(7), rng);
  house(b, b.v(34), G, b.v(53), b.v(7), b.v(6), rng, 'plaster_cream', 'roof_red');
  // brick wall
  const brick = b.id('brick');
  b.box(b.v(50), G, b.v(52), b.v(62), G + b.v(1.6), b.v(52.5), brick);
  // a concrete block with windows
  block(b, b.v(60), G, b.v(56), b.v(10), b.v(12), b.v(14), rng);
  // trees
  for (let i = 0; i < 6; i++) tree(b, b.v(8 + i * 12 + rng.range(-2, 2)), G, b.v(30 + rng.range(-3, 3)), rng);
  w.compressAll();
  return w;
}

export function house(b: Builder, x0: number, y0: number, z0: number, sx: number, sz: number, rng: Rng, wallMat = 'plaster_white', roofMat = 'roof_slate'): void {
  const wall = b.id(wallMat), wood = b.id('wood_dark'), roof = b.id(roofMat), win = b.id('window'), floor = b.id('wood_light');
  const storey = b.v(3);
  const h = storey * 2;
  const t = 2;
  // foundation
  b.box(x0 - 1, y0, z0 - 1, x0 + sx + 1, y0 + 2, z0 + sz + 1, b.id('concrete'));
  const yb = y0 + 2;
  b.walls(x0, yb, z0, x0 + sx, yb + h, z0 + sz, t, wall);
  for (let f = 0; f < 2; f++) b.box(x0, yb + f * storey, z0, x0 + sx, yb + f * storey + 2, z0 + sz, floor);
  // wooden posts + beams
  for (const [px, pz] of [[x0, z0], [x0 + sx - t, z0], [x0, z0 + sz - t], [x0 + sx - t, z0 + sz - t]]) b.box(px, yb, pz, px + t, yb + h, pz + t, wood);
  b.walls(x0, yb + storey - 2, z0, x0 + sx, yb + storey, z0 + sz, t, wood);
  // windows on both long sides
  for (let f = 0; f < 2; f++) {
    const wy = yb + f * storey + b.v(1);
    for (let wx = x0 + b.v(1); wx + b.v(1.2) < x0 + sx - b.v(0.5); wx += b.v(2.2)) {
      b.box(wx, wy, z0, wx + b.v(1.2), wy + b.v(1.1), z0 + t, win);
      b.box(wx - 1, wy - 1, z0 - 1, wx + b.v(1.2) + 1, wy, z0, wood); // sill
      b.box(wx, wy, z0 + sz - t, wx + b.v(1.2), wy + b.v(1.1), z0 + sz, win);
    }
  }
  // door
  b.box(x0 + b.v(1), yb + 2, z0, x0 + b.v(2), yb + b.v(2.1), z0 + t, b.id('wood'));
  // hip roof with overhang
  const over = b.v(0.6);
  const ry = yb + h;
  const layers = Math.ceil(Math.min(sx, sz) / 2 / 1) + over;
  for (let k = 0; k < layers; k++) {
    const ax0 = x0 - over + k, ax1 = x0 + sx + over - k, az0 = z0 - over + k, az1 = z0 + sz + over - k;
    if (ax0 >= ax1 || az0 >= az1) break;
    const yk = ry + Math.floor(k * 0.6);
    b.box(ax0, yk, az0, ax1, yk + 1, az1, roof);
  }
  // ridge
  void rng;
}

export function block(b: Builder, x0: number, y0: number, z0: number, sx: number, sz: number, h: number, rng: Rng): void {
  const conc = b.id('concrete'), win = b.id(rng.chance(0.5) ? 'window' : 'window_lit'), rail = b.id('metal');
  b.walls(x0, y0, z0, x0 + sx, y0 + h, z0 + sz, 2, conc);
  const storey = b.v(3);
  for (let y = y0; y < y0 + h; y += storey) {
    b.box(x0, y, z0, x0 + sx, y + 2, z0 + sz, conc);
    for (let x = x0 + b.v(1); x + b.v(1.5) < x0 + sx - b.v(0.5); x += b.v(2.4)) {
      b.box(x, y + b.v(0.9), z0, x + b.v(1.5), y + b.v(2.2), z0 + 2, win);
    }
    // balcony slab + railing on the front
    if (y > y0) {
      b.box(x0, y, z0 - b.v(1), x0 + sx, y + 2, z0, conc);
      b.box(x0, y + 2, z0 - b.v(1), x0 + sx, y + b.v(1.1), z0 - b.v(1) + 1, rail);
    }
  }
  b.box(x0, y0 + h, z0, x0 + sx, y0 + h + 2, z0 + sz, conc);
}

export function tree(b: Builder, x: number, y: number, z: number, rng: Rng): void {
  const bark = b.id('bark'), leaves = b.id(rng.chance(0.2) ? 'sakura' : 'leaves');
  const h = b.v(rng.range(3.5, 5.5));
  b.cylinderY(x, z, y, y + h, b.v(0.22), bark);
  // a few branches
  for (let i = 0; i < 3; i++) {
    const a = rng.range(0, Math.PI * 2);
    const by = y + h * rng.range(0.5, 0.8);
    b.line(x, by, z, x + Math.cos(a) * b.v(1.4), by + b.v(1.0), z + Math.sin(a) * b.v(1.4), 1.2, bark);
  }
  // canopy: clustered blobs
  const cy = y + h + b.v(0.6);
  for (let i = 0; i < 7; i++) {
    const r = b.v(rng.range(1.0, 1.7));
    b.ellipsoid(x + rng.range(-1, 1) * b.v(1.3), cy + rng.range(-0.6, 0.8) * b.v(1), z + rng.range(-1, 1) * b.v(1.3), r, r * 0.8, r, leaves, true);
  }
}
