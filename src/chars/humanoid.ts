// Shared humanoid construction at 48 vox/m: skeleton, head & face plate, hands (palm + fist variants),
// feet, and Shinigami garments (kosode, juban collar, sleeves with hanging bags, obi, hakama, tabi,
// waraji). Character files supply a spec + palette and add their signature pieces (hair, weapons,
// straps, masks). All coordinates are voxels; the model faces +Z and +X is the character's left.
import { ModelBuilder } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, prism, scale, sphere, spike, subtract, tube, type Sdf, type V3 } from '../models/sdf';
import type { SpringDef, ColliderDef } from '../anim/springs';

export interface HumanoidSpec {
  /** crown height (voxels) */
  H: number;
  chinY: number;
  head: { w: number; d: number; h: number };
  neckR: number;
  shoulder: V3; // upper-arm pivot (left side, +X)
  upperArm: number;
  foreArm: number;
  hand: number;
  armR: number;
  hipsY: number;
  hip: V3; // thigh pivot (left side)
  kneeY: number;
  ankleY: number;
  /** torso half extents [x, z] at chest / waist / hips */
  chest: [number, number];
  waist: [number, number];
  hips: [number, number];
  chestY: number;
  waistY: number;
  foot: { len: number; w: number; heel: number };
}

export const SPEC_ADULT_MALE: HumanoidSpec = {
  H: 84,
  chinY: 72,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.6,
  shoulder: [9.5, 66.5, -0.5],
  upperArm: 14.5,
  foreArm: 13,
  hand: 9,
  armR: 2.6,
  hipsY: 45,
  hip: [4.5, 42, 0],
  kneeY: 23,
  ankleY: 4.5,
  chest: [8.5, 5],
  waist: [7, 4.3],
  hips: [7.5, 4.8],
  chestY: 61,
  waistY: 51,
  foot: { len: 12, w: 5, heel: 3 },
};

export interface Landmarks {
  spec: HumanoidSpec;
  headC: V3; // head centre
  elbow: V3; // left
  wrist: V3; // left
  knee: V3;
  ankle: V3;
}

/** Bones (order matters: parents first). */
export function humanoidSkeleton(b: ModelBuilder, s: HumanoidSpec, extras: { sleeves?: boolean; hakama?: boolean } = {}): Landmarks {
  const sh = s.shoulder;
  const elbow: V3 = [sh[0], sh[1] - s.upperArm, sh[2]];
  const wrist: V3 = [sh[0], elbow[1] - s.foreArm, sh[2]];
  const knee: V3 = [s.hip[0], s.kneeY, s.hip[2]];
  const ankle: V3 = [s.hip[0], s.ankleY, s.hip[2]];
  b.bone('root', null, [0, 0, 0]);
  b.bone('hips', 'root', [0, s.hipsY, 0]);
  b.bone('spine', 'hips', [0, s.waistY - 1, -0.5]);
  b.bone('chest', 'spine', [0, s.chestY - 4, -0.5]);
  b.bone('neck', 'chest', [0, s.chinY - 3, -0.8]);
  b.bone('head', 'neck', [0, s.chinY + 0.5, -0.8]);
  b.boneSym('shoulder.L', 'chest', [3, sh[1] - 0.5, sh[2]]);
  b.boneSym('upperarm.L', 'shoulder.L', sh);
  b.boneSym('forearm.L', 'upperarm.L', elbow);
  b.boneSym('hand.L', 'forearm.L', wrist);
  b.boneSym('palm.L', 'hand.L', wrist);
  b.boneSym('fist.L', 'hand.L', wrist);
  b.boneSym('thigh.L', 'hips', s.hip);
  b.boneSym('shin.L', 'thigh.L', knee);
  b.boneSym('foot.L', 'shin.L', ankle);
  if (extras.sleeves) b.boneSym('sleeve.L', 'forearm.L', [elbow[0], elbow[1] - 1, elbow[2] - 2]);
  if (extras.hakama) b.boneSym('hakama.L', 'thigh.L', [knee[0] + 0.5, knee[1] + 4, knee[2]]);
  return { spec: s, headC: [0, s.chinY + s.head.h / 2, -0.5], elbow, wrist, knee, ankle };
}

/** Rasterise one shape and distribute it over bones by height bands [bone, yMin, yMax). */
export function addBands(b: ModelBuilder, shape: Parameters<ModelBuilder['add']>[1], mat: string, bands: [string, number, number][], o: Parameters<ModelBuilder['add']>[3] = {}): void {
  for (const [bone, y0, y1] of bands) b.add(bone, intersect(shape, aabb([-200, y0, -200], [200, y1, 200])), mat, o);
}

// ---------------------------------------------------------------------------------------------- head

/**
 * Skull as a rounded box with a FLAT front plate (rows for pixel-art faces), tapered jaw and chin.
 * Front plate occupies z = [front-1, front), columns x = [-w/2, w/2).
 */
