// Baraggan Louisenbairn — Segunda Espada, Old Age; the former God-King of Hueco Mundo
// (docs/roster/E1-espada-1.md). 1.66 m (80 voxels at 48 vox/m) but barrel-chested and heavily muscled: broad
// shoulders, thick forearms, an old man's stoop and a wide planted stance. Sealed: white hair swept back, a
// huge white mustache sweeping out past his jaw, heavy white brows; only the left eye open (olive green), a
// scar slashing down over the shut right eye and more scars from the left of his chin down his neck; the
// five-pointed bone crown floating round the top of his head (his mask remnant). A long white leather coat
// lined with black fur — a fur collar, a fur trim down the front, short sleeves ending in fur cuffs, three
// black stripes round the hem; bare forearms with a gold band on each wrist; a belt of three thick chains
// clasped to a big disc with a sun on it; white hakama, sandals. Arrogante: a double-headed axe, two black
// half-moon blades with silver edges joined at a block holding a red slit eye; a long haft with twelve white
// studs at its foot and a gold-wrapped butt.
// Released ('arrogante', "Kuchiro, Arrogante"): a crowned skeleton in a deep purple cloak — a tattered black
// fur collar and fringe, bone hands out of the cloak still wearing the wristbands with gold chains swinging
// from them, the red slit eye become a pendant at his throat; white pointed boots; a full jewelled gold
// crown with a chain hanging on the left; the right-eye scar a crack in the skull. Gran Caída: a slimmer
// black axe with two pointed blades and a long spike forward where the eye was, gold chains wound round it.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, smoothPath, sphere, spike, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, feet, hakama, hands, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 80 voxels = 1.66 m */
export const BARAGGAN_RES = 80 / 1.66;
/** 'sealed' (the Segunda in his coat), 'arrogante' (the crowned skeleton) */
export type BaragganForm = 'sealed' | 'arrogante';

/** Short, barrel-chested and broad: a deep chest, a thick waist, heavy arms, short sturdy legs. */
const SPEC: HumanoidSpec = {
  H: 80,
  chinY: 68,
  head: { w: 12, d: 12, h: 12 },
  neckR: 3.4,
  shoulder: [11.4, 61, -0.5],
  upperArm: 13.6,
  foreArm: 12.4,
  hand: 8.8,
  armR: 3.4,
  hipsY: 41,
  hip: [5.2, 38.5, 0],
  kneeY: 21,
  ankleY: 4.2,
  chest: [10.6, 7.0],
  waist: [9.6, 6.6],
  hips: [9.0, 6.0],
  chestY: 55.5,
  waistY: 46.5,
  foot: { len: 12, w: 5.4, heel: 3.2 },
};

function palette(b: ModelBuilder): void {
  b.mat('skin', ['#DDB08A', '#C9956F', '#B5825E', '#A2734F', '#7E5638'], { base: 1, rough: 0.62, shadeK: 0.9 });
  b.mat('scar', ['#9E6A55', '#86584A']);
  b.mat('wrinkle', ['#A97A5A']);
  // silver-white: a shade greyer than the coat so the hair, brows and mustache keep their form against it
  b.mat('hair', ['#F1F0EC', '#E2E0DA', '#CBC8C0', '#B0ACA3', '#918C84'], { base: 1, rough: 0.6, shadeK: 0.95, dither: 0.04 });
  // the mask remnant: old ivory, yellower than his hair
  b.mat('crownBone', ['#EFE5CC', '#E0D2B2', '#C9B892', '#AC9A74', '#887856'], { base: 1, rough: 0.45, shadeK: 1 });
  b.mat('lid', ['#4A3022']);
  b.mat('sclera', ['#E6DECE']);
  b.mat('iris', ['#6B7B2D']);
  b.mat('nostril', ['#7E5638']);
  // the coat: white leather (a little sheen), the black fur
  b.mat('coat', ['#F2F0EA', '#EEEBE3', '#DCD8CE', '#C6C1B5', '#A8A397'], { base: 1, rough: 0.5, shadeK: 0.9 });
  b.mat('fur', ['#38363E', '#29282E', '#1E1D22', '#141418'], { base: 1, rough: 0.95, shadeK: 0.9, dither: 0.12 });
  b.mat('hakama', ['#F1EFE9', '#EBE8E1', '#D9D5CC', '#C2BEB3', '#A49F94'], { base: 1, rough: 0.85, shadeK: 0.9 });
  b.mat('gold', ['#F0D27A', '#D4AF37', '#AE8C26', '#86691A'], { base: 1, rough: 0.35, metal: 0.85 });
  b.mat('chain', ['#DDBB55', '#C29B2E', '#9C7A22', '#735A18'], { base: 1, rough: 0.4, metal: 0.8 });
  b.mat('bone', ['#F3F0E7', '#EAE4D4', '#D6CDBA', '#BDB29C', '#9C917C'], { base: 1, rough: 0.45, shadeK: 1 });
  b.mat('sole', ['#8C6A48', '#6E5236', '#55402A']);
  b.mat('strap', ['#3A2C22']);
  // Arrogante: the skeleton, the cloak, the crown
  b.mat('skull', ['#EDE6D3', '#E3DAC4', '#CFC4AB', '#B3A78D', '#8E826A'], { base: 1, rough: 0.5, shadeK: 1 });
  b.mat('crack', ['#5B5243', '#3E372D']);
  b.mat('socket', ['#1E1719', '#141418']);
  b.mat('cloak', ['#6A3C86', '#5A3274', '#4A2560', '#3A1C4C', '#2E1640'], { base: 2, rough: 0.8, shadeK: 0.9 });
  b.mat('cloakIn', ['#2E1640', '#26112F', '#1C0C24'], { base: 1, rough: 0.85 });
  b.mat('crown', ['#F2D57E', '#D9B13B', '#B08A22', '#86661A'], { base: 1, rough: 0.3, metal: 0.9 });
  b.mat('ruby', ['#D8323A', '#B3121A', '#7E0C12'], { base: 1, rough: 0.15 });
  b.mat('emerald', ['#3AA060', '#1E7B3C', '#13552A'], { base: 1, rough: 0.15 });
  b.mat('sapphire', ['#3F6FC8', '#1F4FA3', '#163A78'], { base: 1, rough: 0.15 });
  b.mat('eye', ['#D8262E', '#C3121C', '#8E0C14'], { base: 1, rough: 0.25 });
  b.mat('slit', ['#141418']);
  b.mat('boot', ['#F0EEE8', '#E4E1D9', '#CDC9BF', '#AFAA9F'], { base: 1, rough: 0.5 });
}

/**
 * His left eye open under the heavy brow (olive green, stern); the right one shut, the scar running down
 * from his forehead across it to the cheek. The mustache covers the mouth. Rows from chin + 9 down.
 */
