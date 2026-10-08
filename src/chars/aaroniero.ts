// Aaroniero Arruruerie — Noveno Espada (docs/roster/E2-espada-2.md §5, A3 §7 for Nejibana). Brief: 205 cm, 98 voxels
// at 47.8 vox/m; tall, upright, aristocratic, the body hidden by long garments. Silhouette keys: the tall white mask
// with eight holes (in light, among the Espada), the long white garb to the floor, a frilly noble's coat with a
// ruffled collar, a jabot and ruffled cuffs, one white glove on the left hand (Glotonería under it).
// The head is a prop on the head bone, swapped by the kit: the mask; the glass capsule of red liquid with two small
// masked heads (the true head, in sunlight; built at twice the body's density); Kaien Shiba's head (in shadow: spiky
// black hair with a violet sheen, aqua-green eyes, the grin).
// Weapons: Nejibana sealed (a square gold guard with cut corners, a dark-blue wrap with gold diamonds, a brown sheath)
// and released (a 2.4 m silver trident: a leaf-shaped central head, two outward side blades each joined to it by two
// bars, a thick blue tassel, a corkscrew butt); the Glotonería maw (brown tentacles round a toothed mouth).
// Glotonería: the upper body raised on a vast dark-purple mass (12 vox/m: stubby tentacles, red eyes, toothed mouths,
// a blobfish face, the bubbling pool where eaten masks surface) and a long tentacle for the slams.
// (verify) the mask's hole layout, the little heads' skin, the Kaien aspect's clothes.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, hands, head, humanoidSkeleton, spikeHair, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 98 voxels = 2.05 m */
export const AARONIERO_RES = 98 / 2.05;
export type AaronieroForm = 'sealed' | 'glotoneria';
export type AaronieroHead = 'mask' | 'capsule' | 'kaien';

const SPEC: HumanoidSpec = {
  H: 98,
  chinY: 84,
  head: { w: 12, d: 12, h: 13 },
  neckR: 2.8,
  shoulder: [10.2, 78.5, -0.5],
  upperArm: 16,
  foreArm: 14.5,
  hand: 10,
  armR: 2.8,
  hipsY: 52,
  hip: [4.8, 49, 0],
  kneeY: 27,
  ankleY: 5,
  chest: [9, 5.4],
  waist: [7.2, 4.6],
  hips: [7.8, 5],
  chestY: 71,
  waistY: 60,
  foot: { len: 13, w: 5.5, heel: 3 },
};

/** Glotonería: the upper body raised onto the mass (the legs are inside it) */
export const MASS_RES = 12;
/** the mass: half-width and height (m) */
export const MASS_W = 5;
export const MASS_H = 3.6;
const LIFT = Math.round(MASS_H * AARONIERO_RES - (SPEC.waistY - 4));
const SPEC_GLOT: HumanoidSpec = {
  ...SPEC,
  H: SPEC.H + LIFT,
  chinY: SPEC.chinY + LIFT,
  shoulder: [SPEC.shoulder[0], SPEC.shoulder[1] + LIFT, SPEC.shoulder[2]],
  hipsY: SPEC.hipsY + LIFT,
  hip: [SPEC.hip[0], SPEC.hip[1] + LIFT, 0],
  kneeY: SPEC.kneeY + LIFT,
  ankleY: SPEC.ankleY + LIFT,
  chestY: SPEC.chestY + LIFT,
  waistY: SPEC.waistY + LIFT,
};
/** how far the Glotonería body's head is raised (m): the head props ride on it */
export const GLOT_LIFT = LIFT / AARONIERO_RES;

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#F7DCC4', '#F2D0B0', '#E8BDA0', '#C99A7E', '#AB7767'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('white', ['#F3F3F0', '#ECEBE6', '#DCDAD3', '#C8C6BF', '#A9A8A2'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('frill', ['#F3F3F0', '#E6E4DE', '#CFCCC4', '#B5B2AA'], { base: 0, rough: 0.82, shadeK: 1 });
  b.mat('robe', ['#F3F3F0', '#E8E7E2', '#D9D7D0', '#C9C7C0'], { base: 1, rough: 0.85, shadeK: 0.5 });
  b.mat('glove', ['#F3F3F0', '#E8E7E2', '#D2D0C9'], { base: 0, rough: 0.6 });
  b.mat('shoe', ['#2E2E33', '#1F1F24', '#141418'], { base: 1, rough: 0.5 });
  b.mat('line', ['#ECECEC'], { rough: 0.6 });
}

const assetCache = new Map<AaronieroForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function aaronieroAsset(form: AaronieroForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildAaroniero(form)));
  return a;
}

export type AaronieroProp = AaronieroHead | 'katana' | 'sheath' | 'sheath-empty' | 'nejibana' | 'maw' | 'mass' | 'tentacle' | 'glot-mask' | 'glot-capsule' | 'glot-kaien';

export function aaronieroProp(kind: AaronieroProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    const lift = kind.startsWith('glot-') ? LIFT : 0;
    const k = kind.replace('glot-', '') as AaronieroProp;
    m = k === 'mask' ? buildMask(lift) : k === 'capsule' ? buildCapsule(lift) : k === 'kaien' ? buildKaienHead(lift)
      : k === 'katana' ? buildKatana() : k === 'sheath' ? buildSheath(true) : k === 'sheath-empty' ? buildSheath(false)
      : k === 'nejibana' ? buildNejibana() : k === 'maw' ? buildMaw() : k === 'mass' ? buildMass() : buildTentacle();
    propCache.set(kind, m);
  }
  return m;
}

/** blade sample points (prop frame, m): the sealed katana and the trident's central head */
export const KATANA_BASE_Z = 5 / 48;
export const KATANA_TIP_Z = 38 / 48;
export const NEJIBANA_BASE_Z = 50 / 48;
export const NEJIBANA_TIP_Z = 82 / 48;
/** the trident's butt end (prop frame, m) */
export const NEJIBANA_BUTT_Z = -33 / 48;
/** the capsule's floor above the head bone's socket origin (m), its radius and the height of its walls: the kit wraps the
 * glass and liquid on it */
