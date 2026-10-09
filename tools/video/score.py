# Score generator: an epic, Bleach-like cue (drums, distorted riff, strings, choir, a shakuhachi-like lead, braams,
# risers, sword hits) synthesised with numpy and laid on a cue sheet so its hits land on the film's cuts.
#
#   python3 tools/video/score.py tools/video/cues/trailer.json out.wav
#
# Cue sheet (JSON): {"len": 90, "bpm": 120, "key": "D", "mode": "minor"|"in"|"lydian"|"phrygian", "flavour": "rock"|"stars"|"glass"|"hell",
#   "sections": [[t, "intro"|"build"|"main"|"break"|"climax"|"outro"], ...], "hits": [t...] (sword shing), "booms": [t...] (braam +
#   taiko), "risers": [[t0, t1]...], "drops": [t...] (sub drop + silence before), "silence": [[t0, t1]...]}
import json, sys, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def note_hz(n):  # midi
    return 440.0 * 2 ** ((n - 69) / 12)


KEYS = {'C': 0, 'C#': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
SCALES = {
    'minor': [0, 2, 3, 5, 7, 8, 10],
    'in': [0, 1, 5, 7, 8],  # the Japanese In scale (miyako-bushi)
    'lydian': [0, 2, 4, 6, 7, 9, 11],
    'phrygian': [0, 1, 3, 5, 7, 8, 10],
    'dorian': [0, 2, 3, 5, 7, 9, 10],
}


class Mix:
    def __init__(self, seconds):
        self.n = int(seconds * SR) + SR * 4
        self.stems = {}

    def stem(self, name):
        if name not in self.stems:
            self.stems[name] = np.zeros((2, self.n))
        return self.stems[name]

    def add(self, name, t, sig, pan=0.0, gain=1.0):
        st = self.stem(name)
        i = int(t * SR)
        if i >= self.n or i + len(sig) <= 0:
            return
        if i < 0:
            sig = sig[-i:]
            i = 0
        m = min(len(sig), self.n - i)
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        st[0, i:i + m] += sig[:m] * gain * l * 1.414
        st[1, i:i + m] += sig[:m] * gain * r * 1.414


# ------------------------------------------------------------------ dsp helpers

def tt(sec):
    return np.arange(int(sec * SR)) / SR


def saw(f, t, detune=0.0):
    ph = (t * f * (1 + detune)) % 1.0
    return 2 * ph - 1


def fft_filter(x, resp):
    """zero-phase filter of a (2, n) or (n,) signal by a magnitude response resp(freqs)"""
    X = np.fft.rfft(x, axis=-1)
    f = np.fft.rfftfreq(x.shape[-1], 1 / SR)
    X *= resp(f)
    return np.fft.irfft(X, n=x.shape[-1], axis=-1)


def lp(fc, order=2):
    return lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order))


def hp(fc, order=2):
    return lambda f: 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * order))


def bp(fc, q):
    return lambda f: 1 / np.sqrt(1 + (q * (f / fc - fc / np.maximum(f, 1e-3))) ** 2)


def short_lp(sig, fc):
    return fft_filter(sig, lp(fc))


def env(n, a=0.005, d=0.1, s=0.7, r=0.2, hold=None):
    """ADSR over n samples (r is the tail inside n)"""
    t = np.arange(n) / SR
    tot = n / SR
    e = np.ones(n) * s
    e[t < a] = t[t < a] / max(a, 1e-4)
    m = (t >= a) & (t < a + d)
    e[m] = 1 - (1 - s) * (t[m] - a) / max(d, 1e-4)
    rel0 = tot - r
    m = t >= rel0
    e[m] *= np.clip(1 - (t[m] - rel0) / max(r, 1e-4), 0, 1)
    return e


def reverb_ir(sec=2.6, damp=4000, stereo=True):
    n = int(sec * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-t * 6.9 / sec)
    ir = fft_filter(ir, lp(damp, 1))
    ir[:, : int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


def convolve(x, ir):
    n = x.shape[1] + ir.shape[1]
    N = 1 << int(np.ceil(np.log2(n)))
    y = np.fft.irfft(np.fft.rfft(x, N, axis=1) * np.fft.rfft(ir, N, axis=1), N, axis=1)
    return y[:, : x.shape[1]]


# ------------------------------------------------------------------ instruments

def taiko(big=1.0):
    t = tt(1.6)
    f = 52 + 90 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * (3.2 / big))
    skin = short_lp(rng.standard_normal(len(t)) * np.exp(-t * 40), 1800)
    return (body * 1.1 + skin * 0.5) * big


