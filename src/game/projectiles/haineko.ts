// Haineko in play (docs/kits/rangiku.md): the ash cloud as a game object. The blade is out as ash with a
// `density` (0..1) — energy blasts thin it, it grows back out of the hilt — and the cloud hangs round Rangiku
// until a move draws ash out of it: a ribbon cracking out of the hilt, the spear, a geyser under the target, the
// tide that sandblasts through walls, the veil that pours over a target and settles on them and the ground round
// them, Neko Rinbu's tornado, the shield's dome, the layered wall of "Hausu!". The ash a move used flows home
// when it is done. Ash that settles on a fighter is their coat (0..1); the flick-cut makes every settled grain cut
// at once — coats and the patches on the ground alike.
import * as THREE from 'three';
import type { Game, Projectile } from '../game';
import type { Fighter } from '../fighter';
import { BoxShape, SphereShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { groundAt } from '../../vfx/iceArts';
import { ASH, AshGrains, type AshFormation, type AshGroup, ashPuff, cutFlash } from '../../vfx/haineko';
import { TEX_PUFF } from '../../vfx/sprites';

/** grains in the whole blade */
export const ASH_MAX = 2200;
/** coat grains at a full coat */
const COAT_GRAINS = 260;
/** grains per settled patch */
const PATCH_GRAINS = 26;
const CUT_SPARKS: [number, number, number] = [0.93, 0.93, 0.92];

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0);

export interface AshStrike {
  damage: number;
  knock?: number;
  launch?: number;
  heavy?: boolean;
  /** world carve power where it bites */
  cut?: number;
  /** ash it leaves on whoever it hits */
  coat?: number;
}

interface Tag {
  p: THREE.Vector3;
  n: THREE.Vector3;
}

interface Coat {
  f: Fighter;
  /** how much ash clings (0..1) */
  k: number;
  /** when ash last landed */
  since: number;
  gid: number;
}

/** something the ash is doing right now; it owns a group of grains while it runs */
interface AshMove {
  done: boolean;
  update(dt: number): void;
  end(): void;
}

const _s1 = new THREE.Vector3();
const _s2 = new THREE.Vector3();

/** the distance from p to the segment a-b */
function segDist(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  _s1.subVectors(b, a);
  const l2 = _s1.lengthSq();
  const t = l2 > 0 ? Math.max(0, Math.min(1, _s2.subVectors(p, a).dot(_s1) / l2)) : 0;
  return _s2.copy(a).addScaledVector(_s1, t).distanceTo(p);
}

/** a fighter's body point nearest to height y (the capsule's axis, clamped) */
function bodyAt(o: Fighter, y: number, out: THREE.Vector3): THREE.Vector3 {
  return out.set(o.pos.x, Math.max(o.pos.y + 0.2, Math.min(o.pos.y + o.def.height - 0.2, y)), o.pos.z);
}

export class HainekoAsh implements Projectile {
  done = false;
  readonly grains: AshGrains;
  /** how much of the blade is out as ash (0..1) */
  density = 1;
  /** regrowth per second */
  regen = 0.08;
  /** the cloud is coming home to the blade ("Hausu!") */
  recalling = false;
  private recallT = 0;
  readonly coats = new Map<number, Coat>();
  /** ash settled on the ground and walls (the veil leaves it round its target) */
  readonly tags: Tag[] = [];
  private tagGid = -1;
  private moves: AshMove[] = [];
  private puffT = 0;
  private glintT = 0;
  private time = 0;
  private readonly home: Extract<AshFormation, { kind: 'cloud' }>;
  /** the shield is up */
  shield: Shield | null = null;
  /** called when the recall has finished (the kit puts the blade back together) */
  onHome: (() => void) | null = null;

  /**
   * `hilt(base, tip)` gives the line where the blade was (its base at the guard). With `fromBlade` the whole
   * cloud pours out along that line (the release); otherwise it starts thin and grows.
   */
  constructor(readonly g: Game, readonly owner: Fighter, readonly hilt: (base: THREE.Vector3, tip: THREE.Vector3) => void, fromBlade = true) {
    this.home = { kind: 'cloud', center: owner.pos.clone().setY(owner.pos.y + 1.05), radius: 1.9, height: 2.5, spin: 0.55 };
    this.grains = new AshGrains(ASH_MAX, this.home);
    g.engine.gr.scene.add(this.grains.mesh);
    if (fromBlade) {
      const base = new THREE.Vector3(), tip = new THREE.Vector3();
      hilt(base, tip);
      const fw = owner.forward();
      // the blade crumbles tip to hilt and the ash is flung out round her
      this.grains.grow(ASH_MAX * 0.6, 0, (_i, out) => out.lerpVectors(base, tip, Math.random()), (_i, out) => out.set((Math.random() - 0.5) * 6 + fw.x * 3, Math.random() * 3, (Math.random() - 0.5) * 6 + fw.z * 3));
    } else this.density = 0.25;
  }

  /** how hard the ash bites now */
  get bite(): number {
    return 0.55 + 0.45 * this.density;
  }

  // ---------------------------------------------------------------- grains

  /**
   * A group drawn out of the cloud (the nearest grains to `near` first). With `from` the grains pour out of that
   * point (the hilt, the ground) at `speed` along `dir` instead of flying in from all round the cloud.
   */
  take(share: number, f: AshFormation, o: Partial<Omit<AshGroup, 'f'>>, near?: THREE.Vector3, from?: { at: THREE.Vector3; r: number; dir?: THREE.Vector3; speed?: number }): number {
    const gid = this.grains.open(f, o);
    if (gid < 0) return -1;
    const n = Math.round(this.grains.members[0] * share);
    if (from) {
      const sp = from.speed ?? 0;
      this.grains.move(0, gid, n, near, (out) => out.set(from.at.x + (Math.random() - 0.5) * 2 * from.r, from.at.y + (Math.random() - 0.5) * 2 * from.r * (from.dir ? 1 : 0.15), from.at.z + (Math.random() - 0.5) * 2 * from.r),
        (out) => (from.dir ? out.copy(from.dir).multiplyScalar(sp * (0.4 + Math.random() * 0.8)) : out.set(0, sp * (0.4 + Math.random()), 0)));
    } else this.grains.move(0, gid, n, near);
    return gid;
  }

