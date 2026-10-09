// Gerard Valkyrie, Sternritter "M" — The Miracle (docs/roster/H1-vandenreich-leaders.md § Gerard Valkyrie; kit
// docs/kits/gerard.md). Brief: 222 cm → 107 vox at 48/m (head 15, ≈ 1/7); very tall, very broad, heavily muscled.
// Silhouette keys: the winged steel helmet with its face mask, the great round shield on the left forearm, the red
// cape pinned at both shoulders, the white X of the belt over black trousers, the sheer bulk of the shoulders.
// Look: a white tunic closed with three buttons, a dark-red Hagal rune on the left breast, a stand collar; steel
// gauntlets from the elbows; white shin guards with discs on the kneecaps; black boots.
// Forms: 'helm' (battle gear: the helmet on), 'bare' (the helmet knocked off — light blond hair to the shoulders, a thin
// black braid circling the scalp, blank glowing eyes, red sideways-M marks on both cheeks: his giant body too),
// 'asch' (Aschtonig: bare, thick gold patterns over the arms and legs; the Norse reishi helm rides 'helm.socket' as a
// prop), 'knight' (Enhanced Aschtonig: a golden body re-formed out of light, a knight's-helm face with a vertical plume,
// two great spikes on the shoulders, energy veins), 'bones' (the Auswählen's leavings: a skeleton). `marked` adds the red
// lines of a regrown arm. Props at 48 vox/m: 'hoffnung' (the black double-edged sword, its V-guard and silver star;
// 'hoffnung-gold' in Aschtonig), 'shield' (bronze and silver, round; 'shield-asch' with the gold star over its rim),
// 'bow' (Heilig Bogen), 'helm-asch' (the Norse reishi helm), 'wings' (Heiligen Fliegen).
// (verify) how much of the face the mask leaves bare (here the mouth and jaw); the braid's path.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import { badge, frontOf, longCape } from './sternritter';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const GERARD_RES = 48;
export type GerardForm = 'helm' | 'bare' | 'asch' | 'knight' | 'bones';

/** 222 cm: a giant of a man, the shoulders a yard across. */
const SPEC: HumanoidSpec = {
  H: 107,
  chinY: 92,
  head: { w: 12, d: 13, h: 15 },
  neckR: 4.4,
  shoulder: [16.2, 85.5, -0.5],
  upperArm: 18.5,
  foreArm: 17,
  hand: 11,
  armR: 4.6,
  hipsY: 55,
  hip: [6.4, 52, 0],
  kneeY: 29,
  ankleY: 5.5,
  chest: [12.2, 9.4],
  waist: [10.4, 8],
  hips: [10.6, 8.2],
  chestY: 77,
  waistY: 64,
  foot: { len: 16, w: 7.4, heel: 4 },
};