def kick():
    t = tt(0.5)
    f = 45 + 110 * np.exp(-t * 35)
    ph = 2 * np.pi * np.cumsum(f) / SR
    click = short_lp(rng.standard_normal(len(t)) * np.exp(-t * 300), 5000) * 0.3
    return np.sin(ph) * np.exp(-t * 7) + click


def snare():
    t = tt(0.45)
    noise = fft_filter(rng.standard_normal(len(t)), lambda f: hp(1200)(f) * lp(9000)(f)) * np.exp(-t * 14)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 22)
    return noise * 0.7 + body * 0.6


def hat(open_=False):
    t = tt(0.35 if open_ else 0.08)
    return fft_filter(rng.standard_normal(len(t)), hp(7000)) * np.exp(-t * (9 if open_ else 60)) * 0.35


def crash():
    t = tt(2.5)
    return fft_filter(rng.standard_normal(len(t)), lambda f: hp(4000)(f)) * np.exp(-t * 1.6) * 0.45


def power_chord(root, dur, mute=False, bright=1.0):
    t = tt(dur + 0.05)
    f = note_hz(root)
    x = sum(saw(f * m, t, d) for m, d in ((1, 0), (1, 0.004), (1.4983, -0.003), (2, 0.002))) / 3
    e = np.exp(-t * (14 if mute else 0.9))
    e *= env(len(t), 0.003, 0.05, 1, 0.04)
    y = np.tanh(x * 7) * e
    return fft_filter(y, lambda fr: lp(1400 if mute else 3800 * bright)(fr) * hp(90)(fr)) * 0.55


def string_note(n, dur, att=0.25, bright=2600):
    t = tt(dur)
    f = note_hz(n)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t + rng.random() * 6)
    x = sum(saw(f * vib, t, d) for d in (-0.006, -0.002, 0.003, 0.007)) / 4
    return short_lp(x * env(len(t), att, 0.2, 0.85, min(0.4, dur * 0.4)), bright)


def spiccato(n, bright=3200):
    t = tt(0.16)
    f = note_hz(n)
    x = sum(saw(f, t, d) for d in (-0.004, 0.004)) / 2
    return short_lp(x * np.exp(-t * 22) * env(len(t), 0.004, 0.02, 1, 0.03), bright)


def choir_note(n, dur, vowel='a'):
    t = tt(dur)
    f = note_hz(n)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 4.6 * t + rng.random() * 6)
    x = sum(saw(f * vib, t, d) for d in (-0.009, -0.004, 0.0, 0.005, 0.01)) / 5
    F = {'a': (750, 1150, 2800), 'o': (480, 820, 2600), 'u': (330, 700, 2500)}[vowel]
    y = fft_filter(x, lambda fr: bp(F[0], 4)(fr) * 1.0 + bp(F[1], 5)(fr) * 0.6 + bp(F[2], 7)(fr) * 0.25)
    return y * env(len(t), min(0.6, dur * 0.3), 0.3, 0.9, min(0.8, dur * 0.35)) * 2.2


def flute(n, dur):
    t = tt(dur)
    f = note_hz(n)
    bend = 1 - 0.02 * np.exp(-t * 10)  # the shakuhachi's scoop into the note
    vib = 1 + 0.008 * np.sin(2 * np.pi * 5.0 * t) * np.clip(t * 2, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * bend * vib) / SR
    tone = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    breath = fft_filter(rng.standard_normal(len(t)), bp(f * 2, 2)) * 0.25
    return (tone + breath) * env(len(t), 0.08, 0.2, 0.8, min(0.5, dur * 0.4)) * 0.5


def pluck(n, dur=1.6, bright=0.5):
    """Karplus-Strong (a koto-ish pluck)"""
    f = note_hz(n)
    p = max(2, int(SR / f))
    N = int(dur * SR)
    buf = rng.standard_normal(p) * 0.5
    out = np.zeros(N)
    k = 0
    while k < N:
        m = min(p, N - k)
        out[k:k + m] = buf[:m]
        buf = (bright * buf + (1 - bright) * np.roll(buf, 1)) * 0.996
        k += p
    return out * np.exp(-np.arange(N) / SR * 1.5)


