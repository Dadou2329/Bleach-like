// Ichigo's Full Hollow form (the "Vasto Lorde" body that rose on the dome of Las Noches; docs/roster/
// A1-ichigo.md §0 row 7 and its palette). A bone helmet over the whole head with two long horns sweeping
// forward from the temples, black-striped from the middle to the tip; on the mask four spike-shaped black
// marks (two stop on the forehead, two run down past the eyes and the teeth into the chest marks) and small
// heart marks at the inner corners of the eyes; black eyes with gold irises over a grin of teeth. Straight
// orange hair to the waist. White skin, a wide black band across the chest and shoulders radiating in
// spikes from the small Hollow hole on the sternum (empty: the hair behind shows through it). Crimson fur
// ruffs round the neck, the wrists and the ankles; claws on the fingers and toes; the black hakama torn to
// mid-shin and the white obi. Same skeleton as the Shinigami bodies, so Tensa Zangetsu and the clips fit.
import { ModelBuilder } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, sphere, spike, type V3 } from '../models/sdf';
import { SPEC_ADULT_MALE, addBands, hakama, hands, head, humanoidSkeleton, obi, type Landmarks } from './humanoid';
import type { SpringDef, ColliderDef } from '../anim/springs';
import type { CharacterAsset } from './ichigo';

const RES = 48;

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F3EEE8', '#EEE8E2', '#D9D2CA', '#CEC6BE', '#9E968E'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('mask', ['#F3F1EA', '#EEEBE3', '#DCD8CC', '#C2BDB0', '#A29C8E'], { base: 1, rough: 0.42, shadeK: 1 });
  b.mat('mark', ['#141418'], { rough: 0.55 });
  b.mat('void', ['#141418'], { rough: 1 });
  b.mat('iris', ['#F2D84E'], { rough: 0.3, glow: 1.6 });
  b.mat('teeth', ['#F3EEE4', '#E2DCCF'], { base: 0, rough: 0.35 });
  b.mat('gap', ['#1A1416'], { rough: 0.9 });
  b.mat('horn', ['#F1EAE3', '#EDE6DF', '#D6CEC6', '#B9B0A8', '#978E86'], { base: 1, rough: 0.4, shadeK: 0.9 });
  b.mat('hair', ['#F2B067', '#E58E3A', '#D07C2E', '#B96F28', '#8F4F1C'], { base: 1, rough: 0.6, shadeK: 0.85, dither: 0.05 });
  b.mat('fur', ['#DA5A5C', '#C23A3E', '#A12E33', '#842629', '#6B2224'], { base: 1, rough: 0.9, shadeK: 0.9, dither: 0.14 });
  b.mat('claw', ['#F3EEE7', '#DDD5CB', '#B9B0A8'], { base: 0, rough: 0.3 });
  b.mat('black', ['#4A4956', '#3A3944', '#24232B', '#1A1A20', '#141418'], { base: 2, rough: 0.92, shadeK: 1, dither: 0.04 });
  b.mat('obi', ['#F1EEE8', '#E2DFD8', '#B8B4AC'], { base: 0, rough: 0.85, dither: 0.04 });
}

const assetCache: { a?: CharacterAsset } = {};

/** Cached (the revive must not re-run the DSL mid-fight). */
export function ichigoHollowAsset(): CharacterAsset {
  return (assetCache.a ??= buildIchigoHollow());
}

