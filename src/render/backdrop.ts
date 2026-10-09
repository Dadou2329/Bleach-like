// The world past the map's edge (render only): Karakura carried on into the haze. A ground at street level with a
// city-block pattern, the river running on east and west between its banks, rows of distant houses and a few towers
// (instanced boxes, fogged like everything else), and two rings of hills on the horizon whose colour follows the
// current fog (dusk, eclipses, night). None of it collides: the kinematic bounds keep fighters on the map, and the
// ground leaves a hole where the map is so no sheet hangs across a crater.
import * as THREE from 'three';

export interface BackdropOpts {
  /** the map's side in metres (the map spans [0, size] on x and z) */
  size: number;
  /** street level in metres */
  ground: number;
  /** the river's water band along z (metres) */
  river?: [number, number];
  seed?: number;
}

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/** A tile of city seen from far off: blocks of roofs, roads between them, a park here and there. */
function cityTexture(seed: number): THREE.CanvasTexture {
  const n = 512;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d')!;
  const r = rng(seed);
  g.fillStyle = '#6f7466';
  g.fillRect(0, 0, n, n);
  const roofs = ['#5b636e', '#76503f', '#8e8a82', '#46505c', '#9a9488', '#6b5a4a', '#3f4a58', '#a39c90', '#5a6a5a'];
  const cell = 128;
  for (let by = 0; by < n; by += cell)
    for (let bx = 0; bx < n; bx += cell) {
      if (r() < 0.12) {
        g.fillStyle = '#4e7a2c';
        g.fillRect(bx + 8, by + 8, cell - 16, cell - 16);
        continue;
      }
      for (let y = by + 10; y < by + cell - 14; y += 18 + Math.floor(r() * 10))
        for (let x = bx + 10; x < bx + cell - 14; x += 18 + Math.floor(r() * 10)) {
          g.fillStyle = roofs[Math.floor(r() * roofs.length)];
          g.fillRect(x, y, 12 + Math.floor(r() * 8), 12 + Math.floor(r() * 8));
        }
    }
  g.fillStyle = '#45474b';
  for (let k = 0; k < n; k += cell) {
    g.fillRect(k, 0, 8, n);
    g.fillRect(0, k, n, 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export class TownBackdrop {
  readonly group = new THREE.Group();
  private hills: THREE.MeshBasicMaterial[] = [];
  private hillBase: THREE.Color[] = [];
  private disposables: { dispose(): void }[] = [];

  constructor(o: BackdropOpts) {
    const S = o.size, G = o.ground, R = 2200;
    const rand = rng(o.seed ?? 7);
    const tex = cityTexture(o.seed ?? 7);
    tex.repeat.set(1, 1);
    const groundMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
    this.disposables.push(tex, groundMat);
    // the ground: rectangles round the map's square (a hole where the map is), cut for the river
    const rects: [number, number, number, number, number][] = [];
    const [r0, r1] = o.river ?? [S + 1, S + 1];
    const bank = 6, water = G - 2.3;
    const zCuts: [number, number][] = o.river ? [[-R, r0 - bank], [r1 + bank, S + R]] : [[-R, S + R]];
    for (const [z0, z1] of zCuts) {
      rects.push([-R, z0, 0, z1, G]);
      rects.push([S, z0, S + R, z1, G]);
    }
    rects.push([0, -R, S, 0, G]);
    rects.push([0, S, S, S + R, G]);
    for (const [x0, z0, x1, z1, y] of rects) {
      if (x1 <= x0 || z1 <= z0) continue;
      const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
      geo.rotateX(-Math.PI / 2);
      // world-space UVs: one texture tile per 180 m
      const uv = geo.attributes.uv as THREE.BufferAttribute;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + (x0 + x1) / 2) / 180, (pos.getZ(i) + (z0 + z1) / 2) / 180);
      const m = new THREE.Mesh(geo, groundMat);
      m.position.set((x0 + x1) / 2, y - 0.01, (z0 + z1) / 2);
      this.group.add(m);
      this.disposables.push(geo);
    }
    // the river carried on east and west: water between two sloping banks
    if (o.river) {
      const waterMat = new THREE.MeshStandardMaterial({ color: '#2a6380', roughness: 0.15, metalness: 0.1 });
      const bankMat = new THREE.MeshStandardMaterial({ color: '#557a35', roughness: 1 });
      this.disposables.push(waterMat, bankMat);
      for (const [x0, x1] of [[-R, 0], [S, S + R]]) {
        const wgeo = new THREE.PlaneGeometry(x1 - x0, r1 - r0 + 2);
        wgeo.rotateX(-Math.PI / 2);
        const wm = new THREE.Mesh(wgeo, waterMat);
        wm.position.set((x0 + x1) / 2, water, (r0 + r1) / 2);
        this.group.add(wm);
        this.disposables.push(wgeo);
        for (const [za, zb, ya, yb] of [[r0 - bank, r0, G, water], [r1, r1 + bank, water, G]]) {
          const bgeo = new THREE.BufferGeometry();
          const p = new Float32Array([x0, ya, za, x1, ya, za, x1, yb, zb, x0, ya, za, x1, yb, zb, x0, yb, zb]);
          bgeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
          bgeo.computeVertexNormals();
          const bm = new THREE.Mesh(bgeo, bankMat);
          bm.material.side = THREE.DoubleSide;
          this.group.add(bm);
          this.disposables.push(bgeo);
        }
      }
    }
    // distant houses, blocks and a few towers on a jittered grid in a band round the map
    const cell = 13;
    const spots: { x: number; z: number; w: number; d: number; h: number; tower: boolean }[] = [];
    for (let z = -330; z < S + 330; z += cell)
      for (let x = -330; x < S + 330; x += cell) {
        if (x > -cell && x < S && z > -cell && z < S) continue;
        const cx = x + rand() * 4, cz = z + rand() * 4;
        if (o.river && cz > r0 - bank - 4 && cz < r1 + bank + 4) continue;
        // roads every few cells stay open
        if (Math.abs(Math.round(x / cell)) % 5 === 0 || Math.abs(Math.round(z / cell)) % 4 === 0) continue;
        if (rand() < 0.22) continue;
        const tower = rand() < 0.07;
        spots.push({ x: cx, z: cz, w: 6 + rand() * 4, d: 6 + rand() * 4, h: tower ? 18 + rand() * 30 : 5 + rand() * 4, tower });
      }
    const box = new THREE.BoxGeometry(1, 1, 1);
    box.translate(0, 0.5, 0);
    const wallMat = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
    const houses = new THREE.InstancedMesh(box, wallMat, spots.length);
    const roofGeo = new THREE.ConeGeometry(0.72, 1, 4, 1);
    roofGeo.rotateY(Math.PI / 4);
    roofGeo.translate(0, 0.5, 0);
    const roofMat = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 });
    const lows = spots.filter((s) => !s.tower);
    const roofs = new THREE.InstancedMesh(roofGeo, roofMat, lows.length);
    this.disposables.push(box, wallMat, roofGeo, roofMat);
    const walls = ['#d6d2c8', '#cdbf9f', '#c9b897', '#9e9c97', '#9fb0bd', '#b8a888', '#d9d0b8'];
    const towerCols = ['#7a8792', '#5e6b78', '#8d9399', '#9aa3ab'];
    const roofCols = ['#3a414b', '#424a55', '#5a3e30', '#7a3626', '#2f4a3c', '#353d49'];
    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    let ri = 0;
    spots.forEach((s, i) => {
      m4.makeScale(s.w, s.h, s.d).setPosition(s.x, G, s.z);
      houses.setMatrixAt(i, m4);
      col.set(s.tower ? towerCols[i % towerCols.length] : walls[i % walls.length]);
      houses.setColorAt(i, col);
      if (!s.tower) {
        m4.makeScale(s.w * 1.15, 2.2 + s.w * 0.12, s.d * 1.15).setPosition(s.x, G + s.h, s.z);
        roofs.setMatrixAt(ri, m4);
        col.set(roofCols[(i * 7) % roofCols.length]);
        roofs.setColorAt(ri++, col);
      }
    });
    houses.instanceMatrix.needsUpdate = true;
    roofs.instanceMatrix.needsUpdate = true;
    houses.frustumCulled = roofs.frustumCulled = false;
    this.group.add(houses, roofs);
    // two rings of hills on the horizon, unfogged: their colour is mixed toward the fog every frame
    const c = new THREE.Vector2(S / 2, S / 2);
    for (const [rad, hMin, hMax, base, seg] of [[1500, 60, 230, '#3f5a4c', 0.0], [2150, 120, 420, '#4f6676', 2.3]] as [number, number, number, string, number][]) {
      const N = 220;
      const p: number[] = [];
      const shade: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const h = hMin + (hMax - hMin) * Math.max(0, 0.5 + 0.28 * Math.sin(a * 3 + seg) + 0.18 * Math.sin(a * 7.3 + seg * 2) + 0.1 * Math.sin(a * 17.1 + seg));
        const x = c.x + Math.cos(a) * rad, z = c.y + Math.sin(a) * rad;
        p.push(x, G - 40, z, x, G + h, z);
        shade.push(1.25, 1.25, 1.25, 0.85, 0.85, 0.85);
        if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(shade, 3));
      geo.setIndex(idx);
      const mat = new THREE.MeshBasicMaterial({ color: base, vertexColors: true, fog: false, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      mesh.renderOrder = -900;
      this.group.add(mesh);
      this.hills.push(mat);
      this.hillBase.push(new THREE.Color(base));
      this.disposables.push(geo, mat);
    }
  }

  /** follow the atmosphere: the hills sink into the current fog colour (aerial perspective) */
  update(fog: THREE.Color): void {
    this.hills.forEach((m, i) => m.color.copy(this.hillBase[i]).lerp(fog, i === 0 ? 0.42 : 0.62));
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const d of this.disposables) d.dispose();
  }
}
