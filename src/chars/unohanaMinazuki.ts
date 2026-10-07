// Minazuki's Shikai (docs/roster/B1-captains-1.md §5): not a weapon but a creature — a giant green manta
// ray with a single great eye, big enough to carry Unohana and several wounded on its back (it swallows them
// and heals them in its stomach). Brief: ~9 m wingspan, ~5 m body, a whip tail; a broad flat body, swept
// wings, two rolled cephalic lobes either side of a wide mouth, the one orange eye with a black pupil on top
// of the head, a pale belly with gill slits. Built at 8 vox/m (a giant class; the head is ~24 voxels wide).
// Bones: the wings flap, the jaw drops to swallow, the tail on two segments. Socket 'saddle' is where she
// stands, 'mouth' where the swallowed go in. (verify) canon never shows it attack; the size varies.
import { ModelBuilder } from '../models/builder';
import { aabb, capsule, ellipsoid, fn, smoothPath, sphere, tube, type V3 } from '../models/sdf';
import type { CharacterAsset } from './ichigo';

/** 8 voxels per metre */
export const MANTA_RES = 8;
/** where the rider stands (model space, m) */
export const MANTA_SADDLE: V3 = [0, 5.4 / MANTA_RES, -1 / MANTA_RES];

let cache: CharacterAsset | null = null;

export function mantaAsset(): CharacterAsset {
  if (!cache) cache = buildManta();
  return cache;
}

