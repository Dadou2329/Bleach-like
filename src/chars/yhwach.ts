// Yhwach (docs/roster/H1-vandenreich-leaders.md, "Yhwach"): the Quincy King, emperor of the Wandenreich. Brief:
// 200 cm → 96 vox at 48/m (head ≈ 13.5); tall, broad-shouldered, upright and regal; a long face with a broad
// clean-shaven chin, thin brows, reddish-brown eyes, mutton chops joined to the moustache; straight black hair
// falling as one curtain to the lower back. Silhouette keys: the ankle-length tattered cloak flaring off broad
// shoulders, the big lapels and cuffs of the white coat, the hair curtain, a hand on the hip. Outfit (1st
// invasion): a white double-breasted trench coat to the shins with the Wandenreich emblem at the middle, big
// buttoned cuffs and lapels, white trousers, trench boots; over it the tattered maroon-black cloak with a red
// ribbon at the neck fastened on the left with one large button; the Quincy Cross medal on the left breast.
// Forms: 'emperor' (eyes normal), 'almighty' (crimson irises, three pupils to an eye), 'soulking' (the Black:
// an oily black shroud with eyes opening on it in place of the coat and cloak, the white shirt showing at the
// chest; the many-eyed black mask is a prop on 'face'). Props: the Reishi sword (a dādāo-like blade, a long
// grip, a bird with spread wings for a guard) and the Reishi broadsword (a giant Heilig Pfeil as long as he is
// tall, its guard and grip the Wandenreich cross). (verify) boot colour, button colour, emblem colour.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, offset, prism, smoothPath, sphere, subtract, torus, tube, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, hands, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

export const YHWACH_RES = 48;

export type YhwachForm = 'emperor' | 'almighty' | 'soulking';

/** Tall and broad: long limbs, a deep chest, wide shoulders. */
const SPEC: HumanoidSpec = {
  H: 96,
  chinY: 82,
  head: { w: 10.6, d: 11.6, h: 13.5 },
  neckR: 3.0,
  shoulder: [11.0, 75.6, -0.5],
  upperArm: 16.6,
  foreArm: 15,
  hand: 10.2,
  armR: 3.0,
  hipsY: 51.5,
  hip: [5.2, 48, 0],
  kneeY: 26.4,
  ankleY: 5.2,
  chest: [9.8, 5.8],
  waist: [7.8, 5.0],
  hips: [8.2, 5.3],
  chestY: 69.6,
  waistY: 58.2,
  foot: { len: 13.5, w: 5.4, heel: 3.3 },
};