function palette(b: ModelBuilder, form: GerardForm, marked: boolean): void {
  b.mat('skin', ['#F0D2B4', '#E6C3A2', '#D3AD8B', '#B98F6E', '#9A7457'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#F3E6B4', '#F2E2A6', '#E2CD8A', '#CDB66E', '#AE9752'], { base: 1, rough: 0.45, shadeK: 0.85, dither: 0.04 });
  b.mat('braid', ['#34343C', '#26262D', '#1A1A20'], { base: 1, rough: 0.6 });
  b.mat('brow', ['#BFA45C']);
  b.mat('lid', ['#9A7457']);
  b.mat('eye', ['#E7EEF5'], { glow: form === 'helm' ? 0.35 : 0.45 });
  b.mat('mark', ['#B71C27']);
  b.mat('mouth', ['#6E322C']);
  b.mat('teeth', ['#EDEBE4']);
  b.mat('steel', ['#DCE0E6', '#BCC2CA', '#9EA5AF', '#7F8792', '#646B75'], { base: 1, rough: 0.3, metal: 0.85, shadeK: 0.75 });
  b.mat('slit', ['#1E1F25']);
  b.mat('wingw', ['#F3F2EE', '#E6E5DF', '#CFCEC7', '#B4B3AC'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('cloak', ['#F1F0EB', '#E4E3DD', '#CDCCC6', '#B2B1AB', '#95948F'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('cloakIn', ['#D6D5D0', '#BDBCB6', '#A2A19B'], { base: 1, rough: 0.8 });
  b.mat('rune', ['#7A1520', '#6D111A', '#560B11'], { base: 1, rough: 0.6 });
  b.mat('cape', ['#C8303A', '#A3161F', '#8A121A', '#6E0F16', '#560B11'], { base: 1, rough: 0.8, shadeK: 0.9 });
  b.mat('capeIn', ['#7E1219', '#620E14', '#4C0A0F'], { base: 1, rough: 0.85 });
  b.mat('gaunt', ['#B9BFC8', '#9097A1', '#7A818C', '#626873', '#4E545E'], { base: 1, rough: 0.35, metal: 0.8, shadeK: 0.8 });
  b.mat('trousers', ['#3A3A44', '#2E2E37', '#24242B', '#1C1C22', '#17171C'], { base: 2, rough: 0.8, shadeK: 0.85 });
  b.mat('whitep', ['#F1F0EA', '#ECEBE5', '#D6D5CE', '#BAB9B2', '#9E9D96'], { base: 1, rough: 0.5, shadeK: 0.9 });
  b.mat('silver', ['#DDE0E5', '#C3C7CE', '#A7ACB5', '#8A909A'], { base: 1, rough: 0.25, metal: 0.85 });
  b.mat('boot', ['#3C3C46', '#2E2E36', '#222229', '#19191E'], { base: 1, rough: 0.5 });
  b.mat('gold', ['#F7EBC0', '#F2E3A8', '#E8B83A', '#C9962A'], { base: 1, rough: 0.3, metal: 0.5, glow: form === 'asch' ? 0.8 : 0.2 });
  if (marked) b.mat('scar', ['#D0202C', '#C1121F'], { glow: 0.35 });
  if (form === 'knight') {
    b.mat('gbody', ['#F7EBC0', '#ECD58E', '#D9B860', '#B9933C', '#8E6E2A'], { base: 1, rough: 0.35, metal: 0.4, glow: 0.25, shadeK: 1.1 });
    b.mat('vein', ['#FFF4CC', '#F2C74E'], { glow: 1.4 });
    b.mat('visor', ['#2A2418', '#1E1A12'], { glow: 0 });
    b.mat('plume', ['#FFE9A8', '#F2C74E', '#E0A42C', '#B87E1C'], { base: 1, rough: 0.6, glow: 0.8 });
  }
  if (form === 'bones') {
    b.mat('bone', ['#EFEBDD', '#E2DCC8', '#CBC3AA', '#ADA58C', '#8E876F'], { base: 1, rough: 0.85, shadeK: 0.9 });
    b.mat('boneD', ['#5E5848', '#4A4538']);
  }
}

/**
 * Blank eyes under heavy pale brows; the red sideways-M (Σ) marks on both cheeks, points toward the nose; a broad grin
 * with the teeth showing. Rows chin+10 → chin+0. The helmet keeps the marks hidden ('helm' stamps no marks).
 */
const FACE = [
  '. . . . . . . . . . . .',
  '. B B B B . . B B B B .',
  '. L L L L . . L L L L .',
  '. W W W W . . W W W W .',
  '. . . . . . . . . . . .',
  'r r r . . . . . . r r r',
  '. r . . . . . . . . r .',
  '. . r . . s s . . r . .',
  '. r . . . . . . . . r .',
  'r r r . m T T m . r r r',
  '. . . . . m m . . . . .',
];
const FACE_HELM = FACE.map((row) => row.replace(/r/g, '.'));

/** The Hagal rune of the Wandenreich, 7×7: a stroke with an X through it. */
const HAGAL = [
  'X . . X . . X',
  '. X . X . X .',
  '. . X X X . .',
  '. . . X . . .',
  '. . X X X . .',
  '. X . X . X .',
  'X . . X . . X',
];

const assetCache = new Map<string, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function gerardAsset(form: GerardForm = 'helm', marked = false): CharacterAsset {
  const key = `${form}${marked ? '+' : ''}`;
  let a = assetCache.get(key);
  if (!a) assetCache.set(key, (a = buildGerard(form, marked)));
  return a;
}

export type GerardProp = 'hoffnung' | 'hoffnung-gold' | 'shield' | 'shield-asch' | 'bow' | 'helm-asch' | 'wings';

export function gerardProp(kind: GerardProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    const make: Record<GerardProp, () => VoxelModel> = {
      hoffnung: () => buildHoffnung(false), 'hoffnung-gold': () => buildHoffnung(true), shield: () => buildShield(false), 'shield-asch': () => buildShield(true),
      bow: buildBow, 'helm-asch': buildNorseHelm, wings: buildWings,
    };
    propCache.set(kind, (m = make[kind]()));
  }
  return m;
}

/** Hoffnung's blade along the prop's +Z (m): base and tip */
export const HOFFNUNG_BASE_Z = 7 / 48;
export const HOFFNUNG_TIP_Z = 58 / 48;

export function buildGerard(form: GerardForm = 'helm', marked = false): CharacterAsset {
  const b = new ModelBuilder(`gerard-${form}`, GERARD_RES);
  palette(b, form, marked);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  const [sx, , sz] = s.shoulder;
  const ey = L.elbow[1];
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 5.4, wz + 0.6]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 5.4, wz + 0.6]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 6, wz + 1.2]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 6, wz + 1.2]);
  // the shield rides the outside of the left forearm, its face outward
  b.socket('shield', 'forearm.L', [sx + 5.2, (ey + wy) / 2, sz], [90, 0, 0]);
  b.socket('back', 'chest', [0, s.chestY + 3, -11]);
  b.socket('chest.front', 'chest', [0, s.chestY, 10]);
  b.socket('heart', 'chest', [3, s.chestY + 1, 5]);
  const hd = head(b, L, form === 'knight' ? 'gbody' : form === 'bones' ? 'bone' : 'skin');
  b.socket('face', 'head', [0, s.chinY + 7, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front]);
  b.socket('eye.L', 'head', [3, s.chinY + 7, hd.front + 0.3]);
  b.socket('eye.R', 'head', [-3, s.chinY + 7, hd.front + 0.3]);
  b.socket('helm.socket', 'head', [0, s.chinY + 10, L.headC[2]]);
  const torso = torsoSdf(L);
  let springs: SpringDef[] = [];
  let colliders: ColliderDef[] = [];
  if (form === 'knight') knight(b, L, hd, torso);
  else if (form === 'bones') bones(b, L, hd);
  else {
    const legend = { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'eye', iris: 'eye', pupil: 'eye', hi: 'eye', mouth: 'mouth', teeth: 'teeth' }), r: { mat: 'mark' } };
    b.stamp('head', hd.x0, hd.chin + 10, form === 'helm' ? FACE_HELM : FACE, legend, hd.front - 1);
    // the jaw squarer, the chin a block
    b.add('head', box([0, hd.chin + 1.2, hd.front - 2.6], [4.6, 1.6, 2.2], { round: 0.8 }), 'skin', { only: 'empty' });
    if (form === 'helm') helmet(b, L, hd);
    else hairDo(b, L, hd);
    body(b, L, torso);
    hands(b, L);
    const tun = tunic(b, L, torso);
    legs(b, L, torso);
    springs = tun.springs;
    colliders = tun.colliders;
    if (form === 'asch') aschPatterns(b, L);
    if (marked) scarLines(b, L);
  }
  b.autoShade();
  b.lint();
  return {
    model: b.build(),
    springs,
    colliders: [...colliders, { bone: 'thigh.L', offset: [0, -0.12, 0.02], radius: 0.14 }, { bone: 'thigh.R', offset: [0, -0.12, 0.02], radius: 0.14 }],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- body

function torsoSdf(L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  return blend(3.0,
    box([0, s.chestY - 0.5, -0.6], [cx, 7.6, cz], { round: 4 }),
    // the pectorals
    ellipsoid([5.4, s.chestY + 1.5, 4.6], [6.4, 4.8, 5.2]), ellipsoid([-5.4, s.chestY + 1.5, 4.6], [6.4, 4.8, 5.2]),
    // the lats flaring under the arms
    ellipsoid([8.6, s.chestY - 3, -2], [5.2, 8, 6.4]), ellipsoid([-8.6, s.chestY - 3, -2], [5.2, 8, 6.4]),
    box([0, s.waistY, -0.3], [wx, 6, wz], { round: 3.4 }),
    box([0, s.hipsY + 0.5, -0.4], [s.hips[0], 4.6, s.hips[1]], { round: 3 }),
    // the trapezius heaped up to the neck
    capsule([3.2, sy + 3.2, sz - 1.8], [sx - 3, sy + 0.8, sz - 0.6], 4.0, 4.4), capsule([-3.2, sy + 3.2, sz - 1.8], [-sx + 3, sy + 0.8, sz - 0.6], 4.0, 4.4),
    sphere([sx, sy - 0.6, sz], 5.6), sphere([-sx, sy - 0.6, sz], 5.6));
}

/** The neck, the arms in their sleeves, the gauntlets from the elbows. */
function body(b: ModelBuilder, L: Landmarks, _torso: Sdf): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('neck', capsule([0, s.chinY - 7, L.headC[2] - 0.8], [0, s.chinY + 2, L.headC[2] - 0.8], s.neckR), 'skin');
  // the upper arm: the deltoid, a biceps you could sit on, in the tunic's sleeve
  b.add('upperarm.L', blend(1.8, sphere([sx, sy - 0.6, sz], 5.8), capsule([sx, sy - 1, sz], [sx, ey + 1, sz], 5.0, 4.4), ellipsoid([sx, (sy + ey) / 2, sz + 1.6], [4.4, 6, 3.6])), 'cloak', { mirror: true });
  b.paint('upperarm.L', cylinder([sx, ey + 0.4, sz], [sx, ey + 2, sz], 6), 'cloakIn', { mirror: true, where: b.isMat('cloak') });
  // the gauntlet: an elbow cop, the forearm plates, a flared cuff
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 4.2), capsule([sx, ey - 0.5, sz], [sx, wy + 2.4, sz], 4.5, 3.7)), 'gaunt', { mirror: true });
  b.add('forearm.L', ellipsoid([sx, ey + 0.4, sz - 1.8], [3.8, 3.4, 2.6]), 'gaunt', { mirror: true });
  b.add('forearm.L', cylinder([sx, wy + 1, sz], [sx, wy + 5, sz], 4.6, 4.0), 'gaunt', { mirror: true });
  for (const y of [ey - 4, ey - 8.5]) b.paint('forearm.L', cylinder([sx, y, sz], [sx, y + 0.8, sz], 6), 'gaunt', { mirror: true, shade: 3 });
  b.paint('forearm.L', cylinder([sx, wy + 4.2, sz], [sx, wy + 5, sz], 6), 'silver', { mirror: true });
}

