// Coyote Starrk — Primera Espada, Solitude (docs/roster/E1-espada-1.md). 1.87 m, lean and long-limbed, a
// tired slouch. Sealed: wavy dark-brown hair to the nape parted in the middle, a faded goatee, half-lidded
// blue-grey eyes; the Arrancar jacket outlined in black with its collar turned up, open at the throat on
// the bone jaw lying round his neck (fangs up) and the Hollow hole on his sternum just under it; a wide
// black matador sash; white gloves (the left one hides the "1"); white hakama, black boots; the katana with
// the gold sheath at his left hip. Los Lobos: Lilynette's bone eyepiece over his left eye with its flame
// running back along the band, two fine chains round the right; a grey fur-collared jacket over a
// double-breasted vest, ribbon bandoleers from his back over the shoulders into grey fur armbands, dark
// tight trousers, grey fur leggings to the knee; a pistol in each hand.
// Also here: Lilynette (his other half, at his side while he is sealed) and one of the pack's spirit wolves.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, hakama, hands, head, humanoidSkeleton, spikeHair, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const STARRK_RES = 90 / 1.87;
/** 'sealed', 'glove' (the left glove off: the 1 on the back of his hand), 'lobos' (Los Lobos) */
export type StarrkForm = 'sealed' | 'glove' | 'lobos';

const SPEC: HumanoidSpec = {
  H: 90,
  chinY: 78,
  head: { w: 10, d: 11, h: 12 },
  neckR: 2.6,
  shoulder: [9.6, 72, -0.5],
  upperArm: 15.8,
  foreArm: 14,
  hand: 9.4,
  armR: 2.5,
  hipsY: 48.5,
  hip: [4.6, 45.5, 0],
  kneeY: 25,
  ankleY: 4.6,
  chest: [8.4, 4.9],
  waist: [6.8, 4.3],
  hips: [7.2, 4.6],
  chestY: 66,
  waistY: 55.5,
  foot: { len: 12.5, w: 5, heel: 3 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F2D6BC', '#E8C6A6', '#D9B392', '#C99F80', '#A88064'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#5A4232', '#4A3628', '#3A2A1F', '#2E2119', '#221812'], { base: 2, rough: 0.5, shadeK: 0.85, dither: 0.05 });
  b.mat('goatee', ['#5A4434']);
  b.mat('brow', ['#2E2119']);
  b.mat('lid', ['#3A2C26']);
  b.mat('sclera', ['#E8E6E0']);
  b.mat('iris', ['#6F8597']);
  b.mat('irisD', ['#3A4654']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#7E5446']);
  b.mat('white', ['#F7F6F2', '#F3F2EE', '#E2E3E3', '#C9CCD0', '#A9AEB6'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('trim', ['#2A2A2E', '#161616', '#0E0E10'], { base: 1, rough: 0.8 });
  b.mat('sash', ['#2C2C32', '#17171B', '#0E0E11'], { base: 1, rough: 0.8 });
  b.mat('glove', ['#FAF9F6', '#F6F5F1', '#E2E1DC', '#C8C7C1'], { base: 1, rough: 0.7 });
  b.mat('boot', ['#2E2E35', '#1A1A1A', '#0E0E10'], { base: 1, rough: 0.45, metal: 0.1 });
  b.mat('line', ['#ECECEC'], { rough: 0.6 });
  b.mat('bone', ['#F6F2E8', '#ECE6D8', '#DAD3C2', '#C2BAA6', '#A39B87'], { base: 1, rough: 0.42, shadeK: 1 });
  b.mat('fang', ['#F8F5EC'], { rough: 0.35 });
  b.mat('void', ['#060609'], { rough: 1 });
  b.mat('ink', ['#1A1A1E']);
  // Los Lobos
  b.mat('fur', ['#9A9DA3', '#86898F', '#74777D', '#62656B', '#505359'], { base: 1, rough: 0.95, shadeK: 0.9, dither: 0.03 });
  b.mat('furL', ['#D6D8DC', '#C2C4C8', '#ADAFB3', '#97999D'], { base: 1, rough: 0.95, dither: 0.03 });
  b.mat('vest', ['#F0EFEA', '#E7E6E1', '#D2D1CC', '#B8B7B2'], { base: 1, rough: 0.8 });
  b.mat('button', ['#2B2B2B']);
  b.mat('pants', ['#3A3B44', '#2C2D35', '#22232A', '#1A1B20'], { base: 2, rough: 0.7 });
  b.mat('ribbon', ['#F2EFE6', '#ECE8DD', '#D8D3C6'], { base: 1, rough: 0.8 });
  b.mat('cart', ['#D4D8DC', '#B6BAC0', '#9EA2A8'], { base: 1, rough: 0.3, metal: 0.8 });
  b.mat('flame', ['#C23A3E', '#A3262A', '#7E1A1E'], { base: 1, rough: 0.5 });
  b.mat('chain', ['#C4C8CE', '#B4B8BE', '#8E9298'], { base: 1, rough: 0.25, metal: 0.85 });
}

/** Heavy, sleepy lids over blue-grey eyes; a lazy mouth a little off centre; the faded goatee. Rows 9 → 0. */
const FACE = [
  '. B B . . . . B B .',
  '. . . . . . . . . .',
  '. L L L . . L L L .',
  '. W I i . . i I W .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. . . m m m . . . .',
  '. . . g g g g . . .',
];

const assetCache = new Map<string, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function starrkAsset(form: StarrkForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildStarrk(form)));
  return a;
}

export type StarrkProp = 'katana' | 'sheath' | 'sheath-empty' | 'gunR' | 'gunL' | 'colmillo' | 'wolf' | 'lilyBlade';

export function starrkProp(kind: StarrkProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'katana' ? buildKatana(false) : kind === 'colmillo' ? buildKatana(true) : kind === 'sheath' ? buildSheath(true) : kind === 'sheath-empty' ? buildSheath(false)
      : kind === 'wolf' ? buildWolf() : kind === 'lilyBlade' ? buildLilyBlade() : buildPistol(kind === 'gunR');
    propCache.set(kind, m);
  }
  return m;
}

/** blade points (prop frame, m) */
export const KATANA_TIP_Z = 0.82;
export const LILY_BLADE_TIP_Z = 0.58;
/** the pistols' muzzles (prop frame, m): the barrel runs along −Y from above the fist */
export const MUZZLE_R: V3 = [0, -0.34, 0.075];
export const MUZZLE_L: V3 = [0, -0.3, 0.07];

export function buildStarrk(form: StarrkForm = 'sealed'): CharacterAsset {
  const b = new ModelBuilder(`starrk-${form}`, STARRK_RES);
  palette(b);
  const s = SPEC;
  const lobos = form === 'lobos';
  const L = humanoidSkeleton(b, s, { hakama: !lobos });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('hip.L', 'hips', [9.6, s.waistY - 6, 3.4], [-28, 180, -8]);
  b.socket('chest.front', 'chest', [0, s.chestY + 2, 7]);
  b.socket('back', 'chest', [0, s.chestY + 2, -7]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('chin', 'head', [0, s.chinY + 0.5, hd.front + 0.5]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), g: { mat: 'goatee' } }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd);
  const torso = body(b, L);
  // the Hollow hole on the sternum, under the jaw's point
  const hy = s.chestY + 0.5;
  b.socket('hole', 'chest', [0, hy, 6]);
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [
    { bone: 'thigh.L', offset: [0, -0.1, 0.02], radius: 0.12 },
    { bone: 'thigh.R', offset: [0, -0.1, 0.02], radius: 0.12 },
    { bone: 'shin.L', offset: [0, -0.15, 0], radius: 0.07 },
    { bone: 'shin.R', offset: [0, -0.15, 0], radius: 0.07 },
  ];
  if (lobos) {
    hands(b, L, 'skin');
    losLobos(b, L, torso, hd);
  } else {
    hands(b, L, 'glove');
    if (form === 'glove') bareLeftHand(b, L);
    jawCollar(b, L);
    sealedJacket(b, L, torso, springs);
    const o = { black: 'white', collar: 'white', skin: 'skin', obi: 'sash', hemR: 8.6, hakamaHem: 3 };
    hakama(b, L, o);
    sash(b, L, torso);
    boots(b, L);
    for (const side of ['L', 'R']) springs.push({ bone: `hakama.${side}`, tail: [0, -0.46, 0], stiffness: 70, damping: 6, gravity: 8, limit: 55, radius: 0.12 });
  }
  b.carve('chest', cylinder([0, hy, -2.5], [0, hy, 14], 2.1));
  b.paint('chest', cylinder([0, hy, -3.5], [0, hy, 14], 3), 'void', { where: b.isMat('skin') });
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/** Wavy, unkempt dark-brown hair parted in the middle, falling to the nape and over the ears. */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const locks: Spike[] = [];
  // waves rolling down the sides and the back, uneven lengths
  const azs = [-70, -95, -120, -145, -168, 168, 145, 120, 95, 70];
  azs.forEach((az, i) => {
    const len = 4 + ((i * 29) % 5) * 0.6;
    locks.push({ az, el: 4 - (i % 3) * 5, len, r: 2.6, flat: 0.5, flow: [Math.sign(az) * 0.15, -1.5, Math.abs(az) > 140 ? -0.3 : 0], bend: [Math.sign(az) * 0.15 * ((i % 2) ? 1 : -1), 0, 0], taper: 1 });
  });
  // the crown, parted down the middle
  locks.push({ az: -30, el: 55, len: 2, r: 4, flat: 0.5, flow: [-0.6, -0.3, -0.2] });
  locks.push({ az: 30, el: 55, len: 2, r: 4, flat: 0.5, flow: [0.6, -0.3, -0.2] });
  locks.push({ az: 180, el: 45, len: 2.4, r: 4.2, flat: 0.5, flow: [0, -0.8, -0.4] });
  spikeHair(b, L, 'hair', locks, [
    // the fringe falls apart from the parting, to the brows
    { x: -1.6, tipY: c + 10.2, lean: -1.4, r: 1.5 },
    { x: -4.2, tipY: c + 8.4, lean: -0.8, r: 1.5 },
    { x: 1.8, tipY: c + 10, lean: 1.4, r: 1.5 },
    { x: 4.4, tipY: c + 8.6, lean: 0.8, r: 1.5 },
  ], { hairline: c + s.head.h - 1.4, nape: c + 1, slope: 0.6, tufts: 10, tuftFlow: [0, -0.4, -0.4] });
  // keep the eyes clear
  b.carve('head', aabb([-4.6, c + 5, hd.front], [-0.6, c + 10, hd.front + 6]));
  b.carve('head', aabb([0.6, c + 5, hd.front], [4.6, c + 10, hd.front + 6]));
}

