// Senbonzakura Kageyoshi set pieces: the two rows of giant blades that rise from the ground at the
// Bankai and shatter into the petal ocean; Senkei's rings of glowing swords that close around a target
// and fly in unison (Ikka Senjinka); Shūkei: Hakuteiken's white wings and halo. The blades are the
// Senbonzakura voxel model scaled up, so they match the art of the sword in his hand.
import * as THREE from 'three';
import type { VoxelModel } from '../models/builder';
import { PropMesh } from '../game/characterFactory';
import { TEX_GLOW, type SpriteSystem } from './sprites';

const _v = new THREE.Vector3();

/** Two rows of giant blades rising beside him (point up), then shattering. */
export class BankaiBlades {
  readonly group = new THREE.Group();
  private blades: { mesh: PropMesh; base: THREE.Vector3; delay: number }[] = [];
  private t = 0;
  done = false;
  constructor(model: VoxelModel, origin: THREE.Vector3, yaw: number, readonly scale = 1, perRow = 9, readonly len = 5.25) {
    const fw = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const side = new THREE.Vector3(fw.z, 0, -fw.x);
    for (const s of [-1, 1]) {
      for (let i = 0; i < perRow; i++) {
        const along = (i - (perRow - 1) / 2) * 1.6;
        const base = origin.clone().addScaledVector(side, s * (3.2 + Math.abs(along) * 0.12)).addScaledVector(fw, along);
        const m = new PropMesh(model);
        m.scale.setScalar(scale * (0.8 + Math.random() * 0.35));
        // blade along +Z in the model: point it up, flats facing across the rows
        m.rotation.order = 'YXZ';
        m.rotation.set(-Math.PI / 2, yaw + Math.PI / 2 + (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.12);
        m.position.copy(base);
        m.position.y -= this.len * scale * 1.1;
        m.material.userData.uniforms.uEnergy.value.set(1, 0.72, 0.85, 0.18);
        this.group.add(m);
        this.blades.push({ mesh: m, base, delay: Math.abs(along) * 0.035 + Math.random() * 0.08 });
      }
    }
  }

  /** Rise over ~0.6 s each, staggered from the middle outward. */
  update(dt: number): void {
    this.t += dt;
    for (const b of this.blades) {
      const k = Math.max(0, Math.min(1, (this.t - b.delay) / 0.6));
      const e = 1 - (1 - k) ** 3;
      b.mesh.position.y = b.base.y - this.len * this.scale * 1.1 * (1 - e) - 0.4 * e;
    }
  }

  /** World points along the blades (petal spawn sites at the shatter). */
  sample(i: number, out: THREE.Vector3): THREE.Vector3 {
    const b = this.blades[i % this.blades.length];
    const u = Math.random();
    out.copy(b.mesh.position);
    out.y += u * this.len * b.mesh.scale.z;
    out.x += (Math.random() - 0.5) * 0.4;
    out.z += (Math.random() - 0.5) * 0.4;
    return out;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const b of this.blades) b.mesh.material.dispose();
  }
}

/**
 * Senkei: rings of glowing swords around a centre, rotating; then every sword turns on the target and
 * flies in waves (Ikka Senjinka).
 */
export interface SenkeiSword {
  mesh: PropMesh;
  ring: number;
  angle: number;
  /** 0 = in the ring, 1 = turned on the target and waiting, 2 = flying, 3 = arrived */
  state: 0 | 1 | 2 | 3;
  t: number;
  from: THREE.Vector3;
}

export class SenkeiSwords {
  readonly group = new THREE.Group();
  readonly swords: SenkeiSword[] = [];
  private t = 0;
  private radius: number;

  constructor(model: VoxelModel, readonly center: THREE.Vector3, rings = 4, perRing = 14, radius = 7) {
    this.radius = radius;
    for (let r = 0; r < rings; r++) {
      for (let i = 0; i < perRing; i++) {
        const m = new PropMesh(model);
        m.scale.setScalar(1.35);
        m.material.userData.uniforms.uEnergy.value.set(1, 0.82, 0.9, 0.85);
        this.group.add(m);
        this.swords.push({ mesh: m, ring: r, angle: (i / perRing) * Math.PI * 2 + r * 0.3, state: 0, t: 0, from: new THREE.Vector3() });
      }
    }
    this.update(0, center, null);
  }