const FACE = [
  '. . . S . . . . . . . .',
  '. . . S . . . . . . . .',
  '. . . S . . . L L L . .',
  '. . L S L . . W I W w .',
  '. . . S . . . . s . . .',
  '. . . . S . . . . . . .',
  '. . . . . . . . . . . .',
  '. . . . . . . . . . . .',
  '. . . . . . . . . . . .',
  '. . . . . . . . . . . .',
];

const assetCache = new Map<BaragganForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function baragganAsset(form: BaragganForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildBaraggan(form)));
  return a;
}

export type BaragganProp = 'arrogante' | 'granCaida';

export function baragganProp(kind: BaragganProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'arrogante' ? buildArrogante() : buildGranCaida();
    propCache.set(kind, m);
  }
  return m;
}

/** Arrogante (prop frame, m): the head's centre, the outer reach of each blade; the haft along +Z */
export const ARROGANTE_HEAD_Z = 58 / 48;
export const ARROGANTE_REACH = 17 / 48;
/** Gran Caída: the head's centre and the spike's tip (along +X) */
export const CAIDA_HEAD_Z = 50 / 48;
export const CAIDA_SPIKE: V3 = [12 / 48, 0, 50 / 48];

export function buildBaraggan(form: BaragganForm = 'sealed'): CharacterAsset {
  const b = new ModelBuilder(`baraggan-${form}`, BARAGGAN_RES);
  palette(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { hakama: form === 'sealed' });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('chest.front', 'chest', [0, s.chestY, 9]);
  b.socket('back', 'chest', [0, s.chestY + 1, -9]);
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.05, 0], radius: 0.2 },
    { bone: 'spine', offset: [0, 0, 0.02], radius: 0.19 },
  ];
  const torso = body(b, L, form);
  if (form === 'sealed') {
    const hd = sealedHead(b, L);
    b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
    b.socket('mouth', 'head', [0, s.chinY + 2.5, hd.front + 1]);
    boneCrown(b, hd);
    hands(b, L, 'skin');
    coat(b, L, torso);
    const skirt = coatSkirt(b, L, { mat: 'coat', lining: 'fur', yTop: s.waistY - 3, yHem: 6, r0: 11, r1: 14.6, openFront: 16 });
    // three black fur stripes round the hem
    const panels = ['F.L', 'S.L', 'B.L', 'B.R', 'S.R', 'F.R'].flatMap((p) => [`coat.${p}`, `coat.${p}.2`]);
    for (const y of [8, 11.2, 14.4]) b.paint(panels, aabb([-30, y, -30], [30, y + 1.8, 30]), 'fur', { where: b.isMat('coat') });
    springs.push(...skirt.springs);
    colliders.push(...skirt.colliders);
    beltOfChains(b, L, torso);
    hakama(b, L, { black: 'hakama', collar: 'hakama', skin: 'skin', obi: 'hakama', hemR: 9.4, hakamaHem: 3 });
    feet(b, L, 'skin', 'sole', 'strap');
    const R = BARAGGAN_RES;
    for (const side of ['L', 'R']) springs.push({ bone: `hakama.${side}`, tail: [0, -16 / R, 0], stiffness: 70, damping: 6, gravity: 8, limit: 50, radius: 0.12 });
  } else {
    const hd = skull(b, L);
    b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
    b.socket('mouth', 'head', [0, s.chinY + 2.5, hd.front + 1]);
    jewelledCrown(b, hd);
    boneArms(b, L);
    const cl = cloak(b, L, torso);
    springs.push(...cl.springs);
    colliders.push(...cl.colliders);
    boots(b, L);
  }
  // the slit eye: on the axe while sealed, at his throat once released
  b.socket('eye', 'chest', [0, s.shoulder[1] + 1.5, 8.6]);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- body

/** The barrel chest, the thick waist; heavy bare forearms. The skeleton keeps only a ribcage inside the cloak. */
function body(b: ModelBuilder, L: Landmarks, form: BaragganForm): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(3,
    box([0, s.chestY - 0.5, -0.2], [cx, 7.5, cz], { round: 4 }),
    box([0, s.waistY, -0.2], [wx, 5, wz], { round: 3.6 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 4, s.hips[1]], { round: 3 }),
    capsule([3, sy + 2, sz - 1], [sx - 1.5, sy, sz], 3.4, 3.6),
    capsule([-3, sy + 2, sz - 1], [-sx + 1.5, sy, sz], 3.4, 3.6),
    sphere([sx, sy - 0.5, sz], 3.9), sphere([-sx, sy - 0.5, sz], 3.9));
  if (form === 'arrogante') {
    // inside the cloak: a spine and a ribcage (only glimpsed through the cloak's opening)
    // the ribs are bands round the inside of the cloak (they hold it up), a sternum down the front
    const ribs = intersect(
      subtract(offset(torso, 0.8), offset(torso, -2.2)),
      fn((x, y) => Math.abs(((y + 40) % 2.6) - 1.3) - 0.6, [-30, s.waistY + 2, -30], [30, sy + 2, 30]),
    );
    addBands(b, ribs, 'skull', [['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 120]]);
    addBands(b, intersect(subtract(offset(torso, 0.8), offset(torso, -1.6)), aabb([-1.2, s.waistY + 3, 0], [1.2, sy, 20])), 'skull', [['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 120]]);
    b.add('spine', capsule([0, s.hipsY, -3], [0, s.chestY - 4, -3.5], 1.6), 'skull');
    b.add('hips', ellipsoid([0, s.hipsY + 0.5, -1], [7, 3.4, 4.4]), 'skull');
    b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 1], [0, s.chinY + 2, L.headC[2] - 1], 1.8), 'skull');
    return torso;
  }
  addBands(b, torso, 'skin', [['hips', 30, s.waistY - 1], ['spine', s.waistY - 1, s.chestY - 4], ['chest', s.chestY - 4, 120]]);
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3.7), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 3.4, 2.9)), 'skin', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.9), capsule([sx, ey - 0.5, sz], [sx, wy + 1, sz], 3.0, 2.3)), 'skin', { mirror: true });
  // the forearm's bulk swelling below the elbow, a vein of shadow down it
  b.add('forearm.L', ellipsoid([sx + 0.3, ey - 3.6, sz + 0.3], [3.0, 4.4, 3.1]), 'skin', { mirror: true });
  b.paint('forearm.L', capsule([sx + 2.4, ey - 2, sz + 1.2], [sx + 1.6, wy + 3, sz + 1.6], 0.45), 'skin', { shade: 2, mirror: true, where: b.isMat('skin') });
  b.add('neck', capsule([0, s.chinY - 6, L.headC[2] - 0.8], [0, s.chinY + 2, L.headC[2] - 0.8], s.neckR), 'skin');
  b.add('thigh.L', blend(1.3, sphere([s.hip[0], s.hip[1], 0], 4.4), capsule([s.hip[0], s.hip[1], 0], [L.knee[0], L.knee[1] + 1, 0], 4.2, 3.2)), 'skin', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([L.knee[0], L.knee[1], 0], 3.2), capsule([L.knee[0], L.knee[1], 0], [L.ankle[0], L.ankle[1] + 1, 0], 3.1, 2.3)), 'skin', { mirror: true });
  return torso;
}

