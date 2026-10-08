// Tōshirō Hitsugaya — Captain of the 10th Division. Construction and palette from docs/roster/B3-captains-3.md
// §Hitsugaya: a child's build (about five heads tall: the standard face plate on a short body), tall
// white spikes, turquoise eyes under a permanent scowl, black shihakushō under a sleeveless white haori
// with 十 in a rhombus on the back, the green sash worn bandolier-style from the right shoulder to the left
// hip and closed by a round star clip, and Hyōrinmaru — a nodachi longer than he is — sheathed on his back
// with the hilt over his right shoulder. 1.33 m: 70 voxels at 52.6 vox/m.
// Bankai, Daiguren Hyōrinmaru: two great wings of ice, a segmented tail, the dragon-head gauntlet round the
// right forearm with the blade coming out of its jaws, the left arm sheathed in ice ending in a claw, iced
// shoulders and clawed feet, and three ice flowers behind the back — twelve violet petals (one bone each)
// that crumble one by one.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, halfSpace, intersect, offset, prism, sphere, spike, subtract, tube, type Sdf, type V3 } from '../models/sdf';
import {
  coatSkirt, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi, spikeHair,
  type HumanoidSpec, type Landmarks, type Spike,
} from './humanoid';
import type { CharacterAsset } from './ichigo';
import type { ColliderDef, SpringDef } from '../anim/springs';

/** 70 voxels = 1.33 m */
export const HITSUGAYA_RES = 70 / 1.33;
/** 'tybw*': the Thousand-Year Blood War look (the hair grown longer); 'tybw-hollow': the Bankai Hollowfied by the
 *  Shin'eiyaku — darker ice, an ice sash across the chest, a white ice half-mask over the left eye, two horns */
export type HitsugayaForm = 'captain' | 'bankai' | 'tybw' | 'tybw-bankai' | 'tybw-hollow';

/** A child: the adult face plate and head, a short torso, short limbs, narrow shoulders. */
const SPEC: HumanoidSpec = {
  H: 70,
  chinY: 57,
  head: { w: 10, d: 11, h: 13 },
  neckR: 2.2,
  shoulder: [7.4, 52.5, -0.5],
  upperArm: 11,
  foreArm: 10,
  hand: 7,
  armR: 2.1,
  hipsY: 34,
  hip: [3.8, 31.5, 0],
  kneeY: 17,
  ankleY: 3.8,
  chest: [6.5, 4.1],
  waist: [5.5, 3.7],
  hips: [5.9, 4.0],
  chestY: 47.5,
  waistY: 40,
  foot: { len: 10, w: 4.4, heel: 2.6 },
};

export function palette(b: ModelBuilder, hollow = false): void {
  b.mat('skin', ['#FBEBDD', '#F3D8C4', '#E6C5AE', '#D7B39C', '#BE9A82'], { base: 1, rough: 0.6, shadeK: 0.9 });
  b.mat('hair', ['#EDF0F2', '#DCE3E8', '#C3D1DE', '#A9B9C9', '#8C9DB0', '#6F8094'], { base: 1, rough: 0.5, shadeK: 0.9, dither: 0.06 });
  b.mat('brow', ['#B9C6D3']);
  b.mat('lid', ['#2A2F38']);
  b.mat('sclera', ['#F3F4F6']);
  b.mat('iris', ['#2BB7AA']);
  b.mat('irisD', ['#146B63']);
  b.mat('hi', ['#F3F3F0']);
  b.mat('mouth', ['#B07A6A']);
  b.mat('black', ['#34343C', '#24242A', '#18181D', '#141418'], { base: 2, rough: 0.85, shadeK: 0.9 });
  b.mat('collar', ['#F3F3F0', '#E4E5E7', '#C9CCD1'], { base: 0, rough: 0.8 });
  b.mat('obi', ['#F3F3F0', '#E2E3E5', '#C6C9CE'], { base: 0, rough: 0.8 });
  b.mat('haori', ['#F3F3F0', '#EDECE7', '#DCDDDF', '#C5C8CE', '#A7ADB6'], { base: 1, rough: 0.8, shadeK: 0.9 });
  b.mat('haoriIn', ['#D9DADC', '#C3C6CB', '#AAAFB7'], { base: 1, rough: 0.85 });
  b.mat('kanji', ['#141418'], { rough: 0.9 });
  b.mat('sash', ['#5AA874', '#3E8C57', '#2C6A41', '#1F4D2F'], { base: 1, rough: 0.75, shadeK: 0.9 });
  b.mat('clip', ['#E2B868', '#B98B3F', '#8C6528', '#644718'], { base: 1, rough: 0.35, metal: 0.8, shadeK: 0.8 });
  b.mat('tabi', ['#F3F3F0', '#DEDFE1', '#C2C5CA'], { base: 0, rough: 0.8 });
  b.mat('straw', ['#C9A96B', '#A8874F', '#86683A'], { base: 1, rough: 0.9 });
  b.mat('cord', ['#5B4632']);
  // Daiguren Hyōrinmaru
  if (hollow) {
    // the Hollow-tainted Bankai: denser, darker ice
    b.mat('ice', ['#A9CBE0', '#8DB6D1', '#6C9DBE', '#4F7FA3', '#3A6488'], { base: 1, rough: 0.14, metal: 0.1, shadeK: 0.85, glow: 0.25 });
    b.mat('iceDeep', ['#3A6488', '#2C4E6E', '#213B54'], { base: 1, rough: 0.16, glow: 0.25 });
    b.mat('mask', ['#F3F6F8', '#EAF3F9', '#D2E2EE', '#B4CADB'], { base: 1, rough: 0.25, shadeK: 0.9 });
    b.mat('horn', ['#BFD8EA', '#9DBDD6', '#7FA2BF', '#5F85A6'], { base: 1, rough: 0.2, shadeK: 0.9 });
  } else {
    b.mat('ice', ['#CBEFFC', '#A9E2F7', '#86CDEE', '#5DB4E0', '#3A8CC4'], { base: 1, rough: 0.12, metal: 0.1, shadeK: 0.85, glow: 0.3 });
    b.mat('iceDeep', ['#4EA8D9', '#357FB8', '#265F94'], { base: 1, rough: 0.15, glow: 0.3 });
  }
  b.mat('petal', ['#C9C0F0', '#A89BE3', '#7E70CF', '#5E50AE'], { base: 1, rough: 0.2, shadeK: 0.9, glow: 0.6 });
}

