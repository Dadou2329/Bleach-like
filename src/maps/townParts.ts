// Karakura v2 parts (voxel units, 8 vox/m; G is the street level, the first voxel of air above the grass):
// what lies under the streets (sewer conduits and manholes, building footings), office towers on the main road, the
// konbini, a shrine, Urahara Shop, street lamps, traffic lights, parked cars, bus stops, hip roofs and carports.
// Everything is ordinary destructible matter, built like the real thing (slabs, columns, shells) so cuts and
// collapses read right.
import type { Rng } from '../core/rng';
import type { Builder } from './build';
import { stampText, textWidth } from './glyphs';
import { tree } from './testArena';

export type Lot = { x0: number; z0: number; x1: number; z1: number; face: 'n' | 's' | 'e' | 'w' };
export type Span = [number, number];

/**
 * A lot's own frame: u runs along the street front, w goes back from it (w = 0 at the street). `box` fills a local
 * box [u0,u1)×[y0,y1)×[w0,w1) in world voxels; `pt` maps a local point.
 */
export function lotFrame(lot: Lot) {
  const { x0, z0, x1, z1, face } = lot;
  const alongX = face === 'n' || face === 's';
  const W = alongX ? x1 - x0 : z1 - z0;
  const D = alongX ? z1 - z0 : x1 - x0;
  const box = (b: Builder, u0: number, y0: number, w0: number, u1: number, y1: number, w1: number, mat: number) => {
    if (face === 'n') b.box(x0 + u0, y0, z0 + w0, x0 + u1, y1, z0 + w1, mat);
    else if (face === 's') b.box(x1 - u1, y0, z1 - w1, x1 - u0, y1, z1 - w0, mat);
    else if (face === 'w') b.box(x0 + w0, y0, z1 - u1, x0 + w1, y1, z1 - u0, mat);
    else b.box(x1 - w1, y0, z0 + u0, x1 - w0, y1, z0 + u1, mat);
  };
  const pt = (u: number, w: number): [number, number] =>
    face === 'n' ? [x0 + u, z0 + w] : face === 's' ? [x1 - u, z1 - w] : face === 'w' ? [x0 + w, z1 - u] : [x1 - w, z0 + u];
  /** the world voxel of the local cell [u, u+1)×[w, w+1) (what `box` fills for it) */
  const cell = (u: number, w: number): [number, number] =>
    face === 'n' ? [x0 + u, z0 + w] : face === 's' ? [x1 - u - 1, z1 - w - 1] : face === 'w' ? [x0 + w, z1 - u - 1] : [x1 - w - 1, z0 + u];
  return { W, D, box, pt, cell, alongX };
}

/** A concrete footing under a footprint, `depthM` into the ground. */
export function foundation(b: Builder, x0: number, z0: number, x1: number, z1: number, G: number, depthM = 1.2): void {
  b.box(x0, G - b.v(depthM), z0, x1, G - 1, z1, b.id('concrete_dark'));
}

// ------------------------------------------------------------------------------------------- under the streets

/**
 * Box conduits under the road centre lines (2.5 m wide, 2.5 m tall, 2.6 m below the asphalt), walkways either side
 * of a water channel; where two runs cross they open into each other. Manhole shafts every ~26 m rise to an iron lid
 * in the road, rungs up one wall.
 */
export function sewers(b: Builder, G: number, roadsX: Span[], roadsZ: Span[], zEnd: number, S: number): void {
  const v = (m: number) => b.v(m);
  const shell = b.id('concrete_dark'), floor = b.id('concrete'), water = b.id('water'), rung = b.id('metal'), lid = b.id('manhole');
  const hw = v(1.25), top = G - v(2.6), bot = top - v(2.5), t = 2;
  type Run = ['x' | 'z', number, number, number];
  const runs: Run[] = [
    ...roadsZ.map(([z0, z1]): Run => ['x', (z0 + z1) >> 1, v(3), S - v(3)]),
    ...roadsX.map(([x0, x1]): Run => ['z', (x0 + x1) >> 1, v(3), zEnd]),
  ];
  const box = (ax: 'x' | 'z', c: number, a0: number, a1: number, y0: number, y1: number, half: number, mat: number) =>
    ax === 'x' ? b.box(a0, y0, c - half, a1, y1, c + half, mat) : b.box(c - half, y0, a0, c + half, y1, a1, mat);
  // every shell first, then every inside, so the crossings open into each other
  for (const [ax, c, a0, a1] of runs) box(ax, c, a0 - t, a1 + t, bot - t, top + t, hw + t, shell);
  for (const [ax, c, a0, a1] of runs) {
    box(ax, c, a0, a1, bot, top, hw, 0);
    box(ax, c, a0, a1, bot, bot + 2, hw, floor);
    box(ax, c, a0, a1, bot + 1, bot + 2, v(0.45), water);
  }
  for (const [ax, c, a0, a1] of runs)
    for (let a = a0 + v(10); a < a1 - v(4); a += v(26)) {
      const off = hw - v(0.7);
      const [mx, mz] = ax === 'x' ? [a, c + off] : [c + off, a];
      b.box(mx - 4, top, mz - 4, mx + 4, G - 2, mz + 4, shell);
      b.box(mx - 3, top - 1, mz - 3, mx + 3, G - 2, mz + 3, 0);
      b.box(mx - 3, G - 2, mz - 3, mx + 3, G, mz + 3, lid);
      for (let y = top; y < G - 3; y += 3) b.box(mx - 2, y, mz + 2, mx + 2, y + 1, mz + 3, rung);
    }
}