function palette(b: ModelBuilder, form: YhwachForm): void {
  b.mat('skin', ['#F0D8C2', '#E2C6AE', '#CFAF96', '#B99880', '#9C7E68'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#3A3542', '#2B2731', '#201D26', '#18161C', '#141217'], { base: 2, rough: 0.4, shadeK: 0.85, dither: 0.03 });
  b.mat('lid', ['#2A1E1C']);
  b.mat('sclera', ['#F1ECE4']);
  b.mat('iris', form === 'emperor' ? ['#7A2A22'] : ['#B5121B'], form === 'emperor' ? {} : { glow: 0.5 });
  b.mat('irisD', ['#1A0C0C']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#8A4A44']);
  b.mat('coat', ['#F3F3F0', '#EEEDE7', '#DCDCD8', '#C7C9CF', '#9EA2AA'], { base: 1, rough: 0.7, shadeK: 0.9 });
  b.mat('coatIn', ['#D8D8D4', '#C7C9CF', '#ABAEB6'], { base: 1, rough: 0.8 });
  b.mat('silver', ['#E9ECF2', '#C9CCD2', '#A2A7B0', '#7E838C'], { base: 1, rough: 0.3, metal: 0.85, shadeK: 0.8 });
  b.mat('emblem', ['#2A2D36', '#1B1D24'], { base: 1, rough: 0.5 });
  b.mat('boot', ['#E4E3DC', '#CFCEC7', '#B4B3AC', '#8E8D88'], { base: 1, rough: 0.5, shadeK: 0.85 });
  b.mat('sole', ['#5A5A60', '#45454B']);
  b.mat('cloak', ['#5A2E36', '#45222A', '#3A1C22', '#2A1518', '#1C0E10'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('cloakIn', ['#2A1518', '#1F1013', '#1A0E10'], { base: 1, rough: 0.9 });
  b.mat('ribbon', ['#C42A33', '#A3141E', '#7E0F17'], { base: 1, rough: 0.6 });
  b.mat('button', ['#4A4146', '#3A3236', '#2A2427'], { base: 1, rough: 0.4, metal: 0.4 });
  b.mat('medal', ['#E9ECF2', '#C8CCD4', '#9EA4AE'], { base: 1, rough: 0.25, metal: 0.9 });
  // the Black: oily, near-black with a faint violet sheen; the eyes that open on it
  b.mat('black', ['#1C1A24', '#121118', '#0C0B10', '#08080B', '#050507'], { base: 2, rough: 0.25, metal: 0.3, shadeK: 0.7 });
  b.mat('eyeW', ['#E9E3D6', '#CFC8B9'], { base: 0, rough: 0.2 });
  b.mat('eyeR', ['#C8141F'], { glow: 0.9 });
  b.mat('shirt', ['#F3F3F0', '#E2E2DE', '#C9CACE'], { base: 0, rough: 0.7 });
}

/** reddish-brown eyes under thin brows; the mutton chops (h) run down the cheeks into the moustache */
const FACE_EMPEROR = [
  '. . . . . . . . . .',
  '. B B . . . . B B .',
  'h L L L . . L L L h',
  'h W I i . . i I W h',
  'h . . . . . . . . h',
  'h . . . s s . . . h',
  'h h . h h h h . h h',
  '. h h h m m h h h .',
  '. . h h . . h h . .',
  '. . . . . . . . . .',
];
/** The Almighty awake: crimson irises, each eye split into three pupils (two at the corners, one centred below) */
const FACE_ALMIGHTY = [
  '. . . . . . . . . .',
  '. B B . . . . B B .',
  'h L L L . . L L L h',
  'h i I i . . i I i h',
  'h W i W . . W i W h',
  'h . . . s s . . . h',
  'h h . h h h h . h h',
  '. h h h m m h h h .',
  '. . h h . . h h . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<YhwachForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();
/** the props' lint warnings, for the tests */
export const YHWACH_PROP_WARNINGS: Record<string, string[]> = {};

export function yhwachAsset(form: YhwachForm = 'emperor'): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildYhwach(form)));
  return a;
}

/** 'sword' (the Reishi sword), 'broadsword' (the giant Heilig Pfeil blade), 'mask' (the Soul King's many-eyed mask) */
export type YhwachProp = 'sword' | 'broadsword' | 'mask';

export function yhwachProp(kind: YhwachProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'sword' ? buildSword() : kind === 'broadsword' ? buildBroadsword() : buildMask();
    propCache.set(kind, m);
  }
  return m;
}

/** blade points (prop frame, m) */
export const YH_SWORD_BASE_Z = 8 / 48;
export const YH_SWORD_TIP_Z = 52 / 48;
export const YH_BROAD_BASE_Z = 14 / 48;
export const YH_BROAD_TIP_Z = 96 / 48;

export function buildYhwach(form: YhwachForm = 'emperor'): CharacterAsset {
  const b = new ModelBuilder(`yhwach-${form}`, YHWACH_RES);
  palette(b, form);
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.6, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.6, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5.4, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5.4, wz + 1]);
  b.socket('finger.R', 'palm.R', [-wx + 0.2, wy - s.hand - 0.5, wz + 1.2]);
  b.socket('finger.L', 'palm.L', [wx - 0.2, wy - s.hand - 0.5, wz + 1.2]);
  b.socket('back', 'chest', [0, s.chestY + 1, -8]);
  b.socket('chest.front', 'chest', [0, s.chestY, 8]);
  b.socket('hip.L', 'hips', [10, s.waistY - 6, 2], [-24, 180, -6]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 6, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 2, hd.front + 0.5]);
  b.socket('eye.L', 'head', [2.6, s.chinY + 6.5, hd.front + 0.5]);
  b.socket('eye.R', 'head', [-2.6, s.chinY + 6.5, hd.front + 0.5]);
  b.stamp('head', hd.x0, hd.chin + 9, form === 'emperor' ? FACE_EMPEROR : FACE_ALMIGHTY, { ...faceLegend({ skin: 'skin', brow: 'hair', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), h: { mat: 'hair' } }, hd.front - 1);
  // a long face: the nose a ridge, the broad chin a step forward
  b.voxel('head', 0, hd.chin + 4, hd.front, 'skin', 1);
  b.add('head', box([0, hd.chin + 0.6, hd.front - 1.6], [2.6, 1.2, 1.6], { round: 0.8 }), 'skin', { only: 'empty' });
  const torso = body(b, L);
  const black = form === 'soulking';
  const coat = black ? shroud(b, L, torso) : uniform(b, L, torso);
  trousers(b, L, black);
  const hair = hairCurtain(b, L, hd);
  hands(b, L, 'skin');
  b.autoShade();
  b.lint();
  return {
    model: b.build(),
    springs: [...coat.springs, ...hair.springs],
    colliders: [...coat.colliders, ...hair.colliders],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- body & clothes

/** A broad, deep chest and strong neck under the coat. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const chest = box([0, s.chestY - 0.5, -0.3], [cx, 7.2, cz], { round: 3.8 });
  const waist = box([0, s.waistY, -0.2], [wx, 5.2, wz], { round: 3.2 });
  const pelvis = box([0, s.hipsY + 0.6, -0.3], [s.hips[0], 4.4, s.hips[1]], { round: 3 });
  const traps = [capsule([2.6, sy + 2, sz - 1], [sx - 1.6, sy - 0.2, sz], 3.4, 3.6), capsule([-2.6, sy + 2, sz - 1], [-sx + 1.6, sy - 0.2, sz], 3.4, 3.6)];
  const balls = [sphere([sx, sy - 0.6, sz], 3.9), sphere([-sx, sy - 0.6, sz], 3.9)];
  const torso = blend(3.2, chest, waist, pelvis, ...traps, ...balls);
  addBands(b, torso, 'skin', [['hips', 41, s.waistY - 5], ['spine', s.waistY - 6, s.chestY - 5], ['chest', s.chestY - 7, 110]]);
  b.add('neck', capsule([0, s.chinY - 6, L.headC[2] - 0.8], [0, s.chinY + 1, L.headC[2] - 0.8], s.neckR), 'skin');
  return torso;
}

/**
 * The Wandenreich uniform: the white double-breasted coat (two rows of silver buttons, wide lapels turned back
 * over the chest, the emblem at the middle, big buttoned cuffs), its skirt to the shins; over it the tattered
 * cloak hanging from the shoulders to the ankles, the red ribbon at the throat, the big button on the left; the
 * Quincy Cross medal on the left breast.
 */
function uniform(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const bodyCoat = subtract(offset(torso, 1.4), offset(torso, -1.0));
  const neckCut = cylinder([0, sy - 1, L.headC[2] - 0.8], [0, sy + 10, L.headC[2] - 0.8], s.neckR + 0.6);
  addBands(b, subtract(intersect(bodyCoat, aabb([-30, s.waistY - 7, -30], [30, sy + 6, 30])), neckCut), 'coat', [['hips', s.waistY - 7, s.waistY - 4], ['spine', s.waistY - 6, s.chestY - 4], ['chest', s.chestY - 7, 110]]);
  // a high collar standing round the neck
  b.add('chest', subtract(cylinder([0, sy + 0.5, L.headC[2] - 1], [0, sy + 4.2, L.headC[2] - 1], s.neckR + 2.2), cylinder([0, sy - 1, L.headC[2] - 1], [0, sy + 6, L.headC[2] - 1], s.neckR + 0.9)), 'coat', { thr: 0.25 });
  // the lapels: wide triangles turned back over the upper chest, a shade deeper
  for (const k of [1, -1]) {
    const lapel = prism([[k * 1.0, sy + 1], [k * 7.6, sy - 1.5], [k * 6.8, s.chestY - 4], [k * 1.4, s.chestY - 2]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 40);
    b.add('chest', intersect(lapel, subtract(offset(torso, 2.2), offset(torso, 1.0)), aabb([-20, s.chestY - 6, 2], [20, sy + 3, 20])), 'coat', { thr: 0.2 });
    b.paint('chest', intersect(lapel, offset(torso, 2.4), aabb([-20, s.chestY - 6, 2], [20, sy + 3, 20])), 'coatIn', { where: b.isMat('coat') });
  }
  // double-breasted: two rows of three silver buttons below the lapels
  for (const k of [1, -1])
    for (let i = 0; i < 3; i++) {
      const y = s.chestY - 6 - i * 4.4;
      const bone = y > s.chestY - 5 ? 'chest' : 'spine';
      b.add(bone, sphere([k * 3.6, y, s.chest[1] + 1.9 - i * 0.3], 0.9), 'silver');
    }
  // the emblem at the middle of the chest: the five-pointed Quincy cross, dark on the white
  const EMB = [
    '. . . X . . .',
    '. . . X . . .',
    'X X X X X X X',
    '. X . X . X .',
    '. . X X X . .',
    '. X . . . X .',
    'X . . . . . X',
  ];
  stampFront(b, 'chest', EMB, 3, s.chestY + 1.5, 'emblem');
  // the sleeves, straight and long, the big buttoned cuffs turned back
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 1.1, sz], 4.0), capsule([sx, sy - 1.2, sz], [sx, ey + 0.5, sz], 3.7, 3.4)), 'coat', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 3.5), capsule([sx, ey - 0.5, sz], [sx, wy + 3.6, sz], 3.4, 3.1)), 'coat', { mirror: true });
  b.add('forearm.L', cylinder([sx, wy + 0.2, sz], [sx, wy + 4.6, sz], 3.9), 'coat', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy + 4.2, sz], [sx, wy + 4.8, sz], 4.2), 'coatIn', { mirror: true, where: b.isMat('coat') });
  b.add('forearm.L', sphere([sx + 2.2, wy + 2.4, sz + 2.8], 0.85), 'silver', { mirror: true });
  b.add('forearm.L', capsule([sx, wy + 4, sz], [sx, wy - 0.6, sz], 2.2), 'skin', { mirror: true, only: 'empty' });
  b.paint('upperarm.L', capsule([sx + 3.4, ey + 3, sz + 1.6], [sx + 3.5, ey - 0.5, sz - 1.4], 0.6), 'coat', { shade: 3, mirror: true, where: b.isMat('coat') });
  // the Quincy Cross medal on the left breast: a round silver medal, the cross in it, a striped ribbon below
  const mx = 6.2, my = s.chestY + 2.5, mz = s.chest[1] + 2.0;
  b.add('chest', cylinder([mx, my, mz - 0.6], [mx, my, mz + 0.6], 1.9), 'medal');
  b.paint('chest', box([mx, my, mz + 0.8], [0.4, 1.4, 0.4]), 'silver', { shade: 3, where: b.isMat('medal') });
  b.paint('chest', box([mx, my + 0.3, mz + 0.8], [1.3, 0.4, 0.4]), 'silver', { shade: 3, where: b.isMat('medal') });
  b.add('chest', box([mx, my - 3.0, mz - 0.2], [1.1, 1.2, 0.5]), 'ribbon');
  b.paint('chest', box([mx, my - 3.0, mz + 0.4], [0.3, 1.3, 0.4]), 'coat', { where: b.isMat('ribbon') });
  // the coat's skirt to the shins, a slit at the front
  const skirt = coatSkirt(b, L, { mat: 'coat', lining: 'coatIn', yTop: s.waistY - 5, yHem: 20, r0: 10.0, r1: 12.8, openFront: 7, overlap: 4, res: YHWACH_RES, depth: 0.82 });
  const cape = cloak(b, L, torso);
  return { springs: [...skirt.springs, ...cape.springs], colliders: [...skirt.colliders, ...cape.colliders] };
}

