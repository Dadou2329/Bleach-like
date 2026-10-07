// Yasutora "Chad" Sado — Fullbringer. Construction and palette from docs/roster/A2-karakura-allies.md §3,
// the Hueco Mundo look: massive (1.97 m, very broad shoulders, thick neck, big hands), wavy dark-brown
// hair whose bangs hide his eyes, a black long-sleeved shirt with a gold rose on the left sleeve, khaki
// trousers, brown shoes, a silver coin pendant. 84 voxels at 42.6 vox/m.
// Forms are his arms: 'gigante' — Brazo Derecha de Gigante, the right arm coated black with a magenta stripe,
// two fins at the wrist and a pointed fin rising from the shoulder above his head (it opens like an exhaust
// to charge El Directo); 'true' — the right arm a great shield past the fist (ornate magenta lines, Hollow
// teeth in its centre, a hexagonal plate up to the shoulder) and Brazo Izquierda del Diablo on the left:
// bone white, a crimson stripe, red diamonds on the fingertips, a shoulder spike and two claw-plates
// reaching over the chest.
import { ModelBuilder } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, hands, head, humanoidSkeleton, spikeHair, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const CHAD_RES = 84 / 1.97;
export type ChadForm = 'human' | 'gigante' | 'true';

/** Massive: very broad shoulders and chest, thick limbs, long arms, big hands. */
const SPEC: HumanoidSpec = {
  H: 84,
  chinY: 72,
  head: { w: 10, d: 11, h: 12 },
  neckR: 3.3,
  shoulder: [12.6, 66, -0.5],
  upperArm: 15,
  foreArm: 13.5,
  hand: 10,
  armR: 3.3,
  hipsY: 44,
  hip: [5.6, 41.5, 0],
  kneeY: 22.5,
  ankleY: 4.5,
  chest: [12, 7.2],
  waist: [9.6, 6.2],
  hips: [9.4, 6.0],
  chestY: 60.5,
  waistY: 50.5,
  foot: { len: 13, w: 5.6, heel: 3.2 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#D4AC8E', '#C59272', '#AE7B5C', '#8B6045', '#6E4A34'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#784F3F', '#4F3631', '#3F2C2A', '#2E2422', '#1E1716'], { base: 2, rough: 0.6, shadeK: 0.85, dither: 0.08 });
  b.mat('mouth', ['#8A5A4C']);
  b.mat('lid', ['#2E2422']);
  b.mat('sclera', ['#EDE8E2']);
  b.mat('iris', ['#6B4A35']);
  b.mat('irisD', ['#2E2422']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('shirt', ['#3A3A44', '#2A2A33', '#23232B', '#18181E', '#141418'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('rose', ['#E8C35A', '#C8A040', '#9A7A2C'], { base: 1, rough: 0.5, metal: 0.4 });
  b.mat('pants', ['#B8AC86', '#9C8F6A', '#857955', '#6A5F42'], { base: 1, rough: 0.85, shadeK: 0.9 });
  b.mat('belt', ['#4A3A2C', '#33281F'], { base: 0, rough: 0.6 });
  b.mat('shoe', ['#8C6A48', '#6E5236', '#523C27', '#3A2A1B'], { base: 1, rough: 0.5, shadeK: 0.85 });
  b.mat('sole', ['#2A2420']);
  b.mat('coin', ['#E8EBEE', '#D1D5DB', '#B8BCC4', '#8E939B'], { base: 1, rough: 0.25, metal: 0.9, shadeK: 0.8 });
  // the arms
  b.mat('gigante', ['#453C40', '#2A2530', '#1C1A22', '#141418'], { base: 2, rough: 0.3, metal: 0.25, shadeK: 0.8 });
  b.mat('magenta', ['#C04A9A', '#A23A78', '#8D4557', '#583C44'], { base: 1, rough: 0.3, metal: 0.2, glow: 0.15 });
  b.mat('outline', ['#EFEFF5'], { rough: 0.4 });
  b.mat('shield', ['#50556A', '#322E46', '#262237', '#18162A'], { base: 2, rough: 0.28, metal: 0.3, shadeK: 0.8 });
  b.mat('teeth', ['#F3F0EA', '#E8E0E0', '#C9BFC0'], { base: 1, rough: 0.4 });
  b.mat('diablo', ['#F3F0E6', '#F4EFE3', '#DCD5CD', '#BEB4B8', '#A799A2'], { base: 1, rough: 0.35, shadeK: 0.9 });
  b.mat('crimson', ['#D03A50', '#B0283C', '#8A2234', '#6B2E3F'], { base: 1, rough: 0.35, glow: 0.12 });
}

/** The eyes stay under the bangs; a firm, quiet mouth. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. . L L . . L L . .',
  '. . W I . . I W . .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<ChadForm, CharacterAsset>();

export function chadAsset(form: ChadForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildChad(form)));
  return a;
}

export function buildChad(form: ChadForm = 'human'): CharacterAsset {
  const b = new ModelBuilder(`chad-${form}`, CHAD_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.8, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.8, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0] + 0.6, L.wrist[1] - 5.5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0] - 0.6, L.wrist[1] - 5.5, L.wrist[2] + 1]);
  // the knuckles of each fist (where the punches land), the fingertips of the Diablo hand
  b.socket('knuckle.R', 'fist.R', [-L.wrist[0], L.wrist[1] - 8.5, L.wrist[2] + 1.5]);
  b.socket('knuckle.L', 'fist.L', [L.wrist[0], L.wrist[1] - 8.5, L.wrist[2] + 1.5]);
  // the top of the shoulder fin (El Directo's exhaust)
  b.socket('fin', 'upperarm.R', [-s.shoulder[0] - 2, s.H + 3, s.shoulder[2] - 3]);
  b.socket('chest.front', 'chest', [0, s.chestY, 7.5]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'hair', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd);
  const torso = body(b, L);
  shirt(b, L, torso);
  trousers(b, L);
  hands(b, L, 'skin', 1.4);
  if (form === 'gigante') gigante(b, L);
  if (form === 'true') {
    shieldArm(b, L);
    diablo(b, L);
  }
  b.autoShade();
  b.lint();
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [{ bone: 'shin.L', offset: [0, -0.15, 0], radius: 0.08 }, { bone: 'shin.R', offset: [0, -0.15, 0], radius: 0.08 }];
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/** Thick wavy hair to the nape, the bangs falling over the eyes in heavy locks. */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const locks: Spike[] = [];
  // the mass: waves round the crown and the back, down to the nape
  for (const az of [-150, -120, -95, 95, 120, 150, 180]) locks.push({ az, el: -15, len: 3.4, r: 3.4, flat: 0.45, flow: [0, -1.1, -0.2], bend: [Math.sign(az) * 0.15, 0, -0.1] });
  for (const az of [-160, -110, -60, 60, 110, 160, 0]) locks.push({ az, el: 35, len: 2.2, r: 3.2, flat: 0.5, flow: [0, 0.2, -0.4] });
  spikeHair(b, L, 'hair', locks, [
    // the bangs: heavy waves hanging down to the cheekbones, hiding the eyes
    { x: -4.4, tipY: c + 3.6, lean: -0.6, r: 2.4 },
    { x: -1.6, tipY: c + 3.2, lean: 0.4, r: 2.6 },
    { x: 1.4, tipY: c + 3.4, lean: -0.3, r: 2.6 },
    { x: 4.2, tipY: c + 3.8, lean: 0.6, r: 2.4 },
  ], { hairline: c + s.head.h - 1.5, nape: c + 1.5, slope: 0.5 });
  // waves: a few darker crests across the locks
  b.paint('head', fn((x, y) => Math.abs(((y + x * 0.4 + 40) % 2.6) - 1.3) - 0.3, [-9, c, -10], [9, c + 16, 9]), 'hair', { shade: 3, where: b.isMat('hair') });
}

// ---------------------------------------------------------------------------------------------- body

/** A heavy, powerful torso: deep chest, broad back, thick waist. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const chest = box([0, s.chestY - 0.5, -0.3], [cx, 6.4, cz], { round: 3.8 });
  const waist = box([0, s.waistY, -0.2], [wx, 4.8, wz], { round: 3.2 });
  const pelvis = box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.8, s.hips[1]], { round: 2.8 });
  const traps = [capsule([2.6, sy + 2, sz - 1], [sx - 1.6, sy, sz], 3.4, 3.5), capsule([-2.6, sy + 2, sz - 1], [-sx + 1.6, sy, sz], 3.4, 3.5)];
  const balls = [sphere([sx, sy - 0.6, sz], 3.9), sphere([-sx, sy - 0.6, sz], 3.9)];
  const pecs = [ellipsoid([4.2, s.chestY + 1.4, cz - 0.6], [4.4, 3, 2], [0, 0, -12]), ellipsoid([-4.2, s.chestY + 1.4, cz - 0.6], [4.4, 3, 2], [0, 0, 12])];
  const lats = [ellipsoid([cx - 0.5, s.chestY - 3, -1], [2.2, 5, 4.2]), ellipsoid([-cx + 0.5, s.chestY - 3, -1], [2.2, 5, 4.2])];
  const torso = blend(3, chest, waist, pelvis, ...traps, ...balls, ...pecs, ...lats);
  addBands(b, torso, 'skin', [['hips', 36, 46], ['spine', 46, 56], ['chest', 54, 82]]);
  // the neck: thick
  b.add('neck', capsule([0, s.chinY - 6, L.headC[2] - 0.8], [0, s.chinY + 1, L.headC[2] - 0.8], s.neckR + 0.4), 'skin');
  // arms: heavy deltoids, biceps, forearms
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.6, sphere([sx, sy - 0.6, sz], 4.1), capsule([sx, sy - 1, sz], [sx, ey + 1, sz], 3.8, 3.2), ellipsoid([sx, sy - 6.5, sz + 1], [3.2, 4.8, 3])), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.3, sphere([sx, ey, sz], 3.2), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 3.4, 2.6)), 'skin', { mirror: true });
  return torso;
}

/** Black long-sleeved shirt with a round neck (the pendant on its chain), a gold rose on the left sleeve. */
function shirt(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const neck = intersect(ellipsoid([0, s.chinY - 3, 3.5], [3.6, 5.5, 6]), halfSpace([0, 0, 0], [0, 0, -1]));
  const shell = subtract(offset(torso, 0.8), neck);
  addBands(b, intersect(shell, aabb([-30, s.hipsY - 2, -30], [30, 90, 30])), 'shirt', [['hips', s.hipsY - 2, 46], ['spine', 46, 56], ['chest', 54, 90]]);
  b.add('upperarm.L', blend(1.6, sphere([sx, sy - 0.6, sz], 4.9), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 4.5, 3.9)), 'shirt', { mirror: true });
  b.add('forearm.L', blend(1.3, sphere([sx, ey, sz], 3.9), capsule([sx, ey - 0.5, sz], [sx, wy + 1.5, sz], 4, 3.4)), 'shirt', { mirror: true });
  // the cuffs and the shirt's hem, a little darker
  b.paint('forearm.L', cylinder([sx, wy + 0.8, sz], [sx, wy + 2.6, sz], 4.3), 'shirt', { shade: 3, mirror: true, where: b.isMat('shirt') });
  b.paint(['hips'], aabb([-20, s.hipsY - 2, -20], [20, s.hipsY - 0.6, 20]), 'shirt', { shade: 3, where: b.isMat('shirt') });
  // folds across the chest and back
  for (const y of [s.chestY - 4, s.waistY + 2]) b.paint(['chest', 'spine'], torus([0, y, -0.3], s.chest[0] + 0.4, 0.5, [90, 0, 0]), 'shirt', { shade: 3, where: b.isMat('shirt') });
  // the rose on the left sleeve: a ring of petals round a bud, a short stem
  const rx = sx + 4.3, ry = sy - 6;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    b.paint('upperarm.L', sphere([rx, ry + Math.sin(a) * 1.3, sz + Math.cos(a) * 1.3], 0.9), 'rose', { where: b.isMat('shirt') });
  }
  b.paint('upperarm.L', sphere([rx, ry, sz], 0.9), 'rose', { shade: 2, where: b.isMat('shirt') });
  b.paint('upperarm.L', capsule([rx, ry - 1.4, sz], [rx, ry - 4, sz - 0.6], 0.4), 'rose', { shade: 3, where: b.isMat('shirt') });
  // the coin pendant on its chain
  const pts = smoothPath([[-3.4, s.chinY - 3, 1.5], [-2.4, s.chestY + 3.6, s.chest[1] + 0.8], [0, s.chestY + 2.2, s.chest[1] + 1.4], [2.4, s.chestY + 3.6, s.chest[1] + 0.8], [3.4, s.chinY - 3, 1.5]], 3);
  b.add('chest', tube(pts, pts.map(() => 0.35)), 'coin', { thr: 0.15 });
  b.add('chest', cylinder([0, s.chestY + 0.6, s.chest[1] + 1.2], [0, s.chestY + 0.6, s.chest[1] + 2.0], 1.5), 'coin');
}

/** Khaki trousers, a dark belt, brown shoes. */
function trousers(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 0.5, -0.3], [s.hips[0] + 0.7, 3.8, s.hips[1] + 0.7], { round: 2.6 }), 'pants');
  b.add('hips', box([0, s.hipsY + 2.6, -0.3], [s.hips[0] + 1, 0.8, s.hips[1] + 1], { round: 0.8 }), 'belt');
  b.add('thigh.L', blend(1.4, sphere([hx, hy, hz], 5.2), capsule([hx, hy, hz], [kx, ky + 1, kz], 5.2, 4.3)), 'pants', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([kx, ky, kz], 4.2), capsule([kx, ky, kz], [ax, ay + 2, az], 4.1, 3.8)), 'pants', { mirror: true });
  // creases at the knee, the hem
  b.paint('shin.L', torus([kx, ky + 1.5, kz], 4.2, 0.5), 'pants', { shade: 3, mirror: true });
  b.paint('shin.L', cylinder([ax, ay + 1.5, az], [ax, ay + 3, az], 4.2), 'pants', { shade: 3, mirror: true, where: b.isMat('pants') });
  // shoes
  const f = s.foot;
  const toeZ = az + f.len - f.heel;
  b.add('foot.L', capsule([ax, ay + 1.5, az - 0.4], [ax, ay - 1, az - 0.4], 2.9), 'shoe', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.4, az + (f.len / 2 - f.heel)], [f.w / 2, 2.4, f.len / 2], { round: 1.6 }), halfSpace([0, 4.8, toeZ - 3], [0, 1, 0.65])), 'shoe', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 14]), 'sole', { mirror: true });
}

