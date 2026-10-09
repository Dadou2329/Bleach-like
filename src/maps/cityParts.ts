// Karakura v3 parts (voxel units, 8 vox/m; G is the street level, the first voxel of air above the grass): the
// elevated railway with its station, platforms and a train standing at them; the city around it (the department
// store, Karakura General Hospital, a multi-storey car park, a petrol station, a construction site with its tower
// crane, warehouses, a smokestack and tanks on the far bank); pylons and their lines over the river; footbridges over
// the avenues; street furniture (curve mirrors, phone booths, hydrants, guard rails, street trees, bicycles, stop
// signs, a police box); vans, lorries, buses and taxis; and, deep under Urahara Shop, the underground training ground.
// Everything is ordinary destructible matter, built like the real thing so cuts and collapses read right.
import type { Rng } from '../core/rng';
import type { Builder } from './build';
import { stampText, textWidth } from './glyphs';
import { car, foundation, lotFrame, type Lot, type Span } from './townParts';

export type Block = { x0: number; z0: number; x1: number; z1: number };

// ------------------------------------------------------------------------------------------- the railway

export interface Railway {
  /** the road under the deck (z, voxels) */
  z0: number;
  z1: number;
  /** top of the concrete deck */
  deck: number;
  /** rail-head height */
  railTop: number;
  /** track centre lines (z) */
  tracks: [number, number];
}

/**
 * The elevated line over an east-west road, end to end: a concrete deck 7 m up on piers standing in the median (none
 * inside the crossings, `gaps`), parapets, two ballasted tracks on sleepers, catenary portals and their wires.
 */
export function railViaduct(b: Builder, z0: number, z1: number, S: number, G: number, gaps: Span[]): Railway {
  const v = (m: number) => b.v(m);
  const conc = b.id('concrete'), dark = b.id('concrete_dark'), ballast = b.id('gravel_dark'), rail = b.id('rail');
  const metal = b.id('metal'), wire = b.id('wire');
  const zc = (z0 + z1) >> 1;
  const d0 = G + v(7.2), deck = d0 + v(1);
  const e0 = z0 - 4, e1 = z1 + 4;
  // the median the piers stand in, broken at the crossings
  let m0 = 0;
  for (const [a, c] of [...gaps, [S, S] as Span].sort((p, q) => p[0] - q[0])) {
    if (a > m0) b.box(m0, G - 1, zc - v(1), a, G + 1, zc + v(1), b.id('curb'));
    m0 = Math.max(m0, c);
  }
  // deck, edge girders, parapets
  b.box(0, d0, e0, S, deck, e1, conc);
  b.box(0, d0 - v(0.6), e0, S, d0, e0 + 3, conc);
  b.box(0, d0 - v(0.6), e1 - 3, S, d0, e1, conc);
  b.box(0, deck, e0, S, deck + v(1.1), e0 + 2, conc);
  b.box(0, deck, e1 - 2, S, deck + v(1.1), e1, conc);
  // piers on footings, a cross-head under the deck
  for (let x = v(6); x < S - v(4); x += v(18)) {
    if (gaps.some(([a, c]) => x > a - v(3) && x < c + v(3))) continue;
    b.box(x - v(1.3), G - v(3.5), zc - v(1.3), x + v(1.3), G - 2, zc + v(1.3), dark);
    b.box(x - 7, G - 2, zc - 6, x + 7, d0, zc + 6, conc);
    b.box(x - 7, d0 - v(1.4), e0 + 6, x + 7, d0, e1 - 6, conc);
  }
  // two tracks: ballast, sleepers, rails
  const t1 = zc - v(2.2), t2 = zc + v(2.2);
  const railTop = deck + 4;
  for (const t of [t1, t2]) {
    b.box(0, deck, t - v(1.6), S, deck + 2, t + v(1.6), ballast);
    for (let x = 2; x < S - 2; x += 5) b.box(x, deck + 2, t - v(1.2), x + 2, deck + 3, t + v(1.2), conc);
    b.box(0, deck + 2, t - 5, S, railTop, t - 4, rail);
    b.box(0, deck + 2, t + 4, S, railTop, t + 5, rail);
  }
  // catenary portals and the contact and messenger wires over each track
  const cw = railTop + v(5.1);
  for (let x = v(10); x < S - v(4); x += v(30)) {
    b.box(x, deck + v(1.1), e0, x + 2, cw + v(1), e0 + 2, metal);
    b.box(x, deck + v(1.1), e1 - 2, x + 2, cw + v(1), e1, metal);
    b.box(x, cw + v(0.8), e0, x + 2, cw + v(1), e1, metal);
    for (const t of [t1, t2]) b.box(x, cw + 1, t, x + 2, cw + v(0.8), t + 1, metal);
  }
  for (const t of [t1, t2]) {
    b.box(0, cw, t, S, cw + 1, t + 1, wire);
    b.box(0, cw + v(0.6), t, S, cw + v(0.6) + 1, t + 1, wire);
  }
  return { z0, z1, deck, railTop, tracks: [t1, t2] };
}

/**
 * The station's platforms on the viaduct between x0 and x1: the deck widened out over the pavements, a platform on
 * each side at carriage-floor height with its yellow tactile line, canopies on a row of columns, benches and the
 * station's name boards. Returns the platform top.
 */
export function stationPlatforms(b: Builder, r: Railway, x0: number, x1: number): number {
  const v = (m: number) => b.v(m);
  const conc = b.id('concrete'), pave = b.id('pavement'), yellow = b.id('paint_yellow'), metal = b.id('metal');
  const roof = b.id('roof_metal'), wood = b.id('wood'), sign = b.id('sign_white'), dark = b.id('metal_dark');
  const [t1, t2] = r.tracks;
  const top = r.railTop + v(1);
  const sides: [number, number, number][] = [
    [r.z0 - v(2.5), t1 - v(1.5), -1],
    [t2 + v(1.5), r.z1 + v(2.5), 1],
  ];
  for (const [a, c, s] of sides) {
    b.box(x0, r.deck - v(1), a, x1, top, c, conc);
    b.box(x0, top - 1, a, x1, top, c, pave);
    const edge = s < 0 ? c - 4 : a + 1;
    b.box(x0, top - 1, edge, x1, top, edge + 3, yellow);
    // the outer railing
    const outer = s < 0 ? a : c - 1;
    b.box(x0, top, outer, x1, top + v(1.1), outer + 1, metal);
    // the canopy: columns down the middle, a roof sloping a little toward the track
    const mid = (a + c) >> 1;
    for (let x = x0 + v(3); x < x1 - v(2); x += v(8)) b.box(x, top, mid - 1, x + 2, top + v(3.2), mid + 1, metal);
    b.box(x0 + v(1), top + v(3.2), a + 2, x1 - v(1), top + v(3.2) + 2, c - 2, roof);
    b.box(x0 + v(1), top + v(3.2) - 1, a + 2, x1 - v(1), top + v(3.2), a + 4, dark);
    // benches between the columns, a name board hanging under the canopy
    for (let x = x0 + v(7); x < x1 - v(6); x += v(16)) {
      b.box(x, top + v(0.4), mid + 2 * s, x + v(1.8), top + v(0.5), mid + 5 * s + (s < 0 ? 1 : 0), wood);
      b.box(x + 1, top, mid + 3 * s, x + 2, top + v(0.4), mid + 4 * s, dark);
      b.box(x + v(1.8) - 2, top, mid + 3 * s, x + v(1.8) - 1, top + v(0.4), mid + 4 * s, dark);
    }
    for (let x = x0 + v(12); x < x1 - v(10); x += v(24)) {
      b.box(x, top + v(2.2), mid - 1, x + v(2.6), top + v(2.9), mid + 1, sign);
      b.box(x + 3, top + v(2.4), mid - 2, x + v(2.6) - 3, top + v(2.7), mid + 2, b.id('sign_green'));
      b.box(x + v(1.2), top + v(2.9), mid, x + v(1.2) + 1, top + v(3.2), mid + 1, dark);
    }
  }
  return top;
}

/**
 * The station building beside the viaduct, its back to the platforms: a tall glazed hall at street level, the
 * concourse above it at platform height opening straight onto the platform, a long sign band across the front with
 * the clock, a flat roof with its parapet. `front` is the side facing the forecourt (−1: north).
 */