// ---------------------------------------------------------------------------------------------- body

function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(3,
    box([0, s.chestY - 0.5, -0.3], [cx, 6, cz], { round: 3.4 }),
    box([0, s.waistY, -0.2], [wx, 4.6, wz], { round: 3 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.6, s.hips[1]], { round: 2.6 }),
    capsule([2.5, sy + 1.6, sz - 0.8], [sx - 1.5, sy - 0.2, sz], 2.9, 3),
    capsule([-2.5, sy + 1.6, sz - 0.8], [-sx + 1.5, sy - 0.2, sz], 2.9, 3),
    sphere([sx, sy - 0.5, sz], 3.2), sphere([-sx, sy - 0.5, sz], 3.2));
  addBands(b, torso, 'skin', [['hips', 30, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 5], ['chest', s.chestY - 5, 100]]);
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 2.6, 2.3)), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], 2.3), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 2.3, 1.8)), 'skin', { mirror: true });
  b.add('thigh.L', blend(1.4, sphere([s.hip[0], s.hip[1], 0], 4), capsule([s.hip[0], s.hip[1], 0], [L.knee[0], L.knee[1] + 1, 0], 3.7, 3)), 'skin', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([L.knee[0], L.knee[1], 0], 3), capsule([L.knee[0], L.knee[1], 0], [L.ankle[0], L.ankle[1], 0], 2.9, 2.1)), 'skin', { mirror: true });
  return torso;
}

/** The left glove off: the bare hand, and the number one on its back. */
function bareLeftHand(b: ModelBuilder, L: Landmarks): void {
  const [wx, wy, wz] = L.wrist;
  for (const bone of ['palm.L', 'fist.L']) b.paint(bone, aabb([wx - 4, wy - 12, wz - 6], [wx + 4, wy + 2, wz + 6]), 'skin', { where: b.isMat('glove') });
  // "1" on the back of the hand (its outside, +X)
  for (const bone of ['palm.L', 'fist.L']) {
    const g = b.grid(bone);
    for (let y = Math.round(wy - 5.5); y <= Math.round(wy - 1.5); y++) {
      const z = Math.round(wz + 0.4);
      for (let x = Math.round(wx + 5); x >= Math.round(wx - 1); x--)
        if (g.get(x, y, z) !== 0) {
          b.voxel(bone, x, y, z, 'ink', 0);
          break;
        }
    }
  }
}

