// Tōshirō Hitsugaya's Complete Bankai (完全卍解) — the adult he becomes when the last petal falls (TYBW, vs Gerard;
// docs/roster/B3-captains-3.md §Hitsugaya, look "Complete Bankai", and docs/kits/hitsugaya.md). Brief: no official
// height — a tall, lanky young man who passes for his own older brother: 175 cm → 84 vox at 48/m on a narrower adult
// frame. The same white spikes grown long, a sharper, older face with the turquoise eyes; the captain's black
// shihakushō, the sleeveless white haori with 十, the green sash with its star clip; ice plating on the shoulders, the
// forearms, the knees and shins, and over the shoes (clawed); no wings, tail or petals — thin wings of ice come and
// go (the `adultWings` prop on the 'back' socket). The sword is Hyōrinmaru's Bankai blade at an adult's scale.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { blend, capsule, ellipsoid, spike, type V3 } from '../models/sdf';
import { SPEC_ADULT_MALE, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, type HumanoidSpec, type Landmarks } from './humanoid';
import { hair, haori, palette, sash } from './hitsugaya';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

const RES = 48;

/** lanky: the adult bones, a narrow chest and waist */
const SPEC_ADULT: HumanoidSpec = { ...SPEC_ADULT_MALE, shoulder: [9.2, 66.5, -0.5], chest: [7.9, 4.6], waist: [6.4, 4], hips: [7, 4.4], armR: 2.4, neckR: 2.4 };