export function stationBuilding(b: Builder, x0: number, x1: number, zBack: number, depth: number, G: number, floorTop: number, front: -1 | 1): void {
  const v = (m: number) => b.v(m);
  const slab = b.id('concrete'), clad = b.id('cladding'), glass = b.id('glass'), tile = b.id('tile_white');
  const dark = b.id('metal_dark'), sign = b.id('sign_white'), green = b.id('sign_green');
  const zf = zBack + front * depth;
  const za = Math.min(zBack, zf), zb = Math.max(zBack, zf);
  const roofY = floorTop + v(4.4);
  foundation(b, x0 - 1, za - 1, x1 + 1, zb + 1, G, 2);
  b.box(x0, G, za, x1, G + 2, zb, slab);
  b.box(x0, floorTop - 2, za, x1, floorTop, zb, slab);
  b.box(x0, roofY, za, x1, roofY + 2, zb, slab);
  b.walls(x0, G + 2, za, x1, roofY, zb, 2, tile);
  // columns inside on an 8 m grid
  for (let x = x0 + v(8); x < x1 - v(4); x += v(8)) for (let z = za + v(5); z < zb - v(3); z += v(6)) b.box(x, G + 2, z, x + 3, roofY, z + 3, slab);
  // the front: glass from the ground to the roof between cladding piers, doors at the ground
  const fz = front < 0 ? za : zb - 2;
  b.box(x0 + v(2), G + 2, fz, x1 - v(2), roofY - v(1.6), fz + 2, glass);
  for (let x = x0 + v(2); x < x1 - v(2); x += v(4)) b.box(x, G + 2, fz - (front < 0 ? 1 : 0), x + 2, roofY, fz + 2 + (front > 0 ? 1 : 0), clad);
  const mid = (x0 + x1) >> 1;
  b.box(mid - v(4), G + 2, fz, mid + v(4), G + v(3), fz + 2, 0);
  // the sign band under the roof: white, the line colour along its foot, the name 空座町駅 in dark voxels, the clock
  const sz = front < 0 ? fz - 2 : fz + 2;
  const bandY = roofY - v(2.2);
  b.box(x0 + v(1), bandY, sz, x1 - v(1), roofY, sz + 2, sign);
  const proud = front < 0 ? sz - 1 : sz + 2;
  b.box(x0 + v(1), bandY, proud, x1 - v(1), bandY + 2, proud + 1, green);
  const name = '空座町駅', tw = textWidth(name, 3);
  // read from the forecourt: for a north front the text runs toward −x
  stampText(b, name, dark, (u, row) => [front < 0 ? mid + (tw >> 1) - u : mid - (tw >> 1) + u, roofY - 3 - row, proud], 3);
  const cx = x1 - v(5);
  b.box(cx - v(1), roofY - v(1.5), sz + (front < 0 ? -2 : 2), cx + v(1), roofY - v(0.1), sz + (front < 0 ? 0 : 4), b.id('paint_white'));
  b.box(cx, roofY - v(1.1), sz + (front < 0 ? -3 : 4), cx + 1, roofY - v(0.4), sz + (front < 0 ? -2 : 5), dark);
  b.box(cx, roofY - v(0.85), sz + (front < 0 ? -3 : 4), cx + v(0.5), roofY - v(0.75), sz + (front < 0 ? -2 : 5), dark);
  // the entrance canopy
  const cz0 = front < 0 ? fz - v(3) : fz + 2, cz1 = front < 0 ? fz : fz + 2 + v(3);
  b.box(mid - v(6), G + v(3.4), cz0, mid + v(6), G + v(3.4) + 2, cz1, slab);
  for (const px of [mid - v(6), mid + v(6) - 2]) b.box(px, G, front < 0 ? cz0 : cz1 - 2, px + 2, G + v(3.4), front < 0 ? cz0 + 2 : cz1, clad);
  // the roof: parapet, plant
  b.walls(x0, roofY + 2, za, x1, roofY + v(0.9), zb, 2, clad);
  b.box(x0 + v(3), roofY + 2, za + v(2), x0 + v(6), roofY + v(1.5), za + v(4), b.id('metal'));
}

/**
 * A commuter train standing on the track whose centre line is z = t: `cars` stainless cars with the green line band,
 * a window band broken by four doors a side, cabs at both ends, bogies on the rails, a pantograph up to the wire.
 */
export function train(b: Builder, x0: number, t: number, railTop: number, cars: number, wireY: number): void {
  const v = (m: number) => b.v(m);
  const steel = b.id('train_steel'), dark = b.id('metal_dark'), green = b.id('sign_green'), win = b.id('window');
  const tire = b.id('tire'), metal = b.id('metal'), lamp = b.id('lamp');
  const L = v(19.5), f = railTop + v(1.1), r = railTop + v(3.7);
  for (let i = 0; i < cars; i++) {
    const c0 = x0 + i * (L + 4), c1 = c0 + L;
    // bogies and wheels on the rails
    for (const bx of [c0 + v(2.6), c1 - v(2.6)]) {
      b.box(bx - v(1.3), railTop + 2, t - 6, bx + v(1.3), railTop + v(0.8), t + 6, dark);
      for (const ax of [bx - v(1), bx + v(1)]) {
        b.box(ax - 3, railTop, t - 6, ax + 3, railTop + v(0.7), t - 4, tire);
        b.box(ax - 3, railTop, t + 4, ax + 3, railTop + v(0.7), t + 6, tire);
      }
    }
    // underframe with its equipment boxes, the body shell, the floor
    b.box(c0 + 4, railTop + v(0.6), t - 11, c1 - 4, f, t + 11, dark);
    b.box(c0 + v(6), railTop + v(0.35), t - 9, c1 - v(6), railTop + v(0.6), t + 9, dark);
    b.box(c0, f, t - 12, c1, r, t - 10, steel);
    b.box(c0, f, t + 10, c1, r, t + 12, steel);
    b.box(c0, f, t - 12, c0 + 2, r, t + 12, steel);
    b.box(c1 - 2, f, t - 12, c1, r, t + 12, steel);
    b.box(c0, f - 1, t - 10, c1, f, t + 10, dark);
    // the roof, rounded at the eaves, with its cooling units
    b.box(c0, r, t - 11, c1, r + 1, t + 11, metal);
    b.box(c0 + 1, r + 1, t - 9, c1 - 1, r + 2, t + 9, metal);
    for (const u of [0.25, 0.75]) b.box(c0 + Math.round(L * u) - v(1.2), r + 2, t - 6, c0 + Math.round(L * u) + v(1.2), r + v(0.55), t + 6, b.id('paint_white'));
    // both sides: the line band, the window band, four doors
    const doors = [0.12, 0.37, 0.63, 0.88].map((u) => c0 + Math.round(L * u));
    for (const [w0, w1] of [[t - 12, t - 10], [t + 10, t + 12]]) {
      b.box(c0, f + v(0.75), w0, c1, f + v(0.95), w1, green);
      b.box(c0 + 3, f + v(1.0), w0, c1 - 3, f + v(1.95), w1, win);
      for (const d of doors) {
        b.box(d - 6, f, w0, d + 6, r - v(0.35), w1, steel);
        b.box(d - 6, f, w0, d - 5, r - v(0.35), w1, dark);
        b.box(d + 5, f, w0, d + 6, r - v(0.35), w1, dark);
        b.box(d - 4, f + v(1.0), w0, d - 1, f + v(1.85), w1, win);
        b.box(d + 1, f + v(1.0), w0, d + 4, f + v(1.85), w1, win);
      }
    }
    // the gangway to the next car
    if (i < cars - 1) b.box(c1, f + v(0.2), t - 5, c1 + 4, r - v(0.3), t + 5, dark);
    // cabs at the ends of the train: windscreen, destination sign, lamps
    for (const [end, out] of [[c0, -1], [c1 - 2, 1]] as const) {
      if ((out < 0 && i !== 0) || (out > 0 && i !== cars - 1)) continue;
      const ex = out < 0 ? end - 1 : end + 2;
      b.box(ex, f + v(1.05), t - 9, ex + 1, f + v(2.0), t + 9, win);
      b.box(ex, f + v(2.1), t - 5, ex + 1, f + v(2.4), t + 5, b.id('sign_orange'));
      b.box(ex, f + v(0.35), t - 9, ex + 1, f + v(0.6), t - 6, lamp);
      b.box(ex, f + v(0.35), t + 6, ex + 1, f + v(0.6), t + 9, lamp);
      b.box(ex, f, t - 10, ex + 1, f + v(0.3), t + 10, dark);
    }
    // the pantograph on the middle car, pressed up against the contact wire
    if (i === cars >> 1) {
      const px = c0 + (L >> 1);
      b.box(px - v(1), r + 2, t - v(0.8), px + v(1), r + 3, t + v(0.8), dark);
      b.line(px - v(0.8), r + 3, t, px + v(0.4), (r + wireY) >> 1, t, 0.5, metal);
      b.line(px + v(0.4), (r + wireY) >> 1, t, px - v(0.2), wireY - 1, t, 0.5, metal);
      b.box(px - v(0.6), wireY - 1, t - v(0.9), px + v(0.2), wireY, t + v(0.9), metal);
    }
  }
}

// ------------------------------------------------------------------------------------------- big buildings

/**
 * A department store filling its block: eight tall floors on a column grid, display windows all round the ground
 * floor, the upper floors clad in stone with vertical fins and few windows, a big vertical neon sign on the corner, the
 * name band along the top, a glass atrium entrance on the corner, a rooftop with its billboard frame and a little
 * playground behind railings.
 */
