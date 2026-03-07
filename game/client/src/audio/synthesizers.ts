import type { SoundEffect } from "@/audio/SoundEffects";

function env(gain: GainNode, now: number, peak: number, dur: number): void {
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
}

function tone(
  ctx: AudioContext,
  master: GainNode,
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  start: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  osc.connect(gain);
  gain.connect(master);
  env(gain, start, volume, duration);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noiseBurst(ctx: AudioContext, master: GainNode, duration: number, start: number): void {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(300, start);
  const gain = ctx.createGain();
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  env(gain, start, 0.12, duration);
  source.start(start);
}

export function playSynthEffect(
  effect: SoundEffect,
  ctx: AudioContext,
  master: GainNode,
  now: number,
): void {
  switch (effect) {
    case "fleetLaunch": {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      osc.connect(gain);
      gain.connect(master);
      env(gain, now, 0.05, 0.11);
      osc.start(now);
      osc.stop(now + 0.12);
      return;
    }
    case "fleetArriveReinforce":
      tone(ctx, master, 600, 0.15, "sine", 0.08, now);
      return;
    case "fleetArriveCombat":
      noiseBurst(ctx, master, 0.05, now);
      return;
    case "planetCaptured":
      tone(ctx, master, 400, 0.08, "sine", 0.2, now);
      tone(ctx, master, 600, 0.12, "sine", 0.22, now + 0.11);
      return;
    case "planetLost":
      tone(ctx, master, 500, 0.08, "sine", 0.2, now);
      tone(ctx, master, 300, 0.12, "sine", 0.2, now + 0.11);
      return;
    case "victory":
      tone(ctx, master, 400, 0.1, "sine", 0.25, now);
      tone(ctx, master, 500, 0.1, "sine", 0.25, now + 0.15);
      tone(ctx, master, 700, 0.12, "sine", 0.25, now + 0.3);
      return;
    case "defeat":
      tone(ctx, master, 500, 0.12, "sine", 0.22, now);
      tone(ctx, master, 400, 0.12, "sine", 0.22, now + 0.14);
      tone(ctx, master, 250, 0.14, "sine", 0.22, now + 0.28);
      return;
    case "uiClick":
      tone(ctx, master, 1000, 0.03, "square", 0.04, now);
      return;
    case "uiHover":
      tone(ctx, master, 1200, 0.02, "square", 0.02, now);
      return;
    case "selectPlanet":
      tone(ctx, master, 500, 0.06, "sine", 0.03, now);
      return;
    default:
      return;
  }
}
