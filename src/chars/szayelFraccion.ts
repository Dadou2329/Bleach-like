// Lumina and Verona, Szayelaporro's Fracción (docs/roster/E2-espada-2.md §4a): very short, very fat near-twins in his
// three-stripe uniform, the same round face with beady eyes and a wide mouth; Lumina wears two black pigtails, Verona
// a short black ponytail. They repeat each other, cheer, panic, slap feebly — and are made to be eaten.
// Brief: ≈ 100 cm (verify) → 48 voxels at 48 vox/m; the head ≈ 1/4 of the height; a belly as wide as they are tall.
import { ModelBuilder } from '../models/builder';
import { aabb, blend, box, capsule, ellipsoid, fn, smoothPath, sphere, tube } from '../models/sdf';
import { faceLegend, head, humanoidSkeleton, type HumanoidSpec, type Landmarks } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

export type FraccionKind = 'lumina' | 'verona';
export const FRACCION_RES = 48;

const SPEC: HumanoidSpec = {
  H: 48,
  chinY: 35,
  head: { w: 11, d: 11, h: 12 },
  neckR: 2.8,
  shoulder: [8.6, 31.5, -0.5],
  upperArm: 7,
  foreArm: 6.5,
  hand: 5,
  armR: 2.3,
  hipsY: 15,
  hip: [4.4, 13, 0],
  kneeY: 7.5,
  ankleY: 2.5,
  chest: [8.6, 7],
  waist: [9.8, 8.2],
  hips: [8.6, 7],
  chestY: 27,
  waistY: 21,
  foot: { len: 7, w: 4.2, heel: 2 },
};

const FACE = [
  '. . . . . . . . . . .',
  '. B B . . . . . B B .',
  '. . . . . . . . . . .',
  '. . W i . . . i W . .',
  '. . . . . . . . . . .',
  '. . . . . s . . . . .',
  '. . m m m m m m m . .',
  '. . m D D D D D m . .',
  '. . . m m m m m . . .',
  '. . . . . . . . . . .',
];

const cache = new Map<FraccionKind, CharacterAsset>();
export function fraccionAsset(kind: FraccionKind): CharacterAsset {
  let a = cache.get(kind);
  if (!a) cache.set(kind, (a = buildFraccion(kind)));
  return a;
}

export function buildFraccion(kind: FraccionKind): CharacterAsset {
  const b = new ModelBuilder(`fraccion-${kind}`, FRACCION_RES);
  b.mat('skin', ['#F8E2D2', '#F0D2BE', '#E0BCA6', '#CCA38C', '#B0866F'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#3A3438', '#2A2528', '#1E1A1D', '#161418'], { base: 1, rough: 0.5, shadeK: 0.85 });
  b.mat('brow', ['#1E1A1D']);
  b.mat('sclera', ['#F3F1EC']);
  b.mat('pupil', ['#1E1A1D']);
  b.mat('mouth', ['#7A3A3E']);
  b.mat('inner', ['#4A1E22']);
  b.mat('white', ['#F3F3F0', '#ECEBE6', '#DAD9D3', '#C2C4C6', '#A6ABB1'], { base: 1, rough: 0.82, shadeK: 0.9 });
  b.mat('stripe', ['#2A2A30', '#1C1C21', '#141418'], { base: 1, rough: 0.8 });
  b.mat('boot', ['#2E2E35', '#1A1A1F', '#141418'], { base: 1, rough: 0.45 });
  b.mat('bone', ['#F1EDE3', '#DCD8CE', '#BDB8AC'], { base: 0, rough: 0.42 });
  const s = SPEC;
  const L = humanoidSkeleton(b, s);
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 3, L.wrist[2] + 0.4]);
  b.socket('palm.L', 'palm.L', [L.wrist[0] - 0.4, L.wrist[1] - 3.4, L.wrist[2] + 0.8]);
  b.socket('back', 'chest', [0, s.chestY, -8]);
  const hd = head(b, L, 'skin');
  // round, puffy cheeks
  b.add('head', blend(1.6, ellipsoid([0, s.chinY + 3.5, L.headC[2] + 1], [6.4, 4.8, 5.4])), 'skin', { only: 'empty' });
  b.carve('head', aabb([-8, s.chinY - 2, hd.front], [8, s.chinY + 14, hd.front + 6]));
  b.stamp('head', hd.x0 - 0.5, hd.chin + 9, FACE, { ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'brow', sclera: 'sclera', iris: 'pupil', pupil: 'pupil', hi: 'sclera', mouth: 'mouth', inner: 'inner' }) }, hd.front - 1);
  hair(b, L, hd, kind);
  body(b, L);
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}

