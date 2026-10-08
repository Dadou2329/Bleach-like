// Gremmy Thoumeaux (docs/roster/H2-sternritter-1.md § 6; kit docs/kits/gremmy.md). Brief: 155 cm → 74 vox at 48/m
// (head 12, ≈ 1/6.2: child-like); slight. Silhouette keys: messy blond hair; the oversized white trench coat — hood
// down on his back, the collar standing up to his chin, the sleeves hanging past his hands (he never lifts a finger),
// the long skirt to the shins, a belt; small black boots. Face: big red eyes, calm, a faint smug little mouth. Forms:
// 'base'; 'steel' (Steel Body: the same shapes gone steel all over, only the eyes keep their red); 'bulk' (Imagined
// Strength: arms and shoulders swollen past what the body can hold, the sleeves and the coat's shoulders torn open,
// veins). Props: 'brain' (his real body: a brain in a glass capsule with steel caps — the glass is the kit's mesh), and
// the imagined things at their own densities: 'spike', 'bar', 'block', 'column', 'hand' (the giant stone hand),
// 'meteor', 'rifle', 'missile', 'bomb', 'dome' (the bladed dome). (verify) the coat's sleeve length; the boots' colour.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { blend, box, capsule, cylinder, ellipsoid, fn, smoothPath, sphere, spike, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, hands, head, humanoidSkeleton, spikeHair, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const GREMMY_RES = 48;
export type GremmyForm = 'base' | 'steel' | 'bulk';

/** Slight and child-like: a big head, short limbs. */
const SPEC: HumanoidSpec = {
  H: 74,
  chinY: 62,
  head: { w: 10, d: 10.6, h: 12 },
  neckR: 1.9,
  shoulder: [6.6, 57.2, -0.5],
  upperArm: 12,
  foreArm: 11,
  hand: 7.2,
  armR: 1.8,
  hipsY: 38.5,
  hip: [3.6, 36, 0],
  kneeY: 20,
  ankleY: 4,
  chest: [5.8, 3.9],
  waist: [4.8, 3.4],
  hips: [5.6, 3.9],
  chestY: 52,
  waistY: 44.5,
  foot: { len: 9.6, w: 4, heel: 2.4 },
};

const STEEL = ['#E2E6EC', '#C3C9D2', '#A3ABB6', '#828B97', '#5F6773'];