  /** every move ends now, its ash going home (Hausu takes the whole cloud) */
  endMoves(except?: AshMove): void {
    for (const m of this.moves) if (m !== except) {
      m.done = true;
      m.end();
    }
    this.moves = except ? this.moves.filter((m) => m === except) : [];
    if (this.shield && this.shield !== except) this.shield = null;
  }

  /** the ash an energy blast blows away */
  thin(k: number): void {
    if (k <= 0 || this.recalling) return;
    const before = this.density;
    this.density = Math.max(0, this.density - k);
    const n = Math.round((before - this.density) * ASH_MAX);
    let puffs = 0;
    this.grains.kill(n, 0, (p) => {
      if (puffs++ < 10) ashPuff(this.g, p, 1, 0.9, 3);
    });
  }

  /** the line of the blade (base at the guard) */
  bladeLine(base: THREE.Vector3, tip: THREE.Vector3): void {
    this.hilt(base, tip);
  }

  // ---------------------------------------------------------------- coats and tags

  /** ash settles on a fighter (k: how much, 0..1) — taken from `from` (a move's group) or the cloud */
  feed(o: Fighter, k: number, from = 0): void {
    if (o.dead || k <= 0) return;
    let c = this.coats.get(o.id);
    if (!c) {
      const gid = this.grains.open({ kind: 'coat', base: o.pos.clone(), radius: o.def.radius, height: o.def.height }, { k: 34, c: 7, turb: 0.2, size: 0.8 });
      if (gid < 0) return;
      c = { f: o, k: 0, since: this.time, gid };
      this.coats.set(o.id, c);
    }
    c.k = Math.min(1, c.k + k);
    c.since = this.time;
    const want = Math.round(c.k * COAT_GRAINS) - this.grains.members[c.gid];
    if (want > 0) this.grains.move(from, c.gid, want, o.center(_p));
  }

  coatOf(o: Fighter): number {
    return this.coats.get(o.id)?.k ?? 0;
  }