/** The bone jaw round the front of his neck: a lower jaw lying like a collar, its fangs pointing up. */
function jawCollar(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const nz = L.headC[2] - 0.8;
  const y0 = s.chinY - 4.4;
  // the jawbone: a U round the front of the neck, lying on the collarbones, its point dipping to the sternum
  const pts: V3[] = [];
  for (let i = 0; i <= 12; i++) {
    const a = -1.9 + (i / 12) * 3.8;
    const r = 5.2 + Math.cos(a) * 1.1;
    pts.push([Math.sin(a) * r, y0 - Math.cos(a) * 1.9, nz + Math.cos(a) * r]);
  }
  b.add('chest', tube(pts, pts.map((_, i) => 1.3 - Math.abs(i - 6) * 0.04)), 'bone', { thr: 0.25 });
  b.add('chest', spike([0, y0 - 2.2, nz + 6.1], [0, -1, 0.2], 2.2, 1.3, 1.0, { tip: 0.45 }), 'bone', { thr: 0.25 });
  // the fangs along its upper edge
  // (voxel by voxel: at this scale a tooth is one voxel wide, the canines two tall)
  for (let i = 3; i <= 9; i++) {
    const [x, y, z] = pts[i].map(Math.round);
    const top = y + Math.round(1.3);
    b.voxel('chest', x, top, z, 'fang', 0);
    if (i === 4 || i === 8) b.voxel('chest', x, top + 1, z, 'fang', 0);
  }
}

/**
 * The sealed jacket: white, outlined in black, buttoned to the chest and open above on the jaw and the
 * hole, the collar turned up high round the neck; long sleeves; the skirt below the sash on spring panels.
 */
function sealedJacket(b: ModelBuilder, L: Landmarks, torso: Sdf, springs: SpringDef[]): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const opening = intersect(
    prism([[-3.8, 100], [3.8, 100], [3.4, s.chestY + 4], [1.2, s.chestY - 4], [-1.2, s.chestY - 4], [-3.4, s.chestY + 4]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30),
    halfSpace([0, 0, 1.2], [0, 0, -1]),
  );
  const shell = subtract(offset(torso, 1.4), offset(torso, 0.1), opening);
  addBands(b, intersect(shell, aabb([-30, s.waistY - 3, -30], [30, 100, 30])), 'white', [['spine', s.waistY - 3, s.chestY - 5], ['chest', s.chestY - 5, 100]]);
  // black outline down the opening and the front seam
  b.paint(['chest', 'spine'], intersect(offset(opening, 0.9), halfSpace([0, 0, 1.2], [0, 0, -1])), 'trim', { where: b.isMat('white') });
  b.paint(['chest', 'spine'], intersect(box([0, s.waistY + 2, 8], [0.45, 8, 4]), halfSpace([0, 0, 1.2], [0, 0, -1])), 'trim', { where: b.isMat('white') });
  // the collar, turned up and flaring, black inside
  const nz = L.headC[2] - 1.1;
  const collar = fn((x, y, z) => {
    const k = Math.max(0, Math.min(1, (y - (sy - 1)) / 10));
    const r = 4.6 + k * 1.5;
    const rho = Math.hypot(x, (z - nz) * 1.1);
    const top = s.chinY + 5 - Math.max(0, z - nz + 2) * 1.2;
    return Math.max(Math.abs(rho - r) - 0.7, y - top, sy - 2 - y, z - (nz + 2.4));
  }, [-9, sy - 3, -9], [9, s.chinY + 6, 9]);
  b.add('chest', collar, 'white');
  b.paint('chest', fn((x, y, z) => Math.hypot(x, (z - nz) * 1.1) - (4.5 + Math.max(0, Math.min(1, (y - (sy - 1)) / 10)) * 1.5), [-9, sy - 1, -9], [9, s.chinY + 6, 9]), 'trim', { where: b.isMat('white') });
  // long sleeves with black cuffs
  b.add('upperarm.L', blend(1.5, sphere([sx, sy - 0.5, sz], 3.8), cylinder([sx + 0.2, ey - 0.5, sz], [sx, sy - 0.5, sz], 3.4, 3.6, 1.2)), 'white', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 3.4), cylinder([sx, wy + 0.5, sz], [sx, ey + 1, sz], 3.2, 3.3, 1)), 'white', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy, sz], [sx, wy + 1.6, sz], 3.6), 'trim', { mirror: true, where: b.isMat('white') });
  for (const dy of [2, -2]) b.paint('forearm.L', torus([sx, ey + dy, sz], 3.4, 0.5), 'white', { shade: 3, mirror: true });
  // the skirt below the sash, flared over the hakama and open at the front
  const yTop = s.waistY - 4.5, yHem = s.hipsY - 15;
  const skirt = (a0: number, a1: number) => fn((x, y, z) => {
    const k = Math.max(0, Math.min(1, (yTop - y) / (yTop - yHem)));
    const rx = 9.6 + k * 2, rz = 6.6 + k * 1.8;
    const rho = Math.hypot(x / rx, (z + 0.4) / rz);
    const dr = Math.abs(rho - 1) * Math.min(rx, rz) - 0.6;
    const th = Math.atan2(x, z + 0.4);
    const da = th < a0 ? (a0 - th) * 8 : th > a1 ? (th - a1) * 8 : 0;
    return Math.max(dr, da, y - yTop, yHem - y);
  }, [-14, yHem - 1, -11], [14, yTop + 1, 11]);
  b.boneSym('jacket.L', 'hips', [7, yTop, 2]);
  b.bone('jacket.B', 'hips', [0, yTop, -5.5]);
  b.add('jacket.L', skirt(0.5, 1.62), 'white');
  b.add('jacket.R', skirt(-1.62, -0.5), 'white');
  b.add('jacket.B', blend(0.01, skirt(1.6, Math.PI), skirt(-Math.PI, -1.6)), 'white');
  for (const bone of ['jacket.L', 'jacket.R', 'jacket.B']) b.paint(bone, fn((_x, y) => y - (yHem + 1.1), [-14, yHem - 2, -12], [14, yTop + 1, 12]), 'trim', { where: b.isMat('white') });
  for (const [bone, k] of [['jacket.L', 1], ['jacket.R', -1]] as [string, number][]) b.paint(bone, fn((x, y, z) => Math.abs(Math.atan2(x, z + 0.4) - k * 0.5) * 9 - 0.8, [-14, yHem - 1, -11], [14, yTop + 1, 11]), 'trim', { where: b.isMat('white') });
  springs.push({ bone: 'jacket.L', tail: [0.02, -0.22, 0.02], stiffness: 80, damping: 5, gravity: 9, limit: 40, radius: 0.08 });
  springs.push({ bone: 'jacket.R', tail: [-0.02, -0.22, 0.02], stiffness: 80, damping: 5, gravity: 9, limit: 40, radius: 0.08 });
  springs.push({ bone: 'jacket.B', tail: [0, -0.22, -0.03], stiffness: 90, damping: 5, gravity: 9, limit: 35, radius: 0.08 });
}

