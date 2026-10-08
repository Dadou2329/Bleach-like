// Ichigo Kurosaki in the Thousand-Year Blood War (docs/kits/ichigo.md, dossier A1 §1 looks #16-#19, weapons).
// Brief: 181 cm (the Lost Agent growth) on the standard 84-vox skeleton at 84/1.81 vox/m; the spiky orange hair with
// longer sideburns; the TYBW uniform — the shihakushō with full sleeves gathered at the wrists by black bands, two
// white plates crossing in an X over the sternum (the left-shoulder one with three red-scaled tiles, three more on a
// plate at the right waist), the white cloak tied round the waist and hanging to the shins with black jagged
// markings at the hem. Half-Hollow: one long forward-pointing horn on the left, the left eye inverted (black sclera,
// gold iris), black marks from the forehead through the left eye and cheek down the neck to a small hole at its base,
// a tattered black mantle round the shoulders. Blood Chains [anime-only]: deep-red skin, two horns, the robe hanging
// open (bare chest, white lapels) over a long ragged coat, barefoot, red chain cuffs at the neck, wrists and ankles,
// eyes glowing red. Canon asymmetries (character's left = +X): the horn and the eye marks on the left; the shoulder
// tiles on the left, the hip tiles on the right. (verify) the Half-Hollow hole's exact place, the Blood Chains skin.
import { ModelBuilder, type VoxelModel } from '../models/builder';
import { shatterModel, type Shattered } from '../models/shatter';
import { aabb, blend, box, capsule, cylinder, ellipsoid, fn, intersect, prism, sphere, spike, torus, type V3 } from '../models/sdf';
import {
  SPEC_ADULT_MALE, coatSkirt, faceLegend, feet, hakama, hands, head, humanoidSkeleton, kosodeSleeves, kosodeTorso, obi,
  shihakushoSprings, spikeHair, type Landmarks, type Spike,
} from './humanoid';
import { ICHIGO_FACE, ICHIGO_HAIR, ichigoPalette, type CharacterAsset } from './ichigo';
import type { SpringDef } from '../anim/springs';

/** 181 cm on the 84-vox skeleton */
export const TYBW_RES = 84 / 1.81;

/** shikai: the uniform (also True Bankai's body); hollow: Half-Hollowfication; chains: Blood Chains [anime-only] */
export type TybwForm = 'shikai' | 'hollow' | 'chains';

export type TybwBlade = 'large' | 'small' | 'large-white' | 'large-veins' | 'chains' | 'bankai';

/** large blade: the edge ends and the clipped point (voxels at 48/m, blade along +Z) */
export const TYBW_LARGE_TIP_Z = 70 / 48;
export const TYBW_LARGE_BASE_Z = 7 / 48;
export const TYBW_SMALL_TIP_Z = 28 / 48;
export const TYBW_SMALL_BASE_Z = 5 / 48;
export const CHAINS_TIP_Z = 72 / 48;
export const BANKAI_TIP_Z = 104 / 48;
export const BANKAI_BASE_Z = 12 / 48;

function palette(b: ModelBuilder, form: TybwForm): void {
  if (form === 'chains') {
    // the skin goes deep red (defined first: the base palette keeps it)
    b.mat('skin', ['#B23A36', '#A0302E', '#7E1E24', '#5E161B', '#4A0F14'], { base: 2, rough: 0.7, dither: 0.06 });
    b.mat('mouth', ['#3A0A0E']);
  }
  ichigoPalette(b);
  b.mat('band', ['#2E2D35', '#1E1E24', '#141418'], { base: 1, rough: 0.8 });
  b.mat('plate', ['#F3F3F0', '#E8E8EA', '#D3D5DA', '#BEC1C7'], { base: 1, rough: 0.55, shadeK: 0.8 });
  b.mat('outline', ['#1E1E22'], { rough: 0.6 });
  b.mat('scale', ['#C2444B', '#A8323A', '#7E2731', '#5B1F27'], { base: 1, rough: 0.5 });
  b.mat('grid', ['#3A1015']);
  b.mat('cloak', ['#F3F1EA', '#EDE6D6', '#DCD3C0', '#C9C0AE', '#ADA28C'], { base: 1, rough: 0.85, shadeK: 0.9, dither: 0.03 });
  b.mat('cloakIn', ['#D6CDBA', '#BDB39E', '#9E947F'], { base: 1, rough: 0.85 });
  b.mat('mark', ['#26252B', '#18181C', '#141418'], { base: 1, rough: 0.85 });
  if (form === 'hollow' || form === 'chains') {
    b.mat('horn', ['#F3F0EA', '#E6E0D6', '#CFC7BA', '#ADA597'], { base: 1, rough: 0.4, shadeK: 0.9 });
    b.mat('hstripe', ['#1E1E22', '#141418'], { base: 0, rough: 0.5 });
    b.mat('tattoo', ['#141418'], { rough: 0.8 });
    b.mat('void', ['#141418'], { rough: 0.9 });
    b.mat('hiris', ['#F2D84E'], { rough: 0.3, glow: 1.4 });
    b.mat('hirisD', ['#C9A93A'], { rough: 0.3, glow: 0.9 });
    b.mat('mantle', ['#3A3940', '#28272E', '#1C1B21', '#141418'], { base: 1, rough: 0.92, shadeK: 1, dither: 0.04 });
  }
  if (form === 'chains') {
    // the eyes glow; the chains burn
    b.mat('eyeR', ['#E81C1C'], { rough: 0.3, glow: 1.9 });
    b.mat('chain', ['#F2503A', '#D02A22', '#9A0E18'], { base: 1, rough: 0.4, glow: 1.25 });
    b.mat('lapel', ['#ECE9E4', '#D6D2CB', '#B9B5AF'], { base: 0, rough: 0.85 });
  }
}