/** Gauntleted hands, big enough to palm a head: open (palm.*) and gripping (fist.*, a channel along Z). */
function hands(b: ModelBuilder, L: Landmarks): void {
  const [wx, wy, wz] = L.wrist;
  const len = L.spec.hand;
  const palm = blend(1.4,
    box([wx, wy - 3.6, wz + 0.4], [2.0, 3.6, 3.3], { round: 1.2 }),
    box([wx - 0.3, wy - len + 3.6, wz + 0.5], [1.6, 3.4, 3.0], { round: 1.2 }));
  b.add('palm.L', palm, 'gaunt', { mirror: true });
  b.add('palm.L', capsule([wx - 0.8, wy - 2.4, wz + 3.2], [wx - 1.8, wy - 6.4, wz + 4.8], 1.4, 1.1), 'gaunt', { mirror: true });
  b.add('palm.L', capsule([wx, wy + 0.6, wz], [wx, wy - 1.8, wz], 2.6), 'gaunt', { mirror: true });
  for (let i = 0; i < 3; i++) b.paint('palm.L', box([wx - 1.8, wy - 6.2 - i * 1.6, wz + 0.5], [0.6, 0.35, 3.4]), 'gaunt', { mirror: true, shade: 3 });
  const gy = wy - 5.4;
  const fist = subtract(
    box([wx - 0.1, gy, wz + 0.6], [2.8, 3.9, 3.8], { round: 1.4 }),
    cylinder([wx - 0.1, gy, wz - 8], [wx - 0.1, gy, wz + 8], 1.25),
  );
  b.add('fist.L', fist, 'gaunt', { mirror: true });
  b.add('fist.L', capsule([wx, wy + 0.6, wz], [wx, wy - 1.8, wz], 2.6), 'gaunt', { mirror: true });
  b.add('fist.L', capsule([wx - 2.4, gy + 2.0, wz + 2.8], [wx - 1.6, gy - 0.8, wz + 4.2], 1.3), 'gaunt', { mirror: true });
  b.paint('fist.L', box([wx + 2.6, gy + 1.8, wz + 0.6], [0.7, 0.6, 3.9]), 'gaunt', { mirror: true, shade: 3 });
  b.paint('fist.L', box([wx + 2.6, gy - 1.2, wz + 0.6], [0.7, 0.5, 3.9]), 'gaunt', { mirror: true, shade: 3 });
}

/**
 * The white tunic: closed, a stand collar, three silver buttons, the Hagal rune on the left breast; ending at the waist
 * over the black trousers. The red cape from both shoulders down the back, the pins at the front of the shoulders.
 */
function tunic(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const nz = L.headC[2] - 0.8;
  addBands(b, intersect(offset(torso, 0.8), fn((_x, y) => s.waistY - 2 - y, [-40, 0, -40], [40, 140, 40])), 'cloak', [['spine', s.waistY - 2, s.chestY - 4], ['chest', s.chestY - 6, 140]]);
  // the stand collar
  const collar = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (y - (sy + 1)) / (s.chinY - 2 - sy)));
    const r = s.neckR + 1.4 + t * 0.5;
    return Math.max(Math.abs(Math.hypot(x, (z - nz) * 1.06) - r) - 0.8, y - (s.chinY - 2.6), sy + 1 - y);
  }, [-12, sy - 1, nz - 12], [12, s.chinY, nz + 12]);
  b.add('chest', collar, 'cloak');
  b.paint('chest', fn((x, y, z) => Math.max(Math.abs(Math.hypot(x, (z - nz) * 1.06) - (s.neckR + 2.2)) - 1.4, Math.abs(y - (s.chinY - 3.2)) - 0.5), [-12, sy - 1, nz - 12], [12, s.chinY, nz + 12]), 'silver', { where: b.isMat('cloak') });
  // the front edge: a seam down the middle, the hem at the waist turned in
  b.paint(['chest', 'spine'], fn((x, _y, z) => Math.max(Math.abs(x) - 0.45, 3 - z), [-2, s.waistY - 6, 0], [2, sy + 2, 20]), 'cloak', { shade: 3, where: b.isMat('cloak') });
  b.paint('spine', fn((_x, y) => Math.abs(y - (s.waistY - 1.6)) - 0.7, [-30, s.waistY - 4, -30], [30, s.waistY + 1, 30]), 'cloakIn', { where: b.isMat('cloak') });
  // three silver buttons down the front
  for (const y of [s.chestY + 4, s.chestY - 3, s.waistY + 2]) {
    const bone = y >= s.chestY - 4 ? 'chest' : 'spine';
    const at = frontOf(b, [bone], 0, Math.round(y));
    if (at) b.add(bone, cylinder([0, y + 0.5, at.z + 0.2], [0, y + 0.5, at.z + 1.3], 1.4), 'silver');
  }
  // the Hagal rune, dark red, on his left breast
  badge(b, HAGAL, 6, Math.round(s.chestY + 7), 'rune', { bones: ['chest'], shade: 1 });
  // the cape
  const cape = longCape(b, L, torso, { mat: 'cape', lining: 'capeIn', res: GERARD_RES, yHem: 12, r0: 12.2, r1: 17.4 });
  // the pins holding it at the front of both shoulders
  for (const k of [1, -1]) {
    const x = k * (sx - 5.5);
    const at = frontOf(b, ['chest'], Math.round(x), Math.round(sy + 1));
    const z = at ? at.z : 7;
    b.add('chest', cylinder([x, sy + 1.5, z - 0.4], [x, sy + 1.5, z + 1.4], 2.2), 'silver');
    b.add('chest', sphere([x, sy + 1.5, z + 1.6], 1.1), 'silver', { shade: 0 });
  }
  return cape;
}

/** Black trousers under the white X of the belt, white shin guards with discs on the knees, black boots. */
function legs(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 0.6, -0.4], [s.hips[0] + 1, 5.6, s.hips[1] + 1], { round: 3 }), 'trousers');
  b.add('spine', intersect(offset(torso, 0.5), aabb([-30, s.hipsY + 2, -30], [30, s.waistY - 1.5, 30])), 'trousers', { only: 'empty' });
  b.add('thigh.L', blend(1.6, sphere([hx, hy, hz], 6.2), capsule([hx, hy, hz], [kx, ky + 1, kz], 6.0, 4.9)), 'trousers', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([kx, ky, kz], 4.7), capsule([kx, ky, kz], [ax, ay + 2.4, az], 4.6, 3.7), ellipsoid([kx, ky - 6, kz - 1.6], [3.8, 5, 3.4])), 'trousers', { mirror: true });
  // the shin guard: a white plate over the front of the shin, the disc on the knee
  const shin = capsule([kx, ky - 2, kz], [ax, ay + 3.2, az], 4.7, 3.9);
  b.add('shin.L', intersect(offset(shin, 0.9), fn((_x, _y, z) => (kz - 0.6) - z, [-30, 0, -30], [30, 60, 30]), aabb([-30, ay + 2.6, -30], [30, ky - 2.4, 30])), 'whitep', { mirror: true });
  b.paint('shin.L', fn((x, _y, z) => Math.max(Math.abs(x - kx) - 0.4, kz + 3 - z), [kx - 2, ay, kz], [kx + 2, ky, kz + 10]), 'whitep', { mirror: true, shade: 3, where: b.isMat('whitep') });
  b.add('shin.L', cylinder([kx, ky + 0.2, kz + 3.4], [kx, ky + 0.2, kz + 5.8], 3.6), 'whitep', { mirror: true });
  b.add('shin.L', sphere([kx, ky + 0.2, kz + 5.9], 1.5), 'silver', { mirror: true });
  b.paint('shin.L', torus([kx, ky + 0.2, kz + 5.8], 3.0, 0.5, [90, 0, 0]), 'whitep', { mirror: true, shade: 3, where: b.isMat('whitep') });
  // the boots
  const f = s.foot;
  b.add('foot.L', capsule([ax, ay + 3, az - 0.4], [ax, ay - 1, az - 0.4], 4.2), 'boot', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.7, az + (f.len / 2 - f.heel)], [f.w / 2, 2.7, f.len / 2], { round: 1.6 }), fn((_x, y, z) => y - 5.6 + Math.max(0, z - (az + f.len - f.heel - 6)) * 0.55, [-20, -2, -20], [20, 12, 30])), 'boot', { mirror: true });
  b.paint('foot.L', aabb([ax - 6, 0, az - 9], [ax + 6, 1, az + 18]), 'gaunt', { mirror: true, shade: 3 });
  // the X-belt: two white straps crossing over the black at the front of the hips (and again behind), the disc buckle
  const band = subtract(offset(torso, 1.9), offset(torso, 0.4));
  const yc = s.hipsY - 3;
  for (const k of [1, -1]) {
    const strap = intersect(band, fn((x, y) => Math.abs(y - (yc + k * x * 0.62)) - 1.5, [-30, yc - 14, -30], [30, yc + 14, 30]), aabb([-30, s.hipsY - 9, -30], [30, s.waistY - 2, 30]));
    addBands(b, strap, 'whitep', [['hips', -40, s.waistY - 5], ['spine', s.waistY - 5, s.waistY - 2]]);
  }
  b.paint(['hips', 'spine'], fn((x, y) => Math.min(Math.abs(Math.abs(y - (yc + x * 0.62)) - 1.5), Math.abs(Math.abs(y - (yc - x * 0.62)) - 1.5)) - 0.3, [-30, yc - 14, -30], [30, yc + 14, 30]), 'whitep', { shade: 3, where: b.isMat('whitep') });
  const bz = frontOf(b, ['hips'], 0, Math.round(yc))?.z ?? 10;
  b.add('hips', cylinder([0, yc, bz - 0.6], [0, yc, bz + 1.4], 3.6), 'whitep');
  b.add('hips', cylinder([0, yc, bz + 1], [0, yc, bz + 2], 2.6), 'silver');
  b.add('hips', sphere([0, yc, bz + 2.1], 1), 'silver', { shade: 0 });
}