/** a pixel-art emblem pressed into the front surface of a bone (columns centred on x = 0) */
function stampFront(b: ModelBuilder, bone: string, rows: string[], half: number, yTop: number, mat: string): void {
  const g = b.grid(bone);
  rows.forEach((row, r) => {
    const cells = row.split(/\s+/).filter((c) => c.length > 0);
    cells.forEach((ch, ci) => {
      if (ch !== 'X') return;
      const x = half - ci, y = Math.round(yTop - r);
      for (let z = 20; z > -2; z--)
        if (g.get(x, y, z) !== 0) {
          b.voxel(bone, x, y, z, mat, 1);
          break;
        }
    });
  });
}

/**
 * The tattered cloak: over the shoulders and down the back to the ankles, open at the front, the hem torn into
 * ragged points; the red ribbon tied at the throat and the large button on his left where it fastens.
 */
function cloak(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy] = s.shoulder;
  const ey = L.elbow[1];
  // the mantle: a wide cape over the shoulders and upper arms, open in front from the collarbones down
  const mantle = intersect(
    subtract(blend(2.4, offset(torso, 2.8), ellipsoid([0, sy - 3, -0.8], [sx + 4.2, 9.6, 10.2])), offset(torso, 1.6)),
    aabb([-40, s.waistY - 7, -40], [40, sy + 6.5, 40]),
  );
  const front = fn((x, y, z) => {
    // the opening widens downward from the throat
    const t = Math.max(0, Math.min(1, (sy + 2 - y) / 22));
    return Math.max(Math.abs(x) - (2.2 + t * 7.5), -z + 1.5);
  }, [-30, s.waistY - 8, -30], [30, sy + 8, 30]);
  addBands(b, subtract(mantle, front), 'cloak', [['spine', s.waistY - 8, s.chestY - 4], ['chest', s.chestY - 6, 120]]);
  b.paint(['spine', 'chest'], offset(torso, 2.2), 'cloakIn', { where: b.isMat('cloak') });
  // where the arms come out at the sides
  for (const k of [-1, 1]) b.carve('chest', capsule([k * sx, sy - 2, 1.5], [k * (sx + 0.6), ey + 1, 1.5], 3.4));
  // folds falling from the shoulders
  for (const k of [-1, 1]) for (const dz of [-5, 0]) b.paint(['chest', 'spine'], capsule([k * (sx - 1), sy + 2, dz], [k * (sx + 2.6), s.waistY - 6, dz * 1.4 - 1], 0.7), 'cloak', { shade: 4, where: b.isMat('cloak') });
  // below the waist: long ragged panels to the ankles (open at the front)
  const skirt = coatSkirt(b, L, { mat: 'cloak', lining: 'cloakIn', yTop: s.waistY - 5, yHem: 3, r0: 12.6, r1: 16.4, openFront: 32, tatter: true, tatterDepth: 6, tatterTeeth: 1, res: YHWACH_RES, prefix: 'cape' });
  // the red ribbon tied at the throat, the big button on his left
  const ny = sy + 1.6, nz = L.headC[2] + 4.6;
  b.add('chest', torus([0, ny, nz - 4.2], 4.6, 0.7, [0, 0, 0]), 'ribbon', { thr: 0.2 });
  b.add('chest', ellipsoid([0, ny - 0.6, nz + 0.4], [1.6, 1.2, 0.9]), 'ribbon');
  for (const k of [1, -1]) b.add('chest', capsule([k * 0.8, ny - 1.2, nz + 0.5], [k * 1.8, ny - 5.2, nz + 0.4], 0.7, 0.45), 'ribbon');
  b.add('chest', cylinder([7.0, sy - 2.6, 4.8], [7.6, sy - 2.6, 6.6], 1.5), 'button');
  return skirt;
}

