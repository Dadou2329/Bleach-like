// Uryū Ishida in the Blood War (docs/roster/A2-karakura-allies.md §4, loadout U3; kit docs/kits/uryu.md). Brief:
// 177 cm → 84 voxels at 47.5 vox/m (the Hueco Mundo body's slender proportions, head 12); tall, very slender, long
// legs. Silhouette keys: the long white cape falling from the shoulders to the ankles, the high clasped collar,
// the coat's flared skirt to the shins, straight hair swept over to his right with the left side tucked behind
// the ear, thin glasses. Outfit (Sternritter "A"): the white double-breasted trench coat — three Zeichen buttons
// each side, a white belt with a gold buckle, a rectangular sigil on each side of the collar, the winged-star pin
// on the right breast — white trousers, white boots. Quincy: Vollständig [anime]: two sharp crystalline wings on
// the upper back (bones wing.L / wing.R, so they spread and beat), crystal cuffs on the wrists and greaves on the
// shins, the flechette insignia on the left breast. Props: the Heilig Bogen (a bow of light his own height,
// almost straight limbs tapering to points, a grip much thinner than the limbs, a fin off each limb's root), a
// flechette, the Standspitze (a Still-Silver arrowhead) and a Leiden Scherben chip. (verify) boot colour; the
// exact pin design.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, offset, prism, sphere, spike, subtract, torus, type Sdf, type V3 } from '../models/sdf';
import { addBands, coatSkirt, faceLegend, hands, head, humanoidSkeleton, spikeHair, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';
import { URYU_FACE, URYU_SPEC } from './uryu';

export const URYU_TYBW_RES = 84 / 1.77;
export type UryuTybwForm = 'sternritter' | 'vollstandig';

function palette(b: ModelBuilder, form: UryuTybwForm): void {
  b.mat('skin', ['#F7E0D0', '#F1DACA', '#E3C8B6', '#D3BCAE', '#B8A195'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#4B4D58', '#354158', '#2D3547', '#2B3242', '#1C2230'], { base: 2, rough: 0.45, shadeK: 0.85, dither: 0.05 });
  b.mat('brow', ['#2B3242']);
  b.mat('lid', ['#1E2230']);
  b.mat('sclera', ['#F3F3F0']);
  b.mat('iris', ['#607C9A']);
  b.mat('irisD', ['#20130F']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#9E6A5C']);
  // Sternritter white (coat #F1F2EF, shade #C9CCD3); the lining, belt and boots a step cooler
  b.mat('coat', ['#F3F3F0', '#F1F2EF', '#DDE0E4', '#C9CCD3', '#A4ABB8'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('coatIn', ['#D9DCE2', '#C3C8D0', '#A5ACB8'], { base: 1, rough: 0.8 });
  b.mat('silver', ['#E8EAEE', '#C9CDD3', '#A7ADB6', '#80868F'], { base: 1, rough: 0.35, metal: 0.35, shadeK: 0.8 });
  b.mat('gold', ['#EDD48A', '#D4B25A', '#A8873C'], { base: 1, rough: 0.3, metal: 0.8 });
  b.mat('sigil', ['#3B4A66']);
  b.mat('sole', ['#8C96A6']);
  if (form === 'vollstandig') b.mat('crystal', ['#D8F7FC', '#ABEEF8', '#8FE9F8', '#5CD6F5', '#1E8FD0'], { base: 2, rough: 0.1, shadeK: 0.75, glow: 0.6, dither: 0 });
}

const assetCache = new Map<UryuTybwForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function uryuTybwAsset(form: UryuTybwForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildUryuTybw(form)));
  return a;
}

/**
 * 'bogen' (the Heilig Bogen: origin at the grip, the limbs along ±Y, shooting along +Z), 'flechette' (pointing
 * +Z), 'standspitze' (the Still-Silver arrowhead, pointing +Z) and 'chip' (a Leiden Scherben chip lying flat).
 */
export type UryuTybwProp = 'bogen' | 'flechette' | 'standspitze' | 'chip';

export function uryuTybwProp(kind: UryuTybwProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'bogen' ? buildBogen() : kind === 'flechette' ? buildFlechette() : kind === 'standspitze' ? buildStandspitze() : buildChip();
    propCache.set(kind, m);
  }
  return m;
}

/** the bow's half-height (m): where the string ties on */
export const BOGEN_TIP_Y = 40 / 48;
export const BOGEN_TIP_Z = -3.2 / 48;

export function buildUryuTybw(form: UryuTybwForm = 'sternritter'): CharacterAsset {
  const b = new ModelBuilder(`uryu-tybw-${form}`, URYU_TYBW_RES);
  palette(b, form);
  const s = URYU_SPEC;
  const L = humanoidSkeleton(b, s);
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  // the bow forms in the left fist; the right hand draws the string back to the cheek
  b.socket('bow', 'fist.L', [wx, wy - 4.5, wz + 0.5]);
  b.socket('draw', 'fist.R', [-wx, wy - 4.5, wz + 0.5]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6]);
  b.socket('back', 'chest', [0, s.chestY + 2, -9]);
  b.socket('toe.R', 'foot.R', [-L.ankle[0], 2, L.ankle[2] + s.foot.len - s.foot.heel]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('glasses', 'head', [0, s.chinY + 5.5, hd.front + 0.6]);
  b.socket('eye.L', 'head', [2.5, s.chinY + 5.5, hd.front + 0.3]);
  b.socket('eye.R', 'head', [-2.5, s.chinY + 5.5, hd.front + 0.3]);
  b.stamp('head', hd.x0, hd.chin + 9, URYU_FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd);
  hands(b, L, 'skin');
  const torso = body(b, L);
  const coat = uniform(b, L, torso);
  trousers(b, L);
  if (form === 'vollstandig') vollstandig(b, L);
  b.autoShade();
  b.lint();
  const colliders: ColliderDef[] = [...coat.colliders, { bone: 'shin.L', offset: [0, -0.12, 0], radius: 0.06 }, { bone: 'shin.R', offset: [0, -0.12, 0], radius: 0.06 }, { bone: 'thigh.L', offset: [0, -0.1, 0.02], radius: 0.1 }, { bone: 'thigh.R', offset: [0, -0.1, 0.02], radius: 0.1 }];
  return { model: b.build(), springs: coat.springs, colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- head

/**
 * Straight hair, longer now: the fringe swept over to his right, its longest lock falling past the right side of
 * the face to the cheek; the right side to the jaw in front of the ear; the left side tucked behind the ear, the
 * ear and temple bare; the back to the nape.
 */
function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const hw = s.head.w / 2;
  const locks: Spike[] = [];
  // the back and the right side: flat, straight locks to the jaw
  for (const az of [-84, -104, -126, -148, -170, 168, 146, 124]) locks.push({ az, el: -12, len: 4.4, r: 3.1, flat: 0.35, flow: [0, -1.7, -0.05], taper: 0.7 });
  // in front of the right ear, a little longer
  locks.push({ az: -68, el: -4, len: 4.8, r: 2.6, flat: 0.35, flow: [0, -1.9, 0.25], taper: 0.7 });
  spikeHair(b, L, 'hair', locks, [
    { x: 3.4, tipY: c + 9.8, lean: -1.4, r: 1.5 },
    { x: 1.2, tipY: c + 8.6, lean: -1.8, r: 1.6 },
    { x: -1.4, tipY: c + 7.6, lean: -1.6, r: 1.6 },
    { x: -4.4, tipY: c + 3.6, lean: -0.5, r: 1.7 },
  ], { hairline: c + s.head.h - 2.2, nape: c + 1, slope: 0.55 });
  // the fringe's roots must not poke out above the crown
  b.carve('head', aabb([-9, c + s.head.h + 0.4, hd.front - 2.2], [9, c + 17, hd.front + 3]));
  // tucked behind the left ear: the hair cleared from the temple and round the ear, the ear bare
  b.carve('head', aabb([hw, c + 2, -3.2], [hw + 6, c + 8.4, hd.front + 3]));
  b.paint('head', aabb([hw - 2, c + 2, -2.6], [hw + 1, c + 8, hd.front]), 'skin', { where: b.isMat('hair') });
  b.add('head', aabb([hw, c + 4, -2], [hw + 1, c + 7, 0]), 'skin');
  // the lock that goes over the top of the ear and back
  b.add('head', capsule([hw - 0.6, c + 9.6, hd.front - 3.4], [hw + 0.4, c + 7.4, -3.6], 1.3, 1.5), 'hair', { thr: 0.3 });
  // the sheen: a cool streak across the crown
  b.paint('head', torus([0, c + s.head.h - 1.2, L.headC[2] - 2.2], 3.8, 0.6, [18, 0, 0]), 'hair', { shade: 0, where: b.isMat('hair') });
  // the eyes stay clear (the long lock frames the right side of the face)
  b.carve('head', aabb([-4, c + 4, hd.front], [-1, c + 7, hd.front + 6]));
  b.carve('head', aabb([1, c + 4, hd.front], [5, c + 7, hd.front + 6]));
}

// ---------------------------------------------------------------------------------------------- body & uniform

/** The slender torso under the coat (the coat itself, a little fuller), the neck and the coat sleeves. */
function body(b: ModelBuilder, L: Landmarks): Sdf {
  const s = L.spec;
  const [cx, cz] = s.chest, [wx, wz] = s.waist;
  const [sx, sy, sz] = s.shoulder;
  const torso = blend(2.6,
    box([0, s.chestY - 0.5, -0.3], [cx, 6, cz], { round: 3 }),
    box([0, s.waistY, -0.2], [wx, 4.6, wz], { round: 2.8 }),
    box([0, s.hipsY + 0.5, -0.3], [s.hips[0], 3.6, s.hips[1]], { round: 2.4 }),
    capsule([2.4, sy + 1.6, sz - 0.8], [sx - 1.4, sy - 0.2, sz], 2.6, 2.7),
    capsule([-2.4, sy + 1.6, sz - 0.8], [-sx + 1.4, sy - 0.2, sz], 2.6, 2.7),
    sphere([sx, sy - 0.5, sz], 3), sphere([-sx, sy - 0.5, sz], 3));
  addBands(b, offset(torso, 0.6), 'coat', [['hips', 36, 46], ['spine', 46, 56], ['chest', 54, 82]]);
  b.add('neck', capsule([0, s.chinY - 5, L.headC[2] - 0.5], [0, s.chinY + 2, L.headC[2] - 0.5], s.neckR), 'skin');
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', blend(1.4, sphere([sx, sy - 0.5, sz], 3.4), capsule([sx, sy - 1, sz], [sx, ey + 0.5, sz], 3.0, 2.7)), 'coat', { mirror: true });
  b.add('forearm.L', blend(1.2, sphere([sx, ey, sz], 2.8), capsule([sx, ey - 0.5, sz], [sx, wy + 1.6, sz], 2.8, 2.5)), 'coat', { mirror: true });
  // the turned-back cuffs, a seam at their top and a button on the outside
  b.add('forearm.L', cylinder([sx, wy + 0.4, sz], [sx, wy + 3.4, sz], 3.2), 'coat', { mirror: true });
  b.paint('forearm.L', cylinder([sx, wy + 3.0, sz], [sx, wy + 3.6, sz], 3.5), 'coatIn', { mirror: true, where: b.isMat('coat') });
  b.add('forearm.L', sphere([sx + 2.9, wy + 1.8, sz + 0.6], 0.8), 'silver', { mirror: true });
  b.add('forearm.L', capsule([sx, wy + 3, sz], [sx, wy - 0.4, sz], 2.0), 'skin', { mirror: true, only: 'empty' });
  return torso;
}

/** The outermost coat voxel in front of (x, y) among some bones. */
function frontOf(b: ModelBuilder, bones: string[], x: number, y: number): { bone: string; z: number } | null {
  let best: { bone: string; z: number } | null = null;
  for (const bone of bones) {
    const g = b.grid(bone);
    for (let z = 20; z > -4; z--)
      if (g.get(x, y, z) !== 0) {
        if (!best || z > best.z) best = { bone, z };
        break;
      }
  }
  return best;
}

/** A pixel-art badge set into the front of the coat (rows as seen from the front, centred on cx). */
function badge(b: ModelBuilder, rows: string[], cx: number, yTop: number, mat: string, shade = 1): void {
  rows.forEach((row, r) => {
    const cells = row.split(/\s+/).filter((c) => c.length > 0);
    cells.forEach((ch, ci) => {
      if (ch === '.') return;
      const x = Math.round(cx - (cells.length - 1) / 2 + ci), y = yTop - r;
      const at = frontOf(b, ['chest', 'spine'], x, y);
      if (!at) return;
      b.voxel(at.bone, x, y, at.z, mat, ch === 'o' ? 0 : shade);
      if (ch === 'o') b.voxel(at.bone, x, y, at.z + 1, mat, 0);
    });
  });
}

/**
 * The Sternritter uniform: the double-breasted coat (the overlapping front edge on his right, three Zeichen buttons
 * each side), the high collar clasped to the throat with a sigil on each side, the seams over the shoulders, the
 * white belt and gold buckle, the winged-star pin on the right breast; the skirt flaring to the shins; and the long
 * cape over the shoulders and down the back to the ankles, open in front.
 */
function uniform(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const nz = L.headC[2] - 0.8;
  // the high collar, standing to the jaw, closed at the throat
  const collar = fn((x, y, z) => {
    const t = Math.max(0, Math.min(1, (y - (sy - 0.5)) / (s.chinY - sy)));
    const r = s.neckR + 1.5 + t * 0.6;
    return Math.max(Math.abs(Math.hypot(x, (z - nz) * 1.08) - r) - 0.7, y - (s.chinY - 0.3), sy - 1 - y);
  }, [-9, sy - 2, nz - 9], [9, s.chinY + 1, nz + 9]);
  b.add('chest', collar, 'coat');
  // its front seam and clasps, a sigil on each side
  b.paint('chest', aabb([-0.5, sy - 1, nz + 1], [0.5, s.chinY, nz + 8]), 'coatIn', { where: b.isMat('coat') });
  for (const y of [Math.round(sy + 1), Math.round(s.chinY - 2)]) {
    const at = frontOf(b, ['chest'], 0, y);
    if (at) b.voxel('chest', 0, y, at.z + 1, 'silver', 0);
  }
  for (const k of [1, -1]) b.paint('chest', box([k * 3.3, sy + 3.2, nz + 3.4], [0.5, 0.9, 1.0]), 'sigil', { where: b.isMat('coat') });
  // the seams over the shoulders, collar to shoulder point
  for (const k of [1, -1]) b.paint(['chest', `upperarm.${k > 0 ? 'L' : 'R'}`], capsule([k * 3.6, sy + 2.6, sz - 0.8], [k * (sx + 1.4), sy + 0.6, sz], 0.5), 'coat', { shade: 3, where: b.isMat('coat') });
  // double-breasted: the overlapping edge down his right side of the chest, the two rows of Zeichen buttons
  b.paint(['chest', 'spine'], aabb([-5.5, s.waistY - 1, 0], [-4.5, sy + 0.5, 20]), 'coat', { shade: 3, where: b.isMat('coat') });
  for (const k of [1, -1])
    for (const y of [s.chestY + 2, s.chestY - 2.5, s.waistY + 3]) {
      const x = Math.round(k * 3.1 - 0.5);
      for (const [dx, dy, sh] of [[0, 0, 0], [1, 0, 1], [0, -1, 1], [1, -1, 2]] as const) {
        const at = frontOf(b, ['chest', 'spine'], x + dx, Math.round(y) + dy);
        if (at) b.voxel(at.bone, x + dx, Math.round(y) + dy, at.z + 1, 'silver', sh);
      }
    }
  // the belt (white, a step cooler) and its gold buckle
  b.add('spine', intersect(subtract(offset(torso, 1.4), offset(torso, 0.2)), aabb([-20, s.waistY - 3.6, -20], [20, s.waistY - 1.4, 20])), 'coatIn');
  const bz = frontOf(b, ['spine'], 0, Math.round(s.waistY - 2.5))?.z ?? 5;
  b.add('spine', box([0, s.waistY - 2.5, bz + 0.6], [2.1, 1.6, 0.7]), 'gold');
  b.paint('spine', box([0, s.waistY - 2.5, bz + 1.4], [0.9, 0.5, 0.6]), 'gold', { shade: 2 });
  // the pin on the right breast: a star with spread wings in a halo
  badge(b, [
    '. . . o . . .',
    'X X . X . X X',
    '. X X o X X .',
    '. . X X X . .',
    '. X . . . X .',
  ], -4.2, Math.round(s.chestY + 3), 'silver');
  // the skirt: flared panels to the shins, a short slit at the front
  const skirt = coatSkirt(b, L, { mat: 'coat', lining: 'coatIn', yTop: s.waistY - 4, yHem: 13, r0: 7.6, r1: 10.8, openFront: 10, overlap: 3, res: URYU_TYBW_RES, depth: 0.85 });
  const cp = cape(b, L, torso);
  return { springs: [...skirt.springs, ...cp.springs], colliders: [...skirt.colliders, ...cp.colliders] };
}

/**
 * The long cape: over the shoulders from behind the collar and down the back to the ankles, open in front (its
 * edges hang behind the arms); rigid to the waist, then spring panels at the sides and back.
 */
function cape(b: ModelBuilder, L: Landmarks, torso: Sdf): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy] = s.shoulder;
  const nz = L.headC[2] - 0.8;
  // a thin shell over the shoulders and down the back, the drop from the shoulder blades smoothed by an ellipsoid
  const drape = blend(2.0, offset(torso, 2.2), ellipsoid([0, sy - 8, -1.6], [sx + 2.4, 10.5, 7.6]));
  const mantle = subtract(
    intersect(subtract(drape, offset(drape, -1.1), offset(torso, 1.2)), aabb([-40, s.waistY - 5, -40], [40, sy + 8, 40]),
      // it hangs from behind the collar and the backs of the shoulders (the coat's shoulders stay clear)
      fn((x, y, z) => Math.max(z - (Math.abs(x) < 4.8 ? nz - 2.4 : -1.2), y - (sy + 4.4 - Math.max(0, Math.abs(x) - 3) * 0.3)), [-40, 0, -40], [40, 120, 40])),
    cylinder([0, sy - 2, nz], [0, sy + 12, nz], s.neckR + 2.3),
  );
  addBands(b, mantle, 'coat', [['spine', s.waistY - 5, s.chestY - 4], ['chest', s.chestY - 6, 120]]);
  // folds falling down the back
  for (const x0 of [-6.2, -2.1, 2.1, 6.2]) b.paint(['chest', 'spine'], fn((x, y, z) => Math.max(Math.abs(x - x0 * (1 + (sy - y) * 0.012)) - 0.5, z + 3), [-30, s.waistY - 6, -30], [30, sy + 4, 0]), 'coat', { shade: 3, where: b.isMat('coat') });
  // below the waist: long panels to the ankles at the sides and back (no front panels: the cape is open)
  const skirt = coatSkirt(b, L, { mat: 'coat', lining: 'coatIn', yTop: s.waistY - 4, yHem: 3, r0: 10.2, r1: 13.8, openFront: 24, overlap: 4, res: URYU_TYBW_RES, prefix: 'cape', depth: 0.92, thick: 1.0 });
  for (const n of ['cape.F.L', 'cape.F.L.2', 'cape.F.R', 'cape.F.R.2']) b.carve(n, aabb([-99, -99, -99], [99, 199, 99]));
  return { springs: skirt.springs.filter((sp) => !sp.bone.startsWith('cape.F.')), colliders: [] };
}

/** White trousers, white boots to below the knee (a cooler white, a grey sole). */
function trousers(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [hx, hy, hz] = s.hip;
  const [kx, ky, kz] = L.knee;
  const [ax, ay, az] = L.ankle;
  b.add('hips', box([0, s.hipsY - 0.5, -0.3], [s.hips[0] + 0.5, 3.6, s.hips[1] + 0.5], { round: 2.4 }), 'coat');
  b.add('thigh.L', blend(1.3, sphere([hx, hy, hz], 3.5), capsule([hx, hy, hz], [kx, ky + 1, kz], 3.5, 2.9)), 'coat', { mirror: true });
  b.add('shin.L', blend(1.1, sphere([kx, ky, kz], 2.9), capsule([kx, ky, kz], [ax, ay + 2, az], 2.8, 2.6)), 'coat', { mirror: true });
  // the boots
  b.add('shin.L', capsule([kx, ky - 3.2, kz], [ax, ay + 1.5, az], 3.0, 2.8), 'coatIn', { mirror: true });
  b.paint('shin.L', cylinder([kx, ky - 3.6, kz], [kx, ky - 2.9, kz], 3.6), 'coatIn', { shade: 2, mirror: true, where: b.isMat('coatIn') });
  const f = s.foot;
  b.add('foot.L', capsule([ax, ay + 1.5, az - 0.4], [ax, ay - 1, az - 0.4], 2.6), 'coatIn', { mirror: true });
  b.add('foot.L', intersect(box([ax, 2.2, az + (f.len / 2 - f.heel)], [f.w / 2, 2.2, f.len / 2], { round: 1.4 }), fn((x, y, z) => y - 4.4 + (z - (az + f.len - f.heel - 3)) * 0.65, [-20, -2, -20], [20, 10, 30])), 'coatIn', { mirror: true });
  b.paint('foot.L', aabb([ax - 5, 0, az - 8], [ax + 5, 1, az + 14]), 'sole', { mirror: true });
}

// ---------------------------------------------------------------------------------------------- Vollständig

const hexR = (x: number, z: number): number => Math.max(Math.abs(x), Math.abs(x * 0.5 + z * 0.866), Math.abs(x * 0.5 - z * 0.866));

/** The wings, the crystal cuffs and greaves, the flechette insignia on the left breast. */
function vollstandig(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, , sz] = s.shoulder;
  wings(b, L);
  // the cuffs: hexagonal crystal rings round the wrists, their upper edge a row of points
  const wy = L.wrist[1];
  b.add('forearm.L', fn((x, y, z) => {
    const dx = x - sx, dz = z - sz;
    const a = Math.atan2(dz, dx);
    const top = wy + 4.4 + 1.4 * Math.abs(Math.sin(a * 3));
    return Math.max(Math.abs(hexR(dx, dz) - 3.4) - 0.8, y - top, wy + 0.2 - y);
  }, [sx - 7, wy - 1, sz - 7], [sx + 7, wy + 8, sz + 7]), 'crystal', { mirror: true, thr: 0.2 });
  // the greaves: faceted plates over the shins, a ridge down the middle, pointed under the knee
  const [kx, ky, kz] = L.knee;
  const ay = L.ankle[1];
  b.add('shin.L', fn((x, y, z) => {
    const dx = x - kx, dz = z - kz;
    const r = 3.4 + Math.max(0, 1.1 - Math.abs(dx) * 0.55);
    return Math.max(Math.abs(Math.hypot(dx, dz * 1.1) - r) - 0.7, -(dz - 0.3), y - (ky - 2.4 - Math.abs(dx) * 1.1), ay + 2.6 - y);
  }, [kx - 7, ay, kz - 7], [kx + 7, ky, kz + 7]), 'crystal', { mirror: true, thr: 0.2 });
  // the insignia: a feathered flechette on the left breast
  badge(b, [
    '. . X . .',
    '. X X X .',
    '. . X . .',
    '. X X X .',
    'X . X . X',
  ], 4.2, Math.round(s.chestY + 3), 'crystal', 2);
}

/**
 * Two sharp crystal wings off the upper back. Per side a long blade for the leading edge, out and up from the shoulder
 * blade, and five crystal feathers hanging off it, splaying down and out, longest at the tip: an angular wing.
 */
function wings(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    const root: V3 = [k * 2.2, s.chestY + 3.5, -(s.chest[1] + 4.4)];
    b.bone(`wing.${side}`, 'chest', root);
    // the wing plane: out (and back), and up
    const U: V3 = [k * 0.9, 0, -0.436];
    const V: V3 = [0, 1, 0];
    const N: V3 = [U[1] * V[2] - U[2] * V[1], U[2] * V[0] - U[0] * V[2], U[0] * V[1] - U[1] * V[0]];
    const at = (u: number, v: number): V3 => [root[0] + U[0] * u + V[0] * v, root[1] + U[1] * u + V[1] * v, root[2] + U[2] * u + V[2] * v];
    const dirAt = (deg: number): [V3, V3] => {
      const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
      return [[U[0] * c + V[0] * sn, U[1] * c + V[1] * sn, U[2] * c + V[2] * sn], [-U[0] * sn + V[0] * c, -U[1] * sn + V[1] * c, -U[2] * sn + V[2] * c]];
    };
    const tip: [number, number] = [38, 24];
    const [ld, la] = dirAt((Math.atan2(tip[1], tip[0]) * 180) / Math.PI);
    b.add(`wing.${side}`, crystalBlade(root, ld, la, N, Math.hypot(...tip) + 6, 3.0, 1.4, 0.45), 'crystal', { thr: 0.2 });
    // feathers: [position along the edge (0..1), angle (deg from out), length, half-width]
    const feathers: [number, number, number, number][] = [[1, -8, 30, 3.4], [0.8, -24, 34, 3.6], [0.6, -40, 32, 3.4], [0.4, -56, 26, 3.0], [0.2, -72, 19, 2.6]];
    for (const [t, deg, len, w] of feathers) {
      const [d, a] = dirAt(deg);
      const base = at(tip[0] * t, tip[1] * t);
      b.add(`wing.${side}`, crystalBlade(base, d, a, N, len, w, 1.2, 0.2), 'crystal', { thr: 0.2 });
    }
    // the ridges catch the light
    b.paint(`wing.${side}`, crystalBlade(root, ld, la, N, Math.hypot(...tip) + 6, 0.9, 1.6, 0.45), 'crystal', { shade: 0 });
    for (const [t, deg, len] of feathers) {
      const [d, a] = dirAt(deg);
      b.paint(`wing.${side}`, crystalBlade(at(tip[0] * t, tip[1] * t), d, a, N, len, 0.9, 1.5, 0.2), 'crystal', { shade: 0 });
    }
  }
}

