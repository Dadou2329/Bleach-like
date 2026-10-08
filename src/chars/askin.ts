// Askin Nakk Le Vaar (docs/roster/H1-vandenreich-leaders.md § Askin Nakk Le Vaar; kit docs/kits/askin.md). Brief:
// 187 cm → 90 vox at 48/m (head 12.6, ≈ 1/7.1); tall and slim, a loose, lazy posture. Silhouette keys: the black hair
// slicked straight back to the neck with one strand falling down the face to the mouth; the light-grey ribbed V-collar
// over a long white shirt with a grey ribbed hem; baggy white harem trousers gathered below the knee into black pointed
// boots with grey soles and knobbed hoops; three bracers stacked on the left wrist (magenta, pink, orange) with grey disc
// knobs, one stamped with the Zeichen. Face: lavender eyes under heavy lids, kinky (wiggly) brows, full lips — smug and
// sleepy. The right hand carries a finger-gun variant (bone point.R: the index out, the thumb up). Forms: 'base'
// (Wahrwelt, cloakless); 'hasshein' (Quincy: Vollständig: the shirt gone but for the ribbed collar, purple reishi
// trousers and boots, an anklet each foot, ring-and-bead bracelets — one on the left wrist, three on the right — reishi
// circles over the arms and ten on the abs (one over the navel, nine in a ⊥), and two wings a side, each a chain of
// circles linked in a zigzag (molecular chains), on the wing bones). Props at 48 vox/m: 'bow' (the Heilig Bogen: the
// white stave, round at the limbs, its middle a zigzag of linked rings; the blue string), 'staff' (the Reishi Staff, a
// long purple rod studded with balls), 'thermos' (the café au lait) and 'halo' (the purple Zeichen with a circle on
// every point). The orange see-through visor is a mesh the kit sets on the face. (verify) the strand's side (his right
// of centre here); the bracers' order (orange at the wrist).
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, smoothPath, sphere, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, faceLegend, hands, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import { frontOf } from './sternritter';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const ASKIN_RES = 48;
export type AskinForm = 'base' | 'hasshein';

/** Tall and slim: long limbs, a narrow chest. */
const SPEC: HumanoidSpec = {
  H: 90,
  chinY: 77,
  head: { w: 10, d: 11, h: 12.6 },
  neckR: 2.4,
  shoulder: [9.2, 71.2, -0.5],
  upperArm: 15.6,
  foreArm: 14.0,
  hand: 9.4,
  armR: 2.3,
  hipsY: 48.4,
  hip: [4.4, 45, 0],
  kneeY: 24.8,
  ankleY: 4.8,
  chest: [7.8, 4.7],
  waist: [6.0, 3.9],
  hips: [6.8, 4.4],
  chestY: 65.2,
  waistY: 55,
  foot: { len: 13.6, w: 4.8, heel: 3.2 },
};

const PURPLE = ['#E6D2FF', '#D3B0FF', '#B88AF5', '#9C5CEB', '#7A3CC8'];

