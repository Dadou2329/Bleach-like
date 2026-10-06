import * as THREE from 'three';

/**
 * Voxel surface material: MeshStandardMaterial + shader injection so three's lighting, shadows and fog
 * keep working. Per fragment it finds the voxel cell it belongs to, picks a ramp shade by hashing the
 * cell (hand-placed-palette look), applies the material's procedural pattern (bricks, wood grain,
 * tiles…), vertex AO and a very subtle edge darkening.
 *
 * Geometry attributes: position (voxel units), normal, aVox = [material id, AO 0..3].
 * Modes:
 *  - world (BatchedMesh): voxel coords from batchingMatrix (translate(origin) × scale(vs)) / vs
 *  - object (fragments, props): voxel coords = position + uVoxOrigin (stable colours after extraction)
 */
export interface VoxelMaterialOptions {
  colors: THREE.DataTexture;
  params: THREE.DataTexture;
  voxelSize: number;
  transparent?: boolean;
  /** object mode: geometry positions are already voxel units */
  objectMode?: boolean;
}

export type VoxelMaterial = THREE.MeshStandardMaterial & {
  userData: { uniforms: Record<string, THREE.IUniform> };
};

const COMMON_GLSL = /* glsl */ `
uniform sampler2D uPalette;
uniform sampler2D uMatParams;
uniform float uVS;
uniform vec3 uVoxOrigin;
uniform float uEdge;
uniform float uTime;
uniform vec3 uTint;
varying vec3 vVoxPos;
varying vec3 vVoxNrm;
varying float vAO;
flat varying int vMat;

float vxHash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}
float vxNoise(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = vxHash(i), n100 = vxHash(i + vec3(1,0,0)), n010 = vxHash(i + vec3(0,1,0)), n110 = vxHash(i + vec3(1,1,0));
  float n001 = vxHash(i + vec3(0,0,1)), n101 = vxHash(i + vec3(1,0,1)), n011 = vxHash(i + vec3(0,1,1)), n111 = vxHash(i + vec3(1,1,1));
  return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y), mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
}
vec3 vxShade(int m, int s) { return texelFetch(uPalette, ivec2(m, clamp(s, 0, 5)), 0).rgb; }
vec3 vxAccent(int m) { return texelFetch(uPalette, ivec2(m, 6), 0).rgb; }
`;

/** GLSL: returns the albedo for material m at voxel cell c on a face with normal n (axis-aligned). */
const PATTERN_GLSL = /* glsl */ `
vec3 vxAlbedo(int m, vec3 c, vec3 n, vec3 fp, out float emissiveK) {
  vec4 prm = texelFetch(uMatParams, ivec2(m, 0), 0);
  int pat = int(prm.r * 255.0 + 0.5);
  emissiveK = prm.a * 8.0;
  float h = vxHash(c);
  float h2 = vxHash(c + 17.0);
  // in-plane coordinates of this face (u along the face horizontally, v vertical when possible)
  vec3 an = abs(n);
  vec2 uv = an.y > 0.5 ? c.xz : (an.x > 0.5 ? c.zy : c.xy);
  // low-frequency patches so big surfaces are not uniform
  float lf = vxNoise(c * 0.09) - 0.5;
  int base = 2 + int(floor(h * 2.999));            // shades 2..4
  if (pat == 0) { // none
    return vxShade(m, 1 + int(floor(h * 3.999)));
  } else if (pat == 8) { // plaster: soft mottling
    float k = lf * 2.2 + (h - 0.5) * 0.9;
    return vxShade(m, 3 + int(floor(k + 0.5)));
  } else if (pat == 5) { // stone: irregular rocks
    vec3 rc = floor(c / vec3(3.0, 2.0, 3.0) + vec3(vxHash(floor(c.yzx / 5.0)) * 0.7));
    float rh = vxHash(rc);
    int s = 1 + int(floor(rh * 3.999));
    if (h2 > 0.93) return vxAccent(m);
    if (h > 0.8) s += 1;
    return vxShade(m, s);
  } else if (pat == 1) { // brick, running bond: bricks 3 long × 1 tall, mortar every other row
    float row = floor(c.y * 0.5);
    float along = an.y > 0.5 ? c.x : uv.x;
    bool mortarRow = mod(c.y, 2.0) > 0.5;
    bool mortarCol = mod(along + mod(row, 2.0) * 2.0, 4.0) < 0.5;
    if (an.y < 0.5 && (mortarRow || mortarCol)) return vxAccent(m);
    float bh = vxHash(vec3(floor((along + mod(row, 2.0) * 2.0) / 4.0), row, an.x));
    return vxShade(m, 1 + int(floor(bh * 3.999)) + (h > 0.85 ? 1 : 0));
  } else if (pat == 4) { // tile: 4×4 tiles with grout lines
    vec2 t = mod(uv, 4.0);
    if (t.x < 0.5 || t.y < 0.5) return vxAccent(m);
    float th = vxHash(vec3(floor(uv / 4.0), an.y));
    return vxShade(m, 2 + int(floor(th * 2.999)));
  } else if (pat == 2) { // wood grain along the longest visible axis
    float g = an.y > 0.5 ? c.z : c.y;
    float grain = vxNoise(vec3(g * 0.35, uv.x * 2.1, 0.0));
    if (h2 > 0.96) return vxAccent(m);
    return vxShade(m, 1 + int(floor(grain * 3.999)));
  } else if (pat == 3) { // planks: 3-voxel boards with seams
    float b = floor(uv.x / 3.0);
    if (mod(uv.x, 3.0) < 0.5 && an.y > 0.5) return vxAccent(m);
    float bh = vxHash(vec3(b, 0.0, an.x));
    float grain = vxNoise(vec3(uv.y * 0.4, b, 1.0));
    return vxShade(m, 1 + int(floor((bh * 0.6 + grain * 0.4) * 3.999)));
  } else if (pat == 6) { // grass: lush shades + bright speckles on tops
    if (an.y > 0.5 && h2 > 0.968) return vxAccent(m);
    float k = lf * 2.0 + (h - 0.5) * 1.6;
    return vxShade(m, 2 + int(floor(k + 0.5)));
  } else if (pat == 7) { // sand ripples
    float rip = sin((c.x * 0.55 + c.z * 0.25) + vxNoise(c * 0.2) * 3.0);
    return vxShade(m, 2 + int(floor(rip * 1.2 + (h - 0.5) + 0.5)));
  } else if (pat == 9) { // horizontal siding
    if (an.y < 0.5 && mod(c.y, 3.0) < 0.5) return vxAccent(m);
    return vxShade(m, base);
  } else if (pat == 10) { // tatami: woven stripes + borders
    if (an.y > 0.5 && (mod(c.x, 16.0) < 0.5 || mod(c.z, 8.0) < 0.5)) return vxAccent(m);
    return vxShade(m, 2 + int(mod(an.y > 0.5 ? c.x : uv.x, 2.0)));
  } else if (pat == 11) { // glass: vertical sheen
    float sheen = fract((uv.x + uv.y) * 0.08);
    return vxShade(m, sheen > 0.85 ? 5 : 2 + int(floor(h * 1.999)));
  } else if (pat == 12) { // leaves: clustered high variation
    float cl = vxNoise(c * 0.33);
    return vxShade(m, int(floor(cl * 3.0 + h * 2.999)));
  } else if (pat == 13) { // metal: brushed
    float br = vxNoise(vec3(uv.x * 0.15, uv.y * 3.0, 0.0));
    return vxShade(m, 2 + int(floor(br * 2.999)));
  }
  return vxShade(m, base);
}
`;