const SIDEBURNS: Spike[] = [
  { az: -86, el: -14, len: 2.2, r: 2.4, flat: 0.55, flow: [0.05, -1.1, 0.25] },
  { az: 86, el: -14, len: 2.2, r: 2.4, flat: 0.55, flow: [-0.05, -1.1, 0.25] },
];

/**
 * Half-Hollow's face (rows 9 → 0, column 0 = his right): the scowl, the left eye inverted — black sclera round a
 * gold iris — and the black mark running down through it.
 */
const FACE_HALF = [
  '. . . . . . . . . .',
  '. b B . . . . B b .',
  '. L L B s s B L L .',
  '. W * I . . Y Y V .',
  '. W i i . . y y V .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . . m m . . . .',
  '. . . . . . . . . .',
];

/** Blood Chains [anime-only]: both eyes black with burning red irises, the mouth a grim line. */
const FACE_CHAINS = [
  '. . . . . . . . . .',
  '. b B . . . . B b .',
  '. L L B s s B L L .',
  '. V R R . . R R V .',
  '. V R R . . R R V .',
  '. . . . . . . . . .',
  '. . . . . s . . . .',
  '. . . . . . . . . .',
  '. . . m m m m . . .',
  '. . . . . . . . . .',
];

/** The full sleeves, ballooning over the forearm and gathered at the wrist by a black band. */
function puffySleeves(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const [sx, sy, sz] = s.shoulder;
  const ey = L.elbow[1], wy = L.wrist[1];
  b.add('upperarm.L', cylinder([sx + 0.6, ey - 1.2, sz - 0.4], [sx + 0.2, sy + 0.5, sz - 0.2], 4.4, 3.4, 1.4), 'black', { mirror: true });
  b.add('upperarm.L', sphere([sx, sy - 0.5, sz], 2.9), 'black', { mirror: true });
  // the forearm balloons out (more behind than in front) and narrows into the band
  const mid = (ey + wy) / 2 + 0.5;
  b.add('forearm.L', blend(1.6,
    ellipsoid([sx + 0.7, mid, sz - 1.1], [4.8, (ey - wy) / 2 + 0.2, 5.4]),
    sphere([sx + 0.3, ey, sz - 0.3], 3.8),
    cylinder([sx, wy + 1.5, sz], [sx, wy + 4, sz], 3)), 'black', { mirror: true });
  b.add('forearm.L', cylinder([sx, wy + 0.1, sz], [sx, wy + 2.4, sz], 2.55, 2.55, 0.5), 'band', { mirror: true });
  // the forearm (skin) under the band, so the hand connects
  b.add('forearm.L', capsule([sx, wy + 4, sz], [sx, wy - 0.5, sz], 1.9), 'skin', { mirror: true, only: 'empty' });
  // pipe folds down the balloon
  for (const [dz, a] of [[-4.6, 0], [3.8, 1.2]] as [number, number][]) {
    b.paint('forearm.L', capsule([sx + 4.6 - a, ey - 1.5, sz + dz * 0.6], [sx + 4.2 - a, wy + 3.2, sz + dz], 0.6), 'black', { shade: 3, mirror: true });
  }
  b.paint('upperarm.L', capsule([sx + 4.2, sy - 3, sz + 1], [sx + 4.4, ey + 1, sz + 2], 0.55), 'black', { shade: 3, mirror: true });
}

/**
 * The X of white plates: (A) left shoulder → right hip, over (B) right shoulder → left hip, with a dark outline and
 * red-scaled tiles on A's shoulder end; a short plate at the right waist carries three more tiles.
 */
function xPlates(b: ModelBuilder): void {
  const lines: { A: [number, number]; B: [number, number]; tiles: boolean }[] = [
    { A: [-7.4, 70.5], B: [9.6, 46.5], tiles: false },
    { A: [7.4, 70.5], B: [-9.6, 46.5], tiles: true },
  ];
  const half = 2.5;
  for (const ln of lines) {
    const ab = [ln.B[0] - ln.A[0], ln.B[1] - ln.A[1]];
    const abl = Math.hypot(ab[0], ab[1]);
    const t = [ab[0] / abl, ab[1] / abl];
    const n = [-t[1], t[0]];
    b.surfaceVoxels(['chest', 'spine', 'hips'], [-13, 44, -10], [13, 75, 10], (bone, x, y, z, nx, ny, nz) => {
      const px = x + 0.5 - ln.A[0], py = y + 0.5 - ln.A[1];
      const w = px * n[0] + py * n[1];
      if (Math.abs(w) > half) return;
      const along = px * t[0] + py * t[1];
      if (along < -2 || along > abl + 1) return;
      const g = b.grid(bone);
      const ox = x + nx, oy = y + ny, oz = z + nz;
      const edge = Math.abs(w) > half - 0.85;
      g.set(x, y, z, b.val('outline', 0));
      // three red-scaled tiles on the front of the shoulder end: 4 long, 1 apart; a one-voxel grid of seams
      const front = z >= 0;
      const k = along + 1;
      const tile = ln.tiles && front && !edge && k >= 0 && k < 11 && (k % 3.7) < 3;
      if (tile) {
        // the scales: a one-voxel grid of seams across each tile
        const seam = Math.round(w) === 0 && Math.floor(k) % 2 === 1;
        g.set(ox, oy, oz, b.val(seam ? 'grid' : 'scale', 'auto'));
      } else g.set(ox, oy, oz, b.val(edge ? 'outline' : 'plate', edge ? 0 : 'auto'));
    });
  }
  // the right-waist plate: three tiles stacked over the hip, below the strap's end
  b.add('hips', box([-9.4, 44, 2.6], [1.4, 3.6, 2.6], { round: 0.6 }), 'plate');
  for (let i = 0; i < 3; i++) b.paint('hips', box([-10.6, 41.6 + i * 2.4, 2.6], [0.6, 0.85, 1.9]), 'scale');
}

