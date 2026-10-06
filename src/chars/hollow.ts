// Lesser Hollows: hunched black bodies with white bone masks, a see-through Hollow hole, bone claws and
// spikes. Seeded variation (mask shape, horns, markings, proportions). Built at 24 vox/m (≈2.4-3 m tall)
// on the standard humanoid bone names so locomotion, IK feet and flinches work unchanged.
import { ModelBuilder } from '../models/builder';
import { blend, box, capsule, cylinder, ellipsoid, halfSpace, intersect, sphere, spike, type V3 } from '../models/sdf';
import { Rng } from '../core/rng';
import type { CharacterAsset } from './ichigo';
import type { ClipDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';

export interface HollowStyle {
  seed: number;
  /** overall scale on the base proportions (1 ≈ 2.6 m) */
  size?: number;
  mask?: 'skull' | 'beak' | 'horned' | 'fanged';
  marking?: string;
}

const MARKINGS = ['#B3122E', '#7A1FA2', '#1F5FA2', '#C8701A', '#1C7A4A'];

export function buildHollow(style: HollowStyle): CharacterAsset {
  const rng = new Rng(style.seed);
  const S = style.size ?? 1;
  const res = 24;
  const b = new ModelBuilder(`hollow-${style.seed}`, res);
  const mark = style.marking ?? rng.pick(MARKINGS);
  const maskType = style.mask ?? rng.pick(['skull', 'beak', 'horned', 'fanged'] as const);
  b.mat('hide', ['#3A3A44', '#2A2A32', '#1E1E25', '#141419'], { base: 2, rough: 0.8, shadeK: 1.1, dither: 0.1 });
  b.mat('bone', ['#F4F1E8', '#E7E1D3', '#D2CAB8', '#ADA390'], { base: 1, rough: 0.55, shadeK: 1.1 });
  b.mat('mark', [mark]);
  b.mat('void', ['#060609'], { rough: 1 });
  b.mat('eye', ['#FFE36A'], { glow: 3.5 });
  b.mat('teeth', ['#F3F0E6', '#CFC8B8'], { base: 0 });
  b.mat('gum', ['#3A0E14']);

  const k = (v: number) => v * S;
  // landmarks (voxels at 24/m)
  const hipsY = k(28), chestY = k(41), neckY = k(50), headY = k(54);
  const sh: V3 = [k(9.5), k(47), k(1)];
  const elbow: V3 = [k(12.5), k(34), k(3)];
  const wrist: V3 = [k(13.5), k(21), k(5)];
  const hip: V3 = [k(5), k(27), 0];
  const knee: V3 = [k(6), k(15), k(3)];
  const ankle: V3 = [k(6), k(3), k(-1)];
  b.bone('root', null, [0, 0, 0]);
  b.bone('hips', 'root', [0, hipsY, 0]);
  b.bone('spine', 'hips', [0, k(33), 0]);
  b.bone('chest', 'spine', [0, k(39), k(0.5)]);
  b.bone('neck', 'chest', [0, neckY, k(3)]);
  b.bone('head', 'neck', [0, headY, k(5)]);
  b.boneSym('shoulder.L', 'chest', [k(3), sh[1], sh[2]]);
  b.boneSym('upperarm.L', 'shoulder.L', sh);
  b.boneSym('forearm.L', 'upperarm.L', elbow);
  b.boneSym('hand.L', 'forearm.L', wrist);
  b.boneSym('thigh.L', 'hips', hip);
  b.boneSym('shin.L', 'thigh.L', knee);
  b.boneSym('foot.L', 'shin.L', ankle);
  b.socket('mouth', 'head', [0, headY - k(1), k(13)]);

  // ---- torso: barrel chest, narrow waist, hunched back
  const chest = ellipsoid([0, chestY, k(1)], [k(10), k(8.5), k(7.5)]);
  const belly = ellipsoid([0, k(32), 0], [k(7), k(6), k(5.5)]);
  const pelvis = ellipsoid([0, hipsY, 0], [k(7.5), k(4.5), k(5.5)]);
  const hump = ellipsoid([0, k(46), k(-3)], [k(8), k(5), k(5)]);
  b.add('chest', blend(k(3), chest, hump, sphere(sh, k(5)), sphere([-sh[0], sh[1], sh[2]], k(5))), 'hide');
  b.add('spine', blend(k(3), belly, intersect(chest, halfSpace([0, k(37), 0], [0, 1, 0]))), 'hide');
  b.add('hips', pelvis, 'hide');
  b.add('neck', capsule([0, k(46), k(1)], [0, headY, k(5)], k(3.5)), 'hide');
  // the Hollow hole: straight through the chest, dark inner walls
  const holeC: V3 = [0, chestY - k(1), k(1)];
  const holeR = k(3.2);
  b.paint('chest', cylinder([holeC[0], holeC[1], k(-12)], [holeC[0], holeC[1], k(12)], holeR + 1.2), 'void');
  b.carve('chest', cylinder([holeC[0], holeC[1], k(-12)], [holeC[0], holeC[1], k(12)], holeR));
  // abdominal bone plates
  for (let i = 0; i < 3; i++) b.add('spine', box([0, k(30 + i * 2.6), k(5)], [k(4 - i * 0.6), k(0.9), k(1)], { round: 0.5 }), 'bone');
  // shoulder spikes / bone ridge
  const spikes = rng.int(2, 4);
  for (let i = 0; i < spikes; i++) {
    const t = i / Math.max(1, spikes - 1);
    b.add('chest', spike([sh[0] - k(1), sh[1] + k(2), sh[2] - k(1 + t * 3)], [0.6, 1, -0.5 - t], k(5 + rng.range(0, 3)), k(1.8), k(1.4)), 'bone', { mirror: true, thr: 0.3 });
    b.add('chest', spike([-sh[0] + k(1), sh[1] + k(2), sh[2] - k(1 + t * 3)], [-0.6, 1, -0.5 - t], k(5 + rng.range(0, 3)), k(1.8), k(1.4)), 'bone', { thr: 0.3 });
  }
  for (let i = 0; i < 4; i++) b.add('chest', spike([0, k(48 - i * 4), k(-7 + i)], [0, 0.6, -1], k(4 - i * 0.5), k(1.5), k(1)), 'bone', { thr: 0.3 });

  // ---- arms: long, thick forearms, bone claws
  b.add('upperarm.L', capsule(sh, elbow, k(3.6), k(3.2)), 'hide', { mirror: true });
  b.add('forearm.L', capsule(elbow, wrist, k(3.4), k(3.9)), 'hide', { mirror: true });
  b.add('forearm.L', sphere(elbow, k(3.1)), 'hide', { mirror: true });
  // bone gauntlet plates on the forearm
  b.add('forearm.L', box([wrist[0] + k(1.5), (elbow[1] + wrist[1]) / 2, wrist[2] - k(0.5)], [k(1.4), k(4.5), k(3)], { rot: [-8, 0, 6], round: 1 }), 'bone', { mirror: true });
  const palm: V3 = [wrist[0], wrist[1] - k(2.5), wrist[2] + k(0.5)];
  b.add('hand.L', ellipsoid(palm, [k(2.6), k(3), k(3.2)]), 'hide', { mirror: true });
  for (let i = 0; i < 4; i++) {
    const zz = palm[2] + k(-2.4 + i * 1.6);
    b.add('hand.L', spike([palm[0], palm[1] - k(1.5), zz], [0.15, -1, 0.35], k(6.5 - Math.abs(i - 1.5)), k(1.1), k(0.8), { bend: [0, 0, 0.35], taper: 1.3 }), 'bone', { mirror: true, thr: 0.35 });
  }

  // ---- legs: thick thighs, reverse-jointed look via forward knee and slanted shin
  b.add('thigh.L', capsule(hip, knee, k(4.4), k(3.4)), 'hide', { mirror: true });
  b.add('thigh.L', sphere(hip, k(4.6)), 'hide', { mirror: true });
  b.add('shin.L', capsule(knee, ankle, k(3.2), k(2.4)), 'hide', { mirror: true });
  b.add('shin.L', sphere(knee, k(3)), 'hide', { mirror: true });
  b.add('shin.L', box([knee[0], knee[1] + k(0.5), knee[2] + k(2.5)], [k(2.2), k(2.4), k(1.2)], { round: 1 }), 'bone', { mirror: true });
  const foot: V3 = [ankle[0], k(1.5), ankle[2] + k(3)];
  b.add('foot.L', ellipsoid(foot, [k(2.8), k(1.8), k(5)]), 'hide', { mirror: true });
  for (let i = 0; i < 3; i++) b.add('foot.L', spike([foot[0] + k(-1.4 + i * 1.4), k(1), foot[2] + k(3)], [(i - 1) * 0.25, -0.15, 1], k(3.2), k(0.9), k(0.7)), 'bone', { mirror: true, thr: 0.3 });

  // ---- head + mask
  const hc: V3 = [0, headY + k(2), k(7)];
  b.add('head', ellipsoid(hc, [k(6), k(5.5), k(6.5)]), 'hide');
  const maskFront = hc[2] + k(6.5);
  let mask = blend(k(2), ellipsoid([0, hc[1] + k(0.5), hc[2] + k(2.2)], [k(6.6), k(6.2), k(5.6)]), box([0, hc[1] - k(3), hc[2] + k(3.5)], [k(4.6), k(3), k(4)], { round: k(2) }));
  if (maskType === 'beak') mask = blend(k(1.5), mask, spike([0, hc[1] - k(1), hc[2] + k(6)], [0, -0.35, 1], k(7), k(3), k(2.4), { taper: 1.2 }));
  b.add('head', mask, 'bone');
  // eye holes with glowing pupils
  for (const sx of [-1, 1]) {
    const ex = sx * k(2.6), ey = hc[1] + k(1.6), ez = maskFront - k(1.2);
    b.carve('head', ellipsoid([ex, ey, ez + k(1)], [k(1.7), k(1.2), k(2)], [0, 0, sx * -18]));
    b.paint('head', ellipsoid([ex, ey, ez], [k(2.1), k(1.6), k(2.4)], [0, 0, sx * -18]), 'void', { where: b.isMat('bone', 'hide') });
    b.add('head', sphere([ex + sx * k(0.2), ey, ez - k(0.6)], k(0.8)), 'eye');
  }
  // jaw: open slot with teeth
  const jy = hc[1] - k(3.4);
  b.carve('head', box([0, jy, maskFront - k(1)], [k(3.6), k(0.9), k(3)]));
  b.paint('head', box([0, jy, maskFront - k(3.2)], [k(3.8), k(1.4), k(1.4)]), 'gum', { where: b.isMat('bone', 'hide') });
  for (let i = -3; i <= 3; i++) {
    b.add('head', spike([i * k(1.05), jy + k(1.2), maskFront - k(1.6)], [0, -1, 0.15], k(1.5), k(0.6), k(0.5)), 'teeth', { thr: 0.35 });
    b.add('head', spike([i * k(1.05) + k(0.5), jy - k(1.2), maskFront - k(1.8)], [0, 1, 0.15], k(1.3), k(0.55), k(0.45)), 'teeth', { thr: 0.35 });
  }
  if (maskType === 'fanged') for (const sx of [-1, 1]) b.add('head', spike([sx * k(3.2), jy - k(0.5), maskFront - k(1.5)], [sx * 0.1, -1, 0.3], k(4.5), k(1), k(0.8)), 'teeth', { thr: 0.35 });
  if (maskType === 'horned')
    for (const sx of [-1, 1]) b.add('head', spike([sx * k(4.5), hc[1] + k(4), hc[2]], [sx * 0.6, 1, -0.25], k(9), k(1.8), k(1.6), { bend: [sx * 0.3, -0.1, -0.4] }), 'bone', { thr: 0.35 });
  // markings: stripes over the mask
  const stripes = rng.int(1, 3);
  for (let i = 0; i < stripes; i++) {
    const sx = rng.chance(0.5) ? -1 : 1;
    const x0 = sx * k(1.8 + i * 1.4);
    b.paint('head', capsule([x0, hc[1] + k(6), maskFront], [x0 + sx * k(1.2), hc[1] - k(1), maskFront], k(0.6)), 'mark', { where: b.isMat('bone') });
  }
  b.paint('head', capsule([0, hc[1] + k(6.5), maskFront - k(1)], [0, hc[1] + k(3.5), maskFront], k(0.55)), 'mark', { where: b.isMat('bone') });

  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}

export const HOLLOW_STANCE: StanceDef = {
  idle: {
    hips: [12, 0, 0], spine: [18, 0, 0], chest: [14, 0, 0], neck: [-18, 0, 0], head: [-14, 0, 0],
    'upperarm.L': [-20, 0, 18], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-20, 0, -18], 'forearm.R': [-30, 0, 0],
    'thigh.L': [-22, 0, 8], 'shin.L': [34, 0, 0], 'foot.L': [-10, 0, 0], 'thigh.R': [-6, 0, -8], 'shin.R': [26, 0, 0], 'foot.R': [-16, 0, 0],
  },
  idleHips: -0.12,
  run: { spine: [12, 0, 0], chest: [10, 0, 0], neck: [-14, 0, 0], 'upperarm.L': [-10, 0, 14], 'upperarm.R': [-10, 0, -14] },
  swingL: 1.2,
  swingR: 1.2,
};