/** The scowl: brows pulled down toward the nose over large, sharp turquoise eyes; a flat, small mouth. Rows 9 → 0. */
export const FACE = [
  '. . . . . . . . . .',
  '. B B . . . . B B .',
  '. . B B . . B B . .',
  '. L L L . . L L L .',
  '. W I I . . I I W .',
  '. . * i . . i * . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

const assetCache = new Map<HitsugayaForm, CharacterAsset>();
const propCache = new Map<string, VoxelModel>();

export function hitsugayaAsset(form: HitsugayaForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildHitsugaya(form)));
  return a;
}

/**
 * 'sword' (Hyōrinmaru drawn), 'sheathed' (the sword in its sheath, worn on the back), 'crescent' (the
 * Shikai's sickle on the end of the chain), 'bankai-sword' (the eight-pointed star guard).
 */
export type HitsugayaProp = 'sword' | 'sheathed' | 'crescent' | 'bankai-sword' | 'dragon-head';

export function hitsugayaProp(kind: HitsugayaProp): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'sheathed' ? buildSheathed() : kind === 'crescent' ? buildCrescent() : kind === 'dragon-head' ? buildDragonHead() : buildHyorinmaru(kind === 'bankai-sword' ? 8 : 4);
    propCache.set(kind, m);
  }
  return m;
}

/** The sheath socket on the back: mouth above the right shoulder blade, the sheath running down to the left. */
export const SHEATH_SOCKET = { pos: [-4.6, 55, -8.2] as V3, rot: [95.2, 28.5, -31.1] as V3 };

