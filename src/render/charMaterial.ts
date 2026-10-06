import * as THREE from 'three';

/**
 * Character / prop voxel material: MeshStandardMaterial with the palette lookup injected, so skinning,
 * shadows, fog and tone mapping keep working. The voxel cell of a fragment comes from the REST-pose
 * position (attribute `position` × res, before skinning), so per-voxel variation and the subtle edge
 * lines stick to the model while it animates.
 *
 * Extras for gameplay: rim light (aura tint), hit flash, global tint, dissolve (death/afterimages)
 * and an "energy" mode that turns the whole surface into glowing reiatsu (afterimages, clones).
 */
export interface CharUniforms {
  uPalette: { value: THREE.Texture };
  uParams: { value: THREE.Texture };
  uRes: { value: number };
  uRim: { value: THREE.Vector4 };
  uFlash: { value: THREE.Vector4 };
  uTint: { value: THREE.Color };
  uEdge: { value: number };
  uDissolve: { value: number };
  uEnergy: { value: THREE.Vector4 };
  uTime: { value: number };
  uAlpha: { value: number };
}

export type CharMaterial = THREE.MeshStandardMaterial & { userData: { uniforms: CharUniforms } };

let envMap: THREE.Texture | null = null;
const live = new Set<CharMaterial>();
/** Environment used by every character material (set by the renderer when the atmosphere changes). */
export function setCharEnvMap(t: THREE.Texture | null): void {
  envMap = t;
  for (const m of live) {
    m.envMap = t;
    m.needsUpdate = true;
  }
}

const COMMON = /* glsl */ `
uniform sampler2D uPalette;
uniform sampler2D uParams;
uniform float uRes;
uniform vec4 uRim;
uniform vec4 uFlash;
uniform vec3 uTint;
uniform float uEdge;
uniform float uDissolve;
uniform vec4 uEnergy;
uniform float uTime;
uniform float uAlpha;
varying vec3 vVoxPos;
varying vec3 vVoxNrm;
varying float vAO;
flat varying int vPal;
float chHash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}
`;

export function createCharMaterial(palette: THREE.Texture, params: THREE.Texture, res: number, opts: { transparent?: boolean } = {}): CharMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0,
    transparent: !!opts.transparent,
    depthWrite: !opts.transparent,
  }) as CharMaterial;
  mat.envMap = envMap;
  mat.envMapIntensity = 0.55;
  live.add(mat);
  const uniforms: CharUniforms = {
    uPalette: { value: palette },
    uParams: { value: params },
    uRes: { value: res },
    uRim: { value: new THREE.Vector4(0.6, 0.8, 1.0, 0.0) },
    uFlash: { value: new THREE.Vector4(1, 1, 1, 0) },
    uTint: { value: new THREE.Color(1, 1, 1) },
    uEdge: { value: 0.1 },
    uDissolve: { value: 0 },
    uEnergy: { value: new THREE.Vector4(0.6, 0.85, 1, 0) },
    uTime: { value: 0 },
    uAlpha: { value: 1 },
  };
  mat.userData.uniforms = uniforms;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nattribute vec2 aVox;\n${COMMON}`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vVoxPos = position * uRes;
         vVoxNrm = normal;
         vAO = aVox.y;
         vPal = int(aVox.x + 0.5);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${COMMON}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         vec3 chN = normalize(vVoxNrm);
         vec3 chCell = floor(vVoxPos - chN * 0.5);
         float chH = chHash(chCell);
         if (uDissolve > 0.0 && chHash(chCell + 7.31) < uDissolve) discard;
         vec3 chCol = texelFetch(uPalette, ivec2(vPal, 0), 0).rgb;
         vec4 chPrm = texelFetch(uParams, ivec2(vPal, 0), 0);
         float chVar = 1.0 + (chH - 0.5) * 0.08;
         float chAo = mix(0.38, 1.0, pow(clamp(vAO / 3.0, 0.0, 1.0), 1.15));
         vec3 chF = fract(vVoxPos);
         vec3 chA = abs(chN);
         vec2 chT = chA.x > 0.5 ? chF.yz : (chA.y > 0.5 ? chF.xz : chF.xy);
         vec2 chE = min(chT, 1.0 - chT);
         float chEdge = 1.0 - uEdge * (1.0 - smoothstep(0.0, 0.12, min(chE.x, chE.y)));
         vec3 chAlb = chCol * chVar * chEdge * uTint;
         diffuseColor.rgb = mix(chAlb * chAo, vec3(1.0), uFlash.a * 0.55);
         diffuseColor.a *= uAlpha;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         roughnessFactor = max(chPrm.r, 0.05);`,
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
         metalnessFactor = chPrm.g;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         {
           float glow = chPrm.b * 16.0;
           totalEmissiveRadiance += chCol * glow * (0.9 + 0.2 * chH);
           vec3 vd = normalize(vViewPosition);
           float fres = pow(1.0 - clamp(abs(dot(normal, vd)), 0.0, 1.0), 2.5);
           totalEmissiveRadiance += uRim.rgb * uRim.a * fres;
           totalEmissiveRadiance += uFlash.rgb * uFlash.a * 2.0;
           if (uEnergy.a > 0.0) {
             float scan = 0.65 + 0.35 * sin(vVoxPos.y * 0.9 - uTime * 14.0);
             totalEmissiveRadiance = mix(totalEmissiveRadiance, uEnergy.rgb * (1.2 + 2.5 * fres) * scan, uEnergy.a);
             diffuseColor.rgb *= 1.0 - uEnergy.a;
             totalEmissiveRadiance *= mix(1.0, uAlpha, uEnergy.a);
           }
         }`,
      );
  };
  mat.customProgramCacheKey = () => `char-${opts.transparent ? 't' : 'o'}`;
  return mat;
}