function palette(b: ModelBuilder, form: AskinForm): void {
  b.mat('skin', ['#F6E6DA', '#F0DCCC', '#E0C8B6', '#C9AE9B', '#AE937F'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#4A4856', '#383644', '#2A2833', '#211F28', '#17161C'], { base: 2, rough: 0.35, shadeK: 0.85, dither: 0.03 });
  b.mat('brow', ['#3E3A48']);
  b.mat('lid', ['#5A4A5C']);
  b.mat('sclera', ['#F3F3F0']);
  b.mat('iris', ['#B39BD8']);
  b.mat('irisD', ['#5E4A86']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('lip', ['#D9A89E']);
  b.mat('lipD', ['#C4918A']);
  b.mat('rib', ['#C8C8CE', '#B6B6BE', '#A2A2AC', '#8C8C96'], { base: 1, rough: 0.85, shadeK: 0.9 });
  b.mat('grey', ['#B4B4BA', '#9C9CA3', '#84848C'], { base: 1, rough: 0.35, metal: 0.5 });
  b.mat('print', ['#F2F3F0']);
  if (form === 'base') {
    b.mat('coat', ['#F3F3F0', '#F1F2EF', '#DDE0E4', '#C9CCD3', '#A4ABB8'], { base: 1, rough: 0.75, shadeK: 0.9 });
    b.mat('coatIn', ['#D9DCE2', '#C3C8D0', '#A5ACB8'], { base: 1, rough: 0.8 });
    b.mat('boot', ['#3A3940', '#2E2D34', '#232228', '#1A1A1F'], { base: 1, rough: 0.45, shadeK: 0.85 });
    b.mat('sole', ['#9A9AA1', '#8A8A91', '#76767E'], { base: 1, rough: 0.6 });
    b.mat('magenta', ['#D8338A', '#C0186F', '#9A1258'], { base: 1, rough: 0.4 });
    b.mat('pink', ['#F7A0C8', '#F07DB2', '#D45F96'], { base: 1, rough: 0.4 });
    b.mat('orange', ['#F8A65A', '#F08A2A', '#C86C1A'], { base: 1, rough: 0.4 });
  } else {
    b.mat('reishi', PURPLE, { base: 3, rough: 0.3, glow: 0.45, dither: 0 });
    // the trousers and boots of reishi: solid, a soft glow
    b.mat('rtrou', ['#B48AE8', '#9C6CDC', '#8452C8', '#6A3CA8', '#52307F'], { base: 2, rough: 0.4, glow: 0.12, shadeK: 0.9 });
  }
}

/** Heavy lids over lavender eyes, kinky brows (a zigzag), full lips. Rows 9 → 0. */
const FACE = [
  '. . . . . . . . . .',
  '. B B . . . . B B .',
  '. . . B . . B . . .',
  '. . . . . . . . . .',
  '. L L L . . L L L .',
  '. W I i . . i I W .',
  '. . . . . s . . . .',
  '. . . m m m m . . .',
  '. . . . D D . . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<AskinForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function askinAsset(form: AskinForm = 'base'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildAskin(form)));
  return a;
}

/**
 * 'bow' (the grip at the origin, the limbs along ±Z, the string toward +Y: set on the 'bracer' socket it stands upright
 * across the forearm when the arm points at the target), 'staff' (the grip at the origin, the rod along ±Z), 'thermos'
 * (the grip at the origin, its axis along +Z), 'halo' (facing +Z).
 */
export type AskinProp = 'bow' | 'staff' | 'thermos' | 'halo';

export function askinProp(kind: AskinProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) propCache.set(kind, (m = kind === 'bow' ? buildBow() : kind === 'staff' ? buildStaff() : kind === 'thermos' ? buildThermos() : buildHalo()));
  return m;
}

/** the staff's half-length and the bow's half-length (m) */
export const STAFF_HALF = 50 / 48;
export const BOW_HALF = 36 / 48;
/** the ball studs along the staff, in its frame (m along +Z) */
export const STAFF_BALLS = [-42, -28, -14, 14, 28, 42].map((z) => z / 48);
/** the wing bones (Hasshein) */
export const WING_BONES = ['wing.L', 'wing.R'];

export function buildAskin(form: AskinForm = 'base'): CharacterAsset {
  const b = new ModelBuilder(`askin-${form}`, ASKIN_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.6, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.6, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5.2, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5.2, wz + 1]);
  b.socket('back', 'chest', [0, s.chestY + 2, -8]);
  b.socket('chest.front', 'chest', [0, s.chestY, s.chest[1] + 2]);
  b.socket('toe.R', 'foot.R', [-L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel + 1]);
  b.socket('toe.L', 'foot.L', [L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel + 1]);
  // the bow springs out of the Zeichen knob on the outside of the left bracers
  b.socket('bracer', 'forearm.L', [wx + 3.6, wy + 3.4, wz]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 2, hd.front + 0.5]);
  b.socket('eye.L', 'head', [2.5, s.chinY + 5.5, hd.front + 0.3]);
  b.socket('eye.R', 'head', [-2.5, s.chinY + 5.5, hd.front + 0.3]);
  b.socket('halo', 'head', [0, s.chinY + 10, hd.front - s.head.d - 6]);
  // high cheekbones: the cheeks taken in under them
  for (const k of [-1, 1]) b.carve('head', box([k * 5.4, hd.chin + 1.4, hd.front - 2], [0.9, 2.0, 3], { rot: [0, 0, k * 16] }));
  b.stamp('head', hd.x0, hd.chin + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'lip', inner: 'lipD' }) }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  const hair = slickedHair(b, L, hd);
  hands(b, L, 'skin');
  fingerGun(b, L);
  const torso = body(b, L, form);
  if (form === 'base') {
    shirt(b, L);
    bracers(b, L);
  } else {
    bareTorso(b, L);
    hassheinBits(b, L);
    wings(b, L);
  }
  legs(b, L, form);
  b.autoShade();
  b.lint();
  return {
    model: b.build(),
    springs: hair.springs,
    colliders: [...hair.colliders, { bone: 'thigh.L', offset: [0, -0.1, 0.02], radius: 0.12 }, { bone: 'thigh.R', offset: [0, -0.1, 0.02], radius: 0.12 }],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- head

/**
 * The hair slicked straight back: a close cap from a high hairline over the crown, combed lines running back, the
 * ends lying on the nape at neck length and lifting a little. One strand falls from the hairline down his face to the
 * corner of the mouth, on its own spring bone.
 */
function slickedHair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const back = front - s.head.d;
  const cz = L.headC[2];
  const hw = s.head.w / 2;
  // the cap: the cranium grown by a voxel and a half, above a hairline that rises over the temples
  const cap = fn((x, y, z) => {
    const e = Math.hypot(x / (hw + 1.4), (y - (c + 7.2)) / 7.4, (z - (cz - 0.4)) / (s.head.d / 2 + 1.3)) - 1;
    // the hairline: high on the forehead, receding over the temples, close over the ears, down to the nape only at
    // the very back
    const line = c + 10.6 - Math.max(0, z - (front - 3.5)) * 0.15 + Math.max(0, Math.abs(x) - 2.5) * 0.35;
    const side = c + 8.4;
    const nape = c + 2.2 + Math.abs(x) * 0.35;
    const k = Math.max(0, Math.min(1, ((back + 5.5) - z) / 3));
    const hairline = z > front - 4.2 ? line - y : side + (nape - side) * k - y;
    return Math.max(e * 6, hairline);
  }, [-hw - 3, c - 2, back - 3], [hw + 3, c + 16, front + 2]);
  b.add('head', cap, 'hair', { thr: 0.2 });
  // the slicked mass at the back, lying on the nape at neck length and lifting at the ends
  b.add('head', fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (c + 6 - y) / 7));
    const zb = back - 0.4 - t * 1.2 + t * t * 2.0;
    const w = hw - 0.4 - t * 1.6;
    return Math.max(Math.abs(x) - w, Math.abs(z - zb) - (2.0 - t * 0.6), y - (c + 8), (c - 1.0) - y);
  }, [-hw - 3, c - 4, back - 6], [hw + 3, c + 9, back + 4]), 'hair', { thr: 0.25 });
  // combed grooves running back
  b.paint('head', fn((x) => Math.abs(((x + 40) % 2.6) - 1.3) - 0.35, [-hw - 3, c + 6, back - 6], [hw + 3, c + 16, front + 2]), 'hair', { shade: 4, where: b.isMat('hair') });
  b.paint('head', fn((x, y, z) => Math.max(Math.abs(x + 0.6) - 0.8, -(y - (c + 12.8)), -(z - (cz - 1))), [-4, c + 10, back], [4, c + 16, front + 2]), 'hair', { shade: 0, where: b.isMat('hair') });
  // the strand down the face: from the hairline just right of centre, over the bridge of the nose, to the mouth's corner
  const top: V3 = [-0.5, c + 11.2, front - 0.6];
  b.bone('strand', 'head', top);
  const path = smoothPath([top, [-0.5, c + 9.8, front + 0.5], [-0.5, c + 6.4, front + 0.5], [-0.5, c + 3.6, front + 0.5], [-1.6, c + 2.2, front + 0.7]], 4);
  b.add('strand', tube(path, path.map(() => 0.45)), 'hair', { thr: 0.25, shade: 0 });
  return {
    springs: [{ bone: 'strand', tail: [-0.035, -0.19, 0.04], stiffness: 140, damping: 8, gravity: 6, limit: 25, radius: 0.02 }],
    colliders: [],
  };
}

