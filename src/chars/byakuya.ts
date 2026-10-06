// Byakuya Kuchiki — Captain of the 6th Division. Construction and palette from docs/roster/B1-captains-1.md
// §6: long straight black hair framing the face, white kenseikan (three on top, two on the right side),
// the Ginpaku Kazahana no Usuginu scarf around the shoulders with long ends on spring bones, black
// shihakushō under a short-sleeved white haori with 六 on the back, white fingerless tekkō, and
// Senbonzakura (bronze window-frame guard, lavender cord, white sheath). 1.80 m: the standard body at
// 46.9 vox/m.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, tube, type Sdf, type V3 } from '../models/sdf';
import {
  SPEC_ADULT_MALE, coatSkirt, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, spikeHair,
  type HumanoidSpec, type Landmarks,
} from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const BYAKUYA_RES = (48 * 84) / 86;

const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [9.3, 66.5, -0.5],
  chest: [8.2, 4.8],
  waist: [6.6, 4.1],
  hips: [7.2, 4.6],
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#FBF0E7', '#F3E1D2', '#E6CFBD', '#D6BDAA', '#BCA08B'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#434A60', '#2F3445', '#22252F', '#17181F', '#0F1015'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.08 });
  b.mat('brow', ['#17181F']);
  b.mat('lid', ['#1B1B22']);
  b.mat('sclera', ['#F3F4F6']);
  b.mat('iris', ['#7A808C']);
  b.mat('irisD', ['#3A3F4A']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#A9786A']);
  b.mat('black', ['#34343C', '#24242A', '#18181D', '#111114'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F3F3F0', '#E4E5E7', '#C9CCD1'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F3F3F0', '#E2E3E5', '#C6C9CE'], { base: 0, rough: 0.8 });
  b.mat('haori', ['#F3F3F0', '#EDECE7', '#DCDDDF', '#C5C8CE', '#A7ADB6'], { base: 1, rough: 0.8, shadeK: 0.9 });
  b.mat('haoriIn', ['#D9DADC', '#C3C6CB', '#AAAFB7'], { base: 1, rough: 0.85 });
  b.mat('kanji', ['#141418'], { rough: 0.9 });
  b.mat('scarf', ['#F1F6F2', '#E1EBE4', '#CCD9D0', '#B4C4B9', '#98AA9E'], { base: 1, rough: 0.55, shadeK: 0.9, dither: 0.05 });
  b.mat('ken', ['#F3F3F0', '#E6E8EB', '#CFD3D8', '#B0B6BE'], { base: 1, rough: 0.35, shadeK: 0.9 });
  b.mat('tekko', ['#F1F2F0', '#DEE1DF', '#C3C8C5'], { base: 0, rough: 0.6 });
  b.mat('tabi', ['#F3F3F0', '#DEDFE1', '#C2C5CA'], { base: 0, rough: 0.8 });
  b.mat('straw', ['#C9A86A', '#A8874F', '#86683A'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
}

/** Calm, cold: straight thin brows, narrow slate eyes, a small closed mouth. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. L W I . . I W L .',
  '. . L i . . i L . .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<string, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function byakuyaAsset(): CharacterAsset {
  let a = assetCache.get('captain');
  if (!a) assetCache.set('captain', (a = buildByakuya()));
  return a;
}

/** 'katana' (sealed, in hand), 'hilt' (Shikai: the blade has scattered), 'sheath', 'giant' (Bankai rows). */
export function byakuyaProp(kind: 'katana' | 'hilt' | 'sheath' | 'giant'): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = kind === 'sheath' ? buildSheath() : kind === 'giant' ? buildGiantBlade() : buildSenbonzakura(kind === 'katana')));
  return m;
}

/**
 * One of the thousand giant blades that rise at the Bankai: a 5 m katana blade at giant scale
 * (16 vox/m) with a curved point, a bright bevelled edge and a faint pink sheen. Origin at the base,
 * blade along +Z, edge toward −Y.
 */
function buildGiantBlade(): VoxelModel {
  const b = new ModelBuilder('kageyoshi-blade', 16);
  b.mat('steel', ['#E9EEF4', '#CFD6DE', '#AEB6C1', '#8C95A2'], { base: 1, rough: 0.18, metal: 0.85, shadeK: 0.7 });
  b.mat('edge', ['#F3F3F0', '#E4E8EE'], { base: 0, rough: 0.1, metal: 0.8 });
  b.mat('hamon', ['#F6E3EC', '#E9CAD8'], { base: 0, rough: 0.15, metal: 0.6 });
  b.bone('root', null, [0, 0, 0]);
  const L = 84, tip = 8;
  const curve = (z: number) => (z / L) ** 2 * 5;
  const blade = fn((x, y, z) => {
    if (z < -0.5 || z > L + 0.5) return 1;
    const c = curve(z);
    // the point: the edge line sweeps up to meet the back in the last `tip` voxels
    const top = 4 + c, bot = -4 + c + Math.max(0, z - (L - tip)) * (8 / tip);
    const thick = 1.4 * Math.max(0.35, (y - bot) / Math.max(1, top - bot));
    return Math.max(Math.abs(x) - thick, y - top, bot - y, -z, z - L);
  }, [-3, -6, -1], [3, 12, L + 1]);
  b.add('root', blade, 'steel', { thr: 0.3 });
  // edge bevel and a wavy temper line
  b.paint('root', fn((x, y, z) => y - (-2.6 + curve(z) + Math.max(0, z - (L - tip)) * (8 / tip)), [-3, -6, -1], [3, 12, L + 1]), 'hamon');
  b.paint('root', fn((x, y, z) => y - (-1.6 + curve(z) + Math.sin(z * 0.45) * 0.6 + Math.max(0, z - (L - tip)) * (8 / tip)), [-3, -6, -1], [3, 12, L + 1]), 'hamon', { where: b.isMat('steel') });
  b.paint('root', fn((x, y, z) => y - (-3.3 + curve(z) + Math.max(0, z - (L - tip)) * (8 / tip)), [-3, -6, -1], [3, 12, L + 1]), 'edge');
  b.autoShade({ up: 0.3, open: 2, front: 0 });
  b.lint();
  return b.build();
}

export function buildByakuya(): CharacterAsset {
  const b = new ModelBuilder('byakuya', BYAKUYA_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0] + 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0] - 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('finger.R', 'palm.R', [-L.wrist[0] + 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('finger.L', 'palm.L', [L.wrist[0] - 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('hip.L', 'hips', [9.4, 46.5, 3.4], [-26, 180, -8]);
  b.socket('back', 'chest', [0, 60, -8]);
  b.socket('chest.front', 'chest', [0, 61, 7]);

  const hd = head(b, L, 'skin');
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd);
  kenseikan(b, hd);
  hands(b, L, 'skin');
  // tekkō: white fingerless guards over the backs of the hands
  for (const bone of ['palm.L', 'fist.L']) b.paint(bone, aabb([L.wrist[0] + 0.4, L.wrist[1] - 6.5, L.wrist[2] - 4], [L.wrist[0] + 4, L.wrist[1] + 1.5, L.wrist[2] + 5]), 'tekko', { mirror: true, where: b.isMat('skin') });
  feet(b, L, 'tabi', 'straw', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi' };
  const torso = kosodeTorso(b, L, o);
  kosodeSleeves(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  const haoriSprings = haori(b, L, torso);
  const scarfSprings = scarf(b, L);
  b.autoShade();
  b.lint();
  const base = shihakushoSprings();
  return {
    model: b.build(),
    springs: [...base.springs, ...haoriSprings.springs, ...scarfSprings],
    colliders: [...base.colliders, ...haoriSprings.colliders, { bone: 'chest', offset: [0, 0.02, -0.01], radius: 0.13 }],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- head

/** Long straight black hair: a smooth cap, locks framing the face down to the collarbones, a lock between the eyes. */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const front = hd.front;
  spikeHair(b, L, 'hair', [
    // smooth crown: long flat locks lying back and down
    { az: 0, el: 66, len: 2.5, r: 4.4, flat: 0.45, flow: [0, -0.2, -1] },
    { az: -60, el: 50, len: 2.5, r: 4.2, flat: 0.45, flow: [0, -0.4, -0.9] },
    { az: 60, el: 50, len: 2.5, r: 4.2, flat: 0.45, flow: [0, -0.4, -0.9] },
    { az: 180, el: 40, len: 3, r: 4.4, flat: 0.5, flow: [0, -0.8, -0.4] },
    { az: -140, el: 30, len: 3, r: 4.2, flat: 0.5, flow: [0, -0.9, -0.3] },
    { az: 140, el: 30, len: 3, r: 4.2, flat: 0.5, flow: [0, -0.9, -0.3] },
  ], [], { tufts: 0, hairline: c + s.head.h - 1, slope: 0.6 });
  // back: a straight curtain to the nape and the shoulder line
  const back = L.headC[2] - s.head.d / 2;
  b.add('head', blend(1.5,
    ellipsoid([0, c + 6.5, back + 1.5], [6.1, 6.8, 4.2]),
    box([0, c + 0.5, back + 0.6], [5.6, 4.2, 2.2], { round: 1.6 })), 'hair');
  // locks framing the face, from the temples down past the jaw to the collarbones
  for (const k of [-1, 1]) {
    const pts = smoothPath([[k * 5.4, c + 11, front - 4], [k * 6.2, c + 7, front - 2.2], [k * 6.1, c + 2, front - 2.4], [k * 5.6, c - 3.5, front - 2.8], [k * 5.2, c - 7, front - 3.4]], 4);
    b.add('head', tube(pts, pts.map((_, i) => 1.9 - i * 0.07)), 'hair', { thr: 0.3 });
  }
  // fringe: locks parting over the forehead and stopping at the brows; one falls between the eyes
  for (const [x, tipY, r] of [[-4.2, c + 8.4, 1.2], [-2.4, c + 8.8, 1.25], [-0.5, c + 4.2, 1.0], [2.2, c + 9, 1.25], [4, c + 8.6, 1.15]] as [number, number, number][]) {
    const top: V3 = [x, c + 11.6, front - 1.2];
    const len = top[1] - tipY;
    b.add('head', spike(top, [x * 0.03, -1, 0.06], len, r, r * 0.55, { side: [1, 0, 0], tip: 0.3 }), 'hair', { thr: 0.3 });
  }
  // strand lines on the curtain
  b.paint('head', fn((x) => Math.abs(((x + 40) % 2.2) - 1.1) - 0.3, [-8, c - 9, back - 4], [8, c + 13, back + 3]), 'hair', { shade: 3, where: b.isMat('hair') });
  // keep the eyes clear
  b.carve('head', aabb([-5, c + 4, front], [-1, c + 7, front + 6]));
  b.carve('head', aabb([1, c + 4, front], [5, c + 7, front + 6]));
}

/** Kenseikan: segmented white clasps holding locks — three on top, two on the right side. */
function kenseikan(b: ModelBuilder, hd: { front: number; chin: number }): void {
  const c = hd.chin;
  const tubeAt = (p0: V3, p1: V3, r: number) => {
    b.add('head', capsule(p0, p1, r), 'ken', { thr: 0.25 });
    // segment rings
    const n = 3;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const q: V3 = [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t];
      b.paint('head', sphere(q, r + 0.4), 'ken', { shade: 3, where: b.isMat('ken') });
    }
  };
  // three on top, raked back, a little toward his right
  tubeAt([-3.2, c + 12.6, -1.2], [-3.6, c + 15.4, -3.6], 0.95);
  tubeAt([-0.8, c + 13, -0.6], [-0.9, c + 16, -3.2], 0.95);
  tubeAt([1.6, c + 12.6, -1.2], [1.9, c + 15.2, -3.6], 0.95);
  // two on the right side, above the ear, lying back
  tubeAt([-6.6, c + 9.6, 1], [-7.2, c + 9.1, -3.4], 0.9);
  tubeAt([-6.6, c + 7.4, 0.6], [-7.1, c + 6.8, -3.6], 0.9);
}

// ---------------------------------------------------------------------------------------------- haori

/** Short-sleeved white haori, open at the front, 六 on the back; the skirt on spring panels. */
function haori(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1];
  const opening = intersect(
    prism([[-2.4, 80], [2.4, 80], [4, 64], [5.4, 52], [6, 40], [-6, 40], [-5.4, 52], [-4, 64]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30),
    halfSpace([0, 0, 1], [0, 0, -1]),
  );
  const shell = subtract(offset(torso, 1.55), offset(torso, 0.25), opening);
  for (const [bone, y0, y1] of [['spine', 46, 56], ['chest', 54, 80]] as [string, number, number][]) b.add(bone, intersect(shell, aabb([-30, y0, -30], [30, y1, 30])), 'haori');
  // the inner face shows at the open edges
  b.paint(['chest', 'spine'], intersect(offset(opening, 1.0), halfSpace([0, 0, 1], [0, 0, -1])), 'haoriIn', { where: b.isMat('haori') });
  // short sleeves: wide, ending above the elbow, over the black kosode sleeves
  b.add('upperarm.L', blend(1.5, sphere([sx, sy - 0.4, sz], 4.6), cylinder([sx + 0.4, ey + 2.5, sz - 0.4], [sx + 0.2, sy - 0.5, sz - 0.2], 5.4, 4.6, 1.2)), 'haori', { mirror: true });
  b.paint('upperarm.L', cylinder([sx + 0.4, ey + 1.5, sz - 0.4], [sx + 0.4, ey + 3.2, sz - 0.4], 6.2), 'haoriIn', { mirror: true, where: b.isMat('haori') });
  // 六 on the back, drawn as seen from behind (viewer's left = the character's left = +X)
  const ROKU = [
    '....X....',
    '.....X...',
    'XXXXXXXXX',
    '.........',
    '...X..X..',
    '..X....X.',
    '.X......X',
    'X.......X',
  ];
  const g = b.grid('chest');
  ROKU.forEach((row, r) => {
    for (let ci = 0; ci < row.length; ci++) {
      if (row[ci] !== 'X') continue;
      const x = 4 - ci, y = s.chestY + 4 - r;
      for (let z = -14; z < 2; z++)
        if (g.get(x, y, z) !== 0) {
          b.voxel('chest', x, y, z, 'kanji', 0);
          break;
        }
    }
  });
  return coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem: 12, r0: 9.6, r1: 12.8, openFront: 16, res: BYAKUYA_RES });
}

/** Ginpaku Kazahana no Usuginu: a soft stole around the shoulders, one long end down the front, one down the back. */
function scarf(b: ModelBuilder, L: Landmarks): SpringDef[] {
  const s = L.spec;
  const R = BYAKUYA_RES;
  const nz = L.headC[2] - 1.2;
  const y0 = s.shoulder[1] + 0.6;
  // the wrap: an elliptical roll around the neck resting on the shoulders
  const wrap = fn((x, y, z) => {
    const rho = Math.hypot(x / 1.15, z - nz);
    return Math.hypot(rho - 5, (y - y0) * 1.1) - 2.1;
  }, [-10, y0 - 4, -9], [10, y0 + 4, 8]);
  b.add('chest', wrap, 'scarf');
  b.paint('chest', fn((x, y, z) => Math.abs(Math.sin(Math.atan2(x, z - nz) * 9 + y * 0.6)) - 0.18, [-10, y0 - 4, -9], [10, y0 + 4, 8]), 'scarf', { shade: 3, where: b.isMat('scarf') });
  // the ends: two-bone spring chains
  const ends: [string, V3, V3, V3][] = [
    // name, root, mid, tip (voxels)
    ['F', [3.6, y0 - 1, 4.6], [4.2, y0 - 22, 6.4], [4.6, y0 - 40, 6.8]],
    ['B', [-5.4, y0 - 1, -5.6], [-6.6, y0 - 22, -8.2], [-7.2, y0 - 44, -9.2]],
  ];
  const springs: SpringDef[] = [];
  for (const [n, a, m, t] of ends) {
    const top = `scarf.${n}`, low = `scarf.${n}.2`;
    b.bone(top, 'chest', a);
    b.bone(low, top, m);
    const band = (p: V3, q: V3, w0: number, w1: number) =>
      fn((x, y, z) => {
        const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2];
        const l2 = dx * dx + dy * dy + dz * dz;
        const u = Math.max(0, Math.min(1, ((x - p[0]) * dx + (y - p[1]) * dy + (z - p[2]) * dz) / l2));
        const cx = p[0] + dx * u, cy = p[1] + dy * u, cz = p[2] + dz * u;
        const w = w0 + (w1 - w0) * u;
        // a flat ribbon: wide across X, thin along Z
        return Math.max(Math.abs(x - cx) - w, Math.abs(z - cz) - 0.8, Math.abs(y - cy) - 0.6);
      }, [Math.min(p[0], q[0]) - 4, Math.min(p[1], q[1]) - 2, Math.min(p[2], q[2]) - 3], [Math.max(p[0], q[0]) + 4, Math.max(p[1], q[1]) + 2, Math.max(p[2], q[2]) + 3]);
    b.add(top, band(a, m, 2.4, 2.8), 'scarf', { thr: 0.3 });
    b.add(low, band(m, t, 2.8, 2.6), 'scarf', { thr: 0.3 });
    // fringe at the end
    for (let i = -2; i <= 2; i++) b.add(low, capsule([t[0] + i * 1.1, t[1], t[2]], [t[0] + i * 1.2, t[1] - 2.4, t[2]], 0.45), 'scarf', { thr: 0.3, shade: 2 });
    b.paint([top, low], fn((x, y) => Math.abs(((y + 60) % 3.4) - 1.7) - 0.25, [-20, t[1] - 4, -20], [20, a[1] + 2, 20]), 'scarf', { shade: 3, where: b.isMat('scarf') });
    springs.push({ bone: top, tail: [(m[0] - a[0]) / R, (m[1] - a[1]) / R, (m[2] - a[2]) / R], stiffness: 45, damping: 4, gravity: 10, limit: 70, radius: 0.06 });
    springs.push({ bone: low, tail: [(t[0] - m[0]) / R, (t[1] - m[1]) / R, (t[2] - m[2]) / R], stiffness: 30, damping: 3.5, gravity: 12, limit: 80, radius: 0.05 });
  }
  return springs;
}

// ---------------------------------------------------------------------------------------------- Senbonzakura

/**
 * Senbonzakura, sealed: a katana with a bronze guard like an open four-pane window frame, bronze
 * fittings, a lavender-corded hilt. Without the blade it is the hilt he keeps in Shikai.
 * Local frame like Zangetsu: origin at the grip centre, blade along +Z, edge toward −Y.
 */
function buildSenbonzakura(withBlade: boolean): VoxelModel {
  const b = new ModelBuilder(withBlade ? 'senbonzakura' : 'senbonzakura-hilt', 48);
  b.mat('steel', ['#EEF2F6', '#D3D8DE', '#A6ADB6'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('bronze', ['#D2A75D', '#A47B3B', '#7A5A28', '#5A421C'], { base: 1, rough: 0.35, metal: 0.75, shadeK: 0.8 });
  b.mat('cord', ['#D3C2E8', '#B9A2D6', '#9580B8'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#F1F1EE']);
  b.bone('root', null, [0, 0, 0]);
  if (withBlade) {
    const z0 = 6.4, zEnd = 44, zTip = 47.5;
    const curve = (z: number) => ((z - z0) / (zTip - z0)) ** 2 * 1.8;
    const blade = fn((x, y, z) => {
      if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
      const c = curve(z);
      const top = 0.85 + c, bot = -1.0 + c + Math.max(0, z - zEnd) * 0.55;
      return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
    }, [-2, -3, z0 - 1], [2, 5, zTip + 1]);
    b.add('root', blade, 'steel', { thr: 0.3 });
    b.paint('root', fn((x, y, z) => y - (-0.6 + curve(z) + Math.max(0, z - zEnd) * 0.55), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
    b.add('root', box([0, -0.05, 6.1], [0.85, 1.25, 0.5]), 'bronze'); // habaki
  }
  // window-frame tsuba: a square frame with a cross dividing it into four panes
  const tz = 5.2;
  const frame = subtract(box([0, 0, tz], [2.9, 2.9, 0.5], { round: 0.4 }), box([0, 0, tz], [2.1, 2.1, 1]));
  b.add('root', frame, 'bronze');
  b.add('root', box([0, 0, tz], [2.3, 0.35, 0.45]), 'bronze');
  b.add('root', box([0, 0, tz], [0.35, 2.3, 0.45]), 'bronze');
  // handle: lavender cord wrap with diamonds, bronze collar and pommel
  b.add('root', box([0, 0, -0.8], [1.1, 1.25, 5.6], { round: 0.5 }), 'cord');
  b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.45, [-2, -2, -6.5], [2, 2, 4.6]), 'ray', { where: b.isMat('cord') });
  b.add('root', box([0, 0, 4.4], [1.2, 1.35, 0.45], { round: 0.3 }), 'bronze');
  b.add('root', box([0, 0, -6.8], [1.25, 1.4, 0.55], { round: 0.35 }), 'bronze');
  // a short cord tassel from the pommel
  b.add('root', capsule([0, -0.5, -7.4], [0, -3.4, -8.6], 0.55, 0.4), 'cord', { thr: 0.3 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** White sheath with bronze fittings. Local frame: origin at the mouth, sheath along +Z. */
function buildSheath(): VoxelModel {
  const b = new ModelBuilder('senbonzakura-sheath', 48);
  b.mat('lacquer', ['#F3F3F0', '#EBEBE6', '#D5D6D3', '#B5B7B6'], { base: 1, rough: 0.28, shadeK: 0.8 });
  b.mat('bronze', ['#D2A75D', '#A47B3B', '#7A5A28'], { base: 1, rough: 0.35, metal: 0.75 });
  b.mat('cord', ['#D3C2E8', '#B9A2D6', '#9580B8'], { base: 1, rough: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  const curve = (z: number) => (z / 42) ** 2 * 1.8;
  b.add('root', fn((x, y, z) => {
    const c = curve(Math.max(0, z));
    return Math.max(Math.hypot(x / 1.0, (y - c) / 1.55) - 1, -z, z - 41.5);
  }, [-2, -3, -1], [2, 5, 43]), 'lacquer');
  b.add('root', box([0, 0, 0.4], [1.3, 1.85, 0.6], { round: 0.3 }), 'bronze');
  b.add('root', box([0, curve(41), 41.2], [1.15, 1.75, 0.6], { round: 0.4 }), 'bronze');
  b.add('root', fn((x, y, z) => Math.hypot(Math.hypot(x, y) - 1.65, z - 5) - 0.45, [-3, -3, 3.5], [3, 3, 6.5]), 'cord');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