export function buildHitsugaya(form: HitsugayaForm = 'captain'): CharacterAsset {
  const b = new ModelBuilder(`hitsugaya-${form}`, HITSUGAYA_RES);
  const tybw = form.startsWith('tybw');
  const hollow = form === 'tybw-hollow';
  palette(b, hollow);
  const s = SPEC;
  const bankai = form === 'bankai' || form === 'tybw-bankai' || hollow;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0] + 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0] - 0.6, L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('finger.R', 'palm.R', [-L.wrist[0] + 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('finger.L', 'palm.L', [L.wrist[0] - 0.2, L.wrist[1] - s.hand - 0.5, L.wrist[2] + 1]);
  b.socket('back', 'chest', SHEATH_SOCKET.pos, SHEATH_SOCKET.rot);
  b.socket('chest.front', 'chest', [0, s.chestY, 6]);
  b.socket('hip.L', 'hips', [7.6, s.hipsY + 1, 2.8], [-26, 180, -8]);

  const hd = head(b, L, 'skin');
  b.socket('face', 'head', [0, s.chinY + 5.5, hd.front]);
  b.stamp('head', hd.x0, hd.chin + 9, FACE, faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' }), hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
  hair(b, L, hd, tybw);
  hands(b, L, 'skin');
  feet(b, L, 'tabi', 'straw', 'cord');
  const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi', hemR: 7.4, bag: 2.4 };
  const torso = kosodeTorso(b, L, o);
  kosodeSleeves(b, L, o);
  obi(b, L, o);
  hakama(b, L, o);
  const coat = haori(b, L, torso);
  sash(b, L, torso);
  const springs: SpringDef[] = [];
  const colliders: ColliderDef[] = [];
  if (bankai) {
    const ice = daiguren(b, L, hd);
    springs.push(...ice.springs);
  }
  if (hollow) hollowfied(b, L, hd, torso);
  b.autoShade();
  b.lint();
  const R = HITSUGAYA_RES;
  for (const side of ['L', 'R']) {
    springs.push({ bone: `sleeve.${side}`, tail: [0, -9 / R, -2.5 / R], stiffness: 40, damping: 5, gravity: 10, limit: 95, radius: 0.04 });
    springs.push({ bone: `hakama.${side}`, tail: [0, -18 / R, 0], stiffness: 72, damping: 6, gravity: 8, limit: 55, radius: 0.09 });
  }
  return {
    model: b.build(),
    springs: [...springs, ...coat.springs],
    colliders: [...colliders, ...coat.colliders, { bone: 'shin.L', offset: [0, -0.1, 0], radius: 0.06 }, { bone: 'shin.R', offset: [0, -0.1, 0], radius: 0.06 }],
    warnings: b.warnings,
  };
}

// ---------------------------------------------------------------------------------------------- hair

/**
 * Tall white spikes standing up and out like frost, a few locks falling over the forehead between the
 * eyes, side spikes flaring over the ears, the back swept up.
 */
export function hair(b: ModelBuilder, L: Landmarks, hd: { front: number; x0: number; chin: number }, tybw = false): void {
  const s = L.spec;
  const c = hd.chin;
  const front = hd.front;
  // TYBW: everything grown a fifth longer (and thicker, so the tips hold together), a heavier fringe down to the brows, the back hanging lower
  const k = tybw ? 1.2 : 1;
  const grow = (sp: Spike[]): Spike[] => sp.map((x) => ({ ...x, len: x.len * k, r: x.r * (tybw ? 1.15 : 1), flow: tybw && x.el < 40 && x.flow ? ([x.flow[0], x.flow[1] - 0.25, x.flow[2]] as V3) : x.flow }));
  const fringe = tybw
    ? [{ x: -2.4, tipY: c + 7.2, lean: -0.2, r: 1.2 }, { x: 2.2, tipY: c + 7.2, lean: 0.2, r: 1.2 }, { x: -5, tipY: c + 6.2, lean: -0.5, r: 1.2 }, { x: 4.8, tipY: c + 6.2, lean: 0.5, r: 1.2 }]
    : [];
  spikeHair(b, L, 'hair', grow([
    // the crown: tall spikes, leaning back and out
    { az: 0, el: 62, len: 7.5, r: 3.2, flat: 0.55, flow: [0, 0.6, -0.2] },
    { az: -35, el: 58, len: 7, r: 3, flat: 0.55, flow: [-0.25, 0.7, -0.1] },
    { az: 35, el: 58, len: 7, r: 3, flat: 0.55, flow: [0.25, 0.7, -0.1] },
    { az: 180, el: 60, len: 7, r: 3, flat: 0.65, flow: [0, 0.5, -0.4] },
    { az: -140, el: 55, len: 6.5, r: 2.6, flat: 0.55, flow: [-0.3, 0.5, -0.4] },
    { az: 140, el: 55, len: 6.5, r: 2.6, flat: 0.55, flow: [0.3, 0.5, -0.4] },
    { az: -95, el: 52, len: 6.5, r: 3, flat: 0.55, flow: [-0.45, 0.6, 0] },
    { az: 95, el: 52, len: 6.5, r: 3, flat: 0.55, flow: [0.45, 0.6, 0] },
    { az: -60, el: 70, len: 6, r: 2.4, flat: 0.55, flow: [0, 0.9, 0] },
    { az: 60, el: 70, len: 6, r: 2.4, flat: 0.55, flow: [0, 0.9, 0] },
    { az: 150, el: 75, len: 5.5, r: 2.4, flat: 0.55, flow: [0, 0.9, -0.2] },
    // sides: flaring out over the ears and down
    { az: -100, el: 18, len: 5, r: 2.4, flat: 0.5, flow: [-0.4, -0.15, -0.2] },
    { az: 100, el: 18, len: 5, r: 2.4, flat: 0.5, flow: [0.4, -0.15, -0.2] },
    { az: -130, el: 30, len: 5.5, r: 2.5, flat: 0.5, flow: [-0.3, 0.1, -0.5] },
    { az: 130, el: 30, len: 5.5, r: 2.5, flat: 0.5, flow: [0.3, 0.1, -0.5] },
    // the back: swept up at the nape
    { az: 180, el: 20, len: 5, r: 2.6, flat: 0.5, flow: [0, 0.2, -0.6] },
    { az: -160, el: 35, len: 5.5, r: 2.5, flat: 0.5, flow: [-0.1, 0.4, -0.6] },
    { az: 160, el: 35, len: 5.5, r: 2.5, flat: 0.5, flow: [0.1, 0.4, -0.6] },
    // the front: spikes jutting forward and up over the brow, breaking the hairline
    { az: -18, el: 30, len: 4.5, r: 2.4, flat: 0.55, flow: [-0.2, 0.7, 0.5] },
    { az: 18, el: 30, len: 4.5, r: 2.4, flat: 0.55, flow: [0.2, 0.7, 0.5] },
    { az: -48, el: 26, len: 4, r: 2.3, flat: 0.55, flow: [-0.5, 0.5, 0.3] },
    { az: 48, el: 26, len: 4, r: 2.3, flat: 0.55, flow: [0.5, 0.5, 0.3] },
  ]), [
    // forehead locks: short points; one between the eyes, two at the temples — the eyes stay clear
    { x: -0.4, tipY: c + 7.6, lean: 0.3, r: 1.1 },
    { x: -4.2, tipY: c + 8.2, lean: -0.6, r: 1.2 },
    { x: 4.0, tipY: c + 8.2, lean: 0.6, r: 1.2 },
    ...fringe,
  ], { tufts: tybw ? 6 : 4, hairline: c + s.head.h - 0.5, slope: 0.7, tuftFlow: [0, 0.5, -0.2] });
  // keep the eyes clear of the side locks
  b.carve('head', aabb([-5, c + 4, front], [-1, c + 7, front + 6]));
  b.carve('head', aabb([1, c + 4, front], [5, c + 7, front + 6]));
}

// ---------------------------------------------------------------------------------------------- haori

/** Sleeveless white haori, open at the front, 十 in a rhombus on the back; the skirt on spring panels. */
export function haori(b: ModelBuilder, L: Landmarks, torso: Sdf, res = HITSUGAYA_RES, hem = 7): { springs: SpringDef[]; colliders: ColliderDef[] } {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const top = s.chinY + 8;
  const opening = intersect(
    prism([[-2.2, top], [2.2, top], [3.4, s.chestY + 3], [4.4, s.waistY + 2], [5, s.hipsY - 6], [-5, s.hipsY - 6], [-4.4, s.waistY + 2], [-3.4, s.chestY + 3]], [0, 0, 0], [1, 0, 0], [0, 1, 0], 30),
    halfSpace([0, 0, 1], [0, 0, -1]),
  );
  const shell = subtract(offset(torso, 1.45), offset(torso, 0.2), opening);
  // sleeveless: the armholes are cut round the shoulder balls
  const armholes = [cylinder([sx + 3, sy - 1, sz], [sx - 1.6, sy - 1, sz], 3.4), cylinder([-sx - 3, sy - 1, sz], [-sx + 1.6, sy - 1, sz], 3.4)];
  const body = subtract(shell, ...armholes);
  for (const [bone, y0, y1] of [['spine', s.hipsY + 1, s.waistY + 5], ['chest', s.chestY - 7, top]] as [string, number, number][]) b.add(bone, intersect(body, aabb([-30, y0, -30], [30, y1, 30])), 'haori');
  b.paint(['chest', 'spine'], intersect(offset(opening, 1.0), halfSpace([0, 0, 1], [0, 0, -1])), 'haoriIn', { where: b.isMat('haori') });
  // the armhole edges show the lining
  b.paint('chest', blend(0.5, ...armholes.map((a) => offset(a, 0.8))), 'haoriIn', { where: b.isMat('haori') });
  // 十 in a rhombus on the back, drawn as seen from behind (viewer's left = the character's left = +X)
  const JU = [
    '.....X.....',
    '....X.X....',
    '...X...X...',
    '..X..X..X..',
    '.X...X...X.',
    'X.XXXXXXX.X',
    '.X...X...X.',
    '..X..X..X..',
    '...X...X...',
    '....X.X....',
    '.....X.....',
  ];
  const g = b.grid('chest');
  JU.forEach((row, r) => {
    for (let ci = 0; ci < row.length; ci++) {
      if (row[ci] !== 'X') continue;
      const x = 5 - ci, y = s.chestY + 4 - r;
      for (let z = -14; z < 2; z++)
        if (g.get(x, y, z) !== 0) {
          b.voxel('chest', x, y, z, 'kanji', 0);
          break;
        }
    }
  });
  return coatSkirt(b, L, { mat: 'haori', lining: 'haoriIn', yTop: s.waistY - 2, yHem: hem, r0: s.waist[0] + 2.7, r1: s.waist[0] + 5.7, openFront: 15, res });
}

/**
 * The green sash, bandolier-style: a band round the body in the plane through the right shoulder and the
 * left hip, riding on the haori; the round star clip on the chest.
 */
export function sash(b: ModelBuilder, L: Landmarks, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy] = s.shoulder;
  const p0: V3 = [-sx + 0.5, sy + 3.5, 0], p1: V3 = [s.waist[0] + 1.5, s.waistY - 3.5, 0];
  const d: V3 = [p1[0] - p0[0], p1[1] - p0[1], 0];
  const dl = Math.hypot(d[0], d[1]);
  const n: V3 = [-d[1] / dl, d[0] / dl, 0];
  const c: V3 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0];
  const w = 1.5;
  const slab = intersect(halfSpace([c[0] + n[0] * w, c[1] + n[1] * w, 0], n), halfSpace([c[0] - n[0] * w, c[1] - n[1] * w, 0], [-n[0], -n[1], 0]));
  const band = intersect(subtract(offset(torso, 2.6), offset(torso, 1.35)), slab);
  b.add('chest', intersect(band, aabb([-30, s.chestY - 7, -30], [30, 90, 30])), 'sash');
  b.add('spine', intersect(band, aabb([-30, s.hipsY - 2, -30], [30, s.chestY - 7, 30])), 'sash');
  // a darker stripe along both edges
  const edge = intersect(band, subtract(slab, offset(slab, -0.6)));
  b.paint(['chest', 'spine'], edge, 'sash', { shade: 3, where: b.isMat('sash') });
  // the clip: a round bronze disc with a four-pointed star, on the chest where the band crosses
  const t = 0.42;
  const cx = p0[0] + d[0] * t, cy = p0[1] + d[1] * t;
  let cz = 0;
  for (let z = 14; z > -14; z -= 0.1) if (offset(torso, 2.6).d(cx, cy, z) <= 0) { cz = z; break; }
  b.add('chest', cylinder([cx, cy, cz - 0.4], [cx, cy, cz + 1.2], 2.5), 'clip');
  const star: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 4, r = i % 2 === 0 ? 2.3 : 0.8;
    star.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  b.add('chest', prism(star, [0, 0, cz + 1.6], [1, 0, 0], [0, 1, 0], 0.45), 'clip', { thr: 0.2 });
  b.paint('chest', cylinder([cx, cy, cz + 1.0], [cx, cy, cz + 1.4], 2.6), 'clip', { shade: 2, where: b.isMat('clip') });
}

