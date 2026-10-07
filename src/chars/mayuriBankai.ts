// Konjiki Ashisogi Jizō — Mayuri's Bankai (docs/roster/B3-captains-3.md): born out of the gaping mouth of the
// baby on his sword's guard, a gigantic caterpillar-like creature about 17 m long. A pale segmented body on
// stubby prolegs under a great red cape; at its front a grotesque golden baby's head, eyes shut in a fat
// face, the mouth gaping (the poison breathes out of it), two chubby golden arms reaching from under the cape;
// a silver halo hanging over the head with four bells. Retractable blades spring from its chest.
// Built at 6 vox/m (a giant: the head is ~28 voxels), on a chain of segment bones the summon undulates.
import { ModelBuilder } from '../models/builder';
import { aabb, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, sphere, spike, subtract, torus, type Sdf, type V3 } from '../models/sdf';
import type { CharacterAsset } from './ichigo';

/** 6 voxels per metre */
export const JIZO_RES = 6;
/** body segments behind the head */
export const JIZO_SEGMENTS = 6;
/** the mouth (model space, voxels → m below via JIZO_RES): where the poison breathes out */
export const JIZO_MOUTH: V3 = [0, 15.5 / JIZO_RES, 16 / JIZO_RES];

const SEG_LEN = 12.5;
const segZ = (i: number) => -5 - i * SEG_LEN;
const segR = (i: number): V3 => [11.5 - i * 0.7, 9.6 - i * 0.55, 8.2];
const segY = (i: number) => 9.6 - i * 0.55;

let cache: CharacterAsset | null = null;

export function jizoAsset(): CharacterAsset {
  if (!cache) cache = buildJizo();
  return cache;
}