export function departmentStore(b: Builder, bk: Block, G: number, rng: Rng): void {
  const v = (m: number) => b.v(m);
  const x0 = bk.x0 + v(1.5), z0 = bk.z0 + v(1.5), x1 = bk.x1 - v(1.5), z1 = bk.z1 - v(1.5);
  const floors = 8, storey = v(4), h = floors * storey;
  const slab = b.id('concrete'), stoneClad = b.id(rng.pick(['tile_white', 'plaster_beige', 'cladding'])), fin = b.id('concrete');
  const glass = b.id('glass'), lit = b.id('window_lit'), dark = b.id('metal_dark'), metal = b.id('metal');
  foundation(b, x0 - 1, z0 - 1, x1 + 1, z1 + 1, G, 3);
  // a basement food hall
  b.box(x0 + 2, G - v(3.6), z0 + 2, x1 - 2, G - 2, z1 - 2, 0);
  for (let f = 0; f <= floors; f++) b.box(x0, G + f * storey, z0, x1, G + f * storey + 2, z1, slab);
  b.walls(x0, G + 2, z0, x1, G + h, z1, 2, stoneClad);
  for (let x = x0 + v(8); x < x1 - v(4); x += v(8)) for (let z = z0 + v(8); z < z1 - v(4); z += v(8)) b.box(x, G - v(3.6), z, x + 4, G + h, z + 4, slab);
  // display windows all round the ground floor, lit
  b.box(x0 + v(1), G + 2, z0, x1 - v(1), G + v(3.2), z0 + 2, lit);
  b.box(x0 + v(1), G + 2, z1 - 2, x1 - v(1), G + v(3.2), z1, lit);
  b.box(x0, G + 2, z0 + v(1), x0 + 2, G + v(3.2), z1 - v(1), lit);
  b.box(x1 - 2, G + 2, z0 + v(1), x1, G + v(3.2), z1 - v(1), lit);
  for (let x = x0 + v(4); x < x1; x += v(4)) {
    b.box(x, G + 2, z0, x + 2, G + v(3.2), z0 + 2, stoneClad);
    b.box(x, G + 2, z1 - 2, x + 2, G + v(3.2), z1, stoneClad);
  }
  // a canopy round the ground floor
  b.walls(x0 - v(1.2), G + v(3.4), z0 - v(1.2), x1 + v(1.2), G + v(3.4) + 2, z1 + v(1.2), v(1.2), slab);
  // upper floors: vertical fins proud of the wall, a narrow window strip on every other floor
  for (let x = x0 + v(2); x < x1 - v(1); x += v(2.5)) {
    b.box(x, G + storey, z0 - 2, x + 2, G + h, z0, fin);
    b.box(x, G + storey, z1, x + 2, G + h, z1 + 2, fin);
  }
  for (let z = z0 + v(2); z < z1 - v(1); z += v(2.5)) {
    b.box(x0 - 2, G + storey, z, x0, G + h, z + 2, fin);
    b.box(x1, G + storey, z, x1 + 2, G + h, z + 2, fin);
  }
  for (let f = 2; f < floors; f += 2) {
    const y = G + f * storey + v(1.6);
    b.box(x0 + v(1), y, z0, x1 - v(1), y + v(0.9), z0 + 2, glass);
    b.box(x0 + v(1), y, z1 - 2, x1 - v(1), y + v(0.9), z1, glass);
  }
  // the glass atrium on the corner nearest the main crossing (x0, z1)
  const ar = v(7);
  b.box(x0, G + 2, z1 - ar, x0 + 2, G + storey * 3, z1, glass);
  b.box(x0, G + 2, z1 - 2, x0 + ar, G + storey * 3, z1, glass);
  b.box(x0 - 2, G, z1 - ar, x0, G + storey * 3, z1 - ar + 2, dark);
  b.box(x0 + ar - 2, G, z1, x0 + ar, G + storey * 3, z1 + 2, dark);
  // the vertical neon sign on the corner and the name band along the top of the main front
  const ny0 = G + storey * 2, ny1 = G + h - v(2);
  b.box(x1 - v(1.5), ny0, z1 + 2, x1, ny1, z1 + v(1.3), dark);
  const neon = [b.id('neon_pink'), b.id('neon_cyan')];
  for (let y = ny0 + v(0.6), k = 0; y < ny1 - v(1); y += v(2.2), k++) b.box(x1 - v(1.4), y, z1 + v(1.3), x1 - 1, y + v(1.7), z1 + v(1.4), neon[k % 2]);
  b.box(x0 + v(10), G + h - v(2.2), z1 + 2, x1 - v(4), G + h - v(0.4), z1 + 4, b.id('sign_red'));
  for (let x = x0 + v(12), i = 0; x < x1 - v(7) && i < 6; x += v(3.2), i++) b.box(x, G + h - v(1.9), z1 + 4, x + v(2.4), G + h - v(0.7), z1 + 5, b.id('paint_white'));
  // the roof: parapet, the billboard frame, a little playground behind railings
  const top = G + h + 2;
  b.walls(x0, top, z0, x1, top + v(1.2), z1, 2, stoneClad);
  const bz = z0 + v(3);
  b.box(x0 + v(3), top + v(1), bz, x1 - v(3), top + v(6), bz + 2, b.id(rng.pick(['sign_yellow', 'sign_blue', 'sign_red'])));
  for (let x = x0 + v(4); x < x1 - v(3); x += v(6)) b.box(x, top, bz + 2, x + 2, top + v(5.5), bz + 4, metal);
  const px = x0 + v(5), pz = z1 - v(10);
  b.box(px, top - 1, pz, px + v(12), top, pz + v(7), b.id('track_red'));
  b.cylinderY(px + v(4), pz + v(3.5), top, top + v(0.6), v(1.4), b.id('paint_blue'));
  for (let k = 0; k < 6; k++) b.box(px + v(8) + k * 2, top + k, pz + v(2), px + v(8) + k * 2 + 2, top + k + 2, pz + v(3), b.id('paint_yellow'));
  b.walls(px - 2, top, pz - 2, px + v(12) + 2, top + v(1.2), pz + v(7) + 2, 1, metal);
}

/**
 * Karakura General Hospital (空座総合病院): an eight-storey ward slab of white tile with continuous window bands
 * across the back of the block, a three-storey outpatient wing in front, the porte-cochère and the sign over the
 * entrance, a helipad on the slab's roof and an ambulance under the canopy. `face` is the street side of the entrance.
 */
export function hospital(b: Builder, bk: Block, G: number, rng: Rng, face: Lot['face']): void {
  const v = (m: number) => b.v(m);
  const lot: Lot = { ...bk, face };
  const { W, D, box } = lotFrame(lot);
  const tile = b.id('tile_white'), slab = b.id('concrete'), win = b.id('window'), lit = b.id('window_lit'), dark = b.id('metal_dark');
  const storey = v(3.6);
  // the ward slab across the back
  const s0 = v(3), s1 = W - v(3), sw0 = D - v(17), sw1 = D - v(3), floors = 8, h = floors * storey;
  box(b, s0 - 1, G - v(2.5), sw0 - 1, s1 + 1, G, sw1 + 1, b.id('concrete_dark'));
  for (let f = 0; f <= floors; f++) box(b, s0, G + f * storey, sw0, s1, G + f * storey + 2, sw1, slab);
  box(b, s0, G + 2, sw0, s0 + 2, G + h, sw1, tile);
  box(b, s1 - 2, G + 2, sw0, s1, G + h, sw1, tile);
  box(b, s0, G + 2, sw0, s1, G + h, sw0 + 2, tile);
  box(b, s0, G + 2, sw1 - 2, s1, G + h, sw1, tile);
  box(b, s0 + 2, G + 2, ((sw0 + sw1) >> 1) - 1, s1 - 2, G + h, ((sw0 + sw1) >> 1) + 1, tile);
  for (let f = 0; f < floors; f++) {
    const y = G + f * storey + v(1), m = rng.chance(0.4) ? lit : win;
    box(b, s0 + v(1), y, sw0, s1 - v(1), y + v(1.5), sw0 + 2, m);
    box(b, s0 + v(1), y, sw1 - 2, s1 - v(1), y + v(1.5), sw1, win);
    for (let u = s0 + v(4); u < s1 - v(1); u += v(4)) {
      box(b, u, y, sw0, u + 2, y + v(1.5), sw0 + 2, tile);
      box(b, u, y, sw1 - 2, u + 2, y + v(1.5), sw1, tile);
    }
  }
  // the roof: parapet, plant room, the helipad with its H
  const top = G + h + 2;
  box(b, s0, top, sw0, s1, top + v(1), sw0 + 2, tile);
  box(b, s0, top, sw1 - 2, s1, top + v(1), sw1, tile);
  box(b, s0, top, sw0, s0 + 2, top + v(1), sw1, tile);
  box(b, s1 - 2, top, sw0, s1, top + v(1), sw1, tile);
  const hp = Math.min(v(12), sw1 - sw0 - v(2)), hu = s1 - v(2) - hp, hw = sw0 + v(1);
  box(b, hu, top - 1, hw, hu + hp, top, hw + hp, b.id('concrete_dark'));
  const hc = hu + (hp >> 1), hwc = hw + (hp >> 1), hs = v(1.6);
  box(b, hc - hs, top - 1, hwc - hs - 2, hc - hs + 3, top, hwc + hs + 2, b.id('paint_white'));
  box(b, hc + hs - 3, top - 1, hwc - hs - 2, hc + hs, top, hwc + hs + 2, b.id('paint_white'));
  box(b, hc - hs, top - 1, hwc - 1, hc + hs, top, hwc + 2, b.id('paint_white'));
  box(b, hu, top - 1, hw, hu + hp, top, hw + 2, b.id('paint_yellow'));
  box(b, hu, top - 1, hw + hp - 2, hu + hp, top, hw + hp, b.id('paint_yellow'));
  box(b, s0 + v(3), top, sw0 + v(3), s0 + v(10), top + v(3), sw1 - v(3), slab);
  // the outpatient wing in front
  const o0 = v(5), o1 = W - v(5), ow0 = v(6), ow1 = sw0, of = 3;
  box(b, o0 - 1, G - v(1.5), ow0 - 1, o1 + 1, G, ow1, b.id('concrete_dark'));
  for (let f = 0; f <= of; f++) box(b, o0, G + f * storey, ow0, o1, G + f * storey + 2, ow1, slab);
  box(b, o0, G + 2, ow0, o0 + 2, G + of * storey, ow1, tile);
  box(b, o1 - 2, G + 2, ow0, o1, G + of * storey, ow1, tile);
  box(b, o0, G + 2, ow0, o1, G + of * storey, ow0 + 2, tile);
  for (let f = 0; f < of; f++) {
    const y = G + f * storey + v(1);
    box(b, o0 + v(1), y, ow0, o1 - v(1), y + v(1.5), ow0 + 2, f === 0 ? b.id('glass') : win);
    for (let u = o0 + v(3); u < o1 - v(1); u += v(3)) box(b, u, y, ow0, u + 2, y + v(1.5), ow0 + 2, tile);
  }
  box(b, o0, G + of * storey + 2, ow0, o1, G + of * storey + v(1), ow0 + 2, tile);
  // the porte-cochère: a canopy on two columns, the sign over the entrance
  const mid = W >> 1;
  box(b, mid - v(6), G + v(3.8), ow0 - v(5.5), mid + v(6), G + v(3.8) + 2, ow0, slab);
  for (const u of [mid - v(6), mid + v(6) - 3]) box(b, u, G, ow0 - v(5.5), u + 3, G + v(3.8), ow0 - v(5.5) + 3, slab);
  // the name over the entrance, 空座総合病院 (Karakura General Hospital), dark on a white panel with a blue foot
  const name = '空座総合病院', tw = textWidth(name, 2);
  const py0 = G + v(3.8) + 2, py1 = py0 + 17;
  box(b, mid - (tw >> 1) - 4, py0, ow0 - v(1), mid + (tw >> 1) + 5, py1, ow0, b.id('sign_white'));
  box(b, mid - (tw >> 1) - 4, py0, ow0 - v(1) - 1, mid + (tw >> 1) + 5, py0 + 2, ow0 - v(1), b.id('sign_blue'));
  const { cell } = lotFrame(lot);
  stampText(b, name, dark, (c, row) => {
    const [x, z] = cell(mid + (tw >> 1) - c, ow0 - v(1) - 1);
    return [x, py1 - 2 - row, z];
  }, 2);
  box(b, mid - v(3), G + 2, ow0, mid + v(3), G + v(2.6), ow0 + 2, 0);
  // the forecourt and an ambulance under the canopy
  box(b, 1, G - 1, 1, W - 1, G, ow0, b.id('pavement'));
  const [ax, az] = lotFrame(lot).pt(mid, ow0 - v(3));
  van(b, ax, az, G, lotFrame(lot).alongX, b.id('paint_white'), false, b.id('paint_red'));
  // a row of trees along the street
  for (let u = v(3); u < W - v(3); u += v(7)) {
    if (Math.abs(u - mid) < v(9)) continue;
    const [tx, tz] = lotFrame(lot).pt(u, v(1.5));
    streetTree(b, tx, tz, G, rng);
  }
}