/** The waist cloak: white, tied over the obi, open in front, to the shins; black jagged teeth along the hem. */
function waistCloak(b: ModelBuilder, L: Landmarks): { springs: SpringDef[]; colliders: import('../anim/springs').ColliderDef[] } {
  const s = L.spec;
  const yHem = 13;
  const r = coatSkirt(b, L, { mat: 'cloak', lining: 'cloakIn', yTop: s.waistY - 1.5, yHem, r0: 9.6, r1: 12.8, openFront: 40, thick: 1.8, profile: 0.85, depth: 0.95, overlap: 4 });
  const bones = ['F.L', 'S.L', 'B.L', 'B.R', 'S.R', 'F.R'].flatMap((p) => [`coat.${p}`, `coat.${p}.2`]);
  // a jagged black line round the cloak above the hem (a saw of ~12 teeth), and short black flames rising from it
  const teeth = 12;
  const saw = (x: number, z: number) => {
    const u = ((Math.atan2(x, z + 0.6) / (Math.PI * 2) + 0.5) * teeth) % 1;
    return 1 - Math.abs(u - 0.5) * 2;
  };
  b.paint(bones, fn((x, y, z) => Math.abs(y - (yHem + 4 + saw(x, z) * 6)) - 0.75, [-16, yHem, -16], [16, yHem + 12, 16]), 'mark', { where: b.isMat('cloak') });
  b.paint(bones, fn((x, y, z) => Math.abs(y - (yHem + 2.2)) - 0.6, [-16, yHem, -16], [16, yHem + 4, 16]), 'mark', { where: b.isMat('cloak') });
  return r;
}

/** Half-Hollow: the horn, the marks down the left side of the face and neck, the hole at the base of the neck. */
function halfHollow(b: ModelBuilder, L: Landmarks, hd: { front: number; chin: number }, two = false): void {
  const s = L.spec;
  for (const sx of two ? [1, -1] : [1]) {
    // a long horn from the temple, sweeping forward and a little up
    const base: V3 = [sx * 5.4, hd.chin + 8.6, hd.front - 4];
    b.add('head', spike(base, [sx * 0.3, 0.12, 1], 17, 2.3, 2, { bend: [sx * -0.05, 0.2, 0], taper: 0.8, tip: 0.62 }), 'horn', { thr: 0.35 });
    b.add('head', sphere(base, 2), 'horn');
    // the black stripe on the outer half
    b.paint('head', fn((_x, _y, z) => hd.front + 6 - z, [sx > 0 ? 3 : -16, hd.chin + 6, hd.front], [sx > 0 ? 16 : -3, hd.chin + 20, hd.front + 18]), 'hstripe', { where: b.isMat('horn') });
  }
  // the marks: down through the left eye from the hairline, a spike across the cheek, down the jaw and the neck
  const x = 3;
  const mark = (x0: number, y0: number, x1: number, y1: number, r = 0.55) =>
    b.paint('head', capsule([x0, y0, hd.front + 0.5], [x1, y1, hd.front + 0.5], r), 'tattoo', { where: b.isMat('skin') });
  mark(x, hd.chin + 11.5, x, hd.chin + 8);
  mark(x, hd.chin + 3.5, x + 0.5, hd.chin + 0.5);
  mark(x + 1, hd.chin + 3, x + 3.4, hd.chin + 1.2);
  if (two) {
    mark(x + 1, hd.chin + 11.5, x + 1, hd.chin + 8.5);
    mark(-x, hd.chin + 11, -x, hd.chin + 8.5);
    mark(-x, hd.chin + 3.5, -x - 0.5, hd.chin + 0.8);
  }
  // down the side of the jaw and the neck to the hole
  b.paint('head', capsule([x + 1.5, hd.chin + 1, hd.front - 1], [x + 1.6, hd.chin - 1, hd.front - 3], 0.7), 'tattoo', { where: b.isMat('skin') });
  b.paint('neck', capsule([2.2, s.chinY - 1, 0.5], [1.4, s.chinY - 6, 2], 0.7), 'tattoo', { where: b.isMat('skin') });
  // the hole: a small dark pit at the base of the neck, left of centre
  b.carve('chest', box([1.2, s.chinY - 5.5, 4.2], [0.9, 0.9, 1.5]));
  b.paint('chest', box([1.2, s.chinY - 5.5, 3.2], [1.6, 1.6, 1]), 'void', { where: b.isMat('skin') });
}

/**
 * The tattered black mantle: bunched round the shoulders like a blanket thrown over them (lumpy, a jagged hem high in
 * front and lower round the sides), with three ragged tails hanging down the back to the knees (spring bones).
 */