// ---------------------------------------------------------------------------------------------- the head

/**
 * The winged helmet: a steel bowl over the skull, cheek guards to the jaw, a mask over the brow and the eyes with
 * two slits (the blank eyes glow through), a nasal; the mouth and jaw bare. White feathered wings fan up and back
 * from the temples. Blond hair falls from under its back to the collar.
 */
function helmet(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const hw = s.head.w / 2;
  const cz = L.headC[2];
  const back = cz - s.head.d / 2;
  // the hair below the helmet's back: a few wavy clumps to the collar
  for (const x0 of [-3.6, 0, 3.6]) {
    const pts: V3[] = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      pts.push([x0 * (1 + t * 0.25) + Math.sin(t * 6 + x0) * 0.6 * t, c + 2 - t * 8, back - 0.6 - t * 1.6]);
    }
    b.add('head', tube(pts, pts.map((_, i) => 2.1 - i * 0.15)), 'hair', { thr: 0.3 });
  }
  const bottom = (x: number, z: number) => {
    if (z > 1.2) return Math.abs(x) < 4.6 ? c + 3.6 : c + 0.6;
    if (z > -2.5) return c + 0.6;
    return c - 2.2;
  };
  const bowl = intersect(
    ellipsoid([0, c + 9.4, cz - 0.4], [hw + 2.0, 9.4, s.head.d / 2 + 1.9]),
    fn((x, y, z) => bottom(x, z) - y, [-12, c - 6, cz - 12], [12, c + 22, cz + 12]),
  );
  b.add('head', bowl, 'steel', { only: 'empty' });
  // a low comb along the crown
  b.add('head', intersect(ellipsoid([0, c + 9.6, cz - 0.6], [0.7, 9.9, s.head.d / 2 + 2.3]), halfSpace([0, c + 15, 0], [0, -1, 0])), 'steel', { thr: 0.2 });
  // the brow band and the rim, a shade darker
  b.paint('head', fn((_x, y) => Math.abs(y - (c + 10.6)) - 0.6, [-12, c + 9, cz - 12], [12, c + 12, cz + 12]), 'steel', { shade: 3, where: b.isMat('steel') });
  b.paint('head', fn((x, y, z) => Math.abs(y - bottom(x, z) - 0.5) - 0.6, [-12, c - 6, cz - 12], [12, c + 12, cz + 12]), 'steel', { shade: 3, where: b.isMat('steel') });
  // the eye slits, their edges darkened: the blank eyes glow through
  for (const k of [1, -1]) {
    const x0 = k > 0 ? 1.4 : -5.4, x1 = k > 0 ? 5.4 : -1.4;
    b.carve('head', aabb([x0, c + 6.6, hd.front + 0.05], [x1, c + 7.6, hd.front + 6]));
    b.paint('head', aabb([x0 - 0.2, c + 6.6, hd.front + 0.05], [x1 + 0.2, c + 7.6, hd.front + 6]), 'slit', { where: b.isMat('steel') });
  }
  // the nasal down over the nose
  b.add('head', box([0, c + 4.8, hd.front + 1.3], [0.9, 2.6, 0.9], { round: 0.4 }), 'steel');
  // rivets round the bowl
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const p: V3 = [Math.sin(a) * (hw + 2.1), c + 10.6, cz - 0.4 + Math.cos(a) * (s.head.d / 2 + 2.0)];
    b.add('head', sphere(p, 0.6), 'silver', { only: 'empty' });
  }
  // the wings: a fan of feathers a side, swept up and back from the temples, flat to the side, the tips scalloped
  for (const k of [1, -1]) {
    const root: V3 = [k * (hw + 1.9), c + 9.4, cz - 0.8];
    b.add('head', ellipsoid(root, [1.4, 2.6, 2.8]), 'steel');
    const t0 = 0.22, t1 = 1.42;
    b.add('head', fn((x, y, z) => {
      const rx = x - root[0], ry = y - root[1], rz = -(z - root[2]);
      const r = Math.hypot(ry, rz);
      const th = Math.atan2(ry, rz);
      const u = (th - t0) / (t1 - t0);
      const R = 6.5 + 9 * Math.max(0, Math.min(1, u)) - 1.5 * Math.abs(Math.sin(Math.max(0, u) * Math.PI * 5));
      return Math.max(Math.abs(rx - k * r * 0.14) - 0.75, (t0 - th) * r, (th - t1) * r, r - R, 1.2 - r);
    }, [root[0] - 5, root[1] - 4, root[2] - 18], [root[0] + 5, root[1] + 18, root[2] + 3]), 'wingw', { thr: 0.2 });
    // the feather lines
    b.paint('head', fn((_x, y, z) => {
      const th = Math.atan2(y - root[1], -(z - root[2]));
      const u = (th - t0) / (t1 - t0);
      return Math.abs(((u * 5 + 0.5) % 1) - 0.5) * 6 - 0.35;
    }, [root[0] - 5, root[1] - 4, root[2] - 18], [root[0] + 5, root[1] + 18, root[2] + 3]), 'wingw', { shade: 2, where: b.isMat('wingw') });
  }
}

/**
 * Light blond hair to the shoulders: a rounded cap parted over the brow, locks swept to either side, wavy clumps falling
 * behind the cheeks and down the back of the neck. A thin black braid circles the scalp like a crown.
 */