export function buildIchigoHollow(): CharacterAsset {
  const b = new ModelBuilder('ichigo-hollow', RES);
  palette(b);
  const s = SPEC_ADULT_MALE;
  const L = humanoidSkeleton(b, s, { hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('chest.front', 'chest', [0, s.chestY + 2.4, 7]);
  b.socket('back', 'chest', [1, 62, -7.5]);
  const hd = helmet(b, L);
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  // the Cero gathers between the horn tips
  b.socket('horns', 'head', [0, s.chinY + 10.5, hd.front + 9]);
  const maneSprings = mane(b, L);
  body(b, L);
  hands(b, L, 'skin');
  claws(b, L);
  const o = { black: 'black', collar: 'black', skin: 'skin', obi: 'obi', hakamaHem: 11, hemR: 8.2 };
  obi(b, L, o);
  hakama(b, L, o);
  tatters(b, L, 11, 8.2);
  legs(b, L);
  fur(b, L);
  b.autoShade();
  b.lint();
  const springs: SpringDef[] = [...maneSprings];
  for (const side of ['L', 'R']) springs.push({ bone: `hakama.${side}`, tail: [0, -0.4, 0], stiffness: 70, damping: 6, gravity: 8, limit: 55, radius: 0.12 });
  const colliders: ColliderDef[] = [
    { bone: 'shin.L', offset: [0, -0.15, 0], radius: 0.07 },
    { bone: 'shin.R', offset: [0, -0.15, 0], radius: 0.07 },
    { bone: 'chest', offset: [0, 0.05, -0.02], radius: 0.17 },
    { bone: 'spine', offset: [0, 0, -0.02], radius: 0.15 },
    { bone: 'hips', offset: [0, 0.02, -0.02], radius: 0.16 },
  ];
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- the mask

/** The helmet: the whole head in bone, the face plate flat for the features, the horns and the marks. */
function helmet(b: ModelBuilder, L: Landmarks): { front: number; chin: number } {
  const s = L.spec;
  const hd = head(b, L, 'mask');
  const c = hd.chin, f = hd.front;
  // a smooth dome over the skull, standing a little proud of the face plate's top edge
  b.add('head', intersect(ellipsoid([0, c + 7.8, -0.7], [6.1, 6.7, 6.3]), halfSpace([0, c + 6.6, 0], [0, -1, 0]), halfSpace([0, 0, f - 0.4], [0, 0, 1])), 'mask');
  // the back of the helmet comes down to the nape, the sides cover the ears
  b.add('head', intersect(ellipsoid([0, c + 5.4, -1.6], [5.8, 6.4, 5.4]), halfSpace([0, 0, f - 2], [0, 0, 1])), 'mask');
  // heavy brows over the eyes, lower toward the nose (the glare)
  for (const k of [-1, 1]) b.add('head', ellipsoid([k * 2.9, c + 7.4, f - 0.3], [2.5, 0.75, 1.1], [0, 0, k * 12]), 'mask');
  // eyes: slanted almond hollows, black inside, a gold iris floating in the dark
  for (const k of [-1, 1]) {
    const ex = k * 2.6;
    b.carve('head', ellipsoid([ex, c + 5.5, f + 0.2], [1.9, 1.05, 1.7], [0, 0, k * 14]));
    b.paint('head', ellipsoid([ex, c + 5.5, f - 0.8], [2.3, 1.4, 2.2], [0, 0, k * 14]), 'void');
    b.voxel('head', k > 0 ? 2 : -3, c + 5, f - 2, 'iris');
  }
  // the grin: upper and lower rows of teeth across the jaw, a black seam between them
  const g = b.grid('head');
  for (let x = -4; x < 4; x++) {
    for (let y = c; y <= c + 3; y++) {
      let z = f + 2;
      while (z > f - 4 && g.get(x, y, z) === 0) z--;
      if (g.get(x, y, z) === 0) continue;
      const seam = y === c + 1 || x === -3 || x === 0 || x === 2;
      b.voxel('head', x, y, z, seam ? 'gap' : 'teeth', 'flat');
    }
  }
  // the marks: two short spikes up the forehead…
  for (const k of [-1, 1]) b.paint('head', spike([k * 1.7, c + 7.6, f - 0.4], [k * 0.12, 1, -0.32], 6.4, 1.2, 1, { tip: 0.2 }), 'mark', { where: b.isMat('mask') });
  // …and two long ones from the crown down past the outer corners of the eyes and the teeth to the chin
  for (const k of [-1, 1]) {
    b.paint('head', spike([k * 4.1, c + 12.6, f - 2.6], [0, -0.95, 0.3], 7, 1.25, 1.1, { tip: 0.4 }), 'mark', { where: b.isMat('mask') });
    b.paint('head', capsule([k * 4.2, c + 6.4, f - 0.5], [k * 3.7, c - 0.6, f - 0.5], 0.8, 0.55), 'mark', { where: b.isMat('mask') });
    // the small open heart at the inner corner of each eye
    b.voxel('head', k > 0 ? 0 : -1, c + 6, f - 1, 'mark', 'flat');
    b.voxel('head', k > 0 ? 1 : -2, c + 5, f - 1, 'mark', 'flat');
  }
  // the marks carry on down the throat into the chest band
  for (const k of [-1, 1]) b.paint('neck', capsule([k * 1.6, c + 1, 1.2], [k * 1.2, c - 5, 1.6], 0.75), 'mark', { where: b.isMat('mask') });
  // the horns: long, from the temples, sweeping forward and a little up, black-striped toward the tips
  for (const k of [-1, 1]) {
    const base: V3 = [k * 5.2, c + 9.6, -0.2];
    const dir: V3 = [k * 0.2, 0.16, 1];
    const len = 16;
    b.add('head', spike(base, dir, len, 2, 2, { tip: 0.35, taper: 0.85, bend: [-k * 0.05, 0.12, 0] }), 'horn', { thr: 0.25 });
    // a collar of bone where the horn leaves the helmet
    b.add('head', ellipsoid([k * 5.1, c + 9.6, 0.4], [1.6, 2.4, 2.4]), 'horn');
    const dl = Math.hypot(...dir);
    const d: V3 = [dir[0] / dl, dir[1] / dl, dir[2] / dl];
    b.paint('head', fn((x, y, z) => {
      const u = ((x - base[0]) * d[0] + (y - base[1]) * d[1] + (z - base[2]) * d[2]) / len;
      if (u < 0.48 || u > 1.1) return 1;
      return (((u - 0.48) * 9) % 1) < 0.42 ? -1 : 1;
    }, [k > 0 ? 2 : -14, c + 5, -4], [k > 0 ? 14 : -2, c + 18, 20]), 'mark', { where: b.isMat('horn') });
  }
  return { front: f, chin: c };
}

// ---------------------------------------------------------------------------------------------- hair

/** Straight orange hair from under the helmet to the waist: a curtain on three spring bones. */
function mane(b: ModelBuilder, L: Landmarks): SpringDef[] {
  const c = L.spec.chinY;
  const P: V3[] = [[0, c + 6, -6.2], [0, c - 8, -8.8], [0, c - 20, -9.2], [0, c - 33, -8.4]];
  const W = [5.6, 6.4, 6, 4.8];
  const names = ['mane1', 'mane2', 'mane3'];
  b.bone('mane1', 'head', P[0]);
  b.bone('mane2', 'mane1', P[1]);
  b.bone('mane3', 'mane2', P[2]);
  // a thick sheet between two points: width along X, thickness across the YZ line
  const slab = (a: V3, e: V3, w0: number, w1: number, t: number) => fn((x, y, z) => {
    const dy = e[1] - a[1], dz = e[2] - a[2];
    const len = Math.hypot(dy, dz);
    const along = ((y - a[1]) * dy + (z - a[2]) * dz) / len;
    const u = Math.max(0, Math.min(1, along / len));
    const py = a[1] + dy * u, pz = a[2] + dz * u;
    const w = w0 + (w1 - w0) * u;
    const px = a[0] + (e[0] - a[0]) * u;
    return Math.max(Math.abs(x - px) - w, Math.hypot(y - py, z - pz) - t, -along - 0.5, along - len - 0.5);
  }, [Math.min(a[0], e[0]) - Math.max(w0, w1) - 2, Math.min(a[1], e[1]) - 3, Math.min(a[2], e[2]) - t - 3], [Math.max(a[0], e[0]) + Math.max(w0, w1) + 2, Math.max(a[1], e[1]) + 3, Math.max(a[2], e[2]) + t + 3]);
  // a curtain of separate straight locks, a little uneven in length and depth, thinning toward the ends
  const locks = [-4.6, -2.3, 0, 2.3, 4.6];
  for (let i = 0; i < 3; i++) {
    locks.forEach((x0, j) => {
      const dz = ((j * 5) % 3) * 0.35 - 0.35;
      const k0 = W[i] / 5.6, k1 = W[i + 1] / 5.6;
      const a: V3 = [x0 * k0, P[i][1] + (i === 0 ? 0 : 0.6), P[i][2] + dz];
      const e: V3 = [x0 * k1, P[i + 1][1] - (i === 2 ? (j % 2) * 1.6 : 0), P[i + 1][2] + dz];
      b.add(names[i], slab(a, e, 1.35 - i * 0.08, 1.25 - i * 0.12, 1.35 - i * 0.1), 'hair', { thr: 0.2 });
    });
  }
  // it fans out from under the rim of the helmet and over the shoulders
  b.add('mane1', ellipsoid([0, c + 3.4, -6.6], [6.2, 3.4, 2.2]), 'hair', { thr: 0.2 });
  for (const k of [-1, 1]) b.add('mane1', capsule([k * 5.2, c + 4, -4.6], [k * 6.2, c - 4, -6.4], 1.5, 1.2), 'hair', { thr: 0.25 });
  // strands: thin darker grooves down the length
  b.paint(names, fn((x) => Math.abs((((x + 31.3) % 1.9) + 1.9) % 1.9 - 0.95) - 0.28, [-9, c - 36, -14], [9, c + 10, 0]), 'hair', { shade: 3, where: b.isMat('hair') });
  const springs: SpringDef[] = [];
  for (let i = 0; i < 3; i++) {
    const t: V3 = [(P[i + 1][0] - P[i][0]) / RES, (P[i + 1][1] - P[i][1]) / RES, (P[i + 1][2] - P[i][2]) / RES];
    springs.push({ bone: names[i], tail: t, stiffness: [22, 16, 12][i], damping: 5, gravity: 14, limit: [70, 80, 90][i], radius: 0.09 });
  }
  return springs;
}

// ---------------------------------------------------------------------------------------------- body

/** White skin, lean and hard; the hole at the sternum; the black band across the chest and shoulders. */
function body(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const torso = blend(3,
    box([0, s.chestY - 0.5, -0.3], [cx, 6, cz], { round: 3.2 }),
    box([0, s.waistY, -0.2], [wx, 4.6, wz], { round: 2.8 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.6, s.hips[1]], { round: 2.4 }),
    capsule([2.4, sy + 1.4, sz - 0.8], [sx - 1.5, sy - 0.2, sz], 2.9, 3),
    capsule([-2.4, sy + 1.4, sz - 0.8], [-sx + 1.5, sy - 0.2, sz], 2.9, 3),
    sphere([sx, sy - 0.5, sz], 3.2), sphere([-sx, sy - 0.5, sz], 3.2),
    // pectorals
    ellipsoid([3.3, s.chestY + 1, cz - 0.6], [3.8, 3, 1.8]), ellipsoid([-3.3, s.chestY + 1, cz - 0.6], [3.8, 3, 1.8]));
  addBands(b, torso, 'skin', [['hips', 36, 45], ['spine', 45, 56], ['chest', 54, 80]]);
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3), capsule([sx, sy - 1, sz], [sx, ey + 1, sz], 2.7, 2.3)), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.3), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 2.3, 1.8)), 'skin', { mirror: true });
  // the lines of the muscle: under the pecs, the abdominal grid
  for (const k of [-1, 1]) b.paint('chest', capsule([k * 0.8, s.chestY - 1.8, cz + 1], [k * 6, s.chestY - 1.2, cz - 0.4], 0.4), 'skin', { shade: 3 });
  b.paint(['chest', 'spine'], capsule([0, s.chestY - 2, cz + 1], [0, s.waistY - 2, wz + 0.8], 0.35), 'skin', { shade: 3 });
  for (const y of [s.chestY - 4.6, s.waistY + 2.2]) b.paint(['chest', 'spine'], capsule([-3, y, wz + 0.8], [3, y, wz + 0.8], 0.32), 'skin', { shade: 3 });
  // the black band: over the shoulders and across the upper chest, its lower edge breaking into spikes
  const hy = s.chestY + 2.4;
  const spikes: [number, number, number][] = [[0, 6.5, 1.7], [4.3, 4.2, 1.5], [-4.3, 4.2, 1.5], [8.3, 2.6, 1.3], [-8.3, 2.6, 1.3]];
  const band = fn((x, y, z) => {
    let drop = 0;
    for (const [xk, depth, w] of spikes) drop = Math.max(drop, depth * Math.max(0, 1 - Math.abs(x - xk) / w));
    const bottom = s.chestY + 1.4 - drop;
    // the front and the tops of the shoulders, not the back
    const back = y > sy - 1 ? -z - 4.5 : -z - 1;
    return Math.max(bottom - y, back);
  }, [-16, s.chestY - 8, -8], [16, s.chinY, 10]);
  b.paint(['chest', 'spine', 'upperarm.L', 'upperarm.R'], band, 'mark', { where: b.isMat('skin') });
  // the hole: small, at the sternum, clean through
  b.carve(['chest', 'spine'], cylinder([0, hy, -14], [0, hy, 14], 1.9));
}