function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, kind: FraccionKind): void {
  const s = L.spec;
  const c = hd.chin;
  const cz = L.headC[2] - 0.6;
  // a cap of black hair, a straight fringe low on the forehead
  b.add('head', fn((x, y, z) => {
    const e = Math.hypot(x / 7.0, (y - (c + 8)) / 7.4, (z - cz) / 7.0) - 1;
    return Math.max(e * 6, c + 6.5 - y + Math.max(0, z - cz - 3) * 0.6);
  }, [-9, c + 3, cz - 9], [9, c + 16, cz + 9]), 'hair', { only: 'empty' });
  b.paint('head', fn((x, y, z) => Math.max(Math.abs(((x * 1.2 + 40) % 1.6) - 0.8) - 0.2, c + 6.5 - y, cz + 2 - z), [-9, c + 5, cz - 9], [9, c + 16, cz + 9]), 'hair', { shade: 3, where: b.isMat('hair') });
  if (kind === 'lumina') {
    // two pigtails hanging behind the ears
    for (const k of [-1, 1]) {
      const p = smoothPath([[k * 6, c + 9, cz - 2], [k * 8, c + 6, cz - 3], [k * 8.4, c + 1, cz - 3.5], [k * 7.6, c - 3, cz - 3]], 4);
      b.add('head', tube(p, p.map((_, i) => 2.2 - i * 0.08)), 'hair', { thr: 0.25 });
      b.add('head', sphere([k * 6.6, c + 9, cz - 2], 1.3), 'bone');
    }
  } else {
    // a short ponytail at the back
    const p = smoothPath([[0, c + 10, cz - 6], [0, c + 8, cz - 9], [0, c + 4, cz - 9.6]], 4);
    b.add('head', tube(p, p.map((_, i) => 2.4 - i * 0.12)), 'hair', { thr: 0.25 });
    b.add('head', sphere([0, c + 10, cz - 6.4], 1.4), 'bone');
  }
}

function body(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  // the belly: one round mass from the chest to the hips, the uniform tight over it
  const belly = blend(3, ellipsoid([0, 22, 1.4], [10.4, 10, 9.4]), ellipsoid([0, 29, 0], [8.8, 5, 7]), sphere([sx - 1, sy - 0.5, sz], 3.2), sphere([-sx + 1, sy - 0.5, sz], 3.2));
  b.add('hips', fn((x, y, z) => Math.max(belly.d(x, y, z), y - 18), [-14, 8, -14], [14, 19, 14]), 'white');
  b.add('spine', fn((x, y, z) => Math.max(belly.d(x, y, z), 18 - y, y - 25), [-14, 17, -14], [14, 26, 14]), 'white');
  b.add('chest', fn((x, y, z) => Math.max(belly.d(x, y, z), 24 - y), [-14, 23, -14], [14, 38, 14]), 'white');
  // the three stripes from the collar
  for (const [x0, x1] of [[0, 0], [-3, -5.5], [3, 5.5]] as [number, number][])
    b.paint(['chest', 'spine', 'hips'], capsule([x0, 33, 6.5], [x1, 12, 9.6], 0.6), 'stripe', { where: b.isMat('white') });
  b.add('chest', ellipsoid([0, 32.5, -0.5], [4.4, 1.6, 4.0]), 'white');
  // stubby arms, white gloves
  b.add('upperarm.L', capsule([sx, sy - 0.5, sz], [sx + 0.5, ey, sz], 2.6, 2.4), 'white', { mirror: true });
  b.add('forearm.L', capsule([sx + 0.5, ey, sz], [sx + 0.5, wy + 0.5, sz], 2.4, 2.1), 'white', { mirror: true });
  for (const side of ['palm.L', 'fist.L']) b.add(side, sphere([sx + 0.5, wy - 2, sz + 0.5], 2.3), 'white', { mirror: true });
  // short legs, boots
  const [hx, hy] = s.hip;
  b.add('thigh.L', capsule([hx, hy, 0], [hx, L.knee[1], 0], 3.4, 3.0), 'white', { mirror: true });
  b.add('shin.L', capsule([hx, L.knee[1], 0], [hx, L.ankle[1] + 1, 0], 2.9, 2.5), 'white', { mirror: true });
  b.add('foot.L', blend(1, capsule([hx, L.ankle[1] + 1.5, -0.3], [hx, 1.2, 0], 2.4), box([hx, 1.3, 2.2], [2.2, 1.3, 3.2], { round: 1 })), 'boot', { mirror: true });
}