/** White trousers into tall trench boots (white-grey, a dark sole). The Black covers them to the knees. */
function trousers(b: ModelBuilder, L: Landmarks, black: boolean): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 0.4, -0.3], [s.hips[0] + 0.9, 5.2, s.hips[1] + 0.9], { round: 3 }), black ? 'black' : 'coat');
  b.add('thigh.L', blend(1.4, sphere([hx, hy, hz], 5.4), capsule([hx, hy, hz], [kx, ky + 1, kz], 5.0, 4.0)), black ? 'black' : 'coat', { mirror: true });
  b.add('shin.L', blend(1.2, sphere([kx, ky, kz], 4.0), capsule([kx, ky, kz], [ax, ay + 2, az], 3.8, 3.6)), 'boot', { mirror: true });
  // the boot tops, a little flared under the knee
  b.add('shin.L', cylinder([kx, ky - 3.8, kz], [kx, ky - 1.2, kz], 4.4), 'boot', { mirror: true });
  b.paint('shin.L', cylinder([kx, ky - 1.6, kz], [kx, ky - 1.1, kz], 4.6), 'boot', { shade: 3, mirror: true, where: b.isMat('boot') });
  const f = s.foot;
  const toeZ = az + f.len - f.heel;
  b.add('foot.L', capsule([ax, ay + 1.4, az - 0.4], [ax, ay - 1, az - 0.4], 3.0), 'boot', { mirror: true });
  b.add('foot.L', box([ax, 2.4, az + (f.len / 2 - f.heel)], [f.w / 2, 2.4, f.len / 2], { round: 1.7 }), 'boot', { mirror: true });
  b.paint('foot.L', aabb([ax - 6, 0, az - 9], [ax + 6, 1.1, az + 16]), 'sole', { mirror: true });
  b.paint('foot.L', capsule([ax - 1.4, 4.0, toeZ - 4.5], [ax + 1.4, 4.0, toeZ - 4.5], 0.45), 'boot', { shade: 3, mirror: true, where: b.isMat('boot') });
  if (black) {
    // the Black creeping over the knees and dripping down the boots
    b.paint('shin.L', aabb([-30, ky - 3, -30], [30, ky + 8, 30]), 'black', { mirror: true });
    for (const dz of [-3, 1, 3.5]) b.add('shin.L', capsule([kx + dz * 0.4, ky - 1, kz + dz], [kx + dz * 0.5, ky - 7 - Math.abs(dz), kz + dz * 1.05], 0.9, 0.5), 'black', { mirror: true });
  }
}