/**
 * A multi-storey car park: open decks on a column grid with low parapets, a ramp stepping up along one side, cars
 * parked on every deck, the big blue P on the street front.
 */
export function carPark(b: Builder, lot: Lot, G: number, rng: Rng, paints: string[]): void {
  const v = (m: number) => b.v(m);
  const { W, D, box, pt, alongX } = lotFrame(lot);
  const slab = b.id('concrete'), wall = b.id('concrete'), blue = b.id('paint_blue'), white = b.id('paint_white');
  const u0 = v(1), u1 = W - v(1), w0 = v(1), w1 = D - v(1);
  const levels = rng.int(4, 5), lh = v(2.9);
  box(b, u0 - 1, G - v(1.5), w0 - 1, u1 + 1, G, w1 + 1, b.id('concrete_dark'));
  for (let l = 0; l <= levels; l++) {
    const y = G + l * lh;
    if (l > 0) box(b, u0, y - 2, w0, u1, y, w1, slab);
    // parapets: solid low walls with a gap at the ramp
    if (l > 0) {
      box(b, u0, y, w0, u1, y + v(1), w0 + 2, wall);
      box(b, u0, y, w1 - 2, u1, y + v(1), w1, wall);
      box(b, u0, y, w0, u0 + 2, y + v(1), w1, wall);
      box(b, u1 - 2, y, w0, u1, y + v(1), w1, wall);
    }
  }
  for (let u = u0; u < u1 - 2; u += v(5.5)) for (let w = w0; w < w1 - 2; w += v(5.5)) box(b, u, G, w, u + 3, G + levels * lh, w + 3, slab);
  box(b, u1 - 3, G, w0, u1, G + levels * lh, w0 + 3, slab);
  box(b, u0, G, w1 - 3, u0 + 3, G + levels * lh, w1, slab);
  box(b, u1 - 3, G, w1 - 3, u1, G + levels * lh, w1, slab);
  // the ramp along the back: a strip that climbs one deck per run
  const rw0 = w1 - v(4), rw1 = w1 - 2;
  for (let l = 0; l < levels; l++) {
    const run = u1 - u0 - v(6);
    for (let k = 0; k < lh; k++) {
      const u = (l % 2 === 0 ? u0 + v(3) + Math.floor((k * run) / lh) : u1 - v(3) - Math.floor(((k + 1) * run) / lh));
      box(b, u, G + l * lh + k - 1, rw0, u + Math.ceil(run / lh) + 1, G + l * lh + k + 1, rw1, slab);
    }
  }
  // cars on the decks
  const step = v(2.7);
  for (let l = 0; l <= levels; l++) {
    const y = G + l * lh;
    for (let u = u0 + v(2.5); u < u1 - v(2.5); u += step) {
      if (!rng.chance(0.55)) continue;
      const [cx, cz] = pt(u, w0 + v(3.2));
      car(b, cx, cz, y, !alongX, b.id(rng.pick(paints)), rng.chance(0.5));
    }
  }
  // the P sign
  const sy = G + levels * lh - v(3);
  box(b, (W >> 1) - v(1.5), sy, -2, (W >> 1) + v(1.5), sy + v(3), 0, blue);
  const pu = (W >> 1) - v(0.7), py = sy + v(0.5);
  box(b, pu, py, -3, pu + 3, py + v(2), -2, white);
  box(b, pu + 3, py + v(2) - 3, -3, pu + v(1.3), py + v(2), -2, white);
  box(b, pu + 3, py + v(1) - 1, -3, pu + v(1.3), py + v(1) + 2, -2, white);
  box(b, pu + v(1.3) - 3, py + v(1) + 2, -3, pu + v(1.3), py + v(2) - 3, -2, white);
}

/** A petrol station: the apron, a canopy on four columns over two pump islands, the kiosk, the tall price sign. */
export function petrolStation(b: Builder, lot: Lot, G: number, rng: Rng): void {
  const v = (m: number) => b.v(m);
  const { W, D, box } = lotFrame(lot);
  const brand = b.id(rng.pick(['sign_red', 'sign_orange', 'paint_blue', 'sign_green']));
  const slab = b.id('concrete'), white = b.id('paint_white'), metal = b.id('metal'), dark = b.id('metal_dark');
  box(b, 1, G - 2, 1, W - 1, G, D - 1, slab);
  const cu0 = v(2), cu1 = W - v(2), cw0 = v(2.5), cw1 = Math.min(D - v(6), cw0 + v(11)), ch = v(5.2);
  for (const [u, w] of [[cu0 + v(1.5), cw0 + v(1.5)], [cu1 - v(1.5) - 3, cw0 + v(1.5)], [cu0 + v(1.5), cw1 - v(1.5) - 3], [cu1 - v(1.5) - 3, cw1 - v(1.5) - 3]]) box(b, u, G, w, u + 3, G + ch, w + 3, white);
  box(b, cu0, G + ch, cw0, cu1, G + ch + 3, cw1, white);
  box(b, cu0 - 1, G + ch, cw0 - 1, cu1 + 1, G + ch + v(0.9), cw0, brand);
  box(b, cu0 - 1, G + ch, cw1, cu1 + 1, G + ch + v(0.9), cw1 + 1, brand);
  box(b, cu0 - 1, G + ch, cw0, cu0, G + ch + v(0.9), cw1, brand);
  box(b, cu1, G + ch, cw0, cu1 + 1, G + ch + v(0.9), cw1, brand);
  box(b, cu0 + 2, G + ch - 1, cw0 + 2, cu1 - 2, G + ch, cw1 - 2, b.id('lamp'));
  // pump islands
  const wm = (cw0 + cw1) >> 1;
  for (const u of [cu0 + Math.round((cu1 - cu0) * 0.3), cu0 + Math.round((cu1 - cu0) * 0.7)]) {
    box(b, u - v(0.6), G, wm - v(3), u + v(0.6), G + 2, wm + v(3), slab);
    for (const w of [wm - v(1.7), wm + v(1)]) {
      box(b, u - v(0.4), G + 2, w, u + v(0.4), G + v(1.7), w + v(0.7), white);
      box(b, u - v(0.4), G + v(1.3), w - 1, u + v(0.4), G + v(1.6), w, brand);
      box(b, u - v(0.45), G + v(0.8), w + 2, u - v(0.4), G + v(1.2), w + 4, dark);
    }
  }
  // the kiosk at the back
  const k0 = v(3), k1 = Math.min(W - v(3), k0 + v(9)), kw0 = cw1 + v(1.5), kw1 = D - v(1);
  if (kw1 - kw0 > v(3)) {
    box(b, k0, G, kw0, k1, G + v(3.2), kw1, b.id('tile_white'));
    box(b, k0 + v(1), G + 2, kw0, k1 - v(1), G + v(2.5), kw0 + 2, b.id('glass'));
    box(b, k0, G + v(3.2), kw0, k1, G + v(3.2) + 2, kw1, slab);
    box(b, k0, G + v(2.6), kw0 - 1, k1, G + v(3.2), kw0, brand);
  }
  // the price sign on its pole by the street
  const su = W - v(1.5);
  box(b, su - 2, G, 1, su, G + v(6), 3, metal);
  box(b, su - v(1.6), G + v(4), 0, su + 1, G + v(6.6), 4, white);
  box(b, su - v(1.6), G + v(5.8), -1, su + 1, G + v(6.6), 0, brand);
  for (let k = 0; k < 3; k++) box(b, su - v(1.3), G + v(4.3) + k * v(0.45), -1, su - 1, G + v(4.3) + k * v(0.45) + 2, 0, dark);
}

/**
 * A construction site filling a block: white hoarding with a gate, an excavation pit stepped down into the ground's
 * strata, a half-built tower (a concrete frame whose top floors are bare columns, scaffolding and green netting up one
 * side), stacked site cabins, rebar bundles, and a yellow tower crane with its jib over the frame and a load on the hook.
 */