// ---------------------------------------------------------------------------------------------- hands

/** The finger-gun on the right hand: the index straight out, the thumb up, the rest curled. */
function fingerGun(b: ModelBuilder, L: Landmarks): void {
  const [wx0, wy, wz] = L.wrist;
  const wx = -wx0;
  const kn = wy - 5.4;
  b.bone('point.R', 'hand.R', [wx, wy, wz]);
  b.add('point.R', box([wx, wy - 3, wz + 0.2], [1.5, 2.9, 2.6], { round: 1 }), 'skin');
  b.add('point.R', capsule([wx, wy + 0.5, wz], [wx, wy - 1.5, wz], 1.9), 'skin');
  // the index, out along the hand
  b.add('point.R', capsule([wx, kn + 0.6, wz + 1.9], [wx, kn - 5.0, wz + 2.0], 0.95, 0.8), 'skin', { thr: 0.2 });
  // the three curled under
  for (const z of [wz + 0.6, wz - 0.7, wz - 1.9]) b.add('point.R', capsule([wx + 0.2, kn + 0.2, z], [wx + 1.6, kn - 1.4, z], 1.0), 'skin', { thr: 0.2 });
  // the thumb, up (toward the back of the hand's top, along +Z)
  b.add('point.R', capsule([wx + 1.2, wy - 2.2, wz + 2.4], [wx + 1.0, wy - 3.0, wz + 5.2], 1.0, 0.85), 'skin', { thr: 0.2 });
  b.socket('finger', 'point.R', [wx, kn - 5.8, wz + 2.0]);
}