export function head(b: ModelBuilder, L: Landmarks, skin: string): { front: number; x0: number; chin: number } {
  const s = L.spec;
  const hw = s.head.w / 2;
  const chin = s.chinY;
  const front = Math.round(L.headC[2] + s.head.d / 2);
  const back = front - s.head.d;
  // cranium: rounded box from the cheekbones up
  const cran = box([0, chin + 4 + (s.head.h - 4) / 2, (front + back) / 2], [hw, (s.head.h - 4) / 2, s.head.d / 2], { round: 2.2 });
  // back of the skull fuller, rounder
  const occiput = ellipsoid([0, chin + s.head.h * 0.62, back + 4], [hw + 0.3, s.head.h * 0.42, 4.5]);
  // jaw: rows 0-3 taper 4 → 6 → 8 → 9 wide (anime V-shape), flat front
  const jaw = intersect(
    box([0, chin + 2.5, (front + back) / 2 + 1.2], [hw - 0.4, 2.5, s.head.d / 2 - 1.2], { round: 1 }),
    halfSpace([2, chin + 0.5, 0], [1, -1, 0]),
    halfSpace([-2, chin + 0.5, 0], [-1, -1, 0]),
  );
  b.add('head', blend(1.2, cran, occiput, jaw), skin);
  // keep the face plate flat: shave anything in front of the plate
  b.carve('head', aabb([-hw - 2, chin - 2, front], [hw + 2, chin + s.head.h + 2, front + 6]));
  // ears (1 thick, 2 wide, 3 tall) at the eye line
  b.add('head', aabb([hw, chin + 4, -2], [hw + 1, chin + 7, 0]), skin, { mirror: false });
  b.add('head', aabb([-hw - 1, chin + 4, -2], [-hw, chin + 7, 0]), skin);
  // neck
  b.add('neck', capsule([0, chin - 5, L.headC[2] - 0.5], [0, chin + 2, L.headC[2] - 0.5], s.neckR), skin);
  return { front, x0: -hw, chin };
}

/** Standard face legend for the skill's templates. */
export function faceLegend(p: { skin: string; brow: string; lid: string; sclera: string; iris: string; pupil: string; hi: string; mouth: string; teeth?: string; inner?: string }) {
  return {
    s: { mat: p.skin, shade: 2 },
    B: { mat: p.brow },
    L: { mat: p.lid },
    W: { mat: p.sclera },
    I: { mat: p.iris },
    i: { mat: p.pupil },
    '*': { mat: p.hi },
    m: { mat: p.mouth },
    T: { mat: p.teeth ?? p.sclera },
    D: { mat: p.inner ?? p.lid },
    b: { mat: p.brow, proud: 1 },
  };
}

// ---------------------------------------------------------------------------------------------- limbs

/** Hands: open mitten + thumb (palm.*) and a gripping fist with a channel along Z (fist.*). */
export function hands(b: ModelBuilder, L: Landmarks, skin: string, gripR = 1.2): void {
  const [wx, wy, wz] = L.wrist;
  const len = L.spec.hand;
  // open hand: palm 3 thick (x), 5 wide (z), fingers taper; thumb forward-inward
  const palm = blend(
    1.2,
    box([wx, wy - 3, wz + 0.3], [1.5, 3, 2.5], { round: 1 }),
    box([wx - 0.2, wy - len + 3.2, wz + 0.4], [1.2, 3, 2.3], { round: 1 }),
  );
  const thumb = capsule([wx - 0.6, wy - 2, wz + 2.4], [wx - 1.4, wy - 5.2, wz + 3.6], 1.1, 0.9);
  b.add('palm.L', palm, skin, { mirror: true });
  b.add('palm.L', thumb, skin, { mirror: true });
  b.add('palm.L', capsule([wx, wy + 0.5, wz], [wx, wy - 1.5, wz], 1.9), skin, { mirror: true }); // wrist
  // fist: knuckle block around a grip channel running along Z
  const gy = wy - 4.3;
  const fist = subtract(
    box([wx - 0.1, gy, wz + 0.4], [2.1, 3.1, 2.9], { round: 1.1 }),
    cylinder([wx - 0.1, gy, wz - 6], [wx - 0.1, gy, wz + 6], gripR),
  );
  b.add('fist.L', fist, skin, { mirror: true });
  b.add('fist.L', capsule([wx, wy + 0.5, wz], [wx, wy - 1.5, wz], 1.9), skin, { mirror: true });
  // thumb wrapped over the front
  b.add('fist.L', capsule([wx - 1.8, gy + 1.6, wz + 2.2], [wx - 1.2, gy - 0.6, wz + 3.2], 1), skin, { mirror: true });
  // knuckle line shading
  b.paint('fist.L', box([wx + 2, gy + 1.5, wz + 0.4], [0.6, 0.5, 3]), skin, { shade: 2, mirror: true });
}

