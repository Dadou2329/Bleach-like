// Kaien Shiba — former Lieutenant of the 13th Division (docs/roster/A3-urahara-shop-and-shiba.md §7). Brief: 183 cm,
// the standard body at 45.9 vox/m (84 vox); lean and athletic, long arms, an open, grinning face built like Ichigo's.
// Silhouette keys: spiky black hair with a violet sheen, aqua-green eyes, the grin; the standard shihakushō with the
// lieutenant's badge (十三 and a snowdrop) tied on the left arm; the Shiba crest (a whirlpool) on the left wrist;
// Nejibana at the left hip (props in nejibana.ts).
// Possessed (Metastacia, the night hunt): the same body gone grey-green, the eyes black with orange flame marks round
// them, a feral grin, three of the Hollow's tentacles writhing up from the back (spring chains).
// (verify) the crest's place (left arm or left wrist), the badge's flower, the possessed tentacles' number and origin.
import { ModelBuilder } from '../models/builder';
import { aabb, box, cylinder, fn, smoothPath, sphere, tube, type V3 } from '../models/sdf';
import { SPEC_ADULT_MALE, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, shihakushoSprings, spikeHair, type HumanoidSpec, type Landmarks, type Spike } from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { SpringDef } from '../anim/springs';

/** 84 voxels = 1.83 m */
export const KAIEN_RES = 84 / 1.83;
export type KaienForm = 'lieutenant' | 'possessed';

/** Lean and long-armed, a little broader in the shoulder than the standard body. */
const SPEC: HumanoidSpec = {
  ...SPEC_ADULT_MALE,
  shoulder: [9.8, 66.5, -0.5],
  upperArm: 14.8,
  foreArm: 13.4,
  armR: 2.6,
  chest: [8.6, 5],
  waist: [6.9, 4.3],
  hips: [7.3, 4.7],
};

/** Kaien's hair: big spiky clumps all round, flicking back, a few over the brow (Aaroniero's Kaien head shares it). */
export const KAIEN_HAIR: Spike[] = [
  { az: 0, el: 66, len: 4.2, r: 3.8, flow: [0, 0.05, -0.8] },
  { az: -40, el: 58, len: 4.6, r: 3.6, flow: [-0.15, 0.05, -0.75] },
  { az: 40, el: 58, len: 4.6, r: 3.6, flow: [0.15, 0.05, -0.75] },
  { az: -90, el: 46, len: 4.5, r: 3.4, flow: [0, 0.15, -0.5] },
  { az: 90, el: 46, len: 4.5, r: 3.4, flow: [0, 0.15, -0.5] },
  { az: -135, el: 44, len: 5, r: 3.6, flow: [0, 0.05, -0.55] },
  { az: 135, el: 44, len: 5, r: 3.6, flow: [0, 0.05, -0.55] },
  { az: 180, el: 50, len: 5.5, r: 3.8, flow: [0, 0.1, -0.6] },
  { az: -22, el: 48, len: 4.5, r: 2.8, flow: [-0.1, 0.6, 0.2] },
  { az: 22, el: 48, len: 4.5, r: 2.8, flow: [0.1, 0.6, 0.2] },
  { az: -72, el: 20, len: 3.5, r: 3, flow: [0, -0.1, -0.45] },
  { az: 72, el: 20, len: 3.5, r: 3, flow: [0, -0.1, -0.45] },
  { az: -158, el: 14, len: 4, r: 3.2, flow: [0, -0.4, -0.4] },
  { az: 158, el: 14, len: 4, r: 3.2, flow: [0, -0.4, -0.4] },
  { az: 180, el: 22, len: 4, r: 3.4, flow: [0, -0.3, -0.45] },
];

/** Rows chin+9 → chin (column 0 is his right): straight brows, aqua-green eyes, the wide grin. */
const FACE = [
  '. . . . . . . . . .',
  '. b B B . . B B b .',
  '. L L L . . L L L .',
  '. W * I . . * I W .',
  '. W I i . . i I W .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . m T T T T m . .',
  '. . . m m m m . . .',
  '. . . . . . . . . .',
];

/** Possessed: the eyes gone black with an orange glint, flame marks round them, the grin bared. */
const FACE_POSSESSED = [
  '. . . . . . . . . .',
  '. o B B . . B B o .',
  'o L L L . . L L L o',
  '. D D D . . D D D .',
  '. D O D . . D O D .',
  '. o . o . . o . o .',
  '. . . . . s . . . .',
  '. . m . . . . m . .',
  '. . m T T T T m . .',
  '. . . . . . . . . .',
];

/** the badge plaque: an impression of 十三 (ten over three) */
const JUSAN = ['. x .', 'x x x', '. x .', '. . .', 'x x x', '. . .', 'x x x'];