// ---------------------------------------------------------------------------------------------- body & clothes

function torsoSdf(L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  return blend(2.6,
    box([0, s.chestY - 0.5, -0.3], [cx, 6.2, cz], { round: 3 }),
    box([0, s.waistY, -0.2], [wx, 4.8, wz], { round: 2.6 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.8, s.hips[1]], { round: 2.4 }),
    capsule([2.2, sy + 1.4, sz - 0.7], [sx - 1.3, sy - 0.2, sz], 2.5, 2.6), capsule([-2.2, sy + 1.4, sz - 0.7], [-sx + 1.3, sy - 0.2, sz], 2.5, 2.6),
    sphere([sx, sy - 0.5, sz], 3.0), sphere([-sx, sy - 0.5, sz], 3.0));
}

/** The torso (in the shirt, or bare), the neck, the arms (sleeved, or bare); the ribbed V-collar in both forms. */
function body(b: ModelBuilder, L: Landmarks, form: AskinForm): Sdf {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const torso = torsoSdf(L);
  const bare = form === 'hasshein';
  const cloth = bare ? 'skin' : 'coat';
  addBands(b, bare ? torso : blend(0.6, torso, box([0, s.hipsY - 1, -0.2], [s.hips[0] + 0.4, 3.0, s.hips[1] + 0.4], { round: 2 })), cloth, [['hips', 36, 52], ['spine', 52, 59], ['chest', 59, 90]]);
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.5], [0, s.chinY + 2, L.headC[2] - 0.5], s.neckR), 'skin');
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.2, sphere([sx, sy - 0.5, sz], 3.1), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], bare ? 2.5 : 2.9, bare ? 2.2 : 2.6)), cloth, { mirror: true });
  b.add('forearm.L', blend(1.1, sphere([sx, ey, sz], bare ? 2.3 : 2.6), capsule([sx, ey - 0.5, sz], [sx, wy + 1.4, sz], bare ? 2.2 : 2.6, bare ? 1.8 : 2.3)), cloth, { mirror: true });
  if (!bare) {
    // the ribbed cuffs, a little loose
    b.add('forearm.L', cylinder([sx, wy + 0.2, sz], [sx, wy + 3.0, sz], 2.75), 'rib', { mirror: true });
    b.paint('forearm.L', fn((x, _y, z) => Math.abs(((Math.atan2(z - sz, x - sx) * 8 + 40) % 2) - 1) - 0.45, [sx - 5, wy - 1, sz - 5], [sx + 5, wy + 4, sz + 5]), 'rib', { mirror: true, shade: 2, where: b.isMat('rib') });
  } else {
    // the abdomen's lines on the bare torso
    b.paint('spine', fn((x, y, z) => Math.max(Math.abs(x) - 0.4, Math.abs(y - (s.waistY + 1)) - 4.5, -(z - 2)), [-3, s.waistY - 6, -2], [3, s.waistY + 7, 8]), 'skin', { shade: 3, where: b.isMat('skin') });
    b.paint('chest', fn((x, y, z) => Math.max(Math.abs(Math.abs(x) - 3.6) - 0.4, Math.abs(y - (s.chestY - 3.2)) - 0.45, -(z - 2)), [-7, s.chestY - 5, -2], [7, s.chestY - 1, 8]), 'skin', { shade: 3, where: b.isMat('skin') });
  }
  ribCollar(b, L);
  return torso;
}