export function constructionSite(b: Builder, bk: Block, G: number, rng: Rng): { crane: [number, number, number] } {
  const v = (m: number) => b.v(m);
  const { x0, z0, x1, z1 } = bk;
  const white = b.id('paint_white'), slab = b.id('concrete'), metal = b.id('metal'), net = b.id('paint_green');
  const yellow = b.id('paint_yellow'), rust = b.id('rust');
  // hoarding, 3 m of white panels on posts, the gate on the north side
  b.box(x0 + 1, G - 1, z0 + 1, x1 - 1, G, z1 - 1, b.id('gravel'));
  b.walls(x0 + 1, G, z0 + 1, x1 - 1, G + v(3), z1 - 1, 1, white);
  for (let x = x0 + 1; x < x1; x += v(4)) {
    b.box(x, G, z0, x + 1, G + v(3.2), z0 + 1, metal);
    b.box(x, G, z1 - 1, x + 1, G + v(3.2), z1, metal);
  }
  const gx = (x0 + x1) >> 1;
  b.box(gx - v(3), G, z0 + 1, gx + v(3), G + v(3), z0 + 2, 0);
  // the excavation: 3 m steps down into clay and sand, the floor at -7 m
  const ex0 = x0 + v(4), ex1 = Math.min(x1 - v(4), ex0 + v(18)), ez0 = z0 + v(5), ez1 = z1 - v(5);
  for (let s = 0; s < 3; s++) b.box(ex0 + s * v(1.2), G - v(2.5) * (s + 1), ez0 + s * v(1.2), ex1 - s * v(1.2), G, ez1 - s * v(1.2), 0);
  // the frame: columns on a 6 m grid, slabs to floor 7, bare columns above
  const fx0 = ex1 + v(4), fx1 = x1 - v(3), fz0 = z0 + v(4), fz1 = z1 - v(4);
  const storey = v(3.5), slabs = 7, colsTo = 9;
  if (fx1 - fx0 > v(12)) {
    b.box(fx0 - 1, G - v(2), fz0 - 1, fx1 + 1, G, fz1 + 1, b.id('concrete_dark'));
    for (let x = fx0; x < fx1 - 2; x += v(6)) for (let z = fz0; z < fz1 - 2; z += v(6)) b.box(x, G, z, x + 4, G + colsTo * storey + v(1.2), z + 4, slab);
    for (const x of [fx1 - 4]) for (let z = fz0; z < fz1 - 2; z += v(6)) b.box(x, G, z, x + 4, G + colsTo * storey + v(1.2), z + 4, slab);
    for (let f = 1; f <= slabs; f++) b.box(fx0, G + f * storey, fz0, fx1, G + f * storey + 2, fz1, slab);
    // rebar sticking out of the bare columns
    for (let x = fx0; x < fx1 - 2; x += v(6)) for (let z = fz0; z < fz1 - 2; z += v(6)) b.box(x + 1, G + colsTo * storey + v(1.2), z + 1, x + 3, G + colsTo * storey + v(2), z + 3, rust);
    // scaffolding with netting up the west face
    const sx = fx0 - v(1.2);
    for (let z = fz0; z <= fz1; z += v(2)) b.box(sx, G, z, sx + 1, G + slabs * storey + v(1), z + 1, metal);
    for (let y = G + v(2); y < G + slabs * storey + v(1); y += v(2)) b.box(sx, y, fz0, sx + 1, y + 1, fz1 + 1, metal);
    b.box(sx - 1, G + v(2.4), fz0, sx, G + slabs * storey + v(1), fz1 + 1, net);
  }
  // site cabins stacked two high by the gate
  for (let k = 0; k < 2; k++) {
    const cx0 = x0 + v(3), cy = G + k * v(2.7), cz0 = z1 - v(4.5);
    b.box(cx0, cy, cz0, cx0 + v(6), cy + v(2.6), cz0 + v(2.4), k ? b.id('paint_blue') : white);
    for (let x = cx0 + v(1); x < cx0 + v(5.5); x += v(1.6)) b.box(x, cy + v(1), cz0 - 1, x + v(1), cy + v(1.9), cz0, b.id('window'));
  }
  // rebar bundles and pipes on the ground
  for (let i = 0; i < 3; i++) {
    const rx = x0 + v(3) + i * v(2), rz = z0 + v(3);
    b.box(rx, G, rz, rx + v(0.8), G + v(0.5), rz + v(6), i === 1 ? metal : rust);
  }
  // the tower crane: a lattice mast, the slewing unit and cab, the jib over the frame, the counter-jib with its weights
  const mx = Math.min(x1 - v(8), ex1 + v(1)), mz = (z0 + z1) >> 1;
  const mh = G + v(46), ms = v(2);
  b.box(mx - v(2), G - v(2), mz - v(2), mx + ms + v(2), G + 2, mz + ms + v(2), slab);
  for (const [cx, cz] of [[mx, mz], [mx + ms - 2, mz], [mx, mz + ms - 2], [mx + ms - 2, mz + ms - 2]]) b.box(cx, G, cz, cx + 2, mh, cz + 2, yellow);
  for (let y = G + v(2); y < mh; y += v(2)) {
    b.box(mx, y, mz, mx + ms, y + 1, mz + 1, yellow);
    b.box(mx, y, mz + ms - 1, mx + ms, y + 1, mz + ms, yellow);
    b.box(mx, y, mz, mx + 1, y + 1, mz + ms, yellow);
    b.box(mx + ms - 1, y, mz, mx + ms, y + 1, mz + ms, yellow);
    b.line(mx, y - v(2), mz, mx + ms - 1, y, mz, 0.7, yellow);
    b.line(mx, y - v(2), mz + ms - 1, mx + ms - 1, y, mz + ms - 1, 0.7, yellow);
  }
  const jy = mh + v(1.2);
  b.box(mx - v(0.5), mh, mz - v(0.5), mx + ms + v(0.5), jy, mz + ms + v(0.5), yellow);
  b.box(mx + ms, mh - v(1.6), mz - v(1), mx + ms + v(2), mh, mz + v(0.6), b.id('window'));
  b.box(mx + ms, mh - v(1.6), mz - v(1), mx + ms + v(2), mh - v(1.4), mz + v(0.6), yellow);
  // the jib points west over the excavation and the frame lies east: aim it at the frame instead when it is wider
  const jLen = v(34), cjLen = v(11);
  const dir = fx1 - fx0 > v(12) ? 1 : -1;
  const jx0 = dir > 0 ? mx + ms : mx - jLen, jx1 = dir > 0 ? mx + ms + jLen : mx;
  for (const zz of [mz, mz + ms - 2]) b.box(jx0, jy, zz, jx1, jy + 2, zz + 2, yellow);
  b.box(jx0, jy + v(1.3), mz + (ms >> 1) - 1, jx1, jy + v(1.3) + 2, mz + (ms >> 1) + 1, yellow);
  for (let x = jx0; x < jx1 - v(1); x += v(1.5)) {
    b.line(x, jy + 1, mz + 1, x + v(0.75), jy + v(1.3), mz + (ms >> 1), 0.7, yellow);
    b.line(x, jy + 1, mz + ms - 2, x + v(0.75), jy + v(1.3), mz + (ms >> 1), 0.7, yellow);
  }
  const cx0 = dir > 0 ? mx - cjLen : mx + ms, cx1 = dir > 0 ? mx : mx + ms + cjLen;
  b.box(cx0, jy, mz - 1, cx1, jy + 2, mz + ms + 1, yellow);
  const wx = dir > 0 ? cx0 : cx1 - v(3);
  b.box(wx, jy - v(2.4), mz - 1, wx + v(3), jy, mz + ms + 1, slab);
  // the cat head and its ties
  const hx = mx + (ms >> 1), hz = mz + (ms >> 1), hy = jy + v(6);
  b.line(mx + 1, jy + 2, mz + 1, hx, hy, hz, 0.8, yellow);
  b.line(mx + ms - 2, jy + 2, mz + ms - 2, hx, hy, hz, 0.8, yellow);
  b.line(hx, hy, hz, dir > 0 ? jx1 - v(6) : jx0 + v(6), jy + v(1.3) + 1, hz, 0.5, b.id('wire'));
  b.line(hx, hy, hz, dir > 0 ? cx0 + 2 : cx1 - 2, jy + 2, hz, 0.5, b.id('wire'));
  // the trolley, the hook line and a bundle of steel beams on it
  const tx = dir > 0 ? jx0 + Math.round(jLen * 0.6) : jx1 - Math.round(jLen * 0.6);
  b.box(tx - 3, jy - 2, mz, tx + 3, jy, mz + ms, b.id('metal_dark'));
  const hookY = G + v(rng.range(14, 22));
  b.box(tx, hookY + v(0.6), hz, tx + 1, jy - 2, hz + 1, b.id('wire'));
  b.box(tx - 2, hookY, hz - 2, tx + 3, hookY + v(0.6), hz + 3, b.id('metal_dark'));
  b.box(tx - v(3), hookY - v(0.6), hz - 3, tx + v(3), hookY, hz + 4, rust);
  return { crane: [mx + (ms >> 1), mh, mz + (ms >> 1)] };
}

// ------------------------------------------------------------------------------------------- the works on the far bank

/**
 * A warehouse or a small works: a steel shed clad in corrugated sheet under a saw-tooth roof (each tooth a slope and
 * a row of north lights), roller shutters on a loading dock, a sign band; a smokestack with red and white bands at the
 * top when `stack` is set.
 */
export function warehouse(b: Builder, lot: Lot, G: number, rng: Rng, stack = false): void {
  const v = (m: number) => b.v(m);
  const { W, D, box, pt } = lotFrame(lot);
  const sheet = b.id(rng.pick(['roof_metal', 'siding_beige', 'siding_blue', 'cladding'])), slab = b.id('concrete');
  const u0 = v(1.5), u1 = W - v(1.5), w0 = v(5), w1 = D - v(1.5), h = v(rng.range(7, 9));
  box(b, 1, G - 2, 1, W - 1, G, w0, b.id('asphalt'));
  box(b, u0 - 1, G - v(1.2), w0 - 1, u1 + 1, G + 2, w1 + 1, slab);
  box(b, u0, G + 2, w0, u0 + 2, G + h, w1, sheet);
  box(b, u1 - 2, G + 2, w0, u1, G + h, w1, sheet);
  box(b, u0, G + 2, w0, u1, G + h, w0 + 2, sheet);
  box(b, u0, G + 2, w1 - 2, u1, G + h, w1, sheet);
  for (let u = u0 + v(6); u < u1 - v(2); u += v(6)) box(b, u, G + 2, w0, u + 2, G + h, w1, b.id('metal'));
  // saw-tooth roof: teeth along w, each rising toward the back with glazing on its steep face
  const tooth = v(4);
  for (let w = w0; w < w1; w += tooth) {
    const we = Math.min(w1, w + tooth);
    for (let k = 0; k < we - w; k++) {
      const yy = G + h + Math.floor((k * v(1.8)) / tooth);
      box(b, u0, yy, w + k, u1, yy + 2, w + k + 1, b.id('roof_metal'));
    }
    box(b, u0, G + h, we - 1, u1, G + h + v(1.8), we, b.id('glass'));
  }
  // loading dock, roller shutters, the sign band
  box(b, u0, G, w0 - v(1.6), u1, G + v(1.1), w0, slab);
  for (let u = u0 + v(2); u + v(3.5) < u1 - v(1); u += v(6)) box(b, u, G + v(1.1), w0, u + v(3.5), G + v(4.6), w0 + 2, b.id('shutter'));
  box(b, u0 + v(2), G + h - v(1.6), w0 - 1, u1 - v(2), G + h - v(0.4), w0, b.id(rng.pick(['sign_blue', 'sign_red', 'sign_green', 'sign_white'])));
  if (rng.chance(0.6)) {
    const [lx, lz] = pt(u0 + v(4), v(2.5));
    lorry(b, lx, lz, G, lotFrame(lot).alongX, b.id(rng.pick(['paint_white', 'car_silver', 'paint_blue'])), rng.chance(0.5));
  }
  if (stack) {
    const [sx, sz] = pt(u1 - v(3), w1 - v(3));
    smokestack(b, sx, sz, G, v(rng.range(38, 46)));
  }
}