/**
 * The Soul King form: the Black covers him — a thick oily shroud from the shoulders to the shins, ragged and
 * dripping at the hem and sleeves, open down the chest where the white shirt shows; eyes of uneven size open
 * here and there on it, red-pupilled.
 */
function shroud(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  // the white shirt over the chest (it shows down the opening)
  addBands(b, subtract(offset(torso, 0.9), offset(torso, -1)), 'shirt', [['spine', s.waistY - 6, s.chestY - 4], ['chest', s.chestY - 7, 110]]);
  // the mass: thick over the shoulders and back, the front open in a narrowing slit
  const mass = intersect(
    subtract(blend(3, offset(torso, 2.6), ellipsoid([0, sy - 2, -1], [sx + 5, 10.5, 10.6])), offset(torso, 1.2)),
    aabb([-40, s.waistY - 8, -40], [40, sy + 7, 40]),
  );
  const front = fn((x, y, z) => Math.max(Math.abs(x) - (1.6 + Math.max(0, (sy - y) / 24) * 4.4), -z + 1), [-30, s.waistY - 10, -30], [30, sy + 9, 30]);
  addBands(b, subtract(mass, front), 'black', [['spine', s.waistY - 8, s.chestY - 4], ['chest', s.chestY - 6, 120]]);
  // a ridge of it standing up behind the neck
  b.add('chest', blend(2, ellipsoid([0, sy + 3, L.headC[2] - 5.5], [8, 5, 4.2]), torus([0, sy + 1.5, L.headC[2] - 1.5], 6.5, 2.6)), 'black', { thr: 0.25 });
  // the sleeves: black, swallowing the arms to the wrists, dripping off the forearms
  b.add('upperarm.L', blend(1.6, sphere([sx, sy - 1, sz], 4.6), capsule([sx, sy - 1.2, sz], [sx, ey + 0.5, sz], 4.2, 3.8)), 'black', { mirror: true });
  b.add('forearm.L', blend(1.4, sphere([sx, ey, sz], 4.0), capsule([sx, ey - 0.5, sz], [sx, wy + 2.4, sz], 3.8, 3.0)), 'black', { mirror: true });
  for (const dz of [-2, 1.5]) b.add('forearm.L', capsule([sx + 2.6, wy + 4, sz + dz], [sx + 3.1, wy - 2.5 - Math.abs(dz), sz + dz * 1.2], 1.0, 0.5), 'black', { mirror: true });
  b.add('forearm.L', capsule([sx, wy + 3, sz], [sx, wy - 0.6, sz], 2.2), 'skin', { mirror: true, only: 'empty' });
  // the long skirt of it, ragged
  const skirt = coatSkirt(b, L, { mat: 'black', lining: 'black', yTop: s.waistY - 5, yHem: 10, r0: 12.2, r1: 15.6, openFront: 9, tatter: true, tatterDepth: 9, tatterTeeth: 2, res: YHWACH_RES });
  // the eyes: bulging whites with red pupils, of uneven size, all over the shroud (front, shoulders, back)
  const eyes: [string, V3, number][] = [
    ['chest', [-7.5, s.chestY + 3, 8.4], 1.9], ['chest', [8.2, s.chestY - 1, 8], 1.4], ['chest', [-11.6, sy + 1, 1], 1.6], ['chest', [12, sy - 1, -2], 1.3],
    ['chest', [-4, s.chestY + 2, -10.6], 2.2], ['chest', [5, s.chestY - 3, -10.4], 1.6], ['spine', [-6.6, s.waistY + 2, -9.4], 1.4], ['spine', [7.4, s.waistY - 1, 8.6], 1.2],
    ['upperarm.L', [sx + 4.2, sy - 6, sz + 1], 1.3], ['upperarm.R', [-sx - 4.2, sy - 9, sz - 1], 1.2],
  ];
  for (const [bone, p, r] of eyes) {
    b.add(bone, sphere(p, r), 'eyeW');
    const len = Math.hypot(p[0], p[2]) || 1;
    b.paint(bone, sphere([p[0] + (p[0] / len) * r * 0.8, p[1], p[2] + (p[2] / len) * r * 0.8], r * 0.45), 'eyeR', { where: b.isMat('eyeW') });
  }
  return skirt;
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * Straight black hair: a smooth cap over the crown parted at the centre, falling behind the ears, and one
 * long curtain down the back to the waist on a three-bone spring chain; two front locks frame the face down
 * to the jaw.
 */
function hairCurtain(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const c = hd.chin, front = hd.front;
  const cz = L.headC[2] - 0.4;
  const hw = s.head.w / 2;
  // the cap: the skull swollen a little, cut away over the face below the hairline
  const cap = subtract(
    intersect(box([0, c + 9.4, cz - 0.4], [hw + 0.9, 5.6, s.head.d / 2 + 1.1], { round: 3.6 }), fn((_x, y) => c + 3 - y, [-12, c - 4, -20], [12, c + 18, 20])),
    fn((x, y, z) => Math.max(z - (front + 3), (front - 2.6) - z, y - (c + 10.6 - Math.abs(x) * 0.3), Math.abs(x) - (hw - 0.4)), [-12, c - 4, front - 4], [12, c + 14, front + 4]),
  );
  b.add('head', cap, 'hair', { only: 'empty', thr: 0.2 });
  // the centre parting and the hair swept down to either side
  b.paint('head', box([0, c + 14, front - 2], [0.4, 2.4, 3.4]), 'hair', { shade: 4, where: b.isMat('hair') });
  // the side falls behind the ears down to the jaw and on down the back of the neck
  for (const k of [1, -1]) {
    const side = smoothPath([[k * (hw + 0.5), c + 9, front - 4.5], [k * (hw + 0.8), c + 3, front - 5.8], [k * (hw + 0.6), c - 3, front - 7.8]], 4);
    b.add('head', tube(side, side.map((_, i) => 1.7 - i * 0.04)), 'hair', { thr: 0.3 });
    // a front lock framing the face, from the parting down past the cheek
    const lock = smoothPath([[k * 1.6, c + 12.6, front - 0.2], [k * (hw - 0.4), c + 10, front + 0.4], [k * (hw + 0.4), c + 5.5, front - 0.8], [k * (hw + 0.6), c + 1, front - 2.6]], 4);
    b.add('head', tube(lock, lock.map((_, i) => 1.15 - i * 0.03)), 'hair', { thr: 0.3 });
  }
  // the curtain: wide at the head, falling straight to the waist on three bones
  const R = YHWACH_RES;
  const back = L.headC[2] - s.head.d / 2;
  const yTop = c + 9, yBot = s.waistY - 4;
  const zc = (y: number) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    return back - 0.6 - Math.sin(Math.min(1, t * 2.6) * Math.PI * 0.5) * 3.2 + t * 0.6;
  };
  const sheet = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (yTop - y) / (yTop - yBot)));
    const w = hw + 1.6 - t * 0.6;
    const bot = yBot + Math.abs(Math.sin(x * 0.8)) * 2.6;
    return Math.max(Math.abs(x) - w, Math.abs(z - zc(y)) - (2.2 - t * 0.6), y - yTop, bot - y);
  }, [-12, yBot - 1, back - 12], [12, yTop + 1, back + 3]);
  const p1: V3 = [0, c + 6, back - 1], p2: V3 = [0, s.chestY + 4, zc(s.chestY + 4)], p3: V3 = [0, s.chestY - 6, zc(s.chestY - 6)];
  const bones: [string, string, V3, number, number][] = [['hair1', 'head', p1, p2[1] - 0.5, 200], ['hair2', 'hair1', p2, p3[1] - 0.5, p2[1] + 0.5], ['hair3', 'hair2', p3, -100, p3[1] + 0.5]];
  for (const [name, parent, pivot, y0, y1] of bones) {
    b.bone(name, parent, pivot);
    b.add(name, intersect(sheet, aabb([-20, y0, -30], [20, y1, 10])), 'hair', { thr: 0.25 });
  }
  // strands: long shallow grooves, the sheen catching on the crown
  b.paint(['hair1', 'hair2', 'hair3'], fn((x) => Math.abs(((x + 30) % 2.6) - 1.3) - 0.32, [-12, yBot - 3, back - 14], [12, yTop + 2, back + 3]), 'hair', { shade: 4, where: b.isMat('hair') });
  b.paint('head', ellipsoid([0, c + 13.6, cz - 1], [4, 1.4, 4.4]), 'hair', { shade: 0, where: b.isMat('hair') });
  const tip: V3 = [0, yBot, zc(yBot)];
  const springs: SpringDef[] = [
    { bone: 'hair1', tail: [(p2[0] - p1[0]) / R, (p2[1] - p1[1]) / R, (p2[2] - p1[2]) / R], stiffness: 46, damping: 5.5, gravity: 11, limit: 35, radius: 0.08 },
    { bone: 'hair2', tail: [(p3[0] - p2[0]) / R, (p3[1] - p2[1]) / R, (p3[2] - p2[2]) / R], stiffness: 34, damping: 5, gravity: 12, limit: 45, radius: 0.08 },
    { bone: 'hair3', tail: [(tip[0] - p3[0]) / R, (tip[1] - p3[1]) / R, (tip[2] - p3[2]) / R], stiffness: 26, damping: 4.5, gravity: 13, limit: 55, radius: 0.07 },
  ];
  const colliders: ColliderDef[] = [
    { bone: 'chest', offset: [0, 0.08, -0.03], radius: 0.2 },
    { bone: 'spine', offset: [0, 0.02, -0.02], radius: 0.17 },
  ];
  return { springs, colliders };
}