export function createVoxelMaterial(opts: VoxelMaterialOptions): VoxelMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0,
    transparent: !!opts.transparent,
    opacity: opts.transparent ? 0.62 : 1,
    depthWrite: !opts.transparent,
  }) as VoxelMaterial;
  const uniforms: Record<string, THREE.IUniform> = {
    uPalette: { value: opts.colors },
    uMatParams: { value: opts.params },
    uVS: { value: opts.voxelSize },
    uVoxOrigin: { value: new THREE.Vector3() },
    uEdge: { value: 0.07 },
    uTime: { value: 0 },
    uTint: { value: new THREE.Color(1, 1, 1) },
  };
  mat.userData.uniforms = uniforms;
  const objectMode = !!opts.objectMode;

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         attribute vec2 aVox;
         ${COMMON_GLSL}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         {
           vec4 vp = vec4(position, 1.0);
           ${objectMode ? 'vVoxPos = vp.xyz + uVoxOrigin;' : `
           #ifdef USE_BATCHING
             vp = batchingMatrix * vp;
           #endif
           vVoxPos = vp.xyz / uVS;`}
           vVoxNrm = normal;
           vAO = aVox.y;
           vMat = int(aVox.x + 0.5);
         }`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         ${COMMON_GLSL}
         ${PATTERN_GLSL}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float vxEmissive = 0.0;
         vec3 vxN = normalize(vVoxNrm);
         vec3 vxCell = floor(vVoxPos - vxN * 0.5);
         vec3 vxCol = vxAlbedo(vMat, vxCell, vxN, vVoxPos, vxEmissive);
         // AO curve (vertex-interpolated)
         float vxAo = mix(0.42, 1.0, pow(clamp(vAO / 3.0, 0.0, 1.0), 1.25));
         // very subtle face-edge darkening
         vec3 vxF = fract(vVoxPos);
         vec3 vxA = abs(vxN);
         vec2 vxT = vxA.x > 0.5 ? vxF.yz : (vxA.y > 0.5 ? vxF.xz : vxF.xy);
         vec2 vxE = min(vxT, 1.0 - vxT);
         float vxEdge = 1.0 - uEdge * (1.0 - smoothstep(0.0, 0.1, min(vxE.x, vxE.y)));
         // slight top-light bias: tops a hair brighter, bottoms darker (stylised)
         float vxDir = 1.0 + 0.05 * vxN.y;
         diffuseColor.rgb *= vxCol * vxAo * vxEdge * vxDir * uTint;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         vec4 vxPrm = texelFetch(uMatParams, ivec2(vMat, 0), 0);
         roughnessFactor = max(vxPrm.g, 0.04);`,
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
         metalnessFactor = vxPrm.b;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += vxCol * vxEmissive;`,
      );
  };
  // distinct program per mode
  mat.customProgramCacheKey = () => `voxel-${objectMode ? 'obj' : 'world'}-${opts.transparent ? 't' : 'o'}`;
  return mat;
}