/** A tapering brick-and-concrete smokestack with red and white bands near the top and a ladder up it. */
export function smokestack(b: Builder, x: number, z: number, G: number, h: number): void {
  const v = (m: number) => b.v(m);
  const conc = b.id('concrete'), red = b.id('paint_red'), white = b.id('paint_white');
  b.box(x - v(2.4), G - v(2), z - v(2.4), x + v(2.4), G + 2, z + v(2.4), conc);
  const r0 = v(1.6), r1 = v(1.05);
  for (let y = G; y < G + h; y += 4) {
    const t = (y - G) / h;
    const r = r0 + (r1 - r0) * t;
    const band = y > G + h - v(10) ? (Math.floor((G + h - y) / v(2.5)) % 2 === 0 ? red : white) : conc;
    b.cylinderY(x, z, y, Math.min(G + h, y + 4), r, band);
  }
  b.cylinderY(x, z, G + h - v(6), G + h + 1, r1 - 3, 0);
  for (let y = G + v(2); y < G + h - 2; y += 3) b.box(x + r0, y, z - 2, x + r0 + 2, y + 1, z + 2, b.id('metal'));
}

/** A white storage tank with a dark band and a ladder. */
export function tank(b: Builder, x: number, z: number, G: number, r: number, h: number): void {
  const v = (m: number) => b.v(m);
  b.cylinderY(x, z, G - v(0.5), G + 2, r + 3, b.id('concrete'));
  b.cylinderY(x, z, G + 2, G + h, r, b.id('paint_white'));
  b.cylinderY(x, z, G + h - v(1.2), G + h - v(0.8), r + 1, b.id('metal_dark'));
  b.cylinderY(x, z, G + h, G + h + 2, r - 2, b.id('paint_white'));
  for (let y = G + 2; y < G + h; y += 3) b.box(x + r, y, z - 2, x + r + 2, y + 1, z + 2, b.id('metal'));
}

// ------------------------------------------------------------------------------------------- pylons and footbridges

/**
 * A steel lattice pylon for the high-voltage line: four legs leaning in to a waist, braced in X on every face, three
 * cross-arms each side with insulator strings. Returns the attachment points of the lines (x, y, z).
 */
export function pylon(b: Builder, x: number, z: number, G: number, armsAlongX: boolean): [number, number, number][] {
  const v = (m: number) => b.v(m);
  const steel = b.id('metal'), ins = b.id('paint_white');
  const H = v(34), waist = v(24), base = v(3.4), top = v(0.9);
  const half = (y: number) => (y < waist ? base + ((top - base) * y) / waist : top);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    b.box(x + sx * base - 2, G - v(1), z + sz * base - 2, x + sx * base + 2, G + 2, z + sz * base + 2, b.id('concrete'));
    b.line(x + sx * base, G, z + sz * base, x + sx * top, G + waist, z + sz * top, 1, steel);
    b.line(x + sx * top, G + waist, z + sz * top, x + sx * top, G + H, z + sz * top, 1, steel);
  }
  // X bracing on the four faces, a horizontal tie at each panel
  for (let y = 0; y < H - v(2); y += v(4)) {
    const y1 = Math.min(H, y + v(4));
    const a = half(y), c = half(y1);
    // the lowest panel stays open between the legs
    for (const s of y === 0 ? [] : [-1, 1]) {
      b.line(x - a, G + y, z + s * a, x + c, G + y1, z + s * c, 0.6, steel);
      b.line(x + a, G + y, z + s * a, x - c, G + y1, z + s * c, 0.6, steel);
      b.line(x + s * a, G + y, z - a, x + s * c, G + y1, z + c, 0.6, steel);
      b.line(x + s * a, G + y, z + a, x + s * c, G + y1, z - c, 0.6, steel);
    }
    b.line(x - c, G + y1, z - c, x + c, G + y1, z - c, 0.6, steel);
    b.line(x - c, G + y1, z + c, x + c, G + y1, z + c, 0.6, steel);
    b.line(x - c, G + y1, z - c, x - c, G + y1, z + c, 0.6, steel);
    b.line(x + c, G + y1, z - c, x + c, G + y1, z + c, 0.6, steel);
  }
  // cross-arms, insulators
  const points: [number, number, number][] = [];
  for (const [ay, reach] of [[v(23), v(5.5)], [v(28), v(4.5)], [v(33), v(3.5)]] as [number, number][]) {
    for (const s of [-1, 1]) {
      const ex = armsAlongX ? x + s * reach : x, ez = armsAlongX ? z : z + s * reach;
      b.line(x, G + ay, z, ex, G + ay, ez, 1, steel);
      b.line(armsAlongX ? x + s * top : x, G + ay - v(1.6), armsAlongX ? z : z + s * top, ex, G + ay, ez, 0.6, steel);
      b.box(ex - 1, G + ay - v(1.6), ez - 1, ex + 1, G + ay, ez + 1, ins);
      points.push([ex, G + ay - v(1.6), ez]);
    }
  }
  // the earth wire peak
  b.line(x, G + H, z, x, G + H + v(2), z, 1, steel);
  return points;
}

/** A sagging line between two points (one voxel thick, voxel by voxel). */
export function powerLine(b: Builder, a: [number, number, number], c: [number, number, number], sag: number): void {
  const wire = b.id('wire');
  const n = Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]));
  let px = NaN, py = NaN, pz = NaN;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = Math.round(a[0] + (c[0] - a[0]) * t), z = Math.round(a[2] + (c[2] - a[2]) * t);
    const y = Math.round(a[1] + (c[1] - a[1]) * t - Math.sin(t * Math.PI) * sag);
    // keep the line face-connected: fill the step in y as a short column
    if (!Number.isNaN(py) && Math.abs(y - py) > 1) b.box(x, Math.min(y, py), z, x + 1, Math.max(y, py), z + 1, wire);
    b.set(x, y, z, wire);
    if (!Number.isNaN(px) && px !== x && pz !== z) b.set(x, y, pz, wire);
    px = x; py = y; pz = z;
  }
}

/**
 * A footbridge (歩道橋) across a road: a blue steel deck 5 m over the asphalt between the pavements, solid parapets
 * with a name plate, and a flight of stairs at each end running down along the pavement. `alongX`: the road runs along
 * x, so the bridge crosses it along z at x = c; it spans [a0, a1) (pavement to pavement).
 */
export function footbridge(b: Builder, c: number, a0: number, a1: number, G: number, alongX: boolean): void {
  const v = (m: number) => b.v(m);
  const blue = b.id('paint_blue'), conc = b.id('concrete'), white = b.id('paint_white');
  const hw = v(1.1), dy = G + v(5.2);
  const bx = (u0: number, y0: number, w0: number, u1: number, y1: number, w1: number, m: number) =>
    alongX ? b.box(c + u0, y0, w0, c + u1, y1, w1, m) : b.box(w0, y0, c + u0, w1, y1, c + u1, m);
  // the span: deck, side girders/parapets
  bx(-hw, dy, a0, hw, dy + 2, a1, conc);
  bx(-hw - 2, dy - v(0.6), a0, -hw, dy + v(1.2), a1, blue);
  bx(hw, dy - v(0.6), a0, hw + 2, dy + v(1.2), a1, blue);
  const mid = (a0 + a1) >> 1;
  for (const s of [-1, 1]) bx(s < 0 ? -hw - 3 : hw + 2, dy + v(0.1), mid - v(1.8), s < 0 ? -hw - 2 : hw + 3, dy + v(0.9), mid + v(1.8), white);
  // stairs at both ends, down along the pavement (the road's direction), 1 up for 2 along, two voxels thick
  const rise = dy + 2 - G;
  for (const [end, dir] of [[a0, -1], [a1, 1]] as const) {
    bx(-hw - 2, G - v(0.6), end - (dir < 0 ? 4 : 0), hw + 2, dy + 2, end + (dir > 0 ? 4 : 0), blue);
    for (let k = 0; k < rise; k++) {
      const y = dy + 2 - k;
      const u = hw + 2 + 2 * k;
      const w = dir < 0 ? end : end - v(1.4);
      // the flight turns to run along the road on the +u side
      bx(u, y - 2, w, u + 2, y, w + v(1.4), conc);
    }
    bx(hw + 2, G, dir < 0 ? end + 1 : end - v(1.4) - 1, hw + 2 + 2 * rise, G + v(0.2), dir < 0 ? end + 2 : end - v(1.4), blue);
    // posts under the landing
    bx(-hw, G, end - (dir < 0 ? 3 : -1) - 1, -hw + 3, dy, end - (dir < 0 ? 3 : -1) + 2, blue);
  }
}

// ------------------------------------------------------------------------------------------- street furniture

