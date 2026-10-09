// Material table: up to 255 materials (0 = air). Colours are authored in sRGB hex as
// ramps (dark → light); the renderer resamples each ramp to 6 shades in a palette texture.

export const F_SOLID = 1; // blocks movement & occludes
export const F_TRANSPARENT = 2; // rendered in the transparent stream (glass, ice, water)
export const F_EMISSIVE = 4; // glows (lanterns, neon, lava, reishi crystals)
export const F_LIQUID = 8; // not solid for movement; flows (later)
export const F_INDESTRUCTIBLE = 16;
export const F_FLAMMABLE = 32;
export const F_REIATSU_BLOCK = 64; // Sekkiseki / Shakonmaku
export const F_FOLIAGE = 128; // leaves, grass tufts: soft, no AO casting

export type Pattern =
  | 'none' | 'brick' | 'wood' | 'plank' | 'tile' | 'stone' | 'grass' | 'sand' | 'plaster'
  | 'stripe' | 'tatami' | 'glass' | 'leaves' | 'metal' | 'scale';

export const PATTERN_IDS: Record<Pattern, number> = {
  none: 0, brick: 1, wood: 2, plank: 3, tile: 4, stone: 5, grass: 6, sand: 7, plaster: 8,
  stripe: 9, tatami: 10, glass: 11, leaves: 12, metal: 13, scale: 14,
};

export type DebrisKind = 'rock' | 'dirt' | 'sand' | 'wood' | 'glass' | 'metal' | 'ice' | 'foliage' | 'cloth' | 'bone' | 'liquid';

export interface MaterialDef {
  name: string;
  /** sRGB hex ramp, dark → light (2–6 entries) */
  colors: string[];
  /** secondary colour used by patterns (mortar, grain lines, tile gaps) */
  accent?: string;
  pattern?: Pattern;
  /** energy needed to destroy one voxel (≈ "power units"; a strong punch ≈ 10) */
  hardness: number;
  /** relative mass per voxel (fragments) */
  density: number;
  flags: number;
  debris: DebrisKind;
  roughness?: number;
  metalness?: number;
  /** emissive strength (HDR multiplier) for F_EMISSIVE materials */
  glow?: number;
  /** material id to turn into when burnt / frozen (names resolved after registration) */
  onBurn?: string;
  onFreeze?: string;
}

export class MaterialTable {
  readonly defs: MaterialDef[] = [];
  readonly byName = new Map<string, number>();
  /** flags per id, for hot loops */
  readonly flags = new Uint8Array(256);
  readonly hardness = new Float32Array(256);
  readonly density = new Float32Array(256);

  constructor() {
    // id 0 = air
    this.defs.push({ name: 'air', colors: ['#000000'], hardness: 0, density: 0, flags: 0, debris: 'dirt' });
    this.byName.set('air', 0);
  }

  add(def: MaterialDef): number {
    const existing = this.byName.get(def.name);
    if (existing !== undefined) return existing;
    const id = this.defs.length;
    if (id > 255) throw new Error('MaterialTable full');
    this.defs.push(def);
    this.byName.set(def.name, id);
    this.flags[id] = def.flags & 0xff;
    this.hardness[id] = def.flags & F_INDESTRUCTIBLE ? Infinity : def.hardness;
    this.density[id] = def.density;
    return id;
  }

  id(name: string): number {
    const id = this.byName.get(name);
    if (id === undefined) throw new Error(`Unknown material: ${name}`);
    return id;
  }

  has(name: string): boolean {
    return this.byName.has(name);
  }

  def(id: number): MaterialDef {
    return this.defs[id];
  }

  isSolid(id: number): boolean {
    return (this.flags[id] & F_SOLID) !== 0;
  }

  get count(): number {
    return this.defs.length;
  }
}

const S = F_SOLID;