/**
 * A long blade of crystal: a rhombic cross-section (half-width w across, half-thickness t), widest at `peak` of its
 * length (0 = at the root), tapering to a point that stays at least a voxel wide so it never comes loose.
 */
function crystalBlade(root: V3, d: V3, across: V3, n: V3, len: number, w: number, t: number, peak = 0.32): Sdf {
  const ends = [root, [root[0] + d[0] * len, root[1] + d[1] * len, root[2] + d[2] * len]];
  const m = Math.max(w, t) + 2;
  return fn((x, y, z) => {
    const px = x - root[0], py = y - root[1], pz = z - root[2];
    const u = px * d[0] + py * d[1] + pz * d[2];
    const v = px * across[0] + py * across[1] + pz * across[2];
    const h = px * n[0] + py * n[1] + pz * n[2];
    const k = u / len;
    const prof = peak > 0 && k < peak ? 0.45 + 0.55 * (k / peak) : 1 - (k - peak) / (1 - peak);
    const W = Math.max(0.95, w * prof), T = Math.max(0.95, t * Math.max(0.4, prof));
    const dia = (Math.abs(v) / W + Math.abs(h) / T - 1) * Math.min(W, T) * 0.8;
    return Math.max(dia, -u, u - len);
  }, [Math.min(ends[0][0], ends[1][0]) - m, Math.min(ends[0][1], ends[1][1]) - m, Math.min(ends[0][2], ends[1][2]) - m],
  [Math.max(ends[0][0], ends[1][0]) + m, Math.max(ends[0][1], ends[1][1]) + m, Math.max(ends[0][2], ends[1][2]) + m]);
}

