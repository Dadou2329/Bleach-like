// Renji Abarai in the Thousand-Year Blood War (docs/roster/C1-lieutenants-1.md §Renji; docs/kits/renji.md).
// Brief: the lieutenant's body (188 cm, the standard 84-vox body at 44.8 vox/m), the pineapple grown out (×1.35).
// - 'oken': back from the Royal Palace in the Ōken clothing woven from Royal Guard bone and hair — a tiger-striped
//   bandana over the forehead (its tails on a spring), a black visor over the eyes, a sleeveless tiger-striped jacket
//   to the hips with a white fur hem, a short white double-breasted cape over the shoulders with a standing collar
//   (the flaps over the arms ride the upper arms). Colours (verify): ochre #D9962A, stripes #1A1A1A, fur #EEE7D8,
//   visor #111114 with a #5A5F66 gloss, cape #F2F2EF.
// - 'soo': Bankai, Sōō Zabimaru — the Ōken torn away by the release: the shihakushō, its right sleeve gone (the arm's
//   tattoo bands and the forehead marks bare); the right forearm in the gauntlet, the upper half of a snake skull over
//   the forearm and the fist with a red fur ruff at its base (the blade slides out of its mouth: a prop on grip.R);
//   a great green fur cowl over the left shoulder with a round bone disk on top, the jet nozzle; bone plates round the
//   neck and over the bare right shoulder (the armoured collar); the vertebral tail wound round the waist like a sash
//   and three vertebral cords hanging from it (spring bones).
// Props: the blade out of the mouth, Orochiō (longer, serrated) and its red-hot twin, a small vertebra for the tail on
// its tether, and Hihiō — the giant skeletal green-furred arm at 16 vox/m whose bones carry his left arm's names (a
// mirror rig copies his rotations), its furless ghost, a fur clump and the giant hands of Hihi Tenshō.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, offset, prism, sphere, spike, subtract, type Sdf, type V3 } from '../models/sdf';
import { faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, type Landmarks } from './humanoid';
import { FACE, RENJI_RES, SPEC, hair, palette, tattoos } from './renji';
import type { CharacterAsset } from './ichigo';
import type { SpringDef } from '../anim/springs';

export type RenjiTybwForm = 'oken' | 'soo';

/** The blade out of the gauntlet's mouth (prop frame, m): along −Y past the knuckles, the edge toward +Z. */
export const SOO_BLADE_BASE: V3 = [0, -0.13, 0.01];
export const SOO_BLADE_TIP: V3 = [0, -1.3, 0.02];
/** Orochiō: the blade grown long and serrated */
export const OROCHIO_TIP: V3 = [0, -1.95, 0.03];

const assetCache = new Map<RenjiTybwForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function renjiTybwAsset(form: RenjiTybwForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildRenjiTybw(form)));
  return a;
}

export type RenjiTybwProp = 'soo-blade' | 'orochio' | 'orochio-hot' | 'tail-vert' | 'hihio' | 'hihio-bare' | 'fur-clump' | 'hand-open' | 'hand-fist';

export function renjiTybwProp(kind: RenjiTybwProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'soo-blade' ? buildMouthBlade(false, false) : kind === 'orochio' ? buildMouthBlade(true, false) : kind === 'orochio-hot' ? buildMouthBlade(true, true)
      : kind === 'tail-vert' ? buildTailVertebra() : kind === 'hihio' ? buildHihio(true) : kind === 'hihio-bare' ? buildHihio(false)
      : kind === 'fur-clump' ? buildFurClump() : buildGiantHand(kind === 'hand-fist');
    propCache.set(kind, m);
  }
  return m;
}

function tybwMats(b: ModelBuilder): void {
  b.mat('tiger', ['#EDB253', '#D9962A', '#BD7C1E', '#966015'], { base: 1, rough: 0.85, shadeK: 0.9 });
  b.mat('stripe', ['#2A2622', '#1E1B19', '#17161A'], { base: 1, rough: 0.9 });
  b.mat('fur', ['#F3F0E6', '#EEE7D8', '#D9D0BC', '#BCB19A'], { base: 1, rough: 0.95, shadeK: 0.9, dither: 0.1 });
  b.mat('cape', ['#F3F3F0', '#EAEAE6', '#D6D6D2', '#BEBFBC', '#A3A5A4'], { base: 1, rough: 0.8, shadeK: 0.9 });
  b.mat('button', ['#45454C', '#2C2C32']);
  b.mat('visor', ['#5A5F66', '#2B2D33', '#1C1C21', '#16161A'], { base: 2, rough: 0.12, metal: 0.6 });
}

function boneMats(b: ModelBuilder): void {
  b.mat('bone', ['#F3EEE0', '#EDE5D0', '#D9CDB0', '#BDB091', '#968A6E'], { base: 1, rough: 0.65, shadeK: 0.9 });
  b.mat('crevice', ['#8E8268', '#6E6450']);
  b.mat('socket', ['#2A2018', '#1C1612']);
}

function sooMats(b: ModelBuilder): void {
  boneMats(b);
  b.mat('ruff', ['#D2453F', '#B3262B', '#8E1C22', '#6B151A'], { base: 1, rough: 0.95, shadeK: 0.9, dither: 0.12 });
  b.mat('green', ['#A6CBAA', '#83AE8C', '#6F9E7C', '#5A8768', '#4C7559', '#3B5D46'], { base: 2, rough: 0.95, shadeK: 0.9, dither: 0.12 });
  b.mat('nozzle', ['#3A2A22', '#2A1E18']);
  b.mat('ember', ['#FFE07A', '#F5C542'], { glow: 1.4 });
}