// ---------------------------------------------------------------------------------------------- Bankai

/** Daiguren Hyōrinmaru: wings, tail, the dragon gauntlet, the claw, iced shoulders and feet, the flowers. */
function daiguren(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }): { springs: SpringDef[] } {
  const s = L.spec;
  const R = HITSUGAYA_RES;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  const springs: SpringDef[] = [];
  const shard = (base: V3, dir: V3, len: number, r: number, flat = 0.5, side?: V3) => spike(base, dir, len, r, r * flat, { side, tip: 0.25, taper: 1 });

  // ---- shoulders: jagged ice plates
  for (const k of [1, -1]) {
    const bone = k > 0 ? 'upperarm.L' : 'upperarm.R';
    b.add(bone, blend(1, ellipsoid([k * (sx + 0.6), sy + 0.6, sz], [4, 2.6, 4.2]), shard([k * (sx + 1.5), sy + 1.5, sz - 1], [k * 0.7, 0.9, -0.4], 6, 1.8), shard([k * (sx + 2.6), sy, sz + 1], [k * 1, 0.4, 0.2], 5, 1.6)), 'ice', { thr: 0.3 });
  }

  // ---- the dragon gauntlet round the right forearm and hand: a long ice head, jaws open at the fist
  const fx = -sx;
  const headSdf = blend(1.4,
    ellipsoid([fx, ey - 3, sz], [3.6, 6.5, 3.8]),
    ellipsoid([fx, wy - 1, sz + 0.6], [3.4, 4.2, 4.4]),
  );
  b.add('forearm.R', subtract(headSdf, capsule([fx, ey + 2, sz], [fx, wy + 2, sz], 1.9)), 'ice');
  // horns raking back past the elbow, a crest of spines
  for (const k of [-1, 1]) b.add('forearm.R', shard([fx + k * 2.2, wy + 3, sz - 2], [k * 0.3, 1, -0.5], 10, 1.4), 'ice', { thr: 0.3 });
  for (let i = 0; i < 4; i++) b.add('forearm.R', shard([fx - 3.2, wy + 2 + i * 2.5, sz], [-1, 0.5, 0], 3.2 - i * 0.4, 1.1), 'ice', { thr: 0.3 });
  // eyes sunk into the ice and a dark seam along the jaws
  for (const k of [-1, 1]) b.paint('forearm.R', sphere([fx + k * 1.9, wy + 1.5, sz + 3.2], 0.9), 'iceDeep');
  // jaws round the fist: upper and lower mandibles open forward, teeth
  b.add('fist.R', blend(0.8,
    capsule([fx, wy - 2, sz + 2.8], [fx, wy - 6.5, sz + 5.6], 2.2, 1.4),
    capsule([fx, wy - 2, sz - 2.2], [fx, wy - 7, sz - 3.6], 1.8, 1.1)), 'ice');
  for (const dz of [3.6, 4.8, -2.8]) b.add('fist.R', shard([fx, wy - 5, sz + dz], [0, -1, dz > 0 ? -0.3 : 0.3], 2.2, 0.7), 'ice', { thr: 0.3 });
  b.paint('fist.R', capsule([fx, wy - 1, sz + 1.8], [fx, wy - 6, sz + 3.2], 0.8), 'iceDeep', { where: b.isMat('ice') });

  // ---- the left arm sheathed in ice, ending in three long claws
  const lx = sx;
  b.add('forearm.L', blend(1.2, capsule([lx, ey - 1, sz], [lx, wy + 0.5, sz], 3.2, 2.7), shard([lx + 2.4, ey - 1, sz - 1], [1, 0.6, -0.4], 4, 1.4)), 'ice', { only: 'empty' });
  b.add('forearm.L', subtract(capsule([lx, ey - 1, sz], [lx, wy + 0.5, sz], 3.3, 2.8), capsule([lx, ey + 1, sz], [lx, wy - 1, sz], 2.5, 2.1)), 'ice');
  for (const bone of ['palm.L', 'fist.L']) {
    for (const [dx, dz] of [[-0.4, 2.4], [0.4, 0.2], [0.2, -2]] as [number, number][]) b.add(bone, shard([lx + dx, wy - 4, sz + dz * 0.8], [0.1, -1, dz * 0.08 + 0.3], 7.5, 1.1, 0.7), 'ice', { thr: 0.3 });
    b.add(bone, ellipsoid([lx, wy - 2.5, sz + 0.3], [2.4, 3, 3.2]), 'ice', { only: 'empty' });
  }

  // ---- feet: ice over the shins and three-toed claws
  for (const k of [1, -1]) {
    const shin = k > 0 ? 'shin.L' : 'shin.R';
    const foot = k > 0 ? 'foot.L' : 'foot.R';
    const hx = k * s.hip[0];
    b.add(shin, blend(1, capsule([hx, L.knee[1] - 2, 0.3], [hx, L.ankle[1] + 2, 0.4], 3.4, 2.9), shard([hx, L.knee[1] - 1, 2.6], [0, 0.8, 0.7], 3.5, 1.4)), 'ice', { thr: 0.3 });
    for (const dx of [-1.6, 0, 1.6]) b.add(foot, shard([hx + dx * k, 1.6, 4.5], [dx * 0.12 * k, -0.25, 1], 5.5, 1.2, 0.7), 'ice', { thr: 0.3 });
    b.add(foot, shard([hx, 1.5, -2.2], [0, -0.2, -1], 3.6, 1.2, 0.7), 'ice', { thr: 0.3 });
  }

  // ---- wings: each a jointed arm of ice (shoulder → wrist → tip) with long blades hanging from it like
  // the fingers of a dragon's wing, wide in the wing's plane; on a spring bone each
  const wingRoot: V3 = [3.4, s.chestY + 1, -s.chest[1] - 2.5];
  for (const k of [1, -1]) {
    const name = k > 0 ? 'wing.L' : 'wing.R';
    const root: V3 = [k * wingRoot[0], wingRoot[1], wingRoot[2]];
    b.bone(name, 'chest', root);
    const arm: V3[] = [root, [root[0] + k * 10, root[1] + 14, root[2] - 5], [root[0] + k * 22, root[1] + 26, root[2] - 10], [root[0] + k * 36, root[1] + 27, root[2] - 13], [root[0] + k * 50, root[1] + 20, root[2] - 16]];
    b.add(name, tube(arm, [3.4, 3.0, 2.6, 2.0, 1.0]), 'ice', { thr: 0.3 });
    const along = (u: number): V3 => {
      const f = u * (arm.length - 1);
      const i = Math.min(arm.length - 2, Math.floor(f));
      const t = f - i;
      return [arm[i][0] + (arm[i + 1][0] - arm[i][0]) * t, arm[i][1] + (arm[i + 1][1] - arm[i][1]) * t, arm[i][2] + (arm[i + 1][2] - arm[i][2]) * t];
    };
    // the blades: rooted inside the arm, longest at the outer end
    const blades = 8;
    for (let i = 0; i < blades; i++) {
      const u = 0.14 + (i / (blades - 1)) * 0.8;
      const p = along(u);
      const len = 15 + u * 24;
      const dir: V3 = [k * (0.15 + u * 0.45), -1, -0.1 - u * 0.12];
      const r = 2.7 - u * 0.5;
      b.add(name, spike(p, dir, len, r, r * 0.6, { side: [1, 0, 0], tip: 0.6, taper: 1 }), 'ice', { thr: 0.25 });
      // a deeper vein down each blade
      const dl = Math.hypot(...dir);
      b.paint(name, capsule(p, [p[0] + (dir[0] / dl) * len * 0.6, p[1] + (dir[1] / dl) * len * 0.6, p[2] + (dir[2] / dl) * len * 0.6], 0.7), 'iceDeep', { where: b.isMat('ice') });
    }
    springs.push({ bone: name, tail: [k * 30 / R, 10 / R, -8 / R], stiffness: 120, damping: 7, gravity: 2, limit: 18, radius: 0.1 });
  }

  // ---- the tail: four segments from the small of the back, a spike at the end
  let prev = 'hips';
  let p: V3 = [0, s.hipsY + 1, -s.hips[1] - 2];
  const segs: [number, V3][] = [[9, [0, -0.45, -1]], [9, [0, -0.7, -0.75]], [8, [0, -0.85, -0.45]], [8, [0, -0.6, -0.35]]];
  segs.forEach(([len, dir], i) => {
    const name = `tail.${i + 1}`;
    b.bone(name, prev, p);
    const dl = Math.hypot(...dir);
    const q: V3 = [p[0] + (dir[0] / dl) * len, p[1] + (dir[1] / dl) * len, p[2] + (dir[2] / dl) * len];
    const r0 = 3.2 - i * 0.6, r1 = r0 - 0.6;
    b.add(name, capsule(p, q, r0, r1), 'ice');
    b.add(name, shard([p[0], p[1] + 1, p[2] - r0 + 0.4], [0, 0.6, -1], 3 - i * 0.4, 1.2), 'ice', { thr: 0.3 });
    if (i === segs.length - 1) b.add(name, shard(q, [dir[0], dir[1], dir[2]], 7, r1 + 0.4, 0.6), 'ice', { thr: 0.3 });
    springs.push({ bone: name, tail: [(q[0] - p[0]) / R, (q[1] - p[1]) / R, (q[2] - p[2]) / R], stiffness: 60 - i * 8, damping: 4.5, gravity: 6, limit: 35, radius: 0.06 });
    prev = name;
    p = q;
  });

  // ---- the three ice flowers floating in a row behind the back: four violet petals each, one bone a petal
  b.bone('flowers', 'chest', [0, s.chestY, -s.chest[1] - 12]);
  for (let f = 0; f < 3; f++) {
    const fc: V3 = [(f - 1) * 11, s.chestY + 19, -s.chest[1] - 14];
    for (let pi = 0; pi < 4; pi++) {
      const name = `petal.${f * 4 + pi}`;
      b.bone(name, 'flowers', fc);
      const a = (pi / 4) * Math.PI * 2 + Math.PI / 4;
      const dir: V3 = [Math.cos(a), Math.sin(a), 0];
      // a flat diamond petal: wide in the middle, pointed at both ends
      const tipP: V3 = [fc[0] + dir[0] * 4.6, fc[1] + dir[1] * 4.6, fc[2]];
      const midP: V3 = [fc[0] + dir[0] * 2.2, fc[1] + dir[1] * 2.2, fc[2]];
      b.add(name, intersect(blend(0.6, capsule([fc[0] + dir[0] * 0.6, fc[1] + dir[1] * 0.6, fc[2]], midP, 0.6, 1.8), capsule(midP, tipP, 1.8, 0.3)), aabb([-40, 0, fc[2] - 0.6], [40, 90, fc[2] + 0.6])), 'petal', { thr: 0.2 });
    }
  }
  return { springs };
}