function palette(b: ModelBuilder, form: GremmyForm): void {
  const steel = form === 'steel';
  const m = (name: string, colors: string[], o: Parameters<ModelBuilder['mat']>[2] = {}) => b.mat(name, steel ? STEEL : colors, steel ? { base: 2, rough: 0.25, metal: 0.85, shadeK: 0.9 } : o);
  m('skin', ['#FBEFE6', '#F6E4D6', '#E8D0BE', '#D4B8A4', '#BB9E8A'], { base: 1, rough: 0.6, shadeK: 0.9 });
  m('hair', ['#F8E7A8', '#F0D886', '#E8C766', '#D3AF52', '#B9963E', '#94742C'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.04 });
  b.mat('brow', [steel ? '#5F6773' : '#B9963E']);
  b.mat('lid', [steel ? '#4A525E' : '#6E4A3A']);
  b.mat('sclera', [steel ? '#C3C9D2' : '#F3F3F0']);
  b.mat('iris', ['#B8242C']);
  b.mat('irisD', ['#5A0C12']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', [steel ? '#5F6773' : '#B57E74']);
  m('coat', ['#F3F3F0', '#F1F2EF', '#DDE0E4', '#C9CCD3', '#A4ABB8'], { base: 1, rough: 0.75, shadeK: 0.9 });
  m('coatIn', ['#D9DCE2', '#C3C8D0', '#A5ACB8'], { base: 1, rough: 0.8 });
  m('boot', ['#3A3940', '#2E2D34', '#232228', '#1A1A1F'], { base: 1, rough: 0.45, shadeK: 0.85 });
  m('belt', ['#E6E7E9', '#CDD0D4', '#ADB2BA'], { base: 1, rough: 0.6 });
  b.mat('buckle', steel ? STEEL : ['#D3D8DF', '#B9C0C8', '#9DA6B0'], { base: 1, rough: 0.3, metal: 0.7 });
  if (form === 'bulk') b.mat('vein', ['#C9928A', '#B57E74']);
}

/** Big red eyes, round and calm; light brows; a small mouth with the corner up. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. . B B . . B B . .',
  '. . . . . . . . . .',
  '. L L L . . L L L .',
  '. W I I . . I I W .',
  '. W i * . . * i W .',
  '. . I I . . I I . .',
  '. . . . . s . . . .',
  '. . . . m m m . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<GremmyForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function gremmyAsset(form: GremmyForm = 'base'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildGremmy(form)));
  return a;
}

/**
 * 'brain' (centred), 'spike' (base at the origin, up +Y), 'bar' (centred, along ±X), 'block' (centred), 'column'
 * (base at the origin, along +Z), 'hand' (the palm facing −Y, fingers along +Z, the wrist at the origin), 'meteor'
 * (centred), 'rifle' (the grip at the origin, the muzzle along +Z), 'missile' (centred, nose +Z), 'bomb' (centred),
 * 'dome' (the bladed dome: its rim on y = 0).
 */
export type GremmyProp = 'brain' | 'spike' | 'bar' | 'block' | 'column' | 'hand' | 'meteor' | 'rifle' | 'missile' | 'bomb' | 'dome';

export function gremmyProp(kind: GremmyProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    const make: Record<GremmyProp, () => VoxelModel> = {
      brain: buildBrain, spike: buildSpike, bar: buildBar, block: buildBlock, column: buildColumn, hand: buildHand,
      meteor: buildMeteor, rifle: buildRifle, missile: buildMissile, bomb: buildBomb, dome: buildDome,
    };
    propCache.set(kind, (m = make[kind]()));
  }
  return m;
}

/** sizes the kit places by (m) */
export const SPIKE_H = 2.2;
export const COLUMN_LEN = 7;
export const HAND_LEN = 7.5;
export const METEOR_R = 7;
export const DOME_R = 1.7;
export const RIFLE_MUZZLE = 0.62;

