import * as THREE from 'three';
import { MaterialTable, PATTERN_IDS, F_EMISSIVE } from '../voxel/materials';

export const PALETTE_SHADES = 6;
/** rows: 0..5 = ramp shades (dark → light), 6 = accent */
export const PALETTE_ROWS = 7;

function resampleRamp(hexes: string[], n: number): THREE.Color[] {
  const cols = hexes.map((h) => new THREE.Color(h));
  if (cols.length === 1) return Array.from({ length: n }, () => cols[0].clone());
  const out: THREE.Color[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * (cols.length - 1);
    const a = Math.floor(t), b = Math.min(cols.length - 1, a + 1);
    out.push(cols[a].clone().lerp(cols[b], t - a));
  }
  return out;
}

/**
 * Builds two textures from a material table:
 *  - colours (sRGB, 256 × 7): 6 resampled ramp shades + accent per material
 *  - params (linear, 256 × 1): pattern id, roughness, metalness, glow
 */
export function buildPaletteTextures(mats: MaterialTable): { colors: THREE.DataTexture; params: THREE.DataTexture } {
  const W = 256;
  const cdata = new Uint8Array(W * PALETTE_ROWS * 4);
  const pdata = new Uint8Array(W * 4);
  const tmp = new THREE.Color();
  for (let id = 0; id < mats.count; id++) {
    const def = mats.def(id);
    const ramp = resampleRamp(def.colors, PALETTE_SHADES);
    // accent defaults to a darkened shade 0
    const accent = def.accent ? new THREE.Color(def.accent) : ramp[0].clone().multiplyScalar(0.8);
    const rows = [...ramp, accent];
    for (let r = 0; r < PALETTE_ROWS; r++) {
      tmp.copy(rows[r]);
      const o = (r * W + id) * 4;
      // THREE.Color holds linear values (ColorManagement); getHex() returns sRGB
      const hex = tmp.getHex();
      cdata[o] = (hex >> 16) & 255;
      cdata[o + 1] = (hex >> 8) & 255;
      cdata[o + 2] = hex & 255;
      cdata[o + 3] = 255;
    }
    const po = id * 4;
    pdata[po] = PATTERN_IDS[def.pattern ?? 'none'];
    pdata[po + 1] = Math.round((def.roughness ?? 0.9) * 255);
    pdata[po + 2] = Math.round((def.metalness ?? 0) * 255);
    pdata[po + 3] = def.flags & F_EMISSIVE ? Math.min(255, Math.round(((def.glow ?? 1) / 8) * 255)) : 0;
  }
  const colors = new THREE.DataTexture(cdata, W, PALETTE_ROWS, THREE.RGBAFormat, THREE.UnsignedByteType);
  colors.colorSpace = THREE.SRGBColorSpace;
  colors.magFilter = colors.minFilter = THREE.NearestFilter;
  colors.generateMipmaps = false;
  colors.needsUpdate = true;
  const params = new THREE.DataTexture(pdata, W, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  params.magFilter = params.minFilter = THREE.NearestFilter;
  params.generateMipmaps = false;
  params.needsUpdate = true;
  return { colors, params };
}
