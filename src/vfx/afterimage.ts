// Shunpo / Sonído afterimages: frozen copies of a character's current pose that glow in the owner's
// reiatsu colour and fade. Each ghost is a SkinnedMesh sharing the body geometry with its own static
// skeleton (bones outside the scene graph holding copied world matrices).
import * as THREE from 'three';
import type { CharacterVisual } from '../game/characterFactory';
import { createCharMaterial, type CharMaterial } from '../render/charMaterial';

interface Ghost {
  mesh: THREE.SkinnedMesh;
  bones: THREE.Bone[];
  mat: CharMaterial;
  props: { mesh: THREE.Mesh; mat: CharMaterial }[];
  /** reusable energy materials per prop geometry */
  propMats: Map<THREE.BufferGeometry, CharMaterial>;
  life: number;
  max: number;
}

export class AfterimagePool {
  readonly group = new THREE.Group();
  private ghosts: Ghost[] = [];
  color = new THREE.Color('#9fd8ff');

  constructor(private src: CharacterVisual, count = 10) {
    const u = src.material.userData.uniforms;
    for (let i = 0; i < count; i++) {
      const bones = src.rig.bones.map(() => {
        const b = new THREE.Bone();
        b.matrixAutoUpdate = false;
        b.matrixWorldAutoUpdate = false;
        return b;
      });
      const skel = new THREE.Skeleton(bones, src.rig.skeleton.boneInverses.map((m) => m.clone()));
      const mat = createCharMaterial(u.uPalette.value, u.uParams.value, u.uRes.value, { transparent: true });
      mat.blending = THREE.AdditiveBlending;
      mat.depthWrite = false;
      const mesh = new THREE.SkinnedMesh(src.body.geometry, mat);
      mesh.bindMode = THREE.DetachedBindMode;
      mesh.bind(skel, new THREE.Matrix4());
      mesh.frustumCulled = false;
      mesh.visible = false;
      mesh.renderOrder = 4;
      this.group.add(mesh);
      this.ghosts.push({ mesh, bones, mat, props: [], propMats: new Map(), life: 0, max: 0.4 });
    }
  }

  /** Snapshot the current pose. */
  spawn(life = 0.4, intensity = 1): void {
    let g = this.ghosts.find((x) => x.life <= 0);
    if (!g) g = this.ghosts.reduce((a, b) => (a.life < b.life ? a : b));
    this.src.object.updateMatrixWorld(true);
    this.src.rig.bones.forEach((b, i) => g!.bones[i].matrixWorld.copy(b.matrixWorld));
    g.mesh.visible = true;
    g.life = life;
    g.max = life;
    const u = g.mat.userData.uniforms;
    u.uEnergy.value.set(this.color.r, this.color.g, this.color.b, 1);
    u.uFlash.value.w = 0;
    g.mat.opacity = intensity;
    // weapon props: static clones
    for (const p of g.props) p.mesh.removeFromParent();
    g.props = [];
    for (const prop of this.src.props.values()) {
      let m2 = g.propMats.get(prop.geometry);
      if (!m2) {
        const pu = prop.material.userData.uniforms;
        m2 = createCharMaterial(pu.uPalette.value, pu.uParams.value, pu.uRes.value, { transparent: true });
        m2.blending = THREE.AdditiveBlending;
        m2.depthWrite = false;
        g.propMats.set(prop.geometry, m2);
      }
      m2.userData.uniforms.uEnergy.value.set(this.color.r, this.color.g, this.color.b, 1);
      const mesh = new THREE.Mesh(prop.geometry, m2);
      prop.updateMatrixWorld(true);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(prop.matrixWorld);
      mesh.frustumCulled = false;
      mesh.renderOrder = 4;
      this.group.add(mesh);
      g.props.push({ mesh, mat: m2 });
    }
  }

  update(dt: number, time: number): void {
    for (const g of this.ghosts) {
      if (g.life <= 0) continue;
      g.life -= dt;
      const k = Math.max(0, g.life / g.max);
      const a = k * k;
      const u = g.mat.userData.uniforms;
      u.uEnergy.value.w = 1;
      u.uAlpha.value = a;
      u.uTime.value = time;
      for (const p of g.props) {
        p.mat.userData.uniforms.uAlpha.value = a;
        p.mat.userData.uniforms.uTime.value = time;
      }
      if (g.life <= 0) {
        g.mesh.visible = false;
        for (const p of g.props) p.mesh.removeFromParent();
        g.props = [];
      }
    }
  }
}