// ---------------------------------------------------------------------------------------------- sealed head

/**
 * A big square head: the cranium, a broad jaw (rows 8 → 10 → 10 → 12 wide), the flat face plate; the nose
 * heavy and hooked; the brows thick white tufts angled down toward the nose; the hair swept straight back
 * off the forehead and flaring out at the nape; the mustache from under the nose out and down past the jaw.
 */
function sealedHead(b: ModelBuilder, L: Landmarks): { front: number; x0: number; chin: number } {
  const s = L.spec;
  const hw = s.head.w / 2, c = s.chinY, h = s.head.h, d = s.head.d;
  const front = Math.round(L.headC[2] + d / 2);
  const back = front - d;
  const cran = box([0, c + 4 + (h - 4) / 2, (front + back) / 2], [hw, (h - 4) / 2, d / 2], { round: 2.4 });
  const occ = ellipsoid([0, c + h * 0.62, back + 4], [hw + 0.3, h * 0.42, 4.6]);
  const jaw = intersect(
    box([0, c + 2.5, (front + back) / 2 + 1], [hw - 0.3, 2.5, d / 2 - 1], { round: 1.2 }),
    halfSpace([hw - 2, c + 0.5, 0], [1, -0.5, 0]),
    halfSpace([-(hw - 2), c + 0.5, 0], [-1, -0.5, 0]),
  );
  b.add('head', blend(1.2, cran, occ, jaw), 'skin');
  b.carve('head', aabb([-hw - 2, c - 2, front], [hw + 2, c + h + 2, front + 6]));
  // ears, a little low and large
  for (const k of [-1, 1]) b.add('head', ellipsoid([k * (hw + 0.4), c + 5.4, -1.2], [0.9, 2.2, 1.6]), 'skin');
  const hd = { front, x0: -hw, chin: c };
  // the brows: thick white tufts angled down toward the nose (stern), a gap cut where the scar crosses the right one
  for (const k of [-1, 1]) {
    const path = smoothPath([[k * 1.0, c + 8.6, front + 0.1], [k * 3.0, c + 9.1, front + 0.4], [k * 5.2, c + 9.6, front + 0.1], [k * 6.5, c + 9.1, front - 1]], 3);
    b.add('head', tube(path, path.map((_, i) => 0.85 - i * 0.02)), 'hair', { thr: 0.25 });
  }
  b.carve('head', aabb([-3.2, c + 7, front], [-2.2, c + 11, front + 4]));
  b.stamp('head', hd.x0, c + 9, FACE, {
    ...faceLegend({ skin: 'skin', brow: 'hair', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'iris', hi: 'sclera', mouth: 'skin' }),
    S: { mat: 'scar' },
    w: { mat: 'wrinkle' },
  }, front - 1);
  // the nose: big and hooked, two voxels wide
  b.add('head', capsule([0, c + 7.2, front - 0.2], [0, c + 4.6, front + 1.3], 1.1), 'skin');
  for (const k of [-1, 1]) b.paint('head', sphere([k * 0.9, c + 4.2, front + 0.6], 0.55), 'nostril');
  // wrinkles: across the forehead, crow's feet by the open eye, deep lines down from the nose
  for (const y of [c + 10.2, c + 11.4]) b.paint('head', capsule([-3.6, y, front - 0.5], [3.4, y + 0.2, front - 0.5], 0.3), 'wrinkle', { where: b.isMat('skin') });
  for (const k of [-1, 1]) b.paint('head', capsule([k * 1.8, c + 4.8, front - 0.5], [k * 3.4, c + 2.6, front - 0.5], 0.32), 'wrinkle', { where: b.isMat('skin') });
  // scars from the left of his chin running down his neck
  b.paint('head', capsule([2.2, c + 1.8, front - 0.5], [3.4, c - 0.5, front - 1.6], 0.42), 'scar', { where: b.isMat('skin') });
  b.paint('head', capsule([3.6, c + 2.2, front - 0.8], [4.6, c - 0.2, front - 2.2], 0.36), 'scar', { where: b.isMat('skin') });
  b.paint('neck', capsule([2.4, c - 1, 1.6], [3.4, c - 7, 1.2], 0.6), 'scar', { where: b.isMat('skin') });
  b.paint('neck', capsule([3.6, c - 0.5, 1], [4.2, c - 5.5, 0.4], 0.5), 'scar', { where: b.isMat('skin') });
  mustache(b, hd);
  hair(b, L, hd);
  return hd;
}

/** The mustache: a heavy mass under the nose, sweeping out over the mouth and down past the corners of the jaw. */
function mustache(b: ModelBuilder, hd: { front: number; chin: number }): void {
  const c = hd.chin, f = hd.front;
  b.add('head', ellipsoid([0, c + 3.7, f + 0.6], [2.7, 1.25, 1.2]), 'hair');
  for (const k of [-1, 1]) {
    const path = smoothPath([[k * 1, c + 3.8, f + 1.1], [k * 3.4, c + 3.4, f + 1.2], [k * 5.6, c + 2, f + 0.4], [k * 6.9, c - 0.2, f - 0.9], [k * 7.3, c - 2.8, f - 2.1]], 4);
    const n = path.length - 1;
    b.add('head', tube(path, path.map((_, i) => {
      const t = i / n;
      return 1.25 + 0.35 * Math.sin(Math.PI * Math.min(1, t * 1.6)) - 0.8 * t * t;
    })), 'hair', { thr: 0.25 });
  }
  // the hairs combed outward: grooves along the sweep
  b.paint('head', fn((x, y) => Math.abs(((y - x * 0.35 * Math.sign(x) + 40) % 1.4) - 0.7) - 0.22, [-9, c - 4, f - 4], [9, c + 5.4, f + 4]), 'hair', { shade: 3, where: b.isMat('hair') });
}

/** White hair swept straight back off the forehead, over the crown and down to the nape, where it flares out. */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): void {
  const c = hd.chin;
  const ctr: V3 = [0, c + 7, -0.8];
  // the hairline: high on the forehead, down over the temples, low at the nape
  const line = (x: number, z: number) => {
    const fr = Math.cos(Math.atan2(x, z - ctr[2]));
    return fr > 0 ? c + 6.8 + fr * 3.9 : c + 6.8 + fr * 5.2;
  };
  b.add('head', intersect(ellipsoid(ctr, [7, 6.6, 7.4]), fn((x, y, z) => line(x, z) - y, [-9, c - 2, -10], [9, c + 15, 10])), 'hair');
  // a pompadour's lift off the forehead
  b.add('head', ellipsoid([0, c + 11.4, 3.4], [4.6, 1.8, 3]), 'hair');
  // the ends at the nape flare out
  for (const k of [-1, -0.5, 0, 0.5, 1]) {
    const p = smoothPath([[k * 4.6, c + 3, -7.2], [k * 5.6, c + 1.2, -8.2], [k * 6.6, c - 0.4, -8.4]], 3);
    b.add('head', tube(p, p.map((_, i) => 1.5 - i * 0.12)), 'hair', { thr: 0.25 });
  }
  // grooves combed straight back
  b.paint('head', fn((x) => Math.abs(((x + 40) % 1.8) - 0.9) - 0.25, [-9, c + 1, -10], [9, c + 15, 10]), 'hair', { shade: 3, where: b.isMat('hair') });
  b.socket('crown.top', 'head', [0, c + 13.6, -0.8]);
  void L;
}

