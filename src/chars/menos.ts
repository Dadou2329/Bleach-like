// Menos Grande (Gillian): ~36 m tall black-cloaked giant with a long-nosed white mask, a ring of white
// bone spikes at the collar, thin legs under a jagged robe hem and long white-nailed hands.
// Built at 4 vox/m (bestiary T4) on the humanoid bone names so the shared animation code drives it.
import { ModelBuilder } from '../models/builder';
import { blend, box, capsule, cylinder, ellipsoid, fn, sphere, spike, type V3 } from '../models/sdf';
import type { CharacterAsset } from './ichigo';
import type { ClipDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { Rng } from '../core/rng';

export const MENOS_RES = 4;

export function buildMenos(seed = 3): CharacterAsset {
  const rng = new Rng(seed);
  const b = new ModelBuilder(`menos-${seed}`, MENOS_RES);
  b.mat('robe', ['#2A2A31', '#1E1E24', '#16161B', '#101014'], { base: 1, rough: 0.9, shadeK: 1.1, dither: 0.08 });
  b.mat('bone', ['#F2EEE4', '#E3DDCF', '#CBC3B2', '#A99F8B'], { base: 1, rough: 0.6, shadeK: 1 });
  b.mat('void', ['#050507'], { rough: 1 });
  b.mat('eye', ['#FFD24A'], { glow: 2.2 });
  b.mat('teeth', ['#F4F0E6', '#CFC7B5'], { base: 0 });
  // landmarks (voxels, 144 tall)
  const hipsY = 62, chestY = 100, neckY = 116, headY = 121;
  const sh: V3 = [19, 108, 0];
  const elbow: V3 = [24, 82, 4];
  const wrist: V3 = [26, 58, 8];
  const hip: V3 = [9, 60, 0];
  const knee: V3 = [10, 32, 4];
  const ankle: V3 = [10, 4, 0];
  b.bone('root', null, [0, 0, 0]);
  b.bone('hips', 'root', [0, hipsY, 0]);
  b.bone('spine', 'hips', [0, 80, 0]);
  b.bone('chest', 'spine', [0, chestY, 0]);
  b.bone('neck', 'chest', [0, neckY, 2]);
  b.bone('head', 'neck', [0, headY, 4]);
  b.boneSym('shoulder.L', 'chest', [6, sh[1], 0]);
  b.boneSym('upperarm.L', 'shoulder.L', sh);
  b.boneSym('forearm.L', 'upperarm.L', elbow);
  b.boneSym('hand.L', 'forearm.L', wrist);
  b.boneSym('thigh.L', 'hips', hip);
  b.boneSym('shin.L', 'thigh.L', knee);
  b.boneSym('foot.L', 'shin.L', ankle);
  // mask nose tip: Cero emitter
  b.socket('mouth', 'head', [0, headY + 6, 40]);

  // ---- robe: shoulders → jagged hem; split across chest / spine / hips
  const robe = (y0: number, y1: number) =>
    fn(
      (x, y, z) => {
        // radius grows from the shoulders down; slightly flattened front-back
        const t = Math.max(0, Math.min(1, (112 - y) / (112 - 22)));
        const r = 17 + 18 * Math.pow(t, 1.15);
        const ang = Math.atan2(x, z);
        // vertical folds
        const fold = Math.sin(ang * 9) * 1.1 * t;
        const d = Math.hypot(x, z * 1.15) - (r + fold);
        // jagged hem: long downward points
        const hem = 22 - Math.max(0, Math.sin(ang * 7 + 0.6)) * 12 - Math.max(0, Math.sin(ang * 13 + 2)) * 4;
        return Math.max(d, y - y1, Math.max(y0, hem) - y);
      },
      [-40, y0 - 1, -40],
      [40, y1 + 1, 40],
    );
  b.add('hips', robe(8, 72), 'robe');
  b.add('spine', robe(66, 92), 'robe');
  b.add('chest', blend(4, robe(88, 114), ellipsoid([0, 110, -1], [20, 7, 16])), 'robe');
  // hollow the robe below the waist so the legs move inside it
  b.carve('hips', fn((x, y, z) => Math.max(Math.hypot(x, z * 1.15) - (14 + Math.max(0, 60 - y) * 0.28), y - 58), [-36, 0, -36], [36, 60, 36]));
  // ---- collar of bone spikes
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const len = 9 + rng.range(0, 6) + (Math.cos(a) < -0.3 ? 4 : 0);
    b.add('chest', spike([Math.sin(a) * 13, 112, Math.cos(a) * 11], [Math.sin(a) * 0.9, 0.55 + rng.range(-0.1, 0.25), Math.cos(a) * 0.8], len, 2.6, 2), 'bone', { thr: 0.3 });
  }
  // ---- head: dark hood + long-nosed mask
  b.add('neck', capsule([0, 108, 0], [0, headY + 2, 3], 7), 'robe');
  b.add('head', ellipsoid([0, headY + 10, 3], [9, 13, 10]), 'robe');
  const mask = blend(3,
    ellipsoid([0, headY + 9, 9], [8.5, 15, 6]),
    // long nose
    spike([0, headY + 7, 12], [0, -0.05, 1], 28, 4.2, 3.6, { taper: 1.15, tip: 0.6 }),
    // pointed chin
    spike([0, headY - 2, 9], [0, -1, 0.3], 7, 4.5, 3, { taper: 1.2 }),
  );
  b.add('head', mask, 'bone');
  // eye holes with small glowing pupils
  for (const sx of [-1, 1]) {
    const e: V3 = [sx * 4.2, headY + 13, 13.5];
    b.carve('head', ellipsoid(e, [2.4, 2, 3]));
    b.paint('head', ellipsoid([e[0], e[1], e[2] - 1.5], [3, 2.6, 3.5]), 'void', { where: b.isMat('bone', 'robe') });
    b.add('head', sphere([e[0], e[1] - 0.3, e[2] - 2.2], 0.6), 'eye');
  }
  // mouth slit with teeth under the nose
  const my = headY + 2.5;
  b.carve('head', box([0, my, 14], [5.5, 1.2, 3]));
  b.paint('head', box([0, my, 11.5], [6, 1.8, 1.5]), 'void', { where: b.isMat('bone', 'robe') });
  for (let i = -2; i <= 2; i++) {
    b.add('head', spike([i * 2.2, my + 1.4, 12.5], [0, -1, 0.1], 2.2, 0.9, 0.7), 'teeth', { thr: 0.3 });
    b.add('head', spike([i * 2.2 + 1.1, my - 1.4, 12.5], [0, 1, 0.1], 2, 0.8, 0.6), 'teeth', { thr: 0.3 });
  }
  // ---- arms: long, thin; white hands with long nails
  b.add('upperarm.L', capsule(sh, elbow, 4, 3.2), 'robe', { mirror: true });
  b.add('forearm.L', capsule(elbow, wrist, 3.2, 3), 'robe', { mirror: true });
  b.add('forearm.L', sphere(elbow, 3.4), 'robe', { mirror: true });
  const palm: V3 = [wrist[0] + 0.5, wrist[1] - 4, wrist[2] + 1];
  b.add('hand.L', ellipsoid(palm, [2.4, 4.5, 3.5]), 'bone', { mirror: true });
  for (let i = 0; i < 4; i++) b.add('hand.L', spike([palm[0], palm[1] - 3, palm[2] - 3 + i * 2], [0.1, -1, 0.25], 10 - Math.abs(i - 1.5) * 1.5, 1.1, 0.9, { bend: [0, 0, 0.3], taper: 1.3 }), 'bone', { mirror: true, thr: 0.3 });
  // ---- legs under the robe
  b.add('thigh.L', capsule(hip, knee, 5.5, 4.4), 'robe', { mirror: true });
  b.add('shin.L', capsule(knee, ankle, 4.4, 3.4), 'robe', { mirror: true });
  b.add('shin.L', sphere(knee, 4.2), 'robe', { mirror: true });
  b.add('foot.L', ellipsoid([ankle[0], 2.5, ankle[2] + 4], [4.5, 2.8, 8]), 'robe', { mirror: true });
  for (let i = -1; i <= 1; i++) b.add('foot.L', spike([ankle[0] + i * 2.5, 1.5, ankle[2] + 9], [i * 0.25, -0.2, 1], 5, 1.4, 1.1), 'bone', { mirror: true, thr: 0.3 });
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}