export function buildJizo(): CharacterAsset {
  const b = new ModelBuilder('konjiki-ashisogi-jizo', JIZO_RES);
  b.mat('gold', ['#F4D27A', '#E8C050', '#D9AA2B', '#B88A1E', '#8E6814'], { base: 2, rough: 0.35, metal: 0.65, shadeK: 0.85 });
  b.mat('mouth', ['#6A1A2A', '#4A1020', '#2E0A16'], { base: 1, rough: 0.6 });
  b.mat('shut', ['#5A3A10']);
  b.mat('cape', ['#D8344A', '#C01E36', '#B0122B', '#8C0E22', '#640A18'], { base: 2, rough: 0.75, shadeK: 0.85 });
  b.mat('capeIn', ['#7A0C1E', '#5A0814', '#3E060E'], { base: 1, rough: 0.8 });
  b.mat('flesh', ['#F3ECDC', '#E7DECB', '#D4C8AE', '#B8AA8C', '#988A6E'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('silver', ['#E4E8EC', '#C7CCD2', '#A6ACB4', '#868C94'], { base: 1, rough: 0.25, metal: 0.85 });
  b.mat('bell', ['#E8EBEE', '#D7D9DC', '#B4B8BE', '#8E9298'], { base: 1, rough: 0.2, metal: 0.9 });
  b.mat('steel', ['#D8DDE2', '#B8BEC5', '#969CA6', '#767C86'], { base: 1, rough: 0.2, metal: 0.9 });

  b.bone('root', null, [0, 0, 0]);
  b.bone('seg1', 'root', [0, segY(0), 2]);
  for (let i = 2; i <= JIZO_SEGMENTS; i++) b.bone(`seg${i}`, `seg${i - 1}`, [0, segY(i - 1), segZ(i - 2) - SEG_LEN * 0.5]);
  b.bone('head', 'seg1', [0, 14, 2]);
  b.bone('halo', 'head', [0, 42, 2]);
  for (const k of [1, -1]) {
    const n = k > 0 ? 'L' : 'R';
    b.bone(`arm.${n}`, 'seg1', [k * 12, 14, 2]);
    b.bone(`hand.${n}`, `arm.${n}`, [k * 14.5, 5, 12]);
  }
  b.bone('blades', 'seg1', [0, 4, 6]);
  b.socket('mouth', 'head', [0, 15.5, 16]);
  b.socket('halo', 'halo', [0, 42, 2]);
  b.socket('chest', 'seg1', [0, 4, 8]);

  head(b);
  halo(b);
  arms(b);
  body(b);
  blades(b);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}

/** The golden baby's head: fat-cheeked, bald, eyes shut in creases, the mouth gaping wide. */
function head(b: ModelBuilder): void {
  const hc: V3 = [0, 22, 4];
  const skull = ellipsoid(hc, [13, 14, 12]);
  // fat cheeks and a little chin
  b.add('head', skull, 'gold');
  for (const k of [-1, 1]) b.add('head', ellipsoid([k * 7.6, 17, 10], [5.4, 5, 5]), 'gold');
  b.add('head', ellipsoid([0, 11.2, 9], [5.4, 3.6, 4.6]), 'gold');
  // the neck down into the front segment
  b.add('head', cylinder([0, 8, 0], [0, 16, 1], 7.5, 8.5), 'gold');
  // the brow ridge, the nose, the ears
  b.add('head', ellipsoid([0, 26.5, 13.2], [8.5, 2.2, 3]), 'gold');
  b.add('head', ellipsoid([0, 21, 16], [2.2, 2.2, 2]), 'gold');
  for (const k of [-1, 1]) b.add('head', ellipsoid([k * 13, 22, 3], [2, 3.4, 2.4]), 'gold');
  // eyes shut: two dark curved creases
  for (const k of [-1, 1]) {
    b.paint('head', fn((x, y, z) => {
      const u = (x - k * 5) / 3.6;
      if (Math.abs(u) > 1) return 1;
      return Math.abs(y - (24 + (1 - u * u) * 1.2)) - 0.55;
    }, [k * 5 - 4, 22, 8], [k * 5 + 4, 27, 18]), 'shut', { where: b.isMat('gold') });
  }
  // the mouth: a wide gaping hole, dark red inside
  b.carve('head', ellipsoid([0, 15.5, 15], [6.2, 3.6, 4.2]));
  b.add('head', ellipsoid([0, 15.5, 12.4], [5.6, 3.2, 2.6]), 'mouth', { only: 'empty' });
  b.paint('head', ellipsoid([0, 15.5, 13], [6.4, 3.9, 3.6]), 'mouth', { where: b.isMat('gold') });
  b.paint('head', ellipsoid([0, 15.5, 15.2], [6.8, 4.3, 1.6]), 'gold', { shade: 1, where: b.isMat('mouth') });
  // creases: the fat folds at the neck and the corners of the mouth
  b.paint('head', torus([0, 10.5, 2], 8.6, 0.7, [90, 0, 0]), 'gold', { shade: 4, where: b.isMat('gold') });
  for (const k of [-1, 1]) b.paint('head', capsule([k * 6.6, 18.5, 14], [k * 7.4, 13.5, 13.5], 0.6), 'gold', { shade: 4, where: b.isMat('gold') });
}

/** The silver halo hanging over the head, tilted back, with four bells on it. */
function halo(b: ModelBuilder): void {
  const c: V3 = [0, 42, 2];
  b.add('halo', torus(c, 10.5, 1.1, [-14, 0, 0]), 'silver', { thr: 0.3 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(a) * 10.5, z = c[2] + Math.sin(a) * 10.5 * Math.cos((14 * Math.PI) / 180);
    const y = c[1] + Math.sin(a) * 10.5 * Math.sin((14 * Math.PI) / 180);
    // a short cord down to a bell, its mouth open below
    b.add('halo', capsule([x, y, z], [x, y - 2.6, z], 0.45), 'silver', { thr: 0.3 });
    b.add('halo', subtract(cylinder([x, y - 2.4, z], [x, y - 6.2, z], 1.2, 2.4, 0.6), cylinder([x, y - 4, z], [x, y - 7, z], 0.6, 1.7)), 'bell', { thr: 0.2 });
    b.add('halo', sphere([x, y - 6, z], 0.7), 'bell');
  }
}

/** Two chubby golden baby arms reaching forward from under the cape. */
function arms(b: ModelBuilder): void {
  for (const k of [1, -1]) {
    const n = k > 0 ? 'L' : 'R';
    b.add(`arm.${n}`, capsule([k * 12, 14, 2], [k * 14.5, 5, 12], 3.4, 3.0), 'gold');
    b.add(`arm.${n}`, sphere([k * 12, 14, 2], 4), 'gold');
    // a crease at the elbow and the wrist (fat rolls)
    b.paint(`arm.${n}`, torus([k * 13.3, 9.6, 7], 3.2, 0.6, [55, 0, k * 14]), 'gold', { shade: 4, where: b.isMat('gold') });
    // the hand: a fat mitten with stubby fingers curled forward
    b.add(`hand.${n}`, ellipsoid([k * 14.8, 4, 14.5], [3.4, 3, 3.6]), 'gold');
    for (let f = 0; f < 4; f++) b.add(`hand.${n}`, capsule([k * (13 + f * 1.1), 3.2, 16.6], [k * (13 + f * 1.1), 1.4, 18.6], 0.95), 'gold', { thr: 0.25 });
    b.add(`hand.${n}`, capsule([k * 12, 4.6, 15], [k * 11, 3.4, 17.6], 1.0), 'gold', { thr: 0.25 });
  }
}

/** The pale segmented body on stubby prolegs, the red cape draped over it from behind the head to the tail. */
function body(b: ModelBuilder): void {
  for (let i = 0; i < JIZO_SEGMENTS; i++) {
    const bone = `seg${i + 1}`;
    const c: V3 = [0, segY(i), segZ(i)];
    const r = segR(i);
    const seg: Sdf = ellipsoid(c, r);
    b.add(bone, seg, 'flesh');
    // the ring between segments (a dark groove)
    b.paint(bone, fn((x, y, z) => Math.abs(z - (c[2] + SEG_LEN * 0.5)) - 0.8, [-r[0] - 2, 0, c[2] + SEG_LEN * 0.5 - 2], [r[0] + 2, c[1] + r[1] + 2, c[2] + SEG_LEN * 0.5 + 2]), 'flesh', { shade: 4, where: b.isMat('flesh') });
    // stubby prolegs: two pairs under the segment
    for (const k of [-1, 1]) for (const dz of [-3, 3]) b.add(bone, capsule([k * r[0] * 0.55, c[1] - r[1] * 0.6, c[2] + dz], [k * r[0] * 0.62, 0.8, c[2] + dz + 0.6], 2.2, 1.6), 'flesh', { thr: 0.2 });
    // the cape over the top of the segment, falling to below its middle; the hem scalloped
    const shell = intersect(subtract(offset(seg, 1.6), seg), fn((x, y, z) => {
      const scallop = Math.abs(Math.sin(z * 0.45 + x * 0.1)) * 1.6;
      return (c[1] - r[1] * 0.35 + scallop) - y;
    }, [-r[0] - 3, 0, c[2] - r[2] - 3], [r[0] + 3, c[1] + r[1] + 3, c[2] + r[2] + 3]));
    b.add(bone, shell, 'cape');
    // folds running down the cape
    b.paint(bone, fn((x) => Math.abs(((x + 60) % 4.4) - 2.2) - 0.5, [-r[0] - 3, c[1] - r[1], c[2] - r[2] - 3], [r[0] + 3, c[1] + r[1] + 3, c[2] + r[2] + 3]), 'cape', { shade: 4, where: b.isMat('cape') });
  }
  // the cape's collar behind the head: a great hood of red rising behind the skull, lined dark
  const hood = intersect(subtract(ellipsoid([0, 20, -4], [16, 16, 9]), ellipsoid([0, 21, -1], [13.6, 14.4, 8])), halfSpace([0, 0, 2], [0, 0, 1]), halfSpace([0, 6, 0], [0, -1, 0]));
  b.add('seg1', hood, 'cape');
  b.paint('seg1', ellipsoid([0, 21, -1], [14.6, 15.4, 9]), 'capeIn', { where: b.isMat('cape') });
  // the flesh under the head joins the hood (no gap at the throat)
  b.add('seg1', ellipsoid([0, 9, 2], [9, 7, 6]), 'flesh');
}

/** The retractable blades under the chest (hidden until it strikes). */
function blades(b: ModelBuilder): void {
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 2.6;
    const d: V3 = [x * 0.05, -0.3 - Math.abs(x) * 0.02, 1];
    b.add('blades', spike([x, 4, 6], d, 9 + (3 - Math.abs(i - 3)) * 1.4, 1.2, 0.6, { tip: 0.35 }), 'steel', { thr: 0.45 });
  }
  b.add('blades', capsule([-9, 4, 5.4], [9, 4, 5.4], 1.4), 'steel');
}