/** The bone crown: a band floating clear of his head at the hairline, five points over his forehead. */
function boneCrown(b: ModelBuilder, hd: { chin: number }): void {
  const c = hd.chin;
  const cy = c + 10.6, cz = -0.7, R = 7.5;
  b.bone('crown', 'head', [0, cy, cz]);
  b.add('crown', torus([0, cy, cz], R, 0.7), 'crownBone', { thr: 0.2 });
  b.add('crown', intersect(torus([0, cy + 0.4, cz], R, 0.9), halfSpace([0, 0, cz + 2], [0, 0, -1])), 'crownBone', { thr: 0.2 });
  for (const [a, len] of [[-58, 2.4], [-29, 3.2], [0, 4.6], [29, 3.2], [58, 2.4]] as [number, number][]) {
    const r = (a * Math.PI) / 180;
    const base: V3 = [Math.sin(r) * R, cy + 0.5, cz + Math.cos(r) * R];
    b.add('crown', spike(base, [Math.sin(r) * 0.12, 1, Math.cos(r) * 0.12], len, 0.9, 0.6, { tip: 0.4 }), 'crownBone', { thr: 0.25 });
  }
  // a groove along the band
  b.paint('crown', torus([0, cy, cz], R + 0.7, 0.3), 'crownBone', { shade: 3, where: b.isMat('crownBone') });
}

// ---------------------------------------------------------------------------------------------- the coat

/**
 * The white leather coat above the belt: closed, a broad black fur trim down the front, a heavy fur collar
 * round the neck and over the shoulders; short sleeves to above the elbow ending in fur cuffs; gold bands on
 * the bare wrists.
 */
function coat(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  // (down under the belt, so the chains and the disc sit on it)
  const shellT = intersect(subtract(offset(torso, 1.5), offset(torso, 0.1)), aabb([-30, s.waistY - 9.5, -30], [30, sy + 7, 30]));
  addBands(b, shellT, 'coat', [['spine', s.waistY - 10, s.chestY - 4], ['chest', s.chestY - 4, 120]]);
  // the fur trim down the front
  addBands(b, intersect(offset(torso, 2.5), aabb([-1.6, s.waistY - 5, 0], [1.6, sy + 4, 20])), 'fur', [['spine', s.waistY - 6, s.chestY - 4], ['chest', s.chestY - 4, 120]], { thr: 0.2 });
  // a fold or two of leather under the arms and across the back
  for (const k of [-1, 1]) b.paint('chest', capsule([k * 8.4, s.chestY + 3, 5], [k * 6.2, s.chestY - 5, 7.6], 0.6), 'coat', { shade: 3, where: b.isMat('coat') });
  b.paint('chest', capsule([-7, s.chestY + 1, -8.2], [7, s.chestY + 1, -8.2], 0.5), 'coat', { shade: 3, where: b.isMat('coat') });
  // the collar: a thick ring of fur round his neck and over his shoulders, tufted
  const ny = sy + 2.4, nz = L.headC[2] - 1.4;
  b.add('chest', blend(1.6, torus([0, ny, nz], 6.6, 2.7), ellipsoid([0, ny - 1.4, nz - 1.6], [9.6, 2.4, 6.6])), 'fur', { thr: 0.2 });
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const r = 7.6 + (i % 3) * 0.5;
    b.add('chest', spike([Math.sin(a) * r * 0.95, ny + 0.4, nz + Math.cos(a) * r * 0.82], [Math.sin(a), 0.65 + (i % 2) * 0.3, Math.cos(a)], 2.2 + (i % 3) * 0.6, 1.25, 0.8, { tip: 0.3 }), 'fur', { thr: 0.3 });
  }
  // short sleeves, flaring a little, a fur cuff at the end
  b.add('upperarm.L', blend(1.5, sphere([sx, sy - 0.5, sz], 4.9), cylinder([sx + 0.3, ey + 2.4, sz], [sx, sy - 0.5, sz], 4.9, 4.5, 1)), 'coat', { mirror: true });
  b.add('upperarm.L', torus([sx + 0.3, ey + 2.6, sz], 4.9, 1.2), 'fur', { mirror: true, thr: 0.2 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    b.add('upperarm.L', spike([sx + 0.3 + Math.cos(a) * 5, ey + 2.2, sz + Math.sin(a) * 5], [Math.cos(a) * 0.5, -1, Math.sin(a) * 0.5], 1.8 + (i % 2) * 0.6, 1, 0.7, { tip: 0.3 }), 'fur', { mirror: true, thr: 0.3 });
  }
  // the gold wristbands: a raised rim at each edge, a groove round the middle
  b.add('forearm.L', cylinder([sx, wy + 0.4, sz], [sx, wy + 4.4, sz], 3.0), 'gold', { mirror: true });
  for (const y of [wy + 0.7, wy + 4.1]) b.add('forearm.L', torus([sx, y, sz], 3.0, 0.5), 'gold', { mirror: true, thr: 0.2 });
  b.paint('forearm.L', cylinder([sx, wy + 2.1, sz], [sx, wy + 2.7, sz], 3.6), 'gold', { shade: 3, mirror: true, where: b.isMat('gold') });
}

/** An oval chain link: a ring of radius R stretched ±h along `along` within its plane (normal `axis`), wire radius r. */
function link(c: V3, axis: V3, along: V3, R: number, r: number, h: number): Sdf {
  const pad = R + h + r + 1;
  return fn((x, y, z) => {
    const px = x - c[0], py = y - c[1], pz = z - c[2];
    const pa = px * axis[0] + py * axis[1] + pz * axis[2];
    let qx = px - pa * axis[0], qy = py - pa * axis[1], qz = pz - pa * axis[2];
    const pt = qx * along[0] + qy * along[1] + qz * along[2];
    const k = Math.max(-h, Math.min(h, pt));
    qx -= k * along[0];
    qy -= k * along[1];
    qz -= k * along[2];
    return Math.hypot(Math.hypot(qx, qy, qz) - R, pa) - r;
  }, [c[0] - pad, c[1] - pad, c[2] - pad], [c[0] + pad, c[1] + pad, c[2] + pad]);
}