  /** ash settles on the surfaces round a point (raycasts out from it); returns how many patches */
  settleAround(at: THREE.Vector3, from: number, maxTags = 6): number {
    const w = this.g.engine.world;
    const dirs: THREE.Vector3[] = [new THREE.Vector3(0, -1, 0)];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
      dirs.push(new THREE.Vector3(Math.cos(a), -0.35, Math.sin(a)).normalize());
    }
    let n = 0;
    for (const d of dirs) {
      if (this.tags.length >= 12 || n >= maxTags) break;
      const hit = raycastVoxels(w, at.x, at.y, at.z, d.x, d.y, d.z, 4.5);
      if (!hit) continue;
      const p = new THREE.Vector3(at.x + d.x * hit.dist, at.y + d.y * hit.dist, at.z + d.z * hit.dist);
      if (this.tags.some((t) => t.p.distanceTo(p) < 0.9)) continue;
      this.tags.push({ p, n: new THREE.Vector3(hit.nx, hit.ny, hit.nz) });
      n++;
    }
    if (!n) return 0;
    if (this.tagGid < 0 || !this.grains.group(this.tagGid)) this.tagGid = this.grains.open({ kind: 'patches', points: [], normals: [], radius: 0.55 }, { k: 26, c: 6, turb: 0.15, size: 0.9 });
    const G = this.grains.group(this.tagGid);
    if (!G || G.f.kind !== 'patches') return n;
    G.f.points = this.tags.map((t) => t.p);
    G.f.normals = this.tags.map((t) => t.n);
    this.grains.move(from, this.tagGid, n * PATCH_GRAINS, at);
    if (from !== 0) this.grains.move(0, this.tagGid, Math.max(0, this.tags.length * PATCH_GRAINS - this.grains.members[this.tagGid]), at);
    return n;
  }

  /**
   * The flick: every settled grain cuts at once. Coats deal 14 + 80 × coat (unblockable — the ash is already on
   * them); the patches split the ground and walls with thin slits and cut whoever stands in them. Returns how
   * much was cut (coats + patches).
   */
  flickCut(power: number): number {
    const { g, owner } = this;
    let cut = 0;
    for (const c of [...this.coats.values()]) {
      const o = c.f;
      if (o.dead || c.k < 0.04) continue;
      cut++;
      const k = c.k;
      const dir = _v.subVectors(o.pos, owner.pos).setY(0).normalize().clone();
      g.damage(o, (14 + 80 * k) * this.bite * power, owner, dir, { knock: 4 + 8 * k, launch: k > 0.6 ? 4 : 0, heavy: k > 0.45, hitstop: 0.06 + 0.08 * k, shake: 0.2 + 0.4 * k, unblockable: true });
      const n = 2 + Math.round(k * 7);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const p = new THREE.Vector3(o.pos.x + Math.cos(a) * o.def.radius, o.pos.y + 0.2 + Math.random() * (o.def.height - 0.3), o.pos.z + Math.sin(a) * o.def.radius);
        cutFlash(g, p, new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), 0.5 + k * 0.7);
      }
      this.dropCoat(c, true);
    }
    // the patches: a slit through each, and whoever stands in one is cut
    for (const t of this.tags) {
      cut++;
      across(t.n, _v, _w);
      const a = Math.random() * Math.PI;
      const along = _p.copy(_v).multiplyScalar(Math.cos(a)).addScaledVector(_w, Math.sin(a)).normalize().clone();
      _m.makeBasis(along, t.n.clone().cross(along).normalize(), t.n);
      _q.setFromRotationMatrix(_m);
      g.engine.destruction.carve(new BoxShape(t.p.clone(), new THREE.Vector3(0.75, 0.05, 0.6), _q.clone()), { mode: 'cut', power: 420 * power, dir: along.clone(), sparks: CUT_SPARKS, dust: 0.4 });
      cutFlash(g, t.p.clone().addScaledVector(t.n, 0.1), along, 1.4);
      for (const o of g.enemiesOf(owner)) {
        if (o.dead) continue;
        if (bodyAt(o, t.p.y, _w).distanceTo(t.p) > 1.4 + o.def.radius) continue;
        g.damage(o, 16 * this.bite * power, owner, along.clone(), { knock: 3, unblockable: true, quiet: true });
      }
    }
    this.tags.length = 0;
    if (this.tagGid >= 0) {
      this.burstGroup(this.tagGid, 2.5);
      this.tagGid = -1;
    }
    if (cut) g.sfx.play('swingHeavy', owner.center(), 0.8);
    return cut;
  }

  private dropCoat(c: Coat, burst: boolean): void {
    this.coats.delete(c.f.id);
    if (burst) this.burstGroup(c.gid, 3);
    else this.grains.close(c.gid);
  }

  /** a group's grains blown off where they are, then home */
  private burstGroup(gid: number, speed: number): void {
    const G = this.grains.group(gid);
    if (!G) return;
    this.grains.kick(gid, this.grains.centroid(gid, _p), speed);
    this.grains.close(gid);
  }

  // ---------------------------------------------------------------- moves

  private run(m: AshMove): void {
    this.moves.push(m);
  }

  /** a ribbon of ash cracking out of the hilt and sweeping across in front of her (yaw in radians, + = her left) */
  ribbon(yaw0: number, yaw1: number, reach: number, s: AshStrike): void {
    this.run(new Ribbon(this, yaw0, yaw1, reach, s));
  }

  /** the ash packed into a spear driven straight at `at` */
  spear(at: THREE.Vector3, s: AshStrike): void {
    this.run(new Spear(this, at, s));
  }

  /** the ash gathers under `at` and erupts */
  geyser(at: THREE.Vector3, s: AshStrike): void {
    this.run(new Geyser(this, at, s));
  }

  /** the tide: a dense wave rolling forward that sandblasts through walls */
  tide(s: AshStrike, range = 18): void {
    this.run(new Tide(this, range, s));
  }

  /** the veil: the cloud pours over the target, and the ash settles on them and round them */
  veil(target: Fighter | null, at: THREE.Vector3): void {
    this.run(new Veil(this, target, at));
  }

  /** Neko Rinbu: the cloud whirls into a cutting tornado round the target */
  rinbu(target: Fighter | null, at: THREE.Vector3, onBreak?: () => void): Rinbu {
    const r = new Rinbu(this, target, at, onBreak);
    this.run(r);
    return r;
  }

  /** the shield: a dome of dense ash round her that swats shots away */
  raiseShield(dur: number): Shield {
    this.shield?.lower();
    this.shield = new Shield(this, dur);
    this.run(this.shield);
    return this.shield;
  }

  /** "Hausu!": a layered wall before her, then every grain goes home to the blade */
  house(): void {
    this.run(new House(this));
  }

  /** the flare: the cloud blasts outward from her */
  blast(): void {
    const { g, owner } = this;
    const c = owner.center();
    this.grains.kick(-1, c, 14);
    for (let i = 0; i < 12; i++) ashPuff(g, c.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 1.5 - 0.5, (Math.random() - 0.5) * 3)), 1, 1.2, 6);
    for (const o of g.enemiesOf(owner)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, owner.pos).setY(0);
      const d = _v.length();
      if (d > 4 + o.def.radius) continue;
      g.damage(o, 8 * this.bite, owner, _v.normalize().clone(), { knock: 14 * (1 - d / 5) + 4, launch: 2, quiet: true });
      this.feed(o, 0.12);
    }
  }

  /** Shunpo in Shikai: a wisp of ash left along the path */
  wisp(from: THREE.Vector3, to: THREE.Vector3): void {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const p = _p.lerpVectors(from, to, i / (n - 1)).clone();
      p.y += 0.8 + Math.random() * 0.6;
      ashPuff(this.g, p, 1, 0.7, 0.8);
    }
  }

  /** every grain goes home to the blade (Hausu, or she falls): fade out and finish */
  recall(fast = false): void {
    if (this.recalling) return;
    this.recalling = true;
    this.recallT = fast ? 0.3 : 0;
    for (const m of this.moves) m.end();
    this.moves.length = 0;
    this.shield = null;
    for (const c of [...this.coats.values()]) this.dropCoat(c, false);
    this.tags.length = 0;
    if (this.tagGid >= 0) this.grains.close(this.tagGid);
    this.tagGid = -1;
    for (let i = 1; i < this.grains.groups.length; i++) if (this.grains.groups[i]) this.grains.close(i);
    const base = new THREE.Vector3(), tip = new THREE.Vector3();
    this.hilt(base, tip);
    this.grains.groups[0] = { f: { kind: 'line', from: base, ctrl: base.clone().lerp(tip, 0.5), to: tip, radius: 0.06, reach: 1 }, k: 34, c: 6, turb: 0.15, size: 1 };
  }

  // ---------------------------------------------------------------- loop

  update(dt: number, g: Game): void {
    this.time += dt;
    const f = this.owner;
    const G0 = this.grains.groups[0]!;
    if (this.recalling) {
      this.recallT += dt;
      if (G0.f.kind === 'line') {
        this.hilt(G0.f.from, G0.f.to);
        G0.f.ctrl.lerpVectors(G0.f.from, G0.f.to, 0.5);
      }
      this.grains.alpha = Math.max(0, 1 - Math.max(0, this.recallT - 0.2) / 0.25);
      if (this.recallT >= 0.45) {
        this.done = true;
        this.onHome?.();
      }
      this.grains.update(dt);
      return;
    }
    if (f.dead) {
      this.recall(true);
      return;
    }
    // the cloud trails her
    const k = 1 - Math.exp(-5 * dt);
    this.home.center.x += (f.pos.x - this.home.center.x) * k;
    this.home.center.y += (f.pos.y + 1.05 - this.home.center.y) * k;
    this.home.center.z += (f.pos.z - this.home.center.z) * k;
    // density: it grows back out of the hilt
    this.density = Math.min(1, this.density + this.regen * dt);
    const want = Math.round(this.density * ASH_MAX);
    const have = this.grains.count;
    if (have < want - 4) {
      const base = new THREE.Vector3(), tip = new THREE.Vector3();
      this.hilt(base, tip);
      this.grains.grow(Math.min(want - have, Math.ceil(900 * dt)), 0, (_i, out) => out.lerpVectors(base, tip, Math.random()), (_i, out) => out.set((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3));
    } else if (have > want + 40) this.grains.kill(Math.min(have - want, Math.ceil(900 * dt)), 0);
    // the moves
    for (const m of this.moves) m.update(dt);
    for (let i = this.moves.length - 1; i >= 0; i--) {
      if (!this.moves[i].done) continue;
      this.moves[i].end();
      if (this.moves[i] === this.shield) this.shield = null;
      this.moves.splice(i, 1);
    }
    // coats follow their fighters, fall off slowly, settle the grains they should have
    for (const c of [...this.coats.values()]) {
      const G = this.grains.group(c.gid);
      if (!G || c.f.dead) {
        this.dropCoat(c, false);
        continue;
      }
      if (G.f.kind === 'coat') G.f.base.copy(c.f.pos);
      if (this.time - c.since > 3) c.k -= dt * 0.06;
      if (c.k <= 0.01) {
        this.dropCoat(c, false);
        continue;
      }
      const extra = this.grains.members[c.gid] - Math.round(c.k * COAT_GRAINS);
      if (extra > 4) this.grains.move(c.gid, 0, extra);
    }
    // the cloud's body: soft puffs among the grains, a few glints
    this.puffT += dt * (6 + 10 * this.density);
    while (this.puffT >= 1) {
      this.puffT -= 1;
      this.grains.puffs(g.engine.dust, 0, 1, 1.25, 0.2, 1.4);
    }
    this.glintT += dt * 6;
    while (this.glintT >= 1) {
      this.glintT -= 1;
      this.grains.glints(g.engine.glow, 0, 1);
    }
    this.grains.update(dt);
  }

  render(_dt: number, time: number): void {
    this.grains.render(time);
  }

  /** a shot that touches the shield or the layered wall is swatted away (returns how many) */
  swat(at: THREE.Vector3, r: number): number {
    const n = this.g.rejectNear(at, r, this.owner, false);
    if (n > 0) {
      this.density = Math.max(0, this.density - 0.05 * n);
      ashPuff(this.g, at, 4, 1.2, 4);
      this.g.sfx.play('impact', at, 0.6);
    }
    return n;
  }

  dispose(): void {
    this.grains.dispose();
  }
}

