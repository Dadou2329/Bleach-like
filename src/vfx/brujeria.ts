// Zommari Rureaux's effects (docs/kits/zommari.md). Amor's sun mark — a dark violet sun printed on whatever his gaze
// took, bound to the limb; the purple glint of an eye about to cast (the tell); the gaze streak; the release — the
// sword left hanging level before his chest folding at right angles into a squared spiral while white foam gushes
// over him; the blood of the copies (they bleed like him); a copy vanishing into its afterimage.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

export const ZOMMARI_PINK = { core: '#FFD6EA', body: '#F27DB8', rim: '#8E2E66' };
export const AMOR_PURPLE = new THREE.Color('#A64DFF');
const AMOR_CORE = new THREE.Color('#E8CCFF');

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

let sunTex: THREE.Texture | null = null;

/** The sun mark: a dark violet disc with twelve triangular rays and a purple rim, drawn once to a canvas. */
function sunTexture(): THREE.Texture {
  if (sunTex) return sunTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  x.translate(64, 64);
  // vivid enough to read on black cloth as on white: a purple sun, a pale rim, a dark heart
  x.fillStyle = '#7A2FD0';
  x.strokeStyle = 'rgba(226, 190, 255, 0.95)';
  x.lineWidth = 5;
  x.beginPath();
  const n = 12;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 58 : 30;
    if (i === 0) x.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  x.closePath();
  x.fill();
  x.stroke();
  x.beginPath();
  x.arc(0, 0, 18, 0, Math.PI * 2);
  x.fillStyle = '#2A1438';
  x.fill();
  x.stroke();
  sunTex = new THREE.CanvasTexture(c);
  sunTex.colorSpace = THREE.SRGBColorSpace;
  return sunTex;
}

/** Where a sun mark sits on a body: the bone, and how high up the body's front (a fraction of its height). */
export const MARK_AT = {
  legL: { bone: 'shin.L', y: 0.22, side: 1 },
  legR: { bone: 'shin.R', y: 0.22, side: -1 },
  arm: { bone: 'forearm.R', y: 0.5, side: -1 },
  head: { bone: 'head', y: 0.9, side: 0 },
};

/** Amor's mark on a body: a decal bound to the limb's bone, facing out of the body's front. */
export class SunMark {
  readonly mesh: THREE.Mesh;
  private mat: THREE.MeshBasicMaterial;
  private t = 0;

  constructor(readonly target: Fighter, at: { bone: string; y: number; side: number }, size = 0.26) {
    this.mat = new THREE.MeshBasicMaterial({ map: sunTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, side: THREE.DoubleSide, opacity: 0 });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), this.mat);
    const rig = target.visual.rig;
    const bi = rig.index(at.bone);
    const bone = bi >= 0 ? rig.bones[bi] : rig.bones[0];
    bone.updateWorldMatrix(true, false);
    const fw = target.forward(_w);
    const left = _v.set(fw.z, 0, -fw.x);
    const world = new THREE.Vector3(target.pos.x, target.pos.y + target.def.height * at.y, target.pos.z)
      .addScaledVector(fw, target.def.radius * 0.8)
      .addScaledVector(left, at.side * target.def.radius * 0.35);
    bone.add(this.mesh);
    this.mesh.position.copy(bone.worldToLocal(world.clone()));
    this.mesh.lookAt(world.clone().add(fw));
    this.mesh.renderOrder = 5;
  }

  /** returns false once it has faded after `release` */
  update(dt: number, releasing: boolean): boolean {
    this.t += dt;
    if (releasing) {
      this.mat.opacity -= dt * 3;
      if (this.mat.opacity <= 0) {
        this.dispose();
        return false;
      }
      return true;
    }
    // it prints itself at once, then glows faintly
    this.mat.opacity = Math.min(0.95, this.t * 12);
    this.mesh.scale.setScalar(1 + Math.max(0, 0.4 - this.t) * 1.5);
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

/** the tell: an eye's pupil widening with a purple glint, a beat before the gaze lands */
export function amorGlint(g: Game, at: THREE.Vector3, k = 1): void {
  const glow = g.engine.glow;
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.35 * k, sizeEnd: 0.05, life: 0.3, r: AMOR_PURPLE.r, g: AMOR_PURPLE.g, b: AMOR_PURPLE.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * 1.4, vy: Math.sin(a) * 1.4, vz: 0, size: 0.16 * k, sizeEnd: 0.02, life: 0.22, r: AMOR_CORE.r, g: AMOR_CORE.g, b: AMOR_CORE.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
  }
}

