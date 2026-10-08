// Human Ichigo (docs/kits/ichigo.md: the Agent era's first rung, the Fake Karakura "spent" form; dossier A1 §1 look #1).
// Brief: 174 cm on the standard skeleton; the spiky orange hair and the scowl; the Karakura High uniform — the grey
// blazer worn open over a white shirt (no tie, collar open), grey trousers, dark loafers. Lost Agent casual (FB1's
// body): 181 cm, a black long-sleeved top and light grey trousers, longer hair with sideburns, the Substitute badge on
// its cord. The blazer's hem flaps on spring bones. (verify) the shoes.
import { ModelBuilder } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, fn, halfSpace, intersect, sphere, subtract, tube, type V3 } from '../models/sdf';
import { SPEC_ADULT_MALE, addBands, coatSkirt, faceLegend, hands, head, humanoidSkeleton, spikeHair, type Landmarks, type Spike } from './humanoid';
import { ICHIGO_FACE, ICHIGO_HAIR, ichigoPalette, type CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export type HumanLook = 'school' | 'casual';
/** 174 cm (school) or 181 cm (Lost Agent) on the 84-vox skeleton */
export const HUMAN_RES: Record<HumanLook, number> = { school: 84 / 1.74, casual: 84 / 1.81 };

export function humanPalette(b: ModelBuilder, look: HumanLook): void {
  ichigoPalette(b);
  b.mat('shirt', ['#F3F3F0', '#E7E7E4', '#CFCFCC', '#AEAEAD'], { base: 1, rough: 0.85, dither: 0.03 });
  if (look === 'school') {
    b.mat('blazer', ['#8E8C98', '#7A7884', '#666470', '#54525E', '#44424E'], { base: 1, rough: 0.85, shadeK: 0.9, dither: 0.03 });
    b.mat('trouser', ['#7E7C88', '#6A6874', '#57555F', '#46444E'], { base: 1, rough: 0.85, shadeK: 0.9 });
  } else {
    b.mat('blazer', ['#3E3F48', '#2E2F38', '#24252D', '#1A1B21', '#141418'], { base: 2, rough: 0.85, shadeK: 1, dither: 0.03 });
    b.mat('trouser', ['#DCE1E8', '#CBD2DB', '#ADB5C0', '#8E97A3'], { base: 1, rough: 0.85, shadeK: 0.9 });
  }
  b.mat('shoe', ['#4A3A30', '#3A2A22', '#261B16'], { base: 1, rough: 0.5 });
  b.mat('sole', ['#2A2626', '#1C1A1A'], { base: 0, rough: 0.7 });
  b.mat('badge', ['#CDB98A', '#B9A16E', '#8A7448'], { base: 1, rough: 0.5, metal: 0.4 });
  b.mat('skull', ['#3A2E22']);
  b.mat('cord2', ['#C9A77A', '#8F7350'], { base: 0, rough: 0.8 });
}

export const SIDEBURNS: Spike[] = [
  { az: -86, el: -14, len: 2.2, r: 2.4, flat: 0.55, flow: [0.05, -1.1, 0.25] },
  { az: 86, el: -14, len: 2.2, r: 2.4, flat: 0.55, flow: [-0.05, -1.1, 0.25] },
];

/** The shirt (white, collar open) and over it the blazer's body, open down the front (or the casual black top). */
export function upperBody(b: ModelBuilder, L: Landmarks, look: HumanLook): void {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = (t: number) => blend(3.2,
    box([0, s.chestY - 0.5, -0.3], [cx + t, 6, cz + t], { round: 3.4 }),
    box([0, s.waistY, -0.2], [wx + t, 4.5, wz + t], { round: 3 }),
    box([0, s.hipsY + 1, -0.3], [s.hips[0] + t * 0.8, 3.5, s.hips[1] + t * 0.8], { round: 2.6 }),
    capsule([2.5, sy + 1.6, sz - 0.8], [sx - 1.5, sy - 0.2, sz], 2.9 + t * 0.5, 3 + t * 0.5),
    capsule([-2.5, sy + 1.6, sz - 0.8], [-sx + 1.5, sy - 0.2, sz], 2.9 + t * 0.5, 3 + t * 0.5),
    sphere([sx, sy - 0.5, sz], 3.3 + t * 0.4), sphere([-sx, sy - 0.5, sz], 3.3 + t * 0.4));
  const bands: [string, number, number][] = [['hips', 38, s.hipsY + 1], ['spine', s.hipsY + 1, s.waistY + 5], ['chest', s.chestY - 7, s.chinY + 8]];
  if (look === 'casual') {
    // the black long-sleeved top: close-fitting, a round neck
    addBands(b, torso(0.9), 'blazer', bands);
    b.paint('chest', capsule([-2.8, s.chinY - 2.2, 1.2], [2.8, s.chinY - 2.2, 1.2], 1.6), 'skin', { where: b.isMat('blazer') });
    for (const k of [-1, 1]) b.paint('chest', capsule([k * 6.5, s.chestY + 3.5, cz + 1.4], [k * 3, s.chestY - 5.5, cz + 1.4], 0.7), 'blazer', { shade: 3 });
    return;
  }
  // the shirt: white, the collar open (a small V of skin), a placket down the front
  addBands(b, torso(0.8), 'shirt', bands);
  b.paint('chest', fn((x, y, z) => Math.max(Math.abs(x) - (s.chinY - 1 - y) * 0.35, s.chestY + 2.5 - y, 1 - z), [-6, s.chestY, 0], [6, s.chinY, 12]), 'skin', { where: b.isMat('shirt') });
  b.add('chest', tube([[-2.6, s.chinY - 1.2, -2.8], [-3.2, s.chinY - 1.6, 1.8], [-1.3, s.chestY + 2.2, 4.4]], [0.9, 0.9, 0.8]), 'shirt', { thr: 0.15 });
  b.add('chest', tube([[2.6, s.chinY - 1.2, -2.8], [3.2, s.chinY - 1.6, 1.8], [1.3, s.chestY + 2.2, 4.4]], [0.9, 0.9, 0.8]), 'shirt', { thr: 0.15 });
  b.paint(['chest', 'spine'], capsule([0.6, s.chestY + 2, cz + 1.6], [0.6, s.hipsY + 2, wz + 1.6], 0.45), 'shirt', { shade: 2 });
  // the blazer: a shell over the shirt, open in front (wider below the lapels' crossing), with lapels
  const open = (y: number) => (y > s.chestY - 1 ? 3.2 + (y - (s.chestY - 1)) * 0.55 : 3.2 + (s.chestY - 1 - y) * 0.05);
  const shell = subtract(torso(1.9), torso(1.0), fn((x, y, z) => Math.max(Math.abs(x) - open(y), -z), [-14, 30, 0], [14, 80, 14]));
  addBands(b, intersect(shell, halfSpace([0, s.chinY - 1.5, 0], [0, 1, 0])), 'blazer', bands);
  // the lapels: a raised notch collar along the opening
  for (const k of [-1, 1]) {
    const lap: V3[] = [[k * 2.8, s.chinY - 1, -2.6], [k * 4.6, s.chinY - 2.6, 2.4], [k * 5.6, s.chestY + 2.5, cz + 2.2], [k * 3.6, s.chestY - 2, cz + 2.4]];
    b.add('chest', tube(lap, [1.1, 1.2, 1.25, 0.9]), 'blazer', { thr: 0.15 });
  }
  // folds and the pocket line
  for (const k of [-1, 1]) {
    b.paint(['chest', 'spine'], capsule([k * 7.2, s.chestY + 2, cz + 2], [k * 6.5, s.waistY - 2, wz + 2.2], 0.6), 'blazer', { shade: 3, where: b.isMat('blazer') });
    b.paint('hips', capsule([k * 5.5, s.hipsY - 1.5, wz + 2.6], [k * 8.6, s.hipsY - 1.5, wz + 1], 0.45), 'blazer', { shade: 3, where: b.isMat('blazer') });
  }
}

/** Sleeves to the wrist: the blazer's (grey) or the top's (black). */
export function sleeves(b: ModelBuilder, L: Landmarks, look: HumanLook): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const mat = 'blazer';
  const r = look === 'school' ? 1 : 0.6;
  b.add('upperarm.L', blend(1.3, sphere([sx, sy - 0.5, sz], 2.9 + r * 0.3), cylinder([sx + 0.2, ey - 1.2, sz - 0.2], [sx + 0.1, sy, sz - 0.1], 2.7 + r, 2.6 + r)), mat, { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.6 + r * 0.8), cylinder([sx, wy + 0.4, sz], [sx, ey, sz], 2.3 + r, 2.5 + r)), mat, { mirror: true });
  if (look === 'school') {
    // the shirt cuff showing at the wrist
    b.add('forearm.L', cylinder([sx, wy - 0.3, sz], [sx, wy + 0.8, sz], 2.3), 'shirt', { mirror: true });
  }
  b.add('forearm.L', capsule([sx, wy + 3, sz], [sx, wy - 0.5, sz], 1.9), 'skin', { mirror: true, only: 'empty' });
  b.paint('forearm.L', capsule([sx + 3.2, ey - 1, sz + 1.6], [sx + 3.3, ey - 3.5, sz - 1.4], 0.5), mat, { shade: 3, mirror: true });
}