/** Tabi socks with split toe + waraji sandals. */
export function feet(b: ModelBuilder, L: Landmarks, tabi: string, sole: string, strap: string): void {
  const [ax, ay, az] = L.ankle;
  const f = L.spec.foot;
  const toeZ = az + f.len - f.heel;
  // sock: ankle cylinder + foot wedge
  b.add('foot.L', capsule([ax, ay + 3, az - 0.5], [ax, ay - 1, az - 0.5], 2.4), tabi, { mirror: true });
  const foot = intersect(
    box([ax, 2.5, az + (f.len / 2 - f.heel)], [f.w / 2, 2, f.len / 2], { round: 1.4 }),
    halfSpace([0, 4.5, toeZ - 3], [0, 1, 0.7]), // slope down to the toes
  );
  b.add('foot.L', foot, tabi, { mirror: true });
  // split-toe notch (1 voxel) between big toe and the rest
  b.carve('foot.L', aabb([ax - 1, 1, toeZ - 2], [ax, 3.5, toeZ + 1]), { mirror: true });
  // waraji sole: 1 thick, 1 larger than the foot
  b.add('foot.L', box([ax, 0.5, az + (f.len / 2 - f.heel)], [f.w / 2 + 0.6, 0.5, f.len / 2 + 0.6], { round: 0.6 }), sole, { mirror: true });
  // straps: over the instep and around the ankle
  b.add('foot.L', intersect(box([ax, 2.6, toeZ - 3.5], [f.w / 2 + 0.6, 2.4, 0.6]), halfSpace([0, 5, 0], [0, 1, 0.6])), strap, { mirror: true, thr: 0.1 });
  b.add('foot.L', capsule([ax - 2.6, 1, toeZ - 1], [ax, 3.2, toeZ - 0.5], 0.55), strap, { mirror: true, thr: 0.3 });
  b.add('foot.L', capsule([ax + 2.6, 1, toeZ - 1], [ax, 3.2, toeZ - 0.5], 0.55), strap, { mirror: true, thr: 0.3 });
}

// ---------------------------------------------------------------------------------------------- garments

export interface ShihakushoOpts {
  black: string;
  collar: string;
  skin: string;
  obi: string;
  /** V depth: y of the collar crossing */
  crossY?: number;
  /** sleeve bag depth behind the forearm */
  bag?: number;
  hakamaHem?: number;
  /** hakama flare radius at the hem */
  hemR?: number;
  /** leave the torso bare (stripped) */
  noTop?: boolean;
}

/** Torso of the kosode, split into hips/spine/chest bands. */
export function kosodeTorso(b: ModelBuilder, L: Landmarks, o: ShihakushoOpts): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const t = 1.1; // cloth thickness
  const [sx, sy, sz] = s.shoulder;
  // rib cage: wider at the top, tapering toward the waist; flat-ish front
  const chest = box([0, s.chestY - 0.5, -0.3], [cx + t, 6, cz + t], { round: 3.4 });
  const waist = box([0, s.waistY, -0.2], [wx + t, 4.5, wz + t], { round: 3 });
  // trapezius slopes from the neck down to the shoulder tips
  const trapL = capsule([2.5, sy + 1.6, sz - 0.8], [sx - 1.5, sy - 0.2, sz], 2.9, 3);
  const trapR = capsule([-2.5, sy + 1.6, sz - 0.8], [-sx + 1.5, sy - 0.2, sz], 2.9, 3);
  // shoulder sockets: the parent owns the full joint ball
  const balls = [sphere([sx, sy - 0.5, sz], 3.3), sphere([-sx, sy - 0.5, sz], 3.3)];
  const torso = blend(3.2, chest, waist, trapL, trapR, ...balls);
  addBands(b, torso, o.black, [
    ['spine', 45, 56],
    ['chest', 54, 80],
  ]);
  // big folds only (4 per side reads as cloth; 20 would be noise): drape from the shoulders to the
  // obi and a horizontal pull under the chest
  for (const k of [-1, 1]) {
    b.paint('chest', capsule([k * 6.5, s.chestY + 3.5, cz + t + 0.4], [k * 3, s.chestY - 5.5, cz + t + 0.4], 0.75), o.black, { shade: 3 });
    b.paint('chest', capsule([k * (cx + t + 0.3), s.chestY + 2, -1], [k * (cx + t - 0.6), s.chestY - 5, 1.5], 0.7), o.black, { shade: 3 });
  }
  b.paint('spine', capsule([-6, s.waistY + 3.5, wz + t + 0.6], [-1.5, s.waistY - 1.5, wz + t + 0.6], 0.65), o.black, { shade: 3 });
  b.paint('spine', capsule([5.5, s.waistY + 3, wz + t + 0.6], [2, s.waistY - 1.2, wz + t + 0.6], 0.6), o.black, { shade: 3 });
  // back seam
  b.paint('chest', capsule([0, sy, -cz - t - 0.4], [0, s.chestY - 6, -cz - t - 0.4], 0.6), o.black, { shade: 3 });

  // ---- V neckline: skin triangle with the white juban collar along both edges (left over right)
  const cy = o.crossY ?? s.chestY - 1;
  const top = s.chinY - 2.5;
  const vtri = prism(
    [[-3.1, top + 0.5], [3.1, top + 0.5], [0, cy + 2]],
    [0, 0, 0], [1, 0, 0], [0, 1, 0], 20,
  );
  b.paint('chest', intersect(vtri, halfSpace([0, 0, 2.5], [0, 0, -1])), o.skin, { where: b.isMat(o.black) }); // front only
  // collar bands: left panel edge runs from the left neck side down to the right waist (the long
  // stroke of the "y"), the right panel's edge only down to the crossing.
  // collar points ride on the cloth surface (scan the torso SDF from the front)
  const zf = (x: number, y: number) => {
    for (let z = 14; z > -14; z -= 0.1) if (torso.d(x, y, z) <= 0) return z + 0.15;
    return 0;
  };
  const P = (x: number, y: number, dz = 0): V3 => [x, y, zf(x, y) + dz];
  const left: V3[] = [[2.6, top + 2.2, -3.5], [3.4, top + 1, 1.5], P(2.3, top - 3), P(0, cy), P(-3.2, cy - 5), P(-5.6, s.waistY - 2)];
  const right: V3[] = [[-2.6, top + 2.2, -3.5], [-3.4, top + 1, 1.5], P(-2.3, top - 3), P(-0.3, cy + 0.3)];
  b.add('chest', tube(right, right.map(() => 1.1)), o.collar, { thr: 0.15 });
  b.add('chest', tube(left.slice(0, 5), left.slice(0, 5).map(() => 1.15)), o.collar, { thr: 0.15 });
  b.add('spine', tube(left.slice(3), left.slice(3).map(() => 1.15)), o.collar, { thr: 0.15 });
  // back of the collar around the neck
  b.add('chest', capsule([-2.7, top + 2.2, -3.6], [2.7, top + 2.2, -3.6], 1.25), o.collar);
  // the black outer collar band riding just outside the white one (kosode lapel)
  const outerL: V3[] = left.map((p) => [p[0] + 1.5, p[1] - 0.5, p[2] - 0.2] as V3);
  const outerR: V3[] = right.map((p) => [p[0] - 1.5, p[1] - 0.5, p[2] - 0.2] as V3);
  b.add('chest', tube(outerL.slice(2, 5), outerL.slice(2, 5).map(() => 0.85)), o.black, { shade: 1 });
  b.add('chest', tube(outerR.slice(2, 4), outerR.slice(2, 4).map(() => 0.85)), o.black, { shade: 1 });
  return torso;
}