function hairDo(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const hw = s.head.w / 2;
  const cz = L.headC[2] - 0.4;
  const front = hd.front;
  // the cap: a rounded shell over the skull, cut away over the face below the hairline
  const cap = subtract(
    intersect(ellipsoid([0, c + 10.4, cz - 0.6], [hw + 1.5, 6.4, s.head.d / 2 + 1.7]), fn((_x, y) => c + 3 - y, [-14, c - 4, -20], [14, c + 20, 20])),
    fn((x, y, z) => Math.max(z - (front + 3), (front - 3.2) - z, y - (c + 11.4 - Math.abs(x) * 0.12), Math.abs(x) - (hw - 0.6)), [-14, c - 4, front - 4], [14, c + 16, front + 4]),
  );
  b.add('head', cap, 'hair', { only: 'empty', thr: 0.2 });
  b.paint('head', box([0, c + 15, front - 3], [0.45, 1.4, 3.6]), 'hair', { shade: 4, where: b.isMat('hair') });
  // locks swept from the parting to either side over the temples
  for (const k of [1, -1]) {
    for (let i = 0; i < 2; i++) {
      const a: V3 = [k * (0.8 + i * 2.2), c + 15.6 - i * 0.6, front - 1.8];
      const e: V3 = [k * (hw + 1.2), c + 9.6 - i * 1.6, front - 3.6 - i];
      b.add('head', tube(smoothPath([a, [(a[0] + e[0]) / 2, c + 14.6 - i * 0.6, front - 0.8], e], 3), [1.4, 1.4, 1.3, 1.25, 1.15, 1.05, 0.95]), 'hair', { thr: 0.3 });
    }
  }
  // the falls: wavy clumps behind the cheeks and down the back of the neck to the shoulders
  const back = cz - s.head.d / 2;
  const clump = (root: V3, end: V3, r0: number, wave: number, ph: number) => {
    const pts: V3[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const w = Math.sin(t * Math.PI * 2 + ph) * wave * t;
      pts.push([root[0] + (end[0] - root[0]) * t + w, root[1] + (end[1] - root[1]) * t, root[2] + (end[2] - root[2]) * t + w * 0.4]);
    }
    b.add('head', tube(pts, pts.map((_, i) => r0 * (1 - (i / 8) * 0.45))), 'hair', { thr: 0.3 });
  };
  for (const k of [1, -1]) {
    clump([k * (hw + 0.4), c + 9, front - 4.4], [k * (hw + 2.0), c - 5, front - 6.4], 2.0, 0.9, 0);
    clump([k * (hw + 0.2), c + 10, front - 7], [k * (hw + 2.4), c - 6, front - 9.4], 2.1, 1.0, 1.4);
    clump([k * (hw - 1.2), c + 11, back + 1.2], [k * (hw + 1.0), c - 7, back - 1.8], 2.2, 0.8, 2.6);
    clump([k * 2.4, c + 12, back + 0.6], [k * 3.0, c - 7.5, back - 2.4], 2.2, 0.9, 0.7);
  }
  clump([0, c + 12, back + 0.4], [0, c - 7.8, back - 2.6], 2.2, 0.7, 1.9);
  b.paint('head', fn((x, _y, z) => Math.abs(((x * 0.8 + z * 0.3 + 40) % 2.6) - 1.3) - 0.3, [-16, c - 10, back - 6], [16, c + 8, front - 3]), 'hair', { shade: 3, where: b.isMat('hair') });
  // the braid: a thin black cord of plaits round the crown, sunk into the hair, higher at the back
  const pts: V3[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    pts.push([Math.sin(a) * (hw + 1.1), c + 13.6 + (1 - Math.cos(a)) * 0.8, cz - 0.6 + Math.cos(a) * (s.head.d / 2 + 1.2)]);
  }
  b.add('head', tube(pts, pts.map(() => 0.62)), 'braid', { thr: 0.2 });
  for (let i = 0; i < 40; i += 2) b.paint('head', sphere(pts[i], 0.55), 'braid', { shade: 0, where: b.isMat('braid') });
  // the brow ridge heavy over the eyes
  b.add('head', box([0, c + 9.9, front - 0.6], [hw - 0.4, 0.6, 0.6]), 'skin', { only: 'empty' });
}

// ---------------------------------------------------------------------------------------------- Aschtonig and the regrown arm

/** Thick gold patterns over the arms and legs: bands and chevrons glowing on the sleeves, the gauntlets, the trousers. */
function aschPatterns(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const glowOn = b.isMat('cloak', 'gaunt', 'trousers', 'whitep');
  // chevrons down the arms
  for (let y = sy - 4; y > wy + 2; y -= 5.2) {
    const bone = y > ey ? 'upperarm.L' : 'forearm.L';
    b.paint(bone, fn((x, yy, z) => Math.abs(yy - y + Math.abs(z - sz) * 0.45 + Math.abs(x - sx) * 0.2) - 0.65, [sx - 8, y - 6, sz - 8], [sx + 8, y + 3, sz + 8]), 'gold', { mirror: true, shade: 1, where: glowOn });
  }
  // a band round the shoulder
  b.paint('upperarm.L', torus([sx, sy - 3.5, sz], 5.4, 0.8, [0, 0, 0]), 'gold', { mirror: true, shade: 2, where: glowOn });
  // the legs: a spiral of thick lines down the thighs and the shins
  const [hx, hy] = s.hip;
  const [kx, ky] = L.knee;
  const ay = L.ankle[1];
  for (let y = hy - 3; y > ay + 3; y -= 5.6) {
    const bone = y > ky ? 'thigh.L' : 'shin.L';
    const cx = y > ky ? hx + (kx - hx) * ((hy - y) / (hy - ky)) : kx;
    b.paint(bone, fn((x, yy, z) => Math.abs(yy - y + (x - cx) * 0.5 + z * 0.15) - 0.7, [cx - 9, y - 8, -9], [cx + 9, y + 8, 12]), 'gold', { mirror: true, shade: 1, where: glowOn });
  }
}

/** The arm that grew back: red lines running down the right gauntlet and sleeve. */
function scarLines(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const wy = L.wrist[1];
  for (const a of [0.4, 1.9, 3.6, 5.0]) {
    b.paint(['upperarm.R', 'forearm.R'], fn((x, y, z) => {
      const ang = Math.atan2(z - sz, x + sx) + (y - wy) * 0.05;
      const d = Math.abs(Math.sin((ang - a) / 2)) * 9;
      return d - 0.5;
    }, [-sx - 8, wy, sz - 8], [-sx + 8, sy - 2, sz + 8]), 'scar', {});
  }
}

// ---------------------------------------------------------------------------------------------- Enhanced Aschtonig

/**
 * The golden knight: the body re-formed from light, smooth and heroic, no clothes; a knight's-helm face — a closed
 * visor with a cross of dark slits — a plume running over the top and down the back; two great spikes on the
 * shoulders; energy veins glowing at the shoulders and the waist.
 */
