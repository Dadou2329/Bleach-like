// Duel AI: pilots any character kit against the nearest enemy. Picks a stance every few seconds
// (press in and brawl, circle at mid range, or zone with ranged specials), strafes, closes gaps with
// Shunpo/Sonído, side-steps when the target commits to an attack, strings light chains into heavies,
// uses the kit's move table by distance, releases and toggles states as its HP drops, and follows the
// target into the air on reishi footholds.
import * as THREE from 'three';
import type { Fighter } from '../fighter';
import type { Controller, Game } from '../game';
import type { AIMove, Kit, KitAI } from '../kits/kit';

const _d = new THREE.Vector3();
const _s = new THREE.Vector3();

type Stance = 'press' | 'circle' | 'zone';

export interface DuelistOpts {
  /** 0..1: how often it attacks and how quickly it reacts */
  aggression?: number;
  /** seconds before it engages (taunt / walk-in) */
  intro?: number;
}

export class DuelistAI implements Controller {
  private ai: KitAI;
  private stance: Stance = 'press';
  private stanceT = 0;
  private think = 0;
  private chainLeft = 0;
  private pressT = 0;
  private strafe = Math.random() < 0.5 ? 1 : -1;
  private strafeT = 0;
  private moveCd = new Map<string, number>();
  private dashCd = 0;
  private evadeCd = 0;
  private toggleCd = 0;
  private releases = 0;
  private airStepT = 0;
  private lastTargetAction: unknown = null;
  /** blinded: where it believes the enemy is, when it next changes its mind, its HP a tick ago */
  private guess: THREE.Vector3 | null = null;
  private guessT = 0;
  private lastHp = -1;
  private intro: number;
  readonly aggression: number;

  constructor(readonly g: Game, readonly f: Fighter, readonly kit: Kit, o: DuelistOpts = {}) {
    this.ai = kit.ai();
    this.aggression = o.aggression ?? 0.7;
    this.intro = o.intro ?? 1.2;
  }