/** two unit vectors across the direction d */
function across(d: THREE.Vector3, n: THREE.Vector3, b: THREE.Vector3): void {
  n.crossVectors(d, UP);
  if (n.lengthSq() < 1e-6) n.set(1, 0, 0);
  n.normalize();
  b.crossVectors(d, n).normalize();
}

// ---------------------------------------------------------------------------------------------- the moves

/** a ribbon cracking out of the hilt, its far end sweeping across in front of her */
class Ribbon implements AshMove {
  done = false;
  private t = 0;
  private gid: number;
  private f: Extract<AshFormation, { kind: 'line' }>;
  private hits = new Set<number>();
  private origin: THREE.Vector3;
  private fw: THREE.Vector3;
  private cutT = 0;
  constructor(readonly ash: HainekoAsh, readonly yaw0: number, readonly yaw1: number, readonly reach: number, readonly s: AshStrike) {
    const o = ash.owner;
    const base = new THREE.Vector3(), tip = new THREE.Vector3();
    ash.bladeLine(base, tip);
    this.origin = o.pos.clone();
    this.fw = o.forward();
    this.f = { kind: 'line', from: base, ctrl: base.clone(), to: base.clone(), radius: 0.28, reach: 0 };
    const d0 = this.fw.clone().applyAxisAngle(UP, yaw0);
    this.gid = ash.take(0.36, this.f, { k: 70, c: 9, turb: 0.4 }, base, { at: base, r: 0.12, dir: d0, speed: 12 });
    this.place(0);
    ash.g.sfx.play('swing', base, 0.7);
  }
  private place(u: number): void {
    const o = this.ash.owner;
    const yaw = this.yaw0 + (this.yaw1 - this.yaw0) * u;
    const d = _v.copy(this.fw).applyAxisAngle(UP, yaw);
    this.ash.bladeLine(this.f.from, _w);
    this.f.to.copy(this.origin).addScaledVector(d, this.reach).setY(o.pos.y + 1.05 + Math.sin(u * Math.PI) * 0.25);
    // the middle lags behind the sweep, so the ribbon bows like a whip
    const back = _w.copy(this.fw).applyAxisAngle(UP, this.yaw0 + (this.yaw1 - this.yaw0) * Math.max(0, u - 0.35));
    this.f.ctrl.copy(this.origin).addScaledVector(back, this.reach * 0.5).setY(o.pos.y + 1.35);
  }
  update(dt: number): void {
    this.t += dt;
    const sweep = Math.min(1, this.t / 0.2);
    const e = 1 - (1 - sweep) ** 2;
    this.f.reach = Math.min(1, this.t / 0.07);
    this.place(e);
    const { ash } = this;
    const g = ash.g;
    if (this.t <= 0.32) ash.grains.puffsAlong(g.engine.dust, (u, out) => bez(this.f, u * this.f.reach, out), 2, 0.5, 0.14);
    if (this.t >= 0.04 && this.t <= 0.3) {
      // whoever the far half of the ribbon passes through
      for (const o of g.enemiesOf(ash.owner)) {
        if (o.dead || this.hits.has(o.id)) continue;
        for (const u of [0.35, 0.5, 0.65, 0.8, 0.9, 1]) {
          const p = bez(this.f, u * this.f.reach, _p);
          if (bodyAt(o, p.y, _w).distanceTo(p) > 0.75 + o.def.radius) continue;
          this.hits.add(o.id);
          const dir = _v.subVectors(o.pos, ash.owner.pos).setY(0).normalize().clone();
          g.damage(o, this.s.damage * ash.bite, ash.owner, dir, { knock: this.s.knock ?? 6, launch: this.s.launch, heavy: this.s.heavy, hitstop: 0.05, shake: 0.15 });
          g.sparks(bodyAt(o, p.y, new THREE.Vector3()), dir, ASH, 6);
          ash.feed(o, this.s.coat ?? 0.08, this.gid);
          break;
        }
      }
      // the end bites into walls it sweeps through
      this.cutT -= dt;
      if (this.s.cut && this.cutT <= 0) {
        const p = bez(this.f, this.f.reach, _p);
        if (g.engine.world.isSolidAtPos(p.x, p.y, p.z)) {
          this.cutT = 0.05;
          // a flat slit: the plane of the sweep
          const along = _v.subVectors(this.f.to, this.f.ctrl).setY(0).normalize();
          const side = _w.crossVectors(UP, along).normalize();
          _m.makeBasis(side, UP, along);
          _q.setFromRotationMatrix(_m);
          g.engine.destruction.carve(new BoxShape(p.clone(), new THREE.Vector3(0.5, 0.05, 0.5), _q.clone()), { mode: 'cut', power: this.s.cut, dir: side.clone(), sparks: CUT_SPARKS, dust: 0.6 });
        }
      }
    }
    if (this.t >= 0.4) this.done = true;
  }
  end(): void {
    this.ash.grains.close(this.gid);
  }
}