// ------------------------------------------------------------------------------------------- street furniture

/** A street lamp on the sidewalk at (x, z), its arm reaching over the road along (dx, dz). */
export function streetLamp(b: Builder, x: number, z: number, y: number, dx: number, dz: number): void {
  const v = (m: number) => b.v(m);
  const pole = b.id('metal'), dark = b.id('metal_dark'), lamp = b.id('lamp');
  const h = v(6.4);
  b.box(x - 1, y, z - 1, x + 1, y + v(0.5), z + 1, b.id('concrete'));
  b.box(x - 1, y, z - 1, x + 1, y + h, z + 1, pole);
  const L = v(1.7);
  for (let i = 0; i <= L; i++) b.box(x + dx * i - 1, y + h - 1, z + dz * i - 1, x + dx * i + 1, y + h + 1, z + dz * i + 1, pole);
  const hx = x + dx * L, hz = z + dz * L;
  b.box(hx - 2, y + h - 2, hz - 2, hx + 2, y + h - 1, hz + 2, lamp);
  b.box(hx - 2, y + h - 1, hz - 2, hx + 2, y + h + 1, hz + 2, dark);
}

/**
 * A traffic light at a corner: a pole, an arm over the road along (dx, dz) and a horizontal signal head (green lit,
 * amber and red dark) facing the oncoming lane.
 */
export function trafficLight(b: Builder, x: number, z: number, y: number, dx: number, dz: number): void {
  const v = (m: number) => b.v(m);
  const pole = b.id('metal'), box = b.id('metal_dark');
  const h = v(5.2), L = v(3.4);
  b.box(x - 1, y, z - 1, x + 1, y + h + 2, z + 1, pole);
  for (let i = 0; i <= L; i++) b.box(x + dx * i - 1, y + h, z + dz * i - 1, x + dx * i + 1, y + h + 2, z + dz * i + 1, pole);
  // the head: 10 long (across the arm's end), 4 tall, hanging under the arm
  const cx = x + dx * (L - 4), cz = z + dz * (L - 4);
  const across = dx !== 0 ? 'z' : 'x';
  const hb = (a0: number, a1: number, y0: number, y1: number, d0: number, d1: number, m: number) =>
    across === 'z' ? b.box(cx + d0, y0, cz + a0, cx + d1, y1, cz + a1, m) : b.box(cx + a0, y0, cz + d0, cx + a1, y1, cz + d1, m);
  hb(-6, 6, y + h - 4, y + h, -1, 1, box);
  hb(-5, -2, y + h - 3, y + h - 1, -2, -1, b.id('signal_green'));
  hb(-1, 1, y + h - 3, y + h - 1, -2, -1, b.id('paint_yellow'));
  hb(2, 5, y + h - 3, y + h - 1, -2, -1, b.id('paint_red'));
  hb(-5, -2, y + h - 3, y + h - 1, 1, 2, b.id('signal_green'));
  hb(-1, 1, y + h - 3, y + h - 1, 1, 2, b.id('paint_yellow'));
  hb(2, 5, y + h - 3, y + h - 1, 1, 2, b.id('paint_red'));
}