/** A curve mirror on an orange pole at a blind corner, its round mirror turned toward (dx, dz). */
export function curveMirror(b: Builder, x: number, z: number, y: number, dx: number, dz: number): void {
  const v = (m: number) => b.v(m);
  const orange = b.id('sign_orange');
  b.box(x - 1, y, z - 1, x + 1, y + v(2.9), z + 1, orange);
  const mx = x + dx * 2, mz = z + dz * 2, my = y + v(2.5);
  const across = dx !== 0 ? 'z' : 'x';
  for (let a = -4; a <= 4; a++)
    for (let h = -4; h <= 4; h++) {
      if (a * a + h * h > 18) continue;
      const m = a * a + h * h > 10 ? orange : b.id('glass');
      if (across === 'z') b.set(mx, my + h, mz + a, m);
      else b.set(mx + a, my + h, mz, m);
    }
  b.box(Math.min(x, mx), my - 1, Math.min(z, mz), Math.max(x, mx) + 1, my + 1, Math.max(z, mz) + 1, orange);
}

/** A phone booth: green frame, glass walls, the grey phone inside. */
export function phoneBooth(b: Builder, x: number, z: number, y: number): void {
  const v = (m: number) => b.v(m);
  const green = b.id('sign_green'), glass = b.id('glass');
  const s = v(0.55), h = v(2.3);
  b.box(x - s, y, z - s, x + s, y + 1, z + s, b.id('concrete'));
  b.walls(x - s, y + 1, z - s, x + s, y + h, z + s, 1, glass);
  for (const [px, pz] of [[x - s, z - s], [x + s - 1, z - s], [x - s, z + s - 1], [x + s - 1, z + s - 1]]) b.box(px, y + 1, pz, px + 1, y + h, pz + 1, green);
  b.box(x - s, y + h, z - s, x + s, y + h + 2, z + s, green);
  b.box(x - 2, y + v(1), z + s - 3, x + 2, y + v(1.5), z + s - 1, b.id('metal_dark'));
}

/** A red fire hydrant. */
export function hydrant(b: Builder, x: number, z: number, y: number): void {
  const red = b.id('paint_red');
  b.box(x - 1, y, z - 1, x + 2, y + 5, z + 2, red);
  b.box(x - 2, y + 3, z, x + 3, y + 4, z + 1, red);
  b.box(x, y + 5, z, x + 1, y + 6, z + 1, red);
}

/** A white guard rail along x (or z) from a0 to a1 at the cross position c: posts every 2 m and two beams. */
export function guardRail(b: Builder, alongX: boolean, a0: number, a1: number, c: number, y: number): void {
  const v = (m: number) => b.v(m);
  const white = b.id('paint_white'), metal = b.id('metal');
  const bx = (u0: number, y0: number, u1: number, y1: number, m: number) => (alongX ? b.box(u0, y0, c, u1, y1, c + 1, m) : b.box(c, y0, u0, c + 1, y1, u1, m));
  for (let a = a0; a < a1; a += v(2)) bx(a, y, a + 1, y + v(0.8), metal);
  bx(a0, y + v(0.45), a1, y + v(0.55), white);
  bx(a0, y + v(0.7), a1, y + v(0.8), white);
}

/** A street tree in its iron grate: a straight trunk, a rounded crown of a few overlapping clumps. */
export function streetTree(b: Builder, x: number, z: number, y: number, rng: Rng, autumn = false): void {
  const v = (m: number) => b.v(m);
  b.box(x - 4, y - 1, z - 4, x + 4, y, z + 4, b.id('metal_dark'));
  b.box(x - 3, y - 1, z - 3, x + 3, y, z + 3, b.id('dirt'));
  const h = v(rng.range(3.2, 4.2));
  b.cylinderY(x, z, y, y + h, v(0.17), b.id('bark'));
  const leaves = b.id(autumn ? 'leaves_autumn' : 'leaves');
  b.ellipsoid(x, y + h + v(0.6), z, v(1.4), v(1.5), v(1.4), leaves, true);
  for (let i = 0; i < 4; i++) {
    const a = rng.range(0, Math.PI * 2);
    b.ellipsoid(x + Math.cos(a) * v(0.9), y + h + v(rng.range(0.1, 1.2)), z + Math.sin(a) * v(0.9), v(1), v(0.9), v(1), leaves, true);
  }
}

/** A red inverted-triangle stop sign (止まれ) on its pole, facing (dx, dz). */
export function stopSign(b: Builder, x: number, z: number, y: number, dx: number, dz: number): void {
  const v = (m: number) => b.v(m);
  b.box(x, y, z, x + 1, y + v(2.2), z + 1, b.id('metal'));
  const across = dx !== 0 ? 'z' : 'x';
  const fx = x + dx, fz = z + dz;
  for (let row = 0; row < 7; row++) {
    const hw = 6 - row;
    for (let a = -hw; a <= hw; a++) {
      const edge = row === 0 || Math.abs(a) === hw;
      const m = b.id(edge ? 'paint_white' : 'paint_red');
      if (across === 'z') b.set(fx, y + v(2.6) - row, fz + a, m);
      else b.set(fx + a, y + v(2.6) - row, fz, m);
    }
  }
  b.box(x, y + v(2.2), z, x + 1, y + v(2.6) - 6, z + 1, b.id('metal'));
}

/** A bicycle standing along x (or z): two wheels, the frame between them, saddle and handlebars. */
export function bicycle(b: Builder, x: number, z: number, y: number, alongX: boolean, paint: number): void {
  const tire = b.id('tire'), dark = b.id('metal_dark');
  const bx = (u0: number, y0: number, u1: number, y1: number, m: number) => (alongX ? b.box(x + u0, y + y0, z, x + u1, y + y1, z + 1, m) : b.box(x, y + y0, z + u0, x + 1, y + y1, z + u1, m));
  for (const c of [-5, 5]) {
    bx(c - 3, 1, c + 3, 5, tire);
    bx(c - 2, 0, c + 2, 6, tire);
    bx(c - 1, 2, c + 1, 4, 0);
  }
  bx(-5, 4, 5, 5, paint);
  bx(-2, 4, -1, 8, paint);
  bx(-3, 8, 0, 9, dark);
  bx(4, 4, 5, 9, paint);
  bx(3, 9, 6, 10, dark);
}

/**
 * A police box (交番): a small concrete box of a station with a glass front, the red lamp over the door and the sign,
 * a bicycle by the wall. Centre (x, z), front toward (dx, dz).
 */
export function koban(b: Builder, x: number, z: number, y: number, dx: number, dz: number): void {
  const v = (m: number) => b.v(m);
  const alongX = dz !== 0;
  const hw = v(2.4), hd = v(2);
  const x0 = alongX ? x - hw : x - hd, x1 = alongX ? x + hw : x + hd, z0 = alongX ? z - hd : z - hw, z1 = alongX ? z + hd : z + hw;
  b.box(x0 - 1, y - 2, z0 - 1, x1 + 1, y + 1, z1 + 1, b.id('concrete'));
  b.walls(x0, y + 1, z0, x1, y + v(3), z1, 2, b.id('tile_white'));
  b.box(x0 - 2, y + v(3), z0 - 2, x1 + 2, y + v(3) + 3, z1 + 2, b.id('concrete'));
  const fx = dx > 0 ? x1 - 2 : x0, fz = dz > 0 ? z1 - 2 : z0;
  // the glass front, the red lamp over the door, the white sign on the roof edge with KOBAN on it
  const tw = textWidth('KOBAN', 1), sy0 = y + v(3) + 3, sy1 = sy0 + 7, dark = b.id('metal_dark');
  if (alongX) {
    b.box(x0 + v(0.8), y + 1, fz, x1 - v(0.8), y + v(2.3), fz + 2, b.id('glass'));
    b.box(x - 3, y + v(2.5), fz + dz * 2, x + 3, y + v(2.9), fz + dz * 2 + 2, b.id('neon_pink'));
    b.box(x - (tw >> 1) - 2, sy0, fz, x + (tw >> 1) + 3, sy1, fz + 2, b.id('sign_white'));
    const pz = dz > 0 ? fz + 2 : fz - 1;
    stampText(b, 'KOBAN', dark, (u, row) => [x - dz * (tw >> 1) + dz * u, sy1 - 1 - row, pz], 1);
  } else {
    b.box(fx, y + 1, z0 + v(0.8), fx + 2, y + v(2.3), z1 - v(0.8), b.id('glass'));
    b.box(fx + dx * 2, y + v(2.5), z - 3, fx + dx * 2 + 2, y + v(2.9), z + 3, b.id('neon_pink'));
    b.box(fx, sy0, z - (tw >> 1) - 2, fx + 2, sy1, z + (tw >> 1) + 3, b.id('sign_white'));
    const px = dx > 0 ? fx + 2 : fx - 1;
    stampText(b, 'KOBAN', dark, (u, row) => [px, sy1 - 1 - row, z + dx * (tw >> 1) - dx * u], 1);
  }
  bicycle(b, alongX ? x1 + 3 : x + v(1), alongX ? z + v(1) : z1 + 3, y + 1, !alongX, b.id('paint_white'));
}

// ------------------------------------------------------------------------------------------- vehicles