// ---------------------------------------------------------------------------------------------- props

/**
 * The Heilig Bogen at 48 vox/m: a bow of light as tall as he is. A thin grip, almost straight limbs tapering to points
 * with their tips leaning back toward the archer, a fin off each limb's root angled forward, a small diamond arrow
 * rest. Origin at the grip; the limbs along ±Y; it shoots along +Z.
 */
function buildBogen(): VoxelModel {
  const b = new ModelBuilder('heilig-bogen', 48);
  b.mat('light', ['#D9FBFD', '#85F4FA', '#47E2F8', '#14C1F3'], { base: 1, rough: 0.1, glow: 1.3, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', box([0, 0, 0], [0.9, 5, 1.1], { round: 0.4 }), 'light');
  for (const k of [1, -1]) {
    b.add('root', spike([0, k * 4, 0.3], [0, k, -0.08], 36.5, 2.3, 1.1, { side: [1, 0, 0], taper: 1, tip: 0.65 }), 'light', { thr: 0.2 });
    b.add('root', spike([0, k * 4.6, 0.6], [0, k * 0.6, 1], 7.5, 0.8, 1.6, { side: [1, 0, 0], tip: 0.65 }), 'light', { thr: 0.2 });
  }
  b.add('root', prism([[0, 2.4], [2.4, 0], [0, -2.4], [-0.4, 0]], [0, 0, 1.2], [0, 0, 1], [0, 1, 0], 0.6), 'light', { thr: 0.2 });
  // the hand's place on the grip, a shade deeper
  b.paint('root', box([0, 0, 0], [2, 3.2, 2]), 'light', { shade: 2 });
  b.autoShade({ up: 0.3, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** A flechette at 48 vox/m (pointing +Z): a long diamond head, a thin shaft, four swept vanes. */
function buildFlechette(): VoxelModel {
  const b = new ModelBuilder('flechette', 48);
  b.mat('crystal', ['#D8F7FC', '#8FE9F8', '#5CD6F5', '#1E8FD0'], { base: 1, rough: 0.1, glow: 1.1, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', spike([0, 0, 2], [0, 0, 1], 7, 1.5, 0.9, { side: [1, 0, 0], tip: 0.1 }), 'crystal', { thr: 0.2 });
  b.add('root', capsule([0, 0, -7], [0, 0, 3], 0.6), 'crystal', { thr: 0.2 });
  for (const [vx, vy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) b.add('root', prism([[0.2, -2], [0.2, -7.4], [2.8, -8.6], [1.4, -3.2]], [0, 0, 0], [vx, vy, 0], [0, 0, 1], 0.4), 'crystal', { thr: 0.2 });
  b.autoShade({ up: 0.3, open: 2, front: 0 });
  b.lint(2);
  return b.build();
}

/** The Standspitze at 96 vox/m (pointing +Z): a leaf-shaped head of Still Silver, two barbs, the socket. */
function buildStandspitze(): VoxelModel {
  const b = new ModelBuilder('standspitze', 96);
  b.mat('silver', ['#EEF1F6', '#D8DDE6', '#B4BAC6', '#858C99'], { base: 1, rough: 0.15, metal: 0.95, shadeK: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', spike([0, 0, 0], [0, 0, 1], 12, 2.6, 0.9, { side: [1, 0, 0], tip: 0.1 }), 'silver', { thr: 0.2 });
  for (const k of [1, -1]) b.add('root', spike([k * 1.4, 0, 1.6], [k * 0.55, 0, -1], 4.4, 0.8, 0.55, { side: [0, 1, 0], tip: 0.1 }), 'silver', { thr: 0.2 });
  b.add('root', cylinder([0, 0, -4.5], [0, 0, 0.6], 0.95), 'silver');
  b.paint('root', box([0, 0, 4], [0.5, 2, 4]), 'silver', { shade: 0 });
  b.autoShade({ up: 0.3, open: 2, front: 0 });
  b.lint(2);
  return b.build();
}

/** A Leiden Scherben chip at 48 vox/m: a thin hexagonal plate lying flat, a Zeichen glyph on its face. */
function buildChip(): VoxelModel {
  const b = new ModelBuilder('scherben-chip', 48);
  b.mat('silver', ['#E4E7EC', '#C0C4CA', '#9DA3AD', '#767C86'], { base: 1, rough: 0.25, metal: 0.85, shadeK: 0.8 });
  b.mat('glyph', ['#85F4FA', '#47E2F8'], { base: 1, glow: 1.4, dither: 0 });
  b.bone('root', null, [0, 0, 0]);
  b.add('root', fn((x, y, z) => Math.max(hexR(x, z) - 3.6, Math.abs(y - 0.5) - 0.6), [-5, -1, -5], [5, 2, 5]), 'silver');
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
    b.paint('root', capsule([0, 1, 0], [Math.cos(a) * 2.6, 1, Math.sin(a) * 2.6], 0.5), 'glyph');
  }
  b.autoShade({ up: 0.3, open: 2, front: 0 });
  b.lint(2);
  return b.build();
}