/** The light-grey ribbed collar: a thick roll round the base of the neck, its fronts crossing down into a V. */
function ribCollar(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const nz = L.headC[2] - 0.6;
  const y0 = s.chinY - 5.4;
  const vY = s.chestY - 0.5;
  const collar = fn((x, y, z) => {
    // the roll round the neck
    const roll = Math.hypot(Math.hypot(x, (z - nz) * 1.05) - (s.neckR + 2.0), (y - y0) * 0.9) - 1.5;
    // the two fronts of the V, lying on the chest down to the point
    const t = Math.max(0, Math.min(1, (y0 - y) / (y0 - vY)));
    const xc = (1 - t) * (s.neckR + 2.0);
    const zf = L.spec.chest[1] + 0.6 + t * 0.4;
    const front = Math.max(Math.abs(Math.abs(x) - xc * 0.95) - 1.6, Math.abs(z - zf) - 0.9, y - (y0 + 0.5), vY - y);
    return Math.min(roll, front);
  }, [-10, vY - 2, nz - 8], [10, y0 + 3, nz + 12]);
  b.add('chest', collar, 'rib', { thr: 0.2 });
  // the ribs, in vertical lines
  b.paint('chest', fn((x) => Math.abs(((x + 40) % 1.6) - 0.8) - 0.3, [-10, vY - 2, nz - 8], [10, y0 + 3, nz + 12]), 'rib', { shade: 2, where: b.isMat('rib') });
}

/**
 * The long white shirt: its front crossing over from his right to his left under the collar's V, held by a grey disc
 * brooch; the grey ribbed hem round the hips.
 */
function shirt(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  // the overlap's edge: a fold line running down from the V to the hem, to his left
  b.paint(['chest', 'spine', 'hips'], fn((x, y, z) => {
    const xe = 0.6 + (s.chestY - 1 - y) * 0.16;
    return Math.max(Math.abs(x - xe) - 0.55, y - (s.chestY - 1), (s.hipsY - 1) - y, -z);
  }, [-6, s.hipsY - 2, 0], [8, s.chestY + 1, 10]), 'coat', { shade: 3, where: b.isMat('coat') });
  // the disc brooch at the overlap, on the shirt's surface
  const by = Math.round(s.chestY - 4);
  const f = frontOf(b, ['chest'], 2, by);
  const z = f ? f.z : s.chest[1];
  b.add('chest', cylinder([2, by + 0.5, z - 0.5], [2, by + 0.5, z + 1.4], 1.6), 'grey', { thr: 0.2 });
  b.voxel('chest', 1, by, Math.round(z + 1.6), 'grey', 0);
  // the ribbed hem
  const hy = s.hipsY - 2.6;
  b.add('hips', box([0, hy, -0.2], [s.hips[0] + 1.2, 1.5, s.hips[1] + 1.1], { round: 1.4 }), 'rib');
  b.paint('hips', fn((x) => Math.abs(((x + 40) % 1.6) - 0.8) - 0.3, [-10, hy - 2, -8], [10, hy + 2, 8]), 'rib', { shade: 2, where: b.isMat('rib') });
}

/** Three bracers stacked on the left wrist — orange at the wrist, pink, magenta — each with a grey disc knob outside. */
function bracers(b: ModelBuilder, L: Landmarks): void {
  const [wx, wy, wz] = L.wrist;
  const mats = ['orange', 'pink', 'magenta'];
  mats.forEach((m, i) => {
    const y = wy + 1.0 + i * 2.1;
    b.add('forearm.L', cylinder([wx, y - 0.95, wz], [wx, y + 0.95, wz], 3.05), m, { thr: 0.1 });
    b.add('forearm.L', cylinder([wx + 2.6, y, wz], [wx + 3.8, y, wz], 1.0), 'grey', { thr: 0.2 });
  });
  // the Zeichen knob, bigger, on the middle bracer
  const y = wy + 3.1;
  b.add('forearm.L', cylinder([wx + 2.6, y, wz], [wx + 4.2, y, wz], 1.7), 'grey', { thr: 0.2 });
  for (const [dy, dz] of [[1, 0], [0, -1], [0, 0], [0, 1], [-1, -1], [-1, 1]]) b.voxel('forearm.L', Math.round(wx + 4.2), Math.round(y) + dy, Math.round(wz) + dz, 'print', 0);
}

/** Hasshein: the torso bare; the ten reishi circles on the abs (one over the navel, nine in a ⊥). */
function bareTorso(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const ny = Math.round(s.waistY - 2.5);
  const at: [number, number][] = [[0, ny], [-3, ny], [3, ny], [-6, ny], [6, ny], [0, ny + 3], [0, ny + 6], [0, ny + 9], [0, ny + 12], [0, ny + 15]];
  for (const [x, y] of at) {
    const bone = y < s.waistY - 1 ? 'hips' : y < s.chestY - 4 ? 'spine' : 'chest';
    circleFront(b, bone, x, y);
  }
}

