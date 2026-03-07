import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioManager } from "@/audio/AudioManager";

class FakeAudioContext {
  public currentTime = 0;
  public destination = {};
  public state: AudioContextState = "running";
  public createGain() {
    return {
      gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
  }
  public createOscillator() {
    return {
      type: "sine",
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  public createBiquadFilter() {
    return { type: "lowpass", frequency: { setValueAtTime: vi.fn() }, connect: vi.fn() };
  }
  public createBuffer() {
    return { getChannelData: () => new Float32Array(8) };
  }
  public createBufferSource() {
    return { buffer: null, connect: vi.fn(), start: vi.fn() };
  }
  public resume() {
    return Promise.resolve();
  }
  public close() {
    return Promise.resolve();
  }
}

describe("AudioManager", () => {
  beforeEach(() => {
    (window as Window & { AudioContext: unknown }).AudioContext = FakeAudioContext as unknown;
  });

  it("does not throw when play is called before init", () => {
    const manager = new AudioManager();
    expect(() => manager.play("uiClick")).not.toThrow();
  });

  it("can initialize and toggle mute state", () => {
    const manager = new AudioManager();
    manager.init();
    manager.toggleMute();
    expect(() => manager.play("uiClick")).not.toThrow();
    manager.toggleMute();
    expect(() => manager.play("uiClick")).not.toThrow();
  });
});