/** a chain along a polyline: links alternate flat and edge-on */
function chainAlong(b: ModelBuilder, bone: string, pts: readonly V3[], mat: string, size = 1, mirror = false): void {
  const R = 0.95 * size, r = 0.6 * size, h = 0.6 * size;
  const pitch = 2 * (R + h) - 0.4;
  let acc = 0, idx = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], q = pts[i + 1];
    const seg = Math.hypot(q[0] - a[0], q[1] - a[1], q[2] - a[2]);
    if (seg < 1e-6) continue;
    const t: V3 = [(q[0] - a[0]) / seg, (q[1] - a[1]) / seg, (q[2] - a[2]) / seg];
    // a side vector: horizontal when the chain runs level, otherwise across it
    let side: V3 = Math.abs(t[1]) < 0.9 ? [t[2], 0, -t[0]] : [1, 0, 0];
    const sl = Math.hypot(side[0], side[1], side[2]);
    side = [side[0] / sl, side[1] / sl, side[2] / sl];
    const up: V3 = [t[1] * side[2] - t[2] * side[1], t[2] * side[0] - t[0] * side[2], t[0] * side[1] - t[1] * side[0]];
    while (acc <= seg) {
      const c: V3 = [a[0] + t[0] * acc, a[1] + t[1] * acc, a[2] + t[2] * acc];
      b.add(bone, link(c, idx % 2 === 0 ? up : side, t, R, r, h), mat, { thr: 0.15, mirror });
      idx++;
      acc += pitch;
    }
    acc -= seg;
  }
}

/** Three thick gold chains round the waist, clasped at the front to a big disc with a sun on it. */
function beltOfChains(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const surf = offset(torso, 2.1);
  const ys = [s.waistY - 1.8, s.waistY - 4.4, s.waistY - 7];
  let zFront = 0;
  for (const y of ys) {
    const pts: V3[] = [];
    const n = 40;
    for (let i = 0; i <= n; i++) {
      // from the disc's right edge round the back to its left edge
      const a = -Math.PI / 2 + 0.42 + (i / n) * (Math.PI * 2 - 0.84);
      const dx = -Math.sin(a + Math.PI / 2), dz = Math.cos(a + Math.PI / 2);
      let r = 20;
      while (r > 0 && surf.d(dx * r, y, dz * r) > 0) r -= 0.2;
      pts.push([dx * (r + 0.5), y, dz * (r + 0.5)]);
    }
    chainAlong(b, 'spine', pts, 'chain', 1.05);
    let r = 20;
    while (r > 0 && surf.d(0, y, r) > 0) r -= 0.2;
    zFront = Math.max(zFront, r);
  }
  // the disc: rimmed, a sun in relief — a boss and eight rays
  const dy = ys[1], dz = zFront + 0.8;
  b.add('spine', cylinder([0, dy, dz - 1.2], [0, dy, dz + 0.4], 4.6, 4.6, 0.5), 'gold');
  b.add('spine', torus([0, dy, dz + 0.2], 4.3, 0.55, [90, 0, 0]), 'gold', { thr: 0.2 });
  b.add('spine', sphere([0, dy, dz + 0.4], 1.7), 'gold');
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.add('spine', capsule([Math.cos(a) * 2.2, dy + Math.sin(a) * 2.2, dz + 0.5], [Math.cos(a) * 3.5, dy + Math.sin(a) * 3.5, dz + 0.5], 0.55, 0.35), 'gold', { thr: 0.2 });
  }
  b.paint('spine', cylinder([0, dy, dz - 0.5], [0, dy, dz + 0.3], 3.9), 'gold', { shade: 2, where: b.isMat('gold') });
}

// ---------------------------------------------------------------------------------------------- Arrogante

/**
 * The skull: a big cranium, deep dark sockets, the nasal hollow, cheekbones, a row of teeth in each jaw; a
 * crack runs from the right socket up over the brow and down the cheek, where the scar was.
 */
function skull(b: ModelBuilder, L: Landmarks): { front: number; x0: number; chin: number } {
  const s = L.spec;
  const c = s.chinY;
  const front = Math.round(L.headC[2] + s.head.d / 2);
  const cran = ellipsoid([0, c + 7.6, -0.8], [6, 5.6, 6.8]);
  const face = box([0, c + 4.8, 1.2], [4.4, 2.6, 4.4], { round: 1.6 });
  const cheeks = [-1, 1].map((k) => ellipsoid([k * 4.4, c + 5.2, 2.2], [1.9, 1.5, 2.6]));
  const upperJaw = box([0, c + 2.6, 1.8], [3.7, 1.2, 3.9], { round: 1 });
  b.add('head', blend(1, cran, face, ...cheeks, upperJaw), 'skull');
  // the lower jaw, hinged under the cheekbones
  b.add('head', blend(0.8, box([0, c + 0.9, 1.6], [3.9, 1.1, 3.8], { round: 1 }), ...[-1, 1].map((k) => capsule([k * 4, c + 0.6, 0.6], [k * 4.4, c + 4.2, -1.4], 1))), 'skull');
  b.carve('head', aabb([-8, c - 2, front], [8, c + 14, front + 6]));
  // sockets: deep, dark
  for (const k of [-1, 1]) {
    b.carve('head', ellipsoid([k * 2.5, c + 6.4, front], [1.8, 1.9, 2.2]));
    b.paint('head', ellipsoid([k * 2.5, c + 6.4, front - 2.4], [1.9, 2.0, 2.2]), 'socket', { where: b.isMat('skull') });
  }
  // the nasal hollow: an inverted heart
  b.carve('head', capsule([0, c + 5.2, front], [0, c + 3.9, front], 0.9));
  b.paint('head', capsule([0, c + 5.3, front - 1.6], [0, c + 3.8, front - 1.6], 0.95), 'socket', { where: b.isMat('skull') });
  // teeth: a groove between the jaws, gaps between the teeth
  b.carve('head', aabb([-3.2, c + 1.8, front - 1], [3.2, c + 2.2, front + 4]));
  b.paint('head', aabb([-3.4, c + 1.6, front - 2.5], [3.4, c + 2.4, front - 0.6]), 'socket', { where: b.isMat('skull') });
  for (let x = -3; x <= 2; x++) b.paint('head', aabb([x + 0.9, c + 0.6, front - 1.2], [x + 1.1, c + 3.4, front + 1]), 'skull', { shade: 4, where: b.isMat('skull') });
  // the crack where the scar was: from the brow down through the right socket to the cheekbone
  b.paint('head', tube(smoothPath([[-3, c + 11.6, 3.8], [-3.2, c + 9.4, front - 0.6], [-2.8, c + 8.2, front - 0.6], [-3.6, c + 4.4, front - 0.6], [-4.4, c + 3.2, front - 1.2]], 3), [0.45, 0.45, 0.4, 0.4, 0.35, 0.3, 0.3, 0.3, 0.3, 0.3]), 'crack', { where: b.isMat('skull') });
  // a sheen across the dome
  b.paint('head', sphere([0, c + 12.4, 0.4], 2.4), 'skull', { shade: 0, where: b.isMat('skull') });
  return { front, x0: -s.head.w / 2, chin: c };
}