export function buildManta(): CharacterAsset {
  const b = new ModelBuilder('minazuki-manta', MANTA_RES);
  b.mat('green', ['#8DC49A', '#6FAE80', '#56956A', '#427A54', '#305C3E'], { base: 1, rough: 0.55, shadeK: 0.85 });
  b.mat('belly', ['#D8EBDB', '#BFDCC4', '#A2C6A9', '#86AC8E'], { base: 1, rough: 0.6, shadeK: 0.85 });
  b.mat('lid', ['#4A7E58', '#3A6447']);
  b.mat('eye', ['#F6A24A', '#F08A2C', '#D06A18'], { base: 1, rough: 0.2, glow: 0.15 });
  b.mat('pupil', ['#141418']);
  b.mat('hi', ['#F3F3F0'], { glow: 0.2 });
  b.mat('mouthIn', ['#8A3A44', '#6E2A33', '#521C24'], { base: 1, rough: 0.5 });

  b.bone('root', null, [0, 0, 0]);
  b.bone('body', 'root', [0, 0, 0]);
  b.bone('jaw', 'body', [0, -1, 12]);
  b.bone('wing.L', 'body', [9, 0.5, 0]);
  b.bone('wing.R', 'body', [-9, 0.5, 0]);
  b.bone('tail1', 'body', [0, 0, -15]);
  b.bone('tail2', 'tail1', [0, 0, -31]);
  b.socket('saddle', 'body', [0, 5.4, -1]);
  b.socket('mouth', 'jaw', [0, 0, 19]);
  b.socket('eye', 'body', [0, 5, 9]);

  // ---- the body: a broad flat disc, fuller at the front, the back tapering to the tail
  const body = fn((x, y, z) => {
    const zz = z > 0 ? z / 18 : z / 15;
    const half = 10.5 * Math.sqrt(Math.max(0, 1 - zz * zz)) + 0.01;
    const th = 4.6 * Math.sqrt(Math.max(0, 1 - zz * zz)) * (1 - Math.min(1, (Math.abs(x) / half) ** 2) * 0.5) + 0.6;
    return Math.max(Math.abs(x) - half, Math.abs(y - 0.6) - th, -18 - z, z - 18);
  }, [-12, -6, -16], [12, 7, 19]);
  b.add('body', body, 'green', { thr: 0.3 });
  // the head rises a little into the eye mound
  b.add('body', ellipsoid([0, 3.4, 8.5], [7, 3.2, 7]), 'green');
  // ---- the mouth: a wide slit across the front; the lower lip is the jaw
  b.carve('body', ellipsoid([0, -0.4, 17.5], [7.5, 1.6, 4]));
  b.add('jaw', fn((x, y, z) => {
    const half = 7.6 - Math.max(0, z - 14) * 0.3;
    return Math.max(Math.abs(x) - half, Math.abs(y + 1.8) - 1.3, 10 - z, z - 18.4);
  }, [-9, -4, 9], [9, 0, 19]), 'belly');
  b.paint('jaw', ellipsoid([0, -0.6, 17], [6.6, 1.0, 3.2]), 'mouthIn');
  b.paint('body', ellipsoid([0, -0.2, 17.5], [8, 2.2, 4.6]), 'mouthIn', { where: b.isMat('green', 'belly') });
  // ---- the cephalic lobes: rolled flaps either side of the mouth, curling in
  for (const k of [1, -1]) {
    const lobe = smoothPath([[k * 8.4, 0.2, 13], [k * 9.4, 0.4, 17], [k * 8.6, 0.2, 21], [k * 6.8, -0.4, 22.6]], 4);
    b.add('body', tube(lobe, lobe.map((_, i) => 2.0 - i * 0.07)), 'green', { thr: 0.3 });
    b.paint('body', tube(lobe.map((p) => [p[0] - k * 0.8, p[1] - 0.4, p[2]] as V3), lobe.map(() => 1.4)), 'belly', { where: b.isMat('green') });
  }
  // ---- the one eye: a great orange eye in a lidded socket on top of the head
  const eyeC: V3 = [0, 5.6, 9.6];
  b.add('body', ellipsoid([eyeC[0], eyeC[1] - 0.4, eyeC[2] - 0.4], [4.8, 2.6, 4.4]), 'lid');
  b.carve('body', ellipsoid([eyeC[0], eyeC[1] + 0.4, eyeC[2] + 0.4], [3.6, 2.2, 3.6]));
  b.add('body', sphere([eyeC[0], eyeC[1] - 0.6, eyeC[2] + 0.2], 3.0), 'eye');
  b.paint('body', ellipsoid([eyeC[0], eyeC[1] + 1.6, eyeC[2] + 1.6], [0.9, 1.6, 1.4]), 'pupil', { where: b.isMat('eye') });
  b.paint('body', sphere([eyeC[0] + 1.2, eyeC[1] + 1.9, eyeC[2] + 1.2], 0.7), 'hi', { where: b.isMat('eye') });
  // a ridge running back from the eye along the spine, and darker blotches on the back
  b.add('body', capsule([0, 4.6, 4], [0, 3.2, -12], 1.3, 0.9), 'green');
  b.paint('body', capsule([0, 5.2, 4], [0, 3.8, -12], 1.1, 0.8), 'green', { shade: 3 });
  for (const [x, z, r] of [[5, 2, 1.6], [-5, 2, 1.6], [6.5, -6, 1.3], [-6.5, -6, 1.3], [3, -11, 1.1], [-3, -11, 1.1]] as [number, number, number][]) b.paint('body', ellipsoid([x, 6, z], [r, 3, r]), 'green', { shade: 3, where: b.isMat('green') });
  // ---- the belly: pale underneath, five gill slits a side
  b.paint(['body', 'jaw'], aabb([-20, -10, -20], [20, -0.2, 26]), 'belly', { where: b.isMat('green') });
  for (const k of [1, -1])
    for (let i = 0; i < 5; i++) b.paint('body', capsule([k * (3.2 + i * 0.4), -3, 7 - i * 2.2], [k * (5.6 + i * 0.4), -3, 6.4 - i * 2.2], 0.45), 'belly', { shade: 3 });

  // ---- the wings: broad at the root, swept back to a point; thin at the tips, curling down a little
  for (const k of [1, -1]) {
    const side = k > 0 ? 'L' : 'R';
    b.add(`wing.${side}`, fn((x, y, z) => {
      const ax = x * k;
      if (ax < 6) return 6 - ax + 1;
      const u = Math.min(1, (ax - 8) / 28);
      const zc = 1 - 12 * u;
      const halfC = 13 * Math.pow(Math.max(0, 1 - u), 0.85) + 1.2;
      const yc = 0.6 + 2.2 * u - 3.4 * u * u;
      const halfT = 3.4 * (1 - u) + 0.7;
      // a teardrop section: thicker toward the leading edge
      const v = (z - zc) / halfC;
      const lead = 1 - Math.max(0, -v) * 0.45;
      return Math.max(Math.abs(v) - 1, (Math.abs(y - yc) - halfT * lead) / 1, ax - 36.5);
    }, k > 0 ? [5, -6, -26] : [-37, -6, -26], k > 0 ? [37, 7, 16] : [-5, 7, 16]), 'green', { thr: 0.3 });
    b.paint(`wing.${side}`, fn((x, y, z) => {
      const ax = x * k;
      const u = Math.min(1, Math.max(0, (ax - 8) / 28));
      return y - (0.6 + 2.2 * u - 3.4 * u * u);
    }, k > 0 ? [5, -6, -26] : [-37, -6, -26], k > 0 ? [37, 7, 16] : [-5, 7, 16]), 'belly', { where: b.isMat('green') });
    // the leading edge a shade darker, a few ribs fanning out
    for (let i = 0; i < 4; i++) {
      const u = 0.2 + i * 0.2;
      b.paint(`wing.${side}`, capsule([k * 10, 3.2, 1 - i * 3], [k * (8 + u * 28), 0.9 + 2.2 * u - 3.4 * u * u + 1, 1 - 12 * u - 4], 0.5), 'green', { shade: 3, where: b.isMat('green') });
    }
  }
  // ---- the tail: a whip on two segments, with a little dorsal fin at its root
  const t1 = smoothPath([[0, 0.8, -14], [0, 0.6, -22], [0, 0.4, -31.5]], 4);
  b.add('tail1', tube(t1, t1.map((_, i) => 2.0 - i * 0.12)), 'green', { thr: 0.3 });
  b.add('tail1', fn((x, y, z) => Math.max(Math.abs(x) - 0.6, y - (3.2 - (z + 14) * -0.25), 0.5 - y, -20 - z, z + 14), [-1, 0, -21], [1, 4, -13]), 'green', { thr: 0.3 });
  const t2 = smoothPath([[0, 0.4, -30.5], [0, 0.2, -40], [0, -0.2, -50]], 4);
  b.add('tail2', tube(t2, t2.map((_, i) => 1.0 - i * 0.07)), 'green', { thr: 0.35 });
  b.autoShade();
  b.lint();
  return { model: b.build(), springs: [], colliders: [], warnings: b.warnings };
}