/** A bus stop on the sidewalk: a roofed bench and the round sign on its pole. `alongX`: the kerb runs along x. */
export function busStop(b: Builder, x: number, z: number, y: number, alongX: boolean): void {
  const v = (m: number) => b.v(m);
  const metal = b.id('metal'), roof = b.id('roof_metal'), wood = b.id('wood'), glass = b.id('glass');
  const bx = (u0: number, y0: number, w0: number, u1: number, y1: number, w1: number, m: number) =>
    alongX ? b.box(x + u0, y + y0, z + w0, x + u1, y + y1, z + w1, m) : b.box(x + w0, y + y0, z + u0, x + w1, y + y1, z + u1, m);
  bx(-12, 0, 0, -10, v(2.4), 2, metal);
  bx(10, 0, 0, 12, v(2.4), 2, metal);
  bx(-13, v(2.4), -3, 13, v(2.4) + 1, 6, roof);
  bx(-10, 0, 0, 10, v(2.2), 1, glass);
  bx(-9, v(0.45), 2, 9, v(0.55), 5, wood);
  bx(-9, 0, 3, -8, v(0.45), 4, metal);
  bx(8, 0, 3, 9, v(0.45), 4, metal);
  // the sign
  bx(15, 0, 4, 16, v(2.6), 5, metal);
  bx(13, v(2.2), 4, 18, v(2.9), 5, b.id('paint_blue'));
  bx(14, v(2.35), 3, 17, v(2.75), 4, b.id('paint_white'));
}

/**
 * A parked car (4.3 × 1.75 × 1.45 m): body, glasshouse with pillars, wheels, lights. Centre (x, z) on the surface y;
 * `alongX` its length along x, `flip` turns it round.
 */
export function car(b: Builder, x: number, z: number, y: number, alongX: boolean, paint: number, flip = false): void {
  const s = flip ? -1 : 1;
  const bx = (u0: number, y0: number, w0: number, u1: number, y1: number, w1: number, m: number) => {
    const a = Math.min(u0 * s, u1 * s), c = Math.max(u0 * s, u1 * s);
    if (alongX) b.box(x + a, y + y0, z + w0, x + c, y + y1, z + w1, m);
    else b.box(x + w0, y + y0, z + a, x + w1, y + y1, z + c, m);
  };
  const dark = b.id('metal_dark'), tire = b.id('tire'), glass = b.id('window');
  // body: underbody, the sills to the beltline, the hood and boot sloping a little
  bx(-16, 1, -6, 17, 2, 6, dark);
  bx(-17, 2, -7, 17, 6, 7, paint);
  bx(-16, 6, -7, 15, 7, 7, paint);
  // the glasshouse: dark glass with the roof and pillars in body colour
  bx(-9, 7, -6, 9, 11, 6, glass);
  bx(-8, 11, -6, 8, 12, 6, paint);
  for (const u of [-9, -1, 8]) {
    bx(u, 7, -6, u + 1, 11, -5, paint);
    bx(u, 7, 5, u + 1, 11, 6, paint);
  }
  // wheels in their arches
  for (const u of [-12, 7]) {
    bx(u, 0, -7, u + 5, 4, -5, tire);
    bx(u, 0, 5, u + 5, 4, 7, tire);
  }
  // lights, bumpers
  bx(16, 4, -6, 17, 6, -3, b.id('lamp'));
  bx(16, 4, 3, 17, 6, 6, b.id('lamp'));
  bx(-17, 4, -6, -16, 6, -3, b.id('sign_red'));
  bx(-17, 4, 3, -16, 6, 6, b.id('sign_red'));
  bx(17, 2, -6, 18, 4, 6, dark);
  bx(-18, 2, -6, -17, 4, 6, dark);
}

export const CAR_PAINTS = ['paint_white', 'paint_white', 'car_silver', 'car_silver', 'metal_dark', 'paint_red', 'paint_blue', 'paint_yellow'];

// ------------------------------------------------------------------------------------------- roofs

/** A hip roof (寄棟): rings stepping in on all four sides, two voxels thick so each sits on the one below. */
export function hipRoof(b: Builder, x0: number, z0: number, x1: number, z1: number, y: number, mat: number, over = 4): void {
  const cap = b.id('kawara');
  let yy = y;
  for (let k = 0; ; k++) {
    const ax0 = x0 - over + k, ax1 = x1 + over - k, az0 = z0 - over + k, az1 = z1 + over - k;
    if (ax1 - ax0 < 3 || az1 - az0 < 3) {
      // the ridge
      if (ax1 - ax0 > 0 && az1 - az0 > 0) b.box(ax0, yy, az0, ax1, yy + 2, az1, cap);
      break;
    }
    yy = y + Math.floor(k * 0.55);
    b.box(ax0, yy, az0, ax1, yy + 2, az0 + 1, mat);
    b.box(ax0, yy, az1 - 1, ax1, yy + 2, az1, mat);
    b.box(ax0, yy, az0, ax0 + 1, yy + 2, az1, mat);
    b.box(ax1 - 1, yy, az0, ax1, yy + 2, az1, mat);
  }
}

// ------------------------------------------------------------------------------------------- buildings