/**
 * The Hollowfied Bankai (the Shin'eiyaku, TYBW): an ice sash from the left shoulder across the chest to the right hip
 * (like Hyōrinmaru's tail wound round him), a white ice half-mask over the left eye with a hole for it, and two horns.
 */
function hollowfied(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, torso: Sdf): void {
  const s = L.spec;
  const [sx, sy] = s.shoulder;
  // the sash: the green one's mirror, a band of ice scales riding over the haori
  const p0: V3 = [sx - 0.5, sy + 3.5, 0], p1: V3 = [-s.waist[0] - 1.5, s.waistY - 3.5, 0];
  const d: V3 = [p1[0] - p0[0], p1[1] - p0[1], 0];
  const dl = Math.hypot(d[0], d[1]);
  const n: V3 = [-d[1] / dl, d[0] / dl, 0];
  const c: V3 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0];
  const w = 1.8;
  const slab = intersect(halfSpace([c[0] + n[0] * w, c[1] + n[1] * w, 0], n), halfSpace([c[0] - n[0] * w, c[1] - n[1] * w, 0], [-n[0], -n[1], 0]));
  const band = intersect(subtract(offset(torso, 3.4), offset(torso, 1.6)), slab);
  b.add('chest', intersect(band, aabb([-30, s.chestY - 7, -30], [30, 90, 30])), 'ice');
  b.add('spine', intersect(band, aabb([-30, s.hipsY - 2, -30], [30, s.chestY - 7, 30])), 'ice');
  // scales: darker chevrons along it
  b.paint(['chest', 'spine'], fn((x, y) => {
    const u = ((x - p0[0]) * d[0] + (y - p0[1]) * d[1]) / dl;
    const v = (x - c[0]) * n[0] + (y - c[1]) * n[1];
    return Math.abs((((u + Math.abs(v) * 0.8) % 2.6) + 2.6) % 2.6 - 1.3) - 0.35;
  }, [-20, s.hipsY - 4, -12], [20, s.chinY, 12]), 'iceDeep', { where: b.isMat('ice') });
  // the half-mask: a curved plate of white ice over the left half of the face, a hole for the eye, a ragged edge;
  // the fringe in front of it is pushed aside so the plate reads
  const ch = hd.chin, f = hd.front;
  b.carve('head', intersect(ellipsoid([1.8, ch + 6, f - 4.5], [5.8, 6.4, 9]), aabb([-0.6, ch - 2, f + 0.4], [9, ch + 12, f + 6])));
  const plate = intersect(
    ellipsoid([1.8, ch + 6, f - 4.5], [5.4, 6.4, 5.6]),
    fn((x, y, z) => Math.max(f - 0.6 - z, -0.2 - x + 0.9 * Math.sin(y * 1.4)), [-4, ch - 2, f - 6], [9, ch + 14, f + 3]),
  );
  b.add('head', plate, 'mask');
  // the plate outlined in pale blue so it reads against the white hair (its footprint seen from the front is an
  // ellipse 3.9 × 4.6 with the ragged inner edge), and one crack of deep ice running down from the eye hole
  const foot = (x: number, y: number) => Math.max((Math.hypot((x - 1.8) / 3.9, (y - ch - 6) / 4.6) - 1) * 3.9, -0.2 - x + 0.9 * Math.sin(y * 1.4));
  b.paint('head', fn((x, y) => { const d = foot(x, y); return Math.max(d, -d - 0.8); }, [-2, ch - 1, f - 3], [8, ch + 12, f + 3]), 'horn', { where: b.isMat('mask'), shade: 2 });
  b.paint('head', capsule([3.4, ch + 4.4, f + 1], [4, ch + 1.8, f + 1], 0.45), 'iceDeep', { where: b.isMat('mask') });
  b.carve('head', ellipsoid([2.6, ch + 5.5, f + 0.8], [1.9, 1.1, 1.8], [0, 0, 12]));
  // two horns from the temples, raking back and up past the hair
  for (const k of [-1, 1]) b.add('head', spike([k * 4.6, ch + 10.2, f - 2.6], [k * 0.45, 0.55, -0.7], 11, 1.8, 1.5, { tip: 0.2, bend: [0, 0.05, 0] }), 'horn', { thr: 0.25 });
}