function knight(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  const ey = L.elbow[1], wy = L.wrist[1];
  const c = hd.chin;
  const cz = L.headC[2];
  addBands(b, offset(torso, 0.6), 'gbody', [['hips', 30, s.waistY - 6], ['spine', s.waistY - 6, s.chestY - 4], ['chest', s.chestY - 6, 140]]);
  b.add('neck', capsule([0, c - 7, cz - 0.8], [0, c + 2, cz - 0.8], s.neckR + 0.4), 'gbody');
  b.add('upperarm.L', blend(1.8, sphere([sx, sy - 0.6, sz], 6.0), capsule([sx, sy - 1, sz], [sx, ey + 1, sz], 5.0, 4.4)), 'gbody', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 4.3), capsule([sx, ey - 0.5, sz], [sx, wy + 1.5, sz], 4.6, 3.6)), 'gbody', { mirror: true });
  b.add('thigh.L', blend(1.6, sphere([hx, hy, hz], 6.2), capsule([hx, hy, hz], [kx, ky + 1, kz], 6.0, 4.9)), 'gbody', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([kx, ky, kz], 4.7), capsule([kx, ky, kz], [ax, ay + 2.4, az], 4.6, 3.6)), 'gbody', { mirror: true });
  const f = s.foot;
  b.add('foot.L', blend(1.2, capsule([ax, ay + 3, az - 0.4], [ax, ay - 1, az - 0.4], 4.0), intersect(box([ax, 2.6, az + (f.len / 2 - f.heel)], [f.w / 2, 2.6, f.len / 2], { round: 1.6 }), halfSpace([0, 5.4, az + f.len - f.heel - 5], [0, 1, 0.55]))), 'gbody', { mirror: true });
  // hands: open and closed, gold
  const len = s.hand;
  b.add('palm.L', blend(1.4, box([wx(L), wy - 3.6, L.wrist[2] + 0.4], [2.0, 3.6, 3.3], { round: 1.2 }), box([wx(L) - 0.3, wy - len + 3.6, L.wrist[2] + 0.5], [1.6, 3.4, 3.0], { round: 1.2 })), 'gbody', { mirror: true });
  b.add('fist.L', box([wx(L) - 0.1, wy - 5.4, L.wrist[2] + 0.6], [2.8, 3.9, 3.8], { round: 1.4 }), 'gbody', { mirror: true });
  // the knight's helm over the head
  const helm = intersect(ellipsoid([0, c + 8.4, cz - 0.2], [s.head.w / 2 + 1.6, 9.4, s.head.d / 2 + 1.6]), halfSpace([0, c - 1.4, 0], [0, -1, 0]));
  b.add('head', helm, 'gbody');
  // the visor: a cross of slits
  b.carve('head', aabb([-5, c + 6.6, hd.front + 0.6], [5, c + 7.6, hd.front + 6]));
  b.carve('head', aabb([-0.6, c + 1.4, hd.front + 0.6], [0.6, c + 7, hd.front + 6]));
  b.paint('head', aabb([-6, c + 0.8, hd.front - 1], [6, c + 8.2, hd.front + 6]), 'visor', { where: (v) => v !== 0 && !b.isMat('gbody')(v) });
  b.paint('head', fn((x, y, z) => Math.min(Math.max(Math.abs(x) - 5.6, Math.abs(y - (c + 7.1)) - 1.1), Math.max(Math.abs(x) - 1.1, Math.abs(y - (c + 4)) - 3.6)) + Math.max(0, hd.front - 0.5 - z) * 9, [-7, c, hd.front - 2], [7, c + 9, hd.front + 6]), 'visor', { where: b.isMat('gbody') });
  // the plume: a crest from the brow over the crown and down the back of the head
  const plume: V3[] = smoothPath([[0, c + 15, hd.front - 2], [0, c + 19.5, cz - 1], [0, c + 17, cz - 9], [0, c + 9, cz - 12.5], [0, c + 1, cz - 13]], 4);
  b.add('head', tube(plume, plume.map((_, i) => 1.4 + Math.sin((i / (plume.length - 1)) * Math.PI) * 1.2)), 'plume', { thr: 0.25 });
  // the plume's blade: thin across, an arc standing up from the crest
  b.add('head', fn((x, y, z) => {
    const r = Math.hypot(y - (c + 8), z - (cz - 2.5));
    return Math.max(Math.abs(x) - 1.0, r - 14.6, 9.4 - r, (c + 2) - y, z - (hd.front - 4));
  }, [-2, c, cz - 16], [2, c + 22, hd.front]), 'plume', { thr: 0.2 });
  // the shoulder spikes: great horns rising up and out
  for (const k of [1, -1]) {
    b.add(`upperarm.${k > 0 ? 'L' : 'R'}`, spike([k * (sx + 0.6), sy + 2.2, sz - 0.8], [k * 0.62, 0.78, -0.16], 21, 4.6, 4.2, { tip: 0.5, bend: [k * 0.1, -0.1, 0] }), 'gbody', { thr: 0.2 });
    b.add('chest', ellipsoid([k * (sx - 2), sy + 1.4, sz], [5, 3.2, 5.4]), 'gbody');
  }
  // the energy veins: at the shoulders, round the waist
  for (const k of [1, -1]) b.paint(['chest', `upperarm.${k > 0 ? 'L' : 'R'}`], fn((x, y, z) => Math.abs(Math.hypot(x - k * sx, z - sz) - 6.2 + Math.sin(y * 0.9) * 0.6) - 0.6 + Math.max(0, Math.abs(y - sy) - 4), [k * sx - 9, sy - 6, sz - 9], [k * sx + 9, sy + 6, sz + 9]), 'vein', { where: b.isMat('gbody') });
  b.paint(['spine', 'hips'], fn((x, y) => Math.abs(y - (s.waistY - 4) - Math.sin(x * 0.5) * 1.6) - 0.6, [-20, s.waistY - 9, -20], [20, s.waistY + 1, 20]), 'vein', { where: b.isMat('gbody') });
  b.paint('chest', fn((x, y) => Math.abs(y - (s.chestY - 3) - Math.abs(x) * 0.5) - 0.5 + Math.max(0, Math.abs(x) - 9), [-12, s.chestY - 8, -20], [12, s.chestY + 6, 20]), 'vein', { where: b.isMat('gbody') });
}

function wx(L: Landmarks): number {
  return L.wrist[0];
}

// ---------------------------------------------------------------------------------------------- the death