/**
 * An office tower on the main road (7-12 floors): a parking basement under the street, floor slabs on a column grid,
 * a blue curtain wall with lit bays, cladding bands at each floor, the concrete core rising through the roof, a
 * parapet with plant and a mast. Inset from the lot by 1.5 m.
 */
export function office(b: Builder, lot: Lot, G: number, rng: Rng, floorsOverride?: number): void {
  const v = (m: number) => b.v(m);
  const x0 = lot.x0 + v(1.5), z0 = lot.z0 + v(1.5), x1 = lot.x1 - v(1.5), z1 = lot.z1 - v(1.5);
  const floors = floorsOverride ?? rng.int(7, 12), storey = v(3.4), h = floors * storey;
  const slab = b.id('concrete'), clad = b.id(rng.pick(['cladding', 'concrete', 'tile_white', 'cladding'])), glass = b.id('glass_office');
  const lit = b.id('window_lit'), dark = b.id('metal_dark'), metal = b.id('metal');
  // basement: a parking level under the street, columns on a grid
  const bd = v(3.2);
  b.box(x0 - 1, G - bd - v(0.8), z0 - 1, x1 + 1, G, z1 + 1, b.id('concrete_dark'));
  b.box(x0 + 1, G - bd, z0 + 1, x1 - 1, G - 2, z1 - 1, 0);
  for (let x = x0 + v(3); x < x1 - v(2); x += v(5)) for (let z = z0 + v(3); z < z1 - v(2); z += v(5)) b.box(x, G - bd, z, x + 3, G - 2, z + 3, slab);
  // slabs and the curtain wall
  for (let f = 0; f <= floors; f++) b.box(x0, G + f * storey, z0, x1, G + f * storey + 2, z1, slab);
  b.walls(x0, G + 2, z0, x1, G + h, z1, 2, glass);
  // lit bays, here and there
  const bay = v(4);
  for (let f = 1; f < floors; f++) {
    const y0 = G + f * storey + 2, y1 = G + (f + 1) * storey;
    for (let x = x0 + 2; x < x1 - 2; x += bay) {
      if (rng.chance(0.18)) b.box(x, y0, z0, Math.min(x + bay, x1 - 2), y1, z0 + 2, lit);
      if (rng.chance(0.18)) b.box(x, y0, z1 - 2, Math.min(x + bay, x1 - 2), y1, z1, lit);
    }
    for (let z = z0 + 2; z < z1 - 2; z += bay) {
      if (rng.chance(0.18)) b.box(x0, y0, z, x0 + 2, y1, Math.min(z + bay, z1 - 2), lit);
      if (rng.chance(0.18)) b.box(x1 - 2, y0, z, x1, y1, Math.min(z + bay, z1 - 2), lit);
    }
  }
  // columns at the corners and every 4 m, flush with the glass
  const cols = (a0: number, a1: number) => {
    const out = [a0];
    for (let a = a0 + bay; a < a1 - v(2); a += bay) out.push(a);
    out.push(a1 - 2);
    return out;
  };
  for (const x of cols(x0, x1)) {
    b.box(x, G, z0, x + 2, G + h, z0 + 2, clad);
    b.box(x, G, z1 - 2, x + 2, G + h, z1, clad);
  }
  for (const z of cols(z0, z1)) {
    b.box(x0, G, z, x0 + 2, G + h, z + 2, clad);
    b.box(x1 - 2, G, z, x1, G + h, z + 2, clad);
  }
  // cladding bands at every floor line, proud of the glass
  for (let f = 1; f <= floors; f++) b.walls(x0 - 1, G + f * storey - 1, z0 - 1, x1 + 1, G + f * storey + 2, z1 + 1, 1, clad);
  // the core: stairs and lifts, a penthouse on the roof
  const cx = (x0 + x1) >> 1, cz = (z0 + z1) >> 1, cr = v(1.9);
  b.walls(cx - cr, G, cz - cr, cx + cr, G + h + v(3), cz + cr, 2, slab);
  b.box(cx - cr, G + h + v(3), cz - cr, cx + cr, G + h + v(3) + 2, cz + cr, slab);
  // lobby: clear glass on the street side, a canopy
  const { box, W } = lotFrame({ x0, z0, x1, z1, face: lot.face });
  box(b, v(1.5), G + 2, 0, W - v(1.5), G + storey, 2, b.id('glass'));
  box(b, v(2.5), G + v(2.8), -v(1.6), W - v(2.5), G + v(2.8) + 2, 0, slab);
  // roof: parapet, plant, a water tank, the mast with its warning light
  const top = G + h + 2;
  b.walls(x0, top, z0, x1, top + v(1), z1, 2, clad);
  for (let i = 0; i < 3; i++) {
    const px = rng.int(x0 + v(1.5), x1 - v(3.5)), pz = rng.int(z0 + v(1.5), z1 - v(3.5));
    if (Math.abs(px - cx) < cr + v(2.5) && Math.abs(pz - cz) < cr + v(2.5)) continue;
    b.box(px, top, pz, px + v(2), top + v(1.4), pz + v(1.5), metal);
    b.box(px + 2, top + v(1.4), pz + 2, px + v(2) - 2, top + v(1.6), pz + v(1.5) - 2, dark);
  }
  const mx = x1 - v(2), mz = z1 - v(2);
  b.box(mx, top, mz, mx + 2, top + v(6), mz + 2, metal);
  b.box(mx - 1, top + v(6), mz - 1, mx + 3, top + v(6) + 2, mz + 3, b.id('sign_red'));
}