export function buildRenjiTybw(form: RenjiTybwForm): CharacterAsset {
  const b = new ModelBuilder(`renji-${form}`, RENJI_RES);
  palette(b, 'none');
  if (form === 'oken') tybwMats(b);
  else sooMats(b);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0] + 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0] - 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('finger.R', 'palm.R', [-L.wrist[0] + 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('finger.L', 'palm.L', [L.wrist[0] - 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('hip.L', 'hips', [9.4, 46.5, 3.4], [-26, 180, -8]);
  b.socket('chest.front', 'chest', [0, 61, 7]);
  b.socket('back', 'chest', [0, 60, -8]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'tattoo', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), T: { mat: 'tattoo' } }, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd, true);
  tattoos(b, L);
  hands(b, L, 'skin');
  feet(b, L, 'tabi', 'straw', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi' };
  const torso = kosodeTorso(b, L, o);
  kosodeSleeves(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  const base = shihakushoSprings();
  const springs: SpringDef[] = [...base.springs];
  if (form === 'oken') {
    bandana(b, L, hd);
    visor(b, L, hd);
    jacket(b, L, torso);
    cape(b, L, torso);
    springs.push({ bone: 'band.tails', tail: [0, -0.13, -0.12], stiffness: 26, damping: 4, gravity: 9, limit: 75, radius: 0.03 });
  } else {
    foreheadMarks(b, hd);
    bareRightArm(b, L);
    gauntlet(b, L);
    cowl(b, L);
    collar(b, L);
    springs.push(...tailSash(b, L));
  }
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders: base.colliders, warnings: b.warnings };
}

// ---------------------------------------------------------------------------------------------- Ōken clothing

/** The angle round the body's vertical axis (0 = straight ahead, + toward his left). */
const azim = (x: number, z: number, cz = 0) => Math.atan2(x, z - cz);

/** Tiger stripes: irregular dark bands, thicker on the flanks, tapering toward the middle front and back. */
function tigerStripe(scale: number): (x: number, y: number, z: number) => number {
  return (x, y, z) => {
    const a = azim(x, z, -0.5);
    const v = y * scale + 0.55 * Math.sin(a * 3 + 1) + 0.22 * Math.sin(a * 7 + y * 0.4);
    const f = v - Math.floor(v);
    const w = 0.07 + 0.09 * Math.abs(Math.sin(a));
    return Math.abs(f - 0.5) - w;
  };
}

/** The tiger-striped bandana: a wide band over the forehead and round the head, knotted at the back, two tails. */
function bandana(b: ModelBuilder, L: Landmarks, hd: { chin: number; front: number }): void {
  const s = L.spec;
  const c = hd.chin;
  const back = L.headC[2] - s.head.d / 2;
  const zc = L.headC[2] - 0.2;
  const band = intersect(
    subtract(ellipsoid([0, c + 10.6, zc], [6.6, 5, 7]), ellipsoid([0, c + 10.6, zc], [5.4, 7, 5.8])),
    fn((x, y, z) => Math.abs(y - (c + 10.9 + 0.09 * z)) - 1.9, [-10, c + 6, -12], [10, c + 15, 12]),
  );
  b.add('head', band, 'tiger', { thr: 0.2 });
  // the stripes run round the head, a few broken bars across the band
  b.paint('head', fn((x, y, z) => {
    const a = Math.atan2(x, z - zc);
    const v = a * 2.6 + 0.35 * Math.sin(y * 1.3);
    const f = v - Math.floor(v);
    return Math.abs(f - 0.5) - 0.11;
  }, [-10, c + 6, -12], [10, c + 15, 12]), 'stripe', { where: b.isMat('tiger') });
  // the knot at the back and its tails
  b.add('head', ellipsoid([0, c + 10.2, back - 0.7], [1.9, 1.5, 1.3]), 'tiger');
  b.bone('band.tails', 'head', [0, c + 10.2, back - 1]);
  for (const k of [-1, 1]) {
    b.add('band.tails', capsule([k * 0.5, c + 10.2, back - 1.3], [k * 2.2, c + 4.2, back - 2.8], 0.9, 0.7), 'tiger', { thr: 0.2 });
    b.paint('band.tails', capsule([k * 1.3, c + 7.4, back - 2], [k * 1.5, c + 6.6, back - 2.2], 0.9), 'stripe', { where: b.isMat('tiger') });
  }
}

/** The black visor over the eyes, a wraparound shield to the temples with a cold gloss across it. */
function visor(b: ModelBuilder, L: Landmarks, hd: { chin: number; front: number }): void {
  const c = hd.chin;
  const zc = L.headC[2];
  const yc = c + 5.6;
  const shield = intersect(
    subtract(ellipsoid([0, yc, zc], [6.4, 4, 6.9]), ellipsoid([0, yc, zc], [5.3, 6, 5.75])),
    fn((x, y, z) => Math.abs(y - yc + 0.12 * Math.abs(x)) - 1.7, [-10, c, -12], [10, c + 12, 12]),
    fn((x, y, z) => -2.6 - z, [-10, c, -12], [10, c + 12, 12]),
  );
  b.add('head', shield, 'visor', { thr: 0.2 });
  b.paint('head', fn((x, y, z) => Math.abs(y - yc - 0.6 * (x - 1.5) * 0.45) - 0.45, [-10, c, 3], [10, c + 12, 12]), 'visor', { where: b.isMat('visor'), shade: 0 });
}

/**
 * The jacket: sleeveless, tiger-striped, closed down the front, to the hips where a thick band of white fur trims
 * the hem. The upper part rides the chest and spine; the skirt over the hips rides the hips.
 */
function jacket(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const armholes = [cylinder([sx + 3.4, sy - 1, sz], [sx - 1.6, sy - 1, sz], 3.7), cylinder([-sx - 3.4, sy - 1, sz], [-sx + 1.6, sy - 1, sz], 3.7)];
  const neck = prism([[-3.2, s.chinY + 6], [3.2, s.chinY + 6], [0, s.chestY + 3]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 20);
  const upper = subtract(offset(torso, 1.5), offset(torso, 0.25), ...armholes, intersect(neck, fn((x, y, z) => -z, [-20, 0, -20], [20, 100, 20])));
  // the skirt: an elliptic band flaring a little over the hakama's top
  const skirt = fn((x, y, z) => {
    if (y < 38 || y > 53) return 1;
    const t = (52 - y) / 13;
    const rx = 9.9 + t * 2.6, rz = 7.6 + t * 1.8;
    const d = (Math.hypot(x / rx, (z + 0.3) / rz) - 1) * Math.min(rx, rz);
    return Math.max(Math.abs(d - 0.6) - 0.7, y - 52, 39.6 - y);
  }, [-16, 37, -13], [16, 54, 13]);
  b.add('chest', intersect(upper, aabb([-30, s.chestY - 7, -30], [30, 90, 30])), 'tiger');
  b.add('spine', intersect(upper, aabb([-30, s.hipsY + 1, -30], [30, s.chestY - 7, 30])), 'tiger');
  b.add('hips', skirt, 'tiger');
  b.paint(['chest', 'spine', 'hips'], fn(tigerStripe(0.21), [-20, 30, -14], [20, 90, 14]), 'stripe', { where: b.isMat('tiger') });
  // the closure down the front
  b.paint(['chest', 'spine', 'hips'], aabb([-0.5, 38, 2], [0.5, s.chestY + 2, 14]), 'stripe', { where: b.isMat('tiger') });
  // the fur hem: a thick ring of clumps round the bottom
  b.add('hips', fn((x, y, z) => {
    const rx = 13.1, rz = 10;
    const d = (Math.hypot(x / rx, (z + 0.3) / rz) - 1) * 10;
    return Math.max(Math.abs(d) - 1.3, Math.abs(y - 39.4) - 1.25);
  }, [-17, 36, -14], [17, 42, 14]), 'fur', { thr: 0.25 });
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    const p: V3 = [Math.sin(a) * 13.3, 38.5 + (i % 2) * 0.6, Math.cos(a) * 10.2 - 0.3];
    b.add('hips', sphere(p, 1.25 + (i % 3) * 0.2), 'fur', { thr: 0.25 });
  }
}

/**
 * The cape: a white mantle over the shoulders, short in front where it fastens double-breasted (two rows of two
 * buttons high on the chest, open below), falling long down the back to the hips, with a standing collar. Over each
 * arm the flap rides the upper arm.
 */
function cape(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const arm = (k: number) => capsule([k * (sx + 0.4), sy - 0.5, sz], [k * (sx + 0.7), sy - 8, sz - 0.4], 3.7, 4.1);
  const body = blend(5, ellipsoid([0, s.chestY + 1, -0.5], [10.6, 8.5, 7.2]), torso, arm(1), arm(-1));
  // the hem: high in front and over the arms, dropping down the back
  const hem = fn((x, y, z) => 58.6 - Math.max(0, -z - 2) * 2.3 - y, [-30, 30, -30], [30, 90, 30]);
  const opening = fn((x, y, z) => Math.max(Math.abs(x) - 1.2 - (60.5 - y) * 0.35, y - 60.5, -z), [-30, 30, -30], [30, 90, 30]);
  const mantle = subtract(intersect(subtract(offset(body, 1.6), offset(body, 0.55)), hem, aabb([-30, 0, -30], [30, s.chinY - 0.5, 30])), opening);
  const inner = sx - 1.2;
  b.add('chest', intersect(mantle, aabb([-inner, 0, -30], [inner, 100, 30])), 'cape');
  b.add('upperarm.L', intersect(mantle, aabb([inner, 0, -30], [40, 100, 30])), 'cape');
  b.add('upperarm.R', intersect(mantle, aabb([-40, 0, -30], [-inner, 100, 30])), 'cape');
  // where the flaps rest on the shoulders they are one with the sleeve beneath (no gap at the shoulder top)
  for (const k of [1, -1]) b.add(k > 0 ? 'upperarm.L' : 'upperarm.R', intersect(offset(arm(k), 1.1), aabb([k > 0 ? inner : -40, sy - 1.5, -30], [k > 0 ? 40 : -inner, 100, 30]), hem), 'cape', { only: 'empty' });
  // folds falling down the back and over the shoulders
  for (const x of [-6.5, -2.2, 2.2, 6.5]) b.paint('chest', capsule([x * 0.8, s.chestY + 2, -9], [x, 47, -9.5], 0.55), 'cape', { shade: 3, where: b.isMat('cape') });
  for (const k of [1, -1]) {
    const bn = k > 0 ? 'upperarm.L' : 'upperarm.R';
    for (const dz of [-2.6, 1.2]) b.paint(bn, capsule([k * (sx + 1.5), sy + 2.5, sz + dz], [k * (sx + 3.6), 57, sz + dz * 1.3], 0.5), 'cape', { shade: 3, where: b.isMat('cape') });
  }
  // the standing collar
  b.add('chest', subtract(cylinder([0, s.chinY - 6.5, -0.9], [0, s.chinY + 0.8, -0.9], 5, 5.4), cylinder([0, s.chinY - 7, -0.9], [0, s.chinY + 1.5, -0.9], 3.7, 4)), 'cape');
  // double-breasted: two rows of two buttons on the cloth's surface, high on the chest
  const g = b.grid('chest');
  const front = (x: number, y: number) => {
    for (let z = 16; z > 0; z--) if (g.get(x, y, z) !== 0) return z;
    return -99;
  };
  for (const x of [-3, 3]) {
    for (const y of [61, 64]) {
      const z = front(x, y);
      if (z > 0) b.voxel('chest', x, y, z + 1, 'button', 'flat');
    }
  }
}

// ---------------------------------------------------------------------------------------------- Sōō Zabimaru

/** The forehead marks, bare now: jagged strokes up from the brows' outer ends into the hairline. */
function foreheadMarks(b: ModelBuilder, hd: { chin: number; front: number }): void {
  const c = hd.chin, f = hd.front - 1;
  for (const k of [-1, 1]) {
    b.paint('head', capsule([k * 3.6, c + 9.6, f], [k * 2.4, c + 11.4, f], 0.5), 'tattoo', { where: b.isMat('skin') });
    b.paint('head', capsule([k * 1.4, c + 9.8, f], [k * 1.9, c + 11.2, f], 0.45), 'tattoo', { where: b.isMat('skin') });
  }
}

/** The right sleeve torn off at the shoulder (a ragged stub), the arm bare with its tattoo bands. */
function bareRightArm(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.carve('upperarm.R', fn((x, y, z) => {
    const a = Math.atan2(z - sz, x + sx);
    return y - (sy - 3.2 + 1.1 * Math.sin(a * 4) + 0.6 * Math.sin(a * 9));
  }, [-30, -10, -30], [30, 100, 30]));
  b.carve('forearm.R', aabb([-40, -10, -30], [0, 100, 30]));
  b.carve('sleeve.R', aabb([-40, -10, -30], [0, 100, 30]));
  b.add('upperarm.R', capsule([-sx, sy - 1, sz], [-sx, ey, sz], 2.9, 2.5), 'skin', { only: 'empty' });
  b.add('forearm.R', capsule([-sx, ey, sz], [-sx, wy + 1, sz], 2.5, 2.1), 'skin');
  // tattoo bands round the upper arm, zigzag
  for (const y0 of [sy - 6, sy - 9.4]) {
    b.paint('upperarm.R', fn((x, y, z) => {
      const a = Math.atan2(z - sz, x + sx);
      return Math.abs(y - (y0 + 0.9 * Math.sin(a * 3))) - 0.5;
    }, [-sx - 5, y0 - 3, sz - 5], [-sx + 5, y0 + 3, sz + 5]), 'tattoo', { where: b.isMat('skin') });
  }
}

/**
 * The gauntlet: the upper half of a snake skull swallowing the right forearm and fist. A bony sleeve with crevices
 * across it from the elbow, the cranium domed over the wrist (its top faces out, the way the back of the hand does),
 * deep sockets with a gold glint, brow ridges, a snout past the knuckles ending in the mouth the blade slides out of,
 * two fangs at its corners; a red fur ruff round its base.
 */
function gauntlet(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, , sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const x = -sx;
  // the bony sleeve over the forearm, widening into the cranium at the wrist
  b.add('forearm.R', blend(2,
    cylinder([x, ey - 2.4, sz], [x, wy + 1, sz], 3.6, 3.9),
    ellipsoid([x - 1.2, wy + 3.6, sz], [4.2, 6, 4.9])), 'bone');
  // two seams where the plates of the skull meet
  for (const y of [ey - 5, wy + 8.5]) b.paint('forearm.R', fn((px, py) => Math.abs(py - y + 0.6 * (px - x)) - 0.35, [x - 7, y - 4, sz - 7], [x + 7, y + 4, sz + 7]), 'crevice', { where: b.isMat('bone') });
  // the snout over the fist, past the knuckles, and the mouth at its end
  const snoutEnd = wy - 9.6;
  b.add('hand.R', blend(1.4,
    ellipsoid([x - 0.6, wy - 1.2, sz + 0.3], [3.6, 3.4, 4.4]),
    capsule([x - 0.5, wy - 2, sz + 0.3], [x - 0.6, snoutEnd + 1.2, sz + 0.4], 3.5, 2.7)), 'bone');
  b.carve('hand.R', box([x + 0.9, snoutEnd + 0.4, sz + 0.4], [1.8, 1.6, 2.2]));
  b.paint('hand.R', box([x + 0.6, snoutEnd + 1.6, sz + 0.4], [2.1, 1.2, 2.5]), 'socket', { where: b.isMat('bone') });
  // the eyes: deep sockets on the dome, toward the wrist, a gold glint deep in each
  for (const k of [-1, 1]) {
    const e: V3 = [x - 4.2, wy + 2.6, sz + k * 2.6];
    b.carve('forearm.R', ellipsoid(e, [1.5, 1.4, 1.3]));
    b.paint('forearm.R', ellipsoid(e, [2.3, 2.2, 2]), 'socket', { where: b.isMat('bone') });
    b.add('forearm.R', sphere([e[0] + 0.7, e[1], e[2]], 0.7), 'ember');
    b.add('forearm.R', capsule([x - 4.8, wy + 4.6, sz + k * 0.9], [x - 4.4, wy + 3.8, sz + k * 4.2], 0.95, 0.8), 'bone');
  }
  // nostrils on the snout's top and the ridge down its middle
  for (const k of [-1, 1]) b.paint('hand.R', sphere([x - 3.2, snoutEnd + 2.6, sz + 0.4 + k * 1.1], 0.6), 'socket', { where: b.isMat('bone') });
  b.add('hand.R', capsule([x - 3.7, wy - 1, sz + 0.3], [x - 3.1, snoutEnd + 3, sz + 0.4], 0.8, 0.6), 'bone');
  // the fangs at the mouth's corners, down past the opening toward the palm
  for (const k of [-1, 1]) b.add('hand.R', spike([x + 1.4, snoutEnd + 1.2, sz + 0.4 + k * 2.2], [0.45, -1, 0], 3, 0.9, 0.6, { tip: 0.3 }), 'bone', { thr: 0.25 });
  // the red fur ruff round its base, standing up and out over the elbow
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const dx = Math.cos(a), dz = Math.sin(a);
    b.add('forearm.R', spike([x + dx * 3.2, ey - 2.6, sz + dz * 3.2], [dx * 0.6, 0.9, dz * 0.6], 3.6 + (i % 3) * 0.7, 1.5, 1, { tip: 0.3 }), 'ruff', { thr: 0.3 });
  }
  b.add('forearm.R', subtract(cylinder([x, ey - 3.6, sz], [x, ey - 1.2, sz], 4.4), cylinder([x, ey - 4, sz], [x, ey, sz], 2.6)), 'ruff', { thr: 0.25 });
  // the tail's root: three vertebrae trailing back from the skull over the elbow
  for (let i = 0; i < 3; i++) b.add('forearm.R', blend(0.6, sphere([x - 2.2 - i * 0.2, ey - 1 + i * 2.2, sz - 2.6 - i * 0.6], 1.3), spike([x - 2.4 - i * 0.2, ey - 1 + i * 2.2, sz - 2.8 - i * 0.6], [-0.6, 0.3, -0.7], 1.8, 0.7, 0.5, { tip: 0.3 })), 'bone', { thr: 0.25 });
}

/** The cowl: a great mass of green fur over the left shoulder, tufts falling over the arm, a round bone disk on top. */
function cowl(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const mass = blend(2, ellipsoid([sx - 0.5, sy + 1.8, sz - 0.8], [7.8, 5.8, 8.2]), ellipsoid([sx + 1.6, sy - 2.4, sz - 0.4], [6, 5.4, 6.6]), ellipsoid([sx - 2, sy - 1, sz - 5], [5.5, 6, 3.6]));
  b.add('shoulder.L', intersect(mass, aabb([2, sy - 1.5, -20], [30, 100, 20])), 'green', { thr: 0.3 });
  b.add('upperarm.L', intersect(mass, aabb([2, 0, -20], [30, sy - 1.5, 20])), 'green', { thr: 0.3 });
  // tufts: falling over the arm and down the back, standing up at the collar
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + (i % 2) * 0.13;
    const dx = Math.cos(a), dz = Math.sin(a);
    const base: V3 = [sx + 1 + dx * 6, sy - 1.6 + (i % 3) * 1.1, sz - 0.6 + dz * 6.4];
    const bone = base[1] < sy - 1.5 ? 'upperarm.L' : 'shoulder.L';
    b.add(bone, spike(base, [dx * 0.6, -1, dz * 0.6], 4.4 + (i % 3) * 1.6, 2.1, 1.3, { tip: 0.3, bend: [dx * 0.1, 0, dz * 0.1] }), 'green', { thr: 0.3 });
  }
  // tufts on top, ruffled up and back
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    b.add('shoulder.L', spike([sx - 0.5 + Math.cos(a) * 3.6, sy + 5.2, sz - 0.8 + Math.sin(a) * 3.8], [Math.cos(a) * 0.5, 0.7, Math.sin(a) * 0.5 - 0.3], 2.8, 1.7, 1.1, { tip: 0.3 }), 'green', { thr: 0.3 });
  }
  for (let i = 0; i < 5; i++) b.add('shoulder.L', spike([sx - 4 + i * 1.6, sy + 5 - Math.abs(i - 2) * 0.4, sz - 3.4], [-0.2 + i * 0.12, 1, -0.5], 3.2, 1.6, 1, { tip: 0.3 }), 'green', { thr: 0.3 });
  // the bone disk on top, tilted up and back: the jet nozzle
  const dc: V3 = [sx + 0.8, sy + 7.2, sz - 2.6];
  const dn: V3 = [0.25, 0.8, -0.55];
  b.add('shoulder.L', cylinder([dc[0] - dn[0] * 0.9, dc[1] - dn[1] * 0.9, dc[2] - dn[2] * 0.9], [dc[0] + dn[0] * 0.9, dc[1] + dn[1] * 0.9, dc[2] + dn[2] * 0.9], 3.9, 3.9, 0.6), 'bone');
  b.carve('shoulder.L', cylinder([dc[0] + dn[0] * 0.2, dc[1] + dn[1] * 0.2, dc[2] + dn[2] * 0.2], [dc[0] + dn[0] * 2, dc[1] + dn[1] * 2, dc[2] + dn[2] * 2], 1.4));
  b.paint('shoulder.L', cylinder([dc[0] - dn[0] * 0.6, dc[1] - dn[1] * 0.6, dc[2] - dn[2] * 0.6], [dc[0] + dn[0] * 0.6, dc[1] + dn[1] * 0.6, dc[2] + dn[2] * 0.6], 2.1), 'nozzle', { where: b.isMat('bone') });
  b.socket('nozzle', 'shoulder.L', [dc[0] + dn[0] * 1.2, dc[1] + dn[1] * 1.2, dc[2] + dn[2] * 1.2]);
}