// ---------------------------------------------------------------------------------------------- the arms

/** The stripe down the arm's outer face: a band of `mat` painted where the armour is. */
function stripe(b: ModelBuilder, bones: string[], x: number, y0: number, y1: number, w: number, mat: string, armour: string): void {
  b.paint(bones, intersect(capsule([x, y0, 0], [x, y1, 0], 30), fn((px, py, pz) => Math.abs(pz - 0) - w, [-40, Math.min(y0, y1) - 2, -40], [40, Math.max(y0, y1) + 2, 40]), halfSpace([x, 0, 0], [x > 0 ? -1 : 1, 0, 0])), mat, { where: b.isMat(armour) });
}

/**
 * Brazo Derecha de Gigante (completed form): the right arm coated to the shoulder, black with a magenta
 * stripe; two fins either side of the wrist; a single pointed fin rising from the shoulder above his head.
 */
function gigante(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const x = -sx;
  // the coat, about 1.4× the arm
  b.add('upperarm.R', blend(1.6, sphere([x, sy - 0.4, sz], 5.4), capsule([x, sy - 1, sz], [x, ey + 0.5, sz], 4.8, 4.4)), 'gigante');
  b.add('forearm.R', blend(1.3, sphere([x, ey, sz], 4.6), capsule([x, ey - 0.5, sz], [x, wy + 0.5, sz + 0.3], 4.5, 4.9)), 'gigante');
  b.add('fist.R', blend(1, box([x, wy - 4.6, sz + 0.6], [3.4, 4.6, 3.6], { round: 1.4 }), sphere([x, wy - 1, sz + 0.3], 4.4)), 'gigante');
  // knuckle ridges
  for (let i = 0; i < 4; i++) b.add('fist.R', capsule([x - 2.4 + i * 1.6, wy - 8.6, sz + 3.6], [x - 2.4 + i * 1.6, wy - 8.6, sz + 1.6], 0.9), 'gigante');
  // wrist fins, either side, sweeping back
  for (const k of [-1, 1]) b.add('forearm.R', prism([[0, 0], [5, 2], [6.5, -1.5], [1, -3]], [x + k * 3.8, wy + 2.5, sz], [k * 0.85, 0.5, 0], [0, 0.3, -1], 0.7), 'gigante', { thr: 0.25 });
  // the shoulder fin: a tall pointed blade standing up and back from the shoulder, above his head
  b.add('upperarm.R', blend(1.2,
    prism([[-3.2, 0], [3.2, 0], [1.4, 18], [-0.6, 26], [-2.2, 12]], [x - 1.4, sy + 3, sz - 1.4], [0, 0.15, -1], [0.05, 1, 0.15], 1.1),
    ellipsoid([x - 0.6, sy + 3, sz - 0.6], [4, 2.6, 4])), 'gigante', { thr: 0.25 });
  // the stripe: magenta down the outer face and up the fin, a thin white outline
  stripe(b, ['upperarm.R', 'forearm.R', 'fist.R'], x, sy + 30, wy - 9, 1.1, 'magenta', 'gigante');
  stripe(b, ['upperarm.R', 'forearm.R', 'fist.R'], x, sy + 30, wy - 9, 1.6, 'outline', 'gigante');
  stripe(b, ['upperarm.R', 'forearm.R', 'fist.R'], x, sy + 30, wy - 9, 1.1, 'magenta', 'outline');
}

