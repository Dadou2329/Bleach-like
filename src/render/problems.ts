// What went wrong with the graphics on this machine, kept in one place: the renderer, the engine loop and the mesh
// workers report here, and the diagnostics panel (ui/diag.ts) shows it. Each problem is reported once (by id).
import type * as THREE from 'three';

export type ProblemLevel = 'info' | 'warn' | 'error';

export interface Problem {
  id: string;
  level: ProblemLevel;
  title: string;
  detail?: string;
  /** set when the problem went away (a GPU reset that recovered) */
  resolved?: boolean;
}

const seen = new Map<string, Problem>();
const listeners: ((p: Problem) => void)[] = [];

export function reportProblem(p: Problem): void {
  const old = seen.get(p.id);
  if (old && !p.resolved && !old.resolved) return;
  seen.set(p.id, p);
  const line = `[reishi] ${p.title}${p.detail ? ` — ${p.detail}` : ''}`;
  if (p.level === 'error') console.error(line);
  else console.warn(line);
  for (const l of listeners) l(p);
}

/** subscribe (and receive what was already reported) */
export function onProblem(l: (p: Problem) => void): void {
  listeners.push(l);
  for (const p of seen.values()) l(p);
}

export function problems(): Problem[] {
  return [...seen.values()];
}

export function errorText(e: unknown): string {
  if (e instanceof Error) return `${e.name}: ${e.message}${e.stack ? `\n${e.stack.split('\n').slice(1, 4).join('\n')}` : ''}`;
  return String(e);
}

/**
 * Can this GPU draw into half-float textures? The post stack's HDR buffers, the AO and the sky reflections need it;
 * without EXT_color_buffer_float (or its half-float sibling) such a framebuffer is incomplete and every frame comes out
 * black. Enables the extension when it exists, then checks a real framebuffer.
 */
export function halfFloatRenderable(renderer: THREE.WebGLRenderer): boolean {
  const gl = renderer.getContext() as WebGL2RenderingContext;
  if (!(gl instanceof WebGL2RenderingContext)) return false;
  const ext = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
  if (!ext) return false;
  const tex = gl.createTexture(), fb = gl.createFramebuffer();
  let ok = false;
  try {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, 4, 4, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  } catch {
    ok = false;
  } finally {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.deleteFramebuffer(fb);
    gl.deleteTexture(tex);
    renderer.resetState();
  }
  return ok;
}

export interface GpuInfo {
  renderer: string;
  vendor: string;
  webgl: string;
  maxTexture: number;
  floatTargets: boolean;
  pixelRatio: number;
  canvas: string;
}

export function gpuInfo(renderer: THREE.WebGLRenderer, floatTargets: boolean): GpuInfo {
  const gl = renderer.getContext();
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  return {
    renderer: String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)),
    vendor: String(dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)),
    webgl: String(gl.getParameter(gl.VERSION)),
    maxTexture: Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)),
    floatTargets,
    pixelRatio: renderer.getPixelRatio(),
    canvas: `${renderer.domElement.width}×${renderer.domElement.height}`,
  };
}

/** the GPU's name, from a throwaway context (null if WebGL2 is missing) */
export function probeGpuName(): string | null {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return null;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return name;
  } catch {
    return null;
  }
}

/** integrated, mobile or software GPUs: start them on the low graphics settings */
export function weakGpu(name: string): boolean {
  return /swiftshader|llvmpipe|softpipe|basic render|microsoft basic|intel|uhd graphics|iris|hd graphics|mali|adreno|powervr|videocore|radeon\(tm\) graphics|radeon graphics|vega \d+ graphics/i.test(name);
}