/** The armoured collar: bone plates round the neck and a pauldron of three plates over the bare right shoulder. */
function collar(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ring = subtract(cylinder([0, s.chinY - 7, -0.8], [0, s.chinY - 2.2, -0.8], 6.2, 4.9), cylinder([0, s.chinY - 8, -0.8], [0, s.chinY - 1, -0.8], 4.1, 3.6));
  b.add('chest', intersect(ring, fn((x, y, z) => -(z + 0.8) * 0.2 - x * 0.15 - 1.8, [-12, 50, -12], [12, 80, 12])), 'bone');
  b.add('chest', intersect(ring, fn((x, y, z) => Math.abs(x) - 4.2 - (z > 0 ? 3 : 0), [-12, 50, -12], [12, 80, 12])), 'bone');
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.paint('chest', capsule([Math.sin(a) * 4, s.chinY - 7.5, Math.cos(a) * 4 - 0.8], [Math.sin(a) * 7, s.chinY - 1.5, Math.cos(a) * 7 - 0.8], 0.4), 'crevice', { where: b.isMat('bone') });
  }
  for (let i = 0; i < 3; i++) {
    const y = sy + 2 - i * 2.4;
    b.add('upperarm.R', intersect(ellipsoid([-sx - 0.8 - i * 0.4, y, sz], [4.6 - i * 0.3, 2.6, 4.9 - i * 0.3]), fn((px, py) => (y - 1.2) - py + 0.3 * (px + sx), [-30, 40, -20], [0, 90, 20])), 'bone');
    b.paint('upperarm.R', fn((px, py, pz) => Math.abs(py - (y - 0.9)) - 0.35, [-30, y - 3, -20], [0, y + 1, 20]), 'crevice', { where: b.isMat('bone') });
  }
}