function streamAt(f: Extract<AshFormation, { kind: 'stream' }>, u: number, out: THREE.Vector3): THREE.Vector3 {
  const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
  return out.set(f.from.x * a + f.ctrl.x * b + f.to.x * c, f.from.y * a + f.ctrl.y * b + f.to.y * c, f.from.z * a + f.ctrl.z * b + f.to.z * c);
}

function bez(f: Extract<AshFormation, { kind: 'line' }>, u: number, out: THREE.Vector3): THREE.Vector3 {
  const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
  return out.set(f.from.x * a + f.ctrl.x * b + f.to.x * c, f.from.y * a + f.ctrl.y * b + f.to.y * c, f.from.z * a + f.ctrl.z * b + f.to.z * c);
}

/** the spear: the ash packed tight and driven straight out of the hilt */
class Spear implements AshMove {
  done = false;
  private t = 0;
  private gid: number;
  private f: Extract<AshFormation, { kind: 'line' }>;
  private hits = new Set<number>();
  private bored = false;
  private dir: THREE.Vector3;
  private len: number;
  constructor(readonly ash: HainekoAsh, at: THREE.Vector3, readonly s: AshStrike) {
    const base = new THREE.Vector3(), tip = new THREE.Vector3();
    ash.bladeLine(base, tip);
    this.dir = at.clone().sub(base);
    this.len = Math.min(9, Math.max(3, this.dir.length() + 0.8));
    this.dir.normalize();
    const to = base.clone().addScaledVector(this.dir, this.len);
    this.f = { kind: 'line', from: base, ctrl: base.clone().lerp(to, 0.5), to, radius: 0.16, reach: 0 };
    this.gid = ash.take(0.32, this.f, { k: 110, c: 12, turb: 0.2 }, base, { at: base, r: 0.08, dir: this.dir, speed: 22 });
    ash.g.sfx.play('swingHeavy', base, 0.6);
  }
  update(dt: number): void {
    const { ash } = this;
    const g = ash.g;
    this.t += dt;
    this.f.reach = Math.min(1, this.t / 0.1);
    if (this.t <= 0.3) ash.grains.puffsAlong(g.engine.dust, (u, out) => bez(this.f, u * this.f.reach, out), 2, 0.4, 0.13, 0.3);
    const end = _p.copy(this.f.from).addScaledVector(this.dir, this.len * this.f.reach);
    if (this.t <= 0.28) {
      for (const o of g.enemiesOf(ash.owner)) {
        if (o.dead || this.hits.has(o.id)) continue;
        const c = bodyAt(o, end.y, _w);
        if (segDist(c, this.f.from, end) > 0.45 + o.def.radius) continue;
        this.hits.add(o.id);
        g.damage(o, this.s.damage * ash.bite, ash.owner, this.dir.clone().setY(0).normalize(), { knock: this.s.knock ?? 12, launch: this.s.launch, heavy: this.s.heavy ?? true, hitstop: 0.08, shake: 0.3 });
        g.sparks(c.clone(), this.dir, ASH, 10);
        ash.feed(o, this.s.coat ?? 0.12, this.gid);
      }
      if (!this.bored && this.f.reach >= 1 && this.s.cut) {
        this.bored = true;
        const hit = raycastVoxels(g.engine.world, this.f.from.x, this.f.from.y, this.f.from.z, this.dir.x, this.dir.y, this.dir.z, this.len);
        if (hit) {
          const p = this.f.from.clone().addScaledVector(this.dir, hit.dist + 0.3);
          g.engine.destruction.carve(new SphereShape(p, 0.65), { mode: 'bore', power: this.s.cut, dir: this.dir.clone(), dust: 0.8, impulse: 5 });
          ashPuff(g, p, 4, 1, 3);
        }
      }
    }
    if (this.t >= 0.36) this.done = true;
  }
  end(): void {
    this.ash.grains.close(this.gid);
  }
}