export function buildGremmy(form: GremmyForm = 'base'): CharacterAsset {
  const b = new ModelBuilder(`gremmy-${form}`, GREMMY_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.5, wy - 4.4, wz + 0.8]);
  b.socket('palm.L', 'palm.L', [wx - 0.5, wy - 4.4, wz + 0.8]);
  b.socket('back', 'chest', [0, s.chestY + 2, -7]);
  b.socket('chest.front', 'chest', [0, s.chestY, s.chest[1] + 3]);
  b.socket('toe.R', 'foot.R', [-L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel]);
  b.socket('toe.L', 'foot.L', [L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('eye.L', 'head', [2.5, s.chinY + 5, hd.front + 0.3]);
  b.socket('eye.R', 'head', [-2.5, s.chinY + 5, hd.front + 0.3]);
  b.socket('brain', 'head', [0, s.chinY + 7, L.headC[2]]);
  // a child's round cheeks
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 2, hd.front, 'skin', 1);
  messyHair(b, L, hd);
  hands(b, L, 'skin');
  const torso = body(b, L, form);
  const coat = trench(b, L, torso, form);
  legs(b, L);
  b.autoShade();
  b.lint();
  return {
    model: b.build(),
    springs: coat.springs,
    colliders: [...coat.colliders, { bone: 'thigh.L', offset: [0, -0.08, 0.02], radius: 0.09 }, { bone: 'thigh.R', offset: [0, -0.08, 0.02], radius: 0.09 }],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- head

/** Messy blond hair: clumps every which way, a ragged fringe over the brows, tufts over the ears. */
function messyHair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const CAP: Spike[] = [
    { az: 0, el: 70, len: 1.8, r: 3.4, flat: 0.55, flow: [0.7, -0.3, 0.6] },
    { az: -40, el: 60, len: 2.2, r: 3.2, flat: 0.5, flow: [-0.9, -0.3, 0.3] },
    { az: 40, el: 58, len: 2.0, r: 3.2, flat: 0.5, flow: [0.9, -0.4, 0.2] },
    { az: 150, el: 55, len: 2.6, r: 3.4, flat: 0.5, flow: [0.3, -0.3, -0.8] },
    { az: -150, el: 50, len: 2.6, r: 3.4, flat: 0.5, flow: [-0.4, -0.4, -0.7] },
    { az: 100, el: 30, len: 3.2, r: 3.0, flat: 0.55, flow: [0.4, -0.5, 0] },
    { az: -100, el: 32, len: 3.4, r: 3.0, flat: 0.55, flow: [-0.4, -0.4, 0.1] },
    { az: 180, el: 25, len: 3.0, r: 3.2, flat: 0.55, flow: [0, -0.7, -0.3] },
    { az: -130, el: 10, len: 2.8, r: 2.8, flat: 0.55, flow: [-0.2, -0.9, -0.1] },
    { az: 130, el: 12, len: 2.6, r: 2.8, flat: 0.55, flow: [0.3, -0.9, -0.1] },
    { az: 75, el: 62, len: 1.8, r: 2.8, flat: 0.5, flow: [0.8, -0.2, -0.3] },
  ];
  spikeHair(b, L, 'hair', CAP, [], { tufts: 26, tuftFlow: [0, -0.5, -0.4], hairline: c + s.head.h - 1.6, slope: 0.7 });
  // the ragged fringe: short locks over the forehead, falling to the brows, the tips scattered
  const locks: [number, number, number, number][] = [[-4.2, c + 8.4, 1.2, -0.6], [-2.2, c + 7.9, 1.3, 0.3], [0.1, c + 8.6, 1.25, -0.2], [2.2, c + 7.8, 1.3, 0.4], [4.2, c + 8.5, 1.2, 0.7]];
  for (const [x, tipY, r, lean] of locks) {
    const top: V3 = [x - lean, c + 12, front - 1.2];
    b.add('head', spike(top, [lean * 0.35, -1, 0.15], top[1] - tipY, r, r * 0.5, { side: [1, 0, 0], tip: 0.35 }), 'hair', { thr: 0.3 });
  }
  // tufts over the ears
  for (const k of [-1, 1]) {
    const pts = smoothPath([[k * 5.4, c + 10, front - 4.2], [k * 6.3, c + 7, front - 4.6], [k * 6.0, c + 4.6, front - 4.4]], 3);
    b.add('head', tube(pts, pts.map((_, i) => 1.8 - i * 0.18)), 'hair', { thr: 0.3 });
  }
}

// ---------------------------------------------------------------------------------------------- body & coat

function torsoSdf(L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  return blend(2.2,
    box([0, s.chestY - 0.5, -0.3], [cx, 5.2, cz], { round: 2.6 }),
    box([0, s.waistY, -0.2], [wx, 4.2, wz], { round: 2.4 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.4, s.hips[1]], { round: 2.2 }),
    capsule([2, sy + 1.2, sz - 0.6], [sx - 1.2, sy - 0.2, sz], 2.2, 2.3), capsule([-2, sy + 1.2, sz - 0.6], [-sx + 1.2, sy - 0.2, sz], 2.2, 2.3),
    sphere([sx, sy - 0.5, sz], 2.6), sphere([-sx, sy - 0.5, sz], 2.6));
}

/**
 * The coat's body, roomy: a shell well off the slight torso, dropped shoulders. The sleeves hang wide past the hands;
 * in the bulk form the arms swell out through torn sleeves.
 */
function body(b: ModelBuilder, L: Landmarks, form: GremmyForm): Sdf {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const torso = torsoSdf(L);
  const bulk = form === 'bulk';
  const coatBody = bulk ? blend(2, torso, ellipsoid([0, s.chestY + 1, -2.2], [10.5, 8, 6.5])) : torso;
  addBands(b, coatBody, 'coat', [['hips', 30, 45], ['spine', 45, 50], ['chest', 50, 80]], { thr: 1.1 });
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.5], [0, s.chinY + 2, L.headC[2] - 0.5], s.neckR), 'skin');
  const ey = L.elbow[1], wy = L.wrist[1];
  if (!bulk) {
    // the oversized sleeves: wide, hanging past the hands, the cuffs open
    b.add('upperarm.L', blend(1.2, sphere([sx + 0.4, sy - 0.8, sz], 3.4), capsule([sx + 0.3, sy - 1, sz], [sx + 0.2, ey + 0.4, sz], 3.1, 3.0)), 'coat', { mirror: true });
    const t = (y: number) => Math.max(0, Math.min(1, (ey - y) / (ey - (wy - 7.5))));
    b.add('forearm.L', fn((x, y, z) => {
      const d = Math.hypot(x - sx, z - (sz + t(y) * 0.6)) - (3.0 + t(y) * 1.6);
      return Math.max(d, y - (ey + 0.8), (wy - 7.5) - y);
    }, [sx - 7, wy - 9, sz - 7], [sx + 7, ey + 2, sz + 7]), 'coat', { mirror: true });
    // the open cuff: hollowed (a wall two voxels thick left all round), lined
    b.carve('forearm.L', fn((x, y, z) => Math.max(Math.hypot(x - sx, z - (sz + t(y) * 0.6)) - (1.0 + t(y) * 1.6), y - (wy - 3), (wy - 8) - y), [sx - 6, wy - 9, sz - 6], [sx + 6, wy - 2, sz + 6]), { mirror: true });
    b.paint('forearm.L', fn((x, y, z) => Math.max(Math.hypot(x - sx, z - (sz + t(y) * 0.6)) - (2.2 + t(y) * 1.6), y - (wy - 2.4), (wy - 8) - y), [sx - 7, wy - 9, sz - 7], [sx + 7, wy - 1, sz + 7]), 'coatIn', { mirror: true, where: b.isMat('coat') });
  } else {
    // swollen past what the body can hold: the shoulders and arms bulging out of the torn sleeves
    b.add('upperarm.L', blend(1.6, sphere([sx + 1.2, sy - 0.5, sz], 5.4), ellipsoid([sx + 1.2, sy - 6.5, sz + 1.6], [4.8, 6.2, 4.6]), capsule([sx + 1, sy - 1, sz], [sx + 0.6, ey + 0.4, sz], 4.2, 3.6)), 'skin', { mirror: true });
    b.add('forearm.L', blend(1.4, ellipsoid([sx + 0.6, ey - 3.5, sz + 0.6], [4.4, 5, 4.2]), capsule([sx, ey - 1, sz], [sx, wy + 1, sz], 3.8, 2.8)), 'skin', { mirror: true });
    // the torn sleeve ring at the shoulder
    b.add('upperarm.L', fn((x, y, z) => Math.max(Math.abs(Math.hypot(x - sx - 1.2, z - sz) - 5.4) - 0.8, Math.abs(y - (sy + 2.2)) - 1.2 - Math.sin(Math.atan2(z - sz, x - sx) * 6) * 0.9), [sx - 8, sy - 2, sz - 8], [sx + 9, sy + 6, sz + 8]), 'coat', { mirror: true, thr: 0.2 });
    b.paint('upperarm.L', fn((x, y, z) => Math.abs(z - sz - 2 - Math.sin(y * 0.5) * 1.2) - 0.5 + (x < sx ? 9 : 0), [sx - 8, ey, sz - 8], [sx + 9, sy, sz + 8]), 'vein', { mirror: true, where: b.isMat('skin') });
    b.paint('forearm.L', fn((x, y, z) => Math.abs(x - sx - 1.4 - Math.sin(y * 0.6) * 1.2) - 0.5 + (z < sz ? 9 : 0), [sx - 8, wy, sz - 8], [sx + 9, ey, sz + 8]), 'vein', { mirror: true, where: b.isMat('skin') });
  }
  return torso;
}