export const CAPSULE = { y: (SPEC.chinY + 0.5) / AARONIERO_RES, r: 6.4 / AARONIERO_RES, h: 19 / AARONIERO_RES };

export function buildAaroniero(form: AaronieroForm = 'sealed'): CharacterAsset {
  const glot = form === 'glotoneria';
  const b = new ModelBuilder(`aaroniero-${form}`, AARONIERO_RES);
  palette(b);
  const s = glot ? SPEC_GLOT : SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  // the maw's mouth (+Z) along the hand: it bites where the fingers point
  b.socket('maw', 'hand.L', [wx, wy - 3, wz + 0.5], [90, 0, 0]);
  b.socket('hip.L', 'hips', [s.hips[0] + 2.4, s.waistY - 6, 3.6], [-28, 180, -6]);
  b.socket('chest.front', 'chest', [0, s.chestY, s.chest[1] + 1]);
  b.socket('back', 'chest', [0, s.chestY + 2, -s.chest[1] - 1]);
  // the head props are built in the body's own space: their socket sits at the model origin, on the head bone
  b.socket('skull', 'head', [0, 0, 0]);
  b.socket('face', 'head', [0, s.chinY + 6, L.headC[2] + s.head.d / 2]);
  b.socket('mouth', 'head', [0, s.chinY + 2.5, L.headC[2] + s.head.d / 2 + 0.5]);
  // the neck (the head itself is a prop)
  b.add('neck', capsule([0, s.chinY - 7, L.headC[2] - 1], [0, s.chinY - 1, L.headC[2] - 1], s.neckR), 'skin');
  b.add('head', sphere([0, s.chinY - 2.5, L.headC[2] - 1], 2.4), 'skin');
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  const c = garb(b, L, glot);
  springs.push(...c.springs);
  colliders.push(...c.colliders);
  hands(b, L, 'skin', 1.3);
  // the left hand: one white glove
  b.paint(['palm.L', 'fist.L'], aabb([-40, -10, -40], [40, 200, 40]), 'glove', { where: b.isMat('skin') });
  if (glot) b.socket('mass', 'root', [0, 0, 0]);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- the garb

function torsoSdf(L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  return blend(3.2,
    box([0, s.chestY - 0.5, -0.3], [cx, 6.5, cz], { round: 3.4 }),
    box([0, s.waistY, -0.2], [wx, 5, wz], { round: 3 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 4, s.hips[1]], { round: 2.6 }),
    capsule([2.6, sy + 1.5, sz - 0.8], [sx - 1.6, sy - 0.2, sz], 2.8, 2.9),
    capsule([-2.6, sy + 1.5, sz - 0.8], [-sx + 1.6, sy - 0.2, sz], 2.8, 2.9),
    sphere([sx, sy - 0.5, sz], 3.3), sphere([-sx, sy - 0.5, sz], 3.3));
}

/** A ruffle: a band of cloth frilled in waves round a circle (centre c, radius r, in the plane facing n). */
function ruffle(c: V3, r: number, width: number, waves: number, amp: number, axis: 'y' | 'z' = 'y'): Sdf {
  return fn((x, y, z) => {
    const dx = x - c[0], dy = y - c[1], dz = z - c[2];
    // the ring's own plane: y-axis rings lie flat (collars, cuffs), z-axis rings stand up (a rosette)
    const [u, v, w] = axis === 'y' ? [dx, dz, dy] : [dx, dy, dz];
    const a = Math.atan2(v, u);
    const rho = Math.hypot(u, v);
    const wave = Math.sin(a * waves) * amp;
    const dr = Math.abs(rho - r - width / 2) - width / 2;
    return Math.max(dr, Math.abs(w - wave) - 0.55);
  }, [c[0] - r - width - amp - 1, c[1] - r - width - amp - 1, c[2] - r - width - amp - 1], [c[0] + r + width + amp + 1, c[1] + r + width + amp + 1, c[2] + r + width + amp + 1]);
}

/**
 * The long white garb to the floor, its sleeves to the wrists; over it the noble's coat to the hips, open down the
 * front over a cascade of ruffles (the jabot), a frilled collar standing round the neck and ruffled cuffs.
 */
function garb(b: ModelBuilder, L: Landmarks, glot: boolean): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const torso = torsoSdf(L);
  const y0 = glot ? s.waistY - 8 : 0;
  addBands(b, intersect(offset(torso, 0.9), aabb([-30, Math.max(y0, 40), -30], [30, s.chinY, 30])), 'white', [['hips', 0, s.waistY - 5], ['spine', s.waistY - 5, s.chestY - 6], ['chest', s.chestY - 6, 200]]);
  // the coat over it: a second shell to the hips, open down the front
  const front = intersect(prism([[-2.5, s.chinY], [2.5, s.chinY], [4, s.waistY], [7, s.hipsY - 6], [-7, s.hipsY - 6], [-4, s.waistY]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 40), halfSpace([0, 0, 1.5], [0, 0, -1]));
  addBands(b, subtract(intersect(offset(torso, 1.9), aabb([-30, s.hipsY - 6, -30], [30, s.chinY - 3, 30]), halfSpace([0, s.chinY - 3, 0], [0, 1, 0])), front), 'white', [['hips', 0, s.waistY - 5], ['spine', s.waistY - 5, s.chestY - 6], ['chest', s.chestY - 6, 200]]);
  // the coat's edges a shade darker (the opening reads)
  b.paint(['chest', 'spine', 'hips'], intersect(offset(front, 0.9), halfSpace([0, 0, 1.5], [0, 0, -1])), 'white', { shade: 3, where: b.isMat('white') });
  // the jabot: three tiers of lace falling from the throat, the upper ones in front, their pleats fanning out
  for (let i = 0; i < 3; i++) {
    const yc = s.chinY - 5.5 - i * 3, w = 2.6 + i * 0.8, z0 = s.chest[1] + 1.8 - i * 0.35;
    b.add('chest', fn((x, y, z) => {
      const dy = yc - y;
      const rho = Math.hypot(x, dy * 0.8);
      const a = Math.atan2(x, Math.max(0.01, dy));
      return Math.max(rho - w, -dy - 0.5, Math.abs(z - z0 - Math.cos(a * 5) * 0.45 - dy * 0.12) - 0.6);
    }, [-w - 1, yc - w * 1.3 - 1, z0 - 2], [w + 1, yc + 1, z0 + 3]), 'frill', { thr: 0.15 });
  }
  // the high collar standing round the neck, flaring to a scalloped edge, taller at the back, open at the throat
  const nz = L.headC[2] - 0.9;
  const cy0 = sy - 1.5, cy1 = s.chinY - 1;
  b.add('chest', fn((x, y, z) => {
    const dz = z - nz;
    const a = Math.atan2(x, dz);
    const t = Math.max(0, Math.min(1, (y - cy0) / (cy1 - cy0)));
    const r = 6 + t * t * 1.8;
    const top = cy1 + Math.cos(a * 12) * 0.6 + Math.max(0, -dz) * 0.2;
    return Math.max(Math.abs(Math.hypot(x, dz) - r) - 0.7, y - top, cy0 - y, (0.42 - Math.abs(a)) * 6);
  }, [-11, cy0 - 1, -11], [11, cy1 + 4, 11]), 'frill');
  // sleeves to the wrists, ruffled cuffs
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3.6), cylinder([sx + 0.2, ey - 0.5, sz], [sx, sy - 0.5, sz], 3.2, 3.4, 1.1)), 'white', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 3.2), cylinder([sx, wy + 0.4, sz], [sx, ey + 1, sz], 3.4, 3.1, 1)), 'white', { mirror: true });
  b.carve('forearm.L', cylinder([sx, wy - 1, sz], [sx, wy + 1.1, sz], 2.0, 2.0), { mirror: true });
  b.add('forearm.L', capsule([sx, wy + 3.5, sz], [sx, wy - 0.5, sz], 1.8), 'skin', { mirror: true, only: 'empty' });
  b.add('forearm.L', ruffle([sx, wy + 0.8, sz], 3.1, 1.6, 8, 0.7, 'y'), 'frill', { mirror: true, thr: 0.2 });
  if (glot) return { springs: [], colliders: [] };
  // the garb's skirt to the floor, shoes peeking out
  const skirt = coatSkirt(b, L, { mat: 'robe', lining: 'robe', yTop: s.waistY - 4, yHem: 2, r0: 9, r1: 13.6, profile: 4, openFront: 2, overlap: 3, thick: 1.9, res: AARONIERO_RES });
  const [ax, ay, az] = L.ankle;
  const f = s.foot;
  b.add('foot.L', intersect(box([ax, 2, az + (f.len / 2 - f.heel)], [2.6, 2, f.len / 2 + 0.4], { round: 1.4 }), halfSpace([0, 4.5, az + f.len - f.heel - 3], [0, 1, 0.6])), 'shoe', { mirror: true });
  b.add('shin.L', capsule([ax, ay + 10, az], [ax, ay, az], 2.6), 'white', { mirror: true });
  return skirt;
}