export const MENOS_STANCE: StanceDef = {
  idle: {
    spine: [6, 0, 0], chest: [8, 0, 0], neck: [-6, 0, 0], head: [-8, 0, 0],
    'upperarm.L': [-6, 0, 6], 'upperarm.R': [-6, 0, -6], 'forearm.L': [-12, 0, 0], 'forearm.R': [-12, 0, 0],
  },
  swingL: 0.6,
  swingR: 0.6,
  freqScale: 0.32,
};

const key = (t: number, bones: Record<string, [number, number, number]>, ease?: ClipDef['keys'][number]['ease']) => ({ t, b: bones, ease });

export const MENOS_CLIPS: ClipDef[] = [
  {
    name: 'cero', dur: 3.6, fadeIn: 0.4, fadeOut: 0.6, events: { charge: 0.3, fire: 2.2, end: 3.5 },
    keys: [
      key(0, { chest: [8, 0, 0], neck: [-6, 0, 0], head: [-8, 0, 0] }),
      key(1.4, { spine: [-4, 0, 0], chest: [-6, 0, 0], neck: [-14, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-20, 0, 30], 'upperarm.R': [-20, 0, -30] }, 'out'),
      key(2.2, { spine: [10, 0, 0], chest: [14, 0, 0], neck: [6, 0, 0], head: [4, 0, 0], 'upperarm.L': [-10, 0, 40], 'upperarm.R': [-10, 0, -40] }, 'outExpo'),
      key(3.5, { spine: [12, 0, 0], chest: [16, 0, 0], neck: [6, 0, 0], head: [4, 0, 0], 'upperarm.L': [-10, 0, 38], 'upperarm.R': [-10, 0, -38] }, 'inOut'),
    ],
  },
  {
    name: 'stomp', dur: 2.0, fadeIn: 0.3, fadeOut: 0.5, events: { hit: 1.15 },
    keys: [
      key(0, { 'thigh.R': [0, 0, 0], 'shin.R': [0, 0, 0] }),
      key(0.9, { 'thigh.R': [-55, 0, -6], 'shin.R': [70, 0, 0], 'foot.R': [-10, 0, 0], spine: [-6, 0, 0], chest: [-6, 0, 0], 'upperarm.L': [-20, 0, 25], 'upperarm.R': [-20, 0, -25] }, 'out'),
      key(1.15, { 'thigh.R': [-10, 0, -4], 'shin.R': [12, 0, 0], 'foot.R': [0, 0, 0], spine: [10, 0, 0], chest: [12, 0, 0] }, 'outExpo'),
      key(2.0, { 'thigh.R': [0, 0, 0], 'shin.R': [0, 0, 0], spine: [6, 0, 0], chest: [8, 0, 0] }, 'inOut'),
    ],
  },
  {
    name: 'roar', dur: 2.4, fadeIn: 0.3, fadeOut: 0.5, events: { roar: 0.8 },
    keys: [
      key(0, { chest: [8, 0, 0] }),
      key(0.8, { spine: [-8, 0, 0], chest: [-12, 0, 0], neck: [-14, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-40, 0, 60], 'upperarm.R': [-40, 0, -60] }, 'outBack'),
      key(2.0, { spine: [-6, 0, 0], chest: [-10, 0, 0], neck: [-12, 0, 0], head: [-18, 0, 0], 'upperarm.L': [-38, 0, 58], 'upperarm.R': [-38, 0, -58] }, 'inOut'),
      key(2.4, { spine: [6, 0, 0], chest: [8, 0, 0], neck: [-6, 0, 0], head: [-8, 0, 0], 'upperarm.L': [-6, 0, 6], 'upperarm.R': [-6, 0, -6] }, 'inOut'),
    ],
  },
  {
    name: 'hit_heavy', dur: 1.2, fadeIn: 0.1, fadeOut: 0.4,
    keys: [
      key(0, { chest: [8, 0, 0] }),
      key(0.3, { spine: [-6, 0, 4], chest: [-10, 6, 4], head: [-16, 8, 0] }, 'outExpo'),
      key(1.2, { spine: [6, 0, 0], chest: [8, 0, 0], head: [-8, 0, 0] }, 'inOut'),
    ],
  },
];