/**
 * The trench coat: the collar standing up round the neck to the chin, the hood lying down on the back, the belt with
 * its buckle, the long skirt to the shins on spring panels.
 */
function trench(b: ModelBuilder, L: Landmarks, torso: Sdf, form: GremmyForm): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  void torso;
  const nz = L.headC[2] - 0.6;
  // the high collar: a tall ring round the neck, open a crack at the front
  b.add('chest', fn((x, y, z) => {
    const r = Math.hypot(x, (z - nz) * 1.05);
    const ring = Math.abs(r - (s.neckR + 2.4)) - 0.9;
    const slit = Math.abs(x) < 0.8 && z > nz + 2 ? 1 : -1;
    return Math.max(ring, y - (s.chinY + 2.2 + Math.max(0, -(z - nz)) * 0.25), (s.chinY - 6) - y, slit);
  }, [-9, s.chinY - 7, nz - 9], [9, s.chinY + 5, nz + 9]), 'coat', { thr: 0.2 });
  b.paint('chest', fn((x, y, z) => Math.max(Math.hypot(x, (z - nz) * 1.05) - (s.neckR + 2.0), y - (s.chinY + 3), (s.chinY - 6) - y), [-9, s.chinY - 7, nz - 9], [9, s.chinY + 5, nz + 9]), 'coatIn', { where: b.isMat('coat') });
  // the hood, down: a soft fold of cloth on the upper back
  const hb = -s.chest[1] - 1.4;
  b.add('chest', blend(1.2,
    ellipsoid([0, s.chinY - 4.2, hb - 0.8], [5.4, 3.0, 2.4]),
    ellipsoid([0, s.chinY - 7.5, hb - 1.6], [4.4, 2.6, 2.0])), 'coat', { thr: 0.2 });
  b.paint('chest', ellipsoid([0, s.chinY - 3.6, hb - 2.2], [3.8, 1.8, 1.4]), 'coatIn', { where: b.isMat('coat') });
  // the belt
  const by = s.waistY - 1.5;
  b.add('hips', box([0, by, -0.2], [s.waist[0] + 1.6, 0.9, s.waist[1] + 1.6], { round: 1.2 }), 'belt', { only: 'empty' });
  b.add('hips', box([0, by, s.waist[1] + 1.9], [1.3, 1.1, 0.7]), 'buckle');
  // the buttons down the front
  for (const y of [s.chestY + 1, s.chestY - 3, s.waistY + 2]) {
    const bone = y >= 50 ? 'chest' : y >= 45 ? 'spine' : 'hips';
    b.add(bone, sphere([1.6, y, s.chest[1] + 1.8], 0.7), 'buckle', { thr: 0.1 });
  }
  void form;
  return coatSkirt(b, L, { mat: 'coat', lining: 'coatIn', yTop: s.waistY - 3, yHem: 9, r0: 7.0, r1: 11.0, openFront: 6, overlap: 3, res: GREMMY_RES, depth: 0.85 });
}