// ---------------------------------------------------------------------------------------------- props

function swordMats(b: ModelBuilder): void {
  b.mat('steel', ['#EEF2F6', '#DCE3E9', '#B6C0CA', '#8F9AA6'], { base: 1, rough: 0.18, metal: 0.9, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0', '#E8EEF3'], { base: 0, rough: 0.1, metal: 0.8 });
  b.mat('bronze', ['#D9AE62', '#A97B3B', '#7E5A28', '#5A401C'], { base: 1, rough: 0.35, metal: 0.8, shadeK: 0.8 });
  b.mat('wrap', ['#A9D7F1', '#8DC8EB', '#6AA9D2', '#4D88B2'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#ECEFF2']);
  b.mat('lacquer', ['#3A568C', '#2A4373', '#1E3564', '#15264A'], { base: 2, rough: 0.3, shadeK: 0.8 });
}

/** Star guard in the XY plane at z: `points` points (4 sealed, 8 Bankai). */
function starGuard(b: ModelBuilder, z: number, points: number): void {
  const star: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 + (points === 4 ? Math.PI / 4 : 0);
    const r = i % 2 === 0 ? 5.2 : points === 4 ? 1.9 : 2.8;
    star.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  b.add('root', prism(star, [0, 0, z], [1, 0, 0], [0, 1, 0], 0.55), 'bronze', { thr: 0.2 });
  b.paint('root', cylinder([0, 0, z - 1], [0, 0, z + 1], 1.3), 'bronze', { shade: 2, where: b.isMat('bronze') });
}

/** The hilt: light-blue wrap over white rayskin, bronze collar and a ringed pommel (the Shikai chain hangs from it). */
function hilt(b: ModelBuilder, z0: number): void {
  b.add('root', box([0, 0, z0 - 7.2], [1.15, 1.3, 7.2], { round: 0.5 }), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 2.6 + 2.6) % 2.6 - 1.3) - 0.45, [-2, -2, z0 - 15], [2, 2, z0]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, z0 - 0.3], [1.3, 1.45, 0.45], { round: 0.3 }), 'bronze');
  b.add('root', box([0, 0, z0 - 14.8], [1.3, 1.45, 0.6], { round: 0.35 }), 'bronze');
  b.add('root', subtract(cylinder([0, -1.2, z0 - 16.4], [0, 1.2, z0 - 16.4], 1.6), cylinder([0, -2, z0 - 16.4], [0, 2, z0 - 16.4], 0.7)), 'bronze');
}