// ---------------------------------------------------------------------------------------------- clips

type B = NonNullable<KeyDef['b']>;
const body0 = (t: number, b: B, hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
const IDLE: B = {
  hips: [0, 0, 0], spine: [-4, 0, 0], chest: [-4, 0, 0], head: [-4, 0, 0],
  'upperarm.L': [-10, 0, 26], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-10, 0, -26], 'forearm.R': [-30, 0, 0],
  'thigh.L': [0, 0, 8], 'thigh.R': [0, 0, -8],
};
export const FRACCION_STANCE: StanceDef = {
  idle: IDLE,
  run: { 'upperarm.L': [-30, 0, 40], 'upperarm.R': [-30, 0, -40], spine: [6, 0, 0] },
  swingL: 1.2,
  swingR: 1.2,
};
const slap: ClipDef = {
  name: 'lv_slap', dur: 0.5, fadeIn: 0.05, fadeOut: 0.16,
  events: { hit: 0.18 },
  keys: [
    body0(0, IDLE),
    body0(0.1, { ...IDLE, chest: [-6, -20, 0], 'upperarm.R': [-60, 0, -70], 'forearm.R': [-60, 0, 0] }, [0, 0, 0], 'out'),
    body0(0.18, { ...IDLE, chest: [4, 24, 0], 'upperarm.R': [-90, 0, 10], 'forearm.R': [-10, 0, 0] }, [0, -0.02, 0.05], 'outExpo'),
    body0(0.5, IDLE, [0, 0, 0], 'inOut'),
  ],
};
const bump: ClipDef = {
  name: 'lv_bump', dur: 0.6, fadeIn: 0.05, fadeOut: 0.18,
  events: { hit: 0.24 },
  keys: [
    body0(0, IDLE),
    body0(0.14, { ...IDLE, spine: [-16, 0, 0], chest: [-10, 0, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [30, 0, 0] }, [0, -0.05, -0.05], 'out'),
    body0(0.24, { ...IDLE, spine: [-20, 0, 0], chest: [-12, 0, 0], 'upperarm.L': [10, 0, 50], 'upperarm.R': [10, 0, -50] }, [0, 0, 0.18], 'outExpo'),
    body0(0.6, IDLE, [0, 0, 0], 'inOut'),
  ],
};
/** cheering for him, both arms up */
const cheer: ClipDef = {
  name: 'lv_cheer', dur: 0.8, fadeIn: 0.08, fadeOut: 0.2,
  keys: [
    body0(0, IDLE),
    body0(0.2, { ...IDLE, 'upperarm.L': [-160, 0, 20], 'upperarm.R': [-160, 0, -20], 'forearm.L': [-10, 0, 0], 'forearm.R': [-10, 0, 0], head: [-10, 0, 0] }, [0, 0.06, 0], 'out'),
    body0(0.4, { ...IDLE, 'upperarm.L': [-140, 0, 30], 'upperarm.R': [-140, 0, -30], head: [-6, 0, 0] }, [0, 0, 0], 'inOut'),
    body0(0.6, { ...IDLE, 'upperarm.L': [-160, 0, 20], 'upperarm.R': [-160, 0, -20], head: [-10, 0, 0] }, [0, 0.06, 0], 'inOut'),
    body0(0.8, IDLE, [0, 0, 0], 'inOut'),
  ],
};
/** grabbed and lifted to be eaten: kicking, arms flailing */
const struggle: ClipDef = {
  name: 'lv_struggle', dur: 0.4, fadeIn: 0.05, fadeOut: 0.2, loop: true,
  keys: [
    body0(0, { ...IDLE, 'upperarm.L': [-120, 0, 40], 'upperarm.R': [-60, 0, -50], 'thigh.L': [-30, 0, 8], 'thigh.R': [10, 0, -8], head: [-14, 0, 0] }),
    body0(0.2, { ...IDLE, 'upperarm.L': [-60, 0, 50], 'upperarm.R': [-120, 0, -40], 'thigh.L': [10, 0, 8], 'thigh.R': [-30, 0, -8], head: [-14, 0, 0] }, undefined, 'inOut'),
    body0(0.4, { ...IDLE, 'upperarm.L': [-120, 0, 40], 'upperarm.R': [-60, 0, -50], 'thigh.L': [-30, 0, 8], 'thigh.R': [10, 0, -8], head: [-14, 0, 0] }, undefined, 'inOut'),
  ],
};
export const FRACCION_CLIPS: ClipDef[] = [...ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name)), slap, bump, cheer, struggle];