/** Trousers: straight legs, a crease down the front; loafers. */
export function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy] = s.hip;
  const kneeY = L.knee[1];
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 1, -0.3], [s.hips[0] + 1, 4.2, s.hips[1] + 1], { round: 2.4 }), 'trouser');
  b.add('thigh.L', blend(1.5, sphere([hx, hy, 0], 4.2), capsule([hx, hy, 0], [hx, kneeY, 0.2], 3.7, 3.1)), 'trouser', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([hx, kneeY, 0.2], 3.1), capsule([hx, kneeY, 0.2], [ax, ay + 2.2, az - 0.2], 3, 2.8)), 'trouser', { mirror: true });
  b.paint(['thigh.L', 'shin.L'], capsule([hx, hy - 2, 3.9], [ax, ay + 2.5, 3.2], 0.45), 'trouser', { shade: 2, mirror: true });
  // a belt line
  b.paint('hips', cylinder([0, s.hipsY + 2.2, -0.3], [0, s.hipsY + 3.2, -0.3], 12), 'trouser', { shade: 3 });
  // loafers
  const f = s.foot;
  const toeZ = az + f.len - f.heel;
  b.add('foot.L', capsule([ax, ay + 2.6, az - 0.5], [ax, ay - 0.5, az - 0.5], 2.5), 'shoe', { mirror: true });
  b.add('foot.L', intersect(
    box([ax, 1.9, az + (f.len / 2 - f.heel)], [f.w / 2 + 0.2, 1.9, f.len / 2 + 0.3], { round: 1.5 }),
    fn((_x, y, z) => y - (4 - Math.max(0, z - (toeZ - 4)) * 0.5), [ax - 4, -1, az - 6], [ax + 4, 6, toeZ + 3]),
  ), 'shoe', { mirror: true });
  b.add('foot.L', box([ax, 0.4, az + (f.len / 2 - f.heel)], [f.w / 2 + 0.4, 0.4, f.len / 2 + 0.5], { round: 0.4 }), 'sole', { mirror: true });
}