function mantle(b: ModelBuilder, L: Landmarks): SpringDef[] {
  const s = L.spec;
  const c: V3 = [0, 65, -1.2];
  const jag = (th: number, n: number) => {
    const u = ((th / (Math.PI * 2) + 0.5) * n) % 1;
    return Math.abs(u - 0.5) * 2;
  };
  // the bunching: a slow bulge round the shoulders
  const lump = (x: number, y: number, z: number) => 0.06 * Math.sin(x * 0.55 + z * 0.3) * Math.cos(y * 0.45 - x * 0.2) + 0.04 * Math.sin(z * 0.8 + y * 0.3);
  const shell = fn((x, y, z) => {
    const ex = x / 13.6, ey = (y - c[1]) / 10.5, ez = (z - c[2]) / 9.8;
    const r = Math.hypot(ex, ey, ez) - lump(x, y, z);
    const d = (r - 1) * 9.6;
    const inner = -(r - 0.86) * 9.6;
    const th = Math.atan2(x, z - c[2]);
    // the hem: high over the chest, dropping round the sides and the back; torn into points
    const side = 1 - Math.abs(Math.cos(th));
    const back = Math.max(0, -Math.cos(th));
    const hem = 60.5 - side * 4 - back * 4 + jag(th, 13) * 3.2;
    const neck = 4.5 - Math.hypot(x, z - c[2] + 0.4);
    return Math.max(d, inner, hem - y, y - (s.chinY - 0.5), neck);
  }, [-17, 46, -14], [17, 76, 12]);
  b.add('chest', shell, 'mantle');
  // folds radiating from the neck
  for (const a of [-2.2, -1.5, -0.8, -0.25, 0.3, 0.9, 1.6, 2.3]) {
    b.paint('chest', capsule([Math.sin(a) * 6, 70.5, c[2] + Math.cos(a) * 5], [Math.sin(a) * 13.4, 57, c[2] + Math.cos(a) * 9.8], 0.65), 'mantle', { shade: 3, where: b.isMat('mantle') });
  }
  // three ragged tails hanging from the shoulder blades down to the knees
  const springs: SpringDef[] = [];
  const tails: [string, number, number, number][] = [['mtail.L', 6.2, 3.8, 30], ['mtail.C', 0, 4.4, 26], ['mtail.R', -6.2, 3.8, 32]];
  tails.forEach(([name, x0, w0, yEnd], i) => {
    const top: V3 = [x0, 60, -9.4];
    b.bone(name, 'chest', top);
    const tail = fn((x, y, z) => {
      const k = (60 - y) / (60 - yEnd);
      const w = w0 * (1 - k * 0.35);
      const u = ((x - x0 + 6) / 2.3) % 1;
      const hem = yEnd + Math.abs(u - 0.5) * 7 + (i === 1 ? 2 : 0);
      return Math.max(Math.abs(x - x0) - w, Math.abs(z + 10 + (60 - y) * 0.1) - 0.9, y - 61, hem - y);
    }, [x0 - 7, yEnd - 2, -16], [x0 + 7, 62, -7]);
    b.add(name, tail, 'mantle', { thr: 0.2 });
    // a long fold down the middle
    b.paint(name, capsule([x0 + 0.5, 58, -11], [x0 - 0.5, yEnd + 6, -13.4], 0.6), 'mantle', { shade: 3, where: b.isMat('mantle') });
    springs.push({ bone: name, tail: [0, -(60 - yEnd) / 48, -0.06], stiffness: 36, damping: 4.2, gravity: 11, limit: 70, radius: 0.08 });
  });
  return springs;
}

/** Bare feet (Blood Chains): the skin foot shapes of the tabi, no sandal. */
function bareFeet(b: ModelBuilder, L: Landmarks): void {
  const [ax, ay, az] = L.ankle;
  const f = L.spec.foot;
  const toeZ = az + f.len - f.heel;
  b.add('foot.L', capsule([ax, ay + 3, az - 0.5], [ax, ay - 1, az - 0.5], 2.2), 'skin', { mirror: true });
  b.add('foot.L', intersect(
    box([ax, 1.6, az + (f.len / 2 - f.heel)], [f.w / 2 - 0.2, 1.6, f.len / 2], { round: 1.2 }),
    fn((_x, y, z) => y - (3.6 - Math.max(0, z - (toeZ - 4)) * 0.45), [ax - 4, -1, az - 5], [ax + 4, 5, toeZ + 2]),
  ), 'skin', { mirror: true });
  // toes: four notches
  for (let i = 0; i < 3; i++) b.carve('foot.L', aabb([ax - 1.6 + i * 1.2, 0, toeZ - 1.5], [ax - 1.1 + i * 1.2, 1.4, toeZ + 1]), { mirror: true });
}

/** Blood Chains: red chain cuffs of interlocking links at the neck, both wrists and both ankles. */
function chainCuffs(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const ring = (bone: string, c: V3, R: number, n: number, mirror: boolean) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const p: V3 = [c[0] + Math.sin(a) * R, c[1] + (i % 2 ? 0.4 : -0.4), c[2] + Math.cos(a) * R];
      b.add(bone, torus(p, 1.05, 0.42, [i % 2 ? 0 : 90, (a * 180) / Math.PI, 0]), 'chain', { thr: 0.2, mirror });
    }
  };
  ring('neck', [0, s.chinY - 3.5, -0.8], 3.6, 10, false);
  const [wx, wy, wz] = L.wrist;
  ring('forearm.L', [wx, wy + 1.4, wz], 2.9, 8, true);
  const [ax, ay, az] = L.ankle;
  ring('shin.L', [ax, ay + 3.4, az - 0.4], 3.1, 8, true);
}