/**
 * The true Gigante: a great shield from the hand to past the forearm — ornate magenta lines, a row of
 * Hollow teeth in its centre — and a hexagonal plate from the wrist up to the shoulder.
 */
function shieldArm(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const x = -sx;
  b.add('upperarm.R', blend(1.6, sphere([x, sy - 0.4, sz], 5.2), capsule([x, sy - 1, sz], [x, ey + 0.5, sz], 4.6, 4.2)), 'shield');
  b.add('forearm.R', blend(1.3, sphere([x, ey, sz], 4.4), capsule([x, ey - 0.5, sz], [x, wy + 0.5, sz], 4.3, 4.4)), 'shield');
  b.add('fist.R', blend(1, box([x, wy - 4.6, sz + 0.6], [3.4, 4.6, 3.6], { round: 1.4 }), sphere([x, wy - 1, sz + 0.3], 4.2)), 'shield');
  // the hexagonal plate along the outer upper arm
  const hex: [number, number][] = [];
  for (let i = 0; i < 6; i++) hex.push([Math.cos((i / 6) * Math.PI * 2) * 4.2, Math.sin((i / 6) * Math.PI * 2) * 8.5]);
  b.add('upperarm.R', prism(hex, [x - 4.6, sy - 7, sz], [0, 0, 1], [0, 1, 0], 0.9), 'shield', { thr: 0.25 });
  b.paint('upperarm.R', prism(hex.map(([u, v]) => [u * 0.7, v * 0.75] as [number, number]), [x - 5.6, sy - 7, sz], [0, 0, 1], [0, 1, 0], 0.6), 'magenta', { where: b.isMat('shield') });
  // the shield: a long slab on the outside of the forearm, running out past the fist
  const sh = blend(1.2,
    box([x - 3.4, ey - 9, sz], [1.6, 13, 6.4], { round: 1.4 }),
    box([x - 3.0, wy - 7, sz], [1.4, 5, 5.6], { round: 1.6 }));
  b.add('forearm.R', intersect(sh, aabb([x - 10, wy - 2, -20], [x + 2, ey + 6, 20])), 'shield');
  b.add('fist.R', intersect(sh, aabb([x - 10, wy - 16, -20], [x + 2, wy - 2, 20])), 'shield');
  // ornate lines: magenta curls round the face of the shield
  b.paint(['forearm.R', 'fist.R'], intersect(fn((px, py, pz) => Math.abs(Math.hypot(pz, (py - (ey - 9)) * 0.5) - 4.6) - 0.5, [x - 8, ey - 24, -9], [x, ey + 6, 9]), halfSpace([x - 4.4, 0, 0], [1, 0, 0])), 'magenta', { where: b.isMat('shield') });
  b.paint(['forearm.R', 'fist.R'], intersect(capsule([x - 5, ey + 2, 0], [x - 5, wy - 10, 0], 0.7), halfSpace([x - 4.4, 0, 0], [1, 0, 0])), 'magenta', { where: b.isMat('shield') });
  // the Hollow teeth in its centre: two rows meeting
  for (let i = 0; i < 6; i++) {
    const z = -3.4 + i * 1.36;
    b.add('forearm.R', spike([x - 5.2, wy + 3.2, z], [0, -1, 0], 2.2, 0.65, 0.5, { tip: 0.3 }), 'teeth', { thr: 0.2 });
    b.add('forearm.R', spike([x - 5.2, wy - 1.8, z + 0.68], [0, 1, 0], 2, 0.6, 0.5, { tip: 0.3 }), 'teeth', { thr: 0.2 });
  }
  b.add('forearm.R', box([x - 5, wy + 0.7, 0], [0.5, 2.8, 4.4]), 'shield');
}

