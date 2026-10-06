// Shared humanoid construction at 48 vox/m: skeleton, head & face plate, hands (palm + fist variants),
// feet, and Shinigami garments (kosode, juban collar, sleeves with hanging bags, obi, hakama, tabi,
// waraji). Character files supply a spec + palette and add their signature pieces (hair, weapons,
// straps, masks). All coordinates are voxels; the model faces +Z and +X is the character's left.
import { ModelBuilder } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, halfSpace, intersect, prism, sphere, subtract, tube, type Sdf, type V3 } from '../models/sdf';
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
  const cran = box([0, chin + 3 + (s.head.h - 3) / 2, (front + back) / 2], [hw, (s.head.h - 3) / 2, s.head.d / 2], { round: 2.2 });
  // back of the skull fuller, rounder
  const occiput = ellipsoid([0, chin + s.head.h * 0.62, back + 4], [hw + 0.3, s.head.h * 0.42, 4.5]);
  // jaw: narrower box tapering to the chin, flat front
  const jaw = intersect(
    box([0, chin + 2.5, (front + back) / 2 + 1.5], [hw - 1, 2.5, s.head.d / 2 - 1.5], { round: 1 }),
    // taper planes (chin rows 4, 6, 8 wide)
    halfSpace([hw - 1, chin + 3, 0], [1, -0.85, 0]),
    halfSpace([-hw + 1, chin + 3, 0], [-1, -0.85, 0]),
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
  const t = 1.2; // cloth thickness
  const chest = box([0, s.chestY, -0.3], [cx + t, 6.2, cz + t], { round: 3.2 });
  const waist = box([0, s.waistY, -0.2], [wx + t, 4.5, wz + t], { round: 3 });
  const shoulders = capsule([-s.shoulder[0] + 1.5, s.shoulder[1] - 1, -0.5], [s.shoulder[0] - 1.5, s.shoulder[1] - 1, -0.5], 3.8);
  // shoulder balls (joint sockets the upper arm rotates in)
  const balls = [sphere([s.shoulder[0], s.shoulder[1] - 0.5, s.shoulder[2]], 3.9), sphere([-s.shoulder[0], s.shoulder[1] - 0.5, s.shoulder[2]], 3.9)];
  const torso = blend(3.5, chest, waist, shoulders, ...balls);
  addBands(b, torso, o.black, [
    ['spine', 45, 56],
    ['chest', 54, 80],
  ]);
  // folds: diagonal drape lines across the chest (1-voxel ridges in shade)
  for (const k of [-1, 1]) {
    b.paint('chest', capsule([k * 7, s.chestY + 4, 6.5], [k * 2, s.chestY - 5, 6.5], 0.7), o.black, { shade: 2 });
  }
  b.paint('spine', capsule([-6, s.waistY + 4, 5.8], [-1, s.waistY - 1, 5.8], 0.6), o.black, { shade: 2 });

  // ---- V neckline: skin triangle with the white juban collar along both edges (left over right)
  const cy = o.crossY ?? s.chestY - 1;
  const top = s.chinY - 2.5;
  const vtri = prism(
    [[-3.3, top + 0.5], [3.3, top + 0.5], [0, cy + 2]],
    [0, 0, 0], [1, 0, 0], [0, 1, 0], 20,
  );
  b.paint('chest', intersect(vtri, halfSpace([0, 0, 3], [0, 0, -1])), o.skin, { where: b.isMat(o.black) }); // front only
  b.carve('chest', intersect(vtri, halfSpace([0, 0, 4.6], [0, 0, -1]))); // the opening sits 1 voxel deeper
  // collar bands: left panel edge runs from the left neck side down to the right waist (the long
  // stroke of the "y"), the right panel's edge only down to the crossing.
  const zf = (y: number) => 5.6 + Math.max(0, (top - y) * 0.06);
  const left: V3[] = [[2.6, top + 2.2, -3.5], [3.4, top + 1, 1.5], [2.2, top - 3, zf(top - 3)], [0, cy, zf(cy)], [-3.2, cy - 5, zf(cy - 5) + 0.3], [-5.6, s.waistY - 2, 6.1]];
  const right: V3[] = [[-2.6, top + 2.2, -3.5], [-3.4, top + 1, 1.5], [-2.2, top - 3, zf(top - 3)], [-0.3, cy + 0.3, zf(cy)]];
  b.add('chest', tube(right, right.map(() => 1.15)), o.collar, { thr: 0.15 });
  b.add('chest', tube(left.slice(0, 5), left.slice(0, 5).map(() => 1.2)), o.collar, { thr: 0.15 });
  b.add('spine', tube(left.slice(3), left.slice(3).map(() => 1.2)), o.collar, { thr: 0.15 });
  // back of the collar around the neck
  b.add('chest', capsule([-2.7, top + 2.2, -3.6], [2.7, top + 2.2, -3.6], 1.3), o.collar);
  // the black outer collar band riding just outside the white one
  const outerL: V3[] = left.map((p) => [p[0] + 1.4, p[1] - 0.6, p[2] - 0.3] as V3);
  b.add('chest', tube(outerL.slice(1, 5), outerL.slice(1, 5).map(() => 0.9)), o.black, { only: 'empty', shade: 1 });
  return torso;
}