def bell(n, dur=3.0):
    t = tt(dur)
    f = note_hz(n)
    parts = [(1, 1, 1.0), (2.76, 0.5, 2.0), (5.4, 0.25, 3.0), (8.93, 0.12, 4.5)]
    return sum(np.sin(2 * np.pi * f * m * t) * a * np.exp(-t * k) for m, a, k in parts) * 0.3


def braam(root, dur=3.5):
    t = tt(dur)
    f = note_hz(root)
    x = sum(saw(f * m, t, d) for m, d in ((0.5, 0), (1, 0.003), (1, -0.004), (1.5, 0.002), (2, -0.002))) / 4
    x = np.tanh(x * 3)
    e = env(len(t), 0.02, 0.5, 0.6, 1.2)
    bright = short_lp(x, 2400) * np.exp(-t * 2.5)
    dark = short_lp(x, 500)
    sub = np.sin(2 * np.pi * f * 0.5 * t) * np.exp(-t * 1.2)
    return (bright * 0.8 + dark + sub * 0.8) * e


def shing():
    t = tt(1.4)
    parts = [(1210, 0.5, 4), (2870, 0.4, 5), (4430, 0.3, 6), (6620, 0.2, 9), (9100, 0.12, 12)]
    ring = sum(np.sin(2 * np.pi * f * t + rng.random() * 6) * a * np.exp(-t * k) for f, a, k in parts)
    noise = fft_filter(rng.standard_normal(len(t)), hp(3000)) * np.exp(-t * 30) * 0.6
    return (ring + noise) * 0.55


def whoosh(dur=0.6):
    t = tt(dur)
    x = rng.standard_normal(len(t))
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return fft_filter(x * e, bp(1800, 0.8)) * 0.5


def riser(dur):
    t = tt(dur)
    x = rng.standard_normal(len(t))
    e = (t / dur) ** 2.2
    # noise brightening as it rises: blend of low and high bands
    lo = fft_filter(x, bp(600, 1.2)) * (1 - t / dur)
    hi = fft_filter(x, bp(5000, 0.9)) * (t / dur)
    tone = sum(np.sin(2 * np.pi * np.cumsum(f0 * 2 ** (2 * t / dur)) / SR) for f0 in (110, 165, 220)) * 0.08
    return (lo + hi + tone) * e * 0.6


def sub_drop(dur=2.5):
    t = tt(dur)
    f = 30 + 70 * np.exp(-t * 2.5)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.0)


# ------------------------------------------------------------------ the score

def section_at(sections, t):
    cur = sections[0][1]
    for s0, name in sections:
        if t >= s0:
            cur = name
    return cur