  update(dt: number): void {
    const { g, f, kit, ai } = this;
    kit.update(dt);
    if (f.dead) {
      f.wish.set(0, 0, 0);
      f.wishSprint = false;
      return;
    }
    this.tick(dt);
    const t = g.nearestEnemy(f, 160);
    if (!t && f.blindT > 0) {
      this.groping(dt);
      return;
    }
    this.lastHp = f.hp;
    this.guess = null;
    if (!t) {
      f.wish.set(0, 0, 0);
      f.faceTarget = null;
      f.wishHover = false;
      return;
    }
    // an illusion: fight where the target appears to be
    const tp = t.lure ?? t.pos;
    f.faceTarget = t.lure ? new THREE.Vector3(tp.x, tp.y + t.def.height * 0.55, tp.z) : t.center();
    _d.set(tp.x - f.pos.x, 0, tp.z - f.pos.z);
    const dist = Math.max(0.01, _d.length());
    _d.divideScalar(dist);
    const dy = tp.y - f.pos.y;
    const hp = f.hp / f.maxHp;

    // ---- forms and states by HP
    if (!f.busy && this.intro <= 0 && f.sealT <= 0) {
      const stages = ai.releaseAt === undefined ? [] : Array.isArray(ai.releaseAt) ? ai.releaseAt : [ai.releaseAt];
      if (this.releases < stages.length && hp <= stages[this.releases]) {
        this.releases++;
        kit.release();
        return;
      }
      if (kit.toggle && ai.toggleAt !== undefined && hp <= ai.toggleAt && this.toggleCd <= 0 && !(ai.toggleOn?.() ?? false)) {
        this.toggleCd = 6;
        kit.toggle();
        return;
      }
    }

    // ---- vertical: follow the target into the air, come down when it lands
    f.wishDescend = false;
    if (dy > 1.4) {
      if (f.grounded && !f.busy) {
        f.body.vel.y = f.def.speed.jump;
        f.body.grounded = false;
        this.airStepT = 0.3;
      } else if (!f.grounded && this.airStepT <= 0 && f.body.vel.y < 2.5 && f.dashT <= 0) {
        f.body.vel.y = Math.max(f.body.vel.y, f.def.speed.jump * 0.85);
        f.hovering = false;
        this.airStepT = 0.32;
        if (f.anim.clip('airstep')) f.anim.play('airstep', { fadeIn: 0.03 });
      }
      f.wishHover = true;
    } else if (!f.grounded) {
      // stand on reishi only to meet an airborne target; otherwise come down
      const meet = !t.grounded && t.pos.y > f.pos.y - 1.2 && t.pos.y - f.pos.y < 1.2;
      f.wishHover = meet;
      if (meet && f.body.vel.y < 1.5) f.hovering = true;
      if (!meet) {
        f.hovering = false;
        f.wishDescend = dy < -1.4;
      }
    } else {
      f.wishHover = false;
      f.hovering = false;
    }

    // ---- intro: walk in without attacking
    if (this.intro > 0) {
      this.intro -= dt;
      f.wish.copy(_d).multiplyScalar(dist > 9 ? 0.5 : 0);
      if (this.intro <= 0 && ai.opener) {
        f.wish.set(0, 0, 0);
        ai.opener();
      }
      return;
    }

    // ---- stance changes
    if (this.stanceT <= 0) {
      this.stanceT = 2.5 + Math.random() * 3;
      const r = Math.random();
      const ranged = typeof ai.ranged === 'function' ? ai.ranged() : ai.ranged === true;
      const prev = this.stance;
      this.stance = ranged ? (r < 0.55 ? 'zone' : r < 0.85 ? 'circle' : 'press') : r < 0.62 ? 'press' : r < 0.85 ? 'circle' : 'zone';
      // after hanging back, always come in for a while
      if (prev !== 'press' && this.stance !== 'press' && !ranged && Math.random() < 0.6) this.stance = 'press';
    }

    // ---- evade: side-step when the target commits to an attack close by
    const ta = t.action;
    if (ta && ta !== this.lastTargetAction && dist < 5.5 && this.evadeCd <= 0 && !f.busy && Math.random() < 0.3 + this.aggression * 0.25) {
      this.evadeCd = 1.6 + Math.random();
      _s.set(-_d.z, 0, _d.x).multiplyScalar(this.strafe).addScaledVector(_d, -0.35).normalize();
      if (f.dash(_s)) {
        this.lastTargetAction = ta;
        return;
      }
    }
    this.lastTargetAction = ta;

    // ---- continue a light chain
    if (this.chainLeft > 0) {
      this.pressT -= dt;
      if (dist > ai.reach + 3) this.chainLeft = 0;
      else if (this.pressT <= 0) {
        this.chainLeft--;
        this.pressT = 0.13 + Math.random() * 0.12;
        kit.attack();
        if (this.chainLeft === 0 && Math.random() < 0.3) this.queueHeavy = 0.35;
      }
    }
    if (this.queueHeavy > 0) {
      this.queueHeavy -= dt;
      if (this.queueHeavy <= 0) kit.heavy();
    }

    // ---- movement
    const want = this.stance === 'press' ? ai.reach * 0.8 : this.stance === 'circle' ? 7 : 13;
    const side = _s.set(-_d.z, 0, _d.x).multiplyScalar(this.strafe);
    if (dist > want + 1) {
      f.wish.copy(_d).addScaledVector(side, dist < 12 ? 0.35 : 0.1).normalize();
      f.wishSprint = dist > 16;
      if (dist > 15 && this.dashCd <= 0 && !f.busy) {
        this.dashCd = 1.4 + Math.random() * 1.2;
        f.dash(_d);
      }
    } else if (dist < want - 2 && this.stance !== 'press') {
      f.wish.copy(_d).multiplyScalar(-0.8).addScaledVector(side, 0.6).normalize();
      f.wishSprint = false;
    } else {
      f.wish.copy(side).multiplyScalar(this.stance === 'press' ? 0.3 : 0.75);
      f.wishSprint = false;
    }
    if (this.strafeT <= 0) {
      this.strafeT = 1.2 + Math.random() * 2.2;
      this.strafe = -this.strafe;
    }

    // ---- decisions
    if (this.think > 0 || f.busy || this.chainLeft > 0) return;
    this.think = 0.18 + (1 - this.aggression) * 0.5 + Math.random() * 0.25;
    if (dist <= ai.reach + 0.6 && Math.abs(dy) < 2.2) {
      if (Math.random() < 0.55 + this.aggression * 0.35) {
        this.chainLeft = Math.max(1, Math.round(2 + Math.random() * (ai.chain - 2)));
        this.pressT = 0;
        return;
      }
    }
    const moves = ai.moves.filter((m) => dist >= m.min && dist <= m.max && (this.moveCd.get(m.name) ?? 0) <= 0 && (!m.when || m.when()));
    const chance = this.stance === 'zone' ? 0.75 : this.stance === 'circle' ? 0.5 : 0.25;
    if (moves.length && Math.random() < chance) {
      const m = pick(moves);
      const before = f.action;
      m.use();
      // the kit refused (cooldown, reiatsu): try again soon, and stop hanging back meanwhile
      if (f.action === before) {
        this.moveCd.set(m.name, 1.2);
        if (this.stance !== 'press') this.stanceT = Math.min(this.stanceT, 0.4);
      } else this.moveCd.set(m.name, m.cd * (0.8 + Math.random() * 0.5));
    } else if (!moves.length && this.stance !== 'press') {
      // nothing to throw from range: go in
      this.stanceT = Math.min(this.stanceT, 0.6);
    }
  }