/** a little reishi circle (a 3×3 diamond) proud of the front surface at (x, y) */
function circleFront(b: ModelBuilder, bone: string, x: number, y: number): void {
  const g = b.grid(bone);
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
    const xx = x + dx, yy = y + dy;
    for (let z = 30; z > -10; z--) if (g.get(xx, yy, z) !== 0) {
      b.voxel(bone, xx, yy, z + 1, 'reishi', 1);
      b.voxel(bone, xx, yy, z, 'reishi', 2);
      break;
    }
  }
}

/** a reishi circle proud of an arm's outer side (k = +1 left, −1 right) */
function circleOut(b: ModelBuilder, bone: string, k: number, y: number, z: number): void {
  const g = b.grid(bone);
  for (const [dy, dz] of [[1, 0], [0, -1], [0, 1], [-1, 0]]) {
    const yy = y + dy, zz = z + dz;
    for (let x = k * 20; Math.abs(x) > 2; x -= k) if (g.get(x, yy, zz) !== 0) {
      b.voxel(bone, x + k, yy, zz, 'reishi', 1);
      b.voxel(bone, x, yy, zz, 'reishi', 2);
      break;
    }
  }
}

/** Hasshein: the bracelets (rings and beads: one on the left wrist, three on the right) and the circles on the arms. */
function hassheinBits(b: ModelBuilder, L: Landmarks): void {
  const [sx, sy, sz] = L.spec.shoulder;
  const [wx, wy, wz] = L.wrist;
  const ey = L.elbow[1];
  const bracelet = (bone: string, x: number, y: number): void => {
    b.add(bone, torus([x, y, wz], 2.6, 0.55), 'reishi', { thr: 0.25 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.add(bone, sphere([x + Math.cos(a) * 2.7, y, wz + Math.sin(a) * 2.7], 0.9), 'reishi', { thr: 0.1, shade: 1 });
    }
  };
  bracelet('forearm.L', wx, wy + 2.2);
  for (let i = 0; i < 3; i++) bracelet('forearm.R', -wx, wy + 2.2 + i * 2.4);
  // five circles over the left arm, three over the right forearm
  for (const y of [sy - 4, sy - 9, ey + 3]) circleOut(b, 'upperarm.L', 1, Math.round(y), Math.round(sz));
  for (const y of [ey - 3, ey - 7]) circleOut(b, 'forearm.L', 1, Math.round(y), Math.round(sz));
  for (const y of [ey - 2, ey - 5.5, ey - 9]) circleOut(b, 'forearm.R', -1, Math.round(y), Math.round(sz));
  void sx;
}

/**
 * Hasshein's wings: two chains a side, each a purple beam zigzagging between circles like a molecule — the upper one
 * rising and spreading, the lower one reaching out and down — from a node between the shoulder blades.
 */
function wings(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [, sy] = s.shoulder;
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    const root: V3 = [k * 2.6, sy - 4, -s.chest[1] - 1.4];
    b.bone(`wing.${side}`, 'chest', root);
    b.add(`wing.${side}`, sphere(root, 1.9), 'reishi');
    // [angle above horizontal (deg), length, back lean]
    for (const [deg, len, lean] of [[38, 46, 0.25], [-14, 38, 0.18]] as const) {
      const a = (deg * Math.PI) / 180;
      const dir: V3 = [k * Math.cos(a), Math.sin(a), -lean];
      const n = Math.hypot(dir[0], dir[1], dir[2]);
      const d: V3 = [dir[0] / n, dir[1] / n, dir[2] / n];
      // the zigzag's sideways axis: in the wing's plane, across the chain
      const sideV: V3 = [-Math.sin(a) * k, Math.cos(a), 0];
      const steps = Math.floor(len / 6.5);
      let prev: V3 = root;
      for (let i = 1; i <= steps; i++) {
        const t = i * 6.5;
        const off = (i % 2 === 0 ? 1 : -1) * 2.4;
        const p: V3 = [root[0] + d[0] * t + sideV[0] * off, root[1] + d[1] * t + sideV[1] * off, root[2] + d[2] * t + sideV[2] * off];
        b.add(`wing.${side}`, capsule(prev, p, 0.55), 'reishi', { thr: 0.25 });
        // the circle at the vertex: a ring facing back, bigger toward the tip
        const R = 1.6 + (i === steps ? 0.6 : 0);
        b.add(`wing.${side}`, torus(p, R, 0.55, [90, 0, 0]), 'reishi', { thr: 0.25, shade: i % 2 === 0 ? 1 : 2 });
        prev = p;
      }
    }
  }
}