// ---------------------------------------------------------------------------------------------- the heads

/** a builder for a head prop in the body's own space (the skeleton is there only for the humanoid helpers) */
function headBuilder(name: string, res: number): { b: ModelBuilder; L: Landmarks } {
  const b = new ModelBuilder(name, res);
  const L = humanoidSkeleton(b, SPEC);
  return { b, L };
}

/** The mask: tall, white, rounded, eight holes down the front in two columns. */
function buildMask(lift: number): VoxelModel {
  const { b, L } = headBuilder(`aaroniero-mask${lift ? '-glot' : ''}`, AARONIERO_RES);
  b.mat('mask', ['#F3F1EA', '#ECE9DF', '#D9D5CA', '#BFBAAD', '#A39E91'], { base: 1, rough: 0.4, shadeK: 1 });
  b.mat('hole', ['#141418']);
  const c = SPEC.chinY + lift, cz = L.headC[2] - 0.6;
  // one smooth tube with a domed top (a blended cap left a ledge round it)
  const shape = capsule([0, c - 2, cz], [0, c + 20, cz], 6.2, 5.8);
  b.add('head', shape, 'mask');
  // the holes: two columns of four, sunk deep, their walls dark and the rim left white
  for (const x of [-2, 2]) for (let i = 0; i < 4; i++) {
    const y = c + 16 - i * 4.4;
    b.carve('head', box([x, y, cz + 6], [1, 1.5, 3]));
    b.paint('head', intersect(box([x, y, cz + 4], [2, 2.5, 3]), offset(shape, -1)), 'hole', { where: b.isMat('mask') });
  }
  b.autoShade();
  b.lint();
  return b.build();
}

/**
 * The true head (at twice the body's density): a white collar round the neck, a white rim at the top, between them
 * the space the kit fills with glass and red liquid; a dark-red back wall; the two little heads — the top one three
 * quarters masked, the bottom one half masked, a "9" on the bare skin of each.
 */