// ---------------------------------------------------------------------------------------------- props

/**
 * The Reishi sword: a dādāo-like blade, broad and slightly curved, widening toward a clipped point; a long
 * grip; a cross-guard shaped like a bird with its wings spread. Origin at the grip, +Z along the blade, edge −Y.
 */
function buildSword(): VoxelModel {
  const b = new ModelBuilder('yhwach-sword', 48);
  b.mat('steel', ['#EEF3F8', '#CFD6E0', '#A9B2BE', '#7F8896'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
  b.mat('rim', ['#B9DCFF', '#8EC2FF'], { base: 1, glow: 0.8, rough: 0.2 });
  b.mat('grip', ['#3A3640', '#2A2730', '#1E1C23'], { base: 1, rough: 0.8 });
  b.mat('guard', ['#B4BAC4', '#8C929C', '#6A707A', '#4E535C'], { base: 1, rough: 0.35, metal: 0.85, shadeK: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 7, zTip = 52;
  // the blade: the back straight, the edge bellying out toward the tip, a clipped point
  const blade = fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const t = (z - z0) / (zTip - z0);
    const curve = t * t * 1.6;
    const spine = 1.0 + curve;
    const edge = -(1.3 + Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.55) * 1.7) + curve;
    const clip = z - (zTip - Math.max(0, y - edge) * 1.3);
    return Math.max(Math.abs(x) - 0.5, y - spine, edge - y, clip, z0 - z);
  }, [-2, -5, z0 - 1], [2, 4, zTip + 1]);
  b.add('root', blade, 'steel', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => {
    const t = Math.max(0, Math.min(1, (z - z0) / (zTip - z0)));
    const edge = -(1.3 + Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.55) * 1.7) + t * t * 1.6;
    return y - (edge + 0.45);
  }, [-2, -5, z0 - 1], [2, 4, zTip + 1]), 'rim');
  // the bird guard: a body along the blade's back, the head forward, two wings swept out to the sides
  b.add('root', ellipsoid([0, 0.2, 5.4], [1.2, 1.5, 2.2]), 'guard');
  b.add('root', sphere([0, 1.6, 7.4], 1.0), 'guard');
  b.add('root', capsule([0, 1.8, 8.2], [0, 1.4, 9.6], 0.45, 0.2), 'guard');
  for (const k of [1, -1]) {
    const wing = smoothPath([[0, 0.4, 5], [k * 2.6, 1.6, 4.2], [k * 5.2, 3.2, 3.2], [k * 7.0, 4.6, 2.0]], 4);
    b.add('root', tube(wing, wing.map((_, i) => 1.0 - i * 0.06)), 'guard', { thr: 0.25 });
    // the primaries: three feathers hanging off each wing
    for (let i = 0; i < 3; i++) {
      const p0: V3 = [k * (3 + i * 1.6), 2 + i * 0.8, 3.8 - i * 0.6];
      b.add('root', capsule(p0, [p0[0] + k * 0.6, p0[1] - 2.4, p0[2] - 0.8], 0.55, 0.3), 'guard');
    }
  }
  // the long grip and a small pommel
  b.add('root', box([0, 0, -4], [0.95, 1.1, 7.4], { round: 0.5 }), 'grip');
  b.paint('root', fn((_x, y, z) => Math.abs(((Math.abs(y) + z) % 2.2 + 2.2) % 2.2 - 1.1) - 0.35, [-2, -2, -12], [2, 2, 3.4]), 'grip', { shade: 0, where: b.isMat('grip') });
  b.add('root', sphere([0, 0, -11.6], 1.4), 'guard');
  b.autoShade({ up: 0.6, open: 1.5, front: 0.1 });
  b.lint();
  YHWACH_PROP_WARNINGS.sword = b.warnings;
  return b.build();
}