/**
 * Brazo Izquierda del Diablo: bone white with a crimson stripe down the centre, red diamonds on the
 * fingertips, a spike from the shoulder and two claw-like plates reaching over the chest.
 */
function diablo(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const x = sx;
  b.add('upperarm.L', blend(1.6, sphere([x, sy - 0.4, sz], 5), capsule([x, sy - 1, sz], [x, ey + 0.5, sz], 4.4, 4)), 'diablo');
  b.add('forearm.L', blend(1.3, sphere([x, ey, sz], 4.2), capsule([x, ey - 0.5, sz], [x, wy + 0.5, sz + 0.3], 4.1, 4.4)), 'diablo');
  b.add('fist.L', blend(1, box([x, wy - 4.6, sz + 0.6], [3.4, 4.6, 3.6], { round: 1.4 }), sphere([x, wy - 1, sz + 0.3], 4.2)), 'diablo');
  // fingers: four ridges ending in red diamonds
  for (let i = 0; i < 4; i++) {
    const fx = x + 2.4 - i * 1.6;
    b.add('fist.L', capsule([fx, wy - 8.6, sz + 3.6], [fx, wy - 8.6, sz + 1.6], 0.9), 'diablo');
    b.paint('fist.L', box([fx, wy - 8.6, sz + 4.2], [0.7, 0.7, 0.5]), 'crimson');
  }
  // the shoulder spike
  b.add('upperarm.L', spike([x + 2.6, sy + 2.2, sz - 0.6], [0.8, 0.7, -0.2], 7, 2.2, 1.2, { tip: 0.3 }), 'diablo', { thr: 0.25 });
  // two claw-like plates curving from the shoulder over the chest
  for (const dy of [0, -4.6]) {
    const pts = smoothPath([[x - 1, sy + 1 + dy, sz + 3], [x - 4.5, sy - 1.5 + dy, s.chest[1] + 2.2], [x - 8, sy - 4 + dy, s.chest[1] + 2.6], [x - 10.5, sy - 7.5 + dy, s.chest[1] + 2.2]], 4);
    b.add('chest', tube(pts, pts.map((_, i) => 1.5 - i * 0.08)), 'diablo', { thr: 0.25 });
  }
  // the crimson stripe down the centre of the arm
  stripe(b, ['upperarm.L', 'forearm.L', 'fist.L'], x, sy + 6, wy - 9, 1.1, 'crimson', 'diablo');
}