/** Wide kosode sleeves: upper-arm tube, forearm tube open at the wrist, and the hanging bag (spring bone). */
export function kosodeSleeves(b: ModelBuilder, L: Landmarks, o: ShihakushoOpts): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  // upper sleeve: narrow at the shoulder seam, widening down (cloth hangs from the shoulder)
  b.add('upperarm.L', cylinder([sx + 0.6, ey - 1.5, sz - 0.4], [sx + 0.2, sy + 0.5, sz - 0.2], 4.2, 3.3, 1.4), o.black, { mirror: true });
  b.add('upperarm.L', sphere([sx, sy - 0.5, sz], 2.9), o.black, { mirror: true }); // ball, 1 smaller than the socket
  // forearm sleeve: wide tube, open mouth at the wrist
  b.add('forearm.L', cylinder([sx + 0.8, wy + 0.2, sz - 0.6], [sx + 0.6, ey + 1.5, sz - 0.4], 4.6, 4.2, 1.2), o.black, { mirror: true });
  b.add('forearm.L', sphere([sx + 0.4, ey, sz - 0.3], 3.7), o.black, { mirror: true });
  // mouth: hollow so the opening reads (dark inside), wrist visible
  b.carve('forearm.L', cylinder([sx + 0.8, wy - 1, sz - 0.6], [sx + 0.8, wy + 3.2, sz - 0.6], 3.3, 3.3), { mirror: true });
  b.paint('forearm.L', cylinder([sx + 0.8, wy + 0.2, sz - 0.6], [sx + 0.8, wy + 1.4, sz - 0.6], 4.8), o.black, { shade: 1, mirror: true });
  // forearm (skin) inside the mouth so the hand connects
  b.add('forearm.L', capsule([sx, wy + 6, sz], [sx, wy - 0.5, sz], 1.9), o.skin, { mirror: true, only: 'empty' });
  // elbow fold (zigzag hint)
  b.paint('forearm.L', capsule([sx + 4.7, ey - 1, sz + 2], [sx + 4.9, ey - 4, sz - 2], 0.6), o.black, { shade: 3, mirror: true });
  // the bag: hangs behind the forearm sleeve, lower than the wrist, rounded bottom
  const bag = o.bag ?? 4.2;
  const bz = sz - 4.6 - bag / 2;
  b.add('sleeve.L', blend(1.5,
    box([sx + 0.7, (ey + wy) / 2 - 1.2, bz], [3.3, (ey - wy) / 2 + 0.6, bag / 2 + 0.8], { round: 1.4 }),
    ellipsoid([sx + 0.7, wy - 1.5, bz + 0.6], [3.2, 3.4, bag / 2 + 1.2])), o.black, { mirror: true });
  // fold lines on the bag (pipe folds hanging from the elbow)
  for (const dz of [-1.6, 1.4]) b.paint('sleeve.L', capsule([sx + 4.2, ey - 2, bz + dz], [sx + 4.1, wy - 2.5, bz + dz * 1.3], 0.55), o.black, { shade: 3, mirror: true });
}

/** White obi sash with a side knot. */
export function obi(b: ModelBuilder, L: Landmarks, o: ShihakushoOpts): void {
  const s = L.spec;
  const y = s.waistY - 2.5;
  const band = subtract(
    box([0, y, -0.2], [s.waist[0] + 2.4, 1.6, s.waist[1] + 2.4], { round: 2.4 }),
    box([0, y, -0.2], [s.waist[0] + 1, 4, s.waist[1] + 1], { round: 2 }),
  );
  b.add('hips', band, o.obi);
  // knot on the character's left hip with two short tails
  b.add('hips', ellipsoid([s.waist[0] + 2.4, y, 1.5], [1.5, 1.5, 1.8]), o.obi);
  b.add('hips', capsule([s.waist[0] + 2.6, y - 1, 2.2], [s.waist[0] + 3.2, y - 6, 3.2], 0.9, 0.7), o.obi, { thr: 0.2 });
  b.add('hips', capsule([s.waist[0] + 2.2, y - 1, 0.8], [s.waist[0] + 2.8, y - 5, 0.2], 0.9, 0.7), o.obi, { thr: 0.2 });
}