/** the gaze itself: invisible in canon, here a faint purple flicker along the line it took */
export function gazeStreak(g: Game, from: THREE.Vector3, to: THREE.Vector3): void {
  const glow = g.engine.glow;
  const d = _v.subVectors(to, from);
  const len = d.length();
  d.divideScalar(len || 1);
  const n = Math.min(24, Math.ceil(len / 0.8));
  for (let i = 0; i < n; i++) {
    const p = _w.copy(from).addScaledVector(d, (i / n) * len);
    glow.spawn({ x: p.x, y: p.y, z: p.z, vx: d.x * 4, vy: d.y * 4, vz: d.z * 4, size: 0.12, sizeEnd: 0.03, life: 0.16, r: AMOR_PURPLE.r, g: AMOR_PURPLE.g, b: AMOR_PURPLE.b, alpha: 0.45, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
  }
  glow.spawn({ x: to.x, y: to.y, z: to.z, size: 0.5, sizeEnd: 0.1, life: 0.25, r: AMOR_PURPLE.r, g: AMOR_PURPLE.g, b: AMOR_PURPLE.b, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
}

/** blood from a cut (the copies bleed exactly like him) */
export function bleed(g: Game, at: THREE.Vector3, dir: THREE.Vector3, n = 10): void {
  for (let i = 0; i < n; i++)
    g.engine.dust.spawn({ x: at.x, y: at.y, z: at.z, vx: dir.x * 2 + (Math.random() - 0.5) * 3, vy: Math.random() * 2.5, vz: dir.z * 2 + (Math.random() - 0.5) * 3, size: 0.07, sizeEnd: 0.16, life: 0.6, r: 0.55, g: 0.03, b: 0.05, alpha: 0.95, alphaEnd: 0.5, tex: TEX_PUFF, gravity: -9 });
}

/** a copy gone: its afterimage flickers and fades where it stood */
export function copyVanish(g: Game, c: Fighter): void {
  c.ghosts.color.set(ZOMMARI_PINK.body);
  c.ghosts.spawn(0.5, 0.9);
  const p = c.center();
  for (let i = 0; i < 14; i++)
    g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 0.5, y: p.y + (Math.random() - 0.5) * 1.4, z: p.z + (Math.random() - 0.5) * 0.5, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 1.5, vz: (Math.random() - 0.5) * 2, size: 0.18, sizeEnd: 0.03, life: 0.4, r: 0.95, g: 0.5, b: 0.72, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
}

/** the foam that swallows him at the release */
export function foam(g: Game, f: Fighter, k = 1): void {
  const c = f.center();
  const h = f.def.height;
  for (let i = 0; i < Math.round(26 * k); i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.3 + Math.random() * 0.6;
    g.engine.dust.spawn({ x: c.x + Math.cos(a) * r, y: f.pos.y + Math.random() * h * 1.1, z: c.z + Math.sin(a) * r, vx: Math.cos(a) * 0.8, vy: 0.4 + Math.random() * 0.8, vz: Math.sin(a) * 0.8, size: 0.5 + Math.random() * 0.4, sizeEnd: 1.4 + Math.random() * 0.8, life: 1 + Math.random() * 0.8, r: 0.95, g: 0.95, b: 0.94, alpha: 0.85, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5, gravity: -1.5 });
  }
}

/**
 * Brujería folding: the sword hangs level before his chest, then bends at a right angle five times, one joint after
 * another, into a squared spiral gushing white foam. `at` follows the chest; it lives `life` seconds.
 */
export class FoldingSword implements Projectile {
  done = false;
  private group = new THREE.Group();
  private joints: THREE.Object3D[] = [];
  private t = 0;
  private mats: THREE.Material[] = [];

  constructor(private g: Game, private at: () => { pos: THREE.Vector3; yaw: number }, private life = 1.4) {
    const steel = new THREE.MeshStandardMaterial({ color: '#D3D7DB', metalness: 0.85, roughness: 0.25, emissive: '#3A2A40', emissiveIntensity: 0.4 });
    const grip = new THREE.MeshStandardMaterial({ color: '#E78FBB', roughness: 0.8 });
    const gold = new THREE.MeshStandardMaterial({ color: '#B8954A', metalness: 0.8, roughness: 0.35 });
    this.mats.push(steel, grip, gold);
    // the grip and guard on the right, the blade running to his left in six segments
    const g0 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), grip);
    g0.position.x = -0.1;
    const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.025, 12), gold);
    guard.rotation.z = Math.PI / 2;
    this.group.add(g0, guard);
    const lens = [0.2, 0.17, 0.14, 0.12, 0.1, 0.08];
    let parent: THREE.Object3D = this.group;
    for (const len of lens) {
      const j = new THREE.Object3D();
      parent.add(j);
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.035, 0.012), steel);
      m.position.x = len / 2;
      j.add(m);
      const next = new THREE.Object3D();
      next.position.x = len;
      j.add(next);
      this.joints.push(j);
      parent = next;
    }
    this.group.traverse((o) => (o.frustumCulled = false));
    g.engine.gr.scene.add(this.group);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t > 0.5 && Math.random() < 0.6) {
      const p = this.group.getWorldPosition(_v);
      g.engine.dust.spawn({ x: p.x + (Math.random() - 0.5) * 0.3, y: p.y + (Math.random() - 0.5) * 0.3, z: p.z + (Math.random() - 0.5) * 0.3, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 1.5, vz: (Math.random() - 0.5) * 2, size: 0.25, sizeEnd: 0.9, life: 0.9, r: 0.96, g: 0.96, b: 0.95, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, drag: 1.2 });
    }
    if (this.t >= this.life) this.done = true;
  }

  render(): void {
    const { pos, yaw } = this.at();
    this.group.position.copy(pos);
    this.group.rotation.set(0, yaw, 0);
    // the joints fold in turn, 90° each, into a squared spiral; the whole thing turns slowly
    this.joints.forEach((j, i) => {
      const u = Math.max(0, Math.min(1, (this.t - 0.15 - i * 0.09) / 0.12));
      j.rotation.z = u * u * (3 - 2 * u) * (Math.PI / 2);
    });
    this.group.rotateZ(Math.sin(this.t * 2) * 0.05);
    const fade = Math.min(1, Math.max(0, (this.life - this.t) / 0.3));
    this.group.scale.setScalar(Math.max(0.01, fade));
  }

  dispose(): void {
    this.group.removeFromParent();
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    for (const m of this.mats) m.dispose();
  }
}

/** El Embrion closing or opening: pink petals of light and a soft thud */
export function embrionPulse(g: Game, at: THREE.Vector3, r: number): void {
  const glow = g.engine.glow;
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1);
    const d = _v.set(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a));
    glow.spawn({ x: at.x + d.x * r, y: at.y + d.y * r, z: at.z + d.z * r, vx: d.x * 2, vy: d.y * 2, vz: d.z * 2, size: 0.25, sizeEnd: 0.04, life: 0.4, r: 0.95, g: 0.55, b: 0.75, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
  }
}