/**
 * Hyōrinmaru: a nodachi of 1.4 m (longer than its wielder): a straight-backed blade with a gentle curve,
 * the bronze four-pointed star guard (eight points in Bankai), light-blue hilt. Origin at the grip, blade
 * along +Z, edge toward −Y.
 */
function buildHyorinmaru(points: number): VoxelModel {
  const b = new ModelBuilder(points === 8 ? 'daiguren-blade' : 'hyorinmaru', 48);
  swordMats(b);
  b.bone('root', null, [0, 0, 0]);
  const z0 = 7.2, zEnd = 52, zTip = 56;
  const curve = (z: number) => ((z - z0) / (zTip - z0)) ** 2 * 1.8;
  b.add('root', fn((x, y, z) => {
    if (z < z0 - 0.5 || z > zTip + 0.5) return 1;
    const c = curve(z);
    const top = 1.0 + c, bot = -1.2 + c + Math.max(0, z - zEnd) * 0.55;
    return Math.max(Math.abs(x) - 0.55, y - top, bot - y, z0 - z, z - zTip);
  }, [-2, -3, z0 - 1], [2, 5, zTip + 1]), 'steel', { thr: 0.3 });
  b.paint('root', fn((x, y, z) => y - (-0.7 + curve(z) + Math.max(0, z - zEnd) * 0.55), [-2, -3, 0], [2, 5, zTip + 1]), 'edge');
  b.add('root', box([0, -0.05, z0 - 0.6], [0.9, 1.35, 0.5]), 'bronze'); // habaki
  starGuard(b, z0 - 1.7, points);
  hilt(b, z0 - 2.4);
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The dark-blue sheath with the sword in it, worn on the back. Origin at the mouth, sheath along +Z, hilt toward −Z. */
function buildSheathed(): VoxelModel {
  const b = new ModelBuilder('hyorinmaru-sheathed', 48);
  swordMats(b);
  b.bone('root', null, [0, 0, 0]);
  const len = 50;
  const curve = (z: number) => (Math.max(0, z) / len) ** 2 * 1.8;
  b.add('root', fn((x, y, z) => Math.max(Math.hypot(x / 1.05, (y - curve(z)) / 1.7) - 1.05, -z, z - len), [-2, -3, -1], [2, 5, len + 1]), 'lacquer');
  b.add('root', box([0, 0, 0.4], [1.4, 2.1, 0.6], { round: 0.3 }), 'bronze');
  b.add('root', box([0, curve(len - 0.6), len - 0.6], [1.25, 1.95, 0.7], { round: 0.4 }), 'bronze');
  // the cord fittings the sash ties to
  for (const z of [6, 34]) b.add('root', box([0, curve(z), z], [1.5, 2.1, 0.7], { round: 0.3 }), 'bronze');
  starGuard(b, -1.1, 4);
  hilt(b, -1.8);
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/** The Shikai's crescent sickle on the end of the chain: origin at the chain ring, the blade curving forward (+Z). */
function buildCrescent(): VoxelModel {
  const b = new ModelBuilder('hyorinmaru-crescent', 48);
  swordMats(b);
  b.bone('root', null, [0, 0, 0]);
  // a crescent of steel in the YZ plane, thick at the back, sharp on the inner curve
  const outer = cylinder([-0.6, 4.5, 1], [0.6, 4.5, 1], 9);
  const inner = cylinder([-2, 7.5, 4.5], [2, 7.5, 4.5], 8.4);
  b.add('root', intersect(subtract(outer, inner), halfSpace([0, 4.5, 1], [0, 0.35, -1])), 'steel', { thr: 0.2 });
  b.paint('root', subtract(cylinder([-2, 7.5, 4.5], [2, 7.5, 4.5], 9.4), inner), 'edge', { where: b.isMat('steel') });
  // the ring and a bronze collar where the chain fastens
  b.add('root', subtract(cylinder([-0.6, 0, 0], [0.6, 0, 0], 1.6), cylinder([-2, 0, 0], [2, 0, 0], 0.7)), 'bronze');
  b.add('root', box([0, 1.8, -1.2], [0.9, 1.2, 1.2], { round: 0.3 }), 'bronze');
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * The head of Hyōrinmaru's ice dragon (the Shikai's projectile): a long Chinese-dragon head of ice at
 * 24 vox/m — jaws open, fangs, two horns sweeping back, a crest of spines, deep-blue eyes. Origin at the
 * back of the skull, looking along +Z.
 */
function buildDragonHead(): VoxelModel {
  const b = new ModelBuilder('ice-dragon-head', 24);
  b.mat('ice', ['#EAF8FE', '#C9EEFB', '#8FD4F2', '#5DB4E0', '#3A8CC4'], { base: 1, rough: 0.12, metal: 0.1, shadeK: 0.85, glow: 0.9 });
  b.mat('deep', ['#3A8CC4', '#265F94'], { base: 0, rough: 0.15, glow: 1.2 });
  b.mat('fang', ['#F3F3F0', '#DDF2FB'], { base: 0, rough: 0.1, glow: 1.4 });
  b.bone('root', null, [0, 0, 0]);
  // skull and the long upper snout
  b.add('root', blend(1.5,
    ellipsoid([0, 1, 3], [4.2, 3.6, 4.6]),
    box([0, 1.6, 11], [2.6, 1.6, 6], { round: 1.2 }),
    ellipsoid([0, 1.8, 16.5], [2.8, 1.8, 1.8])), 'ice');
  // the lower jaw, hanging open
  b.add('root', blend(1, box([0, -2.6, 9], [2.2, 0.9, 6.2], { round: 0.8 }), ellipsoid([0, -1.5, 3.5], [3.2, 2, 3.2])), 'ice');
  b.carve('root', box([0, -0.8, 12], [1.8, 1.0, 7]));
  // fangs: down from the upper jaw, up from the lower
  for (const x of [-1.8, 1.8]) {
    b.add('root', spike([x, 0.4, 15.5], [0, -1, 0.2], 2.4, 0.7, 0.7, { tip: 0.3 }), 'fang', { thr: 0.2 });
    b.add('root', spike([x, -1.8, 13.5], [0, 1, 0.1], 1.8, 0.6, 0.6, { tip: 0.3 }), 'fang', { thr: 0.2 });
  }
  // horns sweeping back and up; the crest along the neck
  for (const k of [-1, 1]) b.add('root', spike([k * 2.4, 3.6, 2.5], [k * 0.4, 0.55, -1], 10, 1.3, 1.1, { bend: [0, 0.25, 0], tip: 0.3 }), 'ice', { thr: 0.25 });
  for (let i = 0; i < 4; i++) b.add('root', spike([0, 4 - i * 0.2, 4 - i * 2.4], [0, 1, -0.6], 3 - i * 0.4, 1, 0.5, { side: [0, 0, 1], tip: 0.3 }), 'ice', { thr: 0.25 });
  // whiskers trailing from the snout
  for (const k of [-1, 1]) b.add('root', spike([k * 2.4, 1, 15], [k * 0.8, -0.3, -1], 7, 0.6, 0.5, { bend: [0, -0.3, 0], tip: 0.4 }), 'ice', { thr: 0.2 });
  // eyes sunk under the brow ridge, nostrils
  for (const k of [-1, 1]) {
    b.paint('root', sphere([k * 2.8, 2.8, 7], 1.0), 'deep');
    b.paint('root', sphere([k * 1.2, 3.1, 17], 0.6), 'deep');
  }
  b.autoShade({ up: 0.4, open: 2, front: 0 });
  b.lint();
  return b.build();
}