function buildCapsule(lift: number): VoxelModel {
  const k = 2;
  const { b, L } = headBuilder(`aaroniero-capsule${lift ? '-glot' : ''}`, AARONIERO_RES * k);
  b.mat('rim', ['#F3F1EA', '#E2DED3', '#C7C2B5', '#A9A396'], { base: 1, rough: 0.35, shadeK: 1 });
  b.mat('liquid', ['#9E1026'], { rough: 0.2 });
  b.mat('flesh', ['#D8D2CC', '#C9C3BD', '#ADA6A0'], { base: 1, rough: 0.6 });
  b.mat('bone', ['#F3F0E8', '#E6E1D5', '#CFC9BA'], { base: 0, rough: 0.4 });
  b.mat('dark', ['#141418']);
  b.mat('eye', ['#F2C23A'], { glow: 0.3 });
  const c = (SPEC.chinY + lift) * k, cz = (L.headC[2] - 1) * k;
  const R = 6.4 * k, H = 20 * k;
  const y0 = c - 1 * k, y1 = y0 + H;
  // the white collar the capsule stands in (closed underneath: the neck stays hidden)
  b.add('head', cylinder([0, y0 - 2 * k, cz], [0, y0 + 1.2 * k, cz], R + 0.9 * k, R + 0.9 * k, 1), 'rim');
  b.add('head', cylinder([0, y0 + 0.8 * k, cz], [0, y0 + 1.8 * k, cz], R + 0.3 * k, R + 0.3 * k, 0.5), 'rim');
  // the liquid's far wall: a half-shell at the back (the glass, its domed top and the near liquid are the kit's)
  b.add('head', intersect(fn((x, y, z) => Math.abs(Math.hypot(x, z - cz) - (R - 0.6 * k)) - 0.55 * k, [-R - 2, y0, cz - R - 2], [R + 2, y1, cz + R + 2]), halfSpace([0, 0, cz - 1.5 * k], [0, 0, 1]), aabb([-R - 2, y0 + 1.2 * k, cz - R - 2], [R + 2, y1, cz + R + 2])), 'liquid');
  // the two little heads, each on a stalk from the back wall
  const littleHead = (yc: number, maskK: number, side: number) => {
    const hc: V3 = [side * 0.8 * k, yc, cz + 0.6 * k];
    const r = 3.4 * k;
    b.add('head', sphere(hc, r), 'flesh');
    b.add('head', capsule([hc[0], hc[1], hc[2] - r * 0.8], [hc[0] * 0.5, hc[1] - 1.5 * k, cz - R + 1.2 * k], 0.9 * k), 'flesh');
    // the mask over most of it: the top and the face's left side (maskK = 0.75) or the left half (0.5)
    b.paint('head', fn((x, y, z) => {
      const dx = x - hc[0], dy = y - hc[1];
      const masked = maskK > 0.6 ? dy > -r * 0.25 || dx > -r * 0.1 : dx > 0;
      return masked ? Math.hypot(x - hc[0], y - hc[1], z - hc[2]) - r - 0.6 : 1;
    }, [hc[0] - r - 2, hc[1] - r - 2, hc[2] - r - 2], [hc[0] + r + 2, hc[1] + r + 2, hc[2] + r + 2]), 'bone', { where: b.isMat('flesh') });
    b.add('head', intersect(sphere(hc, r + 0.7), fn((x, y) => {
      const dx = x - hc[0], dy = y - hc[1];
      return (maskK > 0.6 ? dy > -r * 0.25 || dx > -r * 0.1 : dx > 0) ? -1 : 1;
    }, [hc[0] - r - 2, hc[1] - r - 2, hc[2] - r - 2], [hc[0] + r + 2, hc[1] + r + 2, hc[2] + r + 2]), halfSpace([0, 0, hc[2]], [0, 0, -1])), 'bone', { only: 'empty' });
    // eyes: dark sockets with a yellow glint, a mouth line
    for (const ex of [-1.3 * k, 1.3 * k]) {
      const p: V3 = [hc[0] + ex, hc[1] + 0.6 * k, hc[2] + r];
      b.paint('head', sphere(p, 0.9 * k), 'dark', { where: b.isMat('flesh', 'bone') });
      b.paint('head', sphere([p[0], p[1], p[2] + 0.3], 0.4 * k), 'eye', { where: b.isMat('dark') });
    }
    b.paint('head', box([hc[0], hc[1] - 1.6 * k, hc[2] + r], [1.3 * k, 0.3 * k, 1]), 'dark', { where: b.isMat('flesh', 'bone') });
    // the "9" on the bare cheek (a 3×4 glyph)
    const nine = ['###', '#.#', '###', '..#', '###'];
    nine.forEach((row, ri) => row.split('').forEach((ch, ci) => {
      if (ch !== '#') return;
      b.paint('head', box([hc[0] - r * 0.55 + ci * 0.7 - 0.7, hc[1] - 0.2 * k - ri * 0.7, hc[2] + r * 0.8], [0.35, 0.35, 2]), 'dark', { where: b.isMat('flesh') });
    }));
  };
  littleHead(y0 + H * 0.68, 0.75, -1);
  littleHead(y0 + H * 0.3, 0.5, 1);
  b.autoShade();
  b.lint();
  return b.build();
}

const KAIEN_HAIR: Spike[] = [
  { az: 0, el: 66, len: 5, r: 3.8, flow: [0, 0.4, -0.5] },
  { az: -40, el: 58, len: 5.5, r: 3.6, flow: [0, 0.3, -0.55] },
  { az: 40, el: 58, len: 5.5, r: 3.6, flow: [0, 0.3, -0.55] },
  { az: -90, el: 46, len: 4.5, r: 3.4, flow: [0, 0.15, -0.5] },
  { az: 90, el: 46, len: 4.5, r: 3.4, flow: [0, 0.15, -0.5] },
  { az: -135, el: 44, len: 5, r: 3.6, flow: [0, 0.05, -0.55] },
  { az: 135, el: 44, len: 5, r: 3.6, flow: [0, 0.05, -0.55] },
  { az: 180, el: 50, len: 5.5, r: 3.8, flow: [0, 0.1, -0.6] },
  { az: -22, el: 48, len: 4.5, r: 2.8, flow: [-0.1, 0.6, 0.2] },
  { az: 22, el: 48, len: 4.5, r: 2.8, flow: [0.1, 0.6, 0.2] },
  { az: -72, el: 20, len: 3.5, r: 3, flow: [0, -0.1, -0.45] },
  { az: 72, el: 20, len: 3.5, r: 3, flow: [0, -0.1, -0.45] },
  { az: -158, el: 14, len: 4, r: 3.2, flow: [0, -0.4, -0.4] },
  { az: 158, el: 14, len: 4, r: 3.2, flow: [0, -0.4, -0.4] },
  { az: 180, el: 22, len: 4, r: 3.4, flow: [0, -0.3, -0.45] },
];