/** White trousers, small black boots. */
function legs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('thigh.L', blend(1.2, sphere([hx, hy, hz], 2.9), capsule([hx, hy, hz], [kx, ky + 1, kz], 2.8, 2.3)), 'coat', { mirror: true });
  b.add('shin.L', blend(1, sphere([kx, ky, kz], 2.3), capsule([kx, ky, kz], [ax, ay + 3, az], 2.2, 1.9)), 'coat', { mirror: true });
  b.add('shin.L', capsule([kx, ky - 6, kz], [ax, ay + 0.6, az], 2.25, 2.1), 'boot', { mirror: true });
  const f = s.foot;
  b.add('foot.L', capsule([ax, ay + 1.6, az - 0.3], [ax, ay - 1, az - 0.3], 2.2), 'boot', { mirror: true });
  b.add('foot.L', box([ax, 1.8, az + (f.len / 2 - f.heel) + 0.2], [f.w / 2 + 0.3, 1.7, f.len / 2 + 0.2], { round: 1.4 }), 'boot', { mirror: true });
}

// ---------------------------------------------------------------------------------------------- props

/** His real body: a brain in a capsule — the steel caps top and bottom, a ring round the middle (the glass is a mesh). */
function buildBrain(): VoxelModel {
  const b = new ModelBuilder('gremmy-brain', 48);
  b.mat('brain', ['#EBC2BE', '#D9A3A0', '#C68A87', '#A8706E'], { base: 1, rough: 0.5, shadeK: 0.9 });
  b.mat('steel', ['#C5CBD3', '#A8B0BA', '#8C939B', '#6E757E'], { base: 1, rough: 0.3, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', blend(1.2, ellipsoid([-1.6, 0.5, 0], [3.4, 3.4, 5]), ellipsoid([1.6, 0.5, 0], [3.4, 3.4, 5]), ellipsoid([0, -2.2, -2.2], [2.6, 2, 2.2])), 'brain');
  // the folds
  b.paint('root', fn((x, y, z) => Math.abs(Math.sin(x * 1.1 + Math.sin(z * 0.9) * 1.6) + Math.sin(z * 1.3 + y * 0.8) * 0.6) - 0.35, [-6, -4, -6], [6, 5, 6]), 'brain', { shade: 3, where: b.isMat('brain') });
  b.paint('root', fn((x) => Math.abs(x) - 0.4, [-6, 0, -6], [6, 5, 6]), 'brain', { shade: 3, where: b.isMat('brain') });
  // the caps and the stem of the capsule
  b.add('root', cylinder([0, 5.6, 0], [0, 7.4, 0], 4.2, 3.4, 0.6), 'steel');
  b.add('root', cylinder([0, -6.4, 0], [0, -4.6, 0], 3.4, 4.2, 0.6), 'steel');
  b.add('root', capsule([0, -4.8, 0], [0, 5.8, 0], 1.2), 'steel');
  b.autoShade({ up: 0.4, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** a stone spike out of the ground (16 vox/m): a jagged pyramid, base at the origin */
function buildSpike(): VoxelModel {
  const b = new ModelBuilder('gremmy-spike', 16);
  b.mat('stone', ['#B0A898', '#9A9182', '#8A8178', '#736B62', '#5E5750'], { base: 2, rough: 0.9, dither: 0.1 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', spike([0, 0, 0], [0.05, 1, 0.02], SPIKE_H * 16, 5.2, 4.6, { side: [1, 0, 0], tip: 0.6 }), 'stone', { thr: 0.2 });
  b.add('root', spike([2, 0, 1], [0.35, 1, 0.1], SPIKE_H * 9, 2.6, 2.2, { side: [0, 0, 1], tip: 0.6 }), 'stone', { thr: 0.2 });
  b.add('root', spike([-2, 0, -1], [-0.3, 1, -0.2], SPIKE_H * 7, 2.4, 2, { side: [0, 0, 1], tip: 0.6 }), 'stone', { thr: 0.2 });
  b.autoShade({ up: 0.5, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** a heavy steel bar (16 vox/m), along ±X */
function buildBar(): VoxelModel {
  const b = new ModelBuilder('gremmy-bar', 16);
  b.mat('steel', STEEL, { base: 2, rough: 0.25, metal: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', box([0, 0, 0], [20, 2, 2], { round: 0.8 }), 'steel');
  for (const k of [1, -1]) b.add('root', box([k * 20, 0, 0], [1.2, 2.8, 2.8], { round: 0.6 }), 'steel', { shade: 3 });
  b.autoShade({ up: 0.5, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** a stone block (16 vox/m), cracked, its corners knocked off */
function buildBlock(): VoxelModel {
  const b = new ModelBuilder('gremmy-block', 16);
  b.mat('stone', ['#B0A898', '#9A9182', '#8A8178', '#736B62', '#5E5750'], { base: 2, rough: 0.9, dither: 0.1 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', box([0, 0, 0], [12, 12, 12], { round: 2.5 }), 'stone');
  b.paint('root', fn((x, y, z) => Math.abs(x * 0.7 + y * 0.4 - z * 0.2) - 0.5, [-14, -14, -14], [14, 14, 14]), 'stone', { shade: 4 });
  b.autoShade({ up: 0.5, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** a stone column (16 vox/m) along +Z from the origin, its end square-cut */
function buildColumn(): VoxelModel {
  const b = new ModelBuilder('gremmy-column', 16);
  b.mat('stone', ['#B0A898', '#9A9182', '#8A8178', '#736B62', '#5E5750'], { base: 2, rough: 0.9, dither: 0.1 });
  b.bone('root', null, [0, 0, 0]);
  const L = COLUMN_LEN * 16;
  b.add('root', box([0, 0, L / 2], [7, 7, L / 2], { round: 1.6 }), 'stone');
  for (let z = 10; z < L; z += 18) b.paint('root', box([0, 0, z], [8, 8, 0.6]), 'stone', { shade: 4 });
  b.autoShade({ up: 0.5, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** the giant stone hand (8 vox/m): the palm down (−Y), fingers splayed along +Z, the wrist at the origin */
function buildHand(): VoxelModel {
  const b = new ModelBuilder('gremmy-hand', 8);
  b.mat('stone', ['#B0A898', '#9A9182', '#8A8178', '#736B62', '#5E5750'], { base: 2, rough: 0.9, dither: 0.1 });
  b.bone('root', null, [0, 0, 0]);
  const u = HAND_LEN * 8 / 7.5;
  // the palm and the wrist
  b.add('root', box([0, 0, u * 2.6], [u * 1.9, u * 0.55, u * 2.0], { round: u * 0.5 }), 'stone');
  b.add('root', capsule([0, 0.2, -u * 0.4], [0, 0, u * 1.2], u * 1.25, u * 1.4), 'stone');
  // four splayed fingers and the thumb
  const fingers: [number, number, number][] = [[-1.45, 3.1, -0.2], [-0.5, 3.5, -0.06], [0.5, 3.4, 0.06], [1.42, 2.8, 0.22]];
  for (const [x, len, spread] of fingers) {
    const root: V3 = [x * u, 0, u * 4.2];
    const tip: V3 = [x * u + spread * len * u, -u * 0.3, u * (4.2 + len)];
    b.add('root', capsule(root, tip, u * 0.48, u * 0.38), 'stone');
  }
  b.add('root', capsule([-u * 1.7, 0, u * 1.6], [-u * 3.4, -u * 0.2, u * 3.0], u * 0.55, u * 0.42), 'stone');
  b.paint('root', fn((x, _y, z) => Math.abs(z - u * 4.2) - 0.6 + (Math.abs(x) > u * 2 ? 9 : 0), [-u * 4, -u, -u], [u * 4, u, u * 9]), 'stone', { shade: 4 });
  b.autoShade({ up: 0.5, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** the meteor (2 vox/m): a lumpy rock, glowing cracks of heat over the leading face */
function buildMeteor(): VoxelModel {
  const b = new ModelBuilder('gremmy-meteor', 2);
  b.mat('rock', ['#8A7E70', '#6E6458', '#5A5148', '#463F38', '#332E29'], { base: 2, rough: 0.95, dither: 0.1 });
  b.mat('heat', ['#FFD27A', '#FF8A2A', '#E04A12'], { base: 1, glow: 1.2, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  const R = METEOR_R * 2;
  b.add('root', blend(2, sphere([0, 0, 0], R), sphere([R * 0.45, R * 0.3, -R * 0.2], R * 0.7), sphere([-R * 0.4, -R * 0.2, R * 0.3], R * 0.65)), 'rock');
  b.paint('root', fn((x, y, z) => Math.max(Math.abs(Math.sin(x * 0.7) + Math.sin(z * 0.6 + x * 0.3)) - 0.25, y + R * 0.2), [-R * 2, -R * 2, -R * 2], [R * 2, R * 2, R * 2]), 'heat');
  b.autoShade({ up: 0.4, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** an assault rifle (48 vox/m): the grip at the origin, the barrel along +Z */
function buildRifle(): VoxelModel {
  const b = new ModelBuilder('gremmy-rifle', 48);
  b.mat('gun', ['#4A4A52', '#3A3A42', '#2C2C33', '#202026'], { base: 1, rough: 0.4, metal: 0.6 });
  b.mat('wood', ['#7A5A3C', '#64482E', '#4E3822'], { base: 1, rough: 0.7 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', box([0, 2.4, 6], [1.3, 1.8, 9]), 'gun');
  b.add('root', cylinder([0, 2.8, 14], [0, 2.8, RIFLE_MUZZLE * 48], 0.8), 'gun');
  b.add('root', box([0, -1, 0], [1.1, 3, 1.4], { rot: [-14, 0, 0] }), 'gun');
  b.add('root', box([0, 0.6, 8.2], [1.0, 3.6, 1.4], { rot: [10, 0, 0] }), 'gun');
  b.add('root', box([0, 2.0, -6.5], [1.2, 2.0, 4.4], { round: 0.6 }), 'wood');
  b.autoShade({ up: 0.5, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** a missile (24 vox/m): the nose along +Z, four fins */
function buildMissile(): VoxelModel {
  const b = new ModelBuilder('gremmy-missile', 24);
  b.mat('body', ['#E0E2E6', '#C4C8CE', '#A4AAB2'], { base: 1, rough: 0.4, metal: 0.4 });
  b.mat('nose', ['#D24A3A', '#B03428', '#8A2418'], { base: 1, rough: 0.4 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', capsule([0, 0, -8], [0, 0, 6], 1.6), 'body');
  b.add('root', spike([0, 0, 6], [0, 0, 1], 4, 1.6, 1.4, { tip: 0.4 }), 'nose', { thr: 0.2 });
  for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) b.add('root', box([x * 2.2, y * 2.2, -8], [x ? 1.4 : 0.4, y ? 1.4 : 0.4, 2]), 'body', { shade: 2 });
  b.autoShade({ up: 0.5, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** the bomb on a clone's chest (48 vox/m): a black sphere, a fuse */
function buildBomb(): VoxelModel {
  const b = new ModelBuilder('gremmy-bomb', 48);
  b.mat('bomb', ['#4A4A55', '#33333C', '#24242B'], { base: 1, rough: 0.3, metal: 0.3 });
  b.mat('fuse', ['#D9C08A', '#B89C64'], { base: 0 });
  b.mat('spark', ['#FFE9A0', '#FFB23A'], { base: 0, glow: 1.4, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', sphere([0, 0, 0], 4.2), 'bomb');
  b.add('root', cylinder([0, 3.6, 0], [0, 5.4, 0], 1.4), 'bomb', { shade: 2 });
  b.add('root', capsule([0, 5.2, 0], [1.2, 7.2, 0.4], 0.5), 'fuse', { thr: 0.2 });
  b.add('root', sphere([1.3, 7.6, 0.4], 0.9), 'spark');
  b.autoShade({ up: 0.5, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** the bladed dome (16 vox/m): triangular steel plates in a hemisphere, blades sprouting between them; rim on y = 0 */
function buildDome(): VoxelModel {
  const b = new ModelBuilder('gremmy-dome', 16);
  b.mat('steel', STEEL, { base: 2, rough: 0.25, metal: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  const R = DOME_R * 16;
  b.add('root', fn((x, y, z) => Math.max(Math.abs(Math.hypot(x, y, z) - R) - 0.9, -y), [-R - 2, -1, -R - 2], [R + 2, R + 2, R + 2]), 'steel', { thr: 0.2 });
  // the seams between the plates
  b.paint('root', fn((x, y, z) => {
    const a = Math.atan2(z, x) * 6 / Math.PI;
    const e = Math.asin(Math.min(1, Math.max(-1, y / R))) * 6 / Math.PI;
    return Math.min(Math.abs(a - Math.round(a)), Math.abs(e - Math.round(e))) * 4 - 0.25;
  }, [-R - 2, -1, -R - 2], [R + 2, R + 2, R + 2]), 'steel', { shade: 4 });
  // blades between the plates
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    for (const el of [0.35, 0.95]) {
      const n: V3 = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)];
      b.add('root', spike([n[0] * (R - 0.5), n[1] * (R - 0.5), n[2] * (R - 0.5)], n, 8, 2.4, 1.2, { side: [Math.cos(a + 1.57), 0, Math.sin(a + 1.57)], tip: 0.5 }), 'steel', { thr: 0.3, shade: 0 });
    }
  }
  b.add('root', torus([0, 0.5, 0], R, 1.2), 'steel', { shade: 3 });
  b.autoShade({ up: 0.5, open: 1, front: 0 });
  b.lint();
  return b.build();
}