/**
 * The Reishi broadsword: a giant Heilig Pfeil as long as he is tall — a straight double-edged blade of blue
 * light; the guard two prongs sweeping up and out, the grip with two short prongs below, so guard and grip
 * draw the Wandenreich cross. Origin at the grip, +Z along the blade.
 */
function buildBroadsword(): VoxelModel {
  const b = new ModelBuilder('yhwach-broadsword', 48);
  b.mat('core', ['#F2FAFF', '#E6F3FF', '#C9E3FF'], { base: 1, glow: 1.4, rough: 0.2 });
  b.mat('light', ['#BFE0FF', '#A9D2FF', '#8DBFFA', '#6EA8F0'], { base: 1, glow: 1.0, rough: 0.25 });
  b.mat('edge', ['#7FB8FF', '#5DA8FF'], { base: 1, glow: 1.6 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 12, zTip = 96;
  const halfW = (z: number) => 2.6 - Math.max(0, (z - (zTip - 14)) / 14) * 2.5;
  const blade = fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const w = halfW(z);
    // a diamond section: thick at the midline, thin at the edges
    return Math.max(Math.abs(y) - w, Math.abs(x) - (0.9 - (Math.abs(y) / Math.max(0.5, w)) * 0.5), z0 - z, z - zTip);
  }, [-2, -4, z0 - 1], [2, 4, zTip + 1]);
  b.add('root', blade, 'light', { thr: 0.3 });
  b.paint('root', fn((_x, y, z) => Math.abs(y) - Math.max(0, halfW(z) - 0.6), [-2, -4, z0 - 1], [2, 4, zTip + 1]), 'edge', { where: b.isMat('light') });
  b.paint('root', fn((x, y) => Math.max(Math.abs(y) - 0.5, Math.abs(x) - 0.5), [-2, -4, z0 - 1], [2, 4, zTip + 1]), 'core', { where: b.isMat('light') });
  // the guard: two prongs up and out from the base of the blade
  for (const k of [1, -1]) b.add('root', capsule([0, k * 1.6, z0 + 0.5], [0, k * 8.4, z0 + 7.5], 1.1, 0.5), 'light', { thr: 0.25 });
  b.add('root', box([0, 0, z0 - 1], [1.0, 3.4, 1.4], { round: 0.6 }), 'core');
  // the grip, two short prongs down and out at the pommel
  b.add('root', box([0, 0, 2], [0.9, 0.9, 9], { round: 0.5 }), 'light');
  for (const k of [1, -1]) b.add('root', capsule([0, k * 0.8, -6.4], [0, k * 4.4, -9.8], 0.8, 0.4), 'light', { thr: 0.25 });
  b.autoShade({ up: 0.4, open: 1.2, front: 0.1 });
  b.lint();
  YHWACH_PROP_WARNINGS.broadsword = b.warnings;
  return b.build();
}

