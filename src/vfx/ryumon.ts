// Ikkaku Madarame's effects (docs/roster/C1-lieutenants-1.md §Ikkaku). Ryūmon Hōzukimaru as a rig: the great
// centre blade floating behind his back on its two chains to the pommels of the guandao and the spade, the dragon
// crest on its face filling with red bit by bit; taken by its handle it turns the whole rig into a pinwheel (the
// outer blades whirled out on short chains); hurled, it rolls out like a guillotine wheel and is hauled back on
// the chains; swung in behind a cut, it falls on the foe. Also the Bankai's reiatsu tornado, the red reiatsu
// explosion and its smoke, the styptic paste and the lucky dance.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { BladeSpec, Fighter } from '../game/fighter';
import { PropMesh } from '../game/characterFactory';
import { CENTER_EDGE_Y, CENTER_HALF_W, CENTER_HANDLE_Y, CENTER_MID_Y, CENTER_RING, CREST_SLICES, GUANDAO_HEAD, POLE_RING_Z, SPADE_HEAD, ikkakuCrestSlice, ikkakuProp } from '../chars/ikkaku';
import { ChainLine, segToFighter } from './shiro';
import { BoxShape, SphereShape } from '../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

/** red reiatsu (dossier `#E2363B`) */
export const IKKAKU_RED = { core: '#FFE2DA', body: '#E2363B', rim: '#8E1418' };
const CHAIN = '#4A4D52';
/** the crest's crimson as it fills, and the full crest's glow (linear, HDR) */
const CREST_FILL = new THREE.Color('#C3141F');
const CREST_FULL = new THREE.Color('#FF3B3B').multiplyScalar(2.2);

const UP = new THREE.Vector3(0, 1, 0);
const ONE = new THREE.Vector3(1, 1, 1);
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();
const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();

export type RigMode = 'float' | 'held' | 'hurl' | 'swoop';

export interface HurlOpts {
  speed: number;
  range: number;
  damage: number;
  knock: number;
  /** carve power along the path */
  cut: number;
}

interface Sample {
  pb: THREE.Vector3;
  pt: THREE.Vector3;
  cb: THREE.Vector3;
  ct: THREE.Vector3;
  ok: boolean;
}
const sample = (): Sample => ({ pb: new THREE.Vector3(), pt: new THREE.Vector3(), cb: new THREE.Vector3(), ct: new THREE.Vector3(), ok: false });

/**
 * Ryūmon Hōzukimaru's centre blade and chains. The kit owns the guandao ('sword', right hand) and the spade
 * ('spade', left hand) as hand props; the rig draws the centre blade, its crest, the two chains to their pommels
 * and — while the centre blade is held — free copies of the outer blades whirled out on short chains.
 */
export class RyumonRig implements Projectile {
  done = false;
  mode: RigMode = 'float';
  /** 0…1 (the kit's crest meter) */
  crest = 0;
  /** the spade is off on its own chain (a TetherBlade draws that one) */
  spadeOut = false;
  /** while held: the outer blades cut what they pass (null: harmless, e.g. the raise before the explosion) */
  spinSpec: BladeSpec | null = null;
  readonly spinHits = new Set<number>();
  /** world transform of the centre blade's origin */
  readonly pos = new THREE.Vector3();
  readonly quat = new THREE.Quaternion();
  private center: PropMesh;
  private slices: PropMesh[] = [];
  private freeG: PropMesh;
  private freeS: PropMesh;
  private chainG: ChainLine;
  private chainS: ChainLine;
  private t = 0;
  private placed = false;
  private turnAcc = 0;
  private lastAng = NaN;
  private xw = new THREE.Vector3();
  private sg = sample();
  private ss = sample();
  private sc = sample();
  // the hurl
  private hurl: HurlOpts | null = null;
  private hurlP = new THREE.Vector3();
  private hurlDir = new THREE.Vector3();
  private hurlOut = 0;
  private hurlBack = false;
  private hurlSpin = 0;
  private hurlHits = new Set<number>();
  private hurlPrev = new THREE.Vector3();
  /** true once a hurl is over and the blade is back behind him */
  hurlDone = true;
  // the swoop
  private swoopT = 0;
  private swoopSpec: BladeSpec | null = null;
  private swoopHits = new Set<number>();
  private swoopFrom = new THREE.Vector3();
  private swoopTo = new THREE.Vector3();
  private swoopSide = new THREE.Vector3();