/** The wide black sash, wrapped matador-style, knotted at his left with two short tails. */
function sash(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const y = s.waistY - 2;
  b.add('spine', intersect(subtract(offset(torso, 2.3), offset(torso, 0.2)), aabb([-30, y - 3.4, -30], [30, y + 2.6, 30])), 'sash');
  b.paint('spine', intersect(offset(torso, 2.4), aabb([-30, y - 0.2, -30], [30, y + 0.2, 30])), 'sash', { shade: 2, where: b.isMat('sash') });
  const kx = s.waist[0] + 2.4;
  b.add('hips', ellipsoid([kx, y - 3, 2], [1.4, 1.5, 1.6]), 'sash');
  b.add('hips', capsule([kx + 0.3, y - 4, 2.4], [kx + 0.9, y - 10, 3], 1, 0.8), 'sash', { thr: 0.2 });
  b.add('hips', capsule([kx - 0.2, y - 4, 1.2], [kx + 0.4, y - 8.5, 0.6], 1, 0.8), 'sash', { thr: 0.2 });
}

/** Black boots with a white line round the sole and the ankle. */
function boots(b: ModelBuilder, L: Landmarks): void {
  const [ax, ay, az] = L.ankle;
  b.add('foot.L', capsule([ax, ay + 6, az - 0.4], [ax, ay - 1, az - 0.4], 2.8, 2.7), 'boot', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.2, az + 3.2], [2.8, 2.2, 6.6], { round: 1.6 }), halfSpace([0, 5.2, az + 6.8], [0, 1, 0.6])), 'boot', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 12]), 'line', { mirror: true });
  b.paint('foot.L', capsule([ax - 2.9, 4.4, az + 1], [ax + 2.9, 4.4, az + 1], 0.45), 'line', { mirror: true, where: b.isMat('boot') });
}

// ---------------------------------------------------------------------------------------------- Los Lobos

/**
 * Los Lobos: the fur-collared jacket over the double-breasted vest, the bandoleers from his back over the
 * shoulders into the fur armbands, dark tight trousers and fur leggings, and Lilynette's eyepiece.
 */