/** The skeleton the Auswählen leaves: skull and jaw, the spine, the ribs, the pelvis, long bones, hands and feet. */
function bones(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  const ey = L.elbow[1], wy = L.wrist[1];
  const c = hd.chin;
  const cz = L.headC[2];
  // the skull, sculpted in place of the head() block: a round cranium, the cheekbones and the upper jaw, the mandible,
  // deep sockets, the nasal cavity, the teeth
  b.carve('head', aabb([-14, c - 6, cz - 16], [14, c + 22, cz + 16]));
  b.add('head', blend(1.6, ellipsoid([0, c + 9.6, cz - 0.8], [6.3, 6.6, 7.2]), box([0, c + 4.4, cz + 2.2], [4.9, 2.8, 3.8], { round: 1.4 })), 'bone');
  for (const k of [1, -1]) b.add('head', ellipsoid([k * 4.6, c + 5.4, cz + 3.4], [1.6, 1.2, 2.4]), 'bone');
  b.add('head', subtract(box([0, c + 1.3, cz + 2.2], [4.3, 1.5, 3.8], { round: 1 }), box([0, c + 1.8, cz + 0.2], [3.1, 2.2, 3.4])), 'bone');
  b.add('head', capsule([0, c - 1, cz - 2], [0, c + 3, cz - 3], 1.6), 'bone');
  const fz = cz + 6.2;
  for (const k of [1, -1]) {
    b.carve('head', ellipsoid([k * 2.5, c + 7.2, fz], [1.9, 1.8, 2.6]));
    b.paint('head', ellipsoid([k * 2.5, c + 7.2, fz - 1.4], [2.6, 2.5, 3.2]), 'boneD', { where: b.isMat('bone') });
  }
  b.carve('head', fn((x, y, z) => Math.max(Math.abs(x) - (0.4 + (y - (c + 3.4)) * 0.35), (c + 3.4) - y, y - (c + 5.6), (fz - 2.6) - z), [-3, c + 3, fz - 4], [3, c + 6, fz + 3]));
  b.paint('head', fn((x, y, z) => Math.max(Math.abs(x) - 2.2, Math.abs(y - (c + 4.4)) - 1.4, (fz - 3.6) - z), [-4, c + 2, fz - 5], [4, c + 7, fz + 3]), 'boneD', { where: b.isMat('bone') });
  for (let x = -3; x <= 2; x++) b.paint('head', aabb([x + 0.1, c + 2, cz - 2], [x + 0.9, c + 3, cz + 10]), 'bone', { shade: (x & 1) === 0 ? 0 : 2 });
  b.paint('head', aabb([-4, c + 1.6, cz - 2], [4, c + 2, cz + 10]), 'boneD');
  // the spine
  const bands: [string, number, number][] = [['hips', -40, s.waistY - 6], ['spine', s.waistY - 6, s.chestY - 10], ['chest', s.chestY - 10, c - 7], ['neck', c - 7, c + 1]];
  addBands(b, capsule([0, s.hipsY - 3, -7.2], [0, c, -2.4], 1.3), 'bone', bands);
  for (let y = s.hipsY - 2; y < c - 2; y += 2.4) {
    const t = (y - (s.hipsY - 3)) / (c - s.hipsY + 3);
    const z = -7.2 + t * 4.8;
    addBands(b, cylinder([0, y, z], [0, y + 1.6, z], 2.2), 'bone', bands);
    addBands(b, box([0, y + 0.8, z - 2.2], [0.7, 0.7, 1.6]), 'bone', bands);
  }
  // the rib cage: hoops from the spine round to the breastbone
  for (let i = 0; i < 6; i++) {
    const y = s.chestY + 6 - i * 2.8;
    const rx = 10 - Math.abs(i - 2.2) * 0.9, rz = 7.4 - Math.abs(i - 2) * 0.5;
    b.add('chest', fn((x, yy, z) => {
      const a = Math.atan2(x, z + 0.6);
      const ring = Math.abs(Math.hypot(x / rx, (z + 0.6) / rz) - 1) * Math.min(rx, rz) - 0.7;
      const dy = Math.abs(yy - y + Math.abs(Math.cos(a)) * 1.6 - 1.6 + (z < 0 ? 0 : 0)) - 0.7;
      return Math.max(ring, dy);
    }, [-14, y - 5, -12], [14, y + 3, 12]), 'bone', { thr: 0.2 });
  }
  b.add('chest', box([0, s.chestY + 2.5, 6.4], [1.2, 8, 1.0], { round: 0.5 }), 'bone');
  b.add('chest', capsule([0, sy + 0.6, 6], [sx - 2, sy + 1.4, 0], 1.0), 'bone');
  b.add('chest', capsule([0, sy + 0.6, 6], [-sx + 2, sy + 1.4, 0], 1.0), 'bone');
  // the pelvis
  b.add('hips', subtract(ellipsoid([0, s.hipsY - 1.5, -1], [9.6, 5.6, 6.4]), ellipsoid([0, s.hipsY - 2.5, -1], [6.8, 6.2, 8.4]), ellipsoid([0, s.hipsY + 3.6, 2], [7, 4, 6])), 'bone', { thr: 0.2 });
  // the long bones with their knobs
  const long = (bone: string, a: V3, e: V3, r: number) => {
    b.add(bone, capsule(a, e, r * 0.62, r * 0.55), 'bone', { mirror: true });
    b.add(bone, sphere(a, r), 'bone', { mirror: true });
    b.add(bone, sphere(e, r * 0.9), 'bone', { mirror: true });
  };
  long('upperarm.L', [sx, sy - 1, sz], [sx, ey + 1, sz], 2.3);
  long('forearm.L', [sx, ey - 0.5, sz], [sx, wy + 1, sz], 1.8);
  b.add('forearm.L', capsule([sx + 0.9, ey - 1, sz + 0.6], [sx + 0.9, wy + 1, sz + 0.6], 0.8), 'bone', { mirror: true });
  long('thigh.L', [hx, hy, hz], [kx, ky + 1, kz], 2.8);
  long('shin.L', [kx, ky, kz], [ax, ay + 1.6, az], 2.2);
  b.add('shin.L', capsule([kx + 1.2, ky - 1, kz - 0.8], [ax + 1, ay + 2, az - 0.8], 0.8), 'bone', { mirror: true });
  // hands and feet: knuckled fans
  const [wwx, , wwz] = L.wrist;
  for (const bone of ['palm.L', 'fist.L']) {
    b.add(bone, box([wwx, wy - 2.2, wwz + 0.4], [1.2, 2.2, 2.6], { round: 0.6 }), 'bone', { mirror: true });
    for (let i = 0; i < 4; i++) b.add(bone, capsule([wwx, wy - 4, wwz - 1.8 + i * 1.4], [wwx - (bone === 'fist.L' ? 1.6 : 0.2), wy - (bone === 'fist.L' ? 6.4 : 9.4), wwz - 1.8 + i * 1.5], 0.55), 'bone', { mirror: true, thr: 0.25 });
  }
  b.add('foot.L', blend(0.8, sphere([ax, ay - 1.2, az - 0.6], 2.4), capsule([ax, 1.4, az - 0.6], [ax, 1, az + 10], 1.7, 1.0)), 'bone', { mirror: true });
  for (let i = 0; i < 4; i++) b.add('foot.L', capsule([ax - 1.8 + i * 1.2, 1.2, az + 6], [ax - 2.2 + i * 1.4, 0.8, az + 11.5], 0.55), 'bone', { mirror: true, thr: 0.25 });
}

// ---------------------------------------------------------------------------------------------- props

/**
 * Hoffnung at 48 vox/m: a black double-edged sword — a long black grip, a round pommel, the V-shaped guard opening up
 * the blade with a star in the crook (silver; gold in Aschtonig), the broad blade with a raised spine tapering to a
 * point. Origin at the grip, +Z along the blade, the edges ±Y.
 */