/**
 * The konbini: a one-storey store at the back of its lot, all glass at the front under the three-stripe sign band,
 * shelves inside, a striped parking apron, vending machines by the door.
 */
export function konbini(b: Builder, lot: Lot, G: number, rng: Rng): void {
  const v = (m: number) => b.v(m);
  const { W, D, box } = lotFrame(lot);
  const wall = b.id('tile_white'), slab = b.id('concrete'), glass = b.id('glass'), frame = b.id('metal_dark');
  const brands = [['sign_orange', 'sign_green', 'sign_red'], ['paint_blue', 'sign_white', 'paint_blue'], ['sign_green', 'sign_white', 'sign_blue']];
  const [s1, s2, s3] = rng.pick(brands).map((n) => b.id(n));
  const sw = Math.min(W - v(2), v(13)), u0 = (W - sw) >> 1, u1 = u0 + sw;
  const w1 = D - v(1), w0 = Math.max(v(5), w1 - v(9));
  const H = v(3.6);
  // apron
  box(b, 1, G - 2, 1, W - 1, G, w0, b.id('asphalt'));
  for (let u = u0; u <= u1; u += v(2.6)) box(b, u, G - 1, v(0.6), u + 1, G, w0 - v(0.8), b.id('road_white'));
  // the store
  box(b, u0 - 1, G - v(1), w0 - 1, u1 + 1, G + 2, w1 + 1, slab);
  box(b, u0, G + 2, w0, u0 + 2, G + H, w1, wall);
  box(b, u1 - 2, G + 2, w0, u1, G + H, w1, wall);
  box(b, u0, G + 2, w1 - 2, u1, G + H, w1, wall);
  box(b, u0, G + 2, w0, u1, G + v(2.7), w0 + 2, glass);
  for (let u = u0 + v(2); u < u1 - 2; u += v(2)) box(b, u, G + 2, w0, u + 1, G + v(2.7), w0 + 2, frame);
  box(b, u0 + (sw >> 1) - v(0.9), G + 2, w0, u0 + (sw >> 1) + v(0.9), G + v(2.4), w0 + 2, 0);
  // the sign band
  box(b, u0, G + v(2.7), w0 - 1, u1, G + H, w0 + 2, b.id('sign_white'));
  box(b, u0, G + v(2.8), w0 - 1, u1, G + v(2.8) + 2, w0, s1);
  box(b, u0, G + v(3.05), w0 - 1, u1, G + v(3.05) + 2, w0, s2);
  box(b, u0, G + v(3.3), w0 - 1, u1, G + v(3.3) + 2, w0, s3);
  // roof and parapet
  box(b, u0, G + H, w0, u1, G + H + 2, w1, slab);
  box(b, u0, G + H + 2, w0, u1, G + H + v(0.7), w0 + 1, wall);
  box(b, u0, G + H + 2, w1 - 1, u1, G + H + v(0.7), w1, wall);
  // shelves seen through the glass
  for (let w = w0 + v(2.2); w < w1 - v(2); w += v(1.8)) {
    box(b, u0 + v(1.5), G + 2, w, u1 - v(1.5), G + v(1.5), w + 3, b.id('metal'));
    box(b, u0 + v(1.5), G + v(1.5), w, u1 - v(1.5), G + v(1.5) + 1, w + 3, b.id(rng.pick(['sign_red', 'sign_yellow', 'sign_blue', 'sign_green'])));
  }
  // vending machines and a bin by the door
  box(b, u1 + 1, G, w0 + 1, Math.min(W - 1, u1 + v(1.1)), G + v(1.8), w0 + v(0.8), b.id('vending'));
  box(b, u0 - v(1.1), G, w0 + 1, u0 - 1, G + v(1.8), w0 + v(0.8), b.id('vending'));
  // a car or two on the apron
  const [ax, az] = lotFrame(lot).pt(u0 + v(2.2), (w0 >> 1) + 1);
  if (w0 > v(5.5) && rng.chance(0.8)) car(b, ax, az, G, !lotFrame(lot).alongX, b.id(rng.pick(CAR_PAINTS)));
}