/** Hakama: waist panel on the hips, wide flared legs (upper on thighs, lower panels on spring bones). */
export function hakama(b: ModelBuilder, L: Landmarks, o: ShihakushoOpts): void {
  const s = L.spec;
  const hem = o.hakamaHem ?? 2.5;
  const R = o.hemR ?? 8.6;
  const top = s.waistY - 3.5;
  // waist: wide box around the pelvis, front panel rises a little higher than the back
  const waist = box([0, s.hipsY - 1, -0.4], [s.hips[0] + 2.2, top - s.hipsY + 1.5, s.hips[1] + 3], { round: 3 });
  b.add('hips', waist, o.black);
  b.add('hips', box([0, top + 0.5, 3.5], [s.waist[0] + 1, 1.2, 2.8], { round: 1 }), o.black);
  const [hx, hy] = s.hip;
  const kneeY = L.knee[1];
  // hakama legs are deep as well as wide: elliptical sections (depth ×1.25)
  const deep = (a: Sdf, cxz: V3) => scale(a, [1, 1, 1.25], cxz);
  // upper leg (thigh): flaring tube
  b.add('thigh.L', deep(cylinder([hx + 0.3, kneeY + 2, -0.4], [hx, hy + 2, -0.4], R - 1.2, s.hips[0] - 1.8, 1.5), [hx, 0, -0.4]), o.black, { mirror: true });
  b.add('thigh.L', sphere([hx, hy, 0], 5.2), o.black, { mirror: true });
  // lower panel: from above the knee to the hem, flat bottom, hollow inside
  const lowTop = kneeY + 5.5;
  const panel = subtract(
    deep(cylinder([hx + 0.6, hem, -0.5], [hx + 0.4, lowTop, -0.5], R, R - 1.3, 1.2), [hx, 0, -0.5]),
    deep(cylinder([hx + 0.6, hem - 1, -0.5], [hx + 0.4, hem + 7, -0.5], R - 2.2, R - 2.6), [hx, 0, -0.5]),
  );
  b.add('hakama.L', panel, o.black, { mirror: true });
  // pleats: 1-voxel grooves converging upward (5 front, 2 back per side looks right at this size)
  for (const a of [-50, -20, 10, 40, 140, 200]) {
    const r = (a * Math.PI) / 180;
    const p0: V3 = [hx + 0.6 + Math.sin(r) * R, hem + 1, -0.5 + Math.cos(r) * R * 1.25];
    const p1: V3 = [hx + 0.4 + Math.sin(r) * (R - 1.3), lowTop - 1, -0.5 + Math.cos(r) * (R - 1.3) * 1.25];
    b.paint('hakama.L', capsule(p0, p1, 0.75), o.black, { shade: 3, mirror: true });
    b.paint('thigh.L', capsule([hx + Math.sin(r) * (R - 1.4), kneeY + 2, -0.4 + Math.cos(r) * (R - 1.4) * 1.25], [hx + Math.sin(r) * (s.hips[0] - 2), hy + 2, -0.4 + Math.cos(r) * (s.hips[0] - 2) * 1.25], 0.7), o.black, { shade: 3, mirror: true });
  }
  // inner hem shade
  b.paint('hakama.L', deep(cylinder([hx + 0.6, hem - 1, -0.5], [hx + 0.6, hem + 1.2, -0.5], R + 1), [hx, 0, -0.5]), o.black, { shade: 1, mirror: true, where: b.isMat(o.black) });
  // shins inside (black leggings), visible only through the hem
  b.add('shin.L', capsule([hx, kneeY + 1, 0], [hx, L.ankle[1] + 2, 0], 3, 2.5), o.black, { mirror: true });
}

/** Spring setup for a Shinigami outfit. */
export function shihakushoSprings(): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const springs: SpringDef[] = [];
  for (const side of ['L', 'R']) {
    springs.push({ bone: `sleeve.${side}`, tail: [0, -0.22, -0.06], stiffness: 38, damping: 5, gravity: 10, limit: 95, radius: 0.05 });
    springs.push({ bone: `hakama.${side}`, tail: [0, -0.48, 0], stiffness: 70, damping: 6, gravity: 8, limit: 55, radius: 0.12 });
  }
  const colliders: ColliderDef[] = [
    { bone: 'shin.L', offset: [0, -0.15, 0], radius: 0.07 },
    { bone: 'shin.R', offset: [0, -0.15, 0], radius: 0.07 },
  ];
  return { springs, colliders };
}

export interface CoatSkirtOpts {
  mat: string;
  lining: string;
  /** top / hem heights (voxels) */
  yTop?: number;
  yHem?: number;
  /** radius at the top and at the hem */
  r0?: number;
  r1?: number;
  /** flame-like tattered hem (Tensa Zangetsu) or a straight hem (haori) */
  tatter?: boolean;
  /** tatter notch depth (voxels, plus up to 4 at random) and extra points per panel */
  tatterDepth?: number;
  tatterTeeth?: number;
  /** leave the front open between these angles (degrees from the front, per side) */
  openFront?: number;
  res?: number;
}

