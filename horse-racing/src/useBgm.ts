import { useEffect, useRef, useState } from 'react';

const BPM = 148;
const B = 60 / BPM;

// Upbeat racing melody in G major [freq_hz, duration_beats] (0 = rest)
const MELODY: [number, number][] = [
  [392, 0.5], [440, 0.25], [494, 0.25],
  [523, 0.5], [494, 0.5],
  [440, 0.5], [392, 0.25], [440, 0.25],
  [494, 1.0],
  [392, 0.5], [523, 0.5],
  [587, 0.5], [523, 0.5],
  [494, 0.5], [440, 0.25], [392, 0.25],
  [440, 1.0],
  [659, 0.5], [587, 0.5],
  [523, 0.5], [587, 0.5],
  [659, 0.5], [523, 0.25], [494, 0.25],
  [523, 1.0],
  [494, 0.5], [440, 0.5],
  [392, 0.5], [440, 0.5],
  [494, 0.5], [440, 0.25], [392, 0.25],
  [392, 2.0],
];

const LOOP_DURATION = MELODY.reduce((s, [, d]) => s + d, 0) * B;

interface BgmState {
  ctx: AudioContext;
  gain: GainNode;
  rafId: number;
}

export function useBgm() {
  const [muted, setMuted] = useState(false);
  const ref = useRef<BgmState | null>(null);

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = 0.18;
    gain.connect(ctx.destination);

    function playNote(freq: number, start: number, dur: number) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(env);
      env.connect(gain);
      env.gain.setValueAtTime(0.5, start);
      env.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.88);
      osc.start(start);
      osc.stop(start + dur);
    }

    function scheduleLoop(t: number) {
      let time = t;
      for (const [freq, beats] of MELODY) {
        if (freq > 0) playNote(freq, time, beats * B * 0.9);
        time += beats * B;
      }
    }

    const AHEAD = 0.4;
    let nextLoop = ctx.currentTime + 0.05;
    scheduleLoop(nextLoop);
    nextLoop += LOOP_DURATION;

    function tick() {
      if (ref.current && ctx.currentTime + AHEAD >= nextLoop) {
        scheduleLoop(nextLoop);
        nextLoop += LOOP_DURATION;
      }
      if (ref.current) ref.current.rafId = requestAnimationFrame(tick);
    }

    const rafId = requestAnimationFrame(tick);
    ref.current = { ctx, gain, rafId };

    // Resume on first user interaction (needed for mobile Safari / Chrome autoplay policy)
    const resume = () => { if (ctx.state === 'suspended') ctx.resume(); };
    document.addEventListener('click', resume, { once: true });
    document.addEventListener('touchstart', resume, { once: true });

    return () => {
      cancelAnimationFrame(rafId);
      ctx.close();
      ref.current = null;
    };
  }, []);

  function toggle() {
    if (!ref.current) return;
    const { ctx, gain } = ref.current;
    if (ctx.state === 'suspended') ctx.resume();
    const newMuted = !muted;
    gain.gain.value = newMuted ? 0 : 0.18;
    setMuted(newMuted);
  }

  return { muted, toggle };
}