/** A one-box van (4.7 × 1.7 × 1.95 m), optionally with a stripe (an ambulance). */
export function van(b: Builder, x: number, z: number, y: number, alongX: boolean, paint: number, flip = false, stripe?: number): void {
  const s = flip ? -1 : 1;
  const bx = (u0: number, y0: number, w0: number, u1: number, y1: number, w1: number, m: number) => {
    const a = Math.min(u0 * s, u1 * s), c = Math.max(u0 * s, u1 * s);
    if (alongX) b.box(x + a, y + y0, z + w0, x + c, y + y1, z + w1, m);
    else b.box(x + w0, y + y0, z + a, x + w1, y + y1, z + c, m);
  };
  const dark = b.id('metal_dark'), tire = b.id('tire'), glass = b.id('window');
  bx(-18, 1, -6, 18, 2, 6, dark);
  bx(-19, 2, -7, 19, 15, 7, paint);
  bx(-17, 15, -6, 15, 16, 6, paint);
  bx(10, 8, -7, 19, 13, 7, glass);
  bx(-15, 9, -7, 8, 13, -6, glass);
  bx(-15, 9, 6, 8, 13, 7, glass);
  if (stripe !== undefined) {
    bx(-19, 6, -7, 19, 7, 7, stripe);
    bx(-3, 16, -2, 3, 17, 2, stripe);
  }
  for (const u of [-14, 9]) {
    bx(u, 0, -7, u + 5, 4, -5, tire);
    bx(u, 0, 5, u + 5, 4, 7, tire);
  }
  bx(19, 4, -6, 20, 6, -3, b.id('lamp'));
  bx(19, 4, 3, 20, 6, 6, b.id('lamp'));
}

/** A small lorry (6.8 m): the cab and a box body. */
export function lorry(b: Builder, x: number, z: number, y: number, alongX: boolean, body: number, flip = false): void {
  const s = flip ? -1 : 1;
  const bx = (u0: number, y0: number, w0: number, u1: number, y1: number, w1: number, m: number) => {
    const a = Math.min(u0 * s, u1 * s), c = Math.max(u0 * s, u1 * s);
    if (alongX) b.box(x + a, y + y0, z + w0, x + c, y + y1, z + w1, m);
    else b.box(x + w0, y + y0, z + a, x + w1, y + y1, z + c, m);
  };
  const dark = b.id('metal_dark'), tire = b.id('tire'), cab = b.id('paint_white');
  bx(-27, 2, -7, 27, 4, 7, dark);
  bx(13, 4, -8, 27, 18, 8, cab);
  bx(21, 10, -8, 27, 16, 8, b.id('window'));
  bx(-27, 4, -9, 12, 24, 9, body);
  bx(-27, 22, -9, 12, 24, 9, b.id('metal'));
  for (const u of [-22, -14, 17]) {
    bx(u, 0, -8, u + 5, 5, -6, tire);
    bx(u, 0, 6, u + 5, 5, 8, tire);
  }
  bx(27, 5, -7, 28, 7, -4, b.id('lamp'));
  bx(27, 5, 4, 28, 7, 7, b.id('lamp'));
}

/** A city bus (10.5 × 2.5 × 3.1 m): white with a green band, the window band, doors, wheels. */
export function bus(b: Builder, x: number, z: number, y: number, alongX: boolean, flip = false): void {
  const s = flip ? -1 : 1;
  const bx = (u0: number, y0: number, w0: number, u1: number, y1: number, w1: number, m: number) => {
    const a = Math.min(u0 * s, u1 * s), c = Math.max(u0 * s, u1 * s);
    if (alongX) b.box(x + a, y + y0, z + w0, x + c, y + y1, z + w1, m);
    else b.box(x + w0, y + y0, z + a, x + w1, y + y1, z + c, m);
  };
  const white = b.id('paint_white'), green = b.id('sign_green'), glass = b.id('window'), dark = b.id('metal_dark'), tire = b.id('tire');
  bx(-42, 2, -10, 42, 25, 10, white);
  bx(-42, 4, -10, 42, 8, 10, green);
  bx(-38, 11, -10, 40, 21, 10, glass);
  for (let u = -32; u < 36; u += 10) {
    bx(u, 11, -10, u + 1, 21, -9, white);
    bx(u, 11, 9, u + 1, 21, 10, white);
  }
  bx(41, 9, -9, 43, 22, 9, glass);
  bx(41, 22, -6, 43, 24, 6, b.id('sign_orange'));
  bx(28, 2, -11, 36, 22, -10, glass);
  bx(-6, 2, -11, 2, 22, -10, glass);
  bx(-40, 25, -8, 40, 26, 8, dark);
  for (const u of [-30, 26]) {
    bx(u, 0, -10, u + 7, 6, -8, tire);
    bx(u, 0, 8, u + 7, 6, 10, tire);
  }
}

/** A taxi: a car in the company colour with the lit roof sign. */
export function taxi(b: Builder, x: number, z: number, y: number, alongX: boolean, flip = false): void {
  car(b, x, z, y, alongX, b.id('paint_yellow'), flip);
  if (alongX) b.box(x - 2, y + 12, z - 3, x + 2, y + 14, z + 3, b.id('lamp'));
  else b.box(x - 3, y + 12, z - 2, x + 3, y + 14, z + 2, b.id('lamp'));
}

// ------------------------------------------------------------------------------------------- deep under the town

/**
 * Urahara's underground training ground (勉強部屋) under the shop: a cavern dug out of the rock, `rx` by `rz` across
 * and from `floor` up to `ceil`, its walls curving in under a ceiling painted as a summer sky (a shell of glowing mural
 * two voxels thick), a floor of dry sand and dirt, rock spires (a few of them pillars to the ceiling) and boulders,
 * and the ladder shaft up to the hatch in the shop's floor at (hx, hz).
 */
export function trainingGround(b: Builder, cx: number, cz: number, rx: number, rz: number, floor: number, ceil: number, hatch: [number, number], shopFloor: number, rng: Rng): void {
  const v = (m: number) => b.v(m);
  const sky = b.id('sky_mural'), sand = b.id('sand'), dirt = b.id('dirt'), stone = b.id('stone'), dark = b.id('stone_dark');
  const H = ceil - floor, curve = v(5);
  // the plan's scale at height h above the floor: straight walls, then curving in under the ceiling
  const scale = (h: number) => (h < H - curve ? 1 : 1 - 0.2 * Math.pow((h - (H - curve)) / curve, 1.5));
  // a superellipse footprint: squarer than an ellipse, so the floor is broad
  const halfX = (dz: number, sc: number) => {
    const t = Math.abs(dz) / (rz * sc);
    if (t >= 1) return -1;
    return Math.floor(rx * sc * Math.pow(1 - Math.pow(t, 3), 1 / 3));
  };
  // the painted shell first (a little wider), then the hollow inside it
  for (let y = ceil - curve - 2; y <= ceil + 2; y++) {
    const sc = scale(Math.min(H, y - floor)) + 3 / rx;
    for (let dz = -Math.ceil(rz * sc); dz <= Math.ceil(rz * sc); dz++) {
      const hx = halfX(dz, sc);
      if (hx > 0) b.box(cx - hx, y, cz + dz, cx + hx + 1, y + 1, cz + dz + 1, sky);
    }
  }
  for (let y = floor; y < ceil; y++) {
    const sc = scale(y - floor);
    for (let dz = -rz; dz <= rz; dz++) {
      const hx = halfX(dz, sc);
      if (hx > 0) b.box(cx - hx, y, cz + dz, cx + hx + 1, y + 1, cz + dz + 1, 0);
    }
  }
  // the floor: dry sand over rock, patches of dirt, gentle swells
  for (let dz = -rz; dz <= rz; dz++) {
    const hx = halfX(dz, 1);
    if (hx <= 0) continue;
    b.box(cx - hx, floor - 3, cz + dz, cx + hx + 1, floor, cz + dz + 1, sand);
  }
  for (let i = 0; i < 26; i++) {
    const px = cx + rng.int(-rx + v(3), rx - v(3)), pz = cz + rng.int(-rz + v(3), rz - v(3));
    const r = v(rng.range(1.5, 4));
    b.ellipsoid(px, floor - 1, pz, r, v(rng.range(0.3, 0.8)), r * rng.range(0.6, 1.2), rng.chance(0.5) ? dirt : sand);
  }
  // rock spires and pillars
  for (let i = 0; i < 9; i++) {
    const px = cx + rng.int(-rx + v(6), rx - v(6)), pz = cz + rng.int(-rz + v(6), rz - v(6));
    if (Math.hypot(px - hatch[0], pz - hatch[1]) < v(7)) continue;
    const pillar = i < 2;
    const h = pillar ? H + 4 : v(rng.range(5, 12));
    const r0 = v(rng.range(1.6, 2.6));
    for (let y = 0; y < h; y += 4) {
      const t = y / h;
      const r = pillar ? r0 * (1 - 0.45 * Math.sin(t * Math.PI)) : r0 * (1 - 0.75 * t);
      b.cylinderY(px + Math.round(Math.sin(y * 0.05 + i) * 3), pz + Math.round(Math.cos(y * 0.04 + i) * 3), floor - 2 + y, floor - 2 + Math.min(h, y + 4), Math.max(2, r), i % 3 === 0 ? dark : stone);
    }
  }
  for (let i = 0; i < 14; i++) {
    const px = cx + rng.int(-rx + v(4), rx - v(4)), pz = cz + rng.int(-rz + v(4), rz - v(4));
    if (Math.hypot(px - hatch[0], pz - hatch[1]) < v(5)) continue;
    const r = v(rng.range(0.6, 1.8));
    b.ellipsoid(px, floor + r * 0.4, pz, r * rng.range(0.9, 1.4), r * 0.8, r, rng.chance(0.3) ? dark : stone);
  }
  // the shaft: a lined square well from the shop's floor down through the painted sky, rungs down one side
  const [hx, hz] = hatch, s = v(0.7);
  b.box(hx - s - 2, ceil - 2, hz - s - 2, hx + s + 2, shopFloor, hz + s + 2, b.id('concrete_dark'));
  b.box(hx - s, ceil - 2, hz - s, hx + s, shopFloor, hz + s, 0);
  for (let y = ceil; y < shopFloor - 2; y += 3) b.box(hx - 3, y, hz + s - 1, hx + 3, y + 1, hz + s, b.id('metal'));
  // a ladder from the shaft's mouth down to the floor, on a wooden frame
  for (const dx of [-3, 3]) b.box(hx + dx, floor, hz + s - 1, hx + dx + 1, ceil, hz + s, b.id('wood'));
  for (let y = floor + 2; y < ceil; y += 3) b.box(hx - 3, y, hz + s - 1, hx + 4, y + 1, hz + s, b.id('wood'));
}