/**
 * A coat below the waist: six flared panels on two-bone spring chains (coat.F/S/B.L/R and .2), the
 * lining on the inside. Ichigo's Bankai coat (tattered) and captains' haori (straight hem) use it.
 */
export function coatSkirt(b: ModelBuilder, L: Landmarks, o: CoatSkirtOpts): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const res = o.res ?? 48;
  const yTop = o.yTop ?? s.waistY - 2, ySplit = L.knee[1] + 4, yHem = o.yHem ?? 4;
  const r0 = o.r0 ?? 9.2, r1 = o.r1 ?? 15.5;
  const cz = -0.6;
  const R = (y: number) => r0 + (r1 - r0) * Math.max(0, Math.min(1, (yTop - y) / (yTop - yHem)));
  const open = o.openFront ?? 6;
  const panels: [string, number, number][] = [
    ['F.L', open, 58], ['S.L', 62, 118], ['B.L', 122, 176], ['B.R', -176, -122], ['S.R', -118, -62], ['F.R', -58, -open],
  ];
  const springs: SpringDef[] = [];
  const rng = (k: number) => Math.abs(Math.sin(k * 91.7 + 3.1) * 4375.85) % 1;
  panels.forEach(([name, a0d, a1d], pi) => {
    const a0 = (a0d * Math.PI) / 180, a1 = (a1d * Math.PI) / 180;
    const am = (a0 + a1) / 2;
    const top = `coat.${name}`, low = `coat.${name}.2`;
    const pTop: V3 = [Math.sin(am) * (r0 - 1), yTop, cz + Math.cos(am) * (r0 - 1)];
    const pLow: V3 = [Math.sin(am) * R(ySplit), ySplit, cz + Math.cos(am) * R(ySplit)];
    b.bone(top, 'hips', pTop);
    b.bone(low, top, pLow);
    // flame tatters: 2-3 points per panel, or a straight hem
    const nPts = 2 + (pi % 2) + (o.tatterTeeth ?? 0);
    const depth = o.tatterDepth ?? 6;
    const hem = (th: number) => {
      if (!o.tatter) return yHem + 1;
      const u = (th - a0) / (a1 - a0);
      const saw = Math.abs(((u * nPts) % 1) - 0.5) * 2; // 1 at the notches, 0 at the points
      return yHem + 1 + saw * (depth + rng(pi * 7 + Math.floor(u * nPts)) * 4);
    };
    const shellSdf = (y0: number, y1: number) =>
      fn(
        (x, y, z) => {
          const dz = z - cz;
          const rho = Math.hypot(x, dz);
          const th = Math.atan2(x, dz);
          const dr = Math.abs(rho - R(y)) - 0.85;
          // angular extent (handle the ±180° wrap for the back panels)
          let da = 0;
          const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
          if (th < lo) da = (lo - th) * rho;
          else if (th > hi) da = (th - hi) * rho;
          const dyTop = y - y1, dyBot = Math.max(y0, hem(th)) - y;
          return Math.max(dr, da, dyTop, dyBot);
        },
        [-r1 - 2, y0 - 1, cz - r1 - 2],
        [r1 + 2, y1 + 1, cz + r1 + 2],
      );
    b.add(top, shellSdf(ySplit - 1, yTop), o.mat);
    b.add(low, shellSdf(yHem - 2, ySplit + 1), o.mat);
    // lining: inner half of the shell
    const lining = fn((x, y, z) => Math.hypot(x, z - cz) - (R(y) - 0.15), [-r1 - 2, yHem - 3, cz - r1 - 2], [r1 + 2, yTop + 1, cz + r1 + 2]);
    b.paint([top, low], lining, o.lining, { where: b.isMat(o.mat) });
    // a fold down the middle of each panel
    const fx = Math.sin(am), fz = Math.cos(am);
    b.paint([top, low], capsule([fx * (R(yTop) + 0.6), yTop - 2, cz + fz * (R(yTop) + 0.6)], [fx * (R(yHem + 8) + 0.6), yHem + 8, cz + fz * (R(yHem + 8) + 0.6)], 0.7), o.mat, { shade: 3 });
    const tailTop = [(pLow[0] - pTop[0]) / res, (pLow[1] - pTop[1]) / res, (pLow[2] - pTop[2]) / res] as [number, number, number];
    const hemP: V3 = [Math.sin(am) * R(yHem + 4), yHem + 4, cz + Math.cos(am) * R(yHem + 4)];
    const tailLow = [(hemP[0] - pLow[0]) / res, (hemP[1] - pLow[1]) / res, (hemP[2] - pLow[2]) / res] as [number, number, number];
    springs.push({ bone: top, tail: tailTop, stiffness: 95, damping: 6, gravity: 9, limit: 45, radius: 0.1 });
    springs.push({ bone: low, tail: tailLow, stiffness: 50, damping: 4.5, gravity: 13, limit: 65, radius: 0.08 });
  });
  const colliders: ColliderDef[] = [
    { bone: 'thigh.L', offset: [0, -0.18, 0.02], radius: 0.16 },
    { bone: 'thigh.R', offset: [0, -0.18, 0.02], radius: 0.16 },
    { bone: 'shin.L', offset: [0, -0.12, 0], radius: 0.12 },
    { bone: 'shin.R', offset: [0, -0.12, 0], radius: 0.12 },
  ];
  return { springs, colliders };
}