  constructor(private g: Game, readonly f: Fighter) {
    const scene = g.engine.gr.scene;
    this.center = new PropMesh(ikkakuProp('center'));
    this.center.matrixAutoUpdate = false;
    this.center.frustumCulled = false;
    for (let i = 0; i < CREST_SLICES; i++) {
      const s = new PropMesh(ikkakuCrestSlice(i));
      s.castShadow = false;
      this.center.add(s);
      this.slices.push(s);
    }
    this.freeG = new PropMesh(ikkakuProp('guandao'));
    this.freeS = new PropMesh(ikkakuProp('spade'));
    for (const m of [this.freeG, this.freeS]) {
      m.matrixAutoUpdate = false;
      m.frustumCulled = false;
      m.visible = false;
    }
    scene.add(this.center, this.freeG, this.freeS);
    this.chainG = new ChainLine(g, CHAIN, 0.036);
    this.chainS = new ChainLine(g, CHAIN, 0.036);
  }

  /** a point on the centre blade (prop frame, m) in the world */
  local(x: number, y: number, z: number, out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(x, y, z).applyQuaternion(this.quat).add(this.pos);
  }

  /** the middle of the centre blade (world) */
  mid(out = new THREE.Vector3()): THREE.Vector3 {
    return this.local(0, CENTER_MID_Y, 0, out);
  }

  /** Take the centre blade in both hands (spin, explosion), or let it float again. */
  hold(on: boolean, spec: BladeSpec | null = null): void {
    if (this.mode === 'hurl') return;
    this.mode = on ? 'held' : 'float';
    this.spinSpec = on ? spec : null;
    this.spinHits.clear();
    this.sg.ok = this.ss.ok = this.sc.ok = false;
    this.turnAcc = 0;
    this.lastAng = NaN;
  }

  /** Launch the centre blade at a point, rolling like a wheel; it comes back on its chains. */
  throwAt(target: THREE.Vector3, o: HurlOpts): void {
    this.hurl = o;
    this.mode = 'hurl';
    this.hurlDone = false;
    this.hurlBack = false;
    this.hurlOut = 0;
    this.hurlHits.clear();
    this.mid(this.hurlP);
    this.hurlPrev.copy(this.hurlP);
    this.hurlDir.subVectors(target, this.hurlP);
    if (this.hurlDir.lengthSq() < 1e-4) this.hurlDir.set(Math.sin(this.f.yaw), 0, Math.cos(this.f.yaw));
    this.hurlDir.normalize();
  }

  /** Haul a hurled blade back now. */
  recall(): void {
    if (this.mode === 'hurl') this.hurlBack = true;
  }

