// Kyōka Suigetsu: what everyone saw was never there. MirrorDecoy is a solid, perfect copy of a fighter
// frozen in its last pose (the real one already gone, unseen); when the illusion breaks it flashes, cracks
// and crumbles voxel by voxel while a spray of mirror glass tumbles out of where it stood. GlassShards is
// that spray on its own (the release "Kudakero" shatters a mirror off the blade).
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { createCharMaterial, type CharMaterial } from '../render/charMaterial';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

const GLASS_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vW;
void main() {
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
  m = m * instanceMatrix;
  #endif
  vec4 w = m * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(m) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const GLASS_FRAG = /* glsl */ `
uniform float uA; uniform vec3 uTint;
varying vec3 vN; varying vec3 vW;
void main() {
  vec3 v = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, v) < 0.0) n = -n;
  vec3 r = reflect(-v, n);
  // a mirror: it shows the sky above and the ground below, and flashes when it turns into the light
  vec3 sky = mix(vec3(0.34, 0.33, 0.36), vec3(0.86, 0.9, 0.97), smoothstep(-0.3, 0.6, r.y));
  float glint = pow(max(0.0, dot(r, normalize(vec3(0.35, 0.85, 0.25)))), 48.0) * 5.0;
  float fres = pow(1.0 - clamp(abs(dot(n, v)), 0.0, 1.0), 3.0);
  vec3 col = sky * 0.8 + uTint * (0.18 + fres * 0.9) + vec3(glint);
  gl_FragColor = vec4(col, uA * (0.82 + fres * 0.18));
}`;

let shardGeo: THREE.BufferGeometry | null = null;
/** A thin irregular triangle, about 1 unit across. */
function glassGeometry(): THREE.BufferGeometry {
  if (shardGeo) return shardGeo;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.42, 0, 0.55, -0.3, 0, -0.05, 0.6, 0], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  return (shardGeo = g);
}

/** Tumbling mirror shards: an instanced spray that falls, bounces once on the ground and fades. */
export class GlassShards implements Projectile {
  done = false;
  private mesh: THREE.InstancedMesh;
  private u: { uA: THREE.IUniform; uTint: THREE.IUniform };
  private pos: THREE.Vector3[] = [];
  private vel: THREE.Vector3[] = [];
  private rot: THREE.Quaternion[] = [];
  private spin: THREE.Vector3[] = [];
  private size: THREE.Vector3[] = [];
  private t = 0;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private e = new THREE.Vector3();