/** The Blood Chains robe: the kosode hanging open down the middle — bare chest, white lapels. */
function openRobe(b: ModelBuilder, L: Landmarks): void {
  const s = L.spec;
  const o = { black: 'black', collar: 'lapel', skin: 'skin', obi: 'obi' };
  kosodeTorso(b, L, o);
  // the opening: a strip from the neck to the obi, wider at the chest
  const open = (y: number) => 3.6 + Math.max(0, y - s.waistY) * 0.12;
  b.paint(['chest', 'spine'], fn((x, y, z) => Math.max(Math.abs(x) - open(y), 1.5 - z), [-9, s.waistY - 2, 0], [9, s.chinY, 12]), 'skin', { where: b.isMat('black', 'lapel') });
  // white lapels along both edges
  b.paint(['chest', 'spine'], fn((x, y, z) => Math.max(Math.abs(Math.abs(x) - open(y) - 0.7) - 0.7, 1.5 - z), [-11, s.waistY - 2, 0], [11, s.chinY - 1, 12]), 'lapel', { where: b.isMat('black') });
  // ragged sleeves: the kosode's, the cuffs notched
  kosodeSleeves(b, L, o);
  const [sx, , sz] = s.shoulder;
  const wy = L.wrist[1];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    b.carve('forearm.L', box([sx + 0.8 + Math.sin(a) * 4.6, wy + 0.4, sz - 0.6 + Math.cos(a) * 4.6], [0.9, 1.6, 0.9], { rot: [0, (a * 180) / Math.PI, 20] }), { mirror: true });
  }
}

/** The facial pixel art and nose. */
function face(b: ModelBuilder, form: TybwForm, hd: { front: number; x0: number; chin: number }): void {
  const base = faceLegend({ skin: 'skin', brow: 'brow', lid: 'lid', sclera: 'sclera', iris: 'iris', pupil: 'irisD', hi: 'hi', mouth: 'mouth' });
  if (form === 'hollow') {
    b.stamp('head', hd.x0, hd.chin + 9, FACE_HALF, { ...base, V: { mat: 'void' }, Y: { mat: 'hiris' }, y: { mat: 'hirisD' } }, hd.front - 1);
  } else if (form === 'chains') {
    b.stamp('head', hd.x0, hd.chin + 9, FACE_CHAINS, { ...base, V: { mat: 'void' }, R: { mat: 'eyeR' } }, hd.front - 1);
  } else b.stamp('head', hd.x0, hd.chin + 9, ICHIGO_FACE, base, hd.front - 1);
  b.voxel('head', 0, hd.chin + 3, hd.front, 'skin', 1);
}

const assetCache = new Map<TybwForm, CharacterAsset>();

/** Cached builds (form swaps must not re-run the DSL mid-fight). */
export function tybwAsset(form: TybwForm): CharacterAsset {
  let a = assetCache.get(form);
  if (!a) assetCache.set(form, (a = buildIchigoTybw(form)));
  return a;
}

