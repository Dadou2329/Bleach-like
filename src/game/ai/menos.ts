// Menos Grande (Gillian) boss: arrives through a Kūmon sky crack, wades through Karakura crushing
// whatever its legs pass through, stomps when you are underfoot and fires a Cero that drills through
// the town. Its mask is the weak point (×3 damage).
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { Controller, Game } from '../game';
import { buildMenos, MENOS_CLIPS, MENOS_STANCE } from '../../chars/menos';
import { CeroBeam } from '../projectiles/cero';
import { CapsuleShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF } from '../../vfx/sprites';

export function menosDef(seed = 3): FighterDef {
  return {
    id: 'menos',
    name: 'Menos Grande',
    build: () => ({ asset: buildMenos(seed), props: [] }),
    stance: MENOS_STANCE,
    clips: MENOS_CLIPS,
    aura: { core: '#FFD0D0', body: '#B3122E', rim: '#5A0A14' },
    hp: 4200,
    rei: 100,
    speed: { run: 3.4, sprint: 4, jump: 0, dash: 0, dashTime: 0.1 },
    radius: 6.5,
    height: 36,
    boss: true,
    weakAbove: 0.8,
  };
}

class CeroAction extends FighterAction {
  readonly name = 'cero';
  constructor(readonly ai: MenosAI) {
    super();
    this.mobility = 0;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('cero', {
      fadeIn: 0.4,
      onEvent: (n) => {
        if (n !== 'charge') return;
        const sock = f.visual.rig.sockets.get('mouth');
        if (!sock) return;
        const tgt = new THREE.Vector3();
        g.addProjectile(new CeroBeam(g, f, sock, () => {
          const p = g.player;
          if (p && !p.dead) tgt.lerp(p.center(), 0.08);
          return tgt;
        }, { charge: 1.9, fire: 1.5, radius: 2.2, damage: 260, power: 320, core: '#FFE8E8', body: '#E0262B', rim: '#5A0A14', range: 260, track: 0.35 }));
        if (g.player) tgt.copy(g.player.center());
        g.callout('虚閃', 'CERO', '#ff5a5a');
        g.sfx.play('charge', sock.getWorldPosition(new THREE.Vector3()));
        setTimeout(() => g.sfx.play('beam', sock.getWorldPosition(new THREE.Vector3())), 1900);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 3.5) this.done = true;
  }
}

class StompAction extends FighterAction {
  readonly name = 'stomp';
  override start(f: Fighter, g: Game): void {
    f.anim.play('stomp', {
      onEvent: (n) => {
        if (n !== 'hit') return;
        const foot = f.visual.rig.bone('foot.R');
        const p = new THREE.Vector3();
        foot.getWorldPosition(p);
        p.y = f.pos.y;
        g.groundImpact(p, 4.5, 260, '#B3122E');
        for (const o of g.enemiesOf(f)) {
          const d = Math.hypot(o.pos.x - p.x, o.pos.z - p.z);
          if (d < 9 && o.pos.y < p.y + 4) g.damage(o, 140 * (1 - d / 9), f, o.pos.clone().sub(p).setY(0).normalize(), { knock: 18, launch: 9, heavy: true, hitstop: 0.1, shake: 0.9 });
        }
        if (g.player && g.player.pos.distanceTo(p) < 90) g.shake(0.8);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 1.9) this.done = true;
  }
}

/** Kūmon: the sky cracks like glass and splits open (Gillian arrival). */
class SkyCrack {
  readonly group = new THREE.Group();
  private t = 0;
  private mats: THREE.MeshBasicMaterial[] = [];
  done = false;

  constructor(pos: THREE.Vector3, facing: THREE.Vector3, readonly height: number) {
    // jagged lens: two zigzag edges meeting at top and bottom
    const pts: THREE.Vector2[] = [];
    const n = 14;
    const h = height, wMax = height * 0.32;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const wv = Math.sin(t * Math.PI) * wMax * (0.7 + ((i * 7919) % 13) / 30);
      pts.push(new THREE.Vector2(wv + (i % 2 ? 1.5 : -1), (t - 0.5) * h));
    }
    for (let i = n; i >= 0; i--) {
      const t = i / n;
      const wv = Math.sin(t * Math.PI) * wMax * (0.7 + ((i * 104729) % 11) / 28);
      pts.push(new THREE.Vector2(-wv + (i % 2 ? -1.5 : 1), (t - 0.5) * h));
    }
    const shape = new THREE.Shape(pts);
    const inner = new THREE.MeshBasicMaterial({ color: '#050407', side: THREE.DoubleSide, transparent: true, depthWrite: false });
    const rim = new THREE.MeshBasicMaterial({ color: '#ff3048', side: THREE.DoubleSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const m1 = new THREE.Mesh(new THREE.ShapeGeometry(shape), inner);
    const m2 = new THREE.Mesh(new THREE.ShapeGeometry(shape), rim);
    m2.scale.setScalar(1.06);
    m2.position.z = -0.05;
    m1.renderOrder = 8;
    m2.renderOrder = 7;
    this.mats.push(inner, rim);
    this.group.add(m2, m1);
    this.group.position.copy(pos);
    this.group.lookAt(pos.clone().add(facing));
    this.group.scale.set(0.01, 1, 1);
  }

  update(dt: number): void {
    this.t += dt;
    const open = Math.min(1, this.t / 1.4);
    const close = this.t > 6 ? Math.max(0, 1 - (this.t - 6) / 1.2) : 1;
    const s = Math.max(0.01, open * open * close);
    this.group.scale.set(s, 0.6 + 0.4 * open, 1);
    this.mats[1].opacity = 0.9 * close;
    this.mats[0].opacity = close;
    if (this.t > 7.3) this.done = true;
  }
}

export class MenosAI implements Controller {
  private cd = 6;
  private stompCd = 3;
  private trampleT = 0;
  private state: 'arrive' | 'fight' = 'arrive';
  private arriveT = 0;
  private crack: SkyCrack | null = null;
  private landed = false;
  private died = false;
  private groundY: number;

  constructor(readonly g: Game, readonly f: Fighter, groundY: number) {
    this.groundY = groundY;
    f.body.ghost = true;
    f.body.float = true;
    f.body.pos.y = groundY + 14;
    f.body.prev.copy(f.body.pos);
    // Kūmon in the sky above where it will land
    const toPlayer = g.player ? g.player.pos.clone().sub(f.pos).setY(0).normalize() : new THREE.Vector3(0, 0, 1);
    f.yaw = Math.atan2(toPlayer.x, toPlayer.z);
    const crackPos = f.pos.clone().addScaledVector(toPlayer, -5);
    crackPos.y = groundY + 30;
    this.crack = new SkyCrack(crackPos, toPlayer, 46);
    g.engine.gr.scene.add(this.crack.group);
    f.visual.material.userData.uniforms.uDissolve.value = 1;
    g.callout('大虚', 'MENOS GRANDE', '#ffffff');
    g.sfx.play('roarBig', f.pos.clone().setY(groundY + 30), 0.6);
    g.hud?.showBanner('THE SKY IS TEARING OPEN', 2.5);
  }

  update(dt: number): void {
    const { g, f } = this;
    if (this.crack) {
      this.crack.update(dt);
      if (this.crack.done) {
        this.crack.group.removeFromParent();
        this.crack = null;
      }
    }
    if (f.dead) {
      if (!this.died) this.onDeath();
      return;
    }
    // ---- arrival: emerge through the crack, drop to the ground
    if (this.state === 'arrive') {
      this.arriveT += dt;
      const u = f.visual.material.userData.uniforms;
      u.uDissolve.value = Math.max(0, 1 - Math.max(0, this.arriveT - 1.2) / 1.6);
      f.invuln = 1;
      if (this.arriveT > 2.6) {
        f.body.pos.y = Math.max(this.groundY, f.body.pos.y - dt * 28);
        if (f.body.pos.y <= this.groundY && !this.landed) {
          this.landed = true;
          g.groundImpact(f.pos.clone(), 6, 300, '#B3122E');
          g.shake(1);
          g.hitstop(0.08);
          f.anim.play('roar');
          setTimeout(() => g.sfx.play('roarBig', f.center()), 700);
        }
      }
      if (this.landed && this.arriveT > 4.2) {
        this.state = 'fight';
        f.invuln = 0;
      }
      f.wish.set(0, 0, 0);
      return;
    }
    f.body.pos.y = this.groundY;
    const p = g.player;
    if (!p || p.dead) {
      f.wish.set(0, 0, 0);
      return;
    }
    const dx = p.pos.x - f.pos.x, dz = p.pos.z - f.pos.z;
    const dist = Math.hypot(dx, dz);
    f.faceTarget = p.center();
    this.cd -= dt;
    this.stompCd -= dt;
    if (!f.busy) {
      if (dist > 22) f.wish.set(dx / dist, 0, dz / dist);
      else f.wish.set(0, 0, 0);
      if (this.stompCd <= 0 && dist < 14 && p.pos.y < f.pos.y + 8) {
        f.act(new StompAction());
        this.stompCd = 5 + Math.random() * 3;
      } else if (this.cd <= 0 && dist < 150) {
        f.act(new CeroAction(this));
        this.cd = 10 + Math.random() * 5;
      }
    } else f.wish.set(0, 0, 0);
    // trample: legs crush what they move through
    this.trampleT += dt;
    if (this.trampleT > 0.28 && Math.hypot(f.body.vel.x, f.body.vel.z) > 0.5) {
      this.trampleT = 0;
      for (const side of ['L', 'R']) {
        const knee = new THREE.Vector3(), ankle = new THREE.Vector3();
        f.visual.rig.bone(`shin.${side}`).getWorldPosition(knee);
        f.visual.rig.bone(`foot.${side}`).getWorldPosition(ankle);
        const r = g.engine.destruction.carve(new CapsuleShape(knee, ankle.clone().setY(Math.max(ankle.y, this.groundY + 0.4)), 2.8), { mode: 'smash', power: 240, impulse: 7, dust: 0.6 });
        if (r.removed > 200 && g.player && g.player.pos.distanceTo(ankle) < 60) g.shake(0.12);
      }
    }
  }

  private onDeath(): void {
    this.died = true;
    const { g, f } = this;
    g.slowMo(1.2, 0.3);
    g.hud?.showBanner('MENOS GRANDE PURIFIED', 3);
    const glow = g.engine.glow;
    for (let i = 0; i < 400; i++) {
      const y = f.pos.y + Math.random() * f.def.height;
      const r = Math.random() * 7;
      const a = Math.random() * Math.PI * 2;
      glow.spawn({ x: f.pos.x + Math.cos(a) * r, y, z: f.pos.z + Math.sin(a) * r, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 4, vz: (Math.random() - 0.5) * 2, size: 0.4 + Math.random() * 0.8, sizeEnd: 0.05, life: 2 + Math.random() * 2.5, r: 0.81, g: 0.91, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW, drag: 0.3, gravity: 0.6 });
    }
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      g.engine.dust.spawn({ x: f.pos.x, y: f.pos.y + 0.5, z: f.pos.z, vx: Math.cos(a) * 14, vy: 1, vz: Math.sin(a) * 14, size: 3, sizeEnd: 9, life: 2.2, r: 0.6, g: 0.56, b: 0.52, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
    }
  }
}