/** the geyser: the ash gathers on the ground under the target, then erupts */
class Geyser implements AshMove {
  done = false;
  private t = 0;
  private gid: number;
  private base: THREE.Vector3;
  private hit = false;
  private col: Extract<AshFormation, { kind: 'column' }>;
  constructor(readonly ash: HainekoAsh, at: THREE.Vector3, readonly s: AshStrike) {
    const gy = groundAt(ash.g, at.x, at.y + 1, at.z, 6);
    this.base = new THREE.Vector3(at.x, gy ?? at.y, at.z);
    this.col = { kind: 'column', base: this.base, radius: 1.0, height: 0.15, spin: 3 };
    this.gid = ash.take(0.4, this.col, { k: 40, c: 6, turb: 0.5 }, undefined, { at: this.base.clone().setY(this.base.y + 0.1), r: 1.2, speed: 1 });
  }
  update(dt: number): void {
    const { ash } = this;
    const g = ash.g;
    this.t += dt;
    if (this.t < 0.16) {
      // gathering: a low swirling ring on the ground (the tell)
      this.col.height = 0.25;
      this.col.radius = 1.3;
      if (Math.random() < 0.5) ashPuff(g, this.base.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 0.1, (Math.random() - 0.5) * 2)), 1, 0.6, 0.5);
    } else {
      this.col.height = Math.min(4.6, 0.25 + (this.t - 0.16) * 32);
      this.col.radius = 0.9;
      if (this.t < 0.5) ash.grains.puffsAlong(g.engine.dust, (u, out) => out.copy(this.base).setY(this.base.y + u * this.col.height), 3, 0.8, 0.16, 0);
      if (!this.hit) {
        this.hit = true;
        g.sfx.play('impact', this.base, 0.9);
        g.engine.destruction.carve(new SphereShape(this.base.clone(), 1.0, 0.6), { mode: 'smash', power: this.s.cut ?? 160, impulse: 9, dust: 0.9, dir: UP.clone() });
        for (let i = 0; i < 6; i++) ashPuff(g, this.base.clone().setY(this.base.y + i * 0.6), 2, 0.9, 1.5);
        for (const o of g.enemiesOf(ash.owner)) {
          if (o.dead) continue;
          const d = Math.hypot(o.pos.x - this.base.x, o.pos.z - this.base.z);
          if (d > 1.4 + o.def.radius || o.pos.y - this.base.y > 3.5 || o.pos.y < this.base.y - 1) continue;
          g.damage(o, this.s.damage * ash.bite, ash.owner, new THREE.Vector3(0, 1, 0), { knock: 1, launch: this.s.launch ?? 13, heavy: true, hitstop: 0.09, shake: 0.35 });
          ash.feed(o, this.s.coat ?? 0.15, this.gid);
        }
      }
    }
    if (this.t >= 0.7) this.done = true;
  }
  end(): void {
    this.ash.grains.close(this.gid);
  }
}

/** the tide: a dense wave rolling out ahead of her, one heavy hit each, eroding walls slab by slab */
class Tide implements AshMove {
  done = false;
  private t = 0;
  private gid: number;
  private f: Extract<AshFormation, { kind: 'wave' }>;
  private hits = new Set<number>();
  private tick = 0;
  private readonly speed = 24;
  private readonly side: THREE.Vector3;
  constructor(readonly ash: HainekoAsh, readonly range: number, readonly s: AshStrike) {
    const o = ash.owner;
    const dir = o.forward();
    this.side = new THREE.Vector3(dir.z, 0, -dir.x);
    this.f = { kind: 'wave', origin: o.pos.clone().addScaledVector(dir, 0.6), dir, width: 7, height: 2.8, front: 0, depth: 4.5 };
    this.gid = ash.take(0.7, this.f, { k: 30, c: 5.5, turb: 1.2 });
    ash.g.sfx.play('getsuga', o.pos, 0.7);
  }
  update(dt: number): void {
    const { ash } = this;
    const g = ash.g;
    const w = this.f;
    this.t += dt;
    w.front = Math.min(this.range, this.t * this.speed);
    w.width = 4 + 3 * Math.min(1, this.t * 3);
    for (const o of g.enemiesOf(ash.owner)) {
      if (o.dead || this.hits.has(o.id)) continue;
      _v.subVectors(o.pos, w.origin);
      const along = _v.dot(w.dir), acr = _v.dot(this.side);
      if (along < w.front - w.depth || along > w.front + 0.8 || Math.abs(acr) > w.width / 2 + o.def.radius) continue;
      if (o.pos.y > w.origin.y + w.height + 0.5 || o.pos.y < w.origin.y - 1.5) continue;
      this.hits.add(o.id);
      g.damage(o, this.s.damage * ash.bite, ash.owner, w.dir.clone().setY(0.25).normalize(), { knock: this.s.knock ?? 16, launch: this.s.launch ?? 4, heavy: true, hitstop: 0.08, shake: 0.4 });
      g.sparks(o.center(), w.dir, ASH, 12);
      ash.feed(o, this.s.coat ?? 0.3, this.gid);
    }
    // the front sandblasts a slab off whatever stands in its way (not the ground under it)
    this.tick -= dt;
    if (this.tick <= 0 && w.front < this.range) {
      this.tick = 0.06;
      const c = w.origin.clone().addScaledVector(w.dir, Math.max(0.6, w.front - 0.4));
      c.y = w.origin.y + 0.3 + w.height * 0.5;
      _m.makeBasis(this.side, UP, w.dir);
      _q.setFromRotationMatrix(_m);
      g.engine.destruction.carve(new BoxShape(c, new THREE.Vector3(w.width / 2, w.height / 2, 0.55), _q.clone()), { mode: 'smash', power: this.s.cut ?? 220, impulse: 6, dust: 1, debris: 0.3, dir: w.dir.clone() });
      if (Math.random() < 0.6) ashPuff(g, c.clone().addScaledVector(this.side, (Math.random() - 0.5) * w.width), 2, 1.4, 2);
    }
    if (this.t >= this.range / this.speed + 0.35) this.done = true;
  }
  end(): void {
    this.ash.grains.close(this.gid);
  }
}