/**
 * The Soul King's mask: a viscous black mass over the upper half of the face, bulging, with eyes of uneven size
 * opening on it — the whites a bone colour, the pupils red. Origin at the 'face' socket.
 */
function buildMask(): VoxelModel {
  const b = new ModelBuilder('yhwach-mask', 48);
  b.mat('black', ['#1C1A24', '#121118', '#0C0B10', '#08080B', '#050507'], { base: 2, rough: 0.25, metal: 0.3, shadeK: 0.7 });
  b.mat('eyeW', ['#E9E3D6', '#D6CFC1'], { base: 0, rough: 0.2 });
  b.mat('eyeR', ['#C8141F'], { glow: 1.1 });
  b.mat('pupil', ['#141418']);
  b.bone('root', null, [0, 0, 0]);
  // the mass over the brow and eyes and up over the crown, lumpy, dripping down over the cheeks
  const mass = blend(1.8,
    ellipsoid([0, 2.2, -3.6], [7.2, 5.6, 6.4]),
    ellipsoid([0, 6.2, -6.4], [7.4, 4.4, 7.6]),
    ellipsoid([-3.6, 1.4, -1.6], [3.2, 3.4, 3.0]),
    ellipsoid([3.8, 2.6, -1.4], [3.0, 3.0, 2.8]),
  );
  const cut = fn((_x, y, z) => Math.max(-1.6 - y, z - 3.6), [-12, -12, -16], [12, 14, 6]);
  b.add('root', intersect(mass, cut), 'black', { thr: 0.25 });
  for (const [x, z, len] of [[-5.6, -1.4, 4.2], [5.4, -1.2, 3.4], [-2.2, 1.6, 2.6], [1.8, 1.4, 3.0]] as [number, number, number][]) b.add('root', capsule([x, -0.8, z], [x * 1.04, -0.8 - len, z - 0.4], 0.75, 0.45), 'black');
  // the eyes: one big over his right eye, smaller ones scattered, each a white ball with a red ring and a pupil
  const eyes: [V3, number][] = [[[-3.4, 1.8, 1.6], 2.2], [[3.2, 2.4, 1.4], 1.7], [[0.2, 5.2, 0.6], 1.3], [[-6.2, 4.6, -2.4], 1.1], [[6.0, 5.0, -2.6], 1.0], [[-1.8, 8.2, -2.6], 0.95], [[2.8, 8.4, -3.4], 0.8]];
  for (const [p, r] of eyes) {
    b.add('root', sphere(p, r), 'eyeW');
    b.paint('root', sphere([p[0], p[1], p[2] + r * 0.75], r * 0.55), 'eyeR', { where: b.isMat('eyeW') });
    b.paint('root', sphere([p[0], p[1], p[2] + r * 0.95], r * 0.25), 'pupil', { where: b.isMat('eyeR') });
  }
  b.autoShade({ up: 0.5, open: 1.8, front: 0.2 });
  b.lint();
  YHWACH_PROP_WARNINGS.mask = b.warnings;
  return b.build();
}