  /**
   * @param box half extents of the volume the shards start in (around `center`)
   * @param floor ground height they come to rest on
   */
  constructor(private g: Game, center: THREE.Vector3, box: THREE.Vector3, n = 60, speed = 5, readonly life = 1.8, private floor = center.y - box.y, tint: THREE.ColorRepresentation = '#B9A6FF', scale = 1) {
    this.u = { uA: { value: 1 }, uTint: { value: new THREE.Color(tint) } };
    const mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    this.mesh = new THREE.InstancedMesh(glassGeometry(), mat, n);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    for (let i = 0; i < n; i++) {
      const p = new THREE.Vector3((Math.random() * 2 - 1) * box.x, (Math.random() * 2 - 1) * box.y, (Math.random() * 2 - 1) * box.z).add(center);
      const out = new THREE.Vector3(p.x - center.x, (p.y - center.y) * 0.4, p.z - center.z);
      if (out.lengthSq() < 1e-4) out.set(Math.random() - 0.5, 0, Math.random() - 0.5);
      out.normalize().multiplyScalar(speed * (0.4 + Math.random() * 0.9));
      out.y += 1.5 + Math.random() * 3;
      this.pos.push(p);
      this.vel.push(out);
      this.rot.push(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3)));
      this.spin.push(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(22));
      const s = (0.07 + Math.random() * 0.16) * scale;
      this.size.push(new THREE.Vector3(s * (0.7 + Math.random() * 0.6), s * (0.7 + Math.random() * 0.6), 1));
    }
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number): void {
    this.t += dt;
    for (let i = 0; i < this.pos.length; i++) {
      const p = this.pos[i], v = this.vel[i];
      v.y -= 15 * dt;
      v.multiplyScalar(Math.exp(-0.6 * dt));
      p.addScaledVector(v, dt);
      if (p.y < this.floor + 0.02) {
        p.y = this.floor + 0.02;
        if (v.y < 0) {
          v.y = v.y < -2 ? -v.y * 0.3 : 0;
          v.x *= 0.5;
          v.z *= 0.5;
          this.spin[i].multiplyScalar(0.4);
        }
      }
      this.e.copy(this.spin[i]).multiplyScalar(dt);
      const a = this.e.length();
      if (a > 1e-5) this.rot[i].premultiply(this.q.setFromAxisAngle(this.e.divideScalar(a), a));
    }
    if (this.t > this.life) this.done = true;
  }

  render(): void {
    for (let i = 0; i < this.pos.length; i++) {
      this.m.compose(this.pos[i], this.rot[i], this.size[i]);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.u.uA.value = Math.max(0, Math.min(1, (this.life - this.t) / 0.6));
  }

  dispose(): void {
    this.mesh.removeFromParent();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** The illusion: a solid copy of the fighter left standing where it was, until it shatters. */
export class MirrorDecoy implements Projectile {
  done = false;
  /** feet position of the copy */
  readonly pos = new THREE.Vector3();
  /** an enemy blade passed through it */
  touched = false;
  private group = new THREE.Group();
  private mats: CharMaterial[] = [];
  private t = 0;
  private brokenAt = -1;
  private height: number;

  /**
   * `style`: 'mirror' (Kyōka Suigetsu: it breaks like glass) or 'shell' (Utsusemi: the cast-off shell that
   * takes the blow; it comes apart into fluttering afterimage streaks).
   */
  constructor(private g: Game, private owner: Fighter, readonly life = 2.5, readonly style: 'mirror' | 'shell' = 'mirror') {
    const src = owner.visual;
    src.object.updateMatrixWorld(true);
    this.pos.copy(owner.pos);
    this.height = owner.def.height;
    const bones = src.rig.bones.map((b) => {
      const x = new THREE.Bone();
      x.matrixAutoUpdate = false;
      x.matrixWorldAutoUpdate = false;
      x.matrixWorld.copy(b.matrixWorld);
      return x;
    });
    const skel = new THREE.Skeleton(bones, src.rig.skeleton.boneInverses.map((m) => m.clone()));
    const u = src.material.userData.uniforms;
    const mat = createCharMaterial(u.uPalette.value, u.uParams.value, u.uRes.value);
    mat.userData.uniforms.uRim.value.copy(u.uRim.value);
    this.mats.push(mat);
    const body = new THREE.SkinnedMesh(src.body.geometry, mat);
    body.bindMode = THREE.DetachedBindMode;
    body.bind(skel, new THREE.Matrix4());
    body.frustumCulled = false;
    body.castShadow = true;
    this.group.add(body);
    for (const prop of src.props.values()) {
      const pu = prop.material.userData.uniforms;
      const pm = createCharMaterial(pu.uPalette.value, pu.uParams.value, pu.uRes.value);
      this.mats.push(pm);
      const mesh = new THREE.Mesh(prop.geometry, pm);
      prop.updateMatrixWorld(true);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(prop.matrixWorld);
      mesh.castShadow = true;
      this.group.add(mesh);
    }
    g.engine.gr.scene.add(this.group);
  }

  get broken(): boolean {
    return this.brokenAt >= 0;
  }

  /** Chest-height centre of the copy. */
  center(out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(this.pos.x, this.pos.y + this.height * 0.55, this.pos.z);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (!this.broken) {
      // a blade that passes through the copy finds nothing there
      for (const o of g.enemiesOf(this.owner)) {
        if (!o.bladeActive || !o.bladeValid) continue;
        const { base, tip } = o.blade;
        for (let k = 0; k <= 4; k++) {
          const x = base.x + (tip.x - base.x) * (k / 4), y = base.y + (tip.y - base.y) * (k / 4), z = base.z + (tip.z - base.z) * (k / 4);
          if (Math.hypot(x - this.pos.x, z - this.pos.z) < 0.55 && y > this.pos.y && y < this.pos.y + this.height) this.touched = true;
        }
      }
      if (this.t > this.life) this.shatter();
    } else if (this.t - this.brokenAt > 0.5) this.done = true;
  }

  /** Break the illusion. */
  shatter(): void {
    if (this.broken) return;
    this.brokenAt = this.t;
    const g = this.g;
    const c = this.center();
    if (this.style === 'shell') {
      // the shell comes apart: a puff and a flutter of pale streaks, nothing solid left
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3;
        const y = this.pos.y + Math.random() * this.height;
        g.engine.glow.spawn({ x: c.x, y, z: c.z, vx: Math.cos(a) * s, vy: 0.5 + Math.random() * 1.5, vz: Math.sin(a) * s, size: 0.1, sizeEnd: 0.02, life: 0.5, r: 0.86, g: 0.82, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 3 });
      }
      g.engine.dust.spawn({ x: c.x, y: c.y, z: c.z, size: 0.8, sizeEnd: 2.2, life: 0.5, r: 0.85, g: 0.82, b: 0.9, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
      g.sfx.play('shunpo', c, 0.6);
      return;
    }
    g.addProjectile(new GlassShards(g, c, new THREE.Vector3(0.35, this.height * 0.48, 0.3), 70, 5.5, 1.9, this.pos.y));
    g.sfx.play('shatter', c, 1.1);
    g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 1.2, sizeEnd: 3.4, life: 0.3, r: 0.85, g: 0.8, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, q = Math.sqrt(1 - e * e), s = 3 + Math.random() * 7;
      g.engine.glow.spawn({ x: c.x, y: c.y + (Math.random() - 0.5) * this.height * 0.8, z: c.z, vx: Math.cos(a) * q * s, vy: e * s, vz: Math.sin(a) * q * s, size: 0.12, sizeEnd: 0.02, life: 0.45, r: 0.95, g: 0.93, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2.5 });
    }
    g.engine.gr.chroma.offset.set(0.004, 0.004);
  }

  render(_dt: number, time: number): void {
    const k = this.broken ? (this.t - this.brokenAt) / 0.4 : 0;
    for (const m of this.mats) {
      const u = m.userData.uniforms;
      u.uTime.value = time;
      u.uFlash.value.set(0.9, 0.86, 1, this.broken ? Math.max(0, 1 - k * 2.5) : 0);
      u.uDissolve.value = this.broken ? Math.min(1, (this.style === 'shell' ? 0.45 : 0.25) + k * (this.style === 'shell' ? 1.6 : 1)) : 0;
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of this.mats) m.dispose();
  }
}