/** The harem trousers, baggy and gathered below the knee (white, or reishi); the pointed boots with their knobbed hoops. */
function legs(b: ModelBuilder, L: Landmarks, form: AskinForm): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  const bare = form === 'hasshein';
  const tr = bare ? 'rtrou' : 'coat';
  const boot = bare ? 'rtrou' : 'boot';
  const gy = ky - 3.6;
  // the baggy legs: full through the thigh, ballooning over the knee, gathered tight below it
  b.add('thigh.L', blend(1.6, sphere([hx + 0.3, hy - 0.5, hz], 4.1), capsule([hx + 0.2, hy - 1, hz], [kx + 0.3, ky + 1.5, kz + 0.3], 4.2, 3.9)), tr, { mirror: true });
  b.add('shin.L', blend(1.4, ellipsoid([kx + 0.2, ky - 0.6, kz + 0.4], [3.9, 3.6, 3.9]), capsule([kx, ky - 1, kz], [kx, gy + 0.8, kz], 3.7, 2.9)), tr, { mirror: true });
  // folds round the knee
  b.paint('thigh.L', fn((x, y, z) => Math.abs(((y + z * 0.4 + 40) % 3.2) - 1.6) - 0.35 + (Math.abs(x - hx) > 3.3 ? 0 : 0), [hx - 6, ky, -7], [hx + 6, hy, 7]), tr, { mirror: true, shade: bare ? 3 : 3, where: b.isMat(tr) });
  if (!bare) {
    // the gather: a grey ribbed band below the knee
    b.add('shin.L', cylinder([kx, gy - 0.9, kz], [kx, gy + 0.9, kz], 3.0), 'rib', { mirror: true });
    b.paint('shin.L', fn((x, _y, z) => Math.abs(((Math.atan2(z - kz, x - kx) * 8 + 40) % 2) - 1) - 0.45, [kx - 5, gy - 2, kz - 5], [kx + 5, gy + 2, kz + 5]), 'rib', { mirror: true, shade: 2, where: b.isMat('rib') });
  }
  // the boot from the gather down, close on the calf
  b.add('shin.L', capsule([kx, gy - 0.6, kz], [ax, ay + 0.6, az], 2.5, 2.2), boot, { mirror: true });
  // the knobbed hoops round the boot's top and the ankle
  const hoops = bare ? [ay + 1.4] : [gy - 1.8, ay + 3.0];
  for (const y of hoops) {
    b.add('shin.L', torus([kx, y, kz], bare ? 2.6 : 2.65, 0.55), 'grey', { mirror: true, thr: 0.2 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      b.add('shin.L', sphere([kx + Math.cos(a) * 2.8, y, kz + Math.sin(a) * 2.8], 0.85), 'grey', { mirror: true, thr: 0.1, shade: 0 });
    }
  }
  // the pointed foot, the toe drawn out to a point
  const f = s.foot;
  const toeZ = az + f.len - f.heel;
  b.add('foot.L', capsule([ax, ay + 1.6, az - 0.3], [ax, ay - 1.2, az - 0.3], 2.3), boot, { mirror: true });
  b.add('foot.L', fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (z - (az - f.heel)) / (toeZ + 1.5 - (az - f.heel))));
    const w = f.w / 2 + 0.3 - Math.max(0, t - 0.55) * 4.6;
    const h = 4.2 - Math.max(0, t - 0.35) * 3.8 + Math.max(0, t - 0.92) * 6;
    return Math.max(Math.abs(x - ax) - w, y - h, -y, z - (toeZ + 1.5), (az - f.heel - 0.4) - z);
  }, [ax - 6, -1, az - f.heel - 2], [ax + 6, 6, toeZ + 3]), boot, { mirror: true, thr: 0.25 });
  if (!bare) {
    b.paint('foot.L', aabb([ax - 6, 0, az - 9], [ax + 6, 0.8, toeZ + 4]), 'sole', { mirror: true });
    b.add('foot.L', box([ax, 1.0, az - f.heel + 1.1], [1.6, 1.0, 1.4], { round: 0.3 }), 'sole', { mirror: true });
  }
}

// ---------------------------------------------------------------------------------------------- props

function purpleMats(b: ModelBuilder): void {
  b.mat('reishi', PURPLE, { base: 3, rough: 0.3, glow: 0.5, dither: 0 });
  b.mat('core', ['#F4ECFF', '#E6D2FF'], { base: 0, rough: 0.2, glow: 1.0, dither: 0 });
}

/**
 * The Heilig Bogen: a longbow, the white stave round in section at the limbs, its middle a zigzag of linked rings; the
 * tips bent back toward him; the blue string. The grip at the origin, the limbs along ±Z, the string toward +Y.
 */