  /** Advance the rings and the flying swords; `target` is where launched swords converge. */
  update(dt: number, target: THREE.Vector3, glow: SpriteSystem | null): void {
    this.t += dt;
    for (const s of this.swords) {
      if (s.state <= 1) {
        const dir = s.ring % 2 === 0 ? 1 : -1;
        const a = s.angle + this.t * 0.35 * dir;
        const r = this.radius + s.ring * 0.9;
        s.mesh.position.set(this.center.x + Math.cos(a) * r, this.center.y + 0.6 + s.ring * 0.75, this.center.z + Math.sin(a) * r);
        if (s.state === 0) s.mesh.rotation.set(Math.PI / 2, 0, -a); // upright, point down, edge to the centre
        else s.mesh.lookAt(target); // turned on the target
        if (s.state === 1) {
          s.t += dt;
          if (s.t >= 0) {
            s.state = 2;
            s.t = 0;
            s.from.copy(s.mesh.position);
          }
        }
        continue;
      }
      if (s.state === 2) {
        s.t += dt;
        const k = Math.min(1, s.t / 0.32);
        s.mesh.position.lerpVectors(s.from, target, k * k);
        s.mesh.lookAt(target);
        if (glow && Math.random() < 0.6) glow.spawn({ x: s.mesh.position.x, y: s.mesh.position.y, z: s.mesh.position.z, size: 0.35, sizeEnd: 0.05, life: 0.18, r: 1, g: 0.75, b: 0.86, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
        if (k >= 1) {
          s.state = 3;
          s.mesh.visible = false;
        }
      }
    }
  }

  /** Every sword turns on the target and flies, ring by ring (Ikka Senjinka). */
  launch(): void {
    this.swords.forEach((s, i) => {
      s.state = 1;
      s.t = -(s.ring * 0.14 + (i % 7) * 0.02);
    });
  }

  get finished(): boolean {
    return this.swords.every((s) => s.state === 3);
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const s of this.swords) s.mesh.material.dispose();
  }
}

let featherTex: THREE.CanvasTexture | null = null;

function feathers(): THREE.CanvasTexture {
  if (featherTex) return featherTex;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 256, 256);
  // fan of long feathers from the root (left) to the tips (right)
  for (let i = 0; i < 14; i++) {
    const a = -0.9 + (i / 13) * 1.5;
    const len = 150 + Math.sin(i * 1.7) * 40 + i * 4;
    g.save();
    g.translate(18, 200);
    g.rotate(a);
    const grd = g.createLinearGradient(0, 0, len, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0.0)');
    grd.addColorStop(0.15, 'rgba(255,255,255,0.85)');
    grd.addColorStop(1, 'rgba(234,246,255,0.0)');
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(len / 2, 0, len / 2, 9 + i * 0.6, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  featherTex = new THREE.CanvasTexture(c);
  return featherTex;
}

/** Shūkei: Hakuteiken — huge white wings and a tall halo on his back while the white sword lasts. */
export class WhiteWings {
  readonly group = new THREE.Group();
  private mats: THREE.Material[] = [];
  private t = 0;
  level = 0;
  target = 1;

  constructor() {
    const tex = feathers();
    for (const s of [-1, 1]) {
      const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, color: '#ffffff' });
      this.mats.push(m);
      const wing = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), m);
      wing.position.set(s * 2.1, 0.9, -0.2);
      wing.scale.x = s;
      wing.rotation.y = s * 0.35;
      wing.renderOrder = 8;
      this.group.add(wing);
    }
    const hm = new THREE.MeshBasicMaterial({ color: '#f3f8ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.mats.push(hm);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.05, 6, 48), hm);
    halo.scale.set(0.7, 1.4, 1);
    halo.position.set(0, 1.4, -0.35);
    halo.renderOrder = 8;
    this.group.add(halo);
    this.group.traverse((o) => (o.frustumCulled = false));
  }

  update(dt: number): void {
    this.t += dt;
    this.level += (this.target - this.level) * Math.min(1, dt * 4);
    const pulse = 0.85 + Math.sin(this.t * 3) * 0.15;
    for (const m of this.mats) (m as THREE.MeshBasicMaterial).opacity = this.level * pulse;
    this.group.scale.setScalar(0.4 + this.level * 0.6);
    this.group.visible = this.level > 0.01;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of this.mats) m.dispose();
  }
}
