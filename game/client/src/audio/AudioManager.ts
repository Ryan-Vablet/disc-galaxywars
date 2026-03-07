import type { SoundEffect } from "@/audio/SoundEffects";
import { playSynthEffect } from "@/audio/synthesizers";

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;
  private volume = 0.3;

  public init(): void {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => undefined);
      }
      return;
    }
    const Ctx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) {
      return;
    }
    this.ctx = new Ctx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);
  }

  public play(effect: SoundEffect): void {
    if (!this.enabled || !this.ctx || !this.masterGain) {
      return;
    }
    playSynthEffect(effect, this.ctx, this.masterGain, this.ctx.currentTime);
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  public setMuted(muted: boolean): void {
    this.enabled = !muted;
  }

  public toggleMute(): void {
    this.enabled = !this.enabled;
  }

  public destroy(): void {
    if (this.ctx) {
      this.ctx.close().catch(() => undefined);
    }
    this.ctx = null;
    this.masterGain = null;
  }
}