def compose(cue):
    L = cue['len']
    bpm = cue.get('bpm', 120)
    beat = 60 / bpm
    bar = beat * 4
    key = KEYS[cue.get('key', 'D')]
    mode = cue.get('mode', 'minor')
    flav = cue.get('flavour', 'rock')
    scale = SCALES[mode]
    root = 38 + key  # D2 for key D
    mix = Mix(L)
    sections = cue['sections']
    silences = cue.get('silence', [])
    quiet = lambda t: any(a <= t < b for a, b in silences)

    # chord progression (scale degrees) by flavour
    prog = {
        'rock': [0, 5, 6, 4],  # i VI VII v  (minor)
        'stars': [0, 4, 5, 3],  # bright: I V vi IV-ish in lydian
        'glass': [0, 5, 3, 4],
        'hell': [0, 1, 0, 6],  # phrygian i bII i bVII
    }[flav]

    def deg(d, octave=0):
        n = len(scale)
        return root + scale[d % n] + 12 * (d // n + octave)

    nbars = int(np.ceil(L / bar))
    for b in range(nbars):
        t0 = b * bar
        sec = section_at(sections, t0)
        ch = prog[b % len(prog)]
        r = deg(ch)
        if quiet(t0):
            continue
        # ---------------- pads (strings, choir) everywhere but the very start of the intro
        if sec in ('intro', 'break', 'outro'):
            for o in (12, 19, 24):
                mix.add('pad', t0, string_note(r + o, bar + 0.4, att=0.9, bright=1800), pan=(o - 18) / 12, gain=0.16)
            if flav in ('stars', 'glass'):
                for i in range(8):
                    n = deg(ch + [0, 2, 4, 7][i % 4], 2 + (i // 4))
                    mix.add('bell', t0 + i * beat / 2, bell(n, 2.5), pan=np.sin(i) * 0.6, gain=0.18 if flav == 'stars' else 0.14)
            else:
                for i in range(4):
                    n = deg(ch + [0, 2, 4, 2][i], 2)
                    mix.add('pluck', t0 + i * beat, pluck(n, 1.8, 0.6), pan=0.3 * (-1) ** i, gain=0.35)
        if sec in ('build', 'main', 'climax'):
            for o in (12, 15 if mode != 'lydian' else 16, 19):
                mix.add('pad', t0, string_note(r + o, bar + 0.3, att=0.15, bright=2600), pan=(o - 15) / 10, gain=0.13)
            # string ostinato in 8ths
            pat = [0, 0, 7, 0, 3 if mode != 'lydian' else 4, 0, 7, 12]
            for i in range(8):
                mix.add('ost', t0 + i * beat / 2, spiccato(r + 24 + pat[i]), pan=0.4 * (-1) ** i, gain=0.22)
        if sec in ('main', 'climax') or (sec == 'build' and flav == 'hell'):
            v = 'a' if sec == 'climax' else 'o'
            for o in (12, 19, 24 if sec == 'climax' else 16):
                mix.add('choir', t0, choir_note(r + o, bar + 0.2, v), pan=(o - 18) / 14, gain=0.16 if sec == 'main' else 0.22)
        # ---------------- riff (guitar)
        if sec in ('main', 'climax') and flav in ('rock', 'hell', 'glass', 'stars'):
            g = 0.9 if flav in ('rock', 'hell') else 0.5
            rr = r + (0 if flav != 'stars' else 12)
            for i in range(8):
                accent = i in (0, 3, 6)
                if accent:
                    mix.add('gtr', t0 + i * beat / 2, power_chord(rr, beat * 0.75, mute=False, bright=0.9), pan=-0.35, gain=g)
                    mix.add('gtr', t0 + i * beat / 2 + 0.012, power_chord(rr, beat * 0.75, mute=False, bright=0.85), pan=0.35, gain=g)
                else:
                    mix.add('gtr', t0 + i * beat / 2, power_chord(rr, beat * 0.4, mute=True), pan=-0.3, gain=g * 0.8)
                    mix.add('gtr', t0 + i * beat / 2 + 0.01, power_chord(rr, beat * 0.4, mute=True), pan=0.3, gain=g * 0.8)
        if sec == 'build' and flav in ('rock', 'hell'):
            for i in range(0, 8, 2):
                mix.add('gtr', t0 + i * beat / 2, power_chord(r, beat * 0.4, mute=True), pan=0, gain=0.5)
        # ---------------- drums
        if sec == 'intro':
            mix.add('taiko', t0, taiko(1.2), gain=0.5)
            if b % 2 == 1:
                mix.add('taiko', t0 + beat * 2.5, taiko(0.8), pan=0.3, gain=0.35)
        if sec == 'build':
            for i in (0, 3, 6):
                mix.add('taiko', t0 + i * beat / 2, taiko(1.0), pan=0.2 * (-1) ** i, gain=0.55)
            mix.add('drum', t0 + beat, snare(), gain=0.35)
            mix.add('drum', t0 + beat * 3, snare(), gain=0.35)
        if sec in ('main', 'climax'):
            for i in range(8):
                if i in (0, 3, 5) or (sec == 'climax' and i in (1, 4, 7)):
                    mix.add('drum', t0 + i * beat / 2, kick(), gain=0.85)
                mix.add('drum', t0 + i * beat / 2, hat(i % 2 == 1), pan=0.4, gain=0.6)
            mix.add('drum', t0 + beat, snare(), gain=0.75)
            mix.add('drum', t0 + beat * 3, snare(), gain=0.75)
            mix.add('taiko', t0, taiko(1.3), gain=0.5)
            if sec == 'climax':
                for i in range(4):
                    mix.add('taiko', t0 + beat * 3 + i * beat / 4, taiko(0.7), pan=0.3 * (-1) ** i, gain=0.4)
            if b % 4 == 0:
                mix.add('drum', t0, crash(), pan=0.3, gain=0.6)
        if sec == 'break':
            mix.add('taiko', t0, taiko(1.4), gain=0.45)
        # ---------------- lead (shakuhachi in the intro and break; over the climax for rock)
        if sec in ('intro', 'break') and (b % 2 == 0):
            phrase = [(0, 1.5), (2, 0.5), (3, 1.0), (4, 1.0)] if b % 4 == 0 else [(4, 1.0), (3, 0.5), (2, 0.5), (1, 1.0), (0, 1.0)]
            tt0 = t0 + beat
            for d, l in phrase:
                n = deg(ch + d, 3 if flav != 'hell' else 2)
                if flav == 'stars':
                    mix.add('lead', tt0, bell(n + 12, 2.0) * 1.2, pan=0.2, gain=0.3)
                else:
                    mix.add('lead', tt0, flute(n, l * beat + 0.25), pan=0.15, gain=0.45)
                tt0 += l * beat
        if sec == 'climax' and b % 2 == 0:
            tt0 = t0
            for d, l in [(4, 1), (5, 0.5), (4, 0.5), (2, 1), (0, 1), (2, 2), (1, 2)]:
                n = deg(ch + d, 3)
                mix.add('lead', tt0, string_note(n, l * beat + 0.1, att=0.05, bright=4200), pan=0.0, gain=0.3)
                tt0 += l * beat

    # ---------------- events
    for t in cue.get('booms', []):
        mix.add('fx', t, braam(root - 12 + 12, 3.5), gain=0.55)
        mix.add('taiko', t, taiko(1.6), gain=0.8)
        mix.add('drum', t, crash(), gain=0.5)
    for t in cue.get('hits', []):
        mix.add('fx', t, shing(), pan=rng.uniform(-0.4, 0.4), gain=0.35)
        mix.add('fx', t - 0.25, whoosh(0.35), pan=rng.uniform(-0.6, 0.6), gain=0.4)
    for a, b in cue.get('risers', []):
        mix.add('fx', a, riser(b - a), gain=0.5)
    for t in cue.get('drops', []):
        mix.add('fx', t, sub_drop(), gain=0.9)
        mix.add('fx', t, braam(root - 12 + 12, 5.0), gain=0.6)
    for t in cue.get('whooshes', []):
        mix.add('fx', t, whoosh(0.7), gain=0.5)

    # ---------------- mix
    gains = {'pad': 1.0, 'ost': 0.9, 'choir': 1.0, 'gtr': 0.75, 'drum': 1.0, 'taiko': 1.0, 'lead': 1.0, 'pluck': 0.8, 'bell': 0.9, 'fx': 1.0}
    verb = {'pad': 0.35, 'ost': 0.25, 'choir': 0.5, 'gtr': 0.08, 'drum': 0.12, 'taiko': 0.3, 'lead': 0.4, 'pluck': 0.35, 'bell': 0.5, 'fx': 0.35}
    dry = np.zeros((2, mix.n))
    send = np.zeros((2, mix.n))
    for name, st in mix.stems.items():
        if name == 'gtr':
            st = fft_filter(st, hp(80))
        dry += st * gains.get(name, 1)
        send += st * gains.get(name, 1) * verb.get(name, 0.2)
    wet = convolve(send, reverb_ir(2.8, 5000))
    out = dry + wet * 0.9
    # silences carve everything (with a short fade)
    tline = np.arange(mix.n) / SR
    g = np.ones(mix.n)
    for a, b in silences:
        g *= 1 - np.clip(np.minimum((tline - a) / 0.08, (b - tline) / 0.05), 0, 1)
    out *= g
    # fade out at the very end
    out *= np.clip((L + 1.5 - tline) / 2.5, 0, 1)
    out = out[:, : int((L + 0.5) * SR)]
    out = fft_filter(out, hp(28, 2))
    peak = np.percentile(np.abs(out), 99.95)
    out = np.tanh(out / peak * 1.1) * 0.92
    return out


def write_wav(path, x):
    y = (np.clip(x, -1, 1) * 32767).astype(np.int16).T.copy()
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(y.tobytes())


if __name__ == '__main__':
    cue = json.load(open(sys.argv[1]))
    write_wav(sys.argv[2], compose(cue))
    print('wrote', sys.argv[2])