  /** The delayed third blow: the centre blade dives over his shoulder onto the point in front of him. */
  swoop(spec: BladeSpec): void {
    if (this.mode !== 'float') return;
    const f = this.f;
    this.mode = 'swoop';
    this.swoopT = 0;
    this.swoopSpec = spec;
    this.swoopHits.clear();
    this.sc.ok = false;
    const fw = _a.set(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    this.swoopFrom.copy(this.pos);
    this.swoopTo.copy(f.pos).addScaledVector(fw, 2.3).setY(f.pos.y + 0.5);
    this.swoopSide.set(fw.z, 0, -fw.x);
  }

  update(_dt: number, g: Game): void {
    const f = this.f;
    if (!g.fighters.includes(f)) this.done = true;
  }

  render(dt: number, time: number): void {
    if (this.done) return;
    const f = this.f;
    this.t += dt;
    dt = Math.min(dt, 0.05);
    const props = f.visual.props;
    const pg = props.get('sword');
    const ps = props.get('spade');
    let free = false;
    if (this.mode === 'held') free = this.placeHeld(dt);
    else if (this.mode === 'hurl') this.stepHurl(dt);
    else if (this.mode === 'swoop') this.stepSwoop(dt);
    else this.placeFloat(dt);
    // the meshes
    _m.compose(this.pos, this.quat, ONE);
    this.center.matrix.copy(_m);
    this.center.matrixWorldNeedsUpdate = true;
    this.center.visible = !f.dead || f.deathT < 1.2;
    if (pg) pg.visible = !free;
    if (ps) ps.visible = !free && !this.spadeOut;
    this.freeG.visible = free;
    this.freeS.visible = free;
    // the chains: from the outer pommels to the centre blade's rings
    const ringG = _c, ringS = _d;
    if (free) {
      this.freeG.updateMatrixWorld();
      this.freeS.updateMatrixWorld();
    }
    const gSrc = free ? this.freeG : pg;
    const sSrc = free ? this.freeS : ps;
    // which end each one hangs from: floating, +x is his right; held, +x is his left
    const sideG = this.mode === 'held' ? -1 : 1;
    if (gSrc) {
      gSrc.updateWorldMatrix(true, false);
      ringG.set(0, 0, POLE_RING_Z).applyMatrix4(gSrc.matrixWorld);
      const end = this.local(sideG * CENTER_RING[0], CENTER_RING[1], 0, _a);
      const span = end.distanceTo(ringG);
      this.chainG.update(ringG, end, free ? 0.02 : Math.min(0.6, span * 0.14));
    } else this.chainG.hide();
    if (sSrc && !this.spadeOut) {
      sSrc.updateWorldMatrix(true, false);
      ringS.set(0, 0, POLE_RING_Z).applyMatrix4(sSrc.matrixWorld);
      const end = this.local(-sideG * CENTER_RING[0], CENTER_RING[1], 0, _a);
      const span = end.distanceTo(ringS);
      this.chainS.update(ringS, end, free ? 0.02 : Math.min(0.6, span * 0.14));
    } else this.chainS.hide();
    // the crest: crimson creeping from the tail toward the head; full, the whole dragon blazes
    const full = this.crest >= 0.999;
    const pulse = 0.85 + 0.15 * Math.sin(time * 9);
    for (let k = 0; k < CREST_SLICES; k++) {
      const u = this.slices[k].material.userData.uniforms;
      u.uTime.value = time;
      const fill = Math.max(0, Math.min(1, this.crest * CREST_SLICES - k));
      if (full) u.uEnergy.value.set(CREST_FULL.r * pulse, CREST_FULL.g * pulse, CREST_FULL.b * pulse, 1);
      else if (fill > 0) u.uEnergy.value.set(CREST_FILL.r, CREST_FILL.g, CREST_FILL.b, 0.3 + 0.7 * fill);
      else u.uEnergy.value.w = 0;
    }
    for (const m of [this.center, this.freeG, this.freeS]) m.material.userData.uniforms.uTime.value = time;
    // a full crest smoulders off the blade
    if (full && Math.random() < 0.6) {
      const p = this.local((Math.random() - 0.5) * 1.4, CENTER_MID_Y + (Math.random() - 0.5) * 0.3, 0.05, _a);
      this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 0.4, vy: 0.8 + Math.random(), vz: (Math.random() - 0.5) * 0.4, size: 0.12, sizeEnd: 0.02, life: 0.5, r: 1, g: 0.2, b: 0.2, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  /** behind his back, bobbing, the crest facing out behind him */
  private placeFloat(dt: number): void {
    const f = this.f;
    const back = f.visual.rig.sockets.get('back');
    const fw = _a.set(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    if (back) back.getWorldPosition(_b);
    else f.center(_b);
    const bob = Math.sin(this.t * 1.9) * 0.05;
    _b.addScaledVector(fw, -0.46).addScaledVector(UP, 0.34 + bob);
    // its origin sits on the spine: drop it so the blade's middle is at the target
    _z.copy(fw).negate();
    _y.copy(UP).applyAxisAngle(fw, Math.sin(this.t * 1.3) * 0.06);
    _x.crossVectors(_y, _z).normalize();
    _y.crossVectors(_z, _x).normalize();
    _m.makeBasis(_x, _y, _z);
    _q.setFromRotationMatrix(_m);
    _b.addScaledVector(_y, -CENTER_MID_Y * 0.4);
    // a teleport (or the first frame): there at once, not dragged across the field on its chains
    if (this.pos.distanceToSquared(_b) > 36) this.placed = false;
    if (!this.placed) {
      this.pos.copy(_b);
      this.quat.copy(_q);
      this.placed = true;
      return;
    }
    this.pos.lerp(_b, 1 - Math.exp(-dt * 9));
    this.quat.slerp(_q, 1 - Math.exp(-dt * 7));
  }

  /** in both hands by the handle, the edge out from his chest; the outer blades whirled out on short chains */
  private placeHeld(dt: number): boolean {
    const f = this.f;
    const rig = f.visual.rig;
    const sR = rig.sockets.get('grip.R'), sL = rig.sockets.get('grip.L'), sC = rig.sockets.get('chest.front');
    if (!sR || !sL || !sC) return false;
    sR.getWorldPosition(_a);
    sL.getWorldPosition(_b);
    sC.getWorldPosition(_c);
    const mid = _d.addVectors(_a, _b).multiplyScalar(0.5);
    _x.subVectors(_b, _a);
    if (_x.lengthSq() < 1e-6) _x.set(Math.cos(f.yaw), 0, -Math.sin(f.yaw));
    _x.normalize();
    // the edge points the way the arms do (forward at the chest, up overhead, down in the slam)
    const edge = _y.subVectors(mid, _c);
    edge.addScaledVector(_x, -edge.dot(_x));
    if (edge.lengthSq() < 1e-6) edge.set(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    edge.normalize().negate();
    _z.crossVectors(_x, _y).normalize();
    _m.makeBasis(_x, _y, _z);
    _q.setFromRotationMatrix(_m);
    const target = mid.addScaledVector(_y, -CENTER_HANDLE_Y);
    const k = 1 - Math.exp(-dt * 26);
    this.pos.lerp(target, k);
    this.quat.slerp(_q, k);
    // the outer blades: the guandao off the right end (−x), the spade off the left (+x), edges leading the turn
    const xw = this.xw.set(1, 0, 0).applyQuaternion(this.quat);
    this.placeOuter(this.freeG, -1, xw);
    this.placeOuter(this.freeS, 1, xw);
    // every full turn they may cut the same man again
    const ang = Math.atan2(xw.x, xw.z);
    if (!Number.isNaN(this.lastAng)) {
      let d = ang - this.lastAng;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      this.turnAcc += Math.abs(d);
      if (this.turnAcc >= Math.PI * 2) {
        this.turnAcc -= Math.PI * 2;
        this.spinHits.clear();
      }
    }
    this.lastAng = ang;
    if (this.spinSpec) {
      this.freeG.updateMatrixWorld();
      this.freeS.updateMatrixWorld();
      this.sweep(this.sg, this.freeG, GUANDAO_HEAD[1], this.spinSpec, this.spinHits);
      this.sweep(this.ss, this.freeS, SPADE_HEAD[1], this.spinSpec, this.spinHits);
      // the centre blade's own edge
      this.local(-CENTER_HALF_W, CENTER_EDGE_Y * 0.8, 0, this.sc.cb);
      this.local(CENTER_HALF_W, CENTER_EDGE_Y * 0.8, 0, this.sc.ct);
      this.sweepSample(this.sc, this.spinSpec, this.spinHits);
    }
    return true;
  }

  private placeOuter(m: PropMesh, side: number, xw: THREE.Vector3): void {
    const out = _a.copy(xw).multiplyScalar(side);
    const ring = this.local(side * CENTER_RING[0], CENTER_RING[1], 0, _b).addScaledVector(out, 0.28);
    const origin = ring.addScaledVector(out, -POLE_RING_Z);
    // the edge (−y) leads the turn (he spins to his left: the world turns counter-clockwise from above)
    const lead = _c.crossVectors(UP, out);
    if (lead.lengthSq() < 1e-6) lead.set(0, 1, 0);
    lead.normalize();
    _y.copy(lead).negate();
    _x.crossVectors(_y, out).normalize();
    _y.crossVectors(out, _x).normalize();
    _m.makeBasis(_x, _y, out).setPosition(origin);
    m.matrix.copy(_m);
    m.matrixWorldNeedsUpdate = true;
  }

  /** an outer blade's whole length (pommel → point) swept since the last frame */
  private sweep(s: Sample, m: PropMesh, tipZ: number, spec: BladeSpec, hits: Set<number>): void {
    s.cb.set(0, 0, -0.85).applyMatrix4(m.matrixWorld);
    s.ct.set(0, 0, tipZ).applyMatrix4(m.matrixWorld);
    this.sweepSample(s, spec, hits);
  }

  private sweepSample(s: Sample, spec: BladeSpec, hits: Set<number>): void {
    if (s.ok) this.g.bladeSweep(this.f, s.pb, s.pt, s.cb, s.ct, spec, hits);
    s.pb.copy(s.cb);
    s.pt.copy(s.ct);
    s.ok = true;
  }

  /** the wheel rolls out, cutting, and is hauled back on the chains */
  private stepHurl(dt: number): void {
    const o = this.hurl!;
    const g = this.g, f = this.f;
    this.hurlSpin += dt * 17;
    this.hurlPrev.copy(this.hurlP);
    if (!this.hurlBack) {
      const step = o.speed * dt;
      this.hurlP.addScaledVector(this.hurlDir, step);
      this.hurlOut += step;
      if (this.hurlOut >= o.range) this.hurlBack = true;
      else if (this.hurlOut > 1.5 && g.engine.world.isSolidAtPos(this.hurlP.x, this.hurlP.y - 0.6, this.hurlP.z) && g.engine.world.isSolidAtPos(this.hurlP.x, this.hurlP.y + 0.3, this.hurlP.z)) {
        // buried in a wall: a last bite and back
        g.engine.destruction.carve(new SphereShape(this.hurlP.clone(), 1.3, 0.8), { mode: 'cut', power: o.cut, dir: this.hurlDir.clone(), sparks: [1, 0.5, 0.45], dust: 0.6 });
        g.sfx.play('impact', this.hurlP, 1);
        this.hurlBack = true;
      }
      if (this.hurlBack) this.hurlHits.clear();
    } else {
      // home: the float point behind his back
      const back = f.visual.rig.sockets.get('back');
      if (back) back.getWorldPosition(_a);
      else f.center(_a);
      _a.addScaledVector(_b.set(Math.sin(f.yaw), 0, Math.cos(f.yaw)), -0.46).addScaledVector(UP, 0.3);
      const to = _c.subVectors(_a, this.hurlP);
      const d = to.length();
      const step = o.speed * 1.2 * dt;
      if (d <= step + 0.3) {
        this.mode = 'float';
        this.hurl = null;
        this.hurlDone = true;
        return;
      }
      this.hurlDir.copy(to).divideScalar(d).negate();
      this.hurlP.addScaledVector(to.divideScalar(d), step);
    }
    // the wheel: its plane holds the flight line and the vertical, it turns about the axis across them
    const fly = this.hurlBack ? _b.copy(this.hurlDir).negate() : _b.copy(this.hurlDir);
    fly.y = 0;
    if (fly.lengthSq() < 1e-6) fly.set(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    fly.normalize();
    const c = Math.cos(this.hurlSpin), s = Math.sin(this.hurlSpin);
    _x.copy(fly).multiplyScalar(c).addScaledVector(UP, s);
    _y.copy(fly).multiplyScalar(-s).addScaledVector(UP, c);
    _z.crossVectors(_x, _y).normalize();
    _m.makeBasis(_x, _y, _z);
    this.quat.setFromRotationMatrix(_m);
    this.pos.copy(this.hurlP).addScaledVector(_y, -CENTER_MID_Y);
    // the cut along its path: a thin slab as tall as the wheel
    const seg = _a.subVectors(this.hurlP, this.hurlPrev);
    const len = seg.length();
    if (len > 0.02) {
      const across = _c.crossVectors(fly, UP).normalize();
      _m.makeBasis(fly, UP, across);
      _q.setFromRotationMatrix(_m);
      const mid = _d.addVectors(this.hurlP, this.hurlPrev).multiplyScalar(0.5);
      g.engine.destruction.carve(new BoxShape(mid.clone(), new THREE.Vector3(len * 0.5 + 0.5, 0.95, 0.12), _q.clone()), { mode: 'cut', power: o.cut * (this.hurlBack ? 0.6 : 1), dir: fly.clone(), sparks: [1, 0.55, 0.5], dust: 0.4 });
    }
    // the edge glints as it turns
    const tip = this.local(Math.cos(this.t * 30) * CENTER_HALF_W, CENTER_EDGE_Y, 0, _a);
    g.engine.glow.spawn({ x: tip.x, y: tip.y, z: tip.z, size: 0.22, sizeEnd: 0.04, life: 0.22, r: 1, g: 0.35, b: 0.3, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    // the men in its way
    for (const e of g.enemiesOf(f)) {
      if (e.dead || this.hurlHits.has(e.id)) continue;
      if (segToFighter(this.hurlPrev, this.hurlP, e) > 0.85 + e.def.radius) continue;
      this.hurlHits.add(e.id);
      const dir = fly.clone();
      g.damage(e, o.damage * (this.hurlBack ? 0.5 : 1), f, dir, { knock: this.hurlBack ? -o.knock * 0.4 : o.knock, launch: this.hurlBack ? 0 : 4, heavy: !this.hurlBack, hitstop: 0.08, shake: 0.4 });
      g.sparks(e.center(), dir, IKKAKU_RED.body, 14);
    }
  }

  /** over his shoulder and down on the point in front of him, then home */
  private stepSwoop(dt: number): void {
    const f = this.f;
    this.swoopT += dt;
    const T = 0.62;
    const u = this.swoopT / T;
    if (u >= 1) {
      this.mode = 'float';
      return;
    }
    // out (0 → 0.45), a beat in the ground, home (0.6 → 1)
    const k = u < 0.45 ? easeInOut(u / 0.45) : u < 0.6 ? 1 : 1 - easeInOut((u - 0.6) / 0.4);
    const fw = _a.set(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    const apex = _b.copy(f.pos).addScaledVector(fw, 0.6).setY(f.pos.y + 3.1);
    // a quadratic arc from behind his back over his head to the ground in front
    const from = this.swoopFrom, to = this.swoopTo;
    const p0 = _c.lerpVectors(from, apex, k), p1 = _d.lerpVectors(apex, to, k);
    // the edge leads (the arc's tangent): down and forward on the way in, back on the way home
    const lead = _y.subVectors(p1, p0);
    if (lead.lengthSq() < 1e-8) lead.copy(fw);
    lead.normalize();
    if (u >= 0.6) lead.negate();
    const p = p0.lerp(p1, k);
    _x.copy(this.swoopSide);
    _y.negate();
    _y.addScaledVector(_x, -_y.dot(_x)).normalize();
    _z.crossVectors(_x, _y).normalize();
    _m.makeBasis(_x, _y, _z);
    this.quat.setFromRotationMatrix(_m);
    this.pos.copy(p).addScaledVector(_y, -CENTER_MID_Y);
    if (this.swoopSpec && u < 0.6) {
      this.local(-CENTER_HALF_W, CENTER_EDGE_Y * 0.8, 0, this.sc.cb);
      this.local(CENTER_HALF_W, CENTER_EDGE_Y * 0.8, 0, this.sc.ct);
      this.sweepSample(this.sc, this.swoopSpec, this.swoopHits);
    }
    if (u >= 0.45 && u - dt / T < 0.45) {
      // it bites into the ground
      const at = this.local(0, CENTER_EDGE_Y, 0, _a);
      this.g.engine.destruction.carve(new SphereShape(at.clone(), 0.9, 0.6), { mode: 'smash', power: 260, impulse: 8, dust: 0.6 });
      this.g.sfx.play('impact', at, 0.9);
      this.g.addRing(at.clone(), 2.4, IKKAKU_RED.body, 0.3);
    }
    this.placed = true;
  }

  dispose(): void {
    this.center.removeFromParent();
    this.freeG.removeFromParent();
    this.freeS.removeFromParent();
    this.chainG.dispose();
    this.chainS.dispose();
    const pg = this.f.visual.props.get('sword'), ps = this.f.visual.props.get('spade');
    if (pg) pg.visible = true;
    if (ps) ps.visible = true;
  }
}

function easeInOut(k: number): number {
  return k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
}

// ------------------------------------------------------------------ the release

/** The Bankai's arrival: a wide tornado of red reiatsu round him, crackling, the dust of the street drawn up. */
export class ReiatsuTornado implements Projectile {
  done = false;
  private t = 0;
  constructor(private g: Game, private f: Fighter, private dur = 1.7) {
    g.addRing(f.pos.clone().setY(f.pos.y + 0.1), 9, IKKAKU_RED.body, 0.6);
    g.sfx.play('bankai', f.center(), 1.2);
    // the street round his feet torn up once (a shallow scar, not a pit he sinks into)
    g.engine.destruction.carve(new SphereShape(f.pos.clone(), 2.6, 0.18), { mode: 'smash', power: 60, impulse: 7, dust: 0.6 });
  }
  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t >= this.dur) {
      this.done = true;
      return;
    }
    const k = Math.min(1, this.t / 0.15) * Math.min(1, (this.dur - this.t) / 0.5);
    const p = this.f.pos;
    const glow = g.engine.glow;
    // the funnel: streaks wound round him, widening as they climb
    for (let i = 0; i < 46 * k; i++) {
      const h = Math.random() * 9;
      const r = 0.9 + h * 0.45 + Math.random() * 0.35;
      const a = Math.random() * Math.PI * 2;
      const tx = -Math.sin(a), tz = Math.cos(a);
      const hot = Math.random() < 0.25;
      glow.spawn({
        x: p.x + Math.cos(a) * r, y: p.y + h, z: p.z + Math.sin(a) * r,
        vx: tx * (9 + h) - Math.cos(a) * 1.5, vy: 4 + Math.random() * 3, vz: tz * (9 + h) - Math.sin(a) * 1.5,
        size: hot ? 0.42 : 0.32, sizeEnd: 0.06, life: 0.45 + Math.random() * 0.35,
        r: 1, g: hot ? 0.7 : 0.18, b: hot ? 0.62 : 0.2, alpha: 0.95, alphaEnd: 0, tex: TEX_STREAK, stretch: 3.6, drag: 0.6,
      });
    }
    // a red haze filling the funnel
    for (let i = 0; i < 4 * k; i++) {
      const h = Math.random() * 7, a = Math.random() * Math.PI * 2, r = (0.6 + h * 0.35) * Math.random();
      glow.spawn({ x: p.x + Math.cos(a) * r, y: p.y + h, z: p.z + Math.sin(a) * r, vx: -Math.sin(a) * 4, vy: 2.5, vz: Math.cos(a) * 4, size: 1.1, sizeEnd: 2, life: 0.5, r: 0.9, g: 0.12, b: 0.14, alpha: 0.22, alphaEnd: 0, tex: TEX_GLOW, drag: 1 });
    }
    // crackles: short bright arcs jumping in the wall of the funnel
    if (Math.random() < 0.5 * k) {
      const h = Math.random() * 6, a = Math.random() * Math.PI * 2, r = 1.2 + h * 0.4;
      for (let j = 0; j < 5; j++)
        glow.spawn({ x: p.x + Math.cos(a) * r, y: p.y + h + j * 0.12, z: p.z + Math.sin(a) * r, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9, vz: (Math.random() - 0.5) * 9, size: 0.1, sizeEnd: 0.02, life: 0.12, r: 1, g: 0.85, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
    }
    // dust whirled up at the foot
    if (Math.random() < 0.7 * k) {
      const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 2.5;
      g.engine.dust.spawn({ x: p.x + Math.cos(a) * r, y: p.y + 0.2, z: p.z + Math.sin(a) * r, vx: -Math.sin(a) * 6 - Math.cos(a) * 2, vy: 2 + Math.random() * 2, vz: Math.cos(a) * 6 - Math.sin(a) * 2, size: 0.6, sizeEnd: 1.8, life: 0.9, r: 0.6, g: 0.5, b: 0.47, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1.2 });
    }
  }
  dispose(): void {}
}

/** The pieces of the Shikai slammed together overhead: a red flash at the point. */
export function slamFlash(g: Game, at: THREE.Vector3): void {
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, q = Math.sqrt(1 - e * e), s = 4 + Math.random() * 8;
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * q * s, vy: e * s, vz: Math.sin(a) * q * s, size: 0.14, sizeEnd: 0.02, life: 0.35, r: 1, g: 0.3, b: 0.28, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, drag: 1.5 });
  }
  g.addRing(at.clone(), 3, IKKAKU_RED.core, 0.25);
}

// ------------------------------------------------------------------ the reiatsu explosion

/** The centre blade slammed into the ground: a red blast, a crater, and the smoke he leaves in. */
export function reiatsuBlast(g: Game, p: THREE.Vector3, r: number): void {
  g.engine.destruction.carve(new SphereShape(p.clone(), r * 0.62, 0.42), { mode: 'smash', power: 700, impulse: 18, dust: 1 });
  g.addRing(p.clone().setY(p.y + 0.15), r * 2.6, IKKAKU_RED.body, 0.7);
  g.addRing(p.clone().setY(p.y + 1.2), r * 1.6, IKKAKU_RED.core, 0.4);
  g.sfx.play('explode', p, 2);
  const glow = g.engine.glow;
  // a dome of red light thrown up and out
  for (let i = 0; i < 160; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random(), q = Math.sqrt(1 - e * e), s = 8 + Math.random() * 16;
    const hot = Math.random() < 0.3;
    glow.spawn({ x: p.x, y: p.y + 0.3, z: p.z, vx: Math.cos(a) * q * s, vy: e * s * 0.8 + 2, vz: Math.sin(a) * q * s, size: hot ? 0.3 : 0.22, sizeEnd: 0.04, life: 0.45 + Math.random() * 0.4, r: 1, g: hot ? 0.72 : 0.2, b: hot ? 0.62 : 0.22, alpha: 1, alphaEnd: 0, tex: hot ? TEX_GLOW : TEX_STREAK, stretch: 2.5, drag: 2.2, gravity: -3 });
  }
  g.addProjectile(new SmokeScreen(g, p.clone(), r));
}

/** The smoke of the blast, hanging — a screen to walk off in. */
class SmokeScreen implements Projectile {
  done = false;
  private t = 0;
  constructor(private g: Game, private p: THREE.Vector3, private r: number) {}
  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t > 2.6) {
      this.done = true;
      return;
    }
    const k = this.t < 0.3 ? 3 : this.t < 1.6 ? 1 : 0.4;
    for (let i = 0; i < 6 * k; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * this.r;
      g.engine.dust.spawn({
        x: this.p.x + Math.cos(a) * d, y: this.p.y + 0.3 + Math.random() * 2.4, z: this.p.z + Math.sin(a) * d,
        vx: Math.cos(a) * 1.4, vy: 0.4 + Math.random() * 0.8, vz: Math.sin(a) * 1.4,
        size: 1.2 + Math.random(), sizeEnd: 3.4, life: 1.8 + Math.random(), r: 0.55, g: 0.47, b: 0.46, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 1.4,
      });
    }
  }
  dispose(): void {}
}

// ------------------------------------------------------------------ small things

/** the styptic paste out of the hilt, smeared on the wound */
export function stypticFx(g: Game, at: THREE.Vector3): void {
  for (let i = 0; i < 18; i++)
    g.engine.glow.spawn({ x: at.x + (Math.random() - 0.5) * 0.3, y: at.y + (Math.random() - 0.5) * 0.3, z: at.z + (Math.random() - 0.5) * 0.3, vx: (Math.random() - 0.5) * 0.6, vy: 0.4 + Math.random() * 0.6, vz: (Math.random() - 0.5) * 0.6, size: 0.07, sizeEnd: 0.02, life: 0.7, r: 0.78, g: 0.66, b: 0.48, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
  g.addRing(at.clone(), 1.2, '#E9DCC0', 0.3);
}

/** the lucky dance: a little gold luck rising off him */
export function luckyFx(g: Game, f: Fighter, n = 8): void {
  const p = f.pos;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = 0.4 + Math.random() * 0.5;
    g.engine.glow.spawn({ x: p.x + Math.cos(a) * r, y: p.y + 0.2 + Math.random() * 1.8, z: p.z + Math.sin(a) * r, vx: 0, vy: 0.9 + Math.random() * 0.8, vz: 0, size: 0.09, sizeEnd: 0.02, life: 0.8, r: 1, g: 0.86, b: 0.42, alpha: 0.95, alphaEnd: 0, tex: TEX_GLOW });
  }
}