/**
 * Urahara Shop (浦原商店): a small old wooden shop of one storey and a loft, sliding doors across the front under the
 * big white sign board, a tiled gable roof, and the bare earth yard in front where Jinta and Ururu sweep.
 */
export function uraharaShop(b: Builder, lot: Lot, G: number): [number, number] {
  const v = (m: number) => b.v(m);
  const { W, D, box } = lotFrame(lot);
  const wood = b.id('wood_dark'), plaster = b.id('plaster_cream'), shoji = b.id('shoji'), slab = b.id('stone');
  const sw = Math.min(W - v(1.5), v(10)), u0 = (W - sw) >> 1, u1 = u0 + sw;
  const w1 = D - v(1), w0 = Math.max(v(4.5), w1 - v(7.5));
  const H = v(4.2);
  // the yard: bare earth, a low wooden fence along the street with the gap
  box(b, 1, G - 1, 1, W - 1, G, w0, b.id('clay'));
  box(b, 1, G, 1, u0 + v(1), G + v(1), 2, b.id('wood'));
  box(b, u1 - v(1), G, 1, W - 1, G + v(1), 2, b.id('wood'));
  // footing and floor
  box(b, u0 - 1, G - v(1), w0 - 1, u1 + 1, G + 2, w1 + 1, slab);
  // walls: dark timber below, cream plaster above; posts at the corners
  box(b, u0, G + 2, w0, u0 + 2, G + H, w1, wood);
  box(b, u1 - 2, G + 2, w0, u1, G + H, w1, wood);
  box(b, u0, G + 2, w1 - 2, u1, G + H, w1, wood);
  box(b, u0, G + v(2.6), w0, u0 + 2, G + H, w1, plaster);
  box(b, u1 - 2, G + v(2.6), w0, u1, G + H, w1, plaster);
  box(b, u0, G + v(2.6), w1 - 2, u1, G + H, w1, plaster);
  // the front: sliding doors of shoji panes in dark frames, the loft's plaster above
  box(b, u0, G + 2, w0, u1, G + v(2.4), w0 + 2, shoji);
  for (let u = u0; u < u1; u += v(0.9)) box(b, u, G + 2, w0, u + 1, G + v(2.4), w0 + 2, wood);
  box(b, u0, G + v(1.2), w0, u1, G + v(1.2) + 1, w0 + 2, wood);
  box(b, u0, G + v(2.4), w0, u1, G + H, w0 + 2, plaster);
  // the sign board over the door: 浦原商店 in dark wood on white, in a dark frame
  const name = '浦原商店', tw = textWidth(name, 1);
  const mid = (u0 + u1) >> 1, sb0 = mid - (tw >> 1) - 2, sb1 = mid + (tw >> 1) + 3;
  const by0 = G + v(2.45), by1 = by0 + 16;
  box(b, sb0 - 1, by0 - 1, w0 - 2, sb1 + 1, by1 + 1, w0, wood);
  box(b, sb0, by0, w0 - 3, sb1, by1, w0 - 2, b.id('paint_white'));
  const { cell } = lotFrame(lot);
  stampText(b, name, b.id('wood_dark'), (c, row) => {
    const [x, z] = cell(mid + (tw >> 1) - c, w0 - 4);
    return [x, by1 - 2 - row, z];
  }, 1);
  // the roof
  gableRoofLocal(b, box, u0, w0, u1, w1, G + H, b.id('kawara'), v(0.7));
  // a bench and a broom against the wall
  box(b, u1 + v(0.4), G, w0 + v(0.6), Math.min(W - 1, u1 + v(2)), G + v(0.45), w0 + v(1.1), b.id('wood'));
  // the hatch in the floor at the back of the shop (the way down to what is under it)
  return lotFrame(lot).pt(((u0 + u1) >> 1) + v(2), w1 - v(2.2));
}