function losLobos(b: ModelBuilder, L: Landmarks, torso: Sdf, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const front = halfSpace([0, 0, 1.2], [0, 0, -1]);
  // the vest: close over the torso, buttoned double down the front, open at the throat on the hole
  const vest = subtract(offset(torso, 1.0), offset(torso, -0.2), intersect(prism([[-2.6, 100], [2.6, 100], [1.6, s.chestY - 1], [-1.6, s.chestY - 1]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30), front));
  addBands(b, intersect(vest, aabb([-30, s.hipsY - 3, -30], [30, s.chinY - 3, 30])), 'vest', [['hips', s.hipsY - 3, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 5], ['chest', s.chestY - 5, 100]]);
  for (const k of [-1, 1])
    for (let i = 0; i < 4; i++) {
      const y = s.chestY - 3 - i * 4;
      for (const bone of ['chest', 'spine', 'hips']) b.paint(bone, intersect(sphere([k * 2.6, y, 8], 1.1), front), 'button', { where: b.isMat('vest') });
    }
  // the jacket: grey, short (to the waist), open, short-sleeved, fur round the collar and the hems
  const jacketOpen = intersect(prism([[-5, 100], [5, 100], [5.6, s.waistY - 6], [-5.6, s.waistY - 6]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30), front);
  const coat = subtract(offset(torso, 2.4), offset(torso, 1.0), jacketOpen);
  addBands(b, intersect(coat, aabb([-30, s.waistY - 4, -30], [30, s.chinY - 3, 30])), 'fur', [['spine', s.waistY - 4, s.chestY - 5], ['chest', s.chestY - 5, 100]]);
  // the fur: a thick collar, and trim down the opening and round the hem
  const nz = L.headC[2] - 1;
  b.add('chest', blend(1.2, torus([0, sy + 1.2, nz], 5.4, 2.2), ellipsoid([0, sy - 1, nz - 2.5], [7.5, 2.6, 3])), 'furL');
  b.paint(['chest', 'spine'], intersect(offset(jacketOpen, 1.3), front), 'furL', { where: b.isMat('fur') });
  b.paint(['spine'], fn((_x, y) => y - (s.waistY - 2.4), [-30, s.waistY - 6, -30], [30, s.waistY, 30]), 'furL', { where: b.isMat('fur') });
  // short sleeves, fur-cuffed above the elbow
  b.add('upperarm.L', blend(1.5, sphere([sx, sy - 0.5, sz], 4), cylinder([sx + 0.2, ey + 3, sz], [sx, sy - 0.5, sz], 3.6, 3.8, 1.2)), 'fur', { mirror: true });
  b.add('upperarm.L', torus([sx + 0.2, ey + 3.4, sz], 3.6, 1.2), 'furL', { mirror: true });
  // the fur armbands, elbow to wrist
  b.add('forearm.L', blend(1.2, cylinder([sx, wy + 0.5, sz], [sx, ey - 0.5, sz], 3.2, 3.5, 1.2), sphere([sx, ey - 0.5, sz], 3.4)), 'furL', { mirror: true });
  b.paint('forearm.L', fn((x, y, z) => Math.abs(((y + Math.atan2(z - sz, x - sx) * 1.4) % 2.4 + 2.4) % 2.4 - 1.2) - 0.35, [-20, wy - 2, -8], [20, ey + 2, 8]), 'furL', { shade: 3, mirror: true, where: b.isMat('furL') });
  // the bandoleers: ribbon-wrapped belts of cartridges from the upper back, over each shoulder, into the armbands
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    const P: V3[] = smoothPath([[k * 2.5, s.chestY + 2, -s.chest[1] - 2.2], [k * 6.5, sy + 2.2, -2.8], [k * (sx + 2.2), sy + 1.4, 0.2], [k * (sx + 2.9), sy - 5, 0.8]], 4);
    b.add('chest', tube(P, P.map(() => 1.15)), 'ribbon', { thr: 0.2 });
    const A: V3[] = [[k * (sx + 2.9), sy - 5, sz + 0.8], [k * (sx + 2.6), ey + 1, sz + 0.6]];
    b.add(`upperarm.${side}`, tube(A, [1.15, 1.15]), 'ribbon', { thr: 0.2 });
    // cartridge bands every couple of voxels
    b.paint(['chest', `upperarm.${side}`], fn((x, y, z) => Math.abs((((x * 0.7 + y + z * 0.5) % 2.6) + 2.6) % 2.6 - 1.3) - 0.42, [-20, ey - 2, -10], [20, sy + 6, 8]), 'cart', { where: b.isMat('ribbon') });
  }
  // the trousers, dark and close; the fur leggings knee to ankle; fur over the boots
  const [hx, hy] = s.hip;
  b.add('hips', box([0, s.hipsY - 0.5, -0.3], [s.hips[0] + 0.8, 4.4, s.hips[1] + 0.8], { round: 2.6 }), 'pants');
  b.add('thigh.L', blend(1.4, sphere([hx, hy, 0], 4.4), capsule([hx, hy, 0], [L.knee[0], L.knee[1] + 1, 0], 4.1, 3.4)), 'pants', { mirror: true });
  b.add('shin.L', blend(1.2, cylinder([L.ankle[0], L.ankle[1] - 1, 0], [L.knee[0], L.knee[1] + 1.5, 0], 3.6, 4.2, 1.5), sphere([L.knee[0], L.knee[1] + 0.5, 0], 4)), 'furL', { mirror: true });
  b.add('shin.L', torus([L.knee[0], L.knee[1] + 1.2, 0], 4, 1.3), 'fur', { mirror: true });
  b.paint('shin.L', fn((x, y, z) => Math.abs(((y + Math.atan2(z, x - L.knee[0]) * 1.6) % 2.6 + 2.6) % 2.6 - 1.3) - 0.35, [-20, 0, -8], [20, L.knee[1] + 3, 8]), 'furL', { shade: 3, mirror: true, where: b.isMat('furL') });
  const [ax, ay, az] = L.ankle;
  b.add('foot.L', intersect(box([ax, 2.4, az + 3.2], [3, 2.4, 6.6], { round: 1.8 }), halfSpace([0, 5.4, az + 6.8], [0, 1, 0.6])), 'fur', { mirror: true });
  b.add('foot.L', capsule([ax, ay + 3, az - 0.4], [ax, ay - 1, az - 0.4], 3.2), 'furL', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 12]), 'boot', { mirror: true });
  // Lilynette's eyepiece over the left eye, a band round the head behind, the flame climbing out of it;
  // two fine chains round the right eye
  const c = hd.chin, fz = hd.front;
  b.add('head', intersect(ellipsoid([3, c + 6.2, fz - 0.4], [2.9, 2.8, 1.8]), halfSpace([0, 0, fz - 0.9], [0, 0, -1])), 'bone');
  b.carve('head', ellipsoid([3, c + 6.2, fz + 1.3], [1.2, 0.9, 1]));
  b.paint('head', ellipsoid([3, c + 6.2, fz + 0.6], [1.3, 1.0, 1.2]), 'void', { where: b.isMat('bone') });
  const band = fn((x, y, z) => {
    const r = Math.hypot(x, (z - L.headC[2]) * 0.95);
    return Math.max(Math.abs(r - 6.4) - 0.65, Math.abs(y - (c + 7.4 + Math.max(0, -z) * 0.12)) - 0.75, -x - 1);
  }, [-9, c + 5, -9], [9, c + 10, 9]);
  b.add('head', band, 'bone');
  b.paint('head', fn((x, y, z) => {
    // a flame licking up and back from the eyepiece
    const t = Math.atan2(x, z - L.headC[2]);
    return Math.abs(y - (c + 8.6 + Math.sin(t * 6) * 0.9)) - 0.55 + (t < 0.2 ? 9 : 0);
  }, [-9, c + 5, -9], [9, c + 11, 9]), 'flame', { where: b.isMat('bone') });
  b.paint('head', ellipsoid([4.2, c + 7.6, fz - 0.2], [1.2, 1.3, 1]), 'flame', { where: b.isMat('bone') });
  for (const r of [2.6, 3.2]) b.add('head', torus([-2.8, c + 6.2, fz - 1.1], r, 0.32, [90, 0, 0]), 'chain', { thr: 0.12 });
}

// ---------------------------------------------------------------------------------------------- props

/**
 * The sealed katana (and Colmillo, the reishi sword drawn from the bandoleers: the same shape with a
 * fang-shaped prong hanging from each corner of the guard). Origin at the grip, blade +Z, edge −Y.
 */
