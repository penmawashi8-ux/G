import { getAudioContext } from './audioContext';

type OscType = OscillatorType;

function play(fn: (ctx: AudioContext, t: number) => void) {
  try {
    const ctx = getAudioContext();
    if (ctx.state !== 'running') return;
    fn(ctx, ctx.currentTime);
  } catch {
    // ignore audio errors
  }
}

function note(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  vol = 0.3,
  type: OscType = 'triangle',
) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(env);
  env.connect(dest);
  env.gain.setValueAtTime(vol, start);
  env.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.start(start);
  osc.stop(start + dur + 0.01);
}

export const sounds = {
  /** Dice rolling noise burst */
  dice() {
    play((ctx, t) => {
      const len = Math.floor(ctx.sampleRate * 0.12);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.5;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0.6;
      src.connect(g);
      g.connect(ctx.destination);
      src.start(t);
    });
  },

  /** Card draw swish */
  card() {
    play((ctx, t) => {
      const len = Math.floor(ctx.sampleRate * 0.06);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.35;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 1;
      src.connect(g);
      g.connect(ctx.destination);
      src.start(t);
    });
  },

  /** Horse advances successfully – ascending arpeggio */
  advance() {
    play((ctx, t) => {
      const g = ctx.createGain();
      g.connect(ctx.destination);
      ([392, 494, 587, 784] as const).forEach((f, i) => {
        note(ctx, g, f, t + i * 0.07, 0.14, 0.25);
      });
    });
  },

  /** Action failed – short descending tone */
  fail() {
    play((ctx, t) => {
      const g = ctx.createGain();
      g.connect(ctx.destination);
      note(ctx, g, 220, t, 0.12, 0.2);
      note(ctx, g, 196, t + 0.1, 0.18, 0.18);
    });
  },

  /** Obstruct hit – sharp sawtooth impact */
  attack() {
    play((ctx, t) => {
      const g = ctx.createGain();
      g.connect(ctx.destination);
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);
      osc.connect(env);
      env.connect(g);
      env.gain.setValueAtTime(0.45, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  },

  /** Horse eliminated – sad descending melody */
  fall() {
    play((ctx, t) => {
      const g = ctx.createGain();
      g.connect(ctx.destination);
      ([494, 440, 392, 330] as const).forEach((f, i) => {
        note(ctx, g, f, t + i * 0.13, 0.2, 0.22);
      });
    });
  },

  /** Victory fanfare */
  win() {
    play((ctx, t) => {
      const g = ctx.createGain();
      g.connect(ctx.destination);
      const seq: [number, number][] = [
        [523, 0], [523, 0.1], [523, 0.2], [659, 0.32],
        [587, 0.46], [523, 0.6], [659, 0.76], [784, 0.9],
      ];
      seq.forEach(([f, dt]) => note(ctx, g, f, t + dt, 0.13, 0.32));
    });
  },
};