/** The Substitute Shinigami badge on its braided cord, at the left hip (Lost Agent). */
export function badge(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const p: V3 = [s.hips[0] + 1.6, s.hipsY - 3.5, 2.6];
  b.add('hips', box(p, [0.6, 2.4, 2], { round: 0.6 }), 'badge');
  b.paint('hips', box([p[0] + 0.6, p[1], p[2]], [0.3, 1.2, 0.9]), 'skull');
  b.add('hips', capsule([s.hips[0] + 1.2, s.hipsY + 2.4, 1.2], [p[0], p[1] + 2.4, p[2]], 0.5), 'cord2', { thr: 0.2 });
}

const assetCache = new Map<HumanLook, CharacterAsset>();

export function humanAsset(look: HumanLook): CharacterAsset {
  let a = assetCache.get(look);
  if (!a) assetCache.set(look, (a = buildIchigoHuman(look)));
  return a;
}

export function buildIchigoHuman(look: HumanLook = 'school'): CharacterAsset {
  const b = new ModelBuilder(`ichigo-human-${look}`, HUMAN_RES[look]);
  humanPalette(b, look);
  const s = SPEC_ADULT_MALE;
  const L = humanoidSkeleton(b, s, {});
  humanSockets(b, L);
  humanHead(b, L, look === 'casual');
  hands(b, L, 'skin');
  upperBody(b, L, look);
  sleeves(b, L, look);
  legs(b, L);
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  if (look === 'school') {
    // the blazer's hem, open in front, flapping over the hips
    const hem = coatSkirt(b, L, { mat: 'blazer', lining: 'blazer', yTop: s.hipsY + 1, yHem: 37, r0: 9.4, r1: 10.2, openFront: 22, thick: 1.3, prefix: 'tail' });
    springs.push(...hem.springs.map((sp) => ({ ...sp, stiffness: (sp.stiffness ?? 60) * 1.4, limit: (sp.limit ?? 60) * 0.6 })));
    colliders.push(...hem.colliders);
  } else badge(b, L);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

/** The grips, palms, back, face and the striking surfaces (knuckles, toes, the right heel). */
export function humanSockets(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0], L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0], L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('back', 'chest', [1, 62, -7.5]);
  b.socket('face', 'head', [0, s.chinY + 5.5, Math.round(L.headC[2] + s.head.d / 2)]);
  b.socket('foot.R', 'foot.R', [-L.ankle[0], 1, L.ankle[2] + 6]);
  b.socket('foot.L', 'foot.L', [L.ankle[0], 1, L.ankle[2] + 6]);
  // the striking surfaces: knuckles, toes, the right heel (karate)
  b.socket('knuckle.R', 'fist.R', [-L.wrist[0], L.wrist[1] - 4.3, L.wrist[2] + 3.4]);
  b.socket('knuckle.L', 'fist.L', [L.wrist[0], L.wrist[1] - 4.3, L.wrist[2] + 3.4]);
  b.socket('toe.R', 'foot.R', [-L.ankle[0], 1.5, L.ankle[2] + s.foot.len - s.foot.heel]);
  b.socket('toe.L', 'foot.L', [L.ankle[0], 1.5, L.ankle[2] + s.foot.len - s.foot.heel]);
  b.socket('heel.R', 'foot.R', [-L.ankle[0], 1.5, L.ankle[2] - s.foot.heel]);
  b.socket('forearm.R', 'forearm.R', [-s.shoulder[0], L.elbow[1] - 6, 0]);
}

/** The head: the spiky orange hair (the Lost Agent's longer, with sideburns), the scowl, the nose. */
export function humanHead(b: ModelBuilder, L: Landmarks, lostAgent: boolean, tufts = 46): { front: number; x0: number; chin: number } {
  const s = L.spec;
  const hd = head(b, L, 'skin');
  b.bone('bangs', 'head', [0, s.chinY + 0.5, -0.8]);
  spikeHair(b, L, 'hair', lostAgent ? [...ICHIGO_HAIR, ...SIDEBURNS] : ICHIGO_HAIR, [], { tufts });
  b.carve(['head', 'bangs'], aabb([-5, hd.chin + 4, hd.front], [-1, hd.chin + 7, hd.front + 6]));
  b.carve(['head', 'bangs'], aabb([1, hd.chin + 4, hd.front], [5, hd.chin + 7, hd.front + 6]));
  b.stamp('head', hd.x0, hd.chin + 9, ICHIGO_FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  return hd;
}