/**
 * The crown of the God-King: a broad gold band round the skull set with jewels, six tall ornate prongs each
 * tipped with a ball, arches between them; a chain hangs off it on the left.
 */
function jewelledCrown(b: ModelBuilder, hd: { chin: number }): void {
  const c = hd.chin;
  const cy = c + 11.6, cz = -0.8, R = 5.6;
  // (resting on the skull: the band's inside bites into the dome)
  b.add('head', subtract(cylinder([0, cy - 1.2, cz], [0, cy + 1.6, cz], R + 0.8, R + 1.1), cylinder([0, cy - 3, cz], [0, cy + 3, cz], R - 1.6, R - 1.3)), 'crown');
  for (const y of [cy - 1, cy + 1.3]) b.add('head', torus([0, y, cz], R + 1, 0.5), 'crown', { thr: 0.2 });
  const prongs = 6;
  for (let i = 0; i < prongs; i++) {
    const a = (i / prongs) * Math.PI * 2;
    const tall = Math.cos(a) > 0.5 ? 5.6 : 4.2;
    const base: V3 = [Math.sin(a) * (R + 0.6), cy + 1.4, cz + Math.cos(a) * (R + 0.6)];
    b.add('head', spike(base, [Math.sin(a) * 0.25, 1, Math.cos(a) * 0.25], tall, 1, 0.6, { tip: 0.6 }), 'crown', { thr: 0.25 });
    b.add('head', sphere([base[0] + Math.sin(a) * 0.25 * tall, base[1] + tall + 0.3, base[2] + Math.cos(a) * 0.25 * tall], 0.85), 'crown');
    // a jewel on the band under each prong: ruby at the front, then emerald and sapphire in turn
    const jewel = i === 0 ? 'ruby' : i % 2 === 0 ? 'sapphire' : 'emerald';
    b.add('head', ellipsoid([Math.sin(a) * (R + 1.3), cy + 0.2, cz + Math.cos(a) * (R + 1.3)], [0.75, 0.95, 0.75]), jewel);
  }
  // the arches between the prongs, sagging toward the band
  for (let i = 0; i < prongs; i++) {
    const a0 = (i / prongs) * Math.PI * 2, a1 = ((i + 1) / prongs) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const pts = smoothPath([
      [Math.sin(a0) * (R + 0.8), cy + 4, cz + Math.cos(a0) * (R + 0.8)],
      [Math.sin(am) * (R + 1.1), cy + 2.6, cz + Math.cos(am) * (R + 1.1)],
      [Math.sin(a1) * (R + 0.8), cy + 4, cz + Math.cos(a1) * (R + 0.8)],
    ], 3);
    b.add('head', tube(pts, pts.map(() => 0.65)), 'crown', { thr: 0.2 });
  }
  // the chain hanging off the band on his left
  chainAlong(b, 'head', [[R + 1.2, cy - 1.4, cz + 2], [R + 1.6, cy - 5, cz + 2.4], [R + 1.4, cy - 8.4, cz + 2.2]], 'crown', 0.8);
}

/**
 * The arms: bare bone — the humerus, the two forearm bones, the hand's bones; the gold bands still on the
 * wrists, two short gold chains swinging from each.
 */
function boneArms(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(0.8, sphere([sx, sy - 0.6, sz], 2.4), capsule([sx, sy - 1.5, sz], [sx, ey + 1.5, sz], 1.3), sphere([sx, ey + 0.4, sz], 2)), 'skull', { mirror: true });
  for (const dz of [-0.95, 0.95]) b.add('forearm.L', capsule([sx, ey - 0.5, sz + dz * 0.6], [sx, wy + 1, sz + dz], 1.05, 0.9), 'skull', { mirror: true });
  b.add('forearm.L', sphere([sx, ey - 0.4, sz], 1.9), 'skull', { mirror: true });
  b.add('forearm.L', cylinder([sx, wy + 0.4, sz], [sx, wy + 4.2, sz], 2.5), 'gold', { mirror: true });
  for (const y of [wy + 0.7, wy + 3.9]) b.add('forearm.L', torus([sx, y, sz], 2.5, 0.45), 'gold', { mirror: true, thr: 0.2 });
  for (const dz of [-1.6, 1.6]) chainAlong(b, 'forearm.L', [[sx + 1.8, wy + 1, sz + dz], [sx + 2.4, wy - 3, sz + dz * 1.2], [sx + 2.2, wy - 7, sz + dz * 1.1]], 'gold', 0.75, true);
  // the hands: a block of wrist bones, finger bones in segments; the fist curled round the grip channel
  const gy = wy - 4.3;
  b.add('palm.L', blend(0.7, box([sx, wy - 2, sz + 0.3], [1.3, 1.6, 2.1], { round: 0.8 }), capsule([sx, wy + 0.5, sz], [sx, wy - 1, sz], 1.2)), 'skull', { mirror: true });
  for (const dz of [-1.4, -0.2, 1, 2.1]) b.add('palm.L', tube([[sx, wy - 3, sz + dz], [sx - 0.2, wy - 6, sz + dz * 1.05], [sx - 0.6, wy - 8.4, sz + dz * 1.08]], [0.8, 0.75, 0.6]), 'skull', { mirror: true, thr: 0.2 });
  b.add('palm.L', capsule([sx - 0.6, wy - 2, sz + 2.4], [sx - 1.4, wy - 4.6, sz + 3.6], 0.8), 'skull', { mirror: true, thr: 0.2 });
  b.add('fist.L', subtract(box([sx - 0.1, gy, sz + 0.4], [1.9, 2.8, 2.7], { round: 1 }), cylinder([sx - 0.1, gy, sz - 6], [sx - 0.1, gy, sz + 6], 1.2)), 'skull', { mirror: true });
  b.add('fist.L', capsule([sx, wy + 0.5, sz], [sx, wy - 1.5, sz], 1.3), 'skull', { mirror: true });
  b.paint('fist.L', aabb([sx + 1.2, gy - 3, sz - 3], [sx + 2.2, gy + 3, sz + 3.4]), 'skull', { shade: 3, mirror: true, where: b.isMat('skull') });
  for (const y of [gy + 1.5, gy - 0.3, gy - 2]) b.paint('fist.L', aabb([sx - 3, y - 0.25, sz - 3], [sx + 3, y + 0.25, sz + 4]), 'socket', { mirror: true, where: b.isMat('skull') });
}

/**
 * The cloak: deep purple from the shoulders to the ankles, open just a crack down the front over the ribs, a
 * tattered black fur collar standing round the skull and a black fringe along the hem; the red slit eye
 * hangs at his throat in a gold setting.
 */