/** the veil: a stream pours from the hilt over the target; the ash settles on them and round them */
class Veil implements AshMove {
  done = false;
  private t = 0;
  private gid: number;
  private f: Extract<AshFormation, { kind: 'stream' }>;
  private settled = false;
  private at: THREE.Vector3;
  constructor(readonly ash: HainekoAsh, readonly target: Fighter | null, at: THREE.Vector3) {
    const base = new THREE.Vector3(), tip = new THREE.Vector3();
    ash.bladeLine(base, tip);
    this.at = at.clone();
    this.f = { kind: 'stream', from: base, ctrl: base.clone(), to: at.clone(), radius: 0.8, speed: 1.4 };
    this.gid = ash.take(0.5, this.f, { k: 36, c: 6, turb: 0.8 }, base, { at: base, r: 0.15, dir: at.clone().sub(base).normalize(), speed: 8 });
    this.aim();
    ash.g.sfx.play('swing', base, 0.6);
  }
  private aim(): void {
    const tg = this.target;
    if (tg && !tg.dead) tg.center(this.at);
    this.ash.bladeLine(this.f.from, _w);
    // it reaches 16 m
    this.f.to.copy(this.at);
    const d = this.f.to.distanceTo(this.f.from);
    if (d > 16) this.f.to.lerpVectors(this.f.from, this.at, 16 / d);
    // the pour arcs up over the target and comes down on them
    this.f.ctrl.lerpVectors(this.f.from, this.f.to, 0.5);
    this.f.ctrl.y += 1.6 + this.f.from.distanceTo(this.f.to) * 0.12;
  }
  update(dt: number): void {
    const { ash } = this;
    const g = ash.g;
    this.t += dt;
    this.aim();
    const tg = this.target;
    if (this.t > 0.16 && this.t < 0.75 && tg && !tg.dead && tg.center(_p).distanceTo(this.f.to) < 1.2) ash.feed(tg, dt * 1.45, this.gid);
    if (Math.random() < 0.4) this.ashOver();
    if (this.t < 0.75) ash.grains.puffsAlong(g.engine.dust, (u, out) => streamAt(this.f, u, out), 2, 0.6, 0.12, 0.15);
    if (this.t >= 0.75 && !this.settled) {
      this.settled = true;
      ash.settleAround(tg && !tg.dead ? tg.center(_p).clone() : this.at.clone().setY(this.at.y + 0.5), this.gid);
    }
    if (this.t >= 0.95) this.done = true;
  }
  /** puffs drifting down over the target */
  private ashOver(): void {
    const p = this.f.to.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.6, 0.8 + Math.random(), (Math.random() - 0.5) * 1.6));
    this.ash.g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vy: -0.6, size: 0.8, sizeEnd: 1.6, life: 0.9, r: 0.62, g: 0.6, b: 0.57, alpha: 0.26, alphaEnd: 0, tex: TEX_PUFF, drag: 1.2 });
  }
  end(): void {
    this.ash.grains.close(this.gid);
  }
}

/**
 * Neko Rinbu: the cloud whirls into a tornado round the target. Whoever it engulfs is drawn to the eye, held
 * (rooted) and cut every 0.15 s while the ground and the walls round it are scoured; an energy blast from inside
 * (spending a lot of reiatsu at once) blows it apart early. When it ends it bursts outward.
 */