/** A gable roof in a lot frame: the ridge along u, eaves over the front and back. */
function gableRoofLocal(b: Builder, box: ReturnType<typeof lotFrame>['box'], u0: number, w0: number, u1: number, w1: number, y: number, mat: number, over: number): void {
  const span = w1 - w0;
  const half = Math.ceil(span / 2) + over;
  const gable = b.id('plaster_cream');
  for (let k = 0; k <= half; k++) {
    const yy = y + Math.floor(k * 0.6);
    box(b, u0 - over, yy, w0 - over + k, u1 + over, yy + 2, w0 - over + k + 1, mat);
    box(b, u0 - over, yy, w1 + over - k - 1, u1 + over, yy + 2, w1 + over - k, mat);
    if (k > over) {
      box(b, u0, y, w0 - over + k, u0 + 2, yy, w1 + over - k, gable);
      box(b, u1 - 2, y, w0 - over + k, u1, yy, w1 + over - k, gable);
    }
  }
  const ry = y + Math.floor(half * 0.6);
  const mid = (w0 + w1) >> 1;
  box(b, u0 - over, ry, mid - 1, u1 + over, ry + 2, mid + 1, b.id('kawara'));
}

/**
 * A shrine filling a block: gravel ground inside a low stone wall, the torii at the entrance with its rope, stone
 * lanterns along the paved approach, the worship hall on a stone base under a deep verdigris roof, the sacred tree
 * with its straw rope, a grove round the back. `lot.face` is the entrance side.
 */