function buildBow(): VoxelModel {
  const b = new ModelBuilder('askin-bow', 48);
  b.mat('stave', ['#F4F4F2', '#E6E7EA', '#CCD0D8', '#AEB4C0'], { base: 1, rough: 0.35 });
  b.mat('string', ['#BFE0FF', '#8CC6FF', '#6CB6FF'], { base: 1, rough: 0.2, glow: 0.8, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  const H = 36;
  // the limbs: from the zigzag's ends out to the tips, curving back toward +Y
  for (const k of [1, -1]) {
    const pts = smoothPath([[0, -0.4, k * 9], [0, -1.2, k * 20], [0, 0.4, k * 30], [0, 3.4, k * H]], 4);
    b.add('root', tube(pts, pts.map((_, i) => 1.35 - (i / pts.length) * 0.55)), 'stave', { thr: 0.2 });
    b.add('root', sphere([0, 3.6, k * H], 1.2), 'stave', { thr: 0.1 });
  }
  // the middle: rings linked in a zigzag
  let prev: V3 = [0, -0.4, -9];
  for (let i = 0; i <= 6; i++) {
    const z = -9 + i * 3;
    const p: V3 = [0, -0.4 + (i % 2 === 0 ? -1.1 : 1.1), z];
    b.add('root', torus(p, 1.25, 0.5, [0, 0, 90]), 'stave', { thr: 0.25 });
    b.add('root', capsule(prev, p, 0.55), 'stave', { thr: 0.25 });
    prev = p;
  }
  b.add('root', capsule(prev, [0, -0.4, 9], 0.55), 'stave', { thr: 0.25 });
  // the string, tip to tip
  b.add('root', capsule([0, 3.6, -H + 0.4], [0, 3.6, H - 0.4], 0.45), 'string', { thr: 0.3 });
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** The Reishi Staff: a long purple rod studded with balls, the grip at the origin, along ±Z. */
function buildStaff(): VoxelModel {
  const b = new ModelBuilder('askin-staff', 48);
  purpleMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', capsule([0, 0, -50], [0, 0, 50], 0.95), 'reishi', { thr: 0.2 });
  for (const z of [-42, -28, -14, 14, 28, 42]) b.add('root', sphere([0, 0, z], 2.4), 'reishi', { thr: 0.1, shade: 1 });
  for (const k of [1, -1]) b.add('root', sphere([0, 0, k * 50], 1.6), 'core', { thr: 0.1 });
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** The thermos of café au lait: a slim flask, the cup for a lid. The grip at the origin, the axis along +Z. */
function buildThermos(): VoxelModel {
  const b = new ModelBuilder('askin-thermos', 48);
  b.mat('flask', ['#E9E6DF', '#D6D2C8', '#BBB6AA', '#9C978B'], { base: 1, rough: 0.4, metal: 0.4 });
  b.mat('cup', ['#C9A27A', '#A8805A', '#86613F'], { base: 1, rough: 0.5 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', cylinder([0, 0, -4.5], [0, 0, 4.5], 2.2, 2.2, 0.6), 'flask');
  b.add('root', cylinder([0, 0, 4.4], [0, 0, 7.4], 2.5, 2.7, 0.5), 'cup');
  b.paint('root', cylinder([0, 0, -3.2], [0, 0, -2.4], 2.4), 'cup', { where: b.isMat('flask') });
  b.autoShade({ up: 0.3, open: 1, front: 0 });
  b.lint();
  return b.build();
}

/** Hasshein's halo: the purple Zeichen, a circle on every point. Facing +Z. */
function buildHalo(): VoxelModel {
  const b = new ModelBuilder('askin-halo', 48);
  purpleMats(b);
  b.bone('root', null, [0, 0, 0]);
  const R = 12;
  for (const a of [90, 0, 180, -55, -125]) {
    const r = (a * Math.PI) / 180;
    const tip: V3 = [Math.cos(r) * R, Math.sin(r) * R, 0];
    b.add('root', capsule([0, 0, 0], tip, 1.3, 0.9), 'reishi', { thr: 0.2 });
    b.add('root', torus([Math.cos(r) * (R + 2.2), Math.sin(r) * (R + 2.2), 0], 2.2, 0.7, [90, 0, 0]), 'reishi', { thr: 0.25, shade: 1 });
  }
  b.add('root', sphere([0, 0, 0], 2.2), 'core');
  b.autoShade({ up: 0.2, open: 1, front: 0 });
  b.lint();
  return b.build();
}

