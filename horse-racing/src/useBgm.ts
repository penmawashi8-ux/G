import { useEffect, useRef, useState } from 'react';
import { getAudioContext, ensureRunning } from './audioContext';

const BPM = 148;
const B = 60 / BPM;

// Upbeat racing melody in G major [freq_hz, duration_beats]
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

export function useBgm() {
  const [muted, setMuted] = useState(false);
  const gainRef = useRef<GainNode | null>(null);
  const mutedRef = useRef(false);
  const startedRef = useRef(false);
  const nextLoopRef = useRef(0);

  useEffect(() => {
    const ctx = getAudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0.18;
    gain.connect(ctx.destination);
    gainRef.current = gain;

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

    let rafId: number;

    function tick() {
      if (startedRef.current && ctx.state === 'running' && !mutedRef.current) {
        if (ctx.currentTime + 0.4 >= nextLoopRef.current) {
          scheduleLoop(nextLoopRef.current);
          nextLoopRef.current += LOOP_DURATION;
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    async function onInteraction() {
      if (startedRef.current) return;
      const ok = await ensureRunning();
      if (!ok) return;
      startedRef.current = true;
      // Schedule first loop starting just ahead of now
      nextLoopRef.current = ctx.currentTime + 0.05;
    }

    document.addEventListener('click', onInteraction);
    document.addEventListener('touchstart', onInteraction, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('click', onInteraction);
      document.removeEventListener('touchstart', onInteraction);
      gain.disconnect();
      gainRef.current = null;
    };
  }, []);

  function toggle() {
    const gain = gainRef.current;
    if (!gain) return;
    const newMuted = !mutedRef.current;
    mutedRef.current = newMuted;
    gain.gain.value = newMuted ? 0 : 0.18;
    setMuted(newMuted);
  }

  return { muted, toggle };
}