function buildKatana(colmillo: boolean): VoxelModel {
  const b = new ModelBuilder(colmillo ? 'colmillo' : 'starrk-katana', 48);
  b.mat('steel', colmillo ? ['#EAF6FF', '#BFE2FF', '#8EC6F6'] : ['#EEF2F5', '#D3D7DB', '#A8AEB5'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6, glow: colmillo ? 0.6 : 0 });
  b.mat('edge', ['#F6FAFF'], { rough: 0.12, metal: 0.8 });
  b.mat('wrap', colmillo ? ['#CFE9FF', '#9FD0FF', '#6DB6FF'] : ['#E8C85A', '#D9B740', '#B8962A'], { base: 1, rough: 0.85, glow: colmillo ? 0.5 : 0 });
  b.mat('ray', ['#F2EDDC']);
  b.mat('pewter', colmillo ? ['#D8EEFF', '#A9D4FA', '#79B4EA'] : ['#A8ABAD', '#8B8E90', '#6A6D70'], { base: 1, rough: 0.35, metal: 0.7, glow: colmillo ? 0.5 : 0 });
  b.mat('brass', ['#D8C27A', '#B9A15A', '#8E7A40'], { base: 1, rough: 0.35, metal: 0.75 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6.4, zEnd = 36, zTip = 39.5;
  const curve = (z: number) => ((z - z0) / (zTip - z0)) ** 2 * 1.6;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const c = curve(z);
    const top = 0.9 + c, bot = -1.0 + c + Math.max(0, z - zEnd) * 0.6;
    return Math.max(Math.abs(x) - 0.55, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.6 + curve(z) + Math.max(0, z - zEnd) * 0.6), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
  // the guard: a pewter rectangle with a nub at each corner (Colmillo: a hanging fang)
  b.add('root', box([0, 0, 5.4], [2.6, 1.9, 0.5], { round: 0.3 }), 'pewter');
  for (const [x, y] of [[-2.4, -1.7], [2.4, -1.7], [-2.4, 1.7], [2.4, 1.7]] as [number, number][]) {
    if (colmillo) b.add('root', spike([x, y, 5.4], [x * 0.2, -1, -0.3], 4.4, 0.7, 0.55, { bend: [0, 0, 0.25], tip: 0.2 }), 'pewter', { thr: 0.2 });
    else b.add('root', sphere([x * 1.1, y * 1.1, 5.4], 0.7), 'pewter');
  }
  // the sun ornament wrapped round the hilt collar
  b.add('root', cylinder([0, 0, 4.0], [0, 0, 4.9], 1.5), 'brass');
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.add('root', spike([Math.cos(a) * 1.3, Math.sin(a) * 1.3, 4.45], [Math.cos(a), Math.sin(a), 0], 1.1, 0.45, 0.35, { tip: 0.15 }), 'brass', { thr: 0.15 });
  }
  b.add('root', box([0, 0, -0.8], [1.1, 1.25, 4.6], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -6], [2, 2, 4]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -5.8], [1.25, 1.4, 0.55], { round: 0.35 }), 'pewter');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The metallic-gold sheath (with the sword in it, the hilt out of the mouth). Origin at the mouth, +Z. */