const key = (t: number, bones: Record<string, [number, number, number]>, hips?: [number, number, number], ease?: ClipDef['keys'][number]['ease']) => ({ t, b: bones, hips, ease });

export const HOLLOW_CLIPS: ClipDef[] = [
  {
    name: 'claw1', dur: 0.85, fadeIn: 0.08, fadeOut: 0.25, events: { hit: 0.42, step: 0.32 },
    keys: [
      key(0, { chest: [14, 0, 0], 'upperarm.R': [-20, 0, -18], 'forearm.R': [-30, 0, 0] }),
      key(0.32, { chest: [2, -30, 8], spine: [10, -16, 0], 'upperarm.R': [-140, 0, -40], 'forearm.R': [-40, 0, 0], 'upperarm.L': [10, 0, 30], head: [-20, 18, 0] }, [0, -0.04, -0.05], 'out'),
      key(0.44, { chest: [30, 30, -6], spine: [22, 18, 0], 'upperarm.R': [-30, 0, 30], 'forearm.R': [-10, 0, 0], 'upperarm.L': [-30, 0, 10], head: [-26, -14, 0] }, [0, -0.16, 0.12], 'outExpo'),
      key(0.85, { chest: [14, 0, 0], spine: [18, 0, 0], 'upperarm.R': [-20, 0, -18], 'forearm.R': [-30, 0, 0], 'upperarm.L': [-20, 0, 18], head: [-14, 0, 0] }, [0, -0.12, 0], 'inOut'),
    ],
  },
  {
    name: 'claw2', dur: 0.85, fadeIn: 0.08, fadeOut: 0.25, events: { hit: 0.42, step: 0.32 },
    keys: [
      key(0, { chest: [14, 0, 0] }),
      key(0.32, { chest: [2, 30, -8], spine: [10, 16, 0], 'upperarm.L': [-140, 0, 40], 'forearm.L': [-40, 0, 0], 'upperarm.R': [10, 0, -30], head: [-20, -18, 0] }, [0, -0.04, -0.05], 'out'),
      key(0.44, { chest: [30, -30, 6], spine: [22, -18, 0], 'upperarm.L': [-30, 0, -30], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-30, 0, -10], head: [-26, 14, 0] }, [0, -0.16, 0.12], 'outExpo'),
      key(0.85, { chest: [14, 0, 0], spine: [18, 0, 0], 'upperarm.L': [-20, 0, 18], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-20, 0, -18], head: [-14, 0, 0] }, [0, -0.12, 0], 'inOut'),
    ],
  },
  {
    name: 'pounce', dur: 1.1, fadeIn: 0.08, fadeOut: 0.3, events: { leap: 0.35, hit: 0.6 },
    keys: [
      key(0, { spine: [18, 0, 0] }),
      key(0.33, { hips: [20, 0, 0], spine: [30, 0, 0], chest: [20, 0, 0], 'thigh.L': [-60, 0, 8], 'shin.L': [100, 0, 0], 'thigh.R': [-60, 0, -8], 'shin.R': [100, 0, 0], 'upperarm.L': [10, 0, 40], 'upperarm.R': [10, 0, -40] }, [0, -0.35, 0], 'out'),
      key(0.5, { hips: [-10, 0, 0], spine: [-6, 0, 0], chest: [-10, 0, 0], 'thigh.L': [-20, 0, 8], 'shin.L': [20, 0, 0], 'thigh.R': [10, 0, -8], 'shin.R': [30, 0, 0], 'upperarm.L': [-150, 0, 30], 'upperarm.R': [-150, 0, -30], 'forearm.L': [-20, 0, 0], 'forearm.R': [-20, 0, 0], head: [-30, 0, 0] }, [0, 0, 0], 'outExpo'),
      key(0.65, { hips: [20, 0, 0], spine: [34, 0, 0], chest: [24, 0, 0], 'upperarm.L': [-40, 0, 20], 'upperarm.R': [-40, 0, -20], head: [-30, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [80, 0, 0], 'thigh.R': [-40, 0, -8], 'shin.R': [80, 0, 0] }, [0, -0.3, 0.1], 'outExpo'),
      key(1.1, { hips: [12, 0, 0], spine: [18, 0, 0], chest: [14, 0, 0], 'upperarm.L': [-20, 0, 18], 'upperarm.R': [-20, 0, -18], head: [-14, 0, 0], 'thigh.L': [-22, 0, 8], 'shin.L': [34, 0, 0], 'thigh.R': [-6, 0, -8], 'shin.R': [26, 0, 0] }, [0, -0.12, 0], 'inOut'),
    ],
  },
  {
    name: 'roar', dur: 1.3, fadeIn: 0.15, fadeOut: 0.3, events: { roar: 0.45 },
    keys: [
      key(0, { chest: [14, 0, 0] }),
      key(0.4, { hips: [-6, 0, 0], spine: [-10, 0, 0], chest: [-18, 0, 0], neck: [-10, 0, 0], head: [-26, 0, 0], 'upperarm.L': [-30, 0, 70], 'upperarm.R': [-30, 0, -70], 'forearm.L': [-50, 0, 0], 'forearm.R': [-50, 0, 0] }, [0, 0.02, 0], 'outBack'),
      key(1.0, { hips: [-4, 0, 0], spine: [-8, 0, 0], chest: [-16, 4, 0], head: [-22, -6, 0], 'upperarm.L': [-34, 0, 72], 'upperarm.R': [-34, 0, -72] }, [0, 0.02, 0], 'inOut'),
      key(1.3, { hips: [12, 0, 0], spine: [18, 0, 0], chest: [14, 0, 0], neck: [-18, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-20, 0, 18], 'upperarm.R': [-20, 0, -18], 'forearm.L': [-30, 0, 0], 'forearm.R': [-30, 0, 0] }, [0, -0.12, 0], 'inOut'),
    ],
  },
  {
    name: 'hit_heavy', dur: 0.75, fadeIn: 0.03, fadeOut: 0.25,
    keys: [
      key(0, { spine: [-10, 0, 0], chest: [-18, 0, 0], head: [-20, 0, 0] }, [0, -0.05, -0.1]),
      key(0.15, { spine: [-20, 0, 8], chest: [-26, 10, 8], head: [-30, 10, 0], 'upperarm.L': [-30, 0, 60], 'upperarm.R': [-30, 0, -60] }, [0, -0.1, -0.15], 'outExpo'),
      key(0.75, { spine: [18, 0, 0], chest: [14, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-20, 0, 18], 'upperarm.R': [-20, 0, -18] }, [0, -0.12, 0], 'inOut'),
    ],
  },
];