/** Wide kosode sleeves: upper-arm tube, forearm tube open at the wrist, and the hanging bag (spring bone). */
export function kosodeSleeves(b: ModelBuilder, L: Landmarks, o: ShihakushoOpts): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const upper = box([sx + 0.4, (sy + ey) / 2 - 0.5, sz - 0.6], [4.1, (sy - ey) / 2 + 1.5, 4.6], { round: 2.2 });
  b.add('upperarm.L', upper, o.black, { mirror: true });
  b.add('upperarm.L', sphere([sx, sy - 0.5, sz], 3.4), o.black, { mirror: true }); // joint ball (1 smaller than the socket)
  // forearm sleeve tube: flares toward the wrist, open mouth
  const fore = box([sx + 0.4, (ey + wy) / 2 + 0.3, sz - 0.4], [4.3, (ey - wy) / 2 + 0.8, 4.9], { round: 1.6 });
  b.add('forearm.L', fore, o.black, { mirror: true });
  b.add('forearm.L', sphere([sx, ey, sz], 3.6), o.black, { mirror: true });
  // sleeve mouth: hollow so the opening reads (inside shade), arm/wrist visible inside
  b.carve('forearm.L', box([sx + 0.4, wy + 1, sz - 0.4], [3.1, 2.2, 3.7], { round: 1 }), { mirror: true });
  b.paint('forearm.L', box([sx + 0.4, wy + 3.2, sz - 0.4], [4.4, 0.6, 5]), o.black, { shade: 2, mirror: true });
  // forearm (skin) inside the mouth so the hand connects
  b.add('forearm.L', capsule([sx, wy + 6, sz], [sx, wy - 0.5, sz], 1.9), o.skin, { mirror: true, only: 'empty' });
  // the bag: hangs behind the forearm, lower than the wrist
  const bag = o.bag ?? 4.5;
  b.add('sleeve.L', box([sx + 0.6, (ey + wy) / 2 - 2.5, sz - 4.6 - bag / 2], [3.6, (ey - wy) / 2 + 1.5, bag / 2 + 1], { round: 1.8 }), o.black, { mirror: true });
  // fold lines on the bag
  for (const dy of [-3, 3]) b.paint('sleeve.L', box([sx + 4, (ey + wy) / 2 + dy, sz - 5], [0.6, 0.6, 3.5], { rot: [25, 0, 0] }), o.black, { shade: 2, mirror: true });
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
  const R = o.hemR ?? 7.6;
  const top = s.waistY - 3.5;
  // waist: wide box around the pelvis, front panel rises a little higher than the back
  const waist = box([0, s.hipsY - 1, -0.4], [s.hips[0] + 2.2, top - s.hipsY + 1.5, s.hips[1] + 2.3], { round: 3 });
  b.add('hips', waist, o.black);
  b.add('hips', box([0, top + 0.5, 3.5], [s.waist[0] + 1, 1.2, 2.8], { round: 1 }), o.black);
  const [hx, hy] = s.hip;
  const kneeY = L.knee[1];
  // upper leg (thigh): flaring tube
  b.add('thigh.L', cylinder([hx + 0.3, kneeY + 2, -0.4], [hx, hy + 2, -0.4], R - 1.2, s.hips[0] - 1.8, 1.5), o.black, { mirror: true });
  b.add('thigh.L', sphere([hx, hy, 0], 5.2), o.black, { mirror: true });
  // lower panel: from above the knee to the hem, flat bottom, hollow inside
  const lowTop = kneeY + 5.5;
  const panel = subtract(
    cylinder([hx + 0.6, hem, -0.5], [hx + 0.4, lowTop, -0.5], R, R - 1.3, 1.2),
    cylinder([hx + 0.6, hem - 1, -0.5], [hx + 0.4, hem + 7, -0.5], R - 2.2, R - 2.6),
  );
  b.add('hakama.L', panel, o.black, { mirror: true });
  // pleats: 1-voxel grooves converging upward (5 front, 2 back per side looks right at this size)
  for (const a of [-50, -20, 10, 40, 140, 200]) {
    const r = (a * Math.PI) / 180;
    const p0: V3 = [hx + 0.6 + Math.sin(r) * R, hem + 1, -0.5 + Math.cos(r) * R];
    const p1: V3 = [hx + 0.4 + Math.sin(r) * (R - 1.3), lowTop - 1, -0.5 + Math.cos(r) * (R - 1.3)];
    b.paint('hakama.L', capsule(p0, p1, 0.75), o.black, { shade: 2, mirror: true });
    b.paint('thigh.L', capsule([hx + Math.sin(r) * (R - 1.4), kneeY + 2, -0.4 + Math.cos(r) * (R - 1.4)], [hx + Math.sin(r) * (s.hips[0] - 2), hy + 2, -0.4 + Math.cos(r) * (s.hips[0] - 2)], 0.7), o.black, { shade: 2, mirror: true });
  }
  // inner hem shade
  b.paint('hakama.L', cylinder([hx + 0.6, hem - 1, -0.5], [hx + 0.6, hem + 1.2, -0.5], R + 1), o.black, { shade: 1, mirror: true, where: b.isMat(o.black) });
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