/**
 * The vertebral tail round the waist like a sash (slung low toward the left hip) and three vertebral cords hanging
 * from it, each on a spring bone.
 */
function tailSash(b: ModelBuilder, L: Landmarks): SpringDef[] {
  const s = L.spec;
  const rx = s.waist[0] + 3, rz = s.waist[1] + 3;
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const y = s.waistY - 5 - 2.4 * Math.sin(a);
    const p: V3 = [Math.sin(a) * rx, y, Math.cos(a) * rz - 0.3];
    const t: V3 = [Math.cos(a) * rx, 0.9 * Math.cos(a), -Math.sin(a) * rz];
    const tl = Math.hypot(...t);
    const d: V3 = [t[0] / tl, t[1] / tl, t[2] / tl];
    b.add('hips', blend(0.6,
      cylinder([p[0] - d[0] * 1.1, p[1] - d[1] * 1.1, p[2] - d[2] * 1.1], [p[0] + d[0] * 1.1, p[1] + d[1] * 1.1, p[2] + d[2] * 1.1], 1.9),
      spike(p, [Math.sin(a) * 0.5, 1, Math.cos(a) * 0.5], 2.8, 1.2, 0.7, { tip: 0.3 }),
      spike(p, [Math.sin(a), -0.4, Math.cos(a)], 2.4, 0.9, 0.6, { tip: 0.3 })), 'bone', { thr: 0.25 });
    b.paint('hips', sphere([p[0] + d[0] * 1.3, p[1] + d[1] * 1.3, p[2] + d[2] * 1.3], 1.1), 'crevice', { where: b.isMat('bone') });
  }
  const springs: SpringDef[] = [];
  const cords: [string, V3, number][] = [['cord.0', [-8.4, s.waistY - 4.4, 3], 15], ['cord.1', [8.6, s.waistY - 7, -2.6], 17], ['cord.2', [-1.6, s.waistY - 5.2, -7.6], 13]];
  for (const [name, at, len] of cords) {
    b.bone(name, 'hips', at);
    for (let j = 0; j < len / 1.9; j++) {
      const y = at[1] - 0.8 - j * 1.9;
      b.add(name, j % 2 ? sphere([at[0], y, at[2]], 1.3) : blend(0.5, cylinder([at[0], y + 0.8, at[2]], [at[0], y - 0.8, at[2]], 1.5, 1.3, 0.3), spike([at[0], y, at[2]], [at[0] > 0 ? 1 : -1, -0.3, 0.2], 1.8, 0.7, 0.5, { tip: 0.3 })), 'bone', { thr: 0.25 });
    }
    springs.push({ bone: name, tail: [0, -len / RENJI_RES, 0], stiffness: 44, damping: 5, gravity: 10, limit: 60, radius: 0.04 });
  }
  return springs;
}