  private queueHeavy = 0;


  /**
   * Blind (Enma Kōrogi): it gropes toward where it last felt someone, swinging at the air, and turns on
   * whoever just struck it (the touch is all that is left).
   */
  private groping(dt: number): void {
    const { g, f, kit } = this;
    let real: Fighter | null = null, rd = Infinity;
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < rd) { rd = d; real = o; }
    }
    const hurt = this.lastHp >= 0 && f.hp < this.lastHp - 0.5;
    this.lastHp = f.hp;
    this.guessT -= dt;
    if (real && (hurt || !this.guess)) {
      const n = hurt ? 1.2 : 7;
      this.guess = real.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * n, 0, (Math.random() - 0.5) * n));
    }
    if (this.guess && this.guessT <= 0) {
      this.guessT = 1 + Math.random() * 1.2;
      this.guess.add(new THREE.Vector3((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5));
    }
    f.wishSprint = false;
    f.wishHover = false;
    if (!this.guess) {
      f.wish.set(0, 0, 0);
      return;
    }
    _d.set(this.guess.x - f.pos.x, 0, this.guess.z - f.pos.z);
    const dist = _d.length();
    f.faceTarget = new THREE.Vector3(this.guess.x, f.pos.y + f.def.height * 0.55, this.guess.z);
    if (dist > 2.2) f.wish.copy(_d.normalize()).multiplyScalar(0.5);
    else {
      f.wish.set(0, 0, 0);
      if (!f.busy && Math.random() < dt * 2.5) kit.attack();
    }
  }

  private tick(dt: number): void {
    this.think -= dt;
    this.stanceT -= dt;
    this.strafeT -= dt;
    this.dashCd -= dt;
    this.evadeCd -= dt;
    this.toggleCd -= dt;
    this.airStepT -= dt;
    for (const [k, v] of this.moveCd) this.moveCd.set(k, v - dt);
  }
}

function pick(moves: AIMove[]): AIMove {
  let total = 0;
  for (const m of moves) total += m.weight;
  let r = Math.random() * total;
  for (const m of moves) {
    r -= m.weight;
    if (r <= 0) return m;
  }
  return moves[moves.length - 1];
}