// ---------------------------------------------------------------------------------------------- hair

export interface Clump {
  /** root direction from the head centre: azimuth (0 = front, +90 = character's left), elevation (deg) */
  az: number;
  el: number;
  /** growth direction (unit-ish vector in model space) */
  dir: V3;
  len: number;
  r: number;
  /** tip radius */
  tip?: number;
  /** bend: added to the direction progressively (curl) */
  bend?: V3;
}

/** Spiky hair: cap shell over the skull + tapered clumps rooted inside the cap. */
export function spikyHair(b: ModelBuilder, L: Landmarks, mat: string, clumps: Clump[], o: { capThick?: number; hairline?: number; nape?: number; capR?: V3 } = {}): void {
  const s = L.spec;
  const [cx, cy, cz] = L.headC;
  const capR: V3 = o.capR ?? [s.head.w / 2 + 2.2, s.head.h / 2 + 2.2, s.head.d / 2 + 2];
  const hairline = o.hairline ?? s.chinY + s.head.h - 3.5;
  const nape = o.nape ?? s.chinY + 2;
  const front = cz + s.head.d / 2;
  // cap: ellipsoid shell above a sloped hairline (low at the back, high at the forehead)
  const cap = intersect(
    ellipsoid([cx, cy + 1.2, cz - 0.4], capR),
    halfSpace([0, hairline, front], [0, -1, 0.62]), // hairline lower toward the back
    halfSpace([0, nape, 0], [0, -1, 0]),
  );
  b.add('head', cap, mat); // covers the scalp
  for (const c of clumps) {
    const az = (c.az * Math.PI) / 180, el = (c.el * Math.PI) / 180;
    const nx = Math.sin(az) * Math.cos(el), ny = Math.sin(el), nz = Math.cos(az) * Math.cos(el);
    const root: V3 = [cx + nx * (capR[0] - 2.2), cy + 1.2 + ny * (capR[1] - 2.2), cz - 0.4 + nz * (capR[2] - 2.2)];
    const dl = Math.hypot(...c.dir) || 1;
    let d: V3 = [c.dir[0] / dl, c.dir[1] / dl, c.dir[2] / dl];
    const pts: V3[] = [root];
    const radii: number[] = [c.r];
    const segs = 4;
    let p = root;
    for (let k = 1; k <= segs; k++) {
      if (c.bend) {
        d = [d[0] + c.bend[0] / segs, d[1] + c.bend[1] / segs, d[2] + c.bend[2] / segs];
        const l = Math.hypot(...d);
        d = [d[0] / l, d[1] / l, d[2] / l];
      }
      p = [p[0] + (d[0] * c.len) / segs, p[1] + (d[1] * c.len) / segs, p[2] + (d[2] * c.len) / segs];
      pts.push(p);
      const t = k / segs;
      radii.push(c.r + ((c.tip ?? 0.55) - c.r) * Math.pow(t, 0.8));
    }
    b.add('head', tube(pts, radii), mat, { thr: 0.35 });
  }
}

export interface Spike {
  /** root direction from the cap centre: azimuth (0 = front, +90 = character's left), elevation (deg) */
  az: number;
  el: number;
  /** protrusion beyond the cap surface (voxels) */
  len: number;
  /** base radius (wide axis) */
  r: number;
  /** narrow/wide cross-section ratio (flat blade-like clumps) */
  flat?: number;
  /** added to the radial direction (flow field) */
  flow?: V3;
  bend?: V3;
  taper?: number;
  /** put this spike on another bone (e.g. forehead locks that hide under a mask) */
  bone?: string;
}

export interface Bang {
  /** x of the lock on the forehead, tip height (voxels), sideways lean */
  x: number;
  tipY: number;
  lean?: number;
  r?: number;
}

/** Distance along unit ray (p, d) to the ellipsoid surface (c, R) from inside. */
function rayEllipsoid(p: V3, d: V3, c: V3, R: V3): number {
  const ox = (p[0] - c[0]) / R[0], oy = (p[1] - c[1]) / R[1], oz = (p[2] - c[2]) / R[2];
  const dx = d[0] / R[0], dy = d[1] / R[1], dz = d[2] / R[2];
  const a = dx * dx + dy * dy + dz * dz, bb = 2 * (ox * dx + oy * dy + oz * dz), cc = ox * ox + oy * oy + oz * oz - 1;
  const disc = bb * bb - 4 * a * cc;
  return disc < 0 ? 0 : (-bb + Math.sqrt(disc)) / (2 * a);
}

/**
 * Tip of a spike exactly as spikeHair builds it (same cap defaults), and the growth direction there —
 * for ornaments hung on the tips (Kenpachi's bells).
 */