function cloak(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy] = s.shoulder;
  const ey = L.elbow[1];
  // the mantle over the chest and shoulders: wide, falling over the tops of the arms; slits for the arms
  const mantle = intersect(
    subtract(blend(2.4, offset(torso, 2.4), ellipsoid([0, sy - 3, -0.6], [sx + 4.6, 9, 9.4])), offset(torso, 0.6)),
    aabb([-30, s.waistY - 6, -30], [30, sy + 6, 30]),
  );
  addBands(b, mantle, 'cloak', [['spine', s.waistY - 7, s.chestY - 4], ['chest', s.chestY - 4, 120]]);
  b.paint(['spine', 'chest'], offset(torso, 1.6), 'cloakIn', { where: b.isMat('cloak') });
  // where the arms come out: the mantle cut back round them
  for (const k of [-1, 1]) b.carve('chest', capsule([k * sx, sy - 1, -0.5], [k * (sx + 0.6), ey + 1, -0.5], 3.2));
  // open a crack down the front over the ribs
  b.carve('spine', aabb([-1.6, s.waistY - 6, 6.5], [1.6, s.chestY - 4, 20]));
  b.carve('chest', aabb([-1.6, s.chestY - 4, 6.5], [1.6, sy - 5, 20]));
  // folds down from the shoulders
  for (const k of [-1, 1]) for (const dz of [-4, 3]) b.paint(['chest', 'spine'], capsule([k * (sx - 1), sy + 1, dz], [k * (sx + 1.6), s.waistY - 6, dz * 1.4], 0.7), 'cloak', { shade: 4, where: b.isMat('cloak') });
  // below the waist: long panels to the ankles on spring chains, the black fringe at the hem
  const skirt = coatSkirt(b, L, { mat: 'cloak', lining: 'cloakIn', yTop: s.waistY - 4, yHem: 3, r0: 11.6, r1: 15.8, openFront: 3 });
  const panels = ['F.L', 'S.L', 'B.L', 'B.R', 'S.R', 'F.R'].flatMap((p) => [`coat.${p}`, `coat.${p}.2`]);
  b.paint(panels, aabb([-30, 0, -30], [30, 6.4, 30]), 'fur', { where: b.isMat('cloak', 'cloakIn') });
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    const deg = ((a * 180) / Math.PI + 360) % 360;
    const side = deg > 180 ? deg - 360 : deg;
    const panel = Math.abs(side) < 3 ? null : side > 0 ? (side < 60 ? 'F.L' : side < 120 ? 'S.L' : 'B.L') : side > -60 ? 'F.R' : side > -120 ? 'S.R' : 'B.R';
    if (!panel) continue;
    const r = 15.4;
    b.add(`coat.${panel}.2`, spike([Math.sin(a) * r, 4.6, -0.6 + Math.cos(a) * r], [Math.sin(a) * 0.25, -1, Math.cos(a) * 0.25], 2.6 + (i % 3) * 0.8, 1.1, 0.8, { tip: 0.3 }), 'fur', { thr: 0.3 });
  }
  // the fur collar: standing up round the skull, tattered into tufts
  const ny = sy + 2.6, nz = L.headC[2] - 1.6;
  b.add('chest', blend(1.6, torus([0, ny, nz], 7, 3), ellipsoid([0, ny - 1.6, nz - 1.4], [11, 2.8, 7.6])), 'fur', { thr: 0.2 });
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const r = 8.4 + (i % 3) * 0.6;
    const front = Math.max(0, Math.cos(a));
    b.add('chest', spike([Math.sin(a) * r, ny + 0.6, nz + Math.cos(a) * r * 0.85], [Math.sin(a) * 0.55, 1 - front * 0.5, Math.cos(a) * 0.55], 3 + (i % 3) * 0.9 - front * 1.2, 1.4, 0.9, { tip: 0.3 }), 'fur', { thr: 0.3 });
  }
  b.paint('chest', fn((x, y, z) => Math.abs(((x * 1.7 + z * 1.3 + y * 0.4 + 90) % 1.6) - 0.8) - 0.22, [-20, sy - 8, -20], [20, sy + 12, 20]), 'fur', { shade: 3, where: b.isMat('fur') });
  // the eye pendant at the throat: gold-set, red, a black slit
  const py = sy + 1.5, pz = 8.2;
  b.add('chest', torus([0, py, pz - 0.2], 2.3, 0.6, [90, 0, 0]), 'gold', { thr: 0.2 });
  b.add('chest', ellipsoid([0, py, pz], [1.7, 2.3, 0.9]), 'eye');
  b.paint('chest', aabb([-0.45, py - 2, pz - 1], [0.45, py + 2, pz + 2]), 'slit', { where: b.isMat('eye') });
  b.add('chest', ellipsoid([0, py, pz - 1.2], [2.3, 2.8, 1]), 'gold');
  return skirt;
}

/** Tall white boots below the cloak, the toes drawn out to a point. */
function boots(b: ModelBuilder, L: Landmarks): void {
  const [ax, ay, az] = L.ankle;
  const f = L.spec.foot;
  const ky = L.knee[1];
  b.add('shin.L', cylinder([ax, ay + 2, az], [ax, ky + 2, az], 3, 3.6, 1), 'boot', { mirror: true });
  b.add('shin.L', torus([ax, ky + 1.6, az], 3.8, 0.7), 'boot', { mirror: true, thr: 0.2 });
  b.add('thigh.L', blend(1.2, sphere([L.spec.hip[0], L.spec.hip[1], 0], 3.4), capsule([L.spec.hip[0], L.spec.hip[1], 0], [ax, ky + 1, 0], 2.8, 2.4)), 'skull', { mirror: true });
  b.add('foot.L', capsule([ax, ay + 3, az - 0.4], [ax, ay - 1, az - 0.4], 3), 'boot', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.1, az + (f.len / 2 - f.heel)], [f.w / 2, 2.1, f.len / 2], { round: 1.4 }), halfSpace([0, 4.4, az + f.len - f.heel - 4], [0, 1, 0.6])), 'boot', { mirror: true });
  b.add('foot.L', spike([ax, 1.4, az + f.len - f.heel - 2], [0, 0.05, 1], 5.5, 1.8, 1.3, { tip: 0.4 }), 'boot', { mirror: true, thr: 0.2 });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 0.9, az + 20]), 'boot', { shade: 3, mirror: true });
}

// ---------------------------------------------------------------------------------------------- props

/**
 * Arrogante: two black half-moon blades back to back on a long haft, their curved edges silver; the block
 * between them holds the red slit eye on both faces; twelve white studs on the squared foot of the haft, the
 * butt wrapped in gold. Prop frame: the grip at the origin, the haft along +Z, the blades spread along ±Y.
 */
