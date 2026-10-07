// Procedural sound effects (WebAudio, no assets): every sound is synthesised from oscillators and
// filtered noise, with distance attenuation and stereo panning relative to the listener.
import * as THREE from 'three';

export type SfxName =
  | 'swing' | 'swingHeavy' | 'hit' | 'hitHeavy' | 'impact' | 'crumble' | 'getsuga' | 'getsugaBlack'
  | 'shunpo' | 'step' | 'airstep' | 'charge' | 'beam' | 'explode' | 'roar' | 'roarBig' | 'bankai' | 'flare' | 'purify'
  | 'mask' | 'crack' | 'shatter' | 'ting' | 'arrow' | 'gunshot' | 'howl' | 'splash' | 'torrent';

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private listener = new THREE.Vector3();
  private listenerRight = new THREE.Vector3(1, 0, 0);
  volume = 0.7;
  private last = new Map<string, number>();

  /** Create the context (must be called from a user gesture). */
  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctx = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!Ctx) return;
    this.ctx = new Ctx();
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 6;
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(comp).connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setListener(pos: THREE.Vector3, cam: THREE.Camera): void {
    this.listener.copy(pos);
    this.listenerRight.set(1, 0, 0).applyQuaternion(cam.quaternion);
  }

  private noise(dur: number): AudioBufferSourceNode {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    s.loopStart = Math.random();
    s.start(this.ctx!.currentTime, Math.random() * 1.5, dur + 0.1);
    return s;
  }

  private env(g: GainNode, t: number, a: number, peak: number, dec: number): void {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }

  /** Output chain for a positioned sound: gain (distance) → panner → master. */
  private out(pos: THREE.Vector3 | undefined, vol: number, range = 60): AudioNode | null {
    const ctx = this.ctx!;
    let k = vol;
    let pan = 0;
    if (pos) {
      const d = pos.distanceTo(this.listener);
      k *= 1 / (1 + (d / range) * (d / range) * 4);
      if (k < 0.004) return null;
      const dx = pos.clone().sub(this.listener);
      pan = Math.max(-0.9, Math.min(0.9, dx.dot(this.listenerRight) / Math.max(4, d)));
    }
    const g = ctx.createGain();
    g.gain.value = k;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    g.connect(p).connect(this.master!);
    return g;
  }

  play(name: SfxName, pos?: THREE.Vector3, intensity = 1): void {
    if (!this.ctx || !this.master || this.ctx.state !== 'running') return;
    // de-duplicate bursts of the same sound
    const now = this.ctx.currentTime;
    const key = name;
    const minGap = name === 'crumble' ? 0.07 : name === 'step' ? 0.12 : 0.025;
    if ((this.last.get(key) ?? -1) > now - minGap) return;
    this.last.set(key, now);
    const ctx = this.ctx;
    const t = now + 0.005;
    const I = Math.max(0.1, Math.min(2.5, intensity));
    switch (name) {
      case 'swing':
      case 'swingHeavy': {
        const o = this.out(pos, (name === 'swing' ? 0.32 : 0.5) * I);
        if (!o) return;
        const n = this.noise(0.4);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 1.6;
        bp.frequency.setValueAtTime(name === 'swing' ? 2400 : 1600, t);
        bp.frequency.exponentialRampToValueAtTime(420, t + (name === 'swing' ? 0.18 : 0.3));
        const g = ctx.createGain();
        this.env(g, t, 0.035, 1, name === 'swing' ? 0.17 : 0.3);
        n.connect(bp).connect(g).connect(o);
        break;
      }
      case 'hit':
      case 'hitHeavy': {
        const o = this.out(pos, (name === 'hit' ? 0.55 : 0.9) * I);
        if (!o) return;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(name === 'hit' ? 160 : 110, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 0.16);
        const g = ctx.createGain();
        this.env(g, t, 0.004, 1, name === 'hit' ? 0.16 : 0.3);
        osc.connect(g).connect(o);
        osc.start(t);
        osc.stop(t + 0.4);
        const n = this.noise(0.15);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1800;
        const g2 = ctx.createGain();
        this.env(g2, t, 0.002, 0.7, 0.07);
        n.connect(hp).connect(g2).connect(o);
        break;
      }
      case 'impact':
      case 'explode': {
        const big = name === 'explode';
        const o = this.out(pos, (big ? 1.1 : 0.8) * I, big ? 160 : 90);
        if (!o) return;
        const n = this.noise(big ? 2.2 : 1.1);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(big ? 2200 : 1400, t);
        lp.frequency.exponentialRampToValueAtTime(120, t + (big ? 1.8 : 0.9));
        const g = ctx.createGain();
        this.env(g, t, 0.005, 1, big ? 1.9 : 0.9);
        n.connect(lp).connect(g).connect(o);
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(70, t);
        osc.frequency.exponentialRampToValueAtTime(28, t + 0.6);
        const g2 = ctx.createGain();
        this.env(g2, t, 0.005, 1.2, big ? 1.2 : 0.6);
        osc.connect(g2).connect(o);
        osc.start(t);
        osc.stop(t + 1.5);
        break;
      }
      case 'crumble': {
        const o = this.out(pos, 0.35 * I, 70);
        if (!o) return;
        for (let i = 0; i < 6; i++) {
          const tt = t + Math.random() * 0.35;
          const n = this.noise(0.12);
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 300 + Math.random() * 1600;
          bp.Q.value = 3;
          const g = ctx.createGain();
          this.env(g, tt, 0.003, 0.7, 0.06 + Math.random() * 0.08);
          n.connect(bp).connect(g).connect(o);
        }
        break;
      }
      case 'getsuga':
      case 'getsugaBlack': {
        const o = this.out(pos, 0.9 * I, 120);
        if (!o) return;
        const n = this.noise(1.4);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 0.9;
        bp.frequency.setValueAtTime(600, t);
        bp.frequency.exponentialRampToValueAtTime(3200, t + 0.12);
        bp.frequency.exponentialRampToValueAtTime(300, t + 1.2);
        const g = ctx.createGain();
        this.env(g, t, 0.02, 1, 1.2);
        n.connect(bp).connect(g).connect(o);
        const s = ctx.createOscillator();
        s.type = 'sawtooth';
        const base = name === 'getsuga' ? 220 : 140;
        s.frequency.setValueAtTime(base, t);
        s.frequency.exponentialRampToValueAtTime(base * 2.2, t + 0.15);
        s.frequency.exponentialRampToValueAtTime(base * 0.7, t + 1);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1400;
        const g2 = ctx.createGain();
        this.env(g2, t, 0.02, 0.35, 0.9);
        s.connect(lp).connect(g2).connect(o);
        s.start(t);
        s.stop(t + 1.2);
        break;
      }
      case 'shunpo':
      case 'airstep': {
        const o = this.out(pos, (name === 'shunpo' ? 0.45 : 0.2) * I);
        if (!o) return;
        const n = this.noise(0.12);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(name === 'shunpo' ? 2500 : 1200, t);
        hp.frequency.exponentialRampToValueAtTime(6000, t + 0.08);
        const g = ctx.createGain();
        this.env(g, t, 0.004, 1, 0.08);
        n.connect(hp).connect(g).connect(o);
        break;
      }
      case 'step': {
        const o = this.out(pos, 0.12 * I, 30);
        if (!o) return;
        const n = this.noise(0.08);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 500;
        const g = ctx.createGain();
        this.env(g, t, 0.003, 1, 0.06);
        n.connect(lp).connect(g).connect(o);
        break;
      }
      case 'charge':
      case 'beam': {
        const dur = name === 'charge' ? 1.9 : 1.5;
        const o = this.out(pos, 0.7 * I, 200);
        if (!o) return;
        const s = ctx.createOscillator();
        s.type = 'sawtooth';
        s.frequency.setValueAtTime(name === 'charge' ? 60 : 90, t);
        s.frequency.exponentialRampToValueAtTime(name === 'charge' ? 320 : 70, t + dur);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = name === 'charge' ? 14 : 31;
        const lg = ctx.createGain();
        lg.gain.value = 18;
        lfo.connect(lg).connect(s.frequency);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = name === 'charge' ? 900 : 2600;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(name === 'charge' ? 0.6 : 1, t + (name === 'charge' ? dur * 0.9 : 0.05));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
        s.connect(lp).connect(g).connect(o);
        s.start(t);
        lfo.start(t);
        s.stop(t + dur + 0.3);
        lfo.stop(t + dur + 0.3);
        if (name === 'beam') {
          const n = this.noise(dur);
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 900;
          bp.Q.value = 0.5;
          const g2 = ctx.createGain();
          g2.gain.setValueAtTime(0.0001, t);
          g2.gain.exponentialRampToValueAtTime(0.8, t + 0.05);
          g2.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
          n.connect(bp).connect(g2).connect(o);
        }
        break;
      }
      case 'roar':
      case 'roarBig': {
        const big = name === 'roarBig';
        const o = this.out(pos, (big ? 1 : 0.55) * I, big ? 220 : 60);
        if (!o) return;
        const dur = big ? 2.2 : 1.1;
        const s = ctx.createOscillator();
        s.type = 'sawtooth';
        s.frequency.setValueAtTime(big ? 55 : 120, t);
        s.frequency.linearRampToValueAtTime(big ? 75 : 170, t + dur * 0.3);
        s.frequency.linearRampToValueAtTime(big ? 40 : 90, t + dur);
        const fm = ctx.createOscillator();
        fm.frequency.value = big ? 23 : 37;
        const fg = ctx.createGain();
        fg.gain.value = big ? 25 : 40;
        fm.connect(fg).connect(s.frequency);
        const ws = ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) { const x = (i / 255) * 2 - 1; curve[i] = Math.tanh(x * 3.5); }
        ws.curve = curve;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = big ? 700 : 1200;
        const g = ctx.createGain();
        this.env(g, t, 0.12, 0.7, dur);
        s.connect(ws).connect(lp).connect(g).connect(o);
        s.start(t);
        fm.start(t);
        s.stop(t + dur + 0.2);
        fm.stop(t + dur + 0.2);
        break;
      }
      case 'bankai':
      case 'flare': {
        const big = name === 'bankai';
        const o = this.out(pos, big ? 1 : 0.5, 200);
        if (!o) return;
        const dur = big ? 2.6 : 1;
        for (const [f0, det] of [[110, -7], [165, 5], [220, 3], [330, -4]] as [number, number][]) {
          const s = ctx.createOscillator();
          s.type = 'sawtooth';
          s.frequency.value = f0 * (big ? 1 : 1.5);
          s.detune.value = det * 3;
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(300, t);
          lp.frequency.exponentialRampToValueAtTime(big ? 3800 : 2000, t + dur * 0.4);
          const g = ctx.createGain();
          this.env(g, t, dur * 0.3, 0.12, dur * 0.7);
          s.connect(lp).connect(g).connect(o);
          s.start(t);
          s.stop(t + dur + 0.1);
        }
        if (big) this.play('explode', pos, 1.2);
        break;
      }
      case 'mask': {
        // Hollowfication: a distorted, ringing growl (the doubled Hollow voice) over a low boom
        const o = this.out(pos, 0.95 * I, 160);
        if (!o) return;
        const dur = 1.6;
        for (const [f0, det] of [[92, 0], [138, 9], [184, -6]] as [number, number][]) {
          const s = ctx.createOscillator();
          s.type = 'sawtooth';
          s.frequency.setValueAtTime(f0 * 0.7, t);
          s.frequency.exponentialRampToValueAtTime(f0 * 1.3, t + 0.25);
          s.frequency.exponentialRampToValueAtTime(f0 * 0.8, t + dur);
          s.detune.value = det * 4;
          const fm = ctx.createOscillator();
          fm.frequency.value = 29 + det;
          const fg = ctx.createGain();
          fg.gain.value = 30;
          fm.connect(fg).connect(s.frequency);
          const ws = ctx.createWaveShaper();
          const curve = new Float32Array(256);
          for (let i = 0; i < 256; i++) { const x = (i / 255) * 2 - 1; curve[i] = Math.tanh(x * 5); }
          ws.curve = curve;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.Q.value = 1.4;
          bp.frequency.setValueAtTime(500, t);
          bp.frequency.exponentialRampToValueAtTime(1600, t + 0.3);
          bp.frequency.exponentialRampToValueAtTime(400, t + dur);
          const g = ctx.createGain();
          this.env(g, t, 0.06, 0.32, dur);
          s.connect(ws).connect(bp).connect(g).connect(o);
          // the echo: the same voice, delayed and thinner
          const dl = ctx.createDelay(0.5);
          dl.delayTime.value = 0.11;
          const dg = ctx.createGain();
          dg.gain.value = 0.45;
          g.connect(dl).connect(dg).connect(o);
          s.start(t);
          fm.start(t);
          s.stop(t + dur + 0.2);
          fm.stop(t + dur + 0.2);
        }
        // metallic ring
        for (const f of [1320, 1980, 2770]) {
          const r = ctx.createOscillator();
          r.type = 'sine';
          r.frequency.value = f;
          const g = ctx.createGain();
          this.env(g, t + 0.02, 0.01, 0.07, 1.4);
          r.connect(g).connect(o);
          r.start(t);
          r.stop(t + 1.6);
        }
        this.play('impact', pos, 1.1);
        break;
      }
      case 'crack':
      case 'shatter': {
        // bone cracking: sharp clicks; the shatter adds a bright tinkle and a dull break
        const big = name === 'shatter';
        const o = this.out(pos, (big ? 0.8 : 0.45) * I, 70);
        if (!o) return;
        const clicks = big ? 14 : 4;
        for (let i = 0; i < clicks; i++) {
          const tt = t + Math.random() * (big ? 0.25 : 0.12);
          const n = this.noise(0.05);
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 1800 + Math.random() * 4200;
          bp.Q.value = 6;
          const g = ctx.createGain();
          this.env(g, tt, 0.001, 0.9, 0.025 + Math.random() * 0.04);
          n.connect(bp).connect(g).connect(o);
        }
        if (big) {
          for (let i = 0; i < 6; i++) {
            const r = ctx.createOscillator();
            r.type = 'triangle';
            r.frequency.value = 2400 + Math.random() * 3000;
            const g = ctx.createGain();
            const tt = t + 0.04 + Math.random() * 0.3;
            this.env(g, tt, 0.002, 0.05, 0.3);
            r.connect(g).connect(o);
            r.start(tt);
            r.stop(tt + 0.4);
          }
          this.play('hitHeavy', pos, 0.8);
        }
        break;
      }
      case 'ting': {
        // a blade stopped dead on a fingertip: a click and one clean, high, ringing note
        const o = this.out(pos, 0.5 * I, 60);
        if (!o) return;
        const n = this.noise(0.03);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 3200;
        const gn = ctx.createGain();
        this.env(gn, t, 0.001, 0.8, 0.03);
        n.connect(hp).connect(gn).connect(o);
        for (const [f0, a, d] of [[2637, 0.5, 0.9], [4186, 0.3, 0.6], [6623, 0.16, 0.35]]) {
          const r = ctx.createOscillator();
          r.type = 'sine';
          r.frequency.value = f0 * (0.995 + Math.random() * 0.01);
          const g = ctx.createGain();
          this.env(g, t, 0.002, a, d);
          r.connect(g).connect(o);
          r.start(t);
          r.stop(t + d + 0.1);
        }
        break;
      }
      case 'arrow': {
        // a bolt of light leaving the bow: a short bright zip over a breath of air
        const o = this.out(pos, 0.32 * I, 60);
        if (!o) return;
        const z = ctx.createOscillator();
        z.type = 'triangle';
        z.frequency.setValueAtTime(2600, t);
        z.frequency.exponentialRampToValueAtTime(620, t + 0.1);
        const gz = ctx.createGain();
        this.env(gz, t, 0.003, 0.45, 0.11);
        z.connect(gz).connect(o);
        z.start(t);
        z.stop(t + 0.16);
        const n = this.noise(0.09);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 3800;
        const gn = ctx.createGain();
        this.env(gn, t, 0.001, 0.35, 0.06);
        n.connect(hp).connect(gn).connect(o);
        break;
      }
      case 'gunshot': {
        // a Cero out of a pistol: a hard thump, a bright crack and a short falling zap
        const o = this.out(pos, 0.42 * I, 90);
        if (!o) return;
        const k = ctx.createOscillator();
        k.type = 'sine';
        k.frequency.setValueAtTime(150, t);
        k.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        const gk = ctx.createGain();
        this.env(gk, t, 0.002, 0.9, 0.14);
        k.connect(gk).connect(o);
        k.start(t);
        k.stop(t + 0.2);
        const n = this.noise(0.08);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2400;
        bp.Q.value = 0.7;
        const gn = ctx.createGain();
        this.env(gn, t, 0.001, 0.7, 0.07);
        n.connect(bp).connect(gn).connect(o);
        const z = ctx.createOscillator();
        z.type = 'sawtooth';
        z.frequency.setValueAtTime(1800, t);
        z.frequency.exponentialRampToValueAtTime(260, t + 0.16);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2200;
        const gz = ctx.createGain();
        this.env(gz, t, 0.002, 0.22, 0.16);
        z.connect(lp).connect(gz).connect(o);
        z.start(t);
        z.stop(t + 0.22);
        break;
      }
      case 'howl': {
        // the pack: three wolf voices rising together, wavering, falling away
        const o = this.out(pos, 0.3 * I, 120);
        if (!o) return;
        for (let i = 0; i < 3; i++) {
          const t0 = t + i * 0.09;
          const dur = 1.3 + i * 0.2;
          const f0 = 330 + i * 70 + Math.random() * 20;
          const s = ctx.createOscillator();
          s.type = 'triangle';
          s.frequency.setValueAtTime(f0 * 0.7, t0);
          s.frequency.exponentialRampToValueAtTime(f0 * 1.25, t0 + dur * 0.35);
          s.frequency.exponentialRampToValueAtTime(f0 * 0.8, t0 + dur);
          const vib = ctx.createOscillator();
          vib.frequency.value = 5.5 + i;
          const vg = ctx.createGain();
          vg.gain.value = f0 * 0.02;
          vib.connect(vg).connect(s.frequency);
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 1600;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.35, t0 + dur * 0.3);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
          s.connect(lp).connect(g).connect(o);
          s.start(t0);
          vib.start(t0);
          s.stop(t0 + dur + 0.1);
          vib.stop(t0 + dur + 0.1);
        }
        break;
      }
      case 'splash': {
        // water hitting hard: a falling bloop under a hiss that closes down
        const o = this.out(pos, 0.5 * I, 90);
        if (!o) return;
        const n = this.noise(0.6);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(4200, t);
        lp.frequency.exponentialRampToValueAtTime(500, t + 0.5);
        const gn = ctx.createGain();
        this.env(gn, t, 0.004, 0.8, 0.5);
        n.connect(lp).connect(gn).connect(o);
        const s = ctx.createOscillator();
        s.type = 'sine';
        s.frequency.setValueAtTime(520, t);
        s.frequency.exponentialRampToValueAtTime(140, t + 0.18);
        const gs = ctx.createGain();
        this.env(gs, t, 0.003, 0.5, 0.2);
        s.connect(gs).connect(o);
        s.start(t);
        s.stop(t + 0.3);
        break;
      }
      case 'torrent': {
        // a river let loose: a long rushing roar with a churning tremolo
        const o = this.out(pos, 0.55 * I, 140);
        if (!o) return;
        const dur = 1.8;
        const n = this.noise(dur);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(600, t);
        bp.frequency.linearRampToValueAtTime(900, t + dur * 0.4);
        bp.frequency.linearRampToValueAtTime(420, t + dur);
        bp.Q.value = 0.6;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.9, t + 0.12);
        g.gain.setValueAtTime(0.9, t + dur * 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const trem = ctx.createOscillator();
        trem.frequency.value = 9;
        const tg = ctx.createGain();
        tg.gain.value = 0.25;
        trem.connect(tg).connect(g.gain);
        trem.start(t);
        trem.stop(t + dur);
        n.connect(bp).connect(g).connect(o);
        const r = this.noise(dur);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 180;
        const gr = ctx.createGain();
        this.env(gr, t, 0.1, 1.2, dur - 0.1);
        r.connect(lp).connect(gr).connect(o);
        break;
      }
      case 'purify': {
        const o = this.out(pos, 0.4 * I, 80);
        if (!o) return;
        for (let i = 0; i < 5; i++) {
          const s = ctx.createOscillator();
          s.type = 'sine';
          s.frequency.value = 880 * Math.pow(2, i / 5) * (1 + Math.random() * 0.02);
          const g = ctx.createGain();
          this.env(g, t + i * 0.06, 0.02, 0.18, 1.2);
          s.connect(g).connect(o);
          s.start(t + i * 0.06);
          s.stop(t + i * 0.06 + 1.4);
        }
        break;
      }
    }
  }
}