function buildSheath(withSword: boolean): VoxelModel {
  const b = new ModelBuilder(withSword ? 'starrk-sheath' : 'starrk-sheath-empty', 48);
  b.mat('gold', ['#E8C860', '#C7A23B', '#A4842C', '#7E641E'], { base: 1, rough: 0.3, metal: 0.8, shadeK: 0.8 });
  b.mat('pewter', ['#A8ABAD', '#8B8E90', '#6A6D70'], { base: 1, rough: 0.35, metal: 0.7 });
  b.mat('wrap', ['#E8C85A', '#D9B740', '#B8962A'], { base: 1, rough: 0.85 });
  b.mat('brass', ['#D8C27A', '#B9A15A', '#8E7A40'], { base: 1, rough: 0.35, metal: 0.75 });
  b.bone('root', null, [0, 0, 0]);
  const curve = (z: number) => (z / 35) ** 2 * 1.6;
  b.add('root', fn((x, y, z) => {
    const c = curve(Math.max(0, z));
    return Math.max(Math.hypot(x / 1.05, (y - c) / 1.6) - 1, -z, z - 34.5);
  }, [-2, -3, -1], [2, 5, 36]), 'gold');
  b.add('root', box([0, curve(34), 34.2], [1.2, 1.8, 0.6], { round: 0.4 }), 'pewter');
  if (withSword) {
    b.add('root', box([0, 0, -1], [2.6, 1.9, 0.5], { round: 0.3 }), 'pewter');
    b.add('root', cylinder([0, 0, -2.6], [0, 0, -1.4], 1.5), 'brass');
    b.add('root', box([0, 0, -6.9], [1.1, 1.25, 4.6], { round: 0.5 }), 'wrap');
    b.add('root', box([0, 0, -11.8], [1.25, 1.4, 0.55], { round: 0.35 }), 'pewter');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * One of the Los Lobos pistols (they are Lilynette): an ornamental long-barrelled revolver in silver with
 * dark steel, a bone-white grip. The grip lies in the fist along Z (its top toward +Z); the barrel runs
 * from above the fist along −Y, which is forward along the forearm when the arm is raised.
 */
function buildPistol(heavy: boolean): VoxelModel {
  const b = new ModelBuilder(heavy ? 'los-lobos-r' : 'los-lobos-l', 48);
  b.mat('silver', ['#E6E9EC', '#C8CCD1', '#A8ADB4', '#868B92'], { base: 1, rough: 0.25, metal: 0.85, shadeK: 0.7 });
  b.mat('dark', ['#7A7F86', '#5E636A', '#43474D'], { base: 1, rough: 0.3, metal: 0.8 });
  b.mat('grip', ['#F2EDE2', '#ECE6D8', '#D6CFBE'], { base: 1, rough: 0.5 });
  b.mat('bore', ['#141418']);
  b.bone('root', null, [0, 0, 0]);
  const len = heavy ? 16 : 14;
  // the grip through the fist, flaring a little at the butt
  b.add('root', box([0, 0.6, -0.8], [0.9, 1.1, 3.6], { round: 0.6 }), 'grip');
  b.add('root', ellipsoid([0, 1.1, -4.4], [1.1, 1.4, 0.9]), 'silver');
  // the frame and cylinder above the fist
  b.add('root', box([0, -1.4, 3.6], [1.1, 2.6, 1.2], { round: 0.5 }), 'silver');
  b.add('root', cylinder([0, -2.6, 3.6], [0, -5.2, 3.6], 1.7), 'dark');
  // the long barrel, an ornamental rib along the top, the muzzle open
  b.add('root', cylinder([0, -5, 3.6], [0, -len - 2, 3.6], 1.05, 0.95), 'silver');
  b.add('root', box([0, -len / 2 - 3, 4.6], [0.4, len / 2 - 1, 0.45]), 'dark');
  b.add('root', cylinder([0, -len - 1.4, 3.6], [0, -len - 2.4, 3.6], 1.35), 'dark');
  b.carve('root', cylinder([0, -len - 1.6, 3.6], [0, -len - 3, 3.6], 0.5));
  b.paint('root', cylinder([0, -len - 1, 3.6], [0, -len - 3, 3.6], 0.8), 'bore', { where: b.isMat('dark', 'silver') });
  // hammer and trigger guard
  b.add('root', spike([0, -0.2, 4.4], [0, 0.6, 1], 1.8, 0.5, 0.4, { tip: 0.2 }), 'dark', { thr: 0.15 });
  b.add('root', torus([0, -1.2, 1.9], 1.1, 0.32, [0, 90, 0]), 'dark', { thr: 0.12 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * A spirit wolf of the pack, at 24 vox/m: lean and long, head low, ears back, tail streaming; built along
 * +Z (the snout) with its feet at y = 0. The pack is drawn glowing pale blue over it.
 */
function buildWolf(): VoxelModel {
  const b = new ModelBuilder('lobos-wolf', 24);
  b.mat('spirit', ['#F0F8FF', '#CFE9FF', '#A9D6FF', '#7FBDF5', '#4FA3FF'], { base: 1, rough: 0.6, glow: 0.55, shadeK: 0.8 });
  b.mat('eye', ['#FFFFFF'], { glow: 1.6 });
  b.bone('root', null, [0, 0, 0]);
  const body = blend(2,
    ellipsoid([0, 12, 2], [4, 4.6, 9]),
    ellipsoid([0, 12.6, 9.5], [3.6, 4.2, 4]),
    ellipsoid([0, 14.4, 15.5], [2.6, 3, 4]),
    capsule([0, 14, 18], [0, 12.6, 23.5], 1.6, 0.9));
  b.add('root', body, 'spirit');
  for (const k of [1, -1]) {
    b.add('root', spike([k * 1.4, 16.6, 14.6], [k * 0.3, 0.7, -0.6], 3.4, 1.1, 0.6, { tip: 0.2 }), 'spirit', { thr: 0.2 });
    // legs: fore and hind, slender
    b.add('root', capsule([k * 2, 10, 9], [k * 2.2, 0.8, 11], 1.4, 0.9), 'spirit');
    b.add('root', capsule([k * 2.2, 10, -4], [k * 2.4, 5, -6.5], 1.6, 1.1), 'spirit');
    b.add('root', capsule([k * 2.4, 5, -6.5], [k * 2.4, 0.8, -4.8], 1.1, 0.9), 'spirit');
    b.add('root', box([k * 2.4, 0.6, -4.2], [0.9, 0.6, 1.4], { round: 0.4 }), 'spirit');
    b.add('root', box([k * 2.2, 0.6, 11.6], [0.9, 0.6, 1.4], { round: 0.4 }), 'spirit');
    b.voxel('root', k > 0 ? 1 : -2, 15, 18, 'eye', 0);
  }
  // the tail, streaming out behind like a flame
  const tail = smoothPath([[0, 13, -6], [0, 14.5, -11], [0, 13.5, -16], [0, 15.5, -20]], 4);
  b.add('root', tube(tail, tail.map((_, i) => 2 - i * 0.12)), 'spirit', { thr: 0.25 });
  b.autoShade({ up: 0.3, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Lilynette's sword, drawn out of the stump of her snapped horn: a short scimitar whose belly widens
 * toward a clipped point, on a plain katana hilt with an oblong guard. Origin at the grip, blade +Z,
 * edge −Y.
 */
function buildLilyBlade(): VoxelModel {
  const b = new ModelBuilder('lily-blade', 48);
  b.mat('steel', ['#EEF2F5', '#D3D7DB', '#A8AEB5'], { base: 1, rough: 0.22, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('guard', ['#8B8E90', '#6A6D70', '#4E5153'], { base: 1, rough: 0.35, metal: 0.7 });
  b.mat('wrap', ['#3A3A3E', '#2C2C2C', '#1E1E20'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#E8E2D2']);
  b.bone('root', null, [0, 0, 0]);
  const z0 = 1.6, zTip = 28;
  const u = (z: number) => Math.min(1, Math.max(0, (z - z0) / (zTip - z0)));
  const curve = (z: number) => u(z) ** 2 * 1.8;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const c = curve(z), k = u(z);
    const top = 0.8 + c - Math.max(0, z - (zTip - 6)) * 0.55;
    const bot = -(0.9 + 1.5 * k * k) + c + Math.max(0, z - (zTip - 2.5)) * 1.1;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -4, z0 - 1], [2, 4, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-(0.5 + 1.5 * u(z) ** 2) + curve(z)), [-2, -4, 0], [2, 4, zTip + 1]), 'edge');
  b.add('root', ellipsoid([0, -0.1, 0.9], [1.5, 2.3, 0.45]), 'guard');
  b.add('root', box([0, 0, -3.1], [0.85, 1.0, 2.7], { round: 0.45 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.2 + 2.2) % 2.2 - 1.1) - 0.35, [-2, -2, -6], [2, 2, 0]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -6], [1.0, 1.15, 0.45], { round: 0.3 }), 'guard');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

// ---------------------------------------------------------------------------------------------- Lilynette

let lilyCache: CharacterAsset | null = null;
export function lilynetteAsset(): CharacterAsset {
  return (lilyCache ??= buildLilynette());
}

const LILY_SPEC: HumanoidSpec = {
  H: 68,
  chinY: 56,
  head: { w: 10, d: 11, h: 12 },
  neckR: 1.8,
  shoulder: [6.4, 52, -0.5],
  upperArm: 10.4,
  foreArm: 9.6,
  hand: 6.4,
  armR: 1.6,
  hipsY: 33,
  hip: [3.4, 31, 0],
  kneeY: 17,
  ankleY: 3.6,
  chest: [5.4, 3.6],
  waist: [4.4, 3.2],
  hips: [5.2, 3.7],
  chestY: 47,
  waistY: 40,
  foot: { len: 8.5, w: 3.6, heel: 2.2 },
};

/** Lilynette: green hair, one pink eye, the left half of her face under the horned helmet-mask. */
const LILY_FACE = [
  '. . . . . . . . . .',
  '. B B . . . . . . .',
  '. L L L . . . . . .',
  '. W I i . . . . . .',
  '. . i i . . . . . .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

export function buildLilynette(): CharacterAsset {
  const b = new ModelBuilder('lilynette', 48);
  b.mat('skin', ['#F8E2CC', '#F1D3B8', '#E2BEA0', '#CDA688', '#AA866A'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#C4E8AE', '#A6D98C', '#88C46E', '#6CA854', '#528A40'], { base: 1, rough: 0.5, shadeK: 0.85 });
  b.mat('brow', ['#6CA854']);
  b.mat('lid', ['#3A2A2A']);
  b.mat('sclera', ['#F3F1EC']);
  b.mat('iris', ['#F2A7C3']);
  b.mat('irisD', ['#B05A80']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#B0606A']);
  b.mat('bone', ['#F6F2E8', '#ECE6D8', '#DAD3C2', '#C2BAA6'], { base: 1, rough: 0.42 });
  b.mat('flame', ['#C23A3E', '#A3262A']);
  b.mat('white', ['#FAFAF8', '#F4F4F2', '#E2E2E0', '#C8C8C6'], { base: 1, rough: 0.8 });
  b.mat('line', ['#151515']);
  b.mat('fur', ['#D6D8DB', '#BDBFC3', '#A4A6AA'], { base: 1, rough: 0.95, dither: 0.08 });
  b.mat('void', ['#060609']);
  const s = LILY_SPEC;
  const L = humanoidSkeleton(b, s, {});
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  // the stump of the snapped horn: her sword is drawn out of it
  b.socket('horn', 'head', [2.6, hd.chin + 13, -1]);
  b.socket('back', 'chest', [0, s.chestY, -5]);
  b.stamp('head', hd.x0, hd.chin + 9, LILY_FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  spikeHair(b, L, 'hair', [
    { az: 0, el: 60, len: 1.6, r: 4, flat: 0.5, flow: [0, -0.2, -1] },
    { az: -90, el: 10, len: 2.6, r: 3.2, flat: 0.5, flow: [0, -1.2, -0.3] },
    { az: 90, el: 10, len: 2.6, r: 3.2, flat: 0.5, flow: [0, -1.2, -0.3] },
    { az: 180, el: 20, len: 2.4, r: 4, flat: 0.5, flow: [0, -1, -0.3] },
  ], [{ x: -3, tipY: hd.chin + 8.6, lean: -0.5, r: 1.8 }], { tufts: 0, hairline: hd.chin + s.head.h - 2.4, nape: hd.chin + 2, slope: 0.6 });
  // the helmet-mask over the left half of her head: bone, the flame over the eye, two horns (the left one snapped)
  const c = hd.chin, fz = hd.front;
  b.add('head', intersect(ellipsoid([0, c + 7.5, L.headC[2] - 0.5], [6.4, 6.8, 6.6]), halfSpace([0.2, 0, 0], [-1, 0, 0]), halfSpace([0, c + 3.5, 0], [0, -1, 0])), 'bone');
  b.paint('head', intersect(ellipsoid([3, c + 6, fz], [1.9, 2.2, 2]), halfSpace([0, 0, fz - 1], [0, 0, -1])), 'flame', { where: b.isMat('bone') });
  b.add('head', spike([2.6, c + 12.6, -1], [0.2, 1, 0.1], 2.4, 1.2, 1.1, { tip: 0.9 }), 'bone', { thr: 0.2 });
  b.add('head', spike([-2.6, c + 12.4, -1], [-0.3, 1, 0.1], 5.2, 1.2, 1.1, { bend: [0, 0, -0.2], tip: 0.3 }), 'bone', { thr: 0.2 });
  hands(b, L, 'skin');
  // the body, the vest with its high collar, arm-warmers, briefs with the black line, fur-lined boots
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.2,
    box([0, s.chestY - 0.5, -0.3], [s.chest[0], 4.6, s.chest[1]], { round: 2.6 }),
    box([0, s.waistY, -0.2], [s.waist[0], 3.8, s.waist[1]], { round: 2.2 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3, s.hips[1]], { round: 2.2 }),
    capsule([1.8, sy + 1.2, sz - 0.6], [sx - 1.2, sy - 0.2, sz], 1.9, 2), capsule([-1.8, sy + 1.2, sz - 0.6], [-sx + 1.2, sy - 0.2, sz], 1.9, 2));
  addBands(b, torso, 'skin', [['hips', 20, s.waistY - 4], ['spine', s.waistY - 4, s.chestY - 3], ['chest', s.chestY - 3, 80]]);
  b.add('chest', intersect(subtract(offset(torso, 0.9), offset(torso, -0.2)), aabb([-20, s.chestY - 3, -20], [20, s.chinY - 1, 20])), 'white');
  b.add('chest', subtract(cylinder([0, s.chinY - 5, L.headC[2] - 0.6], [0, s.chinY + 0.5, L.headC[2] - 0.6], 3.2), cylinder([0, s.chinY - 6, L.headC[2] - 0.6], [0, s.chinY + 1, L.headC[2] - 0.6], 2.2)), 'white');
  b.add('hips', intersect(subtract(offset(torso, 0.8), offset(torso, -0.2)), aabb([-20, s.hipsY - 3, -20], [20, s.hipsY + 2, 20])), 'white');
  b.paint('hips', box([0, s.hipsY - 2.5, 4], [0.5, 1.6, 3]), 'line', { where: b.isMat('white') });
  // the hole through her stomach
  b.carve(['spine'], cylinder([0, s.waistY + 0.5, -10], [0, s.waistY + 0.5, 10], 1.6));
  b.paint(['spine'], cylinder([0, s.waistY + 0.5, -10], [0, s.waistY + 0.5, 10], 2.4), 'void', { where: b.isMat('skin') });
  const ey = L.elbow[1];
  b.add('upperarm.L', blend(1.1, sphere([sx, sy - 0.5, sz], 2), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 1.8, 1.6)), 'skin', { mirror: true });
  b.add('forearm.L', blend(1, sphere([sx, ey, sz], 1.6), cylinder([sx, wy + 0.5, sz], [sx, ey, sz], 2, 2.2)), 'white', { mirror: true });
  const [hx, hy] = s.hip;
  b.add('thigh.L', blend(1.2, sphere([hx, hy, 0], 2.9), capsule([hx, hy, 0], [L.knee[0], L.knee[1] + 1, 0], 2.7, 2.1)), 'skin', { mirror: true });
  b.add('thigh.L', cylinder([hx, L.knee[1] + 1, 0], [hx, L.knee[1] + 8, 0], 3.2, 3.6), 'white', { mirror: true });
  b.add('thigh.L', torus([hx, L.knee[1] + 8, 0], 3.4, 0.9), 'fur', { mirror: true });
  b.add('shin.L', cylinder([L.ankle[0], 0.5, 0.3], [L.knee[0], L.knee[1] + 1.5, 0], 3, 3.2), 'white', { mirror: true });
  b.add('foot.L', intersect(box([L.ankle[0], 1.8, L.ankle[2] + 2.6], [2.2, 1.8, 4.8], { round: 1.2 }), halfSpace([0, 4, L.ankle[2] + 5.5], [0, 1, 0.6])), 'white', { mirror: true });
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}