/** The shared base library. Maps can add their own materials after these. */
export function createBaseMaterials(): MaterialTable {
  const t = new MaterialTable();
  const add = (d: MaterialDef) => t.add(d);

  // --- ground & rock
  add({ name: 'bedrock', colors: ['#2a2826', '#34312e', '#3d3a36'], pattern: 'stone', hardness: 0, density: 3, flags: S | F_INDESTRUCTIBLE, debris: 'rock' });
  add({ name: 'stone', colors: ['#5b5852', '#6b6862', '#7a7770', '#8a867e'], accent: '#4a4843', pattern: 'stone', hardness: 40, density: 2.6, flags: S, debris: 'rock' });
  add({ name: 'stone_dark', colors: ['#3e3c3a', '#4a4845', '#565350'], accent: '#33312f', pattern: 'stone', hardness: 45, density: 2.7, flags: S, debris: 'rock' });
  add({ name: 'dirt', colors: ['#5a4030', '#6b4c36', '#7a583e', '#86634a'], pattern: 'none', hardness: 4, density: 1.6, flags: S, debris: 'dirt' });
  add({ name: 'grass', colors: ['#4e7a2c', '#5a8a33', '#679a3a', '#78aa44'], accent: '#8fa646', pattern: 'grass', hardness: 4, density: 1.4, flags: S, debris: 'dirt', onBurn: 'scorched' });
  add({ name: 'sand', colors: ['#c8b07e', '#d4bd8a', '#dfc998', '#e8d4a6'], pattern: 'sand', hardness: 2, density: 1.5, flags: S, debris: 'sand' });
  add({ name: 'hm_sand', colors: ['#cfcfc8', '#dcdcd5', '#e7e7e1', '#f0f0eb'], pattern: 'sand', hardness: 1.5, density: 1.5, flags: S, debris: 'sand' });
  add({ name: 'gravel', colors: ['#6e6a64', '#7d7973', '#8d8982'], pattern: 'stone', hardness: 6, density: 1.8, flags: S, debris: 'rock' });

  // --- streets
  add({ name: 'asphalt', colors: ['#34363a', '#3b3d41', '#424448', '#4a4c50'], pattern: 'stone', hardness: 22, density: 2.3, flags: S, debris: 'rock' });
  add({ name: 'road_white', colors: ['#cfcfca', '#dcdcd6', '#e6e6e0'], pattern: 'none', hardness: 22, density: 2.3, flags: S, debris: 'rock' });
  add({ name: 'road_yellow', colors: ['#c9a23a', '#d6b046', '#e0bb52'], pattern: 'none', hardness: 22, density: 2.3, flags: S, debris: 'rock' });
  add({ name: 'curb', colors: ['#8c8a85', '#9a9893', '#a8a6a0'], pattern: 'none', hardness: 30, density: 2.4, flags: S, debris: 'rock' });
  add({ name: 'pavement', colors: ['#8e8a82', '#9b978f', '#a7a39b', '#b2aea6'], accent: '#76736c', pattern: 'tile', hardness: 25, density: 2.3, flags: S, debris: 'rock' });

  // --- building materials
  add({ name: 'concrete', colors: ['#8d8c88', '#9b9a96', '#a8a7a3', '#b4b3ae'], pattern: 'plaster', hardness: 28, density: 2.4, flags: S, debris: 'rock' });
  add({ name: 'concrete_dark', colors: ['#5e5d5a', '#6b6a66', '#777672'], pattern: 'plaster', hardness: 30, density: 2.4, flags: S, debris: 'rock' });
  add({ name: 'plaster_white', colors: ['#d6d2c8', '#e0dcd2', '#e9e6dd', '#f0ede6'], pattern: 'plaster', hardness: 12, density: 1.8, flags: S, debris: 'rock' });
  add({ name: 'plaster_cream', colors: ['#cdbf9f', '#d8cbab', '#e2d6b8', '#eadfc4'], pattern: 'plaster', hardness: 12, density: 1.8, flags: S, debris: 'rock' });
  add({ name: 'plaster_gray', colors: ['#9e9c97', '#acaaa4', '#b9b7b1'], pattern: 'plaster', hardness: 12, density: 1.8, flags: S, debris: 'rock' });
  add({ name: 'siding_blue', colors: ['#5a7088', '#647b94', '#6f86a0'], accent: '#4c5f74', pattern: 'stripe', hardness: 10, density: 1.4, flags: S, debris: 'metal' });
  add({ name: 'siding_beige', colors: ['#b8a888', '#c4b494', '#cfc0a0'], accent: '#a39376', pattern: 'stripe', hardness: 10, density: 1.4, flags: S, debris: 'metal' });
  add({ name: 'brick', colors: ['#7a3b2c', '#8a4532', '#985039', '#a65b42'], accent: '#b9b1a3', pattern: 'brick', hardness: 20, density: 2.0, flags: S, debris: 'rock' });
  add({ name: 'tile_white', colors: ['#c9c9c4', '#d6d6d1', '#e1e1dc'], accent: '#a9a9a4', pattern: 'tile', hardness: 18, density: 2.1, flags: S, debris: 'rock' });
  add({ name: 'wood_dark', colors: ['#3e2a1c', '#4a3322', '#563c28', '#62452e'], accent: '#33231a', pattern: 'wood', hardness: 9, density: 0.8, flags: S | F_FLAMMABLE, debris: 'wood', onBurn: 'charred' });
  add({ name: 'wood', colors: ['#6e4a2c', '#7d5634', '#8b613c', '#996c44'], accent: '#5c3d24', pattern: 'wood', hardness: 9, density: 0.8, flags: S | F_FLAMMABLE, debris: 'wood', onBurn: 'charred' });
  add({ name: 'wood_light', colors: ['#a2804f', '#b08d5a', '#bd9a66', '#c9a772'], accent: '#8c6c41', pattern: 'plank', hardness: 8, density: 0.7, flags: S | F_FLAMMABLE, debris: 'wood', onBurn: 'charred' });
  add({ name: 'wood_red', colors: ['#8e2a1e', '#a03224', '#b23b2b'], pattern: 'wood', hardness: 9, density: 0.8, flags: S | F_FLAMMABLE, debris: 'wood', onBurn: 'charred' });
  add({ name: 'roof_slate', colors: ['#2e3540', '#353d49', '#3d4652', '#46505c'], accent: '#252b33', pattern: 'tile', hardness: 14, density: 2.0, flags: S, debris: 'rock' });
  add({ name: 'roof_red', colors: ['#7a3626', '#8a3f2c', '#994833', '#a6523b'], accent: '#5f2a1e', pattern: 'tile', hardness: 14, density: 2.0, flags: S, debris: 'rock' });
  add({ name: 'roof_green', colors: ['#2f4a3c', '#365444', '#3e5e4c'], accent: '#263c31', pattern: 'tile', hardness: 14, density: 2.0, flags: S, debris: 'rock' });
  add({ name: 'roof_metal', colors: ['#5e646b', '#6a7078', '#767c84'], accent: '#4f545a', pattern: 'stripe', hardness: 16, density: 1.6, flags: S, debris: 'metal' });
  add({ name: 'tatami', colors: ['#a59a5c', '#b2a766', '#bfb371'], accent: '#3a3a2a', pattern: 'tatami', hardness: 5, density: 0.6, flags: S | F_FLAMMABLE, debris: 'foliage', onBurn: 'charred' });
  add({ name: 'shoji', colors: ['#e6e1d2', '#eeeadc', '#f4f1e6'], accent: '#6b4c32', pattern: 'tile', hardness: 3, density: 0.3, flags: S | F_FLAMMABLE, debris: 'wood', onBurn: 'charred' });
  add({ name: 'glass', colors: ['#8fb4c8', '#9fc2d4', '#b0d0e0'], pattern: 'glass', hardness: 3, density: 1.2, flags: S | F_TRANSPARENT, debris: 'glass' });
  add({ name: 'window', colors: ['#1e2a36', '#25333f', '#2d3c49', '#3a4b5a'], accent: '#55687a', pattern: 'glass', hardness: 3, density: 1.2, flags: S, debris: 'glass' });
  add({ name: 'window_lit', colors: ['#d8b56a', '#e6c47a', '#f2d48c'], pattern: 'glass', hardness: 3, density: 1.2, flags: S | F_EMISSIVE, debris: 'glass', glow: 1.4 });
  add({ name: 'metal', colors: ['#62676d', '#70757b', '#7e8389', '#8c9197'], pattern: 'metal', hardness: 60, density: 4, flags: S, debris: 'metal', metalness: 0.6, roughness: 0.45 });
  add({ name: 'metal_dark', colors: ['#2e3135', '#373a3e', '#404347'], pattern: 'metal', hardness: 60, density: 4, flags: S, debris: 'metal', metalness: 0.5, roughness: 0.5 });
  add({ name: 'rust', colors: ['#5c3424', '#6b3e2a', '#7a4830'], pattern: 'metal', hardness: 40, density: 4, flags: S, debris: 'metal' });
  add({ name: 'paint_white', colors: ['#d8d8d4', '#e4e4e0', '#eeeeea'], pattern: 'none', hardness: 30, density: 2, flags: S, debris: 'metal' });
  add({ name: 'paint_red', colors: ['#9c2420', '#b02b26', '#c0332d'], pattern: 'none', hardness: 30, density: 2, flags: S, debris: 'metal' });
  add({ name: 'paint_blue', colors: ['#24508c', '#2b5c9e', '#3368ae'], pattern: 'none', hardness: 30, density: 2, flags: S, debris: 'metal' });
  add({ name: 'paint_yellow', colors: ['#c69a1e', '#d6a826', '#e2b630'], pattern: 'none', hardness: 30, density: 2, flags: S, debris: 'metal' });
  add({ name: 'paint_green', colors: ['#2c6a3c', '#337a45', '#3b8a4e'], pattern: 'none', hardness: 30, density: 2, flags: S, debris: 'metal' });
  add({ name: 'sign_white', colors: ['#e2e2dc', '#ecece6', '#f4f4ee'], pattern: 'none', hardness: 6, density: 1, flags: S | F_EMISSIVE, debris: 'glass', glow: 0.6 });
  add({ name: 'neon_pink', colors: ['#ff4f9a', '#ff6fae', '#ff8fc2'], pattern: 'none', hardness: 4, density: 1, flags: S | F_EMISSIVE, debris: 'glass', glow: 3.0 });
  add({ name: 'neon_cyan', colors: ['#3fd8ff', '#62e2ff', '#86ebff'], pattern: 'none', hardness: 4, density: 1, flags: S | F_EMISSIVE, debris: 'glass', glow: 3.0 });
  add({ name: 'lantern', colors: ['#ffb45a', '#ffc46e', '#ffd282'], pattern: 'none', hardness: 4, density: 0.5, flags: S | F_EMISSIVE | F_FLAMMABLE, debris: 'cloth', glow: 2.6 });
  add({ name: 'lamp', colors: ['#fff1d0', '#fff6e0', '#fffbef'], pattern: 'none', hardness: 4, density: 0.5, flags: S | F_EMISSIVE, debris: 'glass', glow: 4.0 });

  // --- Soul Society
  add({ name: 'seireitei_wall', colors: ['#d9d4c6', '#e3dfd2', '#ebe8dd', '#f2efe6'], pattern: 'plaster', hardness: 35, density: 2.2, flags: S, debris: 'rock' });
  add({ name: 'sekkiseki', colors: ['#cfcabd', '#dad6ca', '#e4e0d5', '#ece9df'], accent: '#bdb8aa', pattern: 'brick', hardness: 2500, density: 3, flags: S | F_REIATSU_BLOCK, debris: 'rock' });
  add({ name: 'stone_path', colors: ['#8e8b84', '#9c9992', '#aaa7a0'], accent: '#6e6b65', pattern: 'tile', hardness: 35, density: 2.5, flags: S, debris: 'rock' });

  // --- Hueco Mundo
  add({ name: 'quartz', colors: ['#d6dade', '#e2e6ea', '#eef1f4', '#f8fafb'], pattern: 'glass', hardness: 10, density: 2.6, flags: S, debris: 'glass' });
  add({ name: 'lasnoches_stone', colors: ['#d8d8d2', '#e2e2dc', '#ebebe6', '#f3f3ef'], accent: '#c6c6c0', pattern: 'tile', hardness: 120, density: 2.8, flags: S, debris: 'rock' });

  // --- nature
  add({ name: 'bark', colors: ['#3d2c20', '#4a3626', '#56402d'], pattern: 'wood', accent: '#2e2118', hardness: 10, density: 0.9, flags: S | F_FLAMMABLE, debris: 'wood', onBurn: 'charred' });
  add({ name: 'leaves', colors: ['#2f5e26', '#386b2c', '#427a33', '#4d893b', '#5a9844'], pattern: 'leaves', hardness: 1, density: 0.2, flags: S | F_FLAMMABLE | F_FOLIAGE, debris: 'foliage', onBurn: 'ash' });
  add({ name: 'leaves_autumn', colors: ['#8a3a1e', '#a24824', '#b8582c', '#c96a34'], pattern: 'leaves', hardness: 1, density: 0.2, flags: S | F_FLAMMABLE | F_FOLIAGE, debris: 'foliage', onBurn: 'ash' });
  add({ name: 'sakura', colors: ['#d98aa6', '#e49ab3', '#eeaec2', '#f6c4d3'], pattern: 'leaves', hardness: 1, density: 0.2, flags: S | F_FLAMMABLE | F_FOLIAGE, debris: 'foliage', onBurn: 'ash' });
  add({ name: 'hedge', colors: ['#2a5322', '#315e28', '#38692e'], pattern: 'leaves', hardness: 2, density: 0.3, flags: S | F_FLAMMABLE | F_FOLIAGE, debris: 'foliage', onBurn: 'ash' });
  add({ name: 'water', colors: ['#1f4e66', '#265d78', '#2e6c8a'], pattern: 'glass', hardness: 0.5, density: 1, flags: F_TRANSPARENT | F_LIQUID, debris: 'liquid' });
  add({ name: 'ice', colors: ['#9fd3ec', '#b5def2', '#cbe9f7', '#e0f3fb'], pattern: 'glass', hardness: 16, density: 0.9, flags: S | F_TRANSPARENT, debris: 'ice' });
  add({ name: 'lava', colors: ['#ff5a1a', '#ff7a2a', '#ff9a3a'], pattern: 'none', hardness: 1, density: 2.5, flags: F_EMISSIVE | F_LIQUID, debris: 'liquid', glow: 5.0 });

  // --- residue states
  add({ name: 'scorched', colors: ['#2a2420', '#332c27', '#3c342e'], pattern: 'stone', hardness: 5, density: 1.4, flags: S, debris: 'dirt' });
  add({ name: 'charred', colors: ['#1c1816', '#24201d', '#2c2724'], pattern: 'wood', accent: '#3a1e12', hardness: 4, density: 0.5, flags: S, debris: 'wood' });
  add({ name: 'ash', colors: ['#6e6a66', '#7c7874', '#8a8682'], pattern: 'sand', hardness: 0.5, density: 0.3, flags: S, debris: 'sand' });
  add({ name: 'molten', colors: ['#ff6a1a', '#ff8a2a', '#ffaa44'], pattern: 'none', hardness: 4, density: 2.5, flags: S | F_EMISSIVE, debris: 'rock', glow: 4.0 });
  // ---- town (Karakura)
  add({ name: 'cinder', colors: ['#8f8d87', '#9b9993', '#a6a49e', '#b0aea8'], accent: '#7c7a75', pattern: 'brick', hardness: 18, density: 2.1, flags: S, debris: 'rock' });
  add({ name: 'kawara', colors: ['#3a414b', '#424a55', '#4b5460', '#555f6b'], accent: '#2c3239', pattern: 'tile', hardness: 14, density: 2.0, flags: S, debris: 'rock' });
  add({ name: 'kawara_brown', colors: ['#5a3e30', '#664737', '#72503e', '#7d5945'], accent: '#43302a', pattern: 'tile', hardness: 14, density: 2.0, flags: S, debris: 'rock' });
  add({ name: 'plaster_beige', colors: ['#c9b897', '#d3c3a3', '#dccdb0', '#e5d7bd'], pattern: 'plaster', hardness: 12, density: 1.8, flags: S, debris: 'rock' });
  add({ name: 'plaster_blue', colors: ['#9fb0bd', '#aabbc8', '#b5c5d1'], pattern: 'plaster', hardness: 12, density: 1.8, flags: S, debris: 'rock' });
  add({ name: 'school_cream', colors: ['#d9d0b8', '#e2d9c2', '#eae2cd', '#f0e9d7'], pattern: 'plaster', hardness: 26, density: 2.3, flags: S, debris: 'rock' });
  add({ name: 'clay', colors: ['#a27a55', '#ad8560', '#b8906b', '#c29b76'], pattern: 'sand', hardness: 3, density: 1.6, flags: S, debris: 'dirt' });
  add({ name: 'awning_red', colors: ['#a32c26', '#b5352e', '#c43f36'], accent: '#e8e2d6', pattern: 'stripe', hardness: 3, density: 0.4, flags: S | F_FLAMMABLE, debris: 'cloth', onBurn: 'charred' });
  add({ name: 'awning_blue', colors: ['#2b5a8c', '#33679c', '#3b74ab'], accent: '#e8e2d6', pattern: 'stripe', hardness: 3, density: 0.4, flags: S | F_FLAMMABLE, debris: 'cloth', onBurn: 'charred' });
  add({ name: 'awning_green', colors: ['#2f6a43', '#37784d', '#408657'], accent: '#e8e2d6', pattern: 'stripe', hardness: 3, density: 0.4, flags: S | F_FLAMMABLE, debris: 'cloth', onBurn: 'charred' });
  add({ name: 'shutter', colors: ['#7f8287', '#8b8e93', '#979a9f'], accent: '#6a6d72', pattern: 'stripe', hardness: 30, density: 3, flags: S, debris: 'metal', metalness: 0.4, roughness: 0.5 });
  add({ name: 'vending', colors: ['#d8dde2', '#e2e7eb', '#ebeff2'], pattern: 'none', hardness: 25, density: 2, flags: S | F_EMISSIVE, debris: 'metal', glow: 0.5 });
  add({ name: 'pole', colors: ['#7d7b76', '#8a8883', '#96948f'], pattern: 'none', hardness: 35, density: 2.4, flags: S, debris: 'rock' });
  add({ name: 'wire', colors: ['#1f1f22', '#262629'], pattern: 'none', hardness: 2, density: 1, flags: S, debris: 'metal' });
  add({ name: 'sign_red', colors: ['#b8262c', '#c92f35', '#d8393f'], pattern: 'none', hardness: 6, density: 1, flags: S | F_EMISSIVE, debris: 'glass', glow: 0.9 });
  add({ name: 'sign_blue', colors: ['#2659b8', '#2f66c9', '#3a73d8'], pattern: 'none', hardness: 6, density: 1, flags: S | F_EMISSIVE, debris: 'glass', glow: 0.9 });
  add({ name: 'sign_yellow', colors: ['#d8a81e', '#e6b628', '#f0c232'], pattern: 'none', hardness: 6, density: 1, flags: S | F_EMISSIVE, debris: 'glass', glow: 0.9 });
  add({ name: 'mailbox', colors: ['#b3221d', '#c42a24', '#d4342d'], pattern: 'none', hardness: 30, density: 3, flags: S, debris: 'metal', metalness: 0.3 });
  add({ name: 'gravel_dark', colors: ['#55524c', '#615e58', '#6d6a64'], pattern: 'stone', hardness: 6, density: 1.8, flags: S, debris: 'rock' });
  add({ name: 'bone', colors: ['#d8d6cc', '#e4e2d8', '#efede4'], pattern: 'none', hardness: 25, density: 1.9, flags: S, debris: 'bone' });
  add({ name: 'reishi_crystal', colors: ['#7fd2ff', '#a0e0ff', '#c4eeff'], pattern: 'glass', hardness: 8, density: 1, flags: S | F_EMISSIVE | F_TRANSPARENT, debris: 'glass', glow: 2.0 });
  // rotted by Baraggan's Respira: crumbly, dull brown-grey, falls apart at a touch
  add({ name: 'decayed', colors: ['#3d362f', '#4a4239', '#574e44', '#62584c'], pattern: 'sand', hardness: 1.5, density: 0.8, flags: S, debris: 'dirt' });
  // a floor turned to lava (Burner Finger 3): a dark red crust over glowing seams, hot yellow veins
  add({ name: 'magma', colors: ['#5a160c', '#8e2412', '#c83a16', '#f0601e'], accent: '#ffc23a', pattern: 'stone', hardness: 4, density: 2.5, flags: S | F_EMISSIVE, debris: 'rock', glow: 1.5 });
  // Gerard's cape stretched into a wall: heavy red cloth, stiff with reiatsu (it stops bodies and shots; a strong cut tears it)
  add({ name: 'cape_red', colors: ['#8a121a', '#a3161f', '#b31b25'], pattern: 'none', hardness: 140, density: 0.6, flags: S | F_FLAMMABLE, debris: 'cloth', onBurn: 'charred' });

  // --- Karakura v2: streets, towers, the shrine
  add({ name: 'signal_green', colors: ['#2fd6a0', '#46e2b2', '#62ecc2'], pattern: 'none', hardness: 4, density: 1, flags: S | F_EMISSIVE, debris: 'glass', glow: 2.4 });
  add({ name: 'sign_green', colors: ['#1f8a4c', '#26985a', '#2fa868'], pattern: 'none', hardness: 6, density: 1, flags: S | F_EMISSIVE, debris: 'glass', glow: 0.9 });
  add({ name: 'sign_orange', colors: ['#e0761e', '#ec8628', '#f49634'], pattern: 'none', hardness: 6, density: 1, flags: S | F_EMISSIVE, debris: 'glass', glow: 0.9 });
  add({ name: 'tire', colors: ['#1c1c1f', '#232326', '#2a2a2e'], pattern: 'none', hardness: 12, density: 1.2, flags: S, debris: 'rock' });
  add({ name: 'car_silver', colors: ['#8e949a', '#9ca2a8', '#aab0b6', '#b8bdc2'], pattern: 'none', hardness: 30, density: 2, flags: S, debris: 'metal', metalness: 0.5, roughness: 0.4 });
  add({ name: 'torii', colors: ['#b0341e', '#c13d24', '#d0482c'], pattern: 'none', hardness: 10, density: 0.8, flags: S | F_FLAMMABLE, debris: 'wood', onBurn: 'charred' });
  add({ name: 'shimenawa', colors: ['#b19c64', '#bfaa72', '#cdb880'], pattern: 'none', hardness: 2, density: 0.4, flags: S | F_FLAMMABLE, debris: 'cloth', onBurn: 'ash' });
  add({ name: 'copper_green', colors: ['#4a786b', '#548678', '#5f9485', '#6aa292'], accent: '#3c6257', pattern: 'tile', hardness: 14, density: 2.0, flags: S, debris: 'metal' });
  add({ name: 'noren', colors: ['#1f2c4d', '#26365c', '#2e406a'], pattern: 'none', hardness: 1, density: 0.2, flags: S | F_FLAMMABLE, debris: 'cloth', onBurn: 'ash' });
  add({ name: 'manhole', colors: ['#2d2e30', '#36373a', '#3f4043'], pattern: 'metal', hardness: 70, density: 4, flags: S, debris: 'metal', metalness: 0.5, roughness: 0.6 });
  add({ name: 'glass_office', colors: ['#24425c', '#2c506c', '#365e7e', '#426c8e'], accent: '#7d97ad', pattern: 'glass', hardness: 4, density: 1.2, flags: S, debris: 'glass', roughness: 0.25 });
  add({ name: 'cladding', colors: ['#8b9298', '#99a0a6', '#a7aeb4', '#b4bbc0'], accent: '#7a8187', pattern: 'stripe', hardness: 30, density: 2.2, flags: S, debris: 'metal', metalness: 0.3, roughness: 0.5 });

  return t;
}