export function shrine(b: Builder, lot: Lot, G: number, rng: Rng): void {
  const v = (m: number) => b.v(m);
  const { W, D, box, pt } = lotFrame(lot);
  const gravel = b.id('gravel'), path = b.id('stone_path'), stone = b.id('stone'), torii = b.id('torii'), black = b.id('wood_dark');
  const mid = W >> 1;
  // ground and wall
  box(b, 1, G - 1, 1, W - 1, G, D - 1, gravel);
  box(b, 1, G, 1, W - 1, G + v(0.9), 3, stone);
  box(b, 1, G, D - 3, W - 1, G + v(0.9), D - 1, stone);
  box(b, 1, G, 1, 3, G + v(0.9), D - 1, stone);
  box(b, W - 3, G, 1, W - 1, G + v(0.9), D - 1, stone);
  box(b, mid - v(2), G, 1, mid + v(2), G + v(1), 3, 0);
  // the approach
  const hallW1 = D - v(3), hallW0 = Math.max(v(16), hallW1 - v(11));
  box(b, mid - v(1.1), G - 1, 1, mid + v(1.1), G, hallW0, path);
  // the torii: two vermilion pillars, the tie beam through them, the black lintel curving up at the ends, the rope
  const tw = v(2.6), tH = v(5);
  const tw0 = v(2.4);
  for (const s of [-1, 1]) {
    const pu = mid + s * tw;
    box(b, pu - 2, G - 1, tw0 - 1, pu + 2, G + 1, tw0 + 3, stone);
    box(b, pu - 1, G, tw0, pu + 2, G + tH, tw0 + 2, torii);
  }
  box(b, mid - tw - v(0.6), G + v(3.9), tw0, mid + tw + v(0.6) + 1, G + v(3.9) + 3, tw0 + 2, torii);
  box(b, mid - tw - v(1.3), G + tH, tw0 - 1, mid + tw + v(1.3) + 1, G + tH + 2, tw0 + 3, torii);
  box(b, mid - tw - v(1.5), G + tH + 2, tw0 - 1, mid + tw + v(1.5) + 1, G + tH + 4, tw0 + 3, black);
  box(b, mid - tw - v(1.5), G + tH + 4, tw0 - 1, mid - tw - v(1.2), G + tH + 5, tw0 + 3, black);
  box(b, mid + tw + v(1.2) + 1, G + tH + 4, tw0 - 1, mid + tw + v(1.5) + 1, G + tH + 5, tw0 + 3, black);
  box(b, mid - 1, G + v(3.9) + 3, tw0, mid + 2, G + tH, tw0 + 2, torii);
  box(b, mid - tw + 2, G + v(3.5), tw0 - 1, mid + tw - 1, G + v(3.5) + 2, tw0, b.id('shimenawa'));
  for (const s of [-1, 0, 1]) box(b, mid + s * v(1.2), G + v(3.0), tw0 - 1, mid + s * v(1.2) + 1, G + v(3.5), tw0, b.id('paint_white'));
  // stone lanterns in pairs along the approach
  for (let w = v(7); w < hallW0 - v(3); w += v(5)) {
    for (const s of [-1, 1]) {
      const lu = mid + s * v(2.6);
      box(b, lu - 2, G, w - 2, lu + 2, G + 2, w + 2, stone);
      box(b, lu - 1, G + 2, w - 1, lu + 1, G + v(0.9), w + 1, stone);
      box(b, lu - 2, G + v(0.9), w - 2, lu + 2, G + v(1.35), w + 2, b.id('lantern'));
      box(b, lu - 3, G + v(1.35), w - 3, lu + 3, G + v(1.35) + 2, w + 3, stone);
      box(b, lu - 1, G + v(1.35) + 2, w - 1, lu + 1, G + v(1.35) + 4, w + 1, stone);
    }
  }
  // the hall: stone base, raised floor, vermilion posts, timber and paper walls, steps, the offering box
  const hw = v(5.2), hu0 = mid - hw, hu1 = mid + hw;
  const base = G + v(0.8);
  box(b, hu0 - v(1), G, hallW0 - v(1), hu1 + v(1), base, hallW1 + 1, stone);
  box(b, hu0, base, hallW0, hu1, base + 2, hallW1, b.id('wood_light'));
  for (const u of [hu0, hu0 + v(3.4), hu1 - v(3.4) - 2, hu1 - 2]) {
    box(b, u, base + 2, hallW0, u + 2, base + v(3.4), hallW0 + 2, torii);
    box(b, u, base + 2, hallW1 - 2, u + 2, base + v(3.4), hallW1, torii);
  }
  box(b, hu0, base + 2, hallW0 + 2, hu0 + 2, base + v(3.4), hallW1 - 2, b.id('wood'));
  box(b, hu1 - 2, base + 2, hallW0 + 2, hu1, base + v(3.4), hallW1 - 2, b.id('wood'));
  box(b, hu0 + 2, base + 2, hallW1 - 2, hu1 - 2, base + v(3.4), hallW1, b.id('wood'));
  box(b, hu0 + 2, base + v(0.6), hallW0, hu1 - 2, base + v(3.0), hallW0 + 1, b.id('shoji'));
  box(b, hu0, base + v(3.0), hallW0, hu1, base + v(3.4), hallW0 + 2, torii);
  for (let k = 0; k < 6; k++) box(b, mid - v(1.6), G + k, hallW0 - v(1.4) + k, mid + v(1.6), G + k + 1, hallW0, stone);
  box(b, mid - v(0.8), base + 2, hallW0 - v(0.9), mid + v(0.8), base + v(0.8), hallW0 - 2, black);
  // the bell rope
  box(b, mid - 1, base + v(1.4), hallW0 - 3, mid + 1, base + v(3.2), hallW0 - 2, b.id('shimenawa'));
  // the deep roof: a hip roof in verdigris copper, a black ridge
  const [rx0, rz0] = pt(hu0, hallW0), [rx1, rz1] = pt(hu1, hallW1);
  hipRoof(b, Math.min(rx0, rx1), Math.min(rz0, rz1), Math.max(rx0, rx1), Math.max(rz0, rz1), base + v(3.4), b.id('copper_green'), v(1.4));
  // the sacred tree with its straw rope, and the grove behind
  const [sx, sz] = pt(hu1 + v(4), hallW0 - v(2));
  if (hu1 + v(5) < W - v(1)) {
    b.cylinderY(sx, sz, G, G + v(7), v(0.55), b.id('bark'));
    b.cylinderY(sx, sz, G + v(1.6), G + v(1.9), v(0.75), b.id('shimenawa'));
    for (let i = 0; i < 9; i++) {
      const r = v(rng.range(1.8, 2.6));
      b.ellipsoid(sx + rng.range(-1, 1) * v(2.2), G + v(7.5) + rng.range(-1, 1) * v(1.2), sz + rng.range(-1, 1) * v(2.2), r, r * 0.75, r, b.id('leaves'), true);
    }
  }
  for (let i = 0; i < 10; i++) {
    const u = rng.chance(0.5) ? rng.int(v(2), Math.max(v(2.5), hu0 - v(2))) : rng.int(Math.min(W - v(2.5), hu1 + v(2)), W - v(2));
    const w = rng.int(v(8), D - v(3));
    const [tx, tz] = pt(u, w);
    tree(b, tx, G, tz, rng);
  }
}

/** A carport beside a house: four posts and a flat roof, a car under it. */
export function carport(b: Builder, x0: number, z0: number, x1: number, z1: number, G: number, alongX: boolean, rng: Rng): void {
  const v = (m: number) => b.v(m);
  const metal = b.id('metal'), roof = b.id('roof_metal');
  for (const [px, pz] of [[x0, z0], [x1 - 2, z0], [x0, z1 - 2], [x1 - 2, z1 - 2]]) b.box(px, G, pz, px + 2, G + v(2.3), pz + 2, metal);
  b.box(x0 - 1, G + v(2.3), z0 - 1, x1 + 1, G + v(2.3) + 1, z1 + 1, roof);
  b.box(x0, G - 1, z0, x1, G, z1, b.id('concrete'));
  car(b, (x0 + x1) >> 1, (z0 + z1) >> 1, G, alongX, b.id(rng.pick(CAR_PAINTS)), rng.chance(0.5));
}
