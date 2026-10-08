// A second blade in the other hand (TYBW Ichigo's small Zangetsu): samples the prop's base and tip every step,
// draws its own sword trail and, while a cut is open, sweeps hits through Game.bladeSweep with its own hit set, so
// a twin strike can land with both blades.
import * as THREE from 'three';
import type { BladeSpec, Fighter } from './fighter';
import type { Game } from './game';
import { SwordTrail } from '../vfx/trail';

export class OffBlade {
  readonly base = new THREE.Vector3();
  readonly tip = new THREE.Vector3();
  private prevBase = new THREE.Vector3();
  private prevTip = new THREE.Vector3();
  private valid = false;
  active = false;
  spec: BladeSpec | null = null;
  readonly hits = new Set<number>();
  readonly trail: SwordTrail;

  constructor(private g: Game, private f: Fighter, public prop: string, public baseZ: number, public tipZ: number, color: THREE.ColorRepresentation, core: THREE.ColorRepresentation) {
    this.trail = new SwordTrail(26, color, core);
    g.engine.gr.scene.add(this.trail.mesh);
  }

  /** open a cut: fresh hit memory */
  open(spec: BladeSpec): void {
    this.spec = spec;
    this.hits.clear();
    this.active = true;
  }

  close(): void {
    this.active = false;
  }

  /** the prop moved to another socket or was swapped: do not sweep across the jump */
  invalidate(): void {
    this.valid = false;
  }

  update(dt: number): void {
    const p = this.f.visual.props.get(this.prop);
    if (!p || !p.visible || this.f.dead) {
      this.valid = false;
      this.trail.emitting = false;
      this.trail.update(dt, this.base, this.tip);
      return;
    }
    p.updateWorldMatrix(true, false);
    this.prevBase.copy(this.base);
    this.prevTip.copy(this.tip);
    this.base.set(0, 0, this.baseZ).applyMatrix4(p.matrixWorld);
    this.tip.set(0, 0, this.tipZ).applyMatrix4(p.matrixWorld);
    if (!this.valid) {
      this.prevBase.copy(this.base);
      this.prevTip.copy(this.tip);
      this.valid = true;
    }
    this.trail.emitting = this.active;
    this.trail.update(dt, this.base, this.tip);
    if (this.active && this.spec) this.g.bladeSweep(this.f, this.prevBase, this.prevTip, this.base, this.tip, this.spec, this.hits);
  }

  dispose(): void {
    this.trail.mesh.removeFromParent();
  }
}