// ---------------------------------------------------------------------------------------------- props

function steelMats(b: ModelBuilder, hot: boolean): void {
  if (hot) {
    b.mat('steel', ['#FFD27A', '#FFAA3A', '#FF7A24', '#E2481A'], { base: 1, rough: 0.3, glow: 1.6 });
    b.mat('edge', ['#FFF0B8'], { glow: 2.6 });
    b.mat('spine', ['#E2481A', '#B8300F'], { base: 0, glow: 1.2 });
  } else {
    b.mat('steel', ['#E2E5E9', '#CDD1D6', '#A9AEB5', '#8B9096'], { base: 1, rough: 0.2, metal: 0.9, shadeK: 0.6 });
    b.mat('edge', ['#EEF1F4'], { rough: 0.12, metal: 0.8 });
    b.mat('spine', ['#9AA0A7', '#7C8189'], { base: 0, rough: 0.3, metal: 0.85 });
  }
}

/**
 * The blade that slides out of the skull's mouth (48 vox/m; prop frame: origin at the grip, the blade down −Y, its
 * edge toward +Z). Sōō: a broad straight blade with a clipped point. Orochiō: longer and wider, its edge cut into big
 * hooked saw teeth, an arrowhead point; red-hot, it glows from within.
 */
function buildMouthBlade(orochi: boolean, hot: boolean): VoxelModel {
  const b = new ModelBuilder(orochi ? (hot ? 'orochio-hot' : 'orochio') : 'soo-blade', 48);
  steelMats(b, hot);
  b.bone('root', null, [0, 0, 0]);
  const y0 = -3, y1 = (orochi ? OROCHIO_TIP[1] : SOO_BLADE_TIP[1]) * 48;
  const len = y0 - y1;
  const w0 = orochi ? 3.4 : 2.4, w1 = orochi ? 4.2 : 2.7;
  const th = orochi ? 0.75 : 0.6;
  b.add('root', fn((x, y, z) => {
    if (y > y0 + 0.5 || y < y1 - 0.5) return 1;
    const u = (y0 - y) / len;
    const w = w0 + (w1 - w0) * u;
    let lo = -w, hi = w;
    if (orochi) {
      // the arrowhead: both sides close to the point over the last 12 %
      if (u > 0.88) {
        const k = (u - 0.88) / 0.12;
        hi = w * (1 + 0.35 * Math.sin(k * Math.PI)) * (1 - k);
        lo = -w * (1 + 0.35 * Math.sin(k * Math.PI)) * (1 - k);
      }
    } else if (u > 0.8) {
      // the clipped point: the edge side cut away toward the spine
      hi = w - ((u - 0.8) / 0.2) * w * 1.6;
      if (u > 0.94) lo = -w * (1 - (u - 0.94) / 0.06);
    }
    return Math.max(Math.abs(x) - th * (1 - 0.5 * Math.max(0, (z - lo) / (hi - lo + 1e-6) - 0.6)), lo - z, z - hi, y - y0, y1 - y);
  }, [-2, y1 - 1, -8], [2, y0 + 1, 8]), 'steel', { thr: 0.3 });
  if (orochi) {
    // the saw teeth along the edge, hooked back toward the hilt, and a few short ones on the spine
    for (let y = y0 - 5; y > y1 + len * 0.14; y -= 5.2) {
      const u = (y0 - y) / len;
      const w = w0 + (w1 - w0) * u;
      b.add('root', spike([0, y, w - 0.4], [0, 0.55, 1], 3.2 + u * 1.2, 0.7, 1.9, { side: [1, 0, 0], tip: 0.25 }), 'steel', { thr: 0.25 });
    }
    for (let y = y0 - 8; y > y1 + len * 0.3; y -= 10.4) b.add('root', spike([0, y, -w0 + 0.2], [0, 0.5, -1], 2.2, 0.6, 1.3, { side: [1, 0, 0], tip: 0.25 }), 'spine', { thr: 0.25 });
  }
  // the edge bright along the +Z side, a dark line down the spine
  b.paint('root', fn((x, y, z) => {
    const u = (y0 - y) / len;
    const w = w0 + (w1 - w0) * u;
    return (w - 0.9) - z;
  }, [-2, y1 - 1, -8], [2, y0 + 1, 12]), 'edge', { where: b.isMat('steel') });
  b.paint('root', fn((x, y, z) => z + (w0 - 0.6), [-2, y1 - 1, -8], [2, y0 + 1, 8]), 'spine', { where: b.isMat('steel') });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** One vertebra of the tail on its tether (48 vox/m): a spool along +Z with a spine plate on top and two side picks. */
function buildTailVertebra(): VoxelModel {
  const b = new ModelBuilder('soo-vertebra', 48);
  boneMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', blend(0.8, cylinder([0, 0, -2], [0, 0, 2], 2, 2, 0.6), sphere([0, 0, 0], 2.4)), 'bone');
  b.add('root', spike([0, 1.8, 0], [0, 1, -0.4], 2.6, 1.3, 0.6, { side: [0, 0, 1], tip: 0.3 }), 'bone', { thr: 0.25 });
  for (const k of [-1, 1]) b.add('root', spike([k * 1.8, -0.6, 0.4], [k, -0.5, 0.4], 2.2, 0.9, 0.5, { tip: 0.3 }), 'bone', { thr: 0.25 });
  b.paint('root', cylinder([0, 0, -0.4], [0, 0, 0.4], 3), 'crevice', { where: b.isMat('bone') });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** Hihiō's colours: bone and the green fur (16 vox/m). */
function hihioMats(b: ModelBuilder): void {
  boneMats(b);
  b.mat('green', ['#A6CBAA', '#83AE8C', '#6F9E7C', '#5A8768', '#4C7559', '#3B5D46'], { base: 2, rough: 0.95, shadeK: 0.9, dither: 0.12 });
  b.mat('nozzle', ['#3A2A22', '#2A1E18']);
}

/** the finger bones of a giant hand: phalanges from the knuckle along `dirs`, knobs at the joints */
function finger(b: ModelBuilder, bone: string, from: V3, segs: [V3, number][], r: number): void {
  let p = from;
  for (const [d, len] of segs) {
    const l = Math.hypot(...d);
    const q: V3 = [p[0] + (d[0] / l) * len, p[1] + (d[1] / l) * len, p[2] + (d[2] / l) * len];
    b.add(bone, capsule(p, q, r, r * 0.85), 'bone', { thr: 0.25 });
    b.add(bone, sphere(p, r * 1.25), 'bone');
    p = q;
    r *= 0.85;
  }
  b.add(bone, sphere(p, r * 1.1), 'bone');
}

/**
 * The hand of Hihiō (16 vox/m): carpals, four long metacarpals, three-jointed fingers and the thumb, hanging from the
 * wrist at y −42 (the palm toward −X, the thumb toward +Z, as his left hand hangs). Open (fingers straight down) or a
 * fist (curled in toward the palm, the thumb across).
 */
function giantHand(b: ModelBuilder, bone: string, fist: boolean, wy = -42): void {
  b.add(bone, box([-0.2, wy - 2.8, 0.2], [2.4, 3, 5.8], { round: 1.6 }), 'bone');
  const zs = [-4.6, -1.5, 1.5, 4.4];
  zs.forEach((z, i) => {
    const ky = wy - 9.5 + Math.abs(i - 1.5) * 0.6;
    b.add(bone, capsule([-0.2, wy - 3.5, z * 0.8], [-0.4, ky, z], 1.5, 1.25), 'bone', { thr: 0.25 });
    if (fist) finger(b, bone, [-0.4, ky, z], [[[-1, -0.35, 0], 4.2], [[-0.35, 1, 0], 3.5], [[0.6, 1, 0], 2.6]], 1.6);
    else finger(b, bone, [-0.4, ky, z], [[[-0.12, -1, 0.03 * z], 5], [[-0.25, -1, 0], 4], [[-0.45, -1, 0], 3.1]], 1.6);
  });
  if (fist) finger(b, bone, [-1.2, wy - 3.5, 5.6], [[[-0.9, -0.6, 0.5], 3.8], [[-0.6, -0.7, -0.7], 3.4]], 1.8);
  else finger(b, bone, [-1.2, wy - 3.5, 5.6], [[[-0.6, -0.8, 0.6], 4.2], [[-0.5, -1, 0.3], 3.4]], 1.8);
  b.socket(fist ? 'fist' : 'palm', bone, fist ? [-2, wy - 11, 0] : [-2.5, wy - 7, 0]);
}

/**
 * Hihiō, the baboon king's arm (16 vox/m, ~3.6 m): a great shoulder of green fur (the cowl grown huge, the bone disk
 * on top: the jet nozzle), a humerus buried in shaggy fur, the bare radius and ulna with a cuff of fur at the elbow,
 * and the skeletal hand — open and as a fist. The bones carry his left arm's names (shoulder.L … palm.L / fist.L) so
 * a mirror rig can copy his rotations; the rest pose hangs straight down as his does. Bare: the furless skeleton that
 * tears out of him when his Bankai is drained (Two Kings).
 */
function buildHihio(furred: boolean): VoxelModel {
  const b = new ModelBuilder(furred ? 'hihio-arm' : 'hihio-arm-bare', 16);
  hihioMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.bone('shoulder.L', 'root', [0, 0, 0]);
  b.bone('upperarm.L', 'shoulder.L', [0, 0, 0]);
  b.bone('forearm.L', 'upperarm.L', [0, -22, 0]);
  b.bone('hand.L', 'forearm.L', [0, -42, 0]);
  b.bone('palm.L', 'hand.L', [0, -42, 0]);
  b.bone('fist.L', 'hand.L', [0, -42, 0]);
  // the humerus with its knobbed ends, the radius and ulna, the elbow
  b.add('upperarm.L', blend(1.4, capsule([0, -2, 0], [0, -19.5, 0], 3, 2.6), sphere([0, -1, 0], 4.4), ellipsoid([0, -20.5, 0], [4.6, 3.2, 4.2])), 'bone');
  b.add('forearm.L', blend(1, sphere([0, -22.6, -0.8], 3.8), capsule([0, -23, -2.5], [0, -40.5, -2], 2.4, 1.9), capsule([0, -23, 2.5], [0, -40.5, 2.3], 2.2, 1.8), ellipsoid([0, -40.8, 0.1], [2.8, 1.9, 4.8])), 'bone');
  b.paint('forearm.L', ellipsoid([0, -22.8, -3.2], [2, 2, 1.6]), 'crevice', { where: b.isMat('bone') });
  b.paint('forearm.L', capsule([0, -26, 0], [0, -38, 0.1], 0.8), 'crevice', { where: b.isMat('bone') });
  for (const fist of [false, true]) giantHand(b, fist ? 'fist.L' : 'palm.L', fist);
  if (furred) {
    // the shoulder: the cowl grown huge — a rounded mass of fur over the joint, ruffled on top
    b.add('shoulder.L', blend(2, ellipsoid([0, 2.4, -0.4], [6.6, 6, 6.8]), ellipsoid([1.2, -0.8, 0], [5.6, 4.8, 6])), 'green', { thr: 0.3 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      b.add('shoulder.L', spike([Math.cos(a) * 3.8, 6.6, Math.sin(a) * 3.8 - 0.4], [Math.cos(a) * 0.55, 0.75, Math.sin(a) * 0.55 - 0.25], 3.2, 2, 1.3, { tip: 0.3 }), 'green', { thr: 0.3 });
    }
    // the upper arm: a shaggy sleeve of fur tapering to the elbow, the long hair hanging down and back as an ape's
    b.add('upperarm.L', capsule([0, -2, -0.3], [0, -15, -0.6], 5.8, 4.4), 'green', { thr: 0.3 });
    for (let r = 0; r < 4; r++) {
      const y = -3 - r * 3.6;
      const rad = 5.4 - r * 0.35;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + r * 0.3;
        const dx = Math.cos(a), dz = Math.sin(a);
        const len = 3.6 + ((i * 3 + r) % 4) * 1 + (dz < 0 ? 1.6 : 0);
        b.add('upperarm.L', spike([dx * rad, y, dz * rad - 0.4], [dx * 0.4, -1, dz * 0.4 - 0.25], len, 2, 1.2, { tip: 0.3, bend: [dx * 0.1, 0, -0.08] }), 'green', { thr: 0.3 });
      }
    }
    // a ruff of fur at the elbow, a cuff at the wrist
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const dx = Math.cos(a), dz = Math.sin(a);
      b.add('forearm.L', spike([dx * 3.4, -23.4, dz * 3.6], [dx * 0.55, -1, dz * 0.55], 3.4 + (i % 2) * 1.2, 1.8, 1.1, { tip: 0.3 }), 'green', { thr: 0.3 });
      b.add('forearm.L', spike([dx * 3.2, -38.4, dz * 4.4], [dx * 0.5, -1, dz * 0.5], 2.6 + (i % 3) * 0.6, 1.5, 1, { tip: 0.3 }), 'green', { thr: 0.3 });
    }
    b.add('forearm.L', subtract(cylinder([0, -39.6, 0], [0, -36.6, 0], 4, 4.6), cylinder([0, -40, 0], [0, -36, 0], 2.2, 2.6)), 'green', { thr: 0.3 });
    // the bone disk on top of the shoulder, the jet nozzle in its middle
    b.add('shoulder.L', cylinder([0.6, 8.2, -2.2], [1, 9.8, -3.2], 4.6, 4.6, 0.8), 'bone');
    b.carve('shoulder.L', cylinder([0.9, 9.2, -2.8], [1.2, 11, -3.8], 1.9));
    b.paint('shoulder.L', cylinder([0.7, 8.6, -2.4], [1, 9.6, -3], 2.8), 'nozzle', { where: b.isMat('bone') });
    b.socket('nozzle', 'shoulder.L', [1.1, 10.4, -3.4]);
  } else {
    // bare: the joint of a shoulder blade and a collarbone stub
    b.add('shoulder.L', blend(1, ellipsoid([0, 1, -1.5], [3.6, 5, 2.4]), capsule([0, 2, 0], [-5, 3, 1], 1.4)), 'bone');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint(6);
  return b.build();
}

/** A clump of green fur shed from the cowl (16 vox/m, ~1 m): a heap of tufts. Origin at its base. */
function buildFurClump(): VoxelModel {
  const b = new ModelBuilder('hihi-fur', 16);
  hihioMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.add('root', ellipsoid([0, 3, 0], [7, 4.4, 7]), 'green', { thr: 0.3 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    b.add('root', spike([Math.cos(a) * 4.5, 3.4, Math.sin(a) * 4.5], [Math.cos(a) * 0.6, 0.8 - (i % 3) * 0.4, Math.sin(a) * 0.6], 4 + (i % 3) * 1.2, 2.2, 1.4, { tip: 0.3 }), 'green', { thr: 0.3 });
  }
  b.add('root', spike([0, 5, 0], [0.1, 1, 0.05], 5, 3, 1.8, { tip: 0.3 }), 'green', { thr: 0.3 });
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * One of Hihi Tenshō's giant hands (16 vox/m): a furred forearm rising out of a clump with Hihiō's skeletal hand on
 * top — open (reaching) or closed (gripping). Origin at the forearm's root, the hand up +Y; the palm faces −X.
 */
function buildGiantHand(fist: boolean): VoxelModel {
  const b = new ModelBuilder(fist ? 'hihi-hand-fist' : 'hihi-hand-open', 16);
  hihioMats(b);
  b.bone('root', null, [0, 0, 0]);
  b.bone('hand', 'root', [0, 0, 0]);
  // built hanging, as in Hihiō's arm (the forearm down from y 0 to the wrist at −20, the hand below it); the kit turns
  // the prop over so the hand reaches up out of the fur
  b.add('root', blend(0.8, capsule([0, -1, -1.7], [0, -18.5, -1.3], 1.55, 1.25), capsule([0, -1, 1.7], [0, -18.5, 1.6], 1.4, 1.2), ellipsoid([0, -18.6, 0.1], [2.1, 1.4, 3.6])), 'bone');
  b.add('root', capsule([0, 1, 0], [0, -9, 0], 4.8, 3.2), 'green', { thr: 0.3 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const dx = Math.cos(a), dz = Math.sin(a);
    b.add('root', spike([dx * 3.2, -6 - (i % 3) * 1.6, dz * 3.2], [dx * 0.5, -1, dz * 0.5], 4.4, 1.8, 1.1, { tip: 0.3 }), 'green', { thr: 0.3 });
  }
  giantHand(b, 'hand', fist, -20);
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint(6);
  return b.build();
}