export function spikeTip(L: Landmarks, sp: Spike, capR?: V3): { tip: V3; dir: V3 } {
  const s = L.spec;
  const c: V3 = [L.headC[0], L.headC[1] + 1.4, L.headC[2] - 0.5];
  const R: V3 = capR ?? [s.head.w / 2 + 1.0, s.head.h / 2 + 0.9, s.head.d / 2 + 1.0];
  const az = (sp.az * Math.PI) / 180, el = (sp.el * Math.PI) / 180;
  const n: V3 = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
  const root: V3 = [c[0] + n[0] * R[0] * 0.5, c[1] + n[1] * R[1] * 0.5, c[2] + n[2] * R[2] * 0.5];
  const f = sp.flow ?? [0, 0, 0];
  let dir: V3 = [n[0] + f[0], n[1] + f[1], n[2] + f[2]];
  const dl = Math.hypot(...dir);
  dir = [dir[0] / dl, dir[1] / dl, dir[2] / dl];
  const len = rayEllipsoid(root, dir, c, R) + sp.len;
  const B = sp.bend ?? [0, 0, 0];
  const tip: V3 = [root[0] + (dir[0] + B[0]) * len, root[1] + (dir[1] + B[1]) * len, root[2] + (dir[2] + B[2]) * len];
  // the centreline is root + (D·t + B·t²)·len: its tangent at t = 1 is D + 2B
  const td: V3 = [dir[0] + 2 * B[0], dir[1] + 2 * B[1], dir[2] + 2 * B[2]];
  const tl = Math.hypot(...td) || 1;
  return { tip, dir: [td[0] / tl, td[1] / tl, td[2] / tl] };
}

/**
 * Manga spiky hair: a cap over the skull, chunky flat spikes rooted deep inside the cap (pointing
 * along radial + flow, protruding `len` beyond it), and forehead bangs lying on the face plate.
 */
export function spikeHair(b: ModelBuilder, L: Landmarks, mat: string, spikes: Spike[], bangs: Bang[], o: { capR?: V3; hairline?: number; nape?: number; slope?: number; tufts?: number; tuftFlow?: V3 } = {}): void {
  const s = L.spec;
  const c: V3 = [L.headC[0], L.headC[1] + 1.4, L.headC[2] - 0.5];
  const capR: V3 = o.capR ?? [s.head.w / 2 + 1.0, s.head.h / 2 + 0.9, s.head.d / 2 + 1.0];
  const hairline = o.hairline ?? s.chinY + s.head.h - 1.5;
  const nape = o.nape ?? s.chinY + 2;
  const front = L.headC[2] + s.head.d / 2;
  const cap = intersect(
    ellipsoid(c, capR),
    halfSpace([0, hairline, front], [0, -1, o.slope ?? 0.85]), // hairline lower toward the back
    halfSpace([0, nape, 0], [0, -1, 0]),
  );
  b.add('head', cap, mat);
  // the scalp under the hair is hair-coloured (gaps between spikes must not show skin)
  b.paint('head', intersect(ellipsoid(c, [capR[0] + 1, capR[1] + 1, capR[2] + 1]), halfSpace([0, hairline + 0.5, front], [0, -1, o.slope ?? 0.85]), halfSpace([0, nape, 0], [0, -1, 0])), mat, { where: (v) => b.matOf(v).mat?.name !== mat });
  // tufts: short clumps over the whole cap so its surface reads as hair, not a helmet
  const tufts: Spike[] = [];
  const nT = o.tufts ?? 0;
  for (let i = 0; i < nT; i++) {
    const yv = 1 - (i + 0.5) / nT; // fibonacci sphere, upper part
    const el = Math.asin(Math.max(-0.35, yv)) * (180 / Math.PI);
    const az = ((i * 137.508) % 360) - 180;
    if (Math.abs(az) < 55 && el < 32) continue; // keep the face clear
    if (el < -12) continue;
    const h = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    tufts.push({ az, el, len: 1.3 + h * 1.6, r: 2.3 + h * 0.6, flow: o.tuftFlow ?? [0, 0.15, -0.35] });
  }
  for (const sp of [...tufts, ...spikes]) {
    const az = (sp.az * Math.PI) / 180, el = (sp.el * Math.PI) / 180;
    const n: V3 = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
    const root: V3 = [c[0] + n[0] * capR[0] * 0.5, c[1] + n[1] * capR[1] * 0.5, c[2] + n[2] * capR[2] * 0.5];
    const f = sp.flow ?? [0, 0, 0];
    let dir: V3 = [n[0] + f[0], n[1] + f[1], n[2] + f[2]];
    const dl = Math.hypot(...dir);
    dir = [dir[0] / dl, dir[1] / dl, dir[2] / dl];
    const inside = rayEllipsoid(root, dir, c, capR);
    const side: V3 = [Math.cos(az), 0, -Math.sin(az)];
    b.add(sp.bone ?? 'head', spike(root, dir, inside + sp.len, sp.r, sp.r * (sp.flat ?? 0.6), { side, bend: sp.bend, taper: sp.taper ?? 1, tip: 0.3 }), mat, { thr: 0.3 });
  }
  // bangs: flat locks hanging from under the cap edge, lying 1-2 voxels in front of the forehead
  const top = hairline + 2;
  for (const bg of bangs) {
    const lean = bg.lean ?? 0;
    const root: V3 = [bg.x - lean * 0.5, top, front];
    const tip: V3 = [bg.x + lean, bg.tipY, front + 0.9];
    const d: V3 = [tip[0] - root[0], tip[1] - root[1], tip[2] - root[2]];
    const len = Math.hypot(...d);
    b.add('head', spike(root, d, len, bg.r ?? 2.3, 1.2, { side: [1, 0, 0], taper: 0.9, tip: 0.3 }), mat, { thr: 0.3 });
  }
}