function palette(b: ModelBuilder, possessed: boolean): void {
  if (possessed) b.mat('skin', ['#A9B8A2', '#99AA93', '#8FA08A', '#76866F', '#5E6E5A'], { base: 2, rough: 0.6, shadeK: 0.9 });
  else b.mat('skin', ['#F6DCC8', '#F2D2BE', '#E8BDAF', '#C38E80', '#AB7767'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#504456', '#45364A', '#2A2230', '#1C1726', '#141418'], { base: 3, rough: 0.5, shadeK: 0.85 });
  b.mat('brow', ['#1C1726']);
  b.mat('lid', ['#1C1726']);
  b.mat('sclera', ['#F1F0EC']);
  b.mat('iris', ['#5E9C94'], { glow: 0.1 });
  b.mat('irisD', ['#3B5F5A']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#4E2626']);
  b.mat('teeth', ['#F1EFE8']);
  b.mat('void', ['#141418']);
  b.mat('flame', ['#E8762A'], { glow: 0.6 });
  b.mat('ember', ['#FFB060'], { glow: 1.2 });
  b.mat('black', ['#444346', '#2E2E33', '#1C1C20', '#141418'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F3F3F0', '#E4E5E7', '#C9CCD1'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F3F3F0', '#E2E3E5', '#C6C9CE'], { base: 0, rough: 0.8 });
  b.mat('badge', ['#E8DDC2', '#D3C6A6', '#B5A685'], { base: 0, rough: 0.8 });
  b.mat('wood', ['#C9A46A', '#A9864E', '#86683A'], { base: 1, rough: 0.8 });
  b.mat('ink', ['#1E1A16']);
  b.mat('snowdrop', ['#F3F3F0']);
  b.mat('tattoo', ['#1A1A1A']);
  b.mat('tabi', ['#F3F2EE', '#DEDDDA', '#C2C1BD'], { base: 0, rough: 0.8 });
  b.mat('straw', ['#C9AE7A', '#B59C6A', '#8E7A50'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
  b.mat('tentacle', ['#7E8C78', '#68765F', '#56634E', '#3F4A39'], { base: 1, rough: 0.55, shadeK: 0.9 });
  b.mat('sucker', ['#B8C4A8', '#A2AF93'], { base: 0, rough: 0.5 });
}

const assetCache = new Map<KaienForm, CharacterAsset>();

export function kaienAsset(form: KaienForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildKaien(form)));
  return a;
}

export function buildKaien(form: KaienForm = 'lieutenant'): CharacterAsset {
  const possessed = form === 'possessed';
  const b = new ModelBuilder(`kaien-${form}`, KAIEN_RES);
  palette(b, possessed);
  const s = SPEC;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  const [wx, wy, wz] = L.wrist;
  b.socket('grip.R', 'fist.R', [-wx + 0.1, wy - 4.3, wz + 0.4]);
  b.socket('grip.L', 'fist.L', [wx - 0.1, wy - 4.3, wz + 0.4]);
  b.socket('palm.R', 'palm.R', [-wx + 0.6, wy - 5, wz + 1]);
  b.socket('palm.L', 'palm.L', [wx - 0.6, wy - 5, wz + 1]);
  b.socket('chest.front', 'chest', [0, 61, 6]);
  b.socket('back', 'chest', [0, 60, -6.5]);
  // the sheath through the obi at his left hip, the mouth forward and up
  // (Nejibana's sheath runs from its mouth at the origin along +Z: turned to hang back from the hip)
  b.socket('hip.L', 'hips', [s.waist[0] + 1.8, s.waistY - 3, 2.4], [-24, 180, -8]);
  b.socket('foot.R', 'foot.R', [-L.ankle[0], 1, 2]);
  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.socket('mouth', 'head', [0, s.chinY + 1.5, hd.front + 0.5]);
  const legend = {
    ...faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth', teeth: 'teeth', inner: 'void' }),
    o: { mat: 'flame' },
    O: { mat: 'ember' },
  };
  b.stamp('head', hd.x0, hd.chin + 9, possessed ? FACE_POSSESSED : FACE, legend, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L);
  hands(b, L, 'skin');
  feet(b, L, 'tabi', 'straw', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', bag: 4 };
  kosodeTorso(b, L, o);
  kosodeSleeves(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  badge(b, L);
  crest(b, L);
  const base = shihakushoSprings();
  const springs: SpringDef[] = [...base.springs];
  if (possessed) springs.push(...tentacles(b, L));
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders: base.colliders, warnings: b.warnings };
}

/** the hair: the shared spikes, three locks over the brow, and the scalp corners above the hairline */
function hair(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const hairline = s.chinY + s.head.h - 1.5;
  spikeHair(b, L, 'hair', KAIEN_HAIR, [{ x: -2.6, tipY: hairline - 2.2, lean: -0.5, r: 1.8 }, { x: 1.2, tipY: hairline - 2.8, lean: 0.8, r: 1.9 }, { x: 3.8, tipY: hairline - 1.5, lean: 0.4, r: 1.5 }], { tufts: 30 });
  b.paint('head', aabb([-12, hairline + 0.5, -20], [12, hairline + 20, 20]), 'hair', { where: b.isMat('skin') });
}

/**
 * The lieutenant's badge tied round the left sleeve: a white cloth band, the wooden plaque on its outside (十三 and the
 * 13th Division's snowdrop), the knot.
 */
function badge(b: ModelBuilder, L: Landmarks): void {
  const [sx, sy, sz] = L.spec.shoulder;
  const yb = sy - 6.5;
  b.add('upperarm.L', cylinder([sx + 0.4, yb - 0.8, sz - 0.3], [sx + 0.4, yb + 0.8, sz - 0.3], 4.1), 'collar');
  b.add('upperarm.L', box([sx + 4.2, yb - 0.6, sz - 0.3], [0.45, 4, 1.7]), 'wood');
  b.add('upperarm.L', box([sx + 4.6, yb - 0.6, sz - 0.3], [0.3, 3.5, 1.3]), 'badge');
  JUSAN.forEach((row, r) => row.split(' ').forEach((ch, col) => {
    if (ch === 'x') b.voxel('upperarm.L', Math.round(sx + 5), Math.round(yb + 2.4 - r), Math.round(sz - 1.3 + col), 'ink');
  }));
  b.voxel('upperarm.L', Math.round(sx + 5), Math.round(yb - 4.2), Math.round(sz - 0.3), 'snowdrop');
  b.add('upperarm.L', sphere([sx + 3.1, yb - 0.2, sz + 3.1], 1), 'collar');
}

/** the Shiba crest on the left wrist: a small whirlpool on the back of the hand by the wrist (both hand shapes) */
function crest(b: ModelBuilder, L: Landmarks): void {
  const [wx, wy, wz] = L.wrist;
  const c: V3 = [wx + 1.6, wy - 1.6, wz];
  const ring = (x: number, y: number, z: number): number => {
    const d = Math.hypot(y - c[1], z - c[2]);
    const a = Math.atan2(z - c[2], y - c[1]);
    // a spiral: the ring's radius turns with the angle, a gap where it starts
    const r = 0.5 + ((a + Math.PI) / (Math.PI * 2)) * 1.1;
    return Math.max(Math.abs(d - r) - 0.45, Math.abs(x - c[0]) - 1.6);
  };
  for (const bone of ['palm.L', 'fist.L']) {
    b.paint(bone, fn(ring, [c[0] - 2, c[1] - 2.5, c[2] - 2.5], [c[0] + 2, c[1] + 2.5, c[2] + 2.5]), 'tattoo', { where: b.isMat('skin') });
  }
}

/**
 * Metastacia's tentacles: three from the upper back, rising over the shoulders and curling forward — each a chain of
 * three spring bones (they sway and lag as he moves).
 */
function tentacles(b: ModelBuilder, L: Landmarks): SpringDef[] {
  const s = L.spec;
  const springs: SpringDef[] = [];
  const res = KAIEN_RES;
  const roots: [number, number, number][] = [[-3.4, s.chestY + 1, -5.2], [3.4, s.chestY + 1, -5.2], [0, s.chestY + 4, -5.6]];
  roots.forEach((r0, i) => {
    const k = i === 2 ? 0 : i === 0 ? -1 : 1;
    const ctrl: V3[] = [
      r0,
      [r0[0] + k * 3, r0[1] + 6, r0[2] - 5],
      [r0[0] + k * 6, r0[1] + 14, r0[2] - 6],
      [r0[0] + k * 7, r0[1] + 21, r0[2] - 2],
      [r0[0] + k * 6, r0[1] + 24, r0[2] + 4],
    ];
    const pts = smoothPath(ctrl, 5);
    const n = pts.length;
    const names = [`tent${i}.1`, `tent${i}.2`, `tent${i}.3`];
    const cuts = [0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1];
    names.forEach((nm, j) => b.bone(nm, j === 0 ? 'chest' : names[j - 1], pts[cuts[j]]));
    names.forEach((nm, j) => {
      const seg = pts.slice(cuts[j], cuts[j + 1] + 1);
      const r0j = 2.2 - (cuts[j] / (n - 1)) * 1.6, r1j = 2.2 - (cuts[j + 1] / (n - 1)) * 1.6;
      b.add(nm, tube(seg, seg.map((_, q) => r0j + (r1j - r0j) * (q / Math.max(1, seg.length - 1)))), 'tentacle', { thr: 0.2 });
      // pale suckers along the inside of the curl
      for (let q = 1; q < seg.length - 1; q += 2) {
        const p = seg[q];
        b.add(nm, sphere([p[0] - k * 0.6, p[1], p[2] + 1.2], 0.7), 'sucker', { only: 'empty', thr: 0.2 });
      }
      const a = pts[cuts[j]], e = pts[cuts[j + 1]];
      springs.push({ bone: nm, tail: [(e[0] - a[0]) / res, (e[1] - a[1]) / res, (e[2] - a[2]) / res], stiffness: 60 - j * 15, damping: 4, gravity: 2, limit: 50, radius: 0.05 });
    });
  });
  // the roots: lumps where they break out of the kosode's back
  for (const r0 of roots) b.add('chest', sphere(r0, 2.6), 'tentacle');
  return springs;
}

// re-exported so a kit or the viewer can find the props with the body
export { nejibanaProp, KATANA_BASE_Z, KATANA_TIP_Z, NEJIBANA_BASE_Z, NEJIBANA_TIP_Z, type NejibanaProp } from './nejibana';