/** Retractable claws: short, pale points on the fingers (open hand and fist alike). */
function claws(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [wx, wy, wz] = L.wrist;
  for (let i = 0; i < 4; i++) {
    const z = wz - 1 + i * 1.25;
    b.add('palm.L', spike([wx - 0.3, wy - s.hand + 1.4, z], [-0.2, -1, 0.1], 2.4, 0.55, 0.5, { tip: 0.2 }), 'claw', { mirror: true, thr: 0.3 });
    b.add('fist.L', spike([wx - 2, wy - 6.6, z + 0.6], [-0.35, -0.4, 0.85], 1.8, 0.5, 0.5, { tip: 0.2 }), 'claw', { mirror: true, thr: 0.3 });
  }
}

/** The hakama torn short and ragged: V notches round the hem, a couple of rents. */
function tatters(b: ModelBuilder, L: Landmarks, hem: number, R: number): void {
  const [hx] = L.spec.hip;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.2;
    const h = 2.6 + ((i * 5) % 4) * 1.1;
    b.carve('hakama.L', spike([hx + 0.6 + Math.sin(a) * (R - 0.4), hem - 1.2, -0.5 + Math.cos(a) * (R - 0.4) * 1.25], [0, 1, 0], h, 1.3, 1.3), { mirror: true });
  }
  b.carve('thigh.L', ellipsoid([L.spec.hip[0] + 4.4, L.knee[1] + 7, 5.4], [1.6, 2.2, 1.4]), { mirror: false });
  b.carve('hakama.R', ellipsoid([-L.spec.hip[0] - 5.2, hem + 5, -7], [1.4, 2, 1.6]));
}