export class Rinbu implements AshMove {
  done = false;
  t = 0;
  private gid: number;
  private f: Extract<AshFormation, { kind: 'tornado' }>;
  private tick = 0;
  private scour = 0;
  private held = new Map<number, { o: Fighter; rooted: boolean; rei: number }>();
  broken = false;
  readonly dur = 2.5;
  constructor(readonly ash: HainekoAsh, readonly target: Fighter | null, at: THREE.Vector3, readonly onBreak?: () => void) {
    const g = ash.g;
    const c = (target && !target.dead ? target.pos : at).clone();
    const gy = groundAt(g, c.x, c.y + 1, c.z, 6);
    if (gy !== null) c.y = gy;
    this.f = { kind: 'tornado', center: c, radius: 2.4, height: 5.5, spin: 3.4 };
    this.gid = ash.take(0.8, this.f, { k: 26, c: 4.5, turb: 1.4 });
    // its feet scour the ground flat
    g.engine.destruction.carve(new BoxShape(c.clone().setY(c.y - 0.05), new THREE.Vector3(2.2, 0.14, 2.2)), { mode: 'smash', power: 120, impulse: 3, dust: 0.8, debris: 0.2 });
    g.sfx.play('getsuga', c, 0.8);
  }
  update(dt: number): void {
    const { ash } = this;
    const g = ash.g;
    const c = this.f.center;
    this.t += dt;
    // the funnel tightens as it spins up
    this.f.radius = 2.4 - 0.3 * Math.min(1, this.t);
    // who is inside
    for (const o of g.enemiesOf(ash.owner)) {
      if (o.dead || this.held.has(o.id)) continue;
      const d = Math.hypot(o.pos.x - c.x, o.pos.z - c.z);
      if (d < this.f.radius + o.def.radius && o.pos.y < c.y + this.f.height && o.pos.y > c.y - 1.5) this.held.set(o.id, { o, rooted: o.rooted, rei: o.rei });
    }
    for (const h of this.held.values()) {
      const o = h.o;
      if (o.dead) continue;
      // a blast from inside breaks it
      if (o.rei < h.rei - 12) {
        this.broken = true;
        g.callout('', 'THE BLAST SCATTERS THE ASH', '#E6E2DC');
        ash.thin(0.3);
        this.onBreak?.();
        this.burst();
        return;
      }
      h.rei = o.rei;
      o.rooted = true;
      // drawn to the eye
      _v.set(c.x - o.pos.x, 0, c.z - o.pos.z);
      o.push.multiplyScalar(0.5).addScaledVector(_v, 6);
      if (o.body.vel.y > 0 && o.pos.y > c.y + 1.5) o.body.vel.y *= 0.5;
    }
    this.tick -= dt;
    if (this.tick <= 0) {
      this.tick = 0.15;
      for (const h of this.held.values()) {
        const o = h.o;
        if (o.dead) continue;
        g.damage(o, 5 * ash.bite, ash.owner, _v.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().clone(), { knock: 0.4, quiet: true });
        o.hitstun = Math.max(o.hitstun, 0.12);
        ash.feed(o, 0.035, this.gid);
        if (Math.random() < 0.5) cutFlash(g, bodyAt(o, o.pos.y + Math.random() * o.def.height, new THREE.Vector3()).add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6)), new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), 0.5);
      }
      if (Math.random() < 0.4) g.sfx.play('swing', c, 0.4);
    }
    // the wall of the funnel scours whatever stands in it
    this.scour -= dt;
    if (this.scour <= 0) {
      this.scour = 0.35;
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const p = new THREE.Vector3(c.x + Math.cos(a) * this.f.radius * 1.05, c.y + 0.7 + Math.random() * 4, c.z + Math.sin(a) * this.f.radius * 1.05);
        if (g.engine.world.isSolidAtPos(p.x, p.y, p.z)) g.engine.destruction.carve(new SphereShape(p, 0.5), { mode: 'smash', power: 200, impulse: 6, dust: 0.8, dir: new THREE.Vector3(-Math.sin(a), 0.2, Math.cos(a)) });
      }
      ash.grains.puffs(g.engine.dust, this.gid, 4, 1.3, 0.22, 0.8);
    }
    if (this.t >= this.dur) this.burst();
  }
  /** it bursts outward: one last cut for everyone inside, thrown out */
  burst(): void {
    if (this.done) return;
    this.done = true;
    const { ash } = this;
    const g = ash.g;
    const c = this.f.center;
    for (const h of this.held.values()) {
      const o = h.o;
      o.rooted = h.rooted;
      if (o.dead || this.broken) continue;
      _v.set(o.pos.x - c.x, 0, o.pos.z - c.z);
      if (_v.lengthSq() < 0.01) _v.set(Math.random() - 0.5, 0, Math.random() - 0.5);
      g.damage(o, 26 * ash.bite, ash.owner, _v.normalize().clone(), { knock: 16, launch: 6, heavy: true, hitstop: 0.12, shake: 0.5 });
    }
    this.held.clear();
    ash.grains.kick(this.gid, c.clone().setY(c.y + 1.5), 12);
    for (let i = 0; i < 10; i++) ashPuff(g, c.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 4, (Math.random() - 0.5) * 4)), 1, 1.4, 6);
    g.sfx.play('explode', c, 0.6);
  }
  end(): void {
    for (const h of this.held.values()) h.o.rooted = h.rooted;
    this.held.clear();
    this.ash.grains.close(this.gid);
  }
}

/** the shield: a dome of dense ash round her that swats shots away while it lasts */
export class Shield implements AshMove {
  done = false;
  private t = 0;
  private gid: number;
  private f: Extract<AshFormation, { kind: 'dome' }>;
  private tick = 0;
  constructor(readonly ash: HainekoAsh, readonly dur: number) {
    const o = ash.owner;
    this.f = { kind: 'dome', center: o.pos.clone(), radius: 2.1 };
    this.gid = ash.take(0.85, this.f, { k: 44, c: 6.5, turb: 0.6, size: 1.15 });
    ash.g.sfx.play('swingHeavy', o.center(), 0.6);
  }
  lower(): void {
    this.done = true;
  }
  update(dt: number): void {
    const { ash } = this;
    const o = ash.owner;
    this.t += dt;
    this.f.center.copy(o.pos);
    this.tick -= dt;
    if (this.tick <= 0) {
      this.tick = 0.05;
      ash.swat(o.center(_p).clone(), this.f.radius + 0.5);
      ash.grains.puffs(ash.g.engine.dust, this.gid, 1, 1.1, 0.2, 0.7);
    }
    if (this.t >= this.dur || ash.density <= 0.05) this.done = true;
  }
  end(): void {
    this.ash.grains.close(this.gid);
  }
}

/** "Hausu!": the ash splits into thin layers before her (a wall that stops shots), then goes home to the blade */
class House implements AshMove {
  done = false;
  private t = 0;
  private gid: number;
  private f: Extract<AshFormation, { kind: 'layers' }>;
  constructor(readonly ash: HainekoAsh) {
    const o = ash.owner;
    const n = o.forward();
    this.f = { kind: 'layers', center: o.center().addScaledVector(n, 1.7), normal: n, width: 3.8, height: 3.2, layers: 5, gap: 0.34 };
    ash.endMoves();
    for (const c of ash.coats.values()) ash.grains.close(c.gid);
    ash.coats.clear();
    this.gid = ash.take(0.97, this.f, { k: 40, c: 7, turb: 0.3 });
    ash.g.callout('ハウス', 'HAUSU!', '#E6E2DC');
  }
  update(dt: number): void {
    const { ash } = this;
    const o = ash.owner;
    this.t += dt;
    const n = o.forward();
    this.f.normal.copy(n);
    this.f.center.copy(o.center()).addScaledVector(n, 1.7);
    ash.swat(this.f.center.clone(), 2.2);
    if (this.t >= 0.36) {
      this.done = true;
      ash.recall();
    }
  }
  end(): void {
    this.ash.grains.close(this.gid);
  }
}