function buildHoffnung(gold: boolean): VoxelModel {
  const b = new ModelBuilder(gold ? 'hoffnung-gold' : 'hoffnung', 48);
  b.mat('blade', ['#3A3A44', '#2C2C34', '#222229', '#1A1A20', '#15151A'], { base: 2, rough: 0.25, metal: 0.7, shadeK: 0.7 });
  b.mat('edge', ['#5A5A66', '#46464F'], { base: 0, rough: 0.2, metal: 0.8 });
  b.mat('grip', ['#2C2C33', '#222228', '#19191D'], { base: 1, rough: 0.8 });
  b.mat('star', gold ? ['#F7E2A0', '#E6B93E', '#C9962A'] : ['#E6E9EE', '#C8CCD2', '#A2A8B2'], { base: 1, rough: 0.25, metal: 0.85, glow: gold ? 0.6 : 0 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', cylinder([0, 0, -12], [0, 0, 3], 1.2), 'grip');
  for (let z = -11; z < 3; z += 2) b.paint('root', cylinder([0, 0, z], [0, 0, z + 0.7], 1.5), 'grip', { shade: 0 });
  b.add('root', sphere([0, 0, -13.4], 2.1), 'blade');
  b.add('root', cylinder([0, 0, -12.4], [0, 0, -11.6], 1.8), 'star');
  // the V-guard: two arms sweeping forward and out from the hilt
  for (const k of [1, -1]) b.add('root', capsule([0, k * 1.2, 3.6], [0, k * 8.4, 9.6], 1.3, 0.9), 'blade');
  b.add('root', box([0, 0, 4.2], [1.4, 2.6, 1.6], { round: 0.6 }), 'blade');
  // the star in the guard's crook
  b.add('root', fn((x, y, z) => {
    const u = y, v = z - 6.4;
    const r = Math.hypot(u, v), a = Math.atan2(u, v);
    const k = 2.2 + 1.6 * Math.pow(Math.abs(Math.cos((a * 5) / 2)), 3);
    return Math.max(r - k, Math.abs(x) - 0.9);
  }, [-2, -5, 2], [2, 5, 11]), 'star', { thr: 0.2 });
  // the blade
  b.add('root', fn((x, y, z) => {
    if (z < 6 || z > 59) return 1;
    const t = (z - 6) / 53;
    const w = 3.2 * (1 - Math.max(0, t - 0.8) / 0.2) + 0.4;
    const th = 0.6 + 0.45 * (1 - Math.abs(y) / Math.max(0.6, w));
    return Math.max(Math.abs(y) - w, Math.abs(x) - th, 6 - z, z - 59);
  }, [-2, -5, 5], [2, 5, 60]), 'blade', { thr: 0.25 });
  b.paint('root', fn((_x, y, z) => Math.max(Math.abs(y) - 0.7, 8 - z, z - 54), [-2, -5, 5], [2, 5, 60]), 'blade', { shade: 0 });
  b.paint('root', fn((_x, y, z) => Math.max(2.4 - Math.abs(y) + Math.max(0, z - 48) * 0.3, 6 - z), [-2, -5, 5], [2, 5, 60]), 'edge');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * The shield at 48 vox/m: round, a yard across — a bronze face domed outward with a silver rim, a ring of silver studs,
 * a silver boss; in Aschtonig a gold star spreads out over the rim. Origin at the centre, the face outward (+X).
 */
function buildShield(asch: boolean): VoxelModel {
  const b = new ModelBuilder(asch ? 'gerard-shield-asch' : 'gerard-shield', 48);
  b.mat('bronze', ['#D49A5E', '#BC8248', '#A8703A', '#8C5A2C', '#6E4420'], { base: 2, rough: 0.35, metal: 0.75, shadeK: 0.8 });
  b.mat('silver', ['#E6E9EE', '#C7CBD1', '#A9AEB7', '#8A909A'], { base: 1, rough: 0.25, metal: 0.85 });
  if (asch) b.mat('gold', ['#F7E2A0', '#F2D27A', '#E6B93E', '#C9962A'], { base: 1, rough: 0.25, metal: 0.6, glow: 0.7 });
  b.bone('root', null, [0, 0, 0]);
  const R = 25;
  // the face: a shallow dome, thick at the rim
  b.add('root', fn((x, y, z) => {
    const r = Math.hypot(y, z);
    const face = 1.6 + 2.4 * Math.max(0, 1 - (r / R) * (r / R));
    return Math.max(r - R, x - face, -1.2 - x);
  }, [-2, -R - 1, -R - 1], [5, R + 1, R + 1]), 'bronze', { thr: 0.2 });
  // the rim, rolled, silver
  b.add('root', torus([0.4, 0, 0], R - 0.6, 1.5, [0, 0, 90]), 'silver', { thr: 0.2 });
  // a ring of studs, a raised ring, the boss
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const y = Math.sin(a) * (R - 4.5), z = Math.cos(a) * (R - 4.5);
    const r = Math.hypot(y, z);
    b.add('root', sphere([1.6 + 2.4 * Math.max(0, 1 - (r / R) ** 2) + 0.2, y, z], 1.0), 'silver');
  }
  b.add('root', torus([3.4, 0, 0], 12, 0.9, [0, 0, 90]), 'silver', { thr: 0.2 });
  b.add('root', ellipsoid([3.8, 0, 0], [2.6, 5.2, 5.2]), 'silver');
  b.paint('root', fn((x, y, z) => Math.abs(Math.hypot(y, z) - 18) - 0.5 + Math.max(0, 2 - x), [-2, -R, -R], [6, R, R]), 'bronze', { shade: 4, where: b.isMat('bronze') });
  if (asch) {
    // the star, five points running out past the rim
    b.add('root', fn((x, y, z) => {
      const r = Math.hypot(y, z), a = Math.atan2(y, z);
      const k = 9 + 22 * Math.pow(Math.abs(Math.cos((a * 5) / 2)), 6);
      const face = 1.6 + 2.4 * Math.max(0, 1 - (Math.min(r, R) / R) ** 2);
      return Math.max(r - k, x - (face + 1.0), (face - 0.6) - x);
    }, [-1, -R - 8, -R - 8], [7, R + 8, R + 8]), 'gold', { thr: 0.2 });
  }
  b.autoShade({ up: 0.3, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Heilig Bogen at 48 vox/m: a great red bow of light, about his height — the main limbs in a deep curve, a second,
 * shallower pair of limbs (the "second set of handles") springing from the grip inside them, a thick string. Origin
 * at the grip, the limbs along ±Y, the back toward +Z (the string at −Z).
 */
function buildBow(): VoxelModel {
  const b = new ModelBuilder('heilig-bogen', 48);
  b.mat('red', ['#FF8A80', '#F04848', '#D8333A', '#C3232B', '#9A1820'], { base: 2, rough: 0.4, glow: 1.0, shadeK: 0.8 });
  b.mat('string', ['#FFC4BC'], { glow: 1.6 });
  b.bone('root', null, [0, 0, 0]);
  const limb = (H: number, depth: number, r0: number, r1: number) => {
    const pts: V3[] = [];
    for (let i = -10; i <= 10; i++) {
      const t = i / 10;
      pts.push([0, t * H, depth * (1 - t * t) - (Math.abs(t) > 0.85 ? (Math.abs(t) - 0.85) * 18 : 0)]);
    }
    return tube(pts, pts.map((p) => r1 + (r0 - r1) * (1 - Math.abs(p[1]) / H)));
  };
  b.add('root', limb(40, 9, 2.4, 1.0), 'red', { thr: 0.25 });
  b.add('root', limb(26, 4.5, 1.8, 0.9), 'red', { thr: 0.25 });
  b.add('root', box([0, 0, 3.6], [2.2, 4.4, 3.4], { round: 1 }), 'red');
  // the string between the tips
  b.add('root', cylinder([0, -37.5, -2.2], [0, 37.5, -2.2], 0.7), 'string');
  b.autoShade({ up: 0.3, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The Norse reishi helm of Aschtonig: a pale-gold bowl with a nasal, two swept wings of light. Origin at the crown's base. */
function buildNorseHelm(): VoxelModel {
  const b = new ModelBuilder('gerard-norse-helm', 48);
  b.mat('gold', ['#FBF0CC', '#F2E3A8', '#E8C866', '#D4A83A', '#B88A2C'], { base: 1, rough: 0.3, metal: 0.5, glow: 0.7, shadeK: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  // the bowl over the skull (the head's crown sits at y ≈ 5 above the origin)
  b.add('root', subtract(ellipsoid([0, 0.6, -0.4], [8.6, 8.4, 9.2]), ellipsoid([0, -0.4, -0.4], [7.2, 7.4, 7.8]), halfSpace([0, -3.4, 0], [0, 1, 0])), 'gold', { thr: 0.2 });
  b.add('root', box([0, -4.6, 8.4], [0.9, 3, 0.9], { round: 0.4 }), 'gold');
  b.add('root', fn((_x, y, z) => Math.max(Math.abs(y + 2.6) - 0.8, Math.abs(Math.hypot(_x, z + 0.4) - 8.6) - 0.8), [-10, -4, -10], [10, -1, 10]), 'gold', { thr: 0.2 });
  // the ridge, a spine of light from brow to nape
  b.add('root', intersect(ellipsoid([0, 1.4, -0.4], [1.2, 9.4, 10]), halfSpace([0, 2, 0], [0, -1, 0])), 'gold');
  for (const k of [1, -1]) {
    for (let i = 0; i < 3; i++) b.add('root', spike([k * 7.6, 0 + i * 1.8, -1 - i * 1.4], [k * 0.5, 0.82, -0.3 - i * 0.12], 13 - i * 2, 2.4, 0.9, { side: [0, 0.4, 1], tip: 0.45 }), 'gold', { thr: 0.25 });
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** Heiligen Fliegen: a pair of wings of pale golden light, spread. Origin between the shoulder blades, the wings out ±X and up. */
function buildWings(): VoxelModel {
  const b = new ModelBuilder('gerard-wings', 48);
  b.mat('light', ['#FFF6D8', '#F7EBC0', '#F2DA8E', '#E8C066'], { base: 1, rough: 0.5, glow: 1.0, shadeK: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  for (const k of [1, -1]) {
    b.add('root', capsule([k * 2, 0, -1], [k * 22, 18, -5], 2.4, 1.6), 'light');
    b.add('root', capsule([k * 22, 18, -5], [k * 44, 10, -8], 1.6, 1.0), 'light');
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const base: V3 = [k * (4 + t * 38), 2 + Math.sin(t * Math.PI) * 15 - t * 4, -1.6 - t * 6];
      const len = 26 - Math.abs(t - 0.35) * 16;
      b.add('root', spike(base, [k * (0.15 + t * 0.6), -1, -0.25], len, 3.2, 0.9, { side: [1, 0, 0], tip: 0.5 }), 'light', { thr: 0.25 });
    }
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