function buildArrogante(): VoxelModel {
  const b = new ModelBuilder('baraggan-arrogante', BARAGGAN_RES);
  b.mat('blade', ['#3A3B42', '#2A2A30', '#1E1E23', '#141418'], { base: 1, rough: 0.35, metal: 0.7 });
  b.mat('edge', ['#E4E7EA', '#C9CDD2', '#A8ADB4'], { base: 1, rough: 0.2, metal: 0.9 });
  b.mat('haft', ['#3E352E', '#2A2420', '#1E1A17'], { base: 1, rough: 0.6 });
  b.mat('stud', ['#F3F1EA', '#DCD8CE'], { base: 0, rough: 0.4 });
  b.mat('gold', ['#F0D27A', '#D4AF37', '#AE8C26', '#86691A'], { base: 1, rough: 0.35, metal: 0.85 });
  b.mat('eye', ['#D8262E', '#C3121C', '#8E0C14'], { base: 1, rough: 0.25 });
  b.mat('slit', ['#141418']);
  b.bone('root', null, [0, 0, 0]);
  const zH = 58;
  b.add('root', cylinder([0, 0, -20], [0, 0, zH + 6], 1.3), 'haft');
  // the squared foot with three white studs on each face
  b.add('root', box([0, 0, -12], [1.6, 1.6, 7.6], { round: 0.5 }), 'haft');
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
    for (const z of [-16, -12, -8]) b.add('root', sphere([dx * 1.9, dy * 1.9, z], 0.8), 'stud');
  // the gold-wrapped butt
  b.add('root', cylinder([0, 0, -24.5], [0, 0, -19.5], 1.8, 1.8, 0.6), 'gold');
  for (const z of [-23.4, -21.8, -20.4]) b.paint('root', cylinder([0, 0, z - 0.3], [0, 0, z + 0.3], 2.2), 'gold', { shade: 3 });
  // the blades: half-moons, the curved edge outward, necked where they meet the block
  for (const k of [-1, 1]) {
    const half = fn((x, y, z) => {
      const u = (y - k * 3) * k, v = z - zH;
      const ell = Math.hypot(u / 14, v / 13) - 1;
      const neck = 2.6 + Math.max(0, u) * 0.85 - Math.abs(v);
      return Math.max(Math.abs(x) - 1.1, ell * 13, -u, -neck);
    }, [-2, k > 0 ? 0 : -19, zH - 15], [2, k > 0 ? 19 : 0, zH + 15]);
    b.add('root', half, 'blade');
    b.paint('root', fn((x, y, z) => {
      const u = (y - k * 3) * k, v = z - zH;
      return Math.max(Math.abs(x) - 2, 0.86 - Math.hypot(u / 14, v / 13), -u + 3);
    }, [-2, k > 0 ? 0 : -19, zH - 15], [2, k > 0 ? 19 : 0, zH + 15]), 'edge', { where: b.isMat('blade') });
  }
  // the block holding the eye on both faces
  b.add('root', box([0, 0, zH], [2.2, 3.6, 4.6], { round: 1 }), 'blade');
  for (const k of [-1, 1]) {
    b.add('root', ellipsoid([k * 2, 0, zH], [0.8, 1.6, 2.8]), 'eye');
    b.paint('root', aabb([k > 0 ? 1.4 : -3, -0.45, zH - 2.6], [k > 0 ? 3 : -1.4, 0.45, zH + 2.6]), 'slit', { where: b.isMat('eye') });
    b.add('root', subtract(ellipsoid([k * 1.8, 0, zH], [1, 2.4, 3.6]), ellipsoid([k * 2.2, 0, zH], [1, 1.6, 2.8])), 'gold', { thr: 0.2 });
  }
  b.add('root', sphere([0, 0, zH + 6.6], 1.6), 'gold');
  b.autoShade();
  b.lint();
  return b.build();
}

/**
 * Gran Caída: the King's axe — slimmer and darker, two pointed crescent blades, a long spike thrust forward
 * (+X) from the head where Arrogante's eye was, gold chains wound round the spike's root. Prop frame as
 * Arrogante: the grip at the origin, the haft along +Z.
 */
function buildGranCaida(): VoxelModel {
  const b = new ModelBuilder('baraggan-gran-caida', BARAGGAN_RES);
  b.mat('blade', ['#2E2C34', '#221F27', '#16141A', '#141418'], { base: 1, rough: 0.35, metal: 0.7 });
  b.mat('edge', ['#B0B4BA', '#8E9196', '#6E7278'], { base: 1, rough: 0.25, metal: 0.85 });
  b.mat('haft', ['#2E2A2A', '#1E1B1C', '#141418'], { base: 1, rough: 0.6 });
  b.mat('gold', ['#F0D27A', '#D4AF37', '#AE8C26', '#86691A'], { base: 1, rough: 0.35, metal: 0.85 });
  b.bone('root', null, [0, 0, 0]);
  const zH = 50;
  b.add('root', cylinder([0, 0, -20], [0, 0, zH + 9], 1.1), 'haft');
  b.add('root', cylinder([0, 0, -22], [0, 0, -18], 1.5, 1.5, 0.5), 'gold');
  // two crescents, points up and down, the cutting curve outward
  for (const k of [-1, 1]) {
    b.add('root', fn((x, y, z) => {
      const u = y * k, v = z - zH;
      const outer = Math.hypot(u + 2, v) - 15;
      const inner = Math.hypot(u + 9, v) - 13.4;
      return Math.max(Math.abs(x) - 0.9, outer, -inner, -u + 1);
    }, [-2, k > 0 ? 0 : -15, zH - 16], [2, k > 0 ? 15 : 0, zH + 16]), 'blade');
    b.paint('root', fn((x, y, z) => {
      const u = y * k, v = z - zH;
      return Math.max(Math.abs(x) - 2, Math.abs(Math.hypot(u + 2, v) - 14.3) - 0.8);
    }, [-2, k > 0 ? 0 : -15, zH - 16], [2, k > 0 ? 15 : 0, zH + 16]), 'edge', { where: b.isMat('blade') });
  }
  b.add('root', box([0, 0, zH], [2, 2.6, 4.4], { round: 0.8 }), 'blade');
  // the spike forward, and a short one up the top
  b.add('root', spike([1, 0, zH], [1, 0, 0], 11, 1.8, 1.3, { tip: 0.25 }), 'blade', { thr: 0.2 });
  b.add('root', spike([0, 0, zH + 8], [0, 0, 1], 5, 1.2, 0.9, { tip: 0.3 }), 'blade', { thr: 0.2 });
  // gold chains wound round the spike's root and hanging down the haft
  for (const dz of [-1.6, 1.6]) chainAlong(b, 'root', [[2.4, 0, zH + dz], [2.6, 1.2, zH + dz - 3], [1.8, 1.4, zH + dz - 7], [1.4, 1.2, zH + dz - 11]], 'gold', 0.6);
  b.add('root', torus([2.6, 0, zH], 2.1, 0.55, [0, 0, 90]), 'gold', { thr: 0.2 });
  b.autoShade();
  b.lint();
  return b.build();
}