/** Kaien's face, rows 9 → 0 (column 0 is his right): straight brows, aqua-green eyes, the wide grin. */
const KAIEN_FACE = [
  '. . . . . . . . . . . .',
  '. . b B B . . B B b . .',
  '. . L L L . . L L L . .',
  '. . W * I . . * I W . .',
  '. . W i I . . i I W . .',
  '. . . . . . . . . . . .',
  '. . . . . . s . . . . .',
  '. . . m . . . . m . . .',
  '. . . . m m m m . . . .',
  '. . . . . . . . . . . .',
];

/** Kaien Shiba's head on Aaroniero's neck: spiky black hair with a violet sheen, aqua-green eyes, the grin. */
function buildKaienHead(lift: number): VoxelModel {
  const { b, L } = headBuilder(`aaroniero-kaien${lift ? '-glot' : ''}`, AARONIERO_RES);
  b.mat('skin', ['#F7DCC4', '#F2D0B0', '#E8BDA0', '#C99A7E', '#AB7767'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#504456', '#45364A', '#2A2230', '#1C1726', '#141418'], { base: 3, rough: 0.5, shadeK: 0.85 });
  b.mat('brow', ['#1C1726']);
  b.mat('lid', ['#1C1726']);
  b.mat('sclera', ['#F3F1EC']);
  b.mat('iris', ['#5E9C94'], { glow: 0.12 });
  b.mat('irisD', ['#3B5F5A']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#4E2626']);
  const s = { ...SPEC, chinY: SPEC.chinY + lift };
  const L2: Landmarks = { ...L, spec: s, headC: [L.headC[0], L.headC[1] + lift, L.headC[2]] };
  const hd = head(b, L2, 'skin');
  b.stamp('head', hd.x0, hd.chin + 9, KAIEN_FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  const hairline = s.chinY + s.head.h - 1.5;
  spikeHair(b, L2, 'hair', KAIEN_HAIR, [{ x: -3.2, tipY: hairline - 2.4, lean: -0.6, r: 1.9 }, { x: 1.4, tipY: hairline - 3, lean: 0.9, r: 2 }, { x: 4.6, tipY: hairline - 1.6, lean: 0.5, r: 1.6 }], { tufts: 30 });
  // the box's top corners above the hairline are scalp, not forehead
  b.paint('head', aabb([-12, hairline + 0.5, -20], [12, hairline + 20, 20]), 'hair', { where: b.isMat('skin') });
  b.carve('head', aabb([-5, hd.chin + 4, hd.front], [-1, hd.chin + 7, hd.front + 6]));
  b.carve('head', aabb([1, hd.chin + 4, hd.front], [5, hd.chin + 7, hd.front + 6]));
  b.autoShade();
  b.lint();
  return b.build();
}

// ---------------------------------------------------------------------------------------------- Nejibana

/** the square gold guard with cut corners and wave reliefs */
function waveGuard(b: ModelBuilder, z: number): void {
  b.add('root', intersect(box([0, 0, z], [3.2, 3.2, 0.6], { round: 0.3 }), fn((x, y) => Math.abs(x) + Math.abs(y) - 5.2, [-4, -4, z - 1], [4, 4, z + 1])), 'guard');
  b.paint('root', fn((x, y, zz) => Math.max(Math.abs(Math.sin(x * 1.3) * 1.2 - y) - 0.35, Math.abs(zz - z) - 0.7), [-4, -4, z - 1], [4, 4, z + 1]), 'guard', { shade: 3, where: b.isMat('guard') });
}

/** Nejibana sealed: a plain katana, the gold guard, the dark-blue wrap with gold diamonds. */
function buildKatana(): VoxelModel {
  const b = new ModelBuilder('nejibana-sealed', 48);
  b.mat('steel', ['#E8EBEF', '#C8D0D8', '#AEB6BF', '#8E959E'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#EEF3F7'], { rough: 0.12, metal: 0.8 });
  b.mat('wrap', ['#2A3A70', '#1E2A55', '#11141D'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#C9A646']);
  b.mat('guard', ['#E0C060', '#C9A646', '#8E7430'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 5, zTip = 38, zEnd = zTip - 3;
  const curve = (z: number) => Math.max(0, z - z0) ** 2 * 0.0009;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const cv = curve(z);
    const top = 0.9 + cv, bot = -1.1 + cv + Math.max(0, z - zEnd) * 0.66;
    return Math.max(Math.abs(x) - 0.5, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 3, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => y - (-0.62 + curve(z) + Math.max(0, z - zEnd) * 0.66), [-2, -3, 0], [2, 3, zTip + 1]), 'edge');
  waveGuard(b, 4);
  b.add('root', box([0, 0, -0.6], [1.05, 1.2, 4], { round: 0.5 }), 'wrap');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.42, [-2, -2, -5], [2, 2, 3.4]), 'ray', { where: b.isMat('wrap') });
  b.add('root', cylinder([0, 0, -4.6], [0, 0, -5.6], 1.15, 1.0, 0.3), 'guard');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The brown sheath (with the sword in it, or empty). */
function buildSheath(full: boolean): VoxelModel {
  const b = new ModelBuilder(full ? 'nejibana-sheath-full' : 'nejibana-sheath', 48);
  b.mat('lacquer', ['#8A6442', '#6B4A30', '#4E3622', '#3A281A'], { base: 1, rough: 0.4 });
  b.mat('wrap', ['#2A3A70', '#1E2A55', '#11141D'], { base: 1, rough: 0.85 });
  b.mat('guard', ['#E0C060', '#C9A646', '#8E7430'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const Ls = 34;
  b.add('root', box([0, 0, Ls / 2], [0.95, 1.45, Ls / 2], { round: 0.6 }), 'lacquer');
  b.add('root', box([0, 0, Ls - 0.6], [1.1, 1.6, 0.7], { round: 0.5 }), 'guard');
  if (full) {
    waveGuard(b, -0.6);
    b.add('root', box([0, 0, -5.6], [1.05, 1.2, 4.2], { round: 0.5 }), 'wrap');
    b.add('root', cylinder([0, 0, -9.8], [0, 0, -10.8], 1.15, 1.0, 0.3), 'guard');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Nejibana released: a 2.4 m silver trident. The shaft along +Z, the grip at the origin; the leaf-shaped central head,
 * two side blades curving outward each joined to it by two bars, the thick blue tassel under the head, the
 * corkscrew butt.
 */
function buildNejibana(): VoxelModel {
  const b = new ModelBuilder('nejibana', 48);
  b.mat('steel', ['#D3DAE1', '#BCC4CD', '#8C95A2', '#676B73', '#4A4E58'], { base: 1, rough: 0.34, metal: 0.8, shadeK: 0.65 });
  b.mat('edge', ['#DCE3E9'], { rough: 0.28, metal: 0.75 });
  b.mat('shaft', ['#B9C0C8', '#8C95A2', '#676B73'], { base: 1, rough: 0.3, metal: 0.8 });
  b.mat('tassel', ['#5A70E0', '#3A4FB0', '#2E376C', '#11172D'], { base: 1, rough: 0.9, shadeK: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const zHead = 50, zTip = 82, zButt = -33;
  // the shaft
  b.add('root', cylinder([0, 0, zButt + 6], [0, 0, zHead + 1], 0.85, 0.85), 'shaft');
  // rings along it
  for (const z of [-10, 12, zHead - 1]) b.add('root', cylinder([0, 0, z - 0.6], [0, 0, z + 0.6], 1.3, 1.3), 'steel');
  // the central head: a leaf narrowing at the middle (flat in X)
  b.add('root', fn((x, y, z) => {
    if (z < zHead || z > zTip) return 1;
    const u = (z - zHead) / (zTip - zHead);
    const w = 2.8 * Math.sin(Math.PI * Math.min(1, u * 1.05)) * (1 - 0.35 * Math.exp(-((u - 0.45) ** 2) / 0.01)) + 0.3;
    return Math.max(Math.abs(x) - 0.55, Math.abs(y) - w);
  }, [-2, -4, zHead - 1], [2, 4, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((x, y, z) => Math.abs(y) - 0.4 + 0 * x + 0 * z, [-2, -1, zHead], [2, 1, zTip]), 'edge');
  // the side blades: curving outward from the base of the head, joined by two bars each
  for (const k of [-1, 1]) {
    const p = smoothPath([[0, k * 1.2, zHead + 1], [0, k * 4.6, zHead + 4], [0, k * 6.4, zHead + 11], [0, k * 6.0, zHead + 19]], 5);
    b.add('root', tube(p, p.map((_, i) => 1.0 - i * 0.04)), 'steel', { thr: 0.25 });
    b.add('root', spike([0, k * 6.0, zHead + 18.5], [0, k * -0.15, 1], 5, 1.1, 0.5, { side: [0, 1, 0], tip: 0.3 }), 'steel', { thr: 0.25 });
    for (const zb of [zHead + 7, zHead + 13]) b.add('root', capsule([0, k * 1.6, zb], [0, k * 5.6, zb + 1], 0.5), 'steel', { thr: 0.25 });
  }
  // the tassel: a thick blue plume hanging from below the head
  b.add('root', blend(1, sphere([0, 0, zHead - 2], 1.8), capsule([0, -1.5, zHead - 3], [0, -6, zHead - 9], 2.2, 1.4)), 'tassel');
  b.paint('root', fn((x, y, z) => Math.abs(((x * 1.7 + z * 0.4) % 1.6 + 1.6) % 1.6 - 0.8) - 0.25 + 0 * y, [-4, -9, zHead - 12], [4, 2, zHead]), 'tassel', { shade: 3, where: b.isMat('tassel') });
  // the corkscrew butt
  b.add('root', fn((x, y, z) => {
    if (z < zButt || z > zButt + 7) return 1;
    const u = (z - zButt) / 7;
    const r = 0.4 + u * 1.4;
    const a = Math.atan2(y, x) - z * 1.4;
    const rr = r + 0.45 * Math.sin(a * 2);
    return Math.hypot(x, y) - rr;
  }, [-3, -3, zButt - 1], [3, 3, zButt + 8]), 'steel', { thr: 0.3 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

// ---------------------------------------------------------------------------------------------- Glotonería

/** The sealed Glotonería: brown tentacles coiled round a gaping toothed maw (worn over the left hand). */
function buildMaw(): VoxelModel {
  const b = new ModelBuilder('glotoneria-maw', 48);
  b.mat('flesh', ['#8A6242', '#6E4B2F', '#5A3C24', '#4B3220'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('maw', ['#5A1A26', '#3B0D16', '#26070E'], { base: 1, rough: 0.5 });
  b.mat('tooth', ['#F2EBD8', '#E9E1CB', '#CFC6AE'], { base: 0, rough: 0.4 });
  b.bone('root', null, [0, 0, 0]);
  // the mouth faces forward (+Z): a fleshy ring round a dark throat
  b.add('root', subtract(ellipsoid([0, 0, 3], [4.4, 4.4, 4]), ellipsoid([0, 0, 6], [2.6, 2.6, 4])), 'flesh');
  b.add('root', ellipsoid([0, 0, 2.6], [2.8, 2.8, 2]), 'maw');
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    b.add('root', spike([Math.cos(a) * 2.6, Math.sin(a) * 2.6, 5.4], [-Math.cos(a) * 0.5, -Math.sin(a) * 0.5, 0.6], 1.8, 0.5, 0.4, { tip: 0.2 }), 'tooth', { thr: 0.2 });
  }
  // coiled tentacles round it
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const p = smoothPath([[Math.cos(a) * 3.6, Math.sin(a) * 3.6, 2], [Math.cos(a + 0.4) * 6, Math.sin(a + 0.4) * 6, 3.5], [Math.cos(a + 0.9) * 6.4, Math.sin(a + 0.9) * 6.4, 6], [Math.cos(a + 1.3) * 4.8, Math.sin(a + 1.3) * 4.8, 7.4]], 4);
    b.add('root', tube(p, p.map((_, j) => 1.2 - j * 0.07)), 'flesh', { thr: 0.25 });
  }
  b.autoShade();
  b.lint();
  return b.build();
}

/**
 * The released mass (12 vox/m, its origin on the ground under his waist): a heavy, lumpy dark-purple body 10 m across —
 * lobes all round, swellings over the hide blotched paler, a hump in the middle he rises from — thick tentacles sprawled
 * over the ground and curling up, big lidded red eyes, toothed mouths (the blobfish face in front), and on the hump the
 * pool where the masks of eaten Hollows surface round his waist.
 */
function buildMass(): VoxelModel {
  const r = MASS_RES;
  const b = new ModelBuilder('glotoneria-mass', r);
  b.mat('mass', ['#8A4BA0', '#74409A', '#5E2A72', '#4A2160', '#3F1B4D'], { base: 2, rough: 0.55, shadeK: 0.85 });
  b.mat('spot', ['#A773BD', '#9459AD', '#7C4596'], { base: 1, rough: 0.5, shadeK: 0.7 });
  b.mat('lid', ['#4A2160', '#3F1B4D', '#2E1238'], { base: 1, rough: 0.6 });
  b.mat('pool', ['#5C2A6E', '#4A1A58', '#36103F'], { base: 1, rough: 0.2 });
  b.mat('eye', ['#E83A48', '#D3202F', '#A8121F'], { base: 1, rough: 0.3 });
  b.mat('pupil', ['#140508']);
  b.mat('maw', ['#3A0B17', '#26070E']);
  b.mat('tooth', ['#F2EBD8', '#EDE5D0', '#CFC6AE'], { base: 0, rough: 0.4 });
  b.mat('sucker', ['#C894D6', '#A86CBA'], { base: 0, rough: 0.5 });
  b.mat('mask', ['#F3F1EA', '#EEEAE0', '#D2CDBF'], { base: 0, rough: 0.4 });
  b.mat('hole', ['#141418']);
  b.bone('root', null, [0, 0, 0]);
  const W = MASS_W * r, H = MASS_H * r;
  const rnd = (i: number) => Math.abs(Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1;
  /** a point on the main body's surface: azimuth a (0 = front), elevation e */
  const surf = (a: number, e: number, out = 0): V3 => [Math.sin(a) * Math.cos(e) * (W * 0.9 + out), H * 0.38 + Math.sin(e) * (H * 0.46 + out), Math.cos(a) * Math.cos(e) * (W * 0.8 + out) - 2];
  // the body: a heavy mound, seven lobes round it, the hump in the middle
  const lobes: Sdf[] = [ellipsoid([0, H * 0.38, -2], [W * 0.9, H * 0.46, W * 0.8])];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.45;
    const d = W * (0.52 + rnd(i) * 0.14);
    lobes.push(ellipsoid([Math.sin(a) * d, H * (0.3 + rnd(i + 9) * 0.12), Math.cos(a) * d * 0.88 - 2], [W * 0.4, H * 0.34, W * 0.38]));
  }
  lobes.push(ellipsoid([0, H * 0.7, -2], [W * 0.34, H * 0.3, W * 0.3]));
  b.add('root', intersect(blend(7, ...lobes), halfSpace([0, 0, 0], [0, -1, 0])), 'mass');
  // swellings over the hide
  for (let i = 0; i < 18; i++) {
    const a = rnd(i + 20) * Math.PI * 2, e = 0.15 + rnd(i + 40) * 0.9;
    b.add('root', sphere(surf(a, e, -2), 5 + rnd(i + 60) * 4), 'mass');
  }
  // pale blotches
  for (let i = 0; i < 22; i++) {
    const a = rnd(i + 80) * Math.PI * 2, e = rnd(i + 100) * 1.1;
    b.paint('root', sphere(surf(a, e), 3 + rnd(i + 120) * 4), 'spot', { where: b.isMat('mass') });
  }
  // the pool on the hump round his waist: a shallow basin of dark fluid, masks surfacing in it
  const top = H * 0.7 + H * 0.3 - 1;
  b.carve('root', ellipsoid([0, top + 2.4, -2], [W * 0.26, 3.2, W * 0.23]));
  b.add('root', ellipsoid([0, top - 0.2, -2], [W * 0.25, 1, W * 0.22]), 'pool', { only: 'empty' });
  for (const [x, z, rot] of [[-8, -5, 0.4], [7, -8, -0.6], [-3, 7, 0.9], [10, 3, 2.2]] as [number, number, number][]) {
    const c: V3 = [x, top + 0.4, z - 2];
    b.add('root', intersect(ellipsoid(c, [2.4, 1.4, 3]), halfSpace([c[0], c[1] - 0.4, c[2]], [0, -1, 0])), 'mask');
    for (const d of [-0.9, 0.9]) b.paint('root', sphere([c[0] + Math.cos(rot) * d, c[1] + 1.2, c[2] + Math.sin(rot) * d], 0.6), 'hole', { where: b.isMat('mask') });
  }
  // tentacles sprawled over the ground from under the rim, their tips curling up, pale suckers underneath
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + (rnd(i + 140) - 0.5) * 0.25;
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.35) continue; // the face keeps clear
    const sx = Math.sin(a), cz = Math.cos(a);
    const R0 = W * 0.78, len = 16 + rnd(i + 160) * 14, curl = (rnd(i + 180) - 0.5) * 1.4;
    const at = (d: number, y: number, c: number): V3 => [sx * (R0 + d) + cz * c, y, cz * (R0 + d) * 0.9 - 2 - sx * c];
    const p = smoothPath([at(0, H * 0.24, 0), at(len * 0.45, H * 0.07, curl * 2), at(len, 3, curl * 6), at(len * 1.2, 7 + rnd(i + 200) * 6, curl * 11)], 5);
    const rad = p.map((_, j) => 5.4 - (j / (p.length - 1)) * 4.2);
    b.add('root', tube(p, rad), 'mass', { thr: 0.25 });
    for (let j = 3; j < p.length - 2; j += 2) b.add('root', sphere([p[j][0], p[j][1] - rad[j] + 0.6, p[j][2]], Math.max(0.8, rad[j] * 0.32)), 'sucker', { thr: 0.2 });
  }
  // big lidded red eyes over the hide
  for (const [a, e, sz] of [[0.75, 0.55, 4.4], [-0.8, 0.62, 5], [1.6, 0.42, 3.8], [-1.7, 0.4, 4], [2.5, 0.6, 4.2], [-2.6, 0.52, 3.6], [3.1, 0.3, 3.2], [0.3, 0.95, 3.4], [-1.2, 1.05, 3]] as [number, number, number][]) {
    const p = surf(a, e, -1);
    const n: V3 = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
    b.add('root', sphere(p, sz + 1.2), 'lid');
    b.add('root', sphere([p[0] + n[0] * 1.2, p[1] + n[1] * 1.2, p[2] + n[2] * 1.2], sz), 'eye');
    b.paint('root', sphere([p[0] + n[0] * (sz + 0.6), p[1] + n[1] * (sz + 0.6), p[2] + n[2] * (sz + 0.6)], sz * 0.45), 'pupil', { where: b.isMat('eye') });
    // the upper lid drooping over the eye
    b.add('root', intersect(sphere([p[0] + n[0] * 1.2, p[1] + n[1] * 1.2, p[2] + n[2] * 1.2], sz + 1), halfSpace([p[0], p[1] + sz * 0.35, p[2]], [0, -1, 0])), 'lid');
  }
  // the blobfish face in front: two drooping eyes, a sagging nose, a great toothed mouth
  const f: V3 = [0, H * 0.4, W * 0.8 - 2];
  for (const k of [-1, 1]) {
    b.add('root', sphere([k * 8, f[1] + 6, f[2] - 1], 4.2), 'lid');
    b.add('root', sphere([k * 8, f[1] + 5.4, f[2] + 0.4], 3.4), 'eye');
    b.paint('root', sphere([k * 8, f[1] + 4.8, f[2] + 3], 1.5), 'pupil', { where: b.isMat('eye') });
  }
  b.add('root', ellipsoid([0, f[1] + 1, f[2] + 2.5], [4.4, 5.6, 3.8]), 'mass');
  b.carve('root', ellipsoid([0, f[1] - 6.5, f[2] + 2], [13, 3.8, 7]));
  b.paint('root', ellipsoid([0, f[1] - 6.5, f[2] + 0.5], [14, 4.8, 8]), 'maw', { where: b.isMat('mass', 'spot') });
  for (let i = 0; i < 11; i++) {
    const x = -11 + i * 2.2;
    b.add('root', spike([x, f[1] - 3.2, f[2] + 3 - Math.abs(x) * 0.16], [0, -1, 0.15], 2.8, 1, 0.7, { tip: 0.3 }), 'tooth', { thr: 0.2 });
    if (i % 2 === 0) b.add('root', spike([x + 1.1, f[1] - 10, f[2] + 2.4 - Math.abs(x) * 0.16], [0, 1, 0.1], 2.2, 0.9, 0.6, { tip: 0.3 }), 'tooth', { thr: 0.2 });
  }
  // more toothed mouths on the flanks and the back
  for (const [a, e] of [[1.25, 0.2], [-1.3, 0.25], [2.9, 0.3]] as [number, number][]) {
    const p = surf(a, e, -1);
    b.carve('root', ellipsoid(p, [4.4, 2.4, 4.4]));
    b.paint('root', ellipsoid(p, [5.6, 3.4, 5.6]), 'maw', { where: b.isMat('mass', 'spot') });
    for (let i = 0; i < 5; i++) {
      const t = (i / 4 - 0.5) * 6;
      b.add('root', spike([p[0] + Math.cos(a) * t, p[1] + 2.2, p[2] - Math.sin(a) * t], [0, -1, 0], 1.8, 0.7, 0.5, { tip: 0.2 }), 'tooth', { thr: 0.2 });
    }
  }
  b.autoShade();
  b.lint();
  return b.build();
}

/** A Glotonería tentacle for the slams (12 vox/m): 6 m, thick at the base (the origin), suckers along its underside. */
function buildTentacle(): VoxelModel {
  const r = MASS_RES;
  const b = new ModelBuilder('glotoneria-tentacle', r);
  b.mat('mass', ['#8A4BA0', '#74409A', '#5E2A72', '#4A2160', '#3F1B4D'], { base: 2, rough: 0.55, shadeK: 0.85 });
  b.mat('sucker', ['#C894D6', '#A86CBA'], { base: 0, rough: 0.5 });
  b.bone('root', null, [0, 0, 0]);
  const L = 6 * r;
  const p = smoothPath([[0, 0, 0], [0, 2, L * 0.33], [0, 1, L * 0.66], [0, -2, L]], 6);
  b.add('root', tube(p, p.map((_, i) => 4.2 - (i / (p.length - 1)) * 3.4)), 'mass');
  for (let i = 2; i < p.length - 2; i += 2) b.add('root', sphere([p[i][0], p[i][1] - (4.2 - (i / (p.length - 1)) * 3.4) + 0.4, p[i][2]], 1.1), 'sucker', { thr: 0.2 });
  b.autoShade();
  b.lint();
  return b.build();
}