/** The older face: straight brows low over narrower turquoise eyes, a firm mouth. Rows 9 → 0. */
const ADULT_FACE = [
  '. . . . . . . . . .',
  '. B B B . . B B B .',
  '. . . B . . B . . .',
  '. L L L . . L L L .',
  '. W I i . . i I W .',
  '. . * . . . . * . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

let cached: CharacterAsset | null = null;

export function hitsugayaAdultAsset(): CharacterAsset {
  return (cached ??= buildHitsugayaAdult());
}

export function buildHitsugayaAdult(): CharacterAsset {
  const b = new ModelBuilder('hitsugaya-adult', RES);
  palette(b);
  const s = SPEC_ADULT;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('finger.L', 'palm.L', [wx - 0.2, wy - s.hand - 0.5, wz + 1]);
  b.socket('back', 'chest', [0, s.chestY + 1, -s.chest[1] - 2]);
  b.socket('chest.front', 'chest', [0, s.chestY, 6]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.stamp('head', hd.x0, hd.chin + 9, ADULT_FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd, true);
  hands(b, L, 'skin');
  feet(b, L, 'tabi', 'straw', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', hemR: 8.4, bag: 3.4 };
  const torso = kosodeTorso(b, L, o);
  kosodeSleeves(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  const coat = haori(b, L, torso, RES, 10);
  sash(b, L, torso);
  plating(b, L);
  b.autoShade();
  b.lint();
  const springs: SpringDef[] = [];
  for (const side of ['L', 'R']) {
    springs.push({ bone: `sleeve.${side}`, tail: [0, -12 / RES, -3 / RES], stiffness: 40, damping: 5, gravity: 10, limit: 95, radius: 0.05 });
    springs.push({ bone: `hakama.${side}`, tail: [0, -22 / RES, 0], stiffness: 72, damping: 6, gravity: 8, limit: 55, radius: 0.1 });
  }
  const colliders: ColliderDef[] = [{ bone: 'shin.L', offset: [0, -0.12, 0], radius: 0.07 }, { bone: 'shin.R', offset: [0, -0.12, 0], radius: 0.07 }];
  return { model: b.build(), springs: [...springs, ...coat.springs], colliders: [...colliders, ...coat.colliders], warnings: b.warnings };
}

/** Ice over the shoulders, the forearms, the knees and shins, and the shoes (three claws at the toe, one at the heel). */
function plating(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const shard = (base: V3, dir: V3, len: number, r: number, flat = 0.55) => spike(base, dir, len, r, r * flat, { tip: 0.25, taper: 1 });
  for (const k of [1, -1]) {
    const up = k > 0 ? 'upperarm.L' : 'upperarm.R';
    const fo = k > 0 ? 'forearm.L' : 'forearm.R';
    const sh = k > 0 ? 'shin.L' : 'shin.R';
    const ft = k > 0 ? 'foot.L' : 'foot.R';
    const x = k * sx;
    // the shoulder: a pauldron of ice sitting over the sleeve and the haori, three blades raking back and out
    b.add(up, blend(1, ellipsoid([x + k * 1.6, sy + 2.2, sz], [5.2, 3.3, 5.6]), shard([x + k * 2.2, sy + 3.8, sz - 1.4], [k * 0.6, 0.8, -0.6], 8.5, 2.1), shard([x + k * 4.6, sy + 1.8, sz], [k * 1, 0.3, -0.3], 7.5, 1.9), shard([x + k * 1.8, sy + 2.6, sz - 4.2], [k * 0.3, 0.4, -1], 7, 1.8)), 'ice', { thr: 0.3 });
    b.paint(up, capsule([x + k * 1.4, sy + 5.4, sz + 3], [x + k * 5.8, sy + 2.2, sz + 1.6], 0.6), 'iceDeep', { where: b.isMat('ice') });
    // the forearm: a bracer over the sleeve's end, a fin along the outside
    b.add(fo, blend(1, capsule([x, ey - 2, sz], [x, wy + 2.5, sz], 3.6, 3.1), shard([x + k * 2.8, ey - 3, sz - 0.5], [k * 0.7, 0.8, -0.3], 6, 1.4)), 'ice', { thr: 0.3 });
    // the knee and shin: a greave with a spike at the knee
    const hx = k * s.hip[0];
    b.add(sh, blend(1, capsule([hx, L.knee[1] - 1, 0.6], [hx, L.ankle[1] + 3, 0.6], 3.3, 2.9), shard([hx, L.knee[1], 2.4], [0, 0.6, 0.9], 4, 1.5)), 'ice', { thr: 0.3 });
    // the shoes iced over: claws at the toe and the heel
    b.add(ft, ellipsoid([hx, 2.2, L.ankle[2] + 3], [3, 2.4, 5]), 'ice', { thr: 0.3 });
    for (const dx of [-1.6, 0, 1.6]) b.add(ft, shard([hx + dx, 1.6, L.ankle[2] + 6.6], [dx * 0.1, -0.2, 1], 3.6, 1.1, 0.7), 'ice', { thr: 0.3 });
    b.add(ft, shard([hx, 1.6, L.ankle[2] - 2.4], [0, -0.1, -1], 2.8, 1.1, 0.7), 'ice', { thr: 0.3 });
    // a deeper vein down each greave and bracer
    b.paint(sh, capsule([hx, L.knee[1] - 2, 3.4], [hx, L.ankle[1] + 3.5, 3.2], 0.6), 'iceDeep', { where: b.isMat('ice') });
    b.paint(fo, capsule([x + k * 3.2, ey - 3, sz], [x + k * 2.6, wy + 3, sz], 0.6), 'iceDeep', { where: b.isMat('ice') });
  }
}

let wingsModel: VoxelModel | null = null;

/** The thin ice wings of the adult form: two long narrow blades of ice fanned out behind (on the 'back' socket). */
export function adultWings(): VoxelModel {
  return (wingsModel ??= buildWings());
}

function buildWings(): VoxelModel {
  const b = new ModelBuilder('hitsugaya-adult-wings', RES);
  b.mat('ice', ['#CBEFFC', '#A9E2F7', '#86CDEE', '#5DB4E0', '#3A8CC4'], { base: 1, rough: 0.12, metal: 0.1, shadeK: 0.85, glow: 0.45 });
  b.mat('iceDeep', ['#4EA8D9', '#357FB8', '#265F94'], { base: 1, rough: 0.15, glow: 0.35 });
  b.bone('root', null, [0, 0, 0]);
  // the two wings grow out of one root of ice between the shoulder blades
  b.add('root', ellipsoid([0, 0, -1], [3.4, 2.4, 2]), 'ice');
  for (const k of [1, -1]) {
    // a slender arm, three long feathers of ice hanging off it
    b.add('root', capsule([k * 2, 0, -1], [k * 20, 16, -8], 1.6, 1.1), 'ice');
    b.add('root', capsule([k * 20, 16, -8], [k * 38, 14, -12], 1.1, 0.7), 'ice');
    for (let i = 0; i < 4; i++) {
      const u = 0.25 + i * 0.25;
      const p: V3 = [k * (2 + 36 * u), 16 * Math.min(1, u * 1.8) - (u > 0.55 ? (u - 0.55) * 4 : 0), -1 - 11 * u];
      b.add('root', spike(p, [k * (0.25 + u * 0.4), -1, -0.15], 16 + u * 14, 1.7, 0.9, { side: [1, 0, 0], tip: 0.6, taper: 1 }), 'ice', { thr: 0.25 });
      b.paint('root', capsule(p, [p[0] + k * (0.25 + u * 0.4) * 8, p[1] - 9, p[2] - 1.2], 0.55), 'iceDeep', { where: b.isMat('ice') });
    }
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
