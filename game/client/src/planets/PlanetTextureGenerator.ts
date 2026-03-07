import type { GameState } from "@/types/game";
import { PlanetTextureCache } from "@/planets/PlanetTextureCache";

export class PlanetTextureGenerator {
  private readonly cache = new PlanetTextureCache();
  private readonly webglAvailable: boolean;

  public constructor() {
    this.webglAvailable = this.detectWebgl2();
  }

  public init(gameState: Readonly<GameState>): void {
    if (!this.webglAvailable) {
      this.cache.clear();
      return;
    }
    this.cache.generateAll(gameState.planets, gameState.planets.length * 31);
  }

  public update(timeMs: number): void {
    if (!this.webglAvailable) {
      return;
    }
    this.cache.update(timeMs);
  }

  public getCache(): PlanetTextureCache | null {
    return this.webglAvailable ? this.cache : null;
  }

  public clear(): void {
    this.cache.clear();
  }

  public destroy(): void {
    this.cache.clear();
  }

  private detectWebgl2(): boolean {
    try {
      const canvas = document.createElement("canvas");
      return !!canvas.getContext("webgl2");
    } catch {
      return false;
    }
  }
}