export function buildIchigoTybw(form: TybwForm = 'shikai'): CharacterAsset {
  const b = new ModelBuilder(`ichigo-tybw-${form}`, TYBW_RES);
  palette(b, form);
  const s = SPEC_ADULT_MALE;
  const L = humanoidSkeleton(b, s, { sleeves: true, hakama: true });
  b.socket('grip.R', 'fist.R', [-L.wrist[0] + 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('grip.L', 'fist.L', [L.wrist[0] - 0.1, L.wrist[1] - 4.3, L.wrist[2] + 0.4]);
  b.socket('palm.R', 'palm.R', [-L.wrist[0], L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('palm.L', 'palm.L', [L.wrist[0], L.wrist[1] - 5, L.wrist[2] + 1]);
  b.socket('back', 'chest', [1, 62, -8.5]);
  b.socket('hip.R', 'hips', [-9.6, 46, 3.2], [-10, 0, 8]);
  b.socket('head.top', 'head', [0, 86, 0]);
  b.socket('face', 'head', [0, s.chinY + 5.5, Math.round(L.headC[2] + s.head.d / 2)]);
  b.socket('horn', 'head', [5.4 + 0.3 * 14, s.chinY + 8.6 + 0.12 * 14 + 2.4, Math.round(L.headC[2] + s.head.d / 2) - 4 + 14]);
  b.socket('chest.front', 'chest', [0, 61, 7]);
  b.socket('neck', 'neck', [0, s.chinY - 3.5, 1]);

  const hd = head(b, L, 'skin');
  b.bone('bangs', 'head', [0, s.chinY + 0.5, -0.8]);
  spikeHair(b, L, 'hair', [...ICHIGO_HAIR, ...SIDEBURNS], [], { tufts: 46 });
  b.carve(['head', 'bangs'], aabb([-5, hd.chin + 4, hd.front], [-1, hd.chin + 7, hd.front + 6]));
  b.carve(['head', 'bangs'], aabb([1, hd.chin + 4, hd.front], [5, hd.chin + 7, hd.front + 6]));
  face(b, form, hd);
  hands(b, L, 'skin');

  const springs: SpringDef[] = [];
  const colliders: import('../anim/springs').ColliderDef[] = [];
  const base = shihakushoSprings();
  if (form === 'chains') {
    bareFeet(b, L);
    openRobe(b, L);
    obi(b, L, { black: 'black', collar: 'lapel', skin: 'skin', obi: 'black' });
    hakama(b, L, { black: 'black', collar: 'lapel', skin: 'skin', obi: 'black', hemR: 7.6 });
    const coat = coatSkirt(b, L, { mat: 'black', lining: 'mantle', tatter: true, tatterDepth: 7, openFront: 26, r0: 9.6, r1: 14.5, yHem: 6, thick: 1.15 });
    halfHollow(b, L, hd, true);
    chainCuffs(b, L);
    springs.push(...base.springs, ...coat.springs);
    colliders.push(...base.colliders, ...coat.colliders);
  } else {
    feet(b, L, 'tabi', 'straw', 'cord');
    const o = { black: 'black', collar: 'collar', skin: 'skin', obi: 'obi' };
    kosodeTorso(b, L, o);
    puffySleeves(b, L);
    obi(b, L, o);
    hakama(b, L, o);
    xPlates(b);
    const cloak = waistCloak(b, L);
    springs.push(...base.springs.filter((sp) => !sp.bone.startsWith('sleeve')), ...cloak.springs);
    colliders.push(...base.colliders, ...cloak.colliders);
    if (form === 'hollow') {
      halfHollow(b, L, hd);
      springs.push(...mantle(b, L));
    }
  }
  b.autoShade();
  b.lint();
  return { model: b.build(), springs, colliders, warnings: b.warnings };
}

// ------------------------------------------------------------------------------------------------ the blades

const propCache = new Map<TybwBlade, VoxelModel>();

export function tybwBlade(kind: TybwBlade): VoxelModel {
  let m = propCache.get(kind);
  if (!m) {
    m = kind === 'small' ? buildSmallBlade()
      : kind === 'chains' ? buildChainsBlade()
      : kind === 'bankai' ? buildTrueBankai()
      : buildLargeBlade(kind === 'large' ? 'black' : kind === 'large-white' ? 'white' : 'veins');
    propCache.set(kind, m);
  }
  return m;
}

let bankaiBroken: Shattered | null = null;

/** True Bankai's shell breaking: the shards it falls into (cached). */
export function bankaiShell(): Shattered {
  return (bankaiBroken ??= shatterModel(tybwBlade('bankai'), { pieces: 12, seed: 23, crack: '#2A2238', jitter: 1.4, levels: [0.5] }));
}

/** A diagonal white cloth wrap over a handle segment (z0 → z1, radius r). */
function wrapHandle(b: ModelBuilder, z0: number, z1: number, r: number, mat: string): void {
  b.add('root', box([0, 0, (z0 + z1) / 2], [r, r + 0.15, (z1 - z0) / 2], { round: 0.6 }), mat);
  b.paint('root', fn((x, y, z) => Math.cos((z + y * 0.9) * 1.25), [-3, -3, z0], [3, 3, z1]), mat, { shade: 2, where: b.isMat(mat) });
}

/**
 * The large blade of the true Shikai (Hollow + Shinigami): a pure-black khyber-knife cleaver like the original — the
 * grip at the blade's base and a handle reaching back about a forearm — with a thin slot along the back edge from the
 * base to mid-blade. Local frame as Zangetsu: grip at the origin, blade along +Z, edge toward −Y, flats ±X.
 * White: Half-Hollowfication bleaches it; veins: the moment it soaks Yhwach's reiatsu (Blut veins crawl over it).
 */
function buildLargeBlade(look: 'black' | 'white' | 'veins'): VoxelModel {
  const b = new ModelBuilder(`tybw-large-${look}`, 48);
  if (look === 'black') {
    b.mat('blade', ['#3A3D44', '#26282E', '#1A1B20', '#141418'], { base: 2, rough: 0.3, metal: 0.65, shadeK: 0.65 });
    b.mat('edge', ['#6A707C', '#4D525C'], { base: 0, rough: 0.18, metal: 0.85 });
  } else {
    b.mat('blade', ['#F3F3F0', '#E4E3DE', '#C9C6BE', '#A7A49D'], { base: 1, rough: 0.32, metal: 0.4, shadeK: 0.65 });
    b.mat('edge', ['#CFD6E0', '#AEB6C4'], { base: 0, rough: 0.15, metal: 0.8 });
  }
  b.mat('vein', ['#E6FBFF', '#9CDFF1'], { base: 1, rough: 0.3, glow: 2.2 });
  b.mat('cloth', ['#F3F1EC', '#E6E2DA', '#C9C4BA', '#A9A398'], { base: 1, rough: 0.9 });
  b.mat('cap', ['#2A2B31', '#18181C'], { base: 1, rough: 0.4, metal: 0.6 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6, zEdgeEnd = 62, zTip = 70;
  const yS = 5, yE = -5.5;
  const outline = prism([[z0, yE], [zEdgeEnd, yE], [zTip, yS - 0.5], [zTip - 3, yS], [z0, yS]], [0, 0, 0], [0, 0, 1], [0, 1, 0], 1.6);
  const bevel = fn((x, y) => Math.abs(x) - (0.55 + Math.max(0, Math.min(1, (y - yE) / ((yS - yE) * 0.55))) * 1.0), [-2, -7, 0], [2, 7, 80]);
  b.add('root', intersect(outline, bevel), 'blade');
  b.paint('root', fn((x, y, z) => y - (yE + 1.1 + Math.max(0, z - zEdgeEnd) * ((yS - yE) / (zTip - zEdgeEnd))), [-3, -7, 0], [3, 7, 80]), 'edge');
  // the slot along the back edge, base to mid-blade
  b.carve('root', box([0, yS - 1.6, 24], [3, 0.55, 14]));
  // the collar where the blade meets the hilt
  b.add('root', box([0, -0.2, 5.4], [1.9, 2.6, 0.9], { round: 0.5 }), 'cap');
  // the hilt: the grip and the handle reaching back a forearm, wrapped in white cloth; a black cap at the end
  wrapHandle(b, -16, 4.6, 1.45, 'cloth');
  b.add('root', box([0, 0, -16.9], [1.7, 1.75, 0.8], { round: 0.6 }), 'cap');
  if (look === 'veins') {
    // the Blut veins crawling over the bleached blade: branching lines from the hilt toward the point
    b.paint('root', fn((x, y, z) => {
      const v1 = Math.abs(y - (Math.sin(z * 0.23) * 2.6 - 0.8)) - 0.5;
      const v2 = Math.abs(y - (Math.sin(z * 0.17 + 2) * 3.2 + 1.2)) - 0.45 + Math.max(0, z - 50) * 0.08;
      const v3 = Math.abs(y - (-2.8 + Math.sin(z * 0.31 + 1) * 1.4)) - 0.4 + Math.max(0, z - 36) * 0.1;
      return Math.min(v1, v2, v3);
    }, [-3, -7, 6], [3, 7, 66]), 'vein', { where: b.isMat('blade') });
  }
  b.autoShade({ up: 0.4, open: 2.2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * The small blade of the true Shikai (the Quincy power): about an arm long, a black trench knife — the back of the
 * point curving in — with an enclosed knuckle guard round the white-wrapped grip. Local frame as the large one.
 */
function buildSmallBlade(): VoxelModel {
  const b = new ModelBuilder('tybw-small', 48);
  b.mat('blade', ['#3A3D44', '#26282E', '#1A1B20', '#141418'], { base: 2, rough: 0.3, metal: 0.65, shadeK: 0.65 });
  b.mat('edge', ['#6A707C', '#4D525C'], { base: 0, rough: 0.18, metal: 0.85 });
  b.mat('cloth', ['#F3F1EC', '#E6E2DA', '#C9C4BA', '#A9A398'], { base: 1, rough: 0.9 });
  b.mat('guard', ['#34363C', '#202126', '#141418'], { base: 1, rough: 0.35, metal: 0.65 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 4.5, zE = 23, zT = 28.5;
  const outline = prism([[z0, -2.8], [zE, -2.6], [zT, 0.6], [zT - 1.5, 1.6], [zE - 3, 2.6], [z0, 2.6]], [0, 0, 0], [0, 0, 1], [0, 1, 0], 1.1);
  const bevel = fn((x, y) => Math.abs(x) - (0.5 + Math.max(0, Math.min(1, (y + 2.8) / 3)) * 0.65), [-2, -4, 0], [2, 4, 32]);
  b.add('root', intersect(outline, bevel), 'blade');
  b.paint('root', fn((x, y, z) => y - (-2.0 + Math.max(0, z - zE) * 0.55), [-3, -4, 0], [3, 4, 32]), 'edge');
  // the hilt
  wrapHandle(b, -5.5, 4, 1.3, 'cloth');
  b.add('root', box([0, 0, -6.1], [1.5, 1.6, 0.7], { round: 0.5 }), 'guard');
  b.add('root', box([0, -0.2, 4.3], [1.6, 3, 0.7], { round: 0.4 }), 'guard');
  // the knuckle bow: from the blade's base, round in front of the fingers (−Y), back to the butt
  const bow: V3[] = [[0, -2.8, 4.2], [0, -4.6, 2.6], [0, -5.1, -0.6], [0, -4.6, -3.8], [0, -2.6, -6]];
  for (let i = 0; i < bow.length - 1; i++) b.add('root', capsule(bow[i], bow[i + 1], 0.75), 'guard', { thr: 0.2 });
  b.autoShade({ up: 0.4, open: 2.2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * Blood Chains' sword [anime-only]: a big silver cleaver, a black fuller from the hilt down most of the blade, a flat
 * sheared-off tip (no point), a white handle that looks melted and dripping, the root of the red tassel at the butt.
 */
function buildChainsBlade(): VoxelModel {
  const b = new ModelBuilder('tybw-chains', 48);
  b.mat('blade', ['#E3E5EA', '#C9CCD2', '#A9ADB5', '#8E939C'], { base: 1, rough: 0.25, metal: 0.8, shadeK: 0.6 });
  b.mat('fuller', ['#2A2B30', '#1C1C21', '#141418'], { base: 1, rough: 0.4, metal: 0.5 });
  b.mat('edge', ['#F0F2F5'], { rough: 0.12, metal: 0.9 });
  b.mat('handle', ['#F3F1EC', '#EDEAE4', '#D2CEC6', '#B5B0A6'], { base: 1, rough: 0.6 });
  b.mat('tassel', ['#E0302A', '#B0101C', '#7A0A12'], { base: 1, rough: 0.6, glow: 1.2 });
  b.bone('root', null, [0, 0, 0]);
  const z0 = 6, zT = 72, yS = 6, yE = -6;
  // the sheared tip: cut on a shallow slant, square in section
  const outline = prism([[z0, yE], [zT, yE], [zT - 3, yS], [z0, yS]], [0, 0, 0], [0, 0, 1], [0, 1, 0], 1.8);
  const bevel = fn((x, y) => Math.abs(x) - (0.6 + Math.max(0, Math.min(1, (y - yE) / 5)) * 1.2), [-3, -8, 0], [3, 8, 80]);
  b.add('root', intersect(outline, bevel), 'blade');
  b.paint('root', fn((x, y) => y - (yE + 0.9), [-3, -8, 0], [3, 8, 80]), 'edge');
  // the fuller: a dark recessed channel along the middle, from the hilt down most of the blade
  b.carve('root', fn((x, y, z) => Math.max(Math.abs(y - 1) - 1.2, z - 58, 8 - z, 1.4 - Math.abs(x)), [-3, -2, 7], [3, 4, 60]));
  b.paint('root', fn((x, y, z) => Math.max(Math.abs(y - 1) - 1.6, z - 58.5, 7.5 - z), [-3, -2, 7], [3, 4, 60]), 'fuller');
  // the white handle, lumpy where it "drips"
  b.add('root', blend(0.8, box([0, 0, -3.5], [1.6, 1.7, 9.4], { round: 0.7 }), sphere([1.2, -1.4, 2], 1.1), sphere([-1, -1.6, -2.6], 1.2), sphere([0.6, -1.8, -7], 1), capsule([1.4, -1.2, -4.5], [1.6, -2.6, -5.5], 0.6)), 'handle');
  b.add('root', box([0, 0, 5.4], [2.1, 6.2, 0.8], { round: 0.5 }), 'handle');
  // the tassel's root: a knot of red cord at the butt
  b.add('root', sphere([0, -0.6, -13.6], 1.5), 'tassel');
  b.add('root', capsule([0, -1, -14.4], [0, -4.6, -17], 0.9, 0.6), 'tassel', { thr: 0.2 });
  b.autoShade({ up: 0.4, open: 2.2, front: 0 });
  b.lint();
  return b.build();
}

/**
 * True Tensa Zangetsu: a colossal white-shelled cleaver ≈2.3 m. The small black blade is its core (a dark band down
 * the middle with a violet sheen); a katana handle with a dark wrap; the base cut on a slant with a guard section
 * jutting from the underside; a chain fixed at the guard, looping over the back of the blade to just before the point.
 */
function buildTrueBankai(): VoxelModel {
  const b = new ModelBuilder('tybw-bankai', 48);
  b.mat('shell', ['#EDEEF0', '#E1E3E8', '#CCD0D8', '#B9BEC8', '#9EA4B0'], { base: 1, rough: 0.35, metal: 0.35, shadeK: 0.6 });
  b.mat('edge', ['#F3F3F0'], { rough: 0.12, metal: 0.8 });
  b.mat('core', ['#3A3448', '#2A2238', '#1C1726', '#141418'], { base: 1, rough: 0.3, metal: 0.6 });
  b.mat('wrap', ['#3A2A2E', '#24191C', '#161114'], { base: 1, rough: 0.85 });
  b.mat('ray', ['#5A2A30']);
  b.mat('steel', ['#3E4048', '#25262C', '#18181C'], { base: 1, rough: 0.35, metal: 0.7 });
  b.mat('chain', ['#4A4C54', '#2E2F35', '#1E1E22'], { base: 1, rough: 0.35, metal: 0.8 });
  b.bone('root', null, [0, 0, 0]);
  const zSpine = 9, zEdge = 15, zEnd = 96, zTip = 104;
  const yS = 8.5, yE = -8;
  // the base slants from the spine (further back) to the edge; the point clipped like the original
  const outline = prism([[zEdge, yE], [zEnd, yE], [zTip, yS - 1.5], [zTip - 4, yS], [zSpine, yS]], [0, 0, 0], [0, 0, 1], [0, 1, 0], 2.2);
  const bevel = fn((x, y) => Math.abs(x) - (0.7 + Math.max(0, Math.min(1, (y - yE) / 7)) * 1.5), [-3, -10, 0], [3, 10, 110]);
  b.add('root', intersect(outline, bevel), 'shell');
  b.paint('root', fn((x, y, z) => y - (yE + 1 + Math.max(0, z - zEnd) * ((yS - yE) / (zTip - zEnd))), [-4, -10, 0], [4, 10, 110]), 'edge');
  // the black core showing as a band down the middle, to three quarters of the length
  b.paint('root', fn((x, y, z) => Math.max(Math.abs(y - 1.6) - 2.2, z - 80, 12 - z), [-4, -2, 10], [4, 6, 82]), 'core');
  // the guard section jutting from the underside at the base
  b.add('root', box([0, yE - 2.2, zEdge + 1.5], [1.9, 3, 3.2], { round: 0.6 }), 'steel');
  b.add('root', box([0, 0, zSpine + 0.4], [2.2, 3.5, 1.2], { round: 0.5 }), 'steel');
  // the katana handle: a dark wrap with diamonds
  b.add('root', box([0, 0, -1], [1.35, 1.45, 10], { round: 0.55 }), 'wrap');
  b.paint('root', fn((x, y, z) => Math.abs(((Math.abs(y) + z) % 3 + 3) % 3 - 1.5) - 0.55, [-2, -2, -11], [2, 2, 9]), 'ray', { where: b.isMat('wrap') });
  b.add('root', box([0, 0, -11.6], [1.6, 1.7, 0.8], { round: 0.5 }), 'steel');
  // the chain: from the guard round under the base and up, looping over the back of the blade to just before the point
  const pts: V3[] = [];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const z = zSpine + 2 + u * (zTip - 9 - zSpine - 2);
    const sag = Math.sin(u * Math.PI) * 5.5;
    pts.push([0, yS + 1.2 + sag, z]);
  }
  pts.unshift([0, yE - 4.6, zEdge + 1.5], [0, yE - 4, zEdge - 3], [0, 0, zSpine - 2.5], [0, yS + 1.2, zSpine + 1]);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[Math.min(pts.length - 1, i + 1)];
    const dz = q[2] - p[2], dy = q[1] - p[1];
    const pitch = (Math.atan2(-dy, dz) * 180) / Math.PI;
    b.add('root', torus(p, 1.25, 0.45, i % 2 ? [pitch, 0, 0] : [pitch, 90, 0]), 'chain', { thr: 0.25 });
  }
  b.add('root', capsule(pts[pts.length - 1], [0, yS, zTip - 9], 0.6), 'chain', { thr: 0.2 });
  b.autoShade({ up: 0.4, open: 2.4, front: 0 });
  b.lint();
  return b.build();
}

/** Sanity numbers for tests/QA. */
export function tybwStats(a: CharacterAsset): { voxels: number; bones: number } {
  let voxels = 0;
  a.model.grids.forEach((g) => (voxels += g.count()));
  return { voxels, bones: a.model.bones.length };
}

