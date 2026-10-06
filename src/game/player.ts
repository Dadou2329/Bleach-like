// Player controller: maps input to fighter intents (camera-relative movement, jump / reishi air-steps /
// hover, Shunpo, lock-on, aim) and kit actions.
import * as THREE from 'three';
import type { Controller, Game } from './game';
import type { Fighter } from './fighter';
import type { IchigoKit } from './kits/ichigo';
import { TEX_RING } from '../vfx/sprites';

const _f = new THREE.Vector3();
const _r = new THREE.Vector3();

export class PlayerController implements Controller {
  lock: Fighter | null = null;
  /** soft target picked when attacking without lock-on (held while the attack runs) */
  assist: Fighter | null = null;
  private jumpHeldT = 0;

  constructor(readonly g: Game, readonly f: Fighter, readonly kit: IchigoKit) {
    g.player = f;
    f.aura.target = 0.25;
  }

  update(dt: number): void {
    const { g, f, kit } = this;
    const inp = g.input;
    kit.update(dt);
    // ---- movement wish (camera relative)
    g.cam.flatForward(_f);
    _r.set(-_f.z, 0, _f.x);
    let mx = 0, mz = 0;
    if (inp.held('forward')) mz += 1;
    if (inp.held('back')) mz -= 1;
    if (inp.held('right')) mx += 1;
    if (inp.held('left')) mx -= 1;
    f.wish.set(0, 0, 0).addScaledVector(_f, mz).addScaledVector(_r, mx);
    if (f.wish.lengthSq() > 1) f.wish.normalize();
    f.aimDir.copy(_f);
    f.wishSprint = inp.held('dash');
    f.wishDescend = inp.held('descend');
    f.wishHover = inp.held('jump');
    // ---- lock-on
    if (inp.pressed('lock', 200)) {
      if (this.lock) this.lock = null;
      else this.lock = g.nearestEnemy(f, 45, _f, 70) ?? g.nearestEnemy(f, 30);
    }
    if (this.lock && (this.lock.dead || this.lock.pos.distanceTo(f.pos) > 60)) this.lock = null;
    if (this.assist && (this.assist.dead || !f.action)) this.assist = null;
    f.faceTarget = this.lock ? this.lock.center() : this.assist ? this.assist.center() : null;
    g.cam.lockTarget = this.lock ? this.lock.center() : null;
    if (g.hud) g.hud.lockTarget = this.lock;
    if (f.dead) return;
    // ---- jump / air-step / hover
    if (inp.pressed('jump', 140)) {
      if (f.grounded || f.body.airTime < 0.1) {
        f.body.vel.y = f.def.speed.jump;
        f.body.grounded = false;
        f.hovering = false;
        this.jumpHeldT = 0;
      } else if (!f.busy || f.action === null) {
        // reishi foothold: step up off the air
        f.body.vel.y = Math.max(f.body.vel.y, f.def.speed.jump * 0.85);
        f.hovering = false;
        f.anim.play('airstep', { fadeIn: 0.03 });
        this.reishiStep(f);
      }
    }
    if (inp.held('jump')) this.jumpHeldT += dt;
    else this.jumpHeldT = 0;
    if (!f.grounded && !f.hovering && inp.held('jump') && this.jumpHeldT > 0.28 && f.body.vel.y < 1.5 && f.dashT <= 0) {
      f.hovering = true;
      this.reishiStep(f);
    }
    // ---- auto-aim for attacks without lock
    const aimAt = () => {
      if (this.lock) return;
      const t = g.nearestEnemy(f, 7.5, _f, 65);
      this.assist = t;
      if (t) f.faceTarget = t.center();
    };
    // ---- actions
    if (inp.pressed('dash', 140)) {
      const d = f.wish.lengthSq() > 0.01 ? f.wish.clone() : _f.clone();
      f.dash(d);
    }
    if (inp.pressed('attack')) { aimAt(); kit.attack(); }
    if (inp.pressed('heavy')) { aimAt(); kit.heavy(); }
    if (inp.pressed('skill1')) { this.assist = null; kit.getsuga(); }
    if (inp.pressed('release', 200)) kit.release();
    if (inp.pressed('flare', 200)) kit.toggleFlare();
    if (inp.pressed('help', 200)) g.hud?.toggleHelp();
  }

  render(_dt: number): void {
    const inp = this.g.input;
    if (inp.mouseDX || inp.mouseDY) this.g.cam.look(inp.mouseDX * inp.sensitivity, inp.mouseDY * inp.sensitivity);
    if (inp.wheel) this.g.cam.zoom(inp.wheel);
  }

  /** Reishi foothold ring under the feet. */
  private reishiStep(f: Fighter): void {
    const p = f.pos;
    const c = new THREE.Color(f.def.aura.body);
    this.g.engine.glow.spawn({ x: p.x, y: p.y + 0.02, z: p.z, size: 0.5, sizeEnd: 1.8, life: 0.35, r: c.r, g: c.g, b: c.b, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
    this.g.addRing(p.clone(), 1.4, f.def.aura.body, 0.3);
  }
}