/** Bare white shins and clawed feet below the torn hem. */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [ax, ay, az] = L.ankle;
  const ky = L.knee[1];
  const f = s.foot;
  const toeZ = az + f.len - f.heel;
  b.add('shin.L', capsule([ax, ky + 1, 0], [ax, ay + 2, 0], 2.6, 2.1), 'skin', { mirror: true });
  b.add('foot.L', capsule([ax, ay + 3, az - 0.5], [ax, ay - 1, az - 0.5], 2.2), 'skin', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.1, az + (f.len / 2 - f.heel)], [f.w / 2, 2, f.len / 2], { round: 1.4 }), halfSpace([0, 4.2, toeZ - 3], [0, 1, 0.7])), 'skin', { mirror: true });
  // toes, and a claw on each
  b.carve('foot.L', aabb([ax - 1, 0, toeZ - 2], [ax, 2.5, toeZ + 1]), { mirror: true });
  for (let i = 0; i < 3; i++) b.add('foot.L', spike([ax - 1.5 + i * 1.5, 1.1, toeZ - 0.5], [0, -0.4, 1], 2, 0.55, 0.5, { tip: 0.2 }), 'claw', { mirror: true, thr: 0.3 });
}

/** Crimson fur: a ruff from the collarbones round the neck, one round each wrist and each ankle. */
function fur(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, , sz] = s.shoulder;
  const wy = L.wrist[1];
  const [ax, ay] = L.ankle;
  // neck: two rings of tufts standing out and up from the base of the neck, thicker at the front
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const front = Math.max(0, Math.cos(a));
    const r = 3.6 + front * 0.8;
    const base: V3 = [Math.sin(a) * r, s.chinY - 5.4, -1.2 + Math.cos(a) * r];
    b.add('chest', spike(base, [Math.sin(a), 0.5 + front * 0.25, Math.cos(a)], 3 + front * 1.2 + (i % 3) * 0.5, 1.4, 0.8, { tip: 0.3, bend: [0, 0.2, 0] }), 'fur', { thr: 0.3 });
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    b.add('chest', spike([Math.sin(a) * 4.4, s.chinY - 7, -1.2 + Math.cos(a) * 4.6], [Math.sin(a), 0.15, Math.cos(a)], 2.6, 1.2, 0.75, { tip: 0.3 }), 'fur', { thr: 0.3 });
  }
  b.add('chest', ellipsoid([0, s.chinY - 5.6, -1.2], [4.8, 1.8, 4.6]), 'fur', { thr: 0.2 });
  // wrists: a cuff of tufts pointing out and down over the hand
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.add('forearm.L', spike([sx + Math.sin(a) * 2, wy + 1.8, sz + Math.cos(a) * 2], [Math.sin(a), -0.55, Math.cos(a)], 2.6 + (i % 2) * 0.6, 1.1, 0.7, { tip: 0.3 }), 'fur', { mirror: true, thr: 0.3 });
  }
  b.add('forearm.L', capsule([sx, wy + 2.8, sz], [sx, wy + 0.6, sz], 2.5), 'fur', { mirror: true, thr: 0.2 });
  // ankles
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    b.add('shin.L', spike([ax + Math.sin(a) * 2.2, ay + 3.6, Math.cos(a) * 2.2], [Math.sin(a), -0.3, Math.cos(a)], 2.4 + (i % 2) * 0.5, 1.1, 0.7, { tip: 0.3 }), 'fur', { mirror: true, thr: 0.3 });
  }
  b.add('shin.L', capsule([ax, ay + 4.6, 0], [ax, ay + 2.6, 0], 2.6), 'fur', { mirror: true, thr: 0.2 });
  // the fur's grain
  b.paint(['chest', 'forearm.L', 'forearm.R', 'shin.L', 'shin.R'], fn((x, y, z) => Math.abs(((x * 1.7 + z * 1.3 + y * 0.4 + 90) % 1.6) - 0.8) - 0.22, [-20, 0, -20], [20, 80, 20]), 'fur', { shade: 3, where: b.isMat('fur') });
}
